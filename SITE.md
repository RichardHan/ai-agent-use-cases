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
