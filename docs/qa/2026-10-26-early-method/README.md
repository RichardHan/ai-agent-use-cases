# 詳情頁提早顯示原始方法入口

正式站 390×844 的 UC-402 直鏈，原本「前往方法與步驟」位於 y=973.6，低於首屏 844px；標題、分享動作及長用途摘要先佔據畫面。目標讀者是從問題搜尋進入案例、想先判斷方法是否可採用的新訪客。預期讓原文方法更早可達，不把本庫設計的入門建議冒稱為作者實測。

- A（採用）：把帶有原文完整限定語的單一方法入口放在標題之後、分享動作之前；原有本庫建議入口留在用途後，兩者來源不同。成本低，保留現有導覽及詳情結構。
- B：手機固定四段式導覽列；可在長文持續提供入口，但增加固定工具列高度、焦點與窄螢幕排版成本。本輪不做。

驗收：原文方法入口在手機首屏及分享動作之前、點擊到對應原文標題；反向鍵盤焦點回工具列；無方法的條目不造入口。搜尋、組合篩選、空結果、直鏈重載、返回、來源連結與 320px 長文排版不退化。案例原始資料、憑據分類、base path 和外部來源不變。

| 視口 | 正式站修改前 | 本地 Pages 相容預覽修改後 |
|---|---|---|
| 390×844 | [before-mobile](before-mobile.png) | [after-mobile](after-mobile.png) |
| 1440×1000 | [before-desktop](before-desktop.png) | [after-desktop](after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-method-preview/ai-agent-use-cases && python3 -m http.server 8082 --directory /tmp/visitor-method-preview`，開啟 `http://127.0.0.1:8082/ai-agent-use-cases/?case=UC-402`。修改後手機方法入口 y=412.8–503.4，桌面 y=327.1–397.3；兩者無水平溢出。桌面點擊展開原文並聚焦 `reader-section-3`，標題 top=138.8、工具列 bottom=121。正式站前後截圖由實際 Chromium 流程取得；本地預覽不執行 Jekyll metadata，不視作已發布驗收。

基準：`node --test tests/*.test.cjs` 356 pass、0 fail；JS 語法檢查通過；`python3 scripts/check_corpus_bundle.py /tmp/baseline-ai-agent-use-cases-20261026` 450 來源逐 byte 一致。沒有獨立 lint/typecheck 指令，當地沒有 Jekyll（exit 127）。本輪加入 `reader-browser.cjs` 的行動版方法位置與 Shift+Tab 回工具列行為斷言。獨立 review 發現舊反向 Tab 攔截只處理複製按鈕，已同步改為實際首個正文控制；不是把 UI 問題藏在測試。

三種模擬走查（非真人偏好或轉換率）：① 旅遊搜尋與生活／Grok Bot／旅遊消費研究組合篩選，讀取並返回保留條件；② 無效詞空結果後重設；③ UC-402 直鏈重載、原始 Markdown 固定版本與方法入口。正式站來源連至發布 SHA `7338b949…`；Pages 發布後仍須核對本輪 commit。Actions 既有 reader 失敗為本地預覽 `visibleBelowToolbar` 對未捲動的原文入口斷言，不是 Pages 資產競速；本輪在可見性斷言前先實際捲入視窗。其他 Actions 失敗需各自定位，不能宣稱全綠。

完成驗證：`node --test tests/*.test.cjs` 356 pass／0 fail；全站 JS `node --check` 通過；來源 450 個逐 byte 一致。`NODE_PATH=/tmp/visitor-method-deps/node_modules READER_ENGINE=chromium node tests/reader-browser.cjs` 通過桌面、390／320px，三組 axe 0 違規；同指令 `READER_ENGINE=webkit` 通過手機。最終手機直鏈再以 Enter 啟動方法、焦點至 `reader-section-3`（top 151.6 > 工具列 bottom 134）；Shift+Tab 從方法返回 `close-detail`。初次本地 browser 執行缺 `playwright`，隔離安裝於 `/tmp/visitor-method-deps` 後執行；第一次完整單元重跑發現 app 鍵盤測試的簡化 DOM 不支援無條件查詢，改為只在 Shift+Tab 時計算後全數通過。測試先加入斷言，但 browser 套件缺失令修改前無法執行該紅測試，不宣稱先紅。

下一輪優先釐清 Reader QA／Corpus bundle QA 本地預覽其他失敗的完整錯誤，與部署競速分開處理。
