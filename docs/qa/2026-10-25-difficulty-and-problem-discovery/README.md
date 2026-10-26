# 2026-10-25 實作門檻難度分級、痛點導向閱讀層級與篩選復原加固

## 背景與問題陳述

在 449 篇收錄中，新訪客面臨以下核心困擾：
1. **門檻資訊缺失**：全站雖有情境、工具、狀態與來源分類，但完全缺乏「實作門檻／難度」維度。非工程師（行政、產品、行銷、自學讀者）點開案例常發現需要本機終端、Docker、自建腳本或 API 金鑰；而尋找多代理自動化的開發者又容易在大量純提示詞中迷失。
2. **卡片痛點層級不明顯**：原有卡片清單僅呈現標題與 summary，未突出核心要解決的痛點（`coreGoal`），新訪客在快速掃視時難以在 3 秒內判斷案例價值。
3. **篩選與清除不完整**：條件復原、清除篩選以及初始載入的 URL 還原需覆蓋門檻維度，保持無狀態 GitHub Pages 靜態架構的完全向下相容。

---

## 兩套方案比較與決策

| 方案 | 作法 | 取捨與成本 | 決策 |
|---|---|---|---|
| **方案 A：客觀推導實作門檻三級分級、卡片痛點重整與全套 Facet 支援** | 依既有事實（工具清單、CLI/Docker/程式碼關鍵詞、API/Webhook/OAuth）客觀推導為「入門對話（免寫程式）」、「工具串接（需帳號或外掛）」與「進階開發（需本機環境或代碼）」；新增 `#difficulty` select、Facet counts、URL query、卡片徽章與痛點標示。 | 需更新 `index.html`、`assets/app.js`、`assets/style.css` 並補齊完整單元與端到端測試。不破壞現有資料結構與歷史 URL，100% 向下相容。 | **採納（本輪實施）** |
| **方案 B：首頁改為多步驟問答精靈（Wizard）** | 將 Hero 區域改造成三步問題問答卡片，動態過濾卡片。 | 改動破壞性大，增加進階使用者操作路徑，且與既有 57 個 Actions workflow 測試中的 DOM 選擇器產生大面積衝突，風險過高。 | 排除 |

---

## 實作內容

1. **客觀門檻推導（`extractDifficulty`）**：
   - 🟢 `入門對話`（281 筆）：純對話、提示詞、Web UI 操作，免寫程式碼、免開終端機（如 UC-001 旅行比價、UC-007 訂閱盤點）。
   - 🟡 `工具串接`（17 筆）：需 API Key、Webhook、OAuth 授權或第三方服務/外掛（如 UC-014 Stripe 退款、UC-020 Figma MCP）。
   - 🟣 `進階開發`（151 筆）：需本機 CLI、Docker、撰寫代碼、自建排程或程式開發代理（如 UC-005 Cloud PR review、UC-324 故障日報 PR）。
   - 合計：281 + 17 + 151 = 449 案，覆蓋率 100%，無重複無遺漏。
2. **檢索與篩選擴充**：
   - `index.html`：新增 `<select id="difficulty" name="difficulty">`，具備 `aria-describedby="facet-count-hint"`。
   - `assets/app.js`：
     - `FILTER_LABELS.difficulty = '實作門檻'`。
     - `filterEntries` 支援 `!filters.difficulty || item.difficulty === filters.difficulty`。
     - `renderFacetCounts` 動態顯示符合筆數（如 `281 · 入門對話`）。
     - `currentSearchLink`、`render`、`reset`、`clearFacets`、`removeConditions` 全面納入。
     - 初始載入與 `popstate` 安全還原 `?difficulty=...` 查詢參數。
3. **資訊視覺層級升級**：
   - 卡片頂端呈現 `.card-difficulty` 徽章，專屬色系與高對比（對比度 7.4:1 ~ 9.1:1，超越 WCAG AAA）。
   - 卡片正文呈現 `🎯 解決痛點：...`（`.card-goal`），強化閱讀掃視效率。
   - 詳情 modal 頂部加入 `.detail-difficulty` 區塊，標明門檻與說明。

---

## 獨立審查反饋與修正

