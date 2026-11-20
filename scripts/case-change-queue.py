#!/usr/bin/env python3
"""List committed case-file changes between two explicitly selected Git commits.

This is a review queue, not a qualification or duplicate verdict. A historical
commit is not proof that every case at that commit was reviewed.
"""
import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def git(root, *args):
    return subprocess.run(['git', '-C', str(root), *args], check=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout


def commit(root, revision):
    return git(root, 'rev-parse', '--verify', '--end-of-options',
               revision + '^{commit}').decode('ascii').strip()


def scan(root, base, target):
    base, target = commit(root, base), commit(root, target)
    # Disallow unrelated histories and reversed ranges rather than implying an
    # incremental audit where none exists.
    git(root, 'merge-base', '--is-ancestor', base, target)
    raw = git(root, 'diff', '--raw', '-z', '--no-renames', '--no-abbrev', '--no-ext-diff',
              base, target, '--', 'cases/')
    fields = raw.split(b'\0')
    records = []
    for i in range(0, len(fields) - 1, 2):
        header = fields[i].decode('ascii')
        path = fields[i + 1].decode('utf-8')
        if not path.startswith('cases/') or path.count('/') != 1 or not path.endswith('.md'):
            continue
        old_mode, new_mode, old_blob, new_blob, status = header[1:].split()
        records.append({'path': path, 'status': status,
                        'before': None if old_mode == '000000' else {'mode': old_mode, 'blob': old_blob},
                        'after': None if new_mode == '000000' else {'mode': new_mode, 'blob': new_blob}})
    counts = {status: sum(r['status'] == status for r in records)
              for status in sorted({r['status'] for r in records})}
    return {'base': base, 'target': target,
            'scope': 'Committed top-level cases/*.md only; renames are deletion plus addition.',
            'limitation': 'Net changes only; not review decisions, qualification counts, duplicate detection, or proof of complete audit coverage. Working-tree changes excluded.',
            'counts': counts, 'cases': records}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base', help='Explicit ancestor commit; not assumed to be an audit')
    parser.add_argument('target', nargs='?', default='HEAD', help='Target commit (default HEAD)')
    parser.add_argument('--root', type=Path, default=ROOT, help='Repository to scan')
    args = parser.parse_args()
    try:
        report = scan(args.root, args.base, args.target)
    except (OSError, UnicodeError, ValueError, subprocess.CalledProcessError) as exc:
        parser.exit(1, f'Cannot build case change queue: {exc}\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
