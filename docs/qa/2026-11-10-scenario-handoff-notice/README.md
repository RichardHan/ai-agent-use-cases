# 2026-11-10 「探索更多情境」把訪客的搜尋無聲丟掉；同一條流程的閘門也把捲動位移當成失去位置

## 基準

- 開發基準 `origin/main`（開工時 `ec48ae35`；工作期間 main 前進 `b65a49b8`（docs-only）、`0f7b6c76`（#349 修發布閘門）、`5676dfeb`（記錄），最後 rebase 到 `5676df6`）。隔離 worktree `/private/tmp/aiuc-1110-r18`（分支 `improve/20261110-round18`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main、另有 159 個未追蹤檔案（皆屬其他輪次）；本輪未觸碰、未 reset。`/private/tmp/aiuc-1110-r17` 是另一輪（PR #342）的 worktree，同樣未觸碰。
- 基準測試：`node --test tests/*.test.cjs` 在 `ec48ae35` 是 **691 通過、0 失敗**，rebase 到 `5676dfeb`（#349 新增 1 項）後是 **692 通過、0 失敗**；`node --check assets/app.js` 通過。
- 正式站 `catalog.json.sourceRevision` = `b65a49b8`（= 當時 main head），515 筆、512 個來源檔；`check_corpus_bundle.py` 512 個來源逐 byte 相同。
- Actions 現況重新確認（未沿用歷史敘述）：main 最近 40 次 run **0 failure**；`website-qa.yml` 的 main 發布裁決已改為不被下一個 push 取消（`cancel-in-progress: ${{ github.event_name == 'pull_request' }}`）。`Corpus bundle QA`（`8fbfe082` 之後才在 PR 上啟動）最近 19 次：7 success、10 cancelled、**2 failure**（`42799277060`、`42806867753`），兩次都是本輪處理的同一類斷言。`42806867753` 在 attempt 2 重跑通過——同一份程式碼、同一台 runner 規格，正是時序 flake 的特徵，也說明「重跑到綠」不是修好。另查證 `42793635230`（開工時的線索）實際是 success，未計入。

## 問題證據

目標使用者有兩個，都在同一條流程上：**從搜尋結果讀完一篇案例、想再看同情境其他案例的訪客**，以及**送 PR 的維護者**。

### 1. 訪客的關鍵字與篩選無聲消失

正式站 `b65a49b8`（開工時）直接量測，Chromium 1440×900 與 390×844 結果相同；本機預覽（同一份 `app.js`、`catalog.json`）另加 320×740，數值一致：

| 步驟 | 點擊前 | 點擊後 |
| --- | --- | --- |
| 網址 | `?q=怎麼整理會議記錄#explore` | `?scenario=工作#explore` |
| 結果 | 7 / 515（目前條件列：`關鍵字：怎麼整理會議記錄`） | 162 / 515 |
| 查詢框 | 怎麼整理會議記錄 | 空白 |
| 畫面上說明清除了什麼 | — | **沒有任何說明** |

成因：`assets/app.js` 的 `scenarioExploreAction()` 呼叫 `chooseScenario()`，後者第一行就把 `query`／`scenario`／`kind`／`difficulty`／`tool`／`category`／`proof` 七個欄位清空。同一頁其他每一種條件變更都會說明（`#active-filters` 的「移除…」、空結果的「移除… → 查看 N 筆」、「清除全部條件」），只有這顆按鈕沒有。

### 2. 同一條流程的閘門紅在「捲動值」而不是「閱讀位置」

`tests/reading-history-browser.cjs` 在 2026-11-10 失敗兩次，兩次紅在不同斷言，但都是同一種比較：

| run | commit | 失敗點 | 原始 log |
| --- | --- | --- | --- |
| [42799277060](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42799277060) | `6d9081fb` | `Forward must restore the reading location` | `waitForFunction` 5 秒內 `#detail.scrollTop` 未回到舊值 ±3px |
| [42806867753](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42806867753) | `28ad2137`（PR #342） | 同一句通過後緊接的即時斷言 `assert(Math.abs(scrollTop-sourceTop)<3)` | 等到相符的下一個 tick 又偏移（attempt 1 失敗、**attempt 2 重跑同一 SHA 通過**） |

