# 2026-11-11 作者自述其實是二手轉述時，卡片與詳情仍讀成第一手

## 基準

- 開發基準 `origin/main` `0f40758b`，隔離 worktree `/private/tmp/aiuc-1111-r20`（分支 `improve/20261111-round20`）。原工作樹停在 `90093d7b`、有 159 個未追蹤檔，本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`：開工時 `0f40758b` **718 通過、0 失敗**；期間 main 前進到 `98d7e4e6`（#364／#365），rebase 後基準 **721**。`node --check assets/app.js` 通過。
- 正式站 `catalog.json.sourceRevision` = `0f40758b…`，與開工時 main 相同；`INDEX.md` 511 列、`cases/` 508 頁、`evidence/` 3 篇、`sources/pending.md` 2 條未處理＋2 條已併入，與首頁統計一致。
- Actions 現況重新確認：main 最近 40 次 run 全 success（含 `pages build and deployment` 與 `Website QA`）；本輪開工時最近 300 次 run 有 0 次 failure、40 次 cancelled（57 支 workflow 皆有 `concurrency:` + `cancel-in-progress`，PR 被下一個 commit 取代屬預期）。本輪不是修 CI。

## 問題證據

目標使用者是**用案例判斷「這是不是作者本人做的」的訪客**。本庫把「誰提出主張」「本庫怎麼取得」「核讀狀態」分成三件事，但「取得方式」先前只實作在 `官方自報`：

- `assets/app.js`（基準）`relayedEvidenceClasses()` 第一行是 `if (!/\bofficial\b/i.test(proofLine)) return [];`，只回傳 `['官方自報']`；`PROOF_PROVENANCE` 只有一個 `relayed` 文案。
- 515 筆條目中，頁首宣告 `作者報告／示範` 的有 **470** 筆，`官方自報` 61 筆；基準只有 2 筆（UC-316、UC-514）帶取得方式註記，兩筆都是官方。
- 頁首自己說取得方式是二手、卻沒有註記的作者案例（同一子句內宣告）：

| 案例 | 頁首自己寫的 | 基準卡片／第一屏 |
| --- | --- | --- |
| UC-282 | `author-demo（經 ChatGPT Pro Community 訪談轉述）` | 卡片只印「作者報告／示範」；詳情第一屏「成果主張：社群作者／專案實踐者」，沒有取得方式 |
| UC-093 | `author-self-report`（Greg Isenberg 訪談影片的轉載摘要頁）；影片逐字稿本庫未看 | 同上 |
| UC-049 | `author-demo`（X 上的作者自述、影片轉述與跨產品比較）；正文：「以下是二手轉述」 | 同上 |

正式站（`0f40758b`）實測 UC-282：卡片 `作者報告／示範`、`title`／`aria-label` 都沒有取得方式；詳情第一屏 `成果主張：社群作者／專案實踐者`／`核讀：本庫未獨立重現`，要往下到「頁首證據說明」才看到「經…訪談轉述」。390×844 與 1440×900 相同。

## 兩個方案

- **A（採用）把同一條子句規則延伸到作者宣告，並讓取得方式在卡片上看得見。**
  - 做法：`declarationWindow()` 抽出原本的「宣告子句」範圍（自己的括號＋緊接的句子；`＋`／`；` 是另一個來源），官方與作者各自用一份轉述字樣；`PROOF_PROVENANCE` 改成以類別為鍵，兩種文案；卡片在憑據旁多一個可見的「取得：經轉述」標記（憑據文字仍是篩選值）；詳情第一屏、長註記、複製筆記、延伸閱讀共用同一份文字。
  - 價值：三筆作者案例的卡片與第一屏不再暗示第一手；未來任何在宣告子句寫明轉述的頁面自動取得同樣標記。
  - 成本：`assets/app.js` 約 40 行改寫、`assets/style.css` 1 條規則、`templates/case.md` 1 條規則、2 支測試。
  - 取捨：卡片多一個 84×25px 的標記（只在 5 筆出現）；320px 的 UC-282 卡片底部由 57px 變 90px（換行），1440／390 不變。
- **B 只改那三頁的頁首文字，不動程式。**
  - 成本最低，但卡片仍然只印「作者報告／示範」，讀者要看完整頁首才知道；下一頁再寫一次轉述又會漏。不採用。

## 改動

- **`assets/app.js`**
  - `PROOF_PROVENANCE` 由 `{relayed:{…}}` 改為以類別為鍵：`官方自報`、`作者報告／示範` 各有 badge／claimant／note。作者版：「作者內容經第三人轉述或僅讀摘要整理，本庫未取得作者原文」。
  - 新增 `relayedProofLabels(item)`、`provenanceText(item,key)`；所有顯示點（卡片 title/aria、詳情籌碼、第一屏 `取得：`、長註記、延伸閱讀、複製筆記）改用同一份文字。
  - `relayedEvidenceClasses()` 改為：官方 token 與作者宣告（`author-demo`／`author-self-report`／`作者自述`／`作者實測`／`作者實作`）各自取自己的宣告子句，回傳被轉述的類別。官方行為不變。
  - `RELAYED_AUTHOR` 只認**取得方式**的轉述字樣（經…轉述、訪談轉述、影片轉述、轉載摘要頁、二手…、未取得作者原文、只讀到摘要）；刻意不收「影片未看」「只看縮圖」，因為作者貼文本身已讀時那只是缺口，不是轉述。
  - 卡片在憑據後加 `<span class="proof-relayed">取得：經轉述</span>`（`role="note"`、`aria-label` 帶完整句子），只在该類別被標記時出現。
- **`assets/style.css`**：`.card-bottom .proof-relayed`（11px、虛線框、`max-width:100%`、`overflow-wrap:anywhere`）。
- **`templates/case.md`**：在 `證據狀態` 下補一條——作者經驗若只讀到訪談摘要、粉絲帳號的影片轉述或二手整理，要寫在 `author-demo` 同一行；旁邊影片沒看不算轉述，寫在缺口即可。
- **測試**：`tests/relayed-source-provenance.test.cjs` 新增作者子句的正反例（含 UC-368／UC-459／UC-295／UC-512 這些「影片沒看但貼文已讀」不得誤標）、卡片標記、複製筆記；`tests/evidence-attribution-browser.cjs` 新增 390px 的作者案例實走（卡片標記、第一屏取得方式、axe 0）。

## 測試

- `node --test tests/*.test.cjs`：rebase 後基準 **721** → 本輪 **723 通過、0 失敗**；`node --check assets/app.js`、`node --check tests/evidence-attribution-browser.cjs` 通過。
- 先紅後綠（單元）：把 `assets/app.js` 換成 `0f40758b` 版本，新的 8 項中 **4 項失敗**（取得方式清單、作者子句、卡片標記、複製筆記），修正後 8 項全過。獨立審查追加的子句邊界案例（`official＋author-demo（…轉述）`、同一行兩次 `author-demo`、英文 `interview summary`、括號內分號）也一併寫進測試。
- 先紅後綠（瀏覽器）：`ATTRIBUTION_URL=http://127.0.0.1:8096/… node tests/evidence-attribution-browser.cjs`（基準建置）在第一個新斷言失敗：`the card says the account came through a retelling: null !== '取得：經轉述'`；同一支對本輪預覽 exit 0，`author-relayed` 列 `{card:"取得：經轉述", provenance:"取得：作者內容經第三人轉述或僅讀摘要整理，本庫未取得作者原文", axe:0}`。
- 分類器實測（同一語料）：標記由 2 筆變 **5 筆**——`UC-049`、`UC-093`、`UC-282`（作者）、`UC-316`、`UC-514`（官方）。反例輸出皆為空：`author-demo（作者自述＋網站公開頁面已讀）＋第三方看完影片後的評論（本庫未看影片）`、`author-demo（…來源A 貼文各附影片，本庫只看影片縮圖未播放）`、`B，作者實際診斷自述；客服認同亦為作者轉述`、`author-demo（Muse 作者使用自述，貼文由 Muse 協助撰寫）`。
- `tests/combined-recovery-browser.cjs`（本輪預覽）：chromium 1440／390 通過，exit 0。
- 篩選計數不變（前後同一頁）：`?q=UC-514` 的來源類型選項 `作者報告／示範=1、官方自報=1` 在兩版相同；`顯示 2 / 515` 不變。
- 版面（`measurements.json`）：卡片標記 84×25px；卡片底部 1440／390 = 57px（不變）、320 = 90px（換行）；三種寬度水平溢出 0。

## 三種訪客情境（本輪預覽，1440×900／390×844）

1. **不知道工具名，從問題找案例**：`?q=怎麼把會議記錄變成待辦事項` → 12／515，第一張「會議結束承諾就散了？…」可開；Escape 關閉後查詢保留。
2. **組合搜尋遇空結果再復原**：`?q=規劃旅行&scenario=工作` → 0／515，第一個建議「移除使用情境『工作』 → 查看 1 筆」點擊後 1 筆。
3. **開啟分享的詳情直鏈**：`?case=UC-282` 直接開啟，第一屏現在是 `成果主張：社群作者／專案實踐者（作者內容經第三人轉述）`＋`取得：作者內容經第三人轉述或僅讀摘要整理，本庫未取得作者原文`（390px y=396–444、1440px y=311–337，都在首屏）；關閉後回到 515 筆、焦點在 `#results-count`。

## 前後截圖

`before-{desktop,phone,small}-{card,detail}-UC282.png` 與 `after-…`（同頁、同尺寸、同語料），量測見 `measurements.json`。本環境無法讀取截圖影像，視覺結論來自有界幾何、computed style 與 axe。

## 獨立審查（未參與實作）

`reviewer`（獨立 context）讀本輪 diff、用 `node:vm` 對分類器做對抗輸入、並在基準與本輪預覽各量一次卡片幾何、facet 計數與 axe。結論 **needs fixes**，兩項都已修：

1. **宣告子句會吃到下一個來源的括號**（例如 `official＋author-demo（作者內容經來源轉述）` 會把作者的轉述算到官方；同一行第二個 `author-demo` 完全沒被檢查）。修法：`declarationWindow()` 改成在括號深度 0 才把 `＋`／`；` 當邊界，括號內的分號不再截斷宣告；`declarationStatesRelay()` 逐一檢查每個 token 出現位置。回歸案例已寫進單元測試。
2. **只認中文轉述字樣**。修法：`RELAYED_AUTHOR` 增加英文取得方式字樣（`interview summary`、`summary page`、`retelling`、`reposted`、`second-hand`、`original post … not read/found`、`via a summary/retelling`）。目前語料沒有受影響頁面，屬預防性補齊。

審查另確認：五筆被標記頁面的頁首都支持文案（`cases/049…md:11`、`:13`、`cases/282…md:12`、`cases/316…md:12`、`cases/514…md:12`）；預覽與基準的來源類別計數與預設排序相同（515 筆）；320／390／1440 的卡片標記沒有溢出、沒有新增 tab stop、axe 0；正式站相關列的取得方式文字也正確。審查未能驗證：螢幕閱讀器實際朗讀；只有 Chromium 的自動化 axe。

## 已知限制

- 只處理**頁首宣告子句**裡的轉述。像 UC-332 這種「作者清單已讀、另外用了二手資訊圖」的頁面維持不標記；UC-024「dots 官方轉述＋Grok Bot 作者自報」的官方部分不是宣告類別（既有測試已固定它算作者類別），本輪不動。
- `作者自述` 等中文 token 只在宣告子句內生效；沒有 token 的散文式頁首（例如 `B，作者實作自述…`）仍不會被自動標記。
- 卡片標記是新增的可見元素，只在 5 筆出現；沒有做螢幕閱讀器實測，axe 與 aria 文字是目前的證據；延伸閱讀列沿用同一個 `provenanceText()`，由正式站 UC-049 的相關列人工核對，沒有專屬單元斷言。
- 本機只跑 Chromium；Firefox／WebKit 交由 PR 上既有 workflow。

## 發布

- PR [#366](https://github.com/RichardHan/ai-agent-use-cases/pull/366)（head `40e5d732`，base `98d7e4e6`）：16 項非略過檢查 success、2 項 `published` 依設計 skipping——`Website QA` [42915015480](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42915015480)、`Source guide QA` [42915015138](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42915015138)、`Corpus bundle QA`、`Reading flow QA`、`Reader QA`、`Search context QA`、`Search relevance QA`、`Return visibility QA`、`Related reading QA`、`Partial Load QA`、`Reader search QA`、`Missing shared case QA`、`Find reader sections QA`、`Home search entry QA`、`Round 23 acceptance QA`、`Audit summary round QA`。
- squash 合併為 `8f515af3`；`pages build and deployment` [42916924091](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42916924091) success。
- 正式站 `catalog.json.sourceRevision` = `8f515af379cb4a65be26ef793effc13b31ce236d`、512 個來源檔；`assets/app.js`、`assets/style.css`、`templates/case.md` 與合併版本逐 byte 相同（SHA-256 比對）。
- 正式站重走（1440×900／390×844）：`?q=診所` 3／515，UC-282 卡片有 `取得：經轉述`（84×25px、卡片底部 57px、溢出 0）；`?case=UC-282` 第一屏 `取得：作者內容經第三人轉述或僅讀摘要整理，本庫未取得作者原文` 在視窗內；`?case=UC-514` 仍是官方文案；`?q=怎麼把會議記錄變成待辦事項` 12／515；`?q=規劃旅行&scenario=工作` 0 → 建議「移除使用情境『工作』 → 查看 1 筆」→ 1 筆；`?case=UC-024` 關閉後 515 筆、焦點 `#results-count`；兩個尺寸 axe 0、pageerror 0。
- main 的 `Website QA` [42916925258](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42916925258) 於交付時仍在執行；它的結論不影響上面的逐 byte 與實站核對，但不冒稱成功。

## 下一輪

先做 **`sources/pending.md` 的 P-001／P-003 仍是「待查」但沒有任何查證日期**：首頁統計把它們算成 2 個待查線索，卡片與詳情卻說不出最後一次查是什麼時候，`?sort=reviewed` 也把它們排在最後。先做的驗證：讀 `sources/pending.md` 兩條的狀態行與 `INDEX.md` 對應列，量 `?case=P-001`／`?case=P-003` 的徽章與核對日，再決定是補日期、標「未查證」或把它們從「最近核對」排序中排除。
