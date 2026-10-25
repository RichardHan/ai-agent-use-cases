# 2026-10-25 GitHub Actions runner stability, mobile reading controls, and detail geometry

## Decision, evidence, and scope

**Two options considered:**

1. Pin the floating runners and raise the mobile controls to 14px, leaving the original-research route below the fold at 320px. Smaller UI scope but leaves a long-detail entry awkward to discover.
2. **Selected: pin every floating Ubuntu workflow runner to `ubuntu-24.04`, meet the 44px/14px mobile control contract, and restructure detail reading evidence and shortcuts for narrow screens.** This fixes the confirmed runner drift and makes the original-research entry reachable without scrolling at 320px. The method shortcut is available after a short swipe.
A verified historical failure, [Website QA run 39937977898](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39937977898), stopped before browser tests with `Playwright does not support chromium on ubuntu26.04-x64`. The same failure and remedy are documented in [the 2026-10-23 runner incident](../2026-10-23-table-loading-regression/README.md#確定品質故障舊瀏覽器工具與漂移runner不相容). At this baseline, 50 workflow files declared `runs-on: ubuntu-latest` (54 jobs). No guard prevented reintroduction.

On PR run `40143726353` and reader-search run `40143737155`, both browser checks reached the same assertion in `tests/reader-search-browser.cjs:22`: toolbar buttons must be at least 44px high and 14px text. Local reproduction showed 44px controls with 13px text on mobile; the 44px layout itself is retained.

Intended users: maintainers who need browser and corpus checks to start on a supported, repeatable runner rather than fail during environment setup.

Non-goals: upgrading Playwright or GitHub Action versions; changing browser assertions, permissions, publication behavior, or case data.

## Changes

- All 54 runner declarations in 50 workflows that used `ubuntu-latest` now pin to `ubuntu-24.04`.
- `assets/reader.css` raises mobile detail-toolbar button text from 13px to 14px while retaining 44px tap targets, and styles `.reader-evidence .detail-proof-note`.
- `assets/reader.js` integrates `.detail-proof-note` into `.reader-evidence` (prepending it at top of evidence) and ensures `.reader-original-open` and `.reader-method-shortcut` precede `.detail-target-user` inside `.plain-overview`.
- `tests/reader-browser.cjs` exercises the actual `CaseReader.enhance()` runtime in a browser and checks evidence relocation, real shortcut ordering, and opening their target sections. Removed duplicate mock-array/source-text placement checks from `tests/detail-reading-and-evidence.test.cjs`.
- `tests/visitor-experience-and-ci.test.cjs` asserts no `.yml` or `.yaml` workflow reintroduces an unquoted or quoted `ubuntu-latest` label.
- `SITE.md` records the change and links this QA entry.
## Verification

- Baseline before edits: `node --test tests/*.test.cjs` — **296 passed, 0 failed**; all `assets/*.js`, `scripts/*.cjs`, `tests/*.cjs` passed `node --check`; `python3 scripts/preview.py /tmp/ai-agent-use-cases-baseline`; `python3 scripts/check_corpus_bundle.py /tmp/ai-agent-use-cases-baseline` — **445 sources byte-for-byte identical**.
- Regression-first proof: after adding the runner invariant but before pinning workflows, `node --test tests/visitor-experience-and-ci.test.cjs` failed and listed all 50 floating-runner workflows; its other 15 tests passed.
- Geometry at 320×740: the dialog ends at y=703; `.reader-original-open` spans y=578–648 (visible without scrolling), while `.reader-method-shortcut` spans y=664–755 and needs a 52px swipe. Both remain reachable below the sticky toolbar; page overflow is 0px. Existing method-shortcut QA allows up to a 180px vertical reveal margin; no claim is made that both links are above the fold.
- Final unit tests: `node --test tests/*.test.cjs` — **297 passed, 0 failed**; all JS/CJS syntax checks passed; `python3 scripts/check_corpus_bundle.py` — **445 sources byte-for-byte identical**; zero floating Ubuntu runner declarations.
- Accessibility: Axe-core audit returned **0 violations** across 1440px, 390px, and 320px viewports (Home, Detail, Empty states). Horizontal overflow is 0px across all widths.
- Independent review found no production blocker, but flagged overbroad viewport wording and mock-based DOM-placement coverage. This follow-up qualifies the method-scroll contract and replaces those mocks with a real-browser `CaseReader.enhance()` check.

### Three simulated contexts (not user research)

1. A new visitor searches a task, adds a scenario filter, and opens a matching case.
2. A reader opens a long direct-linked case, opens the original source immediately, then scrolls briefly to reach the method shortcut.
3. A maintainer pins runners and has regression coverage for the actual detail enhancement instead of a stand-in array simulation.
## Screenshots

The before image is the published baseline (13px mobile toolbar labels); after is the updated branch preview (14px labels, reorganized reading entry). CSS viewports match. PNG pixel dimensions match: desktop 1800×1250, mobile 488×1055.

| View | Before (published baseline) | After (local preview) |
| --- | --- | --- |
| Desktop 1440×1000 | [before](screenshots/before-desktop.png) | [after](screenshots/after-desktop.png) |
| Mobile 390×844 | [before](screenshots/before-mobile.png) | [after](screenshots/after-mobile.png) |
| Narrow 320×740 | — | [after](screenshots/after-narrow.png) |

## Preview and remaining risk

Use the [repository preview instructions](../../../README.md#雲端本機預覽自選環境); serve the generated directory's parent with `/ai-agent-use-cases/` as the path.

The Ubuntu 26.04 setup failure is fixed by pinning `ubuntu-24.04`; mobile toolbar labels are 14px and detail placement is regression-tested against runtime DOM. PR #93 merged; its check set reported 10 pass, 5 fail, and 2 skip. On main commit `4d08880`, the latest snapshot showed 2 pass, 1 fail, 4 running; `Improvement round QA` still failed the existing wheel-anchor assertion (`wheel reading stays anchored even with title focus outside the viewport`). That reading-position issue is the next priority and is not claimed fixed. Pages deployment passed.
