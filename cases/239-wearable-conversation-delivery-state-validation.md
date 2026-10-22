# UC-239｜把既有助手接到眼鏡後，晚回、歷史與重開真的接得上嗎

- 網站標題：讓眼鏡接住助手回覆，也檢查漏回與重複朗讀
- 一句話用途：從作者的 Dot Link 實機紀錄，學習核對雙向會話在待機、歷史選取及重開後是否正確交付。
- 工具：ChatGPT dots／Dot Link／Even G2／Mac relay；2026-10-18補Grok Bot／Alexa／Cloudflare Worker
- 分類：開發
- 情境：開發
- 標籤：穿戴、會話、狀態、驗收
- 證據：B；作者公開專案及實機自驗紀錄，未獨立重現；Beta 與正式版本不能混為一談。
- 作者／語言：Yusuke Ito（GitHub YusukeIt0）／日文、英文。
- 日期：實機紀錄2026-10-16；原Threads精確發文時間未取得。查閱2026-10-16 UTC。
- 狀態：部分實作與未解延遲均保留，不是安裝推薦或即時回覆保證。

## 可以幫你做什麼

作者把既有 dot 的多輪對話接到眼鏡，重點不是多一個語音入口，而是核對回覆實際顯示、是否朗讀、挑歷史是否誤重讀，以及退出重開後會話是否接續。原作者的測試也留下約四分鐘等待與需另催 dot 才處理 pending 訊息的問題。

## 怎麼開始

先用合成會話事件做只讀驗收表，分開「收到事件、讀取、產生回覆、顯示、朗讀」。本庫沒有安裝、配對、建立隧道或啟用真實裝置；也不提供憑證設定與繞過系統阻擋指令。

## 原作者的具體實作

1. G2 的長按語音或手機文字經本人 Mac relay 送給已擁有的 ChatGPT dot；不是任意通用模型 API 冒充 dot。
2. 回覆回到眼鏡顯示，可選朗讀。作者說桌面 session 分開但可取 context，不能推論任意 session 全部同步。
3. 10月16日 0.3.10 Beta 紀錄列出新語音回覆、待機收到回覆亮屏並朗讀、歷史選取不重讀，以及退出重開恢復會話。
4. 同批紀錄有等待及未解 pending 問題。後續朗讀開關重開保留修正只支持 UI 保留驗收，不證明全部音訊時序已實測。
5. 作者自稱初始目的已達成；本庫只依公開紀錄收錄，不認證長期可靠性。網站影片是 AI 示意與模擬器，不拿來當真機演示。

## 需要核對的權限、費用與限制

- 原專案要求相容 Mac、iPhone、G2、Tailscale 與既有 dot 資格；隧道／自訂 MCP 權限另有門檻，安裝不授予帳號資格。設備、訂閱與外部服務可能有費用，未核總價。
- README 當時說 Mac app 尚未 Apple notarized；本庫不引導繞過安全警告。原作者版本與商店版本可能不同。
- 隱私頁說喚醒麥克風預設關；通知與位置各自 opt-in。選外部轉錄服務會將音訊傳往該服務並受其費率及資料規則約束；本機預設轉錄不等於全流程離線。
- Mac 有對話歷史及連線秘密，並非全部放 Keychain。停止服務或解除裝置不等於刪除歷史與外部供應商資料；實機撤銷後重新配對未完整測。
- 退出後位置分享有短暫 lease 到期界線，不能宣稱按退出便即刻撤銷所有既有權限。此案不需要啟用位置或通知。
- OpenAI MCP Events 的收件成功與後續處理是不同階段；事件可能異步處理、合併或亂序。Secure MCP Tunnel 有自身存取與持續運作條件，不能當低延遲承諾。

## 可貼指令（本庫自行設計，未執行）

請只分析我提供的合成會話事件表，不連裝置、不啟用麥克風、通知、位置或隧道。逐筆列出 utterance ID、reply ID、session、收件、讀取、顯示、朗讀及退出時間。核對待機晚回、重複交付、選歷史不重讀、跨 session 混淆及重開後會話接續。缺少證據請標未知；HTTP 收件成功不能當已回覆，UI 開關保留不能當實際音訊成功。輸出預期狀態、實際記錄、差異及需要人工補測的項目，不改任何設定。

## 來源與查閱範圍

