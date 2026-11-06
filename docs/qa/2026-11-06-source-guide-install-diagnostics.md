# 2026-11-06 Source guide QA 安裝診斷

基準 `a3b71759e7652d346ca026ac69fcdd4c95b29996`；[正式站](https://richardhan.github.io/ai-agent-use-cases/)。原工作樹有未提交修改，未改動。

[PR #228 Source guide QA run 42169494862](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42169494862)，head `2b19e149d7f807c3ac9acf29ffc1a7f86995ff13`，preview job 的「Install browser testing tools」在 35 分鐘 job 上限後取消；同一步包含 npm、Playwright 系統依賴、瀏覽器下載及中文字型，現有步驟狀態不足以歸因。這不是測試斷言失敗的證據。

將 preview 與 published job 的安裝分成 npm、系統依賴、瀏覽器下載和字型四步；保留 Playwright 版本、瀏覽器、測試、觸發與發布檢查。這只增加定位能力，不宣稱消除逾時。保留失敗與取消狀態，不降低斷言。

基準本機 `node --test tests/*.test.cjs`：394 通過；`node --check assets/app.js` 通過。`scripts/preview.py` 建立 Pages base path 預覽，`scripts/check_corpus_bundle.py` 核對 498 個來源一致；本機預覽不是 Jekyll 正式建置。工作流程的實際執行與發布 job 須看 GitHub Actions，不能以 YAML 解析代替。

下一輪：先查看本輪 Source guide QA 的各安裝步驟和最新一次失敗日誌，按實際阻塞階段設計受控修復；不要盲目重跑或將其他工作流程的安裝故障假定為相同原因。
