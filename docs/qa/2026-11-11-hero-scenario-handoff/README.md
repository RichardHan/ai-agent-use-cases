# 2026-11-11 首頁情境按鈕把訪客的搜尋無聲丟掉；詳情頁的說明沒有延伸到同一個切換

## 基準

- 開發基準 `origin/main` = `03acca68`（`#355`），隔離 worktree `/private/tmp/aiuc-1111-r19`（分支 `improve/20261111-round19`）。原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main、另有 159 個未追蹤檔案（皆屬其他輪次）；本輪未觸碰、未 reset。
- 基準測試：`node --test tests/*.test.cjs` 在 `03acca68` 是 **714 通過、0 失敗**；`node --check assets/app.js` 通過。
- Actions 現況重新確認（未沿用歷史敘述）：main 的 `Website QA` 對 `03acca68` 是 **success**（[42881432005](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42881432005)），其 `pages build and deployment`（[42881430944](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42881430944)）58 秒 success；正式站 `catalog.json.sourceRevision` = `03acca68`。
- 本輪開工前另行確認的失敗（`#355` 已修，未重做）：`Website QA` [42820349847](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42820349847)（`2b139d9f`）在同一 job 內先印出 `PUBLISHED_CHANGED_BYTES_MATCH … superseded by ab4b51f4 (7 files verified)`，接著在下一步用 `Published assets do not match checkout after 3600002ms (717 attempts); last attempt: index.html: byte mismatch, assets/app.js: byte mismatch` 判紅——正是 `#348` 改掉的兩個檔案。該缺陷由 `#355` 的 `scripts/published-revision.cjs` 修掉，本輪不再重複實作。

## 問題證據

目標使用者：**已經在搜尋結果裡（或有分享連結）的訪客，回到首頁改用「依情境選方向」的按鈕**。

正式站 `03acca68` 直接量測，Chromium 1440×900／390×844／320×740，`?q=旅遊#explore`：

| 步驟 | 點擊前 | 點擊「工作省點力」後 |
| --- | --- | --- |
| 網址 | `?q=旅遊` | `?scenario=工作` |
| 結果 | 35 / 515 | 162 / 515 |
| 查詢框 | 旅遊 | 空白 |
| 畫面上說明清除了什麼 | — | **沒有**（`#scenario-reset` 存在但 `hidden`，文字為空） |
| 焦點 | 搜尋結果 | 抽卡區的卡片標題 |

成因：`assets/app.js` 只有兩處呼叫 `chooseScenario()`，它第一行就把 `query`／`scenario`／`kind`／`difficulty`／`tool`／`category`／`proof` 七個欄位清空。其中詳情頁的「探索更多「情境」案例」在上一輪（`ab4b51f4`）已改為具名通知＋一鍵復原；首頁 `#guide-options [data-scenario]` 那七顆按鈕仍是直接呼叫 `chooseScenario()`，因此在同一個網站裡，同一個「重新開始」語意有一個入口會說明、另一個入口不會。`?q=` 加上篩選條件時（例如 `tool=Grok Bot`、`kind=case`、`difficulty=入門對話`、`scope=topic`、`sort=reviewed`），被丟掉的是七項條件中的六項，全部無聲。

## 兩個方案

- **A（採用）首頁按鈕沿用同一個通知元件。**
  - 做法：新增 `scenarioSwitchReset()`／`chooseScenarioFromHero()`；切換前記錄條件，切換後用既有的 `showScenarioReset()` 具名寫出被清除的每一項與原本筆數，並沿用上一輪的 `landOnScenarioReset()`（聚焦結果筆數、把通知停在視窗頂端）。
  - 價值：兩個入口的語意與回饋一致；訪客不必重打問題就知道剛才發生什麼事，也能一鍵回到原本的 35 筆。
  - 成本：`assets/app.js` +41/−8 行（含註解；沒有新 CSS、沒有新 DOM，通知元素上一輪已存在）、`README.md` 1 行、`tests/discovery-browser.cjs` +28 行。
  - 邊界：**切換情境本身不算被清除的條件**。`?scenario=生活` 直接按「工作省點力」沒有任何訪客輸入被丟掉，因此不出現通知（實測 101 → 162 筆、無通知）；完全沒有條件時行為完全不變，仍然直接把手交給抽卡區的卡片標題。
  - 取捨：接受「先切換、再回頭」是兩個動作；不改成一邊保留關鍵字一邊加情境，理由與上一輪相同（那會讓「依情境選方向」變成在既有結果裡篩選，與按鈕字面相反）。
