# 2026-10-24：選取閱讀文字時不誤切案例

本輪針對需要摘錄案例方法、限制與來源的讀者，修正閱讀器攔截左右方向鍵、意外換案並清掉選取文字的問題。只修改 `assets/app.js` 的快捷鍵守衛，無資料、樣式、依賴、追蹤或網路請求變更。

## 基準、證據與方案

從 `origin/main` 5f9266b 建立獨立分支 `improve/navigation-20261024`，原工作樹 `assets/app.js`、`tests/search.test.cjs` 未提交修改保留。沒有適用的 AGENTS.md；已讀 README、歷史維護說明、Pages 設定、現有 QA 工作流與前輪閱讀／搜尋紀錄。既有 PR 78、79、80 沒有代為合併。主對話無實際模型／推理設定讀取或切換介面，未宣稱已切到最高；唯讀獨立審查透過代理工具指定 gpt-6-astra／max，不使用額外付費 API。

正式站 Chromium 1440／390 走完首頁、旅遊＋生活＋Grok Bot、詳情、來源新頁、Escape 返回原卡及空結果。該次實測447筆網站條目、16筆組合結果（不是合格案例數）。[完整基準報告](before/report.json)。選取 UC-001 標題後按右鍵，無篩選會跳到 UC-002；相同旅遊組合條件則跳到 UC-139。[可重現瀏覽器證據](reproduction/report.json)。

- A：移除左右鍵換案。成本低，會失去既有快速探索操作。
- B（採用）：有非折疊文字選取時不攔截方向鍵，保留瀏覽器原生行為。成本為兩行產品程式與閱讀往返回歸測試。

驗收：左右鍵在文字選取中不切案例、不改 URL／history／title；清除選取後原快捷鍵正常。明確按鈕 click／Enter 與 Escape 不受阻擋。保留輸入、修飾鍵、表格橫捲的既有例外。空結果、錯誤、載入、直接連結重整與返回既有流程無退化。

不處理：搜尋召回、內容編輯、難度資料、分類、配色、載入架構、瀏覽器自身如何收合文字選取，以及真人留存或轉換率研究。

## 前後畫面

相同流程：旅遊組合搜尋，開 UC-001，選取標題，按右鍵。前圖意外換到 UC-139；後圖仍在 UC-001。視覺設計未改動，截圖用於核對內容與焦點狀態。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440 | [前](reproduction/after-arrow-chromium-1440.png) | [後](after/after-arrow-chromium-1440.png) |
| 手機390 | [前](reproduction/after-arrow-chromium-390.png) | [後](after/after-arrow-chromium-390.png) |

## 驗證

- 基準完整單元：202／202，[原輸出](checks/baseline.tap)。
- 新回歸先紅燈：11項中2失敗，精準重現左右鍵各一項；[原輸出](checks/red.tap)。
- 修後完整單元：213／213，[原輸出](checks/after.tap)。
- 語法檢查及靜態預覽 build 通過；沒有另設 lint／TypeScript，不將語法檢查稱為 type check。正式 Jekyll 由 Pages 部署驗證。
- 首次新 browser harness 在 axe 要求 explicit browser context 時失敗；改為 newContext 後重跑，這是測試工具修正，沒有改產品去規避檢查。

```sh
node --test tests/*.test.cjs
for f in assets/*.js tests/reading-selection*.cjs; do node --check "$f"; done
python3 scripts/preview.py /tmp/navigation-preview/ai-agent-use-cases
python3 -m http.server 8184 --directory /tmp/navigation-preview
NODE_PATH=/tmp/navigation-qa-tools/node_modules node tests/reading-selection-browser.cjs
SITE_URL=http://127.0.0.1:8184/ai-agent-use-cases/ NODE_PATH=/tmp/navigation-qa-tools/node_modules node tests/page-context-browser.cjs
git diff --check
```

預覽：http://127.0.0.1:8184/ai-agent-use-cases/?q=旅遊&case=UC-001 。瀏覽器工具安裝於獨立暫存路徑，沒有新增產品套件。

三種模擬情境：①摘錄案例標題，方向鍵不丟掉閱讀位置；②閱讀來源長文、選取段落，明確下一則／上一則仍可操作；③從搜尋直鏈重整、讀案例、Escape 返回原條件，再從空結果修改查詢。這些是自動化檢查，不代表真人喜好提升。

限制：未測實體手機、完整螢幕閱讀器與 Lighthouse；不提供虛構效能分數。下一輪最值得研究的是是否有足夠一致的難度資料支援「我能否照做」篩選，先盤點證據，不從工具名稱推測難度。

新閱讀流程在 Chromium1440／390／320、Firefox390、WebKit390 全通過；[逐項報告](after/report.json)包含選取前後 case、原有導航、正文、click／Enter、Escape／空結果。五次 axe WCAG2A／AA／2.1AA 掃描零違規，並非完整無障礙認證。

## 整合及額外檢查

主線在本輪期間合入95e89cd的搜尋分享焦點保護，正常無衝突合併為7606c05；保留其載入提示與失敗後不搶焦點修正。整合後完整單元217／217，[原輸出](checks/integrated.tap)；新閱讀流程五種配置再次全通過，[整合報告](integrated/report.json)。

既有 page-context 全流程 Chromium1440／390／320、Firefox390通過；macOS WebKit 在歷史前進／返回後的 `page.reload` 出現 `Page crashed`，[首次原報告](regression/report.json)，單跑重現，[重跑原報告](webkit-regression/report.json)。新閱讀流程的直鏈重整在 WebKit 通過，不能因此將完整舊流程標為通過。以下將補獨立基準確認與載入生命週期結果。

獨立審查指出 Firefox 對按鈕 focus 會清除 selection；瀏覽器測試已改成先 focus 按鈕，再建立正文Range並斷言非折疊，避免對「帶選取 Enter」驗收出現假陽性。主角色目視桌面1440、390及320前後選取狀態與手機來源長文，無新增橫溢、重疊或版面變化。

WebKit 對照：攔截 app.js 並換成未含本輪兩行修正的 `origin/main` 95e89cd原始內容，同一舊腳本仍在同一 `page.reload` 崩潰。[基準報告](webkit-baseline/report.json)證明本輪修正不是重現此問題的必要條件；尚未定位瀏覽器崩潰根因，不宣稱修復。保留為已知驗證限制。

將既有 page-context 腳本的畫面配置列表設為空、其餘 lifecycle 斷言不動，獨立執行 loading-early／error／partial 與重試，三項全過、447條目零缺項：[生命週期原報告](lifecycle/lifecycle.json)。

獨立唯讀審查以自寫probe在 Chromium／Firefox／WebKit各驗7項，全部通過、pageErrors皆空；包含事件不被 preventDefault、URL／history不變、Enter／click、保留選取Escape／原卡重開、輸入游標。[獨立原始JSON](checks/independent-review.json)、[probe](checks/independent-review.cjs)。沒有發現產品阻擋；本機Home鍵差異及Firefox focus會清選取都改成明確測試前置條件，不當作產品問題。

最後主線450cc1b新增研究與篩選排版已無衝突合併為06c2ad8，產品app.js相對先前審查版不變。最終完整單元222／222，[release輸出](checks/release.tap)；更新預覽後，修正Firefox前置條件的新流程五配置全部通過、五次axe零違規：[release報告](release/report.json)。相同掃描不同版本不合併宣稱真人樣本或認證。維護摘要同步SITE.md。

獨立終審已核對程式差異、五配置報告、1440／390／320畫面與WebKit對照，結論可發布，無本輪產品阻擋；已知WebKit舊崩潰保留。
