# 2026-10-19：分享案例找不到時，接回搜尋

## 問題、方案與範圍

本輪對象是收到案例分享連結的首次訪客。基準 `85deb0e92b615340502547abe32b08b8cbb246b6`，本機初始唯讀 status 乾淨、main 與 origin/main 同步；遠端確認沒有開啟 PR。repo 無 AGENTS.md。讀取 README、SITE、Pages 設定、既有工作流程與前輪 QA 後，建立獨立遠端分支 `fix/missing-shared-case`，由主角色單一整合。最初只做本機唯讀環境／儲存庫確認；所有寫入、套件安裝、瀏覽器、測試與發布均使用 GitHub connector 與 GitHub-hosted Ubuntu runner，未操作個人 GUI、重設／強推或修改本機工作樹。未檢查其他本機工作樹。

先檢視同基準正式站 Home search entry QA 的桌面／手機真實截圖，再建立 test-only 分支。雲端原流程走完首頁、旅遊搜尋＋生活篩選、詳情、原始來源與返回；兩尺寸所查來源 HTTP 200。未知 `?case=UC-999999&q=旅遊&scenario=生活` 只有一般結果，沒有連結失敗說明。只有 case 的未知直鏈也缺少處理。

- A：獨立錯誤頁。狀態明確，但增加路由與回復搜尋成本。
- B：在原搜尋區放缺失提示，保留條件、提供回到搜尋。成本低且可延續探索；採 B。

驗收：全來源載入後才說找不到；部分失敗保留既有重試；有效 ID／別名即使被篩選排除仍開啟；空白／超長／HTML 值安全；手機無橫向溢出、回復按鈕至少44px、鍵盤焦點可見。重新整理、原生返回、歷史切換與載入中輸入均可持續。未修改案例、候選重複、合格數／條目數、證據分類、搜尋規則、框架或配色，未加產品套件、追蹤、cookies、登入、儲存或外部資料服務。

## 實作與獨立審查

`index.html` 在搜尋區標題與表單間加入可聚焦標題、polite 狀態文字與回復按鈕；`assets/style.css` 延續綠色邊框與閱讀層級，窄螢幕改垂直排列。`assets/app.js` 以全 entries 比對案例，只有 discoveryReady 且 failedPaths 為空才確認找不到。編號以 textContent 呈現，顯示上限80 codepoints；空編號明說連結缺編號，不將無結果冒稱為案例不存在。

回復只移除 case，保留關鍵字、篩選、history.state，以 replaceState 接回搜尋並聚焦 query。有效詳情、關閉、popstate 與補讀均同步提示。讀者尚未操作時，直鏈抵達提示；載入期間已輸入／捲動者不被遲來焦點打斷。

由未負責實作的獨立角色讀方案、diff、紅燈 logs 與手機截圖。依其審查補修：提示因歷史切換隱藏時移走焦點；補讀仍缺目標、且讀者仍停在重試時，聚焦新提示；空 `?case=` 的補讀也納入，不能因 falsy 值漏掉；遲來訊息使用 polite status，並用 MutationObserver 確認搜尋輸入不重寫未變更的訊息，避免重複播報。

模型：主對話沒有可核實的 runtime 型號／推理強度與切換介面，不能確認帳號最高設定。獨立角色指定 gpt-6-astra／ultra，但指定值不冒充已驗證 runtime。未另用付費 API 或購買 credits。

## 紅燈與基準

[紅燈 run 39193201622](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39193201622) 驗證 test-only `100cf01`：
原有66項測試全過、全部 JS syntax 過、靜態預覽建構成功；1440×1000 與390×844 的來源均200；新測試在 `#missing-case` 等待10秒確實失敗。

前兩個測試版本漏設 standalone Playwright 的等待／退出上限，造成工作流程等待到timeout；已補 setDefaultTimeout(10000)、失敗 process.exit(1)，並移除 push/PR重複執行。這是測試工具修正，不視為網站既有失敗，也沒有宣稱那兩次通過。

## 截圖與預覽

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 1440×1000 | [桌面](before-desktop.jpg) | [桌面](after-desktop.jpg) |
| 390×844 | [手機](before-mobile.jpg) | [手機](after-mobile.jpg) |

截圖出自真實雲端瀏覽器、同一個未知案例＋旅遊／生活條件，並非設計稿。可直接開啟[正式站驗收連結](https://richardhan.github.io/ai-agent-use-cases/?case=UC-999999&q=%E6%97%85%E9%81%8A&scenario=%E7%94%9F%E6%B4%BB)。

## 驗證方式

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/case-preview/ai-agent-use-cases
python3 -m http.server 8091 --directory /tmp/case-preview
NODE_PATH=<cloud-tools>/node_modules node tests/missing-case-browser.cjs
```

前端無獨立 lint、TypeScript 或 npm build。Python 預覽不冒充正式 Jekyll 建置；部署另確認 Pages 工作流程與公開資產逐字比對。

三種模擬走查：收到未知案例分享 → 保留旅遊／生活條件並接回搜尋；收到有效案例別名＋排除它的搜尋條件 → 正常閱讀／重新整理；來源503 → 重試開啟，或全補齊仍缺目標 → 明確提示。另檢查空結果、安全字串、長編號、慢載入、Enter與Back。這些不是真人使用研究，不宣稱留存或轉換已提升。

## 最終驗收

[專用雲端驗收 run 39193591605](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39193591605) 驗證產品提交 `0cc7ac7` 全部成功：

| 項目 | 實際結果 |
| --- | --- |
| 原有單元測試 | 66 tests、66 pass、0 fail |
| JS syntax／Python 靜態預覽 | 全部通過 |
| 三情境與擴充邊界 | Chromium 1440／390／320、Firefox／WebKit 390 全過 |
| axe | 5次掃描、0違規 |
| 本輪文字對比 | #285344 對白底 8.71:1，按WCAG相對亮度公式計算 |
| 產品未壓縮尺寸差額 | HTML +456、JS +2033、CSS +898，共3387 bytes |

未知與空ID的補讀、慢載入期間輸入不搶焦點、訊息不重複重寫、安全字串與長ID在同一成功script中驗證。獨立角色讀最終logs並目視5種尺寸／引擎截圖及390首頁，結論通過、沒有未解必修。上述是預覽驗收，正式發布另記於下方。原始數據：[before.json](before.json)、[verification.json](verification.json)、[asset-sizes.json](asset-sizes.json)。

## 限制與下一輪

未使用實體手機、iOS軟鍵盤或真人螢幕閱讀器；axe不等於完整無障礙認證。未量測Lighthouse、真實網路效能、留存或轉換率。回訪仍需抓取全文；下一輪最值得做的是降低回訪全文載入成本，保留來源一致性及部分失敗補讀。
