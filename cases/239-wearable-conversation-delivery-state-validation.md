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
