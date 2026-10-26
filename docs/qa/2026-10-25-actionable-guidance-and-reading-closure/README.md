# 2026-10-25 案例詳情受眾指引覆蓋、落地流程直達、閱讀閉環探索與 Actions 錨定加固

## 選題、方案與取捨

**問題證據：**
1. 訪客開啟案例詳情對話框後，全庫有 294 篇案例未在 Markdown 中聲明「目標使用者」，導致首屏缺少受眾定位，新訪客無法第一時間判斷是否契合自身需求。
2. 詳情對話框中的「🚀 怎麼開始」與「⚠️ 要注意什麼」結構化指引被置於深層且預設收合的 `<details class="reader-guidance">` 中，訪客往往捲過長篇導覽與報告卻錯過最實用的落地摘要。
3. 閱讀完案例後，底部僅有一個「關閉閱讀」按鈕，缺乏「一鍵複製精華筆記」或「接續探索該情境更多案例」的明確下一步，閱讀流程形成死胡同；且若在背景載入期間聚焦底部按鈕，載入完成時焦點會被錯置。
4. Actions 驗收中，若在 `detail-load-status` 之上聚焦持久元件（如 `.reader-method-shortcut`），背景加載完成移除 status 時會誤套用下游節點的滾動補償，造成 84px 的垂直偏移跳動。

**目標使用者：** 首次或回訪探索 AI Agent 實用案例的工程師、知識工作者與自學者。

1. **方案 A（採用）：全面補齊受眾指引、增加指引直達入口、建構文末下一步閉環並加固 Actions 錨定。**
   - 建立 `SCENARIO_TARGET_USERS` 字典，為未宣告受眾的案例提供白話、誠實的情境受眾推薦。
   - 於 `.plain-overview` 提供 `.reader-guidance-shortcut` 直達入口，一鍵展開並平滑滾動至建議步驟。
   - 於 `.related-cases` 文末新增 `.detail-next-actions`（探索更多該情境案例、複製本篇筆記與連結），並在 `refreshRelated()` 中完整保留新操作按鈕之焦點與狀態。
   - 在 `selectReadingAnchor` 中增加 `focusAboveStatus` 保護，消除背景加載移除 status 時的 84px 滾動跳動。
   - 優點：全覆蓋 447 篇案例的受眾認知與操作閉環，解決閱讀中斷問題，並穩定 Actions 測試；取捨：對話框新增少量語意節點與按鈕，需維持嚴格的 44px 觸控與零水平溢出標準。
2. **方案 B：重構整個詳情 DOM 結構為標籤頁（Tabs）或大幅改寫 Markdown 原文。**
   - 可將指引、原文、延伸閱讀拆成多個 Tab，但破壞了既有閱讀導覽、原文章節跳轉與列印／PDF 相容性，且改寫 Markdown 違反「不編造案例、保留原始事實」原則；不採用。

本輪不處理：不新增第三方追蹤器、cookies、登入或收費功能；不修改既有案例研究客觀事實與來源連結。

## 實作與驗收

- `assets/app.js`：
  - 定義 `SCENARIO_TARGET_USERS` 全套語意字典（生活、工作、省錢、學習、創作、開發），在 `showDetail()` 中對未宣告目標使用者之案例智慧補齊白話適合對象。
  - 於 `renderRelated()` 新增 `.detail-next-actions` 操作區，包含「關閉並探索更多『情境』案例 →」（自動套用篩選並移至結果）與「複製本篇筆記與連結 📋」（乾淨提取標題、用途、開始步驟、注意事項與永久直鏈，嚴格移除多餘 hash 避免洩漏敏感參數）。
  - 加固 `refreshRelated()`，在背景載入完成替換延伸閱讀 DOM 時，精確保留 `.detail-action-scenario` 與 `.detail-action-copy` 的鍵盤焦點，消除焦點跳回關閉按鈕之瑕疵。
  - 為卡片底部 `span.proof` 宣告 W3C 語意 `role="note"` 與 `aria-label` 完整憑據說明。
  - 加固 `selectReadingAnchor`，加入 `focusAboveStatus` 判定，當焦點位於 status 之上時抑制不當的下游滾動補償，將手機端 84px 跳動徹底穩定至 0px。
- `assets/reader.js`：
  - 在 `enhance()` 階段於 `.plain-overview` 動態注入 `.reader-guidance-shortcut`「建議操作流程與注意事項 ↓」，點擊自動展開 `.reader-guidance` 並平滑錨定至其 `<summary>`。
