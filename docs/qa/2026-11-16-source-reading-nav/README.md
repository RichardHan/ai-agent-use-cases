# 2026-11-16：來源與計數紀錄頁不再是死路

## 基準與選題

- 起始：原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 乾淨在 `a345bf5d`、`main` 落後 `origin/main` 10 個 commit。安全 fetch 後從 `origin/main` `37f0e701` 建 `/tmp/aiuc-r9`、分支 `improve/2026-11-16-source-reading-nav`；過程中 main 前進到 `95924cf2`（PR #441 變體頁計數、#442／#443 發布紀錄），分支以 stash／rebase 跟上，原工作樹與其他 worktree 未修改。
- 無 repo／父層 `AGENTS.md`；沿用 README、SITE.md、`_config.yml`、Website QA 與最近 `docs/qa/2026-11-16-docs-push-verification/README.md` 的流程。維護紀錄位置是 `SITE.md`（最新在最上方）。
- 基準 `node --test tests/*.test.cjs`：**884 pass／0 fail**（`95924cf2`）。正式站 `catalog.json.sourceRevision` 在開始時等於 `37f0e701…`，本輪期間前進到 `95924cf2…`，兩次都與 main 一致。
- Actions 基準（獨立調查 `DeployReliabilityAudit`，讀最近 200 個 run）：**0 個 failure**、49 個 cancelled 全是 PR 被下一個 push 取代（`cancel-in-progress` 只作用於 PR）、main 自 `a9446aa8` 之後每個 SHA 都有 Website QA 判決。`hashFiles('tests/discovery-browser.cjs') != ''` 仍罩住整個瀏覽器步驟，是一個「檔案改名就靜默跳過 30+ 支瀏覽器測試」的收緊候選，但現在檔案存在、不是現行故障，列為下一輪。
- 主模型實際為 `litellm/deepseek-flash-gmi`；工具沒有提供切換 gpt-6.1-terra／gemini 的介面，未宣稱使用指定模型或最高推理設定。三個唯讀調查（`DeployReliabilityAudit`、`FacetDataAudit`、`VisitorFlowAudit`）與獨立 reviewer `SourceNavReview` 都是獨立任務上下文。
- 目標使用者：從首頁統計卡點「逐案核對標準與排除理由」、或從案例頁點「候選審查與證據缺口」而抵達來源紀錄頁，想判斷這個數字可不可信、然後繼續找案例的訪客。

## 可重現問題

`sources/*.html` 是支撐可信度主張的紀錄頁，而且訪客是從站內連過去的：

- 首頁統計卡 → `sources/qualification-audit-2026-10-16.html`（桌面 44.6k px、手機 86.3k px）。
- 15 個案例頁共 21 個連結 → 各批次 `sources/research-*.html`（例：`cases/006-facebook-publication.md:163`）。
- `INDEX.md`、`README.md` 也指向計數稽核與來源清單。

但 `_includes/case-fallback-nav.html` 只認 `cases/`、`evidence/` 與 `sources/pending.md`。實測正式站 `95924cf2`：

| 頁面 | 站內出口 |
| --- | --- |
| `sources/qualification-audit-2026-10-16.html` | 只有頁首站名連結；「案例索引」指向 GitHub blob（離開本站） |
| `sources/research-2026-10-22-0520.html`（UC-006 連過去） | 只有頁首站名連結 |
| `sources/index.html`（來源與待查清單） | 只有頁首站名連結 |
| `sources/pending.html` | 有導覽（唯一例外） |

`sources/` 下 294 個 rendered 頁面中只有 1 個有導覽。可重現證據：把這 294 頁抓下來跑新版 checker → `FAIL: fallback reading has 293 problem(s)`，全部是 `missing the source-page fallback navigation`（[`fallback-check-before.txt`](fallback-check-before.txt)）。

## 兩個方案

1. **只補計數稽核那一頁**（在它的 front matter 加導覽）：改動最小，但另外 292 頁（含 21 個案例頁連過去的批次紀錄）仍是死路，而且下一個新增的 ledger 會再漏一次。
2. **把導覽延伸到整個 `sources/`，並讓建置檢查逐一要求**（選定）：`cases/`、`evidence/`、`sources/pending.md` 保留原本的證據代碼圖例與互動閱讀器連結；其餘來源頁只給兩個站內出口與一句邊界說明，並由 `check-fallback-reading.cjs` 對 `_site` 逐一驗證。

選 2 的理由：問題的類別是「有一整類已發布頁面不在閱讀流程裡」，不是單頁遺漏。既然 repo 已經有一支在真實 `_site` 上跑的建置檢查，把規則放進同一支，才不會在下一次新增 ledger 時再漏。成本是 293 個頁面的 HTML 會變（多出約 101 px 高的導覽），以及 checker 的枚舉從 1 頁變成 294 頁。

