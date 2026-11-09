# 2026-11-11 來源憑據說「官方自報」，但本庫沒讀官方原文

## 基準

- 開發基準 `origin/main` `53ae66f1`（正式站 `catalog.json.sourceRevision` 同值，`builtAt` 2026-11-09，510 個來源檔＝506 案例頁＋3 經驗＋1 待查檔）。隔離 worktree `/private/tmp/aiuc-1111-attribution`（分支 `improve/20261111-source-attribution`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 270 個 commit，且有 159 個未追蹤的他人研究檔與 QA 產物；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`：**572 通過、0 失敗**；`node --check assets/app.js` 通過。
- main 現況重新確認（不沿用歷史故障）：`main` 最近 20 次 run 全 success（`Website QA` #721、`pages build and deployment` #1515 皆對 `53ae66f1`）；repo 最近 50 次只有 1 次 failure（`Website QA` #719 在 `improve/20261109-r7`，下一 commit #720 success），2 次 cancelled 是 `cancel-in-progress` 的設計行為。正式站 `assets/app.js` sha256 與 worktree 逐 byte 相同（`cd0fe87c…`，329,136 bytes）。

## 問題證據

目標使用者是**從分享連結或搜尋結果判斷「這條線索可不可信」的人**：他會先看詳情第一屏的「來源憑據」與「成果主張來源」，再決定要不要讀步驟。

`assets/app.js` 的 `declaredEvidenceClass()` 只用 token 判斷「誰提出主張」，不記錄「本庫怎麼取得」。於是兩個案例頁明明寫了取得限制，詳情頁卻印成第一手官方自述：

| 案例 | 頁首證據狀態（原文） | 基準詳情第一屏 | 頁面自己怎麼說 |
| --- | --- | --- | --- |
| UC-514 | ``official`（Spaces 功能與官方作例，經來源轉述）＋`designed`（…）` | `官方自報`／`成果主張：主要 官方團隊／原廠自述` | `一句話用途`：兩者都是依官方功能設計的請求…**本庫未重現** |
| UC-316 | ``official`（廠商工作坊示範與官方影片說明；Team Bots 官方文件已讀）。本庫**未觀看影片**，流程細節來自影片說明欄的官方章節與第三方文字整理` | `官方自報`／`成果主張：官方團隊／原廠自述` | `### S-316A：官方工作坊影片（說明欄與章節已讀，影片未看）`；`S-316B：第三方文字整理` |

同一支分類器還有一個跨子句缺陷：`declaredEvidenceClass()` 的最後一條官方規則是 `/官方.*(?:…自報…)/`，`.*` 會跨過 `＋`。UC-024 的頁首是「dots官方轉述＋Grok Bot作者自報與後續錯誤」，於是整頁被歸成 `官方自報`，詳情第一屏寫「成果主張：主要 官方團隊／原廠自述」——而該頁自己的 `證據類型` 欄寫的是「**官方轉述早期使用者經驗**；不是作者本人操作測試」。全庫受影響 1 頁（其餘 512 頁的分類不變，逐檔比對見下）。

另外，待查線索的卡片文案與來源檔相反（上一輪留下的第 3 項）：

| 位置 | 基準文字 | `sources/pending.md` |
| --- | --- | --- |
| `assets/copy.json` P-002 `how` | 「目前先查原始貼文與業者確認，尚不提供已驗證的操作流程。」 | `:15`「2026-10-17 已處理。三則原帖以X API直接讀到…已併入 UC-028」 |
| `assets/copy.json` P-004 `caution` | 「目前只有作者留言，未見完整產物或中標證明…」 | `:34`「2026-10-16 已處理：公開原作者結果補讀後，已併入 UC-101…另記 UC-102」 |

P-002 詳情因此同一屏出現「本條目已結束：內容已併入 UC-028」與「目前先查原始貼文與業者確認」。

## 兩個方案

