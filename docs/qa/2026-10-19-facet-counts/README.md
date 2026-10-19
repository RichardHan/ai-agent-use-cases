# 2026-10-19：選篩選前看得到符合筆數

目標讀者：已有任務方向、用關鍵字搭配情境與工具探索的新訪客。

正式站雲端走查：搜尋「旅遊」有24筆，情境選單只有名稱，選「開發」後沒有結果。桌面1440×1000與手機390×844均重現；原有空結果恢復可用，但選前無法預判。[基準QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39250685279)／[原始結果](baseline.json)。這是模擬走查，不代表真人偏好或轉換率。

方案A：維持原生選單順序、顯示各選項改選後筆數，成本低，保留手機與鍵盤操作；採用。方案B：按筆數排序，容易找到有內容的項目，但輸入時位置反覆改變、增加鍵盤掃描成本；不採用。獨立設計角色也推薦A。

驗收：五欄各選項的數字保留關鍵字與其他四欄，只替換本欄；全部選項表示清除此欄，不把多工具計數相加。零筆仍可選，選值與URL不帶顯示數字；空結果可恢復；未知分享情境明示零筆。載入前不顯示假零，部分載入明示範圍、補讀後更新且保留條件與合理焦點。桌面、390與320px、鍵盤、直接連結、重整、返回及長文均回歸。

不處理：案例增刪、證據狀態與合格計數、搜尋語意、首頁與框架重寫。沒有新增前端套件、追蹤、cookies、登入、第三方資料傳送或付費API。

## 環境與基準

主對話無法核實執行中的實際模型或切換。只讀設定檔顯示預設`gpt-6.1-sol / low`、plan `xhigh`，不把預設當成當前執行證明；未修改全域設定。獨立設計與審查工具明確指定可用`gpt-6-astra / max`。僅主代理修改檔案，獨立角色只讀審查。模型設定參考[官方文件](https://learn.chatgpt.com/docs/config-file/config-reference)，不宣稱已證實本帳號最高模型或本輪實際推理設定。

基準main/origin/main `1317a5e`、乾淨、無開啟PR，fetch後建`improve/filter-recovery`；保留其餘工作樹。repo及祖先無適用AGENTS.md，依README/SITE與既有QA規範。僅在授權工作目錄進行檔案與git操作；瀏覽器、套件安裝、測試及預覽均於GitHub Actions雲端runner執行，未操作個人電腦GUI。

基準69/69單元測試、JS語法及Python靜態預覽成功。專案沒有獨立lint、TypeScript或npm build；預覽不等同Jekyll。[先測後修](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39250739863)：原69項仍過，新測試因`facetCounts`尚未定義而失敗。

## 截圖及預覽

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440px | [桌面](before-desktop.png) | 待最終驗收 |
| 手機390px | [手機](before-mobile.png) | 待最終驗收 |

授權雲端預覽：`python3 scripts/preview.py /tmp/facet-preview/ai-agent-use-cases`，再`python3 -m http.server 8096 --directory /tmp/facet-preview`，開啟`http://127.0.0.1:8096/ai-agent-use-cases/?q=旅遊#explore`。正式[相同搜尋](https://richardhan.github.io/ai-agent-use-cases/?q=旅遊#explore)。

驗收命令：`node --test tests/*.test.cjs`、`for file in assets/*.js; do node --check "$file"; done`、上述Python預覽；雲端Playwright與axe透過`.github/workflows/facet-counts-qa.yml`執行`tests/facet-counts-browser.cjs`與既有`tests/reading-flow-browser.cjs`。

## 審查及結果

獨立審查先發現情境option未明確value，改label會連value改變，已於顯示前固定原value；另修正main乾淨runner的artifact目錄建立。中途版本不作為驗收通過證據。

最終雲端結果、視覺審查及發布紀錄於完成後補入。未驗證實體手機、螢幕閱讀器、真人成效或Lighthouse。下一輪優先量測並改善全庫首次搜尋就緒成本，本輪不延伸做另一個載入重構。
