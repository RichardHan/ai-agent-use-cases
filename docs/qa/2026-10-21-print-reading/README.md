# 2026-10-21：把單篇案例完整留作離線閱讀稿

## 問題、選擇與界線

目標讀者是已找到適用案例、需要保存長文、離線核對方法與來源的人。

本輪由整合者負責程式修改；獨立審查者以 `gpt-6-astra / ultra` 只讀審核。主對話沒有可核實其實際模型／推理或切換的介面，未宣稱已切到帳號最高模型。只在已授權 repo 路徑進行檔案／Git／Node／Python 工作；所有瀏覽器、PDF 產生與光柵化均在 GitHub Actions，未操作個人桌面、使用付費 API、購買額度。

已讀 README、SITE.md、部署 workflow、歷史 QA 與維護規則；repo 內與其父目錄未發現適用 AGENTS.md。原工作目錄仍停在 `improve/search-recall-recent-workflows-and-tokenization`，既有 `assets/app.js` 與 `tests/search.test.cjs` 未提交修改完整保留。從遠端 main `9f22923` 另建 worktree／分支；其後正常合入協作者 PR #71 的 `27fed37`，沒有衝突，未覆寫其案例／核對報告。

雲端實際走查正式站 1440×1000、390×844：首頁 → 旅遊搜尋 → 生活＋Grok Bot → 閱讀 → Escape 返回焦點 → 空結果 → UC-005 直鏈 → 開原始來源 → 列印。正式站來源實際開啟 https://zenn.dev/tec/articles/c4fbfcfffde4ad 。原有 dialog 仍限高 898px、內容 1922px、overflow:auto，印出背景整批結果，原始研究未展開。原生 PDF 約89頁，UC-005有164個原文文字節點缺漏；這不是完整閱讀稿。

兩方案：
- A，沿用詳情，增設單篇列印／存PDF入口、專用列印排版與可還原的展開狀態。成本低，保留既有直鏈與閱讀流程。**採用。**
- B，另建獨立列印頁。適合後續做專屬閱讀網址，但需維護第二套載入、錯誤及直接連結流程，本輪不採用。

驗收標準：完整印出原始研究、最後一段、證據與待查提醒、全部來源URL；排除背景、工具列與重複摘要；列印結束／取消後還原展開狀態、焦點與閱讀位置；手機／桌面、直鏈重整、返回、搜尋與空結果不退化。

不處理：案例內容／合格數／去重候選判定、搜尋演算法、獨立列印路由、品牌改色、追蹤／登入／第三方儲存。

## 變更

- `assets/app.js`：詳情「列印／存成 PDF」按鈕、明確說明；只供列印的案例永久連結與證據提醒。永久連結清除搜尋條件與fragment，保留base path與案例ID。已顯示完整URL的來源連結不重複加括號。
- `assets/reader.js`：原生 beforeprint／afterprint 生命週期；只展開原研究，保存並還原同一節點的原開關、焦點與捲動，支援重入和連續列印。瀏覽器原生列印快捷鍵也會經過同一生命週期。
- `assets/reader.css`：單篇白底閱讀稿，移除dialog限高與捲動裁切，隱藏背景／導覽／重複先讀區；來源網址可換行、標題避免孤留頁尾，程式區可換行。
- `tests/print.test.cjs`：先紅後綠的取消／還原、已展開、重複列印與已離開節點測試。
- `tests/print-browser.cjs`、`.github/workflows/print-reading-qa.yml`：正式基準、預覽及發布資產核對、真PDF全文及URL比對、首末頁截圖、跨引擎排版與axe。

獨立審查已修正：工具列在detail-body外仍會列印；原警告被enhance移入隱藏區而遺失；非Chromium須驗正文及末段的rendered height；workflow須納入app.js/index.html/style.css依賴。

測試程序亦修正兩個問題：axe需顯式browser.newContext；連續page.pdf之前須清除先前screen media override。失敗均保留於Actions紀錄，未將其當成產品驗收成功。

## 驗證方式與限制

本機基準：`node --test tests/*.test.cjs`，136/136通過。新增後／合入最新研究後：139/139通過。`for file in assets/*.js; do node --check "$file"; done`與`git diff --check`通過。`python3 scripts/preview.py /tmp/print-round-final/ai-agent-use-cases`成功；前端沒有獨立lint、TypeScript或npm build，此預覽不等於Jekyll正式部署。

紅測試在固定 `9f22923` 的 reader.js 執行3項新測試，全失敗（`createPrintSession is not a function`）；修正後3/3通過。

三種模擬情境：
1. 想找旅遊方法：搜尋＋組合篩選、閱讀、Escape回原卡焦點、保留查詢、空結果。
2. 保存最長開發案例UC-005：直鏈、重整、打開外部來源、完整多頁PDF、原生列印還原，再次列印。
3. 辨別風險：UC-313失敗敘述、P-003待查線索；原文／限制／來源及非成功提醒必須出現在離線稿。

Chromium：1440／390，各測UC-005、UC-313、P-003，產生實際A4 PDF。以pdftotext逐個比對原文文字節點和完整URL，再用pdftoppm檢視首末頁。Firefox／WebKit：390、UC-005，檢查print media、原研究及末段可見性、模擬原生事件／取消還原；**沒有宣稱這兩引擎的原生PDF分頁已驗證**。可見列印按鈕以window.print stub觸發beforeprint/afterprint，真正Chromium page.pdf另驗原生事件；沒有操作OS印表機視窗或實體印表機。

這是模擬走查，不代表真人喜好或轉換率提升；axe結果也不等於完整無障礙認證。尚未做Lighthouse／節流效能分數，未捏造載入改善或分數。

最終雲端結果與截圖：待本輪整合run結束後補入。

## 預覽與下一輪

部署後開 https://richardhan.github.io/ai-agent-use-cases/?case=UC-005 ，使用「列印／存成 PDF」。開發預覽：`python3 scripts/preview.py /tmp/ai-print-preview/ai-agent-use-cases`，再`python3 -m http.server 8108 --directory /tmp/ai-print-preview`，進入 `/ai-agent-use-cases/?case=UC-005`。

下一輪最值得做：量測首次與回訪時的全文載入成本，優先改善真實慢網閱讀等待；避免再重做已完成的來源導覽、分類搜尋或列印版面。
