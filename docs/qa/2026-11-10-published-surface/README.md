# 2026-11-10 Pages 產物有 98% 是沒人連得到的驗收截圖

## 基準

- 開發基準 `origin/main` `99734627`；隔離 worktree `/Users/richard_han/orca/wt/aiuc-1110-r11`（分支 `improve/20261110-round11`）。
- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 停在 `90093d7b`（落後 main 296 個 commit），有 159 個未追蹤的他人研究檔與 QA 產物；本輪未觸碰、未 reset。
- 基準 `node --test tests/*.test.cjs`：**617 通過、0 失敗**；`node --check assets/app.js` 通過。
- Actions 現況重新確認（不沿用歷史故障）：main 最近 25 次 `pages build and deployment` 為 22 success／3 failure，**build 從未失敗**（56–63 秒），失敗全在 `deploy`：1 次同步逾時、2 次平台端 `Deployment cancelled.`（7–8 秒，屬被後續部署取代）。57 個 workflow 全部已設定 `concurrency` 且 `cancel-in-progress: true`，同一 ref 的取消皆由它解釋。

## 問題證據

目標使用者是**剛合併完內容、等待它出現在正式站的人**，其次是任何造訪正式站的人。

- `pages build and deployment` [42733561142](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42733561142)（`main@99734627`）：`build` `01:08:18→01:09:14` 成功；`deploy` 的 `Deploy to GitHub Pages` `01:09:20→01:19:27`（607 秒）在 `syncing_files` 用滿上限後 `Timeout reached, aborting!`。
- 因此正式站 `catalog.json.sourceRevision` 仍是 `38a44211`（前一次成功部署 `42728327991`），而 main 已前進兩個 commit：`cases/515-grok-bot-imessage-keyword-shortcut-webhook-routine.md`、`cases/516-muse-spaces-mail-chat-alert.md` 在正式站實測 **404**。
- 同一次逾時也把 main 的 `Website QA` [42733562130](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42733562130) 卡在 `Wait for published assets and content`（`01:17:09` 開始，`tests/published-version.cjs` 重試 500×3 秒後才失敗），不是測試不穩，是部署沒完成。
- 要同步的產物本身：`github-pages` artifact **311,753,058 bytes**。其中 `docs/` 佔 **3,845 個檔案、325,975,738 bytes（310.9 MiB，98%）**，含 **2,309 張 PNG、297,548,926 bytes**。
- 產物單調成長：`42697783315`（11-09 20:56）306,346,994 → `42728327991`（11-10 00:27）311,725,954 → `42733561142`（01:08）311,753,058，四小時 +5.4 MB；每輪 QA 都把當回合的前後截圖提交進 `docs/qa/`。
- 站內沒有任何頁面連進 `docs/`：`index.html`、`assets/**`、`cases/**`、`sources/**`、`evidence/**`、`templates/**` 對 `docs/` 的相對連結為 **0**；`grep` 到的 67 個 `docs/` 字樣全部是外部絕對網址（例如 `learn.chatgpt.com/docs/…`）。只有 `SITE.md` 有 172 個相對連結，而 `SITE.md` 自始就在 `exclude` 內、由 GitHub 提供。
- `_config.yml` 早就排除 `scripts`、`tests`、`qa-artifacts`、`SITE.md`，卻沒有排除 2026-10-18 才開始累積的 `docs`：同類東西只漏了這一項。正式站實測 `scripts/preview.py`、`tests/search.test.cjs`、`SITE.md`、`qa-artifacts/` 都是 404，`docs/qa/2026-11-11-target-user-provenance/README.md` 與同目錄 PNG 是 200，證明排除機制有效、`docs` 是真的被發布。

## 三個方案

- **A（採用）把 `docs` 加進 `_config.yml` 的 `exclude`，並加一道守門。**
  - 發布面 4,659 檔案／316.50 MiB → **814 檔案／5.62 MiB**（不含 `.github` 等 Jekyll 本來就不複製的路徑）。紀錄留在 repo，GitHub 直接提供，`SITE.md` 的相對連結照舊在 GitHub 上解析。
  - 成本：`_config.yml` 一個條目、一支檢查腳本、一支測試、CI 一步。風險：任何站內連進 `docs/` 的連結會變成 404 —— 已量測為 0，且新檢查會擋住未來新增的。
- **B 把 `docs/qa` 搬到已在 exclude 的 `qa-artifacts/`。**
  - 效果相同，但要搬 3,845 個檔案、改寫 172 個相對連結與所有既有紀錄的路徑，歷史 commit／PR 的引用全部失效。成本遠高於收益，不採用。
- **C 不改，部署失敗就重跑。**
  - 可以救單次，但不改變成長曲線：每次重跑仍要同步 311 MB，而這棵樹每天還在長。不採用。

選 A：問題不是「有驗收紀錄」，而是「用訪客的 CDN 運送沒人連得到的驗收截圖」。把發布範圍講清楚，比搬家或反覆重跑都便宜。

