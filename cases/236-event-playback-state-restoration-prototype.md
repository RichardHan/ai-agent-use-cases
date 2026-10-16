# UC-236：事件觸發播放後，還能尊重暫停並恢復原狀嗎？

- 網站標題：從配樂原型學事件去重、暫停保留與狀態恢復
- 一句話用途：讀公開原型的修正紀錄，練習找出舊事件、晚到事件與播放交接錯誤；只用合成事件，不連音樂服務。
- 重要限制：原型將 Spotify 配樂連到遊戲事件，與 Spotify 官方視覺媒體同步等限制有衝突風險。本例是原型與失敗分析，不推薦安裝或連接 Spotify。
- 分類：開發／事件、狀態機、恢復、反例
- 適用工具：Grok Bot 協作開發；AoE4 日誌與播放控制原型
- 證據：A 公開程式產物＋作者修正自述；未找到提交的測試執行報告，未獨立重現
- 原作者：Capstar／GitHub Capstar1，英文
- 版本：固定 commit ee5b8e94f2c47b1049d56d72cf30665e84309775，2026-10-16 00:09:06 UTC
- 查閱日期：2026-10-16 UTC／2026-10-17 台灣
- 計數：一個外部播放的事件狀態與原狀恢復流程；不按版本或遊戲時代拆分

## 公開產物與實際限制

README 明寫由 Capstar 製作、以 Grok Bot 建置。公開程式以遊戲原生日誌判斷玩家與開局、升時代、結束事件，再決定播放交接、暫停保留及賽後恢復。這是具體程式產物，不證明全部功能成功。

版本與修正紀錄保留舊場次日誌誤觸發、遊戲重開殘留狀態、晚到 replay 標記及 intro 沒交接等問題。早期 release 明說主要做自動化／模擬，未完整真局驗收；後續 clean install 也僅一部 PC。測試檔含合成事件與反例，但有測試碼不能寫成測試全過。沒有讀到完整 Grok 對話、真局影片或音訊。

## 自設只讀驗收（未執行）

1. 用合成時間線表示開始、升級、暫停、結束、重複及晚到事件；只指定自有音效的虛構名稱。
2. 建預期狀態表：每個事件前後狀態、是否允許動作、需要保留的原值。
3. 插入舊場次事件與晚到 replay 標記，檢查會不會誤觸發或需要撤銷。
4. 結束時核原播放／隨機／重複狀態是否可恢復；失敗及未知分開報。
5. 只交表格與反例，不下載程式、不控制遊戲或播放器、不建立 OAuth。

## 可貼指令（本庫自行設計，未測）

請只讀合成事件與預期狀態規格，列出每一步狀態、可允許的虛構動作及保留值。測試重複、亂序、晚到、舊場次、使用者暫停與重啟。不要把事件被解析當成外部動作已完成；無確認回條列未知。輸出不一致與恢復缺口，不執行任何程式或連接服務。配樂名稱只用自有音效占位符，不使用 Spotify 內容。

## 平台、權限及費用界線

[Spotify 開發政策](https://developer.spotify.com/policy) III.6 限制錄音與視覺媒體同步，III.7 限制音訊混合／重疊等用途；公開程式或作者的非商業聲明不等於平台批准。原 README 的安全警告繞過指示不採用。

[播放端點官方說明](https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback) 另有 Premium 及呼叫順序限制。原型帳戶與授權狀態未核，不能承諾一般使用者能登入、安裝或使用。本例不提供連接、配額擴充或購買方案教學；單機效能數字不作普遍保證。

## 來源與去重

- [固定 README](https://github.com/Capstar1/aoe4-spotify/blob/ee5b8e94f2c47b1049d56d72cf30665e84309775/README.md)：已讀，工具歸屬與功能為作者描述。
- [v0.1](https://github.com/Capstar1/aoe4-spotify/releases/tag/v0.1)、[v0.3](https://github.com/Capstar1/aoe4-spotify/releases/tag/v0.3)、[v1.1.0](https://github.com/Capstar1/aoe4-spotify/releases/tag/v1.1.0)：已查早期測試範圍與後續修正自述。
- [replay 測試源](https://github.com/Capstar1/aoe4-spotify/blob/ee5b8e94f2c47b1049d56d72cf30665e84309775/crates/core/tests/replay.rs)、[晚到事件測試源](https://github.com/Capstar1/aoe4-spotify/blob/ee5b8e94f2c47b1049d56d72cf30665e84309775/crates/engine/tests/replay_late.rs)：只讀程式，未執行測試。
- 不同 UC-172 歌單策展及 UC-196 對局控制／紀錄歸屬；本例只計外部狀態恢復與事件反例，不以遊戲勝負判成功。
