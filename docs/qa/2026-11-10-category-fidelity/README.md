# 2026-11-10 主題分類把「編輯分級」與「索引表格儲存格」當成主題

## 基準

- 開發基準 `origin/main` `ee68c19d`（`docs(qa): note the record's own deployment`）。隔離 worktree `/tmp/aiuc-1110-r17`（detached HEAD，`git worktree add --detach`）。開 PR 後 main 前進四個 commit（`8fbfe082` #340 的 PR 閘門覆蓋、`56f7a238` #341 的核對日期、`5744e48c` #343、`3f0d4760` #344），分支已 rebase 到 `5744e48c`（`3f0d4760` 只動 `SITE.md` 與 QA 紀錄，不影響本輪檔案）；`SITE.md` 兩邊都在檔首新增紀錄，衝突以「兩筆都保留、較新的 #340 紀錄在前」解決。rebase 後重跑：`node --test tests/*.test.cjs` 基準（`56f7a238`）**691 通過** → 本輪 **694 通過、0 失敗**。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 322 個 commit，另有 159 個未追蹤的他人研究檔（`cases/462` 之後）與 QA 產物；本輪未觸碰、未 reset、未清理。
- 正式站開工時是 `ee68c19d`（`catalog.json.sourceRevision` = `ee68c19d94ba17c81be86f4fa7ae621016d06aee`，512 個來源檔、515 筆條目，五個產品資產與 checkout 逐 byte 相同）。本輪期間 main 前進四次（`8fbfe082` #340、`56f7a238` #341、`5744e48c` #343、`3f0d4760` #344），正式站跟著到 `3f0d4760`（`catalog.json.sourceRevision` = `3f0d4760474fb7f92cc7a6d781da95b8d8075851`，2026-11-10T11:20Z 讀取）；缺陷在 `3f0d4760` 重新量測仍然完全相同（345 個分類選項、仍提供分級選項、兩個主題查詢各 1 筆、舊分享連結 1 筆），所以「修正前」不是某個舊版本的偶發現象。
- 基準 `node --test tests/*.test.cjs`：開工時 `ee68c19d` **684 通過、0 失敗**；rebase 後 `56f7a238` **691 通過、0 失敗**。
- Actions 重新確認，不沿用歷史敘述：`gh run list --branch main --limit 20`（2026-11-10T11:21Z）= 14 次 `pages build and deployment` success、4 次 `Website QA` success、2 次進行中；開工時同一指令為 14 次 `pages build and deployment` 與 6 次 `Website QA`，全部 success。全部 branch 最近 100 次 run（09:49Z）只有 1 次 failure（PR #340 剛啟用的 `Corpus bundle QA`）與 22 次 superseded 取消。**目前沒有阻擋發布的 CI 問題，本輪不以 CI 為主題。**
- 基準無障礙：Chromium 1440×900／390×844 對首頁、結果、UC-001 詳情執行 axe（wcag2a/2aa/21a/21aa）共 6 次，**違規 0**；三視窗（1440／390／320）10 個頁面狀態水平溢出 0、pageerror 0。

## 問題證據

目標使用者是**用「主題分類」或「主題命中範圍」找案例、或想知道這篇案例屬於哪個主題的人**。

