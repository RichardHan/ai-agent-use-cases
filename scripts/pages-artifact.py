"""Read selected Pages bytes without extracting or executing archive members."""
import hashlib
import io
import json
import sys
import tarfile
import zipfile

MAX_ARCHIVE = 64 * 1024 * 1024
MAX_MEMBER = 8 * 1024 * 1024


def page_hashes(data, revision, pages):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        if len(entries) != 1 or entries[0].filename != "artifact.tar":
            raise ValueError("Expected one Pages artifact.tar")
        if entries[0].file_size > MAX_ARCHIVE:
            raise ValueError("Pages tar exceeds size limit")
        tar_bytes = archive.read(entries[0])
    wanted = set(pages) | {"catalog.json"}
    found = {}
    with tarfile.open(fileobj=io.BytesIO(tar_bytes), mode="r:") as archive:
        for entry in archive:
            name = entry.name.removeprefix("./")
            if name not in wanted:
                continue
            if name in found or not entry.isfile() or entry.size > MAX_MEMBER:
                raise ValueError("Invalid or duplicate Pages member")
            found[name] = archive.extractfile(entry).read()
    if set(found) != wanted:
        raise ValueError("Pages artifact is missing required pages")
    if json.loads(found["catalog.json"])["sourceRevision"] != revision:
        raise ValueError("Pages artifact source revision mismatch")
    return {page: hashlib.sha256(found[page]).hexdigest() for page in pages}


if __name__ == "__main__":
    try:
        data = sys.stdin.buffer.read(MAX_ARCHIVE + 1)
        if len(data) > MAX_ARCHIVE:
            raise ValueError("Pages archive exceeds size limit")
        print(json.dumps(page_hashes(data, sys.argv[1], sys.argv[2:])))
    except Exception:
        # Never echo archive contents or signed download URLs into Actions logs.
        sys.exit("Invalid Pages artifact archive or source revision")
