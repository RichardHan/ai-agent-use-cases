# 2026-10-22：連續比較案例時，看得見目前結果位置

## 問題、方案與範圍

[正式站基準 39683423268](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39683423268) 在1440及390px實走首頁、經驗入口、UC-008詳情與外部來源新頁、Escape精確返回、旅遊＋生活、空結果及直鏈重新整理。413條目，pageerror空，兩次axe零違規。截圖顯示詳情工具列只有案例ID與上一則／下一則，沒有交代切換集合及所在位置；程式確認順序來自currentFiltered，並非UC編號。這是介面觀察，不是真人研究或留存證據。

目標讀者：從問題搜尋後，需要連續比較方法、限制及來源，再回原結果的人。

- A：補「依目前搜尋結果切換」靜態說明。成本低，不需動態狀態，但看不出所在位置與邊界。
- B（採用）：利用既有工具列的CASE NOTE空間，顯示「目前結果 1／17」。成本稍高，須處理載入中、缺項與篩選外直鏈；可見資訊能解釋切換範圍，也讓鍵盤按鈕取得共同的描述。

驗收：依實際篩選／排序顯示位置；首、中、末篇按鈕界線正確，單篇為1／1；載入中不提前判斷不在結果；缺項寫「已載入結果」，篩選外直鏈不捏造位置。手機維持ID列＋44px按鈕列，沒有新增第三列；不改原文DOM、閱讀位置、焦點或返回。搜尋、組合篩選、空結果、分享重整、原生Back、長文與來源不退化。

不處理：案例、合格計數、證據分類、難度推估、搜尋演算法、全文載入架構、框架或品牌。無新增產品依賴、追蹤、cookie、登入、儲存或第三方資料傳送。

## 環境、保留與模型界線

起始遠端main為8e377db，無開啟PR；原目錄分支improve/search-recall-recent-workflows-and-tokenization的assets/app.js與tests/search.test.cjs未提交修改完整保留。建立/tmp/ai-returning-discovery-20261022獨立工作樹／分支，主角色唯一修改與整合，獨立角色唯讀。已讀README、歷史規範、SITE、catalog／Jekyll部署與近期QA；repo與祖先沒有適用AGENTS.md。

