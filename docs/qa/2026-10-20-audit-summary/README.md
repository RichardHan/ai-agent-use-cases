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
