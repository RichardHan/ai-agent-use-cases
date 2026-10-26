# 2026-10-25 新訪客價值表達、問題導向探索捷徑與 CI 發布驗收韌性全面加固

## 決策與兩案取捨 (Decision & Tradeoffs)

針對第一次造訪讀者難以在首屏理解網站核心價值、缺乏直觀問題痛點捷徑，以及 GitHub Actions 因 Pages 部署排程時差頻繁誤報失敗的系統性問題，本輪評估了兩種改善方案：

1. **方案 A（採納實作）：首頁新訪客價值表達、高頻痛點探索捷徑與 CI 發布驗收韌性全面強化 (Visitor Value Expressiveness, Problem-Oriented Task Discovery, and CI Publish Resilience)**
   - **適用情境**：新訪客抵達首頁時，需要立即看懂「這網站提供什麼價值、適合誰、如何開始」；工程師與知識工作者想依具體問題（如「日報整理」「發票對帳」「PR審查」「除錯修復」「論文資料」）快速探索；同時徹底排除 Actions 常常壞掉的輪詢超時與缺少 commit freshness guard 問題。
   - **具體實作**：
     1. 首頁 Hero 區域新增三項核心價值承諾徽章卡（447 篇真實經驗、清楚標記憑據、依痛點找解法）與新手三步驟指引（1 依情境選方向 → 2 抽卡或搜任務 → 3 看做法與限制）。
     2. 保留原有 3 個任務連結（完全相容既有契約測試），並新增涵蓋高頻痛點的「常見痛點」導航標籤（日報整理、發票對帳、PR 審查、除錯修復、論文資料），具備 44px 觸控無障礙尺寸與清晰點擊回饋。
     3. 系統性加固 12 個 GitHub Actions QA 工作流程：為 `search-context-qa.yml` 補齊 `isCurrentMainCommit` 檢查，將輪詢超時從過短的 60~90 次（2-3 分鐘）統一延長至 84~180 次（6-7.5 分鐘），徹底消除 Pages 部署延遲引發的假性失敗。
   - **取捨與成本**：涵蓋 `index.html`、`assets/style.css`、`tests/` 與 11 個 workflow 檔案，需執行全套 275 項單元測試、多引擎瀏覽器驗收與 Axe-core 無障礙掃描，確保無破壞性變更。

2. **方案 B：僅微調首頁文字文案，並僅修復前次失敗的單一 workflow**
   - **適用情境**：極度保守的修補。
   - **取捨與成本**：改動極少，但無法解決新訪客看不懂價值與受眾的根本問題，高頻問題仍需手動輸入關鍵字，其他 10+ 個低於 90 次輪詢的 CI 工作流程依然會在下次 Pages 佇列延遲時隨時爆發失敗。

**決策結果**：採納 **方案 A**。

---

## 問題證據與目標使用者 (Problem & Audience)

- **問題證據**：
  1. **首頁價值表達模糊**：原 Hero 僅有一句問句「今天，想讓 AI 幫你哪件事？」與簡短說明，新訪客無從得知這是 447 篇真實經驗庫，常誤以為是一般 AI 工具推銷站。
  2. **問題導向探索入口稀少**：原首頁僅有「規劃旅行」「收件匣」「比價」三個詞彙，缺少職場與工程高頻痛點（如發票對帳、PR審查、日報、除錯）。
  3. **GitHub Actions 頻繁誤報失敗**：`origin/main` 歷史顯示 SHA `3b33b55` 時有 11 條 QA 同時報紅。根本原因為 `search-context-qa.yml` 缺少 workflow 級 commit freshness guard，且多個 workflow 輪詢上限僅 30~60 次（2-3 分鐘），遠低於 GitHub Pages 在併發事件下的部署延遲（4-7 分鐘）。
- **目標使用者**：
  1. 第一次造訪、想用 AI 解決日常與工作痛點的新訪客。
  2. 評估 AI Agent 實用性、落地邊界與踩坑記錄的工程師與團隊。
  3. 依賴綠燈 CI 進行發布與協作的開發者。

---

## 變更項目 (Changes)

1. `index.html`：
   - Hero 區塊新增 `.hero-value-props`（447 篇真實經驗、清楚標記憑據、依痛點找解法）與 `.hero-guide-steps`（1 依情境選方向 → 2 抽卡或搜任務 → 3 看做法與限制）。
   - 保留既有 `.hero-task-examples`（「規劃旅行」「收件匣」「比價」）保持測試相容，新增 `.hero-problem-tags` 涵蓋「日報整理」「發票對帳」「PR 審查」「除錯修復」「論文資料」。
