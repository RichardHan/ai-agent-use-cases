# 2026-11-12 首頁任務目錄標出「沒有案例自述這項任務」的 7 個入口

## 問題與證據

正式站 `63f4f375`（`catalog.json` 512 個來源檔、畫面 `顯示 N / 515 筆收錄`）。首頁 `<nav class="hero-problem-tags">` 有 53 個任務連結，桌機全部顯示、手機先顯示 9 個，外觀與行為完全相同。但其中 7 個任務沒有任何案例在頁首的標題／用途／痛點自述在做這件事：

| 入口 | 查詢 | 全文命中 | 自述命中 |
| --- | --- | ---: | ---: |
| 出差報銷 | `?q=出差報銷` | 4 | 0 |
| 播客摘要 | `?q=播客摘要` | 10 | 0 |
| 寫履歷 | `?q=寫履歷` | 8 | 0 |
| 代碼重構 | `?q=代碼重構` | 6 | 0 |
| 發票辨識 | `?q=發票辨識` | 16 | 0 |
| 機票比價 | `?q=機票比價` | 5 | 0 |
| 隱私審查 | `?q=隱私審查` | 64 | 0 |

「自述命中」＝`filterEntries(..., { scope: 'overview' })`，與結果頁 `#match-scope` 用的是同一個判斷（標題、用途、核心目標）。正式實測 `?q=發票辨識` 會顯示：「在所選條件下，沒有案例的標題、用途或痛點同時包含「發票」「辨識」……下列 16 筆是全文或同義詞命中，不代表案例在做這件事。」並提供「改搜「發票」→ 8 筆」。

問題因此不在結果頁——它已經誠實——而在入口：目錄把「有案例自述」與「沒有」的任務排成一樣，訪客要點進去才會被告知，且第一眼看到的 `16 / 515` 讀起來像「16 篇在做發票辨識」。另外 23 個入口的自述命中只有 0～1 筆，這類入口同樣沒有任何事前訊號。

## 方案與取捨

- **A（不採用）改寫查詢或預設 scope。** 先量測過才否決，不是憑感覺：
  - `漏洞掃描` 被改寫成 `資安 漏洞`，兩個詞屬同一個同義詞群組，AND 退化為單詞聯集 → 218 筆，前 6 張卡含「讓 dots 找數學證明，再用另一組檢查找漏洞」「替推理遊戲查漏洞」。改成保留動作詞 `漏洞 掃描` 後是 34 筆，但前 6 張變成 3D 掃描、印表機掃描、汽車保養——更差，因為 `掃描` 本身一詞多義。
  - 把任務入口預設改成「自述」範圍，會讓 23 個入口剩 0～2 筆（7 個直接 0 筆），等於用空結果取代混合結果。
  - 收斂文案需要改 53 個既有 href，其中 11 支被 `tests/problem-compound-queries.test.cjs` 逐條釘住並在前幾輪刻意調過，改動等於推翻既有產品決策。
- **B（採用）在入口上標示，不改查詢、不刪入口。** 只有「自述命中＝0」的連結加 `data-coverage="none"` 與行內「僅相關詞」，並在目錄下方加一行說明；連結、標籤、順序、53 筆總數、手機 9 項揭露全部不動。價值是訪客點擊前就能分辨，成本是目錄多一行說明與少量寬度；風險集中在版面與無障礙，因此以量測與 axe 驗收。

為什麼不標「自述命中 1」這類數字：`代碼審查` 的自述命中是 1（19 筆全文），把「1」放到首頁會讓一個實際有 18 篇在講 PR 審查的入口看起來幾乎沒有內容。只標 0 這個狀態，與結果頁訊息一致，也不會誤導。

## 改動

- `assets/app.js`：新增 `taskCoverage(items, query)`（重用 `filterEntries` 的 `overview` 範圍）、`annotateTaskCoverage()`（語料載入完成與部分載入補讀完成後各跑一次；`failedPaths.length` 時整批跳過，避免把「檔案沒載入」講成「沒有案例自述」）、`clearTaskCoverage()`。標記失敗不影響補讀結果（另外包 try/catch）。
- `index.html`：`.hero-task-directory` 內新增 `#task-coverage-note` 說明行（預設 `hidden`，沒有標記時不顯示）。
- `assets/style.css`：徽章與說明行樣式；≤760px 改成無框行內寫法，減少手機多一列的成本。
- `README.md`、`.github/workflows/website-qa.yml`（新增 `tests/task-coverage-marker-browser.cjs`）。
- 新增 `tests/task-coverage-marker.test.cjs`（6 項）與 `tests/task-coverage-marker-browser.cjs`。

無障礙：連結的可見文字（`發票辨識 僅相關詞`）就是可存取名稱，說明用 `aria-describedby` 指向說明行。第一版用 `aria-label`，`keyboard-search-entry-browser` 的 axe 立即報 `label-content-name-mismatch`，已改掉。

## 量測（同頁、同尺寸、同資料）

| 視口 | `#hero-problem-tags` 高 | `.hero-value-props` top | `#discover` top | 水平溢出 |
| --- | ---: | ---: | ---: | --- |
| 1440×900 | 408 → 460（+52） | 1149 → 1213（+64） | 152 → 152（0） | 0 → 0 |
| 390×844 | 148 → 148（0） | 853 → 879（+25） | 1152 → 1177（+25） | 0 → 0 |
| 320×740 | 148 → 200（+52） | 835 → 912（+77） | 1204 → 1281（+77） | 0 → 0 |

