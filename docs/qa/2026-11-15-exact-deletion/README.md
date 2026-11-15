# 2026-11-15：同版本發布的刪除／改名驗證

## 基準與選題

- 原工作樹 main `642c98de88fd4bc5f96f02710df99dcbfb3d0a8c` 乾淨，沒有 repo／父層 AGENTS.md。GitHub 身分 RichardHan、預設 main、沒有開啟中的 PR；保留原工作樹及其他六個 worktrees。安全 fetch 後以 `a6eb4e8f5019f9998c71220cf041844263640196` 建立 Orca 隔離分支 `RichardHan/audit-publication-20261115`，路徑 `/Users/richard_han/orca/workspaces/ai-agent-use-cases/audit-publication-20261115`。
- 沿用 README、SITE、Website QA、最近 publication-coverage／audit-publication 紀錄。最新基準已包含 PR #409 的 audit-summary 修補，沒有重做。Branch protection API 回應未保護、rulesets 空；仍等待 PR checks，不使用 bypass。
- 主 agent 實際模型 `openai-codex/gpt-6-astra`；當次 catalog 有 `factory-droid/gpt-6.1-terra`／`litellm/gpt-6.1-terra`，推理 low／medium／high／xhigh／max；`gemini3.8` 無結果，`gemini-3.8-flash` 有多 provider、low／medium／high，但未證實使用者環境標籤對應。`task.perCallModel=off`、`enableEffort=false`，未切換模型或付費通道，不宣稱使用指定模型或最高推理。find 的 judge 帳戶拒絕，改用 grep／read；LSP references 回報沒有可用 server。
- [目前 Actions](actions-baseline.json)：基準 Pages [43697938146](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43697938146) success；最新產品 Website QA [43696801371](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43696801371) 在 `f67b6cde…` success。docs-only 基準不觸發 Website QA，不能說同 SHA 已跑過。

目標使用者是閱讀分享的舊採用範本／資產網址的訪客，以及依發布閘門判斷撤下是否完成的維護者。實證缺口：exact 分支只比較建置中仍存在的檔案，刪除檔案不在 servedAssets；舊 URL 回 200 或 503 仍能得到 matched。superseded 分支原本已有消失探測。五項故障注入全部先紅：[red-deletion.txt](red-deletion.txt)。這不是正式站已發生殘留或洩漏的證據。

兩案：①只在 exact 複製 HTTP 判斷，最小改動但兩處維護；②共用既有 probeMissing，exact 對被刪除的原始非 corpus 檔案也探測。選②，沿用 cache-busting、no-store、AbortSignal 與原 60 分鐘上限，不新建發布系統。

驗收：200／503 拒絕，404／410 接受；改名須新位元正確且舊網址消失；短暫殘留繼續等，永久殘留在原期限失敗；既有 superseded 刪除／恢復驗證不退化。

不處理：UI、案例／合格數、workflow 觸發／concurrency、原始案例檔的額外 URL 探測，以及生成 HTML 的 superseded 全內容比對。案例刪除仍沿用 corpus 契約；本輪沒有刪除任何正式產品檔案來製造驗收。

## 實作與驗證

- `tests/published-version.cjs`：把既有 probeMissing 移至兩分支共用；exact 對 changeList 的 deleted non-SOURCE_DIR 檔案探測。每個探測回應均關閉 body；只有 404／410 是消失證據。
- `tests/published-version.test.cjs`：五項回歸，涵蓋 runtime asset、採用範本、服務錯誤、兩種消失碼及改名的延後消失／新位元檢查。既有測試不刪除、不降低斷言。
- 基準 `node --test tests/*.test.cjs`：793 pass／0 fail，[輸出](baseline-unit.txt)。新增測試在舊實作 5 fail（四項 Missing expected rejection，改名等待 0 而非 10000ms），修後全套 **798 pass／0 fail／0 skip**：[輸出](final-unit.txt)。時鐘為隔離 fixture，不是真等一小時。
- `node --check assets/app.js`（基準）、`node --check tests/published-version.cjs`（整合）成功。repo 未定義獨立 lint／type check，不宣稱執行。
- `python3 scripts/preview.py /tmp/ai-audit-publication-preview/ai-agent-use-cases` 成功；`node scripts/check-published-surface.cjs`：833 檔、5.84 MiB、9 項排除通過。這是靜態 preview，不是 Jekyll；真正 build 由 PR Website QA 執行。

