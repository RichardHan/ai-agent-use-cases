# 2026-11-14 區分發布者與成果主張者，並補齊中文宣告的轉述取得方式

## 基準與環境

- 基準 `origin/main`：`7d396fc0b0b3e8a062cd4886a44d64f9b4be9172`。隔離 worktree `/private/tmp/aiuc-20261114-round`（分支 `improve/20261114-visitor-round`）；原工作樹 `/Users/richard_han/orca/ai-agent-use-cases`（`90093d7b`，含 159 個未追蹤檔案）完整保留、未做任何 reset 或改動。
- 正式站：https://richardhan.github.io/ai-agent-use-cases/ 。開工時 `catalog.json.sourceRevision` 與 `corpus.json.sourceRevision` 皆為 `7d396fc0…`，521 個來源檔、524 筆條目（517 個主要案例頁＋3 篇經驗與踩坑＋2 個未處理待查線索＋2 個已併入待查線索）；網站條目數與合格真實案例數分開計算。
- 基準測試：`node --test tests/*.test.cjs` **742 通過、0 失敗**；`node --check assets/app.js`、`node --check assets/reader.js`、`node scripts/check-published-surface.cjs`（826 檔）通過。
- Actions 現況重新確認：`main` 最近 20 次 run 全數 `success`（最新 `Website QA` [43523139475](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43523139475) 耗時 11m23s、`pages build and deployment` [43523139444](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43523139444) 耗時 61s），0 個執行中或排隊中的 workflow。
- 模型與環境揭露：主整合者實際執行模型為 `factory-droid/gemini-4-argon`；`cfg://task/perCallModel` 為 `"off"`、`cfg://modelRoles` 的 `task` 為 `litellm/deepseek-v4-flash-0731-gmi-ray`，未宣稱已切換為 `gpt-6.1-terra` 或 `gemini3.8:high flash`。

## 問題證據與目標使用者

目標使用者是**開啟案例卡片或分享詳情連結、需要判斷「這項成果是誰主張的、本庫有沒有讀到第一手原文」的訪客**（接續 `SITE.md` 上一輪留下的首要驗證項目）。

在基準 `7d396fc0` 全庫 524 筆條目逐筆比對 `declaredEvidenceClasses()` 與 `relayedEvidenceClasses()`，並在正式站與本機預覽（1440×900、390×844、320×740）實測，確認三處「誰發布／誰主張／怎麼取得」混淆：

| 條目 | 頁首證據行（原文） | 基準（修改前）畫面 | 案例頁實際內容與矛盾點 |
| --- | --- | --- | --- |
| **UC-179** | `- 證據狀態：V，官方挑選的具名測試者實用引言；無流程圖或事件紀錄，未重現` | 徽章：`官方自報`；第一屏：`成果主張：官方團隊／原廠自述`；無 `取得：` 列 | `cases/179-…md:13,15,40`：Meta 公告引用外部客戶 JaeLuxe Shoetique 創辦人 April Polk 的使用回饋，「由廠商挑選發布」。官方是**發布管道**，成果主張者是**外部測試者**，且本庫讀到的是廠商挑選的引言而非測試者第一手原帖。 |
| **UC-221** | `- 證據：V，服務商自己的測試自述；沒有公開簽後原件或完整日誌，未獨立重現` | 徽章：`作者報告／示範`；第一屏：`成果主張：社群作者／專案實踐者` | `cases/221-…md:10,15,42`：Maren Technologies LLC（No Errands）測試自家 connector，「組織有商業利益」。`FIRST_PARTY_LEAD` 認得 `服務商員工`（UC-328）與 `廠商作者`（UC-211），卻漏掉 `服務商自己`，使第一方廠商測試被標成一般社群作者。 |
| **UC-107 / UC-108** | `- 證據：V級產品員工實際使用自述，由原訪談主持人整理；未獨立重現。` | 徽章：`官方自報`；第一屏：`成果主張：官方團隊／原廠自述`；無 `取得：` 列、卡片無 `取得：經轉述` | `cases/107-…md:8,9,39`、`108-…md:8,9,39`：受訪者是 Meta Muse 設計主管 Alex Cornell（主張者確屬官方員工），但內文由訪談主持人 Claire Vo 整理，且明寫「未觀看完整訪談影片」。因 `OFFICIAL_DECLARATION` 只認英文 `/\bofficial\b/gi`，中文宣告的 `V級產品員工…` 永遠進不了 `relayedEvidenceClasses()`。 |
| **UC-523** | ``- 證據狀態：`author-demo`（作者轉述同事的實際設定；…本庫只讀貼文、未讀長文全文）`` | 徽章：`作者報告／示範`；第一屏：`成果主張：社群作者／專案實踐者`；無 `取得：` 列、卡片無 `取得：經轉述` | `cases/523-…md:6,13,37`：貼文作者 @MichLieben 轉述同事 GTM 工程師 Louis 的設定，且完整設定在另一篇未讀長文。因 `RELAYED_AUTHOR` 只認 `經…轉述`（有「經」字），漏掉 `作者轉述同事`。 |

