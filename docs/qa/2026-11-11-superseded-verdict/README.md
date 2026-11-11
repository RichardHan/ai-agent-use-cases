# 2026-11-11 已發布的 merge 被下一個 merge 取代後，閘門等滿 60 分鐘才判紅

## 基準

- 開發基準 `origin/main` `5f678d68`；工作期間 main 前進到 `7a657ddb`（#370 抵達摘要守衛，動 `assets/app.js`／`assets/style.css`），分支已 rebase 到 `7a657ddb` 後重跑，所有數字以後者為準。隔離 worktree `/private/tmp/aiuc-r21`（分支 `improve/20261111-round21`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 三百餘個 commit，另有 159 個未追蹤檔（皆已在 origin/main）；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`（`5f678d68`）**723 通過／0 失敗**；（`7a657ddb`）**728 通過／0 失敗**。
- 正式站開工時 `catalog.json.sourceRevision` = `5f678d68`，工作期間前進到 `7a657ddb`（512 個來源檔、畫面 515 筆）。
- Actions 現況重新確認（不沿用歷史敘述）：main 最近 100 次 run 92 success／5 failure／3 cancelled；3 次 failure 是 GitHub Pages 部署基礎設施，2 次是發布閘門。最近 20 次 main `Website QA` 有 **2 支**各自在閘門內花掉整整 **3,600 秒**：`42803248261`（`8fbfe082`，步驟 15 於 11:04:33→12:04:33 失敗）、`42820349847`（`2b139d9f`，步驟 17 於 13:09:40→14:09:40 失敗）。第 3 支 `42821309962`（`ab4b51f4`）本身 1 秒判定 superseded（14:19:40→14:19:41），但它 13:05:15 建立、job 到 14:09:50 才被建立——在同一個 concurrency group 後面排了 64 分鐘，這就是上面那小時的直接成本。
- 前兩支的成因已在前幾輪分別修掉（#349 把產品位元斷言移進 `exact`；#355 讓步驟 17 只問「正式站服務哪個建置」）。本輪**不是重複修同一件事**：被修掉的是兩個入口，這個函式裡「superseded 逐檔比對」那一段沒有動過，而它正是兩個入口背後同一個判準。

## 問題證據

目標使用者是**把 merge 推上 main、想知道「這次到底發布成功沒有」的維護者**。這個問題只有步驟 15 能回答，而它在「已被後續 build 取代」的情況下用錯了比較基準。

- `tests/published-version.cjs`（基準）`verifySupersededPublication()`：`live` 不等於本 push 時，對每個被改的檔案要求
  `assert(buffers.get(entry.path).equals(entry.bytes),'Published asset differs from this push')`、
  `assert(Buffer.from(markdown).equals(entry.bytes),'Published source differs from this push')`。
  也就是**要求「後續建置」服務「本 push」的位元**。只要下一個 merge 也動到同一個檔案，這個斷言在每一輪都不成立，而 `waitForPublishedAssets` 只把 `fatal` 當終止條件，於是等滿 `PUBLICATION_TIMEOUT_MS = 60 分鐘` 才判紅。
- 這不是罕見路徑：最近 6 次 main `Website QA` 有 3 次走 superseded 分支並逐檔比對（`8f515af3` `2 files verified`、`0601671a` `1 files verified`、`ab4b51f4` `2 files verified`）。三次都剛好「後續 build 沒改到那幾個檔案」才通過。
- 同一支函式的「本 push 沒發布任何檔案」分支用 `sameContent(local,remote)`（live 的 corpus 要等於本 push 的建置），同一個錯誤基準：`docs-only` merge 之後只要再有一次內容 merge，live 就永遠不等於它。
- 另外被改的靜態資產與 `catalog.json`／`corpus.json` 模板無關（`PUBLISHABLE_FILE` 不含後者），所以這個錯誤基準只落在「靜態資產」與「來源 markdown」兩類，兩者都是**逐 byte 等於 repo 內容**——可以用 git 直接問「那個 revision 實際寫了什麼」。

### 可重現的重現（真實 git、真實位元、真實 HTTP）

在 `/tmp/gate-demo`（origin 是裸 repo，兩次真實 commit：`A` 改 `assets/app.js`、`B` 再改同一個檔案）用真實建置 `A` 對正式站 `B`，同一個輸入跑修正前後的 `waitForPublishedVersion()`：

