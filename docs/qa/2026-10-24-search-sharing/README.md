# 2026-10-24 搜尋分享等待與焦點保護

目標讀者：分享搜尋結果後繼續用鍵盤閱讀來源說明、調整條件或開啟案例的人。主角色唯一整合／實作者，獨立角色唯讀審查。

## 問題證據與選案

正式站[基準39983410573](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39983410573)實走1440／390首頁、旅遊＋生活＋Grok Bot、詳情、來源、Escape返回與空結果：443條目零缺載、15筆結果。主角色目視首頁、詳情與分享前版圖。[完整紀錄](journey-before/report.json)。443是網站條目，不是嚴格合格案例數。

獨立審查提出分享非同步候選；再由[正式站重現39983843592](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39983843592)以受控Clipboard延後拒絕實際測試：按複製搜尋連結、Tab到來源說明後，焦點仍被強制移至search-share-url。桌面scrollY1070→1103，手機1460→1460，兩尺寸皆選取119字網址。[原始讀值](before/report.json)，不把受控拒絕當成一般用戶發生率。

- A：只加「正在複製」回饋。最低成本，但未處理延後失敗搶回焦點。
- B（採用）：加等待回饋，失敗只在原焦點仍未離開時選取備援網址；離開則顯示備援、保留焦點。成本為6行產品diff、4個單元測試與跨瀏覽器驗證，沿用案例／提示詞複製模式。

驗收：等待有live status；成功不移焦點；失敗保留已移開焦點及當下scrollY，仍等待者獲得選取備援；改變條件後舊請求不回填；開啟詳情後延後失敗不搶焦點；網址保留base path與搜尋條件，直接開啟及重整後完整結果ID集合相同；長Unicode、空結果、手機320與鍵盤焦點不溢位。只保護已移至其他控制的焦點，單純捲動但仍聚焦原按鈕不在本輪承諾範圍。

不處理：案例／來源編輯、證據分類、搜尋排序、首次全文請求量、所有分享方式重構、配色及框架更換。無新增網路請求、第三方服務、cookies或儲存。

## 變更與驗證方式

產品只改assets/app.js的copySearchLink；新增tests/search-share-focus.test.cjs、tests/search-share-focus-browser.cjs與專項workflow。其他產品HTML／CSS／reader皆未改。

```sh
node --test --test-reporter=tap tests/*.test.cjs
node --test tests/search-share-focus.test.cjs
for f in assets/*.js tests/search-share-focus*.cjs; do node --check "$f"; done
git diff 9ee0a36 --check
python3 scripts/preview.py /tmp/round24-preview/ai-agent-use-cases
python3 -m http.server 8170 --directory /tmp/round24-preview
SITE_URL=http://127.0.0.1:8170/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/search-share-focus-browser.cjs
SITE_URL=http://127.0.0.1:8170/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/page-context-browser.cjs
```

開啟 http://127.0.0.1:8170/ai-agent-use-cases/?q=旅遊&scenario=生活&tool=Grok+Bot 。自動化測試以延後的Clipboard promise穩定模擬權限拒絕；一般手動測試需瀏覽器拒絕剪貼簿權限，不要求站點新增測試控制。

基準202項全過，[輸出](checks/baseline-unit.log)。4個新測試先在原碼2過2失敗：[red](checks/red.tap)，修正後全套206過：[輸出](checks/unit.tap)。整合協作者最新來源補充與UC446–448後仍206過：[整合](checks/integrated-unit.tap)。無獨立lint、TypeScript或npm build；node --check是語法檢查，preview是靜態預覽，不冒稱正式Jekyll建置。

首預覽[40052322487](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40052322487)桌面焦點／scrollY已保留，但axe要求explicit browser context而FAIL，[原始失敗](checks/first-preview/report.json)。修測試為browser.newContext，不改產品或放寬斷言；不將此run計整體成功。獨立review要求分享重整後比對完整ID集合與零缺載，已補；TAP存檔只清理尾空白，不改失敗內容。

## 環境與限制

起始9ee0a36，無適用AGENTS.md；讀README、封存維護規則、SITE、近期QA、catalog／preview／Pages規範。原目錄分支improve/search-recall-recent-workflows-and-tokenization及assets/app.js、tests/search.test.cjs未提交修改保留。獨立/tmp/ai-round-20261024與improve/reading-round-20261024，不reset或強推；開放PR78／79／80不混入。fetch後一般merge協作者550bab7，無衝突，內容完整保留。

