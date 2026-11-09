# 2026-11-10 主題分類與「同分類」只認案例頁宣告的分類

## 基準

- 開發基準 `origin/main` `0ece4ceb`（2026-11-10 06:28 +0800）。隔離 worktree `/private/tmp/aiuc-1110-decl`（分支 `improve/20261110-declared-category`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 287 個 commit，另有 159 個未追蹤的他人研究檔（`cases/462…` 之後）與 QA 產物；本輪未觸碰、未 reset、未清理。
- 基準 `node --test tests/*.test.cjs`：**594 通過、0 失敗**；`node --check assets/app.js` 通過。
- 正式站（本輪開始時）：`catalog.json.sourceRevision` = `0ece4ceb…`、`corpus.json.revision` = `20261109222927614475041`（同一次部署）、510 個來源檔、513 筆條目。
- Actions 重新確認（不沿用歷史故障，證據見文末）：近三次 `pages build and deployment` 失敗都是 **deploy 階段的平台端 600s 逾時**，不是 build 迴歸、也不是被新 commit 取代；main 目前**沒有 branch protection、沒有任何 required check**，PR 的綠燈是慣例而非閘門。

## 問題證據

目標使用者是**讀完一個案例、想知道「還有哪些類似案例」，或想用「主題分類」篩選的人**。

1. 案例頁首沒有 `- 分類` 行的 159 頁（506 頁中），`metadata()` 以標題關鍵字補一個分類，最後落到字面值 `個人生產力`：145 頁。
2. 正式站 `0ece4ceb`（1440×900 與 390×844 表現相同）：`?case=UC-012`（科研評估、領域批判與稿件整合的人機分工）的「延伸閱讀」印出
   `UC-064 · 共同標籤：科研、多代理`、`UC-023 · 同分類：個人生產力`（產品改版素材）、`UC-025 · 同分類：個人生產力`（offsite 待決事項）。UC-012 的原文從未出現「個人生產力」。
3. 全庫量測（`metadata()`／`relatedEntries()` 對 506 頁）：`同分類` 理由 329 筆，其中 **310 筆**指向一個對方頁面從未宣告的分類；**289 筆**是 `個人生產力` 對 `個人生產力`；**77 頁**的整份延伸閱讀只有這個桶組成的配對。
4. `#category` 篩選在正式站有 **348 個選項**，其中 `個人生產力` 一個選項就佔 145 筆，且沒有任何頁面宣告過這個字串（全庫 grep `^-\s*分類[／標籤]*：個人生產力$` → 0 筆）。訪客無法從介面分辨哪些分類是案例宣告、哪些是程式猜的。

## 兩個方案

- **A（採用）分類只認宣告：沒有宣告就沒有分類。**
  - 刪掉 `metadata()` 的關鍵字推測與 `個人生產力` 預設（`assets/app.js:994-995`）；`同分類` 因此只可能連到真的宣告同一個分類的案例；未宣告的頁面仍保留「共同標籤」的延伸閱讀（原本的 `if (!item.category) return []` 會連共同標籤一起砍掉，一併移除）。
  - 價值：篩選選項、`同分類` 理由、搜尋命中欄位都只陳述案例頁寫過的事。145 筆的虛構桶從篩選與配對中消失。
  - 成本：`assets/app.js` 4 處（＋約 20 行，多為說明文字）、1 支新 unit test、1 支新瀏覽器測試、CI 一行。
  - 取捨：159 頁失去分類，其中 **83 頁**因此沒有延伸閱讀（原本只有虛構配對）。篩選器要如實說明「165 個條目不在分類選項內」。
- **B 保留推測，只在介面標示「（本庫推測）」。**
  - 做法：`categorySource: declared|inferred`，比照既有的 `difficultySource`／`data-difficulty-source` 慣例，在篩選選項、`同分類`、搜尋命中欄位加標記。
  - 價值：不動 329 筆配對、不動篩選筆數。
  - 取捨：**標示不修正錯誤**。289 筆配對之所以存在，是因為 145 個彼此無關的案例共用同一個預設桶；加上「推測」二字後仍是把無關案例配在一起，而 `個人生產力` 這種預設桶也不會因為標示而變成一個分類。成本更高（4 個介面 + 值不得改變的相容約束），換到的卻只是把錯誤寫得更清楚。
