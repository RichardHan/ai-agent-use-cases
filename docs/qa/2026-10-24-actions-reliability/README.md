# 2026-10-24 Source guide QA reliability

## Decision

Two fixes were considered:

1. Update the source integrity check to treat table cells as valid reading targets and compare the original authored DOM after removing Reader controls and restoring baseline accessibility attributes. This is narrow, keeps the test meaningful, and has low maintenance cost.
2. Rewrite the reader test around new fixtures and replace the browser workflow. This would isolate the test more, but costs more and risks dropping coverage already exercised by the workflow.

Chosen: option 1, plus trigger the existing source guide workflow for `fix/**` pushes and include its reader test and preview script in path filters. This makes acceptance checks run on the branch where the repair is being prepared.

## Problem and intended outcome

The latest main Source guide QA run, [40093703439](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40093703439), failed after its browser journeys had reached the corpus integrity check. UC-400 contains a table. The Reader correctly targets individual `TD`/`TH` cells, while the assertion only accepted paragraph, list, preformatted, and blockquote elements. After that was corrected, the comparison also treated Reader-added table labels and heading focus IDs as edits to the authored research. The comparison now uses the unenhanced render as its baseline and removes only Reader-injected controls before comparing content.

Audience: maintainers diagnosing source-guide acceptance failures. Expected outcome: a real change to authored text/structure still fails, while valid table-cell navigation and Reader accessibility enhancements no longer produce false failures. No claims about visitor preference or conversion are made.

Iteration record: branch runs [40097622450](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40097622450), [40097893473](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40097893473), and [40098233371](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40098233371) failed while the assertion was being brought into line with table cells and Reader-added accessibility attributes. They remain visible as failed iterations. The verified revisions are `cffe4ab` in run 40098434008 and the integrated `6df2b61` in run 40098879308.

## Scope and acceptance

- Updated `tests/reader-context-round.cjs` to accept and explicitly require a table-cell passage for UC-400, and compare against the original rendered content while restoring baseline IDs, tab stops, and table labels.
- Updated `.github/workflows/source-guide-qa.yml` so `fix/**` branches run the existing preview acceptance; added the reader-context test and preview script to relevant path filters.
- No product UI, case facts, source claims, or corpus qualification counts were changed by this round.
- Acceptance requires local unit/syntax/static-preview checks, the cloud preview workflow, and after merge the published HTTPS job. The preview stages have passed; published-site verification is pending the main update.

Local checks on the integrated code commit `6df2b61` passed: `git diff --check`, `node --check` for every `assets/*.js` and `tests/*.cjs`, `node --test --test-reporter=tap tests/*.test.cjs` (260 passed, 0 failed; 4.63s), and `python3 scripts/preview.py /tmp/actions-round-preview/ai-agent-use-cases`. Cloud preview `40098879308` also passed unit/syntax/static preview and the complete browser step.

## Simulated visitor journeys checked

These are automated browser journeys, not user research:

1. Search a case, open its original source, use keyboard navigation, and return to results.
2. Follow an official source, create an empty result, then reset the filters.
3. Combine filters, reload and use Back, then read a long source with the Reader controls.

The existing suite also checks 1440px desktop and 390px/320px mobile layouts, source links, long text, loading recovery, and axe scans. It does not constitute device-lab testing.

## Evidence

- Before screenshots: [desktop](screenshots/before-desktop.png), [mobile](screenshots/before-mobile.png).
- After screenshots: [desktop](screenshots/after-desktop.png), [mobile](screenshots/after-mobile.png).
- The UI is intentionally unchanged. These paired captures document the browser QA surface before and after the test correction; visual differences are not an expected product outcome.
- Latest pre-merge browser run [40098434008](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40098434008) succeeded. It exercised 447 catalog entries, three engines and five viewport configurations (Chromium 1440/390/320, Firefox 390, WebKit 390); the 10 source-guide axe scans had zero violations. Readiness ranged from 284 to 501 ms. All three source/return/filter/long-reading journeys and loading recovery completed. The injected partial-load scenario intentionally missed UC-001, then recovered all 447 entries with one retry.
- In the integrated run, the source link resolved to the expected GitHub case URL, but GitHub returned HTTP 429. The click target was verified; fetching the linked source content could not be independently confirmed because of rate limiting.
- Integrated preview [40098879308](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40098879308) also succeeded in 13m 9s after including main `75aadff`. It loaded 447 catalog entries (3,451 reader sections and 466 proof rows); the same five browser configurations completed, all 10 source-guide axe scans had zero violations, and the three visitor journeys plus partial-load recovery completed. This branch-only run skipped the published-HTTPS job by design.
- After main is updated, its Pages deployment and published HTTPS QA results will be recorded here.

## Limits and next step

This round addresses the observed Source guide QA regression only; it does not repair every unrelated red Actions run. Existing workflows have shown separate rate-limit/network and other QA failures. Workflow actions currently emit Node 20 deprecation warnings under the runner's Node 24 transition; updating all workflows is outside this change. The PR API rejected PR creation for this Enterprise Managed User; branch changes are being delivered through the user's authorized direct-push path. GitHub also denied cancellation/re-dispatch operations because the account lacks repository admin rights.

Next, inspect the current Actions failure set by workflow and root cause before changing more checks. Avoid broadening this fix into unrelated CI migrations.
