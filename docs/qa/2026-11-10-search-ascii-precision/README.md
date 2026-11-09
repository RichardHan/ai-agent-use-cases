# 2026-11-10 搜尋把供應商網址與英文字片段當成內容命中

## 基準

- 開發基準 `origin/main` `f3e4bbfa`（正式站 `catalog.json.sourceRevision` 同值，513 筆條目、510 個來源檔）。隔離 worktree `/private/tmp/aiuc-1112-round`（分支 `improve/20261110-search-ascii-precision`）；工作期間 main 前進到 `0ece4ceb`（`#315` 關閉後上一頁修正與其發布紀錄），本輪 rebase 到該版重跑全部檢查。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、另有 159 個未追蹤的他輪研究檔；本輪未觸碰，所有讀寫都在 worktree。
- 基準 `node --test tests/*.test.cjs`：**594 通過、0 失敗**；`node --check assets/app.js` 通過。
- 本輪開始前重新確認 Actions：近 100 次 run 90 success、8 cancelled（全部是 PR 分支上 `cancel-in-progress` 的取代）、1 失敗為 `pages-build-deployment` `42697783315` 的「Deployment cancelled.」（下一個 commit 的部署已成功，正式站版本與 main 一致）；main 的 `Website QA` 近 30 次全 success。**CI 目前不是本輪阻礙，沒有改動任何 workflow。**

## 問題證據

目標使用者是**在首頁按任務入口、或在搜尋框打一個任務名稱的人**。

搜尋把英文相關詞當成純子字串比對，於是命中的來源有三種都不是案例內容：

| 查詢（正式站 `f3e4bbfa`） | 修改前 | 其中哪些是誤命中 |
| --- | --- | --- |
| 客服／自動客服 | 93 | 32 筆只因為來源連結指向 `support.google.com`、`support.plex.tv`、`support.zendesk.com` |
| 推特 | 414 | 130 筆是 `text`、`example`、`context` 裡的字母 `x`；另有 27 筆只把 `x.com` 當來源出處 |
| CI | 130 | 107 筆是 `specific`、`decision`、`efficiency` 裡的 `ci` |
| 儲存庫 | 76 | 43 筆是 `report` 裡的 `repo` |
| 日誌 | 172 | 62 筆是 `login`、`blogs` 裡的 `log` |
| 搜尋 | 142 | 24 筆是 `research` 裡的 `search` |
| 筆記 | 69 | 13 筆是 `memory`／X 帳號 `tetumemo` 裡的 `memo` |
| 權限 | 502 | `auth` 在 251 筆只是 `author` 的一部分（`權限`／`授權` 本身仍命中 491 筆，屬共用段落用語，見限制） |
| 電動車 | 2 | 2 筆都是 `every`／`level` 裡的 `ev` |

具體到訪客：首頁按「自動客服」看到 `顯示 93／513`，第八張卡是 **UC-063「讓 Grok Bot 整理 Plex 影片庫」**，它與客服無關，只因原文附了 `support.plex.tv` 連結；UC-209「表格打得開，不代表換軟體後還算得對」、UC-223 太陽能帳單、UC-258 3D 掃描也都在名單裡。打 `CI` 會看到靈感、食譜、排課案例。打「論文研讀」的第一個名單外命中是 UC-362，唯一線索是 GitHub 網址 `paperclipai/paperclip` 裡的 `paper`。

## 兩個方案

- **A（採用）英文相關詞以「完整單字」比對，且相關詞不進來源網址。**
  - 做法一：`searchVariantIndex()` 的邊界規則從「只保護 PR／MR 縮寫」改為套用到所有純拉丁字母的相關詞；左側不得是 `[a-z0-9]`，右側允許數字串（保留 `uc101`、`pr149`）。中文相鄰字元本來就不是 `[a-z0-9]`，所以「用bot做」仍是命中。
  - 做法二：`metadata()` 另外產生 `searchProse`（同一份可搜尋文字，先把 `http(s)://…` 換成空白）；`filterEntries()` 只讓**讀者自己打的字**比對含網址的全文，站方擴充的相關詞一律比對 `searchProse`。
  - 價值：任務查詢的筆數回到真實覆蓋；第一張卡不變（排名本來就優先標題／用途）。讀者貼上網域（例如打 `support`）仍照舊命中網址。
  - 成本：`assets/app.js` 3 處（＋17／−9 行）、1 支新測試檔（10 項）、4 支既有測試的斷言修正；每筆多存一份 `searchProse` 字串（513 筆約 +3.4 MB 記憶體，實測首次載入時間未變）。
