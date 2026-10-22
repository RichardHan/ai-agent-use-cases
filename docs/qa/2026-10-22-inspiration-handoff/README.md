# 首頁靈感卡：選情境後，直接接著閱讀

狀態：預覽與獨立審查完成，待正式部署驗收。

## 問題、兩案與範圍

目標讀者是第一次用鍵盤從首頁選情境、想閱讀靈感卡的人。[正式站基準39761891625](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39761891625)在1440／390實走首頁、選情境、抽卡、搜尋、組合篩選、詳情、來源新頁與返回。手機選工作後，卡片可見，但焦點仍在舊guide；下一Tab落在省錢guide，top=-217.08px，在畫面外。桌面亦留在舊guide；抽卡後焦點留在卡片後面的draw按鈕，Tab跳過新卡。[DOM與幾何](checks/baseline-focus.json)。主角色已目視修改前後圖，沒有以程式假說冒充瀏覽觀察。

- A（採用）：明確選情境／抽卡後，移焦至新卡片的可閱讀標題；空集合移到說明。只改既有helper與視窗邊距，沿用Enter開啟／Escape返回；成本低，取捨是鍵盤快速連抽需重新抵達抽卡按鈕。
- B：把抽卡按鈕搬到卡片前，保留按鈕焦點，Tab才進卡片。適合連續抽卡，但會改動既有版面與操作順序，成本較高。

驗收包含五配置、Enter／Space／Tab、詳情精確返回、搜尋與組合篩選、直鏈重整、來源、空卡組、長標題、載入／錯誤／補讀不搶焦點。自動`drawNext`／`syncDiscovery`不移焦；不新增排程或動畫。

不處理搜尋語意、案例或證據重分類、合格計數、資料去重、首頁情境原有重設規則、框架及載入架構。原始資料沒有本輪改寫、刪除；協作者研究更新正常合併。未新增產品依賴、追蹤、cookies、儲存或第三方傳送。

## 實作與截圖

- `assets/app.js`：僅調整explicit `revealDiscovery`，ready守門、標題／空狀態落點、即時有界捲動、preventScroll聚焦。
- `assets/style.css`：新增24px scroll margin，避免焦點框與長文起點貼住視窗邊緣。
- `tests/inspiration-handoff.test.cjs`／`inspiration-handoff-browser.cjs`：先red後green、三情境及生命週期；`discovery-browser.cjs`改驗新的可閱讀標題落點，保留其他斷言。
- `reader-browser.cjs`：新增可驗值的optional `READER_ENGINE`，未設定仍跑原三引擎，沒有刪除任何閱讀斷言；兩個本輪workflow提供預覽、隔離診斷及正式驗收。
- `SITE.md`：加入本輪維護索引。

| 尺寸／狀態 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440 | [焦點留在情境](before/guide-1440.png) | [焦點接到卡片](after/guide-chromium-1440.png) |
| 手機390 | [卡片與焦點分離](before/guide-390.png) | [可直接閱讀](after/guide-chromium-390.png) |
| 長文字 | — | [320px完整長標題](after/long-title-chromium-320.png)／[WebKit超一屏標題起點](after/oversized-title-webkit-390.png) |

抽卡是隨機，前後案例可能不同；比較的是焦點連續性，不把不同卡片高度當成版面提升。重複長文字圖片是受控測試fixture，沒有加入案例庫，也不是作者成果。[空卡組](after/empty-guide.png)亦為受控單檔目錄；該fixture略builtAt，所以底部日期為undefined，非正式站資料。

## 指令與實際結果

```sh
node --test tests/*.test.cjs
node --test tests/inspiration-handoff.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
git diff 1693505 --check
python3 scripts/preview.py /tmp/inspiration-preview/ai-agent-use-cases
python3 -m http.server 8136 --directory /tmp/inspiration-preview
NODE_PATH=<cloud-tools>/node_modules node tests/inspiration-handoff-browser.cjs
READER_ENGINE=webkit NODE_PATH=<cloud-tools>/node_modules node tests/reader-browser.cjs
```

預覽網址：`http://127.0.0.1:8136/ai-agent-use-cases/`。本機只建置檔案，實際瀏覽在GitHub Actions。Repo沒有獨立lint、TypeScript或npm build；語法檢查不冒稱lint／type check，Python preview不等於正式Jekyll。

基準164／165通過，唯一原有失敗是audit共用來源固定預期19、實際20（既有PR #78處理此類問題）。新增5項測試先全部ERR_ASSERTION失敗、修正後5／5；全套169／170，仍為同一原有失敗。[基準](checks/baseline-unit.log)、[red](checks/red.tap)、[最新單元](checks/unit.tap)。workflow只容許唯一相同測試名、ERR_ASSERTION及actual20／expected19，其他失敗仍擋下，沒有宣稱全套全綠。所有JS語法、靜態build及基準至HEAD diff-check通過；保存log僅清除尾空白。

