# 2026-11-15：機器人帳號不是工具使用證據

## 基準與選擇

- GitHub 身分 RichardHan；預設 main；原工作樹乾淨，HEAD `5a1663e85d794aa7c77e8ee4cd236b6d56cea2c7`。安全 fetch 後從 `b52c51b1065fdf1bcb41f375cdfdeb728bed44e6` 建立隔離分支 `improve/2026-11-15-publication-evidence`，worktree `/tmp/ai-cases-publication-20261115`。原 main 與另外三個工作樹未移動，開始時沒有開啟中的 PR。
- 無 tracked AGENTS.md；沿用 README、SITE、前輪 cursor-context QA、Website QA 與 `_config.yml`。沒有另外定義的 lint／type check；語法檢查不稱型別檢查。
- 實際主模型 `openai-codex/gpt-6-astra`。目錄列出 Terra 正式 selector（例如 `factory-droid/gpt-6.1-terra`、`litellm/gpt-6.1-terra`），支援 low／medium／high／xhigh／max；`gemini3.8` 無結果，`gemini-3.8-flash` 目錄支援 low／medium／high，但無設定將使用者環境標籤綁定至某 provider。平台 `task.perCallModel=off`、thinking=auto，未切模型、未宣稱最高推理、未另接付費管道。find judge 不可用，改文字搜尋；LSP references 無 server。

