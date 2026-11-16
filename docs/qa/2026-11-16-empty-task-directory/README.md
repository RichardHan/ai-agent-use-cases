# 2026-11-16 空結果面板的任務目錄不再藏在巢狀捲動裡

## 基準與選題

- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 乾淨但落後 28 個 commit；安全 `git fetch` 後 `--ff-only` 快轉到 `origin/main` `4f94978f261582d78fea2c81dca7d685121dac49`，之後主線又前進兩個 docs-only 合併（`2b8f8b2b`、`5a001480`），本輪隔離 worktree `/tmp/aiuc-r12`、分支 `improve/2026-11-16-r12` 以 `5a001480ba17179122b8be7ea3051079b8e19566` 為基準 rebase，產品檔與 `4f94978f` 相同。建立時 0 個開啟中的 PR。
- repo 沒有 `AGENTS.md`；沿用 README、SITE.md、`_config.yml`、`.github/workflows/website-qa.yml` 與最近 `docs/qa/2026-11-16-browser-step-guard/README.md`。該紀錄的「下一輪」明列：先量空結果面板在 390px 一次列出 55 個任務按鈕的影響，再決定是否沿用首頁「先顯示 9 項＋展開」。
- 主模型實際為 `litellm/deepseek-flash-gmi`；本環境沒有 gpt-6.1-terra 或 gemini3.8:high 可選，未切換模型、未改設定或付費通道，不宣稱使用指定模型或最高推理。三個獨立調查 agent 同模型、不同 context；其中訪客調查 agent 的環境沒有 shell，無法執行 Playwright，該部分由整合者自行實測；Actions 與內容調查的結論由整合者重新核對。
- 基準 `node --test tests/*.test.cjs`：**899 pass／0 fail**（`5a001480`，525 個案例檔、532 條目）。正式站 `catalog.json.sourceRevision` 在開工時精確等於 `4f94978f…`。

## 觀測到的問題

1. 正式站 `4f94978f`、`?q=xyz987&scenario=開發`（無可用詞的空結果）在 390×844：`.empty-problem-chips` 是固定 300px 的巢狀捲動框，內容高 **2,047px**、50 個任務按鈕，框內只看得到 8 個；頁面捲動不會揭露其餘 42 個，框上也沒有任何「可捲動」提示。
2. 1440×900 同一個框：內容 **1,096px**、只看得到 16 個；320×640：內容 **2,712px**。
3. 鍵盤：從第一個任務按鈕起算，要按 **50 次 Tab** 才能離開整段任務目錄（下一個停點是「修改關鍵字」）。
4. 首頁的同一份任務目錄已有「先顯示 9 項＋顯示全部 N 個任務」的折疊；空結果面板沒有，同一個目錄在站上有兩種形狀。
5. 這不是資料錯誤：50 個按鈕都有結果、筆數也正確；問題是空結果這個死路把最後的出口藏在一个要另外學習手勢的小框裡。

## 方案與選擇

- ①只加「可捲動」提示或漸層陰影：成本最低，42 個選項仍藏在巢狀捲動，觸控與鍵盤都要先猜手勢才找得到。
- ②沿用首頁的折疊：先列 9 項，按「顯示全部 N 個任務」在頁面流程內展開；移除 300px 巢狀捲動。所有寬度都用同一個形狀。
- 選②：不新增第二種目錄慣例；桌機的預設面板由 727px 降到 **643px**（比原本更短），手機由 851px 變成 938px（+87px），但 9 個選項完整可見、其餘 41 個只需一個有標籤的按鈕，鍵盤停點由 50 降到 9。
- 邊界：不改任務清單的內容、排序與覆蓋率標記；不改搜尋語意與復原建議順序；不改首頁目錄；不新增追蹤或資料傳送。

驗收條件：≤400px 寬的預覽與桌機都先顯示 9 個任務、有可見的展開按鈕且 `aria-expanded=false`；容器不得有內部捲動；Tab 由第一個任務到展開按鈕為 9 步；展開後全部任務可見可點、仍無內部捲動；收合時焦點回到按鈕；三種必要訪客情境與 axe 不退化。

範圍外：不改案例原文與計數、不改 Actions 結構（只在 Website QA 加一行新測試指令）、不處理 `refine-from-results-browser.cjs` 的固定 400ms 睡眠（另記為下一輪）。

## 實作

- `assets/app.js`：
  - 新增 `EMPTY_TASK_VISIBLE_COUNT = 9`、`emptyTaskDirectoryExpanded`、`syncEmptyTaskDirectory()`：設定 `data-collapsed`、`aria-expanded` 與按鈕文字（`顯示全部 N 個任務`／`收合任務清單（先顯示 9 項）`）。
  - 空結果目錄把第 10 個之後的按鈕放進 `#empty-problem-rest`；`#empty-problem-toggle` 以 `aria-controls` 控制它。收合時若焦點在隱藏區內，焦點回到按鈕。
  - 所有任務按鈕仍留在 DOM，維持既有覆蓋率標記、`aria-describedby` 與點擊行為。