- **B 只在首頁按鈕旁加一行靜態說明（例如「切換會清除搜尋」）。**
  - 成本更低，但常駐文字對「這次真的丟了什麼」沒有幫助，也無法一鍵復原；而且會與結果上方既有的通知重複表達同一件事。不採用。

## 改動

- **`assets/app.js`**
  - `scenarioSwitchReset()`：取 `scenarioResetSnapshot()`，但把手動切換的情境本身從「被清除的條件」中排除；沒有其他條件時回傳 `null`。
  - `chooseScenarioFromHero()`：先記錄、再 `chooseScenario()`、再 `showScenarioReset()`；只有通知真的出現時才 `landOnScenarioReset()`，因此沒有東西被丟掉時仍維持原本的抽卡護送。
  - `landOnScenarioReset()`：把上一輪寫在詳情頁按鈕裡的「停在通知上」抽成兩個入口共用的一段。
  - `showScenarioReset()`：情境為空（「隨便逛逛」）時文案改用「不限定情境」，不再產生 `已切換到「」情境`；非空情境的字串與原本逐字相同。
- **`README.md`**：在既有的「探索更多」段落後補一首頁按鈕的規則（什麼時候說明、什麼時候不打擾）。
- **`tests/discovery-browser.cjs`**：新增 Journey 1b（三種尺寸都跑）——首頁切換要具名、通知要在視窗內、焦點在結果筆數、一鍵回到 35 筆與原網址、通知消失；「只有情境不同的切換不得出現通知」的反向斷言；以及「隨便逛逛」要把沒有情境說成「不限定情境」、不得出現 `「」`。

## 測試

- `node --test tests/*.test.cjs`：基準 `03acca68` **714 通過、0 失敗**；本輪最終 head 亦 **714 通過、0 失敗**（本輪只改瀏覽器行為，沒有新增單元測試）。`node --check assets/app.js` 通過。
- `tests/discovery-browser.cjs`（預覽 `8081`，本輪最終建置）：**exit 0**，7 個 PASS；桌機／手機／小手機三段都含新增的 Journey 1b，axe **0 違規**、水平溢出 0、pageerror 0。
- **先紅後綠**：同一支探針（`?q=旅遊` → 按「工作省點力」→ 檢查通知／焦點／一鍵回復）對改前建置（`origin/main` 的 `app.js`，預覽 `8403`）得到 `RESULT fail: the switch must say what it cleared`，`notice:false`、`focus:"BUTTON"`；對本輪建置得到 `notice:true`、`message:已切換到「工作」情境；原本的關鍵字「旅遊」已清除。`、`noticeTop:24`、`focus:"results-count"`、一鍵回復後 35 筆。
- `tests/related-browser.cjs`（詳情頁那條路徑的既有斷言，`RELATED_URL=8081`）：**exit 0**，7 個狀態的 axe 全 0，`scenario-reset` 狀態仍在清單內。
- `tests/page-context-browser.cjs`：chromium-1440／390／320、firefox-390、webkit-390 **全部通過**（首頁按鈕後的分頁標題契約不變）。
- 最長的通知（同時清除 7 項條件、122 字）：高度／按鈕底部在 1440×900 是 70／81px、390×844 是 190／201px、320×740 是 213／224px，三種尺寸都在首屏內、水平溢出 0。
- 鍵盤：切換後焦點在 `#results-count`，`Shift+Tab` **1 次**即到「回到原本的搜尋」，`Enter` 後查詢、4 個下拉篩選、`scope`、`sort` 與筆數全部回到切換前；8 個網址參數以 `URLSearchParams` 逐項比對相同（`Grok%20Bot` 與 `Grok+Bot` 是同一個值）。

## 三種訪客情境（預覽 `8081`，1440×900 與 390×844）

1. **不知道工具名稱的新訪客**：首頁 53 個任務入口與 7 個情境按鈕都是問題詞；選「工作省點力」後直接停在抽卡區，卡片標題有焦點（本輪未改變）。
2. **組合搜尋與篩選、遇到空結果再恢復**：`?q=旅遊&tool=Grok Bot&kind=case&difficulty=入門對話&category=旅遊／消費研究&proof=作者報告／示範&scope=topic&sort=reviewed` → 1 筆；按首頁「工作省點力」後通知列出 6 項被清除的條件並提供「回到原本的搜尋（1 筆）」，一鍵回去 1 筆，8 個網址參數逐項相同。`tests/discovery-browser.cjs` 的 Journey 2 仍涵蓋空結果與 5 個恢復選項。
3. **分享的詳情直鏈**：`?case=UC-001` 開啟後按「探索更多「情境」案例」——行為與文字與上一輪相同（`tests/related-browser.cjs` exit 0）。

