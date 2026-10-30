# Pages 公開站驗收：先核對版本，再走訪（2026-10-27）

目標是維護者與首次訪客：公開站驗收若在 Pages 更新前跑到舊版，原本仍可通過首頁與詳情操作，無法證明這次改動已上線。`tests/deployed-browser.cjs` 之前直接執行功能流程、最多輪詢 181 次，沒有核對 checkout 資產；Pages 曾花 22 分 29 秒，15 分鐘輪詢也不足。這會讓錯誤綠燈或假性逾時掩蓋訪客真正取得的版本。

方案 A：查詢同 SHA 的 GitHub Pages 部署狀態再驗資產，訊號較明確，但部署 API 在本環境查詢逾時，且需額外權限與失敗狀態設計。方案 B（採用）：以五個正式站資產逐 byte 比對 checkout，最多 25 分鐘，保留被新 main 取代時的跳過；版本確定後才跑原有桌面／手機使用流程。較晚才發現部署失敗，但不依賴額外 API 或權限。整個 job 上限調至 45 分鐘。只改 Website QA 發布驗收，不宣稱修好其他工作流程的發布競速；網站 UI、案例、來源和資料不變。

驗收：舊版可用資產不能過關，所有資產更新後才通過；未更新到時明確失敗，主分支 superseded 時明確跳過；真 HTTP 預覽逐檔匹配後回傳 matched。原有桌面首頁、情境、詳情和手機直鏈、重整、返回、搜尋／空結果流程繼續執行。拒絕新增追蹤或第三方資料傳輸。

截圖對照：介面未改，沿用同一組[桌面修改前／後](../2026-10-27-current-round-baseline/01-desktop-home.png)與[手機修改前／後](../2026-10-27-current-round-baseline/05-mobile-home.png)作視覺基準，**不宣稱視覺提升**。本機預覽：`python3 scripts/preview.py /tmp/visitor-round-preview/ai-agent-use-cases && python3 -m http.server 18997 --directory /tmp/visitor-round-preview`，開啟 `http://127.0.0.1:18997/ai-agent-use-cases/`。此預覽不是正式 Jekyll 發布。

驗證：`node --test tests/*.test.cjs` 363 通過；`for file in assets/*.js tests/*.cjs scripts/*.cjs; do node --check "$file" || exit; done` 通過；`python3 scripts/check_corpus_bundle.py /tmp/visitor-round-preview/ai-agent-use-cases` 核對 457 來源逐 byte 一致。真 HTTP 資產 gate 首次在切回 main、預覽尚未更新時拒絕舊版；重建預覽後五檔回傳 `matched`。本機 390px 預覽搜尋「旅遊」＋生活顯示 20／459，無結果字串顯示 0／459；進 UC-001 再關閉回到 20／459。獨立唯讀審查未發現 blocker；之後又加上 25 分鐘絕對截止，單元與 HTTP smoke 已重驗。

限制：無法在合併前驗證新 SHA 的正式 Pages；此機沒有本專案獨立 lint/typecheck/npm build，Jekyll 建置在 GitHub Pages。GitHub API 查詢逾時，尚未取得這次 Actions 結果。下一輪優先把其他仍使用 15 分鐘或未校驗資產的公開站 QA 收斂到同一發布門檻，先確認 Pages 同 SHA 與既有 workflow 失敗成因。

## 2026-10-29：修正 main 公開站驗收早於 Pages 完成的失敗

`51d8ff2` 的 [Pages 部署](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40831458901)成功但花了 **27 分 38 秒**；[Improvement round QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40831459162)仍只等 300 次、每次三秒（約 15 分鐘）。本輪觀察到的九個失敗都在公開版本核對，不以忽略錯誤或修改產品斷言處理。

九個 gate（round、case-share、relevance、reading-anchor、combined-recovery、recency、available-facets、related、search-context）改用 `scripts/published-assets.cjs`：預設 **35 分鐘單一絕對截止**，五秒輪詢，涵蓋已觀察到的部署加上餘裕；不再被舊有 301 次上限提前截斷。每輪並行核對原有完整檔案清單，HTTP 錯誤、網路中斷及舊位元組會繼續等候；單輪請求與 response body 共用至多 15 秒、且不超過剩餘總時間的取消訊號，等待該輪所有請求結束後才重試。睡眠也裁切至剩餘時間。保留進入、輪詢中、成功前與失敗前的 main supersession 核對；無法確認 main tip 仍明確失敗，不冒充 superseded。既有 main tip 查詢本身仍有獨立有界 timeout，可能使整體 gate 比資產截止略長。

九個 job 上限均調為 **55 分鐘**，在資產等待之外保留 20 分鐘給安裝、預覽與原有桌面／手機流程。round／case-share 的 matched JSON 記錄保留；recency 的 `catalog.files` 必須仍與 checkout 來源清單一致，並與資產共用同一截止，不能另起第二個等待視窗。related／search-context 不再逐檔各等一個完整視窗。

回歸案例新增：模擬 27 分 38 秒後才發布、超過 301 次仍可成功；網路耗時納入截止、最後睡眠裁切；HTTP／網路暫錯、response body 卡住取消、其他請求未結束不得開始下一輪；等待中／資產剛匹配／截止時被取代都跳過；main tip 無法核實仍失敗；catalog 未匹配不可通過；九個 caller 的資產清單與 job 餘裕不縮水。本節僅記錄實作與待執行的驗證項目，不把上方歷史驗證數字當作本輪結果。

範圍與風險：不修改 PR #168 的 `.github/workflows/website-qa.yml` 或 PR #162 的 `tests/deployed-browser.cjs`，不改 UI、案例與瀏覽器功能斷言。共享 helper 的既有 caller 也會取得 35 分鐘預設；Website QA 原有 45 分鐘上限仍須與 PR #168 的最終設計一起評估。35 分鐘不是部署 SLA，Pages 若持續超過此值仍會明確失敗；延長 job 上限增加失敗情況下的 runner 使用時間，其他尚未收斂的公開站 gate 不宣稱已修復。合併前應執行 `node --test tests/*.test.cjs`、JS 語法檢查及 workflow YAML／shell 驗證；新 SHA 的正式 Pages 與公開 browser journeys 仍需合併後 Actions 才能證明。

## 2026-10-30：Audit summary 發布競速

[Audit summary QA 的失敗](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40934556034)發生在公開站核對逾時；本機建置與跨瀏覽器檢查已通過。改用既有 35 分鐘絕對截止與逐檔比對，並在同一輪核對 audit summary 的最新批次；main 已被取代時不執行公開站瀏覽器驗收。工作上限調為 55 分鐘。頁面與案例不變，無法保證 Pages 在期限內部署；其他 workflow 的獨立等待機制不在本次範圍。

驗證：`node --test tests/trust-publication.test.cjs tests/published-assets.test.cjs` 16 通過；本機 HTTP 預覽執行 `TRUST_URL=http://127.0.0.1:18997/ai-agent-use-cases/ GITHUB_SHA=local node tests/trust-published.cjs` 輸出 `PUBLISHED_AUDIT_MATCH local`。正式 Pages 的新提交仍須合併後驗證。
