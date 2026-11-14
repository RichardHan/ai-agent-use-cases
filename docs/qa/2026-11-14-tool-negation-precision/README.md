# 2026-11-14 提及工具精準化：排除範圍免責／否定句、純去重對照與站內相對連結檔名的誤判

## 基準與環境

- 基準 `origin/main`：`370885d81af7d2063f7548c6fdbe6587b01f104f`（PR #390）。隔離 worktree `/Users/richard_han/orca/wt/aiuc-20261114-r5`（分支 `improve/20261114-r5`）；原工作樹 `/Users/richard_han/orca/ai-agent-use-cases`（`90093d7b`，含 159 個未追蹤檔案）及其他既有 worktrees 完整保留、未做任何 reset 或改動。
- 正式站：https://richardhan.github.io/ai-agent-use-cases/ 。開工時 `catalog.json.sourceRevision` 與 `corpus.json.sourceRevision` 皆為 `370885d8…`，524 個來源檔、527 筆條目（520 個主要案例頁＋3 篇經驗與踩坑＋2 個未處理待查線索＋2 個已併入待查線索）；網站條目數與合格真實案例數（420 案中 370 案合格）分開計算。
- 基準測試：`node --test tests/*.test.cjs` **748 通過、0 失敗**；`node --check assets/app.js`、`node --check assets/reader.js`、`node scripts/check-published-surface.cjs`（830 檔、5.81 MiB）通過。
- Actions 現況重新確認：`main` 最近 `370885d8` 的 `pages build and deployment` [43560663528](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43560663528)（耗時 1m04s）與 `Website QA` [43560664135](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43560664135)（耗時 11m49s）皆為 `success`，2026-11-12 至 2026-11-14 無任何失敗 run，無活躍 CI 或部署阻塞。
- 模型與環境揭露：主整合者實際執行模型為 `factory-droid/gemini-4-argon`；`cfg://task/perCallModel` 為 `"off"`、`cfg://modelRoles` 的 `task` 為 `litellm/deepseek-v4-flash-0731-gmi-ray`，未宣稱已切換為 `gpt-6.1-terra` 或 `gemini3.8:high flash`。

## 問題證據與目標使用者

目標使用者是**透過卡片第一行（`UC-xxx · 工具`）判斷案例用了什麼工具，或使用篩選面板「提及工具」（`?tool=`）與關鍵字尋找特定工具案例的訪客**（接續 `SITE.md` 上一輪留下的首要待辦）。

正式站（`370885d8`）與本機預覽（1440×900、390×844、320×740）實測確認：`assets/app.js:1242` 先前僅以 `withoutSourceUrls(markdown)` 去除外部 `http(s)://` 網址後就對全文無語境比對 `TOOL_PATTERNS`，導致三類明確「**不是本案使用的工具**」的文字被掛上卡片第一行與 `?tool=` 篩選：

1. **範圍免責與否定句**：
   - `UC-526`、`UC-527`、`UC-528` 頁首 `- 工具：` 僅宣告 `Meta Muse`（與 Git／GitHub 等），限制段寫有「本案只涉及 Meta Muse；不推定 Grok Bot 或 ChatGPT dots…」，正式站卡片第一行卻印出 `UC-526 · Grok Bot / Meta Muse`（因 `Grok Bot` 在 `TOOL_PATTERNS` 排第一，反客為主），且同時被收入 `?tool=Grok Bot` 與 `?tool=ChatGPT dots`。
   - `UC-519` 頁首宣告僅用 `ChatGPT dots`（內文另短暫對照試用 `Muse`），因限制段寫「不推定 Grok Bot 或 Meta Muse 有相同的清除或上限行為」，卡片第一行竟顯示 `UC-519 · Grok Bot / Meta Muse`（主角 `ChatGPT dots` 被擠出前兩名而從卡片消失）。
   - `UC-336` 頁首宣告 `Grok Bot`，因內文寫「作者說不需要 Muse，App 是用 Grok Bot 本身做出來的」，卡片第一行變成 `UC-336 · Grok Bot / Meta Muse`。
2. **純去重段落與跨案例差異對照句**：
   - `## 去重與版本紀錄`、`## 前批去重判斷` 以及 `- 不同於 UC-xxx…` 描述的是**被排除的其他案例**所用的工具，卻讓 `UC-351`、`UC-353`、`UC-403` 因「不同於 UC-061（…Cursor…）」被誤掛 `Cursor`，`UC-077`、`UC-322`、`UC-332` 因「不同於 UC-006（Facebook…）」被誤掛 `Facebook`，`UC-338` 因「不同於 UC-280（…Notion…dots…）」被誤掛 `ChatGPT dots` 與 `Notion`。
