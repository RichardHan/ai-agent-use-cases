# 首次載入全文整包，保留分享早讀與逐篇復原

已一般merge至main（a2d34f2），文件建置修正後以3dc623f完成Pages正式部署；公開驗收40082434605成功。正常首頁全文請求445→1，分享搜尋結果在首屏可見；253單元與三引擎整合、正式桌面／手機及獨立審查通過。前後圖、指令、原始失敗與限制均保留於本文。

本輪將搜尋全文的正常傳輸由四百多個 Markdown 請求改為同站整包；仍用同一 parseFile、搜尋、篩選、閱讀及補讀管線，不重做內容 schema。整包失敗、過期、缺漏、格式錯誤或等待超過 2.5 秒，於原 20 秒總期限內回退逐篇載入。分享單篇與整包平行讀取，可先看成功的指定案例；整包成功後取消多餘的單篇等待。

## 問題證據、使用者與決策

開始基準 1cd0534，原工作目錄分支 improve/search-recall-recent-workflows-and-tokenization 的 assets/app.js、tests/search.test.cjs 未提交修改完整保留，未 reset／搬移／納入。本輪獨立工作樹 /tmp/ai-catalog-bundle-20261024、分支 improve/catalog-bundle-20261024，由主角色單一整合，另一角色唯讀審查。未找到適用 AGENTS.md；已讀 README、SITE 前次紀錄、靜態預覽／Jekyll 部署規範及測試。既有研究 PR #78／79／80 保持原狀；協作者期間的研究、搜尋分享、篩選文字及閱讀選取修正以一般 merge 保留。

[正式站基準40058772515](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40058772515) 實走1440／390：各444個全文 HTTP200請求，446個網站條目、零來源缺項；首次可搜尋分別2433／943ms。完成首頁、旅遊搜尋、生活篩選、UC-001詳情、來源新頁、返回焦點及空結果。這是雲端單次觀測，非真人研究、實機或普遍速度；446是網站條目，不是合格真實案例數。原始報告與截圖在 before/。

目標使用者：第一次到訪、想用自己的問題搜尋案例的人，以及拿到案例直鏈、想立即閱讀來源的人。

- A（採用）：建置時產生同站全文整包，正常只取一包；有明確請求減量，需付出原文保真、版本及早讀／回退測試成本。
- B：僅調整逐篇併發與順序；改動較小，仍有四百多請求，可靠性與速度效益不確定。

驗收：同建置 catalog／bundle revision一致；原文逐 UTF-8 byte相同；全部來源集合一致、無重複或來源外路徑；同樣全文解析、結果與閱讀內容；正常首頁只發1次全文整包請求；直鏈早讀、關閉不重開、焦點與閱讀DOM保留；整包404／破損／版本不符／超時回退，停止後保留成功項、精確缺項並可再試；桌面、390／320、三引擎及三種完整使用情境成功。

不處理：案例新增／刪除、去重、難度評定、證據分類、合格數、搜尋語意、品牌配色、框架或部署來源切換。沒有追蹤、cookie、登入、服務端、產品依賴或新增第三方資料傳輸。

## 實作與可預覽方式

catalog.json 宣告建置 revision；corpus.json 用相同 site.static_files 選取來源，JSON string保存原文。app.js 驗完整契約後，仍由 parseFile解析；來源級Map保留已成功內容及一檔多筆pending，不重抓成功的分享來源。舊catalog沒有bundleRevision時完全沿用舊管線。所有資源為同源相對路徑，保留 /ai-agent-use-cases/ base path。

變更檔案：assets/app.js、catalog.json、corpus.json、scripts/preview.py、scripts/check_corpus_bundle.py、tests/corpus-bundle.test.cjs、tests/corpus-bundle-browser.cjs、tests/source-route.cjs、既有逐篇故障browser fixtures、.github/workflows/corpus-bundle-qa.yml、SITE.md及本輪QA。fixture改動只明確停用optional bundle以繼續攔截來源；原功能斷言未移除。

