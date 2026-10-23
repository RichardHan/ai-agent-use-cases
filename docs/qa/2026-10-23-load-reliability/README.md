# 補讀有進度，也能先用已補回內容

本輪改善部分來源失敗後的復原流程：顯示處理／成功來源數與原生進度條，提供「停止等待，使用已補回內容」。停止後合併已成功解析的完整來源，保留尚未完成的來源供再次補讀。搜尋條件與使用者已移動的焦點保留；原文閱讀不因進度更新而重建。

## 證據與決策

乾淨主線基準 `6233ac0`；獨立工作樹 `/tmp/ai-reliable-corpus-20261023`、分支 `improve/reliable-corpus-20261023`。原目錄 `assets/app.js`、`tests/search.test.cjs` 未提交改動保留，未 reset、搬移或納入本輪。已讀 README、SITE.md、靜態預覽／部署與相關測試規範，未找到適用 AGENTS.md。開啟研究 PR #78、79、80 保持原狀，未自行整合。

[正式走查39957918451](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39957918451) 桌面1440／手機390各443條目、441次全文HTTP200請求，首次可搜尋分別3512／4424ms；旅遊＋生活各19筆、閱讀來源、來源新頁、返回焦點與空結果均完成。是單次雲端觀測，不代表普遍速度或真實裝置成效。443是網站條目數，不是嚴格合格案例數。

[受控慢來源39958134341](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39958134341) 在正式站攔截兩個來源初始404，補讀時第一篇正常回應、第二篇用gate暫停。桌面／手機顯示441筆與「正在重試…」，沒有成功／處理進度，也沒有停止入口；第二篇放行後才變443筆。此測試不宣稱正式站真實HTTP404或大量缺項根因已確認。

目標讀者是搜尋中遇到部分來源未載入、願意再試但不想被最慢來源綁住的人。

- A（採用）：補讀進度＋由訪客停止等待並採用成功內容。成本低、更新結果的時機明確；仍須主動停止才能提前取得內容。
- B：逐篇完成即自動更新結果。更早可用，但必須處理持續重排、閱讀位置及焦點，成本較高，本輪不做。

驗收：看得到正確處理與成功數；停止保留已完成來源及原有內容；零成功停止與再次補讀正常；不重複請求已成功來源；pending一檔多筆完整保留；重複停止／重入安全；停止按鈕消失後回適當焦點，若使用者已閱讀／輸入則不搶焦點。桌面、390、320及三引擎驗證；搜尋、組合篩選、空結果、直鏈重整、返回、來源與長文字回歸。

本輪不更改案例、證據分類、來源、去重、合格數、搜尋語意、併發量或部署架構，不新增產品依賴、追蹤、cookies、登入或資料外送。首次全文請求成本與正式大量缺項未知根因仍未解決。

## 模型、環境與獨立審查

本機 config 記載 `gpt-6.1-sol / medium`，不能當成此對話實際模型／推理檔位或最高帳號權限的證據。主對話無可驗證切換介面，沒有假稱最高設定已啟用。獨立角色以可用調度介面要求 `gpt-6-astra / ultra`，但該角色亦無法獨立確認執行中模型。只用既有授權與訂閱，無購買額度或改用API金鑰。

主角色單一整合者、另一角色唯讀審查。Orca CLI 回報 `Unable to determine Orca.app path from symlink: /usr/local/bin/orca`，未繼續操作。主要與正式驗收瀏覽器均在 GitHub Actions。獨立角色曾誤啟本機無頭fixture，已要求停止並確認完全關閉；該結果不列驗收，也未操作個人桌面應用。此偏差照實保留。

獨立審查指出原版停止時先設定 disabled 可能讓 activeElement 消失；改用 aria-disabled 保持焦點至完成，再依是否仍有缺項回重試／結果數。未移動使用者正在輸入／閱讀的焦點。

## 測試與限制

