# 2026-11-03：Pages 發布逾時診斷

基準 `490780099b9fb550946b52e90c0ecb8cfdac00f8`。原工作樹有未提交變更，本輪在獨立 worktree 處理。

- [Recent review QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41441985869)：2026-11-02 12:07:20–13:07:20 UTC 等待公開資產，最後 `assets/app.js: byte mismatch`；393 項既有測試通過。
- [Pages 部署](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41441985151)：同一 commit 的 build 於 12:37:45 完成，deploy 於 13:07:43 完成。另見 [Return visibility](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41441985816) 與 [Category finding](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41441985624)。這支持發布晚於檢查期限；排隊的根因尚未確定。
- 決策：逾時後查詢同一 SHA 的 Pages deployment 最新狀態；失敗仍為失敗，不延長比對期限、不減少檢查。API 無法使用時明確顯示 unavailable，不把它當成部署不存在。查詢最多額外等待 5 秒。
- 本地基準：`node --test tests/*.test.cjs` 393 項通過；`node --check assets/app.js` 通過。變更後 `node --test tests/published-assets.test.cjs` 24 項通過。實際 GitHub API 未認證查詢本機回傳 HTTP 403，故目前無法確保每個 runner 都能取得狀態。
- 下一輪：先檢查正式 workflow 的診斷是否能讀取部署 API，並查 Pages jobs 排隊與 concurrency；再評估依部署完成觸發驗證的安全方案。不可將逾時診斷視為已修復排隊或發布競態。
