# GitHub Pages 案例網站

## 啟用一次

Repository → Settings → Pages → Build and deployment：

- Source：**Deploy from a branch**
- Branch：**main**
- Folder：**/ (root)**
- Save

本網站使用 GitHub Pages 內建 Jekyll。不要新增 `.nojekyll`；也不要選 GitHub Actions 作為 Source，因為不需要自訂 workflow。

預期網址由 Pages 設定頁提供。請等該次 `pages build and deployment` 完成，再確認網址可開啟；提交程式碼不等於已上線。

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
