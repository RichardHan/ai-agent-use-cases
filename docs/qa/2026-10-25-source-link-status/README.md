# 2026-10-25 UC-324 來源可用性與證據狀態

## 決策與方案

問題：UC-324 詳情列出公開 GitHub 程式庫與 PR，第一次點開原始 repository URL 時，GitHub 顯示「Page not found」；頁面原本沒有說明來源目前無法重新核對，容易讓讀者把 10 月 18 日的歷史查讀誤認成現在仍可取得的佐證。

目標讀者：從案例詳情檢查原始來源、評估自動化維運流程的訪客與工程師。

1. **方案 A（採用）：保留歷史來源與連結，明確標出目前無法開啟及歷史查讀日期。** 保留來源脈絡與原始 URI，不把曾查讀過的事實抹掉；代價是讀者仍可能點入目前無法存取的舊連結。
2. **方案 B：刪除程式庫與 PR 的來源段落，只保留作者 X 貼文。** 可消除失效連結，但會丟掉原來留下的公開產物查讀紀錄，且無法再看出案例過往的證據邊界。

採用 A：維持可追溯性，並清楚限制目前證據狀態；沒有推測 repository 是否刪除、改名或設為私有，也沒有補寫新成果。

## 證據與變更

- 修改前正式案例直鏈：[UC-324](https://richardhan.github.io/ai-agent-use-cases/?case=UC-324)。詳情的來源 B 只標示「公開程式庫與 PR」，未說明可用性。
- 直接開啟 `https://github.com/tomoyk/failure-reports` 後，GitHub 頁面標題為「Page not found · GitHub · GitHub」。這只證明本輪無法開啟，不能判定 repo 為何不可見；本輪沒有逐一重驗 PR 連結。
- `cases/324-daily-outage-digest-verified-incident-db-pr.md`：在證據狀態、來源標題、repository 連結標籤與來源段落加入 2026-10-25 的無法開啟提示，並明確將 repo／PR 描述限縮為 2026-10-18 的歷史查讀。
- 案例實際報告、作者自述、原始連結與 UC-212 去重標記未更動；沒有新增案例或宣稱成果已獨立驗證。

## 驗收

- 先在正式站重現來源問題，再以更新後的本機 Pages 相容預覽直鏈打開同一案例。
- 1440×1000 桌面與 390×844 手機：詳情直鏈可開；來源區明確呈現「Page not found」和歷史證據限制；GitHub repository URI 保留。桌面文件／視窗寬度 1440/1440，詳情容器 848/848；手機文件寬度 390、詳情容器 356/356，無水平溢出。
- 搜尋與組合篩選走查：`收件匣` + `生活` + `入門對話` 顯示 29 張案例卡；開啟首張 UC-303 並按 Escape，29 張卡與三項條件保留，焦點返回原案例按鈕。
- 回歸：`node --test tests/*.test.cjs`（修改前基準 331/331 通過；修改後驗收重跑見交付紀錄）。
- Pages 相容預覽：`python3 scripts/preview.py /tmp/uc324-source-preview`；完整來源核對：`python3 scripts/check_corpus_bundle.py /tmp/uc324-source-preview`；JavaScript 語法基準：`node --check assets/app.js`、`node --check assets/reader.js`。本輪沒有變更程式碼或資料集結構。

## 截圖

|尺寸|修改前（正式站）|修改後（本機 Pages 預覽）|
|---|---|---|
|桌面來源區（CSS 視窗 1440×1000）|[before-desktop-source.png](screenshots/before-desktop-source.png)|[after-desktop-source.png](screenshots/after-desktop-source.png)|
|手機來源區（CSS 視窗 390×844）|[before-mobile-source.png](screenshots/before-mobile-source.png)|[after-mobile-source.png](screenshots/after-mobile-source.png)|

## 限制與下一步

- 本機瀏覽器能確認 GitHub 顯示 Page not found；無權限讀取 GitHub repository API（HTTP 403），因此無法判斷連結不可見的原因，也沒有獨立驗證 PR #40/#36。
- 當前 Actions 批次 `9f55525` 出現多個紅燈；調查到部分 live QA 在該 SHA 的 Pages 部署完成前已啟動，另有 preview/browser job 失敗但本輪沒有可讀取的失敗 log。不要把來源註記改善冒稱為 CI 修復。
- 下一輪優先處理：取得可讀的 Actions job logs，分開重現 Pages 部署競速與 preview/browser 失敗，再修正已確認的共用原因；保留嚴格資產一致性驗證。
