'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('os');
const path = require('path');
const { spawn } = require('node:child_process');

const root = path.join(__dirname, '..');
const scriptPath = path.join(root, 'scripts/install-browser-tools.sh');
const script = fs.readFileSync(scriptPath, 'utf8');
const reader = fs.readFileSync(path.join(root, '.github/workflows/reader-search-qa.yml'), 'utf8');
const guide = fs.readFileSync(path.join(root, '.github/workflows/source-guide-qa.yml'), 'utf8');

function defaultConstant(name, envName) {
  const match = script.match(new RegExp('^' + name + '=\\$\\{' + envName + ':-(\\d+)\\}$', 'm'));
  assert.ok(match, name + ' must keep its production default');
  return Number(match[1]);
}

function jobTimeout(yaml, jobName) {
  const block = yaml.split(new RegExp('\\n  ' + jobName + ':'))[1];
  assert.ok(block, jobName + ' job missing');
  const minutes = block.match(/timeout-minutes:\s*(\d+)/);
  assert.ok(minutes, jobName + ' must keep a finite timeout-minutes');
  return Number(minutes[1]);
}

function writeExe(file, body) {
  fs.writeFileSync(file, body);
  fs.chmodSync(file, 0o755);
}

function runInstaller(browsers, env) {
  return new Promise((resolve) => {
    const child = spawn('bash', [scriptPath, env.PREFIX, ...browsers], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ code: 124, stdout, stderr: stderr + '\nTEST_TIMEOUT' });
    }, 15000);
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('close', code => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'browser-install-'));
  const bin = path.join(dir, 'bin');
  const prefix = path.join(dir, 'tools');
  const playwrightBin = path.join(prefix, 'node_modules', '.bin');
  fs.mkdirSync(bin, { recursive: true });
  fs.mkdirSync(playwrightBin, { recursive: true });
  const sudoLog = path.join(dir, 'sudo.log');
  const playwrightLog = path.join(dir, 'playwright.log');
  const cacheFile = path.join(dir, 'cache-bytes');
  fs.writeFileSync(cacheFile, '5\n');
  writeExe(path.join(bin, 'npm'), '#!/bin/bash\nexit 0\n');
  writeExe(path.join(bin, 'sudo'), `#!/bin/bash
echo "$*" >> "$FAKE_SUDO_LOG"
if [[ "$1" == *=* ]]; then
  shift
fi
if [[ "$1" == du ]]; then
  cat "$FAKE_CACHE_FILE"
  exit 0
fi
if [[ "$1" == awk || "$1" == ls ]]; then
  printf '0\\n'
  exit 0
fi
if [[ "$1" == apt-get && "$2" == clean ]]; then
  exit 0
fi
if [[ "$1" == kill || "$1" == pkill ]]; then
  target="\${@: -1}"
  if [[ "$target" =~ ^[0-9]+$ ]]; then
    kill -TERM "$target" 2>/dev/null || true
  fi
  exit 0
fi
if [[ "$1" == apt-get && "$2" == install ]]; then
  echo apt-install-start >> "$FAKE_SUDO_LOG"
  n=$(grep -c apt-install-start "$FAKE_SUDO_LOG")
  if [[ "$FAKE_APT_MODE" == grow ]]; then
    for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
      printf '%s\\n' $((i * 1000)) > "$FAKE_CACHE_FILE"
      sleep 0.3
    done
    exit 0
  fi
  if [[ "$FAKE_APT_MODE" == succeed-on-2 && "$n" -ge 2 ]]; then
    exit 0
  fi
  exec sleep 30
fi
echo "unexpected sudo: $*" >> "$FAKE_SUDO_LOG"
exit 1
`);
  writeExe(path.join(playwrightBin, 'playwright'), `#!/bin/bash
echo "$*" >> "$PLAYWRIGHT_LOG"
exit 0
`);
  return {
    dir,
    env: {
      PATH: bin + path.delimiter + process.env.PATH,
      PREFIX: prefix,
      FAKE_SUDO_LOG: sudoLog,
      FAKE_CACHE_FILE: cacheFile,
      PLAYWRIGHT_LOG: playwrightLog,
      INSTALL_STALL_SECONDS: '2',
      INSTALL_POLL_SECONDS: '1',
      INSTALL_ATTEMPT_SECONDS: '8',
      INSTALL_FONT_ATTEMPTS: '2'
    },
    playwrightLog,
    sudoLog
  };
}

