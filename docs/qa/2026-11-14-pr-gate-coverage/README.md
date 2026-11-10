# 2026-11-14 PR 的綠燈沒有跑它自己的測試

## 基準

- 開發基準 `origin/main` `10ae513e`（開工時），工作期間 main 前進三個 commit：兩個 docs-only（`9de2d070`、`e23c1948`）與 `180e00ca`（#336 任務入口標記，動 `assets/app.js`／`assets/style.css`／`website-qa.yml`）。分支已 rebase 到 `180e00ca` 後重跑，所有數字以後者為準。隔離 worktree `/private/tmp/aiuc-1114-round`（分支 `improve/20261114-facets`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 316 個 commit，另有 159 個未追蹤檔案（皆已存在於 origin/main，非本輪內容）；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`（`180e00ca`，實體 worktree）：**684 通過、0 失敗**。
- 正式站開工時 `sourceRevision` = `10ae513e…`；`180e00ca` 合併後為 `180e00ca…`。
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

- `node --test tests/*.test.cjs`：基準 `180e00ca` **684 通過／0 失敗** → 本輪 **689 通過／0 失敗**（+5）。
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
| workflow 用 `paths-ignore`（只有排除、沒有 `paths`） | 目前 repo 沒有；讀不到 `paths` 時視為涵蓋全部，語意正確（它確實會在所有 PR 上跑），不是保守近似 |
| 同一支測試被多支 PR workflow 執行 | 只要有一支的 paths 涵蓋它就算可達；不要求每支都列 |
| 該測試檔存在但沒有任何 PR workflow 執行它 | 不算違規（本輪只約束「有執行就要能被觸發」） |

## 已知限制

- 本輪沒有動 `assets/`、`index.html`、`cases/`：網站輸出不變，因此沒有前後截圖可比較，正式站的視覺與搜尋行為應與基準相同（合併後仍重走三種情境確認）。
- parser 是針對 repo 現行寫法的簡化版，不是通用 YAML：`pull_request: {paths: [...]}` 這種 flow mapping 讀不到 paths，會被當成「無過濾」而通過覆蓋斷言（方向是誤放，不是誤擋）。目前 57 支 workflow 沒有這種寫法。沒有引入 YAML 依賴是刻意的（repo 沒有 `package.json`）。
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

## 新閘門第一次跑就跑出一個舊問題

`corpus-bundle-qa.yml` 在本輪 PR 上第一次因為 pull request 啟動，第一次執行就失敗：`tests/reading-history-browser.cjs:43`（chromium-320）的 `|scrollTop - sourceTop| < 3`（run 42793635230）。同一支 workflow 在前一個 head（`3659e06a`，程式碼相同）是 success，本機重跑則在 webkit-390 的另一條斷言（`:47`「Related case return restores its visible trigger」）失敗——也就是說這支測試本身就跨引擎不穩定，只是從來沒有在 PR 上跑過。

**根因（量測，不是猜）**：Safari 不會因為滑鼠點擊而把焦點移到 `<button>` 上。實測同一段流程（`?case=UC-xxx` → 點延伸閱讀 → 返回）：

| 引擎 | 用滑鼠點延伸閱讀後返回 | 用鍵盤（focus + Enter）開啟後返回 |
| --- | --- | --- |
| Chromium | 焦點回到該按鈕 | 焦點回到該按鈕 |
| WebKit | 焦點停在 `#detail-title` | 焦點回到該按鈕 |

所以「返回時把焦點還給讀者用的那個按鈕」在 WebKit 用滑鼠操作時不可能成立——不是產品壞了，是斷言的前提只在會 focus 按鈕的引擎上成立。

**處理**：把測試改成用鍵盤啟動（`focus()` + `Enter`），斷言本身一字未改。實測 `assets/app.js` 完全不動的情況下，chromium 1440／390／320、firefox 390、webkit 390 **五種全部通過，連跑兩次**。因此本輪**沒有任何產品程式碼變更**；先前嘗試在 `restoreReadingView()` 加焦點重試的版本已撤回（它在 WebKit 上也修不好，因為前提不成立）。

這是「把休眠的閘門接上」的直接價值，也是它的成本：第一次接上就會看到積壓的失敗，而且必須分清楚是迴歸還是斷言前提過時。本輪判定為後者，並保留原斷言。

## 發布前狀態（head `a5007784`）

- `node --test tests/*.test.cjs`：**689 通過／0 失敗**。
- 本輪 PR 的 15 支 pull-request workflow：`Corpus bundle QA`（[42797067226](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42797067226)，5m58s）**success**——這是它第一次因為 pull request 而跑，也是第一次綠燈；`Missing shared case QA`、`Find reader sections QA` 同樣只在這一輪才會被 PR 觸發（先前任何 PR 都啟動不了）。
- 另外 12 支既有的 PR workflow 照舊全綠（`published` 步驟在 PR 上依設計 skipping）。

## 下一輪最值得做的一件事

**讓「沒有發布任何檔案」的 trunk merge 立即拿到發布裁決，而不是佔住 main 的閘門 60 分鐘。** 本輪的 `8fbfe082` 就是這個情況（`publicationChangeList` 回 `entries: []`，live 已是後代，卻從 11:04 等到視窗結束），而且 `website-qa.yml` 在 main 上不取消、concurrency group 只有一個，下一個 merge（`56f7a238`）的裁決因此被排在後面。

**先做的驗證**：對 `ee68c19d`→`8fbfe082` 用 `waitForPublishedVersion()`（注入假的 `liveRevision`＝`56f7a238`、注入空的 `changeList`）跑一次，確認它是否進入 superseded 分支、以及 `sameContent()` 是否因為 live 的 `assets/app.js` 與本地建置不同而持續重試；把結果寫成測試（空 change list ＋ live 是後代 → 應立即 `matched/superseded`），再談改法。

