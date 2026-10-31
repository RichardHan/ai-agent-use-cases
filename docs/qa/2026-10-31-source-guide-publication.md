# Source guide publication gate — 2026-10-31

- Baseline: `df6704c` (main). Preserve the original worktree's uncommitted changes; this work uses a separate branch and worktree.
- Source guide QA previously allowed only 20 minutes for published HTML, JS and CSS to match; [Pages deployment 41145540632](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41145540632) took 46m40s. This is evidence of a timeout risk, not proof that this specific workflow failed in that deployment.
- Replace its bespoke polling with the existing byte-exact publication helper, allowing 60 minutes within a 75-minute published job. Superseded commits remain skipped; a current commit with mismatching assets still fails. This does not change the visitor interface or resolve partial corpus loading.
- Baseline `node --test --test-reporter=dot tests/*.test.cjs` passed; JavaScript syntax checks passed; the static preview bundle check reported 476 byte-identical sources. The actual Pages build runs in GitHub Actions.
- On the live site, a mobile search for 旅遊 opened UC-001 and returned to the result; selecting 生活 retained the query, and an unmatched query showed recovery actions. The source link was present. These checks are not evidence of user preference or conversion.
- Earlier investigation of partial loading (121 loaded, 344 missing) remains unresolved; see `2026-10-30-partial-statistics/README.md` and `2026-10-30-slow-bundle.md` before changing loader budgets.
