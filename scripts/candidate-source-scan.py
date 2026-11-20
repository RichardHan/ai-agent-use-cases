#!/usr/bin/env python3
"""Compare candidate URLs with URLs mentioned in the existing case corpus.

This is an offline triage aid, not a duplicate or evidence verdict.
"""
import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import unquote_plus, urlsplit, urlunsplit

URL = re.compile(r'https?://[^\s<>\]\[()"\'，。；、]+')
TRACKING = {'fbclid', 'gclid', 'mc_cid', 'mc_eid'}


def canonical(url):
    try:
        parts = urlsplit(url.rstrip('.,;:!?'))
        host = (parts.hostname or '').lower()
        if not host or parts.username or parts.password:
            return None
        port = parts.port
        if host in {'twitter.com', 'www.twitter.com', 'www.x.com', 'mobile.twitter.com'}:
            host = 'x.com'
        if port and not ((parts.scheme == 'https' and port == 443) or (parts.scheme == 'http' and port == 80)):
            host += f':{port}'
        query = [part for part in parts.query.split('&')
                 if not (unquote_plus(part.split('=', 1)[0]).lower().startswith('utm_') or
                         unquote_plus(part.split('=', 1)[0]).lower() in TRACKING)]
        # Preserve scheme, path and raw query encoding/order: these can be significant.
        return urlunsplit((parts.scheme.lower(), host, parts.path, '&'.join(query), ''))
    except ValueError:
        return None


def urls_in(path):
    for number, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        for match in URL.finditer(line):
            raw = match.group().rstrip('.,;:!?')
            key = canonical(raw)
            if key:
                yield number, raw, key


def scan(root, candidates):
    index = defaultdict(list)
    files = sorted(p for folder in ('cases', 'evidence') for p in (root / folder).rglob('*.md'))
    for path in files:
        for line, raw, key in urls_in(path):
            index[key].append({'path': path.relative_to(root).as_posix(), 'line': line, 'url': raw})
    results = []
    for path in candidates:
        for line, raw, key in urls_in(path):
            results.append({'candidate': str(path), 'line': line, 'url': raw,
                            'matches': index.get(key, [])})
    return {'corpus_files_scanned': len(files), 'candidate_url_occurrences': len(results),
            'matched_occurrences': sum(bool(r['matches']) for r in results),
            'results': results}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('candidate', nargs='+', type=Path, help='UTF-8 files containing public candidate URLs')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent,
                        help='repository root (default: script parent repository)')
    args = parser.parse_args()
    if not (args.root / 'cases').is_dir() or not (args.root / 'evidence').is_dir():
        parser.error('root must contain cases/ and evidence/')
    try:
        report = scan(args.root, args.candidate)
    except (OSError, UnicodeError) as exc:
        parser.exit(1, f'Cannot read input: {exc}\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
