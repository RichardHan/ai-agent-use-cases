# 任務快捷搜尋返回

目標：比較多個任務的讀者。正式站依序按日報、會議，瀏覽器返回離開本站。方案 A 將明確快捷搜尋納入既有歷史（採用）；方案 B 增加站內上一組結果控制，介面及狀態成本較高。本輪不改搜尋召回、案例或證據。

| 尺寸 | 正式站修改前 | 本機預覽修改後 |
| --- | --- | --- |
| 390×844 | [手機](before-mobile.png) | [手機](after-mobile.png) |
| 1440×900 | [桌面](before-desktop.png) | [桌面](after-desktop.png) |

截圖為日報搜尋結果，非正式部署前後對照；環境不支援圖片目視判讀。預覽：`python3 scripts/preview.py /tmp/visitor-preview/ai-agent-use-cases && python3 -m http.server 8134 --directory /tmp/visitor-preview`，開啟 `http://127.0.0.1:8134/ai-agent-use-cases/`。

`node --test tests/*.test.cjs`：376 通過；`node --check assets/app.js` 和 `assets/reader.js` 通過。`python3 scripts/check_corpus_bundle.py /tmp/visitor-quality-20261029-preview/ai-agent-use-cases`：465 個來源逐 byte 一致。`SITE_URL=http://127.0.0.1:18765/ai-agent-use-cases/ QA_OUT=/tmp/visitor-quality-20261029-shots node tests/task-shortcuts-browser.cjs`：Chromium 1440、390、320、Firefox 390、WebKit 390 通過；載入、錯誤與部分載入復原通過。新返回測試修改前離站而失敗、修改後通過。axe 結果區與空結果掃描無 violations；未量測效能。獨立審查指出隔離 VM 舊測試未注入新增依賴；改以已有真實瀏覽器行為測試覆蓋，移除呼叫順序測試後全套通過。

三種模擬走查：比較日報與會議並返回／前進；組合工作情境、工具與排序後閱讀來源、返回及詳情直鏈重載；矛盾篩選產生空結果後編輯與重設。並非真人使用者研究。正式發布與部署後 Actions 尚未驗證；下一輪核對其他專用工作流程的 Pages 發布等待。
