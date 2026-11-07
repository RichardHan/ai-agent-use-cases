# 2026-11-07 首次訪客問題導向搜尋精準度、自然問句檢索與核心案例排序優化

基準 main `a8b0e87dcf3201c5b67dbef1bf33d65d91360210`（PR #244 合併後）。原工作樹存在未提交內容，本輪在隔離 worktree `/private/tmp/ai-agent-20261107-visitor-experience` 操作。
正式站：https://richardhan.github.io/ai-agent-use-cases/
GitHub Actions：https://github.com/RichardHan/ai-agent-use-cases/actions

## 問題證據與目標使用者

- **目標使用者**：第一次造訪本站、從自身真實痛點（如「收件匣整理」、「會議記錄」、「比價」、「客服」）出發尋找可用案例的新訪客，以及習慣輸入「我想整理會議」等自然語言的使用者。
- **問題證據（正式站實測對照）**：
  1. **首頁痛點捷徑首筆失真**：
     - 正式站點選首頁 7 大捷徑之一的「📥 收件匣」（`?q=收件匣#explore`）命中 156 筆，但收錄中專門處理客服收件匣、具備核准分診標準範例的 `UC-014`（標題「讓 AI 先整理客服信，退款與承諾由你決定」）僅排在第 20 名（手機需滑到首批 24 筆最底端），首筆反而是軟體序號備份的 `UC-080`。
     - 根因：`rankEntries` 原本僅比對 `item.title`（網站展示標題，UC-014 為「讓 AI 先整理客服信...」）而完全忽略 Markdown 正式標題 `item.originalTitle`（「客服收件匣巡檢與...」），且同義詞群（`email`、`郵件`、`信件`）與使用者輸入的精確詞給予相同權重，導致僅提及「備份 email」或「寄出信件」的案例反超收件匣核心案例。
  2. **自然語言問句檢索失效**：
     - 正式站輸入「我想整理會議」命中 0 筆（跳出空結果提示）、「整理會議」僅命中 1 筆無關補充；但搜尋「會議」有 25 筆、「會議 整理」有 19 筆。
     - 根因：`tokenize` 缺乏白話意圖前綴（「我想」、「如何」、「怎麼」、「幫我」等）去除與常見任務組合詞（「整理會議」、「會議整理」）的合理切分。
  3. **縮小範圍（`scope=overview`）遺漏 Markdown 標題命中**：
     - 「只看標題與用途命中」僅比對 `item.title + item.summary + item.coreGoal`，未比對 `item.originalTitle`，使原始 Markdown 標題命中但展示標題使用通俗改寫的案例在縮小範圍時被誤排除。

## 方案比較與決策

- **方案 A**：引進完整中文斷詞庫（如 jieba-js 或 Intl.Segmenter）並全面改寫搜尋評分模型，支援 TF-IDF 或 BM25 權重。
  - **價值**：能通用處理任意長句中文分詞。
  - **成本與取捨**：引入數百 KB 外部依賴，違反靜態站輕量化原則；可能改變既有所有關鍵字匹配行為，引發大規模回歸；斷詞不精確時可能拆散專有名詞。
- **方案 B（採用）**：
  1. 在 `tokenize` 中系統化支援自然語言前綴過濾（如 `/(?:我想|想要|想|幫我|請幫我|如何|怎麼|可不可以|能否)\s*(?:找|看|做|搞定|處理|了解|進行)?\s*/`）與高頻任務片語切分（如「整理會議」→「整理 會議」）。
  2. 在 `rankEntries` 中：
     - 將 `originalTitle` 納入標題比對（`norm((item.title || '') + ' ' + (item.originalTitle || ''))`）。
     - 區分精確搜尋詞（`exact query term`）與擴展同義詞（`synonyms`）之權重：在標題、摘要、核心目標或標籤中直接包含使用者所輸入字詞者給予優先權，避免泛化同義詞（如 `email`）喧賓奪主。
  3. 在 `filterEntries` 的 `scope === 'overview'` 中納入 `originalTitle`，維持標題命中一致性。
  - **價值**：零外部依賴、純前端相容、不改變既有有效召回集合（recall 不減），但精準提升排序相關度（precision 大幅提升），使 `UC-014` 在 `收件匣` 中精準躍居第 1 名，且「我想整理會議」直接召回 19 筆高質量會議案例。
  - **成本與取捨**：需謹慎微調排序權重階層，確保既有單元測試（400 項）與歷史排序合約全部通過。

## 修改前後實測數據對照

