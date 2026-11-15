# Manual publication range — independent review

## Verdict

No actionable P1/P2 code or runtime findings in the reviewed diff. The workflow now requires the operator's full `base_sha` for manual dispatch, validates both endpoints as commit objects and the base as a strict ancestor before browser installation/Jekyll, and only exports the validated base on success. The publication step uses that output for manual runs and retains `github.event.before` for push events; the published-site gate remains main-only. The environment/token changes are least-privilege for the existing read-only Actions-runs probe (`contents: read`, `actions: read`, token scoped to the verification step); there are no Pages/Jekyll behavior changes.

## Requirements and tests

- `publication-base.cjs` passes user input as git argv (not shell text), rejects missing/abbreviated/zero/injected/equal/non-ancestor/non-commit ranges, and writes no usable output on failure.
- The new isolated Git-object fixture creates a genuine multi-commit history where the deletion occurs before HEAD, then passes the validated range into the real `publicationChangeList`; it demonstrates the deletion survives a multi-commit selection. The malformed-input and non-ancestor cases are exercised. The fixture called `unrelated` is technically a sibling sharing an ancestor, not a disconnected root, but it is still a real non-ancestor rejection case and this does not expose a runtime defect.
- The fixed `github.event.before` wiring test was not a valid assertion of the manual-run contract: the old regex accepted the original broken caller, and would reject the new correct manual input. Removing that assertion is reasonable. Current workflow wiring is correct in the diff; the existing gate/byte/deletion/unknown-changeList/browser assertions remain. The pending cloud dispatch is end-to-end acceptance, not a code bug.
- README/SITE explain that an ancestor check cannot prove the operator selected the complete historical change range; the operator remains responsible for that choice. The README's cloud-dispatch/evidence section is still explicitly pending and should be completed after that acceptance, not treated as a code defect.

## Findings

None.
