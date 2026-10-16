# UC-256：互動推理故事的角色知情與證據解鎖驗收

- 網站標題：兇手太早認罪、線索還沒拿就結案？替推理遊戲查漏洞
- 一句話用途：把故事正史、角色知道的事與玩家取得的證據逐項核對，找出提前洩密和無法獲勝的路徑。
- 情境：創作
- 分類：互動敘事
- 標籤：遊戲、知識邊界、證據、驗收
- 工具：Grok Bot／Grok API／Whodunit
- 證據：A，公開專案與測試產物，加作者專案自述；本庫未執行或獨立重現
- 作者／語言：George Shanidze／英文
- 日期：可核實作紀錄2026-09-26至10-11；固定快照2026-10-11 17:32:35 UTC，非首次發表日期；查證2026-10-16 UTC

## 作者實際做了什麼

README說明作者決策，Grok Bot團隊協助故事、引擎、審閱與測試。公開問題記錄角色提前承認及不可能目擊；後續修訂對照正史、角色私有知識和揭露條件，留下狀態矩陣、回歸測試與錄製回應。遊戲中的對話由Grok API生成，不是Grok Bot本體扮演每個角色。

指控閘門稽核報告稱，舊閘門在受限搜尋下有288個已開啟卻不可勝的狀態，涉及13種證據組合；報告顯示5個例子不等於總共5個。本庫沒有重跑這項搜尋。

PR57後續留言稱69份待更新回應已重錄；其中一次91字超過90字限制，單獨重錄後才報106/106通過，沒有放寬字數。該留言由作者帳戶透過Cursor App發布，不能當人類親測或獨立CI認證。留言17:11:04 UTC仍說未合併；平台記錄17:11:48才合併。固定快照的待錄清單無項目，樣本保留時間、模型和promptHash，只能證明公開產物狀態。

## 可以借鑑的流程

1. 固定虛構故事正史和角色各自可知的資訊。
2. 列出玩家取得證據前後的允許回應與終局條件。
3. 將實際回應中的矛盾交作者裁決，不自行改寫正史來迎合測試。
4. 核對指控開啟時是否已有必要證據，避免看似可操作卻必敗。
5. 提示或規則改版後標出需重錄樣本，保留來源版本和未解例外。

## 可貼指令（本庫自設，未執行）

只讀這份合成故事正史、角色知識表、證據解鎖表和既有回應。逐狀態列允許資訊、實際回應、依據與矛盾；檢查開啟終局時是否具備人工指定的必要證據。分開觀察結果、作者解釋和待核推論。保留所有已知例外，不以全綠分數代替語意核對。不執行遊戲、不呼叫模型、不改檔或部署；先交給故事作者裁決。

## 限制、權限與成本

固定測試仍明列兩個KNOWN_GAPS，刻意豁免並確認它們仍存在；全綠不代表零洩漏。狀態搜尋把對話次數封頂2，並把特定壓力揭露視為可用，不能涵蓋全部自然語言路徑。全部輸出、故事公平性與修後真人遊玩未獨立驗證。

需要軟體環境、模型用量與測試維護；作者總費用未核。安裝、模型服務、憑證及部署另需授權。本庫只讀公開檔案，不執行測試或提供攻擊操作。官方結構化輸出支援格式約束，不能據此推論故事語意正確，也不代表作者採用當前文件的模型版本。

## 去重與來源

核心是角色知情／線索解鎖的一致性；不同UC110遊戲雛形、UC196對局事件記錄、UC222保留舊業務語意。角色、美術和測試數量不拆成多案。

固定版本：94d8ab8a01e05ae7963f1fcb4d283bf4a8be6bc6。
- [作者與Bot分工](https://github.com/GeorgeShani/whodunit/blob/94d8ab8a01e05ae7963f1fcb4d283bf4a8be6bc6/README.md)
- [提前認罪紀錄](https://github.com/GeorgeShani/whodunit/issues/6)與[目擊矛盾](https://github.com/GeorgeShani/whodunit/issues/7)
- [狀態稽核](https://github.com/GeorgeShani/whodunit/blob/94d8ab8a01e05ae7963f1fcb4d283bf4a8be6bc6/cases/blackwood/docs/CONSISTENCY_AUDIT.md)
- [仍有例外的測試](https://github.com/GeorgeShani/whodunit/blob/94d8ab8a01e05ae7963f1fcb4d283bf4a8be6bc6/tests/cases/blackwood-r7b-corpus.test.ts)
- [重錄結果留言](https://github.com/GeorgeShani/whodunit/pull/57#issuecomment-6111549684)
- [待錄清單](https://github.com/GeorgeShani/whodunit/blob/94d8ab8a01e05ae7963f1fcb4d283bf4a8be6bc6/tools/ai-eval/pending-rerecord.json)
- [實際回應樣本](https://github.com/GeorgeShani/whodunit/blob/94d8ab8a01e05ae7963f1fcb4d283bf4a8be6bc6/tests/fixtures/ai-eval/greg-18-before-secrets.json)
- [官方結構化輸出背景](https://docs.x.ai/developers/model-capabilities/text/structured-outputs)