驗收條件：

- 每個 `sources/*.md` 都有 rendered 頁，且頁面上有唯一、可見的導覽，連到站內 `INDEX.html` 與首頁。
- 來源頁不得借用案例頁的「誰提出主張」圖例，必須說明「不是案例成果」與「尚未列成案例的線索看哪裡」。
- 案例頁、`evidence/`、`sources/pending.html` 的輸出與改動前逐字相同。
- 缺頁、缺導覽、導覽重複或被隱藏，建置檢查要轉紅。
- 桌面與手機都不產生水平溢出；不改案例內容、證據等級、計數、搜尋或篩選。

## 實作

- `_includes/case-fallback-nav.html`
  - 分成 `is_case_page`（`cases/`、`evidence/`、`sources/pending.md`）與 `is_source_page`（`sources/`），兩者任一即渲染。
  - 來源頁：`aria-label="來源紀錄的閱讀導覽"`、兩個站內連結、`<p class="case-fallback-claim">本頁是來源與計數紀錄，不是案例成果。成果主張與驗證狀態以對應案例頁為準；尚未列成案例的線索，以本頁與待查清單的紀錄為準。本庫未獨立重現。</p>`；沒有圖例、沒有互動閱讀器連結。
  - 案例頁分支完全不動（以 liquidjs 逐頁比對改動前後輸出，四類頁面 `IDENTICAL`，見 [`include-render-matrix.txt`](include-render-matrix.txt)）。
- `scripts/check-fallback-reading.cjs`
  - 枚舉 `_site/sources/*.html`；來源頁缺導覽、導覽重複（`>1`）、aside／內層 `nav`／連結被 `hidden`／`display:none`／`aria-hidden`／sr-only 隱藏，都失敗。
  - 來源頁的邊界句必須同時出現「不是案例成果」「案例頁」「待查清單或待查線索」。
  - `sourceLedgerManifest()` 從 checkout 的 `sources/*.md` 建清單（跳過 `.`／`_` 開頭，與 `scripts/published-check.cjs` 一致），逐檔要求 rendered 頁（`README.md` → `sources/index.html`）。
  - 「必須有可點外部來源」仍只要求案例頁：實測 6 個批次頁本來就 0 條外部連結（例如 `research-2026-10-22-1900.md`），那是「這批沒有合格案例」的正常結果。
- `tests/fallback-reading.test.cjs`（+7）：來源頁缺導覽、借用案例圖例、0 條批次、`index`＋`pending` 同時受檢、缺 rendered 頁、重複／隱藏導覽、manifest 命名規則。
- `tests/source-link-markup.test.cjs`：include 覆蓋範圍改為 `sources/`，並要求來源頁不得取得案例專屬的圖例與互動閱讀器連結；`sources/pending.md` 仍走案例處理。
- `README.md`：一句話說明來源與計數紀錄頁也帶同一組站內返回連結。
- 沒有新增依賴、workflow、追蹤器或第三方請求；沒有改案例內容、證據等級、計數或搜尋行為。

## 驗證

### 先紅後綠（真實 `_site` 的頁面 HTML）

- 紅：正式站 `95924cf2` 的 294 個 `sources/*.html` + `INDEX.html` + 3 個 `evidence/*.html` → **FAIL：293 problems**，逐筆列出缺導覽的頁面（[`fallback-check-before.txt`](fallback-check-before.txt)）。
- 綠：用 liquidjs 10.30.1 渲染改後的 include、依 `_layouts/default.html` 的位置注入同一批頁面 → **PASS：297 rendered pages**（[`fallback-check-after.txt`](fallback-check-after.txt)）。
- CI 的真實建置：PR 的 Website QA `Verify fallback reading pages` 在真正的 `_site` 上回 **PASS：822 rendered pages**（見 [`ci-jekyll-build.txt`](ci-jekyll-build.txt)）；這是 Jekyll 產物，不是本機模擬。

### 測試與靜態檢查

- 全套 `node --test tests/*.test.cjs`：884 → **889 pass／0 fail**（[`full-unit.txt`](full-unit.txt)）。
- `node --check`：`scripts/check-fallback-reading.cjs` 通過。
- `node scripts/check-published-surface.cjs` → **PASS：838 檔、5.90 MiB、排除 9 項**。
- `python3 scripts/check_corpus_bundle.py` 對模擬 `_site` → **PASS：529 sources byte-for-byte identical**；CI 對真實 `_site` 同樣 PASS。
- 來源 Markdown 正文沒有變更，所以發布閘門的 raw 位元比對不受影響；改變的是 293 個 rendered 頁面的 HTML。

