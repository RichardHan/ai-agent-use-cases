# 2026-10-25 GitHub Actions runner stability, mobile reading controls, and detail geometry

## Decision, evidence, and scope

**Two options considered:**

1. Pin only the floating runners and patch assertions. Leaves mobile reader controls at 13px and weakens browser contracts to accommodate oversized vertical content.
2. **Selected: pin every floating Ubuntu workflow runner to `ubuntu-24.04`, fix the mobile toolbar font-size miss to 14px, and restore detail modal reading geometry.** This addresses runner image drift across the entire suite, satisfies the 44px/14px mobile contract, and integrates the proof-note into the evidence section while ordering action shortcuts ahead of target-user metadata so that all critical initial routes remain visible within the viewport without scrolling.
A verified historical failure, [Website QA run 39937977898](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39937977898), stopped before browser tests with `Playwright does not support chromium on ubuntu26.04-x64`. The same failure and remedy are documented in [the 2026-10-23 runner incident](../2026-10-23-table-loading-regression/README.md#確定品質故障舊瀏覽器工具與漂移runner不相容). At this baseline, 50 workflow files declared `runs-on: ubuntu-latest` (54 jobs). No guard prevented reintroduction.

On PR run `40143726353` and reader-search run `40143737155`, both browser checks reached the same assertion in `tests/reader-search-browser.cjs:22`: toolbar buttons must be at least 44px high and 14px text. Local reproduction showed 44px controls with 13px text on mobile; the 44px layout itself is retained.

Intended users: maintainers who need browser and corpus checks to start on a supported, repeatable runner rather than fail during environment setup.

Non-goals: upgrading Playwright or GitHub Action versions; changing browser assertions, permissions, publication behavior, or case data.

## Changes

- All 54 runner declarations in 50 workflows that used `ubuntu-latest` now pin to `ubuntu-24.04`.
- `assets/reader.css` raises mobile detail-toolbar button text from 13px to 14px while retaining 44px tap targets, and styles `.reader-evidence .detail-proof-note`.
- `assets/reader.js` integrates `.detail-proof-note` into `.reader-evidence` (prepending it at top of evidence) and ensures `.reader-original-open` and `.reader-method-shortcut` precede `.detail-target-user` inside `.plain-overview`.
- `tests/detail-reading-and-evidence.test.cjs` adds structural and DOM placement invariant tests verifying proof-note integration and shortcut ordering.
- `tests/visitor-experience-and-ci.test.cjs` asserts no `.yml` or `.yaml` workflow reintroduces an unquoted or quoted `ubuntu-latest` label.
- `SITE.md` records the change and links this QA entry.
## Verification

- Baseline before edits: `node --test tests/*.test.cjs` — **296 passed, 0 failed**; all `assets/*.js`, `scripts/*.cjs`, `tests/*.cjs` passed `node --check`; `python3 scripts/preview.py /tmp/ai-agent-use-cases-baseline`; `python3 scripts/check_corpus_bundle.py /tmp/ai-agent-use-cases-baseline` — **445 sources byte-for-byte identical**.
- Regression-first proof: after adding the runner invariant but before pinning workflows, `node --test tests/visitor-experience-and-ci.test.cjs` failed and listed all 50 floating-runner workflows; its other 15 tests passed.
- Geometry regression reproduction & fix: `tests/reader-browser.cjs:128` on small-mobile (320x740) originally threw `target must be visible inside the dialog` because the 102px `.detail-proof-note` pushed `.reader-original-open` to 764px (dialog bottom 703px). Relocating proof-note into evidence and ordering shortcuts before `.detail-target-user` restored `.reader-original-open` to 578px-648px (≤703px). `tests/method-shortcut-browser.cjs` passed across Chromium, Firefox, and WebKit on 1440px, 390px, and 320px. `tests/reading-flow-browser.cjs` purpose visibility (≥ 2 visible lines) passed across all 8 tested cases.
- Final unit tests: `node --test tests/*.test.cjs` — **299 passed, 0 failed**; syntax checks passed (`node --check` across all JS/CJS files); `python3 scripts/check_corpus_bundle.py` — **445 source entries byte-for-byte identical**; zero floating Ubuntu runner declarations.
- Accessibility: Axe-core audit returned **0 violations** across 1440px, 390px, and 320px viewports (Home, Detail, Empty states). Horizontal overflow is 0px across all widths.
- Independent review: signed off by independent reviewer agent (confidence 0.94) with zero patch-introduced bugs.
- Three simulated contexts (not user research): a new visitor follows a task query and scenario to a case; a reader opens a direct link and its original source without scrolling; a maintainer runs existing browser workflows without Ubuntu drift or viewport bounding box failures.
## Screenshots

The before image is the published UI with 13px mobile toolbar labels; after is the local branch preview with the labels raised to 14px. Same case and CSS viewports. PNG pixel dimensions differ because device scale factors differ: desktop 1800×1250 vs 1440×1000, mobile 488×1055 vs 390×844.

| View | Before (published baseline) | After (local preview) |
| --- | --- | --- |
| Desktop 1440×1000 | [before](screenshots/before-desktop.png) | [after](screenshots/after-desktop.png) |
| Mobile 390×844 | [before](screenshots/before-mobile.png) | [after](screenshots/after-mobile.png) |
| Narrow 320×740 | — | [after](screenshots/after-narrow.png) |

## Preview and remaining risk

Use the [repository preview instructions](../../../README.md#雲端本機預覽自選環境); serve the generated directory's parent with `/ai-agent-use-cases/` as the path.

The confirmed Ubuntu 26.04 setup failure is addressed by pinning `ubuntu-24.04`; the mobile toolbar readability is resolved by raising button text to 14px; the small-screen detail modal geometry is restored by streamlining proof notes into evidence. All local browser tests (reader-browser, method-shortcut, reading-flow, accessibility) pass cleanly. Post-merge Actions must confirm GitHub-hosted behavior.
