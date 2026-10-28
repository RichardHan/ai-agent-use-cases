# 首次載入時留在本站閱讀

問題：正式站首頁載入期間，抽卡與提交搜尋均停用；原替代入口只前往 GitHub `blob/main/INDEX.md`，離開本站且來源可能比發布版本新。目標是首次造訪、網路慢或停用 JavaScript 的讀者，在不等待案例全文時仍可閱讀公開索引。

兩案：A 以 metadata 建立即時搜尋，能站內查找，但需額外維護部分／完整結果語意與版本一致性；B（採用）將既有替代入口優先導向同版 Pages 的 `INDEX.html`，保留 GitHub 原始 Markdown 作次要入口。B 成本低且不誤稱索引能全文搜尋；索引本身很長，也沒有本站篩選，是本輪刻意不處理的限制。

驗收：390／1440px 可看見入口並用鍵盤開啟，`/ai-agent-use-cases/INDEX.html` 可在無 JS 時閱讀；Back 返回首頁；原 GitHub 入口仍在；既有搜尋、篩選、空結果、詳情直鏈與返回不變。Pages 路徑使用相對 URL，無追蹤或資料修改。預覽 `python3 scripts/preview.py /tmp/visitor-fallback-preview/ai-agent-use-cases` 並以 `python3 -m http.server 8157 --directory /tmp/visitor-fallback-preview` 開啟 `http://127.0.0.1:8157/ai-agent-use-cases/`。注意 Python 預覽不將 Markdown 轉為 Jekyll `INDEX.html`；完整索引路由只能在正式 Jekyll 發布後驗收，不能將預覽的同名 SPA fallback 誤報成功。

| 尺寸 | 修改前正式站 | 修改後本機預覽 |
| --- | --- | --- |
| 390px | [前](before-mobile.png) | [後](after-mobile.png) |
| 1440px | [前](before-desktop.png) | [後](after-desktop.png) |

基準 `node --test tests/*.test.cjs` 368 通過、0 失敗；`for file in assets/*.js tests/*.cjs; do node --check "$file" || exit; done` 通過；預覽 `python3 scripts/check_corpus_bundle.py /tmp/visitor-fallback-preview/ai-agent-use-cases` 核對 461 筆來源逐 byte 一致。正式站修改前瀏覽器回歸 `NODE_PATH=/tmp/visitor-fallback-tools/node_modules node tests/initial-index-fallback-browser.cjs` 因找不到站內索引連結而失敗；修改後本機 390px 連結焦點可達、44px 高，預覽 `INDEX.html` 仍是 SPA fallback，故不冒稱 Jekyll 路由在本機通過。正式站目前同路徑回應 200、標題「完整案例索引」，648 個連結、467 表格列，但須待本 SHA 發布後執行新回歸。預覽 1440px 搜尋「旅遊」33／463，疊加生活 20／463，無結果提示、UC-001 直鏈重載及 Escape 返回通過；390px 無橫向溢出。獨立審查指出新瀏覽器測試的連結名稱、第一個 h1 假設錯誤，已改依實際可及名稱與精確標題定位；未發現新的安全或 base path 問題。未量測效能或 axe，亦未將模擬走查稱為真人反饋。三種情境：慢載入先讀索引；停用 JS 仍走索引；需要原始 Markdown 轉往 GitHub。下一輪優先規劃帶版本與覆蓋聲明的輕量可搜尋入口。
