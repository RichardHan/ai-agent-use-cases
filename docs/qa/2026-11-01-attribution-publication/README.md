# 來源歸屬與 Pages 發布等待：整合檢查

基準：`ffac05d`；隔離分支整合既有 PR #189（`f963ff1`），不修改原工作樹。目標讀者是依來源類型判斷案例可信程度的人。UC-372 的頁首明確標記 `author-demo`，官方說明只是輔助資料；基準卡片誤標「官方自報」。修正後為「作者報告／示範」，不代表本庫獨立重現。

兩個方案：A 依明確的 `author-demo`／`author-self-report` 優先分類（採用，保留模板例外）；B 改寫個別案例資料（成本低但未修正其他有同類混合來源的案例）。不重新認證案例或更動來源。CI 部分沿用既有 PR 的 60 分鐘版本比對期限；不放寬比對或超時後誤報成功。

| 視窗 | 修改前 | 修改後 |
| --- | --- | --- |
| 1440px | [公開站](before-desktop.png) | [預覽](after-desktop.png) |
| 390px | [公開站](before-mobile.png) | [預覽](after-mobile.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-preview/ai-agent-use-cases`，再執行 `python3 -m http.server 8081 --directory /tmp/visitor-preview`，開啟 `http://127.0.0.1:8081/ai-agent-use-cases/`。預覽不是 Jekyll 正式建置。

驗證：基準 Node 測試 389 通過；整合後 `node --test tests/*.test.cjs` 392 通過、0 失敗；`node --check assets/app.js`、`node --check assets/reader.js` 成功；`python3 scripts/check_corpus_bundle.py /tmp/visitor-20261101-session-preview/ai-agent-use-cases` 檢查 479 個來源位元組一致。Chromium 實際確認 UC-372 修改前後標籤、開發＋作者篩選、官方篩選空結果與移除建議，以及詳情直鏈重新整理、來源入口和返回。獨立唯讀 review 未發現阻擋問題。

三個模擬情境：旅遊搜尋→UC-001→返回保留查詢；UC-372 直鏈→來源入口；不存在的關鍵字→移除關鍵字。這些不是使用者研究。PR #189 的 [Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41253319289) 成功執行 Jekyll 建置及建置後資料包檢查；它基於較早的主線，最新主線整合只做本機預覽。

限制：未完成跨瀏覽器、實體手機及文字對比檢查；PR 上 published job 跳過，60 分鐘閘門的實際部署路徑尚須主線執行確認。歷史 Pages 部署曾耗時 49 分 09 秒，超過原 45 分鐘期限；不將其他未確認的 WebKit 失敗歸因於此。Enterprise Managed User 無權合併，後以已授權的 repository 擁有者帳號合併 PR #189。
