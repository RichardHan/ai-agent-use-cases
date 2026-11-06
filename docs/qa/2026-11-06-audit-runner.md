# Audit summary QA 執行環境

基準：`d0eed89aac2aa75b428e212b09cd8bdf4d2c4ec4`。正式站 `catalog.json` 的 `sourceRevision` 當時一致；Pages [run 42143312694](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42143312694) 成功。[Audit summary run 42143315388](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42143315388) 在安裝瀏覽器依賴時，Ubuntu apt 下載持續至 30 分鐘 job 取消，尚未執行測試；日誌顯示下載進度，無法據此判定服務端根因。

方案：使用 Playwright 官方 noble 映像與對應 npm 套件，省去每次 apt 和瀏覽器下載；保留 Jekyll、三引擎與發布檢查。官方 registry 當時可取得 1.60.0-noble，無 1.64.1-noble，故此 workflow 的 Playwright 從 1.64.1 改為 1.60.0。繁中字型沿用 Website QA 的下載方式。此改動不保證外部 registry、npm 或字型服務可用。

首次 PR [run 42157745864](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42157745864) 成功完成安裝、單元測試與 Jekyll，但 Firefox 因容器的 HOME 擁有者不符而無法啟動；三引擎步驟設定 `HOME=/root`。獨立審查指出正式站步驟須保留原 HOME，以免 Git 安全目錄設定失效；該步驟只使用 Chromium。

[run 42158014167](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/42158014167) 的三引擎摘要檢查通過，但 reader 回歸在舊版 1.56.1 WebKit 導航時崩潰；改用 1.60.0，需完整驗證。

基準：`node --test tests/*.test.cjs` 394 通過、0 失敗；`node --check assets/app.js` 與 `python3 scripts/preview.py` 成功。本機無 Docker，容器、Jekyll 與三引擎必須依實際 Actions 結果驗證；本機正式站載入後可見案例，非真人研究。其他 workflow 沒有更動。

下一輪：核對首頁歷史合格數與最新網站資料的日期差如何呈現；先比較正式站 `audit-summary.json`、`catalog.json` 與現有標籤，勿推算新的合格案例數。