# 2026-10-20：長結果列表回到搜尋與篩選

對象：從情境或問題開始探索、閱讀幾筆後想縮小條件的新訪客。

## 問題與選擇

[正式站基準走查39338970016](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39338970016)完成桌面1440×1000、手機390×844的首頁、旅遊＋生活、詳情、原文來源開啟與Escape返回。來源URL正確、焦點返回且無pageerror。當時357張結果全部呈現，頁高46495／133186px；搜尋與篩選離開視窗後，列表內沒有回到搜尋的明確入口。[原始JSON](report.json)。不是訪談或轉換率研究。

- A：分批顯示結果，適合大量瀏覽，也能減少DOM；但須同步處理詳情鄰居、返回位置與分享還原，成本較高。
- B（採用）：每六張卡片後及列表末尾提供原位「回到搜尋與篩選 ↑」，成本較低，保留既有完整集合與閱讀流程。

獨立設計角色建議六張，同時整除3／2／1欄，不新增sticky/fixed遮擋或首卡之前的高度；原位連結不代表已閱讀進度。零結果沿用現有恢復區。驗收涵蓋0／1／6／7／12／15筆、全庫、手機首卡距離<240px、44px目標、Enter／修飾鍵、保留條件及history state、補讀焦點、直鏈重整、返回及原有完整閱讀回歸。

不處理分批載入、搜尋排序／同義詞、來源分類、案例改寫、框架更換或新增第三方服務。沒有新增追蹤、cookie、儲存或外部請求。

## 基準、協作與模型

原工作樹`improve/search-recall-recent-workflows-and-tokenization`有`assets/app.js`及`tests/search.test.cjs`未提交內容，完整保留。repo／祖先無適用AGENTS.md；已讀README、歷史維護規則、Pages設定、近期來源說明與搜尋閱讀QA。初始最新遠端7cd3638，無開啟PR；另建隔離工作樹`/tmp/ai-task-discovery-20261020`，主角色為單一整合者。未reset、強推或修改其他工作樹。

初始100項單元、所有JS語法、Python預覽通過，沒有另設lint／TypeScript／npm build。正式部署為legacy Jekyll main/root。Orca CLI報`Unable to determine Orca.app path from symlink: /usr/local/bin/orca`，停止該CLI；只操作授權檔案／Git及既有GitHub Actions雲端headless瀏覽器，未操作個人GUI或啟動本機瀏覽器。

