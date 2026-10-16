# UC-251：公開軌道事件快照的來源與數值差異核對

- 網站標題：模擬資料換成真實快照後，數字仍對不上？把差異留下來查
- 一句話用途：作者用Grok Bot取得軌道資料並協調替換原型中的合成資料，公開快照與測試仍保留來源和計算差異。
- 情境：學習
- 標籤：科研、資料來源、快照、驗收
- 工具：Grok Bot／Cursor／CelesTrak
- 證據狀態：A，公開資料與測試原碼及作者紀錄；未獨立重跑或驗證物理結果
- 查證日期：2026-10-16

## 原作者實作與成果

Arunima Vasudev的Orbit Watch是黑客松原型。整理式planning log記錄：初版因取資料逾時使用部分合成欄位；Grok Bot後來取得11個物件的GP資料及SwissCube事件表，交Cursor代理替換。Bot負責研究和協調，不能把Cursor程式或成品使用的普通Grok API全歸Bot。

固定版本快照有23列：21列SwissCube標reported，另2列ISS為secondary-example，dilutionKm仍為null並列syntheticFields，DSE由單一來源值複製到兩個物件。因此不沿用作者「全部資料皆真實」的概括。

作者列本地傳播0.691公里與來源0.621公里；測試原碼確實保留兩值。epoch差異是作者解釋，未證實根因，測試存在不等於本庫已跑或物理正確。預設歷史快照與示範時鐘也不能當持續即時監控。排除19／保留2是作者規則輸出，不能當成功排除真實危險。

## 可參考步驟（本庫設計，未執行）

1. 使用離線歷史快照及來源清單，固定版本和資料時間。
2. 逐列分開reported、secondary、synthetic與缺值，保留原始欄位。
3. 按物件ID、epoch、TCA和單位對照同一事件；不把下載時間當元素時間。
4. 並列來源值、本地值、差異及待核原因，保留被排除項目的理由。
5. 將缺協方差、來源不一致或未知欄位留給專業覆核，不由低分推定安全。

## 可貼指令（自行設計，未測）

請僅比對我提供的兩份離線歷史資料及manifest，輸出來源、物件ID、epoch、TCA、單位、缺值、合成欄位與數值差異表。不得補值或將差異自行判為已解；把作者解釋與已核事實分列。不得做避碰、機動、營運安全或即時警報決策，不連接設備、不部署服務。

## 權限、費用與可用性

- 作者方案、API總費用及目前配額未核；讀公開產物不代表任意帳戶都有相同功能。
- [CelesTrak欄位文件](https://celestrak.org/SOCRATES/socrates-format.php)將DSE定義為元素epoch至TCA的天數；MAX_PROB有模型假設，dilution區可能需更好資料。這些欄位不能單獨認證安全。
- 作者紀錄含資料取得替代路徑；本庫不建議降低傳輸安全或繞過限制，只讀已公開的版本化資料。
- 此為科研原型的證據核對，不能用於真實衛星操作。沒有執行程式、呼叫付費API、操作設備或啟用服務。

## 作者、日期與直接來源

- Arunima Vasudev（ArunimaV）／英文／Devpost及GitHub。[原作者報告](https://devpost.com/software/orbit-watch-lwqitd)，頁面日期2026-10-04 10:45 EDT。
- 固定commit 911d4d8bcae4c7e617ce234af6c11fe314d346ed，時間2026-10-04 14:15:48 UTC。
- [研究與替換紀錄](https://github.com/ArunimaV/orbit-watch/blob/911d4d8bcae4c7e617ce234af6c11fe314d346ed/docs/planning-log.md)
- [實際快照與來源欄位](https://github.com/ArunimaV/orbit-watch/blob/911d4d8bcae4c7e617ce234af6c11fe314d346ed/data/fixtures/socrates-sample.json)
- [GP資料目錄](https://github.com/ArunimaV/orbit-watch/tree/911d4d8bcae4c7e617ce234af6c11fe314d346ed/data/fixtures/gp)
- [差異測試原碼](https://github.com/ArunimaV/orbit-watch/blob/911d4d8bcae4c7e617ce234af6c11fe314d346ed/lib/encounter.test.ts)
- 查閱範圍：已讀作者文章、整理式紀錄、快照與測試；無原始完整Bot對話、獨立傳播重算或營運驗收。

## 去重

不同UC210觀測條件選目標、UC169已知解求解器驗收與UC200舊分析重跑；本案只計接近事件快照來源替換及同事件數值差異核對。語音、看板、代理派工及事件數不另計。
