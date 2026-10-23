# 原文的重要限制與核准邊界保留強調

## 問題、選擇與範圍

[原正式站雲端39898201904](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39898201904)實走1440／390首頁、旅遊＋生活＋Grok Bot、詳情、返回、UC-313直鏈重整、來源新頁與空結果恢復。兩尺寸439條目皆無缺項或pageerror。主角色目視桌面／手機原文：UC-313「未證實實際重複寄送，也未重新核對外部服務狀態」保留`**`而無strong，讀者易漏看證據限制；不是文字遺失。見[原始DOM與流程](checks/initial-baseline-browser.json)、[桌面](before/limitation-chromium-1440.png)、[手機](before/limitation-chromium-390.png)。基準來源掃描80檔、251組成對標記，不把語法數當案例數。

目標訪客是先看做法，再核對作者結果、限制與核准範圍的人。

- A（採用）：安全呈現既有原文強調，保留字詞與歸因，成本低，也適用既有DOM複製的閱讀區。
- B：新增限制摘要視圖，適合快速掃讀，但增加摘要維護、資訊重複及歸因風險，成本較高。

驗收：原強調句以strong呈現、不改原字詞；code／fence／URL目的地不誤解析；不完整或不支援語法保持文字；來源HTML不可執行；原文、標題、巢狀列表、引用及表格共用安全處理；手機無頁面橫溢；搜尋精確限制句、直鏈重整、返回焦點、組合篩選及空結果保持。三種模擬走查不是使用者訪談，不推論轉換或留存。

本輪不處理新案例、去重、證據重分類、合格數、搜尋同義詞、首次全文載入成本、完整CommonMark規格或品牌框架。沒有產品依賴、追蹤器、cookies、登入或第三方傳送；仍為GitHub Pages legacy/main根目錄，保留相對base path。

## 實作與驗證

`assets/app.js`約40行新增／調整：既有安全inline parser識別有界成對`**`，使用文字DOM及strong，沿用safeLink；不用innerHTML。先識別原code與連結，URL目的地不進強調解析。不改原Markdown、提示詞複製來源、reader或搜尋規則；不宣稱完整Markdown支援。

```sh
node --test --test-reporter=tap tests/*.test.cjs
node --test --test-reporter=tap tests/emphasis.test.cjs
for f in assets/*.js tests/emphasis*.cjs; do node --check "$f"; done
git diff 9ebbcb2 --check
python3 scripts/preview.py /tmp/source-preview/ai-agent-use-cases
python3 -m http.server 8174 --directory /tmp/source-preview
SITE_URL=http://127.0.0.1:8174/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/emphasis-browser.cjs
```

起始182／182全過。[基準](checks/baseline-unit.log)。新5項測試先red2過／3失敗，第一次其中表格fixture缺setAttribute；補正harness後再對原版重現3項ERR_ASSERTION（不是把工具錯誤算成產品錯誤），獨立review再發現外層強調內code／URL含星號的誤截斷；新增scanner略過code／完整destination／裸URL，複合星號回退文字。審查再補不完整網址與多反引號邊界，改為完整token匹配且scanner與inline code語法一致，避免null crash與字詞變更。[第二輪red](checks/review2-red.tap)。最終7項對原版red2過／5個ERR_ASSERTION、修正後7／7、全套189／189。[初次harness紀錄](checks/initial-red-harness.tap)／[有效red](checks/red.tap)／[green](checks/green.tap)／[全套](checks/unit.tap)。Repo無獨立lint／TypeScript／npm build，語法檢查不冒稱lint或type check；preview.py不冒稱正式Jekyll。正式Jekyll由Pages驗證。

變更檔案：`assets/app.js`、`tests/emphasis.test.cjs`、`tests/emphasis-browser.cjs`、`.github/workflows/emphasis-qa.yml`、`SITE.md`與本QA紀錄及證據。

## 環境與獨立審查

無適用AGENTS.md；已讀README、歷史維護規則、SITE近期改善、page-context／table-reading QA、catalog、preview與部署規範。基準9ebbcb2；原工作樹分支improve/search-recall-recent-workflows-and-tokenization的assets/app.js與tests/search.test.cjs完整保留，未reset／強推；現有PR78／79／80不擅自混入。隔離工作樹`/tmp/ai-source-20261023`，主角色唯一實作整合者、獨立角色唯讀review。

