# 2026-11-16：來源紀錄的發布驗證不再漏掉 `sources/*.md`

## 基準與選題

- 基準：`origin/main` `74e96d2c42df0066c8c6059938af296d7f38f173`。本機原工作樹未 reset；另從 `origin/main` 建 `/tmp/ai-cases-visitor-orientation-20261116`、分支 `improve/2026-11-16-visitor-orientation`。
- 無 repo／父層 `AGENTS.md`；沿用 README、SITE.md 與 `docs/qa/2026-11-16-rendered-case-context/`、`docs/qa/2026-11-16-fallback-reading/` 的流程。
- 目前沒有開啟中的 PR；近期 main 的 Website QA 與 Pages 均成功。正式站 `catalog.json.sourceRevision` 精確等於 `74e96d2c…`，`sources/` 與 `sources/README.md` 均回 200。基準 run 清單與正式版本見 [`actions-baseline.txt`](actions-baseline.txt)。
- 目標使用者：從案例頁的來源引用、首頁統計卡或書籤直接抵達來源紀錄頁，並用那份紀錄判斷案例可信度的訪客；以及需要知道「這次合併到底有沒有把來源頁發布出去」的維護者。
- 本輪模型：runtime 回報 `litellm/deepseek-flash-gmi`；工具沒有提供切換 gpt-6.1-terra／gemini 的介面，未宣稱使用指定模型或最高推理設定。兩個唯讀調查與一位獨立 reviewer 都是獨立任務上下文。

## 可重現問題

上一輪留下的明確缺口：`scripts/published-check.cjs` 的 `PUBLISHABLE_FILE` 只接受 `sources/pending.md`。因此只改其他 `sources/*.md` 的 push 會被 `publicationChangeList()` 過濾成「沒有發布任何可驗證檔案」：

```json
{"known":true,"entries":[
  {"status":"M","path":"sources/pending.md"},
  {"status":"M","path":"cases/001-travel-checkout.md"}
]}
```

同一個 push 裡的 `sources/research-2026-10-24-0410.md` 與 `sources/README.md` 消失。後果是 exact 模式從不抓取這兩個檔案、superseded 模式把它們當成 unsupported file；只有來源紀錄過期時，閘門仍可能回報 verified。這直接影響「判斷證據可信度」：訪客讀到的來源頁可能不是這次合併的版本。

可重現證據：[`pre-change-gap.txt`](pre-change-gap.txt)。

## 兩個方案

1. **只把 `sources/*.md` 加進 `PUBLISHABLE_FILE`（不另外分流）**：改動最小，但 `servedAssets()` 會把 293 個來源檔全部列入每輪輪詢；以 5 秒一次、最長 60 分鐘計，會製造不必要的流量與部署負擔。
2. **分成「可發布變更」與「常駐輪詢資產」兩類（選定）**：`PUBLISHABLE_FILE` 涵蓋所有 `sources/*.md`，`SERVED_FILE` 保留原本的常駐清單；只把這次變更的來源檔加入 `files`，exact 模式比對建置與正式站位元，superseded 模式比對正式站位元與 live revision 的 git blob。成本多幾行分類與測試，但不放大輪詢。

選 2 的理由：能真正堵住 false-green，同時保留既有 60 分鐘窗口、5 秒節奏、corpus bundle 與刪除探測語意。

## 實作

- `scripts/published-check.cjs`
  - `PUBLISHABLE_FILE` 納入 `sources/*.md`，並排除 Jekyll 不發布的 `_`／`.` 開頭檔名。
  - 新增 `SERVED_FILE`（原本的常駐資產清單）、`BUNDLED_SOURCE`（cases／evidence／`sources/pending.md` 的 corpus 契約）、`STATIC_DOCUMENT`（不在 corpus 的來源檔）。
- `tests/published-version.cjs`
  - 先讀取 changed bytes，再組出 `changedDocuments`；只把這些變更的來源檔加入 `files`。
  - exact 模式：逐位元比對 changed document，缺少時直接 fatal，不空等。
  - superseded 模式：允許 `STATIC_DOCUMENT`，沿用既有 live bytes vs live revision tree 比對；刪除／改名沿用既有 `probeMissing` 與 `readLive`。
  - 404／410 的延後判斷也接受 `changedDocuments`，讓 later descendant 的刪除能由 revision 比較處理。