- **A（採用）保留六個來源類別，另加一列「取得方式」。** 類別回答「誰提出主張」，取得方式回答「本庫有沒有讀到原文」；只有案例頁自己在 `official` 同一句宣告轉述時才加註。卡片可見標籤、篩選值、計數口徑全部不動。
  - 價值：不再讓轉述冒充第一手；一般讀者不必讀原文就知道要自行開啟官方來源；既有分享連結與篩選語彙不變。
  - 成本：`assets/app.js` 4 處（分類器子句化、`relayedEvidenceClasses()`、`metadata().relayedProof`、徽章／摘要／憑據說明／卡片）、`assets/reader.css` 2 行、`index.html` 1 句、`README.md`／`templates/case.md` 各 1 段、`assets/copy.json` 2 個字串、1 支新測試檔。
  - 取捨：`官方自報` 篩選仍同時包含「直接讀官方」與「經轉述」兩類（因為主張者確實是官方團隊）；差別只在詳情與 hover／讀屏可見。
- **B 新增第七個類別 `官方轉述`。** 可以直接篩選「未完整核讀官方原文」的官方主張。
  - 價值：篩選層就能分開。
  - 成本：`PROOF_DEFINITIONS`／`PROOF_CLAIMANTS`／`PROOF_VERIFICATION_STATUS`／`PROOF_STATUS_SHORT`／`PROOF_SAFE_ADOPTION_TIP` 五份字典、`style.css` 與 `reader.css` 配色、`tests/source-guide.test.cjs` 的類別順序斷言、排序與計數；且把「取得方式」混進「誰主張」的同一個維度。

選 A：錯誤是「兩個事實被壓成一個標籤」，正確修法是把它們分開講，而不是再造一個混合維度；B 也會讓想看官方主張的人漏掉經轉述的官方主張。

## 改動

- `assets/app.js`
  - `declaredEvidenceClass()`：`official`／`author-demo`／`作者` 三條規則改為逐子句比對（`＋`／`；`／`+`／`;`），錨定規則（`unverified`／`designed`／模板／`FIRST_PARTY_LEAD`）仍看整行，`V＋B，服務商員工…` 這種等級寫法不受影響。全庫 513 筆只有 UC-024 的主要類別變動（`官方自報`→`作者報告／示範`）。
  - `declaredEvidenceClassesOfClause()`：`官方轉述` 不再算 first-party（轉述是轉述，不是自報）；只有 UC-024 使用這個寫法，改後其類別只剩 `作者報告／示範`。
  - 新增 `RELAYED_OFFICIAL` 與 `relayedEvidenceClasses()`：只在 `official` 宣告自己的括號與緊接的句子片段裡找轉述線索（`經…轉述`、`官方轉述`、`二手轉述`、`未觀看影片`、`影片未看`、`未讀官方`…）。同一行後段描述別的來源（`…快照回滾事件為二手轉述 unverified`、`…通話影片（本庫未看）`）不會誤套。
  - `metadata()` 回傳 `relayedProof`（目前只有 UC-316、UC-514 非空）。
  - `proofBadges()`／`card()`：可見標籤仍是類別名（等於篩選值），`aria-label`／`title` 追加「官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文」，並加 `data-proof-provenance="relayed"`。
  - 詳情第一屏：`成果主張` 行加「（官方內容經第三人轉述）」，並新增一列「取得：官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文」，複製筆記與延伸閱讀也帶同一句。
  - 完整憑據說明：新增 `.proof-note-provenance` 段落，寫明「來源憑據仍記為官方自報，因為成果主張來自官方團隊；但這不等於本庫核讀過官方頁面」。逐類清單也會標註。
- `assets/reader.css`：`.detail-trust-provenance`、`.proof-note-provenance` 兩個小區塊（12–13px、左側 2–3px 琥珀色框，沿用既有 `#fbf6ec`／`#b8862d` 家族，不新增色票）。
- `index.html`：來源說明加一句「取得方式與主張來源分開看…」。
- `README.md`、`templates/case.md`：說明宣告慣例（官方內容若是轉述，寫在 `official` 同一行，網站會據此標示）。
- `assets/copy.json`：P-002 `how` 改為「三則原帖與一則業者確認簡訊已讀，內容併入 UC-028；仍不提供已驗證的操作流程。」；P-004 `caution` 移除「目前只有作者留言」，其餘保留。
- `sources/README.md`：S-002 與 P-001 是同一支影片，原本寫「作者、發布日、原文語言：待查」，與 `sources/pending.md:9` 的 2026-10-17 補查結果相反；改成同一組事實並連結 P-001（未新增未查證內容）。

