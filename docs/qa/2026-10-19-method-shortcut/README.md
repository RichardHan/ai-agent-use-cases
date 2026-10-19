# 2026-10-19：從用途直接抵達方法

目標讀者是已理解用途、想核對怎麼做的新訪客。正式站雲端走查 UC-338，既有「方法與步驟」入口在桌面 1440×1000 的 y=1451、390×844 的 y=2314、320×844 的 y=2861，來源紀錄與證據說明完整保留但入口難找。[基準 QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39207618857)／[原始量測](baseline.json)。

方案 A：用途後加單一方法入口，逐字顯示原章節標題；低成本、保留原閱讀順序，採用。方案 B：整組四格導覽前移；低成本，但手機的大塊導航延後正文。獨立設計角色也推薦 A。

驗收：桌面與390px入口在詳情首屏；320×740 保留完整用途、允許入口在一小段捲動內（詳情底部180px內），不截短正文或「未實測」原標題。Enter 開啟原始研究並聚焦正確章節，目標在工具列下；URL、history與底層頁面位置不變。待查或無方法不製造入口。既有來源、安全文字、長文、網路失敗重試、搜尋、空結果、分享、返回均回歸。

未改：原始案例、證據分類、兩種計數、搜尋語意、框架、資料傳送與儲存；無新增前端依賴或第三方服務。

## 環境與基準

主對話僅知 GPT-6 系列，無可核實實際模型／推理設定及切換介面，未聲稱最高設定。獨立設計與審查角色明確指定可用 `gpt-6-astra / max`。主角色單一整合、獨立角色不修改程式。瀏覽器、測試及套件安裝僅在既有 GitHub Actions runner 執行，沒有操作個人電腦 GUI 或使用付費 API。

基準 main／origin/main 均 `2bb03a2`，乾淨，無開啟 PR；保留所有其他工作樹，fetch後建獨立分支。repo與祖先無適用AGENTS.md，依 README、SITE.md、既有QA規範。GitHub CLI為EMU身分，直接merge／SSH push已獲使用者授權，不宣稱有PR核准。

基準66/66測試通過，JS syntax與Python靜態預覽成功。沒有獨立lint、TypeScript或npm build。修正前新增三個單元全部失敗（缺少選取函式），原66項仍通過：[先測後修證據](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39207669458)。預覽不是正式Jekyll。

## 截圖與預覽

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面 | [1440px](before-desktop.png) | 待驗收 |
| 手機 | [390px](before-mobile.png) | 待驗收 |

預覽可於已授權雲端環境執行 `python3 scripts/preview.py /tmp/method-preview/ai-agent-use-cases`，再 `python3 -m http.server 8095 --directory /tmp/method-preview`，網址保留 `/ai-agent-use-cases/?case=UC-338`。正式入口：[案例詳情](https://richardhan.github.io/ai-agent-use-cases/?case=UC-338)。

## 驗收指令

`node --test tests/*.test.cjs`、`for file in assets/*.js; do node --check "$file"; done`、Python靜態預覽。雲端安裝既有Playwright及axe工具後，執行 `node tests/method-shortcut-browser.cjs`，並以 `READING_URL`／`READER_URL` 指定預覽執行 `tests/reading-flow-browser.cjs`、`tests/reader-browser.cjs`。完整工作流程見 `.github/workflows/method-shortcut-qa.yml`。

三個模擬情境：旅遊搜尋＋生活篩選後閱讀返回／空結果恢復；UC-338分享直鏈前往方法＋返回導覽＋重整；待查線索不被包裝成可用方法。模擬不是真人偏好或轉換率證據。

未檢查實體手機、螢幕閱讀器或Lighthouse；axe不等於整站無障礙認證。下一輪優先測量並改善全庫首次搜尋就緒成本，本輪不延伸做另一個載入重構。
