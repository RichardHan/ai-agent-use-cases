# 2026-11-15：分頁 cursor 不冒充 Cursor 產品

## 基準與決策

- 安全 fetch 後以 `96e9105a497dfcba831210e185088ae969e82ea0` 建立隔離分支 `improve/2026-11-15-source-trust`、worktree `../ai-agent-use-cases-source-trust`。原 main `5a1663e8` 與 reliable-discovery／verification 工作樹保留；開始時三者乾淨、沒有開啟中的 PR。GitHub 身分 RichardHan，預設分支 main。
- 無 tracked AGENTS.md；沿用 README、SITE、最近 complete-card-tools 接續紀錄、Website QA 與 `_config.yml` 發布排除規則。未另定 lint／type check，語法檢查不稱型別檢查。
- 模型 catalog 有 `gpt-6.1-terra`（low/medium/high/xhigh/max）與 `gemini-3.8-flash`（low/medium/high）；`gemini3.8` 查無直接 ID。主 agent 實際為 `openai-codex/gpt-6-astra`，設定 `task.perCallModel=off`、thinking=auto；未宣稱切換候選模型或使用最高推理，未另接付費服務。find judge unavailable，改文字搜尋；LSP references 回覆無 server。

## 證據與方案

目標使用者：按工具找可採用案例、需要知道卡片工具歸屬是否可信的人。