- `sources/README.md`
  - 在標題下加一段 2026-11-16 的「發布核對」界線：Markdown 原文會比對正式站位元；rendered 頁面目前只抽樣核對。這讓來源 ledger 自己說明覆蓋範圍，也讓這次合併真的走過新增的來源檔驗證路徑。
- 沒有新增 workflow、依賴、追蹤器或第三方請求；`sources/**` 本來就會觸發 Website QA。

## 驗證

### 先紅後綠

新增／擴充的回歸測試在修正前失敗，修正後通過：

- `only files a visitor can receive count as published changes`
- `standalone source ledgers count as changed files but are not polled as assets`
- `every published source markdown is classified for change verification`
- `an exact release rejects a stale source ledger document: <ledger>`（涵蓋 `sources/research-…` 與 `sources/README.md`）
- `a superseded source ledger change verifies the live bytes against the live revision: <ledger>`
- `a deleted source ledger must be absent from the live site: <ledger>`
- `a renamed source ledger verifies the new bytes and the old URL is gone`
- `a later descendant may remove a source ledger this push changed`
- `only changed source ledgers are polled, not the whole sources tree`

紅燈輸出與修正後的分類結果：[`pre-change-gap.txt`](pre-change-gap.txt)、[`post-change-gap.txt`](post-change-gap.txt)。

### 測試與靜態檢查

- 聚焦：`node --test tests/published-check.test.cjs tests/published-version.test.cjs` → **88 pass／0 fail**（[`focused-tests.txt`](focused-tests.txt)）。
- 全套：`node --test tests/*.test.cjs` → **843 pass／0 fail／0 skip**（[`full-tests.txt`](full-tests.txt)）。
- PR 雲端 Website QA [43756280017](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43756280017) 的 `Run existing regression tests` 也實際跑了新測試並顯示 `# tests 843／# pass 843／# fail 0`；同 run 的 Jekyll build 寫出 `_site/sources/index.html`，`Verify fallback reading pages` 顯示 `PASS: 525`。原始節錄見 [`ci-website-qa.txt`](ci-website-qa.txt)。
- `node --check`：`scripts/published-check.cjs`、`tests/published-version.cjs`、兩個測試檔皆通過。
- `node scripts/check-published-surface.cjs` → **PASS：834 檔、5.87 MiB、排除 9 項**（[`surface-check.txt`](surface-check.txt)）。`scripts/preview.py` 會複製 `_config.yml` 排除的目錄，因此不拿它當 Jekyll 發布產物；真正的 `_site` 由 PR 的 Website QA 建置。

### 正式站三情境（基準版本）

- 桌面 1440×1000：不以工具名搜尋「我想把會議錄音整理成待辦」→ 11 筆、顯示「錄音＋待辦」字面拆詞 → UC-511 詳情 → 來源固定合併版本；Escape 返回後查詢保留。
- 手機 390×844：`?q=旅遊&kind=pending` → 0 筆 → 按「移除收錄狀態「待查線索」→ 查看 36 筆」→ 36 筆。
- 手機 390×844：分享 `?case=UC-528` → 詳情開啟 → 來源連結 `target="_blank"`、`rel="noopener noreferrer"`、固定 `74e96d2c…`；`sourceLatestHidden=true`。
- 三情境 `documentElement.scrollWidth - innerWidth` 均為 0；沒有 pageerror。完整數值見 [`live-before.json`](live-before.json)；來源頁 before 截圖在 [`before/`](before/)，部署後補 `after/`。
- 部署後（合併 `fd3d5f65…`）：`catalog.json.sourceRevision` 精確等於合併 SHA；`sources/README.md` 原文與 `/sources/` rendered 頁都可見新段；`/sources/`、`sources/pending.html`、`sources/qualification-audit-2026-10-16.html` 均回 200；桌面／手機 note 可見、水平溢出 0；`?case=UC-528` 的來源固定 `fd3d5f65…`。數值見 [`live-after.json`](live-after.json)，同頁同尺寸截圖在 [`after/`](after/)。

