# 2026-11-16：退役的 500 案口徑與已併入補充頁的統計揭露

## 基準與選題

- 隔離 worktree `/tmp/aiuc-20261116-r4`，分支 `improve/2026-11-16-r4`，自 `origin/main` `a178bc70` 建立；安全 fetch 後 main 前進到 `6c17b981`（PR #428，當日研究批次），分支已 rebase 到 `6c17b981`。原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 與其他 16 個 worktrees 未動。
- GitHub 身分 RichardHan；建立時無其他開啟中的 PR。repo／父層沒有 `AGENTS.md`；沿用 README、`SITE.md`、`_config.yml`、`docs/qa/2026-11-16-merged-supplement-draw/README.md` 與 Website QA。
- 執行模型實際是 `litellm/deepseek-flash-gmi`；未切換模型、未改設定或付費通道，不宣稱使用 Terra／Gemini 或最高推理。
- 基準 `node --test tests/*.test.cjs`：855 pass／0 fail（`a178bc70`，522 個案例檔）。repo 沒有另外定義 lint／type check。
- 正式站基準：`catalog.json.sourceRevision` = `a178bc70e69a75ff14974d6487e1ce61ec544c76`；522 個案例檔＋3 篇經驗＋4 條待查＝529 條目，526 個來源檔。
- 正式站實走（WebKit，1440×900／390×844）：首頁、搜尋、組合篩選、強制空結果與復原、詳情直鏈與重整、來源連結、Escape 返回、方向鍵跨批次（164 筆結果連按 26 次「下一則」仍正常）、大分類 facet 計數逐項等於結果筆數、axe 0 違規。這些是本輪的既有行為基準，不是本輪成果。

## 觀測到的問題

1. **現行頁面仍引用退役的 500 案口徑。** 官網與索引都寫「以 1,000 個不同實作工作流程為目標」（`index.html` 統計卡「/ 1,000 案」、`INDEX.md:16`），但現行案例頁與目前索引表有 8 處仍在講 500：
   - `cases/003`、`023`、`025`（2 處）、`042`：「不增加500目標計數」。
   - `cases/095`、`096` 頁首原始欄位：「500 案例計數候選：…」。
   - `cases/250` 證據狀態：「合併UC-156，不計500目標」。
   - `INDEX.md` 目前表格：UC-009「未加500計數」、UC-250「來源補頁不另計500」。
   `sources/qualification-audit-2026-10-16.md` 自己寫明目標已由 500 提高到 1,000，歷史段落保留當時口徑；上述 8 處不屬歷史段落。
2. **UC-250 的併入狀態在正式站語意破損。** 詳情「頁首證據說明」顯示「重複流程來源補充；合併UC-156，不計500目標」，同頁上方又寫「本頁已合併至 UC-156，不另計一案」。統計卡把這頁算進「525 個主要案例頁」，卻沒有任何說明它是已併入的補充頁。三處訊號彼此矛盾。
3. **統計卡沒有揭露 525 中含已併入補充頁。** 前兩輪已處理「待查線索已處理」差額，但同一張卡的另一種非獨立條目（已併入的補充頁）仍靜默計入。這個數字會隨資料變動，不能寫死。

## 方案與選擇

- 口徑：①只把 500 字樣換成 1,000；②改成 1,000 案目標並讓頁面說明併入關係。選②：只換數字仍會留下「合併UC-156」與「不另計一案」並列的破句，且不能解釋統計卡。
- 揭露：①在文案寫死「其中 1 頁」；②由 catalog metadata 的 `mergedInto` 計算。選②：新增補充頁時數字自動正確，`tests/count-target-consistency.test.cjs` 以 0／1／7 頁三種輸入驗證。
- 範圍：只改現行案例頁、目前索引表、統計卡與 README 規則說明；`INDEX.md` 的歷史研究紀錄（「268／500」等）與稽核報告的歷史批次快照保留，因為它們是當時的快照，不是現行口徑。不搬移或刪除 UC-250。

驗收條件：現行案例頁與目前索引表不再出現 500 案計數說法；UC-250 顯示「已併入 UC-156，不另計入 1,000 案目標」；統計卡顯示由資料算出的已併入頁數，390／320 可見且無水平溢出；歷史研究紀錄仍保留 500 快照；完整 unit suite 全綠。

範圍外：合格數 370／1,000 的重算、UC-250 是否移到補充表（涉及目錄即 kind 的既有設計）、16 個 PR workflow 重複跑 unit suite 的 CI 訊號放大。

## 實作

