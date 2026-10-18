# 2026-10-18：分享搜尋與回到結果

## 問題、選擇與範圍

目標讀者：收到朋友的案例搜尋連結、收藏搜尋條件後回訪，或直接開啟案例再想看其他結果的人。

正式站雲端 Chromium 實測 `?q=旅遊&tool=Grok%20Bot`：桌面與手機都停在首頁探索區，搜尋條件已套用卻在首屏外。390px 的結果數位於 1,874px；直接案例關閉後焦點在 `draw-case`。這不是真人研究，也沒有量測留存或轉換。

比較方案：
- 只修直鏈落點：成本低，能縮短回訪路徑，但分享仍仰賴手動複製網址。
- 完成分享與返回流程（採用）：成本中等，增加可找到的複製入口、失敗備援、搜尋落點與案例返回，讓發送者和收件者都能完成任務。

驗收：分享保存關鍵字與五個篩選、移除案例及無關 URL 參數；搜尋直鏈與重新整理落在搜尋區；直接案例仍優先開啟，關閉回結果；站內開啟仍返回原按鈕；支援空結果、長輸入、剪貼簿失敗／不存在／非同步舊回應、錯誤重試、鍵盤與窄螢幕。一般首頁、其他明確 hash 與搜尋載入期間的主動操作不被自動搜尋落點覆蓋。

不處理：研究資料、同義詞、證據判定、案例去重、難度分類、框架及部署方式。明確 `?case=` 連結仍在內容載入後開啟指定案例；手動操作保護針對搜尋落點，不取消此既有直鏈語意。

## 變更

- `assets/app.js`：搜尋分享 URL 白名單、複製成功與手動備援、過期非同步回應防護；搜尋到達與案例關閉焦點；重試先把焦點移至持續存在的狀態。
- `index.html`、`assets/style.css`：結果數旁分享按鈕、可選取網址與狀態、搜尋標題焦點。延續綠色品牌與原生控制。
- `tests/arrival.test.cjs`：URL 與到達意圖回歸。
- `tests/arrival-browser.cjs`、`tests/arrival-baseline.cjs`、`tests/arrival-live.cjs`：三種情境、前後截圖、座標、axe、載入／複製邊界。
- `tests/reader-browser.cjs`、`tests/reader-baseline.cjs`：接入既有跨引擎雲端驗收，並修正 baseline helper 呼叫。

網站沒有新增第三方請求、儲存、追蹤器或 npm 依賴。主功能提交 90393a3 的 app.js 由 35,845 增至 38,714 bytes；這是原始檔大小，不是效能分數。本輪主功能基準為 325 主要案例、331 總條目與 296 嚴格核對計數；沒有刪改案例、來源或協作者內容。收尾期間協作者另新增五篇案例與稽核資料，主要案例／總條目／嚴格核對數更新為 330／336／300；它們不屬於本輪產品改善成果，合併時完整保留。

## 前後畫面與量測

同一查詢、同一 Chromium viewport，Y 座標相對視窗上緣；首次抽卡隨機，原首頁高度會隨抽卡文字稍變。這些數字是記錄的樣本，非所有載入的固定值。

| 視窗 | 修改前結果數 Y（正式站） | 修改後結果數 Y（最終正式站；320px 為預覽） |
|---|---:|---:|
| 1440 × 1000 | 1502 | 684 |
| 390 × 844 | 1874 | 510 |
| 320 × 740 | 2042 | 561 |

| | 修改前 | 修改後 |
|---|---|---|
| 桌面 | ![桌面修改前](before-desktop.jpg) | ![桌面修改後](after-desktop.jpg) |
| 手機 | ![手機修改前](before-mobile.jpg) | ![手機修改後](after-mobile.jpg) |

[直接案例關閉後](return-mobile.jpg) · [上一頁回原卡片（Firefox）](back-mobile.jpg) · [保留條件的空結果](empty-mobile.jpg) · [原始基準量測](verification.json) · [最終驗收資料](final-acceptance.json)

修改後圖片已更新為最後正式站截圖；包括協作者 PR #44 的搜尋命中說明。內容由初始331條目／16筆旅遊結果增至336／17，來自協作者研究批次，不能當成本輪提升搜尋召回的證據。

## 實際驗收

