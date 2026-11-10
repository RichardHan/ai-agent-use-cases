# 2026-11-11 「適合對象」把本庫寫的情境通用句說成這篇案例的對象

## 基準

- 開發基準 `origin/main` `210f980d`（同日稍早併入 PR #317 的拉丁同義詞邊界修正）。隔離 worktree `/tmp/aiuc-target-round`（分支 `improve/20261111-target-user-provenance`）。
- 開工時 PR #318（`improve/20261110-declared-category`，只改主題分類）仍未合併；實作完成後 main 前進到 `8fb95339`（#318 併入），本輪已把 main 併回分支並重跑驗收。唯一衝突是 `website-qa.yml` 同一段加上各自的新腳本一行，兩行都保留。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`，有 159 個未追蹤的他人研究檔與 QA 產物；本輪未觸碰。
- 基準 `node --test tests/*.test.cjs`：**607 通過、0 失敗**；`node --check assets/app.js` 通過。
- Actions 現況重新確認（不沿用歷史故障）：main 上 `Website QA` 連續 25 次 success（`42697785268` … `42708373335`），`pages build and deployment` 近 30 次只有 2 次 failure，兩次都是 `Deploy to GitHub Pages` 在 10–12 秒出現平台端 `Deployment cancelled.`（`42709949822`、`42697783315`），build 成功、需人工重跑，與本輪內容無關。**本輪沒有修改任何測試斷言以外的檢查，也沒有關閉任何 workflow。**
- 正式站進站時 `catalog.json.sourceRevision` 為 `0ece4ceb`；本輪只改前端渲染與文案，來源檔 510 個未動。

## 問題證據

目標使用者是**第一次讀到某篇案例、正在判斷「這是不是給我的」的人**。

- 全庫 513 個條目只有 **209 個**案例頁在頁首寫 `- 目標使用者：`；其餘 **304 個**（297 篇案例＋3 篇經驗補充＋4 條待查線索）完全沒有這個欄位。
- 沒有宣告時，卡片與詳情的 `適合對象` 都由 `SCENARIO_TARGET_USERS[item.scenario]`（`assets/app.js:137-145`，六句本庫寫的情境人物）填滿，**而且沒有任何標記**：`assets/app.js:1776-1783`（詳情）、`2066-2072`（卡片）。畫面上它與真正宣告的句子長得一模一樣。
- 同一頁的隔壁區塊卻有標記：`實作門檻` 會寫「案例頁未宣告門檻，這是由本庫依內文關鍵字推測」（`assets/app.js:1748-1750`）。同一份資料、兩種誠實標準。
- 正式站實測（`?case=UC-005`，390×844）：詳情寫「適合對象｜工程師、程式開發者、技術架構師或自動化流程建構者」，而 `cases/005-cloud-pr-review.md` 只有 `- 目標：…`，沒有 `- 目標使用者：`。`?case=UC-270` 有宣告，畫面完全相同、無法分辨。
- 既有測試把這個行為釘住：`tests/visitor-clarity-and-actions-stability.test.cjs:79` 要求卡片出現「👤 適合對象：進行自主學習」；`tests/detail-reading-and-evidence.test.cjs:262-284` 只檢查 fallback 有「適合對象」字樣。也就是說，先前把覆蓋率做到 100% 的做法，是用本庫文案補滿缺漏（`SITE.md` 2026-10-25 該輪自述「使全站案例 100% 具備清晰對象說明」）。

## 三個方案

- **A（採用）分開兩種主張，共用一個 helper。**
  - 宣告的頁面：標題 `適合對象`、正文用頁首原句、下方註記「案例頁自行宣告適合對象；本庫未另外驗證。」
  - 未宣告的頁面：標題 `情境常見讀者`、正文仍是六句情境通用句、下方註記「案例頁未宣告適合對象；以上是本庫依「開發」情境整理的常見讀者，不是這篇案例作者的說法。」
  - 卡片同步：宣告頁 `👤 適合對象：`，未宣告頁 `👤 情境常見讀者：`，並在 `data-target-user-source`、`title`、`aria-label` 標明來源。
  - 價值：保留原本就有的入門方向，只把「誰說的」講清楚；與 `實作門檻` 既有的揭露方式一致。成本：`assets/app.js` 一個 helper 加兩個渲染點、`assets/style.css` 一行、兩個測試更新、一支新瀏覽器測試。
- **B 未宣告就整段不顯示（只留「未記錄」）。**
  - 最保守，但 304 個條目會失去唯一的受眾線索；搜尋與抽卡卡片高度會大幅變動，且與 2026-10-25 以來的版面預算相反。不採用。
