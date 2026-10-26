# 日報與會議入口分開呈現

目標：第一次從首頁或常用搜尋找會議整理案例的訪客。正式站 390px 的「日報與會議」連結實際送出 `q=日報`，顯示 64／452 筆；輸入「會議」則為 23／452 筆。單一入口暗示兩種任務，實際只執行其一；搜尋是全文及相關詞匹配，不代表所有命中都完成該任務。

## 方案與範圍

- A（採用）：將首頁與篩選面板的混合標籤拆成「日報整理」與「會議整理」，分別送出 `日報`、`會議`。改動只涉及入口與說明，不更動搜尋演算法或案例資料；代價是多一個 44px 入口。
- B：維持單一入口，讓搜尋支援日報 OR 會議。入口較少，但改變目前多詞 AND 模型、排序及分享語意，成本與誤命中風險較高。

驗收：兩入口的可見承諾、URL、搜尋欄一致；會議結果非空；面板入口保留情境篩選；日報入口仍可使用；320/390/1440px 無橫向溢出、鍵盤可達，空結果／詳情／返回不退化。非本輪：語意搜尋、案例內容核實、全站重新設計及 Actions 歷史失敗整治。

## 修改前後

| 視口 | 修改前 | 修改後 |
|---|---|---|
| 390px | [混合標籤](before-mobile.png) | [分開入口](after-mobile.png) |
| 1440px | [混合標籤](before-desktop.png) | [分開入口](after-desktop.png) |

截圖範圍為相同首頁入口區。預覽：`python3 scripts/preview.py /tmp/ai-visitor-after && python3 -m http.server 8101 --directory /tmp/ai-visitor-after`，開啟 `http://127.0.0.1:8101/`。正式站與本地預覽是不同部署版本，僅比較入口標示。

## 驗證

- 基準：`node --test tests/*.test.cjs` 為 356 通過；450 來源逐 byte 一致。新增瀏覽器測試在修改前失敗：`'日報' !== '會議'`。修改後 `node --test tests/*.test.cjs` 為 353 通過、0 失敗（刪去三項只鎖定文案或按鈕清單的舊測試）；`HERO_VALUE_URL=http://127.0.0.1:8101/ NODE_PATH=/tmp/ai-browser-tools/node_modules node tests/hero-value-browser.cjs` 三情境通過；`for file in assets/*.js tests/*.cjs; do node --check "$file" || exit; done` 通過；`python3 scripts/check_corpus_bundle.py /tmp/ai-visitor-after` 為 450 來源逐 byte 一致。本地沒有專用 lint/type-check；Python preview 為 Pages 相容建置替代，未執行 Jekyll build。
- 修改後：390px 點「會議整理」得到 23／452、`?q=會議`、無橫向溢出；工作情境組合後為 17／452；不存在詞為 0／452 並提供回復選項。UC-094 詳情來源指向公開 GitHub Markdown，Escape 返回保留 `會議` 與工作篩選。1440px 日報仍為 64／452；UC-094 帶條件直鏈重載後可讀、詳情未溢出，焦點落在標題，關閉後保留搜尋。這些是模擬走查，非真人偏好或轉換效果。
- 三種情境：① 新訪客從首頁找會議；② 工作使用者切換面板任務並保留情境；③ 日報使用者沿原入口閱讀後返回。Chrome browser QA 覆蓋 1440、390、320px。
- Chromium 390px 的 axe WCAG 2 A/AA、2.1 AA 掃描為 0 violations、24 passes；這不是完整人工無障礙驗證。獨立 reviewer 靜態檢查變更，未發現功能、Pages base path、可及性或資料外洩退化。新增入口沿用既有焦點樣式及 44px 觸控高度，未新增追蹤或請求。

限制：搜尋結果仍可因全文或來源命中而非真正會議整理案例，應閱讀方法、限制與來源。正式 Pages 部署與 Actions 結果需合併後核對。下一輪優先處理搜尋結果的命中理由／任務相關性，避免全文命中被誤認為可執行做法。