| | 結果 | 模擬等待 | 實際耗時 |
|---|---|---|---|
| 修正前（`7a657ddb` 的 `tests/published-version.cjs`） | **REJECTED**，原因 `Published asset differs from this push: assets/app.js` | 3,600 秒（720 輪） | 58.4 秒 |
| 修正後 | **MATCHED**，`{"mode":"superseded","supersededBy":"16907ddd…","changedVerified":1,"carried":0}` | **0 秒** | 0.24 秒 |

同一支 shell 也可在單元測試裡重現：`tests/published-version.test.cjs:195`「a changed asset rewritten by a later build settles instead of polling for an hour」對修正前程式是紅的（3600 秒後 `Published asset differs from this push`），修正後第一輪就結束。

正式站本身也驗證了「可以用 live 宣告的 revision 當基準」：`7a657ddb` 的 512 篇 `corpus.sources[].markdown` 與 `git cat-file blob 7a657ddb:<path>` **512/512 逐 byte 相同**；`index.html` 與 `assets/` 下 7 個 served 檔案（`app.js`、`style.css`、`reader.js`、`reader.css`、`copy.json`、`discovery.js`、`audit.js`）也全部相同；`catalog.files` 與 `git ls-tree` 的 512 筆一致。

## 兩個方案

- **A（採用）把比較基準換成「live 宣告的那個 revision」。**
  - 做法：新增 `treeAtRevision(revision)`／`blobHash(bytes)`（`scripts/published-check.cjs`）。`treeAtRevision()` 一次 `git ls-tree -r <rev>` 取得整棵樹的 blob hash（`isDescendantOf()` 已經 `git fetch` 過那個 revision，所以是本機物件），`blobHash()` 用 git 的 blob 標頭算 sha1，因此「live 服務的位元」與「那個 revision 的內容」是同一個問題、不需要第二支 git 指令。`verifySupersededPublication()` 改成以 live revision 的 hash 為基準：來源 markdown、靜態資產都要 hash 相符；live revision 沒有這個路徑時（本 push 或後續 merge 刪的）改問「live 是否還在發布它」；本 build 已刪、live revision 又放回來的情況則**實際抓那個 URL 回來比對**，不再略過。沒有可發布檔案時，比對 `catalog.files`、`corpus.sources` 的路徑**與每一篇的內容 hash**、重複項、以及 `catalog.bundleRevision`／`corpus.revision` 是否一致，而不是要求 live 等於本 push 的建置。另外回傳 `carried`（本 push 的位元還有幾個仍在線上），讓 log 說清楚是「被後續 merge 改寫」還是「本 push 的位元還在」。
  - 價值：把「live 是別人的 build」與「live 忘了本 push」分開。前者是正常的連續 merge，第一輪就有答案（實測 0.24 秒）；後者（live 與自己宣告的 revision 不一致，例如 CDN 混版）仍然會重試到視窗結束才紅——真正的壞掉沒有被放寬。
  - 成本：`scripts/published-check.cjs` +41 行、`tests/published-version.cjs` +81/−31 行、2 支測試檔調整、1 支測試新增。沒有新權限、沒有新 workflow 步驟、沒有新 API（`git fetch` 本來就在 `isDescendantOf()` 裡）。
  - 取捨：多依賴「被驗證的 revision 的物件在本機」；`isDescendantOf()` 已經保證這件事，讀不到時是 `throw`（可重試），不會變成錯的紅燈。
- **B 保留本 push 的位元比對，只把等待上限縮短。**
  - 成本最小（改一個常數），但錯誤的裁決沒有修好：仍然會在 1 分鐘後對「已經成功發布」的 merge 判紅。這輪要修的是「紅燈到底對不對」，不是「紅燈多快出現」。
- **C 直接相信 `Pages deployment … succeeded` 就通過。**
  - 少一個 git 依賴，但 superseded 分支就完全沒有內容檢查了。不採用：B 的錯誤可以容忍一小時，C 的錯誤是永遠不再檢查「live 到底服務什麼」。

## 改動

- **`scripts/published-check.cjs`**：新增並匯出 `treeAtRevision(revision)`（一次 `git ls-tree -r`，回傳 `Map<path, blobHash>`；revision 讀不到時 `throw`）與 `blobHash(bytes)`（git blob sha1）。
- **`tests/published-version.cjs`**：`verifySupersededPublication()` 換成 hash 基準並回傳 `carried`；live revision 沒有的路徑改問「live 是否還在發布它」；被後續 merge 放回來的資產會實際抓回來比對；無變更檔案時改驗「live catalog/corpus 的路徑與每一篇內容 hash 都等於 live revision，且沒有重複項、兩個 revision 一致」。`waitForPublishedVersion()` 新增可注入的 `treeAtRevision`／`readLive`（預設是 git 與真實 HTTP），並把 `carried` 寫進 `qa-artifacts/published-version.json` 與 log：
  `PUBLISHED_CHANGED_BYTES_MATCH <sha> superseded by <rev> (N files verified against that revision, M still carrying this push's bytes)`。
