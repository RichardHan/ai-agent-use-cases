# 2026-11-11 首頁「換個情境」把訪客的關鍵字無聲清掉，而說明放在看不到的地方

## 基準

- 開發基準 `origin/main` `c9bc5b72`（開工時），工作樹乾淨；本輪在自己的 worktree `/private/tmp/aiuc-1111-r20`（detached `c9bc5b72`）作業。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 340 個 commit，另有 159 個未追蹤檔案（皆已存在於 origin/main，非本輪內容）；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`：**714 通過、0 失敗**。`node --check assets/app.js` 通過。
- 正式站開工時 `catalog.json.sourceRevision` = `c9bc5b72…`（512 個來源檔、畫面 515 筆），與 main head 相同，代表上一輪已發布完成。
- Actions 現況重新確認（未沿用歷史敘述）：`gh run list` 自 2026-11-08 起共 300 次 run，只有 2 次 failure——`Website QA` [42820349847](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42820349847)（`2b139d9f`，已在 #355 修掉的一小時發布假紅）與 `Corpus bundle QA` [42814279823](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42814279823)（分支上的 `reading-history-browser.cjs` 跨引擎不穩定，已在 #340 修掉）；`pages build and deployment` 同期 0 次 failure。**因此本輪不是重複修同一個 CI 問題，主題留在訪客流程。**

## 問題證據

目標使用者是**已經打過一句話、又回到首頁抽卡區換情境的訪客**。

正式站（`c9bc5b72`）實測，1440×900 與 390×844 結果相同：

1. `?q=怎麼整理會議記錄` → 查詢框有字、`顯示 7 / 515 筆收錄`、`關鍵字：怎麼整理會議記錄×`。
2. 點「換個情境，再找一點靈感」的 **工作省點力**。
3. 查詢框空白、`顯示 162 / 515 筆收錄`、網址變成 `?scenario=工作`、`#scenario-reset` 仍是 hidden、畫面上沒有任何一行提到剛才清掉了什麼；焦點與捲動停在抽卡區（`scrollY=128`），而結果列在 y=1957。

成因（讀碼確認）：`assets/app.js:4708` 的七顆首頁情境按鈕直接呼叫 `chooseScenario()`，而 `chooseScenario()`（`:4597`）第一行就把 `query` 與五個篩選清空；上一輪為詳情頁「探索更多情境案例」補的 `showScenarioReset()` 只接在 `scenarioExploreAction()` 上，首頁這條路沒有接。`SITE.md` 的上一輪紀錄與 `README` 都已把這件事列為已知未修。

第三個量測點決定了修法：首頁這條路的落點是**抽卡區**，不是結果列。390px 下點完按鈕的視窗是 1153–1997，卡片 1295–1941，結果列 3153——**既有的通知面板在結果列上方，對這個落點等於不存在**。所以「把通知打開」不足以修好，通知必須跟著讀者所在的位置出現。

## 兩個方案

- **A（採用）沿用同一個通知面板，讓它跟著觸發點移動。**
  - 做法：抽出 `scenarioResetCopy()`（句子與按鈕文字，含 `隨便逛逛` 的「全部情境」措辭、部分載入時不報筆數）、`scenarioResetAnchor()`（哪個 stage、插在哪個節點）與 `placeScenarioReset()`（把**同一個** `#scenario-reset` 移到該位置）；首頁七顆按鈕改成「快照 → 切換 → 顯示通知 → 把通知頂端捲進視窗 → 焦點放到『回到原本的搜尋』」。詳情頁那條路仍把面板放回結果列上方。
  - 價值：抽卡區與結果列各自看到同一句話、同一顆回頭按鈕，不會有兩個 live region 同時說話；訪客不必離開剛按下的情境按鈕就能讀到說明，卡片仍在正下方。
  - 成本：`app.js` +55 行（三個小函式與一處改寫）、1 支單元測試（6 項）、1 支三尺寸瀏覽器回歸、`website-qa.yml` 1 行、`README` 1 句。
  - 取捨：通知在首頁時位於卡片**上方**（不是下方），因為 390px 的卡片高 646px、320px 高 531px，放在下方會整塊被推到視窗外；代價是卡片往下移一個面板的高度（桌面 +80px、手機 +124px、320px +146px），實測三種寬度都沒有把卡片標題推出視窗，水平溢出 0。
