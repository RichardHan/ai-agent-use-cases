# 2026-11-06 Search context QA 安裝診斷

基準 main `fc1b1c5c6da19ed06313e9f186e9258317bc83a6`；[正式站](https://richardhan.github.io/ai-agent-use-cases/)。原工作樹有未提交變更，未修改。

[PR #230 的 Search context run 42183050796](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42183050796) 在觀察時長時間停於 `Install existing cloud browser tools`。此現象不能單獨證明 apt、網路或其他根因。同期 main [Pages deployment 42159134078](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42159134078) 成功，不代表所有 QA 成功。

本輪僅將 Search context QA 改用與現有 npm 版本相同的 Playwright 1.64.1 Noble 容器，沿用 Audit summary QA 的中文字型與 Git safe.directory 作法；保留基準比較、搜尋、正式站檢查及斷言。Microsoft registry 的多架構 manifest 查詢返回 200；本機沒有 Docker，容器的實際相容性須以本輪 PR workflow 驗證。此修改不是已證實根因的宣稱。

基準本機 `node --test tests/*.test.cjs`：394 通過；`node --check assets/app.js`、`node --check assets/reader.js` 與 `python3 scripts/preview.py /tmp/omp-baseline-preview/ai-agent-use-cases` 通過。沒有獨立 lint/typecheck 指令的通過宣稱。

下一輪：檢查本輪 PR 的 Search context QA 完整步驟及 artifact；若再次停在安裝，讀取當次日誌，區分 npm、字型下載與 runner 問題，不重複盲目重跑。另有 P-003 邊界、靜態索引缺漏與門檻標籤等既有 PR，先核對其進度，避免重複實作。
