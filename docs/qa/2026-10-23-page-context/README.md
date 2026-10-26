# 2026-10-23：分頁與書籤辨識目前案例及搜尋

針對開多個案例分頁、收藏後再讀、查看來源後回來的人，同步瀏覽器標題與正在看的內容。產品只改 `assets/app.js`，不改畫面版型、原始資料、搜尋集合與排序、來源或證據分類。

## 實際問題與選案

正式站[基準雲端39881803990](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39881803990)以Chromium1440／390走完首頁、旅遊＋生活＋Grok Bot搜尋、UC-001詳情、來源新頁、關閉返回及空結果；全部六個狀態的分頁標題均為 `AI 用法實驗室 · 案例庫`。兩尺寸各433條目零缺項、15筆旅遊篩選結果，[原始title／URL／可見標題](before/report.json)；433是網站條目數，不是合格案例數。

- 方案A：只在開／關詳情更新案例title。成本最低，但無法辨識搜尋分頁，歷史與背景載入仍容易覆寫。
- 方案B（採用）：集中純formatter與同步入口，以開啟中的詳情為優先，再依實際搜尋／篩選／最近核對及載入狀態呈現。成本為35行產品程式與狀態回歸，解決完整往返。

驗收：詳情顯示ID＋完整顯示標題＋站名；關閉恢復搜尋字詞與五類篩選；清空搜尋與篩選時恢復首頁title。上一／下一則、返回／前進、三種關閉、直鏈重整與背景補載一致。載入中／失敗／部分結果／不存在case各自辨識，未載入的URL不冒充已讀案例。不將條目數或命中當作獨立驗證。

不處理：案例編輯、來源查證、分類重做、搜尋召回、全文載入架構、視覺換色、既有書籤重新命名及社群預覽。靜態HTML仍提供首頁title，JavaScript執行後才同步；未執行JS的分享爬蟲仍只見首頁資訊。

## 行為與前後證據

| 狀態 | 修改前 | 修改後 |
| --- | --- | --- |
| 旅遊＋生活＋Grok Bot | AI 用法實驗室 · 案例庫 | 搜尋「旅遊」 · 生活 · Grok Bot｜AI 用法實驗室 |
| UC-001閱讀中 | 同首頁 | UC-001 · 規劃旅行，先把交通和住宿比清楚｜AI 用法實驗室 |
| 關閉閱讀 | 同首頁 | 回到原搜尋標題 |
| 分享案例不存在 | 同首頁 | 找不到分享案例 · 搜尋「旅遊」｜AI 用法實驗室 |
| 來源未完整載入 | 同首頁 | 已載入內容 · 搜尋「旅遊」｜AI 用法實驗室 |

頁面PNG不含瀏覽器分頁列，所以不以截圖冒充title改變。前後畫面用來核對版面／焦點／長文無退化；title改變由瀏覽器實際讀值與斷言證明。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440詳情 | [前](before/detail-chromium-1440.png) | [後](after/detail-chromium-1440.png) |
| 手機390詳情 | [前](before/detail-chromium-390.png) | [後](after/detail-chromium-390.png) |
| 手機390來源長文 | [前](before/source-chromium-390.png) | [後](after/source-chromium-390.png) |

預覽：`python3 scripts/preview.py /tmp/page-context-preview/ai-agent-use-cases`，再執行 `python3 -m http.server 8170 --directory /tmp/page-context-preview`，開啟 http://127.0.0.1:8170/ai-agent-use-cases/ 。正式直鏈：https://richardhan.github.io/ai-agent-use-cases/?q=旅遊&scenario=生活&tool=Grok+Bot&case=UC-001 。維持base path與靜態重新整理相容。

## 驗證與三種情境

```sh
node --test --test-reporter=tap tests/*.test.cjs
node --test tests/page-context.test.cjs
for f in assets/*.js tests/page-context*.cjs; do node --check "$f"; done
python3 scripts/preview.py /tmp/page-context-preview/ai-agent-use-cases
git diff --check
NODE_PATH=<cloud-tools>/node_modules node tests/page-context-browser.cjs
NODE_PATH=<cloud-tools>/node_modules node tests/task-shortcuts-browser.cjs
```

