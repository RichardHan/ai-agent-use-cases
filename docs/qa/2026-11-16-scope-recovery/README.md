# 2026-11-16：無主題命中時的「改搜」改為最窄可用詞

## 基準與選題

- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 乾淨但落後 17 個 commit；安全 fetch 後以 `--ff-only` 快轉到 `origin/main` `95924cf26b81e4ce98da97516ffaf13cfc0eb92c`。建立時唯一開啟中的 PR 是 #444（來源 ledger 導覽，未動本輪檔案）。本輪隔離 worktree `/tmp/aiuc-20261116-r10`、分支 `improve/2026-11-16-scope-recovery`。
- repo 沒有 `AGENTS.md`；沿用 README、`_config.yml`、`.github/workflows/website-qa.yml` 與最近 `docs/qa/2026-11-16-variant-pages/README.md`。
- 主模型實際為 `litellm/deepseek-flash-gmi`；本環境沒有 gpt-6.1-terra 或 gemini3.8:high 可選，未切換模型、未改設定或付費通道，不宣稱使用指定模型或最高推理。兩個獨立調查 agent（Actions、內容資料）同模型、不同 context；本輪實作、瀏覽器驗收與最終核對由整合者執行。
- 基準 `node --test tests/*.test.cjs`：**880 pass／0 fail**（525 個案例檔、532 條目）。正式站 `catalog.json.sourceRevision` 等於 `95924cf2…`；`?q=隱私審查` 顯示 66 筆、按鈕「改搜「審查」→ 61 筆」；`?q=我想讓 AI 幫我整理會議紀錄` 顯示 4 筆、按鈕「改搜「讓」→ 273 筆」。
- Actions 現況（`gh run list`，2026-11-16 07:32 UTC）：沒有失敗中的 run，最新 failure 是 2026-11-15 的硬編總數斷言，已在 `tests/method-and-prompt-alignment.test.cjs`、`tests/prompt-copy.test.cjs` 改為下限；main 的 Pages 與 Website QA 對 `95924cf2` 都 success。PR #444 的 Website QA 依設計被下一個 push 取消並重跑，不是產品回歸。

## 觀測到的問題

1. 結果不是 0、但沒有任何案例的標題、用途或痛點同時包含整組詞時，結果頁會提供一個「改搜」單字。`renderSearchFeedback()` 的 `none` 分支用 `b.scoped - a.scoped` 排序，挑的是**命中最多**的詞。
2. 正式站實測（1440×900／390×844，Chromium）：
   - `?q=隱私審查` → 66 筆，按鈕「改搜「審查」→ 61 筆」；句中較窄的「隱私」只有 9 筆。
   - `?q=我想讓 AI 幫我整理會議紀錄` → 4 筆，按鈕「改搜「讓」→ 273 筆」；句中的任務詞「會議」只有 14 筆，「整理」129 筆。
   - 首頁任務入口有 7 個落在這個狀態：出差報銷（建議報銷 13，而非出差 2）、播客摘要（摘要 26 vs 播客 3）、寫履歷（修改 25 vs 履歷 2）、代碼重構（代碼 49 vs 重構 1）、發票辨識（發票 8 vs 辨識 5）、機票比價（比價 6 vs 機票 5）、隱私審查（審查 61 vs 隱私 9）。
3. 這不是筆數錯誤：按鈕承諾的 61／273 筆在點擊後確實會出現；錯的是「下一步」的方向。訪客帶著具體問題來，卻被送到比原句更大、更不精確的集合，等於把恢復探索變成擴大雜訊。

## 方案與選擇

- ①只改文案，把按鈕寫成「改搜更廣的詞」，不動選擇邏輯；成本最低，但訪客仍會被帶去 273 筆與問題無關的結果，問題只被說得更清楚。
- ②把選擇改成「最窄的正向集合」，排除單字中文碎詞，並用同一個 overview scope 量按鈕承諾的筆數；點擊行為不變，仍只替換關鍵字、保留可移除的其他條件，篩選把每個詞都排除時仍走原本的「清除目前篩選」出口。
- 選②：不改搜尋比對、不改同義詞、不改排序，只改恢復建議的挑選準則；改動集中在一支純函式與兩個呼叫點。
- 邊界：只影響「結果非 0、主題命中為 0」這個分支；「只看那 N 筆」、整句拆詞、空結果建議、任務入口標記都不動。

驗收條件：`隱私審查` 提供「隱私」9 筆而非「審查」61；會議紀錄句子提供「會議」14 而非「讓」273；七個任務入口都改為較窄的詞；按鈕筆數等於點擊後畫面筆數（含手機）；`node --test tests/*.test.cjs` 全綠；三種訪客情境與 axe 不退化。

