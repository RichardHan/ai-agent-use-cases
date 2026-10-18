# 2026-10-18 案例閱讀改善驗收

本輪由單一整合者修改前端，另一角色獨立審查程式與實際截圖。模型與推理強度的會話設定無可用查詢／切換介面，未宣稱已確認主會話使用最高設定。測試瀏覽器與套件只在既有 GitHub Actions runner 執行，未操作個人桌面或啟動付費 API。

## 問題與選擇

[正式站基準走查](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39099223854)在桌面與手機確認：旅遊＋工具＋分類得到 3 筆結果，返回保留搜尋、空結果能復原；UC-005 有 19 個主段落、21 個來源連結，卻沒有導覽。UC-313 的具體失敗結果及唯一來源也藏在通用摘要下的研究展開區。

兩案比較：A 從原文建立導覽及顯示頁首證據，成本較低、保留每則來源差異；B 逐篇重編統一問題／方法／結果頁，初讀較一致，但需重新核對整庫且容易漏掉版本限制。選 A，服務想判斷是否適用、或回來核對某段的讀者。本輪不重寫案例事實、計數規則、框架或首頁探索。

驗收標準：可直接到達存在的段落；完整目錄保持原標題；不捏造缺少的章節或證據；待查仍明示限制；跳轉與返回不改 URL、history 或背景列表位置；標題不被工具列遮擋；鍵盤焦點留在正確位置；手機沒有橫向溢出；搜尋、分享、直鏈與重新整理可用。

## 實作與審查

- `assets/reader.js`：從安全渲染的正文建立快速入口與完整目錄；保留原證據行與來源連結，缺欄位明示未知；每段可回到導覽。
- `assets/reader.css`：沿用品牌色與字體；320px 工具列不折行，導覽保留兩欄。首次雲端檢查發現 hover 小字只有 4.34:1，已加深文字顏色並加入 hover 驗收。
- `assets/app.js`、`index.html`：漸進增強 hook、腳本順序、換案例焦點，以及分享網址內的方向鍵編輯保護；導覽腳本失敗時仍可讀原研究。
- `tests/reader*`、`.github/workflows/reader-qa.yml`：原文目錄／證據／錯誤狀態／來源／三瀏覽器檢查，正式部署比對六個實際檔案及 SHA-256，避免驗到舊站。

獨立審查提出並修正：QA 漏檔、部署版本誤判、換案例後焦點、返回位置檢查、320px 工具列折行，以及導覽前看不到本庫未獨立重現提示。原始研究、作者歸因與資料欄位均保留。

## 截圖

截圖是雲端瀏覽器開啟實際網站／預覽的結果，不是設計示意圖。修改前來自上述正式站基準；修改後使用同一 UC-005 與尺寸。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 1440 × 1000 | [桌面](before-desktop.png) | [桌面](after-desktop.png) |
| 390 × 844 | [手機](before-mobile.png) | [手機](after-mobile.png) |

另保存 [320px 工具列與導覽](after-small-mobile.png)及[跳到 UC-313 具體結果](result-mobile.png)。

## 實際驗收結果

[Reader QA 39100387197](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39100387197)使用 Playwright 1.64.1 全部通過：

| 檢查 | 實際結果 |
| --- | --- |
| `node --test tests/*.test.cjs` | 8 tests、8 pass、0 fail；317 筆條目 |
| 語法／靜態預覽 | JavaScript 語法通過；315 個 Markdown 檔案均存在，產生有效索引 |
| Chromium | 1440 × 1000、390 × 844、320 × 740 三情境通過 |
| Firefox／WebKit | 各 390 × 844 三情境通過 |
| 目錄與證據 | 317 筆、2,142 節、336 行原始證據；標題、索引及安全來源對應通過 |
| axe | 15 次掃描，0 項違規，包含 hover、展開正文與待查狀態 |
| 其他狀態 | 缺證據、無章節、重複標題、惡意樣式文字、網路失敗／重試、導覽腳本下載失敗的原閱讀備援通過 |

[最後整合回歸 39100625372](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39100625372)也全部通過：除上述閱讀驗收，再執行既有 `tests/discovery-browser.cjs`，三個尺寸的首頁情境引導、抽卡不重複、組合篩選、分享成功／拒絕權限及網路錯誤復原均通過。沒有以新功能測試取代既有回歸。

原始結果：[全庫對應](corpus.json)、[axe](accessibility.json)、[載入量測](timings.json)。新增 JS 5,106 bytes、CSS 2,678 bytes；Node gzip 合計 3,193 bytes（壓縮計算值，非宣稱正式站傳輸量）。hover 文字 `#526057` 對背景 `#e9eee0` 的計算對比為 5.61:1。未節流雲端預覽的 DOMContentLoaded 為 15–232ms、load 61–232ms；這些是單次 runner 的頁面事件時間，不是全庫案例就緒時間、使用者體感或 Lighthouse 分數。

舊測試工具 Playwright 1.56.1 的 WebKit 曾在 `main` 與新版都於相同換頁步驟崩潰：[對照執行](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39100107762)、[原始診斷](webkit-baseline-diagnostic.json)。[上游 300402](https://bugs.webkit.org/show_bug.cgi?id=300402)有相近的 navigation assertion，未取得本次原生 backtrace，不能確證同一根因。僅升級雲端測試工具到官方穩定版後，本輪三瀏覽器驗收通過；沒有為繞過測試修改網站行為，也不宣稱實體 Safari 已驗證。

## 可重跑檢查

```sh
node --test tests/*.test.cjs
node --check assets/app.js
node --check assets/reader.js
python3 scripts/preview.py /tmp/ai-reader-preview/ai-agent-use-cases
python3 -m http.server 8082 --directory /tmp/ai-reader-preview
# 在已授權的雲端測試環境，提供 playwright 與 @axe-core/playwright：
NODE_PATH=<browser-tools>/node_modules node tests/reader-browser.cjs
```

專案沒有獨立 lint、TypeScript 或 npm build。Python 預覽會模擬 Liquid 索引，不等同 Jekyll；正式版本仍須核對 Pages 建置與部署後測試。

三個模擬情境：旅遊問題搜尋與組合篩選後閱讀／返回；分享長篇開發案例、核對來源與重新整理；閱讀失敗案例並確認待查線索不被當成已完成結果。模擬檢查不代表真人偏好或轉換率改善。

載入量與限制：現有前端仍會讀取全部 Markdown；一次重跑正式站在第二個尺寸載入逾時，原因未定位。後續前後比較使用固定版本的雲端預覽，正式部署另驗。自動化 axe 不等同完整無障礙認證，也未進行真人或實體 iPhone 測試。下一輪優先減少全庫下載與單筆失敗造成整體不可用的風險。

GitHub PR 建立遭目前 Enterprise Managed User 帳號的存取限制拒絕；依本輪既有明確授權，以可用 Git push 權限直接整合到 main，不切換帳號或變更權限。
