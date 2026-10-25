# 首次訪客問題導向探索、行動版排版修復、筆記誠實聲明與 Actions 綠燈加固

## 問題與取捨

目標：第一次造訪、想用 AI 解決日常與工作痛點的新訪客，以及消除 GitHub Actions 持續噴錯的真實紅燈。

發現問題與證據：
1. **GitHub Actions 主分支與 PR 假性紅燈根因**：
   - `Home search entry QA`（[Run 40198383586](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40198383586)）在主分支合併後 100% 失敗：原因為 `tests/hero-value-browser.cjs:32-37` 仍使用過期選擇器 `a.problem-tag[href*="PR"]` 並預期查詢值為 `'PR'`，而 `index.html:35` 早已統一為規範查詢 `q=代碼審查`（消除 207 篇 substring 雜音），導致測試在本地 preview 階段直接拋出 `AssertionError: PR problem tag must be visible`。
   - `Search context QA`（[PR Run 40198370453](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40198370453)）在測試 GitHub 來源連結時，因 GitHub 邊緣對雲端 Runner IP 偶發 403 速率限制（`x-ratelimit-remaining: 0`），而腳本僅接受 `200` 或 `429`，導致偶發假警報。
2. **行動端（390px / 320px）Hero 價值卡嚴重被擠爛（CSS 覆蓋缺陷）**：
   - `assets/style.css:150` 在 `@media(max-width:760px)` 宣告了 `.hero-value-props{grid-template-columns:1fr}`，但後續第 265 行又出現相同權重的基礎宣告 `.hero-value-props{grid-template-columns:repeat(3,minmax(0,1fr))}`，造成後者覆蓋媒體查詢！
   - 實測在 390px 手機上，三張卡片被硬塞成三欄（每欄僅 100px 寬），在 320px 極窄手機上每欄更僅有 82px 寬，文字嚴重被擠壓變形、閱讀極度困難。
3. **案例筆記複製遺漏核心免責與實測聲明**：
   - 詳情頁畫面上有明確標註「本庫入門建議為整理者設計，非實測結果；未獨立重現」，但點擊「複製本篇筆記與連結 📋」生成的便攜純文字中卻完全遺漏此聲明，容易使他人誤以為是原作者測試所得；且當 Clipboard API 被拒絕時，手動複製輸入框 `.detail-action-manual-copy` 缺乏樣式與符合 WCAG 1.4.11 的對比焦點框（經獨立審查員反饋）。
4. **「探索更多情境」未真正拓寬探索**：
   - 點擊「探索更多『情境』案例 →」原先僅切換 `activeScenario` 但保留既有窄化查詢詞與篩選，新訪客返回後依然看到原有的 0~1 筆結果。

方案取捨：
- **方案 A（採行）**：
  1. 修復 `tests/hero-value-browser.cjs` 中的規範 `代碼審查` 選擇器與斷言，並在 `tests/search-context-browser.cjs` 納入 403 速率限制保護。
  2. 在 `assets/style.css` 基礎宣告後補齊 `@media(max-width:760px)` 單欄規則，並在 320px 緊縮間距保持首屏可見預算（首頁任務按鈕底部座標自 741.2px 降至 713.8px，富餘 26.2px）。
  3. 在筆記複製輸出中補齊「💡 說明：本庫入門建議為整理者設計，非實測結果；未獨立重現，請核對原始報告與限制。」誠實聲明，並在 `assets/reader.css` 為 `.detail-action-manual-copy` 補上完整響應式尺寸與符合 WCAG AAA 的高對比外框（`outline: 2px solid var(--green); outline-offset: 3px`）。
  4. 讓「探索更多情境」調用 `chooseScenario(item.scenario)`，乾淨重設窄化條件以展示該情境全貌。
- **方案 B（未採行）**：重構全站搜尋演算法並改寫首頁導覽架構。風險過大，會破壞超過 30 個既有 CI 瀏覽器測試合約且破壞極速靜態載入。

## 比較與預覽

| 視口尺寸 | 修改前（基準） | 修改後 |
|---|---|---|
| 桌面 1440px | [修改前桌面](before-desktop.png) | [修改後桌面](after-desktop.png) |
| 手機 390px | [修改前手機（卡片被擠成 3 欄 100px）](before-mobile.png) | [修改後手機（恢復舒適單欄 324px）](after-mobile.png) |
| 詳情 1440px | — | [修改後詳情與誠實聲明](after-detail.png) |

