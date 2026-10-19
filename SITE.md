# GitHub Pages 案例網站

## 啟用一次

Repository → Settings → Pages → Build and deployment：

- Source：**Deploy from a branch**
- Branch：**main**
- Folder：**/ (root)**
- Save

本網站使用 GitHub Pages 內建 Jekyll。不要新增 `.nojekyll`；也不要選 GitHub Actions 作為 Source，因為不需要自訂 workflow。

預期網址由 Pages 設定頁提供。請等該次 `pages build and deployment` 完成，再確認網址可開啟；提交程式碼不等於已上線。

## 最新網站驗收

2026-10-19：詳情用途後新增方法捷徑，保留「本庫設計，未實測」等完整原標題；桌面與手機不必捲過長來源才能找方法，待查不製造入口。[方案、前後截圖、測試與獨立審查](docs/qa/2026-10-19-method-shortcut/README.md)。

2026-10-19：分享案例不存在時顯示明確提示，保留搜尋條件接回探索；區分來源未載入、支援補讀、空編號與返回焦點。[本輪前後截圖、方案、測試與獨立審查](docs/qa/2026-10-19-missing-shared-case/README.md)。

2026-10-19：修正卡片情境／標籤探索後失去鍵盤焦點、手機停在頁尾的問題；套用條件後直接抵達結果數，並標明已選情境。[本輪前後截圖、方案、測試與獨立審查](docs/qa/2026-10-19-card-refinement/README.md)。

2026-10-19：首頁首屏新增「直接搜尋案例」，保留載入中輸入、鍵盤焦點、搜尋條件與原生連結操作。[本輪前後截圖、雲端驗收與正式發布紀錄](docs/qa/2026-10-19-home-search-entry/README.md)。

2026-10-19：加入整輪載入期限、真實來源進度與「先看已讀取內容」，並保留缺項補讀、分享條件與鍵盤焦點。[本輪截圖、驗收及部署紀錄](docs/qa/2026-10-19-corpus-loading/README.md)。原閱讀與返回驗收見[前輪紀錄](docs/qa/2026-10-19-reading-flow/README.md)；後續優先改善全文回訪載入成本。

## 自動收錄

Markdown 是唯一內容來源。`catalog.json` 在每次 Pages 建置時，透過內建 Liquid 自動列出 `cases/**/*.md`、`evidence/**/*.md` 與 `sources/pending.md`。網頁從同站讀取全文，無 GitHub API 配額、無外部搜尋服務、無憑證或分析追蹤。

新增案例只需沿用現有無 YAML front matter 的 Markdown 格式，檔名使用英數與連字號。待查線索在 `sources/pending.md` 以 `## P-XXX：標題` 分段。合併至 main 後，GitHub Pages 會重建索引，無須手動維護網站清單。

分類優先使用 `- 分類：` / `- 分類／標籤：`；若缺少則按標題歸類。工具篩選標示「提及工具」，以全文出現名稱辨識，不代表該工具已證實支援整個流程。證據標籤由頁首證據欄位摘要；詳情中的原文才是完整判斷依據。主要案例、補充、待查分開計數，均不宣稱獨立重現。

可用 `?q=關鍵字&tool=Grok%20Bot` 分享篩選結果，或 `?case=UC-001` 直接開案例。所有來源文字以安全 DOM 文字節點呈現；不執行案例內的 HTML。

## 雲端／本機預覽（自選環境）

需要 Python 3：

```sh
python scripts/preview.py /tmp/ai-usecase-preview
python -m http.server 8080 --directory /tmp/ai-usecase-preview
```

預覽器模擬 Liquid 產生檔案清單，不執行 Jekyll；正式發布仍需檢查 GitHub Pages 建置。網站前端無 npm 或第三方程式依賴。

不要編輯預覽輸出代替 Markdown；不要把個資、私有工作資料或秘密放入公開 repo。


## 網站標題與用途文案

網站優先讀取 Markdown 頁首的 `- 網站標題：` 與 `- 一句話用途：`。新增案例請填這兩欄：標題寫具體任務或好處，讀者不用先懂 UC 編號、CRM、CUA、SaaS 等術語；不要保證來源未證明的節省金額、成功率或成效。

既有 17 筆的白話標題與摘要集中在 `assets/copy.json`，以 UC/P 編號對應；Markdown 原文仍是研究事實來源，並保留全文搜尋。若 Markdown 已有上述欄位，優先於文案清單；兩者皆無時才使用原 H1 與目標欄位。不要為新案例維護第二份全文。

卡片先呈現用途，詳情先說「可以幫你做什麼／怎麼開始／要注意什麼」，原始研究、來源與完整提示詞放在可展開區。待查想法使用疑問或待查語氣，清楚標示「還在查證」，不得包裝成已成功或本庫親測。

## 2026-10-18：引導與抽卡探索（整合協作者版本）

首頁改為「選情境 → 隨機看一張 → 深入讀案例」，完整搜尋保留於下方。情境優先讀 Markdown 頁首的 `- 情境：`，並保留既有缺欄位時的情境歸類與常見任務快選。

`assets/discovery.js` 提供純函式抽卡規則：不抽待查、補充或模板；同輪不重複，下一輪避免接著出現同一張。抽卡遵守搜尋與所有篩選條件，結果不是人氣排名；不使用 localStorage 計票，也不聲稱已收集社群票數。

分享網址支援 `?scenario=省錢`，可與既有搜尋、工具與案例直鏈組合。載入失敗時停用探索控制並提供重試。投票仍需確認共用儲存方式，目前沒有公開票數或假按讚功能。

回歸測試：`node tests/search.test.cjs`、`node --test tests/discovery.test.cjs`。GitHub Actions 的 Website QA 在雲端 Chromium 檢查 1440、390、320px，走查引導、抽卡、搜尋、組合篩選、空結果、鍵盤、直鏈、重新整理、返回與錯誤復原；截圖與 axe 檢查結果由 workflow artifact 保存。此檢查不是正式 Jekyll 建置，部署後仍應查驗 Pages workflow。

獨立審查補修：窄螢幕選情境後按需帶到卡片、瀏覽器返回時恢復原結果按鈕焦點、抽卡 live status 宣布新標題。axe 另發現原有閱讀說明小字對比僅 4.34:1，已調整為 5.56:1。正式站另由 main 合併後的雲端 smoke test 驗證實際 Jekyll 產生的索引、HTTPS 與手機直鏈重新整理。

整合以協作者 main ddc6324 為基準，保留嚴格核對統計、互動標籤、常見任務、複製連結與詳情上一則／下一則；未使用舊分支覆蓋其修改。

分享失敗時不再誤報成功：Clipboard API 不存在或權限被拒會顯示可手動複製的案例網址；雲端回歸同時檢查成功與拒絕權限路徑。

## 2026-10-18：案例閱讀導覽與頁首證據

正式站走查發現 UC-005 有 19 個主段落與 21 個來源連結，卻沒有段落導覽；UC-313 的具體結果和唯一來源也在通用摘要下方的展開區。選擇從原文建立導覽，避免逐篇重寫研究內容。

`assets/reader.js` 在既有安全 Markdown 渲染後，依實際標題建立「實作與結果／方法與步驟／限制與權限／來源與版本」快速入口及完整段落目錄；沒有對應段落就不產生入口，沒有章節就不產生目錄。點擊展開原始研究，只捲動詳情視窗、避開固定工具列並把鍵盤焦點交給原標題；每段可回到導覽，不更改分享網址或瀏覽紀錄。

頁首證據說明複製原始 metadata 的完整文字與安全來源連結，保留「自設未測／作者自述／官方」等原始用語，不將推導的分類標籤冒充證據。缺欄位明示未知；頁首不代表後續所有補充的證據狀態，仍須逐段判讀。待查說明、原始 Markdown、收錄與合格計數不因本功能改寫。

回歸指令：`node --test tests/*.test.cjs`、`node --check assets/app.js`、`node --check assets/reader.js`、`python3 scripts/preview.py /tmp/ai-reader-preview/ai-agent-use-cases`。專案沒有獨立 lint、TypeScript 或 npm build；預覽不等同正式 Jekyll。Reader QA 僅在 GitHub runner 安裝測試工具，網站本身沒有新增套件、第三方請求或儲存。

雲端瀏覽驗收使用 `NODE_PATH=<測試工具目錄>/node_modules node tests/reader-browser.cjs`，預設以 port 8082 的 `/ai-agent-use-cases/` 預覽為準；`READER_URL` 可指定已部署網站。涵蓋三種具體情境：搜尋旅遊並組合篩選／返回、分享長篇開發案例並核對來源、閱讀失敗案例並比較待查線索。另核對整個案例庫的段落對應、缺欄位、重複標題、安全文字、網路失敗與重試；截圖、axe 與未節流的載入時間由 Reader QA artifact 保存。這些是模擬走查，不代表真人偏好或轉換率。

本輪實際結果：8/8 測試通過，317 筆條目／2,142 節／336 行原文證據對應通過；Chromium 1440、390、320px 與 Firefox、WebKit 390px 的三情境通過，15 次 axe 掃描均 0 違規。hover 文字對比由 4.34:1 修到 5.61:1；窄螢幕工具列不再折行。原有 Playwright 1.56.1 的 WebKit 在 main 與新版都崩潰，僅更新雲端測試工具至 1.64.1 後通過；未宣稱實體 Safari 或上游根因已驗證。[前後截圖、指令、量測與獨立審查紀錄](docs/qa/2026-10-18-reader/README.md)。

## 2026-10-18：全庫 Markdown 容錯載入與單筆失敗隔離

先前走查與部署測試發現：首頁啟動時以 `Promise.all` 同步送出 317 個無上限並行請求，易在弱網或部署初期逾時；若任何單一 Markdown 檔遭遇 404 或連線失敗，或 `copy.json` 讀取異常，整體網站直接進入「載入未完成」白畫面，其餘 316 筆可用案例完全無法瀏覽。

本輪改善：
1. `assets/app.js` 實作 `mapConcurrent`，限制最大並行請求數（預設 16），避免瀏覽器連線池飽和與請求中斷。
2. 實作 `loadCorpus` 單筆失敗隔離：個別 Markdown 載入或解析失敗時記錄警告並略過，保留所有已成功案例供抽卡、搜尋、篩選與閱讀；僅在完全沒有成功載入任何案例或 `catalog.json` 失敗時才顯示重試畫面。
3. `results-count` 於有略過筆數時誠實標註（例如「顯示 316 / 316 筆收錄（1 筆載入略過）」）。
4. `copy.json` 讀取失敗時優雅降級為空物件，自動沿用 Markdown 原文標題與用途，不再引發連鎖崩潰。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node --check assets/app.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。

## 2026-10-18：案例情境與標籤缺欄位正規化、來源重複候選清查與中繼資料審核測試

先前走查發現：案例庫中有 18 筆 Markdown 缺 `- 情境：`（UC-109~116、214~218、232~236），2 筆包含非標準情境（UC-228 寫 `居家`、UC-312 寫 `生活／工作`），導致 `Discovery.scenarioOf()` 無法匹配或降級為粗略猜測；另有 35 筆案例缺少獨立 `- 標籤：` 欄位（標籤夾雜在分類行中），導致 `app.js` 解析出空標籤陣列 `[]`，影響標籤關鍵字搜尋品質與探索卡片標籤呈現。此外，專案缺乏自動化案例中繼資料完整性與來源重複候選檢測機制。

本輪改善：
1. `tests/audit.test.cjs`：新增自動化審核測試，嚴格驗證全庫 313 筆案例均具備標準六大情境（生活／工作／省錢／學習／創作／開發）、非空標籤陣列，並維持合格案例數（292）與收錄總條目數（319）的嚴格分離；實作外部來源重複候選自動偵測，落實「疑似重複只列候選，不自行刪除」。
2. `cases/*.md` 正規化：補齊 18 筆缺情境案例與 35 筆缺標籤案例的標準 `- 情境：` 與 `- 標籤：` 行，將 UC-228（居家）及 UC-312（生活／工作）正規化為六大標準情境之一（生活）。
3. `assets/app.js`：強化標籤解析容錯，若遇未分拆之 `- 分類／標籤：` 或 `- 分類：...｜...`，自動降級擷取標籤，確保未來案例搜尋品質與健壯性。
4. `tests/search.test.cjs`：擴充回歸斷言，驗證 UC-109、UC-217、UC-228、UC-312 等案之情境與標籤搜尋品質。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node --check assets/app.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：16/16 測試全數通過，319 筆條目全文與中繼資料檢驗通過。
下一輪建議：依重複來源候選清單（如多個案例共用同一討論串或長文網址）評估是否需在各案例頁內進一步精確標註發文時間碼或留言 anchor。

## 2026-10-18：搜尋標點引號容錯、案例查證日期補齊與全庫來源驗證審核

先前走查發現：讀者若直接複製 README 建議之引號關鍵字（如「旅遊」、「收件匣」、「比價」）或輸入括號／分號／豎線，`assets/app.js` 的 `tokenize` 因僅以空白與斜線切分且未剝除引號／括號，導致整組字串連同標點比對而產生 0 筆結果（未帶引號時各有 12、25、8 筆）；輸入純數字編號（如 `320`）時亦未關聯案例 ID，導致目標案例被內文含該數字的其他案例淹沒。此外，UC-095 至 UC-099 五案頁首遺漏 `- 查證日期：2026-10-16`，`INDEX.md` 中 UC-312 仍殘留未正規化情境，且既有自動化審核缺乏對 `evidence/` 補充案例、外部來源真實性及正規化重複候選的覆蓋。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 加入中英文引號（`「` `」` `『` `』` `“` `”` `"` `'`）與括號（`（` `）` `(` `)` `【` `】` `《` `》` `［` `］` `[` `]`）自動剝除，並擴充以分號（`;` `；`）與豎線（`|` `｜`）切分，徹底解決帶引號或特殊標點搜尋落空問題。
   - `termVariants` 擴充支援純數字查詢，自動生成 `uc-XXX` 與 `ucXXX` 變體，確保輸入 `320` 等數字能精準匹配目標案例 `UC-320`。
2. 案例中繼資料修正：
   - 補齊 UC-095 至 UC-099 五篇案例頁首之 `- 查證日期：2026-10-16`，使前端 `entry.date` 正確解析。
   - 更新 `INDEX.md` 中 UC-312 標籤欄為正規情境 `生活｜語音來源、待辦、失敗`。
3. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - 擴充中繼資料審核測試涵蓋 `cases/*.md` 與 `evidence/*.md` 全庫檔案的情境、標籤與查證日期。
   - 新增全庫公開來源驗證測試：確認全庫 316 筆檔案皆具備有效外部來源 URL，且不含 `example.com` 等佔位符號。
   - 強化疑似重複偵測之 URL 正規化（去除結尾斜線、清理 tracking 參數），落實「只列候選、不自行刪除、總案例數 313 保持完整」。
   - 增加引號搜尋（`「旅遊」`、`“收件匣”`、`"比價"`）、分號與豎線分割、及純數字案例查詢的回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：17/17 測試全數通過，319 筆條目全文、來源有效性與中繼資料檢驗通過。
下一輪建議：依重複來源候選清單（如多個案例共用同一討論串或長文網址）評估是否需在各案例頁內進一步精確標註發文時間碼或留言 anchor。

## 2026-10-18：搜尋同義詞與 README「每日報表」查詢修正、案例白話文案全覆蓋補正、首頁合格案例計數一致性稽核

先前走查發現：讀者若依照 README 建議關鍵字輸入「每日報表」，因全庫案例多用「日報」、「晨報」、「每日報告」而無連續四字「每日報表」，導致檢索結果為 0 筆（原本各自有 55 篇每日、17 篇報表／晨報、6 篇日報），且常見異體字如「儀錶板」（庫內為儀表板）、「折價券」（庫內為優惠券）、「記賬／賬單」（簡繁異體）檢索亦落空。此外，全庫 318 筆主要案例中僅 UC-016 缺少「網站標題」與「一句話用途」，導致卡片標題回退為原始 H1 字串；`index.html` 首頁統計卡片仍殘留 12:00 批次的 `289` 案，未與 14:45 補核之 `296` 嚴格合格案例數同步，且測試未覆蓋首頁數字與審核文件的一致性驗證。

本輪改善：
1. `assets/app.js`：
   - 定義 `SYNONYM_MAP` 並整合至 `termVariants`，支援「每日報表」自動關聯「日報」、「晨報」、「每日報告」（反向亦然），讓讀者無論輸入「每日報表」或帶引號「「每日報表」」皆能準確命中 UC-322（多平台創作者數據每日採集日報）、UC-049（每日收件匣報告）、UC-008（晨報驗證）等每日例行報告。
   - 擴充異體同義字容錯：支援「儀錶板」↔「儀表板」、「折價券」↔「優惠券」、「賬單」↔「帳單」、「記賬」↔「記帳」、「登錄」↔「登入」。
2. 案例中繼資料補齊：
   - `cases/016-marketplace-selling-buyer-messages.md`：補齊 `- 網站標題：讓 AI 代管二手拍賣買家對話，底價、面交地點與時間逐次核准` 與 `- 一句話用途：讓代理代寫刊登文案並回覆買家，但地址、低於底線的議價與時間仍須本人逐次確認。`。
   - `assets/copy.json`：同步補齊 UC-016 之文案回退項目，使全庫 318 案例達成 100% 白話標題覆蓋。
3. 首頁展示與自動化審核：
   - `index.html`：將嚴格核對合格案例數更新為 `296`（與 `sources/qualification-audit-2026-10-16.md` 及 `INDEX.md` 的 296 保持完全一致）。
   - `tests/audit.test.cjs`：加入 `index.html` 展示數字與審核文件嚴格相等之自動化斷言，並新增全庫 100% 白話標題與用途文案覆蓋率測試。
   - `tests/search.test.cjs`：新增「每日報表」、帶引號「「每日報表」」、以及各類異體同義詞（儀錶板、折價券、賬單、記賬、登錄）搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：18/18 測試全數通過，324 筆條目全文、同義詞檢索、白話文案全覆蓋與合格案例計數一致性檢驗通過。
下一輪建議：依重複來源候選清單（如多個案例共用同一討論串或長文網址）評估是否需在各案例頁內進一步精確標註發文時間碼或留言 anchor。

## 2026-10-18：搜尋標點問號驚嘆號容錯、領域高頻同義詞擴充、全庫待查來源驗證與索引情境一致性審核

先前走查與測試發現：
1. 讀者若以自然語言問句（如「旅遊？」、「如何比價？」）或帶驚嘆號（「比價！」）、全形／半形冒號（「UC:001」、「UC：001」）搜尋時，`assets/app.js` 的 `tokenize` 未剝除問號、驚嘆號與冒號，導致整組標點字串比對而直接產出 0 筆結果（正常「旅遊」有 12 筆、「比價」有 8 筆、「UC-001」有 8 筆）；`matchCase` 亦不支援帶冒號之案例編號查詢。
2. 常用同義關鍵字檢索嚴重失真：全庫有 26 筆「簡報」案例，讀者搜尋「投影片」僅得 3 筆、「ppt」僅得 1 筆；全庫有 13 筆「抓取」、3 筆「採集」（如 UC-322 創作者數據採集、UC-086 影片抓取、UC-015 頁面變更監看），讀者搜尋「爬蟲」僅得 1 筆；「試算表」（19 筆）與「Excel」（12 筆）、「Sheets」（8 筆）彼此割裂；「逐字稿」（24 筆）與「轉錄」（13 筆）無法互相命中。
3. 既有自動化審核測試遺漏 `sources/pending.md` 待查來源的公開 URL 驗證；`INDEX.md` 索引表（318 案）未與審核文件（296 案）及六大情境（生活、工作、省錢、學習、創作、開發）建立自動化回歸斷言；疑似重複偵測未對特定共用討論串候選（如 LairGamingYT Reddit 串）及案例邊界完整性進行針對性斷言。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 擴充支援中英文問號（`?`、`？`）、驚嘆號（`!`、`！`）、冒號（`:`、`：`）、波浪號（`~`、`～`）、點號（`·`、`•`、`…`）自動剝除與切分，並支援 `UC:001` / `UC：001` / `p:003` / `p：003` 自動轉為標準化連字號 ID（`uc-001`、`p-003`），解決常見問句與冒號輸入查無結果問題。
   - `matchCase` 擴充支援帶冒號之案例查詢（例如 `UC:001`、`UC：001`）。
   - `SYNONYM_MAP` 大幅擴充高頻領域同義詞：
     - 簡報類：`簡報` ↔ `投影片` ↔ `ppt` ↔ `powerpoint`
     - 爬蟲資料採集類：`爬蟲` ↔ `抓取` ↔ `採集` ↔ `scraping`
     - 試算表類：`試算表` ↔ `excel` ↔ `sheets`
     - 語音逐字稿類：`逐字稿` ↔ `轉錄`
     - 資料庫類：`資料庫` ↔ `數據庫`
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：
     - 將外部來源有效性審核擴大至 `sources/pending.md` 全體待查來源。
     - 新增 `INDEX.md` 自動化回歸測試：檢驗 318 筆主要案例之 Markdown 連結有效性、六大標準情境格式、以及與 `sources/qualification-audit-2026-10-16.md` 的嚴格合格案例數（296）一致性。
     - 強化疑似重複來源檢測：改善 URL 正規化標點清除，並驗證特定共用 Reddit 討論串（UC-097、UC-098、UC-099）候選追蹤，落實候選去重不刪除案例之原則。
   - `tests/search.test.cjs`：加入問號、驚嘆號、冒號案例編號、以及投影片/簡報、爬蟲/抓取、試算表/Excel、逐字稿/轉錄、數據庫/資料庫之搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：19/19 測試全數通過，324 筆條目全文、同義詞檢索、標點容錯、待查來源驗證與索引情境一致性檢驗通過。
下一輪建議：依重複來源候選清單（如多個案例共用同一討論串或長文網址）評估是否需在各案例頁內進一步精確標註發文時間碼或留言 anchor。

## 2026-10-18：搜尋連接符與標籤容錯、日常高頻同義詞擴充、全庫證據欄位防缺與跨目錄疑似重複候選偵測

先前走查與測試發現：
1. 讀者若在搜尋框使用常見連接符號（如 `+`、`＋`、`&`、`＆`），例如輸入 `旅遊+比價`、`旅遊 + 比價` 或 `旅遊 & 比價`，`assets/app.js` 的 `tokenize` 未將加號與 & 符號納入切分或剝除，導致 `旅遊+比價`（0 筆）、`旅遊 & 比價`（0 筆）完全查無結果；連綴 hashtag（如 `#旅遊#比價`）亦無法自動分離。
2. 常用同義關鍵字檢索割裂：全庫有 140 筆「日曆」案例（如 UC-043 附近活動獨立日曆、UC-295 家庭日曆智慧螢幕），讀者搜尋「行事曆」或「calendar」僅命中部分；「待辦」（63 筆）與同音常見輸入「代辦」（僅 4 筆）、「todo」（39 筆）無法互通；財務報銷詞彙「報帳」或「核銷」檢索為 0 筆（遺漏 61 筆收據、20 筆發票與 UC-024、034、051、190、225 等對帳案例）；「debug」或「排錯」僅命中 1~2 筆（遺漏 118 筆修復案例）；「workflow」遺漏「工作流」與「自動化排程」；「面試」或「resume」遺漏「求職」與「履歷」；「email」或「信件」遺漏「郵件」；「代碼」遺漏「程式碼」與「程式」。
3. 案例庫中早期 12 篇案例（UC-001~007、010~012、014、015）未在 Markdown 內直接宣告 `- 網站標題：` 與 `- 一句話用途：`，依賴 `copy.json` 回退；且自動化審核測試遺漏對全庫案例與經驗補充檔之 `- 證據狀態：` / `- 來源證據：` 標記檢查。
4. 疑似重複偵測先前僅掃描 `cases/`，遺漏 `evidence/` 與 `sources/pending.md` 跨目錄候選（如 UC-028 與待查 P-002 共用三則原帖、UC-283 與經驗 008 共用文章），且 URL 正規化未剝除社群分享追蹤參數（`utm_content`、`utm_term`、`fbclid`、`gclid`、`s`、`t`）。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 加入連接號（`+`、`＋`、`&`、`＆`）切分與 `#` 標籤符號自動剝除，解決複合查詢與相鄰 hashtag 搜尋落空問題。
   - `SYNONYM_MAP` 大幅擴充日常高頻領域同義詞與異體字：
     - 日曆行程類：`行事曆` ↔ `日曆` ↔ `calendar`
     - 待辦事項類：`待辦` ↔ `代辦` ↔ `todo` ↔ `todoist`
     - 報帳憑證類：`報帳` ↔ `核銷` ↔ `發票` ↔ `收據` ↔ `invoice` ↔ `receipt`
     - 故障修復類：`debug` ↔ `排錯` ↔ `除錯` ↔ `修復` ↔ `bug`
     - 自動化工作流：`workflow` ↔ `工作流` ↔ `自動化` ↔ `排程`
     - 求職履歷類：`求職` ↔ `履歷` ↔ `面試` ↔ `cv` ↔ `resume`
     - 郵件通訊類：`email` ↔ `信件` ↔ `郵件` ↔ `信箱`
     - 程式碼類：`代碼` ↔ `程式碼` ↔ `程式` ↔ `code`
2. 案例中繼資料正規化：
   - 補齊 UC-001~007、010~012、014、015 共 12 篇案例頁首之標準 `- 網站標題：` 與 `- 一句話用途：`，使其與 `copy.json` 保持完全一致，全庫 318 案例達成 100% Markdown 原生覆蓋。
3. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：
     - 新增全庫 `cases/*.md` 與 `evidence/*.md` 檔案之 `- 證據狀態：` / `- 來源證據：` 必填欄位審核斷言。
     - 新增全庫 318 案例具備原生 Markdown 白話標題與用途之斷言。
     - 疑似重複偵測擴大至全庫跨目錄（`cases/`、`evidence/`、`sources/pending.md`），增列跨目錄候選斷言（UC-028 ↔ P-002、UC-283 ↔ evidence-008），並強化追蹤參數清除。
   - `tests/search.test.cjs`：加入連接號（`+`、`&`）、hashtag、以及行事曆/日曆、代辦/待辦、報帳/核銷/發票、debug/修復、workflow/工作流、面試/履歷、email/郵件、代碼/程式之搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：19/19 測試全數通過，324 筆條目全文、同義詞檢索、標點容錯、全庫證據檢查、跨目錄疑似重複候選與 Markdown 原生中繼資料檢驗通過。
下一輪建議：依重複來源候選清單（如多個案例共用同一討論串或長文網址）評估是否需在各案例頁內進一步精確標註發文時間碼或留言 anchor。

## 2026-10-18：高頻領域關鍵字同義詞擴充、等價網域疑似重複偵測強化與經驗檔白話標題補齊

先前走查與測試發現：
1. 搜尋詞彙斷層：
   - 讀者搜尋「ticket」結果為 0 筆，遺漏 16 筆工單／客服提單案例（如 UC-164 停滯工單清理、UC-014 客服退款、UC-083 需求澄清）；
   - 搜尋「飯店」、「旅館」或「hotel」為 0 筆，遺漏「住宿」（如 UC-151 行前住宿追蹤、UC-040 一日遊）；
   - 搜尋「multi-agent」僅命中 1 筆，遺漏 35 筆「多代理」與 10 筆「跨代理」案例（如 UC-005 雲端多 Bot PR 審查、UC-042 多 Bot 內容流水線）；
   - 搜尋「backup」僅命中 1 筆、「restore」0 筆，遺漏 24 筆「備份」與 8 筆「還原」案例（如 UC-067 身分恢復與備份、UC-236 狀態恢復）；
   - 搜尋「monitor」僅命中 1 筆，遺漏 31 筆「監看」、12 筆「監控」、8 筆「巡檢」與 8 筆「監測」案例（如 UC-015 頁面變更監看）；
   - 搜尋「weekly」為 0 筆，遺漏「週報」（UC-003、UC-056）；
   - 搜尋「health」為 0 筆，遺漏「健康」（10 筆）與「醫療」（10 筆）；
   - 搜尋「call」遺漏 20 筆「電話」與 9 筆「通話」案例（如 UC-257 語音電話對帳）；
   - 搜尋「security」與「privacy」未與「資安」/「安全性」及「隱私」雙向連動。
2. 疑似重複來源偵測之網址正規化缺少等價網域別名（Canonical Domain Aliasing）與非內容參數清除：
   - `reddit.com` 與 `www.reddit.com` / `old.reddit.com` 過去未歸一化，導致 UC-171 與 UC-284 共用同一個 Reddit 討論串（`r/metaai/comments/1wydk5b/what_do_you_use_muse_for`）被漏判；
   - `twitter.com` 與 `x.com` 未歸一化；
   - `youtu.be` 與 `youtube.com` 短網址未映射；
   - Substack 等外部文章附帶 `?open=false` 等狀態參數時，與乾淨網址無法相符（如 UC-043 與 UC-241 共用 Substack 文章）。
3. 經驗與踩坑檔案（`evidence/`）欄位缺漏：
   - `evidence/008-morning-brief-validation.md` 與 `evidence/013-authentication-diagnosis.md` 缺少原生 `- 網站標題：` 與 `- 一句話用途：`，導致卡片與搜尋展示時降級回退；
   - `tests/audit.test.cjs` 先前只審核 `cases/`，未涵蓋 `evidence/`。

本輪改善：
1. `assets/app.js`：
   - `SYNONYM_MAP` 大幅擴充高頻英文與繁中專業領域同義詞：
     - 工單客服類：`ticket` ↔ `工單` ↔ `客服` ↔ `support`
     - 住宿旅遊類：`飯店` ↔ `旅館` ↔ `住宿` ↔ `hotel`
     - 多代理協作類：`多代理` ↔ `multi-agent` ↔ `跨代理` ↔ `代理協作`
     - 備份還原類：`備份` ↔ `backup` ↔ `還原` ↔ `復原` ↔ `restore`
     - 監看巡檢類：`監看` ↔ `監控` ↔ `監測` ↔ `巡檢` ↔ `monitor`
     - 週報時程類：`週報` ↔ `weekly` ↔ `每週報告` ↔ `週報表`
     - 醫療健康類：`健康` ↔ `醫療` ↔ `health` ↔ `健檢`
     - 通話電話類：`電話` ↔ `通話` ↔ `call`
     - 資安防護類：`資安` ↔ `安全性` ↔ `security`
     - 隱私保護類：`隱私` ↔ `privacy`
2. 經驗與踩坑欄位補齊：
   - `evidence/008-morning-brief-validation.md`：補齊「跨帳號會議與郵件晨報的準時性與覆蓋驗證」原生白話標題與用途。
   - `evidence/013-authentication-diagnosis.md`：補齊「遇到授權失效先看錯誤證據，避免盲目重登」原生白話標題與用途。
3. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：
     - `normalizeSourceUrl` 導入等價域名轉換（Reddit `www`/`old` → `reddit.com`、Twitter → `x.com`、`youtu.be` → `youtube.com/watch?v=`）及追蹤/狀態參數剝除（`feature`, `open`, `context`）。
     - 新增 UC-171 ↔ UC-284（Reddit）與 UC-043 ↔ UC-241（Substack）候選重複偵測斷言，確認 321 筆主案例完全保留不刪除。
     - 擴大原生白話標題與用途檢查，涵蓋 `cases/` 與 `evidence/` 全部檔案。
   - `tests/search.test.cjs`：加入 ticket/工單、飯店/hotel/住宿、multi-agent/多代理、backup/restore/備份、monitor/監看、weekly/週報、health/健康、call/電話、security/資安、privacy/隱私之搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：19/19 測試全數通過，327 筆條目全文、同義詞擴充檢索、等價網域疑似重複候選偵測、全庫原生白話標題覆蓋檢驗通過。
下一輪建議：依重複來源候選清單（如多個案例共用同一討論串或長文網址）評估是否需在各案例頁內進一步精確標註發文時間碼或留言 anchor。

## 2026-10-18：搜尋同義詞對稱性重構、README 關鍵字與高頻領域同義詞擴充、疑似重複來源叢集檢測強化

先前走查與測試發現：
1. 搜尋同義詞非對稱與查無結果：
   - `assets/app.js` 的 `SYNONYM_MAP` 存在 21 組非對稱映射（例如 `登錄` 映射至 `登入`，但讀者搜尋 `登入` 時卻未映射回 `登錄`；`每日報表` 映射至 `晨報`，但搜尋 `晨報` 時卻無映射；`workflow` 與 `工作流` 包含 `排程`，但搜尋 `排程` 卻未映射；`報帳` 包含 `對帳`，但搜尋 `對帳`（7 篇標籤）完全落空；`信箱` 包含 `收件匣`，但搜尋 `收件匣` 未對應至 `信箱`/`email`；`週報` 映射至 `週報表`，反向無映射；`scraping` 映射至 `抓取`，反向無映射）。
   - README 重點建議之核心關鍵字檢索割裂：讀者搜尋「旅行」或「travel」，因庫內 6 篇只有「旅遊」而嚴重漏案（反之亦然，7 篇只有「旅行」）；搜尋「收件箱」（56 篇標記「收件匣」、0 篇「收件箱」）結果為 0 筆、搜尋「inbox」僅 2 筆（漏掉 54 筆）；搜尋「特價」或「比价」結果為 0 筆（遺漏 16 篇比價、25 篇折扣、12 篇降價）。
   - 工作與生活高頻領域檢索斷層：全庫有 46 筆「會議」案例，讀者搜尋「開會」或「meeting」結果為 0 筆；142 筆「提醒」、188 筆「通知」，搜尋「alert」或「notification」或「推播」結果為 0~2 筆；126 筆「退款」、39 筆「退貨」，搜尋「refund」結果為 0 筆；播客案例與「podcast」無法雙向互通；智慧家庭（UC-170, UC-330）與常見關鍵字「智能家居」、「智能家庭」、「智慧家電」、「iot」、「物聯網」無法互通；財務「對帳」與「reconciliation」無法互通；求職案例遺漏「job」、「hiring」、「招聘」、「招募」。
2. 疑似重複來源偵測之 URL 正規化與候選覆蓋：
   - `normalizeSourceUrl` 遺漏平台語系與視圖狀態參數（如 `hl`、`mobile-help`、`track`、`raw_json`），且僅斷言 5 組候選；
   - 全庫多組已確認共用第一手討論串/報告來源的候選叢集未建立自動化斷言（如 UC-101 ↔ UC-102 Grok Bot 採購 Reddit 串、UC-156 ↔ UC-250 Grok Bot 郵件搬遷 Reddit 串、UC-107 ↔ UC-108 ChatPRD Muse 工作流、UC-133 ↔ UC-180 AppleVis Muse 無障礙評測、UC-151 ↔ UC-214 朱亞威個人部署部落格等）。
3. 稽核測試門檻與全庫計數同步：
   - 隨著 UC-330 新增，全庫主案例數已達 322 筆；`tests/audit.test.cjs` 既有的邊界斷言（310、318）應同步更新至 322，並驗證 322 個案例在 INDEX.md 與磁碟檔案間的完整一致性。

