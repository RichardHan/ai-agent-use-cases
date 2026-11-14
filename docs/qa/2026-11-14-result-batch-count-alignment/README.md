# 2026-11-14 結果列與批次控制筆數對齊：在批次按鈕標明「已顯示 X / Y 筆」並防護窄視口換行

## 基準與環境

- 基準 `origin/main`：`154702819cc8b18137a83f57afd756fa79cf7d4b`（PR #389）。隔離 worktree `/Users/richard_han/orca/wt/aiuc-20261114-r4`（分支 `improve/20261114-r4`）；原工作樹 `/Users/richard_han/orca/ai-agent-use-cases`（`90093d7b`，含 159 個未追蹤檔案）及其他既有 worktrees 完整保留、未做任何 reset 或改動。
- 正式站：https://richardhan.github.io/ai-agent-use-cases/ 。開工時 `catalog.json.sourceRevision` 與 `corpus.json.sourceRevision` 皆為 `15470281…`，524 個來源檔、527 筆條目（520 個主要案例頁＋3 篇經驗與踩坑＋2 個未處理待查線索＋2 個已併入待查線索）；網站條目數與合格真實案例數（420 案）分開計算。
- 基準測試：`node --test tests/*.test.cjs` **744 通過、0 失敗**；`node --check assets/app.js`、`node --check assets/reader.js`、`node scripts/check-published-surface.cjs`（830 檔、5.81 MiB）通過。
- Actions 現況重新確認：`main` 最近 `15470281` 的 `pages build and deployment` [43540237508](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43540237508)（耗時 1m6s）與 `Website QA` [43540238047](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43540238047)（耗時 19m11s）皆為 `success`，無活躍 CI 或部署阻塞。
- 模型與環境揭露：主整合者實際執行模型為 `factory-droid/gemini-4-argon`；`cfg://modelRoles` 的 `task` 為 `litellm/deepseek-v4-flash-0731-gmi-ray`，未宣稱已切換為 `gpt-6.1-terra` 或 `gemini3.8:high flash`。

## 問題證據與目標使用者

目標使用者是**在首頁或搜尋超過 24 筆結果時，瀏覽案例清單並透過底部「再看更多結果」分批展開的訪客**（接續 `SITE.md` 2026-11-11 與 2026-11-14 連續三輪紀錄的首要待辦）。

正式站與本機預覽（1440×900、390×844、320×740）實測確認：
1. `render()`（`assets/app.js:3895, 3911`）在 `#results-count` 輸出符合總數 `顯示 527 / 527 筆收錄`（搜尋「旅遊」為 `顯示 36 / 527 筆收錄`），但 `#results` 僅渲染第一批 `RESULT_BATCH_SIZE`（24）張卡片。
2. 滑到第 24 張卡片底部時，`updateResultBatch()`（`assets/app.js:2547-2554`）在 `#load-more-results` 只顯示 `再看 24 筆（尚有 503 筆）`（搜尋「旅遊」為 `再看 12 筆（尚有 12 筆）`）。
3. 畫面上同時出現 `527`（符合筆數）、`24`（下一批筆數）、`503`（未顯示餘數），卻**沒有任何一處文字寫出目前畫面實際已渲染的 `24` 筆（或展開第二批後的 `48` 筆）**，導致結果列宣告的 `顯示 527` 與底部 `尚有 503 筆` 缺乏直接對應。

## 兩個可行方案與取捨

- **方案 A（採用）：在批次控制 `#load-more-results` 標明 `已顯示 ${shown} / ${total} 筆 · 再看 ${next} 筆（尚有 ${remaining} 筆）`，並補齊窄視口換行樣式。**
  - 做法：
    1. 於 `updateResultBatch()`（`assets/app.js:2551-2555`）以 `total = currentFiltered.length`、`shown = Math.min(visibleResults, total)`、`remaining = Math.max(0, total - shown)` 輸出 `已顯示 ${shown} / ${total} 筆 · 再看 ${Math.min(RESULT_BATCH_SIZE, remaining)} 筆（尚有 ${remaining} 筆）`；當 `remaining === 0`（結果 ≤ 24 筆或已全部展開）時維持隱藏並清空文字。
    2. 於 `assets/style.css:399` 的 `.result-batch-actions button` 加入 `max-width:100%;line-height:1.5;text-align:center;white-space:normal;overflow-wrap:anywhere`，確保 320×740 窄視口下自動換行、不產生水平溢出。
  - 價值：
    - 在訪客實際遇到分批邊界的位置，以 `#results-count` 的同一個符合總數 `total` 為分母，直接閉合 `已顯示 24 / 527 筆 · 再看 24 筆（尚有 503 筆）`（`24 + 503 = 527`），且每展開一批即時更新已顯示進度（`24 → 48 → 72…`）。
    - **零首屏幾何成本**：`#results-count` 維持原長度與單行高度，不壓縮手機首屏（`firstResultFromSearch < 300px` 與 `arrival-summary-visibility-browser.cjs` 首張卡片標題可見預算）。
    - **零額外 live-region 干擾**：點擊批次按鈕展開時，焦點依既有契約移至新增批次首張卡片標題（`firstTitle.focus()`），不會因改寫 `#results-count`（`aria-live="polite"`）而搶走螢幕閱讀器報讀。
