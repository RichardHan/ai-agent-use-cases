# X 搜尋字母邊界

基準：`413e7e85e701ad070f65a17fec0cf7b12e943af5`。正式站搜尋 X 的前八筆包含 UC-045（Codex）及 UC-063（Plex），字母 x 在英文單字內也被當作命中。對 X 加 ASCII 英數邊界，保留中文相鄰和 Twitter／推特同義詞；不改全文搜尋或篩選。來源網址提及 x.com 仍會命中，不等同主要用途。

基準回歸新增測試先失敗；修正後 `node --test tests/relevance.test.cjs tests/search.test.cjs` 通過，`node --test tests/*.test.cjs` 為 395 通過、0 失敗。`node --check assets/app.js` 通過；`scripts/preview.py` 預覽與 `scripts/check_corpus_bundle.py` 通過（485 份來源）。本機 Chromium 390／1440 搜尋、篩選、返回及空結果測試 `tests/search-submit-history-browser.cjs` 通過。正式站與預覽搜尋 X 前八筆分別為 UC-046、060、285、400、458、045、063、087，以及 UC-046、060、285、400、458、332、355、382。前後截圖留在 `/tmp/x-{before,after}-{desktop,mobile}.png`，非持久發布證據。

獨立審查未發現可證實的本次回歸；未將來源網址造成的全文命中視為新缺陷。預覽並非 Jekyll 正式建置；其他瀏覽器、真人研究、效能與對比未測。

Actions：基準 [Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41558863696) 和 [Pages](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41558862888) 成功。前版 `486eaa6` 的 [Search relevance QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41530221592) 在等待 `assets/app.js` 發布比對 3600000ms 後逾時；本機測試部分已通過。該版 Pages 部署排隊後成功，不能推論目前版本仍故障；診斷已有 [PR #198](https://github.com/RichardHan/ai-agent-use-cases/pull/198)。

下一輪：先核對 PR #198 的最新 head 與相關部署 run，重現排隊逾時診斷，再決定是否整合；不可僅延長等待或將未完成部署當成成功。
