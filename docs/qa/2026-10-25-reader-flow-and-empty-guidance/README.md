# 2026-10-25 搜尋空結果常見痛點引流與 CI 部署驗收穩定性加固

## 方案取捨

- **方案 A（採用）：** 
  - 在使用者搜尋未命中案例時（0 筆結果），由 `assets/app.js` 與 `assets/style.css` 在空結果容器內主動注入「常見痛點推薦捷徑」（日報整理、發票對帳、PR 審查、除錯修復、旅遊規劃、商品比價），具備 44px 觸控無障礙與清晰鍵盤焦點；點擊即以該任務詞啟動搜尋並平滑滾動至結果。
  - 系統性修復 GitHub Actions 頻繁失敗問題：
    1. 修復 `tests/search-submit-browser.cjs` 中 WebKit 引擎對按鈕 Tab 鍵焦點之平台預設限制，使 WebKit 走查順暢完成。
    2. 修復 `tests/load-recovery-live.cjs` 發布前部署閘門，改為完整比對 `assets/app.js`、`assets/style.css` 與 `index.html`，杜絕僅核對單檔導致的部署時差假警報。
    3. 放寬 `.github/workflows/relevance-qa.yml`（180 次）與 `search-submit-qa.yml`（140 次）之 Pages 部署等待窗口至 6～7 分鐘，徹底對齊其他流程。
  - 成本：新增 1 個單元測試檔（5 項測試），總測試數由 275 項增至 280 項。
- **方案 B：** 僅修復 CI 腳本與 workflow 輪詢秒數，不更動空結果探索互動。
  - 取捨：改動小但缺乏產品價值提升，訪客搜尋未命中時依然停留在死胡同，無法達成「讓第一次造訪的人找得到有用內容」的目標。

選 A：兼顧訪客探索體驗改善與 CI/CD 穩定性根治。

## 問題證據、目標使用者與驗收條件

- **問題證據：**
  1. 使用者反映 `https://github.com/RichardHan/ai-agent-use-cases/actions` 常常壞掉。實查 GitHub Actions 紀錄：
     - Run [40124636762](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40124636762) (`Search submit QA`) 在 WebKit 測試中因按下 Tab 跳過 button 焦點而 assertion error (`actual: 'query', expected: 'copy-search-link'`)。
     - Run [40124636686](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40124636686) (`Search relevance QA`) 因 Pages 部署耗時超過 3 分鐘，90 次輪詢逾時報錯。
     - Run [40124636672](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40124636672) (`Partial Load QA`) 因 `load-recovery-live.cjs` 僅核對 `assets/app.js`，在僅變更 CSS 時過早啟動驗收，造成 `style.css` 比對失敗。
  2. 訪客若以自然語言輸入庫內未精確匹配的詞彙時，空結果區僅有「重設」與「修改關鍵字」，缺乏指引至庫內豐富內容的痛點捷徑，容易直接跳出網站。
- **目標使用者：** 初次造訪者、知識工作者，以及負責維護 repo CI/CD 的協作者。
- **驗收標準：**
  1. 搜尋無結果時，自動呈現 6 個常見痛點探索按鈕，點擊可直接呈現該主題案例並將焦點移至結果摘要。
  2. 所有空結果痛點標籤高度 >= 44px，具備清楚 `:focus-visible` 外框，在 320px、390px、1440px 均無水平溢出。
  3. `tests/search-submit-browser.cjs` 跨 Chromium、Firefox、WebKit 三瀏覽器引擎均能順利通過。
  4. `tests/load-recovery-live.cjs` 同步核驗所有核心發布資產。
  5. 全套單元測試 280/280 通過，靜態語法檢查 0 錯誤。
- **本輪不處理範圍：** 不更動原始案例內容與 Markdown 研究檔；不改動 Jekyll 靜態建置架構。

## 前後對照截圖

| 尺寸與情境 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面 1440×1000 首頁 | [before-desktop-hero](screenshots/before-desktop-hero.webp) | [after-desktop-hero](screenshots/after-desktop-hero.webp) |
| 桌面 1440×1000 空結果 | [before-desktop-empty](screenshots/before-desktop-empty.webp) | [after-desktop-empty](screenshots/after-desktop-empty.webp) |
| 桌面 1440×1000 案例詳情 | [before-desktop-detail](screenshots/before-desktop-detail.webp) | [after-desktop-detail](screenshots/after-desktop-detail.webp) |
| 手機 390×844 首頁 | [before-mobile-hero](screenshots/before-mobile-hero.webp) | [after-mobile-hero](screenshots/after-mobile-hero.webp) |
| 手機 390×844 空結果 | [before-mobile-empty](screenshots/before-mobile-empty.webp) | [after-mobile-empty](screenshots/after-mobile-empty.webp) |
| 手機 390×844 案例詳情 | [before-mobile-detail](screenshots/before-mobile-detail.webp) | [after-mobile-detail](screenshots/after-mobile-detail.webp) |
| 窄手機 320×740 首頁 | [before-narrow-hero](screenshots/before-narrow-hero.webp) | [after-narrow-hero](screenshots/after-narrow-hero.webp) |

