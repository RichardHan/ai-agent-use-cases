# 2026-11-11 分享搜尋連結落地後，看不到自己搜了什麼、也改不了

## 基準

- 開發基準 `origin/main` `1c67d5d4`（PR #375「載入失敗首屏」紀錄）。隔離 worktree `/private/tmp/aiuc-20261111-r24`（分支 `improve/20261111-r24-visitor`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 三百餘個 commit，另有 159 個未追蹤檔（皆已在 origin/main）；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs` **733 通過／0 失敗**；`node --check assets/app.js` 通過。
- 正式站開工時 `catalog.json.sourceRevision` = `1c67d5d4…`、515 個來源檔、畫面 518 筆。開工期間平行的 PR #376（核對日同步）合併為 `af90eb74`、紀錄 `b004390a`；本輪 rebase 到 `b004390a` 後重跑受影響檢查。
- Actions 現況重新確認：main 最近 50 次 run **47 success／2 failure／1 cancelled**；2 次 failure 都是發布閘門誤判（`#372` 已修並合併），1 次取消是 Pages 部署被較新版本取代。沒有權限、額度或外部服務錯誤，本輪不動 CI 設定，只在新測試加一行呼叫。

## 問題證據

目標使用者是**點開別人分享的搜尋連結、抵達結果頁的人**（手機為主）。這一頁在抵達後不說自己在看什麼：

- 正式站 `1c67d5d4`（Chromium、Playwright）實測 `?q=旅遊#explore` 落地後，搜尋框完全在視窗外：390×844 為 **−437…−381px**、320×640 **−433…−377px**、1440×900 **−446…−382px**（本機 b004390a preview 同一狀態量到 −370／−366／−367 的欄位下緣）；畫面最上方是「顯示 36 / 518 筆收錄」與「複製搜尋連結 ↗」，**沒有任何一個字寫出「旅遊」**（`#match-scope` 只說「你搜的字或相關詞」）。
- 同頁唯一的指標式回頭路是每 6 張卡插入的「回到搜尋與篩選 ↑」：390×844 第一條在視窗座標 **4,112px**（要再往下捲 3,268px），1440×900 在 **1,669px**。`#edit-query`（修改關鍵字）只存在於空結果狀態，有結果時 `hidden`。
- 鍵盤讀者其實有路：按 `/` 會把焦點送回搜尋框並捲到畫面（實測 390×844 焦點落在 406–462px）；但 `kbd` 提示在 ≤640px 被 `display:none`（`assets/style.css:2`），手機讀者看不到這個捷徑，而且 `/` 只把游標放進欄位、不會選取原字（要自己清）。
- 結果列的既有操作（`複製搜尋連結`、`來源標籤怎麼看`、`排序說明`）都在解釋「這批結果怎麼來」，卻沒有任何一個能改變條件。

## 兩個方案

- **A（採用）在結果數旁加一顆會說出搜尋詞的按鈕。**
  - 做法：`.results-heading` 內新增 `.results-actions` 容器（`#copy-search-link` 移入），再加 `#refine-query`。可見條件收斂在 `syncResultsRefine()`：目錄載入完成、目前有結果、至少有一個條件（關鍵字或任一篩選），**而且搜尋框已捲出視窗**（`#query` 的下緣 ≤ 0）。最後一條是 PR 上量到的：整列一直顯示時，390×844 的 `#match-scope` 說明被推到 **865px**（原本 830px ≤ 844px），`match-scope-note` 的「說明與動作不必捲動就讀得到」因此變紅；搜尋框還在畫面上時，讀者本來就看得到關鍵字、也改得到，這一列沒有價值卻要付 35px。按鈕文字直接寫出搜尋詞（`修改「旅遊」`，超過 8 個 grapheme 以 `…` 截斷，不會切開組合 emoji），沒有關鍵字只有篩選時寫「修改關鍵字」並以 `aria-label` 補上篩選數量。點擊／Enter 走與空結果 `#edit-query` 共用的 `revealQueryField()`：聚焦、全選、捲到畫面中央。
  - 價值：抵達當下就看得到「這批結果來自哪些字」，一顆 44px 的按鈕就能回到輸入框改字，不必先捲 3,268px，也不必知道 `/`。桌機寬度不變（heading 52px），手機多一列操作（+35px），第一則案例標題仍在首屏。
  - 成本：`index.html` 1 個容器＋1 顆按鈕、`assets/style.css` 4 行、`assets/app.js` 1 個同步函式＋1 個共用處理器＋`render()` 1 行＋1 個被動 scroll／resize 監聽、1 支瀏覽器回歸、workflow 1 行。
  - 取捨：抵達狀態下手機 heading 由 44px 長到 79px，第一則標題由 402–468px 下移到 448–514px（320×640：418–481 → 465–528），仍在首屏；搜尋框在畫面內時完全不變（heading 44px）。代價是捲過界線時版面會有 35px 的位移（上升 35px 讓出空間，讀者正好要回到搜尋框）。