範圍外：不改同義詞與排序、不改首頁任務清單、不改 Actions workflow、不處理 PR #444；UC-415 未核實數字的標題與 INDEX 的 525／520 揭露列為下一輪候選，不在本輪修改。

## 實作

- `assets/app.js`：新增 `narrowestScopeTerm(rows, searchTerms, key)`，過濾 `key > 0`、排除單字中文，依「命中數升冪 → 詞長降冪 → 原句順序」排序；`renderSearchFeedback()` 的 `none` 分支改用此函式，`resetFilters = !scopedBest`，篩選全排除時仍從 library 計數挑最窄詞並標明清除篩選。
- `README.md`：補一句說明「改搜」挑的是句中範圍最窄的可用詞（排除單字虛詞），並以「隱私審查」→「隱私」9 筆對照「審查」61 筆。
- `tests/scope-recovery-term.test.cjs`：7 項新回歸（最窄而非最寬、單字碎詞、零命中、篩選全排除時的 library 回退、同筆數時詞長與原句順序、三個真實問題不得提供虛詞、承諾筆數與 overview scope 一致）。
- `tests/result-count-honesty-browser.cjs`：新增桌面與手機斷言，`隱私審查` 必須提供「隱私」、會議紀錄句子必須提供「會議」，且點擊後畫面筆數等於按鈕承諾。

## 回歸與紅測

- 先紅：基準程式在 `narrowestScopeTerm` 不存在時新單元測試直接失敗；以基準頁面實測，兩個查詢的按鈕分別是「審查」61／「讓」273，修正後為「隱私」9／「會議」14（[acceptance-log.json](acceptance-log.json)）。
- 全套 `node --test tests/*.test.cjs`：基準 880；合併 main 後在本機 **896 pass／0 fail**（PR CI 日誌同為 896）；`node --check assets/app.js` 通過。
- 瀏覽器回歸（preview，Chromium）：`result-count-honesty-browser.cjs`、`match-scope-note-browser.cjs`、`coverage-recovery-browser.cjs`、`task-coverage-marker-browser.cjs`、`visitor-problem-browser.cjs`、`sentence-fallback-browser.cjs`、`short-sentence-browser.cjs`、`compound-split-browser.cjs`、`search-submit-history-browser.cjs`、`search-sharing-browser.cjs` 全數 exit 0。
- 發布面：`node scripts/check-published-surface.cjs` → 838 檔／5.91 MiB／9 項排除，PASS。

## 訪客驗收

- preview（`python3 scripts/preview.py`，Chromium 1440×900／390×844，`reducedMotion: reduce`）三種必要情境，桌面與手機結果相同：
  1. 新訪客輸入「我想讓 AI 幫我整理會議紀錄」→ 4 筆與說明；按「改搜「會議」→ 14 筆」後畫面真的是 14 筆，查詢欄變「會議」，前四張含 UC-094、UC-277、UC-511、UC-298；開 UC-094 詳情看到「作者報告／示範＋設計／未實跑」、6 個來源與核讀狀態，Escape 後焦點回原卡片。
  2. `?q=發票&tool=Cursor&scenario=學習` → 0 筆，面板列出「移除提及工具「Cursor」→ 1 筆」等；點擊後 1 筆、網址保留 `q` 與 `scenario`、焦點在 `#results-count`。
  3. `?case=UC-511` 直鏈 → 詳情開啟、兩個來源類別、8 個來源、延伸閱讀列出共同標籤案例；外部連結都在新分頁且 `rel=noopener noreferrer`；Escape 後關閉、焦點到結果摘要。
- 本輪變更的前後對照（同頁、同尺寸、同資料狀態）：桌面與手機的 `?q=隱私審查`、`?q=我想讓 AI 幫我整理會議紀錄` 截圖 `before-*/after-{desktop,phone}-{privacy,sentence}.png`；`before` 取自正式站 `95924cf2`，`after` 取自本機 preview。兩種寬度 `scrollWidth - clientWidth = 0`。
- axe：`?q=隱私審查` 在 1440 與 390 各 0 違規；pageerror 0。
- 限制：本環境沒有 Jekyll，preview 是靜態檔，真正的 built-site 檢查由 PR Website QA 的 `_site` 步驟執行；未用實體手機、讀屏實聽或 Firefox 交叉重跑；未做效能基準。Playwright 的 `page.goBack()` 在此自動化版本會跳過 pushState 記錄，因此恢復後的返回狀態以既有 `tests/search-submit-history-browser.cjs`（本輪 exit 0）為準，未用本次腳本另外宣稱。

## 獨立審查

