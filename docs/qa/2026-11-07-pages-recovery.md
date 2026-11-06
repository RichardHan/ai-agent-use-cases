# 2026-11-07 Pages 發布恢復

基準 main `e20a9eb5470797be94138695c0b76db9c78e1f5b`（[PR #234](https://github.com/RichardHan/ai-agent-use-cases/pull/234)）；原工作樹有未提交內容，本輪以隔離 worktree 操作。

[Pages run 42212423248](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42212423248) 首次 build 成功，deploy 在 `syncing_files` 停留至 600 秒上限後取消，不能由日誌斷定根因。正式站 catalog／corpus 原為 `a3b71759e7652d346ca026ac69fcdd4c95b29996`，靜態頁語言修正尚未發布。選擇以已授權管理員身分重跑失敗 deploy 一次，不改 workflow 或降低檢查；第二次成功。之後正式站 catalog／corpus 的 `sourceRevision` 均為 `e20a9eb5470797be94138695c0b76db9c78e1f5b`，bundle revision 一致；首頁、索引、案例與來源頁均為 `zh-Hant`，三個靜態頁 `og:locale` 為 `zh_TW`。

基準 `node --test tests/*.test.cjs`：394 通過；`node --check assets/app.js`、`node --check assets/reader.js` 通過；預覽建置及 `python3 scripts/check_corpus_bundle.py` 核對 498 個來源逐 byte 一致。正式站更新前的 `tests/page-context-browser.cjs` 通過 Chromium 1440／390／320、Firefox 390、WebKit 390，涵蓋搜尋、篩選、空結果、直鏈、返回、來源與自動化 axe；不代表真人或實體裝置驗證。

重新發布後，同一正式站訪客流程以相同五個瀏覽器／尺寸再次通過，截圖與報告位於執行環境 `/tmp/ai-agent-20261107-published-qa/`；未修改視覺設計。主線 [Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42212423963)、[Corpus bundle QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42212423932) 均成功。

獨立 reviewer 指出 Website QA 目前核對前端資產及案例原文，但沒有驗證正式靜態頁語言或目標 `sourceRevision`；因此不能單憑綠燈判定這次語言修正已發布。本輪以正式站回應額外核對，未推測部署逾時原因。下一輪先以舊版靜態頁仍符合既有發布閘門的受控案例重現，再評估如何將發布語言驗證納入既有共用輪詢；不要刪減既有檢查或僅延長等待。
