# 法務案例來源篩選

基準 main `486eaa6ccb6c1b8b34e732156ee927ab2296935d`。UC-021 頁首的「官方Legal Ops作者使用陳述」未命中既有官方來源分類，搜尋「法務」搭配官方來源篩選時漏掉案例。核對 [官方署名原文](https://x.ai/bot/guides/grok-bot-for-legal-ops)：這是官方網站上的作者陳述，不是獨立驗證。

選擇將該筆證據欄統一為既有可辨識的「官方署名作者使用陳述」，保留 Legal Ops 與未親測、未獨立重現限制；不擴大分類器或改寫其他案例。新增搜尋加來源條件的回歸先失敗、修正後通過。原始內容、識別碼與來源不變。

驗證：`node --test tests/*.test.cjs` 394 通過；`node --check assets/app.js` 通過；`python3 scripts/preview.py` 後 `scripts/check_corpus_bundle.py` 通過（481 來源）。本機預覽桌面搜尋「法務」並選官方來源可找到 UC-021，390px 可開啟案例。`tests/task-shortcuts-browser.cjs` 在 Chromium 1440／390／320、Firefox 390、WebKit 390 通過，並涵蓋載入、錯誤與部分載入；預覽非 Jekyll 建置或正式發布。第一次瀏覽器測試與預覽產生並行，因預覽尚未完成而失敗；完成後重跑通過。


獨立 reviewer 核對正式來源、資料與篩選 diff，未發現問題；未獨立重現原作者成果。當前 main `486eaa6` 的 [Results return QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41530221529) 在 Match published assets 失敗；對應 [Pages 部署](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41530219939) 的 build 成功但 deploy 排隊中。尚不能據此斷定部署失敗的根因或已發布。
正式站：https://richardhan.github.io/ai-agent-use-cases/ 。[PR #198](https://github.com/RichardHan/ai-agent-use-cases/pull/198) 已處理發布逾時診斷，為避免重複本輪不修改。下一輪優先釐清 Pages 部署完成與精確 commit 驗證的依賴，先檢查 #198 狀態、最新 Actions 與部署排隊，勿單純延長 timeout。正式發布狀態以本輪 PR 與 Actions 為準。
