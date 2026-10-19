# 2026-10-20 搜尋時判讀來源標籤

對象：從問題搜尋案例、希望在深入閱讀前理解來源界限的新訪客。實際桌面／手機走查發現，卡片與來源篩選只有「作者報告／示範」「公開資料核讀」等標籤，結果旁沒有說明其意義的入口；本輪提供判讀依據。這是設計問題與假設，未聲稱真人已誤讀或理解率已提升。

## 方案、範圍與驗收

- A：在結果上方常駐五類完整定義。操作少，但手機每次都要跨過較長說明。
- B（最終採用）：常駐「來源標籤怎麼看 · 未獨立重現」入口；目前來源條件的解釋與五類定義放在原生折疊區。成本低中，讓需要的人深入核對，也保留手機結果密度。初版常駐短說明曾造成下述手機退化，已補修。

驗收：五類不當成可靠度排名；明示本庫未獨立重現、同篇補充可能有不同證據、本庫自設流程不是作者實測。選擇來源、分享直鏈、重設、瀏覽器返回及補讀後提示同步；鍵盤可展開，summary至少44px高；未知及長文字安全顯示。搜尋、組合篩選、空結果、來源連結、直鏈重新整理、返回焦點、長文、載入／部分失敗／重試／整體錯誤均維持可用。桌面1440、手機390／320，三瀏覽器與axe驗收。

不改案例、來源分類推導、搜尋匹配、排序、URL、嚴格合格312／收錄357、框架與配色。不新增產品依賴、追蹤、cookie、儲存或第三方資料傳送。

## 基準與工作環境

原工作樹分支 `improve/search-recall-recent-workflows-and-tokenization` 有 `assets/app.js`、`tests/search.test.cjs` 未提交修改。fetch後從origin/main `17a0cae`建立 `/tmp/ai-case-improvement-20261020-r2`、`improve/evidence-discovery-20261020`，未修改原工作樹、reset或強推。無適用AGENTS.md，開始時無開啟PR；已讀README、SITE、部署規範、前輪QA及測試。主角色是唯一整合／實作者，獨立角色只讀審查。

本機設定檔為 `gpt-6.1-sol / medium`，無法證明或切換主對話實際runtime。獨立架構與程式／視覺審查指定工具提供的 `gpt-6-astra / ultra`，也不把指定參數冒充已核實runtime。使用者最後明確授權指定個人工作目錄，使用本機headless瀏覽器、shell與既有授權GitHub runner；未操作個人GUI或其他私人資料，未使用額外付費API。

原基準98項單元全通過，JS syntax與Python靜態預覽成功；沒有獨立lint／TypeScript／npm build。新單元先因缺少guide函式失敗（[red.tap](red.tap)）；真實瀏覽器在357筆完整載入後因結果旁沒有入口失敗（[red-browser.log](red-browser.log)、[原始狀態](red-browser/report.json)），不是假設問題已被真人證明。

首次正式站走查另量得355個Markdown、363總請求，ready9129／1683ms（[before.json](before.json)，未節流兩次觀測，不是裝置速度或改善幅度）。原擬以建置分包改善載入，但獨立審查指出checked-in副本有同名原文更新後過期風險；正確做法需要同次Jekyll建置生成。Pages現為legacy main/root，嘗試以**相同legacy值**PUT測試設定權限，GitHub回HTTP404，沒有改變設定，隨即停止相關修改。沒有提交分包、改部署來源或掩蓋失敗。這是未完成選題與權限限制；本輪最終選題以上述來源判讀為準。

## 修改與驗證

`index.html` 在結果數與卡片之間加入說明與原生details/dl，來源select的aria-describedby連到常駐入口及展開後的目前說明。`assets/app.js` 五類說明集中一份，由共用render更新，只有文案變動才改live region，避免每次輸入都重複宣布；以textContent處理未知類型。`assets/style.css`沿用品牌文字、對比與focus，14px說明、44px以上展開目標，不增加動畫。

基準與修改後截圖由真實headless瀏覽器產生；非設計稿。首屏內容可能因隨機抽卡不同。

| 視圖 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面結果 | [1440](compare-before-1440.png) | [1440](mobile-fix/compare-after-1440.png) |
| 手機結果 | [390](compare-before-390.png) | [390](mobile-fix/compare-after-390.png) |
| 展開判讀 | 原版無入口 | [桌面](mobile-fix/after-complete-guide-chromium-1440.png)／[手機](mobile-fix/after-complete-guide-chromium-390.png) |

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

## 獨立審查與補強

