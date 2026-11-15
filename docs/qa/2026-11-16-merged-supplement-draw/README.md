# 2026-11-16：已併入的補充頁不再抽卡，手機看得到待查差額

## 基準與選題

- 原工作樹 `main` 落後 43 個 commit；安全 fetch 後 `origin/main` 為 `481dd271`（PR #424 合併），工作樹乾淨。沿用 README、SITE、`_config.yml`、最近 adoption-boundaries QA 與 Website QA；repo／父層沒有 `AGENTS.md`。隔離 worktree：`/tmp/aiuc-r3-20261116`，分支 `improve/2026-11-16-visitor-r3`，自 `origin/main` 建立。原工作樹、其他 14 個 worktrees 未動。
- 執行模型實際是 `litellm/deepseek-flash-gmi`；`task.perCallModel=off`。`omp models find` 可列出 `gpt-6.1-terra`（factory-droid／litellm／openai-codex，low–max）與 `gemini-3.8-flash`（cursor／factory-droid／litellm，low–high），但本輪無法切換，未宣稱使用 Terra、Gemini 或最高推理。使用者提供的「gemini3.8:high flash」標籤未能對應到已證實的 model ID。
- 正式站 `sourceRevision` = `f2adf6db87726ae2cceed385841b23b2de2fcbbf`（`catalog.json`，2026-11-15 build），搜尋顯示 529 筆、526 來源檔。
- 基準：`node --test tests/*.test.cjs` 853 pass／0 fail（[輸出](baseline-unit.txt)，於 `origin/main` detach worktree 執行）。repo 沒有另外定義 lint／type check。

### 觀測到的兩個問題

1. **已併入的補充頁仍被當成獨立可抽案例。** 正式站首頁抽卡狀態寫「這組條件有 **514** 張可抽案例卡」；`?q=UC-250` 顯示 1 筆結果，抽卡狀態寫「有 **1** 張可抽案例卡 · 第 1 張：郵件搬家另一位作者的經驗，已合併原案例」，按鈕可抽。`cases/250-mail-migration-data-routing-cutover.md:1` 自己寫「已合併UC-156，不另計」，`Discovery.discoveryPool()` 卻只排除待查線索、模板與尚待查證，沒有排除 `mergedInto`。1440／390／320 三個尺寸重現（[前](live-draw-phone.png)、量測見 [draw-pool-before-after.json.txt](draw-pool-before-after.json.txt)）。
2. **手機看不到 529 與 522＋3＋2 的差額說明。** `#pending-note` 由 JS 設為 `hidden=false` 並寫入「另有 2 個待查線索已處理並併入案例…」，但 `assets/style.css` 的 `@media(max-width:640px){.stats p{display:none}}` 把 `.stats` 內所有 `<p>` 隱藏；`#audit-status` 有 `#audit-status{display:block}` 覆寫，`#pending-note` 沒有。正式站 390／320 的 `#pending-note` computed `display:none`、高度 0，桌面高度 18px。結果：手機讀者在搜尋看到「529 筆收錄」，統計卡只加得到 527，且沒有說明；讀屏也讀不到（`display:none` 不在無障礙樹）。`tests/evidence-attribution-browser.cjs` 原本只讀 `textContent`，所以沒抓到。

## 方案與選擇

- 問題 1：①保留抽卡，但在卡片與狀態明示「已併入」；②排除在抽卡池外，保留搜尋、篩選、結果與詳情入口。選②：抽卡的目的在提供獨立可參考的用法；頁面自己已宣告「不另計」，再抽到重複補充頁只會浪費一次探索。①仍讓「可抽案例卡」的計數與語意衝突。實作只改 `Discovery.discoveryPool()` 的既有排除清單，沒有新增狀態或分類。
- 問題 2：①在別處另加一段手機專用說明；②讓既有的 `#pending-note` 在手機顯示，沿用 `#audit-status` 的閱讀規格。選②：同一份資料、同一個 live 區塊，不製造第二套文案；`.stats p{display:none}` 對其他段落的既有意圖不動。
- 這兩個修正共用同一條規則：**已併入／已處理的條目可以讀，但不獨立計入探索**。未改搜尋語意、案例資料、來源分類或計數母體。

驗收條件：`?q=UC-250` 仍回 1 筆可讀結果，但抽卡狀態為 0 張、按鈕停用並說明原因；首頁可抽卡由 514 變 513、非可抽由 15 變 16；`?q=UC-156` 仍可抽；390／320 的 `#pending-note` rendered、高度 > 0、文字與算術一致、無水平溢出；桌面維持 18px。

範圍外：branch protection、16 個 workflow 的 PR fan-out、每案例 unfurl metadata、`main` 未保護；`/favicon.ico` 404。另查核訪客審查 agent 的兩個說法為誤報：`.detail-source-latest` 在版本固定後是 `hidden=true`／`display:none`（不會導到同一個固定 blob），詳情 `document.title` 也是案例專屬標題（`UC-054 · …｜AI 用法實驗室`）。

## 實作

