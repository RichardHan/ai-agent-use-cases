# 2026-11-09 搜尋入口的鍵盤動線：一鍵到搜尋框，播報跟著案例而不是每個字

## 基準

- `origin/main` `61225e78`（PR #281 合併後）。正式站 `catalog.json` 的 `sourceRevision` 同值，`builtAt` `2026-11-08`，507 個來源檔（503 案例頁＋3 經驗與踩坑＋`sources/pending.md`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main，且有未追蹤的他人研究檔；本輪未觸碰，全程在隔離 worktree `/Users/richard_han/orca/wt/aiuc-20261109-difficulty`（分支 `improve/20261109-keyboard-search-entry`）。
- 基準 `node --test tests/*.test.cjs`：**518 通過、0 失敗**；`node --check assets/app.js` 通過。
- main 近 12 次 push 的 `Website QA` 與 `pages build and deployment` 全為 success（含 `61225e78` 的 Pages run）；本輪沒有把歷史故障當成現況。

## 問題與目標使用者

目標使用者是**只用鍵盤或讀屏**第一次到站的人。首頁是長篇編輯頁：搜尋框在 hero、任務目錄與抽卡區之後。

量測方式是**基準版本的本機預覽**：`git worktree add --detach /tmp/aiuc-baseline-61225e78 61225e78` ＋ `scripts/preview.py`，以 Chromium（`reducedMotion: reduce`）開啟 `http://127.0.0.1:8098/ai-agent-use-cases/`；修改後以同樣方式開 `…:8097/…`。兩份數據都在 `before-measurements.json`／`after-measurements.json`（`url` 欄位記錄了受測來源），不是對 richardhan.github.io 的即時量測。首頁隨機抽卡的高度每次不同，因此「捲動量」與 `queryTop` 的絕對值會浮動；下表數字照抄該次 JSON，關鍵不變量是 `activeElement`、`location.hash` 與 live region 寫入次數。

| 項目 | 1440×900 | 390×844 |
| --- | --- | --- |
| `#query` 之前的可聚焦元素 | 82 | 39 |
| 第一個 Tab 停在哪 | `a.skip`「跳到案例探索」 | 同左 |
| 按 Enter 之後（基準） | `activeElement` = `BODY`，`location.hash=#discover`，捲到抽卡區（`scrollY` 128、`queryTop` 1400） | `BODY`，`#discover`（`scrollY` 1128、`queryTop` 1480） |
| 輸入 4 個字造成的 live region 寫入（基準） | **12 次**（`draw-status` 4、`results-count` 4、`filter-outcome-count` 4） | 同左（手機兩個筆數區都可見，等於同一件事播兩次） |

也就是說：跳至內容連結指向的是隨機抽卡區，不是搜尋表單，啟動後焦點回到 `body`；讀屏使用者每打一個字會收到三次播報，其中兩次是抽卡狀態與重複的結果筆數。另有 `#scenario-chips` 標成 `role="toolbar"` 卻沒有 roving tabindex／方向鍵，與 ARIA 對 toolbar「單一停留點」的承諾不符。

`docs/qa/2026-11-09-explore-visibility/README.md` 的限制段已把「桌面搜尋框仍是第 81 個 tab stop」列為未處理項，本輪是它的接續。

## 兩個方案

- **A（採用）修好 bypass 目標與播報通道，不動版面。** 跳至內容連結改指 `#query` 並在啟動時把焦點放進輸入框；抽卡狀態改成純可見文字，另設一個只在「案例真的換了」時說話的 live region；結果筆數只留一個 live region；`#scenario-chips` 改成 `role="group"`。價值：鍵盤一次 Tab＋Enter 就到搜尋框，讀屏每打一個字只收到真正改變的那一則。成本：`index.html` 三處、`app.js` 四個函式；風險：抽卡狀態與載入進度原本靠同一個 live region，必須改由新的 announcer 承接。
- **B 把 53 個任務連結收合或改成 roving tabindex。** 可再把 tab 距離從 82 降到約 35，但要改桌機版可見版面（目前一次顯示全部任務），並且會動到既有任務入口測試（`task-entry`、`task-labels`、`mobile-problem-tags`）。價值重疊於 A，成本與回歸面都更大。