可讀設定為gpt-6.1-sol／medium，不能證明主會話runtime，未能可靠切換或確認帳號最高模型。使用OpenAI Docs核對推理設定（[官方說明](https://developers.openai.com/api/docs/guides/reasoning)）；設計與獨立審查工具明確請求gpt-6-astra／ultra，這也不是runtime稽核證明。僅既有訂閱與已授權GitHub Actions，無另付API或credits。

Orca CLI依技能讀guide時回報「Unable to determine Orca.app path from symlink: /usr/local/bin/orca」，未改用其他執行檔或啟動GUI，以Git worktree隔離。僅使用授權檔案／Git／Node／Python，所有瀏覽器在GitHub-hosted runner，不啟動個人桌面或本機瀏覽器。

## 實作與檢查

- assets/app.js：在既有updateModalNav按currentFiltered ID定位；沿用首次載入完成、補讀、換篇及history呼叫點，不重建原文DOM。
- index.html：新的位置節點取代CASE NOTE；保留原ID，上一則／下一則以aria-describedby關聯集合與位置，避免多餘live公告。
- assets/reader.css：保留手機可見資訊，沒有沿用窄螢幕會隱藏的eyebrow。
- tests/reader-position.test.cjs：先紅燈三項，再修正；測實際nav更新函式，涵蓋換序、首末／單筆、篩選外、載入與缺項。
- tests/reader-position-browser.cjs、Returning discovery QA：雲端前後、五配置、背景載入與補讀、既有reader回歸；正式Pages資產另核對。

基準151/151；修後154/154。指令：`node --test tests/*.test.cjs`，`for file in assets/*.js tests/*.cjs; do node --check "$file"; done`，`git diff --check`，`python3 scripts/preview.py <output>/ai-agent-use-cases`。原始輸出在[checks](checks/)。無獨立lint／TypeScript／npm build；靜態preview不等同Jekyll，正式部署另記。

未壓縮資產差額：app.js +441 bytes、reader.css +206、index.html +135；gzip本機估算分別+123／56／17 bytes，非網路量測或Lighthouse分數。沒有新增載入請求。

## 截圖與預覽

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440×1000 | [CASE NOTE](before/detail-chromium-1440.png) | [目前結果位置](after/detail-chromium-1440.png) |
| 手機390×844 | [只有ID](before/detail-chromium-390.png) | [位置與ID同列](after/detail-chromium-390.png) |
| 小手機320×844 | [修改前](before/detail-chromium-320.png) | [修改後](after/detail-chromium-320.png) |

[部分來源未載入](after/partial-mobile.png)／[背景讀取完成](after/loaded-mobile.png)。主角色已目視以上四種畫面，未見新增行數、遮擋或水平溢出；獨立目視另記。

可重現預覽：`python3 scripts/preview.py /tmp/reader-position-preview/ai-agent-use-cases`，再`python3 -m http.server 8141 --directory /tmp/reader-position-preview`，開啟`http://127.0.0.1:8141/ai-agent-use-cases/?kind=evidence&case=UC-008`。

未驗證實體手機、真人偏好、留存或轉換率；axe不等於完整WCAG／輔具認證。下一輪最值得做：減少全庫全文請求，保留全文搜尋與原文一致性，以降低重複載入成本。


## 整合與審查補記

獨立角色未參與實作，程式審查未發現產品阻擋：textContent安全、沒有新增網路／儲存、載入狀態優先、部分結果與篩選外語意正確，ID與既有導覽呼叫點保留。另獨立跑36項相關測試全過，語法與diff檢查通過。依建議加嚴red gate，限定三個ERR_ASSERTION及預期空文字，避免執行錯誤誤算重現；browser改以實際結果卡DOM順序為oracle並動態取筆數，避免固定三筆資料。最後一次明確從結果卡開啟的是末卡，Back／Escape回該卡符合既有caseReturn行為；更精確的Back目標ID斷言屬非阻擋建議，既有reader回歸另驗原生Back。

協作者期間新增db6e239（UC-362的MCP逾時與遠端取消限制），已無衝突合併並保留；整合後154/154、全JS語法、diff及靜態preview通過，cases／evidence／sources相對最新main沒有本輪改寫。原工作樹仍是原分支與兩檔未提交修改（20新增／3刪除），沒有reset或強推。

新文字以CSS宣告色彩計算對比8.16:1（[計算紀錄](checks/contrast.json)）；雲端axe另外檢查，不把此計算當完整無障礙認證。


## 雲端完整預覽

[39683881614](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39683881614)全套success（5e86faf）：154/154、原版三項預期斷言失敗、語法、靜態preview、新專項及既有reader回歸均通過。[修改前量測](before/report.json)、[五配置量測](after/report.json)、[載入／補讀](after/lifecycle.json)、[既有reader PASS摘要](checks/reader-summary.log)。完整截圖及reader資料在該run artifact，repo不保存其image base64 log。

新專項配置是Chromium1440／390／320、Firefox390、WebKit390，15次axe均零違規，pageerror空，工具列按鈕皆至少44px。前後同一UC-008／evidence狀態：桌面工具列75px、兩個手機96.796875px完全不變；用途標題top依序331.796875、426.734375、510.875px也不變。這是未縮放雲端視窗量測，不是實體裝置體驗或效能分數。

三個自動化模擬情境：
1. 從經驗集合閱讀首、中、末篇，以Enter／Next／Prev連續比較，Back後Escape回原明確開啟的結果卡。
2. 旅遊＋生活＋最近核對排序，從第二篇到下一篇，分享直鏈重整保留位置；空結果可回編輯關鍵字。
3. 篩選外UC-006直鏈照常讀長文與來源，位置明說不在結果；另一個受控網路場景檢查UC-008優先顯示、背景完成不重建標題DOM或搶焦點，來源缺項及重試後狀態更新。

這些模擬只作流程檢查，未宣稱真人喜歡或留存改善。外部來源在正式站基準實開新頁，本輪長文核對保留HTTPS來源；不能保證所有外站長期公開。部分來源失敗以runner路由中止重現，不是聲稱正式站當時發生失敗。


獨立目視終審已實際比對1440／390／320前後及partial圖，確認集合與位置可讀、與ID區隔清楚，沒有重疊、截字、擠壓、額外工具列或水平溢出；並核對報告中的高度、用途落點、44px按鈕、15次axe及lifecycle結果。無剩餘產品或視覺必修，全程唯讀，沒有修改實作。
