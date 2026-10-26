# Method shortcut 三引擎閱讀驗收恢復

目標：確保首次訪客從問題搜尋到案例方法、限制與來源的閱讀流程受到 Chromium、Firefox、WebKit 的雲端驗收，而不是在安裝階段結束。`main@3b72f86` 的 [Method shortcut QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40280953706) 在 2026-10-26 06:38–07:13 UTC 的 `Cloud browser tools` 步驟取消：`playwright install --with-deps chromium firefox webkit` 需要 119 MB、181 個新 apt 套件；下載到第 130 個套件時達到 35 分鐘限制，三項瀏覽器走查均未執行。這是驗收缺口，不是已證實的網站故障。

- 方案 A（採用）：工作使用與 npm 版本一致的 `mcr.microsoft.com/playwright:v1.64.1-noble`，保留三引擎瀏覽器流程，免跑 apt 與重複下載瀏覽器。Firefox 在 GitHub Actions 容器中要求 `$HOME` 由執行使用者持有，因此設為 `/root`。代價是依賴官方映像的拉取與版本維護。
- 方案 B：改為只安裝 Chromium。更小，但丟失 Firefox／WebKit 手機閱讀回歸；不採用。

驗收：雲端 preview 的 Method shortcut、Reading flow、Reader browser 三項依序執行，含 Firefox／WebKit，不在 apt 安裝時超時；既有單元、語法、靜態預覽與正式站流程保持。範圍不含站內內容、搜尋排名、PR #140 的返回焦點或重新設計其他 workflow。雲端 Linux WebKit 並不等於實機 Safari；不宣稱使用者偏好或轉換率提升。

| 視口 | 公開站修改前 | 本地預覽修改後 |
| --- | --- | --- |
| 手機 390×844 | [前](2026-10-26-method-before-mobile.png) | [後](2026-10-26-method-after-mobile.png) |
| 桌面 1440×1000 | [前](2026-10-26-method-before-desktop.png) | [後](2026-10-26-method-after-desktop.png) |

這是 CI-only 改動，畫面預期不變。預覽：`python3 scripts/preview.py /tmp/visitor-method-preview/ai-agent-use-cases && python3 -m http.server 8926 --directory /tmp/visitor-method-preview`，開啟 `http://127.0.0.1:8926/ai-agent-use-cases/`；非正式 Jekyll 輸出。基準 `node --test tests/*.test.cjs` 362 pass、0 fail；`node --check` 全部 assets/tests JS 通過；預覽 bundle 452 個來源逐 byte 一致。repo 沒有獨立 lint/typecheck 配置。本地 Chromium 模擬：① 手機旅遊＋生活，20 結果，UC-001 詳情直鏈重載與 Escape 返回，原始 Markdown 指向發布 SHA；② 生活＋入門對話＋旅遊，18 結果，無匹配詞與雙篩選為 0，保留條件與清除控制；③ 桌面 UC-313 長內容直鏈，1440px 頁面及 848px 詳情無水平溢出，無 pageerror。模擬檢查不是使用者研究。

初次容器 [dispatch](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40293587292) 在 85 秒內完成安裝與基準，但 Firefox 因 `/github/home` 屬於 `pwuser`、容器以 root 執行而拒絕啟動。設 `HOME=/root` 後，[第二次](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40294442678) 已走完 Method shortcut 和 Reading flow 三引擎；Reader browser 暴露預覽原始 Markdown 沒有固定版本。根因是 Actions 容器的 Git 安全目錄與 checkout 暫存 HOME 不一致，`preview.py` 的 `git ls-files` 失敗而不發布 `sourceRevision`；[第三次](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40295018511) 等待來源連結 30 秒仍失敗，證實不是載入速度。現在將工作目錄加入 Git safe.directory，並在預覽建置後驗證來源版本等於 checkout SHA；瀏覽器驗收等待真實的版本連結，不將缺失視為通過。

[第四次 workflow_dispatch](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40297981710) 成功：容器、362 項單元、語法、預覽、公開站基準、Method shortcut／Reading flow／Reader browser 三引擎 preview 及 artifact 上傳均通過；job 4 分 52 秒，沒有縮減 Firefox／WebKit。公開站驗收步驟在非 main dispatch 正常跳過，合併後的新 SHA 正式站仍需重新發布與驗證。獨立 reviewer 審核容器版本、Node 22、Python、Git、三引擎涵蓋與權限，未指出原方案的其他可證實 blocker；後續 Git 安全目錄與來源斷言由本次紅綠雲端執行驗證。root/no-sandbox、映像拉取和 CJK 字型差異仍是風險。

下一輪優先：檢查其他仍以三引擎 `--with-deps` 安裝的 Actions，依實際超時證據逐一遷移，而非盲目改寫所有 workflow。