- **B 不採用：保留關鍵字再加情境（交集）。**
  - 看起來最省事，但 `?q=怎麼整理會議記錄&scenario=工作` 是 0 筆（同一份語料實測），首頁按鈕會把訪客帶到「你剛剛那句話在這個情境裡什麼都沒有」的死路，而畫面仍停在抽卡區、看不到空結果與復原選項。上一輪也已用同一個理由否決過詳情頁的交集版本；入口字面是「換個情境，再找一點靈感」，不是「在原本的結果裡篩」。另外 `#scenario-chips`（探索頁「依情境探索」）本來就是交集語意，兩者若都改成保留，會讓「首頁情境」與「探索頁情境」看起來一樣卻一個會清、一個不會，反而更難預期。
- **C 不採用：只把通知打開、落點不變。** 面板在結果列上方（桌面 y≈1957、手機 y≈3153），對停在抽卡區的訪客不可見，等於換一個地方繼續無聲。

## 改動

- `assets/app.js`
  - 新增 `scenarioResetCopy(reset,scenario,dropped,{partial})`：切換到具名情境／全部情境／同一個情境三種句子；`partial` 時按鈕不寫筆數（部分來源未載入時不能宣稱原本有幾筆）。
  - 新增 `scenarioResetDropped(reset,scenario,placement)`：首頁路徑不把「被換掉的那個情境」算成損失（按鈕本身就是情境選擇器；否則連續按兩顆情境會每按一次就朗讀一次並搶走焦點），詳情頁 handoff 仍會點名被換掉的情境。其餘條件照舊逐項列出。
  - 首頁按鈕的處理順序改成「先看這次真的清掉了什麼」：清掉東西 → 用這次的快照顯示；只清掉情境（或什麼都沒清）但**上一個通知還在畫面上** → 沿用上一個快照重新描述，保留那顆「回到原本的搜尋」（條件仍然是移除狀態，回頭路仍然只有這一個）；兩者都沒有 → 完全不動，卡片照舊接手焦點。
  - 新增 `scenarioResetAnchor(placement)`：`discover` → `{host:'discover',anchor:'drawn-case'}`（面板在卡片正上方）；其他 → `{host:'explore',anchor:'partial-load'}`（與改動前同一個位置）。
  - 新增 `placeScenarioReset(placement)`、`alignScenarioReset(notice)`：搬移同一個節點，並只把通知頂端捲進視窗（`scrollY = notice.top - 12`），不搶走卡片。
  - `showScenarioReset()` 改為接受 `placement`，改用 `scenarioResetCopy()`；`scenarioExploreAction()` 不傳 placement，行為與位置不變。
  - 首頁 `#guide-options [data-scenario]` 七顆按鈕：快照 → `chooseScenario()` → 顯示通知 → 對齊 → 焦點移到 `#scenario-reset-action`；沒有清掉任何條件時完全不動（卡片照舊接手焦點）。
- `tests/scenario-clear-notice.test.cjs`（新，7 項）：句子（切換／全部情境／同一個情境）、`partial` 不報筆數、兩個落點的錨點、首頁不點名被換掉的情境／詳情頁會點名、`FILTER_LABELS` 用詞。
- `tests/scenario-clear-notice-browser.cjs`（新）：1440／390／320 各走八段——鍵盤 Enter 切換後通知在視窗內且點名兩個條件、一張卡仍在畫面上、焦點落在回頭按鈕；一鍵回頭後查詢與門檻都回來、筆數與網址一致、焦點落在結果筆數；乾淨首頁切換不顯示通知且卡片照舊接手；`隨便逛逛` 不出現「」；詳情頁 handoff 仍把通知留在結果列上方且在視窗內；工具與情境一起被清掉時逐項點名、且不把被換掉的情境當成損失；切換後再改動排序，一鍵回頭會把排序重設回快照值（這一段才真正測到 `$('sort').value=reset.sort`）；同一個情境連按兩次不會丟掉待還原的查詢；沒有任何通知與可清條件時切換保持安靜、焦點回到卡片。axe 掃描在每個寬度的兩個狀態各跑一次（首頁通知、詳情通知），皆 0 違規。
- `.github/workflows/website-qa.yml`：PR 閘門加上新回歸（`VERIFY_URL=… node tests/scenario-clear-notice-browser.cjs`）。
- `README.md`：首頁情境會清除篩選那句補上「先寫出清除了哪些條件、原本有幾筆，附一鍵回頭；沒清掉東西時不多說一句」。
- `index.html`：`#scenario-reset-action` 加上 `aria-describedby="scenario-reset-message"`，讓焦點落在回頭按鈕時讀屏會唸出「清掉了什麼」。

