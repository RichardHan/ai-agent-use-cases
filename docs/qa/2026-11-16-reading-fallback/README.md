# 2026-11-16：腳本失敗與直接抵達補充頁時的閱讀退路

## 基準與選題

- 隔離 worktree `/tmp/ai-cases-quality-20261116`，分支 `improve/2026-11-16-content-quality`，基準 `origin/main` `fd3d5f6597cfd1345f247f518578b112482094be`（PR #415 合併後的版本）。原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 未 reset、未覆寫；其他既有 worktrees 未觸碰。
- 開工時正式站 `catalog.json.sourceRevision` = `fd3d5f65…`、`bundleRevision` = `20261115203454930162096`；`gh pr list` 無開啟中的 PR。PR #415 的 Pages 已成功，main Website QA 於本輪開始時仍在跑；本輪不把進行中的 run 算成通過。
- 環境回報模型為 `litellm/deepseek-flash-gmi`；工具沒有提供切換 `gpt-6.1-terra`／`gemini` 的介面，因此不宣稱使用指定模型或最高推理。三個 scout 與主 agent 同一 runtime；獨立 reviewer 是另一個任務上下文。
- 目標使用者：腳本被擋、載入失敗或停用 JavaScript 的讀者；以及從 `INDEX.html#supplement-list`／`#pending-sources` 直接抵達 `evidence/*.html`、`sources/pending.html` 的讀者。

## 可重現問題

以 Playwright 將 `assets/app.js` 回應改為 503（JavaScript 仍啟用），打開正式站 `?q=會議#explore`：

| 檢查 | 正式站 `fd3d5f65` |
| --- | --- |
| `#results-count` | `正在讀取案例…` |
| `#error` | `hidden=true`（唯一含 `INDEX.html` 的區塊沒有出現） |
| `#explore` 內可見索引連結 | 0 |
| 水平溢出 | 無 |

停用 JavaScript 時結果相同；頁尾 `<noscript>` 只連 GitHub `INDEX.md`，且在 `#explore` 之外。這違反 README 的承諾：「案例載入失敗時，結果區也有本站索引入口及重試按鈕」——該承諾只在 app.js 已執行、catalogue fetch 失敗時成立；app.js 本身失敗時沒有退路。

另外，直接抵達的補充頁沒有上一輪加上的伺服器端導覽：

| 頁面 | `data-fallback-case-nav` | `<h1>` 數 |
| --- | --- | --- |
| `cases/001-travel-checkout.html` | 有 | 2（站名＋案例） |
| `evidence/013-authentication-diagnosis.html` | 無 | 2 |
| `sources/pending.html` | 無 | 2 |
| `INDEX.html` | 無（正確） | 2 |

站名 `<h1>` 讓讀屏的標題導覽先唸「AI 用法實驗室」，再唸頁面自己的標題；`evidence`／`pending` 讀者則只能靠站名回首頁。

`README.md` 的「權限」示例仍是 515／507 時代的數字；現況是 529 條目、521 筆命中（34 筆標題／用途／痛點、411 筆正文或頁首、76 筆只靠章節標題）。README 不發布到 Pages，但仍是 repo 門面。

## 兩個方案

- **A（採用）交付 HTML 自帶退路＋補齊伺服器端導覽與語意。** 在 `#explore` 搜尋表單前放一個靜態 `#static-reading-fallback`（連本站 `INDEX.html` 與 GitHub 原始索引），app.js 一執行就隱藏；把 `case-fallback-nav` 擴及 `evidence/`／`sources/pending.md`；站名由 `<h1>` 改為 `<p class="site-title">` 並用 CSS 保留外觀。成本：1 個 HTML 段落、2 行 Liquid、1 個 layout 標籤、約 20 行 checker／測試。風險：低；正常 JS 路徑只多一個立即隱藏的段落。
- **B 只在頁尾 `<noscript>` 補本站索引連結。** 成本更低，但：(1) 它只在 JavaScript 完全停用時出現，涵蓋不了 app.js 404／503／語法錯誤；(2) 它在頁尾，`#explore` 讀者仍要先捲過整頁；(3) 不處理 evidence／pending 的直接抵達與重複 h1。因此不採用。