## 訪客驗收與限制

正式站：<https://richardhan.github.io/ai-agent-use-cases/>。暫時預覽：<http://127.0.0.1:8157/ai-agent-use-cases/>，非永久公開服務。

基準 `NODE_PATH=…/node_modules GITHUB_SHA=a6eb4e8f… node tests/deployed-browser.cjs` exit 0：[日誌](baseline-browser.txt)、[桌面](baseline-desktop.png)、[手機](baseline-mobile.png)。桌面／手機探索、搜尋、組合空結果鍵盤復原、詳情直鏈重整、返回、JS-disabled INDEX 回退全部通過。搜尋各兩次 axe 零違規、復原掃描零違規，只代表已掃狀態，不外推全站認證。

主 agent 實際 Orca 瀏覽器：1440×900 首頁「收件匣與郵件」→164 筆→UC-014；成果主張／核讀與本庫設計未實跑標示分開，來源固定基準 SHA。GitHub 原文分頁實際載入且讀到 UC-014／未實跑限制。Escape 返回保留收件匣與原卡焦點。390×844 `?q=UC-014&scope=topic&tool=Cursor` 零筆→移除 Cursor→一筆，q／scope 保留，無水平溢出。預覽同頁核對標示、固定來源與零溢出。

無 UI 變更，沒有視覺改版前後成效主張。影像讀取工具回報 disabled；保存真實截圖並使用 DOM／幾何檢查，不宣稱像素目視、實機手機或讀屏實聽。未量測效能分數；本輪機器走查不是使用者研究。

## 審查與發布接續

獨立調查 CurrentActionsAudit／VisitorBaselineAudit、最終 DeletionFinalReview 的結果、最終預覽情境、PR／Actions／merge／部署版本與正式驗收於實際回收後補記。啟動不算完成。PR checks、合併後 Pages／Website QA 各最多等 25 分鐘；超時保留未確認狀態，不無限重跑。原 publication gate 的 60 分鐘期限不變。

下一輪最值得做的一件事：先用 fixture 證明 superseded 的 INDEX／稽核 HTML 是否會只因語言 metadata 正確放行過期正文，再設計以 live revision 生成產物核對的方案；不要把 Markdown blob hash 當 HTML，也不要以歷史 CI 失敗推定現況。

### 整合預覽三情境

暫時 Playwright 腳本（不加入永久測試）在 1440×900／390×844 全部通過：[journeys.json](preview/journeys.json)、[桌面詳情](preview/desktop-detail.png)、[手機詳情](preview/mobile-detail.png)。問題入口→閱讀→Escape 原卡焦點；組合搜尋零筆→鍵盤移除 Cursor 並保留 q／topic；分享詳情重整→判讀未實跑限制與固定來源→返回一筆結果。兩尺寸無 pageerror／水平溢出。此腳本不宣稱驗了 preview 未生成的 INDEX.html；該頁由正式基準與雲端 Jekyll 檢查覆蓋。

### 獨立初審修正

DeletionFinalReview 指出 P2：Facet counts QA 手動 main 執行沒有 `github.event.before`，`known:false` 不能當作沒有刪除。[初審](review-initial.txt)。主 agent 核對 caller／classifier 並新增回歸，確實先紅：[red-unknown.txt](red-unknown.txt)。現在兩種模式都在入口立即拒絕未知 changeList，不等待不可能自行補齊的輸入；手動 main 缺 push base 會明確失敗，不宣稱其刪除已驗證。沒有替 workflow 猜 parent SHA，也不關閉檢查。

