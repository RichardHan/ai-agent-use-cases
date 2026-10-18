# 2026-10-19：先理解用途，再讀來源紀錄

## 問題、對象與選擇

對象是第一次依工作問題搜尋案例、需要判斷是否值得採用的讀者。正式站雲端走查（基準 `ffd90e7`）發現 UC-313 桌面與 390px 手機先顯示完整導覽及證據說明，才顯示用途；手機第一屏看不到用途。333 個主要案例檔中，320 個未提供專屬 how/caution，會顯示相同一般建議，實際結果仍在折疊研究中。

- A：用途後放可靠辨認的完整來源紀錄段落，一般建議預設折疊。成本中等，需要保守選段與全庫完整性比對；有助於先判斷適用性。採用此案。
- B：全文預設展開、一般摘要折疊。成本低，但重複 metadata 和多版長文仍遮住結果。

預期改善是減少讀到用途及來源紀錄前的捲動與展開操作；這是可檢查的介面改善，不宣稱真人偏好或轉換率提升。本輪不重寫案例、調整合格計數、擴充同義詞、換框架或新增第三方服務。

## 驗收標準

1. 用途開始位置出現在桌面、390px、320px 第一屏；原文紀錄先於一般建議。
2. UC-313 同時保留報告完成、未證實重複寄送及提案未執行；UC-338 保留完整來源列表和證據缺口。
3. 僅提前顯示白名單章節的完整區塊（不超過 3,200 字元），不截句；過長、不明或待查內容回原始研究，不生成實際成果。
4. 全庫提前顯示段落與原段逐節點對應，連結安全，不複製標題 ID；來源版本、方法、限制及原始 Markdown 仍可核對。
5. 搜尋、組合篩選、空結果、鍵盤焦點、直接連結、重新整理、返回、長文及錯誤復原無退化。
6. GitHub Actions 雲端跨 Chromium／Firefox／WebKit 檢查相關流程及 WCAG A/AA；Pages 正式 Jekyll 部署後另驗證。

## 環境與基準

- 設定檔顯示 `gpt-6.1-sol`／`medium`；無法確認或切換主對話實際設定。架構選擇與獨立 review 明確指定 `gpt-6-astra`／`max`。
- 初始 `main`、遠端皆 `ffd90e7`，工作目錄乾淨、無開啟 PR；保留另一協作者工作樹。
- 本 repo 與祖先目錄沒有適用 AGENTS.md；沿用 README、SITE.md 與既有 QA 規範。
- 基準單元測試 36/36 通過；JS syntax、Python 靜態預覽通過。沒有獨立 npm build、lint 或 TypeScript 檢查；預覽不等同 Jekyll。
- [首次正式站走查](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39147845416)完成桌面與 390px 的搜尋、篩選、空結果、詳情、返回、直鏈重新整理和來源 href 核對；重複全庫載入至第三個尺寸時等待卡片逾時，不能宣稱該次全數通過。圖片為該次實際正式站截圖。
- 既有 main 的 Related reading QA 在正式站因 `failedPaths.length === 1` 失敗（不是 axe 違規）；同一基準的 [Reader QA 39147309940](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39147309940)隨後通過：15 次 axe 掃描零違規，三瀏覽器正式站紀錄均無載入缺項。這顯示前述失敗不是每次都會出現，尚無足夠證據判定根因。本輪以固定基準的雲端預覽完整比較，正式站另驗證。
- Orca CLI 無法解析應用程式路徑，未啟動或操作個人電腦 GUI；瀏覽器和 npm 測試套件只在 GitHub runner 執行。
- GitHub CLI 僅登入 Enterprise Managed User，建立 PR 被拒；已授權的個人 SSH 可 push，因此完成獨立審查後直接 merge 到 main，不冒稱已有 PR review。

## 截圖

| 尺寸 | 修改前（正式站） | 修改後（雲端預覽） |
| --- | --- | --- |
| 桌面 1440×1000 | [before-desktop.png](before-desktop.png) | [after-desktop.png](after-desktop.png) |
| 手機 390×844 | [before-mobile.png](before-mobile.png) | [after-mobile.png](after-mobile.png) |

## 指令與最終結果

[首輪完整雲端 QA 39148133106](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39148133106)（`3bbe06c`）通過：新閱讀流程加既有 reader、discovery、related、search-context 四套瀏覽器回歸。三個模擬情境及 Chromium 1440／390／320、Firefox／WebKit 390 均完成；全庫 339 筆中 193 筆提前呈現完整原段、146 筆保留全文入口，沒有截掉段內限制。新增 15 次 axe 掃描零違規。

