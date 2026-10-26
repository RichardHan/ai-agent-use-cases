#!/usr/bin/env python3
"""Create a local preview, mirroring catalog.json's Jekyll file selection."""
import datetime
import json
import pathlib
import shutil
import subprocess
import sys
root = pathlib.Path(__file__).resolve().parents[1]
dest = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/ai-usecase-preview').resolve()
if dest == root or root.is_relative_to(dest):
    raise SystemExit('Choose a separate output directory.')
shutil.copytree(root, dest, dirs_exist_ok=True, ignore=shutil.ignore_patterns('.git', 'node_modules', '_site', 'tests'))
files = sorted(str(p.relative_to(root)) for folder in ('cases', 'evidence') for p in (root/folder).rglob('*.md'))
if (root/'sources/pending.md').exists():
    files.append('sources/pending.md')
revision = 'preview-' + __import__('hashlib').sha256(b''.join(path.encode() + b'\0' + (root/path).read_bytes() for path in files)).hexdigest()
tracked_result = subprocess.run(['git', 'ls-files', '--', 'cases', 'evidence', 'sources/pending.md'], cwd=root, capture_output=True, text=True)
tracked = tracked_result.stdout.splitlines() if tracked_result.returncode == 0 else []
clean_sources = bool(tracked) and set(tracked) == set(files) and subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--', 'cases', 'evidence', 'sources/pending.md'], cwd=root, capture_output=True).returncode == 0
source_revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip() if clean_sources else ''
(dest/'catalog.json').write_text(json.dumps({'builtAt': str(datetime.date.today()), 'bundleRevision': revision, 'sourceRevision': source_revision, 'files': files}, ensure_ascii=False), encoding='utf-8')
(dest/'corpus.json').write_text(json.dumps({'version': 1, 'revision': revision, 'sourceRevision': source_revision, 'sources': [{'path': path, 'markdown': (root/path).read_bytes().decode('utf-8')} for path in files]}, ensure_ascii=False), encoding='utf-8')
print(dest)

# Mirror only the Liquid section extraction; the browser validates its contents.
audit = (root/"sources/qualification-audit-2026-10-16.md").read_text(encoding="utf-8")
batches = audit.split("\n## ")
(dest/"audit-summary.json").write_text(json.dumps({"latestBatch": batches[1] if len(batches) > 1 else None}, ensure_ascii=False), encoding="utf-8")
