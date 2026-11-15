# 2026-11-15：卡片完整列出提及工具

## 基準與選擇

- 基準 `origin/main`：`db2cc25f9cc4083af89b6ebd46db4443ad964075`。安全 fetch 後建立隔離分支 `improve/2026-11-15-reliable-discovery`，工作樹 `../ai-agent-use-cases-round-20261115`；原 main 與 verification 工作樹保留。開始時沒有未提交修改或開啟中的 PR。
- GitHub 身分 RichardHan；預設分支 main；branch protection API 回覆「Branch not protected」，rulesets 為空。本輪仍以 PR 檢查全數結束且成功作為合併門檻，不使用管理員略過。
- repo 無 AGENTS.md；沿用 README、SITE、最近工具歸屬紀錄、Website QA、Pages 排除規範。repo 未另定 lint/type check；語法檢查不冒稱型別檢查。
- 主 agent 實際為 `openai-codex/gpt-6-astra`。本次 catalog 查到 `openai-codex/gpt-6.1-terra`（low/medium/high/xhigh/max）與 `gemini-3.8-flash`（cursor/factory-droid/litellm/openrouter，low/medium/high）；`gemini3.8` 無直接登錄。task `perCallModel=off`、推理預設 auto，沒有切換或宣稱使用候選模型／最高推理，沒有另接付費 API。語意 find 的 judge 拒絕請求，改用文字搜尋；LSP 回覆沒有設定 server。

## 問題、兩方案與範圍

正式站 `?q=UC-046&scope=topic&tool=Notion#explore` 回傳 UC-046，卡片卻只列 `Grok Bot / Meta Muse`。真正的工具陣列是 Grok Bot、Meta Muse、ChatGPT dots、GitHub、Notion；卡片的 `slice(0, 2)` 把篩選命中的工具藏掉。目標使用者是依工具評估可採用案例的人。

1. 篩選工具移到前兩項：高度較少，但顯示隨條件變動，抽卡保留、切換與歷史返回都要同步；仍隱藏其他工具。
2. **採用完整列出工具**：沿用同一工具陣列及原順序，只移除顯示截斷，不增加狀態、操作、依賴或 CSS。529 條目中 83 條有超過兩項，最長七項；手機以既有排版換行。

不修改工具判定、來源／證據標籤、案例內容、計數、搜尋語意或分享狀態。提及不代表實測，順序不是主要工具排名。

## 實作與回歸

- `assets/app.js`：結果與抽卡共用的 `card()` 完整 `join` 工具陣列。
- `tests/card-evidence.test.cjs`：真實 UC-046／UC-067 渲染必須包含每項工具，且不能改動工具陣列。
- `tests/card-tools-browser.cjs`：1440×900、390×844、320×740，結果與抽卡皆顯示全部工具；文字框不超出卡片，無水平溢出；切換／移除篩選、鍵盤開詳情與返回保留條件及焦點。
- `tests/discovery-browser.cjs`：沿用既有 CI 入口呼叫新回歸，沒有增加 workflow 或削弱斷言。
- `README.md`：說明完整工具列、手機換行及非主要工具排名。

新增測試先因測試 harness 缺少 Discovery 失敗，補上現有模組後才取得有效產品紅燈：`UC-046: ChatGPT dots must be visible without opening details`。修正後通過，未把 harness 錯誤充作產品重現。

|檢查|基準|最終整合版本|
|---|---|---|
|`node --test tests/*.test.cjs`|765 通過|766 通過，0 失敗／略過|
|`node --check assets/app.js`|通過|通過；新 browser 腳本亦通過|
|`python3 scripts/preview.py <獨立目錄>`|完成|完成，非 Jekyll build|
|`python3 scripts/check_corpus_bundle.py <preview>`|未另執行|526 來源逐位元相符|
|`node scripts/check-published-surface.cjs`|833 檔、5.84 MiB|833 檔、5.84 MiB|
|`NODE_PATH=<既有 node_modules> node tests/discovery-browser.cjs`|三尺寸通過|三尺寸通過，含新增工具卡片回歸|

完整輸出：[基準單元](baseline-unit.txt)、[先紅](red-unit.txt)、[最終單元](final-unit.txt)、[基準瀏覽器](baseline-browser.txt)、[最終瀏覽器](final-browser.txt)、[axe](accessibility.json)。實際 Jekyll build 由 PR 的既有 Website QA 執行，不把本機 preview 當正式 build。

## 前後證據與取捨

相同資料 `?q=UC-046&scope=topic&tool=Notion#explore`／UC-067，相同尺寸與瀏覽器，完整 DOM 幾何：[修改前](before.json)、[修改後](after.json)。

