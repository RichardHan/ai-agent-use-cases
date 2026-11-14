# 2026-11-14 中文次要證據宣告與括號／連字號待查證識別補強（含 CI 管線遮蔽修復）

## 基準與環境

- **Repository**：`/Users/richard_han/orca/ai-agent-use-cases`（原工作樹位於 `90093d7b`、含 159 個未追蹤檔案，完整保留不動）。
- **隔離 Worktree**：`/Users/richard_han/orca/wt/aiuc-20261114-r8`（分支 `improve/20261114-r8`，基準 `origin/main` `3a5d1237a55add48d7d7e12b653a0764ed270202`）。
- **平行工作隔離**：避開進行中的 PR #391（`improve/20261114-r5`，修改 `assets/app.js` 提及工具否定句區塊，與本輪 `declaredEvidenceClassesOfClause()` 相隔超過 740 行）與 PR #392（`improve/20261114-r6`，修改 `assets/reader.js`）。
- **正式站開工基準**：`https://richardhan.github.io/ai-agent-use-cases/`，`catalog.json.sourceRevision` 與 `corpus.json.sourceRevision` 均為 `3a5d1237a55add48d7d7e12b653a0764ed270202`，524 個來源檔、527 筆條目（520 個主要案例頁＋3 篇經驗與踩坑＋4 個待查線索）。合格真實案例數（420 案中 370 案合格）與網站收錄條目數分開計算。
- **GitHub Actions 現況**：`main` 最近 30 次非 PR 執行（15 次推送）全數 `success`；最新 `3a5d1237` 的 `pages build and deployment` [#1616 (43584715512)](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43584715512)（耗時 1m03s）與 `Website QA` [#915 (43584715729)](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43584715729)（耗時 11m46s）均為 `success`。
- **模型與環境揭露**：主整合者實際執行模型為 `factory-droid/gemini-4-argon`；設定檔 `cfg://task/perCallModel` 為 `"off"`、`cfg://modelRoles` 的 `task` 為 `litellm/deepseek-v4-flash-0731-gmi-ray`，未宣稱已切換為 `gpt-6.1-terra` 或 `gemini3.8:high flash`。

## 問題證據與目標使用者

- **目標使用者**：
  1. 在卡片或案例詳情頁第一屏（`.detail-header-meta` 與 `.detail-trust-summary`）判讀「誰提出成果主張、哪些部分是本庫原創設計未實跑、哪些部分尚待查證」的訪客。
  2. 依賴 GitHub Actions 單元測試閘門攔截回歸的維護者。
- **問題證據（全庫 527 筆條目與 57 個 workflow 實測掃描）**：
  1. **29 個案例頁在頁首 `- 證據狀態：` 以中文宣告「下方提示詞／流程／驗收方法為本庫原創設計、未測」，但 `declaredEvidenceClassesOfClause()` 只認英文 `\bdesigned\b`**：
     - 包含 `UC-035`、`UC-036`、`UC-062`、`UC-063`、`UC-064`、`UC-073`、`UC-109`、`UC-111`、`UC-318`～`UC-321`、`UC-327`、`UC-328`、`UC-330`～`UC-341`、`UC-361`、`UC-388`、`UC-393` 共 **29 頁**。
     - 這些頁面的 `proofClasses` 先前僅有單一主類別（27 頁 `['作者報告／示範']`、`UC-328` `['官方自報']`、`UC-338` `['尚待查證', '作者報告／示範']`），導致卡片 `title`／`aria-label`、詳情頁第一屏徽章與 `.detail-trust-summary` 未揭露 `設計／未實跑`，且其中 28 頁因 `proofClasses.length === 1` 完全未渲染「本案例頁首宣告 2 類來源」說明列。
  2. **2 個案例頁在頁首 `- 證據狀態：` 以帶括號說明的 `unverified（…）` 或連字號 `pending-verification` 宣告待查證子句，卻被 `unverifiedToken` 漏讀**：
     - `UC-060`：`X 自動回覆規範 unverified（官方規則頁本次被擋未讀）` 因舊版正則要求 `unverified` 後緊接純標點，遇到含中文字的括號說明即失配，漏掉 `尚待查證`。
     - `UC-086`：`HN 討論為 pending-verification` 因詞彙表未收錄 `pending-verification`，漏掉 `尚待查證`。
  3. **CI 單元測試管線遮蔽漏洞**：
     - `.github/workflows/case-share-qa.yml:36` 執行 `node --test tests/*.test.cjs | tee qa-artifacts/unit.tap` 時該步驟未設 `shell: bash`（GitHub Actions 預設 `bash -e` 不啟用 `pipefail`），若單元測試失敗會被 `tee` 的 exit code 0 遮蔽而綠燈通過；同時 `tests/pr-gate-coverage.test.cjs` 先前只檢查 `||` 而未檢查無 `pipefail` 的 `|` 管線。

## 兩個可行方案與取捨

- **方案 A（採用）：在 `assets/app.js` 的 `declaredEvidenceClassesOfClause()` 擴充中文「本庫／本頁／整理者原創設計、未測」宣告與 `unverified（…）`／`pending-verification` 識別，同時維持反向邊界（「未執行作者原碼」不誤標為設計類別），並為 `.github/workflows/case-share-qa.yml` 補上 `shell: bash` 與 `tests/pr-gate-coverage.test.cjs` 管線遮蔽守門。**
  - **價值**：
    - 全庫 **31 個案例頁**（29 頁補齊 `設計／未實跑`、2 頁補齊 `尚待查證`；含次要類別的案例由 125 筆增至 **153 筆**）在卡片與詳情頁第一屏誠實揭露次要證據類別。
    - 全庫 527 筆條目的主要類別 `proof`、`?proof=` 篩選選項計數、`relayedProof`、`difficulty`、`scenario`、`category`、`tools`、`reviewedDate` **100% 零變動**；`UC-076`、`UC-115`、`UC-147`、`UC-249`、`UC-278`、`UC-329`、`UC-345`、`UC-399`、`UC-442` 等僅寫「未執行作者程式／未獨立重現」的案例維持單一類別不誤標。
    - 消除 `case-share-qa.yml` 的 `| tee` 失敗遮蔽並以自動化測試鎖住全部 57 個 workflow。
  - **成本**：修改 `assets/app.js`（僅 `declaredEvidenceClassesOfClause()` 單一區塊）、`.github/workflows/case-share-qa.yml`、2 個測試檔與維護紀錄。
- **方案 B（不採用）：逐一修改 31 個 `cases/*.md` 的 `- 證據狀態：` 行，人工改寫為無括號的英文代號 `designed` 與 `unverified`。**
  - **不採用理由**：違反本庫保留原批次中文宣告字樣的原則，未來新批次若再次使用「本庫原創設計，未測」或 `unverified（原因說明）` 仍會靜默漏標，且無法修復 CI 管線遮蔽問題。

- **本輪不處理範圍**：
  - `assets/app.js` 提及工具否定句排除（PR #391）與 `assets/reader.js` 提示詞複製按鈕對齊（PR #392）。
  - 歷史分支專屬 workflow（如 `discovery-round-qa.yml`）的舊版 snapshot 步驟。

## 修改前後實測對照

### 1. 31 個案例頁 `proofClasses` 變化摘要（全庫 527 筆其餘欄位 0 變動）

| 類型 | 案例 ID（共 31 頁） | 修改前 `proofClasses` | 修改後 `proofClasses` |
| --- | --- | --- | --- |
| 中文宣告本庫原創設計／自設未測（作者主類，27 頁） | `UC-035`, `036`, `062`, `063`, `064`, `073`, `109`, `111`, `318`–`321`, `327`, `330`–`337`, `339`–`341`, `361`, `388`, `393` | `["作者報告／示範"]` | **`["作者報告／示範", "設計／未實跑"]`** |
| 中文宣告本庫原創、未測（官方主類，1 頁） | `UC-328` | `["官方自報"]` | **`["官方自報", "設計／未實跑"]`** |
| 中文宣告本庫原創、未測（待查證主類，1 頁） | `UC-338` | `["尚待查證", "作者報告／示範"]` | **`["尚待查證", "作者報告／示範", "設計／未實跑"]`** |
| 括號說明 `unverified（…）`（1 頁） | `UC-060` | `["作者報告／示範", "設計／未實跑"]` | **`["作者報告／示範", "設計／未實跑", "尚待查證"]`** |
| 連字號 `pending-verification`（1 頁） | `UC-086` | `["作者報告／示範", "設計／未實跑"]` | **`["作者報告／示範", "尚待查證", "設計／未實跑"]`** |

### 2. 瀏覽器三視口（1440×900、390×844、320×740）對照與截圖

| 畫面狀態 | 修改前 (`3a5d1237`) | 修改後（本輪） | 水平溢出 / `pageerror` / axe |
| --- | --- | --- | --- |
| `?case=UC-336#explore` 詳情第一屏 | 僅 1 顆徽章 `作者報告／示範`；無多類別說明列 | **2 顆徽章 `作者報告／示範`、`設計／未實跑`**；第一屏顯示 `另宣告 設計／未實跑` 與 2 列類別說明 | `false` / `0` / `0` |
| `?case=UC-060#explore` 詳情第一屏 | 2 顆徽章 `作者報告／示範`、`設計／未實跑`（漏 `尚待查證`） | **3 顆徽章 `作者報告／示範`、`設計／未實跑`、`尚待查證`**；完整呈現 3 列類別說明 | `false` / `0` / `0` |
| `?case=UC-328#explore` 詳情第一屏 | 僅 1 顆徽章 `官方自報`；無多類別說明列 | **2 顆徽章 `官方自報`、`設計／未實跑`**；第一屏顯示 `另宣告 設計／未實跑` | `false` / `0` / `0` |
| `?q=UC-336#explore` 卡片來源徽章 | `aria-label` 與 `title` 僅含主類別說明 | **`aria-label` 與 `title` 標明 `本案例另宣告 1 類來源：設計／未實跑`** | `false` / `0` / `0` |

- 量測數據：[before-measurements.json](before-measurements.json) ／ [after-measurements.json](after-measurements.json) ／ [scenarios.json](scenarios.json)
- 前後截圖（同頁、同尺寸、同資料狀態）：
  - `before-{desktop,phone,small}-{uc336-detail,uc060-detail,uc328-detail,uc336-card}.png`
  - `after-{desktop,phone,small}-{uc336-detail,uc060-detail,uc328-detail,uc336-card}.png`

## 測試與三情境驗收

```sh
node --test tests/evidence-attribution.test.cjs tests/pr-gate-coverage.test.cjs
node --test tests/*.test.cjs
node --check assets/app.js
python3 scripts/preview.py /tmp/aiuc-r8-after/ai-agent-use-cases
python3 scripts/check_corpus_bundle.py /tmp/aiuc-r8-after/ai-agent-use-cases
node scripts/check-published-surface.cjs
```

- **先紅後綠**：新增單元與瀏覽器斷言對基準版本執行時 **2 項單元測試與 1 項瀏覽器斷言失敗**（見 [red-unit.txt](red-unit.txt)、[red-browser.txt](red-browser.txt)）；套用修正後 **全數通過**（見 [green-unit.txt](green-unit.txt)、[green-browser.txt](green-browser.txt)）。
- **全套單元測試**：`node --test tests/*.test.cjs` **750 通過、0 失敗**。
- **三種訪客情境實走（1440×900 桌面／390×844 手機）**：
  1. **新訪客不知道工具名稱，從問題找到適用案例**：首頁點選「會議整理」→ 抵達 `#explore` 顯示 `顯示 29 / 527 筆收錄`，首張卡片為「自己不能到的會議，讓 Bot 進去先說明身分再記筆記」，底部批次控制標示 `已顯示 24 / 29 筆 · 再看 5 筆（尚有 5 筆）`。
  2. **組合搜尋與篩選遇到空結果後恢復探索**：開啟 `?q=規劃旅行&scenario=工作#explore` → 顯示 `顯示 0 / 527 筆收錄`，點選第一顆建議「移除使用情境「工作」 → 查看 1 筆」→ 恢復顯示 `顯示 1 / 527 筆收錄` 且保留搜尋詞 `規劃旅行`。
  3. **開啟分享的詳情連結，判讀證據、查看來源並返回探索**：開啟 `?q=語音&case=UC-336#explore` → 第一屏顯示 `作者報告／示範` 與 `設計／未實跑` 雙徽章及 `成果主張：主要 社群作者／專案實踐者；另宣告 設計／未實跑`，原始來源連結指向固定 revision；按 `Escape` 關閉後焦點回到 `#results-count`，保留 `顯示 88 / 527 筆收錄` 與搜尋詞 `語音`。

## 獨立審查（未參與實作）與補強

- 由獨立 subagent（`IndependentR8Reviewer`，`reviewer` 角色，未參與本輪主要實作）審閱 `assets/app.js`、`.github/workflows/case-share-qa.yml`、測試與 QA 紀錄：
  - **初審發現（3 項 P2）**：
    1. `assets/app.js` 的 `designedChinese` 第二支分支原先僅要求「提示詞…未實跑」，若出現「作者提供的提示詞未實跑」會誤標為 `設計／未實跑`；應要求「設計／自設／原創」或「本庫／本頁／整理者」線索。
    2. `assets/app.js` 的 `leadingUnverified` 新增 `pending-verification` 時應比照 `unverifiedToken` 檢查後接標點、括號說明或行尾，避免「`pending-verification 欄位尚未填寫`」被誤判為 `尚待查證`。
    3. `tests/pr-gate-coverage.test.cjs` 的單管線檢查應先合併行尾反斜線續行（`\\\n`）並排除單雙引號內的 `|`（如 `--test-name-pattern 'foo|bar'`）。
  - **修正結果**：已全數補強於 `assets/app.js`、`tests/evidence-attribution.test.cjs` 與 `tests/pr-gate-coverage.test.cjs`，並交由獨立 reviewer 複審確認。

## 下一輪最值得處理的一件事

- **盤點詳情頁「怎麼開始／要注意什麼」僅存退回通用句的 4 個主要案例頁**：
  - 本輪全庫掃描確認：目前 520 個主要案例頁中，僅剩 `UC-181` 的「怎麼開始」（步驟寫在 `## 可參考步驟` 下的 `### 合成資料檢查` 子節）以及 `UC-072`、`UC-278`、`UC-430` 的「要注意什麼」（`UC-072`／`UC-430` 的限制段落每條以 `[文件名稱](https://…)` 開頭被 `GUIDANCE_CITATION` 整段排除、`UC-278` 寫在 `## 實作與限制`）退回通用句。下一輪先於隔離環境驗證子節步驟與帶連結限制條目的抽取邊界。