- **方案 B（不採用）：改寫 `#results-count` 為 `顯示 527 / 527 筆收錄（已顯示前 24 筆）` 或 `顯示前 24 / 527 筆收錄`。**
  - 成本與取捨：
    - 在 390px／320px 手機視口會使 `.results-heading` 多換一行（+22px），壓縮首屏卡片可見高度，且在部分來源未載入時會疊加雙括號 `顯示 316 / 316 筆收錄（1 個來源檔案未載入）（已顯示前 24 筆）`。
    - 每次展開批次若改寫 `#results-count` 會觸發多餘的 `aria-live="polite"` 報讀。
    - 會破壞 `hero-load-failure-browser.cjs:85`、`filter-reading-browser.cjs:32`、`source-guide-browser.cjs:77` 等精確字串斷言（若改前綴更會影響 14+ 支解析 `/^顯示 (\d+) \//` 的測試）。

本輪不處理範圍：今日研究批次（`110b7dcf`）中 `UC-336` 否定句「不需要 Muse」觸發提及工具、`UC-066` 未宣告實作門檻被推測為進階開發及頁首增補查證日字面同步（留作下一輪內容與工具精準度專題，避免混入跨主題變更）。

## 修改前後實測對照（Chromium 1440×900、390×844、320×740）

| 狀態 | 視口 | `#results-count` | 畫面卡片數 | 修改前 `#load-more-results` (`15470281`) | 修改後 `#load-more-results`（本輪） | 按鈕尺寸 (`width × height`) | 水平溢出 / axe |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 首頁第 1 批 (`home-batch1`) | 1440×900 / 390×844 / 320×740 | `顯示 527 / 527 筆收錄` | 24 | `再看 24 筆（尚有 503 筆）` | **`已顯示 24 / 527 筆 · 再看 24 筆（尚有 503 筆）`** | 1440/390: `348×44`<br>320: `288×64`（自動換行） | `false` / `0` |
| 首頁第 2 批 (`home-batch2`) | 1440×900 / 390×844 / 320×740 | `顯示 527 / 527 筆收錄` | 48 | `再看 24 筆（尚有 479 筆）` | **`已顯示 48 / 527 筆 · 再看 24 筆（尚有 479 筆）`** | 1440/390: `348×44`<br>320: `288×64`（自動換行） | `false` / `0` |
| 搜尋「旅遊」第 1 批 (`travel-batch1`) | 1440×900 / 390×844 / 320×740 | `顯示 36 / 527 筆收錄` | 24 | `再看 12 筆（尚有 12 筆）` | **`已顯示 24 / 36 筆 · 再看 12 筆（尚有 12 筆）`** | 1440/390: `326×44`<br>320: `288×64`（自動換行） | `false` / `0` |

- 量測數據檔案：[before-measurements.json](before-measurements.json) ／ [after-measurements.json](after-measurements.json)
- 前後截圖（同頁、同尺寸、同資料狀態）：
  - `before-{desktop,phone,small}-{home-batch1,home-batch2,travel-batch1}.png`
  - `after-{desktop,phone,small}-{home-batch1,home-batch2,travel-batch1}.png`

## 測試與三情境驗收

### 1. 先紅後綠回歸與全套測試

```sh
node --test tests/result-batch-honesty.test.cjs
node --test tests/*.test.cjs
node --check assets/app.js
python3 scripts/preview.py /tmp/aiuc-20261114-r4-after/ai-agent-use-cases
python3 scripts/check_corpus_bundle.py /tmp/aiuc-20261114-r4-after/ai-agent-use-cases
VERIFY_URL=http://127.0.0.1:8125/ai-agent-use-cases/ node tests/result-count-honesty-browser.cjs
BATCH_ALL_BROWSERS=1 ROUND_URL=http://127.0.0.1:8125/ai-agent-use-cases/ node tests/results-batching-browser.cjs
ARRIVAL_URL=http://127.0.0.1:8125/ai-agent-use-cases/ node tests/arrival-summary-visibility-browser.cjs
RETURN_URL=http://127.0.0.1:8126/ai-agent-use-cases/ RETURN_OBSERVE=1 node tests/results-return-browser.cjs
RECOVERY_URL=http://127.0.0.1:8126/ai-agent-use-cases/ OBSERVE=1 node tests/combined-recovery-browser.cjs
node scripts/check-published-surface.cjs
```