## 改動

| 檔案 | 改動 |
| --- | --- |
| `index.html` | `#explore` 搜尋表單前新增 `#static-reading-fallback`，連 `INDEX.html` 與 GitHub `INDEX.md`；沒有 `hidden`，不依賴 JS。 |
| `assets/app.js` | 在 `load()` 前隱藏靜態退路：app.js 有執行就不再顯示「需要 JavaScript」的假警告；app.js 沒執行／被擋時段落保留。 |
| `assets/style.css` | `.reading-fallback` 的可讀樣式；列印隱藏。 |
| `_includes/case-fallback-nav.html` | 導覽擴及 `evidence/` 與 `sources/pending.md`；`aria-label` 改為「閱讀導覽與證據代碼說明」。 |
| `_layouts/default.html` | 站名 `<h1>` 改為 `<p class="site-title">`。 |
| `assets/fallback.css` | `.markdown-body .site-title` 保留 Primer h1 的 32px、底線、間距與連結色。 |
| `scripts/check-fallback-reading.cjs` | `evidence/*.html` 與 `sources/pending.html` 也要求導覽；`INDEX.html`／所有 rendered 頁要求恰好一個 `<h1>`；catalog 的 `sources/pending.md` 也要有 rendered 頁。 |
| `tests/fallback-reading.test.cjs` | 新增 evidence／pending 缺導覽、重複 h1、INDEX 重複 h1 的 fixture；既有 fixture 補上頁面 h1。 |
| `tests/source-link-markup.test.cjs` | layout 契約改為站名 `<p>`、include 涵蓋 cases／evidence／pending。 |
| `tests/static-reading-fallback.test.cjs`（新） | 靜態 HTML 必須在表單前帶可見的本站索引連結；app.js 必須在 `load()` 前隱藏。 |
| `tests/static-reading-fallback-browser.cjs`（新） | 1440／390／320 × JS 停用／app.js 503：退路可見、索引連結在第一屏、可點、無水平溢出；正常載入時退路不可見。 |
| `tests/late-return.test.cjs` | guard 的結束標記不再假設 `});` 後立即接 `load();`（本輪在中間加了隱藏退路）；測試仍執行同一段 guard，13 項通過。 |
| `.github/workflows/website-qa.yml` | 在真正 Jekyll `_site` 建好後，於既有 8082 built preview 加跑新的 browser test；不在 pre-build preview 跑，因為 `preview.py` 不產生大寫 `INDEX.html`。不改觸發路徑或 concurrency。 |
| `README.md` | 515／507 → 529／521；示例拆分 34／411／76；34＋411＝445。 |

## 驗證

