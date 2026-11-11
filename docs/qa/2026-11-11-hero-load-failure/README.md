# 2026-11-11 載入失敗時，手機首屏看起來像一個正常的案例庫

## 基準

- 開發基準 `origin/main` `d19eceac`（PR #372「發布閘門改用 live 自己宣告的 revision」已合併）。隔離 worktree `/private/tmp/aiuc-1111-r22`（分支 `improve/20261111-round22`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 三百餘個 commit，另有 159 個未追蹤檔（皆已在 origin/main）；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`（`d19eceac`）**733 通過／0 失敗**。
- 正式站開工時 `catalog.json.sourceRevision` = `d19eceac…`、`bundleRevision` = `20261111004308624675403`、512 個來源檔、畫面 515 筆。
- Actions 現況重新確認（不沿用歷史敘述）：main 最近 100 次 run 93 success／5 failure／3 cancelled。5 次失敗中 2 次是 `Website QA` 發布閘門的誤判（#372 已修並合併），3 次是 Pages 自身 `deploy`（`Timeout reached, aborting!`、`Deployment cancelled.`）。`_config.yml` 已把 `docs/`（3,845 檔、326MB）排除於 Pages 產物之外，正式站 `docs/` 回 404——「產物 98% 是 QA 截圖」是已修掉的歷史，不是本輪風險，也沒有重複處理。

## 問題證據

目標使用者是**手機上第一次打開本站、但案例資料沒載入成功的人**。這一頁在載入失敗時沒有說實話：

- 用 Chromium 攔掉 `catalog.json`（`route.abort()`）重現，正式站同一份程式（`d19eceac` 的 preview 建置）：
  - **390×844**：`#draw-status`（「案例卡暫時無法載入…」）在 **1324px**、`#error`（`role="alert"`，含「重新載入」與索引連結）在 **2308px**、`#results-count` 是「載入未完成」但在視窗外。首屏（844px）只有 hero：「今天，想讓 AI 幫你哪件事？」＋「直接搜尋案例」＋53 個任務連結，與正常載入完全一樣。
  - **320×640**：`#error` 在 2383px；連 hero 底部那句靜態的「載入較慢時，可先在本站閱讀完整案例索引」都在 **704px**（視窗外）。首屏沒有任何一個字提到失敗。
  - **1440×900**：`#draw-status` 在 335px，桌機首屏看得到失敗訊息——所以這個缺陷是手機專屬。
- 失敗後的行為並不靜默：點任務連結會捲到結果區，看到 `#error` 的 assertive 訊息（實測 `scrollY` 2162–2288，錯誤塊進入視窗）。問題在**第一眼**：訪客在被告知之前，已經先把 53 個任務當成可用入口。
- 唯一在首屏的提示（390px 的 `.hero-index-fallback`）寫的是「載入較慢時」——把一次失敗描述成慢，而且它指向的索引本來就不提供全文搜尋與篩選，讀者不會知道「現在這一頁不能用」。
- 相關程式：`load()` 的 `catch` 只更新 `#discover`／`#explore`／`#error` 三個區塊（`assets/app.js:4618-4626`），hero 是純靜態標記，沒有任何錯誤插槽。

## 兩個方案

- **A（採用）在 hero 內、搜尋入口下方補一個只在失敗時出現的說明區塊。**
  - 做法：`index.html` 新增 `#hero-load-failure`（預設 `hidden`），沿用 `.partial-load` 的警示配色，文字只說三件事：資料沒載入、下面搜尋會沒有結果、任務捷徑還不能用；兩個出口是「重新載入」（呼叫與 `#retry` 同一個 `load()`）與「先在本站閱讀完整案例索引 →」（`INDEX.html`，靜態檔，不受目錄載入影響）。`load()` 開始時一律隱藏，`catch` 內顯示。
  - 價值：手機首屏就說出失敗與下一步，不必先點一個註定失敗的任務。桌機不受影響（原本就看得到），正常載入零變化（`[hidden]{display:none}`）。
  - 成本：`index.html` 1 個區塊、`assets/style.css` 8 行（沿用既有警示色票）、`assets/app.js` 3 行、1 支瀏覽器回歸、workflow 1 行。
  - 取捨：失敗時頁面上會有兩段文字（hero 的摘要與結果區的 `#error`）。hero 這段**不新增** live region，避免在同一個失敗上再疊一次主動宣告；既有的 `#error`（`role="alert"`）仍負責 assertive 宣告，`#results-count` 與 `#draw-announcer` 的 polite 更新也照舊。代價是它本身不會被主動宣告。
