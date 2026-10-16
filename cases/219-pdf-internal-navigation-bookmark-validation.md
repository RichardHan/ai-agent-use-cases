# UC-219：樂譜冊有目錄卻不能跳頁？補內嵌導航再用閱讀器驗收

- 網站標題：把整本PDF變成能按曲目跳頁的樂譜冊
- 一句話用途：從印刷目錄建立PDF內嵌導航，並在目標閱讀器核對曲目起頁與書籤範圍。
- 情境：創作
- 標籤：PDF、音樂、導航、驗收
- 分類：文件與創作
- 工具：Meta Muse／PDF／forScore
- 證據：A＋V，原作者手機展示及公開PR；作者GitHub簡介列任職Meta。未獨立重現或逐曲核對。
- 作者／語言：Jordan Eldredge（captbaritone）／英文
- 日期：實作回報2026-09-11 14:32:32 UTC；PR於09-14合併，作者同日15:02:53 UTC追加發布版可用回報
- 查證日期：2026-10-16 UTC

## 問題與作者實作

OpenBook樂譜已有印刷目錄，但閱讀器不能直接按曲目跳頁。Jordan請Muse嘗試把目錄嵌入PDF，回報已在手機測試，並展示從目錄匯入forScore書籤。後續PR將同一目錄解析器接入發布建置；合併後作者再表示網站取得的PDF可用。

前置獨立CSV是另一作者使用Claude Code的工作，不歸Muse。PR提出者明說尚未review代理產生的程式，因此其中「155曲目、169頁、測試通過、內容未變」是代理報告，並非本庫逐項證明。三張原圖支持目錄列表、匯入步驟及含跨頁區間的書籤展示；後續QuickTime影片未觀看。

## 流程與驗收重點

1. 保留原PDF，辨認印刷目錄、印刷頁碼與實體PDF頁索引的差異。
2. 將既有目錄解析結果變成內嵌導航；固定版本腳本以起頁減一對應PDF索引。
3. 於目標閱讀器實際跳到曲目，再檢查匯入書籤的起訖範圍。
4. 把轉換接入建置後，重新取得發布檔測試，避免只驗本地中間檔。

公開測試使用六頁空白樣本與三個假目錄項，不能覆蓋真實全冊。forScore官方說明：目錄只有起頁，匯入書籤時以下一項起頁前一頁推定終點；URL與遠端檔案動作不轉成書籤。封面偏移、最後一項及不連續編頁需另查。

## 可貼指令（本庫自行設計，未執行）

> 請只用我提供的合成多篇PDF及人工頁碼表，規劃內嵌導航驗收。逐項列印刷頁碼、PDF實體頁索引、預期書籤範圍，標出封面偏移、空頁、跨頁、重複名稱及最後一項的疑義。先輸出對照表和人工閱讀器測試清單，不安裝、不覆蓋檔、不發布。任何無法從資料核實的頁碼請留空；不要把生成成功當跳頁正確。

## 權限、費用與限制

只處理有權修改的文件；原樂譜或完整內容不收錄到本庫。實際檔案改寫、程式安裝與發布須另有授權。Muse與forScore可用性依帳號、裝置及方案，來源未提供本次成本，不能承諾免費或跨閱讀器一致。未核節時、演出使用或全曲目正確率。

此案的終點是單一PDF的內嵌導航與閱讀器範圍驗收；不同UC114列印排版、UC178掃描圖文重建及UC180相片描述資料。CSV、嵌入、匯入和發布讀回合計一案。

## 原始與官方來源

- [原作者實作留言](https://github.com/veltzer/book-openbook/issues/121#issuecomment-5636016343)；[匯入補充](https://github.com/veltzer/book-openbook/issues/121#issuecomment-5636061267)
- [PR122及限制說明](https://github.com/veltzer/book-openbook/pull/122)；[發布版測試回報](https://github.com/veltzer/book-openbook/pull/122#issuecomment-5666060442)
- 固定版本df79b441b1a2aa400788958422fa87c0093c9b9d：[嵌入腳本](https://github.com/veltzer/book-openbook/blob/df79b441b1a2aa400788958422fa87c0093c9b9d/scripts/embed_pdf_bookmarks.py)、[合成測試](https://github.com/veltzer/book-openbook/blob/df79b441b1a2aa400788958422fa87c0093c9b9d/tests/test_embed_pdf_bookmarks.py)
- [forScore官方PDF中繼資料說明](https://forscore.co/developers-pdf-metadata/)

## 查閱範圍與缺口

已讀公開issue、PR、腳本及測試，查閱三張作者原圖和官方說明；未執行程式、下載完整樂譜或觀看QuickTime影片。作者的產品關係與未review聲明均保留。
