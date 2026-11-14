# 正式站來源驗收診斷（2026-11-05）

基準 `5701849cede5c15084e58fd2e54fc9ccfe5cf4c4`。原工作樹有未提交修改，本輪在隔離 worktree 作業。正式站 [Pages 部署](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41918296458)成功，`catalog.json` 的來源版本為同一 SHA。

[Facet counts QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41918301367) 的正式站來源檢查在 `source-guide-browser.cjs:60` 因來源連結 `href` 為 null 失敗；同一步的五組 facet 檢查均已通過。這不是足以判定根因的證據：來源版本尚未核對時介面本來就會停用連結。[Missing shared case QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41918301601) 在資產匹配後等待 `networkidle` 逾時；兩者不應直接歸因於部署競速。

選擇保留原有來源連結斷言，僅在缺少連結時記錄 catalog 版本、整包請求 HTTP 狀態或失敗、來源狀態提示、失敗來源數及載入完成狀態。替代方案是等待或重試，但在根因不明時可能掩蓋來源核對失敗。診斷不記錄 URL、回應內容、標頭或 cookies；不改產品及部署流程。

本機 `node --check tests/source-guide-browser.cjs` 通過；`node --test tests/published-check.test.cjs tests/published-assets.test.cjs` 30 項通過。使用本輪修改後腳本對正式站執行 `GUIDE_PUBLISHED=1 node tests/source-guide-browser.cjs`（Playwright 依賴由原工作樹提供），Chromium 1440／390px 的來源、鍵盤返回、篩選／空結果、分享直鏈／重載及長文流程通過，UC-001 來源連結固定於基準 SHA，桌面來源 HTTP 200；來源說明與空結果的 axe 掃描在這兩個尺寸無違規。這次成功路徑沒有觸發新診斷，不能證明診斷已在真實失敗時輸出。獨立 reviewer 未發現斷言削弱或敏感資訊暴露，但無法讀取 Actions 日誌，亦未驗證新診斷執行。

下一輪：以受控網路故障演練來源連結不可用，核對 `SOURCE_LINK_UNAVAILABLE` 訊息並確保原斷言仍失敗；再觀察同版本的 Actions 真實執行。另行診斷 missing-case 的 `networkidle` 逾時，不無限重跑。若基準或正式站版本改變，先核對 sourceRevision、PR head 與 Pages 執行結果。
