# 全文命中的限制與來源提醒

正式站搜尋「薪水」有 10 筆；UC-007 的命中字詞在「權限、費用與可用性」，UC-387 在「來源A」，但原卡片只標示搜尋命中。目標是依問題找做法的新訪客，不把限制或來源的文字提及誤當成可採用流程。搜尋命中仍不能證明適用性。

- A：重建欄位化搜尋與排序，優先流程命中；代價是改變召回和排名，需更廣泛的資料驗證。
- B（採用）：保留召回、排名與原文，對第一個命中位於「限制／風險／注意／缺口／權限」或「來源／參考／連結」標題下的節錄加精確提醒，詳情頂部保留查詢脈絡。成本低，不宣稱判斷語意。

不處理否定句的語意辨識（例如別的標題下「不算薪資」）、資料編修或證據等級推定。驗收：限制與來源節錄有提醒，標題／用途／方法無誤警；結果數及 URL 不變；手機與桌面無溢出；直鏈、返回、組合篩選與空結果可用。

| 尺寸 | 修改前正式站 | 修改後本機預覽 |
|---|---|---|
| 390×844 | [UC-007 無提醒](before-390.png) | [UC-007 明示限制命中](after-390.png) |
| 1440×900 | [UC-007 無提醒](before-1440.png) | [UC-007 明示限制命中](after-1440.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-caution/ai-agent-use-cases && python3 -m http.server 8117 --directory /tmp/visitor-caution`，開啟 `http://127.0.0.1:8117/ai-agent-use-cases/?q=薪水#explore`。截圖以 UC-007 的命中區為對齊點；正式站與預覽均 10/452。

驗證：先新增回歸測試並觀察 1 fail（缺少 caution），修正後 `node --test tests/search-context.test.cjs` 5 pass；全套 `node --test tests/*.test.cjs` 354 pass、0 fail（修改前 353 pass）；所有 `assets/*.js`、`tests/*.cjs` 均通過 `node --check`；`scripts/check_corpus_bundle.py` 確認預覽的 450 份來源逐 byte 相同。Chromium 預覽 390px 實測 UC-007 卡片與詳情提醒、Escape 返回、UC-387 來源提醒、組合工作＋進階門檻 0 筆、無結果狀態及帶 `case=UC-007` 的直鏈；無水平溢出。桌面與手機已擷取比較圖。獨立 reviewer 未發現此次變更的可操作退化；未執行本機 Jekyll build（環境無 `jekyll` 命令）。

三種模擬走查：① 搜尋薪水後辨別 UC-230 標題命中與 UC-007 限制命中；② 搜尋結果開詳情、來源原文、Escape 返回；③ 組合篩選與無結果再直鏈進入 UC-007。僅為流程檢查，不是使用者轉換率或喜好證據。`origin/main` 最近 38 checks 中 14 項失敗，已知 Website QA 有 Pages 發佈競速；其餘瀏覽器失敗缺少可讀 assertion，不能視為本輪修復。下一輪優先定位這批主分支瀏覽器 QA 的具體斷言與部署時序。
