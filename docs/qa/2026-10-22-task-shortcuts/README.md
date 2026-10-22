# 2026-10-22 任務快選直接看結果

狀態：預覽驗收通過；正式發布核對另於文末補記。

## 問題證據與目標

[正式站基準39720091474](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39720091474)於Chromium1440／390／320、900px高走查首頁、四任務、旅遊＋生活、詳情與返回；完整數據見[baseline.json](checks/baseline.json)。四任務點擊後，結果數全部在畫面外：桌面y=909–948、390px約1437、320px約1560；焦點留在任務按鈕。已目視桌面／手機截圖，不以程式推測冒充走查。

目標訪客：知道想找的任務、點選常見任務期待開始閱讀的人。改為一次操作抵達可見結果，減少自行捲過篩選面板的步驟；未量測真人偏好或轉換率。

方案A：四個關鍵字任務沿用既有搜尋提交的結果定位機制。成本為小幅事件調整、提示文案與跨狀態驗收；直接解決看不到結果，但切換後需往上回到面板再改其他條件。

方案B：增加「查看結果」提示或額外動作。產品變更較少，適合連續組合篩選，但仍需另一步，且重複已有搜尋提交。選A，保留面板原有展開狀態，不自動收合。

驗收：四任務／再次取消，結果數與首卡可見、鍵盤Enter／Space、組合條件及排序保留、空結果可恢復、詳情來源／返回、直鏈重整、載入與錯誤不搶焦點、部分補讀可用、三引擎及320px無水平溢出。

本輪不處理：搜尋語意／排名、案例編輯、證據分類、合格數、內容去重、整站載入成本、情境與經驗kind快捷入口。原始資料保持單一來源，不新增追蹤、cookie、第三方產品請求或儲存。

## 環境與實作

原工作目錄`improve/search-recall-recent-workflows-and-tokenization`有`assets/app.js`、`tests/search.test.cjs`未提交修改，完整保留；基準為fetch後`origin/main`的`56c03c9`，使用隔離工作樹`/tmp/ai-reader-links-20261022`及`improve/task-shortcuts-20261022`。原有研究PR #76未混入本輪。找不到適用AGENTS.md；讀取README、SITE及近期維護紀錄，遵循GitHub Pages legacy/main根目錄Jekyll部署。