同一支套件在本機五個引擎（chromium-1440／390／320、firefox-390、webkit-390）共跑 5 次（舊斷言 2 次、本輪程式 3 次），每次全數通過；同一段程式裡以「區塊位置」比較的斷言 `History must restore reading anchor` 兩次失敗都沒有紅。

機制量測（Chromium 1440×900，`/tmp/qa-r18`）：在閱讀位置上方插入 240px 後——

| 量測 | 插入前 | 插入後 | 差 |
| --- | ---: | ---: | ---: |
| `#detail.scrollTop` | 3368 | 3608 | **+240** |
| 讀者正在看的區塊距工具列 | 80.2px | 80.2px | **0** |

這是瀏覽器原生的 scroll anchoring：它刻意改 `scrollTop` 來固定讀者看到的那一段。**推測（inference，未在容器內重現）**：CI 在 `Cloud tools` 步驟另外安裝 Noto CJK 字型，late relayout 落在 popstate 還原之後，於是「`scrollTop` 等於舊值」不成立，而讀者其實沒有被移動；本機以「插入 240px」製造同類重排，得到的正是 CI 那兩個斷言的失敗。舊斷言因此把一次版面重排讀成功能退化。

## 兩個方案

- **A（採用）按鈕維持「重新開始」的語意，但把清除了什麼說出來，並提供一鍵回頭。**
  - 做法：`#scenario-reset` 在結果上方寫出被清除的每一項條件與原本筆數（`回到原本的搜尋（7 筆）`），一次點擊還原查詢、全部篩選、排序、網址與焦點；下一次條件變更時通知自動退場，不會留著解釋已經不成立的結果。
  - 價值：符合本庫對其他每一種條件變更的既有作法；訪客不必重打問題就知道剛才發生什麼事，也可以原樣回去。
  - 成本：`app.js` +74 行（含註解）、`index.html` 1 行（重用既有 `.search-split` 面板，沒有新 CSS）、一支瀏覽器回歸。
  - 邊界：只列出「新狀態真的沒有了」的條件——案例本身的情境就是目前情境時，切換沒有丟掉任何東西，通知不出現（實測 `?scenario=生活` 101 筆 → 點同情境案例的按鈕：無通知、仍是 101 筆）。
  - 取捨：接受「先切換再回頭」是兩個動作；不改成「保留關鍵字再加情境」，因為那會讓「探索更多」變成在 7 筆裡找「工作」，與按鈕字面承諾相反，而且首頁與 README 都把情境切換描述成重新開始。
- **B 直接把 `chooseScenario()` 改成保留查詢與篩選。**
  - 成本最低、也最不會丟東西，但「探索更多「工作」案例」會從 162 筆變成個位數，按鈕的承諾與結果不一致；而且首頁情境按鈕共用同一支函式，等於同時改變首頁語意。不採用。

第二部分（閘門）的兩個方案：**A（採用）斷言讀者看得到的位置**（同一區塊、距工具列同樣距離，失敗時印出實際值），**B 把 `scrollTop` 容差放大**——B 沒有處理「量錯東西」，只會在下一次位移更大時再紅一次，且等於放寬斷言。不採用。

## 改動

