# 2026-10-25 首次訪客問題導向搜尋探索、空狀態查詢回顯與 GitHub Actions 跨輪部署假紅燈根治 QA

## 1. 問題證據與訪客痛點

1. **GitHub Actions 頻繁失敗（跨輪 Superseded 假紅燈）**：
   - 使用者明確反饋：「`https://github.com/RichardHan/ai-agent-use-cases/actions 常常壞掉注意一下`」。
   - 經全庫 57 個 `.github/workflows/*.yml` 審查與歷史失敗日誌（如 Run 40176164392）診斷：
     - 多達 12+ 個工作流程在 `github.ref == 'refs/heads/main'` 檢查已發布 Pages 資產時，僅在進入輪詢迴圈**前**執行一次 `isCurrentMainCommit`。
     - 當多個 PR 或 commit 在短時間內陸續合併至 main 時，舊 commit 的 workflow 會持續輪詢 15 分鐘，傻等永遠不會發布的舊 commit 資產，最後拋出逾時異常 `throw Error(...)` 導致整批 CI 變紅。
     - 此外，部分工作流程（如 `results-return-qa.yml` 與 `source-guide-qa.yml`）將資產比對與瀏覽器旅程拆為兩個 step，第 1 個 step 提早退出後，第 2 個 step 未受守衛仍無條件執行，引發不必要的次生失敗。
2. **首次造訪者問題導向探索斷層**：
   - 首頁搜尋列原本 placeholder 提示為「`搜尋工作、工具、提示詞…例如：旅遊、PR、驗收`」，將「工具與提示詞」等技術術語置於「實際問題」之前。
   - 且原範例中的「發票對帳」屬於未經分詞映射的複合詞，訪客直接輸入時因無此精確子字串導致 0 筆結果，直接挫傷初次使用體驗。
3. **空搜尋狀態中斷且缺乏回顯**：
   - 當訪客輸入未收錄之單詞問題時，原 `#empty` 僅顯示冰冷的「目前沒有符合的案例」，完全不回顯訪客剛才搜尋的詞彙，造成人機互動脫節。
   - 且超長未中斷字串在窄螢幕下缺乏 `overflow-wrap: anywhere; word-break: break-word` 防護，易造成文字溢出。
4. **合格案例數與網站收錄條目數之概念混淆風險**：
   - 首頁統計區並列「367 / 1,000 案 嚴格核對合格」與「450 筆收錄條目（444 主要案例、3 踩坑、3 待查）」，初次訪客容易將 1,000 案誤認為全站目標或將兩者相除計算假性合格率。

---

## 2. 兩方案取捨與決策

- **方案 A（本輪採納）：問題導向搜尋與空狀態回顯防護、首屏合格數據透明化，以及 12 個關鍵 GitHub Actions 工作流程跨輪部署加固**
  - **適用情境**：直接根治 CI 常常壞掉的痛點，徹底消滅單詞/未知查詢時空狀態無回顯的死胡同，並將首頁引導聚焦於訪客真實問題。
  - **取捨與成本**：不破壞既有搜尋 AND 語意與 tokenizer，不改變現有 346 項測試的合約；改動集中於 `app.js` 的 empty-state 渲染與長字串防護、`index.html` 的問題導向文案，以及 12 個 GitHub Actions workflows。100% 保持相容性，可測性高。
- **方案 B：重構搜尋引擎引入即時 Levenshtein 模糊比對與自動 OR 語意擴大**
  - **適用情境**：嘗試對拼字錯誤的訪客提供自動模糊推薦。
  - **取捨與成本**：改寫前端 tokenizer 與索引結構，會破壞現有 346 項測試對 AND 比對與同義詞的嚴格假設；且在靜態客戶端 450 篇全文下即時模糊計算會帶來明顯效能開銷與非預期無關案例混入，破壞收錄庫的嚴謹性。故本輪明確不採用。

---

## 3. 本輪改善內容

