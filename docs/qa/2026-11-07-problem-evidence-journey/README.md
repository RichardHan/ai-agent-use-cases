# 2026-11-07 訪客問題檢索深度拓展（契約／資料擷取／發票處理／播客摘要／價格比較）、詳情指南直讀與 E2E 發布防線健全

## 1. 背景與問題證據

基準 commit：`3eb4f34`（origin/main 最新，PR #249 合併後）。原工作樹存在未提交修改，本輪使用隔離 worktree 操作。

### 核心問題
1. **常見問題自然關鍵詞檢索斷崖（0 筆結果或漏召回）**：
   - 「契約審查」／「審查契約」：全庫有 UC-154、UC-101、UC-021 等採購合約案例，但 `契約` 未納入 `SYNONYM_GROUPS` 的合約同義詞組，直接回傳 0 筆空結果。
   - 「資料擷取」／「資料抽取」／「data extraction」：全庫有 UC-098（工程 PDF 與 Excel 規格資料抽取）、UC-187 等案例，但分詞未切分且 `抽取` 漏列於 `擷取` 同義詞群，導致求助工程文件擷取的訪客面臨 0 筆落空。
   - 「發票處理」／「發票核對」／「invoice processing」：全庫有 UC-024（發票缺漏自動核對）、UC-225 等案例，但未切分「發票」與「處理／核對」，直接回傳 0 筆。
   - 「播客摘要」／「podcast summary」：全庫有 UC-412（播客逐字稿轉筆記與社群貼文）、UC-132 等案例，但未切分「播客」與「摘要」，回傳 0 筆。
   - 「價格比較」／「price comparison」：全庫有 UC-001（機票住宿比價）、UC-037、UC-481 等案例，但「價格比較」未映射至「比價」，檢索體驗斷裂。
   - 「會議筆記」／「meeting notes」：全庫有 UC-094（會議代班紀錄與筆記）等高品質案例，未切分「會議」與「筆記」導致偏向無關 pitch deck 案例。
2. **首頁捷徑與空結果推薦一致性缺漏**：
   - 首頁常見問題探索 `.hero-problem-tags` 與空結果推薦 `empty-problem-suggestions` 缺少「資料擷取」、「播客摘要」與「契約審查」快速入口。
3. **CI 整合與發布防線缺口**：
   - PR #249 建立了端到端訪客旅程測試 `tests/visitor-problem-browser.cjs`，但未接入主分支與 PR 核心檢驗流水線 `.github/workflows/website-qa.yml`，且先前的測試未涵蓋全狀態 Axe 無障礙檢查及詳情指導入門直讀。

## 2. 方案評估與決策

- **方案 A（選定）**：
  1. 擴充同義詞與分詞規則：
     - 將 `契約` 納入 `['合約', '合同', '契約', 'contract', 'contracts', '協議', 'agreement', 'agreements']`；
     - 將 `抽取` 納入 `['擷取', '提取', '萃取', '提煉', '抽取', 'extract', 'extraction']`；
     - 在 `tokenize()` 補齊複合詞與中英對照分詞規則：契約審查／contract review、發票處理／invoice processing、資料擷取／data extraction、播客摘要／podcast summary、價格比較／price comparison、客戶支援／customer support、會議筆記／meeting notes、interview prep。
  2. 首頁與空結果推薦同步補齊「資料擷取」、「播客摘要」與「契約審查」入口。
  3. 強化端到端驗收腳本 `tests/visitor-problem-browser.cjs`：涵蓋三情境、全流程 Axe 零違規檢查（涵蓋首頁、搜尋、空結果、復原後、詳情頁、返回後）、詳情建議展開與原始外部研究查證，並輸出結構化 `report.json`。
  4. 將 `visitor-problem-browser.cjs` 納入 `.github/workflows/website-qa.yml`，確保每一次 PR 與 main push 均有端到端瀏覽器保障。
- **方案 B（捨棄）**：引入大型客戶端向量檢索庫或改寫整站詳情架構，增加數十 MB 前端體積，破壞 GitHub Pages 極簡靜態秒開體驗。

## 3. 驗收結果

1. **單元與回歸測試**：
   - 先紅後綠：新增測試在修復前 2 項失敗，修復後 414 項 Node 單元測試全數通過（`node --test tests/*.test.cjs`）。
   - `node --check assets/app.js` 語法通過。
2. **端到端瀏覽器驗收**：
   - 執行 `tests/visitor-problem-browser.cjs` 於 Chromium 桌面（1440x900）、手機（390x844）、小手機（320x740）三個尺寸走查三情境：
     - **情境 1（問題導向搜尋）**：點擊「資料擷取」召回 37 筆案例；搜尋「契約審查」召回 19 筆合約審查案例，排除雜訊。
     - **情境 2（組合衝突與空結果復原）**：搜尋「契約審查」並設定衝突情境「創作」觸發空結果狀態，展示推薦選項；移除情境條件後立即平滑復原 19 筆結果。
     - **情境 3（詳情直鏈、憑據閱讀、指針直達與返回）**：開啟 `?scenario=工作&case=UC-098#explore`，核對 `author-demo` 憑據說明；點擊「建議操作流程與注意事項 ↓」直達展開入門建議與注意事項；展開原始研究核對 Reddit 來源；重新整理保持開啟；關閉後維持「工作」情境探索。
   - 所有視口與各階段 Axe 零違規（`totalViolations: 0`），無水平溢出，無 JavaScript console 錯誤。非真人研究。
3. **CI 管線整合**：
   - `.github/workflows/website-qa.yml` 成功整合 `tests/visitor-problem-browser.cjs`。

## 4. 限制與下一輪建議

- 本輪未修改案例原始 Markdown 內容或外部合格審計標準。
- 下一輪優先針對使用者在不同情境下的進階過濾（如工具＋門檻複合交集）的空結果引導進行細緻化微調。