- **`assets/app.js`**：新增 `scenarioResetSnapshot()`／`showScenarioReset()`／`syncScenarioReset()`／`conditionSignature()`；`scenarioExploreAction()` 在切換前記錄條件，切換後顯示通知並把視窗停在通知上（焦點仍在 `#results-count`）；`renderSearchFeedback()` 在每次重繪時比對條件簽章，條件一變就收掉通知；新增 `#scenario-reset-action` 的一鍵回復。
- **`index.html`**：`#search-feedback` 之後新增 `#scenario-reset`（`class="search-split"`，沿用既有面板樣式）。
- **`tests/reading-position.cjs`（新）**：`readingPosition(page)` 複製 `selectReadingAnchor()` 的規則（工具列下方 +8px 起算、詳情底部 −8px、優先取「起點在工具列之下」的區塊，被工具列裁掉的那塊只在沒有其他候選時使用），取該區塊文字與距工具列的位移；`waitReadingPosition(page, expected, {timeout,tolerance,settle,message})` 要求連續兩次取樣（間隔 ≥120ms）都相符，失敗時列出期待值與最後 6 次觀察值。
- **`tests/reading-history-browser.cjs`**：兩處 `scrollTop` 比較改用 `waitReadingPosition`（另保留 `scrollTop` 於報告中）；新增「還原後上方再重排 240px，閱讀位置不得移動」一步；每列輸出 `READING_POSITION` 供 log 判讀。
- **`tests/related-browser.cjs`**：新增情境切換後的通知與一鍵回復斷言（三種尺寸，含 axe 與水平溢出檢查），以及「情境與目前相同、沒有清掉任何條件時不得出現通知」的反向斷言。
- **`README.md`**：把「探索更多」段落改成說明它會清除條件並可一鍵復原。

## 測試

- `node --test tests/*.test.cjs`：基準 `ec48ae35` **691 通過、0 失敗**；rebase 到 `5676dfeb` 後（含 #349）**692 通過、0 失敗**，本輪最終 head 亦 **692 通過、0 失敗**（本輪沒有新增單元測試，行為由瀏覽器回歸覆蓋）。`node --check assets/app.js` 通過。
- `tests/related-browser.cjs`（預覽 `8352`，rebase 後最終建置；`8198` 亦同）：1440／390／320 三種尺寸 **通過**，新增的 `scenario-reset` axe 掃描 **0 違規**、水平溢出 0、pageerror 0。
- `tests/reading-history-browser.cjs`：chromium-1440／390／320、firefox-390、webkit-390 **全數通過**；`READING_POSITION` 記錄顯示 late relayout 那一步 `scrollTop` 由 3368 → 3608（+240），而讀者區塊的位移不變（1440px：26.59px；390px：49.63px；320px：59.16px；firefox-390 50.12px；webkit-390 49.86px）。
- **先紅後綠（閘門）**：把 `tests/reading-history-browser.cjs` 的舊版取出、在還原後插入 240px，舊斷言**失敗**且訊息與 CI 完全相同（`Forward must restore the reading location`，`actual/expected undefined`，`assert.fail()` 特徵）；同一份重排下新斷言**通過**。反向驗證：在 `restoreReadingView()` 對帶 `q=` 的入口跳過 `scrollTop` 與錨點修正，新斷言**失敗**並印出「期待 `2026-10-24 補充…` 在 26.59px，實際 `成果主張…` 在 148.69px，scrollTop 0」。
- **訪客改動前後**（同一查詢、同一份語料，`8191` 舊建置 vs `8198` 本輪最終建置）：

| 尺寸 | 改前 | 改後 |
| --- | --- | --- |
| 1440×900 | 7 → 162 筆，查詢框空白，通知無 | 7 → 162 筆，通知在 y=24（首屏），`回到原本的搜尋（7 筆）` |
| 390×844 | 同上，第一張卡 y=105 | 通知 y=24，第一張卡 y=258（仍在首屏） |
| 320×740 | 同上，第一張卡 y=105 | 通知 y=24，第一張卡 y=258（仍在首屏） |

  一鍵回復後：查詢 `怎麼整理會議記錄`、`tool` 空、結果 7 筆、通知消失、網址回到 `?q=…`、焦點在 `#results-count`；三種尺寸相同。
- 最長的通知（同時有 7 項條件被清除、122 字）在 1440／390／320 的高度是 70／190／213px，第一張卡被推到 290／471／493px（仍在首屏），水平溢出 0、按鈕高度 44px。
- `tests/corpus-bundle-browser.cjs`（預覽 `8198`，與 CI 的 Corpus bundle QA 同一支；app.js 自此未再變動）：5 個引擎／寬度加上 6 個失敗情境共 11 列全部通過，515 筆、`failedPaths` 0、詳情 axe 0。
- 語料未動：`python3 scripts/check_corpus_bundle.py` 對改前／改後預覽都是 **512 個來源逐 byte 相同**。

