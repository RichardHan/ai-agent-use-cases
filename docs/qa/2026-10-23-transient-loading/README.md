# 2026-10-23 暫時失敗來源自動補讀一次

## 問題、兩案與驗收

正式站桌面與手機完整走查首頁、搜尋「旅遊」＋生活、詳情、來源popup、Escape返回、UC-366直鏈／重新整理與空結果。第一輪39915175505桌面5個／手機1個來源未載；補HTTP診斷的[39915421877](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39915421877)桌面8個Markdown回503、Retry-After為0，434筆／5,662ms；手機下一次442筆完整／730ms。這是不同載入快照，不能當改善前後效能比較，亦不能證明伺服器根因。原始[診斷](observed/report.json)與[桌面](observed/partial-1440.png)／[手機](observed/partial-390.png)截圖保留。

目標是首次訪客與分享單篇讀者：單次暫時失敗不應直接讓可恢復案例退出搜尋。原文提示詞已可換行且沒有溢出，獨立角色掃描17個fenced blocks皆為自然語言提示詞，故不為分支暫名硬改程式碼區塊。

| 方案 | 適用與取捨 | 成本 |
| --- | --- | --- |
| A 強化既有手動補讀提示 | 不增加請求，持續故障時有用；單次暫時失敗仍須訪客自己操作 | 低 |
| B 暫時失敗有界自動補讀一次（採用） | 直接處理實際503；額外請求只限失敗來源，持續故障仍回原手動復原 | 中 |

驗收：408／429／500／502／503／504、fetch或body網路錯誤可補讀一次；404等永久HTTP、解析錯誤、單源逾時、全輪期限及使用者取消不重試。最短等500ms，遵守Retry-After秒數／HTTP-date；大於2秒就交回原手動復原，不縮短伺服器等待。12秒單源、20秒整輪期限皆包含等待且不重置。每來源只完成一次進度與內容發布，並行上限／結果順序保留；共享單篇成功即可閱讀，背景補讀不搶焦點。重試仍失敗誠實列入failedPaths。

本輪不改案例、來源、證據分類、合格計數、搜尋語意、品牌版面、框架或部署方式；不做整庫打包／快取。沒有產品新依賴、追蹤器、cookie、登入或第三方傳送。

## 實作與測試

僅`assets/app.js`變動產品：`sourceRetryDelay`、可取消等待，以及loadCorpus的opt-in單次補讀；只在首次載入啟用。手動「重試未載入來源」本身仍是一次明確操作，不再自動重試。逾時AbortController沿用原實例；解析在網路重試區塊之外。

```sh
node --test --test-reporter=tap tests/*.test.cjs
node --test --test-reporter=tap tests/transient-loading.test.cjs
for f in assets/*.js tests/transient-loading*.cjs; do node --check "$f"; done
git diff 3494ed9 --check
python3 scripts/preview.py /tmp/transient-preview/ai-agent-use-cases
python3 -m http.server 8178 --directory /tmp/transient-preview
SITE_URL=http://127.0.0.1:8178/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/transient-loading-browser.cjs
```

基準[189／189](checks/baseline.log)；先補8項回歸，原版[3過5失敗](checks/red.tap)，實作後[8／8](checks/green.tap)，[全套197／197](checks/unit.tap)。最初測試harness曾有缺函式export及引號SyntaxError，已先修正才保存有效red，不將工具錯誤列為產品重現。Repo沒有獨立lint、TypeScript或npm build；JS語法檢查不是lint／type check；preview.py不是正式Jekyll。正式Pages建置另核對。

變更範圍：`assets/app.js`、`tests/transient-loading.test.cjs`、`tests/transient-loading-browser.cjs`、觀察用`tests/code-reading-observe.cjs`、`.github/workflows/code-reading-qa.yml`、`SITE.md`與本輪QA證據。分支暫名reader-code-blocks不代表新增語法高亮或橫捲。

## 環境與獨立審查

無適用AGENTS.md；已讀README、SITE、近期原文與搜尋QA、架構／preview／部署規範。基準3494ed9，原工作樹improve/search-recall-recent-workflows-and-tokenization的app.js與search.test.cjs未提交修改完整保留，另建`/tmp/ai-code-reading-20261023`。原PR78／79／80不擅自混入，不reset／強推。

