# UC-521：讓 Muse 與 Grok Bot 安全地讀家裡的 Home Assistant：Tailscale 只開 8123、只出不進、非管理員權杖，再比較兩者怎麼用

- 情境：生活
- 標籤：居家、Home Assistant、權限邊界、比較
- 網站標題：想讓雲端 AI 助理看家裡的感測器與電力，又怕家裡網路被當跳板？三層限制接上 Home Assistant，再比較 Muse 與 Grok Bot 適合做哪一段
- 一句話用途：日文部落客 pineroom（@roompine，部落格「シニアオタク」）自述：先和 Muse 討論連線方式，在家中 Mac mini 虛擬機的 Home Assistant OS 安裝 Tailscale 附加元件，讓 Muse 的雲端電腦加入同一個 tailnet，以 ACL 只放行 HA 的 8123 埠、拒絕反向連入、改用無管理員權限的長期權杖呼叫 HA REST API，最後測到 523 個實體；再把原本經 Mac mini 存取 HA 的 Grok Bot 也加上官方 Tailscale 連接，對照兩者的分工。作者自述，本庫未重現。
- 核心目標：讓雲端代理能查家裡的感測器、電力與自動化，同時把它能碰到的範圍限縮在 HA 的 API，不開路由器埠、不讓代理的電腦變成通往家中其他設備的跳板。
- 分類／標籤：智慧家庭連線／最小權限／雙代理比較
- 目標使用者：家裡已有 Home Assistant、想讓 Muse 或 Grok Bot 查狀態但在意資安的人
- 實作門檻：工具串接
- 工具：Meta Muse（雲端電腦、提出連線方案）／Grok Bot（經本機 Mac mini 與官方 Tailscale 連接存取 HA、Routine、webhook）／Home Assistant OS（Tailscale 附加元件、REST API、長期存取權杖）／Tailscale（ACL）
- 首次收錄／最近查證：2026-11-12 08:55（台灣時間）
- 證據狀態：`author-demo`（作者部落格逐段貼出與兩個助理的對話與連線測試輸出；本庫未看 YouTube 影片）；Grok Bot 支援 Tailscale 一事作者經 Grok Bot 回答轉述官方 changelog，本庫未另核官方原文
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：家中 Mac mini 上以虛擬機執行的 Home Assistant OS；Tailscale 帳號；Muse 與 Grok Bot。
- 輸出：Muse 的雲端電腦以裝置名「muse」加入 tailnet，經 `http://（HA 的 Tailscale 位址）:8123` 呼叫 HA API（作者貼出的測試：API 回應正常、HA Core 2026.11.1、306 個元件、523 個實體，其中感測器 257、開關 43、二元感測器 37、自動化 30）；一張 Grok Bot（經 Mac mini）與 Muse（經 Tailscale）可做與不可做事項的對照表；作者的使用分工結論。

## 來源版本

### 來源A：pineroom（@roompine），部落格＋X（日文）

