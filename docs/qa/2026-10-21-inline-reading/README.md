# 原文段落導覽的閱讀與操作尺寸

基準 `08440bd`，隔離工作樹 `/tmp/ai-journey-20261021`、分支 `improve/reader-journey-20261021`。原目錄分支 `improve/search-recall-recent-workflows-and-tokenization` 的兩項未提交修改（app.js、search.test.cjs）完整保留；未reset／強推／更動其他工作樹。起始已fetch，開放研究PR #70不混入本輪。無適用AGENTS.md，已讀README、歷史資料規則、SITE與近期QA、Jekyll catalog及既有workflows。主角色為唯一整合者，另請未參與實作的角色獨立只讀審查。

## 問題證據與選題

[雲端正式站基準39524874061](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39524874061)在1440×1000及390×844走首頁→旅遊搜尋→生活篩選→詳情方法／導覽／來源→來源新頁→原生Back→空結果。兩尺寸均395筆收錄、旅遊＋生活16筆，無pageerror，Back保留條件。原文各段的「回到閱讀導覽」實測 **27.796875px高、12px字**；全部段落summary／按鈕也分別只有13px字及小padding，與既有44px toolbar不一致。[原始報告](before/report.json)與[原測試136/136通過](baseline-unit.tap)。基準observer的first return只證明可回導覽；修後測試改檢查當前標題緊鄰return，不把原first點擊當成當段返回驗收。

目標讀者：手機閱讀原始研究、需來回核對方法、限制及後續來源的人。

- A：放大既有返回、目錄開關及段落選項，至少44px高與14px字，補焦點與長標題換行；成本低，沿用原文與現有路徑，採用。
- B：新增固定浮動導覽，可縮短長文切換距離，但占手機閱讀空間，增加遮擋及Tab順序成本，延後。

預期改善是操作範圍與可讀性可量測提升，沒有宣稱真人喜好、留存或轉換率已提高。驗收包含三引擎五配置、最長標題／h3／最後段、44px及14px、無重疊／溢出、Enter／Space與Tab、跳轉焦點在toolbar下、URL／歷史／背景捲動不變，以及直鏈／重整／返回／空結果與原文完整性。補載閱讀錨點也需保留。

不處理全文載入架構、原分類、搜尋語意、案例內容、證據分類或合格計數。沒有新增產品依賴、追蹤器、cookies、登入、儲存或第三方傳送。

## 實作與驗證方式

產品只改 `assets/reader.css`：原文返回移除-18px負margin，三類控制採44px／14px，目錄選項填滿可用寬度並完整換行，焦點2px品牌綠外框。DOM、原文、來源連結、跳轉及瀏覽歷史程式不變。未壓縮CSS由9,413到9,759 bytes，增加346 bytes；沒有推測網路效能分數。