正式站 `?q=UC-227&scope=topic&tool=Cursor#explore` 回傳 UC-227，卡片列 `Meta Muse / Cursor`。頁首只有 Meta Muse／Google Maps；補充的 cursor 是持久續跑進度。重新讀取[固定來源的批次程序](https://github.com/chinami-michaels/instagram-saved-reels-sort/blob/27a36766d0115eb15a4b8cf945f42339c66243e1/references/batch-procedure.md)，原文是 saved cursor、cursor.txt、已處理頁數與失去游標時 advance N，並非 Cursor 產品。

1. 只認大寫 Cursor：簡單但會漏掉小寫產品名，不採用。
2. **排除明示的資料游標詞組**：沿用工具文字正規化，只去除該次 cursor，不刪整句；保留另一個正向產品提及。另將既有去重段落排除規則涵蓋 `- 去重：` 行內紀錄，否則 UC-227 的同一游標在去重說明仍誤掛工具。

範圍：卡片／抽卡／工具篩選共用 metadata，原始 Markdown、來源、ID、全文搜尋與難度推測不變。不是通用語意消歧，沒有擴充工具清單或重設網站。小寫 `cursor` 後接完整重同步／遺失狀態詞才排除；有受詞的產品失敗敘述如「Cursor 遺失檔案」保留。

## 驗收與證據

- [先紅](red-unit.txt)：真實 UC-227 多出 Cursor；正向產品案例測試通過。
- [全庫影響](corpus-impact.json)：529 條目只有 UC-227 工具陣列由 Meta Muse／Cursor 改成 Meta Muse，該案例原文與難度相同。
- `tests/tool-mention-fidelity.test.cjs`：真實案例、資料游標詞組、行內去重、小寫產品名、產品失敗及同句混合情境。
- `tests/cursor-context-browser.cjs`：沿用 discovery CI 入口，1440×900、390×844、320×740；以「地圖收藏」找到案例、舊 Cursor 組合誠實零結果、清除篩選保留查詢、鍵盤詳情返回焦點、分享直鏈重整與固定版本來源、全文仍可搜 cursor、真實 Cursor 案例仍在。
- 基準單元 766／766 通過；[完整輸出](baseline-unit.txt)。基準 discovery 三尺寸通過，涵蓋載入失敗／重試、空 catalog、部分來源、分享 fallback；[輸出](baseline-browser.txt)。首次誤用不支援的 DISCOVERY_URL 導致連線 8081 拒絕，修正為啟動既有固定埠後才驗收，不算產品故障；[原錯誤](baseline-command-error.txt)。
- 本機 preview 由 `python3 scripts/preview.py /tmp/aiuc-cursor-preview/ai-agent-use-cases` 建立；526 來源逐位元一致。正式 Jekyll build 須由 PR Website QA 核對，不把 preview 當正式 build。

- 最終整合 `node --test tests/*.test.cjs`：768 通過、0 失敗／略過；`node --check assets/app.js` 與新 browser 腳本通過。[輸出](final-unit.txt)。
- `node tests/discovery-browser.cjs`：三尺寸新情境、完整探索、載入／錯誤／空資料／部分來源復原通過；[輸出](final-browser.txt)、[首頁 axe](accessibility.json) 各 0 違規，非全站人工認證。
- 首次新 browser 測試錯把「清除篩選」後的命中範圍當成仍為 topic；既有 `clearFacets()` 明確重設 scope。修正測試前提為復原後用控制項重新選 topic，再檢查分享／返回保留它，沒有降低斷言或改產品契約。[原失敗](first-browser.txt)。
- 主 agent 另外以實際瀏覽器在桌面／手機走過三情境；原始 GitHub 固定版本頁實際載入成功。[紀錄](manual-journeys.json)。
- 獨立 reviewer 發現「續跑 Cursor Cloud Agent」會被過寬前綴誤刪。移除該歧義前綴，且保留帶 Cloud／Agent／CLI／IDE 的產品名稱，加入兩個正向回歸；修後相關 11 單元與三尺寸情境通過：[單元](review-unit.txt)、[瀏覽器](review-browser.txt)。未將修正前全套結果冒稱為修正後重跑全套，最終全套另由 PR QA 驗證。

前後同一查詢 `?q=UC-227&scope=topic#explore`、同尺寸 Chromium 卡片截圖：
|尺寸|前|後|
|---|---|---|
|1440×900|[前](before-1440.png)|[後](after-1440.png)|
|390×844|[前](before-390.png)|[後](after-390.png)|

影像輸入被環境停用；保存實際截圖、驗證 DOM／幾何與操作，不宣稱目視逐像素審查、真人研究或實機驗證。無效能／轉換率測量。

## Actions、獨立審查與發布

基準 Pages [43680030534](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43680030534) 對應 `96e9105a` success；最新產品 merge 的 Website QA [43678905015](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43678905015) 對應 `31a3cfb7` success。docs-only 接續提交不觸發 Website QA，不冒稱該 SHA 重跑了 QA。本輪未改 workflow。

兩個調查 agent 已收回。ActionsEvidence 的 raw log 取得受限，主整合者用授權 gh API 另取原始 ZIP 補核：
- 最近 60 runs 查得全 success：[即時快照](actions-baseline.json)。
- [43659142852](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43659142852)，PR head `6322e0c65f322a87b0e890e72f175d607ffdb536`，單元步驟：`method-and-prompt-alignment.test.cjs:29` 的 `522 !== 520`、`prompt-copy.test.cjs:75` 的 `526 !== 524`。是新增內容撞上精確筆數斷言，不是部署／權限／額度故障；本輪基準已通過。[原始斷言](research-pr-failure.txt)。
- [43634859717](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43634859717)，main `2138f4d49b0c8645d145f0d23549c4ffc75121c5`，Chromium 步驟 `refine-from-results-browser.cjs:96` 手機輸入框視口前提失敗；後續版本已修。[原始日誌](actions-failure.txt)。
- PR 可取消舊 run，main Website QA 保留發布裁決；Pages 獨立發布、QA 後驗；無快取的重複安裝／多 workflow 重跑單元是成本，不是本輪觀測新故障。沒有重跑舊失敗、降低斷言或修改 workflow。
- VisitorEvidence 獨立核對 UC-227，另提 UC-383 的 `cursor[bot]` 帳號字樣為候選；主 agent 讀原文確認其明示不可單獨當產品辨識證據。它不是分頁游標，留作下一輪先驗，不把本輪說成所有 Cursor 語意問題已解決。

獨立 `CursorFinalReview` 未參與實作；修正上述 P2 後複審結論 **Correct，無剩餘 actionable findings**，並讀取 11／11 單元與三尺寸瀏覽器證據。主整合者另核對執行 exit 0，非只轉述 reviewer。PR head／合併 SHA／Pages／正式站版本於發布後補記。PR 與 main QA 等待各上限 25 分鐘；版本核對採既有有界檢查，超時保留未確認狀態。

## 下一輪

先驗 UC-383 的 `cursor[bot]` 帳號是否在正式站誤列 Cursor 產品，再核對明示 Cursor 的 UC-158 正向對照與全庫差異；不要一律抹去 `[bot]` 或小寫名稱。本輪不宣稱完成通用工具語意分類。

## PR 與合併

- 實作 commit [`9c0c8a741c733f5d15fa6b874baca8d7c9077bc1`](https://github.com/RichardHan/ai-agent-use-cases/commit/9c0c8a741c733f5d15fa6b874baca8d7c9077bc1) 已推送；[PR #406](https://github.com/RichardHan/ai-agent-use-cases/pull/406)。
- 合併前 API 核對 head 精確為上述版本、base `96e9105a497dfcba831210e185088ae969e82ea0`，18 個 checks 已結束（16 success、2 個 PR 不發布的 published skipped），mergeState CLEAN。[檢查快照](pr-final.json)。
- [PR Website QA 43682260574](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43682260574) success，對應同一 head；修正後全套單元、Chromium、真正 Jekyll build、建置 corpus 與語言檢查均 success。[步驟證據](pr-website-qa.json)。
- 獨立審查對應同一 head，保存於 [PR comment](https://github.com/RichardHan/ai-agent-use-cases/pull/406#issuecomment-6889900734)。不是 GitHub 人類 approval。
- 2026-11-15 05:54:00 UTC 正常 merge，合併 SHA [`57182ce2b21a868be31e1d23bb22af12325b4622`](https://github.com/RichardHan/ai-agent-use-cases/commit/57182ce2b21a868be31e1d23bb22af12325b4622)。只將本輪 worktree 快轉至合併版；原 main 與其他 worktree 不移動。Branch protection API 回覆未保護、rulesets 為空；仍等待全部 PR checks 通過，沒有管理員略過。

## 合併版正式站驗收

- [Pages 43683038190](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43683038190) success，head 精確為 `57182ce2b21a868be31e1d23bb22af12325b4622`；build／deploy 成功。[步驟證據](pages-release.json)。
- `GITHUB_SHA=57182ce2b21a868be31e1d23bb22af12325b4622 node tests/deployed-browser.cjs` 通過，回報 `PUBLISHED_LIVE_BUILD_CURRENT` 精確同版，桌面／手機首頁、搜尋、情境、詳情、重新整理、返回、空結果復原及 JS 停用索引回退成功。[輸出摘要](live-browser-summary.txt)。
- 正式站 origin 執行 `tests/cursor-context-browser.cjs`：1440／390／320px 三情境、Cursor 零結果復原、鍵盤焦點、直鏈／重新整理／來源／返回、原文字面搜尋與正向 Cursor 案例均通過。[輸出](live-cursor.txt)。
- 主整合者另開正式站桌面／手機，卡片皆為 `UC-227 · Meta Muse`；固定合併 SHA 的 GitHub 原始 Markdown 實際載入成功，核讀限制與搜尋返回保留。[實走紀錄](live-manual.json)、[桌面](live-1440.png)、[手機](live-390.png)、[320px](live-320.png)。
- [版本與位元核對](release.json)：catalog `sourceRevision` 精確同合併 SHA，526 來源；app 與受審程式逐位元一致，401188 bytes，SHA-256 `cdffc61c8598fc6549f68156351669815dc8390317d8f0fd0ec573513e2c1a4f`。
- PR 原始 log 確認修正後全套 768 pass、0 fail／skipped，以及三尺寸新情境皆通過：[摘要](pr-unit-and-cursor.txt)。
- GitHub 管理的 Pages workflow 有 Node 20／ubuntu-latest 遷移警告，但本輪 build／deploy 成功；沒有把警告稱為本輪故障或擅自改平台流程。

## 發布結論

- 合併版 [Website QA 43683038491](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43683038491) **success**，head 精確為 `57182ce2b21a868be31e1d23bb22af12325b4622`；全套單元、Chromium、Jekyll、建置完整性、發布資產等待及正式站驗證皆成功。[機讀結果](main-qa.json)。
- PR 等待約 11 分鐘、main QA 等待約 12 分鐘，均未達 25 分鐘上限；沒有重跑失敗 workflow。
- **已提交、已推送、已合併、部署成功、正式站已驗證**。沒有本輪產品發布阻塞；有限字面規則、影像目視／實機限制及下一輪帳號歸屬候選仍如上。
- 本段、SITE 與正式站證據沿用既有慣例，以只改 `docs/qa/`、`SITE.md` 的接續提交保存；兩者由 `_config.yml` 排除發布面，不改受審產品。接續提交觸發 Pages 後再核對 sourceRevision 及相同 app 位元，結果附於 PR，不把未觸發的 Website QA 稱為再次通過。
