# UC-394：跨套件移植到Wasm，驗收雙向RPC與不相容範圍

- 網站標題：編譯成功還不夠：讓Bot把.NET依賴鏈搬到瀏覽器，驗收回傳值和主動通知
- 一句話用途：將既有JSON-RPC套件及依賴移植到受限Wasm環境，以小型端到端範例區分可用功能、相容性代價與未測範圍。
- 情境：開發
- 標籤：跨平台、依賴鏈、WebAssembly、端到端驗收、安全降級
- 工具：Grok Bot／NetWasm.Sdk 0.5.0／.NET／Nerdbank.JsonRpc／ASP.NET Core
- 證據狀態：B，作者公開Bot報告、固定版本原碼及維護者後續分類；測試結果為作者公開報告，本庫未重跑
- 首次收錄／最近查證：2026-10-20／2026-10-20（台灣時間）
- 是否獨立重現：否

## 作者實作與結果

Andrew Arnott（AArnott）於2026年9月30日公開英文移植報告。報告與固定提交均明確標示由Grok Bot代作者完成概念驗證，並非僅使用Grok模型API或一般Codex CLI。作者報告的連續工作時段為9月29日22:32至30日00:47 MDT，約2小時15分；這是牆鐘時間，不是經對照測得的節省時間。

公開產物包含五個`netwasm-poc`分支，依賴鏈涵蓋Microsoft.VisualStudio.Validation、PolyType、Nerdbank.Json、Nerdbank.MessagePack及Nerdbank.JsonRpc。固定版本的[示例README](https://github.com/AArnott/Nerdbank.JsonRpc/blob/28d9662eba9b7c7ed908f871fe90bfab734fa683/samples/NetWasmDemo/README.md)說明本機套件來源、SDK版本、建置步驟與瀏覽器部署設定。

本輪已讀同版Client、Server及共用Contract原碼：瀏覽器端透過WebSocket與ASP.NET Core伺服器交換換行分隔的JSON-RPC；客戶端呼叫加法與問候方法，伺服器每兩秒送出一次Tick通知。客戶端改用預先生成的代理與明確型別資訊，不依靠環境缺少的反射能力。這些原碼能核對設計及驗收路徑，不能替代實際執行證明。

作者報告稱headless Chrome回傳加法結果5、問候文字及第13次通知；原有.NET測試452／452、生成器測試24／24通過。這些不是Wasm測試套件通過數，亦非本庫獨立重現。

## 明確保留的失敗與未測項

- MessagePack僅編譯，沒有Wasm執行驗證；其非同步反序列化仍受報告中的編譯器問題影響。
- Wasm端未測取消、伺服器例外、非同步串流、可封送物件、批次，以及會回傳值的Wasm請求處理端；沒有Wasm單元測試運行。
- 報告列出非密碼學亂數與移除安全比較器等降級。這是有已知安全限制的PoC，不應直接部署為正式服務。
- 報告提到的截圖只有原環境檔名，本輪未取得圖片；不把它們列為已讀截圖證據。

## 維護者的交叉核對：尺寸不同不等於編譯器退步

NetWasm維護者zion-sati於9月30日[另開問題單](https://github.com/zion-sati/NetWasm/issues/57)接收報告，10月1日保留效能疑慮，但沒有確認程式碼尺寸缺陷。報告的Oz成品為30,898,453 bytes、gzip約3.70 MB，O1則為42,418,541 bytes、gzip約2.69 MB，原始尺寸與傳輸尺寸排序相反。較早約21.3 MB的成品包含不同可達依賴，不能當控制良好的前後比較。

該次分類沒有重新建置完整依賴鏈，也沒有證實全部型別生成造成膨脹的假說。因此本案不宣稱已找出尺寸根因、發布修正或全面移植成功。

## 可參考的操作步驟（自行設計，未執行）

1. 固定原套件、依賴及目標執行環境版本，先列出依賴圖與不能用的API；新目標放獨立PoC分支。
2. 依依賴順序建置套件，逐項記錄替代、刪除及語意降級，尤其不可省略安全功能的變化。
3. 建立共用契約的小範例，同時測客戶端要求的回傳值及伺服器主動通知，避免只有編譯成功。
4. 分別列出原平台回歸測試、新平台執行測試及尚未執行的功能。測試數不可跨平台混用。
5. 比較效能前固定可達依賴、最佳化設定及壓縮方式；無控制比較時保留假說。
6. 交付差異、重現步驟及限制清單，由人審核後再決定後續修復；不要將PoC直接發布為可用產品。

## 可貼指令（自行設計，未測）

只讀指定套件與相依套件的固定版本，規劃一個移到Wasm的獨立PoC。列出缺少API、型別生成及封裝相容性問題，特別標記安全降級。設計同時驗收回傳值與伺服器主動通知的小範例，區分原平台測試、新平台實測與未測項。先交付計畫與變更草稿，不安裝、不執行、不寫入遠端、不合併、不發布或部署；每一項後續執行另依授權範圍處理。

## 費用、權限與查證邊界

- 作者未公開Bot訂閱、實際運算費或授權費，不能據此宣稱免費或固定成本。
- 重現需可用的建置環境及相應套件；遠端分支寫入、發布套件與服務部署是不同權限，不由閱讀報告自動授權。
- 本輪僅閱讀公開來源，未登入、安裝、建置、執行測試、啟動服務或操作使用者電腦。
- 公開報告、提交及原碼支持實作存在與產品歸屬；測試成績仍是作者刊載的Bot報告，不是獨立驗證或正式支援承諾。

## 來源

- Andrew Arnott，英文，[Grok Bot移植報告](https://gist.github.com/AArnott/88f948a332ceea6b6e1b8ea6b3e26120)，2026-09-30公開；全文已讀，原環境截圖未取得。
- [固定提交28d9662](https://github.com/AArnott/Nerdbank.JsonRpc/commit/28d9662eba9b7c7ed908f871fe90bfab734fa683)，2026-09-30 06:47:28 UTC，提交訊息明確標示Grok Bot概念驗證。
- 同版[示例README](https://github.com/AArnott/Nerdbank.JsonRpc/blob/28d9662eba9b7c7ed908f871fe90bfab734fa683/samples/NetWasmDemo/README.md)、[Client](https://github.com/AArnott/Nerdbank.JsonRpc/blob/28d9662eba9b7c7ed908f871fe90bfab734fa683/samples/NetWasmDemo/Client/Program.cs)、[Server](https://github.com/AArnott/Nerdbank.JsonRpc/blob/28d9662eba9b7c7ed908f871fe90bfab734fa683/samples/NetWasmDemo/Server/Program.cs)、[Contract](https://github.com/AArnott/Nerdbank.JsonRpc/blob/28d9662eba9b7c7ed908f871fe90bfab734fa683/samples/NetWasmDemo/Contract/DemoContract.cs)，本輪逐檔已讀。
- zion-sati，英文，[NetWasm尺寸問題分類與限制](https://github.com/zion-sati/NetWasm/issues/57)，2026-09-30建立，10月1日補充分類；主文已讀。

與UC-366硬體燈效協定移植及讀寫探測、UC-376 Windows音訊實測失敗不同，本案的產物是跨套件依賴鏈的受限執行環境移植及雙向RPC驗收。與UC-005一般PR開發／審查不同，計數範圍限定為新執行目標的依賴相容性移植、雙向通訊實測與跨目標測試界線。五個分支、多個編譯問題與不同測試不拆成多案。