- **B 把操作塞進現有那一行（結果數＋複製連結之間）。**
  - 390px 實測：heading 只有 350px 內容寬，`顯示 36 / 518 筆收錄`（129px）＋`複製搜尋連結 ↗`（128px）＋12px 間距已佔 269px；任何第三個控制都會讓 flex 換行，heading 直接變成 100px（+56px，比 A 更貴），320px 更擠。不採用。
- **C 改抵達落點，讓搜尋框與結果同框。**
  - 390×844 要同時容納搜尋框（56px）、`#search-scope`（145px）、`#search-feedback`（105px）、結果數與第一則標題，實測需要 839px，320×640 根本不可能；而且會違反前幾輪建立的「抵達後第一則案例標題要完整可見」契約（`mobile-search`、`arrival-summary-visibility` 都以此為斷言）。不採用。
- **D 浮動按鈕（`position: fixed`）或讓搜尋框 sticky。**
  - 不佔版面高度，但會遮住卡片、與 `elementFromPoint` 命中的返回連結衝突（`results-return-browser` 有實際 hit-test），sticky 還得改 `scroll-padding-top` 而連帶推動所有抵達量測。本輪不做。

## 改動

- **`index.html`**：`.results-heading` 內新增 `<div class="results-actions">`，內含原有的 `#copy-search-link` 與新的 `#refine-query`（預設 `hidden`）。
- **`assets/style.css`**：`.results-actions`（`display:flex`、`gap:8px`、可換行）、`.refine-query`（44px、14px、透明底）。這一列的兩顆按鈕描邊統一在檔案末尾覆寫為 `#7f937b`（對紙底 3.09:1）：`.copy-search-link` 在 editorial 區塊被設成 `#c4cfc0`（1.5:1）、共用的 `#a8b9a2` 只有 1.94:1，都不到 1.4.11 的 3:1；只改這一列，其他控制項的既有色票不動。
- **`assets/app.js`**：`syncResultsRefine()` 同步可見度與文字，呼叫點是 `render()`、`finishArrival()`（下一幀）與被動 `scroll`／`resize`（rAF 節流）；狀態只由「有沒有條件」與「搜尋框是否在視窗外」決定，不重算結果。`revealQueryField()` 由 `#edit-query` 與 `#refine-query` 共用。
- **`tests/refine-from-results-browser.cjs`（新增）**：三種尺寸（1440×900／390×844／320×740）檢查 (1) 純首頁沒有這顆按鈕；(2) `?q=旅遊#explore` 落地後按鈕完整在首屏、≥44px、文字為 `修改「旅遊」`、第一則案例標題仍在首屏；(3) 按下後焦點回到 `#query`、原字被全選、欄位在畫面內、結果筆數不變；(4) 只有篩選（`?scenario=生活`）時仍可用，`aria-label` 說明 1 項篩選；(5) 20 字長查詢截斷成 `修改「長途旅程規劃與住…」` 且無水平溢出；(6) 空結果時收起，只留 `#edit-query`；(7) 搜尋框在畫面內時收起，且 `#match-scope` 說明仍在首屏；捲離搜尋框後出現、捲回來再收起；Tab 由結果數 → 複製連結 → 這顆按鈕，Enter 回到欄位；(8) axe（wcag2a/2aa/21aa）0、水平溢出 0、pageerror 0。
- **`tests/search-share-focus-browser.cjs`**：複製連結 pending 時的 Tab 斷言由「複製 → 來源說明」改為「複製 → 修改關鍵字 → 只看那 N 筆」（新增了一個既有行為上的停留點，不是放寬；macOS WebKit 不把按鈕放進 Tab 序的既有分支保留）。
- **`.github/workflows/website-qa.yml`**：在既有 `empty-word-recovery` 之後加一行 `REFINE_URL=… node tests/refine-from-results-browser.cjs`。
- **`tests/source-guide-browser.cjs`**：`Source guide QA` 在 PR 上紅了，根因是本輪把這一塊往下推 35px 後，Firefox 把 `#source-guide summary` 的 `min-height:44px` 算成 **43.9999847412109375**（同一份 CSS：偏移 174.2px 時剛好 44、219.3px 時 43.99998），原本的 `height>=44` 因此失敗。改成容許 0.1px 的次像素誤差，**並加測 `getComputedStyle(summary).minHeight === '44px'`**：真正的 43px 目標仍會紅，意圖反而更明確。兩個 preview 都重跑通過。

