# 表格早讀與背景載入：檢查結果及回歸防線

本輪沒有修改產品碼。遵照「沒有有價值的改動時，交付檢查結果並停止」，不把未重現的假設當作網站問題。實際交付是可阻擋未來退化的雲端驗收，以及本次可追溯的檢查資料。已合併PR #83並完成Pages建置部署；發布證據見末尾。

## 基準與決策

基準 dc3b1f8，隔離工作樹 /tmp/ai-round-20261023-tables，分支 improve/reader-tables-20261023。主工作樹既有 assets/app.js、tests/search.test.cjs 未提交修改未搬動、未覆蓋。未合併其他研究PR #78／79／80，也未修改其分支。沒有適用 AGENTS.md；已讀 README、近期 SITE.md、現有靜態預覽與雲端部署規範。原工作樹較主線舊，透過 fetch＋獨立工作樹安全取得主線，未 reset 或強推。

模型：本機 config.toml 為 gpt-6.1-sol／medium，不能據此證明此對話實際模型或推理強度；主對話沒有可驗證的切換介面，不宣稱最高模型已啟用。沒有使用付費API或購買額度；主角色單一整合者，另一角色唯讀獨立審查。所有瀏覽器均執行於 GitHub Actions，不啟動本機瀏覽器或操控個人桌面。

目標讀者是從分享連結先讀 UC-400 比較表，其他案例仍在背景載入的人。候選證據是 app.js 既有閱讀錨點 selector 不包含 table rows；但這只代表程式覆蓋缺口，尚不能證明畫面位移。

- A（最終採用）：保留現行產品行為，補上表格早讀的完整成功載入驗收。成本低，能防止這個交集日後退化；目前沒有改善畫面的依據。
- B（未採用）：新增表格列閱讀錨點。若未來瀏覽器實際發生位移可採用，成本低至中；目前會增加無法證明必要的程式。可分享儲存格位置則是另一個成本更高的擴充，本輪不做。

驗收：背景來源確實成功、載入提示確實消失；比較表第一列垂直位移≤2px、水平位置與焦點不變；短視窗排除舊有段落錨點，確實只讀表格；三引擎、桌面／390／320與480px短視窗；沒有頁面橫溢、pageerror或axe WCAG A/AA自動規則違規。既有搜尋、組合篩選、空結果、直鏈重整、返回、來源連結與長格排版沿用完整表格流程回歸。

不處理品牌、框架、搜尋語意、案例、來源重分類、去重、合格數或載入架構。443是本次正式站收錄條目數，不是嚴格合格案例數。不新增產品依賴、第三方追蹤、cookies、登入或資料外送。

## 實際觀察與畫面

正式站 [39936839451](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39936839451) 兩尺寸443條目零缺項；旅遊＋生活19結果、UC001來源段、返回保留查詢及焦點、空結果均走查。主角色目視桌面首頁、手機結果／來源／空結果。

- [桌面首頁](before/home-1440.png)／[手機首頁](before/home-390.png)
- [桌面結果](before/results-1440.png)／[手機結果](before/results-390.png)
- [桌面詳情](before/reader-1440.png)／[手機詳情](before/reader-390.png)
- [手機空結果](before/empty-390.png)

觀察三引擎八配置，表格垂直位置差範圍 -0.375 至 +0.625px，全部焦點保留；Chromium／Firefox／WebKit短視窗確實沒有舊selector段落候選仍正常。這些是自動化模擬走查，不代表真人喜好、轉換率或留存提升。前後產品完全相同，後驗收圖用於比對而非宣稱視覺改版。

## 測試、原失敗與限制

本機基準與本輪 197/197 單元通過；JS syntax與 Python static preview成功。沒有package.json、獨立lint或TypeScript設定，不把語法檢查稱作lint/type check，也不把Python preview稱正式Jekyll build。

```sh
node --test tests/*.test.cjs
for f in assets/*.js tests/round23-observe.cjs tests/table-anchor-browser.cjs; do node --check "$f"; done
python3 scripts/preview.py /tmp/round23-preview/ai-agent-use-cases
python3 -m http.server 8180 --directory /tmp/round23-preview
# 以下在雲端瀏覽器環境執行
SITE_URL=http://127.0.0.1:8180/ai-agent-use-cases/ node tests/round23-observe.cjs
SITE_URL=http://127.0.0.1:8180/ai-agent-use-cases/ node tests/table-anchor-browser.cjs
SITE_URL=http://127.0.0.1:8180/ai-agent-use-cases/ node tests/table-reading-browser.cjs
```

初版雲端39936386071、39936518539因來源details summary點擊後焦點不再是detail-title而失敗；修測試以preventScroll聚焦模擬仍持有標題焦點的閱讀情境。39936584350再因Firefox單次wheel未達目標位置而失敗，改用受控scrollTop定位；不宣稱真實滑鼠滾輪完成驗證。39936839451完成八配置觀察。獨立review發現必須斷言載入提示消失和全部來源成功，避免failedPaths非空時delta≈0的假通過，最終測試已加入。初版不是產品red，也沒有虛構先red後修的產品故事。嘗試取消已取代run遭GitHub權限HTTP403，未調整權限或重啟環境。

剩餘限制：axe只是自動規則，未進行完整讀屏器或真人研究；未量測新的效能分數；外部來源新頁可開啟不代表其內容已核實。原始案例與任何敏感資料未改動。下一輪優先量測並降低首次全文請求量與連續走查時的載入可靠性，保留早讀、部分失敗與人工補讀。案例間站內銜接為次要待驗題，不能只憑程式推斷。


## 最終驗收與交付

