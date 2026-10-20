# UC-383：讓 Grok Bot 當外部 QA 觀察員，把失敗的排程檢查變成可追溯問題單，不讓它直接合併或接管派工

- 網站標題：網站部署成功，但背景檢查一直紅燈？讓 Bot 分清失敗工作，再交出有證據的問題單
- 一句話用途：公開專案維護者把 Grok Bot 限定為外部 QA；它發現 GitHub 排程的 PR 活性檢查因權限遭拒，留下問題單，由既有開發流程修復。修復 PR 與後續觀察員規範可查，不把網站上線、單元測試通過與排程恢復混為一談。
- 工具：Grok Bot／GitHub Issues／GitHub Actions；不是 Grok Build CLI
- 情境：開發
- 標籤：CI、問題單、權限、驗收
- 分類／標籤：開發／CI監看／問題單／權限邊界／驗收
- 作者：GitHub 維護者 krisztiankoos；部分後續問題單由 cursor[bot] 發布，產品歸屬另由維護者 #6742 與公開 runbook 說明
- 原文日期：2026-08-13 至 2026-08-14（UTC）；本輪為舊案例補收錄
- 查閱日期：2026-10-20 16:00（Asia/Taipei 批次）
- 原文語言／平台：英文／GitHub 公開專案、Issues、Pull requests
- 證據狀態：B級 author-demo，作者實作自述＋公開問題單、已合併 PR 與操作規範。獨立核對公開產物存在及狀態，不等於獨立重現執行。

## 問題與實際結果

[問題單 #6717](https://github.com/learn-ukrainian/learn-ukrainian.github.io/issues/6717) 記下排程工作、當時 commit、數個失敗 run，指出是 PR 活性檢查遭 GitHub 403 拒絕，不是 Pages 部署失敗。維護者在[評估 #6742](https://github.com/learn-ukrainian/learn-ukrainian.github.io/issues/6742) 明確將這次發現歸給 Grok Bot，並決定保留外部 QA 角色，不把它接成另一個派工或合併者。

[修復 PR #6719](https://github.com/learn-ukrainian/learn-ukrainian.github.io/pull/6719) 同樣註明由 Grok Bot 發現。它改用非管理員路徑取得必需檢查，對排程剩餘 403 作明示跳過，而非擴成管理員憑證。公開 API 顯示於 2026-08-13 16:06:39 UTC 合併。PR 自報 13 項測試通過，但「下一輪排程確認」仍未勾選；本輪沒有追跑該歷史排程，不能稱全鏈路恢復。

[規範 PR #6774](https://github.com/learn-ukrainian/learn-ukrainian.github.io/pull/6774) 於 2026-08-14 00:13:14 UTC 合併，將職責寫入 [runbook](https://github.com/learn-ukrainian/learn-ukrainian.github.io/blob/main/docs/runbooks/grok-bot-qa-observer.md)：讀取 Actions／網站訊號，依已授權範圍開問題單；不合併、不派工、不寫主要工作目錄。排程在產品端配置，文件本身不會啟用排程。

另外抽查 [#6760](https://github.com/learn-ukrainian/learn-ukrainian.github.io/issues/6760) 與 [#6761](https://github.com/learn-ukrainian/learn-ukrainian.github.io/issues/6761)，可見具體程式位置、驗收與不改動範圍，並明寫只要問題單、不要實作。這是同一 QA 工作流程的產物，不拆成額外案例；未逐一驗證全部 #6760–6768。

## 建議操作步驟（本庫設計，未實跑）

1. 指定一個有權讀取的 repo、需觀察的工作名稱與頻率；先查既有問題單，避免同次失敗重複開單。
2. 每次按 run ID、commit、事件與 job 比對，分開網站部署、測試、背景維護等結果。讀取遭拒必須說明缺口。
3. 整理最小證據：錯誤、來源連結、首次／最近觀察、影響與尚未確認項目。不把日誌中的猜測寫成根因。
4. 先交問題單草稿；只有使用者明確授權此 repo 的公開回報範圍後，才能發布。修復交既有維護流程，不自行加權、合併或執行正式維護命令。
5. 修復後分開核對 PR 合併、測試、下一次真實排程；跳過與成功不同。需要持續驗收時另確認觀察期限。

## 可貼指令（本庫原創，非作者原文）

請只讀檢查［repo］的［工作名稱］最近［時間範圍］執行與既有問題單。依 run ID 和 commit 去重，把部署成功、測試通過、背景工作失敗、因權限跳過分開。每個異常附 job、錯誤摘要、來源連結、影響及缺口，先在此交問題單草稿。沒有授權不得發文、改碼、合併、改工作流程、擴權或啟動本機命令。已修復者必須再看指定排程實際結果；僅 PR 合併或測試通過不能宣稱恢復，資料讀不到不能回報正常。不要貼憑證、私人資料或完整敏感日誌。

## 權限、費用與可用性

- 觀察需要相應 repo／Actions 讀取權限；發公開問題單屬另一項寫入授權。私有 repo 的內容不能因回報而外洩。
- [官方概覽](https://docs.x.ai/grok-bot/overview) 支持雲端電腦、連接工具與排程工作的通用能力，沒有保證此案例的 QA 準確率或指定 GitHub 工作一定可讀。官方說明 Bot 共用帳戶的雲端電腦，不是安全隔離邊界。
- 作者未提供本流程實際費用；需有可用的 Grok Bot 方案與額度，GitHub Actions 另受 repo 設定／額度影響。不以作者八月方案描述當今日價格。
- 這不是可直接裝上的官方 QA 套件。不要把 `cursor[bot]` 身分單獨當作產品辨識證據；此例由維護者的明確歸屬補足。

## 驗收與去重

驗收重點是可追溯失敗工作與證據、既有單去重、明確交接、修復後真實排程結果，以及觀察員沒有越權。案例不同於 UC-005「需求→實作 PR→獨立審查」，也不同 UC-057 自架 runner 或 UC-096 正式服務日誌初判；本例不啟動實作，以既有 CI 的具體失敗交接為完成輸出。

本輪未重跑原專案、未確認歷史後續排程、未讀取任何私有專案。只新增一個合格工作流程，不把多張問題單或修復步驟重複計數。
