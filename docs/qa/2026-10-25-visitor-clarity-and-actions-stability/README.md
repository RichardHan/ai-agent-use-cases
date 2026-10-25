# 2026-10-25 窄手機首頁任務入口可見性、空結果痛點標籤同步與全站 Actions 部署輪詢加固

針對初次造訪新訪客在極窄手機（320×740）上首頁堆疊留白過多導致任務探索入口掉出首屏、搜尋空結果痛點標籤計數在端到端測試中斷言不符（8 !== 6）、以及全站 GitHub Actions 因 Pages 部署延遲（既錄 8～12 分鐘）而頻繁出現假性超時紅燈（7 分鐘輪詢逾時或 caller 限制 12～15 分鐘）的問題，進行系統性加固與體驗優化。

## 方案比較與決策

- **方案 A（本輪採用）**：
  1. 針對 <=360px 視口，精算並收納 `.discovery-layout` 垂直留白與間距，將三項任務按鈕在 320×740 視口中的底部座標從 746.4px 壓至 690.8px（富餘 49.2px），確保嚴格滿足首屏可見性，同時保持 >= 44px 觸控無障礙規範與字級可讀性。
  2. 同步 `tests/combined-recovery-browser.cjs` 中的空結果探索標籤計數斷言（由 6 更新為 8），嚴格對齊 `assets/app.js` 所聲明的 8 項痛點標籤。
  3. 系統性加固全站 21 個 GitHub Actions 工作流程（統一調升逾時至 25 分鐘，輪詢窗口提升至 15 分鐘 / >= 181~451 次）與 6 個測試腳本，徹底消除 Pages 部署時差假警報。
  4. 加固 `reading-anchor-browser.cjs` 與 `round-browser.cjs` 的滾輪定位落點，解決 headless 環境滾輪事件未達標的偶發中斷。
- **方案 B（未採用）**：重構所有工作流程為單一大型複合 workflow，並為首頁引入折疊式抽屜。
  - **未採用原因**：改寫 50 個獨立專項 QA 風險過高，會失去各流程獨立告警隔離性，且卡片抽屜會增加額外 DOM 負擔與無障礙跳轉複雜度。

## 問題證據與變更

1. **GitHub Actions 實際失敗證據**：
   - `Combined recovery QA` 40164943937：`assert.equal(await page.locator('#empty-suggestions [data-problem-tag]').count(), 6)` 拋出 `AssertionError: 8 !== 6`。
   - `Home search entry QA` 40164944007：`task examples stay in the initial viewport` 拋出 `AssertionError: false == true`（320×740 視口下 y + height = 746.4px > 740px）。
   - `Search submit QA` 40164944024、`Available facet options QA` 40164943962、`Method shortcut QA` 40164943997、`Search context QA` 40164944004：因輪詢設定僅 84～140 次（4～7 分鐘）或 caller 限額 12 分鐘，在 Pages 部署耗時 8～12 分鐘時過早逾時失敗。
2. **具體修改檔案**：
   - `assets/style.css`：在 `@media(max-width:360px)` 中加入緊湊版面規格，維持 >= 44px 觸控規範。
   - `tests/combined-recovery-browser.cjs`：更新問題標籤數量為 8。
   - `tests/reading-anchor-browser.cjs` 與 `tests/round-browser.cjs`：加入滾動坐標兜底確保無頭環境坐標精準落入彈窗內。
   - `tests/search-context-live.cjs`、`tests/transient-loading-published.cjs`、`tests/deployed-browser.cjs`、`tests/reading-flow-browser.cjs`、`tests/trust-published.cjs`、`tests/reader-browser.cjs`：輪詢次數調升至覆蓋 15 分鐘。
   - 21 個 `.github/workflows/` YAML 檔案：逾時提升至 25 分鐘，輪詢次數放寬至 15 分鐘。
   - `tests/visitor-clarity-and-actions-stability.test.cjs`：新增 5 項回歸測試。

## 驗收結果