- **B 拿掉 `support`、`x`、`auth`、`ci` 等相關詞。**
  - 成本最低，但會刪掉真正需要的召回：英文案例寫「customer support」、「X 上的貼文」、「OAuth authorization」時就找不到；而且同樣的片段問題會在下一個新相關詞重演（`report`、`research`、`memory` 已經在名單裡）。

選 A：錯誤的本質是「比對單位不是詞」與「來源網址被當內容」，修這兩件事，不必逐詞刪相關詞。

## 改動

- `assets/app.js`：`SOURCE_URL_PATTERN`；`metadata()` 產生 `searchProse`；`searchVariantIndex()` 的拉丁字母邊界規則（移除 `PULL_REQUEST_ABBREVIATIONS` 特例，改為通則）；`filterEntries()` 只讓字面詞比對含網址全文。
- `tests/search-ascii-precision.test.cjs`（新，10 項）：供應商網址不等於客服、讀者打的英文詞仍可比對網址、`author` 不等於權限、`specific` 不等於 CI、`text` 不等於推特、`every`／`report`／`login`／`memory`／`latest` 不算命中、案例 ID 與 `PR149` 與中英相鄰仍可命中，以及兩條全語料不變量：任何回傳案例都必須以「完整的相關詞」出現在正文，且 `客服` 的每一筆都真的提到客服（不是供應商網址）。
- 既有斷言修正（皆為原本釘住誤命中的值，逐項附上原因）：
  - `tests/search.test.cjs`：`旅遊` 的「偶然作者用語」例子由 UC-076（作者行 `Travis Heinze travels`，`travels` 不是 `travel`）改為 UC-015（限制段落偶然提到旅遊）；`streaming`／`流式` 由 UC-217（`bitstream`）改為 UC-292（逐行串流模型輸出）；`2fa`／`mfa`／`雙重驗證` 由 UC-219／UC-259（commit hash `…e2fab…`）改為 UC-092（拒絕交出雙重驗證碼）；`sse`／`流式輸出` 由 UC-030（媒體檔在 `/assets/` 路徑）改為 UC-292；`cot`／思維鏈四條改為「不得因 `cot` 出現在更長的單字裡而命中 UC-086」（全庫沒有任何案例在談 chain-of-thought）。
  - `tests/problem-compound-queries.test.cjs`：`自動客服`／`客服機器人` 召回下限 80→61、`整理一份會議記錄`／`會議總結` 9→8、`論文研讀`／`研讀論文`／`精讀文獻` 10→9、`客服且人工` 系列 35→32；每一處都保留原本的 canonical 案例斷言，只把「混進供應商網址與 commit hash 的下限」改成真實覆蓋。
- `README.md`：搜尋段落補一句英文相關詞的比對規則與來源網址不算內容。

## 先紅後綠

- 新測試在未改動的基準（`/tmp/aiuc-315`，main + `#315`）上 **10 項中 8 項失敗**；另外 2 項是「必須仍然命中」的護欄，修改前後都通過。
- 修改後：`node --test tests/*.test.cjs` **604 通過、0 失敗**（基準 594＋新增 10）；`node --check assets/app.js` 通過。

## 量測（同一份 513 筆語料，修改前／後）

| 查詢 | 前 | 後 | 第一張卡 |
| --- | --- | --- | --- |
| 客服／自動客服 | 93 | **61** | UC-014 不變 |
| 推特 | 417 | **205** | UC-046 不變 |
| CI | 131 | **23** | UC-462 不變 |
| 日誌／日誌分析 | 174 | **110** | UC-096 不變 |
| 儲存庫／repo | 76 | **33** | UC-057 不變 |
| 搜尋 | 143 | **119** | UC-340 不變 |
| 筆記 | 69 | **56** | UC-050 不變 |
| 發文 | 258 | **229** | UC-332 不變 |
| 測試 | 274 | **266** | UC-125 不變 |
| 電動車 | 2 | **1** | UC-346 不變 |
| 權限 | 505 | 505 | UC-218 不變（見限制） |

