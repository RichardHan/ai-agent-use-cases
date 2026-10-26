# 2026-10-25 搜尋心智模型導引、無障礙錯誤播報與 GitHub Actions 發布逾時韌性加固

## 本輪改善項目與對訪客的具體價值

1. **搜尋心智模型導引 (`#search-hint`)**
   - **痛點**：新訪客在搜尋框輸入多個詞時，往往不清楚系統是採「AND」還是「OR」，也不確定全文搜尋涵蓋範圍。
   - **改善**：在搜尋框下方新增白話提示 `支援多詞同時符合（AND）；可搜尋想解決的問題、提及工具、實作作法與限制。`，並以 `aria-describedby` 綁定至 `#query` 輸入框。
   - **價值**：新訪客能迅速建立精確檢索心智模型，從「想解決的問題」出發，不必猜測搜尋語法。

2. **錯誤狀態無障礙與螢幕閱讀器播報**
   - **痛點**：舊版 `#error` 容器缺乏 ARIA alert 宣告，載入失敗時無焦點移動，使用螢幕閱讀器或輔助科技的使用者無法得知下方已發生異常。
   - **改善**：為 `#error` 容器補充 `role="alert"` 與 `aria-live="assertive"`。
   - **價值**：在網路異常或伺服器錯誤時，螢幕閱讀器能即時主動朗讀錯誤警示，提升全體使用者的無障礙體驗。

3. **篩選條件標籤 (`.active-filter`) 鍵盤互動增強**
   - **改善**：為 `.active-filter` 增設 `outline: 3px solid var(--green); outline-offset: 2px;` 的 `:focus-visible` 焦點環。
   - **價值**：使用 Tab 鍵操作的訪客能清晰看到目前聚焦的條件標籤，並直接按 Enter 或 Space 移除該條件。

4. **卡片摘要排版與舒適閱讀節奏**
   - **改善**：為 `.card .summary` 設定專用文字對比色 `#2a3a34` 與字距，在繁體中文多行呈現時保持清晰舒服的行間節奏。

5. **系統性解決 GitHub Actions 頻繁失敗的根因**
   - **根因分析**：
     1. GitHub Pages Jekyll 發布在負載高時需要 3 至 10 分鐘，而 `tests/published-version.cjs` 原僅輪詢 60 次（3 分鐘），導致延遲發布被誤判為發布失敗。
     2. 呼叫 `published-version.cjs` 的 `.github/workflows/facet-counts-qa.yml` 工作逾時僅設定 15 分鐘，輪詢窗口加上前置步驟很容易觸發 GitHub Actions 逾時強制中斷。
     3. `reader-controls-qa.yml` 原僅輪詢 90 次（3 分鐘），逾時 15 分鐘。
     4. `scripts/published-check.cjs` 中的 `git ls-remote` 缺乏 timeout，偶發網路延遲可能導致同步卡死。
     5. 根目錄缺少 `.gitignore`，且 `_config.yml` 未排除 `qa-artifacts` 與 `_site`。
   - **修正**：
     1. `tests/published-version.cjs` 輪詢次數提升至 300 次（15 分鐘）。
     2. `facet-counts-qa.yml` 與 `reader-controls-qa.yml`、`round-qa.yml` 的 `timeout-minutes` 提升至 25 分鐘，輪詢增加至 300~450 次。
     3. `scripts/published-check.cjs` 補齊 `timeout: 10000` 防護。
     4. 建立 `.gitignore` 並於 `_config.yml` 排除暫存目錄，杜絕工作樹污染。

---

## 方案評估與取捨

- **方案 A（本輪採用）：以「問題出發」補齊檢索心智模型、健全無障礙錯誤播報與 Actions 發布容錯**
  - **優點**：不破壞既有品牌與版面結構，直接消除使用者搜尋時的不確定性，並徹底根除 CI 在 Pages 部署延遲時的假性報錯。
  - **成本**：精準修訂 HTML/CSS/JS 與 Workflow 設定，成本低、安全性高、回歸測試全過。
- **方案 B：重構首頁為 Tab 分頁式單頁應用**
  - **缺點**：過度重構破壞既有 50+ 個端到端測試契約與 URL 直鏈語意，風險過高。

---

## 驗收結果與測試指令

### 1. 單元測試
```bash
node --test tests/*.test.cjs
```
- **輸出結果**：`tests 285, pass 285, fail 0, cancelled 0, duration_ms 4991ms`。全數通過。

### 2. 語法檢查
```bash
node --check assets/*.js && node --check tests/*.cjs
```
- **輸出結果**：通過，0 語法錯誤。

### 3. Jekyll Bundle 驗證
```bash
python3 scripts/preview.py /tmp/facet-preview && python3 scripts/check_corpus_bundle.py /tmp/facet-preview
```
- **輸出結果**：`PASS: 445 sources byte-for-byte identical; revision preview-bec1eafedaeff5dc80c67fb6f010ddb9a09a2e0517842090f763ed0dc1c174d2`。

### 4. 瀏覽器真實走查（三大情境）
1. **情境一：新訪客從「收件匣」問題出發**
   - 首頁展示「447 篇真實經驗」、「清楚標記憑據」、「依痛點找解法」三項承諾卡與新手三步驟。
   - 搜尋框出現白話提示「支援多詞同時符合（AND）；可搜尋想解決的問題、提及工具、實作作法與限制。」。
   - 搜尋「收件匣」精準篩選 136 筆相關經驗，高亮命中上下文。
   - 點擊卡片標題開啟詳情對話框，完整呈現入門建議、作者報告憑據與原文；按 Escape 順暢關閉並恢復焦點。
2. **情境二：開發者篩選「開發」情境並操作條件移除**
   - 篩選「開發」情境，上方即時出現 `使用情境：開發 ×` 條件標籤，顯示 99 筆結果。
   - 鍵盤聚焦條件標籤高亮清晰，點擊立即清除情境篩選，即時復原為 447 筆全部結果。
3. **情境三：空結果防禦與痛點捷徑修復**
   - 輸入不相干關鍵字 `xyz999不存在的任務`，觸發空結果並展示 6 個痛點標籤（日報整理、發票對帳、PR 審查等）。
   - 點擊「日報整理」立即恢復為 62 筆結果，不迷航、不中斷。

### 5. 尺寸與無障礙檢驗
- 桌面 1440px / 1280px / 1024px：版面舒適，搜尋提示清晰可讀。
- 手機 360px×740px / 375px×812px / 390px×844px：`scrollWidth <= clientWidth`（無水平溢出），首屏直接搜尋入口維持在首屏視口內（579px < 740px）。

---

## 截圖存檔

- 桌面版外觀：`docs/qa/2026-10-25-visitor-quality-and-ci-stability/screenshots/after-desktop.png`
- 手機版外觀：`docs/qa/2026-10-25-visitor-quality-and-ci-stability/screenshots/after-mobile.png`

---

## 未解決風險與下一輪建議

1. **未解決風險**：
   - 總庫中 57 個歷史 QA workflow 仍各別存在不同路徑觸發，未來若有過時分支可能觸發部分舊 workflow；建議持續精簡整併成單一標準 CI。
2. **下一輪最值得做的一件事**：
   - 針對案例詳情彈窗中的「原始研究與來源」排版，改善長表格與深層巢狀項目的行動版閱讀折疊體驗。
