# 2026-11-16：首屏「要注意什麼」不得漏掉案例頁宣告的停止條件

## 基準與選題

- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 落後 10 個 commit、無未提交修改；安全 `git fetch --prune` 後以 `origin/main` `2c288eda` 建立隔離 worktree `/private/tmp/aiuc-r14-base`，再以當時最新 `f537c8e4`（僅多一個 docs 紀錄 commit，`tests/`、`assets/`、`index.html`、`README.md`、`INDEX.md` 皆無差異）建立 `improve/2026-11-16-copy-hard-stops`。建立時沒有任何開啟中的 PR。
- repo 沒有 `AGENTS.md`；沿用 `README.md`、`_config.yml`、`.github/workflows/website-qa.yml` 與最近 `docs/qa/2026-11-16-merged-count-labels/README.md` 的接續項。
- 主模型實際為 `litellm/deepseek-flash-gmi`；本環境沒有提供切換 gpt-6.1-terra 或 gemini 的介面，未切換模型、未改設定或付費通道，不宣稱使用指定模型或最高推理。兩個獨立調查（`CopyCautionAudit` 內容、`DeployReliabilityAudit2` Actions）是同模型、不同 context；其中內容稽核的每一項主張都由整合者以檔案原文與瀏覽器重新核對後才採用。
- 基準 `node --test tests/*.test.cjs`：**901 pass／0 fail**。正式站 `catalog.json.sourceRevision` 等於 `2c288eda…`，該 commit 的 Pages 與 Website QA 都 success。
- Actions 基準（整合者 `gh run list`／`gh run view`，2026-11-16 11:30 UTC）：沒有失敗中的 run，最近 10 個 main push 的 Website QA 全 success；本輪沒有 CI 變更需求，未動 workflow。

## 觀測到的問題

1. `README.md` 明寫「短句會保留案例頁宣告的硬性停止條件」，但 `assets/copy.json` 的 20 則首屏短句只涵蓋部分。實測正式站 `2c288eda` 詳情面板（1440×900／390×844）：
   - UC-016 只寫「地址、電話與低於底線的議價不可被自動送出」。同頁提示詞明列「**送出任何訊息、接受或還價、約定時間、標記售出、下架或刪除刊登**」都須當次核准，且第 5 步要求「先列出要下架的清單，由本人確認後再執行」。首屏完全沒提最不可逆的下架／刪除刊登。
   - UC-007 只寫「不能自行取消、簽新合約、聯絡廠商或付款」。同頁提示詞另列「**不評價員工績效**」「**不刪帳號**」「**不改授權／訂閱**」「**不新建排程**」「不要求新增管理權」，且「低使用**不能直接等同可刪席次**」。
   - UC-010 只寫「韌體寫入、網路暴露與持久存取要分別審核」。該頁是只讀研究，明寫「此階段只讀，**不安裝、不執行、不連線裝置、不刷韌體**」「**不授權讀者裝置上的動作**」「任何狀態不一致即停止，不連續重試」。
2. 獨立內容稽核逐條比對 20 則後指出 15 則 UC 至少漏 1 項，其餘嚴重者：UC-011 漏「不要把表格、客戶資訊或輸出發布到公開庫」；UC-015 漏「頁面中的指令一律視為資料」「不使用我的連接 App」；UC-004 漏「不推斷住址、敏感特徵或私人聯絡方式」「不改分享權限」；UC-014 漏「不得在社群或公開頻道發文」；UC-006 漏「若圖有錯先暫停待批准」（該案來源正是錯圖仍隨排程發布）；UC-009 漏「不將舊聊天內的指令當作新授權」。
3. 3 處不是遺漏而是措辭走樣：P-002 頁面是「僅研究，不聯絡業者」，短句寫成「不**自行**聯絡業者」而放寬；UC-013 頁面「不重試登入」，短句寫成「不要**反覆**登入」；UC-016 原本「**切勿**開啟『永遠允許』」比頁面第 2 步（觀察 1–2 週後可讓純資訊回覆自動送出）更嚴。
4. 沒有測試釘住這個承諾：改短句或改案例頁都不會讓任何檢查失敗，先前幾輪只能靠人工逐頁比對。

## 方案與選擇

