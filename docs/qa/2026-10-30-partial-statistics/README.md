# 部分載入的網站統計

## 問題與決策

正式站走查時 121 筆已載入、344 個來源未載入；結果區有部分載入警告，頁尾網站統計卻僅顯示 121／0／0，未在數字旁說明範圍。目標是讓遇到載入中斷的訪客不把部分數字當成全站總數。

- A（採用）：統計旁標明僅計已載入條目及未載入來源數，補讀後更新。保留可用數字。
- B：隱藏不完整數字。較不易誤解，但失去目前可用資料的數量。

不改合格案例計數、內容、搜尋、資料或載入策略。來源數與條目數不是同一單位。

## 受控前後畫面

以相同版本的原始預覽與修改後預覽，封鎖全文整包及一個案例來源，其他來源正常載入；畫面不是正式站截圖。

| 視口 | 修改前 | 修改後 |
| --- | --- | --- |
| 1440px | [桌面](before-desktop.png) | [桌面](after-desktop.png) |
| 390px | [手機](before-mobile.png) | [手機](after-mobile.png) |

環境未提供影像目視判讀；文字與可見性由瀏覽器檢查。預覽：`python3 scripts/preview.py /tmp/preview/ai-agent-use-cases`，再用 `python3 -m http.server 8086 --directory /tmp/preview`，開啟 `http://127.0.0.1:8086/ai-agent-use-cases/`。

## 驗收

- 新增的部分統計瀏覽器斷言先在原版因找不到警示失敗；修改後驗證兩個來源未載入、補讀後剩一個、完整補讀後警示隱藏。
- `LOAD_URL=http://127.0.0.1:18186/ai-agent-use-cases/ LOAD_ENGINES=all node tests/load-recovery-browser.cjs`：Chromium 1440／390／320、Firefox 390、WebKit 390 五配置通過，含部分與零成功、逐次補讀、搜尋與篩選、空結果、焦點、詳情直鏈、重整及閱讀返回；報告中 axe 違規為零。
- `node --test tests/*.test.cjs`：381／381 通過；`node --check assets/app.js`、`node --check assets/reader.js` 通過；`python3 scripts/check_corpus_bundle.py /tmp/visitor-stat-preview/ai-agent-use-cases`：465 來源逐 byte 一致。
- 三個模擬情境：部分來源失敗後閱讀統計；補回一部分再補齊；搜尋與篩選後閱讀及返回。並非真人使用者研究。
- 獨立 reviewer 指出手機樣式隱藏新增段落，改為 span 並加上可見性斷言後複審無阻擋。
- `bundle exec jekyll build` 因無 Gemfile 失敗；本機未提供 Jekyll，實際 Pages build 與正式站部署需以 Actions 核對。未做實機、螢幕閱讀器、效能或視覺目視驗收。

最近主線 Pages 與多項 QA 成功；較早版本曾有瀏覽器 QA 與發布等待失敗，不能由最新成功推論所有 Actions 永遠穩定。正式站本次部分載入的整包回退原因尚未確定。
