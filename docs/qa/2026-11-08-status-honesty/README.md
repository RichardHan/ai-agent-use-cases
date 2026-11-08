# 2026-11-08 標示與來源文件一致（已併入的待查線索、只有提示詞的證據、來源連結的可讀名稱）

## 基準與範圍

- 基準：`origin/main` `f10701be`（本輪開始時，PR #264 合併後）；送出前 main 前進到 `5c925161`（同日合併 PR #266），已在該 base 上 rebase 並重跑全部檢查。原工作樹 `improve/visitor-source-orientation-20261027` 落後 main 189 個 commit 且有未提交修改，本輪全程使用隔離 worktree，未 reset、未改動原工作樹。
- 並行工作：另一位 session 持有 `improve/20261108-round-baseline`（PR #265），本輪未觸碰該分支或它的 worktree。
- 基準已含同日合併的 PR #266（相鄰中文複合詞拆讀）。本輪不處理：長句問句仍是 0 筆（重測見「下一輪」）、首頁 hero 密度、空結果頁的 45+ 捷徑牆、已失效的外部來源連結（已實測，見下）。

## 問題與證據

三項都是「頁面說的狀態與原始資料不一致」，都用瀏覽器與原始檔案重現：

1. **已處理的待查線索仍算成「還在查證」**
   `sources/pending.md` 的 P-002 標題與狀態列寫明「2026-10-17 已處理…已併入 UC-028…不另計數」，`INDEX.md` 也寫「待查來源（2，另 P-002 已處理）」；網站首頁統計仍顯示 **3 個待查想法**，卡片與詳情都標「還在查證」，沒有任何通往 UC-028 的站內入口。
2. **只有提示詞、沒有執行結果的案例被標成「作者報告／示範」**
   UC-465／UC-480／UC-496 的證據狀態列以 `` `designed` `` 開頭（例：UC-465「作者自行設計、分享的提示詞，**未附執行結果**」），網站卻給「作者報告／示範」，tooltip 寫「社群作者公開分享的操作紀錄與示範」——宣稱了一份不存在的操作紀錄。
3. **詳情頁來源連結的可見文字不在無障礙名稱內（WCAG 2.5.3）**
   `.detail-source` 的 `aria-label` 是「查看 UC-014 的 GitHub 原始 Markdown（新分頁）」，桌機可見文字是「查看 GitHub 原始 Markdown（新分頁） ↗」，ax（`wcag21a`）在 1440px 回報 `label-content-name-mismatch`（serious，1 node），行動版因短版文字剛好是子字串而未觸發。

## 兩個方案與取捨

- **A（採用）修正標示與計數的來源解析**：把「狀態列／標題明示已處理」解析成 `resolved` 與 `mergedInto`，只改顯示與統計，不改資料檔；證據桶新增「設計／未實跑」，只在使用者可見處改變說法；來源連結改由可見文字本身承擔名稱。成本低、可逐項驗證，不動搜尋語意與案例資料。
- **B（未採用）直接改內容檔**：把 P-002 從 `pending.md` 刪除、把三個案例的證據狀態改寫成網站現有分類。看似更乾淨，但會覆蓋協作者維護的原始紀錄（違反「保留原始資料、不自行刪除」），且把「作者設計」硬塞進「作者實作」的分類只是換一種失真。

## 變更

