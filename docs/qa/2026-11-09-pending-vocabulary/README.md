# 2026-11-09 收錄狀態改用「待查線索」，與來源類型的「尚待查證」分開

## 基準與環境

- 基準 commit：`66d51754`（PR #293 合併後的 `origin/main`）。正式站 `catalog.json.sourceRevision` 同為 `66d51754`。
- 本輪分支 `improve/20261109-round4`，隔離 worktree `/private/tmp/aiuc-20261109-round4`。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、有 159 個未追蹤案例檔；本輪未觸碰。
- 預覽：`python3 scripts/preview.py /tmp/aiuc-pending-preview/ai-agent-use-cases` + `python3 -m http.server 8138 --bind 127.0.0.1 --directory /tmp/aiuc-pending-preview`，路徑 `/ai-agent-use-cases/`（與 Pages 子路徑相同）。
- 瀏覽器：Playwright 1.64.1（Chromium headless）；另用 Firefox／WebKit 檢查，WebKit 本機 Tab 限制見下方。
- 基準單元測試：`node --test tests/*.test.cjs` 552 項全過（`66d51754`）。
- 本環境無法檢視截圖影像；視覺結論以 DOM 文字、幾何與可見性為準。以下為腳本化走查，不是真人使用者研究。

## 問題證據（正式站 `66d51754` 實測）

首頁篩選列同時出現兩個只差一個字的狀態，但它們不是同一件事：

| 控制項 | 選項文字 | 實際集合 |
| --- | --- | --- |
| 收錄狀態 | `3 · 還在查證（含 1 筆已併入，統計不計）` | P-001、P-002（已併入）、P-003 三筆待查線索 |
| 分享來自哪裡 | `11 · 尚待查證` | 上述 3 筆＋8 個證據等級為 `待驗證／待定／unverified` 的案例 |

統計卡另寫 `2 個待查想法`；詳情徽章與頁面標題再用 `還在查證`，內文卻用 `待查線索`。同一個「還沒完成」概念在同一頁有四個說法（還在查證／尚待查證／待查想法／待查線索），而 `還在查證` 的 3 筆其實是 `尚待查證` 11 筆的子集，訪客無法從字面判斷哪個控制項會給出哪個集合。

## 兩個方案

- **(A) 採用：把收錄狀態統一為 `待查線索`，並在篩選說明加一句區分兩個軸。** 詳情頁原本就用「待查線索」描述 P-001／P-003；把 `KIND.pending`、選項、統計卡、卡片徽章與文件一起改成同一個名詞，並在 `#facet-count-hint` 說明「收錄狀態＝資料類型；來源類型＝證據等級」。舊詞 `還在查證`／`待查想法` 放進搜尋同義詞，既有連結與查詢不會斷。價值：同一頁只剩兩個清楚不同的名詞，且不必新增資料或改計數。成本：`assets/app.js` 一個常數、一個同義詞組、一段提示；`index.html`、文件與兩支測試同步改字。取捨：`待查線索` 與 `尚待查證` 仍有一個字相同，但一個是名詞（線索）、一個是狀態（待查證），加上說明後可區分。
- **(B) 不採用：只加說明、不改名。** 兩個標籤仍只差一個字，`3` 與 `11` 的關係仍要讀完說明才懂；而且詳情頁與篩選頁會繼續用不同名詞描述同一批條目。
- **(C) 不採用：把 `尚待查證` 改名。** 它同時是來源類型與案例頁證據狀態的既有字串，改動面比收錄狀態大，且會影響 11 筆案例的證據語意；本輪先收斂較小的那一邊。

## 本輪變更

- `assets/app.js`
  - `KIND.pending` 由 `還在查證` 改為 `待查線索`。
  - `SYNONYM_GROUPS` 新增 `['待查線索', '還在查證', '待查想法']`；搜尋舊詞仍能找到同一批條目。
  - `renderFacetCounts()` 的 `#facet-count-hint` 新增 `statusHint`：「收錄狀態的『待查線索』是還沒列成案例的線索；來源類型的『尚待查證』是證據等級，兩者不同。」
  - 抽卡空池文字由 `待查想法` 改為 `待查線索`。
- `index.html`：收錄狀態選項、統計卡、價值說明、抽卡說明、閱讀提醒全部改用 `待查線索`。
- `README.md`：第 41 行改為「待查線索」條目。
- `SITE.md`：維護規則同步改用「待查線索」。
- `tests/search-recovery.test.cjs`、`tests/pending-resolution.test.cjs`：更新標籤斷言與測試名稱。
- `docs/qa/2026-11-09-pending-vocabulary/`：本紀錄與前後截圖。

## 驗收數據

| 位置 | 修改前（正式站 `66d51754`） | 修改後（本機預覽） |
| --- | --- | --- |
| 收錄狀態選項 | `3 · 還在查證（含 1 筆已併入，統計不計）` | `3 · 待查線索（含 1 筆已併入，統計不計）` |
| 來源類型選項 | `11 · 尚待查證` | `11 · 尚待查證`（不變） |
| 統計卡 | `2 個待查想法` | `2 個待查線索` |
| P-001 詳情徽章 | `還在查證` | `待查線索` |
| P-001 頁面標題 | `… · 還在查證` | `… · 待查線索` |
| 篩選說明 | 只說筆數與實作門檻 | 補一句「待查線索是收錄狀態、尚待查證是證據等級」 |

