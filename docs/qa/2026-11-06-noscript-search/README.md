# 2026-11-06 無 JavaScript 搜尋後備

基準 `fc1b1c5c6da19ed06313e9f186e9258317bc83a6`；[正式站](https://richardhan.github.io/ai-agent-use-cases/) 當時 `catalog.json.sourceRevision` 相同。停用 JavaScript 開啟搜尋分享連結，搜尋區仍顯示「正在讀取案例」，原先的限制說明在頁尾。改為搜尋區說明搜尋、篩選及案例分享無法使用，提供同版本站索引，並隱藏無法運作的搜尋與載入狀態。索引不提供全文搜尋或篩選；不處理腳本啟用但載入失敗的情況。

方案 B 是產製無腳本搜尋頁，可保留搜尋但需新的產製與網址契約；本輪採較小的說明與索引後備。正式站與本機預覽的同尺寸截圖：[修改前手機](before-390.png)、[修改後手機](after-390.png)、[修改前桌面](before-1440.png)、[修改後桌面](after-1440.png)。這是受控瀏覽器走查，不是使用者研究。

基準與修改後 `node --test tests/*.test.cjs` 均 394 通過；`node --check assets/app.js` 通過；`scripts/preview.py` 與 `scripts/check_corpus_bundle.py` 核對 498 個來源逐 byte 一致。預覽上的 `page-context-browser.cjs` 涵蓋 Chromium 1440/390/320、Firefox 390、WebKit 390 的搜尋、篩選、詳情、來源、返回、空結果、鍵盤及 WCAG axe 檢查。本機無 Jekyll：Python 預覽不應視為 Jekyll 建置；本機執行 `initial-index-fallback-browser.cjs` 時預覽中的 INDEX.html 不是有效 Jekyll 索引，測試在原有首頁索引標題斷言失敗。正式站索引當時 HTTP 200，但修改後搜尋區連結的實際建置和鍵盤導覽仍須由發布驗收確認。

獨立 reviewer 指出既有無腳本索引測試會因兩個同名連結而衝突、且一般預覽不可假設有 Jekyll 索引；已分別限縮首頁 locator，以及將實際索引導覽檢查保留在發布索引測試。覆核未再發現阻塞；reviewer 未執行測試。

Actions：主線 Website QA [42159134078](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42159134078)、Audit summary QA [42159134901](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42159134901) 為成功。先前 Audit summary [42143315388](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42143315388) 在安裝階段取消；WebKit [42158014167](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42158014167) 失敗後由 #226 調整環境，不能推定所有工作流程已修復。開放 PR #162 等已處理其他載入後備，未動其 worktree。

下一輪優先檢查首頁歷史合格數與目前目錄日期差：先比對正式站 `audit-summary.json`、`catalog.json` 及現有文案；不得推算最新合格總數。
