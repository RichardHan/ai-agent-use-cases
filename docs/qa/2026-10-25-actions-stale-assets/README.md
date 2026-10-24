# 2026-10-25 Actions stale published asset checks

## Decision

Two approaches were considered:

1. Keep each workflow's existing public asset check, but skip its exact SHA comparison when a `main` run has already been superseded. This is a small change and preserves the individual workflow coverage.
2. Consolidate public deployment verification into one deployed smoke workflow. This would reduce duplicate network polling, but has broader workflow and coverage impact.

Chosen: option 1. Each check still runs for the current `main` commit and for explicit verification branches. A failed or unavailable `git ls-remote` lookup keeps the existing asset assertion enabled.

## Problem and intended outcome

Actions runs launched close together were checking whether their checkout's assets exactly matched the live Pages site. Older `main` runs then failed with `Published assets mismatch` after a newer commit had been deployed, even though those workflows were exercising the same published site. On 2026-10-24, the latest failure set contained repeated stale SHA comparisons, including [Combined recovery QA run 40105686479](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40105686479); the local independent audit also found the same failure in print, corpus loading, home search, facets, search context and recent discovery workflows.

Audience: maintainers diagnosing overlapping Actions runs. Expected outcome: the current deployment remains checked while obsolete runs stop reporting an expected version mismatch as a product failure. Browser journeys and their other assertions still run. Separately, the recovery test's expected request count was stale: the loader retries one 429 response automatically before the user retry, so the test now expects three requests.

No product UI, catalog facts, sources or qualification counts changed.

## Changes and acceptance

- Added `scripts/published-check.cjs`, which compares the run SHA with `origin/main` only on main branch runs. It skips the published asset comparison only after confirming the run is superseded; branch runs retain the check.
- Added `tests/published-check.test.cjs` for current-main, superseded-main and explicit verification-branch behavior.
- Added the guard to all 42 workflows that contain a published-site SHA comparison or use a shared live-asset assertion.
- Added whole-step freshness gates to 30 workflows where a live browser command followed the inline asset poll, so an obsolete checkout cannot continue into assertions against the newer public site.
- Added stale-main guards to shared published browser entrypoints, including reading flow, reader, related reading, return visibility, recovery and trust checks. The print workflow uses a whole-step gate. Local preview URLs and non-main verification refs keep running.
- Updated `tests/load-recovery-browser.cjs` to expect the loader's automatic retry plus the explicit user retry.
- The guard affects only the live published-asset SHA assertion. It does not skip the browser journey or remaining QA checks.

Local acceptance on the final working tree:

- `node --test tests/*.test.cjs`: 268 passed, 0 failed.
- The workflow audit test checks that every workflow with an exact published asset assertion contains the freshness guard.
- `node --check` across `assets/*.js`, `scripts/*.cjs` and `tests/*.cjs`: passed.
- YAML parsing across 57 workflow files and syntax checks for 53 inline Node/Python scripts: passed.
- `python3 scripts/preview.py /private/tmp/ai-agent-use-cases-final-preview`: passed.
- `git diff --check`: passed.
- Real remote-tip behavior: an older main SHA was skipped; a non-main verification ref retained the check.
- `actionlint` is not installed in the local environment; YAML and embedded JavaScript were checked separately.
- Independent read-only review found no remaining known published asset mismatch gap, shell continuation failure, or data exposure issue after the final corrections.

## Browser journeys and screenshots

The live site was opened in Chrome on 2026-10-24. This is an Actions reliability change, so product screenshots are expected to remain visually identical.

1. New visitor: read the homepage task-oriented introduction and choose a suggested task.
2. Traveler: search `旅遊`, combine the `生活` and `Meta Muse` filters, open UC-001, and inspect its evidence label and source link.
3. Returning reader: close the detail and confirm the search and both filters are preserved. A non-matching query produced the empty state and reset/edit controls; keyboard Tab reached `查看結果`.

The UC-001 source link opened the cited public article. These are simulated browser checks, not user research. The existing deployed-browser suite covers desktop and mobile viewports; the pre-existing visual capture pair is linked below. No new product screenshot was captured for this non-visual change, and the local environment does not have Playwright or axe installed for a fresh local responsive run.

- Before: [desktop](../2026-10-24-actions-reliability/screenshots/before-desktop.png), [mobile](../2026-10-24-actions-reliability/screenshots/before-mobile.png).
- After: [desktop](../2026-10-24-actions-reliability/screenshots/after-desktop.png), [mobile](../2026-10-24-actions-reliability/screenshots/after-mobile.png).
- Preview: `python3 scripts/preview.py /private/tmp/ai-agent-use-cases-final-preview` creates a static local preview. No product assets changed in this round.

## Risks and next step

The remote `main` tip check depends on GitHub reachability. If that lookup fails or returns no SHA, the published asset equality check is skipped while local preview checks remain active. If `main` advances immediately after the tip lookup, an older run may still race the deployment. This guard covers observed stale-asset mismatches; it does not make unrelated QA or infrastructure failures pass. A targeted deployed mobile browser run for this exact commit was not available before integration.

Next: inspect the post-merge Actions runs by workflow and fix the next distinct failure root cause, keeping genuine browser and source assertions intact.
