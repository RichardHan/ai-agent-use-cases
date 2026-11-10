# 2026-11-10 任務入口與分享搜尋連結抵達後，第一則案例要出現在同一個畫面

## 問題與讀者

正式站 `fc4bc40e`（`catalog.json.sourceRevision` 相同、512 個來源檔、畫面 `515` 筆）的搜尋區有兩種抵達方式：

- **明確提交**：在搜尋框輸入後按 Enter 或「查看結果」。`submitSearch()` → `focusResults()` 把結果摘要 `#results-count` 捲到視窗頂端並聚焦，第一張卡在 300px 左右，讀者看得到案例。
- **抵達**：首頁任務目錄的 53 個入口（`href="?q=…#explore"`）與分享的搜尋連結。`finishArrival()` → `revealSearch()` 捲到 `#explore` 頂端，接著只有一條補救規則：**結果摘要 `#results-count` 不在視窗內時**才把摘要捲進畫面。

問題出在第二條規則的判準。11 月之後在搜尋框與結果之間新增了兩個區塊——「命中範圍」`select`（145px，含「各範圍如何搜尋？」）與「目前條件」列（只剩關鍵字時 105px、帶篩選時 151–203px）——結果摘要可以在視窗內，而**第一則案例完全在首屏之外**。摘要看得到，所以補救規則不觸發。

實測（Chromium、`reducedMotion: reduce`、每個尺寸獨立 context、載入完成後量測；正式站 `fc4bc40e`）：

| 視窗 | 抵達方式 | 焦點 | 結果摘要 y | 第一張卡 y | 第一則標題 y | 標題完整可見 |
| --- | --- | --- | ---: | ---: | --- | --- |
| 1440×900 | 任務入口「發票對帳」 | `search-title` | 628 | 839 | 939–1005 | ✗ |
| 1440×900 | 分享搜尋（旅遊＋Grok Bot＋工作） | `search-title` | 651 | 862 | 963–1007 | ✗ |
| 390×844 | 任務入口「發票對帳」 | `search-title` | 638 | 916 | 1015–1081 | ✗ |
| 390×844 | 分享搜尋 | `search-title` | 736 | 1034 | 1135–1201 | ✗ |
| 320×740 | 任務入口「發票對帳」 | `search-title` | 634 | 932 | 1029–1092 | ✗ |
| 320×740 | 分享搜尋 | `results-count` | 370 | 668 | 765–828 | ✗（舊規則已捲動，但仍不夠） |

也就是說：讀者按下站上最主要的探索入口後，畫面顯示「顯示 44 / 515 筆收錄」、命中範圍說明與排序說明，**一張案例都沒有**。手機 390px 連卡片邊緣都看不到；320px 的分享連結雖然被舊規則捲了一次，標題仍被切掉。

目標讀者：第一次到站、從任務目錄或朋友分享的搜尋連結進來，心裡已經有一個問題的人。他要的是答案，不是再一次看到搜尋框。

既有 QA 紀錄 `docs/qa/2026-11-09-explore-visibility/` 已經立下原則「輸入問題後，第一張卡要留在同一畫面」，但當時處理的是 787px 的篩選面板（`compactFiltersForResults`）；後來才加入的「命中範圍」「目前條件」兩個區塊沒有被同一條原則涵蓋。

## 兩個方案

- **A（不採用）把搜尋框與結果之間的區塊搬走或收合。** 量測後可行但成本高：命中範圍 145px 可移入既有「篩選、排序與常用搜尋」面板；目前條件列在 320px 帶篩選時是 203px，其中「關鍵字：發票×」是恢復探索唯一的一鍵移除入口，不能搬。兩者都搬也只能把 320px 的第一張卡推到 y≈715，仍看不到標題，還得再壓縮「來源標籤怎麼看」與「排序說明」這兩段對閱讀有用的說明。等於用內容換空間。
- **B（採用）讓「抵達」與「明確提交」用同一個判準。** 站上已經有正確的行為（`focusResults()`：把結果摘要捲到頂端），只是抵達路徑的判準問錯了問題——問「摘要看得到嗎」，而不是「讀得到案例嗎」。把判準換成**第一則可讀的那一行**（案例標題；沒有結果時是空狀態標題 **加上**「接下來可以怎麼做」那一行），需要時用與提交相同的 `block:'start'` 放置結果摘要。價值是入口與提交不再給兩套承諾；成本是 `assets/app.js` 一個函式與一個判斷式；風險集中在既有抵達測試的焦點契約，因此先把契約改成「標題可讀」，再更新測試。

