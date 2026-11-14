# 2026-11-14 詳情頁閱讀導覽捷徑邊界修正：排除日期補充、純來源標題與「本庫未實作」步驟誤判

## 基準與環境

- 基準 `origin/main`：`7533fe6315d46af39c38b4fef7ef14202ef7aba2`。隔離 worktree `/private/tmp/aiuc-20261114-r2`（分支 `improve/20261114-r2`）；原工作樹 `/Users/richard_han/orca/ai-agent-use-cases`（`90093d7b`，含 159 個未追蹤檔案）完整保留、未做任何 reset 或改動。
- 正式站：https://richardhan.github.io/ai-agent-use-cases/ 。開工時 `catalog.json.sourceRevision` 與 `corpus.json.sourceRevision` 皆為 `7533fe63…`，521 個來源檔、524 筆條目（517 個主要案例頁＋3 篇經驗與踩坑＋2 個未處理待查線索＋2 個已併入待查線索）；網站條目數與合格真實案例數分開計算。
- 基準測試：`node --test tests/*.test.cjs` **742 通過、0 失敗**；`node --check assets/app.js`、`node --check assets/reader.js`、`node scripts/check-published-surface.cjs`（826 檔）通過。
- Actions 現況重新確認：`main` 最近 20 次 run 全數 `success`（`7533fe63` 的 `pages build and deployment` [43534466103](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43534466103) 耗時 56s、`Website QA` [43534466606](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43534466606) 耗時 11m45s 皆 `success`），無活躍 CI 或部署阻塞。
- 模型與環境揭露：主整合者實際執行模型為 `factory-droid/gemini-4-argon`；`cfg://task/perCallModel` 為 `"off"`、`cfg://modelRoles` 的 `task` 為 `litellm/deepseek-v4-flash-0731-gmi-ray`，未宣稱已切換為 `gpt-6.1-terra` 或 `gemini3.8:high flash`。

## 問題證據與目標使用者

目標使用者是**開啟案例詳情頁，透過上方捷徑（`前往方法與步驟 ↓`、`核對來源與版本 ↓`）與「案例閱讀導覽」（`實作與結果`、`方法與步驟`、`限制與權限`、`來源與版本`）判讀實作成果、操作步驟、限制與原始來源的訪客**（接續 `SITE.md` 2026-11-11 紀錄留下的未完成範圍）。

全庫 521 個來源檔逐篇掃描 `selectJumps()`、`selectSourceSection()` 與 `selectMethodShortcut()`，並在正式站與本機預覽（1440×900、390×844、320×740）實測，確認 **7 篇案例**存在三類結構性誤判：

| 案例 | 受影響元件 | 基準（修改前）行為 | 案例實際章節與問題 |
| --- | --- | --- | --- |
| **UC-096** | `核對來源與版本 ↓`（`selectSourceSection`）＋導覽 `限制與權限 ↓`（`selectJumps`） | 兩顆按鈕皆跳往第 5 段 `2026-10-20補充 來源B：銷售半夜丟來的問題，Bot 用只讀權限跨系統先初判（V2EX，簡體中文）` | 頁面已有獨立的第 4 段 `## 驗收與限制` 與第 6 段 `## 來源與查閱範圍`。因 `isAppendix()` 先前只套用在 `實作與結果`，含「來源B」與「權限」的日期補充同時搶走頂部來源捷徑與導覽限制捷徑。 |
| **UC-034** | `核對來源與版本 ↓`＋導覽 `來源與版本 ↓` | 兩顆按鈕皆跳往第 10 段 `2026-10-23補充：Bot提出舊發票疑點，仍須本人跨來源核對` | 頁首已列來源、正文無獨立 `## 來源` 段落；因第 10 段日期補充含「跨來源核對」，兩處來源捷徑皆跳往頁尾補充段落。 |
| **UC-455** | 導覽 `實作與結果 ↓`＋頂部 `前往方法與步驟 ↓`＋導覽 `方法與步驟 ↓` | `實作與結果 ↓` 指向第 4 段 `建議操作流程（依來源整理；本庫未實作）`；`前往方法與步驟 ↓` 與 `方法與步驟 ↓` 被迫退到第 5 段 `可複製提示詞（本庫原創設計，未實跑）` | `實作與結果` 的 `/問題|實作|做了|結果|發生/` 誤中「本庫**未實作**」中的「實作」，把明示未實作的流程標成「實作與結果」，並搶走 `方法與步驟` 的目標段落。 |
| **UC-045** | 導覽 `實作與結果 ↓`＋`來源與版本 ↓` | `實作與結果 ↓` 指向第 1 段 `來源及核對結果`；`來源與版本 ↓` 跳往第 9 段 `2026-10-22 14:40補充：共享表格是手動交接板，不是自動喚醒或核准來源` | 第 1 段是來源與本庫核對紀錄，被 `實作與結果` 因「結果」二字搶走後，`來源與版本` 落入含「核准來源」字樣的日期補充。 |
| **UC-353** | 導覽 `實作與結果 ↓` | `實作與結果 ↓` 指向第 3 段 `來源A：@fankaishuoai（X，簡體中文）＋公開參考實作` | 該 `###` 子段落僅列貼文與 repo 連結；因標題含「參考實作」而被標成 `實作與結果`。 |
| **UC-330 / UC-340** | 導覽 `限制與權限 ↓`＋`來源與版本 ↓` | `限制與權限 ↓` 指向第 2 段 `來源與目前可用性`／`來源、結果限制與可用性`；`來源與版本 ↓` 完全消失 | 兩頁第 5 段皆有獨立的 `## 權限、費用與限制`。因 `限制與權限` 先於 `來源與版本` 執行並命中第 2 段的「可用性」，搶走來源段並使頁面失去 `來源與版本` 捷徑。 |

