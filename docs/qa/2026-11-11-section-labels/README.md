# 2026-11-11 章節標題被當成正文：搜尋計數與卡片引用，以及一個 60 分鐘的假紅閘門

## 基準

- 開發基準 `origin/main` `3f53ba99`（= 本輪開工時 main head）。隔離 worktree `/tmp/omp-rfc-r1`（分支 `a11y/r354-details`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 337 個 commit，另有 159 個未追蹤檔案（皆屬其他輪次）；本輪未觸碰、未 reset。
- 基準 `node --test tests/*.test.cjs`：**695 通過、0 失敗**；`node --check assets/app.js` 通過。交付版本 **712 通過、0 失敗**。
- 正式站 `catalog.json.sourceRevision` = `3f53ba9955cb1a5c1932d391696dac86f77c7201`（= main head），515 筆條目、512 個來源檔；本機 `preview.py` 產出的 `catalog.json`／`corpus.json` 與正式站同一份語料。
- Actions 現況重新確認（未沿用歷史敘述）：main 最近 40 次 run 只有 3 次非成功——`42820349847` 的 `Website QA` 失敗（下述，本輪修正）、`42823349252` 的 `pages build and deployment` cancelled（被下一個 push 取代）、`42803248261`（`8fbfe082`）的步驟 15 逾時（**已由 `0f7b6c76`／#349 修掉，本輪不重修**）。

## 問題證據

### 1. 訪客：範本章節標題被算成正文，也被當成卡片上的「原文」

目標使用者是**用「權限／限制／提示詞／驗收」這類證據詞找案例的訪客**：他想知道哪些案例真的談到這件的事，而不是哪些頁面有那個標籤。

`templates/case.md` 要求每篇都有 `## 來源版本`、`## 所需連接、權限與限制`、`## 驗收與可重現性`、`## 可複製提示詞` 等標題；`assets/app.js` 的 `metadata()` 把整份 markdown（含標題行）放進 `search`。原文標題的文件頻率（508 篇 `cases/*.md`）：

| 標題 | 出現篇數 |
| --- | ---: |
| `## 輸入與預期輸出` | 218 |
| `## 來源版本` | 216 |
| `## 所需連接、權限與限制` | 216 |
| `## 去重與版本紀錄` | 213 |
| `## 驗收與可重現性` | 212 |

正式站（`3f53ba99`）與本機同一份語料實測：

| 查詢 | 全文 | 標題/用途/痛點 | 卡片實際引用（修改前） |
| --- | ---: | ---: | --- |
| 權限 | 507 / 515 | 30 | `「權限」 · 原文 · 權限、限制與驗收`，節錄就是那行標題 |
| 限制 | 468 | 16 | 同上 |
| 驗收 | 477 | 73 | 同上 |
| 來源 | 506 | 74 | 同上 |
| 提示詞 | 313 | 17 | `「提示詞」 · 原文 · 可複製提示詞（自設未測，非作者原文）`，節錄就是標題 |
| 所需連接 | 216 | 0 | `「所需連接」 · 原文 · 所需連接、權限與限制`，節錄就是標題 |
| 會議（對照） | 27 | 13 | — |

兩個具體錯誤：

- **結果行說錯來源**：`權限` 的說明是「這 507 筆裡，30 筆的標題、用途或痛點提到…；其餘 **477 筆只在正文或其他欄位提到**」。其中 **199 篇**（文字層量測）的正文從沒寫過「權限」，只有那行範本標題。
- **卡片把標籤當內容**：`所需連接` 的 216 筆全部如此；`searchContext()` 把命中的標題行本身當成「原文」節錄輸出，讀者看到的是標題被回讀一次。

同時確認反向風險：若**直接刪掉標題行**，`提示詞` 會少掉 **92 篇**章節本體確實有提示詞、但正文不再提到「提示詞」的案例（量測：108 篇只在標題命中的案例中，92 篇該節有實質內容、16 篇是佔位句）；`權限` 也會少掉 75 篇確實有權限章節內容的案例。所以「刪掉」不是正解。

