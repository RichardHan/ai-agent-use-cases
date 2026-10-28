# 2026-10-28：載入停滯時保留案例索引入口

問題證據：原本 JavaScript 已啟用但 `assets/app.js` 未執行時，首頁仍顯示「正在準備案例卡…」，搜尋與抽卡無法操作；完整 Markdown 索引只在 `<noscript>` 或載入失敗區塊出現。手機 390×844 的原始靜態頁面沒有可見的直接索引入口。這不是來源已載入或成果已驗證的宣稱。

目標讀者：首次造訪、需要立即找案例但遇到腳本或案例載入延遲的人。

- 方案 A（採用）：在首頁搜尋入口旁放一個永遠可用、直接指向公開 GitHub `INDEX.md` 的原生連結。成本低，不依賴 JS；取捨是離開本站，且 GitHub 的 `main` 索引可能比已發布 Pages 更新。
- 方案 B：為整個搜尋介面提供無 JS 的靜態分類索引。可留在本站，但需要另一份產製與同步機制，容易讓計數和來源版本漂移；本輪不採用。

驗收：停用 app.js 的 JS 啟用狀態下，390px 手機首屏可見入口，連結可鍵盤聚焦，最小高度 44px；1440px 桌面有相同入口；正常載入時仍可搜尋、組合篩選、空結果、詳情與返回、直鏈重載，不產生橫向溢出。原始案例與來源不改。不處理 GitHub 可用性、整站離線瀏覽、搜尋相關性或 Actions 發布競速。

| 狀態 | 390px 手機（app.js 不執行） | 1440px 桌面（正常載入） |
| --- | --- | --- |
| 修改前 | [截圖](2026-10-28-stalled-index-before-mobile.png) | [截圖](2026-10-28-index-before-desktop.png) |
| 修改後 | [截圖](2026-10-28-stalled-index-after-mobile.png) | [截圖](2026-10-28-index-after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-quality-20261028-preview/ai-agent-use-cases`，再用 `python3 -m http.server 8138 --directory /tmp/visitor-quality-20261028-preview` 開啟 `http://127.0.0.1:8138/ai-agent-use-cases/`。手機停滯截圖使用相同預覽 HTML、僅移除 app.js script 標籤以模擬腳本未執行；不是網路實測斷線。桌面修改前截圖由相同預覽移除新入口對照，非正式站截圖。

基準 `node --test tests/*.test.cjs`：364 通過、0 失敗；`scripts/preview.py` 成功。修改後瀏覽器 390px：連結 y=682.8px、高 44.4px、聚焦輪廓 solid、水平溢出 0；正常搜尋「旅遊」33／459，生活組合 20／459，無效詞 0／459，UC-001 直鏈重載與關閉返回成功。正式 Pages 尚未發布，不將本機結果當成正式站驗收。

下一輪：針對主分支 Reader source links／Print reading QA 的公開資產等待窗口（仍約 15 分鐘）與曾觀察到 22 分 29 秒的 Pages 發布時差統一處理。
