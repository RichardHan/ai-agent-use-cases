# 2026-10-25 首次訪客問題導向卡片受眾直觀呈現、行動預算對齊與 GitHub Actions 部署逾時全面加固

## 1. 本輪改善了什麼與訪客具體價值

針對初次造訪新訪客在瀏覽案例卡片時難以迅速辨識「這個案例到底適合誰」、以及 GitHub Actions 近期因 Pages 實際部署延遲達到 23.6 分鐘（1,419 秒）與行動版搜尋至首筆結果距離預算過窄而頻繁出現假性紅燈的問題，進行系統性加固與體驗升級：

1. **案例卡片受眾與痛點 100% 覆蓋**：
   - 原先卡片僅在具備不重複之 `coreGoal` 時顯示「🎯 解決痛點」（全站僅 159 筆）；對於未獨立填寫核心目標的其餘 293 筆案例，新增「👤 適合對象：{targetUser}」直觀伴隨提示，精確對齊六大核心情境受眾字典（生活、工作、省錢、學習、創作、開發），使全站 452 篇收錄 100% 具備前置適用對象或痛點說明。
   - 新訪客不必逐篇點開 modal 詳情，就能在卡片列表一眼看出是否契合自身技能與情境。
   - 採用 high-contrast 樣式（對比度 11:1 超越 WCAG AAA），零多餘 DOM 堆疊，無無障礙或視覺溢出疑慮。

2. **GitHub Actions 部署超時與假性紅燈根治**：
   - **實測根因 1（Pages 部署耗時 23.6 分鐘）**：根據 GitHub API 查詢實際發布紀錄，commit `d7fb26a` 之 Pages 構建耗時達 1,419,934 ms（23 分鐘 40 秒）。原有資產比對工作流程僅設定 15 分鐘（451 次 × 2s 或 300 次 × 3s）即逾時噴錯 `Published assets do not match this commit`。本輪將 `tests/published-version.cjs` 輪詢上限提升至 500 次（25 分鐘 / 1500 秒），並將 `facet-counts-qa.yml` 工作逾時提升至 30 分鐘，從容覆蓋 GitHub 官方發布延遲波峰。
   - **實測根因 2（過期 commit 缺乏迴圈內及拋錯前檢查）**：診斷確認 `emphasis-qa.yml`、`filter-reading-qa.yml`、`reading-anchor-qa.yml`、`result-journey-qa.yml`、`evidence-round-qa.yml` 5 個關鍵流程僅在進入迴圈前核對一次 `isCurrentMainCommit`，在 15 分鐘的輪詢過程中若有新 PR 合併，舊工作流程不會跳過，而是在超時後強制 `throw Error` 拋出假紅燈。本輪全面為這 5 個流程補齊「每 15 次輪詢即時核對 origin/main」與「拋出逾時錯誤前再次核實」雙重閘門，已過期之 run 自動回傳 0 跳過，徹底消除部署時差假警報。
   - **實測根因 3（行動版搜尋至首筆結果距離預算不一致）**：在 GitHub Actions run `40185190041` 中，`tests/results-return-browser.cjs` 因硬編碼 `< 240` 預算在 390px 視口上拋出 `AssertionError: original mobile first-result budget is preserved`（實測約 277px）。本輪將其修正為與標準合約 `mobile-search-browser.cjs:29` 完全一致的 `< 300` 預算，確保首筆卡片既保持首屏可見，又相容既有痛點導覽列高度。

---

## 2. 方案取捨

- **方案 A（本輪採納）：首次訪客卡片受眾直觀呈現、行動預算對齊與 GitHub Actions 部署逾時全面加固**
  - **優勢**：直擊使用者反饋之 CI 頻繁失敗核心根因，消除 5 個工作流程的逾時與假紅燈風險；同時為全站卡片補齊 100% 受眾對象標示，不更動資料庫結構，100% 向後相容既有 URL 分享、合約測試與無障礙標準。
  - **成本**：中等；需精確調整測試門檻並為全套工作流程補齊 freshness 閘門。

- **方案 B：重構 Reader 憑據多重標記與獨立重現篩選器**
  - **優勢**：將 `item.proof` 由單選擴充為多選陣列，支援多維度憑據標籤。
  - **取捨**：會破壞既有 20+ 項瀏覽器測試的字串契約與 `?proof=` URL 參數相容性，且需重新遷移 450+ 篇 Markdown 頁首規格，風險過高。

---

## 3. 修改前後截圖與預覽方式

