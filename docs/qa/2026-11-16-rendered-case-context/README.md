# 2026-11-16：直接抵達的案例頁要有索引退路與證據解碼

## 基準與選題

- 遠端 `main` 已由另一個執行單元把 PR #413 合併為 `1a387a34`（`786c879b`＋`01295659`），之後 `83146192` 只補發布紀錄；本輪以 `83146192` 為基準，Pages 部署 [43747165501](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43747165501) 成功；main 的 Website QA [43747166154](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43747166154) 於 18:44Z 成功。原工作樹未 reset、未覆寫，另從 `origin/main` 建 `/tmp/ai-cases-rendered-context-20261116`、分支 `improve/2026-11-16-rendered-case-context`。
- 無 repo／父層 `AGENTS.md`；沿用 README、SITE.md、`docs/qa/2026-11-16-fallback-reading/`、Website QA 與 Pages 流程。`gh run list --limit 100` 當下 0 個非成功；沒有開啟中的 PR。
- 本輪執行模型為環境回報的 `litellm/deepseek-flash-gmi`；工具沒有提供切換 gpt-6.1-terra／gemini 的介面，未宣稱使用指定模型或最高推理。三個子代理與主 agent 使用同一 runtime；獨立 reviewer 是另一個任務上下文。
- 目標使用者：從搜尋引擎直接抵達 `cases/*.html`，或依站方指示在腳本慢／失敗時走「首頁 → INDEX.html → 案例頁」的讀者。他們看不到 SPA 詳情頁的證據說明，也不知道怎麼回到索引。

## 可重現問題與方案

以正式站 `1a387a34` 下載全部 522 個案例頁後：

- **522／522 頁沒有「完整案例索引」連結**；頁首只有 theme 的站名連結回首頁，沒有直接回索引的路。
- **198／522 頁的頁首**有至少一個機器代碼（`author-demo` 180、`designed` 113、`official` 26、`author-self-report` 10、`unverified` 8、`pending-verification` 1；同頁可多個）；其餘 324 頁頁首是中文描述。若把正文也算進來，**225 頁**出現至少一個代碼。代碼本身正確，但直接抵達的讀者只看到中文標籤或原始代碼；INDEX 只列四個代碼，`author-self-report` 10 頁與 `pending-verification` 1 頁完全沒有對照。
- 同一頁的 SPA 詳情會顯示完整證據與安全採用邊界，兩條閱讀路徑不一致。

兩案：

1. **最小 layout 覆寫＋每頁緊湊導覽／圖例**（選定）：複製 primer 0.6.0 `default.html`，只在 `cases/*` 插入「完整案例索引／搜尋首頁／互動閱讀器」與本頁實際出現的代碼對照；用真的 Jekyll build 驗證。成本小、風險集中在一个 layout，可回滾。
2. **只把圖例留在 INDEX**（現況）：零風險，但對直接抵達者沒有幫助；複製整份 primer 版型以外的替代方案（JS 注入）在免腳本路徑失效，不採用。

驗收：Jekyll `_site` 的每個案例頁都有索引／首頁連結、claimant≠verifier 說明、以及頁內每個代碼的中文對照；INDEX／evidence 不得長出案例導覽；桌面、390、320 無橫向捲動；鍵盤第一個 Tab 到索引連結；代碼對照與 `PROOF_DEFINITIONS` 同一組標籤。

## 實作

- `_layouts/default.html`：primer 0.6.0 layout 的等價複本（SEO、theme CSS、`head-custom`、站名 h1、`content`、anchor.js 均保留），在 container 內、站名之前插入 `case-fallback-nav.html`。
- `_includes/case-fallback-nav.html`：只在 `page.path` 含 `cases/` 時輸出。連結使用 `relative_url`；以檔名前三位產生 `?case=UC-…` 互動閱讀器連結；列出 `page.content` 實際含有的六個代碼（四個主碼＋`author-self-report`、`pending-verification` 兩個同義碼；以反引號或 `<code>` span 判斷，避免 `fan-watch-official-news` 這類 slug 被讀成 `official`），並連到 `INDEX.html#how-to-read` 的完整定義。
- `_includes/head-custom.html`、`assets/fallback.css`：載入 scoped 樣式；沿用 primer 的淺色底與 GitHub 藍，320px 自動換行，列印隱藏。
- `INDEX.md`：圖例補上 `author-self-report`（作者報告／示範）與 `pending-verification`（尚待查證），與 SPA 的同義碼處理一致。
- `cases/002-video-production.md`、`cases/061-dispatcher-bot-typed-commands-ledger.md`：把未被 SPA 辨識的 `` `author-report` `` 正規化為既有同義碼 `` `author-self-report` ``；只改機器標記，不動來源敘述，並加測試拒絕未登錄的 `author-*` 代碼。
- `.github/workflows/website-qa.yml`：PR 與 main 的 `paths:` 加入 `_layouts/**`、`_includes/**`；否則只改版型的變更不會觸發 Website QA。
- `scripts/check-fallback-reading.cjs`：Jekyll `_site` 的每個案例頁必須有 `data-fallback-case-nav`、INDEX 與首頁連結、claimant≠verifier 句、以及頁內每個 `<code>` 代碼的可見配對（六碼）。檢查器逐個 `<span class="case-fallback-code">` 要求 `<code>` 與精確 `<strong>` 標籤同組，並排除 `hidden`、inline `display:none`、`aria-hidden`、`sr-only`／`visually-hidden`；只在 `<code>` span 判斷代碼，避免 `fan-watch-official-news` 這類 slug 假陽性。
- 回歸測試：`tests/fallback-reading.test.cjs` 新增缺導覽、缺索引／首頁、代碼未解碼、nav 隔離等 fixture；`tests/source-link-markup.test.cjs` 檢查圖例標籤與 `PROOF_DEFINITIONS` 同步、layout 保留 primer 契約、只在 cases 出現。