- **`tests/deployed-browser.cjs`**：`PUBLISHED_LIVE_BUILD_SUPERSEDED` 的說明改成「步驟 15 用那個建置自己的 revision 驗過」，不再說「本 push 的檔案已逐 byte 驗過」。
- **測試**：`tests/published-version.test.cjs` 新增 6 項——「a changed asset rewritten by a later build settles instead of polling for an hour」「a later merge that rewrote the same case is superseded, not a lost publication」「a live build that disagrees with its own revision never verifies」、以及獨立審查後補的「a superseded build whose corpus bytes changed without a content merge is rejected」（內容 hash、重複項、bundle revision 三種）「a later merge that deletes the path this push changed is not a lost publication」「an asset this push deleted but a later build restored is compared with that build」；改寫「no changed file」分支的兩項；`tests/publication-gate.test.cjs` 的 `builtSite()` 補上注入預設值（單元測試不讀 git）。

## 測試

- `node --test tests/*.test.cjs`：`5f678d68` 基準 **723** → rebase 後 `7a657ddb` 基準 **728** → 本輪 **733 通過／0 失敗**。
- `node --check scripts/published-check.cjs tests/published-version.cjs tests/deployed-browser.cjs` 通過。
- 新增測試指向修正前的 `tests/published-version.cjs` 時紅（3,600 秒後 `Published asset differs from this push`），修正後綠且第一輪結束（`clock() === 0`）。
- 真實 git 前後對照見上表（同一個 `A`／`B`、同一份建置、同一個 HTTP 服務）。

## 獨立審查

由另一個 agent（未參與實作、獨立上下文）依需求、diff 與證據審查。三項 must-fix 全部成立，已修並補測試：

| 發現 | 問題 | 修正 |
| --- | --- | --- |
| 1 | 「本 push 沒發布檔案」分支只比對路徑，不比對內容；corpus 內容被改、或有重複項，仍會通過 | 改成每個來源的 `blobHash()` 必須等於 live revision 的 hash，並驗重複項與 `bundleRevision`／`revision` 一致（測試：三種情況各一項） |
| 2 | 本 push 改過的檔案若被後續 merge 刪除，`atLive` 為 `null` 時直接紅，仍會等滿視窗 | 路徑在 live revision 不存在時改問「live 是否還在發布它」，與本 push 自己刪除同一條路徑（測試：`atLive:()=>null` → matched，0 秒） |
| 3 | 本 push 刪除的資產若被後續 merge 放回來，只計數、沒有抓回來比對 | 新增可注入的 `readLive()`，實際抓那個 URL 並與 live revision 的 hash 比對（測試：相符與不符各一項） |

審查另確認：`PUBLISHABLE_FILE` 不會放進 Jekyll 產生的 `catalog.json`／`corpus.json`；`index.html` 與 `assets/*` 沒有 Liquid 樣板；兩個 caller 都是 `fetch-depth: 0`；`facet-counts-qa.yml` 的 push 觸發只指向已停用的分支。審查未能驗證：真實 CI 容器內 `git ls-tree` 對 5,144 筆樹狀結構的耗時（本機 30 秒 timeout 內、單次 < 0.2 秒）。

## 已知限制

- 這個錯誤基準在正式站還沒有留下紅燈紀錄（三次 superseded 都剛好沒被改到同一個檔案）；本輪的證據是程式路徑、三次實際走過該分支的 log，以及真實 git 的前後重現。下一個「連續兩個 merge 都動同一個資產」才會在正式站證明。
- `treeAtRevision()` 需要那個 revision 的物件；`isDescendantOf()` 的 `git fetch origin <rev>` 已經保證，但若 fetch 被環境擋掉，狀態是「重試」而不是「紅燈」，與改動前一致。每一輪重跑一次 `ls-tree`（本機實測單次 < 0.2 秒）。
- 步驟 17 的走查（`scripts/published-revision.cjs`）本輪沒有改動，維持 120 秒有界。

## 發布

