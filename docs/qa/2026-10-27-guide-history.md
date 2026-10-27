# 首頁情境可用瀏覽器返回（2026-10-27）

對象：初訪者從首頁選「工作省點力」，讀卡後希望退回初始探索。基準預覽中按選項只 `replaceState`；Back 離開網站而不是回到「隨便逛逛」。這是瀏覽歷史行為，不代表使用者偏好或轉換率。

- 方案 A（採用）：首頁明確選情境建立一次歷史節點；Back／Forward 還原條件與抽卡焦點。沿用 URL 與既有 `popstate`；成本是區分詳情內的情境跳轉，避免重複歷史節點。
- 方案 B：維持原歷史，新增重設入口。較少路由變更，但 Back 仍離站。
驗收：390／1440px 選「工作」後 Back 回初始卡、Forward 回工作卡，重選同情境不累積節點；詳情情境跳轉不新增節點。維持搜尋、組合篩選、空結果、直鏈、來源連結與 Pages base path；不更改來源、證據、計數、匹配與視覺設計。獨立 reviewer 找出重選後焦點與詳情跳轉額外節點兩項，均已修正並納入回歸。既有詳情打開後關閉會留下與上一筆相同 URL 的紀錄，本輪未改寫其歷史模型。

本地預覽：`python3 scripts/preview.py /tmp/visitor-discovery-preview/ai-agent-use-cases && python3 -m http.server 8147 --directory /tmp/visitor-discovery-preview`，開啟 `http://127.0.0.1:8147/ai-agent-use-cases/`。這是 Liquid 模擬預覽，非正式 Jekyll build。

前後選取相同「工作」情境的畫面：[手機前](2026-10-27-guide-before-mobile.webp)／[手機後](2026-10-27-guide-after-mobile.webp)；[桌面前](2026-10-27-guide-before-desktop.webp)／[桌面後](2026-10-27-guide-after-desktop.webp)。卡片是隨機抽取，不能以不同卡片內容視為視覺改動。

驗收：`NODE_PATH=/tmp/visitor-round-deps/node_modules node tests/guide-history-browser.cjs` 390／1440px 通過；`node --test tests/*.test.cjs` 361/361 通過；`node --check assets/app.js`、`node --check tests/guide-history-browser.cjs` 通過；`python3 scripts/check_corpus_bundle.py /tmp/visitor-discovery-preview/ai-agent-use-cases` 457 份來源逐 byte 一致。兩尺寸 axe WCAG 2/2.1 AA 在 reduced-motion 穩定狀態零違規、水平溢出 0px。情境 Back／Forward、重選、難度後返回、詳情情境跳轉已走查；手機直鏈 UC-001 重載與關閉保留「旅遊＋生活」，顯示固定 SHA GitHub Markdown 連結及 12 個 HTTPS 來源連結。空查詢顯示空結果，恢復「旅遊＋生活」有 20/459 筆。三情境是模擬走查，不是受訪者回饋。

限制：既有 `tests/inspiration-handoff-browser.cjs` 在桌面外部來源 popup 等待 30 秒逾時，未完成其全引擎流程；本輪已以直接連結及來源 href 路徑檢查替代，但未證實外部站實際開啟。正式 Jekyll build、公開 Pages 同 SHA、整批 Actions 未在本機驗證。下一輪優先改善 Actions 的 Pages 發布競速驗收；不能把舊 SHA 資產輪詢失敗判成網站回歸。
