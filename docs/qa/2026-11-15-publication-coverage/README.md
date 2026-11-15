# 2026-11-15：採用文件的發布驗證覆蓋

## 基準與選題

- 原工作樹 main 乾淨，HEAD／安全 fetch 後 origin/main 均為 `564ecdb3becd7f03978951337eaf157f3ab8de68`。GitHub 身分 RichardHan，無開啟中的 PR；既有四個外部 worktrees 保留。Orca 建立隔離分支 `RichardHan/publication-coverage-20261115`，路徑 `/Users/richard_han/orca/workspaces/ai-agent-use-cases/publication-coverage-20261115`。無 repo／父層 AGENTS.md；沿用 README、SITE、最近 bot-account-attribution QA、Website QA 與 Pages 設定。
- 主模型實際為 `openai-codex/gpt-6-astra`。當次 `omp models find` 列出 `factory-droid/gpt-6.1-terra`／`litellm/gpt-6.1-terra`（low／medium／high／xhigh／max）；`gemini3.8` 無結果，`gemini-3.8-flash` 有多 provider（low／medium／high），未證實使用者環境標籤的對應。`task.perCallModel=off`、defaultThinkingLevel=auto；未改設定或付費通道，不宣稱用了 Terra／Gemini／最高推理。
- 本輪正式 HTTP 探測：`templates/case.md` 5259 bytes、`README.md` 19463、`INDEX.md` 244694、`README-archive-2026-10-18.md` 13880，均 200 且逐位元等於基準。沒有觀測到這四份正式文件已發布錯誤。
- 真正問題是發布閘門盲點：上述原始文件不在 `PUBLISHABLE_FILE`／`servedAssets`，只改文件的 superseded push 被當成沒有發布變更，exact 分支也不讀它們。這些文件包含採用限制、收錄規則與索引，不能以其他資產正確就推定它們正確。

方案：①固定補四個 URL，成本小但新範本容易漏驗；②沿用共同檔案分類，從 build 收集原始文件，沿用 exact 位元／superseded live revision blob 比對。選②，不另造發布系統。

驗收：拒絕舊版原始文件；接受正確新版；改名須新文件正確且舊 URL 404／410，503 不是消失證據；刪除後被後續版本恢復須比對恢復內容。保留 ancestry、原等待上限與所有既有檢查。

範圍：頂層 README／歷史 README／INDEX Markdown 及現有命名規則 `templates/[A-Za-z0-9_-]+.md`。不改 UI、案例、計數或 workflow 觸發規則；不宣稱覆蓋全部發布面。`audit-summary.json` 是 Liquid 產物，不能把原始 JSON 模板 hash 當成發布內容；它及 superseded 衍生 HTML 留待獨立設計，`INDEX.html` 的 exact 比對原本就存在。

## 實作與回歸

- `scripts/published-check.cjs`：原始採用文件加入 push change 分類，改名／刪除沿用既有規則。
- `tests/published-version.cjs`：從 build 根目錄、assets、templates 以同一分類收集位元；不把 generated JSON／HTML 當原始 blob。
- `tests/published-version.test.cjs`：四份文件各 exact／superseded 故障注入，以及改名、503、404、刪除後恢復，共十項消費者可見發布錯誤回歸。`tests/published-check.test.cjs` 更新 INDEX 的契約期待。
- 基準 `node --test tests/*.test.cjs`：770 pass／0 fail：[輸出](baseline-unit.txt)。初版測試 fixture 錯將案例 blob 也改成文件內容，原輸出保留 [red-unit](red-unit.txt)；修正 fixture 隔離後十項全紅，多數為 `Missing expected rejection`：[精確重現](red-isolated.txt)。不是在正式站注入錯誤。
- 最終同指令：780 pass／0 fail／0 skip：[輸出](final-unit.txt)。`node --check scripts/published-check.cjs`、`node --check tests/published-version.cjs` 成功。repo 沒有另外定義 lint／type check，不冒稱執行。
- `python3 scripts/preview.py /tmp/publication-coverage-preview/ai-agent-use-cases` 成功；`node scripts/check-published-surface.cjs`：833 檔／5.84 MiB／9 項排除通過。preview 是靜態預覽，不是 Jekyll build；真正 Jekyll 交由 PR Website QA 驗證。

