# 2026-11-15：合格數摘要的發布驗證

## 基準與選擇

- 原 repo main 乾淨；安全 fetch 後基準 `642c98de88fd4bc5f96f02710df99dcbfb3d0a8c`，GitHub 身分 RichardHan，無開啟中的 PR。保留另外五個 worktrees，建立隔離 `/tmp/ai-cases-visitor-20261115`、分支 `improve/2026-11-15-visitor-round`。無 repo／父層 AGENTS.md；沿用 README、SITE、Website QA 與上輪 publication-coverage 紀錄。
- 主 agent 實際模型 `openai-codex/gpt-6-astra`。當次 catalog 接受 `openai-codex/gpt-6.1-terra` 等 selector，支援 low／medium／high／xhigh／max：[catalog](model-terra.json)。使用者原標籤 `gemini3.8:high flash` 無對應：[結果](model-label.json)；另查 `gemini-3.8-flash` 有 catalog 結果但不自行認定為同一環境。設定 `task.perCallModel=off`、defaultThinkingLevel=auto，未改設定／付費通道；不宣稱本輪使用 Terra、Gemini 或最高推理。find 的 judge 帳戶拒絕，改用 grep／read；LSP 回報無可用 server。
- [目前 main Actions](actions-baseline.json)：基準 Pages [43693203299](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43693203299) success；最近產品 Website QA [43692173061](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43692173061) 是 `c6de2dcc…` success。docs-only 基準不觸發 Website QA，不說它已跑同 SHA。Branch protection API 404「Branch not protected」，rulesets 空；仍等待 PR checks，不繞過規則。
- 正式 `audit-summary.json` 目前正確：歷史批次 2026-10-22 20:50、370／1000、母體 420；不是現有條目合格總數。本輪不改這些數字。故障注入才是缺陷證據：過期／缺失／無效 JSON、新版過期批次、無法讀取固定來源均被舊閘門放行，[5 項先紅](red-audit.txt)。不是正式站已發生計數事故。

兩案：①只比較同版本生成 JSON，最小成本但 superseded 仍漏驗；②同版本比較建置 JSON，新版依其固定 commit 的稽核原文抽出第一個 H2，核對完整 `latestBatch`。選②；沿用 Liquid／preview.py 的現有輸出契約，不另算合格數、不以模板 blob hash 當生成內容。

驗收：拒絕過期、404、無效 JSON、來源讀取失敗；合法後續批次與 JSON 格式差異可通過；包含沒有原始發布檔變更的 push。固定來源按 revision 快取，失敗不快取。保留 ancestry、原 60 分鐘 publication deadline、其他資產與 corpus 檢查。外部等待各設 25 分鐘上限；超時不稱成功。

不處理：UI、案例資料、合格計數規則、workflow 觸發／concurrency，以及其他生成 HTML 的 superseded 全面比對。未新增依賴、追蹤、cookie 或第三方傳送。

## 改動與驗證

- `tests/published-version.cjs` 必讀 audit JSON；exact 比較建置解析值，superseded 在 ancestry／來源檢查後，以唯讀 `git show <live SHA>:sources/qualification-audit-2026-10-16.md` 核對摘要。非 40 位十六進位 revision 拒絕，Git 讀取 30 秒上限。
- `tests/published-version.test.cjs` 新增 6 項消費者可見回歸，更新 fixture；`tests/publication-gate.test.cjs` 補齊新增必要建置產物與固定來源 fixture，未降低斷言。
- 基準 `node --test tests/*.test.cjs`：783 pass／0 fail：[輸出](baseline-unit.txt)。第一次整合 784 pass／5 fail，均為另一個 gate fixture 缺新增必要 JSON 的 ENOENT：[保留中間輸出](intermediate-unit.txt)。修 fixture 後 `node --test tests/published-version.test.cjs tests/publication-gate.test.cjs`：60 pass／0 fail。`node --check tests/published-version.cjs` 成功。最終雲端全套與真正 Jekyll build 以後續 Actions 實際結果補記。
- `python3 scripts/preview.py /tmp/visitor-round-preview/ai-agent-use-cases` 成功；`node scripts/check-published-surface.cjs`：833 檔、5.84 MiB、9 項排除通過。這是靜態 preview，不是 Jekyll；repo 無獨立 lint／type check，不宣稱通過。

