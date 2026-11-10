# 2026-11-11 抵達結果頁後，結果摘要被推到視窗外

## 問題與讀者

目標讀者是從首頁任務目錄或朋友分享的搜尋連結進來、心裡已經有一個問題的人。`finishArrival()` → `placeArrivalResults()` 會把結果摘要 `#results-count` 捲到視窗頂端並聚焦，需要時再把第一則案例標題放進同一個畫面（2026-11-10 的抵達契約）。問題是**放置完成之後**頁面還會動：命中範圍、目前條件、命中範圍說明等區塊在語料載入完成後才長出來，原生 scroll anchoring 會改 `scrollY` 讓某個節點維持不動——被留下來的不是讀者聚焦的那一行。

正式站 `5f678d68`（`catalog.json.sourceRevision` 相同、512 個來源檔、畫面 515 筆）實測 `?q=旅遊#explore`：

| 量測 | 視窗 | 結果摘要 top | 第一則標題 top | 焦點 |
| --- | --- | ---: | ---: | --- |
| 任務入口連按 4 次 | 390×844 | −65／−65／−40／−65 | 313–338 | `results-count` |
| 分享搜尋連開 4 次 | 390×844 | −39／−101／−21／−101 | 277–357 | `results-count` |
| 空結果連開 4 次 | 390×844 | −20／−65／−65／−101 | —（空狀態 68–149） | `results-count` |
| 另一次工作階段 | 390×844 | **+24** | 403 | `results-count` |
| 另一次工作階段 | 320×740 | **−18**（2.5 秒內不變） | 376 | `results-count` |
| 另一次工作階段 | 1440×900 | +9 | 320 | `results-count` |

同一支程式、同一個網址，390px 一次是 −101、一次是 +24：這是時序造成的，不是固定版面錯誤。320px 則是穩定重現。讀者看到的畫面是「第一則案例標題在 376px、上面沒有筆數」，而站上自己的 live gate（`tests/arrival-live.cjs`）明文要求 `resultsTop >= 0`，所以這條契約在正式站是**間歇**失效的——同樣的時序也可能讓 live gate 自己間歇變紅。

## 兩個方案

- **A（不採用）把「抵達」改成固定捲到第一則案例、不再放結果摘要。** 成本最低，但等於撤掉 2026-11-10 的契約：讀者會看不到「35 / 515 筆」與「這 35 筆裡只有 5 筆在標題、用途或痛點提到你搜的字」這種判讀資訊，而那正是這個站最在意的證據說明。
- **B（採用）保留契約，補一個有界的守衛。** `placeArrivalResults()` 放置後啟動 `watchArrivalSummary()`：逐 frame 檢查被聚焦的結果摘要是否完整在視窗內；若被推出去、**而且**摘要與第一則案例仍放得進同一個畫面（`span <= innerHeight - 24`，24px 是 `html{scroll-padding-top}`），就再放一次；讀者一有輸入（pointerdown／keydown／wheel／touchstart）、網址改變、焦點離開，或 1.2 秒／4 次上限到，立刻停止。價值是抵達結果不再取決於載入時序；成本是一個 30 行的函式、一個共用 helper 與兩支測試；風險是「和讀者搶捲動」與「和 `placeArrivalResults()` 的『視窗太矮以案例為準』分支打架」，兩者都用同一條「只有兩者都放得下才動」判斷式擋掉，並各有回歸。

沒有改文案、版面、搜尋語意、排序或任何案例資料。

## 改動

- `assets/app.js`
  - `onReaderTakeover(stop)`：把原本只存在 `focusLoadedResults()` 裡的四種接手事件抽成共用 helper；`focusLoadedResults()` 改用它，行為不變（同一個函式註冊、同一個函式移除）。
  - `arrivalSummarySharesScreen()`：量出「摘要 top → 第一則可讀那一行 bottom」的距離，判斷兩者能否同時放進視窗；結果還沒畫出來時回 `true`（此時把摘要放到頂端不會藏住任何案例）。
  - `watchArrivalSummary(target)`：有界的 rAF 守衛，條件如上；`requestAnimationFrame` 不存在時（`node:vm` 單元 fixture）直接返回。
  - `placeArrivalResults()`：在放置與聚焦之後啟動守衛，其餘分支不動。
