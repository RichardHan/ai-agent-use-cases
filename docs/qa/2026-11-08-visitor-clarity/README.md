# 2026-11-08 訪客日常痛點問題精準檢索與詳情頁可信度分層（成果主張提出者／核讀狀態邊界／安全採用指引）驗收報告

## 驗收環境與基準
- **驗收基準 Commit**：`b0fcf12fc109e692489d1b667934a948903b7756`（PR #253 合併後）
- **隔離工作樹**：`/private/tmp/ai-agent-20261108-visitor-clarity-round`
- **分支名稱**：`improve/20261108-visitor-clarity-round`
- **驗證工具**：Playwright 1.56.1 (Chromium headless)、@axe-core/playwright 4.10.2、Node.js 內建測試運行器
- **驗收時間**：2026-11-08

## 測試視口涵蓋
1. **Desktop**：1440 × 900
2. **Mobile**：390 × 844 (iPhone 12/13/14 等標準現代手機尺寸)
3. **Small Mobile**：320 × 740 (窄螢幕小尺寸手機)

---

## 三大核心驗收情境

### 情境 1：新訪客不知道工具名稱，從日常問題與痛點快捷找到適用案例
- **問卷調查（首頁捷徑與自然搜尋）**：點擊首頁 `問卷調查` 快捷標籤，精準召回 97 筆問卷與回覆案例，首位為 UC-253（問卷收到了 AI 回覆），次位為 UC-401（每週家人菜單問卷），徹底解決原 0 筆問題。
- **文獻回顧（首頁捷徑與自然搜尋）**：點擊首頁 `文獻回顧` 快捷標籤，精準召回 7 筆學術與文獻案例，首位為 UC-012（寫論文前先讓 AI 挑戰研究結論）。
- **機票比價（自然長問句）**：搜尋「機票比價」與「機票價格」，精準召回機票與行程比較案例（如 UC-425、UC-001），同時不破壞 ADS-B 航班雷達追蹤案例（UC-334「航班追蹤」）。
- **費用報銷（自然長問句）**：搜尋「費用報銷」與「我想報銷費用」，精準召回報銷與帳務對帳案例（如 UC-263、UC-103），同時避免 standalone 費用（如「費用抵免」）誤觸發。
- **Axe 無障礙**：三大尺寸首頁與搜尋結果頁 Accessibility Violations 均為 0。

### 情境 2：使用者組合搜尋與篩選，遇到空結果後恢復探索
- **衝突條件空結果**：輸入「契約審查」並設定情境為「創作」，觸發 0 筆空結果。
- **單一篩選條件移除**：系統顯示放寬引導，點選移除「創作」情境，立即復原 10+ 筆合約審核案例。
- **複合門檻＋情境空結果與情境內問題探索**：設定門檻為「入門對話（免寫程式）」、情境為「生活」、搜尋「代碼審查」，觸發 0 筆空結果。空狀態同時提供移除條件與情境內推薦問題（「旅遊」）。
- **情境內問題點擊復原**：點擊「旅遊」推薦捷徑，保留「生活」與「入門對話」，精準恢復 18 筆旅遊案例，URL 正確同步。
- **Axe 無障礙**：空狀態、復原狀態與情境內推薦復原頁面 Accessibility Violations 均為 0。

### 情境 3：使用者開啟分享的詳情連結，判讀證據、查看來源並返回探索
- **深層直鏈**：以 `?scenario=工作&case=UC-098#explore` 直達 PDF/Excel 案例。
- **可信度分層（新增）**：
  - 清楚展示憑據標籤 `.proof-note-tag`（作者報告／示範）。
  - 明確呈現 `.proof-note-claimant`：**成果主張來源：社群作者／專案實踐者**（區分官方團隊 vs 社群作者 vs 公開文獻）。
  - 明確呈現 `.proof-note-status`：**本庫核讀狀態：本庫未於本機獨立重現代碼或流程；請留意作者個人環境與版本差異。**
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
| Desktop (1440) | 情境 1：契約審查長問句 | `desktop-03-scenario1-contract-review.png` |
| Desktop (1440) | 情境 2：衝突條件空結果 | `desktop-04-scenario2-empty.png` |
| Desktop (1440) | 情境 2：單一條件放寬復原 | `desktop-05-scenario2-recovered.png` |
| Desktop (1440) | 情境 2b：複合門檻＋情境空結果 | `desktop-05b-scenario2-compound-empty.png` |
| Desktop (1440) | 情境 2b：情境內痛點問題復原 | `desktop-05c-scenario2-in-facet-recovered.png` |
| Desktop (1440) | 情境 3：詳情直鏈與可信度分層 | `desktop-06-scenario3-detail.png` |
| Desktop (1440) | 情境 3：關閉詳情返回探索 | `desktop-07-scenario3-returned.png` |
| Mobile (390) | 首頁至關閉返回全流程 (12 張) | `mobile-*.png` |
| Small Mobile (320) | 窄螢幕全流程 (12 張) | `smallMobile-*.png` |

---

## 結論與品質聲明
全流程經 Playwright 在 Chromium 進行真實 DOM 與瀏覽器走查，全數 36 個狀態無任何水平溢出（horizontal overflow = false），無任何 page error，無任何 Axe WCAG 2.1 AA 違規（totalViolations = 0）。本測試為真實瀏覽器自動化驗收，非真人使用者研究。
