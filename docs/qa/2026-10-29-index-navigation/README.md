# 慢載入時的索引導覽

對象：案例載入慢、改用不依賴 JavaScript 的靜態索引的訪客。正式站 390px 實測，主要案例表標題距頁頂約 19,637px；訪客先遇到大量歷史研究紀錄。方案 A 將研究紀錄拆頁，閱讀清楚但影響維護與既有連結；方案 B（採用）保留紀錄，在頁首提供案例、補充及待查三個穩定章節連結。未改案例、計數、搜尋、來源或研究內容。

驗收：不執行 JavaScript 時，在 390／1440px 以鍵盤啟用三個連結並到達相應段落；既有標題與連結不改。索引仍不提供全文搜尋或篩選。這是模擬檢查，不代表真人偏好或轉換率。

| 畫面 | 修改前正式站 | 修改後本機 Kramdown 預覽 |
| --- | --- | --- |
| 手機 390px | [前](before-mobile.png) | [後](after-mobile.png) |
| 桌面 1440px | [前](before-desktop.png) | [後](after-desktop.png) |

回歸先紅：`node tests/index-navigation-browser.cjs` 對修改前正式站找不到「直接看案例列表」。以 Kramdown GFM 渲染本次 `INDEX.md`、套用正式站樣式後，以 `INDEX_URL=http://127.0.0.1:8199/ai-agent-use-cases/INDEX.html node tests/index-navigation-browser.cjs` 驗證，兩種尺寸、三個連結和鍵盤操作通過。390px 首屏文件寬與視窗寬均 390px。預覽以 Kramdown 模擬，不是完整 Jekyll build，正式發布後仍需驗證。

`node --test tests/*.test.cjs` 368／368 通過；`node --check assets/app.js` 與 `node --check assets/reader.js` 通過；`python3 scripts/check_corpus_bundle.py /tmp/visitor-quality-next-preview/ai-agent-use-cases`：461 來源逐 byte 一致。獨立審查未發現缺陷，指出尚未驗證螢幕閱讀器及跳轉後 Tab 順序。

另在獨立首頁預覽執行 `SITE_URL=http://127.0.0.1:8200/ai-agent-use-cases/ QA_OUT=/tmp/index-navigation-journey node tests/search-focus-browser.cjs`：Chromium 1440／390／320 與 Firefox 390 通過搜尋加情境篩選、來源與返回、長詳情直鏈重載、空結果及焦點／axe 檢查；WebKit 390 在第一個 Tab 預期 `search-submit` 實際為 `filter-summary` 時失敗，後續未跑，不推定原因。本機 macOS 的大小寫不敏感檔案系統使 `INDEX.html` 與 `index.html` 相撞，因此索引與首頁使用不同預覽目錄；不可把這個本機預覽當成 Pages 的路由驗證。

Actions：主分支 Search relevance QA #40717156942 在 Pages 排隊超過輪詢窗口時失敗；使用既有授權帳號重跑失敗工作，第二次成功。另有分支處理發布等待，本輪不覆蓋其工作。
