# 2026-11-09 查詢重讀後，同一組條件必須說同一組數字；發布驗證不得靜默略過

基準 `origin/main` `374f7256`（正式站同版；正式站 `catalog.sourceRevision` 亦為 `374f7256`）。主工作樹 `improve/visitor-source-orientation-20261027` 落後 main 205 個 commit，另有 159 個等於 main 內容的未追蹤檔（與 main 逐 byte 相同，屬舊 checkout 殘留，未觸碰）；本輪全程在隔離 worktree `/private/tmp/ai-agent-20261109-round` 進行。

## 問題與證據（正式站實走，Playwright Chromium 1440×900／390×844／320×740）

自然問句與複合詞在嚴格比對零結果時，頁面會用「站上既有詞彙」重讀（`sentenceQueryFallback`／`compoundQuerySplit`）。重讀只套用在結果清單，其他三個位置仍用**未重讀的原句**計算，於是同一畫面互相矛盾：

| 狀態 | 正式站修正前（實測 DOM） |
| --- | --- |
| `?q=我想要找一個可以幫我整理照片的工具` | 結果 79 筆；情境篩選「全部情境 **0** · 生活 0 · 工作 0」；抽卡面板「這組條件目前沒有可抽的案例卡」 |
| `?q=客戶抱怨` | 結果 4 筆；情境篩選全部為 **0**；抽卡面板同樣宣稱沒有案例卡 |
| `?kind=pending` | 篩選顯示 **3 · 還在查證**，同一頁統計卡寫 **2 個待查想法**（其中 1 筆是「已併入 UC-028、不另計數」） |
| `?q=UC-256` | 卡片「頁首未提供核對日」，但 `cases/256-…md` 頁首寫「日期：…查證2026-10-16 UTC」 |

根因（`assets/app.js`）：`render()` 以 `matches`（原句）餵 `syncDiscovery()` 與 `renderFacetCounts()`，只有 `currentFiltered` 使用重讀後的 `searchTerms`；`reviewDate()` 只接受「查證日期／查閱日期…」等固定鍵，不認舊版頁首的 `- 日期：…查證 2026-10-16`；`facetCounts()` 以待查狀態計數，統計卡則排除已併入線索，兩者沒有互相揭露。

受影響讀者：照首頁文案「從一件你想做的事開始」輸入整句的新訪客——他同時被告知「79 筆結果」、「沒有可抽的案例卡」與「每個情境 0 筆」，會直接懷疑整個案例庫的規模與篩選是否可信。

## 方案取捨

- 方案 A（採用）：把**同一組已顯示條件**（`searchTerms`／`shownMatches`）傳給抽卡與 facet 計數；抽卡為空時說明原因（符合的 N 筆都不是可抽卡的類型）；待查選項標示「含 N 筆已併入，統計不計」；`reviewDate()` 接受帶查證動詞的 `- 日期：` 行。價值：畫面各處對同一組條件給出同一個答案，且仍以既有字面語意為準，不改搜尋演算法。成本：3 處呼叫與 1 個日期解析；風險集中在計數字串與 `sort=reviewed` 排序。
- 方案 B：只加說明文字（例如在 facet 上方註明「筆數不含重讀結果」）。成本最低，但讓兩個數字在同畫面繼續不一致，讀者仍需自行換算，等於把矛盾留給使用者。
- 方案 C（未採用）：收斂 `SYNONYM_GROUPS` 的寬廣詞組（例如 `程式碼`→447/509）。會同時改變數十組一般關鍵字查詢，回歸面太大；SITE.md 前輪已列為需逐筆確認的後續工作。

發布驗證另有一個獨立缺陷（本輪一併修，因為它決定本輪能否宣稱「正式站已驗證」）：

- 正式站 `Website QA` 主分支推送 run `42480522359`（`486d3d0`）：第 14 步「Wait for published assets and content」耗時 **0 秒**、第 15 步「Verify the published GitHub Pages site」**skipped**、job 仍為 **success**。原因是每次功能合併後幾分鐘內都會有一個 docs commit 推進 main tip，`waitForPublishedVersion()` 以 `git ls-remote` 判斷「已被取代」就直接 exit 0，`verified` 永遠不是 `true`。同型紀錄見 `SITE.md`（run `42464127590`）與 run `42475073262`。3/3 抽查的主分支推送都沒有真的比對正式站。
- 方案 A（採用）：superseded 不再等於跳過。要求「正式站建置版本必須是本次推送的後代（`git merge-base --is-ancestor`）」且「本次推送改動的可發布檔案在正式站逐 byte 相同」才算 `verified=true`；任何一項不成立就依 60 分鐘共用視窗重試，逾時紅燈。另加一道 `Fail when the published site cannot be verified` 步驟，`verified != 'true'` 一律失敗。
- 方案 B：保留跳過，但把 skip 寫進 job summary。成本最低，但「綠燈」繼續代表「沒有驗證」，與本庫對讀者的證據承諾相反。