選 A：WCAG 的 bypass 機制本來就該指向主要動作；而「每打一個字播三次」是使用者實際上會遇到的錯誤行為，兩者都能用既有版面修好。53 個連結仍全部可 Tab（未隱藏），本輪不改它們的順序。

## 改動

- `index.html`
  - `.skip` 改為 `href="#query"`、文字「跳到案例搜尋」。
  - `#draw-status` 移除 `role="status" aria-live="polite"`（保留可見文字與既有措辭）；新增 `#draw-announcer`（`sr-only`、`role="status"`、`aria-live="polite"`）。
  - `#filter-outcome-count` 移除 `role="status" aria-live="polite"`（`#results-count` 已在播同一件事）。
  - `#scenario-chips` 由 `role="toolbar"` 改為 `role="group"`（內容是 16 個一般按鈕加兩段說明，沒有方向鍵行為）。
  - `/` 快捷鍵的揭露改成不佔版面：`#query` 加 `aria-keyshortcuts="/"`，輸入框旁的 `<kbd>` 由 `aria-hidden` 改為有可讀標籤（`按斜線鍵跳到這裡`），`title` 說明「按 / 跳到搜尋框」。原本要在 `#search-hint` 追加一句話，實測會讓 320px 的「搜尋框到第一張卡」距離增加約 20px（CI 基準 283px、上限 300px），因此不採用。
- `assets/app.js`
  - 新增 `announceDraw(text)`：只在文字真的改變時寫入 `#draw-announcer`。
  - `drawNext(announce=false)`：只有讀者自己按「抽一張／再抽一張」（`drawFromButton` 傳 `true`）才播報「已換一張：<標題>」；輸入關鍵字造成的自動換卡不播報，因為讀者正在打字。
  - 載入進度里程碑與載入失敗改由 announcer 播報，可見文字仍寫在 `#draw-status`。
  - `syncDiscovery()`：補上 `discoveryKey=key`（原本這個守門變數只在載入開始被設成 `''`，等於永遠不生效，每次 render 都重建牌組）；空牌組時播報一次固定句子，並用狀態鍵（`empty`／`card:<id>`／`milestone:<n>`）去重，讓「離開空狀態後再回到空狀態」仍會再播一次。
  - 自動換卡是否播報，由「這次重繪的關鍵字是否與上次相同」決定：關鍵字沒變（讀者動的是情境／門檻等篩選）就播報新卡；關鍵字變了（正在打字）就保持安靜。
  - `.skip` 點擊時聚焦 `#query`（沒有 JS 時 `href="#query"` 仍會捲到同一個位置）。
- `tests/keyboard-search-entry.test.cjs`（新，10 項）：bypass 目標、三個 live region 契約、`role="group"`、相同池不重建牌組也不改狀態、保留卡片不播報、打字換卡不播報、**動篩選換卡要播報**、明確抽卡播一次、空牌組只播一次、**離開再回到空牌組要再播**。
- `tests/keyboard-search-entry-browser.cjs`（新）：1440×900 與 390×844 各跑一次「Tab→Enter 到搜尋框且在視窗內」、輸入時 live 寫入只落在 `#results-count`、**讀者改門檻排除目前卡片時恰播一則且含新標題**、按「再抽一張」只播一則且含新標題、axe WCAG 2.1 AA 0 違規。
- `.github/workflows/website-qa.yml`：updated-site 階段加入 `KEYBOARD_URL=… node tests/keyboard-search-entry-browser.cjs`。
- `README.md`：補一段鍵盤動線與 `/` 快捷鍵的訪客可見說明。

## 驗證

先紅後綠：

