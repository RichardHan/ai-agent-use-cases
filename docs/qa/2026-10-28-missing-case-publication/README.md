# 共享案例發布驗收與閱讀按鈕名稱

目標：讓搜尋後閱讀共享案例的訪客，不因 Pages 尚在部署就收到錯誤的 QA 失敗訊號。舊流程固定 451 次、每次 2 秒，約 15 分鐘；先前 Pages 有 22 分 29 秒的發布紀錄。Missing shared case QA #154 的本機檢查通過，發布資產比對在 15:12 失敗；目前主分支最新同項工作成功，本輪針對可重現的時限落差，不宣稱修好其他 Actions。

- A：延長工作流程內的獨立迴圈。改動少，仍有重複的超時／版本核對邏輯。
- B（採用）：沿用 `scripts/published-assets.cjs` 的 25 分鐘上限、逐 byte 比對、每輪主分支版本核對及請求超時，工作預算 45 分鐘涵蓋瀏覽器安裝與走查。成本是共用 helper 成為依賴。

驗收：同版本三項資產才執行公開站瀏覽器走查；過期主分支跳過；真正逾時或不可查主分支須失敗。實際本機瀏覽器走查另發現 `axe` 的 `label-content-name-mismatch`：案例卡片的 `aria-label` 完全蓋掉可見的「看看怎麼用 →」；無障礙名稱現在保留可見文字及案例 ID／標題。這不改版面、搜尋排序、資料或部署速度。原先測試中要求舊迴圈文字的斷言已移除，保留共用 helper 的行為測試。

前後畫面：手機首頁 [修改前](before-home-mobile.png)／[修改後](after-home-mobile.jpg)；缺失案例手機 [修改後](after-missing-mobile.jpg)、桌面 [修改後](after-missing-desktop.jpg)。卡片外觀不變，差異在輔助科技的名稱與部署 QA；不能冒稱視覺改善。預覽：`python3 scripts/preview.py /tmp/ai-visitor-preview/ai-agent-use-cases`，`python3 -m http.server 8139 --directory /tmp/ai-visitor-preview`，開啟 `http://127.0.0.1:8139/ai-agent-use-cases/`。

驗證：`node --test tests/*.test.cjs` 最終 364／364；`node --test tests/published-assets.test.cjs tests/published-check.test.cjs` 9／9；修改後本地 HTTP 比對 `assets/app.js` 與 `assets/style.css` 回傳 `LOCAL_PUBLISHED_ASSETS_MATCHED`；`node --check assets/app.js scripts/published-assets.cjs` 通過；預覽 457 個來源 byte-for-byte 相同。`CASE_URL=http://127.0.0.1:8139/ai-agent-use-cases/ CASE_LIVE=1 node tests/missing-case-browser.cjs`：修正前 Chromium 1440 因無障礙名稱失敗；修正後 Chromium 1440／390／320、Firefox 390、WebKit 390 均通過，五組 axe 違規 0，包含搜尋＋情境、來源外鏈、缺失直鏈重載、空結果、鍵盤返回。桌面一次外部來源回應 429，其餘 200；不能宣稱來源服務穩定。獨立 review 發現兩處舊迴圈的文字斷言會讓 CI 提早失敗，移除後全套通過。本機預覽單次 LCP/FCP 228ms、CLS 0；不能外推正式站。

限制：未在本輪新 SHA 上完成 Pages 發布及 25 分鐘真實等待；獨立 review 僅靜態檢查。下一輪優先收斂其餘公開站 QA 的發布閘門，避免短迴圈再次競速。