- 首頁 56 個任務入口：**26 個筆數改變、0 個第一張卡改變**（例：自動客服 93→61、日誌分析 174→110、問卷調查 98→77、隱私審查 72→64、面試準備 7→6）。
- 逐案檢查被移出的命中：`support` 系列 32 筆（Plex 影片庫、太陽能帳單、3D 掃描、表格靠右…）、`ci` 107 筆、`x` 130 筆、`repo` 43 筆、`log` 62 筆、`search` 24 筆、`memo` 13 筆、`test` 25 筆、`2fa`／`cot`／`sse` 各 1–2 筆；抽樣檢查的每一筆都只有網址、handle、commit hash 或更長英文單字中的片段，沒有一筆是真正在講那個任務。

## 驗收（本機預覽，`scripts/preview.py`，127.0.0.1:8091）

- 三情境（1440×900／390×844）：
  1. 不知道工具名稱的新訪客：首頁「自動客服」→ 61 筆、前三張 UC-014／UC-398／UC-479 都是客服工作 → 開啟 UC-014，第一屏有「成果主張」、`怎麼開始`、`要注意什麼`。
  2. 組合搜尋＋兩個篩選（`會議`＋進階開發＋尚待查證）→ 0 筆、空結果區列出「移除實作門檻『進階開發』 → 查看 1 筆」→ 按下復原 1 筆、焦點移到結果數、篩選 chip 同步。
  3. 分享直鏈 `?q=會議&case=UC-094` → 對話框、徽章、第一屏證據摘要、固定版本的原始 Markdown 連結；Escape 關閉回到 26 筆、焦點回結果數。
- axe：結果頁（客服、CI、推特）、空結果、詳情皆 0 違規；水平溢出 0；pageerror 0。
- 鍵盤：`/` 聚焦搜尋 → 輸入「客服」→ Enter 得 61 筆 → 卡片以 Enter 開啟 → 焦點在詳情標題 → Escape 回清單。
- 既有瀏覽器回歸（同一預覽）：`search-context-browser`（chromium／firefox／webkit）、`relevance-browser`、`home-search-entry-browser`、`reader-search-browser`、`match-scope-note-browser`、`task-entry-browser`、`compound-split-browser` 全數通過；`search-submit-history`／`mobile-search` 屬同一批腳本，CI 仍會跑。

## 前後截圖

`before-*`／`after-*`（1440×900、390×844，同一份語料）：

- `support-before-1440.png` ↔ `support-after-1440.png`：`顯示 93` → `顯示 61`
- `ci-before-1440.png` ↔ `ci-after-1440.png`：`顯示 131` → `顯示 23`
- `twitter-before-390.png` ↔ `twitter-after-390.png`：`顯示 417` → `顯示 205`
- `scenario1-*`／`scenario2-*`／`scenario3-*`：三情境的結果、空結果、詳情。

## 已知限制

- 權限仍回 505 筆：`權限`／`授權` 在 491 個案例檔的正文（含共用的「權限與驗收」段落）本來就出現，屬全庫共用段落用語；本輪只去掉 `auth`／`author` 這條假的 251 筆，沒有動共用段落與排名。
- 相關詞不再比對來源網址，因此**只以 x.com 連結出處、內文從未寫 X／推特**的 27 個案例不再回答「推特」；本輪視為正確（出處平台不是內容），已記在測試裡。
- 推特收 205 筆仍偏高：`x` 這個相關詞在「X 平台」以外的獨立用法（表格的 x、尺寸 3x）無法從字面區分，需靠標籤或人工判斷。
- 沒有實機、螢幕閱讀器與行動網路實測；沒有跑完整 78 支瀏覽器腳本（未跑的由 PR 上的 workflow 覆蓋）。`scripts/preview.py` 產生的是本機預覽，不代表 Pages 建置結果。
- 記憶體：每筆多一份 `searchProse`（約 +3.4 MB）。以本機 4G 限速（1.6 Mbps／150 ms）量測首張卡時間 8.46 s → 8.51 s，差異在量測誤差內，但未做低階裝置實測。

## 下一輪先做

**共用段落標題讓「權限」「驗收」「限制」這類查詢命中 95% 以上的案例**：491 個案例檔共用 `## 權限與驗收`／`## 限制與驗收` 這類小節標題，`權限` 因此 505/513。先驗證兩件事再動手：(1) 以 `?q=權限` 與 `?q=驗收` 對照「只看標題與用途命中」的筆數（目前 8 筆／N 筆），(2) 量測把 `^#{1,6}` 標題行排除在全文之外的筆數變化（本輪離線試算：`權限` 491→294、`驗收` 471→367）。不可用「縮小搜尋範圍」偷偷解決，必須在介面上說清楚哪些欄位被搜尋。
