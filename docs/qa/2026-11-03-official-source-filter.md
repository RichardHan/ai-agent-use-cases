# 官方署名來源篩選

基準 `490780099b9fb550946b52e90c0ecb8cfdac00f8`：UC-017 頁首是官方署名作者使用陳述，原本動態分類為「作者報告／示範」，與靜態索引的官方來源說明不一致，官方來源篩選找不到。案例後續另有作者自述，頁首標籤不能代表所有版本。

選擇修正頁首分類，而非本輪擴充多來源資料模型；保留原文與逐段限制。新增回歸先失敗、修正後通過；同時保留作者案例提及官方文件不應變為官方來源的回歸。`node --test tests/*.test.cjs`：394 通過。`python3 scripts/preview.py /tmp/ai-preview-20261103-evidence/ai-agent-use-cases` 產生預覽；Chromium 390px 實際開啟官方來源篩選可找到 UC-017 並開啟詳情。獨立審查未發現本次新增缺陷。預覽非 Jekyll／正式部署；未完成全流程或跨瀏覽器驗收。

Actions 基準：main `4907800` 的 [Recent review discovery QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41441985869) 在發布資產比對等待 60 分鐘後失敗，最後錯誤為 app.js byte mismatch；對應 [Pages 部署](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41441985151) 於檢查逾時後成功，現在正式站 app.js 與基準 SHA-256 相符。其他 published workflows 亦有逾時；不推定程式退化。[PR #198](https://github.com/RichardHan/ai-agent-use-cases/pull/198) 已處理診斷，仍為 draft；本輪不重複修改。

下一輪：釐清 Pages 部署完成事件與精確 commit 的驗證依賴，先核對 #198 最新狀態、部署排隊及 token 權限；避免只延長 timeout。UC-021 的頁首證據格式仍未對應官方分類，須逐案核實來源後再調整。正式站：https://richardhan.github.io/ai-agent-use-cases/。
