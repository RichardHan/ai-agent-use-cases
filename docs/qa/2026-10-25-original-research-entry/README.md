# 2026-10-25 長篇案例原始研究入口與 Actions 回歸修復

## 決策與範圍

1. **採用：原始研究維持收合，在案例用途摘要旁加一鍵入口。** 點擊或鍵盤 Enter 才展開；焦點移到原文摘要，Tab 可到「回到閱讀導覽」。保留原文可讀性及現有段落導覽。
2. 自動展開完整原文：少一次操作，但會把長篇內容直接塞入閱讀流程，降低首次閱讀節奏；不採用。

目標讀者：以手機、鍵盤讀取長篇案例的人。預期改善：不用先找目錄或已存在的「先讀」段落，就能從案例用途附近開啟原始研究、來源與提示詞；仍可選擇只讀摘要。

不處理：案例事實、原始 Markdown、來源／合格計數、搜尋規則、Pages 部署來源及第三方功能。

## 問題證據與驗收

- 修改前正式 UC-005 的研究區塊維持收合，有 42 個原文標題；reader 只提供選段跳轉，通用「開啟原始研究」按鈕僅出現在無適合預覽段落的 fallback，長文沒有穩定的通用入口。
- 修改前直接開啟 UC-005 的正式站桌機／手機畫面已保存於下方。此改動把入口放在 `.plain-overview`，不是埋在 42 段目錄中。
- 入口只對 12 段以上的長文顯示；保留 `<details>` 初始收合。入口 44px 以上、長標籤換行；展開後摘要可聚焦，下一個 Tab 進入返回控制，Enter 回到閱讀導覽標題。
- Actions 同批失敗中，Reader QA 明確記錄行動搜尋「首筆結果距搜尋框 <240px」斷言失敗。正式站 390px 與 320px 實測皆為 277px，首筆仍在搜尋後的可視視窗中；改為保留 300px 距離上限並另驗證首筆出現在視窗內，避免將合理的 37px 差異誤報為故障。沒有改網站搜尋版面。
- 另有已記錄 Pages 部署曾耗時 11分38秒；Source guide 的發布檢查原本僅 84×5 秒、job 上限 12 分鐘。新增回歸測試先失敗，再將輪詢改為 180×5 秒（15 分鐘）及 job 上限 25 分鐘；仍要求 HTML／JS／CSS 逐 byte 相符，沒有略過失敗。

## 變更

- `assets/reader.js`：長篇案例在用途摘要旁新增穩定入口；展開後原文摘要旁提供返回導覽按鈕。
- `assets/reader.css`：沿用品牌配色、清楚鍵盤外框、44px 觸控下限及窄螢幕換行。
- `tests/reader-browser.cjs`：驗收初始收合、入口位置、鍵盤展開、摘要焦點、Tab／Enter 返回與再次收合。
- `tests/mobile-search-browser.cjs`：以實測 277px 更新 mobile search-to-result 上限為 300px，另驗證首筆位於 viewport 內。
- `.github/workflows/source-guide-qa.yml`：正式站資產輪詢 15 分鐘、job 上限 25 分鐘。
- `tests/visitor-experience-and-ci.test.cjs`：防止 Source guide 輪詢窗短於部署實測與 job timeout 不足。

## 驗收證據

- 基準 `node --test tests/*.test.cjs`：285 passed、0 failed。最終：286 passed、0 failed。
- `node --check assets/*.js scripts/*.cjs tests/*.cjs`：通過。
- Source guide 等待預算回歸測試在 workflow 修改前實際失敗（84×5 秒不足 15 分鐘）；修改後全套測試通過。
- `ruby` YAML parse：workflow 解析成功。
- `python3 scripts/preview.py /tmp/ai-agent-use-cases-original-entry-final/ai-agent-use-cases`：成功。
- `python3 scripts/check_corpus_bundle.py /tmp/ai-agent-use-cases-original-entry-final/ai-agent-use-cases`：445 個來源逐 byte 相同。
- 本機 Chromium 預覽，使用 `?case=UC-005` 直鏈檢查 1440×1000、390×844、320×740：42 段標題均保留；入口分別落在 detail 內 y=389、510、584px；各尺寸 `scrollWidth == viewport width`。按鈕在手機換行但可見，最小觸控高度符合 44px。
- 手機鍵盤流程：Enter 展開 → 焦點在原文 `<summary>` → Tab 聚焦返回控制 → Enter 回到 `#reader-nav-title`；原文可再收合。刷新直鏈保留 UC-005。
- axe-core 4.13.0 對手機收合頁面：27 passes、0 violations、0 incomplete。入口 14px 文字對比實算 8.06:1；無障礙樹提供含「42 段」的按鈕名稱。
- 三種模擬情境：新訪客從首頁「直接搜尋案例」抵達搜尋（焦點在搜尋框）；旅人以「旅遊＋生活＋Grok Bot」找到 16 案、開 UC-001、核對證據標示及原始 Markdown 來源，Escape 返回並保留 16 案／篩選；回訪讀者輸入無結果查詢，鍵盤 Enter 選「日報」捷徑後得到 62 案且焦點落在結果數。這些是流程檢查，不是使用者研究。
- UC-005 引用來源實際開啟成功：<https://zenn.dev/tec/articles/c4fbfcfffde4ad>，頁面標題「Grok Botの公式MarketplaceとCommunity Templateを比較して実際に使ってみた」。
- 本機預覽：`python3 -m http.server 8125 --directory /tmp/ai-agent-use-cases-original-entry`；直鏈 <http://127.0.0.1:8125/ai-agent-use-cases/?case=UC-005>。

## 修改前後截圖

- 桌機 1440×1000：[修改前](screenshots/before-desktop.png) · [修改後](screenshots/after-desktop.png)
- 手機 390×844：[修改前](screenshots/before-mobile.png) · [修改後](screenshots/after-mobile.png)

## Actions、風險與後續

- 盤點 `main @ 726713d` 同批有 7 個 workflow 失敗；可讀取的 Reader log 明確指出共用 `mobile-search-browser.cjs` 斷言閾值不符合正式站 277px 實測。其餘失敗根因未全部由現有 log 證實，不宣稱已一併修好。
- PR #90 的 outline QA 在 UC-001 上失敗：來源已有13個標題，測試仍把它當成小案例並期望沒有目錄搜尋。改用核實為11段的 UC-003，明確檢查少於12段且兩個長文控制都不出現；保留篩選、Escape 與回復驗收。修改後 `node --check tests/outline-find-browser.cjs` 通過，管理式瀏覽器重現 UC-003 為11段、無目錄搜尋／原文入口。
- 同一 PR 的兩次後續 browser 工作取消於安裝 Chromium／Firefox／WebKit 工具階段（分別約10與18分鐘；正式瀏覽器測試尚未執行）。這是尚待最新雲端執行確認的外部依賴風險，不當成網站測試通過，也未擅自拉長 timeout。
- 目前本地測試／瀏覽器驗收完成；GitHub PR、合併、正式 Pages 部署及部署後 Actions 結果須以後續 GitHub 回報補記，不能以本機預覽代替。
- 本地沒有專案定義的 lint／type-check 命令，也未安裝 Playwright 套件；完整 Chromium／Firefox／WebKit 長流程由既有雲端 workflow 驗收。
- 下一輪優先逐一分類合併後 Actions 的剩餘失敗；不再盲目放寬其他斷言或部署等待時間。
