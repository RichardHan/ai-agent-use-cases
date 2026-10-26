# 組合篩選提交後可返回上一組結果（2026-10-26）

目標訪客：搜尋會議用法後，再組合情境、收錄狀態、門檻與近期核對排序，想比較兩組結果的人。正式站先提交「郵件」，再選狀態與門檻並按「查看結果」，Back 直接跳回更早的「旅遊」；中間的郵件條件被即時 URL 覆寫。390／1440px 的瀏覽器回歸先重現此失敗。

- 方案 A（採用）：即時結果與可分享 URL 不變；只在明確按「查看結果」時將一次編輯中的查詢、篩選與排序合併為一筆瀏覽紀錄。成本：需辨識最近核對入口、直鏈與 Back 的提交邊界。
- 方案 B：每次更換選項都建立一筆紀錄。操作少一步，但多個下拉選擇會讓 Back 逐項退回，鍵盤與手機尤為冗長。

驗收：郵件→狀態＋門檻＋近期排序後一次提交，Back／Forward 還原前後 URL 與控制；詳情 Back 返回該組結果；直鏈重新整理保留條件；最近核對入口後再搜尋能返回最近核對。載入中不提交；空結果、來源、鍵盤焦點與手機無橫溢維持。未改搜尋語意、案例、來源證據、計數與視覺樣式。

| 尺寸 | 正式站修改前 | 本地預覽修改後 |
| --- | --- | --- |
| 390px | [搜尋結果](visitor-before-390-results.png) · [詳情](visitor-before-390-detail.png) | [搜尋結果](visitor-after-390-results.png) · [詳情](visitor-after-390-detail.png) |
| 1440px | [搜尋結果](visitor-before-1440-results.png) · [詳情](visitor-before-1440-detail.png) | [搜尋結果](visitor-after-1440-results.png) · [詳情](visitor-after-1440-detail.png) |

畫面預期相同；改善的是瀏覽器歷史語意。首頁比較：[390 前](visitor-before-390-home.png)／[後](visitor-after-390-home.png)、[1440 前](visitor-before-1440-home.png)／[後](visitor-after-1440-home.png)。預覽：`python3 scripts/preview.py /private/tmp/ai-usecase-round-c && python3 -m http.server 8082 --directory /private/tmp/ai-usecase-round-c`，開啟 `http://127.0.0.1:8082/`。此預覽模擬 Liquid，不等同正式 Jekyll 部署。

基準 `node --test tests/*.test.cjs` 362 過、0 失敗，457 份來源逐 byte 一致；原無 package.json／lint／typecheck 命令。新增回歸先在 390px 失敗：Back 返回「旅遊」而非「郵件」。修正後 `NODE_PATH=/tmp/visitor-round-deps/node_modules ROUND_URL=http://127.0.0.1:8082/ node tests/search-submit-history-browser.cjs` 390／1440 通過；維護中的 `SUBMIT_URL=http://127.0.0.1:8082/ SUBMIT_OUTPUT=/tmp/visitor-submit NODE_PATH=/tmp/visitor-round-deps/node_modules node tests/search-submit-browser.cjs` Chromium 1440／390／320、Firefox 390、WebKit 390 通過，五次 axe WCAG 2/2.1 AA 零違規。三種情境：會議＋工作＋用法靈感得 16 筆、UC-094 來源固定於 SHA 並可返回；旅遊查詢與門檻篩選可 Back／Forward；不存在字詞顯示空結果，無橫向溢出。前後桌面／手機各無 pageerror。獨立審查指出最近核對基線與舊 browser 驗收衝突，已修正並重跑；正式站尚待合併部署。來源外鏈 HTTP 在部分配置回 429，不能稱已讀到來源內容；未實機驗證或量測轉換率。

下一輪優先處理 Actions 發布驗收的 fail-open freshness 判斷與部署競速；不要把公開站舊 SHA 的輪詢失敗當作產品回歸。
