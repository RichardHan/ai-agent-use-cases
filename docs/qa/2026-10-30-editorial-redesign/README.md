# 2026-10-30 Field Notes 視覺改版

本輪在完成[分批閱讀修正](../2026-10-30-result-batch-continuation/README.md)後，使用者追加「re-design git page讓畫面更好看」。兩項工作一起整合；原工作目錄未提交修改、公開來源資料及既有 PR 仍保留。

## 方向與目的

實際桌面／手機截圖顯示：首頁特色卡、三步驟、兩組任務連結、備援段落與七個情境大框都搶占層級；精選預覽前還有門檻及抽卡控制，詳情則重複套框，來源版本提示受 CSS 優先序影響與用途正文同為 17px。

- A（採用）「Field Notes 編輯式筆記」：延續紙張與森林綠，把主動作提前，統一任務入口，先看案例再調整條件；讀者更容易掃描重點，沿用靜態架構即可完成。
- B「分類探索桌面」：加大類別色塊與卡片，適合無目的瀏覽，但會延續框中框密度，也需更多分類重組。

目標是首次到訪及深入閱讀的桌面／手機使用者。本輪做首頁、搜尋結果與詳情的完整視覺層級，不更換框架、字型服務或搜尋演算法；不新增圖片請求、追蹤、登入與任何使用者資料傳送。

## 實際變更

- 主標題與搜尋主按鈕拉開層級，按鈕在說明區之前；DOM 與視覺閱讀順序一致。
- 三個任務範例與七個常見問題使用同一視覺樣式；原查詢、直接連結與觸控尺寸保留。完整索引備援緊接任務入口，不藏起。
- 精選區先顯示案例，再放抽卡、載入狀態與門檻；情境選項位於其下，保留所有標籤和描述。
- 結果卡統一留白與邊框，移除用途／對象的重複色塊；來源憑據仍明確區分。分批接續閱讀修正保留。
- 詳情採較寬的閱讀頁，整理標題、用途、方法與證據層級；來源版本提示明確降為次要字級。所有新視覺規則限定 screen，既有列印版不改。

## 修改前後

| 畫面 | 桌面 1440：前 → 後 | 手機 390：前 → 後 |
| --- | --- | --- |
| 首頁 | [前](before-home-1440.png) → [後](after-home-1440.png) | [前](before-home-390.png) → [後](after-home-390.png) |
| 搜尋結果 | [前](before-results-1440.png) → [後](after-results-1440.png) | [前](before-results-390.png) → [後](after-results-390.png) |
| 案例詳情 | [前](before-detail-1440.png) → [後](after-detail-1440.png) | [前](before-detail-390.png) → [後](after-detail-390.png) |

圖為相同資料的本機預覽；首頁隨機卡可能不同，不能把案例差異當作視覺改善或排名。主整合者已實際目視桌面／手機／320px，以及結果與詳情截圖。

```sh
python3 scripts/preview.py /tmp/redesign-preview/ai-agent-use-cases
python3 -m http.server 8131 --directory /tmp/redesign-preview
# http://127.0.0.1:8131/ai-agent-use-cases/
```

## 驗收

`node --test tests/*.test.cjs`：381 pass、0 fail。[摘要](unit-summary.txt)。`git diff --check`、改動 JS 語法檢查通過；repo 無獨立 lint／TypeScript 設定。沒有改任何案例、來源、catalog 或 corpus。

`REDESIGN_URL=http://127.0.0.1:8131/ai-agent-use-cases/ node tests/visual-redesign-browser.cjs`：1440×900、768×1024、390×844、320×740，首頁／搜尋＋生活篩選／UC-001 詳情共 12 次 axe 零違規、無水平溢出。鍵盤搜尋→詳情→Escape 焦點還原通過；搜尋入口及三個任務範例均在首屏且至少 44px。舊版本在 CTA DOM／視覺順序的八項斷言先失敗：[先紅](red-regression.json)／[後綠](after-report.json)。已加入既有 Website QA，未新增 workflow。

`BATCH_ALL_BROWSERS=1 ROUND_URL=http://127.0.0.1:8131/ai-agent-use-cases/ node tests/results-batching-browser.cjs`：最終設計下 Chromium 1440／390／320、Firefox 390、WebKit 390 再次全部通過；467 條目完整，Enter／Space／pointer／Tab／詳情／返回／空結果正常。[結果](batching-report.json)。

實際 Jekyll 與正式部署在合併後驗收，preview.py 不等同真正建置。獨立審查及部署結果以下方補記為準。

## 範圍限制

自動瀏覽器及 axe 不等同真人偏好、轉換率、螢幕閱讀器或實機認證。未跑 Lighthouse，也不宣稱載入效能改善；本輪未增加外部資產。既有 Actions 的 WebKit 間歇錯誤及 Combined recovery 缺失 log 仍依[前一份紀錄](../2026-10-30-result-batch-continuation/README.md)保留，不宣稱所有 Actions 已綠。