## 獨立審查（未參與實作）與修正

獨立審查者用自己的 vm harness 在 `HEAD` 與工作樹各跑 513 筆 `metadata()`，確認**只有 UC-024 一筆的主要類別與類別清單變動**，`relayedProof` 只有 UC-316／UC-514 非空，其餘 510 筆的卡片與詳情輸出不變；`scenario`／`kind`／`difficulty`／`tool`／`category` 五個 facet 與分享連結、搜尋、直鏈都無回歸。它也在未改動的 `app.js` 上跑新測試：6 項全數失敗（不是空轉測試）。

審查提出四項，三項已修、一項列為下一輪：

1. **（已修）取得方式的措辭對 UC-316 過強**：該頁其實讀了 Team Bots 官方文件與影片說明欄，只沒看影片，原句「本庫未讀官方原文」不成立。改為「官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文」，完整說明同步改寫（`assets/app.js`、`README.md`、`templates/case.md`、`index.html` 與本文件一致）。
2. **（已修）複製筆記與延伸閱讀沒有取得方式**：`renderRelated()` 與「📋 複製本篇筆記」原本只寫 `來源類型：官方自報`／`📎 來源證據：官方自報`，現在同一句會附上取得方式，避免分享出去的筆記又變回第一手自報。
3. **（已修）潛在的跨子句誤判**：`relayedEvidenceClasses()` 原本把 `official` 括號後的 `＋author-demo（…本庫未觀看影片）` 也吸進視窗；改為只有句號後的下一句才算同一個宣告。新增一條回歸。
4. **（未修，下一輪）** 審查指出 `app.js:931` 只取第一個併入目的地，P-004 的 UC-102 不會出現在徽章與站內入口；這與本輪主題無關，已列入下一輪。

審查未能驗證：截圖影像內容（工具無法讀圖，改以 DOM 文字與色彩 histogram 佐證）、VoiceOver／NVDA 實際播報、WebKit／Firefox、正式站（只有本機 preview）。這些限制同樣記在下方。

## 前後數據（Chromium，本機 preview，同 base path）

| 量測 | 修改前 | 修改後 |
| --- | --- | --- |
| 來源類型筆數（合計 513） | 官方自報 **29**／作者報告／示範 462 | 官方自報 **28**／作者報告／示範 **463** |
| UC-024 徽章 | `官方自報`＋`作者報告／示範` | **`作者報告／示範`** |
| UC-024 第一屏 | 成果主張：主要 官方團隊／原廠自述 | **成果主張：社群作者／專案實踐者** |
| UC-514／UC-316 徽章可見文字 | `官方自報` | `官方自報`（不變，篩選值一致） |
| UC-514 `aria-label` | `來源憑據（主要）：官方自報。官方或原廠團隊…` | `來源憑據（主要）：官方自報，官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文。…` |
| 複製筆記／延伸閱讀 | 只有 `來源證據：官方自報`／`來源類型：官方自報` | 追加同一句取得方式 |
| UC-514／UC-316 第一屏 | 只有「成果主張」「核讀」 | 另加「**取得：官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文**」 |
| UC-514／UC-316 完整憑據 | 無取得方式 | 新增取得方式段落 |
| UC-007（直接讀官方） | 無取得方式 | **無**（不受影響） |
| P-002 怎麼開始 | 「目前先查原始貼文與業者確認…」 | 「三則原帖與一則業者確認簡訊已讀，內容併入 UC-028…」 |
| P-004 要注意什麼 | 「目前只有作者留言，未見完整產物…」 | 「未見完整產物或中標證明，提示詞為自設未測…」 |
| 首頁統計／收錄狀態 | 506／3／2、待查 4（含 2 已併入） | 同值（未動） |
| 水平溢出（1440／390／320） | 0 | **0** |
| pageerror | 0 | **0** |
| axe（wcag2a/aa，首頁與 UC-514 詳情） | — | 0 違規 |