## 獨立審查（非本輪實作者）與處理

由另一個 agent context（`reviewer`，未參與實作）讀最終 diff、在預覽 `8081` 重跑 `tests/discovery-browser.cjs`／`tests/related-browser.cjs`，並以攔截 response 的方式自造變異。結論 **needs fixes**，兩項：

1. **（不採用，附證據）切換後 `sort=reviewed` 仍留在網址。** 這是既有行為，不是本輪造成：同一支探針對改前建置（預覽 `8403`）與本輪建置各跑一次，兩者都得到 `?sort=reviewed&scenario=工作`、`#sort` 仍為 `reviewed`。`chooseScenario()` 從來不清 `sort`，通知也沒有聲稱清除了它（`activeConditions()` 不含 sort）；`sort` 是閱讀偏好而非內容條件，清掉它等於順手改掉讀者的顯示選擇。因此本輪不動，並在此記錄。
2. **（已修）空情境文案沒有測試。** 審查者把「隨便逛逛」的文案強制改成 `「」` 後，`discovery-browser` 仍通過，代表我改的那句沒有被任何斷言覆蓋。現在 Journey 1b 多一步：由 `?q=旅遊` 按「隨便逛逛」，斷言訊息含 `不限定情境` 且不含 `「」`。

審查同時確認（未改動）：三種尺寸下通知都在視窗內（1440 y=23.9px／390 y=24.4px／320 y=24.0px）、一鍵回復把 9 項欄位與網址逐項還原、只有情境不同的切換不出現通知、無條件時仍把手交給卡片標題、axe 0 違規；焦點停在 `#results-count` 時 `Shift+Tab` 1 次可到動作按鈕（`Tab` 需 218 次／175 次，這是既有焦點契約，見已知限制）。

## 已知限制

- 本環境無法讀取截圖影像，視覺結論來自 DOM 幾何、computed 樣式與 axe；`docs/qa/2026-11-11-hero-scenario-handoff/` 的 before／after 截圖（1440／390／320、搜尋前、切換後、復原後）只存檔供人眼核對。
- **`tests/inspiration-handoff-browser.cjs` 在本機不穩定，且與本輪改動無關**：對改前建置失敗在 `drawn title must be visible`（chromium-1440），對本輪建置失敗在 `Tab` 後應落在 `.tag-scenario`（webkit-390，改前建置的同一引擎亦同）。另外以獨立探針在兩個建置上各跑 5 個引擎，`Enter` 後焦點與 `Tab` 後的元素完全相同，因此不是本輪造成的差異；該套件由 `discovery-round-qa.yml` 在 CI 執行，本輪未在 CI 容器內重現。
- 通知的「一鍵復原」需要一次 `Shift+Tab` 才到得了（焦點依既有設計停在結果筆數）；這是上一輪已記錄、本輪未改的焦點契約。
- 首頁按鈕切換後會在結果區落地，因此該次不會停在抽卡區；沒有條件被清除時仍照原設計停在卡片。兩者都在 README 寫明。

## 下一輪

最值得做的一件事：**`tests/published-version.cjs` 仍有一種會燒滿 60 分鐘的不可能比較**（`#355` 未涵蓋）。`publicationChangeList()` 只保留可發布檔案（`scripts/published-check.cjs` 的 `PUBLISHABLE_FILE`），所以只改 `docs/`、`templates/` 的 push 會得到 `entries: []`，接著在 `!changed.length` 分支用 `sameContent(local,remote)` 要求「線上內容集與本次建置完全相同」；只要之後有任何內容 commit 先發布，這個斷言就不可能成立，重試到 60 分鐘為止（`42803248261` 的 693 次嘗試是同一族）。先做的驗證：用注入的 `fetchAsset` 在單元測試裡造出「changed 為空 + 線上內容屬於後續 commit」的情境，確認現行程式會重試到 deadline，再改成「線上版本是本次或後代即可、內容集不相同時列出差異」。

第二順位（`#355` 留下的閘門縫隙）：`mode=superseded` 由步驟 15 的輸出直接採信、不再用 `liveRevision` 交叉核對（`scripts/published-revision.cjs`），以及 mode 輸出為空時退回的 120 秒視窗低於當日觀測到的最慢發布（`42823367508` 的 7 分 15 秒）。先做的驗證：把 `PUBLICATION_MODE=superseded` 配上一個其實就是本次的 `liveRevision`，確認現在的程式是否會跳過走查。
