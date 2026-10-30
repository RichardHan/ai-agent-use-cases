# 首次載入：慢速整包與備援

## 問題與選擇

先前正式站觀察到 121 筆已載入、344 個來源未載入；原因未確定（見 `2026-10-30-partial-statistics/README.md`）。原整包逾時 2.5 秒後轉逐篇下載；受控測試以 2.7 秒成功回應重現了不必要的逐篇請求。目標是讓首次造訪且整包稍慢的讀者取得完整可搜尋資料，不宣稱此改動已解決先前正式站觀察。

- A（採用）：整包預設等待 5 秒，保留 20 秒整體期限與逐篇備援；整包真正停滯時備援比以前晚 2.5 秒。
- B：拆分版本化整包、漸進載入；長期可改善更慢網路，但需改變發布及快取契約，本輪不處理。

## 驗證

- 先新增 2.7 秒整包成功的測試：原版在 2.5 秒中斷並額外請求三篇，測試失敗；修改後只請求整包，內容完整。
- `node --test tests/*.test.cjs`：389 通過；`node --check assets/app.js`、`node --check assets/reader.js` 通過。
- `python3 scripts/preview.py /tmp/visitor-after-1030/ai-agent-use-cases`；`python3 scripts/check_corpus_bundle.py /tmp/visitor-after-1030/ai-agent-use-cases`：469 個來源逐 byte 相同。
- `SITE_URL=http://127.0.0.1:8766/ai-agent-use-cases/ QA_OUT=/tmp/visitor-recovery-evidence-1030 node tests/corpus-bundle-browser.cjs`：Chromium 1440／390／320、Firefox 390、WebKit 390 通過；HTTP 失敗、無效整包、整包停滯、詳情提前顯示、停止及補讀、整包先完成六種路徑通過，axe 無違規。受控停滯後逐篇備援完成為 5,278 ms。
- Chromium 1440 與 390：`SITE_URL=http://127.0.0.1:8766/ai-agent-use-cases/ QA_PUBLIC=1 QA_OUT=/tmp/visitor-after-evidence-1030 node tests/corpus-bundle-browser.cjs` 通過。搜尋旅遊並組合情境與工具、開詳情及來源、返回、空結果、鍵盤焦點、詳情直鏈重整均通過；讀者及空結果 axe 違規為零。結果 471 條、失敗來源零；這是網站條目數，不是合格案例數。
- 相同測試在原版預覽執行；前後截圖留在 `/tmp/visitor-before-evidence-1030/` 與 `/tmp/visitor-after-evidence-1030/`，包括 `home-chromium-1440.png`、`home-chromium-390.png`、結果及詳情。此改動無刻意視覺差異；此環境未能目視判讀影像。
- 三個模擬情境：旅遊搜尋加情境和工具、開啟案例並返回；無結果後重新編輯搜尋；分享詳情直鏈並重整。非真人使用研究。
- 未參與實作的獨立審查未發現阻擋問題；指出 5 秒不是經實際網路量測得出的最佳值，停滯時會多等待 2.5 秒。

預覽：在 repo 執行 `python3 scripts/preview.py /tmp/preview/ai-agent-use-cases`，再執行 `python3 -m http.server 8086 --directory /tmp/preview`，開啟 `http://127.0.0.1:8086/ai-agent-use-cases/`。本機未安裝 Jekyll，實際 Pages build 以 Actions 為準；尚未證明真實弱網效能或原先部分載入原因。