### 2. 維護者：`Website QA` 的發布閘門會等待一個永遠不會成立的相等

run [42820349847](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42820349847)（`2b139d9f`，main push）：

| 步驟 | 起訖 | 結果 |
| --- | --- | --- |
| 15 `Wait for published assets and content`（`tests/published-version.cjs`） | 13:09:39 → 13:09:40 | **success（1 秒）** |
| 16 `Fail when the published site cannot be verified` | — | skipped（`verified == 'true'`） |
| 17 `Verify the published GitHub Pages site`（`tests/deployed-browser.cjs`） | 13:09:40 → **14:09:40** | **failure（整整 3600 秒）** |

成因（讀碼 + 時間軸，不是猜）：步驟 15 已正確判定「本 push 已被 `ab4b51f4` 取代」（13:05 合併、13:06:16 發布，改動 `assets/app.js` +80 行與 `index.html`），只比對本 push 改到的 7 個 `cases/*.md` 就通過；步驟 17 卻以 `waitForPublishedAssets({files:[五個資產], isCurrent:()=>true})` 逐 byte 比對 **checkout 的資產**與正式站，而正式站此後永遠服的是 `ab4b51f4` 的資產 → 720 次輪詢全部 mismatch → 60 分鐘後 throw。對照 run [42821309962](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42821309962)（`ab4b51f4`，checkout 就是當時的建置）同一支程式 36 秒通過。這是**每次「改資產的合併緊接在另一個合併後 1～2 分鐘內」都會重現的假紅**，不是 flake，也不是產品回歸。

## 兩個方案

### 訪客端

- **A（採用）把「正文」與「章節標題」拆成兩種命中，說清楚、可切換。**
  - 做法：索引同時保留 `search`（含標題，召回不變）與 `searchBody`（不含標題）；卡片把標題命中寫成 `章節標題「…」` 並節錄**那一節的第一行內容**；結果行把尾端拆成「正文或頁首資料 N 筆／要算上章節標題才符合 M 筆（例如〈…〉）」；`命中範圍` 新增 `全文：不含章節標題`，可分享、可移除、返回保留。
  - 價值：保住 92 篇「提示詞只寫在該節」與 75 篇「權限只寫在該節」的召回，同時讓讀者一眼看出哪一筆是標籤、哪一筆是內容。
  - 成本：`assets/app.js` +160 行（含註解）、`index.html` 1 行、`README.md` 一段、1 支單元測試（7 項）、1 支瀏覽器回歸。
  - 取捨：全文筆數**不變**（507）。我們沒有偷偷縮小母體，而是把構成寫出來；訪客要「只看真的有寫」時按一下 `正文`。
- **B 直接把標題行從索引移除。**
  - 成本最低，但實測會讓 92 篇提示詞章節、75 篇權限章節的案例從該查詢消失，而且「哪些案例有這一節」這個可用訊號一起消失。不採用。

### CI

- **A（採用）步驟 17 不再比對位元，只問「正式站現在服務哪個建置」，並在有界時間內回答。**
  - 做法：新增 `scripts/published-revision.cjs`（120 秒、5 秒一次、只讀 `catalog.json.sourceRevision`）；本 push 的建置 → 走查；後續建置（`isDescendantOf(SHA, live)`）→ 印 `PUBLISHED_LIVE_BUILD_SUPERSEDED` 並結束，走查由那個 commit 的 main run 負責（本 repo 其他 live 檢查遇到被取代時同樣跳過）；兩者皆非 → 120 秒內失敗並寫出觀察到的 revision。步驟 15 把 `mode`／`liveRevision` 傳給步驟 17。
  - 價值：把 3600 秒的假紅變成 0.2 秒的明確裁決；真失敗仍在 2 分鐘內紅，且訊息帶著版本。
- **B 保留逐 byte 比對，只把視窗縮短或加上「被取代就跳過」。**
  - 若在被取代時仍要比對，只能接受 mismatch 或降低斷言，等於關掉檢查；若只縮短視窗，假紅只是變快。不採用。

## 改動

