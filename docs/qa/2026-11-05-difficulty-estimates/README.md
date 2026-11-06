# 2026-11-05 實作門檻推估限制

基準：`827b35a21c9cc59ab72038e337b03c1cfdc3819f`；[正式站](https://richardhan.github.io/ai-agent-use-cases/)。未修改原工作樹或其他 worktree。交付版本及 PR、Actions 狀態以 GitHub 紀錄為準。

## 問題與選擇

正式站 UC-413 標為「入門對話／免寫程式」，但原文需要代理登入家用路由器，登入方式與權限不明。`extractDifficulty` 以關鍵字推估，未匹配時回落入門；分類不是逐案核實。完整逐案審核可改善準確性，但需要核對全庫且不宜猜測。此輪先在抽卡、篩選和詳情揭露推估限制及帳號、設備、授權可能仍有要求，不改分類或原始資料。

## 檢查

- 基準與變更後 `node --test tests/*.test.cjs` 各 394 通過；`node --check assets/app.js` 通過。
- `python3 scripts/preview.py /tmp/ai-agent-focused-preview/ai-agent-use-cases` 與 `python3 scripts/check_corpus_bundle.py /tmp/ai-agent-focused-preview/ai-agent-use-cases`：493 個來源逐 byte 一致。這是本機預覽而非 Jekyll Pages build。
- Chromium 本機 Pages 子路徑：旅遊入口找到 UC-001；搜尋無結果加門檻後清除全部可恢復；UC-413 分享直鏈重整、來源連結呈現、返回保留查詢；390px 無水平溢出，搜尋 Tab 到查看結果。來源外站是否可用未驗證。
- 獨立審查指出選單與抽卡按鈕未關聯說明；已補 `aria-describedby`。瀏覽器觀察確認抽卡按鈕可取得警語，選單屬性包含警語 ID。未以真人輔助技術或使用者研究驗證。
- 同頁詳情前後截圖：`difficulty-before-desktop.png`、`difficulty-after-desktop.png`、`difficulty-before-mobile.png`、`difficulty-after-mobile.png`；預覽為本機，非正式站。
- 主線 [Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41946674624)、[Facet counts QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41946674552) 與 [Pages 部署](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/41946674184) 在基準 commit 成功；歷史失敗不代表目前仍存在。

## 下一輪

門檻仍是啟發式、可能錯分；先抽樣核對各類別案例與實際權限需求，再評估可維護的人工標註，不將「免寫程式」視為已驗證。待查狀態和來源 QA 分別已有 [PR #210](https://github.com/RichardHan/ai-agent-use-cases/pull/210)、[PR #216](https://github.com/RichardHan/ai-agent-use-cases/pull/216)，避免重複實作。
