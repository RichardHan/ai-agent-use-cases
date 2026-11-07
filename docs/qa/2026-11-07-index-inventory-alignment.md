# 2026-11-07 完整案例索引清單對齊與自動防線

基準 `cfdd8fec255ac0257211b9c553bffa951d55891a`（PR #241 合併後）；原工作樹存在未提交修改，本輪使用隔離 worktree 操作。正式站：https://richardhan.github.io/ai-agent-use-cases/ ；Actions：https://github.com/RichardHan/ai-agent-use-cases/actions 。

## 問題證據與目標使用者

- **目標使用者**：在網路緩慢、無 JavaScript 環境或偏好純文字目錄，透過首頁「完整案例索引」（`INDEX.html`）瀏覽案例庫全貌的新舊訪客與研究者。
- **問題證據**：
  1. 正式站 `INDEX.html` 與 `origin/main:INDEX.md` 標題為 `## 主要案例（484）`，但 `cases/` 實際已有 499 篇案例（PR 241 加入 UC-503–507 後），標題滯後 15 篇。
  2. 主表（`<a id="case-list">` 下）實際上只有 494 列，`UC-441` 至 `UC-445`（共 5 篇合格案例）未收錄於主表，而是被零散留在下方研究批次筆記的獨立小表中，訪客循序瀏覽時無法在主表中找到。
  3. 既有 `tests/audit.test.cjs` 僅對整份文件的行數作 `>= 330` 寬鬆檢查，未驗證主表與標題的一致性，導致案例新增時容易發生主表缺漏與計數漂移。

## 方案比較與決策

- **方案 A**：僅將標題數字由 484 改為 499，保留 UC-441–445 於研究筆記小表。
  - 取捨：改動小，但主表依然缺少 5 筆案例，訪客在 `#case-list` 查閱時無法取得完整 499 篇案例，目錄不完整問題未解決。
- **方案 B（採用）**：
  - 將 `UC-441` 至 `UC-445` 依序歸位至主表 `UC-440` 與 `UC-446` 之間，並清理研究筆記中重複的零星小表（保留文字摘要）。
  - 將主表標題修正為 `## 主要案例（499）`。
  - 在 `tests/audit.test.cjs` 建立嚴格回歸防線：比對標題數字與主表列數必須精確等於 `cases/` 檔案總數，且所有案例檔案必須出現在主表中。
  - 取捨：徹底消除靜態索引的案例缺漏，使靜態索引、`cases/` 與 `catalog.json` 保持 499 篇完全一致；未來新增案例若未更新主表將在 CI 立即報警。

## 驗收與測試結果

1. **先紅後綠回歸驗證**：
   - 建立斷言後未修改 `INDEX.md` 時執行 `node --test tests/audit.test.cjs`，明確報錯 `INDEX.md main case count in heading (484) must match case files count (499)`。
   - 修正後重新執行 `node --test tests/audit.test.cjs`，8 項測試全數通過（PASS）。
2. **全套測試與語法**：
   - `node --test tests/*.test.cjs`：396 項通過、0 失敗。
   - `node --check assets/app.js`、`assets/reader.js` 通過。
   - `python3 scripts/preview.py` 與 `python3 scripts/check_corpus_bundle.py`：503 個來源（499 案例 + 3 證據 + 1 pending）逐 byte 一致。
3. **瀏覽器端到端驗收（`tests/page-context-browser.cjs`）**：
   - 涵蓋 Chromium 1440px、Chromium 390px、Chromium 320px、Firefox 390px、WebKit 390px 五組引擎與視口尺寸，全數 PASS。
   - 五組環境完成三種關鍵旅程：
     1. 新訪客痛點與搜尋：從「旅遊」關鍵字探索、情境與工具篩選。
     2. 組合篩選與空結果復原：遭遇無結果後透過建議及重設控制恢復探索。
     3. 詳情直鏈、證據判讀與返回：透過 `?case=UC-001` 直鏈載入、查看來源憑據、檢視原廠連結、鍵盤返回保留原搜尋條件。
   - axe-core 無障礙自動掃描零違規（violations: 0）。
   - 截圖與日誌儲存於 `/tmp/inventory-qa-artifacts/`。

## 本輪不處理範圍與已知限制

- 本輪未修改案例正文或重新評定外部真實度。
- 本輪不更動首頁前端 JavaScript 搜尋與模態邏輯。
- 本機環境未安裝 Ruby / Jekyll，Jekyll 編譯由 GitHub Actions 雲端工作流執行。

## 下一輪優先建議

- 檢查混合來源案例（如多來源併入之案例）各段主張與證據標籤的一致性，先以一則案例為樣本對照原始來源核對，避免將建議步驟當成已實作。
