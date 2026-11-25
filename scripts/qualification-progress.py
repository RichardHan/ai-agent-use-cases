#!/usr/bin/env python3
"""Summarize explicit, version-bound qualification decisions for public cases."""
import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from runpy import run_path

SOURCE_SCAN = run_path(str(Path(__file__).with_name('candidate-source-scan.py')))
DECISIONS = {'qualified', 'excluded', 'pending'}
SOURCE_TYPES = {'official', 'author_report', 'original_research', 'independent_test'}
SHA256 = re.compile(r'[a-f0-9]{64}')
AUDIT_CASE_LINK = re.compile(r'\]\(\.\./(cases/[^)#?\s]+\.md)\)')


def read_public_file(root, path):
    if not path.resolve().is_relative_to(root):
        raise ValueError(f'{path.name}: file resolves outside the repository')
    return path.read_bytes()


def load_decisions(root):
    decisions = {}
    audits = {}
    for batch in sorted((root / 'docs' / 'qualification').glob('*.json')):
        location = batch.relative_to(root).as_posix()
        data = json.loads(read_public_file(root, batch))
        if not isinstance(data, dict) or not isinstance(data.get('decisions'), list):
            raise ValueError(f'{location}: expected a decisions list')
        audit = data.get('audit')
        audit_digest = data.get('audit_sha256')
        if (not isinstance(audit, str) or not re.fullmatch(r'sources/[\w-]+\.md', audit)
                or not isinstance(audit_digest, str) or not SHA256.fullmatch(audit_digest)):
            raise ValueError(f'{location}: expected a sources/ audit note and SHA-256')
        if audit not in audits:
            note = root / audit
            content = read_public_file(root, note) if note.is_file() else None
            audits[audit] = ((hashlib.sha256(content).hexdigest(),
                              set(AUDIT_CASE_LINK.findall(content.decode('utf-8'))))
                             if content is not None else (None, set()))
        for row in data['decisions']:
            if not isinstance(row, dict):
                raise ValueError(f'{location}: each decision must be an object')
            case_id = row.get('id')
            if not isinstance(case_id, str) or not re.fullmatch(r'UC-(?:[0-9]{3}|[1-9][0-9]{3,})', case_id):
                raise ValueError(f'{location}: invalid case ID')
            if case_id in decisions:
                raise ValueError(f'{location}: duplicate decision for {case_id}')
            state = row.get('decision')
            digest = row.get('sha256')
            reason = row.get('reason')
            if (not isinstance(state, str) or state not in DECISIONS
                    or not isinstance(digest, str) or not SHA256.fullmatch(digest)
                    or not isinstance(reason, str) or not reason.strip()):
                raise ValueError(f'{location}: {case_id} needs a valid decision, SHA-256 and reason')
            entry = dict(decision=state, sha256=digest, reason=reason,
                         audit=audit, audit_sha256=audit_digest, batch=location)
            if state == 'qualified':
                source = row.get('primary_source')
                source_type = row.get('source_type')
                source_line = row.get('source_line')
                if (not isinstance(source_type, str) or source_type not in SOURCE_TYPES
                        or type(source_line) is not int or source_line < 1 or not isinstance(source, str)
                        or not SOURCE_SCAN['URL'].fullmatch(source) or not SOURCE_SCAN['canonical'](source)):
                    raise ValueError(f'{location}: {case_id} needs a valid primary source, source type and line')
                entry.update(primary_source=source, source_type=source_type, source_line=source_line)
            decisions[case_id] = entry
    if not decisions:
        raise ValueError('no decisions found in docs/qualification/')
    return decisions, audits


def verify_case(case_id, path, markdown, entry):
    heading = re.search(r'^#[ \t]+(.+)$', markdown, re.MULTILINE)
    heading_id = re.search(r'UC-[0-9]+', heading[1]) if heading else None
    if not heading_id or heading_id[0] != case_id:
        raise ValueError(f'{case_id}: case title and filename IDs must match')
    if entry['decision'] == 'qualified':
        for line, url, key in SOURCE_SCAN['urls_in_text'](markdown, path.name):
            if line == entry['source_line'] and url == entry['primary_source']:
                return key
        raise ValueError(f'{case_id}: primary source is absent from the specified case line')
    return None


def scan(root):
    root = root.resolve()
    decisions, audits = load_decisions(root)
    cases = {}
    for path in sorted((root / 'cases').rglob('*.md')):
        number = re.match(r'^([0-9]+)-', path.name)
        if not number:
            raise ValueError(f'{path.name}: case filename must begin with a numeric ID')
        case_id = f'UC-{int(number[1]):03d}'
        if case_id in cases:
            raise ValueError(f'duplicate case ID {case_id}: {cases[case_id].name}, {path.name}')
        cases[case_id] = path
    if not cases:
        raise ValueError('cases/ has no Markdown files')

    counts = Counter(dict.fromkeys(sorted(DECISIONS | {'untracked', 'stale', 'missing'}), 0))
    source_ids = {}
    records = []
    for case_id in sorted(cases.keys() | decisions.keys(), key=lambda value: int(value[3:])):
        path = cases.get(case_id)
        entry = decisions.get(case_id)
        record = dict(entry or {}, id=case_id, path=path.relative_to(root).as_posix() if path else None)
        if path is None:
            status = 'missing'
        elif entry is None:
            status = 'untracked'
        else:
            markdown = read_public_file(root, path)
            audit_digest, audit_links = audits[entry['audit']]
            if hashlib.sha256(markdown).hexdigest() != entry['sha256']:
                status = 'stale'
                record['stale_reason'] = 'case_changed'
            elif audit_digest != entry['audit_sha256']:
                status = 'stale'
                record['stale_reason'] = 'audit_changed' if audit_digest else 'audit_missing'
            else:
                if record['path'] not in audit_links:
                    raise ValueError(f'{case_id}: audit note needs a direct Markdown link to the case')
                status = entry['decision']
                key = verify_case(case_id, path, markdown.decode('utf-8'), entry)
                if key:
                    if key in source_ids:
                        raise ValueError(f'{case_id} and {source_ids[key]} share a qualified primary source')
                    source_ids[key] = case_id
        counts[status] += 1
        records.append(dict(record, status=status))
    return {
        'case_files': len(cases),
        'counts': dict(counts),
        'scope': 'Explicit decisions in the incremental ledger only. Untracked does not mean unreviewed. '
                 'Do not add this subtotal to historical counts; this report does not validate sources online '
                 'or establish a current corpus-wide qualified total.',
        'cases': records,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    try:
        report = scan(args.root)
    except (OSError, ValueError) as error:
        parser.exit(1, f'Cannot report qualification progress: {error}\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