獨立角色未參與實作，先審查架構、diff、安全文字處理及五類文案，再自行讀100項測試結果並看桌面／手機前後圖。依審查補拍完整guide區塊：[1440](preview/after-complete-guide-chromium-1440.png)／[390](preview/after-complete-guide-chromium-390.png)／[320](preview/after-complete-guide-chromium-320.png)，確認五類換行與間距。另補驗全357筆來源標籤都有定義，以及移除來源chip／清除篩選後回復預設說明，五配置重跑完成。截圖上下緣不同，不用來推算首屏空間改善或轉換成效。

字色依WCAG相對亮度公式計算，#3c5148／#285344／#172b27對#f7f8f2分別7.98／8.16／13.93:1；初版前端三檔共增加2,687未壓縮bytes。詳見[sizes-and-contrast.json](sizes-and-contrast.json)，不是Lighthouse分數、網路傳輸量或載入提速證明。

[雲端Source guide QA39332823089](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39332823089)檢查同一產品版本026b51d，並額外執行原search passage全庫原文完整性與loading budget回歸。PR建立被GitHub的Enterprise Managed User限制拒絕（createPullRequest Unauthorized）；不切換身份，依使用者既有授權直接非強推merge，合併前先確認獨立審查與雲端結果。

比較補記：固定基準17a0cae與修改後使用同query／proof及viewport，將結果數定位在視窗top約40px。兩版本皆9／357筆，偏差小於1px；[comparison.json](comparison.json)。上表已改用這組可直接比較的畫面，舊截圖仍保留。獨立審查固定讀026b51d，確認產品與發布QA皆無必修；其一度提出的正式模式引擎配置疑慮，已自行以VM執行固定commit實際運算式後撤回，正式2個Chromium配置、預覽三引擎5配置相符。

第一輪雲端39332823089已成功；獨立reviewer自行下載logs／artifact，逐項核對：100／100單元；guide三引擎五配置、三情境、357筆無缺項、10次axe零違規；原context五配置、10次axe零違規，全庫357條目／459段落的原文DOM完整性斷言通過。原loading budget三引擎17項通過：5組356→357僅補1次；三次整輪期限20428／21023／20519ms、各32請求後可復原357；缺失直鏈、catalog／copy掛起復原也通過。原始數據：[guide](cloud-first-guide.json)／[context](cloud-first-context.json)／[loading](cloud-first-loading.json)／[CI](cloud-first-ci.json)。

測試維護修正3dfa13e把兩個固定357斷言改為由served catalog＋P標題計算，保留精確相等與0缺項斷言；獨立核對與既有loading-budget公式相同，產品三檔無變動。最終雲端[39333237573](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39333237573)另行確認，不將第一輪當成測試修正後的結果。


## 發布後原有QA抓到的退化與最終補修

初版非強推合併48880b0，[Pages39333952290](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39333952290)建置部署成功，公開HTML／JS／CSS逐byte相同。初版[Source guide QA39333953063](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39333953063)的preview／published都成功，但不代表全部舊QA通過。原[Reader QA39333953244](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39333953244)在未修改的mobile-search-browser.cjs明確失敗：「First result follows search without scrolling past unused controls」。原[Website QA39333953245](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39333953245)也FAIL，該份log未提供完整斷言，不能確定與Reader同根因。保留[Reader原FAIL](initial-reader-failure.log)及[Website原FAIL](initial-website-failure.log)，不把初版窄範圍通過誤寫成全面通過。

補修738ccb3／89a9524：完整說明移進details；入口仍有44px目標及「未獨立重現」提醒。縮小結果標頭原有margin-bottom，不使用跨分享區域的負margin。基準預設手機firstResultFromSearch=204px，初版超過原240px門檻；補修三引擎390／320實測233px，原門檻未放寬。原mobile搜尋三引擎五配置全部通過、10次axe零違規：[Chromium](mobile-fix/source-guide-chromium.json)／[Firefox](mobile-fix/source-guide-firefox.json)／[WebKit](mobile-fix/source-guide-webkit.json)。

獨立角色進一步以Chromium實際輔助樹發現，閉合details的note不會進入select的description；89a9524將常駐summary加入aria-describedby，並以CDP斷言實際description包含「未獨立重現」。獨立補驗先確認served HTML等於固定89a9524，再驗閉合／展開兩狀態；展開後才有完整來源說明。沒有聲稱閉合時會朗讀隱藏文案。最終guide五配置／357筆無缺項／10次axe零違規：[補修報告](mobile-fix/report.json)。獨立角色已看最終手機、桌面與完整五類圖片，無剩餘必修項。