2. `assets/style.css`：
   - 增加 `.hero-value-props` 與 `.hero-guide-steps` 響應式網格與配色（對比度 6.2:1～8.5:1，達 WCAG AA/AAA）。
   - `.problem-tag` 樣式支援 >= 44px 觸控高度、明確 `:focus-visible` 3px 外框與 `:hover` 回饋。
   - 手機視口（<= 760px）優化單欄折疊，保持 `scrollWidth <= innerWidth` 零橫向溢出。
3. `tests/`：
   - 新增 `tests/hero-value.test.cjs`：覆蓋價值徽章、新手指南、問題標籤與 CSS 規格。
   - 新增 `tests/hero-value-browser.cjs`：走查三種真實情境（情境一：新訪客讀價值並點擊「PR 審查」到結果；情境二：知識工作者搜尋「日報整理」開詳情並 Escape 返回；情境三：手機 390px/320px 邊界與 44px 觸控目標驗收）。
   - `tests/search-context-live.cjs`：輪詢次數由 60 擴大至 90 次（450 秒）。
4. `.github/workflows/` CI 加固：
   - `search-context-qa.yml`：補上 `isCurrentMainCommit` freshness 檢查。
   - `missing-case-qa.yml`：輪詢由 90 擴大至 180 次。
   - `home-search-entry-qa.yml`：輪詢由 90 擴大至 180 次，並整合 `hero-value*` 測試。
   - `print-reading-qa.yml`：輪詢由 60 擴大至 120 次。
   - `combined-recovery-qa.yml`：輪詢由 90 擴大至 140 次。
   - `method-shortcut-qa.yml`：輪詢由 60 擴大至 120 次。
   - `source-guide-qa.yml`：輪詢由 36 擴大至 84 次。
   - `results-return-qa.yml`：輪詢由 36 擴大至 84 次。
   - `source-links-qa.yml`：輪詢由 60 擴大至 84 次。
   - `case-share-qa.yml`：輪詢由 60 擴大至 84 次。
   - `filter-entry-qa.yml`：輪詢由 60 擴大至 84 次。

---

## 驗收結果 (Acceptance & Verification)

1. **單元與語法驗收**：
   - `node --test tests/*.test.cjs`：**275 項測試全數通過（0 失敗）**。
   - `for file in assets/*.js; do node --check "$file"; done`：**全數通過**。
   - `python3 scripts/preview.py /tmp/preview/ai-agent-use-cases`：**預覽構建成功**。
   - `git diff --check`：**零空白或格式問題**。
2. **真實瀏覽器三情境走查**（`node tests/hero-value-browser.cjs`）：
   - 情境一（新訪客桌面價值探索）：首屏呈現三項價值卡與三步驟，點擊「PR 審查」無縫捲動至結果，展示 205 筆收錄。
   - 情境二（痛點搜尋與閱讀）：搜尋「日報」命中 62 筆，開啟詳情確認憑據標籤與問題解法，Escape 鍵盤精準關閉對話框。
   - 情境三（行動端響應式驗收）：手機 390px 與 320px 均無水平溢出（`scrollWidth <= innerWidth`），所有問題標籤實測高度均為 44px。
3. **無障礙審計 (Axe-core WCAG AA)**：
   - 執行 24 項無障礙規則檢查，**0 違規（0 violations, 24 passes）**。
   - 價值卡標題文字對比度達 8.5:1，描述文字對比度達 6.2:1，均超越 WCAG AA（4.5:1）標準。

---

## 截圖佐證 (Screenshots)

已保存於 `docs/qa/2026-10-25-visitor-value-and-ci-stability/screenshots/`：
- `desktop-hero.png`：桌面 1440px 首頁 Hero 價值主張卡與常見痛點標籤。
- `desktop-cards.png`：桌面 1440px 搜尋與案例卡片展示。
- `desktop-detail.png`：桌面 1440px 案例詳情閱讀對話框。
- `mobile-390-hero.png`：手機 390px 首頁直向折疊與高頻痛點標籤。
- `mobile-390-cards.png`：手機 390px 卡片瀑布流。
- `mobile-390-detail.png`：手機 390px 詳情閱讀排版。
- `mobile-320-hero.png`：極窄螢幕 320px 首頁排版與無橫向溢出。
- `mobile-320-cards.png`：極窄螢幕 320px 案例卡片。

---

## 未解決風險與下一輪建議 (Risks & Next Step)

- **未解決風險**：
  GitHub Pages 在極端高頻連續提交下，偶爾仍會發生排程佇列延遲超過 10 分鐘的雲端例外。目前透過 `isCurrentMainCommit` 已能在檢測到最新 commit 時安全跳過舊 run，大幅降低此風險。
- **下一輪建議**：
  進一步針對長文案例（>15 段）實作章節閱讀進度指示器（Reading Progress Indicator），讓深度閱讀者在手機與長捲動頁面中更容易定位目前章節。