沒有改網站文案、沒有移除任何控制項、沒有改版面、沒有動搜尋語意或排序。

## 改動

- `assets/app.js`
  - 新增 `arrivalLines()`／`firstResultInView()`：第一則案例的 `h3`（沒有 `h3` 時退回卡片本身）；沒有結果時是 `#empty h3` 與 `#empty-hint`，兩者都必須完整落在視窗內。
  - `finishArrival()`：抵達且帶查詢參數時，條件由 `count.top<0 || count.bottom>innerHeight` 改為再加上 `|| !firstResultInView()`，成立時呼叫 `placeArrivalResults()`。
  - `placeArrivalResults()`：先把結果摘要以 `block:'start'` 放到頂端並聚焦（與 `focusResults()` 相同位置）；若此時第一則可讀的那一行仍不完整（例如 390×400 的橫向手機），改把那一行放到頂端，並把焦點移到第一則的閱讀按鈕（`#results .card h3 button`，空結果時為 `#edit-query`），確保焦點永遠在可見處。
- `tests/search-arrival-space.test.cjs`：fixture 補上 `document.querySelector`、`#empty-hint` 與可捲動的幾何（每次捲動會位移 rect，讓後續可見性判斷看到瀏覽器會看到的值），新增 6 項回歸：只有摘要放得下時要捲、案例已可讀時不動、空狀態標題可見但說明在首屏外時要捲、空狀態已可讀時不動、隱藏的 `#empty`（rect 0,0）不得算成可讀、視窗太矮放不下摘要與案例時以案例為準並把焦點移到可見的閱讀按鈕。對基準 `fc4bc40e`／`3a9ae6d5` 的 `assets/app.js` 實跑：**6 項中 5 項紅**、「案例已可讀時不動」在舊程式也是通過（舊程式在那個狀態本來就不捲動），這點照實記錄。
- `tests/mobile-search-browser.cjs`：每個尺寸多一項抵達驗收——`?q=發票#explore` 載入後，第一則標題與結果摘要都必須完整在視窗內。在正式站資產上 **紅**（`A searched arrival must show the first case title: title 940..1006`），本輪預覽三尺寸綠。
- `tests/arrival-browser.cjs`、`tests/arrival-live.cjs`、`tests/corpus-bundle-browser.cjs`：抵達契約由「焦點一定是 `search-title`」改為「焦點是 `search-title` 或 `results-count`；若是 `search-title`，查詢框仍在畫面上半；**兩種情況第一則標題都要可讀**」。沒有放寬成「摘要可見即可」。
- `README.md`：補一句抵達行為（任務入口與分享搜尋連結會停在結果摘要與第一則案例）。

## 驗收

**單元測試**：基準 `fc4bc40e` `node --test tests/*.test.cjs` **652 通過**；rebase 到 `3a9ae6d5`（含 #331／#332）後主分支 **663 通過**；本輪 **669 通過、0 失敗**（+6）。`node --check` 全部 JS 通過。

**實際瀏覽器（Chromium，本機 Pages 相容預覽 `scripts/preview.py` + `http.server`，`/ai-agent-use-cases/` 路徑）**

| 流程 | 結果 |
| --- | --- |
| `tests/discovery-browser.cjs`（含 mobile-search 三尺寸、空結果復原、直鏈、返回、剪貼簿失敗、載入失敗復原） | PASS；mobile-search `firstResultFromSearch` 291／252／248 不變，axe 0 |
| `tests/arrival-browser.cjs`（1440×1000／390×844／320×740：收到搜尋、分享、返回焦點、篩選抵達、直接案例鏈） | PASS 三尺寸 |
| `tests/arrival-live.cjs`（preview 模式，chromium） | PASS；4 次語料載入、515 筆、28 筆命中 |
| `tests/search-scope-browser.cjs`（1440／390／320） | PASS（見下方基準失敗） |
| `result-count-honesty`、`match-scope-note`、`task-coverage-marker`、`results-batching`、`search-submit-history`、`search-reveal-settle`、`visitor-problem`、`mobile-problem-tags`、`compound-split`、`sentence-fallback`、`search-expansion-consistency`、`short-sentence`、`substring-recovery` | 全部 PASS |
| axe（WCAG 2 A/AA、2.1 AA） | 上述流程 0 violations |
| 水平溢出、`pageerror` | 0 |

