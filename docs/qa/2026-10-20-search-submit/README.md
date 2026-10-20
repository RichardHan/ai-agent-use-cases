# 2026-10-20：輸入後明確抵達搜尋結果

## 問題與選擇

對象是已知道想解決什麼問題、輸入關鍵字與組合篩選後準備閱讀的新訪客。

基準 main `9fec688`，沒有適用 AGENTS.md；已讀 README、SITE.md、Jekyll/Pages 設定與近期 QA。原工作目錄仍在 `improve/search-recall-recent-workflows-and-tokenization`，`assets/app.js` 與 `tests/search.test.cjs` 的未提交修改保留不動。fetch 後在 `/tmp/ai-result-pagination` 建立獨立分支 `improve/result-pagination-20261020`；這是暫用分支名，本輪沒有實作分頁。起始沒有開啟 PR。

[雲端正式站基準 39426998348](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39426998348)：搜尋旅遊＋生活＋Grok Bot 有 12 筆符合，但 Enter 後焦點仍在 query，390×844 的 results-count top=1268.83px、320×740 top=1407.41px；桌面 1440×1000 top=657.5px。程式只取消 submit，沒有提交按鈕。這是操作檢查，沒有真人偏好或轉換率推論。

- A（採用）：保留即時搜尋，在搜尋輸入列新增「查看結果」；Enter 與按鈕共同聚焦並捲到結果。成本低，沿用現有結果摘要及閱讀流程。
- B：改成提交才更新搜尋。較高的行為與回歸成本，也失去即時筆數回饋，本輪不採用。

## 實作與驗收

提交只做導覽，不再 render，因此不重建結果、不清除分享狀態。query、五種 facets、sort 與 history.state 保留；fragment 明確設為 #explore，replaceState 不增加歷史。按鈕位於搜尋輸入列，不在 details 內，手機收合篩選仍可用；手機觸控高度至少 44px，鍵盤順序為輸入→查看結果→篩選。初始與重新載入停用；以 discoveryReady 解鎖，故真正零符合與部分成功載入可提交，全敗不能偽裝成完成。載入中提交不排隊，不在完成後移焦。composition state 避免確字期間提交。

驗收項目：

1. 桌面 1440、手機 390／320 的 Enter／按鈕抵達可見結果摘要及鍵盤焦點；輸入與篩選仍即時更新。
2. 所有 facets、最近核對排序、URL search、結果順序與 history.state/length 保留。
3. 空結果可抵達並復原；載入中、全敗、部分失敗各有正確提交狀態。
4. 詳情開啟、關閉返回、帶條件直鏈重新整理與來源 HTTP 檢查。
5. Chromium／Firefox／WebKit、axe WCAG A/AA（含文字對比）、水平溢出；既有 reader regression 覆蓋長文與來源排版。

三個模擬情境：手機找旅遊並組合工具/情境後按 Enter 閱讀；找不到關鍵字時前往零結果並清除條件；從分享直鏈重整、關閉返回，再按來源與排序挑選下一篇。僅模擬走查，未宣稱真人喜歡。

不處理案例文字、來源分類、資格數、重複候選、搜尋詞彙或載入架構；不新增追蹤、儲存、登入、cookie 或對外傳送查詢的功能。

## 指令、審查與限制

- `node --test tests/*.test.cjs`：基準 113/113；新增提交測試先 0/3，修後全庫 118/118。見 baseline-tests.txt、red.tap；最後雲端 unit.tap 保存於 workflow artifact。
- `for file in assets/*.js; do node --check "$file"; done`：通過。
- `python3 scripts/preview.py <output>/ai-agent-use-cases`：通過。這是靜態預覽，正式 Jekyll build 由 Pages 驗證。
- repo 沒有獨立 lint、TypeScript 或 npm build 設定，不把語法檢查冒稱 lint/typecheck。
- `NODE_PATH=<runner tools>/node_modules node tests/search-submit-browser.cjs`：雲端走查，SUBMIT_OBSERVE=1 為正式基準；SUBMIT_URL 指定預覽；SUBMIT_OUTPUT 指定產物目錄。
- `NODE_PATH=<runner tools>/node_modules READER_URL=<preview> node tests/reader-browser.cjs`：既有長文、導覽與安全文字回歸。

