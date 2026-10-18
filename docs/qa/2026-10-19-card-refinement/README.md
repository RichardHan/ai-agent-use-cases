# 2026-10-19：從卡片探索後，看得到新的搜尋結果

對象是從結果或首頁抽卡的情境／標籤繼續找案例的讀者，尤其是鍵盤與窄螢幕使用者。

## 問題證據與方案

基準 `c226d6f`，工作樹乾淨、無開啟 PR；fetch 後遠端一致。沒有適用的 AGENTS.md，已讀 README、SITE 與前輪 QA。保留所有其他工作樹，另建 `feat/source-aware-reading`。本輪由主角色單一整合，獨立角色只讀審查。

[本輪正式站雲端走查](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39174829408)完成搜尋旅遊、組合情境、讀來源、返回，再用鍵盤啟動結果末張卡片的「物流追蹤」。三尺寸焦點均掉到 BODY，結果數位於視窗上方：1440px −79px、390px −423px、320px −628px。手機畫面停在統計與頁尾，無法直接看到新結果起點。[原始量測](baseline.json)。

- A：卡片動作套用條件後，把焦點及視窗交給穩定的結果數。成本低，同時涵蓋抽卡到搜尋。採用。
- B：在重建結果中尋找原卡同標籤並恢復焦點。成本較高，抽卡可能換卡，也無法保證看見結果起點。

本輪不改搜尋語意、內容與證據分類、不刪重複候選、不推估難度、不換框架或加第三方服務。情境維持切換；標籤維持替換關鍵字並保留其他篩選。

## 實作與驗收標準

`refineFromCard` 只處理卡片 query/scenario 動作；重新呈現後，以 preventScroll 焦點及 instant 捲動到結果數。沒有在通用 render 中加焦點轉移，因此打字、select、history 或補載不因本修正搶焦點。結果列表每次 render 重建；抽卡只在池或情境改變時換卡。

情境卡片按鈕以 aria-pressed 和深綠底顯示已套用狀態，穩定名稱保留情境文字，title 準確說明套用／取消；標籤名稱說明保留其他篩選。

驗收要求：

1. 結果卡與抽卡均抵達可見的結果數，下一個畫格仍可見，Tab 接到搜尋分享按鈕。
2. Enter、Space、一般點擊都能操作；情境切換與標籤替換保留原有規則。
3. kind/tool/category/proof 等條件與 URL 不被丟棄，不新增 history 步數；閱讀、關閉、直鏈及重新整理仍可用。
4. 另行輸入不存在的關鍵字驗證空結果復原；不宣稱卡片動作本身製造了空結果。
5. 桌面 1440、手機 390／320px、Chromium／Firefox／WebKit；axe WCAG A/AA、水平溢出、長文與原閱讀流程回歸。

三個模擬情境：找旅遊案例後由標籤縮小範圍；首頁抽卡有靈感後查看相符結果；分享帶條件的案例直鏈並重新整理、關閉及調整空搜尋。這是流程檢查，不是訪客偏好或轉換率研究。

## 環境與模型限制

本輪不操作個人電腦 GUI，瀏覽器與 npm 測試工具只在既有 GitHub Actions runner 執行。無另付費 API、追蹤器、cookies 或登入功能。原生 JavaScript 網站無獨立 lint、TypeScript、npm build；Python 預覽不是正式 Jekyll，部署需另查 Pages。

主對話無可驗證的實際模型／推理設定或切換介面，未宣稱已使用帳號最高模型。方案評估及獨立審查明確指定可用的 `gpt-6-astra / max`，仍無法確認帳號全部模型的能力排序。

## 指令與基準結果

- `node --test tests/*.test.cjs`：基準雲端 63/63 通過。
- `for file in assets/*.js; do node --check "$file"; done`：基準通過。
- `python3 scripts/preview.py "$RUNNER_TEMP/refine-preview/ai-agent-use-cases"`：基準預覽成功。
- `node --test tests/card-refinement.test.cjs`：實作前 0/3，實作後 3/3。
- `NODE_PATH=<runner tools>/node_modules node tests/card-refinement-browser.cjs`：由本輪 workflow 執行，並重跑既有 reader、home-search-entry 流程。

正式預覽入口為 [GitHub Pages](https://richardhan.github.io/ai-agent-use-cases/)。也可在自選雲端環境執行 SITE.md 的 Python 預覽，路徑保留 `/ai-agent-use-cases/`；不需安裝網站前端依賴。

| 尺寸 | 修改前（正式站） | 修改後（雲端預覽） |
| --- | --- | --- |
| 1440×1000 | [桌面](before-desktop.jpg) | [桌面](after-desktop.jpg) |
| 390×844 | [手機](before-mobile.jpg) | [手機](after-mobile.jpg) |

[核心 QA 39175014627](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39175014627)成功：66/66 測試、JS syntax、靜態預覽；Chromium 1440／390／320、Firefox／WebKit 390 三情境皆通過。五次 axe 掃描零違規，無水平溢出、pageerror。修正後結果數頂端皆約 24px、焦點 results-count；[完整量測](verification.json)。桌面基準在預設動畫下的短時間位置會變動，焦點掉到 BODY 與手機落點問題均可重現，未把位置量測當成固定效能指標。

獨立審查由未實作的 `gpt-6-astra / max` 角色完成，檢查程式、測試、workflow 與實際前後截圖：無剩餘必修項。非阻擋覆蓋缺口：情境取消後未另查新按鈕 aria-pressed=false；抽卡路徑驗證焦點，未另量測其兩畫格後位置（共用相同 helper）。未使用實體裝置、螢幕閱讀器或 Lighthouse，未宣稱整站 WCAG 認證或效能分數。

下一輪最值得做：測量新訪客首次搜尋的全庫就緒時間，評估減少數百個 Markdown 來源請求的必要性；先有量測再決定是否建立靜態搜尋索引。

## 合併前最終驗收

[最終 QA 39175042219](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39175042219)（`d70354a`）全部通過，包含既有 Reader 與首頁搜尋完整回歸。全庫 339 筆／2,320 章節／358 頁首證據行對應通過（[原始結果](reader-corpus.json)），保留來源、安全文字、長內容、缺資料、載入錯誤與重試路徑。上方 after 截圖及量測已換成本次最終 artifact。

變更檔案：`assets/app.js`（卡片條件與焦點）、`assets/style.css`（情境套用外觀）、`tests/card-refinement.test.cjs`（3 項回歸）、`tests/card-refinement-browser.cjs`（三情境跨引擎）、`.github/workflows/card-refinement-qa.yml`（雲端預覽及發布驗證）、`SITE.md` 與本目錄（維護證據）。網站沒有新增依賴或網路服務。
