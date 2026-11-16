# 2026-11-16：補充／版本頁的計數語意要在卡片與統計卡就說清楚

## 基準與選題

- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 乾淨，`main` 與 `origin/main` 同在 `5a001480ba17179122b8be7ea3051079b8e19566`；建立隔離 worktree `/tmp/aiuc-r13-20261116`、分支 `improve/2026-11-16-r13`。建立時唯一開啟中的 PR 是 [#454](https://github.com/RichardHan/ai-agent-use-cases/pull/454)（空結果任務目錄改為展開式，仍在跑 checks）；本輪沒有動它負責的 `#empty-problem-toggle`／`.empty-problem-chips` 區塊。
- repo 沒有 `AGENTS.md`；沿用 `README.md`、`_config.yml`、`.github/workflows/website-qa.yml` 與 `docs/qa/2026-11-16-scope-recovery/README.md`。
- 主模型實際為 `litellm/deepseek-flash-gmi`；本環境沒有提供切換 gpt-6.1-terra 或 gemini 的介面，未切換模型、未改設定或付費通道，不宣稱使用指定模型或最高推理。三個唯讀調查（`VisitorFlowAudit`、`DeployReliabilityAudit`、`ContentIntegrityAudit`）是獨立任務上下文；其中 `VisitorFlowAudit` 沒有執行工具（只有 read/find/grep），因此它的幾何與截圖主張未被採用，瀏覽器實測由整合者執行。
- 基準 `node --test tests/*.test.cjs`：**899 pass／0 fail**（525 個案例檔、532 條目）。正式站 `catalog.json.sourceRevision` 等於 `5a001480…`；Pages 與 Website QA 對該 commit 都 success。
- Actions 現況（獨立調查 `DeployReliabilityAudit`，`gh run list`／`gh run view --log-failed`）：近七日 10 個非成功 run 全部是已修的回歸、外部服務、被下一個 push 取代的取消，或平台端合併異常；**目前沒有失敗中的 run**，也沒有權限／額度錯誤。main HEAD 的 Website QA 與 Pages 都成功，正式站 `sourceRevision` 與 `bundleVersion` 對得上。`hashFiles` 守則已移除並由 `tests/workflow-skip-guard.test.cjs` 釘住；PR 只有 `website-qa.yml` 跑完整單元套件（其餘 15 個 PR workflow 只跑各自瀏覽器面）。因此本輪不改 CI。

## 觀測到的問題

1. 統計卡自相矛盾。正式站 `5a001480`（Chromium 1440×900／390×844）「網站收錄條目」卡顯示 `525 個主要案例頁`，同一張卡的下一行寫「其中 5 頁（UC-250、UC-322、UC-324、UC-336、UC-337）是同一流程的主案例補充或版本頁，仍可搜尋與閱讀，不另計入 1,000 案目標」。數字把它自己排除的 5 頁算成「主要案例頁」。
2. 卡片把「不另計」藏在 tooltip。`?q=UC-322`／`?q=UC-336` 的卡片可見文字只有「主案例 UC-048 的版本頁」，`不另計一案` 只存在於 `title` 與 `aria-label`；手機、觸控與不 hover 的讀者看不到，卡片同時標「用法靈感」，看起來就是另一則獨立案例。詳情卻寫「不另計一案」。
3. INDEX 標題同樣寫「主要案例（525）」，與上列兩處用不同口徑。
4. 兩項由不同調查 agent 分別指出（VisitorFlowAudit 的卡片徽章、ContentIntegrityAudit 的統計卡），整合者已在正式站以 `innerText`／`title`／`aria-label` 實測確認，不是只讀程式碼。

## 方案與選擇

- ①只改統計卡文案（「主要案例頁」→「案例頁」），不動卡片：成本最低，但 5 頁在結果列表仍像獨立案例，hover 才揭露。
- ②讓三個表面用同一條規則：統計卡標籤寫出組成（`個案例頁（含 N 頁補充／版本頁）`，N 由目錄計算）、卡片徽章可見文字直接加「・不另計一案」、INDEX 標題改「案例（525）」，並補單元與瀏覽器回歸。
- 選②：這是站方已在 README 與詳情承諾的計數規則，只是前兩個表面沒跟上；改動集中在一個標籤函式、一個徽章字串與一個標題，不動搜尋、排序、抽卡、篩選與任何案例資料。

驗收條件：卡片 `innerText`（不是 tooltip）在 1440 與 390 都含「不另計一案」；統計卡標籤的數字等於目錄算出的補充／版本頁數，且與下方註記一致；INDEX 標題與表格筆數一致；`node --test tests/*.test.cjs` 全綠；三種訪客情境、axe、水平溢出不退化。

範圍外：不改 `assets/copy.json` 的 20 則首屏短句（`ContentIntegrityAudit` 指出的停止條件落差，見下節）、不改 CI 結構、不動 PR #454 的檔案、不新增分類或追蹤。

## 實作

- `assets/app.js`
  - 新增 `caseCountLabel(counts)`：`caseMerged > 0` 時回 `個案例頁（含 N 頁補充／版本頁）`，否則 `個案例頁`。
  - `refreshCorpusMetadata()` 以目錄計數更新 `#case-count-label`。
  - 卡片徽章：`mergedBase + '・不另計一案'` 成為可見文字；`title` 保留原本說明，`aria-label` 改成 `mergedBase + '，不另計一案；仍可搜尋與閱讀'`，不重複同一句。
- `index.html`：`#case-count` 旁的靜態「個主要案例頁」改為 `#case-count-label`，由資料填寫。
- `INDEX.md`：`## 主要案例（525）` → `## 案例（525）`；表格與每列的不另計說明不變。
- `README.md`：補「卡片徽章也直接寫『不另計一案』、不必滑過才看得到」，並把版本頁的卡片字樣同步為「主案例 … 的版本頁・不另計一案」。
- 回歸測試：
  - `tests/merged-destinations.test.cjs`：5 個補充／版本頁的卡片可見徽章都含「不另計一案」、`aria-label` 不重複、非補充頁沒有徽章。
  - `tests/count-target-consistency.test.cjs`：`caseCountLabel` 的兩種狀態、目錄計數與註記數字一致、標籤不得再出現「主要案例頁」。
  - `tests/evidence-attribution-browser.cjs`：三種寬度下標籤可見、數字等於載入的案例頁數、含補充頁數；`?q=UC-322`／`?q=UC-250` 的徽章可見文字含「不另計一案」、`aria-label` 保留、無水平溢出。
  - `tests/audit.test.cjs`、`tests/index-freshness.test.cjs`：INDEX 標題改為 `## 案例（N）`，仍驗證筆數等於 `cases/*.md` 數量與章節順序。

## 紅測與回歸

- 先紅：把 `assets/app.js` 換回 `5a001480` 版本後，新增的卡片測試失敗（`expected: /不另計一案/`）；換回本輪版本後 10 項全過。`caseCountLabel` 在基準程式不存在，新單元測試直接失敗。
- 全套 `node --test tests/*.test.cjs`：基準 899 → 本輪 **901 pass／0 fail**。
- `node --check assets/app.js` 通過；`node scripts/check-published-surface.cjs` → 838 檔／5.91 MiB／9 項排除，PASS。
- 瀏覽器回歸（preview `http://127.0.0.1:8141/ai-agent-use-cases/`，Chromium）：
  - `tests/discovery-browser.cjs`：desktop／mobile／small-mobile 的 guided discovery、抽卡、鍵盤、組合篩選、空結果恢復、待查排除、直鏈、重新整理、返回、溢出全過，axe 0。
  - `tests/evidence-attribution-browser.cjs`：含新增斷言，全過。
  - `tests/result-count-honesty-browser.cjs`、`tests/visitor-problem-browser.cjs`：exit 0。

## 訪客驗收

- 同頁、同尺寸、同資料狀態的前後對照（`before` 取 `5a001480` 的本機 preview，與當時正式站同一個 commit；`after` 取合併 main 後的本機 preview）：

| 尺寸 | 統計卡前 | 統計卡後 | UC-322 徽章前 | UC-322 徽章後 |
| --- | --- | --- | --- | --- |
| 1440×900 | `525` ＋「個主要案例頁」 | `525` ＋「個案例頁（含 5 頁補充／版本頁）」 | 「主案例 UC-048 的版本頁」 | 「主案例 UC-048 的版本頁・不另計一案」 |
| 390×844 | 同上 | 同上 | 同上 | 同上（徽章 188px，未溢出） |

- 補記：正式站在本輪建立後前進到 `43737bfa`（PR #454／#456 的空結果目錄改版），`git diff 5a001480..43737bfa -- assets/app.js index.html INDEX.md` 沒有碰到 `card-merged`、`case-count` 或「主要案例」字樣，因此上表的 before 對照仍描述同一段程式。
- 截圖：`before-{desktop,phone}-stats.png`、`before-{desktop,phone}-uc322.png`、`after-{desktop,phone}-stats.png`、`after-{desktop,phone}-uc322.png`；量測 [measurements.json](measurements.json)。
- 三種必要情境（preview，1440×900／390×844，`reducedMotion: reduce`，桌面與手機結果相同）：
  1. 不知道工具名稱的新訪客輸入「我想讓 AI 幫我整理會議紀錄」→ 4 筆與說明，按「改搜「會議」→ 14 筆」後畫面 14 筆、查詢欄變「會議」、前四張 UC-094／UC-277／UC-511／UC-298；開詳情看到「作者報告／示範＋設計／未實跑」；Escape 關閉、焦點回原卡片、查詢保留。
  2. `?q=發票&tool=Cursor&scenario=學習` → 0 筆，空結果面板列出「移除提及工具「Cursor」→ 1 筆」；點擊後 1 筆、網址保留 `q` 與 `scenario`、焦點在 `#results-count`。
  3. `?case=UC-322` 直鏈 → 詳情開啟、標題與版本頁說明（「本頁與主案例 UC-048 屬同一流程的版本頁，不另計一案」）、主案例站內入口；外部連結 `_blank` ＋ `noopener noreferrer`；Escape 後關閉。
- axe（wcag2a／aa／21aa）0 違規、pageerror 0、`scrollWidth - clientWidth = 0`（三種情境、兩種寬度）。

## 已知限制

- 本環境沒有 Jekyll，preview 是靜態檔；真正的 `_site` 建置與 INDEX.html 產物由 PR 的 Website QA 與合併後的 Pages 驗證。
- 未用實體手機、讀屏實聽或 Firefox／WebKit 交叉重跑；未做效能基準。
- 統計卡仍以「案例頁」為單位（含 5 頁補充／版本頁），沒有另立「合格案例」數字；合格數仍只看逐案稽核報告的歷史批次。

## 獨立審查

- 由未參與實作的獨立 reviewer context（`CountLabelsReview`）檢查最終 diff（`28f3aa8c`）、新測試與驗收證據：**P0／P1／P2 沒有 findings**。
- P3 一項：QA 紀錄引用 `shots/measurements.json`，實際檔在證據目錄根層；已改成 `measurements.json` 連結。
- reviewer 自行重跑 `node --test tests/merged-destinations.test.cjs tests/count-target-consistency.test.cjs tests/audit.test.cjs tests/index-freshness.test.cjs`：**26 pass／0 fail**；在 1440×900 核對統計卡數字、標籤、註記與 UC-322 徽章，無水平溢出，結論 correct。它另一次 390×844 的瀏覽器嘗試在等徽章時逾時，未獨立驗證該寬度；390×844 與 320×740 由整合者以 `measurements.json`、`tests/evidence-attribution-browser.cjs`（三種寬度）與 320px 幾何檢查（徽章 153×43、`scrollWidth - clientWidth = 0`）補足。
- reviewer 確認：標籤與註記使用同一個載入計數（含部分載入）、UC-250 仍顯示為「補充頁」不是版本頁、`#case-count` 仍可供既有腳本讀取、CSS 不依賴舊字樣、更新後的 INDEX 斷言仍驗證筆數與順序，不是放寬守則。
- 收到審查後只改文件路徑；合併 `origin/main`（`43737bfa`）後重跑全套 **901 pass／0 fail**，並重跑三種訪客情境（結果同上）與 `tests/evidence-attribution-browser.cjs`（exit 0）。

## PR、Actions 與發布

（待填）

## 下一輪

- 最值得先做：`assets/copy.json` 的 20 則首屏「要注意什麼」不得少於案例頁宣告的硬性停止條件。獨立調查 `ContentIntegrityAudit` 指出 UC-007 少了「不評價員工績效」「不刪帳號／不改授權／不新建排程」、UC-016 少了「每週檢查權限設定頁」與「標記售出／下架」、UC-010 少了「不安裝或執行任何專案程式」。README 明寫「短句會保留案例頁宣告的硬性停止條件」。
- 先做哪個驗證：在正式站開 UC-007／UC-010／UC-016 詳情，把首屏「要注意什麼」與同頁「權限、費用與可用性」及提示詞的停止句逐條對照，確認缺哪些動詞；再決定是補 `copy.json` 還是改 precedence，不要直接改成全文抽取。
