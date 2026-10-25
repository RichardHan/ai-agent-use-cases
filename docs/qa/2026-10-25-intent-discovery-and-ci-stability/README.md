# 2026-10-25 首頁高意圖痛點探索、實作門檻直觀先驗、情境切換篩選清理與 CI 穩定度加固

## 背景與問題證據

1. **新訪客痛點尋找不易**：新訪客在首頁探索時，搜尋為嚴格 AND 匹配；若無引導，常見痛點如「收件匣整理」、「日報與會議」、「自動客服」、「代碼審查」不易迅速發現。
2. **門檻篩選缺乏前置說明**：原有 `<select id="difficulty">` 僅顯示簡稱「入門對話」「工具串接」「進階開發」，未在選單文字直接說明「免寫程式」「需帳號或外掛」「需本機環境或代碼」，增加初次探索的認知負擔。
3. **情境切換遺留過期門檻限制**：在 `chooseScenario()` 中，點選首頁情境卡會重設關鍵字與主要條件，但漏清 `filters.difficulty`，導致先前點選的門檻條件在背景殘留，致使新情境下的案例無預警過度過濾或顯示 0 筆。
4. **GitHub Actions 頻繁失敗根因**：
   - `tests/reading-anchor-browser.cjs:26` 與 `tests/round-browser.cjs:115` 在滾動測試時使用未 clamp 的滑鼠滾輪 delta，且以全域 window `height` 取代 `#detail` 彈窗底緣作為斷言基準，導致在不同視口（如 740px、844px）及窄螢幕下偶發斷言失敗。
   - `.github/workflows/related-qa.yml` 工作時限僅 12 分鐘，`tests/related-browser.cjs` 僅輪詢 60 次（5 分鐘），無法覆蓋 GitHub Pages 測得的 11 分 38 秒部署時差。

## 方案比較與決策

- **方案 A（本輪實作）：高意圖痛點導向、門檻先驗說明、情境清理與 CI 幾何與輪詢加固**
  - 在首頁與常用搜尋加入高意圖痛點按鈕（「收件匣與郵件」、「日報與會議」、「自動客服」、「代碼審查」、「比價省錢」、「旅遊規劃」）。
  - 將 `<select id="difficulty">` 選項直接補充誠實前置條件（「入門對話（免寫程式）」、「工具串接（需帳號或外掛）」、「進階開發（需本機環境或代碼）」）。
  - 修復 `chooseScenario()`，切換首頁情境時同步清空 `filters.difficulty = ''`，防止殘留限制。
  - 詳情頁維持結構化入門建議雙卡片（「🚀 怎麼開始」與「⚠️ 要注意什麼」），並保持可折疊與快捷直達按鈕，完整兼顧閱讀流暢度與現有測試契約。
  - 將 `tests/reading-anchor-browser.cjs` 與 `tests/round-browser.cjs` 的滾動計算與視口可見性嚴格限制在 `#detail` 容器內，消除因全域高度計算導致的假性失敗。
  - 將 `.github/workflows/related-qa.yml` 時限提升至 25 分鐘，`tests/related-browser.cjs` 輪詢上限調至 180 次（15 分鐘），覆蓋 Pages 部署延遲。
- **方案 B：純客戶端模糊搜尋與跨工作階段儲存**
  - 不更動首頁痛點與門檻說明，轉為實作 OR 容錯搜尋與 localStorage 標記。
  - 取捨：OR 搜尋破壞現有嚴格關聯性與 300+ 測試斷言；未解決情境殘留 bug 與 CI 幾何斷言不穩定問題。

## 驗收結果

1. **單元與回歸測試**：
   - `node --test tests/*.test.cjs` 共 331 項測試全數通過（PASS 331, FAIL 0）。
   - `node --check assets/app.js` 與 `node --check assets/reader.js` 語法檢查 0 錯誤。
2. **三種情境真實走查**：
   - **情境一（新訪客痛點尋找）**：點選「收件匣與郵件」，立即帶出 136 筆相關案例；篩選「入門對話（免寫程式）」進一步精確縮小至 83 筆免寫程式解法，一目了然。
   - **情境二（首頁情境探索）**：在套用門檻後回到首頁點選「生活日常」，`difficulty` 篩選被乾淨重設，91 筆生活案例完整列出，無隱藏限制干擾。
   - **情境三（多端與無障礙閱讀）**：走查桌面 1440px、手機 390px 及極窄 320px，`#detail` 水平溢出檢查皆為 `false`，按鈕觸控區域全數 >= 44px。
3. **獨立代碼審查反饋**：
   - 經 `IndependentReviewer` 獨立審查，指引區塊之初始展開狀態及閱讀錨點穩定度已修正至兼顧現有 CI 斷言與閱讀層級，全數審查項目靜態與動態指標通過。

## 截圖證明

- 基準截圖：`docs/qa/2026-10-25-intent-discovery-and-ci-stability/screenshots/baseline/`
- 本輪截圖：
  - `docs/qa/2026-10-25-intent-discovery-and-ci-stability/screenshots/after-desktop-home.png`
  - `docs/qa/2026-10-25-intent-discovery-and-ci-stability/screenshots/after-desktop-search-email.png`
  - `docs/qa/2026-10-25-intent-discovery-and-ci-stability/screenshots/after-desktop-filtered.png`
  - `docs/qa/2026-10-25-intent-discovery-and-ci-stability/screenshots/after-desktop-detail.png`
  - `docs/qa/2026-10-25-intent-discovery-and-ci-stability/screenshots/after-mobile-home.png`
  - `docs/qa/2026-10-25-intent-discovery-and-ci-stability/screenshots/after-mobile-detail.png`
  - `docs/qa/2026-10-25-intent-discovery-and-ci-stability/screenshots/after-narrow-detail.png`
