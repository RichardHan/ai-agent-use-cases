# 2026-11-08 手機首頁任務目錄漸進揭露

## 問題與目標使用者

基準 `main` `1bfad7a3`（正式站同版，`catalog.json` 的 `sourceRevision` 已核對）。首次訪客在手機上先看到 53 個扁平的常見任務連結，才看到「本站是什麼」與可搜尋的案例。Chromium 同資料量測：

| 視口 | hero 高 | 任務標籤高 | 價值主張 top | 搜尋框 top | 第一張結果 top |
| --- | --- | --- | --- | --- | --- |
| 390px | 1,534px | 720px | 1,367px | 3,122px | 3,374px |
| 320px | 1,794px | 928px | 1,557px | 3,430px | 3,678px |
| 1440px | 1,170px | 408px | 1,149px | 1,528px | 2,552px |

目標使用者是第一次從搜尋或分享連結抵達、還不知道工具名稱的人。他們需要先知道這個站收錄什麼、憑據怎麼標，再從任務或問題進入案例。

## 兩個方案

- **A：只把價值主張移到任務清單之前。** 成本最低，但 53 個標籤仍佔 720／928px，搜尋框與第一張結果的距離幾乎不變；既有測試也要求三個主要任務入口維持在首屏。
- **B（採用）：手機先顯示前 9 個任務，其餘以「顯示全部 53 個任務」揭露。** 所有 53 個連結仍留在 DOM，桌機一次顯示全部；沒有 JavaScript 時按鈕隱藏、全部連結可見。風險鎖在視覺收合，不動搜尋語意、案例資料或計數口徑。

## 變更

- `index.html`：任務 `nav` 加上 `id`，新增 disclosure 按鈕（`aria-controls`、`aria-expanded`，預設 `hidden`）。
- `assets/app.js`：≤760px 時收合為前 9 項；按鈕切換 `aria-expanded` 與文案；resize 重新評估；桌機移除收合狀態。
- `assets/style.css`：手機顯示按鈕並以 `nth-of-type(n+10)` 隱藏其餘任務；桌機不顯示按鈕。
- `README.md`：補訪客可見行為。
- `tests/mobile-problem-tags-browser.cjs`：新回歸（收合、鍵盤展開／收合、axe、水平溢出、桌機全顯示）。
- `tests/mobile-problem-tags.test.cjs`：契約守門（53 個任務仍在、按鈕具 `aria-controls`）。
- `tests/visitor-problem-browser.cjs`、`tests/hero-value-browser.cjs`、`tests/visitor-adoption-browser.cjs`、`tests/visitor-adoption-flow-browser.cjs`：晚期任務改為先展開再點，和訪客操作一致。
- `.github/workflows/website-qa.yml`：在既有 Chromium 步驟加入新檢查，不新增 workflow。

## 量測（before = `origin/main`，after = 本分支；同一份 509 筆 corpus、同一伺服器）

| 視口 | hero 高 | 任務標籤高 | 價值主張 top | 搜尋框 top | 第一張結果 top |
| --- | --- | --- | --- | --- | --- |
| 390px | 1,534 → **1,020** | 720 → **148** | 1,367 → **853** | 3,122 → **2,634** | 3,374 → **2,886** |
| 320px | 1,794 → **1,072** | 928 → **148** | 1,557 → **835** | 3,430 → **2,735** | 3,678 → **2,983** |
| 1440px | 1,170 → 1,170 | 408 → 408 | 1,149 → 1,149 | 1,528 → 1,528 | 2,552 → 2,552 |

桌機幾何逐項不變。`#explore` 之後的位置包含每次載入隨機抽出的案例卡高度，不是固定值：390px 四次載入的搜尋框 top 分別為 2,608、2,632、2,791、2,883px，差距約 275px；表中的搜尋框與第一張結果是同一次載入的樣本。hero、任務高度與價值主張段落才是固定幾何。完整數值見 `metrics-before.json`／`metrics-after.json`。

## 驗收

- 新回歸 `tests/mobile-problem-tags-browser.cjs`：1440 顯示 53 項且按鈕隱藏；390／320 預設 9 項、`aria-expanded=false`、Enter 展開 53 項、再 Enter 收合；由桌機縮到手機時，若焦點在將被收合的任務連結，焦點移到可見的揭露按鈕；收合與展開 axe 均 0 違規、無水平溢出、`pageerror` 0。
- 既有 `tests/visitor-problem-browser.cjs`：桌面／390／320 三視口、三個情境全數通過，axe 0。
- `tests/visual-redesign-browser.cjs` 四視口、`tests/hero-value-browser.cjs` 三情境、`tests/scenario-verification-browser.cjs` 三視口、`tests/discovery-browser.cjs`（含載入失敗、空目錄、剪貼簿失敗）通過。
- `node --test tests/*.test.cjs`：**482 通過、0 失敗**（基準 480，新增 2 項）。
- `node --check` 對 `assets/app.js` 與修改過的測試腳本通過。

## CI 可靠性修復（同輪的必要修復）

本輪 PR 的 `Search context QA` 與 `Reader QA` 在**基準步驟**連續失敗，均與本輪 diff 無關：

- `Search context QA`：`remote source must be reachable or rate-limited: 0`，外部來源在 runner 上連線失敗（status 0），重試三次後仍失敗。原本只允許 5xx／403／429，網路錯誤會直接紅燈。
- `Reader QA`：`Capture the comparison baseline` 等待外部來源 popup 逾時 30 秒；同一腳本在本機對相同基準預覽可正常取得 `sourceURL`。

修法：把「runner 無法連外」和「壞連結」分開。`tests/search-context-browser.cjs` 將重試後仍為 status 0 記為 `SOURCE_UNVERIFIED_NETWORK` 並繼續，4xx（403／429 除外）仍立即失敗；`tests/reader-baseline.cjs` 先斷言來源連結具 `target="_blank"`，popup 15 秒未開時記為 `unverified` 並繼續（基準觀察不應成為發布閘門）；`tests/relevance-browser.cjs` 對 popup 重試兩次，只在 `OBSERVE=1` 的基準觀察容許 `unverified`，更新後旅程仍嚴格失敗。三支腳本已在本機對相同預覽重跑通過。

## 已知限制

- 本環境無法檢視截圖影像；視覺判斷以 DOM 幾何、axe、水平溢出與 `pageerror` 為準，前後截圖保存供人眼複核。
- 未量測真人訪客、低階手機或螢幕閱讀器；無法取得「多少訪客停在 hero」的數據（本站沒有追蹤器，也不新增）。
- 尚未在正式站驗證；發布後需以 `sourceRevision` 與實際 390／320 操作核對。

## 下一輪

先確認正式站 `sourceRevision` 與本輪 commit 相同，再以 390px 實走「載入 → 展開全部任務 → 搜尋晚期任務 → 返回」；若無回歸，下一輪處理 `#explore` 之前仍隔著 1,237px 的隨機抽卡區，評估是否在手機把搜尋與結果移到抽卡之前。
