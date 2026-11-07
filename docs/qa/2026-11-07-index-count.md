# 2026-11-07 靜態索引案例數

基準 `5c91fe4cb697ae9eae298fc88b0e1f201fab1b1c`；原工作樹有未提交修改，於隔離 worktree 處理。正式站 https://richardhan.github.io/ai-agent-use-cases/INDEX.html 原標題為 484，整份索引及 `cases/` 均為 494，但主表只有 489；案例 ID 有缺號，不能以最大 ID 計數。改為 494，將 UC-441–445 從研究紀錄的小表移回主表，保留批次敘述。這是網站主要案例頁數，不是合格案例數，也未重新審查案例或去重。

新增檢查在修改前實際失敗（484 ≠ 494）；修改後 `node --test tests/*.test.cjs` 396 項通過；`node --check assets/app.js` 與 `assets/reader.js` 通過。回歸測試要求主表列數、標題和檔案數一致。`python3 scripts/preview.py` 及 `scripts/check_corpus_bundle.py` 通過，498 個來源逐 byte 一致；HTTP 預覽回讀索引內容。本機預覽並非 Jekyll Pages 建置。瀏覽器流程測試 Chromium 1440／390／320、Firefox 390、WebKit 390 通過，報告與截圖在 `/tmp/verified-round-browser`；非真人研究。獨立審查指出五案分散，已移回主表。

[Actions](https://github.com/RichardHan/ai-agent-use-cases/actions) 主線 `5c91fe4` 的 [Reading flow QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42313655198) 查詢時仍在執行；[Corpus bundle QA 舊失敗](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42015358407) 位於 `ca3bcfd`，公開資訊僅知組合瀏覽器步驟 exit 1，尚無足夠日誌確定原因。未改 CI 或宣稱已修復。

下一輪：核對混合來源案例的各項主張；先以 UC-030 對照可取得的原始來源，分開官方示範、作者自述和本庫未實測流程。發布、PR 與 Actions 狀態以 GitHub 實際記錄為準。
