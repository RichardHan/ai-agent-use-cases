#!/usr/bin/env python3
"""Create a local preview, mirroring catalog.json's Jekyll file selection."""
import datetime
import json
import pathlib
import shutil
import sys
root = pathlib.Path(__file__).resolve().parents[1]
dest = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/ai-usecase-preview').resolve()
if dest == root or root.is_relative_to(dest):
    raise SystemExit('Choose a separate output directory.')
shutil.copytree(root, dest, dirs_exist_ok=True, ignore=shutil.ignore_patterns('.git', 'node_modules', '_site', 'tests'))
files = sorted(str(p.relative_to(root)) for folder in ('cases', 'evidence') for p in (root/folder).rglob('*.md'))
if (root/'sources/pending.md').exists():
    files.append('sources/pending.md')
(dest/'catalog.json').write_text(json.dumps({'builtAt': str(datetime.date.today()), 'files': files}, ensure_ascii=False), encoding='utf-8')
print(dest)
