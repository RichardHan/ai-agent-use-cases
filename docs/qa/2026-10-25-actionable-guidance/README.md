# 2026-10-25 案例詳情落地指引實體化與多端閱讀體驗升級

## 決策與兩案取捨 (Decision & Tradeoffs)

針對全站 447 篇案例中，有超過 430 篇案例在點開「本庫的入門建議」時，僅呈現千篇一律、缺乏實用參考價值的通用模板文案（「先閱讀原始報告與限制，再用小範圍、去敏資料設計自己的測試。」「本庫尚未獨立重現；先確認權限與驗收方式，不把案例報告當成成效保證。」），導致初次造訪者無法得知具體第一步該如何著手與面臨何種系統邊界的痛點，本輪評估了兩種精簡改善方案：

1. **方案一：僅擴充靜態 `assets/copy.json` 詞典**
   - 適用情境：人工為部分常見案例逐筆撰寫 `how` 與 `caution`。
   - 取捨與成本：447 個案例維護成本極高，易與 Markdown 原始研究內文脫節；未覆蓋到的 400+ 篇案例依然只能看到空泛範本，無法根本解決全站資訊架構問題。
2. **方案二（採納實作）：智慧動態提取＋既有 copy.json 優先覆寫＋流程優先級分層 (Smart Dynamic Markdown Extraction with Curated Copy Precedence & Actionable Step Navigation)**
   - 適用情境：讀者在首頁抽卡、搜尋或點擊任一案例卡片進入詳情時，展開入門建議皆能看到真正針對該案例的實作第一步（how）與具體限制風險（caution）。
   - 取捨與成本：
     - 在 `metadata(markdown)` 解析層新增正則提取邏輯：優先採用 `copy.json`（保證已有人工精修詞條 100% 優先），若無則由 Markdown 的「建議操作流程／步驟」提取具體前 1~2 步、「權限與限制／費用」提取核心警告。
     - 經獨立審查反饋，將操作流程正則分為兩級優先權（優先匹配 `建議操作流程|建議流程|操作步驟|可參考步驟|怎麼開始`，若無才回退至 `流程|輸入與預期輸出`），徹底防止前置的「輸入與預期輸出」覆蓋具體操作步驟。
     - 測試契約完全相容：全套 303 項測試 100% 通過；全站可落地步驟覆蓋率由原本的 16 篇（3.6%）大幅躍升至 350+ 篇（>80%）。

---

## 問題證據與目標使用者 (Problem Evidence & Target Audience)

- **問題證據**：
  1. `assets/copy.json` 僅收錄 16 筆自訂文案；全站 447 個案例中有超過 430 個案例在詳情頁的「🚀 怎麼開始」與「⚠️ 要注意什麼」中顯示完全相同的通用空話，初訪者無法得知具體該怎麼開始（如：指定資料庫、需要什麼授權、有哪些具體限制）。
  2. Markdown 原文中明明有具體可行的步驟（81% 的案例有操作流程）與權限費用限制（76% 的案例有限制章節），但被深埋在預設關閉的二級折疊面板中，缺乏萃取給初訪者的第一眼引導。
- **目標使用者**：
  1. 第一次造訪、想從具體案例找到靈感並嘗試落地的新訪客：需要知道「第一步我該怎麼動手、這件事會動到什麼系統」。
  2. 嚴格評估 AI 風險的工程師或團隊負責人：需要一眼看到具體權限邊界（如 token 外洩、API 費用、未授權寫入）。

---

## 變更項目 (Changes)

