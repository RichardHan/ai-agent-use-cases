# Search submit 發布驗收時間界線

基準 main `413e7e85e701ad070f65a17fec0cf7b12e943af5`。Search submit QA 在 `486eaa6` 的 [run 41530221458](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41530221458) 預覽及 reader 檢查成功，正式站驗收被整個 job 的 30 分鐘上限取消；前置步驟約用 5 分鐘。前一版 [run 41441985853](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41441985853) 同樣取消。這只能證明時間預算衝突，不能證明 Pages 延遲的根因。基準的 [Pages deployment](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41558862888) 已成功；正式站 catalog 的 sourceRevision 為基準 SHA。

方案：Search submit QA 改用既有 60 分鐘絕對 deadline 的發布比對函式，仍逐 byte 核對 app.js、style.css、index.html，保留 main 版本檢查及正式站瀏覽器驗收；job 上限 90 分鐘，為安裝與瀏覽器檢查保留時間。原 501 次迴圈的網路請求時間沒有包含在宣稱的 25 分鐘中。沒有更改其他 workflow；部署診斷已有 draft [#198](https://github.com/RichardHan/ai-agent-use-cases/pull/198)。

本機基準：`node --test tests/*.test.cjs` 394 通過；`node --check assets/app.js` 通過；`python3 scripts/preview.py` 與 `scripts/check_corpus_bundle.py` 通過（485 來源，preview 而非 Jekyll）；`tests/task-shortcuts-browser.cjs` 在 Chromium 1440／390／320、Firefox 與 WebKit 390 通過，含載入、錯誤與部分載入。更新後 `node --test tests/published-assets.test.cjs tests/published-check.test.cjs tests/search-submit.test.cjs` 35 通過。這些不能證明 main-only 的正式站步驟在 Actions 已成功。

正式站：https://richardhan.github.io/ai-agent-use-cases/ 。交付 commit、PR 及 workflow run 以 GitHub 實際狀態為準；分支 workflow_dispatch 走非 main 路徑，不能代替合併後正式發布驗證。下一輪先查 #198、Pages 對應 SHA 的部署排隊與 published acceptance 實際日誌，再決定是否改變跨 workflow 的部署依賴；勿將延長等待當作 Pages 根因修復。
