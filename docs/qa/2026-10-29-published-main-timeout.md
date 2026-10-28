# 發布驗證的 main 查詢逾時

- 問題：Reading flow QA [40765297766](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40765297766) 與 Recent review discovery QA [40765297655](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40765297655) 的日誌顯示 `git ls-remote` 在確認 main 時回報 `ETIMEDOUT`；不能因此推斷網站本身有問題。
- 修正：只對該逾時重試，最多三次；仍無法確認時維持失敗，不跳過發布驗證。其他錯誤不重試。
- 驗證：`node --test tests/published-check.test.cjs` 覆蓋逾時後恢復與持續逾時的失敗；完整回歸以 `node --test tests/*.test.cjs` 執行。
- 範圍：未修改網站介面或案例資料。其他 Actions 失敗原因仍需逐項查看日誌，不能視為同一問題。