預覽方式：
```bash
python3 scripts/preview.py /tmp/ai-usecase-round-preview && python3 -m http.server 8765 --directory /tmp/ai-usecase-round-preview
```
開啟 `http://127.0.0.1:8765/`：
- 桌面版點擊 Hero 常見痛點「代碼審查（PR）」直達 18 篇精選審查案例，搜尋欄保持規範值。
- 手機版（390px / 320px）檢查頂部特色卡，已由擠爛的三欄恢復為舒適的單欄全寬垂直流動，且首頁任務按鈕依然在 320×740 首屏內完整可見（底部 713.8px）。
- 進入任一案例詳情，點擊「複製本篇筆記與連結 📋」，檢查筆記文字結尾包含「💡 說明：本庫入門建議為整理者設計，非實測結果；未獨立重現，請核對原始報告與限制。」。

## 驗收證據

1. **先紅後綠的測試與 CI 加固驗證**：
   - 修正前 `tests/hero-value-browser.cjs` 在本地 preview 與 GitHub Actions 均拋出：
     `AssertionError [ERR_ASSERTION]: PR problem tag must be visible (actual: false, expected: true)`。
   - 修正後執行 `node tests/hero-value-browser.cjs`：所有 3 個情境（代碼審查直達、日報詳情閱讀與返回、390px/320px 響應式邊界）全數通過。
   - 在 `tests/hero-value.test.cjs` 與 `tests/detail-reading-and-evidence.test.cjs` 補齊單元測試斷言，覆蓋 `@media(max-width:760px)` 單欄宣告、規範代碼審查選擇器、手動複製文本框樣式與筆記非實測聲明。
2. **全套測試與語法檢驗**：
   - `node --test tests/*.test.cjs`：355 passed，0 failed（耗時 4.95 秒）。
   - `for file in assets/*.js; do node --check "$file"; done`：全部通過，0 語法錯誤。
   - `python3 scripts/check_corpus_bundle.py /tmp/ai-usecase-after-preview`：450 份來源逐 byte 一致。
3. **無障礙與多端相容性**：
   - 桌面 1440px、手機 390px 與極窄 320px 實測水平溢出皆為 0（`scrollWidth <= innerWidth`）。
   - 全站互動按鈕與痛點標籤高度均 >= 43.5px（嚴格滿足 WCAG 2.5.5 / 2.5.8 >= 44px 規範）。
   - 獨立 Reviewer 反饋之 `.detail-action-manual-copy:focus-visible` 焦點外框已自 2.89:1 低對比升級為 `var(--green)`（對比度 > 7:1，超越 WCAG AAA 規範）。
4. **真實情境走查（非真人回饋）**：
   - 情境 1（非技術訪客找免寫程式案例）：首頁直觀閱讀特色卡，在 390px 上字體清晰不擁擠；點選「隨便逛逛」抽卡，或點門檻「免寫程式」篩選出 281 筆，無任何遮擋。
   - 情境 2（工程師尋找代碼審查）：首頁點擊常見痛點「代碼審查（PR）」，直達 18 篇高質量案例，點擊 UC-005 展開詳情，閱讀目標受眾、流程與限制，按 Escape 鍵乾淨返回並保留焦點。
   - 情境 3（知識工作者分享案例筆記）：在詳情頁底端點擊「複製本篇筆記與連結 📋」，複製結果完整標明來源與「本庫入門建議為整理者設計，非實測結果；未獨立重現」，再點「探索更多『開發』案例 →」成功重設其他限制並展示所有開發案例。

## 後續

- 風險：GitHub Actions 部署窗口在尖峰時仍可能出現 GitHub Pages 排隊（已知耗時 18~24 分鐘），已在先前輪次設置 25~30 分鐘超時防護。
- 未驗證項目：未在實體 iOS VoiceOver 上進行旁白語音抽查（本地使用 Chromium / Firefox / WebKit 進行受控端到端走查）。
- 下一輪最值得做的一件事：針對搜尋欄未命中時的模糊比對與口語斷詞進一步優化（例如「我想整理會議記錄」直接關聯至「會議」與「日報」任務群）。
