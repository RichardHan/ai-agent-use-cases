# 2026-10-25: Keep the purpose-visibility check on its intended paragraph

## Decision and evidence

Two options:

1. Narrow the existing geometry check to the first overview section, which is the explicitly labeled purpose (“可以幫你做什麼”). This preserves the current viewport contract with a minimal test-only change.
2. Rework the round browser test to find the purpose section by accessible heading and add a selector helper. This is more resilient to section reordering, but adds test machinery for a single assertion.

Selected option 1: `.plain-overview > section:first-child > p` identifies the purpose paragraph in the existing rendering order and leaves the two-lines-visible requirement unchanged.

The first fix exposed a second issue that had been hidden behind the strict locator: after commit `4d08880`, [Improvement round run 40147451384](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40147451384) passed all Chromium sizes but Firefox mobile failed the same scenario later at `round-browser.cjs:111`. The visible `.reader-report h2` moved **84.400px** when `.detail-load-status` (70.400px tall) disappeared. `assets/app.js:1936-1973` already compensates `#detail.scrollTop` using the visible reading anchor; native scroll anchoring on that same dialog competed with the manual restoration. The follow-up sets `overflow-anchor:none` on `#detail`, leaving manual restoration in control. This is a reader-position defect, not a reason to relax the 2px assertion.

Audience: maintainers whose repeated browser workflows currently stop before their intended responsive, focus, reading-continuity and accessibility checks.

Non-goals: changing case data, sources, evidence claims, workflow definitions, or the two-line/2px acceptance assertions.

## Change

- `tests/round-browser.cjs`: target the purpose paragraph only when measuring the two-line viewport contract. Target-user and core-goal copy no longer create strict-mode ambiguity.
- `assets/style.css`: disable native scroll anchoring on the detail dialog, whose async corpus-completion code already restores its visible reading anchor explicitly.
- No product markup, case text, source URLs, evidence claims, or workflows changed.

## Verification

- Baseline `node --test --test-reporter=tap tests/*.test.cjs`: **299 passed, 0 failed** (5.09s).
- Final `node --test --test-reporter=spec tests/*.test.cjs`: **297 passed, 0 failed** (5.10s); syntax checks passed for all `assets/*.js`, `tests/*.cjs`, and `scripts/*.cjs`. The worktree also contains unrelated concurrent test edits; they were preserved and not included in this change.
- `npm test` is unavailable because this static site has no `package.json` (npm `ENOENT`). There is no repository lint/type-check script.
- Re-ran `gh run view 40146594835 --log-failed`; it reproduces the exact strict-mode selector error above. Run 40146594854 independently reports the same locator and three matching paragraphs.
- Built a local Pages-compatible preview with `python3 scripts/preview.py /tmp/ai-agent-round/ai-agent-use-cases` and served its parent at `http://127.0.0.1:8100/ai-agent-use-cases/`.
- Actual browser smoke: published and local preview opened at desktop 1440×1000 and mobile 390×844; local preview loaded; direct `?case=UC-359` opened with one purpose paragraph, one target-user paragraph and one core-goal paragraph. The updated selector matched exactly the one purpose paragraph. On the published mobile site, search `旅行` returned 33 results; adding `生活` returned 20; a deliberately unmatched query showed the empty state; restoring `旅行` returned results. Opened UC-001 detail, confirmed its Markdown source target is `https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/001-travel-checkout.md`, and Escape closed the detail and returned to the same query/filter URL.
- Independent code review approved both the purpose-selector repair and scoped dialog anchoring; it notes that native anchoring is disabled for all dialog content, so unrelated late reflows rely on explicit component behavior. The browser acceptance run is pending after the follow-up CSS fix.

## Simulated journeys

1. A first-time mobile visitor searches a task, adds a scenario filter, recovers from empty results, and reopens results.
2. A search visitor opens a case, checks its original Markdown source destination, then returns to the same search.
3. A mobile reader opens a direct detail link with extra overview fields; the responsive check still measures the purpose paragraph rather than unrelated metadata.

These are scripted checks, not user research. The changed code is a test selector, so no visitor-benefit or conversion claim is made.

## Remaining risk and next priority

The focused local browser script and cloud Actions run must still confirm Chromium/Firefox/WebKit acceptance after this repair. This change cannot explain unrelated failures until their logs/artifacts are inspected. Next: push the focused fix and inspect resulting Actions runs before touching another workflow.