## 獨立審查

- 獨立 reviewer 檢查最終 diff、exact／superseded 路徑、刪除／改名、輪詢範圍與測試，無 P0／P1。
- P2：`sources/README.md` 的發布核對句原本寫成所有來源紀錄都會比對，但實際只抓本次變更的 ledger。已改為「本目錄中有變更的 Markdown 原文會與正式站位元比對」，並補 dot-prefixed 檔名與 404／410 的來源 ledger 回歸。複審確認這些 delta 無 remaining findings。

## 已知限制

- 這次驗證的是 `sources/*.md` 的**原文位元**。`sources/<name>.html` 的 rendered 正文目前仍只抽樣（`sources/qualification-audit-2026-10-16.html`）比對，沒有逐頁驗證；`sources/README.md` 的 `/sources/` 目錄索引也屬於 rendered 頁面，只有原文被 byte-check。
- 一次合併若改動大量來源檔，每次輪詢會逐一抓取這些變更檔；本次沒有加上「大量變更改用 artifact hash」的門檻。目前單檔／少量變更的成本可接受（測試確認只輪詢 changed ledger）。
- 截圖工具在此環境停用圖片讀取；主 agent 未能逐像素目視，另以 DOM／幾何／href 數據保存證據。這是 agent 走查，不是真人使用者研究。
- 沒有變更案例內容、證據等級、合格數或搜尋結果；`sources/README.md` 只多一段發布核對說明。

## 發布與正式站核對

- 已提交 `76fe08d5d6f24cb1ddd677dbefc14467c01b28c0`，PR [#415](https://github.com/RichardHan/ai-agent-use-cases/pull/415)；合併 `fd3d5f6597cfd1345f247f518578b112482094be`。
- PR checks 全部成功（`browser` ×4、`context` ×1）；PR Website QA [43756280017](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43756280017) 的 `Run existing regression tests` 為 843 pass／0 fail，真正 Jekyll build 寫出 `_site/sources/index.html`，`Verify fallback reading pages` 為 PASS 525。
- main Website QA [43758836544](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43758836544) success（11m40s）：`Pages deployment for fd3d5f65…: succeeded`，`PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH fd3d5f65…`，`PUBLISHED_LIVE_BUILD_CURRENT` 與兩個 `PASS LIVE`。此 push 的可發布變更包含 `sources/README.md`（`git diff 74e96d2c fd3d5f65` 可見），所以 exact branch 的 changedDocuments 比對確實被執行；節錄見 [`main-qa.txt`](main-qa.txt)。
- Pages [43758835745](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43758835745) success。正式站 `catalog.json.sourceRevision` 精確等於合併 `fd3d5f65…`；`/sources/` 與 raw `sources/README.md` 都顯示新段，`sources/pending.html`／`sources/qualification-audit-2026-10-16.html` 回 200；桌面／手機 note 可見、水平溢出 0；分享 UC-528 的來源固定合併 SHA。數據見 [`live-after.json`](live-after.json)，同頁同尺寸 after 截圖在 [`after/`](after/)。
- 限制：`published-version.json` 在 exact 模式的 `changedVerified` 仍是既有計數器的 `0`；這不代表 changedDocuments 沒被比對（exact branch 是逐檔 assert，且本次 push 的 `sources/README.md` 在 changed set）。下一輪先把 exact 模式的計數與 log 補上，讓 artifact 自己說清楚驗了幾個檔。

## 下一輪

1. 讓 exact 模式的 `changedVerified` 計數與 log 反映 changedDocuments 數量（本次 artifact 顯示 0，雖然 exact assert 已執行），先以現有 `publicationFixture` 加一個「correct source ledger → changedVerified=1」測試。
2. 用 trusted Pages artifact 比對 changed ledger 的 rendered `.html`（只針對 changed 檔，不逐頁掃 293 檔），目前只有 raw `.md` 與固定抽樣頁被 byte-check。
3. 把 `sources/`／`evidence/` 的免腳本導覽補到與 `cases/` 同一層級；這是獨立的 visitor flow 主題，不要和 gate 混在同一輪。

不要把 rendered 全文驗證說成已完成。
