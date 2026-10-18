# 搜尋條件與空結果復原驗收 · 2026-10-18

[PR #38](https://github.com/RichardHan/ai-agent-use-cases/pull/38) · [正式網站](https://richardhan.github.io/ai-agent-use-cases/)

## 問題、取捨與範圍

目標讀者是已知道想解決什麼問題、使用搜尋及多個篩選來找案例的人。雲端瀏覽器在 1440×1000、390×844、320×740 重現：旅遊 + Grok Bot + 旅遊／消費研究 + 作者報告／示範有 3 筆，加上開發情境後為 0 筆。原畫面沒有已套用條件摘要，空結果的「顯示全部案例」會連搜尋詞一起清掉。

比較方案 A「已套用條件摘要與逐項復原」及方案 B「重整搜尋區、收合進階篩選」。選 A：可以直接保留原搜尋意圖，改動與回歸範圍較小。B 留待下一輪評估。

新增可逐項移除的條件、保留關鍵字的清除篩選、準確計數的單項放寬建議、修改關鍵字及明確的全部重設。按鈕至少 44px 高；移除條件後焦點移到有可見焦點框的結果數。只呈現單項移除後大於 0 的建議；不自動放寬條件。

本輪不修改案例事實、同義詞、工具判斷、證據分類、框架或品牌。沒有新增網站套件、追蹤、cookie、登入、持久儲存或第三方傳輸。

## 前後截圖

皆為 GitHub Actions 的實際 Chromium 截圖，非設計稿。截圖對齊結果數附近，所以手機上下可見區域不同；完整 artifacts 另包含首頁與詳情。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面 1440×1000 | [查看](before-desktop.jpg) | [查看](after-desktop.jpg) |
| 手機 390×844 | [查看](before-mobile.jpg) | [查看](after-mobile.jpg) |
| 窄手機 320×740 | 基準觀察見 JSON | [查看](after-small-mobile.jpg) |

## 實際驗收證據

- 基準 `3f97bcac`：[Reader QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39117608360) 的原有 **20/20** 測試通過，331 筆收錄／2,245 節／350 行證據對應通過；既有 Chromium／Firefox／WebKit 流程通過。沒有發現基準測試失敗。
- 先提交測試：[紅燈 run](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39117775005) 確認缺少 5 項條件摘要（`0 !== 5`），並記錄三尺寸 reset 後 query 都變空。
- 新版：[Website QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39118265250)，整合 head `bf239cfd`，**24/24，fail 0**，語法檢查、靜態預覽與 Chromium 三尺寸通過。
- [Reader QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39118137159)，`4abdb1b`，Firefox／WebKit 390px 新復原流程通過，原閱讀、來源連結、長篇內容、跳段與待查限制回歸通過。其後 `bf239cfd` 只整合協作者計數與正式站等待測試，功能程式未再改。
- 新復原流程每個尺寸／引擎檢查有結果及長文字空結果兩種狀態，共 **10 次 axe 掃描，0 違規**；不等同完整人工無障礙認證。
- 載入中不顯示空結果；503、重試、空索引、單筆 Markdown 404、未知情境 URL、部分載入計數均有回歸覆蓋。缺載入時建議只計已載入內容並明示限制。
- 首輪新版掃描曾因測試使用 `browser.newPage()` 而出現 `Please use browser.newContext()`；已改獨立 context 並通過後續掃描，這是測試程式修正。
- [原始觀察與量測](verification.json)：Ubuntu runner 未節流，Chromium 三尺寸 navigationAndReadyMs 為 992／958／973ms，鍵盤復原自動化耗時為 9／10／10ms。前者包含 networkidle 等候，後者包含自動化操作；不能當成真人載入速度、Core Web Vitals 或提升幅度。

### 三種模擬使用情境

1. 找旅遊案例：套用多個條件到 0 筆，透過鍵盤移除開發情境，回到 3 筆；原關鍵字、工具、分類、來源仍保留，URL 同步。
2. 分享與深入閱讀：開啟結果、取得帶條件的案例直鏈、重整、關閉及瀏覽器返回；搜尋條件與結果維持，焦點回原卡片。
3. 找不到任務：輸入不存在的關鍵字，只清篩選仍保留原詞；修改關鍵字可取得輸入焦點。長文字及含 HTML 外觀的文字不執行、不造成 320px 橫向溢出；最後清除全部可復原。

上述為自動化模擬，沒有聲稱真人喜歡、轉換率或回訪率提升。

## 指令與預覽

既有網站沒有 npm build、獨立 lint 或 TypeScript type check；不捏造對應通過紀錄。

```sh
node --test tests/*.test.cjs
node --check assets/app.js
python3 scripts/preview.py /tmp/search-preview/ai-agent-use-cases
python3 -m http.server 8081 --directory /tmp/search-preview
NODE_PATH=<雲端測試工具>/node_modules node tests/discovery-browser.cjs
```

預覽網址：`http://127.0.0.1:8081/ai-agent-use-cases/`。Reader QA 用 port 8082（`node tests/reader-browser.cjs`），正式站驗收用 `node tests/deployed-browser.cjs`。沿用 GitHub Actions 中已固定版本的 Playwright 與 axe；網站本身沒有 npm 依賴。Python 預覽模擬 Liquid，正式 Jekyll 建置以合併後 `pages build and deployment` 為準。Reader 的正式站檢查會比對 6 個資產與 checkout 全文一致。

## 變更與獨立審查

功能：`assets/app.js`、`assets/style.css`、`index.html`。測試：`tests/search-recovery.test.cjs`、`tests/search-recovery-browser.cjs` 及既有 baseline、discovery、reader、deployed browser 接入；`.github/workflows/website-qa.yml` 統一執行全部單元測試，避免只修改新增測試時漏跑。

主代理為唯一整合者。另由未實作的審查代理（工具指定 `gpt-6-astra / ultra`）以 GitHub connector 唯讀審查至 `bf239cfd`：**無阻擋事項**。全部單元測試接入、跨引擎覆蓋、部署等待三項非阻擋建議均已處理。審查者未在本機執行測試，執行證據以 Actions 為準。主代理無法讀取或切換本回合實際模型／推理設定，未宣稱帳號最高設定已啟用。

環境開頭只做本機唯讀環境／repo 檢查，確認 Darwin 後停止本機終端；之後檔案讀寫、分支、建置、瀏覽與截圖均經 GitHub connector／Ubuntu Actions，沒有操作個人桌面或另購額度。原本工作樹乾淨，本機 main 比快取 origin/main 超前兩筆；沒有 reset、checkout、強推或更動本機工作樹。

安全整合協作者 `f943987b` 的研究覆核：INDEX、qualification-audit、research-1800 完整保留，首頁合格案例 **296** 與網站收錄 **331** 獨立計數；未刪除任何案例。

## 限制與下一輪

尚未以實體手機、螢幕閱讀器或節流網路做人工檢查；外部來源可連出不代表原文與成果已獨立驗證。正式部署結果以 PR 的 main Actions 為準。

下一輪優先評估手機版進階篩選收合，保留本輪條件摘要，減少搜尋結果前的捲動；先重新量測與走查，不直接改版。