本輪改善：
1. `assets/app.js`：
   - 重構同義詞機制：改以 `SYNONYM_GROUPS` 宣告 36 組同義詞族群，動態生成 100% 互映對稱（Symmetric & Reflexive）的 `SYNONYM_MAP`，徹底消除單向映射與不對稱漏洞。
   - 擴充 README 核心關鍵字及高頻生活／工作領域同義詞：
     - 旅遊行程類：`旅遊` ↔ `旅行` ↔ `travel`
     - 郵件通訊類：`收件匣` ↔ `收件箱` ↔ `inbox` ↔ `信箱` ↔ `email` ↔ `信件` ↔ `郵件`
     - 比價優惠類：`比價` ↔ `比价` ↔ `折扣` ↔ `降價` ↔ `特價` ↔ `特賣` ↔ `促銷` ↔ `省錢`
     - 會議協作類：`會議` ↔ `開會` ↔ `meeting`
     - 提醒通知類：`提醒` ↔ `通知` ↔ `alert` ↔ `notification` ↔ `推播`
     - 退款退貨類：`退款` ↔ `退貨` ↔ `refund`
     - 播客語音類：`播客` ↔ `podcast`
     - 智慧家庭類：`智慧家庭` ↔ `智能家居` ↔ `智能家庭` ↔ `智慧家電` ↔ `iot` ↔ `物聯網`
     - 財務對帳類：`對帳` ↔ `reconciliation` ↔ `報帳` ↔ `核銷`
     - 求職招募類：`求職` ↔ `履歷` ↔ `面試` ↔ `招聘` ↔ `招募` ↔ `cv` ↔ `resume` ↔ `job` ↔ `hiring`
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：
     - `normalizeSourceUrl` 擴充支援 `x.com` / `reddit.com` 行動版子網域及 `hl`、`mobile-help`、`track`、`raw_json` 參數清理。
     - 擴充候選重複來源斷言：增加 UC-101 ↔ UC-102、UC-156 ↔ UC-250、UC-107 ↔ UC-108、UC-133 ↔ UC-180、UC-151 ↔ UC-214 等多個候選叢集檢測，恪守「只列候選、不自行刪除、總案例數 322 保持完整」。
     - 同步主案例與索引連結數量下限至 322 筆。
   - `tests/search.test.cjs`：
     - 增加 `SYNONYM_MAP` 100% 數學對稱性與自反性自動化回歸斷言。
     - 增加旅行/travel、收件箱/inbox、特價/比价、開會/meeting、alert/推播、refund、podcast、智能家居/iot、對帳/reconciliation、job/hiring、晨報、登入、排程之搜尋回歸斷言。

## 2026-10-18：核心 AI 術語同義詞擴充、搜尋句號標點容錯、查證日期萃取校正與全庫疑似重複來源叢集審核

先前走查與測試發現：
1. 核心 AI 領域關鍵字檢索斷層：
   - 讀者搜尋「智能體」或「智能体」結果為 0 筆（遺漏 181 筆「代理」與 69 筆「agent」案例）；
   - 搜尋「文字辨識」、「圖片辨識」或「光學字元辨識」結果為 0 筆（遺漏 UC-098、UC-133、UC-176、UC-178、UC-251 等 OCR 案例）；
   - 搜尋「translate」為 0 筆（遺漏 55 筆「翻譯」案例）；
   - 搜尋「總結」或「summarize」為 0 筆（遺漏 64 筆「摘要」案例）；
   - 搜尋「crawler」或「scraper」為 0 筆（遺漏 16 筆「爬蟲/抓取」案例）；
   - 搜尋「視頻」為 0 筆（遺漏 88 筆「影片」案例）；
   - 搜尋「推特」為 0 筆（遺漏 247 筆「x」與 2 筆「twitter」案例）；
   - 搜尋「cron」為 0 筆（遺漏「定時/排程」案例）；
   - 搜尋「排障」或「troubleshooting」為 1 筆（遺漏 36 筆「故障/修復/debug」案例）；
   - 搜尋「rag」與「知識庫/檢索」未雙向互通；
   - 搜尋「auto-reply」未與「自動回覆」互通。
2. 搜尋標點與句號容錯漏洞：
   - 讀者複製帶句號的詞彙（如「旅遊。」、「比價.」）輸入搜尋框時，因 tokenize 未剝除句號導致檢索結果直接降為 0 筆；
   - 以 `UC#001`、`UC.001`、`P#003` 搜尋時，tokenize 與 matchCase 未將 `#` 與 `.` 當作分隔符號，導致案例跳轉失敗。
3. 查證日期萃取優先級偏差：
   - `assets/app.js` 的 `metadata` 過去僅取 `lead` 中首個 `20\d{2}-\d{2}-\d{2}`，導致 UC-101~108、208~217、313~319、330 等 50 篇案例之 `entry.date` 被作者歷史發表日（如 2026-08-31）覆蓋，遺漏真正的查證核對日（2026-10-18、2026-10-16）。
4. 疑似重複來源偵測之 URL 正規化與候選覆蓋：
   - `normalizeSourceUrl` 補入 `facebook.com` 行動與 Web 網域歸一化、社群追蹤參數（`si`、`igsh`、`trk`、`spm_id_from`）剝除及 hash 錨點清除；
   - 增加 UC-124 ↔ UC-215、UC-095 ↔ UC-096、UC-066 ↔ UC-182、UC-155 ↔ UC-248、UC-198 ↔ UC-252、UC-074 ↔ UC-239、UC-002 ↔ UC-073、UC-024 ↔ UC-035 等多組共享來源候選叢集斷言，確認全庫 322 個案例完全保留不刪除。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 擴充支援中英文句號（`。` 與獨立/結尾 `.`）剝除，並支援 `UC#001`、`UC.001`、`P#003` 正規化為 `uc-001`、`p-003`。
   - `matchCase` 擴充支援帶 `#` 與 `.` 之案例編號比對。
   - `SYNONYM_GROUPS` 擴充 13 組高頻同義詞群（智能體/agent/代理、OCR/文字辨識/圖片辨識、translate/翻譯、總結/summarize/摘要、crawler/scraper/爬蟲、視頻/影片、推特/twitter/x、cron/排程、排障/troubleshooting/修復、rag/知識庫、auto-reply/自動回覆、qa/測試、audit/審查），並維持 100% 互映對稱性。
   - `metadata` 優先自 `- 查證日期：`、`- 查閱日期：`、`- 核對日期：`、`- 研究核對日：`、`- 首次收錄[／、]最近查證：` 等前綴萃取查證日期，修正歷史發表日覆蓋查證日問題。
2. `tests/search.test.cjs` 與 `tests/audit.test.cjs`：
   - `tests/search.test.cjs`：加入句號標點容錯、UC#001/UC.001 案例查詢、新增各組核心 AI 術語回歸斷言、以及 UC-330/UC-101 查證日期優先級驗證。
   - `tests/audit.test.cjs`：
     - `normalizeSourceUrl` 擴充 Facebook 網域、社群追蹤參數與 hash 清理。
     - 擴充 8 組真實公開來源疑似重複候選叢集回歸斷言，恪守「只列候選、不自行刪除、總案例數 322 保持完整」。
     - 新增全庫 322 案例查證日期有效萃取自動化測試。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：20/20 測試全數通過，328 筆條目全文、同義詞對稱性驗證、句號容錯、疑似重複叢集偵測、查證日期精準萃取與全庫 322 案例一致性檢驗通過。
下一輪建議：依重複來源候選清單（如多個案例共用同一討論串或長文網址）評估是否需在各案例頁內進一步精確標註發文時間碼或留言 anchor。

## 2026-10-18：高頻生活與工作領域同義詞擴充、疑似重複來源候選叢集擴充與審核門檻同步

先前走查與測試發現：
1. 搜尋詞彙斷層與新案例檢索痛點：
   - 物流與運送類：讀者搜尋「快遞」或「shipping」或「delivery」為 0 筆（或 1 筆），嚴重遺漏 UC-331（網購未送達催退）、UC-053、UC-088、UC-117、UC-181 等物流追蹤與退款催辦案例；
   - 社群與發文類：讀者搜尋「發帖」、「社交媒體」或「sns」結果為 0 筆，遺漏 91 筆貼文、55 筆發文與 UC-332（X 營運半自動發文前人工關卡）、UC-006、UC-077 等社群案例；
   - 外聯與客戶拓展類：讀者搜尋「outreach」（僅 1 筆）、「開發信」（0 筆）、「拓客」（0 筆），遺漏 UC-333（外聯 Notion 跨代理記憶）、UC-014、UC-059、UC-285 等商務外聯案例；
   - 客戶與顧客類：全庫有 47 筆「客戶」，但讀者搜尋「顧客」（僅 6 筆）、「customer」（僅 2 筆）、「client」（僅 2 筆）、「用戶」（僅 6 筆）時無法檢索 40+ 筆相關案例；
   - 記憶與知識庫類：全庫有 26 筆「記憶」（如 UC-071、UC-255、UC-333），讀者搜尋「memory」僅 3 筆、搜尋「記憶庫」僅 1 筆；
   - 提示詞類：全庫有 141 筆「提示詞」，讀者搜尋「prompt」僅得 8 筆、搜尋「提示語」為 0 筆；
   - 審批核准類：全庫有 173 筆「核准」，讀者搜尋常見同義詞「審批」僅 1 筆、「approval」僅 16 筆；
   - 電商與網購類：讀者搜尋「ecommerce」為 0 筆，與「網購」、「電商」、「購物」割裂。
2. 疑似重複來源候選叢集偵測覆蓋：
   - 專案既有候選重複偵測未涵蓋 Toolchain JP PRs（UC-006 ↔ UC-042）、OpenAI Secure MCP Tunnels 指南（UC-074 ↔ UC-239）、ChatGPT dots controls 文件（UC-005 ↔ UC-023 ↔ UC-073）、ChatGPT dots computers-and-apps 文件（UC-005 ↔ UC-006 ↔ UC-025）等跨案例共享公開來源候選；
   - 隨著 UC-331~333 納入，全庫主案例數由 322 增至 325 筆；`tests/audit.test.cjs` 既有案例數與連結數邊界斷言（322）需同步更新至 325，嚴格維持「只列候選、不自行刪除、325 筆案例保持完整」。

本輪改善：
1. `assets/app.js`：
   - `SYNONYM_GROUPS` 擴充 9 組高頻生活／工作領域同義詞群（物流/快遞/包裹/運送/配送/shipping/delivery、社群/社交媒體/sns、發文/貼文/發帖/post、外聯/outreach/開發信/拓客/獲客、客戶/顧客/用戶/client/customer、記憶/memory/記憶庫、提示詞/prompt/提示語/提示、核准/審批/approval/人工確認/人工核准、網購/電商/購物/ecommerce/shopping），並由系統自動建置 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：
     - 同步主案例數量下限與 INDEX.md 連結下限至 325 筆。
     - 擴充 4 組真實公開來源疑似重複候選叢集回歸斷言（Toolchain JP PRs、Secure MCP Tunnels、ChatGPT dots controls、ChatGPT dots computers-and-apps），恪守「只列候選、不自行刪除、總案例數 325 保持完整」。
   - `tests/search.test.cjs`：加入快遞/shipping/delivery、發帖/sns/社交媒體、outreach/開發信/拓客、顧客/customer/client、memory/記憶庫、prompt/提示語、審批/approval、ecommerce/網購之搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：20/20 測試全數通過，331 筆條目全文、同義詞擴充檢索、疑似重複來源候選叢集審核、全庫 325 案例一致性檢驗通過。
下一輪建議：依重複來源候選清單（如多個案例共用同一討論串或長文網址）評估是否需在各案例頁內進一步精確標註發文時間碼或留言 anchor。





## 2026-10-18：搜尋條件可見、保留原意的空結果復原

雲端三尺寸實測：旅遊／Grok Bot／旅遊分類／作者報告原有 3 筆，加開發情境後為 0；原「顯示全部案例」會清掉關鍵字。新增可逐項移除的條件摘要、保留關鍵字的清除篩選、精確計數的單項放寬建議及修改關鍵字；支援動態移除後焦點、長文字與缺載入說明。

先紅後綠，24/24 單元測試與 Chromium 1440／390／320px、Firefox／WebKit 390px 三情境通過；新增流程 10 次 axe 掃描 0 違規。獨立審查無阻擋事項，已補 CI 測試接入、跨引擎驗收與部署等待。保留協作者 296 合格／331 收錄計數與研究資料。

[前後截圖、指令、量測、限制與審查紀錄](docs/qa/2026-10-18-search-recovery/README.md)。下一輪：評估手機進階篩選收合，減少到結果前的捲動。

## 2026-10-18：合約、報銷、薪資與設備同義詞擴充、跨案例公開來源疑似重複候選叢集擴充

先前走查與測試發現：
1. 搜尋詞彙斷層與專業工作流檢索痛點：
   - 合約與法律文件：讀者搜尋「合同」得 0 筆、「contract」得 1 筆，嚴重遺漏全庫 16 筆「合約」案例（如 UC-021、UC-154、UC-155、UC-174）；
   - 報銷與請款：全庫有 27 筆「報帳/核銷/對帳」，但讀者搜尋高頻職場財務詞彙「報銷」僅得 2 筆、「reimbursement」為 0 筆；
   - 薪資與人事：讀者搜尋「薪水」為 0 筆、「salary」為 0 筆，遺漏 4 筆「薪資」案例（如 UC-230、UC-035、UC-051）；
   - 客訴與投訴：全庫有 64 筆客服與工單，但讀者搜尋「客訴」得 0 筆，未與「客服/工單/support」互通；
   - 設備與硬體：讀者搜尋「設備」得 34 筆、「裝置」得 33 筆、「device」僅 2 筆、「硬體」得 8 筆，彼此斷層未互通；
   - 合規與法規：讀者搜尋「合規」得 14 筆、「compliance」得 0 筆、「法規」得 10 筆，彼此斷層；
   - 部署與發布：全庫有 56 筆「部署」，讀者搜尋「deploy」僅得 3 筆、「deployment」得 0 筆；
   - 同步：全庫有 34 筆「同步」，讀者搜尋「sync」僅得 2 筆；
   - 儀表板與視覺化：讀者搜尋「dashboard」僅得 2 筆，未與「儀表板/儀錶板」互通；搜尋「chart」僅得 3 筆，未與「圖表/趨勢圖」互通；
   - 檢索與搜尋：讀者搜尋「search」僅得 14 筆，未與「搜尋/搜索」互通；「retrieval」未與「rag/檢索」互通。
2. 疑似重複來源候選叢集偵測覆蓋：
   - 專案既有候選重複偵測未涵蓋 Dev.to ChatGPT Dots 實測（UC-283 ↔ 驗證檔 evidence/008）、Grok Bot GTM 指南（UC-017 ↔ UC-019）、Grok Bot Legal Ops 指南（UC-021 ↔ UC-154）、OpenAI Introducing Dots 公告（UC-023 ↔ UC-024）、Semicolon Expected 通訊（UC-043 ↔ UC-241）、AI Agents Library 評測（UC-039 ↔ UC-049）、Toolchain JP 驗證部落格（UC-006 ↔ UC-042）等跨案例公開來源候選；
   - 恪守 AI 案例庫維護規範：「疑似重複只列候選，不自行刪除；總案例數 325 保持完整」。

本輪改善：
1. `assets/app.js`：
   - `SYNONYM_GROUPS` 擴充 8 組核心職場／開發同義詞群（合約/合同/contract/協議、薪資/薪水/薪酬/payroll/salary、設備/裝置/device/硬體/hardware、合規/compliance/法規/規章、部署/deploy/deployment、同步/sync/synchronization、圖表/chart/圖表分析/趨勢圖、搜尋/搜索/search），並將 dashboard、報銷/reimbursement、客訴/投訴、retrieval 分別補入儀表板、報帳、客服、rag 詞群，維持 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：
     - 擴充 7 組真實公開來源疑似重複候選叢集回歸斷言（Dev.to Dots、Grok GTM 指南、Grok Legal Ops 指南、OpenAI Dots 公告、Semicolon Expected 通訊、AI Agents Library 評測、Toolchain 部落格），恪守「只列候選、不自行刪除、總案例數 325 保持完整」。
   - `tests/search.test.cjs`：
     - 加入合同/contract、報銷/reimbursement、薪水/salary、客訴/投訴、device/硬體、compliance/規章、deploy、sync、dashboard、chart/趨勢圖、search、retrieval 等搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：24/24 測試全數通過，331 筆條目全文、同義詞擴充檢索、疑似重複來源候選叢集審核、全庫 325 案例一致性檢驗通過。
下一輪建議：依重複來源候選清單（如多個案例共用同一討論串或長文網址）評估是否需在各案例頁內進一步精確標註發文時間碼或留言 anchor。

## 2026-10-18：手機搜尋前置與按需篩選

雲端實測 390px 搜尋區原先先放快捷按鈕與五個篩選：輸入框距區段起點 416px、首張結果再往下 361px。改用搜尋前置與原生 details；手機初始收合、桌面展開，後續輸入／返回／縮放保留使用者選擇。已套用條件與零結果復原保持可見，摘要同步顯示篩選數。

實測改善為 158px／181px；320px 同樣達標。24/24 測試、Chromium 三尺寸與 Firefox／WebKit 手機的三情境通過，新流程十個引擎尺寸／展開狀態的 axe 掃描無違規。獨立審查無阻擋；補齊閉合 Tab、760／761px 及共用測試的跨引擎 CI paths。協作者 main f59fe44 五個研究檔完整保留；整合版本與正式 Pages 仍以對應 CI 結果為準。

[前後截圖、量測、測試指令、獨立審查與限制](docs/qa/2026-10-18-mobile-search/README.md)。下一輪：檢查分享搜尋網址的落點，縮短回訪者到結果的距離。

## 2026-10-18：權限、庫存、報價、快取、介面與重試同義詞擴充、跨案例公開來源疑似重複候選叢集擴充

先前走查與測試發現：
1. 搜尋詞彙斷層與系統功能檢索痛點：
   - 權限與安全授權：全庫有 315 筆「權限」與 243 筆「授權」，但讀者搜尋高頻英文詞「permission」僅得 3 筆、「authorization」得 0 筆，無法檢索大量安全邊界案例（如 UC-283、UC-042 等）；
   - 庫存管理：全庫有 18 筆「庫存」（如 UC-003、UC-105、UC-157、UC-212、UC-319），但搜尋「inventory」僅得 1 筆、「stock」僅得 1 筆；
   - 報價與估價：全庫有 25 筆「報價」與 3 筆「估價」（如 UC-136、UC-137、UC-328），但搜尋英文「quote」僅得 2 筆、「quotation」得 0 筆；
   - 快取與緩存：全庫有 20 筆「快取」（如 UC-049、UC-061、UC-075、UC-089、UC-217 等），但搜尋「cache」僅得 4 筆、「caching」得 0 筆、「緩存」得 0 筆；
   - 求職與面試：全庫有 11 筆「面試」，既有求職詞群涵蓋 cv/resume/job/hiring，但漏失了高頻詞「interview」（搜尋「interview」得 0 筆）；
   - 介面與 API：全庫有 52 筆「介面」、87 筆「api」，但搜尋「interface」得 0 筆、「接口」僅 2 筆；
   - 重試機制：全庫有 29 筆「重試」（如 UC-010、UC-041、UC-042、UC-074、UC-328 等），但搜尋「retry」僅得 1 筆；
   - 告警與警報：全庫有 106 筆「alert/通知」，但搜尋「告警」僅 1 筆、「警報」僅 6 筆，未納入既有提醒詞群；
   - 回滾與復原：既有「備份/復原/還原」詞群未納入「回滾/rollback」（搜尋「rollback」得 0 筆）。
2. 疑似重複來源候選叢集偵測覆蓋：
   - `learn.chatgpt.com/docs/dots/controls` 既有斷言只涵蓋 UC-005, UC-023, UC-073，實際上 UC-218（第三方技能安裝審核）亦共用此控制文件，形成包含 4 案例的候選叢集；
   - `about.fb.com/news/2026/09/introducing-muse-small-business` 被 UC-022、UC-033、UC-034、UC-179 4 個案例共用；
   - `introducing.muse.ai` 被 UC-026、UC-030、UC-031、UC-032 4 個案例共用；
   - `x.ai/bot/guides/designing-grok-bot-with-grok-bot` 被 UC-002 與 UC-020 共用；
   - `help.openai.com/en/articles/20001529-dots-privacy-security-and-safety-faqs` 被 UC-006 與 UC-071 共用；
   - `reddit.com/r/grokbot/comments/1x1d7n9/comment/peuhvej` 被 UC-101 與 UC-102 共用；
   - `github.com/toolchainjp/toolchainjp-lp/pull/12` 與 `pull/13` 被 UC-006 與 UC-042 共用；
   - 恪守 AI 案例庫維護規範：「疑似重複只列候選，不自行刪除；總案例數 325 保持完整；嚴格合格案例數 296 保持一致」。

本輪改善：
1. `assets/app.js`：
   - `SYNONYM_GROUPS` 擴充 6 組新同義詞群（權限/授權/permission/permissions/authorization/auth/access、庫存/存貨/inventory/stock、報價/估價/quote/quotation、快取/緩存/cache/caching、介面/接口/interface/api、重試/重跑/retry），並將 interview 補入求職詞群、告警/警報補入提醒詞群、回滾/rollback 補入備份復原詞群，維持 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：擴充 7 組真實公開來源疑似重複候選叢集斷言（Dots controls 4 案叢集、Muse small business 4 案叢集、Introducing muse 4 案叢集、Designing Grok 指南、Dots privacy FAQ、Reddit 採購討論留言、Toolchain PR 12/13），恪守「只列候選、不自行刪除、總案例數 325 保持完整」。
   - `tests/search.test.cjs`：加入 permission/authorization、inventory/stock、quote/quotation、cache/caching/緩存、interview、interface/接口、retry、告警/警報、rollback 等搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：24/24 測試全數通過，331 筆條目全文、同義詞擴充檢索、疑似重複來源候選叢集審核、全庫 325 案例一致性檢驗通過。
下一輪建議：依多案例共用公開來源候選叢集（如多個案例共用同一介紹頁或官方文檔），評估是否需在案例頁中提供 anchor 或頁面子章節指引。

## 2026-10-18：驗證、訂閱、外掛、流水線、回歸與日報同義詞擴充、大型官方與原帖來源疑似重複候選叢集擴充

先前走查與測試發現：
1. 搜尋詞彙斷層與使用體驗痛點：
   - 驗證與核實：全庫有 194 筆「驗證」，但搜尋英文關鍵詞「validate」僅得 1 筆、「verify」得 0 筆，無法檢索大量驗證案例（如 UC-156 等）；
   - 訂閱管理：全庫有 51 筆「訂閱」，但搜尋「subscription」或「subscriptions」僅得 11 筆，漏失 40 筆僅標註中文訂閱的案例（如 UC-007、UC-270 等）；
   - 外掛與擴充：全庫有 21 筆「外掛」，但搜尋英文「plugin」僅得 6 筆、「plugins」得 5 筆、「extension」得 1 筆、「extensions」得 1 筆；
   - 流水線與工作流：既有 workflow 詞群遺漏多代理與音影常見的「流水線、pipeline、pipelines」（搜尋「pipeline」得 2 筆、「pipelines」得 0 筆），無法檢索 UC-042「多 Bot 內容流水線」與 UC-054「多工具流水線」；
   - 測試與回歸：既有測試詞群包含 testing，但遺漏基本詞「test」（得 30 筆）、「tests」（得 6 筆）及「回歸」、「regression」（得 0 筆），導致無法檢索全庫 172 筆「測試」案例；
   - 日報與每日報表：既有週報包含 weekly，但對稱的「日報」詞群遺漏「daily」（搜尋「daily」得 2 筆，漏失 21 筆日報案例）；
   - 預算管理：全庫有 22 筆「預算」，但搜尋「budget」僅得 1 筆、「budgeting」得 0 筆；
   - 日誌記錄：全庫有 59 筆「日誌」，但搜尋「logs」僅得 2 筆、「logging」得 0 筆；
   - 退款與合約協議：既有詞群分別遺漏「refunds」與「agreement」。
2. 疑似重複來源候選叢集偵測覆蓋：
   - `docs.x.ai/grok-bot/computer-and-apps` 被 18 個案例與 1 個經驗補充（共 19 筆檔案）共用；
   - `meta.com/help/subscriptions/1021145227643680` 被 UC-016、UC-026～UC-034 等 10 個案例共用；
   - `docs.x.ai/grok-bot/skills-routines-and-automations` 被 UC-006、UC-015、UC-039、UC-046、UC-060、UC-061、UC-208、UC-268、UC-269 等 9 個案例共用；
   - `about.fb.com/news/2026/09/introducing-muse-personal-ai-agent` 被 UC-016、UC-027～029、UC-067、UC-104～105、UC-107～108 等 9 個案例共用；
   - `docs.x.ai/grok-bot/bots` 被 6 個案例與 1 個模板補充（共 7 筆檔案）共用；
   - `learn.chatgpt.com/docs/dots` 被 UC-023～025、UC-030、UC-035、UC-073 等 6 個案例共用；
   - `docs.x.ai/grok-bot/faq` 被 UC-027、UC-054、UC-073、UC-225、UC-234 等 5 個案例共用；
   - `aiformortals.co/blog/grok-bot-vs-meta-muse-vs-chatgpt-dots` 被 UC-001～003 等 3 個案例共用；
   - P-002 原始 X 貼文（SteveFebbraro1、billysticker）在 `cases/028-bill-comparison-preparation.md` 與 `sources/pending.md` 之間共用；
   - 恪守 AI 案例庫規範：「疑似重複只列候選，不自行刪除；總案例數 325 保持完整；嚴格合格案例數 296 保持一致」。

本輪改善：
1. `assets/app.js`：
   - `SYNONYM_GROUPS` 擴充 5 組新同義詞群（驗證/核實/查核/verify/verification/validate/validation、訂閱/訂閱制/subscription/subscriptions、外掛/擴充/擴充功能/插件/plugin/plugins/extension/extensions、預算/編列預算/budget/budgeting、日誌/日誌記錄/log/logs/logging）。
   - 在既有組別補齊對稱詞彙：工作流補流水線/pipeline/pipelines、測試補test/tests/回歸/regression、日報補daily、合約補agreement、退款補refunds，維持 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：擴充 10 組核心官方與原作者來源疑似重複候選叢集斷言（Grok Bot 19 檔電腦控制叢集、Meta 10 案訂閱幫助中心、Grok Bot 9 案自動化文檔、Muse 9 案個人代理介紹、Grok Bot 7 檔機器人文檔、Dots 6 案基礎文檔、Grok Bot 5 案 FAQ、S-001 3 案同題比較、P-002 2 組原帖與待查共用），恪守「只列候選、不自行刪除、總案例數 325 保持完整」。
   - `tests/search.test.cjs`：加入 validate/verify、subscription/subscriptions、plugin/extension、pipeline/pipelines、test/regression、daily、budget、logging、refunds、agreement 等搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：24/24 測試全數通過，331 筆條目全文、同義詞擴充檢索、疑似重複來源候選叢集審核、全庫 325 案例一致性檢驗通過。
下一輪建議：依多案例共用公開來源候選叢集（如共用同一官方功能手冊或彙整頁面），評估是否需在案例頁中提供 anchor 或段落指引。

## 2026-10-18：搜尋分享與回到結果

正式站雲端實測分享「旅遊＋Grok Bot」仍落在首頁，390px 結果數在 1,874px；直接案例關閉則聚焦抽卡。新增結果旁「複製搜尋連結」、無剪貼簿／拒絕權限時的手動備援、保留六項條件且排除無關參數的網址。搜尋直鏈落在搜尋區，直接案例關閉回到結果；保留站內原按鈕、一般首頁與其他錨點。鍵盤重試先移到持續存在的狀態，避免錯誤區隱藏造成失焦。

結果數位置實測桌面 1,502→683px、390px 1,874→510px、320px 2,042→562px。27/27 測試與兩套雲端 QA 通過；新流程 Chromium 三尺寸、Firefox／WebKit 手機三情境和10次 axe掃描均無違規。獨立審查指出並確認修正重試焦點；未改研究資料或296合格／331收錄計數。主代理模型設定無法查證，實作與驗收使用遠端 GitHub／既有雲端 runner，未修改本機工作樹。

[前後截圖、方案取捨、測試指令、原始量測與限制](docs/qa/2026-10-18-shared-search/README.md)。正式發布仍以合併後 Pages 建置和已部署資產比對為準。下一輪：量測全文搜尋的不相關結果，再評估卡片匹配摘要或排序。

## 2026-10-18：資料庫、登入、試算表、附件、觸發、憑證與異常同義詞擴充、官方頁與討論串疑似重複候選叢集擴充

先前走查與測試發現：
1. 搜尋詞彙斷層與檢索體驗痛點：
   - 資料庫與 SQL：全庫有 25 筆「資料庫」，但搜尋常見英文詞「database」得 0 筆、「sql」得 12 筆，簡體「数据库」得 0 筆；
   - 登入與身分認證：全庫有 145 筆「登入」，但搜尋高頻英文詞「login」得 0 筆、「signin」僅 2 筆；
   - 試算表與表格：全庫有 29 筆「試算表」、29 筆「excel」、29 筆「sheets」，但搜尋常見英文詞「spreadsheet」得 0 筆、「spreadsheets」得 0 筆、「csv」得 22 筆；
   - 附件檢索：全庫有 32 筆「附件」，但搜尋英文詞「attachment」得 0 筆、「attachments」得 0 筆（如 UC-234、UC-297 等）；
   - 觸發機制：全庫有 38 筆「觸發」，但搜尋英文詞「trigger」得 0 筆、「triggers」得 0 筆（如 UC-074、UC-239 等）；
   - 憑證與金鑰：全庫有 94 筆「憑證」、22 筆「金鑰」、36 筆「密碼」，但搜尋英文「credential」得 0 筆、「credentials」得 0 筆；
   - 模板與範本：全庫有 30 筆「模板」、17 筆「範本」，但既有未納入完整模板詞群（template 僅 7 筆、templates 僅 3 筆）；
   - 異常檢測：全庫有 32 筆「異常」，但搜尋英文「anomaly」僅 1 筆、「anomalies」得 0 筆；
   - Webhook：全庫有 7 筆「webhook」，搜尋複數「webhooks」得 0 筆；
   - 爬蟲：全庫有 17 筆「爬蟲/抓取」，既有詞群含 scraping/crawler/scraper，遺漏動詞原型「scrape」（得 0 筆）；
   - 排錯與除錯：全庫有 88 筆「排錯/除錯/debug」，既有詞群含 troubleshooting，遺漏「troubleshoot」（僅 1 筆）與「debugging」（僅 1 筆）；
   - 待辦事項：全庫有 32 筆「待辦/todo」，既有詞群遺漏複數「todos」（得 0 筆）與「task」（得 5 筆）、「tasks」（得 3 筆）；
   - 帳單：全庫有 34 筆「帳單/bill」，既有詞群遺漏複數「bills」（得 0 筆）與「billing」（僅 4 筆）；
   - 發票與收據：全庫有 94 筆「發票/invoice/receipt」，既有詞群遺漏複數「invoices」（得 0 筆）與「receipts」（僅 1 筆）。
2. 疑似重複來源候選叢集偵測覆蓋：
   - `https://muse.ai/business` 被 UC-003、UC-016、UC-026～UC-034 等 11 個案例共用；
   - `https://meta.com/en-gb/help/artificial-intelligence/1687253048996149` 被 UC-016、UC-026～UC-034、UC-267 等 11 個案例共用；
   - `https://docs.x.ai/grok-bot/approvals-security-and-privacy` 被 UC-101、UC-102、UC-103、UC-126、UC-156、UC-174、UC-252、UC-276、UC-318、UC-319 與 evidence/009 等 11 筆檔案共用；
   - `https://reddit.com/r/grokbot/comments/1wa57uk/comment/p8gwy2e` 實質涵蓋 UC-003、UC-097、UC-098、UC-099 4 個案例，補齊 UC-003 與總筆數斷言；
   - `normalizeSourceUrl` 補齊 `www.meta.com` 與 `m.meta.com` 至 `meta.com` 之正規化；
   - 恪守 AI 案例庫規範：「疑似重複只列候選，不自行刪除；總案例數 325 保持完整；嚴格合格案例數 296 保持一致」。

本輪改善：
1. `assets/app.js`：
   - `SYNONYM_GROUPS` 擴充 6 組新同義詞群（附件/attachment/attachments、觸發/觸發器/trigger/triggers、憑證/密鑰/金鑰/credential/credentials/token/tokens/secret/secrets、模板/範本/模版/template/templates、異常/anomaly/anomalies/exception/exceptions、webhook/webhooks）。
   - 在既有組別補齊對稱詞彙：資料庫補database/sql/数据库、登入補login/signin、試算表補spreadsheet/spreadsheets/csv、爬蟲補scrape、除錯補troubleshoot/debugging、待辦補todos/task/tasks、帳單補bills/billing、發票收據補invoices/receipts，維持 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：擴充 3 組大型官方與原作者來源疑似重複候選叢集斷言（Muse Business 11 案叢集、Meta AI Help 11 案叢集、Grok Bot approvals 11 檔叢集），更新 Reddit 4 案討論串覆蓋與總筆數斷言，補齊 meta.com 網域正規化，恪守「只列候選、不自行刪除、總案例數 325 保持完整」。
   - `tests/search.test.cjs`：加入 database/数据库、login/signin、spreadsheet/spreadsheets、attachment/attachments、trigger/triggers、credential/credentials、template/templates、anomaly/anomalies、webhooks、scrape、troubleshoot/debugging、todos/tasks、bills/billing、invoices/receipts 等搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：27/27 測試全數通過，331 筆條目全文、同義詞擴充檢索、疑似重複來源候選叢集審核、全庫 325 案例一致性檢驗通過。
下一輪建議：依多案例共用公開來源候選叢集（如共用同一官方功能手冊或彙整頁面），評估是否需在案例頁中提供 anchor 或段落指引。

## 2026-10-18：行銷、採購、表單、會議紀錄、LLM 與推薦同義詞擴充、YouTube 與等價網域疑似重複偵測強化

先前走查與測試發現：
1. 搜尋詞彙斷層與專業業務檢索痛點：
   - 行銷與廣告類：讀者搜尋常見英文詞「advertising」得 0 筆、「marketing」僅得 4 筆，嚴重遺漏全庫 21 筆「行銷」與 17 筆「廣告」案例（如 UC-022 廣告投放成效、UC-183 廣告帳戶設定、UC-017 開發信與客戶研究、UC-268 行銷活動審批）；
   - 採購與招標類：全庫有 14 筆「採購」案例，但讀者搜尋「purchasing」得 0 筆、「sourcing」得 0 筆、「vendor」得 0 筆、「procurement」僅得 3 筆，嚴重遺漏 UC-007（Haggle Bot 採購案例）、UC-101（招標機會篩選 procurement capability shortlist）、UC-038（樣品採購與交接）、UC-154（供應商合約分析）等；
   - 表單與問卷類：全庫有 33 筆「表單」，但讀者搜尋「survey」得 0 筆、「surveys」得 0 筆、「questionnaire」得 0 筆、「forms」僅得 1 筆、「問卷」僅得 1 筆，無法檢索大量表單流轉案例（如 UC-102 安全表單、UC-318 新帳戶表單、UC-035 求職表單、UC-127 表單填寫）；
   - 會議紀錄與紀要類：讀者若輸入常見自然語言關鍵字「會議記錄」、「會議紀要」或「minutes」結果為 0 筆，與全庫 13 筆「會議」及「會議紀錄」案例（如 UC-094、UC-277）脫節；
   - 大型語言模型類：讀者若搜尋「大型語言模型」、「大語言模型」或「大模型」結果為 0 筆，無法檢索 UC-161、UC-016、UC-170 等 8 筆標註 LLM 的關鍵案例；
   - 爬蟲與採集類：既有爬蟲詞群遺漏動詞「爬取」（搜尋「爬取」僅得 2 筆，漏失 17 筆抓取／採集／爬蟲案例）；
   - 比對與對照類：全庫有 31 筆「比對」與 17 筆「對照」，但搜尋「diff」（僅 1 筆）或「matching」（0 筆）無法命中；
   - 推薦與精選類：全庫有 24 筆「推薦」與 11 筆「精選」，搜尋英文「recommendation」或「recommend」得 0 筆。
