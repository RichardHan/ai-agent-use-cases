# 2026-11-10 死路裡的任務捷徑，與首頁說同一套話

## 基準

- 開工時 `origin/main` 為 `ee3dd6d7`（工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 仍停在 `90093d7b`、落後 main 三百餘個 commit，另有 159 個未追蹤的他人研究檔；本輪未觸碰）。
- 另一個未合併的 PR [#334](https://github.com/RichardHan/ai-agent-use-cases/pull/334)（搜尋索引不再納入本庫編輯註記）在本輪開工時處於 OPEN、13 項檢查全 success、`MERGEABLE`。本輪先在本地以該 head 重跑 `node --test tests/*.test.cjs`（675 通過／0 失敗）確認沒有回歸，再 squash 合併為 `e7aaabe8`，以它為本輪基準；本輪分支 `improve/20261110-round15`、隔離 worktree `/private/tmp/aiuc-1110-r15`。
- 基準 `node --test tests/*.test.cjs`（`e7aaabe8`）：**675 通過、0 失敗**；`node --check assets/app.js` 通過。
- 基準預覽 `/tmp/prev15-before`（`scripts/preview.py`，`catalog.json.sourceRevision=e7aaabe8…`）服務於 `127.0.0.1:8141`；本輪預覽服務於 `127.0.0.1:8140`。
- 本輪工作期間 main 又前進 4 個 commit（`#335`、`#337`、`#338`、`#339`，都在編輯註記索引這一區），分支已 rebase 到 `e23c1948`；rebase 後 `node --test tests/*.test.cjs` **683 通過／0 失敗**，死路面板仍是 55 個捷徑、7 個標記，量測數字與 rebase 前相同。
- Actions 現況以本輪當下的 run 紀錄確認（另見〈CI 現況〉一節），未沿用歷史敘述。

## CI 現況（重新確認，不沿用歷史敘述）

以 Actions API 取 7 天窗（`created>=2026-11-03`，2,668 筆逐日加總）與最近 1,000 筆 run 的原始日誌重查：

| 指標 | 26.4 小時窗 | 7 天窗 |
| --- | ---: | ---: |
| success | 781 | 2,183 |
| cancelled（全部是被同分支較新 run 取代） | 203 | 421 |
| failure | 15 | 62 |
| 有結論的成功率 | 98.1% | 97.2% |

- 62 筆失敗的分類：程式回歸 24、外部服務（上游 504）12、部署未完成 9、不穩定 10、併發取代 2、證據不足 4、測試缺陷 1。**最後一筆失敗是 2026-11-10T01:08Z**；`#323`（`docs/` 不再進 Pages 產物，02:07Z）與 `#331`（發布判決）之後 main 179 次執行 **0 失敗**，`pages build and deployment` 合併後 15 次 median 1.1 分鐘、0 失敗。
- 因此「Actions 經常出問題」目前**部分成立**：紅燈幾乎沒有（98.1%），但體感差有具體來源——每個 PR 有 13–14 個檢查、p95 9.8 分鐘、20.3% 的 run 被取消，且 8 個常駐 workflow 每次都在裸 runner 上重裝瀏覽器（實測 install 佔用該 job 76%／93%，例如 Reading flow QA `42686936893` 1,563 s、Home search entry QA `42694150667` 1,240 s；用預載 image 的 Reader QA／Search context／Return visibility 只要 3–4 秒）。

本輪**沒有**改 CI：問題是耗時與檢查數量，不是紅燈；而且 main 只剩 `website-qa.yml` 一道閘門，在與本主題無關的這一輪動它，回歸風險高於收益。已量測的窄修補（把 8 個裸 runner workflow 換成 `mcr.microsoft.com/playwright:v1.64.1-noble` + `HOME: /root`）留給 CI 專輪，並在〈下一輪〉之外另記於下方〈已知但未處理〉。

## 問題證據

目標讀者：**已經搜不到、正在找出路的人**。他剛剛打了一句話、得到 0 筆，畫面上唯一的下一步是這份任務清單。

上一輪（`docs/qa/2026-11-12-task-coverage/`）在首頁 53 個任務入口加上「僅相關詞」標記，判斷式是 `taskCoverage()`＝「有沒有案例在標題、用途或痛點自述在做這件事」。同一個判斷卻沒有接到空結果頁的任務捷徑，而那是同一個產品裡的第二個任務入口。

實測（本機預覽、`e7aaabe8`、`?q=幫我寫遺囑`、1440×900）：

| 任務捷徑 | 清單中的位置 | 點入後的結果頁 |
| --- | ---: | --- |
| 播客摘要 | 8 | 8 筆，`#match-scope=none` |
| 寫履歷 | 14 | 8 筆，`none` |
| 出差報銷 | 16 | 4 筆，`none` |
| 代碼重構 | 19 | 6 筆，`none` |
| 發票辨識 | 20 | 16 筆，`none` |
| 機票比價 | 23 | 5 筆，`none` |
| 隱私審查 | 45 | 64 筆，`none` |

7 個入口就在清單前段（第 8～23 位，只有一個在第 45 位），點入後第一行寫「在所選條件下，沒有案例的標題、用途或痛點同時包含「發票」「辨識」……不代表案例在做這件事」。也就是說：訪客在死路裡被遞上一張紙條，紙條把他帶到另一個死路，而**首頁早在同一輪就承認過這件事**。

另外 38 個入口都有案例自述在做，卻與這 7 個排在一起、外觀完全相同；清單下方那句「任務捷徑在目前篩選下有結果」講的是「有結果」，不是「有案例在做」，兩種狀態在畫面上無法區分。

## 兩個方案

- **A（不採用）把自述命中 0 的入口從空結果清單移除。**
  - 成本最低，但會刪掉 7 個真的會被搜到的任務詞（`隱私審查` 有 64 筆相關詞命中，`發票辨識` 16 筆），而上一輪刻意保留首頁入口並加上標記，就是選擇「不刪、只說清楚」。同一輪之內一邊保留一邊刪除，會讓兩個入口互相矛盾，也和 README 已寫的承諾相反。
- **B（採用）同一個判斷式接到第二個入口，並把有案例的排前面。**
  - 做法：`taskCoverage()` 增加可選的 `filters`，空結果清單的每個捷徑都用「目前篩選」再算一次（強制 `scope:'overview'`，與首頁、結果頁同一條規則）；自述命中 0 的捷徑加上與首頁相同的「僅相關詞」，並在清單下方出現說明行；這些捷徑在清單中移到所有「有案例自述」的後面（清單是 300px 的捲動框，前段才會被看到）。
  - 價值：訪客在死路裡第一眼看到的是真的有案例在做的任務；被標記的那些仍然可點、仍然說明點入會看到幾筆，不會再從死路走進第二個死路而不自知。
  - 成本：`assets/app.js` 一個函式簽章與約 30 行、`assets/style.css` 2 行、README 一句；風險集中在「兩個入口的順序與標記是否一致」，因此先寫測試再改。
  - 取捨：清單順序改變（7 個入口往後移）。它們仍然存在、仍然可點，只是不再排在有案例的任務前面——本輪認為這個順序本身就是一種承諾，改了有代價，但不改的代價是訪客先踩一次空。

沒有改搜尋語意、沒有改任何查詢字串、沒有刪除任何入口、沒有動結果頁的排序與篩選。

## 改動

- `assets/app.js`
  - `taskCoverage(items, query, filters = {})`：新增 `filters`，以 `{...filters, scope:'overview'}` 計算「自述命中」，`total` 仍用同一組篩選算全文命中。首頁呼叫端不傳，行為不變。
  - `cachedTaskCoverage(items, query, filters)`：以「語料陣列（WeakMap）+ 篩選（`JSON.stringify`）」為鍵記住答案。覆蓋是語料與條件的性質，不是搜尋框裡那句話的性質，所以同一頁重繪、逐字輸入都重複使用。
  - `coverageWords(query)`：把 `tokenize()` 的詞依序寫成「「A」「B」」，讓標記、提示與結果頁 banner 用同一組詞說明同一件事。
  - `renderSearchFeedback()` 的任務捷徑區：先以目前 `filters` 為每個捷徑算 `coverage`；`failedPaths.length` 時整批不標（部分載入不是普查，理由與首頁標記相同）；把 `claimed === 0` 的依原順序移到最後，其餘維持原本（含 `prioritizeProblemTags`）的順序；被標記的按鈕加上 `.task-coverage-none`（文字同樣是「僅相關詞」）、`data-coverage="none"`、`aria-describedby="empty-coverage-legend"`，`aria-label` 與 `title` 也寫出量到的詞與點入會看到的筆數。
  - 有標記時才插入說明行 `#empty-coverage-legend`（沒有標記就不出現，不製造多餘文字）。
- `assets/style.css`：`.empty-problem-legend`（12px、`--muted`、60ch）與 `.empty-problem-chips .task-coverage-none{margin-left:6px}`。沿用首頁徽章的既有樣式，沒有新增色票。
- `README.md`：第 9 段補一句，說明這份清單先排有案例自述的任務、其餘標示「僅相關詞」並排在後面。
- `index.html`：首頁說明行改為「目前沒有案例的標題、用途或痛點同時包含這項任務的搜尋詞」，與結果頁 banner 同一句。
- `tests/coverage-recovery.test.cjs`（新，6 項）與 `tests/coverage-recovery-browser.cjs`（新，契約測試，4 段）；`.github/workflows/website-qa.yml` 的 Chromium 步驟新增這支瀏覽器測試。

無障礙：可見文字就是可存取名稱的來源（`aria-label` 與可見文字完全相同，只多了「僅相關詞」四個字），說明用 `aria-describedby` 指向說明行；`aria-hidden` 未用於任何會被讀出的內容。

## 先紅後綠

- `node --test tests/coverage-recovery.test.cjs`：
  - 把 `tests/coverage-recovery.test.cjs` 指向 `e7aaabe8` 的 `assets/app.js`（其餘同基準）：**5 項全失敗**（`taskCoverage` 沒有 `filters`、沒有任何 `data-coverage` 標記）。
  - 改動後 **6 項全通過**。
  - 反向驗證（對本輪程式做 mutation）：把 `orderedTags` 改成不重排 → 排序那一項失敗；把覆蓋改成忽略 `filters` → 「coverage follows the filters」失敗；把 `claimed` 改成不強制 `scope:'overview'` → 兩項失敗。
- `VERIFY_URL=http://127.0.0.1:8141/ai-agent-use-cases/ node tests/coverage-recovery-browser.cjs`（基準預覽，`e7aaabe8`）：失敗於「both states appear:」（標記 0 個）——先紅。
- `VERIFY_URL=http://127.0.0.1:8140/ai-agent-use-cases/ node tests/coverage-recovery-browser.cjs`（本輪預覽）：通過。這支測試對 55 個捷徑逐一開自己的查詢，比對標記狀態與結果頁的 `#match-scope[data-mode]` 及承諾的筆數；回報 `chips: 55, marked: 7`（播客摘要、寫履歷、出差報銷、代碼重構、發票辨識、機票比價、隱私審查）。

## 量測（同頁、同尺寸、同資料，`?q=幫我寫遺囑`）

| 視口 | 清單高度 | 說明行高度 | 捲動內容高度 | 水平溢出 | 標記數 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1440×900 改前 | 357 | 0 | 940 | 0 | 0 |
| 1440×900 改後 | 433 | 42 | 992 | 0 | 7 |
| 390×844 改前 | 380 | 0 | 1882 | 0 | 0 |
| 390×844 改後 | 477 | 63 | 1963 | 0 | 7 |
| 320×740 改前 | 380 | 0 | 1937 | 0 | 0 |
| 320×740 改後 | 498 | 84 | 2130 | 0 | 7 |

捲動框本身仍是 300px（`clientHeight` 298，改前後相同），多出來的高度全部來自說明行（改為說出量測詞之後，說明行在 1440／390／320 分別為 42／63／84px）；7 個被標記的捷徑位置由 8／14／16／19／20／23／45 移到 48～54（也就是全部排在搜尋詞出現在標題或用途的任務之後）。

對比（計算值）：說明行 6.13:1、徽章 7.23:1，皆高於 4.5:1。

### 跨條件的同一個判斷（逐一開查詢比對）

以 `?q=幫我寫遺囑` 加上每個使用情境，把面板上**每一個**捷徑開一次它的查詢，比對「有沒有標記」與結果頁的 `#match-scope[data-mode]`，以及 `title` 承諾的筆數與畫面筆數：

| 使用情境 | 捷徑數 | 標記數 | 不一致 |
| --- | ---: | ---: | ---: |
| 無 | 55 | 7 | 0 |
| 生活 | 45 | 31 | 0 |
| 工作 | 53 | 14 | 0 |
| 學習 | 43 | 29 | 0 |
| 開發 | 50 | 30 | 0 |
| 創作 | 42 | 25 | 0 |

合計 288 次開啟查詢、0 個不一致。同一頁內切換情境（不重新載入）7 → 31 → 7，`aria-describedby` 的數量永遠等於標記數。

### 邊界情況

| 情況 | 結果 |
| --- | --- |
| 有一個來源檔載入失敗（`corpus.json` 404 + 一個 `cases/*.md` 404） | `顯示 0 / 514 筆收錄（1 個來源檔案未載入）`、標記 0、沒有說明行、沒有任何 `aria-describedby`；`#empty-hint` 仍寫出部分載入 |
| 訪客把命中範圍設成「標題」或「主題」 | 標記仍以「標題、用途與痛點」為準（與首頁、結果頁同一條規則），不受訪客選的範圍影響 |
| 同一頁內切換使用情境 | 標記與順序重算（快取以 filters 為鍵），不需重新載入 |
| 語料重新載入（重試、補讀、合併） | `entries` 是新的陣列，快取失效；新案例若自述該任務，標記與說明行一起消失 |
| 手機 390／320 | 說明行 42／63px，水平溢出 0，被標記的捷徑仍可 Tab 聚焦、按 Enter 進入（實測第 55 個 Tab 停在「播客摘要」，Enter 後 8 筆、焦點在 `#results-count`） |

### 效能（同機、Chromium、`?q=幫我寫遺囑`）

| 版本 | 第一次繪製 | 之後每次重繪 |
| --- | ---: | ---: |
| 基準 `e7aaabe8` | 128 ms | 120 ms |
| 本輪 | 183 ms | 120 ms |

面板在每次按鍵都會重建 45 個以上按鈕；`cachedTaskCoverage()` 以「語料陣列 + 篩選」為鍵記住答案，所以只有第一次（或換篩選後）多付 55 ms，之後與基準相同。

## 指令與結果

- `node --test tests/*.test.cjs`：基準 `e7aaabe8` **675 通過／0 失敗** → rebase 到 `e23c1948` 後 **683 通過／0 失敗** → 本輪最終 **684 通過／0 失敗**（+9，含 main 新增的編輯註記測試）。
- `node --check assets/app.js`：通過。
- 瀏覽器（本機 Chromium、Playwright、Pages 相容預覽）：
  - `tests/coverage-recovery-browser.cjs`（新）：1440／390／320 通過；axe（wcag2a/2aa/21aa）0 違規；pageerror 0。
  - 既有相鄰測試：`tests/task-coverage-marker-browser.cjs`（首頁標記契約，56 個入口）、`tests/combined-recovery-browser.cjs`（`RECOVERY_URL`）、`tests/recovery-progress-browser.cjs`（`SITE_URL`）通過。

## 三種訪客情境（本機預覽實走，1440×900 與 390×844 各一次）

1. **不知道工具名稱，從問題找案例。** 首頁 7 個入口帶「僅相關詞」；點「發票辨識」→ 16 筆、`#match-scope=none`、說明「沒有案例的標題、用途或痛點同時包含…」、按「改搜「發票」→ 8 筆」得到 8 筆。入口的 `title` 事先寫出「點入會列出 16 筆提到相關詞的案例」。
2. **組合搜尋與篩選遇到空結果。** `?q=整理報價單&scenario=工作` → 0 筆；第一順位是「原問題提到「報價」→ 搜尋 22 筆文字命中」，任務捷徑中 14 個帶「僅相關詞」（此篩選下 `旅遊`、`效能分析` 也確實沒有案例在職涯情境自述）；點第一項後 22 筆、關鍵字變 `報價`、`scenario=工作` 保留。
3. **開啟分享的詳情直鏈。** `?case=UC-024` 直接開啟，區塊為「可以幫你做什麼／情境常見讀者／實作門檻／先核對原始紀錄／頁首證據說明／你想先了解哪一段？／怎麼開始／要注意什麼」，來源網域 github.com、openai.com、learn.chatgpt.com、reddit.com；Escape 關閉後回到 515 筆、焦點在 `#results-count`。

## 限制

- 執行環境無法顯示影像，版面美感未由本人目視比對；截圖已存（`before-*`／`after-*`），量測以 DOM 幾何與計算樣式為準。
- 本機只跑 Chromium；Firefox／WebKit 與實際螢幕閱讀器朗讀未驗，交由 CI 與後續抽查。
- `edit` 造成的焦點與讀屏行為未逐項朗讀驗證，只驗到 `aria-describedby` 指向存在的元素、可見文字等於可存取名稱、axe 0 違規。
- Jekyll 建置與正式站 CDN 行為未在本機驗證，須以合併後的 Pages 產物核對。
- 本輪沒有處理（已知、留給下一輪）：空結果頁的 55 個任務捷徑仍是「全站共用同一份清單」，與訪客問句無關；`docs/qa/2026-11-12-task-coverage/` 的量測顯示 `資料清理` 286／515、`報表比對` 279／515 這類由泛用同義詞群組造成的語料級命中仍未處理。

## 下一輪最值得做的一件事

**修 `寫履歷` 這類「動詞改寫多要求一個詞」的 recall 缺陷**，先量再改：

1. 先跑 `?q=寫履歷&scope=overview`（今天 0 筆）與 `?q=履歷改成&scope=overview`（今天 1 筆，UC-035），把「改寫後要求 修改、但語料寫 改成」的案例列成清單；同一個模式還有 `寫X → X 整理`（週報、日報）。
2. 再決定是「改寫只注入讀者打的詞」或「為 修改 建一個窄的同義詞群組」。本輪已量過後者的代價：`修改` 全文命中 192 → 263、`改成` 89 → 263、`改寫` 79 → 263，因此不能直接併。
3. 動手前先跑 `tests/problem-compound-queries.test.cjs`（4 條 recall 期望：`履歷修改`、`履歷健檢`、`寫履歷`、`履歷篩選`）與 `tests/search.test.cjs`、`tests/match-scope-notice.test.cjs`，確認新期望會讓「有案例在做卻被標成僅相關詞」的入口歸零。

次要但同等具體：`cases/453` 等 4 個案例把 404 來源列為證據卻沒有任何失效提示（2192 條非 X 來源中 16 條已失效），可用離線 allowlist 的連結檢查加上「已失效」標記。

## 獨立審查（未參與實作）

由另一個 agent context 讀 `git diff e7aaabe8..021131c9` 並實際跑、實際改寫副本做 mutation。結論 **approve**，7 項發現中 4 項需要處理：

1. **（已修）每次按鍵多算一次覆蓋，成本 +50%。** 審查以同一支量測腳本取得 `9d242ec9` 的 keystroke 188 ms vs 基準 126 ms，並量到覆蓋掃描本身 59.5 ms／次（55 個 chip × 2 次 `filterEntries`）。已改為以「語料陣列 + 篩選」為鍵的快取，現在第一次繪製 183 ms、之後每次 120 ms（基準 128／120）。
2. **（已修）排序測試是空的。** 審查把 `orderedTags` 改成不重排，單元測試仍 5/5 通過（語料的宣告順序剛好就是 covered 在前）。已改用「未覆蓋的任務在策展順序中排在已覆蓋任務之前」的語料（播客摘要 index 8 vs 發票 index 13），並斷言完整順序是穩定分割；重跑同一個 mutation，單元測試現在會失敗。
3. **（已修）瀏覽器測試只驗了無篩選一種條件集。** 審查的 mutation 顯示 `ignore-filters`、`total-unfiltered`、`mark-partial-load`、`legend-always` 四項只有單元測試抓到。已補 `&scenario=生活`（45 個 chip、31 個標記，逐一開查詢比對）與 `&scope=overview`（48 個 chip、0 個標記，斷言沒有說明行、沒有 `aria-describedby`）。
4. **（已修）README 說「聚焦時」會看到筆數，實際只有 `title`。** 已改為「桌機滑過（或讀屏讀取按鈕說明）」，手機則由結果頁說明。
5. **（更正一個說法）** 我的第二個 commit 寫「修正一個會把 `aria-describedby` 指向不存在的說明行的 crash」。審查實測 `9d242ec9` 在部分載入下是 `marked=0、legend=false、orphan=0`——那個 crash 只存在於我中間未推送的版本，`9d242ec9` 沒有。最終程式把「能不能標記」收斂成一個區域變數，行為與 `9d242ec9` 相同。
6. **（確認為非缺陷）** 標記 chip 在鍵盤順序中要 48 次 Tab 才到（在第 48～54 位），焦點進入時 300px 捲動框會把它帶進可視區；README 已寫明「排在後面」，屬已揭露的取捨。
7. **（確認為非缺陷）** 重排會覆寫 `prioritizeProblemTags` 的「原問題含此詞優先」，README 與程式一致。

審查實測（未參與實作的獨立腳本）：42 組篩選組合逐 chip 導覽，`#match-scope[data-mode]` 與 `title` 承諾筆數 0 不一致；axe 在 1440／390／320 為 0 違規；`label-content-name-mismatch` 單獨跑 0 違規、56 項通過；空查詢、就地移除 facet、部分載入、首頁 7 個標記皆與基準一致。

**第二輪審查**（同一個獨立 context，head `67766ed8`，rebase 後為 `1ff9c6b4`；審查面檔案逐一同 shasum）結論仍是 **approve**：

- 7 個標記任務逐一比對：chip 提示的「」詞、`tokenize()`、結果頁 `#match-scope-message` 印出的詞三者相同；「標題＋用途＋痛點同時含全部字面詞」的案例數對 7 項皆為 0，所以新句子成立（而且比 predicate 量到的更弱，不會變成更強的主張）。
- F2／F3 現在可證偽：取消重排 → 單元測試失敗（改前是存活）；說明行無條件渲染 → 單元與瀏覽器測試都失敗；說明行永不渲染 → 單元測試失敗 6 條。`scenario=生活`（45／31）與 `scope=overview`（48／0，且 0 個 `aria-describedby`）兩段真的在跑。
- `label-content-name-mismatch` 在 1440／390／320 都是 0 違規、56 項通過；全量 axe 三寬度 0 違規；首頁 7 個標記與說明行未受影響。
- 最後一項 low：`coverageWords()` 原本只取前 4 個詞，若未來某入口被映射成 5 個以上必要詞，句子會只列前 4 個卻說「同時包含」。已改為列出全部，並補一條測試（把 slice 放回去會讓它失敗）。

審查未能驗證（與前一輪相同）：真實螢幕閱讀器朗讀、Firefox／WebKit、實機觸控（`title` 只能 hover 讀到；README 已改寫為「桌機滑過／讀屏讀取按鈕說明」）、Actions 上的實跑（由 PR 檢查提供）。

## 文字修正：標記必須說出它量了什麼

審查的 F4 與訪客調查的同一項發現指向同一個缺陷：標記寫「沒有案例自述在做這項任務」，但判斷式只問「每個搜尋詞是否都落在標題、用途或痛點」。`寫履歷` 會被改寫成 `履歷 修改`，而 UC-035 的標題是「找合適職缺，**把履歷改成**有根據的申請草稿」——它就是在做這件事，卻被算成「沒有案例」。

考慮過的兩個修法：

| 修法 | 實測 | 決定 |
| --- | --- | --- |
| 把 `改成`、`改寫` 併進 `修改` 的同義詞群組 | `寫履歷` 的覆蓋數 0 → 1（UC-035 命中），但 `修改` 的全文命中 192 → 263、`改成` 89 → 263、`改寫` 79 → 263 | **不採用**：讓一個泛用動詞吃掉半個語料，與站上「一個詞覆蓋三分之一就不算更窄的問題」原則相反 |
| 把標記與提示改成說出實際量測的詞 | 7 個標記的 `title` 現在寫「目前條件下，沒有案例的標題、用途或痛點同時包含「履歷」「修改」」，與結果頁 banner 同一句 | **採用**：真話，且兩個入口與結果頁三方一致 |

因此 `寫履歷` 仍保留標記（確實沒有案例同時含「履歷」與「修改」），但訪客不會再被告訴「本庫沒有寫履歷的案例」。改寫規則本身的問題（為什麼要把 `寫履歷` 變成 `履歷 修改`、以及 UC-035 用「改成」）留給下一輪，見〈已知但未處理〉。

同步更新：`index.html` 的說明行、`assets/app.js` 的首頁 `title` 與 chip 提示、`README.md` 兩處；`tests/task-coverage-marker-browser.cjs` 的說明行斷言改為新的句子（頁面文案是產品承諾，改了就要跟著改）。

## 已知但未處理（本輪量測到、不在本輪範圍）

- **`寫履歷` 的改寫規則**：`assets/app.js` 把 `寫X` 之類的動詞改寫成 `X 修改` 並要求兩個詞都命中。UC-035 用「改成」，所以任何「把履歷改好」的問法都會被算成沒有案例。候選修法與成本見上表；需要同時改 `tests/problem-compound-queries.test.cjs` 的 4 條 recall 期望（`履歷修改`、`履歷健檢`、`寫履歷`、`履歷篩選`）。
- **來源連結失效未標示**：2192 條非 X 來源中有 16 條已 404，其中 `cases/453`、`cases/384`、`cases/456`、`cases/015` 的頁面沒有任何失效提示；`cases/453` 甚至把 3 個 404 連結列為證據。現有測試只驗渲染，沒有連線檢查。
- **「改搜」逃生按鈕可能送錯地方**：`?q=寫履歷` 的結果頁提供「改搜「修改」→ 23 筆」，前四張與履歷無關；逃生按鈕挑的是筆數最多的 token。
- **空結果面板的任務捷徑是「全站共用同一份清單」**，與訪客問句無關，且放在 300px 的內層捲動框（手機只完整看到 8 個）。
- **CI 耗時**：8 個常駐 PR workflow 每次在裸 runner 上重裝瀏覽器（install 佔 job 76%／93%）；換成預載 Playwright image 是可量測的窄修補，留給 CI 專輪。

## 發布

- PR [#336](https://github.com/RichardHan/ai-agent-use-cases/pull/336)（head `76d184c8`）：13 項非略過檢查全部 success——`Website QA`、`Reader QA`、`Reading flow QA`、`Source guide QA`、`Search context QA`、`Partial load QA`、`Related reading QA`、`Reader search QA`、`Relevance`、`Return visibility`、`Home search entry`、`Round 23 acceptance`、`Find reader sections`；`published` 依設計 skipped。PR 上的 `Website QA` 也跑過新增的 `coverage-recovery-browser.cjs`。
- squash 合併為 `180e00ca`；`pages build and deployment` [42790947892](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42790947892) success。
- 正式站 `catalog.json.sourceRevision` = `180e00ca2d31…`、512 個來源檔；`assets/app.js` 含 `empty-coverage-legend`（改動確實在產物裡）。
- 正式站重跑同一支契約測試（`VERIFY_URL=https://richardhan.github.io/...`）：無篩選 55／7、`scenario=生活` 45／31、`scope=overview` 48／0，點擊承諾 8 = 畫面 8，全部通過。
- 正式站三情境（1440×900 與 390×844）：首頁 7 個「僅相關詞」入口與新說明行；點「發票辨識」→ 16 筆、`#match-scope=none`、「改搜「發票」→ 8 筆」；`?q=幫我寫遺囑` → 55 個捷徑、7 個標記、說明行、點「發票辨識」→ 16 筆／`none`；`?case=UC-024` 直接開啟、Escape 後 515 筆、焦點在 `#results-count`；pageerror 0。
- main 的 `Website QA` [42790949128](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42790949128)（`180e00ca`）**success**：`Verify the updated site in Chromium` 內含新增的 `coverage-recovery-browser.cjs`，`Wait for published assets and content` 與 `Verify the published GitHub Pages site` 也都通過。
- 這份紀錄本身的 commit `06a13b75`（`[skip ci]`）也已部署：`pages build and deployment` [42793266834](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42793266834) success，正式站 `catalog.json.sourceRevision` = `06a13b75ee33…`；`docs/` 不在 Pages 產物內，本紀錄在網站上是 404（實測三次），只存在於 repo。