|案例／尺寸|前截圖|後截圖|卡片高度前→後（CSS px）|
|---|---|---|---|
|UC-046／1440×900|[前](before-UC-046-1440.png)|[後](after-UC-046-1440.png)|626→627.7|
|UC-046／390×844|[前](before-UC-046-390.png)|[後](after-UC-046-390.png)|623.7→652.7|
|UC-046／320×740|[前](before-UC-046-320.png)|[後](after-UC-046-320.png)|665.8→725.5|
|UC-067／1440×900|[前](before-UC-067-1440.png)|[後](after-UC-067-1440.png)|556.8→587.5|
|UC-067／390×844|[前](before-UC-067-390.png)|[後](after-UC-067-390.png)|576.5→636.2|
|UC-067／320×740|[前](before-UC-067-320.png)|[後](after-UC-067-320.png)|565.5→625.2|

最長工具列在 320px 為 74.75px（四行），沒有裁切或水平溢出。接受最多約 60px 的上述卡片高度增加，換取不需猜測／點開才能知道命中工具。沒有改字級、對比或互動焦點。

[全庫比對](corpus-impact.json)：529 條目的工具陣列逐項完全相同，83 張卡片多顯示原本被藏住的工具，其餘 446 張文字不變；原始來源未動。

## 三種具體情境

基準正式站及最終 preview 在桌面／手機實走，另有自動化三尺寸回歸：

1. 不知道工具名：搜尋問題「去重精選」找到 UC-046，再選 Notion。
2. 保留 Notion，輸入無結果詞；按「修改關鍵字」取得鍵盤焦點，改回「去重精選」恢復案例，Notion 不丟失。
3. 開分享的 UC-046 詳情，重新整理；看「成果主張／核讀／未獨立重現」，開固定 revision 的 GitHub 原始 Markdown 新分頁（實際載入標題確認），關閉詳情保留查詢和工具條件。

[正式站基準](baseline-journeys.json)、[最終 preview](preview-journeys.json)。基準正式站在立即重整／關閉詳情時記到來源 Markdown 的 `net::ERR_ABORTED`，不是 JavaScript pageerror，已原樣保留，不宣稱網路紀錄全無錯誤。最終 preview 的該流程沒有錯誤紀錄。

既有 discovery 回歸亦覆蓋首頁情境、抽卡、組合篩選、空結果重設、詳情直鏈／重整／返回、載入錯誤／重試、空 catalog、部分資料與 clipboard 拒絕。三尺寸首頁 axe（WCAG 2A/2AA/2.1AA）各 0 違規；不是全站人工無障礙認證。沒有量測效能、真人轉換或滿意度。

## 現行 Actions 調查

主整合者核對 API 與原始 log ZIP；兩個獨立 scout 的報告已收回，不把歷史問題當成現行失敗。

- [基準 Pages 43676303406](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43676303406)：`db2cc25f` success；正式 catalog 精確同版。
- [最近 main Website QA 43674870741](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43674870741)：`f5fe653b` success；隨後 db2cc25f 只有被排除發布面的 docs／SITE 修改，按 paths 不觸發 Website QA，不稱它再次通過。
- [近期失敗 43634859717](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43634859717)：`2138f4d49b0c8645d145f0d23549c4ffc75121c5` 的 Chromium 步驟，`tests/refine-from-results-browser.cjs:96:14`，`phone: the entry waits while the search field is on screen`、false !== true。[原始 log 節錄](actions-failure.txt)。既有後續版本已修復，現在基準綠，沒有重跑舊失敗或修改 CI。
- PR concurrency 可取消舊 PR，main 保留執行中發布裁決；不同歷史 workflow 不一律套用同一規則。現況仍是 GitHub 管理的 Pages 與 Website QA 分開觸發，QA 為事後發布驗證；大量 PR workflow 重複單元測試、main 序列等待是可另案改善的成本，不是本輪已觀測的新故障。

## 獨立審查與交付

`FinalCardReview` 未參與實作，唯讀檢查實際變更與證據。初次指出新 browser 檔尚未出現在 git diff；整合者以 selective commit draft 核對五個產品／測試／README 檔案均被選入，包含該新檔。第二次審查結論 **correct、無 findings**，撤回漏交疑慮。主整合者另外核對完整瀏覽器 exit 0 與三尺寸結果，不以 agent 的結論替代驗收。PR／commit／發布結果見下方。

## 限制與下一輪