- `cases/003,023,025,042`：改為「不增加 1,000 案目標的計數」。
- `cases/095,096`：`- 500 案例計數候選：…` 改為 `- 計數判定：實際使用自述列為候選；…`，保留原本的判準敘述。
- `cases/250`：標題與證據狀態改為「已併入 UC-156，不另計入 1,000 案目標（保留供搜尋與閱讀）」。
- `INDEX.md`：目前表格 UC-009、UC-250 兩列同步；`INDEX.md` 其餘 17 處「500」中 15 處在 `research-log` 錨點之後，另兩處是 UC-056 的「遷移500」與 UC-500 編號，都不是計數口徑。
- `assets/app.js`：`catalogCounts()` 增加 `caseMerged`；新增 `mergedSupplementNote(items)`（最多列 5 個 id，其餘以「等」收尾）；`refreshCorpusMetadata()` 寫入 `#merged-note` 並依有無內容設定 `hidden`。
- `index.html`／`assets/style.css`：新增 `#merged-note`，手機版與 `#pending-note` 同一條可見性覆寫（`.stats p{display:none}` 只影響其他段落）。
- `README.md`：補上統計卡會揭露已併入補充頁，以及現行頁面不再使用 500 口徑、只有歷史紀錄保留。
- `tests/count-target-consistency.test.cjs`：4 項測試（現行案例頁、目前索引表＋歷史區保留、UC-250 併入狀態、揭露句 0／1／多頁與真實語料）。

## 回歸

- 紅：把 `cases/003` 改回「不增加500目標計數」→「current case pages…」失敗；把 `mergedSupplementNote()` 的「不另計入 1,000 案目標」字樣移除 →「the stats note…」以 `AssertionError: the note ties the exclusion to the current target` 失敗。兩次都在還原後重跑為綠，沒有在正式站注入錯誤。
- 綠：`node --test tests/*.test.cjs` **859 pass／0 fail**（rebased `6c17b981`，525 個案例檔）。`node --check assets/app.js`、`node --check tests/count-target-consistency.test.cjs` 成功。
- `python3 scripts/preview.py /tmp/aiuc-r4-preview/ai-agent-use-cases`：產品提交 `4ecef18580d8b432f0a476a7fd698d4a733ca0c0` 時 `catalog.json.sourceRevision` = 同值、529 來源檔；後續 `8299b3e3`／`8bb34959` 只改測試，產品位元不變。預覽是靜態檔，不是 Jekyll build；真正 Jekyll 由 PR Website QA 驗證。
- `tests/discovery-browser.cjs`（副本僅改 origin 為 8145，repo 內檔案未改）：exit 0。1440／390／320 的 guided discovery、抽卡、鍵盤、組合篩選、空結果復原、待查排除、直鏈、重整、返回、無溢出全部 PASS，axe violations=0；另含行動搜尋、卡片工具、Cursor 情境、bot 帳號情境、剪貼簿失敗與網路失敗復原。[輸出](discovery-browser.txt)
- `tests/evidence-attribution-browser.cjs`（`ATTRIBUTION_URL=http://127.0.0.1:8145/…`）：exit 0。新增的 `#merged-note` DOM 檢查在 1440／390／320 都要求元素存在、rendered、height>0、文字含 UC-250 與「不另計入 1,000 案目標」，且顯示頁數等於 `catalogCounts(entries).caseMerged`。

## 獨立審查與修正

- `CountConsistencyReview`（獨立 context，未參與實作）初審 **Changes requested**，兩個 P2：
  1. 退休口徑的 regex 沒涵蓋 `不計500目標`，且 UC-250 的 `/500/` 斷言可能誤擋合法金額。
  2. 揭露句只測 helper，沒有測 `#merged-note` 是否真的渲染；刪掉段落或寫入程式仍可能全綠。
- 第 1 點在 `8299b3e3` 已加入 `不計` 與 `500 目標` 分支，並以 `不增加 500 元`、`增加 500 名玩家` 驗證不誤報；`node -e` 實測 `不計500目標` true、兩個金額／人數例子 false。
- 第 2 點在 `8bb34959` 補上 `tests/evidence-attribution-browser.cjs` 的 rendered DOM 斷言。紅測：把 `index.html` 的 `#merged-note` 暫時改名為 `#merged-note-x`，測試以 `desktop: the merged-supplement note exists in the stats card` 失敗（exit 1）；還原並重建預覽後 exit 0。
- 複核 **Approve with nits**：兩個 P2 都確認解決；唯一非阻擋 nit 是 UC-250 的 `/500/` 斷言仍可能誤擋合法金額。已改為 `/500\s*(?:案)?(?:目標|計數|案例計數)/`，4 項測試重跑全綠。沒有 P1，也沒有安全、隱私或資料外洩發現。

## PR 與發布

