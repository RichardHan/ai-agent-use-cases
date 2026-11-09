# 2026-11-10 七個案例頁寫了查證日期，網站卻說「頁首未提供核對日」

## 基準

- 開發基準 `origin/main` `c4bef514`（正式站 `catalog.json.sourceRevision` 同值）。隔離 worktree `/private/tmp/aiuc-1110-round9`（分支 `improve/20261110-visitor-round9`），另有唯讀對照 worktree `/private/tmp/aiuc-1110-before`（detached 於 `origin/main`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 277 個 commit，另有 159 個未追蹤的他人研究檔與 QA 產物；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`：**588 通過、0 失敗**；`node --check assets/app.js` 通過。
- Actions 現況重新確認（不沿用歷史故障）：`gh run list --limit 100` 為 89 success／4 failure／2 cancelled（`cancel-in-progress` 設計行為）／5 執行中；4 次 failure 全在同一個已被取代的 commit `98712c4`（`improve/20261110-detail-exit`，PR #305），下一個 commit `a2bf89d6` 14 項檢查全綠並已合併；`main` 的 `pages build and deployment` 與 `Website QA` 的 published 驗證皆 success。**本輪 CI 不是障礙**，未修改任何 workflow。

## 問題證據

目標使用者是**打開分享連結、想知道「這條線索多久前被核對過」的人**。卡片與詳情第一屏的「頁首核對」是他判斷新鮮度的唯一訊號。

`assets/app.js` 的 `reviewDate()` 只認兩種寫法：具名欄位（`查證日期`／`查閱日期`／`核對日期`／`研究核對日`／`查證`／`首次收錄／最近查證`），以及欄位名剛好是 `日期` 的行。另有 7 個案例頁把查證寫在**別的日期欄位同一行**，原始資料有、網站讀不到：

| 案例 | 頁首原文（節錄） | 基準卡片／詳情 | 基準 `?sort=reviewed` 位置 |
| --- | --- | --- | --- |
| UC-218 | `- 作者／日期／語言：George Liu（@george_sl_liu），英文。發布日未核；2026-10-16 UTC查閱原貼及附圖。` | `頁首未提供核對日` | 503／513 |
| UC-220 | `- 發布日期：原文精確時間未核；查閱2026-10-16 UTC` | 同上 | 504／513 |
| UC-221 | `- 實作日期：2026-09-24；查證2026-10-16 UTC` | 同上 | 505／513 |
| UC-222 | `- 發布日期：2026-09-28；查證2026-10-16 UTC` | 同上 | 506／513 |
| UC-223 | `- 發布日期：精確日期未核；查閱2026-10-16 UTC` | 同上 | 507／513 |
| UC-224 | `- 開始日期：2026-10-08，根README採台北時間；查證2026-10-16 UTC` | 同上 | 508／513 |
| UC-434 | `- 發文日期：頁面只呈現相對時間，絕對發文時間未核；查閱2026-10-23 Asia/Taipei。` | 同上 | 509／513 |

兩個後果：

1. **假稱資料缺漏。** 詳情徽章、卡片與 `aria` 都寫「頁首未提供核對日」，但同一頁前三行就寫了查證日期；這比「未核對」更糟，因為它讓讀者以為本庫沒記錄，而實際上記錄了就寫在眼前。
2. **從「最近核對的內容」被丟到最後。** 首頁 `最近核對的內容 →`（`?sort=reviewed`）以 `reviewedDate` 排序，空字串一律置後，於是這 7 筆固定在 513 筆的 503–509 名，不會出現在前 24 張卡片。UC-434 真正的核對日 2026-10-23 比多數條目新，卻被當成最舊。

## 兩個方案

- **A（採用）放寬欄位名，保留子句判斷。** `reviewDate()` 原本只接受欄位名為 `日期` 的行；改成「欄位名含 `日期`／`時間`」都進同一條子句規則：只有同時寫出查證動作與日期的子句才算核對日。
  - 價值：修的是讀取規則而不是七筆資料；原始研究紀錄一字不動，未來沿用同樣寫法的頁面也讀得到。
  - 成本：`assets/app.js` 1 行正則＋註解、`tests/recent-review.test.cjs` 2 個測試、`README.md` 與 `templates/case.md` 各 1 句。
  - 取捨：仍然不把「來源補充行的查核」或「本次增補查證」當成頁首核對日（那是單一來源或部分補查，不是整頁核對）；這 9 個案例繼續維持現況，已在下方列為限制。
- **B 改七個案例檔的頁首欄位**，統一寫成 `- 首次收錄／最近查證：`。
  - 價值：立刻見效，不動程式。
  - 成本：直接改寫 7 份研究紀錄的頁首；且下一個沿用舊寫法的新檔案會再犯一次。

選 A：錯的是「只認一個欄位名」這條規則，不是作者寫的事實；B 會把手寫欄位當成必須迎合程式的格式，且無法防止重犯。

## 改動

- `assets/app.js`：`reviewDate()` 的欄位判斷由 `^-\s*日期\s*[：:]` 改為 `^-\s*[^：:\n]{0,24}(?:日期|時間)[^：:\n]{0,24}\s*[：:]`，子句規則（`查證|查閱|核對|查核`，並排除「尚未查證」等否定句）與「取最新有效日期」不變；另排除子句主體是別的來源（`補充來源`／`其他來源`／`增補來源`），避免把別人的查核算成本頁核對。註解記下三種實際寫法與兩條界線。
- `tests/recent-review.test.cjs`
  - 新增 `a review written inside another dated lead field is still that page's review`：6 種正向寫法、作者發布日不算核對、5 種只寫日期或否定句的寫法仍不算、來源補充行（含寫在同一行日期欄位裡）的「查核」不算，以及以查核命名的時間欄位算本頁核對。
  - 新增 `every published case states a lead review date the site can read`：讀 506 個真實案例檔，要求 `metadata().reviewedDate` 全部非空，並逐一釘住上述 7 筆的日期。