手機收合仍是 9 項（`collapsedHeight < 300` 契約維持）。390px 的價值面板在改動前後都在首屏之外；320px 的價值面板與抽卡區在改動前就已經在首屏之外，因此沒有把原本可見的區塊推出首屏。代價是 320px 的目錄多一列（`出差報銷` 膠囊因徽章換行）。

對比（計算值）：桌機徽章 7.23:1、手機徽章 6.94:1、說明行 4.81:1。

## 先紅後綠

- `node --test tests/task-coverage-marker.test.cjs`：在 `63f4f375` 的 `assets/app.js` 上失敗（`taskCoverage` 不存在），改動後 6 項通過。
- `VERIFY_URL=<baseline preview> node tests/task-coverage-marker-browser.cjs`：基準預覽失敗於「marker state must equal "no case describes this task"」（`mismatches` 非空）；本輪預覽 1440／390／320 全通過，56 個入口逐一以 `?q=…&scope=overview` 實測比對。
- 點擊契約：標記連結的 `title` 說「16 筆」，點入畫面就是 `16 / 515`，`#match-scope` 為 `none`，按「改搜「發票」→ 8 筆」得到 8 筆。

## 指令與結果

- `node --test tests/*.test.cjs`：基準 **636** → 本輪 **642 通過、0 失敗**。
- `node --check assets/app.js`：通過。
- 瀏覽器（本機 Chromium，Pages 相容預覽）：`task-coverage-marker-browser`、`mobile-problem-tags-browser`、`keyboard-search-entry-browser`、`hero-value-browser`、`visitor-problem-browser`、`discovery-browser`、`visual-redesign-browser`、`explore-visibility-browser`、`draw-stability-browser`、`search-reveal-settle-browser` 全部通過；axe 0 違規（三種寬度）。

## 三種情境（390×844 預覽，實走）

1. 不知道工具名稱的新訪客：展開任務清單 →「發票辨識 僅相關詞」→ 16 筆、結果頁說明「沒有案例同時包含…」→「改搜「發票」→ 8 筆」→ 8 筆，首張 UC-190。
2. 搜尋＋篩選組合到空結果：「旅遊」35 筆 → 加上「學習」0 筆 → 空狀態列出可移除條件與任務捷徑 → 移除關鍵字 chip 後 33 筆，`scenario=學習` 保留。
3. 分享詳情直鏈：`?case=UC-407` 直接開啟、區塊為「可以幫你做什麼／適合對象／實作門檻／來源版本／頁首證據說明／你想先了解哪一段？」，來源網域 github.com／x.com／x.ai，關閉後回到 `#explore`、515 筆、焦點在結果摘要。

## 限制

- 本輪以 DOM 幾何、axe 與文字內容驗收；截圖已存（`before-*`／`after-*`），但執行環境無法顯示影像，未由本人目視比對版面美感。
- 本機只跑 Chromium；Firefox／WebKit 與實際螢幕閱讀器朗讀未驗，交由 CI 與後續抽查。
- Jekyll 建置與正式站快取行為未在本機驗證，須以合併後的 Pages 產物核對。
- 本輪未處理（已量測、留給下一輪）：`成本分析 218`、`報表比對 279`、`資料清理 294` 這類由泛用同義詞群組造成的語料級命中；前 5 張卡的自述命中率幾乎都是 0/5（因為標籤是複合詞，卡片標題用的是另一種說法）。

## 下一輪最值得做的一件事

先量「任務入口查詢的語料佔比」而不是再改寫：把 53 個入口依 `全文命中 / 515` 排序，目前 ≥40% 的有 `資料清理 57%`、`報表比對 54%`、`成本分析 42%`、`漏洞掃描 42%`、`安全防護 42%`。先確認這些入口的查詢是否該要求「兩個條件落在同一個欄位」（目前 AND 可跨欄位成立，例如 `報帳審核` 的 `報帳` 命中正文、`審核` 命中標題），再用 `tests/search.test.cjs`、`tests/problem-compound-queries.test.cjs`、`tests/relevance.test.cjs` 逐條核對 11 支 recall 期望後才動手。

## 發布補記

PR [#329](https://github.com/RichardHan/ai-agent-use-cases/pull/329)（head `6a5f93b0`，13 項非略過檢查全 success、`published` 依設計 skip）squash 合併為 `69ae8a21`；`pages build and deployment` [42757788014](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42757788014) build 41 秒、deploy 9 秒 success。正式站 `catalog.json.sourceRevision` 為 `69ae8a219ef1680b592c61475abd15768f049770`、512 個來源檔。

正式站 390px 實測：7 個入口標記（出差報銷、播客摘要、寫履歷、代碼重構、發票辨識、機票比價、隱私審查）、說明行顯示、53 個連結、手機收合、水平溢出 0、axe 0、pageerror 0；點「發票辨識」→ 16 筆、`#match-scope=none`、替代搜尋 8 筆（首張 UC-190）。三情境在正式站重走：標記入口→16→8 筆；`?q=旅遊&scenario=學習` 0 筆→「移除使用情境「學習」→ 查看 35 筆」→ 35 筆；`?case=UC-407` 直鏈→來源網域 github.com／x.com／x.ai→關閉回 `#explore` 515 筆、焦點在結果摘要。

已知未處理（下一輪第一項）：空結果頁的「探索此條件下有收錄的常見問題」仍列出「寫履歷」「播客摘要」這些自述命中 0 的任務，與首頁標記不一致；同一個 `taskCoverage()` 判斷應接到那些建議按鈕上。
