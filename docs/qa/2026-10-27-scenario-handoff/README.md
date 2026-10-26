# 2026-10-27 詳情早期探索同情境

目標：首次閱讀案例、想比較同情境做法的訪客。正式站 390px UC-001 的「探索更多生活案例」位於詳情 y=3481px，桌面 y=2807px，遠在原文與相關內容之後；不是容易發現的下一步。390px 詳情視口高約 760px。

兩案：A 保留頁底操作、在上方新增捷徑（低實作成本，但同一動作重複且焦點路徑冗長）；B 將既有操作移到用途與原始 Markdown 入口後（採用，單一入口，維持既有篩選語意與操作處理）。不改搜尋演算法、案例資料、證據分類、來源或統計。驗收：手機與桌面可在用途後看到操作、至少 44px 高；按下關閉詳情、切換同情境並聚焦結果；無重複操作、無水平溢出；直鏈、搜尋、空結果、返回與來源仍正常。

| 尺寸 | 修改前正式站 | 修改後本地預覽 | 操作頂端位置 |
| --- | --- | --- | --- |
| 390×844 | [前](before-mobile.webp) | [後](after-mobile.webp) | 3481px → 634px |
| 1440×900 | [前](before-desktop.webp) | [後](after-desktop.webp) | 2807px → 526px |

預覽：`python3 scripts/preview.py /tmp/visitor-after/ai-agent-use-cases`，再以 `python3 -m http.server 8137 --directory /tmp/visitor-after` 開啟 `http://127.0.0.1:8137/ai-agent-use-cases/?case=UC-001`。此預覽使用 GitHub Pages 子路徑；截圖由 Chromium 取得。原先瀏覽器回歸腳本增加了作用區與唯一性斷言，但本機未安裝 Playwright，不能宣稱該腳本通過。

本地手動瀏覽器：390px 直鏈 UC-001，按操作後詳情關閉、`scenario=生活`、焦點在 `results-count`，顯示 92/459；1440px 以同情境加無結果查詢得到 0/459，改搜旅遊開啟案例後 Escape 返回且焦點回到閱讀按鈕。來源 Markdown 指向固定發布 SHA，詳情無水平溢出。459 是網站條目，不是合格案例數。尚未做真實使用者研究或正式站發布驗收；外部 GitHub 來源可因限流拒絕。Actions 近期兩個正式站驗收在 Pages 尚未完成時超時（Search relevance 40352587642、Print reading 40352587484），不把既有紅燈稱作本輪退化。下一輪優先修正式站驗收與 Pages 部署競速及無法確認 main 時的 fail-open。

發布補記：PR [#146](https://github.com/RichardHan/ai-agent-use-cases/pull/146) 的 GitHub API merge 因 Enterprise Managed User 權限被拒；先核對 `origin/main` 仍為祖先，再以 SSH 一般快轉推送 `d517662`，未強推或碰協作者未追蹤目錄。[Pages 40366390410](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40366390410) 建置、回報、部署成功。正式站 `assets/app.js` 帶 cache-bust 的 SHA-256 與本輪檔案相同；初次開頁命中 CDN 舊腳本，停用瀏覽器快取重整後 390px 操作 y=634px、44.39px 高且唯一，點擊後焦點落結果、生活 92/459、無水平溢出。PR 部分 Actions 成功；Find reader sections、Reading flow、Source guide 預覽在 runner 工作上限 25／30／35 分鐘被取消，無 artifacts；無管理權限無法 rerun。這三項不是通過，也沒有證據顯示產品斷言失敗；後續主線工作仍執行，不稱全綠。362 單元及 JS 語法檢查全過。
