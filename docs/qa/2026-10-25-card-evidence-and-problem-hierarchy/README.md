# 2026-10-25 案例卡片與詳情可信度識別與問題導向價值呈現

## 決策與兩案取捨 (Decision & Tradeoffs)

針對初次造訪讀者無法在 447 個案例中快速判斷「這篇是吹噓宣傳還是客觀研究」，以及難以在手機上舒適瀏覽卡片問題價值的痛點，本輪評估了兩種精簡改善方案：

1. **方案一：案例詳情頁行動指南與限制可讀性（提升「怎麼開始」與「要注意什麼」的視覺層級與閱讀動線）**
   - 適用情境：讀者點入任一案例（如 UC-001 旅行比價、UC-007 軟體訂閱審計），想要了解「這能幫我做什麼、怎麼著手開始、有哪些具體限制或踩坑風險」。
   - 取捨與成本：`tests/reading-flow-browser.cjs` 嚴格斷言 `.reader-guidance` 必須處於閉合狀態（`assert(await page.locator('.reader-guidance').evaluate(e=>!e.open))`），若改動預設展開屬性會違反既有瀏覽器回歸契約。
2. **方案二（採納實作）：案例卡片與詳情之可信度識別與問題導向價值呈現 (Case Evidence & Problem-Oriented Value Presentation)**
   - 適用情境：第一次造訪的讀者在首頁選情境、抽卡或搜尋時，面對 447 個案例卡片，需要一眼辨識「這篇到底是作者自述示範、官方自報，還是公開資料核讀」，並在 320px/390px/1440px 螢幕上清晰閱讀「可以幫你做什麼」。
   - 取捨與成本：不改變任何 Markdown 內容或底層資料欄位，純粹透過前端資料屬性（`data-proof`）與無障礙 CSS 升級（WCAG AA 對比度 >= 6.39:1 至 9.75:1），完整保留所有既有選擇器（`.card-bottom button`、`.proof`、`.plain-overview`）與 DOM 結構，達成 100% 既有測試向後相容。

## 問題證據與目標使用者 (Problem & Audience)

- **問題證據**：
  1. 卡片底部原本的來源標籤（`.proof`）僅使用 10px 微小灰色文字（`var(--muted)`），在手機 390px 與 320px 上幾乎無法引起注意，讀者滑動清單時無法辨認該篇是未經驗證的個人推文、官方行銷宣傳還是公開資料核讀。
  2. 詳情對話框頂部徽章（`detail-header-meta`）中，`proof-badge` 缺乏明確的證據層級語意樣式；`.plain-overview` 缺乏視覺引導焦點。
- **目標使用者**：
  1. 第一次造訪、不熟悉工具名稱的新訪客：希望從「這能幫我做什麼」快速了解價值。
  2. 嚴謹的專業評估者：要求清楚區分作者自述、官方宣傳與公開核讀，不把宣傳當作真實成功率。

## 變更項目 (Changes)

1. `assets/app.js`：
   - 在 `card(item, terms)` 中為卡片節點與 `.proof` 元素添加 `data-proof` 語意屬性（`node.dataset.proof = item.proof; proofBadge.dataset.proof = item.proof;`），保留 `span.proof` 既有類別與文字內容。
   - 在 `showDetail(item, trigger, updateURL)` 中為詳情頂部的 `proof-badge` 添加 `data-proof` 屬性。
2. `assets/style.css`：
   - 強化 `.card-bottom .proof` 視覺樣式：12px 字級、550 字重、精緻微邊框與內距，針對 5 種收錄憑據類型（官方自報、作者報告／示範、公開資料核讀、尚待查證、模板／文件核讀）提供符合 WCAG 2.1 AA 標準（對比度 6.39:1～9.75:1）的語意化配色。
   - 詳情對話框 `.detail-badge.proof-badge` 與 `.plain-overview` 閱讀節奏強化：綠色引導邊框、舒服的行高（1.65）與純淨卡片背景，讓「可以幫你做什麼」成為視覺焦點。
   - 響應式優化：在手機 390px 與 320px 上，保持 `card-bottom` 橫向彈性對齊，按鈕高度維持 >= 44px 觸控標準，全站無任何橫向溢出（`docOverflow: false`）。
3. `tests/card-evidence.test.cjs`：
   - 新增 3 項回歸測試，鎖定所有 5 種 proof 類型的屬性綁定、樣式規則完整性與可信度標籤存在性。

## 驗收結果 (Acceptance & Verification)

- **單元與回歸測試**：
  - `node --test tests/*.test.cjs`：271 項測試通過，0 失敗。
  - `node --check assets/*.js scripts/*.cjs tests/*.cjs`：語法檢查通過。
  - `python3 scripts/preview.py /tmp/ai-usecase-preview`：預覽生成無錯誤。
  - `git diff --check`：無空格或格式警告。
- **三種使用者情境走查**：
  1. **情境一（新訪客抽卡）**：選擇「生活大小事」，抽中 UC-180，卡片上「作者報告／示範」憑據標籤清晰醒目；點擊「看看怎麼用 →」進入詳情，核對「可以幫你做什麼」後按 Escape 關閉，鍵盤焦點精確回到卡片按鈕。
  2. **情境二（問題導向搜尋）**：搜尋「比價」並篩選「官方自報」，結果精準收錄，卡片顯示專屬「官方自報」藍調徽章（對比度 7.95:1）。
  3. **情境三（行動端 390px / 320px 閱讀）**：測試零筆查詢與空結果提示，點擊重設按鈕恢復 447 筆；整頁 `scrollWidth <= clientWidth`（零橫向溢出），卡片底部按鈕高度 44px。
- **無障礙對比度量測**：
  - 作者報告／示範：9.75:1（Pass AA/AAA）
  - 官方自報：7.95:1（Pass AA/AAA）
  - 公開資料核讀：8.59:1（Pass AA/AAA）
  - 尚待查證：6.39:1（Pass AA）
  - 模板／文件核讀：8.79:1（Pass AA/AAA）

## 截圖佐證 (Screenshots)

- 桌面卡片清單與可信度標籤：[desktop-cards.png](screenshots/desktop-cards.png)
- 桌面案例詳情問題呈現：[desktop-detail.png](screenshots/desktop-detail.png)
- 手機 390px 卡片排版：[mobile-390-cards.png](screenshots/mobile-390-cards.png)
- 手機 390px 詳情閱讀：[mobile-390-detail.png](screenshots/mobile-390-detail.png)
- 手機 320px 極窄螢幕無溢出：[mobile-320-cards.png](screenshots/mobile-320-cards.png)

## 風險與下一輪建議 (Risks & Next Step)

- **風險與限制**：
  - 本地環境未安裝 Playwright / axe-core 全域依賴，瀏覽器實機測試透過 eval 內建 CDP Chromium 進行驗證，已確認全流程通過。
  - 57 個 GitHub Actions workflow 在每次 push 時仍會並行觸發；前輪已加入 `published-check.cjs` 防止過期 main commit 誤報，但大量並行工作排隊仍可能偶遇 runner 逾時或 GitHub API 429。
- **下一輪最值得做的一件事**：
  - 針對長篇案例研究（>12 段）之目錄定位與提示詞區塊複製功能，進一步優化手機端長按/複製回饋與鍵盤快速跳轉體驗。
