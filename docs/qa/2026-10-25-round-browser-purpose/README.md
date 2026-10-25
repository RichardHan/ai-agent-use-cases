# 2026-10-25: Keep the purpose-visibility check on its intended paragraph

## Decision and evidence

Two options:

1. Narrow the existing geometry check to the first overview section, which is the explicitly labeled purpose (“可以幫你做什麼”). This preserves the current viewport contract with a minimal test-only change.
2. Rework the round browser test to find the purpose section by accessible heading and add a selector helper. This is more resilient to section reordering, but adds test machinery for a single assertion.

Selected option 1: `.plain-overview > section:first-child > p` identifies the purpose paragraph in the existing rendering order and leaves the two-lines-visible requirement unchanged.

The latest `main` commit (`109873d`) produced four browser-step failures in Actions. The same-commit [Improvement round run 40146594835](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40146594835) and [Print reading run 40146594854](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40146594854) both fail at `tests/round-browser.cjs:48`: `.plain-overview section p` matches three paragraphs (purpose, target user, core goal), so Playwright rejects the strict locator. The current case `UC-359` now has a separately rendered core-goal section; that addition invalidated the old broad selector. This is a deterministic test-selector regression, not a runner setup failure or a reason to relax the visibility assertion.

Audience: maintainers whose repeated browser workflows currently stop before their intended responsive, focus, reading-continuity and accessibility checks.

Non-goals: production UI changes, data changes, runner/action upgrades, changing assertions, or fixing unrelated red workflows.

## Change

- `tests/round-browser.cjs`: target the purpose paragraph only when measuring the two-line viewport contract. Target-user and core-goal copy no longer create strict-mode ambiguity.
- No product markup, case text, source URLs, evidence claims, or workflows changed.

## Verification

- Baseline `node --test --test-reporter=tap tests/*.test.cjs`: **299 passed, 0 failed** (5.09s).
- Final `node --test --test-reporter=spec tests/*.test.cjs`: **297 passed, 0 failed** (5.10s); syntax checks passed for all `assets/*.js`, `tests/*.cjs`, and `scripts/*.cjs`. The worktree also contains unrelated concurrent test edits; they were preserved and not included in this change.
- `npm test` is unavailable because this static site has no `package.json` (npm `ENOENT`). There is no repository lint/type-check script.
- Re-ran `gh run view 40146594835 --log-failed`; it reproduces the exact strict-mode selector error above. Run 40146594854 independently reports the same locator and three matching paragraphs.
- Built a local Pages-compatible preview with `python3 scripts/preview.py /tmp/ai-agent-round/ai-agent-use-cases` and served its parent at `http://127.0.0.1:8100/ai-agent-use-cases/`.
- Actual browser smoke: published and local preview opened at desktop 1440×1000 and mobile 390×844; local preview loaded; direct `?case=UC-359` opened with one purpose paragraph, one target-user paragraph and one core-goal paragraph. The updated selector matched exactly the one purpose paragraph. On the published mobile site, search `旅行` returned 33 results; adding `生活` returned 20; a deliberately unmatched query showed the empty state; restoring `旅行` returned results. Opened UC-001 detail, confirmed its Markdown source target is `https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/001-travel-checkout.md`, and Escape closed the detail and returned to the same query/filter URL.
- Browser comparison captures: [before desktop](screenshots/before-desktop.png), [after desktop](screenshots/after-desktop.png), [before mobile](screenshots/before-mobile.png), [after mobile](screenshots/after-mobile.png). UI code was not changed; these are captures, not a claimed visual redesign. Published and local preview can differ in dynamic load timing/content.
- Full `tests/round-browser.cjs` execution is not available in this environment: its declared Playwright and axe dependencies are not installed (`require.resolve` reported missing). GitHub Actions installs them on its runner. The accessible browser smoke above exercised the updated DOM selector but does not replace the multi-engine workflow.

## Simulated journeys

1. A first-time mobile visitor searches a task, adds a scenario filter, recovers from empty results, and reopens results.
2. A search visitor opens a case, checks its original Markdown source destination, then returns to the same search.
3. A mobile reader opens a direct detail link with extra overview fields; the responsive check still measures the purpose paragraph rather than unrelated metadata.

These are scripted checks, not user research. The changed code is a test selector, so no visitor-benefit or conversion claim is made.

## Remaining risk and next priority

The focused local browser script and cloud Actions run must still confirm Chromium/Firefox/WebKit acceptance after this repair. This change cannot explain unrelated failures until their logs/artifacts are inspected. Next: push the focused fix and inspect resulting Actions runs before touching another workflow.
