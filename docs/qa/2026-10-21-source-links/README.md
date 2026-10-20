# 正文來源網址：保留括號與完整檔名

基準：2026-10-21，`origin/main` `90f400f`。在 `/tmp/ai-source-links-20261021` 的獨立分支實作；原工作目錄分支與 `assets/app.js`、`tests/search.test.cjs` 未提交修改保留，其他工作樹未動，起始無 open PR。已查上層／repo AGENTS.md（無適用檔）、README、歷史規範、Jekyll catalog／preview／workflow 與近期 QA。

目標讀者是找到研究案例後，想查閱原始產物與證據限制的人。正式站雲端桌面基準實際讀 UC-161，兩個不同來源「公開CSV」「補檔紀錄」都變成同一截短網址，`/llm-alignment-summary...` 檔名成為正文殘字。根因是正文解析器在 URL 的第一個右括號就結束連結，未辨識原網址中的 `(copied%20from%20VM)`。這是本庫產生錯誤連結，不以外站 HTTP 回應推測。基準[39488591933](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39488591933)來源觀察已記錄真實錯誤，該次 axe 因測試 context 用法錯誤失敗，未算通過。

兩案：A 只將兩筆網址括號編碼，成本低但後續資料會重犯；B 修正文 destination 的成對括號解析，略增測試成本，可保護所有詳情頁。採 B。只支援既有簡單行內 Markdown 加平衡／跳脫括號，未宣稱完整 CommonMark。

驗收：兩個原始來源完整且互異、沒有路徑殘字；HTTP(S)限制、text-node渲染、code文字、新頁安全屬性、GitHub相對來源解析維持；空destination不偽裝成可用來源；桌面1440與手機390來源實際新頁開啟、直鏈重整、Escape返回、焦點及無水平溢出。原有搜尋／組合篩選／空結果／長文／錯誤復原回歸必須通過。本輪不改來源檔、證據分類、計數、搜尋或框架，無依賴、追蹤、cookie、登入或第三方資料傳輸新增。

## 實作與驗證

- `assets/app.js`：小型 destination 掃描器辨識多層括號及跳脫括號，其他內容仍文字節點，所有來源經 `safeLink`。
- `tests/source-links.test.cjs`：真實UC-161、嵌套／跳脫／編碼／query／hash、相鄰連結、不完整與空網址、危險協定與code、相對及裸來源。
- `tests/source-links-browser.cjs`：雲端前後網址、殘字視覺、鍵盤焦點、新頁來源、axe、直鏈重整、資料完整性。
- `.github/workflows/source-links-qa.yml`：固定舊基準重現失敗、靜態預覽、三引擎reader回歸與正式Pages資產比對。

指令：`node --test tests/*.test.cjs` 基準127/127、最終132/132。先寫新增測試後舊版失敗（[red-unit.tap](red-unit.tap)）；修正後通過。逐檔 `node --check assets/*.js tests/*.cjs`（以shell逐檔執行）、`git diff --check`、`python3 scripts/preview.py <output>/ai-agent-use-cases`。無獨立lint、TypeScript或npm build，未以語法檢查冒稱lint。Python預覽模擬Liquid，正式Jekyll／Pages另驗。

獨立審查角色未負責實作，唯讀VM比對全庫393個Markdown檔（395條目）：只有UC-161兩條href及其殘字改變，其餘DOM完全一致；原始資料零修改。發現空target自連結與CI漏裝引擎，均已修正並重驗。主角色是唯一整合與寫入者。

