# 2026-10-25 Facet QA stale-publication gate

## Evidence and choice

**Failure evidence:** Facet counts QA run [40149517989](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40149517989) printed `SKIP_PUBLISHED_BROWSER_CHECK` for a superseded main SHA, then unconditionally invoked `scripts/check_corpus_bundle.py` with an output directory that the skipped check had not created. The checker failed opening `catalog.json`. This was a deterministic workflow control-flow defect, not a Pages deployment delay.

A later Round QA run [40151968058](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40151968058) failed for a different reason: the published job omitted `ROUND_PUBLISHED=1` and entered local synthetic reload scenarios. That was repaired by `7cd0581`; run [40152423482](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40152423482) passed. Another earlier run reported 27 HTTP 429 source failures after an injected corpus abort; that test-induced request flood is not evidence of ordinary visitor failure. This round does not modify the site to mask those historical test artifacts.

**Options:**

1. **Selected:** publish an explicit `verified=true|false` step output and run byte-for-byte corpus verification only after a current published release was verified. A superseded commit skips only the dependent check; real publication failures still fail the job.
2. Restructure Facet QA jobs and deployment dependencies. Broader CI cost and risk without addressing a second confirmed defect.

Audience: maintainers running concurrent main commits while Pages publishes asynchronously. Non-goals: site UI, case data, retry budgets, treating test failures as success, and changes to unrelated workflows.

## Changes

- `tests/published-version.cjs` writes `verified=false` before work, leaving it false on skip/failure, and changes it to true only after checking deployed assets and source content.
- `.github/workflows/facet-counts-qa.yml` runs the source-byte check only when the verification step explicitly reports true. The normal GitHub Actions `success()` condition still blocks it after failures.
- `tests/published-version.test.cjs` covers the false/true output contract. Before implementation, the added regression failed (4 pass, 1 fail); after implementation, all 5 pass.

## Site inspection and screenshots

The UI and case corpus are unchanged by this CI-only fix. The screenshot pair compares the deployed baseline with the branch preview; it documents the visitor surface, not a redesign. Viewports: desktop 1440×1000 and mobile 390×844. Pixel comparison: desktop 0.00% changed; mobile 4.08% changed. The reason for the mobile pixel variance was not established, so it is not attributed to this fix.

| View | Published baseline | Branch preview |
|---|---|---|
| Desktop search results | [before](screenshots/before-desktop.png) | [after](screenshots/after-desktop.png) |
| Mobile search results | [before](screenshots/before-mobile.png) | [after](screenshots/after-mobile.png) |

Local preview URL: `http://127.0.0.1:8139/ai-agent-use-cases/?q=旅遊&scenario=生活#explore` (serve `/tmp/ai-agent-facet-current` on port 8139).

## Verification

- Baseline before the PR #99 merge: `node --test tests/*.test.cjs` on main `a993dec` — **306 passed, 0 failed**. The refreshed-base post-change suite passed **308/308**. No `package.json`, dedicated lint, or type-check command exists.
- Regression-first: targeted `node --test tests/published-version.test.cjs` — **4 passed, 1 failed** before implementation; **5 passed, 0 failed** after.
- Full post-change suite: `node --test tests/*.test.cjs` — **308 passed, 0 failed**.
- Generated the static preview with `python3 scripts/preview.py /tmp/ai-agent-facet-corpora`; `python3 scripts/check_corpus_bundle.py /tmp/ai-agent-facet-corpora` — **447 sources byte-for-byte identical**. The preview serves `index.html` below the Pages base path.
- Parsed `.github/workflows/facet-counts-qa.yml` with Ruby Psych and checked both changed JavaScript files with `node --check`.
- Stale SHA `95858173eebf024f9606d2ddeb324e61ec2c5091` against `origin/main`, with missing `BUILT_SITE`/`PUBLISHED_BUILD`, printed the superseded-main skip and emitted `verified=false`; no nonexistent catalog file was opened. The verified-current path also compared deployed content with the static preview, emitted `verified=true`, and passed the 447-source byte check.
- Published desktop and mobile pages were opened; the mobile search flow combined `旅遊` + `生活`, returned 20 cards, opened UC-001, checked its Markdown target and returned with Escape while preserving query/filter. The original UC-001 source link returned HTTP 200. On the branch preview, direct UC-005 links opened at both viewports; its 49-heading reading view fit without horizontal overflow.
- Empty search displayed problem-oriented recovery actions; mobile document width remained 390px with no horizontal overflow. Desktop keyboard Tab reached the search submit control with a solid visible outline.
- Branch preview Axe 4.13.0: UC-005 long detail (49 H2/H3 headings) at desktop and mobile — **0 violations, 0 incomplete, 27 passes** each; UC-001 desktop detail — **0 violations, 0 incomplete, 31 passes**; mobile search — **0 violations, 2 incomplete, 41 passes**. One warm-cache Web Vitals sample on published search: desktop LCP/FCP **172ms**, TTFB **72ms**, load **207.7ms**, CLS **0**, long tasks **0**; mobile LCP/FCP **140ms**, TTFB **73.4ms**, load **181.6ms**, CLS **0**, long tasks **0**. Not a cold-start performance score; INP was not exercised.

These are scripted browser checks, not user research. They do not imply conversion or visitor preference changes.

## Risks and next step

The local stale-publication and current-publication paths pass, and the independent reviewer found no issues. Manual Facet workflow-dispatch [40155819411](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40155819411) succeeded; both “Verify published release matches this commit” and the conditional “Verify published source bytes” step passed. PR #100 browser QA [40156188115](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40156188115) passed in 3m42s (308 tests). While this work was in progress, main advanced to `e438b73` when PR #99 was merged. Reading anchor QA [40155151228](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40155151228) completed with a failure at `tests/round-browser.cjs:97` (early result-card focus not restored); Improvement round QA [40155151231](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40155151231) eventually completed successfully overall. Related reading QA [40155151239](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40155151239) completed without matching published `assets/reader.css` after 60 polls, despite Pages build [40155150995](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40155150995) succeeding. These two unrelated main failures remain unresolved; do not claim the broad Actions suite is green. Next priority: reproduce the result-card focus regression; verify the Pages race separately. Do not weaken checks.
