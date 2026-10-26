# 搜尋命中範圍：全文與標題／用途

目標：第一次從任務捷徑找做法、需要排除偶然提及的訪客。正式站搜尋「會議」顯示 23 筆，其中 UC-020 的標題是「用一張設計範本，做出整批一致的卡片」，會議只在後續原文中提及；卡片雖有命中理由，仍須逐筆辨識。預期讓訪客保留全文召回，必要時快速縮小可讀清單。文字命中不等於案例已實作、驗證或真正解決查詢問題。

## 方案與範圍

- A（採用）：在結果上方提供「只看標題與用途命中」，每個查詢詞及其既有相關詞都必須出現在同一案例的標題或用途（可分散於兩欄）。預設仍為全文；URL、分享連結、詳情直鏈、篩選和空結果回復保留此選擇。成本是增加一個範圍控制及其狀態維護。
- B：直接把全文命中從搜尋結果排除。介面較簡單，但會遺漏標題與用途沒有寫出任務、只在流程中描述做法的條目；不採用。

驗收：會議全文 23 筆、收窄 9 筆；組合情境仍可用；空結果提示的承諾筆數等於按下後的實際筆數；詳情直鏈重載與 Escape 返回保留範圍；手機／桌面可操作、無橫向溢出、鍵盤焦點可見。非本輪：人工判定任務真正相關性、語意搜尋、案例或來源真實性核實、全站改版。

## 修改前後

| 視口 | 修改前（全文） | 修改後（收窄） |
|---|---|---|
| 390px | [23 筆](before-mobile.png) | [9 筆及範圍控制](after-mobile.png) |
| 1440px | [23 筆](before-desktop.png) | [9 筆及範圍控制](after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/ai-search-scope-after && python3 -m http.server 8107 --directory /tmp/ai-search-scope-after`，開啟 `http://127.0.0.1:8107/?q=會議#explore`。本地預覽不是正式 Jekyll build。

## 驗證

- 修改前 `node --test tests/*.test.cjs`：353 通過；新瀏覽器測試修改前因找不到開關而失敗。修改後 `node --test tests/*.test.cjs`：353 通過、0 失敗；`NODE_PATH=/tmp/ai-browser-tools/node_modules SEARCH_SCOPE_URL=http://127.0.0.1:8108/ai-agent-use-cases/ node tests/search-scope-browser.cjs`：1440／390px 均通過，會議 23→9 筆，涵蓋組合情境、空結果、實際複製分享網址、詳情直鏈重載、Escape 返回及回復承諾筆數。`python3 scripts/check_corpus_bundle.py /tmp/ai-search-scope-after`：450 來源逐 byte 一致；JS 語法檢查通過。此 repo 無獨立 lint 或 type-check；未在本機執行 Jekyll build。
- Chromium 兩視口 axe WCAG 2 A/AA、2.1 AA 掃描均無 violations；這不是完整人工無障礙驗證。390px 組合工作情境為 8／452，無結果時提示可回復，UC-094 詳情來源在瀏覽器開啟公開 GitHub Markdown 頁，返回後範圍與條件保留；無橫向溢出。另在 `/ai-agent-use-cases/` 子路徑預覽通過相同瀏覽器測試。
- 三種模擬情境：① 首訪者找會議做法，由全文轉為標題／用途；② 工作使用者組合情境、讀來源後返回；③ 無結果使用者選回復建議。這不是實際使用者評價或轉換率證據。
- 獨立 reviewer 發現組合空結果回復曾忽略範圍並誤報筆數；已改為以原查詢詞及保留範圍計數，並加入瀏覽器回歸。

風險：標題與用途的文字命中仍可能只表示背景或限制，不是可採用方案；搜尋相關詞可能擴大匹配。下一輪優先用可核對的內容欄位區分真正流程與僅提及，不將文字命中冒稱成果。正式 Pages 發布與 Actions 需合併後核對。
