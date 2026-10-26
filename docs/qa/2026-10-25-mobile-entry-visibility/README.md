# 2026-10-25 極窄手機首頁任務入口可見性

## 方案取捨

- **A（採用）：** 僅在 ≤360px 窄螢幕壓縮 Hero 價值卡與步驟區塊的垂直留白。保留內容、順序、字級與 44px 觸控目標；CSS 範圍小，直接修復首屏被裁切。
- **B：** 將任務捷徑搬到 Hero 更前方或改成精簡導覽列。能更大幅縮短到入口的距離，但改變閱讀層級與 DOM 順序，需處理窄螢幕換行和鍵盤焦點，成本較高。

選 A：只改造成問題的極窄版面，不改其他手機／桌面版面或降低觸控目標。

## 問題、受眾與目標

新訪客使用 320×740 手機，想直接搜尋熟悉的任務。GitHub Actions `Home search entry QA` run [40124636707](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40124636707) 在 `tests/home-search-entry-browser.cjs:30` 失敗（`task examples stay in the initial viewport`）。修改前實際 Pages 量測三個任務連結的底端為 **740.625px**，比 viewport 底部多 0.625px；完整 44px 目標未能全部留在首屏。這是可重現的內容裁切，不是以放寬斷言掩蓋的 CI 假警報。

目標：320×740 首屏顯示所有三個任務入口；保留價值卡、三步驟、焦點可見性和觸控大小。其他寬度、搜尋、篩選、案例與來源內容均不變。

## 實作與驗收標準

`assets/style.css` 新增 ≤360px 規則：價值卡內距 12px→8px、下方間距 20px→12px，新手步驟下方間距 20px→12px。只壓縮垂直空白。

驗收條件：

1. 320×740 所有三個任務搜尋連結整體位於首屏且每個至少 44px 高。
2. 320px、390px、1440px 均無水平溢出；390px 與桌面尺寸的既有版面不改。
3. 搜尋、組合篩選、空結果、詳情、返回及來源入口可用；鍵盤焦點可辨識。
4. 搜尋字詞、案例、憑據、來源資料、Pages base path 與部署架構不變。

不處理首頁其他視覺改造、來源內容、案例新增、CI 輪詢政策或其他本次獨立失敗的 workflow。

## 前後證據

實際開啟正式 Pages（修改前）及本機靜態預覽（修改後）：

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面 1440×1000 | [首頁](screenshots/before-desktop.webp) | [首頁](screenshots/after-desktop.webp) |
| 手機 390×844 | [首頁](screenshots/before-mobile.webp) | [首頁](screenshots/after-mobile.webp) |
| 窄手機 320×740 | [首頁](screenshots/before-narrow.webp) | [首頁](screenshots/after-narrow.webp) |
| 同一預覽、同一 320×740 viewport／瀏覽器 | [原 CSS 間距](screenshots/before-narrow-controlled.webp) | [修正後 CSS](screenshots/after-narrow-controlled.webp) |

正式站修改前入口底端 **740.625px**，本機修改後 **698.4375px**；這兩張正式站／本機截圖不是完全控制變因的比較。另以同一份本機預覽和 320×740 瀏覽器上下文，注入舊間距值作修改前：底端 **722.4375px**；移除覆寫後為 **698.4375px**，CSS 間距修正的受控差值為 **24px**。三個連結均 **44px** 高，`scrollWidth=320`。390px／1440px修改後任務連結亦均在首屏且各 44px 高；水平寬度分別 390px／1440px。連結前景與頁面底色實測對比 **8.16:1**；鍵盤聚焦外框 **3px**。

## 走查與指令

三種模擬情境（非真人使用者研究）：

1. **首次造訪者，桌面：** 讀首頁價值說明，首屏可見「規劃旅行／收件匣／比價」入口；改前後桌面截圖對照，既有內容不變。
2. **工作者，手機：** 320×740 直接入口全數落在首屏；在 390×844 以「旅遊」＋「生活」＋「Grok Bot」搜尋，結果 16 筆、Enter 焦點到 `results-count`，打開 UC-001 核讀證據，Escape 返回後搜尋和工具選擇仍保留，再確認無結果提示可見。
3. **窄螢幕鍵盤／詳情直鏈：** 320×740 三個連結都可見、每個 44px，Tab 聚焦顯示 3px 外框；320／390／1440 均無水平溢出。另以 `?case=UC-005` 直接載入詳情，Escape 可關閉；開啟其 Zenn 原始來源頁，標題正常載入（HTTP 200）。

基線與本機預覽：

- `node --test tests/*.test.cjs`（修改前及修改後）：各 **275 passed, 0 failed**。
- `for file in assets/*.js; do node --check "$file"; done`：通過；`python3 scripts/preview.py /tmp/visitor-qa-final`：成功建立 Pages 靜態預覽。
- 管理瀏覽器實機走查修改前正式站與修改後本機預覽，覆蓋 1440×1000、390×844、320×740；搜尋、組合篩選、結果摘要焦點、UC-001 詳情／證據、Escape 返回、空結果、UC-005 直鏈及來源頁均成功。
- 修改後 320×740 任務入口底端 **698.4375px**，觸控目標 **44px**，水平寬度 320px。
- 本機未安裝 Playwright／axe，故不能本地執行瀏覽器自動化或 Axe。GitHub Actions `Home search entry QA` 已在 main `886fb04` 的 [run 40147923790](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40147923790) **成功**，包含修改後首頁搜尋旅程驗收；修改前對應失敗為 [run 40124636707](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40124636707)。不聲稱 Axe 通過。

本機預覽方式：`python3 scripts/preview.py /tmp/visitor-qa-20261025`，再以靜態伺服器從該目錄提供 `index.html`。截圖為可直接開啟的 WebP 檔。

## 風險與下一輪

本輪窄手機修正已整合 main；`Home search entry QA` 的雲端驗收成功。main `886fb04` 同批另有五個工作流程報紅： [Improvement round](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40147923912)、[Results return](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40147923908)、[Reading anchor](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40147923876)、[Category finding](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40147923858)、[Round 23](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40147923847)；本輪未診斷或修復，不以本項綠燈代表 Actions 全綠。使用本機 Chromium 預覽，不代表真人偏好或效能改善。下一輪先定位仍有效的其他 Actions 失敗。
