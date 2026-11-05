# 完整索引案例數核對

基準 `ddb7e653f48f30978f821478a3a5e729e4c08a02`；正式站 [完整索引](https://richardhan.github.io/ai-agent-use-cases/INDEX.html) 的「主要案例（484）」沒有說明另有五筆列在後方研究批次。預覽目錄列出 489 個 `cases/` Markdown 檔，UC 最大編號 497 並非案例總數。保留主表 484 列的標題，補充 489 個頁面與 UC-441–445 位置，分別檢查兩種計數；不更動案例資料，排序問題另見 [PR #220](https://github.com/RichardHan/ai-agent-use-cases/pull/220)。

驗證：最初假設標題應等於總檔數的斷言失敗（484 ≠ 489）；獨立審查發現五筆位於主表外，故改為分開標示並檢查。預覽不是 Jekyll 正式建置；本機 `jekyll` 不可用。正式站首頁手機版已走收件匣入口、案例與返回；來源 Markdown 指向基準 commit。未完成正式建置後的索引桌面／手機驗收，請以 PR Actions 產物與正式發布核對。

最終版本 `node --test tests/*.test.cjs`：394 通過、0 失敗；`node --check assets/app.js` 通過。`python3 scripts/preview.py /private/tmp/ai-agent-20261106-final-preview/ai-agent-use-cases` 與 `python3 scripts/check_corpus_bundle.py /private/tmp/ai-agent-20261106-final-preview/ai-agent-use-cases`：493 個來源位元組一致。手機預覽確認搜尋「收件匣」、詳情返回保留搜尋，以及無結果時清除全部條件；不是完整三情境或正式站發布驗收。

Actions 觀察：基準 Pages deployment [42077633931](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42077633931) 成功；[Corpus bundle 42015358407](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42015358407) 在 `Bundle, full visitor journeys and source recovery` 的 `page-context-browser.cjs:54` 回報 `Context is stopped`，不據此推定根因。後續基準 [Corpus bundle 42077635506](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42077635506) 成功。

下一輪：處理已合併來源 P-002 仍被標為待查的問題，先核對 [PR #210](https://github.com/RichardHan/ai-agent-use-cases/pull/210) 與最新主線，避免重複實作。發布、PR 與實際版本以 GitHub 記錄為準；未經部署與正式站驗證不得視為已發布。