## 三種訪客情境（預覽 `8350`／`8198`，1440×900 與 390×844；正式站 `b65a49b8` 的同一支探測結果相同）

1. **不知道工具名稱的新訪客**：首頁 h1 在 y=344（390px 為 238）結束，53 個任務入口都是問題詞而非工具名；點 `日報整理` 得 78 筆、結果停在 y=234／302，第一張卡可見；開卡得 UC-280，憑據列同時顯示 `作者報告／示範`、`成果主張來源：社群作者／專案實踐者`、`本庫核讀狀態：本庫未於本機獨立重現…`、`頁首核對 2026-10-17`。
2. **組合搜尋與篩選、遇到空結果再恢復**：`?q=旅遊&tool=Grok Bot&scenario=生活` 17 筆 → 改成不存在的字串 0 筆，空結果頁列出 41 個恢復選項與 3 個可移除條件；按「清除篩選，保留關鍵字」後 `tool` 清空、剩查詢字串；改回 `旅遊` 得 35 筆。
3. **分享的詳情直鏈**：`?case=UC-005` 直接開啟，憑據徽章、主張者、核讀狀態皆在標題下；第一個外部連結是 `https://github.com/…/blob/<sha>/cases/005-cloud-pr-review.md`（`rel="noopener noreferrer"`、新分頁）；`Escape` 後回到探索，清單 24 張卡、焦點在頁面按鈕上。

鍵盤：首頁第一次 Tab 停在「跳到案例搜尋」，Enter 後焦點在 `#query`。

- 本輪的 CI 結果：PR 上 16 支非略過檢查（Corpus bundle QA、Website QA、Related reading QA、Reader search QA、Partial Load QA、Find reader sections QA 等）與 main 的 pages build and deployment；合併後的正式站驗證見「發布」。

## 發布

