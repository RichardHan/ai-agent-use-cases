# 2026-11-10 待查線索的併入去向：兩個主案例只顯示一個

## 基準

- 開發基準 `origin/main` `7abbfc36`（正式站 `catalog.json.sourceRevision` 同值，`builtAt` 2026-11-09，510 個來源檔＝506 案例頁＋3 經驗＋1 待查檔）。隔離 worktree `/tmp/aiuc-1110-r8`（分支 `improve/20261110-pending-merge-heads`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 275 個 commit，且有 159 個未追蹤路徑（他人研究檔與 QA 產物）；本輪未觸碰、未 reset。
- 基準 `node --test tests/*.test.cjs`：**583 通過、0 失敗**；`node --check assets/app.js` 通過。
- main 現況重新確認（不沿用歷史故障）：`main` 最近 12 次 run 全 success（`pages build and deployment` #1520 對 `7abbfc36`、`Website QA` #727 對 `f96d882f`）；近 7 天 49 筆 failure 全部落在 PR 分支、已退役的 main 觸發或外部 github.com 5xx，沒有現行 main 的程式回歸。57 支 workflow 中只有 `website-qa.yml` 會在 main push 執行。因此本輪不把 CI 當主題，也沒有為了綠燈改任何檢查。
- 基準 Open PR：#288（`improve/20261110-round`，`mergeable=CONFLICTING`、no checks、內容含 `assets/app.js`）、#240（draft，INDEX 計數已被現行 506 取代）、#242（停滯但未衝突）。三者都不影響已發布站台，本輪不動。

## 問題證據

目標使用者是**開啟分享的待查線索、想知道「這條線索去哪裡了、該讀哪一篇」的人**。

`sources/pending.md:34` 寫「已併入 UC-101 …，另記 [UC-102 安全表單修訂草稿]」，`INDEX.md:544` 也寫「已併入 UC-101／UC-102」，但 `assets/app.js:1001` 對 pending 條目只取第一個 `/併入\s*(UC-\d{3})/`，且欄位是單值。基準正式站（`7abbfc36`）與 baseline 預覽實測：

| 介面 | 基準顯示 | 問題 |
| --- | --- | --- |
| 詳情徽章 | `待查線索・已併入 UC-101` | 少一個主案例 |
| 卡片徽章 | `已併入 UC-101（不另計數）` | 同上 |
| 交接區 | `…併入 UC-101，不另計一案…`＋1 個站內入口 | UC-102 全頁只有 GitHub 外部連結，沒有站內入口 |
| 結案註記／列印頁尾 | `內容已併入 UC-101` | 同上 |
| 索引 `INDEX.md:544` | `UC-101／UC-102` | 索引與站內互相矛盾 |

同一支解析還有一個防護缺口：`resolved` 由「狀態行有日期＋已處理」決定，與 `mergedInto` 無關。若某條線索只寫「2026-11-10 已處理」而沒有寫併入編號，畫面會直接印出 `待查線索・已併入 null`、卡片 `已併入 null（不另計數）`，結案註記則整段消失（`resolvedPendingNote()` 在沒有目的地時回空字串）。此形狀目前不存在於語料，但上一輪已把它列為待補回歸。

另有一處同一頁的矛盾：`assets/copy.json` 的 P-004 `how` 仍寫「先以少量公開公告對照去敏能力摘要；人工選定後才準備草稿。」——讀起來是尚未執行的計畫，徽章卻說已併入；`caution` 的「主案例」是單數。

## 兩個方案

- **A（採用）目的地改成清單，並新增「已處理但未記錄去向」的如實狀態。**
  - 價值：畫面與來源檔、`INDEX.md` 三方一致；每個主案例都有站內入口；沒有編號時不再出現 `null`，也不補寫去向。
  - 成本：`assets/app.js` 解析與 6 個顯示點（徽章、卡片、結案註記、交接句、列印頁尾、複製筆記）、統計註記與篩選選項文案、`assets/reader.css` 3 行、`assets/copy.json` 1 筆、`sources/pending.md` 寫法說明、4 支既有測試的契約更新＋1 支新測試。
  - 取捨：`mergedInto` 由字串改為陣列，屬內部契約變更；既有呼叫端必須全部改寫，測試也要同步（已逐處更新，未留相容層）。
- **B 只改徽章字串，仍取第一個目的地。**
  - 成本最低，但 UC-102 仍然沒有站內入口，索引與畫面繼續不一致，`null` 防護也還在。

選 A：錯誤是「多個去向被壓成一個值」，正確修法是讓資料形狀支援多個去向；只改文案等於承認畫面說錯而放著入口缺失。

## 改動