3. **站內相對 Markdown 連結檔名**：
   - `MARKDOWN_LINK_DESTINATION`（`assets/app.js:254`）只剝除 `https?://` 與 `www.`，未剝除站內相對連結（如 `[UC-006](006-facebook-publication.md)`、`[UC-381](381-dots-daily-ai-brief-to-archived-news-page.md)`），使檔名中的 `-facebook-`、`-dots-`、`-muse-` 命中 `\bfacebook\b`、`\bdots\b`、`\bmuse\b`，導致 `UC-042`、`UC-409`、`UC-463` 僅因連結到 `006-facebook-publication.md` 就被掛上 `Facebook`。

## 兩個可行方案與取捨

- **方案 A（採用）：在 `assets/app.js` 新增線性時間 `withoutDisclaimedTools(markdown)`，排除站內相對連結目標、純去重段落、跨案「不同於 UC-xxx」對照句與範圍免責／否定子句後再比對 `TOOL_PATTERNS`，並同步更新篩選說明與 `README.md`。**
  - 價值：
    - 全庫 527 筆條目中精準修正 **120 筆條目**的假陽性工具標記，且 **0 筆**遺失頁首 `- 工具：` 宣告的受支援工具、**0 筆**因修正而變成無工具。
    - 完整保留多來源合併案例在補充段落實際使用的工具（例如 `UC-005` 補充段落的 `ChatGPT dots`／`Meta Muse`、`UC-076` 的 `Meta Muse` 實測補充、`UC-083` 的 `dots` 補充、`UC-499` 正文路由規則的 `Facebook`），且對無 `- 工具：` 欄位的舊案例（74 筆）同樣有效。
    - 全庫 524 個來源檔執行 `withoutDisclaimedTools()` 總耗時僅 ~18ms，實作門檻（`difficulty`／`difficultySource`）、證據分類（`proof`／`proofClasses`／`relayedProof`）、核對日（`reviewedDate`）100% 零變動。
  - 成本：僅修改 `assets/app.js`、`README.md`、`tests/tool-mention-fidelity.test.cjs`。
- **方案 B（不採用）：改為只讀取頁首 `- 工具：` 宣告行產生 `item.tools`。**
  - 成本與風險：全庫 527 筆中有 74 筆條目無 `- 工具：` 欄位（將失去所有工具標籤），且多來源合併案例（如 `UC-005`、`UC-051`、`UC-077`、`UC-083`、`UC-349`）在 `## 補充` 段落實際使用的第二工具會被漏掉；此外 `UC-465` 的 `- 工具：` 行本身也帶有「不推定 Muse 或 dots…」，仍需排除否定子句。

本輪不處理範圍：頁首 `- 工具：` 長尾自由文字工具名稱的正規化收斂表、`extractDifficulty()` 的 `toolsForDifficulty` 推測輸入（維持既有分離）、以及閱讀器 `selectCopySections` 對非 `可複製提示詞／可貼指令` 開頭子標題的複製按鈕擴充（留作下一輪獨立主題）。

## 修改前後實測對照（全庫 527 筆掃描＋Chromium 三視口）

### 1. 各工具篩選選項筆數變化（527 筆條目）

| 工具 | 修改前 (`370885d8`) | 修改後（本輪） | 差異（移除假陽性） | 代表性修正案例 |
| --- | ---: | ---: | ---: | --- |
| `Grok Bot` | 415 | **380** | −35 | `UC-526`、`UC-527`、`UC-528`、`UC-514`、`UC-516`、`UC-518`、`UC-519` |
| `Meta Muse` | 211 | **145** | −66 | `UC-336`、`UC-515`、`UC-517`、`UC-520`、`UC-523`、`UC-524`、`UC-525` |
| `ChatGPT dots` | 222 | **137** | −85 | `UC-514`～`518`、`UC-520`～`528`、`UC-066`、`UC-338` |
| `Facebook` | 14 | **8** | −6 | `UC-042`、`UC-077`、`UC-322`、`UC-332`、`UC-409`、`UC-463` |
| `Cursor` | 46 | **43** | −3 | `UC-351`、`UC-353`、`UC-403`（僅在「不同於 UC-061／390」提及） |
| `GitHub` | 90 | **87** | −3 | `UC-068`、`UC-077`、`UC-475`（僅在「不同於 UC-005／057／070」提及） |
| `Notion` | 34 | **33** | −1 | `UC-338`（僅在「不同於 UC-280」提及） |
| `Google Drive` / `Google Sheets` / `Haggle Bot` | 32 / 6 / 2 | **32 / 6 / 2** | 0 | 不變 |

### 2. 卡片第一行與版面幾何對照（1440×900、390×844、320×740）