```sh
node --test --test-reporter=tap tests/*.test.cjs
for f in assets/*.js tests/*.cjs; do node --check "$f"; done
python3 scripts/preview.py /tmp/ai-bundle-preview/ai-agent-use-cases
python3 scripts/check_corpus_bundle.py /tmp/ai-bundle-preview/ai-agent-use-cases
# 使用授權雲端或自己的環境開預覽
python3 -m http.server 8190 --directory /tmp/ai-bundle-preview
# http://127.0.0.1:8190/ai-agent-use-cases/
```

本輪瀏覽器皆在既有GitHub Actions執行，未操作個人桌面應用。repo沒有獨立lint或TypeScript設定；node --check是語法檢查，非lint／type check。preview.py成功不代替真正Jekyll，另跑 actions/jekyll-build-pages及輸出逐byte checker。

## 測試、審查與限制

基準202/202單元。先新增測試，在舊逐篇實作得到4通過／10失敗，再實作。最新整合240/240單元，JS語法及Python preview／byte parity通過。獨立審查找到同時完成的回呼進度矛盾、發布完整集合檢查及一個遺漏故障fixture；均修正，精準競態在舊碼17/18、新碼18/18。詳見 checks/independent-review.md、red.tap、race-red.tap及integrated-unit.tap。

[第一預覽40062885406](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40062885406) 成功：真Jekyll與Python預覽444來源逐byte一致；三引擎五配置全部446條、零缺項／pageerror，正常首頁0個.md＋1個corpus.json請求；6種整包／早讀／停止情境、5配置page-context與7配置補讀成功。此run是e0c5b95，不冒稱最終整合或正式部署。其327–669ms是runner本地伺服器時間，不能直接和正式CDN基準比較速度百分比。

三情境：(1)首次旅遊＋生活＋工具搜尋、鍵盤閱讀、來源、返回與空結果修復；(2)整包失敗／慢來源改逐篇，停止後採用成功內容、再試補齊；(3)分享案例先讀原文、背景完成不換DOM／焦點，直鏈重整、跨案及歷史返回，另檢查長內容與文字選取。全部是模擬檢查，沒有宣稱真人偏好、轉換或留存已提升。

風險與未驗證：整包原文約2.8MB，減少請求不等於減少所有下載bytes，弱網可能進入逐篇回退。未測真實手機／讀屏器，axe只涵蓋可自動偵測的A/AA規則。沒有捏造Lighthouse或留存分數。