- 基準 `node --test tests/*.test.cjs`：**843 pass／0 fail**；最終 **850 pass／0 fail／0 skip**（新增 4 項 static、3 項 fallback-reading；`late-return` 仍 13 項）：[最終輸出](final-unit.txt)。`node --check assets/app.js`、`scripts/check-fallback-reading.cjs`、兩支新測試均通過。repo 沒有獨立 lint／type check，不宣稱執行。
- 本機 Jekyll 4.3.4＋primer 0.6.0＋`jekyll-optional-front-matter`／`jekyll-seo-tag`／`jekyll-titles-from-headings`，建置在 case-sensitive APFS volume（macOS 預設檔案系統不區分 `INDEX.html` 與 `index.html`，一般 `/tmp` 預覽會把兩者混在一起）：`PASS: 526 rendered case pages expose a clickable source; INDEX explains the evidence codes`：[checker](built-checker.txt)。526＝522 cases＋3 evidence＋1 pending。
- 同一 build 的 rendered DOM 前後對照（390×844）：[render-pages.txt](render-pages.txt)。`evidence`／`pending` 的 `data-fallback-case-nav` 由 false→true；`<h1>` 由 2→1；站名仍是 32px、底線、藍色連結；三頁均無水平溢出。
- 瀏覽器（Chromium；before＝正式站 `fd3d5f65`，after＝本機 build）：
  - app.js 503：before `fallback=false`、可見索引連結 0、`#error` 仍 hidden；after `fallback=true`、可見「完整案例索引」＋GitHub 原始索引、`#error` 仍 hidden（不冒充載入成功）。桌面與手機皆然：[before-after.json](before-after.json)、[before 桌面](before/blocked-desktop.png)／[手機](before/blocked-phone.png)、[after 桌面](after/blocked-desktop.png)／[手機](after/blocked-phone.png)。
  - 退路連結在第一屏：桌面 top 197–201／900，手機 206–212／844，320 亦通過；三尺寸水平溢出 0、pageerror 0。JS 停用與 app.js 503 都測：[built-fallback-browser.txt](built-fallback-browser.txt)。
  - 正常載入：`?q=會議#explore` 顯示 29／529，退路不可見；開啟 UC-094 詳情可讀成果主張／核讀與固定 revision 的來源，Escape 後查詢仍為「會議」：[built-smoke.txt](built-smoke.txt)。
  - evidence 013 的「互動閱讀器（需 JS）」實際開 `?case=UC-013` 詳情；pending 的「完整案例索引」實際到 rendered `INDEX.html`：同一 smoke 與 `evidence/pending` 導覽檢查通過。
- PR Website QA 的 artifact 另含 CI 實際產生的 `static-reading-fallback/{desktop,phone,narrow}-{js-disabled,app-js-503,normal}.png`；本紀錄保存 [CI 桌面 app.js 503](after/ci-desktop-app-js-503.png)、[CI 手機 JS 停用](after/ci-phone-js-disabled.png)、[CI 320 app.js 503](after/ci-narrow-app-js-503.png)，證明新測試在雲端真正跑過，不只在 localhost。
- 既有受影響 browser tests：`index-fallback-browser.cjs`（abort `catalog.json`，1440／390，含 retry 保留 query／scenario）通過；`hero-load-failure-browser.cjs`（1440／390／320）通過；`trust-browser.cjs` 的 JS-disabled `noscript` 檢查仍通過（頁尾 `<noscript>` 未移除）。

## 已知限制

- 本機 Jekyll 4.3.4 與 GitHub Pages 的 Jekyll 3.10／`jekyll-build-pages` 不同；伺服器端導覽與 h1 契約仍以 PR 的 Website QA 真正 `_site` 為最終證據。合併後另核對正式站 526 頁。
- 靜態退路只解決「app.js 沒執行」與「JS 停用」；如果 app.js 執行後 catalogue 仍失敗，走既有的 `#error`／hero 失敗區，不是這個段落。
- `INDEX.html` 的 522 列在 390px 仍是主題表格；本輪不改表格排版。
- 未做真人使用者研究、實體手機或讀屏實聽；axe／效能不是本輪主題，沒有新的全站無障礙或效能認證。
- `README.md` 不發布到 Pages（正式站 `/README.html` 為 404），所以這項修正只影響 GitHub 讀者。

## 獨立審查

`ReadingFallbackReview`（另一個任務上下文，未參與實作）初審只有一個 P1：新的 browser test 原本排在 pre-build preview，`preview.py` 不產生大寫 `INDEX.html`，CI 點擊會 404。已把測試移到 `actions/jekyll-build-pages` 之後的 8082 built preview；複審確認 (1) 只在真正 build 後執行、(2) 不再依賴 preview.py 的 INDEX、(3) env／工作目錄／artifact 路徑有效，**no new issue**。reviewer 另以 focused tests 重跑 static fallback／fallback reading／source-link markup／late return 共 38 項通過；沒有把「agent 說通過」當成主 agent 自己的驗收。

## 發布

