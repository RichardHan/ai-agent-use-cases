# 2026-10-25 詳情頁 WebKit 反向鍵盤焦點

## 問題與選題

目標讀者：使用鍵盤或輔助科技，在手機尺寸閱讀案例、複製連結後回到工具列的訪客。正式 Pages 上以 WebKit 390×844 開啟 `?case=UC-001`，聚焦「複製案例連結」後按 Shift+Tab，焦點落在 `#detail` 本身，而非「關閉」；本機修改前 Pages 相容預覽也重現 `focus=detail`。Chromium 1440 原本正常。既有 `reader-controls-browser.cjs:65-66` 已有這項回歸斷言，但未涵蓋 WebKit 程式交接後 `:focus-visible` 未必成立的情境。

- 方案 A：僅在對話框開啟、焦點為複製連結且按 Shift+Tab 時，明確交接至關閉鈕；以 `:focus` 補上可見輪廓。成本低，其餘 Tab 與箭頭維持原生。**採用。**
- 方案 B：接管整個 dialog 的循環焦點。可涵蓋更多瀏覽器特殊情況，但將承擔大量按鈕、動態內容、停用項目的維護與退化風險。

預期與驗收：WebKit 390、Chromium 1440、Firefox 390 從複製鈕反向切換到關閉鈕，具有可見焦點；詳情直鏈重整、關閉返回、搜尋與篩選及來源不退化。非本輪：重設詳情資訊架構、案例內容或其他焦點順序。

## 前後畫面

| 視口 | 修改前正式站 | 修改後本機預覽 |
|---|---|---|
| WebKit 390×844 | [before-390.png](before-390.png) — 焦點在 dialog | [after-390.png](after-390.png) — 焦點在關閉鈕，3px 輪廓 |
| Chromium 1440×1000 | [before-1440.png](before-1440.png) | [after-1440.png](after-1440.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-preview/ai-agent-use-cases && python3 -m http.server 8100 --directory /tmp/visitor-preview`，開啟 `http://127.0.0.1:8100/ai-agent-use-cases/?case=UC-001`。圖片只顯示修改時可讀的網站版本，正式站未部署此修正前不得當成部署後驗收。

## 實測

- 修改前 WebKit 390 `focus=detail`；修改後 `focus=close-detail`，計算輪廓 `3px solid rgb(121,159,39)`。Chromium 1440 原先／修改後皆 `close-detail`；三引擎修改後獨立焦點腳本均為 `close-detail`。
- `NODE_PATH=/tmp/visitor-qa/node_modules LABEL=visitor CONTROLS_URL=http://127.0.0.1:8100/ai-agent-use-cases/ node tests/reader-controls-browser.cjs`：Chromium 1440／390／320／360、Firefox 390、WebKit 390 全部完成；Axe WCAG 2 A／AA、2.1 AA 各視口 0 violations，工具列控制高度 44px、字級 14px，UC-001 GitHub 原文來源 HTTP 200。
- `node --test tests/*.test.cjs`：349/349 通過。`node --check assets/app.js` 與 `node --check assets/reader.js`：無語法錯誤。`python3 scripts/check_corpus_bundle.py /tmp/visitor-preview/ai-agent-use-cases`：450 個來源逐 byte 相同。
- 本機 390px 三情境：①「旅遊」＋「生活」20/452，UC-001 詳情、來源連結與關閉後保留條件及原卡焦點；②無命中 `unmatched-xyz987` 顯示 0/452 並回顯查詢；③ UC-001 直鏈及重新整理在上述六組瀏覽器驗收中維持開啟，返回後 query/scenario 不變。390 與 1440 比較畫面均無水平溢出。

風險：WebKit 的 `:focus-visible` 對腳本焦點交接依先前滑鼠／鍵盤模態而異，故改驗收實際可見的 computed outline；`:focus` 也會在滑鼠聚焦關閉鈕時顯示輪廓，刻意優先確保焦點可辨。本機 Playwright 模擬視口，未測實體 iPhone／VoiceOver。正式 Pages 與主分支 Actions 應在合併後觀察，不把尚在執行的工作冒稱成功。下一輪優先針對讀者從正文其他動態控制返回工具列的完整 Safari 焦點路徑抽樣。