**前後量測（同一腳本、同一狀態、每個尺寸獨立 context；before＝正式站 `fc4bc40e`，after＝本輪預覽）**

| 視窗 | 抵達 | before：焦點／摘要 y／第一張卡 y／標題 | after：焦點／摘要 y／第一張卡 y／標題 |
| --- | --- | --- | --- |
| 1440×900 | 任務入口 | search-title／628／839／939–1005 ✗ | results-count／24／234／335–401 ✓ |
| 390×844 | 任務入口 | search-title／638／916／1015–1081 ✗ | results-count／24／302／401–467 ✓ |
| 320×740 | 任務入口 | search-title／634／932／1029–1092 ✗ | results-count／24／322／419–482 ✓ |
| 390×844 | 分享搜尋 | search-title／736／1034／1135–1201 ✗ | results-count／24／322／422–488 ✓ |
| 320×740 | 分享搜尋 | results-count／370／668／765–828 ✗ | results-count／24／322／419–482 ✓ |
| 390×844 | 空結果 | search-title；標題 807–840、說明 852–898（說明在首屏外） | results-count／24；標題 193–226、說明 238–284 ✓ |
| 320×740 | 空結果 | search-title；標題 803–869、說明 881–927 ✗ | results-count／24；標題 193–259、說明 271–317 ✓ |
| 1440×900 | 空結果 | search-title；標題 798–831、說明 843–866 ✓ | 不變（原本就讀得到，不動） |

**三種流程實走（390×844，Chromium，本輪預覽）**

| 情境 | 操作 | 結果 |
| --- | --- | --- |
| 不知道工具名稱的新訪客 | 首頁任務目錄點「會議整理」 | `?q=會議`、顯示 27／515 筆、焦點 `results-count`、第一則 UC-094「自己不能到的會議，讓 Bot 進去先說明身分再記筆記」標題在首屏 |
| 組合搜尋與篩選後空結果 | `?q=發票&scenario=生活&difficulty=進階開發` | 空狀態標題與「接下來怎麼做」在 238–284；點「移除實作門檻「進階開發」→ 查看 10 筆」後 10 筆、關鍵字與情境 chip 保留、第一則標題 401–467 |
| 分享詳情連結 | `?q=發票&case=UC-005#explore` | 詳情開啟、焦點 `detail-title`、來源固定於目前版本且 `rel="noopener noreferrer"`；Escape 後回到 `?q=發票`、焦點 `results-count`、第一則標題 400–466 |

沒有變更的路徑（實測）：首頁一般載入（`scrollY` 0）、`#explore` 單獨抵達、`?case=` 詳情直鏈（焦點 `detail-title`）、無查詢的篩選連結在 1440／390（第一則標題原本就可讀）。320px 的 `?kind=pending` 原本標題 695–758 被切掉，本輪改為 200–263。

截圖（同一頁、同一尺寸、同一狀態；此環境**無法讀取影像**，視覺結論一律來自 DOM、`getBoundingClientRect` 與 axe，截圖只供人眼核對）：

| 狀態 | 尺寸 | before（正式站） | after（本輪預覽） |
| --- | --- | --- | --- |
| 任務入口 `?q=發票#explore` | 1440×900 | `before-1440-task-entry.png` | `after-1440-task-entry.png` |
| 同上 | 390×844 | `before-390-task-entry.png` | `after-390-task-entry.png` |
| 同上 | 320×740 | `before-320-task-entry.png` | `after-320-task-entry.png` |
| 分享搜尋 `?q=旅遊&tool=Grok Bot&scenario=工作#explore` | 1440×900 | `before-1440-shared-search.png` | `after-1440-shared-search.png` |
| 同上 | 390×844 | `before-390-shared-search.png` | `after-390-shared-search.png` |
| 同上 | 320×740 | `before-320-shared-search.png` | `after-320-shared-search.png` |
| 空結果 `?q=xyz987#explore` | 390×844 | `before-390-empty.png` | `after-390-empty.png` |
| 空結果 | 320×740 | `before-320-empty.png` | `after-320-empty.png` |
| 空結果 | 1440×900 | `before-1440-empty.png` | `after-1440-empty.png` |

## 附帶修復的基準失敗（與本輪改動無關）