| 狀態 | 視口 | 修改前卡片第一行 (`370885d8`) | 修改後卡片第一行（本輪） | 卡片高度 (`before → after`) | 水平溢出 / `pageerror` / axe |
| --- | --- | --- | --- | --- | --- |
| `?q=UC-526#explore` | 1440 / 390 / 320 | `UC-526 · Grok Bot / Meta Muse` | **`UC-526 · Meta Muse`** | 1440: `692→692`<br>390: `710→710`<br>320: `758→729`（少折一行） | `false` / `0` / `0` |
| `?q=UC-519#explore` | 1440 / 390 / 320 | `UC-519 · Grok Bot / Meta Muse` | **`UC-519 · Meta Muse / ChatGPT dots`** | 1440: `681→682`<br>390: `711→711`<br>320: `758→758` | `false` / `0` / `0` |
| `?q=UC-336#explore` | 1440 / 390 / 320 | `UC-336 · Grok Bot / Meta Muse` | **`UC-336 · Grok Bot`** | 1440: `626→626`<br>390: `622→622`<br>320: `673→644`（少折一行） | `false` / `0` / `0` |
| `#explore`（篩選展開） | 1440 / 390 / 320 | 工具選項含假陽性筆數 | 工具選項顯示修正後筆數＋免責排除說明 | 1440: `533→533`<br>390: `531→531`<br>320: `520→520` | `false` / `0` / `0` |

- 量測數據檔案：[before-measurements.json](before-measurements.json) ／ [after-measurements.json](after-measurements.json)
- 前後截圖（同頁、同尺寸、同資料狀態）：
  - `before-{desktop,phone,small}-{uc526,uc519,uc336,filters}.png`
  - `after-{desktop,phone,small}-{uc526,uc519,uc336,filters}.png`
  （註：本執行環境設定 `images.blockImages: true`，視覺結論依 DOM 文字、bounding box 幾何與 axe 自動化檢測得出，不宣稱人工肉眼檢視截圖。）

## 測試與三情境驗收

### 1. 先紅後綠回歸與全套測試

```sh
node --test tests/tool-mention-fidelity.test.cjs
node --test tests/*.test.cjs
node --check assets/app.js
python3 scripts/preview.py /tmp/aiuc-20261114-r5-after/ai-agent-use-cases
python3 scripts/check_corpus_bundle.py /tmp/aiuc-20261114-r5-after/ai-agent-use-cases
node scripts/check-published-surface.cjs
```

- **單元先紅後綠**：擴充 `tests/tool-mention-fidelity.test.cjs` 對基準 `370885d8` 執行，6 項中有 **3 項失敗**（見 [red-unit.txt](red-unit.txt)）；套用修正後 **6 項全數通過**（見 [green-unit.txt](green-unit.txt)）。
- **全套單元測試**：`node --test tests/*.test.cjs` 由基準 748 項增至 **750 通過、0 失敗**。
- **瀏覽器回歸套件**：`result-count-honesty-browser.cjs`、`results-batching-browser.cjs`、`evidence-attribution-browser.cjs`、`arrival-summary-visibility-browser.cjs`、`combined-recovery-browser.cjs` 全數通過（見 [green-browser.txt](green-browser.txt)）。

### 2. 三種訪客情境實走（1440×900 桌面／390×844 手機）

1. **新訪客不知道工具名稱，從問題找到適用案例**：首頁點選「會議整理」→ 抵達 `#explore` 顯示 `顯示 29 / 527 筆收錄`，首張卡片為「自己不能到的會議，讓 Bot 進去先說明身分再記筆記」，底部批次控制標示 `已顯示 24 / 29 筆 · 再看 5 筆（尚有 5 筆）`。
2. **組合搜尋與篩選遇到空結果後恢復探索**：開啟 `?q=規劃旅行&scenario=工作#explore` → 顯示 `顯示 0 / 527 筆收錄`，點選第一顆建議「移除使用情境「工作」 → 查看 1 筆」→ 恢復顯示 `顯示 1 / 527 筆收錄` 且保留搜尋詞 `規劃旅行`。
3. **開啟分享的詳情連結，判讀證據、查看來源並返回探索**：開啟 `?q=弱點&case=UC-526#explore` → 第一屏顯示 `成果主張：社群作者／專案實踐者` 與 `核讀：本庫未獨立重現`，原始來源連結指向固定 commit `370885d8…/cases/526-muse-daily-software-inventory-cve-match-include-watcher-itself.md`；按 `Escape` 關閉後焦點回到 `#results-count`，保留 `顯示 220 / 527 筆收錄`，且首張卡片第一行正確顯示 `UC-526 · Meta Muse`（不再誤列 `Grok Bot`）。

## 獨立審查（未參與實作）與補強