- **單元先紅後綠**：新增 `tests/result-batch-honesty.test.cjs` 對基準 `15470281` 執行，4 項中有 **3 項失敗**（見 [red-unit.txt](red-unit.txt)）；套用修正後 **4 項全數通過**（見 [green-unit.txt](green-unit.txt)）。
- **瀏覽器先紅後綠**：`tests/result-count-honesty-browser.cjs` 對基準預覽失敗（`actual: '再看 24 筆（尚有 301 筆）'`, `expected: '已顯示 24 / 325 筆 · 再看 24 筆（尚有 301 筆）'`，見 [red-browser.txt](red-browser.txt)）；套用修正後於 desktop／phone 全數通過（見 [green-browser.txt](green-browser.txt)）。
- **全套單元測試**：`node --test tests/*.test.cjs` 由基準 744 項增至 **748 通過、0 失敗**。
- **跨引擎瀏覽器回歸**：`BATCH_ALL_BROWSERS=1 node tests/results-batching-browser.cjs` 於 Chromium（1440／390／320）、Firefox（390）、WebKit（390）五種配置全數通過；`arrival-summary-visibility-browser.cjs`、`results-return-browser.cjs`（手機 `firstResultFromSearch = 252.19px < 300px`）、`combined-recovery-browser.cjs` 全數通過。

### 2. 三種訪客情境實走（1440×900 桌面／390×844 手機）

1. **新訪客不知道工具名稱，從問題找到適用案例**：首頁點選「會議整理」→ 抵達 `#explore` 顯示 `顯示 29 / 527 筆收錄`，首張卡片為「自己不能到的會議，讓 Bot 進去先說明身分再記筆記」，底部批次控制清楚標示 `已顯示 24 / 29 筆 · 再看 5 筆（尚有 5 筆）`。
2. **組合搜尋與篩選遇到空結果後恢復探索**：開啟 `?q=規劃旅行&scenario=工作#explore` → 顯示 `顯示 0 / 527 筆收錄`（批次按鈕隱藏），點選第一顆建議「移除使用情境「工作」 → 查看 1 筆」→ 恢復顯示 `顯示 1 / 527 筆收錄` 且保留搜尋詞 `規劃旅行`。
3. **開啟分享的詳情連結，判讀證據、查看來源並返回探索**：開啟 `?q=旅遊&case=UC-001#explore` → 顯示成果主張與核讀摘要，原始來源連結指向固定 commit `15470281…/cases/001-travel-checkout.md`；按 `Escape` 關閉後焦點回到 `#results-count`，保留 `顯示 36 / 527 筆收錄`、搜尋詞 `旅遊`，且底部批次按鈕顯示 `已顯示 24 / 36 筆 · 再看 12 筆（尚有 12 筆）`。


## 獨立審查（未參與實作）與補強

- 由獨立 subagent（`IndependentRoundReviewer`，`reviewer` 角色，未參與本輪主要實作）審閱 `assets/app.js`、`assets/style.css`、`tests/`、QA 量測與 `SITE.md`：
  - **裁決**：**APPROVE**（`overall_correctness: correct`，無阻斷缺陷）。
  - **審查重點**：確認 `resultCards()`、`showMoreResults()`、`ensureVisibleResult()`、`updateResultBatch()`、`render()` 與 `popstate` 在空結果、≤24 筆、最後一批不足 24 筆、縮小搜尋詞及直達較後案例路徑下的 `shown`、`total`、`remaining` 與實際卡片數完全一致；320px／390px／1440px 觸控高度（≥44px）、鍵盤焦點、零水平溢出、零 axe 違規及 GitHub Pages 發布面合規。
  - **非阻斷測試覆蓋註記與補強**：審查員指出 `tests/results-batching-browser.cjs` 雖驗證了 `popstate`（`goBack`／`goForward`）還原後的卡片數，但可一併直接斷言還原後的 `#load-more-results` 按鈕文字；已於 `tests/results-batching-browser.cjs` 補上 `goForward()`（24 筆）與詳情 `goBack()`（展開後 48 筆）兩處 `popstate` 批次按鈕文字斷言並重跑五種瀏覽器配置通過。
## 下一輪最值得處理的一件事

- **排除否定句／比較免責句對「提及工具」標籤與篩選的誤判，並補齊 UC-066／UC-336 頁首欄位同步**：
  1. 本輪調查確認：今日新增的 `UC-526`、`UC-527`、`UC-528` 在限制段寫有「本案只涉及 Meta Muse；不推定 Grok Bot 或 ChatGPT dots…」，以及 `UC-336` 寫有「作者說不需要 Muse」，因 `TOOL_PATTERNS` 對 `withoutSourceUrls(markdown)` 做無語境比對，導致 `UC-526`／`527`／`528` 被誤掛上 `Grok Bot` 與 `ChatGPT dots`、`UC-336` 被誤掛上 `Meta Muse`。
  2. 同時核對 `UC-066` 補宣告 `- 實作門檻：入門對話` 與同步第 3 行 `- 本次增補查證：2026-11-14 09:00（台灣時間）；只核S-066P，未重驗全案。`。
  3. 下一輪先做全庫掃描：比對每篇案例的 `- 工具：` 宣告與正文「不推定／不需要／不涉及」免責句，量化排除否定句前後的 `?tool=` 筆數變化。
