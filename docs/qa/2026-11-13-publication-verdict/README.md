# 2026-11-13 部署失敗的那個 merge，發布閘門是灰燈不是紅燈

## 基準

- 開發基準 `origin/main` `9f80e852`（開工時），工作期間 main 前進兩個 commit（`69ae8a21`「#329 標記沒有案例描述自己的任務入口」、`fc4bc40e`「#330 記錄」），分支已 rebase 到 `fc4bc40e`，所有數字以 rebase 後重跑為準。隔離 worktree `/private/tmp/aiuc-1113-round13`（分支 `improve/20261113-round13`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 三百餘個 commit，另有 159 個未追蹤的他人研究檔與 QA 產物；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`（`fc4bc40e`）：**652 通過、0 失敗**；`node --check` 對 `scripts/*.cjs` 與 `tests/published-version.cjs` 通過。
- Actions 現況重新確認（未沿用歷史敘述）：main 最近 60 次 run 有 **3 次 failure**，全部是 `pages build and deployment`（`99734627`、`d805fd1f`、`7377831b`），失敗步驟都是 `Deploy to GitHub Pages` 用滿 600 秒後 `Timeout reached`；`docs/` 於 11-10 02:07:55Z 從 Pages 產物排除後，之後 8 次部署全部成功、耗時 60–436 秒（`42757788014` 60 秒、`42753538864` 61 秒、`42752588364` 174 秒、`42758156259` 194 秒）。**部署逾時的根因已由 #323 修掉，本輪不是重複修同一件事。**
- 正式站 `catalog.json.sourceRevision` 開工時 `9f80e852`，期間前進到 `fc4bc40e`（512 個來源檔、515 筆條目）。

## 問題證據

目標使用者是**把 merge 推上 main、想知道「這次到底發布成功沒有」的維護者**；這也是 `Website QA` 唯一能給答案的地方。

- `pages build and deployment` [42733561142](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42733561142)（`99734627`）：`build` 56 秒成功，`deploy` 的 `Deploy to GitHub Pages` 01:09:20→01:19:27 用滿 600 秒失敗，整個 run 在 01:19:29 failure。
- 同一個 commit 的 `Website QA` [42733562130](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42733562130)：01:08:14 開始，01:17:09 起卡在 `Wait for published assets and content`；**下一次 main push 在 01:42:07 把它取消**（`gh run view` 的 step 時間戳：`Wait for published assets and content cancelled 01:17:09→01:42:07`，其餘步驟皆 success）。
- 兩件事合起來的結果：`99734627` 的發布閘門結論是 **cancelled**。灰燈在 GitHub 上讀成「被新的 run 取代」，但實際是「這個 merge 從來沒有得到裁決」——而它的部署其實已經確定失敗。這是唯一會讓「合併後有沒有發布」憑空消失的失敗型態。
- 同一類等待在 11-07 也發生過，且不是被取消、而是等滿一小時才失敗：`Recent review discovery QA` [42336879927](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42336879927) 的 `Verify published version before live journeys` 04:06:05→**05:06:05（3600 秒）**；`Available facet options QA` [42336880002](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42336880002) 的 `Published site verification` 04:08:03→**05:08:03**。兩筆的本地單元測試與預覽步驟全部 success，唯一失敗的就是「連正式站等一個不會出現的版本」。
- 成因（讀碼確認，不是猜）：`scripts/published-assets.cjs:22-33` 的 `check()` 把 `verify()` 拋出的**任何**例外一律記成 `request failed` 並重試；但驗證端只看得到正式站，**分不出「部署已失敗」與「部署還沒完成」**。部署 workflow（`dynamic/pages/pages-build-deployment`）不在 repo 內、也不對外通報結果，所以「已確定」被當成「還沒到」，一路等到 60 分鐘視窗結束。

## 兩個方案

