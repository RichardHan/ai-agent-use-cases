# 2026-11-16 瀏覽器測試不能被改名跳過

## 問題

`.github/workflows/website-qa.yml:85` 用 `if: ${{ hashFiles('tests/discovery-browser.cjs') != '' }}` 包住整個 `Verify the updated site in Chromium` 步驟，該步驟含 33 支瀏覽器指令。把 `tests/discovery-browser.cjs` 改名或刪除，`hashFiles` 回空字串、步驟 skipped、job 仍 success：唯一會走完 33 支 Chromium 旅程與三尺寸 axe 檢查的地方整段消失，而 `tests/` 沒有任何守則提到這個守門。

同型守門共 10 處、分布在 7 個 workflow：

| workflow | 行 | 被跳過的內容 |
| --- | --- | --- |
| `website-qa.yml` | 85 | 33 支瀏覽器指令（discovery、axe、直鏈、空結果復原…） |
| `reader-qa.yml` | 48 | preview + `reader-browser.cjs` |
| `reader-qa.yml` | 68 | 正式站 `reader-browser.cjs`（`READER_DEPLOYED=1`） |
| `related-qa.yml` | 45 | preview + `related-browser.cjs` |
| `search-submit-qa.yml` | 40, 51 | `search-submit-browser.cjs`、`search-scope-browser.cjs`、`reader-browser.cjs` |
| `card-refinement-qa.yml` | 41, 48 | `card-refinement-browser.cjs`、`reader-browser.cjs`、`home-search-entry-browser.cjs` |
| `combined-recovery-qa.yml` | 50 | `combined-recovery-browser.cjs` |
| `method-shortcut-qa.yml` | 42 | `method-shortcut-browser.cjs`、`reading-flow-browser.cjs`、`reader-browser.cjs` |

其中四個 workflow 的守門看的是 unit test 檔（例如 `tests/card-refinement.test.cjs`），實際執行的是別的 browser 檔，兩者沒有對應關係。

## 重現（改動前仍綠）

在基準 `dea10671` 的獨立 worktree 把 `tests/discovery-browser.cjs` 改名為 `_renamed.cjs`：

```
$ node --test tests/*.test.cjs
ℹ tests 889
ℹ pass 889
ℹ fail 0
```

與 CI 上該步驟被跳過等價：全套 unit test 沒有任何一項會發現 33 支瀏覽器指令已不再執行。

## 改動

- 移除 7 個 workflow 的全部 10 處 `hashFiles(...)` 步驟守門。`reader-qa.yml:68` 只保留 `github.ref == 'refs/heads/main'`；檔案不存在時 `node` 直接失敗，不再變成綠燈。
- `method-shortcut-qa.yml` 的 `Verify preview when implemented` 改名為 `Verify preview`（已非條件式）。
- 新增 `tests/workflow-skip-guard.test.cjs`：
  1. 任何 workflow 都不得用 `hashFiles(` 決定是否執行步驟（略過註解行）。
  2. workflow 呼叫的每個 `tests/…`／`scripts/…` 檔必須存在；步驟以 `git show … > tests/x-before.cjs` 產生的暫存檔不算缺失。
  3. `website-qa.yml` 的 Chromium 步驟不得有 `if:`，且必須在可執行的 `run:` 內容中執行 `tests/discovery-browser.cjs`。

## 守則的注入驗證

| 注入 | 結果 |
| --- | --- |
| 改名 `tests/discovery-browser.cjs` | 1 fail，列出 14 處 workflow 引用 |
| 在 Chromium 步驟 `env:` 之後插入 `if: ${{ success() }}` | 1 fail（初版守則只看名稱後第一行，這個案例是獨立審查找到的 P2） |
| 註解掉 `run:` 內的 `node tests/discovery-browser.cjs` | 1 fail（`a commented-out command does not count`） |
| 在 `run:` 區塊後加 6 空白註解、再接 8 空白的 `if:` | 1 fail（第二個 P2：註解曾被當成步驟邊界） |
| 以上全部還原 | 3/3 pass，全套 892 pass |