- `tests/arrival-summary-guard.test.cjs`（5 項）：被推出視窗就放回、視窗太矮時不與案例爭、已可見時不動、讀者接手後不再動且移除監聽、最多 4 次即停。
- `tests/arrival-summary-visibility-browser.cjs`（Chromium 1440／390／320）：抵達後兩 frame 注入 60px 的延遲捲動（正式站實測 `scrollY` 3342→3419、摘要文件位置不變），斷言「結果摘要或查詢框至少一個完整可讀、第一則標題可讀、焦點在視窗內、無水平溢出、axe 0、無 page error」。
- `.github/workflows/website-qa.yml`：在 `search-reveal-settle-browser.cjs` 之後執行新的瀏覽器回歸。

## 驗收

**先紅後綠**

- `node --test tests/arrival-summary-guard.test.cjs`：基準 `assets/app.js` **5 項全紅**（`watchArrivalSummary` 不存在）；本輪 **5 項全綠**。
- `ARRIVAL_URL=http://127.0.0.1:8132/ node tests/arrival-summary-visibility-browser.cjs`：基準重建預覽 **紅**（`desktop: … count {"top":-36,"bottom":-11} of 900`）；本輪預覽 **綠**（三尺寸、axe 0、溢出 0）。
- `node --test tests/*.test.cjs`：基準 `5f678d68` **723 通過**；本輪 **728 通過、0 失敗**（+5）。`node --check` 全部 JS 通過。

**前後幾何**（同一個預覽、同一個注入時序、`?q=旅遊#explore`）

| 視窗 | 修改前 摘要 top | 修改後 摘要 top | 修改前 標題 top | 修改後 標題 top |
| --- | ---: | ---: | ---: | ---: |
| 1440×900 | −36 | **24** | 275 | 335 |
| 390×844 | −36 | **24** | 342 | 403 |
| 320×740 | −36 | **24** | 359 | 419 |

修改後三種寬度都是「摘要 24–49px、第一則標題 335–482px、焦點在摘要」，兩者同屏。

**相鄰既有流程**（本機預覽 `http://127.0.0.1:8081/ai-agent-use-cases/`）

- `search-reveal-settle-browser`（案例卡長高後焦點留在搜尋框）通過：desktop 第一張卡 757px、phone 830px，`focus=query`。
- `explore-visibility-browser`、`result-count-honesty-browser`、`match-scope-note-browser`、`keyboard-search-entry-browser` 通過。
- `mobile-search-browser`（三尺寸、篩選面板開合契約、axe）通過。
- `arrival-browser`（1440／390／320，直鏈、返回、空結果、分享）通過；`arrival-live` 對正式站 chromium（1440×1000）與 firefox（390×844）通過，`failedPaths` 皆空。
- 三情境人工走查（Chromium 1440／390／320）：①任務入口「旅遊規劃」→ 摘要與第一則標題同屏；②`?q=會議&scenario=省錢&difficulty=工具串接` 空結果 → 「移除實作門檻…→ 查看 1 筆」可恢復；③`?case=UC-001` 直鏈 → 憑據徽章、固定版本來源、關閉回結果（查詢與篩選保留）。

## 限制

- 本環境**無法讀取截圖影像**（`read` 回 "Image reading is disabled"），視覺結論來自 DOM 幾何、`checkVisibility`、axe 與 pageerror，不是目視。前後截圖仍保存於本目錄（`before-*.png`／`after-*.png`）供人眼覆核。
- 正式站的失效是**間歇性**的（390px 一次 −101、一次 +24），本輪只用注入延遲捲動在預覽重現；沒有在 CI 容器裡重現那個原生時序。live gate 目前在本輪之前是綠的，不能說它「已經紅了」。
- 本機只跑 Chromium；Firefox／WebKit 交給 PR 上的既有 workflow。`reading-history` 那類捲動錨定斷言對版面位移敏感，PR 上必須確認仍綠。
- 守衛只處理「摘要被推出視窗」這一種位移；搜尋框在抵達後仍在視窗外（390px 約 −490px）這件事本輪沒有處理，`/` 快捷鍵與「直接搜尋案例」仍是目前的改關鍵字路徑。