- 單元與整合測試：`node --test tests/*.test.cjs` 總計 336 項全數通過（331 項既有 + 5 項新增），0 失敗。
- JavaScript 語法基準：`node --check assets/app.js` 與 `node --check assets/reader.js` 均 0 錯誤。
- 靜態相容預覽與來源核對：`python3 scripts/preview.py` 與 `python3 scripts/check_corpus_bundle.py` 核對 447 個來源逐 byte 一致。
- 幾何與水平溢出實測：
  - 1440×1000 桌面：文件寬度 1440px，水平溢出 0px。
  - 390×844 手機：文件寬度 390px，水平溢出 0px。
  - 320×740 極窄手機：文件寬度 320px，水平溢出 0px；任務按鈕底端 690.8px <= 740px，富餘 49.2px。
  - 按鈕維持 >= 44px 觸控標準，對比度符合 WCAG AA。

## 截圖清單

| 視口尺寸與情境 | 截圖檔案 |
|---|---|
| 桌面 1440×1000 首頁英雄區與靈感抽卡 | [after-desktop-home.png](screenshots/after-desktop-home.png) |
| 桌面 1440×1000 搜尋「收件匣」高意圖結果 | [after-desktop-search.png](screenshots/after-desktop-search.png) |
| 桌面 1440×1000 詳情閱讀、前置門檻與直達指引 | [after-desktop-detail.png](screenshots/after-desktop-detail.png) |
| 手機 390×844 首頁價值徽章與新手步驟 | [after-mobile-home.png](screenshots/after-mobile-home.png) |
| 手機 390×844 門檻篩選「入門對話（免寫程式）」 | [after-mobile-filter.png](screenshots/after-mobile-filter.png) |
| 手機 390×844 詳情彈窗與工具列 | [after-mobile-detail.png](screenshots/after-mobile-detail.png) |
| 極窄 320×740 首頁首屏可見任務按鈕 | [after-narrow-home.png](screenshots/after-narrow-home.png) |
| 極窄 320×740 詳情閱讀無水平溢出 | [after-narrow-detail.png](screenshots/after-narrow-detail.png) |

## 三種真實情境走查紀錄

1. **情境一：新訪客依常見痛點直達解法（桌面 1440px）**
   - 訪客進入首頁，第一眼看到「447 篇真實經驗」、「清楚標記憑據」、「依痛點找解法」三張價值卡與三步驟新手引導。
   - 點擊「收件匣與郵件 · 搜尋「收件匣」」，頁面平滑定位至結果區，輸入框自動填入「收件匣」並顯示 29 筆相關案例。
   - 焦點回到結果標題，卡片清晰展示「🎯 解決痛點」與門檻徽章。

2. **情境二：非技術工作者依「實作門檻」篩選免寫程式案例（手機 390px）**
   - 展開篩選區，在「實作門檻」下拉選單中選擇「入門對話（免寫程式）」。
   - 結果即時更新為免代碼案例，無須猜測術語；若輸入不存在字詞，空結果區展示 8 個高頻痛點標籤引流，點擊「日報與會議」立即恢復有效結果。

3. **情境三：極窄螢幕首屏操作與詳情閱讀（手機 320px）**
   - 在 320×740 螢幕上，首頁英雄區緊湊展示標題、價值卡、三步驟與任務搜尋入口，最底端按鈕「比價省錢」位於 690.8px，完全包含於 740px 首屏內。
   - 點擊抽卡按鈕開啟 UC-001，詳情視窗完整適配，工具列緊湊不遮擋，按 Escape 鍵乾淨關閉並精確恢復原卡片焦點。

## 限制與下一步

- 本輪未更動 Markdown 案例庫既有研究文字，收錄真實性與合格審核保持 100% 原始數據。
- 下一輪最值得做的一件事：持續監控 GitHub Actions 雲端合併後的各項工作流程執行情況，特別是 WebKit 引擎在雲端 runner 上的執行時間與資源消耗。
