# 2026-10-22 任務快選直接看結果

狀態：產品完成，雲端與獨立審查進行中；發布前更新最終結果。

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
| 桌面1440 | [看不到結果](before/desktop.png) | 驗收後補 |
| 手機390 | [停留篩選面板](before/mobile.png) | 驗收後補 |

尚待雲端最終結果、獨立review與正式發布核對。未量測Lighthouse或速度提升，未驗證實體手機、真人留存與完整輔具認證。下一輪候選：以真實結果校準任務標籤的範圍（如「每日」全文也會命中每日配額限制），避免把全文命中當成任務實作證據。
