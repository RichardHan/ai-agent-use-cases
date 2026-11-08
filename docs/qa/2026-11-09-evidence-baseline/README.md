# 2026-11-09 證據數字與日期要說出自己的基準：批次母體、待查條目的檔案查證日

## 基準

`origin/main` `3ace15a7`（正式站 `catalog.json` 的 `sourceRevision` 同值，`builtAt` `2026-11-08`，509 個載入條目＝503 主要案例頁＋3 經驗與踩坑＋3 待查）。原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 219 個 commit，且有未追蹤的他人研究案例檔；本輪未觸碰，全程在隔離 worktree `/Users/richard_han/orca/wt/aiuc-20261109-cred`（分支 `improve/20261109-cred-round`）。

基準 `node --test tests/*.test.cjs`：**500 通過、0 失敗**。main 近 12 次 push 的 `Website QA` 與 `pages build and deployment` 全為 success（最新 `3ace15a7` 的 Pages run 42523348783），本輪沒有把歷史故障當成現況。

## 問題與目標使用者

目標使用者是「用首頁統計卡判斷這個案例庫有多少可信案例」與「點開『還在查證』條目看證據」的訪客。正式站實測（Chromium 1440×900／390×844）三處自我描述與來源檔不一致：

| 位置 | 正式站顯示 | 來源檔實際記載 |
| --- | --- | --- |
| 首頁 `#audit-status` | `歷史批次：2026-10-22 20:50（台灣時間）。這是當時的快照，不是目前全庫累計…`；同頁目錄卡 `503 個主要案例頁` | `sources/qualification-audit-2026-10-16.md:7`：`主要案例頁420不是合格數` |
| P-001／P-002／P-003 卡片與詳情 | `頁首未提供核對日` | `sources/pending.md:3`：`查證日期：2026-10-16；2026-10-17 17:45（台灣時間）補查P-001作者資訊、P-002原帖` |
| P-002 詳情 | 標籤 `待查線索・已併入 UC-028`、上方 `待查線索已處理…不列為獨立案例`，下方同時 `尚待查證`＋`證據尚不充分…禁止進入任何實務評估或部署` | 同檔 `P-002` 狀態：`2026-10-17 已處理`、三則原帖以 X API 讀到並併入 UC-028 |

影響：訪客可自行算出 370/503≈73%，但該批次量測母體是 420 頁（之後新增 83 頁從未計入），370/420≈88%；兩張相鄰卡片並排卻沒有共同基準。待查條目則被說成完全沒有核對日，實際上有檔案層級日期；已結束的線索又被要求「禁止任何實務評估」。

根因（程式）：`assets/audit.js` 只解析 `嚴格合格` 與 `尚差`，丟掉同一段的 `主要案例頁N`；`assets/app.js` 的 `parseFile()` 以 `## P-` 切檔，檔頭（含 `查證日期`）從未進入任何條目，`reviewDate()` 又只認 `- ` 開頭的鍵；已併入條目的證據區塊只依 `item.proof`（`pending` 一律 `尚待查證`）輸出，不看 `item.resolved`。

## 兩個方案

- **A（採用）**：讓資料自己說話——`audit.js` 解析批次母體並在狀態句揭露；`app.js` 解析 `sources/pending.md` 檔頭查證日，另存 `fileReviewed`，以「檔案層級，不代表逐條核對」措辭顯示，不動 `reviewedDate`、`?sort=reviewed`、facet 計數；已併入條目的證據區先加一句結束說明。價值：三個位置都說得出自己的基準，且不改變任何分類語意。成本：2 個 JS 檔＋1 段 CSS＋2 支測試。風險：`parseSummary` 回傳形狀變動；新欄位不得進入搜尋索引或排序。
- **B**：只改文案（首頁加「非現有條目比例」、待查頁寫「日期請見原始檔」），不動解析。成本最低，但日期與母體仍要訪客自己翻原檔，等於把矛盾留給讀者；且「已結束」與「禁止評估」的衝突沒有解決。

選 A：本庫的價值主張就是「合格數與條目數分開看」，那就必須讓數字帶著自己的母體；待查條目的日期是可從資料算出來的事實，不該以「未提供」呈現。