基準197/197單元通過。先新增3項測試，重現無進度／無停止功能後再實作；最終擴充零成功、重入、pending多筆等測試。初版測試fixture嘗試指派const造成工具失敗，修fixture後的功能red保存在 [red.tap](checks/red.tap)，沒有把工具錯誤當成功重現。

```sh
node --test --test-reporter=tap tests/*.test.cjs
for f in assets/*.js tests/recovery-progress*.cjs tests/reliability-observe.cjs; do node --check "$f"; done
python3 scripts/preview.py /tmp/ai-reliability-preview/ai-agent-use-cases
# 以下只於雲端runner執行
python3 -m http.server 8184 --directory /tmp/ai-reliability-preview
SITE_URL=http://127.0.0.1:8184/ai-agent-use-cases/ node tests/recovery-progress-browser.cjs
SITE_URL=http://127.0.0.1:8184/ai-agent-use-cases/ node tests/page-context-browser.cjs
```

repo沒有獨立lint或TypeScript設定；JS語法檢查不是lint／type check。Python preview不是正式Jekyll build，正式建置另由Pages確認。自動axe只涵蓋可檢測WCAG A/AA規則，不等同完整讀屏器或真人可用性研究。沒有捏造效能／留存分數。

中間雲端39958556423、39958603063及39958716880因新增測試以 browser.newPage 建立implicit context，axe要求explicit context而失敗；已改用 browser.newContext＋context.newPage，保留所有產品斷言。原始run保留，不計通過。

## 畫面與最終結果

[最終預覽39959063284](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39959063284) 成功：202單元、JS syntax、static preview；三引擎五配置補讀停止＋零成功／閱讀兩個附加情境共7配置，5配置完整page-context旅程及3種載入／錯誤／部分復原全過。主要28次axe掃描0違規，停止操作高度全部44px，無pageerror。初始441筆，停止後442筆且保留確切1個未完成來源，再試後443筆；zero保持441筆再試至443。閱讀容器、原文段落與指定summary焦點均保留；未量測閱讀捲動位置，不擴大宣稱所有閱讀錨點均已驗證。

| 畫面 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面補讀 | [只有等待文字](before/waiting-chromium-1440.png) | [進度及停止入口](after/waiting-chromium-1440-stop.png) |
| 手機補讀 | [只有等待文字](before/waiting-chromium-390.png) | [進度及停止入口](after/waiting-chromium-390-stop.png) |
| 停止後 | 無此操作 | [成功內容已採用，仍可重試](after/stopped-chromium-390-stop.png) |
| 320px | — | [完整換行與44px操作](after/waiting-chromium-320-stop.png) |

主角色已實際目視桌面／手機前後圖，沿用既有暖色復原區塊、字級與留白，沒有改全站配色。完整機器報告見 [補讀報告](after/report.json)、[旅程](checks/journeys.json)、[載入復原](checks/lifecycle.json) 與 [單元輸出](checks/green.tap)。獨立唯讀審查 `4885cb8` 無阻擋，見[審查紀錄](checks/independent-review.md)。

PR建立因EMU限制遭GraphQL Unauthorized，沒有修改權限；依使用者既有授權沿用SSH一般merge。發布後只跑桌面／手機補讀與手機閱讀三配置，以及兩尺寸常態流程，避免再次對公開站執行整套多輪全庫請求；完整三引擎／直鏈重整已在上述預覽驗收，不把縮小的正式走查稱全矩陣。

三情境：(1)第一次旅遊＋生活＋工具搜尋、讀來源並返回，無結果後修改關鍵字；(2)補讀遇慢來源，觀察進度、鍵盤停止、使用已補回內容，再試至完整；(3)分享直鏈重整、跨案例與歷史返回，以及補讀期間繼續讀原文而不丟焦點。皆為模擬流程檢查，不宣稱真人偏好或轉換提升。