Jekyll include_relative會執行Liquid，目前來源無 Liquid變數／標籤起始符號；未來含這類原文範例可能轉換或建置失敗。保真CI在來源變更觸發並會明確失敗，不能為過檢查改寫研究原文。既有branch Pages部署與QA獨立，這不是自動阻擋部署的required check；本輪未變更倉庫保護設定。依據：[Jekyll includes](https://jekyllrb.com/docs/includes/)。

模型：本機config為gpt-6.1-sol／medium，但主對話無可驗證runtime模型與推理設定或切換介面，未宣稱已使用最高檔。獨立架構／審查調度要求gpt-6-astra／ultra，仍無可獨立驗證runtime metadata。只用既有訂閱及已授權GitHub Actions，未購買credits或使用API金鑰。

下一輪優先量測真實弱網下的整包大小與回退門檻，再決定是否分包；維持原文保真及分享單篇早讀。

## 最新整合、畫面與發布

完整預覽、整合與正式發布結果分列如下，保留每個版本的驗收範圍及中間失敗。

權限紀錄：已實際嘗試建立可審閱PR，GitHub回報Enterprise Managed User的createPullRequest Unauthorized；未改權限或存取私人憑證。依使用者既有push／merge授權，驗收後改採已授權SSH一般merge。試圖取消本輪被取代的排隊run亦因非admin而403，未再嘗試提權，未取消協作者工作；排隊／舊run不計為最終成功。

## 加跑舊閱讀回歸後發現的到達問題

40078675707的240單元、Jekyll／445來源逐byte、controlled before、完整bundle矩陣、page-context五配置、補讀七配置均成功；但加跑原reader-browser時，內嵌arrival-browser的「分享搜尋結果數在首屏」斷言失敗，整趟列FAIL。未移除或放寬原arrival-browser／arrival-live斷言，原log見checks/first-integrated/failure.log。

[診斷40079825057](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40079825057) 在同HTML／CSS／447條內容，僅切換dbcda8d原app與新app，確認1440×1000的結果數top原版1050.906、新版1051.156px；篩選面板617.469px，即時與700ms後相同，390／320兩版都正常。雙桌面圖已目視；這是已有的初次到達版面問題，並非證明bundle造成。報告與圖在checks/arrival-baseline/。

因本輪目標包含更快進入搜尋，一併修好到達流程：僅允許自動到達時，若已開的進階面板使結果底部超過可用高度，先收合再沿原流程捲至搜尋標題。保留14px／44px可讀控制、篩選值、外部條件標籤與展開入口；高視窗／已關面板／resultsOnly返回不改。原allowAutomaticArrival保護已互動的使用者，另保護面板內既有焦點；不在render／resize反覆執行。

先加7項真函式單元得到6pass／1fail，再修為7pass；原完整到達測試繼續作為回歸gate。獨立角色已覆核設計，並要求補實際重開、閱讀返回及載入中互動檢查；已加入雲端幾何腳本。這是依實證擴充的同一搜尋進入流程，不改協作者的字級與選單網格。

## 完整預覽成功（02fc447）

[40080656461](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40080656461) 全成功：247單元、真正Jekyll與445來源逐byte；三引擎五配置447條完整、搜尋／組合篩選／空結果／直鏈重整／來源／返回、六種bundle故障及早讀、七補讀配置皆通過。原本失敗的arrival-browser與arrival-live完整原斷言、reader三種尺寸、全庫447條／3441段落／466證據列、文字選取回歸亦成功；相關axe報告均零違規，無pageerror。

同job同資料對照445個逐篇請求→1個整包，桌面682→259ms、手機680→247ms，兩者447條、旅遊＋生活＋Grok Bot同16筆。這是單次runner本地測量，不代表所有網路或實機速度；原正式基準與此不同環境，不算提升百分比。

到達幾何：1440×1000的結果數1050.906→483.203px，查詢仍在159px附近、焦點search-title；1440×1600維持展開，390／320原本收合仍正確。手動重開、選取、閱讀／Escape返回保持open；在真正discoveryReady=false時的操作亦保留summary焦點與面板。已目視前後桌面、手機、內容來源與結果圖。

| 畫面 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面分享搜尋 | [展開面板占滿首屏](after/arrival-baseline-1440x1000.png) | [查詢、條件與結果可見](after/arrival-bundle-1440x1000.png) |
| 手機分享搜尋 | [原版390px](after/arrival-baseline-390x844.png) | [保留查詢與條件](after/arrival-bundle-390x844.png) |
| 組合結果 | [同資料16筆](controlled-before/results-chromium-390.png) | [同結果16筆](after/results-chromium-390.png) |
| 內容閱讀 | [同原文來源](controlled-before/reader-chromium-390.png) | [原文保持一致](after/reader-chromium-390.png) |
| 高視窗 | 原可展開 | [1600px仍展開](after/arrival-bundle-1440x1600.png) |

中間ad681d5／6dc726a的診斷腳本locator同時匹配外層篩選與內層分類summary而FAIL；02fc447改為直接子層selector。未改產品斷言、放寬高度或吞錯；原run40080464450／40080632770保留，不計成功。

發布前主線193dcf0新增協作者閱讀歷史返回，已正常merge、無衝突、無覆蓋；該變動涉及showDetail／popstate，故補跑整合及原reading-history-browser，而不將上述02fc447當成最新整合驗收。

## 發布用整合驗收

[最終整合40081247218](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40081247218) 全成功，head d63eec1，已完整包含main686b38e的閱讀歷史及其他協作者成果。253/253單元、語法、真正Jekyll與445來源逐byte、三引擎五配置447條完整，所有本輪bundle／早讀／停止／補讀／到達、原reader／arrival原斷言／selection，以及reading-history五配置（段落位置、表格水平位置、相關案例返回與可見焦點）成功；所有相關axe零違規／pageerror空。最新報告、單元輸出與畫面在release/，不將02fc447的舊快照冒充最新。

本輪產品在ad681d5後凍結，後續僅QA與一般整合協作者主線。原工作目錄兩檔SHA仍與開始一致。接著依既有授權一般merge／SSH推main，再核對正式Pages與公開全來源內容；正式成功前不列發布完成。


發布建置補正：main首次QA40081730488因本輪新驗收README包含未跳脫Liquid片段而FAIL，源自保存文件而非前述產品程式。已改成安全文字敘述，不改研究來源或產品；後續必須以包含最終文件的真正Jekyll建置及正式站核對通過，不能沿用只有產品分支的成功。


## 正式發布完成與停止

[Pages40082246570](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40082246570) 的build、report、deploy全部成功，部署3dc623f。初次a2d34f2的Pages40081729847及mainQA40081730488因新QA文件Liquid語法而失敗，已修安全文字；沒有將這兩次算成功。

[正式驗收40082434605](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40082434605) 全成功：253單元、包含最終驗收文件的真Jekyll、五公開產品檔逐byte一致、catalog／bundle完整445來源集合與revision／version／重複檢查、所有原文UTF-8 bytes吻合。1440／390各447條完整、正常首頁0個Markdown＋1個整包請求；旅遊＋生活＋工具同16結果，來源閱讀、返回焦點、空結果編輯、分享搜尋首屏及直接案例重整均通過，pageerror空、4次正式axe零違規。正式單次可搜尋845／300ms，只是雲端觀測，不當成普遍速度。

正式分享結果數top為483.438／509.75px，查詢及條件仍可見。主角色已目視[正式桌面](published/shared-search-chromium-1440.png)、[手機](published/shared-search-chromium-390.png)、[來源閱讀](published/reader-chromium-390.png)，與本文修前圖比較。原始[正式報告](published/report.json)、[資產與原文核對](published/asset-and-source-matches.log)、[單元](published/unit.tap)與[常態補查](published/observation.json)保留。

公開驗收29151e4相對部署3dc623f僅QA註解與發布證據，產品零差異；實際產品碼在ad681d5後未再修改，另完整保留協作者閱讀歷史。獨立角色已自行讀取Pages／正式run及證據，確認無最終阻擋。main完整重跑40082246260於紀錄時仍執行旅程（單元／Jekyll／原文檢查已過）；[其他main CI快照](published/main-ci-snapshot.json)亦非全綠，沒有宣稱全庫CI全綠。完整整合矩陣已有40081247218成功，正式公開驗收亦成功，範圍不混稱。

外部來源僅抽查連結及新頁開啟，未重新研究全庫來源或獨立重現作者成果；真實手機、讀屏器及弱網仍未驗。Liquid原文限制、2.8MB整包與回退門檻仍列於上文；下一輪優先量測弱網，不能將請求數減少當成所有情境都更快。

原工作樹未提交兩檔SHA-256仍相同：app.js為6e70c1c846de9eea49839382b74c84819a23ac9368851d505556f164b41dba23，search.test.cjs為3313f45de597da1113165e153ff59f78a04715bc650de923395a611b50271821。未reset、未強推、未改個人桌面／憑證或另購額度。最後僅保存文件及正式圖，產品不再變更；本輪達標並停止。
