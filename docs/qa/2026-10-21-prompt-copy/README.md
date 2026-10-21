# 2026-10-21：把原文提示詞完整帶走

## 問題、方案與範圍

雲端正式站[基準走查39581489078](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39581489078)實際以1440×1000、390×844走首頁→旅遊搜尋＋生活→詳情→方法→來源新頁→原生Back→空結果。當時405條目、結果17筆，兩尺寸均無pageerror，返回保留旅遊查詢。[原始報告](baseline/journey.json)、[手機方法與下一個提示詞](baseline/method-390.png)。主角色已目視圖；「可複製提示詞」只有正文，手機需跨屏選取。

目標讀者：已找到適用方法、想保留完整提示詞再依自身需求修改的人。

- A：原提示詞章節增設複製，保留原標題、限定、清單、程式縮排與連結；拒絕時提供可手動複製的完整原文。成本低，採用。
- B：另建可編輯提示詞工作區，便於代入需求，但新增草稿、狀態與隱私設計成本，延後。

驗收：完整原章節（包含子標題，到下一個同級／更高級標題截止），成功／拒絕／剪貼簿不可用、長文字與多章節、無資料與待查、不搶走已移動焦點、過期回覆不污染新案例；44px控制、16px手動欄位、鍵盤與可見焦點、來源URL保留、列印不混UI。搜尋／組合篩選／空結果、直鏈／重整／返回及原文完整性不得退化。

不處理案例內容、合格計數、去重候選、搜尋語意、首次全文載入架構或獨立編輯器。複製不等於執行；不將本庫設計或未測內容重新分類為已驗證。未新增依賴、追蹤、cookies、登入、儲存或第三方資料傳輸。

## 實作與獨立審查

產品只改`assets/reader.js`／`assets/reader.css`。嚴格匹配「可複製提示詞」「可貼指令」原標題，空章節與pending不新增控制。直接複製原始Markdown連續片段，保留完整原標題與段內限定，不混入導覽／複製UI；保留原文節點文字與來源URL。原生Clipboard API只在點擊後呼叫，失敗提供readonly textarea；不自動執行內容。request序號、isConnected與dialog.open保護非同步回覆；焦點已移開就不focus手動欄位。整個控制容器在列印時隱藏。

先寫新增單元測試，舊版因缺少功能明確失敗（[初始紅測試](baseline/red-initial.tap)）；新版加入原始文字、URL、fence縮排、清單、h2/h3、待查與空章節邊界。雲端亦以固定`ce58a09`重現舊版無控制，對同資料產生前後圖。

未參與主要實作的獨立角色只讀審查，主角色唯一整合。修正其提出的live region空狀態不能display:none、手動欄位16px、保留連結destination與完整子節等問題。獨立Node比對整合研究後408條目、2918標題，396複製章節對位零差、原文連續片段零差；405個case/evidence檔中390檔有複製章節，另3待查不提供動作。17個候選含fence、1個含Markdown連結、2個含子節；不得將複製控制數當成合格案例數。

## 模型、版本與環境

