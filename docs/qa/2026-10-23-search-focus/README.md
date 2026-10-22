# 搜尋焦點可辨識，也回得去欄位

狀態：實作驗收中，尚未宣稱發布。

## 證據與兩案

目標讀者是用鍵盤回訪長篇案例、想依標題查找補充與限制的人。正式站雲端走查[39861882098](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39861882098)完成1440／390px首頁、旅遊＋生活、詳情、來源新頁、返回與空結果；pageerror空。第一次桌面426／手機427條目，正式站期間資料有更新，不把兩個數字當產品差異。[補充焦點觀察39861980792](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39861980792)確認兩尺寸目錄輸入框已為active且focus-visible，computed outline-style仍為none。主角色已目視手機目錄及桌面詳情。

全域`input{outline:none!important}`蓋過reader既有`input:focus-visible`。主搜尋已有`.search-wrap:focus-within`，不能說主搜尋完全沒有焦點；分類及分享備援先前也有important補救。

- A（採用）：移除全域強制清除outline，僅主搜尋維持容器外框。成本低，既有reader規則即可生效，也避免未來輸入欄位再被全域蓋掉。
- B：只替reader焦點規則加important。成本最低，但延續每個新欄位逐一補洞。

驗收：固定同一基準比較1440／390截圖；Chromium1440／390／320、Firefox390、WebKit390，真實Tab進目錄搜尋時有2px綠框且不被toolbar遮住；找段落、空結果、清空、直鏈重整、來源與返回正常。主搜尋容器／提交按鈕的焦點區辨、分類與兩種手動分享備援保持可見。axe選定WCAG A／AA檢查與水平溢出檢查通過。

不改案例、來源、合格計數、搜尋演算法或排序、品牌、框架、載入架構；不增加依賴、請求、cookies、追蹤或第三方資料傳送。不宣稱真人偏好、轉換率或留存改善。

## 環境與基準

起始d80db40，原目錄分支improve/search-recall-recent-workflows-and-tokenization已有assets/app.js與tests/search.test.cjs未提交修改，保留於原處；隔離分支improve/task-search-20261023，目錄/tmp/ai-task-search-20261023。原目錄修改檔雜湊留存。既有PR #78／79／80不擅自整合。本repo與祖先無適用AGENTS.md；讀取README、SITE、近期QA、preview及Jekyll／Pages規範。

本機config顯示gpt-6.1-sol／medium；無介面核實或切換主會話runtime，不宣稱使用帳號最高設定。獨立角色明確指定工具提供的gpt-6-astra／ultra，此為工具設定而非runtime證明。僅既有訂閱工具與授權GitHub Actions；repo與shell操作在授權工作目錄及隔離目錄，瀏覽器只在GitHub雲端執行，未操作個人GUI或購買服務。

基準node --test為177／178，唯一既有失敗是audit候選來源固定19、實際22；PR #78處理，不混入本輪。全部前端JS語法與python3 scripts/preview.py通過。無獨立lint、TypeScript或npm build設定，preview不等於正式Jekyll建置。

## 驗收證據

[固定基準紅燈39862278433](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39862278433)先實際操作相同案例與鍵盤路徑，確認reader斷言失敗（none != solid），再修改CSS；[red原輸出](checks/red.log)保留。固定基準與新版均為427條目；前後對照使用相同d80db40資料，不拿正式站持續更新的條目數比較。

[首輪預覽39862456073](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39862456073)沒有全數通過：Chromium三尺寸及Firefox390完整通過；WebKit目錄綠框已過，但在空結果→修改關鍵字的即時位置斷言失敗，query焦點存在、wrapper2px綠框，top=-1421.8px。[原報告](checks/first-preview/focus-report.json)與[失敗log](checks/first-preview/failed.log)保留。測試改為最多等2秒觀察原生焦點位置，既不scroll也不focus，之後仍執行原可見性斷言。reduced-motion已使CSS scroll-behavior:auto，不能將根因斷言為CSS平滑捲動。另依獨立審查補上reload後零缺項斷言。

[第二輪39862886809](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39862886809)在有界等待後仍於WebKit同一路徑失敗，不能再當作量測過早。新增原基準WebKit完整路徑紅測試（僅跳過已知目錄外框斷言），精確要求「修改關鍵字」後主搜尋仍在畫面外的失敗。修法限定明確點擊／Enter操作：focus preventScroll、完整select、再instant scrollIntoView置中，不排程額外搶焦點。新版加驗鍵盤啟動、完整選取及兩個frame後可見。

這是本輪『搜尋焦點可辨識、可見』主題的相關復原流程；沒有因此重寫搜尋。復原兩案：明確操作後捲回選取欄位（採用，成本低、結果可驗），或繼續依賴原生focus捲動（程式少，但WebKit實際驗收未過）。

