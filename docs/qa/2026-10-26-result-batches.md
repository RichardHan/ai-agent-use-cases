# 結果列表分批閱讀（2026-10-26）

目標讀者：首次從情境或搜尋進入案例庫、在手機上掃描大量結果的人。正式站 390px 無條件首頁一次建立 454 張結果卡、2,263 個結果區按鈕，頁面高約 260,199px；即使只想看第一批，也要承受完整 DOM 與極長捲動。這是實際 DOM 量測，不是載入時間或轉換率證據。

- 方案 A：只用 CSS 限制高度或折疊結果。實作較快，但仍建立全部卡片，鍵盤與輔助技術仍需穿過大量控制項。
- 方案 B（採用）：每次顯示 24 筆，保留完整命中總數和明確的「再看」按鈕；搜尋、篩選、排序改變時從第一批開始。成本是新增分批狀態與歷史返回焦點處理。資料、排序、案例總數與來源不變。

驗收：初始結果為 24 張，454 筆總數不被誤寫為 24；鍵盤可逐批載入，末批按鈕隱藏前移交焦點；第 31 筆詳情 Back／Forward／關閉回原卡片；搜尋加生活篩選、空結果、UC-001 直鏈重新整理和來源連結不退化；390/1440px 無水平溢出。不處理全文搜尋品質、來源資料、資格數或抽卡演算法。

| 尺寸 | 修改前正式站 | 修改後本地預覽 |
| --- | --- | --- |
| 390px 首頁 | [before-mobile](2026-10-26-result-batches-before-mobile.png) | [after-mobile](2026-10-26-result-batches-after-mobile.png) · [列表末端按鈕](2026-10-26-result-batches-after-control-mobile.png) |
| 1440px 首頁 | [before-desktop](2026-10-26-result-batches-before-desktop.png) | [after-desktop](2026-10-26-result-batches-after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-round-preview/ai-agent-use-cases`，再執行 `python3 -m http.server 8100 --directory /tmp/visitor-round-preview`，開啟 `http://127.0.0.1:8100/ai-agent-use-cases/`。本地預覽並非已發布 Pages 版本。

基準 `node --test tests/*.test.cjs` 為 362 pass／0 fail。新增瀏覽器回歸在修改前以 `454 !== 24` 失敗；首輪修改後獨立審查指出末批隱藏按鈕及跨歷史返回焦點兩項缺陷，歷史缺陷回歸先以焦點 `undefined` 失敗，修正後 390/1440px 瀏覽器情境通過。`node --test tests/*.test.cjs` 修改後 362 pass／0 fail；`node --check` 全部 assets JS 與 tests CJS 通過；預覽的 452 來源檔逐 byte 一致。無獨立 lint/typecheck 或本機 Jekyll Gemfile。

模擬走查（非真人評價）：① 無條件首頁 24 筆→鍵盤逐批至末筆；② 第 31 筆詳情→Back→換搜尋→Forward→關閉回原卡；③「旅遊」＋「生活」→UC-001 直鏈重載→來源仍可開→返回搜尋→無結果。預覽 390px 高約 15,899px、1440px 高約 6,733px，皆無水平溢出；這些是 DOM/頁面高度，非效能分數。Chromium 390px axe-core WCAG 2/2.1 A/AA 掃描：0 violations、24 passes、2 incomplete（須人工確認，非零風險）。近期 `78c7cef` 的 Actions 有既有 published gate 與 browser gate 紅燈，不能由本地通過推定發布成功；合併後須檢查 Pages 工作流及正式站資產。下一輪優先處理自然問句與搜尋相關性的可解釋性，而非再改配色。