- 由獨立 subagent（`IndependentRoundReviewer`，`reviewer` 角色，未參與本輪主要實作）審閱 `assets/app.js`、`README.md`、`tests/tool-mention-fidelity.test.cjs`、QA 量測與 `SITE.md`：
  - **初審（NEEDS FIXES，Priority 2）**：
    1. 指出 `tests/tool-mention-fidelity.test.cjs` 對 `/不推定/` 的斷言原本檢查整份 `assets/app.js`，因 `DISCLAIMED_TOOL_CLAUSE` 常數本身含 `不推定`，即使 `renderFacetCounts()` 內的 `toolHint` 退回舊文案測試仍會通過。
    2. 同時檢視逗號分隔的混合肯定／免責子句（如 `UC-525`「本案只涉及 Grok Bot，不推定 Meta Muse 或 ChatGPT dots…」），確認若未宣告頁首 `- 工具：` 時僅以 `[。；;\n]` 切分會連帶過濾逗號前的肯定子句。
  - **修正與補強**：
    1. 於 `tests/tool-mention-fidelity.test.cjs` 直接擷取 `renderFacetCounts` 內的 `toolHint` 字串常數，對 `toolHint` 本身斷言 `/提及工具只看/`、`/不推定/` 與 `/去重/`。
    2. 於 `assets/app.js` 的 `withoutDisclaimedTools()` 將子句切分擴充為 `/[，,。；;\n]/`（並將 `只是作者推測` 放寬為 `只是(?:作者)?推測` 及補齊 `的本機連線機制不同|另一則貼文談的是|與本案工具不同`），且於 `tests/tool-mention-fidelity.test.cjs` 以無 `- 工具：` 宣告的混合逗號句驗證肯定工具保留、否定工具剔除。
  - **PR #391 首次 CI 診斷與 `syncDiscovery()` 視窗位移防護（複審 APPROVE）**：
    - 首輪 PR #391（`596a53bc`）16 項檢查中 15 項通過，`Website QA` [43565297972](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43565297972) 於 `tests/refine-from-results-browser.cjs:107`（`phone` 390×844）失敗。下載該 run 產物 `14102746041` 的 `report.json` 確認：當 `.hero-search-link` 捲動至 `#explore` 後輸入 `安全防護` 時，`syncDiscovery()` 因初始隨機抽卡不在 `安全防護` 池中而呼叫 `drawNext()` 替換 `#explore` 上方的 `#drawn-case`；當新抽出的卡片比初始卡片短 212px（`noticeBottom: 830 → 618`）且瀏覽器未對 `#explore` 做 scroll anchoring 時，`#query.bottom` 被上拉至 `+21px`，後續 `scrollBy(0, 700)`（展開 `#refine-query` 觸發 `+35px` 錨定補償）與 `scrollBy(0, -700)` 使 `#query.bottom` 落於 `-14px <= 0`。
    - 於 `syncDiscovery()`（`assets/app.js:4833, 4852-4855`）比照 `drawFromButton()`，當 `window.scrollY > 0` 且焦點不在 `#discover` 內時記錄更新前的 `#explore.getBoundingClientRect().top` 並同步以 `window.scrollBy({top: shift, behavior: 'instant'})` 抵銷上方抽卡高度差。獨立審查員初審指出若在 `keepSearchRevealed()` 加入 `page.top < 0` 會干擾 600ms 視窗內的鍵盤／程式捲動，已維持 `keepSearchRevealed()` 原判準不變、僅保留 `syncDiscovery()` 同步補償，複審裁決 **APPROVE**（`overall_correctness: correct`, `confidence: 0.95`）。

## 發布紀錄

（待 PR 檢查、合併與 Pages 部署完成後記錄）

## 下一輪最值得處理的一件事

- **對齊閱讀器「可複製提示詞」按鈕與閱讀導覽的提示詞標題識別（`assets/reader.js:143-147`）**：
  - 本輪調查確認：詳情頁閱讀導覽（`assets/reader.js:29`）將所有含 `/提示詞|可貼指令/` 的標題視為提示詞段落（如 `UC-016` 的 `### 原創提示詞（未實測，可修改後貼上）`、`UC-023` 的 `### 原創提示詞｜UNTESTED`、以及 `建議試法與可貼指令` 等共 24 篇案例），但 `selectCopySections()`（`assets/reader.js:145`）卻只對以 `^(?:可複製提示詞|可貼指令)` 開頭的標題注入「複製本段」按鈕，導致同一頁兩個提示詞區塊一個可複製、一個沒有複製按鈕。
  - 下一輪先掃描全庫 524 個來源檔的所有章節標題，比對 `selectCopySections()` 擴充前後的段落清單（同時確保排除 `原始提示詞的限制` 等非指令段落），再補齊單元與瀏覽器回歸測試。
