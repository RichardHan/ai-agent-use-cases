# 搜尋直鏈載入時的同版索引入口

搜尋直鏈在全文停滯時捲到搜尋區；本機受控預覽中原有首頁索引連結在手機視窗上方 1239px、桌面上方 484px，搜尋區只有「正在讀取案例」。目標讀者是從分享搜尋連結進站、等待全文的訪客。

方案 A 在搜尋區載入時提供本站同版本索引，標明索引沒有全文搜尋與篩選（採用）；方案 B 製作輕量可搜尋索引，需維護額外資料與版本一致性，本輪不處理。搜尋語意、資料、來源與載入策略不變。

| 視窗 | 前 | 後 |
| --- | --- | --- |
| 390px | [載入前](before-mobile.png) | [載入後](after-mobile.png) |
| 1440px | [載入前](before-desktop.png) | [載入後](after-desktop.png) |

受控預覽阻止 corpus 回應並停用快取；搜尋區入口的頂端在手機 153px、桌面 158px。環境無法目視解讀圖片，不宣稱完成視覺比較。獨立審查指出載入完成時隱藏已聚焦連結會遺失焦點，且結果狀態可能位於畫面外；已改為先將焦點移至搜尋欄並新增可見性回歸。
驗證：`node --test tests/*.test.cjs` 369 通過、0 失敗；`node --check assets/app.js` 通過；`scripts/preview.py` 產生預覽，`scripts/check_corpus_bundle.py` 核對 461 來源逐 byte 一致。`ROUND_URL=http://127.0.0.1:8157/ai-agent-use-cases/ node tests/search-loading-fallback-browser.cjs`：390／1440px 載入備援、鍵盤、base path、焦點與篩選保留通過。`node tests/discovery-browser.cjs`：桌面、390、320px 搜尋、組合篩選、空結果、直鏈、返回與 axe 0 違規；`node tests/search-submit-history-browser.cjs`：390／1440px 通過。三種模擬情境：慢載搜尋直鏈轉索引；正常搜尋疊加篩選及空結果復原；案例直鏈重新整理及返回。非真人使用者研究。

預覽：`python3 scripts/preview.py /tmp/preview/ai-agent-use-cases`，再執行 `python3 -m http.server 8081 --directory /tmp/preview`，開啟 `http://127.0.0.1:8081/ai-agent-use-cases/`。此預覽未渲染 Jekyll 的 INDEX.html；連結目的頁需以正式 Pages 驗證。未量測慢網路實際速度、實機或螢幕閱讀器；未完成獨立色彩對比審查。