設定檔顯示 gpt-6.1-sol / medium，無法核實或切換主對話的實際模型與推理。方案與獨立只讀審查明確請求可用的 gpt-6-astra / ultra；不聲稱已確認全帳號最高能力。主角色單一整合，審查者不修改程式。使用既有 GitHub runner 與訂閱，無個人 GUI、本機瀏覽器、另付費 API 或購買 credits。

獨立審查未發現必修問題，確認提交單元 5/5、syntax 及 diff 檢查。採納桌面說明文字微調，並補所有 facets＋sort＋history 的實際瀏覽器組合。inline 版審查另指出可見「查看結果」和 aria-label「查看搜尋結果」不一致，已在 1aceae4 移除多餘 aria-label，讓可見文字直接作為名稱。真實 OS 中文 IME 及手機虛擬鍵盤未驗證；合成 composition events 只能證明 guard，不能代表原生輸入法認證。axe 零違規不等於整站無障礙認證；未量測 Lighthouse 或真實裝置效能分數。

第一版雲端驗收因 axe 要求 explicit browser context 而失敗（39427344058），已改用 browser.newContext。第二次純 fill 的載入測試沒有 pointer/key 事件，觸發既有初次搜尋 arrival；改成真實 click＋Enter，再解除 catalog 暫停，保留所有焦點與 disabled 斷言。

[39427993287](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39427993287) 進一步發現真正的 Firefox 退化：Enter 後 focus 已在 results-count，但後續畫面回到表單（top=1142.42px）；見 [修正前](firefox-before-fix.jpg)。新增 query keydown 對非輸入法 Enter 取消原生動作，轉交同一 form.requestSubmit；isComposing、composition state 及舊版輸入法 keyCode=229 不攔截。單獨 requestSubmit 仍重現，故未把 implicit-submit 假設當成已知根因。最後沿用現有 focusLoadedResults，增加 block 參數（原載入使用預設 center 不變），提交用 start；先聚焦後捲動，再以既有兩畫格防護檢查摘要是否離開視窗。新互動、URL 變更、焦點移走或 dialog 開啟均停止；單元驗證最多兩畫格，沒有無界重捲。瀏覽器另留 scroll/focus trace。保留失敗紀錄，不把 Chromium 通過當成完整驗收。

外部服務 HTTP 是觀測值，不是網站可控制的可用性：Markdown 原始檔在不同 runner 請求曾回 200 與 429，不宣稱所有來源全數成功。既有 reader regression 另實際點擊原始報告並驗證新分頁目的地。

[39428804949](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39428804949) 核心跨引擎五視圖通過，Firefox trace 在晚到位移後約6ms恢復可見，沒有以增加等待時間掩蓋離開視窗。後續既有 reader 的 mobile firstResultFromSearch<240 回歸抓到整列按鈕推遠第一張卡；改成輸入列內按鈕，保留既有240px門檻，只更新合理的新鍵盤順序。這項失敗與修正也保留，不宣稱初版設計已過全部回歸。

工作期間協作者新增研究提交 d826ef4，fetch 後正常 merge 進分支，無衝突；最新驗收包含這批內容，不覆蓋來源。

GitHub CLI 的企業帳號無權在個人 repo 建立 PR（Enterprise Managed User），已有個人 SSH remote 可 push。依使用者明確授權，以一般 git merge 推至 main；不強推或切換帳號。

## 截圖、驗收結果與後續

完整本輪產物由 Search submit QA workflow 保存；本目錄另收精簡桌面／手機前後圖及 JSON。

| 視圖 | 修改前 Enter 後 | 修改後 Enter 後 | 修改後操作入口 |
| --- | --- | --- | --- |
| 桌面 1440×1000 | [before-desktop.jpg](before-desktop.jpg) | [after-desktop.jpg](after-desktop.jpg) | [action-desktop.jpg](action-desktop.jpg) |
| 手機 390×844 | [before-mobile.jpg](before-mobile.jpg) | [after-mobile.jpg](after-mobile.jpg) | [action-mobile.jpg](action-mobile.jpg) |

