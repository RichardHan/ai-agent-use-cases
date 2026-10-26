# 2026-10-26 內文相對來源連結固定版本

目標：從問題搜尋進入案例、在慢載入或版本未核對時閱讀原文的訪客。UC-001 的 `[S-001](../sources/README.md#...)` 在 `assets/app.js` 原先由 `safeLink()` 直接組成 `blob/main`；同一頁的「原始 Markdown」已因版本未核對停用，兩種來源入口卻互相矛盾。這是程式與真實案例資料可重現的缺口，不表示目前正式站通常載入就有版本錯配。

- 方案 A（採用）：相對連結保留文字與鍵盤可見位置，在該篇原文與整包版本核對前不給 `href`；核對後一併固定到發布 SHA。成本是等待時不能開啟站內研究紀錄，但不會誤讀可變的 main。
- 方案 B：另做站內研究來源閱讀器。可讓核對前直接閱讀，卻須處理來源索引、錨點與長文導航；本輪不採用。

驗收：未核對的 UC-001 內文相對連結及原始 Markdown 都不能導向 `main`；核對後兩處都指向相同 commit，複製／重繪的閱讀 DOM 也更新；絕對外部來源仍可開啟，危險 scheme 仍不成連結。搜尋、組合篩選、空結果、詳情直鏈、返回及來源導覽不改語意。範圍不含改動案例資料、搜尋排名、CDN 混版時的可用性復原。網站條目 454 與合格案例數仍分開。

| 390px | 1440px |
| --- | --- |
| [版本未核對狀態](2026-10-26-relative-before-mobile.png) → [核對後](2026-10-26-relative-after-mobile.png) | [版本未核對狀態](2026-10-26-relative-before-desktop.png) → [核對後](2026-10-26-relative-after-desktop.png) |

截圖在同一修改後預覽中以 `pinnedSources.clear()` 模擬等待，再用已核對的 `c010992` 更新來源連結；不是正式站不同版本的視覺對照，也不代表真人評價。預覽：`python3 scripts/preview.py /tmp/visitor-relative-preview/ai-agent-use-cases && python3 -m http.server 8931 --directory /tmp/visitor-relative-preview`，開啟 `http://127.0.0.1:8931/ai-agent-use-cases/?case=UC-001`。此預覽不是正式 Jekyll 建置。

基準 362 單元通過；新增回歸先重現 `blob/main` 斷言失敗，修正後 362 單元通過。`node --check` 全部 assets/tests JavaScript 通過；預覽 452 來源逐 byte 相同。瀏覽器 390px 直鏈 UC-001 實測兩個相對連結在未核對時均無 href，核對後均為同一 `c010992` SHA；桌面 1440px 未核對也均無 href，390px 無水平溢出。相對連結之 `data-source-relative` 會隨 DOM clone 保留，讓晚到版本更新能涵蓋原文兩份呈現。

獨立 reviewer 找到 `https:../sources/...` 可借同源 base 繞過版本核對；已要求 HTTP(S) 明確 authority，補未核對／核對後及 renderer 回歸，覆核無剩餘 blocker。既有 `source-guide-browser.cjs` 在本環境因缺少 `playwright` 模組未啟動，不能列為通過；上述桌面／手機由受管理 Chromium 預覽實走，非 Firefox／WebKit 或實機。
三種模擬走查：① 桌面搜尋「旅遊」＋生活得到 20／454，打開 UC-001 後來源與內文相對連結固定同一 SHA，Escape 返回保留搜尋與情境且焦點回閱讀卡；② 同篩選輸入不存在的任務詞得到 0／454；③ 390px UC-001 直鏈模擬版本未核對，兩個複製呈現的 S-001 連結均無 href，核對後均恢復固定版。這些是功能檢查，不是真人轉換率或喜好研究。

風險：正式 Pages 新 SHA 仍須合併後部署驗證；混版時停用相對研究連結是保守選擇，與目前停用原始 Markdown 一致。下一輪最值得調查混合 catalog/corpus 版本時，能否安全回退逐篇讀取，而非永久停用來源。
