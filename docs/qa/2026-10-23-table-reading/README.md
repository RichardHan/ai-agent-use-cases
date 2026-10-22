# 原文比較表：保留欄位關係，接回搜尋與列印

狀態：預覽驗收及獨立審查完成，正式發布與驗收待補。

## 問題與兩案

目標讀者是想比較作者各個自動化流程、頻率、產出及自報成本的訪客。正式站[基準39810441232](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39810441232)實走1440與390px首頁、旅遊＋生活搜尋、詳情、來源新頁、返回、直鏈重整、空結果；423筆條目。主角色已目視首頁／結果／詳情與表格圖：UC-400的4欄、6筆Bot資料被renderMarkdown合成一段pipe文字，無table節點。作者歸因和成本需靠讀者自行從分隔符找回。[實際DOM文字與流程](checks/baseline-browser.json)。目前只有此來源檔使用pipe table，不宣稱全庫皆有此問題。

- A（採用）：語意表格＋表格範圍內橫捲，保留原表頭與逐列比較。成本較低；手機需要橫捲，必須一起處理焦點、搜尋命中及列印。
- B：手機改成逐筆資訊卡，適合單筆閱讀，但跨筆比較較弱、重複欄位標籤增加維護與原文核對負擔，成本較高。

驗收：原文每格與作者自述／約數／重用資料限定不改寫；1440／390／320無頁面橫溢；手機鍵盤左右捲動不切案例，Tab／Escape可離開；搜尋成本格時水平與垂直定位可見；直鏈重整／返回／組合篩選／空結果維持；PDF含全部列、費用與來源，列印後還原閱讀位置。長格文字使用受控DOM fixture，不進正式資料。

不處理案例增刪、去重、證據重分類、合格數、搜尋同義詞、載入架構、品牌或框架。維持GitHub Pages legacy/main根目錄與相對base path。未增加產品依賴、追蹤、cookies、登入、儲存或第三方資料傳送。

## 實作及前後畫面

- `assets/app.js`：只辨識表頭＋有效分隔列且每列欄數一致的pipe table，使用安全inline文字節點及連結；不支援／欄數不一致原樣回退，不丟多餘資料。原生thead／tbody／th scope=col，命名可聚焦橫捲region；聚焦其內時排除案例左右鍵快捷切換。
- `assets/reader.js`：原章節名稱提供表格與region名稱；搜尋逐格取原文，不跨欄拼接，定位時帶入右側儲存格。
- `assets/reader.css`：延續紙色／綠色與原字體，欄位分隔、閱讀留白與焦點框；CSS提示不混進原文textContent。列印解除橫捲、固定紙寬、重複表頭、不拆列。
- `tests/table-reading*`與專項workflow：原正式站觀察、red／green、跨瀏覽器三情境、真PDF與既有流程回歸。
- `SITE.md`及本紀錄：保留證據與限制，避免下一輪重做。

| 畫面 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440 | [整段pipe文字](before/table-1440.png) | [保留原表頭四欄](after/table-chromium-1440.png) |
| 手機390 | [欄列混在段落](before/table-390.png) | [區域橫捲與可見焦點](after/table-chromium-390.png) |

[桌面首頁](before/home-1440.png)／[手機首頁](before/home-390.png)為本輪原正式站走查。本輪不改首頁外觀，沒有把隨機卡片差異當改善。

## 驗收指令與實際結果

```sh
node --test tests/*.test.cjs
node --test tests/table-reading.test.cjs tests/markdown-lists.test.cjs tests/search-passage.test.cjs tests/print.test.cjs
for f in assets/*.js tests/table-reading*.cjs; do node --check "$f"; done
git diff 5c9e0e1 --check
python3 scripts/preview.py /tmp/table-preview/ai-agent-use-cases
python3 -m http.server 8163 --directory /tmp/table-preview
NODE_PATH=<cloud-tools>/node_modules node tests/table-reading-browser.cjs
READER_ENGINE=chromium READER_URL=http://127.0.0.1:8081/ai-agent-use-cases/ node tests/reader-browser.cjs
node tests/discovery-browser.cjs
```

本機預覽需以`/ai-agent-use-cases/`base path放置。Repo無npm build、獨立lint或TypeScript設定，JS語法檢查不冒稱lint/type check，Python preview不冒稱正式Jekyll。

起始基準169／170通過，唯一原有失敗是audit的共用來源固定預期19、實際21（既有PR #78未混入）。[原始基準](checks/baseline-unit.log)。新增6項先red（1過、5項ERR_ASSERTION失敗），修正後6／6；全套175／176，仍只同一原有失敗。[red](checks/red.tap)／[第一輪單元](checks/first-unit.tap)。workflow精確限制既有測試名與21／19，其餘失敗仍擋，不宣稱全套全綠。24項table/list/passage/print針對測試全過。

