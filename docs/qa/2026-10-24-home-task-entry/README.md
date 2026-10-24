# 2026-10-24：首頁直接依任務找案例

## 問題與決策

新訪客可從首頁直接搜尋，也可選情境，但若不知道該輸入什麼，必須先往下找到收合的「常用搜尋」。首頁第一屏缺少可直接採用的問題範例。

實際基準走查：GitHub Pages `https://richardhan.github.io/ai-agent-use-cases/`，桌面 1440×1000、手機 390×844。首頁搜尋按鈕分別位於桌面 y=389、手機 y=330；搜尋欄則在首頁內容之後。手機首次視窗沒有顯示搜尋欄或常用搜尋。修改前截圖保存於 `screenshots/before-*`。

方案 A（採用）：在首頁搜尋入口下方放三個有已知非空結果的問題詞連結，直接帶到相同搜尋結果。改動小，保留原有引導順序；首頁增加一行內容。

方案 B：重排首頁，將完整搜尋／任務探索區搬到情境引導之前。會改動主要導覽順序，也增加手機首屏密度與維護成本。

對象是還不熟悉 AI 工具名稱的新訪客。預期改善是從熟悉的任務詞進入案例，不必先猜工具名稱或搜尋語法。

## 修改與範圍

- 在首頁 hero 新增「規劃旅行」「收件匣」「比價」三個原生連結，網址採相對路徑 `?q=…#explore`，兼容 GitHub Pages 子路徑、直接連結與重新整理。
- 連結有 44px 最小操作高度、鍵盤 focus 樣式與高對比文字；無新增 JavaScript、外部服務、追蹤或使用者資料傳送。
- 不修改案例、來源、證據狀態、排序、篩選邏輯；只將新靜態測試檔加入既有首頁 QA workflow 的 push／PR 路徑篩選。

## 驗收標準與結果

- 三個連結在 1440×1000、390×844、320×740 的首屏皆可見，且不造成水平溢位。**通過。**
- 1440×1000 預覽點擊／直鏈結果：`規劃旅行` 1 筆、`收件匣` 136 筆、`比價` 51 筆。結果分別來自公開目錄 447 筆，數量是本次檢查結果，不是人氣或成效指標。**通過。**
- 旅行流程可開啟 UC-001、展開來源、返回結果並保留查詢；分享直鏈可刷新。**通過。**
- Chromium 1440/390/320、Firefox 390、WebKit 390 的搜尋入口流程皆通過；Axe 主要 WCAG 2.1 AA 掃描 0 違規。Chromium／Firefox 以 Tab 驗證連結焦點，WebKit 驗證原生 anchor 可聚焦與 3px focus-visible 外框。**通過。**
- 以手機、桌面模擬三個情境：旅遊規劃（開案例、來源、返回）、收件匣案例探索、比價案例探索。這些是自動化走查，不是真人研究。**通過。**

先新增 `tests/home-task-entry.test.cjs` 並在未修改首頁時執行：0/3 連結，測試如預期失敗；加上入口後通過。完整瀏覽器驗收擴充既有 `tests/home-search-entry-browser.cjs`。

## 指令與結果

- `node --test tests/home-task-entry.test.cjs`：1/1 通過（基準先紅，實作後轉綠）。
- `node --test --test-reporter=tap tests/*.test.cjs`：261/261 通過，0 失敗。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：通過。
- `python3 scripts/preview.py /tmp/ai-visitor-workflows-after/ai-agent-use-cases`：靜態預覽成功。
- `NODE_PATH=/tmp/ai-visitor-browser-tools/node_modules SEARCH_ENTRY_URL=http://127.0.0.1:8087/ai-agent-use-cases/ node tests/home-search-entry-browser.cjs`：三引擎五配置完成；直接查詢、返回、空結果復原、直鏈刷新及 axe 全通過。
- `NODE_PATH=/tmp/ai-visitor-browser-tools/node_modules SEARCH_ENTRY_URL=https://richardhan.github.io/ai-agent-use-cases/ node tests/home-search-entry-browser.cjs`：正式站 Chromium 1440/390/320、Firefox 390、WebKit 390 全通過；五次 axe 零違規，三任務詞結果為 1/136/51 筆。
- `git diff --check`：通過。
- Repository 沒有 `package.json`、lint 或 type-check 指令；不宣稱執行了不存在的檢查。
- 新連結文字 `#285344` 對首頁紙色 `#f7f8f2` 的對比比為 8.16:1。