- `assets/reader.css`：
  - 修復未定義的 `var(--fg)`，全面統一為 `var(--ink)`。
  - 定義 `.reader-guidance-shortcut`、`.detail-next-actions`、`.detail-action-scenario`、`.detail-action-copy`、`.detail-action-status` 樣式，支援手機端自動直向堆疊、全寬佈局與 >= 44px 無障礙觸控。
- `tests/detail-reading-and-evidence.test.cjs`：
  - 擴充 5 項單元測試，嚴格驗證受眾字典、受眾 fallback、延伸下一步操作、卡片憑據無障礙屬性與 CSS 變數合法性。
- `tests/mobile-search-browser.cjs` 與 `tests/reader-browser.cjs`：
  - 嚴格界定 macOS WebKit 略過按鈕 Tab 之相容處理，保障跨引擎（Chromium / Firefox / WebKit）自動化測試 100% 通過。

## 修改前後截圖

| 視口 | 修改前 | 修改後 |
|---|---|---|
| 桌面 1440×900 首頁 | [修改前首頁](screenshots/before-desktop-home.png) | [修改後首頁](screenshots/after-desktop-home.png) |
| 桌面 1440×900 詳情首屏 | [修改前 UC-005 首屏（無受眾、無指引捷徑）](screenshots/before-desktop-detail-top.png) | [修改後 UC-005 首屏（有適合對象與指引直達）](screenshots/after-desktop-detail-top.png) |
| 桌面 1440×900 詳情文末 | — | [修改後 UC-005 文末（情境探索與筆記複製）](screenshots/after-desktop-detail-bottom.png) |
| 手機 390×844 詳情首屏 | [修改前手機首屏](screenshots/before-mobile-detail-top.png) | [修改後手機首屏](screenshots/after-mobile-detail-top.png) |
| 手機 390×844 詳情文末 | — | [修改後手機文末（全寬 44px 觸控按鈕）](screenshots/after-mobile-detail-bottom.png) |
| 窄手機 320×740 詳情 | — | [修改後窄屏詳情（零水平溢出）](screenshots/after-narrow-detail-top.png) |

本機預覽方式：
```sh
python3 scripts/preview.py /tmp/ai-usecase-preview-20261025/ai-agent-use-cases
python3 -m http.server 8288 --directory /tmp/ai-usecase-preview-20261025
```
預覽網址：`http://127.0.0.1:8288/ai-agent-use-cases/?case=UC-005`。

## 實際走查與結果

1. **新訪客痛點檢索與指引直達（情境一）：**
   - 首次造訪者在首頁點選常見痛點「規劃旅行」，輸入框即時填入並命中 26 筆案例；點開 UC-001，首屏清晰顯示「適合對象：想用 AI 簡化日常生活瑣事、旅行規劃或家庭事項安排的讀者」；點擊「建議操作流程與注意事項 ↓」順暢展開入門指引卡片；捲動至文末點擊「關閉並探索更多『生活』案例 →」，對話框關閉且精準切換至「生活」情境，焦點抵達結果計數。
2. **開發者閱讀與乾淨筆記複製（情境二）：**
   - 開發者帶帶有 arbitrary hash 之網址（`?case=UC-005#some-hash`）開啟案例，首屏顯示「適合對象：工程師、程式開發者、技術架構師或自動化流程建構者」；捲動到底部點擊「複製本篇筆記與連結 📋」，狀態立即播報「已複製案例筆記！」，剪貼簿生成包含 ID、標題、用途、怎麼開始、注意事項與標準直鏈的完整結構化筆記，並確認已剔除 `#some-hash`。
3. **窄螢幕手機無障礙與錨定零跳動（情境三）：**
   - 於 320px 及 390px 視口開啟 UC-005，確認水平捲軸 `scrollWidth - clientWidth = 0`，底部按鈕均維持 >= 44px 觸控高度；在背景加載延遲情況下聚焦持久控制項，加載完成移除 status 時之位置位移量 `delta = 0px`（完全消除舊版 84px 跳動）；卡片來源憑據標籤具備 `role="note"` 與詳細說明文字。

*註：以上為瀏覽器自動化走查結果，不冒稱真人使用者喜歡或轉換率已提升。*

## 測試、限制與下一步

