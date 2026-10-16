# UC-229：macOS直接發佈簽署身分與公證證據核對

- 情境：開發
- 標籤：發佈、簽署、公證、驗收
- 網站標題：App能打包還不夠：先核簽署、公證和下載包是否對得上
- 一句話用途：把發佈前置、CI結果、公證回條與成品驗收分開，避免把綠燈當全部完成。
- 適用工具：早期Sand／後稱Grok Bot、雲端coding agent、GitHub Actions、macOS
- 證據：A｜作者實作與公開PR；未下載驗簽或執行成品
- 研究核對日：2026-10-17（台灣）

## 作者實際做了什麼
Kinopee 在2026-08-11記錄以早期Sand（後稱Grok Bot）協助Realtime Translator直接發佈：辨別Developer ID與其他證書、整理CI前置、將簽署／公證修改交雲端coding agent形成PR，另拆無關變更。作者也明說早期版本與用法仍有不確定性。
公開PR36加入簽署、公證及staple流程，但測試清單未勾；PR38記錄失敗後修正，作者勾選發佈綠燈及公證Accepted等結果。PR38註明Made with Cursor，不將全部程式修改歸給Bot。發佈頁有macOS包與校驗資產，未獨立驗其二進位、實際啟動或安全性。

## 可以幫你做什麼
建立發佈證據鏈：打包成功、正確發行者身分、公證狀態、票證附加與最終下載包是不同驗收項。適合先整理缺項，再交授權負責人完成敏感步驟。

## 怎麼開始
以下為本庫自設、未實測的離線練習：
1. 準備虛構版本號、證書型別中繼資料、CI結果及公證狀態回條。
2. 對照所有證據是否屬同一版本／產物，區分正式發佈與PR測試路徑。
3. 未取得的狀態留待查，不能從PR已合併推論簽署或公證成功。
4. 將失敗、修正、再驗結果按時間列出；原先未勾的測試不能默認通過。
5. 留下由本人核對最終包與啟動體驗的清單，不實際簽署、上傳或發佈。

## 可貼指令
> 只核對這組合成發佈資料，不連線Apple、GitHub或任何帳號。逐欄對照版本、產物識別、證書型別、CI結果、公證狀態、staple與最終包驗收；列出衝突與缺證。區分正式release和PR測試，不能把合併／綠燈等同公證成功。保留失敗紀錄及未勾測試。不要索取或處理私鑰、密碼、API key，不建立憑證、不接受協議、不觸發CI、不繞過安全警告。

## 官方限制、權限與費用
- Apple官方說明公證是自動惡意內容及簽署問題檢查，與App Review不同，不能視為完整功能或安全認證。
- 正確Developer ID、公證結果、staple和最終實際啟動應分別留證；原始日誌及下載包未在本庫重驗。
- 真實流程涉及開發者帳號、可能的會員費、簽署憑證、持續存取及法律協議。這些步驟須有適當授權；原文的Secrets操作不是一般免核准指令。
- 作者有授權本機作業與雲端coding agent混合使用；不能稱其全程雲端。本庫僅公開來源研究，不操作讀者電腦。
- 完整服務費用與當前帳號可用性未核，早期產品經驗不保證目前完全相同。

## 驗收與反例
自設、未測：一筆CI綠燈屬舊版本，另一筆公證Invalid，第三筆有Accepted但缺最終包證據。合格輸出應分別標出不足，不能合併成「已安全發佈」。正式操作由人另外授權與執行。

## 去重
本案終點是OS發行者身分、公證與成品證據鏈；不同UC-005一般PR審閱、UC-057 runner設定、UC-214運行版本核對、UC-218第三方安裝來源審閱。多個OS與PR不拆計。

## 來源與查閱範圍
- Kinopee，日文，2026-08-11：[原作者實作](https://qiita.com/Kinopee/items/47970f629f1d98a42ccf)。已讀正文，早期Sand/Grok Bot歸因來自作者。
- kinopeee，英文，2026-08-08 UTC：[PR36](https://github.com/kinopeee/interpreter-openai/pull/36)、[PR38](https://github.com/kinopeee/interpreter-openai/pull/38)。已讀公開說明與狀態；Accepted仍是作者記錄，未獨立重跑。PR38後續dry-run項仍未勾。
- [v0.3.2發佈資產](https://github.com/kinopeee/interpreter-openai/releases/tag/v0.3.2)：已核公開資產清單，未下載／驗簽／執行。
- Apple，英文：[公證官方文件](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)，核對2026-10-17台灣。僅核通用要求與限制。
