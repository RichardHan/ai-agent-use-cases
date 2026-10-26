# 長案例用途先讀（2026-10-26）

## 問題與選擇

目標讀者：從搜尋進入詳情、先判斷是否值得讀下去的初訪者。正式站 320px 直鏈 UC-359 的「可以幫你做什麼」是一段長約 645px 的作者案例描述，段落自 y=532 延伸到 y=1177，而詳情視窗底端為 y=703；真正的「核心目標」因此落在下一屏。案例描述仍重要，不能直接截斷或改寫為實測結果。

- 方案 A：縮小字級與間距。低成本，但長敘述仍佔首屏且損及可讀性。
- 方案 B（採用）：當用途超過 180 字且有不同的既存核心目標時，以該目標先說明用途，完整原描述保留在原位的原生可展開區。中等成本，多一個操作，但不遺失作者敘述。短用途或沒有核心目標的條目維持原樣。

不處理：改寫來源資料、語意摘要、搜尋排序、所有詳情捷徑或外部來源可用性。核心目標是本庫整理，不代表作者原話或獨立驗證。

## 前後證據

| 畫面 | 截圖 |
| --- | --- |
| 正式站修改前 320px，UC-359 | [before-320.png](before-320.png) |
| 本地 Pages 相容預覽修改後 320px | [after-320.png](after-320.png) |
| 修改後 390px | [after-390.png](after-390.png) |
| 修改後 1440px | [after-desktop.png](after-desktop.png) |

修改後 320px 核心目標段落 y=532–672，視窗底端 y=703；完整案例描述 312 字可用滑鼠點選或鍵盤 Enter 展開，焦點留在 `summary`，沒有水平溢出。圖片是兩個不同發布狀態（正式站與本地預覽），不視為真人偏好或轉換證據。

預覽：`python3 scripts/preview.py /tmp/visitor-round-preview/ai-agent-use-cases`，接著 `python3 -m http.server 8100 --directory /tmp/visitor-round-preview`，開啟 `http://127.0.0.1:8100/ai-agent-use-cases/?case=UC-359`。此預覽不提供正式 Pages 的 build revision，故原始 Markdown 連結可指向 `main`；正式站的版本固定須於部署後另核對。

## 驗收

- 修改前 `node --test tests/detail-reading-and-evidence.test.cjs`：新增的長用途回歸失敗（期望先顯示核心目標，實際先顯示長描述）。修改後同檔 15/15 通過；短用途及缺少核心目標的分支保留原狀。獨立審查發現 Back 返回會收合完整描述，已納入閱讀歷史並用 UC-359 → 下一則 → Back 驗證展開狀態。
- `node --test tests/*.test.cjs`：基準 358/358、修改後 359/359；`node --check` 全部 `assets/*.js`、`tests/*.cjs` 通過；預覽 452 來源檔逐 byte 相同。無專屬 lint 或 typecheck；本機沒有 Jekyll Gemfile，正式 Pages build 交由 GitHub Actions。
- 本地瀏覽器三情境：① 320/390px UC-359 直鏈，閱讀目標、鍵盤 Enter 展開完整描述；② 390px「旅遊」＋「生活」20 筆，打開 UC-001、Escape 返回原搜尋與焦點、詳情重新整理後仍可讀；③ 手機「不存在xyz987」＋生活情境為 0/454，顯示可恢復建議，沒有水平溢出。桌面 1440px 直鏈亦顯示短用途與展開入口。Chrome axe-core 4.13.0 在 390px 展開狀態為 0 violations／0 incomplete／27 passes；摘要文字對白色對比 8.71:1。`NODE_PATH=/tmp/visitor-tools/node_modules ROUND_URL=http://127.0.0.1:8100/ai-agent-use-cases/ ROUND_OUTPUT=/tmp/visitor-round-after node tests/round-browser.cjs`：Chromium 1440／390／320／480 四尺寸完成，早期與完整閱讀兩狀態 axe 均零違規，無頁面錯誤。
- 本地以隔離目錄安裝 Playwright 後，`reading-history-browser.cjs` 的 Chromium 1440／390／320 與 Firefox 390 通過新增的 UC-359 展開返回；完整跨引擎執行在 WebKit 390 的既有「Related case return restores its visible trigger」斷言停下（位於新增情境之前）。另以 WebKit 390 單獨執行 UC-359 展開 → UC-360 → Back，返回後仍展開。主分支 Improvement round QA run 40258843691 已在 browser step 失敗，log API 403 未能取得該次精確斷言；不能把既有紅燈當成本輪退化。正式 Pages 部署後仍須核對來源版本及發布畫面。
