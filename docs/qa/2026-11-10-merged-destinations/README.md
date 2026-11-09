# 2026-11-10 已併入的待查線索只交出一個主案例

## 基準

- 開發基準 `origin/main` `7abbfc36`（正式站 `catalog.json.sourceRevision` 同值、510 個來源檔、513 個條目）。隔離 worktree `/private/tmp/aiuc-20261110-round`（分支 `improve/20261110-merged-destinations`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`、落後 main 275 個 commit，且有 159 個未追蹤的他人研究檔；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`：**583 通過、0 失敗**；`node --check assets/app.js` 通過。
- main 現況重新確認（不沿用歷史故障）：最近 100 次 run 為 99 success／1 failure，`website-qa.yml` 在 main 上連續 40 次 success，`pages build and deployment` 最近一次 1 分 15 秒 success。本輪沒有重跑任何 workflow。

## 問題證據

目標使用者是**從分享連結或搜尋結果讀到一條待查線索、想知道它被併到哪裡的人**。他要判斷的是「這條線索的內容在哪裡」，站方給的交接必須和來源檔一致。

`sources/pending.md:34` 對 P-004 記了兩個目的地：

> 狀態：2026-10-16 已處理：公開原作者結果補讀後，已併入 [UC-101 招標機會篩選](…)，另記 [UC-102 安全表單修訂草稿](…)；不再重複計入待查。

`INDEX.md:544` 也寫「招標機會篩選線索（P-004）已併入 UC-101／UC-102」。但 `assets/app.js:1001` 只取第一個 `併入\s*(UC-\d{3})`。正式站 `7abbfc36`（Chromium 390×844）的 `?case=P-004`：

| 位置 | 基準文字 |
| --- | --- |
| 詳情徽章 | `待查線索・已併入 UC-101` |
| 交接說明 | `來源檔已標示處理完成並併入 UC-101` |
| 站內入口 | 只有「站內閱讀主案例 UC-101」 |
| 搜尋結果卡（`?q=標案`） | `已併入 UC-101（不另計數）` |

UC-102 在頁面上只以 GitHub 外鏈出現，站內沒有入口；同一頁的徽章與交接說明也和來源檔不一致。

## 選擇

**方案 A（採用）：把目的地解析成有序清單，一個目的地一個站內入口，文字一律列出全部。**
- 解析規則：`併入／另記／另見／合併` 後面直接接的 `UC-nnn` 全部收進 `mergedInto`（保留來源寫的順序、去重）。只為比較而提到的編號（`與 UC-005 的分工差異`）沒有併入動詞，不算目的地。
- 受影響的五個介面都改吃同一份清單：詳情徽章、交接標題與說明、站內入口（`.detail-merged-open` 一個目的地一顆按鈕，缺檔的才出 `.detail-merged-pending`）、列印註記、結果卡 `kind` 徽章。
- 沒有記錄目的地時（`resolved` 為真但狀態行沒寫併入對象）不再印出「已併入 undefined」，而是維持不宣稱。

**方案 B（不採用）：改寫 `sources/pending.md`，把 UC-102 從 P-004 移除，讓來源與畫面一致。** 成本最低，但會刪掉協作者的研究紀錄：UC-102 確實是這條線索補讀後另記的產物，`INDEX.md` 與稽核檔都引用它。

**方案 C（不採用）：只在畫面上加一行「另有 UC-102」。** 讀者仍然點不進去，等於承認壞掉。

## 改動

- `assets/app.js`：`mergedDestinations()`／`mergedDestinationText()`，`parseFile()` 的 `mergedInto` 由單一字串改為有序陣列，`resolvedPendingNote()`、`mergedDestination()`、`refreshMergedDestination()`、詳情徽章、交接句、列印註記、結果卡徽章改吃清單。
- `assets/reader.css`：`.detail-merged-actions` 直向排列，多個入口不擠成一段。
- `tests/merged-destinations.test.cjs`（新，5 項）、`tests/pending-resolution.test.cjs`、`tests/search.test.cjs`（`mergedInto` 由字串改陣列的契約）。
- `README.md`：待查線索段落補上「記了兩個案例就給兩個站內入口」。

沒有新增 workflow；`Website QA` 既有的 `node --test tests/*.test.cjs` 會跑到新測試。

## 先紅後綠

新增的 5 項在未改動的基準 `7abbfc36` 上：