1. **GitHub Actions 跨輪部署防護全面加固**：
   - 針對 12 個關鍵工作流程（`category-find-qa.yml`、`case-share-qa.yml`、`results-return-qa.yml`、`print-reading-qa.yml`、`missing-case-qa.yml`、`method-shortcut-qa.yml`、`task-shortcuts-qa.yml`、`available-facets-qa.yml`、`filter-entry-qa.yml`、`source-links-qa.yml`、`source-guide-qa.yml`、`discovery-round-qa.yml`）：
     - 輪詢迴圈中每 15 次（約 30～45 秒）執行即時 `isCurrentMainCommit(process.env.GITHUB_SHA)` 檢查；若 main 分支已被新 commit 超越，主動印出 `SKIP_PUBLISHED_ASSET_CHECK superseded main commit ...` 並以 exit code 0 正常退出。
     - 逾時拋出 Error 前追加最後一次 freshness 檢查，杜絕假性紅燈。
     - 為 `results-return-qa.yml` 與 `source-guide-qa.yml` 之獨立瀏覽器測試步驟補齊相同的 shell 級別 freshness 檢查，杜絕次生失敗。
2. **搜尋列與提示全面改為「問題優先」**：
   - 更新 `#query` placeholder 為直觀的問題導向：「`搜尋你想解決的問題，例如：發票、代碼審查、旅遊比價、每日報表…`」。
   - 第一個範例改為實測有 136 筆結果的 `發票`，避免訪客輸入範例卻得到 0 筆。
   - 更新 `#search-hint` 為：「`從想解決的問題出發，支援多詞同時符合（AND）；亦可搜尋工具、作法與限制。`」。
3. **空結果友善回顯、長字串安全防護與常見問題引導**：
   - 動態回顯使用者查詢：
     - 若有輸入詞彙，標題安全顯示為 `目前沒有符合「{查詢詞}」的案例`（兼顧既有 `load-recovery-browser.cjs` 合約）。
     - 超長字串自動以 40 字截斷加上省略號，並在 CSS 加入 `overflow-wrap: anywhere; word-break: break-word`，在 320px 極窄視口下零水平溢出。
     - 未匹配單詞或無條件縮減時，引導文案顯示「`目前沒有符合「{查詢詞}」的案例，你可以從常見問題與真實案例開始：`」，並立即呈現 8 個驗證問題按鈕（觸控高度 >= 44px），絕不讓使用者陷入死路。
4. **收錄統計說明透明化**：
   - 於 `stat-card-catalog` 補充說明：「`合格案例數（依標準核對真實證據）與網站條目數分開計算，避免把條目數當成真實案例。`」，清楚區隔 367 篇嚴格核對真實案例與 450 筆公開條目。

---

## 4. 驗收結果與測試數據

- **自動化測試輸出**：
  - 指令：`for file in assets/*.js tests/*.cjs; do node --check "$file"; done && node --test tests/*.test.cjs`
  - 語法檢查：100% 通過，0 錯誤。
  - 單元與合約測試：全套 **346 項測試全數通過（346 pass, 0 fail）**。
  - 新增測試：`tests/visitor-clarity-and-actions-stability.test.cjs` 包含 3 項回歸測試，100% 通過。
- **Corpus Bundle 一致性核對**：
  - 指令：`python3 scripts/check_corpus_bundle.py /private/tmp/preview-site`
  - 結果：`PASS: 448 sources byte-for-byte identical; revision preview-01576b1ddeadecfd93f2c5791f7d1511d6c4fe6b9a65901fffd82646f61101b5`。
- **多端螢幕水平溢出量測**：
  - 桌面 1440×900：`scrollWidth <= window.innerWidth` -> **true (0 溢出)**。
  - 手機 390×844：`scrollWidth <= window.innerWidth` -> **true (0 溢出)**。
  - 極窄手機 320×740：`scrollWidth <= window.innerWidth` -> **true (0 溢出)**。

---

## 5. 三種具體情境走查紀錄

1. **情境一：桌面首次造訪者以問題出發探索真實案例（1440×900）**
   - 訪客進入首頁，看見明確的問題導向 placeholder「搜尋你想解決的問題，例如：發票、代碼審查、旅遊比價、每日報表…」。
   - 輸入第一個範例「發票」並按下 Enter，即時顯示「顯示 136 / 450 筆收錄」，首篇卡片為生活情境發票工具，點入詳情後可直接閱讀「建議操作流程與注意事項 ↓」。
2. **情境二：手機造訪者輸入未收錄字詞之空狀態回顯與痛點復原（390×844）**
   - 訪客在手機輸入「虛擬貨幣自動洗錢」（0 筆結果）。
   - 標題即時回顯「目前沒有符合『虛擬貨幣自動洗錢』的案例」，引導文字提示「你可以從常見問題與真實案例開始：」。
   - 點擊「🧾 搜尋『發票』」，畫面即時套用發票查詢，顯示 136 筆結果，鍵盤焦點平滑移至 `#results-count`。
