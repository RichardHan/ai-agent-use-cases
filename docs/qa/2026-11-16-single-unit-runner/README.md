# 2026-11-16：同一份 unit suite 只在一個 PR workflow 執行

## 基準與選題

- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 乾淨但落後；安全 fetch 後以 `--ff-only` 快轉到 `origin/main` `bd0c0a9754e8ac5b23e50eeed676473717e1b662`（PR #429 合併版）。建立時無其他開啟中的 PR。另 16 個既有 worktrees 未動；本輪隔離 worktree `/tmp/aiuc-20261116-r5`、分支 `improve/2026-11-16-r5`。
- repo／父層沒有 `AGENTS.md`；沿用 README、`SITE.md`、`_config.yml`、Website QA 與最近 `docs/qa/2026-11-16-count-target-consistency/README.md`。
- 主模型實際為 `litellm/deepseek-flash-gmi`；未切換模型、未改設定或付費通道，不宣稱使用 Terra／Gemini 或最高推理。兩個獨立調查 agent 同模型、不同 context。
- 基準 `node --test tests/*.test.cjs`：**859 pass／0 fail**（`bd0c0a97`，525 個案例檔、532 條目）。
- 正式站基準：`catalog.json.sourceRevision` = `bd0c0a9754e8ac5b23e50eeed676473717e1b662`；Pages 與 Website QA 皆 success。

## 觀測到的問題

1. **同一次 PR push 啟動 16 個 workflow，每個都先跑同一份全套 unit suite。** push `049e6dfa`（2026-11-16T01:17:57Z）的 16 個 run 全部含 `node --test tests/*.test.cjs`，合計約 75m36s；真正屬於該 workflow 的瀏覽器旅程只占其中一部分。
2. **一個斷言失敗會變成 16 個紅色 check。** 2026-11-15T00:38Z 的 `6322e0c6` 因兩個硬編總數斷言，16 個 workflow 同時紅，難以從 check 名稱判斷是哪個產品能力壞掉。
3. **目前不是故障。** 最近 24 小時 359 個 runs、0 failure；37 個 cancelled 都是 PR 新 push 取代舊版。這是訊號放大與重複成本，不是權限、額度或 Pages 故障。
4. 其他已確認但本輪不改：41 個 workflow 只綁已刪除分支（16 個連 `workflow_dispatch` 都沒有）；`tests/discovery-browser.cjs` 在 12 個 workflow 以 4 個 Playwright 版本執行；Pages 由獨立動態 workflow 發布，Website QA 只能在發布後裁決。

## 方案與選擇

- ①保留 16 份全套執行，只統一 Playwright 版本與快取；②移除 15 份重複執行，把全套留在 path filter 最廣的 Website QA，並加靜態守則。選②：真正讓「一個失敗 = 一個紅 check」成立，且不必改動任何斷言或瀏覽器旅程。①留給後續處理版本漂移。
- 守則放在既有 `tests/pr-gate-coverage.test.cjs`，不新增 workflow 或管理系統。接受殘餘風險：這些 workflow 若手動 dispatch 或 push 到舊功能分支，不再順便跑全套；PR 與 main 仍由 Website QA 覆蓋。

驗收條件：PR 只啟動一次全套 unit；15 個 workflow 各自的瀏覽器與語法步驟仍存在；新增守則能擋下「把全套加回別的 workflow」、「runner 被 push／branch gate 擋住」、「find 只選子集」、「Website QA 觸發路徑變窄」；完整 suite 與 preview 通過；三種訪客情境不退化。

範圍外：刪除 41 個休眠 workflow、統一 Playwright 版本、改 Pages 發布順序、產品 UI 與案例內容。

## 實作

- `.github/workflows/*.yml`（15 個非 Website QA 的 PR workflow）：移除 `node --test tests/*.test.cjs`（含 `--test-reporter=tap`、`$(find tests …)` 形式），保留 `node --check`、preview 建置、feature browser 與 artifact；步驟名稱同步改成語法／preview，避免留下「有跑測試」的錯誤名稱。`website-qa.yml` 不動，仍是唯一全套 runner。
- `tests/pr-gate-coverage.test.cjs`：
  - `runsFullUnitSuite()` 解析 `jobs:` 區塊，拒絕 job 層 event／ref gate；`stepReachable()` 也拒絕 `github.event_name == 'push'`，但保留 PR 可達的 `github.ref != 'refs/heads/main'`。
  - `fullSuiteCommand()` 只接受選取全部 `tests/*.test.cjs` 的指令；`$(find tests …)` 若含 `!`／`-not` 視為子集，不算全套。
  - `samplePaths()` 為每個 glob 產生多組樣本，覆蓋檢查要求其他 PR workflow 的每個觸發路徑樣本都被 Website QA 的 filter 涵蓋。

## 回歸與紅測

