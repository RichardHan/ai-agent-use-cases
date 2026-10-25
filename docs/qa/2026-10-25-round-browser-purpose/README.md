# 2026-10-25: Keep the purpose-visibility check on its intended paragraph

## Decision and evidence

Two options:

1. Narrow the existing geometry check to the first overview section, which is the explicitly labeled purpose (“可以幫你做什麼”). This preserves the current viewport contract with a minimal test-only change.
2. Rework the round browser test to find the purpose section by accessible heading and add a selector helper. This is more resilient to section reordering, but adds test machinery for a single assertion.

Selected option 1: `.plain-overview > section:first-child > p` identifies the purpose paragraph in the existing rendering order and leaves the two-lines-visible requirement unchanged.

Commit `4d08880` fixed the selector and let the round workflow advance: Chromium passed all four viewport sizes, then Firefox mobile failed the wheel-reader check with **84.400px** drift while the 70.400px status block disappeared. A first hypothesis—native anchoring competing with the manual compensation—was tested in `886fb04`; the repeated [run 40147923912](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40147923912) had the same delta, so that CSS opt-out was removed. The cross-engine trace in [the 2026-10-20 Firefox baseline](../2026-10-20-reading-anchor/baseline-reading.json#L429-L480) records scrollTop staying at 710 and the report moving 84.4px. The current rendering adds target-user/core-goal paragraphs before the temporary status; one can start in the viewport and be selected as the anchor even while the reader is on the report after the status. The real boundary is the status’s bottom: the reader anchor must be downstream of the block that will disappear. This keeps the original 2px assertion and corrects anchor selection rather than concealing the jump.

Audience: maintainers whose repeated browser workflows currently stop before their intended responsive, focus, reading-continuity and accessibility checks.

Non-goals: changing case data, sources, evidence claims, or weakening the two-line/2px acceptance assertions.

## Change

- `tests/round-browser.cjs`: target the purpose paragraph only when measuring the two-line viewport contract; this retains strict locator behavior.
- `assets/app.js`: capture the loading-status bottom and pass it to `selectReadingAnchor` during load completion. Select a visible block downstream of the removed status; if none exists, do not anchor to an unaffected upstream paragraph.
- `tests/reading-anchor.test.cjs`: add upstream-paragraph and clipped-downstream regressions. Each new assertion failed before its fix; the 6/6 anchor tests now pass.
- `.github/workflows/round-qa.yml`: add a manual `workflow_dispatch` trigger so this multi-engine acceptance can be rerun on the current main commit without another code push.
- No case text, source URLs, or evidence claims changed.

## Verification

- Baseline `node --test --test-reporter=tap tests/*.test.cjs`: **299 passed, 0 failed** (5.09s).
- After latest main `072ae76` added all-case actionable guidance and two entries, clean-worktree suite: **304 passed, 0 failed** (4.89s). Syntax checks passed for all `assets/*.js`, `tests/*.cjs`, and `scripts/*.cjs`; static preview built; corpus bundle check confirms **447 sources byte-for-byte identical**; `git diff --check` passed.
- `npm test` is unavailable because this static site has no `package.json` (npm `ENOENT`). There is no repository lint/type-check script.
- Re-ran `gh run view 40146594835 --log-failed`; it reproduces the exact strict-mode selector error above. Run 40146594854 independently reports the same locator and three matching paragraphs.
- Built a local Pages-compatible preview with `python3 scripts/preview.py /tmp/ai-agent-round/ai-agent-use-cases` and served its parent at `http://127.0.0.1:8100/ai-agent-use-cases/`.
- Actual browser smoke: published and local preview opened at desktop 1440×1000 and mobile 390×844; local preview loaded; direct `?case=UC-359` opened with one purpose paragraph, one target-user paragraph and one core-goal paragraph. The updated selector matched exactly the one purpose paragraph. On the published mobile site, search `旅行` returned 33 results; adding `生活` returned 20; a deliberately unmatched query showed the empty state; restoring `旅行` returned results. Opened UC-001 detail, confirmed its Markdown source target is `https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/001-travel-checkout.md`, and Escape closed the detail and returned to the same query/filter URL.
Independent review found a clipped downstream-block fallback edge; the helper now retains the first intersecting downstream block while excluding upstream-only candidates. A second independent review approved the repair. The first cloud run was cancelled by a concurrent main push; manual round-QA dispatch is now available for the current commit.

## Simulated journeys

1. A first-time mobile visitor searches a task, adds a scenario filter, recovers from empty results, and reopens results.
2. A search visitor opens a case, checks its original Markdown source destination, then returns to the same search.
3. A mobile reader opens a direct detail link with extra overview fields; the responsive check still measures the purpose paragraph rather than unrelated metadata.

These are scripted checks, not user research. The round repairs test accuracy and mobile reading continuity; no human preference or conversion claim is made.

## Remaining risk and next priority

Run [40149285704](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40149285704) was cancelled when a concurrent main push superseded it, not due to a test result. Main `072ae76` added later reader guidance and two cases; the full unit suite still passes. The new manual trigger will exercise current-main Chromium/Firefox/WebKit and published Pages checks. Next: complete that run and record its screenshots/artifacts.