- 單元測試複製到基準 `61225e78` 的隔離 checkout（`git worktree add --detach /tmp/aiuc-baseline-61225e78 61225e78`）執行 → `pass 0 / fail 10`。
- 瀏覽器測試對基準預覽（`http://127.0.0.1:8098/ai-agent-use-cases/`）失敗於 `desktop: the bypass link must name the search destination`；修正後對預覽連跑 3 次全過，輸出 `KEYBOARD_SEARCH_ENTRY …`（含 `announcementsWhileTyping: 0`、`redrawAnnouncements: 1`、`facetAnnouncement: 已換一張：…`、`axeViolations: 0`）。

修改後（`after-measurements.json`）：

| 項目 | 1440×900 | 390×844 |
| --- | --- | --- |
| 第一個 Tab / Enter 後 | `INPUT#query`，`queryTop` 430px（視窗 900）、`hash` 空 | `INPUT#query`，`queryTop` 406px（視窗 844） |
| 輸入 4 個字的 live 寫入 | **4 次，全部是 `results-count`** | 同左 |
| 可見文字仍更新 | `draw-status` 4 次、`filter-outcome-count` 4 次（非 live） | 同左 |
| `#scenario-chips` role | `group` | `group` |
| 按「再抽一張」（瀏覽器測試） | 1 則「已換一張：<標題>」 | 同左 |
| 改門檻把目前卡片排除（瀏覽器測試） | 1 則「已換一張：<新標題>」 | 同左 |

測試與走查（本機預覽，`scripts/preview.py` → `http://127.0.0.1:8097/ai-agent-use-cases/`）：

- `node --test tests/*.test.cjs`：**528 通過、0 失敗**（基準 518＋新增 10）；`node --check assets/app.js`、`node --check assets/discovery.js` 通過。
- 受影響瀏覽器流程全數通過：`discovery`、`draw-stability`、`explore-visibility`（laptop/small-laptop/tall/phone）、`search-reveal-settle`、`substring-recovery`、`mobile-problem-tags`、`visitor-problem`（三尺寸、axe 0）、`home-search-entry`、`search-expansion-consistency`、`results-batching`（390/1440）、`search-submit-history`（390/1440）。
- 三個必要情境（桌機與手機各一次，`after-scenarios.json`、`after-*-scenario*.png`）：
  1. 不知道工具名，輸入「我想整理家裡的帳單」→ 37 筆；開第一張卡讀到憑據標籤、成果主張來源、核讀狀態、安全採用建議與 10 個固定版本來源連結；Escape 後關鍵字與 37 筆都還在。
  2. `?q=發票&scenario=生活&kind=pending` → 0 筆，空狀態提供「移除收錄狀態『還在查證』→ 查看 10 筆」；點選後 10 筆、情境保留、焦點回到結果筆數。
  3. `?case=UC-511#explore` 直鏈 → 憑據與來源分層可讀、GitHub 固定版本連結在、12 個外部來源連結；重新整理仍開著詳情；Escape 關閉後回到 `#explore`、焦點在結果筆數。
- 截圖（同頁、同尺寸、同資料狀態；`before-*` 來自基準預覽）：`before/after-{desktop,phone}-skip-focus.png`、`before/after-{desktop,phone}-after-skip.png`、`before/after-{desktop,phone}-search-hint.png`，另有 `after-*-scenario{1,2,3}-*.png`。

## 限制

