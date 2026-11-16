# 2026-11-16：宣告為同一流程版本頁的案例不再被算成獨立案例

## 基準與選題

- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 乾淨但落後 12 個 commit；安全 fetch 後以 `--ff-only` 快轉到 `origin/main` `a345bf5d139ce843bbe4c53645425e21765ad839`（PR #437 合併版）。建立時唯一開啟中的 PR 是 #438（docs-only 部署核對，未動本輪檔案）。本輪隔離 worktree `/tmp/aiuc-20261116-r8`、分支 `improve/2026-11-16-r8`；其他既有 worktrees 未動。
- repo 沒有 `AGENTS.md`；沿用 README、SITE.md、`_config.yml`、`.github/workflows/website-qa.yml` 與最近 `docs/qa/2026-11-16-single-unit-runner/README.md`、`docs/qa/2026-11-16-readme-count-drift/README.md`。
- 主模型實際為 `litellm/deepseek-flash-gmi`；本環境沒有 gpt-6.1-terra 或 gemini3.8:high 可選，未切換模型、未改設定或付費通道，不宣稱使用指定模型或最高推理。兩個獨立調查 agent（Actions、內容資料）同模型、不同 context；訪客調查 agent 的環境沒有 shell／browser，無法執行 Playwright，該部分由整合者自行實測。
- 基準 `node --test tests/*.test.cjs`：**871 pass／0 fail**（`a345bf5d`，525 個案例檔、532 條目）。正式站 `catalog.json.sourceRevision` 精確等於 `a345bf5d…`；該 commit 只有 Pages 部署、沒有 Website QA（docs-only push）。

## 觀測到的問題

1. 四個案例頁在頁首的證據說明自己宣告是另一個案例的同一流程版本、且「不另計」，網站卻仍把它們算成獨立案例、放進抽卡池：
   - `cases/322-…md:12`：「嚴格去重視為UC-048的數值追蹤版本，本頁保留但不另計。」
   - `cases/324-…md:13`：「嚴格去重視為 UC-212 的公共資料更新版本，本頁保留但不另計。」
   - `cases/336-…md:13`：「既有239流程版本，本輪不另計；」
   - `cases/337-…md:13`：「既有050流程版本，本輪不另計；」
2. `assets/app.js` 的 `MERGE_DESTINATION` 只認 `併入|另記|另見|合併 + UC-nnn`，這四頁沒有任何併入動詞，因此 `mergedInto` 為空；`catalogCounts()` 把 525 頁全算獨立案例、`Discovery.discoveryPool()` 把它們當可抽卡片，統計卡只揭露「其中 1 頁（UC-250）」。
3. 實測（正式站 `a345bf5d`，1440×900／390×844）：首頁寫「516 張可抽案例卡（另有 16 筆不是可抽案例）」、統計卡「其中 1 頁（UC-250）是已併入主案例的補充頁」；`?q=UC-322` 顯示一般卡片、沒有版本頁標記，詳情也沒有主案例 UC-048 的站內入口。四頁的自我宣告與網站計數、抽卡規則互相矛盾，也讓「1,000 個不同實作工作流程」的分母多算 4 頁。
4. 這不是算術錯誤：525 個頁面數與 532 條目都對得上；錯的是「已宣告不另計的頁面仍被當成獨立流程」這條計數準則，與 README 對 UC-250 類補充頁的既有承諾不一致。

## 方案與選擇

- ①只改統計卡文案，把「1 頁」改成「5 頁」，抽卡與詳情不動；成本最低，但同一流程仍會被抽成兩張卡，詳情也沒有主案例入口，矛盾只被藏起來。
- ②讓解析器讀懂頁首的「不另計」宣告（含 `視為 UC-048 的…版本`、`既有239流程版本` 兩種寫法），沿用既有的 `mergedInto` 機制：不列入抽卡池、統計與卡片如實揭露、詳情給主案例站內入口，並區分「已合併」與「版本頁」兩種說法。
- 選②：不改任何案例原文與來源，只讓網站依頁面自己的宣告計數；既有 UC-250／P-002／P-004 行為不變，且新增回歸測試防止宣告再次漏接。
- 邊界：只讀頁首的證據說明（`- 證據狀態：` 等），正文補充段落提到「不另計」不會讓整頁變成版本頁；沒有寫出案例編號的「不另計」不會生成假入口；`1,000 案目標` 不會被讀成 `UC-000`。

驗收條件：四頁的 `mergedInto` 指向其宣告的主案例；抽卡池 516→512、非可抽 16→20；統計卡列出 5 頁；卡片顯示「主案例 … 的版本頁」；詳情說「同一流程的版本頁」並可進主案例；UC-250 仍用「已合併」說法；搜尋筆數仍為 532；三種訪客情境與 axe 不退化。

