# 2026-11-27 公用事業營運研究

基準 `f9cc6a4f`。逐案看公開原始報告並核對來源提出的結果、代理執行的步驟與限制。數字依各部署方或供應商口徑；本庫未獨立重現。每個營運流程只計一案。

## 逐案判定

### [UC-720](../cases/720-corsan-flood-water-bill-retrieval.md) Corsan 洪災後用 WhatsApp 讓居民補取水費帳單（合格）

- [主要原文](https://www.cognigy.com/en/case-study/aegea)。供應商回報在六小時內部署，代理協助取回超過 13 萬份帳單，並處理超過 54 萬次互動。
- 帳單可能含住址等個資。公開報告未交代身分核驗細節、統計期間、唯一使用者數或政府核准件數。
- 同一來源同時介紹 AEGEA 日常客服與洪災工作流。本輪僅收錄有單獨作業及結果的洪災帳單取回。

### [UC-721](../cases/721-eon-egs-whatsapp-meter-reading.md) E.ON Grid Solutions 用 WhatsApp 驗證並提交電表讀數（合格）

- [主要原文](https://www.cognigy.com/en/case-study/eon-egs)。供應商報告前九週有逾 9 萬位客戶啟動流程，另列 85% 的提交完成率及 6.5 萬人成功驗證。報告未釐清這幾項數字之間的分母與統計口徑。
- 公開報告未交代驗證方式、讀數錯誤率及例外去向。採用時需由營運方界定讀數寫入權限、資料保存與人工更正責任。
- UC-223 是住戶對帳。此案是配電業者接收並寫入客戶讀數的流程。

### [UC-722](../cases/722-helen-energy-contract-relocation.md) Helen 用搬家代理轉移電力合約（合格）

- [主要原文](https://www.cognigy.com/en/case-study/helen)。供應商公布搬家流程的客戶費力度評分（CES）為 4.7／5，未公布問卷份數、統計期間或哪些搬家申請納入。
- 公開案例未交代身分核驗、住址例外或合約資格規則。實作方須限制可改資料、由客戶確認生效日期並保留人工接手。
- UC-721 收集並回寫電表讀數。此案處理既有電力合約跨地址的狀態變更。

### [UC-723](../cases/723-pge-peggy-outage-call-routing.md) PG&E 用語音代理回覆停電進度並分流來電（合格）

- [主要原文](https://poly.ai/customers/pge)。供應商回報停電來電滿意度（CSAT）提升 22%，另在整體語音代理範圍報告 67% 的來電留在自助流程。公開報告未列停電滿意度的樣本與統計期間。
- 自助流程留存率無法判斷答覆正確率或事故是否解除。歷時與預估應顯示資料時點。錄音、轉錄與身分資料須設明確告知、權限及保存規則。
- UC-138 記錄路燈故障通報交接。此案使用電力公司既有的事故資料回覆大量停電來電。

### [UC-724](../cases/724-ignitis-regulatory-document-routing.md) Ignitis 用代理分類法規文件，再由機器人分送（合格）

- [主要原文](https://www.uipath.com/resources/automation-case-studies/ignitis-turbocharges-automation-with-agents)。供應商報告流程每月處理 1,500 份文件，分類準確率約 93%，回報每月節省法務團隊 60 小時。
- 公開報告未交代準確率樣本、標註方法、各類別錯誤或省時算法。法規適用性與合規判定仍由負責人處理。
- 同一報告提到的太陽能文件案屬既有自動化，客服郵件代理仍在測試。本輪計入已有執行及個別成果的法規分送。

### [UC-725](../cases/725-avangrid-wind-turbine-diagnostics.md) Avangrid 風場技師用行動代理縮小故障範圍（合格）

- [主要原文](https://www.avangrid.com/w/avangrid-s-first-time-right-autopilot-transforms-field-operations-with-generative-ai)。Avangrid 確認在愛荷華州與紐約州兩座風場部署。一位早期採用的現場主管回報技師使用表現良好，公告未公布排障個案、處理時間或停機幅度。
- 公開資料只支持兩座風場的部署及定性回饋。設備操作及安全程序仍由具資格人員依核准手冊決定。
- UC-700 是大金堺工廠設備圖譜，UC-701 是單機維修資料查詢。此案的技師、知識庫、風機與部署均屬 Avangrid 的另一個工作流程。

### [UC-726](../cases/726-welsh-water-orai-alarm-triage.md) Welsh Water 試點用 ORAI 彙整供水警報（待定）

- [主要原文](https://www.microsoft.com/en/customers/story/27504-welsh-water-microsoft-foundry)。公開報告稱概念驗證完成，後續仍在最低可行產品交付、運作保證與平行運行階段。繁忙日逾 1,800 則是控制室收到的警報量。事件縮短 15 至 30 分鐘與合規表現改善約 10% 均為商業評估預測。
- 公開報告未交代試點事件數、實際分流正確率、漏報或時間改善。合格判定待定。
- UC-720 處理客戶帳單取回。此案是水務控制室的警報歸併及值班判斷。

獨立審查核對了原文及既有案例名稱，並指出 UC-724 的擷取與派送由兩個機器人負責。已修正案例與索引，將代理的責任限定為分類。

## 未納入本輪

- [Bayernwerk Netz](https://www.databricks.com/customers/bayernwerk-netz) 有 60 人試點，4,000 人為計畫規模，公開來源缺少試點的可核作業結果。
- [Enline](https://www.eurelectric.org/stories/enline-agentic-ai-grid-operator-assistant/) 列出控制室概念驗證指標，現場環境、母數與比較期間待查。
- [EDF 的能源方案客服](https://www.itpro.com/business/data-and-insights/how-edf-is-making-the-most-of-its-data-with-snowflake) 的具名訪談當時仍在開發，部署結果待查。
