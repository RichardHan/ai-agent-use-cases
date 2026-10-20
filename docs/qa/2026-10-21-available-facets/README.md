# 先找到目前有結果的工具與分類

## 基準與範圍

2026-10-21（台灣時間）從 `origin/main` 72b7ff9 建立獨立分支 `improve/available-facets-20261021`。主工作目錄保留 `assets/app.js`、`tests/search.test.cjs` 兩項未提交修改，未切分支、stash、reset或覆寫；其他工作樹維持原狀。repo及上層未找到適用AGENTS.md，已讀README、歷史維護規則、SITE及近期QA。起始沒有open PR。

設定檔可讀為 `gpt-6.1-sol / medium`，無法證明主對話實際模型或切換執行中模型，也無法核實本帳號最高可用模型。[官方設定參考](https://learn.chatgpt.com/docs/config-file/config-reference)不是帳號權限證據。獨立只讀設計與審查角色透過現有協作工具請求 `gpt-6-astra / ultra`，主角色是唯一修改／整合者；未另用付費API或購買credits。使用者最後已明確授權此工作路徑，使用檔案、git、既有headless測試工具及GitHub runner，未控制個人GUI。Orca CLI因無法解析app路徑而停止使用。

## 實際問題與兩案取捨

目標使用者是已有問題方向、再以工具／分類縮小範圍的新訪客。正式站1440及390px實際走完首頁、搜尋「旅遊」、生活篩選、詳情、原始Markdown連結HTTP200、關閉返回並保留查詢。固定基準含395條目、246個不同分類，分類選單另有「全部分類」。旅遊＋生活16筆分散於13分類；舊字序在首個有結果分類前有40個零筆分類。大量不適用選項增加掃描範圍，雖既有筆數可辨識，仍須穿過零筆選項。

- A（採用）：原生工具與分類選單分成「有符合條目（X個選項）」與「目前0筆（Y個選項）」，各組維持zh-Hant字序，全部項永遠第一。成本低，保留平台操作、全部分類及零筆選項。
- B：新增分類名稱搜尋器。適合已知名稱的精準查找，但多一個與全文搜尋容易混淆的狀態、手機高度、輸入法及無障礙維護成本。

預期改善是先看與問題有交集的選項；不宣稱真人效率、喜好或轉換率已提高。不改案例／分類資料、搜尋語意、計數口徑、資料載入架構或框架；不新增追蹤、cookies、登入、第三方傳輸功能。未新增難度或捏造分類。

## 驗收與三種模擬情境

1. 任務探索：旅遊＋生活先看到13個有結果分類，233個零筆分類仍可選。全部項不進組計數；原始value、數字與組內字序正確。Linux原生ArrowDown／Tab選到首個有結果分類，焦點及條件不被重新排序覆寫。
2. 深入閱讀：選分類、case與reviewed；詳情直鏈重整、原始Markdown新頁、關閉與Back保留條件。筆數沿用排除自身維度的facetCounts，不把同維其他分類錯算為0。
3. 找不到內容：零筆分類、長查詢及未知分享工具／分類不消失；空結果仍可復原、清除篩選。載入中不顯示假0組，部分失敗保留提示，補讀保留選取值且清除舊組外殼，全失敗可重試。

Chromium1440／390／320、Firefox390、WebKit390檢查，組合篩選與空結果執行axe WCAG A/AA（含對比），並檢查水平溢出。這是模擬走查，不是真人研究。原生macOS無頭選單按鍵無法可靠操作，報告明記未驗證，改以Linux雲端作為鍵盤門檻；不將selectOption當鍵盤通過。

## 測試與變更

- `node --test tests/*.test.cjs`：基準及修改後皆125／125通過，無原有失敗，見unit TAP。
- 新增 `tests/available-facets-browser.cjs` 對舊版先失敗：缺少預期的optgroup（見red.log）。修正後檢查真實選項集合、實際facetCounts、五配置及載入復原。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done` 與 `git diff --check` 通過。repo無獨立lint、TypeScript或npm build，不以語法檢查冒稱lint。
- `python3 scripts/preview.py /tmp/available-facets-preview/ai-agent-use-cases` 成功，沿用GitHub Pages子路徑；正式Jekyll部署另驗。
- 產品只改 `assets/app.js`：新增原生分組、保留selected值、populate清舊組、提示文字。新增browser測試、`.github/workflows/available-facets-qa.yml`及QA／SITE維護紀錄。
- 本機補充[同步render＋layout量測](render-timing.json)：390×900、相同catalog/HTML/CSS，舊app.js以72b7ff9攔截對照；交替旅遊／比價＋生活，暖機10次後20次樣本。舊／新中位數9.0／9.7ms，p95 17.7／10.1ms。單次、未節流的本機診斷有雜訊，不能推稱更快或代表手機真實載入／輸入延遲。
- app.js：155,011 → 155,905 bytes；gzip（mtime=0）47,327 → 47,595 bytes，增加268 bytes。這是檔案計算，不是實測載入速度或Lighthouse分數。

本機第一次流程曾因GitHub來源HTTP429中止；保留外站限制後，實際點原始Markdown新頁並驗證URL，後續取得HTTP200。外部HTTP狀態記錄但不把外站限流冒稱產品錯誤。雲端紀錄另列。

## 預覽、截圖與限制

```sh
python3 scripts/preview.py /tmp/available-facets-preview/ai-agent-use-cases
python3 -m http.server 8136 --directory /tmp/available-facets-preview
# http://127.0.0.1:8136/ai-agent-use-cases/?q=旅遊&scenario=生活#explore
```

前後截圖使用同一基準72b7ff9與同一旅遊＋生活條件，另比較選取第一個分類後的結果。原生彈出選單不一定能由頁面截圖捕捉，因此保留實際DOM選項、分組、筆數與原生按鍵報告，不繪製假選單當截圖。

未驗證實體手機、真人螢幕閱讀器或轉換率；axe不是完整無障礙認證。未量測Lighthouse。下一輪優先改善首次全文載入成本，保留分享直鏈先讀、完整搜尋與失敗復原。

GitHub建立PR遭Enterprise Managed User權限拒絕；既有SSH push可用，使用者明確授權直接push與合併，因此採驗收後從最新遠端確認可快轉再非強制更新main，不繞過branch protection。

## 獨立審查與雲端驗收

獨立只讀角色（請求gpt-6-astra／ultra）review產品、測試及workflow，無必修發現；另獨立以真正filterEntries逐項核對四種查詢的每個option筆數、247選項集合及未知分享文字安全。實際攔UC-001後補讀，蒙特婁＋旅遊／消費研究由0筆組移到1筆組，selected／URL／reviewed保留、無舊組外殼或pageerror。目視1440及320截圖無重疊／溢出。其Home按鍵自訂假設在同頁的分組與未分組對照皆不成立，未列產品bug。原生彈出選單的外觀未假稱截圖已驗證。

[預覽雲端39454419889](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39454419889)成功：125 unit、全部JS語法、靜態預覽、Chromium1440/390/320＋Firefox390＋WebKit390、原生ArrowDown/Tab五配置全通過；新流程10次axe掃描0違規，既有sort-reset五配置及載入／重試回歸亦通過、axe共10次0違規，原始Markdown HTTP200。原始數據：[新版](preview-available-facets/report.json)、[基準](preview-before/report.json)、[排序回歸](preview-sort-reset/report.json)。

同一旅遊＋生活條件，選第一個分類：舊版二手分類0筆，新版日常提醒分類1筆。這是固定流程比對，並非暗示兩張圖的分類值相同。

| 尺寸 | 舊版選第一個分類 | 新版選第一個分類 |
| --- | --- | --- |
| 桌面1440 | [截圖](preview-before/first-choice-chromium-1440.png) | [截圖](preview-available-facets/first-choice-chromium-1440.png) |
| 手機390 | [截圖](preview-before/first-choice-chromium-390.png) | [截圖](preview-available-facets/first-choice-chromium-390.png) |
| 窄螢幕320 | [截圖](preview-before/first-choice-chromium-320.png) | [截圖](preview-available-facets/first-choice-chromium-320.png) |

尚未選分類的同狀態截圖也保留於上述兩資料夾。主角色實際目視桌面及手機前後圖，提示換行、選單與條件標籤無重疊或水平溢出；不宣稱目視了原生popup。正式部署驗收另補。

獨立審查已核對雲端原始報告並給出可合併結論（審查產品eca98e8）：未發現功能退化、相容性、資料外洩或設計阻擋；預覽兩套流程合計20次axe零違規。


## 正式發布結果

已以非強制、可快轉push合併至main（產品c963230，origin/main原基準72b7ff9），無衝突。[Pages39455080794](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39455080794)建置與部署成功；[正式站驗收39455082694](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39455082694)全部成功：公開app.js逐字符合checkout，重跑完整預覽、既有sort-reset及正式站Chromium1440/390/320三情境、原生鍵盤、6次axe零違規、原始Markdown HTTP200。主角色目視正式手機截圖；[正式站報告](published/report.json)、[手機截圖](published/first-choice-chromium-390.png)、[桌面截圖](published/first-choice-chromium-1440.png)。

[直接試用正式站](https://richardhan.github.io/ai-agent-use-cases/?q=旅遊&scenario=生活#explore)。原工作目錄仍是原分支、原兩項未提交修改，本輪獨立工作樹另存。

不能宣稱所有歷史workflow皆綠：[發布狀態摘要](publication-summary.json)列四個在Pages部署前就因公開資產不符而逾時的既有job；另Reader controls正式站Chromium四尺寸通過後，Firefox等第一張結果卡逾時，未計通過。嘗試重跑失敗jobs遭GitHub拒絕，需repo admin權限；未切帳號／繞過權限。部署後以既有腳本補驗時收到GitHub Pages限流頁，故停止擴大重跑，未把缺DOM／缺條目的後續斷言當作通過；不公開含客戶端IP的回應HTML或完整日誌。這些限制與本輪新增正式站QA通過分開記錄。

下一輪以減少首次全文載入請求為優先，同時保留完整搜尋、分享直鏈先讀及失敗復原；本輪未改動載入架構。

發布證據複核補充：同一39455082694的[排序回歸報告](published-sort-reset-report.json)原始Markdown請求HTTP429；新增正式站流程的來源請求HTTP200。兩套流程通過不代表所有來源在所有時刻可讀。額外home-entry本機重驗另於等待詳情對話框逾時，未計通過，未確定其個別根因；不能把所有失敗都斷言為限流造成。合併後其他既有job的[狀態快照](ci-state.json)包含尚執行中的項目。
