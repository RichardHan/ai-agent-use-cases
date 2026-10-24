# 2026-10-25 Actions published-site recovery checks

## Decision and scope

Two options were considered:

1. **Selected: fix both observed CI failures at their cause.** Make the no-match browser assertion cover the six existing task shortcuts, including the keyboard path into results; extend the card-refinement live-asset wait beyond the measured Pages deploy time, and bound the job accordingly.
2. Change only the currently failing no-match assertion. Lower cost, but leaves the current-main Pages check vulnerable to the observed 11m38s deployment and its six-minute poll.

This iteration changes QA only. No case content, counts, browser UI, or deployment source changed. The repository has no `AGENTS.md` or `package.json`; Pages remains the existing Jekyll root deployment.

## Evidence and intended users

- The Actions dashboard showed `Combined recovery QA` run [40128833680](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40128833680) failing at `tests/combined-recovery-browser.cjs:38`: **6 suggestions were rendered; the test expected 0**. On the published site, a no-match search intentionally offers six problem-oriented shortcuts. Selecting `日報` with `生活` retained produced 11 matching cards.
- `Card refinement QA` run [40128833678](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40128833678) failed its published-asset check after six minutes. Its current-main commit was `9f5e7e527bfa8b0ea89964fa7b7c235b0605c2b0`. The matching Pages deployment run [40128833688](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40128833688) took 11m38s; the exact-asset poll started about 20:18:47Z and timed out at 20:24:52Z, before deployment finished. The currently published `app.js`, `style.css`, and `index.html` SHA-256 values matched the local checkout when checked later.
- Intended users: maintainers diagnosing red Actions and visitors relying on truthful search-recovery checks.

## Changes

- `tests/combined-recovery-browser.cjs`: assert the six task shortcuts for an unmatched query, preserve the active `生活` filter, and exercise the keyboard `日報` recovery to real results.
- `.github/workflows/card-refinement-qa.yml`: increase exact published-asset polling from 6 to 15 minutes and job timeout from 15 to 25 minutes. The timeout covers browser setup plus the longer bounded deployment wait.
- `tests/visitor-experience-and-ci.test.cjs`: add a regression check for that poll/job budget while retaining the existing deployment-wait checks.

## Verification

- Regression reproduced before the workflow fix: `node --test tests/visitor-experience-and-ci.test.cjs` failed because the existing poll was below 15 minutes. After the workflow update, the targeted test passed.
- Baseline `node --test tests/*.test.cjs`: **280 passed, 0 failed**. Final run: **281 passed, 0 failed**.
- Final checks: `node --check` across `assets/*.js`, `scripts/*.cjs`, `tests/*.cjs`; `python3 scripts/preview.py /tmp/ai-agent-use-cases-iteration-after`; and `python3 scripts/check_corpus_bundle.py /tmp/ai-agent-use-cases-iteration-after` passed. Corpus check: **445 sources byte-for-byte identical**. Ruby parsed the changed workflow YAML. No lint/typecheck command is defined.
- Published-site browser walk-through at 1440×1000 and 390×844: searched `旅遊`, applied `生活`, opened UC-001, checked its evidence label and source URL, pressed Escape and confirmed the query returned; changed to an unmatched query and confirmed six shortcuts. Selecting `日報` with `生活` retained returned 11 cards. On mobile, keyboard Enter from the `日報` shortcut returned 62 cards, focused `results-count`, and the shortcut measured 44px; `scrollWidth = 390`. The cited original source opened with title “Grok Bot vs Meta Muse vs ChatGPT Dots, Tested”.
- Simulated contexts: first-time visitor finds task-oriented entry points; traveler combines search and scenario, reads UC-001, and returns; returning reader gets a no-match state and keyboard-operable task recovery. These are checks, not user research.
- Before/after live-site screenshots (pixel dimensions verified): [desktop 1440×1000](screenshots/before-desktop.png) → [desktop after](screenshots/after-desktop.png); [mobile 390×844](screenshots/before-mobile.png) → [mobile after](screenshots/after-mobile.png). No product assets changed; the mobile captures are byte-identical. No visual redesign is claimed.
- Local Playwright and axe packages are not installed, so the modified cloud-only Playwright test could not run directly in local Node. Its user-visible recovery behavior was exercised on the live site with the managed browser.

## Risks and follow-up

- The 15-minute poll covers the observed 11m38s Pages build/deploy but cannot bound exceptional GitHub Pages delays beyond the 25-minute job cap.
- Cloud `Combined recovery QA` first run [40130767704](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40130767704) caught a test-order bug: the test attempted to click the empty-state reset after recovery had made that control hidden. The check now exercises reset while still empty, then re-enters the no-match query and keyboard recovery. Corrected run [40130986371](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40130986371) passed all steps.
- Cloud `Card refinement QA` run [40130767001](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40130767001) passed in 6m27s, including the published baseline walk, updated browser journey, and existing reader/homepage flows. Its final live-publish wait is main-only and was skipped on this verification branch; the 15-minute current-main gate will run after merge. Independent review could not run because the agent runtime returned `No model selected`; session model reports `openai-codex/gpt-6-luna`, but reasoning settings are unavailable.
- Next product priority from the live-site audit: surface a one-click, keyboard-accessible route to collapsed original research in long cases (for example UC-005) without auto-expanding it. Verify target visibility, focus, Escape/return behavior, and 320/390/1440 widths before implementation.