- PR [#429](https://github.com/RichardHan/ai-agent-use-cases/pull/429)，base `6c17b981`；產品提交 `4ecef185`，測試提交 `8299b3e3`、`8bb34959`、`049e6dfa`。最終 head `049e6dfa` 的 16 項 PR checks 全部 pass，2 個 `published` 依設計 skipping；一般 merge 為 `bd0c0a9754e8ac5b23e50eeed676473717e1b662`。
- 合併後 Pages `43786720678` build／deploy／report 全部 success（51 秒級）；主線 Website QA `43786721310` 的 published 閘門另記於下方。remote 分支已刪除。

## 訪客驗收

- 預覽 UC-250 詳情（1440／390）：證據狀態顯示「重複流程來源補充；已併入 UC-156，不另計入 1,000 案目標（保留供搜尋與閱讀）」，並保留「站內閱讀主案例 UC-156」入口；頁面不再出現 500。
- 預覽與正式站搜尋顯示 `532 / 532` 筆收錄（525 案例＋3 經驗＋4 待查；其中 P-002／P-004 已處理）。
- 預覽統計卡（1440／390／320）：案例頁 `525`；`#merged-note` `display:block`、文字「其中 1 頁（UC-250）是已併入主案例的補充頁，仍可搜尋與閱讀，不另計入 1,000 案目標。」高度 18／44／66px，水平溢出 0。
- 無障礙：Chromium AX tree 中該段為 `StaticText`，位於 `#collection-stats` 的 `section[aria-label="收錄與核對統計"]` 內，讀屏可讀。
- 前後截圖（元素級，Playwright）：[正式站 UC-250 證據區 1440](live-uc250-evidence-desktop.png)／[390](live-uc250-evidence-mobile.png) → [預覽 1440](preview-uc250-evidence-desktop.png)／[390](preview-uc250-evidence-mobile.png)；[正式站統計卡 1440](live-stats-desktop.png)／[390](live-stats-mobile.png) → [預覽 1440](preview-stats-desktop.png)／[390](preview-stats-mobile.png)。文字與幾何在 [measurements.json](measurements.json)；正式站 INDEX 的 UC-250 列另存 [文字](live-index-uc250-row.txt) 與 [截圖](live-index-uc250-row.png)。
- 正式站（合併版 `bd0c0a97`）：UC-250 證據區顯示新句、統計卡 `#merged-note` `display:block`、INDEX 的 UC-250 列顯示「已併入 UC-156；補充頁不另計入 1,000 案目標」，1440／390 水平溢出 0；[正式站 UC-250 證據 1440](after-uc250-evidence-desktop.png)／[390](after-uc250-evidence-mobile.png)、[統計卡 1440](after-stats-desktop.png)／[390](after-stats-mobile.png)、[INDEX 列](after-index-uc250-row.png)，量測在 [after-measurements.json](after-measurements.json)。
- `NODE_PATH=… GITHUB_SHA=bd0c0a9754e8ac5b23e50eeed676473717e1b662 node tests/deployed-browser.cjs`：exit 0，`PUBLISHED_LIVE_BUILD_CURRENT bd0c0a97…`；桌面／手機搜尋、詳情直鏈重整、來源、返回、組合空結果復原、JS-disabled 索引回退全部通過，axe 0。[日誌](live-deployed-browser.txt)
- 位元核對：正式站 `index.html`、`assets/app.js`、`assets/style.css`、`README.md`、`INDEX.md`、`cases/250-…md` 皆 HTTP 200，SHA-256 與合併版逐位元相同。
- 限制：本環境停用影像輸入，沒有逐像素目視截圖；以上為 DOM／computed style／幾何／AX tree 證據。未用實體手機、讀屏實聽或 Firefox／WebKit 交叉重跑。未做效能與全站無障礙基準。

## Actions 現況（本輪即時確認）

- 最近 100 個 runs（2026-11-15T19:01Z–2026-11-16T00:21Z）**全部 success**，0 failure／0 cancelled／0 in-flight；`main` 最新 Pages `43779908854`（`a178bc70`，51 秒）成功，live `sourceRevision` 與之相符。歷史紅牆在 2026-11-15T00:38Z 的 `6322e0c6`：16 個 workflow 同時失敗，根因是兩個硬編總數斷言（已於同輪改為 `>=`），不是權限、額度或 Pages 故障。
- 仍存在的訊號放大問題：16 個 PR workflow 各自重跑完整 `tests/*.test.cjs`，單一斷言失敗會變成 16 個紅 check、每次 push 多 15 次全套單元執行。本輪**不改 CI**，避免把健康狀態當故障處理；列為下一輪候選。
- 本輪不重跑舊 run；PR checks 另見 PR 頁面。

## 下一輪

- 最值得做的一件事：把 16 個 PR workflow 重複執行的完整 `tests/*.test.cjs` 收斂到擁有者 `website-qa.yml`，讓單一斷言失敗只產生 1 個紅 check，並保留各 surface 的 browser 步驟。這是訊號與成本問題，不是目前紅燈；本輪不改 CI。
- 先做哪個驗證：在一個小型 PR 上比較同一 `head_sha` 的 run 數、有執行 unit step 的 job 數與 critical path；確認 `website-qa.yml` 仍跑完整單元套件，且被移除 unit step 的 workflow 仍執行自己的 browser surface。先做 1–2 個 workflow 的 pilot，再推廣，不一次改 15 個檔案。
