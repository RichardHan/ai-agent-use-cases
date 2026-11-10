# 2026-11-11 第二次按情境就把「回到原本的搜尋」弄丟了

## 基準

- 開發基準 `origin/main` `da01ab66`（開工時 main 已含 #358 `a5b60cfc`「首頁情境按鈕不再無聲丟掉訪客的搜尋」與 #360 的紀錄）。隔離 worktree `/private/tmp/aiuc-1111-r20-main`（分支 `improve/20261111-scenario-reset-persistence`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 三百餘個 commit，另有 159 個未追蹤檔案（皆已存在於 origin/main）；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`：**714 通過、0 失敗**；`node --check assets/app.js` 通過。
- 正式站開工時 `catalog.json.sourceRevision` = `c9bc5b72…`；main 已有 `a5b60cfc` 的建置（`pages build and deployment` success），但正式站當時仍服務 `c9bc5b72`，所以「這一輪的訪客問題」是以 `da01ab66` 的本機預覽量測，發布後再於正式站重走。
- Actions 現況重新確認：main 自 2026-11-08 起 300 次 run 中只有 2 次 failure（`Website QA` 42820349847 與分支上的 `Corpus bundle QA` 42814279823，兩者都已在先前回合修掉），`pages build and deployment` 0 次 failure；本輪不把歷史 CI 問題當成仍然存在。

## 問題證據

目標使用者是**在同一次造訪裡換了兩次情境的訪客**：第一次切換清掉了他的關鍵字，畫面給了他「回到原本的搜尋」；他再按另一個情境想多看一點，結果那條回頭路消失。

在 `da01ab66` 的本機預覽實測（1440×900、390×844、320×740 三段一致）：

1. `?q=怎麼整理會議記錄` → 7 / 515。
2. 按「工作省點力」→ 通知出現、`回到原本的搜尋（7 筆）`、捲到 `scrollY=1915`（桌面）。
3. 再按「生活」→ `#scenario-reset` 變成 hidden、查詢仍是空的、`101 / 515`、`scrollY` 被拉回 128（手機 1153、320px 1274），焦點掉回 `BUTTON`。查詢**沒有任何回頭路**；`#scenario-reset-message` 仍留著上一次的字（`已切換到「工作」情境…`）但不可見。

成因（讀碼確認，不是猜）：`chooseScenarioFromHero()`（`assets/app.js:1632`）只在「這一次按鈕自己有清掉東西」時才呼叫 `showScenarioReset()`；第二次按鈕 `scenarioSwitchReset()` 回 `null`（剩下的條件只有情境本身），於是直接 `return`。但 `chooseScenario()` → `render()` → `syncScenarioReset()` 會因為條件簽章變了（情境從工作變生活）把上一則通知與 `scenarioReset` 快照一起清掉——回頭路就跟著消失。同一支 `render()` 的抵達捲動把讀者帶回頁首，讓即使還在 DOM 的通知也離開視窗。

這是 #358 修好的同一個問題的另一半：**第一次切換不再無聲，但第二次切換會把「回到原本」也一起弄丟**。

## 兩個方案

- **A（採用）把還在畫面上的那則通知視為待還原狀態，跨一次「沒有清掉東西」的切換沿用。**
  - 做法：新增 `pendingScenarioReset()`——在切換前先取用 `scenarioReset` 快照，移除「情境」這一項（換方向本身就是這次的操作，不是損失），其餘被清掉的條件原樣保留；`chooseScenarioFromHero()` 改成「本次有清掉 → 用本次快照；本次沒清掉但有待還原 → 用待還原快照重新描述成現在選的情境；兩者都沒有 → 維持原本的卡片交接」。重新描述後仍然走既有的 `landOnScenarioReset()`（#358 的落點：通知 + 結果列，焦點在 `#results-count`），不改變已合併的版面決策。
  - 價值：讀者按幾次情境都不會失去回到自己那句話的路；通知文字永遠描述目前畫面上的情境；第二次按同一顆也不會把視窗拉走。
  - 成本：`app.js` +14 行（1 個小函式 + 1 個分支）、1 支單元測試（4 項）、1 支三尺寸瀏覽器回歸、`website-qa.yml` 1 行、`README.md` 1 句、紀錄 1 份。
  - 取捨：待還原快照會活得比一次切換久（直到條件真的變動或讀者回頭）。這是刻意的：那些條件確實還是被清掉的狀態。代價是「回頭」按鈕承諾的筆數可能與目前畫面不同（例如 7 筆 vs 101 筆），文案已寫明是「原本的搜尋」。
