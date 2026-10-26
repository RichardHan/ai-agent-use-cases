# GitHub 來源版本提示

正式站桌面與手機搜尋「旅遊」開啟 UC-110 時，來源捷徑指向 `blob/main`；該分支會更新，不能把外部原文誤認為與目前本站收錄文字固定一致。目標是從問題搜尋進入詳情、核對來源的初次訪客。

- 方案 A：建置時注入發布 commit SHA，所有原始 Markdown 連結指向不可變版本。溯源最精確，但須修改 Pages 建置資料契約、回退與全庫連結。
- 方案 B（採用）：詳情「可以幫你做什麼」之後顯示精簡版本提醒。沿用既有品牌與來源路徑，沒有新增網路請求；代價是仍無法直接開啟收錄當時的原文快照。

驗收：提醒在手機及桌面詳情可見，長文用途先於提醒；來源 href 保持 GitHub Markdown，返回保留查詢／情境，直接連結刷新可讀，320px 無水平溢出。不處理資料重新核驗、修改來源或固定 SHA。

| 視口 | 修改前正式站 | 修改後預覽 |
|---|---|---|
| 390×844 | [手機](before-mobile.png) | [手機](after-mobile.png) |
| 1440×900 | [桌面](before-desktop.png) | [桌面](after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-after/ai-agent-use-cases && python3 -m http.server 8765 --directory /tmp/visitor-after`，開啟 `http://127.0.0.1:8765/ai-agent-use-cases/?q=旅遊&case=UC-110#explore`。前後皆為 UC-110 詳情；前圖是當時正式站，後圖是同一內容的本地 Pages 相容預覽。

驗證：新增測試先以缺少來源版本說明失敗；修改後 `node --test tests/*.test.cjs` 353 passed／0 failed；`for f in assets/*.js tests/*.cjs; do node --check "$f"; done` 通過；`python3 scripts/check_corpus_bundle.py /tmp/visitor-after/ai-agent-use-cases` 450 來源逐 byte 相同。Chromium 預覽 390px：用途 y=463.7–575.9，提示 y=575.9–632，無橫向溢出；320×666 UC-359 長用途從 y=586.1 開始，與修改前一致，提示在用途後。桌面直鏈可開；旅遊＋生活 21 張卡，詳情原文連結及 Escape 返回 `q=旅遊&scenario=生活` 均確認。空結果 `不存在xyz987` 顯示 0 筆與復原選項。

三種模擬情境：① 搜尋旅遊進入 UC-110 比對來源；② 旅遊＋生活組合篩選開詳情再返回；③ 無命中查詢閱讀空結果。這不是使用者偏好或轉換率證據。獨立 review 指出原常駐段落可能把 320px 長用途推出首屏；移到用途後並縮短至兩行，重驗幾何。未執行本機 Jekyll、axe 或真實裝置測試；Actions 既有多項瀏覽器 QA 失敗，不能把單元成功當全站 CI 全綠。下一輪優先在建置資料提供可驗證的發布 commit，將來源快照與本站版本對齊。