- 已提交 `d095207dacfe1eac038933750a649b00b410e8ec`（16 檔）與 `e6d3aeee37d22e90c2b65f674e5dc939275b4cba`（15 個 QA 證據檔），已推送分支 `improve/2026-11-16-reading-fallback`，建立 [PR #417](https://github.com/RichardHan/ai-agent-use-cases/pull/417)。[獨立審查 comment](https://github.com/RichardHan/ai-agent-use-cases/pull/417#issuecomment-6901740155) 對應同一 head。
- PR 檢查：**16 pass／2 skipped**（PR 上 `published` 依既有規則 skipped，不當成通過）；[Website QA 43763518470](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43763518470) 12m00s success，含 `Verify fallback reading pages`、`Verify failure recovery against built Pages index`（實際 `_site` 上跑新的 browser test）與 Jekyll build。合併前 head `e6d3aeee…`、base `bede0925c0…`、mergeState CLEAN；未繞過保護（main 無 protection／required checks，本輪仍等完 checks）。
- 2026-11-15T21:37:04Z 正常 merge 為 `75b80718faf752f295fb26d3f72c2d9c889bbd35`。
- [Pages 43764678015](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43764678015) 對 merge SHA success（build／upload／report；只有 GitHub 管理的 ubuntu-latest 遷移警告，未造成失敗）。[主線 Website QA 43764678475](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43764678475) **success**，21:37:06–21:49:42Z（12m36s），head `75b80718…`：`Verify built Pages corpus` 526 來源逐位元、`Verify fallback reading pages` PASS 526、`Verify failure recovery against built Pages index` 的 built-site 新測試 PASS（桌面 top 189／900、手機 185／844）、`Wait for published assets and content` 回報 `PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH 75b80718…`、`PUBLICATION_MODE: exact`、`PUBLISHED_LIVE_BUILD_CURRENT 75b80718…`，以及桌面／手機 `PASS LIVE`：[摘錄](live/main-qa-excerpt.txt)。`Fail when…` 依預期 skipped，不是關閉檢查。
- 正式 `catalog.json.sourceRevision` 精確等於 `75b80718…`、`bundleRevision` `20261115213744508609921`、`builtAt` 2026-11-15。`index.html`／`assets/app.js`／`assets/style.css`／`assets/fallback.css` 四個變更檔逐位元等於合併版本：[live/report.json](live/report.json)。
- 正式站實際走查（1440×900／390×844）：`?q=會議#explore` 29／529、退路隱藏；UC-094 詳情來源固定 merge SHA、Escape 後查詢仍「會議」。app.js 503 時退路可見、索引連結在第一屏、點入 rendered `INDEX.html`（標題含完整案例索引）；evidence 013 有導覽且只有一個 h1，「互動閱讀器」開 `?case=UC-013`；pending 有導覽且索引可回；`?q=旅遊&kind=pending` 0 筆→移除狀態 36 筆且無水平溢出。pageerror 0：[live/verify.txt](live/verify.txt)、[桌面 blocked](live/desktop-blocked.png)／[手機](live/phone-blocked.png)、[桌面 evidence](live/desktop-evidence.png)、[手機空結果復原](live/phone-empty-recovery.png)。
- 狀態分開陳述：**已提交、已推送、已合併、Pages 部署成功、正式站已驗證**；主線 Website QA 亦已 success（見上），不以 Pages 成功代替。
- 發布後以只改 `docs/qa/`、`SITE.md` 的接續 PR #418 保存證據（merge `a3d8a969a453eda7b4b3428759a947105a1f43ca`，[Pages 43765959690](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43765959690) success）。正式站 `sourceRevision` 因此變成 docs-only 版本 `a3d8a969…`、`bundleRevision` `20261115215141688590315`；產品變更檔仍未變。以同一支 live check 對 `a3d8a969…` 重跑 exit 0：四個產品檔逐位元相同、29／529、退路隱藏、app.js 503 退路、evidence／pending 導覽、UC-094 固定來源與空結果復原全部通過：[report-final.json](live/report-final.json)、[verify-final.txt](live/verify-final.txt)。之後若只再提交紀錄，產品位元比較仍是判準，不把 sourceRevision 變動當成產品回歸。
