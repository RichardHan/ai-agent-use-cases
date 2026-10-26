# 2026-10-24 比較案例後接續長文

本輪由主角色單一整合，獨立角色唯讀設計與程式審查。從151a432另建工作樹，保留原目錄assets/app.js、tests/search.test.cjs未提交修改；無衝突整合main至6d2a71b，保留協作者方向鍵選文修正及研究資料。

模型限制：本機config核對時為gpt-6-astra／low，不代表本對話實際runtime；沒有可核實或切換主角色metadata的介面，也未修改使用者全域設定。獨立角色明確請求gpt-6-astra／ultra，但不冒稱其實際runtime已驗證。核對使用OpenAI Docs技能。只使用既有GitHub雲端runner瀏覽，未啟動個人電腦瀏覽器／GUI或另付費API。

## 問題、方案與範圍

目標讀者：從長篇案例定位到原文限制、比較其他案例，再用瀏覽器上一頁繼續閱讀的人。既有閱讀紀錄亦曾列出回訪段落問題。原showDetail會重建DOM、收合原文並將scrollTop設0；既有history測試只驗ID／title，沒有驗閱讀位置。

- A：只恢復scrollTop。成本低，但原文收合時高度會被截短，不能回到原段落。
- B（採用）：每個history visit獨立記錄展開狀態、目錄查詢、閱讀錨點、可見焦點及表格橫向位置；成本為局部JS與針對性的回歸測試。只在本頁記憶體保存最近12個離開快照，網址/history只帶識別key，不放正文或查詢副本。原文／查詢不匹配便不套用舊錨點。

驗收：Back／Forward接續段落；同案不同visit不互蓋；搜尋→詳情→Back結果→Forward仍可接續並保留caseReturn焦點；離屏標題不把閱讀拉回上方；手機表格保留欄位；首次、上一則／下一則新visit及reload仍從篇首。保持base path、直鏈、來源、空結果與載入復原。

不處理跨reload永久書籤、跨裝置同步、選取文字／剪貼簿備援狀態、案例內容與證據分類、搜尋語意、首次全文請求打包（另有進行中工作樹）。不把模擬走查當真人偏好或轉換提升。

## 基準與驗收進度

正式基準[40078477769](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40078477769)成功：1440與390兩尺寸各447條目全載、旅遊＋生活＋Grok Bot為16筆；詳情、來源新分頁、Escape回原卡、空結果成功。兩次結尾axe零違規；observe模式不含detail／empty狀態axe。主角色已目視桌面／手機首頁及詳情／原文圖。[原始報告](baseline/journey.json)。447是網站條目數，未更改合格計數規則。

起始`node --test tests/*.test.cjs`：211／211通過。新增四個history單元先0／4通過，[red](checks/red.tap)；整合協作者11個測試後`node --test --test-reporter=tap tests/*.test.cjs`為226／226通過，[輸出](checks/unit.tap)。`node --check assets/app.js`及新browser script、`git diff --check`通過。無獨立lint或TypeScript設定，不聲稱執行不存在的檢查。`python3 scripts/preview.py /tmp/reading-final-build/ai-agent-use-cases`完成靜態預覽。

正式重現[40078613078](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40078613078)：UC-005第33段「獨立審查」讀到桌面scrollTop12170／手機19897；下一則→Back均變0、原文收合、目錄查詢清空。[數值](reproduction/report.json)。

## 前後截圖與最終驗收

| 畫面 | 修改前返回 | 修改後返回 |
| --- | --- | --- |
| 桌面1440 | [回到篇首](reproduction/returned-chromium-1440.png) | [接續原段落](preview/returned-chromium-1440.png) |
| 手機390 | [回到篇首](reproduction/returned-chromium-390.png) | [接續原段落](preview/returned-chromium-390.png) |

另有[手機表格右欄與焦點](preview/table-returned-chromium-390.png)、[相關案例返回](preview/related-returned-chromium-390.png)。主角色已實際目視桌面／手機及表格、相關案例圖，維持原品牌與版面。

最終[40079831795](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40079831795)（產品6066bbb、加嚴測試e988d46）success：

