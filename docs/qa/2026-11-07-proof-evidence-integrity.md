# 2026-11-07 來源憑據真實度修復與抽卡池防線

基準 main `9575613df2dcddab2f44e9c9949c1137638c1e3f`（[PR #243](https://github.com/RichardHan/ai-agent-use-cases/pull/243) 合併後）；原工作樹存在未提交內容，本輪在隔離 worktree 操作。
正式站：https://richardhan.github.io/ai-agent-use-cases/
GitHub Actions：https://github.com/RichardHan/ai-agent-use-cases/actions

## 問題證據與目標使用者

- **目標使用者**：透過搜尋、篩選來源憑據，或閱讀卡片與詳情頁評估實作可信度的新舊訪客與研究者。
- **問題證據**：
  1. **待驗證（`unverified`）案例被錯誤升級為高信度標籤**：
     - `cases/447-jet-lag-light-sleep-coach.md` 明確註記「`unverified（待驗證）... 目前沒有任何旅程結果`」，但因正文提及作者，在 `assets/app.js:544` 被錯誤判定為「作者報告／示範」。
     - `cases/404-fan-watch-official-news-twice-daily-calendar-dedup.md` 明確註記「`unverified`（待驗證）」，因提及模板被誤判為「模板／文件核讀」。
     - `UC-338`、`UC-377`、`UC-384`、`UC-408`、`UC-414`、`UC-415` 等共 8 篇首標待驗證案例，原本全數無法以「尚待查證」篩選找到，反而出現在「作者報告／示範」或「公開資料核讀」中，使無產物之想法被誤當成已有實測或核讀證據。
  2. **社群作者專案被誤判為官方背書**：
     - `cases/455-muse-gadgets-m5stickc-plus2-pocket-push-to-talk.md` 是日本創客 tantan21jp 使用 Meta 開源 SDK 實作的個人硬體專案（`author-demo`），但因提及官方 SDK，在 `app.js` 原有 `official` 先行規則下被標記為「官方自報」，讓訪客誤以為 Meta 官方推出此裝置。
     - 同類案例（如 `UC-016`、`UC-050`、`UC-076`、`UC-420`、`UC-486`、`UC-501`）亦有類似誇大現象。
  3. **首頁抽卡分流缺口**：
     - 獨立審查指出，修復 UC-404 待驗證分類後，若未同步在 `assets/discovery.js` 排除 `尚待查證`，案例型未驗證條目會進入首頁隨機抽卡，違反 `index.html:62`「待查想法與模板補充可在下方搜尋」的分流原則。

## 方案比較與決策

- **方案 A**：大重構整站 Markdown 規格，為各章節（Method、Outcome、Limitation）引進多維度主張標籤。
  - 取捨：改動過大，需修改近 500 篇檔案與前端多處，遷移期風險極高。
- **方案 B（採用）**：
  - 在 `assets/app.js` 調整解析優先級：
    1. 首標 `unverified`、`待驗證`、`待定` 或 `尚待查證` 一律判定為「尚待查證」。
    2. 保留真正的官方陳述（如 `UC-017` 官方署名作者陳述、`UC-018` 官方首發展示、`UC-022` 官方員工自報、`UC-026` 官方團隊使用自述）。
    3. 含有 `author-demo` 之社群專案歸為「作者報告／示範」，不因引用官方 SDK 或文件而膨脹為「官方自報」。
  - 在 `assets/discovery.js` 的 `discoveryPool` 中，同步排除 `proof === '尚待查證'`，確保首頁抽卡僅展示已有操作報告或官方陳述之案例，待查想法留在搜尋與篩選。
  - 在 `tests/discovery-clarity-and-ci-resilience.test.cjs` 與 `tests/discovery.test.cjs` 建立嚴格回歸防線。

## 驗收與測試結果

1. **先紅後綠回歸驗證**：
   - 增加斷言後未改邏輯前，`node --test tests/discovery-clarity-and-ci-resilience.test.cjs` 明確回報 2 項 FAIL（UC-447 被誤判為作者報告、UC-455 被誤判為官方自報）。
   - 修改 `assets/app.js` 與 `assets/discovery.js` 後重新執行，全數 PASS。
2. **全套測試與建置**：
   - `node --test tests/*.test.cjs`：398 項全數通過、0 失敗。
   - `node --check assets/app.js`、`assets/discovery.js` 通過。
   - `python3 scripts/preview.py` 與 `python3 scripts/check_corpus_bundle.py`：503 份來源逐 byte 一致。
3. **瀏覽器端到端驗收（`tests/proof-acceptance-browser.cjs`）**：
   - 走查 Chromium 1440px 桌面與 390px 手機尺寸：
     - 情境 1：新訪客搜尋「旅遊」，篩選「尚待查證」，正確列出 UC-447 且卡片徽章標示「尚待查證」。
     - 情境 2：組合極端條件觸發空結果，點擊「清除條件，重新探索」立即復原。
     - 情境 3：直鏈開啟 `?case=UC-447`、`?case=UC-455` 與 `?case=UC-018`：
       - UC-447 頂部與說明區正確顯示「尚待查證」警告，展開來源確認連至 Mark Bulling 原始 X 貼文。
       - UC-455 正確標示「作者報告／示範」，未膨脹為官方自報。
       - UC-018 正確維持「官方自報」。
     - 首頁抽卡池確認已排除 UC-447、UC-404 等「尚待查證」條目。
   - axe-core 無障礙自動掃描零違規（violations: 0）。
   - 前後對照截圖儲存於 `/tmp/qa-artifacts-round-20261107/`。

## 本輪不處理範圍與已知限制

- 本輪未修改案例原文 Markdown。
- 本輪未將單一案例細拆為段落級獨立徽章。

## 下一輪優先建議

- 檢查首頁常見痛點（如「日報整理」、「自動客服」、「代碼審查」）快捷入口的搜尋召回結果，針對包含大量補充段落提及但主要用途不符的案例，評估標題與用途優先加權。