- `P-004` 的 `mergedInto` 是 `'UC-101'` → 期望 `['UC-101','UC-102']`：**失敗**。
- 結果卡徽章只寫 `已併入 UC-101`：**失敗**。

改動後 5 項全過；`tests/pending-resolution.test.cjs`、`tests/search.test.cjs` 的契約同步改成陣列後也全過。

## 驗收

### 本機預覽（Chromium，390×844，`http://127.0.0.1:8127/`）

| 檢查 | 結果 |
| --- | --- |
| `?case=P-004` 徽章 | `待查線索・已併入 UC-101、UC-102` |
| 交接標題 | `這條待查線索已併入下列主案例` |
| 交接說明 | `來源檔已標示處理完成並併入 UC-101、UC-102，不另計一案…` |
| 站內入口 | 兩顆：UC-101（先篩掉不合資格的招標…）、UC-102（法規改了，先找出公司哪張安全表單需要修…）；點 UC-102 進得去、Back 回到 P-004 |
| `?q=標案` 結果卡 | `已併入 UC-101、UC-102（不另計數）` |
| `?case=P-002` | 仍只有 `UC-028`，沒有多出目的地 |
| `?case=UC-250`（單一來源補充） | 仍只有 `UC-156`，`tests/related-browser.cjs` 的 `.detail-merged-open` 計數 1 不變 |

### 前後截圖

`before-*` 取自正式站 `7abbfc36`，`after-*` 取自本輪預覽；同一頁、同一尺寸、同一資料狀態：

- `before/after-{desktop,mobile,small}-detail-P-004.png`（交接區塊與站內入口）
- `before/after-{desktop,mobile,small}-detail-P-004-top.png`（徽章）
- `before/after-{desktop,mobile,small}-card-P-004.png`（`?q=標案` 結果卡徽章）

### 三種訪客情境（本機預覽，Chromium 390×844）

| 情境 | 操作 | 結果 |
| --- | --- | --- |
| 1. 不知道工具名的新訪客 | 按 `/` → 焦點在 `#query` → 輸入「整理會議記錄」→ Enter | 8／513 筆，第一張卡 UC-071 在 300px（視窗內） |
| 2. 組合搜尋遇空結果再恢復 | `?q=規劃旅行&scenario=工作` → 按第一個復原動作 | 0 筆 →「移除使用情境「工作」→ 查看 1 筆」→ 1／513 筆 |
| 3. 分享的詳情連結 | `?case=P-004` → 讀「成果主張／核讀」→ 來源 → Escape | 徽章同時列出 UC-101、UC-102；原始 Markdown 固定在 `blob/7abbfc36…`；Escape 後回到 513／513 並關閉對話框 |

### 測試

- `node --test tests/*.test.cjs`：基準 **583 通過** → 本輪 **588 通過、0 失敗**（新增 5 項）。
- `node --check assets/app.js` 通過；`python3 scripts/check_corpus_bundle.py /tmp/preview-after` 回報 510 個來源逐 byte 相同。
- `?case=P-004` 與 `?q=標案`（1440×900／390×844／320×740）本機預覽：axe **0** 違規、`pageerror` 0、水平溢出 0。
- `Website QA`「Verify the updated site in Chromium」的 17 支腳本在本機以同一份清單跑（Chromium，預覽在 `http://127.0.0.1:8081/ai-agent-use-cases/`）：**17 支全數通過**；`discovery-browser.cjs` 硬寫 8081，因此另起同埠預覽後執行。

## 本輪發現但未修：關閉詳情後的第一次「上一頁」沒有反應

這是一個已確認、可重現的缺陷，但修它會改變「關閉詳情」的時序契約，因此留給下一輪（證據與分析都已齊備）：

正式站 `7abbfc36`（Chromium 390×844，`?q=會議` → 第一張卡 → 按 X 關閉 → Back）：

| 步驟 | 網址 | history.length | 畫面 |
| --- | --- | --- | --- |
| 搜尋後 | `?q=會議` | 3 | 26 筆 |
| 開啟 UC-094 | `?q=會議&case=UC-094` | 4 | 詳情 |
| 按 X 關閉 | `?q=會議` | 4 | 26 筆（第 4 筆已被改寫成與第 3 筆相同） |
| Back 一次 | `?q=會議` | 4 | 26 筆，**沒有任何變化** |
| Back 二次 | 空白頁 | 4 | 離開網站 |