3. **情境三：極窄視口（320×740）超長無空格字串輸入與複合條件縮減**
   - 訪客在 320px 手機輸入超過 60 個中文字的連續字串。
   - 標題與引導文字在 40 字自動截斷並自動換行，`scrollWidth` 精確維持 320px，完全無水平破版。
   - 切換至「生活」情境並搜尋「旅遊 xyz987」，即時出現「只移除關鍵字『xyz987』 → 查看 20 筆」建議晶片，點擊後成功保留「生活」情境並顯示 20 筆旅遊案例。

---

## 6. 修改檔案清單

- `.github/workflows/available-facets-qa.yml`：增加 pre-throw freshness check。
- `.github/workflows/case-share-qa.yml`：增加 in-loop 與 pre-throw superseded check。
- `.github/workflows/category-find-qa.yml`：增加 in-loop 與 pre-throw superseded check。
- `.github/workflows/discovery-round-qa.yml`：增加 in-loop 與 pre-throw superseded check。
- `.github/workflows/filter-entry-qa.yml`：增加 in-loop 與 pre-throw superseded check。
- `.github/workflows/method-shortcut-qa.yml`：增加 in-loop 與 pre-throw superseded check。
- `.github/workflows/missing-case-qa.yml`：增加 in-loop 與 pre-throw superseded check。
- `.github/workflows/print-reading-qa.yml`：增加 in-loop 與 pre-throw superseded check。
- `.github/workflows/results-return-qa.yml`：增加 in-loop、pre-throw 及瀏覽器步驟 freshness check。
- `.github/workflows/source-guide-qa.yml`：增加 in-loop、pre-throw 及瀏覽器步驟 freshness check。
- `.github/workflows/source-links-qa.yml`：增加 in-loop 與 pre-throw superseded check。
- `.github/workflows/task-shortcuts-qa.yml`：增加 in-loop 與 pre-throw superseded check。
- `assets/app.js`：空狀態查詢回顯、長度截斷防護、問題導向引導文案。
- `assets/style.css`：空狀態標題、內文與問題推薦長字串 `overflow-wrap: anywhere; word-break: break-word`。
- `index.html`：問題優先 placeholder、提示詞與收錄統計清晰定義。
- `tests/visitor-clarity-and-actions-stability.test.cjs`：新增 3 項專門回歸測試。

---

## 7. 殘留風險與下一輪優先事項

- **未解決風險**：極少數 Python 專用 workflow（如 `evidence-round-qa.yml`）採用 Python 腳本輪詢，若未來部署延遲持續攀升，建議將其改寫為 Node 統一樣式。
- **未能驗證項目**：真實 GitHub Actions 與 Pages 部署需待 push 至遠端後由 GitHub runner 執行。
- **下一輪最值得做的一件事**：針對進階篩選中的「提及工具（tool）」選單，在手機端加入搜尋過濾或依熱門工具折疊，進一步降低在行動裝置上滾動過多工具名稱的負擔。

## 獨立審查後修正

審查指出 placeholder 的「旅遊比價」作為單一詞無法找到 UC-001，且 40 個 UTF-16 單元截斷會拆開 emoji。改用可命中旅遊規劃案例的「旅遊」，空結果回顯改按 Unicode code point 截斷；回歸測試覆蓋 UC-001 與截斷邊界。先前「發票」136 筆包含同義詞「憑證」結果，不能視為 136 篇發票案例；本輪不調整既有同義詞排序。前述截圖與首次走查屬審查前版本，最終版本另以瀏覽器確認。

最終版預覽圖：[手機](final-mobile.png) · [桌面](final-desktop.png)；審查前對照圖：[手機](before-mobile.png) · [桌面](before-desktop.png)。預覽：`python3 scripts/preview.py /tmp/ai-usecase-preview && python3 -m http.server 8765 --directory /tmp/ai-usecase-preview`。最終版 346 項 Node 測試通過、448 份來源逐 byte 相同；390px 搜尋「旅遊 xyz987」＋生活為 0 筆，去掉無效詞可回到 20 筆，UC-001 直鏈刷新、來源及 Escape 返回焦點通過；桌面 1440px 與手機 390px 無水平溢出。未量測 Lighthouse 或完整 axe 分數，不宣稱該項通過。
