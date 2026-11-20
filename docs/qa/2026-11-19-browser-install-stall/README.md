# 2026-11-19 瀏覽器安裝不再把字型下載的沉默吃滿 job

## 問題

案例 PR [#468](https://github.com/RichardHan/ai-agent-use-cases/pull/468) head `18d675e3` 的 [Reader search QA 44434645064](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/44434645064) 被標成 fail。job `reader-search` 01:08:53 開始、01:39:05 取消，`timeout-minutes` 是 30。

安裝步驟日誌：

- `npm install` 5 秒完成
- `playwright install --with-deps` 的 apt 有完成的 Get 間隔，最長 121 秒，瀏覽器 zip 在 01:29:14–01:29:28 下完
- `sudo apt-get install -y fonts-noto-cjk` 在 01:29:31 印出 `Get:2 … [61.2 MB]` 後沒有下一行，直到 job 被取消
- apt 不會在單一套件下載中途印位元組，所以這 9 分 34 秒不能分成「斷線」或「慢速仍在傳」

同一 push 的 [Source guide QA 44434645116](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/44434645116) preview 成功，32 分 39 秒，上限 35 分。`--with-deps` 約 22 分（126 MB），同一套字型 3 秒裝完。更早的 [44431013402](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/44431013402) 在 01:09 被取消，時間對上 01:08:50 的新 push，是 `cancel-in-progress`，不是這次的 job 上限。

main 的 Website QA 與 Pages 對 `de6247c0` 是 success。這不是目前主線故障。

## 方案

A. 只把 30／35 分再加長。慢速下載有機會跑完，但 15→30 已經做過，這次仍在安裝中被取消，日誌仍沒有位元組。

B. 安裝改看 apt 快取有沒有成長。180 秒沒有成長就中止該次並重試，最多 3 次。有成長就讓它繼續，單次最多 15 分，不把已下載的位元組清掉再重來。job 上限提到能蓋過已觀測的 22 分 `--with-deps`、一次完整字型嘗試、其餘停滯重試，以及該 job 的瀏覽器步驟，並且仍低於發布等待。三個引擎與 `fonts-noto-cjk` 都留著。

選 B。不把 180 秒無成長當成已證明的斷線；PR 上的 cache bytes 日誌才是分辨。

## 不處理

其餘仍直接 `apt-get install fonts-noto-cjk` 的 workflow。分類說明 PR #470 已合併為 `ab485f8e`，本輪不重做。每日研究 PR 也不在這輪。

## 驗收

單元：基準 916 → 921 pass／0 fail（`node --test tests/*.test.cjs`）。新測試實際跑安裝腳本：無成長會被中止並在第二次成功、快取持續變大不會被標成停滯、單次上限到了就失敗且不開下一次、`chromium firefox webkit` 會原樣交給 playwright。生產預設仍是停滯 180 秒、單次 900 秒、最多 3 次。兩支 preview job 蓋得住慢速路徑且不超過 70 分，published job 仍是 80。

實際 workflow 結果寫在 PR 留言，不在這份檔案裡預填。
