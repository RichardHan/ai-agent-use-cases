# 2026-10-19：空結果的最少組合調整

## 問題、方案與範圍

基準 `0f6153f`，從 `origin/main` fetch 後建立隔離工作樹 `/tmp/ai-search-clear`；原工作樹的 `tests/search.test.cjs` 未提交修改完整保留。期間協作者將搜尋修正合併為 `956ac58`，本輪正常 merge 後再驗證，沒有衝突或覆蓋。研究 PR #58 的案例與索引不在本輪修改範圍。此 repo 無適用 AGENTS.md。

正式站雲端走查（[基準 run](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39256710906)）：首頁、旅遊搜尋＋生活篩選、詳情、來源連結與 Escape 返回皆可操作。但 `?q=UC001&scenario=開發&kind=pending` 顯示 0 筆，且沒有可行調整建議；移除任一單項仍為 0。手機已收起篩選器，只剩逐項猜測或全部清除。

目標讀者：沿用分享條件或逐步探索，因多個篩選互相排除而找不到內容的人。

- 方案 A：補強空結果說明。成本低，但讀者仍需逐項試錯。
- 方案 B（採用）：列出需要一起移除的最少條件與真實筆數，保留關鍵字及其餘篩選。成本中等，能直接接回閱讀。

驗收：單項可解時沿用既有建議；否則只提供最少移除數量的方案（最多三個）。筆數以目前載入全文及未移除條件計算。操作後 URL、保留條件、結果與鍵盤焦點一致。涵蓋空 corpus、未知／長情境、部分載入、錯誤、直鏈重新整理與返回。不改案例、證據、同義詞、品牌或框架，不新增外部服務／追蹤。

## 修改

- `assets/app.js`：純函式 `combinedRelaxationOptions` 依移除項數尋找最小可行集合；只在單項建議不存在時呈現，明講「一起移除」與保留條件。一次更新條件並 render，焦點交給結果數。
- 補讀重新 render 時，以組合條件簽章恢復同一按鈕焦點；若方案消失，沿用結果數 fallback。
- 沿用既有按鈕對比、44px 點擊高度、換行與手機樣式，不為此另換配色。
- 新增純函式、雲端瀏覽驗收與部署後正式站驗證。

## 測試與證據

基準：`node --test tests/*.test.cjs` **73/73 pass**；`node --check assets/*.js`（逐檔）通過；`python3 scripts/preview.py /tmp/ai-recovery-baseline/ai-agent-use-cases` 成功。本專案沒有獨立 lint、TypeScript 或 npm build。預覽模擬 Liquid catalog，不等同正式 Jekyll。

先新增測試在舊版執行，因缺少 `combinedRelaxationOptions` 失敗（[原始輸出](red-baseline.tap)）；workflow 固定用 `0f6153f` 重跑此 red baseline。修改後全套 **78/78 pass**，新增五項測試涵蓋 2／3／5 個衝突、多方案、精確計數、不修改輸入、多工具、保留 query、無匹配、空資料與單項優先。

瀏覽指令（僅 GitHub runner 安裝 Playwright 1.64.1、axe 4.10.2）：

```sh
python3 scripts/preview.py "$RUNNER_TEMP/recovery-preview/ai-agent-use-cases"
python3 -m http.server 8099 --directory "$RUNNER_TEMP/recovery-preview"
NODE_PATH="$RUNNER_TEMP/recovery-tools/node_modules" node tests/combined-recovery-browser.cjs
```

三種模擬情境（不代表真人偏好或轉換率）：

1. 從首頁搜尋旅遊，選生活，鍵盤讀案例，開來源，再返回搜尋。
2. 接到帶 UC001＋開發＋還在查證＋Grok Bot 的連結，透過最少組合調整恢復結果，保留工具及關鍵字，再讀詳情、重新整理及返回。
3. 找不到任務時修改關鍵字；另驗證部分來源失敗／補讀、載入中、全載入錯誤重試、未知長情境排版。

測試修正紀錄：第一次更新版雲端測試誤將 UC001 全文匹配預設為單筆。全文也會命中引用 UC001 的其他條目，實際為七筆；修正為建議 count 與操作後實際結果數相等，另檢查補讀增加一筆，沒有改搜尋產品語義。長情境測試也使用真實 kind=pending，避免把不支援的未知收錄狀態當有效條件。

## 獨立審查

未負責實作的 `review_ultra` 角色獨立閱讀 diff、資料／URL／鍵盤／靜態部署風險，提出並驗證補讀焦點需求，抓到兩個瀏覽測試假設（未知 kind 與多筆 locator）後修正。另以不調用產品 matcher 的 bitmask 窮舉 oracle 比對 500 組 fixture：80 已有結果、183 單項可解、215 組合可解、22 無解，全數一致。[可重現腳本](independent-oracle.cjs)、[本次原始輸出](independent-oracle-output.txt)。

```sh
node docs/qa/2026-10-19-combined-recovery/independent-oracle.cjs "$PWD"
```

原始輸出含本機 Node 純函式 30 次計算時間；這不是瀏覽器端到端速度，不能當網站效能分數。

## 模型與環境界線

可讀的設定檔預設為 `gpt-6.1-sol`、`low`，無法確認／切換主回合 runtime。獨立架構及 review 派工明確指定工具列出的 `gpt-6-astra`、`ultra`；這是請求設定，無法由子代理驗證實際 runtime。沒有聲稱已驗證本帳號最強模型。只使用授權目錄、既有 SSH 與 GitHub Actions，未操作個人桌面，未呼叫另付費模型 API。

## 發布與限制

GitHub CLI 的企業帳號無法在個人 repo 建立 PR（`Enterprise Managed User` 拒絕），SSH 分支 push 成功。使用者已授權直接 merge／push；通過驗收後以正常 Git 合併，不強推。

保留原始案例、354 筆條目與合格案例計數；推薦調整不代表案例可靠度。部分載入的筆數只涵蓋已載入內容。沒有真人測試、實體手機或實體 Safari 驗證；axe 自動檢查不等同完整無障礙認證。

下一輪：量測並降低首次全文載入成本，本輪不處理載入架構。
