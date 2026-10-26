# 首頁問題搜尋語彙統一、案例受眾目標雙層呈現、官方憑據精準識別與全站 Actions 部署時限加固

## 問題與方案

1. **搜尋捷徑語彙不一致與噪聲命中**：首頁「常見痛點」入口「代碼審查（PR）」原本設定為 `href="?q=PR#explore"`。因比對演算法採 substring 比對，搜尋 `PR` 導致 207 篇案例（含 1Password、pricing、privacy 等無關案例）被混雜命中，大幅干擾初次造訪者。相較之下，搜尋區之任務標籤 `data-query="代碼審查"` 則精準命中 18 篇高價值代碼審查與測試案例。
2. **卡片受眾與目標互斥**：卡片渲染中原本使用 `if (item.coreGoal) renderGoal() else renderTargetUser()`，使得聲明了核心目標的案例反而被隱藏了適合對象（`targetUser`）。對於新訪客而言，「解決什麼痛點」與「適合誰」是兩個互補的決策維度。
3. **官方展示憑據識別缺口**：`assets/app.js` 原有正則僅辨識 `official` 或 `官方.*(?:自報|第一手.*自述)`，致使 UC-018（官方首發用途展示）、UC-023（官方發布情境／教學示例）、UC-031（官方 Artifact 用途範例）等官方案例被錯誤歸類為「公開資料核讀」。
4. **GitHub Actions 頻繁逾時假紅燈**：GitHub Pages 實際構建部署耗時 18～24 分鐘（既錄最高 23.6 分鐘 / 1,419 秒），而多個關鍵工作流程與瀏覽器腳本（如 `recency-qa.yml`、`combined-recovery-qa.yml`、`corpus-qa.yml`、`reading-flow-qa.yml`、`return-visibility-qa.yml`、`search-context-qa.yml`、`code-reading-qa.yml`、`trust-summary-qa.yml` 等）仍維持 15 分鐘（180/301 次輪詢）或 25 分鐘 caller 限制，且部分輪詢缺少 loop 內與拋錯前之 `isCurrentMainCommit` 新鮮度檢查，造成 PR 合併後頻繁假性變紅。

- **方案 A（採用）**：
  - 統一 Hero 痛點連結為 `href="?q=代碼審查#explore"`，與搜尋任務標籤及空結果捷徑語彙對齊，精確呈現 18 篇專屬案例，徹底消除 `privacy` 等 207 篇噪聲干擾。
  - 卡片資訊階層優化：當案例具備 `coreGoal` 時呈現「🎯 解決痛點：...」，同時當有具體 `targetUser`（或情境對象）時緊隨呈現「👤 適合對象：...」，並透過 CSS `.card-goal + .card-target-user { margin-top: -2px; }` 保持緊湊閱讀節奏與垂直空間預算。
  - 擴充官方憑據辨識：涵蓋 `官方.*(?:展示|示例|範例|發布|自報|第一手.*自述)|official`，使官方展示案例精確標註為「官方自報」。
  - 系統性全面加固 Actions 部署輪詢與呼叫超時：將輪詢嘗試提升至 25+ 分鐘（301 次 × 5s 或 501 次 × 3s），工作超時提升至 30～35 分鐘，補齊 loop 內與拋錯前新鮮度閘門。
- **方案 B（未採用）**：僅改 Hero 單一 href，不處理卡片受眾互斥、不修官方憑據正則、不加固 CI 逾時。治標不治本，無法滿足訪客閱讀與部署穩定性要求。

## 前後對照

| 尺寸與場景 | 修改前（正式/基準站） | 修改後（本機相容預覽） |
|---|---|---|
| 桌面 1440px 首頁 | [before-desktop-home.png](screenshots/before-desktop-home.png) | [after-desktop-home.png](screenshots/after-desktop-home.png) |
| 桌面 1440px 痛點搜尋（代碼審查） | [before-desktop-search.png](screenshots/before-desktop-search.png) (207 篇混雜) | [after-desktop-search.png](screenshots/after-desktop-search.png) (18 篇精準) |
| 桌面 1440px 詳情閱讀（UC-018 官方憑據） | [before-desktop-detail.png](screenshots/before-desktop-detail.png) | [after-desktop-detail.png](screenshots/after-desktop-detail.png) |
| 手機 390px 首頁 | [before-mobile-home.png](screenshots/before-mobile-home.png) | [after-mobile-home.png](screenshots/after-mobile-home.png) |
| 手機 390px 痛點篩選（代碼審查） | [before-mobile-filter.png](screenshots/before-mobile-filter.png) | [after-mobile-filter.png](screenshots/after-mobile-filter.png) |
| 手機 390px 詳情閱讀（UC-005） | [before-mobile-detail.png](screenshots/before-mobile-detail.png) | [after-mobile-detail.png](screenshots/after-mobile-detail.png) |
| 極窄 320px 首頁 | [before-narrow-home.png](screenshots/before-narrow-home.png) | [after-narrow-home.png](screenshots/after-narrow-home.png) |
| 極窄 320px 詳情閱讀 | [before-narrow-detail.png](screenshots/before-narrow-detail.png) | [after-narrow-detail.png](screenshots/after-narrow-detail.png) |