- `assets/style.css`：移除 `.empty-problem-chips` 的 `max-height:300px; overflow-y:auto`；新增 `.empty-problem-rest`（`display:contents`，收合時 `display:none`）與 `.empty-problem-toggle`（44px 觸控高度、focus-visible、沿用站上綠色）。
- `README.md`：補一段說明空結果目錄的折疊與「不再有巢狀捲動」。
- `.github/workflows/website-qa.yml`：Chromium 步驟新增 `EMPTY_TASKS_URL=… node tests/empty-task-directory-browser.cjs`。
- `tests/empty-task-directory-browser.cjs`：390×844、320×640、1440×900 三尺寸的契約測試（9 項、展開、無內部捲動、Tab 9 步、焦點、實際搜尋、axe）。
- `tests/empty-task-directory.cjs`：既有瀏覽器測試共用的 `expandEmptyTaskDirectory(page)`。
- 既有測試更新（契約改變，不是降低斷言）：`combined-recovery-browser`、`coverage-recovery-browser`、`visitor-adoption-browser`、`visitor-adoption-flow-browser`、`visitor-problem-browser` 先展開再點第 10 個之後的任務；兩個 adoption 測試的「固定高度 ≤340」改為「無內部捲動＋9 項＋展開後全部」。

## 回歸與紅測

- 先紅：新測試對基準 `http://127.0.0.1:8124`（`5a001480` 的 preview）執行，exit 1：
  `AssertionError: mobile: the empty panel must offer a disclosure button for the task directory`（[red-baseline.txt](red-baseline.txt)）。
- 修正後：同一支測試三個尺寸 exit 0，`PASS empty task directory`；390／320 的 `visibleBefore=9`、`chosen=庫存管理`、`results=5`，1440 的 `collapsedHeight=162`。
- 全套 `node --test tests/*.test.cjs`：基準 **899 → 899 pass／0 fail**（[final-unit.txt](final-unit.txt)）；`node --check assets/app.js` 通過。
- 受影響瀏覽器回歸（preview，Chromium 1440／390／320；combined-recovery 另含 Firefox／WebKit 390）：`combined-recovery-browser`、`coverage-recovery-browser`、`visitor-adoption-browser`、`visitor-adoption-flow-browser`、`visitor-problem-browser` 全數 exit 0，axe 0。
- 發布面：`node scripts/check-published-surface.cjs` → 838 檔／5.91 MiB／9 項排除，PASS。

## 訪客驗收

preview（`python3 scripts/preview.py`，Chromium 1440×900／390×844，`reducedMotion: reduce`）三種必要情境：

1. 新訪客不知道工具名：首頁「發票對帳」→ `顯示 44 / 532 筆收錄`、24 張卡片、第一張卡在視窗內；開卡後「成果主張：社群作者／專案實踐者 核讀：本庫未獨立重現」在視窗內，Escape 後回到原卡片。
2. 組合搜尋與篩選：`?q=發票&tool=Cursor&scenario=學習` → 空結果，建議「移除提及工具「Cursor」→ 查看 1 筆」；按下後 `1 / 532`，網址保留 `q=發票` 與 `scenario=學習`。
3. 分享的詳情直鏈：`?q=發票&tool=Cursor&case=UC-014` → 詳情開啟、7 個外部來源、結果脈絡「不在目前結果中」；重新載入仍開在同一案例；Escape 後網址保留 `q` 與 `tool`，焦點在 `#results-count`。

本輪變更的面板狀態（前後對照，同一查詢 `?q=xyz987&scenario=開發`）：

| 尺寸 | 前：面板高／目錄框 | 前：可見任務 | 後：面板高／目錄 | 後：可見任務 | 展開後 |
| --- | --- | --- | --- | --- | --- |
| 390×844 | 851px／300px 框，內容 2,047px | 8（其餘靠巢狀捲動） | 938px／334px，無內部捲動 | 9＋展開按鈕 | 50 |
| 320×640 | 905px／300px 框，內容 2,712px | 8 | 1,014px／355px，無內部捲動 | 9＋展開按鈕 | 50 |
| 1440×900 | 727px／300px 框，內容 1,096px | 16 | 643px／162px，無內部捲動 | 9＋展開按鈕 | 50 |

- 鍵盤：從第一個任務到離開目錄由 **50 次 Tab** 降為 **9 次**（停點為展開按鈕）。
- axe：首頁、結果、詳情、空結果在 1440 與 390 皆 0 違規；`pageerror` 0；水平溢出 0。
- 證據：[before-log.json](before-log.json)、[after-log.json](after-log.json)；截圖 `before-/after-{desktop,phone}-{panel-collapsed,panel-expanded}.png` 與三情境的 `s1-results`、`s2-empty`、`s3-detail`。