1. 正式站 `#category` 篩選有 **345 個選項**，其中 **344 個只對應 1 筆**（唯一例外 `工作流程／發布期用途` 6 筆）；選項平均 14 字、最長 31 字。這個清單本身是既有設計（只列案例頁宣告的分類，見 `docs/qa/2026-11-10-declared-category/`），本輪不動。
2. 其中一個選項的字面值是 **`B｜作者實作自述，未獨立重現`**，來自 `cases/444-feature-request-release-notification-loop.md:7` 的 `- 分類：B｜作者實作自述，未獨立重現`。查證：`?category=B｜作者實作自述，未獨立重現`（分享連結）載入後 **1 / 515 筆**、卡片 UC-444、條件 chip 顯示同一個字串。
3. 同一筆資料讓 **「主題」命中範圍說謊**：`?q=未獨立重現&scope=topic` 在正式站得到 **1 / 515 筆（只有 UC-444）**；`?q=作者實作自述&scope=topic` 同樣 1 筆。主題範圍的契約是「只搜尋標題、用途、核心目標、分類、標籤與案例 ID」，所以這 1 筆是分類欄位放進分級句子造成的假陽性（同一查詢在全文範圍是 176 筆）。修正後兩個查詢都是 **0 筆**。
4. 「分類太多？依名稱找分類」的查找器對 `未獨立重現` 也回報「找到 1 個分類」並列出這個分級字串（前後截圖見下方）。
5. 另外 6 筆的 `- 分類：` 是 **INDEX 表格儲存格**格式 `<情境>｜<標籤、標籤…>`：UC-433／214／215／216／217／218。這些頁面自己的 `- 情境` 與 `- 標籤` 行已分別宣告同樣資訊，分類欄位等於把兩欄再串一次，於是每個都變成一個只對應 1 筆的長選項（例：`開發｜發布、版本、環境、驗收`）。
6. 全庫量測：508 個案例頁中，118 頁用 `- 分類：`、231 頁用 `- 分類／標籤：`，只有這 7 頁在分類值裡出現 `｜`；其中只有 3 頁（UC-446／447／448）是 `<情境>｜<主題／主題>` 的合法寫法（不含 `、`）。其餘案例頁沒有任何分級字串出現在分類欄位。

## 兩個方案

- **A（採用）改資料：分類欄位只寫主題。** 7 個檔案各改 1 行，值取自該頁自己的「一句話用途」與「標籤」，並保持全庫唯一（改前已 grep 確認 7 個新值都不存在）。分級句子留在原本就有的 `- 來源證據`／`- 證據` 行（UC-444 的 `- 來源證據：作者實作自述，未獨立重現` 原樣保留），`INDEX.md` 的 `B作者使用自述；未重現` 也原樣保留，沒有任何資訊被刪除。再加 1 支語料層測試，把「分類不得是分級、不得是 INDEX 儲存格」變成可回歸的規則。
  價值：篩選器與主題搜尋只陳述案例頁寫過的主題；成本：7 行資料＋1 支測試；風險：低（不動 JS／CSS／workflow，不動任何計數）。
- **B 改程式：`metadata()` 在分類值符合分級樣式時丟棄它。** 不必碰 7 個檔案，但會讓「頁面宣告了什麼」與「網站顯示什麼」再次分岔——上一輪（`2026-11-10-declared-category`）才剛把分類收斂成「只認宣告值」；再用程式靜默丟棄宣告值，等於把同一類問題換個方向重做，而且真正的錯在資料（分級不是主題），不是在解析。成本也更高（`assets/app.js` 與既有 `declared-category` 契約測試都要改）。

另考慮：**C 把 349 筆分類全部改寫成短主題**（讓 344 個單筆選項變成可用的分組）。這是真正的內容工程，需要逐頁判讀 231 頁的標籤字串，且會改變 `同分類` 配對與所有已分享的 `?category=` 連結；不在本輪範圍，列為下一輪候選。

## 改動

| 檔案 | 改前 | 改後 |
| --- | --- | --- |
| `cases/444-feature-request-release-notification-loop.md:7` | `- 分類：B｜作者實作自述，未獨立重現` | `- 分類：產品回饋／版本通知` |
| `cases/433-email-opportunity-erp-authoritative-state-guard.md:6` | `- 分類：工作｜商機、資料對帳、狀態、驗收` | `- 分類：業務郵件／訂單狀態核對` |
| `cases/214-release-artifact-runtime-identity-check.md:9` | `- 分類：開發｜發布、版本、環境、驗收` | `- 分類：發布驗收／執行版本核對` |
| `cases/215-recipe-inbox-structured-collection.md:9` | `- 分類：生活｜食譜、收藏、文件整理、驗收` | `- 分類：食譜收藏／郵件擷取` |
| `cases/216-photo-shoot-selection-preset-handoff.md:9` | `- 分類：創作｜攝影、挑片、修圖、驗收` | `- 分類：攝影選片／修圖交接` |
| `cases/217-hdl-build-functional-regression-gate.md:9` | `- 分類：開發｜硬體、回歸、失敗、驗收` | `- 分類：硬體建置／回歸阻擋` |
| `cases/218-third-party-skill-install-trust-review.md:9` | `- 分類：開發｜技能、來源、版本、權限` | `- 分類：第三方技能／來源審閱` |

