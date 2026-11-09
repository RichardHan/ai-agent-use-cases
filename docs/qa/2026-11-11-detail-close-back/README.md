# 2026-11-11 關掉案例後，第一次「上一頁」沒有反應

## 基準

- 開發基準 `origin/main` `7377831b`（同日先後併入 `#309` 的查證日期修正與 `8100024f` 的發布修訂註記；正式站 `catalog.json.sourceRevision` 於本輪開始時為 `fdcd60f8`／`8100024f`，510 個來源檔、513 筆條目）。隔離 worktree `/private/tmp/aiuc-1111-round`（分支 `improve/20261111-visitor-round`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 278 個 commit，另有 159 個未追蹤的他人研究檔與 QA 產物；本輪未觸碰。該工作樹的 `.github/workflows` 是舊版（`website-qa.yml` 沒有 Pages 發布驗證步驟），稽核 CI 一律以 worktree 內的 main 版本為準。
- 基準 `node --test tests/*.test.cjs`：**594 通過、0 失敗**；`node --check assets/app.js` 通過。
- Actions 現況重新確認（不沿用歷史故障）：main 上 `Website QA` `42692519441`（`7e70b5f5`）與 `pages build and deployment` 皆 success；`42692519441` 17 個步驟全綠（含 `Wait for published assets and content` 1s、`Verify the published GitHub Pages site` 39s）。近 300 次 run 的失敗全在已放棄的 feature 分支，14 次 cancelled 全部是 `cancel-in-progress` 的取代行為。**本輪沒有修改測試斷言或關閉任何檢查。**

## 問題證據

目標使用者是**讀完一個案例、按「關閉 ✕」或 Escape 回到結果清單、再按瀏覽器上一頁的人**。

正式站 `7e70b5f5`（390×844，Chromium）：`?q=會議` → 開啟第一張卡（UC-127，`history.length` 3）→ 關閉 ✕ → 網址回到 `?q=會議`、對話框關閉、焦點回到原卡片；**第一次「上一頁」沒有任何反應**（網址仍是 `?q=會議`、畫面仍是 26／513 筆），第二次上一頁才離開網站。

原因在 `closeDetail()`：它用 `history.replaceState` 把「正在讀的那一筆」改寫成清單網址，於是歷史中留下兩筆相鄰且完全相同的網址。第一次上一頁是從「被改寫的那一筆」退回「原本的清單那一筆」，兩者網址相同，所以畫面與網址都不變。`closeDetail()` 被關閉鈕、`cancel`（Escape）與點擊背景三處共用，三條路徑都有一樣的症狀。

## 三個方案

- **A（採用）保留關閉後的那一筆，但辨識並跳過它造成的一次空轉。**
  - 做法：記錄「這一頁上一次寫入歷史後的網址與 history.length」；`closeDetail()` 改寫網址後記下這一筆；`popstate` 若發現「到達的網址＝被改寫的那一筆、history.length 未變、且沒有 `case` 參數」，代表這次上一頁只是關閉動作的回音，於是再退一筆並直接返回，不重繪。
  - 價值：第一次上一頁真的帶走讀者；**閱讀軌跡完整保留**（從 A 讀到 B、關閉後按上一頁仍回到 A），分享直鏈關閉時不會亂跳。
  - 成本：`assets/app.js` 3 處（＋29 行）、1 支新瀏覽器測試、CI 一行。
  - 取捨：需要一個小型 `history.pushState/replaceState` 包裝來追蹤目前網址；`node` 測試沙箱沒有 `history`，必須以 `typeof` 防護（已處理）。
- **B 關閉時把這次閱讀建立的歷史全部退回（`history.go(-N)`）。**
  - 已實作並量測：`tests/related-browser.cjs` 立即失敗——從清單開啟 A、在對話框內切到 B、關閉後第一次上一頁回到清單而不是 A，2026-10-29 建立的「返回案例」軌跡被刪掉；`tests/detail-close-history-browser.cjs` 的第 3 條情境也直接暴露。**放棄。**
