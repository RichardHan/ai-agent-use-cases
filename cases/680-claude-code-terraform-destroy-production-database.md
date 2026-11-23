# UC-680：Claude Code 遷移架構誤觸 terraform destroy：因狀態脫鉤與自動批准致生產資料庫銷毀與快照救援

- 情境：開發
- 標籤：基礎架構、失敗復盤、資料庫、權限隔離
- 網站標題：Claude Code 遷移架構誤觸 terraform destroy：因狀態脫鉤與自動批准致生產資料庫銷毀與快照救援
- 一句話用途：DataTalks.Club 創辦人 Alexey Grigorev 在將新專案遷移至 AWS 時，讓 Claude Code 操作 Terraform；因更換筆電缺少本機狀態檔（.tfstate），Claude Code 在調解衝突時誤用舊備份狀態並執行帶有自動確認的 `terraform destroy`，刪除生產環境 RDS 資料庫（含 2.5 年作業、排行榜與近 200 萬筆紀錄）、VPC 與 ECS 叢集；資料並未永久遺失，最終靠緊急升級 AWS Business Support 由後台工程師從內部隱藏快照花 24 小時搶救復原。
- 核心目標：記錄 Coding Agent 在缺乏遠端狀態鎖與防銷毀保護機制下，誤判基礎架構狀態導致毀滅性刪庫的真實事故與根因防範。
- 分類／標籤：基礎架構事故／Terraform／生產資料庫刪除／狀態漂移
- 目標使用者：使用 AI Coding Agent 操作雲端基礎架構、CI/CD 與 Terraform 的工程師與 DevOps 人員
- 實作門檻：進階開發
- 首次收錄／最近查證：2026-11-23 09:15（台灣時間）
- 證據狀態：`author-demo`（系統負責人第一人稱公開事故復盤長文與時間線，經社群驗證；未由本庫獨立重現）
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：AWS 帳號憑證、本機 Terraform 設定檔、遺漏了 `terraform.tfstate` 的新電腦工作環境、將新專案共用既有生產環境基礎架構的指令。
- 輸出：非預期的全環境資源銷毀（RDS、ECS、VPC 均遭刪除），後續每月額外支付 10% AWS 商業支援費用經工程師人工搶救復原。

## 來源版本

### 來源A：Alexey Grigorev 部落格公開復盤

- 原始網址：[https://aishippingblog.com/how-i-dropped-our-production-database-and-now-pay-10-more-for-aws/](https://aishippingblog.com/how-i-dropped-our-production-database-and-now-pay-10-more-for-aws/)
- 發布日期：2026-02-26（UTC）；原文語言：英文。本庫讀取全文。
- 取得內容：
  1. 事故背景：作者試圖將 side project 部署至既有生產環境 AWS 以節省成本（Claude Code 曾主動建議拆分不同環境，但作者選擇共用）。
  2. 致命連鎖：因更換工作電腦，本機 `terraform.tfstate` 未同步；執行 plan 時 Terraform 誤認雲端無既有資源而計畫重複建立；為清理衝突，作者解開舊備份檔案引入舊狀態；Claude Code 提議「直接用 terraform destroy 最乾淨」，作者未細看計畫即同意；指令帶有自動確認（-auto-approve），導致生產環境 RDS（包含 2.5 年學生作業、排行榜與 194 萬筆紀錄）與 VPC 瞬間銷毀。
  3. 復原與代價：資料並非永久消失。作者緊急升級付費的 AWS Business Support（月費增加約 10%），由 AWS 後台工程師在 24 小時內從未公開的內部隱藏快照中完整還原資料庫。
- 事故反思：嚴禁在生產環境依賴本地狀態檔；IaC 工具操作時必須將備份與自動化刪除生命週期徹底解耦；不可授權 AI 代理使用自動批准（-auto-approve）執行具破壞性之指令。
- 缺口：本庫未重現刪庫操作；具體 AWS 內部快照保留政策屬雲端供應商未公開實作細節。

## 建議操作流程（本庫依來源整理之防範步驟；本庫未實測）

1. 基礎架構狀態遠端化：所有 Terraform 狀態必須存放於具備版本控制與狀態鎖的遠端後端（如 S3 + DynamoDB），嚴禁依賴本地 `terraform.tfstate`。
2. 關鍵資源宣告硬性銷毀保護：在生產環境 RDS、資料卷與關鍵儲存資源加上 `lifecycle { prevent_destroy = true }`，防止任何自動化腳本誤刪。
3. 備份與維運生命週期解耦：將自動快照與備份保留策略移出 Terraform 管理範圍，避免 destroy 時連帶刪除備份。
4. 嚴格限制 AI Agent 執行權限：Agent 的雲端 IAM 憑證僅限於唯讀或測試沙盒，禁止在生產環境賦予 `terraform destroy` 或刪除資源之權限；所有計畫必須由人類逐行審查。

## 可複製提示詞

以下為防範 Agent 誤執行破壞性基礎架構指令之系統約束範例，未實跑：

> 你是一個基礎架構審查助理。在分析 Terraform、雲端或容器設定時，嚴禁自主產生或執行任何帶有 destroy、delete、drop 或 auto-approve 的指令。若偵測到環境中缺少狀態檔或資源漂移，必須立即停下並列出受影響資源清單，要求使用者先行備份並手動確認。不可假設任何資源是可拋棄的。

## 所需連接、權限與限制

- AI Coding Agent 存取本機終端機與雲端 CLI 時，若具備寫入權限，具有極高爆炸半徑（Blast Radius）。
- 提示詞約束不能保證 100% 阻擋誤操作，核心防護必須落在 IAM 權限最小化與雲端資源防刪保護。
- 採用前必須確認有獨立於自動化工具之外的離線災難復原備份。

## 驗收與可重現性

- 可驗收：Terraform 程式碼中包含防銷毀保護規則；CI/CD 管線拒絕未經人類審批的 destroy 計畫。
- 本庫未重現。

## 去重與版本紀錄

- 2026-11-23 09:15 新增。與 UC-584（連線字串指向 prod）及 UC-681（Token 跨檔外洩）不同，本案核心技術點在於 IaC（Terraform）狀態脫鉤導致 destroy/recreate 誤判與 auto-approve 連鎖災難。