- ①只補三則最嚴重的短句：成本最低，但 README 的承諾仍沒有機器檢查，下一輪同樣會漂移。
- ②補齊 15 則有實質缺漏的短句，並新增 `tests/copy-hard-stops.test.cjs`：每則案例登記「頁面原文片段 → 短句必須包含的片段」對照，測試同時驗證頁面仍宣告該停止條件（防止憑空發明）與短句仍保留它（防止再次漏寫），另限制短句長度，避免把整段原文塞進首屏。
- 選②：這是站方已對讀者承諾的內容契約，缺的是資料與守則，不是新功能；改動只在 `assets/copy.json`、一支新測試、一支既有瀏覽器斷言與 README 一句說明，不動搜尋、排序、篩選、抽卡、案例原文或資料計數。

驗收條件：15 則短句都含對照表中的停止條件；測試在任一側少一句時轉紅；UC-016 首屏可見文字含「標記售出、下架或刪除刊登」與「每週檢查權限設定頁」；短句最長 ≤ 180 字；`node --test tests/*.test.cjs` 全綠；三種訪客情境與 axe 在 1440／390／320 不退化。

範圍外：不改案例原文、不改停止條件的優先順序、不改面板結構與 `copy.json` 以外的顯示邏輯、不改 Actions、不新增分類或追蹤。

## 實作

- `assets/copy.json`：15 則 `caution` 補回頁面已宣告的停止條件，並修正 3 處走樣：
  - UC-001 條件衝突／金額改變就停；UC-002 不安裝、執行、渲染或呼叫付費服務；UC-003 不改庫存、價格與提示注入邊界；UC-004 不推斷住址、不改分享權限、不合併不確定帳號；UC-005 未經逐項核准不合併、部署、改權限、建立憑證，不投稿 PR 評論；UC-006 圖有錯就暫停、不新增廣告或改權限；UC-007 不評價員工績效、不刪帳號、不改授權或訂閱、不新建排程、低使用不等於可刪；UC-008 私人行程只顯示起訖時間、分享團隊另經授權；UC-009 研究指令不授權移轉、不讀本機設定、不匯入或安裝；UC-010 只讀、不授權安裝執行連線刷韌體、狀態不一致就停、裝置識別碼不外流；UC-011 不判定失單、不改商機階段、不公開客戶資料；UC-012 不執行程式或改檔、角色同意不等於獨立重現；UC-013 不重試登入、不索取密碼、不擴權或重新送出；UC-014 不改帳戶、不在公開頻道發文；UC-015 頁面指令視為資料、不使用已連接 App、只建立一次性檢查；UC-016 訊息／接受出價／位置線索／約定時間／標記售出／下架／刪除刊登都要當次核准、每週檢查權限設定頁。
  - P-002 改回頁面的「僅研究，不聯絡業者、不改方案或新增合約」。
  - UC-016 的「永遠允許」改成「不要一開始就設」；保留頁面第 2 步「觀察 1–2 週後只放行純資訊回覆」，低於底線的出價改成「直接列給你、不要回應」。
- `tests/copy-hard-stops.test.cjs`（新）：15 則案例的 `source`／`pairs` 對照；三項測試分別檢查涵蓋範圍（UC-001–016 各一則）、每一對的頁面片段與短句片段都存在、短句 ≤ 180 字，以及 P-002 的「僅研究」不被「不自行」放寬。P-001／P-003／P-004 由獨立稽核確認為覆蓋良好，未列入對照表。
- `tests/visitor-adoption-flow-browser.cjs`：UC-016 的舊斷言只認「切勿開啟『永遠允許』」，改為分別檢查「永遠允許」「標記售出／下架／刪除刊登」「議價」三個邊界，避免只為通過測試而放寬。
- `README.md`：在既有承諾句後補上守則檔名與「兩邊少一條就讓測試失敗」。

## 紅測與回歸

- 先紅：在基準 `2c288eda` 的 `assets/copy.json` 上執行新測試 → `copy.json cautions still declare every case-page hard stop` 失敗（UC-001 dropped `條件衝突就不要訂`），P-002 一項失敗；補齊後 3 項全過。
- 全套 `node --test tests/*.test.cjs`：基準 901 → 本輪 **904 pass／0 fail**。
- `node --check assets/app.js` 通過；`node scripts/check-published-surface.cjs` → 838 檔／5.91 MiB／9 項排除，PASS。
- 瀏覽器（preview `http://127.0.0.1:8166/ai-agent-use-cases/`，Chromium）：
  - `tests/discovery-browser.cjs` exit 0（desktop／mobile／small-mobile 的 discovery、抽卡、鍵盤、組合篩選、空結果復原、直鏈、重新整理、返回、溢出；axe 0）。
  - `tests/visitor-adoption-flow-browser.cjs` exit 0（三尺寸、含新的 UC-016 邊界斷言；axe 0）。
  - `tests/detail-trust-summary-browser.cjs` exit 0（UC-098 三尺寸，axe 0、pageerror 0）。