依OpenAI Docs skill及[官方設定參考](https://developers.openai.com/codex/config-reference/)查核，本機預設gpt-6.1-sol／medium，主對話實際runtime不可讀／不可切換，不能宣稱已使用最高設定。獨立角色明確指定可用gpt-6-astra／ultra，也不作runtime證明。未修改全域模型設定，未使用另付費API或購買credits。本機僅repo與shell；browser、字型及axe均在授權GitHub Actions雲端，不操作個人GUI或本機browser。

首輪預覽39898479203因axe需要明確browser.newContext而FAIL，修正測試工具後重跑；不是產品通過。[原始錯誤](checks/first-browser-failure.json)。獨立review指出的組合語法問題已先補測重現並修正，[review-red](checks/review-red.tap)。

[預覽39898918956](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39898918956)全部成功：Chromium1440／390／320、Firefox390、WebKit390，439條目完整、pageerror空。專項5次axe零違規；既有page-context回歸另15次axe零違規，載入早讀／全目錄錯誤重試／部分失敗重試全部恢復439條完整。見[專項](after/report.json)、[回歸](checks/regression-browser.json)、[復原](checks/regression-lifecycle.json)、[回歸log](checks/regression.log)。這是20次主要掃描，非完整WCAG認證。外部GitHub來源實開popup，不代表獨立核實issue內容。

三種自動化模擬走查：
1. 首訪搜尋旅遊＋生活＋Grok Bot，15筆結果，開UC-001，再Escape回原卡焦點與條件。
2. 分享UC-313直鏈、閱讀完整證據限制、開原始issue並重整；另UC-089確認核准邊界強調。
3. 搜尋「未證實實際重複寄送」，定位含strong的原段落，返回保留搜尋，空結果可回輸入框。

主角色已目視桌面／手機與390搜尋定位；Firefox強調明顯，Chromium Regular-only雲端字型偏細，新增Bold字型及computed fontWeight斷言再核對，不用CSS假造字重。產品不加字型請求。[桌面前](before/limitation-chromium-1440.png)／[桌面後](after/limitation-chromium-1440.png)、[手機前](before/limitation-chromium-390.png)／[手機後](after/limitation-chromium-390.png)。

[獨立複審](checks/independent-review.md)通過：45相關單元、436來源檔文字／網址／code保真、972合成邊界；前兩輪問題都已修正。原先Regular-only及另加Noto Bold的Chromium圖仍無明顯字重；未憑DOM或computed700判通過。CDP確認真正使用WenQuanYi Zen Hei（文泉驛正黑），不是Noto；見[實際字型](checks/font-diagnostic.json)及[不足的手機圖](checks/font-insufficient-390.png)。僅在雲端容器移除該備援字型再用完整Noto字重驗證，不改產品CSS或使用者字型設定。字重仍取決於使用者系統字型，不保證每個平台粗細相同。

[最終視覺QA39900015754](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39900015754)成功：同一完整Noto環境重拍正式站before與預覽after，主角色目視桌面／手機限制句清楚強調、原文完整且無溢出。五配置strong700／parent400；Chromium CDP實際familyName為Noto Sans TC（variable font的PostScript名保留Thin，不從該名稱推論實際字重），5次主要axe0、439條完整與三情境皆通過。這輪只補字型與樣式證據，完整page-context／載入復原沿用產品相同的39899337505／39898918956成功結果，沒有冒稱重跑。產品三資產逐byte相同，字型變更僅雲端容器。

獨立角色已目視同字型環境的四張前後圖，結論「可以合併」：強調清楚且適度、完整限制句保留、手機換行自然、無新溢出或重疊，產品不需追加CSS。最終before正式站已因協作者8bfe3eb新增研究到440條，after隔離基準仍439；計數差是資料版本差異，不是parser刪除案例。UC-313比較文字相同。整合時保留UC-160補證及UC-442新案例，正式站另驗證。

整合8bfe3eb無衝突，189項單元、資產語法與preview build通過。[整合輸出](checks/integrated-unit.tap)。保存的log僅清除行尾空白，不更動失敗或斷言。

已一般merge並push main為c1d6297，保留協作者8bfe3eb。Pages39900313437正式Jekyll build／deploy／report成功。主角色另HTTP核對三產品資產200且逐byte一致：[hash](checks/published-http-assets.json)。原工作樹兩檔合併前後SHA256相同：[保留證據](checks/original-worktree-preserved.json)。

正式首驗39900331115在Pages尚排隊時asset mismatch正確擋住；[失敗原文](checks/first-published-asset-failure.log)。API rerun回403需admin，未改權限，沿用授權SSH驗收分支，新增只等資產的QA步驟。第二次39901075794於Pages完成後先驗三資產一致，1440／390各440條完整及流程通過，但320首次讀取僅348條、90缺來源而FAIL：[完整報告](checks/first-published-browser-failure.json)。原測試未記HTTP狀態，原因未確，不冒稱修好限流或載入根因。新測試記錄每個HTTP錯誤，保留initialCorpus，只有在真實partial顯示時才操作retry-failed（最多兩次、各等5秒），最後仍必須所有來源完整才繼續。公開站配置間等5秒降低驗收流量；產品程式完全不變。

既有主線廣域CI非全綠：Website QA用Playwright1.56.1不支援Ubuntu26.04，在安裝browser前失敗；Facet counts固定假設「旅遊＋開發必空」，獨立證實原始基準就命中UC-067的Gdrive-Time-Travel，搜尋與結果前後相同。[網站工具失敗](checks/legacy-website-failure.log)／[Facet失敗](checks/legacy-facet-failure.log)／[獨立歸因](checks/independent-review.md)。其他部分QA在Pages排隊時等公開資產逾時，沒有宣稱全部CI通過。

[正式站QA39901290115](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39901290115)全部成功：Chromium1440／390／320、Firefox390、WebKit390；各配置首頁首次440條完整、failedPaths空、無重試、全流程network與pageerror空；5次主要axe WCAG A/AA掃描零違規。三情境、UC-313原句strong、UC-089核准界線、搜尋原段落焦點、組合篩選／返回／直鏈重整／空結果成功。[完整正式報告](published/report.json)／[正式189項單元全過](checks/published-unit.tap)。這份完整性快照涵蓋每配置首頁，後續各次goto/reload只證明指定案例流程成功，不宣稱逐次全文完整；HTTP診斷涵蓋整段流程。沒有用最終成功反推前次90缺項的根因，也不宣稱修復首次載入問題。

| 尺寸 | 修改前（正式站舊程式、相同完整字型） | 修改後（正式站） |
| --- | --- | --- |
| 桌面1440 | [星號與普通字重](before/limitation-chromium-1440.png) | [證據限制強調](published/limitation-chromium-1440.png) |
| 手機390 | [限制層級不明](before/limitation-chromium-390.png) | [完整強調與自然換行](published/limitation-chromium-390.png) |

主角色已目視上述正式桌面／手機，字詞完整、字重清楚、無新溢出。正式版與完整回歸預覽的產品資產相同；不把重跑的axe加總成更多使用者或認證。[主線CI快照](checks/main-ci-snapshot.json)保留其他舊工作失敗與未完成狀態，不宣稱主線全綠。

預覽／直接驗收：[正式UC-313](https://richardhan.github.io/ai-agent-use-cases/?case=UC-313)，展開完整來源可讀限制；[搜尋限制句並直開](https://richardhan.github.io/ai-agent-use-cases/?q=未證實實際重複寄送&case=UC-313)。本機preview指令見前文，保留`/ai-agent-use-cases/`base path。

最後僅補維護證據與已通過正式QA的測試診斷，不變更產品。採`[skip ci]`避免再觸發全批舊QA與Pages佇列；正式產品c1d6297的Jekyll／部署／三資產HTTP與正式browser均已驗收。已達本輪標準，停止擴充。

限制：未做真人偏好／留存研究、實機或完整輔具認證；axe不是完整WCAG認證。未量測Lighthouse，不捏造效能分數。app.js gzip估算增加384 bytes，無新產品請求，僅為資產大小而非真實載入效能提升；[實際大小](checks/asset-size.json)。下一輪優先降低首次全文請求成本，保留單篇早讀與部分失敗復原。