本次介面沒有可核實本對話實際模型ID／effort或切換設定，不能宣稱已使用帳號最高模型。使用OpenAI Docs技能核對[官方設定參考](https://learn.chatgpt.com/docs/config-file/config-reference)；文件不證明帳號權限或runtime。依使用者要求，獨立review工具請求`gpt-6-astra / ultra`，亦不把請求參數當作runtime證明。

無適用AGENTS.md；已讀README、SITE、歷史維護規則與近期QA及部署規範。起點`ce58a09`，獨立工作樹`/tmp/ai-outline-20261021`，分支`improve/reader-outline-20261021`。原目錄既有app.js／search.test.cjs未提交內容未動，沒有reset／強推。研究PR #73於途中合併，正常合入`777cd9f`無衝突，保留其新增資料。所有瀏覽器只在既有GitHub-hosted runner，未操作本機GUI／本機browser，也未切換付費API或購買credits。

GitHub workflow dispatch回覆403「Must have admin rights to Repository」；依既有push授權改用正常分支push觸發同一驗收，不切換身分或弱化斷言。正式部署保持main根目錄的GitHub Pages內建Jekyll。

## 驗證方式

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/outline*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/prompt-preview/ai-agent-use-cases
python3 -m http.server 8180 --directory /tmp/prompt-preview
NODE_PATH=<cloud-tools>/node_modules node tests/outline-copy-browser.cjs
READER_URL=http://127.0.0.1:8180/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/reader-browser.cjs
```

本機原基準139/139；修後及整合研究144/144，JS syntax／git diff --check／preview build通過。無獨立lint、TypeScript或npm build，未將語法檢查稱為lint／typecheck；Python preview不等於正式Jekyll部署。

三種具體模擬情境：旅遊搜尋＋生活篩選→複製／拒絕手動複製→返回及空結果復原；長篇UC-005直鏈重整→逐個提示詞含原連結→空章節／待查；延遲剪貼簿回覆→保持移開焦點／切換案例／關閉不污染。這些是模擬走查，不代表真人喜好或留存提升。

[最終雲端預覽39582517797](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39582517797)在產品`bb3ac12`通過：[144項單元](unit.tap)、[舊版紅測試](red.tap)、[前圖](before/report.json)、[後圖與流程報告](after/report.json)。Chromium1440／390、Firefox390、WebKit390四配置皆完成、零pageerror／水平溢出，4次新增功能axe掃描皆0。複製按鈕約45.8px、14px字，手動欄位16px。Chromium兩尺寸以真正剪貼簿讀回比對；Firefox／WebKit成功分支、三引擎拒絕／API缺失／延遲回覆為受控注入，未冒稱真人權限故障。

原有reader回歸在Chromium1440／390／320、Firefox390、WebKit390通過，含搜尋、五類組合條件、空結果、鍵盤焦點、直鏈重整、原生Back、來源、長文、待查、缺腳本／單檔失敗與復原。[摘要](reader-summary.log)、[全庫](reader-corpus.json)：408條目、2918章節、427行頁首證據保留；瀏覽器另逐篇移除新UI後比對原文，408筆文字完全一致。UC-005四個提示詞逐個比對，含官方文件URL。獨立review已檢查產品／測試與前後圖。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 手機390 | [需手動選取](before/prompt-chromium-390.png) | [直接複製完整原章節](after/prompt-chromium-390.png) |
| 桌面1440 | [原始正文](before/prompt-chromium-1440.png) | [複製入口](after/prompt-chromium-1440.png) |

[手機拒絕後手動複製](after/manual-chromium-390.png)。主角色已目視比較；正文、標題限定及下一節保留，欄位焦點清楚、長文完整全選。

資產gzip本機估算：reader.js增加1005 bytes、reader.css增加180 bytes，合計1185 bytes（[原始大小](asset-size.json)）；不是網路載入速度量測，不宣稱效能分數。舊run39582006774、39582094807、39582187468亦成功，但不取代最終修正版驗收。嘗試取消已被取代的舊run時同樣收到403，未換身分；該run後續自行成功。

正常merge commit `441c56e0c1c7a2cc6a5a9e81ab4a97d3d93df3f9` 已push至main；無強推，原工作目錄仍保留兩項未提交修改。獨立角色已對最終產品`bb3ac12`與144項單元、四配置及截圖簽核，無剩餘必修。[Pages部署39583270329](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39583270329)已成功；建置完成後曾因既有並行QA而排隊。正式[發布驗收39583921998](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39583921998)成功：reader.js／reader.css與已審查產品內容完全一致（[資產比對](published-assets.json)），1440及390均408條目、旅遊＋生活17筆、真正剪貼簿內容一致、拒絕／API缺失手動複製與返回／空結果復原通過，兩次正式axe皆0、零pageerror／水平溢出。[正式報告](published/report.json)、[桌面](published/prompt-chromium-1440.png)、[手機](published/prompt-chromium-390.png)。主角色已目視正式兩尺寸，與預覽一致。資產報告sha為驗證checkout `94bfea8`，其中產品檔與部署merge `441c56e`相同；不把測試checkout誤稱部署commit。

發布後廣域CI暴露我漏同步的原文比較規則：[Evidence round39583272365](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39583272365)、[Reader context39583272487](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39583272487)明確報`UC-001 original research changed`。舊測試只排除reader-return，錯把新生成的reader-copy控制當成原文。`ba93beb`精確排除此容器，仍逐篇完整`innerHTML===original`，原文字、URL、結構與順序任一變動仍失敗；來源renderer不允許原文建立該HTML class，並非廣泛略過div/p。獨立review確認沒有削弱正文保護，並將兩套完整流程納入本輪雲端驗收。`94bfea8`同時同步搜尋命中、先讀與PDF文字取樣的三個相同排除點。產品檔未再更改。

另[Source guide39583272314](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39583272314)的preview步驟失敗，保存來源流程及分享報告已完成、後續context僅第一配置記錄；下載的failed-step log未含實際例外，不憑時間推定根因，也不宣稱此舊run通過。其他main CI以Actions實際狀態為準，未宣稱全批綠燈。

[最終測試適配重跑39583915912](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39583915912)在`94bfea8`完整成功：144項單元、build、四配置複製及原reader五配置再通過；[來源限制導覽](integrity/review-sections.json)與[搜尋原文定位](integrity/context.json)各五配置完成、各10次axe掃描皆0，兩套全庫嚴格HTML比對均408筆通過。來源導覽含3個額外fixture、1426個實際候選索引；搜尋定位含521段原文命中。這些是檢查數，非成功案例數。獨立review確認測試適配與正式圖，無剩餘必修。

此輪產品驗收已完成。早於適配的三筆舊main失敗保留為歷史，不把重跑成功改寫成舊run成功；其他並行main檢查不作全綠宣稱。最終整合僅追加測試適配及這份發布證據，沒有再修改已部署產品資產。未驗實體手機、軟鍵盤、真人輔具或完整WCAG認證；axe只記實際結果，不宣稱全站認證。未提供虛構效能或轉換率分數。下一輪優先改善首次全文請求量與公開QA並行限流；本輪不以複製功能聲稱解決既有429問題。