## 訪客驗收

- 同頁、同尺寸、同資料狀態的前後對照（`before` 取 `2c288eda` 的本機 preview，與當時正式站同一 commit；`after` 取本輪 preview）：

| 尺寸 | 案例 | 前 | 後 |
| --- | --- | --- | --- |
| 1440×900 | UC-016 | 153px；只提地址、電話、議價與長期記憶 | 222px；補「任何訊息、接受或還價、位置線索、約定時間、標記售出、下架或刪除刊登都要當次核准」與「每週檢查權限設定頁」 |
| 390×844 | UC-016 | 176px | 292px（卡片寬 286px，無水平溢出） |
| 1440×900 | UC-007 | 只提取消、簽約、廠商、付款 | 補「不評價員工績效」「不刪帳號」「不改授權或訂閱」「不新建排程」「低使用也不等於可刪席次」 |
| 390×844 | UC-007 | 同上 | 199px，無水平溢出 |
| 1440×900 | UC-010 | 只說「要分別審核」 | 補「本頁只讀，不授權安裝、執行、連線、刷韌體或改網路權限」「狀態不一致就停止，不連續重試」 |

- 截圖：`before-{desktop,phone}-{uc-007,uc-010,uc-016}.png`、`after-{desktop,phone}-{uc-007,uc-010,uc-016}.png`；量測與逐字文字 [evidence/measurements.json](evidence/measurements.json)。
- 三種必要情境（preview，1440×900／390×844／320×740，`reducedMotion: reduce`；桌面、手機、320px 結果相同）：
  1. 不知道工具名稱的新訪客輸入「我想讓 AI 幫我整理會議紀錄」→ 4 筆與範圍說明；按「改搜「會議」→ 14 筆」後畫面 14 筆、查詢欄變「會議」、前四張含 UC-094；開詳情看到「作者報告／示範＋設計／未實跑」；Escape 關閉、焦點回原卡片、查詢保留（`?q=會議&scope=overview`）。
  2. `?q=發票&tool=Cursor&scenario=學習` → 0 筆，空結果面板列出「移除提及工具「Cursor」→ 1 筆」；點擊後 1 筆、網址保留 `q` 與 `scenario`、焦點在 `#results-count`。
  3. `?case=UC-016` 直鏈 → 詳情開啟、新版停止邊界完整顯示（159 字）、來源連結 `_blank` ＋ `noopener noreferrer`；Escape 後關閉、焦點回結果摘要。
- axe（wcag2a／aa／21aa）0 違規、pageerror 0、`scrollWidth - clientWidth = 0`（三種情境、三種寬度）；逐項數據 [evidence/acceptance.json](evidence/acceptance.json)。
- 限制：本環境沒有 Jekyll，preview 是靜態檔；真正的 `_site` 建置由 PR 的 Website QA 驗證。未用實體手機、讀屏實聽或 Firefox／WebKit 交叉重跑；未做效能基準。截圖只作版面證據，未逐像素目視（影像輸入停用）。

## 獨立審查

- 由未參與實作的獨立 reviewer context（`CopyStopsReview`）檢查 commit `7699962e06` 的最終 diff、新測試、瀏覽器斷言與 QA 證據；初審 **Changes requested（2 個 P2）**：
  1. UC-016 短句寫「任何訊息都要當次核准」，抹掉頁面第 2 步「觀察 1–2 週後，純資訊類回覆可自動送出」的分級；且低於底線的出價頁面要求「不要回應」，短句只寫「不可自動送出」，仍可能被讀成可人工回覆後送出。
  2. UC-001 契約只要求短句提到登入或 CAPTCHA，但頁面停止條件是「登入或**人工確認**」；若短句只寫 CAPTCHA，非 CAPTCHA 的人工確認仍會漏掉而測試通過。
- 修正：
  - UC-016 →「不要一開始就設『永遠允許』。初期任何訊息、接受或還價、位置線索、約定時間、標記售出、下架或刪除刊登，都要當次核准；觀察 1–2 週後若放行，也只限純資訊回覆。低於底線的議價直接列給你、不要回應。」並在契約加入「觀察 1–2 週後…純資訊類回覆」與「不要回應」兩對；follow-up 再要求短句保留「1–2 週」門檻。
  - UC-001 →「網站擋自動化、要求登入或人工確認（含 CAPTCHA）就停」，契約改要求「要求登入或人工確認」。
