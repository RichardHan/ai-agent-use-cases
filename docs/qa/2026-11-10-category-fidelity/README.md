# 2026-11-10 主題分類把「編輯分級」與「索引表格儲存格」當成主題

## 基準

- 開發基準 `origin/main` `ee68c19d`（`docs(qa): note the record's own deployment`）。隔離 worktree `/tmp/aiuc-1110-r17`（detached HEAD，`git worktree add --detach`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 322 個 commit，另有 159 個未追蹤的他人研究檔（`cases/462` 之後）與 QA 產物；本輪未觸碰、未 reset、未清理。
- 正式站在本輪開始與結束時都是 `ee68c19d`：`catalog.json.sourceRevision` = `ee68c19d94ba17c81be86f4fa7ae621016d06aee`，512 個來源檔、515 筆條目；`index.html`、`assets/app.js`、`assets/style.css`、`assets/reader.js`、`assets/reader.css` 與 checkout 逐 byte 相同。
- 基準 `node --test tests/*.test.cjs`：**684 通過、0 失敗**。
- Actions 重新確認，不沿用歷史敘述：main 最近 20 次 run 全 success（14 次 `pages build and deployment`、6 次 `Website QA`）；全部 branch 最近 100 次 run 只有 1 次 failure（PR #340 新開的 `Corpus bundle QA`）與 22 次 superseded 取消。**目前沒有阻擋發布的 CI 問題，本輪不以 CI 為主題。**
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

## 測試

- 先紅後綠（同一支測試、同一份語料）：對基準資料（`git stash` 掉 7 個案例檔）**3 項全失敗**，訊息分別列出 `UC-444：B｜作者實作自述，未獨立重現` 與 6 筆 `情境｜標籤、…`；修正後 **3 項全通過**。
- `node --test tests/*.test.cjs`：基準 **684** → 本輪 **687 通過、0 失敗**（新增 3 項）。
- 本輪沒有動 `assets/*`、`index.html`、workflow、`INDEX.md`、`README.md`，因此沒有 `node --check` 的新增對象；`scripts/preview.py` 重建預覽為 512 個來源檔。
- 瀏覽器前後比對（Chromium；before = 未修正預覽 8141，after = 修正後預覽 8142；同尺寸、同語料筆數 515）：

| 檢查 | 修正前 | 修正後 |
| --- | --- | --- |
| 分類查找輸入 `未獨立重現`（1440／390） | 找到 1 個分類：`B｜作者實作自述，未獨立重現 1 筆` | 沒有名稱符合的分類（0） |
| 主題範圍 `?q=未獨立重現&scope=topic` | 1 / 515（UC-444） | 0 / 515 |
| 主題範圍 `?q=作者實作自述&scope=topic` | 1 / 515（UC-444） | 0 / 515 |
| 舊分享連結 `?category=B｜作者實作自述，未獨立重現` | 1 / 515（UC-444） | 0 / 515，可移除條件、可復原 |
| 新分享連結 `?category=產品回饋／版本通知` | — | 1 / 515（UC-444） |
| 網站條目數 `#results-count` | 515 / 515 | 515 / 515（未變） |

- 前後截圖（同頁、同尺寸、同資料狀態）：`before-desktop-catfinder.png`／`after-desktop-catfinder.png`、`before-mobile-catfinder.png`／`after-mobile-catfinder.png`、`before-desktop-topicscope.png`／`after-desktop-topicscope.png`、`before-mobile-topicscope.png`／`after-mobile-topicscope.png`、`before-*-uc444.png`／`after-*-uc444.png`。
- 三個訪客情境在修正後預覽（1440×900、390×844）重走：不知道工具名從首頁痛點入口找到案例；搜尋加兩個篩選得到 0 筆再用「清除篩選」復原；分享直鏈 `?q=會議&case=UC-094` 開詳情、Escape 返回後查詢與筆數保留。
- 限制：**本環境無法讀取截圖影像**（`read` 回報 image reading disabled），視覺結論全部來自 DOM 文字、幾何與 axe，沒有目視判讀。只跑 Chromium；Firefox／WebKit 由 PR 上的既有 workflow 覆蓋。

## 發布

（合併與正式站核對後補記）