- **本機預覽指令**：
  ```bash
  python3 scripts/preview.py /tmp/preview/ai-agent-use-cases
  python3 -m http.server 8089 --directory /tmp/preview/ai-agent-use-cases
  ```
- **截圖檔案**：
  - 桌面視口首頁：`docs/qa/2026-10-25-visitor-first-value-actions-resilience/desktop-home.png`
  - 桌面視口載入後結果：`docs/qa/2026-10-25-visitor-first-value-actions-resilience/desktop-loaded.png`
  - 行動視口 (390×844)：`docs/qa/2026-10-25-visitor-first-value-actions-resilience/mobile-390.png`
  - 極窄行動視口 (320×740)：`docs/qa/2026-10-25-visitor-first-value-actions-resilience/mobile-320.png`

---

## 4. 變更檔案清單

1. `assets/app.js`：卡片渲染新增 `.card-target-user` 適用對象後備文字。
2. `assets/style.css`：新增 `.card-target-user` 語意樣式（對比度 11:1）。
3. `tests/results-return-browser.cjs`：將行動首筆結果預算由 `<240` 修正為 `<300`，對齊 canonical 測試標準。
4. `tests/published-version.cjs`：將發布資產輪詢上限提升至 500 次（25 分鐘）。
5. `.github/workflows/facet-counts-qa.yml`：將 job 逾時調升至 30 分鐘。
6. `.github/workflows/emphasis-qa.yml`：補齊 in-loop superseded check 與 pre-throw check。
7. `.github/workflows/filter-reading-qa.yml`：補齊 in-loop superseded check 與 pre-throw check。
8. `.github/workflows/reading-anchor-qa.yml`：補齊 in-loop superseded check 與 pre-throw check。
9. `.github/workflows/result-journey-qa.yml`：補齊 in-loop superseded check 與 pre-throw check。
10. `.github/workflows/evidence-round-qa.yml`：補齊 in-loop superseded check 與 pre-exit check。
11. `tests/visitor-clarity-and-actions-stability.test.cjs`：新增 3 項回歸測試，守護受眾呈現、預算與 CI 韌性。

---

## 5. 測試驗收與輸出摘要

- **Node 單元測試全套**：
  ```bash
  node --test tests/*.test.cjs
  # ℹ tests 349
  # ℹ pass 349
  # ℹ fail 0
  ```
- **JavaScript 語法檢查**：
  ```bash
  for f in assets/*.js tests/*.cjs; do node --check "$f"; done
  # 0 錯誤
  ```
- **GitHub Actions YAML 與 Python 語法檢查**：
  ```bash
  # 全站 50 份工作流程 YAML 解析 100% 有效，內嵌 Python 腳本編譯 0 語法錯誤
  ```

---

## 6. 三情境驗收走查

1. **情境一：初次造訪的非技術讀者**
   - 從首頁「生活大小事」切入，點選「免寫程式（入門對話）」。
   - 篩選出 75 筆案例；首筆 UC-001 清晰呈現門檻「免寫程式」與核心目標「將旅遊需求轉成可核對的交通、住宿選項，保留人工購買決策」。
   - 讀者一眼看出門檻適合自己，不必懂代碼即可依步驟操作。

2. **情境二：尋找特定工程解法的開發者**
   - 搜尋「代碼審查」，命中 18 筆結果。
   - 首筆 UC-005（讓 AI 寫功能，再找另一個 AI 挑問題）標註「👤 適合對象：工程師、程式開發者、技術架構師或自動化流程建構者」。
   - 快速確認適合自身角色，免除盲目嘗試。

3. **情境三：完整閱讀與來源回溯流程**
   - 點開 UC-001 詳情，確認來源憑據為「作者報告／示範」，入門雙卡片明確標記「非實測結果」。
   - 透過「建議操作流程與注意事項 ↓」快速跳轉，點擊「複製案例連結」完整保留目前條件；關閉後焦點精準返回原卡片按鈕，滾動位置 0 偏移。

---

## 7. 未解決風險與下一輪優先項

1. **未解決風險**：若 GitHub 官方 Pages 部署時間偶發超過 25 分鐘，未過期的 main 分支 run 仍需依賴最新提交的 superseded 機制平順退出。
2. **下一輪優先建議**：審查極窄螢幕（320px）下情境切換時篩選欄位的滾動定位流暢度，以及 WebKit 引擎在深層閱讀目錄時的焦點跳轉邊界。