## 最終獨立 review

未實作產品的 QA 角色審查最終 diff，無阻擋問題。Chromium 1440／390／320、Firefox／WebKit 390，五配置的首頁、結果、詳情、長文及空結果共 25 次 axe 零違規；行動搜尋密度檢查 10 次、最終三情境分批流程 15 次，合計 **50 次最終獨立 axe 零違規**。另四尺寸 visual-redesign 的 12 次為主整合驗收，分開報告。

實際量測手機主搜尋入口 y595→336px，桌面 y559→459px，320px y510→318px。行動搜尋到首筆結果約 248–252px，未超過既有 300px 門檻。精選區的 Tab 順序為案例閱讀→抽卡→搜尋→門檻→情境，描述與44px觸控尺寸保留，列印仍展開原始研究且隱藏工具列。無頁面錯誤、水平溢出或新資料外傳；主角色與 QA 都已目視最終多尺寸截圖。

三情境為：連續載入與比較案例；工作＋日報組合篩選與空結果復原；旅遊直鏈／重整／固定來源／返回。全467條目逐批完整。報告：[視覺與五狀態](independent-review.json)、[鍵盤與列印](independent-keyboard-print.json)、[三情境](independent-batching.json)。一次 GitHub 原始來源請求為429；只確認固定網址正確，不把這次外部讀取冒稱成功。

## 雲端驗收後補修

首版 merge `7620b90` 的 Case sharing QA [40920056688](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40920056688) 揭露分享文字被改成13px，低於既有14px可讀性契約。恢復案例分享、搜尋分享、卡片標籤與閱讀按鈕四處為14px；主視覺測試也新增14px／44px實際computed-style檢查，保留原有axe與功能斷言。

Available facet QA [40920056665](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40920056665) 與 Filter entry 的排序重設檢查，則是 Firefox protocol boundingBox 回報43.999969482421875，DOMRect及min-height實際均44。改測DOMRect且仍要求精確>=44，沒有縮小門檻。macOS WebKit卡片目標的普通Tab失敗已在未改版8130基準重現，改採與其他repo測試一致的Option+Tab，Linux維持原Tab。

補修後案例分享、搜尋分享、卡片目標與排序重設各五配置全通過；[卡片](card-targets-corrected.json)／[案例分享](case-sharing-corrected.json)／[搜尋分享](search-sharing-corrected.json)／[排序](sort-reset-corrected.json)。381單元重跑通過；四尺寸視覺12axe再次零違規，截圖已更新。獨立補審檢查390／320及Firefox390，共6axe零違規、所有操作>=14px與44px、無溢出：[補審](readability-independent.json)。前面50次為改版主審查的證據，此處是後續字級修正的驗證，不混稱同一SHA。

首版Pages已完成真正Jekyll build；當時deploy排隊，Website QA已完成本機與Jekyll步驟並等待發布。Category finding的一次TLS ECONNRESET屬網路失敗，未當成產品錯誤修補。最終發布另補記。

## 正式發布完成

產品版本 `5632ea733d81b19aa79eaa7544534b9ceb3a9bcc` 已一般合併／推送main，未強推，原工作目錄的3檔修改與未追蹤內容仍保留。GitHub CLI企業帳號只有讀取權，使用repo既有個人SSH push remote；沒有建立PR。

[Pages](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40921224342)真正Jekyll build、report、deploy成功；[Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40921223588)成功，並在log確認同版產品資產和來源內容。主整合者另核對五個公開核心資產逐byte相同、465來源逐byte相同、catalog／corpus內部版本一致、sourceRevision精確為5632ea7。[發布比對](published-version.json)。

公開站1440／768／390／320視覺、搜尋＋生活篩選、UC-001詳情與Escape返回，全通過且12次axe零違規；公開390／1440分批、空結果、直鏈reload、全部467條目與返回亦通過。[公開視覺結果](published-visual.json)／[公開分批結果](published-batching.json)；主整合者目視[桌面](published-home-1440.png)、[手機](published-home-390.png)及手機詳情。

相關雲端驗收皆成功：[案例分享](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40921223486)、[篩選入口](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40921223589)、[列印](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40921223616)、[Combined recovery](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40921223487)、[Facet counts](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40921223386)。完整當時狀態見[快照](actions-snapshot.json)，部分其他工作流仍執行，不宣稱全庫全綠。Available facet options的路徑未涵蓋共享sort-reset測試，所以這次沒觸發；Filter entry已驗過同一修正。

下一輪最值得做：收斂各專項workflow的依賴路徑與發布等待，避免三十多個工作流競爭runner；不是再換一輪配色。本輪達標停止，最後僅補發布證據與維護文件，不再變更產品。