## 測試

- 先紅後綠（同一支新測試、兩個 preview 建置）：基準 `1c67d5d4` → **exit 1**，`desktop: the results header ships the refine entry`；本輪 → **exit 0**，三種尺寸全過。
- 本輪實測（Chromium 1.64.1／Playwright，本機 preview，`1c67d5d4` 語料）：

| 尺寸 | 按鈕位置 | heading 高度 | 第一則標題（前 → 後） | 按下去之後 |
| --- | --- | --- | --- | --- |
| 1440×900 | 14–58px | 52 → 52px | 335–379 → 335–379px | 欄位 430–494px、選取 2 字 |
| 390×844 | 60–104px | 44 → 79px | 402–468 → 448–514px | 欄位 406–462px、選取 2 字 |
| 320×740 | 60–104px | 44 → 79px | 418–481 → 465–528px | 欄位 354–410px、選取 2 字 |

- 邊界寬度（同一頁 `?q=旅遊#explore`）：360／414／640／641／760／768／1000px 皆無水平溢出；640–1000px 的 heading 仍是 44–52px（操作列與結果數同一行），只有 ≤~500px 才換行。20 字長查詢在 390px 仍是一行（heading 79px、第一則標題 632px），320px 會把兩顆按鈕疊成兩列（heading 131px），抵達守衛改把第一則標題放在 24px。
- 對比（Chromium `getComputedStyle` 實測）：按鈕文字 `#285344` 對紙底 `#f7f8f2` 8.16:1、描邊 `#7f937b` 3.09:1；焦點框沿用全域 `3px solid #799f27`。
- 單元：`node --test tests/*.test.cjs` **733 通過／0 失敗**；`node --check assets/app.js` 通過。
- 鄰近瀏覽器回歸（同一份 preview，全部 exit 0）：`discovery`（含 `mobile-search` 的 300px 預算、320×740 抵達）、`search-reveal-settle`、`arrival-summary-visibility`、`arrive`／`arrival`、`explore-visibility`、`results-return`（含 `firstResultFromSearch<300`）、`keyboard-search-entry`、`search-submit`、`search-share-focus`、`result-count-honesty`、`empty-word-recovery`、`scenario-reset-persistence`、`hero-load-failure`。
- 手動狀態走查（390×844）：載入中／純首頁／只有篩選／關鍵字＋篩選／清掉關鍵字只留篩選／詳情開啟與關閉／瀏覽器上一頁與下一頁，按鈕可見度與文字都與目前條件一致，返回後仍是 `修改「旅遊」`。

## 截圖

同一頁、同一尺寸、同一狀態（`?q=旅遊#explore` 落地後、未操作），改動前後對照：

- 390×844：[前](before-390.png)／[後](after-390.png)
- 320×640：[前](before-320.png)／[後](after-320.png)
- 1440×900：[前](before-1440.png)／[後](after-1440.png)

（本機無法讀取影像內容，幾何、axe 與鍵盤結論不依賴截圖；截圖供人工目視。）

## 獨立審查

由另一個 agent（fresh context、只讀，未參與實作）依需求、最終 diff 與證據檢查。結論 **block**，兩項發現，都已處理：

| 項目 | 審查結果 |
| --- | --- |
| 新測試是否進 patch | 審查看 `git diff` 時 `tests/refine-from-results-browser.cjs` 仍是未追蹤檔，因此判為 blocker「CI checkout 會找不到檔案」。屬追蹤狀態問題，不是程式缺陷；本輪 commit 內已包含該檔（`git show --stat` 可核對）。 |
| 非文字對比 | 新按鈕原本沿用 `.copy-search-link` 的 `#a8b9a2` 描邊，在紙底只有 **1.94:1**，低於 1.4.11 的 3:1。已把這一列的兩顆按鈕改成 `#7f937b`（**3.09:1**），共用色票不動；文字 `#285344` 為 8.16:1。 |
| 可見度判斷與 render／focus／history 整合 | 載入中、空結果、無條件時都收起；部分載入仍在 `#partial-load` 說明；`render()` 於每次導覽重算；抵達守衛遇到讀者操作即停止；詳情開啟時背景 inert。沒有找到功能缺陷。 |
| 審查未能驗證 | 審查未實際執行瀏覽器套件與 axe（只讀靜態檢查）；360／414／768px、emoji 截斷、部分載入／找不到分享案例／詳情狀態、WebKit 焦點行為由本輪自行量測補上（見上表與「測試」）。 |

