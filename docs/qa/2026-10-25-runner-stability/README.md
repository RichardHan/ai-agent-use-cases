# 2026-10-25 GitHub Actions runner stability and mobile reading controls

## Decision, evidence, and scope

**Two options considered:**

1. Pin only the floating runners. Smaller scope, but leaves mobile reader controls at 13px and an existing browser job's ≥14px readability assertion failing.
2. **Selected: pin every floating Ubuntu workflow runner and fix the browser-proven mobile toolbar font-size miss.** This addresses runner image drift across the suite and makes the reader toolbar match its existing 44px / 14px usability contract.

A verified historical failure, [Website QA run 39937977898](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39937977898), stopped before browser tests with `Playwright does not support chromium on ubuntu26.04-x64`. The same failure and remedy are documented in [the 2026-10-23 runner incident](../2026-10-23-table-loading-regression/README.md#確定品質故障舊瀏覽器工具與漂移runner不相容). At this baseline, 50 workflow files declared `runs-on: ubuntu-latest` (54 jobs). No guard prevented reintroduction.

On PR run `40143726353` and reader-search run `40143737155`, both browser checks reached the same assertion in `tests/reader-search-browser.cjs:22`: toolbar buttons must be at least 44px high and 14px text. Local reproduction showed 44px controls with 13px text on mobile; the 44px layout itself is retained.

Intended users: maintainers who need browser and corpus checks to start on a supported, repeatable runner rather than fail during environment setup.

Non-goals: upgrading Playwright or GitHub Action versions; changing browser assertions, permissions, publication behavior, or case data.

## Changes

- All 54 runner declarations in 50 workflows that used `ubuntu-latest` now pin to `ubuntu-24.04`.
- `assets/reader.css` raises mobile detail-toolbar button text from 13px to 14px while retaining 44px tap targets.
- `tests/visitor-experience-and-ci.test.cjs` asserts no `.yml` or `.yaml` workflow reintroduces an unquoted or quoted `ubuntu-latest` label.
- `SITE.md` records the change and links this QA entry.

## Verification

- Baseline before edits: `node --test tests/*.test.cjs` — **296 passed, 0 failed**; all `assets/*.js`, `scripts/*.cjs`, `tests/*.cjs` passed `node --check`; `python3 scripts/preview.py /tmp/ai-agent-use-cases-baseline`; `python3 scripts/check_corpus_bundle.py /tmp/ai-agent-use-cases-baseline` — **445 sources byte-for-byte identical**.
- Regression-first proof: after adding the runner invariant but before pinning workflows, `node --test tests/visitor-experience-and-ci.test.cjs` failed and listed all 50 floating-runner workflows; its other 15 tests passed.
- Final: `node --test tests/*.test.cjs` — **297 passed, 0 failed**; syntax checks passed; `python3 scripts/check_corpus_bundle.py /tmp/ai-agent-use-cases-runner-preview` — **445 source entries byte-for-byte identical**; Ruby parsed all **57** `.github/workflows/*.yml`; repository grep found **zero** `runs-on: ubuntu-latest` declarations. No lint or typecheck command is defined.
- Latest full workflow baseline on PR #93 exposed the mobile reader assertion at `reader-search-browser.cjs:22`. After the CSS change, live branch-preview checks at 390px and 320px confirmed all three controls at 44px height, 14px type, no button-text overflow, and 0px page overflow. Desktop controls remain 44px/14px.
- Live published-site baseline at 1440×1000 and 390×844: searched `旅遊` with scenario `生活`, opened UC-001, pressed Escape to return, direct-linked UC-005, and opened its original source. A no-match mobile query exposed six recovery shortcuts. Horizontal overflow: 0px at both widths.
- Three simulated contexts (not user research): a new visitor follows a task query and scenario to a case; a reader opens a direct link and its original source; a maintainer runs an existing browser workflow without Ubuntu `latest` drift.

## Screenshots

The before image is the published UI with 13px mobile toolbar labels; after is the local branch preview with the labels raised to 14px. Same case and CSS viewports. PNG pixel dimensions differ because device scale factors differ: desktop 1800×1250 vs 1440×1000, mobile 488×1055 vs 390×844.

| View | Before (published baseline) | After (local preview) |
| --- | --- | --- |
| Desktop 1440×1000 | [before](screenshots/before-desktop.png) | [after](screenshots/after-desktop.png) |
| Mobile 390×844 | [before](screenshots/before-mobile.png) | [after](screenshots/after-mobile.png) |

## Preview and remaining risk

Use the [repository preview instructions](../../../README.md#雲端本機預覽自選環境); serve the generated directory's parent with `/ai-agent-use-cases/` as the path.

The confirmed Ubuntu 26.04 runner migration is fixed by pinning `ubuntu-24.04`; the reported mobile toolbar assertion is fixed at its source, without weakening the test. Remaining current-main Actions failures may have independent causes; they require individual logs and are not claimed fixed by these changes. Updated PR checks and post-merge Actions must still confirm GitHub-hosted behavior.
