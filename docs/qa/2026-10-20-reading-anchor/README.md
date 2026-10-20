# 2026-10-20：補載完成時保住正在讀的來源段落

對象：從分享直鏈提早打開案例、用滑鼠或觸控捲動閱讀來源的人。目標是在其他來源補載完成時，避免目前可讀的來源段落突然上移。

基準 `2620077`；未找到適用 AGENTS.md。已讀 README、SITE 維護紀錄、Jekyll設定、preview 與既有 workflows。原目錄分支 `improve/search-recall-recent-workflows-and-tokenization` 的 app.js / search.test.cjs 未提交修改保留不動；多個協作者工作樹及來源資料未改。fetch後在 `/tmp/ai-case-round-20261020-accessibility` 獨立 clone，分支 `improve/reader-findability-20261020`。起始無 open PR。

本機設定檔顯示 gpt-6.1-sol / medium，無法核實或切換主對話的實際模型與推理設定；沒有假稱已使用全帳號最高設定。獨立設計／程式審查明確請求工具可用的 gpt-6-astra / ultra，亦不宣稱已核實帳號模型上限。主角色為唯一整合者，審查角色只讀。未用付費 API、購買 credits 或操作個人 GUI；瀏覽器只在 GitHub runner 執行。Orca技能CLI遇 `Unable to determine Orca.app path from symlink: /usr/local/bin/orca` 後停止使用，改用獨立clone；GitHub帳號無workflow dispatch權限，使用已授權的分支push觸發驗收。

## 證據與選擇

[正式站基準與受控補載診斷39435765904](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39435765904) 實際走完桌面1440、手機390／320首頁、搜尋旅遊＋生活＋Grok Bot、詳情、來源HTTP、直鏈重整、關閉返回、空結果復原。[基準流程](baseline-journeys.json)。桌面來源HTTP受GitHub429限制，其餘兩視圖200；這是可用性觀測，不是案例事實核驗。隨機首頁卡片不是排名，也沒有用模擬結果宣稱真人喜歡。

既有 round-browser 的 wheel reading stays anchored 在[第一次基準39435587978](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39435587978)及診斷基準重現：Chromium四視圖約0.19–0.44px，Firefox390為84.4px，超出原有2px標準。新診斷[baseline-reading.json](baseline-reading.json)確認Firefox scrollTop前後均710；來源標題523.4→439。第一候選卻是用途長段落top=-189、bottom=267，位在被移除提示的上游；來源標籤起點495.6已可見。問題是選錨對象錯置，沒有證據把原因定為native anchoring與手動補償重複。

- A（採用）：優先保住閱讀區內已露出起點的持續段落；若全是同一長段中段，退回原本的部分可見段落。成本低、延續現有同步補償。
- B：閱讀中延後隱藏提示與更新相關內容。可保留整體幾何，但需要管理延後更新狀態，也延後可切換內容的回饋；成本較高。

當提示上下兩側都有文字可見時，移除它無法同時保住兩側；本輪選擇保住已露出起點的段落，不宣稱能識別使用者眼睛正在讀哪一行。不改配色、框架、原文、分類、合格數、搜尋語意或重複候選，不新增第三方服務、追蹤、儲存或資料傳送。

## 實作與驗收

`selectReadingAnchor` 排除無高度、視窗外、即將隱藏的載入提示與即將整段替換的相關內容；有可見段落起點時優先選它，否則保留跨越頂端的長段落。沿用同步rect差補償、原文DOM與焦點，不加計時器或改瀏覽器原生錨定。

獨立審查抓到「新優先規則可能選到隨後被replace的related標題」風險，已排除整個related subtree並增加回歸。沒有先以審查全過宣稱可合併。

驗收標準：來源段落補載前後位移≤2px；桌面1440、手機390／320與Chromium／Firefox／WebKit；原文DOM、鍵盤focus及URL保留；長段fallback、related焦點、方法入口、載入失敗／重試、空結果、組合篩選、詳情直鏈重整、關閉返回須通過既有門檻；axe WCAG A/AA含對比、無水平溢出。

三個模擬情境：

1. 收到UC-359直鏈，其他來源尚未完成時先讀用途與來源，補載後繼續讀。
2. 手機搜尋旅遊並組合生活／工具篩選，開啟案例、返回、重整直鏈，再處理零結果。
3. 鍵盤進原文章節與方法入口，在相關內容關閉；目標來源503後重試，核對待查案例的限制。