- `assets/discovery.js`：`discoveryPool()` 排除 `(item.mergedInto||[]).length` 的條目，註解說明保留搜尋、不花一次抽卡。
- `assets/app.js`：空抽卡池說明加入「已併入主案例的補充頁不列入抽卡」。
- `index.html`：抽卡註記改為「待查線索、模板補充與已併入主案例的補充頁可在下方搜尋」。
- `assets/style.css`：在既有的 `@media(max-width:640px)` 區塊新增 `#pending-note{display:block;…}`，只在手機覆寫 `.stats p{display:none}`；桌面維持原本 `.stat-sub` 的 12px／18px，`hidden` 屬性仍由 JS 控制。
- `README.md`：記錄手機差額說明與已併入補充頁的可搜尋／不可抽卡規則。
- 測試：`tests/discovery.test.cjs`（fixture 與排除規則）、`tests/discovery-clarity-and-ci-resilience.test.cjs`（真實 UC-250／UC-156 metadata）、`tests/evidence-attribution-browser.cjs`（390／320 rendered note、文字、算術、溢出）。

## 回歸與訪客驗收

- 紅：新增 fixture 後，`discovery.test.cjs` 與真實案例測試共 4 項失敗（合併頁仍在池內、deck round 被多一筆打亂）；正式站量測顯示 514／1 張／手機 note `display:none`。
- 綠：`node --test tests/*.test.cjs` **855 pass／0 fail**（[final-unit.txt](final-unit.txt)）；`node --check assets/app.js`、`assets/discovery.js` 成功。
- 預覽：`python3 scripts/preview.py /tmp/r3-preview/ai-agent-use-cases`，`http://127.0.0.1:8137/ai-agent-use-cases/`（僅本機）。
- `tests/evidence-attribution-browser.cjs`（含新增手機檢查）：exit 0（[輸出](evidence-attribution.txt)）。
- `tests/result-count-honesty-browser.cjs`：exit 0（[輸出](result-count.txt)）。
- `tests/draw-stability-browser.cjs`：`DRAW_STABILITY ok`（[輸出](draw-stability.txt)）。
- `tests/discovery-browser.cjs`：1440／390／320 三尺寸 guided discovery、抽卡、鍵盤、組合篩選、空結果復原、待查排除、直鏈、重整、返回、溢出全部 PASS，axe 0（[輸出](discovery-browser.txt)）。此測試硬編 8081，執行時用 `/tmp/r3-tests` 的副本只改 origin 為 8137，repo 內檔案未改。
- 自建量測（`/tmp/r3-check.cjs`，未提交）：正式站 514／UC-250 1 張／手機 note none；預覽 513／16 非可抽／UC-250 0 張且停用／390・320 note `display:block`、高度 44、桌面 18（與正式站相同）、無溢出；`?q=UC-156` 3 張可抽（UC-250 為其中 1 筆非可抽結果）。exit 0，完整輸出 [draw-pool-before-after.json.txt](draw-pool-before-after.json.txt)。
- 前後截圖（元素級，Playwright）：統計卡與 `?q=UC-250` 抽卡區，各 1440／390／320：[桌面前](live-stats-desktop.png)／[後](preview-stats-desktop.png)、[手機前](live-stats-phone.png)／[後](preview-stats-phone.png)、[320 前](live-stats-small.png)／[後](preview-stats-small.png)；[手機抽卡前](live-draw-phone.png)／[後](preview-draw-phone.png)、[桌面抽卡前](live-draw-desktop.png)／[後](preview-draw-desktop.png)、[320 抽卡前](live-draw-small.png)／[後](preview-draw-small.png)。幾何與文字量測在 [measurements.json](measurements.json)。
- 邊界量測：639／640px note `display:block`、高度 44；641／768px 高度 18；四者水平溢出皆 0。
- 限制：本環境停用影像輸入，沒有逐像素目視截圖；上面是 DOM／computed style／幾何證據。未用實體手機、讀屏實聽或跨引擎（Firefox／WebKit）重跑；preview 是靜態預覽，不是 Jekyll build。未做效能基準。

## Actions、獨立審查與發布

- 本輪即時檢查（2026-11-16）：最近 200 個 runs 全部 success，0 failure／cancel／timeout／重跑；2026-11-15 當日 330 runs 有 19 failure，集中在 00:38Z 與 00:08Z 兩個壞 commit，其中一個 push 觸發 16 個 workflow 全紅——是壞 commit 的 blast radius，不是目前的不穩定。單一 assets PR push 啟動 16 個 run、約 69 runner-minutes、critical path 12m06s；`main` 未受保護、required checks 為空，但 Pages 可由 `sourceRevision` 對版。**本輪不改 CI**，避免把健康狀態當故障處理。
- 獨立審查：`ReviewR3`（獨立 context，未參與實作）核對最終 diff、真實 metadata 掃描（僅 UC-250 有 `mergedInto`）與 855 單元測試，verdict approve、0 findings；它無法載入 Playwright，瀏覽器面由本輪量測與 Website QA 補足。主 agent 另核對審查未涵蓋的手機 rendered 狀態。
- 發布：待 PR、merge、Pages 與正式站核對後補記。