模型／環境：主對話沒有可核實或切換的runtime模型ID／推理設定，不能聲稱已用帳號最強模型。依使用者要求，獨立設計與review透過協作工具請求 `gpt-6-astra / ultra`，不把請求當作runtime證明。使用 OpenAI Docs 技能與[官方設定參考](https://learn.chatgpt.com/docs/config-file/config-reference)；文件不是本帳號權限證明。只用既有訂閱工具、授權目錄、Git/SSH與GitHub Actions，無付費API或個人GUI／本機瀏覽器操作。

## 雲端驗收與截圖

完整預覽驗收[39488938321](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39488938321)通過（產品 `30acb2e`，後續產品檔未再修改）。正式體驗：[UC-161直鏈](https://richardhan.github.io/ai-agent-use-cases/?case=UC-161)。本機可選擇 `python3 scripts/preview.py /tmp/source-preview/ai-agent-use-cases`，再以 `python3 -m http.server 8150 --directory /tmp/source-preview` 開啟 `http://127.0.0.1:8150/ai-agent-use-cases/?case=UC-161`。

正式首頁／旅遊搜尋＋生活篩選／來源新頁／分享／Escape返回基準[39488492724](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39488492724)在1440與390通過；395條目、零缺項、兩次axe皆0。Markdown原文外站請求當次429，不聲稱所有來源可讀。後續來源驗收以實際URL開啟核對，不保證外站永久可用。

未驗真人喜好、轉換率、實體手機／輔具或完整WCAG認證。沒有提供Lighthouse分數或加速宣稱。下一輪最值得處理首次全文載入成本，保留直鏈優先及缺項復原；本輪達標即停。

獨立review最終確認：132/132單元通過，沒有剩餘必修；不完整destination保留可見原字，其中裸URL仍沿用既有auto-link規則，未宣稱全為不可點文字。來源browser驗證的是新頁URL，未測外站內容可讀性。`app.js` gzip由47,855增為48,150 bytes（+295 bytes），是本機估算，不是載入速度量測。

新測試工具的兩項錯誤已修正：axe需要明確browser context；原有reader regression需要安裝Chromium／Firefox／WebKit。失敗紀錄保留於Actions，不當成網站原有失敗。嘗試建立PR時GitHub GraphQL回覆 `Unauthorized: As an Enterprise Managed User, you cannot access this content (createPullRequest)`；依使用者既有直接push／merge授權，在完整驗收後使用正常Git merge＋SSH push，無強推，不切換API身分。


### 完整預覽驗收

132/132單元、所有JS語法、舊基準失敗重現、靜態preview build通過。來源兩尺寸完整URL與兩個不同新頁皆正確；395條目、零缺項、零pageerror與水平溢出。保留的來源／discovery／reader／分享報告共26次修改後axe掃描皆0；未當成完整WCAG認證。

原有 `discovery-browser.cjs`、`reader-browser.cjs`、`case-share-browser.cjs`通過：Chromium1440／390／320、Firefox390、WebKit390閱讀；包含長內容、證據／待查狀態、鍵盤返回與焦點、缺資料／腳本／來源錯誤及復原。全庫395條目、2,802章節、414行證據保留（[資料檢查](reader-corpus.json)）。

三種具體模擬情境均在桌面1440與手機390走完（[原始紀錄](journeys.json)）：

1. 首訪者搜尋旅遊＋生活，閱讀來源、分享與拒絕後手動複製，再試成功。
2. 接收者開啟案例直鏈、重整、關閉與原生Back，保留查詢條件。
3. 長文讀者經空結果復原，組合五類篩選＋最近核對排序，分享後結果集合一致。

分享的受控拒絕為測試注入，並非真人權限故障；模擬流程不代表真人喜好或轉換率。這次旅遊原文新頁另一次HTTP200，與初次429分開記錄，不推論所有外站皆可用。UC-161兩來源只核對新頁完整URL，沒有宣稱內容已可讀。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440 | [來源殘字](before/source-1440.png) | [完整來源](after/source-1440.png) |
| 手機390 | [來源殘字與擠斷](before/source-390.png) | [完整來源與焦點](after/source-390.png) |

主角色已逐張目視比較：兩來源各自顯示短標籤，沒有遺失檔名殘字；手機焦點外框清楚，限制說明與原始核對段落完整可讀。[修改前報告](before/report.json)／[修改後報告](after/report.json)。

### 合併與正式發布

正常merge commit `5cb0014c90e7dc7663151a26c15ec4bfecc294e5` 已以SSH push到main；未強推。最後預覽workflow版[cfa788d／39488981294](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39488981294)亦完整通過。正式[Pages部署39490059202](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39490059202)成功；排隊後共7分54秒完成。

[本輪主線驗收39490060134](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39490060134)成功：132/132單元、preview／完整原有回歸、正式app.js內容與checkout完全一致、正式1440與390來源直鏈／新頁／重整／Escape返回通過。兩尺寸395條目、零缺項／pageerror／水平溢出、兩次正式axe皆0。[正式報告](published/report.json)、[桌面](published/source-1440.png)、[手機](published/source-390.png)。主角色已目視正式手機截圖，與驗收後圖一致。

UC-161兩個完整來源另以公開HTTP HEAD當次皆200（[原始紀錄](source-head.json)），未下載／驗證CSV內容，也不保證永久可用。這是授權repository shell的HTTP檢查，與雲端browser的新頁URL測試分開。

**主線其餘檢查沒有全部綠燈，以下限制保留，不弱化斷言：**

- 部署完成前，[Return visibility](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39490060238)、[Search relevance](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39490060131)、[Home search entry](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39490059897)、[Related reading](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39490060135)、[Search context](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39490059845)、[Missing shared case](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39490059801)六項在資產一致性等待／斷言失敗；日誌核對均為尚未更新的app.js，不宣稱已執行其後正式流程。
- 另一[Improvement round](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39490060237)preview通過，正式desktop／390完成，但320完整載入因部分來源未載入而未完成。其保存network diagnostics有391次HTTP429、2次503（[摘要](published-round-limitation.json)），畫面正確呈現部分來源警告；不能把它算成正式全庫流程通過，也不能只憑這些狀態判定產品程式回歸或所有失敗的根因。本輪正式來源測試於兩尺寸另已完成395條目、零缺項。
- 部署成功後嘗試 `gh run rerun 39490060238 --failed`，API回覆 `cannot be rerun; Must have admin rights to Repository.`，停止重複相同權限操作。沒有切換身分、削弱測試或聲稱整批主線CI全綠。其他自動主線job以Actions實際狀態為準，非本輪追加驗收。

下一輪優先降低首次全文請求量，並讓正式站QA在Pages部署完成後排程、限制並行全文掃描；這次排隊與429／503是具體證據。此輪來源修正已達驗收標準，停止追加產品修改。
