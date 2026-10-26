# 原文連結可先辨識再核對（2026-10-26）

目標讀者：從問題搜尋進入案例、需要核對原文來源與限制的首次訪客。正式站 UC-024 的「逐段核對連結與限制」只有「含網頁連結」，不展開整篇研究便看不到是 OpenAI 產品說明、Bot Store 整理頁還是 Reddit 作者原串；不能把每個連結當作成果憑據。

- 方案 A：讓篩選與排序逐步可用 Back 返回；利於比較結果，但與尚未合併的搜尋歷史 PR #145 共用狀態邏輯，整合風險較高。
- 方案 B（採用）：在既有折疊的逐段索引中列出原文連結文字與網域，直接連到相同網址，並明示性質未判定、須讀上下文。成本是長案例的折疊索引更長、鍵盤多了連結；不自動分類可信度，不修改原始案例或來源。

驗收：UC-024 的四個外部連結按原段落顯示文字、網域和原網址；無連結的限制段落仍可跳轉、無資料時不顯示索引；320／390／1440px 不橫向溢出；搜尋＋生活篩選、空結果復原、詳情直鏈重載、來源開新頁及返回不退化。原文內容、搜尋排序、證據標籤與案例計數不在本輪範圍。

| 尺寸 | 修改前正式站 | 修改後本地 Pages 預覽 |
| --- | --- | --- |
| 390px | [before-mobile.webp](before-mobile.webp) | [after-mobile.webp](after-mobile.webp) |
| 1440px | [before-desktop.webp](before-desktop.webp) | [after-desktop.webp](after-desktop.webp) |

預覽：`python3 scripts/preview.py /tmp/visitor-facet-preview/ai-agent-use-cases && python3 -m http.server 18997 --directory /tmp/visitor-facet-preview`，開啟 `http://127.0.0.1:18997/ai-agent-use-cases/?case=UC-024`。預覽的發布版 SHA 與正式 Pages 不同，不把它當成正式站來源版本。

回歸先紅：新增瀏覽器斷言後，舊預覽 `.reader-review-link` 逾時。修正後 `NODE_PATH=/tmp/visitor-method-deps/node_modules REVIEW_URL=http://127.0.0.1:18997/ai-agent-use-cases/ REVIEW_OUTPUT=/tmp/source-links-after node tests/review-sections-browser.cjs` 通過 Chromium 桌面／390／320、Firefox 390、WebKit 390；既有流程包括搜尋＋篩選、空結果、鍵盤 Enter、直鏈重載、來源 popup、返回與長標題；每組兩次 axe WCAG 2/2.1 AA 稽核皆零違規。`node --test tests/*.test.cjs` 基準 362 pass；`node --check assets/reader.js` 通過；`python3 scripts/check_corpus_bundle.py /tmp/visitor-facet-preview/ai-agent-use-cases` 核對 452 來源逐 byte 相同。獨立 review 未發現具體退化。這些是模擬走查，不代表真人偏好或轉換提升。

Actions 基準：目前 main Pages run 40302316659 成功；較早的 10 項公開站 QA 於 Pages 發布前逾時，Corpus bundle QA 另有本地瀏覽器失敗，不能稱作全綠。本輪沒有改部署輪詢；合併後核對新 SHA 的 Pages 與相關 Reader/Source guide QA。下一輪優先處理長篇索引的快速定位與過多外鏈密度，而非自動臆測來源可信度。
