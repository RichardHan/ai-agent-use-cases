# 2026-11-08 訪客日常問題精準檢索（資料清理／日誌分析／法規遵循）、首頁痛點導流與詳情頁安全採用指引端到端驗收報告

## 驗收環境與基準
- **驗收基準 Commit**：`0965e8a930c0cb94a3d744775a0fedfb0c8c82d4`（PR #254 合併後）
- **隔離工作樹**：`/private/tmp/ai-agent-20261108-visitor-trust-flow`
- **分支名稱**：`improve/20261108-visitor-trust-flow`
- **驗證工具**：Playwright 1.56.0 (Chromium headless)、@axe-core/playwright 4.10.2、Node.js 內建測試運行器 (v23.7.0)
- **驗收時間**：2026-11-08

## 測試視口涵蓋
1. **Desktop**：1440 × 900
2. **Mobile**：390 × 844 (iPhone 12/13/14 等標準現代手機尺寸)
3. **Small Mobile**：320 × 740 (窄螢幕小尺寸手機)

---

## 三大核心驗收情境

### 情境 1：新訪客不知道工具名稱，從日常問題與痛點快捷找到適用案例
- **資料清理（首頁捷徑與自然問句）**：點擊首頁 `資料清理` 快捷標籤，精準召回 285 筆資料整理案例，首位為 UC-036（每天的收銀資料，整理成可核對的入帳檔），徹底解決原 0 筆問題；自然問句「我想清理資料」、「資料清洗」均精準命中。
- **日誌分析（首頁捷徑與自然問句）**：點擊首頁 `日誌分析` 快捷標籤，精準召回 172 筆日誌相關案例，首位為 UC-096（網站出問題，先把錯誤日誌和部署時間對起來），徹底解決原 0 筆問題；自然問句「伺服器日誌」、「分析日誌記錄」均精準命中。
- **法規遵循（首頁捷徑與自然問句）**：點擊首頁 `法規遵循` 快捷標籤，精準召回 17 筆合規審查案例，首位為 UC-102（法規改了，先找出公司哪張安全表單需要修），徹底解決原 0 筆問題；自然問句「合規檢查」、「檢查合規性」均精準命中。
- **簡報製作（自然長問句）**：搜尋「做簡報」、「製作簡報」、「做投影片」、「投影片製作」，精準召回簡報設計案例（如 UC-019）。
- **Axe 無障礙**：三大尺寸首頁與搜尋結果頁 Accessibility Violations 均為 0。

### 情境 2：使用者組合搜尋與篩選，遇到空結果後恢復探索
- **衝突條件空結果**：輸入「契約審查」並設定情境為「創作」，觸發 0 筆空結果。
- **單一篩選條件移除**：系統顯示放寬引導，點選移除「創作」情境，立即復原 10+ 筆合約審核案例。
- **複合門檻＋情境空結果與情境內問題探索**：設定門檻為「入門對話（免寫程式）」、情境為「生活」、搜尋「代碼審查」，觸發 0 筆空結果。空狀態同時提供移除條件與情境內推薦問題（「旅遊」）。
- **情境內問題點擊復原**：點擊「旅遊」推薦捷徑，保留「生活」與「入門對話」，精準恢復 18 筆旅遊案例，URL 正確同步。
- **Axe 無障礙**：空狀態、復原狀態與情境內推薦復原頁面 Accessibility Violations 均為 0。

### 情境 3：使用者開啟分享的詳情連結，判讀證據、查看來源並返回探索
- **深層直鏈**：以 `?scenario=工作&case=UC-098#explore` 直達 PDF/Excel 案例。
- **可信度分層與安全採用指引**：
  - 清楚展示憑據標籤 `.proof-note-tag`（作者報告／示範）。
  - 明確呈現 `.proof-note-claimant`：**成果主張來源：社群作者／專案實踐者**。
  - 明確呈現 `.proof-note-status`：**本庫核讀狀態：本庫未於本機獨立重現代碼或流程；請留意作者個人環境與版本差異。**
  - 明確呈現 `.proof-note-safety`：**安全採用建議：採用前應先做資料去敏；重要決策、金流支付與系統寫入務必保留人工審批。**
- **入門建議與限制直達**：點擊 `.reader-guidance-shortcut` 展開建議操作流程（怎麼開始）與關鍵注意事項（要注意什麼）。
- **原始研究與外部來源查核**：展開原始研究，外連 Reddit 原始討論鏈結正常可見。
- **重新整理與返回保留**：重新整理頁面，Modal 保持開啟；關閉 Modal 後，原工作情境篩選與結果清單完整保留。
- **Axe 無障礙**：詳情 Modal 與關閉返回頁面 Accessibility Violations 均為 0。

---

## 截圖紀錄清單

| 視口 | 步驟／情境 | 截圖檔名 |
|---|---|---|
| Desktop (1440) | 首頁 | `desktop-01-homepage.png` |
| Desktop (1440) | 情境 1：問卷調查捷徑 | `desktop-02-scenario1-survey.png` |
| Desktop (1440) | 情境 1：文獻回顧捷徑 | `desktop-02b-scenario1-literature.png` |
| Desktop (1440) | 情境 1：機票比價問句 | `desktop-02c-scenario1-airfare.png` |
| Desktop (1440) | 情境 1：費用報銷問句 | `desktop-02d-scenario1-expense.png` |
| Desktop (1440) | 情境 1：資料清理捷徑 | `desktop-02e-scenario1-dataclean.png` |
| Desktop (1440) | 情境 1：日誌分析捷徑 | `desktop-02f-scenario1-log.png` |
| Desktop (1440) | 情境 1：契約審查長問句 | `desktop-03-scenario1-contract-review.png` |
| Desktop (1440) | 情境 2：衝突條件空結果 | `desktop-04-scenario2-empty.png` |
| Desktop (1440) | 情境 2：單一條件放寬復原 | `desktop-05-scenario2-recovered.png` |
| Desktop (1440) | 情境 2b：複合門檻＋情境空結果 | `desktop-05b-scenario2-compound-empty.png` |
| Desktop (1440) | 情境 2b：情境內痛點問題復原 | `desktop-05c-scenario2-in-facet-recovered.png` |
| Desktop (1440) | 情境 3：詳情直鏈與安全採用指引 | `desktop-06-scenario3-detail.png` |
| Desktop (1440) | 情境 3：關閉詳情返回探索 | `desktop-07-scenario3-returned.png` |
| Mobile (390) | 首頁至關閉返回全流程 (14 張) | `mobile-*.png` |
| Small Mobile (320) | 窄螢幕全流程 (14 張) | `smallMobile-*.png` |

---

## 結論與品質聲明
全流程經 Playwright 在 Chromium 進行真實 DOM 與瀏覽器走查，全數 42 個狀態無任何水平溢出（horizontal overflow = false），無任何 page error，無任何 Axe WCAG 2.1 AA 違規（totalViolations = 0）。獨立 Reviewer 審查通過。本測試為真實瀏覽器自動化驗收，非真人使用者研究。
