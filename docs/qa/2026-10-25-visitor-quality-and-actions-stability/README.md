# 2026-10-25 案例卡片情境徽章、搜尋心智導引、無障礙觸控與 GitHub Actions 逾時加固

## 決策與方案取捨

1. **方案 A：全面重構卡片與情境導航標籤系統（高成本、高變動）**
   - 重新設計首頁 Hero、卡片與篩選器之間的關聯，引入多級情境標籤與自訂分類過濾器；在卡片中塞入完整的實作步驟預覽與前置限制，重寫所有卡片 DOM 結構。
   - 取捨：大幅增加首頁資訊密度與頁面高度，破壞現有 320px/390px 視口首屏閱讀節奏；修改範圍過大可能破壞大量既有單元與瀏覽器測試；首頁過重導致低階手機卡頓。
   - 結論：不採用。

2. **方案 B（採用）：問題導向卡片情境徽章、首頁實時檢索導引、無障礙觸控與對比度加固，以及 CI Actions 逾時穩定性修復**
   - **首頁檢索心智模型**：搜尋提示明確說明「輸入關鍵字即時篩選，按 Enter 或點選「查看結果」直達結果清單；支援多詞同時符合（AND），可搜尋想解決的問題、提及工具、實作作法與限制」，消除初訪者對「必須點擊才能搜尋」的困惑。
   - **卡片情境徽章**：在卡片頂部加入六大標準情境徽章（生活、工作、省錢、學習、創作、開發），採用各情境專屬溫和語意配色（對比度 7.24:1～9.97:1），讓新訪客一眼辨識「這篇適合誰、在什麼場景下解決問題」。
   - **無障礙觸控目標與文字對比**：
     - 將全站 placeholder 與 kbd 提示文字提升至 `#4e5d4e`（對比度 7.00:1，遠超 WCAG AA 4.5:1 要求）。
     - 為 desktop `.chip`、`.research-details > summary`、`.reader-guidance > summary`、`.related-open` 補齊 `min-height: 44px` 觸控下限與清晰 `:focus-visible` 外框。
   - **GitHub Actions CI 逾時系統性修復**：
     - 針對 Actions 頻繁失敗的根因（如 run 40135570318 因串行安裝與執行 Chromium/Firefox/WebKit 三引擎在 10m0s 逾時取消），將 `outline-find-qa.yml`、`missing-case-qa.yml`、`return-visibility-qa.yml` 的 `timeout-minutes` 提升至 25 分鐘。
     - 於 `tests/visitor-experience-and-ci.test.cjs` 補齊防禦性測試，鎖定三工作流程的逾時上限。

目標讀者：初次造訪尋求具體任務解法的訪客、手機使用者、鍵盤與螢幕閱讀器使用者。
不處理範圍：不改寫案例研究事實、不修改外部來源或合格審核數據、不引入外部框架或遙測追蹤。

## 問題證據與實測數據

1. **GitHub Actions 逾時失敗**：
   - PR 90 之 `Find reader sections QA`（run 40135570318）在 10m19s 被系統取消，標註 `The job has exceeded the maximum execution time of 10m0s`。
   - 經查其需要在 Ubuntu runner 上逐一安裝 playwright 三核心、字型並順序執行 3 瀏覽器引擎測試，10 分鐘不足以容納環境建置與回歸執行。提升至 25 分鐘後徹底消除取消風險。
2. **無障礙對比度與觸控下限**：
   - 修改前 placeholder（`#869086`）對比度僅 3.79:1，kbd（`#899284`）對比度僅 3.52:1，未達 WCAG AA 4.5:1。修改後改為 `#4e5d4e`，對比度達 7.00:1。
   - 修改前 desktop `.chip` 無 `min-height: 44px`，`.research-details > summary` 實測高度低於 44px 且缺少 `:focus-visible`；修改後均達 44px 觸控標準且焦點外框清晰。
3. **視口與水平溢出**：
   - 桌面 1440×900、手機 390×844、窄螢幕 320×740 實測 `scrollWidth <= innerWidth`，水平溢出 0px。
4. **獨立審查發現與修正**：
   - `IndependentReviewer` 指出 `assets/app.js` 原有 `syncDiscovery` 使用全域 `[data-scenario]` 選擇器，導致卡片新增的情境標記被誤設 `aria-pressed`。已將其嚴格限制為 `button[data-scenario]`，經實測非按鈕元素的 `aria-pressed` 計數為 0，完全消除無障礙風險。

