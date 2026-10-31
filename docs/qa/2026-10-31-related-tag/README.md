# 依共同標籤探索延伸閱讀

目標讀者：已找到案例、想比較相近做法後返回搜尋的人。基準 `8a4a873` 的 Pages 相容預覽中，搜尋「旅遊」打開 UC-001：原先只有同分類的 UC-099 旅行紀念冊與 UC-139 失物搜尋；同結果中的 UC-286 列車房型價格與空位監看，與 UC-001 共用「旅遊、比價」，因分類不同而未列出。

兩案：A 在目前搜尋結果內優先列至少兩個不同共同標籤，再補同分類，明示原因（選用）；B 按共同來源顯示候選，利於核對但來源相同不等於任務相近，且須處理更複雜的來源關聯。本輪不修改搜尋、來源、案例資料或證據狀態；推薦不是成效或證據排名。

修改後 UC-001 先顯示 UC-286，並列出共同標籤；同分類回退、最多三筆、目前結果範圍、返回與來源類型保留。共同標籤未必代表相同任務，例如「每日、排程」可能關聯不同用途；文案要求讀者核對內容。結果次序仍遵循當前搜尋排序，不按共同標籤數排序。後續可先稽核通用標籤與資料品質，再考慮更細緻的相關性策略。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 1440px | [預覽](before-desktop.png) | [預覽](after-desktop.png) |
| 390px | [預覽](before-mobile.png) | [預覽](after-mobile.png) |

預覽：`python3 scripts/preview.py /tmp/related-preview/ai-agent-use-cases`，`python3 -m http.server 8081 --directory /tmp/related-preview`，訪問 `http://127.0.0.1:8081/ai-agent-use-cases/`。此預覽不是正式 Jekyll 建置。

先新增回歸測試：修改前 `node --test tests/related.test.cjs` 為 3 通過、1 失敗，缺少 UC-286；修改後 4 通過。完整 `node --test tests/*.test.cjs`：387 通過、0 失敗；`node --check assets/app.js` 與預覽生成成功。`RELATED_URL=http://127.0.0.1:8197/ai-agent-use-cases/ node tests/related-browser.cjs`：Chromium 1440、390、320px，相關閱讀、返回、長文直鏈、空結果、載入恢復等 21 次 axe 掃描均為 0 違規；單次本機載入分別 708、593、600ms，非效能基準或真實網路保證。

三種模擬情境：旅遊搜尋→UC-001→UC-286→Escape 返回並保留查詢和焦點；旅遊＋Grok Bot→UC-001 直鏈重新整理→來源區→返回並保留條件；無候選或空結果時閱讀說明及調整條件（後兩者含瀏覽器回歸）。模擬不代表真人偏好。獨立唯讀程式審查未發現阻擋問題。未驗證新推薦在 Firefox、WebKit、實體手機或螢幕閱讀器；未測外部來源當下內容。

Actions：最新基準 main 所查執行成功。歷史 Facet counts [#191](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41153712327) 的 `page-context-browser.cjs` WebKit 記錄 `Context is stopped`，後續同工作流程執行成功；原因未確認，不將它歸因於產品程式。另有 Pages 發布等待逾時的歷史失敗，現有基準已採較長且比對版本的等待機制。
