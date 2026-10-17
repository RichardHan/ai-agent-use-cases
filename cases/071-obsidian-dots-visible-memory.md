# UC-071：把 dots 記不住、也改不了的記憶，改放進本機 Obsidian

- 情境：工作
- 標籤：筆記、本機執行、備份、排程
- 網站標題：dots 的記憶看不見？用 Obsidian 當「看得見的外接腦」
- 一句話用途：官方目前無法逐筆檢視或刪改 Dot 自己的記憶；作者改用本機 Obsidian Markdown，讓 Dot 經「連到你的電腦」讀寫 `_dots` 資料夾，外出也能用手機請它整理會議與草稿。
- 核心目標：把代理要長期記得的規則、偏好與工作日誌，放到使用者可讀、可改、可備份的本機筆記，而不是只存在不可逐筆編輯的 Dot 內建記憶。
- 工具：ChatGPT dots／ChatGPT 桌面版（本機連接）／Obsidian；作者亦提及 Slack。跨供應商版本：Grok Bot（協調 8 個 Bot）／Meta Muse／ChatGPT dots／Hermes 共用同一個 Obsidian vault
- 目標使用者：已用 ChatGPT Pro／Business Premium 的 dots，並願意讓 Dot 存取本機指定資料夾的人
- 首次收錄／最近查證：2026-10-15／2026-10-17（台灣時間）
- 證據狀態：`author-demo`（作者教學串）＋ `official`（OpenAI Dots 隱私 FAQ 已讀）；本庫未重現
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：本機 Obsidian vault、允許 Dot 存取的電腦、`_dots` 資料夾內的 profile／rules／log。
- 輸出：會議摘要寫入客戶筆記、晨間日曆／郵件整理進每日筆記、從素材夾產出貼文草稿；重要決定與偏好寫回本機 Markdown，供之後任務再讀。

## 來源版本

### S-071A：ChatGPT dots × Obsidian — 看得見的外接腦（作者教學）

- 作者：@MakeAI_CEO（mana｜株式会社MakeAI CEO）；日文；串文起始 2026-10-15 18:37（台灣時間，貼文時間 2026-10-15T10:37:33Z）
- 主帖：https://x.com/MakeAI_CEO/status/2110681479449841874
- 續帖（同串）：記憶限制說明、為何用 Obsidian、三步驟設定、三個活用例  
  https://x.com/MakeAI_CEO/status/2110681482662658476  
  https://x.com/MakeAI_CEO/status/2110681485774561761  
  https://x.com/MakeAI_CEO/status/2110681489679794216  
  https://x.com/MakeAI_CEO/status/2110681492288680045  
  https://x.com/MakeAI_CEO/status/2110681494729683069
- 作者另引用長文標題〈Obsidian × dots完全活用ガイド〉（https://x.com/MakeAI_CEO/status/2110593793364029721，約 2026-10-15 12:49 台灣時間）；本庫未能讀取 X Article 全文，僅依公開串文整理。
- 作者自述要點（翻譯改寫）：
  1. Dot 內建記憶目前無法逐筆查看、刪除或修改；要清掉只能重置整個 Dot（連對話、記憶、定期任務一併消失）。斷開 App 連線也不會刪掉已學到的內容。
  2. 因此把「要記得的東西」寫進本機 Obsidian：全是 Markdown，換 AI 工具後筆記仍是自己的資產。
  3. 設定：ChatGPT 桌面版 → Dot 個人檔 → Computers → Your computer → Allow access（預設關閉；與 Codex 已連線是分開設定）。在 vault 建 `_dots`，放 `profile.md`、`rules.md`、`log.md`。先告訴 Dot：開工前必讀 `_dots`，決定與學到的寫進 `log.md`；重要任務每次再提醒一次更穩。
  4. 活用例：①外出用手機 ChatGPT／Slack 請它把會議內容整理進客戶筆記；②連日曆與郵件後，請排程每天早上寫每日筆記；③從素材夾產貼文草稿到草稿夾，人修正後偏好逐漸累積。
- 證據標記：`author-demo`。本庫未看到作者實際 vault、連線畫面或排程執行紀錄。

### S-071B：OpenAI — Dots 記憶與重置（官方）

