# UC-161：同一題問不同模型，先保留原回答與測試條件

- 網站標題：比較AI答案前，先檢查原文、拒答和測試條件有沒有漏
- 一句話用途：作者用Grok Bot採集固定德文題庫，公開逐題回答資料；本庫只讀核對資料結構，不重跑跨網站自動詢問。
- 情境：學習
- 標籤：模型評估、資料集、來源、驗收
- 工具：Grok Bot／公開CSV／作者後續使用OpenAI模型與Codex
- 證據狀態：A級作者實作及公開資料；未獨立重跑、未認證評分。
- 查證日期：2026-10-17（台灣時間）

## 原作者做過什麼

Andreas Batista Teixeira在2026-09-20 15:12:34 UTC發表德文實驗，稱9月5–9日以固定題庫向五產品採集回覆，逐題開新對話並保存回答與拒答，再整理編碼。公開CSV核到285列及285組不重複的產品／題目鍵，五產品各57列，回答欄非空；這只證明檔案結構，不證明每個回答忠於當時畫面。

早期品質檢查缺五份ChatGPT原檔，9月11日記錄稱從瀏覽器補回；目前抽讀原檔存在，不將現版當原始採集時全部齊備。Lumo中途Max改Lite，登入、搜尋與個人化條件不一致；目錄名也未必等於實際模型。自訂量表、單次德文及缺獨立評分者，不能產生客觀文化／國家或個人態度排名。

## 可借用的只讀驗收步驟

以下為整理者設計，未執行：
1. 使用已獲准的公開資料，列出題目鍵、產品版本、原回答路徑與拒答狀態。
2. 檢查缺列、重複鍵及原檔缺失，保留補檔日期。
3. 分開比較條件一致與不一致的資料；缺條件不自行補猜。
4. 把量表分數留作作者判斷，提供可回查原文及限制清單。

## 可貼指令（自設、未測）

只讀這份公開資料集。先核題目與產品鍵是否唯一、原檔是否存在，再列缺失、拒答、版本變更及補檔日期。不要向任何聊天網站發問、登入或抓取新輸出；不要由分數推論國家、文化或個人的價值。輸出附檔案路徑的稽核清單，未知欄保持未知。

## 權限、費用與可用性

讀公開檔案不需要啟用作者的代理流程。重跑可能涉及各平台方案、額度與條款；作者的特殊許可與花費未核。OpenAI歐洲消費者條款禁止自動或程式化擷取資料／輸出；Lumo與Mistral亦有自動使用及擷取限制。這些現行條款不證明作者當時的許可狀態，也不是對個案作法律判斷。本頁不提供自動詢問腳本或繞限額方法。

## 來源與實際查閱

- [原作者德文文章](https://de.linkedin.com/pulse/welche-werte-exportiert-ki-ein-experiment-mit-aus-den-andreas-v8bqe)：作者與日期、實作敘述。
- [同作者README](https://github.com/jojowanuby/LLM-Alignment-Atlas/blob/main/README.md)：方法與限制；同源不是第二次獨立驗證。
- [原始任務文件](https://github.com/jojowanuby/LLM-Alignment-Atlas/blob/main/Prompts/GrokBot%20Agent%20Job.md)；[公開CSV](https://github.com/jojowanuby/LLM-Alignment-Atlas/blob/main/GrokBot%20Workspace%20(copied%20from%20VM)/llm-alignment-summary-long.csv)；[補檔紀錄](https://github.com/jojowanuby/LLM-Alignment-Atlas/blob/main/GrokBot%20Workspace%20(copied%20from%20VM)/llm-alignment-summary_README.md)。
- [OpenAI歐洲條款](https://openai.com/policies/eu-terms-of-use/)（2026-01-16版本）、[Lumo條款](https://proton.me/lumo/terms)、[Mistral歐洲消費者條款](https://legal.mistral.ai/terms/eu-consumers-terms-of-service/)：本次查閱的使用限制。
- 本次讀原文、方法、資料結構及部分原檔，未逐項核285回答，未執行評測。與UC-012論文來源稽核、UC-064數學形式驗證不同；285筆及五產品合計只算一個工作流程。