本機Codex設定顯示`gpt-6.1-sol / medium`，這只是預設，無法核實或切換主對話runtime，沒有宣稱已使用最高模型。使用OpenAI Docs技能與[官方設定參考](https://developers.openai.com/codex/config-reference)確認設定文件；獨立角色透過既有協作工具請求`gpt-6-astra / ultra`，不等同runtime證明。主角色單一整合，獨立角色只讀。瀏覽驗收在授權GitHub Actions雲端執行；未使用個人GUI或另付費API。曾檢查現有本地Playwright可啟動後立即關閉，未用其操作個人應用程式。

- `assets/app.js`：query任務切換後阻止晚到自動導入；ready時重用有界兩幀、可中止的`focusLoadedResults('start')`。載入或錯誤不排程跳轉，選擇仍保留；既有情境與kind事件不變。
- `index.html`：可見說明任務取代關鍵字、保留其他條件、再次取消及載入時保留；四按鈕aria-describedby一致。
- `tests/task-shortcuts.test.cjs`：執行真實delegated listener，檢查四字詞、取消、其他狀態保留、未ready不移焦及原有入口行為；舊task-entry測試只補必要fixture。
- `tests/task-shortcuts-browser.cjs`與workflow：雲端五配置、三個具體情境、axe及載入生命週期；不增加產品依賴。

## 指令與結果

基準`node --test tests/*.test.cjs`：161/161通過。先新增重現測試再實作，舊程式新測試3失敗／1通過（[red](checks/local-red.log)）；修後165/165通過（[green](checks/local-green.log)）。

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
git diff --check
python3 scripts/preview.py /tmp/task-shortcuts-preview/ai-agent-use-cases
python3 -m http.server 8134 --directory /tmp/task-shortcuts-preview
NODE_PATH=<雲端工具目錄>/node_modules node tests/task-shortcuts-browser.cjs
```

本機全部JS語法、diff、preview build通過；無獨立lint、TypeScript或npm build。preview模擬Liquid清單，不等同正式Jekyll。預覽網址`http://127.0.0.1:8134/ai-agent-use-cases/`。

## 截圖與限制

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440 | [看不到結果](before/desktop.png) | [直接讀結果](after/desktop.png) |
| 手機390 | [停留篩選面板](before/mobile.png) | [直接讀結果](after/mobile.png) |

未量測Lighthouse或速度提升，未驗證實體手機、真人留存與完整輔具認證。下一輪候選：以真實結果校準任務標籤的範圍（如「每日」全文也會命中每日配額限制），避免把全文命中當成任務實作證據。

## 雲端預覽驗收

[最終39720692991](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39720692991)全套成功，checkout `0df282c`，產品程式從`d56684f`起未再變動。165單元、全JS語法、diff、preview build及舊版3 red／1 pass通過；三引擎五配置（Chromium1440／390／320、Firefox390、WebKit390）本輪20次任務操作，結果數y=23.50–24.49px、首卡可見，任務筆數98／120／44／200與正式站基準相同。主流程要求failedPaths=0，415條目均完整。10次主要axe WCAG A/AA自動掃描均零違規，pageerror全空；不是完整無障礙認證。

[報告](checks/preview-report.json)、[載入生命週期](checks/preview-lifecycle.json)、[320px說明截圖](after/hint-320.png)。原reader與search-submit跨三引擎五配置全部通過；[提交報告](checks/submit-report.json)包含Tab順序、五篩選／排序、URL與歷史、組字保護、來源Markdown HTTP200等既有回歸。合成IME不代表原生輸入法測試。

三種具體模擬走查：
1. 每日／收件匣／比價／排程快選 → 可見結果與首卡 → 再按取消；Enter和Space、面板狀態、長標題與320px均通過。
2. 工作＋Grok Bot＋最近核對 → 收件匣 → 詳情來源 → Escape回同一卡按鈕 → 直鏈及重新整理，保留查詢、條件、排序與結果次序。
3. 待查＋官方自報的互斥條件 → 比價 → 可見空結果 → 修改關鍵字聚焦 → 清除全部恢復；載入中／失敗只保留任務、不排程搶焦點，部分補讀成功後仍保留任務。

以上是自動化模擬，未宣稱真人滿意度。桌面實開UC-035 Reddit來源新頁，URL正確但外站HTTP403，無法驗證其內文；未把403算成來源可讀或獨立驗證。其他尺寸核對同一href。既有submit回歸另開原始Markdown取得HTTP200，兩者不同不可混用。

[原文完整性](checks/reader-corpus.json)：415條目、3041節、434行頁首證據。[實際時間](checks/reader-timings.json)：雲端同機靜態server五配置DOMContentLoaded31–70ms、load66–136ms；不是正式網路速度、全文就緒時間或效能改善，也沒有Lighthouse分數。

中間驗收保留：[39720433592](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39720433592)雖成功，但search-submit錯設SITE_URL而腳本讀SUBMIT_URL，該回歸實際測正式舊站，不計新版通過。獨立審查與主角色均抓到後修正；[39720582067](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39720582067)正確preview回歸成功；最終run再增加完整載入斷言及hint圖後成功。未為消耗額度更動產品。曾嘗試取消被新run取代的舊CI，但GitHub API回403無admin權限；未繞過權限，保留完成結果。

驗收期間協作者合併研究PR #76與兩份研究補充；正常merge最新main到`075cdcc`，無衝突，保留UC-418–421及全部協作者內容。整合後[165單元](checks/integrated-unit.log)、preview build與diff再次通過；預覽報告415筆屬舊資料集，正式部署另驗整合後資料，不假稱兩者同一版本。

## 獨立審查

未負責主實作的角色以只讀方式審查產品diff、工作流程、原文資料與隱私影響，獨立跑17項相關單元檢查；目視桌面／390／320結果及手機hint圖，核對最終預覽報告與回歸。結論「可合併，未發現阻擋問題」。已修正其發現的SUBMIT_URL設定並補完整來源斷言／hint截圖；沒有新增傳送、儲存或依賴。保留Reddit403、實體手機／完整輔具與效能提升未驗證等限制；正式部署需完成後才宣稱發布。
