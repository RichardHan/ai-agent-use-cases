# Pages 發布等待窗口與網站驗收

目標讀者：依搜尋、篩選及來源閱讀案例的首次訪客；本輪修的是公開站驗收訊號，不改畫面或資料。主分支 `b28d661` 的 Pages 部署從 05:44:39 UTC 到 06:07:08 UTC 才成功，Home search entry、Method shortcut、Evidence round、Card refinement、Filter entry 卻在 06:02–06:05 的約 15 分鐘資產等待後失敗。這些失敗發生在公開資產逐檔比對階段，不能推斷訪客流程本身壞掉。

- 方案 A（採用）：五個已觀察失敗的 workflow 保留逐檔 byte 比對、定期與末次主分支 SHA 核對，將發布輪詢擴到約 25 分鐘，job 上限調到 35／40 分鐘。範圍小；慢部署會延後驗收結果。
- 方案 B：改由 Pages 部署成功事件觸發公開站走查。可減少等待，但跨 workflow SHA 對應、觸發權限與重跑語意需重新設計；本輪不採用。

驗收標準：同一 commit 的資產在第 15–25 分鐘出現時不會先超時；超過窗口仍失敗，較新 main 仍跳過舊版本檢查；本地預覽搜尋＋情境、空結果、詳情直鏈重載、返回及來源版本不退化。不改 UI、收錄數、案例原文與憑據。

| 視口 | 正式站修改前 | 本地預覽修改後 |
| --- | --- | --- |
| 390×844 | [前](2026-10-26-publication-window-before-mobile.png) | [後](2026-10-26-publication-window-after-mobile.png) |
| 1440×1000 | [前](2026-10-26-publication-window-before-desktop.png) | [後](2026-10-26-publication-window-after-desktop.png) |

前後預期相同：這是 CI 驗收修復，不能聲稱轉換率或視覺改善。預覽：`python3 scripts/preview.py /tmp/visitor-release-preview/ai-agent-use-cases && python3 -m http.server 8897 --directory /tmp/visitor-release-preview`，開啟 `http://127.0.0.1:8897/ai-agent-use-cases/`。預覽非 Jekyll 正式建置。

基準：`node --test tests/*.test.cjs` 362 pass、0 fail；`for file in assets/*.js tests/*.cjs; do node --check "$file"; done` 成功；`python3 scripts/check_corpus_bundle.py /tmp/visitor-release-preview/ai-agent-use-cases` 452 個來源逐 byte 一致。沒有獨立 lint/typecheck 或本機 Jekyll 命令。本輪由主分支 Actions 的失敗先重現時間窗，不等待 15 分鐘重播；獨立 reviewer 核對五個輪詢算術、timeout 餘裕和過期檢查，未發現變更引入的問題。

三種模擬走查（非真人偏好）：① 手機選生活後搜旅遊，UC-001 可開啟；詳情直鏈重載仍保留 `case=UC-001`，原始 Markdown 指向 `b28d661` 的 GitHub commit；關閉返回保留生活與旅遊。② 生活篩選下輸入 `zzzx-no-match-987`，顯示無結果。③ 桌面 1440px 首頁載入 24 筆分批結果；手機亦為 24 筆。這些是未改 UI 的回歸煙測，組合門檻、WebKit/Firefox、焦點、對比、長篇內文及正式發布新 SHA 尚未完整覆蓋，不宣稱已通過。

下一輪：先查 `Method shortcut QA` 雲端安裝停滯，再考慮將各 workflow 的發布等待改成可觀測且共用的 Pages SHA gate。

## 合併後發布核對

PR #138 已合併為 `3b72f86`。該 SHA 的 Pages build/deployment、Home search entry QA、Evidence round QA、Card refinement QA、Filter entry QA 均成功，公開站資產與流程由這四項 QA 核對。Method shortcut QA 在 35 分鐘 job 上限時取消，停在 `Cloud browser tools` 安裝步驟，尚未進入本輪延長的發布 gate；這不是來源或閱讀流程驗收通過的證據，也不能歸因於本輪輪詢修改。下一輪先查 cloud runner 的 npm／Playwright 安裝停滯，再決定是否共用安裝或縮限所需引擎。獨立 reviewer 已審查本輪五個 gate 的輪詢算術、timeout 餘裕與過期 SHA 條件。
