# 2026-10-25 案例卡片實作門檻直觀標示、行動指引層級加固與 GitHub Actions 輪詢訊息精確化

針對初次造訪的新訪客在瀏覽案例卡片時，難以一眼理解「入門對話」、「工具串接」與「進階開發」背後的真實技術要求（原先「免寫程式」、「需外掛/帳號」等解釋僅藏於 HTML `title` 懸停浮動提示，在觸控手機與平板上完全無法得知），以及全站 GitHub Actions 中 `home-search-entry-qa.yml` 殘留過時的「within 360 seconds」錯誤警報文字（實際輪詢窗口早已提升至 15 分鐘 / 451 次）造成除錯困擾的問題，進行系統性的資訊層級加固與體驗改善。

## 方案比較與決策

- **方案 A（本輪採用）**：
  1. **卡片實作門檻直觀化（Companion Difficulty Note）**：
     - 在保持既有 `.card-difficulty` 標籤與合約屬性 100% 向後相容的前提下，於卡片頂端即時渲染白話提示標籤 `.card-difficulty-note`（`免寫程式`、`需外掛/帳號`、`需代碼/環境`）。
     - 採用淡色虛線邊框與特定語意色彩（綠色系免寫程式、藍色系需外掛、紫色系需代碼），觸控螢幕使用者無須點擊或長按懸停即可立即判斷是否適合自己。
     - 設置 `aria-hidden="true"` 避免重複朗讀，既有 `.card-difficulty` 的完整 `aria-label="實作門檻：入門對話（免寫程式）"` 依然為螢幕閱讀器提供完整資訊。
  2. **GitHub Actions 輪詢警報精確化**：
     - 修正 `.github/workflows/home-search-entry-qa.yml` 中殘留的 `within 360 seconds` 報警訊息，更新為 `within 15 minutes (451 attempts)`，確保日後 CI 失敗診斷時與真實執行的 15 分鐘（451 × 2s）輪詢窗口完全一致。
  3. **自動化回歸測試加固**：
     - 在 `tests/visitor-clarity-and-actions-stability.test.cjs` 新增測試，嚴格驗證三種難度門檻在卡片上的白話伴隨標籤生成與 CSS 屬性選擇器定義，並防堵工作流程檔案再次殘留過時的 360 秒警報文字。
- **方案 B（未採用）**：
  - 重構前端搜尋分詞演算法為寬鬆模糊匹配（Fuzzy OR）與自動補全。
  - **未採用原因**：現有測試套件（如 `tests/search.test.cjs`、`tests/search-context-browser.cjs` 等）高度依賴嚴格的精確 AND 語意與同義詞展開邏輯，任意放寬搜尋演算法會導致數十個既有搜尋回歸測試失敗，且增加前端記憶體負擔。

## 具體修改檔案

1. `assets/app.js`：
   - 定義 `DIFFICULTY_NOTES` 常數對應表（`入門對話` -> `免寫程式`，`工具串接` -> `需外掛/帳號`，`進階開發` -> `需代碼/環境`）。
   - 在 `card()` 生成函式中，於 `diffBadge` 後方掛載 `.card-difficulty-note`。
2. `assets/style.css`：
   - 新增 `.card-difficulty-note` 基礎樣式與三種難度門檻的顏色與虛線框規範。
3. `.github/workflows/home-search-entry-qa.yml`：
   - 更新行 71 的輪詢逾時訊息文字為 `within 15 minutes (451 attempts)`。
4. `tests/visitor-clarity-and-actions-stability.test.cjs`：
   - 新增 2 項端到端自動化測試，總測試數提升至 338 項。

## 驗收結果

- **單元與整合測試**：`node --test tests/*.test.cjs` 總計 338 項全數通過，0 失敗。
- **JavaScript 語法檢查**：`node --check assets/app.js` 與 `node --check assets/reader.js` 0 語法錯誤。
- **靜態來源與打包校驗**：
  - `python3 scripts/preview.py` 與 `python3 scripts/check_corpus_bundle.py` 驗證 447 個 Markdown 檔案 byte-for-byte 完全一致。
