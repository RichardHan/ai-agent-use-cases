# 詳情頁提前核對來源段落

目標：從搜尋或分享直鏈讀長案例的初訪者，先判斷用途，再能核對原文來源與版本；這不是獨立驗證或外部連結的可信度背書。

正式站手機 390px UC-359：用途約 y=462、GitHub 收錄 Markdown 動作約 y=1470、原本「核對來源與版本」約 y=3602。後者在長篇原文紀錄之後，想查外部依據的讀者容易只看到收錄檔。桌面與手機原樣截圖：[桌面](2026-10-26-early-source-before-desktop.png)／[手機](2026-10-26-early-source-before-mobile.png)。

方案 A（採用）：搬動既有的來源段落捷徑到用途之後，點擊仍展開原始研究並聚焦原文標題；保留原本的來源挑選與完整上下文，成本為 DOM 順序、樣式與瀏覽器回歸。方案 B：頂部直接列出外部網址；速度較快，但各案例的外鏈可能只是工具文件或延伸閱讀，不應暗示它們一律是主要證據。本輪不修改案例、證據定性、搜尋排序或外部來源。

驗收：有來源段落才出現捷徑，位於用途與分享動作之間；點擊打開完整研究並聚焦正確標題；長標題、320/390/1440px 無橫向溢出；直鏈重載、搜尋＋篩選、空結果、返回、鍵盤與來源外鏈不退化。預覽：`python3 scripts/preview.py /tmp/visitor-source-preview/ai-agent-use-cases && python3 -m http.server 8766 --directory /tmp/visitor-source-preview`，開啟 `http://127.0.0.1:8766/ai-agent-use-cases/?case=UC-359`。修改後：[桌面](2026-10-26-early-source-after-desktop.png)／[手機](2026-10-26-early-source-after-mobile.png)。

先在未改預覽加瀏覽器斷言，得到 `.reader-source-shortcut` 0 件、預期 1 件的紅測；改後 UC-359 390px 來源捷徑約 y=1018，動作約 y=1496；320px 約 y=1186，點擊後研究開啟並聚焦來源標題，兩者沒有水平溢出。原始資料 452 來源逐 byte 一致。單元 358 pass、0 fail；無獨立 lint/typecheck 指令，Jekyll 本機缺 Gemfile，以 Pages 相容 preview 驗證。正式站更新與 Actions 以合併後結果為準。

獨立審查發現捷徑的 `aria-label` 與可見文案不同，會違反語音操作的 Label-in-Name；已移除覆寫。最後預覽無障礙名稱為「核對來源與版本 ↓」，點擊仍聚焦來源標題。Reader browser suite（Chromium／Firefox／WebKit、桌面及手機搜尋與閱讀、返回與空結果）exit 0；原本測試在未修改預覽正確失敗，修改後曾因新增測試提前展開研究影響後續斷言，已將展開驗證交給原有來源流程並重跑通過。

`ROUND_URL=http://127.0.0.1:8766/ai-agent-use-cases/ ROUND_OUTPUT=/tmp/early-source-round NODE_PATH=/tmp/visitor-method-deps/node_modules node tests/round-browser.cjs` exit 0：Chromium 1440／390／320／480px 四種檢查皆 complete，頁面錯誤為空；桌面 UC-005 實際開啟 Zenn 來源連結。此 suite 包含載入、組合篩選、空結果、直鏈重載、返回、鍵盤與兩個 axe 狀態。

三種模擬走查（不是用戶研究）：① 長篇 UC-359 直鏈看用途再核對來源；② 搜尋旅遊＋工具篩選、讀 UC-001 並返回；③ 空結果改詞、直鏈重新整理。下一輪優先處理原文來源段落內的連結性質辨識；不可把工具文件誤稱案例結果來源。