- 另考慮：**C 保留 5 條具體關鍵字規則並標示推測**（只刪預設桶）。只影響 14 頁、約 40 筆配對，仍需 B 的全部標示管線，收益不成比例，未採用。

選 A：問題的本質是「沒有資料卻產生了一個分類」，正確的修法是不要產生，而不是替產生的結果加註。

## 改動

- `assets/app.js`
  - `metadata()`：`category` 只取案例頁首的 `- 分類`／`- 分類／標籤` 行，不再有標題推測與 `個人生產力` 預設。
  - `relatedEntries()`：移除「沒有分類就不給任何建議」的提前返回；`同分類` 只在 `item.category` 存在時才配對（`未分類` 仍不算分類）。
  - `renderRelated()`：沒有分類的頁面在空狀態時說明「這篇案例頁沒有宣告分類，因此只會列出共同標籤的案例」。
  - `renderFacetCounts()`：篩選說明新增動態句「主題分類只列案例頁首宣告的分類；N 個未宣告分類的條目不在選項內，仍可用關鍵字、使用情境與其他篩選找到」。
  - `refreshCorpusMetadata()`：空分類不再產生一個與「全部分類」無法區分的空選項。
- `.github/workflows/website-qa.yml`：預覽建置後執行 `tests/declared-category-browser.cjs`。
- `tests/declared-category.test.cjs`（新）：6 項。標題含 `旅遊`／`OLED`／`SaaS`／`研究` 但沒有宣告分類時不得被分類；宣告值逐字保留；全庫「顯示的分類都是自己宣告的」；未宣告分類的頁面不得靠分類配對；未宣告分類仍保留共同標籤建議；全庫沒有任何 `同分類` 指向未宣告分類的頁面。
- `tests/declared-category-browser.cjs`（新）：1440×900／390×844 × Chromium。檢查篩選選項集合＝宣告值集合、沒有空選項、沒有全庫無人宣告的選項、說明句含動態筆數；以最大選項的分享網址載入後筆數與選項一致、結果都宣告該分類、選取狀態保留；未宣告分類的頁面只出現 `共同標籤：`；該類頁面的空狀態說明原因；有宣告分類的頁面仍出現 `同分類：`；axe 0、無水平溢出、無 pageerror。
- `tests/search.test.cjs`：原本的 `filterEntries(entries,['OLED'],{tool:'Grok Bot',category:'實體裝置／驗收'})` 正是用被刪掉的推測值當篩選（UC-010 未宣告分類），改為只驗搜尋與工具條件；分類篩選只認宣告值的契約移到新的 unit test。

## 測試