新增 `tests/category-fidelity.test.cjs`（3 項，透過 `vm` 載入 `assets/app.js` 的 `metadata()`，語料為全部 508 個案例頁）：

1. 篩選器不得提供分級：分類值不得以 `A｜`～`D｜` 開頭，也不得含 `未獨立重現`／`不列入嚴格合格`／`待定`。
2. 篩選器不得重貼 INDEX 儲存格：分類值不得是 `<情境>｜…、…`（情境前綴＋以「、」串起的標籤）。保留 `工作｜創作者經營／贊助開發／名單整理` 這類以「／」分節的情境前綴寫法。
3. 這 7 頁仍各自宣告主題、情境、標籤，且分級句子仍留在自己的證據行。

`website-qa.yml` 的 `node --test tests/*.test.cjs` 會自動納入新測試，因此本輪沒有改任何 workflow（避免與進行中的 PR #340 衝突）。

## 範圍邊界（量測後刻意不做）

- **`<情境>／<主題>…` 是既有慣例，不動。** 全庫 53 頁用「情境＋／」開頭的分類值，其中 18 頁的尾段剛好等於自己的標籤（例：`省錢／優惠券／重複操作／驗收`），38 頁尾段是另一個主題；`分類／標籤：<標籤清單>`（231 頁）也是既有慣例，`tests/declared-category.test.cjs` 明文允許「宣告值逐字保留」。這些值是慣例，不是分級也不是 INDEX 儲存格，本輪不動；把它們改寫成短主題是真正需要逐頁判讀的內容工程（方案 C），列為下一輪候選。
- **本輪只處理 `｜` 這種 INDEX 欄位分隔符。** 全庫在分類值裡用 `｜` 的只有 10 頁：7 頁是 INDEX 儲存格（`情境｜標籤、標籤…`）或分級，另外 3 頁（UC-446／447／448）是 `情境｜主題／主題／主題` 的合法寫法。測試因此要求「`情境｜` 且含 `、`」，而不是禁止所有情境前綴。
- **`一句話用途` 欄位的同類問題不在本輪。** 508 頁有 104 頁在「一句話用途」裡寫了 `本庫未重現` 這類分級句子（另有 75 頁超過 200 字），而這個欄位同時是卡片摘要（3 行截斷）與 `overview`／`topic` 搜尋文字。這是同一類缺陷、約 15 倍規模，需要逐頁改寫句子並重測卡片版面，列為下一輪最值得做的一件事。
- **`?category=` 的舊連結不會被改寫。** 舊值載入後是 0 筆並可復原，網址保留原值，不靜默替換讀者的分享連結。

## 測試

- 先紅後綠（同一支測試、同一份語料）：對基準資料（`git stash` 掉 7 個案例檔）**3 項全失敗**，訊息分別列出 `UC-444：B｜作者實作自述，未獨立重現` 與 6 筆 `情境｜標籤、…`；修正後 **3 項全通過**。
- `node --test tests/*.test.cjs`：開工基準 `ee68c19d` **684** → 本輪 **687**；rebase 到 `56f7a238` 後基準 **691** → 本輪 **694 通過、0 失敗**（新增 3 項）。
- 本輪沒有動 `assets/*`、`index.html`、workflow、`INDEX.md`、`README.md`，因此沒有 `node --check` 的新增對象；`scripts/preview.py` 重建預覽為 512 個來源檔。
- 瀏覽器前後比對（Chromium；before = 未修正預覽 8141，after = 修正後預覽 8142；同尺寸、同語料筆數 515；before 的同一組數字也在正式站 `ee68c19d` 與 `3f0d4760` 上取得）：