- 全套 `node --test tests/*.test.cjs`：基準 859 → 本輪 **863 pass／0 fail**（[final-unit.txt](final-unit.txt)）。`node --check`、57 個 workflow YAML 解析皆通過。
- `tests/pr-gate-coverage.test.cjs` 的兩個守則另以 synthetic workflow fixtures 固定行為：push gate、`!= 'pull_request'`、`if: false`、main-only step、註解掉的全套指令、只有 `find … ! -name` 子集、換行續接指令、`tests/*/test.cjs` 對上兩個列舉目錄，全部必須被拒；不含排除條件的 `find` 與 `tests/**` 則必須被接受。這是永久回歸，不依賴人工注入。
- 端到端紅測（最終守則、注入後跑 `tests/pr-gate-coverage.test.cjs`、再還原）：
  - 把全套加回 `missing-case-qa.yml` →「only Website QA runs the whole unit suite…」失敗（[red-final-duplicate-runner.txt](red-final-duplicate-runner.txt)）。
  - Website QA 的 `tests/**` 拆成 `tests/x/**`＋`tests/y/**`，另一 workflow 觸發 `tests/*/test.cjs` → 覆蓋守則失敗，指出 `reading-flow-qa.yml → tests/*/test.cjs`（[red-final-split-glob.txt](red-final-split-glob.txt)）。
  - 綠測：修正後同兩項恢復通過（[green-pr-gate.txt](green-pr-gate.txt)）。迭代過程中的其他注入版本已由上面的 fixture 取代，不留在證據目錄。
- preview：`python3 scripts/preview.py /tmp/aiuc-r5-preview/ai-agent-use-cases` 成功，`catalog.sourceRevision` = `bd0c0a97…`；`node scripts/check-published-surface.cjs`：838 檔／5.90 MiB／9 項排除通過。preview 是靜態檔，不是 Jekyll build；真正 Jekyll 由 PR Website QA 驗證。

## 訪客驗收

- 預覽 1440×900／390×844，Chromium：
  1. 新訪客從首頁「發票對帳」入口進入，得到 44／532 筆，第一張卡標題在視窗內。
  2. `?q=發票&tool=Cursor&scenario=學習` 顯示 0／532、空結果面板可見；按「清除全部條件」恢復 532 筆、24 張卡，無水平溢出。
  3. `?case=UC-014` 直鏈開啟詳情，顯示成果主張／核讀與 21 個外部來源連結；Escape 關閉後回到首頁，焦點在結果摘要。
- 證據：[acceptance-log.txt](acceptance-log.txt)、桌面／手機截圖 `accept-*.png`；axe 在首頁與 UC-014 詳情各 0 違規（[axe.txt](axe.txt)，只代表這兩個狀態）。
- 限制：本環境停用影像輸入，沒有逐像素目視截圖；以上為 DOM／幾何／文字證據。未用實體手機、讀屏實聽或 Firefox 交叉重跑；未做效能基準。

## PR、Actions 與發布

- 產品／CI 提交 `f0221e3c`（移除重複全套）、`57fc53d8`、`ad45c381`、`4ebc5d8c`、`3d140e39`（依獨立審查補強守則）；PR [#432](https://github.com/RichardHan/ai-agent-use-cases/pull/432)。建立後實際啟動 16 個 workflow（15 個 feature + Website QA），數量與改動前相同。
- 獨立 reviewer 共四輪，全部由同一模型、不同 context 執行：
  1. 初審 **Incorrect**：job／step 的 push gate、filtered `find`、單一樣本 glob。
  2. 二審 **Incorrect**：`!= 'pull_request'`、註解掉的全套指令、有限樣本無法證明 glob 涵蓋。
  3. 三審 **Incorrect**：YAML `run: >` 摺疊區塊把指令拆成兩行而漏判。
  4. 四審 **Incorrect**：`node --test > qa-artifacts/unit.tap 2>&1` 這類預設探索加重導向未被辨識。
  5. 五審 **Incorrect**：`--test-name-pattern` 等只跑子集的旗標被誤認為全套。
  最終守則要求 runner 的 job 與 step 都不得有 `if:`、只讀實際執行（去註解、接續行、`|`／`>` 區塊）、以目錄 glob 涵蓋而非樣本，並辨識預設探索（含重導向、pipe、`&&`、`tests` 目錄），但排除 `--test-name-pattern`／`--test-skip-pattern`／`--test-only`／`--test-shard` 這些子集旗標。每一輪都補了對應 fixture；端到端紅測在最終版重跑。
- 待補：最終 checks、merge、Pages 與正式站版本核對。以下狀態不互相代替。

## 下一輪

README 的公開搜尋範例數字已與現況脫節：README 寫「搜『權限』會命中 529 筆中的 521 筆」與「34＋411＝445」，正式站目前是 532 筆、524 筆命中、34＋414＝448；「學英文 32 筆」實際 34、「省錢 62 筆」實際 65、「機票 11 筆」實際 12。下一輪先以現行語料重算這組數字，決定改成不寫死數字或加一個由語料重算的守則，再更新 README；先驗證的是首頁搜尋對這四個詞的實際筆數與結果列拆解。