## 訪客驗收與限制

正式站：<https://richardhan.github.io/ai-agent-use-cases/>。本輪預覽：<http://127.0.0.1:8137/ai-agent-use-cases/>（僅本機，非永久公開服務）。8081 已被其他程序使用；未停用該程序，改用 8137。工具曾錯把既有 listener 當 readiness，已回報工具問題。

主 agent 用 Orca 實際瀏覽器走查 1440×900／390×844：首頁「收件匣與郵件」得到 164 筆，開 UC-014 可讀方法／來源／未實跑界線；原始 Markdown 開新分頁，GitHub 固定 `564ecdb3…` 頁面實際載入且有 UC-014；Escape 返回保留收件匣並聚焦原按鈕。手機 `?q=UC-014&scope=topic&tool=Cursor#explore` 為零筆，點「移除提及工具 Cursor」恢復一筆，關鍵字／topic 保留，無水平溢出。[手機復原截圖](baseline-recovery-mobile.png)。這是機器操作，不是真人使用者研究。

`NODE_PATH=/Users/richard_han/orca/ai-agent-use-cases/node_modules DEPLOYED_URL=http://127.0.0.1:8137/ai-agent-use-cases/ GITHUB_SHA=564ecdb3becd7f03978951337eaf157f3ab8de68 node tests/deployed-browser.cjs`：桌面／手機首頁、搜尋、情境、直鏈重整、返回與組合空結果復原通過；最後 JS-disabled `INDEX.html` 檢查失敗，因 preview.py 不產生 Jekyll HTML。[完整非影像日誌](preview-browser.txt)。不把這次整體 exit 1 說成全過，不改產品或放寬斷言以配合預覽器。

無 UI 變更，故沒有視覺改版前後比較。環境停用影像輸入，保存實際截圖及 DOM／幾何證據，不宣稱逐像素目視、實體手機或讀屏實聽。局部 axe 掃描結果見 browser 日誌，不等同全站無障礙認證；未做效能基準。

## Actions、審查與發布

本輪即時 [main runs](actions-baseline.json)：最新 Pages [43688778579](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43688778579) 對應基準 `564ecdb3…` success；最新產品 Website QA [43687547736](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43687547736) 對應 `872b313c…` success。docs-only 基準不觸發 Website QA，不稱同一 SHA 已跑過。Branch protection API 為未保護、rulesets 空，仍等 PR checks，不使用 admin bypass。

發布流程：PR checks 上限 25 分鐘；合併後 Pages／Website QA 上限各 25 分鐘，既有 publication gate 自身上限仍 60 分鐘。等待超時列未確認，不重跑湊綠燈。獨立審查、PR head、merge、部署及正式站驗證於實際完成後補記。

## 下一輪

優先以 fixture 驗證 `audit-summary.json` 的 exact／superseded 過期產物，再決定如何依 live revision 的來源重建或核對 Liquid 生成內容；先區分來源 blob、渲染 JSON 與生成 HTML，避免將錯誤的位元比較加入閘門。這是本輪未覆蓋的下一個候選，不是已確認的正式發布事故。

### 正式基準補驗

`NODE_PATH=…/node_modules GITHUB_SHA=564ecdb3becd7f03978951337eaf157f3ab8de68 node tests/deployed-browser.cjs` 對正式站 exit 0；桌面／手機核心旅程、搜尋組合復原與 JS-disabled Jekyll 索引回退全部通過：[日誌](baseline-live-browser.txt)、[桌面](baseline-desktop.png)、[手機](baseline-mobile.png)。搜尋區各兩次 axe 掃描零違規，復原掃描亦無違規；只代表這些頁面狀態。這也確認本機 preview 的末項失敗不能外推為正式產品故障。

