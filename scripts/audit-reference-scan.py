#!/usr/bin/env python3
"""Locate direct case-file links in a historical qualification ledger.

Links are references, not qualification decisions. Missing links are not proof
that a case was never reviewed; ranges and references in other files are missed.
"""
import argparse
import importlib.util
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('candidate_source_scan', Path(__file__).with_name('candidate-source-scan.py'))
scanner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scanner)

LINK = re.compile(
    r'\]\((?:\.\./|https://github\.com/RichardHan/ai-agent-use-cases/blob/main/)'
    r'cases/([^#?\s)]+\.md)(?:#[^\s)]*)?\)'
)


def case_evidence(path):
    """Locate source candidates and declared evidence; never infer a verdict."""
    declarations = []
    for number, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        if re.match(r'^\s*[-*]\s*(?:來源證據|證據等級|證據類型|證據狀態)\s*[：:]', line):
            declarations.append({'line': number, 'text': line.strip()})
    return declarations


def scan(root):
    ledger = root / 'sources' / 'qualification-audit-2026-10-16.md'
    cases = sorted((root / 'cases').rglob('*.md'))
    if not cases:
        raise ValueError('cases/ has no Markdown files')
    references = defaultdict(list)
    for number, line in enumerate(ledger.read_text(encoding='utf-8').splitlines(), 1):
        for name in set(LINK.findall(line)):
            references[name].append(number)
    groups = defaultdict(list)
    records = []
    for case in cases:
        case_path = case.relative_to(root).as_posix()
        occurrences = []
        for line, url, key in scanner.urls_in(case):
            occurrences.append({'line': line, 'url': url})
            groups[key].append({'path': case_path, 'line': line, 'url': url})
        records.append({'path': case_path, 'ledger_lines': references.get(case.relative_to(root / 'cases').as_posix(), []),
                        'evidence_declarations': case_evidence(case), 'url_occurrences': occurrences})
    for case in cases:
        references.pop(case.relative_to(root / 'cases').as_posix(), None)
    shared = [{'normalized_url': key, 'occurrences': entries}
              for key, entries in sorted(groups.items())
              if len({entry['path'] for entry in entries}) > 1]
    keys_by_path = defaultdict(set)
    for group in shared:
        for entry in group['occurrences']:
            keys_by_path[entry['path']].add(group['normalized_url'])
    for record in records:
        record['shared_url_keys'] = sorted(keys_by_path[record['path']])
    linked = sum(bool(record['ledger_lines']) for record in records)
    return {'ledger': ledger.relative_to(root).as_posix(),
            'limitation': 'Direct ledger links and normalized URL overlaps only; not a review, source validity, duplicate check or qualification verdict. Different URLs can describe the same event.',
            'case_files': len(records), 'files_with_direct_links': linked,
            'files_without_direct_links': len(records) - linked,
            'unresolved_link_targets': dict(sorted(references.items())),
            'shared_url_groups': shared, 'cases': records}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    try:
        report = scan(args.root)
    except (OSError, UnicodeError, ValueError) as exc:
        parser.exit(1, f'Cannot scan: {exc}\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
