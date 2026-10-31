# UC-478：Muse 能 SSH 進閒置的 Mac 卻點不了那台的瀏覽器：經 `codex app-server` 直接呼叫 Codex 的 Computer Use 工具，不經 Codex 模型、不耗 Codex 額度

- 情境：開發
- 標籤：跨代理、瀏覽器自動化、MCP、用量
- 網站標題：Muse 或 Claude Code 想操作 Mac 上的 App？日文作者用 Codex 的試驗性 app-server 直接叫用它的 Computer Use，自己的代理決定點哪裡
- 一句話用途：日文作者 tatsuya582 同時用 Claude Code、Meta Muse、DeepSeek Harness 與 Codex。Muse 只能操作自己 VM 內的瀏覽器，作者交給 Muse 以 SSH 使用的 Mac 上的瀏覽器它點不到，以前只能請那台 Mac 的 Codex 代操作。作者讓 Muse 自己調查後，改用 `codex app-server`（標示 experimental）的 JSON-RPC：`thread/start` 開執行緒（不送模型請求），再用 `mcpServer/tool/call` 呼叫 Computer Use 的 `cua_repl`/`js` 工具，讀畫面元素清單、由呼叫方代理選按鈕再點擊；作者比對前後 Codex 使用率與點數未變。同法也能取 Meetings 會議紀錄同步到專案倉庫、重新發布 Sites 舊版本；Slides 編輯失敗。作者自述＋程式與截圖，本庫未重現。
- 核心目標：讓手上的主力代理直接使用另一個代理的特定工具，而不是把任務轉包給對方模型、只傳過去一部分對話。
- 分類／標籤：跨代理工具共用／電腦操作／額度管理
- 目標使用者：同時使用多個代理與 Codex、會寫小腳本的開發者
- 工具：Codex CLI 0.164.0（`codex app-server`）／ChatGPT 桌面版 26.1023.50603／macOS／Meta Muse（經 SSH）／Claude Code／DeepSeek Harness
- 首次收錄／最近查證：2026-10-31 08:55（台灣時間）
- 證據狀態：`author-demo`（作者 Qiita 自述＋Python 範例＋計算機操作截圖；Muse 部分僅文字自述）
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：裝有 Codex 與已授權 Computer Use 的 Mac；呼叫方代理（Muse 經 SSH、Claude Code 或腳本）。
- 輸出：呼叫方代理讀到的畫面元素清單與實際點擊結果；選用時取得 Meetings 紀錄、Sites 重新發布等工具結果。

## 來源版本

### 來源A：tatsuya582（Qiita，日文）

- 原文：[Codex のいいところだけを、Claude Code や Muse から使う](https://qiita.com/tatsuya582/items/4d79021c9f78f4015992)，2026-10-30 12:58 JST（台灣時間 11:58）；本輪讀全文。
- 取得內容（翻譯摘要）：
  1. `codex app-server` 以標準輸入輸出收發 JSON-RPC；`mcpServer/tool/call` 可呼叫 Codex 內部以 MCP 伺服器形式運作的外掛工具，需先 `thread/start` 取得執行緒 ID；作者稱全程未呼叫模型，前後使用率與點數不變。
  2. 範例：Python 腳本叫用 `cua_repl` 的 `js`，用 `getAXState()` 取得帶編號與 ID 的畫面元素，在計算機按「3×4=」（附截圖）；第一次呼叫會回傳 API 說明，所以先空打一次。
  3. Claude Code 經此方式自己讀元素清單、選出要按的編號，算出 1+1=2；判斷由 Claude Code 做，Codex 只負責回傳清單與點擊。
  4. Muse：作者把閒置 Mac 交給 Muse 以 SSH 使用；請 Muse 調查直接操作的方法，結論即上述做法，作者稱已能從 Muse 操作那台 Mac 的瀏覽器。
  5. `mcpServerStatus/list` 列出 430 多個工具（Meetings、Sites、Slides、Gmail、Slack、GitHub 等連接器）；Meetings `find_all`/`fetch` 成功，作者用來定期把會議紀錄同步到各專案倉庫；Sites 重新發布舊版本成功；Slides 只能建空白簡報，編輯回 `artifact_preparation_failed`（從 Codex 本身呼叫也同錯）。
  6. 補記：Computer Use 的 MCP 伺服器也可不經 app-server 直接啟動，但用戶端須支援 elicitation（表單式詢問）；Muse 端作者加了小型中繼程式代為申報支援並回應許可詢問。
- 作者提醒：app-server 與 `cua_repl` 是試驗性／內部元件，更新後可能失效；等於把操作電腦的權限交給其他 AI，對已許可的 App 都能操作。
- 缺口：Muse 端腳本與中繼程式未公開；「不耗額度」只是作者比對畫面數字，非官方保證；是否符合各產品條款本庫未查證。

## 建議操作流程（依來源整理；本庫未實測）

1. 先在 Codex 端只許可必要的 App；用一支只做單一動作的腳本驗證（例如計算機）。
2. 呼叫方代理只拿「讀元素清單＋點擊」兩個動作，付款、送出、刪除前停下交本人。
3. 每次呼叫前後記錄 Codex 使用率與點數，自己確認是否真的不耗額度。
4. Codex 更新後先重跑驗證腳本再交回日常使用。

## 可複製提示詞（本庫原創設計，未實跑）

> 你可以透過我提供的腳本，在我的 Mac 上讀某個 App 的畫面元素清單並點擊指定編號。這次只操作「＿＿」這個 App，目標是＿＿。每次點擊前先說明要點的元素與原因；遇到登入、付款、送出、刪除或權限詢問就停下來問我。完成後回報：實際點了哪些元素、最後畫面清單的關鍵內容、是否有任何失敗。不要嘗試呼叫清單以外的工具。

## 所需連接、權限與限制

- Mac 須授予 Codex 輔助使用／螢幕權限；呼叫方取得的是「操作那台電腦」的能力，應限制可操作 App 並保留人工確認點。
- SSH 進 Mac 本身也要限金鑰與帳號權限；不要讓雲端代理持有可登入其他主機的私鑰以外的祕密。
- 試驗性介面隨版本可能變動或被移除；不要假設 Grok Bot、dots 或 Muse 原生具備此能力，這是作者自組的跨工具接法。

## 驗收與可重現性

- 可驗收：計算機等無害 App 的點擊結果正確；呼叫前後 Codex 使用率與點數比對；未許可的 App 無法操作。
- 本庫未重現。

## 去重與版本紀錄

- 2026-10-31 08:55 新增。UC-466 是本機程式代理經 GitHub issue 請 Grok Bot 查 X（任務轉交）；UC-451 是多代理共用技能；UC-467 是 Muse 在自己的雲端電腦以畫面操作；本案是「呼叫方代理直接借用另一代理的電腦操作工具、不轉交任務」，另立案。
