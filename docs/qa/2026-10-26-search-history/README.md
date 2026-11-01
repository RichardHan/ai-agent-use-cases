# 提交搜尋後可返回前一組條件（2026-10-26）

目標讀者：先找「旅遊」，再比較「郵件」做法的初訪者。正式站在 `?q=旅遊#explore` 改輸入並提交「郵件」後，輸入即時更新用 `replaceState` 覆寫原 URL；瀏覽器 Back 無法回到旅遊結果。詳情頁 Back 已支援，但搜尋間沒有可返回的節點。

- 方案 A：每次鍵入都新增歷史紀錄；實作簡單，Back 卻逐字倒退，放棄。
- 方案 B（採用）：鍵入仍即時更新結果與網址，按 Enter／「查看結果」才把原條件與新條件分成兩筆歷史。成本是必須保留鍵入前的網址並處理詳情關閉；篩選本身仍在當前歷史節點修改，不宣稱逐步返回每次篩選。

不處理全文相關性、篩選逐步歷史、來源資料或外觀改版。舊搜尋和新搜尋的情境、排序等條件仍保留；直接連結與重新整理沿用既有網址狀態。

| 畫面 | 截圖 |
| --- | --- |
| 正式站修改前，390px 搜尋入口 | [before-mobile.webp](before-mobile.webp) |
| 本地預覽修改後，390px 搜尋入口 | [after-mobile.webp](after-mobile.webp) |
| 本地預覽修改後，1440px 搜尋入口 | [after-desktop.webp](after-desktop.webp) |

這是瀏覽器歷史行為改善，畫面本身不預期改變；截圖只記錄實際檢查的搜尋表面，不能證明返回行為。可預覽：`python3 scripts/preview.py /tmp/visitor-history-preview/ai-agent-use-cases`，`python3 -m http.server 18998 --directory /tmp/visitor-history-preview`，開啟 `http://127.0.0.1:18998/ai-agent-use-cases/?q=旅遊#explore`。本地預覽的來源版本與正式 Pages 發布 SHA 不同，不能把預覽原始 Markdown 版本宣稱為正式版本。

PR #145 的 Return visibility QA 在瀏覽器下載／系統依賴安裝步驟耗盡 25 分鐘後取消，測試未啟動；同 PR 的 Website QA 等已通過。將此工作流的兩個 job 改用 repo 既有的 Playwright 1.64.1 容器，保留獨立暫存套件與 Git safe-directory 設定；重跑結果以 GitHub Actions 為準。
重跑後 Return visibility QA 約 1 分 28 秒通過；Reader QA 又在相同的瀏覽器安裝步驟耗盡 30 分鐘，未進入測試。Reader QA 也改用已預裝三引擎的同版容器；仍需新一輪 CI 核對，不能把其他通過的工作流當作它的結果。

正式站修改前瀏覽器重現：旅遊 → 郵件提交 → Back 離開搜尋狀態。修改後本地 390／1440px：旅遊＋生活 → 郵件提交 → Back 還原旅遊、生活、結果 → Forward 還原郵件；郵件詳情 → Back 回郵件；UC-001 直鏈關閉後提交新搜尋，Back 不會重新開啟已關閉的詳情；不存在字串有空結果且無水平溢出。鍵盤 Enter、來源連結與跨瀏覽器 QA 仍須以 CI 回歸核對。獨立審查指出 VM 無 `location` 與詳情關閉後舊 `case` 參數兩項風險，已修正並針對直鏈實際走查。

回歸命令：`node --test tests/*.test.cjs`、`node --check assets/app.js`、`python3 scripts/check_corpus_bundle.py /tmp/visitor-history-preview/ai-agent-use-cases`；CI 的 Website QA 在 Chromium 390／1440px 執行 `tests/search-submit-history-browser.cjs`。下一輪優先讓搜尋篩選與排序可分階段返回，但需先定義何者算明確提交，避免 Back 堆滿操作碎片。

2026-10-26 PR整合驗證：合併最新main後362/362測試通過；Chromium 390/1440搜尋Back/Forward通過；搜尋提交完整回歸在Chromium（320/390/1440）、Firefox與WebKit（390）通過，含鍵盤、空結果、載入失敗及axe檢查。舊來源驗收改為明確選HTTP(S)連結，避免第一個開新分頁連結為非網頁scheme時誤報。預覽457份來源逐位元一致；正式發布以CI為準。

## 2026-11-01：空結果的搜尋建議可返回

正式站以「旅遊 xyz987」搜尋後，選「只移除關鍵字」再按瀏覽器 Back，未能回到原空結果。每次輸入都新增歷史會造成逐字倒退；本輪只替明確選取的搜尋恢復建議建立節點，保留即時輸入與篩選行為。前一筆已提交搜尋、空結果與恢復結果可依序返回或前進；不改搜尋排序、分類或篩選恢復歷史。

獨立審查指出未提交草稿可能覆蓋前一筆搜尋，已加入前一筆搜尋及兩次 Back／Forward 的瀏覽器回歸。桌面與手機空結果畫面：[修改前桌面](recovery-before-desktop.png)、[修改後桌面](recovery-after-desktop.png)、[修改前手機](recovery-before-mobile.png)、[修改後手機](recovery-after-mobile.png)；本輪改的是歷史行為，畫面不預期有視覺差異。

預覽：`python3 scripts/preview.py /tmp/visitor-history-preview/ai-agent-use-cases`，再執行 `python3 -m http.server 18998 --directory /tmp/visitor-history-preview`，開啟 `http://127.0.0.1:18998/ai-agent-use-cases/?q=旅遊%20xyz987#explore`。