依OpenAI Docs技能與[官方設定文件](https://learn.chatgpt.com/docs/config-file/config-basic)核查本機設定gpt-6.1-sol／medium；主對話runtime不能讀取或切換，沒有宣稱最高設定。獨立設計與review角色明確指定可用gpt-6-astra／ultra，不能把指定當runtime證明；主角色為唯一實作整合者。未修改全域設定、使用另付費API或購買credits。本機只repo與shell，瀏覽器均在授權GitHub Actions雲端，未操作個人GUI。

獨立角色唯讀檢查產品diff及8項新測試：22項loader／budget／recovery／shared-source相關測試通過；另40來源503後恢復守並行上限、排序與唯一進度，12種取消時機無晚到來源／排隊請求；預設Retry-After0至少等500ms。無需修正finding。UI流程另待實際browser，不能由單元推論。

雲端初次39915833011在瀏覽器前因checkout預設shallow無3494ed9基準停止，修fetch-depth。[原始錯誤](checks/first-cloud-failure.log)。第二次39916034516的Chromium1440／390／320專項皆過，但Firefox啟動明確拒絕root在pwuser的HOME執行，故整輪FAIL；[環境錯誤](checks/firefox-environment-failure.log)。沿用repo已有runuser模式修測試環境，不更改產品、系統使用者或個人GUI。

## 實際預覽與三情境

[雲端39916305668](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39916305668)：Chromium1440／390／320、Firefox390、WebKit390，相同來源資料、同一UC-001首請求503注入。原版440條／旅遊＋生活＋Grok Bot為14筆，failed含UC-001；新版441條完整／15筆，自動補讀一次，無須手動操作。[前報告](before/report.json)／[後報告](after/report.json)。report.requests是全段流程累計，含之後goto／reload；初始次數在assert中驗證1→2，不能將最終4次當成一次載入重試4次。正式驗收後續補initialRequests欄位以便閱讀，產品未變。

專項5次axe A/AA掃描零違規，沒有pageerror；[故障生命週期](after/lifecycle.json)確認共享單篇503後先讀、背景完成保留焦點、持續503最多2請求、404及Retry-After120秒均1請求，取消等候不再請求。取消後大量排隊來源保留在failedPaths是預期，手動補讀後全數恢復，沒有假稱取消時全庫完整。

既有[完整閱讀報告](checks/regression-report.json)五配置全過、15次axe零違規；[既有載入復原](checks/regression-lifecycle.json)確認早讀、全目錄錯誤與部分失敗都恢復441條。20次主要掃描不是完整WCAG認證，不代表20名真人。完整[log](checks/regression.log)。

| 尺寸 | 同一503故障的修改前 | 自動恢復後 |
| --- | --- | --- |
| 桌面1440 | [缺項警示與14筆](before/results-chromium-1440.png) | [15筆及恢復案例](after/results-chromium-1440.png) |
| 手機390 | [缺項警示與14筆](before/results-chromium-390.png) | [15筆及恢復案例](after/results-chromium-390.png) |

主角色與獨立角色均目視前後桌面／手機及[長提示詞](after/reading-chromium-390.png)，無新重疊／裁切／橫向溢出，原停止條件與編號完整。前圖特意顯示缺項區，後圖顯示結果及恢復卡片，並非不同配色或版型的比較。

三個具體模擬走查：
1. 首訪想規劃旅遊，組合生活＋Grok Bot篩選，一次503後找到UC-001，Enter閱讀、核對來源、Escape回原卡及條件。
2. 收到分享單篇，目標先503後恢復，其他來源仍在讀時可先讀；背景完成不搶閱讀焦點。UC-366長提示詞與直鏈重整仍可閱讀。
3. 來源持續不可用或404，看見真實缺項提示，取消等待後能手動補回；沒有結果時可回關鍵字欄修改。

這是自動化模擬，不宣稱真人喜歡、轉換率或回訪率已提升。產品gzip增加558bytes，正常成功來源不增加請求；[大小](checks/asset-size.json)不代表實測效能分數，未量測Lighthouse。主要改善證據是相同故障下內容可恢復，不將不同公開載入耗時作速度成效。