- **A（採用）問 GitHub「這個 SHA 的 Pages 部署做了什麼」。**
  - 做法：新增 `scripts/publication-status.cjs`，讀 `GET /repos/{repo}/actions/runs?head_sha=<sha>`，只認 `pages build and deployment` 這個 run、只認同一個 SHA、取最新一筆，回傳 `failed` / `succeeded` / `pending` / `unknown`。等待迴圈每分鐘問一次：**已失敗且沒有更新的 live build 包含這個 push → 立刻失敗並附上失敗的 run 網址**；已失敗但 live build 是它的後代（後續 merge 已把內容發出去）→ 不判紅，照原設計逐檔驗位元；API 讀不到／沒 token／403／JSON 壞掉 → `unknown`，行為與改動前相同。同時把 `website-qa.yml` 的 `cancel-in-progress` 改成只在 `pull_request` 生效，main 的裁決不再被下一個 push 抹掉。
  - 價值：把「確定失敗」與「還在部署」分開。實測同一個輸入（`99734627` 的建置 + 真的打正式站 + 真的用 token）：基準程式 60 秒上限到期仍在輪詢（`timeout 60` → exit 124），本輪第一行就是 `Pages deployment for 99734627…: failed (failure) — …/runs/42733561142`。
  - 成本：1 個新檔（69 行）、`published-assets.cjs` +22 行、`published-version.cjs` +57 行、workflow 10 行、1 支新測試（11 項）。
  - 取捨：多一個對 GitHub API 的依賴；但讀不到時一律退回舊行為（繼續等），不會產生錯的紅燈。`actions: read` 是新增權限，屬於最小必要範圍（只讀 run 清單）。
- **B 用 `on: workflow_run` 監聽部署 workflow 的結論。**
  - 結構上更直接（部署失敗 → 立刻觸發另一個 workflow 判紅），但 Pages 的部署 workflow 是 GitHub 內建的 `dynamic/pages/...`，只能被動監聽；`workflow_run` 的 `GITHUB_SHA` 是觸發者而非被驗證者，得改用 `github.event.workflow_run.head_sha`，還要處理「部署被取消」「docs-only commit 仍會建置」等邊界。成本與出錯面都大於 A，且同樣需要 `actions: read`。
  - 不採用：本輪要修的是「訊號消失」，A 用一次 API 讀取就能讓訊號回來，不需要再串一層 workflow 依賴。

## 改動

- **`scripts/publication-status.cjs`（新）**：`publicationStatus()`／`classify()`／`pickRun()`。`failed` 只認 `failure`、`timed_out`、`startup_failure`；`cancelled`／`skipped`／`in_progress`／`queued` 都是 `pending`（沒有發布任何東西，不能當成失敗）。查詢刻意不加 `event=push`：Pages 的 run 在 API 裡的 event 是 `dynamic`，用 `event` 篩選會永遠查不到。
- **`scripts/published-assets.cjs`**：新增 `fatalPublicationError()`；`check()` 遇到標記 fatal 的判定就直接往外拋（不再吞成重試），可重試的錯誤保留錯誤碼（`request failed (ECONNRESET)`），但**錯誤訊息內容仍不進 log**（避免把回應細節寫進 CI 紀錄）。
- **`tests/published-version.cjs`**：`waitForPublishedVersion()` 新增可注入的 `deployment`（預設讀真實 API），每 `DEPLOY_POLL_ROUNDS=12` 輪問一次（5 秒一輪 → 每分鐘一次，避免每次 merge 打 720 次 API）；第一輪在 log 印一行 `Pages deployment for <sha>: <state> — <run url>`，之後不重複。判定失敗時用 `liveRevision()` 先讀 live `catalog.json` 的 `sourceRevision`，再用既有的 `assertDescendant()` 判斷 live 是否已經包含這個 push。**只有正面證明「live 不可能含有這個 push」才判紅**：live 是同一個 SHA、或 live 是它的後代 → 照原設計驗位元；git／網路比較失敗、live 版本讀不到、`deployment` 拋錯或回空值 → 不判紅，保留 60 分鐘視窗（暫時性錯誤不能變成紅燈）。比較結果以 `ancestry` 快取，每輪不會重複 `git fetch`。
- **`.github/workflows/website-qa.yml`**：`cancel-in-progress: ${{ github.event_name == 'pull_request' }}`（PR 照舊被下一個 commit 取代）；`permissions` 加 `actions: read`；`Wait for published assets and content` 傳入 `GITHUB_TOKEN: ${{ github.token }}`。
- **`tests/publication-gate.test.cjs`（新，11 項）**：run 選擇與分類（rerun 取最新、別的 SHA／別的 workflow 不算、`cancelled` 不算失敗）、API 不可用一律 `unknown`、fatal 判定不消耗視窗、可重試錯誤保留錯誤碼且不洩漏訊息、失敗部署立即判紅並附 run、失敗部署但 live 有後代時仍照原設計驗位元、pending 部署仍給滿 60 分鐘且 API 每分鐘只問一次、分支建置不問 Pages、workflow 的 `cancel-in-progress` 與權限。

## 測試

- `node --test tests/*.test.cjs`：基準 `fc4bc40e` **652 通過／0 失敗** → 本輪 **663 通過／0 失敗**（+11）。`node --check scripts/publication-status.cjs`、`scripts/published-assets.cjs`、`tests/published-version.cjs` 通過。
- 真實 API（呼叫同一個 `publicationStatus()`，非 mock，token 取自 `gh auth token`）：

