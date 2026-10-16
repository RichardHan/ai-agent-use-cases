# UC-169：公開懸臂梁樣本的數值驗收與失敗紀錄

- 網站標題：程式正常結束，結果卻全是零？先驗證載重真的進去了
- 一句話用途：用已知解析答案的簡單梁樣本，核對求解器輸入、單位、網格收斂與輸出。
- 情境：開發
- 標籤：數值模擬、基準、單位、失敗
- 工具：Meta Muse／作者指定OpenCourant與轉換器；後續Claude Code修訂
- 證據狀態：A，作者公開對話及版本化紀錄；未重跑、未認證物理安全
- 查證日期：2026-10-16

## 作者實作與結果

Spectrcyde公開的Muse對話記錄，以簡單懸臂梁解析解對照三種網格。多輪人工覆核發現固定欄寬、載重、符號與輸出問題；正常結束的運行仍可能全零。修正後有位移及收斂殘差，但當時反力門檻未過，總判定保留NOT_VERIFIED。

對話梁段結尾是2026-10-05 21:47，時區未明；頁面標題月份及發布日期不能取代事件日期。後續公開儲存庫10月12日紀錄另發現材料欄寬讓泊松比讀成零。更正族及舊族分開保存。PR149標示Claude Code參與，不能把後續全部修正歸功Muse。

後續紀錄雖列部分準則通過，動態取樣規則曾看過資料後修訂；獨立前瞻驗證未建立，整體端到端求解器仍未驗證。這是一個有失敗和修正史的數值樣本，不是結構設計安全證明。

## 可參考的操作步驟（自行設計，未執行）

1. 只選公開、無實體設備用途的小型數值基準。事前記錄解析假設、單位、邊界、門檻及求解器版本。
2. 對照輸入檔與求解器實際讀回的材料／載重；不能只看檔案文字或正常退出碼。
3. 比較多級網格殘差、反力與單位；無輸出、全零或未執行測試不當通過。
4. 對每次修正建立新版本。看過結果後修改的準則標為事後修訂，不回寫原結論。
5. 將缺少原始資料、轉換器來源及未測項列入驗收包。另由有資格的人決定能否用於任何工程目的。

## 可貼指令（自行設計，未測）

只讀這份公開數值基準文件，不安裝或執行求解器、不操作設備。整理解析假設、模型單位、實際輸入讀回、輸出欄位含義、各網格誤差及原驗收門檻。分清未跑、執行失敗、條件未達及在限定條件通過。對資料後修訂的門檻保留前後版本；缺原始檔就列缺口。不要宣稱真實結構安全或全求解器已驗證。

## 官方限制與查證邊界

- Altair官方規定固定欄位及實數／整數欄寬，實際採用值須看Starter輸出；不只檢查輸入是否看起來合理。
- 材料參數及模型單位須一致。官方將REAC通道列為反力；作者特定版本／轉換器的衝量解讀不能泛化為所有產品。
- 完整原始CSV、歷史執行環境與轉換器原碼未全部取得；本庫未重跑、未核每筆數值，也不涉及該專案其他用途。
- 代理、運算和軟體授權成本未核；公開檔案不等於授權啟用服務或部署。實體工程必須另有專業驗證。

## 來源

- Spectrcyde／bgilbert1984，英文，[原Muse對話](https://spectrcyde.com/?page_id=61)，相關梁段已讀，發布日未核、事件時區未明。
- [公開NOTES](https://github.com/bgilbert1984/SCYTHE/blob/main/mechanics/openradioss/decks/cantilever_eb/NOTES.md)及[解析參考](https://github.com/bgilbert1984/SCYTHE/blob/main/mechanics/openradioss/decks/cantilever_eb/analytical_reference.json)已讀；部分狀態屬歷史記錄。
- [2026-10-12更正族結果](https://github.com/bgilbert1984/SCYTHE/blob/main/mechanics/openradioss/decks/cantilever_eb/results_matfmt20_2026-10-12.md)，全文已讀；[PR149](https://github.com/bgilbert1984/SCYTHE/pull/149)的Claude Code歸屬保留。
- Altair，[固定欄位語法](https://help.altair.com/hwsolvers/rad/topics/solvers/rad/starter_keyword_syntax_r.htm)、[線彈性材料](https://help.altair.com/hwsolvers/rad/topics/solvers/rad/mat_law1_elast_starter_r.htm)、[節點輸出](https://help.altair.com/hwsolvers/rad/topics/solvers/rad/th_node_starter_r.htm)，英文官方文件已查。

與UC-120新材料幾何／樣件及UC-064數學證明不同，本案是已知解的求解器輸入輸出驗收；三網格、靜動態、修正族不分拆多案。