範圍外：不改案例原文、不改首頁任務入口、不改搜尋語意、不改 Actions workflow、不處理 PR #438。

## 實作

- `assets/app.js`：
  - 新增 `declaredVariantDestinations(text, ownId)`：逐句（`。；;`）找含「不另計／不另立案」的句子，接受 `UC-nnn` 或緊接「流程／案例／版本／號」的三位數；排除自己的編號，`1,000` 這種千分位數字不會變成案例編號。
  - `metadata()` 新增 `explicitMerge`／`variantMerge`，`mergedInto` 為兩者聯集；新增 `mergedKind`（`merged`／`variant`）。
  - 詳情交接句與標題依 `mergedKind` 選字：版本頁寫「本頁與主案例 UC-048 屬同一流程的版本頁」，不寫成「已合併」。
  - 結果卡在既有徽章列加「主案例 UC-048 的版本頁」，`aria-label` 說明不另計一案。
  - 統計卡文案改為「是同一流程的主案例補充或版本頁」，仍接「不另計入 1,000 案目標」。
- `assets/style.css`：新增 `.card-merged` 徽章樣式（沿用既有小徽章尺寸與對比）。
- `README.md`：補一段說明版本頁的判定、卡片與詳情呈現，以及「只讀頁首宣告」的界線。
- `tests/variant-page-declarations.test.cjs`：5 項新回歸（四種宣告寫法、合併與版本頁措辭、負向案例、全語料宣告不漏接、可搜尋但不可抽）。
- `tests/count-target-consistency.test.cjs`：移除「只有 UC-250」的硬編，改由語料推導頁數與揭露清單。
- `tests/evidence-attribution-browser.cjs`：統計卡斷言改為同時涵蓋合併頁與版本頁。

## 回歸與紅測

- 先紅：以 `git show HEAD:assets/app.js` 載入基準解析器，四頁 `mergedInto` 皆為 `[]`；修正後為 `UC-048`／`UC-212`／`UC-239`／`UC-050`（見 [red-green-parser.txt](red-green-parser.txt)）。
- 全套 `node --test tests/*.test.cjs`：基準 871 → 本輪 **877 pass／0 fail**（[final-unit.txt](final-unit.txt)）；`node --check assets/app.js` 通過。
- 瀏覽器回歸（preview，Chromium）：`discovery-browser.cjs`、`draw-stability-browser.cjs`、`result-count-honesty-browser.cjs`、`detail-trust-summary-browser.cjs`、`evidence-attribution-browser.cjs` 全數 exit 0。
- 發布面：`node scripts/check-published-surface.cjs` → 838 檔／5.91 MiB／9 項排除，PASS。

## 訪客驗收

- preview（`python3 scripts/preview.py`，Chromium 1440×900／390×844，`reducedMotion: reduce`）三種必要情境：
  1. 新訪客從首頁「發票對帳」入口進入 → `顯示 44 / 532 筆收錄`，第一張卡標題在視窗內；開卡後詳情顯示 `作者報告／示範`、8 個外部來源與「本庫未獨立重現」，Escape 後焦點回到原卡片。桌面與手機結果相同。
  2. `?q=發票&tool=Cursor&scenario=學習` → `0 / 532`，空結果面板列出「移除提及工具「Cursor」→ 查看 1 筆」等選項；按第一個建議後 `1 / 532`、1 張卡，網址保留 `q` 與 `scenario`。桌面與手機相同。
  3. `?q=發票&tool=Cursor&case=UC-014` 直鏈 → 詳情開啟、21 個來源、結果脈絡「不在目前結果中」；重新載入仍開在同一案例；Escape 後網址保留 `q` 與 `tool`、焦點在 `#results-count`。
- 本輪變更的版本頁狀態（前後對照）：
  - 前：`?q=UC-322` 卡片徽章只有「創作／進階開發／需代碼/環境／用法靈感」，詳情沒有主案例入口；首頁統計卡「其中 1 頁（UC-250）…」、抽卡「516 張可抽案例卡（另有 16 筆不是可抽案例）」。
  - 後：同一查詢的卡片多一個「主案例 UC-048 的版本頁」（UC-250 則是「主案例 UC-156 的補充頁」）；詳情標題「這篇與主案例屬同一流程的版本頁」、句子「本頁與主案例 UC-048 屬同一流程的版本頁，不另計一案」，按鈕可進 UC-048；統計卡列出 5 頁、抽卡「512 張（另有 20 筆）」；390px 無水平溢出（`scrollWidth - clientWidth = 0`）。
