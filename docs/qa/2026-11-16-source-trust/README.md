# 2026-11-16：來源憑據與連結狀態

## 基準與選題

- 原工作樹 `main` 乾淨，安全 fetch 後 `origin/main` 為 `a4db7f62`（#417 的閱讀退路與後續 docs-only 發布紀錄已合併）。本輪在隔離 worktree `/Users/richard_han/orca/workspaces/ai-agent-use-cases/round-20261116`、分支 `improve/2026-11-16-round` 工作；未改原工作樹或其他 worktree。
- 基準單元測試 `node --test tests/*.test.cjs`：**850 pass／0 fail／0 skip**（[輸出](baseline-unit.txt)）。正式站當時 `catalog.sourceRevision` 為 `75b80718`；#418／#419 只改維護文件與 docs-only 重建，產品位元未變。
- 兩個獨立調查（VisitorFlowAudit、ContentIntegrityAudit）與 Actions 調查已回收。Actions 調查結論：近 48 小時失敗都有已修根因，PR #417 的 16 項 checks 全部成功，最新 main Pages／Website QA 成功；**本輪不改 CI**。原始調查只作線索，以下驗收由主 agent 重跑。

## 問題證據與目標使用者

兩類訪客會在詳情頁判斷「這篇能不能信、能不能點來源」：

1. **轉述與二手事件沒有出現在信任摘要。** UC-445 頁首寫「具名操作者訪談自述」，來源段明寫是 Clay 的 Davide Grieco 訪談 Eric Nowoslawski；但卡片只有「作者報告／示範」，沒有「取得：經轉述」。UC-016 的地址外洩事件頁面自述「原始 X 貼文這次沒查到，以下根據轉述和媒體報導，屬待核實的二手資訊」，頁首卻只宣告作者自述／官方文件／設計，沒有把該事件標成尚待查證。
2. **主要來源連結已失效，頁面沒有提示。** 2026-11-16 以 1,351 個非 X 網址做 HTTP 檢查（方法與原始輸出見下），19 個回 404。其中 UC-258 的 Fairsolid 舊倉庫、UC-456 的 Qiita 原文與舊倉庫、UC-453 的狼人殺專案、UC-384／UC-416 的 note 原文、UC-015 的 x.ai Bot 分享頁、UC-063 的 Plex 論壇頁，都是訪客實際會點的主要或輔助來源；原文沒有告知失效，點了只得到 404。

目標使用者是**開啟分享的詳情連結、用卡片憑據與來源連結判斷案例可信度，再決定是否採用的人**。本輪不新增案例、不改變主要來源類型計數，也不把 404 當成內容造假。

## 方案與取捨

- 方案 A：只修 UI 文案，遇到失效連結就在頁尾加通用提醒。成本低，但訪客無法知道哪一個來源失效、為什麼還有摘要，也無法區分轉述與第一手。
- 方案 B：資料層修正。轉述宣告寫進頁首的 `證據狀態`，讓既有 parser 產生「取得：經轉述」與「尚待查證」；失效／搬家連結逐頁標日期、原網址與可替代路徑；不改 parser 規則、不加網路檢查到 CI。成本是逐頁核對來源，但可保留原始網址與歷史，且與 README／templates 的既有規則一致。

選 B。所有變更都是既有欄位與既有渲染路徑，沒有新依賴、追蹤器或執行期外部請求。

## 完成的改動

| 檔案 | 改動 |
| --- | --- |
| `cases/445-campaign-experiment-goal-guard.md` | `證據狀態` 改為 `author-demo`，註明 Eric 的使用經驗經 Clay 訪談轉述整理；卡片／詳情／複製筆記新增「取得：經轉述」。`INDEX.md` 同步。 |
| `cases/016-marketplace-selling-buyer-messages.md` | 將 Matt Robb 地址外洩事件另列 `unverified`（原帖未取得、經媒體與轉述整理）；主要類別仍是作者報告／示範，詳情多一個「尚待查證」類別。`INDEX.md` 同步。 |
| `cases/258-scan-reconstruction-scale-topology-audit.md` | 舊 `living-relation/fairsolid` 已刪除；5 個固定版本連結改指 `handbuilt-cad` 的 `pipelines/fairsolid/`，明示舊 commit 與歷史未保留、不是逐位元替代。 |
| `cases/456-muse-github-markdown-static-site-operations.md` | 舊 `oosawak/markdown-cms` 已回 404；改指 `markdown-cms-oss`（作者標為最終 OSS 版），Qiita 原文 404 另註明，補上仍可讀的作者部落格版。 |
| `cases/453-werewolf-private-actions-token-gated-turns.md` | 原專案與固定版本連結回 404；保留原網址並註明沒有鏡像可核對同一 commit。 |
| `cases/384-paid-article-boundary-post-edit-verification.md`、`cases/416-linkedin-daily-follower-log-post-scorecard.md` | note 原文與公開 API 均回 404；保留當時摘要，明示無法重讀。 |
| `cases/015-public-page-change-watch.md` | x.ai Bot 分享頁回 404「share link may have expired」；補 Wayback 2026-10-15 快照，並說明不保證仍可複製或執行。 |
| `cases/063-plex-media-library-housekeeping.md` | Plex 論壇頁再查回 404；原本只寫「直接頁面讀取失敗」，補上日期與狀態。 |
| `tests/relayed-source-provenance.test.cjs` | 新增 UC-445 卡片／詳情／複製筆記回歸，以及 UC-016 二手事件仍保留主要類別、但詳情列出尚待查證的回歸。 |

