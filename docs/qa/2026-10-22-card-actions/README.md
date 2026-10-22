# 卡片操作尺寸：標籤能點，閱讀看得清楚

狀態：已正常合併、部署並完成正式驗收；本輪完成。

目標讀者：第一次在手機搜尋問題，想從卡片繼續篩選或深入閱讀的人。

正式基準[39783296978](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39783296978)實走1440／390px首頁、搜尋、組合篩選、詳情、來源新頁、Escape返回及空結果，423條目、零缺項。主角色目視桌面／手機結果、首頁卡片與詳情。標籤像小型註記，與可操作閱讀文字的尺寸不一致。[原流程報告](checks/published-baseline-journey.json)。

## 兩案、驗收與界線

- A（採用）：沿用既有卡片，將可操作標籤和閱讀按鈕統一至少44px點擊區／14px文字，標題按鈕亦至少44px；長標籤及底列自然換行。成本低；代價是部分卡片變高、長標籤多列。
- B：重排卡片導覽與操作配置。適合後續全面檢討資訊層級，會改動較多視覺與操作順序，成本較高。

驗收涵蓋首頁靈感卡與搜尋結果：桌面、390／320px；標籤篩選、鍵盤焦點、閱讀／精確返回、來源、組合條件、空結果、直鏈重整、長字及待查按鈕。44px是本輪品質標準，不將原版直接宣告為違反WCAG。

不改搜尋語意、案例、來源、證據分類、合格計數或去重；保留原始資料與協作者工作。沒有新框架、產品依賴、動畫、追蹤、cookies、儲存或第三方傳送。

## 實作與前後圖

產品只改`assets/style.css`：標籤14px／44px、間隔8px、標題最小高度、底列wrap與長字換行。保留原hover／pressed配色及focus樣式。測試為`tests/card-targets-browser.cjs`；`.github/workflows/result-journey-qa.yml`在既有授權Actions環境執行，沒有在個人電腦啟動瀏覽器。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440 | [結果](before/results-chromium-1440.png) | [結果](after/results-chromium-1440.png) |
| 手機390 | [結果](before/results-chromium-390.png) | [結果](after/results-chromium-390.png) |
| 窄手機320 | [靈感卡](before/inspiration-chromium-320.png) | [靈感卡](after/inspiration-chromium-320.png) |

同一UC-001供前後比較；只在驗收頁面使用正常deck API固定真實卡片及相符狀態，不更改案例資料。超長文字fixture另標，不冒充作者案例。

## 已完成檢查

基準與目前單元皆169／170：唯一原有失敗為`candidate duplicate detection normalizes URLs and identifies shared external sources without modifying corpus`，固定expected19、actual21，既有PR #78處理同類問題。沒有修改該斷言，也沒有稱全套全綠。[基準輸出](checks/baseline-unit.log)。Repo無獨立lint／TypeScript／npm build；JS語法、git diff-check及Python靜態preview另執行，不冒充正式Jekyll。

先提交測試170c849，再於[39783659151](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39783659151)重現舊版失敗，才修改CSS3032835。[red](checks/red.log)：標籤36×24.5px／10px；結果閱讀按鈕36px高／11px；首頁閱讀39.09px高／14px。[原始量測](before/report.json)。該run整體FAIL是預期新版斷言也對未修CSS失敗，沒有計為green。

指令（瀏覽器僅雲端）：

```sh
node --test --test-reporter=tap tests/*.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
git diff 4c62054 --check
python3 scripts/preview.py /tmp/card-target-build/ai-agent-use-cases
SITE_URL=http://127.0.0.1:8140/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/card-targets-browser.cjs
REFINE_URL=http://127.0.0.1:8140/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/card-refinement-browser.cjs
QA_OUT=qa-artifacts/inspiration SITE_URL=http://127.0.0.1:8140/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/inspiration-handoff-browser.cjs
```

