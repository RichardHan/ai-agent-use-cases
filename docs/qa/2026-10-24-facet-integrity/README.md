# 2026-10-24 組合篩選與來源說明驗收可靠性

本輪修復 GitHub Actions 的過期驗收假設，不修改產品版面、搜尋語意、案例、來源或計數。受益者是依問題找內容的新訪客與維護者：資料成長後仍能持續驗證篩選筆數、零筆回復及來源說明，不讓已知假警報遮住真正退化。沒有宣稱真人轉換率、留存率或喜好改善。

基準 c989742；獨立分支 improve/visitor-round-20261024-b、工作樹 /tmp/ai-visitor-round-20261024-b。原目錄分支與三個未提交檔案 assets/app.js、index.html、tests/search.test.cjs 均保留。開放研究 PR #78／79／80 不納入本輪。repo 及祖先目錄未找到適用 AGENTS.md；閱讀 README、SITE、近期全文整包紀錄、預覽與工作流程後執行。主角色單一整合，另一角色只讀審查；沒有本機瀏覽器或 GUI 操作。

主執行環境未暴露可核實的模型名稱、推理強度或切換介面，無法聲稱帳號最高設定；獨立角色繼承設定，亦未冒充已核實最高模型。僅使用既有工具及 GitHub runner，未使用另付費 API、credits 或新增網站第三方服務。

## 證據與選擇

[原版雲端 run 40092346548](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40092346548) 的253單元、JS語法及真正Pages Jekyll建置成功。正式網站桌面1440與手機390走完首頁、旅遊＋生活、UC-001、來源popup、Escape返回、無結果；各447網站條目、無缺來源、20筆旅遊生活結果。447是網站條目，不是合格案例數。公開首頁ready時間是本次雲端樣本，不能當成效能提升：桌面2661ms、手機860ms。

同run原版facet測試隨後在「旅遊＋開發必為零」斷言失敗。歷史run40081730426另顯示source-guide在收合篩選面板時讀#proof AX description為空；本輪40092715713以相同資料實際重現此red，原版空字串與原斷言保存在source-guide-before-failure.log。

- 方案A（採用）：讓零筆測試使用當下真正零筆選項，AX檢查前以使用者操作展開控制項；保留原斷言。修改少、可精確驗收，但不解決其他舊CI問題。
- 方案B：整併所有QA與全部歷史資料假設，長期較容易維護，但涉及數十套流程及更大驗收成本，本輪不做。

驗收標準：每個實際選項的數字吻合顯示卡片；零筆可解除條件且保留查詢；其他引擎抽樣覆蓋全部／正數／零／目前；來源select可見時原AX描述完整；詳情直鏈、reload、返回、來源、鍵盤、長文、載入及復原維持正常；最終260單元、真正Jekyll、三引擎五配置與獨立review通過。產品沒有證據支持需要修改，依使用者「沒有有價值的改動時交付檢查結果並停止」保留既有UI。

## 變更

- tests/facet-counts-browser.cjs：以當前option選真零筆，沒有真零筆則用未知情境直鏈測回復；每個瀏覽器讀取正數與零筆樣本；補讀精確驗failedPaths；保存數據與空結果截圖。
- tests/facet-fixture.cjs、tests/facet-fixture.test.cjs：隔離取樣規則，覆蓋舊零筆組合已成正數、全部正數及去重邊界；新增測試先紅再綠。
- tests/published-version.cjs、tests/published-version.test.cjs：發布gate與4項建置時間差／混版／改文／缺文／重複／順序回歸。
- tests/source-guide-browser.cjs：只增加展開篩選與可見斷言，原CDP AX文字斷言保留。
- .github/workflows/facet-counts-qa.yml：固定ubuntu24.04、匹配Playwright1.64.0官方容器與套件，使用pwuser；真正Jekyll與預覽原文逐byte檢查；執行兩套修復驗收及完整旅程；維持contents:read與正式資產／來源版本核對，paths涵蓋相關helper及資料。紅燈重現只在本輪分支跑，主線持續驗現版本。

獨立審查發現首版workflow誤移除正式資產版本核對；已恢復五產品資產對照本次Jekyll輸出，也補執行腳本paths。終審再抓到catalog/corpus的revision為各次建置時間，跨build比revision會製造假失敗；另加4項單元先紅再綠，改核對五資產逐byte、正式catalog/corpus內部revision一致、來源集合及全部原文字節相同，並在分支預先執行正式gate。沒有將首版當成正式版本驗收。其餘UI、分類、合格計數、原始內容、來源限制均無diff。

## 截圖與預覽

網站外觀不變，前後圖用來確認維持正常，不表示重新設計。

| 尺寸 | 修改前正式站 | 修復後預覽 |
| --- | --- | --- |
| 桌面1440×900 | [前](before-desktop.png) | [後](after-desktop.png) |
| 手機390×900 | [前](before-mobile.png) | [後](after-mobile.png) |