## 限制

- 本環境沒有 Jekyll；preview 是靜態檔，真正的 built-site 由 PR Website QA 的 `_site` 步驟驗證。
- 未使用實體手機、讀屏實聽或 Firefox／WebKit 交叉重跑本輪新測試；無障礙數據來自本機 axe 掃描。影像輸入停用，視覺結論以 DOM 幾何、文字與截圖檔為準，未逐像素目視。
- 手機空結果面板比原本高 87px（851→938）；換來的是 9 個完整可見的任務、沒有巢狀捲動、鍵盤停點 50→9。桌機面板同時變短。
- `emptyTaskDirectoryExpanded` 在同一次瀏覽階段保留讀者的展開選擇；切換查詢後仍維持展開，重新載入頁面才回到收合。

## 獨立審查

- 由未參與實作的獨立任務 context（同模型、read-only）審查 `git diff 5a001480`、新測試與證據，初審 **Changes requested**：
  - P2：展開按鈕的邊框 `#c9d5c3` 對白色 `#empty` 面板只有 **1.52:1**，是這顆按鈕唯一的輪廓提示；文字 8.71:1 但非文字對比不足，axe 不會抓。已改為 `#899882`，實測 **3.05:1**（面板 computed background 是 `rgb(255,255,255)`，不是 `--paper`）。
- reviewer 自行在 390×844／320×640／1440×900 重跑契約測試：9/50 收合、展開 50、無內部捲動、Tab 9 步、收合焦點回按鈕、第 10 個之後的任務可實際搜尋（庫存管理 5 筆）、axe 0；resize 與重複 render 只留一個 toggle／rest，`aria-controls` 目標存在；無新網路請求、storage 或案例內容變更。
- 修正後重新執行新測試（三尺寸 exit 0）、`after` 證據與 axe；reviewer 複核回覆 **Approve**（邊框 3.05:1），其餘結論不變。
- reviewer 指出 adoption 測試的 `<=700` 高度上限偏寬；專用測試在三個必要尺寸另驗 `<=400`，實測 162／334，未發現現行回歸。

## 下一輪

1. `tests/refine-from-results-browser.cjs:90` 用固定 `waitForTimeout(400)` 等「修改關鍵字」按鈕的隱藏狀態，`assets/app.js` 是在 rAF 內依 `getBoundingClientRect().bottom<=0` 決定；2026-11-14 主線唯一一次 failure（[43634859717](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43634859717)，`2138f4d4`）就是這個斷言，失敗後 steps 10–18 全被跳過。本輪把新測試加進同一個 33 支指令的步驟，重試成本更高；下一輪先以 `for i in $(seq 20); do REFINE_URL=… node tests/refine-from-results-browser.cjs || break; done` 重現，再改成 `page.waitForFunction(() => document.getElementById('refine-query').hidden)`，同樣跑 20 次對照。
2. 次要：`INDEX.md:12` 只寫「525 筆案例」，沒有揭露其中 5 頁是同一流程的補充／版本頁（525−5=520），首頁統計卡已揭露；`tests/index-freshness.test.cjs` 只鎖檔案數。先核對五頁清單與 README 說法，再補揭露句與測試。

## PR、Actions 與發布

- 交付 PR [#454](https://github.com/RichardHan/ai-agent-use-cases/pull/454)，head `c64036b9f43288299b6177ad8db55e2b2345fe69`。PR checks：16 項 pass、2 項 `published` 依設計 skipping，`mergeStateStatus` CLEAN，未繞過保護規則。Website QA [43849384825](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43849384825) success：`Run existing regression tests` 899 pass／0 fail、`Verify the updated site in Chromium` success 且日誌含 `EMPTY_TASKS_URL=… node tests/empty-task-directory-browser.cjs`、Jekyll `_site` 與 published-surface 步驟 success。
- 10:43:48 UTC 一般 merge，合併版本 `cfe861e23406834c9d0cf0d4115b0c73738db11a`。
- 對應 [Pages 43851443756](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43851443756) success；正式站 `catalog.json.sourceRevision` 精確等於 `cfe861e2…`，`index.html`、`assets/app.js`、`assets/style.css`、`assets/discovery.js` 與合併版 SHA-256 相同。
- 正式站重走（1440×900／390×844）：新契約測試 exit 0（9／50 收合、展開 50、無內部捲動、桌面收合 162px）；三種必要情境、四個狀態 axe 0、pageerror 0、水平溢出 0；[live-log.json](live-log.json)、`live-*-{panel-collapsed,panel-expanded,s1-results,s2-empty,s3-detail}.png`。
- 主線 Website QA 對合併版 `cfe861e2`：[43851444437](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43851444437)，交付時仍在執行；產品判決以 PR #454 的 run 與正式站核對為準。