| 驗證項目 | 修改前正式站 | 修改後本地預覽 |
|---|---|---|
| `q=收件匣` 首筆案例 | `UC-080`（第 1 名） | `UC-014`（第 1 名） |
| `q=收件匣` UC-014 排名 | 第 20 名（手機需滑到首批末尾） | **第 1 名（首屏直達）** |
| `q=我想整理會議` 搜尋結果 | 0 筆（觸發空結果） | **19 筆（含 UC-277、UC-071 等核心會議案例）** |
| `q=整理會議` 搜尋結果 | 1 筆（非核心案例） | **19 筆** |
| `q=收件匣&scope=overview` UC-014 排名 | 第 20 名 | **第 1 名** |
| 跨尺寸水平溢出（1440/390/320px） | 未於正式站獨立測量 | **預覽實測 0px 零溢出** |
| Axe-core 無障礙自動掃描違規數 | 未於正式站獨立測量 | **預覽實測 0 違規（通過 28 項規則）** |

## 截圖清單

- `before-live-inbox-desktop.png`：修改前正式站「收件匣」搜尋，UC-014 落在第 20 名。
- `before-live-natural-meeting-desktop.png`：修改前正式站「我想整理會議」搜尋，0 筆空結果。
- `after-scenario1-inbox-desktop-1440.png`：修改後桌面 1440px「收件匣」搜尋，UC-014 躍居第 1 名。
- `after-scenario1-inbox-mobile-390.png`：修改後手機 390px「收件匣」搜尋，UC-014 於首屏首張卡片清楚呈現。
- `after-scenario1-inbox-mobile-320.png`：修改後窄手機 320px「收件匣」搜尋，排版正常無水平溢出。
- `after-scenario1-meeting-desktop-1440.png`：修改後桌面「我想整理會議」召回 19 筆。
- `after-scenario1-meeting-mobile-390.png`：修改後手機 390px「我想整理會議」召回 19 筆。
- `after-scenario2-empty-desktop-1440.png`：情境 2 組合極端條件觸發空狀態。
- `after-scenario2-recovered-desktop-1440.png`：情境 2 點擊清除條件後完整復原。
- `after-scenario3-detail-desktop-1440.png`：情境 3 直鏈開啟 UC-014 詳情、憑據解讀與來源按鈕。
- `after-scenario3-detail-mobile-390.png`：情境 3 手機版直鏈開啟 UC-014 詳情。

## 測試與驗收結果

1. **先紅後綠回歸測試**：
   - `tests/discovery-clarity-and-ci-resilience.test.cjs` 新增 2 項測試：
     - `canonical task shortcut 收件匣 prioritizes core inbox triage case UC-014 at rank 1`
     - `natural problem phrases like 我想整理會議 and 整理會議 return genuine meeting cases`
   - 修改前明確回報 2 項 FAIL；修改後全數 PASS。
2. **全套測試與建置**：
   - `node --test tests/*.test.cjs`：400 項全數通過、0 失敗。
   - `node --check assets/app.js` 通過。
   - `python3 scripts/preview.py /tmp/visitor-preview/ai-agent-use-cases` 成功產出 catalog.json 與 corpus.json。
3. **端到端瀏覽器驗收（`tests/visitor-acceptance-browser.cjs`）**：
   - 完成情境 1、情境 2、情境 3 之完整走查。
   - 1440px、390px、320px 零水平溢出。
   - 觸控目標高度維持 >= 44px。
   - Axe-core 自動無障礙掃描 0 違規。


## 獨立審查反饋與修正

- **反饋 1（想字開頭詞彙截斷風險）**：獨立審查指出原前綴正則包含裸 `想` 字，會把 `想法` 截成 `法`、`想像` 截成 `像`。已修正正則，限定必須為完整意圖結構（如 `我想`、`想要`、`幫我`、`如何` 等），並在單元測試新增 `想法` 與 `想像` 不被截斷的斷言。
- **反饋 2（會議任務動詞保留）**：原會議正則將 `會議 摘要` 強制改寫為 `整理 會議`，排除了不含 `整理` 的 UC-094。已修正為保留所補捉動詞（`$1 會議` / `會議 $1`），並在測試補齊 `會議 摘要` 保留動詞且命中 UC-094 的回歸驗證。
- **反饋 3（引號前綴標準化）**：中文引號（如 `「我想整理會議」`）原在去除前綴後才清理引號，導致引號阻擋前綴匹配。已在分詞前統一先行移除各類中文與英文引號，並於測試覆蓋 `「我想整理會議」` 正常召回 19 筆。
- **反饋 4（比較基準嚴謹性）**：審查指出比較表中正式站的水平溢出與 Axe 數據未在本次 baseline runner 獨立測量。已在對照表明確標記「未於正式站獨立測量」，避免把未實測數據當成比較基準。
## 本輪不處理範圍與已知限制

- 本輪未修改 499 篇 Markdown 案例原文內容。
- 本輪未引入後端或外部向量搜尋 API。
- 自然語言前綴過濾聚焦於常見高頻動詞與前綴，極罕見或生僻語法仍以既有關鍵字搜尋為準。

## 下一輪優先建議

- 針對 Actions 發布管線，評估在 PR #198 的基礎上為 `published-assets.cjs` 引入 deployment status 查詢，避免在 Pages 後台排隊時所有 runner 均陷入 1 小時傻等。
