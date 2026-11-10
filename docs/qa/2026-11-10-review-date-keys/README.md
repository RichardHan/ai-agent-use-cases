# 2026-11-10 「頁首核對」只認得九種寫法中的八種，`本次增補查證` 的日期整段沒讀到

## 基準

- 開發基準 `origin/main` `ee68c19d`（開工時 `180e00ca`，工作期間 main 前進兩個 docs commit：`06a13b75` 記錄 dead-end coverage 輪、`ee68c19d` 記錄自己的部署）。隔離 worktree `/private/tmp/aiuc-1110-r16`（分支 `improve/20261110-round16`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 三百餘個 commit，另有未追蹤的研究檔與 QA 產物（逐一核對存在於 `origin/main`）；本輪未觸碰、未 reset。
- 基準 `node --test tests/*.test.cjs`（`180e00ca`）：**684 通過、0 失敗**；`node --check assets/app.js` 通過。
- Actions 現況重新確認（未沿用歷史敘述）：main 最近 6 次 run（`ee68c19d`、`06a13b75`、`180e00ca`、`e23c1948`、`9de2d070`）全部 success；最近 100 次 run 為 56 success、40 cancelled、4 進行中、**0 failure**。`180e00ca` 的 `Website QA` [42790949128](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42790949128) success。所以 CI 本輪不是阻礙，未納入本輪主題。
- 正式站 `catalog.json.sourceRevision` = `180e00ca`（開工時）→ `06a13b75`（中途）→ `ee68c19d`，515 筆、512 個來源檔。
- 未重複既有工作：PR [#340](https://github.com/RichardHan/ai-agent-use-cases/pull/340)（PR 閘門覆蓋）仍是 OPEN、未合併，本輪不動 `.github/workflows/`。

## 問題證據

目標使用者是**用「頁首核對」這個日期判斷案例新不新、該不該相信的訪客**，以及用首頁「最近核對的內容」找新東西的回訪者。

`assets/app.js` 的 `reviewDate()` 只讀頁首的固定欄位清單。全庫 508 個案例頁 + 3 篇 evidence 的頁首欄位實測有 **9 種**帶查證動作的寫法，其中 `- 本次增補查證：` 不在清單裡，9 頁寫了它、**沒有一頁被讀到**。它不是正文補充，是本庫自己寫的「這次只補核新增來源」：

```
cases/183-ad-campaign-configuration-review.md:3
- 本次增補查證：2026-10-25 09:05（台灣時間）；只核新增來源，未重驗全案。
cases/183-ad-campaign-configuration-review.md:11
- 查證日期：2026-10-17台灣（2026-10-16 UTC）
```

同一頁自己寫了 10-25，畫面卻印 10-17——**同一區塊自相矛盾，差 8 天**。基準預覽實測（`?case=…`，Chromium 1440×900／390×844 同值）：

| 頁面 | 頁首核對（改前） | 頁面自己寫的增補查證 | 差 |
| --- | --- | --- | ---: |
| UC-005 | 2026-10-13 | 2026-10-20 | 7 天 |
| UC-071 | 2026-10-17 | 2026-10-22 | 5 天 |
| UC-183 | 2026-10-17 | 2026-10-25 | 8 天 |
| UC-235 | 2026-10-18 | 2026-10-20 | 2 天 |
| UC-354 | 2026-10-19 | 2026-10-20 | 1 天 |
| UC-017／UC-034／UC-382 | 與增補同日 | — | 0 |
| UC-066 | 2026-11-10 | 2026-10-21 | 0（另有更新的查證日） |

同一個錯誤日也餵給 `?sort=reviewed`（首頁「最近核對的內容 →」）。全 515 筆的實際名次（`orderEntries(filterEntries(entries,[],{}),[],'reviewed')`）：

| 頁面 | 改前名次 | 改後名次 | 改前→改後日期 |
| --- | ---: | ---: | --- |
| UC-183 | 312 | 62 | 2026-10-17 → 2026-10-25 |
| UC-071 | 255 | 97 | 2026-10-17 → 2026-10-22 |
| UC-005 | 494 | 139 | 2026-10-13 → 2026-10-20 |
| UC-235 | 210 | 148 | 2026-10-18 → 2026-10-20 |
| UC-354 | 201 | 150 | 2026-10-19 → 2026-10-20 |

## 兩個方案

- **A（採用）把寫法登錄進讀取清單，並讓未登錄的寫法變成紅燈。**
  - 做法：把原本寫死在 `reviewDate()` 內的正規表達式抽成常數 `REVIEW_DATE_KEY`，加入 `(?:本次)?增補查證`；新增 `tests/review-date-keys.test.cjs`，逐檔掃描頁首，任何「欄位名含 查證／查閱／核對／查核 且該行有有效日期」的欄位，只要 `reviewDate()` 讀不到就失敗，並列出檔案、欄位與期待日期。
  - 價值：日期回到頁面自己寫的值；並且**下一種新寫法不會再無聲消失**——沒被讀到的欄位在畫面上沒有任何提示，只有測試會講話。
  - 成本：`app.js` +8 行（含註解）、1 支新測試（2 項，約 120 行）、`README.md`／`templates/case.md` 各一句。
  - 取捨：接受「增補查證」與 `最近查證` 同等對待（兩者都是本庫對這一頁做的查證，只差範圍）。這不是新語意：`cases/066` 早就用 `首次收錄／最近查證：…（只核新增來源）` 並被讀成頁首核對日，本輪只是讓同一句話的另一種寫法得到相同待遇。
- **B 用泛用規則（欄位名以查證／查閱／核對／查核結尾就算）取代白名單。**
  - 少一次維護，但會把「來源的查證」一起收進來：`- 補充來源查證：2026-10-23` 這類寫法會被讀成這一頁的核對日，等於用泛用性換來**高估**。`reviewDate()` 現有的第二條路徑（同一行日期欄位裡的「；查證 2026-10-16」）就必須逐句排除「補充來源」，同樣的排除在這裡沒有辦法寫得比白名單更短。
  - 不採用：本輪要修的是「無聲」，不是「少一行清單」。改成泛用規則會把無聲的漏讀換成無聲的高估。

沒有採用 SITE.md 列為第一優先的「範本章節標題進索引」：那一項的已知代價是 128 個真的提供提示詞的案例只因章節標題才命中（`提示詞` 313→185），需要先把「章節標題」與「標題本身就是內容」分開，範圍與回歸面都大於本輪。

## 改動

- **`assets/app.js`**：新增 `REVIEW_DATE_KEY`（把原本 `reviewDate()` 內的行內正規表達式原樣搬出，僅加入 `(?:本次)?增補查證`），`reviewDate()` 改用該常數。其餘讀取規則、`notReviewed` 否定句防護、`## ` 之後不算頁首、`fileReviewDate()` 全部未動。
- **`tests/review-date-keys.test.cjs`（新，2 項）**：
  1. 逐檔逐行掃 `cases/`＋`evidence/` 的頁首，任何帶查證動作且有日期的欄位都必須被讀成該行最新日期；失敗訊息直接寫「把寫法加進 `REVIEW_DATE_KEY`，或明確教 `reviewDate` 跳過並寫下理由」。並斷言今天的 9 個寫法都真的被掃到（避免空轉）。
  2. 9 個寫 `本次增補查證` 的頁面，頁首核對不得早於它自己寫的增補日期。
- **`tests/recent-review.test.cjs`**：欄位清單加入 `本次增補查證`／`增補查證`，並用 UC-183 的真實兩行（增補 10-25 + 查證 10-17）斷言取 10-25。
- **`README.md`**：`頁首核對` 段落補上 `本次增補查證` 也讀、取最新一個，並寫明新增寫法必須登錄，否則只會讓日期停在較舊的值。
- **`templates/case.md`**：`首次收錄／最近查證` 欄位說明補上補核新增來源時該怎麼寫，以及新寫法要同步 `REVIEW_DATE_KEY`。

搜尋索引未動：`reviewedDate` 不在 `searchText` 裡，`?q=` 筆數不變（見下方實測）。

## 測試

- `node --test tests/*.test.cjs`：基準 `180e00ca` **684 通過／0 失敗** → 本輪 **686 通過／0 失敗**（+2）。`node --check assets/app.js` 通過。
- **先紅後綠**：把 `REVIEW_DATE_KEY` 還原成舊清單（移除 `(?:本次)?增補查證|`），新的 2 項**都失敗**（`fail 2`）；還原後 `pass 2`。所以新測試不是空轉，`git status` 也只回到本輪預期修改的檔案。
- 既有審查型測試未被弱化：`tests/recent-review.test.cjs`（6 項）與 `tests/recent-review-corpus.test.cjs` 的「每個案例頁都有可讀的頁首核對日」等斷言全部照舊通過。
- 瀏覽器（本機 preview `8917`，與正式站同一套 `app.js` 邏輯）：`RECENT_URL=… node tests/recent-review-browser.cjs` **exit 0**（Chromium 1440／390／320、Firefox、WebKit，含 `?sort=reviewed` 逐批邊界比對與 axe）。兩次執行都通過。
- axe（`wcag2a`／`wcag2aa`／`wcag21aa`，詳情頁 UC-183／UC-071 × 1440／390）：改前改後皆 **0 違規**；水平溢出 0；pageerror 0。

## 三種訪客情境（改前 `8916`／改後 `8917`，數字逐一相同）

1. **不知道工具名，從問題找案例**：`?q=怎麼整理會議記錄` → 7／515，第一張卡 UC-071 可讀。
2. **組合搜尋後空結果並復原**：`?q=規劃旅行&scenario=工作` → 0／515，空結果提供「移除使用情境『工作』 → 查看 1 筆」，復原後有結果。
3. **開啟分享的詳情直鏈**：`?case=UC-024` → 詳情直接開啟、憑據 `作者報告／示範`、`頁首核對 2026-10-14`（本輪未改動這頁）、Escape 關閉後回到 515 筆清單。

搜尋筆數未變：`權限` 507、`怎麼整理會議記錄` 7、`規劃旅行&scenario=工作` 0 → 復原 1。

## 前後對照（同一頁面、同一尺寸、同一資料）

| 頁面 | 改前（`180e00ca` 預覽） | 改後（本輪預覽） |
| --- | --- | --- |
| `?case=UC-183` 1440×900 | [before-uc-183-desktop.png](before-uc-183-desktop.png) 頁首核對 2026-10-17 | [after-uc-183-desktop.png](after-uc-183-desktop.png) 頁首核對 2026-10-25 |
| `?case=UC-071` 390×844 | [before-uc-071-mobile.png](before-uc-071-mobile.png) 頁首核對 2026-10-17 | [after-uc-071-mobile.png](after-uc-071-mobile.png) 頁首核對 2026-10-22 |

版面无變化：本輪只改一個日期的值，沒有新增元素、字級、間距或顏色。

## 邊界情況

| 情況 | 結果 |
| --- | --- |
| 增補日期比原本的查證日期舊（UC-066：11-10 vs 10-21） | 取較新者，仍是 2026-11-10，不倒退 |
| 增補日期與查證日期同日（UC-017／034／382） | 值不變 |
| 頁首同時有 `本次增補查證` 與 `查證日期` | 取兩行中最新的有效日期 |
| `本次增補查證` 只寫「尚未查證」而沒有日期 | 沒有日期可收集，不影響結果 |
| 日期格式非法（`2026-02-30`、`2026-13-01`） | 仍被 `collect()` 的合法性檢查丟棄（既有測試覆蓋） |
| 查證寫在 `## ` 之後的正文 | 仍不算頁首核對（`reviewDate` 只看頁首，既有測試覆蓋） |
| 新增第 10 種寫法 | `tests/review-date-keys.test.cjs` 失敗並列出檔案、欄位、期待日期 |

## 獨立審查（未參與實作）

由另一個 agent context（`reviewer`，未參與實作，未看過本輪的實作過程）讀 diff、跑真實語料、在臨時副本上做 mutation。結論 **needs fixes**（1 項 P3 文件措辭，無功能缺陷）：

1. **（已修）README 對「未登錄寫法」的後果寫得不完整。** 原文只說「核對日會停在較舊的值」，但若這一頁沒有任何其他可讀的查證欄位，`reviewDate()` 回空字串，卡片與詳情改顯示「頁首未提供核對日」。審查用合成案例 `- 新增查證紀錄：2026-10-26` 實測 `parsed:''`、`detailFallback:'頁首未提供核對日'`。README 已改寫成兩種後果都寫出來；`templates/case.md` 也把測試保證限定成「欄位名帶查證動作且該行有日期」的欄位（只寫「尚未查證」而沒有日期的行不在掃描範圍）。

審查另確認（各附實跑）：

- **可證偽**：移除 `(?:本次)?增補查證|` → 新測試 2 項失敗；把 `collect()` 改成只讀每行第一個日期 → 語料掃描失敗（多日期行）。兩者都在臨時副本上做，未動工作樹。
- **沒有高估**：`grep` 找到的 9 行都是「只核新增來源、未重驗全案」，沒有同一欄位的否定句；與 UC-066 既有的 `最近查證（只核新增來源）` precedent 一致，徽章用「頁首核對」不是新增的誇大。
- **回歸面**：以 `node:vm` 分別載入 `180e00ca` 與本輪的 `app.js`，對 508 案例 + 3 篇 evidence + 4 筆待查逐筆比對 `reviewedDate`，**只有 5 筆改變**（UC-005／071／183／235／354），其餘 510 筆不變，5 筆都能對應到自己的 `本次增補查證` 行；沒有任何一筆變舊。我另外獨立重跑同一個比對，結果相同（changed 5、regressed 0、全庫最大值仍是 2026-11-10）。
- **下游**：`tests/index-freshness.test.cjs` 通過、`INDEX.md` 的「最新 2026-11-10」仍成立（因此本輪不需要改 `INDEX.md`）；515 筆的 `search` 字串前後完全相同，`reviewedDate` 沒有進入索引。
- **瀏覽器**：UC-183／UC-071 × 1440／390 於兩個 preview，徽章與卡片日期同步改變，**8 次執行全部 0 pageerror、0 水平溢出、0 axe 違規**（wcag2a／aa／21aa）。
- **測試品質**：`seen.has(...)` 不是空轉；把 `pages.length === 9` 改成第 10 頁會讓「同一批九頁」那條失敗——審查判定那是刻意的語料盤點斷言，不是解析缺陷。

審查未能驗證：Firefox／WebKit 的畫面（本輪只在 preview 跑既有 `recent-review-browser.cjs`，它本身涵蓋兩者）；Actions 上的實跑（由 PR 檢查提供，見下）。

## 已知限制

- 只驗 Chromium 的畫面（Firefox／WebKit 由 `recent-review-browser.cjs` 在 preview 上跑過，但那支是既有回歸，不是本輪新增的視覺斷言）。
- `本次增補查證` 的語意是「只核新增來源，未重驗全案」，徽章仍只寫「頁首核對 <date>」，沒有在徽章上區分「全頁重驗」與「只補核新增來源」。這是既有行為（UC-066 的 `最近查證（只核新增來源）` 早就如此），本輪刻意不改，以免在資料修正的同一輪引入新的文案語意。
- 首頁統計卡的「歷史批次嚴格合格 370/1,000」與本輪無關，未重算。

## 發布

- PR [#341](https://github.com/RichardHan/ai-agent-use-cases/pull/341)（head `4bb5803c`，base 當時的 main `8fbfe082`）：**13 項非略過檢查全部 success、0 failure**，兩個 `published` 依設計 skipped；`gh pr view` 的 `mergeStateStatus` 為 `CLEAN` 之後才合併。逐項：`Website QA`、`Reader QA`、`Reading flow QA`、`Partial Load QA`、`Source guide QA`、`Search context QA`、`Return visibility QA`、`Search relevance QA`、`Reader search QA`、`Home search entry QA`、`Related reading QA`、`Audit summary round QA`、`Round 23 acceptance QA`。
  - `Source guide QA` 的 `preview` job 跑了約 26 分鐘才 success（這個 workflow 最近的紀錄是 9–22 分鐘，屬既有耗時，不是本輪造成；同一支 job 的 7 個 suite 在本機對同一份 preview 逐一跑過，全部 exit 0）。
- squash 合併為 `56f7a238401a3d7eff1d217a574d382747763f6d`（2026-11-10T10:57:04Z）。
- `pages build and deployment` [42803418342](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42803418342)：`build` success、`deploy` success（10:58:05→11:02:33，**268 秒**），整個 run success。
- 正式站 `catalog.json.sourceRevision` = `56f7a238401a3d7eff1d217a574d382747763f6d`、`builtAt` 2026-11-10、512 個來源檔；`assets/app.js` 與本機 checkout **逐 byte 相同**（sha256 `8f9fea2655646620…`）。
- 正式站重走（1440×900／390×844，pageerror 0、水平溢出 0）：
  - `?case=UC-183` 頁首核對 **2026-10-25**（改前 2026-10-17）、`?case=UC-071` **2026-10-22**（改前 2026-10-17）、`?case=UC-024` 2026-10-14 不變。
  - `?sort=reviewed` 全 515 筆中 UC-183 名次 **62**（改前 312）。
  - 三情境：`?q=怎麼整理會議記錄` 7／515、`?q=規劃旅行&scenario=工作` 0／515、`?case=UC-024` 詳情直開且憑據與核對日可見——與改前逐一相同。

## 後續補記

- main 的發布閘門 `Website QA`（`56f7a238`）在寫這一段時仍在排隊，結果見下一次更新；正式站本身已用上面的 `sourceRevision`、逐 byte 比對與實際瀏覽另外核對過，不依賴該 run 的結論。

## 下一輪

先做**詳情頁的「探索更多「情境」案例 →」靜默清掉訪客的搜尋與篩選**（本輪調查到、已重現、尚未處理）：

1. 重現（本機 preview，Chromium 1440×900）：`?q=怎麼整理會議記錄`（7／515，目前條件列顯示「關鍵字：怎麼整理會議記錄」）→ 開第一張卡 UC-071 → 按詳情裡的「探索更多「工作」案例 →」→ 網址變成 `?scenario=工作`、查詢框清空、目前條件只剩「使用情境：工作」、結果變成 162／515，**沒有任何「已清除什麼」的提示**。
2. 成因：`scenarioExploreAction()`（`assets/app.js:1486-1499`）呼叫 `closeDetail()` 後直接重用首頁情境按鈕的 `chooseScenario()`（`assets/app.js:4400` 起），後者會把 `query`、`scenario`、`kind`、`difficulty`、`tool`、`category`、`proof` 全部清空。首頁那組按鈕的清空行為已在 README 寫明，詳情這顆是借用它的行為卻沒有借用它的說明。
3. 先做的驗證：在正式站走一次上面三步，確認 `#active-filters` 只剩情境、`#query` 為空；再跑 `tests/visitor-problem-browser.cjs`、`tests/detail-close-history-browser.cjs`、`tests/results-batching-browser.cjs`，確認修改不會動到既有的返回與批次行為。