- `#query` 之前的可聚焦元素仍是 82（手機 39）：53 個任務連結沒有隱藏。本輪修的是 bypass 目標與播報，不是把整個目錄收合；未使用跳至內容連結的人，Tab 距離不變。
- 只在本機 Chromium 量測與走查；Firefox／WebKit 的既有流程由各 workflow 涵蓋，本輪未逐一在本機重跑。`inspiration-handoff-browser` 在本機失敗於 `chromium-1440` 的第一個 handoff 斷言，對**未修改的基準預覽**以相同行號失敗（`/tmp/qa-kb-base`），判定為本機既有的時序問題，交由 CI 的 `discovery-round-qa`／`result-journey-qa` 判定。
- 沒有真人使用研究；本輪量的是焦點位置、live region 寫入次數與 axe 結果。
- `#results-count` 仍逐字更新並播報（搜尋即時回饋的主要通道），本輪只移除另外兩個重複／高頻的 live region。
- 「改篩選換卡要播報」的判定靠比對上一次繪製時的關鍵字：若同一次操作同時改關鍵字與篩選（例如任務捷徑自帶 `q=`），換卡仍視為打字情境而不播報，只由結果筆數發聲。
- 同一頁內重試補讀（`#retry-failed` 或整頁載入失敗後按「重新載入」）時，若搜尋字詞沒變，會把卡片變更視為篩選造成的換卡並播報一則「已換一張」；這是重試後的額外播報，不算錯誤，但屬噪音。
- `/` 快捷鍵在輸入框、下拉選單、文字區或案例視窗內不作用；頁面上只以輸入框旁的 `/` 與 `aria-keyshortcuts` 揭露，沒有額外文案（會佔掉 320px 的搜尋框到結果預算）。
- CI 診斷：本輪第一次推送時 `Source guide QA` 的 preview job 失敗，日誌截斷在 `source-guide-browser` 的報告之後。由 artifact 檔案清單確認：`source-guide-chromium-expanded-small-mobile.jpg` 與 `source-guide-chromium.json` 未產生，失敗點在 `mobile-search-browser.cjs` 的 320px `firstResultFromSearch<300` 斷言；同一份 artifact 在 main 的 CI 量到 283px。原因就是上面那句追加文案，已改為不佔版面的做法。

## 獨立審查與後續修正

獨立 reviewer（未參與實作）對 `2c7e5e3f` 提出四點，前兩點為真並已修，第三點改文案，第四點是紀錄錯誤：

1. 篩選造成的換卡原本完全靜音（`syncDiscovery` 一律 `drawNext()` 不播報）。已改為「關鍵字未變」時播報，並補單元與瀏覽器測試。
2. 空牌組去重只看文字，離開後再回來不會重播。已改成以狀態鍵去重，並補測試。
3. `/` 提示寫成「頁面任何位置」，但輸入框與案例視窗內實際無效。已改為「不在輸入框或案例視窗內時」。
4. 紀錄原本把量測寫成「正式站實測」，但 JSON 記錄的是本機預覽、且數字是另一次執行。已改寫來源與數字（本節開頭）。

## 發布