- **B 不採用：第二次切換時再拍一次快照（保留當下的情境，其他為空）。**
  - 這樣第二次按鈕自己就「有東西可清」（情境），會顯示「使用情境「生活」已清除」這種描述按鈕本身的通知，而且**仍然沒有**回到原本關鍵字的路——它解決的是文案，不是遺失。上一輪的 `scenarioSwitchReset()` 已經明確否決把情境當損失，本輪不推翻。
- **C 不採用：改回把通知放進抽卡區（本輪較早的實驗版）。**
  - 已量測：那會讓讀者留在卡片、通知在卡片上方（卡片標題 169／249／268px）。但那等於在 #358 剛合併、附帶自己的紀錄與正式站重走之後，直接反轉它的落點決策；同一輪内的兩個實作不該互相覆蓋。此版本已關閉（PR #359），量測數字留在該 PR。

## 改動

- `assets/app.js`
  - 新增 `pendingScenarioReset()`：把先前的 `scenarioReset` 快照複製一份、去掉 `scenario` 條件；沒有待還原快照或去掉後沒有條件時回 `null`（純情境切換仍然安靜）。
  - `chooseScenarioFromHero()`：切換前先取 `pending`；切換後 `const notice=reset||pending;`，有就用它顯示並落到通知；都沒有才維持原本「卡片接手」的行為。註解寫明為什麼要跨按鈕保留（`render()` 會用條件簽章把舊通知清掉）。
- `tests/scenario-reset-persistence.test.cjs`（新，4 項）：沒有待還原時回 `null`；待還原時保留筆數與查詢、只去掉情境；只有情境的待還原沒有任何話可說；回傳的是複本（原始快照不被改動）。
- `tests/scenario-reset-persistence-browser.cjs`（新）：1440／390／320 各走五段——第一次切換的通知在視窗內且點名查詢；**第二次切換後通知仍在、仍在視窗內、改說「生活」、不把工作當損失、承諾的筆數不變**；回頭仍取回 7 筆與原查詢；同一顆連按兩次同樣保留；沒有任何待還原時切換保持安靜、卡片接手焦點。通知狀態各跑一次 axe（0 違規）。
- `.github/workflows/website-qa.yml`：PR 閘門加上新回歸。
- `README.md`：首頁情境那句補上「會寫出清除了哪些條件與原本筆數，並提供一鍵回到原本的搜尋；再換一次情境時這條回頭路仍保留」。
- `SITE.md`：本輪紀錄。

## 先紅後綠

- `VERIFY_URL=<da01ab66 預覽> node tests/scenario-reset-persistence-browser.cjs`：`desktop: the pending way back survives another scenario press — true !== false`（通知確實被藏起來）→ 改動後三種寬度全部通過（`SCENARIO_RESET_PERSISTENCE_OK`）。
- `node --test tests/scenario-reset-persistence.test.cjs`：改動前後皆需 `pendingScenarioReset` 存在，故以 `node --check` 與整包套件驗證（714 → 718 通過）。

## 量測（同頁、同尺寸、同資料；`?q=怎麼整理會議記錄` → 工作 → 生活）

| 視口 | 改動前（`da01ab66`） | 改動後 |
| --- | --- | --- |
| 1440×900 | 通知 hidden、查詢空、`101 / 515`、`scrollY` 1915 → **128**、焦點掉回按鈕 | 通知 visible 24–94px、`已切換到「生活」情境…`、`回到原本的搜尋（7 筆）`、`scrollY=1915`、焦點 `#results-count` |
| 390×844 | 通知 hidden、`scrollY` 3151 → **1153** | 通知 visible 24–148px、`scrollY=2966` |
| 320×740 | 通知 hidden、`scrollY` 3330 → **1274** | 通知 visible 24–148px、`scrollY=3327` |

水平溢出在三個寬度都是 0；改動前 `#scenario-reset-message` 仍留著上一則文字但整個面板 hidden（正是「看不到、也回不去」）。

截圖：`before-{desktop,phone,small}-after-second-press.png`、`after-{desktop,phone,small}-after-second-press.png`（同頁、同尺寸、同資料狀態）。

## 測試

- `node --test tests/*.test.cjs`：基準 `da01ab66` **714 通過／0 失敗** → 本輪 **718 通過／0 失敗**（+4）。
- `node --check assets/app.js` 通過；`tests/pr-gate-coverage.test.cjs` 的 5 項不變量通過（新測試被 PR 閘門涵蓋）。
- 受影響既有流程（本機，對本輪預覽）：`discovery-browser.cjs`（三種寬度、axe 0，含 #358 的 Journey 1b）、`related-browser.cjs`（`scenario-handoff`／`scenario-reset`／`merged-handoff`，axe 0）、`page-context-browser.cjs`（1440／390／320／firefox／webkit 全 PASS）。

## 已知限制