- **C 關閉時一律 `history.back()`。**
  - 直鏈（`?case=UC-001`、前面沒有站內紀錄）會被立刻帶離本站；B 的軌跡問題也同樣存在。**放棄。**

選 A：錯誤的本質是「多了一筆同網址的空轉」，正確修法是讓那一次空轉透明，而不是刪掉讀者的閱讀歷史。

## 改動

- `assets/app.js`
  - 新增模組層級的歷史追蹤：`liveHistoryURL`／`liveHistoryLength`，以包裝 `history.pushState`／`replaceState` 的方式在每次寫入後更新（`typeof history`／`typeof location` 防護，讓 `node:vm` 單元測試沙箱照常載入；缺少方法時跳過）。
  - `closeDetail()`：改寫網址後記下 `spentDetailStop={url,length}`。
  - `popstate`：在既有邏輯之前判斷「這次 pop 是否只是關閉動作的回音」，是則 `history.back()` 後直接返回，不重繪、不動焦點。
- `.github/workflows/website-qa.yml`：在 `Verify the updated site in Chromium` 步驟加入
  `DETAIL_HISTORY_URL=… DETAIL_HISTORY_OUTPUT=qa-artifacts/detail-close-history node tests/detail-close-history-browser.cjs`（`tests/**` 本來就在 path filter 內，不需改觸發條件）。
- 新增 `tests/detail-close-history-browser.cjs`：5 條情境 × 1440×900／390×844，含焦點、history.length、axe、水平溢出與 pageerror 斷言。第 4 條另開新 context（乾淨分頁）測分享直鏈；第 5 條測「關閉後把結果批次從 24 擴到 48 再上一頁」必須還原較窄批次。

## 測試

- `node --test tests/*.test.cjs`：基準 **594 通過／0 失敗** → 本輪 **594 通過／0 失敗**。`node --check assets/app.js` 通過。
- 新測試的紅綠證明（同一支腳本、同一份資料）：
  - 基準預覽（`origin/main` `b04f4fe4` 建置，`127.0.0.1:8171`）：**失敗**，`the first Back after closing leaves the searched results`（`search` 仍含 `q=`）。
  - 本輪預覽（`127.0.0.1:8081`）：**通過**，兩種寬度、5 條情境。
  - 只把「回音」判斷放寬成「同網址＋history.length 未變」（拿掉寫入次數條件）的對照建置（`127.0.0.1:8172`）：**失敗**，`Back after widening a batch restores the narrower batch` → 第 5 條情境確實釘住獨立審查指出的缺陷。
- 既有瀏覽器回歸（本機 preview，Chromium 為主）：`related-browser`、`return-visibility-browser`、`results-return-browser`（3 條旅程 + 部分載入／錯誤／重試）、`search-submit-browser`、`home-search-entry-browser`、`missing-case-browser`、`reader-browser`、`search-context-browser`、`page-context-browser`、`discovery-browser`（loading／error／未知情境／部分語料）、`mobile-search-browser` 全數通過。
- `table-reading-browser.cjs` 在 **webkit-390** 的 `waitForFunction`（表格鍵盤左右捲動）在本機 30 秒逾時；**基準預覽同樣逾時**，chromium 1440／390／320 與 firefox-390 兩邊都通過 → 判為本機既有環境限制，不是本輪回歸。
- 本輪未跑完整 78 支瀏覽器測試；未跑 firefox／webkit（除上列 table-reading），也未在實機或螢幕閱讀器驗證。

## 前後數據（Chromium，同頁、同尺寸、同資料狀態）

