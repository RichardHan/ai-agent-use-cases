# 2026-11-07 Corpus loading QA 安裝診斷

基準 main `108b31537da2f64399b0b06df353c2f21ebdb36a`；原工作樹有未提交修改，另建隔離 worktree。正式站 catalog 的 sourceRevision 與基準一致。

[Corpus loading QA run 42282943915](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42282943915)，commit `108b315`，在 published job 的「Install cloud browser tools」執行逾 40 分鐘，後續載入與發布驗證尚未執行。此步驟合併 npm、Playwright 系統依賴、瀏覽器下載及字型安裝，執行中沒有完整日誌可辨別具體卡點；不能推定根因。前一次同 workflow [run 42212423935](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42212423935) 成功，耗時 6 分 3 秒。

將兩個 job 的安裝拆分成四個具名、有等待上限的步驟；保留工具版本、全部瀏覽器、字型與後續測試。這是診斷及等待上限改善，不代表已修復網路或套件來源問題。既有 [PR #232](https://github.com/RichardHan/ai-agent-use-cases/pull/232) 處理另一個 source-guide workflow，本輪不修改該 PR。

本地基準 `node --test tests/*.test.cjs`：396 通過；`node --check assets/app.js`、`node --check assets/reader.js` 通過；`python3 scripts/preview.py /tmp/ai-agent-20261107-current-preview/ai-agent-use-cases` 與 `python3 scripts/check_corpus_bundle.py /tmp/ai-agent-20261107-current-preview/ai-agent-use-cases`：498 個來源逐 byte 一致。本機預覽不等同 GitHub Pages Jekyll build。

下一輪先檢查上述卡住的 run 最終結果與分步驟日誌；若依賴安裝再逾時，依具體命令和錯誤調查網路或套件鏡像，不盲目重跑。已知 Pages 佇列逾時診斷另有 [PR #198](https://github.com/RichardHan/ai-agent-use-cases/pull/198)，先確認其 head 和授權再處理。

本輪提交 `2d9bf157af91500481a81f187041e891044df4aa`；[PR #238](https://github.com/RichardHan/ai-agent-use-cases/pull/238)，[分支手動執行 42289360960](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42289360960)；published job 僅 main 執行，實際結果以 Actions 為準。獨立審查未發現確定缺陷；各步驟上限仍受整個 job 的上限約束。

正式站基準 `SITE_URL=https://richardhan.github.io/ai-agent-use-cases/ QA_OUT=/tmp/ai-agent-20261107-current-live node tests/page-context-browser.cjs`：Chromium 1440／390／320、Firefox 390、WebKit 390 均通過。包含旅遊搜尋與生活／工具組合、詳情與來源、返回、空結果及分享直鏈；截圖與報告在該暫存目錄。本輪不改網站視覺；這是模擬瀏覽器而非真人或實體裝置測試。
