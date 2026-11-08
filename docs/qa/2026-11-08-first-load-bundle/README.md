# 2026-11-08 弱網首次載入：整包全文只被固定 5 秒計時器誤殺

基準 `origin/main` `f10701be028ac600c088987db5da94f620094767`。原工作樹（`improve/visitor-source-orientation-20261027`）有他人未提交的修改，本輪全程在隔離 worktree 操作，未動原工作樹。

## 問題與證據

首次載入會先抓 `catalog.json`（27 KB），再嘗試用單一 `corpus.json`（3.3 MB 未壓縮／1.29 MB gzip）取代 507 個來源檔。但整包只給 **固定 5 秒**（`assets/app.js` `Math.min(options.bundleTimeout||5000, …)`）。1.29 MB 在 1.6 Mbps（fast 3G）至少要 6.4 秒，於是整包必定被放棄，改為 507 個獨立 `fetch`（並發 16），而總載入預算只有 20 秒。

本機以 Pages 相同的 gzip 內容、CDP 限速實測（Chromium 390×844，509 筆）：

| 連線 | 修正前 | 修正後 |
| --- | --- | --- |
| 無限速 | 1,071 ms／11 請求／1,405 KiB／509 筆 | 1,075 ms／11 請求／1,406 KiB／509 筆 |
| fast 4G（4 Mbps） | 3,349 ms／11 請求／1,405 KiB／509 筆 | 3,344 ms／11 請求／1,406 KiB／509 筆 |
| fast 3G（1.6 Mbps） | **20,952 ms／492 請求／2,981 KiB／481 筆（26 檔未載入）** | **7,950 ms／11 請求／1,406 KiB／509 筆** |
| slow 3G（400 kbps） | 23,337 ms／124 請求／1,927 KiB／112 筆 | 23,330 ms／188 請求／2,056 KiB／176 筆 |

正式站同樣重現（Chromium 390×844、fast 3G，2026-11-08 05:5x UTC）：首張卡 **19,091 ms**、**518 個請求**、3,176 KiB；即弱網訪客在 19 秒內看不到任何案例卡，且多付約 500 個請求。

影響：捷運、行動熱點、旅館 Wi-Fi 等 1–2 Mbps 環境的首次訪客，在 20 秒內只看到「正在讀取案例…」，同時把整包已下載的位元組丟掉重抓，並有機會得到不完整語料（481/509，26 個來源檔未載入）。

## 方案

- 方案 A：把固定 5 秒改成固定 12–15 秒。實測 fast 3G 可恢復完整語料，但 slow 3G 會把時間耗在註定讀不完的整包上（實測 112 → 36 筆），等於用最慢連線的完整性換快網路的速度。
- 方案 B（採用）：保留 5 秒作為「完全沒有回應」的守門，一旦開始收到位元組，就以**實測速率**判斷整包能否在總預算內完成：
  - `bundleFits()`：`目前時間 + 剩餘位元組/實測速率 + 1.5 秒解析保留 < 總截止時間` 才繼續等待。
  - 串流讀取期間每收到一塊就重設 4 秒停滯計時器，連線中途停住不會吃掉整個預算。
  - 判斷無法在期限內完成就立即切換逐篇讀取，把剩下的時間留給 fallback。
  - `fetch()` 給的是解壓後的位元組，而 `content-length` 是壓縮後大小；以同一伺服器 `catalog.json` 實測的壓縮比換算後才比較，避免把速率算快 2–3 倍。
  - `content-length` 缺失時改用「最多 60% 總視窗」代替速率推算；瀏覽器沒有 `ReadableStream` 時，維持原本 `response.json()` 與固定計時器行為。

只改 `assets/app.js` 的整包讀取路徑；未動案例資料、搜尋、排序、篩選、快取鍵或發布版本核對。

## 截圖（同資料、同 gzip 伺服器、同 fast 3G 限速、第 12 秒）

| 尺寸 | 修正前 | 修正後 |
| --- | --- | --- |
| 桌面 1440×900 | [修正前](before-desktop-results-fast3g.webp) | [修正後](after-desktop-results-fast3g.webp) |
| 手機 390×844 | [修正前](before-mobile-results-fast3g.webp) | [修正後](after-mobile-results-fast3g.webp) |

第 12 秒時修正前為 0 張卡、`已處理 174 / 507 個來源`、`正在讀取案例…`；修正後為 25 張卡、`顯示 509 / 509 筆收錄`、`已處理 507 / 507 個來源`。首張卡出現時間：桌面 7,737 ms、手機 7,702 ms（修正前 12 秒內都沒有）。

## 驗收指令與結果

- `node --test tests/*.test.cjs` → **465 pass / 0 fail**（新增 6 項：速率可完成時不提前放棄、速率不可能完成時提早讓位、停滯時放棄、無 `content-length` 時只保留 60% 視窗、壓縮長度需先換算成解壓位元組、跨 chunk 的中文內容不破字）。
- `node --check assets/app.js`（含全部 `assets/*.js`、`tests/*.cjs`）→ pass。
- `tests/loading-budget-browser.cjs`（Chromium 桌面／390／320、Firefox 390、WebKit 390）→ 通過；全站請求卡住時仍在 20,516–20,577 ms 收斂、佇列請求 32 個上限不變；部分載入 508 → 重試 509；axe 0 違規。
- `tests/load-recovery-browser.cjs`（Chromium 桌面／390／320）→ PASS：partial／only-failed／zero-success／incremental／pending／filter／empty／focus／direct-link／refresh／reading-return，508 → 509，axe 0 違規。
- `tests/corpus-browser.cjs` → 509 筆、`requests 11`、`markdownRequests 0`、`readyMs 415`（桌面）／`232`（手機）、axe 0 違規。
- 限速實測（`Network.emulateNetworkConditions`，同 gzip 內容）：上表；最終版本重跑 fast 3G 7,923 ms、fast 4G 3,352 ms、slow 3G 23,330 ms／176 筆，前兩者皆 11 請求、509 筆。
- 兩項新增測試做過反向驗證：把 `bundleFits` 改成永遠回 true 會讓 2 項變紅；忽略壓縮比換算會讓壓縮長度那項變紅。

## 已知限制

- 量測是本機 M2 + Chromium 的 CDP 限速，不是真實行動裝置或正式站多區域 CDN；正式站 fast 3G 的 19,091 ms 是本輪唯一的正式站基準。
- slow 3G（400 kbps）仍無法在 20 秒內載完 1.29 MB，仍會顯示部分載入並揭露未載入檔案數；本輪只讓它多拿到 57% 的來源（112 → 176），沒有改成漸進渲染。
- 壓縮比取自 `catalog.json` 的實測值，`corpus.json` 的實際壓縮率略有差異；此估算只用於「要不要繼續等」，不影響任何資料內容。
- 無法在本環境檢視截圖像素（工具停用圖片讀取），視覺證據以同條件 DOM 狀態與數值比對為準；截圖僅供人工核對。
- 未做真人使用者研究；以上為工程與瀏覽器量測。
