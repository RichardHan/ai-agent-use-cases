# 2026-11-16：備援閱讀路徑的來源可達性與證據代碼圖例

## 基準與選題

- 原工作樹 `main` 落後遠端 12 個 commit，未 reset、未覆寫；安全 fetch 後以 `origin/main` `786c879b46d8ceac4cfe4298ed5debd7302c30ca` 建立隔離 worktree `/tmp/ai-cases-fallback-20261116`，分支 `improve/2026-11-16-fallback-reading`。原工作樹、其他 worktrees 與未提交內容保留。
- 無 repo／父層 `AGENTS.md`；沿用 README、SITE.md、最近 `docs/qa/2026-11-15-*`、Website QA 與既有 Pages 流程。沒有開啟中的 PR。
- 本輪重新查 Actions：2026-11-14T20:00Z 後 main 沒有 failure／cancelled、沒有 timed_out 或 queued；最新 [Pages 43712556872](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43712556872) 對 `786c879b` 成功（build 43 秒、deploy 9 秒、artifact 6.66 MB）。歷史 11-09／11-10 的部署與 gate 失敗已由 `_config.yml` 排除、發布面上限與 superseded 判定修復；11-14 的紅燈是已修的 390px 測試邊界。**不把歷史故障當成目前仍存在。**
- 本輪執行模型為環境回報的 `litellm/deepseek-flash-gmi`；工具沒有提供切換 gpt-6.1-terra／gemini 的介面，未宣稱使用指定模型或最高推理。兩個子代理與主 agent 使用同一 runtime；獨立 reviewer 是另一個任務上下文。

目標使用者：依站方指示在腳本較慢或失敗時開啟「完整案例索引」，再點進案例頁核對來源與證據的訪客；以及直接從搜尋引擎抵達 `cases/*.html` 的讀者。JS 詳情頁一直會把裸網址轉成連結，只有伺服器渲染的 Jekyll 頁面不會。

## 可重現問題與方案

停用 JS 的正式站 `786c879b`：

- 下載全部 522 個 `cases/*.html` 後，以 `<a href="http…">` 排除本站 origin 計算，**86 頁（16.5%）沒有任何可點的外部來源**。例：`cases/007-saas-renewal-audit.html` 的 `網址：https://x.ai/news/grok-bot-procurement` 是純文字；`cases/001-travel-checkout.html` 的 `原文：https://www.aiformortals.co/…` 也是。
- **201 頁（38.5%）** 在 `證據狀態`／`來源證據` 行顯示 `author-demo`、`designed` 等機器代碼；INDEX 頁沒有對照。代碼本身沒有錯，錯的是索引沒有給讀者解碼方式。
- 來源列以 `原文：`、`網址：`、`貼文：`、`連結：` 等標籤開頭，共 226 處裸網址；JS 詳情頁的 `renderMarkdown` 會連結它們，Jekyll 不會。

兩案：

1. **內容連結化＋索引圖例＋建置產物檢查**（選定）：把來源章節與來源列的裸網址改成 `[url](url)`，畫面文字不變；INDEX 加四類代碼對照與回搜尋入口；用真的 Jekyll `_site` 檢查 522 頁。成本 159 檔、336 個連結，無新依賴，風險低。
2. **覆寫 Jekyll layout**：可一併加每頁麵包屑與圖例，但要重現 primer layout／SEO、本地無法建置、一次影響 525 頁；回歸風險高，本輪不做。

驗收：建置後每個 corpus 案例頁至少一個外部 `<a href>`；INDEX 文件化案例頁首實際使用的四個代碼；SPA 搜尋、摘要、來源與指引不得退化；桌面／手機三情境與停用 JS 備援路徑通過。

## 實作