變更檔案：assets/app.js（提交流程與有界定位）、assets/style.css（inline觸控按鈕）、index.html（搜尋動作與說明）、tests/search-submit.test.cjs / search-submit-browser.cjs（回歸與走查）、tests/mobile-search-browser.cjs（新Tab順序，距離門檻不變）、.github/workflows/search-submit-qa.yml（雲端與發布驗收）、本維護目錄。

預覽：正式 [GitHub Pages](https://richardhan.github.io/ai-agent-use-cases/)。自選雲端預覽可先執行 Python preview，再以 http.server 服務父目錄，使用 /ai-agent-use-cases/ 子路徑，避免繞過 base path。

下一輪最值得做：重現並修復長文在全文補載後的滾輪閱讀位置跳動；既有 round-browser.cjs:110 已在本輪前與合併後同樣失敗，應先把這個持續的閱讀品質缺口修好。


## 最終預覽驗收

[最終 QA 39429474142](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39429474142) 成功（執行資產 1aceae4）：118/118 單元、JS syntax、靜態 preview、五組引擎/尺寸完整流程與既有 reader 全部通過。主要提交後摘要 top 23.61–24.44px，focus=results-count；五次核心 axe 掃描零違規、零 pageerror、無水平溢出。Firefox 來源原始檔 HTTP429，其他四組200，完整觀測見 [verification.json](verification.json)。

既有 reader 整庫驗證392條目、2771章節、411頁首證據行對應；長文、原始報告新分頁、直鏈重整、錯誤重試、安全文字及缺資料流程通過。見 [reader-corpus.json](reader-corpus.json)、[reader-accessibility.json](reader-accessibility.json)。手機首張結果距離仍保持原本<240px門檻，見 [chromium-mobile-search.json](chromium-mobile-search.json)。前後條目389→392是協作者研究更新，並非本輪新增案例或成果指標。

main 原有 CI 失敗另存 [baseline-ci.json](baseline-ci.json)，包含基準9fec688的Audit summary，以及前版legacy QA；本輪沒有聲稱所有歷史workflow皆綠。正式發布驗收另於完成後附入。


合併提交 [a06338b](https://github.com/RichardHan/ai-agent-use-cases/commit/a06338bac6782ce966e416988f567325912aa999) 已直接推至 main。合併後 Facet counts 的舊鍵盤測試尚假設 query→filter-summary，6a5f8ff 新增 search-submit 中間站斷言，原 filter-summary 斷言保留；無執行資產變更，獨立審查確認沒有放寬驗收。

已知未解：Improvement round 的 wheel reading stays anchored / round-browser.cjs:110，在[本輪前39424669751](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39424669751)及[合併後39430395668](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39430395668)同樣失敗，維持未解、不冒稱整站全部CI通過。本輪獨立 reader 與搜尋核心通過不代表這項補載長文問題已修復。


## 正式發布驗收

[Pages 39430754984](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39430754984) 建置及部署成功；[main Search submit QA 39430395522](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39430395522) 全部成功。13:33:57 UTC 公開 index.html/app.js/style.css 已逐位元組符合已驗收資產，接著完成正式站五視圖走查：搜尋與全部篩選/排序、Enter/按鈕、空結果、IME合成guard、載入與失敗、詳情直鏈重整、關閉返回、Tab順序。摘要top 23.83–24.41px、焦點正確，五次axe零違規、零pageerror；本次五組Markdown原始檔HTTP均200，之前429仍保留觀測紀錄。見 [正式數據](published-verification.json)、[正式桌面](published-desktop.jpg)、[正式手機](published-mobile.jpg)。主整合者已目視正式截圖並與預覽/基準比較。

[CI快照](final-ci.json) 保留其他工作流程狀態；本輪QA成功不代表所有legacy CI均成功。Return visibility曾因Pages排程超過其資產等待上限失敗，正式資產一致與本輪直鏈返回已另驗；既有長文wheel失敗仍未解。最終補交僅文件及證據，不修改執行資產。本輪達到驗收標準，停止新增改善。

[Facet counts 修正後 QA 39430756490](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39430756490) 成功，新鍵盤順序及原篩選驗收均保留。