2. 疑似重複來源偵測之 URL 正規化強化：
   - `normalizeSourceUrl` 補齊 `youtube.com`（非 www 子網域，如待查來源 `sources/pending.md` 引用之影片網址）正規化為 `www.youtube.com`；
   - 補齊 `www.linkedin.com` 歸一化為 `linkedin.com`；
   - 統一通訊協定為 `https:`，並擴充社群與平台跳轉參數清除（`spm`、`ref_src`、`ref_url`、`from`）；
   - 恪守 AI 案例庫規範：「疑似重複只列候選，不自行刪除；總案例數 325 保持完整；嚴格合格案例數 296 保持一致」。

本輪改善：
1. `assets/app.js`：
   - `SYNONYM_GROUPS` 擴充 6 組新同義詞群（行銷/廣告/marketing/advertising/ads/投放/推廣、採購/招標/procurement/purchasing/sourcing/供應商/vendor/vendors、表單/問卷/調查/form/forms/survey/surveys/questionnaire、llm/大型語言模型/大語言模型/大模型/語言模型、比對/對照/核對/diff/matching、推薦/精選/recommendation/recommend/picks）。
   - 在既有組別補齊對稱詞彙：會議補會議記錄/會議紀錄/會議紀要/開會紀錄/minutes、爬蟲補爬取，維持 100% 互映對稱映射（445 組對稱鍵值）。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：強化 `normalizeSourceUrl` 網址正規化（YouTube、LinkedIn、協定、跳轉參數），並加入 YouTube 與 LinkedIn 正規化回歸斷言，恪守「只列候選、不自行刪除、總案例數 325 保持完整」。
   - `tests/search.test.cjs`：加入 marketing/advertising、procurement/purchasing、forms/survey、會議記錄/會議紀要/minutes、大型語言模型/大模型、爬取、diff、recommendation 等搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/test-preview/ai-agent-use-cases`。
本輪實際結果：27/27 測試全數通過，331 筆條目全文、同義詞擴充檢索、疑似重複來源候選審核、全庫 325 案例一致性檢驗通過。
下一輪建議：依多案例共用公開來源候選叢集（如共用同一官方功能手冊或彙整頁面），評估是否需在案例頁中提供 anchor 或段落指引。


## 2026-10-18：搜尋結果的命中依據

雲端實測薪水5筆僅2筆、收件匣88筆僅29筆在標題或用途顯示相關詞；UC-024因「不…算薪資」命中。新增查詢→實際命中詞、欄位／章節及最多96字原文節錄，每卡至多兩項，讓讀者先判斷適用性。保留召回、排序、抽卡、300合格／336收錄與協作者資料。

先紅27 pass／4 fail；96字版31/31通過，Chromium三尺寸、Firefox／WebKit手機三情境與10次axe掃描通過。獨立審查無產品阻擋，補頁首資料標籤回歸、節錄說明及瀏覽器實際部署資產比對。已整合PR42對比與返回修正；正式發布以PR44及main部署驗收為準。

[前後截圖、量測、指令、限制與審查](docs/qa/2026-10-18-search-context/README.md)。下一輪：建立相關性樣本，再評估主要用途命中優先排序。

## 2026-10-18：瀏覽器、帳號、語音轉錄、報表、密碼、資料擷取與流程圖同義詞擴充，及通用網域重複偵測強化

先前走查與測試發現：
1. 搜尋詞彙斷層與自然語言檢索痛點：
   - 瀏覽器與網頁操作類：全庫有 50 筆「瀏覽器」與 40 筆「網頁」，但讀者搜尋常見詞「browser」得 0 筆、「browsing」得 0 筆、「webpage」得 0 筆，嚴重遺漏 UC-015 網頁監看、UC-086 網頁爬蟲、UC-149 網站連結驗證、UC-167 網頁可存取性等代表性 Agent 案例；
   - 帳號與帳戶類：全庫有 182 筆「帳號」與 76 筆「帳戶」，但讀者搜尋「account」僅得 5 筆、「accounts」僅得 1 筆，無法檢索 UC-046 關注帳號每日摘要、UC-183 廣告帳戶設定、UC-318 新帳戶申請等案例；
   - 錄音與語音轉錄類：全庫有 31 筆「逐字稿」、31 筆「轉錄」、20 筆「錄音」，但搜尋「transcription」得 0 筆、「聽打」得 0 筆、「transcribe」僅得 1 筆、「whisper」僅得 2 筆，既有組別 `['逐字稿', '轉錄']` 未涵蓋 UC-191 播客剪輯與試聽、UC-107 舊語音私有封存、UC-325 夜間語音日記等高頻需求；
   - 報告與報表類：全庫有 145 筆「報告」與 17 筆「報表」，但搜尋複數「reports」僅得 3 筆、「研報」得 0 筆，且搜尋英文「report」漏失 100 多筆以繁體中文撰寫之各類分析報告、評估報告與對帳報告（如 UC-001 實測報告、UC-176 盡職調查報告、UC-200 統計分析報告、UC-263 試算表對帳報告）；
   - 密碼與憑證類：全庫有 36 筆「密碼」，但搜尋「passwords」得 0 筆、「password」僅得 2 筆，既有組別 `['憑證', '密鑰', '金鑰', 'credential', ...]` 漏失「密碼」與「password/passwords」，無法與金鑰／密鑰（UC-080 密碼保險庫、UC-042 憑證與多 Bot 登入）對齊；
   - 資料擷取與提取類：全庫有 18 筆「擷取」與 3 筆「提取」，但搜尋「extract」得 0 筆、「extraction」得 0 筆、「提煉」得 0 筆、「萃取」得 0 筆，無法檢索 UC-098 工程圖表 PDF 擷取、UC-178 掃描頁文字擷取、UC-251 空間資料萃取等資訊抽取案例；
   - 流程圖與架構圖類：全庫有「流程圖」與「架構圖」案例（如 UC-179 郵件流程圖修復、UC-237 零件步驟草圖、UC-278 加工中心架構草圖），但搜尋「diagram」得 0 筆、「flowchart」得 0 筆、「mindmap」得 0 筆、「心智圖」得 0 筆。
2. 疑似重複來源偵測之通用 URL 正規化強化：
   - `normalizeSourceUrl` 補齊通用 `www.` 網域移除（除保留 `www.youtube.com` 慣例以外，其餘頂層網域皆標準化），確保 `www.github.com`、`www.chatprd.ai`、`www.eleanorkonik.com` 等與無 www 版本自動歸一；
   - 擴充跳轉參數清除（`source`）；
   - 恪守 AI 案例庫規範：「疑似重複只列候選，不自行刪除；總案例數 336 保持完整；嚴格合格案例數 300 保持一致」。

本輪改善：
1. `assets/app.js`：
   - `SYNONYM_GROUPS` 擴充 5 組新同義詞群（瀏覽器/browser/browsing/網頁/web/webpage、帳號/帳戶/account/accounts、報告/報表/研報/report/reports、擷取/提取/萃取/提煉/extract/extraction、流程圖/架構圖/心智圖/圖解/草圖/flowchart/diagram/mindmap）。
   - 在既有組別補齊對稱詞彙：逐字稿補錄音/聽打/transcription/transcribe/whisper，憑證金鑰組補密碼/password/passwords，維持 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：強化 `normalizeSourceUrl` 通用 www 與 source 參數正規化，加入 GitHub 與 chatprd 網域正規化回歸斷言，恪守「只列候選、不自行刪除、總案例數保持完整」。
   - `tests/search.test.cjs`：加入 browser/browsing/webpage、account/accounts/帳戶、transcription/transcribe/whisper/聽打、reports/研報、password/passwords、extract/extraction/萃取/提煉、flowchart/diagram/mindmap/心智圖等搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/preview-test/ai-agent-use-cases`。
本輪實際結果：31/31 測試全數通過，336 筆條目全文、同義詞擴充檢索、疑似重複來源候選審核、全庫一致性檢驗通過。
下一輪建議：依多案例共用公開來源候選叢集（如共用同一官方功能手冊或彙整頁面），評估是否需在案例頁中提供 anchor 或段落指引。



## 2026-10-18：搜尋分享正式發布驗收補記

PR #40／#41／#42／#45 完成分享、搜尋直鏈落點、手動複製備援與案例返回。正式歷史返回會保留原卡片焦點並使按鈕可見；修正 chip 漸變的中間色對比，尊重減少動態效果偏好。協作者 PR #43／#44 的研究、同義詞與搜尋命中說明完整保留。

最終730903c7：31/31測試、Website QA、Reader QA與Pages建置全綠；相同產品檔的Search Context QA也通過。正式三引擎八次整庫載入皆336條目、零略過來源、17筆相同結果；新正式流程10次axe掃描零違規。390px搜尋結果數由首屏外1,874px移至510px；桌面最終為684px。獨立審查完成，修正後通過完整雲端驗收。

正式重複載入曾實際遇到 HTTP 429：71 個來源略過、331→258 條目。完整邊界測試留在預覽，Reader 正式驗收改為8次真實整庫載入，仍嚴格要求零略過及相同結果 ID。這不是產品載入成本已解決；下一輪優先處理逐檔請求成本與部分載入恢復，不重做已由 PR #44 完成的命中說明。

[前後與返回截圖、全部驗收、診斷摘要及限制](docs/qa/2026-10-18-shared-search/README.md)。沒有改研究證據或刪除疑似重複案例；無新追蹤／第三方產品依賴。主代理模型設定仍無法驗證；操作與測試使用 GitHub 連線／既有 Actions。

## 2026-10-18：模型評測、派工分流、代碼庫、解碼解析、資安漏洞、沙盒與 Pull Request 同義詞擴充及 Reddit JSON 端點重複正規化

先前走查與測試發現：
1. 搜尋詞彙斷層與自然語言檢索痛點：
   - 模型評測與基準測試類：全庫有 41 筆「評估」與 18 筆「評測」，但讀者搜尋常見英文詞「evaluation」得 0 筆、「benchmarks」得 0 筆、「benchmark」僅得 1 筆、「evals」僅得 2 筆，嚴重遺漏 UC-270 替換評估、UC-161 跨模型回覆評估、UC-165 離線效能基準、UC-222 業務規則測試、UC-311 新模型測試等核心 Agent 評測案例；
   - 多代理派工與協調類：全庫有 21 筆「派工」與 10 筆「分流」，但讀者搜尋「dispatch」僅得 2 筆、「dispatcher」僅得 1 筆、「dispatching」得 0 筆、「分派」僅得 1 筆、「調度」僅得 1 筆、「派發」得 0 筆，無法檢索 UC-061 窗口派工台帳、UC-316 Slack 串分流、UC-336 掌上語音終端派工等代表性跨代理分流案例；
   - 代碼庫與程式庫類：全庫有 41 筆「repo」與 5 筆「程式庫」，但讀者搜尋「repository」僅得 3 筆、「repositories」得 0 筆、「代碼庫」得 0 筆、「repos」僅得 3 筆，漏失 UC-005 雲端開發與 PR 審查、UC-057 自架 runner 限定私有 repo 等案例；
   - 資料解析與解碼類：全庫有 18 筆「解析」與 6 筆「解碼」，但搜尋「parsing」得 0 筆、「parser」得 0 筆、「decode」得 0 筆、「剖析」得 0 筆，無法檢索 UC-334 SDR 雙頻輪收解碼改寫、UC-125 解碼器硬體在環、UC-020 Figma 批次卡片解析等案例；
   - 資安漏洞類：全庫有 6 筆「漏洞」與 36 筆「資安」，但搜尋「vulnerability」得 0 筆、「vulnerabilities」得 0 筆、「cybersecurity」得 0 筆，既有組別未將漏洞與資安建立映射，遺漏 UC-065 可疑郵件安全審查、UC-218 技能信任審核等案例；
   - 權限與特權類：搜尋「privilege」得 0 筆、「privileges」得 0 筆，既有權限詞群遺漏 privilege；
   - 沙盒隔離類：全庫有 3 筆「沙盒」，但搜尋「sandbox」僅 0 筆在標籤中（UC-317 沙盒與 UC-314 沙盒長駐失敗未直接互通）；
   - 結構化資料類：全庫有 14 筆「結構化」，搜尋英文「structured」僅得 1 筆；
   - 自動化類：全庫有 141 筆「自動化」與「workflow」，但搜尋「automation」僅得 11 筆、「automate」僅得 3 筆、「automations」僅得 9 筆；
   - Pull Request 檢索痛點：讀者若搜尋「pull request」或「pull requests」，因既有 tokenize 將其拆解為 pull 與 request 雙詞交集，結果為 0 筆，脫離全庫 135 筆 PR 案例。
2. 疑似重複來源偵測之 Reddit API JSON 端點正規化強化：
   - `normalizeSourceUrl` 補齊 Reddit API `.json` 端點移除（如 UC-284 引用之 `https://www.reddit.com/r/MetaAI/comments/1wydk5b/what_do_you_use_muse_for/.json?raw_json=1` 自動歸一至 `https://reddit.com/r/metaai/comments/1wydk5b/what_do_you_use_muse_for`），強化跨案例討論串候選重複比對；
   - 恪守 AI 案例庫規範：「疑似重複只列候選，不自行刪除；總案例數 336 保持完整；嚴格合格案例數 300 保持一致」。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 新增 `pull request(s)` 歸一至 `pr` 詞彙映射，確保自然語言檢索直接涵蓋 135 筆 PR 審查與代碼流程案例。
   - `SYNONYM_GROUPS` 擴充 6 組新同義詞群（評估/評測/基準測試/eval/evals/evaluation/benchmark/benchmarks、派工/分派/派發/調度/分流/dispatch/dispatcher/dispatching、repo/repos/repository/repositories/代碼庫/程式庫/儲存庫、解析/解碼/剖析/parse/parser/parsing/decode/decoder/decoding、沙盒/sandbox/sandboxes、結構化/structured）。
   - 在既有組別補齊對稱詞彙：工作流自動化補 automation/automate/automations，資安補 cybersecurity/漏洞/vulnerability/vulnerabilities，權限補 privilege/privileges，維持 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：強化 `normalizeSourceUrl` 之 Reddit `.json` 端點正規化，加入回歸斷言，並同步全庫案例下限至 330 筆，恪守「只列候選、不自行刪除、總案例數保持完整」。
   - `tests/search.test.cjs`：加入 evaluation/benchmark/benchmarks、dispatch/dispatcher/分流、repository/repositories、parse/parsing/decode/decoder、vulnerability/vulnerabilities/cybersecurity、privilege/privileges、sandbox/sandboxes、structured、automation 及 pull request/pull requests 搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/preview-test/ai-agent-use-cases`。
本輪實際結果：31/31 測試全數通過，336 筆條目全文、同義詞擴充檢索、疑似重複來源候選審核、全庫一致性檢驗通過。
下一輪建議：依多案例共用公開來源候選叢集（如共用同一官方功能手冊或彙整頁面），評估是否需在案例頁中提供 anchor 或段落指引。

## 2026-10-18：部分載入可恢復，不重載成功來源

雲端重現一個來源429時335條目可讀，但只見略過小字、沒有重試。新增結果前的不完整提示與「重試未載入來源」；並行4、每來源15秒逾時，只補失敗檔案，保留當下搜尋／篩選、分享、鍵盤焦點與正在閱讀的案例。純案例缺失直鏈會到恢復區；全失敗仍走完整載入。來源檔案數與條目數分開表達，pending一檔多筆正確合併。返回驗收另修標籤漸變中間色1.16:1對比。

先紅後綠：基準31/31，新版33/33；Chromium三尺寸、Firefox／WebKit手機的三情境與邊界通過，20次axe掃描零違規。實測335→336只新增1個來源請求。獨立審查指出的全失敗入口、隱藏控制焦點與滑鼠直鏈已修正。資料與300合格／336收錄計數保留，未改初次逐檔載入架構。相關Reader QA與正式Pages部署結果依PR46／main對應checks確認。

[前後截圖、原始數據、指令與限制](docs/qa/2026-10-18-partial-load/README.md)。全部repo操作與測試使用GitHub連線／既有雲端runner，未修改本機工作樹；主代理實際模型設定無法查證。下一輪：量測並降低首次整庫請求成本，評估Jekyll全文資料包與部署一致性。

## 2026-10-18：容器維運、API端點、配額限流、配置設定、審計稽核、指標度量同義詞擴充與 Google Support 參數正規化

先前走查與測試發現：
1. 搜尋詞彙斷層與自然語言檢索痛點：
   - 容器與虛擬環境類：全庫有 UC-005「容器」與 UC-052 等實作，但讀者搜尋常見英文詞「container」得 0 筆、「containers」得 0 筆、「docker」得 0 筆，無法檢索容器運作與維運案例；
   - API 端點與介面類：全庫有 17 筆「端點」（如 UC-336 掌上語音終端派工至本機端點、UC-284 Reddit JSON 端點）與 125 筆「接口/api/介面」，但搜尋「endpoint」得 0 筆、「endpoints」得 0 筆，導致自然語言檢索脫節；
   - 配額與速率限制類：全庫有 8 筆「配額」（如 UC-314、UC-023、UC-024）與 3 筆「限流」（UC-314），但搜尋「quota」得 0 筆、「quotas」得 0 筆、「throttling」得 0 筆、「限速」得 0 筆、「頻率限制」得 0 筆，無法檢索 API 配額與限流中斷案例；
   - 設定與配置類：全庫有 31 筆「配置」（如 UC-183 廣告活動設定與結構化配置審查）與 5 筆「設定檔」，但讀者搜尋常見詞「config」得 0 筆、「configuration」得 0 筆、「settings」得 0 筆；
   - 審計與稽核類：全庫有 44 筆「稽核」（如 UC-066 Token 用量稽核、UC-073、UC-195）與 8 筆「審計」，但既有審查組別 `['審查', '審核', 'review', 'audit']` 缺少「稽核」與「審計」，導致以英文 audit 搜尋無法命中多數以中文稽核記錄之案例；
   - 指標與度量類：全庫有 14 筆「指標」（如 UC-322 營運指標收集、UC-165 離線效能指標），但搜尋「metrics」得 0 筆、「kpi」得 0 筆；
   - 向量與嵌入類：知識庫檢索案例豐富，但 RAG 組別缺少「向量」、「嵌入」、「vector」、「vectors」、「embedding」、「embeddings」；
   - 回呼機制類：webhook 觸發與事件分發案例中，搜尋「callback」得 0 筆、「callbacks」得 0 筆、「回呼」得 0 筆、「回調」得 0 筆；
   - 網關通訊類：UC-336 等終端與 MCP 案例包含 gateway，但搜尋「網關」得 0 筆、「通訊閘」得 0 筆；
   - 回退復原類：全庫有 7 筆「回退」，但既有 rollback 組缺少「回退」；
   - 圖像與文字識別類：全庫有 67 筆「識別」與 42 筆「辨識」（如 UC-178、UC-134），但既有 OCR 組缺少「辨識」、「識別」與「recognition」；
   - 權杖類：全庫有 4 筆「權杖」，但憑證 token 組缺少「權杖」。
2. 疑似重複來源偵測之 Google Support 參數正規化強化：
   - `normalizeSourceUrl` 補齊 Google 平台參數 `co` 清理（如 `https://support.google.com/maps/answer/7280933?co=GENIE.Platform%3DDesktop&hl=en-en` 自動歸一至 `https://support.google.com/maps/answer/7280933`）；
   - 恪守 AI 案例庫規範：「疑似重複只列候選，不自行刪除；總案例數 336 保持完整；嚴格合格案例數 300 保持一致」。

本輪改善：
1. `assets/app.js`：
   - `SYNONYM_GROUPS` 擴充 5 組新同義詞群（容器/虛擬機/docker/container/containers/vm、配額/限流/限速/頻率限制/quota/quotas/throttling、配置/設定/設定檔/config/configuration/settings、指標/度量/metric/metrics/kpi、網關/通訊閘/gateway/gateways）。
   - 在既有組別補齊對稱詞彙：介面接口補端點/endpoint/endpoints，審查 audit 補稽核/審計/稽查，RAG 補向量/嵌入/vector/vectors/embedding/embeddings，webhook 補 callback/callbacks/回呼/回調，備份回滾補回退，OCR 辨識補識別/recognition/辨識，憑證 token 補權杖，維持 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：強化 `normalizeSourceUrl` 之 Google Support `co` 參數正規化，加入回歸斷言，恪守「只列候選、不自行刪除、總案例數保持完整」。
   - `tests/search.test.cjs`：加入 container/containers/docker、endpoint/endpoints、quota/quotas/throttling、config/configuration/settings、audit/審計、metrics/kpi、vector/vectors/embedding/embeddings、callback/callbacks/回呼、gateway/gateways/網關、回退、recognition/識別、權杖搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/preview-test/ai-agent-use-cases`。
本輪實際結果：33/33 測試全數通過，336 筆條目全文、同義詞擴充檢索、疑似重複來源候選審核、全庫一致性檢驗通過。
下一輪建議：依多案例共用公開來源候選叢集（如共用同一官方功能手冊或彙整頁面），評估是否需在案例頁中提供 anchor 或段落指引。


### 2026-10-18 部分載入改善：發布驗收補記

- PR #46（`bbacfb0`）已部署；桌面／手機實際新版JS/CSS一致，336條目、零略過、17筆旅遊＋Grok Bot結果；main Partial Load、Search context及Website QA通過。
- Reader原有人工捲動測試兩次失敗後，用同雲端Firefox對照重現於本輪前`ee1bfce`，確認測試準備可能與原生鍵盤焦點捲動競爭。只加人工捲動前的穩定檢查；保留載入前後精確100px及焦點斷言。
- [驗收紀錄、原始數據與限制](docs/qa/2026-10-18-partial-load/README.md)記錄24次對照與首次失敗，不以重跑抹去。協作者後續搜尋修改完整保留。
- 下一輪優先評估Jekyll全文資料包，減少初次逐檔請求；後續協作者版本的live check仍曾觀測2個來源讀取失敗，本輪未宣稱杜絕此問題。

## 2026-10-18：逾時處理、任務佇列、依賴項、時延、分支提交、並行串流、終端命令列、系統遷移、模擬仿真、認證身分同義詞擴充與文檔視圖參數正規化

先前走查與測試發現：
1. 搜尋詞彙斷層與自然語言檢索痛點：
   - 逾時與超時類（Timeout）：全庫有 5 筆「逾時」與 3 筆「超時」（如 UC-329 代理鏈長延遲重啟中斷恢復、UC-336 終端超時斷開），但讀者搜尋英文詞「timeout」得 0 筆、「timeouts」得 0 筆，導致檢索排程與網路中斷案例失敗；
   - 任務隊列與佇列類（Task / message queues）：全庫有 9 筆「佇列」、1 筆「隊列」、4 筆「排隊」、4 筆「mq」（如 UC-042 多代理憑證與佇列狀態、UC-061 派工機器人、UC-179），但搜尋「queue」得 1 筆、「queues」得 0 筆、「隊列」得 0 筆，無法檢索隊列派發與處理案例；
   - 依賴項與套件依賴類（Dependencies）：全庫有 30 筆「依賴」（如 UC-067 重建與依賴項、UC-214、UC-217 回歸檢查），但搜尋「dependency」得 0 筆、「dependencies」得 0 筆；
   - 延遲與時延類（Latency & lag）：全庫有 17 筆「延遲」（如 UC-165 離線效能指標、UC-239 穿戴對話晚回與時延），但搜尋「latency」得 0 筆、「latencies」得 0 筆、「lag」得 0 筆；
   - 分支與版本控制類（Branch & branches）：全庫有 14 筆「分支」（如 UC-005 PR 審查、UC-156、UC-217），但搜尋「branch」得 0 筆、「branches」得 0 筆；
   - 提交與代碼變更類（Commit & commits）：全庫有 24 筆「commit」與 68 筆「提交」，但搜尋複數「commits」得 0 筆；
   - 並行與並發類（Concurrency & parallel）：全庫有 4 筆「並行」與 3 筆「並發」，但搜尋「concurrency」得 0 筆、「concurrent」得 0 筆、「parallel」得 0 筆；
   - 串流與流式輸出類（Streaming）：全庫有 3 筆「stream」與 2 筆「串流」（如 UC-217、UC-316），但搜尋「streaming」得 0 筆、「流式」得 0 筆；
   - 終端與命令行類（Terminal & console）：全庫有 5 筆「終端」、10 筆「命令列」、18 筆「cli」、3 筆「console」，但搜尋「terminal」得 0 筆、「命令行」得 0 筆；
   - 系統遷移與移轉類（Migration）：全庫有 9 筆「遷移」、15 筆「移轉」、2 筆「migration」、1 筆「migrate」（如 UC-069 任務遷移對帳），但既有組別未納入遷移與移轉，搜尋 migration/migrate 查無結果；
   - 模擬與仿真類（Mock & stub）：全庫有 35 筆「模擬」與 3 筆「mock」（如 UC-003 模擬商店營運），但搜尋「mocking」得 0 筆、「stub」得 0 筆、「stubs」得 0 筆、「仿真」得 0 筆；
   - 認證與身分驗證類（Authentication, OAuth, SSO）：全庫有 56 筆「認證」、115 筆「auth」、4 筆「oauth」、1 筆「sso」，但搜尋「身分驗證」得 0 筆、「身份驗證」得 0 筆、「authentication」原僅得 1 筆純英文案例；
   - 差異與對比類（Diff & difference）：全庫有 97 筆「差異」、69 筆「比對」、3 筆「對比」，但既有組別缺少「差異」與「對比」；
   - 既有組別單複數與對稱補齊：agent 補 agents（搜尋 agents 原僅得 23 筆，補齊後達 210 筆完整命中）、retry 補 retries、alert/notification 補 alerts/notifications、prompt 補 prompts/prompting。
2. 疑似重複來源偵測之文檔與商店平台視圖參數正規化：
   - `normalizeSourceUrl` 補齊 Microsoft Learn（`tabs`, `view`）、Apple App Store（`platform`, `see-all`）及 Stripe 文檔（`payment-ui`）視圖參數清理；
   - 恪守 AI 案例庫規範：「疑似重複只列候選，不自行刪除；總案例數 336 保持完整；嚴格合格案例數 300 保持一致」。

本輪改善：
1. `assets/app.js`：
   - `SYNONYM_GROUPS` 擴充 12 組新同義詞群（逾時/超時/timeout/timeouts、佇列/隊列/排隊/queue/queues/mq、依賴/依賴項/dependency/dependencies、延遲/時延/latency/latencies/lag、分支/branch/branches、commit/commits/提交、並行/並發/concurrency/concurrent/parallel、串流/流式/stream/streaming、終端/命令列/命令行/terminal/cli/console、遷移/移轉/migration/migrate、模擬/仿真/mock/mocking/stub/stubs、認證/身分驗證/身份驗證/authentication/oauth/sso）。
   - 在既有組別補齊對稱詞彙：agent 補 agents、alert 補 alerts/notifications、prompt 補 prompts/prompting、retry 補 retries、diff 補 差異/對比，維持 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：強化 `normalizeSourceUrl` 之 Microsoft Learn `tabs`/`view`、Apple App Store `platform`/`see-all` 及 Stripe `payment-ui` 參數清理，加入回歸斷言，恪守「只列候選、不自行刪除、總案例數保持完整」。
   - `tests/search.test.cjs`：加入 timeout/timeouts/超時、queue/queues/隊列、dependency/dependencies、latency/latencies、branch/branches、commits、concurrency/concurrent、streaming/流式、terminal/命令行、migration/migrate、mocking/stub/仿真、身分驗證/身份驗證/authentication、差異/對比，以及 agents/retries/alerts/prompts 複數搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/preview-test/ai-agent-use-cases`。
本輪實際結果：33/33 測試全數通過，336 筆條目全文、同義詞擴充檢索、疑似重複來源候選審核、全庫一致性檢驗通過。
下一輪建議：依多案例共用公開來源候選叢集（如共用同一官方功能手冊或彙整頁面），評估是否需在案例頁中提供 anchor 或段落指引。

## 2026-10-18：同主題延伸閱讀與跨搜尋返回

正式站三尺寸走查發現：詳情沒有同主題閱讀選項，前後篇按鈕亦無篇名提示。本輪在原始研究後列出目前搜尋結果內、同分類的最多三筆主要案例，顯示匹配理由、摘要與來源類型；無候選明示，不以待查或整庫項目補位。保留研究優先、既有品牌、靜態 Pages 路徑與所有原始資料。

補修跨搜尋歷史的入口焦點、搜尋外直鏈方向鍵跳篇，以及背景補讀後的候選更新。獨立角色審查提出的 3 項 P2 與 2 項 P3 已修正並確認解除。先以缺功能測試重現（33 pass / 2 fail），再交付實作；最終程式版本雲端 36/36、三尺寸 15 次 axe 0 違規、無水平溢出。正式 smoke 每尺寸兩次整庫載入，避免重複驗收造成限流。[前後截圖、三情境、指令、實際量測、限制與審查紀錄](docs/qa/2026-10-18-related-reading/README.md)。下一輪優先評估具體任務標籤的候選品質，避免重做同一導覽。

## 2026-10-18：快照備份、批次處理、追蹤監控、遮罩脫敏、健康檢查、編排協調、降級容錯、狀態機、檢查點、儲存、幻覺、協定模組、語意檢索同義詞與來源歸因追蹤參數正規化

先前走查與測試發現：
1. 搜尋詞彙斷層與自然語言檢索痛點：
   - 快照類（Snapshot & snapshots）：全庫有 21 筆「快照」（如 UC-067 重建手冊、UC-061 派工紀錄），但讀者搜尋英文詞「snapshot」得 0 筆、「snapshots」得 0 筆；
   - 批次與批處理類（Batch & batches）：全庫有 36 筆「批次」、1 筆「批處理」（如 UC-020 Figma 批次卡片、UC-255 記憶版本整合），但搜尋「batch」得 0 筆、「batches」得 0 筆；
   - 追蹤與 Trace 類（Tracing, trace, tracking）：全庫有 61 筆「追蹤」（如 UC-015 頁面變更監看、UC-021 法務轉發），但搜尋「tracing」得 0 筆，缺少完整單複數與分詞對映；
   - 去識別、遮罩與資料防護類（Masking, redaction, anonymization, PII, 脫敏）：全庫有 25 筆「去識別」、3 筆「遮罩」、1 筆「pii」（如 UC-004 社群監聽、UC-011 業務備忘錄、UC-041 例行巡檢），但搜尋「masking」得 0 筆、「redaction」得 0 筆、「anonymization」得 0 筆、「脫敏」得 0 筆；
   - 健康檢查與存活檢查類（Health check, healthcheck, liveness, readiness）：全庫有 11 筆「健康檢查」（如 UC-041、UC-060、UC-061、UC-066），但搜尋「health check」因空格分詞僅能命中 2 筆、搜尋「healthcheck」得 0 筆、「liveness」得 0 筆；
   - 編排與調度類（Orchestration & orchestrate）：全庫有 8 筆「編排」（如 UC-061、UC-122、UC-172），但搜尋「orchestrate」得 0 筆；
   - 協調類（Coordination & coordinate）：全庫有 25 筆「協調」（如 UC-005 PR 審查、UC-012、UC-054），但搜尋「coordination」得 0 筆、「coordinate」得 0 筆；
   - 降級與容錯類（Fallback & degradation）：全庫有 4 筆「降級」（如 UC-028 帳單審核、UC-049 收件匣漸進信任），但搜尋「fallback」得 0 筆、「degradation」得 0 筆；
   - 狀態機與狀態轉移動作類（State machine, statemachine, 狀態轉換, 狀態轉移）：全庫有 1 筆「狀態機」、2 筆「狀態轉換」、1 筆「狀態轉移」（如 UC-236 盲測評判、UC-284 行李延誤），但搜尋多詞「state machine」得 0 筆、「statemachine」得 0 筆；
   - 檢查點類（Checkpoint & checkpoints）：全庫有 3 筆「檢查點」（如 UC-149 工單核准閘門、UC-231、UC-311），但搜尋「checkpoint」得 0 筆、「checkpoints」得 0 筆；
   - 儲存與存儲類（Storage）：全庫有 28 筆「儲存」（如 UC-067、UC-005、UC-015），但搜尋「storage」得 0 筆、「存儲」得 0 筆；
   - 幻覺與捏造類（Hallucination & hallucinations）：全庫有 1 筆「幻覺」（UC-035 求職信草稿），但搜尋「hallucination」得 0 筆、「hallucinations」得 0 筆；
   - 協定與協議類（Protocol & protocols）：全庫有 5 筆「協定」（如 UC-074 MCP 協定讀回、UC-330 智慧開關導入），但搜尋「protocols」得 0 筆；
   - 模組與套件類（Module & modules）：全庫有 3 筆「模組」（如 UC-039 競品定位、UC-044），但搜尋「module」得 0 筆、「modules」得 0 筆；
   - 語意與語義類（Semantic & semantics）：全庫有 9 筆「語意」、2 筆「語義」（如 UC-081 主題分群、UC-195 內容重組），但搜尋「semantic」得 0 筆、「semantics」得 0 筆；
   - 既有限流組別與多詞查詢自然語言支援：全庫有 3 筆「限流」（如 UC-069、UC-164），但搜尋「rate limit」因空格切分僅命中 1 筆，未對映至配額與限流同義詞組。
