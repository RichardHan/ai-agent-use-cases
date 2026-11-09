# 2026-11-09 分享的案例直鏈，第一屏就能判斷證據

## 基準與環境

- 基準 commit：`fcd53e01`（PR #286 合併後的 `origin/main`）。正式站 `catalog.json.sourceRevision` 同為 `fcd53e01`。
- 本輪分支 `improve/20261109-round3`，隔離 worktree `/private/tmp/aiuc-20261109-round3`。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、有 159 個未追蹤案例檔；本輪未觸碰。
- 預覽：`python3 scripts/preview.py /tmp/aiuc1110-preview/ai-agent-use-cases` + `python3 -m http.server 8137 --bind 127.0.0.1 --directory /tmp/aiuc1110-preview`，路徑 `/ai-agent-use-cases/`（與 Pages 子路徑相同）。
- 瀏覽器：Playwright 1.64.1（Chromium headless）、@axe-core/playwright 4.10.2。視口：桌面 1440×900、手機 390×844、小手機 320×740。
- 基準單元測試：`node --test tests/*.test.cjs` 548 項全過（`fcd53e01`）。
- 本環境無法檢視截圖影像；視覺結論以 DOM、幾何、可見性與 axe 結果為準。以下為腳本化走查，不是真人使用者研究。

## 問題證據（正式站 `fcd53e01` 實測）

分享連結 `?scenario=工作&case=UC-098#explore` 會直接打開詳情。第一屏看得到標題與「作者報告／示範」徽章，但「成果主張來源」與「本庫核讀狀態」只存在於頁面下方的完整憑據說明：

| 視口 | 完整憑據說明頂端 | 視窗高度 | 第一屏可見？ |
| --- | --- | --- | --- |
| 1440×900 | 1299px | 900 | 否 |
| 390×844 | 1443px | 844 | 否 |

徽章只有來源類型，`title` 屬性的完整定義在觸控裝置上無法開啟；訪客要判斷「這是誰的成果、本庫有沒有重現」必須先捲過用途段落。這與「開啟分享連結後能判讀證據」的目標相反，也讓 `尚待查證` 等較弱證據等級與完整案例頁的差別更難理解。

## 兩個方案

- **(A) 採用：在標題下加一列證據摘要。** 直接引用既有的 `PROOF_CLAIMANTS` 與新增的 `PROOF_STATUS_SHORT`，顯示「成果主張：…」與「核讀：…」，並提供 44px 的「核讀與安全建議 ↓」跳到原本的完整說明。價值：第一屏就有可判讀的歸屬與驗證邊界，不新增資料來源、不改卡片或搜尋。成本：`assets/app.js` 一個 render 區塊、一個短狀態字典、`reader.css` 樣式與兩支測試。取捨：手機上摘要佔 108px，完整說明仍在原位（可用跳轉）。
- **(B) 不採用：把完整憑據說明搬到標題下。** 說明在 390px 高 336px，會把「可以幫你做什麼」推到第一屏之外，等於用可信度換掉用途理解；且兩個區塊內容重複。
- **(C) 不採用：只保留現狀。** 訪客需多捲 1.6 個視窗才能看到核讀狀態；不符合本輪驗收情境。

## 本輪變更

- `assets/app.js`
  - 新增 `PROOF_STATUS_SHORT`（六個證據等級各一句短狀態），與 `PROOF_VERIFICATION_STATUS` 一對一；沒有新事實。
  - `showDetail()` 在標題後加入 `.detail-trust-summary`：兩個獨立項目（成果主張、核讀）＋ `.detail-trust-jump` 按鈕。按鈕將 `.detail-proof-note` 設為可程式聚焦、聚焦並捲到工具列下方；反序 Tab 會先經過這個按鈕，不再直接從方法捷徑跳回工具列。
  - 未知等級沿用「原文作者／未獨立重現」後備，不臆測歸屬。
