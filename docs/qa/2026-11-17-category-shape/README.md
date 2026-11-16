# 2026-11-17 主題分類形狀說明

## 問題

正式站 `6edbb6ca` 的 `#category` 有 363 個 option（1 個「全部分類」＋ 362 個分類原文）。其中 361 個的目前筆數是 1，只有「工作流程／發布期用途」是 6。提示只寫「165 個未宣告分類的條目不在選項內」，沒有說這些選項不是共用主題清單。

目標使用者：打開「主題分類」想找一組相關做法的人。分類值是各案例頁自己寫的 `- 分類：`，不是本庫整理的主題樹。

## 方案

- 採用：執行期從已載入條目重算形狀，寫進既有 `#facet-count-hint`，並在有符合筆數的 optgroup 標出目前只對到 1 筆的選項數。不寫死 362／361。查詢改變時，說明仍算全部已載入條目；optgroup 的「只對到 1 筆」跟選項前的數字一樣，只算目前條件。
- 不採用：把自由句分成階層。361／362 各只出現一次，分層會編成一套頁面沒有宣告的主題樹。

## 量測

同一句說明、無水平溢出。提示高度是整段 `#facet-count-hint`，不是只量新增的句子。

| 尺寸 | 改前提示高 | 改後提示高 | 溢出 |
| --- | --- | --- | --- |
| 1440×900 | 88px | 110px | 無 |
| 390×844 | 331px | 398px | 無 |
| 320×640 | 420px | 508px | 無 |

改前截圖：`before-desktop-facet.png`、`before-phone-facet.png`、`before-narrow-facet.png`。改後：`after-*-facet.png`。三情境：`desktop-s*.png`、`phone-s*.png`。

## 驗收

- `node --test tests/*.test.cjs`：913 pass／0 fail（基準 907，本輪 +6）。
- `CATEGORY_URL=http://127.0.0.1:8097/ai-agent-use-cases/ node tests/declared-category-browser.cjs`：1440／390 皆 `shape 362/361`、篩選「工作流程／發布期用途」6 筆、axe 0。
- 空結果 `?q=xyz987` 的 optgroup 是「目前 0 筆（362 個選項）」，不把目錄的 361 貼上去；提示仍寫已載入的 362／361。
- 三情境（preview，1440／390）：「會議」29／532；`?q=xyz987&scenario=開發` 為 0／532，點「會議整理」後查詢變「會議」、結果 3／532（情境篩選仍在）；`?case=UC-016` 開啟、來源指向 `6edbb6ca`、Escape 後對話關閉。pageerror 0。
- 鍵盤：第一次 Tab 仍停在「跳到案例搜尋」。`#category` 的 `aria-describedby` 是 `facet-count-hint`，該段含新說明。沒有在 25 次 Tab 內走到選單，英雄區連結本來就多，本輪沒有新增停點。

## 限制

preview 不是 Jekyll。未用實體手機、讀屏、Firefox／WebKit。影像未逐像素目視。正式站發布收據見 PR 留言，不在這份 preview 紀錄裡宣稱已發布。

同輪把 `source-guide-qa.yml` 與 `return-visibility-qa.yml` 的 `published` job 由 75 分改為 80 分，對齊 60 分等待加 20 分安裝／瀏覽器。這不是目前失敗的 run；最近 main 的 Website QA／Pages 在檢查當下是成功或仍在跑，沒有把歷史失敗當成現況。
