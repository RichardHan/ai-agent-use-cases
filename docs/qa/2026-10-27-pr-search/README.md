# 2026-10-27 PR 縮寫搜尋精準度

目標：手動輸入 `PR` 的首次訪客找到合併請求案例，而非含 `privacy`、`1Password` 的字詞片段。正式站 390／1440px 直鏈 `?q=PR#explore` 實走為 211／459 筆；首頁「代碼審查（PR）」早已改用中文查詢，但手動輸入仍有雜訊。459 是網站條目，非合格真實案例數。

- 方案 A（採用）：僅對 pull/merge request 同義詞中的 `pr`、`prs`、`mr`、`mrs` 要求英數詞界，保留 `PR149` 等編號。搜尋、排序、命中解釋與原文定位共用同一判斷。成本：改動搜尋及閱讀路由，需回歸。
- 方案 B：將 `PR` 改寫成「代碼審查」。成本低，但會遺漏與代碼審查無關的合併請求，且分享 URL 不再表達原輸入；不採用。

驗收：`privacy`、`1Password`、`Probé` 不因 `pr` 單獨命中；`PR`、`PR審查`、`PR149`、`pull request` 可命中；全文／僅標題用途、排序與命中原文一致。搜尋及組合篩選、空結果恢復、詳情直鏈重整、返回、原文固定版本與 Pages 子路徑不退化。本輪不改其他縮寫、來源資料、證據狀態、統計口徑、部署流程。

| 尺寸 | 修改前正式站 | 修改後本地預覽 |
| --- | --- | --- |
| 390×844 | [前](before-mobile.webp) | [後](after-mobile.webp) |
| 1440×900 | [前](before-desktop.webp) | [後](after-desktop.webp) |

預覽：`python3 scripts/preview.py /tmp/pr-boundary-preview/ai-agent-use-cases && python3 -m http.server 8139 --directory /tmp/pr-boundary-preview`，開啟 `http://127.0.0.1:8139/ai-agent-use-cases/?q=PR#explore`。本機 preview 模擬 Liquid，不是正式 Jekyll build。

基準 `node --test tests/*.test.cjs` 361／361，JS `node --check` 全通過；回歸新增後先紅，`Privacy` 錯誤入列。修改後預覽 53／459 筆（正式站 211／459）；457 個來源逐 byte 一致。390px `PR`＋工作＋進階開發得 6／459，點 UC-056、原始 Markdown 固定於 `c0165a7`、關閉後保留條件；不存在詞 0／459，改回 `PR` 恢復 6／459。1440px UC-324 直鏈重整可讀，Escape 返回查詢。兩尺寸無水平溢出，頁面錯誤 0；桌面 DOMContentLoaded 187ms、load 211ms（本機單次 Chromium 指標，非正式站效能）。三情境是模擬走查，非真人偏好。影像已擷取，但此環境影像讀取停用，未能目視審核；無 axe 或文字對比量測，不聲稱通過。

獨立 reviewer 指出初版漏掉 `PR149` 且排序／命中解釋／原文路由仍匹配片段；已修正並複審，無剩餘 blocker。近期 Actions 的 Print reading／Case sharing 已知在 Pages 完成前約 15 分鐘失敗，非本輪功能證據；尚未核對此分支正式部署。下一輪最值得處理：讓公開站 QA 等待同 SHA 的 Pages 成功後再核對，避免競速紅燈。
