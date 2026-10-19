# 2026-10-19：從用途直接抵達方法

目標讀者是已理解用途、想核對怎麼做的新訪客。正式站雲端走查 UC-338，既有「方法與步驟」入口在桌面 1440×1000 的 y=1451、390×844 的 y=2314、320×740 的 y=2856，來源紀錄與證據說明完整保留但入口難找。[基準 QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39207618857)／[原始量測](baseline.json)。320px數據採後續同尺寸基準重測，最初320×844為2861px。

方案 A：用途後加單一方法入口，逐字顯示原章節標題；低成本、保留原閱讀順序，採用。方案 B：整組四格導覽前移；低成本，但手機的大塊導航延後正文。獨立設計角色也推薦 A。

驗收：桌面與390px入口在詳情首屏；320×740 保留完整用途、允許入口在一小段捲動內（詳情底部180px內），不截短正文或「未實測」原標題。Enter 開啟原始研究並聚焦正確章節，目標在工具列下；URL、history與底層頁面位置不變。待查或無方法不製造入口。既有來源、安全文字、長文、網路失敗重試、搜尋、空結果、分享、返回均回歸。

未改：原始案例、證據分類、兩種計數、搜尋語意、框架、資料傳送與儲存；無新增前端依賴或第三方服務。

## 環境與基準

主對話僅知 GPT-6 系列，無可核實實際模型／推理設定及切換介面，未聲稱最高設定。獨立設計與審查角色明確指定可用 `gpt-6-astra / max`。主角色單一整合、獨立角色不修改程式。正式驗收採用 GitHub Actions 雲端結果，瀏覽器與套件安裝只在 runner 執行；未操作個人電腦 GUI 或使用付費 API。獨立審查曾誤在本機執行11項只讀單元測試，未安裝套件或瀏覽器；確認限制後已停止，該結果不列入雲端驗收。

基準 main／origin/main 均 `2bb03a2`，乾淨，無開啟 PR；保留所有其他工作樹，fetch後建獨立分支。repo與祖先無適用AGENTS.md，依 README、SITE.md、既有QA規範。GitHub CLI為EMU身分，直接merge／SSH push已獲使用者授權，不宣稱有PR核准。

基準66/66測試通過，JS syntax與Python靜態預覽成功。沒有獨立lint、TypeScript或npm build。修正前新增三個單元全部失敗（缺少選取函式），原66項仍通過：[先測後修證據](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39207669458)。預覽不是正式Jekyll。

## 截圖與預覽

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面 | [1440px](before-desktop.png) | [1440px](after-desktop.png) |
| 手機 | [390px](before-mobile.png) | [390px](after-mobile.png) |

預覽可於已授權雲端環境執行 `python3 scripts/preview.py /tmp/method-preview/ai-agent-use-cases`，再 `python3 -m http.server 8095 --directory /tmp/method-preview`，網址保留 `/ai-agent-use-cases/?case=UC-338`。正式入口：[案例詳情](https://richardhan.github.io/ai-agent-use-cases/?case=UC-338)。

## 驗收指令

`node --test tests/*.test.cjs`、`for file in assets/*.js; do node --check "$file"; done`、Python靜態預覽。雲端安裝既有Playwright及axe工具後，執行 `node tests/method-shortcut-browser.cjs`，並以 `READING_URL`／`READER_URL` 指定預覽執行 `tests/reading-flow-browser.cjs`、`tests/reader-browser.cjs`。完整工作流程見 `.github/workflows/method-shortcut-qa.yml`。

三個模擬情境：旅遊搜尋＋生活篩選後閱讀返回／空結果恢復；UC-338分享直鏈前往方法＋返回導覽＋重整；待查線索不被包裝成可用方法。模擬不是真人偏好或轉換率證據。

未檢查實體手機、螢幕閱讀器或Lighthouse；axe不等於整站無障礙認證。下一輪優先測量並改善全庫首次搜尋就緒成本，本輪不延伸做另一個載入重構。


## 雲端驗收與獨立審查

[完整 QA 39208031043](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39208031043)成功：69/69 tests、JS syntax、靜態預覽，方法快捷＋既有 reading-flow／reader 全部通過。Chromium 1440×1000／390×844／320×740，Firefox／WebKit 390×844。新增5次與既有30次axe掃描共35次，零WCAG A/AA自動規則違規；不是無障礙認證。

UC-338入口：桌面1451→444px、手機2314→595px；320×740由2856→693px，按鈕底763px，詳情底約703px，因此約需再捲60px完整顯示。這是相同內容的螢幕位置，不是效能或轉換率。[原始量測](verification.json)／[320初始閱讀](after-small-mobile.png)／[320方法落點](method-small-mobile.png)。

全庫348筆、2397章節、367證據列完整對應；202筆來源原段提前呈現，146筆保留全文入口，未截短來源或段內限制。[全庫結果](reader-corpus.json)／[完整閱讀流程](reading-verification.json)。保留缺來源、網路503與重試、可選reader載入失敗、分享權限拒絕與安全文字回歸。

中間一次修後驗收因axe要求明確browser context失敗；已修正測試工具設定，以上採成功完整重跑結果，沒有把該次失敗忽略或當通過。獨立角色只讀審查程式、測試、工作流程、實際桌面／手機前後圖與雲端JSON，結論無剩餘必修。主程式安全使用textContent、原標題索引及既有modal-only scroll，不新增外傳資料。

變更：`assets/reader.js`方法選取及入口、`assets/reader.css`輕量排版、`tests/method-shortcut.test.cjs`三項選取回歸、`tests/method-shortcut-browser.cjs`三情境跨引擎、`.github/workflows/method-shortcut-qa.yml`雲端與發布驗收，及SITE／本QA紀錄。最後補存320入口截圖與正式發佈結果將續記。


[最終QA39208179276](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39208179276)完整成功，涵蓋最終程式／測試（ce55961，後續僅紀錄），重跑69項測試、方法快捷、reading-flow與reader。另保存[320px實際聚焦入口](shortcut-small-mobile.png)，完整顯示未實測限定。
