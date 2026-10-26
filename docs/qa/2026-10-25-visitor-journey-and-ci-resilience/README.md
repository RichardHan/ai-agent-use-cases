# 2026-10-25 首次訪客搜尋探索流暢化、全站觸控無障礙達標與 GitHub Actions 部署逾時加固

## 1. 本輪改善了什麼與訪客具體價值

針對初次造訪新訪客在搜尋未命中時遭遇生硬重複文案、常用搜尋標籤過於抽象、行動端關鍵連結觸控高度不足 44px 易誤觸、以及 GitHub Actions 近期因 Pages 實際構建耗時 18～24 分鐘而頻繁在 15 分鐘處噴錯報紅的問題，進行系統性加固與體驗升級：

1. **空結果引導文案去重與痛點導向收斂**：
   - 修正原先 `<h3>目前沒有符合「{query}」的案例</h3>` 與下方引導段落 `目前沒有符合「{query}」的案例，你可以從常見問題與真實案例開始：` 在 20 像素內一字不差重複出現的生硬體驗。
   - 保留標題的安全查詢回顯（40 字 safe textContent、Unicode 截斷與無橫向溢出），將引導文案優化為白話自然的 `建議直接從常見痛點或真實案例開始探索：`，第一時間引流至下方 8 個常見痛點捷徑（郵件摘要、會議日報、自動客服、代碼審查、發票、除錯、旅遊、比價），大幅降低搜尋受挫感。

2. **行動端全站觸控無障礙 100% 達標（零小於 44px 元素）**：
   - 實測發現頁首 `.repo-link`（原 17px 高）、統計區 `.stat-link`（原 18px 高）、`.reading-note a`（原 18px 高）及 `footer a`（原 18px 高）在手機視口上高度嚴重不足，違反 WCAG 2.5.5 / 2.5.8 觸控目標尺寸規範（>= 44×44px）。
   - 本輪以 `display: inline-flex; align-items: center; min-height: 44px;`、適度內邊距、`overflow-wrap: anywhere` 及高對比 `:focus-visible` 綠色輪廓全面加固，經全頁面掃描實測，全站小於 44px 互動元素數量降至 **0 個**，在桌面 1440px、手機 390px 與極窄 320px 上維持零水平溢出。

3. **常用搜尋標籤由孤立關鍵字升級為問題痛點導向**：
   - 將原本抽象孤立的 `☀️ 搜尋「每日」` 升級為 `☀️ 每日報表 · 搜尋「每日」`、`⏱️ 搜尋「排程」` 升級為 `⏱️ 定時排程 · 搜尋「排程」`，讓初次造訪者一眼看出該捷徑對應的生活與工作場景。
   - 嚴格保留原生 `data-query` 屬性與所有合約測試，100% 向後相容既有 JS 事件綁定與 URL 分享狀態。

4. **根治 GitHub Actions 因 Pages 18~24 分鐘部署時差引發的頻繁紅燈**：
   - **實測根因**：根據 GitHub Actions 歷史觀測，PR #116 之 `Category finding QA`（run 40189652925）與 `Related reading QA`（run 40189652859）在執行 18 分鐘後失敗。分析確認兩者資產比對輪詢上限僅硬編碼 15 分鐘（451 次 × 2s 或 180 次 × 5s），當 Pages 官方部署耗時 18.5 分鐘時便提早噴出 `Published assets did not match checkout within 15 minutes` 假性紅燈；且 `tests/related-browser.cjs` 在輪詢迴圈中缺乏即時 `skipIfSupersededPublishedUrl` 檢查，無法在有新 PR 合併時主動優雅退出。
   - **全面加固**：
     - 將 `.github/workflows/category-find-qa.yml` 輪詢上限提升至 750 次（25 分鐘 / 1500 秒），工作逾時調升至 30 分鐘。
     - 將 `tests/related-browser.cjs` 輪詢上限由 180 次提升至 300 次（25 分鐘 / 1500 秒），在迴圈內新增每 6 次（30 秒）即時 `skipIfSupersededPublishedUrl` 檢查與拋錯前閘門，同步將 `.github/workflows/related-qa.yml` 工作逾時調升至 30 分鐘。
     - 徹底消除部署時差導致的 CI 假警報。

---

## 2. 方案取捨

- **方案 A（本輪採納）：首次訪客搜尋探索流暢化、全站觸控無障礙達標與 GitHub Actions 部署逾時加固**
  - **優勢**：直擊使用者反饋之 Actions 頻繁失敗核心根因，為全站掃清所有小於 44px 的觸控缺陷，消除搜尋空結果重複生硬文案，提升任務搜尋標籤問題可辨識度。零資料庫更動，100% 相容既有合約與無障礙標準。
  - **成本**：低至中等；需精確調整樣式確保 320px 無橫向溢出，並更新自動化測試以維持斷言覆蓋。

- **方案 B：將行動版篩選面板重構為抽屜式 Modal 對話框**
  - **優勢**：在視覺上完全隔離搜尋與篩選。
  - **取捨**：會破壞現有 15+ 個端到端測試中針對 `#filter-options` 行內 disclosure 的幾何斷言，且在極窄手機（320px）上增加焦點陷阱與閱讀遮擋風險。