2. 疑似重複來源偵測之追蹤參數與錨點正規化：
   - `normalizeSourceUrl` 補齊 MoneyForward（`provider`, `provider_info`）及 Facebook 圖片（`fit`）追蹤展示參數清理；
   - 補齊 Grok Bot Legal Ops 功能手冊（`x.ai/bot/guides/grok-bot-for-legal-ops`）錨點正規化重複候選回歸斷言（UC-021 與 UC-154）；
   - 恪守 AI 案例庫規範：「疑似重複只列候選，不自行刪除；總案例數 336 保持完整；嚴格合格案例數 300 保持一致」。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 新增多詞術語自然語言分詞預處理（`rate limit` → `ratelimit`、`health check` → `healthcheck`、`state machine` → `statemachine`）。
   - `SYNONYM_GROUPS` 擴充 15 組新同義詞群（快照/snapshot/snapshots、批次/批處理/batch/batches、追蹤/tracing/trace/track/tracks/tracking、去識別/脫敏/遮罩/masking/redaction/anonymization/pii、健康檢查/healthcheck/liveness/readiness、編排/orchestration/orchestrate、協調/coordination/coordinate、降級/fallback/degradation、狀態機/statemachine/狀態轉換/狀態轉移、檢查點/checkpoint/checkpoints、儲存/存儲/storage、幻覺/hallucination/hallucinations、協定/protocol/protocols、模組/module/modules、語意/語義/semantic/semantics）。
   - 在既有配額/限流組別補齊 `ratelimit`，完成 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：`normalizeSourceUrl` 補齊 `provider`、`provider_info` 與 `fit` 參數清理，加入 Grok Bot Legal Ops 錨點候選去重與 MoneyForward/Facebook 參數清理回歸斷言，恪守「只列候選、不自行刪除、總案例數保持完整」。
   - `tests/search.test.cjs`：加入 snapshot/snapshots、batch/batches/批處理、tracing/track/tracking、masking/redaction/anonymization/脫敏/遮罩、health check/healthcheck/liveness/readiness、orchestration/orchestrate、coordination/coordinate、fallback/degradation、state machine/statemachine/狀態轉換/狀態轉移、checkpoint/checkpoints、storage/存儲、hallucination/hallucinations、協定/protocols、module/modules、semantic/semantics/語義，以及 rate limit/ratelimit 搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/preview-test/ai-agent-use-cases`。
本輪實際結果：36/36 測試全數通過，336 筆條目全文、同義詞擴充檢索、多詞分詞標準化、疑似重複來源候選審核、全庫一致性檢驗通過。
下一輪建議：依多案例共用公開來源候選叢集（如共用同一官方功能手冊或彙整頁面），評估是否需在案例頁中提供 anchor 或段落指引。

## 2026-10-18：知識庫、工單、審批簽核、排程部署、監控告警、對帳回滾、看板儀表板、微調、里程碑、復盤回顧、外聯與多詞自然語言分詞強化及影片來源參數正規化

先前走查與測試發現：
1. 自然語言檢索痛點與多詞空格斷詞斷層：
   - 知識庫類（Knowledge base & knowledgebase）：全庫有 19 筆「知識庫」案例（如 UC-060、UC-077、UC-297、UC-324），但讀者搜尋自然英文「knowledge base」因空格切分僅得 0 筆、搜尋「knowledgebase」亦得 0 筆；
   - 工單類（Work order, work orders, workorder, tickets）：全庫有 67 筆「工單」與「客服」案例（如 UC-011、UC-014、UC-052），但搜尋「work order」僅命中 2 筆字面有 work order 的案例（漏掉 65 筆），搜尋複數「tickets」得 0 筆；
   - 微調類（Fine-tuning, finetune, finetuning, fine tune）：全庫有「微調」案例（如 UC-122 燈光序列微調），但搜尋「fine-tuning」、「finetune」、「finetuning」皆得 0 筆；
   - 拓客與外聯類（Cold outreach & outreach）：全庫有「外聯」案例（如 UC-333 Notion 跨代理外聯記憶、UC-149、UC-059），但搜尋「cold outreach」得 0 筆；
   - 復盤與回顧類（Post-mortem & postmortem）：全庫有 20 筆「回顧」、7 筆「復盤」案例（如 UC-006、UC-041、UC-067），但搜尋「post-mortem」得 0 筆；
2. 同義詞單複數、衍生詞與兩岸術語斷層：
   - 排程類（Schedule, schedules, scheduling）：全庫有 142 筆排程/工作流案例，搜尋「schedule」有 142 筆，但搜尋英文複數「schedules」得 0 筆、「scheduling」得 0 筆；
   - 部署類（Deploy, deployment, deployments）：全庫有 57 筆部署案例，搜尋「deploy」有 57 筆，但搜尋複數「deployments」得 0 筆；
   - 監控類（Monitor & monitoring）：全庫有 51 筆監控案例，搜尋「monitor」有 51 筆，但搜尋動名詞「monitoring」得 0 筆；
   - 審批與簽核類（Approval, approvals, approve, 簽核, 審批）：全庫有 187 筆審批/核准案例，搜尋「approval」有 187 筆，但搜尋「approvals」僅 11 筆、「approve」僅 3 筆、「簽核」僅 1 筆；
   - 日曆類（Calendar & calendars）：全庫有 33 筆日曆/行事曆案例，搜尋「calendar」有 33 筆，但搜尋複數「calendars」僅 1 筆（漏掉 32 筆）；
   - 對帳與核帳類（Reconciliation, reconcile, reconciling, 核帳, 對帳）：全庫有 29 筆對帳案例，但搜尋「reconcile」僅 1 筆、「reconciling」僅 1 筆、「核帳」僅 11 筆；
   - 回滾類（Rollback, rollbacks, revert, reverting）：全庫有 44 筆回滾/備份案例，搜尋「rollback」有 44 筆，但搜尋複數「rollbacks」得 0 筆、「revert」得 0 筆、「reverting」得 0 筆；
   - 看板與儀表板類（Dashboard, dashboards, 看板, 儀表板）：全庫有 19 筆看板案例、6 筆儀表板案例，搜尋「dashboards」得 0 筆，且「dashboard」與「看板」各自獨立無法互通檢索；
   - 告警與通知類（Alert, alerting, notify, 通知, 提醒）：全庫有 112 筆告警/通知案例，但搜尋動名詞「alerting」得 0 筆、「notify」得 0 筆；
   - 重試類（Retry & retrying）：全庫有 73 筆重試案例，搜尋「retrying」得 0 筆；
   - 介面與端點類（Endpoint, api, apis）：全庫有 133 筆端點/API 案例，搜尋複數「apis」得 0 筆；
   - 記憶類（Memory & memories）：全庫有 30 筆記憶案例，搜尋複數「memories」得 0 筆；
   - 上下文類（Context & contexts）：全庫有 9 筆上下文案例，搜尋複數「contexts」得 0 筆；
   - 權杖與令牌類（Token, tokens, 權杖, 令牌）：全庫有 126 筆權杖案例，但搜尋常見中文術語「令牌」僅命中 1 筆字面包含令牌的案例；
   - 里程碑類（Milestone, milestones, 里程碑）：全庫有 2 筆里程碑案例（UC-012, UC-231），搜尋「milestone」得 0 筆、「milestones」得 0 筆。
3. 來源網址追蹤/展示參數正規化：
   - Twitter/X amplify 影片解析度與標籤參數 `tag`（如 `https://video.twimg.com/amplify_video/...mp4?tag=29`）未列入清理，造成影片來源規範斷層；
   - 恪守 AI 案例庫規範：「疑似重複只列候選，不自行刪除；總案例數 336 保持完整；嚴格合格案例數 300 保持一致」。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 新增多詞術語自然語言分詞標準化（`knowledge base` → `knowledgebase`、`work order` → `workorder`、`fine tuning`/`fine-tuning` → `finetune`、`cold outreach` → `outreach`、`post-mortem`/`post mortem` → `postmortem`）。
   - `SYNONYM_GROUPS` 補強與新增同義詞群：
     - 擴充既有群組：儀表板/看板/dashboards、日曆/calendars、對帳/核帳/reconcile/reconciling、排程/schedules/scheduling、工單/tickets/workorder、備份/回滾/rollbacks/revert/reverting、監控/monitoring、告警/alerting/notify、知識庫/knowledgebase、審批/簽核/approvals/approve、部署/deployments、介面/apis、重試/retrying、外聯/外呼、記憶/長期記憶/memories、權杖/令牌。
     - 新增獨立組別：微調/finetune/finetuning、里程碑/milestone/milestones、復盤/回顧/retrospective/postmortem、上下文/語境/context/contexts。
     - 保持 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：`normalizeSourceUrl` 補齊 Twitter amplify 影片 `tag` 參數清理，加入回歸斷言，恪守「只列候選、不自行刪除、總案例數保持完整」。
   - `tests/search.test.cjs`：加入 knowledge base/knowledgebase、tickets/work order/workorder、approvals/approve/簽核、calendars、reconcile/reconciling/核帳、rollbacks/revert/reverting、dashboards/dashboard/看板、schedules/scheduling、deployments、monitoring、alerting/notify、retrying、apis、memories、contexts、令牌、fine-tuning/finetune/finetuning、milestone/milestones、post-mortem/postmortem、cold outreach/outreach 等 20 組搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/preview-test/ai-agent-use-cases`。
本輪實際結果：36/36 測試全數通過，336 筆條目全文、同義詞擴充檢索、多詞分詞標準化、疑似重複來源候選審核、全庫一致性檢驗通過。
下一輪建議：依多案例共用公開來源候選叢集（如共用同一官方功能手冊或彙整頁面），評估是否需在案例頁中提供 anchor 或段落指引。

## 2026-10-19：離線、基準基線、資料外洩、架構、非同步、端到端、斷言、標註、回饋反饋、輪詢、增量、助手、生命週期、冪等性、環境變數與複數同義詞對稱性強化及 Canva 說明網址正規化

先前走查與測試發現：
1. 核心詞彙斷層與自然語言檢索痛點：
   - 離線類（Offline & 斷網）：全庫有 50 筆「離線」案例（57 處出現，如 UC-145 離線表單、UC-165 網路控制、UC-166 邊緣運算），但搜尋常用英文「offline」返回 0 筆、「斷網」返回 0 筆；
   - 基準與基線類（Baseline & baselines）：全庫有 29 筆「基準」、2 筆「基線」案例（如 UC-173 效能實驗、UC-228 家電波形歸因），但搜尋「baseline」返回 0 筆、「baselines」返回 0 筆；
   - 資料外洩與洩漏類（Leak, leakage, 洩露）：全庫有 7 筆「外洩」、4 筆「洩漏」案例（如 UC-076 垃圾電話個資、UC-283 連接帳號、UC-235 資料洩漏），但搜尋「leak」返回 0 筆、「leakage」返回 0 筆、「洩露」返回 0 筆；
   - 架構類（Architecture & architectures）：全庫有 9 筆「架構」案例（如 UC-336 語音入口、UC-275 電話防詐、UC-248 代理群聊），但搜尋「architecture」返回 0 筆、「architectures」返回 0 筆；
   - 回饋與反饋類（Feedback, 回饋, 反饋）：全庫有 18 筆「回饋」、1 筆「反饋」案例（如 UC-152 面試反饋、UC-323 新聞回饋），但搜尋「feedback」僅返回 1 筆、搜尋「反饋」僅返回 1 筆，無法跨兩岸用法互通；
   - 非同步與異步類（Async & asynchronous）：全庫有 2 筆「非同步」（UC-074, UC-274）、1 筆「異步」（UC-239），但搜尋「async」返回 0 筆、「asynchronous」返回 0 筆；
   - 端到端類（End-to-end, e2e, 端到端）：全庫有 4 筆「端到端」案例（UC-014, UC-169, UC-268, UC-289），但搜尋「e2e」返回 0 筆、「end-to-end」返回 0 筆、「end to end」因空格切分返回 0 筆；
   - 斷言類（Assertion & assertions）：全庫有 7 筆「斷言」案例（如 UC-102, UC-179, UC-181, UC-222），但搜尋「assertion」返回 0 筆、「assertions」返回 0 筆；
   - 標註與標籤化類（Annotation, annotations, labeling）：全庫有 9 筆「標註」案例（如 UC-091, UC-152, UC-178, UC-302），但搜尋「annotation」返回 0 筆、「annotations」返回 0 筆；
   - 輪詢類（Polling）：全庫有 5 筆「輪詢」案例（如 UC-065, UC-066, UC-141, UC-151, UC-276），但搜尋「polling」返回 0 筆；
   - 增量類（Incremental）：全庫有 4 筆「增量」案例（如 UC-026, UC-228, UC-250, UC-290），但搜尋「incremental」返回 0 筆；
   - 助手與副駕駛類（Assistant & copilot）：全庫有 12 筆「助手」案例，但搜尋「assistant」僅返回 6 筆（漏掉 6 筆）、「copilot」返回 0 筆；
   - 生命週期類（Lifecycle）：全庫有 5 筆「生命週期」案例（UC-057, UC-075, UC-208, UC-273, UC-329），但搜尋「lifecycle」僅返回 1 筆；
   - 冪等性類（Idempotent & idempotency）：全庫有 2 筆「冪等」案例（UC-158, UC-320），但搜尋「冪等性」返回 0 筆、「idempotency」返回 0 筆；
   - 環境變數與環境變量類（Env, 環境變數, 環境變量）：全庫有 2 筆「環境變數」案例（如 UC-057, UC-329），但搜尋「環境變量」返回 0 筆。
2. 既有同義詞組別英文單複數斷層：
   - `llm` (8 筆) vs `llms` (0 筆)
   - `diff` (290 筆) vs `diffs` (0 筆)
   - `browser` (94 筆) vs `browsers` (0 筆)、`webpage` (94 筆) vs `webpages` (0 筆)
   - `diagram` (7 筆) vs `diagrams` (0 筆)、`flowchart` vs `flowcharts`、`mindmap` vs `mindmaps`
   - `evaluation` (56 筆) vs `evaluations` (0 筆)
   - `parser` (22 筆) vs `parsers` (0 筆)、`decoder` vs `decoders`
   - `config` (169 筆) vs `configs` (0 筆)、`configuration` vs `configurations`
   - `kpi` (16 筆) vs `kpis` (0 筆)
   - `terminal` (28 筆) vs `terminals` (0 筆)、`console` vs `consoles`
   - `migration` (19 筆) vs `migrations` (0 筆)
   - `mock` (37 筆) vs `mocks` (0 筆)
   - `healthcheck` (11 筆) vs `healthchecks` (0 筆)
   - `statemachine` (4 筆) vs `statemachines` (0 筆)
   - `postmortem` (27 筆) vs `postmortems` (0 筆)、`retrospective` vs `retrospectives`
   - `vm` (10 筆) vs `vms` (0 筆)
   - `backup` (44 筆) vs `backups` (0 筆)。
3. 來源網址查詢參數正規化：
   - Canva Help 說明頁之內部搜尋參數 `query`（如 `https://www.canva.com/help/bulk-create/?query=Bulk+Create`）未列入清理，造成說明文件網址規範斷層；
   - 恪守 AI 案例庫規範：「疑似重複只列候選，不自行刪除；總案例數 336 保持完整；嚴格合格案例數 300 保持一致」。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 新增多詞術語自然語言分詞標準化（`end to end` / `end-to-end` → `e2e`）。
   - `SYNONYM_GROUPS` 補強與新增同義詞群：
     - 擴充既有群組英文單複數對稱：備份/backups、llm/llms、比對/diffs、瀏覽器/browsers/webpages、流程圖/flowcharts/diagrams/mindmaps、評估/evaluations、解析/parsers/decoders、容器/vms、配置/configs/configurations、指標/kpis、終端/terminals/consoles、遷移/migrations、模擬/mocks、健康檢查/healthchecks、狀態機/statemachines、復盤/retrospectives/postmortems。
     - 新增 15 組獨立詞群：離線/offline/斷網、基準/基線/baseline/baselines、外洩/洩漏/洩露/leak/leakage、架構/architecture/architectures、回饋/反饋/feedback、非同步/異步/async/asynchronous、端到端/e2e/end-to-end、斷言/assertion/assertions、標註/annotation/annotations/標記/標籤化/labeling、輪詢/polling、增量/incremental、助手/assistant/copilot、生命週期/lifecycle、冪等/冪等性/idempotent/idempotency、環境變數/環境變量/env。
     - 保持 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：`normalizeSourceUrl` 補齊 Canva Help `query` 搜尋參數清理，加入回歸斷言，恪守「只列候選、不自行刪除、總案例數保持完整」。
   - `tests/search.test.cjs`：加入 offline/斷網、baseline/baselines、leak/leakage/洩露、architecture/architectures、feedback/反饋、async/asynchronous、e2e/end-to-end/end to end、assertion/assertions、annotation/annotations、polling、incremental、assistant/copilot、lifecycle、冪等性/idempotency、環境變量，以及 llms/diffs/browsers/webpages/diagrams/flowcharts/mindmaps/evaluations/parsers/decoders/configs/configurations/kpis/terminals/consoles/migrations/mocks/healthchecks/statemachines/postmortems/retrospectives/vms/backups 等 38 組搜尋回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/preview-test/ai-agent-use-cases`。
本輪實際結果：36/36 測試全數通過，336 筆條目全文、同義詞擴充檢索、多詞分詞標準化、單複數對稱性檢驗、疑似重複來源候選審核、全庫一致性檢驗通過。
下一輪建議：依多案例共用公開來源候選叢集（如共用同一官方功能手冊或彙整頁面），評估是否需在案例頁中提供 anchor 或段落指引。

## 2026-10-19：任務封存、失敗診斷、工具回應與請求、會話、機器人、路由、產物、參數、標頭、負載、來源溯源與多詞分詞對稱性強化及追蹤網址正規化審查

先前走查與測試發現：
1. 核心詞彙斷層與自然語言檢索痛點：
   - 封存與歸檔類（Archive, archives, archived, archiving, 封存, 歸檔）：全庫有 14 筆「封存」案例（包含最新發布之 UC-341「已封存任務收到新交辦後啟動，但狀態仍留在封存」及 UC-340「搜尋代理的實際工具回應與模型輸出分開驗收」），但搜尋「archive」僅返回 1 筆、「archives」返回 0 筆、「archived」返回 0 筆、「歸檔」返回 0 筆；
   - 失敗與故障診斷類（Failure, failures, fail, fails, fault, faults, 失敗）：全庫有 137 筆案例明確標記或包含「失敗」自述與復盤（包含 UC-339、UC-341、UC-276、UC-314、UC-169 等），但搜尋英文「failure」僅返回 1 筆（UC-324）、「failures」返回 0 筆、「fail」返回 0 筆；且「fault」僅返回 1 筆（漏掉 89 筆「故障」案例）、「bugs」返回 0 筆（與 89 筆「bug」斷層）；
   - 工具回應與響應類（Response, responses, 回應, 響應）：全庫有 27 筆案例包含「回應」（包含最新 UC-340「實際工具回應與模型輸出分開驗收」），但搜尋「response」返回 0 筆、「responses」返回 0 筆、「響應」返回 0 筆；
   - 請求與交辦類（Request, requests, 請求）：全庫有 35 筆案例包含「請求」（包含 UC-339「跨產品舊交辦重送」），但搜尋「request」僅返回 4 筆、「requests」返回 0 筆；
   - 會話與交談類（Session, sessions, conversation, conversations, 會話, 交談）：全庫有「會話」與「交談」案例（UC-261, UC-296 等），但與英文「session」、「sessions」斷層；
   - 機器人與代理類（Bot, bots, 機器人）：全庫有 250 筆「bot」案例，但中文搜尋「機器人」僅返回 4 筆；
   - 路由與分流類（Routing, route, routes, 路由）：全庫有 10 筆「路由」案例（如 UC-250 郵件路由割接、UC-156 遷移驗證、UC-339 訊息路由、UC-316 分流重現），但搜尋常用英文「routing」返回 0 筆、「route」返回 0 筆、「routes」返回 0 筆；
   - 產物與成品類（Artifact, artifacts, 產物, 成品）：全庫有 64 筆案例包含「產物」（如 UC-214 發布產物身分查驗、UC-005 PR 產物），但搜尋「artifact」僅返回 4 筆、「artifacts」返回 0 筆；
   - 參數類（Parameter, parameters, params, 參數）：全庫有 20 筆案例包含「參數」，但搜尋「parameter」返回 0 筆、「parameters」返回 0 筆；
   - 標頭類（Header, headers, 標頭）：全庫有 5 筆案例包含「標頭」，但搜尋「header」返回 0 筆、「headers」返回 0 筆；
   - 負載類（Payload, payloads, 負載, 有效負載）：全庫有 6 筆案例包含「負載」或「payload」，但中英文未互映；
   - 管線與流水線類（管線, 流水線, pipeline, pipelines）：全庫有 6 筆案例使用「管線」（如 UC-086, UC-132, UC-259, UC-299），但未納入自動化流水線詞群；
   - 來源與溯源類（Provenance, 出處, 溯源, 來源）：全庫有 324 筆案例包含「來源」（包含 UC-339「跨產品舊交辦重送，錯呈現為本人新訊息」），但搜尋英文「provenance」返回 0 筆、「出處」僅 12 筆、「溯源」僅 7 筆；
   - 工作者類（Worker, workers, 工作者）：全庫有 5 筆「工作者」案例（UC-024, UC-049, UC-087 等），但中英文未互映；
   - Schema 與規範類（Schema, schemas, 綱要, 架構規範）：全庫有架構規範案例（UC-062），但「schemas」、「綱要」未互映；
   - 英文單複數對稱：`cookies` (1 筆) vs `cookie` (6 筆)。
2. 多詞術語分詞標準化：
   - 使用者搜尋空格分詞如「cross agent」、「cross-agent」僅返回 1 筆，無法對應到全庫 43 筆「跨代理」/「multi-agent」流程；
   - 使用者搜尋「life cycle」僅返回 1 筆，無法對應到 7 筆「lifecycle」/「生命週期」流程；
   - 使用者搜尋「heart beat」無法對應到「heartbeat」/「心跳」。
3. 來源網址追蹤參數正規化：
   - 成長工程教材之 `track` 追蹤參數（如 `https://www.shipai.club/programs/zero-to-launch/growth-engineering/deck?track=grok-bot`）及 YNAB 支援頁 `mobile-help` 參數（如 `https://support.ynab.com/en_us/reconciling-accounts-a-guide-BJFE3fHys?mobile-help=true`）補入自動化回歸斷言；
   - 恪守 AI 案例庫規範：「疑似重複只列候選，不自行刪除；總案例數 339 保持完整；嚴格合格案例數 299 保持一致」。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 新增多詞自然語言分詞標準化：`life cycle` → `lifecycle`、`cross agent`/`cross-agent` → `cross-agent`、`heart beat` → `heartbeat`。
   - `SYNONYM_GROUPS` 補強與新增同義詞群：
     - 擴充既有詞群：`['debug', 'debugging', '除錯', '排錯', '修復', 'bug', 'bugs', '故障', '排障', 'troubleshoot', 'troubleshooting', 'fault', 'faults']`、`['workflow', '工作流', '自動化', 'automation', 'automate', 'automations', '排程', '定時', 'cron', 'schedule', 'schedules', 'scheduling', '排班', '流水線', '管線', 'pipeline', 'pipelines']`、`['多代理', 'multi-agent', '跨代理', '代理協作', 'cross-agent']`。
     - 新增 16 組獨立詞群：封存/歸檔/archive/archives/archived/archiving、失敗/failure/failures/fail/fails、回應/響應/response/responses、請求/request/requests、會話/交談/對話/session/sessions/conversation/conversations、bot/bots/機器人、路由/routing/route/routes、產物/成果/成品/artifact/artifacts、參數/parameter/parameters/params、標頭/header/headers、負載/有效負載/payload/payloads、出處/溯源/provenance/來源、工作者/worker/workers、schema/schemas/綱要/架構規範、cookie/cookies、heartbeat/heartbeats/心跳。
     - 保持 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：`normalizeSourceUrl` 補入 shipai.club `track` 參數及 ynab `mobile-help` 參數清理之回歸斷言，恪守「只列候選、不自行刪除、總案例數保持完整」。
   - `tests/search.test.cjs`：加入 archive/archives/archived/歸檔、failure/failures/fail、fault/faults/bugs、response/responses/響應、request/requests、session/sessions、機器人/bots、routing/route/routes、artifact/artifacts、parameter/parameters、header/headers、payload/payloads、管線、provenance/溯源/出處、worker/workers、schemas/綱要、cookies，以及 cross agent/cross-agent、life cycle、heart beat 等 40 組搜尋與分詞回歸斷言。

回歸指令：`node --test tests/*.test.cjs`、`node tests/search.test.cjs`、`node tests/audit.test.cjs`、`node --check assets/*.js`、`python3 scripts/preview.py /tmp/preview-test/ai-agent-use-cases`。
本輪實際結果：36/36 測試全數通過，339 筆條目全文、同義詞擴充檢索、多詞分詞標準化、單複數對稱性檢驗、疑似重複來源候選審核、全庫一致性檢驗通過。
下一輪建議：依多案例共用公開來源候選叢集（如共用同一官方功能手冊或彙整頁面），評估是否需在案例頁中提供 anchor 或段落指引。



## 2026-10-19：案例先理解用途，再讀完整來源紀錄

正式站手機走查發現用途被導覽和證據說明推到第一屏以外，320/333 個主要案例又使用相同入門建議。採用「用途 → 完整案例原文紀錄 → 證據與導覽 → 可展開入門建議」；保守選取完整短章節，不截掉段內限制，待查／未知／長文保留全文入口。原文、來源歸因與合格／條目計數未改。

獨立審查補修 38 篇近端來源入口缺口、無章節待查入口及鍵盤／正文可見性測試。最終雲端 QA `39148445621` 全通過：41/41 單元測試、339 筆逐筆比對、193 筆提前呈現完整原段；Chromium 1440/390/320、Firefox/WebKit 390 與既有四套瀏覽器回歸通過，新增15次axe零違規。UC-313用途頂端在預覽桌面824→297px、390手機976→361px；非真人轉換量測。

[前後截圖、模型／基準限制、指令、實際結果與獨立審查](docs/qa/2026-10-19-reading-flow/README.md)。GitHub CLI 的 EMU 帳號無法建立 PR，依明確授權以 SSH 直接合併 push；正式部署另驗。下一輪優先降低全庫全文下載的請求成本，保持全文搜尋與來源一致。


部署後補修：原Reader QA捕捉到WebKit返回`#explore`時焦點按鈕落在視窗外（bottom935.8>844px）。兩幀內有界重查可見位置，保留URL/modal/目標/焦點守衛，使用者輸入會取消且清理監聽。雲端`39150191477`以舊版失敗對照，三引擎六狀態18次檢查及41/41單元通過；獨立審查無必修。協作者`5b5c93c`已無衝突整合，正式站原生返回另驗。

正式補驗完成：補修`abdfbf2`的Pages建置`39150397063`成功，`39150397186`原生正式站WebKit/Chromium/Firefox各3次返回（共9次）均保持按鈕焦點與可見，無pageerror；未注入或mock瀏覽器行為。原生結果與最後一次WebKit畫面已收進本輪QA紀錄。

本輪收尾全綠：補修後原Reader QA `39150397145`（含原生WebKit正式站）與Reading flow QA `39150397150`均成功，Website/Related/Search context/Partial Load/Return visibility/Pages亦全部通過。程式`abdfbf2`，後續僅維護紀錄；詳見本輪QA的final-ci.json，驗收完成停止。

## 2026-10-19：AI Agent 關鍵概念搜尋補強與英文名詞單複數對稱性修復

問題調查與證據：
1. 核心 AI Agent 工作流英文搜尋缺口：
   - 「草稿」（107 筆） vs 英文「draft」（僅 6 筆）、「drafts」（0 筆）、「drafting」（0 筆）、「初稿」（5 筆），搜尋 draft 無法查得全庫百筆代理撰寫與草稿流程；
   - 「交接」（82 筆） vs 英文「handoff」（僅 4 筆）、「handoffs」（0 筆）、「hand off」（4 筆），多代理協作核心的代理交接與人機交接在中英文間存在嚴重搜尋不對稱；
   - 「空跑」（12 筆）與「試跑」（19 筆） vs 英文「dry run」（3 筆）、「dryrun」（0 筆）、「dry-run」（0 筆），排程檢查與安全模擬執行在中英文間未對稱互映；
   - 「護欄」（UC-316） vs 英文「guardrail」（0 筆）、「guardrails」（0 筆）、「guard rail」（0 筆）、「安全護欄」（0 筆），Agent 安全邊界與護欄搜尋落空；
   - 「遙測」（UC-141、UC-223） vs 英文「telemetry」（0 筆）、「observability」（0 筆）、「可觀測性」（0 筆），運維與可觀測性流程中英文未互映；
   - 「人工覆核」（23 筆，如 UC-184、UC-198、UC-242） vs 英文「hitl」（0 筆）、「human in the loop」（0 筆）、「人工介入」（3 筆），人機協同關鍵詞未能全面檢索。
2. 既有核心關鍵字群英文單複數與型態遺漏：
   - `workflow`（147 筆） vs `workflows`（僅 4 筆）——詞群遺漏複數 `workflows`；
   - `crawler`（20 筆） vs `crawlers`（0 筆）、`scraper`（20 筆） vs `scrapers`（0 筆）；
   - `email`（88 筆） vs `emails`（0 筆）、`mailbox`（4 筆） vs `mailboxes`（3 筆）；
   - `code`（132 筆） vs `codes`（4 筆）、`coding`（4 筆）；
   - `meeting`（13 筆） vs `meetings`（0 筆）；
   - `video`（95 筆） vs `videos`（1 筆）；
   - `image`（72 筆） vs `images`（4 筆）、`photo`（72 筆） vs `photos`（3 筆）；
   - `customer`（57 筆） vs `customers`（2 筆）、`client`（57 筆） vs `clients`（0 筆）；
   - `contract`（21 筆） vs `contracts`（0 筆）、`agreement`（21 筆） vs `agreements`（0 筆）；
   - `device`（64 筆） vs `devices`（2 筆）；
   - `database`（44 筆） vs `databases`（0 筆）；
   - `workorder`（67 筆） vs `workorders`（0 筆）、`work-order`、`工單系統`；
   - `reconciliation`（33 筆） vs `reconciliations`（0 筆）、`對賬`、`核賬`。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 多詞自然語言分詞標準化：
     - `\bhand\s*[- ]\s*offs?\b` → `handoff`
     - `\bdry\s*[- ]\s*runs?\b` → `dryrun`
     - `\bguard\s*[- ]\s*rails?\b` → `guardrail`
     - `\bhuman\s*[- ]\s*in\s*[- ]\s*the\s*[- ]\s*loop\b` → `hitl`
     - `\bwork\s*[- ]\s*orders?\b` → `workorder`
   - `SYNONYM_GROUPS` 擴充與新增：
     - 新增 6 組關鍵詞群：
       - 草稿／初稿／draft／drafts／drafting
       - 交接／交棒／轉交／handoff／handoffs
       - dryrun／dry-run／試跑／空跑／模擬執行
       - guardrail／guardrails／護欄／安全護欄
       - telemetry／遙測／遠程測量／observability／可觀測性／可觀察性
       - hitl／human in the loop／人工介入／人工覆核／人工審核／人工把關
     - 補齊既有詞群單複數與型態：
       - workflow 加入 workflows；
       - crawler／scraper 加入 crawlers／scrapers；
       - email 加入 emails／mail／mailbox／mailboxes；
       - code 加入 codes／coding；
       - meeting 加入 meetings；
       - video 加入 videos；
       - image／photo 加入 images／photos；
       - customer／client 加入 customers／clients；
       - contract／agreement 加入 contracts／agreements；
       - device 加入 devices；
       - database 加入 databases；
       - workorder 加入 workorders／工單系統；
       - reconcile 加入 reconciliations／對賬／核賬。
     - 保持 100% 互映對稱映射。
2. `tests/search.test.cjs`：
   - 增加 30+ 組搜尋斷言，覆蓋 draft/drafts、handoff/handoffs/hand off、dry run/dryrun/試跑、guardrail/guardrails/guard rail、telemetry/observability/遙測、hitl/human in the loop/人工覆核，以及 workflows、crawlers、scrapers、emails、mailboxes、codes、coding、meetings、videos、images、photos、customers、clients、contracts、agreements、devices、databases、workorders、reconciliations 等單複數檢索。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索）。