- 原有基準：24/24 通過；既有 Chromium 三尺寸流程與 axe 通過。
- 先紅：667b127 的 [Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39125819887) 為 24 pass / 3 fail，缺少新分享／到達行為。
- 主功能版本 90393a3：[Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39126231359) 與 [Reader QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39126231397) 均 success；27/27 測試、Node 語法、Python 預覽建置通過。
- Chromium 1440／390／320px、Firefox／WebKit 390px 的三情境與邊界測試通過；新流程 10 次 axe 掃描均 0 違規。既有閱讀、手機篩選、探索、空結果測試一起通過。
- 全庫 331 條目／2,248 節／350 行證據對應通過，沒有以查詢結果數冒充案例品質。
- 雲端 runner 的未節流 localhost 預覽 document loadEventEnd 樣本為 29–195ms，DOMContentLoaded 為 26–76ms；這些只是文件事件，不是整庫可操作時間或真實行動網路表現。原始數據在 verification.json，不聲稱速度改善。
- 初次 baseline 串接曾把輸出物件當函式呼叫而失敗；修正 helper 使用後，完整基準走查通過。屬本輪測試腳本失誤，不是網站原有失敗。
- 原始量測修改前取自正式站、修改後取自 90393a3 雲端預覽；來源連結在同基準後續走查實際開啟 zenn.dev 文章與 GitHub 原始 issue。

三種模擬情境（初始 331 條目基準；後續 336 條目的相同旅遊查詢為17筆，新增 UC-337 來自協作者研究批次）：
1. 收到「旅遊＋Grok Bot」搜尋連結 → 看見條件與16筆結果 → 複製 → 新收件者分頁開啟／重新整理 → 開案例 → 返回／直鏈關閉。
2. 收到「旅遊＋開發情境＋旅遊分類」空結果 → 只移除衝突情境 → 保留關鍵字並恢復結果。
3. 長關鍵字且剪貼簿被拒 → 選取手動網址；條件改動清除過期回饋；剪貼簿不存在與延遲完成亦正確處理。

另外沿用閱讀測試走查來源連結、長內容、段落導覽、原始證據、安全文字、缺選用腳本、個別案例404、copy.json失敗與整體索引錯誤。無障礙是自動化 axe 加上鍵盤操作與截圖人工檢查，不能等同完整讀屏器或真人測試。沒有 Lighthouse 分數，也沒有聲稱實體 iPhone/Safari 已驗證。

## 重現與預覽

沿用 Python 靜態預覽與 GitHub runner 既有工具：
```sh
node --test tests/*.test.cjs
node --check assets/app.js
python3 scripts/preview.py /tmp/ai-arrival-preview/ai-agent-use-cases
python3 -m http.server 8082 --directory /tmp/ai-arrival-preview
NODE_PATH=<cloud-browser-tools>/node_modules node tests/reader-browser.cjs
```

Reader QA 使用 Playwright 1.64.1、axe 4.10.2，於 GitHub Ubuntu runner 安裝；網站本身無第三方依賴。沒有獨立 lint、TypeScript 或 npm build。Python 預覽模擬 catalog，不等同正式 Jekyll；合併後須確認 Pages build and deployment，以及 Reader QA 對正式六個 assets/HTML 的逐字比對和實際流程。

