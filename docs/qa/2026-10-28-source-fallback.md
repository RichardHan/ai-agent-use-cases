# 逐篇回退時保留來源核對路徑

目標：整包請求失敗但逐篇原文可讀的訪客。正式站正常狀態 UC-012 的來源固定於發布 SHA；受控本機預覽封鎖 `corpus.json` 後，UC-001 原文可讀，但「查看 GitHub 原始 Markdown」沒有 href，讀者無法從詳情核對倉庫原文。

兩案：A 為每篇建立發布時完整性清單並驗證後開固定版本，精確但增加 Jekyll／預覽格式與資料同步成本；B 保留固定版本連結的嚴格閘門，額外提供明示「最新版本（可能不同）」的自願跳轉（本輪採用）。此路徑不能視為目前讀到的原文或獨立證據；原文內未核對的相對連結仍不啟用，可從 GitHub 最新檔案自行追查。沒有改案例、證據、搜尋或計數。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 390px | [前](2026-10-28-source-fallback-before-mobile.png) | [後](2026-10-28-source-fallback-after-mobile.png) |
| 1440px | [前](2026-10-28-source-fallback-before-desktop.png) | [後](2026-10-28-source-fallback-after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-source-clarity-after/ai-agent-use-cases`，再 `python3 -m http.server 8193 --directory /tmp/visitor-source-clarity-after`，開啟 `http://127.0.0.1:8193/ai-agent-use-cases/?case=UC-001`。截圖皆為本機 Chromium 預覽，封鎖整包請求，不是正式站改版截圖；此執行環境影像讀取工具未提供目視解碼，已核對 DOM 與版面溢出，未宣稱人工視覺審核。

基準 `node --test tests/*.test.cjs` 363/363；新測試先紅（找不到備援來源入口），修後單檔 6/6、全套 364/364，`node --check assets/app.js` 及預覽生成成功。受控瀏覽器封鎖整包：UC-001 直鏈打開後主來源無 href，明示最新版本連結指向 `blob/main/cases/001-travel-checkout.md`；正常整包則最新版本入口隱藏，主來源固定於 `577e9c8`，390px 無水平溢出，關閉返回首頁。獨立 reviewer 指出背景版本核對時焦點可能被隱藏，以及既有瀏覽器鍵盤驗收會把隱藏連結當成 Tab 項目；已轉交焦點、調整可見控制的斷言並加單元回歸。瀏覽器腳本因本環境未安裝 Playwright 未執行。未跑跨引擎、axe、效能或正式發布驗收。
三種模擬情境：直鏈讀 UC-001 遇整包失敗仍可自願對照 GitHub 最新版；正常整包僅見固定版本來源；從詳情關閉返回探索。這些是功能走查，不是真人偏好。下一輪優先設計靜態建置可核對的逐篇完整性清單，使失敗回退也能安全連到相同發布 SHA。