- 本環境停用影像輸入；已保存實際截圖並驗 DOM、幾何、操作與 axe，但主 agent 與 reviewer 均未目視逐像素審查。
- 工具辨識仍是既有字面規則。VisitorBaseline 提出下一輪候選：UC-227 的分頁 `cursor` 可能被誤認成 Cursor 產品；本輪不把新候選當已修，也不擴大本次顯示修復。
- **下一輪先做一件事**：以正式站 `?q=UC-227&scope=topic&tool=Cursor` 與原文的 cursor 上下文確認是否誤歸屬，再盤點全庫同類命中及正向 Cursor 用例，決定保守排除規則；不要直接把所有小寫 cursor 排除。
- 發布等待上限：PR 檢查／main QA 各最多 25 分鐘，發布版本另以現有 120 秒有界檢查；超時如實保留未確認狀態，不宣稱成功。

## PR 與合併

- 實作 commit：[`c7ea1d299c9665805e807264b55f6f234584a5fa`](https://github.com/RichardHan/ai-agent-use-cases/commit/c7ea1d299c9665805e807264b55f6f234584a5fa)，已推送。
- [PR #405](https://github.com/RichardHan/ai-agent-use-cases/pull/405)：合併前再次以 API 核對 head=`c7ea1d299c`、base=`db2cc25f9c`，18 項皆結束，其中 16 success、2 個 `published` 依 PR 條件 skipped；沒有把排隊／進行中算作通過。
- [PR Website QA 43677901019](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43677901019) success，head 精確對應實作 commit；實際 Jekyll build、建置 corpus、頁面語言與發布面步驟皆 success。
- 獨立審查對應同一 head，記錄於 [PR comment](https://github.com/RichardHan/ai-agent-use-cases/pull/405#issuecomment-6889306018)。這是獨立 agent 審查，不冒稱 GitHub 人類 approval。
- 合併 commit：[`31a3cfb70d19be9905458df7b4b25535c942d900`](https://github.com/RichardHan/ai-agent-use-cases/commit/31a3cfb70d19be9905458df7b4b25535c942d900)，2026-11-15 04:56:26 UTC；只將本輪隔離工作樹快轉至該提交，未移動原 main／verification 工作樹。

## 合併版正式站驗收

- `GITHUB_SHA=31a3cfb70d19be9905458df7b4b25535c942d900 NODE_PATH=<既有 node_modules> node tests/deployed-browser.cjs`：`PUBLISHED_LIVE_BUILD_CURRENT` 精確同版，桌面／手機探索、詳情、重整、搜尋復原及 JS 停用索引／鍵盤／返回通過。[輸出](live-browser.txt)。
- 使用正式站 origin 再執行 `tests/card-tools-browser.cjs`，1440／390／320px 的完整工具、結果／抽卡、換行、篩選切換與鍵盤返回皆通過。[結果](live-card-tools.txt)。
- 主整合者另用瀏覽器實走桌面／手機三情境，GitHub 固定合併 SHA 的原始 Markdown 新分頁實際載入成功。[流程 JSON](live-journeys.json)、[桌面截圖](live-UC-046-1440.png)、[手機](live-UC-046-390.png)、[小手機](live-UC-046-320.png)、[七工具長卡](live-UC-067-320.png)。
- 正式站與基準同樣在立即重整／關閉詳情時留下來源請求 `net::ERR_ABORTED`；流程與 JS pageerror 斷言通過，未把導頁取消請求稱作新產品回歸，也未隱藏紀錄。
- [版本與位元核對](release.json)：正式 catalog `sourceRevision=31a3cfb70d19be9905458df7b4b25535c942d900`，526 來源；`assets/app.js` 與受審程式逐位元一致，400647 bytes，SHA-256 `05c832183fb7a605c3598618fe05120521126077596a25f4de55710512b8c3a1`。

## 發布結論與接續提交

- 合併版 [Pages 43678904733](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43678904733) 與 [Website QA 43678905015](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43678905015) 均 **success**，兩者 head 精確為 `31a3cfb70d19be9905458df7b4b25535c942d900`。[機讀裁決](release-runs.json)。
- 有界等待約 14 分鐘完成，未達 25 分鐘上限；沒有重跑失敗工作或跳過必要檢查。
- **已提交、已推送、已合併、部署成功、正式站已驗證**。本輪沒有未確認的產品發布阻塞；影像目視限制與下一輪 Cursor 語義候選仍如上所列。
- 本段、SITE 與正式站證據沿用既有慣例，以只改 `docs/qa/`、`SITE.md` 的接續提交保存；兩者均由 `_config.yml` 排除於發布面，不更動受審產品。接續提交觸發 Pages 後，再核對其 sourceRevision 及相同 app 位元，結果附於 PR；沒有觸發的 Website QA 不稱為再次通過。