- `node --test --test-reporter=tap tests/*.test.cjs`：228／228，0失敗。[雲端輸出](checks/cloud-unit.tap)
- `node --check`全部assets JS與本輪test、`git diff --check`通過；`scripts/preview.py`靜態建置保留`/ai-agent-use-cases/`路徑。
- `SITE_URL=http://127.0.0.1:8190/ai-agent-use-cases/ node tests/reading-history-browser.cjs`：Chromium1440／390／320、Firefox390、WebKit390五配置通過。長文返回anchor偏差皆0px；表格在視窗內top139–162px，窄螢幕scrollLeft160→160；返回焦點是可見表格區。每個history visit獨立，reload清空、搜尋Back／Forward、來源與相關案例焦點成功。[原始報告](preview/report.json)
- 同URL `node tests/page-context-browser.cjs`：五配置各447條完整、旅遊組合16筆，搜尋／空結果／來源新頁／直鏈重整／history及缺項檢查成功；載入早讀、全部失敗後retry、部分失敗後補讀三種受控復原都447條零缺項。[旅程](checks/journey.json)／[復原](checks/lifecycle.json)
- 本輪兩套主要瀏覽共25次axe掃描（含文字對比）零違規、pageerror空，窄螢幕無頁面水平溢出。沒有量測或虛構Lighthouse、實際裝置或轉換率分數；產品未增加網路請求。
- baseline151a432在新browser斷言先失敗「History must restore expanded original research」。[red輸出](checks/browser-red.log)

三個具體情境是：①UC-005目錄找獨立審查，切下一則再Back／Forward；②旅遊＋生活＋Grok Bot進UC-001，Back結果再Forward原文；③UC-400右欄閱讀後以方向鍵切案例再Back，另走相關案例返回。都是模擬檢查，不是真人研究。

獨立審查曾指出頁尾相關按鈕會被快照排除，導致回到底部卻聚焦不可見標題；已保留穩定按鈕並在無效時使用可見關閉控制。另補href／related-id辨識及不明確重複錨點的安全fallback。獨立26項相關單元／VM／語法／diff檢查通過，最終圖片與原始報告完成獨立終審，確認e988d46可合併、沒有剩餘阻擋；另目視390／320表格及WebKit相關案例畫面。

過程限制如實保留：補測時一次測試檔引號編輯錯誤造成223 tests／222 pass／1 fail，修正後228全過，[原輸出](checks/test-edit-error.tap)。初版及補修版雲端皆success，但表格測試的Playwright locator.focus未真正套用preventScroll，數據顯示table在視窗外，[舊報告](checks/superseded-table-check.json)不算完整表格驗收；改DOM focus並加嚴可見／右欄斷言後才以上述最終run認定通過。

## 檔案、預覽與後續

產品只改`assets/app.js`；新增`tests/reading-history.test.cjs`、`tests/reading-history-browser.cjs`、`.github/workflows/reading-final-qa.yml`，維護記錄為本目錄與SITE.md。沒有變更案例、合格計數或原始來源。

可開正式網站，或自行執行`python3 scripts/preview.py /tmp/reading-preview/ai-agent-use-cases`及`python3 -m http.server 8190 --directory /tmp/reading-preview`，瀏覽`http://127.0.0.1:8190/ai-agent-use-cases/`。本輪browser/server只在GitHub runner執行。

限制：只保留同次頁面的最近12個離開快照，不跨reload或裝置；未測實體iOS／Android或完整輔具。下一輪最值得做的是量測並降低首次全文請求成本，先協調既有catalog-bundle工作，避免重複實作。

正式部署已完成；公開browser驗收結果與限制如下。


發布首驗：一般merge193dcf0推送main，Pages40080234021正式Jekyll build／deploy／report成功；五公開資產逐byte一致。正式40080627629的1440／390流程通過，但320在reload後有大量來源缺載，整輪FAIL並保留[原始報告](checks/first-public-failure.json)。未改產品或放寬零缺項斷言，只補網路狀態與requestfailed診斷再核對；不宣稱載入根因已修復。


發布診斷終驗：[40080842629](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40080842629)仍FAIL。1440／390兩配置完整通過，網路錯誤與pageerror皆空、各兩次axe零違規；320初次載入即收到750筆HTTP429回應（含重試），零缺項斷言在line12失敗，後續320與Firefox／WebKit未執行。[完整網路報告](published/report.json)、[正式桌面返回](published/returned-chromium-1440.png)、[正式手機返回](published/returned-chromium-390.png)、[正式手機表格](published/table-returned-chromium-390.png)。這只證明本次收到限流，不能倒推前次根因，也不能代表一般訪客一定遇到；停止密集重跑，沒有放寬斷言或另改載入產品流程。正式全套驗收未完成，三引擎完整通過僅指雲端預覽。

主線193dcf0的Pages [40080234021](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40080234021)與Website QA [40080234696](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40080234696)成功。Reader QA [40080234687](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40080234687)仍在「Shared search should show the result count」失敗，基準40078452992同斷言已失敗；Partial Load QA [40080234653](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40080234653)失敗，較早40078452888亦失敗，但本輪未定位其根因。不能宣稱所有主線CI全綠。[狀態快照](checks/main-ci-status.json)保留檢查時間的實際狀態。
