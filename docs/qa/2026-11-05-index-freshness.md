# 索引時效交接（2026-11-05）

- 基準：main `45ee335e2c65a69a9c57d657125958e92dcf6073`；正式站 [INDEX.html](https://richardhan.github.io/ai-agent-use-cases/INDEX.html) 同時顯示全頁「更新日期 2026-10-20」及 2026-11-04 的批次。首頁將該頁提供給載入較慢的訪客。
- 決定：移除無法保證持續同步的全頁日期，提示依研究批次與案例日期判讀；不變更案例或合格數。
- 修改前後：`node --test tests/*.test.cjs` 各 394 通過；`node --check assets/app.js` 通過；`scripts/preview.py` 後 `check_corpus_bundle.py` 比對 489 個來源通過。獨立 reviewer 審閱內容未發現問題。
- 近期 [main Actions](https://github.com/RichardHan/ai-agent-use-cases/actions)：PR #211 合併後 Website QA 與 Pages 部署成功；[Results return QA 41696954884](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41696954884) 在 `Match published assets` 失敗，PR #206 記錄 `git ls-remote` ETIMEDOUT；本次原始日誌存取被拒，不能獨立確認完整錯誤。
- 限制：批次日期不代表每個案例都經當日重新驗證。未引入索引自動更新機制。本機無 Jekyll 或 Docker，preview.py 不產生 INDEX.html，且大小寫不敏感檔案系統會讓該路徑讀到首頁；新版索引的實際 Pages 建置與桌面、手機視覺驗收尚待完成。三個完整訪客情境及發布版本核對亦未完成。
- 下一輪：先比對已開啟的 [PR #214](https://github.com/RichardHan/ai-agent-use-cases/pull/214)，驗證首頁來源標籤是否足以區分來源、主張者與獨立驗證，避免重複修改。
