# UC-451：一份 Skills 原本放 GitHub，用唯讀 MCP 讓 Grok Bot、dots、ChatGPT、Claude 都能叫用

- 情境：開發
- 標籤：技能、MCP、跨代理、用量
- 網站標題：自己的 AI 工作手冊只維護一份：放 GitHub，再讓各家 AI 透過同一個唯讀入口讀取
- 一句話用途：把自己寫的 154 份 Skills 原本留在私有 GitHub，於 Cloudflare Workers 免費方案架一個只能搜尋／讀取的 MCP，再把同一網址登記到 Grok Bot、dots、ChatGPT、Claude；改原本後各 AI 數分鐘內讀到新版。
- 核心目標：避免同一套作業手冊在多個 AI 各存一份、改一次要複製五次；同時把「只要讀 Skills 就能完成」的單次工作移到不吃 Codex 額度的一般聊天，重度多檔工作才交 Codex。
- 分類／標籤：開發、技能管理、MCP、跨代理、用量分配
- 工具：Grok Bot／ChatGPT dots／ChatGPT／Claude／Codex／Cloudflare Workers／GitHub
- 目標使用者：同時用兩個以上 AI 助手、已累積自己的 Skills 或提示詞集的人
- 首次收錄／最近查證：2026-10-25 09:00（Asia/Taipei）
- 證據狀態：author-demo（作者自述實測，含呼叫次數與耗時量測）；作者另販售建置套件，本庫未取得、未採用付費內容
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：私有 GitHub 上的 Skills 資料夾（每份含 SKILL.md 與附件）、Cloudflare 免費帳號、GitHub OAuth App 與唯讀權杖。
- 輸出：一個公開網址的唯讀 MCP（5 個功能：列出、日文搜尋、讀本文、讀附件等，不能改檔或執行腳本）、各 AI 的連接設定、用同一請求在不同 AI 的比對結果。

## 來源版本

### 來源A：テツメモ（@tetumemo）

- 工具：Grok Bot、ChatGPT dots、ChatGPT、Claude、Codex
- 作者：テツメモ｜tetumemo（[X @tetumemo](https://x.com/tetumemo/status/2114107168937177462)）
- 原始網址：[電子報公開部分](https://tetumemo.m-newsletter.com/posts/grok-bot-dots-chatgpt-claude-skills-management)；X 摘要貼 2026-10-24 21:30 UTC（台灣時間 10-25 05:30）
- 發布日期：電子報 2026-10-22；相關 X 實測貼 2026-09-19、10-11、10-12
- 原文語言：日文
- 取得內容：公開部分全文已讀（付費區的建置套件與各 AI 登記步驟未讀）；未看影片。
- 作者報告流程與結果（改寫）：
  1. 原本放在 Google Drive 的 master-skills 資料夾，另請 AI 推送到私有 GitHub 保留版本歷史（非自動同步）。
  2. 在 Cloudflare Workers 架「接待」MCP：唯讀，只提供搜尋與取文字；要通過 GitHub 本人驗證才可連；每 5 分鐘檢查原本變化。
  3. 同一網址登記到 ChatGPT、dots、Claude、Grok Bot。作者 10-01 起 20 天約 5.8 萬次呼叫（每日約 2,900 次），免費上限每日 10 萬次，超過只會當日停止、不自動收費。
  4. 用同一請求比較：X 貼文（三家選了不同模板；dots 主動把未確認的「數分鐘同步」改成不斷言）、縮圖（dots 一次跑完 3 張；ChatGPT 需另起訊息才生圖；Claude 只出提示詞再交 Codex）、簡報（dots 讀 25 個檔並轉交作者電腦上的 Codex 用 PowerPoint 組裝；Claude 讀 10 檔手工組；ChatGPT 讀 4 檔）。
  5. Grok Bot 當「指揮」：叫 Skills 後把圖交 Codex、影片交 Claude Code。
  6. 讓 Grok Bot 量測讀取路徑（10-21，各 3 次）：簡報 Skill 從 Drive 搜尋平均 73.2 秒／15.3 次呼叫，GitHub＋MCP 20.0 秒／6 次；Drive 有 5 個同名備份資料夾，容易讀到舊版。
- 作者報告的失敗點：
  - ChatGPT 連線過期後要按 3 次重新連線才通。
  - ChatGPT 讀列表正常、讀本文卻回空 `{}`，還默默改用官方 GitHub 連接器交差；圖解 Skill 沒讀到時改丟 Adobe Firefly，日文標題亂碼。原因是回傳欄位名 `content` 與 MCP 回應外層同名，改成 `body` 後解決。
  - Grok Bot 連線花 57 分鐘：回呼網址未列白名單、確認畫面開著超過 10 分鐘過期、瀏覽器安全規則擋中途轉址（插一頁完成頁後解決）。

## 建議操作流程（本庫設計，依來源A公開部分改寫，未實測）

1. 先用 1 份 Skill 試：放進私有 repo，確認每份有固定 ID、說明何時用、輸出格式。
2. 架唯讀 MCP（任何可長期運行且能加驗證的地方均可）：只開放列出／搜尋／讀本文／讀附件；拒絕路徑跳脫；不提供寫入或執行。
3. 用本人身分驗證（如 GitHub OAuth），讀 repo 的權杖只給唯讀並設到期日。
4. 逐一登記到要用的 AI；每家都做「列表＋讀本文＋讀附件」三項驗收，要求回報使用的 Skill ID 與檔名，不能只看成品。
5. 決定分工：只需讀 Skills 的單次工作交一般聊天；需執行 Skill 內程式或跨多檔的工作交程式代理。
6. 每月檢查呼叫量、權杖到期與各 AI 是否仍讀得到最新版本。

## 可複製提示詞（短引作者驗收方式，其餘本庫設計）

> 請透過〔MCP 名稱〕取得「〔Skill 名稱〕」的手順書，照手順完成下面的任務：〔任務〕。完成後用一行寫出你實際讀到的 Skill ID 與檔名；若本文或附件讀不到，請直接說讀不到並停止，不要改用其他來源或其他工具代替。

## 所需連接、權限與限制

- MCP 只給讀取；GitHub 權杖限定單一 repo 唯讀並設期限（作者設 3 個月）。權杖由本人貼到 Cloudflare 秘密設定，不貼進聊天。
- Skills 若含客戶資料或內部流程，私有 repo＋本人驗證是最低要求；本庫不建議把私人 Skills 放公開 repo。
- 「一般聊天不吃 Codex 額度」是作者在其 Pro／Plus 方案的觀察，本庫未核 OpenAI 計費規則；各 AI 是否支援自訂 MCP 與方案限制需另查官方說明。
- 各家 AI 讀到同一份 Skill 仍可能產出不同結果；能否執行 Skill 內程式取決於該 AI 的環境。

## 驗收與可重現性

- 必驗：每家 AI 能讀本文（不只列表）；讀不到時會報錯而不是改用別的來源偷偷完成。
- 作者量測數字為單人、少量（各 3 次）自測，不是基準測試；本庫未重現。

## 去重與版本紀錄

- 2026-10-25 首次收錄。已比對 UC-208（技能移植後綁定與核准檢查）、UC-045（跨代理代查網頁）、UC-351（Grok Bot 只調度、重活交免費模型）、UC-349（同作者 dots 詢問台帳）：本案核心是「單一 Skills 原本＋唯讀 MCP 供多家 AI 共用」及讀取驗收，與上述不同，獨立成案。
- 作者 Google Drive 版做法（索引檔＋Skills）列為較易上手的替代，不另立案。
