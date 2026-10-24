# 2026-10-25：主線 Actions 與訪客流程健康檢查

## 決策

1. **依 Pages 部署成功事件集中觸發公開站驗收**：可減少部署競速誤報，但會改動多條 workflow 的觸發和責任邊界，需先設計不漏掉主線驗收的機制。
2. **保留現行檢查，核對修正後主線狀態再決定是否變更**（採用）：若最新主線已通過且找不到新的失敗根因，避免為歷史故障再做重複修補；代價是本輪沒有網站 UI 改善。

## 證據與範圍

- `origin/main` 已更新至 `a2b0256`，本地工作樹乾淨；建立隔離分支 `improve/pages-deploy-gated-qa-20261025`。未改動網站程式或資料。
- 最近 100 筆 `main` workflow runs：65 成功、17 失敗、18 取消。失敗最新一批建立於 2026-10-24 17:15Z，包括 Search context、Print reading、Corpus loading、Category finding 等；這些皆早於已記錄的 stale-published-assets 修正後重跑。
- 更新後最新主線一批（2026-10-24 18:14Z）Source guide QA、Corpus bundle QA、Facet counts QA、Reading flow QA 與 Pages deploy 均成功。Pages 延遲與舊 SHA 誤判已有前兩份紀錄追蹤，不重複改 workflow。
- 三個較早開啟的 PR（#78、#79、#80）仍開啟，未納入本輪；沒有覆寫其他分支或工作樹內容。

## 驗收

- `node --test tests/*.test.cjs`：271 通過、0 失敗。
- `node --check assets/*.js scripts/*.cjs tests/*.cjs`：通過。
- `python3 scripts/preview.py /tmp/ai-agent-use-cases-round-preview`：成功建立靜態預覽。
- `git diff --check`：通過；工作樹除本紀錄外無程式變更。
- 正式站桌面 1440px 與手機 390px：搜尋「旅遊」、組合生活／Meta Muse 篩選、UC-001 直鏈詳情、Escape 關閉返回、查看 Markdown 與原始來源連結、零結果狀態。兩尺寸均無水平溢位（scrollWidth 等於 viewport 寬度）。手機直鏈與零結果皆正常；來源連結可見其 GitHub／原始文章目標。
- 本輪沒有 UI 修改，因此不宣稱前後視覺改善；瀏覽器截圖僅為臨時檢查圖，未納入版本庫。`package.json` 不存在，沒有可執行的 lint/type-check 命令。

## 限制與後續

- 本輪沒有發現最新主線仍可重現的 Actions 失敗，故不加部署 gate 或改動 workflow。下次若同一類錯誤重新出現在最新 SHA，先核對 Pages deploy SHA 與失敗步驟，再針對新根因修正。
- 獨立 reviewer / scout agent 執行器回報 `No model selected`，未取得獨立審查結果；本輪無程式碼變更，仍將此列為審查限制。
- 主工作階段模型標示為 `openai-codex/gpt-6-luna`；工具無法讀取或確認其推理設定，也無法替 agents 設定模型。