- 本環境無法讀取截圖影像（`Image reading is disabled`），視覺結論來自 DOM 幾何、computed style、axe 與捲動座標；截圖只存檔供人眼核對。
- 新回歸只跑 Chromium 三種寬度；Firefox／WebKit 只由既有的 `page-context-browser`、`related-browser` 間接覆蓋。
- 「待還原」只跨「沒有清掉任何條件」的切換；若讀者在兩次切換之間改了任何篩選，`syncScenarioReset()` 依原設計讓通知退場，回頭路消失——這是既有契約（通知只描述它被產生時的那一次切換），本輪未改。
- 通知的 `role="status"` 與 `#results-count` 的焦點可能連續朗讀；沒有讀屏實測。
- 本輪沒有處理 #358 留下的版面問題（讀者被帶到結果列、剛抽到的卡片留在 1,500–1,800px 之上）。已量測（卡片標題 top −1570 桌面／−1579 手機／−1825 320px），但那是已合併的設計決策，留給下一輪由需求方決定是否調整。

## 發布

- **已提交**：分支 `improve/20261111-scenario-reset-persistence`，2 個 commit（`b0ce374c`、`a393bb7f`）。
- **已推送**：`origin/improve/20261111-scenario-reset-persistence`。
- **PR**：[#361](https://github.com/RichardHan/ai-agent-use-cases/pull/361)。head `a393bb7f` 上 16 支 pull-request workflow 全部 success、2 支 `published` 依設計 skipped；`pr-gate-coverage` 5 項不變量通過。
- **已合併**：squash 為 `0601671a618df5e3d571ddcfb7bbec29d66aaac1`（`gh pr merge --squash` 因本機 `main` 被另一個 worktree 佔用而在刪分支步驟失敗，改用 API 刪除分支；未繞過任何保護規則）。
- **部署成功**：`pages build and deployment` [42902424971](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42902424971) 對 `0601671a` success（21:10:54→21:11:56Z）。
- **正式站已驗證（live 等於 `0601671a`）**：用 `scripts/published-revision.cjs` 的 `waitForLiveRevision()` 直接查正式站，`{"mode":"exact","liveRevision":"0601671a…","attempts":1}`；`catalog.json.sourceRevision` = `0601671a…`；`index.html`（28,016 bytes）、`assets/app.js`（379,456）、`assets/style.css`（64,668）、`assets/reader.js`（35,416）、`assets/reader.css`（32,696）與合併 commit 逐 byte 相同。
- **正式站重走（1440×900、390×844，live = `0601671a`）**：
  - 本輪流程：`?q=怎麼整理會議記錄` 7 / 515 → 工作 → 生活 → 通知仍在視窗內、`已切換到「生活」情境；原本的關鍵字「怎麼整理會議記錄」已清除`、按鈕仍寫 `回到原本的搜尋（7 筆）`、焦點 `#results-count`；按下去回到 `7 / 515`、查詢回來、網址 `?q=怎麼整理會議記錄#explore`、通知收起。`SCENARIO_RESET_PERSISTENCE_OK` 三種寬度在正式站直接跑過。
  - 情境 1（不知道工具名的新訪客）：首頁任務「會議整理」→ `?q=會議#explore` 27 / 515 → 開第一張卡，詳情有來源與證據標籤、5–11 個外部來源連結；關閉後回到同一組結果（27 / 515）。
  - 情境 2（組合條件遇到空結果）：`?q=規劃旅行&scenario=工作` 0 / 515 → 空結果頁提供「移除使用情境「工作」→ 查看 1 筆」→ 點擊後 1 / 515、查詢保留。
  - 情境 3（分享的詳情直鏈）：`?case=UC-024` 直接開啟、來源連結固定在 `0601671a`；關閉後回到 515 / 515 的清單。三種情境水平溢出皆 0、pageerror 0。

**本輪未能取得的部分**：讀屏朗讀未實測；截圖未經人眼檢視（環境無法讀取影像）；Firefox／WebKit 只有既有的 `page-context-browser`（本機 5 種引擎組合全 PASS）間接覆蓋新流程。

## 下一輪最值得做的一件事

**確認「換情境後留在卡片」與「換情境後留在結果列」哪個才是首頁按鈕的承諾，並用同一個落點規則收斂。** 先做的驗證：在同一份 `da01ab66` 上，分別量「讀者在頁首按情境」與「讀者在結果列按情境」兩種起始位置，記錄 `#drawn-case` 與結果列的位移、以及回到卡片所需捲動距離；再用三個具體情境（新訪客、已搜尋者、分享連結接手者）判斷哪一種落點讓「按鈕承諾的事情」和「畫面上第一眼看到的東西」一致。不要先改程式。