原因：`showDetail()` 用 `pushState` 開一筆詳情歷史，`closeDetail()` 用 `replaceState` 把同一筆改寫成清單網址，兩筆相鄰歷史因此同址。

本輪試過並撤回的修法：關閉時 `history.go(-1)` 讓 popstate 收掉對話框。它在三引擎的前後比對中確實修好上述序列，但：

1. 關閉從同步變成非同步。`restoreDetailFocus()` 不能在 `<dialog>` 還開著時把焦點移出去（modal 限制），所以焦點要等 popstate 重繪清單後才回來；repo 內約 40 處既有斷言在 `press('Escape')` 後**同一個 tick** 檢查 `document.activeElement`／網址（例如 `tests/table-reading-browser.cjs:15`、`tests/search-context-live.cjs:28`、`tests/load-recovery-browser.cjs:104`），本輪在 CI 上實測三個 workflow 因此轉紅。
2. 一律彈回清單會刪掉「讀過哪幾篇」的痕跡，`tests/related-browser.cjs:141-146`（關閉相關案例、換搜尋、再 Back 兩次要回到原案例）與箭頭鍵回歸要求保留。

下一輪的做法：先建立一個「關閉後焦點與網址在何時成立」的共用 helper（例如 `await closeDetail(page)`），把上述斷言改成等待該 helper，再改 `closeDetail()`；驗證先跑 `tests/related-browser.cjs`、`tests/table-reading-browser.cjs`、`tests/search-context-live.cjs`、`tests/load-recovery-browser.cjs`、`tests/results-batching-browser.cjs`。

## 已知限制

- 多目的地只涵蓋 `併入／另記／另見／合併` 後面直接接 `UC-nnn` 的寫法；`2026-10-20 已處理；合併 UC-156 與 UC-157 兩篇` 這種第二個編號沒有動詞的句子只會收到 UC-156。全庫目前只有 P-004 有多個目的地，因此畫面只變這一頁。
- `mergedInto` 由字串改陣列是資料契約變更；已同步 `tests/pending-resolution.test.cjs`、`tests/search.test.cjs`，`assets/` 內沒有其他消費者依賴字串。
- `node scripts/check-page-language.cjs` 需要 Jekyll 產物（`_site`），本機沒有 Jekyll，未在本機執行；本輪未改 HTML／Liquid。
- 沒有真人使用者研究；「多一個站內入口是否提高接手率」未量測。

## 發布

| 狀態 | 內容 |
| --- | --- |
| 已提交 | `a2bf89d6`（base `7abbfc36`） |
| 已推送 | `origin/improve/20261110-detail-exit`（PR 內的實作分支；本輪先以 `improve/20261110-detail-exit` 命名，內容已收斂為併入目的地） |
| PR | [#305](https://github.com/RichardHan/ai-agent-use-cases/pull/305) head `a2bf89d6`，**14 項非略過檢查全 pass**、`published` 依設計在 PR 上 skipping |
| 已合併 | squash `5de8fa98` |
| 部署 | `pages build and deployment` [42682123442](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42682123442) success |
| 正式站已驗證 | 是：`catalog.json.sourceRevision` = `5de8fa98…`、`builtAt` 2026-11-09、510 個來源檔；`assets/app.js`／`reader.css`／`copy.json` 與合併版本 sha256 逐 byte 相同 |

### 正式站核對（`5de8fa98`，Chromium 1440×900／390×844／320×740）

| 檢查 | 結果 |
| --- | --- |
| `?case=P-004` 徽章 | `待查線索・已併入 UC-101、UC-102`（三種寬度一致） |
| 站內入口 | 兩顆：點第二顆進入 `?case=UC-102`「法規改了，先找出公司哪張安全表單需要修」，Back 回到 P-004 |
| `?q=標案` 結果卡 | `已併入 UC-101、UC-102（不另計數）` |
| `?case=P-002` | 單一目的地 UC-028，只有一顆站內入口 |
| 情境 1（`/` →「整理會議記錄」→ Enter） | 8／513 筆，第一張卡 UC-071 在 300px |
| 情境 2（`?q=規劃旅行&scenario=工作`） | 0／513 → 復原後 1／513 |
| 情境 3（`?case=P-004`） | 見上；來源仍固定在同一個發布版本 |
| pageerror | 三種寬度 0 |