- `kind=pending` 仍為 3 筆（P-001、P-002、P-003）；`proof=尚待查證` 仍為 11 筆；兩者集合關係不變。
- 搜尋 `還在查證`／`待查想法`／`待查線索` 都回 9 筆（6 筆正文提及這些詞的案例＋3 筆待查線索），舊連結不會斷；`kind=pending` 與 `proof=尚待查證` 的篩選計數不變。
- 卡片徽章：P-001／P-003 顯示 `待查線索`，P-002 顯示 `已併入 UC-028（不另計數）`；來源徽章仍為 `尚待查證`。
- 三個指定情境（390×844、Chromium）：
  1. 不知道工具名稱的新訪客：搜尋「發票對帳」→ 17 筆，第一筆 UC-399；收錄狀態與來源類型標籤一致。
  2. 組合搜尋與篩選後空結果：`契約審查`＋情境「創作」→ 0 筆；空狀態提供「移除使用情境『創作』→ 查看 20 筆」；按下後 20 筆、只保留關鍵字，情境已移除。
  3. 分享直鏈：`?case=P-001&kind=pending` 第一屏顯示「待查線索」徽章、`尚待查證` 來源徽章與安全建議；Escape 關閉後回到 `kind=pending` 的 3 筆結果。
- 單元測試：`node --test tests/*.test.cjs` → **553 項全過**（基準 552 + 新增 1 項舊詞搜尋回歸）。
- 受影響瀏覽器流程：`combined-recovery-browser.cjs` 通過（含「一起移除收錄狀態『待查線索』」的復原建議）；`available-facets-browser.cjs` 五組引擎／寬度通過（Chromium 1440／390／320、Firefox 390、WebKit 390；axe 0、無水平溢出），另加載入／部分失敗／復原保留選擇／完全失敗／重試狀態通過。`facet-counts-browser.cjs` 的 Chromium／Firefox 通過；WebKit 390 在 `#search-submit` 焦點斷言失敗，同一腳本對基準 `66d51754` 也以相同斷言失敗，屬 macOS WebKit 的 Tab 行為限制（Tab 從搜尋框直接跳到 `<summary>`，不經過送出按鈕），不是本輪回歸，未列入本輪修復。

## 截圖

| 頁面／狀態 | 修改前（正式站 `66d51754`） | 修改後（本機預覽） |
| --- | --- | --- |
| 1440×900 篩選列 | [before-desktop.png](before-desktop.png) | [after-desktop.png](after-desktop.png) |
| 390×844 篩選列 | [before-phone.png](before-phone.png) | [after-phone.png](after-phone.png) |
| 390×844 P-001 詳情 | [before-phone-detail.png](before-phone-detail.png) | [after-phone-detail.png](after-phone-detail.png) |
| 1440×900 正式站篩選列 | — | [production-desktop.png](production-desktop.png) |

修改前截圖在相同 URL、相同視口、相同載入完成狀態下取得；畫面差異只有收錄狀態用語、統計卡文字與篩選說明。

## 獨立審查

由未參與實作的 reviewer 依完整 diff 與本紀錄檢查，結論「Safe to merge as-is: Yes」，並指出兩項 minor：

1. `assets/app.js` 的同義詞註解原寫「the same two open leads」，但索引也包含已併入的 P-002；已改為「the same pending records, including the one already merged」。
2. `tests/search-recovery.test.cjs` 只驗證篩選標籤，沒有直接驗證舊詞仍能找到 P-001／P-003；已在 `tests/pending-resolution.test.cjs` 新增一項回歸測試，對 `還在查證`／`待查想法`／`待查線索` 各跑一次 `filterEntries`，確認三筆都命中。

修正後 `node --test tests/*.test.cjs` → **553 項全過**（基準 552 + 新增 1）。

## 發布驗證

- PR #294 一般合併，merge commit `a3106928c4f010773acb997ac7cc2ac0871f82d5`。
- Pages build `42587641176`（success）、deployment `7650420555`（github-pages）；Website QA `42587642321`（success）。
- 正式站 `catalog.json.sourceRevision` = `a3106928c4f010773acb997ac7cc2ac0871f82d5`，`files` 510。
- 正式站實測（1440×900、Chromium）：收錄狀態 `3 · 待查線索（含 1 筆已併入，統計不計）`、來源類型 `11 · 尚待查證`、統計 `2`、`#facet-count-hint` 含「待查線索是還沒列成案例的線索；來源類型的尚待查證是證據等級」；截圖 [production-desktop.png](production-desktop.png)。

## 已知限制

- 截圖影像在此環境無法檢視；視覺結論以 DOM 文字、幾何、可見性與 axe 為準；未量測實機、低階手機或螢幕閱讀器。
- `待查線索` 與 `尚待查證` 仍有一個字相同；本輪以「收錄狀態／來源類型」的說明與不同詞性區分，未合併兩個概念。
- WebKit 的 Tab 行為限制只在本機 macOS 重現；CI 的 Linux WebKit 仍以既有工作流驗證。
- 搜尋 `待查線索` 會同時命中 6 筆正文提到這個詞的案例；這是全文搜尋的既有行為，未改搜尋語意。
- 未量測正式站效能、真人理解或轉換；不得把本輪用語改善當成已觀測成效。

## 下一輪建議

先處理首頁「收錄狀態」與「來源類型」兩個下拉在手機上的可讀性：目前 `#facet-count-hint` 已補說明，但兩個控制項仍相隔一段距離。以 `/private/tmp/aiuc-20261109-round4` 或新 worktree 重跑 `node --test tests/facet-counts.test.cjs tests/search-recovery.test.cjs` 與 390／320px 篩選走查，確認把兩個控制項分組或加上可見標籤後，計數與鍵盤焦點不變，再決定是否調整版面。
