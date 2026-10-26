# 旅遊任務入口的搜尋召回

## 問題與取捨

目標：第一次造訪、想找旅行規劃案例的人。原首頁「旅遊規劃」連到 `?q=規劃旅行#explore`；本機 Pages 相容預覽只有 1 / 452 筆，而同頁搜尋面板的「旅遊規劃 · 搜尋『旅遊』」有 33 / 452 筆。首頁入口讓訪客誤以為案例庫只有一篇相關內容。正式站同一舊查詢也觀察到 1 / 452 筆。

- 方案 A（採用）：首頁入口與既有搜尋面板共用 `旅遊` 查詢；改動小、不更動資料或搜尋演算法。
- 方案 B（未採用）：建立全站任務字典，統一全部入口；適合多個語彙再度漂移時，但本輪沒有足夠失配證據支撐額外抽象。

驗收：入口返回多篇旅行相關案例，與搜尋面板一致；URL 可在 GitHub Pages base path 使用；組合篩選、空結果、詳情直鏈／重新整理／返回和來源閱讀不退化。不處理案例內容、排序、同義詞或 CI 部署策略。

## 比較與預覽

| 尺寸 | 原入口 `規劃旅行` | 新入口 `旅遊` |
|---|---|---|
| 手機 390px | [修改前](before-mobile.png) | [修改後](after-mobile.png) |
| 桌面 1440px | [修改前](before-desktop.png) | [修改後](after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/ai-usecase-round-preview && python3 -m http.server 8765 --directory /tmp/ai-usecase-round-preview`，打開 `http://127.0.0.1:8765/` 點首頁「旅遊規劃」。正式站舊查詢截圖與本機新查詢截圖相較；正式站部署版本可能落後本分支。

## 驗收證據

- 先修改 `tests/home-task-entry.test.cjs` 加入口與面板查詢一致性斷言；修正前測試失敗：`'規劃旅行' !== '旅遊'`。修正後 1 passed。
- 本機瀏覽器：首頁入口新查詢 33 / 452，第一筆 UC-001；開詳情可讀 GitHub 來源，Escape 返回保留 `旅遊`；搭配「生活」與「入門對話」顯示 18 / 452；輸入無匹配詞顯示 0 / 452 與可用的其他搜尋建議；`?q=旅遊&scenario=生活&case=UC-001` 直接進入詳情，重新整理後仍顯示 UC-001 與條件；首頁連結鍵盤焦點外框 3px。這三條分別模擬旅行探索、門檻篩選、分享直鏈，不是實際使用者回饋。
- 手機 390px 與桌面 1440px 截圖已保存；未在實體手機或 VoiceOver 檢查。來源外部 URL 只檢查頁面連結存在，未驗證外站內容或可用性。
- `node --test tests/*.test.cjs`：354 passed，0 failed，5.07s；`node --check assets/app.js && node --check tests/home-search-entry-browser.cjs`：通過；`python3 scripts/check_corpus_bundle.py /tmp/ai-usecase-round-preview`：450 份來源逐位元一致。沒有 package.json 定義的 lint/typecheck/build；預覽非 Jekyll 正式建置。
- 獨立 reviewer 靜態審查：無發現；確認相對 URL 保留 Pages base path，資料與隱私無新增風險。瀏覽器回歸腳本本機未執行，因 Playwright 套件未安裝；使用受控 Chromium 手動走查，不宣稱 CI 已通過。

## 後續

風險：部署後的 Pages 與 Actions 仍須確認；目前主分支部署批次曾排隊，舊 PR 瀏覽器 QA 尚有未查明失敗。下一輪優先實際追查 `Home search entry QA` 的非部署型瀏覽器失敗，再決定是否調整腳本或介面，不把所有紅燈歸因為部署逾時。