**內容 PR 現在會啟動 16 支 workflow，而其中 12 支會各自重跑同一套 689 項單元測試**（`node --test tests/*.test.cjs`），`reader-browser.cjs` 在 Reader QA 與 Source guide QA 各跑一次、`reader-search-browser.cjs` 在 Reader search QA 與 Audit summary round QA 各跑一次。本輪把覆蓋率補起來，代價就是重複執行；下一步是把「單元套件」收成一支共用 job（其餘 workflow 只跑自己那 1–2 支瀏覽器測試），並把 `corpus-bundle-qa.yml` 的 `tests/**` 收斂成它實際執行的 8 支。

**先做的驗證**（不要先動 workflow）：用同一份語料改動量測現在的 job-minutes 與 wall time（本輪 PR 的 15 支 run 的 `started_at`→`completed_at` 加總），再比對「如果單元套件只在一支 job 跑」會少多少；同時確認那 12 支 workflow 的單元步驟有沒有任何一支跑的是子集（`tests/relevance.test.cjs`、`tests/table-reading.test.cjs`），避免把唯一的紅燈來源也收掉。

補記（第二次 CI 失敗）：同一支測試在 chromium-320 的 `Forward restores the reading location` 又紅一次（`#detail[open]` 成立早於 popstate 套用捲動位置，窄螢幕還會再回流一次）。改為等待還原完成（`waitForFunction` 比對 3px，逾時就具名失敗），斷言與容差都沒放寬。本機連跑三次、五種引擎／寬度全過。

## 發布

- **已提交**：分支 `improve/20261114-facets`，9 個 commit（`ee472253` → `f7e3e6eb`）。
- **已推送**：`origin/improve/20261114-facets`。
- **PR**：[#340](https://github.com/RichardHan/ai-agent-use-cases/pull/340)。最終 head `f7e3e6eb` 上 **15 支 pull-request workflow 全部 success**，`published` 步驟依設計 skipped。
- **已合併**：squash 成 `8fbfe082229287a23083009238a973147eb0c2a4`（`gh pr merge` 因本機 `main` 被另一個 worktree 佔用而失敗，改用 `PUT /pulls/340/merge`，`sha` 指定 `f7e3e6eb`；未繞過任何保護規則，main 本來就沒有 branch protection）。分支已刪除。
- **部署成功**：`pages build and deployment` 對 `8fbfe082` **success**（run 42803247422）。
- **正式站已驗證（在 live 等於 `8fbfe082` 時）**：`catalog.json.sourceRevision` = `8fbfe082…`、512 個來源檔；`index.html`／`assets/app.js`／`assets/style.css`／`assets/reader.css`／`assets/reader.js` 與合併前的 `180e00ca` 建置**逐 byte 相同**（SHA-256 前 16 碼 `8a73b8207b7ee1df`／`b81b759cd73ec63c`／`de2b8b9d1b986e25`／`04c7d8237d41413f`／`db09f4b97cc6fce9`），符合「本輪不動發布檔案」的預期。
- **正式站三種情境重走**（1440×900 與 390×844，live = `8fbfe082`）：`?q=怎麼整理會議記錄` 7／515、第一張卡為「用法靈感」；`?q=規劃旅行&scenario=工作` 0／515，空結果提供「移除使用情境「工作」 → 查看 1 筆」，點擊後 1 筆；`?case=UC-024` 詳情直開、憑據「成果主張：社群作者／專案實踐者／核讀：本庫未獨立重現」、來源固定在 `8fbfe082`、延伸閱讀 3 列，Escape 後焦點回到 `results-count`；水平溢出 0。

**未能取得的裁決（本輪不宣稱通過）**：本輪 merge 的部署在 10:57:07 完成；10:57:06 起另一個 PR #341（`56f7a238`）的部署接手，正式站前進到 `56f7a238`，之後還有 `5744e48c`、`3f0d4760`。`8fbfe082` 的 `Website QA`（run [42803248261](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42803248261)）從 11:04:33 起停在 `Wait for published assets and content`，到本紀錄寫下時（11:20Z）仍在等，沒有裁決。

這個等待本身是一項可重現的新證據，與本輪主題同類：

- 本輪 merge **沒有改動任何會被發布的檔案**。以 `publicationChangeList(<merge 的 base>, 8fbfe082…)` 實算，回傳 `{"known":true,"entries":[]}`——18 支 workflow、`SITE.md`、`docs/qa/…`、2 支測試都不在 `PUBLISHABLE_FILE` 內。
- 也就是說這次 push 沒有「變更的位元」可驗，而 live 已經是它的後代；最省事的正確結論是「沒有東西要驗，通過」。實際卻是等滿視窗。
- 影響不只一個 run：`website-qa.yml` 的 `concurrency` 是 `website-qa-${{ github.ref }}` 且 main 上 `cancel-in-progress: false`，所以 `56f7a238` 的 `Website QA` 一直排在這一個後面，main 的發布裁決被一個「什麼都沒發布」的 merge 佔住。

機制待下一輪確認（屬於推論，本輪未證明）：`tests/published-version.cjs` 的 `sameContent()` 會把 live 的 `catalog.json`／`corpus.json` 與 `index.html`／`assets/*.js|css|json` 跟**這次 push 自己的建置**逐項比對；只要後續 merge 動到其中任何一項（#341 動了 `templates/case.md` 與相關檔案），live 就永遠不會等於這次建置，於是等滿 60 分鐘。
