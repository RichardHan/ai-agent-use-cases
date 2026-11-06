# 2026-11-07 發布驗證：語言與版本

基準 `28704f6d03b464aa3c1da06b6125c9e1a4287e69`；原工作樹有未提交內容，本輪使用隔離 worktree。正式站 [Pages 部署](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42272612422) 成功，catalog 與 corpus 的 `sourceRevision` 均為此基準。

交付提案：[PR #237](https://github.com/RichardHan/ai-agent-use-cases/pull/237)；主要實作提交 `fb1a6891c60426c2848d972f1699d46fcd33b051`。[正式站](https://richardhan.github.io/ai-agent-use-cases/)與 [Actions](https://github.com/RichardHan/ai-agent-use-cases/actions) 狀態以該 PR 與部署記錄為準。

舊發布閘門核對首頁、前端資產與原文，但不核對正式靜態頁語言或來源提交。受控測試中，即使靜態索引為英文且來源版本舊，舊閘門仍成功；新增回歸先失敗，再以共用輪詢檢查首頁、索引、案例與來源頁語言，並在 main 檢查 catalog、corpus 的 sourceRevision 與工作流程 SHA。非 main 仍依原有內容比對，不要求 Pages 部署分支 SHA。語言核對不能證明各靜態頁的全部內容均為最新；既有首頁與原文 byte／語義檢查不變。

`node --test tests/*.test.cjs`：396 通過；`node --check assets/app.js`、`assets/reader.js`、`tests/published-version.cjs` 通過。基準預覽建置與 corpus 檢查：498 個來源逐 byte 一致。正式站 `tests/page-context-browser.cjs` 通過 Chromium 1440／390／320、Firefox 390、WebKit 390，涵蓋搜尋、組合篩選、空結果、直鏈、返回、來源、鍵盤與自動 axe；截圖與報告位於執行環境 `/tmp/ai-agent-20261107-evidence-live/`，非真人研究或實體裝置。本輪未改網站視覺。

以正式站 `28704f6` 的資產作本地基準，透過系統 curl 供應同一發布閘門：`matched`、498 個來源，bundle revision `20261106183925923793646`。此為基準站實測，不是新提交已部署的證明。先前在大小寫不敏感的 macOS 暫存目錄同時寫入 `index.html`／`INDEX.html`，覆蓋首頁而造成受控檢查的資產不符；改為只保存閘門實際需要的本地資產後通過。

獨立審查發現非 main 無法等到分支 SHA 的回歸，修正後重跑發布回歸 14 項通過，審查複核無新增發現。Pages 本機完整 Jekyll build 未執行（環境無 jekyll），需以 PR Actions 實際驗證；Pages queued／syncing_files 逾時根因未明，不能由重跑成功推定已修復。

下一輪：檢查 [PR #198](https://github.com/RichardHan/ai-agent-use-cases/pull/198) 最新 head 與部署日誌，先確認其診斷能否讀取授權的 deployment 狀態，再決定是否整合；不要重複實作或自動重試未知故障。
