# 2026-11-09 搜尋入口的鍵盤動線：一鍵到搜尋框，播報跟著案例而不是每個字

## 基準

- `origin/main` `61225e78`（PR #281 合併後）。正式站 `catalog.json` 的 `sourceRevision` 同值，`builtAt` `2026-11-08`，507 個來源檔（503 案例頁＋3 經驗與踩坑＋`sources/pending.md`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main，且有未追蹤的他人研究檔；本輪未觸碰，全程在隔離 worktree `/Users/richard_han/orca/wt/aiuc-20261109-difficulty`（分支 `improve/20261109-keyboard-search-entry`）。
- 基準 `node --test tests/*.test.cjs`：**518 通過、0 失敗**；`node --check assets/app.js` 通過。
- main 近 12 次 push 的 `Website QA` 與 `pages build and deployment` 全為 success（含 `61225e78` 的 Pages run）；本輪沒有把歷史故障當成現況。

## 問題與目標使用者

目標使用者是**只用鍵盤或讀屏**第一次到站的人。首頁是長篇編輯頁：搜尋框在 hero、任務目錄與抽卡區之後。

正式站實測（Chromium，`reducedMotion: reduce`，見 `before-measurements.json`）：

| 項目 | 1440×900 | 390×844 |
| --- | --- | --- |
| `#query` 之前的可聚焦元素 | 82 | 39 |
| 第一個 Tab 停在哪 | `a.skip`「跳到案例探索」 | 同左 |
| 按 Enter 之後 | `activeElement` = `BODY`，`location.hash=#discover`，捲到抽卡區（`queryTop` 1507px） | `BODY`，`#discover`（`queryTop` 1561px） |
| 輸入 4 個字造成的 live region 寫入 | **12 次**（`draw-status` 4、`results-count` 4、`filter-outcome-count` 4） | 同左（手機兩個筆數區都可見，等於同一件事播兩次） |

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
  - `#search-hint` 補一句「頁面任何位置按 / 鍵可跳到這裡」，讓既有的 `/` 快捷鍵可以被發現（原本 `<kbd>` 是 `aria-hidden`）。
- `assets/app.js`
  - 新增 `announceDraw(text)`：只在文字真的改變時寫入 `#draw-announcer`。
  - `drawNext(announce=false)`：只有讀者自己按「抽一張／再抽一張」（`drawFromButton` 傳 `true`）才播報「已換一張：<標題>」；輸入關鍵字造成的自動換卡不播報，因為讀者正在打字。
  - 載入進度里程碑與載入失敗改由 announcer 播報，可見文字仍寫在 `#draw-status`。
  - `syncDiscovery()`：補上 `discoveryKey=key`（原本這個守門變數只在載入開始被設成 `''`，等於永遠不生效，每次 render 都重建牌組）；空牌組時播報一次固定句子。
  - `.skip` 點擊時聚焦 `#query`（沒有 JS 時 `href="#query"` 仍會捲到同一個位置）。
- `tests/keyboard-search-entry.test.cjs`（新，9 項）：bypass 目標、三個 live region 契約、`role="group"`、相同池不重建牌組也不改狀態、保留卡片不播報、自動換卡不播報、明確抽卡播一次、空牌組只播一次、同一張卡重抽不播。
- `tests/keyboard-search-entry-browser.cjs`（新）：1440×900 與 390×844 各跑一次「Tab→Enter 到搜尋框且在視窗內」、輸入時 live 寫入只落在 `#results-count`、按「再抽一張」只播一則且含新標題、axe WCAG 2.1 AA 0 違規。
- `.github/workflows/website-qa.yml`：updated-site 階段加入 `KEYBOARD_URL=… node tests/keyboard-search-entry-browser.cjs`。
- `README.md`：補一段鍵盤動線與 `/` 快捷鍵的訪客可見說明。

## 驗證

先紅後綠：

- 單元測試複製到基準 `61225e78` 的隔離 checkout（`git worktree add --detach /tmp/aiuc-baseline-61225e78 61225e78`）執行 → `pass 1 / fail 8`（唯一通過的是「保留卡片不播報」，在基準上因為沒有 announcer 節點而顯得成立）。
- 瀏覽器測試對基準預覽（`http://127.0.0.1:8098/ai-agent-use-cases/`）失敗於 `desktop: the bypass link must name the search destination`；修正後對預覽連跑 3 次全過，輸出 `KEYBOARD_SEARCH_ENTRY …`。

修改後（`after-measurements.json`）：

| 項目 | 1440×900 | 390×844 |
| --- | --- | --- |
| 第一個 Tab / Enter 後 | `INPUT#query`，`queryTop` 430px（視窗 900） | `INPUT#query`，`queryTop` 406px（視窗 844） |
| 輸入 4 個字的 live 寫入 | **4 次，全部是 `results-count`** | 同左 |
| 可見文字仍更新 | `draw-status` 4 次、`filter-outcome-count` 4 次（非 live） | 同左 |
| `#scenario-chips` role | `group` | `group` |
| 按「再抽一張」 | 1 則「已換一張：<標題>」 | 同左 |

測試與走查（本機預覽，`scripts/preview.py` → `http://127.0.0.1:8097/ai-agent-use-cases/`）：

- `node --test tests/*.test.cjs`：**527 通過、0 失敗**（基準 518＋新增 9）；`node --check assets/app.js`、`node --check assets/discovery.js` 通過。
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
