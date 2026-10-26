# 詳情原始 Markdown 入口接在用途後

目標讀者：從問題搜尋進入詳情、先判斷用途再想核對本站收錄原文的新訪客。正式站 UC-001 390×844 的 GitHub 原始 Markdown 連結頂端 y=1141.5，低於詳情視口底部 y=801.8；用途之後的適用對象、核心目標與門檻把原文入口推遠。它是本庫 Markdown，不是外部作者來源；兩者仍分別標示。

- A（採用）：把既有 GitHub 原始 Markdown 連結接在「可以幫你做什麼」後，保留版本提示、原文方法捷徑、分享／列印及完整資料。成本為局部 DOM 順序、手機標籤與反向鍵盤焦點修正；不新增來源或第三方服務。
- B：把其餘概覽摺疊成一個「更多適用資訊」區；可讓所有動作更早出現，但會隱藏受眾、限制及門檻，也牽涉 reader 插入點和多個狀態。本輪不採用。

驗收：原始 Markdown 連結在用途之後、分享／列印之前；手機／桌面可在初始詳情視口看到並以鍵盤到達；連結仍指向已核實發布 SHA，預覽缺版本時明示 main 漂移。原文方法與來源核對捷徑保留順序，反向 Tab 的前一個控制可見且有外框。搜尋、組合篩選、空結果、直鏈重載、返回、長內容、來源新分頁及列印不退化；不變更案例或證據計數。

| 視口 | 修改前正式站 | 修改後本地預覽 | UC-001 原始 Markdown 頂端 |
|---|---|---|---|
| 390×844 | [前](2026-10-26-source-entry-before-mobile.png) | [後](2026-10-26-source-entry-after-mobile.png) | 1141.5 → 520.4px |
| 1440×1000 | [前](2026-10-26-source-entry-before-desktop.png) | [後](2026-10-26-source-entry-after-desktop.png) | 863.5 → 417px |

預覽：`python3 scripts/preview.py /tmp/visitor-isolated-preview/ai-agent-use-cases && python3 -m http.server 8768 --directory /tmp/visitor-isolated-preview`，開啟 `http://127.0.0.1:8768/ai-agent-use-cases/?case=UC-001`。截圖使用相同 Chromium 視口；正式站與本地預覽版本不同，不把預覽當成發布核驗。

先紅後綠：`tests/reader-controls-browser.cjs` 新增原文入口順序斷言，原基準 `the original Markdown route follows the purpose before sharing and print actions` 失敗。獨立審查指出歷史 OBSERVE 基準必須豁免新斷言，以及 reader 插入的「核對來源與版本」會隔開用途和連結；兩者已修正。反向 Tab 實測發現前一個建議控制被固定工具列遮住、WebKit 沒有焦點輪廓；加上精確捲動和 `:focus` 外框，未放寬可見性要求。

驗證：`node --test tests/*.test.cjs` 362 pass／0 fail；`NODE_PATH=/tmp/visitor-method-deps/node_modules CONTROLS_URL=http://127.0.0.1:8768/ai-agent-use-cases/ LABEL=purpose-final node tests/reader-controls-browser.cjs` 六組 Chromium／Firefox／WebKit（1440、390、320、360px）通過，axe 各組零違規，桌面 GitHub 原文 HTTP 200；`ROUND_URL=http://127.0.0.1:8768/ai-agent-use-cases/ ROUND_OUTPUT=/tmp/visitor-source-round node tests/round-browser.cjs` 四視口通過，閱讀位置差 0.19–0.44px；`python3 scripts/check_corpus_bundle.py /tmp/visitor-isolated-preview/ai-agent-use-cases` 452 個來源逐 byte 一致（454 條目）。`node --check` 用於改動的 JS。此專案沒有獨立 lint/typecheck 指令，Jekyll 未在本機執行。
三種模擬走查（非真人偏好）：① 旅遊＋生活＋入門對話顯示 18／454，詳情來源新分頁開啟同 URL，Escape 返回保留搜尋；② 無效查詢＋生活顯示空結果與目前篩選下有結果的捷徑；③ UC-359 長標題直鏈沒有水平溢出，原文入口在手機 y=623。正式 Pages 新 commit 的發布連結及 Actions 狀態仍須合併後核對。

範圍外：沒有合併 GitHub 本庫 Markdown 與外部作者來源，沒有改寫原始證據；整個首頁與大量結果的資訊架構留待後續。下一輪優先處理 Actions 本地預覽的 reader anchor／其他失敗，先取得確切引擎與落差，不混同 Pages 發布時差。