- **C 從正文抽「目標使用者」補進 metadata。**
  - 209 篇頁首已有宣告，其餘頁面正文多半只有敘述，抽取等於由本庫生成新的主張，違反本輪目的。不採用。

選 A：問題不是「有通用句」，而是「通用句被說成案例自己的話」。把來源標清楚，比刪掉資訊或代寫主張都更接近事實。

## 改動

- `assets/app.js`
  - 新增 `targetUserView(item)`（`146-166`）：唯一決定 heading／label／text／note／source 的地方。
  - 詳情 `detail-target-user`（`1776-1783`）：改用 helper，加上 `data-target-user-source` 與 `.detail-target-user-source` 註記。
  - 卡片 `.card-target-user`（`2066-2072`）：改用 helper，`data-target-user-source`、`title`、`aria-label` 都帶來源。
- `assets/style.css:86`：`.detail-target-user .detail-target-user-source` 12.5px／muted，與 `.detail-difficulty-source` 同級。
- `README.md`：「適合對象」段落說明 209／304 的分野與卡片標記。
- `templates/case.md`：`目標使用者` 欄位註明未填時網站顯示情境通用句並標示來源。
- 測試：新增 `tests/target-user-provenance.test.cjs`（4 項，全語料 513 條目掃描）、`tests/target-user-provenance-browser.cjs`（3 種寬度）；更新 `tests/detail-reading-and-evidence.test.cjs`、`tests/visitor-clarity-and-actions-stability.test.cjs`（把「印出通用句」改成「印出通用句並標明來源」，不是放寬）、`tests/visitor-adoption-flow-browser.cjs`（標籤依來源）。
- `.github/workflows/website-qa.yml:88`：在既有 Chromium 步驟加一行執行新腳本（`tests/**` 已在 path filter 內）。

## 測試

- `node --test tests/*.test.cjs`：基準（`210f980d`）**607 通過／0 失敗** → 本輪單獨 **611 通過／0 失敗**（+4）；併回 `8fb95339`（#318 帶來 6 項）後 **617 通過／0 失敗**；`node --check assets/app.js` 通過。
- 先紅後綠（同一支腳本、同一份 513 條目資料）：
  - 基準預覽（`210f980d` 建置，`127.0.0.1:8191`）：`tests/target-user-provenance-browser.cjs` **失敗**，`desktop: UC-270 declares its audience`（`'' !== 'declared'`，舊版沒有任何來源標記）。
  - 本輪預覽（`127.0.0.1:8192`）：**通過**，1440×900／390×844／320×740 三種寬度、三種情境，axe 0、水平溢出 0、page error 0。
- 全語料不變量（`tests/target-user-provenance.test.cjs`）：209 個宣告條目全部 `source=declared` 且正文等於頁首原句；304 個未宣告條目全部 `source=scenario`、標題不是「適合對象」、註記含「案例頁未宣告適合對象」與情境名；0 個條目在有人物句時卻整段消失。半形冒號、空白等寫法不會讓宣告被誤判成 fallback。
- 獨立審查（未參與實作的另一個 agent context）指出 1 項 should-fix 並已修正：卡片掃描只在遇到 `scenario` 卡片時才檢查標籤，卻沒有保證掃到過。改為先用 `?q=UC-005` 直接開該卡斷言 `source=scenario`、可見標籤不是「適合對象」、`aria-label` 也說明未宣告，再要求掃描集合至少含一張 scenario 卡。修正後在基準預覽仍**紅**（`desktop: UC-005 declares no audience`／`'' !== 'scenario'`），本輪預覽**綠**。
- 鄰近回歸：`tests/related-browser.cjs`（desktop／mobile 共 14 組，含 merged-handoff、long-direct、empty-results、recovered-related；併回 #318 後重跑）通過、axe 0；`tests/reader-browser.cjs` 在本機 `networkidle` 等待逾時（基準預覽同樣逾時，見限制）。

## 前後數據（同頁、同尺寸、同資料狀態）

量測腳本：Playwright Chromium，載入 `?case=…` 後等待 `#detail[open]`，讀 `.detail-target-user` 的標題、正文、註記與高度。