### 獨立調查與審查

- VisitorAudit 已回收；它只有靜態檢查，沒有實際瀏覽器驗收。提出首頁／空結果任務清單分開維護的候選，本輪不擴大範圍。主 agent 核對後不採用「手機少算三個」結論：按鈕 `aria-controls=hero-problem-tags`，53 個指的是受它控制的工作任務；另外三個範例在獨立 `hero-task-examples` nav，不能直接加總認定錯誤。不同搜尋詞是否同義也未量測，不將此報告當已證實產品 bug。
- PublicationFinalReview 初審指出 P2：被後續版本刪除的文件會先在 fetch-all 因 404 被擋下，無法走到 superseded 的版本判定。[原始發現](review-initial.txt)。已接受修正：只有本 push 改過、可逐位元比對且非生成頁面的 404／410 延後裁決；exact 仍必須取得正確位元，superseded 仍須 live tree 與消失探測，其他錯誤不放行。補後續刪除範本／runtime asset 以及 exact／superseded 仍需文件卻缺失的回歸，重新送獨立複審。
- 審查修正後全套 `node --test tests/*.test.cjs`：**783 pass／0 fail／0 skip**，`node --check tests/published-version.cjs` 成功：[最終整合輸出](review-final-unit.txt)。上述 780 是第一次整合結果，不是最終交付數。
- 獨立複審最終 **Correct／No findings**：[結果](review-final.txt)。reviewer 對 fixture 的另一個 P1 推測已撤回：主 agent 以實際函式參數、內部 fetch callback 與 783 pass 證據核對，確認它誤以為未被接收的 `readLive` option 能覆蓋實作。沒有為錯誤發現修改或放寬測試。此為獨立 agent 審查，不是人類 GitHub approval。

### Actions 調查回收

PublicationAudit 已回收。主 agent 另以 GitHub API 確認 [最近失敗](recent-failures.json)，並下載原始 ZIP 核對最新失敗 [43634859717](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43634859717)，SHA `2138f4d49b0c8645d145f0d23549c4ffc75121c5`：`Verify the updated site in Chromium` 的 `refine-from-results-browser.cjs:96`，`phone: the entry waits while the search field is on screen`、`false !== true`：[原始日誌摘錄](actions-failure-extract.txt)。這是靜態預覽的手機斷言失敗，不是 Pages、權限或額度錯誤；近期後續 Website QA 成功，不重跑舊 run。

前兩次 main 失敗 [42820349847](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42820349847)（`2b139d9f…`）與 [42803248261](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42803248261)（`8fbfe082…`）屬較新版本取代舊版後的發布等待；現行程式已有 exact／superseded 與 120 秒 live-revision 走查。本輪不把這些歷史失敗當作仍存在，也不修改 concurrency 或延長等待。Website QA 對 PR 可取消舊版、main 保留裁決；Pages 是分開執行，QA 建置後再比正式位元。既有觸發路徑已含 README／INDEX／templates，這次修補的正是觸發與實際驗證範圍的落差。

### PR 與版本

