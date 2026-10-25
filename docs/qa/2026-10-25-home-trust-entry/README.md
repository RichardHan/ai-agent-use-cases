# 首頁收錄數量與核對入口（2026-10-25）

## 問題與選擇

目標訪客是第一次找可採用案例的知識工作者。公開站首頁首屏宣稱「447 篇真實經驗」，但同頁實測顯示嚴格核對合格 367、主要案例頁 443，另外還有經驗與待查想法；447 是預覽來源檔案數，不是已合格的真實案例數。這句話讓來源與核對狀態混淆。

- A（採用）：首屏改為「公開案例與研究筆記」，直接連到既有的分項統計；不複製或硬編數字，載入故障時也不把未核對內容當實證。改動小，核對數需要點一次連結查看。
- B（未採用）：首屏動態呈現核對合格數及網站條目數；可少一次點擊，但增加兩個非同步資料來源的載入、失敗與版面跳動風險。

本輪不修改案例資料、資格判定、搜尋排序或 Actions workflow。來源數與合格數均沿用既有生成與核對機制。

## 驗收與證據

| 視口 | 修改前 | 修改後 |
|---|---|---|
| 桌面 1440×900 | [公開版首屏](screenshots/before-desktop.webp) | [本機預覽首屏](screenshots/after-desktop.webp) |
| 手機 390×844 | [公開版首屏](screenshots/before-mobile.webp) | [本機預覽首屏](screenshots/after-mobile.webp) |
| 窄手機 320×740 | 既有 QA 截圖見 [上一輪](../2026-10-25-visitor-action-hierarchy-and-ci-resilience/README.md) | [本機預覽首屏](screenshots/after-narrow.webp) |

本機預覽：`python3 scripts/preview.py /tmp/visitor-round-preview/ai-agent-use-cases && python3 -m http.server 8127 --directory /tmp/visitor-round-preview`，開啟 `http://127.0.0.1:8127/ai-agent-use-cases/`。根路徑下的 `#collection-stats` 不改查詢條件；瀏覽器返回原搜尋條件。

瀏覽器實測桌面首屏連結為 146×44px，跳轉後可讀到「嚴格核對合格 367」與「網站收錄條目 443 個主要案例頁、3 篇經驗與踩坑、3 個待查想法」；手機連結 100×44px、文字與背景對比 7.98:1。手機[統計落點](screenshots/after-mobile-stats.webp)距視口頂端 76.7px；390px 和 320px 都無水平溢出，320×740 任務入口底端 715.8px。這是本機預覽與當時公開版觀察，不代表真人使用者評價或網站轉換率。

回歸測試先對公開舊版執行，因「447 篇真實經驗」斷言失敗；本機預覽則通過三個瀏覽器情境。`node --test tests/*.test.cjs`：337 通過、0 失敗；`node --check` 全部 assets JS 和 tests CJS、`git diff --check` 通過；`python3 scripts/check_corpus_bundle.py /tmp/visitor-round-preview/ai-agent-use-cases`：447 個來源逐 byte 一致。無獨立 lint、type check 或 npm build 設定；使用既有 Python 靜態預覽。額外手動走查組合篩選（日報＋工作＋入門對話 15/449）、不存在字詞的空結果與清除、UC-324 詳情直鏈及 Escape 返回。獨立 reviewer 對 diff 給予 PASS，未執行瀏覽器；手機點擊、鍵盤焦點（3px outline）、錨點落點由整合者補驗。核對摘要若載入失敗，既有統計區仍顯示 `—` 與重試，首屏不提供未經核對的固定合格數。

最新 `08b905f` Actions 查詢時 0 failure、3 success、20 in-progress、9 queued；舊 commit 的 Pages 輪詢失敗不能當成本輪退化。本輪未修改工作流程；合併後 Pages 發佈與新 SHA 的雲端結果仍需確認。

## 下一輪

優先處理首頁抽卡不能直接選實作門檻：目前必須先到搜尋篩選區選難度，且切換情境會清掉難度。若要增加抽卡門檻控制，需同步搜尋、網址、情境切換和抽卡池，不能只加 UI。