- 由未參與實作的獨立 reviewer context 檢查最終 diff、新測試與驗收證據；結論 **Changes requested（P2）**：
  - 指 `_includes/case-fallback-nav.html` 不再給來源紀錄頁返回連結。核對後這是基準 `dea10671`（已合併的 PR #444）帶入的變更，不在本輪 diff；本輪分支已合併該 commit，該行為沿用 #444 已驗收的版本，未修改。
  - 指新測試沒有自動化「篩選把每個詞的 scoped 都歸零」的回退路徑；已補一項單元測試，直接驗證 `library` key 也選最窄詞（審查全排除時提供隱私 9，不是 61）。
  - reviewer 手動確認：兩個查詢在桌面與 390px 都提供較窄詞、點擊後筆數相符；有篩選時顯示會清除篩選且點擊後 9 筆；空查詢會清掉按鈕；Enter 可啟動；390px 無水平溢出。reviewer 未跑全套測試、影像閱讀停用，無法目視截圖。
- 修正後重新執行 `node --test tests/*.test.cjs` 與受影響瀏覽器腳本，結果見上。

## PR、Actions 與發布

- 交付 PR [#446](https://github.com/RichardHan/ai-agent-use-cases/pull/446)，head `0679fab3ce473c4f41c77f7d1968b330462e858d`。PR checks：18 項 pass、2 項 `published` 依設計 skipping；Website QA [43833878299](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43833878299) 13m22s success（CI 日誌 `# tests 896`／`# pass 896`、`_site`、published-surface 與瀏覽器步驟），Source guide QA [43833878554](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43833878554) 的 12 分鐘 `preview` 也 success。
- 合併版本 `76b04cd6f02b3676f0313abcc66af000e18a40ec`（第一父 `7a4f0d83`、第二父 `0679fab3`）。`gh pr merge 446 --merge` 第一次回 GitHub 502，第二次回「Merge already in progress」；之後 `origin/main` 已含此合併 commit，但 PR 狀態仍停在 OPEN、`mergeCommit` 為 null，且 GitHub 沒有為 `76b04cd6` 建立 push 觸發的 Website QA 或 Pages run。這是平台端的合併狀態異常，不是本輪程式或 workflow 的失敗；證據是 `git ls-remote origin refs/heads/main` 與 `git show -s --format=%P 76b04cd6` 都指向已合併，PR checks 也全綠。
- 交付版本的正式站核對方法：以 `git show 76b04cd6:assets/app.js` 的 sha256 對照正式站 `assets/app.js` 的 sha256；再以最新 main 部署的 `catalog.json.sourceRevision` 確認部署版本，重走 `?q=隱私審查`、`?q=我想讓 AI 幫我整理會議紀錄` 與三種情境。因 `76b04cd6` 沒有觸發部署，本次紀錄合併後的 docs-only push 會觸發 Website QA 與 Pages；正式站 `sourceRevision` 會是該次合併版，但 `assets/app.js` 必須與 `76b04cd6` 逐位元相同。
- 正式站核對（2026-11-16 09:15 UTC，最終 main `b266e6f1df3824afd32ba53f143f26f7bc87cc52`，包含本輪 `76b04cd6` 與 docs 紀錄 `62f41a74`）：Pages [43837299861](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43837299861) success；`catalog.json.sourceRevision` 精確等於 `b266e6f1…`，`assets/app.js` sha256 `2d488d86d3a87820c1c8be2ecc69018bdf04dc9f04a2cbf8277f5d914a222be1` 與 `git show 76b04cd6:assets/app.js` 逐位元相同。
- 正式站 1440×900／390×844 重走（Chromium，`reducedMotion: reduce`）：`?q=隱私審查` →「改搜「隱私」→ 9 筆」；會議紀錄句 → 4 筆與「改搜「會議」→ 14 筆」，點擊後 14 筆、查詢欄「會議」、前四張 UC-094／UC-277／UC-511／UC-298；組合篩選空結果 → 1 筆且網址保留 `q` 與 `scenario`、焦點在 `#results-count`；`?case=UC-511` 詳情兩個來源類別、外部連結 `_blank/noopener noreferrer`。axe 0、pageerror 0、水平溢出 0。證據：[live-acceptance.json](live-acceptance.json) 與 `live-{desktop,phone}-{privacy,sentence,scenario1-detail,scenario2-empty,scenario3-detail}.png`。
- 本紀錄自身的 docs-only 後續合併只新增紀錄，不改 `assets/app.js`；正式站 `sourceRevision` 會指向該次合併，但 `app.js` sha256 不變。因此上列 `b266e6f1` 是核對時的版本，不是宣稱它永遠是最新 revision。
- 最終 main 的 Website QA：[b266e6f1 43837300518](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43837300518) success、[docs 合併版 62f41a74 43837295491](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43837295491) success；PR #446 的 [43833878299](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43833878299) 也 success。三者的單元、`_site` 與 published 步驟都通過。