## 兩個可行方案與取捨

- **方案 A（採用）：在 `assets/reader.js` 統一 `isAppendix`、`isMethodHeading`、`selectSourceSection` 與 `selectJumps` 判準。**
  - 做法：
    1. 將 `isAppendix` 提升為模組共用函式，同時套用於 `selectSourceSection()` 與 `selectJumps()` 的全部四個 intent（所有段落仍完整保留於 `全部段落（N）` 與 `逐段核對連結與限制`）。
    2. 由 `方法與步驟` 的兩個正規表示式（`methodHeading`、`promptHeading`）直接合成 `isMethodHeading`，確保被 `實作與結果` 或 `來源與版本` 以方法標題排除的段落與 `方法與步驟` 完全一致。
    3. `實作與結果` 排除負向「未實作」（`(?<!未)實作`）、排除 `isMethodHeading`、並排除純來源／核對標題（`^來源(?:[A-Z0-9：:\s]|版本$|及核對結果$)`）。
    4. `限制與權限` 優先選擇非 `^來源` 開頭的權限／限制段落，僅在頁面無獨立限制段落（如單一 `來源與限制`）時才回退至含 `來源` 的複合標題。
  - 價值：精準修復全庫 7 篇案例（UC-034、UC-045、UC-096、UC-330、UC-340、UC-353、UC-455），其餘 514 個來源檔的 `selectJumps()` 與 `selectSourceSection()` 輸出 100% 不變。
  - 成本：僅修改 `assets/reader.js` 與 3 支單元測試檔（`tests/reader.test.cjs`、`tests/method-shortcut.test.cjs`、`tests/reading-flow.test.cjs`）。
  - 取捨：UC-034、UC-045、UC-353、UC-455 不再顯示名不副實的第 4 顆捷徑（由 4 顆收斂為 3 顆實有段落），UC-330、UC-340 補回原本遺失的第 4 顆 `來源與版本 ↓` 捷徑。
- **方案 B（不採用）：逐篇改寫 7 篇案例 Markdown 的 `##` 標題文字。**
  - 成本與風險：讓原始研究結構遷就解析器缺陷，且未來新增寫有「本庫未實作」或「2026-xx-xx補充…權限／來源…」的案例仍會重演同樣錯誤。

本輪不處理範圍：結果列（`#results-count`）與批次按鈕（`#load-more-results`）的筆數文字整合（留作下一輪獨立主題）。

## 修改前後實測對照（521 個來源檔掃描＋Chromium 三視口）

全庫 521 個來源檔逐篇比對 `selectJumps()` 與 `selectSourceSection()`，**僅以下 7 篇改變，其餘 514 篇完全不變**：