## 驗收結果

1. **搜尋一致性與噪聲消除**：點擊首頁 Hero「代碼審查（PR）」直接載入 18 篇案例，結果列表首篇為 UC-005「讓 AI 寫功能，再找另一個 AI 挑問題」，不出現 1Password、發票或個人隱私無關結果。
2. **卡片受眾與目標清晰呈現**：卡片依序呈現標題、痛點（🎯 解決痛點）與適用對象（👤 適合對象），在 1440px、390px 及 320px 寬度下文字排版緊湊，無多餘留白。
3. **憑據狀態精確性**：UC-018、UC-023、UC-031 等案例正確標記為「官方自報」，詳情頁憑據解讀卡忠實播報「官方團隊第一手發布的自述或示範，未經第三方獨立驗證」。
4. **無障礙與視口排版**：
   - 桌面 1440px、手機 390px 及極窄 320px 實測：水平溢出檢查（`scrollWidth <= innerWidth`）全數為 0。
   - 互動觸控目標尺寸（除隱藏 skip link 外）100% 滿足 `>= 44px` 規範。
5. **三種真實情境走查**：
   - 情境一（初次造訪技術工程師）：從首頁 Hero 點選「代碼審查（PR）」，精準獲得 18 篇相關案例，點閱 UC-005 詳情，閱讀入門指引與工具鏈，關閉後焦點平穩返回原卡片。
   - 情境二（職場行政與非技術訪客）：從首頁選擇「生活」情境，搜尋無效關鍵字進入空狀態，看到動態過濾後的 8 項可行痛點標籤，點選「日報」立即獲得 11 筆符合生活與日報的案例。
   - 情境三（官方工具評估者）：搜尋「UC-018」，一眼看見「官方自報」藍色徽章與專屬受眾提示，開展詳情查閱原始來源與官方展示說明，憑據界限透明清晰。

## 測試指令與輸出摘要

```bash
# 單元測試全套
node --test tests/*.test.cjs
# 輸出：354 tests pass, 0 fail, 0 cancelled, 0 skipped, duration 5.27s

# JavaScript 語法檢查
node --check assets/app.js && node --check tests/*.cjs
# 輸出：0 errors

# 本機預覽構建
python3 scripts/preview.py /tmp/preview-after/ai-agent-use-cases
# 輸出：/private/tmp/preview-after/ai-agent-use-cases
```

## 獨立審查反饋與修正

- 審查角色：`independentReviewer`
- 反饋重點：指出當瀏覽器測試腳本將輪詢窗口擴充至 25 分鐘時，呼叫端工作流程（如 `corpus-qa.yml`、`reading-flow-qa.yml`、`return-visibility-qa.yml`、`search-context-qa.yml`）原本的 `timeout-minutes: 25` 會在部署耗時達到極限時提前被 Actions 取消，導致終端新鮮度檢查無法執行。
- 修正落實：全面將相關呼叫端工作流程 timeout 提升至 30 分鐘，並對齊 `tests/detail-mobile-navigation.test.cjs` 與 `tests/visitor-experience-and-ci.test.cjs` 之超時斷言契約，全套測試 354 項 100% 通過。

## 未解決風險與下一輪優先項

1. **未解決風險**：實體 iOS Safari VoiceOver 朗讀手勢與真機外觀未經真機硬體實測，仍依 Playwright WebKit 引擎與 Axe-core 規範驗收。
2. **下一輪最值得做的一件事**：建議建立全站統一的 `TASK_REGISTRY` 字典模組，將 Hero 痛點、搜尋區按鈕、空結果建議與同義詞擴充整合為單一資料源，避免未來各頁面各自維護文字與 query 產生語意漂移。
