# 2026-11-06 待查條目邊界

基準 main `fc1b1c5c6da19ed06313e9f186e9258317bc83a6`；[正式站](https://richardhan.github.io/ai-agent-use-cases/)。P-004 歸檔說明原位於 P-003 最後一段，既有按 `## P-` 拆分的解析器因此將其納入 P-003 原文與搜尋索引。將原句原連結移至清單導言，保留追溯資料，避免訪客把無關招標案例誤認為 P-003 內容；P-001 至 P-003 標題與資料不變。

回歸：修正前 `node --test tests/relevance.test.cjs` 的新增條目邊界斷言失敗；修正後 `node --test tests/*.test.cjs` 395 通過，`node --check assets/app.js` 通過。`python3 scripts/preview.py /tmp/observed-round-after/ai-agent-use-cases` 與 `python3 scripts/check_corpus_bundle.py /tmp/observed-round-after/ai-agent-use-cases` 驗證 498 份來源逐 byte 一致。390px 與 1440px 本地預覽 P-003 直鏈顯示詳情且不含 P-004；預覽無正式來源版本，不能據此確認固定版本連結。`SITE_URL=http://127.0.0.1:8137/ai-agent-use-cases/ node tests/page-context-browser.cjs` 通過 Chromium 1440／390／320、Firefox 390、WebKit 390；首次執行錯用 `ROUND_URL` 而連錯埠失敗。獨立 reviewer 對資料與測試 diff 靜態審查未發現問題。

主線 [Pages run](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42159134078) 與 [Audit run](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42159134901) 在基準成功；歷史 [Corpus bundle QA 失敗](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42015358407) 的 WebKit 根因未確定，詳見 `2026-11-06-webkit-diagnostics.md`。[PR #229](https://github.com/RichardHan/ai-agent-use-cases/pull/229)；修復 commit `601ce5576c51d8156b59b674f51c244032712258`。本紀錄更新時 PR 檢查尚在執行，未確認部署，勿視為已發布。

下一輪：檢查新的 Corpus bundle QA 失敗 artifact 中 `journeys/report.json` 的 `pageErrors[].recentEvents`，先確認出錯前導航及請求；無新失敗時不要假定歷史錯誤仍在。