已在前幾輪標註、本輪只核對未改的失效來源：UC-324（`tomoyk/failure-reports`，2026-10-25 已寫 Page not found）、UC-469（`AidaShika/anapay-moneyforward-skill`，2026-11-09 已寫 404）、UC-006／UC-042／UC-382（Toolchain PR 404 已寫公開 API 404）。

## 連結檢查方法與結果

- 從 `cases/*.md` 抽出 1,868 個唯一 URL；排除 517 個 `x.com`／`twitter.com`（登入與機器人限制會讓狀態不可靠），其餘 1,351 個以 `curl -L --max-time 12`、瀏覽器 UA 取得狀態。原始逐筆輸出：[url-status.txt](url-status.txt)、[404 清單](urls-404.txt)、[狀態統計](url-status-counts.txt)。
- 狀態分布：200×1200、403×64、429×44、404×19、400×15、000×7、402×1、202×1。**403／429／400／000 不當成失效**；例如 `ai.meta.com` 對 curl 回 400，但 Chromium 實開 200。`jojowanuby/LLM-Alignment-Atlas` 的 `(copied from VM)` 網址是抽出時被括號截斷的假 404，實際站內連結可開，未列入修正。
- 404 逐項以 Chromium 或 GitHub API 复核：x.ai 顯示「This template could not be found…share link may have expired or been deleted」；note 兩篇與 Qiita 一篇為 404；Plex 論壇「page doesn't exist or is private」；GitHub 以 `gh api repos/...` 確認 6 個 repo 為 404。替代／保留網址的實際狀態見 [link-verification.txt](link-verification.txt)：舊 Fairsolid、舊 markdown-cms、note、Qiita、Plex、werewolf 皆 404；`handbuilt-cad` 的遷移說明與 5 個 `pipelines/fairsolid/` 檔案、`markdown-cms-oss`、作者部落格、Wayback 快照皆 200。
- 限制：只查一次、不含 X；403／429 可能藏有失效頁；Wayback 只找到 UC-015 的快照，其他失效頁沒有鏡像；沒有登入付費或私人頁面。

## 測試與驗收

- 先寫回歸再改資料：UC-445 的 relayed set 與卡片斷言、UC-016 的尚待查證斷言在資料修改前失敗（`AssertionError: an interviewed author is not presented as a first-hand record`、`the address-leak event … must be named as unverified`），修改後通過。
- 最終 `node --test tests/*.test.cjs`：**851 pass／0 fail／0 skip**（[unit.txt](unit.txt)）；`node --check assets/app.js` 不變（本輪未改 JS）。`node scripts/check-published-surface.cjs`：**PASS，834 檔／5.87 MiB／9 項排除**。
- 本機 preview `python3 scripts/preview.py …`，<http://127.0.0.1:8140/ai-agent-use-cases/>，以 Chromium 走 1440×900 與 390×844（[browser-acceptance.txt](browser-acceptance.txt)）：
  1. 從首頁任務「日報整理」進入，得到 80 筆；開第一張卡，詳情有成果主張／核讀、固定版本來源；Escape 後焦點回到結果區。
  2. 搜「會議」＋情境「工作」，再輸入無結果字串；空結果後用鍵盤移除關鍵字，保留情境並回到結果，無水平溢出。
  3. 直鏈 `?case=UC-445&q=會議`：詳情顯示「取得：作者內容經第三人轉述或僅讀摘要整理」，Escape 後保留查詢。
  4. UC-016 詳情列出「尚待查證」與「同案宣告：社群線索（尚未證實）」；UC-258／456／453／384／416／015／063 展開來源段後都看到 2026-11-16 的連結狀態與替代路徑；UC-456 的新倉庫與部落格連結、UC-258 的 handbuilt-cad 連結、UC-015 的 Wayback 連結都在 DOM 中。
  5. 兩頁詳情 axe（wcag2a／2aa／21aa）零違規；只代表這兩個狀態。
- 視覺前後：`before/` 與 `after/` 同頁、同尺寸（1440×900；390×844 另存 UC-445／016 首屏與 UC-445 卡片）。UC-445 卡片在 `after/` 多了「取得：經轉述」；來源段在 `after/` 展開後標註。preview 因工作樹有未提交變更，`sourceRevision` 為空，固定版本來源連結會停用。這不是正式站行為，固定版本來源與 `sourceRevision` 留待合併後在正式站核對。

## 獨立審查

