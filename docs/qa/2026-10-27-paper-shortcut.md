# 論文資料入口對齊搜尋意圖

目標：第一次從首頁「論文資料」找研究寫作案例的讀者。原入口實際搜尋「研究」，本機 Pages 相容預覽顯示 178／459 筆，首筆 UC-039 是競品研究簡報；直接搜尋「論文」顯示 4／459，首筆 UC-012 是論文結論與來源核對。公開站互動載入因 `assets/app.js` 請求未完成，未將本機數字冒稱正式站觀測。

兩案：A 保留入口文字，改查「論文」（窄而貼近意圖，選用）；B 改稱「研究探索」並保留廣泛查詢（成本更低，無法直接找到論文）。只改首頁入口，不改同義詞、排序、案例、證據、統計或其他快捷搜尋。4 筆含全文命中，仍須閱讀每篇來源與限制，並非 4 筆均經獨立驗證。

| 尺寸 | 修改前：研究 178 筆 | 修改後：論文 4 筆 |
| --- | --- | --- |
| 390px | [修改前](2026-10-27-paper-shortcut-before-mobile.png) | [修改後](2026-10-27-paper-shortcut-after-mobile.png) |
| 1440px | [修改前](2026-10-27-paper-shortcut-before-desktop.png) | [修改後](2026-10-27-paper-shortcut-after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/paper-preview/ai-agent-use-cases`，`python3 -m http.server 8081 --directory /tmp/paper-preview`，開啟 `http://127.0.0.1:8081/ai-agent-use-cases/`。基準 `node --test tests/*.test.cjs`：363 通過、0 失敗；`node --check assets/app.js` 與預覽生成成功。修改前實際點入口得到 `?q=研究`、首筆 UC-039；修改後 `?q=論文`、首筆 UC-012。`ROUND_URL=http://127.0.0.1:8149/ai-agent-use-cases/ node tests/paper-shortcut-browser.cjs`：Chromium 390／1440px 鍵盤 Enter、Back／Forward、組合篩選（學習 3 筆）、空結果、UC-012 詳情直鏈重載、Escape 返回通過；原始 Markdown 指向本站版本 SHA。獨立審查未發現引入的功能、base path、無障礙或資料外洩問題；依建議補上鍵盤與歷史回歸。截圖為本機預覽而非正式發布前後。未量測跨引擎效能與 axe，亦未驗證正式 Pages 發布。

三種模擬走查：論文寫作者從入口到 UC-012 與來源；學習情境讀者再疊加篩選；輸入不存在的複合詞後回到論文結果並開啟直鏈。均屬功能檢查，非真人偏好。下一輪優先釐清正式站首次載入過久時的可用替代入口，並與既有 Pages／公開站 QA 工作分開處理。
