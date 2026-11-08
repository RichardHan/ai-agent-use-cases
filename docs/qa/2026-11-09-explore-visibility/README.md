# 2026-11-09 探索區可見性：輸入問題後，第一張卡要留在同一畫面

## 問題與讀者

正式站首頁的篩選面板在寬螢幕預設展開（`#filter-options` 高 787px）。面板位於搜尋框與結果卡之間，於是「輸入問題」與「看到答案」被一整屏的篩選選項隔開。

實測（`before-measurements.json`，1440×900，Chromium，`reducedMotion: reduce`）：

| 狀態 | 搜尋框（視窗座標） | 結果行 | 第一張卡 | 同屏可見卡數 |
| --- | --- | --- | --- | --- |
| 修改前，載入首頁 | y=1528（頁面座標） | y=2470 | y=2552 | — |
| 修改前，按「直接搜尋案例」輸入「會議」 | y=259 | y=1448 | y=1576 | **0 / 24** |
| 修改後，同一操作 | y=259 | y=714 | y=842 | **3 / 24** |

手機（390×844）在本輪前後都維持收合，搜尋框到第一張卡的版面距離 252px → 253px（差異來自首頁隨機抽卡案例的高度，不是程式路徑）。

目標讀者：在筆電上第一次到站、心裡已經有一個問題（例如「會議」）卻不知道工具名稱的人。修改前他們看得到「目前條件有 26 筆結果」這句話，卻看不到任何一張卡，必須自己往下捲過 787px 的篩選選項。

## 兩個方案

- **A（採用）沿用站上既有的可見性判斷，延伸到一般首頁載入。** `revealSearch()` 早就有「抵達時若結果行不在視窗內就收合面板」的規則，但只在帶查詢參數的分享連結觸發。把同一判斷抽成 `compactFiltersForResults()`，一般載入（無查詢、無 `#explore`）在第一次渲染後套用；面板保持一鍵可開，已套用的篩選值、焦點、返回狀態都不動。
- **B 全面預設收合，或用固定斷點（例如 `max-height`）決定。** 改動較小、行為可預測，但對「結果其實看得見」的高視窗反而多收一層，也與既有 arrival 測試的語意不一致（`tests/search-arrival-space.test.cjs` 已鎖定「結果放得下就保持展開」）。

選 A：它讓「面板開不開」由讀者實際能不能看到結果決定，而不是由裝置寬度決定；改動集中在 1 個 JS 檔的 3 個函式與 1 段註解。

## 改動

- `assets/app.js`
  - 新增 `compactFiltersForResults(base)`：面板展開、焦點不在面板內、結果行底部超過 `innerHeight-24`（抵達時再加上 `#explore` 頂端位移）才收合。
  - `revealSearch()` 改用它；原本只看 `#explore` 相對位置的算式搬進 helper。
  - `finishArrival()` 在「一般載入、讀者尚未互動」時也套用一次；任何互動（`allowAutomaticArrival=false`）都不會再動面板。
- `tests/search-arrival-space.test.cjs`：fixture 增加 `hash` 與可選查詢參數，新增「一般載入：結果行在畫面外才收合、已在畫面內保持展開、且不移動焦點或捲動」。
- `tests/explore-visibility-browser.cjs`：1440×900、1280×800、1440×2600、390×844 四種視窗，輸入「會議」後第一張卡必須在視窗內、焦點留在搜尋框、summary 一點就能展開篩選控制；面板若維持展開，結果行必須仍在畫面內。
- `tests/mobile-search-browser.cjs`：原本以 `open === width > 760` 斷言面板預設狀態；改為由當下版面重新推導「展開後結果行是否仍在畫面內」，並在選篩選前先按 summary 展開（桌面現在也預設收合）。
- `.github/workflows/website-qa.yml`：在 updated-site 階段執行 `tests/explore-visibility-browser.cjs`。

## 驗收

- 先紅後綠：修改前 `tests/explore-visibility-browser.cjs` 失敗於 `laptop: first matching card is off screen at 1491px (viewport 900px)`；修改後四種視窗全過：laptop 第一張卡在 760–810px（首頁抽卡高度隨機）、同屏 3 張；1440×2600 維持展開且結果行仍在畫面內。（`EXPLORE_VISIBILITY` 會印在 CI 日誌。）
- 單元測試 507 項全過（506 + 新增 1），`node --check assets/app.js` 通過。
- 受影響瀏覽器流程（本機實際執行）：`discovery-browser`（含 mobile-search，桌面 `firstResultFromSearch` 291，與手機 252、小手機 248 同級）、`results-batching`、`search-submit-history`、`visitor-problem`（axe 0）、`mobile-problem-tags`、`compound-split`、`sentence-fallback`、`search-expansion-consistency`、`short-sentence`、`reader`（含 WebKit）、`related`、`search-context`、`reader-search`、`source-guide` 全數通過；`reading-flow-browser` 在本機 1440 於 `.research-details` 展開斷言失敗，同一支測試對修改前預覽也以相同行號失敗，判定為本機環境既有問題，交由 CI 判定。
- 三個必要情境重走：首頁任務標籤 → 搜尋（結果卡在 755px 可見）；搜尋＋情境＋門檻＋工具造成 0 筆 → 空結果提供「移除提及工具 → 查看 2 筆」並保留其他條件；手機 `?q=旅遊&scenario=生活&case=UC-001` 直鏈開啟詳情、來源固定於 `e5043ec`、關閉後查詢與情境仍在（22 筆）、焦點回到結果數。
- 截圖：`before-*`／`after-*` 同尺寸、同資料狀態（皆為輸入「會議」後），另有 landing 狀態與 `*-measurements.json`。

## 限制

- 本輪量的是版面幾何與可見卡數，沒有真人使用研究；「同屏看到 3 張卡」不等於採用率或滿意度提升。
- 桌面搜尋框仍是第 81 個 tab stop（53 個任務連結在前），本輪未改；首頁在 1440×900 的第一張卡仍在 2 個視窗以下，手機搜尋框仍在頁面 y≈2,800。
- 手機截圖的高度差異來自隨機抽卡案例（每次載入不同），不是本輪改動；因此手機結論以「搜尋框到第一張卡的版面距離」比較。
- 只在 Chromium 量測；Firefox／WebKit 由 CI 的其他工作流程涵蓋，本輪未逐一重跑。