| 檔案 | 內容 |
| --- | --- |
| `assets/app.js` | 新增 `markdownSections()`／`proseWithoutSectionHeadings()`／`sectionOpening()`／`sectionLabelName()`；`metadata()` 另存 `searchBody`／`searchProseBody`；`filterEntries()` 新增 `scope=body`；`searchContext()` 標題命中改標 `章節標題「…」`＋該節第一行＋警語（空章節另標）；結果行拆成正文／標題兩段並具名範例；`SEARCH_SCOPES` 新增 `body` |
| `index.html` | 命中範圍新增「全文：不含章節標題」；`#scope-note` 說明它只把章節名稱從索引移除，標題、用途與正文照舊 |
| `README.md` | 一段說明章節標題不算正文、卡片標示、`正文` 範圍與仍可用標題找到案例 |
| `scripts/published-revision.cjs`（新） | `waitForLiveRevision()`：有界 120 秒、只看 `catalog.json`、不做任何檔案比對 |
| `tests/deployed-browser.cjs` | 移除 60 分鐘位元等待；改用上面的裁決；superseded 印一行後結束 |
| `tests/published-version.cjs` | 結果帶 `liveRevision`；輸出 `mode`／`liveRevision`（`verified` 契約不變） |
| `.github/workflows/website-qa.yml` | 步驟 17 帶入 `PUBLICATION_MODE`／`PUBLICATION_LIVE_REVISION`（`if:` 未動）；Chromium 步驟新增 `search-heading-scope-browser.cjs` |
| `tests/search-heading-provenance.test.cjs`（新） | 7 項：索引拆分、`scope=body`、標題命中的標籤與節錄、正文命中維持原說明、fenced code 不當標題、空章節、無標題副本保留程式碼區塊 |
| `tests/deployed-gate.test.cjs`（新） | 10 項：注入假 `fetch`，涵蓋 superseded／exact／等待中翻轉／等不到（帶 revision 與次數）／舊行為 720 次輪詢的回歸守門 |
| `tests/search-heading-scope-browser.cjs`（新） | 1440／390／320 三種尺寸：數字相加、標籤具名、卡片標示與節錄、`scope=body` 承諾等於畫面、分享 URL、reload、空結果復原、`會議` 安靜、axe 0、水平溢出 0 |

## 測試

- `node --test tests/*.test.cjs`：基準 **695** → 交付 **714 通過、0 失敗**。`node --check assets/app.js` 通過。
- 新增單元測試：9/9 通過（含多詞查詢逐案分類、宣告欄位命中不算標題）。新增 CI 單元測試：10/10 通過（`deployed-gate`）；`published-version`／`published-assets`／`publication-gate` 三支合計 68/68 通過。
- 瀏覽器回歸（本機預覽，`NODE_PATH` 指向 Playwright 1.64.1）：
  - `tests/search-heading-scope-browser.cjs`（新）：1440／390／320 全通過。
  - `tests/search-scope-browser.cjs`：1440／390／320 通過（既有 `scope` 語意未變）。
  - `tests/match-scope-note-browser.cjs`：三種尺寸通過，axe 0；新的句子在 desktop／phone 的 notice 底端 733／…px，第一張卡仍在首屏。
  - `tests/result-count-honesty-browser.cjs`、`tests/task-coverage-marker-browser.cjs`、`tests/coverage-recovery-browser.cjs`：通過。
  - `tests/search-context-browser.cjs`（firefox＋webkit）：通過，`explained` 等於 `rendered`。
  - `tests/relevance-browser.cjs`、`tests/reader-browser.cjs`、`tests/loading-budget-browser.cjs`：通過（載入 515 筆、部分載入復原、axe 0）。
