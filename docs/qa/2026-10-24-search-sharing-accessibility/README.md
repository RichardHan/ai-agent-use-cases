# 2026-10-24 搜尋分享可讀性與無障礙狀態補強

已完成：450cc1b一般merge推送main，Pages40078989333的Jekyll build／deploy／report全部成功；正式40079856168五公開資產逐字一致、222單元通過、五配置分享＋兩個精簡旅程成功，7次axe零違規。以下保留所有階段與原始失敗，未宣稱全部背景CI全綠。

主角色是唯一整合者；獨立角色只讀審查。原工作目錄 `assets/app.js`、`tests/search.test.cjs` 的未提交修改保留，從 `origin/main` 的 `bd9dfbe` 建立隔離分支，後續一般 merge 納入研究者更新。無 AGENTS.md；依 README、SITE.md、preview.py 與既有 Pages／QA 規範執行。原先三個開放 PR #78、#79、#80 不在本輪處理。

主對話未提供可驗證的實際模型／推理設定讀取或切換介面，沒有宣稱已啟用帳號最強主模型。依使用者要求，先前獨立審查調度指定 `gpt-6-astra / max`，最終發布唯讀審查另指定工具可要求的最高檔 `gpt-6-astra / ultra`；不把調度參數當作可獨立驗證的執行 metadata。僅使用既有授權、訂閱與 GitHub Actions；沒有付費 API、購買額度或本機瀏覽器／桌面操作。

## 證據、方案與範圍

[公開站一般走查 40047643307](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40047643307)：1440／390px 首頁、搜尋「旅遊」＋生活、詳情、來源新頁、返回原卡片焦點與空結果成功。各443條目、441次Markdown HTTP200請求；首次可搜尋1627／812ms，僅是該次雲端觀測，不是普遍速度或真人成效。基準 `node --test tests/*.test.cjs`：202項通過、0失敗。

[公開站受控剪貼簿走查 40058806815](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40058806815)：1440／390px均在分享等待時沒有狀態，使用者已將焦點移到篩選開關，延遲拒絕卻把焦點移到網址欄；當時協作者已新增內容，完整446條目，與前次443不混算。這是注入Clipboard拒絕的功能重現，不宣稱所有訪客都會遭拒。

目標是要保存／分享搜尋條件、並可能在複製完成前繼續閱讀的人。

- A（採用）：立即等待回饋、清楚的成功／手動備援，以及延遲回應保留使用者焦點。成本低，沿用既有介面與網址白名單。
- B：新增獨立分享面板與多種分享管道。較多操作與維護成本，本輪沒有相應證據需要擴大。

驗收：立即顯示等待；成功隱藏手動欄位；拒絕／缺Clipboard API可取得完整網址；仍停在原控制項時聚焦全選，已移動時不搶焦點；新請求／搜尋變動使舊結果失效；保留全部搜尋條件、排序、Pages base path及結果集合；分享直鏈重整、案例閱讀、返回、來源、空結果與載入錯誤復原正常。手機320／390、桌面1440及Chromium／Firefox／WebKit檢查。

只改分享行為、14px操作字級及ARIA描述。全文打包方案因目前legacy Pages分支建置無安全的產物自動生成及同路徑更新一致性保障而暫緩；沒有更改案例、證據、搜尋語意、合格計數或部署方式。首次441請求成本仍在，無新增追蹤、cookies、登入或第三方分享服務。

另一個既有隔離工作樹 `improve/reading-round-20261024` 後續也出現相同焦點修正；與本輪 `assets/app.js` 變更逐字相同。本輪未修改或合併該工作樹，另用獨立QA目錄保留證據，停止擴充相同邏輯；額外交付分享14px字級、狀態描述關聯及完整順序還原驗收。

## 變更檔案

相對協作者已合併焦點修正後的main：`index.html`補ARIA關聯與atomic status；`assets/style.css`分享操作14px；`tests/search-sharing.test.cjs`及`tests/search-sharing-browser.cjs`驗收等待、焦點、過時回應與完整還原；`tests/source-guide-share-layout.cjs`等待終態；`.github/workflows/search-sharing-qa.yml`提供雲端與正式驗收；`SITE.md`與本QA目錄保存維護證據。`assets/app.js`的相同修正已由協作者先合併，最終整合沒有再更改該分享邏輯。

## 可重現指令

```sh
node --test tests/search-sharing.test.cjs
node --test --test-reporter=tap tests/*.test.cjs
node --check assets/app.js
python3 scripts/preview.py /tmp/share-preview/ai-agent-use-cases
# 以下於GitHub Actions的既有Playwright容器執行
python3 -m http.server 8184 --directory /tmp/share-preview
SITE_URL=http://127.0.0.1:8184/ai-agent-use-cases/ node tests/search-sharing-browser.cjs
SITE_URL=http://127.0.0.1:8184/ai-agent-use-cases/ node tests/page-context-browser.cjs
GUIDE_URL=http://127.0.0.1:8184/ai-agent-use-cases/ node tests/source-guide-share-layout.cjs
```

先新增測試，原碼重現2項功能失敗（等待空白、焦點被移走）；修後新增5項分享單元全通過。`checks/red-local.tap`保留原始失敗。既有來源說明分享測試改等待終態，避免新的「正在複製」讓舊非空等待提早通過，沒有放寬版面斷言。

repo沒有獨立lint／TypeScript設定，JS語法檢查不冒稱lint或type check；Python preview不冒稱正式Jekyll build。自動axe不是完整讀屏器驗證；情境走查是模擬，不宣稱真人滿意度、留存或轉換率提升。

## 前後截圖與結果

