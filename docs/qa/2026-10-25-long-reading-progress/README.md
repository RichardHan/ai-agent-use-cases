# 2026-10-25 長篇案例閱讀位置提示

## 選題、方案與取捨

**問題證據：**正式站桌面 1440px、手機 390px 實際直鏈 UC-005；原文有 42 個 H2/H3 段落，已有目錄與鍵盤跳段，但手動往下讀時，固定工具列只顯示案例結果位置，不顯示原文所在段落或全文進度。長篇（12 段以上）讀者需要重新捲動或打開目錄確認位置。

目標使用者：在桌面或手機閱讀長篇案例、用段落目錄跳讀或回到文章續讀的訪客。

1. **方案 A（採用）：固定工具列提供段落位置與原生進度條。**跟隨閱讀器捲動和目錄／鍵盤跳段，顯示目前 H2/H3 與 `N/總段數`；只對 12 段以上原文顯示。優點：閱讀全文時仍能辨識進度；取捨：工具列多一列，窄螢幕可視高度略減。
2. **方案 B：擴大或改造段落目錄。**可讓讀者在導覽內更容易找標題，但離開目錄後仍看不到目前段落，無法解決閱讀中定位問題；不採用。

不處理案例原文、來源、憑據、搜尋／篩選、Pages 部署來源或 Actions 故障修復；不增加第三方依賴、追蹤或資料傳送。

## 實作與驗收

- `assets/reader.js`：12 段以上文章在詳情固定工具列顯示當前段標題、`N/總段數` 和原生 `<progress>`；讀者捲動、視窗尺寸變動、開啟全文及鍵盤跳段時更新；使用 `aria-valuetext` 說明目前段落，沒有逐次捲動的 live-region 播報。長文間切換、短文切換、再開長文時清除舊進度節點、事件監聽器與排程的畫面更新；不在詳情對話框中的閱讀器呼叫不新增工具列狀態。
- `assets/reader.css`：沿用既有色彩與工具列樣式，手機和 320px 視口不增加水平溢出；段名維持單行省略，避免文字換行改變 sticky 工具列高度、遮住剛跳到的標題，完整標題保存在 `title` 與進度條 `aria-valuetext`。
- `tests/reader.test.cjs`、`tests/reader-browser.cjs`：涵蓋目前段落選擇、邊界、鍵盤跳段同步、阻止 scroll handler 時擴大視窗仍能更新全文結尾位置，以及長→長→短→長的清理生命週期。
- 桌面／手機直鏈、搜尋與返回流程仍保留原 URL、焦點和來源連結；案例內容與來源未改動。

## 修改前後截圖

修改前為正式站，修改後為本機 Pages 相容預覽；UC-005 原文有 42 段。

| 視口 | 修改前 | 修改後 |
|---|---|---|
| 桌面 1440×1000 | [正式站詳情](screenshots/before-desktop.png) | [預覽第 21／42 段](screenshots/after-desktop.png) |
| 手機 390×844 | [正式站詳情](screenshots/before-mobile.png) | [預覽第 42／42 段](screenshots/after-mobile.png) |
| 窄手機 320×740 | — | [預覽第 42／42 段](screenshots/after-narrow.png) |

本機預覽：`http://127.0.0.1:8100/ai-agent-use-cases/?case=UC-005`。頁面由 `python3 scripts/preview.py /tmp/ai-agent-round/ai-agent-use-cases` 產生並以 `python3 -m http.server 8100 --directory /tmp/ai-agent-round` 提供；它模擬 catalog，不是正式 Jekyll 部署。

## 實際走查與結果

1. **問題導向搜尋與返回：**正式站搜尋「旅遊」並加「生活」篩選，20 筆結果；開啟首筆 UC-001，確認 Markdown 來源 URL，Escape 返回仍保留關鍵字與情境；輸入不存在的詞顯示空結果。手機／桌面無水平溢出。
2. **長篇鍵盤閱讀及手動續讀：**本機預覽直接開啟 `?case=UC-005`，原文 42 段；鍵盤在段落目錄選第 21 段後，工具列顯示第 21／42 段及原標題，焦點留在目標標題，URL 不變。再由第 42 段向上捲動 5,000px，位置更新至第 35 段，焦點仍留在原段標題，網址不變。
3. **手機續讀與短篇切換：**390×844 及 320×740 鍵盤跳到第 42 段，進度值 42／42，`aria-valuetext` 含原標題；詳情與工具列 `scrollWidth - clientWidth = 0`。同一詳情對話框切換至 11 段 UC-003 時，位置提示和工具列 class 清除；再開 UC-005 只建立一個進度提示。

這些是瀏覽器模擬走查，不代表真人偏好或轉換率。

## 測試、限制與下一步

- 基準：`node --test tests/*.test.cjs` **306 通過**；修改後同指令 **307 通過，0 失敗**。`node --check assets/reader.js` 與 `node --check tests/reader-browser.cjs` 通過；靜態 Pages 預覽建置成功。
- 以暫存依賴（未寫入 repo）執行 Chromium `tests/reader-browser.cjs`：桌面、手機、小手機三組均 `PASS`，reader/outline/focus/resize/直鏈/返回流程通過；每個尺寸 Axe 0 violations。Playwright 截圖與暫存依賴皆放在 `/tmp`。
- 沒有獨立 lint、type-check 或 `package.json` build 指令；未量測效能分數。
- **本次 PR 的回歸修正：**初次 GitHub browser QA 在 320px 量到目錄跳段後標題被可換行的進度列遮住；改為單行省略，完整標題仍在 `title`／`aria-valuetext`。修正後 Chromium reader／outline browser scripts 在桌面、手機、小手機皆通過；新 head 的 GitHub Actions 仍待重跑確認。
- **Actions 現況另列風險：**本輪查詢最近 60 筆 workflow：52 成功、3 失敗、3 執行中、2 取消。main `d03c557` 最新 [Improvement round QA #40150712715](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40150712715) 在 `tests/round-browser.cjs:133` 因 reload 後 `#detail[open]` 30 秒逾時；前一個 [Round QA #40149678519](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40149678519) 通過直鏈載入後，`tests/round-browser.cjs:135` 又得到 27 個 `failedPaths`。另 [Facet counts #40149517989](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40149517989) 對已 supersede 的 `072ae76` 印出 skip，後續仍無條件檢查未建立的 `facet-published/catalog.json` 而失敗。前兩個 reload 症狀尚未證明與本次閱讀提示有關；本輪未跨題修改現有 Actions。main Pages 部署 run `40150712543` 成功。
- 下一輪最值得做：在目前 main 重現並修復 Round QA reload 後詳情／來源載入失敗，再讓 stale-publication skip 和其後置步驟共用明確結果，最後完整重跑 Actions；禁止只延長逾時或把失敗當成功。