修後完整 `node --test tests/*.test.cjs`：**799 pass／0 fail／0 skip**，`node --check tests/published-version.cjs` 成功：[最終整合輸出](review-final-unit.txt)。原 798 是初版整合數；新實作不改 UI，預覽訪客證據仍適用。已送獨立複審，待實際結果再記。

### 完整輸入契約與調查回收

獨立複審再指出省略 `changeList` 的預設值仍是假定 known-empty：[發現與修正](review-followup.txt)。新增省略參數回歸先紅：[red-omitted.txt](red-omitted.txt)；移除預設值，兩份測試 fixture 明示 known-empty，正式 CLI 原本就傳計算結果、不用更動。最終全套 **800 pass／0 fail／0 skip**、語法通過：[final-contract-unit.txt](final-contract-unit.txt)。`tests/publication-gate.test.cjs` 僅補明示 fixture 契約，不降低任何發布斷言。

兩個調查均已收回並由主 agent 核對。[訪客調查取捨](visitor-investigation.txt)：拒絕 stale snapshot 的未修復結論、拒絕略過 index.html 消失探測建議；下一輪生成 HTML 的文字哨兵只能證明部分內容，不能冒稱逐位元驗證。

CurrentActionsAudit 的唯讀工具無法取得授權 ZIP；主 agent 用既有 gh 身分下載原始 run logs，補齊 [錯誤摘錄](actions-errors.txt) 與 [run／step 快照](representative-runs.jsonl)：

- [Website QA 43659142852](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43659142852)，PR head `6322e0c6…`（checkout 為合成 merge）：`Run existing regression tests` 明確是 **522 !== 520** 與 **526 !== 524**，760 tests／758 pass／2 fail；不是權限或額度錯誤。同 PR 後續 [43660028715](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43660028715) `3ee61ce1…` success。不把已修正的固定語料數問題當本輪現存故障。
- [Website QA 43634859717](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43634859717)，`2138f4d4…`：Chromium 手機 `refine-from-results-browser.cjs:96` 的 `phone: the entry waits while the search field is on screen`／`false !== true`。後續主線成功；本輪未重現，不宣稱已定位或修復其根因。
- 歷史 [42803248261](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42803248261)／[42820349847](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42820349847) 的 step metadata 為發布等待各 60 分鐘；根因歷史解釋僅作線索，現行已用 exact／superseded 與有界 live walk，不延長等待或取消 main 裁決。

主 workflow PR 可取消舊 head、main 保留每次發布判定；Pages 獨立建置。多專項重跑單元與主線排隊是成本風險，不以一刀切 concurrency 修補。沒有本輪證據需要改快取、權限、容器版本或觸發路徑，故保持不變。剩餘固定語料計數的候選另留待未來 fixture 診斷，不直接改下限換綠燈。

### 最終獨立審查

DeletionFinalReview 最終 **Correct／No code findings**：[原始結論與範圍](review-final.txt)。主 agent 核對 required changeList、兩份 fixture 與最終 800 pass 證據，沒有以 agent 聲稱代替執行。這是獨立 agent 審查，不是 GitHub 人類 approval。所有調查／審查任務已收回；產品程式凍結，接下來只執行 PR／雲端驗收及補記發布證據。

### PR、雲端建置與合併

