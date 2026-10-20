# 2026-10-20：可追溯的合格計數

目標讀者是初訪、想判斷案例庫收錄範圍與證據界線的人。本輪只改善計數解讀與更新方式，不重判案例資格、不刪除疑似重複、不改案例原文、搜尋排序或框架。

## 問題、兩案與驗收

基準遠端main `958a1bc`。canonical稽核首批為336／1,000（20:00），INDEX現況段335（19:00）、首頁手填334，三處更新不同步。原有audit測試有兩項失敗，兩項都先在INDEX335對336失敗，尚未走到首頁334斷言：[基準原始輸出](baseline-unit.txt)。全套110項，108過、2失敗；JS語法及Python靜態預覽成功。無獨立lint、TypeScript或npm build。

[雲端正式站基準走查39422235355](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39422235355) 完成1440×1000及390×844的集合搜尋、旅遊＋生活＋Grok Bot、詳情、鍵盤返回、空結果、UC-313直鏈重整與原始來源popup。387條目、所有來源成功、無pageerror或HTTP錯誤：[實際JSON](published-before.json)。已檢視集合與手機結果截圖。該舊observation腳本的before-home圖片實際在reset後的搜尋區，不能當成hero首屏評價；本輪專用腳本另明確回到頁頂與統計區拍攝。

兩案：

- A（採用）：Jekyll從既有Markdown稽核報告擷取首個當前批次，輸出同站小JSON；前端單一parser核對日期與數字。多一個獨立同站請求，但消除首頁人工抄數；需實際Jekyll、失敗狀態與發布驗收。
- B：同步腳本更新首頁與索引的數字。改動較少，但仍需跑腳本、commit產物，部署有機會漏更新。

驗收：數字和時間同出首批；不能取最大日期、最大數字或回退歷史段。算術必須符合目標，未知／錯誤維持「—」，有可讀報告與重試。摘要失敗不阻斷搜尋。手機320、390、桌面1440及鍵盤焦點可用。保留搜尋、組合篩選、空結果、直鏈、返回與來源流程。

## 實作