| 檢查 | 修正前 | 修正後 |
| --- | --- | --- |
| 分類查找輸入 `未獨立重現`（1440／390） | 找到 1 個分類：`B｜作者實作自述，未獨立重現 1 筆` | 沒有名稱符合的分類（0） |
| 主題範圍 `?q=未獨立重現&scope=topic` | 1 / 515（UC-444） | 0 / 515 |
| 主題範圍 `?q=作者實作自述&scope=topic` | 1 / 515（UC-444） | 0 / 515 |
| 舊分享連結 `?category=B｜作者實作自述，未獨立重現` | 1 / 515（UC-444） | 0 / 515，可移除條件、可復原 |
| 新分享連結 `?category=產品回饋／版本通知` | — | 1 / 515（UC-444） |
| 網站條目數 `#results-count` | 515 / 515 | 515 / 515（未變） |

- 前後截圖（同頁、同尺寸、同資料狀態）：`before-desktop-catfinder.png`／`after-desktop-catfinder.png`、`before-mobile-catfinder.png`／`after-mobile-catfinder.png`、`before-desktop-topicscope.png`／`after-desktop-topicscope.png`、`before-mobile-topicscope.png`／`after-mobile-topicscope.png`、`before-*-uc444.png`／`after-*-uc444.png`。
- 舊分享連結 `?q=機票&category=B｜作者實作自述，未獨立重現` 在修正後是 **0 / 515**、顯示空結果、條件 chip 仍列出該值且可移除、無 pageerror；按「清除篩選」回到 `?q=機票` 的 11 筆。
- 三個訪客情境在修正後預覽（1440×900、390×844）重走：
  1. 不知道工具名：首頁痛點入口「會議整理」→ 查詢框 `會議`、27 / 515 筆、第一則 UC-094。
  2. 組合篩選：`機票` 11 筆 → 實作門檻「進階開發」1 筆 → 再選情境「創作」0 筆，空結果列出「移除實作門檻「進階開發」→ 查看 1 筆」等復原入口；按「清除篩選」回到 11 筆、關鍵字保留。
  3. 分享直鏈：`?q=會議&case=UC-094` 開詳情 → Escape 關閉後 `dialog#detail.open === false`、查詢框仍 `會議`、筆數仍 27 / 515。
- 修正後預覽的 axe（首頁／結果 `?category=產品回饋／版本通知`／詳情 UC-444，1440 與 390）**違規 0**、水平溢出 0、pageerror 0。
- 限制：**本環境無法讀取截圖影像**（`read` 回報 image reading disabled），視覺結論全部來自 DOM 文字、幾何與 axe，沒有目視判讀。只跑 Chromium；Firefox／WebKit 由 PR 上的既有 workflow 覆蓋。

## 同輪 CI 修復：PR 上的 Corpus bundle QA 紅燈不是這次改動造成的

本輪 PR 唯一紅的檢查是 `Corpus bundle QA` 的「Bundle, full visitor journeys and source recovery」（[42806867753](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42806867753)，`28ad2137`，5 分 21 秒），失敗點是 `tests/arrival-live.cjs:63` 等不到 `.detail-source[href]`（30 秒逾時）。

