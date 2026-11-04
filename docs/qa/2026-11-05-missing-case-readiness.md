# 2026-11-05 分享案例 QA 載入同步

基準：`5701849cede5c15084e58fd2e54fc9ccfe5cf4c4`。原工作樹與其他 worktree 的變更未動。

主線 [Missing shared case QA #41918301601](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41918301601) 的正式站步驟確認資產匹配基準 SHA 後，首頁導航在 10 秒等待 `networkidle` 逾時；此錯誤本身不能證明網站功能故障。另見 [Facet counts QA #41918301367](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41918301367) 的不同失敗；本輪不處理。

選擇首頁導航等待 `domcontentloaded`，仍以原有結果卡片或空結果條件判斷可操作，再執行原有案例、來源與返回斷言。替代方案是延長網路安靜等待，但不相關持續請求仍可能阻塞。加入針對此測試與 workflow 修改的 PR 觸發，讓修正不必等合併後才首次執行。其他導航仍使用既有等待條件，本輪未宣稱已解決所有網路不穩定問題。

受控 Chromium 實驗：額外發出持續 12 秒的無關請求，原 `networkidle` 導航於 10 秒逾時；`domcontentloaded` 加原有結果就緒條件成功。這是模擬，不代表已重現 Actions 的實際網路原因。


整合版本本地 `CASE_URL=http://127.0.0.1:18765/ai-agent-use-cases/ CASE_LIVE=1 node tests/missing-case-browser.cjs` 通過 Chromium 1440／390／320、Firefox 390、WebKit 390 及失敗復原情境；各瀏覽器 axe 違規數為 0（測試頁面與設定內，非全站無障礙認證）。來源 HTTP 查詢在 WebKit 一次得到 429，其餘四次 200；測試只記錄狀態，不把 429 當作來源可用的證據。
基準 `node --test tests/*.test.cjs`：394 通過；`python3 scripts/preview.py` 與 `scripts/check_corpus_bundle.py`：489 來源逐 byte 一致；`node --check assets/app.js` 通過。正式站桌面與 390px 手機載入；旅遊入口、空結果清除、UC-001 直鏈及重載可用，詳情標示來源與未獨立重現。這是模擬走查，不是使用者研究。

下一輪：先查看主線 Facet counts QA 的 [失敗日誌](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41918301367)，重現 source-guide 的 null 來源連結，並與正在進行的 [PR #216](https://github.com/RichardHan/ai-agent-use-cases/pull/216) 比對，避免重複修復。
