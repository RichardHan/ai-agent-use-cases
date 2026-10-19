# 2026-10-20 搜尋時判讀來源標籤

對象：從問題搜尋案例、希望在深入閱讀前理解來源界限的新訪客。實際桌面／手機走查發現，卡片與來源篩選只有「作者報告／示範」「公開資料核讀」等標籤，結果旁沒有說明其意義的入口；本輪提供判讀依據。這是設計問題與假設，未聲稱真人已誤讀或理解率已提升。

## 方案、範圍與驗收

- A：在結果上方常駐五類完整定義。操作少，但手機每次都要跨過較長說明。
- B（採用）：常駐目前來源條件的短說明，五類定義放在原生折疊區。成本低中，讓需要的人深入核對，同時保留閱讀密度。

驗收：五類不當成可靠度排名；明示本庫未獨立重現、同篇補充可能有不同證據、本庫自設流程不是作者實測。選擇來源、分享直鏈、重設、瀏覽器返回及補讀後提示同步；鍵盤可展開，summary至少44px高；未知及長文字安全顯示。搜尋、組合篩選、空結果、來源連結、直鏈重新整理、返回焦點、長文、載入／部分失敗／重試／整體錯誤均維持可用。桌面1440、手機390／320，三瀏覽器與axe驗收。

不改案例、來源分類推導、搜尋匹配、排序、URL、嚴格合格312／收錄357、框架與配色。不新增產品依賴、追蹤、cookie、儲存或第三方資料傳送。

## 基準與工作環境

原工作樹分支 `improve/search-recall-recent-workflows-and-tokenization` 有 `assets/app.js`、`tests/search.test.cjs` 未提交修改。fetch後從origin/main `17a0cae`建立 `/tmp/ai-case-improvement-20261020-r2`、`improve/evidence-discovery-20261020`，未修改原工作樹、reset或強推。無適用AGENTS.md，開始時無開啟PR；已讀README、SITE、部署規範、前輪QA及測試。主角色是唯一整合／實作者，獨立角色只讀審查。

本機設定檔為 `gpt-6.1-sol / medium`，無法證明或切換主對話實際runtime。獨立架構與程式／視覺審查指定工具提供的 `gpt-6-astra / ultra`，也不把指定參數冒充已核實runtime。使用者最後明確授權指定個人工作目錄，使用本機headless瀏覽器、shell與既有授權GitHub runner；未操作個人GUI或其他私人資料，未使用額外付費API。

原基準98項單元全通過，JS syntax與Python靜態預覽成功；沒有獨立lint／TypeScript／npm build。新單元先因缺少guide函式失敗（[red.tap](red.tap)）；真實瀏覽器在357筆完整載入後因結果旁沒有入口失敗（[red-browser.log](red-browser.log)、[原始狀態](red-browser/report.json)），不是假設問題已被真人證明。

首次正式站走查另量得355個Markdown、363總請求，ready9129／1683ms（[before.json](before.json)，未節流兩次觀測，不是裝置速度或改善幅度）。原擬以建置分包改善載入，但獨立審查指出checked-in副本有同名原文更新後過期風險；正確做法需要同次Jekyll建置生成。Pages現為legacy main/root，嘗試以**相同legacy值**PUT測試設定權限，GitHub回HTTP404，沒有改變設定，隨即停止相關修改。沒有提交分包、改部署來源或掩蓋失敗。這是未完成選題與權限限制；本輪最終選題以上述來源判讀為準。

## 修改與驗證

`index.html` 在結果數與卡片之間加入說明與原生details/dl，來源select的aria-describedby連到目前說明。`assets/app.js` 五類說明集中一份，由共用render更新，只有文案變動才改live region，避免每次輸入都重複宣布；以textContent處理未知類型。`assets/style.css`沿用品牌文字、對比與focus，14px說明、44px以上展開目標，不增加動畫。

基準與修改後截圖由真實headless瀏覽器產生；非設計稿。首屏內容可能因隨機抽卡不同。

| 視圖 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面結果 | [1440](before-evidence-1440.png) | [1440](preview/after-results-chromium-1440.png) |
| 手機結果 | [390](before-evidence-390.png) | [390](preview/after-results-chromium-390.png) |
| 展開判讀 | 原版無入口 | [桌面](preview/after-guide-chromium-1440.png)／[手機](preview/after-guide-chromium-390.png) |

三個具體模擬情境：
1. UC001＋作者來源 → 展開說明 → 鍵盤讀案例／來源 → Escape回到同卡。
2. UC001改官方來源 → 零結果仍能理解來源條件 → 修改查詢／重設。
3. 旅遊＋生活＋Grok Bot＋作者來源分享UC001 → 重新整理／關閉／原生Back → 條件保留；另讀UC313長文。

模擬走查不是偏好、轉換或留存研究。補測載入中展開、部分503／補讀、未知長文字注入安全、目錄503／重試。第一版測試因AxeBuilder要求顯式browser.newContext而中止；修正測試建立方式後重跑，不將該錯誤算成網站缺陷。

指令：

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/ai-r2-preview/ai-agent-use-cases
python3 -m http.server 8123 --directory /tmp/ai-r2-preview
NODE_PATH=/tmp/ai-case-qa-tools/node_modules GUIDE_OUTPUT=qa-artifacts/source-guide node tests/source-guide-browser.cjs
```

預覽：`http://127.0.0.1:8123/ai-agent-use-cases/?q=UC001&proof=作者報告／示範#explore`；正式站同query可驗收。Python預覽不是正式Jekyll建置；發布後另核對Pages與逐byte資產一致性。

目前100項單元全通過，預覽三瀏覽器五配置完整情境及10次axe零違規；原始報告[preview/report.json](preview/report.json)。後續獨立審查、雲端及發布結果追加於下方。

## 限制與下一輪

未用實體手機、螢幕閱讀器或真人研究；axe不等於完整認證。未量測Lighthouse、留存、轉換；本輪沒有宣稱降低請求或加快載入。來源標籤本身仍是既有頁首文字歸類，不替代原文證據，也未重新稽核357筆的分類。

下一輪最值得做：在有權調整Pages建置來源後，同次建置生成content-addressed全文分包，保留早讀、局部復原、原文完整性與HTTP診斷；不能以手動同步副本替代。
