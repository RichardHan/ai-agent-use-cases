# 2026-10-25 GitHub Actions runner drift prevention

## Decision, evidence, and scope

**Two options considered:**

1. Pin only workflows currently observed failing. Smaller diff, but leaves dozens of browser and corpus checks exposed to the same floating OS image change.
2. **Selected: pin every workflow that currently declares `ubuntu-latest` to `ubuntu-24.04`.** Broader YAML-only update; matches the repository's existing `website-qa.yml` precedent and confirmed Playwright compatibility boundary; removes Ubuntu image drift from every affected check.

A verified historical failure, [Website QA run 39937977898](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39937977898), stopped before browser tests with `Playwright does not support chromium on ubuntu26.04-x64`. The same failure and remedy are documented in [the 2026-10-23 runner incident](../2026-10-23-table-loading-regression/README.md#確定品質故障舊瀏覽器工具與漂移runner不相容). At this baseline, 50 workflow files declared `runs-on: ubuntu-latest` (54 jobs). No guard prevented reintroduction.

Current main (`686ae00`) also had multiple red Actions runs (including Print reading, Reading anchor, Reading flow, Source guide, and Reader). Public run summaries expose failing steps, but not detailed assertions or causes. **This change addresses only the confirmed runner-image failure; it does not attribute or claim to fix those current red runs.**

Intended users: maintainers who need browser and corpus checks to start on a supported, repeatable runner rather than fail during environment setup.

Non-goals: upgrading Playwright or GitHub Action versions; changing browser assertions, permissions, publication behavior, site UI, or case data.

## Changes

- All 54 runner declarations in 50 workflows that used `ubuntu-latest` now pin to `ubuntu-24.04`.
- `tests/visitor-experience-and-ci.test.cjs` asserts no `.yml` or `.yaml` workflow reintroduces an unquoted or quoted `ubuntu-latest` label.
- `SITE.md` records this change and links this QA entry.

## Verification

- Baseline before edits: `node --test tests/*.test.cjs` — **296 passed, 0 failed**; all `assets/*.js`, `scripts/*.cjs`, `tests/*.cjs` passed `node --check`; `python3 scripts/preview.py /tmp/ai-agent-use-cases-baseline`; `python3 scripts/check_corpus_bundle.py /tmp/ai-agent-use-cases-baseline` — **445 sources byte-for-byte identical**.
- Regression-first proof: after adding the runner invariant but before pinning workflows, `node --test tests/visitor-experience-and-ci.test.cjs` failed and listed all 50 floating-runner workflows; its other 15 tests passed.
- Final: `node --test tests/*.test.cjs` — **297 passed, 0 failed**; syntax checks passed; `python3 scripts/check_corpus_bundle.py /tmp/ai-agent-use-cases-runner-preview` — **445 source entries byte-for-byte identical**; Ruby parsed all **57** `.github/workflows/*.yml`; repository grep found **zero** `runs-on: ubuntu-latest` declarations. No lint or typecheck command is defined.
- Independent reviewer: no blocking correctness findings. Review confirmed all 54 runner declarations across 50 workflows changed only the runner image. Reviewer suggested broadening the regression guard to `.yaml` and quoted labels; guard now covers both.
- Live published-site baseline at 1440×1000 and 390×844: searched `旅遊` with scenario `生活`, opened UC-001, pressed Escape to return, direct-linked UC-005, and verified the linked original source. A no-match mobile query exposed six recovery shortcuts. Horizontal overflow: 0px on both viewport widths. UC-005 direct detail was opened in a built local preview at both widths after the workflow-only change; overflow remained 0px. This is a CI change, not a UI redesign.
- Three simulated contexts (not user research): a new visitor follows a task query and scenario to a case; a reader opens a direct link and visits its original source; a maintainer runs an existing browser workflow without Ubuntu `latest` image drift.

## Screenshots

The site UI is unchanged. Before shows the published baseline; after shows the branch's local static preview at the same CSS viewport and case. No visual improvement is claimed. PNG pixel dimensions differ because the browser device scale factors differ: desktop 1800×1250 vs 1440×1000, mobile 488×1055 vs 390×844.

| View | Before (published baseline) | After (local preview) |
| --- | --- | --- |
| Desktop 1440×1000 | [before](screenshots/before-desktop.png) | [after](screenshots/after-desktop.png) |
| Mobile 390×844 | [before](screenshots/before-mobile.png) | [after](screenshots/after-mobile.png) |

## Preview and remaining risk

Use the [repository preview instructions](../../../README.md#雲端本機預覽自選環境); serve the generated directory's parent with `/ai-agent-use-cases/` as the path. Workflow changes have no site runtime surface.

Pinning the runner prevents the specific Ubuntu `latest` migration observed here; it does not fix arbitrary browser-test failures or pin action versions. The several current-main red Actions runs need their detailed logs and separate root-cause analysis. GitHub-hosted PR and post-merge workflow runs are required to verify this remedy on actual runners.