本機設定預設`gpt-6.1-sol`／`medium`，不能確認或切換主對話實際runtime，沒有宣稱已使用帳號最高模型。[OpenAI官方設定參考](https://learn.chatgpt.com/docs/config-file/config-reference)也不能證明本對話runtime。獨立設計與review角色派工指定工具提供的`gpt-6-astra`／`ultra`，僅表示請求；沒有另付費API或購買credits。

協作者新增360–362後正常merge遠端c63190a，無衝突。其未改本輪產品檔案。在未加本輪功能的c63190a另建只讀基準並重現原有三失敗：[基準失敗](c63190a-baseline-failures.tap)。必要整合維護：首頁同步既有稽核315（不是本輪獨立重現），網站總條目由357增360；UC314搜尋交叉引用明確核對IDs為UC067／UC314／UC362；共享來源候選46增47，唯一新增群組為[note.com來源](https://note.com/sustainamate_ai/n/n26d37039c129)，成員UC225／UC234。只列候選，不刪頁、不改原文、不新判重複。獨立角色自行以兩基準重算並核對相同結果。

## 實作與測試

產品：`assets/app.js`以resultCards保持完整順序，插入原位連結；靜態與動態入口共用enterSearch，保留中鍵／修飾鍵／已取消事件、replaceState原state、取消晚到捲動與搜尋焦點。補讀重建時保留同一序號入口，若末尾序號改變則選新末尾，無入口才回到結果數。`assets/style.css`僅增加全欄原位連結與44px目標。`index.html`僅同步315。

先寫兩項搜尋交接測試，舊版缺enterSearch而失敗：[紅燈](red-unit.tap)。雲端另固定7cd3638用同一瀏覽斷言重現沒有入口：[紅燈](red-browser.log)，不以修後才寫的分析充當重現。最終103項本機單元通過：[輸出](after-unit.tap)。新增補讀焦點邊界測試包含5→6、6→7、7→12、356→357及無結果。

首輪雲端39339388924的新流程已走完五配置與三情境，但補讀fixture用程式click重試後誤以為不移動焦點；實際既有重試handler會聚焦重試按鈕，故assert undefined≠6。已改用真click啟動、暫緩單一來源、在等待期間聚焦返回入口、再釋放請求，保留焦點與可見性斷言。這是測試錯誤，沒有稱為網站缺陷。第二輪39339484542是上述協作者基準三失敗，已保留未加功能的重現，不忽略原測試。

獨立review發現非六倍數末尾入口補讀後不存在而跳到頂端，與主整合者同時發現，82a409d已補修；獨立VM固定commit重驗5→6、6→7、7→12、356→357、359→360、360→361均正確。另依review保留原序號仍存在時不強制改新末尾，red輸出分目錄避免覆寫兩尺寸基準JSON。

## 指令與預覽

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/results-return-preview/ai-agent-use-cases
python3 -m http.server 8130 --directory /tmp/results-return-preview
# http://127.0.0.1:8130/ai-agent-use-cases/#explore
# 雲端runner安裝Playwright與axe後：
NODE_PATH="$RUNNER_TEMP/return-tools/node_modules" node tests/results-return-browser.cjs
```

完整瀏覽環境與原始回歸指令見[workflow](../../../.github/workflows/results-return-qa.yml)：新功能三引擎五配置、原source-guide、discovery及reader；後兩者包含原mobile-search門檻。Python預覽模擬Liquid目錄，不代替正式Jekyll建置。

三個模擬情境：隨意探索六張後回搜尋旅遊＋生活，讀第七張並原生Back；長搜尋無結果再修改；分享UC001＋旅遊生活直鏈、重整、關閉、末尾返回。另驗部分503、等待補讀時移動焦點、錯誤與重試。模擬不代表真人喜好、留存或成效。

## 驗收結果與前後畫面

雲端、完整截圖、獨立最終審查及發布結果確認後追加。最初正式站首頁／搜尋／詳情截圖在本目錄；同基準同第六張位置的前後圖以雲端實際產物為準。

## 限制與下一輪

未驗實體手機、螢幕閱讀器或真人偏好；axe不代表完整無障礙認證。全結果仍一次呈現，列表未縮短；沒有聲稱載入或轉換率提升，沒有Lighthouse分數。來源頁受第三方限制。下一輪最值得做：在可正確調整Pages建置時量測並減少全文請求，保留原文一致性、早讀與部分失敗復原。

## 最終雲端預覽驗收

[固定9537d8a的run39339736747](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39339736747)成功：[CI快照](preview-ci.json)。103／103單元、所有JS語法、Python預覽成功；固定原基準missing-route紅燈符合預期。其後新功能、原source-guide、原discovery（含mobile-search）、原reader四個完整browser命令全部執行成功，沒有修改原有browser斷言。

[新功能原始結果](preview/report.json)：Chromium1440／390／320、Firefox390、WebKit390共五配置；全360筆順序及60入口、0／1／6／7／12／15邊界、每配置三情境、Enter／修飾鍵、原生Back與直鏈重整通過，五次axe零違規。手機首結果距搜尋皆233px（原標準<240未放寬），無橫溢出；部分失敗等待補讀期間的first／last入口焦點及可見性、錯誤重試通過。

原來源[報告](source-guide-report.json)五配置完成且十次axe零違規；原Reader[全庫檢查](reader-corpus.json)360筆、2506段標題、379證據列，[十五次axe](reader-accessibility.json)零違規。原手機搜尋：[Chromium三尺寸](mobile-search.json)、[Firefox390](firefox-mobile-search.json)、[WebKit390](webkit-mobile-search.json)通過，保留233px預算及各兩次axe零違規。

| 同第六張附近的真實畫面 | 修改前（357筆基準） | 修改後（360筆整合） |
| --- | --- | --- |
| 桌面1440 | [前](before/deep-chromium-1440.png) | [後](published/deep-chromium-1440.png) |
| 手機390 | [前](before/deep-chromium-390.png) | [後](published/deep-chromium-390.png) |
| 手機320 | 未拍基準 | [後](fix-preview/deep-chromium-320.png) |

另有[Firefox](fix-preview/deep-firefox-390.png)、[WebKit](fix-preview/deep-webkit-390.png)及[手機搜尋入口](fix-preview/search-chromium-390.png)。兩版本前六張內容相同，總數差異來自協作者新增三筆，未拿不同總數的頁高來宣稱改善。主角色已逐張查看前後、桌面與兩手機尺寸；獨立角色最終審查另補。

預覽單次未節流量測：全庫就緒750–1050ms、同步input/render 21.9–33ms；這是GitHub runner本地HTTP，不代表正式網路或速度提升。新產品JS增加827、CSS456，合計1283未壓縮bytes；字色#285344對紙底#f7f8f2相對亮度對比8.156:1，見[計算與大小](asset-sizes.json)。這些不是Lighthouse分數或完整無障礙認證。

操作範圍補記：沒有開工前原工作檔hash，故不宣稱以雜湊證明逐byte相同；本輪所有檔案寫入均在隔離工作樹，原目錄未經本輪write/reset/stash/checkout。獨立角色末次僅確認原目錄仍有相同兩個未提交檔案，不將dirty狀態當成逐byte證明。

## 獨立最終審查

未負責主要實作的角色固定9537d8a自行查GH head/status、另外下載artifact，並以job logs API核讀完整原始log（`gh run view --log`只讀到前段，沒有把缺後段誤判成未執行）。確認Discovery三尺寸及fallback PASS；Reader五配置、CORPUS、缺reader／單來源／缺copy全部PASS；新五配置360卡／60入口／三情境／axe0、source十次及reader十五次axe0、原手機233px與360／2506／379完整性符合。部分補讀first＋last真retry gate與焦點／可見斷言確實在固定程式中執行。

其逐張看最終1440／390／320、Firefox／WebKit深讀入口與首卡、UC313手機長文及UC005小手機閱讀；程式、相容性、資料傳送與設計無剩餘必修，結論可合併。分支的published job是skipped，不宣稱已發布；Pages與HTTPS另驗。審查角色全程沒有產品或repo寫入，派工設定仍僅為gpt-6-astra／ultra請求。

## 合併後抓到的可見性退化與診斷

首次正常merge f4dd607；整合後103項單元通過，tree與已審分支一致。首次[Pages39340889464](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39340889464)成功，HTML／JS／CSS皆HTTP200並逐字相符：[資產紀錄](published-assets.json)。這不代表本輪已通過正式驗收。

[main Results return QA39340890322](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39340890322)在preview部分補讀的嚴格可見性斷言失敗，正確入口仍有焦點，但rect未完全在0..844；published job因此skipped，後三個browser命令未到達。保留[原始FAIL](main-recovery-visibility-failure.log)，沒有只重跑取綠燈。

先不改產品，另建隔離修正分支以[診斷39341208660](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39341208660)跑一般／減少動態兩種設定×4次×first／last共16組。記錄focus前、補讀後、下一幀與後續50／100／300ms連續等待後的位置，最後才拍圖，不讓中途截圖干擾成功路徑。label為連續等待，實際elapsed以performance.now差計算，不稱為絕對50／100／300ms。

[原始16組trace](recovery-before/report.json)顯示：一般動態8組有4組補讀後bottom持續為844.0625／844.203125／844.40625，後續到從釋放前取樣起約570–586ms仍相同；焦點皆正確6或360。減少動態8組皆可見。原生focus當下仍在smooth捲動，但補讀後超界沒有自然消失，不能只加等待或套±1px容差。

修正708d0de在返回連結加scroll-margin-block:12px，讓既有nearest捲動留足完整目標與3px＋4px焦點外框；不改JS、HTML、首卡或網格布局高度。獨立審查核讀原始trace與末端圖片後同意修正。原0..844門檻維持；新診斷驗收將逐一核對全部補讀後trace焦點與可見性。

補查歷史CI：[舊Reader controls FAIL](historical-reader-controls-failure.log)在711921f正式站Firefox等待detail逾時，原run仍為FAIL，不能猜根因或說當時已修。協作者c3665a2的[Reading flow基準FAIL](historical-research-baseline-failure.log)是100項單元96pass／4fail，browser全部skipped；三項為本輪已處理的315／47群／UC314交叉引用，第四項INDEX句式由協作者c63190a改回「主要頁354」已修。本輪承接保留，現在103單元已涵蓋四項。本輪原Reader controls／Reading flow仍另以正式重跑結果驗收。

補修[16組嚴格驗收39341462977](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39341462977)成功，固定708d0de。兩種動態偏好×4次×first／last，全部80個補讀後sample焦點正確且完全在0..844；最小top445.203125、最大bottom830.375、最小底留白13.625px，全部容納7px外框。[trace](recovery-after/report.json)／[CI](recovery-after-ci.json)／[末尾修後圖](recovery-after/no-preference-0-last.png)。獨立角色自行重算及看圖得相同結果；取樣結束才拍圖。這是真正留白修正，沒有只加等待、容差或改小目標。

首次main的[全部20套CI快照](first-main-ci.json)最終為18成功、2失敗。原Reader controls、Reading flow、Reader、Source guide（preview及published）均已成功；不把此結果說成已確證或修復舊Firefox逾時根因。兩項FAIL為本輪補讀可見性與Improvement round：後者正式Chromium desktop全部完成，mobile早讀UC359的兩項axe也通過，接著另一closePage等待UC005直鏈開啟逾時；沒有當頁來源／載入狀態，根因未知。[原FAIL](main-shared-case-timeout.log)／[當次報告](main-shared-case-timeout.json)。不能把留白修正說成其修復。

為下一次原流程重跑增加唯讀診斷：測試在導航前記錄HTTP>=400與requestfailed及所屬page URL，失敗catch記當頁URL、initialLoading、目標是否已載入、currentDetailItem、失敗來源與提示，再拍圖並重新throw原錯。原斷言、timeout、重試次數未變；沒有加產品請求或資料傳送。即使下次通過也保留此次未定根因風險。

## 補修完整預覽與再次獨立核對

[固定708d0de完整39341462975](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39341462975)成功：[CI](fix-preview-ci.json)／[新流程JSON](fix-preview/report.json)。103／103、所有JS語法及預覽成功；新五配置三情境＋first／last補讀／錯誤重試成功，原source-guide／discovery／reader四個完整命令確實全部到達。source十次、reader十五次axe均零違規；[360筆／2506節／379證據列](fix-preview/reader-corpus.json)，手機首卡距離仍233px。前後表的修後連結已更新成此版；新增留白只影響捲動目標，不增加列表布局高度。

獨立角色另下載固定708d0de產物、核讀3.43MB完整job logs，確認Discovery三尺寸及fallback、Reader五配置／全庫／缺檔fallback全部PASS；逐張看1440／390／320、Firefox／WebKit最終圖，認定可合併、無剩餘必修。後續7a2e7d1只有失敗診斷補強，產品與708d0de完全相同。分支published仍skipped，正式站結果另記。

最終前端大小以[final-asset-sizes.json](final-asset-sizes.json)為準，包含12px留白；不是壓縮傳輸量或效能分數。案例內容原樣保留，315／360分開呈現。

## 最終發布與HTTPS驗收

已正常merge／push補修為`8bfe711`，整合tree與已審分支完全相同，103項單元再次通過。[Pages39342371073](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39342371073)建置部署成功；[正式資產](final-published-assets.json)的HTML／app.js／style.css皆HTTP200且逐byte相同，新CSS SHA256為`4b401e8a7fc4a15099f7eb1b31a164da719f0915a28710456143b3ecadd7e88b`，包含12px補修。

[Results return QA39342372057](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39342372057)的preview與published兩個job全成功：[CI](final-ci.json)。合併版再次完成103單元、新五配置及全部四browser命令；發布job先匹配資產，再實際開HTTPS網站1440／390，兩尺寸均360卡／60入口、0／1／6／7／12／15邊界、三情境、鍵盤／修飾鍵、組合篩選／空結果、直鏈重整／Back、first＋last補讀／錯誤重試通過；兩次axe零違規，手機首卡仍233px。[正式原始JSON](published/report.json)／[正式桌面圖](published/deep-chromium-1440.png)／[正式手機圖](published/deep-chromium-390.png)。前後表的1440／390修後連結已換成正式站圖；主角色已目視兩圖。

正式站單次未節流就緒669／612ms、同步input/render18.4／17.6ms；包含當時快取與runner條件，不能用來推論一般讀者網路或相對預覽提速。沒有Lighthouse、真人偏好、轉換或留存宣稱。

### 仍保留的真實限制

[合併版CI快照](final-main-ci.json)不是全部綠燈。既有Improvement round[39342371952](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39342371952)preview六配置與正式desktop已完成，但正式mobile的UC001重新整理收到Pages主文件HTTP429，app完全沒載入，ready／entries／target均null；診斷另記112個真429及一個既有故障注入503。這次可以確認被限流，[原始FAIL](final-round-rate-limit.log)／[診斷JSON](rate-limit/verification.json)／[Pages限流畫面](rate-limit/failure-chromium-0.png)。畫面中的IP屬GitHub runner，非使用者電腦。

既有Reader controls[39342372054](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39342372054)也在正式Chromium360重新整理時被同樣Pages限流頁阻擋，非44px尺寸斷言或Firefox；[原FAIL](final-reader-controls-rate-limit.log)／[當頁狀態](rate-limit/live-failure-chromium-360.json)／[限流圖](rate-limit/live-failure-chromium-360.png)。兩個FAIL原樣保留，不放寬標準、不高頻重跑、不繞過限制；不能倒推前次無診斷的逾時一定同因。

本輪產品功能的完整預覽、嚴格80取樣與獨立正式HTTPS已通過；沒有宣稱上述兩套歷史大流程全數成功。快照中的其他背景job仍依實際status列示，不冒稱已完成。沒有實體手機、真人或螢幕閱讀器研究，主runtime型號／強度仍未核實。

可直接[體驗正式搜尋](https://richardhan.github.io/ai-agent-use-cases/#explore)，向下看六張卡，選「回到搜尋與篩選 ↑」再縮小條件。修改產品檔為`assets/app.js`／`assets/style.css`／`index.html`；另有測試、QA workflows及本維護紀錄，協作者原始案例未重寫或刪除。下一輪最值得做的是降低首次全文請求與正式QA的請求量，減少限流風險；本輪不再擴大架構。

最終獨立發布審查：另行查固定8bfe711的preview／published兩job、讀published原始log中的資產guard及真HTTPS RETURN_URL、另外下載正式artifact核對報告與圖片；確認桌機／手機三情境、first／last補讀、錯誤重試、兩次axe0與233px。另讀main preview完整log確認103項及原四命令、Reader五配置與360／2506／379全部成功。結論本輪目標可結案、無產品必修；兩項429 FAIL及仍執行的Source guide workflow不改寫為通過。

本輪達標後停止。後續提交只保存本次發布證據、圖片與紀錄，不改產品資產；原工作樹未經本輪寫入。