- PR [#348](https://github.com/RichardHan/ai-agent-use-cases/pull/348)（head `690e6a25`，rebase 到 `5676dfeb`）：**16 項非略過檢查 success、2 項 `published` 依設計 skipped**、review 完成後 squash 合併為 `ab4b51f4`。
- `pages build and deployment` [42821308838](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42821308838) success（53 秒）；正式站 `catalog.json.sourceRevision` = `ab4b51f4`。
- 正式站重走（同一支探測，1440／390／320）：`?q=怎麼整理會議記錄` 7 → 「工作」 162，通知在 y=24、第一張卡 222／258／258、水平溢出 0；按「回到原本的搜尋（7 筆）」後查詢與結果回到 7 筆、通知消失、焦點在 `#results-count`。三種訪客情境與部署前逐項相同（hero 344／238、j1 78 筆、j2 17→35、UC-005 直鏈）。
- 正式站資產比對：`assets/app.js` 含 `scenario-reset-action`、`index.html` 含 `id="scenario-reset"`。

## 已知限制

- 本機只跑 Chromium 走完三情境；Firefox／WebKit 只由 `reading-history-browser`（5 引擎）與 PR 上的瀏覽器 workflow 覆蓋。本環境無法讀取截圖影像，視覺結論來自 DOM 幾何、computed 樣式與 axe；前後截圖只存檔供人眼核對。
- 通知只覆蓋詳情頁的「探索更多情境」；首頁「換個情境，再找一點靈感」那組按鈕同樣會清空表單，本輪未改（首頁那個位置的字面就是重新開始，且會連動 5 支瀏覽器流程的幾何斷言），列為下一輪候選。
- 捲動位移的觸發條件（CI 的 Noto CJK 字型 late relayout）無法在本機完整複製（沒有 Docker 可跑 `mcr.microsoft.com/playwright:v1.64.0-noble`）；本輪以「插入 240px 重排」重現同一類位移，沒有在 CI 容器內重現原始成因。
- 通知的 `role="status"` 與聚焦的 `#results-count` 都是 live region，理論上可能連續朗讀兩段；本輪只以 axe 與 DOM 檢查，沒有螢幕閱讀器實測。
- 焦點依既有設計停在結果筆數（那裡會唸出新的筆數），通知在它前面，因此鍵盤使用者要 `Shift+Tab` 一次才到得了「回到原本的搜尋」；本輪沒有改動既有焦點契約。

## 下一輪

最值得做的一件事：**範本章節標題仍整個進搜尋索引**。同一份語料（515 筆）實測全文／`overview`（標題、用途、痛點）／`topic` 三個範圍的筆數：

| 查詢 | 全文 | overview | topic |
| --- | ---: | ---: | ---: |
| 權限 | 507 | 30 | 41 |
| 來源 | 506 | 73 | 79 |
| 限制 | 468 | 16 | 18 |
| 驗收 | 477 | 73 | 209 |
| 重現 | 444 | 115 | 116 |
| 提示詞 | 313 | 17 | 17 |
| 所需連接 | 216 | 0 | 0 |

先做的驗證：列出 515 頁的章節標題 document frequency，把「與 `templates/case.md` 完全相同的標題行」與「標題本身就是內容」分開，並量移除後 `提示詞` 會少掉幾筆真的有提示詞的案例（目前 313 筆全文命中，只有 17 筆在標題／用途提到），再決定是否只移除完全相同的模板標題行。

第二順位：首頁「換個情境，再找一點靈感」那組按鈕同樣會清空表單（本輪只修詳情頁入口），驗證先量 `?q=…#discover` 下點該組按鈕後的查詢欄與筆數，再決定是否共用本輪的通知元件。

## 獨立審查（非本輪實作者）與修正

由另一個 agent context（`reviewer`，未參與實作）讀最終 diff、在預覽 `8198`（head `e07f39d1`）上重跑套件、並自行構造變異；修正後在 `8350`（head `a6c4879c`）複驗。結論 **needs fixes**，兩項都是 P2、都已修：

1. **（已修）helper 取的區塊不是 app 實際記住的那一塊。** 第一版 `readingPosition()` 只取「與閱讀區相交的第一個區塊」，而 `selectReadingAnchor()` 會取「起點在工具列下方 8px 之後」的那一個；審計者在預覽上量到 helper 取 −42.98px 的清單項目、app 存的卻是 +26.59px 的下一項，因此把位移藏進被裁掉那一塊時舊 helper 仍會通過。現在 helper 逐條複製生產規則；四個捲動位置的實測（`/tmp/qa-r18/anchor-fidelity.cjs`）顯示 helper 與 `selectReadingAnchor()` 的文字與位移完全相同（148.69／41.11／22.53／102.89）。
2. **（已修）一鍵回復只驗了兩個欄位。** 原測試只設 query 與 tool，卻斷言「回復每一個篩選」。現在固定測資同時設 `kind`、`difficulty`、`category`、`proof`、`scope`、`sort`，逐欄斷言去程與回程的值、URL 參數與筆數；通知文字也逐項斷言（關鍵字／提及工具／收錄狀態／實作門檻／來源類型）。

審查同時確認（未改動）：手動把 `#detail.scrollTop` 歸零的變異會被新斷言抓到；通知在「沒有清掉任何條件」與「連續兩次同情境」時不出現；通知在條件變更與 Back/Forward 後消失；axe 在通知狀態下 0 違規。

本輪另修一項審查過程暴露的測試時序：情境切換會重按門檻列（入門對話 → 全部門檻），`.draw-diff-btn` 的 150ms 背景轉場在中途被 axe 讀成 `#819a8f`（3.02:1）；正式站在同一狀態量到的是 `#285344` 白字（8.71:1，以 WCAG 公式自算），因此掃描前等 250ms 讓轉場結束，而不是改顏色或關掉檢查。
