# UC-227：多年地圖收藏重新分組與失效項目待查

- 情境：生活
- 標籤：地圖、收藏、整理、核准
- 網站標題：地圖星號越存越亂？先分清要去、想吃和待查地點
- 一句話用途：整理既有地點收藏與清單標記，移除前先確認失效證據及原始記錄。
- 工具：Meta Muse／Google Maps
- 證據狀態：B，作者實際整理自述；私人清單、操作紀錄及完整性未核，本庫未重現。
- 查證日期：2026-10-20（台灣時間；原地圖來源查閱日期保留於正文）

## 作者實際做了什麼

[原留言](https://www.reddit.com/r/MuseAgent/comments/1x3vk3k/comment/pfft3io/)，u/CautiousPresence4634，英文。公開全文已讀；精確發文日期未核，相對時間不採用。

作者稱Muse把多年星號收藏整理為清單、改標記並清理「permanently deleted spots」。沒有原清單、分類樣本或完成數；不能將這句直接翻成永久歇業，也不能當成刪除Google公開地點。數千筆只是作者估計。

## 官方核對改變了哪些解讀

2026-10-17已讀Google Maps官方：
- [儲存地點](https://support.google.com/maps/answer/3184808?hl=en)：從個人清單移除地點，與新增／刪除公開地圖地點不同；清單超過3,000筆可能顯示不正常。
- [建立與管理清單](https://support.google.com/maps/answer/7280933?co=GENIE.Platform%3DDesktop&hl=en-en)：自訂清單可選圖示，內建Starred places等清單圖示不能編輯。因此作者具體如何「改星號」仍未知，不寫成內建星號圖示已被改。
- 隱藏清單、移除收藏項目、刪除整個清單及開放分享是不同操作。Shared清單可由持連結的人查看；整理不應順便公開行蹤。

## 與既有案例的差別

[UC121](121-visual-reference-classification-sheet.md)另建圖片參考分類表；[UC055](055-tweet-project-intake-research-monitor.md)是研究建檔監測；[UC043](043-public-events-calendar.md)是活動日曆。這裡終點是既有地圖收藏庫的分類回寫與失效項目維護；不因不同城市另計。

## 小範圍試法（本庫設計，未執行）

1. 只提供十筆合成收藏，包含同名不同地址、搬遷候選和讀不到的地點。
2. 保留原清單、原網址與識別，分列建議類別、標記及待移除理由。
3. 讀不到、改名、搬遷、永久關閉、原記錄被刪除不能互相代替；證據不足保持待查。
4. 人工另行核准小批量修改後才討論實作；應讀回筆數、分類與原記錄對應，不能只看畫面變整齊。

## 可貼指令（自設未測）

請只分析這份虛構Google Maps收藏清單，提出分類與標記方案，保留每筆原ID、網址及原清單。對同名異址、搬遷或無法讀取的項目列待查，不把失效連結當永久歇業。分開標示移除單項、隱藏清單與刪除整表的差異；本輪只交變更預覽，不登入、不修改、不刪除、不建立分享連結。任何原記錄對不回的項目保持原樣。

## 權限、費用及查閱限制

正式私人收藏可能透露住家與日常路線；只在有權存取的私人環境處理，授權須限定清單及具體變動。作者沒有公開Muse連接方式、單次用量、成本或當時方案，不宣稱全帳號／全地區可用或免費。官方Google功能不等於官方保證Muse能完成它。

讀原留言後，再取日期資料時遇JavaScript驗證要求即停止；沒有繞過驗證，也沒有讀取作者帳戶或清單。此限制不抹去已讀作者自述，但日期及效果維持未核。

## 補證：Instagram 收藏以小批次分類，將續跑進度放在持久目錄

2026-10-20 補讀英文作者 `chinami-michaels` 的 [Instagram Saved Reels Sort](https://github.com/chinami-michaels/instagram-saved-reels-sort)。這是作者明確為 Meta Muse 的 `instagram-cli` 建立的技能，不是一般模型功能推測。README 自述在整理約 3,280 則已儲存 reels、13 個主題集合時建立，且中途遇到 `/tmp` 被清除、需要 cursor 重同步。公開程式與程序可查，但帳號逐筆結果未公開，不能將 3,280 當作已確認成功分類數或準確率。

作者流程先讀既有集合與使用者規則，每批取兩頁、每頁 50 個儲存項目，再保留 reels，產生逐則簡述供人或代理覆核。以穩定 media ID 對到集合後才寫入，回報各集合筆數及未分類理由；沒有可用描述就留在原 Saved。作者明確限制寫入只加入集合，不刪除、不下架、不全域取消收藏，首批先確認。後續無人值守或例行執行仍需要使用者授權，不能由這份技能說明自動推得。

持久狀態與 cursor 存在 `~/.instagram-saved-reels-sort/`，不是 `/tmp`。程序列出 media-understanding 無回應、cursor 遺失、命令失敗及限流等情形；中斷時應核對已處理頁數與批次狀態，不猜測跳頁。文件中的 `advance` 只能按已知頁數重新前進，並非保證不重複、不漏項的交易式恢復。實際執行仍應對 media ID 與寫入回執核對。

- 作者／語言／日期：`chinami-michaels`，英文；本輪固定 commit 日期 2026-09-16T06:28:09Z。
- 固定版本：`27a36766d0115eb15a4b8cf945f42339c66243e1`，提交訊息為修正集合分頁與建立集合回應解析。這是程式修補日期，不代表全部 reels 在該日完成。
- 已核原文：[README](https://github.com/chinami-michaels/instagram-saved-reels-sort/blob/27a36766d0115eb15a4b8cf945f42339c66243e1/README.md)、[SKILL](https://github.com/chinami-michaels/instagram-saved-reels-sort/blob/27a36766d0115eb15a4b8cf945f42339c66243e1/SKILL.md)、[批次程序](https://github.com/chinami-michaels/instagram-saved-reels-sort/blob/27a36766d0115eb15a4b8cf945f42339c66243e1/references/batch-procedure.md)、[commit](https://github.com/chinami-michaels/instagram-saved-reels-sort/commit/27a36766d0115eb15a4b8cf945f42339c66243e1)。
- 證據界線：作者實作自述＋公開程式文件；未登入作者帳號、未安裝技能、未執行或獨立重現。不要把文件附帶的 opt-in 餐廳 dossier 當成另一個已完成案例。
- 費用／權限：原碼 MIT、Python 標準函式庫；Muse 費用與單次用量未公開。需要收藏讀取和經核准的集合寫入；安裝第三方技能及建立持續帳號存取須另行確認。
- 去重：仍是既有收藏庫的分類回寫，與 UC-227 核心相同。批次、cursor、不同平台與更大數量是補充操作證據，不增加案例數，也不另拆 UC-174 的續跑變體。

### 可貼補充指令（本庫設計，未實測）

請先只讀我指定的兩頁收藏與既有集合，提出主題映射和無法判斷項目。保留穩定 media ID、批次號及非暫存的進度紀錄，先給我覆核，不建立集合、不移動或刪除任何收藏。若未來核准具體寫入，每批回報成功、失敗與未分類數量，按來源 ID 核對回執；遇限流停止，不跳過出錯批次。不自動啟用例行排程，不對收藏內容啟動額外研究。