[第一輪雲端39811177855](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39811177855)成功：Chromium1440／390／320、Firefox390、WebKit390，423條目零缺項，10次主要axe WCAG A/AA掃描0違規、pageerror空。[原始報告](checks/first-browser.json)。六Bot與每格文字逐字核對、鍵盤左右捲動不換案例、右側6.50美元搜尋定位、長格與直鏈重整通過。實開X來源新頁只證明瀏覽流程，不代表外部貼文內容已獨立核實。

三種自動化模擬走查（不是真人訪談或偏好／轉換率證明）：
1. 新訪客由首頁搜尋旅遊，組合生活＋Grok Bot，閱讀UC-001後Escape精確返回原卡。
2. 分享UC-400直鏈，核對六Bot的原表頭／欄位，以左右鍵橫捲、開來源並產生PDF。
3. 搜尋6.50開UC-400，定位右側原格，重整仍保留條件；返回後製造空結果並以「修改關鍵字」接回焦點。

[最終預覽39811603751](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39811603751)全部成功。原章節命名表格、五配置與10次axe0再次通過。[最終報告](checks/preview-browser.json)／[單元](checks/preview-unit.tap)。手機390成本格的page.pdf前後、受控beforeprint→print media→screen→afterprint前後，均保留水平340px、垂直4810px及reader-passage-1焦點；這不是實機或原生列印視窗取消驗證。[桌面真PDF](after/uc400.pdf)／[手機尺寸真PDF](after/uc400-mobile.pdf)／[列印第2頁](after/uc400-print-page2.png)／[擷取全文](checks/uc400-print.txt)。已目視重複表頭、來源、限制與欄寬；成本[搜尋定位320px](after/cost-search-chromium-320.png)完整可見。

既有[discovery摘要](checks/discovery-summary.log)：Chromium1440／390／320、鍵盤／抽卡／組合篩選／分享拒絕fallback、網路失敗／retry／空目錄、loading／error／partial全部通過；[reader摘要](checks/reader-summary.log)：同三尺寸、來源／直鏈重整／返回／目錄、單檔缺項／缺可選script／copy.json降級通過。[全庫reader](checks/reader-corpus.json)為423條目／3163原章節／442頁首證據列。

主線710565c的UC-017／045／067三筆研究補充已無衝突merge並保留；整合後175／176仍只同一audit失敗，語法、preview build與diff check通過。[整合結果](checks/integrated-unit.log)。上述雲端預覽是a3a8413，沒有冒稱含後續研究文字；正式站另核對。額外Tab離開表格的明確斷言只加在測試，將隨正式QA驗證，未改產品。

## 獨立審查與環境

主角色唯一實作／整合者，獨立角色唯讀審查與驗證。獨立24項針對單元通過；以同一輕量DOM harness比較起始5c9e0e1與首版135e815的421個Markdown來源檔，420檔輸出完全相同、唯一變動UC-400。這是來源檔層級比較，不冒稱421個網站條目或browser全庫DOM。已指出並納入左右鍵衝突與逐格搜尋定位，另要求雲端手機尺寸橫捲後的PDF／列印媒體還原檢查；最終結論「可合併，未發現需阻擋的產品問題」；正式發布及新增Tab離開斷言另驗。

起始5c9e0e1，無適用AGENTS.md。已讀README、SITE、歷史維護規則、近期QA、preview/catalog/Jekyll與部署workflow。隔離`/tmp/ai-website-20261023`，分支`improve/reading-access-20261023`。原工作樹`assets/app.js`與`tests/search.test.cjs`未提交修改保留，不reset、不強推；既有研究PR #79／#80、維護PR #78不擅自整合。

依OpenAI Docs skill及[官方設定參考](https://developers.openai.com/codex/config-reference/)核對，本機設定檔為`gpt-6.1-sol / medium`，無法讀取或切換主對話實際runtime，不宣稱已使用帳號最強設定；獨立角色指定可用`gpt-6-astra / ultra`亦非runtime證明。僅既有訂閱工具及授權GitHub Actions；本機僅repo與shell工作，不操作個人GUI／本機瀏覽器、無另付費API或購買credits。實際瀏覽、截圖、PDF與字型安裝均在GitHub雲端。PDF以PDF skill作唯讀的文字擷取及PNG目視檢查。

未驗證：真人留存或滿意度、真手機與輔具完整認證、完整GFM規格（對齊與複雜跳脫不宣稱全支援）。成本仍為作者自報，未獨立核帳。效能只有雲端本機靜態server導航量測：第一輪五配置DOMContentLoaded 16.6–50.0ms、load 22.1–52.0ms，非全文ready或正式網速。三資產gzip估算共增加1,370 bytes，產品無新請求。[大小估算](checks/asset-size.json)。無Lighthouse分數，不推論正式網速提升。

下一輪最值得做：延續既有量測，降低首次全文載入請求成本，保留單篇早讀及部分失敗復原。
