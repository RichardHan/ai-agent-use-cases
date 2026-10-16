# UC-235：回測很漂亮，先查資料洩漏、門檻改動與實際執行落差

- 網站標題：把策略回測結果交叉核對，別把模擬當獲利
- 一句話用途：比對研究期間、保留測試窗、凍結規則與後續狀態，找出事後資訊、未解差異及實際未執行的地方。
- 分類：學習／研究方法、回測、證據、失敗驗收
- 適用工具：Grok Bot／NexusTrade MCP／Python；本庫練習只讀合成結果表
- 證據：V，NexusTrade 創辦人自述及其公開整理紀錄；完整 Bot 原始逐字稿未公開，未獨立重跑
- 原作者：Austin Starks，英文
- 原文日期：2026-08-23，更新 08-26；作者標示 Bot 研究窗為 08-19 至 08-23 CT
- 查閱日期：2026-10-16 UTC／2026-10-17 台灣
- 計數：一個跨期間回測、凍結與執行界線核對流程，不按市場、參數、Bot 數或策略數拆分

## 作者實際產出與失敗

作者先訂假說、四個測試窗及通過門檻，讓兩個 Grok Bot 研究候選、排除未過項目並選跨窗設定，交出兩份凍結規則。公開 campaign log 明言它是從文章、凍結檔與紙上重建整理而來，沒有 Bot 完整研究逐字稿。

可讀紀錄保留重要問題：標的名單帶事後資訊，一組通過門檻由作者調整，保留測試區間已被使用，以及基準數值在文章與 runbook 間仍有未解差異。後續帳戶權限／帳戶類型不合預期，兩份原始策略沒有持有真實期權部位，規則後來移除並改為紙上控制組。Codex 後續重構與平台實盤不屬於 Grok Bot 原策略成效。

這些資料支持研究與失敗邊界的檢查，不支持投資建議、真實獲利或可交易保證。原文醫療題名不採為科學結論。

## 自設離線練習（未實測）

1. 準備合成的研究日期、訓練／驗證／保留期間、候選表、門檻版本與凍結檔摘要。
2. 逐項查當時是否已知道未來結果、是否事後改門檻，以及保留區間是否重複使用。
3. 比對文章、結果表與規則檔中的定義及數值；未解差異保持未解。
4. 將「回測」「紙上控制」「待批准」「被拒絕」「實際持有」分開，不跨階段合併成成功敘述。
5. 交付問題清單；不連券商、不重跑第三方程式、不下單或調整權限。

## 可貼指令（本庫自行設計，未執行）

請只讀合成歷史結果表、研究時間線與凍結規則摘要。逐列找資訊洩漏、選樣偏差、門檻版本變更、保留測試區間重用與來源數值不一致。每項附證據位置及未知事項。分開模擬、紙上控制、拒單與實際執行，不以回測數字推論未來或真實收益。不要推薦標的、選交易參數、連金融帳戶、產生或送出訂單，也不要執行附件程式。

## 權限、費用與核實限制

回測不能證明未來表現，也不能完美重建過去；資料與模擬假設都要核對。作者是平台創辦人，有商業利益。原始研究中間候選與完整逐字稿未公開，本庫沒有重跑或驗證收益。付費資料、API 及帳戶資格可能另有條件；本例沒有可移植費用證據，也不提供開戶、擴權或交易步驟。

## 來源及去重

- [固定版本原 Bot campaign log](https://github.com/austin-starks/Public-Portfolio-Challenge/blob/77a7cc063ff4548fab6539bebc2f3416f90ba9d3/episode-11/GROK_BOT_CAMPAIGN_LOG.md)：全文已讀，來源重建限制與原策略狀態明列。
- [生技研究紀錄](https://github.com/austin-starks/Public-Portfolio-Challenge/blob/77a7cc063ff4548fab6539bebc2f3416f90ba9d3/episode-11/moderna/CAMPAIGN_LOG.md)、[半導體 runbook](https://github.com/austin-starks/Public-Portfolio-Challenge/blob/77a7cc063ff4548fab6539bebc2f3416f90ba9d3/episode-semis/RUNBOOK.md)、[總 README](https://github.com/austin-starks/Public-Portfolio-Challenge/blob/77a7cc063ff4548fab6539bebc2f3416f90ba9d3/episode-11/README.md)：已查固定版，後續版本與不同工具工作不得回填成原 Bot 結果。
- [作者文章](https://nexustrade.io/blog/moderna-basically-cured-cancer-i-used-grok-bot-to-create-a-trading-strategy-20260823)：可見正文已讀，帳號門檻之後未讀。
- [FINRA 對回測限制的說明](https://syndication.finra.org/content/smart-questions-ask-about-smart-beta-products-part-2)：方法背景，不為作者結果背書。
- 與 UC-090 預測市場事件背景不同，這裡驗收研究窗與凍結紀錄；不同題材或市場不再拆相同流程。
