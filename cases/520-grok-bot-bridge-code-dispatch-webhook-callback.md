# UC-520：Grok Bot 沒有對外 API？用一個「轉接 Bot」把程式送來的工作交給指定 Bot，再把答案回傳給程式

- 情境：開發
- 標籤：webhook、多代理、派工、MCP
- 網站標題：想從 Claude Code、Codex 或自己的程式叫 Grok Bot 做事並拿回答案？用 webhook Routine＋一個轉接 Bot＋回呼網址補上缺少的 API
- 一句話用途：開發者 @Roxas_Root（ramarivera）開源 Grok Bot Bridge：在 Executor 部署一個小 App，對外提供 `dispatch(目標Bot, 提示詞)` 與 `result(runId)` 兩個 MCP 工具；App 打「Bridge」轉接 Bot 的 webhook Routine，Bridge 把提示詞原封不動轉給指定的隊友 Bot，收到回覆後在新的一輪把答案 POST 回 App 的回呼網址，程式再用 runId 讀回。作者自述約 45 秒一輪、四個並行請求沒有混線；本庫未安裝、未重現。
- 核心目標：Grok Bot 官方只提供「POST 到 Routine 的 webhook、回 200 代表開始跑」，拿不到答案、也不能列出 Bot；這個做法補上「送出→等待→讀回結果」的閉環。
- 分類／標籤：程式呼叫 Bot／webhook 回呼／多 Bot 路由
- 目標使用者：已有多個 Grok Bot 隊友、想讓本機或雲端的寫程式代理（Claude Code、Codex 或任何 MCP 客戶端）把研究或查核工作派給 Bot 的開發者
- 實作門檻：進階開發
- 工具：Grok Bot（webhook Routine、多 Bot 團隊、雲端電腦檔案）／Executor（App、帳號金鑰保管、回呼 webhook、SQLite、MCP）／Claude Code、Codex 等 MCP 客戶端
- 首次收錄／最近查證：2026-11-12 08:55（台灣時間）
- 證據狀態：`author-demo`（作者 X 貼文＋公開倉庫 README 內的實測紀錄表與示範影片；本庫只讀 README、未看影片、未部署）；README 自述依賴官方文件未承諾的 Grok Bot 行為
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：一個 Executor（自架或雲端）；Grok Bot 中新增的「Bridge」轉接 Bot 與它自己的 webhook Routine（POST 網址與金鑰）；要送給某個隊友 Bot 的完整提示詞。
- 輸出：`dispatch` 立刻回一個 runId；Bot 回覆後，`result(runId)` 回傳 `done` 與隊友 Bot 回答的原文；另有 `teammates`（快取的 Bot 名冊）、`runs`（最近幾次）、`status`（設定健康檢查）。狀態分為 sending／pending／done／error／timed_out／failed。

## 來源版本

### 來源A：@Roxas_Root（ramarivera），X＋GitHub（英文）