- `cases/`、`evidence/`、`sources/pending.md`：只在來源章節（`來源`／`原文`／`參考`／`連結`／`原始`）與清單列、且不在提示詞／可貼指令／操作步驟等指引章節，將裸 URL 包成 `[url](url)`。略過行內程式碼、既有 Markdown 連結、角括號連結與圍籬程式碼。每個新連結的顯示文字等於原網址，318 行改動逐行驗證「拆掉連結語法後等於原行」。
- `INDEX.md`：新增 `#how-to-read` 導覽、五欄位讀法、四個機器代碼對照表（與 `PROOF_DEFINITIONS` 同一組中文類別），明示「主張者≠驗證者、本庫未獨立重現」，並連回可搜尋的首頁。
- `templates/case.md`：來源網址一律用 Markdown 連結，避免下一批案例再產生裸網址。
- `assets/app.js`：`withoutSourceUrls()` 整段移除 URL 當標籤的來源連結，避免 `[https://…]` 殘留成正文；搜尋摘要另以 `unwrapUrlLabels()` 還原成純網址。描述性連結（`[官方說明](…)`）行為不變。
- `scripts/check-fallback-reading.cjs`：對 Jekyll `_site` 檢查 INDEX 圖例、回首頁連結、每個 corpus 案例頁的外部來源連結，並要求 `catalog.json` 的每個 corpus 條目都有對應生成頁（避免只檢查部分建置）。Website QA 在 Jekyll build 後執行。
- 新回歸：`tests/source-link-markup.test.cjs`（全 corpus 至少一個可點來源、來源列不得留裸網址、SPA 去除／摘要行為、代碼圖例與 SPA 類別同步）、`tests/fallback-reading.test.cjs`（無連結頁、缺圖例、catalog 缺頁都要失敗）。

## 驗證

- `node --test tests/*.test.cjs`：基準 **814 pass／0 fail** → 最終 **823 pass／0 fail／0 skip**。
- 新檢查對**改動前**下載的正式站 522 頁：`FAIL: 91 problem(s)`（86 頁無來源、5 項 INDEX 圖例／回首頁）→ 改動後以 kramdown 渲染全部 522 案例＋3 evidence＋INDEX：`PASS: 525 rendered case pages expose a clickable source; INDEX explains the evidence codes`。kramdown 與 Jekyll 使用同一渲染器；真正的 primer／Jekyll 產物由 PR Website QA 驗證，本機不冒充已建置。
- `node --check assets/app.js`、`node --check scripts/check-fallback-reading.cjs` 成功；`node scripts/check-published-surface.cjs`：833 檔／5.87 MiB／9 排除通過。repo 沒有獨立 lint／type-check 指令，不宣稱兩者通過。
- 本機 preview（`scripts/preview.py`）以 Chromium 走三情境，桌面 1280×900 與手機 390×844：
  1. 不以工具名搜尋「我想把會議錄音整理成待辦」→ 11 筆、顯示「錄音＋待辦」字面拆詞 → UC-511 詳情 → 展開研究來源，三個外部來源可點 → Escape 返回。
  2. `q=旅遊&kind=pending` → 0 筆空結果 → 提供「移除待查線索，查看 36 筆」與任務捷徑。
  3. 分享 `?case=UC-528` → 詳情顯示成果主張／未獨立重現 → 來源含固定或 main GitHub 原文與 X 連結 → 關閉回搜尋。
  兩尺寸 `documentElement.scrollWidth` 均未超過 viewport。
- 相關瀏覽器回歸：`source-links-browser`、`search-context-browser`（Chromium／Firefox／WebKit）、`detail-trust-summary-browser`、`evidence-attribution-browser` 全部通過；`x.ai` 查詢摘要不再顯示 `[url](url)`。
- 停用 JS 的 kramdown 備援頁：INDEX 有圖例與 `cases/001-travel-checkout.html` 連結；案例頁 `原文：` 已是 anchor，href 正確；`author-demo` 由 INDEX 圖例解碼。此 fixture 沒有 primer CSS，390px 的表格幾何與正式站不同，不以它宣稱視覺結果。
- 證據檔：改動前檢查 `pre-change-check.txt`、kramdown 產物檢查 `rendered-check.txt`、新回歸 `focused-tests.txt`、三情境 `visitor-scenarios.json`、停用 JS `nojs-fallback.json`。視覺證據：改動前正式站 INDEX 與 UC-007 來源區的桌面／手機截圖在 `before/`；正式站部署後以相同 URL、尺寸與資料狀態補 `after/`。圖片輸入工具停用，主 agent 未能逐像素目視；另保存 DOM／href／viewport 證據。這是 agent 走查，不是真人使用者研究。

## 已知限制與未處理

- 案例頁仍沒有直接「回索引」麵包屑；目前需經站名回首頁再進索引（兩跳）。每頁也沒有自己的代碼圖例，圖例只在 INDEX；直接從搜尋引擎進單一案例頁的讀者仍會看到原始代碼。這需要 layout 覆寫，留待下一輪。
- INDEX 在 390px 是主題 CSS 的橫向捲動表格；本輪不改版型。
- 只連結來源章節與清單列；正文其他裸網址（例如指令範例、引用句）保留原狀，避免改動可複製文字。
- 驗證以頁面層 external anchor 為準，不逐一開啟 336 個外部網址；來源真實性仍以案例頁的查證紀錄為準。
- Actions 審查另發現：發布 gate 的位元比較沒有涵蓋 `sources/*.md`（除 `pending.md`），只改研究檔的 push 可能綠燈而該檔過期。本輪不改 gate，證據與重現方向見下。