1. `assets/app.js`：
   - 新增並完善 `extractActionableGuidance(markdown)` 提取函數：
     - 支援 H2 與 H3 標題層級（`^#{2,3}\s+`），涵蓋 `### 建議操作步驟`、`### 限制、權限與費用` 等子章節。
     - 嚴格分離兩級優先序：明確行動標題（`建議操作流程|建議流程|建議操作步驟|操作步驟|可參考步驟|怎麼開始|可借用的驗收步驟|可借用的只讀驗收步驟|實作流程與核對邊界`）為 Priority 1；描述性章節（`流程|輸入與預期輸出|實作步驟|作者做過的流程|作者報告的流程|作者實作`）為 Priority 2，確保具體步驟永遠優先於作者自述。
     - 智慧去除項目符號（`1. `, `- `, `* `, `• `）與多餘空行，提取前 1~2 步核心步驟，並以分號整齊串接。
     - 提取權限、費用與驗收限制（`所需連接、權限與限制|權限、費用與限制|權限、費用與可用性|權限、費用及限制|權限與驗收|限制與驗收|要注意什麼` 等）作為精確具體的 `caution`。
     - 進行 160 字元硬上限截斷與空白正規化，防止版面破壞。
   - 修復背景載入完成時的閱讀錨定偏移（Reading Anchor & Table Anchor）：
     - `selectReadingAnchor` 增加 `after - 4` 子像素容錯，並在下游為空時優雅回退至可見候選集，防止 Firefox 與窄螢幕下錨點為空導致未執行捲動校正。
     - 候選節點選取器擴充支援 `h3`, `.markdown-table`, `tr`，解決短視口純表格閱讀時無錨點可用導致的 84px 跳動。
     - 精確計算 `statusDiff = statusHeight - statusAfter`，且在使用者焦點位於延伸閱讀返回按鈕（`relatedHasFocus`）時不誤移捲動。
   - 在 `metadata(markdown)` 中整合雙重回退優先序：`copy.how || extracted.how || defaultHow`，完美相容既有 `copy.json` 與安全預設。
2. `assets/style.css`：
   - 於 `@media(max-width:760px)` 壓縮搜尋表單、篩選摘要與結果清單垂直留白，並在 `@media(max-width:360px)` 實施精簡間距。
   - 將手機 390px 與 320px 視口之搜尋框至首筆卡片距離分別縮短至 213.8px 與 234.7px，嚴格滿足 `< 240px` 可見性預算，同時保留 44px/48px 無障礙觸控尺寸。
3. `index.html`：
   - 精簡搜尋提示文案為「支援多詞同時符合（AND）；可搜尋問題、工具、作法與限制。」，縮減手機端行高占用，保留契約要求之多詞 AND 檢索說明。
4. `.github/workflows/category-find-qa.yml`：
   - 將 Pages 發布資產輪詢次數由 180 次（6 分鐘）調整至 300 次（10 分鐘），工作逾時上限調為 25 分鐘，與其他公開站驗收工作流程對齊，消除部署延遲假性失敗。
5. `tests/actionable-guidance.test.cjs`：
   - 擴充至 8 項完整單元與回歸測試，覆蓋 H3 標題、作者自述優先級、權限提取、copy.json 優先權與 DOM 渲染。

## 驗收結果 (Acceptance & Verification)

- **單元與回歸測試**：
  - `node --test tests/*.test.cjs`：全套 306 項測試通過，0 失敗。
  - `node --check assets/app.js assets/style.css`：語法檢查通過。
  - `python3 scripts/preview.py /tmp/preview-final`：本地預覽生成無錯誤。
  - `python3 scripts/check_corpus_bundle.py /tmp/preview-final`：449 個來源逐 byte 完全一致。
- **CI 故障修復實測驗收**：
  - `tests/results-return-browser.cjs` 首筆結果距離：390px 實測 228.1px（< 240px，PASS）；320px 實測 234.7px（< 240px，PASS）。
  - `tests/table-anchor-browser.cjs` 表格錨定跳動：390×480 短視口實測 delta 由原本 -84.38px 穩定至 -0.38px（|delta| <= 2px，PASS）。
  - `tests/reading-anchor-browser.cjs` 閱讀位置跳動：桌面實測 delta = -0.19px、手機實測 delta = -0.38px、窄手機實測 delta = +0.44px（全數 |delta| <= 2px，PASS）。
