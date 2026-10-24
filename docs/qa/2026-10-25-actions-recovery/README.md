# 2026-10-25 Actions published-site recovery checks

## Decision and scope

Two options were considered:

1. **Selected: fix both observed CI failures at their cause.** Make the no-match browser assertion cover the six existing task shortcuts, including keyboard recovery; extend the main-only published-asset waits in both affected workflows to 15 minutes and give each job a 25-minute cap.
2. Change only the failed no-match assertion. Lower cost, but leaves two main-only Pages checks vulnerable to the measured 11m38s deployment and their 6–7-minute polls.

This iteration changes QA only. No case content, counts, browser UI, or deployment source changed. The repository has no `AGENTS.md` or `package.json`; Pages remains the existing Jekyll root deployment.

## Evidence and intended users

- The Actions dashboard showed `Combined recovery QA` run [40128833680](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40128833680) failing at `tests/combined-recovery-browser.cjs:38`: **6 suggestions were rendered; the test expected 0**. On the published site, a no-match search intentionally offers six problem-oriented shortcuts. Selecting `日報` with `生活` retained produced 11 matching cards.
- `Card refinement QA` run [40128833678](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40128833678) failed its published-asset check after six minutes. Its current-main commit was `9f5e7e527bfa8b0ea89964fa7b7c235b0605c2b0`. The matching Pages deployment run [40128833688](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40128833688) took 11m38s; the exact-asset poll started about 20:18:47Z and timed out at 20:24:52Z, before deployment finished. Independent review found the sibling `Combined recovery QA` main-only poll also capped at seven minutes; it now has the same 15-minute window. The currently published `app.js`, `style.css`, and `index.html` SHA-256 values matched the local checkout when checked later.
- Intended users: maintainers diagnosing red Actions and visitors relying on truthful search-recovery checks.

## Changes

- `.github/workflows/card-refinement-qa.yml` and `.github/workflows/combined-recovery-qa.yml`: extend exact published-asset polling to 15 minutes and each job timeout to 25 minutes.
- `tests/visitor-experience-and-ci.test.cjs`: add a regression check for both poll/job budgets while retaining the existing deployment-wait checks.

## Verification

- Regression reproduced before both poll fixes: `node --test tests/visitor-experience-and-ci.test.cjs` failed at the 15-minute threshold for the existing workflow. After both workflow updates, the static regression checks pass.
- Baseline `node --test tests/*.test.cjs`: **280 passed, 0 failed**. Final run after both fixes: **282 passed, 0 failed**.
- Final checks: `node --check` across `assets/*.js`, `scripts/*.cjs`, `tests/*.cjs`; `python3 scripts/preview.py /tmp/ai-agent-use-cases-iteration-after`; and `python3 scripts/check_corpus_bundle.py /tmp/ai-agent-use-cases-iteration-after` passed. Corpus check: **445 sources byte-for-byte identical**. Ruby parsed both changed workflow YAML files. No lint/typecheck command is defined.
- Published-site browser walk-through at 1440×1000 and 390×844: searched `旅遊`, applied `生活`, opened UC-001, checked its evidence label and source URL, pressed Escape and confirmed the query returned; changed to an unmatched query and confirmed six shortcuts. Selecting `日報` with `生活` retained returned 11 cards. On mobile, keyboard Enter from the `日報` shortcut returned 62 cards, focused `results-count`, and the shortcut measured 44px; `scrollWidth = 390`. The cited original source opened with title “Grok Bot vs Meta Muse vs ChatGPT Dots, Tested”.
- Simulated contexts: first-time visitor finds task-oriented entry points; traveler combines search and scenario, reads UC-001, and returns; returning reader gets a no-match state and keyboard-operable task recovery. These are checks, not user research.
- Before/after live-site screenshots (pixel dimensions verified): [desktop 1440×1000](screenshots/before-desktop.png) → [desktop after](screenshots/after-desktop.png); [mobile 390×844](screenshots/before-mobile.png) → [mobile after](screenshots/after-mobile.png). No product assets changed; the mobile captures are byte-identical. No visual redesign is claimed.
- Local Playwright and axe packages are not installed, so the modified cloud-only Playwright test could not run directly in local Node. Its user-visible recovery behavior was exercised on the live site with the managed browser.

## Risks and follow-up

- Both 15-minute polls cover the observed 11m38s Pages build/deploy but cannot bound exceptional GitHub Pages delays beyond the 25-minute job caps.
- Cloud `Combined recovery QA` first run [40130767704](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40130767704) caught a test-order bug: the test attempted to click the empty-state reset after recovery had made that control hidden. The check now exercises reset while still empty, then re-enters the no-match query and keyboard recovery. Corrected run [40130986371](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40130986371) passed; after extending the sibling publish gate, [40131609417](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40131609417) also passed all branch-preview steps.
- Cloud `Card refinement QA` run [40130767001](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40130767001) passed in 6m27s, including the published baseline walk, updated browser journey, and existing reader/homepage flows. Its final live-publish wait is main-only and was skipped on this verification branch. Independent review found the sibling Combined recovery poll was still seven minutes; both waits are now lengthened. Review found no additional actionable test/privacy findings. Latest pull-request `Website QA` [40131604409](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40131604409) passed in 3m04s; its published Pages check was skipped because this change has no product asset differences. Separate reviewer agent attempts first returned `No model selected`; a task agent completed the review.
- Next product priority from the live-site audit: surface a one-click, keyboard-accessible route to collapsed original research in long cases (for example UC-005) without auto-expanding it. Verify target visibility, focus, Escape/return behavior, and 320/390/1440 widths before implementation.
