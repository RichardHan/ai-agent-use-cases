# 2026-11-06 WebKit 診斷

基準 `ca3bcfdf608bfcd3a2212981424df396d57083d7`；[正式站](https://richardhan.github.io/ai-agent-use-cases/)。原工作樹及其他 worktree 未修改。

主線 [Corpus bundle QA 42015358407](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42015358407) 和 [41043380774](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41043380774) 在 WebKit 訪客流程的 `reset-home` 收到 `Context is stopped`，堆疊為空；其餘近期多次執行成功。不能由此認定網站程式或瀏覽器是哪一方造成。Pages 對基準版本的 [部署](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42015357915) 成功，不等同 Corpus QA 通過。

不忽略錯誤、不延長等待；保留原有 pageerror 斷言，在錯誤發生時附上最多 40 筆近期主框架導航、失敗請求與 console error（含時間及測試階段），以便下次復現時定位。相關測試或 workflow 的 PR 觸發 Corpus bundle QA。事件只收集此測試執行期間的公開測試頁面；診斷不會揭露於網站。
本地驗證：`node --test tests/*.test.cjs` 通過；`python3 scripts/preview.py` 產生預覽後，`scripts/check_corpus_bundle.py` 核對 493 個來源逐 byte 一致，`node --check assets/*.js` 通過。`tests/page-context-browser.cjs` 對本地預覽通過 Chromium 1440／390／320、Firefox 390、WebKit 390，包含搜尋、篩選、空結果、直鏈、返回、來源與 axe 檢查。WebKit 受控拋錯確認原錯誤及前一筆導航均被記錄；這不代表已重現 CI 根因。網站本身未改動，無視覺前後差異。


下一輪：先檢查下一個失敗的 `corpus-bundle-qa` artifact 中 `journeys/report.json` 的 `pageErrors[].recentEvents`，確認出錯前導航和請求，再設計受控重現；不要僅憑錯誤文字抑制斷言。另有 [PR #179](https://github.com/RichardHan/ai-agent-use-cases/pull/179) 與 [PR #220](https://github.com/RichardHan/ai-agent-use-cases/pull/220) 處理靜態索引缺漏及順序，合併前需協調，避免重複修改。
