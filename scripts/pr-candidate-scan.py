#!/usr/bin/env python3
"""Scan public PR case files at recorded heads; not an evidence verdict.

All-open mode makes multiple API requests per PR and file, and fails as a whole
if quota or snapshots prevent completion. Explicit PR numbers allow smaller
batches, but separate batches are not a single consistent snapshot.
"""
import argparse
import base64
import importlib.util
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path, PurePosixPath

REPO = 'RichardHan/ai-agent-use-cases'
SPEC = importlib.util.spec_from_file_location('candidate_scan', Path(__file__).with_name('candidate-source-scan.py'))
scan = importlib.util.module_from_spec(SPEC)
sys.dont_write_bytecode = True
SPEC.loader.exec_module(scan)


def api(endpoint, *args):
    result = subprocess.run(['gh', 'api', endpoint, *args], capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def snapshot(number):
    return api(f'repos/{REPO}/pulls/{number}')


def version(pr):
    return (pr['state'], pr['head']['sha'], pr['base']['sha'], pr['changed_files'])


def open_prs():
    pages = api(f'repos/{REPO}/pulls?state=open&per_page=100', '--paginate', '--slurp')
    if not isinstance(pages, list) or any(not isinstance(page, list) for page in pages):
        raise ValueError('invalid open PR list')
    prs = [pr for page in pages for pr in page]
    versions = {pr['number']: (pr['state'], pr['head']['sha'], pr['base']['sha']) for pr in prs}
    if len(versions) != len(prs):
        raise ValueError('duplicate PR in open list')
    return versions


def run_all(root):
    before = open_prs()
    report = run(root, sorted(before))
    after = open_prs()
    if before != after:
        raise ValueError('open PR list changed during scan; retry')
    for pr in report['pull_requests']:
        current = before[pr['number']]
        if current[1:3] != (pr['head'], pr['base']):
            raise ValueError(f"PR #{pr['number']} changed during discovery; retry")
    report['selection'] = 'all-open'
    return report


def run(root, numbers):
    if not (root / 'cases').is_dir() or not (root / 'evidence').is_dir():
        raise ValueError('root must contain cases/ and evidence/')
    with tempfile.TemporaryDirectory(prefix='pr-candidate-scan-') as directory:
        candidates, labels, snapshots, versions = [], {}, [], {}
        for number in dict.fromkeys(numbers):
            pr = snapshot(number)
            if pr['state'] != 'open' or pr['head']['repo'] is None or pr['head']['repo']['private']:
                raise ValueError(f'PR #{number} is not open with a public head repository')
            sha, repo = pr['head']['sha'], pr['head']['repo']['full_name']
            if not re.fullmatch(r'[0-9a-f]{40}', sha):
                raise ValueError(f'PR #{number} has invalid head SHA')
            pages = api(f'repos/{REPO}/pulls/{number}/files?per_page=100', '--paginate', '--slurp')
            files = [item for page in pages for item in page]
            if len(files) != pr['changed_files'] or len(files) >= 3000:
                raise ValueError(f'PR #{number} file list incomplete or at GitHub limit')
            tree = api(f'repos/{repo}/git/trees/{sha}?recursive=1')
            if tree.get('truncated') or not isinstance(tree.get('tree'), list):
                raise ValueError(f'PR #{number} tree incomplete')
            entries = {entry['path']: entry for entry in tree['tree']}
            included, removed = [], []
            for item in files:
                name, status = item['filename'], item['status']
                parts = PurePosixPath(name).parts
                if len(parts) != 2 or parts[0] not in ('cases', 'evidence') or not name.endswith('.md'):
                    continue
                if status == 'removed':
                    removed.append(name)
                    continue
                if status not in ('added', 'modified', 'renamed', 'copied') or parts[1] in ('.', '..'):
                    raise ValueError(f'PR #{number} unsupported file: {name}')
                entry = entries.get(name, {})
                if entry.get('type') != 'blob' or entry.get('mode') not in ('100644', '100755'):
                    raise ValueError(f'PR #{number} is not a regular file: {name}')
                blob = api(f"repos/{repo}/git/blobs/{entry['sha']}")
                if blob.get('encoding') != 'base64' or blob.get('sha') != entry['sha']:
                    raise ValueError(f'PR #{number} unavailable file: {name}')
                data = base64.b64decode(blob['content'], validate=False)
                if len(data) != blob['size']:
                    raise ValueError(f'PR #{number} incomplete file: {name}')
                target = Path(directory) / str(number) / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
                candidates.append(target)
                labels[str(target.resolve())] = f'PR#{number}@{sha}:{name}'
                included.append(name)
            if version(snapshot(number)) != version(pr):
                raise ValueError(f'PR #{number} changed during scan; retry')
            snapshots.append({'number': number, 'head': sha, 'base': pr['base']['sha'],
                              'head_repository': repo, 'included': included, 'removed': removed})
            versions[number] = version(pr)
        for number, expected in versions.items():
            if version(snapshot(number)) != expected:
                raise ValueError(f'PR #{number} changed during batch; retry')
        report = scan.scan(root.resolve(), candidates)
        # Replace ephemeral paths with immutable PR/head/path labels, including nested matches.
        def relabel(value):
            if isinstance(value, str):
                if value in labels:
                    return labels[value]
                try:
                    return Path(value).relative_to(root.resolve()).as_posix()
                except ValueError:
                    return value
            if isinstance(value, list):
                return [relabel(item) for item in value]
            if isinstance(value, dict):
                return {key: relabel(item) for key, item in value.items()}
            return value
        return {'pull_requests': snapshots, 'scan': relabel(report)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pr', type=int, nargs='*', help='public open PR numbers')
    parser.add_argument('--all-open', action='store_true', help='scan all open PRs, including drafts')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    if args.all_open == bool(args.pr):
        parser.error('choose PR numbers or --all-open')
    try:
        print(json.dumps(run_all(args.root) if args.all_open else run(args.root, args.pr), ensure_ascii=False, indent=2))
    except (OSError, ValueError, KeyError, UnicodeError, subprocess.CalledProcessError) as exc:
        print(f'Cannot scan PRs: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
