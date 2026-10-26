# UC-281：Grok Bot 出構想與 mockup，Claude 工人實作，再截圖對照驗收

- 情境：開發
- 標籤：多代理、驗收、設計、程式
- 網站標題：一人同時顧多個專案？用「構想 Bot → 實作代理 → 截圖 QA」接力
- 一句話用途：作者用 Grok Bot 做發想、與專案經理討論、產出電腦／手機 mockup，寫成最多約 10 份 Markdown 文件並開 GitHub issue；再交給 Claude Opus 帶最多約 15 個工人代理實作；之後再用 Grok Bot 的 QA 角色逐頁多尺寸截圖，開 bug issue。作者稱此流程可同時推進最多約 10 個專案。
- 核心目標：把產品構想、實作與視覺驗收拆成可交接的代理流水線，並以截圖對照 mockup 與線上頁面。
- 分類／標籤：軟體交付／多代理流水線／視覺驗收
- 適用工具：Grok Bot（構想、mockup、QA）／Claude Opus 5.5（主代理＋工人代理）／GitHub Issues／文件目錄
- 目標使用者：同時維護多個網站或 App、願意用多套代理分工的開發者
- 首次收錄／最近查證：2026-10-17（台灣時間）
- 證據狀態：author-demo。作者長文自述＋附圖；本庫經 API 讀到完整 note_tweet，未獨立核對任一專案倉庫。
- 是否獨立重現：否。

## 輸入與預期輸出

- 輸入：產品構想、與「專案經理」的討論、目標頁面清單。
- 輸出：PC／Mobile mockup、`/docs` 下最多約 10 份說明 Markdown、含交接提示的 GitHub issue、Claude 工人完成的頁面與功能、QA 截圖與新的 bug／修正 issue。
- 明確排除：未公布具體專案名、成功率、費用或「10 專案」的同時在線證據。

## 來源版本

### S-281A：Metagrapher（@0x3Matt）（`author-demo`）

