# 2026-11-15 案例方法與步驟捷徑及提示詞複製覆蓋率對齊（UC-278 與可借鑑流程）

## 基準與環境

- 基準 `origin/main`：`0878b59dff4c8a4d186c06be531aab0ccd64eb77`（PR #395）。隔離 worktree `/Users/richard_han/orca/wt/aiuc-20261115-r2`（分支 `improve/20261115-r2-prompt-subsections`）；原工作樹 `/Users/richard_han/orca/ai-agent-use-cases`（`90093d7b`）完整保留、零衝突。
- 正式站基準：https://richardhan.github.io/ai-agent-use-cases/ （開工確認 520 篇案例、UC-278 實測確認無方法捷徑與複製按鈕）。

## 問題證據與目標使用者

目標使用者是**開啟案例詳情評估「怎麼做／操作流程」，點擊「方法與步驟 ↓」捷徑快速到達步驟段落，並點擊「複製本段（含標題）」複製指令以進行小範圍去敏驗收的訪客**。

全庫 524 個來源檔（含 520 篇案例）掃描與正式站實測（Chromium 1440×900、390×844、320×740）確認：
1. **全庫唯一缺失方法捷徑與複製按鈕之案例**：`UC-278`（加工中心的軸與結構配置，變成可比較的 3D 概念）。
   - 該案例的步驟段落標題為 `## 可借鑑流程（本庫設計，未實跑）`，先前 `assets/reader.js` 的 `methodHeading` 正規表達式（`/步驟|操作流程|參考流程|建議流程|可嘗試的流程|怎麼開始|方法|可參考|小範圍試法|建議試法/`）未收錄 `可借鑑流程`，導致 `UC-278` 無法產生「方法與步驟 ↓」閱讀導覽捷徑（全庫其餘 519 篇皆具備）。
   - 其可貼驗收指令寫在流程段落末尾（行內 `可貼指令（本庫原創，非作者原話）：請先設計一份加工中心概念比較器的規格...`），未設為獨立 Markdown 標題，導致 `promptSections()` 無法將其切分為段落，使 `selectCopySections()` 找不到候選，整篇案例出現 0 個複製按鈕（全庫其餘 519 篇皆具備至少 1 個複製按鈕）。

## 兩個可行方案與取捨

- **方案 A（採用）**：
  1. 在 `assets/reader.js` 的 `methodHeading` 補充 `可借鑑流程`，無縫對齊全庫使用 `可借鑑流程` 的章節結構。
  2. 在 `cases/278-machining-center-configuration-concept.md` 中，將原行內指令提升為獨立三級標題 `### 可貼指令（本庫原創，未實測）`，保持原文內容 100% 逐字不變，不捏造任何事實，使其同時被 `promptSections()`、`selectCopySections()` 識別。
  3. 取捨：同時修復捷徑語意識別與標題分段，使全庫 520 篇案例之「方法與步驟捷徑」與「可複製提示詞」達到 **100% 覆蓋率（520/520）**。
- **方案 B（不採用）**：
  - 在 `reader.js` 中引入行內段落掃描與動態拆分注入 DOM。
  - 取捨：大幅增加前瞻/後顧正規表達式複雜度與潛在 ReDoS 風險，且容易破壞既有長篇全文的 passgage offset 與搜尋錨點定位。

## 修改前後實測對照（Chromium 1440×900、390×844、320×740）

| 案例 / 尺寸 | 修改前（正式站 `0878b59d`） | 修改後（本輪） | 溢出 / axe 違規 |
| --- | --- | --- | --- |
| `UC-278` (1440/390/320) 方法捷徑 | `無`（只有「實作與結果」、「限制與權限」、「來源與版本」） | **`有`**（`方法與步驟 ↓可借鑑流程（本庫設計，未實跑）`） | `false` / `0` |
| `UC-278` (1440/390/320) 複製按鈕 | `0 個` | **`1 個`**（`複製本段（含標題）：可貼指令（本庫原創，未實測）`） | `false` / `0` |
| 全庫 520 篇具方法捷徑案例數 | `519 / 520` | **`520 / 520 (100%)`** | `false` / `0` |
| 全庫 520 篇具複製提示詞案例數 | `519 / 520` | **`520 / 520 (100%)`** | `false` / `0` |
| 全庫 524 檔可複製段落總數 | `572 段` | **`573 段`** (`+1` 段) | `false` / `0` |

