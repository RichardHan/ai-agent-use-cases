#!/usr/bin/env bash
# Install the pinned Playwright package, its browsers, and fonts-noto-cjk.
#
# apt-get prints "Get:" when a download starts and nothing until it finishes.
# Reader search QA 44434645064 sat on fonts-noto-cjk (61.2 MB) from 01:29:31
# until the 30-minute job cancelled it at 01:39:05. That log cannot show
# whether any bytes arrived. The same push's source-guide job fetched the
# package in 3 seconds; --with-deps on that job took about 22 minutes for
# 126 MB and did finish. This script records the apt cache size. No growth
# for STALL_SECONDS is a stall: that attempt is stopped and retried. A growing download is allowed to finish; the workflow job timeout
# remains the upper bound. The stall watchdog still retries a truly stalled
# download rather than discarding useful partial progress.
set -euo pipefail

STALL_SECONDS=${INSTALL_STALL_SECONDS:-180}
FONT_ATTEMPTS=${INSTALL_FONT_ATTEMPTS:-3}
POLL_SECONDS=${INSTALL_POLL_SECONDS:-15}

prefix=${1:?usage: install-browser-tools.sh PREFIX browser [browser...]}
shift
if [ "$#" -lt 1 ]; then
  echo "usage: install-browser-tools.sh PREFIX browser [browser...]" >&2
  exit 2
fi

echo "browser-install start $(date -u +%Y-%m-%dT%H:%M:%SZ) browsers: $*"
npm install --prefix "$prefix" playwright@1.64.1 @axe-core/playwright@4.10.2
echo "playwright install --with-deps start $(date -u +%Y-%m-%dT%H:%M:%SZ)"
"$prefix/node_modules/.bin/playwright" install --with-deps "$@"
echo "playwright install --with-deps done $(date -u +%Y-%m-%dT%H:%M:%SZ)"

cache_bytes() {
  local bytes
  bytes=$(sudo du -sb /var/cache/apt/archives /var/cache/apt/archives/partial 2>/dev/null | awk '{sum += $1} END {print sum + 0}' || true)
  printf '%s\n' "${bytes:-0}"
}

apt_read_bytes() {
  local child io
  child=$(ps -o pid= --ppid "$1" 2>/dev/null | awk 'NR==1 {print $1}')
  if [ -z "$child" ]; then
    printf '0\n'
    return
  fi
  io=$(sudo awk '/^read_bytes:/ {print $2}' "/proc/${child}/io" 2>/dev/null || true)
  printf '%s\n' "${io:-0}"
}

stop_install() {
  local pid=$1
  sudo pkill -TERM -P "$pid" 2>/dev/null || true
  sudo kill -TERM "$pid" 2>/dev/null || true
  sleep 1
  if kill -0 "$pid" 2>/dev/null; then
    sudo kill -KILL "$pid" 2>/dev/null || true
  fi
  wait "$pid" 2>/dev/null || true
}

install_cjk_fonts() {
  local attempt pid elapsed stagnant size last status code cache io
  for attempt in $(seq 1 "$FONT_ATTEMPTS"); do
    echo "fonts-noto-cjk attempt ${attempt}/${FONT_ATTEMPTS} $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -o Acquire::Retries=3 fonts-noto-cjk &
    pid=$!
    elapsed=0
    stagnant=0
    last=0
    status=running
    while kill -0 "$pid" 2>/dev/null; do
      sleep "$POLL_SECONDS"
      if ! kill -0 "$pid" 2>/dev/null; then
        break
      fi
      elapsed=$((elapsed + POLL_SECONDS))
      cache=$(cache_bytes)
      io=$(apt_read_bytes "$pid")
      size=$((cache + io))
      if [ "$size" -gt "$last" ]; then
        stagnant=0
        last=$size
      else
        stagnant=$((stagnant + POLL_SECONDS))
      fi
      echo "fonts-noto-cjk attempt ${attempt}: cache ${cache} bytes, apt-read ${io} bytes, stagnant ${stagnant}s, elapsed ${elapsed}s"
      if [ "$stagnant" -ge "$STALL_SECONDS" ]; then
        echo "fonts-noto-cjk stalled: apt cache and read bytes did not grow for ${STALL_SECONDS}s"
        sudo ls -l /var/cache/apt/archives/partial 2>/dev/null || true
        status=stalled
        stop_install "$pid"
        sudo apt-get clean || true
        break
      fi
    done
    if [ "$status" = stalled ]; then
      continue
    fi
    set +e
    wait "$pid"
    code=$?
    set -e
    if [ "$code" -eq 0 ]; then
      echo "fonts-noto-cjk installed on attempt ${attempt}"
      return 0
    fi
    echo "fonts-noto-cjk attempt ${attempt} exited ${code}"
    sudo apt-get clean || true
  done
  echo "fonts-noto-cjk failed after ${FONT_ATTEMPTS} attempts" >&2
  return 1
}

install_cjk_fonts
echo "browser-install done $(date -u +%Y-%m-%dT%H:%M:%SZ)"