使用OpenAI Docs skill核對[設定參考](https://learn.chatgpt.com/docs/config-file/config-reference)。本機設定gpt-6.1-sol／medium，主對話runtime無法讀取或切換，不能聲稱已使用帳號最強模型；獨立工具請求gpt-6-astra／ultra，不視為runtime認證。既有訂閱與授權GitHub Actions，沒有另付費API；瀏覽器僅在雲端運作，沒有操作個人GUI。

未驗證真人喜好、真手機、完整輔具認證或Lighthouse。資產app.js增加158bytes、gzip增加9bytes：[真實大小](checks/asset-size.json)，不是效能分數。下一輪優先量測降低首次全文請求成本並保留早讀與部分復原。

## 最終預覽與三種情境

[40058773431](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40058773431)完整成功：新分享與既有完整旅程各Chromium1440／390／320、Firefox390、WebKit390，共10配置；每次首次443條目零缺載。新分享10次、既有詳情／空結果／最終狀態15次axe皆零違規（WCAG A／AA選定規則，不是完整認證）。[分享原始報告](after/report.json)、[完整旅程](journey-after/report.json)、[載入／失敗／部分復原](journey-after/lifecycle.json)、[雲端206單元](checks/cloud-unit.tap)。產品碼與最終預覽一致；之後整合的研究補充及3篇案例由正式發布另外驗證，不把443當成最新正式總數。

以下是自動化模擬走查，沒有冒稱真人偏好、轉換或回訪改善：
1. 找旅遊用途：首頁→關鍵字＋生活＋工具→詳情→來源新頁→Escape返回原卡；空結果能修改關鍵字。長文、直鏈重整、上一／下一、返回／前進與三種關閉沿用完整回歸。
2. 分享後繼續讀：按複製→Tab到來源說明→延後拒絕，原焦點與scrollY皆不變，備援網址可用；打開詳情後才拒絕也不搶焦點。等待者仍取得完整選取網址，長Unicode與320寬空結果不溢位。
3. 改條件再分享：請求中改關鍵字，舊失敗不回填；成功分享後另一分頁開啟與重整，條件、有序案例ID與零缺載皆一致；目錄錯誤、部分來源失敗及早讀背景完成均可復原。

| 狀態 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面延後拒絕，已Tab離開 | [焦點被搶](before/moved-focus-chromium-1440.png) | [保留來源說明焦點](after/moved-focus-chromium-1440.png) |
| 手機390同流程 | [前](before/moved-focus-chromium-390.png) | [後](after/moved-focus-chromium-390.png) |
| 等待複製 | 空白回饋 | [複製中](after/pending-chromium-390.png) |
| 長Unicode／320空結果 | 原有備援行為 | [仍選取完整手動網址](after/manual-chromium-320.png) |

主角色目視桌面、390與320前後圖，焦點環清楚、手動欄位與長條件可讀、無水平溢位。截圖不顯示完整輸入值，完整網址與選取範圍由瀏覽器斷言確認。

獨立角色唯讀審查6行產品diff，另跑16項相關單元及diff check全過；核對三份原始報告、25次主要axe、15筆有序分享結果及3復原，目視1440／390保留來源焦點與320長Unicode備援，結論可合併、沒有產品或視覺阻擋。其要求的ID集合／重整零缺載與TAP尾空白已修正。

建立PR遭GitHub GraphQL拒絕（Enterprise Managed User不能createPullRequest），沒有PR編號；依使用者直接push與merged授權，沿用個人repo已可用SSH remote一般merge，不強推、不更改權限。合併前又同步協作者UC449與來源補充，無衝突；[最新整合206項](checks/release-unit.tap)全過。此輪產品仍只修改app.js，協作者案例完整保留。

## 合併發布與可交付範圍

一般merge並push main為`95e89cd`，無強推。[Pages40062745137](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40062745137)正式Jekyll build／report-build-status／deploy全成功：[jobs](checks/pages-release.json)。[公開資產核對](checks/public-assets.json)五個HTML／JS／CSS皆HTTP200、SHA-256及逐byte符合95e89cd，確定本輪產品已上線。

第二整合預覽[40062671872](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40062671872)也完整成功：446條目、新分享與完整旅程各三引擎五配置、3種復原成功：[分享](checks/integrated-preview/sharing.json)／[旅程](checks/integrated-preview/journey.json)／[復原](checks/integrated-preview/lifecycle.json)。兩次完整預覽合計50次主要axe零違規。正式站的最新條目數未經完整browser驗證，不把預覽446或預期447當成已驗正式數。

協作者後續合併151a432的篩選版面、分享字級與文件，沒有改本輪app.js；快轉同步、[211項單元](checks/latest-unit.tap)全過。其Pages40078381702遭後續dbcda8d取代取消，不列成功；最新Pages40078452838與正式verifier40078392386（95e89cd）、40078471779（151a432）截至交付仍排隊。取消舊verifier的API被403拒絕（需管理權限），未換帳號或修改權限。公開站此時五資產仍完整符合本輪95e89cd，後續新版HTML／CSS不在此次正式驗證範圍。

主線95e89cd自動啟動的31項歷史工作流為13成功、18失敗：[狀態快照](checks/main-ci-status.json)。Corpus loading QA40062745676的正式步驟可見`published assets match checkout`斷言失敗；其他失敗未逐一定位，不能通稱同一根因，也不能宣稱main全綠。本輪首版工具失敗、既有CI失敗、後續排隊與取消均不計成功。

獨立終審核對本輪預覽證據、畫面與公開app.js，結論本輪可交付、沒有產品阻擋；同時明列正式完整browser及協作者新版CSS尚未驗證。本輪停止於已完成的產品修正、跨瀏覽器預覽、獨立review與公開資產核對，不繼續修改他人工作或為等待重啟產品迭代。原工作目錄仍維持兩項未提交搜尋修改。