- **單元測試：** 執行 `node --test tests/*.test.cjs`，全套由 308 項擴充至 **313 項全數通過**（5.20s）。
- **語法與建置：** `node --check assets/*.js tests/*.cjs` 通過，Python preview 生成 449 篇案例索引正常。
- **跨引擎端到端驗收：**
  - `node tests/round-browser.cjs` 在 Chromium 4 種視口（1440/390/320/480px）全部通過，Axe 掃描 0 違規，狀態移除位移為 0px。
  - `node tests/method-shortcut-browser.cjs` 驗證通過，Axe 掃描 0 違規。
  - `node tests/reader-browser.cjs` 於 Chromium、Firefox、WebKit 跨三引擎走查全部通過，Axe 掃描 0 違規。
- **獨立代碼審查：** 由獨立 reviewer 審查提出 4 項 P2 建議（refreshRelated 焦點保持、URL hash 剝除、W3C 語意標註、WebKit 測試範圍收斂），均已全數修正並驗證通過。
- **未能驗證與外部風險：** 本專案部署於 GitHub Pages，Actions 與 CDN 部署存在 10~15 分鐘之發布時差；本輪已確保本機 preview 與 CI 測試契約一致。
- **下一輪最值得做的一件事：** 為搜尋結果卡片提供依問題情境的折疊展開摘要或「快速預覽」浮層，讓桌面端使用者不用每次點進彈窗即可快速掃描 3 步操作重點。

## 後續獨立審查與複製可靠性修正

獨立 reviewer 的初審找到複製筆記回退內容、非同步請求與計時器三個缺口。修正後的再次審查又發現一項：手動回退欄位在背景載入刷新後會失焦。新增 regression coverage；修改前筆記回退與最新請求測試先失敗，依次修正後通過。

- 剪貼簿不可用／遭拒時改提供完整唯讀筆記欄位；讀者焦點仍在複製按鈕時才自動選取回退內容，避免搶走已移動的焦點。
- 筆記另保留來源證據狀態；同一操作的較舊請求不再覆蓋最新回饋，重試會取消舊回饋計時器。
- `refreshRelated()` 沿用既有操作區 DOM，並在刷新時恢復唯讀回退欄位的鍵盤焦點；以本機 Chromium 實際重現修正前焦點落到「關閉閱讀」，修正後仍留在筆記欄位。
- `node --test tests/detail-reading-and-evidence.test.cjs`：14/14 通過；`node --test tests/*.test.cjs`：317/317 通過。
- `node --check assets/app.js`、`node --check assets/reader.js`、`node --check tests/detail-reading-and-evidence.test.cjs`、`node --check tests/reader-browser.cjs` 通過；Pages 相容 preview 與 `check_corpus_bundle.py` 通過，447 份來源逐 byte 一致。
- 本機 Ruby 2.6.10 沒有 `jekyll` executable，無法執行本機正式 build。PR #101 最新 head 的 Reader QA、Reading flow、preview 與其他必需 checks 在合併前全數通過；合併後主線發布狀態與 Reader QA timeout 另記於下節。
- PR #101 原有協作者提交；本輪新增 fast-forward 修正並推送，未 force push。合併為 `1dbf3af`；後續 Reader QA 發布等待修正見下節。

## 合併後 Pages 與 Reader QA 超時追蹤

PR #101 已合併至 `main`，merge commit `1dbf3af`。合併後 Pages build/deploy run `40160388037` 成功，但從主線推送到部署完成約 12 分鐘。Reader QA run `40160388670` 在 `Verify published reader` 階段被 GitHub runner 的 12 分鐘 job 上限終止；這是超時，不是功能斷言失敗。Reader QA 同時安裝瀏覽器、跑本機 preview 並驗證實際發布頁，12 分鐘上限無法涵蓋已觀察到的發布等待加完整走查。

follow-up PR #102 將 `.github/workflows/reader-qa.yml` 的 job timeout 由 12 分鐘提高至 30 分鐘，並把正式站資產比對改為 60 次輪詢，每次請求最多 5 秒、間隔 10 秒（最長約 15 分鐘）。正式站仍需逐 byte 符合六項資產；未跳過檢查、降低斷言或更動訪客頁面。

PR #102 已合併（`9a13b24`）；合併後 Pages build/deploy run `40161989188` 成功、Reader QA run `40161989178` 全部通過（8m54s，含 published reader）、Corpus bundle run `40161989162` 通過（9m22s）。最新正式站 Reader QA 成功，驗證此 job 預算可完成部署檢查與瀏覽器走查。

Actions 的 Node.js 20 deprecation warning 仍存在：`actions/checkout@v4`、`actions/setup-node@v4`、`actions/upload-artifact@v4` 被 runner 強制以 Node.js 24 執行。未擴大成 57 個工作流程的 action 升版，列為下一輪維護風險。
