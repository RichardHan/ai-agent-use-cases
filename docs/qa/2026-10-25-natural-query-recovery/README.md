# 白話問句空結果：優先提示原問題中的任務

## 問題、方案與範圍

目標：第一次以日常語句尋找會議整理案例的訪客。正式站 390px 輸入「我想整理會議記錄」得到 0／452；搜尋「會議」得到 23 筆，「會議 記錄」得到 8 筆。原空結果先列郵件、日報等通用任務，沒有與問句直接對應的會議捷徑。這不是語意理解，也不代表 23 筆都是會議記錄案例。

- A：直接將少數完整問句映射為關鍵字。成本低，但需持續維護脆弱的特殊字串，可能意外改寫精確查詢。
- B（採用）：空結果中加入已驗證有結果的「會議」捷徑，當原查詢包含現有任務字詞時排在前面；其餘捷徑維持原順序。只調整可見復原入口，點擊才改寫查詢，原文字、URL 與篩選在點擊前不動。成本為一個小型排序函式與一項行為測試。

驗收：無結果時原問句對應捷徑優先；點擊後產生真實結果、保留情境／其他篩選，分享 URL 可重載；與任務無關的查詢不改變原順序；無可用捷徑時沿用重設指引；手機與桌面沒有橫向溢出。非本輪：中文分詞、全站語意搜尋、來源內容或證據重新分類。

## 比較與預覽

| 視口 | 修改前正式站 | 修改後本地預覽 |
|---|---|---|
| 390×844 | [空結果](before-mobile.webp) | [會議優先](after-mobile.webp) |
| 1440×900 | [空結果](before-desktop.webp) | [會議優先](after-desktop.webp) |

`python3 scripts/preview.py /tmp/ai-visitor-query-preview && python3 -m http.server 8765 --directory /tmp/ai-visitor-query-preview`，開啟 `http://127.0.0.1:8765/`，輸入「我想整理會議記錄」。正式站與本地預覽截圖在不同部署版本取得；比較限於相同查詢的空結果區。

## 驗證

- 修改前 `node --test tests/natural-query-recovery.test.cjs` 因 `prioritizeProblemTags is not defined` 失敗；修改後通過。
- 基準 `node --test tests/*.test.cjs`：355 passed、0 failed；修改後 356 passed、0 failed。`for file in assets/*.js; do node --check "$file" || exit; done` 通過；`python3 scripts/check_corpus_bundle.py /tmp/ai-visitor-query-preview`：450 個來源逐 byte 一致。
- 實際 Chromium 靜態預覽 390px：空結果首個按鈕「會議整理 · 搜尋『會議』」，點擊後 23／452，網址 `?q=會議`；UC-094 詳情可開啟、Escape 返回保留查詢，來源連結指向公開 GitHub 原始 Markdown。工作情境加上原問句為 0 筆，捷徑點擊後保留工作篩選並得 17 筆。390px 與 1440px `scrollWidth === innerWidth`。此為模擬流程，非真人偏好或轉換效果。
- 三種情境：① 新訪客以完整問句找會議案例，從首個捷徑進入；② 工作篩選使用者保留條件後復原；③ 無相關任務詞的未知查詢仍按固定常見任務順序，只有已載入且在篩選內有結果的捷徑顯示。

限制：本地沒有 Jekyll 可執行檔，不能直接驗證正式 Pages 的 Jekyll build；正式部署後仍需檢查 Actions。下一輪優先調查中文口語問句的可解釋分詞，先以真實查詢失敗樣本評估召回與誤命中，不增加臆測來源。
