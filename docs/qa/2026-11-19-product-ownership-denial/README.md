# 2026-11-19 工具歸屬否定與篩選

基準 `69c55d211b0d07b2914d1c1a8e0ceb04481e04dd`。UC-356 原文說 Clipper「不是 xAI 或 Cursor 產品」，工具篩選卻把 Cursor 列為提及。針對這個明確片語只在工具辨識文字中移除，保留原文、全文搜尋與同句另一處實際使用。這不是通用否定語意判斷。

新回歸測試修改前失敗，修改後通過，並檢查同句前後的真實 Cursor 使用和 Grok Bot。`node --test tests/*.test.cjs`：922 pass；`node --check assets/app.js`、`git diff --check` 通過。預覽由 `scripts/preview.py` 產生，`scripts/check_corpus_bundle.py` 核對 535 個來源一致；這不是 Jekyll 正式 build。

Chromium 自動化在正式站及本機預覽的 1440×900、390×844 以相同 UC-356 搜尋狀態檢查：修正前卡片列出 Grok Bot / Cursor，修正後僅 Grok Bot；Cursor 篩選由一筆變零筆，全文搜尋 Cursor 仍能找到原文。前後截圖在本資料夾。預覽的 `tests/visitor-problem-browser.cjs` 在 1440、390、320 寬度完成問題搜尋、組合條件空結果復原、詳情與來源情境，該測試執行的 axe 檢查無違規；結果只適用於測試覆蓋的頁面與狀態。

基準正式站 `corpus.json` 的 `sourceRevision` 為基準 commit；[Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/44515184614) 與 [Pages](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/44515184239) 成功。PR #468 的 [Reader search QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/44434645064) 安裝字型時逾時取消，修復已由 #471 合併；修復後 [Reader search QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/44509626011) 與 [Source guide QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/44509626204) preview 成功。其他舊失敗的可取得日誌不足以判定原因。

正式站人工操作受阻：`orca skills get orca-cli` 回報無法由 `/usr/local/bin/orca` symlink 判定 Orca.app 路徑；替代瀏覽器控制服務回報 host unavailable。自動測試不能取代完整人工桌機／手機走查；合併前仍需完成三種訪客情境、來源連結、焦點、直鏈與返回，以及正式發布版本核對。

下一輪先以可用瀏覽器重跑上述訪客情境，再盤點其他否定歸屬寫法，依真實語料建立正反例，避免泛化刪除有效工具。