- `assets/app.js`
  - 新增 `parseMergedDestinations(clause, selfId)`：只在宣稱句裡找緊接 `已合併／合併／併入／另記／並記` 的 `UC-\d{3}`，去重、保持原順序、排除自己。pending 讀狀態行＋標題，case 讀標題＋證據行；`evidence` 一律空。
  - `mergedInto` 改為陣列；新增 `mergedLabel()`、`pendingStateBadge()`、`cardKindBadge()`、`mergeHandoffSentence()`、`resolvedPendingTally()`，讓徽章、卡片、結案註記、交接句與統計只有一份寫法。
  - `mergedDestination()` 為每個目的地各渲染一個「站內閱讀主案例 …」按鈕，尚未載入者標 `data-merged-missing`；`refreshMergedDestination()` 只在「先前缺的目的地現在載入了」時重繪，避免換掉讀者正在操作的其他按鈕。
  - 已處理但沒有編號：徽章 `待查線索・已處理（來源檔未記錄併入案例）`、卡片 `已處理（不另計數）`、交接區 `…未記錄併入的主案例`＋「沒有站內入口」說明，不生成假入口。
  - 複製筆記新增 `🔁 狀態：已併入 …／已處理，來源檔未記錄併入案例`，分享出去的筆記不再只剩「尚待查證」。
  - 統計註記與 `kind=pending` 篩選選項依 `resolvedPendingTally()` 分開寫「已併入」與「已處理未記錄去向」；今天的語料全是已併入，文字與基準相同。
- `assets/reader.css`：`.detail-merged-destinations` 直向堆疊、`gap:2px`、`max-width:100%`；`.detail-merged-pending`／`.detail-merged-unrecorded` 13px muted、`overflow-wrap:anywhere`。沿用既有色票與 44px 按鈕高度。
- `assets/copy.json`：P-004 `how` 改為「原作者的公開結果已補讀，內容分別併入 UC-101 與 UC-102；仍不提供已驗證的操作流程。」、`caution` 的「主案例」改為兩個編號。
- `sources/pending.md`：檔頭補上寫法說明（`YYYY-MM-DD 已處理`＋`併入 UC-nnn`／`另記 UC-nnn`，未寫編號時畫面會標示未記錄去向）。未改任何一條線索的事實。
- `README.md`：說明一個線索併入多個案例時的呈現與未記錄去向的處理。
- 測試：`tests/pending-resolution.test.cjs`、`tests/search.test.cjs` 的 `mergedInto` 斷言改陣列；`tests/evidence-baseline.test.cjs` 原本斷言「已處理但無目的地時不產生結案註記」（正是讓 `null` 得以露出的行為），改為要求如實說明；`tests/evidence-attribution-browser.cjs` 的 P-004 斷言加嚴為兩個目的地。新增 `tests/merged-destinations.test.cjs` 7 項。

## 測試

- `node --test tests/*.test.cjs`：基準 **583 通過／0 失敗** → 本輪 **590 通過／0 失敗**（新增 7 項）。`node --check assets/app.js` 通過；`assets/copy.json` JSON 解析通過。
- 全庫逐檔比對：同一支腳本在 `origin/main:assets/app.js` 與本輪版本各解析 510 個來源檔（513 筆條目），併入目的地只有 **P-004** 變動（`UC-101` → `UC-101`、`UC-102`）；其餘 512 筆（含 UC-250「已合併 UC-156」）完全相同。標題只用 `已合併` 認宣告、證據行保留 `合併UC-nnn`，避免「合併 UC-nnn 重複資料」這種標題變成併入宣告（已加回歸）。
- 相關瀏覽器回歸（本機 preview，Chromium）：`tests/evidence-attribution-browser.cjs`（含 P-004 兩個站內入口、axe 0）、`tests/search-expansion-consistency-browser.cjs`（`ROUND_URL`）、`tests/print-browser.cjs` 全通過。
- `tests/reader-browser.cjs`：Chromium 三種寬度全通過（search／filter／empty／back／focus、原文目錄、固定位移、來源、直鏈重整、待查線索、axe 0）。同一支測試在 macOS WebKit 走到 `?q=PR&case=UC-005` 時 page crash——同一支測試對未修改的基準預覽（`origin/main`，`:8144`）也在同一步 crash，因此是本機 WebKit 環境問題，不是本輪回歸；CI 的容器 WebKit 另行驗證。Firefox 未在本機跑（快取版本與可用套件不符）。

## 前後數據（Chromium，同 base path，1440×900／390×844／320×740）

| 量測 | 基準 `7abbfc36` | 本輪 |
| --- | --- | --- |
| P-004 詳情徽章 | `待查線索・已併入 UC-101` | `待查線索・已併入 UC-101、UC-102` |
| P-004 卡片徽章 | `已併入 UC-101（不另計數）` | `已併入 UC-101、UC-102（不另計數）` |
| P-004 站內入口 | 1 個（UC-101） | 2 個（UC-101、UC-102），點第二個開啟 `?case=UC-102` |
| P-004 結案註記／列印頁尾 | 只提 UC-101 | 提 UC-101、UC-102 |
| 卡片寬×高（三種寬度） | 397×486／350×482／288×471 | 397×486／350×482／288×471（不變） |
| 水平溢出（頁面／詳情） | 0／0 | 0／0 |
| axe（P-004 詳情，三種寬度） | 0 | 0 |
| pageerror | 0 | 0 |
| 來源類型、收錄計數、篩選選項 | 28／463…、506／3／2、`（含 2 筆已併入，統計不計）` | 同值（只改字串來源） |