同一輪移除兩個已證實的 CI 噪音來源：`source-guide-qa.yml` 的 `fix/**` push 觸發（同一 commit 已被 `pull_request` 覆蓋，SITE.md 已記錄同 commit 兩次 run）；`load-recovery-qa.yml` 在 PR 上走查正式站的步驟（PR 不控制正式站，樣本期間 7 次 run 有 2 次因此失敗），改為僅 `workflow_dispatch` 可手動執行。

## 驗收

新增 `tests/search-expansion-consistency-browser.cjs`（Chromium 1440／390／320，含 axe WCAG 2.1 AA）：重讀狀態下「全部情境」計數必須等於顯示結果數、至少一個情境計數非 0、抽卡面板不得在結果非空時宣稱沒有案例卡、待查選項必須揭露已併入筆數、UC-256 必須顯示 `頁首核對 2026-10-16`、無水平溢出、無 page error。以同一腳本對修正前後建置實跑：

| 檢查 | 修正前（正式站同版） | 修正後 |
| --- | --- | --- |
| 整句查詢情境計數／結果 | 0 ／ 79 | **79 ／ 79**（生活 18・工作 18） |
| 整句查詢抽卡 | 「沒有可抽的案例卡」 | 78 張可抽，顯示第 1 張 |
| `客戶抱怨` 情境計數 | 0 ／ 4 | **4 ／ 4**（工作 3） |
| `kind=pending` 選項 | `3 · 還在查證` | `3 · 還在查證（含 1 筆已併入，統計不計）`，統計卡仍為 2 |
| UC-256 核對日 | 頁首未提供核對日 | **頁首核對 2026-10-16** |
| 新回歸腳本 | 紅燈（`0 !== 79`） | `SEARCH_EXPANSION_CONSISTENCY_OK` |

- `node --test tests/*.test.cjs`：**494 pass / 0 fail**（基準 482；新增／改寫：已併入與日期行規則、變更清單白名單與 rename、未知 base 回報 unknown、後代證明、superseded 逐 byte 驗證、缺 sourceRevision 不得通過、無改動時需內容一致、每個 runtime asset 都要比對、PR 不得走查正式站、重複觸發移除）。
- `node --check assets/app.js` pass。以本機 gzip 靜態伺服器（與 Pages 相同 gzip）重跑 canonical 瀏覽器腳本：`discovery-browser`、`compound-split-browser`、`sentence-fallback-browser`、`visitor-problem-browser`、`mobile-problem-tags-browser`、`results-batching-browser`、`search-submit-history-browser` 全數 PASS。
- 發布閘門本機端到端（真實程式碼路徑，非只讀原始碼）：以 `python3 scripts/preview.py` 產出的建置當 `BUILT_SITE`，用自訂 `fetchAsset` 供應同一份位元組（`INDEX.html` 在大小寫不敏感的本機磁碟上無法與 `index.html` 並存，故由記憶體供應）。三種結果：
  - exact（正式站 `sourceRevision` = 本次推送）：`{"status":"matched","mode":"exact","sourceCount":507}`。
  - superseded（以真實後代 commit `f4a7ae92` 模擬 docs commit 推進 main，`assets/app.js` 逐 byte 相同、`git merge-base --is-ancestor` 透過真實 `git fetch` 驗證）：`{"status":"matched","mode":"superseded","supersededBy":"f4a7ae92…","changedVerified":1}`。
  - 反向對照（正式站該案例位元組被改一個字）：閘門拒絕通過並持續重試，逾時才紅燈——不會再有「綠燈但沒驗證」。
  - 註：後代證明不可用 `git fetch --depth=1`（會把後代切成 shallow 邊界，真實祖先會被誤判為不相關）；已改為完整 `git fetch`，並更正先前模擬造成的本機 shallow 狀態。

## 截圖（修正前後同頁面、同尺寸、同資料狀態；webp）

