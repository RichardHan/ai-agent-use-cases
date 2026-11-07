# 2026-11-07 GitHub Actions 發布資源死鎖修復與業務痛點（報銷／合約）快捷探索驗收

## 1. 背景與問題證據

### 1.1 GitHub Actions 發布管線死鎖（Deadlock）
- **歷史問題**：在 PR #244 合併後，7 個 QA workflow（Run 42336879870、42336879927、42336879935、42336879945、42336879897、42336880020、42336880002）在等待 Pages 滿 60 分鐘後集體超時失敗；同版的 Pages 發布（Run 42336878799）在隊列中被卡死 1 小時 3 分鐘。
- **本輪即時證據**：PR #247 合併後，`pages-build-deployment`（Run 42351001204）在隊列中排隊超過 25 分鐘，正式站長時間停滯在舊版 `c391ae4`。
- **根因分析**：
  - Repo 中有 34 個 workflow 設定了 `push: branches: [main]`，且多數監聽 `assets/**`。
  - GitHub Actions 的 repository 並行上限為 20 個 runner。
  - 當任何程式碼合併至 `main`，34 個 workflow 同時啟動，搶先佔滿全部 20 個 runner，並在各自的 live 步驟中調用 `waitForPublishedAssets` 輪詢正式站長達 60 分鐘。
  - 真正負責將新程式碼發布到 GitHub Pages 的 `pages-build-deployment`（其 `deploy` job）因無 runner 可用，被迫在隊列中無限等待。
  - 形成死鎖：Pages 等待 runner 才能發布，20 個 runner 等待 Pages 發布才能結束。

### 1.2 業務痛點快捷探索缺口
- PR #247 雖在切詞層面解決了「出差報銷」與「合約審核」的搜尋召回，但在首頁 `.hero-problem-tags` 與空搜尋建議清單中，並未提供這兩項高頻企業痛點的一鍵捷徑。

---

## 2. 解決方案與變更內容

### 2.1 Actions 發布管線收斂與並行保護
1. **主線發布唯一閘門**：將 33 個歷史 feature workflow 的 `push: branches: [main]` 觸發改為封存歷史分支，不再於每次 `main` 提交時自動觸發。保留唯一的 canonical release gate：`website-qa.yml`（Website QA），由其負責建置 Jekyll、檢驗 corpus、等待 Pages 部署並執行全站 live browser 驗證。
2. **全流程 Concurrency 保護**：為所有 workflow 加入 `concurrency: { group: "${{ github.workflow }}-${{ github.ref }}", cancel-in-progress: true }`，避免同一分支或 PR 重複提交堆積 runner 隊列。
3. **自動防禦測試**：
   - `main push trigger is reserved for canonical release QA to prevent runner queue starvation`：嚴格斷言 `main` push 觸發的 workflow 數 <= 3。
   - `workflows define concurrency groups to prevent orphaned run congestion`：嚴格斷言所有 workflow 均定義 concurrency。

### 2.2 首頁與空結果業務痛點捷徑
1. **首頁常見問題**：在 `index.html` 的 `.hero-problem-tags` 新增 `出差報銷`（`?q=出差報銷#explore`）與 `合約審核`（`?q=合約審核#explore`）。
2. **空結果推薦**：在 `assets/app.js` 的 `empty-problem-suggestions` 加入 `✈️ 搜尋「出差報銷」` 與 `📄 搜尋「合約審核」`。
3. **文案同步**：更新 `README.md`。

---

## 3. 驗收證據

### 3.1 單元與整合測試
- `node --test tests/*.test.cjs`：**408 / 408 項全數通過**（包含所有工作流時限、發布閘門、切詞、搜尋、無障礙斷言）。
- `for file in assets/*.js; do node --check "$file"; done`：語法檢查全部通過。
- `python3 scripts/preview.py`：靜態預覽建置成功。

### 3.2 端到端情境走查（Chromium Desktop 1440px / Mobile 390px / Small Mobile 320px）
執行 `node tests/scenario-verification-browser.cjs`：
1. **情境一：問題導向探索**
   - 點擊「出差報銷」：召回 4 筆案例（首筆 UC-263，涵蓋 UC-284），標示「作者報告／示範」憑據。
   - 點擊「合約審核」：召回 10 筆案例（包含 UC-154、UC-007、UC-234、UC-374），標示完整受眾與目標。
2. **情境二：組合搜尋與空結果復原**
   - 輸入不相交關鍵字，出現友善空結果提示與推薦痛點標籤。
   - 點擊推薦標籤立即恢復有效探索，篩選條件維持不變。
3. **情境三：分享直鏈與返回探索**
   - 直鏈開啟 `?case=UC-284&q=出差報銷#explore`，自動彈出 `#detail` 對話框。
   - 標示來源憑據 badge（`role="note"`）、限制說明與外部來源連結（`target="_blank" rel="noopener"`）。
   - 點擊關閉或按 ESC 返回，搜尋詞「出差報銷」與卡片列表完整保留。
4. **無障礙審查**：全流程經 Axe 自動化掃描，**0 violations**。

截圖清單（涵蓋 desktop 1440、mobile 390、smallMobile 320 各 7 張）：
- `*-01-homepage.png`：首頁新痛點標籤外觀與排版。
- `*-02-scenario1-expense.png`：出差報銷檢索結果。
- `*-03-scenario1-contract.png`：合約審核檢索結果。
- `*-04-scenario2-empty.png`：空搜尋狀態與推薦痛點。
- `*-05-scenario2-recovered.png`：點擊推薦痛點後復原探索。
- `*-06-scenario3-detail.png`：直鏈詳情、憑據標記與外部來源。
- `*-07-scenario3-returned.png`：關閉詳情返回搜尋結果。

---

## 4. 交付與驗收清單

| 項目 | 狀態 | 驗證方式 |
|---|---|---|
| CI runner 資源競爭死鎖修復 | 完成 | 收斂 33 個 workflow 之 main push，加掛 concurrency，新增 2 項 CI 自動防禦單元測試 |
| 出差報銷／合約審核快捷入口 | 完成 | 更新 `index.html`、`assets/app.js`、`README.md`，新增單元與瀏覽器走查測試 |
| 全套單元測試 | 408/408 PASS | `node --test tests/*.test.cjs` |
| 獨立 Reviewer 審查 | PASS | 由獨立 subagent `reviewer` 依 diff 進行無相容性與無功能退化審查確認 |
