#!/usr/bin/env python3
"""Locate direct case-file links in a historical qualification ledger.

Links are references, not qualification decisions. Missing links are not proof
that a case was never reviewed; ranges and references in other files are missed.
"""
import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

LINK = re.compile(
    r'\]\((?:\.\./|https://github\.com/RichardHan/ai-agent-use-cases/blob/main/)'
    r'cases/([^/#?\s)]+\.md)(?:#[^\s)]*)?\)'
)
URL = re.compile(r'https?://(?:[^\s<>\]\[()"\'，。；、]|\([^\s<>\]\[()"\'，。；、]*\))+')


def case_evidence(path):
    """Locate source candidates and declared evidence; never infer a verdict."""
    urls = []
    declarations = []
    for number, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        if re.match(r'^\s*[-*]\s*(?:來源證據|證據等級|證據類型|證據狀態)\s*[：:]', line):
            declarations.append({'line': number, 'text': line.strip()})
        for match in URL.finditer(line):
            urls.append({'line': number, 'url': match.group().rstrip('.,;:!?')})
    return {'evidence_declarations': declarations, 'url_occurrences': urls}


def scan(root):
    ledger = root / 'sources' / 'qualification-audit-2026-10-16.md'
    cases = sorted((root / 'cases').glob('*.md'))
    if not cases:
        raise ValueError('cases/ has no Markdown files')
    references = defaultdict(list)
    for number, line in enumerate(ledger.read_text(encoding='utf-8').splitlines(), 1):
        for name in set(LINK.findall(line)):
            references[name].append(number)
    records = [{'path': f'cases/{case.name}', 'ledger_lines': references.pop(case.name, []),
                **case_evidence(case)} for case in cases]
    linked = sum(bool(record['ledger_lines']) for record in records)
    return {'ledger': ledger.relative_to(root).as_posix(),
            'limitation': 'Direct ledger links and literal URL/declaration occurrences only; not a review, source classification, duplicate check or qualification verdict.',
            'case_files': len(records), 'files_with_direct_links': linked,
            'files_without_direct_links': len(records) - linked,
            'unresolved_link_targets': dict(sorted(references.items())), 'cases': records}


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
