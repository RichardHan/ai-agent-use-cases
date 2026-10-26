# 多詞搜尋空結果：保留情境的逐詞復原

## 問題與決策

對象：首次以問題詞搜尋的訪客。正式站 390px 實測「旅遊 xyz987」為 0/450 筆，空狀態只有改搜常見痛點的捷徑，不能保留「旅遊」意圖。搜尋採 AND 比對；一個多餘詞會讓整組結果消失。

- 方案 A（採用）：在既有空狀態中，僅列出刪去單一詞後確實有結果的候選，保留情境、工具、門檻等所有篩選；成本低，沒有更動搜尋語意。
- 方案 B：改成 OR 搜尋或模糊排序；可擴大召回，但改變既有 AND 及分享連結語意，並可能讓不相干案例混入。此輪不做。

驗收：候選數量取自已載入資料；沒有結果時不顯示虛假候選；點擊或 Enter 更新 URL、保留篩選、聚焦結果摘要；桌面、390px、320px 不水平溢出；詳情直鏈和返回保留搜尋條件。不更動來源、案例計數或收錄資格。

## 實作與走查

`queryRelaxationOptions` 從原始輸入逐一移除一個空白分隔詞，重新套用既有 tokenizer 及所有 facets，只顯示非零候選，最多三個。按鈕用文字節點建立而非注入 HTML。既有單項／多項 facet 復原和常見痛點入口保持不變。

正式站前圖與本地靜態預覽後圖：

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 390px | [前](before-mobile.png) | [後](after-mobile.png) |
| 1440px | [前](before-desktop.png) | [後](after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/ai-usecase-preview && python3 -m http.server 8081 --directory /tmp/ai-usecase-preview`，開啟 `http://127.0.0.1:8081/?q=旅遊%20xyz987`。Pages 發布後使用既有 `/ai-agent-use-cases/` base path。

三種模擬情境（非真人研究）：
1. 手機搜尋「旅遊 xyz987」：0/450 → 移除 `xyz987` 候選顯示 33 筆；點擊後 `?q=旅遊`，焦點到 `#results-count`。
2. 手機同時選「生活」：候選 20 筆；點擊後仍為「生活」，詳情 UC-001 直鏈帶 `case=UC-001`，返回後仍為 20 筆。
3. 桌面同一組搜尋與情境：20 筆候選；來源指向 GitHub 原始 Markdown；Escape 返回搜尋。320px 與 1440px 的文件寬度均不超過視口。單一未知詞不提供逐詞建議。

## 驗證與限制

- `node --check assets/app.js && node --test tests/*.test.cjs`：350 通過，0 失敗。
- `python3 scripts/check_corpus_bundle.py /tmp/ai-usecase-multiterm-preview`：448 個來源 byte-for-byte 相同。
- 瀏覽器直接開啟本地靜態預覽及正式站，手機與桌面前後比較；本地搜尋、組合條件、詳情、返回、來源 href、320px 水平寬度均實測。
- Playwright CLI 的本機依賴缺少 `playwright`，既有 `tests/search-recovery-browser.cjs` 新增的自動化旅程未能在此環境執行；改以真實 Chromium 手動操作驗證，CI 仍會執行該腳本。未對效能或 Axe 評分作無數據宣稱。
- 下一輪優先：核對 WebKit 390px 詳情工具列逆向鍵盤焦點（既存 QA artifact 曾見 Shift+Tab 落在 dialog），先重現再決定是否修改。
