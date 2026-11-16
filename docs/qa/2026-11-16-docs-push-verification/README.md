# 2026-11-16：main 的每一次部署都要有發布判決

## 基準與選題

- 起始：原工作樹乾淨在 `2a842347`；讀完 README、SITE.md、`_config.yml`、Website QA 與最近 `docs/qa/2026-11-16-readme-count*` 後，`origin/main` 已前進到 `2b332a29`（PR #435 與 docs-only #436 已由前一個工作階段合併）。本輪從 `2b332a29` 建 `/tmp/aiuc-r7`、分支 `improve/2026-11-16-docs-push-verification`；原工作樹與其他 worktrees 未修改。
- 無 repo／父層 `AGENTS.md`；沿用既有流程。
- 基準 `node --test tests/*.test.cjs`：**871 pass／0 fail**（main `2b332a29`；PR #435 的 Website QA 也回報 871）。
- Actions 基準：最近 200 個 run **0 個真實失敗**，70 個 cancelled 全是 PR 被下一個 push 取代（`cancel-in-progress` 只作用於 PR）。本輪不改任何檢查、不重跑歷史失敗。
- 三個唯讀調查：`DeployAudit`（Actions／發布觸發）、`VisitorAudit`（三個訪客情境）、`ContentAudit`（內容／資料品質），都是獨立任務上下文；三者都沒有編輯權，回報見本輪對話與 `agent://` 紀錄。主模型實際為 `litellm/deepseek-flash-gmi`；工具沒有提供切換 gpt-6.1-terra／gemini 的介面，未宣稱使用指定模型或最高推理設定。
- 目標使用者：維護者與準讀者。維護者每次合併都在問「正式站現在是哪個版本、這次部署有沒有被驗證」；讀者則在部署失敗、正式站停在舊版時看到與維護紀錄不一致的內容。

## 可重現問題

GitHub Pages 對 default branch 的**每一次 push** 都重新建置與部署，包含只改 `docs/**` 或 `SITE.md` 的 commit。這兩個路徑被 `_config.yml` 排除在發布產物之外，但建置仍會重寫 `catalog.json` 的 `builtAt`（當日）、`bundleRevision`（`site.time` 到奈秒）與 `sourceRevision`（`site.github.build_revision`）。因此那是一次**新的建置**，而唯一會等待它、讀取 Pages run、並在無法核對時轉紅的步驟（Website QA 的 `Wait for published assets and content` → `Fail when the published site cannot be verified`）卻被 push `paths` 過濾掉了。

證據（`gh api .../actions/runs?head_sha=<sha>`，見 `unverified-main-pushes.txt`）：

| main commit | 變更 | Pages run | main Website QA run |
| --- | --- | --- | --- |
| `2b332a29` | SITE.md＋docs | [43808036280](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43808036280) success | **不存在** |
| `2a842347` | SITE.md＋docs | [43799629930](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43799629930) success | **不存在** |
| `79f89cc1` | docs | success | **不存在** |
| `a648d601` | docs | success | **不存在** |
| `a178bc70` | docs | success | **不存在** |
| `f2adf6db` | docs | success | **不存在** |
| `a7fe5990` | 產品＋測試 | 43806489563 success | [43806490369](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43806490369) success（`PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH a7fe5990`、`PUBLICATION_MODE: exact`） |

最近 12 個 main commit 中 **7 個有部署、沒有發布判決**。不是單一例外，而是 docs-only 合併的常態；本輪開始前 live `catalog.json` 的 `sourceRevision` 正是沒有被判決的 `2a842347`。

若該次部署失敗，會發生什麼：Pages run 紅在 Actions，但沒有任何 workflow 會把它連到「這次 push 沒有上線」。正式站停在舊 revision，`catalog.json` 指向舊 commit，而維護紀錄已寫「已發布」。這個 repo 已被同型事故燒過一次（2026-11-10 deploy 失敗、main 靜默停在舊版，見 `docs/qa/2026-11-13-publication-verdict/README.md`），差別只在當時的 commit 有內容變更。

## 兩個方案

1. **把 `SITE.md`、`docs/**` 加進 push `paths`**：2 行、不改邏輯，重用既有 hardened gate。價值是補上這兩個路徑；成本是每個 docs-only push 跑一次完整 job；風險是下一個被排除的路徑（新的 `qa-*/`、未來新增的 maintenance 目錄）再次靜默漏掉，需再補一次。
2. **移除 main push 的 `paths` 過濾（選定）**：凡 main push 一律跑 Website QA。價值是判決跟著「部署」而不是跟著「檔案清單」——任何被 `_config.yml` 排除、卻仍觸發 Pages 重建的路徑都自動涵蓋，不必維護第二份清單；成本與方案 1 相同（main push 本來就多為產品變更，實際只增加 docs-only merge 的次數）；風險是 docs-only 合併現在也會跑瀏覽器走查，若遇到與變更無關的 flake 會讓 main 轉紅。

