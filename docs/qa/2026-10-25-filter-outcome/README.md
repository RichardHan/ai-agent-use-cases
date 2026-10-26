# 手機篩選結果就近回饋（2026-10-25）

## 問題與決策

正式站 390×844 實走：搜尋「規劃旅行」得到 1 筆，加入「工作」後為 0 筆；展開的篩選面板約 1,559px 高，結果與「移除工作」的復原建議在視窗下方。目標為用手機按問題與情境找案例的新訪客。

- A（採用）：面板頂端加入手機專用、捲動時保持可見的結果摘要與「查看結果與調整建議」。沿用原篩選、空結果建議與焦點機制；成本低，面板多佔約 62px。
- B（未採用）：全面重排篩選順序並將結果固定於頁面底部；需改動既有資訊架構、遮擋閱讀內容風險高。

不改搜尋語意、案例資料、證據分類或桌面篩選版面。載入中按鈕停用；載入失敗時顯示未完成並可前往原有重試區；部分來源失敗時不宣稱全庫完整。

## 驗收

| 尺寸 | 修改前 | 修改後 |
|---|---|---|
| 手機 390×844 | [零結果與遠端復原](before-mobile.png) | [面板內零結果摘要](after-mobile.webp) |
| 桌面 1440×1000 | [結果流程](before-desktop.png) | [桌面維持原面板](after-desktop.webp) |

預覽：`python3 scripts/preview.py /tmp/ai-agent-round-preview/ai-agent-use-cases && python3 -m http.server 8289 --directory /tmp/ai-agent-round-preview`，開啟 `http://127.0.0.1:8289/ai-agent-use-cases/`。此預覽模擬 Liquid，不等於正式 Jekyll 部署。

- 基準 `node --test tests/*.test.cjs`：344 過／0 失敗；修改後同為 344 過／0 失敗。`node --check assets/app.js` 通過；`python3 scripts/check_corpus_bundle.py /tmp/ai-agent-round-preview/ai-agent-use-cases`：447 個來源逐 byte 一致。
- `node tests/discovery-browser.cjs` 在本環境因 `Cannot find module 'playwright'` 未執行；已加入手機與窄手機真實零結果、固定回饋、焦點與復原回歸步驟，待 CI 具 Playwright 環境執行。瀏覽器手動走查使用獨立 Chromium 預覽：390 與 320px 的摘要固定於 y=0、高 62px，情境選單分別於 y=412／360px；按鈕 44px 高，頁面水平溢出 0px。點選到結果後焦點在 `results-count`，空結果可移除「工作」復原為 1 筆；開啟 UC-001、Escape 返回原卡片焦點。桌面 1440px 不顯示手機摘要，零結果仍正常。
- 獨立審查發現載入失敗未更新摘要，修正 `load()` 開始與 catch 狀態後複審無阻擋。未在實機、Firefox/WebKit、正式部署重驗；不宣稱效能或轉換改善。來源連結正式站基準可開啟，預覽未重新訪問外部來源。

下一輪：梳理詳情手機首屏重複的研究／方法導覽與較遠的來源入口，先實測再縮減操作。