先寫瀏覽器尺寸與流程驗收，再改CSS。雲端使用原基準CSS執行相同斷言，必須明確以`below 44px`失敗，避免把任意測試錯誤算成重現。新版另跑原`reader-browser.cjs`（含全庫DOM、長文、錯誤／復原及搜尋）、`reading-anchor-browser.cjs`。

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/journey*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/journey-preview/ai-agent-use-cases
python3 -m http.server 8170 --directory /tmp/journey-preview
NODE_PATH=<cloud-tools>/node_modules node tests/journey-controls-browser.cjs
READER_URL=http://127.0.0.1:8170/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/reader-browser.cjs
ANCHOR_URL=http://127.0.0.1:8170/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/reading-anchor-browser.cjs
```

repo無獨立lint、TypeScript或npm build；JS syntax與preview構建不冒稱lint／typecheck／正式Jekyll。正式Pages部署另確認。

## 模型與環境限制

本機設定可讀`gpt-6.1-sol / medium`，無法核實或切換此對話實際runtime型號／effort，因此不宣稱帳號最高設定。獨立review依使用者要求請求`gpt-6-astra / ultra`，請求參數也不視為runtime證明。使用OpenAI Docs skill與[官方設定參考](https://learn.chatgpt.com/docs/config-file/config-reference)核對，文件不能證明帳號可用模型或對話實際設定。

使用者明確授權指定個人目錄的repository工作；瀏覽器都在既有GitHub-hosted runner執行，未操作個人GUI或本機瀏覽器。未切換付費API、購買credits或更改帳號。模擬走查不等於真人研究；未驗實體手機／軟鍵盤／真人輔具，axe不作完整WCAG認證。全文載入成本仍是下一輪優先項。

## 前後截圖

| 流程 | 修改前 | 修改後 |
| --- | --- | --- |
| 手機原文方法 | [27.8px返回](before/method-390.png) | [44px返回](preview/after/method-chromium-390.png) |
| 桌面原文方法 | [小返回操作](before/method-1440.png) | [44px返回](preview/after/method-chromium-1440.png) |
| 手機全段落導覽 | [舊版完整目錄](preview/red/outline-controls-chromium-390.png) | [新版完整目錄](preview/after/outline-controls-chromium-390.png) |

主角色已目視比較方法頁桌面與手機，以及320px／WebKit長目錄；完整標題、未實跑資格文字及焦點外框保留。正式發布結果另於完成後補記。

## 中間失敗與修正

兩次早期run [39525193101](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39525193101)、[39525217037](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39525217037)保留為失敗；前者基於最早測試版，後者Chromium三尺寸已各完成兩次axe零違規，但Firefox的summary外框斷言失敗。測試是在滑鼠操作後程序focus；改用原生Tab再ShiftTab進入summary，原外框及所有尺寸門檻不變，產品CSS亦不變。沒有將失敗宣稱通過，亦不以此斷言原正式站鍵盤存在同樣故障。[兩次日誌及第二次完整報告](intermediate/)。

獨立審查實際比較前後手機方法與320px目錄，確認可讀性、留白、長標題與focus外框可接受，未發現產品必修問題；並要求補原文章節return附近的延遲載入、等12個穩定frame及收集late頁pageerror，已納入。現有reader全庫原文比對與先讀區錨點回歸仍保留。

測試期間他人已合併研究PR #70至主線`1cd79f5`，本輪以無衝突merge同步；其新增案例與研究結論沿用主線，不算本輪新增。最終驗收使用更新後主線資料，原基準395筆仍保留為當時快照。


## 最終預覽驗收

[最終完整載入run39525862217](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39525862217)全部成功。136/136單元、JS syntax、靜態preview構建通過。新套件Chromium1440／390／320、Firefox390及WebKit390五配置，每組21控制均至少44px高、14px字，無重疊、水平溢出或pageerror；新流程10次axe、原reader15次axe、原anchor5次axe，共30次主要掃描零違規（未含舊helper另行輸出），不等同完整WCAG認證。

[新版原始報告](preview/after/report.json)／[原版red](preview/red/report.json)／[red失敗日誌](preview/red.log)／[單元輸出](preview/unit.tap)。全庫[DOM與標題證據比對](preview/reader-corpus.json)399條目、2,838章節、418行頁首證據；研究資料變更來自他人PR #70，本輪產品未編輯案例或計數。[reader a11y](preview/reader-accessibility.json)、[先讀區補載錨點](preview/anchor/verification.json)與原文return附近補載均最大0.625px，門檻2px。

導覽文字及焦點採原品牌綠，按WCAG相對亮度公式實算對白底8.710:1、紙底8.156:1、hover底8.060:1（[計算值](contrast.json)），非對所有網站文字的全面認證。CSS只增加346 bytes，未捏造Lighthouse或網路效能分數。

三個具體模擬情境均有實際瀏覽器檢查：

1. 手機規劃旅行：旅遊＋生活→詳情方法→當段返回→限制與來源→Back保留條件；新來源新頁檢查在桌面，原reader另有手機來源新頁驗收。
2. 接收長文連結：UC001直鏈＋重新整理→全目錄最長標題、h3與最後一段→原生Tab／Enter返回；summary Enter／Space開關，URL／歷史／背景捲動不變。
3. 查不到時恢復探索：無命中字詞→修改關鍵字焦點→保留生活條件恢復旅遊結果；原reader另驗待查、無段落、錯誤／部分來源／缺腳本降級及重試。

這些是模擬走查，沒有真人偏好或轉換率結論。

## 合併與正式發布

正常merge `62a935af0ad2821d12f50cb0a8ec1d614c8968f6` 已SSH push到main，未強推。[Pages39526477628](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39526477628)正式Jekyll建置／部署成功；部署runner排隊約五分鐘。

`gh workflow run journey-qa.yml --ref main -f target=published`回HTTP403「Must have admin rights to Repository」。保留原API身分、未修改權限，改用已授權SSH分支推送`verify/inline-reading-published-20261021`觸發同一工作流；`ceba79c`只改觸發條件，產品資產與main完全相同，獨立審查確認verify分支只走正式流程。

[正式驗收39527104769](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39527104769)全部成功：[四檔資產逐字一致](published-assets.json)、136單元／syntax／preview構建、正式Chromium1440與390完整新流程，每組399條目全載入（failedPaths空陣列斷言）、無pageerror／水平溢出／重疊，44px／14px皆達標，四次正式axe零違規。[原始正式報告](published/report.json)／[正式手機方法](published/method-chromium-390.png)／[正式桌面目錄](published/outline-chromium-1440.png)。主角色已目視兩張正式圖，與驗收版一致。原reader與anchor整套屬preview驗收，沒有冒稱正式也跑同一整套。

其餘主線CI不宣稱全部通過：[記錄快照](main-ci-snapshot.json)當時17成功、5失敗、7進行中。五個背景正式失敗保留如下，不改寫原結果、不推測全部根因：

- [Improvement round39526478803](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39526478803)：正式1440／390完成，320在來源未完整載入而失敗；[原報告](background-round-failure.json)network diagnostics共703次HTTP429、2次503，狀態正確顯示部分來源未載入。這是當次網路紀錄，不證明所有失敗皆同一根因。
- [Reader context39526478756](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39526478756)：failedPaths非空；[Method39526478769](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39526478769)及[Reader controls39526478816](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39526478816)：正式詳情等待逾時；[Evidence39526478758](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39526478758)：正式頁discoveryReady未定義。原始失敗日誌存於[intermediate](intermediate/)，未宣稱已修這些未確證問題。本輪嚴格正式兩尺寸另成功全載399條目。

原工作目錄最後仍是原分支與兩項未提交修改，沒有切換／重設／覆蓋。最後只補驗收觸發方式與公開證據，產品CSS維持最初修正。下一輪優先降低首次全文請求量及讓正式站QA在部署後串行執行，保留直鏈早讀、部分失敗與補讀復原。這輪已達驗收標準，停止追加產品修改。
