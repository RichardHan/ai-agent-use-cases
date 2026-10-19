# 2026-10-19：選篩選前看得到符合筆數

目標讀者：已有任務方向、用關鍵字搭配情境與工具探索的新訪客。

正式站雲端走查：搜尋「旅遊」有24筆，情境選單只有名稱，選「開發」後沒有結果。桌面1440×1000與手機390×844均重現；原有空結果恢復可用，但選前無法預判。[基準QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39250685279)／[原始結果](baseline.json)。這是模擬走查，不代表真人偏好或轉換率。

方案A：維持原生選單順序、顯示各選項改選後筆數，成本低，保留手機與鍵盤操作；採用。方案B：按筆數排序，容易找到有內容的項目，但輸入時位置反覆改變、增加鍵盤掃描成本；不採用。獨立設計角色也推薦A。

驗收：五欄各選項的數字保留關鍵字與其他四欄，只替換本欄；全部選項表示清除此欄，不把多工具計數相加。零筆仍可選，選值與URL不帶顯示數字；空結果可恢復；未知分享情境明示零筆。載入前不顯示假零，部分載入明示範圍、補讀後更新且保留條件與合理焦點。桌面、390與320px、鍵盤、直接連結、重整、返回及長文均回歸。

不處理：案例增刪、證據狀態與合格計數、搜尋語意、首頁與框架重寫。沒有新增前端套件、追蹤、cookies、登入、第三方資料傳送或付費API。

## 環境與基準

主對話無法核實執行中的實際模型或切換。只讀設定檔顯示預設`gpt-6.1-sol / low`、plan `xhigh`，不把預設當成當前執行證明；未修改全域設定。獨立設計與審查工具明確指定可用`gpt-6-astra / max`。本輪實作由主代理整合，獨立角色只讀審查；共享目錄另有其他程序提交的情況見下方。模型設定參考[官方文件](https://learn.chatgpt.com/docs/config-file/config-reference)，不宣稱已證實本帳號最高模型或本輪實際推理設定。

基準main/origin/main `1317a5e`、乾淨、無開啟PR，fetch後建`improve/filter-recovery`；保留其餘工作樹。repo及祖先無適用AGENTS.md，依README/SITE與既有QA規範。僅在授權工作目錄進行檔案與git操作；瀏覽器、套件安裝、測試及預覽均於GitHub Actions雲端runner執行，未操作個人電腦GUI。

基準69/69單元測試、JS語法及Python靜態預覽成功。專案沒有獨立lint、TypeScript或npm build；預覽不等同Jekyll。[先測後修](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39250739863)：原69項仍過，新測試因`facetCounts`尚未定義而失敗。

## 截圖及預覽

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440px | [桌面](before-desktop.png) | [桌面](after-desktop.png) |
| 手機390px | [手機](before-mobile.png) | [手機](after-mobile.png) |

授權雲端預覽：`python3 scripts/preview.py /tmp/facet-preview/ai-agent-use-cases`，再`python3 -m http.server 8096 --directory /tmp/facet-preview`，開啟`http://127.0.0.1:8096/ai-agent-use-cases/?q=旅遊#explore`。正式[相同搜尋](https://richardhan.github.io/ai-agent-use-cases/?q=旅遊#explore)。

驗收命令：`node --test tests/*.test.cjs`、`for file in assets/*.js; do node --check "$file"; done`、上述Python預覽；雲端Playwright與axe透過`.github/workflows/facet-counts-qa.yml`執行`tests/facet-counts-browser.cjs`與既有`tests/reading-flow-browser.cjs`。

## 審查及結果

獨立審查先發現情境option未明確value，改label會連value改變，已於顯示前固定原value；另修正main乾淨runner的artifact目錄建立。中途版本不作為驗收通過證據。320px實際截圖顯示尾綴數字24被截為2，已改成「24 · 全部情境」前置數字，保留完整原生選項文字與value。

[第一輪完整成功QA39253226387](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39253226387)：原69＋新增4項單元、JS語法、靜態預覽通過；三引擎五配置的搜尋、篩選、空結果、分享重整、原生返回、鍵盤與axe通過。[原始結果](verification.json)／[既有完整閱讀流程](reading-verification.json)。Chromium1440逐項核對全部選項；其他尺寸及引擎抽樣選項，均核對多欄交集與工具選項。5次新axe＋15次閱讀axe共20次零違規，不是無障礙認證。

三個具體情境：旅遊＋生活＋用法靈感再改工具、閱讀並原生返回；無結果改關鍵字、逐項恢復；UC-001分享直鏈重整、未知情境與來源失敗後補讀。補讀計數14→15，URL和條件保留，完成時焦點交給結果數。第一個公開來源參考連結實際在新分頁開啟，不宣稱所有外部來源皆可用。

320px另檢查[三位數總數](after-small-three-digits.png)、[長分類](after-small-long-option.png)、[零筆](after-small-zero.png)，數字不被截斷；長名稱仍有原生選項全文與完整條件chip。

[原基準的同步render量測](baseline-measured.json)與修後JSON各配置5筆，只是未節流runner上同一「旅遊」查詢的同步事件耗時，非實體手機或input-to-paint效能分數。前後不是同一硬體執行序，不能當嚴格效能比較。

最終獨立視覺審查與發布結果完成後續記。未驗證實體手機、螢幕閱讀器、真人成效或Lighthouse。下一輪優先量測並改善全庫首次搜尋就緒成本，本輪不延伸做另一個載入重構。


共享工作目錄的其他程序提交了b5ffcee／12b23c5／65dda73，並於584e5af合併push main；主代理與獨立角色均未發出該次合併指令。已保留提交，不reset或強推。該次Pages成功，但新QA仍有Firefox返回失敗，因此不當作本輪驗收完成；後續以fix/facet-acceptance獨立分支繼續驗收修正。


獨立角色實讀程式diff、雲端JSON及320px三種狀態截圖，結論無剩餘產品必修；確認長分類在收合選單可能截短，但筆數完整、條件chip保留全文。只對既有已載入資料計數，使用安全文字DOM，未見新增外送、儲存、追蹤或敏感資料。依審查修正文案與維護紀錄的驗收範圍。


## 最終驗收與整合

[最終分支QA39253837642](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39253837642)成功，驗收程式/產品資產對應31c2de4，原69＋新增4項單元、語法及靜態建置通過，五配置篩選與完整閱讀流程通過，20次axe零違規。[c9e6943驗收](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39253500269)亦成功，包含打開詳情後先驗case網址。

Firefox壓力對照確認：242次選項切換，修前4,368ms、修後5,048ms，兩版均由瀏覽器console回報短時間過多history修改，case/history未建立。[完整對照](firefox-exhaustive-diagnostic.json)。不是本輪新增回歸，亦未宣稱修復該極端壓力限制。完整選項計數在Chromium1440逐項驗證，其他引擎與尺寸抽樣並保留真實多欄交集、原生返回、case網址與錯誤檢查；不能以該壓力測試冒充一般讀者操作。

原主線Partial Load QA的正式走查使用工具的固定顯示label，在加入動態數字後無法匹配；已改為穩定value（Grok Bot），未改網站條件或降低驗收要求。第一版長時間未結束的分支QA是失敗後瀏覽器未關閉，已讓腳本在失敗時退出；未當作通過。

獨立角色實讀最終產品diff、JSON和補圖，無剩餘必修。正式合併及Pages結果於完成後續記。
