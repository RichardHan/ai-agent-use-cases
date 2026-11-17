# UC-535：Muse 的雲端瀏覽器被 Cloudflare 擋下？改用官方 Chrome 擴充功能借自己已登入的 Chrome，讓 Muse 建專案、上傳 ZIP、部署並設定自訂網域

- 情境：開發
- 標籤：部署、網站、Pages、權限邊界
- 網站標題：AI 做好網站卻卡在最後「發布」：讓 Muse 操作你自己已登入的 Chrome，一句話把靜態網站部署到 Cloudflare Pages
- 一句話用途：日文作者 satouyoshiaki（X：@310techlab）原本讓 Muse 做網站，但部署要手動：Muse 的雲端瀏覽器從資料中心 IP 存取 Cloudflare 儀表板時被 Turnstile 人機驗證擋下。改裝 Muse 官方 Chrome 擴充功能「Muse from Meta」，讓 Muse 操作自己電腦上已登入的 Chrome：建立 Pages 專案、上傳 ZIP、部署、加自訂網域，再開兩個網址核對檔案數。作者自述 2026-11-15 一天用這方法公開／更新 6 個網站，隔天改文案也只說一句「把某某那個部署」。
- 核心目標：把「AI 建好網站但部署還得手動」的最後一步交出去，同時不把密碼或 API 金鑰交給 AI。
- 分類／標籤：靜態網站部署／借用本人瀏覽器工作階段／人機驗證繞不過時的替代路徑
- 目標使用者：已用 Muse 做靜態網站、想把 Cloudflare Pages 部署也交給它的個人開發者
- 實作門檻：工具串接
- 工具：Meta Muse（官方 Chrome 擴充功能「Muse from Meta」、PC 網頁版對話）／Google Chrome（Windows）／Cloudflare Pages（Direct Upload）
- 首次收錄／最近查證：2026-11-17 08:30（台灣時間）
- 證據狀態：`author-demo`（作者 Qiita 長文自述＋部署完成與自訂網域畫面截圖＋X 錄影貼文；本庫未重現）
- 是否獨立重現：否

## 輸入與預期輸出

- 輸入：建置好的靜態網站資料夾 ZIP；Pages 專案名稱；要加的自訂網域；本人電腦上已登入 Cloudflare 的 Chrome。
- 輸出：Cloudflare Pages 專案與部署；`*.pages.dev` 網址與自訂網域都可開啟；上傳檔案數與預期相符。

## 來源版本

### 來源A：satouyoshiaki（Qiita 文章，日文）

- 原始網址：[Qiita「MuseのChrome拡張で、Cloudflare Pagesへのデプロイを自動化できた話」](https://qiita.com/satouyoshiaki/items/175e416b50a9ddf053e3)，2026-11-16 19:34 JST（台灣時間 18:34）；作者部署錄影：[X 貼文](https://x.com/310techlab/status/2122257372886565113)（本庫未觀看）。
- 原文語言：日文。
- 取得內容（翻譯摘要）：
  1. 問題：Muse 的雲端瀏覽器從資料中心共用 IP 自動操作，進 Cloudflare 儀表板前就被 Turnstile 擋下。
  2. 做法：在自己的 Chrome 裝官方擴充功能並登入 Muse 連結（認證由本人做）。登入狀態用自己 Chrome 的，不必把 Cloudflare 帳密交給 Muse；一般瀏覽器＋家用網路＋已登入工作階段，Turnstile 也過得去。
  3. 準備：把網站建置成資料夾、整包壓成 ZIP（Pages 直接上傳接受 ZIP）。
  4. 從 PC 網頁版對話告訴 Muse：哪個 ZIP、專案名稱、自訂網域。Muse 操作儀表板完成建立專案、上傳、部署、加自訂網域。
  5. 部署後開發行網址與自訂網域確認畫面，並核對上傳檔案數是否符合預期。
- 作者遇到的限制：電腦要開著且 Chrome 要開著；只有從 PC 網頁版開始的對話能操作 PC 的 Chrome，手機 App 開的對話不行；專案名稱的子網域被占用時，會拿到加了隨機字尾的 `pages.dev` 網址。
- 作者的安全界線：只交出「已登入畫面的操作」；不給密碼或 API 權杖；安裝與登入由本人做；付款確認等不可逆動作不交給 AI。
- 缺口：Muse 實際操作步驟的紀錄、失敗重試情形與擴充功能權限細節未公開。

## 建議操作流程（依來源整理；本庫未實測）

1. 先確認 Muse 的雲端瀏覽器是否真的被擋（看到人機驗證或封鎖畫面再改用擴充功能，不要嘗試繞過驗證）。
2. 在專用的 Chrome 個人資料夾安裝官方擴充功能、只登入部署需要的服務，減少 Muse 看得到的分頁與帳號。
3. 從 PC 網頁版對話下指令，一次給齊 ZIP、專案名、網域。
4. 部署後自己開兩個網址確認，並核對檔案數；網域 DNS 設定改動前先讓 Muse 說明要改什麼。

## 可複製提示詞（本庫原創，依來源改寫，未實跑）

> 用我這台電腦上的 Chrome（已登入 Cloudflare）操作 Cloudflare Pages：建立名為［專案名］的專案，用直接上傳把［ZIP 路徑］部署上去，再加上自訂網域［網域］。改任何 DNS 記錄或會產生費用的設定前，先停下來告訴我要改什麼。完成後回報：pages.dev 網址、自訂網域狀態、上傳檔案數。不要碰其他專案或帳號設定。

## 所需連接、權限與限制

- 擴充功能讓 Muse 能讀取與操作你 Chrome 裡的分頁，等於能看到所有已登入的網站；建議用專用的瀏覽器設定檔。
- 這不是繞過人機驗證，而是改用本人瀏覽器的正常工作階段；仍應遵守服務條款。
- 付款、刪除專案、DNS 大改等不可逆動作保留給本人。

## 驗收與可重現性

- 可驗收：兩個網址都能開；檔案數一致；Cloudflare 稽核紀錄只有預期的專案變更。
- 本庫未重現。

## 去重與版本紀錄

- 2026-11-17 08:30 新增。[UC-070](070-github-outage-mac-cloudflare-publish.md) 是 dots／Codex 在 GitHub 停權時改由本機建置發布到 Cloudflare；[UC-456](456-muse-github-markdown-static-site-operations.md) 是 Muse 推 Markdown 到 GitHub、由 GitHub Pages 發布。本案的重點是 Muse 雲端瀏覽器被人機驗證擋下後，改借本人已登入的 Chrome 操作儀表板，另立案。