選 2 的理由：這個 repo 已經吃過「用一份手寫清單描述另一個系統的行為」的虧（`paths` 之於 Pages 的建置條件）。把判決綁在事件上而不是路徑上，才不會在下次新增排除目錄時再漏。flake 風險用既有限制控制：`cancel-in-progress` 仍只作用於 PR、main 判決不被取消；真的遇到 flake 時依既有流程診斷，不刪檢查。

驗收條件：

- main push 不再有 `paths` 過濾；PR 過濾維持不變（PR 回饋速度不受影響）。
- 新的靜態守則在基準 workflow 上先紅（列出被過濾的 push trigger），移除過濾後轉綠；全套 unit suite 綠。
- 一個只改 `SITE.md`＋`docs/**` 的 main 合併，會出現該 SHA 的 Website QA run，且 log 出現 `Pages deployment for <sha>: succeeded`、`PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH <sha>`、`PUBLICATION_MODE: exact`；正式站 `catalog.json.sourceRevision` 等於該 SHA。
- 不改任何既有檢查、步驟、逾時或斷言；不改產品 UI、案例內容或資料。
- 範圍外：不改 PR 觸發、不新增 workflow、不做「每次 main push 另開 publication-only job」的第二次判決來源。

## 實作

- `.github/workflows/website-qa.yml`：移除 `push.paths`，保留 `branches: ['main']`，並在原地留言說明「Pages 對每次 main push 重建，這個 run 是唯一等待並判定該部署的地方，不要加 paths」。PR 的 `paths` 完全不動。
- `tests/deploy-trigger.test.cjs`（新增，2 項）：
  - 讀 `website-qa.yml` 的 `push:` 區塊，要求沒有 `paths:`（用 `assert.doesNotMatch`，不是樣本清單）。
  - 要求 push job 仍包含 `Wait for published assets and content` 與 `Fail when the published site cannot be verified`，避免為了觸發而把判決步驟拿掉。
- 沒有新增依賴、workflow、追蹤器或第三方請求。

## 驗證

- 先紅後綠：把基準 `2b332a29` 的 workflow 放回工作樹跑新測試 → **1 fail／1 pass**，失敗訊息列出被過濾的 push trigger（`red-baseline.txt`）；換回修正版 → **2 pass／0 fail**（`green-fix.txt`）。
- 全套 `node --test tests/*.test.cjs`：871 → **873 pass／0 fail**（`full-unit.txt`）。既有 `visitor-experience-and-ci.test.cjs` 的「main push 最多 3 個 workflow」與 `pr-gate-coverage.test.cjs` 的單一全套 runner 都仍綠，沒有為了新觸發放寬任何守則。
- PR 與合併後的實際 run、docs-only 證明的 run、正式站 `sourceRevision` 見下方「發布與正式站核對」。

## 已知限制

- 不在正式 repo 故意讓 Pages 部署失敗，所以「docs-only 部署失敗會轉紅」只有既有 `publication-gate.test.cjs`／`published-version` 的 `failed → fatal` 覆蓋，沒有本輪注入證據。
- 這不改善訪客看到的內容；本輪沒有產品檔案變更。
- docs-only 合併現在也會跑 1440／390／320 的瀏覽器走查；若日後出現與 docs 無關的 flake，main 會紅，需依既有診斷流程處理，而不是把 `paths` 加回去。

## 本輪未處理的候選（獨立調查）

1. `主題分類` 有 362 個選項、其中 361 個只有 1 篇（宣告值近乎自由文本）。可行的小改是讓 `#facet-count-hint` 用執行期算出的選項數與單篇數說明形狀；不動宣告值、URL 與配對邏輯。下一步先量 1440／390 的提示可讀性與 `declared-category-browser.cjs` 的字串斷言。
2. 工具 facet 只有 10 個固定名稱；`- 工具：` 標頭明示 Claude Code 21 頁、Codex 29 頁，但全頁字面比對會把 commit 共同作者、README 安裝說明、明確排除的他作也算進來（Claude Code 估 6–9／42 頁假陽性）。這需要專屬 pattern 與新排除句，屬獨立一輪。
3. `- 實作門檻：` 只有 28／525 頁宣告，其餘 497 頁是關鍵字推測；UI 已標示推測，但仍是 95% 推測的 facet。要不要改資料或改文案需另一輪判讀。
4. 無 JS 或 `assets/app.js` 被擋時，首頁結果區仍停在「正在讀取案例…」；靜態退路在搜尋框上方可見，但不在結果區。本輪實測兩種情況都仍有 `INDEX.html` 出口，因此列為候選而非缺陷。
