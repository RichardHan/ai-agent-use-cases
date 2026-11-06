# 2026-11-06 靜態頁語言宣告

基準 main `a3b71759e7652d346ca026ac69fcdd4c95b29996`；[正式站](https://richardhan.github.io/ai-agent-use-cases/)。原工作樹含未提交變更，本輪使用隔離 worktree。

正式站動態首頁的 HTML 語言為 `zh-Hant`，但 [靜態索引](https://richardhan.github.io/ai-agent-use-cases/INDEX.html) 宣告 `en-US`；靜態案例及來源頁亦如此。這可能影響輔助技術選擇發音，未進行真人螢幕閱讀器測試。設定 Jekyll `lang: zh-Hant`，不修改內容；Primer layout 依序讀取 page.lang、site.lang、預設 en-US。獨立審查指出 SEO 外掛會將 `zh-Hant` 轉成非地區格式的 `zh_Hant`；另設 `locale: zh_TW`，並於 Website QA 真正 Pages 建置後檢查首頁、索引、案例與來源頁的語言及靜態頁的 Open Graph locale。

基準 `node --test tests/*.test.cjs`：394 通過；`node --check assets/app.js`、`node --check assets/reader.js`、`python3 scripts/preview.py` 及 `python3 scripts/check_corpus_bundle.py` 通過（498 個來源）。本機沒有 Jekyll 或容器，不能以 preview 替代實際 Pages 建置；以 PR Website QA 與合併後正式部署驗證為準。本輪沒有視覺改動。

目前 main [Search context QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42190205894) 與 [Pages 部署](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42190205681) 成功。先前 [Corpus bundle QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42015358407) WebKit 錯誤與 [Audit summary QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42143315388) 安裝階段逾時不應視為本次最新主線失敗。近期開放 PR 眾多，請先核對 GitHub 即時狀態，避免與現有工作重疊。

下一輪：先檢查下次 Corpus bundle QA 失敗的診斷 artifact，釐清 WebKit `Context is stopped` 的前後事件；不可僅憑歷史失敗推論現況。螢幕閱讀器實際發音及多語原文片段的語言標記尚未測試。