- 來源：[X 貼文](https://x.com/0x3Matt/status/2111326321905172614)，英文，2026-10-17 05:19 UTC（台灣時間 2026-10-17 13:19）。長文經 API `note_tweet` 讀取；附 1 張圖片（本庫未把圖片當獨立證據解讀）。
- 作者說法（改寫）：覺得看 Claude 主代理指揮工人代理很有趣。Opus 5.5 會不斷截圖，直到畫面对上自己用 Grok Bot 生出的 mockup 與線上網站。新流程：用 Grok Bot 發想→與專案經理討論→產生 PC／Mobile mockup→詳細寫進最多約 10 個 MD 存到 `/docs`→建立附交接提示與 mockup 的 GitHub issue→Opus 接手實作，可建立最多約 15 個工人代理完成頁面與功能並回寫 issue→之後 Grok Bot 以 QA Engineer 角色跑過各頁面與螢幕尺寸、截圖並開 bug／修正 issue。作者認為搭配新一代代理可同時做最多約 10 個專案且較不易 burnout。
- 未證實：mockup 工具鏈、專案經理是人或另一 Bot、實際工人數、截圖對照是否自動化通過、並行專案數。

### S-281B：@neil160289（`author-demo`，精簡工具變體）

- 來源：[X 回覆](https://x.com/neil160289/status/2113643253212082459)，英文，2026-10-23 14:46 UTC（台灣時間 2026-10-23 22:46）；經 X API 讀取全文。
- 作者流程（意譯）：在 Omarchy（Linux 桌面）上設定 Grok Bot，只跟一個「專案經理」Bot 對話；它開 GitHub issue，T3 這個程式代理外殼接手並開 PR，作者在聊天裡核准合併。作者認為 T3 可以拿掉，讓 Bot 直接驅動終端機中的 Claude Code 或 OpenCode 也能運作。
- 與 S-281A 差異：沒有 mockup 與 QA 截圖階段，只保留「PM Bot 開 issue → 程式代理開 PR → 人在聊天核准合併」的核心交接；合併前的人工核准點明確。
- 未知：未公開倉庫、PR 數量、失敗率或是否跑 CI；「拿掉 T3 也能運作」是作者看法，本庫未測。

## 建議操作流程

以下為本庫設計，未實跑：

1. 固定交接格式：目標使用者、頁面清單、不得改動的範圍、驗收截圖尺寸。
2. 構想階段只產出 mockup 與 MD，不直接改 production。
3. 實作代理必須引用 issue 與 `/docs`；完成後更新 issue 狀態，不要另開無來源的 PR 說明。
4. QA 階段：每個關鍵頁至少桌面＋手機各一張，對照 mockup 差異表（布局、文案、缺件）。
5. 並行專案數先從 1–2 個開始；額度、審核負擔與上下文污染要分開計量。

## 可複製提示詞

短引文改寫＋本庫補充，未實跑：

> 你是構想與文件 Bot：針對［專案］，產出桌面與手機 mockup 說明、最多 10 份 Markdown（放在 `/docs` 大綱），以及一則 GitHub issue 正文（含交接提示、驗收清單、禁止改動項）。不要寫入 production、不要推送。交我核准後再交給實作代理。

> 你是 QA Bot：依［issue］與 mockup，開啟［預覽網址］，在［尺寸列表］截圖，列出與 mockup 不符處，並草稿新的 bug issue（重現步驟、期望、截圖檔名）。不要自行修改程式。

## 所需連接、權限與限制

- 需要 GitHub、預覽環境與（可選）設計稿存取；生產部署應另設核准。
- 多代理並行會快速消耗額度；作者「10 專案」不可當容量保證。
- 截圖對照不能替代無障礙、資安或資料正確性測試。
- 與 UC-062（Figma↔Android 差異稽核）、UC-273（夜間程式代理接力）相關但不同：本案強調 mockup→多工人實作→多尺寸 QA 開 issue 的完整交付鏈。

## 驗收與可重現性

- 至少一個專案：issue 有 mockup 連結、`/docs` 齊套、預覽頁截圖與差異表可人工複核。
- 本庫未重現。

## 去重與版本紀錄

- 2026-10-17 首次收錄。不與 UC-005、UC-061、UC-273 合併計數：交接產物與 QA 截圖對照是不同核心工作。
- 2026-10-24：併入 S-281B（@neil160289），同屬「Bot 當專案經理開 issue、程式代理實作開 PR」的交接流程，屬精簡工具變體，不另計新案；新增「在聊天核准合併」的人工關卡。


## 2026-10-25 02:10補充：人工 push 通過，不代表代理交接鏈通過

- 來源：mathew-builds 的 [Handoff README](https://github.com/mathew-builds/Handoff)及[實作證據](https://github.com/mathew-builds/Handoff/blob/main/docs/07-evidence.md)，英文；實驗2026-09-05至09-06，09-08補記證據限制。本輪只讀公開文件，未執行或獨立重現。
- 作者的 Grok Bot → GitHub issue → Claude Code → PR → 群聊回報，屬本案既有交接流程，不另計案例。作者先以另一個 on:push workflow 開 PR，人工 push 測試成功，實際代理使用 GITHUB_TOKEN 推送卻未觸發；之後把開 PR 步驟放回同一次 workflow。這提醒驗收必須使用真正的觸發者，不能以人工替代控制測試宣稱全鏈成功。
- 作者另分別測人與 github-actions 建 PR，兩次都由內建 GitHub 事件觸發 Bot 回報「tests pending」。PR 已回報不是 CI 已完成；未測的 webhook 不能當作已證實。原私有測試庫刪除再還原後 Actions 歷史消失，公開 run ID 已不可重查；PR及評論仍在的說法也只由作者自述，不宣稱本庫讀過私有產物。
- [GitHub 官方目前說明](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)本輪核讀：GITHUB_TOKEN 的 push 不啟動後續 workflow；但特定 pull_request 事件現在可建立需人工批准的工作流程。這與作者舊文件的「PR不跑CI」概括不同，應保留歷史條件，不套成現況永久限制。
- 權限／費用：Bot、程式代理訂閱及 Actions 用量分開；未核本流程總費用。不要為了讓 CI 自動跑就擅自新增 PAT、擴權或改 repo 安全設定。本補充不授權安裝、開 PR、傳 webhook 或合併。

可貼指令（本庫自設／未實測）：只讀合成 issue、PR 與 CI 事件表，逐段列觸發者、事件、工作識別與結果。把人工 push 和代理 push 分開，把已建 PR、待批准 CI、CI 已通過分開。缺少原始紀錄保持未驗證，不以另一條路徑成功代替；只輸出待驗清單，不改設定或新增憑證。
