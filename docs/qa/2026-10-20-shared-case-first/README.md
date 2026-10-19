# 2026-10-20：收到分享，先讀單篇

對象：收到案例連結的新訪客與回訪讀者。主題是分享直鏈的等待流程，不改案例資料、證據判定、搜尋排序或統計，也不新增快取、套件、追蹤或資料傳送。

## 證據與方案

基準 `eb9608e`。原工作樹 `improve/search-recall-recent-workflows-and-tokenization` 的 app.js／search.test.cjs 未提交修改完整留在原處；在 `/tmp/ai-reader-source-context` 從 fetch 後的遠端 main 建立獨立分支。祖先與 repo 無 AGENTS.md；已讀 README、SITE、Pages 設定與前輪紀錄。遠端無開啟 PR。基準 83/83 單元測試、JS 語法與靜態預覽成功；專案無獨立 lint、TypeScript 或 npm build。

[雲端正式站基準走查 39307581831](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39307581831) 完成桌面1440×1000與手機390×844的首頁、旅遊搜尋＋生活篩選、詳情、來源開啟、返回與單篇直鏈。已閱讀截圖。

[正式站延遲重現 39307752144](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39307752144) 暫緩與UC-005無關的UC-001來源：UC-005已回應，手機354/355來源處理完畢，dialog仍未開啟。放行後才顯示案例。[原始JSON](published-before.json) 的 `targetReadyMs` 實為回應後再等待500ms時的觀測時間，**不是精確回應耗時**。這是受控網路檢查，不是假稱一般訪客都遇到相同延遲。

- A（採用）：單篇成功讀到就先顯示，背景繼續準備搜尋；全庫完成只更新切換與相關閱讀，不重建正文。聚焦分享閱讀，沿用來源新鮮性策略。
- B：每批來源完成便更新整個搜尋結果。更早提供探索，但排序、筆數與焦點會持續變動，回歸成本較高。

驗收：分享來源優先排程但以原文ID驗身；無關慢來源不阻擋單篇；背景完成保留原始Markdown DOM、焦點、URL及閱讀位置；提早關閉不重開；目標失敗可補讀；待查不偽裝為成功。保留搜尋、組合篩選、空結果、直鏈重整、返回、來源及窄螢幕可讀性。

## 實作與測試

`assets/app.js` 為既有有限並行loader加入成功來源回呼，讀取當前URL並用既有matchCase核對真正內容ID。檔名只用於優先排程（含UC別名、evidence與P待查），不作證據或身份判斷。詳情先顯示來源的完整內容與原限制；載入中提示切換及延伸閱讀仍在準備，完成後只更新這些控制。`assets/reader.css` 沿用現有綠色紙面樣式。

先加入可重現的callback測試，基準失敗：[紅燈](red-callback.tap)；排程函式尚未實作時的失敗：[排程紅燈](red-priority.tap)。新測試也核對失敗／中止不發布虛構條目、後續成功只發布一次、ID別名與原清單不變。

[焦點回歸紅燈 39308602614](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39308602614) 實際重現：提早關閉→搜尋PR→開啟早讀卡片再返回→背景完成，卡片按鈕被重建後焦點遺失。[原始紅燈JSON](red-focus.json)。已沿用既有焦點恢復機制修正，modal內的相關閱讀另處理控制可見性。

首輪320px測得scrollTop差25px；單憑此數字無法判斷閱讀位置是否改變（動態文案高度與瀏覽器錨定可改變scrollTop）。最終驗收改記原文章節在視窗中的座標，同時保留原scrollTop差，沒有放寬為忽略位置。新增幾何錨點保護，並在文字更新後再等待畫面穩定檢查。

獨立審查另要求：滑鼠捲動時focus可能仍在畫面外標題，不能用offscreen focus補償。最終改用可見正文錨點；若focus在相關閱讀區則交給該區的控制可見性處理，避免互相抵銷。加入真實mouse.wheel與480px，且要求至少一組尺寸確實發生提示高度改變。

WebKit在舊測試的載入中重整後，回報一批 `due to access control checks.` 訊息。正常搜尋回歸現以明確全庫ready取代舊有「詳情開啟即全庫ready」假設；另設獨立原生early reload情境，完整保留該階段的已知WebKit診斷到JSON，要求新頁所有來源成功、正確案例開啟且條件保留。只對此明確導航階段及訊息型態分開記錄；其他同站pageerror仍使測試失敗。不宣稱已證實WebKit內部根因，也不把正常重整冒充early reload。

## 最終預覽驗收與截圖

[完整雲端QA 39309948421](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39309948421) 驗證 `219d578`，全部成功。產品資產自 `c919a36` 起相同，後續只收緊測試。

| 檢查 | 實際結果 |
| --- | --- |
| 單元／語法／靜態預覽 | 87/87，0 fail；所有JS語法通過；有效靜態catalog與base path |
| 本輪瀏覽器流程 | Chromium1440／480／390／320、Firefox390、WebKit390，六組全部完成 |
| 同一受控慢來源 | 基準四尺寸均未提前開啟；改後未放行無關來源就已開啟分享單篇 |
| 正文／焦點／位置 | 原研究DOM不變，原文座標及wheel閱讀位移0–0.1875px，卡片返回與相關閱讀焦點可見 |
| 320／480換行 | 提示高度確實減少約25.19px；兩行用途完整出現在dialog可見範圍 |
| 早讀期間原生重整 | 六組重新早開、新頁無來源失敗、q與scenario保留 |
| 本輪axe | 12次掃描0違規，含文字對比；不宣稱完整無障礙認證 |
| 舊流程回歸 | reader-search五組與load-recovery三引擎全過；正常重整改明確等待全庫ready |
| 實際瀏覽資產 | JS／CSS response全文與checkout比對，JSON保留sha256 |