同一預覽基準的 UC-313 用途容器頂端：1440px 824 → 297px、390px 976 → 361px、320px 1152 → 428px；這是視窗位置量測，非轉換率。該 runner 未節流的 DOMContentLoaded 17–42ms、load 21–55ms，只是頁面事件時間，非全庫就緒、實際裝置速度或 Lighthouse 分數。

來源入口與 pending 補修後的最終驗收另補於下方；兩張 after 圖已更新為最終補修版。

## 實作與審查界線

`assets/app.js` 保留用途正文，將一般開始／注意建議改成原生 details。`assets/reader.js` 在安全 Markdown 渲染後，保守選取 h2 的完整內容，在新增段落 ID 與返回按鈕前複製，避免重複 ID。不合適的短段落提供全文入口；待查內容明示缺口。來源入口支援作者／日期及去重來源標題，優先選含連結章節，排除依來源整理的操作步驟。原始 Markdown、來源歸因與兩種計數未改。

獨立角色未修改實作，使用 gpt-6-astra/max 先提出兩案，再審查 diff 與資料覆蓋。提出並已修正：38 篇無附近來源入口、無章節待查入口未建立、正文可見範圍只測容器、鍵盤測試未核 activeElement、正式部署資產競賽。修後只讀全庫審核確認：193 篇提前呈現紀錄，無連結且無來源入口的缺項 38 → 0；目前靜態 review 無剩餘必修。最終視覺結論另依雲端截圖記錄。

新增前端資產未壓縮差額共 6,118 bytes（app.js +326、reader.js +3,694、reader.css +2,098），是檔案尺寸差額，不是網路傳輸量或效能分數。

## 最終預覽驗收與獨立審查

[最終 QA 39148445621](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39148445621)驗證 `b40c65e`，完整通過，並非只採用首輪結果：

| 檢查 | 實際結果 |
| --- | --- |
| `node --test tests/*.test.cjs` | 41 tests、41 pass、0 fail；339 筆條目 |
| `for file in assets/*.js; do node --check "$file"; done` | 所有 JS 語法通過 |
| `python3 scripts/preview.py <output>/ai-agent-use-cases` | 產生有效靜態預覽與索引 |
| `READING_URL=<preview> node tests/reading-flow-browser.cjs` | Chromium 1440／390／320、Firefox／WebKit 390，三情境、來源、無章節待查、長文、安全文字與完整原段比對通過 |
| 正文可見性 | 所有指定案例在詳情視窗首屏至少可讀兩行用途正文（短正文則完整可見） |
| 原段完整性 | 339 筆逐筆檢查；193 筆提前呈現、146 筆保留全文入口，段內文字與原段節點完整對應 |
| 來源及鍵盤 | UC-101／173 精確落到有連結的來源節；UC-313 外部來源 popup HTTP 200；Tab → 返回導覽 → 方法的焦點不被工具列遮住 |
| axe | 新增 15 次掃描、0 違規，包含失敗紀錄、長文來源與待查狀態 |
| 既有回歸 | `tests/reader-browser.cjs`、`tests/discovery-browser.cjs`、`tests/related-browser.cjs`、`tests/search-context-browser.cjs` 全部通過，保留網路錯誤／重試及分享權限拒絕等測試 |
| 頁面事件時間 | 未節流 runner 的 DOMContentLoaded 18–41ms、load 19–43ms；不是全庫就緒時間或 Lighthouse 分數 |

原始結果：[baseline.json](baseline.json)、[verification.json](verification.json)。補充截圖：[320px](after-small-mobile.png)、[長來源手機閱讀位置](long-report-mobile.png)。

獨立角色未參與實作，已審查來源／安全／相容性及桌面、390、320 視覺。最終結論無剩餘必修；最後來源排除規則以靜態與單元複核，並由上述最終雲端全套確認。長來源需多次捲動是保留所有版本與限制的取捨，下一步可加上方的「前往方法」入口，但不是本輪阻擋項。

## 預覽、限制與下一輪

已授權環境可執行：

```sh
python3 scripts/preview.py /tmp/reading-preview/ai-agent-use-cases
python3 -m http.server 8080 --directory /tmp/reading-preview
# 開啟 http://127.0.0.1:8080/ai-agent-use-cases/?case=UC-313
```

自動 axe 不等於完整無障礙認證；未檢查實體 iPhone／真人偏好／轉換率。未知或過長章節刻意回原始研究，沒有自動重寫摘要。全庫全文下載仍是既有載入成本，來源頁是否持續公開也不能保證。

下一輪最值得處理：減少開頁時數百次全文請求，以靜態索引與按需閱讀降低載入成本，並保留全文搜尋及來源一致性；這也回應本輪正式站重複載入逾時的實際證據。正式 Jekyll／部署後驗收將在合併後另記。