- `node --test tests/*.test.cjs`：基準 **594** → 本輪 **600 通過、0 失敗**（新增 6 項）；`node --check assets/app.js` 通過。
- 新 unit test 的紅綠（同一支腳本、同一份語料）：`CATEGORY_SOURCE=/tmp/aiuc-1110-r10/assets/app.js`（基準 `0ece4ceb` 的 `app.js`）→ **5／6 失敗**（標題推測、全庫宣告契約、分類配對、共同標籤保留、`同分類` 指向未宣告頁面）；本輪 → **6／6 通過**。
- 新瀏覽器測試的紅綠（重測於重新建置、sha256 核對過的預覽）：基準 `0ece4ceb` → 第一個缺陷斷言就紅 `a theme no page declares is not offered`（`個人生產力` 選項存在）；本輪 → Chromium／Firefox／WebKit × 1440×900／390×844 **六個配置全數通過**（`facet` 343 個選項、`unclassified` 165、最大選項 6 筆、`related`／`empty`／`declared` 三條情境、axe 0）。
- 量測環境：本機 8080／8081 已被前一個 session 的 `python3 -m http.server` 佔用（cwd 分別是 `/private/tmp/prev-before`、`/private/tmp/prev-after3`），曾造成同一網址兩次讀到不同建置。本輪全部證據改在重新建置的 `/tmp/ver-before`、`/tmp/ver-after` 上取得（`http.server` 8180／8181），並先以 `shasum -a 256` 核對 `assets/app.js` 與 worktree 相同（本輪 `082d4374…`、基準 `7624b344…`）。
- 既有瀏覽器回歸（本機預覽，修正版）：`related-browser.cjs`（1440／390／320，8 條情境含載入、跨搜尋歷史、合併交接、恢復後焦點）通過；`evidence-attribution-browser.cjs`（1440／390）通過；`facet-counts-browser.cjs`：Chromium 1440／390／320 與 Firefox 390 通過，**WebKit 390 在 `facet-counts-browser.cjs:110` 失敗**——`#query` 按 Tab 後焦點落在 `#filter-summary` 而非 `#search-submit`，以同一腳本、同一份資料對重建的基準預覽（8180）跑一次，**同一行、同一個焦點結果**，屬既有 WebKit 焦點限制，不是本輪回歸。
- 三條訪客情境（重建預覽 8180／8181 各跑一次，前後結果相同；1440×900／390×844）：不知道工具名輸入「整理會議記錄」→ 8／513 筆、8 張卡、開啟詳情 UC-071；「規劃旅行」＋使用情境「工作」→ 0 筆並提供「移除使用情境「工作」→ 查看 1 筆」，恢復後 1 筆且網址只留 `q`；分享直鏈 `?case=UC-514` → 詳情、12 個來源連結、Escape 返回；三情境 axe 0、水平溢出 0、pageerror 0。
- 舊分享連結相容：`?category=個人生產力`（本輪之後不再存在的值）載入後顯示 0／513 筆、空結果可復原，移除條件 chip 仍在，無 pageerror；不會靜默改寫讀者的分享網址。

## CI 暴露的既有測試耦合（同一輪修正）

第一次 push（`ca596dd2`）後，PR 的 `Website QA` [`42716394888`](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42716394888) 在 `Verify the updated site in Chromium` 失敗：`tests/search-recovery-browser.cjs:167` 的 `assert(loadedMatches>0)`。原因不是產品碼：該 fixture 先讓 `cases/001-travel-checkout.md` 回 404，再要求 `category=旅遊／消費研究`，而它先前之所以還有結果，是因為 UC-099／UC-139 這兩個從未宣告該分類的頁面靠推測拿到同一個值。UC-001 是唯一宣告者、又正好是被封鎖的檔案，所以載入後為 0。

修正（`0f0a194e`）：fixture 改用全庫唯一由多頁宣告的分類 `工作流程／發布期用途`（UC-017…022），封鎖其中一員 `cases/017-prospect-research-drafts.md`，查詢改為 `排程`。四項斷言（載入筆數 > 0、`1 個來源檔案未載入`、建議按鈕引用載入筆數、重試後焦點留在建議上）一字未改，部分載入的語意反而更強：現在被封鎖的檔案確實屬於被篩選的集合。本機以 `discovery-browser.cjs` 重跑（含 `PASS SEARCH STATES`）通過。

這也說明本輪新增的全庫契約測試有其必要：**只要有一個測試靠「推測值」才成立，移除推測時它就會紅**。

## 前後數據（同一頁、同尺寸、同資料狀態）

| 量測 | 基準 `0ece4ceb` | 本輪 |
| --- | --- | --- |
| `?case=UC-012` 的分類 | `個人生產力`（頁面未宣告） | 空（頁面未宣告） |
| UC-012 延伸閱讀 | UC-064（共同標籤）、UC-023／UC-025（`同分類：個人生產力`） | UC-064（共同標籤） |
| `#category` 選項數（1440／390） | 348（含 `個人生產力` 145 筆） | 343（無全庫未宣告的值） |
| 篩選說明句 | 無分類來源說明 | 「…165 個未宣告分類的條目不在選項內…」 |
| 全庫 `同分類` 理由 | 329 筆（310 筆指向未宣告分類） | 17 筆（全部兩邊都宣告） |
| 全庫延伸閱讀筆數 | 1036 | 724 |
| 沒有任何延伸閱讀的案例頁 | 122 | 205 |
| 有分類的案例頁 | 506（含 159 筆推測） | 347（全部宣告） |
| axe／水平溢出／pageerror | 0／0／0 | 0／0／0 |