| 頁面 | 尺寸 | 基準 `210f980d` | 本輪 |
| --- | --- | --- | --- |
| UC-005（未宣告） | 1440×900 | 標題「適合對象」、無註記、區塊 62px | 標題「情境常見讀者」、註記「案例頁未宣告適合對象…」、區塊 88px |
| UC-005 | 390×844 | 同上、區塊 90px | 88→**136px**（註記換行 2 行） |
| UC-005 | 320×740 | 同上、區塊 90px | **156px**（註記換行 3 行） |
| UC-270（有宣告） | 1440×900 | 標題「適合對象」、無註記 | 標題「適合對象」＋註記「案例頁自行宣告適合對象；本庫未另外驗證。」、區塊 88px |
| 卡片（`?q=會議` 前 8 張，390×844） | — | 575／549／690／575／551／549／577／711px | **完全相同**（標籤 38→40 字未多折行） |
| 搜尋結果數 | — | 26／513 | 26／513（未變） |
| 註記文字 | 1440×900 | — | 12.5px／行高 20px／`#56675f` on `#fbfcf8`，實測對比 **5.82:1** |

## 三種訪客情境（本輪預覽，390×844）

1. **不知道工具名，從問題找案例**：`?q=會議` → 26／513 筆。第一張 UC-094 顯示「👤 適合對象：會議衝堂…（案例頁宣告）」；第二張 UC-277 顯示「👤 情境常見讀者：想藉助 AI 提升日常行政…」，`data-target-user-source` 分別為 `declared`／`scenario`。
2. **組合搜尋與篩選後空結果**：`?q=會議&scenario=生活&difficulty=進階開發` → 0／513，空結果提供「移除實作門檻「進階開發」 → 查看 2 筆」「移除使用情境「生活」 → 查看 7 筆」，條件名稱沿用中文標籤；本輪未改這段邏輯。
3. **開啟分享的詳情直鏈**：`?case=UC-005` 直接開在詳情，標題「情境常見讀者」、註記說明是本庫依「開發」情境整理、不是作者說法；關閉後回到 513 筆清單。`?case=UC-270` 同尺寸顯示宣告句與「案例頁自行宣告」註記；兩者來源連結與固定版本行為未變。

## 已知限制

- 本環境無法讀取截圖影像（`Image reading is disabled`），視覺結論一律來自 DOM 文字、`getBoundingClientRect`、computed style 與 axe，未經肉眼比對。前後截圖只作存檔：`before-*`／`after-*`（UC-005、UC-270 × 1440／390／320）。
- 只驗 Chromium；Firefox／WebKit 未跑（與 210f980d 基準相同的本機限制）。`tests/reader-browser.cjs` 在本機基準與本輪都停在 `?q=PR&case=UC-005` 的 `networkidle` 等待，非本輪回歸，未取得完整結果。
- 未做真人研究，也沒有量測轉換；本輪只改「誰主張什麼」的呈現。
- 209 篇宣告句的內容品質（是否真的精確描述該案例）未逐篇重審，只保證不再把本庫文案冒充成宣告。
- 304 個未宣告條目仍是六句情境人物；真正逐篇寫出對象屬內容工作，不在本輪。

## 下一輪

先做 **`解決痛點`（`- 核心目標`）的缺漏**：287／506 篇沒有這個欄位，卡片就直接不顯示 🎯 行，詳情也沒有「未記錄」字樣，而其中不少頁面其實寫了 `- 目標：`／`- 問題：` 只是沒被讀取（`assets/app.js:1041` 只認 `核心目標`）。驗證第一步是把 `- 目標：`／`- 問題：` 與 `核心目標` 的實際分布列出來，再決定是擴充解析（仍屬宣告）或明示缺漏，並先跑 `tests/target-user-provenance.test.cjs`、`tests/search.test.cjs` 確認不影響搜尋索引與卡片高度。

## 發布

- PR [#320](https://github.com/RichardHan/ai-agent-use-cases/pull/320) head `49cceef59c436b7efee8c271b931def88a905d48`：12 項非略過檢查 success（`Website QA` [42725498629](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42725498629) 含新增的 `target-user-provenance-browser.cjs`、`published` 依設計 skip）。
- squash 合併 `0f9f9c966997dce736204b21ef18e94206b3de92`；`pages build and deployment` [42727014095](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42727014095) success。
- 正式站 `catalog.json.sourceRevision` = `0f9f9c966997dce736204b21ef18e94206b3de92`、510 個來源檔；`assets/app.js`、`assets/style.css`、`assets/reader.css`、`index.html` 與本機 checkout **逐 byte 相同**。
- 正式站重走（1440×900／390×844／320×740）：UC-005「情境常見讀者」＋未宣告註記、UC-270 宣告句＋「案例頁自行宣告」、`?q=會議` 26／513 且前四張卡為宣告／情境混合、axe 0、水平溢出 0、pageerror 0；截圖 `live-*`。
- main 的 `Website QA` [42727014308](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42727014308)：success（第 9 步 Chromium 全套、`Verify built Pages corpus`、`Verify language of built Pages`、`Wait for published assets and content`、`Verify the published GitHub Pages site` 全部通過）。