| SHA | 分類 | 指向的 run |
| --- | --- | --- |
| `99734627`（部署失敗的 commit） | `failed (failure)` | [42733561142](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42733561142) |
| `c7acb73f`、`9f80e852`、`73e28229` | `succeeded (success)` | 各自的部署 run |
| 不存在的 SHA | `pending` | — |
| 沒有 token | `unknown`（`no GITHUB_TOKEN available`） | — |
| API 非 200／非 JSON／連線失敗 | `unknown` | — |

- 同輸入前後對照（建置 `/tmp/repro/built-failed`＝`99734627` 的 `scripts/preview.py` 產物；真的打 `https://richardhan.github.io/ai-agent-use-cases/`；`GITHUB_REF=refs/heads/main`、`PUSH_BASE_SHA=38a44211`）：

| 程式 | 結果 |
| --- | --- |
| 基準（`99734627` 當時的 `tests/published-version.cjs`） | `timeout 60` 到期仍在輪詢，exit 124，沒有任何裁決（正式環境會一路等到 3600 秒） |
| 本輪 | 0.68 秒內印出 `Pages deployment for 99734627…: failed (failure) — …/runs/42733561142` |
| 本輪（live 已前進到 `fc4bc40e` 之後重跑） | 印出同一行，並說明 `fc4bc40e` 是 `99734627` 的後代、改為逐檔驗證位元（不誤判成紅燈）；兩行只印一次 |

- 沒有弱化閘門：位元比對、`sameContent()`、靜態頁語言檢查、superseded 逐檔驗證、60 分鐘視窗全部未動；`tests/published-assets.test.cjs`（16 項）與 `tests/published-version.test.cjs`（30 項）的既有斷言全數照舊通過，包含「40 分鐘部署仍要等」「60 分鐘才放棄」「superseded 不得變成綠色跳過」。
- 測試變異（新測試對基準程式）：把 `tests/publication-gate.test.cjs` 指向 `fc4bc40e` 的 `scripts/published-assets.cjs` 與 `tests/published-version.cjs`（其餘相依同基準），**11 項中 7 項失敗**（fatal 判定、`request failed` 保留錯誤碼、部署失敗立即判紅、只有證明 live 不含 push 才判紅、pending 仍給滿視窗且每分鐘只問一次 API、workflow 不再取消 main），4 項通過（run 選擇與 rerun 排序、API 不可用與不洩漏訊息、分支建置不問 API——這幾項驗的是新檔案或未依賴新函式簽章的行為）。也就是說新測試不是空轉。
- 本輪沒有跑瀏覽器測試：改動不在 `assets/`、`index.html` 或案例內容，網站輸出不變（`git diff --stat` 只有 workflow 與 scripts/tests）。PR 上的 `Website QA`、`Reader QA`、`Search context QA`、`Partial Load QA` 仍照跑，結果見下。

## 三種訪客情境（確認未受影響）

本輪沒有動到任何訪客看得到的檔案；仍以本機 preview（`/tmp/prev13`）與正式站各走一次，確認輸出與基準一致：

1. **不知道工具名，從問題找案例**：`?q=怎麼整理會議記錄` → 7／515 筆，第一張卡可讀。
2. **組合搜尋後空結果並復原**：`?q=規劃旅行&scenario=工作` → 0／515，空結果提供「移除使用情境『工作』 → 查看 1 筆」，點擊後 1 筆。
3. **開啟分享的詳情直鏈**：`?case=UC-024` → 詳情直接開啟、憑據 `作者報告／示範`、延伸閱讀 3 列 `相關標籤：帳單`、來源連結固定在本版 commit；Escape 關閉後回到 515 筆清單。

## 邊界情況

| 情況 | 結果 |
| --- | --- |
| 部署失敗，但後續 merge 已把內容發布（live 是它的後代） | 不判紅，照原設計逐檔驗位元（log 說明一次） |
| 部署失敗，live 就是這個 SHA（稍早已發布） | 不判紅，照原設計驗位元 |
| 部署失敗，live 停在舊版或無關版本（可證明不含這個 push） | 立刻判紅，訊息附失敗的 run 網址 |
| 部署失敗，但無法比較（git／網路失敗、`catalog.json` 讀不到） | 不判紅，保留 60 分鐘視窗（暫時性錯誤不得變成紅燈） |
| 同一 SHA 的 Pages run 被重跑 | 取 `created_at` 最新的一筆 |
| Pages run 仍是 `in_progress`／`queued` | `pending`，繼續等（最多 60 分鐘） |
| Pages run 結論是 `cancelled` | `pending`（沒有發布任何東西，不能當成失敗） |
| `GITHUB_TOKEN` 缺失、403、非 JSON、連線失敗 | `unknown`，行為與改動前相同 |
| 分支建置（`expectedSourceRevision` 為 null） | 完全不問 API |

