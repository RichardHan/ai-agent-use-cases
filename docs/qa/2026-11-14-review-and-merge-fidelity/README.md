# 2026-11-14 案例頁首核對紀錄與合併來源證據說明的一致性補強（含發布驗收目錄防禦）

## 基準與環境

- **Repository**：`/Users/richard_han/orca/ai-agent-use-cases`（原工作樹位於 `90093d7b`、含 159 個未追蹤檔案，完整保留不動）。
- **隔離 Worktree**：`/Users/richard_han/orca/wt/aiuc-20261114-r7`（分支 `improve/20261114-r7`，基準 `origin/main` `370885d81af7d2063f7548c6fdbe6587b01f104f`）。
- **平行工作隔離**：避開進行中的 PR #391（`improve/20261114-r5`，修改 `assets/app.js` 與 `README.md`）及 PR #392（`improve/20261114-r6`，修改 `assets/reader.js`），不重複實作且不爭用共用程式碼檔案。
- **正式站開工基準**：`https://richardhan.github.io/ai-agent-use-cases/`，`catalog.json.sourceRevision` 與 `corpus.json.sourceRevision` 均為 `370885d81af7d2063f7548c6fdbe6587b01f104f`，524 個來源檔、527 筆條目（520 個主要案例頁＋3 篇經驗與踩坑＋4 個待查線索）。合格真實案例數（420 案中 370 案合格）與網站收錄條目數分開計算。
- **GitHub Actions 現況**：`main` 自 2026-11-11 以來連續 24 次執行全綠；最新 `370885d8` 的 `pages build and deployment` [#1615 (43560663528)](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43560663528)（耗時 1m04s）與 `Website QA` [#909 (43560664135)](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43560664135)（耗時 11m49s）均為 `success`。
- **模型與環境揭露**：主整合者實際執行模型為 `factory-droid/gemini-4-argon`；設定檔 `cfg://task/perCallModel` 為 `"off"`、`cfg://modelRoles` 的 `task` 為 `litellm/deepseek-v4-flash-0731-gmi-ray`，未宣稱已切換為 `gpt-6.1-terra` 或 `gemini3.8:high flash`。

## 問題證據與目標使用者

- **目標使用者**：
  1. 依卡片與詳情頁的「頁首核對 YYYY-MM-DD」徽章，或從首頁「最近核對的內容 →」（`?sort=reviewed#explore`）尋找近期查證案例的訪客。
  2. 開啟多來源合併案例詳情頁，閱讀「原始研究、來源與提示詞」內頁首 `- 證據狀態：` 判斷各來源證據型態（有無影片、截圖、公開倉庫或前後數據）的訪客。
- **問題證據（全庫 520 個主要案例頁、524 個來源檔實測掃描）**：
  1. **10 個案例頁的「頁首核對」日期比頁面自己記錄的補充、版本覆核或死鏈複查日期還舊（最長落後 20 天）**：
     - `tests/review-record-fidelity.test.cjs` 的 `datedReviewSections()` 先前只檢查「以 `YYYY-MM-DD` 開頭」的章節標題（`^#{2,4}\s*(\d{4}-\d{2}-\d{2})`），漏掉三類本庫實際使用的查證紀錄格式：
       - **括號尾綴補充標題（5 頁）**：`UC-003`（頁首 `2026-10-13` vs `## 日文反例：…（2026-10-16核讀）`）、`UC-028`（頁首 `2026-10-19` vs `## Grok Bot 版本補充：…（2026-10-21 14:40補）` 且 `INDEX.md:47` 已列 `2026-10-21補`）、`UC-124`（頁首 `2026-10-17` vs `## 補充：…（2026-10-22 11:42，台灣）`）、`UC-338`（頁首 `2026-10-18` vs `## 補充：…（2026-10-22 11:42，台灣）`）、`UC-391`（頁首 `2026-10-20` vs `### 來源C：…（X，英文；2026-10-22 14:40 補）` 且 `INDEX.md:405` 已列 `2026-10-22補`）。
       - **`## 去重與版本紀錄` 與補充段落明寫的併入／重讀查證紀錄（3 頁）**：`UC-050`（頁首 `2026-10-14` vs `- 2026-11-03 09:00 併入 S-050C…`，落後 20 天）、`UC-025`（頁首 `2026-10-14` vs `2026-10-17讀正文`）、`UC-084`（頁首 `2026-10-16` vs `- 2026-10-17（台灣時間）：重讀原文…`）。
       - **來源連結失效（404）的後續複查紀錄（2 頁）**：`UC-324`（頁首 `2026-10-18` vs `- 目前可用性（2026-10-25）：…GitHub 顯示「Page not found」`）、`UC-469`（頁首 `2026-10-29` vs `引用的 GitHub 倉庫於 2026-11-09 查核回 404`）。
  2. **頁首 `- 本次增補查證：` 殘留上一輪舊日期（1 頁）**：
     - `UC-066` 第 11 行已更新為 `2026-11-14 09:00`（對應正文 `S-066P`），但第 3 行仍留著 `2026-11-12 08:55（台灣時間）；只核S-066O`（接續 `SITE.md` 上輪待辦；另確認 `UC-066` 頁首並無 `- 實作門檻：入門對話` 宣告）。
  3. **4 個多來源合併案例的頁首 `- 證據狀態：` 仍停在早期來源，與同頁已併入來源矛盾**：
     - `UC-089`：正文已收錄 `S-089A`～`S-089E` 共 5 個來源（且 `- 一句話用途：` 以 `S-089C` 法文作者為主），`- 證據狀態：` 卻只列 `S-089A`、`S-089B`。
     - `UC-336`：正文與 `INDEX.md:350` 已併入 `S-336B`（2026-11-13，Apple Watch＋Ray-Ban 即時語音自述，無影片／原碼）與 `S-336C`（2026-11-14，已 root Echo Dot 按鍵通話公開 how-to 與參考程式，未下載執行），`- 證據狀態：` 卻只寫 `S-336A`（約 66 秒示範影片＋架構文字）。
     - `UC-351`：正文已收錄來源A～G共 7 個來源，`- 證據狀態：` 卻只列來源A～D並寫「四者都沒有用量前後對照數據」。
     - `UC-359`：正文與 `- 一句話用途：` 已併入來源C（2026-11-13，@ZeekTyt 每晚只讀退追通知自述），`- 證據狀態：` 卻只列來源A、來源B並寫「兩者皆無截圖」。
  4. **CI 發布驗收產物目錄防禦缺口**：
     - `tests/published-version.cjs:287` 直接寫入 `qa-artifacts/published-version.json` 而未先呼叫 `fs.mkdirSync('qa-artifacts', { recursive: true })`，若單獨執行或調整前置步驟順序會因 `ENOENT` 失敗。

## 兩個可行方案與取捨

- **方案 A（採用）：維持網站「只認頁首明示宣告、不從正文散文猜測」的架構契約，同步修正 14 個案例頁的頁首宣告（補齊 10 頁 `- 本次增補查證：`、更新 `UC-066` 增補查證行、補齊 `UC-089`／`UC-336`／`UC-351`／`UC-359` 的 `- 證據狀態：` 合併來源說明），擴充 `tests/review-record-fidelity.test.cjs`、`tests/review-date-keys.test.cjs`、`tests/evidence-status-consistency.test.cjs` 守門規則與 `templates/case.md`，並在 `tests/published-version.cjs` 補上 `mkdirSync`。**
  - **價值**：
    - 10 個頁首核對日落後的案例頁立即呈現真實最新查證日與正確的 `?sort=reviewed` 排序名次（如 `UC-469` 由第 72 名升至第 21 名進入首屏第一批 24 筆、`UC-050` 由第 511 名升至第 50 名）。
    - 全庫 527 筆條目的 `proof`、`proofClasses`、`relayedProof`、`difficulty`、`difficultySource`、`scenario`、`category`、`tags`、`tools`、`coreGoal`、`targetUser` **100% 零變動**。
    - 與平行 PR #391（`assets/app.js`）與 PR #392（`assets/reader.js`）零檔案衝突。
  - **成本**：修改 14 個 `cases/*.md`、4 個測試檔、`templates/case.md` 與 `tests/published-version.cjs`。
- **方案 B（不採用）：改寫 `assets/app.js` 的 `reviewDate()` 直接從全文散文與標題擷取最新日期，並忽略頁首 `- 證據狀態：` 的來源列舉缺漏。**
  - **不採用理由**：違反全站「核對日、分類、證據等級只認頁首宣告，不從正文推測」的設計原則（易將案例內的活動日期或來源發布日誤判為本庫核對日），無法修復詳情頁「兩者／四者」與實際 3 個／7 個來源的文字矛盾，且會與 PR #391 發生檔案衝突。

- **本輪不處理範圍**：
  - `assets/app.js` 提及工具否定句排除（PR #391）與 `assets/reader.js` 提示詞複製按鈕擴充（PR #392）。
  - 未逐一列舉來源代號（僅寫總括式 `author-demo`）的合併案例頁首。

## 修改前後實測對照

### 1. 10 個案例頁的 `reviewedDate` 與 `?sort=reviewed` 排名變化（527 筆條目）

| 案例 ID | 檔案 | 修改前 `reviewedDate` | 修改後 `reviewedDate` | 修改前 `?sort=reviewed` 排名 | 修改後 `?sort=reviewed` 排名 | 依據紀錄 |
| --- | --- | --- | --- | ---: | ---: | --- |
| `UC-003` | `cases/003-store-operations.md` | `2026-10-13` | **`2026-10-16`** | 515 | **422** | `## 日文反例：…（2026-10-16核讀）` |
| `UC-025` | `cases/025-team-event-follow-through.md` | `2026-10-14` | **`2026-10-17`** | 505 | **319** | `## 真實活動補充：…（…2026-10-17讀正文）` |
| `UC-028` | `cases/028-bill-comparison-preparation.md` | `2026-10-19` | **`2026-10-21`** | 266 | **219** | `## Grok Bot 版本補充：…（2026-10-21 14:40補）` |
| `UC-050` | `cases/050-daily-eink-mood-illustration.md` | `2026-10-14` | **`2026-11-03`** | 511 | **50** | `- 2026-11-03 09:00 併入 S-050C…` |
| `UC-084` | `cases/084-botops-tiered-fleet-notion-tickets.md` | `2026-10-16` | **`2026-10-17`** | 426 | **322** | `- 2026-10-17（台灣時間）：重讀原文…` |
| `UC-124` | `cases/124-vehicle-maintenance-record-review.md` | `2026-10-17` | **`2026-10-22`** | 330 | **195** | `## 補充：…（2026-10-22 11:42，台灣）` |
| `UC-324` | `cases/324-daily-outage-digest-verified-incident-db-pr.md` | `2026-10-18` | **`2026-10-25`** | 302 | **101** | `- 目前可用性（2026-10-25）：…Page not found` |
| `UC-338` | `cases/338-driver-daily-hours-log-paycheck-check.md` | `2026-10-18` | **`2026-10-22`** | 314 | **203** | `## 補充：…（2026-10-22 11:42，台灣）` |
| `UC-391` | `cases/391-bot-fleet-private-dashboard-sensitive-scan-before-push.md` | `2026-10-20` | **`2026-10-22`** | 261 | **206** | `### 來源C：…（X，英文；2026-10-22 14:40 補）` |
| `UC-469` | `cases/469-muse-skill-ana-pay-to-money-forward-manual-wallet.md` | `2026-10-29` | **`2026-11-09`** | 72 | **21** | `引用的 GitHub 倉庫於 2026-11-09 查核回 404` |

### 2. 瀏覽器三視口（1440×900、390×844、320×740）對照與截圖

| 畫面狀態 | 修改前 (`370885d8`) | 修改後（本輪） | 水平溢出 / `pageerror` / axe |
| --- | --- | --- | --- |
| `?sort=reviewed#explore` 首屏第一批（24 筆） | `UC-469` 不在第一批（排第 72 名） | **`UC-469` 位於第一批第 21 筆**（`頁首核對 2026-11-09`） | `false` / `0` / `0` |
| `?q=UC-050#explore` 卡片核對日徽章 | `頁首核對 2026-10-14` (`datetime="2026-10-14"`) | **`頁首核對 2026-11-03`** (`datetime="2026-11-03"`) | `false` / `0` / `0` |
| `?case=UC-336#explore` 頁首證據狀態 | 僅描述 `S-336A`（約 66 秒示範影片＋架構文字） | **完整涵蓋 `S-336A`、`S-336B（2026-11-13補）`、`S-336C（2026-11-14補）`** | `false` / `0` / `0` |
| `?case=UC-351#explore` 頁首證據狀態 | 僅列 `來源A`～`來源D`（「四者都沒有用量前後對照數據」） | **完整涵蓋 `來源A`～`來源G`**（「各來源都沒有同工作量的前後用量對照數據」） | `false` / `0` / `0` |

- 量測數據：[before-measurements.json](before-measurements.json) ／ [after-measurements.json](after-measurements.json) ／ [scenarios.json](scenarios.json)
- 前後截圖（同頁、同尺寸、同資料狀態）：
  - `before-{desktop,phone,small}-{sort-reviewed,uc050-card,uc336-detail,uc351-detail}.png`
  - `after-{desktop,phone,small}-{sort-reviewed,uc050-card,uc336-detail,uc351-detail}.png`

## 測試與三情境驗收

```sh
node --test tests/review-record-fidelity.test.cjs tests/review-date-keys.test.cjs tests/recent-review.test.cjs tests/evidence-status-consistency.test.cjs tests/published-version.test.cjs
node --test tests/*.test.cjs
python3 scripts/preview.py /tmp/aiuc-r7-after/ai-agent-use-cases
python3 scripts/check_corpus_bundle.py /tmp/aiuc-r7-after/ai-agent-use-cases
node scripts/check-published-surface.cjs
```

- **先紅後綠**：新增／擴充測試對基準 `cases/` 執行時 **4 項失敗**（見 [red-unit.txt](red-unit.txt)）；套用修正後 **全數通過**（見 [green-unit.txt](green-unit.txt)）。
- **全套單元測試**：`node --test tests/*.test.cjs` **749 通過、0 失敗**。
- **瀏覽器回歸套件**：`evidence-attribution-browser.cjs`、`detail-trust-summary-browser.cjs`、`results-batching-browser.cjs`、`arrival-summary-visibility-browser.cjs`、`result-count-honesty-browser.cjs` 全數通過（見 [green-browser.txt](green-browser.txt)）。
- **三種訪客情境實走（1440×900 桌面／390×844 手機）**：
  1. **新訪客不知道工具名稱，從問題找到適用案例**：首頁點選「會議整理」→ 抵達 `#explore` 顯示 `顯示 29 / 527 筆收錄`，首張卡片為「自己不能到的會議，讓 Bot 進去先說明身分再記筆記」，底部批次控制標示 `已顯示 24 / 29 筆 · 再看 5 筆（尚有 5 筆）`。
  2. **組合搜尋與篩選遇到空結果後恢復探索**：開啟 `?q=規劃旅行&scenario=工作#explore` → 顯示 `顯示 0 / 527 筆收錄`，點選第一顆建議「移除使用情境「工作」 → 查看 1 筆」→ 恢復顯示 `顯示 1 / 527 筆收錄` 且保留搜尋詞 `規劃旅行`。
  3. **開啟分享的詳情連結，判讀證據、查看來源並返回探索**：開啟 `?q=語音&case=UC-336#explore` → 第一屏顯示 `成果主張：社群作者／專案實踐者` 與 `核讀：本庫未獨立重現`，展開原始研究可見頁首證據狀態完整涵蓋 `S-336A`、`S-336B`、`S-336C`；按 `Escape` 關閉後焦點回到 `#results-count`，保留 `顯示 88 / 527 筆收錄` 與搜尋詞 `語音`。

## 獨立審查（未參與實作）與補強

- 由獨立 subagent（`IndependentR7Reviewer`，`reviewer` 角色，未參與本輪主要實作）審閱 15 個案例頁修改、測試與 QA 紀錄：
  - **初審與複審發現（P2 / P3）**：
    1. `tests/review-date-keys.test.cjs` 先前只用 `.match()` 取第一筆 `本次增補查證`，若單頁出現多行 `本次增補查證` 將受行序影響。
    2. `tests/evidence-status-consistency.test.cjs` 需完整驗證 `UC-089`（`S-089A`～`E`）、`UC-336`（`S-336A`～`C`）、`UC-351`（`來源A`～`G`）、`UC-359`（`來源A`～`C`）的全部來源代號，避免刪減至單一代號時跳過比對。
    3. `tests/published-version.test.cjs` 應驗證 `fs.mkdirSync('qa-artifacts', { recursive: true })` 緊接在寫入 `qa-artifacts/published-version.json` 之前。
  - **修正結果**：已全數補強於上述 3 個測試檔並重跑通過。

## 下一輪最值得處理的一件事

- **盤點 `assets/app.js` 的 `declaredEvidenceClassesOfClause()` 對中文次要證據宣告與括號說明的識別**：
  - 本輪全庫掃描發現：`declaredEvidenceClassesOfClause()` 目前只檢查英文 `\bdesigned\b` 與無文字括號的 `unverified`，使以中文宣告「下方提示詞為本庫原創設計，未測」的案例（如 `UC-036`、`UC-062`、`UC-073`、`UC-109`、`UC-111`、`UC-318`～`341`）及帶括號說明的 `unverified（官方規則頁本次被擋未讀）`（`UC-060`）、`pending-verification`（`UC-086`）未在 `proofClasses` 呈現次要類別。下一輪先於隔離環境量化影響筆數並驗證卡片與詳情頁第一屏呈現。