| 量測（`?q=會議` → 開第一張卡 → 關閉 ✕） | 基準 `7377831b` | 本輪 |
| --- | --- | --- |
| 關閉後網址 | `?q=會議#explore` | `?q=會議#explore`（不變） |
| 關閉後 history.length | 3 | 3（不變） |
| 關閉後焦點 | 原卡片 UC-094 | 原卡片 UC-094（不變） |
| 關閉後結果數 | 顯示 26 / 513 筆收錄 | 顯示 26 / 513 筆收錄（不變） |
| **第一次「上一頁」** | 網址與畫面完全不變（26／513） | 離開搜尋結果，回到上一頁 |
| 讀 A→下一則 B→關閉→上一頁 | 空轉一次後才回到 A | 直接回到 A（UC-094） |
| 分享直鏈 `?case=UC-001`（乾淨分頁）關閉 | 留在本站、不多一筆 | 留在本站、不多一筆（不變） |
| 關閉後把結果批次 24→48 再上一頁 | 還原 24 筆（`resultBatch` 24） | 還原 24 筆（`resultBatch` 24，與基準相同） |
| axe／水平溢出／pageerror | 0／0／0 | 0／0／0 |

截圖（同頁、尺寸、資料狀態；關閉後與第一次上一頁之後）：

- `before-closed-desktop.png`／`before-first-back-desktop.png`（上一頁後仍是同一份 26 筆結果）
- `after-closed-desktop.png`／`after-first-back-desktop.png`（上一頁後離開結果）
- `before-*-mobile.png`／`after-*-mobile.png`（390×844）

本機**無法讀取影像內容**，視覺結論以網址、`history.length`、焦點、DOM 文字與 axe 為準；截圖只供人眼核對。

## 已知限制

- 「空轉一次」的判斷是「到達網址＝被改寫的那一筆、`history.length` 未變、且關閉後**沒有任何後續歷史寫入**」。任何後續寫入（改篩選、擴大結果批次、`readerVisit` 更新）都會讓下一次上一頁回到真正的目的地，不會被吞；代價是若真有背景寫入插在關閉與上一頁之間，那一次上一頁會退回舊行為（停在同網址），屬於安全方向的退化。已用「24→48 批次」與「關閉後改關鍵字」兩條路徑雙向量測。
- 首頁即第一個歷史項目時，跳過空轉後的那次上一頁會直接離開本站；這是「上一頁＝離開」的預期行為，但本輪沒有為它寫自動斷言。
- 未在真實慢網路、Firefox／WebKit（除 table-reading）、實機觸控或螢幕閱讀器上驗證。

## 獨立審查（未參與實作）

獨立審查者在自己的腳本上對前後兩種建置重測 4 條情境、Escape／背景點擊、A→B 軌跡、關閉後改篩選、另開案例、分享直鏈、Forward、根歷史項目，並確認新測試在基準建置上因正確的原因失敗、在本輪建置上通過。結論 **BLOCK**，1 項確認缺陷：

- **（已修）「回音」判斷太寬，會吞掉真正的結果批次目的地**：原本只比對「到達網址＋`history.length`」，但同網址的停靠點仍可能帶著不同的 `event.state`。重現：清單在 `resultBatch` 24、開案例、關閉、按「再看更多結果」（`replaceState` 只改 state 不改網址）到 48，上一頁應還原 24 筆；舊版會直接跳到 `history.back()` 並離開頁面。修法：包裝層多記一個 `liveHistoryWrites` 寫入次數，`closeDetail()` 記下當下的次數，`popstate` 必須「次數未變」才視為回音。驗證：用審查者自己的 `batch-after-close.cjs` 重跑，前後建置現在都在四種組合下還原 `resultBatch` 24／24 張卡；新測試第 5 條情境在放寬版建置上失敗、在修好的版本上通過。
- 另採納兩項測試改進：分享直鏈改用全新 context（乾淨分頁，前面沒有站內停靠點）；補上上述批次還原的迴歸斷言。

審查未能驗證：同一 tick 內 Escape＋背景點擊的競態、GitHub Actions 實際執行與 artifact 上傳、Chromium 以外的引擎、正式站、以及新分頁真實網址列的行為。

## 發布核對