## 獨立審查（未參與實作）與修正

由另一個 agent context（`reviewer`，未參與實作）讀本輪 diff、實際呼叫 GitHub API、用 `node:vm` 與臨時副本做對抗輸入，並把新測試指向 `fc4bc40e` 的基準程式。結論 **needs fixes**，提出 5 項；3 項已修、2 項在審查進行期間已先修（審查看的是較早的 head）：

1. **（審查前已修，已驗證）live 是同一個 SHA 時不應判紅。** 審查指出 `live !== deploySha` 的條件會讓「部署失敗但 live 已經就是這個版本」直接判 fatal。現行 `verdict='superseded'` 分支已改為照原設計驗位元：以相同 revision 的 fixture 實測輸出 `matched / exact`（`/tmp/same-sha-check.cjs`）。
2. **（審查前已修，已驗證）只有「可證明 live 不含這個 push」才立即判紅。** `liveRevision()` 讀不到（catalog 404、空值）或祖先比較丟出網路錯誤時，現在是 `verdict='unknown'`、保留 60 分鐘視窗；只有 `isDescendant` 明確回報「does not contain this push」才判紅。新增測試第 3 個案例（`isDescendant` 丟 `ETIMEDOUT`）確認視窗跑滿。
3. **（已修）rerun 的排序。** `pickRun()` 原本只依 `created_at`，同一個 SHA 被重跑成功時仍會讀到最早失敗的那一筆。改為依 `updated_at`（再以 `run_attempt` 決勝）：新增測試「rerun 是最近的活動，不是最近的建立」；真實 API 上 `99734627`（attempt=1 failure）與 `fc4bc40e`（attempt=1 success）分類不變。
4. **（已修）部署狀態與 live 版本請求沒有受 deadline 約束。** `publicationStatus()` 的 `fetch` 與 `liveRevision()` 的抓取都補上 `AbortSignal.timeout(15000)`；`deployCheck()` 拋錯或回傳空值一律視為 `unknown`，不會讓一個永不結束的請求把 gate 拖過 60 分鐘視窗。
5. **（已修）JSON 解析錯誤會把回應片段寫進 log。** `unreadable response: <parser message>` 改為固定字串 `unreadable response`；連線錯誤只留錯誤碼（`request failed (ECONNREFUSED)`），不含 URL 或訊息。新增測試以 `Unexpected token < ... "<html>secret-api-response</html>"` 與含 URL 的 `ECONNREFUSED` 驗證。

審查另確認：Pages run 在 API 的 event 是 `dynamic`（本輪查詢刻意不加 event 篩選）、短 SHA 查不到 run 而 workflow 用的是 full `GITHUB_SHA`、`cancel-in-progress` 用 expression 合法且 push 時為 false、fatal 錯誤沒有被重試包裝吞掉、`deployed-browser.cjs` 不經過新的 fatal 路徑、`actions: read` 只加在該步驟、既有 `request failed` 斷言未被破壞。

審查的測試變異：把新測試指向 `fc4bc40e` 的兩支基準檔，**9 項中 5 項失敗**（審查執行時的 head）；本輪自己重跑（現行 head）為 **11 項中 7 項失敗、4 項通過**。兩者都表示新測試不是空轉。

6. **（複審新發現，已修）暫時性的祖先比較錯誤被永久快取。** `ancestry` 快取原本連錯誤一起存，一次 `ETIMEDOUT` 之後每一輪都重拋同一個錯誤，等於暫時性網路失敗最後仍會變成紅燈。現在只快取「可判定」的答案（比較成功、或明確「does not contain this push」）；網路／git 錯誤不快取，下一輪重新比較。新增測試「暫時性祖先比較失敗會被重試，不會被快取整個視窗」（`isDescendant` 第一次丟 `ETIMEDOUT`、第二次回 true → 最終 `matched / superseded`）。

複審結果：5 項原發現全部 pass（逐項附實跑輸出），另有上述 1 項新 must-fix，已修並補測試；修正後 `node --test tests/*.test.cjs` **663 通過、0 失敗**。