- **不是本輪造成的證據**：本輪 diff 只有 7 行案例分類、1 支新測試與文件，沒有動 `assets/`；同一支測試在本機對「修正前預覽」與「修正後預覽」都通過；同一支 workflow 用 `workflow_dispatch` 在 main 上跑（[42808574329](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42808574329)）**success**。
- **可重現的條件**：`.detail-source` 只有在整包語料帶著 40 位 revision 時才會有 `href`（`assets/app.js:6-8` 的 `pinSourcePaths`、`:3881` 只在整包路徑呼叫；逐篇備援會 `pinnedSources.delete(path)`）。把同一份預覽的 `catalog.json`／`corpus.json` 的 `sourceRevision` 清空後重跑，得到**完全相同**的 30 秒逾時；帶著 revision 則通過。這個狀態可能來自整包沒贏得下載預算，也可能來自沒有發布版本的建置；兩者讀者看到的都是**設計上正確**的降級（連結停用、保留「查看最新版本」、註明尚未核對發布版本）。該次 run 的 **attempt 2 重跑成功**（同一 commit、同一份內容），所以原本的紅燈是狀態相關，不是這份 manifest 一定壞掉。
- **修法（測試契約，不是放寬）**：`tests/arrival-live.cjs` 改成依讀者實際所在狀態斷言——有 `href` 時必須是 40 位 revision、且隱藏「最新版本」備援；沒有 `href` 時必須 `aria-disabled="true"`、顯示「在 GitHub 查看最新版本」且說明「尚未核對本站發布版本」，並印出 `LIVE_ARRIVAL_UNPINNED` 讓整包退化留下證據。第三種狀態（既沒有 pin、也沒有備援與說明）仍會失敗。原始碼本身的釘版語意仍由 `tests/source-links.test.cjs`、`tests/corpus-bundle.test.cjs` 單元測試守住。獨立複審指出兩個缺口，都已修：①`href=""` 也是可點的連結，pin 的判斷改用「屬性是否存在」而不是字串真值；②同一支 `reader-browser.cjs` 的整庫稽核（`:307`）原本要求每個來源連結都有 http(s) `href`，在未釘版狀態必然失敗，現在改為：有 `href` 就必須是 http(s)，沒有 `href` 就必須是 `aria-disabled="true"` 的相對來源連結，其他情況（含空 `href`、可點卻停用）仍判失敗。兩個缺口都以實測收尾：把來源連結硬改成 `href=""` 後，`reader-browser.cjs` 以 `Unsafe source scheme UC-414` 失敗（空 `href` 被拒）；`.detail-source` 的 `href=""` 會走 pinned 分支並被 40 位 revision 的樣式檢查擋下（`pinnedHref!==null`，不是字串真值）。
- 兩條分支都在本機驗證到**整支測試結束**：帶 revision 的預覽走 pinned 分支（`LIVE_ARRIVAL_PASS`、`PASS CORPUS`），清空 revision 的預覽走 unpinned 分支（`LIVE_ARRIVAL_UNPINNED`、三種尺寸 `PASS`、`PASS CORPUS` 515 筆／4046 段／808 列）。

## 發布

- PR [#342](https://github.com/RichardHan/ai-agent-use-cases/pull/342)（head `caba7c73`）：16 項非略過檢查全部 success、2 項（main-only）skipped；squash 合併為 `2b139d9f`（2026-11-10T12:58:46Z）。
- `pages build and deployment` [42820349429](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42820349429) success（約 30 秒）；正式站 `catalog.json.sourceRevision` = `2b139d9f694bdf2f5e19fa46f156887919f352d9`，512 個來源檔、515 筆條目。
- 正式站重測（Chromium 1440×900／390×844，與修正前的同一組查詢）：`#category` 選項數 345 但不含分級（`gradeOffered:false`）；`?q=未獨立重現&scope=topic` **0 / 515**、`?q=作者實作自述&scope=topic` **0 / 515**、舊分享連結 `?category=B｜…` **0 / 515**；`?category=產品回饋／版本通知` 1 筆（UC-444）。
- 未確認：main 上對 `2b139d9f` 的 `Website QA`（[42820349847](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42820349847)）在停止輪詢時仍停在「Verify the published GitHub Pages site」（>20 分鐘），期間 main 已被 `8765cbdc`、`ab4b51f4`、`8be2f787` 推進，該 run 會被後續 commit 取代；本輪**不宣稱**它通過，正式站的結論來自直接量測（`catalog.json.sourceRevision` 與下列查詢）。
- 正式站三情境（兩個尺寸都走過）：痛點入口「會議整理」27 筆、第一則 UC-094；`機票` 11 筆→加上兩個篩選 0 筆（38 個復原入口）→清除篩選回到 11 筆且關鍵字保留；`?q=會議&case=UC-094` 開詳情、來源固定在 `2b139d9f`、Escape 返回後查詢與 27 筆保留。axe 0 違規、pageerror 0。