這是操作檢查，不是訪談、喜好或轉換率驗證。

指令與基準：`node --test tests/*.test.cjs` 118/118；新選錨測試先4/4失敗（缺少函式，[red](unit-red.txt)），修正及審查回歸後123/123。`for file in assets/*.js; do node --check "$file"; done`通過；`python3 scripts/preview.py <output>/ai-agent-use-cases`成功。repo無獨立lint/typecheck/npm build，不把語法檢查冒稱lint。正式Jekyll build另由Pages驗證。

雲端指令：`node tests/reading-anchor-browser.cjs`（ANCHOR_OBSERVE=1為只記錄），`ROUND_ENGINES=all node tests/round-browser.cjs`，指定同一子路徑預覽URL執行`search-submit-browser.cjs`與`reader-browser.cjs`。受控延遲只暫停一個公開來源請求，非一般網速量測。trace最多記50影格，報告讀取時可能未滿50，不冒稱每組都有完整50frame。

## 截圖、發布與限制

| 視圖 | 修改前補載完成 | 修改後補載完成 |
| --- | --- | --- |
| Firefox手機390 | [來源標題上移84.4px](before-complete-mobile.jpg)；[補載前位置](before-loading-mobile.jpg) | [修後來源標題保持523px](after-complete-mobile.jpg) |
| Chromium桌面1440 | [桌面基準](before-complete-desktop.jpg) | [桌面修後](after-complete-desktop.jpg) |

預覽方式：`python3 scripts/preview.py /tmp/reading-preview/ai-agent-use-cases`，再以`python3 -m http.server 8100 --directory /tmp/reading-preview`服務；開啟`http://127.0.0.1:8100/ai-agent-use-cases/?case=UC-359`。正式[案例網站](https://richardhan.github.io/ai-agent-use-cases/?case=UC-359)。要重現早讀情境，需像測試一樣暫停無關來源，正常快速載入不一定看得到提示。

未驗證實體手機、原生觸控動量、手機鍵盤與真人螢幕閱讀器；axe零違規不等於完整認證。未量測Lighthouse或真實裝置效能；資產gzip差額僅壓縮尺寸，不等於實際網路傳輸。本輪不改前次歷史CI失敗記錄，最終結果會附於此處。下一輪最值得做：在能正確設定Pages建置的前提下，量測並降低全庫全文載入成本，同時保留直鏈早讀與來源缺項復原。

## 最終預覽驗收

[最終雲端39436526018](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39436526018)全套成功，產品資產`b08ff82`：123/123單元、JS syntax、靜態預覽、五組選錨、六組完整round、五組搜尋提交與既有reader回歸。Firefox來源標題523.4→523，位移0.4px；各選錨配置最大0.625px，保持原2px門檻；keyboard／method／wheel與related回歸皆成功。主整合者已實際檢視最終手機／桌面圖並與基準比較。

[選錨數據](preview-reading.json)、[完整早讀與返回流程](preview-journeys.json)、[搜尋與篩選](preview-search.json)、[單元輸出](unit-green.tap)、[reader無障礙](reader-accessibility.json)、[原文完整性](reader-corpus.json)。主要5＋12＋5＋15共37次axe掃描零違規；不是完整無障礙認證。自己的選錨測試pageErrors為空；round另明確記錄WebKit在刻意原生reload時取消舊頁請求產生48筆診斷，不聲稱所有network diagnostics為零。搜尋來源HTTP本次有429與200，原樣保留；round也實際點擊外部來源新分頁。

獨立角色已review最終產品碼及5項選錨unit（5/5），相關區塊P2已修；前版同核心1350a1c的五組視覺、六組流程也經獨立核對，最終b08ff82由整合者另檢圖及核對結果。不把前版審查冒稱已審過當時尚未完成的最終雲端run。

變更檔案：assets/app.js、tests/reading-anchor.test.cjs、tests/reading-anchor-browser.cjs、.github/workflows/reading-anchor-qa.yml、本QA目錄及SITE.md。沒有新增前端依賴；[資產尺寸差額](asset-size.json)為gzip檔案計算，不是實測網路傳輸或效能評分。