審查未能驗證：`github.token` 在實際 workflow 權限下的執行情形、push 事件的取消行為（需合併後的真實 main run）、以及 `AbortSignal` 在 runner 上實際中止請求的時間（signal 確實有傳入 fetch，但未等 15 秒實測）。

## 已知限制

- 「部署失敗 → 立即紅」只在 live 沒有更新的後代時成立；有後代時仍走原本的逐檔比對，可能一路等到 60 分鐘視窗結束。這是既有設計（位元不可變、CDN 有 600 秒快取窗口），本輪刻意不改，以免在無法區分 CDN 混版時製造假紅燈。
- workflow 內的實際 token 權限（`actions: read`）只能在合併後的 main run 驗證；若被環境擋掉，狀態是 `unknown`，退回改動前的行為。
- 無法在正式環境重現「部署失敗」而不弄壞 main；失敗路徑以單元測試（注入 `deployment`）與真實 API 分類驗證，端到端則用歷史資料（`99734627` 的建置 + 正式站 + 真實 token）驗證。
- 368 筆 cancelled run 的逐一歸因未重做；本輪只確認 main 上最近 40 次 run 有 2 次 cancelled，並深入檢查與本主題相關的那 1 次。

## 發布

- PR [#331](https://github.com/RichardHan/ai-agent-use-cases/pull/331)（head `9c3d0622`）：4 項非略過檢查全部 success——`Website QA` [42763759446](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42763759446) 9m40s、`Reader QA` [42763759273](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42763759273) 5m59s、`Partial Load QA` [42763759323](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42763759323) 3m13s、`Search context QA` [42763759265](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42763759265) 1m37s。PR 上的 `published` 步驟依設計 skipped。
- squash 合併為 `275f415ff748206d1f18e9eebb5297037d662188`；`pages build and deployment` [42764807519](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42764807519) **success**（05:52:17→05:53:13，56 秒）。
- main 的 `Website QA` [42764808248](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42764808248)（`275f415f`）在 05:52:17→06:02:41 **success**。新的 `Wait for published assets and content` 步驟（06:02:00）在第一輪就印出
  `Pages deployment for 275f415ff748206d1f18e9eebb5297037d662188: succeeded (success) — https://github.com/.../runs/42764807519`
  並在 0.76 秒後印出 `PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH 275f415f…`——這同時證明 `actions: read` 在實際 workflow 權限下讀得到 Pages run、`deployment` 預設值真的接上（不是單元測試的注入值）、而 `Fail when the published site cannot be verified` 因 `verified=true` 依設計 skipped、`Verify the published GitHub Pages site` success（06:02:00→06:02:36）。
- 正式站 `catalog.json.sourceRevision` = `275f415ff748206d1f18e9eebb5297037d662188`、`corpus.json` 同版本、512 個來源檔；`index.html`、`assets/app.js`、`assets/style.css`、`assets/reader.css`、`assets/reader.js`、`README.md`、`INDEX.md` 與本機 checkout **逐 byte 相同**。
- 正式站重走（1440×900／390×844）：`?q=怎麼整理會議記錄` 7／515；`?q=規劃旅行&scenario=工作` 0／515，空結果提供「移除使用情境『工作』 → 查看 1 筆」，復原後 515／515；`?case=UC-024` 詳情直開、憑據 `作者報告／示範`、頁首核對 2026-10-14、延伸閱讀 3 列 `相關標籤：帳單`、來源固定在 `275f415f`，Escape 後焦點回到 `results-count`；水平溢出 0、pageerror 0。

## 下一輪

先做**搜尋把本庫自己的編輯註記當成內容**：全庫 508 個案例頁中，`（翻譯改寫）`／`（翻譯摘要）`／`（翻譯整理）` 這類本庫翻譯註記讓 `翻譯` 在正式站（`275f415f`）命中 **186 筆**，但只有 **1 筆**的標題、用途或痛點提到它（`UC-144` 古籍英譯、`UC-410` 的「意圖翻譯卡」）；把註記從可搜尋文字中移除的原型實測為 **18 筆**，兩個真正相關的案例都留著，`翻譯改寫` 由 104 降到 1、`摘要` 191→147、`改寫` 193→125，**沒有任何標題／用途／標籤命中被丟掉**。`英文`／`日文`／`語言` 不動（那些是來源語言，讀者可能真的想找英文來源）。先做的驗證：讀 `tests/problem-compound-queries.test.cjs:274-275`（`文件翻譯` 目前要求 ≥50 筆，正是靠這些註記撐起來）與 `tests/search.test.cjs:320`（`translate` 經同義詞命中 UC-001），決定要改規格還是保留舊行為，再量一次全庫前後筆數。