- PR [#315](https://github.com/RichardHan/ai-agent-use-cases/pull/315)（head `728b9761`，13 項檢查全 success、`published` 依設計 skip）squash 合併為 `f07f72d5`。
- `pages build and deployment` [42708370217](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42708370217) success；正式站 `catalog.json.sourceRevision` = `f07f72d5…`、`corpus.json.sourceRevision` 同值、510 個來源檔。
- 正式站 `assets/app.js` sha256 與本機建置逐 byte 相同（`7624b344b3e22084d13b67719a4c22b25d4e579ef5012ad4f3bd643da1fc8788`）。
- 正式站實測（`docs/qa/2026-11-11-detail-close-back/live/`，1440×900 與 390×844）：新測試 5 條情境全通過；三條指定情境——(1) 不知道工具名，輸入「整理會議記錄」→ 8／513 筆、8 張卡；(2) 「規劃旅行」＋使用情境「工作」→ 0 筆並提供「移除使用情境「工作」→ 查看 1 筆」，恢復後 1 筆、網址只留 `q`；(3) 分享直鏈 `?case=UC-514` → 憑據徽章 `官方自報`＋`設計／未實跑`、來源連結固定在本版 commit、Escape 關閉後第一次上一頁即離開，不再空轉。axe 0、水平溢出 0、pageerror 0。
- 合併後 main 的 `Website QA` [42708373335](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42708373335) success（含新增的 `detail-close-history-browser.cjs` 與 `Verify the published GitHub Pages site`）。
- 紀錄提交 `d805fd1f`（僅 `SITE.md` 與本目錄）的 Pages 發布失敗，與程式無關：`build` success，`deploy` 的 `Deploy to GitHub Pages` 先 10m07s 逾時（`22:14:59→22:25:06`），重跑後 10 秒以 `##[error]Deployment cancelled.` 結束（run [42709949822](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42709949822) attempt 2）。同類平台端逾時在 2026-11-09 已發生過一次（`42546597665`，10m29s）。**正式站仍供應已驗證的 `f07f72d5` 建置**（`catalog.json` 510 檔、`assets/app.js` sha256 相同），只有文件與截圖尚未上站；下一次 push 到 main 會自然重建。

## 本輪順帶確認、但未處理的 CI 事實

獨立 CI 調查（以 main 版 workflow 與近 300 次 run 為準）留下三項有證據、但與本輪主題無關的問題，供下一輪排序：

1. **發布沒有被驗證把關**：`pages build and deployment` 在 push 後立即發布（`7e70b5f5` 為 20:23:35→20:25:13），`Website QA` 20:33:00 才結束，中間約 7 分 47 秒是未驗證的公開曝光；紅字事後才出現。屬架構問題（需改發布分支），成本高。
2. **57 支 workflow 只有 16 支跑得起來**：41 支的 `branches:` 指向已結束的 feature 分支或 `closed-historical` 哨兵，近 300 次 run 內 0 次執行。可刪除 35 支以減少維護面積，但屬於大範圍刪檔，需單獨一輪。
3. **6 支 PR workflow 的 path filter 少了它們測試實際讀的資料檔**（`catalog.json`／`corpus.json`／`cases/**` 等），內容或排序回歸可能在綠燈下合併。
4. 觀察到一次 CDN 時差：`catalog.json`（`7e70b5f5`）與 `corpus.json`（`fdcd60f8`）在部署後 10 分鐘的 `max-age=600` 視窗內描述不同建置；10 分鐘內自行收斂，本輪重測已一致（`8100024f`）。

## 下一輪最值得做的一件事

**`主題分類` 對 159 個沒有宣告分類的案例頁是依標題猜出來的，卻以「同分類」與篩選選項呈現。** 證據：506 個案例頁中 347 頁有 `- 分類` 行，其餘 159 頁由 `assets/app.js:966-967` 以標題規則填入，最後落到字面值 `個人生產力`；`renderRelated()` 顯示「同分類：個人生產力」，而該頁原文從未出現這個詞。先做的驗證：用 `metadata()` 對 506 頁跑一次，列出 `category` 為推測值的案例清單與其顯示字串，再決定是標示推測（如同 `實作門檻` 的 `data-difficulty-source`）或收斂推測規則。