## 兩個可行方案與取捨

- **方案 A（採用）：在既有六類來源與 `relayedProof` 架構內，修正「發布者 ≠ 主張者」判準與中文／同事轉述識別。**
  - 做法：
    1. 新增 `OFFICIAL_RELAYED_USER`（`官方轉述|挑選|引用|引述`），從 `FIRST_PARTY_LEAD` 與 `declaredEvidenceClassesOfClause()` 的第一方條件排除，並歸入 `作者報告／示範`；同時將 `服務商自己` 納入 `FIRST_PARTY_LEAD`。
    2. 擴充 `OFFICIAL_DECLARATION` 涵蓋中文第一方宣告（`V級…員工|服務商自己|廠商|原廠|官方…`），`RELAYED_OFFICIAL` 納入 `由…主持人／第三人／他人整理`，使 UC-107／108 呈現「官方自報＋取得：經轉述」。
    3. 擴充 `AUTHOR_DECLARATION` 與 `RELAYED_AUTHOR` 納入 `官方挑選…引言` 與 `轉述同事／朋友／隊友／他人／客戶`，使 UC-179 與 UC-523 呈現「作者報告／示範＋取得：經轉述」。
  - 價值：精準修正全庫 5 筆矛盾條目（UC-107、UC-108、UC-179、UC-221、UC-523），其餘 519 筆條目的 `proof`、`proofClasses`、`relayedProof` 零變動；來源類型總筆數（官方自報 28、作者報告／示範 474、公開資料核讀 6、尚待查證 8、設計／未實跑 3、模板／文件核讀 1，合計 524）完全守恆。
  - 成本：`assets/app.js`、`README.md`、`templates/case.md`、`tests/relayed-source-provenance.test.cjs`、`tests/evidence-status-consistency.test.cjs`、`tests/evidence-attribution-browser.cjs`。
  - 取捨：仍以頁首證據行的字面宣告為唯一依據，不從正文散文推測未寫在頁首的轉述關係。
- **方案 B（不採用）：新增第七個來源類型「官方引用客戶／第三方訪談整理」或直接改寫各案例頁 Markdown 加上英文 token。**
  - 成本與風險：新增來源類型會拆動篩選選項、圖例、計數與多數瀏覽器測試；而為了配合英文正則去改寫既有中文頁首（如把 `V級產品員工…` 改成 `` `official` ``）則是讓資料遷就解析器缺陷，日後新增中文頁首仍會再漏。

本輪不處理範圍：結果列與批次按鈕筆數表達（`SITE.md` 另一候選）、頁首 `- 工具：` 自由文字正規化、無關的歷史分支或陳舊草稿 PR。

## 修改前後實測對照（524 筆全庫掃描＋Chromium 三視口）

全庫 524 筆 `metadata()` 逐筆比對，**僅以下 5 筆改變，其餘 519 筆完全不變**：