- **視口幾何與無障礙實測**：
  - 桌面視口（1440×1000）：文檔寬度 1440px，水平溢出 0px。
  - 手機視口（390×844）：文檔寬度 390px，水平溢出 0px。
  - 極窄手機視口（320×740）：文檔寬度 320px，水平溢出 0px。
  - 觸控目標標準：所有按鈕、下拉選單與互動標籤維持 >= 44px 觸控標準，對比度符合 WCAG AA。
- **獨立審查（Reviewer Agent）**：
  - 獨立 Reviewer Agent 查驗靜態 diff 與運行時行為，確認無功能退化、無可訪問性障礙、無 YAML 結構問題，給予 PASS 判定。

## 修改前後截圖對比

| 視口與情境 | 修改前截圖 | 修改後截圖 | 改善亮點 |
|---|---|---|---|
| 桌面 1440×1000 首頁 | [before-desktop-home.png](screenshots/before-desktop-home.png) | [after-desktop-home.png](screenshots/after-desktop-home.png) | 卡片頂部並列顯示「免寫程式」直觀白話標籤 |
| 桌面 1440×1000 搜尋「收件匣」 | [before-desktop-search.png](screenshots/before-desktop-search.png) | [after-desktop-search.png](screenshots/after-desktop-search.png) | 搜尋結果列表即時呈現門檻難度與痛點卡片 |
| 桌面 1440×1000 詳情閱讀 | [before-desktop-detail.png](screenshots/before-desktop-detail.png) | [after-desktop-detail.png](screenshots/after-desktop-detail.png) | 詳情閱讀排版舒適、目標對象與門檻層級分明 |
| 手機 390×844 首頁 | [before-mobile-home.png](screenshots/before-mobile-home.png) | [after-mobile-home.png](screenshots/after-mobile-home.png) | 手機觸控即視「免寫程式」，消除猜測 |
| 手機 390×844 篩選面板 | [before-mobile-filter.png](screenshots/before-mobile-filter.png) | [after-mobile-filter.png](screenshots/after-mobile-filter.png) | 篩選選項符合 44px 觸控無障礙規範 |
| 手機 390×844 詳情閱讀 | [before-mobile-detail.png](screenshots/before-mobile-detail.png) | [after-mobile-detail.png](screenshots/after-mobile-detail.png) | 詳情彈窗完整適配，工具列緊湊 |
| 極窄 320×740 首頁 | [before-narrow-home.png](screenshots/before-narrow-home.png) | [after-narrow-home.png](screenshots/after-narrow-home.png) | 320px 極窄寬度無水平捲軸，標籤整齊折行 |
| 極窄 320×740 詳情閱讀 | [before-narrow-detail.png](screenshots/before-narrow-detail.png) | [after-narrow-detail.png](screenshots/after-narrow-detail.png) | 彈窗文字自動斷行，閱讀體驗流暢 |

## 三種真實情境走查紀錄

1. **情境一：非技術行政工作者尋找免寫程式工具（手機 390px）**
   - 訪客透過手機進入首頁，在未開啟篩選前直接向下瀏覽卡片，一眼看到卡片頂部的綠色 `免寫程式` 標籤，立即知道哪些案例自己可以立刻拿去用，無須具備程式背景。
   - 點擊卡片閱讀按鈕進入詳情，關閉時焦點平滑回復至原按鈕。

2. **情境二：開發者依關鍵字「收件匣」搜尋並篩選高門檻案例（桌面 1440px）**
   - 訪客搜尋「收件匣」，卡片清單中清楚標記紫色 `需代碼/環境` 與藍色 `需外掛/帳號`。
   - 訪客直接鎖定「進階開發」案例點入閱讀，原始研究與步驟清楚分明。

3. **情境三：極窄手機（320×740）下的自適應與可讀性**
   - 在 320px 極窄寬度下，新增的 `.card-difficulty-note` 與情境、難度徽章在彈性盒模型中優雅折行，完全無水平溢出（scrollWidth === innerWidth === 320px）。
   - 點擊閱讀彈出視窗後，Escape 鍵能正常退出並復原原卡片焦點。

## 限制與下一步

- 本輪未更動 Markdown 原始檔案，收錄研究與評據保持 100% 原始數據。
- 下一輪最值得做的一件事：持續在 GitHub Actions 中引入共享的複合 Action（Composite Action），避免 50 多個 workflow 重複安裝 Playwright 與重複輪詢 Pages 部署狀態。