**不宣稱因果**：同一時間窗另有兩次 8 秒／7 秒的 `Deployment cancelled.`，屬平台端取代行為；本輪不能證明 311 MB 是逾時的唯一起因。可確定的是每次部署都必須同步 3,845 個不需要的檔案，而這一項已經移除，並在本輪量測變化。

## 改動

- `_config.yml`：`exclude` 加入 `docs`（含一行說明與造成逾時的 run）。
- `scripts/check-published-surface.cjs`（新增）：四類問題會讓它失敗
  1. 新的頂層路徑出現卻沒有決定（不在允許清單、也不在 `exclude`），或同時出現在兩邊；
  2. 已發布頁面連進被排除的樹（`exclude` 可能造成的靜默 404）；
  3. 發布面超過 40 MiB；
  4. 傳入建置產物目錄時，被排除的樹仍存在，或訪客需要的檔案缺失。
- `tests/published-surface.test.cjs`（新增 9 項）：`exclude` 解析（註解／引號／縮排）、路徑分類（`.github`、`_site`、共用前綴 `docsomething` 不得誤判）、相對連結掃描（略過絕對網址、錨點、協議相對）、base path 形式、允許清單／排除清單衝突、預算、建置產物洩漏與缺檔。
- `.github/workflows/website-qa.yml`：`Verify language of built Pages` 之後新增 `Verify published surface`，同時跑 repo 模式與真實 `_site`。這一步就是「`exclude` 是否真的進到 Pages 使用的 Jekyll 建置」的驗證。

## 測試

- 先紅後綠（同一支腳本、同一份 checkout）：
  - 以 `99734627` 的 `_config.yml` 執行 → `FAIL: 「docs」會發布到網站，但不在允許清單內`、`FAIL: 發布面 316.5 MiB 超過 40 MiB 上限`（`發布面 4659 個檔案、316.50 MiB；排除 8 項；2 項問題`）；`the repository publishes only the visitor-facing tree` 失敗。
  - 改動後 → `PASS: 發布面 814 個檔案、5.62 MiB；排除 9 項`。
  - 建置產物模式：把 `docs/` 放回模擬產物 → `FAIL: 建置產物仍含已排除的「docs」：_config.yml 的 exclude 沒有生效`（exit 1）；移除後 PASS。
- `node --test tests/*.test.cjs`：基準 **617 通過／0 失敗** → 本輪 **626 通過／0 失敗**（+9）。`node --check assets/app.js`、`node --check scripts/check-published-surface.cjs` 通過。

## 獨立審查

由未參與實作的另一個 agent context 審查 PR 的完整 diff（`e5f53507`）。結論：**0 項 must-fix**；確認「目前沒有任何站內連結因排除 `docs` 而斷」，並確認 `parseExclude` 對真實 `_config.yml`（獨立註解、縮排）與 10 個必要檔案在正式站皆存在。提出的 4 項 P2 守門缺口，全部在本輪修正（`3c66cd41`）：

1. 連結未依所在頁面解析：`cases/a.md` 裡的 `../docs/qa/run.md` 其實指向被排除的樹，舊掃描看不出來；反之 `cases/a.md` 裡的 `docs/x.md` 是 `cases/docs/x.md`，不該誤判。改為依頁面目錄解析，並用 `_config.yml` 的 `url`／`baseurl` 判別同源絕對網址（其他來源的文件網址仍然略過）。
2. 建置產物只檢查 10 個固定檔：`_site` 掉了 `cases/*.md` 也能通過，但案例頁與來源連結會全部 404。改為要求每個已發布的 `cases/*.md`、`evidence/*.md`、`sources/pending.md` 都有對應傳輸檔。
3. 符號連結：`cases/qa.png -> ../docs/qa/big.png` 會被 Jekyll 以連結路徑複製目標位元組，`_site/docs` 仍不存在、也遠低於 40 MiB 上限。改為拒絕解析後落在已發布範圍之外的符號連結。
4. `website-qa.yml` 的 path filter 少了 `README.md`、`README-archive-2026-10-18.md`、`templates/**` 三個已發布路徑，只改這些檔案的 PR 不會跑新檢查。已補進 `pull_request` 與 `push` 兩處。

複審確認 4 項全部關閉，另指出 1 項 P3：設了 base path 後，根相對路徑 `/docs/x` 其實落在同網域的其他專案，不該當成本站的 `docs/x`。已一併修正（`baseurl` 有值時，沒有該前綴的根相對路徑一律略過），現行語料沒有這種寫法，不影響既有結果。

修正後 `node --test tests/*.test.cjs` **629 通過／0 失敗**（+3）。另以真實檔案驗證新解析：在 `README.md` 加一行 `[驗收紀錄](docs/qa/…)` → `FAIL: README.md 連到已排除的「docs」…（網站上會是 404）`（exit 1）；還原後 PASS。建置產物模式把 `cases/005-cloud-pr-review.md` 移出模擬產物 → `FAIL: 建置產物缺少 1 個來源檔（例：cases/005-cloud-pr-review.md）`。