目標訪客：用工具篩選找可採用案例的人。正式站 `?q=UC-383&scope=topic&tool=Cursor#explore` 回傳 UC-383，卡片為 `Grok Bot / Cursor / GitHub`；原頁只在 `cursor[bot]` 作者帳號提及 Cursor，流程歸屬為 Grok Bot。重新取得公開 [#6742](https://github.com/learn-ukrainian/learn-ukrainian.github.io/issues/6742) 與 [#6719](https://github.com/learn-ukrainian/learn-ukrainian.github.io/pull/6719)，都把發現歸給 Grok Bot；前者有 Cursor 帳戶／方案背景，但不是案例另行宣告使用 Cursor 開發工具。[來源快照](attribution-source.json)。

比較：
1. 只修 UC-383／改原文：成本低，但以特例掩蓋帳號與產品的混淆，不採用。
2. **工具正規化排除完整 GitHub `[bot]` 帳號**：保留同句其餘產品提及，不變更原文。沿用現有工具辨識管線，不新增抽象或依賴。

驗收：UC-383 移出 Cursor 篩選、UC-158 的明示 Cursor 保留；原文帳號與全文搜尋保留；零結果可復原，直鏈、來源與返回保留搜尋條件。範圍不含一般帳號歸屬、通用語意分類、工具清單擴充或 CI 改版。

## 實作與驗收

- `assets/app.js`：只在工具辨識移除完整 bot login，不刪整句。`README.md` 說明界線。
- `tests/tool-mention-fidelity.test.cjs`：帳號原文、code、Markdown 連結、其他 bot 名稱、同句正向產品及真實 UC-383／UC-158。
- `tests/bot-account-browser.cjs`：1440×900、390×844、320×740 三尺寸，從「外部 QA」問題探索、Cursor 組合零結果與復原、鍵盤焦點、詳情分享直鏈／重整、固定版本原文來源、返回、全文搜尋與正向 Cursor 案例；沿用 discovery runner，不新增 workflow。
- 基準 `node --test tests/*.test.cjs`：768 通過。[基準](baseline-unit.txt)。新增回歸先 2 失敗：[紅燈](red-unit.txt)；修改後 770 通過、0 fail／skip：[最終](final-unit.txt)。`node --check assets/app.js`、新 browser script 語法通過。
- 全庫 529 條目只有 UC-383 的 tools 及依賴工具的四個 search 字串改變；原始 Markdown 與門檻不變：[影響](corpus-impact.json)。最初診斷腳本錯假設 tools 以外所有衍生欄位也不變，因 search 字串包含工具 metadata 而失敗；改為逐欄記錄差異，沒有修改產品搜尋行為來迎合診斷。
- `python3 scripts/preview.py /tmp/ai-cases-preview/ai-agent-use-cases` 建立預覽；不是正式 Jekyll build。基準 `node scripts/check-published-surface.cjs`：833 檔、5.84 MiB、9 項排除通過。真正 Jekyll build 由 PR Website QA 驗證。
- 基準 `NODE_PATH=…/node_modules node tests/discovery-browser.cjs` 三尺寸、載入失敗／重試／空 catalog／部分來源、完整探索與分享通過：[基準 browser](baseline-browser.txt)。
- 新 browser 首跑因全文搜尋中的交叉引用使 `hasText('UC-383')` 選到三張卡，strict selector 失敗：[首次](first-browser.txt)。修為穩定 `data-case-id`，沒有放寬斷言或改產品。

主 agent 另以實際瀏覽器走查正式站桌面／手機首頁、收件匣問題入口、搜尋＋Cursor 篩選、零結果任務復原、UC-383 詳情與原始 Markdown；固定 `b52c51b…` GitHub 頁載入成功，正文含原始帳號。預覽桌機卡片顯示 `Grok Bot / GitHub`；手機 Cursor 組合 0 筆，清除後保留 UC-383、重選 topic，開啟／Escape 返回焦點與條件保留，無水平溢出。
- 修正選取器後完整 discovery exit 0：新三尺寸 bot 帳號情境、原有 card/cursor、搜尋篩選／空結果、分享備援、載入失敗／重試／部分來源均通過：[最終 browser](final-browser.txt)。首頁 axe 三尺寸各 0 違規：[結果](accessibility.json)；不是全站人工無障礙認證。[主 agent 實走](manual-journeys.json)。

## 截圖與限制

同查詢 `?q=UC-383&scope=topic#explore`、Chromium 同尺寸卡片：

| 尺寸 | 修改前 | 修改後 |
|---|---|---|
|1440×900|[前](before-1440.png)|[後](after-1440.png)|
|390×844|[前](before-390.png)|[後](after-390.png)|
|320×740|[前](before-320.png)|[後](after-320.png)|

環境停用影像輸入；保存實際截圖並驗證 DOM／幾何與操作，不宣稱逐像素目視、實體手機、螢幕閱讀器實聽、真人研究或轉換率成效。未做效能測量。axe 結果只代表自動化覆蓋頁面。

## Actions 與發布接續

開始時最近 20 個 main runs 全 success：[即時清單](actions-baseline.json)。最新 Pages [43684010617](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43684010617) 對應基準 `b52c51b…`；最近產品 Website QA [43683038491](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43683038491) 對應 `57182ce2…`。docs-only 基準未觸發 Website QA，不冒稱該 SHA 重跑。PR 可取消舊 run，main 保留發布裁決；Pages 與 QA 各自執行，QA 後驗版本。沒有重跑舊失敗或更動 workflow。

ActionsEvidence 調查已收回，主 agent 另取原始 ZIP 核對：[失敗步驟摘錄](actions-failures.txt)。
- Website QA [43634859717](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43634859717)，main `2138f4d49b0c8645d145f0d23549c4ffc75121c5`：Chromium 步驟 `refine-from-results-browser.cjs:96`，`phone: the entry waits while the search field is on screen`、`false !== true`。後續已有視口前提修正，本輪不重跑舊失敗。
- PR Reading flow QA [43659142842](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43659142842)，head `6322e0c65f322a87b0e890e72f175d607ffdb536`：Baseline tests and static preview，`method-and-prompt-alignment.test.cjs:29` 的 `522 !== 520`、`prompt-copy.test.cjs:75` 的 `526 !== 524`；是資料成長撞上固定總數，不是權限或 Pages 故障。當前基準與最終全套均通過。
- 調查另提出發布比對覆蓋候選。主 agent 核對後修正其過度結論：`INDEX.html` 在 exact 分支確實逐位元比對，不能稱永遠沒驗；`PUBLISHABLE_FILE` 的 superseded 變更集合未涵蓋 INDEX／README／templates／audit-summary，需下一輪以 fixture 驗證盲點再決定修法。這不是本輪觀測到的發布失敗。

PR／main QA 等待各上限 25 分鐘；Pages 版本核對採既有有界驗證。未完成的發布不能當作通過，發布結果於完成後補記。

## 下一輪

先驗證發布比對的檔案覆蓋：以僅修改 `templates/case.md`／`audit-summary.json` 的 fixture 測 exact 與 superseded 是否能拒絕舊產物，再核對 Jekyll 轉換後的 INDEX／README 路徑。這比繼續疊加工具字面規則更值得優先；不直接將調查猜測當已證實故障。
