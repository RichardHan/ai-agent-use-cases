# 2026-11-11 「實作與結果」捷徑指向來源報告或補充段落，頁面沒有這一節

## 基準

- 開發基準 `origin/main` `b004390a`（515 個來源檔、畫面 518 筆）。隔離 worktree `/private/tmp/aiuc-20261111-r25`（分支 `improve/20261111-r25-quick-nav-labels`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 三百餘個 commit，另有 159 個未追蹤檔（皆已在 origin/main）；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`：**736 通過、0 失敗**；`node --check assets/reader.js` 通過。
- 正式站開工時 `catalog.json.sourceRevision` = `b004390a…`、`bundleRevision` = `20261111024659970151742`；`catalog.json` 與 `corpus.json` 的 revision 相同。

## 問題證據

目標使用者是**從詳情頁上方四個捷徑跳去「結果、方法、限制、來源」的讀者**。

- 正式站 `?case=UC-004`（390×844 與 1440×900 相同）的 `.reader-quick` 第一顆按鈕是 **`實作與結果 ↓ 來源報告與限制`**。但 `cases/004-social-crm.md` 的章節是 `來源`、`同來源的影片版本`、`來源報告與限制`、`建議操作流程（整理者設計，未實跑）`、`可複製提示詞`、`權限、費用與可用性`、`驗收`、`去重與版本`、`2026-10-16 補充…`——沒有任何「問題／實作／結果」章節。按鈕承諾的那一節不存在。
- 成因在 `assets/reader.js` 的 `selectJumps()`：`['實作與結果',[/問題|實作|做了|結果|發生|來源報告/]]` 把 `來源報告` 也算成結果段落。`tests/reader.test.cjs` 原本把這個行為釘成期望（`jumps[0]` 指向 `來源報告與限制`），所以它不是偶發，是被固定下來的標籤。
- 同一支掃描（511 篇）：**11 篇**的 `實作與結果` 捷徑落在 `來源報告` 或帶日期的補充段落——`004`、`005`、`006`、`007`、`059`（`來源報告與限制`／`來源報告與界線`）與 `041`、`061`、`087`、`127`、`133`、`160`（`2026-10-xx 補充：…`）。其餘 500 篇不變。
- 補充段落是案例的沿革，不是這一篇的實作或結果；把 `2026-10-22 補充：兩層審查仍曾發生先合併、後審查`（UC-005）標成 `實作與結果`，等於用一個結果標籤把讀者送進附錄。

## 方案與取捨

- **A（採用）讓 `實作與結果` 只認真正的問題／實作／結果標題，並跳過帶日期的補充段落。**
  - 做法：從 intent 移除 `來源報告`；`isAppendix()` 只排除「日期＋補充／補讀／補證／覆核」的標題，且只作用在 `實作與結果` 這一個 intent。`全部段落（N）` 目錄完全未動，被排除的章節仍在目錄裡。
  - 價值：捷徑只承諾頁面真的有的那一節；有真正實作標題的頁面（`UC-208` 的 `問題與原作者實際做了什麼`、`UC-023` 的 `2026-10-17 中文實作變體`、`UC-096` 的 `原作者實際做了什麼`）仍保留 `實作與結果`。
  - 成本：`assets/reader.js` 1 個 intent 與 1 個守衛、`tests/reader.test.cjs` 改 1 項並加 2 項。
  - 取捨：`004`／`005`／`006`／`007` 等頁少一顆捷徑（4→3），但 `來源報告與限制` 本來就是來源段落，且 `全部段落` 目錄仍可直接跳；不採用「把標籤改成來源報告」，因為那會與 `來源與版本` 重複，且同一個按鈕在不同頁代表不同事。
- **B 只改標籤（落在來源報告時就叫「來源報告」）。** 同一個位置的按鈕在不同頁換名字，且與 `來源與版本` 有兩顆指向同一節的風險。不採用。
- **C 整批隱藏 `實作與結果`。** 會讓 `UC-208` 這類真的有作者實作段落的頁面失去入口。不採用。

## 改動

- `assets/reader.js`：`實作與結果` intent 移除 `來源報告`；新增 `isAppendix()`（`^\d{4}-\d{2}-\d{2}` 且標題含 `補充|補讀|補證|覆核`），只套用在 `實作與結果`。
- `tests/reader.test.cjs`：把原本釘住 `來源報告與限制` 的期望改為「不出現 `實作與結果`」；新增「日期＋補充不得成為結果捷徑，但日期＋實作變體可以」與「真正作者實作段落仍取得捷徑」兩項迴歸。
- 未動 `cases/**`、`index.html`、`assets/app.js`、`assets/style.css`；`全部段落` 目錄與其他三個捷徑的行為不變。

## 先紅後綠

- `node --test tests/reader.test.cjs` 對基準 `assets/reader.js`：**失敗**（`actual` 的標籤含 `實作與結果`，`expected` 不含）。套用本輪 `reader.js` 後 **6 項全過**。
- 511 篇掃描：`實作與結果` 指向 `來源報告` 或日期補充的篇數 **11 → 0**；變更篇數 11，其餘 500 篇的捷徑陣列逐項相同。

## 預覽實測（Chromium，`scripts/preview.py` 建置，127.0.0.1:8097）

| 案例 | 基準 `b004390a` | 本輪 |
| --- | --- | --- |
| UC-004 | 實作與結果→來源報告與限制；方法與步驟；限制與權限；來源與版本 | 方法與步驟；限制與權限；來源與版本 |
| UC-005 | 實作與結果→來源報告與限制；… | 方法與步驟；限制與權限；來源與版本 |
| UC-006／007 | 同上 | 同上 |
| UC-041／061／087／127／133／160 | 實作與結果→`2026-10-xx 補充：…` | 該顆捷徑消失，其餘三顆不變 |
| UC-023 | 實作與結果→`2026-10-17 中文實作變體：上游改版…` | 不變（日期＋實作變體不是補充） |
| UC-034 | 實作與結果→`新增Grok Bot實作：…` | 不變 |
| UC-096 | 實作與結果→`原作者實際做了什麼` | 不變 |
| UC-208 | 實作與結果→`問題與原作者實際做了什麼` | 不變 |

- 390×844 與 1440×900 的捷徑文字相同；`全部段落` 目錄仍在（UC-004 11 段）、水平溢出 0、pageerror 0。
- 三種訪客情境（本機預覽）：`?q=會議` 28／518、第一張 UC-094；`?q=旅遊&scenario=學習` 0 筆→「移除使用情境「學習」→ 查看 36 筆」；`?case=UC-051` 直開、來源固定在 `b004390a`。與基準相同。

## 指令與結果

- `node --test tests/*.test.cjs`：基準 **736** → 本輪 **738 通過、0 失敗**。
- `node --check assets/reader.js`：通過。
- 本輪只跑 Chromium；Firefox／WebKit 交由 PR 既有 workflow。

## 限制

- 本環境無法讀取截圖影像，視覺結論來自 DOM 文字與幾何；`before-*`／`after-*` 截圖只供人眼核對。
- 同類問題仍在其他標籤：`UC-096` 的 `限制與權限` 指向 `2026-10-20補充 來源B：…`，`UC-045` 的 `來源與版本` 指向日期補充。這些按鈕旁都印出目標標題，且不在本輪 audit 的 finding #4 範圍；未修改，留待下一輪。
- `來源報告與界線（版本 A：Meta Muse 清運詢價）`（UC-059）在移除 `實作與結果` 後成為 `來源與版本` 的目標，這是正確的來源段落，但標題很長；未調整文案。

## 獨立審查（未參與實作）

由獨立 `reviewer` context 讀 `git show 59f62025`、`git diff b004390a..59f62025`，自行重跑 511 篇掃描與 `node --test tests/reader.test.cjs`、`node --test tests/*.test.cjs`（6 項與 738 項全過）。結論 **approve、0 項 must-fix**：

- 基準 `reader.js` 的 `實作與結果` 確實指向 `來源報告與限制`；本輪不再產生這個捷徑。
- 511 篇中 11 篇變更、500 篇不變；沒有真正符合結果 intent 的非附錄章節失去捷徑；`UC-208`／`023`／`034`／`096` 不變；`作者實作與結果` 仍可取得捷徑。
- `selectMethodShortcut` 511 篇的輸出與基準相同；`selectReadingSection` 未被 diff 觸碰；`全部段落` 由另一條路徑建立，不受 `selectJumps` 影響。
- 非阻擋觀察：原本的日期補充 fixture 同時含 `來源報告與限制`，基準失敗可由來源報告解釋；已補一個「只有日期補充、沒有來源報告」的 fixture（`tests/reader.test.cjs:38-41`），基準 `b004390a` 該項紅、修正後 6 項全過。
- 審查未重跑瀏覽器預覽，因此 QA 紀錄中的 Chromium 幾何不是它獨立重現的；本輪另以 `reader-browser.cjs`（webkit mobile）對預覽跑過一次，`PASS`、axe 0。

## 發布與正式站核對

- **已提交**：分支 `improve/20261111-r25-quick-nav-labels`，`59f62025`（主要改動）與 `cd6ede21`（獨立審查後的單獨 fixture）；期間合併 `origin/main` `1a3cc2f0` 解 SITE.md 衝突，PR head 為 `74efb39f`。
- **已推送**：`origin/improve/20261111-r25-quick-nav-labels`。
- **PR**：[#379](https://github.com/RichardHan/ai-agent-use-cases/pull/379)。`74efb39f` 上 15 項非略過檢查 success、`published` 依設計 skipping；`Website QA` [42964235078](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42964235078) 的 browser job 11m13s success，Source guide QA [42964235090](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42964235090) 9m25s success。
- **已合併**：squash 為 `b8858087da4fc186d8b21127d3f923a1de3619d7`（`gh pr merge` 因本機 `main` 被其他 worktree 佔用，改用 `PUT /pulls/379/merge` 指定 head；未繞過保護規則，main 沒有 branch protection）。分支已刪除。
- **部署成功**：`pages build and deployment` [42965537406](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42965537406) success；main `Website QA` [42965537876](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42965537876) 05:24:16→05:37:35 success（發布等待與正式站 walk 都過）。之後一支 docs-only 記錄合併 `d70f13f0` 把正式站 revision 推進到 `d70f13f0`（`pages` [42966102990](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42966102990) success），本紀錄自己的 docs-only 合併會再推進一次；產品資產不變。
- **正式站已驗證**：`catalog.json.sourceRevision` = `d70f13f0…`、515 個來源檔；`assets/reader.js` 與合併版本逐 byte 相同（sha256 前 16 碼 `9261e9c162c52d01`、36,381 bytes）。390×844 與 1440×900：UC-004／005／006／007 `.reader-quick` 為 3 顆，UC-208 仍為 4 顆且 `實作與結果 ↓ 問題與原作者實際做了什麼`，`全部段落` 仍在，水平溢出 0、pageerror 0；三情境（`?q=會議` 28／518 第一張 UC-094；`?q=旅遊&scenario=學習` 0→36；`?case=UC-051` 直開、來源固定在本版）通過。

## 下一輪最值得做的一件事

**讓結果列與批次控制說同一個數字。** 首頁空查詢時 `#results-count` 是 `顯示 518 / 518 筆收錄`，但 DOM 只有 24 張卡、`#load-more-results` 寫 `再看 24 筆（尚有 494 筆）`；`?q=會議` 是 `顯示 28 / 518`，24 張卡、`再看 4 筆`。先量 `currentFiltered.length`、`visibleResults`、實際卡片數三者，再決定把「顯示」改成「符合」或加入「已顯示 N 筆」；動手前先跑 `tests/result-count-honesty-browser.cjs` 與 8 處 `顯示 X / Y` 斷言，確認不是只改字串。
