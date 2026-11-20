#!/usr/bin/env python3
"""Group source URL occurrences shared by case pages for human review.

Offline normalized URL triage only: shared URLs need not mean duplicate cases and
separate URLs can describe the same case. Do not use with private material.
"""
import argparse
import importlib.util
import json
import sys
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('candidate_source_scan', Path(__file__).with_name('candidate-source-scan.py'))
scanner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scanner)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    try:
        files = sorted((args.root / 'cases').rglob('*.md'))
        if not files:
            raise ValueError('cases/ has no Markdown files')
        groups = defaultdict(list)
        for path in files:
            for line, url, key in scanner.urls_in(path):
                groups[key].append({'path': path.relative_to(args.root).as_posix(), 'line': line, 'url': url})
        shared = [{'normalized_url': key, 'occurrences': entries}
                  for key, entries in sorted(groups.items())
                  if len({entry['path'] for entry in entries}) > 1]
        report = {'case_files': len(files), 'shared_url_groups': len(shared),
                  'limitation': 'Normalized URL overlap only; not a duplicate, source validity or qualification verdict. Different URLs can describe the same event.',
                  'groups': shared}
        print(json.dumps(report, ensure_ascii=False, indent=2))
    except (OSError, UnicodeError, ValueError) as exc:
        parser.exit(1, f'Cannot scan: {exc}\n')


if __name__ == '__main__':
    main()