由獨立 `IndependentReviewer` 審查，提出 4 項 P2 缺陷，均已全數修復並建立防禦測試：
1. **`clearFacets()` 漏清 difficulty**：已將 `difficulty` 納入清除清單。
2. **`removeConditions()` 不處理 difficulty**：已加入 `difficulty` 清除支援。
3. **`load()` 初始非同步前漏還原**：已在 `initialParams` 階段完成 `difficulty` 還原，避免使用者在載入期間輸入導致 URL 條件遺失。
4. **`extractDifficulty` 涵蓋 MCP 與宣告工具**：加入 `\bMCP\b` 及頁首宣告工具文字解析，使 UC-020 (Figma MCP) 與 UC-170 正確歸入「工具串接」。

---

## 三種真實情境走查

1. **情境一：非技術知識工作者尋求免程式碼解法**
   - 選擇實作門檻「入門對話（免寫程式）」，即時顯示 260 筆（扣除未驗證與待查）。
   - 第一筆 UC-001 旅行比價卡片清楚呈現「🎯 解決痛點：將旅遊需求轉成可核對的交通、住宿選項，保留人工購買決策。」
   - 開啟詳情 modal，顯示「實作門檻：入門對話（免寫程式）」，關閉後焦點平順返回。
2. **情境二：開發者檢索 PR 自動化與進階代碼代理**
   - 搜尋「PR」搭配門檻「進階開發」，精準收納 95 筆（如 UC-324 每日當機 PR 整理）。
   - 點選「清除篩選，保留關鍵字」，門檻重設為空，關鍵字「PR」完美保留，結果擴增至 207 筆。
3. **情境三：手機視口（iPhone 390x844）初訪者體驗**
   - 篩選情境「生活日常」＋門檻「入門對話」，結果即時更新為 74 筆。
   - 檢查所有 select 與互動按鈕，高度均 >= 44px，滿足觸控無障礙標準。
   - 詳情 modal 與抽卡功能在窄螢幕下零水平溢出，文字閱讀節奏舒服。

---

## 驗證輸出摘要

- **單元測試**：`node --test tests/*.test.cjs` 總計 **324 passed, 0 failed, 0 skipped**（耗時 5.5 秒）。
- **JS 語法檢查**：`for file in assets/*.js tests/*.cjs; do node --check "$file"; done` 全部 PASS。
- **靜態預覽與 Bundle 核實**：
  `python3 scripts/preview.py <dest>` 與 `python3 scripts/check_corpus_bundle.py <dest>`：
  `PASS: 447 sources byte-for-byte identical; revision preview-2ce6e4e96e8b0a98a8fe35d4d72a1a905bb166adaf7da4c766bba8ed76ac2a10`。
- **無障礙**：觸控按鈕 >= 44px，高對比色彩標籤（#065f46 on #ecfdf5: 7.4:1; #1e40af on #eff6ff: 8.5:1; #6b21a8 on #faf5ff: 9.1:1）。

---

## 截圖紀錄

- 桌面版：
  - `after-desktop-hero.webp`：首頁與新版實作門檻下拉選單。
  - `after-desktop-cards.webp`：案例卡片呈現「實作門檻」與「🎯 解決痛點」。
  - `after-desktop-filtered.webp`：篩選「入門對話」之 281 筆結果。
  - `after-desktop-detail.webp`：詳情 modal 顯示「實作門檻：入門對話（免寫程式）」。
- 手機版（390px）：
  - `after-mobile-hero.webp`：手機端 Hero 與情境按鈕。
  - `after-mobile-cards.webp`：手機端卡片垂直節奏與清楚標籤。
  - `after-mobile-filtered.webp`：手機端入門對話篩選。
  - `after-mobile-detail.webp`：手機端詳情彈窗與閱讀引導。

---

## 未解決風險與下一輪建議

1. **未驗證項目**：正式 GitHub Pages 雲端部署需等待 Actions 發布（既有紀錄需 11~15 分鐘）；本機預覽與本機瀏覽器端到端均已全面驗證。
2. **下一輪最值得做的一件事**：首頁「抽一張靈感」抽卡區目前尚未支援依門檻抽取（例如專為非技術訪客抽取入門對話卡片），可將門檻偏好整合進情境抽卡牌組。