`tests/search-scope-browser.cjs` 在基準預覽與正式站資產上都會失敗：`full text retains incidental author hit`，`0 !== 1`。原因是它把 UC-076 當成「只在正文提到 `旅遊`」的錨點，但該案例已被改寫，現在全文與主題範圍都不含 `旅遊`（實測 `旅遊` 全文 35 筆、主題 15 筆，UC-076 不在其中）。同一支測試在本輪修改前後、對 `main` 預覽與本輪預覽都以同一行失敗，所以不是本輪造成的。

修法是換錨點而不是放寬斷言：UC-004「出差前，找出當地值得聯絡的人」目前只在正文提到 `旅遊`（全文命中、主題不命中、排序第 15，落在首批 24 張內），所以三處 `UC-076` 改成 `UC-004` 並在註解記錄量測日期與數字。修改後 1440／390／320 全數通過。

## 已知限制

- 本環境**無法讀取截圖影像**（`Image reading is disabled`），視覺結論來自 DOM 文字、`getBoundingClientRect`、computed style 與 axe；截圖只供人眼核對。
- 本機只跑 Chromium。Firefox／WebKit 的讀者流程（`reader-browser.cjs`）與 `corpus-bundle-browser.cjs` 的 `publicRun` 分支要由 PR 上的 Actions 判定；本紀錄不宣稱那兩者已通過。
- 抵達時查詢框會被捲到視窗上方之外（與「明確提交」現在的行為相同）。本輪沒有加黏性搜尋列；讀者要改關鍵字要往上捲。這是刻意的一致化，不是新缺口，但如果之後要做黏性搜尋列，應先量測它對首屏的擠壓。
- 空狀態的判準是「標題＋下一行說明」都要可讀；更下方的恢復捷徑（`#empty-suggestions`）不在判準內，390px 實測第一顆在 y=401、320px 在 y=435，仍在首屏內，但沒有做成契約。
- 焦點會從 `search-title` 移到 `results-count`（`tabindex="-1"`、`role="status"`），與提交路徑相同；實測 390×844 按一次 Tab 會落到「複製搜尋連結」`#copy-search-link`（不是卡片閱讀按鈕）。
- 視窗高度不足同時容納摘要與案例時（實測 390×400、844×390、320×480），改以案例為準、焦點移到該則的閱讀按鈕；此時結果摘要會被捲到視窗上方之外。這是刻意的取捨，已在單元測試固定。
- 螢幕閱讀器是否重複播報結果摘要沒有實測（本環境沒有輔助技術）。

## 獨立審查（未參與實作）與修正

由另一個 agent context 以本輪 diff、QA 紀錄與執行中的預覽獨立審查，自己重跑 `node --test tests/*.test.cjs`（656 通過，當時樹）、`discovery-browser`、`search-scope-browser`（1440／390／320）與 `arrival-browser`（三尺寸），確認首頁一般載入 `scrollY=0`、`#explore` 單獨抵達、`?case=` 開啟後焦點在 `detail-title`、UC-004 仍是全文命中且不在主題範圍。結論 **needs fixes**，4 項已修正：

1. **（should-fix，已修）矮視窗仍讀不到案例。** 原本只把結果摘要放到頂端，沒有確認案例是否跟著進畫面；390×400 時標題在 398–464。改法：新增 `placeArrivalResults()`，放好摘要後若第一則可讀的那一行仍不完整，改把該行放到頂端，並在摘要被捲出畫面時把焦點移到第一則的閱讀按鈕（空結果為 `#edit-query`）。實測 390×400 標題 24–90、844×390 標題 16–82、320×480 標題 24–87，焦點都在可見處。
2. **（should-fix，已修）`corpus-bundle-browser` 漏了條件式查詢可見性斷言。** 補回「焦點是 `search-title` 時查詢框必須在上半」；`results-count` 聚焦時查詢框本來就在畫面上方之外，不套用。
3. **（nit，已修）文件焦點交接寫錯。** 390×844 按一次 Tab 實際落在 `#copy-search-link`，不是卡片閱讀按鈕；文件已更正。提交路徑的說明也改成 `focusLoadedResults('start')`（`focusResults()` 本身只聚焦）。
4. **（nit，已修）「4 項全紅」不成立。** 對基準 `3a9ae6d5` 實跑：6 項新測試中 5 項紅，「案例已可讀時不動」在舊程式也通過。數字已改正，本輪總數由 667 改成 669（新增 6 項）。

審查未能驗證：截圖影像內容（本環境不能讀圖）、螢幕閱讀器播報次數、Firefox／WebKit、`corpus-bundle-browser` 的公開站分支。
