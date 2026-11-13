# 2026-11-14 被後續版本取代，仍需走查正式站

## 基準與範圍

- 基準 `origin/main`：`0fc4289186825305c547a89f37c472126c3d9c16`。隔離分支 `RichardHan/aiuc-20261114-evidence`；原工作樹 `90093d7b` 與 159 個未追蹤檔案未改動。無 repository `AGENTS.md`；沿用 README、既有 workflow、`scripts/preview.py` 與 `docs/qa/` 紀錄慣例。
- 正式站：https://richardhan.github.io/ai-agent-use-cases/ 。開工時 catalog/corpus `sourceRevision` = 基準，521 個來源檔、524 筆條目；條目數不是合格真實案例數。
- `node --test tests/*.test.cjs`：基準 **742 通過、0 失敗**；`node --check assets/app.js` 通過。沒有 package.json、獨立 lint 或 type-check 指令，不宣稱執行過。
- 開工時預設 gh 帳號為 `richard-han_tmemu`；發布命令以既有 `RichardHan` 登入憑證逐命令執行，未切換共享帳號設定。main `protected=false`，rulesets 空；不繞過保護規則。既有 open PR 未見同主題，未修改其他 PR/worktree。
- 模型目錄接受 `openai-codex/gpt-6.1-terra`（low/medium/high/xhigh/max）與多 provider 的 `gemini-3.8-flash`（含 high）；不把使用者標籤當精確 ID。主 agent 實際為 `openai-codex/gpt-6.1-sol`；task 的 per-call model/effort 關閉，未改設定，未宣稱 Terra/Gemini 或最高設定已執行。

## 問題與選擇

目標使用者是依 Website QA 綠燈判斷是否可交付的維護者。

現行 `tests/deployed-browser.cjs` 在 `verdict.mode==='superseded'` 時，於 `chromium.launch()` **之前直接 return**。Step 15 證明了產品位元與祖先關係，不能證明訪客能搜尋、開詳情或返回。新版若只是維護紀錄提交，`website-qa.yml` 的 push paths 不包含 docs/SITE，本來就可能沒有自己的 Website QA；因此不能假設「下一個 run 會走查」。

本輪新增真 HTTP 503 伺服器＋真子程序的瀏覽器回歸。對基準程式得到 **exit 0**，新斷言失敗；見 [before-regression.txt](before-regression.txt)。不是用原始碼字串推斷。

- **A（採用）**：保留 Step 15 的位元裁決與 exact 既有完整走查，superseded 改走不綁定本地筆數、案例標題或版面幾何的訪客契約。改動較小，不增加 workflow 觸發數。
- **B**：每個 Pages revision 都新增一支專屬走查。覆蓋更全面，但擴大 docs-only 觸發與部署競態處理，成本與回歸面較大，本輪不採。

不處理：網站外觀、案例內容、工具正規化、concurrency 政策、歷史失敗重跑、所有文件發布各自獨立的 QA run。

## 改動與驗收

- `tests/deployed-browser.cjs`：superseded 仍啟動 Chromium，1440×900／390×844 各走一次：從「會議」問題搜尋、開案例／分享直鏈／重新整理、閱讀主張與核讀摘要、實際請求該版 GitHub 原始來源、Escape 返回並保留查詢與焦點、組合工作情境與無結果字串、鍵盤移除關鍵字而保留情境。檢查 JS pageerror 與水平溢出，記錄實際觀察的 sourceRevision，保存截圖。
- 新 `DEPLOYED_URL` 只供本機／CI 對同一入口做真 HTTP 驗證，預設仍是正式站；未新增第三方服務或訪客資料傳輸。
- `tests/superseded-live-browser.cjs`：真 503 必須非零且錯誤是瀏覽器觀察到的 `Pages response 503`；真 preview 必須完成兩種尺寸的走查。120 秒子程序上限。
- `website-qa.yml`：把回歸接入既有 preview 步驟，PR 與 main 都會實際跑；原先正式站 published-verdict 依賴、權限、時間窗與觸發規則不改。
- `scripts/published-revision.cjs`：僅修正「新版由別人的 run 負責」的過時註解，祖先裁決與兩分鐘等待完全不變。
- `tests/deployed-gate.test.cjs`：保留 superseded 三輪內裁決的行為斷言；移除強制原始碼必須含 `if(...superseded...)return;` 的實作字串斷言與相鄰 wiring 斷言。以真正會抓到壞站假綠燈的瀏覽器回歸取代，不再把錯誤行為釘成測試契約。

## 實測

```sh
NODE_PATH=/Users/richard_han/orca/ai-agent-use-cases/node_modules \
  ROUND_URL=http://127.0.0.1:8146/ai-agent-use-cases/ \
  node tests/superseded-live-browser.cjs
node --test tests/*.test.cjs
node --check tests/deployed-browser.cjs
node --check tests/superseded-live-browser.cjs
python3 scripts/check_corpus_bundle.py /tmp/aiuc-1114-preview/ai-agent-use-cases
node scripts/check-published-surface.cjs
```