- 已提交、已推送 `8711548a1efc3f48c4d6254c139e3b10cffbd77d`，[PR #410](https://github.com/RichardHan/ai-agent-use-cases/pull/410)。[獨立審查 comment](https://github.com/RichardHan/ai-agent-use-cases/pull/410#issuecomment-6892498111) 對應同一 head。
- 合併前 head 與 base `a6eb4e8f…` 未變、CLEAN、兩項 checks 全 success：[PR 快照](pr-final.json)。[Website QA 43700582319](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43700582319) 11m57s，[Corpus bundle QA 43700582236](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43700582236) 5m41s 成功。
- [Website QA steps](pr-website-qa.json) 確認真正 Jekyll build、built corpus、語言、發布面與 INDEX 回退均 success；PR 的正式部署三步依既有規則 skipped，不當作已發布證據。
- 2026-11-15 09:55:29 UTC 正常 merge `21d1f9fc351c94163badbb4d7b495aefdad76b14`：[合併紀錄](merge.json)。僅本輪隔離分支快轉，原工作樹與其他 worktrees 保留。
- 對應 [Pages 43701569520](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43701569520)／[主線 Website QA 43701570098](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43701570098) 各以 25 分鐘上限等待，以下正式驗證於實際完成後補記。
- 補驗 390px 完整原文 8,308 字元，dialog scrollWidth／clientWidth 同為 368px，展開後焦點在原 SUMMARY，無頁面溢出：[DOM](preview-long-mobile.json)、[截圖](preview-long-mobile.png)。無 UI 變更，不把此結果描述為改版成效。

### 合併版正式站驗收

- [Pages 43701569520](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43701569520) build／report／deploy 全 success，SHA 精確為合併版本：[steps](pages-release.json)。GitHub 管理的 Pages 有 Node20／Ubuntu 遷移警告，本次未造成失敗。
- 正式 catalog／corpus `sourceRevision` 均精確等於 `21d1f9fc351c94163badbb4d7b495aefdad76b14`；12 個首頁／assets／原始文件逐位元吻合、526 份 corpus 原文字串吻合、完整稽核批次與首頁契約通過：[release.json](release.json)。
- 正式 Chromium 1440×900／390×844 三情境全部通過：[journeys.json](live/journeys.json)、[桌面](live/desktop-detail.png)、[手機](live/mobile-detail.png)。問題入口、原卡焦點、零筆鍵盤移除單條件、分享詳情重整、未實跑限制、固定合併版來源、返回 q／topic 與一筆結果；pageerror／水平溢出皆零。
- 主 agent 實際 Orca 正式站核對：[手機詳情](live-manual.json)；合併版 GitHub 原文實際載入且有 UC-014／未實跑標記。Escape 返回再切1440px，保留 UC-014／topic、一筆、焦點 results-count、無溢出。
- 此時主線 Website QA 仍在執行；以上 Pages／正式走查不取代其真正發布 gate，最終結果於完成後補記。暫時訪客腳本已刪除。

### 最終發布結論

- 主線 [Website QA 43701570098](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43701570098) **success**，head 精確為合併 SHA，09:55:34–10:08:06 UTC：[完整 steps](main-qa.json)，未超過25分鐘等待上限。800 tests／800 pass／0 fail；真正 Jekyll、發布 gate 與正式站走查全部成功。
- [雲端日誌摘錄](main-verdict.txt)：`PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH 21d1f9fc…`、`PUBLISHED_LIVE_BUILD_CURRENT 21d1f9fc…`，正式桌面／手機與 JS-disabled INDEX 回退通過。較早的 SUPERSEDED 行屬 Chromium 回歸腳本，不是實際發布裁決；真正 gate 在10:07:30後執行。
- **已提交、已推送、已合併、部署成功、正式站已驗證。** 沒有本輪未解發布阻塞。覆蓋界線、影像讀取／實機限制、缺 push base 的手動驗證拒絕仍如前述；不聲稱已撤下任何正式檔案或全站每種網址均獲驗證。
- 下一輪先驗 superseded 生成 HTML 過期正文的 fixture，再決定足夠強度的產物核對，不為避免假設故障而改版。
- 最後沿用既有慣例，只提交被 Pages 排除的 `docs/qa/`／`SITE.md` 發布證據，不改已審程式。接續提交的 Pages／sourceRevision／同產品位元再核對一次，收據附 [PR #410](https://github.com/RichardHan/ai-agent-use-cases/pull/410) comment，避免為記自己的 SHA 反覆提交；未觸發的 Website QA 不冒稱重跑。
