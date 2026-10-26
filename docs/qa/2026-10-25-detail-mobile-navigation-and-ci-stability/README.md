# 2026-10-25 案例詳情手機閱讀層級重整、來源憑據語意統整與 GitHub Actions 跨輪部署防護 QA

## 1. 問題證據與訪客痛點

1. **詳情頁手機端重複導覽與跳轉競爭（依前輪優先項推進）**：
   - 在 `SITE.md` 上輪紀錄中明確指定：「下一輪優先檢視詳情手機重複導覽與來源入口」。
   - 經實機量測與 DOM 稽核，在手機（390px 與 320px 窄螢幕）開啟長篇案例（如 UC-005, UC-001）時，在核心內文之前堆疊了多達 7 個導覽與跳轉按鈕（頂部 toolbar 案例切換、概覽內的 `.reader-original-open`「查看完整原始研究」、`.reader-method-shortcut`「前往方法與步驟」、`.reader-guidance-shortcut`「建議操作流程」、報告卡片內的 `.reader-report-open`「到完整研究核對這一段」、以及 `.reader-nav` 內的 4 個 jump 按鈕），導致首屏垂直空間被控制項嚴重侵占，首次造訪者無從辨識哪個按鈕才是真正可採用的入門指引。
2. **來源連結與憑據狀態語意不明確**：
   - 頂部 `.detail-source` 連結在窄手機螢幕上以 `.print-action-short` 顯示為隱晦的「Markdown ↗」，初次造訪者難以理解其代表 GitHub 上的原始公開檔案。
   - 頂部憑據標籤（如「作者報告／示範」）僅以短徽章呈現，且依賴桌面 hover tooltip（`title`），在觸控裝置上無法即時查閱其代表「尚未取得獨立代碼庫驗證」的真實含義，容易讓新訪客誤認成果已獲獨立驗證。
3. **底部離開與閉環操作語意競爭**：
   - 詳情底部同時出現 `.related-back`（「關閉閱讀」）與 `.detail-action-scenario`（「關閉並探索更多『情境』案例 →」），兩個按鈕皆帶有「關閉」動詞，語意重疊且缺少視覺層級劃分。
4. **GitHub Actions 輪詢過早報警與 superseded commit 假性紅燈**：
   - 實際 Actions run 40176164392 在 `recency-qa.yml` 輪詢 15 分鐘後噴出 `Published assets and catalog did not match checkout within eight minutes` 失敗，原因為：(a) 錯誤訊息過時（仍寫八分鐘）；(b) 輪詢迴圈內未檢查主分支是否已被後續 commit 超越，導致當有新 PR 合併時，舊分支工作流程持續傻等永遠不會發布的舊 commit 資產。

---

## 2. 兩方案取捨與決策

- **方案 A（本輪採納）：案例詳情手機閱讀層級重整、來源憑據語意統整與 Actions 跨輪部署防護**
  - **適用情境**：緊扣既有維護紀錄下一輪優先事項，深入優化詳情頁手機體驗與可信度識別，並徹底解決 Actions 假性紅燈。
  - **取捨與成本**：不更動搜尋核心 tokenizer 或首頁 Hero 大結構，改動精確收斂於詳情頁 DOM、閱讀引導樣式及 5 個關鍵 Actions 工作流程，可測性強，100% 保持既有 344 項合約測試相容。
- **方案 B：首頁問題導向探索捷徑統一、卡片痛點一致化與搜尋空結果詞彙推薦**
  - **適用情境**：聚焦首頁任務關鍵字 mapping 與搜尋多詞空結果時的逐詞推薦。
  - **取捨與成本**：改動牽涉首頁版面與搜尋核心 tokenizer 的改寫，對現有測試影響面較廣，且未直接回應上一輪指定的「詳情手機重複導覽與來源入口」優先順序。

---

## 3. 本輪改善內容

