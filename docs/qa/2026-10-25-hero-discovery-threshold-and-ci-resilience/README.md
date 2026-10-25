# 首頁抽卡門檻直選與 GitHub Actions 淘汰容錯（2026-10-25）

## 問題與選擇

目標訪客包含不具寫程式背景的初次造訪者、尋求現成外掛串接的工作者，以及維護 repository 的開發者。

1. **訪客門檻探索斷層**：首頁探索區（`#discover`）原僅提供情境按鈕與隨機抽卡，訪客無法直接指定實作門檻（例如只想看「免寫程式」的入門案例）。若要限制門檻，必須先滾動至下方搜尋篩選區點開摺疊面板，在 `#difficulty` 下拉選單中選取；更關鍵的是，訪客若在首頁切換其他情境，`chooseScenario()` 會將所有篩選值（含 `difficulty`）一併清除，導致剛設定的門檻遺失，抽卡與情境探索體驗脫節。
2. **GitHub Actions 頻繁逾時爆紅**：當 `main` 連續合併 PR 或推送新 commit 時，舊 commit 觸發的數十個 Actions 仍持續在 published-site 輪詢中等待該 commit 發佈。由於輪詢迴圈與逾時拋出前未重測 `isCurrentMainCommit`，在 15–18 分鐘後無條件丟出異常導致 Actions 失敗，造成使用者回報的「actions 常常壞掉」。

- **方案 A（採用）**：
  - 在首頁 `#discover` 探索抽卡區加入實作門檻按鈕組（全部門檻、免寫程式、需帳號/外掛、需代碼環境），與全域 `#difficulty`、網址 `?difficulty=`、搜尋篩選及抽卡池雙向連動。
  - 抽卡狀態與洗牌 key 納入門檻條件，卡片狀態即時顯示對應難度（例如「全部情境 · 免寫程式 · 這組條件有 250 張案例卡」），空池時提示切換門檻或情境。
  - 在 `tests/load-recovery-live.cjs`、`tests/published-version.cjs`、`tests/deployed-browser.cjs` 及 `.github/workflows/home-search-entry-qa.yml`、`relevance-qa.yml` 輪詢迴圈中加入已被新 commit 取代之檢查，在逾時或定期輪詢時安全退出（exit 0），終結 CI 假警報。
- **方案 B（未採用）**：僅在抽卡卡片下方加文字超連結引導使用者至下方篩選區，並將 Actions 逾時時間由 15 分鐘拉長至 25 分鐘。未解決首頁直接可用的核心體驗，且拉長 Actions 逾時會進一步佔用並阻塞 GitHub runner 額度。

本輪不修改案例主檔內容、資料夾結構或既有搜尋分詞語意。

## 驗收與證據

| 視口 | 修改前 | 修改後 |
|---|---|---|
| 桌面 1440×900 | [修改前首屏](screenshots/before-desktop.webp) | [本機預覽首頁抽卡門檻](screenshots/after-desktop.png) |
| 手機 390×844 | [修改前首屏](screenshots/before-mobile.webp) | [本機預覽手機 2×2 門檻按鈕](screenshots/after-mobile.png) |
| 窄手機 320×740 | [修改前首屏](screenshots/before-narrow.webp) | [本機預覽單欄無溢出](screenshots/after-narrow.png) |

本機預覽：`python3 scripts/preview.py /tmp/visitor-preview/ai-agent-use-cases && python3 -m http.server 8288 --directory /tmp/visitor-preview`，開啟 `http://127.0.0.1:8288/ai-agent-use-cases/`。

### 走查實測（Chromium 瀏覽器）
1. **情境一（非技術新手）**：初次造訪點擊「免寫程式」門檻，按鈕呈現 `aria-pressed="true"`，全域 `#difficulty` 同步為 `入門對話`，網址同步為 `?difficulty=%E5%85%A5%E9%96%80%E5%B0%8D%E8%A9%B1`，抽卡狀態為「全部情境 · 免寫程式 · 這組條件有 250 張案例卡」，卡片呈現「入門對話」標籤。點擊查看詳情正常開啟，按 Escape 順利關閉回到抽卡位置。
2. **情境二（職場工作者）**：手機 390×844 視口下切換「工作省點力」，點擊「需帳號/外掛」，抽卡池過濾出 13 筆工具串接案例；按鈕尺寸均達 136×44px（符合 WCAG >= 44×44px 觸控目標標準），`scrollWidth === 390` 無水平溢出。
3. **情境三（帶參數直連）**：320×740 視口直連 `?difficulty=入門對話&q=旅遊`，首頁門檻按鈕「免寫程式」正確復原反白，搜尋結果精準過濾為 27 筆；門檻按鈕在 320px 下以單欄全寬排列（208×44px），`scrollWidth === 320` 無水平溢出。

### 測試與審查
- `node --test tests/*.test.cjs`：344 通過、0 失敗。
- `node --check` 檢查 `assets/*.js` 及 `tests/*.cjs` 全數通過。
- `git diff --check` 通過，無多餘空白與行尾衝突。
- `python3 scripts/check_corpus_bundle.py`：447 個來源全文與 catalog 逐 byte 一致。
- 獨立 Subagent `IndependentReviewer` 審查代碼與差異，給予 **PASS**（確認無行為退化、符合無障礙規範、CI 機制相容且無敏感資料洩漏）。

## 下一輪

建議優先處理詳情頁（Reader Modal）的「步驟指引（How）」與「注意事項（Caution）」在手機版的可複製與直達互動，讓行動端訪客在閱讀長案例時能一鍵複製提示詞或核心指引，進一步降低實作門檻。
