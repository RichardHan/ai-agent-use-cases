# 慢載入時的任務入口

問題：正式站靜態索引不依賴 JavaScript，但首次造訪者只有章節跳轉，無法依任務直接開始閱讀；它也不提供全文搜尋或篩選。對象是主站資料載入緩慢、轉到靜態索引的訪客。

比較：可產生同版本輕量搜尋索引，覆蓋任意詞但需維護資料與版本一致性；或提供少量靜態任務入口，無需腳本但不是完整分類。本輪採後者，並說明瀏覽器頁內尋找涵蓋歷史紀錄、不能取代全文搜尋。未改案例資料、證據等級或案例數。

驗證：新增測試先對正式站失敗（無任務入口）。本機以 Kramdown GFM 模擬渲染，在 390／1440px 禁用 JavaScript，以鍵盤開啟四個案例入口；這不是完整 Jekyll build。原工作樹未提交內容保留在原處。原本的全套 Node 測試 368/368 通過；更新後亦 368/368 通過。搜尋走查 Chromium 1440／390／320 與 Firefox 390 通過；本機 WebKit 的焦點檢查在 `filter-summary`／`search-submit` 既有差異失敗，與先前 `2026-10-29-index-navigation` 紀錄一致。Reading flow 在本機 WebKit 另一焦點斷言失敗，前面的 Chromium、Firefox 檢查已執行；沒有聲稱全綠。

獨立審查指出 `.html` 直接連結會破壞 GitHub 上的 Markdown 閱讀，已改用現有 `.md` 連結慣例；實際 Jekyll build 的四個入口均已測試，正式發布仍需檢查。桌機與手機的修改前後截圖存於 `/tmp/index-{before,after}-{desktop,mobile}.png`；後者為 Kramdown 模擬並套用正式站樣式，非正式部署，且主 agent 與獨立審查均無法讀取圖像以完成視覺比較。

Actions：PR #167 Reading flow QA 的外部 GitHub 來源在第二次重複 GET 時逾時。本輪移除重複 GET，仍等待實際新視窗載入並核對目的地；初次外部導覽仍依賴網路。不能據此保證該工作流不再逾時。

PR #168 的 Reading flow QA 首次雲端執行通過；Website QA 首次因預覽伺服器未掛載 `/ai-agent-use-cases` 而取得 404，並非案例不存在。修正 base path 後，[Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40825382767) 的 Jekyll build、語料檢查及四個靜態入口測試通過；[Reading flow QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40825382622) 也通過。PR 尚未發布，兩項工作的正式站檢查按設定跳過。