## 已知限制

- 本機沒有 Jekyll，`_site` 只能在 CI 產生；`scripts/check-page-language.cjs` 需要 Jekyll 產生的 `INDEX.html` 與 `cases/*.html`，本機模擬產物無法重現，因此建置產物模式在 CI 之前只以合成目錄驗證邏輯。
- 沒有證明 artifact 大小與 `syncing_files` 逾時的因果，只量到相關的成長與移除後的變化。
- `docs/` 內的驗收紀錄仍留在 repo（326 MB），本輪只處理「要不要用 Pages 運送」，沒有處理 repo 體積。
- `sources/` 2.4 MB／288 個研究檔仍在發布範圍內：`INDEX.md` 有 154 個、`sources/README.md` 有 13 個相對連結指向它們，屬訪客可達，不動。
- `Website QA` 的正式站驗證仍只在 `main` 上跑，PR 看不到部署落後；屬既有設計，本輪未改。

## 下一輪

先做 **`解決痛點`（`- 核心目標`）的缺漏**，但範圍比上一輪紀錄寫的小：本輪重新量測 508 篇案例頁，**221 篇**有 `- 核心目標：`、**7 篇**用 `- 目標：`／`- 問題：`（UC-004～007、010～012），**280 篇（55.1%）** 完全沒有問題陳述欄位；`- 痛點：` 出現 0 次。那 7 篇的句子其實已被 `assets/app.js:1023` 讀進 `summary`，但因 `what` 優先取全 508 篇都有的 `- 一句話用途：`，卡片與詳情都不會顯示它。驗證第一步：先跑 `tests/detail-reading-and-evidence.test.cjs` 與 `tests/target-user-provenance.test.cjs`，確認把 `目標`／`問題` 併入 `coreGoal`（仍屬宣告）之後，卡片高度與 `?q=` 命中數不變，再決定 280 篇要標示缺漏或維持不顯示。

## 發布

- PR [#323](https://github.com/RichardHan/ai-agent-use-cases/pull/323) head `0e41ffbf`：3 項檢查全 success（`Website QA` [42739621936](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42739621936) 7m44s、`Reader QA` [42739621616](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42739621616) 5m37s、`Search context QA` [42739621747](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42739621747) 1m52s）。`Website QA` 第 13 步 `Verify published surface` 對 `actions/jekyll-build-pages@v1` 的實際 `_site` 輸出 `PASS: 發布面 814 個檔案、5.63 MiB；排除 9 項；建置產物不含已排除的目錄，且來源檔齊全`。
- squash 合併 `fb53428ee0a90f1b5b150aed59d4deeb8a7b4fde`（2026-11-10T02:07:56Z）。
- `pages build and deployment` [42740604355](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42740604355)：`build` 02:08:01→02:08:41（40 秒）success、`deploy` 02:08:46→02:11:00（134 秒）success。**artifact 從 311,753,058 bytes 降到 6,440,675 bytes（48.4 倍）**，同步集合少了 3,845 個檔案。
- main 的 `Website QA` [42740604808](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42740604808)：success，`Verify published surface`、`Wait for published assets and content`、`Verify the published GitHub Pages site` 全部 success——部署與正式站都對同一個版本完成核對。
- 正式站 `catalog.json.sourceRevision` = `fb53428e…`、`corpus.json` 512 個來源；`index.html`、`assets/app.js`、`assets/style.css`、`assets/reader.css` 與 `origin/main` 逐 byte 相同（`catalog.json`／`corpus.json` 由 Liquid 於建置時產生，`builtAt`／`bundleRevision` 每次不同，屬預期）。
- 正式站路徑核對：`/`、`cases/515-…md`、`cases/516-…md`、`index.html`、`assets/app.js`、`assets/style.css`、`README.md`、`INDEX.md`、`templates/case.md`、`sources/pending.md`、`sources/README.md`、`catalog.json`、`corpus.json`、`audit-summary.json` 全部 200；`docs/qa/2026-11-11-target-user-provenance/README.md` 與同目錄 PNG 由 200 變 **404**；`scripts/preview.py` 仍 404。本輪兩個直接效果都量到：先前 404 的新案例已上線，先前公開的驗收截圖已不再發布。
- 正式站三情境重走（1440×900／390×844，`sourceRevision` 皆 `fb53428e`）：`?q=收件匣` 155／515、第一張卡不變；`?q=食譜&scenario=工作&difficulty=進階開發` 0／515，空結果列出「移除實作門檻「進階開發」 → 查看 1 筆」，點擊後回到 1／515；`?case=UC-014` 直開詳情、顯示宣告的適合對象與「案例頁自行宣告」註記、關閉後回到 24 張卡；兩尺寸水平溢出 0、站內相對 `docs/` 連結 0。與部署前同一份量測逐項相同，前端沒有變。