## 修改內容

- `assets/audit.js`：`pageBase` 改由批次自己宣告的嚴格機器行取得。`sources/qualification-audit-2026-10-16.md` 最新批次新增 `- 批次母體：420 個主要案例頁。`（整行只允許這一種形式與句末句號；說明文字另起一段），`parseSummary()` 只接受整批恰好一行、整數、`N ≥ 合格數`、`≤ 100000` 的欄位；行內加註、改寫、重複欄位或缺欄位都會使該行不再符合，首頁就不顯示母體。散文提到頁數不參與運算。另抽出 `statusText(summary)` 並輸出，狀態句新增「該批次以當時 420 個主要案例頁為母體；」，其餘「快照／非目前累計」字句不變。
- `assets/app.js`：新增 `fileReviewDate()`（讀 pending 檔頭 `查證日期`，取有效日期最大值）與 `resolvedPendingNote()`；`parseFile('sources/pending.md')` 為每條目附上 `fileReviewed`。卡片日期列與詳情徽章在無 `reviewedDate` 但有 `fileReviewed` 時顯示「本條未載核對日／來源檔查證 2026-10-17」，並在來源版本句後補「檔案層級紀錄，不代表本條逐項核對」。已併入條目的證據區最前面插入結束說明。
- `assets/reader.css`：`.proof-note-closure` 樣式（整行、13px、可換行）。
- `README.md`：補兩句訪客可見行為（批次母體、檔案層級查證日）。
- `tests/evidence-baseline.test.cjs`（新增，6 個測試）：結構化母體欄位揭露、純散文不得變成母體、缺欄位／重複欄位／不合理數值不得使用、repo 目前批次的欄位與散文一致（同為 420）、待查條目帶檔案日（硬釘 2026-10-17）但不冒用為 `reviewedDate`、已併入條目有結束說明（含無目的地時不宣稱）。
- `tests/trust-summary.test.cjs`：`parseSummary` 形狀新增 `pageBase: 0`。

## 驗證

先紅後綠（可重現）：把新測試複製到基準 commit 的隔離 checkout 後執行，6 個測試全部失敗——`git worktree add /tmp/aiuc-baseline-3ace15a7 3ace15a7 && cp tests/evidence-baseline.test.cjs /tmp/aiuc-baseline-3ace15a7/tests/ && cd /tmp/aiuc-baseline-3ace15a7 && node --test tests/evidence-baseline.test.cjs` → `pass 0 / fail 6`（`pageBase` 不存在、`fileReviewed` 不存在、`resolvedPendingNote` 未定義）。修正後全庫 `node --test tests/*.test.cjs` **506 通過、0 失敗**（基準 500，新增 6）；聚焦的 `tests/evidence-baseline.test.cjs`、`tests/trust-summary.test.cjs`、`tests/pending-resolution.test.cjs`、`tests/evidence-status-consistency.test.cjs` 一併通過。

本機預覽（`scripts/preview.py` → `http://127.0.0.1:8931/`，同 `3ace15a7` 資料）與正式站同條件量測：

| 項目 | 修改前（正式站） | 修改後（同資料預覽） |
| --- | --- | --- |
| `#audit-status` 文字 | `歷史批次：…這是當時的快照，不是目前全庫累計…` | `歷史批次：2026-10-22 20:50（台灣時間）。該批次以當時 420 個主要案例頁為母體；這是當時的快照，不是目前全庫累計，目前合格總數未重新統計。` |
| 桌面 `#collection-stats` 高度 | 328px | 350px（多一行） |
| 手機 `#audit-status` 行數／裁切 | 3 行、無裁切 | 3 行、無裁切（`scrollHeight == clientHeight`） |
| 手機水平溢出 | 390／390 | 390／390；詳情 `scrollWidth 368 = clientWidth 368` |
| P-001–P-003 卡片日期列 | `頁首未提供核對日` | `本條未載核對日；來源檔查證 2026-10-17` |
| P-002 徽章 | `待查線索・已併入 UC-028`／`尚待查證`／`頁首未提供核對日` | 同上＋`本條未載核對日`／`來源檔查證 2026-10-17` |
| P-002 證據區首句 | `尚待查證 社群線索…請勿直接照做` | `本條目已結束：內容已併入 UC-028，不另計一案；以下「尚待查證」描述的是這條線索的原帖，採用請以主案例為準。`（其後才接原貼文標籤） |
| UC-511（一般案例） | `作者報告／示範`／`頁首核對 2026-11-08` | 完全相同（未受影響） |

