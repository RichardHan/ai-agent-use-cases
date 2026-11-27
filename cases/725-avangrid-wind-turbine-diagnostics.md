# UC-725：Avangrid 風場技師用行動代理縮小故障範圍

- 情境：工作
- 標籤：公用事業、風力發電、故障診斷、現場維修
- 網站標題：Avangrid 風場技師用行動代理縮小故障範圍
- 一句話用途：讓風機技師在遇到故障時，以語音或文字補足資訊並取得相關原廠文件。
- 核心目標：讓風機技師在遇到故障時，以語音或文字補足資訊並取得相關原廠文件。
- 分類／標籤：公用事業營運
- 目標使用者：風場維運、知識管理及整合團隊
- 實作門檻：進階開發
- 首次收錄／最近查證：2026-11-27／2026-11-27
- 證據狀態：`official`（Avangrid 部署方自報）
- 是否獨立重現：否

## 輸入與預期輸出

使用的工具：Amazon Bedrock／Avangrid 維運知識庫。

讓風機技師在遇到故障時，以語音或文字補足資訊並取得相關原廠文件。

## 來源版本

- 原始網址：[Avangrid 部署公告](https://www.avangrid.com/w/avangrid-s-first-time-right-autopilot-transforms-field-operations-with-generative-ai)
- 來源版本：2025-03-24，英文。
- 實際方法：技師從行動裝置以語音或文字開啟診斷。First Time Right Autopilot 收集補充資訊以縮小故障範圍，由內部工程與維運知識產出指引，並可附文件或影片給技師。
- 原始來源報告的結果：Avangrid 確認在愛荷華州與紐約州兩座風場部署。一位早期採用的現場主管回報技師使用表現良好，公告未公布排障個案、處理時間或停機幅度。
- 補充來源：[Avangrid 2025 企業責任報告](https://www.avangrid.com/documents/d/avangridnew/avangrid-power-corporate-responsibility-report-2025-pdf)也記錄兩座設施已上線。[同一發布稿的 Business Wire 轉載](https://www.streetinsider.com/Business%2BWire/Avangrid%E2%80%99s%2BFirst%2BTime%2BRight%2BAutopilot%2BTransforms%2BField%2BOperations%2Bwith%2BGenerative%2BAI/24538946.html)可作為備援。

## 建議操作流程

以下為本庫依來源整理的採用建議，未實測。用歷史工單測試代理是否找對機型對應文件，請現場主管核對適用範圍。

## 可複製提示詞

以下為本庫設計的測試提示詞，未實測。

> 列出與這筆去識別故障紀錄相符的設備文件、版本與待技師確認的資訊。若文件不相符，只回報缺口。

## 所需連接、權限與限制

公開資料只支持兩座風場的部署及定性回饋。設備操作及安全程序仍由具資格人員依核准手冊決定。

## 驗收與可重現性

以下為本庫整理的採用前核對項目，未實測。用去識別歷史工單檢查所附文件是否對應設備型號和版本，並讓合格技師覆核無法判定的建議。

## 去重與版本紀錄

UC-700 是大金堺工廠設備圖譜，UC-701 是單機維修資料查詢。此案的技師、知識庫、風機與部署均屬 Avangrid 的另一個工作流程。其餘案例見[公用事業營運專題](../INDEX.md#utility-operations)。