同一頁面、同一資料狀態的前後截圖（1440×900、390×844、320×740）：

- `before-*-detail-UC-514.png` / `after-*-detail-UC-514.png`（轉述型官方）
- `before-*-detail-UC-316.png` / `after-*-detail-UC-316.png`（未看影片）
- `before-*-detail-P-002.png` / `after-*-detail-P-002.png`（待查線索頁首；1440／390／320）
- `before-*-guidance-P-002.png` / `after-*-guidance-P-002.png`、`before-*-guidance-P-004.png` / `after-*-guidance-P-004.png`（展開後的「怎麼開始／要注意什麼」，才是文案差異所在）
- `before-*-detail-UC-024.png` / `after-*-detail-UC-024.png`（跨子句誤判修正）
- `before-*-detail-P-004.png` / `after-*-detail-P-004.png`（待查線索限制文案）
- `before-{desktop,mobile}-source-guide.png` / `after-{desktop,mobile,small}-source-guide.png`（來源說明新增的取得方式句）

本機**無法讀取影像內容**，視覺結論以 DOM 文字、幾何與 `aria` 值為準；截圖只供人眼核對。

## 驗收走查（本機預覽，Chromium，1440×900／390×844／320×740）

三情境，全部 0 pageerror、0 水平溢出、axe 0 違規：

| 情境 | 操作 | 結果 |
| --- | --- | --- |
| 1. 不知道工具名的新訪客 | 首頁按 `/` → 焦點在 `#query` → 輸入「整理會議記錄」→ Enter | 8 / 513 筆；第一張卡在視窗內（1440：235、390：302、320：322px） |
| 2. 組合搜尋與篩選遇空結果 | `?q=規劃旅行&scenario=工作` | 0 筆並顯示空結果區；復原動作「移除使用情境「工作」→ 查看 1 筆」→ 點擊後 1 筆，網址只留 `q` |
| 3. 分享的詳情連結 | `?case=UC-514` → 讀憑據 → Escape | 徽章 `官方自報`、`aria` 含取得方式、憑據段落可見、來源連結固定到 `blob/53ae66f…`；Escape 後對話框關閉、回到探索 513 筆，第一張卡 top 106px |

## 測試

- 基準 `node --test tests/*.test.cjs` 572 通過；本輪新增 6 項，最終 **578 通過、0 失敗**：
  - `tests/relayed-source-provenance.test.cjs`：子句規則不得跨 `＋` 借用（UC-024 主要類別；`V＋B，服務商員工…` 與 `官方自報內部實作…` 仍為官方自報）；`relayedEvidenceClasses()` 認得 UC-514／UC-316 的宣告、不認得「後段描述別的來源」與直接讀官方；卡片可見文字不變而 `aria`／`title` 有取得方式；詳情徽章與逐類清單；來源類型 facet 仍一筆一分類且 UC-024 不再計入官方；已併入的待查線索文案不得再寫「目前先查／只有作者留言」。
  - 先紅後綠：在未改動的 `assets/app.js` 上跑同一支測試，6 項全數失敗。
- `node --check assets/app.js` 通過；`assets/copy.json` JSON 解析通過。

## 已知限制

- 「取得方式」目前只涵蓋 `official` 宣告，且只認得案例頁自己寫出的轉述線索（字面比對）。沒寫線索的頁面不會被標示——這是有意的：不從內文猜本庫讀了什麼。
- `官方自報` 篩選仍同時包含直接讀官方與經轉述兩類；卡片**可見文字**只有類別名，取得方式在 hover／讀屏與詳情頁。
- UC-514 的主要類別仍是案例頁宣告順序的 `官方自報`（頁首先寫 `official`）；本輪沒有重排類別順序，只把「取得方式」與「另宣告 設計／未實跑」講清楚。
- UC-024 的主要類別由 `官方自報` 改為 `作者報告／示範`，來源類型計數因此 29→28／462→463；`INDEX.md` 與統計卡未變（它們不列來源類型）。
- 未處理：P-004 的第二個併入目的地 UC-102 仍只顯示 UC-101（`app.js` 的 `mergedInto` 只取第一個 `UC-\d{3}`）；`sources/qualification-audit-2026-10-16.md` 的無日期段落仍把 P-002 算作待查。這些不影響本輪畫面正確性，留待下一輪。
- 沒有真人使用者研究；「讀者會不會因此更願意自己點官方來源」未量測。

