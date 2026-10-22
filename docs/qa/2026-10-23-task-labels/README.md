# 常用搜尋入口：先知道會找什麼

狀態：預覽驗收及獨立審查成功，待正式發布核對。

## 問題、方案與範圍

目標讀者是初次從搜尋面板探索的新訪客。正式站雲端[基準39836510959](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39836510959)在1440／390px走過首頁、四入口、旅遊＋生活組合搜尋、UC-001詳情、來源筆記新頁、返回與空結果，423條目，pageerror皆空。主角色已目視桌面與手機入口、首頁與詳情；[原始報告](checks/baseline-browser.json)。

四個原標籤「每日自動／收件匣整理／比價防漏／排程巡檢」實際只送出「每日／收件匣／比價／排程」的全文及同義詞搜尋，得到106／127／47／208筆。比價結果含促銷信重寄修復與折扣營收核對，收件匣含信箱遷移；每日含每日100封上限的限制，不等於每日自動化。這些可以是合法全文命中，但原標籤容易使人當成已分類、可完成該任務的清單。統計不代表人工相關性、成功率或獨立驗證。

- A（採用）：沿用關鍵字搜尋，群組改「常用搜尋」，四按鈕顯示實際查詢字詞，明示全文及相關詞包含來源與限制、命中不代表已實作或驗證。成本低，可立即校準期待；仍需讀者核對內容是否適用。
- B：人工建立任務分類及案例對應。更能直接從問題選案，但需逐案判讀與持續維護，本輪不足以可靠覆蓋全庫，成本較高。

驗收：名稱與查詢對應；四查詢結果ID與順序不變；篩選保留、再次取消、結果定位、詳情直鏈重整、來源連結與返回正常；空結果／載入／錯誤／部分失敗可復原；1440／390／320px文字不截斷、不橫溢，鍵盤與對比檢查通過。

不處理案例、重複候選、來源證據分類、合格計數、搜尋演算法或同義詞、人工任務分類、全文載入架構及品牌。未增加依賴、請求、追蹤、cookies、登入或第三方資料傳送。產品只修改index.html文字，既有資料屬性、ARIA關聯與流程保留。

## 畫面與預覽

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440 | [任務名稱與查詢不同](before/tasks-1440.png) | [明示搜尋字詞與範圍](after/tasks-1440.png) |
| 手機390 | [原入口](before/tasks-390.png) | [自然換行與完整說明](after/tasks-390.png) |

正式預覽：https://richardhan.github.io/ai-agent-use-cases/#explore 。預覽建置需維持`/ai-agent-use-cases/`base path：

```sh
python3 scripts/preview.py /tmp/task-label-preview/ai-agent-use-cases
python3 -m http.server 8134 --directory /tmp/task-label-preview
```

瀏覽`http://127.0.0.1:8134/ai-agent-use-cases/`。本輪主角色沒有操作本機瀏覽器，實際瀏覽及截圖都在GitHub雲端。

## 測試與三情境

```sh
node --test tests/task-labels.test.cjs tests/task-shortcuts.test.cjs tests/task-entry.test.cjs
node --test --test-reporter=tap tests/*.test.cjs
for f in assets/*.js tests/task-labels*.cjs; do node --check "$f"; done
git diff origin/main --check
NODE_PATH=<cloud-tools>/node_modules node tests/task-labels-browser.cjs
NODE_PATH=<cloud-tools>/node_modules node tests/task-shortcuts-browser.cjs
```

原基準175／176通過，唯一失敗為既有audit的固定19／實際21；既有PR #78處理該議題，本輪不混入。[基準輸出](checks/baseline-unit.log)。新測試先在舊HTML重現2項ERR_ASSERTION，[red](checks/red.tap)；修後相關9／9通過，全套177／178，仍只同一既有audit失敗，[完整輸出](checks/unit.tap)。無獨立lint、TypeScript或npm build設定；語法檢查不稱lint/type check，preview不稱正式Jekyll建置。保存log僅清行尾空白，原失敗與數據保留。