獨立 reviewer（SourceTrustReview，另一個任務上下文，未參與實作）先指出 QA 目錄不在它收到的 tracked diff；核對 worktree 後撤回，因為 `docs/qa/2026-11-16-source-trust/` 是未追蹤目錄且已在選擇性 commit 草稿中。第二次指出 [link-verification.txt](link-verification.txt) 只列了一個 Fairsolid 替代網址，與 QA 敘述不符；已補上其餘四個並重跑，全部 200。最終回覆：**「no findings remain」**，聚焦測試 9/9、全套 851/851、發布面檢查 PASS。審查未重跑瀏覽器；主 agent 的 preview 日誌與截圖仍在上方。[審查摘要](review.txt)

## 發布、限制與接續

- 本輪只改資料、測試與維護紀錄；不改 workflow、不新增依賴、不改搜尋／計數邏輯。來源類型計數維持 6／479／28／12／3／1（合計 529），情境合計 529。
- 未處理：VisitorFlowAudit 指出的 `copy.json` 前 20 個條目會覆寫案例頁自己的「怎麼開始／要注意什麼」，與 README 的承諾不一致（靜態證據，本輪未用瀏覽器逐頁核對）；ContentIntegrityAudit 指出的 UC-250 已併入 UC-156 但仍可被抽卡、卡片只顯示「用法靈感」。兩者都留待下一輪，不混入本輪。
- 下一輪最值得先做：**驗證 `copy.json` 的 20 個條目是否漏掉案例頁已宣告的限制**。先以 UC-001 與 UC-005 在正式站比對面板文字與頁面 `## 權限與驗收`／限制段，再決定是改資料、改 precedence，還是只修 README 契約；不要直接改成全部抽取，避免把長段原文塞進首屏。

## PR、合併與正式站

- 已提交、已推送 `2dd218a58bc93ba38fc4bf4621ee13af5564777a`，建立 [PR #420](https://github.com/RichardHan/ai-agent-use-cases/pull/420)。合併前 head 為同一 SHA、base `a4db7f62`、mergeState CLEAN；16 項 checks success、1 項 published 依 PR 規則 skipped，未把 skipped 當通過。
- 2026-11-15 22:13:12 UTC 正常 merge，合併版本 `1d318ebd22c7ea9d01b22237038542acfe643178`。對應 [Pages 43768063163](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43768063163) 與 [主線 Website QA 43768064019](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43768064019)。
- [Pages 43768063163](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43768063163) build／deploy／report 全部 success（2026-11-15 22:14:22 UTC 完成）；當時正式 `catalog.sourceRevision` 精確等於產品合併版 `1d318ebd22c7ea9d01b22237038542acfe643178`。
- 後續 docs-only [PR #421](https://github.com/RichardHan/ai-agent-use-cases/pull/421) 合併 `eff4e879`，[Pages 43769447931](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43769447931) success（22:29:10 UTC）；`sourceRevision` 推進為 `eff4e879…`，但只改 `SITE.md`／`docs/qa`，兩者均排除於發布面，產品位元不變。之後的 docs-only 合併同理；`sourceRevision` 不再等於產品合併 SHA 時，以 rendered 內容與排除清單核對，不宣稱同一個 SHA。
- 主 agent 實際開啟正式站（1440×900／390×844）：UC-445 卡片有「取得：經轉述」，詳情顯示「作者內容經第三人轉述或僅讀摘要整理」與固定合併版本的 GitHub 來源；UC-016 詳情列出尚待查證；UC-258／456／453／384／416／015／063 展開來源段都看到 2026-11-16 狀態與替代路徑；三情境、空結果鍵盤復原、直鏈重整／返回、無水平溢出通過；UC-445／016 詳情 axe 零違規。[正式站走查](live-acceptance.txt)、[截圖](live/)。
- `NODE_PATH=…/node_modules GITHUB_SHA=1d318ebd22c7ea9d01b22237038542acfe643178 node tests/deployed-browser.cjs` exit 0，回報 `PUBLISHED_LIVE_BUILD_CURRENT 1d318ebd…`；桌面／手機、搜尋、直鏈、空結果復原與停用 JS 的索引退路全部通過：[日誌](live-deployed-browser.txt)。
- 真正 Jekyll 產物：`cases/445-…html`、`cases/258-…html`、`cases/456-…html`、`INDEX.html` 均 HTTP 200，且分別含「經 Clay 訪談轉述」、`handbuilt-cad`×5、`markdown-cms-oss`×2、INDEX 的「經 Clay 轉述」。
- 主線 [Website QA 43768064019](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43768064019) **success**（22:13:15–22:26:03 UTC，低於 25 分鐘上限）：851 tests／851 pass、實際 Jekyll build、built corpus／語言／發布面／fallback 頁、`Wait for published assets and content` 與正式站走查全部成功；`Fail when the published site cannot be verified` 依設計 skipped，不是關閉檢查。日誌摘要：[main-qa.txt](main-qa.txt)。