`assets/style.css`、語料與 `catalog.json` 都沒有改動：面板沿用既有 `.search-split`，沒有新 CSS。

## 先紅後綠

- `node --test tests/scenario-clear-notice.test.cjs`（`c9bc5b72` 的 `assets/app.js`）：`ReferenceError: scenarioResetCopy is not defined` → 改動後 6 項通過。
- `VERIFY_URL=<基準預覽> node tests/scenario-clear-notice-browser.cjs`：`desktop: the switch says what it cleared — true !== false`（通知確實是 hidden）→ 改動後三種寬度全部通過，輸出 `SCENARIO_CLEAR_NOTICE_OK`。

## 量測（同頁、同尺寸、同資料；`?q=怎麼整理會議記錄&difficulty=入門對話`）

| 視口 | 改動前 | 改動後 |
| --- | --- | --- |
| 1440×900 | 查詢空、`162 / 515`、`?scenario=工作`、無通知、焦點在卡片、`scrollY=128` | 通知 12–82px（高 70）、卡片標題 169px、焦點在「回到原本的搜尋（3 筆）」 |
| 390×844 | 同上、`scrollY=1153` | 通知 12–136px（高 124）、卡片標題 249px |
| 320×740 | 同上、`scrollY=1274` | 通知 12–158px（高 146）、卡片標題 268px |

- 一鍵回頭（桌面）：查詢「怎麼整理會議記錄」、門檻「入門對話」、`顯示 3 / 515`、網址回到 `?q=怎麼整理會議記錄&difficulty=入門對話#explore`、通知收起、焦點在 `#results-count`。
- 對比（計算值）：通知文字 11.25:1、回頭按鈕 8.71:1；三種寬度水平溢出 0。
- 文件總高不列入比較：抽卡每次載入會抽到不同案例，卡片高度本來就不同（實測桌面 7548／7628、手機 17266／17400、320px 17912／17875 的差異來自抽到的卡片，不是通知）。通知只在顯示時佔位，收起後文件高度回到同一個數量級。

截圖：`before-{desktop,phone,small}-after-switch.png`、`after-{desktop,phone,small}-after-switch.png`、`after-desktop-restored.png`（同頁、同尺寸、同資料狀態）。

## 測試

- `node --test tests/*.test.cjs`：基準 `c9bc5b72` **714 通過／0 失敗** → 本輪 **721 通過／0 失敗**（+7）。
- 受影響的既有瀏覽器流程（本機，Chromium，對本輪預覽）：`related-browser.cjs`（含 `scenario-reset`、`merged-handoff` 與手機全部關卡，axe 0）、`page-context-browser.cjs`（1440／390／320／firefox／webkit 全 PASS）、`discovery-browser.cjs`（三種寬度、axe 0）、`results-batching-browser.cjs`、`search-submit-history-browser.cjs`（390／1440 PASS）。
- `tests/pr-gate-coverage.test.cjs` 5 項通過（新測試被 PR 閘門涵蓋，沒有逃生的 `||` 綠燈）。

## 獨立審查（未參與實作）與修正

由另一個 agent context（`reviewer`，未參與本輪實作）讀 `c9bc5b72..HEAD` 的 diff、在預覽上實測、複製測試與 `app.js` 到 `/tmp` 做變異，並重跑 `node --test tests/*.test.cjs`（721 通過）。結論 **needs fixes**（0 項 must-fix、2 項 should-fix、1 項 nit），三項都已修：