[39763951477](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39763951477)的本輪必要流程：Chromium1440／390／320、Firefox390、WebKit390，共423條目、零缺項；5次主要axe WCAG A/AA掃描零違規、pageerror空。長標題可容納者完整可見，超一屏者起始y約48px、高1843–3533px，正常垂直閱讀，無橫溢出。[五配置原始報告](checks/preview-report.json)。不是完整WCAG認證。

三種具體自動化模擬走查：
1. 新訪客選工作（Enter）→新卡標題→Tab進同卡控制項→Enter閱讀→Escape精確回同標題→抽下一張（Space）。
2. 旅遊＋生活＋Grok Bot共14筆→閱讀→公開來源筆記新頁→Escape回原卡→直鏈及重整仍保留三條件。既有reader另實開Zenn來源網址；沒有把來源筆記當作者原帖或外部成果驗證。
3. 待查＋無命中字詞→空結果→修改關鍵字→空卡組說明→重設恢復；受控單檔目錄再以實際guide選到空集合。[四生命週期](checks/preview-lifecycle.json)：loading query→query；error／partial query→results-count；empty→draw-status。

既有discovery三尺寸、分享失敗手動復原、網路失敗／重試、空目錄、組合搜尋復原均通過。[摘要](checks/discovery-summary.log)。reader Chromium三尺寸、Firefox390及423條／3137節／442行頁首證據完整性通過，[摘要](checks/reader-summary.log)、[完整性](checks/reader-corpus.json)。

該完整job最後在WebKit1.56的PR／UC-005導航page crashed，因此job仍是失敗，不算整批成功。隔離run39765693299亦重現。再以[39766193773](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39766193773)比較：完整1693505原版在同一1.56.1環境、同UC-005導航亦page crashed；匹配1.64.0 image/package的新版完整WebKit reader、search-recovery及3項reader axe均通過。[基準錯誤](checks/webkit-baseline-webkit-reader-error.log)、[新版摘要](checks/webkit-modern-summary.log)、[新版axe](checks/webkit-modern-reader-accessibility.json)。兩邊oom／kill計數0，根因未定，不宣稱已修復舊WebKit。

基準與預覽同為421來源檔／423條目，只有UC-362研究補充不同，UC-005 SHA256一致；這不是完全相同資料的控制實驗，只能稱故障在起始基準可重現。[資料差異](checks/baseline-corpus-difference.json)。正式驗收使用匹配1.64.0瀏覽器環境。

效能僅有雲端同機靜態server導航：五配置DOMContentLoaded14.8–188ms、load19.3–189ms，非正式網路速度、全文ready或改善幅度；沒有Lighthouse分數。改動兩資產gzip估算合計+210 bytes，產品無新請求。[大小估算](checks/asset-size.json)。沒有真人滿意度、留存／轉換率、實機、原生IME或完整輔具認證。

## 獨立審查、環境與保留

主角色唯一實作／整合，獨立角色唯讀審查程式、測試、前後桌面／手機／長文字圖與原始報告，獨立21相關單元通過。其建議已加嚴red／原有失敗識別、長文字可見性、載入輸入fixture與diff檢查；最終結論「可合併，沒有產品或視覺阻擋」。它親讀原版崩潰及新版1.64完整WebKit成功證據，沒有把原有失敗隱藏。正式發布需另驗後才宣稱完成。

起始1693505，原目錄分支`improve/search-recall-recent-workflows-and-tokenization`的`assets/app.js`與`tests/search.test.cjs`未提交修改完整保留；隔離`/tmp/ai-discovery-20261022`。無適用AGENTS.md，已讀README、SITE、歷史規則、近期QA、Jekyll/catalog/preview/workflow；Pages為legacy/main根目錄，未新增.nojekyll。開始研究PR #79與維護PR #78均不混入。後續主線研究正常merge，未reset、未強推或覆蓋協作者內容。

使用OpenAI Docs skill與[官方設定說明](https://learn.chatgpt.com/docs/config-file/config-basic)。設定檔為`gpt-6.1-sol / medium`，無法驗證或切換主對話runtime，不宣稱帳號最高設定；獨立角色請求`gpt-6-astra / ultra`也不當成runtime證明。僅既有訂閱工具與授權GitHub Actions，無另付費API／credits；未操作個人GUI或本機瀏覽器。

中間失敗保留：原ubuntu依賴安裝慢、39761020529 apt索引5分鐘逾時；之後用固定預裝瀏覽器容器與測試字型。39762240019 shell heredoc縮排、39762464522容器Git安全目錄、39762729052測試誤設top<200、39762979285 Firefox容器帳戶，均修正後才驗，不算成功。39763432026程式化fill未帶互動事件，原版／新版arrival同樣會導入；改click＋fill代表實際輸入，未修改產品arrival。被取代39760167735最後取消。字型與帳戶處理僅限雲端驗收，不增加產品外連、不覆寫HOME或改本機帳戶。

未解決風險：原有audit計數斷言、舊WebKit1.56的UC-005崩潰。下一輪最值得做：定位這個可重現的舊WebKit閱讀故障，先確認支援範圍與根因。
