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

結果將在驗收完成後補入。正式體驗：[UC-161直鏈](https://richardhan.github.io/ai-agent-use-cases/?case=UC-161)。本機可選擇 `python3 scripts/preview.py /tmp/source-preview/ai-agent-use-cases`，再以 `python3 -m http.server 8150 --directory /tmp/source-preview` 開啟 `http://127.0.0.1:8150/ai-agent-use-cases/?case=UC-161`。

正式首頁／旅遊搜尋＋生活篩選／來源新頁／分享／Escape返回基準[39488492724](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39488492724)在1440與390通過；395條目、零缺項、兩次axe皆0。Markdown原文外站請求當次429，不聲稱所有來源可讀。後續來源驗收以實際URL開啟核對，不保證外站永久可用。

未驗真人喜好、轉換率、實體手機／輔具或完整WCAG認證。沒有提供Lighthouse分數或加速宣稱。下一輪最值得處理首次全文載入成本，保留直鏈優先及缺項復原；本輪達標即停。

獨立review最終確認：132/132單元通過，沒有剩餘必修；不完整destination保留可見原字，其中裸URL仍沿用既有auto-link規則，未宣稱全為不可點文字。來源browser驗證的是新頁URL，未測外站內容可讀性。`app.js` gzip由47,855增為48,150 bytes（+295 bytes），是本機估算，不是載入速度量測。

新測試工具的兩項錯誤已修正：axe需要明確browser context；原有reader regression需要安裝Chromium／Firefox／WebKit。失敗紀錄保留於Actions，不當成網站原有失敗。嘗試建立PR時GitHub GraphQL回覆 `Unauthorized: As an Enterprise Managed User, you cannot access this content (createPullRequest)`；依使用者既有直接push／merge授權，在完整驗收後使用正常Git merge＋SSH push，無強推，不切換API身分。
