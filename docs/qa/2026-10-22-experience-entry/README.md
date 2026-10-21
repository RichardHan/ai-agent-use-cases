# 經驗與踩坑入口：保留問題，再縮小閱讀範圍

起始 `origin/main` 為 `2d14841`。原目錄 `/Users/richard_han/orca/ai-agent-use-cases` 分支 `improve/search-recall-recent-workflows-and-tokenization` 的 `assets/app.js`、`tests/search.test.cjs` 未提交修改完整保留；在 `/private/tmp/ai-source-disclosure-20261022` 建立獨立分支。開始時無開啟中 PR；查過上層與 repo，無適用 AGENTS.md。已讀 README、歷史收錄規則、SITE、Pages/catalog/preview/workflow 與近期維護紀錄。主角色唯一修改與整合，獨立審查角色唯讀。

## 證據、方案與範圍

[正式站基準 39658168670](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39658168670) 在桌面1440與手機390實走首頁、入口、詳情、來源新頁、Escape返回、旅遊＋生活篩選、直鏈重整與空結果編輯。點選「驗收與踩坑」將 query 改為「驗收」，命中375／413條（90.8%），kind仍空。獨立純Node分析：其中31條在標題／用途命中，其他344條依全文或metadata命中；既有排序確實優先標題／用途，因此不宣稱前幾筆都不相關。問題是入口沒有有效縮小閱讀範圍，且取代使用者原問題。

目標讀者：想先看既有經驗與限制、再判斷如何試用的人。

- 方案A：改成更具體的全文字詞。成本最低，但仍依賴通用段落及用詞，不能穩定對應閱讀集合。
- 方案B（採用）：用既有 `kind=evidence`，入口改為「經驗與踩坑」。保留關鍵字、情境、工具、分類、來源與排序，沿既有網址及空結果流程。成本是少量狀態同步；此集合僅依原收錄狀態，並不涵蓋全庫所有失敗紀錄，也不是已獨立驗證的案例集合。

驗收：單擊只切kind、再次點選只取消kind；下拉框／條件標籤／clear-facets／重設／網址重整與pressed狀態一致。組合條件可為零筆，必須保留原意圖及復原方式。載入前選取及錯誤重試保留意圖。Enter／Space可操作；閱讀後返回原卡焦點；桌面／390／320、長文、來源、直鏈與base path不退化。

不處理：其他任務入口、全文搜尋／排序、案例及證據重分類、計數、框架、全文載入架構。原始資料及協作者內容零變更；未新增產品依賴、追蹤、cookies、登入或對外資料傳送。

## 實作與驗證方式

- `index.html`：入口使用既有kind值，補上可見說明與 `aria-describedby`，交代再次點選可取消。
- `assets/app.js`：8行新增，以既有render同步pressed及active；事件只改kind，網址、結果及復原沿原流程。
- `tests/task-entry.test.cjs`：執行真實委派事件處理器，驗證從空／case／pending切換、再次取消、保留其他條件及原任務入口不退化。先提交測試，舊版2失敗／1成功，修正後3成功。
- `tests/task-entry-browser.cjs` 與 `.github/workflows/task-entry-qa.yml`：GitHub-hosted瀏覽器走查、前後截圖、原版失敗重現、三引擎、載入及重試；另執行既有discovery與reader回歸。

本機只執行授權檔案、Git、Node單元與靜態preview，不操作個人GUI／本機瀏覽器。Orca CLI讀取guide時回報 `Unable to determine Orca.app path from symlink: /usr/local/bin/orca`，未改用另一個Orca執行檔；隔離以Git worktree完成。使用OpenAI Docs及orca-cli技能。可讀本機設定為 `gpt-6.1-sol/medium`，不能證明本對話runtime；無工具切換或驗證本會話模型／推理，未聲稱帳號最強。獨立審查依工具選項請求 `gpt-6-astra/ultra`，請求也不是runtime證明。僅既有訂閱工具與授權GitHub Actions，無付費API／credits購買。