- **B 把 `#error` 區塊搬進 hero 或複製一份。**
  - 同一段文字出現在兩個位置，兩邊都可能被維護成不同版本；而且失敗後點任務連結仍需要結果區的錯誤說明。不採用。
- **C 失敗時自動捲到錯誤區。**
  - 讀者正在讀 hero，卻被搬走 1300–2300px；本庫前幾輪已明確避免用捲動搶走讀者（#370 的接手事件）。不採用。

## 改動

- **`index.html`**：`.hero-search-actions` 之後新增 `#hero-load-failure`（`hidden`），內容為一句粗體結論＋一句後果說明，加「重新載入」與索引連結。
- **`assets/style.css`**：`.hero-load-failure`／`.hero-load-failure-actions`（沿用 `.partial-load` 的暖色警示：`#fff5e6`／`#b89c72`／`#94632b`），44px 觸控高度、可換行。
- **`assets/app.js`**：`load()` 起始時 `$('hero-load-failure').hidden = true`（重試也會先收起）；`catch` 內顯示，並註明為什麼要放在 hero（引用了 2308px 的量測）。
- **`tests/hero-load-failure-browser.cjs`（新增）**：三種尺寸（1440×900／390×844／320×640）用 `context.route` 攔掉 `catalog.json`，斷言 (1) 說明區塊整個落在首屏內、文字名稱失敗並說明搜尋會沒有結果；(2) 失敗由 `#error` 的 `role="alert"` 宣告，hero 摘要不是第二個 live region；(3) 「重新載入」在首屏、索引連結指向 `INDEX.html`；(4) 恢復連線後按「重新載入」→ 說明消失、`顯示 N / M 筆收錄` 出現、無 pageerror；(5) 正常載入時說明不存在、53 個任務連結仍在；(6) 兩種狀態都無水平溢出、axe（wcag2a/2aa/21aa）零違規。
- **`.github/workflows/website-qa.yml`**：在既有 arrival 步驟後加一行 `HERO_FAILURE_URL=… node tests/hero-load-failure-browser.cjs`，沿用既有 preview server 與 `tests/**`／`assets/**`／`index.html` 路徑篩選。

## 測試

- 先紅後綠（同一支新測試、兩個 preview 建置）：
  - 基準 `d19eceac`：`HERO_FAILURE_URL=<base> node tests/hero-load-failure-browser.cjs` → **exit 1**，`desktop: the failed load is stated on the first screen (notice null of 900; the deeper error block starts at 1819)`。
  - 本輪：**exit 0**，三種尺寸全過。
- 本輪實測（Chromium 1.56.1／Playwright，本機 preview，`catalog.json` abort）：

| 尺寸 | 說明區塊位置 | 首屏內 | `#error` 位置（基準／本輪） | 重新載入後 | 正常載入 |
| --- | --- | --- | --- | --- | --- |
| 390×844 | 408–547px | 是 | 2308px → 2447px | 說明隱藏、`顯示 515 / 515` | 說明不存在，hero 1045px |
| 320×640 | 390–583px | 是 | 2383px → 2576px | 同上 | 說明不存在，hero 1166px |
| 1440×900 | 541–656px | 是 | 1819px → 1933px | 同上 | 說明不存在，hero 1252px |

說明區塊出現時，下方的 `#error` 會再往下推約 110–190px，所以「第二次說明」只會更遠；這也是為什麼第一屏的那一句必須存在。

- 單元：`node --test tests/*.test.cjs` 733 通過／0 失敗（本輪未新增單元測試：可見度由載入失敗分支驅動，用真瀏覽器量測，不以假 DOM 複製實作）。
- 鄰近瀏覽器回歸（同一份 preview）：`search-reveal-settle`、`arrival-summary-visibility`、`mobile-problem-tags`、`task-coverage-marker`、`keyboard-search-entry`、`result-count-honesty`、`discovery`（含 loading／error/retry 狀態）、`publish-window`、`scenario-reset-persistence`、`explore-visibility` 皆 exit 0；`search-reveal-settle` 曾在先前一個未採用的版本（在結果列新增按鈕）下變紅，該版本已整個撤回，本輪改動不影響該流程。

