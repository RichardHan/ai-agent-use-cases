# UC-675：Muse 只當調度員：手機下單後經自製 JSON 橋接把工作派到家裡三台機器的 Claude Code／Codex，做的和驗的分開

- 情境：開發
- 標籤：多代理、自家伺服器、驗收、排程
- 網站標題：從手機或 LINE 交代開發工作，Muse 依各台負載挑機器派工、每 30 分鐘查進度，三個條件都過才算完成
- 一句話用途：日文作者 marvelousu 在 Zenn 自述，讓 Meta Muse 只負責「投入、監看、回報」：從 iOS App 或 LINE 交代工作後，Muse 經 SSH 進開發用 Linux、交一個 JSON 給自製的 bridge，再由 Mac mini 上的 gate 檢查格式後交給 T3 Code，在指定主機開 thread 跑 Claude Code 或 Codex（各自獨立 worktree）；實作與驗證由不同的代理執行，完成要同時滿足「bridge 回報結束」「結果標示已驗證」「Muse 親自確認成果物」三條；Muse 每 30 分鐘查一次工作清單，90 分鐘沒動靜就催。主機依當下負載與空閒記憶體挑選，需要 GPU 的交給 Colab、Kaggle 或 RunPod。
- 核心目標：用手機就能指揮家裡多台機器上的程式代理，且不讓「做的人自己說做完」直接算完成。
- 分類／標籤：個人代理調度／跨主機派工／分離驗證
- 目標使用者：家中有多台開發機、已在用 Claude Code／Codex 的個人開發者
- 實作門檻：進階開發
- 工具：Meta Muse（雲端 VM、記憶、排程）／T3 Code／Claude Code／Codex／OpenCode／Antigravity CLI／LINE／Colab／Kaggle Notebooks／RunPod（作者描述；bridge 為作者自製、未公開原碼）
- 首次收錄／最近查證：2026-11-22 09:10（台灣時間）
- 證據狀態：`author-demo`（作者 Zenn 長文自述，含 JSON 範例、operation 清單與主機表；bridge 與 gate 原碼未公開）
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：從 iOS App 或 LINE 傳給 Muse 的開發需求；三台主機（Windows／開發用 Linux／Mac mini）的當下負載與空閒記憶體。
- 輸出：拆成數個 job 的 JSON（jobId、host、agent、model、effort、prompt）；各主機獨立 worktree 的變更；驗證代理的審查結果；Muse 的完成回報（手機推播或 LINE）。

## 來源版本

### 來源A：marvelousu／Zenn（日文）

- 原始網址：[Muse と T3 Code で管理する、3台の自宅サーバで Claude / Codex を動かすオーケストレーション構成](https://zenn.dev/marvelousu/articles/muse-orchestration)，2026-11-22 09:43 JST（台灣時間 08:43）；原文語言：日文。本庫經 Zenn 公開 API 讀全文。
- 取得內容（翻譯摘要）：
  1. 路徑：Muse 的 VM 連不到 Mac mini，故 SSH 進開發用 Linux、把一個 JSON 交給 muse-mac-bridge，再送到 Mac mini 的 gate 檢查格式後交 T3 Code，在 JSON 指定的主機開 thread。
  2. bridge 有 7 種 operation：list、status、result、followup、pending、approve、start（start 才會花模型費用）。規則：jobId 不重用（失敗的 start 也會占用 ID，重送加 -b、-c）；followup 只寫 ASCII 英文（日文會 request_invalid）；大需求拆成短 start＋followup；result 只回最後約 2,000 字，所以長結果用 followup 要求只報需要的部分；start 一律指定 model。
  3. 監看：Muse 把派出的 job 登錄在 VM 清單，30 分鐘排程查狀態，完成就回報，90 分鐘沒動靜就催。job 的確認與提問都由 Muse 代答，不等本人。
  4. 驗證分離：做與驗用不同 harness（例如 Claude Code 實作＋建置、Codex 驗證審查）；完成三條件缺一不可；給審查方的委託文字只指成果物、不列「可疑點清單」，因作者覺得會讓審查方偏向否定；「沒有重大問題」也是合法結論。
  5. 主機選擇不固定：看派工當下負載與空閒記憶體；Linux 只有 8GB，單一 job 壓在 4GB 以下；Mac mini 跑 Minecraft 伺服器，重建置會讓玩家斷線，只給輕工作與 Xcode。
  6. LINE 備援路徑：Linux 上 Docker 收訊進佇列，Muse 端 hook 每 5 秒看佇列回覆、每 30 秒執行工作清單；回覆只依收到的原文、不從對話紀錄推測（以前常把單字換掉）。
  7. 記憶分兩處：Muse VM 的記憶與每日紀錄；本機代理共用的私有 Git 倉庫（以 hook 與 systemd timer 同步）。叫 Muse「從記憶找」時兩邊都搜。
- 作者報告結果：自己的工作幾乎只剩從手機下單與讀回報；三台主機可一起用、不必記得哪台在跑什麼。作者稱以前用 dots 做類似架構時雲端與本機連線常出錯，Muse 較好用（作者主觀比較）。
- 缺口：bridge、gate 原碼未公開；Muse 代答 job 的確認提問有誤判風險，作者未描述出錯案例；無成功率或成本數字。

## 建議操作流程（依來源整理並由本庫補成步驟；未實測）

1. 先定一個最小的派工介面（例如只收 start／status／result 三種 JSON），由一台可被個人代理 SSH 進入的中繼機接收並驗格式。
2. 每個 job 都指定主機、代理、模型與獨立 worktree；jobId 不重用。
3. 讓個人代理只做派工、定時查狀態與回報；設定「多久沒進度就催」。
4. 實作與驗證交給不同代理；完成條件寫成清單（流程結束＋驗證通過＋調度方自己打開成果物看過）。
5. 派工前看各主機負載與空閒記憶體，重工作避開跑著其他服務的機器。

## 可複製提示詞（本庫原創，未實跑；改寫自來源流程）

> 你只負責派工、監看和回報，不要自己改程式。收到需求後拆成幾個 job，每個 job 指定主機、代理、模型和獨立分支，實作與驗證必須由不同代理做。每 30 分鐘查一次所有 job 的狀態；90 分鐘沒進度就追問該 job。只有在「流程已結束」「驗證結果標示通過」「你親自打開成果物確認過」三項都成立時才回報完成，缺一項就照實寫出卡在哪裡。合併到 main、刪除檔案和花錢的動作一律先問我。

## 所需連接、權限與限制

- 個人代理持有 SSH 進家中機器的權限，應用專用帳號與最小權限，並把高風險動作（合併、刪除、對外發布）留給本人。
- 讓個人代理代答程式代理的確認提問會加快進度，但也可能核准不該核准的動作；採用前先限定可代答的範圍。
- 不推定 Grok Bot 或 ChatGPT dots 有相同的 VM 與連線方式；作者對 dots 的評價為個人經驗。

## 驗收與可重現性

- 可驗收：每個 job 有主機、代理、模型與 worktree 紀錄；完成回報都附三條件的證據；驗證代理與實作代理不同。
- 本庫未重現。

## 去重與版本紀錄

- 2026-11-22 09:10 新增。UC-351 是 Grok Bot 調度雲端電腦上的 OpenCode 等免費模型；UC-588 是 Muse 在 ISUCON 經 SSH 收日誌並派工給 Antigravity；UC-478 是 Muse 經 codex app-server 借用 Computer Use。本案是 Muse 經自製 JSON bridge 派工到家中多台主機、依負載選機、做與驗分離的三條件完成判定，另立案並互相參照。
