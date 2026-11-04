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
- `python3 scripts/preview.py /tmp/ai-agent-use-cases-final-preview/ai-agent-use-cases`：通過；`check_corpus_bundle.py` 回報 445 個來源逐 byte 一致。
- 正式站桌機 1440×1000、手機 390×844 首頁均無水平溢位。新訪客點「收件匣」得 136 筆；旅人以「旅遊＋生活＋Grok Bot」得 16 筆，UC-001 顯示「作者報告／示範」，Escape 返回保留搜尋、篩選、結果與焦點；UC-001 原始文章連結實際開啟並顯示「Grok Bot vs Meta Muse vs ChatGPT Dots, Tested」。分支預覽的不相符查詢顯示痛點捷徑，Tab 可達「查看結果」，選「日報」恢復 62 筆。
- 桌機 1440×1000：[修改前](screenshots/before-desktop.png) · [修改後](screenshots/after-desktop.png)；手機 390×844：[修改前](screenshots/before-mobile.png) · [修改後](screenshots/after-mobile.png)；空結果另存[手機截圖](screenshots/after-mobile-empty.png)。修改前取自正式站 `7737128`，修改後取自更新至 `f46f246` 的分支預覽；本輪只調 CI 時限、未改網站 UI，首頁抽卡每次會變，因此截圖不宣稱逐像素相同。
- `package.json`、lint/type-check 設定與 `actionlint` 均不存在；沒有宣稱執行它們。YAML 以可用 parser 驗證。

## 限制與後續

- 這次修正覆蓋上述六個有明確發布資產失敗證據的 gate；不代表其他本次失敗已修復。Results return 的預覽瀏覽器失敗屬不同步驟，未改其斷言。
- GitHub Pages 發布本身不由 repo workflow 部署；輪詢仍是有上限的防禦。若之後仍超過 15 分鐘，應考慮以成功部署事件集中觸發公開站驗收，而非無限延長所有工作。
- 下一輪優先分類 merge 後仍失敗的非部署型 browser regression，不再盲目放寬斷言。

## 2026-11-04：稽核摘要發布閘門

基準 `45ee335e2c65a69a9c57d657125958e92dcf6073`；正式站 `corpus.json` 的 sourceRevision 相同，[Pages](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41787487641) 與 [Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41787488052) 成功。[舊 Audit summary 執行](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41005292354) 在 25 分鐘後資產與批次不符；[同版部署](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41005292141) 在其後完成。這支持等待窗口不足，但不證明失敗唯一原因；目前同 workflow [最新執行成功](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41787488048)。

採用共用 60 分鐘絕對期限閘門，保留三個資產逐位元組比對與稽核批次比對，摘要請求也受取消訊號約束；job 上限 90 分鐘。替代方案只延長原迴圈，無法限制卡住的網路請求。未變更其他 workflow 或網站內容。

本機基準 `node --test tests/*.test.cjs` 394 通過，`node --check assets/app.js` 通過。修改後以 `TRUST_URL=https://richardhan.github.io/ai-agent-use-cases/ GITHUB_SHA=45ee335e2c65a69a9c57d657125958e92dcf6073 node tests/trust-published.cjs` 實際核對正式資產及批次成功；`node --test tests/published-assets.test.cjs tests/published-check.test.cjs tests/audit.test.cjs` 38 通過。此本機核對未模擬 GitHub runner，也不證明延遲發布路徑已在 Actions 通過。

獨立審查指出既有缺口：閘門判定 commit 已被取代後，同一步仍會呼叫正式站瀏覽器測試；本次未修復該路徑，不能把已取代版本視作完成正式站驗收。審查未發現本次變更新增的可證實缺陷。

下一輪先確認本次 PR 與 main 對應的 Audit summary workflow 實際結果；main-only 發布路徑未執行前不可宣稱修復已發布。另 [#210](https://github.com/RichardHan/ai-agent-use-cases/pull/210) 仍處理 P-002 狀態，與 main 的維護紀錄衝突；保留雙方記錄後才能驗收整合。