[完整本輪JSON](preview.json)／[基準觀測](before.json)／[單元輸出](unit.tap)／[搜尋回歸](search-regression.json)／[載入回歸](load-regression.json)。受控runner從導航到單篇可讀134–444ms；這不是一般網路速度、總載入時間或Lighthouse分數。WebKit明確early reload階段80筆來源路徑診斷完整保留於JSON；其餘pageErrors為空，沒有把這80筆隱藏或宣稱全程零診斷。

以下同一原始基準、同一UC-359、同一無關來源暫緩的前後比較：

| 尺寸 | 修改前：仍停在首頁 | 修改後：已能閱讀單篇 |
| --- | --- | --- |
| 1440×1000 | [桌面前](before-desktop.png) | [桌面後](after-desktop.png) |
| 390×844 | [手機前](before-mobile.png) | [手機後](after-mobile.png) |
| 320×740 | [窄手機前](before-small-mobile.png) | [窄手機後](after-small-mobile.png) |

[完整原文閱讀畫面](reading-mobile.png)。獨立角色已逐張檢視桌面、390與320前後及閱讀畫面，無剩餘產品必修；最終JSON亦另送複核。未負責主要實作的審查提出卡片焦點、相關閱讀控制可見、offscreen focus、正文錨點與測試分類範圍，均補修及雲端驗證。

## 變更範圍

- `assets/app.js`：優先讀分享來源、成功來源回呼、載入狀態、背景完成保留正文與焦點。
- `assets/reader.css`：載入提示沿用品牌樣式，用途正文排在提示前。
- `tests/round.test.cjs`、`tests/round-browser.cjs`：失敗先行與完整本輪走查。
- `tests/reader-search-browser.cjs`：既有完整搜尋回歸明確等待全庫ready，不再假設詳情已開即全庫載完。
- `.github/workflows/round-qa.yml`：雲端基準、三引擎預覽與正式發布驗收。
- `SITE.md`與本紀錄：保留成果、數據、限制與下一輪方向。

## 執行邊界

單一主角色實作整合；另一未參與主要實作的角色只讀獨立審查。前期設計審查請求 `gpt-6-astra`／`max`，最終獨立審查請求可選的最高推理設定 `gpt-6-astra`／`ultra`，工具接受設定；主角色及審查角色都無可核實runtime型號／推理強度或帳號最高等級的介面，不能宣稱實際使用最強模型。未另用付費API、購買credits或啟動個人GUI。瀏覽器僅在既有GitHub Actions環境執行。

GitHub CLI登入為唯讀帳號，workflow_dispatch回403；改用已授權SSH分支push觸發雲端QA，未變更憑證或帳號。

## 可重跑的檢查

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/shared-case-preview/ai-agent-use-cases
python3 -m http.server 8100 --directory /tmp/shared-case-preview
# 預覽：http://127.0.0.1:8100/ai-agent-use-cases/?case=UC-359
# 以下工具只需安裝於測試環境；產品沒有新增套件。
NODE_PATH=<browser-tools>/node_modules ROUND_ENGINES=all node tests/round-browser.cjs
NODE_PATH=<browser-tools>/node_modules READER_SEARCH_URL=http://127.0.0.1:8100/ai-agent-use-cases/ READER_SEARCH_ENGINES=all node tests/reader-search-browser.cjs
NODE_PATH=<browser-tools>/node_modules LOAD_URL=http://127.0.0.1:8100/ai-agent-use-cases/ LOAD_ENGINES=all node tests/load-recovery-browser.cjs
```

本機純Node最終87/87通過、0 fail；JS語法與靜態預覽成功。Python預覽器不是Jekyll，正式發布另驗Pages。嚴格合格數312與網站條目357分開保留，無案例內容或候選重複刪除。

三個模擬走查：收到近期UC-359連結→先讀原文→背景完成繼續讀；提早關閉→依問題搜尋並組合篩選→空結果／返回／重整；目標失敗→原缺項提示→補讀開啟，並比較P-003待查限制。另補鍵盤返回卡片、相關閱讀焦點、滑鼠捲動與載入中原生重整。這些是檢查，沒有真人訪談、留存或轉換率主張。

資產增加3,698個未壓縮bytes，分檔gzip差額共1,151bytes：[尺寸計算](asset-sizes.json)。不是實際網路傳輸或Lighthouse分數；沒有新增前端依賴。

## 限制與下一輪

沒有實體手機、iOS軟鍵盤或真人螢幕閱讀器驗證；axe不等於完整無障礙認證。受控延遲量測只證明無關來源不再阻擋單篇，不代表所有網路都會得到相同時間。GitHub Actions artifact有保存期限，本紀錄選定截圖與JSON保留於repo。

全庫搜尋仍需讀取所有來源，不宣稱已降低總流量或做到離線使用。下一輪最值得做：量測回訪全文載入成本，再設計能驗證資料新鮮性的快取策略；不要僅以部署revision查詢參數推定CDN內容屬於同一版本。
