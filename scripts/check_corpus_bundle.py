#!/usr/bin/env python3
"""Verify the actual Jekyll transport against unmodified source bytes."""
import json
import pathlib
import sys
root = pathlib.Path(__file__).resolve().parents[1]
built = pathlib.Path(sys.argv[1])
catalog = json.loads((built/'catalog.json').read_bytes())
bundle = json.loads((built/'corpus.json').read_bytes())
assert bundle['version'] == 1
assert bundle['revision'] == catalog['bundleRevision'] and bundle['revision']
expected = {str(path.relative_to(root)) for folder in ('cases', 'evidence') for path in (root/folder).rglob('*.md')}
if (root/'sources/pending.md').exists():
    expected.add('sources/pending.md')
assert set(catalog['files']) == expected, 'Catalog must include the complete current source set'
assert len(expected) == len(catalog['files'])
assert len(bundle['sources']) == len(expected)
seen = set()
for source in bundle['sources']:
    path = source['path']
    assert path in expected and path not in seen, path
    seen.add(path)
    original = (root/path).read_bytes()
    assert source['markdown'].encode('utf-8') == original, f'Bundle altered original bytes: {path}. Liquid examples need a raw transport; do not rewrite research.'
assert seen == expected
print(f'PASS: {len(seen)} sources byte-for-byte identical; revision {bundle["revision"]}')
