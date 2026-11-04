# 官方署名來源篩選

基準 `490780099b9fb550946b52e90c0ecb8cfdac00f8`：UC-017 頁首是官方署名作者使用陳述，原本動態分類為「作者報告／示範」，與靜態索引的官方來源說明不一致，官方來源篩選找不到。案例後續另有作者自述，頁首標籤不能代表所有版本。

選擇修正頁首分類，而非本輪擴充多來源資料模型；保留原文與逐段限制。新增回歸先失敗、修正後通過；同時保留作者案例提及官方文件不應變為官方來源的回歸。`node --test tests/*.test.cjs`：394 通過。`python3 scripts/preview.py /tmp/ai-preview-20261103-evidence/ai-agent-use-cases` 產生預覽；Chromium 桌面與 390px 實際開啟官方來源篩選可找到 UC-017，手機可開啟詳情。獨立審查未發現本次新增缺陷。

以 `SITE_URL=http://127.0.0.1:18743/ai-agent-use-cases/ QA_OUT=/tmp/ai-qa-20261103-evidence node tests/task-shortcuts-browser.cjs` 執行既有完整旅程：Chromium 1440、390、320，Firefox 與 WebKit 390 全部通過；涵蓋問題入口、組合條件、空結果復原、詳情直鏈與重載、返回焦點與條件、來源連結，以及載入／錯誤／部分載入。各尺寸結果與空結果的 axe 自動掃描均無違規；這不是完整無障礙審計。桌面 Chromium 實際開啟來源連結。截圖與報告在 `/tmp/ai-qa-20261103-evidence/`，預覽非 Jekyll／正式部署。

交付 PR：[#199](https://github.com/RichardHan/ai-agent-use-cases/pull/199)，功能提交 `1999f26c35dbfda083ed8785f57585fa237d4078`；合併與正式站發布狀態以 PR 和 Actions 為準。

Actions 基準：main `4907800` 的 [Recent review discovery QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41441985869) 在發布資產比對等待 60 分鐘後失敗，最後錯誤為 app.js byte mismatch；對應 [Pages 部署](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41441985151) 於檢查逾時後成功，現在正式站 app.js 與基準 SHA-256 相符。其他 published workflows 亦有逾時；不推定程式退化。[PR #198](https://github.com/RichardHan/ai-agent-use-cases/pull/198) 已處理診斷，仍為 draft；本輪不重複修改。

下一輪：釐清 Pages 部署完成事件與精確 commit 的驗證依賴，先核對 #198 最新狀態、部署排隊及 token 權限；避免只延長 timeout。UC-021 的頁首證據格式仍未對應官方分類，須逐案核實來源後再調整。正式站：https://richardhan.github.io/ai-agent-use-cases/。

## 2026-11-04 稽核批次標示

基準 `a3fbbe6398bec51bd4ad30cca4ddab9059768036`：稽核頁將 20:50 和 17:45 都稱為最新批次，且 17:45 的舊資訊落入 `audit-summary.json` 的首個批次。將舊資訊移入 17:45 段並標為歷史快照，不改合格數或來源；最新 20:50 仍為 370／1,000，17:45 仍為 369／1,000。未重新審核案例。

驗證：`node --test tests/*.test.cjs` 394 通過、`node --check assets/app.js` 通過；預覽由 `python3 scripts/preview.py` 產生。依 `audit-summary.json` 同一個標題切分規則檢查，最新批次含 20:50 和 370／1,000，且不含 17:45。獨立審查最終修改未發現問題。預覽不是 Jekyll 建置；正式部署與旅程驗收以 PR 實際檢查結果為準。

`SITE_URL=http://127.0.0.1:18765/ai-agent-use-cases/ QA_OUT=/tmp/ai-20261104-integrated-qa NODE_PATH=/Users/richard_han/orca/ai-agent-use-cases/node_modules node tests/task-shortcuts-browser.cjs`：Chromium 1440、390、320，Firefox 與 WebKit 390 均通過；另執行 loading、error、partial 情境。此為本機預覽，非正式站結果。

下一輪優先處理 [#208](https://github.com/RichardHan/ai-agent-use-cases/issues/208)：先在正式站重現已併入 UC-028 的 P-002 被列為待查，再確認穩定直鏈、搜尋及載入恢復的狀態準則。另需核對 20:50 段首提及 UC-428–430 與該段列出的 UC-459–461 是否一致，不在本輪推定或改寫。

## 2026-11-04 已併入來源狀態

基準 `22ce9c78bbb1b3a6dc7781450bf9def0b965ce7e`：[#208](https://github.com/RichardHan/ai-agent-use-cases/issues/208) 的 P-002 原始紀錄已併入 UC-028，正式站卻顯示「還在查證」並計入 3 個待查。採保留識別碼與原文的方案，以明確的來源狀態標記判別併入目的地，從待查篩選和數量排除，詳情連往主案例；不更改來源主張或宣稱已獨立重現。

回歸先重現失敗，修正後 `node --test tests/*.test.cjs` 395 通過，`node --check assets/app.js` 通過；預覽 corpus 校驗 489 個來源一致。正式站及預覽各以 Chromium 桌面與 390px 檢查 P-002，待查數由 3 改為 2；預覽測試詳情直鏈、重載與 UC-028 交接。前後截圖暫存 `/tmp/pending-{before,after}-{1440,390}.png`。既有訪客旅程在正式站與預覽均通過 Chromium 1440/390/320、Firefox 390、WebKit 390，以及載入、錯誤與部分載入情境；不等於真人研究。獨立 reviewer 靜態審查未發現阻擋問題。預覽不是 Jekyll 實際建置。

基準 [Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41752393847) 和 [Pages](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41752393270) 在前一主線版本 `a3fbbe6` 成功；較早 [Results return QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41696954884) 失敗於發布比對，根據 #206 的診斷紀錄為遠端查詢逾時，非已證實的網站回歸。正式站：https://richardhan.github.io/ai-agent-use-cases/。本輪 PR、合併及發布狀態以 GitHub 實際紀錄為準。

下一輪：查明稽核 20:50 段首 UC-428–430 與明細 UC-459–461 的不一致；先核對原始研究批次與來源，不猜哪一組正確。