基準148/148，本輪151/151單元通過。指令：`node --test tests/*.test.cjs`、逐檔 `node --check assets/*.js tests/*.cjs`、`git diff --check`、`python3 scripts/preview.py <output>/ai-agent-use-cases`。沒有獨立lint／TypeScript／npm build，語法檢查不冒稱lint；Python模擬靜態preview，正式Jekyll／Pages另驗。[原始單元與紅燈輸出](checks/)。

初步獨立審查另跑14項task-entry/relevance/search-recovery/case-share測試全過，未發現產品阻擋問題；建議說明改成直接告知取消方式，已修。並補上條件標籤、clear-facets、載入前選取、錯誤重試及返回焦點斷言。

## 截圖與預覽

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440 | [375筆全文結果](before/task-1440.png) | [狀態捷徑與明確取消方式](after/task-1440.png) |
| 手機390 | [入口與篩選](before/task-390.png) | [保留問題的閱讀入口](after/task-390.png) |

可重現預覽：`python3 scripts/preview.py /tmp/task-preview/ai-agent-use-cases`，再 `python3 -m http.server 8135 --directory /tmp/task-preview`，開啟 `http://127.0.0.1:8135/ai-agent-use-cases/?kind=evidence#explore`。

基準兩次axe掃描皆0違規、pageerror空；這不是完整WCAG認證。外部來源實開新頁並核對網址，部分外站轉到防護挑戰頁，不能聲稱外站內容皆可讀。保存的report移除防護query並縮短結果標題清單，完整原artifact留在Actions。

未驗證真人喜好、留存、轉換率、實體手機或完整輔具／WCAG認證。沒有Lighthouse或載入加速分數。下一輪最值得做：將正式站QA排在Pages部署完成後並合併重複工作，減少發布排隊與驗收讀到舊版的風險。其他任務入口的語意可接續改善。

兩次中間雲端驗收 [39658649331](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39658649331)／[39658855240](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39658855240) 的單元、語法與build成功，但browser因測試selector同時抓到按鈕與結果卡片而失敗；已限縮`.chip`，未視為產品既有失敗或成功。取消舊run的API請求回403（需admin），沒有改帳號或憑證。

[資產大小](checks/asset-size.json)為本機gzip估算，不是網路效能量測；未新增產品載入請求。

## 完整預覽結果

[39659091730](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39659091730)全程成功，checkout `b0da210`，產品與最終版本相同；後續只加嚴測試及整理紀錄。151/151、所有JS語法、原版2項失敗、靜態build、五組task走查及既有discovery／reader回歸通過。

Task配置為Chromium1440／390／320、Firefox390、WebKit390。五組皆3／413筆，只有既有evidence狀態、無缺資料判定或成功率推論；pageerror空、入口active／重設／空結果的15次axe掃描皆0違規。三引擎閱讀回歸涵蓋長文、待查、資料／腳本缺失、原文完整性、來源、焦點與返回；全庫413條目、2981章節、432行頁首證據未改。載入中先選狀態、catalog失敗後重試均保留意圖。完整更多截圖／回歸報告見上述artifact，repo保存精簡[檢查輸出](checks/)與[流程報告](after/report.json)。

三個自動化模擬情境：
1. 首訪者選「經驗與踩坑」，閱讀UC-008與來源新頁，Escape返回；看到的三筆僅為該收錄集合。
2. 搜尋「晨報」＋工作情境＋最近核對排序，再以Space選經驗狀態；原問題與排序保留，UC-008可讀；分享網址重新整理仍有相同條件；移除狀態標籤／清除篩選與下拉框都同步按鈕。
3. 無相符文字時仍保留狀態與情境，用Enter取消狀態、編輯問題或重設復原；另走旅遊＋生活的UC-001直鏈與重整。

