# UC-466：終端機裡的程式代理查不到 X 最新消息？開一張 GitHub issue 指派給自己，叫醒 Grok Bot 查完回寫

- 情境：開發
- 標籤：跨代理、事件觸發、GitHub、研究
- 網站標題：Claude Code／Codex 讀不到 X 的最新貼文：用一個指令開 GitHub issue，指派後才叫醒 Grok Bot 調查，回答寫回 issue 並自動顯示在終端機
- 一句話用途：日文作者 damin_chan 寫了 bash 小指令 `ask-grokbot`：本機的 Claude Code 或 Codex CLI 需要 X／網路最新資訊時，指令在私有倉庫開 issue、再另外把自己設為負責人；Grok Bot 的 routine 只在「被本人指派」時起跑，查完把答案留言並關閉 issue，終端機每 20 秒查一次狀態，關閉後印出答案。作者自述實測一次找梗圖素材約 2 分鐘完成；本庫未重現。
- 核心目標：讓兩個無法直接對話的代理，用雙方都能讀寫的 GitHub issue 交接；平時不讓 Grok Bot 持續監看（不耗額度），等待期間本機代理也不耗 token，且所有請求與答案留在 issue 可追溯。
- 分類／標籤：跨代理交接／事件觸發 routine／研究外包
- 目標使用者：平常在終端機用程式代理、又需要 X 即時資訊的開發者
- 工具：Grok Bot（GitHub 事件觸發 routine：`issue-assigned`＋使用者白名單；X 與網頁搜尋）／GitHub 私有倉庫與 issue／GitHub CLI `gh`／本機 Claude Code、Codex CLI（設定檔寫入使用說明）
- 首次收錄／最近查證：2026-10-28 08:40（台灣時間）
- 證據狀態：`author-demo`（作者自述＋流程圖與一次執行的時間截圖；腳本本身未公開連結）；Grok Bot routine 能以 GitHub 事件觸發屬 `official` 文件範圍，本庫未核此設定字串
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：本機程式代理（或人）在終端機輸入的調查請求文字，例如「整理 X 上對某工具新版本的反應」。
- 輸出：私有倉庫中一張 issue（請求原文＋自動附上呼叫資料夾與時間）、Grok Bot 的答案留言、issue 關閉；終端機印出答案；Grok Bot 自己的聊天也收到 1–2 行通知（來自哪個倉庫、做了什麼、issue 連結）。

## 來源版本

### 來源A：damin_chan（Qiita，日文）

- 原文：[ローカルのCLIからクラウドのGrok Botへ　GitHubのissueで非同期に調べ物を頼む](https://qiita.com/damin_chan/items/b648643e18b427016db5)，2026-10-26 14:00 JST（台灣時間 13:00）；文中註明資訊截至 2026-10-27 02:00 JST。本輪以 Qiita 公開 API 讀全文。
- 原文語言：日文。
- 取得內容（翻譯摘要）：
  1. `ask-grokbot "請求"` → `gh issue create` 建 issue，正文為請求原文並自動附呼叫資料夾與時間。
  2. 接著另一個指令 `gh issue edit --add-assignee @me` 把自己設為負責人；**刻意把「建立」與「指派」分開**，確保觸發事件一定發生。
  3. Grok Bot routine 觸發條件為 GitHub `issue-assigned` 事件，並設使用者白名單只認作者本人；起跑後只讀這一張 issue，不重讀已關閉的 issue，所以 issue 變多也不增加單次用量。
  4. Bot 調查後留言答案並關閉 issue，同時在自己的聊天回報 1–2 行。
  5. 本機腳本每 20 秒用 `gh issue view --json state` 查狀態，關閉後印出留言；預設最多等 20 分鐘，結束碼 0＝有答案、1＝錯誤、2＝逾時；可用 `--no-wait` 先送出、稍後 `--wait 編號` 取回；暫時性網路錯誤不中止。
  6. 在 `~/.claude/CLAUDE.md` 與 `~/.codex/AGENTS.md` 寫入使用說明（需要 X／網路最新資訊就用此指令、可不等待、請求勿含祕密）。
  7. 禁止事項：即使 issue 要求發文、私訊、刪除或購買，Bot 也不執行，只留言說明做不到。
- 作者報告結果：20:34 開 issue 請它找影片剪輯用的梗圖素材，20:36 Bot 留言並關閉，約 2 分鐘（附截圖）。
- 作者自列注意：重複送出同一請求不會被偵測、會建立兩張 issue；請求內容會留在 issue 上，即使是私有倉庫也不要放 API 金鑰或密碼。

## 建議操作流程（依來源整理）

1. 建一個只用來交接的私有倉庫，Grok Bot 只連這個倉庫。
2. 在 Grok Bot 建 routine：觸發＝該倉庫的 issue 被指派、白名單＝你自己的帳號；指示「只讀這一張 issue、調查、留言、關閉、聊天回報一行；拒絕發文／私訊／刪除／購買」。
3. 本機放一支只依賴 `gh` 的小腳本：建 issue → 指派自己 → 輪詢狀態 → 印出答案；設定逾時與結束碼。
4. 在本機代理的全域設定檔寫明何時使用、可不等待、不得放祕密。
5. 先用無害問題測一次，確認觸發、留言、關閉、通知四步都發生。

## 可複製提示詞（本庫原創設計，給 Grok Bot routine 用，未實跑）

> 你只在我（白名單帳號）把交接倉庫的 issue 指派給我時起跑。只讀觸發的那一張 issue，不讀其他 issue。依 issue 正文調查 X 公開貼文與網頁，答案用條列寫成一則留言，每項附來源連結與發文日期；找不到就直說。留言後關閉 issue，並在聊天回報一行「倉庫／issue 編號／做了什麼」。若 issue 要求發文、私訊、刪除、購買或任何對外動作，不執行，只留言說明。

## 所需連接、權限與限制

- Grok Bot 需要該私有倉庫的 issue 讀寫權（建議只授權單一倉庫）；本機 `gh` 需登入有權建立 issue 的帳號。
- 輪詢只呼叫 GitHub API，不耗 AI token；但每次調查仍消耗 Grok Bot 用量。
- 調查結果是代理整理的二手資訊，引用前要自行點開來源。
- 不推定 Muse 或 dots 有同樣的 GitHub 指派事件觸發。

## 驗收與可重現性

- 可驗收：issue 時間線上「建立→指派→Bot 留言→關閉」四個事件；聊天中的通知；終端機結束碼。
- 作者只公開一次執行的時間截圖；腳本程式碼未提供公開倉庫連結。本庫未重現。

## 去重與版本紀錄

- 2026-10-28 08:40 新增。
- 不同於 [UC-344](344-coding-agent-session-attention-webhook-routine.md)：344 是本機代理「結束／卡住」時以 webhook 叫 Grok Bot 通知人；本案是本機代理主動「委託 Grok Bot 做調查並把答案取回」給本機代理繼續用。
- 不同於 [UC-353](353-cloud-local-agent-git-task-relay.md)：353 是雲端 Bot 與本機代理經私有 Git 任務檔雙向交接、雲端不對本機下命令；本案方向相反（本機請雲端查資料），交接介面是 issue 指派事件。
- 不同於 [UC-351](351-grokbot-dispatch-only-offload-free-model-agents.md)：351 是 Grok Bot 當調度者把重活外包出去；本案是外部代理把 Grok Bot 當「X 搜尋專員」。