[正式網站](https://richardhan.github.io/ai-agent-use-cases/?q=%E6%97%85%E9%81%8A&scenario=%E7%94%9F%E6%B4%BB#explore)。本機靜態預覽方法如下；本輪實際瀏覽均在GitHub runner執行。

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/facet-preview/ai-agent-use-cases
python3 -m http.server 8096 --directory /tmp/facet-preview
NODE_PATH=<cloud-tools>/node_modules node tests/facet-counts-browser.cjs
GUIDE_URL=http://127.0.0.1:8096/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/source-guide-browser.cjs
SITE_URL=http://127.0.0.1:8096/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/page-context-browser.cjs
```

專案無獨立lint或TypeScript設定，不冒稱這兩項通過。workflow使用actions/jekyll-build-pages驗真正Pages輸出；preview.py另外驗靜態預覽。

## 預覽結果與限制

[首次預覽40092715713](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40092715713) 全部成功：

| 項目 | 實際結果 |
| --- | --- |
| 單元測試 | 256 tests、256 pass、0 fail |
| JS語法 | assets與tests全部通過 |
| Pages建置 | 真正Jekyll成功；445來源原文與preview逐byte一致 |
| 篩選筆數及空結果 | Chromium1440／390／320、Firefox390、WebKit390全過 |
| 舊假設驗證 | 旅遊＋開發實為1筆；改採旅遊＋學習0筆，解除後保留查詢 |
| 來源判讀與AX | 同五配置全過；原CDP描述斷言保留；首次GitHub來源探測200，最終429（URL正確） |
| 完整閱讀及狀態 | 同五配置447條目完整、直鏈／reload／返回全過；早讀／錯誤／部分補讀三情境皆成功 |
| 主要axe掃描 | 篩選5＋來源10＋完整旅程15＝30次，全部0違規 |

主角色目視桌面／手機前後結果與手機來源長文，未見裁切或重疊；產品零diff，沒有宣稱UI或效能提升。原始數據、單元TAP與完整run.log已保存在本目錄；log僅去除行尾空白，未改失敗或輸出內容，未處理原log仍可在GitHub下載。40092537285／40092605289因本輪容器git safe.directory缺漏停在紅燈重現前，不能計為瀏覽器成功；已在a17491f修正，未放寬產品斷言。兩失敗run可透過GitHub永久追溯。本輪不修所有主線舊QA、不新增難度推測、不做資料去重或案例合格數變動。三種模擬走查：旅遊＋生活找案例及核對來源；組合條件零筆後保留關鍵字解除條件；分享詳情reload、長文閱讀及返回，另測慢載入／錯誤／補讀。這些是模擬檢查，不是真人研究。

未使用實體手機或真人螢幕閱讀器，axe不等於完整無障礙認證；未測Lighthouse、弱網留存或轉換率。其他Actions可能仍有不同的舊假設或相容問題，不能稱main全綠。下一輪建議按失敗logs修復下一個確定失效的QA前提，優先跨套件共用的可見控制項操作，保留真失敗與斷言。

[最終候選驗收40093265372](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40093265372) 已全部成功：260單元、真正Jekyll與preview逐byte、三引擎五配置篩選／來源／完整閱讀及3種載入復原、30次主要axe零違規。此目錄的preview-*、unit.tap及修改後截圖以本次最終run為準；首次256單元另存first-preview-unit.tap，首次run亦可在GitHub追溯。

發布gate在分支先實際通過：本次Jekyll revision為20261024121757067612080，正式為20261024115929411927543，五產品資產與445份來源原文字節一致。這證明可正確區分建置時間差與內容差，未放寬原文驗證。正式站修改前流程已通過，但合併後完整正式流程與Pages結果仍須補記。

獨立終審確認可合併。最終來源直接HTTP探測遇GitHub429限流，未將來源可讀當成已驗證；popup目的URL正確，且首輪曾回200。不反覆刷外部來源，正式結果另記。


## 正式發布與停止點

一般merge d688ee1 已推送main；未強推，原目錄分支及三個未提交檔案仍保留。[Pages40093702743](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40093702743) build／report／deploy全部成功。

[合併後專項40093703400](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40093703400) 全部成功：260單元、真正Pages建置與preview、三引擎五配置整合旅程、正式資產／445來源原文字節核對，以及正式站三引擎五配置篩選／零筆回復／直鏈／reload／返回、Chromium1440／390來源判讀與三旅程全成功。該run整合預覽30次主要axe零違規，正式另5次facet＋4次來源＝9次零違規。正式載入／補讀fixture亦通過；外部GitHub直接探測429，URL正確但未驗證當下來源body可讀。主角色已目視[正式桌面](published-desktop.png)與[正式手機](published-mobile.png)，沒有可見重疊或裁切；這兩張是另一組UC001＋來源篩選，前後比較請使用上方同旅遊生活條件。

[main快照](main-ci.json)八套流程七成功、一失敗。失敗為[舊Source guide QA40093703439](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40093703439)：其source-guide-browser五配置與10次axe已complete，後續複合regression步驟失敗，根因未在本輪定位。沒有宣稱main所有CI全綠，也沒有反覆重跑外部來源；本輪限定的兩個驗收前提修復已達標。下一輪優先定位該複合回歸失敗並與未改產品的基準對照，不先放寬斷言。

後續文書提交只保存本段結果及原始JSON／截圖，不再更動已驗證的程式、測試或資料。本輪完成停止。