| 條目 | 修改前 (`7d396fc0`) | 修改後（本輪） |
| --- | --- | --- |
| **UC-179** | `proof`: `官方自報`<br>`relayedProof`: `[]`<br>第一屏：`成果主張：官方團隊／原廠自述` | `proof`: **`作者報告／示範`**<br>`relayedProof`: **`["作者報告／示範"]`**<br>卡片：新增 `取得：經轉述`<br>第一屏：`成果主張：社群作者／專案實踐者（作者內容經第三人轉述）`＋`取得：作者內容經第三人轉述或僅讀摘要整理，本庫未取得作者原文` |
| **UC-221** | `proof`: `作者報告／示範`<br>`relayedProof`: `[]`<br>第一屏：`成果主張：社群作者／專案實踐者` | `proof`: **`官方自報`**<br>`relayedProof`: `[]`<br>第一屏：`成果主張：官方團隊／原廠自述` |
| **UC-107** | `proof`: `官方自報`<br>`relayedProof`: `[]`<br>第一屏：`成果主張：官方團隊／原廠自述`（無取得列） | `proof`: `官方自報`<br>`relayedProof`: **`["官方自報"]`**<br>卡片：新增 `取得：經轉述`<br>第一屏：`成果主張：官方團隊／原廠自述（官方內容經第三人轉述）`＋`取得：官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文` |
| **UC-108** | 同 UC-107（無取得列） | 同 UC-107（新增 `relayedProof: ["官方自報"]` 與卡片／第一屏取得列） |
| **UC-523** | `proof`: `作者報告／示範`<br>`relayedProof`: `[]`<br>第一屏：`成果主張：社群作者／專案實踐者`（無取得列） | `proof`: `作者報告／示範`<br>`relayedProof`: **`["作者報告／示範"]`**<br>卡片：新增 `取得：經轉述`<br>第一屏：`成果主張：社群作者／專案實踐者（作者內容經第三人轉述）`＋`取得：作者內容經第三人轉述或僅讀摘要整理，本庫未取得作者原文` |

### 版面幾何與無障礙量測（`measurements.json`）

- **詳情頁（UC-179、UC-107、UC-221）**：1440×900、390×844、320×740 三種視口下，修改前後 `overflow` 皆為 `false`（0px 水平溢出），`pageerror` 皆為 `0`，axe（`wcag2a`／`wcag2aa`／`wcag21aa`）於 9 個詳情狀態皆為 **0 違規**。
- **卡片（`?q=重複觸發#explore` 中的 UC-179）**：
  - 1440×900：底部高度 57px → 57px，卡片總高 699px → 699px。
  - 390×844：底部高度 57px → 57px，卡片總高 549px → 549px。
  - 320×740：因新增 `取得：經轉述` 標記換行，底部高度 57px → 90px，卡片總高 540px → 572px（+32px），無裁切、無水平溢出。

### 前後截圖（同頁、同尺寸、同資料狀態）

- UC-179 詳情：`before-{desktop,phone,small}-detail-UC-179.png` ／ `after-{desktop,phone,small}-detail-UC-179.png`
- UC-107 詳情：`before-{desktop,phone,small}-detail-UC-107.png` ／ `after-{desktop,phone,small}-detail-UC-107.png`
- UC-221 詳情：`before-{desktop,phone,small}-detail-UC-221.png` ／ `after-{desktop,phone,small}-detail-UC-221.png`
- UC-179 卡片：`before-{desktop,phone,small}-card-UC-179.png` ／ `after-{desktop,phone,small}-card-UC-179.png`

（註：本執行環境設定 `images.blockImages: true`，視覺結論依 DOM 文字、bounding box 幾何與 axe 自動化檢測得出，不宣稱人工肉眼檢視截圖。）

## 測試與三情境驗收

### 1. 先紅後綠回歸與全套測試

```sh
node --test tests/relayed-source-provenance.test.cjs tests/evidence-status-consistency.test.cjs
node --test tests/*.test.cjs
node --check assets/app.js
node --check tests/evidence-attribution-browser.cjs
python3 scripts/preview.py /tmp/aiuc-1114-after-preview/ai-agent-use-cases
python3 scripts/check_corpus_bundle.py /tmp/aiuc-1114-after-preview/ai-agent-use-cases
node scripts/check-published-surface.cjs
```

- **單元先紅後綠**：將 `assets/app.js` 換回基準 `7d396fc0` 執行 `relayed-source-provenance.test.cjs` 與 `evidence-status-consistency.test.cjs`，16 項中有 **8 項失敗**（見 [red-unit.txt](red-unit.txt)）；套用本輪修正後 **16 項全數通過**（見 [green-unit.txt](green-unit.txt)）。
- **瀏覽器先紅後綠**：`evidence-attribution-browser.cjs` 對基準預覽失敗於 `UC-179 external tester quote is not labelled as an official self-report`（見 [red-browser.txt](red-browser.txt)）；對本輪預覽於 1440／390／320 全數通過（見 [green-browser.txt](green-browser.txt)）。
- **全套單元測試**：`node --test tests/*.test.cjs` **742 通過、0 失敗**。
- **相鄰瀏覽器回歸套件**：`detail-trust-summary-browser.cjs`、`evidence-attribution-browser.cjs`、`target-user-provenance-browser.cjs`、`core-goal-provenance-browser.cjs`、`result-count-honesty-browser.cjs`、`superseded-live-browser.cjs` 全數通過。