[最終預覽39937498291](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39937498291) 成功：197單元、syntax、static preview；兩尺寸旅遊＋生活搜尋／來源popup／返回與空結果，八配置早讀完成、五配置既有表格全流程，主要18次axe規則掃描0違規，443條目完整，pageerror空。早讀位移abs最大0.625px；所有手機水平340或410px在完成前後完全相等，焦點皆detail-title。主角色已目視桌面表格、手機成本格、短視窗載入前後圖。

[正式39937449362](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39937449362) 整趟FAIL，完整保留：[原始失敗log](checks/published-failure.log)。五公開產品資產與checkout逐字相同；兩尺寸來源新頁／返回及新八配置早讀均通過、各443條目完整／8次axe0。既有表格完整流程前兩配置通過，第三Chromium320於corpus檢查缺328來源即失敗，後續Firefox／WebKit該套未執行；不能把前段通過說成整趟成功，也未在沒有網路診斷資料的情況下斷言根因為HTTP429。這個限制不因本輪改產品造成，因為產品碼完全未變。未反覆重跑公開全庫以追求綠燈。

| 畫面 | 起始正式站 | 最後預覽驗收 |
| --- | --- | --- |
| 桌面首頁 | [開始](before/home-1440.png) | [最後](after/home-1440.png) |
| 手機來源段 | [開始](before/reader-390.png) | [最後](after/reader-390.png) |
| 短視窗表格 | [背景載入中](after/firefox-short-before.jpg) | [背景載入完成](after/firefox-short-after.jpg) |

首頁靈感卡是隨機內容，前後不同卡片不算產品變更。詳情／表格前後維持現行視覺；沒有可宣稱的畫面改善。正式圖保存在[published](published/)。預覽可依上方命令開啟 /ai-agent-use-cases/；所有瀏覽器驗收實際在雲端執行。

三情境為：(1)第一次依旅遊問題＋生活篩選閱讀並返回；(2)分享直鏈先讀UC400右側成本、背景完成、鍵盤與焦點保留；(3)用6.50查成本格、直鏈重整，再以無結果查詢修改關鍵字恢復。來源開啟／長格／列印沿用既有表格五配置預覽回歸。是模擬走查，不是使用者研究。

交付檔案：tests/table-anchor-browser.cjs、tests/round23-observe.cjs、.github/workflows/round23-qa.yml、.github/workflows/website-qa.yml、SITE.md與本目錄證據。新CI在main及未來網站相關PR執行；不改產品、資料或部署設定。獨立review紀錄見[checks/independent-review.md](checks/independent-review.md)。本輪驗收停止於此，不擴大改版。


## PR中發現的確定品質故障：舊瀏覽器工具與漂移runner不相容

[Website QA39937977898](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39937977898) 在安裝瀏覽器前失敗，原始訊息為 `Playwright does not support chromium on ubuntu26.04-x64`，見[原log](checks/legacy-runner-failure.log)。原工作流使用 ubuntu-latest 與固定Playwright1.56.1，latest漂移成26.04導致檢查完全無法執行。

兩案：A固定Ubuntu24.04並使用與原工具相同版本的官方預裝瀏覽器容器（採用，成本低，隔離OS與即時套件安裝漂移）；B同步升級舊Playwright與其瀏覽器版本（成本較高、影響基準截圖與相容性矩陣，本輪不做）。最終 .github/workflows/website-qa.yml 固定 ubuntu-24.04 與 mcr.microsoft.com/playwright:v1.56.1-noble，npm工具維持1.56.1，省去即時apt／browser download；沿用其他QA的官方NotoTC字型curl（90s上限）與fc-cache，git safe.directory只指定當前workspace。沒有降低斷言、刪除失敗檢查或改動contents:read權限。

中間僅pin24的39938124436仍停留相依套件安裝逾七分鐘，因此改為相符預裝容器；該run未算通過、沒有為了綠燈改測試。官方registry manifest HTTP200只證明image tag存在，不當作整趟驗證。最終0a4db2e再經獨立唯讀審查無阻擋；新雲端實際啟動與原測試結果見下方。


最終Website QA [39939042069](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39939042069) 全成功：相符容器初始化、工具／字型安裝、瀏覽器啟動、原基準走查、197項回歸與更新後Chromium探索全過；PR情境的正式部署驗證依原規則skip，沒有說成已跑。完整摘要[legacy-verified.log](checks/legacy-verified.log)略去公開截圖base64長行，原run保留原始log。最新專項[39939042098](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39939042098)亦全成功，與既有Website QA同為受審0a4db2e，後續僅補文件證據。原僅pin24的39938124436為被取代的run，沒有計為通過。兩套最終CI及獨立審查完成，已依使用者授權合併；產品碼仍零變動。


## 發布補記（本輪完成）

[PR #83](https://github.com/RichardHan/ai-agent-use-cases/pull/83) 已依使用者明確授權squash合併為 `998ababb3679ae7de281ce263ac09a34ff8d05bd`，沒有強推。Pages [39939714757](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39939714757) 的正式Jekyll build、deploy及report-build-status全部成功。公開首頁、app.js、style.css、reader.js、reader.css五檔逐byte與合併版本一致；產品／案例／catalog對dc3b1f8零diff。原工作樹仍在原分支，兩項未提交修改保留。

被取代的pin24-only run39938124436最終狀態cancelled，未計通過；不將其等同於最終matching-container成功run。合併後其他背景CI仍有未完成項，沒有宣稱整批主線CI全綠；本輪受審兩套最終PR CI已通過，正式公開完整載入328缺項的原FAIL仍照實保留。最後只補此發布紀錄，不再變更測試、workflow或產品。本輪完成並停止。