[最終預覽40062641866](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40062641866)成功：207/207單元、JS syntax、static preview；Chromium1440／390／320、Firefox390、WebKit390各447條目無缺項。五配置的分享與完整page-context旅程、3種loading-early／error／partial復原、6配置既有來源說明分享版面全部通過。主要20次axe掃描0違規（分享5＋旅程15）；分享按鈕全部44px／14px，無pageerror，分享直鏈還原條件及有序結果ID完全一致。主角色已目視桌面、手機與320px備援畫面。

| 畫面 | 修改前 | 修改後 |
| --- | --- | --- |
| 手機等待 | [沒有處理狀態](before/pending-chromium-390.png) | [立即等待回饋](after/pending-chromium-390.png) |
| 手機移開焦點 | [焦點被拉回網址](before/moved-focus-chromium-390.png) | [保留篩選開關焦點](after/moved-focus-chromium-390.png) |
| 桌面移開焦點 | [焦點被拉回網址](before/moved-focus-chromium-1440.png) | [保留原控制項](after/moved-focus-chromium-1440.png) |

[320px完整手動選取](after/fallback-chromium-320.png)、[成功回饋](after/success-chromium-390.png)；[分享原始數據](after/report.json)、[完整旅程](checks/journeys-report.json)、[載入復原](checks/journeys-lifecycle.json)、[207單元實際輸出](checks/unit.tap)、[原碼2失敗](checks/red.tap)、[獨立審查](checks/independent-review.txt)。

三種具體情境：①帶旅遊＋生活＋工具＋最近核對條件分享，複製成功及恢復有序結果；②剪貼簿延遲拒絕，已移到篩選開關的人保留焦點，仍等待的人得到全選網址；③分享尚未回應時改搜尋／進入詳情／連點，不讓舊結果覆寫新狀態或打斷閱讀。另有無Clipboard API、空結果與錯誤／部分復原驗證。均為模擬情境。

三產品資產相對基準合計增加255 bytes，沒有新增產品請求；這不是載入速度提升量測。API拒絕取消舊run（403 admin權限）後未再嘗試繞過；前三個預覽40062548117、40062594215、40062641866實際全成功。PR建立遭Enterprise Managed User GraphQL限制拒絕，依使用者既有授權採一般SSH merge，沒有強推。最終發布證據待Pages部署完成另補，不提前宣稱上線。

另一工作樹的同一焦點修正已由協作者合併到main `95e89cd`；本輪保留該實作、原測試與完整證據，新增差異集中在14px分享操作、ARIA狀態關聯與獨立完整還原驗收，避免重複改產品邏輯。

下一輪優先降低首次全文請求量，先確保每次公開來源變動都可產生一致且可驗證的新資料產物，再評估打包；保留直鏈早讀與失敗補讀。


最終整合補記：本輪450cc1b已一般merge推送main，保留研究至e1e19db。協作者後續151a432的篩選樣式與dbcda8d的原文選取方向鍵保護亦已同步，沒有覆蓋。整合211單元通過是導航選取測試加入前的快照，後續222項應以最新正式驗收輸出為準，不混算。最終獨立ultra唯讀審查在dbcda8d批准，另22項相關單元與syntax通過，未啟動本機瀏覽器；只對程式與既有預覽證據批准，不提前宣稱部署成功。

正式首驗40078998175的222/222單元、syntax及preview build已通過；Pages仍排隊，公開index尚為舊版，五資產比對在第一個index失敗而停止，沒有執行正式瀏覽，不能計通過。原始失敗保留於[雲端run](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40078998175)，[222單元輸出](checks/integrated-222.tap)另存。450cc1b及151a432的Pages因新提交被取消；dbcda8d的build成功但deploy被6d2a71b文件提交取代，均不計部署成功。

## 正式發布驗收與停止點

[Pages40078989333](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40078989333)在6d2a71b完成Jekyll build、deploy及report。本輪產品透過450cc1b合併，後續協作者CSS／選取保護／維護紀錄完整保留；正式五資產與驗收081f950逐字相同。

[正式驗收40079856168](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40079856168)全成功：222/222單元、syntax、preview build、五資產逐字比對；Chromium1440／390／320、Firefox390、WebKit390五配置分享均447條目無缺項、44px／14px操作與5次axe零違規。另Chromium1440／390精簡閱讀旅程各447條、來源新頁／返回焦點／空結果與2次axe零違規，來源說明分享6版面配置通過。主角色已目視正式桌面與手機。

正式是五配置分享＋兩個精簡旅程、7次axe；沒有重跑預覽五套完整歷史旅程與3種載入復原，兩者不混稱。預覽20次＋正式7次主要axe合計27次零違規，不是完整讀屏器或真人驗證。沒有宣稱其他主線QA全部成功。

[正式桌面等待回饋](published/pending-chromium-1440.png)、[正式手機等待](published/pending-chromium-390.png)、[正式手機保留焦點](published/moved-focus-chromium-390.png)、[正式320px手動網址](published/fallback-chromium-320.png)；[正式五配置原始數據](published/report.json)、[兩個精簡旅程](published/journeys.json)、[222項實際輸出](published/unit.tap)、[版面報告](published/share-layout.json)。

可直接預覽[正式網站](https://richardhan.github.io/ai-agent-use-cases/?q=旅遊&scenario=生活&tool=Grok+Bot&sort=reviewed#explore)。剪貼簿延遲／拒絕狀態以雲端測試注入，非宣稱每位訪客皆會遇到。外部來源內容可用性、實體手機縮放／讀屏器及首次全文請求成本仍未完整解決或驗證；沒有捏造成效分數。

原工作目錄仍保留相同兩項未提交修改。本輪達標，最後只補證據，不再新增產品變更；下一輪先核對既有載入優化工作的版本一致性與失敗回退，避免重複開發。