分享成功／拒絕剪貼簿兩路各1440／390／320：summary距status底12px、距手動輸入框底18px，保留輸入框焦點且無重疊；[六組原始數據與圖片](mobile-fix/source-guide-share/report.json)。新workflow也加入未修改的mobile-search測試及原discovery-browser／reader-browser完整命令，防止只驗新功能漏掉既有閱讀密度。

來源限制：本輪額外查驗GitHub原文時曾回HTTP429（[初版正式數據](initial-published-guide.json)、補修guide報告也保留），popup開啟的URL正確，但不宣稱第三方來源每次可讀或HTTP200；不為取得綠燈而反覆重試。手動版本核對腳本一度把native fetch.status當函式，導致部署前舊站提前進入guide檢查，該失敗[原log](premature-live-check.log)不算正式驗收成功；已改為先核對資產成功才執行。正式雲端workflow原本即有正確版本閘門。

最終補修前端三檔相對17a0cae共增加2,810未壓縮bytes（HTML678、JS1355、CSS777），見[final-asset-sizes.json](final-asset-sizes.json)。不代表傳輸量或速度分數。最後預覽已加Chromium真AX描述檢查，仍為五配置357筆零缺項、10次axe零違規；原mobile另外五配置10次axe零違規，分享六組無重疊。雲端補修驗收[39334624106](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39334624106)會再核對原失敗的完整命令，結果另補。


## 最終合併與正式站驗收

補修[完整雲端39334624106](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39334624106)成功，固定89a9524；單元100／100、JS語法、Python預覽、七個完整browser命令皆成功，未修改原mobile／discovery／reader／context／budget斷言。獨立角色自行下載與解析全部artifact／logs，確認原Discovery與Reader確實抵達並成功，非只看workflow綠燈。Reader全庫357筆、2486節、376證據列、15次axe零違規。完整[獨立核對](independent-final-audit.json)；原始[guide](cloud-final-guide.json)／[context](cloud-final-context.json)／[loading](cloud-final-loading.json)／[reader corpus](cloud-final-reader-corpus.json)／[reader accessibility](cloud-final-reader-accessibility.json)／[CI](final-cloud-ci.json)。

以非強推merge711921f整合補修，整合後100項單元再次通過。[Pages39336233001](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39336233001)的Jekyll建置／部署成功，公開HTML、JS、CSS逐byte等於整合checkout且HTTP200（[比對結果](published-assets.json)）。

正式HTTPS網站Chromium1440／390的三情境、載入／部分失敗／重試／未知長字／整體錯誤皆通過，357筆無缺項；4次axe零違規，閉合來源欄位的真AX description含「未獨立重現」。UC001原文URL開啟正確、最後一次額外HTTP查驗200；前面的429仍保留，不把一次200當成所有外部來源可用證明。[正式完整結果](published/report.json)／[正式桌面完整guide](published/after-complete-guide-chromium-1440.png)／[正式手機完整guide](published/after-complete-guide-chromium-390.png)。

另在正式站預設無條件結果實測：手機第一張結果距離233px、收合guide、357筆無缺項；[數據](published-density.json)／[桌面畫面](published-default-1440.png)／[手機畫面](published-default-390.png)。這與原<240px標準一致，沒有只驗選過篩選的特殊版面。

可直接開啟[正式網站搜尋入口](https://richardhan.github.io/ai-agent-use-cases/#explore)或[來源篩選範例](https://richardhan.github.io/ai-agent-use-cases/?q=UC001&proof=作者報告／示範#explore)，點「來源標籤怎麼看 · 未獨立重現」。最終修改為index.html／assets/app.js／assets/style.css及測試、QA workflow與維護紀錄，案例原文與分類未改。完整七條驗證命令、port與環境設定見[Source guide QA](../../../.github/workflows/source-guide-qa.yml)。

發布後原有完整QA也已確認：[Website QA39336234210](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39336234210)全部成功；[Reader QA39336234216](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39336234216)的preview與published皆成功，原先失敗的手機距離門檻及正式三瀏覽器閱讀路徑已回復。保留[Website結果](final-website-ci.json)／[Reader結果](final-reader-ci.json)與[合併版本全部CI快照](final-main-ci.json)。快照中尚在背景執行的其他job不冒稱已完成；本輪同碼完整七套preview已成功、正式站兩尺寸實測及原Website／Reader發布回歸成功，沒有繼續追加功能。

本輪驗收完成。接續提交僅保存紀錄與圖片，不改執行資產。原工作樹仍保留相同兩個未提交搜尋檔案，部署仍為legacy Jekyll main/root。未驗證實體手機、真人螢幕閱讀器或留存；來源偶發429與355個全文請求仍是已記錄限制。下一輪優先在具備正確Pages建置設定能力後處理原文分包，不以手動副本掩蓋資料一致性。