基準178／178通過，[TAP](checks/baseline-unit.tap)。新測試先在舊版重現4項ERR_ASSERTION，[red](checks/red.tap)；修後182／182通過，[TAP](checks/unit.tap)。沒有獨立lint、TypeScript或npm build；語法檢查不稱lint/type check，preview不稱正式Jekyll建置。

走查均是自動化模擬，非真人研究，沒有聲稱喜好、轉換率或留存提升：
1. 新訪客從首頁進搜尋，組合生活＋Grok Bot讀旅遊方法，查看來源後Escape返回原卡及原條件，空結果可回到關鍵字。
2. 分頁辨識／回訪：首頁情境與抽卡、案例直鏈、上一／下一則、返回／前進、重新整理、按鈕／Escape／背景關閉，以及只有篩選的分頁。
3. 壞連結與慢網路：不存在案例與取消通知、超長Unicode／HTML樣式文字、載入中、單篇早讀、背景補載、目錄失敗與重試、部分缺項與重試。

[資產大小](checks/asset-size.json)提供真實bytes與gzip；沒有新增產品網路請求、依賴、儲存或第三方資料傳送。未量測Lighthouse，不提供效能或無障礙虛構分數。

## 環境與限制

起始`d79b7ad`；讀README、封存維護規則、SITE與近期QA、Pages設定（legacy／main／根目錄）。無適用AGENTS.md。隔離分支`improve/reading-round-20261023-r2`、工作目錄`/tmp/ai-reading-20261023-r2`，原目錄兩個未提交搜尋檔案保留，不reset、不強推。既有PR #78／79／80／82不混入。主角色唯一整合者，獨立角色唯讀審查。

