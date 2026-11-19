# 2026-11-17 主題分類形狀說明跟著選單

## 問題

正式站 `8a7a26a1` 把「不是共用主題清單」寫在 `#facet-count-hint` 末尾。320×640 載入後 `#category` 不在第一屏（文件座標 4,953px；篩選 `<details>` 在 ≤760px 預設收合）。打開篩選並把選單捲到視窗中央後，說明段底部在視窗外 **-99px**，選單看得到、說明看不到。390×844 同一狀態只剩說明段底部 3px。形狀句本身只佔說明段 88px（508→420），拿掉它也不會把選單拉進第一屏。

目標使用者：窄螢幕上打開「主題分類」、需要知道這些選項是各頁分類原文而不是共用清單的人。

## 方案

- 採用：同一句仍由已載入條目重算，改放到選單正下方的 `#category-shape`，並從長段說明移除，避免兩處各說一次。`aria-describedby` 先指向這句，再指向其餘篩選說明。
- 不採用：只縮短長段、句子仍留在選單上方。320px 把選單捲進視窗時，上方說明仍然整段在視窗外。

## 量測

同一句、無水平溢出。對比以 `#4c6258` 對 `--paper #f7f8f2` 計算，元素背景是透明，頁面背景是 `--paper`。

| 尺寸 | 改前：選單在視窗內時說明 | 改後：說明相對選單 | 溢出 | axe（`#filters`） |
| --- | --- | --- | --- | --- |
| 320×640 | 說明底 -99px，完全在視窗外 | 選單底 354px，說明 370–480px，高 110px | 無 | 0 |
| 390×844 | 說明底 3px | 選單底 456px，說明 472–561px，高 88px | 無 | 0 |
| 1440×900 | 說明與選單同屏 | 選單底 484px，說明 500–522px，高 22px，寬 1,202px | 無 | 0 |

對比 6.15:1。改前截圖 `before-*-select.png`（正式站）。改後 `after-*-select.png`（preview）。

## 驗收

- 正式站紅測：`CATEGORY_SHAPE_URL=https://richardhan.github.io/ai-agent-use-cases/ node tests/category-shape-browser.cjs` exit 1（沒有 `#category-shape`）。
- preview `http://127.0.0.1:8097/ai-agent-use-cases/`：同一支測試 320／390／1440 exit 0；`declared-category-browser.cjs` 1440／390 exit 0（362／361，篩選「工作流程／發布期用途」6 筆，axe 0）。
- `node --test tests/*.test.cjs`：**913 pass／0 fail**（基準同數；新檢查是瀏覽器測試，不在 `*.test.cjs`）。`node --check assets/app.js` 通過。
- 三情境（preview，320／390／1440）：「會議整理」29／532；`?q=發票&tool=Cursor&scenario=學習` 為 0／532，移除 Cursor 後 1／532 且情境仍在；`?case=UC-016` 有成果主張與核讀，來源指向 `8a7a26a1`，Escape 後對話關閉。pageerror 0、無水平溢出。

## 限制

preview 不是 Jekyll。未用實體手機、讀屏、Firefox／WebKit。影像未逐像素目視；結論來自動態幾何、文字與 axe。正式站發布收據見 PR 留言。