| 案例 | 修改前 (`7533fe63`) | 修改後（本輪） |
| --- | --- | --- |
| **UC-034** | 頂部：`核對來源與版本 ↓` → `#reader-section-9`<br>導覽：`實作與結果`、`方法與步驟`、`限制與權限`、**`來源與版本 ↓ 2026-10-23補充：Bot提出舊發票疑點，仍須本人跨來源核對`** | 頂部：不顯示指向日期補充的 `核對來源與版本 ↓`（頁首 `.detail-source` 保留原始來源連結）<br>導覽：`實作與結果`、`方法與步驟`、`限制與權限`（3 顆，全部 10 段保留於 `全部段落（10）`） |
| **UC-045** | 導覽：**`實作與結果 ↓ 來源及核對結果`**、`方法與步驟`、`限制與權限`、**`來源與版本 ↓ 2026-10-22 14:40補充：…核准來源`** | 導覽：`方法與步驟 ↓ 可貼指令（本庫原創，未測）`、`限制與權限 ↓ 權限、費用與限制`、**`來源與版本 ↓ 來源及核對結果`** |
| **UC-096** | 頂部：`核對來源與版本 ↓` → `#reader-section-4`（`2026-10-20補充 來源B…`）<br>導覽：`實作與結果`、`方法與步驟`、**`限制與權限 ↓ 2026-10-20補充 來源B：…只讀權限…`**、`來源與版本` | 頂部：`核對來源與版本 ↓` → **`#reader-section-5`（`來源與查閱範圍`）**<br>導覽：`實作與結果`、`方法與步驟`、**`限制與權限 ↓ 驗收與限制`**、`來源與版本 ↓ 來源與查閱範圍` |
| **UC-330** | 導覽：`實作與結果`、`方法與步驟`、**`限制與權限 ↓ 來源與目前可用性`**（無 `來源與版本`） | 導覽：`實作與結果`、`方法與步驟`、**`限制與權限 ↓ 權限、費用與限制`**、**`來源與版本 ↓ 來源與目前可用性`** |
| **UC-340** | 導覽：`實作與結果`、`方法與步驟`、**`限制與權限 ↓ 來源、結果限制與可用性`**（無 `來源與版本`） | 導覽：`實作與結果`、`方法與步驟`、**`限制與權限 ↓ 權限、費用與限制`**、**`來源與版本 ↓ 來源、結果限制與可用性`** |
| **UC-353** | 導覽：**`實作與結果 ↓ 來源A：@fankaishuoai（X，簡體中文）＋公開參考實作`**、`方法與步驟`、`限制與權限`、`來源與版本` | 導覽：`方法與步驟 ↓ 建議操作流程`、`限制與權限 ↓ 所需連接、權限與限制`、`來源與版本 ↓ 來源版本` |
| **UC-455** | 頂部：**`前往方法與步驟 ↓ 可複製提示詞（本庫原創設計，未實跑）`**<br>導覽：**`實作與結果 ↓ 建議操作流程（依來源整理；本庫未實作）`**、`方法與步驟 ↓ 可複製提示詞…`、`限制與權限`、`來源與版本` | 頂部：**`前往方法與步驟 ↓ 建議操作流程（依來源整理；本庫未實作）`**<br>導覽：**`方法與步驟 ↓ 建議操作流程（依來源整理；本庫未實作）`**、`限制與權限 ↓ 所需連接、權限與限制`、`來源與版本 ↓ 來源版本` |

### 版面幾何與無障礙量測（[before-measurements.json](before-measurements.json) ／ [after-measurements.json](after-measurements.json)）

- **詳情頁（UC-034、UC-045、UC-096、UC-340、UC-455）**：1440×900（`desktop`）、390×844（`phone`）、320×740（`small`）三種視口下，修改前後 `overflow` 皆為 `false`（0px 水平溢出），`pageErrors` 皆為 `0`，axe（`wcag2a`／`wcag2aa`／`wcag21aa`）於全部 15 個受檢視口狀態皆為 **0 違規**。
- **前後截圖（同頁、同尺寸、同資料狀態）**：
  - `before-{desktop,phone,small}-UC-{034,045,096,340,455}.png`
  - `after-{desktop,phone,small}-UC-{034,045,096,340,455}.png`
  （註：本執行環境設定 `images.blockImages: true`，視覺結論依 DOM 文字、bounding box 幾何與 axe 自動化檢測得出，不宣稱人工肉眼檢視截圖。）

## 測試與三情境驗收

### 1. 先紅後綠回歸與全套測試

```sh
node --test tests/reader.test.cjs tests/method-shortcut.test.cjs tests/reading-flow.test.cjs
node --test tests/*.test.cjs
node --check assets/reader.js
python3 scripts/preview.py /tmp/aiuc-20261114-r2-after-preview/ai-agent-use-cases
python3 scripts/check_corpus_bundle.py /tmp/aiuc-20261114-r2-after-preview/ai-agent-use-cases
node scripts/check-published-surface.cjs
```

