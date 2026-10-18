# 2026-10-18：手機搜尋前置與按需篩選

[PR #39](https://github.com/RichardHan/ai-agent-use-cases/pull/39) · [正式網站搜尋區](https://richardhan.github.io/ai-agent-use-cases/#explore)

## 問題與選擇

目標讀者是已有具體任務、用手機尋找案例的新訪客與回訪者。雲端 Chromium 實際走查 main `c14d4af`：390px 搜尋區起點到輸入框 416px，輸入框到第一張結果再 361px；320px 前一距離更達 489px。五個尚未使用的篩選與兩列快捷按鈕先佔據畫面。

比較兩個方案：A 搜尋前置、原生 details 按需展開（低成本，進階操作多一次點擊）；B 手機獨立篩選抽屜（更集中，但需額外管理焦點、返回與套用狀態）。選 A，沿用品牌和靜態架構。

驗收：手機搜尋框距搜尋區起點 <160px；無條件時首張結果距搜尋框 <240px；保留組合篩選、條件摘要、零結果復原、分享與詳情返回。此次不改案例資料、同義詞、排序或首頁抽卡。

## 結果與前後畫面

數字為 CSS px，相同 viewport 與預覽方法測得；不是轉換率或真人偏好。

| 尺寸 | 區段起點→搜尋框，前→後 | 搜尋框→首張卡，前→後 |
| --- | --- | --- |
| 桌面 1440×1000 | 273 → 135 | 219 → 397 |
| 手機 390×844 | 416 → 158 | 361 → 181 |
| 小手機 320×740 | 489 → 158 | 361 → 181 |

390px 首張結果相對區段起點提前 438px；320px 提前 511px。桌面預設展開，搜尋框前移，但增加摘要列使首張卡相對區段起點下移 40px，這是保留全部進階控制的取捨。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面 | [畫面](before-desktop.jpg) | [畫面](after-desktop.jpg) |
| 手機 | [畫面](before-mobile.jpg) | [畫面](after-mobile.jpg) |
| 小手機 | [畫面](before-small-mobile.jpg) | [畫面](after-small-mobile.jpg) |

[手機展開與鍵盤焦點](expanded-mobile.jpg)。截圖已人工視覺檢查：搜尋／結果層級、長標題換行、觸控控制、無橫向溢出、展開與收合狀態。

## 實作與保留

- `index.html`：搜尋在前，快捷任務與五個篩選放入原生 details；條件摘要、結果與錯誤復原維持在外。
- `assets/app.js`：只在初始載入決定 <=760px 收合；後續輸入、返回與縮放保持使用者選擇，避免隱藏焦點。摘要顯示已套用篩選數，不將關鍵字算成篩選。
- `assets/style.css`：原生 summary 焦點樣式、手機控制至少 44px、沿用綠色與閱讀樣式。
- 新增 `tests/mobile-search-browser.cjs`、`mobile-search-baseline.cjs`、`filter-controls.cjs`；既有 discovery／reader／search-recovery／baseline／deployed browser 測試透過可見 summary 展開，沒有繞過操作。
- Reader QA paths 納入共用測試，未新增網站依賴、追蹤、cookies、登入或第三方資料傳送。

工作全程透過 GitHub API、既有 GitHub-hosted runner 和雲端來源讀取，沒有操作個人電腦。因此本機分支、未提交修改與未追蹤檔案未讀取／未修改，也不宣稱已驗證本機工作樹乾淨。遠端起始無 open PR；main 研究更新 `f59fe44` 的五個資料檔以原 blob 完整保留，整合為 `5ee4e0f`，沒有衝突或強推。

## 驗證

先紅後綠：

- [基準 run](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39121760354)：24/24 原有測試、三尺寸流程通過。
- [紅燈 run](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39121893268)：`Search must offer an optional filter panel`，actual 0、expected 1；24/24 原有測試仍通過。
- [介面 Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39122119602)／[Reader QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39122119575)：通過，包含審查後補強。
- 整合版本的 [Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39122383394)／[Reader QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39122383366)：合併前必須通過。文件與截圖提交不改執行程式，沿用此程式版本的驗收。正式 Jekyll 建置與已部署站的驗收另由合併後 Pages／Website QA／Reader QA 執行，以其結果為準。

三種模擬情境：

1. 搜尋旅遊，組合情境／工具／分類／來源，收合後閱讀案例、返回及分享直鏈重新整理。
2. 不相容情境造成零結果，在收合狀態移除單條件或清篩選，保留原關鍵字。
3. 常見收件匣任務、待查內容、長文字與全清除；Enter／Space／Tab、縮放後焦點與展開選擇保留。

Chromium 1440／390／320px、Firefox／WebKit 390px 均驗證；新增流程展開／收合共 10 個不重複引擎尺寸狀態的 axe 掃描均 0 違規。另驗證 760／761px、載入失敗／重試、空索引、部分載入、長研究內容、來源安全連結與既有閱讀目錄。不是實體手機或人工螢幕閱讀器驗證。

`verification.json` 保存原始尺寸與時間量測。介面驗收 run 的未節流 Chromium 就緒時間為桌面 1109ms、手機 997ms、小手機 997ms；這是 GitHub runner 的本地預覽單次量測，非真實網路效能、Lighthouse 分數或效能改善結論。

```sh
node --test tests/*.test.cjs
node --check assets/app.js
python3 scripts/preview.py /tmp/preview/ai-agent-use-cases
python3 -m http.server 8081 --directory /tmp/preview
# 另開雲端程序；NODE_PATH 指向 runner 的測試依賴
node tests/discovery-browser.cjs
# reader 使用 port 8082；正式站可用 READER_URL 指定
node tests/reader-browser.cjs
node tests/deployed-browser.cjs
```

實際單元輸出：`tests 24 / pass 24 / fail 0`；語法與預覽產生成功。專案無獨立 lint、TypeScript/type-check 或 npm build；預覽模擬 Liquid 索引，不等於 Jekyll 建置。測試工具只裝在雲端 runner（Playwright／axe），網站本身無新套件。

旅遊案例的[作者原文](https://www.aiformortals.co/blog/grok-bot-vs-meta-muse-vs-chatgpt-dots)在本輪雲端讀取成功；未宣稱逐一驗證全庫外部來源或獨立重現案例。通用 web 工具無法讀取正式首頁，正式站改由已部署瀏覽測試驗證。

## 獨立審查、限制與下一輪

由未參與主要實作的獨立 reviewer 審查 `d01d2c1` 與 `8dc020f`，未發現阻擋功能、相容性或資料外洩問題。兩項非阻擋建議（共用測試 CI paths、閉合 Tab／斷點驗證）均已補上並重跑。

主執行者無法讀取／切換實際後端模型與推理設定，也無法驗證帳號最高可用模型；沒有宣稱已使用最強模型。獨立 reviewer 的啟動請求為 `gpt-6.1-sol / ultra`，這是請求值，不冒充後端實際識別結果。

不將模擬走查當作真人滿意度或轉換提升。下一輪最值得檢查：分享搜尋網址的落點，讓回訪者更快看到已有結果。