已提交、已推送 `55f047dd13e3c0b25ab4d1d261967bf02845c472`，建立 [PR #408](https://github.com/RichardHan/ai-agent-use-cases/pull/408)。[獨立審查 comment](https://github.com/RichardHan/ai-agent-use-cases/pull/408#issuecomment-6891232115) 對應同一 head；[建立時快照](pr-open.json)。PR checks 採 30 秒間隔、25 分鐘上限等待，未完成的 checks 不當通過；合併與部署在實際完成後另記。

### 合併與雲端建置

- 合併前再次核對 head `55f047dd13e3c0b25ab4d1d261967bf02845c472`、base `564ecdb3becd7f03978951337eaf157f3ab8de68`、mergeState CLEAN；五項 PR checks 全部 success：[最終 PR](pr-final.json)。無基準或程式碼變動，未繞過保護。
- PR [Website QA 43691247488](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43691247488) 用時 11m51s，真正 Jekyll build、built corpus、語言、發布面、Jekyll 索引回退均成功：[steps](pr-website-qa.json)。PR 不發布的三步依既有規則 skipped，不把它們當正式驗證。
- 2026-11-15 07:56:25 UTC 正常 merge，合併版本 `c6de2dccf776553c441c3f3398222f00cba65c06`：[合併快照](merge.json)。僅本輪隔離分支快轉至合併版本，原 main／其餘 worktrees 不動。
- 對應 [Pages 43692172747](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43692172747) 與 [主線 Website QA 43692173061](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43692173061) 分別等待完成；以下發布證據只在實際完成後補記。

### 合併版正式站核對

- [Pages 43692172747](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43692172747) build／deploy／report 全部 success，head 精確為合併 SHA：[steps](pages-release.json)。GitHub 管理的流程有 Node 20／Ubuntu 遷移警告，本次沒有造成部署失敗。
- 正式 `catalog.sourceRevision` 精確等於 `c6de2dccf776553c441c3f3398222f00cba65c06`，526 個來源。12 個可比位元檔案（首頁、七個 assets、四份原始採用文件）全部 HTTP 200、逐位元等於合併版本：[版本及 SHA-256](release.json)。
- 主 agent 實際開啟正式站 390×844／1440×900：UC-014 詳情顯示「本庫設計，未實跑」，來源固定合併 SHA，重新整理仍開詳情，Escape 後保留 UC-014／topic、一筆結果且無水平溢出。固定合併版 GitHub 原文實際載入：[實走](live-manual.json)。本輪是 CI 改動，無視覺改版成效主張。
- `NODE_PATH=…/node_modules GITHUB_SHA=c6de2dccf776553c441c3f3398222f00cba65c06 node tests/deployed-browser.cjs` exit 0，回報 `PUBLISHED_LIVE_BUILD_CURRENT`；桌面／手機探索、搜尋、組合空結果鍵盤復原、詳情直鏈重整與返回、JS-disabled 索引回退全部通過：[日誌](live-browser.txt)、[桌面](live-desktop.png)、[手機](live-mobile.png)、[空結果復原](live-recovery-mobile.jpg)。搜尋各兩次 axe 零違規、復原掃描無違規；不外推為全站認證。

### 最終發布結論

- 合併版 [Website QA 43692173061](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43692173061) **success**，head `c6de2dccf776553c441c3f3398222f00cba65c06`，07:56:30–08:08:25 UTC，低於 25 分鐘等待上限。[完整 steps](main-qa.json) 確認 regression、Chromium、Jekyll、built corpus／語言／發布面、索引回退、**Wait for published assets and content** 與正式站走查均成功。安全失敗步驟依預期 skipped，不是關閉檢查。
- [雲端日誌摘錄](main-publication-verdict.txt)：783 tests／783 pass；實際合併版 Pages succeeded，`PUBLISHED_LIVE_BUILD_CURRENT c6de2dcc…`。檔案前半以 `# Pages deployment for current` 開頭的是單元測試模擬輸出，不能當成正式環境權限或部署失敗。
- **已提交、已推送、已合併、部署成功、正式站已驗證**。本輪沒有未解的發布阻塞；影像目視／實機限制及未納入的 Liquid／生成頁面覆蓋仍如前述。下一輪首驗 `audit-summary.json`，不繼續擴大本輪。
- 發布後證據沿用既有慣例，以只改 `docs/qa/`、`SITE.md` 的接續提交保存；兩者均排除於 Pages 發布面，不改已審程式。接續提交的 Pages／sourceRevision 與相同產品位元再核對，結果附 PR comment；未觸發的 Website QA 不稱為重跑。