另一組合成資料驗證（把一條 `狀態：2026-11-10 已處理` 但沒有編號的線索加進 `sources/pending.md` 的副本，另建 preview，390×844）：徽章 `待查線索・已處理（來源檔未記錄併入案例）`、卡片 `已處理（不另計數）`、交接區說明未記錄去向、站內入口 0 個、頁面不出現 `null`；統計註記自動變成「另有 3 個待查線索已處理（2 筆已併入案例、1 筆未記錄去向）」，篩選選項變成「（含 2 筆已併入、1 筆已處理未記錄去向，統計不計）」。

三情境（本輪預覽，三種寬度，全部 0 pageerror、0 水平溢出）：

| 情境 | 操作 | 結果 |
| --- | --- | --- |
| 1. 不知道工具名的新訪客 | `/` → 輸入「整理會議記錄」→ Enter | 8／513 筆；第一張卡 211／293／312px，焦點在結果筆數 |
| 2. 組合搜尋與篩選遇空結果 | `?q=規劃旅行&scenario=工作` | 0 筆＋空結果區；「移除使用情境「工作」→ 查看 1 筆」→ 1 筆，網址只留 `q` |
| 3. 分享的詳情連結 | `?case=UC-514` → 讀憑據 → Escape | 徽章與「取得：」列正常；Escape 後詳情關閉、回到 513 筆、焦點在結果筆數 |

截圖（同頁面、同資料狀態的前後對照）：`before-p004-{desktop,mobile,small}.png`／`after-p004-{desktop,mobile,small}.png`、`before-card-*`／`after-card-*`、情境 `after-s1-*`／`after-s2-*`／`after-s3-*`。本機**無法讀取影像內容**（工具阻擋影像），視覺結論以 DOM 文字、幾何、`aria` 與 axe 為準，截圖只供人眼核對。

## 已知限制

- 解析只在宣稱句內找「動詞＋編號」。若未來把去向寫在正文其他段落（例如「整理後併入 UC-300」），不會被當成目的地——這是有意的，避免把一般引用升格為併入。
- 一個目的地都不寫時，網站只說「未記錄」，不會回查 Git 歷史補上；補資料仍是人工工作。
- 尚未在瀏覽器實際走過「詳情開啟後才補讀到缺的目的地」的真實晚載路徑；本輪以 `entries` 暫時移除／還原來驗證 `refreshMergedDestination()` 只在缺項補上時重繪（移除後只剩 UC-101 按鈕＋`UC-102 尚未載入`，還原後兩個按鈕）。
- 沒有真人使用者研究；「讀者因此更知道該讀哪一篇」未量測。

## 獨立審查（未參與實作）

獨立審查者在自己的 vm 腳本上把 `origin/main:assets/app.js` 與本輪版本各跑 510 個來源檔：509 個既有案例／證據頁的目的地清單語意相同，四條待查線索只有 P-004 新增 UC-102；`sources/pending.md` 檔頭更動後四條線索逐欄解析（日期、resolved、目的地、搜尋文字）皆未改變。它另外確認 `mergedInto` 沒有殘留字串式操作、新增文案都經 `textContent` 輸出、P-004 的徽章／卡片／結案註記／交接／列印／複製筆記都含兩個目的地，並在 320×740 確認兩個入口可捲到、不被工具列遮住、無水平溢出。

提出 1 項阻擋與 2 項測試品質問題：

1. **（已修，阻擋）晚載補上目的地時焦點掉到 `BODY`**：`refreshMergedDestination()` 以 `replaceWith()` 重建整個入口區，若讀者正聚焦在 UC-101 入口，重建後焦點離開對話框，鍵盤讀者失去位置。修法：重建前記住聚焦的目的地與入口區在視窗中的位置，重建後把焦點放回同一個目的地（找不到時放第一個入口），並依新舊位置差補償 `dialog.scrollTop`，讓閱讀位置不因新增按鈕而跳動。驗證（390×844，把 UC-102 從 `entries` 暫時移除再補回）：焦點仍在 `UC-101`、`document.activeElement` 仍在 `#detail` 內、`scrollTop` 576 不變、入口區位移 0px、Tab 下一站是 UC-102、入口數 1→2。
2. **（已修）目的地存在性測試把 `evidence/` 的 UC 編號當成主案例**：站內入口只查 `kind === 'case'`，測試改為只看 `cases/`。
3. **（已修）來源與解析的比對是單向的**：原本只驗證「解析出的 ID 在來源文字中」。改成反向檢查「狀態行提到的每個 `UC-nnn` 都必須在目的地清單裡」，只保留第一個符合的解析器會在這裡失敗。

審查未能驗證：正式站部署、WebKit／Firefox、截圖影像內容（工具無法讀圖），以及合成「未記錄去向」線索的卡片定位（該文案由單元測試覆蓋）。
