# UC-165：離線網路設定對照指定基準，逐行留證並覆核誤報

- 網站標題：安全稽核只回大方向？要求指出哪一行、哪一條規則
- 一句話用途：作者以合成Cisco設定實跑Grok Bot，指定基準文件後結果更可追溯，但仍有誤報；沒有連真設備或改設定。
- 情境：開發
- 標籤：離線稽核、設定、證據、誤報
- 工具：Grok Bot／合成Cisco設定／作者取得的CIS文件
- 證據狀態：B級作者對照測試自述；完整輸入、發現表與準確率未公開。
- 查證日期：2026-10-17（台灣時間）

## 原作者實際測試

Luis Adrian Martinez Vergara於2026-09-05 19:42:18 UTC發表英文原文。他先與另一模型準備合成Cisco拓撲及設定，由協調Bot派給稽核Bot。未指定基準時結果泛泛；提供文件並限定引用後，輸出能對上設定行、控制項及文件，但仍把正常項標成問題。

原文沒有基準版次、profile、完整誤報例或準確率；不能補猜現版或宣稱CIS認證。後述其他專家Bot仍是計畫，不計完成，兩Bot合計一流程。

## 可借用的只讀驗收（自設、未測）

1. 只用合成設定和自行編寫的測試規則，另列規則版本與適用條件。
2. 每項發現必附輸入行、規則編號、判斷理由及缺資料。
3. 人工覆核已知正常／異常樣本，記錄誤報與漏報，不只看發現數。
4. 無法判定保留待核；不要直接轉成真設備修正指令。

## 可貼指令（自設、未測）

只讀這份合成設定及我自行編寫的規則表。逐條列適用性、證據行、符合／不符／無法判定及理由。無對應規則不得補泛用建議；保留可能誤報，等待人覆核。不要連線設備、改設定或產生可直接部署的修正命令。

## 權限、費用與限制

作者取得文件的具體授權未核。CIS公開頁說免費PDF有限定用途，profile亦有適用差異；部分檢查需人工，文件可讀不等於可轉貼或上傳任意服務。本庫不收錄基準全文，練習使用自造規則。代理費用、文件權限與商業使用須另核；本案不能替代正式安全稽核。

## 來源

- [Luis Adrian Martinez Vergara原帖](https://www.linkedin.com/posts/adrian-mtz-luis_networkengineering-grokbot-aiagents-activity-7502088742267006976-Z5Ts)：英文全文及日期已讀；沒有原始設定或完整報表。
- [CIS Benchmarks FAQ](https://www.cisecurity.org/cis-benchmarks/cis-benchmarks-faq)：profile與測試環境提醒。
- [CIS文件取得說明](https://resources.cisecurity.org/benchmarks)；[評估範圍與人工檢查](https://www.cisecurity.org/cis-securesuite/pricing-and-categories/product-vendor/cis-benchmark-assessment)。
- 本次未執行掃描或讀私人設定。與UC-012科研來源稽核不同：輸入為設備設定，輸出為指定控制項適用性與逐行證據。
