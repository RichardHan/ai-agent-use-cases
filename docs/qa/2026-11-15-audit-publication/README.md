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

### 調查回收與真實 superseded 路徑

- VisitorEvidence、ActionsEvidence 已回收：[訪客調查取捨](visitor-investigation.txt)、[Actions 調查取捨](actions-investigation.txt)。兩者只有靜態／HTTP／API 研究，不算瀏覽器驗收。主 agent 實測 DOM：展開鈕控制的 `hero-problem-tags` 恰有 53 個入口，三個範例不在其中，因此拒絕「應改 56」建議。門檻推測候選也不直接修：UC-140 內文實際需 VM／PyTorch，清除字面線索反而可能低估難度，須逐案證據。
- 真實 superseded 整合 probe：以 `c6de2dcc…` 為被取代版本、正式站 `642c98de…` 為 live，原生 git ancestry／git show 及完整現行 corpus 與 audit 比對 **matched**，526 來源、changedVerified=0：[輸出](live-superseded-probe.txt)。本機輸入是暫時下載的正式產物快照，不冒充本機 Jekyll build；部署 API 狀態另以 run 證據驗證。此 probe 驗到真正 Git reader，不只 fixture。
- 覆蓋界線：exact 比較正式 JSON 與 Jekyll 建置、另驗首頁格式；不是另寫一個 Jekyll renderer。來源含 Liquid 語法時需重新確認抽取契約，不能靜默放行。原始稽核 Markdown 與 superseded HTML 仍未全部覆蓋。
- 已提交、已推送 `060b53f50ccd45bc37dfe41d16c4af17a9d30190`；[PR #409](https://github.com/RichardHan/ai-agent-use-cases/pull/409)。獨立 review comment 對應同 head。PR 檢查以 30 秒間隔、25 分鐘上限等待；merge／發布與正式驗證另待實際完成補記。

### 合併與真正建置

- 合併前 head `060b53f50ccd45bc37dfe41d16c4af17a9d30190`、base `642c98de88fd4bc5f96f02710df99dcbfb3d0a8c` 未變，CLEAN；兩項 PR checks 全 success：[PR 快照](pr-final.json)。[review comment](https://github.com/RichardHan/ai-agent-use-cases/pull/409#issuecomment-6891831760) 對應同一 head，未使用 admin bypass。
- [PR Website QA 43695662201](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43695662201) 14m19s 通過，真正 Jekyll build、built corpus、語言、發布面、索引回退均 success：[steps](pr-website-qa.json)；[Corpus bundle QA 43695662292](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43695662292) 5m28s 通過：[steps](pr-secondary-qa.json)。PR 的正式部署步驟依原規則 skipped，不當作發布證據。
- 08:56:09 UTC 正常 merge，版本 `f67b6cdeed33890116fead4c51c0e43c243bf647`：[合併紀錄](merge.json)。僅隔離分支快轉至合併版，原 main 與其他工作樹保留。
- 對應 Pages [43696800868](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43696800868)、主線 Website QA [43696801371](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43696801371) 分別以 25 分鐘上限等待；正式結果在實際完成後補記。

### 合併版正式站驗收

- Pages [43696800868](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43696800868) build／deploy／report 全 success，head 精確為 `f67b6cde…`：[steps](pages-release.json)。GitHub 管理的 Pages workflow 有 Node 20／Ubuntu 遷移警告，本次未造成失敗。
- 正式 catalog／corpus `sourceRevision` 精確等於合併 SHA，12 個首頁／assets／原始文件逐位元相同、526 份 corpus 原文逐字相同；稽核摘要完整批次與來源相同且通過首頁契約：[版本與 hash](release.json)。
- 正式 Chromium 1440×900／390×844 三情境重走全部通過：[結果](live/journeys.json)、[桌面詳情](live/desktop-detail.png)、[手機詳情](live/mobile-detail.png)。分享詳情重整、來源固定合併 SHA、Escape 焦點／條件保存、零筆復原、零 pageerror／水平溢出。主 agent 另實際開啟合併版 GitHub 原文，讀到「本庫設計」限制；正式首頁仍清楚說 370 是 2026-10-22 歷史批次、母體 420，不是目前全庫合格總數。
- 主線 Website QA 的真正發布 gate 尚待結束；Pages 與上述正式走查成功不取代它。

### 最終發布結論

- 主線 [Website QA 43696801371](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43696801371) **success**，head `f67b6cdeed33890116fead4c51c0e43c243bf647`，08:56:13–09:08:31 UTC，低於 25 分鐘上限：[完整 steps](main-qa.json)。793 tests／793 pass／0 fail；真正 Jekyll、發布 JSON／資產／內容 gate、正式站走查均成功。
- [雲端摘錄](main-verdict.txt) 最後的 `PUBLISHED_LIVE_BUILD_CURRENT f67b6cde…` 是真實發布走查；前面 `# Pages deployment for current` 是單元測試模擬輸出，不能當作權限或部署事故。09:07:46 的 superseded 行是瀏覽器回歸情境，實際 gate 的部署成功及 CURRENT 結論在後。
- **已提交、已推送、已合併、部署成功、正式站已驗證。** 無本輪未解發布阻塞；模型／影像目視、實機、生成內容覆蓋界線如上。下一輪只優先驗證 superseded 生成 HTML 的內容一致性，不擴大本輪。
- 最後沿用既有慣例，以僅 `docs/qa/`／`SITE.md` 的接續提交保存發布證據；兩者排除於 Pages 發布面，不改已審程式。接續提交的 Pages／sourceRevision／同產品位元核對結果附 [PR #409](https://github.com/RichardHan/ai-agent-use-cases/pull/409) comment，避免為紀錄自己的 SHA 再開循環提交；未觸發的 Website QA 不稱重跑。
