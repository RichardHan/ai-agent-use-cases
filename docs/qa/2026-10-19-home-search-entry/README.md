# 2026-10-19：已有任務，從首頁首屏直接搜尋

本輪對象是已經知道想解決什麼問題、第一次來訪的讀者。沿用「選情境、抽靈感」首頁，增加直接抵達既有全文搜尋框的入口，讓訪客能選擇探索或直接找內容。

## 證據與兩案選擇

基準 main `680131845b394598696479682e9907e6b62951ad`，初始本機唯讀 status 顯示乾淨；GitHub 連線確認無開啟 PR、遠端 main 同版本。合併瞬間 main 已新增協作者搜尋同義詞與候選叢集審計提交 `af5a05a`，GitHub 無衝突 squash merge 保留其 app／tests／SITE 更新。已重新讀取固定 commit 的父版本與合併版本，核對新增 handler 與原定變更完全一致；正式站驗收及合併後單元測試驗的是整合後版本。根目錄沒有 AGENTS.md；已閱讀 README、SITE、Pages 設定、既有工作流程與前輪 QA。遵照不操作個人電腦的限制，在最初環境與 git 唯讀確認後停止使用本機工具；所有寫入、瀏覽器、套件安裝、測試與發布均透過 GitHub connector 與 GitHub-hosted Ubuntu runner，沒有操作個人 GUI、重設工作樹、強推或改寫協作者內容。未檢查其他本機工作樹。

先檢視同版本 Website QA 的桌面／手機實際畫面與正式站流程結果，再在獨立遠端分支先提交測試。 [紅燈重現 39161633638](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39161633638) 的 test-only `248f929` 確實在「direct search entry must be in the initial viewport」失敗，原有 58/58 單元測試、JS syntax 與靜態預覽仍通過。390×844 的搜尋框頂端為 1598.2px、320×740 為 1636.3px，首屏沒有直接搜尋入口。抽卡內容隨機，原搜尋區高度會隨卡片內容改變；以上是該次實際量測，不視為固定值。

- A：在 hero 直接放搜尋框。最直接，但增加輸入狀態同步與版面成本。
- B：首屏提供「直接搜尋案例」，聚焦原搜尋框。成本低，保留既有資訊架構與唯一搜尋狀態。採用 B。

## 驗收與範圍

首屏入口在 1440／390／320px 可見且至少 44px 高；普通點擊與 Enter 後，搜尋框取得焦點並在視窗內。上方入口與抽卡區捷徑共用行為，保留關鍵字、篩選、原 history.state、原生修飾鍵／中鍵處理，且不新增同頁 history 步驟。載入中純 click（模擬輔助技術、不先發 pointerdown／keydown）後輸入，完成載入仍保留文字、焦點與可見位置；錯誤與重試也可操作。

三個具體模擬情境：旅遊任務搭配生活篩選 → 讀來源 → 返回原卡；無結果 → 編輯關鍵字與重設；分享 UC-001 → 重新整理 → 返回保留條件。另保留既有長文、來源、網路錯誤、分享與鍵盤回歸。這是模擬走查，不代表真人偏好、留存或轉換率已提升。

本輪不改案例、證據狀態、合格數／條目數、搜尋匹配規則、抽卡規則、技術框架或配色；未新增產品依賴、儲存、cookies、追蹤或外部資料傳送。

## 實作與獨立審查

`index.html` 在 intro 後加入原生 `href="#explore"` 入口，抽卡區既有連結增加共用標記。`assets/app.js` 只處理未被取消、無修飾鍵的左鍵 click；設定 `allowAutomaticArrival=false`，保留 history.state 與查詢字串，捲動搜尋區並同步聚焦 query。`assets/style.css` 延續綠色邊框與品牌字級，48px 點擊範圍，沿用既有 focus-visible 樣式。沒有 JavaScript 時仍是有效同頁 anchor，且既有 noscript 索引入口保留。

由未參與實作的獨立角色審查方案、diff、測試與實際桌面／390 截圖，沒有修改主實作。已依審查修正：輔助技術 click 不必然先發輸入事件，需顯式取消晚到自動抵達；並加入 WebKit 載入完成可見性、history/state、修飾鍵與中鍵檢查。

兩次中間測試分別太早檢查 native Back 的焦點、以及焦點後下一畫格的捲動，最終改成在 1 秒內同時滿足「正確卡片焦點＋完整可見」，沒有在測試中補焦點或捲動、沒有延長產品既有 300ms guard。產品程式碼在 `8ba655b` 後沒有因此修改。

診斷版 `25d8136` 的 [run 39162371957](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39162371957) 證明其餘嚴格可見性失敗是分數像素：1440×1000 中，UC-001 在返回後 50–800ms 一直維持正確按鈕焦點，底端為 1000.46875px，高度 36px。獨立 reviewer 核對原始數據後，同意採 repo 原有 return-visibility 測試的 ±1px 容差；1 秒期限、正確案例與可見性條件保留，未在測試內補焦點或捲動。詳見 [原始診斷](return-diagnostic.json)。