## 截圖與預覽

- 修改前：[`screenshots/before-desktop.png`](screenshots/before-desktop.png)、[`screenshots/before-mobile.png`](screenshots/before-mobile.png)。
- 修改後本機預覽：[`screenshots/after-desktop.png`](screenshots/after-desktop.png)、[`screenshots/after-mobile.png`](screenshots/after-mobile.png)、[`screenshots/task-search-results-desktop.png`](screenshots/task-search-results-desktop.png)。
- 正式站部署後：[`screenshots/published-desktop.jpg`](screenshots/published-desktop.jpg)、[`screenshots/published-mobile.jpg`](screenshots/published-mobile.jpg)。
- [預覽瀏覽器結果](preview-browser-results.json)；[首屏版面量測](preview-layout.json)。

## Actions 觀察

獨立唯讀檢視最新 `main` 30 筆 workflow runs：28 成功、2 失敗，沒有取消或逾時。兩次失敗是 Reader 表格的 QA 完整性檢查假警報，因表格閱讀控制產生的合法 label/focus 屬性被舊測試誤認成原始內容變更。相關基準比較已修正；最新 Pages deploy 40101521723 成功。已把新靜態測試檔加入既有首頁 QA workflow 的 push／PR 路徑篩選，避免未來單獨改測試時漏跑。三個舊開啟 PR 的紅燈與本輪首頁功能無關：#78 因 Playwright 不支援 ubuntu26.04 runner 上的 Chromium；#79/#80 在 baseline assertion 失敗，沒有逾時或 runner 資源問題。本輪不改動那些 PR。

PR #85（[merge commit `ec83a16`](https://github.com/RichardHan/ai-agent-use-cases/pull/85)）已合併。正式 Pages run 40103098298 的 Jekyll build／deploy 成功。首頁 QA 主線 run 40103098797 首次執行的 preview 流程通過，但正式資產檢查先於 Pages deploy 到期；當時 deploy job 排隊約 6 分鐘。部署後重跑同一 QA run 成功（五配置 preview、正式資產比對、完整首頁流程皆通過）。另以正式網址再手動跑五個瀏覽器配置及五次 Axe，全部通過，截圖如上。

同批主線 Actions 還有既有檢查失敗：Category finding QA 因 180 秒內尚未取得本次發布資產；Reader controls QA 的舊載入測試在 `tests/load-recovery-browser.cjs:57` 得到 3 次請求而預期 2 次；Partial Load QA 在瀏覽器流程步驟失敗。這些不由本輪首頁連結程式造成，失敗和部署排隊問題已保留，不宣稱全站 Actions 全綠。

## 獨立審查與限制

獨立 reviewer 檢視首頁連結語意、子路徑、鍵盤/觸控、證據來源、測試及資料隱私，確認 baseline observe 模式與現有 workflow 路徑相容，沒有阻擋問題。

搜尋結果會隨公開目錄更新而變動；「規劃旅行」目前僅有一筆，不代表完整旅行主題覆蓋。瀏覽器模擬不等於實機或真人可用性研究。預覽圖片以 Chromium 為主；其他引擎以流程與可及性斷言驗收。

下一輪值得做：繼續觀察新訪客是否能由「想做的事」找到更細緻案例；先累積具體的失敗搜尋詞，再決定是否擴充入口，避免用未驗證的熱門度假設選詞。