## 截圖

同一頁、同一尺寸、同一狀態（`catalog.json` abort、載入失敗後的落地頁），改動前後對照：

- 390×844：[前](before-390.png)／[後](after-390.png)
- 1440×900：[前](before-1440.png)／[後](after-1440.png)

（本機無法讀取影像內容，幾何與 axe 的結論不依賴截圖；截圖供人工目視。）

## 獨立審查

由另一個 agent（fresh context、只讀，未參與實作）依本紀錄、`git diff` 與實測檢查。結論 **ship**，沒有找到本次改動引進的正確性阻擋；逐項證據：

| 項目 | 審查結果 |
| --- | --- |
| 可見度生命週期 | `load()` 起始隱藏（`app.js:4481-4483`）、`catch` 顯示（`4620-4637`）、`finally` 不動它；部分載入（1 個來源失敗、514 筆）與補讀成功都保持隱藏；兩次失敗後再成功才收起 |
| 文案正確性 | `catch` 涵蓋目錄抓取／HTTP／JSON／空目錄與「沒有任何成功條目」；該分支清空卡片、把 `#results-count` 設為「載入未完成」並停用送出，因此「下面搜尋會沒有結果、任務捷徑還不能用」成立；`INDEX.html` 不在 `_config.yml` 的排除清單，正式站回 200 |
| 無障礙 | hero 摘要沒有 role／`aria-live`，焦點不跳動，Tab 依序到「重新載入」與索引連結；axe 0；對比量測 9.75:1（文字／連結）與 10.52:1（按鈕） |
| 測試品質 | 同一支測試對基準 preview **exit 1**、本輪 **exit 0**（三種尺寸）；斷言的是訪客看得到的文案、位置、恢復與可用控制 |
| 回歸風險 | 正常載入時 hero 高度與任務目錄幾何完全相同（1252／1045／1166px，53 個連結）；新 CSS 區塊沒有後續覆蓋規則；workflow 有實際呼叫新測試 |

審查提出的兩項修正已納入本紀錄：hero 摘要「只宣告一次」的講法不準確（同一失敗另有 `#results-count`／`#draw-announcer` 的 polite 更新），以及深層連結失敗時 hero 摘要會落在視窗外（該情境本來就有可見的 `#error`）。審查未能驗證：本輪產物的 Jekyll 建置、實機螢幕閱讀器語音、既有瀏覽器套件全跑（本輪另行跑過其中十支）。

## 已知限制

- 失敗時頁面會有兩段文字：hero 的摘要與結果區的 `#error`。前者不新增 live region，但這個失敗狀態本來就會同時更新 `#error`（assertive）與 `#results-count`／`#draw-announcer`（polite）——所以「只宣告一次」是不準確的講法；本次沒有新增宣告，也沒有做實機螢幕閱讀器測試（實際語音行為未驗）。
- 失敗的**深層連結**（例如 `?q=旅遊#explore`）會走既有的抵達流程捲到搜尋／結果區，hero 的摘要因此落在視窗外（實測 `#error` 在 307–643px 可見）；那種情況本來就有可見的錯誤說明，本輪沒有改。
- 新測試沒有斷言「部分來源缺漏」與「連續兩次失敗後再成功」；這兩種狀態由本輪另外的 Chromium 探測確認（部分載入時說明保持隱藏、514 筆照常顯示 `#partial-load`；連續失敗仍顯示說明、之後成功才收起）。
- 本機無法讀取截圖影像（`Image reading is disabled`），視覺結論來自 DOM 幾何、無水平溢出與 axe；截圖存於 `qa-artifacts/hero-load-failure-*.jpg`。
- 只量測 Chromium。多引擎由 PR 上既有的其他流程覆蓋，本支新測試只宣告 Chromium。
- 只處理「整個目錄載入失敗」；部分來源缺漏走既有的 `#partial-load` 與結果行括號說明，本輪沒有改。
- 索引連結指向 `INDEX.html`：Preview（`scripts/preview.py`）不產生這個檔，本機 preview 點下去會 404；正式站由 Jekyll 產生（後續發布驗證會實測）。

## 下一輪

（發布後補記）
