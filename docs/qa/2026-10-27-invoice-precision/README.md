# 2026-10-27 發票搜尋不再混入登入憑證

目標使用者：從首頁「發票對帳」出發，想找帳務處理案例的首次訪客。正式站 Chromium 1440×900／390×844：搜尋「發票」顯示 138／459，首筆 UC-042 是登入憑證與多 Bot 寫入，命中理由為「發票」→「憑證」· 標題。相同的「憑證」同時作為 credential 與帳務單據，造成跨領域誤命中。459 是網站條目，不是嚴格合格案例數。

- 方案 A（採用）：從發票／收據／invoice 同義詞群移除歧義的「憑證」，保留 credential 群及帳務跨語命中。成本低；仍可能有「收據」作為非帳務比喻的結果。
- 方案 B：依結果全文的帳務情境判斷「憑證」語意。可追回單據憑證的間接結果，但規則複雜、可能誤推定內容；本輪不做。

驗收：發票、invoice、receipts 仍命中相關單據；發票及 invoice 不再僅因 login credential 命中 UC-042，credential 仍可找 UC-042；工作＋入門對話、0 筆復原、UC-190 直鏈重整與返回正常。未改原始資料、來源標籤、排名、其他搜尋群組或 UI 文案。

| 視口 | 修改前正式站 | 修改後子路徑預覽 |
| --- | --- | --- |
| 390×844 | [前：138 筆／UC-042 首筆](../2026-10-27-current-round-baseline/06-mobile-query.png) | [後：37 筆／UC-190 首筆](after-mobile.png) |
| 1440×900 | [前：138 筆／UC-042 首筆](../2026-10-27-current-round-baseline/02-desktop-query.png) | [後：37 筆／UC-190 首筆](after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-invoice-after/ai-agent-use-cases && python3 -m http.server 8147 --directory /tmp/visitor-invoice-after`，開啟 `http://127.0.0.1:8147/ai-agent-use-cases/?q=發票#explore`。這是 Pages 子路徑相容預覽，非 Jekyll 正式 build。截圖已擷取；環境的影像讀取停用，無法聲稱目視比較。DOM 實測 390／1440px 都是 37／459、UC-190 首筆，document 無水平溢出。

基準 `node --test tests/*.test.cjs` 361／361，四個 assets JS 與 173 個 tests JS 語法檢查通過；457 來源逐 byte 相同。新增發票誤命中斷言先紅（UC-042 仍命中），修改後 `node --test tests/search.test.cjs` 通過。預覽 `python3 scripts/check_corpus_bundle.py /tmp/visitor-invoice-after/ai-agent-use-cases` 457 來源一致。Chromium 預覽：工作＋入門對話 9／459；加 Cursor 0／459，移除後 9／459；開 UC-190 並 Escape 返回條件保留；直鏈重整仍開啟詳情，1440px 詳情 848px scrollWidth/clientWidth 相等；page errors 為空。鍵盤及實機觸控、axe、效能、正式 Pages 發布仍待核對，不虛報分數。

正式站基準另有 Corpus bundle QA 40380423836 的 localhost 補讀停止後按鈕視口斷言失敗，與發票同義詞無直接關係；其他 Actions 存在 Pages 資產等待逾時，不能稱 CI 全綠。下一輪優先處理補讀停止後的焦點／可見性真實退化，再查發布窗口。此輪三種模擬情境：① 發票搜尋→UC-190；② 發票＋工作＋入門門檻→空結果移除工具；③ UC-190 直鏈重整→來源入口／返回。非真人偏好或轉換率資料。