三情境（預覽、1440）：① 不知工具名輸入「我想整理家裡的帳單」→ 37 筆並附重讀說明；② `q=發票&scenario=生活&kind=pending` → 0 筆，復原捷徑「移除收錄狀態『還在查證』→ 查看 10 筆」點擊後 10 筆且情境保留；③ 分享直鏈 `?case=P-002&kind=pending` → 徽章、結束說明、檔案查證日、`sources/pending.md` 固定版本連結都在，Escape 關閉後回到 3 筆 `kind=pending`。

截圖（同頁、同尺寸、同資料狀態；本環境停用影像讀取，僅供人眼複核）：`before-desktop-stats.webp`／`after-desktop-stats.webp`、`before-mobile-stats.webp`／`after-mobile-stats.webp`、`before-desktop-p002.webp`／`after-desktop-p002.webp`、`before-mobile-p002.webp`／`after-mobile-p002.webp`。

## 已知限制

- 本機沒有 Playwright／playwright-core（`require.resolve` 兩者皆失敗），`tests/*-browser.cjs` 與 axe 未能在本輪執行；瀏覽器證據來自內建 Chromium 的 DOM 文字、幾何與 `pageerror`，不是既有瀏覽器測試套件。
- 本機無 Jekyll／Gemfile，`INDEX.md` 等 Markdown 算繪與 `scripts/check-page-language.cjs`、`scripts/check_corpus_bundle.py` 只能在 CI 的 Jekyll build 驗證。
- 截圖影像無法讀取，視覺結論以 DOM 與量測為準；未做真人使用者研究。
- 只顯示「檔案層級」日期，未逐條重查 P-001–P-003 的內容，也沒有替任何條目補上逐條核對日。`sources/pending.md` 的 2026-10-17 17:45 補查只點名 P-001 作者資訊與 P-002 原帖，未涵蓋 P-003；因此畫面寫明是檔案層級，不把它當成 P-003 的逐條核對日。
- 合格總數的真實值仍不可從 repo 推得；本輪只揭露既有批次的母體，沒有重算。母體數字改由來源檔的嚴格機器行提供，不再解析散文，因此「某句話怎麼寫」不會改變畫面上的數字；代價是未來批次必須自己補上完全符合格式的 `批次母體` 行，否則首頁只顯示沒有母體的原句（不會退回推算）。
- 未處理：首頁待查說明 `.stats p` 的 11px 字級、`#catalog-status` 在正常狀態沒有資料日期、`1,000 案` 目標的來源未在卡上說明。

## 獨立審查

獨立 reviewer（不同 context，只讀）逐輪檢視 `parseSummary` 的母體來源，共五輪：先指出同一批次兩個數字會取第一個，再指出 `更正：主要案例頁 500，不是合格數` 的標點變體、倒敘 `500個主要案例頁`，以及不重複字樣的 `更正：實際母體是500頁`。前三輪以「fail-closed 散文解析」修補，第四輪顯示任何散文式防線都能被新的措辭繞過，第五輪再指出同一行內的「更正」仍會被寬鬆解析。最終改為嚴格機器行：`- 批次母體：N 個主要案例頁。` 必須整行完全符合（只允許句末句號），行內任何增補都使該行失效；散文不再參與；`tests/evidence-baseline.test.cjs` 另釘住欄位與同一批次的散文同為 420，來源若被改得不一致就紅燈。其餘（`fileReviewed` 不進 `reviewedDate`／搜尋／facet／排序、已併入說明的觸發條件、print 隱藏、static hosting）審查無發現。

## 發布後

（合併、Pages 部署與正式站核對後補記。）