| 狀態 | 桌面 1440×900 | 手機 390×844 |
| --- | --- | --- |
| 整句重讀・抽卡面板 | [前](before-desktop-sentence-draw.webp)／[後](after-desktop-sentence-draw.webp) | [前](before-mobile-sentence-draw.webp)／[後](after-mobile-sentence-draw.webp) |
| 整句重讀・結果與篩選 | [前](before-desktop-sentence-results.webp)／[後](after-desktop-sentence-results.webp) | [前](before-mobile-sentence-results.webp)／[後](after-mobile-sentence-results.webp) |
| 複合詞 `客戶抱怨` | [前](before-desktop-compound-results.webp)／[後](after-desktop-compound-results.webp) | [前](before-mobile-compound-results.webp)／[後](after-mobile-compound-results.webp) |
| `kind=pending` | [前](before-desktop-pending-results.webp)／[後](after-desktop-pending-results.webp) | [前](before-mobile-pending-results.webp)／[後](after-mobile-pending-results.webp) |
| UC-256 核對日 | [前](before-desktop-review-date-results.webp)／[後](after-desktop-review-date-results.webp) | [前](before-mobile-review-date-results.webp)／[後](after-mobile-review-date-results.webp) |

（另有 `*-draw.webp` 為各狀態的抽卡面板。）

## 獨立審查與修正

未參與實作的 reviewer 依需求、最終 diff 與自行重跑審查，指出兩項 BLOCKER、四項 CONCERN、一項 NIT，全部已修正並補上釘住測試：

1. **BLOCKER：未知的 push base 被當成「沒有改動」**。`github.event.before` 空值／全零時變更清單為空，superseded 仍可能通過。改為 `publicationChangeList()` 回傳 `{known, entries}`；`known:false` 時 superseded 一律拒絕（`Cannot verify a newer published build without knowing what this push changed`）。
2. **BLOCKER：閘門只比對 5 個固定資產**。`assets/copy.json`、`assets/discovery.js`、`assets/audit.js` 會被頁面載入卻不在比對範圍。改為從建置目錄列舉 `assets/*.{js,css,json}`，新增資產自動納入；`PUBLISHABLE_FILE` 同步接受 `assets/*.json`。
3. **CONCERN：rename 只驗新路徑**。`parseNameStatus()` 現在把 rename／copy 拆成「舊路徑刪除 + 新路徑」兩筆，舊路徑必須從正式站消失。
4. **CONCERN：日期行只看整行有無查證動詞**。`- 日期：2026-10-16（發布日）；查證日期未取得` 會被誤認為核對日。改為以 `；;。` 切分子句，只取同時含動作與日期的子句。
5. **CONCERN：已併入標註用全域計數**。`?q=P-002&kind=pending` 只命中已併入線索時沒有標註。改為以同一組篩選後的集合計算已併入筆數，並在新瀏覽器回歸中釘住。
6. **CONCERN：`tests/recent-review-browser.cjs` 仍期待 UC-239 無核對日**。已更新為 `頁首核對 2026-10-16`，並在分支預覽重跑通過。
7. **NIT：QA 文件寫錯已併入目標**。P-002 併入 UC-028（非 UC-156），已更正。

## 已知限制

- 視覺證據以同條件 DOM 文字與數值比對為準；本環境無法讀取圖片像素（工具停用影像讀取），截圖僅供人工核對。
- 未做真人使用者研究；以上為工程與瀏覽器量測。
- `reviewedDate` 修正後有 10 筆案例（005、025、239、256、257、258、259、260、261、278）在 `?sort=reviewed` 的排序位置改變，屬預期；卡片與詳情改為顯示頁首實際記載的查證日。
- 重讀後的情境計數仍以「字面比對」為準，不代表語意相關；`程式碼` 等寬廣同義詞組（447/509）本輪未處理。
- 其他 11 個 published 瀏覽器腳本仍保留 `skipIfSupersededPublishedUrl` 逃生門（`card-refinement`、`corpus`、`load-recovery-live`、`reader*`、`reading-flow`、`related`、`return-visibility`、`search-context-live`、`transient-loading-published`、`trust-published`），只有 canonical 閘門與 `deployed-browser` 本輪改為 fail-closed。
- superseded 路徑的本機模擬需要真實後代 commit；若正式站建置落後於本次推送（部署尚未完成），閘門會依共用 60 分鐘視窗等待，逾時才紅燈。
