# UC-455：用約4,000日圓的M5StickC Plus2做隨身Muse對講機，靠記錄檔找出記憶體不足並補日文字型

- 情境：開發
- 標籤：實體裝置、語音、故障診斷
- 網站標題：不開手機也能叫Muse：把小型開發板改成按住說話的隨身裝置，連線錯誤其實是記憶體不夠
- 一句話用途：日文作者 tantan21jp 用 Meta 官方開源的 Muse Gadgets SDK，把 M5StickC Plus2（免焊接）刷成「按住按鈕說話、放開後螢幕顯示日文回覆」的隨身 Muse 裝置；官方設定直接用會出現連線錯誤和亂碼，作者從序列埠記錄檔看出是 PSRAM 不足，補兩行設定後恢復。作者自述實測，本庫未重現。
- 核心目標：讓不想掏手機的人，用一個實體按鈕把口頭需求丟給 Muse，並示範「畫面錯誤訊息≠真正原因」時怎麼用記錄檔定位。
- 分類／標籤：實體裝置／語音入口／韌體故障診斷
- 目標使用者：已有 Muse 帳號、會用命令列與 USB 燒錄、願意自己動手的創客或開發者
- 工具：Meta Muse（App 開發者模式＋Muse Gadgets SDK 與 SDK token）／M5StickC Plus2／ESP-IDF v6.0.1／Windows PowerShell；作者自述寫程式與查錯多半交給 Claude Code
- 首次收錄／最近查證：2026-10-26 08:52（台灣時間）
- 證據狀態：`official`（Muse Gadgets SDK 為 Meta 開源專案，見 UC-050 官方公告來源）＋ `author-demo`（作者自述實測：設定差異、前後記錄檔與實機照片）；本頁提示詞為 `designed`
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：M5StickC Plus2、可傳資料的 USB-C 線、2.4GHz Wi-Fi、Muse App（Settings > Devices > Developer mode 開啟）、在 gadgets.muse.ai 發的 SDK token（`mgst_` 開頭）。
- 輸出：按住正面按鈕錄音、放開後送 Muse，回覆以 16px 日文逐行顯示在 1.14 吋螢幕（蜂鳴器音量很小，主要看螢幕）；待機顯示 `READY`。

## 來源版本

### 來源A：tantan21jp（Qiita，日文）

- 原文：[MetaのパーソナルAI「muse」を持ち歩けるポケットデバイスを作ってみた](https://qiita.com/tantan21jp/items/ca0c169f216262d615f8)，2026-10-25 20:31 JST（台灣時間 19:31），本輪以 Qiita 公開 API 讀全文。
- 原文語言：日文。
- 取得內容（翻譯摘要，非全文）：
  1. 安裝 ESP-IDF v6.0.1（SDK 只支援這版）並 clone 官方 [muse-gadget-sdk](https://github.com/facebookincubator/muse-gadget-sdk)。
  2. 在 Plus2 的設定檔末尾補兩行：`CONFIG_MUSE_HATCH_COMPACT_BUFFERS=y`（語音緩衝縮小）與 `CONFIG_MUSE_CJK_FONT=y`（日文字型，約多 850KB 快閃記憶體）。作者注意到已建置過的資料夾不會吃到新設定，要刪掉建置資料夾重建。
  3. 建置、以 230400 baud 燒錄；用自寫的小腳本經序列埠送 SDK token（隱藏輸入、不留在畫面或歷史紀錄）。
  4. 在 Muse App 的 Add Device 選裝置、設 Wi-Fi，裝置上按鈕確認，出現 `READY` 即完成；重新燒錄後 token、配對與 Wi-Fi 仍保留。
- 作者報告結果：補設定前，配對與 Wi-Fi 都正常，但一說話就出現 `LOST CONNECTION TO MUSE`、之後 `CAN'T REACH MUSE`；記錄檔心跳行顯示 `psram=2K`。作者查 SDK 變更紀錄發現另一塊同為 2MB PSRAM 的板子已開啟此設定、Plus2 卻沒有；補上後連線中 PSRAM 空間 2K→405K、加密連線由 failed 變為 session established、可收到回覆。
- 失敗點與未解：修設定途中曾一次在說話後畫面凍結，當時沒有記錄檔、原因不明；Plus2 已停產，後繼機 M5StickS3 雖在支援清單但作者未試；Windows 上另遇 pip 舊鏡像、PowerShell 5.1 把 stderr 當錯誤、lvgl 解壓 `WinError 32` 等環境問題（作者推測防毒掃描，未證實）。

## 建議操作流程（依來源整理；本庫未實作）

1. 先讀 SDK 條款，確認自己的 Muse 帳號可開開發者模式；token 只在本機輸入，不貼進聊天或截圖。
2. 依官方 SDK 指定的 ESP-IDF 版本建環境；燒錄前比對自己板子的設定檔與同記憶體規格板子的差異。
3. 首次燒錄後先抓不重啟板子的序列埠記錄，確認 `setup=done wifi=up ws=up` 與 `psram=` 剩餘量，再測說話。
4. 畫面顯示「連不上」時，先看記錄檔的記憶體與握手錯誤，而不是直接重設 Wi-Fi 或重新配對。
5. 改設定後清掉舊建置再重建，記錄改前改後的同一組指標（PSRAM 空間、握手結果、是否收到回覆）。

## 可複製提示詞（本庫原創設計，未實跑）

> 我在用官方 Muse Gadgets SDK 把一塊開發板做成語音裝置。請只根據我貼的設定檔差異與序列埠記錄（已去掉 token 與 Wi-Fi 密碼）判斷：畫面錯誤訊息和記錄檔指標是否一致、最可能的資源瓶頸、同 SDK 內記憶體規格相近的板子有哪些不同設定。只給候選修改與「改前／改後要比對的指標」，不要叫我關閉安全驗證、不要要求 token，也不要假設其他廠牌代理有相同 SDK。

## 所需連接、權限與限制

- 需要 Muse 帳號與 SDK token；token 等同裝置連線憑證，勿公開。Muse Gadgets 是 Meta 的功能，不推定 Grok Bot／dots 可用同一 SDK（Grok Bot 另有自己的裝置中繼，見 UC-399，屬不同產品）。
- 裝置會把錄音送上雲端；放在共用空間時注意旁人語音。
- 本頁硬體價格（作者寫 2026-10 確認時含稅 4,180 日圓）與停產狀況以販售頁為準，本庫未核。

## 驗收與可重現性

- 作者自己的驗收：補設定前後的心跳記錄與握手結果對照、實機照片。本庫未燒錄、未重現；其他板子是否需要同樣設定未知。
- 若自行重現，至少保存：板子型號、SDK commit、ESP-IDF 版本、設定差異、改前改後各一段記錄、說話 3 次的成功／失敗次數。

## 去重與版本紀錄

- 2026-10-26 08:52 新增。不同於 [UC-050](050-daily-eink-mood-illustration.md)：050 用同一 SDK 做每天自動推送到墨水屏的輸出裝置；本案是按住說話的輸入裝置，核心在記憶體不足的診斷與板子設定差異。也不同於 [UC-399](399-gadget-relay-shared-credits-receipts-acceptance.md)（Grok Bot 的裝置共享與額度收據）與 [UC-411](411-carplay-shortcut-location-to-bot-home-assistant-on-demand-update.md)（iPhone 捷徑語音入口）。
