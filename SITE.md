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
