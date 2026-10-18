# 同主題延伸閱讀與返回流程（2026-10-18）

## 問題與選題

目標讀者：已找到一個可能有用的案例，想繼續比較其他做法、核對來源，再回到原搜尋的人。

正式站與固定基準 `227a630` 的雲端 Chromium 走查（1440×1000、390×844、320×740）：搜尋「旅遊＋Grok Bot」得到 17 筆；詳情沒有延伸閱讀，上一則／下一則沒有篇名提示，無法先判斷下一篇是否值得讀。來源連結實際回應 HTTP 200，返回仍保留搜尋。記錄在 [完整基準 run](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39138803584) 的 artifact（該 run 後續因刻意新增的缺功能測試失敗）。

兩案：A 只補前後篇名提示，成本低、適合依序讀，但仍是收錄順序；B 加入同主題候選，成本中、適合比較閱讀。選 B 並補 A 的提示。預期改善是讓讀者在詳情內看見有理由的下一篇選項；未量測真人偏好、回訪率或轉換率。

本輪不處理案例事實改寫、細分任務分類、搜尋演算法、難度標註或人氣排名；不變更框架、部署、原始研究、合格計數及任何協作者工作樹。

## 實作與驗收

- 原始研究在延伸閱讀之前；列出目前搜尋結果內、同主題分類的其他主要案例，最多三筆，維持結果順序。明示匹配分類及既有來源類型，不能解讀為成功或證據強度排名。
- 沒有候選便顯示原因；不以整庫、工具相同或待查內容填滿。來源部分載入時只用已載入資料；背景重試完成後更新候選並保留區內焦點。
- 延伸閱讀及前後篇切換保留搜尋網址；關閉回原卡片或抽卡入口。每筆詳情 history state 保存入口，跨不同搜尋的 Back 也能正確還原。
- 當直鏈文章不在目前搜尋結果中，前後篇按鈕與左右方向鍵均不跳到無關案例。篇名提示同時提供 `title` 與可讀取的 `aria-label`。
- 延續紙色、綠色、字級與原有焦點樣式，長標題與摘要正常換行；沒有新增第三方服務、網站套件、儲存、追蹤或資料傳送。

三種模擬情境均通過：

1. 「旅遊＋Grok Bot」→開篇→鍵盤選同主題文章→Back→再延伸→Escape，搜尋、結果順序、原入口焦點均保留。
2. UC-005 長文直鏈→重新整理→核對原研究來源連結→稀疏／空結果；沒有延伸候選時不捏造項目，搜尋外直鏈方向鍵保持原篇。
3. 搜尋 A→詳情→延伸→關閉→搜尋 B→詳情→連續 Back 到 A→關閉；回到 A 原卡片。額外延遲回應 fixture 驗證背景補讀後候選更新，關閉按鈕焦點不丟失。fixture 是測試合成資料，未加入案例庫。

## 前後截圖

固定基準由 `git archive` 取 PR base；新舊均使用同一旅遊搜尋與 UC-001，截圖呈現閱讀末段（前）及新增的延伸區（後）。首頁與詳情頁首未重新設計。整合者已實際查看這些圖片與 320px artifact，檢查間距、對比、長標題換行、固定工具列與水平溢出。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 1440px | [閱讀末段](before-desktop.png) | [延伸閱讀](after-desktop.png) |
| 390px | [閱讀末段](before-mobile.png) | [延伸閱讀](after-mobile.png) |

## 指令與實際結果

所有測試與 headless 瀏覽器均在既有 GitHub Actions runner 執行；沒有在個人桌面啟動瀏覽器或操作 GUI。

```sh
node --test tests/*.test.cjs
for file in assets/*.js; do node --check "$file"; done
python3 scripts/preview.py "$RUNNER_TEMP/preview/ai-agent-use-cases"
python3 -m http.server 8088 --directory "$RUNNER_TEMP/preview"
NODE_PATH="$RUNNER_TEMP/tools/node_modules" node tests/related-browser.cjs
```

本專案沒有獨立 lint、TypeScript 或 npm build。Python 預覽模擬 Liquid catalog，不等同正式 Jekyll 建置。

- 原有基準：33/33 pass；先提交缺功能測試後為 33 pass / 2 fail（`relatedEntries` 不存在），重現問題後才實作。
- [最終程式版本雲端驗收](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39139199494)：36/36 pass、0 fail；JavaScript syntax、preview 均成功；336 筆來源資料回歸通過。
- Chromium 三尺寸、15 次 WCAG A/AA axe 掃描：0 違規；頁面及 dialog 無水平溢出。實際資料見 [preview-results.json](preview-results.json)。此結果不等於完整無障礙認證。
- 未節流預覽導航至 networkidle、結果可用：1440px 1099ms、390px 926ms、320px 984ms，三次皆 0 個來源略過。這是 runner 單次觀察，沒有宣稱性能提升或真實行動網路表現。
- 正式部署的 main push 會再比對 `app.js`／`reader.css` 的實際內容，並檢查瀏覽器收到的 app、完整 corpus、三尺寸延伸閱讀／返回／直鏈／空結果。精簡到每尺寸兩次整庫載入（共六次），避免驗收本身造成 429。正式結果以該次 main 的 Related reading QA 和 Pages workflow 為準。

## 獨立審查與限制

未負責實作的角色唯讀 review，找出並確認修正：舊篩選套用順序、方向鍵繞過停用狀態、跨搜尋的原入口焦點、正式站重複載入量、基準 artifacts 覆寫，以及抽卡入口文案與背景補讀候選更新。`461d1b4` 最終靜態審查無阻擋問題；審查者未冒稱執行瀏覽器。

已知原有狀況：開始時 main 的 Partial Load QA [39138293419](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39138293419) 在正式站 smoke 步驟失敗；本輪不把它當作新功能修復成果。獨立審查亦確認 SITE 既有正式站限流紀錄，因此限制本輪 live 請求量。

新增完整互動測試配置 Chromium；既有 Reader／Partial Load QA 含 Firefox、WebKit，但不代表新延伸互動已在兩者獨立完整驗證。未測實體手機、螢幕閱讀器、弱網或第三方來源今日內容真實性。分類可能仍較寬，例如旅行規劃與旅行相簿同屬旅遊；下一輪優先評估「依具體任務標籤改善同主題候選」，先確認資料品質再調整排序。

模型透明度：讀到的 CLI 設定為 `gpt-6.1-sol` / `medium`，不是目前對話有效設定的證明。獨立審查以可用協作工具指定 `gpt-6-astra` / `max` 啟動；沒有執行環境遙測可進一步證明實際模型與推理。未切換付費 API、購買額度或修改帳號設定。
