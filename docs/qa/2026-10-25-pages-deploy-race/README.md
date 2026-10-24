# 2026-10-25：讓 Pages 部署延遲不再誤報為 QA 失敗

## 決策

1. **延長各工作流程的等待時間**：改動小、保留每個工作流程的部署內容核對與真實網站瀏覽驗收；代價是部署真正停滯時，失敗回報會晚一些。
2. **重新設計成部署完成事件觸發的集中式公開網站驗收**：狀態關聯更精確，但需改動多個工作流程的觸發與責任範圍，較容易造成覆蓋缺口。

採用方案 1，只調整本次 Actions 失敗中已確認的四個工作流程；不略過資產一致性檢查、不把錯誤轉成成功，也不改網站 UI。

## 問題證據與驗收目標

2026-10-24 最新 `main` SHA `3b33b559bf995efd7dd7eed477c93db2ba0f79dc` 的 Actions 中，Category finding QA、Available facet options QA、Reading anchor QA、Card refinement QA 皆以失敗結束。失敗步驟在 Pages 尚未發布該 SHA 時，逾時回報 `Published assets mismatch`（Reading anchor run `40115271711` 的紀錄直接顯示此錯誤）。GitHub Pages API 顯示該 SHA 的部署直到 `2026-10-24T17:25:44Z` 才建立；前述失敗工作流程分別在 17:25:04Z、17:24:20Z、17:25:23Z 等時間結束。證據顯示是部署晚於有限輪詢窗口，不是應移除的資產斷言。

目標使用者：維護網站的開發者與查看 Actions 的協作者。驗收目標：在維持精確資產核對和瀏覽器旅程的前提下，為已觀察到的 Pages 部署延遲增加等待窗口。

## 變更

- `.github/workflows/category-find-qa.yml`、`reading-anchor-qa.yml`、`card-refinement-qa.yml`：保留每 2 秒核對，將上限從 90 次（約 3 分鐘）增加到 180 次（約 6 分鐘）。
- `.github/workflows/available-facets-qa.yml`：保留每 5 秒核對，將上限從 60 次（約 5 分鐘）增加到 84 次（約 7 分鐘）。
- 資產只在內容與 checkout 完全相同時通過；到達期限仍會失敗。過期 SHA 的既有 freshness guard 未更動。

## 基準與檢查

- 基準 `node --test tests/*.test.cjs`：271 通過、0 失敗。
- 基準 Actions run 確認四個工作流程失敗；Pages 部署比失敗步驟晚約 21–112 秒建立。

## 風險與後續

等待窗口仍是固定上限；若 Pages 排隊超過 6–7 分鐘，精確核對仍會失敗。失敗工作流程大多已耗用數分鐘於安裝與瀏覽器驗收，增加等待也會提高超時風險，需以後續 Actions 執行確認。本機無法模擬 GitHub Pages 的部署排程；尚未取得修改後雲端 Actions 結果。若延遲超出窗口反覆發生，下一步應改為以成功的 `github-pages` 部署狀態作為公開網站驗收的開始條件，而非無限增加輪詢時間。