- `assets/reader.css`：摘要可換行、44px 跳轉按鈕、`scroll-margin-top:124px` 避免固定在工具列下、聚焦外框；手機滿寬。
- `tests/detail-reading-and-evidence.test.cjs`：新增 4 項（短狀態覆蓋、第一屏摘要與跳轉焦點、六個等級與未知後備、CSS 可讀性）。
- `tests/detail-trust-summary-browser.cjs`（新增）：1440／390／320 的分享直鏈、摘要與完整說明一致、跳轉焦點與位置、重新載入、`官方自報`／`尚待查證`／`設計／未實跑` 三類、axe 0、無水平溢出。
- `tests/reader-controls-browser.cjs`、`tests/reader-browser.cjs`：把既有的 Tab 順序契約更新為「信任摘要 → 方法捷徑 → 來源」，仍逐項檢查不跳過、不跑出對話框；沒有降低斷言。
- `.github/workflows/website-qa.yml`：`updated-site` 階段加入新瀏覽器測試。
- `cases/469-...md`：引用的 GitHub 倉庫在 2026-11-09 查核回 404，於證據狀態與倉庫條目註明「可能已刪除或轉私人、保留歷史連結、不推定原因」；`author-demo` 分類不變（Qiita 全文仍在）。
- `README.md`：補一句詳情第一屏的證據摘要與跳轉。

## 驗收數據

同一分享直鏈，本機預覽（修改後）：

| 視口 | 摘要位置 | 摘要高度 | 來源連結 | 完整說明 | 跳轉後說明頂端／工具列底端 |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | 270–314 | 44px | 512 | 1357 | 170 / 121 |
| 390×844 | 310–418 | 108px | 636 | 1565 | 150 / 117 |
| 320×740 | 297–405 | 108px | 623 | 1544 | 147 / 114 |

- 三種尺寸的摘要底端都小於視窗高度，來源連結仍在第一屏；跳轉後完整說明頂端高於工具列底端，且仍在視窗內。
- 六個證據等級文字皆由同一份字典產生：`官方自報`→「官方團隊／原廠自述」／「未經第三方獨立重現」；`作者報告／示範`→「社群作者／專案實踐者」／「本庫未獨立重現」；`設計／未實跑`、`公開資料核讀`、`模板／文件核讀`、`尚待查證` 各自對應。未知等級不顯示虛構歸屬。
- axe（WCAG 2.1 A/AA）於直鏈、跳轉後、重新載入與三個證據類別皆 0 違規；水平溢出 0；page error 0。
- 受影響瀏覽器流程：`reader-controls-browser.cjs` 六組引擎／寬度（含 320、360、Firefox、WebKit）通過；`reader-browser.cjs` 的 Chromium、Firefox、WebKit 搜尋、篩選、空結果、返回、來源、直鏈重整與鍵盤流程通過（WebKit 反序 Tab 使用 Alt+Shift+Tab，與既有 reader-controls 契約一致）。新增 `detail-trust-summary-browser.cjs` 三個視口＋三個證據類別通過。
- `tests/reading-flow-browser.cjs` 在 `:98` 的 `reader-return` 焦點斷言失敗；同一腳本對正式站 `fcd53e01` 也以相同斷言失敗，屬既有基準問題，不是本輪回歸，未列入本輪修復。
- 單元測試：`node --test tests/*.test.cjs` → **552 項全過**（基準 548 + 新增 4）。
- 正式站觀察起點與本機預覽的差異只在證據摘要；案例資料、排序、搜尋、篩選與來源版本固定未改。

### 三個指定情境

1. **不知道工具名稱的新訪客**：首頁任務入口「會議整理」→ 結果 → 開啟案例，第一屏可見證據摘要；此輪未改搜尋召回。
2. **組合搜尋與篩選後空結果**：`旅遊`＋情境「生活」→ 0 筆 → 空狀態保留任務捷徑；移除情境後恢復；摘要不影響結果區。
3. **分享直鏈**：`?scenario=工作&case=UC-098#explore` 開啟後第一屏顯示「成果主張：社群作者／專案實踐者／核讀：本庫未獨立重現」，按跳轉到完整說明與安全採用邊界；重整後摘要仍在；關閉（Escape）回到結果並保留篩選。

## 截圖

| 頁面／狀態 | 修改前（正式站 `fcd53e01`） | 修改後（本機預覽，`7482d46e`） |
| --- | --- | --- |
| 1440×900 分享直鏈 | [before-desktop.png](before-desktop.png) | [after-desktop.png](after-desktop.png) |
| 390×844 分享直鏈 | [before-phone.png](before-phone.png) | [after-phone.png](after-phone.png) |
| 320×740 分享直鏈 | — | [after-small.png](after-small.png) |
| 跳轉到完整說明 | — | [after-desktop-jump.png](after-desktop-jump.png)／[after-phone-jump.png](after-phone-jump.png)／[after-small-jump.png](after-small-jump.png) |

修改前的正式站截圖在相同 URL、相同視口、相同載入完成狀態下取得；畫面差異只有本輪新增的摘要列與其後的垂直位移。

## 獨立審查