- [作者日文原貼](https://www.threads.com/@y_5k110/post/DeHtzTImdye)：已讀 caption，未以影片證明真機成果。
- [固定版本 README](https://github.com/YusukeIt0/dot-link/blob/a0117365ac8d3594c0fc462d5e3ebbc38e1abd29/README.md)：commit時間2026-10-16 09:31:10 UTC。
- [回覆與等待實機紀錄](https://github.com/YusukeIt0/dot-link/issues/62#issuecomment-6211151815)、[歷史與重開](https://github.com/YusukeIt0/dot-link/issues/62#issuecomment-6211669160)、[綜合驗收界線](https://github.com/YusukeIt0/dot-link/issues/62#issuecomment-6211788222)。
- [pending未解問題](https://github.com/YusukeIt0/dot-link/issues/8)、[退出與lease界線](https://github.com/YusukeIt0/dot-link/issues/62#issuecomment-6211925868)、[朗讀設定修正PR](https://github.com/YusukeIt0/dot-link/pull/72)。
- [固定版本資料處理說明](https://github.com/YusukeIt0/dot-link/blob/a0117365ac8d3594c0fc462d5e3ebbc38e1abd29/docs/privacy.md)。
- [OpenAI MCP Events](https://developers.openai.com/plugins/build/mcp-events)、[Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)：只核底層交付／權限界線，不是第三方專案背書。

公開測試紀錄由作者帳號發布，包含測試者／代理觀察；未獨立重跑、錄音驗證、撤銷再配對或確認所有正式版能力。主查閱器部分GitHub頁cache miss，透過可用公開原文／連接器讀取；未繞過登入或安全限制。

## 去重

不同UC087的語音拆任務與晨間進度、074的事件量測讀回、050的定時圖像、010的單向裝置顯示。本案只計「既有助手雙向多輪會話的交付與退出／歷史狀態驗收」一次；不把語音、位置、通知及每個硬體型號拆成新案例。

## 補充：Alexa先回受理、結果另送聊天，避免mock假成功（2026-10-18）

Debbie O’Brien，英文，2026-10-13，[作者實作原文](https://debbie.codes/blog/talk-to-my-bots-through-alexa/)全文已讀。作者讓Grok Bot委派Cursor建立Alexa到Worker再到Bot webhook的入口，本人操作Alexa控制台。已自述收到聊天答案；Echo僅先口頭回受理，不朗讀最終結果。曾遇語系不符未送請求、SDK回應格式錯誤，以及mock口頭說成功但沒喚醒；這些是作者觀察，沒有原始服務日誌。

核對[固定提交](https://github.com/debs-obrien/alexa-grok-bot-skill/commit/f2f6b143f4bd8157403487dd1daf3c1cabd080f1)（2026-10-13 20:42:26 UTC）、[HTTP handler](https://github.com/debs-obrien/alexa-grok-bot-skill/blob/f2f6b143f4bd8157403487dd1daf3c1cabd080f1/src/http-app.ts)、[喚醒處理](https://github.com/debs-obrien/alexa-grok-bot-skill/blob/f2f6b143f4bd8157403487dd1daf3c1cabd080f1/src/wake.ts)及[測試定義](https://github.com/debs-obrien/alexa-grok-bot-skill/blob/f2f6b143f4bd8157403487dd1daf3c1cabd080f1/tests/skill.test.ts)：可見缺設定時回失敗、mock／正式模式及逾時處理。只讀程式，未執行測試、連裝置或部署；HTTP受理不是代理任務完成。

此為既有助手跨裝置交付的補證，不因Alexa或同步回應期限另計數。入口無法證明誰在說話；payload寫唯讀不等於技術權限隔離，也未完成獨立資安稽核。應把有副作用的要求交回已驗證本人確認，不以口頭受理授權寄送、修改或購買。作者稱Worker在免費額度內，但未核帳單、硬體、代理訂閱或完整成本。

沿用本頁合成事件驗收時，另分開mock、正式受理、喚醒、產生結果與結果送達，測缺設定與逾時是否誤報成功。這是本庫未測的驗收設計，不提供部署、金鑰或持續存取設定指令。

## 2026-10-20補充：連接前歷史不等於已同步

[beeper/chatgpt-dots Issue #6](https://github.com/beeper/chatgpt-dots/issues/6)，0xdevalias，2026-10-11，英文，2026-10-20讀取公開Issue正文。報告指出連接既有dot後僅同步新訊息，連接前歷史未回填；保留助手身分／上下文不等於Beeper時間軸已有完整舊訊息。這是作者問題報告與功能請求，本輪未重跑、未讀全部實作，不能宣稱修復。

本庫自行設計的離線驗收：以連接時間為切點，分開列原對話既存訊息、橋接後訊息與Beeper可見訊息，核對第一筆可見ID、缺口與重複。缺歷史標「未回填」，不推定原始資料刪除。真實帳號連接、匯出與讀取需各自授權；不要公開私人對話。本補充併入跨端歷史／交付驗收，不另計新案例。

## 2026-10-22補充：忙碌時只排一次查詢，模擬畫面不算實機交付

SergioAppen 的英文 [grokbot-g2 README](https://github.com/SergioAppen/grokbot-g2)與 u/Short_Map3002 的[實作用途自述](https://www.reddit.com/r/EvenRealities/comments/1wyz2ak/grok_bot_for_g2/)本輪已讀。發文精確日期未核；查閱2026-10-22（Asia/Taipei）。作者自稱用Grok Bot雲端中繼接G2，快速動作指定目標Bot；目前README標個人原型，不能當商店正式產品或官方背書。

README v0.6.1描述忙碌時不立即催問，可排一個閒置後ping；新訊息不強制跳離正在讀的舊頁。值得加驗的是「一次排隊、實際送出、回覆、眼鏡顯示」各階段，而非看到Queued就當完成。README明說展示截圖來自模擬器與mock Bot；本庫沒有核實新版實機測試、原碼或延遲。Reddit使用經驗也不能替最新版本每項功能背書。

此為同一雙向交付問題的工具變體與證據限制補充，不另計案例。裝置、常開中繼、既有帳號、隧道與外部轉錄可能涉及費用及另行授權；沒有安裝、配對或建立存取。不要把讀取歷史的權限當成發訊息、打斷任務或啟用麥克風的授權。

本庫自設／未實測的可貼指令：只讀合成事件，列出busy、queued、idle、ping送出、reply及HUD顯示的ID與順序；檢查多次點擊是否只排一筆、取消後是否仍送出、重開後有無重送。模擬與實機欄分開，沒有紀錄標未知，不操作真實裝置或帳號。


## 2026-10-22 18:30補充：眼鏡不能把手機別題的回覆當成自己的答案

Sid Dani（sidart10）的英文 [muse-glasses](https://github.com/sidart10/muse-glasses/blob/f082026cf0a69b67a36f00af3d49f1b5d8a70447/README.md)，固定提交時間2026-10-20 03:52:15 UTC，本輪已讀README及兩個測試檔。這是Meta Muse／Ray-Ban Display／Mac橋接的非官方變體；本庫未看43秒實機影片、未安裝或執行。頁面的完整流程展示明示是腳本情境，不能當全部真機驗收。

作者列出三個限制：只接主聊天，側執行緒回覆不送到gadget；「Hey Meta」呼叫WebMCP不可靠，改用App內口述；原生音訊模式失效，改讓Mac朗讀文字。這些是作者版本觀察，非官方全帳戶故障公告。眼鏡顯示核准請求後仍導向手機，不表示已在眼鏡批准動作。

[測試定義](https://github.com/sidart10/muse-glasses/blob/f082026cf0a69b67a36f00af3d49f1b5d8a70447/tests/test_live_turns.py)以FakeSession餵事件，包含手機另一題的無父ID回覆不混入、缺訂閱不發送、任務完成但無答案要報錯，以及晚到答案仍對原request。檔名雖含live，仍是合成事件測試，不是本庫或作者該版真實服務通過證據。[橋接測試](https://github.com/sidart10/muse-glasses/blob/f082026cf0a69b67a36f00af3d49f1b5d8a70447/tests/test_bridge.py)另含空命令白名單、拒絕shell／檔案命令的斷言；只證明設計與測試存在，未做資安認證。

[官方SDK README](https://github.com/facebookincubator/muse-gadget-sdk)只支持有ESP32／Linux裝置SDK、配對需token及Developer mode等要求，不替macOS移植背書。常開Mac、相容眼鏡、帳戶、網域與中繼的完整費用未核；作者「免費執行」不能代表硬體與訂閱零成本。配對、憑證、隧道、麥克風及背景服務須另行核准，不由本研究啟用。

可貼指令（本庫自行設計／未實測）：只讀我提供的合成會話事件，按request、parent message與session逐筆對帳。插入一則手機別題回覆、側執行緒回覆、completed但無答案與晚到答案，標哪些可顯示給眼鏡、哪些需隔離或報錯。將腳本測試與真機證據分欄，核准卡只記待本人處理，不代為批准、不連裝置或啟動服務。

併入UC-239的跨端會話交付驗收，不因Muse或新眼鏡另增案例。


## 2026-10-23 06:20補充：語音入口格式轉換成功，不代表身分驗證或任務完成

u/riceman2000 在[Reddit 原帖](https://www.reddit.com/r/GrokBot/comments/1wpgvhr/grok_bot_from_pebble_index_01_smart_ring/)自述正在使用 Pebble Index 01→Cloudflare Worker→Grok Bot。其 [README](https://github.com/Riceman2000/pebble-bounce/blob/main/README.md)及 [Rust 實作](https://github.com/Riceman2000/pebble-bounce/blob/main/src/lib.rs)將 multipart 轉 JSON，保留時間、轉錄及可選音訊，傳回下游狀態、不自動跟隨重新導向。只要求 Authorization 標頭存在，真正有效性由下游判定，不是已完成驗證。英文、原帖絕對日期未核；已讀公開正文、README與原碼，未執行、無送達日誌。

[裝置官方文件](https://help.repebble.com/en/articles/15724406-index-advanced-features-mcp-webhook)說 webhook 是原裝置動作之外的附加動作，不表示原本行動停止。官方只核裝置格式，不替第三方橋接背書。作者稱免費額度可容納，不代表硬體與Bot訂閱零成本；聲音、轉錄會經外部服務，需限定資料及授權，金鑰不公開。本輪沒有部署或建立存取。

沿用跨端交付驗收，合併本頁而非換硬體另計。本庫自設／未實測提示：只對合成 payload 列格式、時間、空值、標頭存在／有效驗證、下游受理、代理完成及原裝置平行動作。缺驗證、下游401、重新導向與重複事件各別標記，HTTP成功不當任務完成。不發送、不連裝置、不部署、不輸入真實憑證。


## 2026-10-23 07:00補充：微信入口要分清已排隊、過時答案與真正送達

psylch的[固定版本README](https://github.com/psylch/grokbot-wechat/blob/9dfedc97064c09f999771cf777877511a630b80d/README.md)（簡中／英文；提交2026-10-05 16:16:31 UTC）公開Grok Bot↔微信ClawBot中繼。作者列出實用失敗：連發消息導致多輪回答、補充後仍答舊問題、久未發言被拒推送、重啟後接收器消失。原始聊天與服務日誌未公開，本庫只讀README、send.py及提交資訊，未執行；不能把搜尋索引日期當首次發布。

作者用批次收件及觸發時間識別處理過時回覆。[send.py](https://github.com/psylch/grokbot-wechat/blob/9dfedc97064c09f999771cf777877511a630b80d/send.py)可見：最新入站比觸發時間晚超過500毫秒便退出4、不送舊答；排隊退出3與已送退出0分開。這只核靜態分支，不證明真實服務每次執行。README自述11小時可推、35小時失敗，約24小時只是作者採用的處理界線，不是本輪核實的官方精確期限；HTTP200亦不應單獨視為成功。

同屬跨端會話交付與歷史／晚回驗收，併入UC239，不因微信另增案例。與UC325日記確認後存檔不同，此處不證明日記流程。第三方橋並非官方整合背書；近期對話會隨請求傳給Grok Bot，平台資格、持續存取、資料接收方與推送授權須分別確認。禁止以續期提示規避平台限制；不公開憑證、真實訊息或媒體。費用與長期可靠性未知，本研究未綁定帳號、啟服務或傳訊。

可貼指令（本庫原創／未實測）：只用合成事件做交付驗收，列原訊息ID、觸發時間、補充訊息、產生答案、排隊及實際送達證據。測補充晚400與600毫秒、HTTP200但業務拒絕、進程重啟與重複事件；按所提供規格判讀，不把排隊或重試當成功。過時答案不送，未知送達不盲重送。只交差異表，不連微信、不建webhook、不讀真實歷史、不安裝或執行程式。