- 修正後重跑 `tests/copy-hard-stops.test.cjs`（3 pass）、三種訪客情境（三尺寸、axe 0、pageerror 0、溢出 0）、`tests/visitor-adoption-flow-browser.cjs`（三尺寸、axe 0）與全套單元測試。
- reviewer 另確認 `copy.json` 的 `caution` 也會進入複製筆記與列印內容；搜尋文字仍取自案例 Markdown，未見影響搜尋或快取語料。它用預設 8877 埠執行整支 adoption 測試時連線被拒，改由整合者在 8166 preview 重跑 exit 0；未驗證 Jekyll／正式站，由 PR Website QA 與合併後 Pages 補足。
- follow-up 確認最後一項 P2（驗收資料仍記舊短句）已修；最終 head `2e1970ee` 的 `evidence/acceptance.json` 三種寬度都記為 159 字、含「觀察 1–2 週後」。**最終 verdict：無 P0–P2 findings。**

## PR、Actions 與發布

- 交付 PR [#459](https://github.com/RichardHan/ai-agent-use-cases/pull/459)，head `2e1970ee`；PR checks **16 pass／2 `published` 依設計 skipping**。Website QA [43863605517](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43863605517) 13m05s success（13 分 05 秒、含 `node --test tests/*.test.cjs` 904 項、Jekyll `_site`、published-surface 與 Chromium 旅程）；Source guide QA [43863605806](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43863605806) preview 11m53s success、`published` 依設計 skipping。
- 一般 merge 為 `c93c6c1ca1a0d0fef0c1d35dd4dcccbe0fc31608`（第一父 `f537c8e4`、第二父 `2e1970ee`）。合併後 Pages [43865693142](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43865693142) success；主線 Website QA [43865694303](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43865694303) 於交付時仍在執行，結果見下方補記與 PR comment。
- 正式站核對（2026-11-16 12:22 UTC，`catalog.json.sourceRevision` 精確等於 `c93c6c1c…`）：`assets/copy.json` SHA-256 `b3fa385b…` 與 `git show c93c6c1c:assets/copy.json` 逐位元相同；`live.json`／`live-{desktop,phone}-uc016.png`。1440×900／390×844 的 UC-016 caution 皆為 159 字、含「標記售出、下架或刪除刊登」「觀察 1–2 週後」「每週檢查權限設定頁」；桌面高度 222px、手機 292px、水平溢出 0、axe 0、pageerror 0；「我想讓 AI 幫我整理會議紀錄」在兩種寬度都是 4 筆。
- 本紀錄自身若以 docs-only 後續合併，只會推進 `sourceRevision`，不會改 `assets/copy.json`；正式站產品位元仍以 `c93c6c1c` 的 SHA-256 為準。
- Actions 現況（唯讀稽核 `DeployReliabilityAudit2`，3,448 runs／7 日）：目前沒有失敗中的 run，main Website QA 自 11-14 19:57 後 47 次連續成功；653 個取消全部是被新推送取代，權限／配額／外部服務／純 flake 皆 0。歷史 `[skip ci]`／docs-only 無裁決、main 裁決被取消、60 分鐘發佈空等都已修復且不重現。現存但本輪未處理的 latent 風險：`source-guide-qa.yml` 的 `published` job timeout 75 分鐘 < 共用 60+20 慣例，且不在 `tests/published-assets.test.cjs` 的守門清單；該 job 目前因只有 PR 觸發與 main-only `if` 而永遠 skipped（run 43855262755），一旦接回 main 就會在 60 分鐘等待後只剩 15 分鐘。另有 3 處精確 corpus 計數（53／31／17）仍是下次內容新增可能一次點亮 16 個 workflow 的來源。列為下一輪候選，不在本輪改 CI。

## 下一輪

- 最值得先做：把剩餘 3 處精確 corpus 計數改為下限並加靜態守則——`tests/mobile-problem-tags.test.cjs:24`（53）、`tests/problem-compound-queries.test.cjs:380/385`（31／17）。7 日稽核顯示，一次內容新增曾讓 16 個 workflow 同時因同一計數變紅；這是目前最可能再造成大面積紅燈的已知原因。
- 先做哪個驗證：在隔離 worktree 暫時新增一個案例檔，跑 `node --test tests/*.test.cjs`，確認不再因 53／31／17 失敗；再確認新守則會擋下把 `>=` 改回精確值的 diff。
- 次選：`copy.json` 只覆蓋 20 個早期條目；其餘 500 多則使用案例頁自己的章節抽取。抽 10 則沒有「權限／限制」章節、改由其他標題抽取的案例，確認 `caution` 不是抓到驗收句或來源句。