[正式搜尋預覽](https://richardhan.github.io/ai-agent-use-cases/?q=%E6%97%85%E9%81%8A&tool=Grok+Bot#explore) · [PR #40](https://github.com/RichardHan/ai-agent-use-cases/pull/40)

## 獨立審查與執行邊界

獨立角色僅透過 GitHub 讀取並審查實作，主代理是唯一整合者。審查 f78f780 找出 retry 隱藏按鈕後失焦，90393a3 修正並加即時與載入後焦點斷言；第二次審查確認修正、無其他阻擋。另依建議用新收件者分頁測分享，明確界定搜尋與案例直鏈優先順序。

主代理實際模型 ID、推理強度及帳號最高可用選項未提供可查證／切換介面，故不宣稱已使用最強設定。獨立審查指定工具提供的 `gpt-6-astra / ultra`；曾遭模型容量不足，重試同設定後完成。未切換付費 API 或購買額度。

開始只讀取得工作目錄與 OpenAI Docs 技能後，因目錄為 `/Users/...` 停用本機工具。repository 讀寫、Git 分支、瀏覽與測試都改走 GitHub 連線／既有 Actions；沒有修改本機檔案或操作本機 GUI。本機未提交修改／worktree 無法在使用者限制內查驗，因此沒有宣稱本機乾淨。遠端基準 `1fc4af3`，無 AGENTS.md、無原有 open PR；新分支 `feat/shared-search-arrival-20261018`，只 fast-forward 更新自身分支，無 reset 或強推。

## 合併後補驗與修正

[PR #41](https://github.com/RichardHan/ai-agent-use-cases/pull/41) 保留原有嚴格斷言，加入每次導覽的 URL、篩選、結果 ID、載入總數、略過檔案與 HTTP 診斷；Reader QA 路徑觸發也納入 arrival 測試。

- 首兩次正式 Reader QA 出現 16 → 10 筆。後續 [直接診斷 39128434585](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39128434585) 證實 71 個來源回傳 HTTP 429，載入總數由 331 降至 258；關鍵字與所有篩選沒有改變。不是關閉案例時改掉搜尋條件。[診斷摘要](postmerge-diagnostics.json) 保留證據。
- 完整測試先前在正式站反覆載入整庫，短時間產生數千次請求。現在完整故障注入／邊界測試繼續在預覽跑；Reader 正式站保留六個 assets/HTML 精確比對，並以 Chromium 四次、Firefox／WebKit 各兩次的真實整庫載入驗收分享、直鏈、重新整理、返回、閱讀與空結果。仍要求零略過來源、條目數及相同順序的結果 ID 完全相同；沒有回應替身、自動重試或接受部分資料。
- [WebKit 對比失敗 39128127748](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39128127748) 發現既有 chip 的文字／背景同步漸變產生 1.84:1 中間對比。改為僅陰影過渡，減少動態效果時取消 chip 過渡；既有配色不變，補上偏好驗證。
- [分享錨點返回失敗 39128852592](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39128852592) 發現從真正包含 `#explore` 的搜尋連結開案例再按上一頁，原卡片焦點未恢復。將真實分享 URL 納入完整測試，Chromium 診斷實際記錄到返回時焦點落到 BODY；現在於 fragment 歷史返回後做一次有條件的焦點補復，並讓原按鈕出現在視窗內；若已導覽、重開案例或移到其他控制項則不介入。
- 上述補強集中於 [PR #42](https://github.com/RichardHan/ai-agent-use-cases/pull/42)；臨時雲端診斷 workflow 在合併前刪除。獨立審查確認未覆蓋協作者 `4d74354` 的資料庫／登入同義詞修改；收尾時又保留 `0d8cbf1` 的研究批次與行銷／採購等同義詞更新。
- 短程診斷初稿曾缺少輸出資料夾初始化，已修正；它是本輪驗收腳本問題，不記為產品故障。

- [PR #45](https://github.com/RichardHan/ai-agent-use-cases/pull/45) 補上原生歷史返回後的明確 nearest／instant 捲動，也處理原按鈕已保有焦點的情況。首次位置診斷顯示按鈕底部由 868.015625px 回到 844.015625px（844px 視窗），跨兩個 frame 穩定；測試採 1 CSS px 取整容差，沒有加入額外延遲或放寬來源完整性。獨立審查 `baec098f` 未發現阻擋，要求最後整合 main 全綠才驗收。

- 合併期間協作者 [PR #44](https://github.com/RichardHan/ai-agent-use-cases/pull/44) 加入搜尋命中欄位／原文節錄。獨立審查確認卡片 ID、按鈕與焦點選擇器仍相容；以正常 merge 保留其 app、CSS、31 項總測試及新 QA 工作流程，沒有以舊檔覆蓋。

- 收尾另保留 `3cfb36e` 的瀏覽器／帳號／轉錄同義詞與 URL 正規化更新。舊版本 dcb26ba 的正式資產比對因 main 已更新而失效，最終以新版本驗收為準。
- 最新 Firefox 的延遲載入測試曾出現焦點正確、scrollY 279≠100（[39131498735](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39131498735)）。獨立審查確認應隔離測試：以明確 catalog gate 取代固定 1.2 秒延遲，僅在此 fixture 關閉原生 scroll anchoring，釋放前後都保留精確 100px 與焦點斷言。真實流程維持原生 anchoring；驗收意義是網站不再自動跳搜尋區，不承諾瀏覽器版面補償永不改變 scrollY。產品程式未因此改動。

### 最終發布驗收（已完成）

最終驗收提交 `730903c7`（產品檔與 `3cfb36e` 相同）：[Reader QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39132088766)、[Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39132088828)、[Pages build and deployment](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39132088814) 均 success；相同產品檔的 [Search Context QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39131498723) 亦 success。

31/31 單元／資料測試、Node 語法、Python 預覽及正式 Jekyll 建置通過。Chromium 三尺寸、Firefox／WebKit 手機完整流程通過；延遲載入 fixture 在三引擎皆保留 filter-summary 焦點與100px。正式 Reader 六個 assets/HTML 精確比對成功，八次整庫載入皆336條目、零略過來源、17筆相同順序結果；新正式流程10次axe掃描零違規。三種模擬情境及既有探索／閱讀／錯誤邊界均通過。人工檢視雲端前後截圖、原卡片返回焦點、直接案例關閉與空結果畫面，沒有橫向溢出或文字重疊。

以上是可重現的雲端驗收，不是真人滿意度／回訪率證據。獨立審查已確認主要修正、合併相容性及測試隔離；主代理是唯一整合者。本輪到此停止。

## 下一輪

優先量測並改善整庫逐檔下載的請求成本與部分載入恢復：本輪已有 HTTP 429 的實際證據，下一輪應比較合併靜態讀取資料與明確重試入口，保留原始 Markdown／證據、靜態 Pages 相容性和完整性檢查。降低 CI 重載次數不是產品載入效能改善，也不代表真實使用者不會遇到限流。協作者 PR #44 已在本輪收尾期間完成搜尋命中說明，保留其結果，不列為待重做項目。
