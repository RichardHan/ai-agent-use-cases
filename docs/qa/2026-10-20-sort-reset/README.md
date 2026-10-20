# 2026-10-20：看得見並撤回最近核對排序

對象：從首頁「最近核對的內容」或分享連結進入，再輸入任務搜尋的訪客，尤其是預設收合選單的手機讀者。目標是讓排序狀態可辨識，且不用重新展開完整篩選即可恢復預設順序。

基準 `32d8305`，讀過 README、SITE、Jekyll `_config.yml`、preview 與 QA workflows；repo及祖先無適用 AGENTS.md。原目錄分支 `improve/search-recall-recent-workflows-and-tokenization` 的 app.js/search.test.cjs 未提交修改不動，從 fetch 後的 origin/main 建立 `/tmp/ai-filter-summary-20261020` 與獨立分支 `improve/filter-summary-20261020`。保留其他工作樹，起始沒有 open PR。

本機設定檔顯示 `gpt-6.1-sol / medium`，無法證明主對話實際模型與推理設定，也無法核實帳號模型上限。[官方文件](https://developers.openai.com/api/docs/guides/model-selection)不等於本帳號可用設定。獨立只讀設計／審查角色透過現有協作工具明確請求 `gpt-6-astra / ultra`，主角色為唯一整合者；不宣稱主對話已切換。未使用另付費API、購買credits或操作個人GUI，瀏覽器與安裝測試依賴皆在已授權GitHub runner；本機只使用已授權檔案、git與現有工具。

## 實際問題與方案

[正式站基準39444692292](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39444692292)在1440／390／320實際完成首頁、旅遊＋生活＋Grok Bot搜尋、詳情、來源HTTP200、直鏈重整、返回與空結果復原。另三尺寸檢查 `?sort=reviewed#explore`：排序值確為reviewed，但摘要皆為「未設定篩選」，手機選單收合；既有日期說明在結果區可讀，因此問題是排序狀態與復原入口不對稱，不能聲稱完全沒有說明。[原始數據](published-before/filter-entry/report.json)、[完整走查](published-before/baseline/report.json)。

- A（採用）：摘要保留篩選數、補「頁首最近核對」，結果說明旁提供44px「恢復預設排序」。成本低，預設無排序狀態不新增可見區塊。
- B：將排序原生select移到結果區常駐。雙向切換較清楚，但對所有訪客增加手機高度與掃描成本，也擠壓結果數及分享按鈕。

不改案例資料、證據判定、合格計數、搜尋語意、清除篩選的既有語意、框架與載入架構。sort不算篩選，不影響最少條件復原；日期不是發布／新增／獨立驗證的完整說明保留。

## 驗收標準與模擬情境

1. 回訪者由首頁進最近核對，收合摘要可辨認排序，鍵盤可恢復預設；結果ID集合與抽卡內容不變，焦點回可見結果數，URL只移除sort。
2. 任務搜尋者使用關鍵字與五類篩選；分享、直鏈重整、開詳情、來源新頁、關閉與Back保留排序。恢復預設後保留全部查詢條件，並確實回到原本符合順序。
3. 零結果仍可單獨恢復排序；清除篩選保留排序，長輸入不溢出；載入中與全載入失敗不出現孤立按鈕，部分失敗保持警示並可重試。

涵蓋Chromium1440／390／320、Firefox390、WebKit390，觸控高度≥44px、文字對比與WCAG A/AA自動掃描、既有搜尋提交及最近核對完整回歸。這是模擬操作檢查，不代表真人喜好或轉換率提升。

## 本機指令與結果

- `node --test tests/*.test.cjs`：基準123/123通過；新增兩項測試先2/2失敗，修正後125/125通過。[基準](unit-baseline.tap)、[red](unit-red.tap)、[green](unit-green.tap)。red先修正fixture的const重指派錯誤後重新執行，保存的是兩個新行為缺失的失敗。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：全部通過。
- `python3 scripts/preview.py /tmp/filter-preview/ai-agent-use-cases`：靜態預覽成功。repo沒有獨立npm build、lint或TypeScript檢查，語法檢查不冒稱lint。正式Jekyll另由Pages驗證。
- 雲端：`node tests/sort-reset-browser.cjs`，並對相同子路徑預覽執行 `tests/search-submit-browser.cjs`、`tests/recent-review-browser.cjs`。

產品檔案為 `assets/app.js`、`assets/style.css`、`index.html`。新增 `tests/sort-reset.test.cjs`、`tests/sort-reset-browser.cjs`、`.github/workflows/filter-entry-qa.yml`；`tests/filter-entry-browser.cjs`是本輪首次正式站診斷。QA原始結果與SITE維護紀錄另存。

## 預覽與限制

```sh
python3 scripts/preview.py /tmp/filter-preview/ai-agent-use-cases
python3 -m http.server 8124 --directory /tmp/filter-preview
# http://127.0.0.1:8124/ai-agent-use-cases/?sort=reviewed#explore
```

未驗證實體手機、原生觸控鍵盤、真人螢幕閱讀器或使用偏好；axe不等於完整無障礙認證。未量測Lighthouse或轉換率。246項分類選單依然很長，屬於本輪診斷中觀察到但未改的探索成本；下一輪優先降低首次全文載入成本，保留直鏈早讀、全文搜尋與失敗復原；246項分類選單的探索成本另留待後續，不杜撰難度或重新分類原始案例。

正式發布結果將於合併後補記。

## 已修正的驗收工具與審查問題

第一次預覽[39445204150](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39445204150)在第一組桌面axe掃描因測試使用browser.newPage而非明確browser.newContext中止，沒有取得完整互動通過結論；[當時報告](first-preview/report.json)保留。改為explicit context，不降低產品斷言。獨立審查也發現workflow的unit輸出經tee時沒有可靠pipefail，已明確設定shell:bash；load同步隱藏新增wrapper及按鈕，使載入狀態一致。兩finding修正後由同一獨立角色只讀複核。

產品三檔未壓縮增加1,074 bytes，gzip檔案計算差額合計213 bytes，詳見[檔案尺寸](asset-sizes.json)；沒有新增前端依賴。這不是實測網路傳輸量、載入速度或Lighthouse分數。


## 最終預覽驗收

[雲端39445538447](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39445538447)成功，驗收產品提交44795f1。125/125單元、JS syntax、靜態預覽；新三情境×五配置與載入中／部分失敗／重試／全失敗／重試全部通過，未放寬門檻。新流程10次axe零違規、pageerrors空，來源實際新頁HTTP200。既有搜尋提交五配置5次axe、最近核對五配置10次axe也通過，合計25次主要axe零違規；最近核對逐筆核對395筆條目原始Markdown與checkout相同。

[新流程報告](after/report.json)、[搜尋提交](search-submit.json)、[最近核對及全庫核對](recent-review.json)、[同資料基準修改前](before/report.json)。公開初次基準394筆與固定預覽395筆的差異來自基準已新增案例UC397，不是本輪改寫資料；視覺前後比較以下同一批395筆。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440（同樣收合） | [before](before/before-chromium-1440.png) | [after](after/after-chromium-1440.png) |
| 手機390 | [before](before/before-chromium-390.png) | [after](after/after-chromium-390.png) |
| 手機320 | [before](before/before-chromium-320.png) | [after](after/after-chromium-320.png) |

[Firefox手機](after/after-firefox-390.png)、[WebKit手機](after/after-webkit-390.png)。主整合者已實際開圖比對：新按鈕手機另起一列，320px摘要自然換行，無遮擋或水平溢出。手機最近核對狀態的首卡因此往下移，是直接復原入口的成本；預設狀態無此按鈕與說明容器。未將這項操作檢查冒稱真人喜好。

獨立角色最後實讀44795f1產品diff、四份報告、125項unit及八張前後／三引擎圖，結論可合併、無剩餘產品必修，亦核對recent的378個已知日期與17個未知日期。此結論對預覽版本，正式發布須另驗。既有submit回歸的Chromium390與WebKit390外部來源HTTP429，其餘200；新sort流程桌面實際新分頁及來源HTTP200。外部限流原樣保留，不概括為所有來源皆可用，也不把連結可達當案例事實核驗。

## 正式發布驗收

一般merge [`b0fd745`](https://github.com/RichardHan/ai-agent-use-cases/commit/b0fd74514153f3322fcbd3868a4aae50f6dcd28d)已推送main；[Pages39446752901](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39446752901)正式Jekyll建置與部署成功。[main Filter entry QA39446753692](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39446753692)整套成功：再次跑完整預覽，並完成公開HTTPS的1440／390／320三情境、6次axe零違規、pageerrors空、來源新頁HTTP200。公開三檔與checkout逐byte一致，[獨立HTTP核對](published-assets.json)、[runner資產核對](published-run-assets.json)、[正式流程](published/report.json)。主整合者已實際檢視[正式桌面](published/after-chromium-1440.png)與[正式手機](published/after-chromium-390.png)。

本次部署曾排隊，部分舊QA在公開資產更新前逾時，未冒稱整批CI全綠。Related、Return visibility、Partial Load、Combined recovery、Home search entry及Search relevance的失敗訊息為資產不符／部署等待逾時，部分原始log保存在[背景失敗](background-failures/related-assets.log)；其他結果以[CI快照](main-ci.json)為準。Improvement round正式流程另在部分來源未完成時對「已載入」文字的斷言失敗，不當作已修復。

原Search submit QA39446753725已匹配公開資產後，在WebKit390出現焦點失敗（[原始報告](background-failures/search-submit.json)、[log](background-failures/search-submit.log)）：+350ms時results-count仍正確且在視窗內，接著原script先截圖、再讀trace、最後才按Tab；截圖前state正確；截圖後保存的trace已記錄Tab之前失焦回捲，不能確定由截圖造成，也不能說是Tab之後才發生。該情境sort為預設，新按鈕隱藏且DOM在原分享按鈕後。這與本輪預覽兩次全五配置通過不同，因此另保留原斷言、以新舊固定基準及等時等待做對照，未直接更改產品焦點保護或宣稱根因已修。

### 正式鍵盤補驗與結論

[診斷39448602753](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39448602753)使用新舊固定預覽及公開網站三個variant，各以截圖／等時等待兩模式與三次交錯fresh context，18次全部保持results-count焦點，Tab皆到copy-search-link；來源缺項與pageerrors皆空。[18次原始焦點紀錄](supplement/focus-controls.json)。此diagnostic是觀察腳本，不以workflow成功取代逐筆passed欄位核對；整合者已核對18/18。這次沒有重現原失敗，無法證明截圖是確定根因，也不宣稱已修好。

[補驗39448450877](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39448450877)另在正式站執行**未修改的**原search-submit完整腳本，五配置全部成功、5次axe零違規、WebKit原生Tab通過；[原始結果](supplement/original-submit.json)。Chromium320來源HTTP429，其餘四配置200，來源限制仍保留。此成功補證不覆寫原run的FAIL，也不是產品修正。診斷程式與workflow僅保留在[verify/sort-release-20261020／fb9d397](https://github.com/RichardHan/ai-agent-use-cases/commit/fb9d397df36d0543b9a9355a23b18ea62c1e69dc)分支，不合併額外產品或CI變更。

本輪功能達成、正式發布成功；預覽25次主要axe、正式新流程6次、原搜尋正式補驗5次皆零違規，原始背景失敗與未核實根因保留。未量測真人使用、原生手機鍵盤、Lighthouse或轉換率，不將自動掃描視為完整無障礙認證。至此停止追加功能。


最終獨立角色再實讀正式報告、資產核對、18次對照與未改原腳本的五配置補驗，確認上述數據與限制忠實，可交付、無新增產品阻擋問題。後續未重現不等於修復WebKit。最終CI快照另包括Method shortcut及Reader controls在正式站等待首張卡片60／30秒逾時，Missing shared case被取消；其根因未核實，不冒稱只是部署等待，也不延伸修改本輪之外的載入邏輯。本輪新流程與正式原搜尋補驗皆來源完整，仍保留這些背景失敗作下一輪降低載入成本的證據。
