# 詳情頁先讀用途，再選擇動作

正式站 390px UC-359 直鏈：分享／列印／來源動作在 y=448，案例用途在 y=562；長標題之後先要求訪客選動作，尚未看到它解決什麼。目標讀者是從搜尋或分享直鏈初次進入詳情、要先判斷用途與限制的人。

- A（採用）：保留既有原文方法捷徑，將用途與適用情境移至分享動作之前；維持憑據與原文完整呈現，調整 reader 插入順序與鍵盤反向焦點。成本為小範圍 DOM 順序與回歸驗收。
- B：重新設計詳情頂部的固定導覽／來源面板，可讓任何捲動位置都直達來源，但增加手機高度、鍵盤與列印複雜度。本輪不做。

驗收：用途先於分享／來源動作，長標題下仍至少可見兩行用途；原文方法在用途前且可鍵盤直達；來源連結、證據說明、搜尋與組合篩選、空結果、直鏈重載與返回不退化。手機 390／320px、桌面 1440px 無橫向溢出。原始案例、來源憑據、base path、靜態部署不變；不聲稱讀者偏好或轉換提升。

| 視口 | 修改前 | 修改後 |
|---|---|---|
| 390px UC-359 | [正式站截圖](2026-10-26-source-context-before-detail-mobile.png) | [預覽截圖](2026-10-26-source-context-after-mobile.png) |
| 1440px UC-359 | 原始正式站順序：動作先於用途 | [預覽截圖](2026-10-26-source-context-after-desktop.png) |
| 長標題 | [原先樣本](2026-10-26-source-context-before-long-title.png) | 由 round browser 於 320px 驗證兩行用途仍在對話框內 |

預覽：`python3 scripts/preview.py /tmp/source-context-preview/ai-agent-use-cases && python3 -m http.server 8100 --directory /tmp/source-context-preview`，開啟 `http://127.0.0.1:8100/ai-agent-use-cases/?case=UC-359`。Pages 相容靜態預覽不等同正式發布。

基準先以正式站重現先動作後用途；既有工作樹已有測試與初稿，初次單元執行因簡化 DOM 不支援 `insertBefore` 失敗，未宣稱此為修正前紅測。改為原生 append 順序後測試 358 pass／0 fail，450 來源逐 byte 一致，`node --check assets/app.js` 與 `tests/round-browser.cjs` 通過。`ROUND_URL=http://127.0.0.1:8100/ai-agent-use-cases/ ROUND_OUTPUT=/tmp/source-context-round NODE_PATH=/tmp/visitor-method-deps/node_modules node tests/round-browser.cjs` 完成 Chromium 1440／390／320／480px，兩個 axe 狀態各零違規；載入中與完整閱讀、搜尋＋生活篩選、空結果、直鏈重載、返回、外部來源皆通過。初次直接執行缺 `playwright`，使用既有隔離安裝路徑；無獨立 lint/typecheck 指令。

獨立審查指出 reader 插入的報告／證據／導覽會把方法捷徑推到長篇用途後面，且 WebKit Shift+Tab 依舊假設固定首控制；已將方法維持在用途前、報告與證據置於動作後，反向焦點依實際首個控制判斷。三個模擬情境（非真人評價）：① UC-359 直鏈先讀用途，再核對原文；② 搜尋旅遊＋生活篩選讀案例再返回；③ 無結果改詞並直鏈重載。正式站更新與最新 Actions 尚待合併後核對。

下一輪優先逐項定位主分支 Reader QA 與 Corpus bundle QA 的本地預覽失敗，不以延長 Pages 等待時間掩蓋非部署錯誤。


補充：`METHOD_URL=http://127.0.0.1:8100/ai-agent-use-cases/ NODE_PATH=/tmp/visitor-method-deps/node_modules node tests/method-shortcut-browser.cjs` 通過 Chromium 1440／390／320px，方法捷徑手機 y=309／339；`READER_URL=http://127.0.0.1:8100/ai-agent-use-cases/ READER_ENGINE=webkit NODE_PATH=/tmp/visitor-method-deps/node_modules node tests/reader-browser.cjs` 通過 WebKit 手機搜尋、原文導覽、焦點、返回、空結果與 axe 零違規。`bundle exec jekyll build` 因 repo 沒有 Gemfile／.bundle 而未執行建置；靜態 preview 及來源 bundle 檢查已通過。現有 Reader controls QA #40243103380 在本地 Baseline and preview 步驟失敗，發布驗收尚未開始；工作流程僅見合併步驟 exit 1，未將其誤判為 Pages 競速。來源動作在長用途案例會比原先低，需下一輪評估如何兼顧快速核對來源。