- **三種具體使用情境走查 (Simulated Scenario Walkthrough)**：
  1. **情境一（新訪客探索生活情境與首頁抽卡）**：
     - 點選「生活」情境，首篇展示 UC-077，點入詳情對話框。
     - 展開入門建議，「🚀 怎麼開始」正確顯示專屬操作步驟：「先在本機確認發布腳本只會推到草稿（不是直接發布），並確認金鑰從本機設定檔或系統鑰匙圈讀取，不寫在腳本參數或對話裡…」，「⚠️ 要注意什麼」呈現「需啟用 Grok Bot 的本機電腦功能；每個本機指令依你的本機電腦政策核准…」。
     - 按 Escape 鍵關閉，焦點準確回到原卡片按鈕（`activeElement.tagName === 'BUTTON'`）。
  2. **情境二（專業工程師問題導向搜尋與落地評估）**：
     - 輸入「PR」檢索，返回 206 筆結果；開啟 UC-005（PR 審查）。
     - 入門建議正確優先使用 `copy.json` 精修文案：「先寫清需求與驗收條件，再分開進行實作和程式審查」，「建立 PR 不等於功能完成；測試、審查、合併與部署要分別確認」。
  3. **情境三（行動端 390px / 320px 深度閱讀與無障礙走查）**：
     - 於 390×844 與 320×740 視口直鏈打開 UC-020，展開指引卡片呈現「指定可用元件和內容清單；先做少量預覽」與「Figma寫入及第三方素材使用須明確授權；來源無獨立品質測量」。
     - 手機 320px 與 390px 視口水平無任何溢出（`scrollWidth === clientWidth`，`noOverflow: true`）。
     - 按鈕與摘要高度皆維持 $\ge 44\text{px}$ 觸控無障礙標準（`guidanceSummaryHeight === 44`）。
- **獨立代碼審查反饋與修正 (Independent Reviewer)**：
  - Reviewer 指出：原本 Priority 1 納入 `作者實作`，導致 UC-128 誤取前面自述而忽略後面真正的「操作步驟」。已修正將其移至 Priority 2，並新增 UC-128 回歸測試。
  - Reviewer 指出：在 `.related-back` 聚焦時若狀態未完全隱藏（部分載入），直接減去 `statusHeight` 會誤移捲動。已修正加入 `!relatedHasFocus && statusDiff > 0` 雙重保護。
---

## 截圖佐證 (Screenshots)

- 桌面卡片清單（修改後）：[desktop-cards-after.png](screenshots/desktop-cards-after.png)
- 桌面 UC-005 落地指引呈現：[desktop-detail-uc005.png](screenshots/desktop-detail-uc005.png)
- 桌面 UC-020 落地指引呈現：[desktop-detail-uc020.png](screenshots/desktop-detail-uc020.png)
- 手機 390px UC-005 詳情閱讀：[mobile-390-detail-uc005.png](screenshots/mobile-390-detail-uc005.png)
- 手機 390px UC-020 詳情閱讀：[mobile-390-detail-uc020.png](screenshots/mobile-390-detail-uc020.png)
- 手機 320px 極窄螢幕無溢出：[mobile-320-detail-uc020.png](screenshots/mobile-320-detail-uc020.png)
- 手機 390px 搜尋與結果距離符合預算：[mobile-390-search-results.png](screenshots/mobile-390-search-results.png)
---

## 風險與下一輪建議 (Risks & Next Step)

- **風險與限制**：
  - 少數約 15% 歷史案例的 Markdown 結構僅有討論或來源版本，缺乏結構化的操作步驟標題，此類案例自動採用安全誠實的預設警語，不捏造步驟。
  - GitHub Pages 部署仍需約 8~12 分鐘同步，工作流程已具備充分輪詢預算。
- **下一輪最值得做的一件事**：
  - 針對長篇案例研究（>12 段）之目錄定位與提示詞區塊複製功能，進一步優化手機端長按/複製回饋與鍵盤快速跳轉體驗。
