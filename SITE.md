# GitHub Pages 案例網站

## 啟用一次

Repository → Settings → Pages → Build and deployment：

- Source：**Deploy from a branch**
- Branch：**main**
- Folder：**/ (root)**
- Save

本網站使用 GitHub Pages 內建 Jekyll。不要新增 `.nojekyll`；也不要選 GitHub Actions 作為 Source，因為不需要自訂 workflow。

預期網址由 Pages 設定頁提供。請等該次 `pages build and deployment` 完成，再確認網址可開啟；提交程式碼不等於已上線。

## 自動收錄

Markdown 是唯一內容來源。`catalog.json` 在每次 Pages 建置時，透過內建 Liquid 自動列出 `cases/**/*.md`、`evidence/**/*.md` 與 `sources/pending.md`。網頁從同站讀取全文，無 GitHub API 配額、無外部搜尋服務、無憑證或分析追蹤。

新增案例只需沿用現有無 YAML front matter 的 Markdown 格式，檔名使用英數與連字號。待查線索在 `sources/pending.md` 以 `## P-XXX：標題` 分段。合併至 main 後，GitHub Pages 會重建索引，無須手動維護網站清單。

分類優先使用 `- 分類：` / `- 分類／標籤：`；若缺少則按標題歸類。工具篩選標示「提及工具」，以全文出現名稱辨識，不代表該工具已證實支援整個流程。證據標籤由頁首證據欄位摘要；詳情中的原文才是完整判斷依據。主要案例、補充、待查分開計數，均不宣稱獨立重現。

可用 `?q=關鍵字&tool=Grok%20Bot` 分享篩選結果，或 `?case=UC-001` 直接開案例。所有來源文字以安全 DOM 文字節點呈現；不執行案例內的 HTML。

## 雲端／本機預覽（自選環境）

需要 Python 3：

```sh
python scripts/preview.py /tmp/ai-usecase-preview
python -m http.server 8080 --directory /tmp/ai-usecase-preview
```

預覽器模擬 Liquid 產生檔案清單，不執行 Jekyll；正式發布仍需檢查 GitHub Pages 建置。網站前端無 npm 或第三方程式依賴。

不要編輯預覽輸出代替 Markdown；不要把個資、私有工作資料或秘密放入公開 repo。


## 網站標題與用途文案

網站優先讀取 Markdown 頁首的 `- 網站標題：` 與 `- 一句話用途：`。新增案例請填這兩欄：標題寫具體任務或好處，讀者不用先懂 UC 編號、CRM、CUA、SaaS 等術語；不要保證來源未證明的節省金額、成功率或成效。

既有 17 筆的白話標題與摘要集中在 `assets/copy.json`，以 UC/P 編號對應；Markdown 原文仍是研究事實來源，並保留全文搜尋。若 Markdown 已有上述欄位，優先於文案清單；兩者皆無時才使用原 H1 與目標欄位。不要為新案例維護第二份全文。

卡片先呈現用途，詳情先說「可以幫你做什麼／怎麼開始／要注意什麼」，原始研究、來源與完整提示詞放在可展開區。待查想法使用疑問或待查語氣，清楚標示「還在查證」，不得包裝成已成功或本庫親測。

## 2026-10-18：引導與抽卡探索（整合協作者版本）

首頁改為「選情境 → 隨機看一張 → 深入讀案例」，完整搜尋保留於下方。情境優先讀 Markdown 頁首的 `- 情境：`，並保留既有缺欄位時的情境歸類與常見任務快選。

`assets/discovery.js` 提供純函式抽卡規則：不抽待查、補充或模板；同輪不重複，下一輪避免接著出現同一張。抽卡遵守搜尋與所有篩選條件，結果不是人氣排名；不使用 localStorage 計票，也不聲稱已收集社群票數。

分享網址支援 `?scenario=省錢`，可與既有搜尋、工具與案例直鏈組合。載入失敗時停用探索控制並提供重試。投票仍需確認共用儲存方式，目前沒有公開票數或假按讚功能。

回歸測試：`node tests/search.test.cjs`、`node --test tests/discovery.test.cjs`。GitHub Actions 的 Website QA 在雲端 Chromium 檢查 1440、390、320px，走查引導、抽卡、搜尋、組合篩選、空結果、鍵盤、直鏈、重新整理、返回與錯誤復原；截圖與 axe 檢查結果由 workflow artifact 保存。此檢查不是正式 Jekyll 建置，部署後仍應查驗 Pages workflow。

獨立審查補修：窄螢幕選情境後按需帶到卡片、瀏覽器返回時恢復原結果按鈕焦點、抽卡 live status 宣布新標題。axe 另發現原有閱讀說明小字對比僅 4.34:1，已調整為 5.56:1。正式站另由 main 合併後的雲端 smoke test 驗證實際 Jekyll 產生的索引、HTTPS 與手機直鏈重新整理。

整合以協作者 main ddc6324 為基準，保留嚴格核對統計、互動標籤、常見任務、複製連結與詳情上一則／下一則；未使用舊分支覆蓋其修改。

分享失敗時不再誤報成功：Clipboard API 不存在或權限被拒會顯示可手動複製的案例網址；雲端回歸同時檢查成功與拒絕權限路徑。

## 2026-10-18：案例閱讀導覽與頁首證據

正式站走查發現 UC-005 有 19 個主段落與 21 個來源連結，卻沒有段落導覽；UC-313 的具體結果和唯一來源也在通用摘要下方的展開區。選擇從原文建立導覽，避免逐篇重寫研究內容。

`assets/reader.js` 在既有安全 Markdown 渲染後，依實際標題建立「實作與結果／方法與步驟／限制與權限／來源與版本」快速入口及完整段落目錄；沒有對應段落就不產生入口，沒有章節就不產生目錄。點擊展開原始研究，只捲動詳情視窗、避開固定工具列並把鍵盤焦點交給原標題；每段可回到導覽，不更改分享網址或瀏覽紀錄。

頁首證據說明複製原始 metadata 的完整文字與安全來源連結，保留「自設未測／作者自述／官方」等原始用語，不將推導的分類標籤冒充證據。缺欄位明示未知；頁首不代表後續所有補充的證據狀態，仍須逐段判讀。待查說明、原始 Markdown、收錄與合格計數不因本功能改寫。

回歸指令：`node --test tests/*.test.cjs`、`node --check assets/app.js`、`node --check assets/reader.js`、`python3 scripts/preview.py /tmp/ai-reader-preview/ai-agent-use-cases`。專案沒有獨立 lint、TypeScript 或 npm build；預覽不等同正式 Jekyll。Reader QA 僅在 GitHub runner 安裝測試工具，網站本身沒有新增套件、第三方請求或儲存。

雲端瀏覽驗收使用 `NODE_PATH=<測試工具目錄>/node_modules node tests/reader-browser.cjs`，預設以 port 8082 的 `/ai-agent-use-cases/` 預覽為準；`READER_URL` 可指定已部署網站。涵蓋三種具體情境：搜尋旅遊並組合篩選／返回、分享長篇開發案例並核對來源、閱讀失敗案例並比較待查線索。另核對整個案例庫的段落對應、缺欄位、重複標題、安全文字、網路失敗與重試；截圖、axe 與未節流的載入時間由 Reader QA artifact 保存。這些是模擬走查，不代表真人偏好或轉換率。
