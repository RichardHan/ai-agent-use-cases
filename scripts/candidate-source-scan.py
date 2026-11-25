#!/usr/bin/env python3
"""Compare candidate URLs with URLs mentioned in the existing case corpus.

This is an offline triage aid, not a duplicate or evidence verdict.
Candidate filenames beginning with a numeric case ID are also compared.
"""
import argparse
import json
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import unquote_plus, urlsplit, urlunsplit

URL = re.compile(r'https?://(?:[^\s<>\]\[()"\'，。；、]|\([^\s<>\]\[()"\'，。；、]*\))+')
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
    yield from urls_in_text(path.read_text(encoding='utf-8'), path.name)


def urls_in_text(markdown, name):
    for number, line in enumerate(markdown.splitlines(), 1):
        for match in URL.finditer(line):
            # An unmatched closer followed by URL text, or a nested opener, may
            # be part of the URL. Do not report the truncated prefix as a match.
            tail = line[match.end():]
            markdown_link = line[:match.start()].endswith('](')
            continuation = r"\)+(?:[A-Za-z0-9/_%#?&=+~@!$'*+-]|[.:;,](?=[A-Za-z0-9/_%#?&=+~@!$'*+-]))"
            if tail.startswith('(') or (not markdown_link and re.match(continuation, tail)):
                raise ValueError(f'ambiguous URL parentheses at {name}:{number}; inspect manually')
            raw = match.group().rstrip('.,;:!?')
            key = canonical(raw)
            if key:
                yield number, raw, key


def scan(root, candidates):
    candidates = list(dict.fromkeys(path.resolve() for path in candidates))
    index = defaultdict(list)
    files = sorted(p for folder in ('cases', 'evidence') for p in (root / folder).rglob('*.md'))
    for path in files:
        for line, raw, key in urls_in(path):
            index[key].append({'path': path.relative_to(root).as_posix(), 'line': line, 'url': raw})
    candidate_index = defaultdict(list)
    ids = defaultdict(list)
    for path in [p for p in files if p.is_relative_to(root / 'cases')] + candidates:
        match = re.match(r'^(\d+)-', path.name)
        if match:
            ids[int(match.group(1))].append(str(path.resolve()))
    results = []
    for path in candidates:
        for line, raw, key in urls_in(path):
            entry = {'candidate': str(path.resolve()), 'line': line, 'url': raw,
                     'matches': index.get(key, [])}
            results.append(entry)
            candidate_index[key].append(entry)
    groups = [{'occurrences': [{'path': entry['candidate'], 'line': entry['line'], 'url': entry['url']}
                               for entry in entries]}
              for entries in candidate_index.values()
              if len({entry['candidate'] for entry in entries}) > 1]
    return {'corpus_files_scanned': len(files), 'candidate_url_occurrences': len(results),
            'matched_occurrences': sum(bool(r['matches']) for r in results),
            'candidate_url_groups': groups,
            'case_id_collisions': [{'id': number, 'paths': sorted(set(paths))}
                                   for number, paths in sorted(ids.items())
                                   if len(set(paths)) > 1],
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
    except (OSError, UnicodeError, ValueError) as exc:
        parser.exit(1, f'Cannot read input: {exc}\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
