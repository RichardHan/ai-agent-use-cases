# 2026-11-11 空結果先給訪客話裡的詞，不要先叫他刪掉最相關的詞

## 基準

- 開發基準 `origin/main` `da01ab66`（開工時）；工作期間 main 前進到 `0f40758b`（`0601671a` 首頁情境返回、`09de1810`／`0f40758b` 兩筆紀錄），分支已 rebase 到 `0f40758b` 後重跑，所有數字以後者為準。隔離 worktree `/private/tmp/aiuc-1111-main`（分支 `improve/20261111-empty-word-recovery`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 三百餘個 commit，另有 159 個未追蹤檔案（皆已存在於 `origin/main`，非本輪內容）；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`：`da01ab66` **714 通過、0 失敗**；rebase 後的 `0f40758b` 是 **718 通過、0 失敗**（main 期間新增 4 項）。`node --check assets/app.js` 通過。
- Actions 現況重新確認（`gh run list --branch main --limit 20`）：近 20 次 main run 全部 success，`pages build and deployment` 與 `Website QA` 都沒有 failure。PR 分支上的 `cancelled` 是 `cancel-in-progress` 的設計行為，不是本輪問題。
- 正式站 `catalog.json.sourceRevision` 開工時 `da01ab66…`，期間前進到 `0f40758b…`（512 個來源檔、515 筆條目）；與 main head 相同，沒有落後。

## 問題證據

目標使用者是**用一句自己的話描述問題、結果落空的人**：他不知道站上的詞彙，只能照自己的說法打。

在正式站（`da01ab66`）用 20 句日常問題實測，**7 句 0 筆**。其中這一句把訪客帶向反方向：

| 查詢 | 結果 | 空結果面板的第一個建議 |
| --- | ---: | --- |
| `想讓 AI 幫我盯機票價格` | 0／515 | **只移除關鍵字「機票」 → 查看 1 筆** |
| 同一句只搜「機票」 | **11／515** | — |

也就是說，站上明明有 11 筆在講機票，面板卻先建議把「機票」刪掉，換來 1 筆（剩下的「想讓 AI 幫我盯價格」）。同樣形狀的還有：

| 查詢 | 基準第一個建議 | 句中站上有的詞 |
| --- | --- | --- |
| `把 PDF 發票整理成表格` | 只移除關鍵字「發票整理成表格」 → 45 筆 | 發票 44 筆（面板沒有列出） |
| `用 AI 摘要長篇報告` | 只移除關鍵字「摘要長篇報告」 → 266 筆 | 摘要 150 筆（面板沒有列出） |
| `想讓 AI 排我的行程` | 只移除關鍵字「排我的行程」 → 14 筆 | 行程 82 筆（面板沒有列出） |

成因在 `assets/app.js`（基準）：詞彙復原被「關鍵字移除」擋掉，而且兩者從未比較過：

```
const phraseOptions=queryOptions.length ? [] : phraseRecoveryOptions(...);
const vocabularyOptions=phraseOptions.length||queryOptions.length ? [] : vocabularyRecoveryOptions(...);
```

只要 `queryRelaxationOptions()` 找到任何「刪掉一個詞」的候選，`vocabularyRecoveryOptions()`（也就是 README 已寫的「原問題包含「X」→ 搜尋 N 筆」）就整批不算，於是刪詞永遠排在前面，即使它刪掉的正是句中唯一有內容的詞。

README 第 9 行與「查無完全符合的案例時…」段落其實已經承諾「若你打的字裡有一段是站上收錄的詞，會先提供該詞的搜尋與實際筆數」；這一輪是把實作對回文件，而不是新增主張。

## 兩個方案

- **A（採用）一個結果只留一個下一步，並讓「搜尋這個詞」蓋過「刪掉這個詞」。**
  - 新增 `queryRecoveryOptions()`：先算詞彙復原，再逐一檢查刪詞候選——若被刪掉的詞自己（2–6 個中文字）單獨搜尋的筆數**多於**刪詞後的筆數，就不提供刪詞，改提供「原問題包含「該詞」→ 搜尋 N 筆」；兩個建議若會落在同一個搜尋，只留一個。任務捷徑也不再重複同一個詞。
  - 價值：訪客看到的下一步從「1 筆」變成「11 筆」，而且是他自己打的字；同時讓既有詞彙復原在 5 種查詢上真的出現（先前被整批抑制）。
  - 成本：`assets/app.js` 一支 helper（17 行）＋空結果渲染改寫（約 30 行）、`README.md` 一句、2 支既有測試更新、1 支新瀏覽器測試。
  - 取捨：面板最多多一個建議；已確認不會出現兩個指向同一搜尋的按鈕。
- **B 只改文案，把「只移除關鍵字」講得更清楚。**
  - 成本最低，但訪客照樣被帶去 1 筆；站上自己的說明也仍然與畫面不一致。不採用。

## 改動

- `assets/app.js`
  - 新增 `queryRecoveryOptions(items, query, filters, limit)`（`:3241`）：回傳 `{words, removals}`。`words` 是詞彙復原加上「單獨搜尋筆數多於刪詞結果」的句中詞（2–6 個中文字，或 3 個字元以上的拉丁詞；`ai` 這類碎詞不列入）；`removals` 只剩「刪掉不會損失更相關結果、且不會和已提供的詞落在同一個搜尋」的候選。兩段掃描：先決定所有可提供的詞，再過濾刪詞，避免同一搜尋被列兩次。
  - 空結果面板（`:3504`）先畫 `words`、再畫 `removals`；`phraseOptions`／`substringOptions` 的抑制條件改讀新的 `recovery`，行為不變（有詞可搜就不再加固定短語）。
  - 任務捷徑 filter（`:3598`）跳過已由 `words` 提供的同一個詞，避免同一個搜尋出現兩個按鈕。
  - 提示文字（`:3655`）改讀 `recovery.words`／`recovery.removals`，與畫面同步。
- `README.md`：在「查無完全符合的案例時…」段落補上這條規則與「機票」的例子。
- `tests/search-recovery.test.cjs`：新增 3 項（句中詞取代刪詞；一個搜尋只留一個下一步、刪詞在被刪詞沒有命中時保留；可搜尋的拉丁詞同樣納入比較）。
- `tests/search-recovery-browser.cjs`：`旅遊 xyz987` 的下一步改成同一個搜尋的詞彙版（`原問題包含「旅遊」 → 搜尋 N 筆`），並加一條「不得同時出現只移除關鍵字」。
- `tests/empty-word-recovery-browser.cjs`（新）：在桌面與手機上量測「機票」自己的搜尋筆數，再要求面板第一個建議就是它、筆數相同、不得出現「只移除關鍵字「機票」」、點擊後查詢變成「機票」且筆數一致、焦點落在結果筆數、Back 還原原句、axe 0、無水平溢出。
- `.github/workflows/website-qa.yml`：Chromium 步驟新增這支腳本（`tests/**` 已在 path filter 內）。

## 測試

- `node --test tests/*.test.cjs`：`da01ab66` 基準 714／0 → 本輪 716／0（+2）；rebase 到 `0f40758b` 後，該點基準 718／0 → 本輪 **721／0**（+3，實體 worktree 親跑）；`node --check assets/app.js` 通過。
- 先紅後綠（同一支腳本、同一份語料、同一句查詢）：
  - 基準預覽（`da01ab66` 建置，`127.0.0.1:8099`）：`tests/empty-word-recovery-browser.cjs` **失敗**：`desktop: the visitor's own word comes first`。
  - 本輪預覽（`0f40758b`＋本輪，`127.0.0.1:8100`）：**通過**，桌面 1440×900、手機 390×844，`wordCount=11`，兩個視窗的建議都是 `原問題包含「機票」 → 搜尋 11 筆`。
- 鄰近回歸（本輪預覽）：`search-recovery-browser`、`coverage-recovery-browser`、`combined-recovery-browser`、`visitor-problem-browser`（三種寬度、三種情境、axe 0）、`sentence-fallback-browser`（37/4，axe 0）、`compound-split-browser`（4/4，axe 0）、`result-count-honesty-browser`、`match-scope-note-browser`、`mobile-search-browser` 全部通過。

## 前後數據（同一頁、同尺寸、同一份語料）

腳本：Playwright Chromium，開 `?q=想讓 AI 幫我盯機票價格#explore`，等 `#results-count` 不再顯示讀取中，讀 `#empty-suggestions` 的第一個 `.recovery-option`。

| 尺寸 | 基準 `da01ab66` | 本輪 `0f40758b`＋ |
| --- | --- | --- |
| 1440×900 | 只移除關鍵字「機票」 → 查看 1 筆 | 原問題包含「機票」 → 搜尋 11 筆 |
| 390×844 | 同上 | 同上 |
| 320×740 | 同上 | 同上 |

截圖：`before-desktop.png`／`after-desktop.png`、`before-phone.png`／`after-phone.png`、`before-small.png`／`after-small.png`（同一頁、同尺寸、同一查詢）。

20 句日常問題的前後對照：

| 指標 | 基準 | 本輪 |
| --- | ---: | ---: |
| 0 筆的句子 | 7／20 | 7／20（本輪不改搜尋比對本身） |
| 空結果面板出現「只移除關鍵字」刪掉句中唯一有內容的詞 | 1（機票 → 1 筆） | 0 |
| 面板提供的詞彙型下一步（`data-query-recovery`）總數 | 6 | 11 |
| 同一搜尋重複兩個下一步 | 0 | 0 |
| 任務捷徑與詞彙建議重複同一個詞 | 2（`旅遊 xyz987`、`把 PDF 發票整理成表格`） | 0 |

## 三種訪客情境（本輪預覽，390×844）

1. **不知道工具名，從問題找案例**：`?q=想讓 AI 幫我盯機票價格` → 0 筆，面板第一個建議「原問題包含「機票」→ 搜尋 11 筆」；點擊後 11 筆，第一張 UC-279「想讓 AI 打電話改機票？先準備好「本人確認」這關」，詳情頁標示「成果主張：社群作者／專案實踐者／核讀：本庫未獨立重現」。
2. **組合搜尋與篩選後空結果**：`?q=發票&scenario=生活&difficulty=進階開發` → 0 筆，面板提供「移除實作門檻「進階開發」 → 查看 10 筆」；點擊後查詢與情境保留、門檻清空、顯示 10 筆，URL 只剩 `q` 與 `scenario`。
3. **開啟分享的詳情直鏈**：`?case=UC-190` 直接開在詳情、焦點在標題，頁首同時顯示宣告的「作者報告／示範」與「本庫未獨立重現」，來源含 Reddit 原始留言與 docs.x.ai；關閉後回到 515 筆清單、焦點在結果筆數、URL 不留下 `case`。

## 獨立審查

由未參與實作的另一個 agent context 依需求、最終 diff 與證據複審（reviewer，只讀）。結論：沒有 P0/P1 阻擋，1 項 P2：

- **P2（已修）拉丁詞沒有納入刪詞比較**：`queryRecoveryOptions()` 原本只對 2–6 字中文詞計算「該詞單獨搜尋筆數」，`invoice travel` 這類英文查詢即使 `travel` 自己命中 9 筆，仍可能出現「只移除關鍵字」的建議。改為 2–6 字中文詞或 3 字元以上拉丁詞都納入比較，並把「先決定詞、再過濾刪詞」拆成兩段掃描；新增 1 項單元測試（拉丁詞取代刪詞、以及刪詞在被刪詞沒有命中時保留）。修正後重跑 721 項單元測試、`empty-word-recovery`／`search-recovery`／`coverage-recovery`／`combined-recovery`／`sentence-fallback`／`compound-split` 瀏覽器腳本全數通過。
- 審查同時指出：QA 記錄裡的 7/20、6→11 等合計數字無法從測試獨立重算（文件沒有列出完整的 20 句）。已知並保留：那 20 句是人工樣本，逐一列在下方「前後對照」的來源腳本輸出，不是可重跑的固定清單；下一輪若要讓它可重算，應把查詢清單寫進測試而非只在紀錄裡描述。

## 已知限制

- 本環境無法讀取截圖影像（`Image reading is disabled`），視覺結論一律來自 DOM 文字、`getBoundingClientRect`、computed style 與 axe，未經肉眼比對；前後截圖只作存檔。
- 20 句問題是本次人工挑的樣本，不是真人使用者研究；沒有任何轉換率、滿意度或成功率的主張。
- 另外 5 句仍然 0 筆且只有固定任務捷徑（例如「網站上線後不知道有沒有壞」「幫我整理家人的用藥時間」）：這些句子裡沒有任何站上標籤或同義詞，`substringRecoveryOptions()` 的「必須可拆成站上詞彙」門檻刻意沒有放寬——放寬會開始出現「有沒有」「不知道」這類片段當建議。這一輪不處理。
- 只跑 Chromium；Firefox／WebKit 交給 CI 的既有腳本。

## 下一輪

最值得做的一件事：**`tests/published-version.cjs` 的「這次 push 沒有發布任何檔案」分支仍可能燒滿 60 分鐘。** `verifySupersededPublication()` 在 `changed.length===0` 時要求線上內容集與本次建置完全相同（`sameContent`）；但該分支只會在**線上已是後續 commit**（`assert.notEqual(live, sha)`）時進入，那時內容集本來就不可能相同。先做的驗證：用注入的 `fetchAsset`／`isDescendant` 造出「本次 push 只改 tests、線上已是下一個內容 commit」的情境，確認現行程式會重試到 60 分鐘才失敗，再改成「後續建置已包含本次 push 即通過，並在 log 說明這次沒有任何可發布變更」。

## 發布

- PR [#364](https://github.com/RichardHan/ai-agent-use-cases/pull/364)（head `c01be476`）：16 項非略過檢查 success，`published` 依設計在 PR 上 skipping；其中 `Website QA` [42907860151](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42907860151) 與新腳本所在的 Chromium 步驟都 success。
- squash 合併 `a1f5722d61a789e7d790e836ffa974e91bb225c8`；`pages build and deployment` [42909621315](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42909621315)：`build` 21:55:08→21:55:58、`deploy` 21:56:03→21:56:12，兩者 success。
- main 的 `Website QA` [42909622286](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42909622286)：success（`Verify the updated site in Chromium`、`Wait for published assets and content`、`Verify the published GitHub Pages site` 都是 success）。
- 正式站 `catalog.json.sourceRevision` = `a1f5722d61a789e7d790e836ffa974e91bb225c8`、512 個來源檔；`assets/app.js`（sha256 `2e035654361f…`）與 `README.md`（sha256 `b3071e594337…`）與 `origin/main` 逐 byte 相同。
- 正式站重走（390×844）：`?q=想讓 AI 幫我盯機票價格` → 0／515，面板為「原問題包含「機票」 → 搜尋 11 筆」「原問題包含「價格」 → 搜尋 105 筆」；點擊後 11 筆、焦點在結果筆數；`?q=發票&scenario=生活&difficulty=進階開發` → 0 筆 → 移除門檻後 10 筆且情境保留；`?case=UC-190` 直接開在詳情、焦點在標題、來源連結正常。