## 已知限制

- 抵達狀態下（搜尋框在視窗外）手機 heading 多一列操作，首屏少 35px 給案例；第一則標題仍完整可見（390×844 至 514px、320×740 至 528px）。捲過臨界點時版面有 35px 的即時位移。
- 320×740 的 `#match-scope` 說明本來就在首屏外（`match-scope-note` 既有紀錄），本輪沒有處理。
- 只有篩選、沒有關鍵字時按鈕寫「修改關鍵字」，實際上會把焦點送到空的搜尋框；篩選數量只放在 `aria-label`，畫面上看不到。
- 長查詢截斷在 10 個字（以 code point 計，emoji 不會被切一半），畫面上看不到完整搜尋詞；完整字詞仍在搜尋框與瀏覽器標題。
- `/` 仍只把游標放進欄位、不會選取原字；本輪沒有改這個行為。
- 桌機抵達時搜尋框同樣在視窗外（−446px），按鈕在那裡也有用，但沒有另外驗證桌機滑鼠長距離移動的手感。
- 只量測 Chromium；Firefox／WebKit 由 PR 上既有流程覆蓋，本支新測試只宣告 Chromium。macOS 上的 WebKit 不把按鈕放進 Tab 序（與基準相同），所以 `search-share-focus` 在本機 WebKit 走既有平台分支；CI 的 Linux WebKit 會走按鈕序列。
- 本機無法讀取截圖影像（`Image reading is disabled`），視覺結論來自 DOM 幾何、水平溢出與 axe。

## 發布

- PR [#378](https://github.com/RichardHan/ai-agent-use-cases/pull/378)（head `494c7f81`，rebase 到 `b004390a`）18 項檢查 **全部 success**（1 項 `published` 依設計 skipping），含本輪新增的 `REFINE_URL=… node tests/refine-from-results-browser.cjs`（Website QA [42962586837](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42962586837)）。squash 合併為 **`1a3cc2f0`**。
- `pages build and deployment` [42963942720](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42963942720) **success**；正式站 `catalog.json` 的 `sourceRevision` = `1a3cc2f0…`、515 個來源檔、畫面 518 筆；線上 `index.html` 含 `id="refine-query"`、`assets/app.js` 含 `syncResultsRefine`（直接抓檔核對）。
- 正式站重走（Chromium，`?q=旅遊#explore`）：1440×900 按鈕 14–58px、第一則標題 335–379px（與改動前相同）；390×844 按鈕 59–103px、標題 447–513px；320×640 按鈕 59–103px、標題 464–527px。按下後焦點在 `#query`、原字全選、欄位分別落在 430–494／406–462／304–360px；`顯示 36 / 518 筆收錄` 不變；axe 0、水平溢出 0、pageerror 0。
- 正式站其他狀態：純首頁收起（heading 44／52px）；`安全防護` 搜尋框在畫面內時收起、`#match-scope` 下緣 830px ≤ 844px，捲離後出現 `修改「安全防護」`；空結果只留 `#edit-query` 且能把焦點送回欄位；`?case=UC-001` 詳情開啟、來源連結固定在 `1a3cc2f0`、關閉後回到清單且按鈕仍在。
- main 的 `Website QA`（`1a3cc2f0`，[42963943350](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42963943350)）**success**：合併後重跑同一份 35 支 walk，並依序通過 `Wait for published assets and content`、`Verify the published GitHub Pages site`（`Fail when the published site cannot be verified` 依設計 skipped，因為上一步已 verified）。

## 下一輪

**分享到「沒有結果」的連結落地後，復原按鈕在手機首屏外**。正式站實測 `?q=每月報表要花半天#explore`（Chromium 390×844）：`#empty` 在 106–989px，標題 193–259px、提示 271–317px，接著 `#empty-suggestions` 佔 339–836px，真正的兩個出口 `#edit-query`（修改關鍵字）與 `#empty-reset`（清除全部條件）在 **858–958px**，整個在首屏之外；搜尋框同時在 −437px。320×640 與複合空結果（`?q=旅遊&kind=evidence…`）的 `#empty` 起點是 106px、出口在 450–550px，仍在首屏內，所以這是「建議很多」時才出現的缺陷。

先做的驗證：把 `.empty-actions` 移到 `#empty-suggestions` 之前（或把 477px 的說明與圖例收進 `<details>`），量測 390×844 是否讓「修改關鍵字」進入首屏、`#empty-hint` 的「下方建議」措辭是否要一起改，並確認 `card-targets`、`combined-recovery`、`results-return`、`page-context` 這些點 `#edit-query` 的流程不受 DOM 順序影響。