### 2. 三種訪客情境實走（1440×900 桌面／390×844 手機）

1. **新訪客不知道工具名稱，從問題找到適用案例**：首頁點選「會議整理」→ 抵達 `#explore` 顯示 `29 / 524 筆收錄`，首張卡片為「自己不能到的會議，讓 Bot 進去先說明身分再記筆記」。
2. **組合搜尋與篩選遇到空結果後恢復探索**：開啟 `?q=規劃旅行&scenario=工作#explore` → 顯示 `0 / 524 筆收錄`，點選第一顆建議「移除使用情境「工作」 → 查看 1 筆」→ 恢復顯示 `1 / 524 筆收錄` 且保留搜尋詞。
3. **開啟分享的詳情連結，判讀證據、查看來源並返回探索**：開啟 `?q=重複觸發&case=UC-179#explore` → 第一屏顯示 `成果主張：社群作者／專案實踐者（作者內容經第三人轉述）`、`核讀：本庫未獨立重現`、`取得：作者內容經第三人轉述或僅讀摘要整理，本庫未取得作者原文`；來源連結固定於 commit SHA；按 `Escape` 關閉後焦點回到 `#results-count`，保留 `顯示 7 / 524 筆收錄`。

## 獨立審查（未參與實作）與修正

由獨立 subagent（`IndependentRoundReviewer`，`reviewer` 角色，未參與本輪實作）審閱完整 diff、案例原文與 524 筆語料不變量。初審結論 **NEEDS FIXES**，抓出兩項邊界缺陷（Priority 2），已全數修正並加入回歸測試：

1. **多子句第二段中文官方宣告的錨點問題（`assets/app.js:1138`）**：`OFFICIAL_DECLARATION` 的中文第一方分支原本只用 `^` 錨定行首，而 `relayedEvidenceClasses()` 是對整行 `proofLine` 比對；若未來案例寫成 `designed（本庫自擬）＋V級產品員工實際使用自述，由原訪談主持人整理`，`declaredEvidenceClassesOfClause()` 認得第二子句的 `官方自報`，但 `OFFICIAL_DECLARATION` 會因不在行首而漏掉轉述標記。
   - **修正**：改為 `(?<=^|[＋+；;]\s*)` lookbehind 錨定子句起點，使 `match.index` 落在第二子句開頭並正確進入 `declarationWindow()`。
2. **官方引述自家員工與外部客戶員工的邊界（`assets/app.js:1046–1047`）**：初審指出 `OFFICIAL_RELAYED_USER` 若將所有 `官方引述／官方引用` 一律視為外部使用者，會把 `V，官方引述產品員工實際使用自述` 誤判為 `作者報告／示範`；二審再指出若僅排除 12 字內的任意 `員工｜團隊`，又會把 `V，官方挑選的外部客戶員工實用引言` 誤當成官方員工。
   - **修正**：負向先行斷言收緊為緊接動詞的發布方內部人員 `(?!的?(?:(?:廠商|原廠|產品|服務商|公司|官方|內部|自家)(?:員工|團隊)|員工|內部))`，使「官方引述產品員工」維持 `官方自報`，而「官方挑選的外部客戶員工引言」仍歸為 `作者報告／示範` 並帶 `取得：經轉述`。

三項對抗反例皆已寫入 `tests/relayed-source-provenance.test.cjs` 並重跑通過。
## 發布紀錄

（待 PR 檢查、合併與 Pages 部署完成後補上）

## 下一輪最值得處理的一件事

- **讓結果列與批次控制說同一個數字**（`SITE.md` 既有待辦）：空查詢或大結果集時，`#results-count` 顯示 `顯示 524 / 524 筆收錄`，但畫面上只渲染第一批 24 張卡片，底部按鈕同時寫「再看 24 筆（尚有 500 筆）」。先檢查 `tests/result-count-honesty-browser.cjs`、`tests/results-batching-browser.cjs` 與所有比對 `#results-count` 正規表示式的測試，再決定是在結果列標明「符合 524 筆（已顯示 24 筆）」或相容既有句型的呈現方式。