- 來源：[Dots privacy, security, and safety FAQs](https://help.openai.com/en/articles/20001529-dots-privacy-security-and-safety-faqs)；英文；本庫 2026-10-15 讀取（頁面顯示約 7 日前更新）。
- 官方說明（`official`）：目前無法檢視、刪除或直接修改個別 Dot 記憶（含外掛帶入的細節）；刪除 Dot 的 context 需刪除／重置該 Dot。斷開已連結服務只停止新存取，不刪除已進入 context 的資訊。重置會刪除 Dot、其對話、已存記憶與排程任務；Dot 建立的檔案、Codex thread、ChatGPT 對話另存，不會因刪 Dot 而自動刪除。
- 另見 [Getting started with your dot](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot) 對 Reset 的說明。
- 注意：官方確認的是記憶邊界，不是 Obsidian 整合教學；本機連接與資料夾寫入仍依帳號與產品當前介面為準。

### S-071C：Uzi（@uzairansar）— 多家代理共用同一個 Obsidian vault 當記憶（`author-demo`）

- 來源：[X 貼文（含 1 張對話截圖）](https://x.com/uzairansar/status/2111264782821060726)，英文，2026-10-17 01:15 UTC（台灣 2026-10-17 09:15）。
- 作者說法（改寫）：把各個 Bot 的記憶搬進 Obsidian vault，換代理時不用從頭教。他會試用 Grok Bot、Meta Muse、ChatGPT dots、Hermes，不想每個都重講一次專案與偏好；記憶、紀錄與工作流程都放在同一個 vault，是自己擁有、可讀可改的純文字檔。每個 Bot 都被指示回答前先讀相關檔案、把新資訊存回去；健康 Bot 更新健康資料夾、各專案 Bot 更新自己的資料夾，用帶日期的紀錄保留歷史；試新代理時只要指向同一個 vault、給同樣的指示，就能接上其他 Bot 存下的脈絡。作者把這當成避免被單一代理供應商的記憶綁住的方法。
- 截圖內容（本庫已看，部分打碼）：作者在 Grok Bot 要求所有 Bot 以 iCloud 上的 Obsidian vault 當主要記憶庫；Grok Bot 訊息顯示「Messaged 8 Bots」，回覆已在 vault 頂層加 `AGENTS.md` 定規則：每個 Bot 回答前先讀 vault、同一回合把持久事實寫進自己的資料夾、以附加方式寫帶日期的紀錄不覆蓋歷史、不存密碼與帳號號碼；並建了依用途分的資料夾。
- 未證實：Muse、dots、Hermes 實際如何存取這個 iCloud 路徑（作者未說明各產品的連接方式）；多個 Bot 同時寫入是否衝突；新代理「接上脈絡」的效果。本庫不推定各產品都能直接讀寫 iCloud 資料夾。
- 與 S-071A 的差異：S-071A 是單一 dot 用 `_dots` 資料夾補內建記憶看不見的問題；S-071C 把同一做法擴成多個供應商、多個 Bot 共用，並用 `AGENTS.md` 統一讀寫規則。核心仍是「代理記憶放在使用者可讀可改的 Markdown」，故併入本頁。

## 建議操作流程（本庫設計，未實測）

1. 先只開一個測試資料夾給 Dot，不要一次授權整個家目錄或含憑證的路徑。
2. 在 `_dots` 寫清楚：目標、口吻、禁止事項、判斷標準；敏感健康／財務／家人資訊預設不要寫進 Dot 內建記憶。
3. 每個重要任務開頭要求「先讀 `_dots`，結果寫回 log」；任務結束後人抽查 log 是否寫對。
4. 外出指令預設「只草稿、不寄出、不發布」；回傳可在手機打開的確認連結或檔案路徑。
5. 定期備份 vault；不要把 Dot 重置當成一般「清一條記憶」的手段。

## 可複製提示詞（本庫原創設計，未執行）

請在開始前只讀我指定的 `_dots/profile.md`、`_dots/rules.md` 與最近的 `_dots/log.md`。把今天這次任務的決定、偏好與待辦，用 Markdown 追加到 `_dots/log.md`，不要寫進你無法讓我逐筆刪改的內建記憶。輸出只放我指定的筆記路徑。預設做到草稿為止：不寄信、不發文、不改日曆、不刪檔。若需要本機以外的新權限，先列出來等我核准。

## 所需連接、權限與限制

- 需要 ChatGPT 桌面版「連到你的電腦」與 Obsidian vault 路徑授權；這是高敏感權限，應最小化範圍。
- dots 方案與本機連接可用性以官方為準；作者提到 Pro／Business Premium，不保證所有地區與方案相同。
- 筆記可能含客戶或私人資料；研究案例不構成對外分享或跨裝置同步授權。
- 與 UC-042（dots 憑證／單 agent 限制）可並讀：本案聚焦**記憶可見性與本機筆記**，不是憑證交付或改回多 Bot。

## 驗收與可重現性

- 人能在 Obsidian 直接打開並改正 `_dots` 內容；錯誤記憶可改一行，不必重置整個 Dot。
- 外出任務預設停在草稿；抽查沒有未核准的寄信或發布。
- 本庫未重現；官方 FAQ 僅核對記憶限制，未核對 Obsidian 工作流。

## 去重與版本紀錄

- 與 UC-046（每日精選進 Obsidian）不同：那是 X 精選輸出到筆記；本案是**用本機筆記補 Dot 不可逐筆編輯的記憶**。
- 與 UC-067（重建手冊）、UC-009（背景移轉模板）相關但目的不同，不合併。
- 2026-10-17：併入 S-071C（@uzairansar 跨供應商共用 vault＋`AGENTS.md` 規則），不另立案例。
- 2026-10-15：新增。同日有其他日文使用者轉推旅行中用 Obsidian×dots 的文章，因未能讀取原文全文，暫不另列來源。
