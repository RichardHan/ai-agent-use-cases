# UC-259：多站觀測訊號的背景與穩健性對照

- 網站標題：資料裡看見週期，先換背景、時段與測站再下結論
- 一句話用途：讓代理整理觀測資料與對照計算，保留換條件後不再穩健的結果。
- 情境：學習
- 分類：觀測資料分析
- 標籤：科研、時序、對照、驗收
- 工具：Grok Bot／Python／ObsPy／UTide
- 證據：A，作者公開分析碼、衍生資料與輸出；未獨立重跑或經領域專家驗證
- 作者／語言：Larsen Cundric／英文
- 日期：檔案包自載2026-10-11；固定提交2026-10-11 16:28:54 UTC；查證2026-10-16 UTC

## 作者做了什麼

作者選題及要求修訂，公開披露由Grok Bot取得地震觀測、撰寫並執行分析、製圖及整理稿件。保留的管線從原波形、儀器響應與品質處理，形成逐窗口頻譜特徵，再比較不同測站、背景頻帶、共同時段、訊噪條件及零假設對照。

七站是同一研究的資料來源，不拆成七案。公開快照含衍生資料、分析日誌、結果與圖稿，但未含約1.05GB原始波形或完整代理對話。整理發布時做的是封裝及可讀性檢查，不能當成重新完成分析。

## 有價值的縮限結果

輸出source_vs_site.txt中，EDA全期間的峰值頻率M2項有較低p值，但限制到與TAM共同的2022–2026時段後，該項列p=0.505。這是可讀的作者分析輸出，顯示選取時段會改變結論支持程度；本庫沒有重新計算，也不將其當作已證明無效或已確認物理機制。

作者還保留非同期潮位參照、測站噪聲相關與背景扣除影響等限制。稿件標題的因果語氣、擬投期刊格式均不代表已發表或經審查。

## 可借鑑流程

1. 固定來源、時段、測站與儀器校正版本，先列缺測與品質篩選條件。
2. 保留原特徵和轉換表，讓每張圖可追到輸入及腳本。
3. 以相同時段、替代背景、不同訊噪條件及零假設做對照。
4. 將不穩健項留下，不只挑最顯著的結果。
5. 把數值輸出、統計解釋與物理機制分層交給領域人員審閱。

## 可貼指令（本庫自設，未執行）

只讀我指定的公開或合成觀測材料、欄位定義與已存在輸出。列出測站、時段、校正、背景扣除和缺測條件；比較全期間與共同期間的同一指標，指出不一致及缺少的控制。沒有原波形或環境版本時不要標記重現。保留不支持原假設的輸出，不自行宣稱因果或發現。不要執行程式、下載大檔、訓練、啟動算力、改稿投稿或聯絡作者。交付來源—條件—輸出—待核事項清單，後續計算另行核准。

## 限制、權限與成本

原Python環境遺失且版本未記。OPEN_ITEMS只記10/11重建部分依賴後，source_vs_site.py輸出逐字相同；ObsPy與UTide未重裝。這不能擴張為全管線、原波形處理或所有統計測試已重現。

潮位依2008–2011紀錄推算至後年，非同期實測；測站非完全獨立。部分歷史圖仍標示未完整，原始資料與第三方文獻的權利仍屬來源。費用總額未公開；文件估部分分析數十分鐘及約3GB記憶體，不是實際重跑保證。

讀取材料不授權安裝依賴、下載、長時計算或投稿；需核對資料授權與資源限制。本庫僅讀公開檔案，沒有執行專案。不得用本頁做地震預測或安全判定。

## 去重與來源

不同UC012既有模型評估與稿件交接、UC200舊統計重跑，以及UC228單戶用電事件歸因。本案終點是跨測站觀測訊號的條件與背景對照，整組分析只計一次。

- [固定快照與AI歸因](https://github.com/LarsenCundric/ai-research-experiments/blob/ae85ea1a5ee2fab37fdccb07a53c0d80def91a35/papers/pulse26/README.md)
- [資料、封裝與來源界線](https://github.com/LarsenCundric/ai-research-experiments/blob/ae85ea1a5ee2fab37fdccb07a53c0d80def91a35/papers/pulse26/artifact/ZIP_README.txt)
- [管線步驟原碼，只讀未執行](https://github.com/LarsenCundric/ai-research-experiments/blob/ae85ea1a5ee2fab37fdccb07a53c0d80def91a35/papers/pulse26/artifact/run_all.sh)
- [共同時段與背景結果](https://github.com/LarsenCundric/ai-research-experiments/blob/ae85ea1a5ee2fab37fdccb07a53c0d80def91a35/papers/pulse26/artifact/source_vs_site.txt)
- [環境重建與未解項目](https://github.com/LarsenCundric/ai-research-experiments/blob/ae85ea1a5ee2fab37fdccb07a53c0d80def91a35/papers/pulse26/artifact/paper/OPEN_ITEMS.md)
