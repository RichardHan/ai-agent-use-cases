# UC-499：ChatGPT 不夠 Persistent？用 Notion 任務板把 Muse 當子代理：沙盒外的 VM／Facebook／Home Assistant 整案交給它長期擁有

- 情境：工作
- 標籤：多代理、Notion、排程、每日
- 網站標題：ChatGPT 與 Muse 共用一張 Notion 任務板：自動交接、狀態追蹤與完成回呼，沙盒做不到的事整案委派給 Muse
- 一句話用途：Reddit 作者 u/new-photo-guy 自述用 Notion 把 ChatGPT（文中稱 Sol）與 Muse 接成共享「agent task board」：自動任務交接、狀態追蹤、定期對帳與完成回呼，一天對幾次收件匣／看板。ChatGPT 被指示凡需 Facebook、VM 或其他沙盒外能力的工作就路由給 Muse；例如 Muse 用持久 token 與 Tailscale 成功設定基本 Home Assistant 自動化。Grok 只做 X／Twitter 的 OSINT 摘要。作者自述，本庫未重現。
- 核心目標：讓「會分析／整合」的 ChatGPT 與「有持久 VM／瀏覽器」的 Muse 分工，用同一張看板交接，而不是互相取代。
- 分類／標籤：跨產品代理協作／任務看板／持久產物
- 目標使用者：同時使用 ChatGPT 與 Muse、需要長任務與家用自動化的人
- 工具：ChatGPT／Meta Muse／Notion（任務板與自動化）／Home Assistant／Tailscale；作者另規劃 Hermes＋Qwen 做網路／新聞／收件匣看守
- 首次收錄／最近查證：2026-11-06 08:51（台灣時間）
- 證據狀態：`author-demo`（Reddit 作者自述；無看板截圖或自動化設定）
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：Notion 上的共享任務卡（狀態、負責人、回呼欄位）；需離開 ChatGPT 沙盒的任務描述；Home Assistant 持久 token（作者自述已用）。
- 輸出：雙方定期對齊的看板狀態；Muse 長期擁有的完成項（例如 HA 自動化）；ChatGPT 側只保留分析與整合結果。

## 來源版本

### 來源A：u/new-photo-guy／Reddit r/MetaAI（英文）

- 原始網址：[Muse as a ChatGPT Peer/Subagent](https://www.reddit.com/r/MetaAI/comments/1wmtxtk/muse_as_a_chatgpt_peersubagent/)，搜尋索引標示 2026-09-22 00:06 UTC；同文亦見 r/ChatGPT。本庫 2026-11-06 讀公開正文。原文語言：英文。
- 取得內容（翻譯摘要）：
  1. 用 Notion 連 ChatGPT 與 Muse，建 Sol／Muse 共享 agent task board。
  2. 加上自動交接、狀態追蹤、定期檢查與完成回呼，減少本人盯場。
  3. 雙方各有少量自動化，一天對幾次 inbox／board。
  4. ChatGPT 路由規則：凡需 Facebook、VM 或沙盒外能力 → Muse；例：Muse 用 persistent token＋Tailscale 設基本 Home Assistant 自動化與設定。
  5. 曾想用 Muse 取代 ChatGPT，但覺不如 Codex 進階、也缺熟悉的整合；改採「整案委派、長期擁有」的子代理模式。作者認為一般 ChatGPT 缺 persistent artifacts（Work mode 除外），Codex 吃用量，Muse 補這個缺口。
  6. 第三個代理是 Grok，只做 X 上專家動態的 OSINT 摘要。下一步想用 Hermes 掛 Qwen 做常駐網路／新聞／收件匣看守，必要時再升級到 Muse 或 ChatGPT 以省付費 token。
- 作者報告結果：自述 Muse 已成功設 HA；未提供看板欄位設計、失敗交接或用量數字。留言提醒免費方案可能用於訓練、建議加 heartbeat 檢查 Notion webhook／金鑰（他人建議，非作者實測）。

## 建議操作流程（依來源整理）

1. 在 Notion 建一張雙方都連得到的任務表：狀態、負責人（ChatGPT／Muse）、完成回呼欄。
2. 寫清路由規則：沙盒內分析／寫作留 ChatGPT；需 VM、特定網站登入、家用自動化交 Muse。
3. 排程一天對帳數次，只同步狀態，不要兩端同時改同一卡未定義欄位。
4. 對外動作（發信、改 HA、付款）保留本人核准；token 用最小權限並可撤銷。

## 可複製提示詞（本庫原創，未實跑）

> 你是看板協調端。每［N］小時讀 Notion「Agent Tasks」中狀態為 Ready／In progress／Blocked 的卡。若任務需要 Facebook、雲端 VM、Home Assistant 或你沙盒外的瀏覽器登入，把卡指派給 Muse、寫一句交接摘要與完成定義，並在回呼欄留下你要的回報格式；不要自己嘗試那些環境。Muse 完成後只更新狀態與產物連結，不要改其他代理的記憶。金錢、對外發信、刪除與權限變更一律先問我。

## 所需連接、權限與限制

- Notion 連線、Muse／ChatGPT 自動化、HA token、Tailscale 皆屬高權限；作者未公開金鑰管理細節。
- 免費 Muse 訓練／日誌政策請自行核對；敏感家用資料慎連。
- 不推定 Instinct 或 Grok Bot 可直接套用同一 Notion 自動化。

## 驗收與可重現性

- 可驗收：連續一週沙盒外任務都出現在 Muse 欄且有完成回呼；ChatGPT 未擅自操作 HA；對帳時間戳可查。
- 本庫未重現。

## 去重與版本紀錄

- 2026-11-06 08:51 新增。UC-071／UC-280／UC-350 亦用 Notion 交接，但本案重點是「ChatGPT 路由＋Muse 長期擁有沙盒外整案＋HA／Tailscale 實例」，另立案。