截圖（同頁、同尺寸、同資料狀態；本機無法讀取影像內容，視覺結論以 DOM 文字與斷言為準）：

- `before/uc012-related-desktop.png`、`before/uc012-related-phone.png`：三筆延伸閱讀，兩筆寫 `同分類：個人生產力`。
- `after/uc012-related-desktop.png`、`after/uc012-related-phone.png`：只剩共同標籤那一筆。
- `before/uc012-filters-*.png`、`after/uc012-filters-*.png`：篩選面板與說明句。

## 已知限制

- **83 頁因此沒有延伸閱讀**（122 → 205）。這些頁面原本的建議全部來自虛構的預設桶，現在顯示如實的空狀態並說明原因。曾考慮用「同使用情境」補位（情境是 506 頁全部宣告的欄位），但 6 個桶、每桶上百筆，且沒有排序準則時永遠建議同一批條目，等於用低相關的建議換掉空狀態，未採用。
- 159 頁仍沒有分類可篩；本輪只讓這件事在介面上說清楚（動態筆數），沒有替它們補分類。補分類需要逐頁讀來源，屬內容工作。
- 分類值仍是各頁自由文字（347 個宣告值），因此篩選清單很細（343 個選項、多數 1 筆）。本輪沒有收斂成主題taxonomy，也沒有動 `情境`／`標籤`。
- 本輪未跑完整 78 支瀏覽器測試；除上列之外未跑 Firefox／WebKit；未在實機、螢幕閱讀器或真實慢網路驗證。
- 本機無法讀取截圖內容（`read` 對 PNG 回「image reading disabled」），視覺差異僅以 DOM 文字、筆數與 axe 斷言佐證。

## 本輪順帶確認、但未處理的 CI 事實

以下由獨立調查（未參與實作）以 API／workflow 檔案重新確認，不是沿用歷史結論：

1. 近三次 `pages build and deployment` 失敗（`42709949822`／`42697783315`／`42546597665`）都是 `deploy` 的 `Deploy to GitHub Pages` 撞 600s 上限（`Timeout reached, aborting!`），`build` 全部成功；同版本重跑在 7–9 秒被 `Deployment cancelled.` 拒絕。真正的 supersede 在 API 上是 `conclusion=cancelled` 且 deploy job `steps: []`（對照 `42342116785`）。這是平台端問題，本輪未改任何部署設定。
2. `main` **沒有 branch protection、沒有 required status checks**（`/branches/main` → `protected:false`、`required_status_checks.enforcement_level:"off"`、`/rulesets` 空）。紀錄型 commit 直接 push 到 main 是現行做法。
3. 57 支 workflow 只有 **16 支**會在 PR／main 觸發；41 支的 `branches:` 指向已結束的 feature 分支或 `closed-historical` 哨兵。16 支都會跑 `node --test tests/*.test.cjs`，但多數 `paths` filter 沒有涵蓋測試實際讀的 `cases/**`、`sources/**`、`tests/**`（例如 `corpus-bundle-qa.yml`、`missing-case-qa.yml`、`related-qa.yml`），內容或排序回歸可能在綠燈下合併。這是本輪新增的 corpus-level 契約測試**目前不會在內容 PR 上執行**的原因。
4. 發布沒有被驗證把關：`pages build and deployment` 在 push 後立即發布，`Website QA`（含正式站檢查）在數分鐘後才結束。

## 下一輪最值得做的一件事

**讓內容 PR 至少跑一次 unit 契約測試。** 證據：41 支 workflow 無法觸發、16 支 live workflow 中多數 `paths` 不含 `cases/**`／`sources/**`，而 `tests/*.test.cjs` 有 85 支會讀這些檔案；本輪新增的 `declared-category.test.cjs` 正是靠讀 `cases/**` 才能守住「顯示的分類必須是宣告的」。先做的驗證：在一個只改 `cases/**` 的 PR 上觀察目前 0 個 job 被觸發，再以最小改動（例如一支只跑 `node --test tests/*.test.cjs` 的 workflow 或補 `paths`）確認該 PR 會紅／會綠，且不影響 20 支瀏覽器 job 的排隊。