1. **（已修，P2）同一個情境再按一次會丟掉待還原的查詢。** 第一次切換後條件只剩「情境」，第二次快照的 `dropped` 為空，`showScenarioReset()` 會把上一則通知與 `scenarioReset` 一起清掉——讀者因此失去唯一一條回到原本查詢的路。現在的空清空分支改為沿用上一個快照重新描述（見上），並在心動測試第 7 段釘住：連按兩次後通知仍在、承諾的筆數不變、回頭仍取回查詢。
2. **（已修，P2）排序還原的斷言沒有測到還原。** 切換不會清掉排序，所以「回頭後排序仍是 reviewed」在拿掉 `$('sort').value=reset.sort` 時照樣通過（審查者以變異實測）。現在測試在切換後把排序改成預設值（通知不會因此消失，因為排序不在 `activeConditions()` 的簽章裡），再按回頭，必須回到 `reviewed` 與網址上的 `sort=reviewed`。
3. **（已修，P3）紀錄與實際不符。** 三處已改正：`index.html` 這輪有改（`aria-describedby`）、axe 只在兩個狀態各跑一次（不是每段）、排序不是被切換清掉而是回程重設；單元測試數也改為 7 項／721 總數。

變異測試（改壞 `assets/app.js` 後重跑同一支瀏覽器回歸，每次都用新的預覽，跑完立即還原）：

| 變異 | 結果 |
| --- | --- |
| 通知固定放回結果列（`scenarioResetAnchor` 不分落點） | 紅在「the notice sits with the card the button drew」 |
| 句子漏掉實作門檻 | 紅在「names the threshold」 |
| 拿掉 `$('sort').value=reset.sort` | 紅在「the way back restores sort」 |
| 空清空時不沿用上一個快照（`source=reset`） | 紅在「the pending way back survives a no-op press」 |

審查另有兩項未能驗證、本輪記錄為限制：讀屏實際朗讀順序（`role="status"` 更新與按鈕聚焦是否重複朗讀）沒有真人／讀屏實測；`location.href` 逐字相同不成立——回頭會補上 `#explore` 片段（既有的正規化行為，查詢參數有還原）。

## 已知限制

- 本環境無法讀取截圖影像（`Image reading is disabled`），視覺結論來自 DOM 幾何、computed style、axe 與對比計算；截圖只存檔供人眼核對。
- 新回歸只跑 Chromium 三種寬度；Firefox／WebKit 只由既有的 `page-context-browser`／`related-browser` 間接覆蓋，新文案沒有跨引擎斷言。
- 「部分來源未載入時按鈕不寫筆數」由單元測試釘住；本機沒有可重現的部分載入情境，沒有瀏覽器層證據。
- 首頁通知在卡片上方，窄螢幕會把卡片往下推一個面板高度（見上表），320px 仍可見卡片標題，但整張卡片需要再往下捲。
- 通知只跟著「首頁情境按鈕」與「詳情頁探索更多」兩個入口移動；探索頁的 `#scenario-chips` 本來就不清關鍵字（交集語意），本輪未改，也沒有為它加說明。
- 抽取的 `scenarioResetAnchor()` 只認 `discover`／其他；若未來新增第三個落點，要同時更新單元測試的錨點斷言。
- 還原後的網址會多一個 `#explore` 片段（既有正規化），不是與切換前逐字相同；查詢、篩選、排序都在。
- 讀屏朗讀行為（`role="status"` 的文字更新，加上焦點移到帶 `aria-describedby` 的按鈕）只做了靜態檢視與 axe，沒有讀屏實測，可能出現重複朗讀。

## 下一輪最值得做的一件事

**把「已發布」的判決從只有 `Website QA` 一支，擴到內容 PR 也會產生裁決的證據上**——目前 16 支 PR workflow 各自重跑同一套 720 項單元測試，而真正回答「這次 merge 有沒有發布」的仍只有 `website-qa.yml` 的第 15／17 步。先做的驗證：用同一份 `tests/*.test.cjs` 改動量測本輪 PR 各 run 的 `started_at`→`completed_at` 總和，算出「單元套件只在一支 job 跑」能省下多少 job-minutes，再決定要不要收斂；不要先動 YAML。