## 分工回收

- `FallbackAudit`（scout）：確認 86／522 無對外來源、201 頁原始代碼、INDEX 手機表格捲動機制；主張以 Markdown 連結修正，反對本輪做 layout 覆寫。主 agent 重新以正式站 522 頁下載與 DOM 實測核對，數字一致。
- `ActionsAudit`（scout）：近七日 10 次非成功全部已修／外部或計畫性取消；目前無 failure／timeout／queue。提出 `sources/*.md` gate 缺口與 Website QA 的 Playwright 1.56.1 與其他 workflow 1.64.x 漂移。主 agent 另查 `gh run list --limit 100` 為 0 個非 success；採納為下一輪候選，不在本輪改 workflow 行為（只新增前述唯讀檢查步驟）。
- `IndependentReview`：初審回報無 findings；要求重跑證據後，第二輪指出 P2：`externalSourceLinks()` 只排除帶尾斜線的站內網址，無斜線的同站連結可能被誤算成外部來源。已將 origin 正規化並補測試（同站有／無斜線都不算），823 單元、改動前 91 項失敗、kramdown 525 頁通過均重跑。複審再次執行三項命令：823 pass、pre-change FAIL 91、rendered PASS 525，無其他 findings。limitation 仍為 kramdown fixture 不是真正 Jekyll 產物，交由 PR Website QA 驗 `_site`。

## 發布與正式站核對

- 已提交 `01295659a1832094b2e0b543c63a6527cb6a70ef`，[PR #413](https://github.com/RichardHan/ai-agent-use-cases/pull/413)；merge commit `1a387a34f7b7d8a18a54cf7259b0a905d3a03c97`。基準 `786c879b` 未變，mergeState CLEAN；repo 無 branch protection，仍等必要 checks 完成才合併，沒有 bypass。
- PR checks：16 pass、2 skipped（`published` 只在 main push 執行）；[Website QA 43745883393](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43745883393) 12m14s success，`Verify fallback reading pages` 在真正 Jekyll `_site` 上 success；`Source guide QA` 等其餘 workflow 全 success。
- [Pages 43747165501](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43747165501) 對 merge SHA success：build 42 秒、deploy 9 秒、`github-pages` artifact 6,675,004 B。正式 `catalog.json.sourceRevision` 精確等於 `1a387a34…`。
- 以同一支檢查重新下載正式站 INDEX、catalog 與 525 個 cases／evidence HTML：`PASS: 525 rendered case pages expose a clickable source; INDEX explains the evidence codes`；改動前同方法是 `FAIL 91`。正式 UC-007 的 `網址：` 已是 `<a href="https://x.ai/news/grok-bot-procurement">`。
- 正式站三情境（1280×900／390×844）：問題搜尋→UC-511→三個來源可點；`q=旅遊&kind=pending` 空結果→移除條件查看 36 筆；分享 `?case=UC-528`→證據→固定合併 SHA 的 GitHub 原文→關閉。返回搜尋後 `?q=旅遊`、詳情關閉、焦點回到 UC-001。pageerror 0、水平溢出 false：[journeys.json](live/journeys.json)、[返回與來源](live/return-and-source.json)。
- 主線 [Website QA 43747166154](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43747166154) 對 `1a387a34…` success；真正 Jekyll build、`Verify fallback reading pages`、正式 `Wait for published assets and content` 與 published walk 均 success，沒有把 PR 綠燈代替 main 發布驗證。
- 停用 JS 的正式站 after 截圖與 before 同 URL、同尺寸、同資料狀態：[桌面索引](after/index-desktop.png)、[手機索引](after/index-mobile.png)、[UC-007 桌面](after/case-007-source-desktop.png)、[UC-007 手機](after/case-007-source-mobile.png)。DOM：INDEX 圖例可見、四個代碼齊全；UC-007 外部 anchor 1 個；390px `scrollWidth` 等於 viewport。主線 [Website QA 43747166154](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43747166154) 的裁決另記於 SITE。
- 下一輪最值得做：讓直接抵達的案例頁也有可見的證據圖例與回索引，先以最小 `_layouts` 覆寫在真正 Jekyll build 驗證 primer CSS／SEO 不退化，再批次套用；不要把圖例只留在 INDEX。次選是補 `sources/*.md` 的發布位元比較與故障注入。
