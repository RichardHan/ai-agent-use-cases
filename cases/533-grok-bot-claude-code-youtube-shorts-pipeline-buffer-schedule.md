# UC-533：不開剪輯軟體做 App 宣傳短影音：Grok Bot 寫腳本與排程，Claude Code 用技能潤稿與算繪，Grok Bot 看成品提修改、再經 Buffer 排程發布

- 情境：創作
- 標籤：影片、跨代理、排程、社群
- 網站標題：兩個代理來回分工做 YouTube Shorts：Grok Bot 寫腳本、審片、排程；Claude Code 套技能潤稿並產出影片檔
- 一句話用途：英文作者 @sp4rsh_ 為自己的 App（Linya）做 YouTube Shorts 的六步流程：Grok Bot 寫基本腳本 → Claude Code 用作者的爆紅輪播寫作技能潤稿 → Claude Code 用公開的 shorts-animator 技能做出短影音並回報檔案路徑 → Grok Bot 看片寫修改提示 → Grok Bot 透過 Buffer MCP 自動排程。作者承認兩個代理之間的提示詞仍要手動複製貼上。
- 核心目標：讓獨立開發者不開影片剪輯軟體也能持續產出 App 宣傳短影音並排程。
- 分類／標籤：短影音製作／跨代理分工
- 目標使用者：要持續替自己的 App 或產品做短影音宣傳、已在用 Grok Bot 與 Claude Code 的獨立開發者
- 實作門檻：工具串接
- 工具：Grok Bot（腳本、審片、排程）／Claude Code（技能：作者自有的輪播寫作技能、shorts-animator）／Buffer MCP
- 首次收錄／最近查證：2026-11-16 08:27（台灣時間）
- 證據狀態：`author-demo`（作者單則自述流程；影片成品、技能內容與成效未公開；本庫未重現）
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：App 的主題與賣點；作者自有的寫作技能；shorts-animator 技能；Buffer 帳號連線。
- 輸出：存在作者電腦上的短影音檔案；Grok Bot 對每支影片的修改提示；排入 Buffer 的發布時程。

## 來源版本

### 來源A：@sp4rsh_（X 貼文，英文）

- 原始網址：[X 貼文](https://x.com/sp4rsh_/status/2121943943944261792)，2026-11-15 12:30 UTC（台灣時間 20:30）。貼文附的技能連結指向 [shorts-animator 技能頁](https://www.tobiadonadon.com/projects/construct/material/skills/shorts-animator)（第三方公開頁，本庫未安裝）。
- 原文語言：英文。
- 取得內容（翻譯摘要）：做法是讓兩個代理來回傳遞工作：Grok Bot 負責寫與排程，Claude Code 負責潤稿與算繪。作者替 App「linya」的流程：
  1. Grok Bot 寫基本腳本。
  2. Claude Code 用作者的「viral carousel playbook」技能潤稿。
  3. Claude Code 用 shorts-animator 技能做出短影音。
  4. Claude Code 回報每支影片存在作者筆電上的檔案路徑。
  5. Grok Bot 檢查影片，若需要修改就寫一段修改提示。
  6. Grok Bot 透過 Buffer MCP 自動排程。
  缺點：作者仍要手動在 Grok Bot 與 Claude Code 之間複製貼上提示詞。
- 缺口：Grok Bot 如何讀到作者筆電上的影片檔、審片標準、Buffer MCP 的連接方式與發布成效都未說明。

## 建議操作流程（依來源整理；本庫未實測）

1. 先固定腳本格式（長度、開場、行動呼籲），讓 Grok Bot 每次輸出同一格式。
2. 把潤稿與算繪交給 Claude Code 的技能；要求它最後只回報檔案路徑與每支影片長度。
3. 讓審片的代理逐支看成品，修改提示要指出時間點與要改的地方；沒問題才標為「可排程」。
4. 排程前由人看過一次最終版本，再交給 Buffer 等排程工具；先排「草稿」或「待核准」狀態較安全。

## 可複製提示詞（本庫依來源改寫，未實跑）

> （給 Grok Bot，審片階段）以下是 Claude Code 回報的影片檔案路徑：［路徑清單］。逐支檢查：字幕是否有錯字、開頭 2 秒內是否說出 App 的用途、結尾是否有行動呼籲、長度是否在 60 秒內。每支輸出「通過」或「需修改」，需修改時寫一段可直接貼給 Claude Code 的修改提示（指出時間點與改法）。只有我回覆「排程」後，才把通過的影片排進 Buffer，時間依［時段］；不要直接公開發布。

## 所需連接、權限與限制

- 需要 Grok Bot 能讀到影片檔（作者未說明方式）與 Buffer 的 MCP 連線；發布到公開頻道前建議由人核准。
- 兩個代理之間目前靠人手動傳遞提示詞；這也代表每一輪都有人在中間檢查。
- shorts-animator 是第三方技能，安裝前請自行檢查內容與授權。

## 驗收與可重現性

- 可驗收：每支影片都有審片結果；排程清單只包含「通過」且經人核准的影片。
- 本庫未重現。

## 去重與版本紀錄

- 2026-11-16 08:27 新增。[UC-405](405-video-to-vertical-short-edit-only-verify-hashes.md) 是把既有影片剪成直式短片並核對雜湊；本案是從腳本開始、跨兩個代理生成並排程發布，另立案。