test('production defaults still bound the stall, and preview jobs can finish', () => {
  const stall = defaultConstant('STALL_SECONDS', 'INSTALL_STALL_SECONDS');
  const attempt = defaultConstant('ATTEMPT_SECONDS', 'INSTALL_ATTEMPT_SECONDS');
  const attempts = defaultConstant('FONT_ATTEMPTS', 'INSTALL_FONT_ATTEMPTS');
  assert.equal(stall, 180);
  assert.equal(attempt, 900);
  assert.equal(attempts, 3);
  assert.ok(stall > 121 && stall < 574);
  assert.ok(attempt >= 11 * 60 && attempt <= 15 * 60);
  const withDepsSeconds = 22 * 60;
  const fontWorstSeconds = attempt + (attempts - 1) * stall;
  const readerMinutes = jobTimeout(reader, 'reader-search');
  const previewMinutes = jobTimeout(guide, 'preview');
  const publishedMinutes = jobTimeout(guide, 'published');
  assert.ok(readerMinutes * 60 >= withDepsSeconds + fontWorstSeconds + 5 * 60);
  assert.ok(previewMinutes * 60 >= withDepsSeconds + fontWorstSeconds + 9 * 60);
  assert.ok(readerMinutes <= 70 && previewMinutes <= 70);
  assert.equal(publishedMinutes, 80);
  assert.ok(previewMinutes < publishedMinutes);
  assert.doesNotMatch(reader, /INSTALL_STALL_SECONDS|sudo apt-get install -y fonts-noto-cjk/);
  assert.doesNotMatch(guide, /INSTALL_STALL_SECONDS|sudo apt-get install -y fonts-noto-cjk/);
  assert.match(reader, /READER_SEARCH_ENGINES: all/);
});

test('a no-growth font install is killed and retried, and browser args are forwarded', async () => {
  const fix = fixture();
  try {
    const result = await runInstaller(['chromium', 'firefox', 'webkit'], {
      ...fix.env,
      FAKE_APT_MODE: 'succeed-on-2'
    });
    assert.equal(result.code, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /fonts-noto-cjk stalled/);
    assert.match(result.stdout, /fonts-noto-cjk installed on attempt 2/);
    assert.doesNotMatch(result.stdout, /not retrying a partial download/);
    const forwarded = fs.readFileSync(fix.playwrightLog, 'utf8');
    assert.match(forwarded, /^install --with-deps chromium firefox webkit$/m);
    assert.doesNotMatch(forwarded, /fonts-noto/);
  } finally {
    fs.rmSync(fix.dir, { recursive: true, force: true });
  }
});

test('a growing font download is not treated as a stall', async () => {
  const fix = fixture();
  try {
    const result = await runInstaller(['chromium'], {
      ...fix.env,
      FAKE_APT_MODE: 'grow',
      INSTALL_FONT_ATTEMPTS: '1'
    });
    assert.equal(result.code, 0, result.stdout + result.stderr);
    assert.doesNotMatch(result.stdout, /fonts-noto-cjk stalled/);
    assert.match(result.stdout, /fonts-noto-cjk installed on attempt 1/);
    assert.match(fs.readFileSync(fix.playwrightLog, 'utf8'), /^install --with-deps chromium$/m);
  } finally {
    fs.rmSync(fix.dir, { recursive: true, force: true });
  }
});

test('a download still growing at the attempt cap fails instead of discarding bytes', async () => {
  const fix = fixture();
  try {
    const result = await runInstaller(['webkit'], {
      ...fix.env,
      FAKE_APT_MODE: 'grow',
      INSTALL_ATTEMPT_SECONDS: '2',
      INSTALL_FONT_ATTEMPTS: '3'
    });
    assert.equal(result.code, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /not retrying a partial download/);
    assert.doesNotMatch(result.stdout, /attempt 2\/3/);
    const starts = fs.readFileSync(fix.sudoLog, 'utf8').split('\n').filter(line => line === 'apt-install-start');
    assert.equal(starts.length, 1);
  } finally {
    fs.rmSync(fix.dir, { recursive: true, force: true });
  }
});

test('missing browser arguments fail before npm', async () => {
  const result = await runInstaller([], {
    PATH: process.env.PATH,
    PREFIX: os.tmpdir()
  });
  assert.equal(result.code, 2);
  assert.match(result.stderr, /usage:/);
});