- 回歸先紅後綠：基準壞站 exit 0；修正後壞站因 HTTP 503 非零、正常 preview 桌機／手機全部完成。
- 最終單元套件 **742 通過、0 失敗**，見 [unit-summary.txt](unit-summary.txt)；兩支修改的 browser 腳本語法檢查通過。
- Preview 建置 `python3 scripts/preview.py /tmp/aiuc-1114-preview/ai-agent-use-cases` 完成；521 個來源逐 byte 一致。發布面檢查通過（826 檔，5.77 MiB，9 項排除）。
- 本機沒有 Jekyll/github-pages gem 或 Docker，不能把 preview 當真正 Pages build。曾對 preview 執行 `check-page-language.cjs`，`index.html` 通過、`INDEX.html` 因缺少 Jekyll 產生的 `og:locale` 失敗：這是 preview 不產生 Jekyll 頁首的限制，不能宣稱 build/language 全通過；真正 Jekyll build 與產物語言驗證由 PR 的 Website QA 執行。
- 正式站於基準 revision 真正執行 superseded 路徑：桌機／手機三情境全過，來源 HTTP 成功、無 pageerror／水平溢出。另以 Orca browser 開首頁、問題查詢、組合空結果→保留查詢恢復 1 筆、UC-024 詳情、來源 GitHub 頁與 Escape 返回；7/524 → 空結果 0/524 → 復原 1/524，詳情有成果主張與本庫未獨立重現說明，關閉焦點回 `results-count`。
- 本輪沒有改產品輸出，沒有外觀前後差異可比較。保存的 `superseded-*-detail.png`、`superseded-*-recovered.png` 是走查證據；影像讀取工具回 `Image reading is disabled`，不宣稱人工目視審查、讀屏或 WCAG 全面通過。版面結論限於 DOM 幾何與實際鍵盤操作，沒有量測效能分數。

## 獨立調查與審查

- Actions 調查重新查詢 main 40 支 Website QA＋20 支 Pages：57 success、2 failure、1 cancelled；兩個 failure 都是先前已修的 3600 秒等待，不能說目前仍頻繁失敗。最新 `0fc42891` 的 [Website QA 43344517271](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43344517271) 是 exact、正式站步驟真跑了 41 秒；Pages [43344516289](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43344516289) success。
- 缺口仍有真實現場：[42965537876](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42965537876)（`b8858087`）正式站步驟 `05:37:30→05:37:30`，success 但 0 秒；後續 live `d70f13f0` 只有 Pages run、沒有自己的 Website QA。這和本輪真 503 得 exit 0 的證據一致。
- 未參與實作的 reviewer 發現一項 P2：若把外部 GitHub 來源的 HTTP 429 當作 Pages 失敗，就會重製外部限流造成的假紅燈。已沿用 `reader-controls-browser.cjs` 的既有政策修正：站內來源入口必須是固定 revision 的 repo URL；實際 HTTP 狀態另記 `LIVE_EXTERNAL_SOURCE`（不可達也記錄），不把第三方可用性當本站健康。本站首頁 503、搜尋／詳情失敗、JS 錯誤仍然非零，不忽略。
- 修正後重驗實際出現桌機 GitHub HTTP **429**、手機 **200**：兩種本站流程仍全部完成，真本站 503 仍非零；見 [after-regression.txt](after-regression.txt)。Reviewer 複審確認 P2 已解決、無新增 must-fix；複審只讀最終程式與紀錄，未重跑測試。整合者自行重跑上述真瀏覽器回歸。
- 調查 agent 的其他建議未盲採：不新增 docs-only 全套 CI、不用 source-text 斷言釘住新實作；本輪消除的是不走查的綠燈缺口，不改發布位元判準。內容調查的 UC-179 候選已由整合者核對原文及正式站，列為下一輪。

## 發布證據與接續

交付 PR、整合 SHA、獨立 review、實際 Actions 結果及合併後版本核對，集中記在本輪 PR 的發布紀錄留言（避免為了把自身 commit SHA 寫進檔案而無限產生文件 commit）。此處會在 PR 建立後附上固定連結；未完成前不宣稱已部署。

下一輪最值得處理：**UC-179 的成果主張者誤標**。獨立調查發現頁首寫「官方挑選的具名測試者實用引言」，正文是 Meta 引用外部客戶 April Polk 的使用回饋；整合者已在正式站 `?case=UC-179` 核對第一屏仍印「成果主張：官方團隊／原廠自述」。先讀原引言與頁首，再建立「發布者不等於主張者」的回歸；同時檢查 UC-107／108 的主持人整理取得方式，不能直接把所有官方公告降成作者自述。本輪不跨題修改這些案例。