| 狀態 | 內容 |
| --- | --- |
| 已提交 | `2c7e5e3f`（主要改動）、`3251158c`（review 修正）、`6c5debce`（320px 預算修正），分支 `improve/20261109-keyboard-search-entry` |
| 已推送 | `origin/improve/20261109-keyboard-search-entry` → PR [#282](https://github.com/RichardHan/ai-agent-use-cases/pull/282) |
| PR 檢查 | 13 個 check 全部 pass；2 個 `published` job 依設計在 PR 上 skip。失敗過的 `Source guide QA`（run [42544474594](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42544474594)／[42543141698](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42543141698)）在 `6c5debce` 的 run [42545547754](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42545547754) 通過 |
| 已合併 | `32e3a7a6` Merge pull request #282（base `37090a56`，合併前 main 為 `37090a56`） |
| 合併後 CI | `pages-build-deployment` run [42546597665](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42546597665)；`Website QA` run [42546598982](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42546598982)（含 published 階段） |
| 部署 | 兩次失敗後由紀錄 commit `9418869a` 的新 push 觸發，run [42548701031](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42548701031) 的 build 與 deploy 均成功；正式站 `sourceRevision` 為 `9418869a`（含 `32e3a7a6` 的內容）。`Website QA`（含 published 階段，run [42546598982](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42546598982)）success |
| 正式站已驗證 | 是，見下節「正式站核對」 |

### 部署逾時的經過（未修根因）

run [42546597665](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42546597665) 的 build 成功，但 `Deploy to GitHub Pages` 兩次都在 `syncing_files` 停留到 600 秒上限後失敗（01:49:23、02:00:53），狀態為 `failure` 且無描述；同時 `gh api repos/…/pages` 回報 `status: errored`，GitHub 狀態頁當時為 operational。第一次失敗後以「GitHub 端部署逾時、非程式或檢查問題」為由只重跑失敗 job 一次，得到相同結果，不再無限重試。第三次改由紀錄 commit `9418869a` 的新 push 觸發（同時要留下本紀錄），build 與 deploy 皆成功。

這與 2026-11-07 的 Pages `syncing_files` 逾時同型（`docs/qa/2026-11-07-pages-recovery.md`）；那次重跑一次即成功，這次沒有。兩次失敗的部署狀態都沒有描述，**不能**斷定根因，也不把第三次成功當成修復。若再遇到，先看 `deploy` job 的 `syncing_files` 停留時間與 `repos/…/pages` 的 `status`，再決定是否重跑。

## 正式站核對（`9418869a`）

| 項目 | 結果 |
| --- | --- |
| `catalog.json` `sourceRevision` | `9418869ac9f7cca651c1a199837786306d24fdd6`（含 `32e3a7a6` 的內容；後續純紀錄 commit 只推進 revision） |
| `assets/app.js` sha256 前 16 碼 | 正式站 `0fa69d912f6cf13c` ＝ main（`32e3a7a6`）`0fa69d912f6cf13c` |
| `index.html` sha256 前 16 碼 | 正式站 `95b5933e4d5fb3e8` ＝ main `95b5933e4d5fb3e8`（部署前的舊值為 `b473a8be254a0191`／`fa7a52744407a2f9`） |
| Tab→Enter（1440×900） | `activeElement` = `#query`，`queryTop` 430px（視窗 900） |
| Tab→Enter（390×844） | `activeElement` = `#query`，`queryTop` 406px（視窗 844） |
| 輸入「會議」的 live 寫入 | 桌機 2 次、手機 2 次，全部落在 `results-count`；`#draw-announcer` 在打字期間保持空字串 |
| axe WCAG 2.1 AA（更新後首頁） | 桌機與手機皆 0 violations；無 page error |
| 既有發布閘門 | `Website QA` 的 published 階段（`tests/deployed-browser.cjs`）success |

量測腳本為一次性 `/tmp/lv2.mjs`（Chromium、`reducedMotion: reduce`、等 `discoveryReady` 與載入進度隱藏後才開始打字，避免把載入里程播報計入）。

## 下一輪最值得處理的一件事

**「實作門檻」目前是關鍵字推測，卻以案例事實呈現。** 證據：`grep '實作門檻|難度：|入門對話|進階開發' cases/*.md` 在 503 個案例頁中 0 命中，值全部由 `assets/app.js` 的 `extractDifficulty()` 以整頁關鍵字推導；`cases/099-travel-photo-scrapbook.md:39`（照片紀念冊，工具是 Grok Bot／照片資料夾）只因為「原始照片、腳本、完整影片未公開」這句話裡的「腳本」就被標成「進階開發（需本機環境或代碼）」，於是被「免寫程式」篩選排除。

先在下一輪做的驗證：用 `extractDifficulty()` 跑全庫（可重用 `tests/difficulty-and-problem-discovery.test.cjs` 的 vm harness），列出每個案例的觸發詞；再人工核對「只由 `腳本` 觸發」的那批。**不要**直接把 `腳本` 從規則移除：同一批裡 `cases/368-dots-3d-scene-assets-to-local-agent-unreal-import.md` 確實需要本機引擎，移除後會變成「入門對話」，反而誤導非工程師。可走的方向是「案例可宣告 `- 實作門檻：`，未宣告才推測，且推測在 UI 標明」，並對已確認誤判的案例補宣告。

另一個候選（較小、但屬同一類「數字要說出基準」）：首頁 `index.html:116` 寫 `/ 1,000 案`，而 `sources/research-2026-10-22-0840.md:10` 記「總目標2000；1000只是中途里程碑」，`INDEX.md` 的批次紀錄也反覆寫「2000口徑待確認」。這需要 owner 決定目標口徑，再改成由來源檔宣告、UI 讀取，不宜由本輪自行選一個數字。