- 原始網址：[部落格〈MuseとGrok Botとの比較（HOME Assistantとの連携編）〉](https://roompine.com/muse-vs-grok-bot-home-assistant-integration-1/)（2026-11-11 發布、11-12 補影片連結）；[X 摘要貼文](https://x.com/roompine/status/2120534761064267905)，2026-11-11 15:10 UTC（台灣時間 23:10）；[YouTube 影片](https://youtu.be/_HT1S6jmWDA)（本庫未看）。
- 原文語言：日文。
- 取得內容（翻譯摘要）：
  1. 作者原本已讓 Grok Bot 透過家中另一台 Mac mini 讀 HA；開始用 Muse 免費方案後，想比較兩者。先問 Muse「能否連 HA」：Muse 說它的電腦在雲端、到不了家中網路，建議用 Tailscale（不需開路由器埠），也可用 Nabu Casa 遠端存取；並說明目前只能經 HomeKit 橋接看到部分設備。
  2. 作者追問資安，Muse 用表格列出 Tailscale 的優缺點與方案限制，並提出三層限制：①ACL 只允許「muse」裝置連 HA 的 8123 埠；②只出不進，不讓 Muse 的電腦被反向連入、成為跳板；③在 HA 另建一個無管理員權限的使用者發長期存取權杖。Muse 也說明自己不會擅自申請付費方案。
  3. 權限範圍：只開 API（8123）時，可讀狀態、操作設備、以項目為單位編輯自動化，但改不了 configuration.yaml；要改設定檔需另開 SSH 或檔案分享，權限更大。若要改設定，Muse 提的順序是先給作者看差異→用 HA 的設定檢查驗語法→先備份再套用。新建自動化則先用「只通知」的動作測試，再擴大到操作設備。
  4. 作者把另外問 ChatGPT 得到的「Tailscale 附加元件／Tailscale 整合」區分貼給 Muse，請它查證該用哪一個；Muse 確認區分正確：附加元件讓 HA 加入 tailnet（外部連進 HA 用），整合只是把 tailnet 裡裝置的上下線做成感測器；確認 VM 是 HA OS 後，由作者在附加元件商店安裝並點認證連結，Muse 回報連線與 API 測試結果。
  5. 接著問 Grok Bot 是否也能用 Tailscale：Grok Bot 查後說是官方功能，並提醒 HA 本身要在 tailnet 內、Bot 的瀏覽器可能打不開 100.x 位址，比較時應以 API 為準；作者把 Tailscale 加到 Grok Bot。Grok Bot 整理的對照表重點：Grok Bot 現行經 Mac mini 走家中網路、預設唯讀、操作設備要作者核准，HA 發出的 webhook 可觸發它的 Routine；Mac mini 離線時就到不了 HA。Muse 看了表後更正：它的連線一開始就只限 8123，碰不到 Mac mini 的檔案。
  6. 作者結論：一般「現在狀態如何」的查詢走 tailnet 就夠，範圍只到 HA；要結合 Mac mini 上的檔案（例如把 HA 資料寫進 Obsidian）或大量讀歷史資料時，經 Mac mini 較快。作者覺得 Muse 會主動提很多建議，任務交太多會被不想試的提議打擾；兩者都接上 iOS 提醒事項後，Muse 看了提醒事項主動提出兩項建議。
- 作者報告結果：Muse 端 API 連線測試成功並列出實體數；Grok Bot 端加上 Tailscale 後的實測結果在影片與後續篇，本庫未核。
- 缺口：ACL 規則原文、權杖權限設定畫面未公開；「約快 100 倍」為助理在對話中的說法，非作者量測。

## 建議操作流程（依來源整理；本庫未實測）

1. 先只開讀取：在 HA 建一個非管理員使用者，發長期權杖給代理；不給 SSH、不給設定檔分享。
2. HA OS 裝 Tailscale 附加元件；代理的電腦加入同一 tailnet 後，用 ACL 只允許該裝置連 HA 的 8123 埠，其餘全拒。
3. 請代理先呼叫一次 API 回報版本與實體數量，確認連到的是正確的 HA。
4. 要建自動化時，先請代理用文字提案、只做「通知」動作，你確認後再加入開關設備。
5. 若同時有兩個代理，寫下分工：哪一個只查狀態、哪一個可以在你核准後操作設備或處理本機檔案。

## 可複製提示詞（本庫依來源改寫，未實跑）

> 我想讓你讀我家 Home Assistant 的狀態，但只能碰 HA 的 API。請先列出你建議的連線方式與每一層限制（網路範圍、連入方向、權杖權限），標出哪些步驟要我本人操作或核准。連上後只做一件事：回報 HA 版本與各類實體數量。之後任何設備操作、自動化變更或設定檔修改，都先給我看內容，等我說可以才做；任何要付費的方案都不要自己申請。

## 所需連接、權限與限制

- 需要 Tailscale 帳號與 HA 管理權限（由本人操作）；權杖等同家中設備遙控器，只交給代理、不貼進聊天紀錄或公開頁面。
- 家中感測器（門窗開關、在家與否、電力）屬隱私資料：不要讓代理把它寫進公開摘要；操作門鎖、電源等設備前一律要本人核准。
- Mac mini 或 HA 虛擬機離線時代理就到不了；Tailscale 方案限制以官方頁面為準。
- 作者驗證的是 Muse 與 Grok Bot；不推定 ChatGPT dots 有相同的 tailnet 連接方式。

## 驗收與可重現性

- 可驗收：從代理的電腦試連 HA 以外的家中設備或 22 埠，應被 ACL 擋下；用代理的權杖嘗試管理員操作，應被拒絕。
- 本庫未重現。

## 去重與版本紀錄

- 2026-11-12 08:55 新增。[UC-402](402-home-server-bot-least-privilege-ssh-daily-car-home-report.md) 是 Grok Bot 以最小權限 SSH 經 Tailscale 連家用伺服器出每日車況報告；[UC-411](411-carplay-shortcut-location-to-bot-home-assistant-on-demand-update.md) 是經 HA 取位置；[UC-489](489-muse-cloud-vm-vs-home-dmz-vm-site-reachability-list.md) 比較 Muse 雲端電腦與家中 DMZ 虛擬機能連到哪些網站。本案聚焦「雲端代理連 HA 的三層限制設計」加上 Muse 與 Grok Bot 的連線路徑對照，另立案。