- 原始網址：[X 貼文](https://x.com/Roxas_Root/status/2120540273667166250)，2026-11-11 15:32 UTC（台灣時間 23:32），附示範影片（本庫未看）；[GitHub 倉庫 ramarivera/grok-bot-bridge](https://github.com/ramarivera/grok-bot-bridge)（README 於 2026-11-12 讀取）；[Executor 公開上架頁](https://executor.sh/apps/onyxio-universe/grok-bot-bridge)；作者分享的 [Bridge Bot 範本](https://x.ai/bot/gw3MZ95iQeCdCR7nR8rSp)。
- 原文語言：英文。
- 取得內容（翻譯改寫，不轉錄程式碼）：
  1. 為什麼要做：Grok Bot 唯一能從程式呼叫的是 Routine 的 webhook——帶金鑰 POST，回 200 只代表開始跑；答案不會出現在 HTTP 回應裡，也沒有 API 讀 Bot 對話、列出 Bot 或事後查某次執行；而且一個 webhook 只屬於一個 Bot 的一個 Routine，十個 Bot 就要十個 webhook。
  2. 架構：在 Executor 部署 App（金鑰存在 Executor 帳號區，不放進提示詞、倉庫或聊天；Executor 給 App 一個公開回呼網址與 SQLite 資料庫，並以 MCP 對外提供工具）。Grok Bot 端只多一個 Bridge 轉接 Bot。
  3. 設定五步：部署 App→用範本或貼提示詞新增 Bridge Bot→在 Bridge 自己的對話貼第二段提示詞、填入回呼網址，讓它替自己建 Routine（作者說 Bot 只能替自己建 Routine，這步要本人做）→到桌面版把 Routine 的 POST 網址與金鑰貼進 Executor→呼叫 `refreshTeammates` 再用 `result` 讀回，看到 `done` 就代表整圈通了。
  4. 一次派工的流程：App 存下這次執行並產生單次有效的 token→回 runId→打 Bridge 的 Routine webhook→Bridge 先把回呼網址與 token 存進雲端電腦上的檔案→把提示詞原封不動交給隊友 Bot→（作者觀察：Bot 一傳訊息給其他 Bot，這次 Routine 執行就結束）→隊友回覆把 Bridge 在新的一輪叫醒→Bridge 讀檔、帶 token POST 答案回 App、刪檔→App 驗 token 後存結果。
  5. 使用限制：提示詞原文送達、Bot 不能反問，所以要寫成自足的一段；可同時送出多個 `dispatch`，以 runId 對應答案。
- 作者報告結果：貼文說約 45 秒拿回 JSON。README 附 2026-11-11 的並行測試：四個請求約隔 7–8 秒連續送出（三個給 Researcher、一個給 Scourer），各自要求只回一組指定代碼，四個都以 `done` 回到正確的 runId，耗時 56–71 秒，沒有答案錯置。
- 作者自己標的風險：能呼叫 `dispatch` 的人，就能用那些 Bot 的全部權限（郵件、行事曆、倉庫）做事——只裝在自己控制的 Executor；README 也寫這依賴官方文件未承諾的行為，2026-11-10 能用、隨時可能失效，若官方推出正式 API 應改用官方。
- 缺口：本庫未部署、未看影片；45 秒為作者自述；回呼的單次有效的 token 與逾時設定細節只讀 README 摘要。

## 建議操作流程（依來源整理；本庫未實測）

1. 先決定哪些 Bot 可以被程式叫到：權限大的（能寄信、能動倉庫）先不要放進名冊。
2. 依 README 部署 App、新增 Bridge Bot、由本人在 Bridge 對話中建立它的 Routine，把 POST 網址與金鑰只貼進 Executor 的帳號區。
3. 用「只回指定代碼」這種可以機器比對的提示詞做冒煙測試，確認 runId、狀態與答案一一對應，再試並行。
4. 正式使用時，每個提示詞寫清楚目標、輸出格式與「不要寄信、不要付款、不要刪檔」等禁止事項；程式端以 `result` 輪詢到 done／error／timed_out 為止，不無限等待。
5. 定期看 `status`：回呼是否還註冊、名冊多久沒更新；官方行為一變就停用。

## 可複製提示詞（本庫依來源改寫，未實跑）

> 給隊友 Bot 的派工提示詞範本：「這是一則由程式送來的工作，你不能向我追問，請只依這段內容完成。目標：〈一句話〉。可使用的資料：〈清單〉。輸出：只回 JSON，欄位為 summary、sources（網址陣列）、confidence（low/medium/high）。禁止：寄信、發文、付款、刪除或修改任何檔案。若資料不足，在 summary 寫明缺什麼，不要猜。」

## 所需連接、權限與限制

- 需要 Executor 帳號（自架或雲端）與可建立 Routine 的 Grok Bot；webhook 金鑰等同遙控 Bot 的鑰匙，只放在 Executor 的密鑰區，不寫進提示詞、倉庫、聊天或公開頁面。
- 能呼叫 `dispatch` 的任何代理或人，都能借用被轉接 Bot 的連接權限：只開放給自己控制的 MCP 客戶端，名冊只放唯讀、低風險的 Bot。
- 依賴非官方承諾的行為（Routine 在傳訊後結束、回覆會喚醒轉接 Bot），隨時可能失效；每次執行仍會消耗 Grok Bot 用量。
- 不推定 Meta Muse 或 ChatGPT dots 有相同的 webhook Routine 或可用相同方式轉接。

## 驗收與可重現性

- 可驗收：同時送出三到四個「只回指定代碼」的請求，檢查每個 runId 是否拿回自己的代碼、沒有錯置；故意送給不存在的 Bot 名稱或關掉回呼，確認狀態變成 error／timed_out 而不是一直 pending。
- 本庫未重現；README 的並行測試表為作者自測。

## 去重與版本紀錄

- 2026-11-12 08:55 新增。[UC-515](515-grok-bot-imessage-keyword-shortcut-webhook-routine.md) 是 iPhone 捷徑單向 POST webhook 叫 Routine 開工，沒有把答案送回；[UC-351](351-grokbot-dispatch-only-offload-free-model-agents.md) 與 [UC-353](353-cloud-local-agent-git-task-relay.md) 是 Grok Bot 把工作派給外部代理（方向相反）；[UC-061](061-dispatcher-bot-typed-commands-ledger.md) 是 Bot 團隊內的調度 Bot。本案是「外部程式→Grok Bot 隊友→答案回到程式」的雙向轉接，另立案。