由未參與實作的 agent（獨立上下文）依需求、完整 diff 與證據重跑全部單元測試、`reader-controls`、`reader-browser` 與自行探測；結論：無阻斷問題，一項應修已修正並重驗。

1. **（應修，已修）未知證據等級不得被說成「原文作者」**：摘要與完整說明的後備原本寫「成果主張：原文作者」，等於替未知或新增等級發明歸屬。已將 `assets/app.js` 三處後備改為「來源未明」，並更新單元測試；重新載入後未知等級顯示「成果主張：來源未明／核讀：未獨立重現」。
2. 其餘確認：六個等級的短狀態與完整邊界一致；摘要與跳轉在 1440／390／320 都在第一屏，跳轉落點在工具列下方；Chromium、Firefox、WebKit 的焦點順序無跳號、關閉後焦點回結果；合併與待查案例可正常渲染、重複開啟無重複 id；列印時摘要隱藏、完整說明保留；UC-469 的 404 註記與 `author-demo` 維持合理。
3. 審查者指出單元測試的「短狀態忠實」只檢查鍵覆蓋與文字形狀，不是語意等價；此限制已記於下方，未以測試宣稱語意正確。

## 已知限制

- 截圖影像在此環境無法檢視，視覺結論以 DOM 文字、幾何、可見性與 axe 為準；未量測實機、低階手機或螢幕閱讀器。
- 短狀態是編輯摘要，不是新的驗證結果；完整說明仍是唯一權威，兩者都由同一份字典產生。
- 手機摘要 108px（兩個項目＋滿寬按鈕）；320×740 仍可完整看到摘要，但內容區因此下移。
- 列印樣式會隱藏摘要列；本輪未改列印閱讀流程。
- UC-469 倉庫 404 只記錄查核日期與無法再核對，不推定刪除或轉私人的原因；Qiita 全文仍可讀，故不改變 `author-demo`。
- 未處理 `還在查證`（收錄狀態）與 `尚待查證`（來源類型）兩個近義標籤的命名；摘要讓兩者在詳情同時可見，但篩選名稱仍未統一。
- 未量測正式站效能、真人理解或轉換；不得把本輪幾何改善當成已觀測成效。

## 發布核對

- PR [#291](https://github.com/RichardHan/ai-agent-use-cases/pull/291)（head `ae03db23`）所有必要檢查通過（`published` 依規則在 PR 上略過），`mergeStateStatus` 為 `CLEAN`；squash 合併為 `9ba4a3ea`。
- `pages build and deployment` [42574282405](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42574282405) 成功；正式站 `catalog.json` 的 `sourceRevision` 為 `9ba4a3ea…`、`builtAt` 2026-11-09。`index.html`、`assets/app.js`、`assets/reader.css` 對正式站與合併 commit 逐 byte 相同。
- 對正式站重跑 `detail-trust-summary-browser.cjs`：1440／390／320 摘要底端 314／418／405、跳轉落點 170／150／147（工具列底端 121／117／114）、axe 0、無溢出。
- 正式站重走三個情境：
  1. 首頁「會議整理」→ 26 筆 → UC-094 詳情第一屏顯示證據摘要，原始 Markdown 固定於 `9ba4a3ea…`；Escape 返回保留 `?q=會議`。
  2. 390px `旅遊`＋情境「生活」→ 22 筆；改 `xyz987` → 0 筆，空狀態列出在目前篩選下有結果的任務，點「會議整理」→ 2 筆、情境保留、URL `?scenario=生活&q=會議`。
  3. `?scenario=工作&case=UC-098` 直鏈：第一屏摘要、「核讀與安全建議 ↓」焦點落在完整說明（150 > 工具列 117）、來源連結 200 且固定於 `9ba4a3ea…`、Escape 後返回 160 筆並保留情境，axe 0。
- 合併後 `Website QA`（main `9ba4a3ea`）[42574283535](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42574283535) 成功，含新增的 `detail-trust-summary-browser.cjs`、Pages 產物語系／corpus／復原檢查與正式站瀏覽器驗證。

## 下一輪建議

先處理「收錄狀態／來源類型」兩個近義標籤的命名與說明（`還在查證` 只涵蓋 2 筆待查想法，`尚待查證` 有 11 筆），以 `/private/tmp/aiuc-20261109-round3` 或新 worktree 重跑 `node --test tests/search-recovery.test.cjs tests/pending-resolution.test.cjs` 與首頁篩選走查，確認改字後召回與計數不變，再決定是否合併兩個概念或改名。