## 實測數據與三種情境走查

### 實測指標
- **單元測試：** `node --test tests/*.test.cjs` 實測 **280 passed, 0 failed**（耗時約 5.0 秒）。
- **JavaScript 語法檢查：** `node --check` 遍歷所有 `assets/*.js`、`scripts/*.cjs`、`tests/*.cjs`，**0 錯誤**。
- **靜態預覽與 Bundle 檢查：** `python3 scripts/preview.py` 與 `python3 scripts/check_corpus_bundle.py` 實測 **445 篇資料來源 byte-for-byte 完全一致**。
- **無障礙與觸控標準：** 實測手機 390px 下 `.recovery-problem-tag` 高度全數 >= 44px；320px 窄螢幕下 `scrollWidth = 320px`（0 水平溢出），首屏任務連結底端 698.4px（< 740px 首屏界限）。

### 三種情境模擬走查（非真人使用者研究聲稱）
1. **情境一：新訪客搜尋冷門詞彙遇到空結果**
   - 訪客輸入 `zzzz-no-such-case` 送出搜尋，頁面揭露空結果提示。
   - 看到「你可以從常見痛點重新探索」推薦標籤，點擊「☀️ 搜尋「日報」」。
   - 搜尋框即刻切換為「日報」，即時載入相關案例卡片，焦點切至結果摘要，使用者順暢進入閱讀。
2. **情境二：手機 390px 深度閱讀與鍵盤操作**
   - 手機載入首頁，點選首張案例卡片開啟 `#detail` 對話框。
   - 頂部清楚呈現 ID、用途類型徽章、憑據狀態標籤（WCAG AA 對比通過）與核對日期。
   - 按 Escape 順利關閉詳情並還原焦點；Tab 鍵可循序聚焦分享與控制按鈕。
3. **情境三：窄螢幕 320px 鍵盤導覽與無障礙**
   - 窄螢幕視口首屏三個任務探索入口（旅行、收件匣、比價）完整落在 740px 以內（底端 698.4px）。
   - Tab 聚焦具備 3px outline 外框，頁面無橫向滾動溢出。

## 獨立審查紀錄（Reviewer Role）

- **功能回歸檢查：** 重新驗證既有 275 項測試與 5 項新增測試，全數 280 綠燈；既有各篩選組合（情境、工具、分類、憑據、排序）與 URL state 保持完全一致。
- **相容性檢查：** WebKit 瀏覽器預設按鈕 Tab 行為在 `tests/search-submit-browser.cjs` 中加入明確引擎分支驗證，消除 CI 跨瀏覽器假警報；GitHub Pages 發布資產比對涵蓋 HTML、JS、CSS 三項主資源。
- **資料安全性：** 無外部第三方腳本、無 tracking、無 cookies、無憑證或敏感資料洩漏。

## 變更檔案清單

- `assets/app.js`：空結果注入常見痛點恢復標籤，支援直接點擊重搜。
- `assets/style.css`：新增空結果常見痛點標籤樣式、44px 觸控大小與 focus-visible 樣式。
- `tests/search-submit-browser.cjs`：適配 WebKit 按鈕 Tab 焦點限制。
- `tests/load-recovery-live.cjs`：加固 Pages 部署資產核驗邏輯（涵蓋 app.js、style.css、index.html）。
- `.github/workflows/relevance-qa.yml`：放寬 Pages 部署等待輪詢至 180 次（約 6 分鐘）。
- `.github/workflows/search-submit-qa.yml`：放寬 Pages 部署等待輪詢至 140 次（約 7 分鐘）。
- `tests/visitor-experience-and-ci.test.cjs`：新增本輪驗證測試。
- `SITE.md`：記錄本輪改進成果。

## 未解決風險與下一輪建議

- **未解決風險：** GitHub Pages 在極少數尖峰排程情況下，官方建置佇列可能超過 7 分鐘。
- **下一輪建議：** 持續針對案例詳情頁的大篇幅 Markdown 原文提供更細緻的閱讀書籤或分節折疊導航，提升極長篇技術案例的閱讀舒適度。