- 真實發布閘門重現（不用等一小時）：
  - `GITHUB_SHA=2b139d9f… PUBLICATION_MODE=superseded node tests/deployed-browser.cjs` → `PUBLISHED_LIVE_BUILD_SUPERSEDED unknown revision`，**exit 0、0.19 秒**（訊息中缺 revision 只因沒帶 `PUBLICATION_LIVE_REVISION`；帶入時會印出 `3f53ba99…`）。
  - 不帶 `mode`、讓它自己問正式站與 git：`PUBLISHED_LIVE_BUILD_SUPERSEDED 3f53ba9955cb…`，exit 0。
  - `GITHUB_SHA=3f53ba99…`（= 目前正式站）走 exact 路徑：`PUBLISHED_LIVE_BUILD_CURRENT`，桌面＋手機走查與 `mobile-search`／`search-recovery`／JS 關閉 fallback 全通過，34 秒 exit 0。
  - 舊版同一輸入：`timeout 60` 後仍在輪詢、stdout 空；舊 gate 在 40 秒窗口內輪詢 8 次（= 5 秒間隔，60 分鐘 720 次），全程 `byte mismatch`。

## 訪客改動前後（同一語料、同一查詢）

| 查詢 | 修改前（正式站 `3f53ba99`／基準預覽） | 修改後（本輪預覽） |
| --- | --- | --- |
| 權限 | 507 筆；「其餘 477 筆只在正文或其他欄位提到」；卡片 `原文 · 權限、限制與驗收`，節錄是標題 | 507 筆；「30 筆標題/用途/痛點；其餘 477 筆中，402 筆在正文或頁首資料提到；另有 75 筆要算上章節標題才符合（例如〈所需連接、權限與限制〉）」；切 `全文：不含章節標題` 為 432 筆；卡片 `章節標題「權限、限制與驗收」`＋該節第一行＋警語 |
| 限制 | 468；16 | 468；16＋249 正文＋203 標籤 |
| 驗收 | 477；73 | 477；73＋300 正文＋104 標籤 |
| 來源 | 506；74 | 506；74＋337 正文＋95 標籤 |
| 提示詞 | 313；17；卡片節錄是標題 | 313；17＋204 正文＋92 標籤；卡片節錄是該節真正的提示詞內容 |
| 去重 | 440；9 | 440；9＋68 正文＋**363 標籤**（範本 `## 去重與版本紀錄`） |
| 所需連接 | 216；0；宣稱「只在正文或其他欄位出現」 | 216；0；「216 筆都要算上章節標題才符合（例如〈所需連接、權限與限制〉）」；切 `全文：不含章節標題` → 0 筆且有復原選項 |
| 會議 | 27；13；無提示 | 27；13；無提示（未變） |

幾何（`body` 模式提示，`display` 尺寸 1440／390／320）：notice 底端 128／216／216px，第一張卡 234／342／342px，水平溢出 0，pageerror 0；`所需連接` 的 `none` 模式 notice 底端 126／184／205px。

## 三種訪客情境（本輪預覽 `8206`，1440×900 與 390×844；正式站 `3f53ba99` 的同一支探測結果相同）

1. **不知道工具名稱的新訪客**：首頁 h1 底端 344（390px 為 238）px，62 個任務入口都是問題詞；`?q=會議` 得 27 筆、第一張卡 UC-094；開卡後憑據徽章 `作者報告／示範`、核讀狀態都在標題下方；第一個外部連結是固定版本的 `blob/3f53ba99…/cases/094-…md`（`target=_blank`、`rel="noopener noreferrer"`）。
2. **組合搜尋與篩選、空結果復原**：`?q=旅遊&scenario=生活` 21 筆 → 改成 `旅遊 xyz987` → 0 筆，空結果列出「只移除關鍵字「xyz987」 → 查看 21 筆」與任務捷徑；點第一項後回到 21 筆、查詢欄為 `旅遊`、URL 保留 `scenario=生活`。
3. **分享的詳情直鏈**：`?case=UC-005` 直接開啟，憑據與來源在第一屏；`Escape` 後回到探索，清單 24 張卡、焦點在頁面按鈕上。

鍵盤：首頁第一次 Tab 停在「跳到案例搜尋」，Enter 後焦點在 `#query`。

## 發布

（合併與正式站核對見下方補記；本節在 PR 建立後補上 run／commit／sourceRevision。）

## 已知限制