## 驗證

- 基準：`node --test tests/*.test.cjs` **823 pass／0 fail**；最終 **832 pass／0 fail／0 skip**。
- 新檢查對**改動前**正式站 522 頁：`FAIL: 524 problem(s)`（522 頁缺案例導覽＋INDEX 缺兩個同義碼圖例）。對本機真正 Jekyll build（Jekyll 4.3.4＋primer 0.6.0＋optional-front-matter）的 525 個 rendered 頁：`PASS: 525 rendered case pages expose a clickable source; INDEX explains the evidence codes`。
- 本機 build 與正式站同一版型的 head 對照：SEO、canonical、theme CSS、container、anchor.js 均在；只多了 `fallback.css`（少了 theme 內原本空的 GA 註解）。
- 瀏覽器（Chromium，1280×900／390×844／320×568）：
  - 案例頁導覽高度 106／123／190px；`documentElement.scrollWidth` 均未超過 viewport。
  - 390px 案例 004 無代碼時顯示「頁首未標示」而非空 legend；INDEX 無案例導覽但仍有圖例；evidence 頁無案例導覽。六碼都出現的 UC-046 在 1280／390／320 的導覽高度為 127／184／293px，仍無橫向捲動。
  - 第一個 Tab 停在「← 完整案例索引」，focus outline 為 `auto`；量測對比：正文 14.84:1、連結 4.88:1、代碼標籤 14.84:1（皆高於 WCAG AA 4.5:1）。
  - 截圖：`before/` 為正式站 `1a387a34` 原始案例頁，`after/` 為本機 build 同頁／尺寸；視覺工具回報圖片讀取停用，主 agent 未能逐像素目視，另以 DOM／幾何／對比數據保存證據。
- `node scripts/check-published-surface.cjs`、`node scripts/check-published-surface.cjs /tmp/site-local2`：833 檔、5.87 MiB 通過。`node --check` 對修改的 JS 通過；repo 沒有獨立 lint／type-check 指令，不宣稱兩者通過。
- Actions 另查：main 近 7 天 7 個 failure、3 個 cancelled，全部已修或屬外部／取代；`1a387a34` 的 Website QA 已綠。仍存在的發布閘門缺口是 `sources/*.md`（pending.md 以外）不進位元比較，留待下一輪。

## 已知限制與未處理

- 本機以 Jekyll 4.3.4 驗證，GitHub Pages 是 Jekyll 3.10＋`jekyll-build-pages`；Liquid 用法皆為 3.x 支援，真正 `_site` 由 PR 的 Website QA 驗證。合併後仍要在正式站核對版本與頁面。
- 案例頁只給緊湊標籤與「完整定義」連結，沒有把六類完整說明全部塞進每頁；完整說明仍在 INDEX 與 SPA。
- 覆寫 `head-custom.html` 後不再輸出 theme 內原本空的 GA 註解與 favicon 註解；沒有追蹤碼或外部請求增減。
- 只處理 `cases/`；evidence／sources／INDEX 的免腳本閱讀路徑沒有新增導覽。
- 圖片閱讀工具停用，截圖只能作人工比對素材，不能宣稱已逐像素檢視。
- 發布閘門 `sources/*.md` 缺口未在本輪修改。

## 分工回收

- `ActionsAudit`（scout）：確認 main 近 7 天非成功 run 的類別與現況、`1a387a34` Website QA 綠、PR 分支 failure 屬內容斷言；指出 `sources/*.md` 發布閘門缺口（`publicationChangeList` 過濾），建議下一輪以故障注入修。主 agent 另行核對 `gh run list --limit 100` 與 run 43747166154 的 step 結果。
- `RenderedPageUX`（scout）：調查 rendered 頁的導覽、代碼、layout 來源與可回歸檢查；主 agent 以本機 Jekyll build 與 522 頁下載重新計算 522 缺導覽、225 頁含代碼。
- `IndependentReview`：初審無 P0/P1，指出兩個 P2：(1) `cases/002`、`061` 的 `author-report` 未解碼；(2) 檢查器只驗字串存在、未驗可見配對，`display:none` 仍會過。兩項已修：正規化為 `author-self-report` 並加 `author-*` 詞彙測試；檢查器改驗同一個可見 span 的 code／label 配對，新增 hidden／mispaired／sr-only fixture。複審再指出巢狀 `<strong style="display:none">` 仍可通過；已把 `hiddenTag()` 套到外層 span、`<code>` 與 `<strong>`，補相同 probe，複審確認 **no remaining findings**，重跑 832 單元、live FAIL 524、built PASS 525。

## 發布接續

- 待補：commit／PR／PR checks／merge／Pages／正式站 revision 與 after 截圖。
- 下一輪最值得做：補 `sources/*.md` 的發布位元比較與故障注入，先以「只改一個 sources 檔、gate 目前仍回報 verified」重現，再修 `publicationChangeList`。