使用OpenAI Docs skill與[官方設定說明](https://learn.chatgpt.com/docs/config-file/config-basic)。本機config為`gpt-6.1-sol / medium`；主會話實際runtime與推理設定無法讀取／切換，不能證明帳號最高模型。獨立角色明確請求工具提供的`gpt-6-astra / ultra`，不當成runtime證明。只用既有訂閱與授權GitHub Actions，不用另付費API，不操作個人GUI；瀏覽及截圖在雲端。

第一個觀察run [39881683363](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39881683363)因測試把兩個搜尋入口當成單一元素而FAIL，[原始報告](checks/first-observer-failed.json)保留。只修工具定位為hero入口後，39881803990才完成兩尺寸全流程；前者不計為通過。

未驗證真手機／完整輔具認證／真人回訪。下一輪最值得做：降低首次全文請求成本，保留單篇早讀、查詢條件及部分失敗重試。

首預覽[39882168191](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39882168191)新流程五配置與三種載入復原均通過，[原始報告](checks/first-preview/report.json)／[復原](checks/first-preview/lifecycle.json)；但之後既有task-shortcuts回歸因UC-433沒有可選的來源章節捷徑而FAIL，[原始log](checks/first-preview-failed.log)。乾淨d79b7ad的UC-433也沒有符合來源章節、reader.js逐byte未變，[基準證據](checks/source-shortcut-baseline.json)。只將既有測試改從每篇皆有的完整原始研究summary開啟，仍驗原始來源、新頁與返回，不改產品、不刪斷言，也不把此run計為全成功。新版另在詳情／空結果補axe，最終每配置三次掃描。

## 最終預覽與獨立審查

[39882593090](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39882593090)完整成功，產品資產自06346ca未再變動。Chromium1440／390／320、Firefox390、WebKit390共五配置，433條目零缺項、pageerror空；[新流程報告](after/report.json)／[新載入復原](after/lifecycle.json)、[既有探索回歸](checks/regression-report.json)／[既有復原](checks/regression-lifecycle.json)。25次主要axe掃描零違規（新流程詳情／空結果／最終狀態15次，既有結果／空結果10次），涵蓋WCAG A／AA選定規則，不是完整認證。[雲端182項單元](checks/cloud-unit.tap)與[舊版4項red](checks/cloud-red.tap)皆符合預期。兩套流程皆核對來源新頁網址，既有回歸未記HTTP錯誤或來源逾時；不把能開啟來源當作已查證內容。

主角色目視前後桌面／390／320詳情與手機來源長文，焦點可見、長標題與URL換行正常。獨立角色唯讀核對產品／測試diff、另跑28項相關單元與DOM-state fixture、核對五配置title／URL／heading及三復原，目視桌面／手機／320／WebKit來源長文，結論無產品或視覺阻擋。其指出的axe範圍已精確標明，新run才計入新增掃描。[原工作樹兩檔雜湊](checks/original-worktree-preserved.json)前後相同。

發布方式：`gh pr create`被GitHub GraphQL拒絕（Enterprise Managed User無權createPullRequest），沒有PR編號；未要求額外權限或換帳號。沿用使用者明確授權及已可用的個人repo SSH remote，以一般merge推送main，不強推。

## 合併與正式發布

正常merge並push main為`411ae28`，無強推。合併前fetch同步協作者PR #82之`d55da80`，保留UC-436–440與來源／索引，無衝突；相較預覽增加5筆案例。整合後[182項單元](checks/integrated-unit.tap)仍全通過。預覽433條目是預覽當時資料，正式另驗，不混稱已測過同一資料版本。

部署等候期間協作者再推`6219f41`，保留UC-441與UC-037補證，產品五資產不變；本地快轉同步後[182項單元](checks/release-unit.tap)全通過。`411ae28`的Pages39883295963被取代取消，未算部署成功；後續以最新部署及公開資產為準。

[Pages39883517680](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39883517680)在`6219f41`完成正式Jekyll build／deploy／report；本輪產品已包含在其祖先411ae28。五個公開HTML／JS／CSS皆HTTP200且逐byte相同，[SHA-256證據](checks/published-assets.json)。[正式專項39883332538](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39883332538)由已授權的verify分支push觸發，不另要求管理權限。

正式首驗39883332538五配置439條目零缺項、title／歷史／直鏈／返回與15次axe均通過，[原始主流程](checks/first-published/report.json)；但後續故障復原在error模式重試後仍有來源未完整載入，Escape後正確顯示「已載入內容」，未符合測試要求的完整搜尋，[原始復原](checks/first-published/lifecycle.json)／[FAIL log](checks/first-published-failed.log)。原工具沒有保存該次HTTP與缺失檔案，因此根因未確，不能宣稱HTTP429或產品已修復。產品不變，只加HTTP／requestfailed／failedPaths診斷與更嚴格的零缺項斷言，原title斷言保留後再驗。此run整體仍為FAIL，既有回歸尚未執行，未冒稱完整正式驗收。

[正式補驗39884473549](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39884473549)完整成功。先逐byte比對五公開資產，再執行Chromium1440／390／320、Firefox390、WebKit390；五配置各439條目零缺項、pageerror空。[正式主流程](published/report.json)／[三種復原](published/lifecycle.json)、[既有回歸](published/regression-report.json)／[復原](published/regression-lifecycle.json)皆通過；新15＋舊10共25次主要axe零違規。補驗三復原最終439條目、failed皆空；network中error模式catalog與partial模式UC-001為刻意注入abort，其他未記網路異常。這只證明當次補驗完整，不能宣稱首驗缺項根因已修復。

主角色已目視[正式桌面](published/detail-chromium-1440.png)、[正式手機](published/detail-chromium-390.png)及[正式來源長文](published/source-chromium-390.png)，與預覽相比無文字／控制列／長文退化。分頁title、直鏈與返回／前進已驗；未驗原生歷史選單標題、真機與真人留存。

其他main舊CI仍有失敗或未完，[快照](checks/main-ci-snapshot.json)如實保留；未逐一確定其根因，不將本輪專項通過說成全庫CI全綠。首驗缺項的不確定性與首次全文載入成本仍是後續風險。最後只補測試診斷與證據，產品檔案自06346ca不再修改。

獨立角色最終逐項核對正式補驗raw reports、六復原與兩筆受控abort，目視正式桌面／手機詳情及來源長文，結論「可交付，無剩餘阻擋」；沒有再跑相同單元或修改產品。達成本輪驗收，停止追加功能。
