# 回訪時重用已驗證全文整包

目標：重新整理或再次造訪、希望立即搜尋與閱讀來源的讀者。正式站手機首次開啟時實際出現「正在讀取案例…」，等待後才顯示 463／463；現有載入慢時的 Markdown 索引入口已由另一輪加入，本輪不重做。基準本機 364 項單元通過，461 個來源逐 byte 相同。本站尚未提供可量化的真人回訪資料。

兩案：A（採用）以目錄的 bundleRevision 與 sourceRevision 為鍵，僅將兩者相符且完整解析的整包放入同源 Cache Storage；下次以同一版本重用，版本變更、快取損壞或儲存失敗走原網路／逐篇復原。成本是瀏覽器儲存一份公開資料，冷啟動不加速。B 將整包拆成漸進分片，冷啟動較快可用，但需修改建置、完整性閘門與部分結果語意，本輪不採用。

驗收：同版本重新整理不請求 `corpus.json`；版本變更會重抓；損壞快取不顯示錯誤內容；搜尋、組合篩選、空結果、直鏈、返回及來源固定版本保持一致。未改 UI、原始 Markdown、排序、證據或案例計數；不加入追蹤、cookies 或外部服務。

| 尺寸 | 修改前正式站 | 修改後本機預覽 |
| --- | --- | --- |
| 390px | [畫面](2026-10-28-return-cache-before-mobile.png) | [畫面](2026-10-28-return-cache-after-mobile.png) |
| 1440px | [畫面](2026-10-28-return-cache-before-desktop.png) | [畫面](2026-10-28-return-cache-after-desktop.png) |

畫面預期相同；改善的是回訪資料路徑，不是視覺改版。預覽：`python3 scripts/preview.py /tmp/visitor-cache-preview/ai-agent-use-cases`，`python3 -m http.server 8148 --directory /tmp/visitor-cache-preview`，開啟 `http://127.0.0.1:8148/ai-agent-use-cases/`。

回歸先紅：同版兩次載入仍請求兩次整包；快取損壞時改走逐篇；停滯的儲存讀取曾阻塞整個載入。獨立審查指出的期限、寫入阻塞、舊版累積與並行清理風險已修正：有界讀取、非阻塞儲存、保留最近兩版並於配額不足時回收。加入回歸後 `node --test tests/*.test.cjs`：368／368 通過；`node --check assets/app.js` 成功；`python3 scripts/check_corpus_bundle.py /tmp/visitor-cache-preview/ai-agent-use-cases`：461 來源逐 byte 相同。本機 Chromium 實走首次 200、Cache Storage 一筆，重新整理後 463／463 且 `corpus.json` 網路請求 0；390px「旅遊」＋「生活」20 筆、零結果 0 筆、UC-001 直鏈重載與 Escape 返回 20 筆、原始 Markdown 固定於本次 SHA。鍵盤由搜尋框 Tab 至查看結果有可見 solid 焦點，390／1440px 零水平溢出。三種模擬情境：回訪後查旅遊生活；無效詞後重新搜尋；直鏈閱讀原始來源並返回。這不是使用者偏好研究或轉換率證據。

`bundle exec jekyll build --destination /tmp/visitor-cache-jekyll` 因本機無 Gemfile 未執行；Python Pages 相容預覽與來源完整性檢查已完成。正式 Pages 版本、跨引擎及真實網路效能尚待發布後核對；GitHub Actions 的舊版資產競速與其他短輪詢不屬此輪修正。下一輪優先收斂仍使用短發布輪詢的 Reader source links／Print reading QA。

## 合併後補驗

[PR #158](https://github.com/RichardHan/ai-agent-use-cases/pull/158) 已合併為 `75c3087`；[Pages #40660240914](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40660240914) 成功。`scripts/published-assets.cjs` 對 `index.html`、`assets/app.js`、`assets/style.css`、`assets/reader.js`、`assets/reader.css` 逐 byte 比對回報 `matched`（約 217 秒）。正式站 Chromium 390px：首次整包請求 1、同版重載請求 0，兩次皆 463／463 且無水平溢出；旅遊＋生活 20 筆、零結果 0 筆，UC-001 原始 Markdown 指向合併 SHA。正式站跨引擎與真實網路效能仍未量測。

合併後 [Facet counts QA #40660241603](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40660241603) 的前五組跨引擎篩選通過，但 Source guide 故障注入在重載時因前一次成功整包快取而沒有出現預期的 `#partial-load`。共用 `tests/source-route.cjs` 現在於注入來源失敗前清除同源公開整包快取，使故障測試仍真正驗證逐篇回退；不修改正式產品的快取行為或降低斷言。Website QA #40660241663 與 Reader source links QA #40660241560 也失敗，所取得的失敗 log 沒有可歸因的錯誤訊息，不推斷同因；後續 Actions 另觀察。