- `assets/app.js`
  - `metadata()`：新增 `statusLine`；`resolved` 只在 `kind==='pending'` 且狀態列以「YYYY-MM-DD 已處理／已解決／已完成」開頭時為真（避免 P-003 的「…或已完成操作流程」誤判）；`mergedInto` 對 pending 也解析「併入 UC-xxx」。
  - 新增 `catalogCounts(entries)`，首頁統計改用 `{case, evidence, pending, resolvedPending}`；`refreshCorpusMetadata()` 更新 `#pending-count` 與 `#pending-note`。
  - 卡片 kind 徽章、詳情徽章／警示／合併區塊：已併入的線索顯示「已併入 UC-028（不另計數）」，並以既有 `mergedDestination()` 產生「站內閱讀主案例 UC-028」按鈕。
  - 證據分類鏈：在 `unverified` 守衛之後、官方／作者規則之前，加入 `/^\s*`?designed`?/i → `設計／未實跑`；補齊該桶的說明、成果主張者、核讀狀態與安全採用建議。
  - `.detail-source`：移除 `aria-label`，可見文字改為「查看 UC-014 的 GitHub 原始 Markdown（新分頁） ↗」／手機「UC-014 原始 Markdown（新分頁） ↗」，名稱即為可見文字。
- `assets/style.css`、`assets/reader.css`：新增 `[data-proof="設計／未實跑"]` 徽章顏色（淺色與深色各一），沿用既有色票與對比。
- `index.html`：統計卡新增 `<p id="pending-note" class="stat-sub" hidden>`。
- 測試：
  - 新增 `tests/pending-resolution.test.cjs`（4 項）：已處理線索的解析、計數與 INDEX 準則一致、篩選仍可達且標示已併入、`catalogCounts` 分類。
  - 新增 `tests/evidence-status-consistency.test.cjs`（4 項）：`designed` 開頭不得標成作者實作、該桶四個文案齊備、`unverified` 不得標成作者實作、每個實際使用的桶都有定義。
  - `tests/detail-mobile-navigation.test.cjs`：兩處斷言由「aria-label 提到 GitHub／Markdown」改為「不得用 aria-label 覆蓋可見文字，且可見文字含案件編號與 GitHub 原始 Markdown」。原斷言等於把無障礙違規寫成規格，故一併修正。
  - `tests/card-evidence.test.cjs`：證據型別清單加入新桶與其 CSS 規則。

先紅後綠：新增測試在原版 `assets/app.js` 上失敗（`UC-465 → 作者報告／示範`、`UC-480`、`UC-496`），修正後通過；`pending-resolution` 在功能不存在前亦失敗。

## 驗收證據

- 單元測試：`node --test tests/*.test.cjs` → **468 項全過**（含 #266 的測試；本輪開始時基準為 459 項）；`node --check assets/app.js` 通過。
- 預覽建置：`python3 scripts/preview.py` 成功，`catalog.json.sourceRevision` = 本輪 commit（合併後由 Pages 版本核對）。
- Chromium 1440×900／390×844／320×720（共 3 個尺寸，before = rebase 後 base `5c925161` 預覽、after = 本分支預覽，同一份 509 筆 corpus）：
  - 首頁統計：`3 → 2`，新增說明「另有 1 個待查線索已處理並併入案例，不列在上述待查數」；`收錄狀態` 選項仍是 `509 · 全部狀態／503 · 用法靈感／3 · 經驗與踩坑／3 · 還在查證`，三類加總仍等於 509——已併入的線索留在篩選結果裡（不隱藏、不失聯），只改標示與統計口徑。
  - `?kind=pending`：3 張卡，P-002 徽章為「已併入 UC-028（不另計數）」。
  - `?case=P-002`：徽章「待查線索・已併入 UC-028」、警示改為「待查線索已處理…不列為獨立案例；原帖與未核對事項仍保留」、合併區塊含「站內閱讀主案例 UC-028」按鈕且可開啟 UC-028。
  - `?case=UC-465`：證據徽章與說明改為「設計／未實跑 作者自行設計或分享的提示詞與流程，未附執行結果…」。
  - 來源連結：`aria-label` 為 `null`，可見文字含案件編號；桌機與手機都可見。
  - 三大情境（自然問句→救援、篩選到空結果→救援、分享詳情直鏈→返回）：before／after 的結果與焦點完全相同（`before-report.json` 與 `after-report.json` 的 `s1`、`s3` 逐欄相同），本輪未改動搜尋與返回行為。
  - 無水平溢出（首頁與詳情，390／320），詳情 dialog `scrollWidth == clientWidth`，`pageerror` 皆為 0。
- axe（`wcag2a`、`wcag2aa`、`wcag21a`、`wcag21aa`，base 與分支同頁對照）：桌機 `.detail-source` 的 `label-content-name-mismatch` 由 1 → 0（UC-465、P-002 兩頁），手機前後皆 0；首頁、結果、空結果皆 0 違規，未新增其他違規。
- 截圖（before／after 同頁、同尺寸、同資料狀態）：`before-*`／`after-*` 的 stats、P-002 卡片、P-002 詳情頁首、UC-465 證據區塊，桌面與手機各一組。

## 限制

- **影像目視不可用**：本環境無法讀取截圖，視覺判斷僅來自 DOM 幾何、computed style、axe 與逐欄文字比對；截圖保留供人工複核。
- 只在 Chromium 驗證（未跑 WebKit／Firefox、未用實機與螢幕閱讀器）；焦點與 aria-live 行為由屬性與腳本結果推斷，未實際聽讀。
- 首頁統計的「待查 2」是站內計數，`sources/pending.md` 仍保留 3 筆（含已處理的 P-002），這是刻意的：原始紀錄不刪，只在呈現時分開計算。
- 未重新統計合格案例數（首頁仍顯示 2026-10-22 的 370 歷史批次快照）。

## 已量測、留待下一輪

1. **長句問句仍是 0 筆（最高優先）**：合併後的 main 已能把相鄰複合詞拆開（重測：「客戶抱怨」4、「合約到期提醒」3、「回覆客戶信件」28、「檢查錯字」3、「每次都要手動整理信件」3、「幫我把會議內容整理成待辦」1），但帶功能詞的長句仍無解：「客戶一直問同樣的問題」在 base 與本分支都是 **0 / 509**，救援只給「客戶」100 筆。原型以站上既有詞彙（標籤＋同義詞鍵）做最長匹配，10 句抽樣只有 3 句能得到 7–62 筆的交集，其餘不變且部分交集主題不相關，需先設計排序與「用了哪些詞」的標示，不能直接上線。
2. **失效的外部來源**：`note.com/ai_no_ai95/n/n2022fcde177b`（UC-384 主要來源）與 `qiita.com/oosawak@github/...`、`github.com/oosawak/markdown-cms`（UC-456 的兩個來源）以真實瀏覽器重測為 404（GitHub API 亦回 404），但案例仍宣稱「倉庫存在且有建置說明」。修法應是加註「2026-11-08 重測無法開啟」並保留原核讀日期，不刪原文、不改寫成新事實。
3. 其他已量測但未處理：首頁搜尋框位於 390px 的 3,307px／320px 的 3,486px；空結果頁一次渲染 45–55 個捷徑；`desktop` 由篩選造成 0 筆時，`.filter-outcome` 仍為 `display:none`（手機才有即時回饋）。