- `README.md`：說明「頁首核對」讀哪些寫法、何時會標示未提供，以及不借用來源日期。
- `templates/case.md`：`首次收錄／最近查證` 欄位補上可接受的舊寫法。
- 未修改任何案例內容、`catalog.json`、`corpus.json`、`sources/`。

## 驗證

- `node --test tests/*.test.cjs`：588 → **590 通過、0 失敗**；`node --check assets/app.js` 通過。
- **逐檔比對 506 個案例的前後 `reviewDate`**：只有 7 筆變動，全部由空字串變成檔案自己寫的日期（`2026-10-16` ×6、`2026-10-23` ×1），其餘 499 筆一位元不差；`sources/pending.md` 的 4 筆待查線索仍為 `reviewedDate: ''`、`fileReviewed: '2026-10-17'`（`tests/evidence-baseline.test.cjs` 的既有斷言不變）。
- 本機 preview 前後對照（`scripts/preview.py`，Chromium 1440×900／390×844／320×740）：

| 檢查 | 修改前 | 修改後 |
| --- | --- | --- |
| UC-222 詳情徽章 | `頁首未提供核對日` | `頁首核對 2026-10-16`（三種寬度一致） |
| UC-222 卡片 `.review-date` | `頁首未提供核對日` | `頁首核對 2026-10-16` |
| 全部 513 張卡片中標示「未提供核對日」 | 7 張 | **0 張** |
| `?sort=reviewed` 這 7 筆的位置 | 503–509／513 | UC-434 **76**；UC-218 435、UC-220 437、UC-221 438、UC-222 439、UC-223 440、UC-224 441（依各自日期落點） |
| P-001 待查線索 | `本條未載核對日`＋`來源檔查證 2026-10-17` | 不變 |
| 水平溢出／pageerror | 0／0 | 0／0 |

