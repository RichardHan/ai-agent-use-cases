# 2026-11-17 語料命中與任務目錄改為下限

## 問題與使用者

維護者新增一篇案例時，Website QA 的 unit suite 不該因為快照計數轉紅。正式站與本輪基準都是 `eeae3efb`。

`tests/problem-compound-queries.test.cjs` 把活語料釘死：「一次性」必須剛好 31 筆、「一次性 密碼」必須剛好 17 筆。在隔離 worktree 暫時加入一篇提到這兩個詞的案例後，`node --test tests/problem-compound-queries.test.cjs tests/mobile-problem-tags.test.cjs` 為 exit 1：`32 !== 31`（`red-before.txt`）。同一則測試在 31 失敗後沒有執行到 17；分開重算，暫時案例會讓 17 變成 18。刪除暫時案例後工作樹不含該檔。

`tests/mobile-problem-tags.test.cjs` 的 53 不是語料命中。它數 `index.html` 的任務連結。暫時案例沒有讓它失敗。同契約還釘在三支瀏覽器測試：`healthy.tasks === 53`、`total === 53`、`links.length === 56`（53 個任務加 3 個範例）。新增一個任務連結會讓這四處一起轉紅，但契約是「不可少於」，不是「永遠 53」。

## 方案

- ①只改 31／17。成本最低，但 53 的四處精確斷言仍會在目錄成長時轉紅，unit 與 browser 各說一套。
- ②四處都改成下限，並加靜態守則：禁止把這兩個語料變數或任務目錄的 53／56 改回 `assert.equal`；下限不得低於本輪觀察值（31、17、53）。三個範例連結仍必須剛好 3 個。

選 ②。不改案例原文、搜尋語意或畫面。`index.html` 按鈕初值仍寫「顯示全部 53 個任務」；沒有 JS 時按鈕是 hidden，有 JS 時改寫成實際連結數。本輪不改那句靜態文字。

不處理：`search.test.cjs` 仍把 `UC-001` 的活語料命中釘成 9。那不是任意新案例都會踩到的詞，留到下一輪之前先確認是否應改成下限。`source-guide-qa.yml` 與 `return-visibility-qa.yml` 的 `published` job 雖是 75 分鐘，但 push 觸發都不含 `main`，目前不會在主線執行。

## 驗收

- 改前：暫時案例讓 `一次性` 斷言 `32 !== 31`，exit 1。改後同一暫時案例，這三支測試 exit 0；重算為 32 與 18，都高於下限。
- 守則對把 `>=` 改回 `assert.equal` 的記憶體內 diff 轉紅；對 `>=` 通過。三個範例連結的精確斷言保留。
- `node --test tests/*.test.cjs`：**907 pass／0 fail**（基準 904，加 3 項守則）。沒有 package lint 或 typecheck script。
- 正式站 `eeae3efb`（本輪沒有產品檔變更）1440×900／390×844：會議入口 29／532、`旅遊 xyz987`＋開發 0／532 後以「會議整理」回到 29／532、`?case=UC-016` 開啟詳情、來源連到 `eeae3efb` 的案例檔、關閉後回到 532／532。pageerror 0、無水平溢出。主題分類選項 363（含「全部分類」）。截圖在 `live-before/`。未逐像素目視、未用實體手機或讀屏、未跑 Firefox／WebKit。

## 下一輪

先量「主題分類」在 1440／390 的選單：本輪正式站已量到 363 個 option。程式把分類原文整段當一個選項，361 個只對到 1 筆，提示只說明未宣告分類的條目不在選項內，沒有說明絕大多數選項是單篇。先決定加執行期形狀說明，或維持現狀並寫下不做的理由。先驗證：展開 `#category`，記錄選項數、單篇選項數，以及提示有沒有說到單篇。