預覽由Python server提供`http://127.0.0.1:8140/ai-agent-use-cases/`；正式站[AI用法實驗室](https://richardhan.github.io/ai-agent-use-cases/)已完成本輪發布驗證。

中間失敗如實保留：39783865525為新增workflow heredoc結尾縮排導致shell語法錯誤，修正e9ced72；獨立審查抓到兩套測試共用after/report.json會覆寫量測，fbb9873改分開輸出。39784059037／39784228827的WebKit在直鏈尚未載完全文就reload時出現32條取消請求pageerror，原run均FAIL，[原始錯誤](checks/intermediate-webkit.log)保留。9622bdc讓該流程等待全文完成再重整；這是驗收邊界調整，不宣稱修復快速重整。7d39396讓受控比較圖改用正常deck API，保持卡片與上方狀態一致。未因測試工具問題更改產品或放寬44px標準。

## 環境與限制

起始4c62054，隔離`/tmp/ai-result-semantics-20261022`；原工作目錄分支與`assets/app.js`／`tests/search.test.cjs`未提交修改完整保留。無適用AGENTS.md；已讀README、SITE、歷史規則、近期QA、catalog、Jekyll及preview／workflow。起始研究PR #79／#80及維護PR #78不混入。

已使用OpenAI Docs技能與[官方模型選擇說明](https://developers.openai.com/api/docs/guides/model-selection)。本機設定檔為gpt-6.1-sol／medium，無法確認或切換本對話runtime，未假稱最高能力設定；獨立角色請求gpt-6-astra／ultra也非runtime證明。唯一主角色實作／整合，另一角色唯讀review；僅既有訂閱與授權GitHub Actions，沒有另付費API／credits或個人GUI操作。

尚未做真人研究、實機／輔具認證或完整WCAG認證，沒有滿意度、留存或轉換率推論。未量測Lighthouse分數；檔案大小估算見[實際gzip尺寸](checks/asset-size.json)，不把靜態server導航時間當正式網路效能提升。

下一輪優先：實測常見任務標籤與全文結果的語意落差，讓入口更符合具體問題；另有既有audit固定計數及舊WebKit1.56閱讀故障，維持原紀錄，不順手重構。

## 完整預覽驗收與獨立審查

[39784469509](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39784469509)完整成功，CSS仍3032835。Chromium1440／390／320、Firefox390、WebKit390共五配置：每配置423條目、零缺項，標題／tag／閱讀控制項最小48×44px、最小14px文字；hover有改變、選取背景有區別、keyboard focus-visible為3px。長中文、不中斷英文、UC-341與P-003、溢出、來源新頁及直鏈重整均通過。主要15次axe WCAG A/AA掃描零違規、pageerror空。[原始專項報告](checks/preview-report-962.json)。不是完整WCAG認證。

三種自動化模擬情境，未冒稱真人喜好：

1. 旅遊問題＋生活情境→結果→鍵盤閱讀→來源筆記新頁→Escape精確回同按鈕。
2. 結果卡標籤用Space套用→保留生活條件、可見結果焦點→Tab接分享→詳情直鏈重整保留條件。
3. 無命中字詞→空結果→修改與重設→多筆恢復；真實較長標籤／待查卡與受控超長中英文在窄卡完整換行。

既有卡片篩選五配置含來源、分享、空結果與5次axe全通過，[輸出](checks/refinement.log)；靈感卡五配置及載入、錯誤、部分補讀、空卡組四生命週期皆通過，[報告](checks/inspiration-report.json)、[生命週期](checks/inspiration-lifecycle.json)。新專項與回歸分目錄保存，未再覆寫。

雲端單元維持169／170，仍僅原有audit21／19，[完整TAP](checks/unit.tap)。JS語法、diff-check與static preview build通過。CSS gzip估算+125bytes、沒有新增產品請求；導航時間原樣存於報告，不宣稱正式站效能改善。

獨立角色唯讀檢查diff、舊／新八張桌面／手機／320px長文與focus圖、原始量測、兩套回歸及red／unit，結論「可合併，無剩餘必修」。報告覆寫、標題與hover漏驗及受控截圖狀態不一致等意見已處理；主角色唯一實作與整合。

最後比較圖補驗[39784703975](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39784703975)同樣完整成功，產品CSS未變；受控單卡的上方狀態與UC-001卡片一致，前後圖均已更新。最終[專項報告](after/report.json)五配置／15次axe全通過，[UC-341窄卡](after/real-UC-341-chromium-320.png)、[待查卡](after/real-P-003-chromium-320.png)、[長字](after/long-labels-chromium-320.png)、[鍵盤焦點](after/keyboard-focus-chromium-390.png)。各次重跑的axe不重複累計為成效；log只清除行尾空白。

## 正式發布完成

正常merge與SSH push到main為`d67b5cc`，沒有reset／強推；協作者其後新增`ed5c715`僅研究紀錄，已正常fast-forward完整保留。原Pages39785586628被該更新取代取消，未算成功；[Pages39785649112](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39785649112)的Jekyll build／deploy／report成功，包含本輪產品。Pages仍legacy main根目錄，沒有改部署方式。

[正式QA39785609776](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39785609776)成功，五個公開HTML／JS／CSS先逐byte比對checkout才實走，[資產hash](checks/published-assets.json)；主角色另HTTP200逐byte核對[五檔](checks/published-http.json)。正式Chromium1440／390／320、Firefox390、WebKit390各423條目完整、零缺項／pageerror，尺寸最小48×44px、字體最小14px，來源新頁、搜尋、組合條件、標籤、焦點、返回、直鏈重整、空結果與長字全部通過，15次主要axe零違規。[正式原始報告](published/report.json)。預覽＋正式各15次主要axe，不重複累計中間重跑。

主角色已目視正式[桌面](published/results-chromium-1440.png)／[手機](published/results-chromium-390.png)；獨立角色另核對正式證據。最後僅補紀錄與圖，不再變動產品。原工作目錄兩項未提交搜尋修改仍在原分支保持不變。

其他主線CI的[實際快照](checks/main-ci-snapshot.json)仍含失敗及執行中，未宣稱全庫CI全綠；本輪必要預覽、正式驗收與獨立review均已通過。原有audit21／19、快速重整及舊WebKit限制照實保留。下一輪優先任務標籤／結果語意對齊，未追加功能或排程。