三種走查均為自動化模擬，非真人研究或留存改善證明：
1. 新訪客閱讀搜尋範圍，鍵盤啟動四常用搜尋，看到結果與目前條件，按相同按鈕取消。
2. 使用工作＋Grok Bot＋頁首最近核對組合搜尋收件匣，讀詳情、開來源、返回原卡，分享直鏈重整仍保留條件。
3. 保留矛盾的收錄狀態與來源條件搜尋比價，進入空結果後回到關鍵字或全部重設；另外模擬載入中、目錄錯誤與單來源失敗，驗證選擇保留與重試。

## 環境、獨立審查與限制

起始398361d；讀取README、SITE、維護規則、近期QA、catalog／preview與Pages部署規範，無適用AGENTS.md。Pages為legacy/main根目錄。原工作樹兩個未提交搜尋修改保留於原分支，不reset、不強推；隔離分支`improve/reading-round-20261023`、工作目錄`/tmp/ai-reading-round-20261023`。既有PR #78／79／80不混入。主角色唯一整合者，獨立角色唯讀review。

使用OpenAI Docs skill及[官方設定說明](https://learn.chatgpt.com/docs/config-file/config-basic)；本機config為`gpt-6.1-sol / medium`，無法讀取或切換主會話runtime，無法證實帳號最高模型／推理強度。獨立角色指定工具提供的`gpt-6-astra / ultra`，也不當成runtime證明。僅使用既有訂閱工具與授權GitHub Actions，不另付費API、不購買credits。專案檔案與shell操作在授權目錄／隔離工作目錄，未操作個人GUI。

未驗證真手機、輔具完整認證、真人理解或留存。未跑Lighthouse，不提供虛構分數。HTML由16,378增至16,483 bytes，gzip由5,554增至5,579 bytes，[大小量測](checks/html-size.json)；沒有新增產品請求，也沒有速度改善主張。下一輪最值得做：降低首次全文請求成本，保留單篇早讀及部分失敗復原；人工任務分類另需逐案核對。


測試工具修正紀錄：[39837853148](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39837853148)明確失敗於全頁同名按鈕定位（51個結果），[原始log](checks/first-browser-failed.log)與[未完成報告](checks/first-label-report.json)保留，未計為通過。主角色將測試範圍限於入口容器，沒有刪除名稱斷言。獨立審查另外發現axe不適用隱含context的測試工具缺陷，改用明確context；未把尚未執行到的axe當作該run首個錯誤。舊catch只設exitCode可能留下browser，已改立即退出並加步驟逾時。39836838137／39836934178較早版本仍執行中，取消API403（需admin），沒有更改權限或要求額外登入；這些run不作通過證據。

獨立唯讀審查以398361d與a4a1a21兩份真實parse/filter/order及原始資料，比對四查詢×七組條件×兩排序共56組，結果ID與順序完全相同；app.js逐byte相同。另跑task-shortcuts／task-entry／relevance／task-labels共14項針對測試全過，產品diff只有HTML文字，無新增請求、儲存或依賴。獨立角色已目視新版1440／390／320入口、Chromium與WebKit詳情長文，並核對原報告；最終結論「可合併，未發現產品阻擋」。正式站資產與流程另驗。


[最終預覽39838046831](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39838046831)成功：[三尺寸標籤報告](checks/preview-labels.json)、[五配置流程](checks/preview-browser.json)、[載入復原](checks/preview-lifecycle.json)。Chromium1440／390／320、Firefox390、WebKit390，423條目無缺項、pageerror空，20次入口啟動與取消、組合篩選、詳情、直鏈重整、返回、空結果復原及loading／error／partial通過。三尺寸新入口axe3次＋五配置結果／空結果axe10次均0違規，涵蓋WCAG A／AA選定規則，非完整認證。[320px圖](after/tasks-320.png)與[手機詳情](after/detail-chromium-390.png)已由主角色目視，文字完整、無重疊與水平溢出；長標題沿用真實案例。外部Reddit來源新頁HTTP403保留，這只證明能開啟來源網址，未宣稱已讀到外部原文。