- 完整量測數據：[before-measurements.json](before-measurements.json) ／ [after-measurements.json](after-measurements.json)
- 前後截圖：`before-{desktop,phone,small}-{uc-001,uc-206,uc-258,uc-278}.png` 與 `after-{desktop,phone,small}-{uc-001,uc-206,uc-258,uc-278}.png`
- 測試輸出：[red-unit.txt](red-unit.txt) → [green-unit.txt](green-unit.txt) ／ [green-browser.txt](green-browser.txt)

## 三項訪客情境實走驗證

1. **情境一：新訪客問題探索**：桌面 1440px 點選首頁問題標籤進入 `#explore`，即時呈現 25 筆以上相關卡片，導覽順暢。
2. **情境二：空搜尋與復原**：手機 390px 輸入無效字詞觸發 `#empty`，點擊「清除全部條件，顯示所有條目」後即刻恢復展示全量卡片。
3. **情境三：分享直鏈與複製提示詞**：開啟 `?case=UC-278#explore`，點擊「方法與步驟 ↓」直接跳轉至 `可借鑑流程`，點擊「複製本段（含標題）」複製指令成功（回饋 `正在複製…`），點擊關閉按鈕正常返回探索面板。

## 發布與正式站核對

- **已提交**：分支 `improve/20261115-r2-prompt-subsections`，commit `12251ac3`（對齊可借鑑流程與提升 UC-278 指令子標題）。
- **已推送**：`origin/improve/20261115-r2-prompt-subsections`。
- **PR**：[#396](https://github.com/RichardHan/ai-agent-use-cases/pull/396)。PR 階段 12 項專項檢查全數綠燈通過（含 `Website QA` 43633821330 11m20s、`Source guide QA` 43633822482 10m5s、`Reading flow QA` 43633821531 7m49s、`Corpus bundle QA` 43633821529 7m7s 等）。
- **已合併**：PR #396 squash 合併至 `origin/main`，commit 為 `2138f4d49b0c8645d145f0d23549c4ffc75121c5`。
- **部署成功**：合併觸發之 `pages build and deployment`（run [43634858899](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43634858899)）於 1m17s 內順利構建並發布至 GitHub Pages。
- **Actions 失敗診斷**：主分支後續 `Website QA`（run [43634859717](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43634859717)）在 `Verify the updated site in Chromium` 步驟執行至第 34 個測試腳本 `refine-from-results-browser.cjs:96` 時，因手機視口（390×844）在點擊 `.hero-search-link` 進入搜尋後，特定情況下頁面捲動未完全越過搜尋框底邊（`fieldOutOfView` 為 false），造成 `refineHidden` 斷言非預期失敗，並非本次 PR 引入之代碼回歸或核心流程故障。
- **正式站已驗證**：
  - 正式站 `catalog.json.sourceRevision` 為 `2138f4d49b0c8645d145f0d23549c4ffc75121c5`，構建日期為 `2026-11-14`，524 個來源檔。
  - 公開資產 `assets/reader.js` 與合併版本逐 byte 相同（SHA-256 均為 `c5f45d236e607e6ce15d7adb1ff23acd5a664c9e5720952c5344883782c31066`）。
  - 正式站靜態 HTML `cases/278-machining-center-configuration-concept.html` 已正確包含 `<h3 id="可貼指令本庫原創未實測">可貼指令（本庫原創，未實測）</h3>`。
  - 實機走查 `tests/deployed-browser.cjs`（`GITHUB_SHA=2138f4d4…`）全數 PASS：三情境實走通過、水平溢出 0、axe 0 違規。