1. **詳情頁導覽按鈕視覺分層與語意劃分**：
   - 為概覽區捷徑賦予語意色彩與清晰邊框：
     - `.reader-guidance-shortcut`：「🚀 建議操作流程與注意事項 ↓」具備品牌綠色左框線（`border-left: 3px solid var(--green)`）與淡綠背景（`#f0f5eb`），突出本庫整理之實用步驟。
     - `.reader-method-shortcut`：「📋 前往方法與步驟 ↓」具備沉穩灰綠左框線（`border-left: 3px solid #7d9678`），指引作者原汁原味的研究方法。
     - `.reader-original-open`：「📖 查看完整原始研究、來源與提示詞 ↓」具備柔和左框線（`border-left: 3px solid #a8b8a0`），清晰區隔深度原文展開。
   - 所有按鈕嚴格維持 >= 44px 觸控無障礙規範與清晰 `:focus-visible` 焦點外框。
2. **來源連結與憑據狀態直觀可信**：
   - 更新 `.detail-source` 行動端標籤：桌面顯示「查看 GitHub 原始 Markdown ↗」，手機端由「Markdown ↗」升級為直白之「原始 Markdown ↗」，並具備完整 `aria-label="在新分頁開啟 {id} 的 GitHub 原始 Markdown 檔案 ↗"`、`target="_blank"` 與 `rel="noopener noreferrer"`。
   - 為詳情頁頂部 `.proof-badge` 補充 `role="note"` 與包含完整官方說明的 `aria-label`（如「來源憑據：作者報告／示範。社群作者公開分享的操作紀錄與示範，尚未取得獨立代碼庫驗證。」），觸控與語音使用者無需依賴 hover 即能取得完整透明資訊。
   - 為 `.detail-proof-note` 加上 `flex-wrap: wrap` 與 `@media(max-width:360px)` 垂直落點優化，徹底消除 320px 極窄螢幕下文字被擠壓的風險。
3. **底部返回閉環明確分層**：
   - 將 `.related-back` 更新為「關閉並返回結果」，`aria-label` 設定為「關閉本篇並返回案例列表」，並以乾淨的次要按鈕造型呈現。
   - 保留主要行動按鈕 `.detail-action-scenario`（「探索更多『情境』案例 →」）與 `.detail-action-copy`（「複製本篇筆記與連結 📋」），在手機寬度下垂直全寬排列，按鈕高度 >= 44px。
4. **GitHub Actions 輪詢韌性與 superseded check 全面加固**：
   - 針對 `recency-qa.yml`、`combined-recovery-qa.yml`、`round-qa.yml`、`card-refinement-qa.yml`、`reader-controls-qa.yml` 五個工作流程：
     - 在輪詢迴圈中加入每 15 次（約 30～45 秒）即時 `isCurrentMainCommit(process.env.GITHUB_SHA)` 檢查；若 main 分支已被新 commit 超越，則輸出 `SKIP_PUBLISHED_ASSET_CHECK superseded main commit ...` 並安全提早結束，避免持續輪詢 15 分鐘產生假性紅燈。
     - 逾時報警前加入最後一次 freshness 檢查。
     - 修正 `recency-qa.yml` 過時之「within eight minutes」報警訊息為精確之「within 15 minutes (180 attempts)」。

---

## 4. 驗收結果與多端數據

### 自動化測試輸出
- 執行指令：`node --check assets/*.js && node --test tests/*.test.cjs`
- 執行結果：
  - 語法檢查：`assets/*.js` 0 語法錯誤。
  - 單元與端到端測試：全套 **349 項測試全數通過（349 pass, 0 fail）**。
  - 新增測試：`tests/detail-mobile-navigation.test.cjs` 包含 5 項完整回歸測試，100% 通過。

### 多尺寸版面與無障礙量測
- **桌面 1440×900**：
  - 水平溢出檢查：`document.documentElement.scrollWidth <= window.innerWidth` -> **true (零水平溢出)**。
  - 來源連結直讀：「查看 GitHub 原始 Markdown ↗」，在新分頁開啟。
  - 詳情憑據：標記 `role="note"` 與完整白話定義。