## 本機瀏覽器驗證

被解除守門的步驟指令在本機 preview 實跑：

```
NODE_PATH=… node tests/discovery-browser.cjs
PASS BROWSER desktop: guided discovery, shuffle, keyboard, combined filters,
  empty recovery, pending exclusion, direct links, refresh, back, overflow; axe violations=0
PASS BROWSER mobile: 同上；axe violations=0
PASS BROWSER small-mobile: 同上；axe violations=0
PASS SEARCH STATES: loading, error/retry, unknown scenario, partial corpus counts
```

- 1440／390／320 三尺寸、`pageerror` 0、無水平溢出。
- 這是 preview（`scripts/preview.py`），不是 Jekyll `_site`；built-site 由 CI 的 Jekyll build 步驟驗證。

## 限制

- 未逐一 dispatch 其餘 5 個 workflow；它們的 push 觸發分支已非 main（`feat/…`、`improve/…`），本輪只改條件，不變更流程內容。
- `node --test tests/*.test.cjs` 在 27 個 workflow 以 shell glob 展開：刪除單一 `.test.cjs` 不會讓指令失敗。那是 diff 裡看得見的刪除，且把筆數釘死會讓每次新增測試都要改守則，本輪不處理。
- 未使用實體手機或讀屏；無障礙數據來自本機 axe 掃描。

## 發布與正式站核對

- 交付：[PR #447](https://github.com/RichardHan/ai-agent-use-cases/pull/447)，實作 `43716689`、`f3a2e021`、`efb1c36a`、`f22ace10`，合併 `b266e6f1`。
- PR checks：Website QA [43835427695](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43835427695) success，`Run existing regression tests` **892 pass／0 fail**，`Verify the updated site in Chromium` 步驟 **success**（不再有可被跳過的版本）；Related reading QA [43835427650](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43835427650)、Reader QA [43835427646](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43835427646)、Corpus bundle QA [43835427636](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43835427636) success。
- 主線：[Website QA 43837300518](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43837300518) success（含 #446 後的 **899 tests**、`PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH b266e6f1df38…`、`PUBLICATION_MODE: exact`、`PASS LIVE` ×2）、[Pages 43837299861](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43837299861) success。
- 正式站 `catalog.json.sourceRevision` = `b266e6f1df3824afd32ba53f143f26f7bc87cc52`，與合併 commit 逐字相同；`index.html`／`assets/app.js`／`assets/style.css`／`assets/discovery.js` 與合併版 SHA-256 相同。`catalog.json` 由 Jekyll 建置產生（`builtAt`／`bundleRevision`／`sourceRevision` 會不同），不逐位元比對。
- 正式站三情境（1440／390）：
  1. 不知道工具名：首頁「會議整理」→ 29 筆、24 張卡片；
  2. 空結果復原：「旅遊」＋「開發」＋「待查線索」→ 0 筆，按「移除收錄狀態『待查線索』 → 查看 1 筆」→ 1 張卡片；
  3. 詳情直鏈：`?q=UC-445` → 詳情 10 個外部來源連結、關閉後查詢保留。
  兩尺寸水平溢出 0、`pageerror` 0。截圖：`desktop-1-task.png`、`desktop-2-empty.png`、`desktop-3-detail.png`、`mobile-1-task.png`、`mobile-2-empty.png`、`mobile-3-detail.png`。

## 下一輪的量測（正式站 `b266e6f1`，390×844）

空結果面板在兩種狀態下差很多：

| 查詢 | 面板高度 | 任務按鈕 | 面板內焦點停點 |
| --- | --- | --- | --- |
| `?q=旅遊` ＋情境「開發」＋狀態「待查線索」 | 397px | 3 | 3（皆為移除條件） |
| `?q=xyz987`（無可用詞） | 851px | 55 | 57 |

只有「查無可用詞」時才會一次列出全部 55 個任務；有可用詞時只給移除條件的按鈕。