- 瀏覽器回歸（本機 preview `http://127.0.0.1:8097/ai-agent-use-cases/`，Playwright 1.64.1＋Chromium/Firefox/WebKit）：
  - `tests/recent-review-browser.cjs` 通過（含伺服器語料與 checkout 逐檔相同、排序、axe）：`exit 0`
  - `tests/recent-review-recovery.cjs` 通過：`exit 0`
  - `tests/search-expansion-consistency-browser.cjs`：`SEARCH_EXPANSION_CONSISTENCY_OK`
  - `tests/evidence-attribution-browser.cjs`、`tests/detail-trust-summary-browser.cjs`、`tests/result-count-honesty-browser.cjs`：axe 0、pageErrors 0、overflow false
- 截圖（同頁、同尺寸、同資料狀態）：`before-desktop-uc222-detail.png`／`after-desktop-uc222-detail.png`、`before-desktop-uc222-card.png`／`after-desktop-uc222-card.png`、`before-mobile-uc222-badges.png`／`after-mobile-uc222-badges.png`。手機徽章由 104px 變 125.5px 寬、高度與位置不變（24.69px／y=171.8）。**限制：本輪執行環境無法檢視圖片內容**，視覺結論以上述 DOM 幾何與文字量測為準，截圖僅供人工複核。

## 附帶 CI 修復：15 分鐘預算用光在安裝瀏覽器，檢查回報 cancelled

本輪驗收時，PR #309 的 `Reader search QA` 檢查在 **2026-11-09T20:10:37Z** 的 run [42690412988](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42690412988) 停在 `Install browser tools`，於 **20:25:56Z** 被取消（15 分 19 秒，正好是 `timeout-minutes: 15`）；`Verify desktop, mobile, keyboard, sources and accessibility` 一步從未執行，**這個檢查回報了結果，卻什麼都沒驗證**。同一個 workflow 在前一個 commit（`8fed75a4`）的 run 42689291394 是 success，完整流程約 5 分鐘——慢的是安裝（`npm install playwright@1.64.1` ＋ `playwright install --with-deps chromium firefox webkit` ＋ `apt-get install fonts-noto-cjk`），不是測試。

`tests/visitor-experience-and-ci.test.cjs` 本來就有一條「多引擎瀏覽器 workflow 至少 25 分鐘」的規則，但只點名三個檔案，抓不到 `reader-search-qa.yml`。修改：

- `.github/workflows/reader-search-qa.yml`：`timeout-minutes: 15` → **30**（與同樣安裝三引擎的 `trust-summary` 30／`outline-find` 25／`source-guide` 35 一致）。
- `tests/visitor-experience-and-ci.test.cjs`：把規則改成掃描所有「PR 或 main push 到得了、且安裝 2 個以上瀏覽器引擎」的 workflow，逐一要求每個 `timeout-minutes` ≥ 25。實測把 `reader-search-qa.yml` 調回 15 時測試會失敗（`reader-search-qa.yml budgets 15 minutes…`），改回 30 才通過，確認這條測試抓得到原本的缺陷。
- 未改任何測試斷言、未刪除檢查、未關閉任何 workflow；其餘 8 個 live 多引擎 workflow 本來就 ≥ 25（80／80／80／25／85／80／35／75）。

## 獨立審查

獨立 reviewer（未參與實作，另開任務上下文）核對 `f38279a3` 的 diff、程式與語料，未發現阻斷性缺陷，並自行重跑逐檔比對確認：506 個案例只有 7 筆變動、4 筆待查線索維持 `reviewedDate: ''`／`fileReviewed: '2026-10-17'`、`item.date` 不受影響、`INDEX.md` 的最新核對日仍是 2026-11-09、9 個 `本次增補查證` 案例的解析結果不變。它指出兩點並已修正：

1. 本紀錄原本寫「其餘 435–441」，其中 436 由別筆佔用；已改成逐筆位置（435、437–441）。
2. 殘留邊界：同一行日期欄位若寫別人的查核（`- 發布日期：…；補充來源 2026-10-23 查核`）會被算成本頁核對。已加上子句主體排除，並補測試（含 `- 查閱時間：2026-10-16` 這種以查核命名的欄位仍算本頁核對）。目前語料沒有這種寫法，修正後 7 筆變動集合不變。