- axe：首頁、結果、空結果、`?case=UC-322` 詳情，在 1440 與 390 各 0 違規；pageerror 0。
- 證據：[before-acceptance-log.txt](before-acceptance-log.txt)、[after-acceptance-log.txt](after-acceptance-log.txt)；截圖 `before-/after-{desktop,phone}-{variant-card,variant-detail,stats}.png` 與 `after-{desktop,phone}-{search,empty,detail}.png`。基準的 `before-*-variant-detail.png` 沒有交接區塊（`.detail-merged-handoff` 0 個）；`after-*-variant-detail.png` 取自本機 preview 的 `?case=UC-322`。
- 限制：本環境沒有 Jekyll（preview 是靜態檔，不是 Jekyll build），真正的 built-site 檢查由 PR Website QA 的 `_site` 步驟執行；未用實體手機、讀屏實聽或 Firefox 交叉重跑；未做效能基準。影像輸入停用，視覺結論以 DOM／幾何／文字與截圖檔為準，未逐像素目視。

## 獨立審查

- 由未參與實作的獨立任務 context（同模型）審查 `git diff`、新測試與驗收紀錄，初審 **Changes requested**：
  - P2：結果卡徽章不分 `mergedKind`，UC-250 這種明寫「已合併」的頁面也被叫「版本頁」，與來源和詳情說法矛盾。已改成合併頁顯示「主案例 UC-156 的補充頁」、版本頁顯示「主案例 UC-048 的版本頁」，`aria-label` 同步。
  - P3：新測試只用同一支解析器推導目的地，缺少固定預期對照。已在 `tests/count-target-consistency.test.cjs` 補上 5 頁的精確對照（UC-250→UC-156、UC-322→UC-048、UC-324→UC-212、UC-336→UC-239、UC-337→UC-050）與 `mergedKind` 順序。
- reviewer 未能執行瀏覽器；320px 徽章、複製筆記與返回焦點由整合者另行實測：三種寬度徽章都在視窗內（右緣 240／311／282px，`scrollWidth - clientWidth = 0`），`before` 版 UC-322 詳情沒有交接區塊、`after` 版有。
- 修正後重新執行全套 877 項與三情境驗收（桌面／手機），結果見上。

## PR、Actions 與發布

- 交付 PR [#441](https://github.com/RichardHan/ai-agent-use-cases/pull/441)，head `cddc4ed35bb97d3fff9f7c8ceaafa8166f860c67`。PR checks：16 項 pass、2 項 `published` 依設計 skipping（[pr-checks.txt](pr-checks.txt)）；Website QA [43816332617](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43816332617) 的 `Run existing regression tests`、`Verify the updated site in Chromium`（約 30 支瀏覽器腳本）、Jekyll `_site` 與 published-surface 步驟皆 success，13m38s。合併前 `mergeStateStatus` CLEAN，未繞過保護規則。
- 06:37:30 UTC 一般 merge，合併版本 `9cfd4e626e2c53e3c89a24d0f8ac8060508ef020`；分支已刪除（本機 `main` worktree 佔用時 `--delete-branch` 只影響本機清理，遠端 merge 已完成）。
- 對應 [Pages 43818034310](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43818034310) success；正式站 `catalog.json.sourceRevision` 精確等於 `9cfd4e62…`，`index.html`、`assets/app.js`、`assets/style.css` 與合併版逐位元相同。
- 正式站 1440×900／390×844 重走：三種必要情境、`?q=UC-322` 卡片與詳情、統計卡 5 頁、抽卡 512 張、axe 四種狀態 0、pageerror 0；[live-acceptance-log.txt](live-acceptance-log.txt)、`live-*-{variant-card,variant-detail,stats}.png`。
- 主線 Website QA 對合併版 `9cfd4e62`：[43818035120](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43818035120) **success**。
- 紀錄另以 [PR #442](https://github.com/RichardHan/ai-agent-use-cases/pull/442)（head `b01a645e`，docs-only、無 PR check）合併為 `164c45fa74940065eba7128715c5ef4e35c83e9f`。合併後 Pages [43819726615](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43819726615) success；正式站 `sourceRevision` = `164c45fa…`，`index.html`／`assets/app.js`／`assets/style.css` 仍與合併版逐位元相同，`?q=UC-322`、統計卡與抽卡 512 張在 1440／390 重新確認。此 docs-only push 依 #438 的新規則也觸發 Website QA（[43819727858](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43819727858)），交付時仍在執行；產品判決以合併版 `9cfd4e62` 的 run 為準。
- 一併關閉 issue #208：P-002 早在 PR #267 修正，今日正式站重新確認卡片「已併入 UC-028（不另計數）」、詳情「本條目已結束」與統計卡 2＋2，重現步驟已不成立。