## 訪客驗收

正式站 <https://richardhan.github.io/ai-agent-use-cases/>；本機預覽 <http://127.0.0.1:8143/ai-agent-use-cases/>（暫時服務，非公開部署）。

基準 `NODE_PATH=…/node_modules GITHUB_SHA=642c98de… node tests/deployed-browser.cjs` exit 0：[輸出](baseline-live.txt)、[桌面](baseline-desktop.png)、[手機](baseline-mobile.png)。桌面／手機搜尋、組合空結果鍵盤復原、詳情直鏈重整、返回、JS-disabled Jekyll 索引回退均通過；搜尋各 2 次 axe 零違規，復原掃描零違規，不外推全站認證。

主 agent 實際瀏覽器：1440×900 首頁「收件匣與郵件」→164 筆→UC-014；詳情分開標明作者報告／設計未實跑，來源固定基準 SHA；GitHub 原文實際開啟且有未實跑限制。390×844 `?q=UC-014&scope=topic&tool=Cursor` 零筆→移除 Cursor→1 筆，q／scope 保留且零水平溢出。預覽三情境同尺寸結果另存本目錄。這是機器走查，不是真人研究。

無 UI 變更，沒有視覺改版成效主張。環境停用影像輸入，保存截圖與 DOM／幾何檢查，不宣稱逐像素目視；未驗實體手機、讀屏實聽或效能分數。preview 不產生 Jekyll INDEX.html，正式索引的驗證交由既有雲端 build 與正式站測試。

## 審查、發布與下一輪

獨立調查 VisitorEvidence／ActionsEvidence、獨立 AuditFinalReview 的交付物及 PR／merge／Pages／正式版本核對於回收後補記；啟動不算完成。

下一輪先核對 superseded 的 `INDEX.html`／稽核報告 HTML 是否可能與其 sourceRevision 不同，而只因語言 metadata 正確獲放行；用 fixture 證明後再選擇能驗生成內容的方案，不盲目把 Markdown blob hash 當 HTML。

### 最終整合補驗

- 第一次修正後全套 789 pass／0 fail：[輸出](final-unit.txt)；這不是獨立審查修正後的最終數。
- 獨立審查 P2 接受：[初審](review-initial.txt)。同樣的 JSON 若 `latestBatch=null` 或合格數＋剩餘數不等於 1000，首頁會拒絕而閘門曾接受；四項新增回歸均先紅：[red-consumer](red-consumer.txt)。改用首頁現有 `assets/audit.js.parseSummary()`，不建立另一套日期／計數規則。兩個模式都必須通過來源一致性及消費端契約。
- 預覽 Chromium 1440×900／390×844 三情境均通過：[JSON](preview/journeys.json)、[桌面詳情](preview/desktop-detail.png)、[手機詳情](preview/mobile-detail.png)。問題入口、Escape 原卡焦點、零筆移除單條件、分享詳情重整、未實跑標示、固定來源連結及返回保留 q／scope；零 pageerror／水平溢出。
- 即時最近失敗仍為 [43634859717](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43634859717)，`2138f4d4…`；原始 ZIP 確認是 `refine-from-results-browser.cjs:96` 的手機可視條件斷言：[錯誤摘錄](actions-error.txt)。不是權限／額度或 Pages 失敗。`gh --log-failed` 此次只回傳步驟開頭，未據此猜根因。後續 main 成功，沒有重跑舊故障。另兩次 42820349847／42803248261 為歷史 superseded 等待失敗，不當成現況。
- 審查修正後最終全套 `node --test tests/*.test.cjs`：**793 pass／0 fail／0 skip**；語法檢查成功：[完整輸出](review-final-unit.txt)。獨立複審 **Correct／No findings**：[結果](review-final.txt)。主 agent 核對 `parseSummary` 的日期／數字契約與四項先紅後綠證據；這是獨立 agent 審查，不是人類 GitHub approval。