### 來源頁走查（模擬建置，桌面 1440×900／手機 390×844）

模擬建置 = 真實頁面 HTML + 渲染後的 include + 正式站主題 CSS（本機沒有 `jekyll`，見已知限制）。數值在 [`live-overflow-before-after.json`](live-overflow-before-after.json)、[`emulated-flow-after.json`](emulated-flow-after.json)：

| 頁面 | 導覽 | 導覽 top | 水平溢出 | h1 |
| --- | --- | --- | --- | --- |
| 計數稽核（桌面／手機） | 有 | 32 | 0／0 | 1 |
| 批次 ledger（桌面／手機） | 有 | 32 | 0／0 | 1 |
| 來源清單 `sources/index.html` | 有 | 32 | 0／0 | 1 |
| `sources/pending.html`（未變） | 有（案例版） | 32 | 0／0 | 1 |

- 點「← 完整案例索引」→ `INDEX.html`（title「完整案例索引」）；點「搜尋首頁」→ 站首頁。
- 批次 ledger 的導覽有 0 個證據代碼圖例；`pending.html` 仍是「誰提出主張，不等於誰驗證」。
- 鍵盤：進入來源頁後第一個 Tab 停在「← 完整案例索引」。
- pageerror 0。8 張前後截圖（同頁、同尺寸、同資料狀態）在本目錄：`before-*.png`／`after-*.png`。

### 三情境（正式站 `95924cf2`，桌面＋手機）

[`live-three-scenarios-before.json`](live-three-scenarios-before.json)：

1. 首頁任務入口「日報」→ 80／532 筆、24 張卡。
2. `?q=發票&tool=Cursor&scenario=學習` → 0／532、空結果面板可見，提供「移除提及工具 Cursor → 查看 1 筆」等；按「清除全部條件」→ 532／532。
3. `?case=UC-014` 直鏈 → 詳情開啟、21 個外部來源、第一個固定在 `95924cf2…`、`target="_blank"`、`rel="noopener noreferrer"`；Escape 後焦點回 `#results-count`。

三情境 pageerror 0、水平溢出 0。

## 獨立審查

`SourceNavReview`（獨立 context，未參與實作）對 head `2316837a4f` 提出 3 個 P2，全部修正後複核：

1. **文案對「整批 0 新增」的頁面沒有下一步**：`sources/research-2026-10-22-0050.md` 新增合格 0、沒有案例編號，只寫「看對應案例頁」會把人帶去不存在的頁。修正：改寫成「尚未列成案例的線索，以本頁與待查清單的紀錄為準」。
2. **只枚舉已生成的頁面，漏掉沒渲染的 ledger**：`sources/README.md` → `sources/index.html` 這種映射也不在舊清單裡。修正：`sourceLedgerManifest()` 從 checkout 建清單並逐檔要求 rendered 頁，新增回歸測試。
3. **導覽可能被隱藏或重複**：舊版只看 aside 有沒有出現。修正：計數 `>1` 失敗；aside、內層 `nav`、每個連結都套用既有的 `hiddenTag()`（`hidden`／`display:none`／`aria-hidden`／sr-only）。

第二輪複核再指出兩個邊界，也已修正：混合批次（`sources/research-2026-11-16-0827.md` 同時有新增案例與未收錄候選）與 `sources/README.md` 的 S-002 只有待查線索——文案改成不假設一定有案例頁；以及 CLI 若把 `.`／`_` 開頭的 `.md` 算進清單，會對 Jekyll 不發布的檔案要求頁面——manifest 與 `scripts/published-check.cjs` 對齊。複核確認無 P0／P1。

複核者未自行重跑測試或建置；上面所有數字由主 agent 執行。

## 發布與正式站核對

