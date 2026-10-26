# 2026-10-27 已合併來源補充的站內交接

目標使用者：搜尋郵件搬遷、讀到來源補充 UC-250 的首次訪客。正式站桌面／390px 手機實走：搜尋「收件匣」＋工作＋入門對話得到 41／459 筆，UC-250 是第 2 筆；原文指明合併 UC-156，但詳情僅有指向 GitHub Markdown 的交叉引用，延伸閱讀未列主案例。459 是網站條目，不是嚴格合格案例數。

- 方案 A（採用）：從明示「合併UC-156」的頁首證據欄抽取目的地，在用途後放一個站內主案例入口。成本低，保留現有搜尋、來源、歷史與統計；目標未載入時如實提示，初始載入／補讀完成再更新，不猜測其他交叉引用。
- 方案 B：在搜尋結果把來源補充折疊進主案例。可減少重複結果，但會改搜尋、計數與篩選語意，可能掩蓋另一位作者的來源限制；本輪不做。

驗收：UC-250 明示不另計案，主案例載入後只有一個站內入口；鍵盤可啟動，前往 UC-156 保留查詢與篩選，瀏覽器 Back 回 UC-250 與焦點。直鏈重整、來源固定版本、空結果及恢復、長文無水平溢出。未修改原始案例、合格計數、證據分類、搜尋演算法或外部來源。

| 視口 | 修改前正式站 | 修改後子路徑預覽 |
| --- | --- | --- |
| 390×844 | [前](before-mobile.png) | [後](after-mobile.webp) |
| 1440×900 | [前](before-desktop.webp) | [後](after-desktop.webp) |

預覽：`python3 scripts/preview.py /tmp/visitor-merged-after/ai-agent-use-cases && python3 -m http.server 8138 --directory /tmp/visitor-merged-after`，開啟 `http://127.0.0.1:8138/ai-agent-use-cases/?q=收件匣&scenario=工作&difficulty=入門對話&case=UC-250#explore`。本機 preview 非正式 Jekyll build。

基準：`node --test tests/*.test.cjs` 362／362，JS 語法檢查通過，457 原始來源逐 byte 一致；無 package.json、獨立 lint/typecheck、Jekyll／Docker。新增 metadata 回歸先紅（`mergedInto` undefined）後綠；最終全套 361／361（刪除一項以 CSS 原始文字代替真實觸控尺寸的舊實作斷言），補讀專項 5／5；`python3 scripts/check_corpus_bundle.py /tmp/visitor-merged-after/ai-agent-use-cases` 457 來源一致。相關瀏覽器測試加了站內跳轉與 Back 焦點斷言，但本地缺 Playwright，未宣稱該腳本通過。

實際 Chromium 預覽：390px 直鏈先顯示主案例未載入，全庫 459 筆完成後入口出現；按下跳到 UC-156，URL 保留收件匣／工作／入門對話，Back 回 UC-250 且焦點回入口。入口手機高度約 98.7px、桌面 44px；詳情兩視口 scrollWidth 等於 clientWidth。桌面切到 UC-156 的固定版來源，再返回；無結果 0／459，改搜旅遊恢復 3／459。手機 UC-005 長文原文展開有 42 個可導覽連結，直鏈重整仍開啟；上述頁面 `errors()` 均為空。三種模擬情境：① 郵件補充→主案→Back；② 旅遊＋生活＋門檻→UC-001／來源／返回；③ 空結果→調整查詢恢復。②③ 基準正式站由獨立瀏覽走查，非真人偏好。螢幕截圖已擷取，但目前影像讀取工具停用，不能聲稱完成目視前後審核；未執行 axe 或量測網路效能，無分數。

獨立 reviewer 發現補讀完成未刷新主案例入口；已在 `retryFailedSources` 修正、重跑單元／預覽並完成複審。合併前近期 100 個 Actions run 中 8 failure、19 cancelled；已讀三筆是公開資產與 checkout 不符，不能推論功能回歸。下一輪優先補齊合併關係的結構化資料與受控補讀瀏覽器驗收，不從任意原文提及猜主案。

## 合併後發布核對

[PR #148](https://github.com/RichardHan/ai-agent-use-cases/pull/148) 一般 merge 為 `bca5286`。[Pages 40380424166](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40380424166) build／report／deploy 全成功；公開 `index.html`、`assets/app.js`、`assets/reader.css` 均 HTTP 200 且逐 byte 與合併版本一致。該 PR 的 13 個專項 Actions 均成功（含 Related reading QA）；本地仍未執行 Playwright，不把 CI 結果冒稱本機驗證。正式 Chromium 390／1440px 直鏈 UC-250 顯示唯一站內入口，分別高 98.67／44px、41／459 筆、詳情零水平溢出；到 UC-156 的原始 Markdown 固定於 `bca5286`，Back 返回 UC-250 且焦點回入口，兩視口 page errors 皆零。原未追蹤 `docs/qa/2026-10-26-linked-pr-review/` 保持未動。影像目視及實機、axe、效能仍未驗，不能宣稱它們通過。