## 變更檔案清單

- `index.html`：更新搜尋引導文案，闡明即時篩選與 Enter 焦點引導心智模型。
- `assets/app.js`：卡片頂部渲染 `.card-scenario` 徽章；限制 `syncDiscovery` 僅更新 `button[data-scenario]`。
- `assets/style.css`：提升 placeholder 與 kbd 對比度至 7.00:1；新增 `.card-top-badges` 與六大情境專屬徽章樣式；設定 `.chip` 與 `.research-details > summary` 44px 觸控下限與焦點樣式。
- `assets/reader.css`：設定 `.related-open` 與 `.reader-guidance > summary` 44px 觸控下限與 `:focus-visible` 外框。
- `.github/workflows/outline-find-qa.yml`：工作逾時提升至 25 分鐘。
- `.github/workflows/missing-case-qa.yml`：工作逾時提升至 25 分鐘。
- `.github/workflows/return-visibility-qa.yml`：兩項工作逾時均提升至 25 分鐘。
- `tests/visitor-experience-and-ci.test.cjs`：新增多引擎 CI 逾時上限、卡片情境徽章、觸控目標與文字對比度斷言（全套測試由 286 項增至 289 項全數通過）。
- `SITE.md`：記錄本輪交付成果與維護紀錄。

## 修改前後截圖

- **桌面首頁 (1440×900)**：[修改前](screenshots/before-desktop-home.png) · [修改後](screenshots/after-desktop-home.png)
- **桌面搜尋結果 (1440×900)**：[修改前](screenshots/before-desktop-search.png) · [修改後](screenshots/after-desktop-search.png)
- **桌面案例詳情 (1440×900)**：[修改前](screenshots/before-desktop-detail.png) · [修改後](screenshots/after-desktop-detail.png)
- **桌面空結果與引流 (1440×900)**：[修改前](screenshots/before-desktop-empty.png) · [修改後](screenshots/after-desktop-empty.png)
- **手機首頁 (390×844)**：[修改前](screenshots/before-mobile-home.png) · [修改後](screenshots/after-mobile-home.png)
- **手機案例詳情 (390×844)**：[修改前](screenshots/before-mobile-detail.png) · [修改後](screenshots/after-mobile-detail.png)
- **手機空結果與引流 (390×844)**：[修改前](screenshots/before-mobile-empty.png) · [修改後](screenshots/after-mobile-empty.png)
- **窄螢幕首頁 (320×740)**：[修改前](screenshots/before-narrow-home.png) · [修改後](screenshots/after-narrow-home.png)

## 三種具體情境走查紀錄

1. **情境一：新訪客依常見痛點「日報整理」尋求自動化經驗**
   - 訪客進入首頁，由 Hero 價值標籤理解本庫收錄原則；點擊「日報整理」標籤，系統自動填入「日報」並定位至結果。
   - 看到 62 筆收錄，每張卡片頂部清楚標記「工作」情境徽章與提及工具。
   - 點擊「看看怎麼用 →」開啟詳情對話框，展開原始研究檢視提示詞；按下 Escape 鍵精確關閉對話框，焦點流暢返回卡片按鈕。
2. **情境二：工程師以多詞 AND 查詢「PR 審查」並檢驗實施細節**
   - 在搜尋框輸入「PR 審查」後按下 Enter，鍵盤焦點即時移至 `#results-count` 宣布符合 18 筆結果。
   - 點入首筆案例（UC-005），頂部工具列標註「目前結果 1／18」，研究詳情標記憑據狀態；讀者可由閱讀導覽快速跳轉至實施結果與限制。
3. **情境三：手機使用者遭遇 0 筆空結果並透過痛點標籤即時復原**
   - 在 390px 視口輸入無相符內容之關鍵字，畫面呈現清楚狀態播報與 6 個痛點探索標籤。
   - 點選「PR 審查」標籤，搜尋詞自動替換為「PR」並立即返回 205 筆結果。
   - 全程於 390px 與 320px 視口無橫向滾動溢出，標籤高度維持 >= 44px。

## 本機預覽方式

```sh
python3 scripts/preview.py /tmp/preview_test/ai-agent-use-cases
python3 -m http.server 8080 --directory /tmp/preview_test
```
瀏覽器開啟 <http://127.0.0.1:8080/ai-agent-use-cases/>。