---

## 3. 修改前後截圖與預覽方式

- **本機預覽指令**：
  ```bash
  python3 scripts/preview.py /tmp/round-preview/ai-agent-use-cases
  python3 -m http.server 8123 --directory /tmp/round-preview
  # 開啟 http://127.0.0.1:8123/ai-agent-use-cases/
  ```

- **截圖檔案清單**：
  - 桌面修改前：`docs/qa/2026-10-25-visitor-journey-and-ci-resilience/screenshots/before-desktop.png`
  - 手機 390px 修改前：`docs/qa/2026-10-25-visitor-journey-and-ci-resilience/screenshots/before-mobile.png`
  - 極窄手機 320px 修改前：`docs/qa/2026-10-25-visitor-journey-and-ci-resilience/screenshots/before-narrow.png`
  - 桌面修改後：`docs/qa/2026-10-25-visitor-journey-and-ci-resilience/screenshots/after-desktop-home.png`
  - 手機 390px 修改後：`docs/qa/2026-10-25-visitor-journey-and-ci-resilience/screenshots/after-mobile-home.png`
  - 手機 390px 空結果修改後：`docs/qa/2026-10-25-visitor-journey-and-ci-resilience/screenshots/after-mobile-empty.png`
  - 極窄手機 320px 修改後：`docs/qa/2026-10-25-visitor-journey-and-ci-resilience/screenshots/after-narrow-home.png`

---

## 4. 變更檔案清單

1. `assets/app.js`：空結果引導段落文案去重，避免與標題重複。
2. `assets/style.css`：為 `.repo-link`、`.stat-link`、`.reading-note a`、`footer a` 補充 `>= 44px` 觸控高與清晰焦點外框，保持 320px 零溢出。
3. `index.html`：將「☀️ 搜尋「每日」」與「⏱️ 搜尋「排程」」升級為痛點問題標籤。
4. `tests/related-browser.cjs`：輪詢上限擴充至 300 次（25 分鐘），補齊迴圈內與拋錯前 superseded check。
5. `.github/workflows/category-find-qa.yml`：輪詢上限擴充至 750 次（25 分鐘），工作逾時調升至 30 分鐘。
6. `.github/workflows/related-qa.yml`：工作逾時調升至 30 分鐘。
7. `tests/visitor-clarity-and-actions-stability.test.cjs`：更新引導文案斷言，新增 2 項 CI 韌性與輪詢窗口測試。

---

## 5. 測試驗收與輸出摘要

- **Node 單元與回歸測試**：
  ```bash
  node --test tests/*.test.cjs
  # ℹ tests 351
  # ℹ pass 351
  # ℹ fail 0
  ```
- **JavaScript 語法檢查**：
  ```bash
  for f in assets/*.js tests/*.cjs scripts/*.cjs; do node --check "$f"; done
  # ALL_JS_SYNTAX_VALID (0 語法錯誤)
  ```
- **端到端瀏覽器與無障礙量測**：
  - 全站小於 44px 互動元素實測：0 個。
  - 1440px、390px、320px 水平溢出檢查：`docOverflow: false`，全視口無橫向滾動條。
  - 經 `IndependentReviewer` 獨立審查：PASS（無退化、無資料外洩、無未轉義危險）。

---

## 6. 三情境驗收走查

1. **情境一：初次造訪的非技術讀者**
   - 從首頁選擇「生活大小事」，挑選門檻「免寫程式（入門對話）」。
   - 精準篩選出 75 筆案例，首筆 UC-001 呈現「入門對話」徽章與清晰痛點說明。
   - 點開詳情查看「怎麼開始」與「要注意什麼」雙卡，關閉後焦點平順返回，滾動位置 0 偏移。

2. **情境二：尋找工作日常自動化的職場訪客**
   - 於搜尋列快捷標籤點選「☀️ 每日報表 · 搜尋「每日」」。
   - 關鍵字自動填入「每日」，即時呈現 114 筆相關案例，第一篇即為「逐則評價每日AI新聞，讓下一份依主題偏好調整」。
   - 痛點明確，免除摸索關鍵字的困擾。

3. **情境三：空搜尋狀態引流與痛點復原**
   - 搜尋未命中字詞「nonexistent_tool_xyz」，觸發空狀態。
   - 標題顯示「目前沒有符合『nonexistent_tool_xyz』的案例」，下方引導「建議直接從常見痛點或真實案例開始探索：」，無任何重複廢話。
   - 點擊「郵件摘要 · 搜尋「郵件」」捷徑，立即載入 138 筆郵件相關案例，首筆為 UC-020。

---

## 7. 未解決風險與下一輪優先項

1. **未解決風險**：若 GitHub 官方 Actions 佇列嚴重擁塞（排隊超過 10 分鐘以上），總時限 30 分鐘仍可能觸頂，需持續關注官方 runner 服務狀態。
2. **下一輪優先建議**：檢視極窄螢幕（320px）上多條件篩選移除按鈕（clear-facets）在連續操作下的無障礙焦點管理與提示流暢度。