以上不是真人使用研究，未宣稱留存／轉換率改善。已目視1440／390／320修改後圖，未見水平溢出、遮擋或不可讀文字；[320補充圖](after/task-320.png)。新增說明讓窄螢幕篩選區稍長，沿用可折疊篩選；不為縮短版面隱藏必要說明。

最終獨立目視審查通過：1440／390／320層級、按鈕狀態及說明清楚，無重疊或明顯對比退化；手機增加少量高度可接受。已確認最終測試使用exact button===activeElement，外站等待上限10秒。審查者未修改檔案。

已正常merge＋SSH push至main，merge `d02c3cc`。整合最新`db21987`，保留期間四筆研究提交；整合後151/151、全JS語法、diff及靜態preview再次通過。原工作目錄未提交修改未觸動，無reset或強推。

加嚴精確焦點及外站10秒上限的最終task預覽`d2e5bb8`在[39660583314](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39660583314)五組通過，15次axe皆0，所有來源載入等待均未逾時；[精確版報告](checks/final-task-report.json)與[lifecycle](checks/final-lifecycle.json)。此處僅指已完成的task步驟，整個workflow其餘回歸狀態另記。

效能觀測來自雲端本地靜態server的reader回歸：5配置DOMContentLoaded42–97ms、load51–173ms（[原始時間](checks/reader-timings.json)）。不代表正式網路、全文可搜尋時間或速度提升，沒有Lighthouse分數。

Pages `39661023948` build已成功、deploy排隊時，main同時啟動約30個既有QA工作；HTTP核對仍是舊版。沒有把已push當已發布，也沒有任意取消協作者工作。

最終精確版完整預覽[39660583314](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39660583314)已全數成功，包含task、discovery及reader；產品未再修改。main其他既有QA未全綠，[實際快照](checks/main-ci-snapshot.json)保留狀態。已查五項失敗：Category finding、Home search entry、Search context、Related reading均在等待正式資產匹配時逾時；Method shortcut核對的是未變動reader資產，之後等待結果卡片逾時，內部根因尚未確證，未概稱都是網路問題。

協作者其後新增`1585897`來源研究紀錄，產品檔未變；GitHub取消舊Pages`39661023948`，改排包含本輪merge的新部署`39661844681`。未將被取代取消視為成功。

[Pages39661844681](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39661844681) build／deploy成功，版本`1585897`包含本輪merge，協作者來源研究完整保留。HTTP實取`index.html`與`assets/app.js`皆200、逐字匹配本輪產品；正式雲端走查為[39662624466](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39662624466)，checkout同版本。

## 正式發布驗收完成

[正式驗收39662624466](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39662624466)全數成功：checkout `1585897`，公開index/app逐字匹配；151/151單元、語法、preview與原版失敗重現亦通過。正式站Chromium1440／390／320、Firefox390、WebKit390五組皆413條目、3筆evidence結果、pageerror空、15次axe皆0違規；精確返回按鈕焦點、Space／Enter、下拉／條件標籤／clear-facets、晨報＋工作＋排序保留、分享重整、旅遊直鏈、空結果、載入前選取與catalog失敗重試均通過。來源新頁載入未逾時，但未驗證外站內文或案例成效。

已目視正式[桌面](published/task-1440.png)及[手機](published/task-390.png)，與預覽功能及品牌一致。正式[完整流程報告](published/report.json)、[載入／重試](published/lifecycle.json)、[單元](checks/published-unit.tap)可查；更多截圖留在上述Actions artifact。未聲稱全repo歷史CI轉綠、完整WCAG認證或真人轉換成效。

可直接試用：[經驗與踩坑](https://richardhan.github.io/ai-agent-use-cases/?kind=evidence#explore)；[保留晨報問題與工作情境](https://richardhan.github.io/ai-agent-use-cases/?q=晨報&scenario=工作&kind=evidence&sort=reviewed#explore)。

最後提交只新增維護紀錄、報告及截圖，沒有再動產品。原目錄仍為原分支與原兩個未提交檔案。達成本輪驗收即停止。