Reviewer 未重跑測試與瀏覽器套件，因此測試、axe、pageerror、溢出的數字來自主 agent 的實測，不由該次審查背書。

## 已知限制

- 「本次增補查證」（9 案）與「來源補充行…；2026-10-13 查核」（1 案）仍不算頁首核對日。前者只核新增來源、後者是單一來源查核，兩者都不是整頁核對；本輪未放寬，避免把部分查核寫成整頁核對。
- 只修正「讀不到日期」與其排序後果；沒有量測「核對日顯示正確」是否改變讀者採用率，也沒有真人使用者研究。
- 7 個案例檔的頁首欄位維持原寫法（未改寫研究紀錄）。

## 下一輪

先做**詳情關閉後第一次 Back 沒有反應**。本輪自行重現（本機 preview，Chromium 390×844，`c4bef514`）：`?q=會議`（`history.length` 2、24 張卡片）→ 點第一張卡 UC-094（`?q=會議&case=UC-094`、`history.length` 3、dialog 開啟）→ 按「關閉 ✕」→ 網址回到 `?q=會議`、`history.length` 仍是 3、dialog 關閉 → **Back #1：網址、卡片數、dialog 狀態全部不變（沒有任何反應）** → Back #2：離開本站（`about:blank`）。成因在 `assets/app.js`：`showDetail()` 以 `pushState` 推入帶 `?case` 的歷史項，`closeDetail()`（:1784-1793）以 `replaceState` 把同一項改成與下一項完全相同的網址。上一輪 `docs/qa/2026-11-10-merged-destinations/README.md` 已記錄但未修。

驗證先做兩件事，再改程式：(1) 在正式站以 `?q=會議` → 開 UC-094 → 按關閉 → Back，記錄 `history.length` 與畫面是否改變；(2) 盤點 `tests/*-browser.cjs` 中在 `press('Escape')` 同一 tick 斷言 `document.activeElement`／URL 的檔案（上一輪因此讓三個 workflow 轉紅）。先建立 `await closeDetail(page)` 共用 helper 讓既有測試接受非同步關閉，再改 `closeDetail()`。

## 發布

| 狀態 | 內容 |
| --- | --- |
| 已提交 | `f38279a3`（修正）→ `8fed75a4`（review 修正）→ `72ec880e`（CI 預算）→ `c38c14a2`（合併 main `7e70b5f5`，README 兩段都保留） |
| 已推送 | `origin/improve/20261110-visitor-round9` → PR [#309](https://github.com/RichardHan/ai-agent-use-cases/pull/309) |
| PR 檢查 | head `c38c14a2`：**13 項 pass、2 項 skipping**（`published` 依設計在 PR 上跳過）；`Reader search QA` 2m2s pass |
| 已合併 | squash **`7377831b`**（2026-11-09T20:56:54Z） |
| 部署 | **第一次失敗（外部 Pages 服務）**：`pages build and deployment` [42697783315](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42697783315) build success、deploy failure——`Deploy to GitHub Pages` 連續 10 分鐘讀到 `Current status: syncing_files`，21:08:22 出現 `Timeout reached, aborting!` 並 `Canceled deployment with ID 7377831b…`；重跑同一個 run 立即得到 `Deployment cancelled.`（同一個 `pages_build_version` 已被取消，重試被拒） |
| 正式站已驗證 | **尚未**：合併後正式站仍服務 `8100024f`（`catalog.json.sourceRevision`），`assets/app.js` sha256 `238d64d4…` ＝合併前版本；合併版本為 `fbe93519…`。`Website QA` [42697785268](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42697785268) 停在 `Wait for published assets and content`，接下來會走 fail-closed 步驟（不會謊報通過） |

處理方式：本紀錄的更新本身會產生新的 main commit（新的 `pages_build_version`），用它觸發新的 Pages 建置並重新部署，再以 `assets/app.js` sha256 與 `catalog.json.sourceRevision` 核對正式站；若新版本仍無法部署，本輪就以「已合併、未發布」結案並保留上述證據。