模型限制：主對話沒有可讀取或切換實際模型／推理強度的 runtime 介面，不能保證帳號最高設定。獨立審查要求 `gpt-6-astra / ultra`，但審查角色也無可信 runtime metadata 可驗證實際執行型號與 effort；不將指定參數當成已驗證事實。未改用另外付費 API 或購買 credits。

## 截圖

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 1440×1000 | [桌面](before-desktop.jpg) | [桌面](after-desktop.jpg) |
| 390×844 | [手機](before-mobile.jpg) | [手機](after-mobile.jpg) |

照片來自真實雲端瀏覽器，不是設計稿。隨機卡片內容不同，主要比較搜尋入口的位置與層級。


## 最終預覽結果

[最終 Home search entry QA 39162533374](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39162533374) 驗證 `a8c97ce`，完整成功：

| 項目 | 實際結果 |
| --- | --- |
| 單元測試 | 58 tests、58 pass、0 fail；全庫 339 筆 |
| JS 語法、Python 預覽 | 全部通過 |
| Chromium | 1440×1000、390×844、320×740 的三情境全部通過 |
| Firefox／WebKit | 各 390×844 的三情境全部通過 |
| 新入口 | 桌面 y389.125；390／320 y329.6875，均高48px |
| 搜尋／篩選／空結果 | 旅遊＋生活、無結果編輯與重設通過 |
| 詳情直鏈、重新整理、返回 | 保留條件、正確卡片焦點與 viewport 可見性通過 |
| 鍵盤、修飾鍵、歷史 | Enter、Ctrl／Meta／Shift／Alt／中鍵、history.state／length 通過 |
| 載入與錯誤 | Chromium／WebKit 先攔住 catalog，再純 click＋輸入；完成載入保持文字／焦點／可見；503 後重試通過 |
| axe | 5 次掃描、0 違規 |
| 新文字對比 | #285344 對白底的 WCAG 相對亮度公式計算為8.71:1 |

獨立 reviewer 已自行讀取最終 logs、重新檢視最終桌面／390截圖，結論「沒有剩餘必修項目」。審查同時確認來源安全、相容性、原生連結與查詢保留。

原始數據：[baseline.json](baseline.json)、[verification.json](verification.json)、[asset-sizes.json](asset-sizes.json)。完整 CI 與正式發布紀錄見下方。

## 驗證指令

在已授權雲端環境：

```sh
node --test tests/*.test.cjs
for file in assets/*.js; do node --check "$file"; done
python3 scripts/preview.py /tmp/entry-preview/ai-agent-use-cases
python3 -m http.server 8087 --directory /tmp/entry-preview
NODE_PATH=<cloud-tools>/node_modules node tests/home-search-entry-browser.cjs
```

前端沒有獨立 npm build、lint 或 TypeScript；上列 syntax 與 Python 預覽不冒充 Jekyll 建置。正式部署另由 Pages 的 Jekyll 工作流程與逐字資產比對確認。

## 限制與下一輪

未使用實體 iPhone、iOS 軟鍵盤或真人螢幕閱讀器，axe 不等於完整無障礙認證。未量測 Lighthouse、實際裝置速度、留存或轉換率。前端新增未壓縮 1,070 bytes（HTML +141、JS +558、CSS +371），是檔案尺寸差額，不是網路傳輸量或效能分數。

下一輪最值得做：依既有前輪證據，降低回訪時重抓全庫全文的載入成本，保留全文搜尋、部分失敗提示與來源一致性。

## 正式發布與整合驗收

[PR #49](https://github.com/RichardHan/ai-agent-use-cases/pull/49) 的七套 PR QA 全部成功後，以 squash merge 合併為 `185cc17`。[Pages Jekyll 建置與部署 39163213072](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39163213072) 成功。

[正式站 Home search entry QA 39163212177](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39163212177) 全部成功，先取得公開 HTTPS 頁面，逐字確認 index.html、assets/app.js、assets/style.css 與整合 checkout 相同，再執行 Chromium 1440／390／320、Firefox／WebKit 390 的三情境；5 次正式站 axe 掃描零違規。兩引擎延遲 catalog＋純 click 輸入、載入後保持焦點與可見性、503＋重試同樣通過。原始結果：[published.json](published.json)。

整合審查另外固定讀取父提交 `af5a05a`，確認新詞群與審計為協作者所有；本輪五檔差異保留，app 僅加入預定 558 bytes 的 handler，未覆蓋新搜尋規則。獨立角色再次核對差異與正式站 logs，無新增必修項。

[正式站桌面畫面](published-desktop.jpg)／[正式站手機畫面](published-mobile.jpg)；可直接開啟 [正式網站](https://richardhan.github.io/ai-agent-use-cases/)，在首屏選「直接搜尋案例」驗收，不需操作個人電腦。

整合版本 `185cc17` 的十個發布後工作流程（九套 QA 與 Pages）已全部成功，包含先前較長的 Reader／Reading flow。詳見 [CI 快照](ci.json)。文書提交只新增本輪截圖／紀錄與 SITE 最新驗收連結，不改執行資產。

抵達搜尋後畫面：[桌面](search-desktop.jpg)／[手機](search-mobile.jpg)。本輪驗收完成。