[最終預覽39863505386](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39863505386)成功，驗收產品5cdd871。Chromium1440／390／320、Firefox390、WebKit390皆427條目、頁面例外空、reload零缺項。專項涵蓋目錄真實Tab焦點、2px綠框、找段落Enter、空目錄／清空、來源入口、直鏈重整、Escape回原卡、主搜尋／submit／分類／兩分享備援，及空結果mouse＋Enter復原、完整選取與兩frame後可見；既有task-shortcuts完整回歸包含20次入口啟動／取消、組合條件、直鏈與返回、空結果及loading／error／partial復原。專項15次＋回歸10次axe選定WCAG A／AA均零違規，非完整認證或真人樣本。

原報告：[焦點五配置](checks/preview-focus.json)、[既有流程](checks/preview-regression.json)、[載入復原](checks/preview-lifecycle.json)、[完整單元177／178，僅原audit22／19](checks/preview-unit.tap)。固定原基準的WebKit[精確紅燈](checks/recovery-red/red.log)與[焦點順序](checks/recovery-red/report.json)確認初次query、submit及分類可見，最後空結果復原才離開視窗，沒有把初始搜尋失敗當成目標問題。

主角色已目視桌面／390／320目錄、手機空目錄和WebKit復原，與同基準截圖對照；綠框清楚、無工具列遮擋、文字與清空按鈕分開，未新增頁面橫向溢出。

| 流程 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面目錄焦點1440 | [外框被蓋掉](before/outline-focus-chromium-1440.png) | [2px綠框](after/outline-focus-chromium-1440.png) |
| 手機目錄焦點390 | [外框被蓋掉](before/outline-focus-chromium-390.png) | [2px綠框](after/outline-focus-chromium-390.png) |
| WebKit空結果復原390 | [搜尋欄位仍在畫面外](before/recovery-webkit-390.png) | [回到已選取的欄位](after/recovered-query-focus-webkit-390.png) |

[320px](after/outline-focus-chromium-320.png)／[手機空目錄](after/outline-empty-chromium-390.png)。正式發布另記於下。

## 重跑與預覽

```sh
node --test --test-reporter=tap tests/*.test.cjs
for f in assets/*.js tests/search-focus*.cjs; do node --check "$f"; done
python3 scripts/preview.py /tmp/search-focus-preview/ai-agent-use-cases
python3 -m http.server 8134 --directory /tmp/search-focus-preview
# 在已授權的雲端瀏覽器環境，安裝既有workflow所列Playwright／axe後：
NODE_PATH=<cloud-tools>/node_modules SITE_URL=http://127.0.0.1:8134/ai-agent-use-cases/ node tests/search-focus-browser.cjs
NODE_PATH=<cloud-tools>/node_modules SITE_URL=http://127.0.0.1:8134/ai-agent-use-cases/ node tests/task-shortcuts-browser.cjs
```

預覽保持`/ai-agent-use-cases/` base path。開啟`?case=UC-005`，展開「全部段落」，用Tab進入「依標題找段落」可檢查本輪改善。

三種走查都是自動化模擬，不是真人測試：
1. 首訪由主搜尋進入旅遊＋生活結果，讀案例、核對來源入口、Escape回原卡。
2. 回訪UC-005直鏈與重整，在39段長目錄用鍵盤找獨立審查，Enter定位、找不到的標題、清空並繼續閱讀。
3. 依名稱找分類、長字串空結果復原、搜尋及案例複製被拒時手動複製；既有回歸另外檢查組合條件、載入／錯誤／部分失敗與重試。

產品修改assets/style.css（恢復目錄搜尋外框）與assets/app.js（空結果修改關鍵字時明確捲回選取欄位）；測試新增tests/search-focus-browser.cjs、tests/task-round-observe.cjs及.github/workflows/task-round-qa.yml；本紀錄與SITE.md記錄維護成果。沒有修改案例或索引。

限制：未驗證實體手機、實體輸入法／讀屏器、完整無障礙認證、真人留存、Lighthouse或網路速度。焦點色#285344相對白色的計算對比為8.71:1，相對目錄背景#f5f7ef為8.06:1，這是CSS色值計算，非整站認證。CSS增加88個未壓縮bytes、gzip估算增加47 bytes；JS增加182 bytes、gzip估算增加44 bytes，無新增產品請求；[大小量測](checks/asset-size.json)不當成速度成績。

下一輪最值得做：降低首次開頁全文請求成本，同時保留單篇早讀、全文搜尋與部分失敗復原；本輪不延伸載入架構。