- **已提交**：分支 `improve/20261111-round21`，4 個 commit（`eb419835` 判準、`716c53a9` 審查修正、`1cf5136f` 等待時間更正、`7304f1b1` 下一輪紀錄）。
- **已推送**：`origin/improve/20261111-round21`。
- **PR**：[#372](https://github.com/RichardHan/ai-agent-use-cases/pull/372)，最終 head `7304f1b1`，5 項檢查全部 success：`Website QA` [42931585842](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42931585842)、`Reader QA` [42931585778](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42931585778)、`Corpus bundle QA` [42931585676](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42931585676)、`Partial Load QA` [42931585645](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42931585645)、`Search context QA` [42931585655](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42931585655)。
- **已合併**：squash 成 `d19eceac487b27e9b3a0103e9424a4b5593a4773`（2026-11-11T00:42:28Z）；`gh pr merge --delete-branch` 只在本機刪分支時抱怨 main 被另一個 worktree 佔用，合併本身已在伺服器完成（`gh pr view` 為 `MERGED`）。
- **部署成功**：`pages build and deployment` [42933461280](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42933461280) 對 `d19eceac` **success**（00:42:31→00:43:34，63 秒）。
- **正式的發布裁決**：main 的 `Website QA` [42933461861](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42933461861) **success**。步驟 15 於 00:52:24→00:52:25（**1 秒**）印出
  `Pages deployment for d19eceac…: succeeded (success)` 與 `PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH d19eceac…`，走的是 `exact` 分支（本輪沒有改動任何可發布檔案，依設計 `exact` 行為不變）；步驟 17 走查 33 秒 success。
- **正式站已驗證**：`catalog.json.sourceRevision` = `d19eceac…`、`builtAt 2026-11-11`、512 個來源檔；`index.html` 與 `assets/` 下 7 個 served 檔案的本輪 hash 與 `git cat-file blob d19eceac:<path>` **全部相同**。正式站重走（1440×900／390×844／320×740）：首頁 53 個任務連結、7 個「僅相關詞」、說明行可見、水平溢出 0；`?q=整理會議記錄` 7／515；`?q=規劃旅行&scenario=工作` 0／515 → 移除情境後 1／515；`?case=UC-024` 直開、Escape 後焦點回 `results-count`；鍵盤從任務目錄 Enter 得到 78／515；三種寬度 pageerror 0。
- **未能取得的生產證據**：`superseded` 分支（live 已被下一個 build 取代）這次沒有被觸發，因為本輪的 merge 沒有改動任何可發布檔案，正式站在閘門查看時仍等於 `d19eceac`。這個分支由單元測試（對修正前程式紅、修正後第一輪結束）與真實 git 前後對照證明；下一個「連續兩個 merge 都動同一個可發布檔案」會是第一次生產觀察。

## 下一輪最值得做的一件事

**首頁任務目錄的「僅相關詞」徽章用的是「沒有篩選」的條件，而且載入後就不再重算。** `annotateTaskCoverage()`（`assets/app.js:2732`）呼叫 `cachedTaskCoverage(entries, query)` 時沒有傳 `filters`，違反它自己上方 10 行的註解（`assets/app.js:2700-2701`：「Facets still apply…」）；空結果面板的同一批任務則有傳（`assets/app.js:3673`）。`annotateTaskCoverage()` 只有兩個呼叫點（載入後、重試未載入來源後），`render()` 不會叫它，所以切換篩選時首頁徽章不動、結果頁徽章跟著動。

正式站實測（`?q=zzz-nohit&scenario=X`，1440×900，同一畫面比對 `#hero-problem-tags a.problem-tag[data-coverage="none"]` 與 `#empty-suggestions .recovery-problem-tag[data-coverage="none"]`）：

| 篩選 | 首頁標記 | 空結果面板標記 | 面板標記但首頁未標記 |
| --- | ---: | ---: | ---: |
| `scenario=工作` | 7（四個情境都一樣） | 14 | 7（例：代碼審查、代碼除錯、文件翻譯、效能分析） |
| `scenario=生活` | 7 | 31 | 24（例：會議、日誌分析、報帳審核） |
| `scenario=學習` | 7 | 29 | 22 |
| `scenario=創作` | 7 | 25 | 18 |

先做的驗證：用同一個 `taskCoverage(items, query, filters)` 在瀏覽器裡量「首頁徽章集合 == 面板徽章集合（交集任務）」，修正前應為上表的不一致；再決定首頁徽章要跟著目前篩選走，還是改成「無篩選」的明確說法（兩者是不同的產品語意，先量測再選）。

第二順位（原始碼證據、尚未在瀏覽器確認）：`catalog.json` 完全載入失敗時，首頁價值主張與 53 個任務連結照常可用，唯一的訊息在 `#discover`／`#error`，390×844 首屏看不到（`assets/app.js:4565-4576`、`:3106-3122`）；訪客點任務會再失敗一次。先驗證「abort `catalog.json` → 首屏是否出現任何錯誤說明」。

