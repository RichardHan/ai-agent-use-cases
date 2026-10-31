# 案例情境探索後返回

正式站基準 `95ec012`：從直鏈 UC-001 選「探索更多生活案例」後按瀏覽器返回，離開該案例而不是恢復閱讀。對象是從搜尋或分享連結進入案例後探索同情境的讀者。比較兩案：只提示會離開案例（成本低但無法回復），或保留案例歷史並新增結果歷史（採用；可返回／前進，需維持原搜尋及閱讀狀態）。不修改資料、來源、搜尋或其他導覽。

| 尺寸 | 修改前正式站 | 修改後預覽 |
| --- | --- | --- |
| 桌面 1440px | [前](before-desktop.png) | [後](after-desktop.png) |
| 手機 390px | [前](before-mobile.png) | [後](after-mobile.png) |

畫面未改版，改動是返回行為；截圖不是使用者偏好證據。影像目視功能不可用，未宣稱人工視覺審核。

- 回歸先紅：`node tests/related-browser.cjs` 對舊預覽在返回後等不到詳情；修正後同一測試在 Chromium 1440／390／320 通過。包含搜尋「旅遊」加 Grok Bot、鍵盤啟用情境、返回恢復案例和條件、前進回情境、UC-001 直鏈往返、長文、空結果與來源區域。各測試情境 axe 無違規及無橫向溢出。
- 實際預覽 390px 直鏈 UC-001 → 情境 → 瀏覽器返回，恢復 UC-001；1440px 詳情 axe-core 4.13：0 違規、1 項需人工判斷。
- `node --test tests/*.test.cjs`：368 通過、0 失敗；`node --check assets/app.js` 和 `node --check assets/reader.js` 通過。`python3 scripts/preview.py /tmp/visitor-review-preview/ai-agent-use-cases` 建置完成，`python3 scripts/check_corpus_bundle.py /tmp/visitor-review-preview/ai-agent-use-cases`：461 來源逐 byte 相同。
- 独立 reviewer 靜態審查未發現功能或安全問題。未測實體裝置、螢幕閱讀器及此改動在 Firefox／WebKit 的行為；axe 非完整無障礙保證。
- 實站搜尋「旅遊」＋Grok Bot 有 24 張結果，UC-001 直鏈重載、返回與空結果可見；來源 GitHub 固定版本原文可讀。這些是模擬走查，不代表真人轉換或滿意度。
- GitHub Actions：基準主線最近列出的 Pages 與主要 QA 成功；舊 Partial Load QA #40689714690 失敗於正式網站走查，現有日誌不足以確定根因；另有獨立分支處理 Search relevance QA 發布等待，本輪未覆蓋。

預覽：在預覽目錄父層執行 `python3 -m http.server 8088 --directory /tmp/visitor-review-preview`，開啟 `http://127.0.0.1:8088/ai-agent-use-cases/`。此預覽不等於 GitHub Pages 的 Jekyll 部署。