## 發布

| 狀態 | 內容 |
| --- | --- |
| 已提交 | `4b626f08`（rebase 到 `8acec384` 後） |
| 已推送 | `origin/improve/20261111-source-attribution` → PR [#301](https://github.com/RichardHan/ai-agent-use-cases/pull/301) |
| PR 檢查 | head `4b626f08` 14 項非略過檢查全 pass；`published` 依設計在 PR 上 skipping（`gh pr checks 301`） |
| 已合併 | squash `f679b9c8462afc3e8fb5465c47fe2d37dbe409e4`（base `8acec384`） |
| 部署 | `pages build and deployment` [42609887367](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42609887367) success（build／report／deploy） |
| 合併後 main QA | `Website QA` [42609888086](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42609888086) **success**：第 14 步「Wait for published assets and content」通過、第 15 步 fail-closed 因已驗證而 skipped、第 16 步正式站瀏覽器走查 success |
| 正式站已驗證 | 是：`catalog.json` 的 `sourceRevision` 為 `f679b9c8…`、`builtAt` 2026-11-09、510 個來源檔；`assets/app.js`（`38e20a87…`）、`assets/copy.json`（`266e01bf…`）、`assets/reader.css`（`de668425…`）與合併版本 sha256 逐 byte 相同 |

### 正式站核對（`f679b9c8`）

Chromium 1440×900／390×844／320×740，正式站 `https://richardhan.github.io/ai-agent-use-cases/`：

| 檢查 | 結果 |
| --- | --- |
| 來源類型計數 | 官方自報 **28**、作者報告／示範 **463**、公開資料核讀 6、尚待查證 12、設計／未實跑 3、模板／文件核讀 1（合計 513） |
| 收錄狀態 | 506／3／4（待查 2 筆＋已併入 2 筆），統計卡 2 |
| UC-514 | 徽章 `官方自報`＋`設計／未實跑`；`aria` 含「官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文」；第一屏有「取得：」列與完整取得方式段落；原始 Markdown 固定到 `blob/f679b9c8…` |
| UC-316 | 同組取得方式文字，單一 `官方自報` 徽章 |
| UC-024 | 徽章只有 `作者報告／示範`，第一屏「成果主張：社群作者／專案實踐者」 |
| UC-007（直接讀官方） | 無取得方式列，`aria` 不含新句 |
| P-002 | 怎麼開始：「三則原帖與一則業者確認簡訊已讀，內容併入 UC-028…」 |
| P-004 | 要注意什麼：「未見完整產物或中標證明，提示詞為自設未測…」 |
| 情境 1（`/` → 「整理會議記錄」→ Enter） | 8／513 筆，第一張卡在視窗內（235／302／322px） |
| 情境 2（`?q=規劃旅行&scenario=工作`） | 0 筆 →「移除使用情境「工作」→ 查看 1 筆」→ 1 筆 |
| 情境 3（`?case=UC-514` → Escape） | 詳情顯示取得方式；Escape 後回到探索 513 筆，第一張卡 106px |
| pageerror／水平溢出／axe | 三個寬度皆 0 |

## 下一輪

先做 **待查線索的多個併入目的地**（`P-004` 併入 UC-101／UC-102，畫面只說 UC-101）：`app.js:931` 只抓第一個 `UC-\d{3}`，徽章、`已併入 null` 的防護與站內入口都吃這個單值。驗證先讀 `sources/pending.md:34` 與 `INDEX.md:544`，再開 `?case=P-004` 對照全文；同時補一條「狀態有日期但沒有 `併入 UC-nnn`」的防護回歸。