- 本環境無法讀取截圖影像，視覺結論來自 DOM 幾何、computed 樣式與 axe；前後截圖只存檔供人眼核對（`desktop-before/after-permission.png`、`mobile-before/after-section-label.png`、`desktop-before/after-prompt.png`）。
- 新增的瀏覽器回歸只在本機 Chromium 跑三種尺寸；Firefox／WebKit 的搜尋解說由既有 `search-context-browser.cjs` 覆蓋（通過），但新的 `章節標題` 文案沒有跨引擎斷言。
- 章節標題仍可用來命中案例（召回保留）。因此 `權限` 的全文筆數仍是 507；本輪的改善是**說明與可切換**，不是把數字變小。
- `pages` 部署完成到正式站生效有延遲；正式站核對在合併後另做，不以本機預覽代替。
- CI 的 superseded 分支**不做實站走查**：若「後續建置」本身壞掉而它的 main run 沒跑，本 push 的 run 不會發現。這是與 repo 其他 live 檢查一致的取捨，已在 `published-revision.cjs` 的註解與本紀錄寫明。

## 下一輪

最值得做的一件事：**首頁「換個情境，再找一點靈感」那組按鈕仍會無聲清空表單**（上一輪只修了詳情頁的「探索更多」）。先做的驗證：量 `?q=怎麼整理會議記錄#discover` 下點該組按鈕後的查詢欄、筆數與網址，確認是否與 `#scenario-reset` 同一類問題，再決定共用既有通知元件或只補說明。

第二順位：`tests/search-heading-scope-browser.cjs` 目前只跑 Chromium；若要納入 Firefox／WebKit，先確認 CI 的 browser-tools 安裝時間與 job 預算。

## 獨立審查（非本輪實作者）

由另一個 agent context（`reviewer`，未參與實作）讀最終 diff、在預覽上重量 1440／390、跑 `node --test tests/*.test.cjs`（當時 712 通過）與新增的兩支測試，並在副本上做三個變異（`searchBody` 含標題、`sectionOpening` 回傳標題、`scope=body` 當成全文）；三個變異都被新測試抓到。結論 **incorrect**，一項 P2、一項 P3，都已修：

1. **（已修，P2）來源分類講得比實際證明得強。** 舊文案把尾端寫成「P 筆在正文提到；另有 H 筆只在章節標題出現」。實際上：(a) `scope=body` 的索引仍含標題、用途、分類等宣告欄位，所以「正文」範圍是 30＋402＝**432** 筆，不是 402（審查者舉例：UC-057 由「分類」命中，卻被算進「正文」）；(b) 多詞查詢是逐案分類——`AI 權限` 的 UC-082／083／094 是「AI 在正文、權限只在標題」，不是每個詞都在標題。修正：文案改成「P 筆在正文或頁首資料提到；另有 H 筆要算上章節標題才符合」，範圍正名為「全文：不含章節標題」，README 的 402 改為 432 並寫明定義。新增兩項單元測試（宣告欄位命中、多詞逐案分類）與瀏覽器 `AI 權限` 段落，鎖住這個語意。
2. **（已修，P3）閘門的請求時間沒有服從整體期限。** `waitForLiveRevision()` 原本只在請求完成後檢查期限，單次請求固定可等 15 秒，因此「120 秒」實際可到約 135 秒（審查者以 `maxDuration: 1` 實測 15,005ms 才失敗）。修正：期限到就不再發請求，且每次請求的 timeout 取剩餘時間；對應測試的輪詢次數由 25 改為 24，並在測試註解說明理由。

審查同時確認（未改動）：篩選／分享 URL／瀏覽器返回／重載／空結果復原／分批載入下，畫面筆數與按鈕承諾一致；`#scope-note` 與實作相符；步驟 15 的 exact／superseded 斷言沒有被放寬；`if:`／`concurrency`／`timeout-minutes` 未被鬆動；PR 觸發路徑涵蓋新測試。審查指出的測試缺口（多詞與宣告欄位命中）已補上；仍缺的是「`scope` 與其他 facets 組合、以及 `goBack` 返回」的自動化斷言（本輪以手動量測確認 135／515 等結果一致）。
