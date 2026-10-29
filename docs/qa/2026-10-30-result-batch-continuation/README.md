# 2026-10-30 分批結果接續閱讀

## 問題與選題

基準 main `23949ae1d458924d743889ba9360ef682ff62668`。已檢查 README、SITE、靜態 Jekyll／Pages 架構及既有 QA；repo 與上層無 AGENTS.md。原工作樹含 README、SITE、index 修改與未追蹤 QA／測試，完整保留於原分支。本輪使用獨立 `improve/visitor-flow-20261030` worktree；未修改既有 PR #151、#162、#167、#168、#171。

目標讀者是瀏覽超過首批 24 筆的鍵盤與輔助輸入使用者。正式站 1440×900／390×900 實走後確認：按「再看 24 筆」已渲染 48 筆，但焦點仍在舊按鈕，位置為桌面 y=4924／手機 y=13134；下一個 Tab 直接跳至頁尾核對標準，略過新案例。這是中間批次問題；前輪僅處理最後批次按鈕隱藏後的焦點。原始量測見 [live-before-batching.json](live-before-batching.json)。

- 方案 A（採用）：每次明確啟用「再看」，聚焦第一張新卡的標題並把卡片起點捲入視窗，延續既有視覺與 DOM 順序，成本低。
- 方案 B：新增可聚焦批次標題／狀態與開始閱讀控制，能更明示分界，但增加介面與返回狀態設計成本。

第一版採標題 nearest 捲動，目視發現摘要仍在視窗外，且 WebKit 邊界有小數像素落出；最終改為卡片起點。對每次明確啟用一視同仁，避免依 Safari 是否先聚焦按鈕來猜測輸入方式。不改程式化歷史還原的 ensureVisibleResult。

範圍：分批接續、可見焦點、詳情返回與 QA 診斷。不改搜尋相關性、資料、來源分類、合格計數、索引或其他 PR 的搜尋歷史。未新增追蹤、帳號、Cookie 或第三方服務。

## 前後比較與預覽

同一資料、同一操作「聚焦再看 → Enter → Tab」。圖為本機 Pages base path 相容預覽；正式站問題另有前述量測。主整合者已目視桌面與手機截圖。

| 視口 | 修改前：Tab 跳到頁尾 | 修改後：接續第一張新卡 |
| --- | --- | --- |
| 1440×900 | [修改前](before-1440-tab.png) | [修改後](after-1440-tab.png) |
| 390×900 | [修改前](before-390-tab.png) | [修改後](after-390-tab.png) |

Enter 後焦點與位置：[桌面前](before-1440-enter.png)／[桌面後](after-1440-enter.png)、[手機前](before-390-enter.png)／[手機後](after-390-enter.png)。[比較數據](comparison.json)。

```sh
python3 scripts/preview.py /tmp/visitor-preview/ai-agent-use-cases
python3 -m http.server 8131 --directory /tmp/visitor-preview
# http://127.0.0.1:8131/ai-agent-use-cases/
```

preview.py 模擬資料產出，並非真正 Jekyll build；真正 Pages build 由合併後 Actions 證明。

## 驗收與實際輸出

- `node --test tests/*.test.cjs`：基準 380／380；最終 381／381，0 fail。[摘要](unit-summary.txt)。無獨立 lint 或 TypeScript 工具；基準 `node --check` 185 個 JS 檔全部通過，新增／改動檔另核對語法。
- `python3 scripts/check_corpus_bundle.py /tmp/visitor-preview-after/ai-agent-use-cases`：`PASS: 465 sources byte-for-byte identical`。網站總條目 467，與合格案例數分開；未更動任一來源。
- `BATCH_ALL_BROWSERS=1 ROUND_URL=http://127.0.0.1:8131/ai-agent-use-cases/ node tests/results-batching-browser.cjs`：Chromium 1440／390／320、Firefox 390、WebKit 390 全通過。涵蓋 Enter、Space、pointer、下一個 Tab、新卡詳情、Back／Forward、搜尋＋情境、空結果、直鏈 reload、每批順序與最終 467 筆無重複。[先紅](regression-before.txt)／[後綠](regression-after.txt)／[量測](batching.json)。以既有 NODE_PATH 提供 Playwright／axe，沒有安裝付費服務。
- 首輪擴充 WebKit 檢查時，原腳本在詳情早讀完成而全文未完成就 reload，記錄請求取消錯誤。一般直鏈重整現在等待 discoveryReady；早讀中斷另由既有生命周期測試驗收。未忽略 pageerror。
- 共享 page-context 完整五組瀏覽器＋loading／error／partial 回復皆通過，[正常結果](page-context.json)／[生命周期](page-context-lifecycle.json)。合成 pageerror 仍使程序失敗，並保留 stack／URL／phase：[注入失敗報告](page-context-injected-error.json)。不宣稱已找出或修復間歇性 WebKit `Context is stopped` 根因。

獨立 QA 結果與發布驗收在下方補記。

## Actions 基準與風險

最近主線 [Facet counts QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40867988693) 是 WebKit `Context is stopped`；舊版只保存訊息，無法定位，前八次曾通過。本輪增加完整診斷且保留嚴格斷言，facet workflow 路徑一併涵蓋 helper。

[Combined recovery QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40867988381) 在公開站驗收失敗但 GitHub 未提供 log／artifact；不能把前一版 publication mismatch 當成這次根因。下一輪以有完整 log 的 run 判定，不增加無證據的重試或等待上限。

獨立基準 Reading flow 在本機 macOS WebKit 的普通 Tab 假設失敗（tests/reading-flow-browser.cjs:104）；同庫其他跨引擎測試使用 Option+Tab。這是未修改的既有測試，不能宣稱全庫瀏覽器腳本全綠。

測試為模擬走查，非真人轉換／偏好驗證；未做實機／螢幕閱讀器／Lighthouse 分數。沒有基於小樣本宣稱效能提升。

## 模型與協作

本機設定 `gpt-6-astra / ultra`，不代表已證實主對話 runtime，無可用介面讀取／切換主回合。明確啟動三個 subagents：設計稽核與獨立 QA 為 gpt-6-astra／ultra，CI 程式診斷為 gpt-6.1-terra／ultra；主 agent 單一整合。沿用既有工具及訂閱，未使用額外付費 API。設計稽核與獨立 QA 不修改產品檔案，CI agent 僅處理三個診斷測試檔。

## 獨立審查與三情境

未實作產品的獨立 QA 審查最終 diff，結論無阻擋問題。每個瀏覽器配置均走完：

1. 由 24 筆載入下一批，以 Enter／Space、Tab 接續新卡，開啟詳情再 Back／Escape 返回。
2. 工作＋日報組合篩選，指標或觸控載入最後不足 24 筆的一批；進入空結果後復原並保留工作條件。
3. 旅遊 UC-001 分享直鏈、重新整理、固定 SHA 來源與返回，逐批走完 467 筆並核對無重複。

五配置各三情境，15 次 axe 零違規；另 1440／390／320 的延遲 catalog 不搶焦點、503→重試、UC-359 長篇來源共 3 次 axe 零違規，合計 18。pageerror 0、無水平溢出、不安全來源 scheme 0；標題／摘要對比 14.88:1／11.98:1，焦點框與白色卡片 3.09:1。新批次標題約 y=118px。主整合者與獨立 QA 均目視前後手機／桌面；獨立 QA 另目視 320px 長文。報告：[三情境](independent-report.json)、[慢載入與長文](independent-supplementary.json)。