變更檔案：`assets/app.js`、`assets/style.css`、`index.html`、`tests/recovery-progress.test.cjs`、`tests/recovery-progress-browser.cjs`、`tests/reliability-observe.cjs`、`.github/workflows/reliability-round-qa.yml`、`SITE.md`及本輪證據。預覽可用上述build後在 `/ai-agent-use-cases/` 開啟；公開網站部署後同路徑可用。

下一輪優先量測並降低首次全文請求量，保留單篇早讀與部分補讀；不要把本輪停止等待當作已修復載入根因。


## 發布進度與明確驗收範圍

一般merge `b4317da`已推送main，沒有強推；PR API因EMU限制被拒。正式首驗39959816385在Pages仍排隊時，因公開index.html與預期版本不同而FAIL，保留[原log](checks/published-before-deployment.log)，沒有拿舊站當成新版成功。

正式常態旅程使用既有 QA_OBSERVE 模式：實走兩尺寸搜尋、組合篩選、來源開啟、返回焦點與空結果，記錄title；此模式不執行title斷言與detail／empty的兩次axe，僅結尾axe。完整title、各狀態axe、直鏈重整與歷史回返已由最終預覽5配置執行通過。正式補讀三配置仍保留原成功數、停止、再次補讀、焦點、原文節點與axe斷言；沒有聲稱縮小的正式流程與完整預覽相同。

主線既有其他QA存在失敗／執行中，不宣稱整批main CI全綠。此次只據明確專項、獨立審查與實際Pages結果判斷本輪驗收。

Pages [39959790740](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39959790740) 的正式Jekyll build、report及deploy已全部成功，deployment SHA為 `b4317da99329a63610081713705408b26d066c53`。公開首頁、app.js、style.css、reader.js、reader.css五檔HTTP200且逐byte吻合。EMU帳號無admin權限不能rerun既有驗收，改以授權SSH推送僅文件補記觸發新版正式驗收；產品資產未改。

## 最終正式站驗收與停止

[正式39961197141](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39961197141) 全成功：202單元、五公開資產逐byte相同；桌面1440／390停止補讀及手機reader三配置，另兩尺寸常態旅程均通過，7次主要axe0，所有pageerror空。兩尺寸常態全庫皆443條零缺項；受控兩來源失敗時441筆，停止後442筆且焦點在可見重試入口，再試補齊443；手機reader原文段落／容器及指定焦點保留。這是模擬走查，沒有聲稱真人滿意或留存提升。

主角色已目視正式圖：[桌面進度](published/waiting-chromium-1440-stop.png)、[手機進度](published/waiting-chromium-390-stop.png)、[手機停止後](published/stopped-chromium-390-stop.png)，並和修改前對照。正式機器報告：[補讀](published/report.json)／[常態旅程](checks/published-journeys.json)。預覽28＋正式7＝35次本輪主要axe掃描零違規，仍不等同人工讀屏器或實機驗證。

原工作樹兩檔SHA-256和開始完全一致：app.js `6e70c1c846de9eea49839382b74c84819a23ac9368851d505556f164b41dba23`，search.test.cjs `3313f45de597da1113165e153ff59f78a04715bc650de923395a611b50271821`；原分支、未提交改動及協作者研究PR保持。

[主線CI快照](checks/main-ci-snapshot.json) 包含本次merge的其他失敗與執行中工作，沒有宣稱main整批全綠。此次專項最終預覽及正式均成功，Pages正式build/deploy成功；首輪舊版資產比對FAIL照實保留。最後僅補文件與發布圖，不再變更產品／測試／工作流，本輪達到驗收並停止。

最後補推證據時遇到協作者主線 `bf7a490`（INDEX、UC-067與研究筆記補充），首次push被non-fast-forward安全拒絕。已一般merge完整保留，無衝突、無強推；五產品資產對已正式驗證的b4317da零diff。此後新增的協作者研究文字不冒稱已由本輪舊快照驗收。