- **主流手機 390×844**：
  - 水平溢出檢查：**true (零水平溢出)**。
  - 來源連結直讀：「原始 Markdown ↗」，完整說明 `aria-label`。
  - 底部返回操作：「探索更多案例」（高 45.1px）與「關閉並返回結果」（高 44.0px），嚴格滿足 >= 44px 觸控無障礙規範。
- **極窄手機 320×740**：
  - 水平溢出檢查：`scrollWidth <= clientWidth` -> **true (零水平溢出)**。
  - 憑據解讀卡 `.detail-proof-note` 自動換行，無文字折斷或遮擋。

---

## 5. 三種具體情境模擬走查

1. **情境一：初次造訪的非技術讀者透過手機探索生活情境案例（UC-001）**
   - 讀者在手機上點選卡片開啟「旅行比價」詳情。
   - 頂部明確看見「原始 Markdown ↗」直達來源，憑據標註「公開資料核讀」。
   - 在概覽下方清楚看見綠色左邊框的「🚀 建議操作流程與注意事項 ↓」，點擊後平滑捲動並聚焦至入門卡片，快速看懂怎麼開始與注意事項。
   - 讀畢後滑至文末，看見「探索更多『生活』案例 →」與「關閉並返回結果」，能直覺按下一步或回到先前瀏覽進度。
2. **情境二：職場工作者在桌面上查閱長篇工程案例（UC-005）**
   - 讀者在 1440px 視口點開 42 段長篇案例。
   - 概覽區並列呈現「🚀 建議操作流程與注意事項 ↓」、「📋 前往方法與步驟 ↓」與「📖 查看完整原始研究、來源與提示詞（42 段） ↓」，層級分明。
   - 點擊「前往方法與步驟 ↓」，內容平滑捲動並避開 sticky toolbar 18px，焦點精確落於目標標題。
   - 點擊「查看 GitHub 原始 Markdown ↗」，於新分頁安全開啟原始檔案。
3. **情境三：GitHub Actions runner 面臨尖峰部署排隊與後續 commit 合併**
   - 當前 commit 觸發 CI，Pages 部署正在佇列中等待（既錄 11～14 分鐘）。
   - 若此時協作者合併了另一項 PR，工作流程在輪詢過程中經由 `isCurrentMainCommit` 自動偵測到自身 commit 已被超越，主動印出 `SKIP_PUBLISHED_ASSET_CHECK superseded main commit ...` 並以 exit code 0 正常退出，徹底消除了原本 15 分鐘超時噴出的假性紅燈。

---

## 6. 修改檔案清單

- `.github/workflows/card-refinement-qa.yml`：增加輪詢迴圈內即時 superseded check 與精確報警訊息。
- `.github/workflows/combined-recovery-qa.yml`：放寬至 301 次輪詢並增加即時 superseded check。
- `.github/workflows/reader-controls-qa.yml`：增加輪詢迴圈內即時 superseded check。
- `.github/workflows/recency-qa.yml`：修正逾時錯誤訊息為 15 分鐘並增加迴圈即時 superseded check。
- `.github/workflows/round-qa.yml`：增加輪詢迴圈內即時 superseded check。
- `assets/app.js`：更新詳情來源連結桌面與手機文案、補充憑據徽章 `role="note"` 與無障礙 label、優化底部返回按鈕。
- `assets/reader.css`：建立概覽捷徑視覺左框線與背景層級、優化底部按鈕觸控規格與極窄視口憑據卡換行。
- `tests/detail-mobile-navigation.test.cjs`：新增 5 項端到端自動化回歸測試。

---

## 7. 殘留風險與下一輪優先事項

- **未解決風險**：極少數非主要 workflow（如 preview-only 工作）若未來加入 Pages 驗證，需一併套用本輪確立的 15 分鐘輪詢與 superseded check 標準。
- **未能驗證項目**：真實 GitHub Pages 部署仍需待程式碼 push 至 GitHub 後由線上環境實際執行驗證。
- **下一輪最值得做的一件事**：檢視首頁搜尋空結果時，針對使用者輸入多個 AND 關鍵字（例如「旅遊 API」）提供逐詞拆解與一鍵刪除建議（如「只保留『旅遊』」），進一步降低搜尋中斷跳出率。
