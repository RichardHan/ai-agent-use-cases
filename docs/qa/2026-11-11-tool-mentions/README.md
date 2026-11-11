# 2026-11-11 卡片第一行的工具是從來源網址讀來的

## 基準

- 開發基準 `origin/main` `b004390a`（= 開工時的 main head，也是當時正式站 `catalog.json.sourceRevision`）。隔離 worktree `/private/tmp/aiuc-1113-round1`（分支 `improve/visitor-20261113-round`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`，落後 main 113 個 commit，另有 159 個未追蹤研究檔（皆已存在於 origin/main）；本輪未觸碰、未 reset。
- 基準 `node --test tests/*.test.cjs`：**736 通過、0 失敗**；`node --check assets/app.js` 通過。
- 正式站條目 518 筆（511 個主要案例頁＋3 篇經驗＋2 個待查線索＋2 個已併入的待查線索）。
- Actions 現況重新確認：main 最近 12 次 run 全部 success（`pages build and deployment` 56–70 秒、`Website QA` 9m46s–11m22s）；11-13 的 600 秒部署逾時與 11-10 的灰色裁決沒有再出現。本輪 CI 沒有改動。

## 問題證據

目標使用者是**用工具挑案例、或看卡片第一行判斷「這篇用了什麼」的訪客**。

`assets/app.js:1226` 對**整份 markdown**比對 `TOOL_PATTERNS`（`assets/app.js:219` 的 10 個固定字串），因此來源連結的網址也被算成案例提到的工具。正式站 `b004390a` 實測（Chromium，1440×900／390×844 一致）：

| 位置 | 讀者看到的 | 案例頁實際宣告與內容 |
| --- | --- | --- |
| 搜尋「觀星」的卡片 | `UC-210 · Grok Bot / GitHub` | `cases/210-astronomy-conditions-target-planning.md:7` 宣告 `Grok Bot／Astronomer／Astro Engine／Python Host`；`github` 只出現在 `:45-50` 的來源連結 |
| `?tool=GitHub#explore` | `顯示 136 / 518 筆收錄` | 其中 50 筆的 `github` 只在網址裡 |
| 工具選項 | `136 · GitHub`、`54 · Cursor`、`34 · Notion`、`33 · Google Drive` | 同上；`UC-042` 的 Cursor 只來自 `https://cursor.com/docs/grok-bot` |

同一份語料量測（511 個案例檔＋evidence＋pending，以 `withoutSourceUrls()` 去掉連結目的地後重新比對）：

| 工具 | 修正前 | 修正後 | 只因網址而掛上的條目 |
| --- | ---: | ---: | ---: |
| GitHub | 136 | 86 | 50 |
| Cursor | 54 | 46 | 8 |
| Notion | 34 | 33 | 1 |
| Google Drive | 33 | 32 | 1 |
| Meta Muse | 202 | 201 | 1 |

61 個條目（59 個案例頁、1 篇經驗、1 個待查線索 P-003）至少失去一個工具，沒有任何條目新增工具（去網址只會減少）。

這條規則在本庫不是新的：`assets/app.js` 對搜尋索引早有 `withoutSourceUrls()`（註解寫「Source links are evidence, not content」），`README.md` 也向讀者承諾「來源網址本身不算內容」。工具是唯一沒套用這條規則的欄位，而它是卡片第一行印出來的字。

另一項揭露缺口：`#facet-count-hint` 逐項解釋收錄狀態、實作門檻、來源類型、主題分類的口徑，**完全沒提工具**；`README.md` 全篇也沒有「提及工具」字樣（grep 0 命中）。所以讀者無法知道卡片上的工具是怎麼來的。

## 兩個方案

- **A（採用）工具改走既有的 `withoutSourceUrls()`，並在篩選說明寫出口徑。**
  - 價值：一次拿掉 60 筆假工具標記（`?tool=GitHub` 136→86），卡片第一行不再印出案例沒用過的工具；與搜尋索引的既有政策一致，不是新規則。
  - 成本：`assets/app.js` 2 處（抽工具、篩選說明）＋`README.md` 一句＋1 支單元測試（4 項）。
  - 取捨：**不修假陰性**——`UC-210` 宣告的 Astronomer／Astro Engine、`UC-019` 的 Figma 等不在那 10 個字串裡，仍然看不到；`?tool=GitHub` 的既有分享連結會少 50 筆（正確方向，但已寫進 README 與篩選說明）。
- **B 改成以頁首 `- 工具：` 宣告為準。**
  - 442/511 頁有宣告，等於第一次讓作者自己寫的工具進站；但宣告值是自由文字，工具選項會從 10 個變成數百個（344 個主題分類已證明單頁選項的病），要先做正規化表。不在本輪，列為下一輪候選。

## 改動

| 檔案 | 內容 |
| --- | --- |
| `assets/app.js:1226` | 工具清單改為 `TOOL_PATTERNS.filter(([,re])=>re.test(withoutSourceUrls(markdown)))`；新增 `toolsForDifficulty` 保留原本（含網址）的工具訊號給 `extractDifficulty()`，使推測門檻零變動 |
| `assets/app.js:2921-2939` | `#facet-count-hint` 新增 `toolHint`：「提及工具只看案例內文提到的工具；來源連結裡的網域（例如 github.com）不算，工具名以站上固定清單為準，清單外的工具不會出現在選項裡。」 |
| `README.md:13` | 同一條口徑寫給讀者（含 Astronomer 這種清單外工具仍可用關鍵字找到） |
| `tests/tool-mention-fidelity.test.cjs`（新，4 項） | 全語料不變量（每個工具都必須在去網址後的正文命中）、網址與句子的對照、`UC-210`／`UC-004` 反例與 `UC-005` 正例、篩選說明存在 |

**刻意不動**：實作門檻推測。它的規則吃 `git clone`、`CLI`、`Cursor` 這類字，而這些字也出現在來源網址裡；把輸入一起換成去網址版本會改動 8 個「推測」門檻值（`UC-140` 由 進階開發 變 入門對話，而該頁正文正是在 VM 安裝 PyTorch、`UC-163` 只因為 `github.com` 裡的 `git`／`cli` 才被推測成進階）。那是另一個需要逐頁證據的決定，本輪只把工具標籤修對，並在程式碼註解寫明原因。

## 量測

- 先紅後綠：`node --test tests/tool-mention-fidelity.test.cjs` 對基準 `assets/app.js`（`git show b004390a:assets/app.js`，放在 `/tmp/toolbase` 連同同一份語料）**4 項全紅**；對本輪版本 4 項全綠。
- 全套 `node --test tests/*.test.cjs`：基準 **736** → 本輪 **740 通過、0 失敗**。既有測試沒有一項因這次改動失敗（代表先前沒有任何測試釘住工具抽取的來源）。
- 逐條目比對（同一份語料、兩個版本的 `metadata()`）：518 筆中 **61 筆工具清單改變、0 筆實作門檻改變**（含 `difficultySource`），`proof`／`category`／`date`／`title` 全未變。
- 篩選與結果一致：工具選項 `86 · GitHub` 與 `?tool=GitHub` 的 `顯示 86 / 518` 相同（1440／390／320 三種寬度）。
- 卡片：`?q=觀星` 的 UC-210 由 `UC-210 · Grok Bot / GitHub` 變 `UC-210 · Grok Bot`；高度（`offsetHeight`）1440px **553 → 553**、320px **540 → 540**、390px **551 → 549**（第二行少了一個工具名，沒有裁切）。
- 全部 518 張卡片逐一量測（兩份預覽、按「再看更多結果」載完、三種寬度）：

| 寬度 | 高度改變的卡片 | 最大位移 | 水平溢出 |
| --- | ---: | ---: | --- |
| 1440×900 | 0 | 0 | 0 |
| 390×844 | 23 | −29px（P-003 少一個工具）；其餘 −1～−2px（取整後 15 張 −1、7 張 −2） | 0 |
| 320×740 | 5 | +29px（UC-307、UC-393 的第二個工具由 `Cursor`／`GitHub` 換成較長的 `Google Drive`，多折一行）；其餘 −1px | 0 |

  也就是說：桌機完全不動；窄螢幕上少數卡片的工具字串本身變了（`Grok Bot / Cursor`→`Grok Bot / Google Drive` 反而是正確標籤），高度最多差 29px，沒有任何裁切或溢出。**不能說「卡片高度前後完全相同」**，只能說桌機相同、窄螢幕差異如上。
- 篩選說明由 229 字增為 299 字；`<details>` 面板與手機版面無破版（見下）。

## 排序的連帶影響（量測後保留）

`rankEntries()`（`assets/app.js:2629`）把 `item.tools` 當成一個加分欄位，所以工具清單修正後，**工具名稱查詢的排序**也跟著變。實測十個工具詞：結果筆數完全不變，只有 Cursor／GitHub／Google Drive 的順序改變，而且**被降位的每一筆都只在網址提到該工具**，被升位的都真的在正文寫到它：

| 查詢 | 結果筆數 | 順序改變 | 被降位（全部只在網址提到） | 被升位（正文有提到） |
| --- | --- | ---: | ---: | ---: |
| Cursor | 54 → 54 | 48/54 | 8（8 筆 url-only） | 40 |
| GitHub | 136 → 136 | 112/136 | 50（50 筆 url-only） | 62 |
| Google Drive | 33 → 33 | 26/33 | 1（1 筆 url-only） | 25 |
| 其餘 7 個工具詞 | 不變 | 0 | 0 | 0 |

例：`?q=Cursor` 的 UC-042（只在 `https://cursor.com/docs/grok-bot` 提到）由第 7 名降到第 47 名，UC-049、UC-056 這類正文寫到 Cursor 的案例往前。這是修正的一部分，不是回歸；搜尋仍然找得到那 8 筆（全文字面詞可比對網址是既有設計），只是不再把它們排成「用 Cursor 的案例」。

## 驗收（預覽 `scripts/preview.py`，Chromium 1440×900／390×844／320×740）

三種情境都走過，前後兩份預覽（`/private/tmp/preview-1113-base` = 基準、`/private/tmp/preview-1113` = 本輪）：

1. **不知道工具名，從問題找案例**：首頁 56 個任務入口 → 點「會議」→ `?q=會議`、`顯示 28 / 518`、`#results-count` 取得焦點、第一則案例標題在 150px（桌機）／167px（手機）。
2. **組合搜尋與篩選遇到空結果**：`?q=規劃旅行&scenario=工作` → `顯示 0 / 518`，面板列出「移除使用情境「工作」 → 查看 1 筆」「原問題包含「旅行」 → 搜尋 5 筆」等；點第一個 → 1 筆、關鍵字保留、條件列只剩 `關鍵字：規劃旅行`。
3. **分享的詳情連結**：`?case=UC-210` 直開 → 焦點 `detail-title`、來源固定在 `b004390a`、版本註記正確、Escape 關閉後焦點回到 `#results-count`、回到完整清單。

- 水平溢出 0、`pageerror` 0（兩種寬度、三種情境）。
- axe（`wcag2a`／`wcag2aa`／`wcag21a`／`wcag21aa`，在結果與詳情渲染完成後 600–800ms 量測）：`?tool=GitHub`、`?tool=Haggle Bot&scenario=學習`（空結果）、`?case=UC-210`、篩選面板展開，1440／390／320 共 **12 次全部 0 違規**。
- 量測點很重要：同一頁若在 `DOMContentLoaded` 當下就掃，空結果頁會回報 4 個 `color-contrast` 節點（情境 chip 的 `strong`／`span`，前景 `#ffffff`、背景 `#f7f8f1` 這種過渡中的配色），600ms 後消失，實測文字對比全部 ≥4.5:1；**基準版本同樣如此**，是本輪沒有改到的既有過渡狀態，不是這次改動造成的。本輪不改它，只記錄量測條件。
- 截圖：`docs/qa/2026-11-11-tool-mentions/`（前後同頁、同尺寸、同資料狀態）。

截圖以本機 Chromium 產生；本環境無法讀取影像內容，視覺結論來自 DOM 幾何、文字內容與 axe，未做人工目視。

## 獨立審查（未參與實作）

由另一個 agent context（`reviewer`，未參與實作）讀 `98528e18` 的 diff、自行重算語料不變量與兩個版本的 `metadata()`、用兩份預覽量測 518 張卡片，並在 `/tmp` 做突變。結論 **NEEDS FIXES**（2 項 must-fix、2 項 should-fix）：

| 項目 | 判定 | 處理 |
| --- | --- | --- |
| must-fix 1：`rankEntries()` 吃 `item.tools`，`?q=Cursor` 的排序也變了 | 屬實，但方向正確 | 保留並補量測（上表）：被降位的 8／50／1 筆全部只在網址提到該工具，被升位的都在正文寫到；結果筆數完全不變。PR 與本紀錄原本宣稱「其他行為不變」是錯的，已改寫成「結果集合不變、工具名稱查詢的排序按同一條規則修正」 |
| must-fix 2：320／390px 部分卡片高度改變 | 屬實 | 已逐張量測（上表）。桌機 0 張；390px 23 張（最多 −29px）；320px 5 張（UC-307／UC-393 +29px，第二個工具換成較長的 `Google Drive`）。無裁切、無溢出。原本「卡片高度前後相同」的宣稱已撤回 |
| should-fix：改變的條目數應為 61（含 1 篇經驗、1 個待查線索），並補 Meta Muse 202→201 | 屬實 | 程式碼註解與本紀錄已改成 61 並補上 Meta Muse |
| should-fix：語料測試對 `sources/pending.md` 整檔去網址，會讓一個待查線索的字為另一個背書 | 屬實，是測試的真缺口 | 改為逐條目用 `entry.markdown` 去網址後比對；基準仍 4 項全紅、修正後 4 項全綠 |

審查另外確認：退出碼與計數（511 案例＋3 經驗＋4 待查＝518）、444 個 `- 工具：` 宣告中沒有因去網址而遺失受支援的工具名、`difficulty`／`difficultySource`／`proof`／`category`／`date` 兩版完全相同、十個工具詞的結果筆數不變、新提示與 README 的措辭沒有宣稱清單完整或已驗證。第二次審查（同一 reviewer context、未參與實作）再量一次：確認 61 筆與 Meta Muse 202→201、十個工具詞的結果集合不變、被降位者全部 url-only、518 張卡片 1440 0／390 23／320 5 張改變、測試基準 4 紅／本輪 4 綠且突變仍會轉紅、三種情境與 0 pageerror；另指出本紀錄兩個過寬的宣稱，均已更正：UC-210 在 390px 實際是 551→549（原本寫「前後相同」），axe 那 12 次是在渲染完成後量測的，若在 `DOMContentLoaded` 當下掃，空結果頁有 4 個既有的過渡中對比節點（基準版本相同）。審查未能驗證：正式站與螢幕閱讀器（由整合者於合併後另行走查）。

## 發布

（待補）

## 已知限制

- 只修假陽性。工具詞彙表仍是 10 個固定字串，`- 工具：` 宣告（442/511 頁）仍未進站；`Astronomer`、`Figma`、`Granola` 等工具不會出現在選項裡（已寫進 README 與篩選說明）。
- 全文搜尋仍會在**讀者直接打網域時**命中來源網址（既有設計：字面詞可比對網址、同義詞只比對正文）。因此 `?q=GitHub` 仍是 136 筆，與 `?tool=GitHub` 的 86 筆不同；兩者口徑不同，README 已分別說明。
- 實作門檻推測仍使用含網址的工具訊號（見「刻意不動」），`UC-140`／`UC-163` 這類「推測」值未重新評估。

## 下一輪最值得做的一件事

**發布閘門在「live 已被下一個 merge 取代」時根本沒有走查正式站，而那個 merge 通常就是每輪最後的紀錄提交。**

- 證據（本輪重新量測，不是歷史敘述）：`Website QA` 對 `af90eb74` 的 run [42947566704](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42947566704) 第 17 步 `Verify the published GitHub Pages site` 起訖同為 `02:51:14`、**0 秒 success**（對照組 `42940240826` 同一步驟 33 秒）；唯一 0 秒的路徑是 `tests/deployed-browser.cjs:35` 的 `if(verdict.mode==='superseded')return;`。當時 live 是 `b004390a`，而 `gh api .../runs?head_sha=b004390a` 只有 1 支 run（`pages build and deployment` 42948288706），**沒有任何 Website QA**——因為 `website-qa.yml:23-25` 的 main push paths 不含 `SITE.md`／`docs/**`，紀錄提交不會觸發。於是上一個 merge 的走查被交給一個不存在的 run。
- 規模：2026-11-08 之後 main 有 150 次 Pages 建置、65 支 Website QA，**85 個已發布的 revision 沒有自己的閘門 run**。
- 先做的驗證：以 `PUBLICATION_MODE=superseded PUBLICATION_LIVE_REVISION=<live> GITHUB_SHA=<sha>` 跑 `tests/deployed-browser.cjs`，確認它 0 秒結束、完全沒有啟動 Chromium（可用一個會失敗的 origin 證明）；再寫成測試（superseded 分支必須仍對 live 做一次 revision-neutral 的走查），最後才改。
- 第二候選（內容）：讓頁首 `- 工具：` 宣告進到站上（442/511 頁已宣告），需要先決定正規化表，否則工具選項會變成數百個單頁選項。
