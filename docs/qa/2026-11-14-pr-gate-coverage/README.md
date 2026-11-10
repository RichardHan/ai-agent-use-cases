# 2026-11-14 PR 的綠燈沒有跑它自己的測試

## 基準

- 開發基準 `origin/main` `10ae513e`（開工時），工作期間 main 前進兩個 docs-only commit（`9de2d070`、`e23c1948`），分支已 rebase 到 `e23c1948` 後重跑，所有數字以後者為準。隔離 worktree `/private/tmp/aiuc-1114-round`（分支 `improve/20261114-facets`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 316 個 commit，另有 159 個未追蹤檔案（皆已存在於 origin/main，非本輪內容）；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`（`10ae513e`）：**677 通過、0 失敗**。
- main 現況重新確認（`gh run list --branch main`）：最近 12 次 run 全部 success；`pages build and deployment` 與 `Website QA` 在 `10ae513e`、`f7364428`、`e7aaabe8` 都是 success。11-13 修掉的 Pages 600 秒逾時沒有再出現，本輪不是重複修同一件事。
- 正式站 `catalog.json.sourceRevision` = `10ae513e…`，與 main head 相同。

## 問題證據

目標使用者是**送 PR 的維護者**：他看到的綠燈應該代表「這次改動會被測到」。以下每一項都用檔案與觸發集合量測，不是推測。

### 1. `corpus-bundle-qa.yml` 的 PR 觸發只列 3 個測試檔，卻執行 8 支測試

`corpus-bundle-qa.yml:7` 的 `pull_request.paths` 只有 `tests/page-context-browser.cjs`、`tests/page-context-errors.cjs`、`tests/page-context-errors.test.cjs` 與它自己；同一個 job 的步驟（`:61-69`、`:88`）另外還跑 `tests/corpus-bundle-browser.cjs`、`tests/recovery-progress-browser.cjs`、`tests/reader-browser.cjs`、`tests/arrival-geometry-diagnostic.cjs`、`tests/reading-selection-browser.cjs`、`tests/reading-history-browser.cjs`。

以「PR 觸發的 workflow 中，哪些會因為這支測試檔被改動而啟動，**而且真的執行它**」逐一比對 57 支 workflow：

| 測試檔 | 改它會啟動的 PR workflow | 其中真的執行它的 |
| --- | --- | --- |
| `tests/reading-history-browser.cjs` | `website-qa.yml` | **0** |
| `tests/reading-selection-browser.cjs` | — | **0** |
| `tests/recovery-progress-browser.cjs` | — | **0** |
| `tests/corpus-bundle-browser.cjs` | — | **0** |
| `tests/arrival-geometry-diagnostic.cjs` | — | **0** |
| `tests/reliability-observe.cjs` | — | **0** |
| `tests/loading-budget-browser.cjs` | — | **0** |
| `tests/table-reading-browser.cjs` | — | **0** |

（`website-qa.yml` 的 paths 有 `tests/**`，所以改歷史紀錄測試會啟動它；但它不執行那支檔案。其餘 runner 都是 `workflow_dispatch` 或已停用的分支觸發，不是 PR 閘門。）

### 2. 14 支跑瀏覽器測試的 PR workflow，paths 少了它們斷言的網站或語料

改 `assets/app.js`、`index.html`、任一篇 `cases/*.md`、`evidence/*.md` 或 `sources/pending.md` 時，這些 workflow 不會被啟動：

| 缺少 | workflow |
| --- | --- |
| `assets/**`、`index.html`、`cases/**` 等全部 | `corpus-bundle-qa.yml`、`missing-case-qa.yml`、`outline-find-qa.yml` |
| `index.html` 與語料 | `reader-search-qa.yml`、`return-visibility-qa.yml`、`related-qa.yml` |
| `cases/**`、`evidence/**`、`sources/pending.md` | `reader-qa.yml`、`relevance-qa.yml`、`round23-qa.yml`、`search-context-qa.yml`、`source-guide-qa.yml`、`trust-summary-qa.yml`、`home-search-entry-qa.yml`、`load-recovery-qa.yml` |

### 3. 改任何 workflow 都不會啟動讀它的 run

每支 workflow 的 paths 只列自己那一支檔案，但 `tests/published-check.test.cjs:131-140` 與 `tests/discovery-clarity-and-ci-resilience.test.cjs:214-222` 會讀 `recency-qa.yml`／`combined-recovery-qa.yml`，`published-check.test.cjs` 則 `readdirSync` 掃過全部 57 支 workflow。實測：改 `.github/workflows/task-labels-qa.yml` 或 `print-reading-qa.yml`，**0 支 workflow 被啟動**。

### 4. 三支 workflow 讓具名單元測試失敗仍可綠燈

`table-reading-qa.yml:40`、`task-labels-qa.yml:31`、`task-round-qa.yml:33` 的形式是 `node --test … || node -e '<斷言失敗清單恰為某一個測試、且 expected/actual 為 21|22|23 vs 19>'`：那一個測試紅了，job 仍然成功。

## 兩個方案

- **A（採用）讓 path filter 與 workflow 實際讀的檔案一致，並把不變量寫成測試。**
  - 做法：14 支 workflow 的 `paths` 補上它們執行的測試檔與斷言的語料（`assets/**`、`index.html`、`cases/**`、`evidence/**`、`sources/pending.md`）；`corpus-bundle-qa.yml` 的 PR 觸發改成鏡射它的 push 觸發（`tests/**`＋語料＋`scripts/**`）；`website-qa.yml` 改成 `.github/workflows/**`；三支 workflow 移除「允許具名測試失敗」的逃生口。新增 `tests/pr-gate-coverage.test.cjs`，把四件事寫成不變量：每支被執行的測試至少有一個 PR 會因它而跑、每支瀏覽器測試至少有一個 PR 會因網站或語料改動而跑、`node --test` 失敗不得變成綠燈、改 workflow 會跑到稽核 workflow 的 job。
  - 價值：三支原本在任何 PR 上都不會執行的 workflow（Corpus bundle QA、Missing shared case QA、Find reader sections QA）在本輪 PR 上實際啟動；改 workflow 也第一次有人讀。
  - 成本：18 支 YAML 各 1–2 行、1 支新測試（5 項）。代價是內容 PR 觸發的 workflow 變多（見「成本」）。
  - 取捨：以平行執行的機器時間換覆蓋率；wall time 不變（最長的那支仍是 `Website QA`）。
- **B 只修 `corpus-bundle-qa.yml`，其餘靠人工 dispatch。**
  - 成本最低，但三支 workflow 仍然是「看起來有閘門、實際靠人記得按」；而且沒有任何機制阻止下一支新 workflow 再犯同一個錯。不採用。

## 改動

- **14 支 workflow 的 `paths`**：`corpus-bundle-qa.yml`（PR 觸發改為 `['assets/**','index.html','catalog.json','corpus.json','cases/**','evidence/**','sources/pending.md','scripts/**','tests/**', 自己]`）、`missing-case-qa.yml`、`outline-find-qa.yml`、`reader-qa.yml`（另補 `tests/discovery-browser.cjs`）、`reader-search-qa.yml`、`related-qa.yml`、`relevance-qa.yml`、`return-visibility-qa.yml`、`round23-qa.yml`（補 `tests/table-*`）、`search-context-qa.yml`、`source-guide-qa.yml`（另補 `tests/loading-budget-browser.cjs`）、`trust-summary-qa.yml`、`home-search-entry-qa.yml`、`load-recovery-qa.yml`。
- **`website-qa.yml`**：PR 與 main push 的 paths 由 `.github/workflows/website-qa.yml` 改為 `.github/workflows/**`，並在檔案內註明原因。
- **逃生口**：`table-reading-qa.yml`、`task-labels-qa.yml`、`task-round-qa.yml` 的 `node --test … || node -e '…'` 改為 `… || { cat qa-artifacts/unit.tap; exit 1; }`（失敗時仍把 TAP 印到 log，然後以非零結束）。實測 `bash -e` 下該形式確實以 1 結束，不會被 `cat` 吃掉。
- **`tests/pr-gate-coverage.test.cjs`（新，5 項）**：把上述不變量寫成測試。parser 只認 repo 實際使用的兩種 `paths` 寫法，並把「沒有 `paths` 的 `pull_request`／`on: pull_request`」視為涵蓋全部（那是「每次 PR 都跑」，不是「什麼都不跑」）。

## 測試

- `node --test tests/*.test.cjs`：基準 `10ae513e` **677 通過／0 失敗** → 本輪 **682 通過／0 失敗**（+5）。
- 新測試對基準 workflow（`git archive origin/main .github/workflows` 解到 `/tmp/gatebase`）**5 項中 4 項失敗**（可達性、語料覆蓋、逃生口、workflow 稽核），對本輪 5 項全過。**不是空轉。**
- 突變檢查抓到自己的 bug：第一版把 `on: pull_request` 寫成 `^on:\s*pull_request`，`\s` 吃掉換行，於是每一支 `on:` ＋ `  pull_request:` 都被讀成「無 paths 過濾」，不變量全部假通過。改成 `[ \t]*` 後基準才恢復 4 紅。
- 57 支 workflow 全部通過 YAML 解析（`yaml.safe_load`，`on:` 區塊合法）。

## 觸發集合前後對照

同一支檔案改動會啟動幾支 PR workflow（以各 workflow 的 `pull_request.paths` 實算）：

| 改動的檔案 | 改動前 | 改動後 |
| --- | ---: | ---: |
| `assets/app.js` | 13 | 16 |
| `index.html` | 10 | 16 |
| `cases/024-missing-invoice-check.md` | 4 | 16 |
| `sources/pending.md` | 3 | 16 |
| `tests/reading-history-browser.cjs` | 1（且那支不執行它） | 2（其中一支執行它） |
| `.github/workflows/task-labels-qa.yml` | **0** | 1 |

代價說明：內容 PR 現在會啟動 16 支 workflow（原本 4 支）。這些 job 平行執行，wall time 由最長的 `Website QA` 決定，單次 PR 的機器時間約增加 40–60 分鐘（公開 repo 不計費）。這是刻意選擇：這個 repo 的產出就是內容，內容 PR 的斷言不該靠運氣。

## 邊界情況

| 情況 | 結果 |
| --- | --- |
| workflow 用 `on: pull_request` 或 `on: [push, pull_request]`（沒有 paths） | 視為涵蓋全部 PR，通過所有覆蓋斷言 |
| workflow 用 `paths-ignore` | 目前 repo 沒有；parser 不支援，會因為讀不到 `paths` 而當成「無過濾」= 涵蓋全部（保守，不會誤判成有覆蓋） |
| 同一支測試被多支 PR workflow 執行 | 只要有一支的 paths 涵蓋它就算可達；不要求每支都列 |
| 該測試檔存在但沒有任何 PR workflow 執行它 | 不算違規（本輪只約束「有執行就要能被觸發」） |

## 已知限制

- 本輪沒有動 `assets/`、`index.html`、`cases/`：網站輸出不變，因此沒有前後截圖可比較，正式站的視覺與搜尋行為應與基準相同（合併後仍重走三種情境確認）。
- parser 是針對 repo 現行寫法的簡化版，不是通用 YAML：`pull_request: {paths: [...]}` 這種 flow mapping 會讀不到 paths 而當成無過濾（保守方向）。沒有引入 YAML 依賴是刻意的（repo 沒有 `package.json`）。
- 新增的觸發只證明「會啟動」，不證明「跑得完且會紅」；三支原本不可達的 workflow 在本輪 PR 上的實際結果見下方發布段。

## 獨立審查（未參與實作）與修正

由另一個 agent context（`reviewer`，未參與實作）讀 diff、實際比對 PR #336 與 #340 的 check-run 集合、並嘗試以構造輸入繞過新測試。結論 **needs fixes**（0 項 must-fix、3 項 should-fix），三項都已修：

1. **（已修）把「PR 到不了」的步驟算成覆蓋。** `corpus-bundle-qa.yml` 的 `reliability-observe.cjs` 在 `if: github.ref == 'refs/heads/verify/catalog-bundle-20261024'` 的步驟裡，PR 永遠不會執行它，但我的 parser 只掃整份檔案、沒看步驟條件，於是把它算成「有 runner」。現在改為逐步驟判斷可達性（`github.ref ==`、`github.event_name == 'workflow_dispatch'` 視為不可達），並把 `arrival-geometry-diagnostic.cjs` 加進明確必要清單。
2. **（已修）語料抽樣只有一個檔案。** 原本只檢查 `cases/001-travel-checkout.md` 與 `evidence/008-…md`，把 `cases/**` 換成 `cases/001-*` 仍會通過。現在抽樣全部 508 個案例頁、3 篇經驗、7 個 `assets/*`、`index.html` 與 `sources/pending.md`（共 520 個檔案；測試另外斷言抽樣數 > 500，避免抽樣被縮小）。
3. **（已修）逃生口檢查只看行內有沒有 `exit` 這個字。** `|| { :; } # exit 1` 會通過。現在先剝掉註解，並要求 fallback 內是真的非零 `exit`。

三項繞過都實測會讓新測試轉紅：

| 構造的繞過 | 結果 |
| --- | --- |
| `corpus-bundle-qa.yml` 的 `cases/**` 改為 `cases/001-*` | 「語料覆蓋」轉紅 |
| `table-reading-qa.yml` 的 fallback 改為 `\|\| { :; }` | 「逃生口」轉紅 |
| 被 `if: github.ref == 'refs/heads/verify/x'` 包住的步驟 | 該步驟的測試不再算可達，「可達性」轉紅 |

審查另確認：三個逃生口的替換沒有弱化任何斷言（`cat` 之後是明確 `exit 1`，左側失敗一定進 fallback）；15 支 PR workflow 的 `on:` 由 GitHub 實際接受（有真實 run 為證）；新增的 glob 與各 workflow 實際執行的命令相符。

**審查未處理、本輪記錄為已知成本：** `corpus-bundle-qa.yml` 的 `tests/**` 比它實際執行的檔案寬（改 `tests/related-browser.cjs` 也會啟動它）；`reader-browser.cjs` 在 Reader QA 與 Source guide QA 各跑一次，`reader-search-browser.cjs` 在 Reader search QA 與 Audit summary round QA 各跑一次。這些是重複執行而不是漏測，收斂它們屬於另一輪（會改變既有 workflow 的分工）。
