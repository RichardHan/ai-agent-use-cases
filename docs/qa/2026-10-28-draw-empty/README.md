# 抽卡空狀態說明搜尋條件

正式站搜尋「我想整理會議記錄」得到 0／463，結果區提供「會議」捷徑；首頁抽卡則只提示更換門檻、情境或篩選，沒有說明搜尋也限制卡池。目標是讓調整搜尋後返回首頁的訪客理解狀態，而不是誤以為案例庫沒有內容。

方案 A：空狀態解釋搜尋與篩選會影響抽卡，保留既有條件（採用）。方案 B：抽卡獨立於搜尋，需重新定義狀態及返回語意。本輪不改搜尋召回、案例、來源、排序或抽卡條件。

| 視窗 | 修改前（正式站） | 修改後（本機 Pages 預覽） |
| --- | --- | --- |
| 390px | [手機](visitor-review-before-mobile.png) | [手機](visitor-review-after-mobile.png) |
| 1440px | [桌面](visitor-review-before-desktop.png) | [桌面](visitor-review-after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-review-preview/ai-agent-use-cases`，再執行 `python3 -m http.server 8081 --directory /tmp/visitor-review-preview`，開啟 `http://127.0.0.1:8081/ai-agent-use-cases/`。截圖已保存，但此執行環境無法目視解讀圖片，未宣稱完成視覺比較。

基準 `node --test tests/*.test.cjs`：368 通過、0 失敗；`node --check assets/app.js`、`node --check assets/reader.js` 與預覽產生成功。`node tests/discovery-browser.cjs` 新增斷言在修改前失敗（空狀態未提搜尋），修改後通過：Chromium 1440、390、320px 的情境抽卡、鍵盤、組合篩選、空結果復原、直鏈重新整理與返回；各尺寸 axe 掃描 0 違規。模擬三情境：選省錢情境抽卡並鍵盤閱讀、組合條件後從空結果復原、以生活／旅遊直鏈開啟案例並重新整理；這不是實際使用者研究。獨立唯讀審查未發現功能、資料或無障礙回歸。

未量測效能，未執行跨瀏覽器驗收，未實際開啟外部來源或驗證本次正式發布。Actions 調查發現 Partial Load QA 的 PR 工作流程仍走查正式 Pages；未改動該流程，舊失敗完整日誌因 GitHub API 403 無法取得。