- **單元先紅後綠**：對基準 `assets/reader.js`（`7533fe63`）執行 `reader.test.cjs`、`method-shortcut.test.cjs`、`reading-flow.test.cjs`，16 項中有 **4 項失敗**（見 [red-unit.txt](red-unit.txt)）；套用本輪修正後 **16 項全數通過**（見 [green-unit.txt](green-unit.txt)）。
- **全套單元測試**：`node --test tests/*.test.cjs` 由基準 742 項增至 **744 通過、0 失敗**。
- **跨引擎瀏覽器回歸**：`method-shortcut-browser.cjs` 於 Chromium（1440／390／320）、Firefox（390）、WebKit（390）五種組合全數通過（axe 0）。

### 2. 三種訪客情境實走（1440×900 桌面／390×844 手機）

1. **新訪客不知道工具名稱，從問題找到適用案例**：首頁點選「會議整理」（手機先展開任務目錄）→ 抵達 `#explore` 顯示 `顯示 29 / 524 筆收錄`，首張卡片為「自己不能到的會議，讓 Bot 進去先說明身分再記筆記」。
2. **組合搜尋與篩選遇到空結果後恢復探索**：開啟 `?q=規劃旅行&scenario=工作#explore` → 顯示 `顯示 0 / 524 筆收錄`，點選第一顆建議「移除使用情境「工作」 → 查看 1 筆」→ 恢復顯示 `顯示 1 / 524 筆收錄` 且保留搜尋詞 `規劃旅行`。
3. **開啟分享的詳情連結，判讀證據、查看來源並返回探索**：開啟 `?q=語音&case=UC-455#explore` → 第一屏顯示成果主張與核讀摘要，頂部捷徑為 `前往方法與步驟 ↓ 建議操作流程（依來源整理；本庫未實作）`，導覽不再將「本庫未實作」誤標為 `實作與結果`；於 UC-096 對 `限制與權限 ↓` 按 `Enter` 聚焦至 `#reader-section-3`（`驗收與限制`）；按 `Escape` 關閉後焦點回到 `#results-count`，保留 `顯示 88 / 524 筆收錄` 與搜尋詞 `語音`。

## 獨立審查（未參與實作）與修正

由獨立 subagent（`IndependentRoundReviewer`，`reviewer` 角色，未參與本輪實作）審閱 diff、案例標題與測試：

1. **初審（NEEDS FIXES，Priority 3）**：指出初版 `isMethodHeading` 包含 `怎麼試`，但 `方法與步驟` 的正規表示式未包含 `怎麼試`；若遇到 `怎麼試與來源` 這類標題，`isMethodHeading` 會在 `來源與版本` 排除它，而 `方法與步驟` 也配對不到，導致兩個捷徑都落空。
   - **修正**：將 `isMethodHeading` 直接由 `方法與步驟` 使用的 `methodHeading` 與 `promptHeading` 合成（`const isMethodHeading=title=>methodHeading.test(title)||promptHeading.test(title)`），消除兩者字詞差異。
2. **二審（NEEDS FIXES，Priority 3）**：指出測試若只斷言 `建議操作流程（依來源整理）`，在舊版不一致狀態下仍會通過，無法防範 `怎麼試` 被單邊加入 `isMethodHeading`。
   - **修正**：依審查建議於 `tests/reader.test.cjs` 改為斷言 `assert.deepEqual(selectJumps(['怎麼試與來源']),[{label:'來源與版本',index:0,title:'怎麼試與來源'}])`。
3. **終審（APPROVE）**：確認分類與分派共用同一組 pattern，且新斷言直接覆蓋該邊界，無剩餘問題。

## 發布紀錄

（待 PR 檢查、合併與 Pages 部署完成後於 PR 留言或補記）

## 下一輪最值得處理的一件事

- **讓結果列與批次控制說同一個數字**（`SITE.md` 待辦）：空查詢或大結果集時，`#results-count` 顯示 `顯示 524 / 524 筆收錄`，但畫面僅渲染第一批 24 張卡，底部 `#load-more-results` 寫「再看 24 筆（尚有 500 筆）」。本輪調查已確認：`tests/filter-reading-browser.cjs:32`、`tests/source-guide-browser.cjs:77` 與 `tests/hero-load-failure-browser.cjs:85` 對 `#results-count` 有精確字串／結尾錨點斷言，且 `arrival-summary-visibility-browser.cjs` 檢查 `#results-count` 幾何高度。下一輪先評估在 `#load-more-results` 標明「已顯示 24／共 524 筆（尚有 500 筆）」或同步更新上述 3 支測試的取捨。
