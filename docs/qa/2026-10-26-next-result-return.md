# 詳情切換後返回目前案例

目標：從搜尋結果開啟 A、在詳情切到 B 的訪客。實際預覽（390px）從旅遊搜尋的 UC-001 切到 UC-099，關閉後焦點卻回 UC-001；鍵盤焦點與目前讀到的案例不一致。舊版 `recent-review-browser` 的新增斷言先紅：`UC-455 !== UC-456`。

- 方案 A（採用）：只在原入口是搜尋結果、目前案例仍在結果中時，關閉後將焦點與視口帶到目前案例卡；跨出目前結果或由抽卡進入時沿用原入口。變更小、保留現有 Back 與直鏈語意。
- 方案 B：重設整個詳情歷史與返回模型。可統一所有返回狀態，但風險與驗收成本高，本輪不採用。

驗收：Next、延伸閱讀後關閉聚焦目前案例；返回上一則後仍回上一則；搜尋條件與順序不變，批次外結果可補顯，直鏈不虛構結果卡；手機、桌面、空結果、來源與鍵盤回歸。本輪不改搜尋排名、內容或資料憑據。

| 尺寸 | 修改前（UC-001 焦點） | 修改後（UC-099 焦點） |
| --- | --- | --- |
| 手機 390×844 | [截圖](2026-10-26-next-before-mobile.png) | [截圖](2026-10-26-next-after-mobile.png) |
| 桌面 1440×1000 | [截圖](2026-10-26-next-before-desktop.png) | [截圖](2026-10-26-next-after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-round-preview/ai-agent-use-cases && python3 -m http.server 8919 --directory /tmp/visitor-round-preview`，開啟 `http://127.0.0.1:8919/ai-agent-use-cases/`。截圖由同一預覽切換舊版返回函式和修正版取得，並非正式站對照；預覽不是 Jekyll 正式輸出。

基準：362 個單元測試通過、JS 語法通過、452 個來源 bundle byte 一致。修正後 `RECENT_LIVE=1` 的 recent-review Chromium 手機/桌面回歸通過；related-browser Chromium 桌面、手機、小手機流程通過（各頁 axe 零違規，詳見執行輸出）。獨立審查發現舊 related 測試期待原入口 A，已改成 B 並重驗。三種模擬情境：① 旅遊搜尋→UC-001→下一則 UC-099→關閉，焦點落 UC-099；② 最近核對排序→Next→Escape、Previous→Escape，分別返回目前案例；③ 相關案例→Back→再開相關案例→Escape，維持查詢/結果順序並聚焦該案例。這不是使用者喜好或轉換率證據。

PR #140 雲端 Related reading QA 於安裝階段 30 分鐘取消，尚未跑瀏覽器；日誌顯示 Chromium 的 `--with-deps` 已裝入 `fonts-wqy-zenhei`，但額外 `fonts-noto-cjk` 61.2 MB 下載從 07:46:47 到 08:04:43 未成功，重試後到 08:10:12 被取消。本輪移除該 workflow 重複且慢的額外字型安裝，保留 Playwright 所需 CJK 字型與原測試；需以重跑 PR check 證實。Method shortcut QA 的歷史取消則是三引擎 `--with-deps` 的 119 MB apt 依賴下載途中，並非額外字型階段，本輪不盲目縮減其引擎。

未驗證：本輪新 SHA 的正式 Pages 發布、實際長期回訪效能與文字對比定量。Method shortcut QA 三引擎依賴下載於雲端鏡像極慢，下一輪最值得做的是隔離必要系統依賴並保留 Chromium／Firefox／WebKit 覆蓋，再以雲端跑完整閱讀驗收。
