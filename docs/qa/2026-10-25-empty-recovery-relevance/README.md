# 空結果捷徑與保留條件一致

## 問題與方案

正式站 390px 搜尋 `no-task-987654` 加「生活」得到零筆，卻仍提供「代碼審查」捷徑；點擊後保留「生活」，仍是零筆。目標讀者是依問題而非工具名稱探索的新訪客。

- A：只顯示在目前篩選下實際有結果的任務捷徑；保留原條件，計算成本僅發生於空結果。**採用**。
- B：點捷徑時自動清除衝突篩選；能抵達結果，但暗中改變使用者選擇，未採用。

驗收：空結果捷徑均可抵達非零結果、其他條件不變；無可行捷徑時明示調整篩選且保留重設入口；搜尋直鏈、詳情重新整理、返回與手機鍵盤可用。非範圍：案例資料、詞典、分類體系、Pages 部署架構。

## 前後對照

| 390px 空結果 | 畫面 |
|---|---|
| 正式站修改前 | [before-mobile.webp](before-mobile.webp) |
| Pages 相容本機預覽修改後 | [after-mobile.webp](after-mobile.webp) |

前後取同一查詢／情境；正式站當時部署版本可能落後於 repo `main`，故對照只證明觀察到的行為，不當成精確同 SHA 的視覺差異。預覽：`python3 scripts/preview.py /tmp/ai-usecase-preview-round` 後以 `python3 -m http.server 8099 --directory /tmp` 開啟 `http://127.0.0.1:8099/ai-usecase-preview-round/`。實際 Pages 仍須當次部署確認。

## 驗收

- 修改前：正式站 390px 「生活」＋無效詞提供八個捷徑；「代碼審查」點後仍零筆。單元回歸先紅：預期僅 `日報`，實際八個。
- 修改後：390px 同條件不再提供「代碼審查」，鍵盤 Enter 選「日報」保留「生活」並得到 11 筆；URL 含 `q=日報&scenario=生活`、焦點在結果摘要。桌面 1440px 詳情 UC-402 直鏈、重新整理後關閉返回保留 11 筆。
- 390px 零可行捷徑仍有重設；1440px 空結果 axe-core 4.13.0：0 violations、2 incomplete、41 passes。桌面和手機無水平溢出。UC-001 來源為公開 GitHub 連結，`target=_blank`、`rel=noopener noreferrer`；未驗證外站可存取性。
- 三情境：生活＋無效詞改選可行任務；生活＋日報開詳情並返回；零可行建議改調篩選（單元 fixture）。均為模擬操作，非真人轉換證據。

## 測試與限制

基準 `node --test tests/*.test.cjs`：351 通過。修改後 `node --test --test-reporter=dot tests/*.test.cjs`：350 通過（移除一項鎖定舊文案的斷言，替換固定八捷徑測試為實際匹配行為）。`for file in assets/*.js tests/*.cjs; do node --check "$file" || exit; done`：退出碼 0。`python3 scripts/check_corpus_bundle.py /tmp/ai-usecase-preview-round`：450 個來源逐 byte 相同。Playwright 本機缺套件，`combined-recovery-browser.cjs` 未能執行；Safari/Firefox 與正式 Pages 部署待驗證。本機無獨立 lint/type check/npm build，也沒有 Jekyll；Python 預覽不能代替 Jekyll build。文字對比未另量測，不宣稱達標。

## 獨立審查

非主要實作者只讀審查：未發現新增阻擋缺陷；查詢判定沿用結果列表的 tokenizer、filterEntries、facets，部分載入只依已讀內容計，沒有新網路請求、儲存或 HTML 注入。另發現首頁「代碼審查（PR）」用 `q=PR`、搜尋區用 `q=代碼審查`；`PR` 可能命中 `privacy`，列為下一輪。正式站已有資產版本一致性等待失敗；本輪不宣稱 Actions 全綠。