`audit-summary.json`沿用內建Jekyll `include_relative`與`jsonify`，只輸出首個h2批次原文；Python預覽只模擬同樣段落擷取，不複製數字parser。[Jekyll官方相對include規範](https://jekyllrb.com/docs/includes/)。`assets/audit.js`獨立請求8秒期限，驗證唯一摘要、非負安全整數、合計1,000與真實日期／時間；用textContent顯示，無HTML注入、外部服務、快取持久化或追蹤。不是從網站條目數推算合格數。

首頁補計數核對批次、時區與非全庫重驗說明；保留「未獨立重現、不代表成功率」。報告連結改向GitHub可讀Markdown。INDEX只把現況摘要改成canonical連結，歷史批次保留，避免第三份手填現況。原audit測試對歷史段落的首個頁數擷取不再冒充目前庫存；改驗canonical連結、相同parser與首批值，仍保留表格列數和磁碟案例頁逐筆一致斷言。

先寫parser回歸測試再實作：[紅燈輸出](red-unit.tap)。正常、真實零數、算術錯誤、壞日期、壞字串、歷史段混入及缺資料均有斷言。產品資產沒有新增前端套件。

## 執行環境

原工作目錄`assets/app.js`與`tests/search.test.cjs`的未提交修改完整留在原處；fetch後在`/tmp/ai-discovery-20261020`獨立clone與分支完成。repo與祖先無適用AGENTS.md；已讀README、SITE、Pages設定及前輪紀錄。開始時沒有開啟中的PR。

原規劃用Orca管理隔離工作樹，但`orca skills get orca-cli --json`回報`Unable to determine Orca.app path from symlink: /usr/local/bin/orca`，已停止使用該管理功能，改clone。未啟動個人GUI。所有瀏覽器與Jekyll驗收在既有GitHub Actions執行，Node／Python本機僅操作使用者授權路徑及隔離clone。未另用付費API、購買credits或改登入帳號。

本機Codex設定讀得`gpt-6.1-sol`與`medium`；這不是runtime證明，沒有能查核或切換當前工作階段及帳號模型上限的介面。未宣稱主實作使用最高設定。獨立審查請求可選`gpt-6-astra`／`ultra`，工具接受；審查亦未核實runtime。由主角色唯一實作整合，獨立角色只讀審查。

## 獨立審查補修

獨立角色指出時間regex可回溯，會把`14:44台灣時間補核`或畸形時間當成只有日期，且未知時區不能固定寫成台灣時間。補[日期紅燈](date-red.txt)，再改為完整時間與明確台灣時間格式，畸形或未知時區顯示無摘要。HTML初始態改為直接查看完整報告，JS才切換讀取中，noJS不會永遠等待。

[第一輪雲端39422827034](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39422827034)實際Jekyll成功、原始334與canonical336漂移重現成功；重試成功後focus變body的錯誤確實重現：[原始JSON](retry-focus-red.json)。補修使用aria-disabled與busy guard，不從Tab順序移除正聚焦的重試按鈕；成功後等使用者離開才隱藏它。未放寬焦點斷言，並為故障頁加入pageerror監聽。

## 可重跑的驗證與預覽

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/audit-summary-preview/ai-agent-use-cases
python3 -m http.server 8141 --directory /tmp/audit-summary-preview
# http://127.0.0.1:8141/ai-agent-use-cases/
# 瀏覽器套件只裝在雲端QA，不是網站依賴：
NODE_PATH=<cloud-browser-tools>/node_modules TRUST_URL=http://127.0.0.1:8141/ai-agent-use-cases/ node tests/trust-browser.cjs
NODE_PATH=<cloud-browser-tools>/node_modules READER_SEARCH_URL=http://127.0.0.1:8141/ai-agent-use-cases/ READER_SEARCH_ENGINES=all node tests/reader-search-browser.cjs
```

Python預覽模擬catalog和摘要；正式相容性由本輪QA的`actions/jekyll-build-pages@v1`實際建置及發布後HTTP核對判定。沿用branch Pages source，沒有改部署模式或新增`.nojekyll`。新workflow在canonical報告更新時也執行，避免僅研究資料變更漏跑摘要檢查。

資產[實際位元組計算](asset-sizes.json)：HTML／CSS／新JS共增加3,688個未壓縮bytes，分檔gzip差額合計1,586bytes，另有獨立同站摘要請求；此為檔案量測，不是瀏覽器傳輸速度或Lighthouse分數。沒有加快整庫全文載入的主張。

限制：沒有實體手機、iOS軟鍵盤與真人螢幕閱讀器驗證；axe只涵蓋自動規則。GitHub閱讀報告仍需要網路，無JS時不抄寫合格數、可直接開報告。摘要格式變更會明確顯示無法讀取，不回退歷史數；canonical報告須維持首批為當前、完整摘要與明確台灣時間的規範。

下一輪最值得做：量測全庫全文搜尋在回訪與慢網路下的載入成本，再評估可驗證資料新鮮性的快取；這輪沒有擅自新增持久快取。


手機截圖複核另外發現既有小螢幕`.stats p{display:none}`也隱藏了新增批次與錯誤訊息；前輪innerText與axe通過不代表訪客真的看得到。新增實際可見性斷言與4d43635專用重現，補修`#audit-status`顯式顯示、13px及行距；最終截圖需以補修後版本為準，不沿用隱藏文字版本作完成證據。

## 最終預覽驗收

[完整雲端QA39423904570](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39423904570)驗證`711c3b5`全部成功，包含手機可見性補修。不是沿用前一輪綠燈。

| 驗收 | 實際結果 |
| --- | --- |
| 單元／語法 | 113／113、0失敗；所有assets JS與tests CJS語法通過，[原始輸出](unit.tap) |
| 真正Pages Jekyll | 官方builder成功；首批JSON與預覽段落逐字一致，[實際產物](jekyll-summary.json) |
| 瀏覽器 | Chromium1440／390／320、Firefox390、WebKit390，五配置完成，[JSON](preview.json) |
| 合格與收錄 | 同批336／1,000、2026-10-20 20:00；381主要案例＋3補充＋3待查分開保留 |
| 載入／錯誤／重試 | 五配置404＋搜尋仍可用、鍵盤重試焦點保留；Chromium390另驗壞JSON、算術不符、歷史段混入、8秒逾時 |
| 行動版實際可見 | 正常批次與錯誤文字isVisible、無水平溢位；[原display:none重現](hidden-status-red.json) |
| 無JS | 桌面沒有舊合格數，提示直接查看報告，不持續讀取；未宣稱手機noJS驗收 |
| axe與文字對比 | 本輪11次、既有閱讀回歸10次自動掃描，全部0違規；不是完整無障礙認證 |
| 既有流程 | 搜尋、複合篩選、空結果、詳情直鏈重整、返回焦點、真來源連結、長來源標題／安全渲染，五配置全過，[原始回歸JSON](reader-regression.json) |
| 執行錯誤 | 正常頁及故障頁pageerror收集，五配置均為空 |

前後對照是同一基準`958a1bc`、相同資料與尺寸：

| 畫面 | 改前 | 最終改後 |
| --- | --- | --- |
| 桌面1440×1000 | [手填334](before-desktop.png) | [報告336與核對批次](after-desktop.png) |
| 手機390×844 | [手填334](before-mobile.png) | [可見批次與限制](after-mobile.png) |

另有[320px窄手機](after-small.png)、[摘要錯誤／重試](error-mobile.png)、[實際首頁桌面](home-desktop.png)、[實際首頁手機](home-mobile.png)。主角色逐張檢視最終桌面、390、320與錯誤截圖，確認批次與錯誤文字可見且無新增遮擋。首頁隨機卡片內容本就會不同，不以抽中的內容差異當作本輪改善。

三種具體模擬走查：

1. 初訪想了解案例庫可信範圍：查看合格數和收錄頁數的差別、核對批次、以鍵盤開啟可讀稽核報告。
2. 手機讀者摘要連線失敗：看到未知數與明確錯誤，仍能搜尋旅遊＋生活案例；重試成功後焦點留在原按鈕。
3. 有具體工作問題的回訪者：搜尋薪水、查看命中原文與否定限制、返回結果；再組合篩選、處理空結果、開詳情直鏈並重新整理、開來源，檢查長標題與安全文字。

這些是自動化與模擬走查，不是真人訪談或留存／轉換率成長證據。

變更檔案：`audit-summary.json`、`assets/audit.js`、`index.html`與`assets/style.css`為產品；`scripts/preview.py`模擬摘要；`INDEX.md`移除重複現況；`tests/audit.test.cjs`及`tests/trust-*.cjs`為資料／瀏覽器／發布驗證；`.github/workflows/trust-summary-qa.yml`為雲端QA；`SITE.md`及本目錄保存維護與驗收。原始研究及canonical稽核判定完全未改。
