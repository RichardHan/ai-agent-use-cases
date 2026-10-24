# 2026-10-25 GitHub Pages 發布核驗等待窗口

## 改善與證據

目標使用者：檢查 GitHub Actions 狀態的維護者。問題不是產品網站載入失敗，而是主線 Actions 在 Pages 尚未發布本次 commit 時，過早以資產不符判定 QA 失敗。

- `main @ 7737128` 的 Partial Load QA 在發布核驗 8:02 後失敗；對應程式原本只等 8 分鐘。
- 同一批 Search relevance、Corpus loading、Print reading、Missing shared case、Return visibility 的正式站資產比對亦失敗。記錄： [partial load #40137836153](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40137836153)、[relevance #40137836164](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40137836164)、[corpus #40137836144](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40137836144)、[print #40137836085](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40137836085)、[missing case #40137835944](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40137835944)、[return visibility #40137835957](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40137835957)。失敗時間與各自 2.5–8 分鐘輪詢窗口相符。
- 既有正式部署紀錄曾量得 Pages 發布耗時 11 分 38 秒，超過上述輪詢時間。

## 方案與決策

1. **採用：只擴大已確認失敗的發布核驗窗口至 15 分鐘。** 保留目前 commit freshness guard、逐檔內容比對及超時失敗；只增加等待與 Actions job 時限，風險最小，缺點是部署真的停滯時較晚回報。
2. **替代：將公開站驗收統一改由 Pages 部署成功事件觸發。** 時序語意較精確，但會改動多條 workflow 的觸發及驗收責任，需額外驗證事件漏接與 PR／本機預覽覆蓋；本輪不採。

## 本輪變更

- `tests/load-recovery-live.cjs`：部署資產核驗上限 8 → 15 分鐘；失敗訊息同步調整。HTML、JS、CSS 三資產逐 byte 比對不變。
- `tests/corpus-browser.cjs`、`relevance-qa.yml`、`print-reading-qa.yml`、`missing-case-qa.yml`、`return-visibility-browser.cjs`：將已失敗的 5–6 分鐘發布資產輪詢延長至 15 分鐘；逐檔相等條件與 freshness guard 不變。
- `load-recovery-qa.yml`、`relevance-qa.yml`、`corpus-qa.yml`、`print-reading-qa.yml`：工作上限調為 25 分鐘；Missing case 與 Return visibility 原已為 25 分鐘。
- `tests/visitor-experience-and-ci.test.cjs`：新增回歸斷言，確保六條已失敗路徑各自具備至少 15 分鐘輪詢預算與 25 分鐘工作上限。
- 沒有修改網站 UI、案例資料、來源、資格統計或第三方連線；沒有將未知／真實失敗轉為通過。

## 驗收

- 新增回歸測試在設定修改前先失敗：`partial load published check must cover 15 minutes`；設定完成後通過。
- `node --test tests/*.test.cjs`：290 passed、0 failed（基準 289 passed）。
- `node --check assets/*.js scripts/*.cjs tests/*.cjs`：通過。
- `python3 scripts/preview.py /tmp/ai-agent-use-cases-after-preview/ai-agent-use-cases`：通過；`check_corpus_bundle.py` 回報 445 個來源逐 byte 一致。
- 正式站桌機 1440×1000、手機 390×844 首頁均無水平溢位。新訪客點「收件匣」得 136 筆；旅人以「旅遊＋生活＋Grok Bot」得 16 筆，UC-001 顯示「作者報告／示範」，Escape 返回保留搜尋、篩選、結果與焦點；UC-001 原始文章連結實際開啟並顯示「Grok Bot vs Meta Muse vs ChatGPT Dots, Tested」。分支預覽的不相符查詢顯示痛點捷徑，Tab 可達「查看結果」，選「日報」恢復 62 筆。
- 桌機 1440×1000：[修改前](screenshots/before-desktop.png) · [修改後](screenshots/after-desktop.png)；手機 390×844：[修改前](screenshots/before-mobile.png) · [修改後](screenshots/after-mobile.png)；空結果另存[手機截圖](screenshots/after-mobile-empty.png)。這輪只調 CI 時限，未改網站 UI；首頁抽卡每次會變，因此截圖不宣稱逐像素相同。
- `package.json`、lint/type-check 設定與 `actionlint` 均不存在；沒有宣稱執行它們。YAML 以可用 parser 驗證。

## 限制與後續

- 這次修正覆蓋上述六個有明確發布資產失敗證據的 gate；不代表其他本次失敗已修復。Results return 的預覽瀏覽器失敗屬不同步驟，未改其斷言。
- GitHub Pages 發布本身不由 repo workflow 部署；輪詢仍是有上限的防禦。若之後仍超過 15 分鐘，應考慮以成功部署事件集中觸發公開站驗收，而非無限延長所有工作。
- 下一輪優先分類 merge 後仍失敗的非部署型 browser regression，不再盲目放寬斷言。
