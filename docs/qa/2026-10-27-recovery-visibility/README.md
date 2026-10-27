# 2026-10-27 補讀停止後的下一步

## 問題與選擇

目標讀者：在手機搜尋案例時遇到部分來源失敗，選擇補讀又停止等待的訪客。先前 Corpus bundle QA 曾報告焦點回到「重試未載入來源」但按鈕在視口外（見 `SITE.md` 發票搜尋記錄）；本輪本機舊版七組受控回歸通過，未在本機重現該間歇性失敗，不把它誤稱為每次必現。原流程在補讀進度與停止控制收起**之前**呼叫 `scrollIntoView(nearest)`，收起後位置可能變動。

- A（採用）：在最終面板更新之後，僅當焦點仍在重試控制上時將其置於可見中央。成本：停止時可能有一次明確捲動。
- B：記錄停止前座標、在收起進度後補償 scroll offset。可能較不跳動，但必須處理非同步來源、sticky 列與不同瀏覽器版面；不採用。

目標是能看到下一步，且保留已補回內容、未載入路徑、查詢與篩選。此輪不改來源、證據分類、搜尋排序或 Pages 工作流程。

## 前後畫面

| 尺寸 | 修改前本機受控補讀 | 修改後本機受控補讀 |
| --- | --- | --- |
| 390px | [停止後](before-mobile.png) | [停止後](after-mobile.png) |
| 1440px | [停止後](before-desktop.png) | [停止後](after-desktop.png) |

兩組都能看見控制；差異是修改後停止控制與進度收起完畢，重試按鈕才被定位在視口中段。截圖不證明正式站已發布。

預覽：`python3 scripts/preview.py /tmp/visitor-journey-20261027/ai-agent-use-cases`，再 `python3 -m http.server 8137 --directory /tmp/visitor-journey-20261027`，開啟 `http://127.0.0.1:8137/ai-agent-use-cases/`。預覽產生 457 個來源逐 byte 相同的 bundle；本地 Python 預覽不是 Jekyll 發布。

## 驗收

- 舊版 `SITE_URL=http://127.0.0.1:8137/ai-agent-use-cases/ QA_OUT=/tmp/visitor-recovery-before node tests/recovery-progress-browser.cjs`：七組通過，故無本機失敗前畫面；先前 CI 失敗保留為間歇性證據。
- 修改後同指令，`QA_OUT=docs/qa/2026-10-27-recovery-visibility`：Chromium 1440／390／320、Firefox 390、WebKit 390、零筆補回與詳情閱讀七組通過；焦點、中心位置、部分成功來源合併、重試、查詢與情境、無水平溢出均通過。等待及完成狀態 axe WCAG 2 A/AA、2.1 AA 違規 0；[完整報告](report.json)。
- `node --test tests/*.test.cjs`：363／363 通過。`node --check` 對 `assets/*.js tests/*.cjs scripts/*.cjs` 全通過。`python3 scripts/check_corpus_bundle.py /tmp/visitor-journey-20261027/ai-agent-use-cases`：457 個來源逐 byte 相同。
- 本機 390px 另外實走旅遊＋生活組合、零結果、UC-001 直鏈重載、關閉後返回焦點、Escape、固定 commit 的原始 Markdown 連結；無水平溢出。三種情境：部分補讀停止並重試；依問題搜尋後閱讀來源；不匹配的搜尋再改條件。這是模擬走查，不是使用者研究。
- 預覽一次本機量測：FCP/LCP 36ms、CLS 0.96、INP 72ms（`browser.vitals`；僅單次 localhost，不能外推正式站或當作改善）。
- 獨立 reviewer 靜態審查未發現明確退化；指出原 sticky 斷言未真正覆蓋吸頂狀態，因此改成停止後中心位置的明確驗收，並重新執行七組。

限制：正式站可能尚未含本輪版本；Pages 發布延遲曾達 22 分 29 秒，Actions 仍有未統一的短輪詢、安裝與 429 風險。下一輪優先將其他公開站 QA 閘門統一為同 SHA 的部署驗收，而不是再依舊站畫面報綠。