- `node --test tests/*.test.cjs`：41/41 單元測試全數通過。
- `node --check assets/app.js`：語法檢查通過。
- `python3 scripts/preview.py /tmp/preview-test/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，合格數維持 299 筆，無編造案例、無擅刪候選。
下一輪建議：依目前已標註之多案例共用公開來源候選叢集，評估在案例頁提供段落指引或進一步優化同義詞權重排序。

## 2026-10-19：擴充 MCP、連接器、技能、CLI、API Key、用量與沙箱之檢索品質與同義詞對稱

問題調查與證據：
1. 核心 AI Agent 協定與工具連接檢索缺口：
   - 「MCP」（全庫 24 筆，如 UC-010、UC-020、UC-030、UC-045、UC-048、UC-054、UC-061、UC-072、UC-074、UC-090） vs 完整名稱「model context protocol」（僅 1 筆）、「model-context-protocol」（0 筆）、「model context protocols」（0 筆）。讀者鍵入標準協定全稱時因案例多直接簡稱 MCP 而大量落空（24 筆中丟失 23 筆）；
   - 「連接器」（全庫 38 筆，如 UC-006、UC-016、UC-026、UC-027、UC-028、UC-029、UC-030） vs 英文「connector」（18 筆）、「connectors」（12 筆，漏失 6 筆）、「連線器」（0 筆）。在 Meta Muse 及各類工具代理之連接器設定情境下，中英文未對稱關聯；
   - 「技能」（全庫 22 筆，如 UC-006、UC-015、UC-023、UC-035、UC-039、UC-041、UC-046） vs 英文「skill」（21 筆）、「skills」（10 筆，漏失 11 筆）、「外掛技能」（0 筆）。Grok Bot 與 ChatGPT dots 體系中的自訂技能檢索存在詞態與語言斷層；
   - 「grok bot」（245 筆） vs 社群與讀者常見之單詞寫法「grokbot」（僅 49 筆），因空格分詞漏失 196 筆案例；
   - 「meta muse」（105 筆） vs 單詞寫法「metamuse」（0 筆），整庫檢索落空；
   - 「命令列」／「命令行」／「cli」（30 筆，如 UC-005、UC-061、UC-072、UC-269、UC-273） vs 英文自然語言「command line」（0 筆）、「command-line」（0 筆）；
   - 「金鑰」／「密鑰」／「憑證」（126 筆）及「api key」（7 筆，如 UC-072、UC-077、UC-082、UC-229） vs 單詞「apikey」（0 筆）、「api keys」（0 筆）；
   - 「pr」／「pull request」（132 筆） vs 複數「prs」（0 筆）；
   - 「用量」（121 筆，如 UC-001、UC-002、UC-004、UC-005、UC-066）、「額度」（52 筆）、「消耗」（35 筆） vs 英文「usage」（僅 5 筆）、「quota」（11 筆），用量稽核與限額管理中英文檢索割裂；
   - 「沙盒」（3 筆，如 UC-317） vs 「沙箱」（1 筆，UC-329） vs 英文「sandbox」（3 筆），兩岸用詞未互通。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 多詞自然語言分詞標準化：
     - `\bmodel\s*[- ]\s*context\s*[- ]\s*protocols?\b` → `mcp`
     - `\bcommand\s*[- ]\s*lines?\b` → `cli`
     - `\bapi\s*[- ]\s*keys?\b` → `apikey`
     - `\bgrokbot\b` → `grok bot`
     - `\bmetamuse\b` → `meta muse`
     - `\bprs\b` → `pr`
   - `SYNONYM_GROUPS` 擴充與新增：
     - 新增 5 組關鍵詞群：
       - mcp／model context protocol
       - connector／connectors／連接器／連線器
       - skill／skills／技能／外掛技能
       - pr／prs／pull request／pull requests／合併請求
       - 用量／額度／usage／配額／限額／消耗
     - 擴充憑證詞群：加入 apikey／apikeys；
     - 擴充沙盒詞群：加入 沙箱（沙盒／沙箱／sandbox／sandboxes）；
     - 保持 100% 互映對稱映射。
2. `tests/search.test.cjs`：
   - 增加 24 組搜尋斷言，覆蓋 model context protocol/protocols/model-context-protocol、connector/connectors/連線器、skill/skills/技能/外掛技能、grokbot、metamuse、command line/command-line、apikey/api key/api keys、prs、usage/用量/額度/消耗、沙箱/沙盒等檢索。
3. 同步保留工作樹最新獨立回歸成果（tests/late-return.test.cjs 及 docs/qa/2026-10-19-corpus-loading 相關真實資產）。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索）。
- `node --test tests/*.test.cjs`：58/58 單元測試全數通過（含 13 項 late-return 嚴格時序測試）。
- `for file in assets/*.js; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-search-quality/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，合格數維持 299 筆，無編造案例、無擅刪候選。
下一輪建議：針對已識別的 46 組多案例共用公開來源候選叢集，在詳情頁或閱讀器中建立同源案例關聯索引，提升跨案例交叉驗證體驗。

## 2026-10-19：擴充多代理、成本費用、代碼審查、RAG、向量庫與 OAuth2 檢索品質與同義詞對稱

問題調查與證據：
1. 核心 AI Agent 領域詞態、分詞與空格自然語言斷層：
   - 「多代理」（全庫 43 筆，如 UC-042、UC-055、UC-093、UC-248、UC-273、UC-315） vs 英文帶空格自然語言「multi agent」（僅 3 筆，遺失 40 筆）、複數「multi-agents」（0 筆）、「multi agents」（3 筆）、連寫「multiagent」（0 筆）、「多agent」（0 筆）及簡中「多智能體」／「多智能体」（0 筆）；
   - 「成本」（全庫 143 筆）與「費用」（全庫 287 筆，如 UC-007、UC-022、UC-034、UC-056、UC-175 等，涉及 token 計費、訂閱費與模型開銷） vs 英文「cost」（0 筆）、「costs」（0 筆）、「expense」（僅 2 筆）、「expenses」（0 筆）及「開銷」（0 筆），全庫原先完全缺少成本與費用同義詞群，導致營運與財務相關英文檢索全面落空；
   - 「RAG」（19 筆，如 UC-060、UC-129、UC-132、UC-324） vs 協定全稱「retrieval augmented generation」（0 筆）、「retrieval-augmented generation」（0 筆）及「檢索增強」（0 筆）；
   - 「向量」／「vector」（19 筆，如 UC-060、UC-327） vs 複合詞「vector db」（僅 6 筆）、「vector database」（僅 5 筆）、「向量資料庫」（0 筆）、「向量庫」（0 筆）；
   - 程式碼審查情境：「PR審查」／「審查」（如 UC-005、UC-131、UC-214 等） vs 英文「codereview」（0 筆）、「code review」（未對齊中文代碼審查）及中文「代碼審查」（0 筆）、「程式碼審查」（0 筆）、「代碼覆核」（0 筆）；
   - GitLab 體系合併請求：原先僅支援 PR，GitLab 常見之「mr」（7 筆）、「merge request」（0 筆）、「merge requests」（0 筆）未能與 PR 互通；
   - 身份認證情境：「oauth」（61 筆，如 UC-061、UC-218 等）及「sso」（61 筆） vs 具體版本「oauth2」（0 筆）及中文「單一登入」（0 筆）、「單點登入」（0 筆）；
   - 通訊與排程複合詞：「webhook」（7 筆） vs 連字號「web-hook」（0 筆）、「web hooks」（0 筆）；「cron」（147 筆） vs 「cron job」（僅 9 筆）、「cronjob」（0 筆）、「crontab」（0 筆）及「定期任務」（2 筆）；
   - 容錯降級情境：「降級」（4 筆，如 UC-049） vs 複數「fallbacks」（0 筆）、「備援」（僅 2 筆）、「容錯」（0 筆）及「備用方案」（0 筆）。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 多詞自然語言分詞標準化：
     - `\bmulti\s*[- ]\s*agents?\b` 與 `\bmultiagents?\b` → `multi-agent`
     - `\bretrieval\s*[- ]\s*augmented\s*[- ]\s*generations?\b` → `rag`
     - `\bvector\s*[- ]\s*(?:dbs?|databases?)\b` → `vectordb`
     - `\bcode\s*[- ]\s*reviews?\b` 與 `\bcodereviews?\b` → `codereview`
     - `\bmerge\s+requests?\b` → `mr`
     - `\bweb\s*[- ]\s*hooks?\b` → `webhook`
     - `\bcron\s*[- ]\s*jobs?\b`、`\bcronjobs?\b`、`\bcrontabs?\b` → `cron`
   - `SYNONYM_GROUPS` 擴充與新增：
     - 擴充多代理詞群：加入 multi-agents／multiagent／多agent／多智能體／多智能体；
     - 擴充 RAG 與向量詞群：加入 檢索增強／retrieval augmented generation／vectordb／向量資料庫／向量數據庫／向量庫；
     - 擴充認證詞群：加入 oauth2／單一登入／單點登入；
     - 擴充降級詞群：加入 fallbacks／備援／容錯／備用方案；
     - 擴充常規任務詞群：加入 定期任務／cronjob／crontab；
     - 擴充 PR 詞群：加入 mr／mrs／merge request／merge requests；
     - 新增成本與費用核心詞群：成本／費用／開銷／支出／花費／cost／costs／expense／expenses／expenditure／fee／fees；
     - 新增代碼審查詞群：codereview／code review／代碼審查／程式碼審查／代碼覆核／代碼審核／代碼評審／pr審查／pr 審查；
     - 保持 100% 互映對稱映射。
2. `tests/search.test.cjs`：
   - 增加 38 組搜尋斷言，覆蓋 multi agent/multi-agents/multi agents/multiagent/多agent/多智能體、cost/costs/expense/expenses/開銷、retrieval augmented generation/retrieval-augmented generation/檢索增強、vector db/vector database/向量資料庫/向量庫、codereview/代碼審查/程式碼審查/代碼覆核、mr/merge request/merge requests、oauth2/單一登入/單點登入、web-hook/web hooks、cron job/cronjob/crontab/定期任務、fallbacks/備援/容錯/備用方案等檢索。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索）。
- `node --test tests/*.test.cjs`：58/58 單元測試全數通過。
- `for file in assets/*.js; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-search-quality/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，合格數維持 299 筆，無編造案例、無擅刪候選。
下一輪建議：依目前已標註之多案例共用公開來源候選叢集，評估在閱讀器中增列同源候選標籤或關聯提示。

## 2026-10-19：擴充工具呼叫、語音合成辨識、CI/CD、內網穿透、自架Runner與筆記軟體檢索品質與分詞

問題調查與證據：
1. 核心 AI Agent 執行機制與語音／維運領域分詞與同義詞斷層：
   - 「工具呼叫」（全庫 6 筆，如 UC-066、UC-180、UC-196、UC-201、UC-307、UC-340 涉及工具調用取證與驗收） vs 英文帶空格自然語言「tool call」（0 筆）、「tool calls」（0 筆）、「tool calling」（0 筆）、「function call」（0 筆）、「function calls」（0 筆）、「function calling」（0 筆）及常見簡中／中文「工具調用」（0 筆）、「函式呼叫」（0 筆）、「函數調用」（0 筆），因未分詞為複合詞且「call」被展開為電話通話，導致 AI Agent 最核心之工具調用檢索全數落空；
   - 語音處理（TTS / STT）：英文自然語言「text to speech」（0 筆）、「text-to-speech」（0 筆）與中文「語音合成」（0 筆）、「文字轉語音」（0 筆）、「語音朗讀」（0 筆）原先無法匹配涵蓋朗讀與合成音訊之案例（如 UC-046、UC-107、UC-189、UC-239）；英文「speech to text」（0 筆）、「speech-to-text」（0 筆）與中文「語音識別」（0 筆）無法匹配語音轉文字與逐字稿案例（如 UC-325、UC-336）；
   - 持續整合情境：「cicd」（0 筆）、「ci cd」（0 筆）、「持續整合」（0 筆）與「continuous integration」（0 筆）無法檢索涵蓋 CI/CD 管線與 Actions 之案例（如 UC-005、UC-057、UC-096、UC-214）；
   - 網路穿透情境：全庫支援「tunnel」／「隧道」，但中文最廣泛使用之「內網穿透」（0 筆）與「反向代理隧道」（0 筆）未納入同義詞群，無法檢索 UC-074、UC-239、UC-314、UC-336 等遠端轉發與隧道案例；
   - 自架 Runner 情境：「self hosted runner」（0 筆）與「自託管 runner」（0 筆）因缺少 `self-hosted` 分詞與同義詞對齊，無法檢索 UC-057；
   - 筆記與知識管理情境：「筆記軟體」（0 筆）與「pkm」（0 筆）無法檢索 UC-071、UC-333 等外部記憶與筆記案例。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 多詞自然語言分詞標準化：
     - `\b(?:tool|function)\s*[- ]\s*calls?(?:ing)?\b` → `toolcall`
     - `\btext\s*[- ]\s*to\s*[- ]\s*speech\b` → `tts`
     - `\bspeech\s*[- ]\s*to\s*[- ]\s*text\b` → `stt`
     - `\bci\s*[/_-]?\s*cd\b` 與 `\bcontinuous\s+integration\b` → `cicd`
     - `\bself\s*[- ]\s*hosted\b` → `self-hosted`
   - `SYNONYM_GROUPS` 擴充與新增：
     - 擴充 STT／轉錄詞群：加入 stt／speech to text／speech-to-text／語音轉文字／語音識別／語音辨識；
     - 擴充筆記詞群：加入 筆記軟體／pkm；
     - 擴充隧道詞群：加入 內網穿透／反向代理隧道；
     - 新增工具呼叫詞群：toolcall／tool call／tool calls／tool calling／function call／function calls／function calling／工具呼叫／工具調用／函式呼叫／函數調用／工具使用；
     - 新增 TTS 語音合成詞群：tts／text to speech／text-to-speech／語音合成／文字轉語音／語音朗讀／朗讀；
     - 新增 CI/CD 詞群：cicd／ci/cd／ci cd／ci／持續整合／持續交付／continuous integration／github actions；
     - 新增 self-hosted 自架詞群：self-hosted／self hosted／自架／自託管；
     - 保持 100% 互映對稱映射。
2. `tests/search.test.cjs`：
   - 增加 25 組搜尋斷言，覆蓋 tool call/tool calls/tool calling/function call/function calls/function calling/工具調用/函式呼叫/函數調用、text to speech/text-to-speech/語音合成/文字轉語音/語音朗讀、speech to text/speech-to-text/語音識別、cicd/ci cd/持續整合/continuous integration、內網穿透/反向代理隧道、self-hosted runner/self hosted runner/自託管 runner、筆記軟體/pkm 等檢索。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索）。
- `node --test tests/*.test.cjs`：58/58 單元測試全數通過。
- `for file in assets/*.js; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-search-quality/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，合格數維持 299 筆，無編造案例、無擅刪候選。
下一輪建議：依目前已標註之 46 組多案例共用公開來源候選叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤。

## 2026-10-19：擴充提示詞注入防護、結構化輸出、SSE串流、Jira/Zendesk工單與無頭瀏覽器檢索品質及候選重複叢集審計

問題調查與證據：
1. 核心 AI Agent 資安防護、結構化約束、串流與工具分詞斷層：
   - 提示詞注入與越獄安全防護：全庫多篇案例（如 UC-049、UC-118、UC-218 等）涉及提示詞防禦與惡意指令防護，但使用者搜尋常見繁體中文「提示詞注入」、通用「指令注入」、英文自然語言「prompt injection」、「prompt injections」、「instruction injection」或常見資安名詞「越獄」、「jailbreak」時，因 `tokenize` 未合併為複合詞且詞群未互映，檢索全數落空或僅 1 筆；
   - 結構化輸出與 JSON Schema：全庫關鍵之「結構化輸出」（UC-046、UC-256）與「JSON Schema」（UC-062）約束，在使用者搜尋英文帶空格「structured output」、「structured outputs」時被拆分為獨立 `structured` 與 `output` 導致無交集（0 筆），連字號「json-schema」亦為 0 筆；
   - 即時串流與 SSE：全庫多達 10 篇案例（UC-030, UC-065, UC-158, UC-165, UC-246, UC-263, UC-265, UC-298, UC-299, UC-310）採用 SSE（Server-Sent Events）串流傳輸，但既有詞群 `['串流', '流式', 'stream', 'streaming']` 缺少 `sse`、`server-sent events`、`流式輸出`、`流式傳輸`，導致搜「串流」完全遺漏這 10 個核心案例，搜「流式輸出」或「server sent events」為 0 筆；
   - 工單與客服系統：全庫多篇案例涉及 Jira（12 筆）與 Zendesk（7 筆）（如 UC-011、UC-164、UC-283），但工單詞群原先缺少 `jira` 與 `zendesk`，無法與工單／ticket 對齊；
   - 無頭瀏覽器與自動化：UC-046、UC-180 等依賴 Playwright 與網頁自動化，但搜尋「無頭瀏覽器」、「headless browser」、「puppeteer」結果為 0 筆。
2. 疑似重複候選叢集測試完備性：
   - 全庫經 URL 正規化後共識別 46 組 shared URL 候選叢集，過去僅有部分斷言，缺少精確總數約束；補齊 `assert.equal(duplicates.length, 46)`，嚴格保證候選叢集維持 46 組，未刪改任何真實案例或候選檔案。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 多詞自然語言分詞標準化：
     - `\b(?:prompt|instruction)\s*[- ]\s*injections?\b` → `prompt-injection`
     - `\bstructured\s*[- ]\s*outputs?\b` → `structured-output`
     - `\bjson\s*[- ]\s*schemas?\b` → `json-schema`
     - `\bserver\s*[- ]\s*sent\s*[- ]\s*events?\b` → `sse`
     - `\bheadless\s*[- ]\s*browsers?\b` → `headless-browser`
   - `SYNONYM_GROUPS` 擴充與新增：
     - 擴充工單詞群：加入 jira、zendesk；
     - 擴充串流詞群：加入 sse、server sent events、server-sent events、流式輸出、流式傳輸；
     - 新增提示詞注入與越獄詞群：prompt-injection／prompt injection／prompt injections／instruction injection／提示詞注入／提示注入／指令注入／越獄／jailbreak；
     - 新增結構化輸出詞群：structured-output／structured output／structured outputs／結構化輸出／結構化成果／結構化產物／json-schema／json schema；
     - 新增無頭瀏覽器與自動化詞群：headless-browser／headless browser／無頭瀏覽器／playwright／puppeteer／瀏覽器自動化；
     - 保持 100% 互映對稱映射。
2. `tests/search.test.cjs`：
   - 增加 20 組搜尋斷言，覆蓋 prompt injection/prompt injections/instruction injection/提示詞注入/指令注入/越獄/jailbreak、structured output/structured outputs/結構化輸出/json-schema/json schema、流式輸出/流式傳輸/server sent events/server-sent events、jira/zendesk、headless browser/無頭瀏覽器/puppeteer 等檢索。
3. `tests/audit.test.cjs`：
   - 嚴格鎖定全庫 46 組 shared candidate duplicate clusters 總數斷言，確保所有共用來源候選完整列出且絕不自動刪除。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索）。
- `node --test tests/*.test.cjs`：58/58 單元測試全數通過。
- `for file in assets/*.js; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-search-quality-final/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，合格數維持 299 筆，無編造案例、無擅刪候選。
下一輪建議：依目前已標註之 46 組多案例共用公開來源候選叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤。

## 2026-10-19：首屏直接搜尋，保留任務與鍵盤焦點

手機舊版搜尋框需到頁面約1598px，首屏沒有已知任務的直接入口。新增48px高「直接搜尋案例」，在390／320px的y約330px可見；與抽卡區捷徑共用既有搜尋框，保留條件、歷史與修飾鍵，載入中也能先輸入。未改案例、計數、配色或搜尋規則；相對整合父版本僅增加1,070個未壓縮bytes。

先在雲端以test-only重現缺少入口，再修正；獨立審查補上純click焦點競態與WebKit載入可見性。返回檢查的0.46875px捲動取整經trace確認後沿用既有±1px容差，沒有修改產品返回程式。58/58單元、七套PR QA通過；正式Pages部署及三檔逐字比對後的三瀏覽器五組旅程與5次axe（零違規）也成功。

PR #49 合併為185cc17，保留同時新增的協作者af5a05a搜尋詞群、測試與SITE紀錄；獨立整合review無必修。實際模型與effort未有runtime介面可核實，不冒稱最高設定。所有寫入與瀏覽器驗證皆在GitHub雲端執行，本機僅最初唯讀檢查。

[前後截圖、測試指令、實際數據、整合與驗證限制](docs/qa/2026-10-19-home-search-entry/README.md)。未驗實體iOS鍵盤或真人螢幕閱讀器。下一輪優先降低回訪全文載入成本，保持全文搜尋、來源一致與部分失敗回復。

## 2026-10-19：擴充子代理、資料外洩防護、電腦操作CUA、模型推理與上下文長度檢索品質與分詞

問題調查與證據：
1. 核心 AI Agent 協作模式、資安外洩、終端操作與模型架構分詞斷層：
   - 子代理與工作者代理：全庫 UC-061、UC-066、UC-070、UC-093、UC-281 等案例大量使用「子代理」與「工人代理／工作者」，是多代理協作的核心模式；但使用者搜尋英文常用詞 `subagent`、`subagents`、`sub-agent`、`sub agent`、`worker agent` 或中文夾雜 `子agent` 時，因 `tokenize` 未合併為複合詞且詞群未互映，檢索全數落空（0 筆）；
   - 資料外洩防護：全庫 8 篇關鍵案例（UC-035、UC-076、UC-082、UC-235、UC-276、UC-279、UC-283、UC-288）涉及「資料外洩」、「資料洩漏」、「個資外洩」等 AI Agent 資安與隱私控制；但既有詞群僅有單詞 `外洩`，使用者搜尋英文自然語言 `data exfiltration`、`data leak`、`data leakage`、英文專有名詞 `exfiltration`，或中文完整詞彙 `資料外洩`、`資料洩漏`、`個資外洩` 時，因分詞與詞群缺失，檢索全數落空（0 筆）；
   - 電腦操作與 CUA：UC-028、UC-268、UC-322 涉及電腦操作（Computer Use / CUA），使用者搜尋 `computer use`、`computer-use`、`cua`、`電腦操作`、`gui agent` 時，檢索結果零星或互不相通；
   - 模型推理與思考過程：UC-292（DeepSeek think 串流推理行與思考過程）、UC-305（模型推理階段分解）等涉及最新推理模型特徵，使用者搜尋英文 `reasoning`、`inference` 或中文 `思考過程`、`思維過程` 時，結果全為 0 筆；
   - 上下文長度與壓縮：UC-066 深度分析 7 天 238 次上下文壓縮與單則訊息超過上下文上限，UC-093 避免脈絡膨脹；使用者搜尋 `context window`、`上下文窗口`、`上下文長度`、`long context`、`context compaction`、`上下文壓縮` 多數為 0 筆；
   - 混合檢索：UC-132、UC-297 提及混合檢索，使用者搜尋 `hybrid search` 為 0 筆。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 多詞自然語言分詞標準化：
     - `\bsub\s*[- ]\s*agents?\b` 與 `\bsubagents?\b` → `subagent`
     - `\bworker\s*[- ]\s*agents?\b` → `worker-agent`
     - `\bdata\s*[- ]\s*(?:exfiltration|leakage|leaks?)\b` 與 `\bexfiltration\b` → `data-leak`
     - `\bcomputer\s*[- ]\s*use\b` → `computer-use`
     - `\bgui\s*[- ]\s*agents?\b` → `gui-agent`
     - `\bcontext\s*[- ]\s*(?:windows?|lengths?)\b` 與 `\blong\s*[- ]\s*contexts?\b` → `context-window`
     - `\bcontext\s*[- ]\s*compactions?\b` → `context-compaction`
     - `\bhybrid\s*[- ]\s*search(?:es)?\b` → `hybrid-search`
   - `SYNONYM_GROUPS` 擴充與新增：
     - 擴充 RAG 詞群：加入 hybrid-search、hybrid search、混合檢索；
     - 擴充外洩防護詞群：加入 leak／leaks／leakage／leaking／data-leak／data leak／data leaks／data leakage／data exfiltration／exfiltration／資料外洩／資料洩漏／個資外洩／資訊洩漏／信息洩露；
     - 擴充工作者詞群：加入 worker-agent／worker agent／worker agents／工作代理／工人／工人代理；
     - 新增子代理詞群：subagent／subagents／sub-agent／sub agent／子代理／子agent；
     - 新增電腦操作詞群：computer-use／computer use／cua／電腦操作／桌面操作／gui agent／gui-agent／gui代理；
     - 新增推理思考詞群：reasoning／inference／推理／思考過程／思維過程；
     - 新增上下文窗口詞群：context-window／context window／context-length／context length／上下文窗口／上下文長度／長上下文／long context／脈絡長度／上下文上限；
     - 新增上下文壓縮詞群：context-compaction／context compaction／compaction／上下文壓縮／脈絡壓縮／對話壓縮；
     - 保持 100% 互映對稱映射。
2. `tests/search.test.cjs`：
   - 增加 25 組搜尋斷言，覆蓋 subagent/subagents/sub-agent/sub agent/子agent/子代理、worker agent/worker agents/工作代理、data exfiltration/exfiltration/data leak/data leakage/資料外洩/資料洩漏/個資外洩、computer use/computer-use/cua/電腦操作/gui agent、reasoning/inference/思考過程、context window/上下文窗口/上下文長度/long context/context compaction/上下文壓縮、hybrid search/混合檢索等檢索。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索）。
- `node --test tests/*.test.cjs`：58/58 單元測試全數通過。
- `for file in assets/*.js; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：依目前已標註之 46 組多案例共用公開來源候選叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤。

## 2026-10-19：擴充合成資料、自主代理、保活心跳、速率限制、安全轉址、灰度發布與語意檢索品質及分詞

問題調查與證據：
1. 核心 AI Agent 安全測試、自主協作、高可用保活與部署檢索分詞斷層：
   - 合成資料與安全去識別：全庫 33 篇案例（如 UC-103、UC-145、UC-150、UC-166、UC-168、UC-174 等）在測試流程中嚴格規範使用「合成資料」，UC-251 明確註記「synthetic」；但使用者搜尋英文常用詞 `synthetic data` 僅命中 1 筆、`synthetic` 僅 1 筆，搜尋中文常見詞 `合成數據` 命中 0 筆，導致 33 篇安全測試案例全數被遺漏；
   - 自主代理與自主運行：全庫 11 篇案例（UC-012、UC-025、UC-056、UC-061、UC-092、UC-164、UC-185、UC-192、UC-196、UC-270、UC-317）深入探討 AI Agent 自主性（如 UC-317 核心目標為「半夜自主做實驗」、UC-056 為「自主微型生意」），但搜尋 `自主代理` 僅 1 筆，搜尋 `autonomous agent` 僅 2 筆，搜尋 `自主運行` 或 `自主任務` 為 0 筆；
   - 服務保活與心跳：UC-314 深入探討常駐雲端環境可用性與保活機制驗收，既有詞群僅有 `['heartbeat', 'heartbeats', '心跳']`，搜尋 `keepalive` 為 0 筆、`keep-alive` 為 0 筆、`存活檢查` 為 0 筆，且搜尋 `保活` 無法關聯到 heartbeat；
   - 速率限制與正則連字號：UC-164 明確引用 `https://developer.zendesk.com/api-reference/introduction/rate-limits/`（「Zendesk官方限流」），但 `tokenize` 中的正則為 `\brate\s+limits?(?:ing)?\b`（僅限空格，未匹配連字號 `-`），導致 `rate-limits` 未被正規化；且詞群缺少 `rate-limit`、`rate-limits` 與 `速率限制`；
   - 釣魚審查與安全轉址：UC-065（可疑釣魚轉址審查）、UC-073（客戶旅程轉址審計）、UC-163（舊系統轉址遷移）均為核心資安與維運案例，但搜尋英文 `redirect` 為 0 筆、中文 `重定向` 為 0 筆；
   - 金絲雀與灰度發布：UC-061 包含 canary 真實帳號驗收與模擬評測，但搜尋 `金絲雀` 為 0 筆、`灰度發布` 為 0 筆；
   - 語意檢索與向量搜尋：全庫大量使用向量與 RAG 檢索（如 UC-060、UC-061、UC-132、UC-297），但搜尋 `semantic search` 與 `vector search` 被拆分為獨立詞，搜尋 `語意搜尋` 或 `向量檢索` 為 0 筆。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 多詞自然語言分詞標準化：
     - `\brate\s*[- ]\s*limits?(?:ing)?\b` → `ratelimit`（支援連字號與空格）
     - `\bsynthetic\s*[- ]\s*data\b` → `synthetic-data`
     - `\bautonomous\s*[- ]\s*agents?\b` → `autonomous-agent`
     - `\bkeep\s*[- ]\s*alives?\b` → `keepalive`
     - `\bredirects?(?:ion)?\b` → `redirect`
     - `\bcanary\s*[- ]\s*(?:releases?|deployments?)?\b` → `canary`
     - `\bblue\s*[- ]\s*green\s*[- ]\s*deployments?\b` → `blue-green`
     - `\bsemantic\s*[- ]\s*search(?:es)?\b` → `semantic-search`
     - `\bvector\s*[- ]\s*search(?:es)?\b` → `vector-search`
   - `SYNONYM_GROUPS` 擴充與新增：
     - 擴充限流詞群：加入 `rate-limit`、`rate limit`、`rate-limits`、`rate limits`、`rate limiting`、`rate-limiting`、`速率限制`；
     - 擴充保活／心跳詞群：加入 `keepalive`、`keep-alive`、`保活`、`存活檢查`、`存活確認`、`liveness`；
     - 擴充 RAG 與語意檢索詞群：加入 `semantic-search`、`semantic search`、`語意搜尋`、`語義搜索`、`語意檢索`、`語義檢索`、`vector-search`、`vector search`、`向量檢索`；
     - 新增合成資料詞群：`synthetic-data`／`synthetic data`／`synthetic`／`合成資料`／`合成數據`／`生成資料`／`生成數據`；
     - 新增自主代理詞群：`autonomous-agent`／`autonomous agent`／`autonomous agents`／`autonomous`／`自主代理`／`自主agent`／`自主運行`／`自主智能體`／`自主任務`／`自主`；
     - 新增轉址詞群：`redirect`／`redirects`／`redirection`／`轉址`／`重定向`／`跳轉`；
     - 新增金絲雀／灰度部署詞群：`canary`／`canaries`／`金絲雀`／`灰度`／`灰度發布`／`灰度部署`／`藍綠部署`／`blue-green`；
     - 保持 100% 互映對稱映射。
2. `tests/search.test.cjs`：
   - 增加 25 組搜尋斷言，覆蓋 synthetic data/synthetic/合成數據/合成資料、autonomous agent/自主代理/自主運行/自主任務、keepalive/keep-alive/保活/存活檢查、rate-limits/rate limit/速率限制、redirect/redirection/重定向/轉址、canary/金絲雀/灰度發布、semantic search/語意搜尋/vector search/向量檢索等檢索。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索）。
- `node --test tests/*.test.cjs`：58/58 單元測試全數通過。
- `for file in assets/*.js; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：依目前已標註之 46 組多案例共用公開來源候選叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤。



## 2026-10-19：搜尋以主用途優先，保留全文與證據限制

實際雲端基準顯示「薪水」7筆中，薪酬主題UC-230排第6、限制中提到薪資的UC-024排第2；「收件匣」89筆首筆為旅行案例。先新增test-only紅燈，再為既有搜尋加入穩定欄位排序：精確編號（含純數字與短UC/P寫法）、標題／用途涵蓋詞數優先，全文與全部條件的召回集合不變；不依詞頻、證據或人氣評分。有結果時說明排序限制，空結果與載入時隱藏。

薪酬主題移到第1，收件匣前排改為信箱／郵件主題；339總條目、299合格數及原始內容未變。獨立角色審查diff、桌面與390／320截圖及完整報告，修正短ID必修後無剩餘必修。63/63單元、五組跨瀏覽器三情境與5次axe零違規；未操作個人GUI或使用另付費API，實際模型／effort無runtime介面可驗證。

[方案取捨、前後截圖、指令、原始結果與發布驗收](docs/qa/2026-10-19-search-relevance/README.md)。下一輪優先量測並降低回訪全文載入成本；本輪不宣稱真人偏好、留存或語義搜尋能力。

發布後額外原生返回檢查遇到WebKit取圖干擾。先保留真實紅燈，經時間線、交錯對照及固定app最小差異實驗，原腳本失敗、僅移除取圖則三引擎30輪通過。只修測試為失敗後取圖並加PR原生返回檢查；沒有改產品返回程式、300ms截止或放寬斷言，完整證據見上述驗收紀錄。

PR #51與#52已分別合併；最終15c3dc6的正式原生Back三引擎各10次、共30次全部通過，Pages部署成功。文書補錄不改產品，完整原始結果與限制見本輪QA紀錄。

## 2026-10-19：擴充雙重驗證、思維鏈、環境隔離、限速節流、人機協同、派工分發、跑分評測與代理工作流檢索品質及分詞

問題調查與證據：
1. 核心 AI Agent 身分安全、推理鏈、沙箱環境與工作流檢索分詞斷層：
   - 雙重驗證與多因素認證：UC-092 明確提及「雙重驗證」，UC-219 與 UC-259 涉及「2fa」，但在身分安全檢索中，搜尋「2fa」僅命中 2 筆（漏掉 UC-092）、「雙重驗證」僅命中 1 筆（漏掉 UC-219、UC-259），搜尋「mfa」、「二步驟驗證」、「兩步驟驗證」、「多因素驗證」皆返回 0 筆，導致身分安全相關案例互相割裂；
   - 思維鏈與 CoT 推理：全庫多篇探討模型思考過程與推理行（如 UC-086 涉及便宜模型判斷與審核、UC-292 深度串流推理思考過程、UC-305 模型推理階段），但使用者搜尋專有名詞「chain of thought」、「chain-of-thought」、「思維鏈」、「思考鏈」返回 0 筆；
   - 沙箱與網路隔離：全庫 43 筆案例包含「隔離」（如 UC-003, UC-004, UC-005, UC-007, UC-010, UC-042, UC-057, UC-067, UC-166, UC-174, UC-238 等涉及沙箱隔離、網路隔離與安全邊界），但搜尋英文常用詞「isolation」返回 0 筆、「airgap」返回 0 筆、「air-gap」返回 0 筆、「網路隔離」返回 0 筆；
   - 限速與節流控制：全庫「throttling」與「限速」有 12 筆結果，但搜尋英文動詞原型「throttle」返回 0 筆，中文「節流」僅 1 筆且未能連繫至配額與頻率限制；
   - 人機協同與審查：全庫「hitl」與「human in the loop」有 23 筆，但搜尋現代 AI Agent 最常用的中文「人機協同」返回 0 筆、「人機協作」返回 0 筆，「人工審查」僅 3 筆未對齊人機介入把關；
   - 派工與任務分發：全庫「dispatch」與「分派」有 32 筆，但 UC-079（「分發各組」）與 UC-238（「分發至不同端點」）使用「分發」，搜尋「分派」或「dispatch」漏失這兩篇關鍵多代理工作流；
   - 基準評測與跑分：全庫「benchmark」與「評測」有 57 筆，UC-046 使用社群常見詞「跑分」，但搜尋「跑分」僅命中 1 筆，無法檢索全庫 57 筆基準評測案例；
   - 代理工作流：全庫「agentic」有 4 筆、UC-268 明確標記「代理工作流」，但搜尋「agentic workflow」因空格拆分返回 0 筆，搜尋「智能體工作流」返回 0 筆。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 多詞自然語言分詞標準化：
     - `\bchain\s*[- ]\s*of\s*[- ]\s*thoughts?\b` → `cot`
     - `\bair\s*[- ]\s*gaps?\b` → `airgap`
     - `\bagentic\s*[- ]\s*workflows?\b` → `agentic-workflow`
   - `SYNONYM_GROUPS` 擴充與新增：
     - 擴充限流詞群：加入 `throttle`、`throttles`、`節流`；
     - 擴充 HITL 詞群：加入 `人機協同`、`人機協作`、`人工審查`；
     - 擴充派工詞群：加入 `分發`、`dispatches`；
     - 擴充評測詞群：加入 `跑分`、`跑分測試`；
     - 新增雙重驗證詞群：`2fa`／`mfa`／`雙重驗證`／`二步驟驗證`／`兩步驟驗證`／`多因素驗證`／`雙因子驗證`／`雙因素驗證`／`兩階段驗證`；
     - 新增思維鏈詞群：`cot`／`chain-of-thought`／`chain of thought`／`思維鏈`／`思考鏈`；
     - 新增隔離詞群：`隔離`／`isolation`／`airgap`／`air-gap`／`網絡隔離`／`網路隔離`／`環境隔離`；
     - 新增代理工作流詞群：`agentic-workflow`／`agentic workflow`／`agentic workflows`／`代理工作流`／`智能體工作流`／`agent工作流`；
     - 保持 100% 互映對稱映射。
2. `tests/search.test.cjs`：
   - 增加 22 組搜尋斷言，覆蓋 2fa/mfa/雙重驗證/二步驟驗證/兩步驟驗證、chain of thought/chain-of-thought/思維鏈/思考鏈、isolation/airgap/air-gap/網路隔離、throttle/節流、人機協同/人機協作/人工審查、dispatch/分派/分發、跑分、agentic workflow/智能體工作流等檢索。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索）。
- `node --test tests/*.test.cjs`：63/63 單元測試全數通過。
- `for file in assets/*.js; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：依目前已標註之 46 組多案例共用公開來源候選叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤。

## 2026-10-19：擴充重新排序、去重查重、任務委派、防火牆、稽核軌跡、指數退避、多模態與系統提示詞檢索品質及分詞

問題調查與證據：
1. 核心 AI Agent 架構、資料處理、任務分發、維運防護與檢索分詞斷層：
   - 檢索重新排序（Rerank）：UC-040 明確標記「模型重新排序（重排）候選路線」、UC-114 具體標記「重排」，全庫共 9 筆案例涉及候選結果二次篩選與重排，但搜尋業界標準專有名詞「rerank」、「reranker」、「reranking」、「二次排序」皆返回 0 筆；
   - 資料去重與重複偵測（Dedup）：全庫 257 筆案例包含「去重與版本紀錄」，且 UC-046「跨天去重」、UC-055「查重」、UC-255「整合去重」均以去重為關鍵機制，但搜尋英文「deduplication」返回 0 筆、「去重複」返回 0 筆，「dedup」僅 1 筆、「查重」僅 6 筆，無法關聯全庫去重處理案例；
   - 任務委派與委託（Delegation）：UC-039「委派其他代理人」、UC-045「委派專屬小幫手」、UC-075「委派不同 Bot」、UC-081「委派各個專業 Bot」、UC-120「委託 Bot」使用委派與委託概念，但搜尋英文「delegate」返回 0 筆、「delegation」僅 1 筆，且「委託」與現有派工調度（dispatch）割裂；
   - 主機防火牆防護（Firewall）：UC-269 明確以「iptables 防火牆、fail2ban 與 Docker 狀態巡檢」為核心維運題目、UC-096 涉及防火牆日誌排查，但搜尋「firewall」、「iptables」、「ufw」皆返回 0 筆；
   - 稽核軌跡與操作日誌（Audit Trail）：UC-061 涉及「指令台帳與稽核軌跡」、UC-225 明確提及「稽核軌跡仍未取得」、UC-283 涉及「稽核軌跡」、UC-241 標註「操作記錄」，但使用者搜尋「audit trail」、「審計日誌」、「操作軌跡」返回 0 筆，搜尋「操作記錄」因字元差異（記錄 vs 紀錄）漏失 12 筆案例；
   - 指數退避與重試機制（Backoff）：全庫 UC-001、UC-005、UC-041、UC-045、UC-074、UC-164 等大量案例規範網路與服務重試邊界，但搜尋「backoff」、「exponential backoff」、「指數退避」、「退避」、「重試機制」皆返回 0 筆；
   - 多模態與視覺模型（Multimodal）：UC-083（看圖填空）、UC-121（視覺特徵整理）、UC-140（視覺估距）、UC-242（看圖）、UC-245（看圖）、UC-314（看圖）等包含圖文與看圖案例，但搜尋現代名詞「multimodal」、「多模態」、「視覺模型」、「vlm」皆返回 0 筆；
   - 系統提示詞（System Prompt）：全庫 157 筆案例涉及提示詞與系統指示，但搜尋「system prompt」、「system instructions」、「系統提示詞」、「系統提示」皆返回 0 筆或僅因空格拆分而無法準確召回提示詞主題案例。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 多詞自然語言分詞標準化：
     - `\bre\s*[- ]*rank(?:ing|s|er|ers)?\b` → `rerank`
     - `\bde\s*[- ]*dup(?:lication)?s?\b` → `dedup`
     - `\bdelegat(?:e|es|ed|ing|ion|ions)\b` → `delegate`
     - `\baudit\s*[- ]\s*trails?\b` → `audit-trail`
     - `\baudit\s*[- ]\s*logs?\b` → `audit-log`
     - `\bexponential\s*[- ]\s*backoffs?\b` → `backoff`
     - `\bbackoffs?\b` → `backoff`
     - `\bmulti\s*[- ]\s*modals?\b` → `multimodal`
     - `\bvision\s*[- ]\s*language\s*[- ]\s*models?\b` → `vlm`
     - `\bsystem\s*[- ]\s*(?:prompts?|instructions?)\b` → `system-prompt`
   - `SYNONYM_GROUPS` 擴充與新增：
     - 擴充重試詞群：加入 `backoff`、`exponential backoff`、`指數退避`、`退避`、`重試機制`、`退避重試`；
     - 擴充派工詞群：加入 `委派`、`委託`、`delegate`、`delegation`、`delegates`、`delegating`；
     - 擴充提示詞群：加入 `system-prompt`、`system prompt`、`system prompts`、`system instructions`、`系統提示詞`、`系統提示`、`系統指令`、`系統設定詞`；
     - 新增重排詞群：`rerank`／`reranking`／`reranker`／`重排`／`二次排序`／`重新排序`；
     - 新增去重詞群：`dedup`／`deduplication`／`去重`／`去重複`／`查重`／`重複資料`／`數據去重`／`資料去重`；
     - 新增防火牆詞群：`防火牆`／`firewall`／`firewalls`／`iptables`／`ufw`／`網路防火牆`／`網絡防火牆`；
     - 新增稽核軌跡詞群：`audit-trail`／`audit trail`／`audit-trails`／`audit trails`／`audit-log`／`audit log`／`audit logs`／`稽核軌跡`／`審計日誌`／`稽核日誌`／`操作紀錄`／`操作記錄`／`操作軌跡`／`變更軌跡`／`審計軌跡`；
     - 新增多模態詞群：`multimodal`／`multi-modal`／`多模態`／`看圖`／`視覺模型`／`vlm`／`視覺辨識`／`視覺分析`；
     - 保持 100% 互映對稱映射。
2. `tests/search.test.cjs`：
   - 增加 28 組搜尋斷言，覆蓋 rerank/reranking/reranker/重排/二次排序、dedup/deduplication/去重複/查重/重複資料、delegate/delegation/委派/委託、firewall/防火牆/iptables、audit trail/審計日誌/操作軌跡/操作記錄、backoff/exponential backoff/指數退避/退避/重試機制、multimodal/多模態/視覺模型/看圖、system prompt/系統提示詞/系統提示/system instructions 等檢索。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索）。
- `node --test tests/*.test.cjs`：63/63 單元測試全數通過。
- `for file in assets/*.js; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：依目前已標註之 46 組多案例共用公開來源候選叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤。

## 2026-10-19：擴充最小權限原則、允許／封鎖名單、敏感資料保護、路由器與緊急停止開關檢索品質及分詞

問題調查與證據：
1. 核心 AI Agent 安全架構、存取邊界、資料保護、任務路由與緊急熔斷檢索斷層：
   - 最小權限原則（Least Privilege）：全庫共 11 筆案例（UC-003、UC-010、UC-024、UC-035、UC-061、UC-077、UC-118、UC-155、UC-218、UC-269、UC-283）明確規範代理人最小權限（包括最小權限帳號、API 權限收攏、目錄權限鎖定與唯讀操作），但使用者搜尋國際標準詞彙「least privilege」、「least-privilege」、「least privileges」或中文「最小權限原則」、「權限最小化」皆返回 0 筆；
   - 允許名單與白名單（Allowlist / Whitelist）：UC-005、UC-077、UC-257、UC-269、UC-275、UC-308（共 6 筆案例）明確規範 IP 白名單、sudo 白名單、收件人白名單、來源網址白名單與號碼白名單，但搜尋英文「whitelist」、「whitelisting」、「allowlist」、「allowlisting」皆返回 0 筆；
   - 拒絕名單與黑名單（Denylist / Blacklist）：UC-005 明確指出「指令黑名單與提示詞本身不等於作業系統隔離」，但搜尋英文「blacklist」、「blacklisting」、「denylist」、「denylisting」、「blocklist」或中文「封鎖名單」、「拒絕清單」皆返回 0 筆；
   - 敏感資料與資訊保護（Sensitive Data）：全庫共 14 筆案例包含「敏感資料」、4 筆包含「敏感資訊」，但搜尋英文「sensitive data」、「sensitive-data」、「sensitive information」、「sensitive info」皆返回 0 筆，且搜尋「敏感資訊」僅能召回 4 筆、漏失另外 14 筆「敏感資料」案例，搜尋簡體「敏感信息」亦返回 0 筆；
   - 路由與路由器（Router / Routing）：全庫共 12 筆案例涉及任務與模型「路由」（UC-010、UC-054、UC-156、UC-167、UC-250、UC-276、UC-302 等），且 UC-054 與 UC-302 明確使用「router」、UC-010 使用「路由器」，但搜尋英文「router」僅召回 2 筆、「routers」返回 0 筆、「路由器」僅召回 1 筆，無法關聯其餘 10 筆路由案例；
   - 緊急停止開關與熔斷機制（Kill Switch / Circuit Breaker）：UC-275 核心架構包含「緊急停止開關」與一鍵停用，UC-005 與 UC-164 具備操作終止開關，但搜尋業界標準專有名詞「kill switch」、「kill-switch」、「emergency stop」、「emergency-stop」、「circuit breaker」、「circuit-breaker」、「緊急開關」、「熔斷」、「熔斷器」、「斷路器」皆返回 0 筆。

本輪改善：
1. `assets/app.js`：
   - `tokenize` 多詞自然語言分詞標準化：
     - `\bleast\s*[- ]\s*privileges?\b` → `least-privilege`
     - `\bwhite\s*[- ]\s*lists?(?:ing)?\b` → `whitelist`
     - `\ballow\s*[- ]\s*lists?(?:ing)?\b` → `allowlist`
     - `\bblack\s*[- ]\s*lists?(?:ing)?\b` → `blacklist`
     - `\bdeny\s*[- ]\s*lists?(?:ing)?\b` → `denylist`
     - `\bblock\s*[- ]\s*lists?(?:ing)?\b` → `blocklist`
     - `\bsensitive\s*[- ]\s*(?:data|info|information)\b` → `sensitive-data`
     - `\brouters?\b` → `router`
     - `\bkill\s*[- ]\s*switch(?:es)?\b` → `kill-switch`
     - `\bemergency\s*[- ]\s*stops?\b` → `emergency-stop`
     - `\bcircuit\s*[- ]\s*breakers?\b` → `circuit-breaker`
   - `SYNONYM_GROUPS` 擴充與新增：
     - 擴充路由詞群：加入 `router`、`routers`、`路由器`、`動態路由`；
     - 新增最小權限詞群：`least-privilege`／`least privilege`／`least privileges`／`最小權限`／`最小權限原則`／`權限最小化`；
     - 新增白名單詞群：`whitelist`／`whitelisting`／`allowlist`／`allowlisting`／`白名單`／`允許清單`／`允許名單`；
     - 新增黑名單詞群：`blacklist`／`blacklisting`／`denylist`／`denylisting`／`blocklist`／`blocklisting`／`黑名單`／`封鎖名單`／`拒絕清單`；
     - 新增敏感資料詞群：`sensitive-data`／`sensitive data`／`sensitive information`／`sensitive info`／`敏感資料`／`敏感資訊`／`敏感信息`；
     - 新增緊急停止與熔斷詞群：`kill-switch`／`kill switch`／`emergency-stop`／`emergency stop`／`circuit-breaker`／`circuit breaker`／`緊急停止`／`緊急開關`／`停止開關`／`熔斷`／`熔斷器`／`斷路器`／`緊急停止開關`；
     - 保持 100% 互映對稱映射。
2. `tests/search.test.cjs`：
   - 增加 27 組搜尋斷言，覆蓋 least privilege/least-privilege/least privileges/最小權限/最小權限原則/權限最小化、whitelist/whitelisting/allowlist/allowlisting/白名單/允許清單、blacklist/blacklisting/denylist/blocklist/黑名單、sensitive data/sensitive information/sensitive info/敏感資料/敏感資訊/敏感信息、router/routers/路由器/路由/routing/動態路由、kill switch/emergency stop/circuit breaker/緊急停止/緊急開關/停止開關/熔斷/斷路器等檢索。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索）。
- `node --test tests/*.test.cjs`：63/63 單元測試全數通過。
- `for file in assets/*.js; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：針對已標註之 46 組候選重複來源叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤。

## 2026-10-19：擴充發件匣模式、記憶管理、檢查點、沙盒、冪等性、GitHub Actions 與 PR 審查檢索品質

問題調查與證據：
1. Agent 系統工程架構與開發者工作流程關鍵字斷層：
   - 發件匣模式（Outbox Pattern）：UC-329 核心架構採用可靠發件匣模式，但搜尋英文「outbox」、「outbox-pattern」、「outbox pattern」或中文「發件匣」、「發件箱」、「發件匣模式」皆無法命中；
   - 記憶架構（Memory）：全庫包含外部記憶、工作記憶、共用記憶、持久記憶等多種記憶架構（UC-066、UC-067、UC-071、UC-255、UC-338），但搜尋英文多詞「long-term memory」、「working memory」、「external memory」、「shared memory」、「persistent memory」因分詞阻斷皆無法命中；
   - 檢查點（Checkpoint）：UC-231 規範混音階段檢查點，搜尋英文複數「checkpoints」、分詞「check point」、「checkpointing」皆無法命中；
   - 沙盒環境（Sandbox）：UC-317 原型具備沙盒隔離環境，搜尋英文複數「sandboxes」、「sandboxing」、中文「沙箱」、「沙盒環境」皆無法命中；
   - 冪等性（Idempotence）：UC-158 處理訂單補償冪等操作，搜尋英文名詞「idempotence」、「idempotency」、中文「冪等性」、「冪等操作」皆無法命中；
   - 開發者流程：搜尋「github actions」未映射至 CI/CD、「pr審查」未映射至代碼審查。

改善內容：
1. `assets/app.js`：
   - 擴充 outbox、memory、checkpoint、sandbox、idempotent、github actions、pr 審查分詞與同義詞群；
   - 保持 100% 互映對稱映射。
2. `tests/search.test.cjs`：新增 49 組檢索回歸斷言。

## 2026-10-19：修正案例查證日期誤抓歷史發布日缺陷、擴充多代理編排／協調者／存取控制／事件驅動／藍綠部署／倒退檢索品質

問題調查與證據：
1. 資料正確性與中繼資料缺陷（10 筆案例查證日期解析錯誤）：
   - `assets/app.js` 中 `metadata` 之日期擷取原僅以 `^-\s*(?:查證日期|查閱日期|核對日期|研究核對日|首次收錄[／、]最近查證|查證)\s*[：:]` 匹配行首標記，若行首為 `- 實作日期：`、`- 發布日期：`、`- 開始日期：` 或 `- 日期：`（但行內包含「查證2026-10-16」或「查閱2026-10-16」），則行首匹配落空；
   - 其備援邏輯直接取 `lead.match(/20\d{2}-\d{2}-\d{2}/)?.[0]`，導致 UC-221（2026-09-24）、UC-222（2026-09-28）、UC-224（2026-10-08）、UC-239（2026-10-18）、UC-256（2026-09-26）、UC-257（2026-09-29）、UC-258（2026-10-15）、UC-259（2026-10-11）、UC-260（2026-08-23）、UC-278（2026-10-11）共 10 筆案例之 `entry.date` 誤抓歷史發表／起草日期，而非真實查證日期（2026-10-16、2026-10-17），違反 `tests/audit.test.cjs` 驗證日期準確性原則；
2. 核心 AI Agent 架構與安全性檢索斷層：
   - 編排與編排者（Orchestration / Orchestrator）：全庫多案涉及任務與多代理編排（如 UC-061、UC-071 等），但搜尋英文「orchestrator」、「orchestrators」或中文「編排者」皆返回 0 筆；
   - 協調與協調者（Coordination / Coordinator / Supervisor）：全庫共 34 筆案例涉及多代理分工協調（UC-005、UC-012、UC-054 等），但搜尋英文「coordinator」、「coordinators」、「supervisor」、「supervisors」或中文「協調者」、「監管代理」皆無法精確命中或返回 0 筆；
   - 存取控制與角色權限（Access Control / RBAC）：全庫共 7 筆案例明確規範存取控制與權限邊界（UC-011、UC-044、UC-128、UC-130、UC-276、UC-297、UC-323），但搜尋「access control」遺漏 UC-276 等案，搜尋「access-control」、「rbac」、「訪問控制」、「權限控制」皆返回 0 筆；
   - 事件驅動架構（Event-Driven）：UC-074 涉及 MCP 事件驅動工作流，但搜尋英文「event-driven」、「event driven」或中文「事件驅動架構」皆返回 0 筆；
   - 藍綠部署與回退（Blue-Green / Rollback）：搜尋無連字號之「blue green」返回 0 筆，搜尋中文「倒退」返回 0 筆。

本輪改善：
1. `assets/app.js`：
   - 修正 `metadata` 日期解析：於行首標記落空時，優先匹配行內 `(?:查證|查閱|核對|最近查證)\s*[：:；]?\s*.*?(20\d{2}-\d{2}-\d{2})`，徹底修復 UC-221、UC-222、UC-224、UC-239、UC-256、UC-257、UC-258、UC-259、UC-260、UC-278 十筆案例之查證日期解析；
   - `tokenize` 多詞自然語言分詞標準化：
     - `\bblue\s*[- ]\s*green(?:\s*[- ]\s*(?:releases?|deployments?))?\b` → `blue-green`
     - `\borchestrat(?:e|ed|es|ing|or|ors|ion|ions)\b` → `orchestration`
     - `\bcoordinat(?:e|ed|es|ing|or|ors|ion|ions)\b` → `coordination`
     - `\bsupervisors?\b` → `supervisor`
     - `\baccess\s*[- ]\s*controls?\b` → `access-control`
     - `\brole\s*[- ]\s*based\s*[- ]\s*access\s*[- ]\s*controls?\b` → `rbac`
     - `\bevent\s*[- ]\s*driven\b` → `event-driven`
   - `SYNONYM_GROUPS` 擴充與新增：
     - 擴充編排詞群：加入 `編排者`、`orchestrator`、`orchestrators`；
     - 擴充協調詞群：加入 `協調者`、`coordinator`、`coordinators`、`supervisor`、`supervisors`、`監管代理`；
     - 新增存取控制詞群：`access-control`／`access control`／`rbac`／`存取控制`／`訪問控制`／`存取權限`／`權限控制`；
     - 新增事件驅動詞群：`event-driven`／`event driven`／`事件驅動`／`事件驅動架構`／`事件觸發`；
     - 擴充回退詞群：加入 `倒退`；
     - 保持 100% 互映對稱映射。
2. `tests/audit.test.cjs` 與 `tests/search.test.cjs`：
   - `tests/audit.test.cjs`：新增對 UC-221、UC-222、UC-224、UC-239、UC-256、UC-257、UC-258、UC-259、UC-260、UC-278 十筆案例之真實查證日期防回歸自動化斷言；
   - `tests/search.test.cjs`：新增 21 組檢索斷言，覆蓋 orchestrator/coordinators/supervisors/協調者/監管代理、access control/rbac/存取控制/訪問控制/權限控制、event-driven/事件驅動/事件驅動架構、blue green、倒退等檢索，並增加 4 筆案例日期斷言。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：針對已標註之 46 組候選重複來源叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤。

## 2026-10-19：修正來源網址全形標點沾黏瑕疵、擴充任務規劃／可重現性／引用出處／工具使用／容災檢索品質

問題調查與證據：
1. 來源驗證與 URL 正確性缺陷（2 筆案例之原始 URL 沾黏全形標點）：
   - `cases/071-obsidian-dots-visible-memory.md` 行 31：原始貼文網址末端沾黏全形逗號 `https://x.com/MakeAI_CEO/status/2110593793364029721，`，導致 Markdown 網址解析錯誤；
   - `cases/079-business-email-alias-diagnosis.md` 行 31：原始貼文網址末端沾黏全形冒號 `https://x.com/JavyDiaz/status/2110976719175790983：`，導致 Markdown 網址解析錯誤；
   - `tests/audit.test.cjs` 原僅檢查 `[）〕』]`，未涵蓋全形逗號、全形冒號、全形分號、全形句號等 CJK 標點沾黏之檢驗。
2. 核心 AI Agent 工作流與方法論檢索品質斷層：
   - 任務規劃（Planning / Task Planning）：全庫有 27+ 案例以「規劃」為核心目標、標籤與用途（UC-001、UC-010、UC-016、UC-027、UC-033、UC-040、UC-043、UC-148、UC-170、UC-210、UC-211、UC-219、UC-264、UC-269 等），但搜尋英文「planning」僅命中 1 筆，搜尋「task planning」命中 0 筆，搜尋中文「任務規劃」命中 0 筆；
   - 可重現性（Reproducibility / Reproducible）：全庫超過 94 筆案例在驗收標準與證據中明確包含「可重現」或「重現性」，但英文搜尋「reproducibility」、「reproducible」、「reproduce」命中 0 筆；
   - 引用／出處／溯源（Citation / Citations / Provenance）：全庫 53 筆案例標示「引用」、331 筆標示「出處」與「溯源」，但英文搜尋「citation」、「citations」命中 0 筆；
   - 工具使用／函式調用（Tool Use / Function Calling）：中文「函式調用」與「函數呼叫」及英文「tool use」、「tool-use」未納入同義詞群，搜尋「函式調用」或「函數呼叫」命中 0 筆；
   - 容災／故障轉移（Failover）：UC-324 核心架構包含 failover，搜尋中文「故障轉移」、「容災」命中 0 筆。

本輪改善：
1. 案例網址修復：
   - `cases/071-obsidian-dots-visible-memory.md`：將原始貼文網址轉換為標準 Markdown 連結格式 `[貼文](https://x.com/MakeAI_CEO/status/2110593793364029721)`，徹底隔開全形逗號；
   - `cases/079-business-email-alias-diagnosis.md`：將原始貼文網址轉換為標準 Markdown 連結格式 `[貼文](https://x.com/JavyDiaz/status/2110976719175790983)`，徹底隔開全形冒號。
2. `tests/audit.test.cjs`：
   - 擴充 `unbracketedPunctuationUrls` 正則表達式，嚴格偵測全形標點 `[）〕』，。：；」”》】、！]` 沾黏 raw URL；
   - 新增針對 UC-071 與 UC-079 URL 正確無沾黏之防回歸自動化斷言。
3. `assets/app.js`：
   - `tokenize` 多詞自然語言分詞標準化：
     - `\b(?:task|work|job)\s*[- ]\s*plannings?\b` → `planning`
     - `\bplannings?\b` → `planning`
     - `\breproducib(?:ility|le)\b` → `reproducibility`
     - `\breproduc(?:e|ed|es|ing)\b` → `reproducibility`
     - `\bcitat(?:ion|ions|e|ed|es|ing)\b` → `citation`
     - `\btool\s*[- ]\s*us(?:e|ed|es|ing)\b` → `toolcall`
     - `\bfail\s*[- ]\s*overs?\b` → `failover`
   - `SYNONYM_GROUPS` 擴充與新增：
     - 新增規劃詞群：`['planning', 'plan', 'plans', '規劃', '任務規劃', '計畫', '計劃', '籌劃']`；
     - 新增重現性詞群：`['reproducibility', 'reproducible', 'reproduce', '重現', '可重現', '重現性', '獨立重現', '復現', '復現性']`；
     - 擴充出處詞群：加入 `citation`、`citations`、`引用`、`引文`；
     - 擴充工具呼叫詞群：加入 `tool-use`、`tool use`、`函式調用`、`函數呼叫`；
     - 新增容災詞群：`['failover', 'fail-over', '故障轉移', '容災', '備援切換']`；
     - 保持 100% 互映對稱映射。
4. `tests/search.test.cjs`：新增 17 組檢索回歸斷言，驗證 planning/task planning/任務規劃/規劃、reproducibility/reproducible/reproduce/可重現/重現性、citation/citations/引用、tool use/函式調用/函數呼叫、failover/故障轉移/容災等查詢均能準確命中。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：針對已標註之 46 組候選重複來源叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤。

## 2026-10-19：擴充驗收標準／平行處理／移交／防護欄／優雅降級／排程器檢索品質與同義詞對稱對映

問題調查與證據：
1. 核心 AI Agent 方法論「驗收標準（Acceptance Criteria）」檢索斷層：
   - 「驗收」為本庫出現頻率最高的首要核心標籤（全庫 123 筆案例標記「驗收」，301 筆條目包含驗收討論與驗收規範）；
   - 但搜尋英文「acceptance」僅命中 2 筆，搜尋「acceptance criteria」、「acceptance test」命中 0 筆；
   - 搜尋繁中複合詞「驗收標準」僅命中 2 筆，「驗收條件」僅命中 7 筆，「驗收規範」命中 0 筆；
   - 主因為 `assets/app.js` 原同義詞群 `SYNONYM_GROUPS` 完全缺少驗收詞群，分詞函數亦未將 acceptance 複合片語標準化。
2. 平行與並發（Parallelism / Concurrency）繁簡台港語彙斷層：
   - 繁體中文慣用詞「平行」（例如平行處理、平行代理、平行執行）搜尋僅命中 3 筆，而「並行」、「並發」、「concurrency」、「parallel」命中 7 筆，「parallelism」命中 0 筆。
3. 職責交接與移交（Handoff）：
   - 公文與企劃常用詞「移交」僅命中 1 筆，而「交接」、「handoff」命中 86 筆。
4. 防護欄與安全機制（Guardrails / Safety Rails）：
   - 搜尋「防護欄」命中 0 筆，英文「safety rail」命中 0 筆；原同義詞群僅有「護欄」與「安全護欄」。
5. 優雅降級（Graceful Degradation / Fallback）：
   - 搜尋「優雅降級」命中 0 筆，「graceful degradation」命中 0 筆，而「降級」、「fallback」命中 6 筆。
6. 排程器、快取複數、異常檢測、審查與評估詞形標準化：
   - 搜尋「scheduler」、「排程器」命中 0～1 筆，而「schedule」、「排程」命中 147 筆；
   - 搜尋「caches」命中 0 筆，而「cache」命中 26 筆；
   - 搜尋「異常檢測」、「anomaly detection」命中 0 筆，而「異常」命中 35 筆；
   - 搜尋「reviewing」、「reviewer」命中 0～2 筆，而「review」、「審查」命中 126 筆；
   - 搜尋「benchmarking」、「evaluating」命中 0 筆，而「benchmark」、「evaluation」、「評估」命中 57 筆。

本輪改善：
1. `assets/app.js` 分詞函數 `tokenize` 新增多詞與詞形標準化正則：
   - `\bacceptance\s*[- ]\s*(?:criteri(?:a|on)|tests?|testing)?\b` → `acceptance`
   - `\bacceptances?\b` → `acceptance`
   - `\bparallel(?:ism)?\b` → `parallel`
   - `\bconcurr(?:ency|ent)\b` → `concurrency`
   - `\bgraceful\s*[- ]\s*degradations?\b` → `fallback`
   - `\bcach(?:e|es|ed|ing)\b` → `cache`
   - `\bschedul(?:e|es|ed|ing|er|ers)\b` → `schedule`
   - `\banomaly\s*[- ]\s*detections?\b` → `anomaly`
   - `\breview(?:s|ed|ing|er|ers)?\b` → `review`
   - `\bbenchmark(?:ing|s)?\b` → `benchmark`
   - `\bevaluat(?:e|es|ed|ing|ion|ions)\b` → `evaluation`
   - `\bsafety\s*[- ]\s*rails?\b` → `guardrail`
2. `assets/app.js` 同義詞群 `SYNONYM_GROUPS` 擴充與新增：
   - 新增驗收標準詞群：`['acceptance', 'acceptance-criteria', 'acceptance-test', '驗收', '驗收標準', '驗收條件', '驗收測試', '驗收規範']`；
   - 擴充平行／並發詞群：加入 `'平行'`, `'parallelism'`；
   - 擴充交接詞群：加入 `'移交'`；
   - 擴充護欄詞群：加入 `'防護欄'`, `'防護網'`, `'安全防護欄'`；
   - 擴充降級詞群：加入 `'優雅降級'`, `'平滑降級'`；
   - 擴充快取詞群：加入 `'caches'`；
   - 擴充排程詞群：加入 `'scheduler'`, `'schedulers'`, `'排程器'`, `'定時器'`；
   - 擴充異常詞群：加入 `'異常檢測'`, `'異常排查'`；
   - 擴充審查詞群：加入 `'reviewing'`, `'reviewer'`, `'reviewers'`；
   - 維持 100% 互映與自反對稱對映（Symmetry check complete）。
3. `tests/search.test.cjs`：
   - 新增 19 組檢索回歸斷言，驗證 acceptance/acceptance criteria/acceptance test/驗收/驗收標準/驗收條件、parallelism/平行/並行、移交/handoff、防護欄/safety rail/guardrail、優雅降級/graceful degradation、caches、scheduler/排程器、異常檢測/anomaly detection、reviewing/reviewer、benchmarking/evaluating 等查詢均能準確命中。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（339 筆條目全文與擴充檢索，acceptance 與驗收標準命中躍升至 301 筆，平行升至 10 筆，移交升至 86 筆，優雅降級升至 6 筆，排程器升至 147 筆，異常檢測升至 35 筆）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總案例數維持 339 筆，嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：針對已標註之 46 組候選重複來源叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤。

## 2026-10-19：擴充著色頁／印表機列印／道路救援／代理停滯／學業成績／電視看板／上下文視窗檢索品質與同義詞對稱對映

問題調查與證據：
1. PR #53 合併新增案例（UC-342 著色頁排程列印、UC-343 國外拋錨道路救援、UC-344 代理卡住 webhook 通知、UC-345 電視待機看板成績與缺交作業）後，跨語言與同義詞檢索出現顯著斷層：
   - 「著色頁／線稿」（UC-342）：「著色」命中 1 筆、「著色頁」命中 1 筆、「線稿」命中 1 筆，但搜尋英文「coloring」、「coloring page」命中 0 筆，「塗色」命中 0 筆。
   - 「印表機／列印」（UC-342、UC-104、UC-175 等全庫 14 筆列印案例）：「列印」命中 14 筆、「印表機」命中 6 筆，但搜尋英文常用詞「printer」、「printers」命中 0 筆，「printing」僅命中 1 筆，「print」僅命中 3 筆。
   - 「道路救援／拋錨」（UC-343）：「拋錨」命中 1 筆、「道路救援」命中 1 筆，但搜尋英文「breakdown」、「roadside」、「roadside assistance」命中 0 筆。
   - 「代理卡住／停滯」（UC-344）：「卡住」命中 15 筆、「停滯」命中 3 筆，但搜尋英文「stalled」命中 0 筆，「stall」僅命中 1 筆，「hang」命中 0 筆，繁中「停擺」命中 0 筆。
   - 「成績與缺交作業」（UC-345）：「成績」命中 12 筆、「作業」命中 18 筆，但搜尋英文「grades」、「homework」、「assignment」、「assignments」命中 0 筆。
   - 「智慧電視／常亮看板」（UC-345）：「電視」命中 3 筆，但搜尋英文「smart tv」、「ambient display」命中 0 筆。
2. 繁體中文與台灣／香港常用術語檢索斷層：
   - 「向量搜尋」：`SYNONYM_GROUPS` 僅收錄「向量檢索」，搜尋台灣最常用詞「向量搜尋」與「向量搜索」命中 0 筆。
   - 「上下文視窗」：`SYNONYM_GROUPS` 僅收錄簡中「上下文窗口」，搜尋台灣慣用語「上下文視窗」與「脈絡視窗」命中 0 筆。
   - 「探活」：SRE 與 Agent 探活術語「探活」命中 0 筆，而「liveness」命中 12 筆、「heartbeat」命中 2 筆。
   - 「提示詞攻擊／注入攻擊」：搜尋「注入攻擊」、「提示詞攻擊」命中 0 筆，而「prompt injection」命中 4 筆。
   - 「agentic」：搜尋「agentic」僅命中 4 筆，而「agent」命中 216 筆。

本輪改善：
1. `assets/app.js` 分詞函數 `tokenize` 新增多詞與詞形標準化正則：
   - `\bcolor(?:ing)?\s*[- ]\s*pages?\b` → `coloring`
   - `\bprint(?:er|ers|ing|s)?\b` → `print`
   - `\broad\s*[- ]?\s*side(?:\s*[- ]\s*assistance)?\b` → `roadside`
   - `\bbreak\s*[- ]?\s*downs?\b` → `breakdown`
   - `\bstall(?:s|ed|ing)?\b` → `stall`
   - `\bgrades?\b` → `grade`
   - `\bhome\s*[- ]?\s*works?\b` → `homework`
   - `\bassign(?:ment|ments)?\b` → `assignment`
   - `\bsmart\s*[- ]\s*tvs?\b` → `tv`
   - `\bambient(?:\s*[- ]\s*(?:boards?|displays?))?\b` → `ambient`
   - `\bprompt\s*[- ]\s*attacks?\b` → `prompt-injection`
2. `assets/app.js` 同義詞群 `SYNONYM_GROUPS` 擴充與新增：
   - 新增著色／線稿詞群：`['coloring', 'coloring-page', '著色', '著色頁', '線稿', '塗色', '塗色頁', '填色']`
   - 新增列印／印表機詞群：`['print', 'prints', 'printer', 'printers', 'printing', '列印', '印表機', '印刷', '印製']`
   - 新增道路救援／拋錨詞群：`['breakdown', 'breakdowns', 'roadside', 'roadside-assistance', 'roadside assistance', '拋錨', '道路救援', '故障救援', '車輛救援']`
   - 新增停滯／卡住詞群：`['stall', 'stalls', 'stalled', 'stalling', 'hang', 'hanging', '卡住', '停滯', '停擺', '卡死']`
   - 新增成績詞群：`['grade', 'grades', 'grading', '成績', '等第', '分數']`
   - 新增作業／課業詞群：`['homework', 'assignment', 'assignments', '作業', '功課', '缺交作業', '課業']`
   - 新增電視詞群：`['tv', 'tvs', 'television', '電視', '智慧電視', '智能電視', 'android tv', 'smart tv', 'smart-tv']`
   - 新增常亮看板詞群：`['ambient', 'ambient-board', 'ambient-display', '待機畫面', '常亮看板', '待機螢幕']`
   - 擴充 RAG 向量詞群：加入 `'向量搜尋'`, `'向量搜索'`
   - 擴充 Context Window 詞群：加入 `'上下文視窗'`, `'脈絡視窗'`
   - 擴充 Heartbeat 詞群：加入 `'探活'`
   - 擴充 Prompt Injection 詞群：加入 `'提示詞攻擊'`, `'注入攻擊'`
   - 擴充 Agent 詞群：加入 `'agentic'`
   - 維持 1,584 鍵 100% 互映與自反對稱對映（Symmetry check complete，0 asymmetries）。
3. `tests/search.test.cjs`：
   - 新增 33 組檢索回歸斷言，驗證 coloring/coloring page/著色頁/塗色、printer/printers/printing/列印、breakdown/roadside/roadside assistance/道路救援/拋錨、stalled/stall/卡住/停滯、grades/homework/assignment/成績/缺交作業、smart tv/ambient display/待機畫面、向量搜尋/向量搜索、上下文視窗/脈絡視窗、探活、注入攻擊/提示詞攻擊、agentic 等查詢均能準確命中對應案例。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（343 筆條目全文與擴充檢索全數驗證通過，printer 命中躍升至 15 筆，coloring 升至 2 筆，breakdown/roadside 升至 1 筆，stalled 升至 27 筆，grades 升至 22 筆，向量搜尋升至 19 筆，上下文視窗升至 1 筆，agentic 升至 216 筆）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總條目數維持 343 筆（337 案例、3 經驗補充、3 待查項目），嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：評估在候選重複來源叢集測試中，擴充針對 PR #53 新增案例之來源 URL 模式與潛在重複叢集檢查。

## 2026-10-19：擴充訂位預約／反思與自我修正／著色本／拖吊救援／常亮螢幕／作業倒裝／Token用量檢索品質與同義詞對稱對映

問題調查與證據：
1. 訂位與預約（Reservation / Booking）搜尋斷層與詞彙斷裂：
   - UC-072 新增版本 E（Brian Roemmele 的 ClawCall 電話餐廳訂位 Bot 模板，以及全庫既有 15 筆預約／訂位案例）：
   - 搜尋「餐廳訂位」命中 0 筆、「預約餐廳」命中 0 筆、「訂位電話」命中 0 筆；
   - 搜尋英文複數「reservations」命中 0 筆、「bookings」命中 0 筆；
   - 「預約」（15 筆）與「訂位」（4 筆）同義詞完全沒有打通，使用者搜尋「預約」無法檢索到 UC-072 訂位案例。
2. AI Agent 核心架構方法論「反思與自我修正／修復（Reflection / Self-Correction / Self-Healing）」搜尋完全空白：
   - 搜尋「reflection」、「reflections」、「self-reflection」、「self-correction」、「self-healing」命中 0 筆；
   - 搜尋繁中「自我修正」、「自我反思」、「自我修復」、「自我反省」、「自我檢查」命中 0 筆；
   - 庫中 UC-325（每日反思紀錄）、UC-018（隔離展示修復）、UC-068（Mac mini 斷線自愈排障）、UC-096、P-003（AI 自我檢查修好）等案例無法透過標準術語檢索。
3. PR #53 新增案例日常用語與複合詞搜尋斷層：
   - 「著色本／塗色本／填色本／著色畫／圖畫紙」（UC-342）：家長最常用詞「著色本」、「塗色本」、「填色本」、「著色畫」全部命中 0 筆，英文「coloring book」、「coloring sheet」命中 0 筆。
   - 「拖吊／拖車／車輛拋錨／道路支援」（UC-343）：搜尋「車輛拋錨」、「汽車拋錨」、「道路支援」、「towing」、「tow truck」命中 0 筆，「拖吊」、「拖車」與「道路救援／拋錨」未形成同義詞映射。
   - 「常亮螢幕／常亮顯示／常亮」（UC-345）：搜尋「常亮螢幕」、「常亮顯示」、「常亮」命中 0 筆（僅「常亮看板」命中 1 筆）。
   - 「作業缺交／成績看板／學業成績」（UC-345）：搜尋中文倒裝詞「作業缺交」命中 0 筆（僅「缺交作業」命中）；搜尋「學業成績」、「成績看板」命中 0 筆。
   - 「Token用量與消耗」（UC-066 等）：搜尋「token用量」命中 0 筆，「token消耗」命中 0 筆。

本輪改善：
1. `assets/app.js` 分詞函數 `tokenize` 新增多詞與詞形標準化正則：
   - `\breservations?\b` → `reservation`
   - `\bbookings?\b` → `booking`
   - `\bcolor(?:ing)?\s*[- ]\s*(?:books?|sheets?)\b` → `coloring`
   - `\btow(?:ing)?(?:\s*[- ]\s*trucks?)?\b` → `towing`
   - `\bself\s*[- ]\s*reflect(?:ion|ive)?\b` → `reflection`
   - `\breflections?\b` → `reflection`
   - `\bself\s*[- ]\s*(?:correct(?:ion|ing|s)?|heal(?:ing|s)?)\b` → `self-correction`
   - `\btoken\s*(?:用量|消耗)\b` → `token 用量`
2. `assets/app.js` 同義詞群 `SYNONYM_GROUPS` 擴充與新增：
   - 新增訂位／預約詞群：`['reservation', 'reservations', 'booking', 'bookings', '訂位', '預約', '餐廳訂位', '預約餐廳', '電話訂位', '訂位電話', '代訂', '訂席']`
   - 新增反思詞群：`['reflection', 'reflections', 'self-reflection', '反思', '自我反思', '自我反省', '反思機制']`
   - 新增自我修正／修復詞群：`['self-correction', 'self-healing', '自我修正', '自我修復', '自我修復機制', '自動修復', '自我檢查']`
   - 擴充著色詞群：加入 `'coloring-book'`, `'coloring book'`, `'coloring sheet'`, `'coloring sheets'`, `'著色本'`, `'著色畫'`, `'塗色本'`, `'填色本'`, `'兒童著色'`
   - 擴充道路救援詞群：加入 `'towing'`, `'tow truck'`, `'拖吊'`, `'拖車'`, `'車輛拋錨'`, `'汽車拋錨'`, `'道路支援'`
   - 擴充常亮看板詞群：加入 `'常亮'`, `'常亮螢幕'`, `'常亮顯示'`
   - 擴充作業詞群：加入 `'作業缺交'`（解決中文倒裝搜尋）
   - 擴充成績詞群：加入 `'學業成績'`, `'成績看板'`
   - 擴充用量詞群：加入 `'token用量'`, `'token消耗'`, `'額度消耗'`
   - 維持 1,635 鍵 100% 互映與自反對稱對映（Symmetry check complete，0 asymmetries）。
3. `tests/search.test.cjs`：
   - 新增 32 組檢索回歸斷言，驗證 reservations/bookings/餐廳訂位/預約餐廳/電話訂位、reflection/self-reflection/反思/自我反思、self-correction/self-healing/自我修正/自我修復、coloring book/著色本/塗色本/填色本/著色畫、towing/tow truck/拖吊/拖車/車輛拋錨/汽車拋錨/道路支援、常亮螢幕/常亮顯示/常亮、作業缺交/學業成績/成績看板、token用量/token消耗/額度消耗等查詢均能準確命中對應案例。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（343 筆條目全文與擴充檢索全數驗證通過，reservations/訂位/預約命中躍升至 19 筆，reflection 升至 1 筆，self-correction 升至 2 筆，coloring book/著色本升至 2 筆，towing/拖車/車輛拋錨升至 2 筆，常亮螢幕升至 1 筆，作業缺交升至 19 筆，學業成績升至 22 筆，token用量升至 165 筆）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總條目數維持 343 筆（337 案例、3 經驗補充、3 待查項目），嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：針對已識別之 46 組候選重複來源叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤，供讀者橫向比對同源案例。

## 2026-10-19：擴充代理喚醒／程式代理／租車與車險／線上聊天議價／開源工具與複合詞分詞檢索品質

問題調查與證據：
1. 「叫醒」與「喚醒」及英文「wake up / wakeup」檢索斷層：
   - 最新收錄之 UC-344 使用「webhook 叫醒 Grok Bot 跟進」，UC-074 使用「webhook喚醒」，UC-066 使用「週喚醒」；
   - 搜尋「叫醒」僅命中 2 筆（不含 UC-074），「wake up」、「wakeup」、「wake-up」均命中 0 筆；「叫醒」與「喚醒」未互通。
2. 「程式代理」與「代碼代理」及英文「coding agent / coding-agent / claudecode / t3-code / t3code」：
   - 搜尋繁簡「代碼代理」命中 0 筆（僅「程式代理」命中 11 筆）；
   - 搜尋「coding-agent」僅命中 2 筆，與「coding agent」（92 筆）脫節；
   - 搜尋「claudecode」緊湊寫法命中 0 筆（「claude code」命中 22 筆）；
   - 搜尋「t3-code」或「t3code」命中 0 筆（「t3 code」命中 1 筆）。
3. 國外租車、車輛拋錨與保險表單（UC-343）：
   - 搜尋「car rental」、「rental car」、「租賃車」命中 0 筆（僅「租車」命中 1 筆）；
   - 搜尋「保險表單」、「救援表單」命中 0 筆。
4. 線上聊天議價、客服議價與訂位預約倒裝詞（UC-028, UC-072）：
   - 搜尋「聊天議價」、「chat negotiation」、「線上議價」命中 0 筆（僅「客服議價」命中 1 筆）；
   - 搜尋「餐廳預約」、「電話預約」命中 0 筆（而「預約餐廳」、「餐廳訂位」、「電話訂位」命中 19 筆）。
5. 自動列印／打印與開源專案（UC-342, UC-344, UC-345）：
   - 搜尋「自動打印」、「autoprint」、「auto-print」命中 0 筆；
   - 搜尋「open-source」命中 0 筆（僅「open source」命中 1 筆）；
   - 搜尋「開源程式」、「開源工具」、「開源專案」命中 0 筆（僅「開源」命中 13 筆）。
6. 中英相鄰無空格複合詞分詞斷裂：
   - 使用者輸入「webhook通知」、「tv看板」、「電視看板」、「bot模板」、「mcp伺服器」、「mcp servers」等詞時，因英數與中文字符緊鄰未空格，分詞為單一 token 導致命中 0 筆。

本輪改善：
1. `assets/app.js` 分詞函數 `tokenize` 新增多詞與詞形標準化正則：
   - `\bwebhook\s*通知` → `webhook 通知`
   - `\btv\s*看板` → `tv 看板`
   - `電視\s*看板` → `電視 看板`
   - `\bmcp\s*(?:伺服器|服務器)` → `mcp 伺服器`
   - `\bmcp\s*工具` → `mcp 工具`
   - `\bbot\s*模板` → `bot 模板`
   - `\bbot\s*通知` → `bot 通知`
   - `\bapi\s*金鑰` → `api 金鑰`
   - `保險\s*表單` → `保險 表單`
   - `救援\s*表單` → `救援 表單`
   - `\bwake\s*[- ]\s*ups?\b`, `\bwakeups?\b` → `wakeup`
   - `\bclaudecodes?\b` → `claude code`
   - `\bt3\s*[- ]\s*codes?\b`, `\bt3codes?\b` → `t3 code`
   - `\bcoding\s*[- ]\s*agents?\b` → `coding-agent`
   - `\b(?:car\s*[- ]\s*rentals?|rental\s*[- ]\s*cars?)\b` → `car-rental`
   - `\binsurance\s*[- ]\s*claims?\b` → `insurance-claim`
   - `\b(?:auto|car)\s*[- ]\s*insurances?\b` → `car-insurance`
   - `\bauto\s*[- ]\s*prints?\b`, `\bautoprints?\b` → `auto-print`
   - `\bopen\s*[- ]\s*sources?\b` → `open-source`
   - `\bchat\s*[- ]\s*negotiations?\b` → `chat-negotiation`
   - `\bmcp\s*[- ]\s*servers?\b` → `mcp server`
2. `assets/app.js` 同義詞群 `SYNONYM_GROUPS` 擴充與新增：
   - 擴充列印詞群：加入 `'auto-print', 'auto print', 'autoprint', '自動列印', '自動打印'`
   - 擴充訂位／預約詞群：加入 `'餐廳預約', '電話預約'`
   - 新增喚醒／叫醒詞群：`['wakeup', 'wake-up', 'wake up', '喚醒', '叫醒', '主動叫醒', '叫醒bot', '喚醒bot']`
   - 新增程式代理詞群：`['coding-agent', 'coding agent', 'coding agents', '程式代理', '代碼代理', '編程代理']`
   - 新增租車詞群：`['car-rental', 'car rental', 'rental car', 'rental-car', '租車', '租賃車', '自駕租車']`
   - 新增保險理賠詞群：`['insurance-claim', 'insurance claim', 'insurance claims', '保險理賠', '理賠', '理賠申請', '保險索賠']`
   - 新增車險詞群：`['car-insurance', 'car insurance', 'auto insurance', '車險', '車輛保險', '汽車保險']`
   - 新增議價談判詞群：`['chat-negotiation', 'chat negotiation', 'negotiation', 'negotiations', '議價', '聊天議價', '客服議價', '線上議價', '談判', '爭取優惠', '降費']`
   - 新增開源專案詞群：`['open-source', 'open source', '開源', '開源專案', '開源程式', '開源工具', '開源原碼', '開源小程式']`
   - 新增主機伺服器詞群：`['server', 'servers', '伺服器', '服務器', '主機']`
   - 維持 1,700 鍵 100% 互映與自反對稱對映（Symmetry check complete，0 asymmetries）。
3. `tests/search.test.cjs`：
   - 新增 32 組檢索回歸斷言，驗證叫醒／喚醒／wake up／wakeup、coding agent／coding-agent／代碼代理／claudecode／t3-code／t3code、car rental／rental car／租賃車、保險表單／救援表單、聊天議價／chat negotiation／線上議價、餐廳預約／電話預約、自動打印／autoprint／auto-print、open-source／開源工具／開源專案、webhook通知／tv看板／電視看板／bot模板／mcp伺服器／mcp servers 等查詢均能準確命中對應案例。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（343 筆條目全文與擴充檢索全數驗證通過，叫醒／喚醒命中 12 筆，coding-agent 命中 14 筆，car-rental 命中 1 筆，保險表單命中 6 筆，救援表單命中 2 筆，聊天議價命中 8 筆，自動打印／列印命中 15 筆，open-source 命中 8 筆，webhook通知命中 6 筆，tv看板／電視看板命中 2 筆，bot模板命中 47 筆，mcp伺服器／mcp servers 命中 7 筆）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總條目數維持 343 筆（337 案例、3 經驗補充、3 待查項目），嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：針對已識別之 46 組候選重複來源叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤，供讀者橫向比對同源案例。

## 2026-10-19：擴充航空追蹤／德國高速公路救援／電視裝置／Cloudflare Worker／工作階段與司機工時分詞檢索品質

問題調查與證據：
1. SDR ADS-B 航空追蹤與民航機追蹤（UC-334）檢索斷層：
   - 搜尋「adsb」命中 0 筆（僅帶連字號「ads-b」命中 1 筆）；
   - 搜尋「飛機追蹤」、「航班追蹤」、「航空追蹤」、「航機追蹤」均命中 0 筆，與 UC-334（SDR 接收 1090MHz ADS-B 訊號解碼民航機位置）脫節。
2. 德國高速公路救援、德文與 Autobahn（UC-343, UC-119, UC-125 等）檢索斷層：
   - 搜尋「germany」命中 0 筆（僅「德國」命中 1 筆 UC-343）；
   - 搜尋「german」命中 0 筆（僅「德文」命中 6 筆）；
   - 搜尋「autobahn」命中 0 筆（UC-343 即為德國高速公路車輛故障）；
   - 搜尋「公路救援」命中 0 筆（僅「道路救援」命中 2 筆）。
3. Android TV / Google TV / Smart TV 複合詞分詞斷裂（UC-345）：
   - 搜尋緊湊寫法「android-tv」或「google-tv」命中 0 筆（而「android tv」命中 1 筆）；
   - 搜尋「television」命中 0 筆。
4. Cloudflare Worker 寫法與連字號（UC-345, UC-239, UC-323）：
   - 搜尋「cloudflare-worker」或「cloudflare-workers」命中 0 筆（「cloudflare worker」空格寫法命中 3 筆）；
   - 搜尋「cf worker」或「cf-worker」命中 0 筆。
5. 程式代理「工作階段」與英文「session」互通脫節（UC-344, UC-005, UC-067 等）：
   - UC-344 核心使用「程式代理工作階段結束、卡住或需要人時」，但搜尋「session」未能互通「工作階段」；搜尋「工作階段」無法擴充至其他 110 筆包含「session / 會話 / 對話」的案例。
6. 總指揮／指揮官與 Supervisor / Orchestrator（UC-344, UC-005 等）：
   - UC-344 說明「在 T3 Code 裡讓 Grok Bot 當 Claude 與 Codex 代理之上的『總指揮』」；搜尋「總指揮」、「指揮官」、「指揮代理」未能與「orchestrator / supervisor / 統籌 / 協調」互通。
7. 卡車司機工時紀錄與薪資單核對（UC-338）相鄰中文未空格分詞：
   - 搜尋「駕駛工時」、「司機工時」、「工時核對」命中 0 筆，因未分詞導致無法命中 UC-338。
8. 已封存任務狀態矛盾（UC-341）倒裝詞檢索：
   - 搜尋「任務封存」命中 0 筆（僅「封存任務」命中 1 筆）。
9. 開源組件／套件／庫與開源元件（UC-344, UC-345）：
   - 搜尋「開源組件」命中 0 筆（「開源元件」命中 1 筆）。
10. 連字號漏溢導致懸垂連字號 Token（例如 `idempotency-key` 產生 `['-key']`）：
    - `tokenize` 在進行英文詞幹替換時，緊隨連字號留下未清理的孤立連字號；孤立或首尾懸垂連字號應如同孤立點號般清理。

本輪改善：
1. `assets/app.js` 分詞函數 `tokenize` 新增多詞與詞形標準化正則：
   - `\bads\s*[- ]?\s*b\b` → `ads-b`
   - `\bautobahns?\b` → `autobahn`
   - `\b(?:smart|android|google|apple)\s*[- ]\s*tvs?\b` → `tv`
   - `\bandroid-tv\b` → `tv`
   - `\bgoogle-tv\b` → `tv`
   - `\bcloudflare\s*[- ]\s*workers?\b` → `cloudflare-worker`
   - `\bcf\s*[- ]\s*workers?\b` → `cloudflare-worker`
   - `(?:駕駛|司機)\s*工時` → `司機 工時`
   - `工時\s*(?:核對|查核|對帳|稽核)` → `工時 對帳`
   - `(?:出勤|打卡)\s*紀錄` → `打卡 紀錄`
   - `超時\s*(?:工作|工時)` → `超時 工時`
   - `(?:任務|工作)\s*封存` → `任務 封存`
   - `封存\s*(?:任務|工作)` → `封存 任務`
   - `家用\s*印表機` → `家用 印表機`
   - 新增 `replace(/(?:^|\s)-+|-+(?:\s|$)/g, ' ')` 清理懸垂連字號，徹底解決 `idempotency-key` 溢出 `'-key'` 的分詞缺陷。
2. `assets/app.js` 同義詞群 `SYNONYM_GROUPS` 擴充與新增：
   - 擴充編排詞群：加入 `'總指揮', '指揮官', '指揮代理'`
   - 擴充協調監督詞群：加入 `'總監', '主控代理'`
   - 擴充會話詞群：加入 `'工作階段', '工作會話', '作業階段'`
   - 擴充工時紀錄詞群：加入 `'工時核對', '派車單', '出勤紀錄'`
   - 擴充去重與查重詞群：加入 `'同源案例', '同源', '重複來源', '候選重複', '重複候選', '同源叢集'`
   - 擴充道路救援詞群：加入 `'公路救援'`
   - 擴充電視詞群：加入 `'google tv', 'google-tv', 'android-tv'`
   - 擴充開源專案詞群：加入 `'開源組件', '開源元件', '開源套件', '開源庫'`
   - 新增 ADS-B 航空追蹤詞群：`['ads-b', 'adsb', 'ads b', '航空追蹤', '航班追蹤', '飛機追蹤', '廣播式自動相關監視', '航機追蹤']`
   - 新增德國與德文詞群：`['german', 'germany', '德國', '德文', '德語']`
   - 新增高速公路詞群：`['highway', 'highways', 'freeway', 'freeways', 'expressway', 'expressways', 'autobahn', '高速公路', '公路']`
   - 新增 Cloudflare Worker 詞群：`['cloudflare-worker', 'cloudflare worker', 'cloudflare workers', 'cloudflare-workers', 'cf worker', 'cf workers', 'cf-worker']`
   - 新增司機／駕駛詞群：`['driver', 'drivers', '司機', '駕駛', '駕駛員', '運將', '卡車司機']`
   - 維持 1,761 鍵 100% 互映與自反對稱對映（Symmetry check complete，0 asymmetries）。
3. `tests/search.test.cjs`：
   - 新增 31 組檢索回歸斷言，涵蓋 adsb／ads-b／飛機追蹤／航班追蹤／航空追蹤、germany／german／autobahn／公路救援、android-tv／google-tv／google tv、cloudflare-worker／cloudflare-workers／cf worker、工作階段／工作會話、總指揮／指揮官／指揮代理、駕駛工時／司機工時／工時核對／派車單、任務封存、開源組件／開源套件、同源案例／候選重複／重複來源，以及 idempotency-key 乾淨分詞斷言。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（343 筆條目全文與擴充檢索全數驗證通過，adsb/ads-b 命中 1 筆，germany/german 命中 6 筆，autobahn/公路救援 命中 2 筆，android-tv/google-tv 命中 6 筆，cloudflare-worker 命中 2 筆，工作階段 命中 113 筆，總指揮 命中 10 筆，駕駛工時 命中 1 筆，任務封存 命中 5 筆，開源組件 命中 8 筆，同源案例 命中 265 筆）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總條目數維持 343 筆（337 案例、3 經驗補充、3 待查項目），嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：針對已識別之 46 組候選重複來源叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤，供讀者橫向比對同源案例。

## 2026-10-19：擴充手持掌上終端／薪資單對帳／換臉／電話代撥／自駕拋錨／帳單抵免與 1090MHz 檢索品質

問題調查與證據：
1. 掌上型與手持終端設備檢索斷層（UC-336）：
   - 搜尋「掌上型」命中 0 筆（原文標題為「掌上型圓屏裝置」）；
   - 搜尋「手持終端」、「掌上終端」、「手持裝置」、「掌上電腦」均命中 0 筆；
   - 搜尋英文「handheld」命中 0 筆。
2. 司機工時紀錄與薪資單核對（UC-338）相鄰複合詞分詞斷裂：
   - 搜尋「薪資單核對」、「工資單核對」、「薪資單對帳」、「薪水核對」、「工時核算」均命中 0 筆，因未分詞導致產生單一 Token 無法匹配 UC-338 內文。
3. 幼兒著色頁自動列印（UC-342）分詞斷裂：
   - 搜尋「幼兒著色」、「幼童著色」、「著色線稿」、「著色圖」、「每日著色」命中 0 筆。
4. 每日參考照換臉（UC-337）與 face-swap 同義互通脫節：
   - 搜尋「人臉替換」、「面部替換」、「臉部替換」、「照片換臉」、「每日換臉」均命中 0 筆；
   - 搜尋英文「face-swap」命中 0 筆。
5. 電話代撥與語音代理（UC-072）倒裝詞分詞斷裂：
   - 搜尋「電話代撥」、「代撥電話」、「電話代打」均命中 0 筆（僅「代打電話」命中 2 筆）。
6. 國外與自駕車輛故障拋錨（UC-343）複合詞未分詞：
   - 搜尋「國外拋錨」、「海外拋錨」、「自駕拋錨」、「租車拋錨」均命中 0 筆。
7. 帳單漲價爭取抵免（UC-028）複合詞未分詞：
   - 搜尋「帳單抵免」、「爭取抵免」、「費用抵免」均命中 0 筆。
8. 1090 MHz ADS-B 解碼與民航機追蹤（UC-334）緊湊寫法與航空監視：
   - 搜尋緊湊寫法「1090mhz」命中 0 筆（原文帶空格「1090 MHz」）；
   - 搜尋「民航機追蹤」、「航空監視」命中 0 筆。
9. 電視待機首頁與去廣告（UC-345）：
   - 搜尋「電視去廣告」、「電視待機」、「自製電視首頁」、「待機首頁」均命中 0 筆。
10. 程式代理 webhook 叫醒與通知（UC-344）：
    - 搜尋「webhook叫醒」、「程式代理通知」均命中 0 筆。

本輪改善：
1. `assets/app.js` 分詞函數 `tokenize` 新增分詞與詞形標準化正則：
   - `\b1090\s*mhz\b` → `1090mhz`
   - `\b1090\s*兆赫\b` → `1090mhz`
   - `\b(?:hand\s*[- ]\s*held|palm\s*[- ]\s*top)s?\b` → `handheld`
   - `\bface\s*[- ]\s*swaps?\b` → `face-swap`
   - `(?:人臉|面部|臉部|照片)\s*替換` → `換臉`
   - `(?:人臉|面部|臉部|照片)\s*換臉` → `換臉`
   - `每日\s*換臉` → `每日 換臉`
   - `(?:薪資|工資|薪水|薪酬)\s*單?\s*(?:核對|查核|對帳|對賬|稽核|核算)` → `薪資單 核對`
   - `工時\s*核算` → `工時 核對`
   - `(?:幼兒|幼童|小童|兒童|孩子)\s*著色(?:頁|本|畫)?` → `兒童著色`
   - `著色\s*(?:線稿|圖|頁|本|畫)` → `著色`
   - `每日\s*著色` → `每日 著色`
   - `(?:電話\s*代撥|代撥\s*電話|電話\s*代打)` → `代打電話`
   - `(?:國外|海外|境外|自駕|租車)\s*(?:拋錨|故障|車輛故障)` → `拋錨`
   - `(?:帳單|帳戶|費用)\s*抵免` → `帳單 抵免`
   - `(?:爭取|降費)\s*抵免` → `抵免`
   - `(?:電視|tv)\s*(?:去廣告|免廣告)` → `電視 去廣告`
   - `(?:電視|tv)\s*待機` → `電視 待機`
   - `(?:自製|客廳)\s*電視\s*首頁` → `自製首頁 電視`
   - `(?:待機|自製)\s*首頁` → `待機 首頁`
   - `webhook\s*(?:叫醒|喚醒)` → `webhook 叫醒`
   - `程式代理\s*通知` → `程式代理 通知`
2. `assets/app.js` 同義詞群 `SYNONYM_GROUPS` 擴充與新增：
   - 擴充 ADS-B 航空追蹤詞群：加入 `'1090mhz', '1090 mhz', '民航機追蹤', '航空監視'`
   - 新增手持設備詞群：`['handheld', 'handhelds', 'palmtop', 'palmtops', '掌上型', '掌上裝置', '手持裝置', '手持終端', '掌上終端', '掌上電腦', '隨身裝置', '隨身終端']`
   - 新增換臉／面部替換詞群：`['face-swap', 'face swap', 'faceswap', '換臉', '人臉替換', '面部替換', '臉部替換', '照片換臉', '人臉抽換']`
   - 新增帳單抵免詞群：`['credit', 'credits', '抵免', '帳單抵免', '費用抵免', '退費抵免', '帳戶抵免', '減免', '爭取抵免']`
   - 新增電話代撥詞群：`['代打電話', '代撥電話', '電話代撥', '電話代打', '代撥', '電話代理']`
   - 維持 100% 互映與自反對稱對映（Symmetry check complete，0 asymmetries）。
3. `tests/search.test.cjs`：
   - 新增 28 組檢索回歸斷言，涵蓋 handheld／掌上型／手持終端／掌上終端／手持裝置、薪資單核對／工資單核對／薪資單對帳／薪水核對／工時核算、幼兒著色／幼童著色／著色線稿／每日著色、face-swap／人臉替換／面部替換／臉部替換／照片換臉、電話代撥／代撥電話／電話代打、國外拋錨／海外拋錨／自駕拋錨／租車拋錨、帳單抵免／爭取抵免／費用抵免、1090mhz／民航機追蹤／航空監視、電視去廣告／電視待機／自製電視首頁／待機首頁、webhook叫醒／程式代理通知。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（343 筆條目全文與擴充檢索全數驗證通過，handheld/掌上型 命中 2 筆，薪資單核對 命中 7 筆，幼兒著色 命中 2 筆，face-swap/換臉 命中 2 筆，電話代撥 命中 5 筆，國外拋錨 命中 2 筆，帳單抵免 命中 1 筆，1090mhz 命中 1 筆，電視待機 命中 1 筆，webhook叫醒 命中 4 筆）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總條目數維持 343 筆（337 案例、3 經驗補充、3 待查項目），嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：針對已識別之 46 組候選重複來源叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤，供讀者橫向比對同源案例。

## 2026-10-19：擴充程式代理工作階段停滯／SDR接收機／兒童著色／工具回應分存／交辦任務與訂位代理檢索品質

問題調查與證據：
1. 程式代理工作階段停滯與叫醒 Bot 檢索斷層（UC-344）：
   - 搜尋「叫醒Grok Bot」、「叫醒grok」命中 0 筆（因分詞僅切分英文字尾，未將中文字首「叫醒」與英文「grok」拆分）；
   - 搜尋「工作階段停滯」、「工作階段卡住」命中 0 筆（因「工作階段」與「停滯／卡住」複合詞未分詞，無法匹配 UC-344 內文）。
2. 電話訂位與代訂餐廳檢索斷層（UC-072）：
   - 搜尋「代訂餐廳」、「代訂位」、「餐廳代訂」、「訂位代理」均命中 0 筆，同義詞群缺少代訂複合詞。
3. 智慧開關排障與家電導入檢索斷層（UC-330）：
   - 搜尋「智慧開關排障」、「開關排障」、「家電導入」、「未支援設備」均命中 0 筆，因複合詞未分詞導致無法觸發排障與設備同義詞對映。
4. SDR 接收站／接收機／解碼與民航機追蹤（UC-334）：
   - 搜尋緊湊寫法「sdr接收站」、「sdr接收機」、「sdr解碼」均命中 0 筆（sdr 與中文相鄰未分詞）；
   - 搜尋「adsb接收機」命中 0 筆（原文為「接收站」，兩者未建立同義對映）。
5. 幼兒與小孩著色頁（UC-342）：
   - 搜尋「小孩著色」、「小孩著色頁」命中 0 筆（分詞正則包含幼兒／兒童／孩子，漏涵蓋「小孩」；且同義詞群缺乏兒童／小孩詞群）。
6. 工具實際回應分存與模型輸出驗收（UC-340）：
   - 搜尋「工具實際回應」、「工具回應分存」、「分存驗收」、「模型輸出分存」均命中 0 筆（「分存」未分詞且未納入封存/歸檔同義詞群）。
7. 新舊交辦任務時效與重送（UC-339, UC-341）：
   - 搜尋「交辦任務」、「舊交辦任務」、「新交辦任務」均命中 0 筆（「交辦」與「任務」相鄰複合未分詞）。
8. 高速公路車輛故障拋錨（UC-343）：
   - 搜尋「高速公路故障」命中 0 筆。
9. 每日隨機參考照換臉（UC-337）：
   - 搜尋「參考照換臉」、「隨機參考照」命中 0 筆。
10. 掌上型圓屏裝置（UC-336）：
    - 搜尋「掌上型圓屏」、「圓屏裝置」命中 0 筆。
11. 例行排程手動關回與關掉（UC-335）：
    - 搜尋「排程關回」、「排程關掉」命中 0 筆。
12. 任務執行狀態矛盾（UC-341）：
    - 搜尋「執行狀態矛盾」命中 0 筆（原文為「互相矛盾的狀態」，未分詞成獨立 Token「狀態」與「矛盾」）。

本輪改善：
1. `assets/app.js` 分詞函數 `tokenize` 新增分詞與詞形標準化正則：
   - `(?:叫醒|喚醒)\s*grok(?:\s*bot)?` → `叫醒 grok bot`
   - `(?:叫醒|喚醒)\s*bot` → `叫醒 bot`
   - `(?:工作階段|工作會話|作業階段)\s*(?:停滯|卡住|卡死)` → `工作階段 停滯`
   - `(?:代訂|預約)\s*餐廳` → `餐廳訂位`
   - `(?:代訂|代預約)\s*位` → `訂位`
   - `(?:電話|語音)?\s*訂位\s*代理` → `電話訂位`
   - `餐廳\s*代訂` → `餐廳訂位`
   - `(?:智慧|智能)?\s*開關\s*(?:排障|除錯|故障)` → `開關 排障`
   - `(?:家電|設備|裝置)\s*(?:導入|導入排障)` → `設備 導入`
   - `(?:未支援|不支援)\s*(?:設備|裝置|家電|硬體)` → `未支援 設備`
   - `sdr\s*(?:接收站|接收機|接收器)` → `sdr 接收站`
   - `sdr\s*解碼` → `sdr 解碼`
   - `ads-b\s*(?:接收機|接收器)` → `ads-b 接收站`
   - `(?:幼兒|幼童|小童|兒童|孩子|小孩)\s*著色(?:頁|本|畫)?` → `兒童著色`
   - `(?:分存|封存)\s*(?:驗收|查驗)` → `封存 驗收`
   - `(?:實際)?\s*工具\s*(?:實際)?\s*回應` → `工具 回應`
   - `(?:工具回應|模型輸出)\s*分存` → `工具 回應 封存`
   - `模型\s*輸出` → `模型 輸出`
   - `(?:舊|新)?\s*交辦\s*(?:任務|工作)?` → `交辦 任務`
   - `(?:高速公路|公路)\s*(?:拋錨|故障|壞掉)` → `公路 拋錨`
   - `(?:隨機)?\s*參考照\s*換臉` → `參考照 換臉`
   - `隨機\s*參考照` → `隨機 參考照`
   - `(?:排程|例行任務)\s*(?:關掉|關回|停用)` → `排程 關掉`
   - `執行\s*狀態\s*(?:矛盾|不一致|衝突)` → `執行 狀態 矛盾`
   - `狀態\s*(?:矛盾|不一致|衝突)` → `狀態 矛盾`
   - `(?:掌上型|手持)?\s*圓屏(?:\s*裝置)?` → `掌上型 圓屏 裝置`
2. `assets/app.js` 同義詞群 `SYNONYM_GROUPS` 擴充與新增：
   - 擴充封存詞群：加入 `'分存', '分開儲存'`
   - 擴充軟體無線電詞群：加入 `'sdr接收機', 'sdr接收站'`
   - 擴充訂位預約詞群：加入 `'代訂餐廳', '代訂位', '餐廳代訂', '訂位代理', '代訂席'`
   - 擴充 ADS-B 航空追蹤詞群：加入 `'接收站', '接收機'`
   - 新增兒童／孩子詞群：`['kids', 'kid', 'child', 'children', '孩子', '小孩', '幼兒', '幼童', '小童', '兒童']`
   - 維持 1,822 鍵 100% 互映與自反對稱對映（Symmetry check complete，0 asymmetries）。
3. `tests/search.test.cjs`：
   - 新增 28 組檢索回歸斷言，涵蓋 叫醒Grok Bot／叫醒grok、工作階段停滯／工作階段卡住、代訂餐廳／代訂位／餐廳代訂／訂位代理、智慧開關排障／開關排障／家電導入／未支援設備、sdr接收站／sdr接收機／sdr解碼／adsb接收機、小孩著色／小孩著色頁、工具實際回應／工具回應分存／分存驗收／模型輸出分存、交辦任務／舊交辦任務／新交辦任務、高速公路故障、參考照換臉／隨機參考照、掌上型圓屏／圓屏裝置、排程關回／排程關掉，以及 執行狀態矛盾。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（343 筆條目全文與擴充檢索全數驗證通過，叫醒Grok Bot 命中 11 筆，工作階段停滯 命中 14 筆，代訂餐廳 命中 19 筆，開關排障 命中 4 筆，sdr接收站 命中 1 筆，小孩著色 命中 2 筆，工具回應分存 命中 3 筆，交辦任務 命中 14 筆，高速公路故障 命中 1 筆，參考照換臉 命中 2 筆，掌上型圓屏 命中 1 筆，排程關回 命中 6 筆，執行狀態矛盾 命中 28 筆）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總條目數維持 343 筆（337 案例、3 經驗補充、3 待查項目），嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：針對已識別之 46 組候選重複來源叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤，供讀者橫向比對同源案例。

## 2026-10-19：擴充特斯拉充電技能／YouTube留言巡檢／買房篩選／詢問信台帳／主管晨報與雲主機候補檢索品質

問題調查與證據：
1. 特斯拉出發充電與充電技能檢索斷層（UC-346）：
   - 搜尋「特斯拉充電技能」、「出門前充電」、「特斯拉出發充電」均命中 0 筆（因分詞未切分特斯拉／出發／充電之複合詞，且「技能」未獨立切分）。
2. YouTube 兒童頻道留言巡檢與惡意留言審查斷層（UC-347）：
   - 搜尋「youtube留言巡檢」、「小孩頻道留言」、「惡意留言審查」均命中 0 筆（中英文交界 youtube 與留言未拆分，且惡意／留言／審查複合詞未切分）。
3. Zillow 買房篩選與雙關卡房源過濾斷層（UC-348）：
   - 搜尋「zillow買房篩選」、「買房兩關篩選」、「看房篩選房仲」均命中 0 筆（英文品牌 zillow 與中文相鄰未分詞，且買房篩選未建立正規切分）。
4. Dots 官網詢問信台帳與回信草稿斷層（UC-349）：
   - 搜尋「dots官網詢問信」、「詢問信台帳」、「詢問信草稿」均命中 0 筆（中英文 dots 與詢問信相鄰未分詞，台帳／草稿未分詞）。
5. 主管工作日晨報分工與內外部資料分流斷層（UC-350）：
   - 搜尋「主管平日晨報」、「晨報分工」、「內外部資料分工」均命中 0 筆（平日／晨報／分工未分詞，內外部資料分工未對映）。
6. Hetzner 雲主機售完候補與補貨下單斷層（UC-286）：
   - 搜尋「hetzner補貨」、「雲主機補貨」、「售完候補」均命中 0 筆（hetzner 與中文相鄰未切分，售完／補貨／候補未對映）。
7. ClawCall 電話訂位與語音代訂斷層（UC-072）：
   - 搜尋「clawcall電話訂位」、「電話訂位bot」、「語音代訂」均命中 0 筆（clawcall 與電話訂位相鄰未拆分，訂位同義群未覆蓋 clawcall 與語音訂位）。
8. T-Mobile 帳單悄悄漲價與客服抵免／SiriusXM 線上聊天議價斷層（UC-028）：
   - 搜尋「t-mobile漲價」、「t-mobile抵免」、「siriusxm議價」、「線上聊天議價」均命中 0 筆（t-mobile／siriusxm 與中文相鄰未拆分，帳單同義群未納入漲價與調漲，議價同義群未納入線上聊天議價與 siriusxm，且原文含「「線上聊天」議價」引號阻礙比對）。
9. 司機對薪資單與工時算薪水檢索斷層（UC-338）：
   - 搜尋「司機對薪資單」、「月底對薪水」、「工時算薪水」均命中 0 筆（司機與薪資單、工時與薪水相鄰未切分，薪資同義群未涵蓋發薪與發放薪資）。
10. 過期交辦任務重送與逾期待辦檢索斷層（UC-339）：
    - 搜尋「過期任務重送」、「待辦任務過期」、「逾期任務重送」均命中 0 筆（過期／任務／重送未拆分，stale 同義詞群未涵蓋逾期與重送）。
11. 工具呼叫回應隔離分存與模型檢疫斷層（UC-340）：
    - 搜尋「工具呼叫回應隔離」、「回應隔離」均命中 0 筆（隔離詞群未涵蓋回應隔離與檢疫，分詞未切分回應與隔離）。
12. 封存任務狀態矛盾與恢復斷層（UC-341）：
    - 搜尋「封存任務衝突」、「封存任務恢復」均命中 0 筆（矛盾詞群未建立獨立對稱同義對映，封存任務衝突未分詞）。
13. 早晨黑白線稿著色列印與城堡獨角獸線稿斷層（UC-342）：
    - 搜尋「每天早上列印」、「黑白線稿列印」、「城堡獨角獸線稿」均命中 0 筆（著色詞群未涵蓋黑白線稿，線稿與著色列印未分詞）。
14. 國外車輛拋錨求援與道路救援表單斷層（UC-343）：
    - 搜尋「國外拋錨求援」、「德文語音聽不懂」、「道路救援申請表」均命中 0 筆（roadside/breakdown 詞群未涵蓋求援與救援表單）。
15. 45分鐘程式代理工作階段停滯與卡住斷層（UC-344）：
    - 搜尋「45分鐘停滯」、「程式代理跑完沒」、「claude code跑完」、「程式代理卡住」均命中 0 筆。
16. 家長抓女兒各科成績與關掉電視廣告斷層（UC-345）：
    - 搜尋「抓女兒成績」、「學校缺交作業」、「關掉電視廣告」均命中 0 筆。
17. 掌上型 ESP 圓形螢幕與語音終端中繼斷層（UC-336）：
    - 搜尋「esp圓形螢幕」、「語音終端中繼」均命中 0 筆（\besp 詞首邊界處理與圓形螢幕切分）。

本輪改善：
1. `assets/app.js` 分詞函數 `tokenize` 新增分詞與詞形標準化正則：
   - 特斯拉長途出發充電技能：`/(?:特斯拉|tesla)\s*(?:長途)?\s*(?:出發)?\s*(?:充電|充飽電)?\s*(?:技能)?/g` → `特斯拉 出發 充電`，`出門前充電` → `出發 充電`
   - YouTube 頻道留言巡檢與惡意留言審查：`youtube 留言 巡檢`、`留言 審查`
   - Zillow 買房兩關卡篩選與房源過濾：`zillow 買房 篩選`、`買房 篩選 房仲`
   - Dots 官網詢問信台帳與回覆草稿：`dots 詢問信`、`詢問信 台帳`、`詢問信 草稿`
   - 主管工作日晨報分工與內外部資料分流：`主管 晨報 分工`、`晨報 分工`
   - Hetzner 雲主機候補與售完補貨：`hetzner 補貨`、`主機 補貨`、`售完 候補`
   - ClawCall 電話訂位與語音代訂：`clawcall 電話訂位`、`電話訂位 bot`、`電話訂位`
   - T-Mobile 漲價抵免與 SiriusXM 聊天議價：`t-mobile 漲價`、`t-mobile 抵免`、`siriusxm 議價`、`聊天 議價`、`帳單 漲價`
   - 司機薪資單核對與工時算薪水：`司機 薪資單 核對`、`薪資 核對`、`工時 薪資`
   - 過期任務重送與逾期待辦：`過期 任務 重送`、`過期 任務`、`重送`
   - 工具呼叫回應隔離分存：`工具 回應 隔離`、`回應 隔離`
   - 封存任務狀態矛盾與衝突：`封存 任務 狀態 矛盾`、`狀態 矛盾`
   - 早晨黑白線稿著色列印：`早上 列印`、`黑白 線稿 著色`、`獨角獸 線稿`
   - 國外車輛拋錨求援與救援表單：`拋錨 救援`、`德文 語言`、`道路救援 救援 表單`、`救援 表單`
   - 程式代理工作階段停滯與結束確認：`45分鐘停滯` → `停滯`、`程式代理 工作階段`、`claude code 工作階段`
   - 成績與電視去廣告：`抓女兒成績` → `成績`、`缺交作業`、`電視 去廣告`
   - 掌上型圓屏與語音終端中繼：`\besp 圓形 螢幕`（保留 \besp 詞首邊界避免誤傷 response）、`語音 終端 中繼`
2. `assets/app.js` 同義詞群 `SYNONYM_GROUPS` 擴充與新增：
   - 新增矛盾衝突對稱詞群：`['矛盾', '衝突', '不一致', 'contradiction', 'contradictions', 'conflict', 'conflicts', 'inconsistent', 'inconsistency']`
   - 擴充帳單詞群：加入 `'漲價', '調高帳單', '調漲', 't-mobile'`
   - 擴充薪資詞群：加入 `'發薪', '薪資發放', '發放薪資'`
   - 擴充過期 stale 詞群：加入 `'逾期', '逾期任務', '過期任務', '失效任務', '重送'`
   - 擴充隔離 isolation 詞群：加入 `'回應隔離', '隔離分存', '檢疫'`
   - 擴充著色 coloring 詞群：加入 `'黑白線稿', '線稿著色', '著色線稿'`
   - 擴充道路救援 breakdown 詞群：加入 `'求援', '求助', '救援申請', '救援申請表', '救援表單'`
   - 擴充成績 grade 詞群：加入 `'抓成績', '學業追蹤'`
   - 擴充訂位 reservation 詞群：加入 `'clawcall', '語音訂位', '語音預約', '訂位bot'`
   - 擴充議價 negotiation 詞群：加入 `'線上聊天議價', '協商降費', '降費協商', 'siriusxm'`
   - 維持全部同義詞條目 100% 互映與自反對稱對映。
3. `tests/search.test.cjs`：
   - 新增 56 組真實查詢回歸斷言，全數涵蓋 UC-346 至 UC-350 新增案例及 UC-286、UC-072、UC-028、UC-336、UC-338~345 等關鍵案例之自然語言複合查詢。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（348 筆條目全文與擴充檢索全數驗證通過，56 組測試全數由原本的 0 筆命中轉為精確命中目標案例）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總條目數維持 348 筆（342 案例、3 經驗補充、3 待查項目），嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：評估在 `sources/qualification-audit-2026-10-16.md` 與首頁中對新收錄之 UC-346 至 UC-350 進行嚴格合格性審核核對，並檢查是否有新的待審核真實案例來源。

## 2026-10-19：修正 Teslascope 邊界截斷、擴充小孩留言審查／通勤學區篩選／詢問預約／早晨著色與道路救援檢索品質

問題調查與證據：
1. Teslascope 英文詞首未設邊界導致詞根誤切與排程斷層（UC-346）：
   - 搜尋「teslascope排程」命中 0 筆（因 `/(?:特斯拉|tesla)/` 未設詞邊界，將 `teslascope` 前綴誤替換為 `特斯拉 出發 充電`，遺留 `scope排程` 導致 0 筆命中）。
   - 搜尋「電動車充電排程」、「特斯拉充滿自動還原」命中 0 筆（分詞未切分電動車／充電／排程，且充到滿自動還原未正規化）。
2. YouTube 留言怪人審查與小孩頻道留言檢查斷層（UC-347）：
   - 搜尋「檢查小孩留言」、「youtube怪人留言」命中 0 筆（檢查與小孩留言相鄰未切分，且怪人未納入可疑留言審查詞根）。
3. 買房尖峰通勤時間與學區篩選／交屋整修費用斷層（UC-348）：
   - 搜尋「買房通勤時間」、「買房學區篩選」、「交屋整修費用」均命中 0 筆（買房與通勤時間、學區篩選複合詞未切分，交屋整修未對映費用詞群）。
4. Dots 日曆找空檔與客戶來信約時間斷層（UC-349）：
   - 搜尋「dots日曆找空檔」、「客戶來信約時間」均命中 0 筆（dots 與日曆找空檔相鄰未切分，客戶來信與約時間未切分）。
5. 主管平日晨報讀內部信件與 Grok Bot 收公開新聞斷層（UC-350）：
   - 搜尋「dots讀內部信件」、「grok bot收公開新聞」均命中 0 筆（dots 與內部信件相鄰未拆分，grok bot 與收公開新聞中英文邊界未分詞）。
6. 每天早晨自動吐出著色頁與家用印表機著色斷層（UC-342）：
   - 搜尋「每天早上吐出著色頁」、「家裡印表機著色」均命中 0 筆（吐出著色頁未切分，家裡印表機與著色未分詞）。
7. 高速公路車子故障／看不懂德文找救援與海外自駕道路救援／修車表單斷層（UC-343）：
   - 搜尋「高速公路車子故障」、「看不懂德文找救援」、「海外自駕道路救援」、「國外修車表單」均命中 0 筆（高速公路車子故障未正規化為拋錨救援，德文語音聽不懂與求援未分詞，自駕道路救援與修車表單未拆分）。
8. 客廳電視成績看板與看女兒成績斷層（UC-345）：
   - 搜尋「電視看女兒成績」、「客廳電視成績看板」均命中 0 筆（電視看成績與客廳電視成績看板未分詞）。

本輪改善：
1. `assets/app.js` 分詞函數 `tokenize` 新增分詞與詞形標準化正則：
   - Teslascope 專用詞與詞邊界保護：`replace(/\bteslascope\s*(?:排程)?/g, ' teslascope 排程 ')`，並在 `tesla` 加上 `\btesla\b` 避免誤切 `teslascope`。
   - 特斯拉長途出發充滿與自動還原：`replace(/(?:特斯拉|\btesla\b)\s*(?:長途)?\s*(?:出發)?\s*(?:充電|充飽電|充滿|充到滿|滿充)?\s*(?:技能)?\s*(?:自動)?\s*還原/g, ' 特斯拉 出發 充電 自動還原 ')`。
   - 電動車充電排程：`replace(/(?:電動車|電車)\s*(?:充電)?\s*(?:排程)?/g, ' 電動車 充電 排程 ')`。
   - 小孩留言檢查與怪人可疑留言審查：`replace(/(?:檢查|審查|巡檢|看)?\s*(?:小孩|孩子|兒童)\s*(?:頻道)?\s*(?:留言|評論)/g, ' 孩子 留言 審查 ')`、`replace(/(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)\s*留言\s*(?:過濾|巡檢|清理|審查)?/g, ' 留言 審查 ')`。
   - 買房通勤時間、學區篩選與交屋整修費用：`replace(/(?:買房|看房|找房)\s*(?:下班|尖峰)?\s*通勤(?:\s*時間)?/g, ' 買房 通勤時間 ')`、`replace(/(?:買房|看房|找房)\s*學區(?:\s*(?:篩選|過濾))?/g, ' 買房 學區 篩選 ')`、`replace(/(?:交屋)?\s*(?:前後)?\s*(?:整修|修繕|維護)\s*(?:成本|費用|費)/g, ' 整修 費用 ')`。
   - Dots 日曆找空檔與客戶約時間：`replace(/dots\s*(?:日曆|行事曆)\s*(?:找|查)?\s*(?:空檔|候選日)?/g, ' dots 日曆 找空檔 ')`、`replace(/(?:客戶)?\s*(?:來信)?\s*(?:想)?\s*(?:約時間|約會面|約會議)/g, ' 客戶 來信 約時間 ')`。
   - 晨報內部信件與公開新聞收錄：`replace(/dots\s*(?:讀|看)?\s*內部\s*(?:信件|郵件|行程)?/g, ' dots 內部 郵件 ')`、`replace(/(?:grok\s*bot|bot)\s*(?:收|抓|整理)?\s*公開\s*(?:新聞|情報|訊息)?/g, ' grok bot 公開 新聞 ')`。
   - 早上印表機吐出著色頁：`replace(/(?:每天)?\s*早上\s*(?:吐出)?\s*(?:今天的)?\s*著色(?:頁|本|畫)?/g, ' 早上 著色頁 ')`、`replace(/(?:家用|家裡|家中)?\s*印表機\s*(?:著色)?/g, ' 家用 印表機 著色 ')`。
   - 高速公路車輛故障、語言障礙與救援表單：`replace(/(?:高速公路|公路)\s*(?:車子|車輛|汽車)\s*(?:拋錨|故障|壞掉)/g, ' 高速公路 車子 拋錨 ')`、`replace(/(?:看不懂|聽不懂)\s*(?:德文|德語|當地語言|外語)?\s*(?:找)?\s*(?:救援|求助)/g, ' 德文 語言 救援 ')`、`replace(/(?:國外|海外|境外)?\s*(?:自駕)?\s*道路\s*救援/g, ' 道路救援 ')`、`replace(/(?:國外|海外)?\s*(?:修車|車輛救援|保險救援)?\s*(?:申請表|表單)/g, ' 救援 表單 ')`。
   - 電視女兒成績與客廳看板：`replace(/(?:電視|tv)\s*(?:看|查|顯示)?\s*(?:女兒|孩子|小孩|學生)?\s*成績/g, ' 電視 成績 ')`、`replace(/(?:客廳)?\s*(?:電視|tv)\s*成績\s*(?:看板)?/g, ' 電視 成績 看板 ')`。
2. `assets/app.js` 同義詞群 `SYNONYM_GROUPS` 擴充與新增：
   - 擴充備份還原群：加入 `'自動還原', 'auto-revert'`。
   - 新增電動車詞群：`['electric-vehicle', 'electric-vehicles', 'ev', 'evs', '電動車', '電車', 'electric vehicle', 'electric vehicles']`。
   - 新增通勤詞群：`['commute', 'commuting', '通勤', '通勤時間', '上班通勤', '下班通勤', '塞車通勤']`。
   - 新增整修詞群：`['renovation', 'renovations', 'remodel', 'remodeling', '整修', '修繕', '裝修', '翻新', '房屋整修', '整修費用']`。
   - 新增學區詞群：`['school-district', 'school district', '學區', '學校評分', '學區評分']`。
   - 新增揭露詞群：`['disclosure', 'disclosures', '揭露', '揭露文件', '屋況揭露']`。
   - 全部同義詞條目維持 100% 互映與自反對稱對映。
3. `tests/search.test.cjs`：
   - 新增 20 組真實複合查詢回歸斷言，涵蓋 UC-342、UC-343、UC-345、UC-346、UC-347、UC-348、UC-349、UC-350 之各項自然語言長尾查詢。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（348 筆條目全文與擴充檢索全數驗證通過，20 組測試全數由原本的 0 筆命中轉為精確命中目標案例）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總條目數維持 348 筆（342 案例、3 經驗補充、3 待查項目），嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：針對已識別之 46 組候選重複來源叢集，評估在詳情頁或閱讀器中建立同源案例關聯索引或候選標籤，供讀者橫向比對同源案例。

## 2026-10-19：擴充 UC-330 至 UC-350 複合自然語言分詞與同義詞對映，解決長尾查詢零命中問題

問題調查與證據：
1. 長尾複合自然語言查詢因缺少邊界分詞與複合詞處理導致 0 筆命中：
   - 「出發前充滿電自動還原」（UC-346）：0 筆（前輪正則強制要求特斯拉或tesla前綴，未命中長途出發前充滿電自動還原）。
   - 「過濾小孩頻道怪人」（UC-347）：0 筆（怪人位於句尾未與小孩頻道切分，無法觸發審查詞根）。
   - 「zillow買房過濾交房仲」（UC-348）：0 筆（「交房仲」未切分，遺留交房仲無法命中）。
   - 「調閱房屋揭露文件」（UC-348）：0 筆（調閱、房屋與揭露文件未切分）。
   - 「詢問信寫入notion台帳」（UC-349）：0 筆（詢問信與notion台帳複合詞未切分）。
   - 「查行事曆空檔草稿回信」（UC-349）：0 筆（查行事曆空檔與草稿回信複合詞未切分）。
   - 「主管晨報公開新聞分流」（UC-350）：0 筆（公開新聞與分流未切分）。
   - 「內部信件交dots公開新聞交grok」（UC-350）：0 筆（內部信件交dots與公開新聞交grok未切分）。
   - 「claude code卡住webhook」（UC-344）：0 筆（英文代碼代理與卡住webhook未切分）。
   - 「ads-b接收站雙頻輪收」（UC-334）：0 筆（ads-b接收站與雙頻輪收未切分）。
   - 「1090mhz天線量測」（UC-334）：0 筆（1090mhz與天線量測未切分）。
   - 「手動開啟的排程被關掉」（UC-335）：0 筆（手動開啟排程與關掉未切分）。
   - 「掌上型語音入口mcp」（UC-336）：0 筆（掌上型與語音入口mcp未切分）。
   - 「每日隨機照片換臉」（UC-337）：0 筆（照片換臉先被通用規則消費，遺留「每日隨機」導致 0 筆）。
   - 「跨產品過期交辦重送」（UC-339）：0 筆（跨產品與過期交辦未切分）。
   - 「智慧開關分層排障」（UC-330）：0 筆（智慧開關與分層排障未切分）。
   - 「未支援設備配對成功不能動」（UC-330）：0 筆（未支援設備與配對成功不能動未切分）。
   - 「網購未送達催退入帳」（UC-331）：0 筆（網購未送達與催退入帳未切分）。
   - 「x發文前人工關卡」（UC-332）：0 筆（x發文前與人工關卡未切分）。
   - 「notion跨代理外聯記憶」（UC-333）：0 筆（notion跨代理與外聯記憶未切分）。

本輪改善：
1. `assets/app.js` 分詞函數 `tokenize` 新增與調整複合詞切分正則：
   - 特斯拉出發充電與自動還原正則調整：放寬前綴，精確匹配出發前充電並自動還原情境，同時強制要求多詞複合避免誤吃單獨「還原」。
   - 小孩頻道可疑留言巡檢正則：精確切分過濾小孩頻道怪人與頻道留言審查，嚴格防止誤吃單獨「小孩」單詞。
   - 房仲協作與調閱揭露文件：切分「交房仲」、「調閱房屋揭露文件」。
   - 官網詢問信受理台帳與行事曆空檔草稿回信：切分「詢問信寫入notion台帳」、「查行事曆空檔草稿回信」。
   - 主管情報分工與信件/新聞分流：將長規則置於通用前綴前，切分「主管晨報公開新聞分流」、「內部信件交dots」、「公開新聞交grok」。
   - 程式代理停滯 webhook 叫醒通知：切分「claude code卡住webhook」、「t3 code停滯」。
   - ADS-B 接收站雙頻輪收與 1090MHz 天線量測：切分「ads-b接收站雙頻輪收」、「1090mhz天線量測」。
   - 手動排程衝突、掌上圓屏語音入口、隨機參考照換臉與跨產品舊交辦重送：切分「手動開啟的排程被關掉」、「掌上型語音入口mcp」、「每日隨機照片換臉」（置於通用換臉規則前）與「跨產品過期交辦重送」。
   - 智慧家庭設備排障、網購未送達催退、發文人工關卡與跨代理外部記憶：切分「智慧開關分層排障」、「未支援設備配對成功不能動」、「網購未送達催退入帳」、「x發文前人工關卡」與「notion跨代理外聯記憶」。
2. `assets/app.js` 同義詞群 `SYNONYM_GROUPS` 擴充：
   - 新增分流詞群：`['分流', '分派', '分工', 'triage']`。
   - 新增雙頻詞群：`['雙頻', 'dual-band', 'dual band']`。
   - 新增天線詞群：`['天線', 'antenna', 'antennas']`。
   - 新增量測詞群：`['量測', '測量', 'measurement', 'measurements']`。
   - 新增房仲詞群：`['房仲', '仲介', '房屋仲介', 'realtor', 'real estate agent', 'real estate agents']`。
   - 新增手動詞群：`['手動', '手動操作', '手動恢復', 'manual']`。
   - 維持 100% 互映與自反對稱。
3. `tests/search.test.cjs`：
   - 新增 20 組真實複合查詢回歸斷言，驗證 UC-330 至 UC-350 自然長尾查詢由 0 筆轉為精確命中目標案例。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（348 筆條目全文與擴充檢索全數驗證通過，20 組測試全數精確命中目標案例）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總條目數維持 348 筆（342 案例、3 經驗補充、3 待查項目），嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：依據 `sources/qualification-audit-2026-10-16.md` 的既有規範，逐案覆核 UC-342 至 UC-350 的合格性判定（評估 UC-343、UC-348 待定，其餘納入 B 級流程）。

---

## 2026-10-19 搜尋分詞正則邊界修正與標籤召回修復

問題調查與證據：
1. 分詞函數 `tokenize` 中多組正則因前綴完全可選（over-eager optional prefixes），造成常見獨立單詞被誤轉為特定長詞，使標籤與標題檢索產生假陰性（0 筆命中或嚴重漏失）：
   - 標籤「廣告」：UC-022、UC-183 在點擊標籤「廣告」或搜尋「廣告」時回傳 0 筆，因為 `/(?:關掉|去除|去|免)?\s*(?:電視)?\s*廣告/g` 之前置詞皆可選，使單純「廣告」被強制擴增為 `電視 去廣告`，要求案例必須包含「電視」才能命中。
   - 標籤「表單」：庫中 5 個標籤為「表單」的案例（UC-102、UC-126、UC-145、UC-174、UC-318）在搜尋「表單」時僅 1 個命中（UC-343），其餘 4 個全部漏失。原因為 `/(?:國外|海外)?\s*(?:修車|車輛救援|保險救援)?\s*(?:申請表|表單)/g` 之前綴皆可選，單獨「表單」被強制轉為 `救援 表單`。
   - 「約時間」：UC-059 標題包含「整理詢價再約時間」，因 `/(?:客戶)?\s*(?:來信)?\s*(?:想)?\s*(?:約時間|約會面|約會議)/g` 之前綴皆可選，單獨「約時間」被強制注入 `客戶 來信`，導致樹枝清運案例搜尋 0 筆。
   - 「衝突／矛盾」：UC-230（調薪批次衝突）、UC-237（品牌指引版本衝突）、UC-240（專利權利項衝突）、UC-266（座談主持時間衝突）在單獨搜尋「衝突」時全部漏失，原因為 `/(?:任務|狀態|執行)?\s*(?:矛盾|衝突|不一致)/g` 之前置詞可選，強行注入 `狀態`。
   - 「圓屏」：`/(?:掌上型|手持)?\s*圓屏(?:\s*裝置)?/g` 無條件轉換「圓屏」。

本輪改善：
1. `assets/app.js` 分詞函數 `tokenize` 正則收緊邊界，要求必要限定詞：
   - 電視去廣告：改為 `/(?:電視\s*(?:去廣告|免廣告|關掉廣告|去除廣告)|(?:關掉|去除|去|免)\s*(?:電視)?\s*廣告)/g, ' 電視 去廣告 '`，單獨「廣告」保留為通用行銷/廣告詞根。
   - 救援表單：改為 `/(?:國外|海外)?\s*(?:修車|車輛救援|保險救援)\s*(?:申請表|表單)/g, ' 救援 表單 '`，單獨「表單」不再被注入「救援」。
   - 客戶約時間：改為 `/(?:客戶\s*(?:來信)?(?:\s*想)?|來信\s*(?:想)?)\s*(?:約時間|約會面|約會議)/g, ' 客戶 來信 約時間 '`，要求至少有「客戶」或「來信」前綴。
   - 狀態矛盾：改為 `/(?:任務|狀態|執行)\s*(?:矛盾|衝突|不一致)/g, ' 狀態 矛盾 '`，保留通用「衝突／矛盾／不一致」的獨立檢索能力。
   - 圓屏裝置：改為 `/(?:(?:掌上型|手持)\s*圓屏|圓屏\s*(?:裝置|螢幕))/g, ' 掌上型 圓屏 裝置 '`。
2. `tests/search.test.cjs`：
   - 新增回歸斷言覆蓋「廣告」（UC-022、UC-183）、「表單」（UC-102、UC-126、UC-145、UC-174、UC-318）、「整理詢價再約時間」（UC-059）、「衝突」（UC-230、UC-237、UC-240、UC-266）。
   - 驗證全庫 615 個唯一標籤與 342 個案例標題全數 0 漏失。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（348 筆條目全文與擴充檢索全數驗證通過，回歸斷言全數精確命中）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總條目數維持 348 筆（342 案例、3 經驗補充、3 待查項目），嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：依據 `sources/qualification-audit-2026-10-16.md` 的既有規範，逐案覆核 UC-342 至 UC-350 的合格性判定（評估 UC-343、UC-348 待定，其餘納入 B 級流程）。

---

## 2026-10-19 搜尋分詞正則邊界收緊第二階段與通用詞彙召回修復

問題調查與證據：
1. 第一階段修正後，深入稽核 `tokenize` 正則替換規則發現仍有若干組規則的前綴或後綴皆為可選（over-eager optional prefixes/suffixes），導致使用者搜尋通用獨立單詞時，被強制擴增特定子詞，造成嚴重假陰性與檢索漏失：
   - 搜尋「印表機」：庫中 UC-137（訪客印表機佇列交接）、UC-181（標籤印表機）、UC-112（分件印表機）、UC-226（相框列印）、UC-249（小誌印表機）等案在搜尋「印表機」時僅 1 個命中（UC-342），其餘全部漏失。原因為 `/(?:家用|家裡|家中)?\s*印表機\s*(?:著色)?/g` 前後綴皆可選，單獨「印表機」被強制轉為 `家用 印表機 著色`。
   - 搜尋「程式代理」：庫中明確提及「程式代理」的 UC-052 與 UC-310 在搜尋「程式代理」時全數漏失。原因為 `/(?:程式代理|代碼代理|編程代理)\s*(?:跑完|做完|結束|卡住|停滯)?(?:\s*(?:沒|了沒))?/g` 後綴皆可選，單獨「程式代理」被強制注入 `工作階段`。
   - 搜尋「交辦」：UC-127（語音交辦事件）與 UC-284（交辦報銷申請）在搜尋「交辦」時被漏失。原因為 `/(?:舊|新)?\s*交辦\s*(?:任務|工作)?/g` 前後綴皆可選，單獨「交辦」被強制注入 `任務`。
   - 搜尋「德文」：庫中 UC-125（ESP32 德文論壇解碼器）與 UC-161（德文題庫）在搜尋「德文」時漏失。原因為 `/(?:德文|德語)\s*(?:語音)?\s*(?:聽不懂|不通)?/g` 後綴可選，強制注入 `語言`。
   - 搜尋「esp」／「esp32」：庫中核心硬體在環案 UC-125（ESP32 解碼器）在搜尋「esp」或「esp32」時 0 筆命中。原因為 `/\besp(?:\s*系列)?(?:\s*圓形)?(?:\s*(?:螢幕|裝置|終端))?/g` 之後綴皆可選，強行注入 `圓形 螢幕`。
   - 搜尋「特斯拉」／「電動車」：單獨搜尋「特斯拉」被強制要求「出發 充電」；搜尋「電動車」被強制要求「充電 排程」。
   - 搜尋「線稿」／「城堡」：搜尋「線稿」被強制要求「黑白 著色」；搜尋「城堡」甚至被無條件替換為「獨角獸 線稿」。

本輪改善：
1. `assets/app.js` 分詞函數 `tokenize` 正則收緊邊界，要求必要修飾語或複合動詞：
   - 印表機：改為 `/(?:(?:家用|家裡|家中)\s*印表機|印表機\s*著色)/g, ' 家用 印表機 著色 '`，單獨「印表機」保留通用列印設備檢索能力。
   - 程式代理工作階段：改為 `/(?:程式代理|代碼代理|編程代理)\s*(?:跑完|做完|結束|卡住|停滯)(?:\s*(?:沒|了沒))?/g, ' 程式代理 工作階段 '`，單獨「程式代理」保留通用編程代理檢索能力。
   - 交辦任務：改為 `/(?:(?:舊|新)\s*交辦|交辦\s*(?:任務|工作))/g, ' 交辦 任務 '`，保留單獨「交辦」檢索能力。
   - 德文聽不懂：改為 `/(?:德文|德語)\s*(?:語音\s*(?:聽不懂|不通)?|(?:聽不懂|不通))/g, ' 德文 語言 '`，且 `/(?:看不懂|聽不懂)\s*(?:德文|德語|當地語言|外語)\s*(?:找)?\s*(?:救援|求助)/g` 要求指定語系，單獨「德文」保留為通用語言名詞。
   - ESP 圓屏：改為 `/\besp(?:\s*系列)?\s*(?:圓形(?:\s*(?:螢幕|裝置|終端))?|(?:螢幕|裝置|終端))/g, ' esp 圓形 螢幕 '`，單獨「esp」與「esp32」保留通用微控制器檢索能力。
   - 特斯拉長途出發：收緊為 `/(?:特斯拉|\btesla\b)\s*(?:長途)?\s*(?:出發)?\s*(?:充電|充飽電|充滿|充到滿|滿充)\s*(?:技能)?/g` 與 `/(?:特斯拉|\btesla\b)\s*長途(?:\s*出發)?/g`，單獨「特斯拉」不再被注入「出發 充電」。
   - 電動車排程：改為 `/(?:電動車|電車)\s*(?:充電\s*(?:排程)?|排程)/g`。
   - 線稿與獨角獸：改為 `/(?:(?:黑白|粗線條)\s*線稿|線稿\s*(?:著色|列印))/g` 與 `/(?:獨角獸|小仙子|城堡)\s*(?:線稿|著色)/g`，單獨「線稿」與「城堡」不再被破壞。
2. `tests/search.test.cjs`：
   - 新增針對「印表機」（UC-137、UC-181、UC-342）、「程式代理」（UC-052、UC-310、UC-344）、「交辦」（UC-127、UC-284、UC-339）、「德文」（UC-125、UC-161、UC-343）、「esp / esp32」（UC-125、UC-336）、「特斯拉 / 電動車」（UC-346）、「線稿 / 城堡」的回歸斷言。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（348 筆條目全文與擴充檢索全數驗證通過，回歸斷言全數精確命中）。
- `node --test tests/*.test.cjs`：66/66 單元測試全數通過（含 8/8 audit 測試）。
---

## 2026-10-19 搜尋分詞自然語句連接詞切分與 UC-342 至 UC-350 複合查詢檢索品質改善

問題調查與證據：
1. 中文自然語句中包含連詞（如「與」、「和」、「及」）或口語修飾時，分詞未適當斷詞，造成詞綴沾黏（例如「買房通勤時間與學區」中產生「與學區」、「詢問信台帳與回信草稿」產生「與回信草稿」），導致目標案例 0 筆命中。
2. 最新收錄案例（UC-342 至 UC-350）在自然語言長句查詢下有多組假陰性（0 筆命中）：
   - 「特斯拉出發前充飽電」、「tesla出門充電技能」、「電動車充到滿」（UC-346）：因出發前後修飾與充飽/充滿目標未涵蓋而 0 筆命中。
   - 「清理youtube垃圾留言」、「兒童頻道留言過濾」（UC-347）：因「清理」未納入審查/巡檢同義詞群，且垃圾留言產生分離詞而 0 筆命中。
   - 「房屋揭露文件交給房仲」、「買房通勤時間與學區」（UC-348）：因「房屋揭露」未正規化至「揭露文件」同義詞，且連詞未切分而 0 筆命中。
   - 「詢問信台帳與回信草稿」、「日曆找空檔擬回信」（UC-349）：因「日曆找空檔」前置語序與擬回信草稿未對應而 0 筆命中。
   - 「內部郵件與公開情報分流」、「晨報分工notion日報」（UC-350）：因「內部郵件/信件」未納入分流分詞規則而 0 筆命中。
   - 「智慧電視常亮看板」（UC-345）、「兒童塗色線稿」（UC-342）、「聽不懂德文填救援申請表」、「公路車子壞掉找拖吊」（UC-343）、「超時未更新webhook通知」（UC-344）：多詞沾黏無法拆分。

本輪改善：
1. `assets/app.js`：
   - 擴充 `SYNONYM_GROUPS`：審查/審計組加入「巡檢」、「清理」、「過濾」；草稿組加入「擬回信」、「回信草稿」；揭露組加入「房屋揭露」。
   - 優化 `tokenize` 中特斯拉充電、兒童頻道留言巡檢、買房學區與房仲交接、詢問信受理台帳與日曆找空檔、晨報情報分流、電視常亮看板、兒童著色線稿、道路救援與工作階段超時停滯等正規化正則，支援自然連接詞與修飾語切分，同時嚴格保持單詞邊界避免過度轉換。
2. `tests/search.test.cjs`：
   - 新增 16 項針對 UC-342 至 UC-350 自然查詢的檢索斷言，並驗證原有印表機、程式代理、交辦、德文、esp、城堡等單詞邊界無回歸。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（348 筆條目全文、全數 16 項新查詢及歷史檢索斷言通過）。
- `node --test tests/*.test.cjs`：69/69 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總條目數維持 348 筆（342 案例、3 經驗補充、3 待查項目），嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：依據 `sources/qualification-audit-2026-10-16.md` 的既有規範，逐案覆核 UC-342 至 UC-350 的合格性判定（評估 UC-343、UC-348 待定，其餘納入 B 級流程）。

---

## 2026-10-19 中文無空格複合短語分詞斷詞與購買／充電／缺貨同義詞擴充

問題調查與證據：
1. 檢索品質稽核中，使用者以中文無空格自然複合短語查詢時，因分詞僅以空白與標點切分，造成關鍵詞黏結未斷詞而產生多組嚴重假陰性（0 筆命中）：
   - 「每天印著色畫」、「印表機印線稿」、「印表機列印線稿」（UC-342）：因「每天印」未切分「每天」與「列印」，「印表機印線稿」未切分「印表機」與「線稿」導致 0 筆命中。
   - 「工作階段結束webhook」（UC-344）：因工作階段結束/完畢未切分工作階段與 webhook 導致 0 筆命中。
   - 「常亮螢幕作業缺交」、「常亮螢幕看女兒成績」、「電視常亮看成績」、「電視顯示缺交作業」（UC-345）：因「常亮螢幕」與「作業缺交」/「女兒成績」黏結未切分導致 0 筆命中。
   - 「出發前充電100%」、「出發前充電」、「出發充電」、「長途出發充電」、「充電排程自動還原」、「特斯拉長途準備技能」（UC-346）：因出發充電缺少單獨出發與充電關聯規則，且排程自動還原未切分而 0 筆命中。
   - 「兒童頻道可疑留言過濾」（UC-347）：因兒童頻道與留言之間夾帶修飾詞「可疑」未涵蓋而 0 筆命中。
   - 「買房篩選兩關過濾」（UC-348）：因「兩關過濾」未切分「篩選」導致 0 筆命中。
   - 「詢問信登記台帳找行事曆空檔」、「客戶來信想約時間擬回信」、「notion受理表回信草稿」、「notion受理表找空檔」（UC-349）：因 notion 受理表、約時間、找空檔黏結導致 0 筆命中。
   - 「hetzner主機售完候補下單」、「雲主機售完每30分鐘查貨」、「售完每30分鐘查貨」（UC-286）：因主機售完每 30 分鐘查貨夾帶時間副詞未切分，且缺少購買/下單同義詞群導致 0 筆命中。
2. 同義詞庫缺少下單購買（order/purchase/buy/下單/下訂/購買/買下）、充電（charge/charging/充電/充飽/充滿）、缺貨售完（sold-out/restock/售完/缺貨/補貨/候補）三組通用同義詞群。

本輪改善：
1. `assets/app.js`：
   - 擴充 `SYNONYM_GROUPS` 新增三組同義詞：下單/下訂/購買/買下/採購/下訂單組、充電/充飽/充飽電/充滿/充滿電組、售完/缺貨/補貨/沒貨/候補組。
   - 優化 `tokenize` 正規化規則：支援「每天/每日＋列印」、「印表機＋線稿」、「工作階段＋結束/卡住＋webhook」、「電視常亮/待機＋成績/缺交作業」、「出發＋充電/100%」、「充電排程＋自動還原」、「特斯拉長途準備技能」、「兒童頻道＋可疑留言審查」、「兩關＋篩選/過濾」、「notion受理表＋台帳/行事曆空檔/回信草稿」、「客戶來信＋約時間」、「售完＋每N分鐘＋查貨/下單購買」，並保持所有獨立單詞邊界。
2. `tests/search.test.cjs`：
   - 新增 23 項針對上述複合查詢的檢索斷言，確保所有 23 筆查詢全數精確命中目標案例，且所有歷史單詞（印表機、程式代理、交辦、德文、esp、特斯拉、電動車、線稿、城堡、衝突等）無回歸。

驗證指令與實際結果：
- `node tests/search.test.cjs`：通過（348 筆條目全文、全數 23 項新查詢及所有歷史檢索斷言通過）。
- `node --test tests/*.test.cjs`：69/69 單元測試全數通過（含 8/8 audit 測試）。
- `for file in assets/*.js tests/*.cjs; do node --check "$file"; done`：語法檢查全數通過。
- `python3 scripts/preview.py /tmp/preview-check/ai-agent-use-cases`：靜態站預覽構建成功。
- 總條目數維持 348 筆（342 案例、3 經驗補充、3 待查項目），嚴格合格數維持 299 筆，候選重複叢集數維持 46 組，無編造案例、無擅刪候選。
下一輪建議：依據 `sources/qualification-audit-2026-10-16.md` 的既有規範，逐案覆核 UC-342 至 UC-350 的合格性判定（評估 UC-343、UC-348 待定，其餘納入 B 級流程）。










