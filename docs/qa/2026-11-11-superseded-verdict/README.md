# 2026-11-11 已發布的 merge 被下一個 merge 取代後，閘門等滿 60 分鐘才判紅

## 基準

- 開發基準 `origin/main` `5f678d68`；工作期間 main 前進到 `7a657ddb`（#370 抵達摘要守衛，動 `assets/app.js`／`assets/style.css`），分支已 rebase 到 `7a657ddb` 後重跑，所有數字以後者為準。隔離 worktree `/private/tmp/aiuc-r21`（分支 `improve/20261111-round21`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 三百餘個 commit，另有 159 個未追蹤檔（皆已在 origin/main）；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`（`5f678d68`）**723 通過／0 失敗**；（`7a657ddb`）**728 通過／0 失敗**。
- 正式站開工時 `catalog.json.sourceRevision` = `5f678d68`，工作期間前進到 `7a657ddb`（512 個來源檔、畫面 515 筆）。
- Actions 現況重新確認（不沿用歷史敘述）：main 最近 100 次 run 92 success／5 failure／3 cancelled；3 次 failure 是 GitHub Pages 部署基礎設施，2 次是發布閘門。最近 20 次 main `Website QA` 有 **3 次**各自花掉整整 **3,600 秒**：`42803248261`（`8fbfe082`，步驟 15）、`42820349847`（`2b139d9f`，步驟 17）、`42821309962`（`ab4b51f4`，等前一支佔用的 concurrency group 到 14:09:50 才起跑）。
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
  - 做法：新增 `fileAtRevision(revision,path)`／`sourceListAtRevision(revision)`（`scripts/published-check.cjs`，走 `git cat-file blob`／`git ls-tree`；`isDescendantOf()` 已經 `git fetch` 過那個 revision，所以是本機物件）。`verifySupersededPublication()` 改成：來源 markdown 必須等於 live revision 的那個檔案；靜態資產必須等於 live revision 的那個檔案；刪除的檔案必須在 live revision 也不存在。沒有可發布檔案時，改成驗「live 的 `catalog.files` 與 `corpus.sources` 是否正好是 live revision 的 512 筆」，而不是要求 live 等於本 push 的建置。另外回傳 `carried`（本 push 的位元還有幾個仍在線上），讓 log 說清楚是「被後續 merge 改寫」還是「本 push 的位元還在」。
  - 價值：把「live 是別人的 build」與「live 忘了本 push」分開。前者是正常的連續 merge，第一輪就有答案（實測 0.24 秒）；後者（live 與自己宣告的 revision 不一致，例如 CDN 混版）仍然會重試到視窗結束才紅——真正的壞掉沒有被放寬。
  - 成本：`scripts/published-check.cjs` +41 行、`tests/published-version.cjs` +81/−31 行、2 支測試檔調整、1 支測試新增。沒有新權限、沒有新 workflow 步驟、沒有新 API（`git fetch` 本來就在 `isDescendantOf()` 裡）。
  - 取捨：多依賴「被驗證的 revision 的物件在本機」；`isDescendantOf()` 已經保證這件事，讀不到時是 `throw`（可重試），不會變成錯的紅燈。
- **B 保留本 push 的位元比對，只把等待上限縮短。**
  - 成本最小（改一個常數），但錯誤的裁決沒有修好：仍然會在 1 分鐘後對「已經成功發布」的 merge 判紅。這輪要修的是「紅燈到底對不對」，不是「紅燈多快出現」。
- **C 直接相信 `Pages deployment … succeeded` 就通過。**
  - 少一個 git 依賴，但 superseded 分支就完全沒有內容檢查了。不採用：B 的錯誤可以容忍一小時，C 的錯誤是永遠不再檢查「live 到底服務什麼」。

## 改動

- **`scripts/published-check.cjs`**：新增並匯出 `fileAtRevision(revision,path)`（回傳 `Buffer`，該 revision 沒有這個路徑時回 `null`；revision 讀不到時 `throw`，兩者分開判斷）與 `sourceListAtRevision(revision)`（`git ls-tree -r --name-only` 過濾 `cases/`、`evidence/`、`sources/pending.md` 的 `.md`，排序與 `catalog.json` 的比較方式一致）。
- **`tests/published-version.cjs`**：`verifySupersededPublication()` 換基準並回傳 `carried`；刪除檔案改問 live revision 是否存在；無變更檔案時改驗「live catalog/corpus == live revision 的來源清單」。`waitForPublishedVersion()` 新增可注入的 `contentAtRevision`／`sourcesAtRevision`（預設就是上面兩個 git 版本），並把 `carried` 寫進 `qa-artifacts/published-version.json` 與 log：
  `PUBLISHED_CHANGED_BYTES_MATCH <sha> superseded by <rev> (N files verified against that revision, M still carrying this push's bytes)`。
- **`tests/deployed-browser.cjs`**：`PUBLISHED_LIVE_BUILD_SUPERSEDED` 的說明改成「步驟 15 用那個建置自己的 revision 驗過」，不再說「本 push 的檔案已逐 byte 驗過」。
- **測試**：`tests/published-version.test.cjs` 新增「a changed asset rewritten by a later build settles instead of polling for an hour」「a later merge that rewrote the same case is superseded, not a lost publication」「a live build that disagrees with its own revision never verifies」，改寫「no changed file」分支的兩項；`tests/publication-gate.test.cjs` 的 `builtSite()` 補上注入預設值（單元測試不讀 git）。

## 測試

- `node --test tests/*.test.cjs`：`5f678d68` 基準 **723** → rebase 後 `7a657ddb` 基準 **728** → 本輪 **730 通過／0 失敗**。
- `node --check scripts/published-check.cjs tests/published-version.cjs tests/deployed-browser.cjs` 通過。
- 新增測試指向修正前的 `tests/published-version.cjs` 時紅（3,600 秒後 `Published asset differs from this push`），修正後綠且第一輪結束（`clock() === 0`）。
- 真實 git 前後對照見上表（同一個 `A`／`B`、同一份建置、同一個 HTTP 服務）。

## 已知限制

- 這個錯誤基準在正式站還沒有留下紅燈紀錄（三次 superseded 都剛好沒被改到同一個檔案）；本輪的證據是程式路徑、三次實際走過該分支的 log，以及真實 git 的前後重現。下一個「連續兩個 merge 都動同一個資產」才會在正式站證明。
- `git cat-file` 需要那個 revision 的物件；`isDescendantOf()` 的 `git fetch origin <rev>` 已經保證，但若 fetch 被環境擋掉，狀態是「重試」而不是「紅燈」，與改動前一致。
- 步驟 17 的走查（`scripts/published-revision.cjs`）本輪沒有改動，維持 120 秒有界。

## 發布

（合併後補記）
