# Pages 公開站驗收：先核對版本，再走訪（2026-10-27）

目標是維護者與首次訪客：公開站驗收若在 Pages 更新前跑到舊版，原本仍可通過首頁與詳情操作，無法證明這次改動已上線。`tests/deployed-browser.cjs` 之前直接執行功能流程、最多輪詢 181 次，沒有核對 checkout 資產；Pages 曾花 22 分 29 秒，15 分鐘輪詢也不足。這會讓錯誤綠燈或假性逾時掩蓋訪客真正取得的版本。

方案 A：查詢同 SHA 的 GitHub Pages 部署狀態再驗資產，訊號較明確，但部署 API 在本環境查詢逾時，且需額外權限與失敗狀態設計。方案 B（採用）：以五個正式站資產逐 byte 比對 checkout，最多 25 分鐘，保留被新 main 取代時的跳過；版本確定後才跑原有桌面／手機使用流程。較晚才發現部署失敗，但不依賴額外 API 或權限。整個 job 上限調至 45 分鐘。只改 Website QA 發布驗收，不宣稱修好其他工作流程的發布競速；網站 UI、案例、來源和資料不變。

驗收：舊版可用資產不能過關，所有資產更新後才通過；未更新到時明確失敗，主分支 superseded 時明確跳過；真 HTTP 預覽逐檔匹配後回傳 matched。原有桌面首頁、情境、詳情和手機直鏈、重整、返回、搜尋／空結果流程繼續執行。拒絕新增追蹤或第三方資料傳輸。

截圖對照：介面未改，沿用同一組[桌面修改前／後](../2026-10-27-current-round-baseline/01-desktop-home.png)與[手機修改前／後](../2026-10-27-current-round-baseline/05-mobile-home.png)作視覺基準，**不宣稱視覺提升**。本機預覽：`python3 scripts/preview.py /tmp/visitor-round-preview/ai-agent-use-cases && python3 -m http.server 18997 --directory /tmp/visitor-round-preview`，開啟 `http://127.0.0.1:18997/ai-agent-use-cases/`。此預覽不是正式 Jekyll 發布。

驗證：`node --test tests/*.test.cjs` 363 通過；`for file in assets/*.js tests/*.cjs scripts/*.cjs; do node --check "$file" || exit; done` 通過；`python3 scripts/check_corpus_bundle.py /tmp/visitor-round-preview/ai-agent-use-cases` 核對 457 來源逐 byte 一致。真 HTTP 資產 gate 首次在切回 main、預覽尚未更新時拒絕舊版；重建預覽後五檔回傳 `matched`。本機 390px 預覽搜尋「旅遊」＋生活顯示 20／459，無結果字串顯示 0／459；進 UC-001 再關閉回到 20／459。獨立唯讀審查未發現 blocker；之後又加上 25 分鐘絕對截止，單元與 HTTP smoke 已重驗。

限制：無法在合併前驗證新 SHA 的正式 Pages；此機沒有本專案獨立 lint/typecheck/npm build，Jekyll 建置在 GitHub Pages。GitHub API 查詢逾時，尚未取得這次 Actions 結果。下一輪優先把其他仍使用 15 分鐘或未校驗資產的公開站 QA 收斂到同一發布門檻，先確認 Pages 同 SHA 與既有 workflow 失敗成因。
