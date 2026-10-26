# 無關鍵字時收起命中範圍控制

正式站首頁未輸入搜尋詞時，結果區仍顯示停用的「只看標題與用途命中」及整段解釋；390px 與 1440px 實際 Chromium 走查均重現。目標是第一次從首頁瀏覽或依情境篩選的訪客：沒有查詢詞時不讓無法操作的搜尋範圍分散注意力，有搜尋詞時仍能選擇全文或標題／用途命中。文字命中不等於真正解決問題或獨立驗證。

- A（採用）：沒有有效查詢詞時隱藏整組範圍控制；有詞時顯示。清空（含空白）重設勾選及 URL `scope`。成本是控制可見性的狀態轉換與測試，保持原搜尋語義、資料與 Pages 路徑。
- B：無詞時保持停用控制但縮短說明。變動小，仍留下不能使用的選項與視覺噪音。

本輪不處理語意相關性、來源快照固定或全站版面重設。驗收：首頁無詞不見範圍控制；輸入詞可見並維持 23→9 的會議搜尋；選中後清空再輸入不殘留範圍；桌面／手機組合情境、空結果、詳情直鏈重載、Escape 返回、鍵盤焦點與分享 URL 可用。

| 視口 | 修改前正式站（無詞） | 修改後本機預覽（無詞） |
|---|---|---|
| 390×844 | [控制停用仍可見](before-390.png) | [控制收起](after-390.png) |
| 1440×844 | [控制停用仍可見](before-1440.png) | [控制收起](after-1440.png) |

兩組截圖都將結果摘要置於相同視口位置；正式站與本地預覽的發佈資料可能不同。預覽：`python3 scripts/preview.py /tmp/visitor-contextual-scope/ai-agent-use-cases && python3 -m http.server 8112 --directory /tmp/visitor-contextual-scope`，開啟 `http://127.0.0.1:8112/ai-agent-use-cases/`；輸入「會議」比較控制。這是 Pages 相容靜態預覽，不是 Jekyll build。

驗證：正式站 Chromium 390px 無詞控制可見（問題重現）；本地 390px/1440px 無詞控制隱藏、無水平溢出。`NODE_PATH=/tmp/visitor-browser-tools/node_modules SEARCH_SCOPE_URL=http://127.0.0.1:8112/ai-agent-use-cases/ node tests/search-scope-browser.cjs` 兩視口 PASS（全文 23、收窄 9），包含勾選後空白清除／重新輸入、組合工作情境、空結果復原承諾數、分享、詳情直鏈重載與 Escape 返回，axe WCAG 2 A/AA、2.1 AA 零 violations。`node --test tests/*.test.cjs`：353 pass／0 fail；`for f in assets/*.js tests/*.cjs; do node --check "$f" || exit 1; done` 通過；`python3 scripts/check_corpus_bundle.py /tmp/visitor-contextual-scope/ai-agent-use-cases`：450 來源逐 byte 相同。沒有獨立 lint/type-check，本機未執行 Jekyll build。

三種模擬情境：① 初訪者先看首頁收錄，再輸入會議收窄閱讀；② 工作使用者選情境、開詳情直鏈與來源後返回；③ 無結果使用者選復原建議。此為流程檢查，不代表真人偏好或轉換率。獨立 review 未發現此次改動的功能或資料風險，建議加測已勾選後清空與重輸入，已納入回歸；Back/Forward 歷史狀態尚未單獨覆蓋。主分支目前有多項既存瀏覽器 Actions 失敗，Pages 部署成功不等於 QA 全綠；合併後仍需核對正式站。

下一輪最值得做：定位主分支瀏覽器 QA 共通失敗根因，避免正式站發布成功卻缺少完整旅程保證。