- 已提交 `2316837a4f`、`59e652e69a`、`d3073781e6`、`46712edce4`，PR [#444](https://github.com/RichardHan/ai-agent-use-cases/pull/444)；合併 `dea106715818e8812cd7a80dac22093b45b74292`（merge commit，base `95924cf2`）。
- PR checks（head `46712edce4`）：Website QA [43826329683](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43826329683) success、Corpus bundle QA success、Reader QA success、Search context QA success。同一 head 的 Website QA 在真實 `_site` 上回 `PASS: 822 rendered pages`（[`ci-jekyll-build.txt`](ci-jekyll-build.txt)）。
- 主線判決：[Website QA 43828087586](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43828087586) success——`# tests 889`／`# pass 889`、`PASS: 822 rendered pages`、`Pages deployment for dea10671…: succeeded`、`PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH dea10671…`、`PUBLICATION_MODE: exact`、`PUBLISHED_LIVE_BUILD_CURRENT dea10671…`、兩個 `PASS LIVE`。Pages [43828086891](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43828086891) success。
- 正式站：`catalog.json.sourceRevision` 精確等於 `dea106715818e8812cd7a80dac22093b45b74292`。用**部署後**的頁面重跑新版 checker → **PASS：297 rendered pages**（`sources/` 294 頁 + 3 個 `evidence/` + `INDEX.html`）。
- 正式站走查（[`live-three-scenarios-after.json`](live-three-scenarios-after.json)、[`live-after-*.png`](.)，桌面 1440×900／手機 390×844）：
  - 首頁統計卡 → 計數稽核頁：導覽可見（top 32）、兩個站內連結、0 個證據代碼圖例、h1 = 1、水平溢出 0；「完整案例索引」到 `INDEX.html`、「搜尋首頁」回首頁並顯示 532／532。
  - UC-006 → 批次 ledger：導覽與邊界句可見、0 個圖例、水平溢出 0；「搜尋首頁」回首頁 532／532。
  - 三情境未退化：「日報」80／532、`?q=發票&tool=Cursor&scenario=學習` 0／532 → 清除全部條件 532／532、`?case=UC-014` 21 個來源且固定 `dea10671…`、Escape 後焦點回 `#results-count`；pageerror 0、水平溢出 0。
- 限制：本輪改的是 293 個 rendered 頁面的 HTML 與 1 個 include；`sources/*.md` 正文未變，所以發布閘門的 raw 位元比對與 `catalog.json` 的 corpus 清單都不受影響（`PASS: 529 sources byte-for-byte identical`）。

## 已知限制

- 本機沒有 `jekyll`／Gemfile（`actions/jekyll-build-pages` 只在 CI 跑），所以本機的「綠」是頁面 HTML 加渲染後 include 的模擬；真正的 Jekyll 產物由 PR 的 Website QA 建置，`Verify fallback reading pages` 在 `_site` 上回 PASS 822 頁。
- 導覽只在頁首。86k px 的稽核頁捲到深處仍要靠瀏覽器返回或捲回頂端；底部返回連結不在本輪範圍。
- 靜態檢查只看得到 inline 的 `display:none`／`hidden`／`aria-hidden`／sr-only，看不到外部 CSS 隱藏；目前樣式沒有這種規則。
- 截圖是 headless Chromium 的 agent 走查，不是真人研究；未用實體手機、讀屏實聽或 Firefox 交叉重跑。
- 本輪沒有改動案例內容、證據等級、合格數、搜尋或篩選；`sources/*.md` 正文一個字都沒改。

## 本輪未處理的觀測（下一輪候選）

1. `website-qa.yml:85` 的 `if: ${{ hashFiles('tests/discovery-browser.cjs') != '' }}` 罩住整個「Verify the updated site in Chromium」步驟（30+ 支瀏覽器測試）。該檔改名或刪除時，main 仍會綠燈但零瀏覽器驗證，而 `tests/` 沒有任何守則。收緊方式：移除條件，或加一條「這個檔案必須存在」的守則。
2. `主題分類`：525 案中 366 案宣告、361 種值、其中 360 種各只有 1 案（唯一重複值 `工作流程／發布期用途` 6 案）；159 案未宣告。挑一個分類幾乎必然只看到 1 案，且 248 案的分類欄其實是 `、` 串起來的標籤。可行的小改是用執行期算出的「N 個選項中 M 個只有 1 篇、K 案未宣告」說明形狀，不動宣告值。
3. `工具`：選項只有 10 個固定名稱，但案例頁 `- 工具：` 已宣告 Claude Code 21 案、Codex 29 案，這些完全無法被篩；Grok Bot 一個值吃掉全庫約 77%。這是資料正確性問題，需要另一輪判讀。
4. 只改篩選再按瀏覽器上一頁會離開本站（`app.js` 只對 explicit submit 用 `pushState`，有註解說明是設計），README 沒有交代。要不要補一句說明需另判。

## 下一輪

1. 先做 `website-qa.yml:85` 的 `hashFiles` 收緊：這是唯一已確認、會讓 main 綠燈卻沒有跑 30+ 支瀏覽器測試的路徑。驗證方式是把 `tests/discovery-browser.cjs` 暫時改名，確認新守則轉紅，再還原。
2. 再處理 `主題分類` 的形狀說明（純文案 + 執行期計數，不動資料）。

不要把模擬建置說成 Jekyll 產物，也不要把 agent 走查說成真人研究。
