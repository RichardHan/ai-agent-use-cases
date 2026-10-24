# 2026-10-24 篩選欄位閱讀與操作

整合者負責實作，另有未參與實作的唯讀獨立審查。原工作目錄 `assets/app.js`、`tests/search.test.cjs` 的未提交修改保留，其他進行中工作樹與PR未修改。從 `origin/main` 的5876d13建立隔離分支，之後正常合併協作者研究內容至550bab7，沒有reset、強推或刪除案例。

模型：本機config的預設為gpt-6.1-sol／medium，無法讀取或切換本對話實際metadata，亦無法證明帳號最高模型。獨立角色明確請求gpt-6-astra／ultra，未冒稱執行metadata已確認。核對時使用OpenAI Docs技能。Orca CLI技能的指定CLI回報 `Unable to determine Orca.app path from symlink: /usr/local/bin/orca` 後停止該CLI；改用Git隔離分支與既有GitHub Actions。所有瀏覽在GitHub雲端runner，未啟動本機瀏覽器或GUI，未使用另付費API。

## 證據與方案

[正式基準40036824666](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40036824666)實際走完首頁、旅遊搜尋＋生活篩選、UC-001、來源新頁、返回焦點、空結果。443條目均完整，兩尺寸同為19筆旅遊＋生活結果。桌面六欄各159.6px，label11px／select12px／42px、reset11px；手機label及reset11px，390px預設來源類型文字已截斷。

- A：只放大文字與操作區，低成本，但欄寬不變會增加截字。
- B（採用）：欄名14px、原生選單16px／44px、reset14px／44px；桌面三欄、中尺寸兩欄、600px以下單欄。成本只限CSS與驗收，取捨是展開手機面板增加垂直長度。

目標使用者是依問題、情境、工具與來源判讀適用案例的新訪客。目標為容易讀出欄位與常見選取值、容易按到重設；不是提升案例證據等級。驗收：320–1440px不水平溢出、原生鍵盤順序及可見焦點、搜尋／組合條件／空結果／直鏈／返回／復原正常。案例內容、搜尋語意、來源分類、計數規則、框架與部署不在本輪修改範圍。

獨立審查指出481px雙欄仍偏窄，因此切點從480改600，補驗600/601及1000/1001。原有flex-basis不影響grid，sr-only排序說明不佔格。focus深綠對白底約8.71:1，對paper約8.16:1。

## 前後截圖

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440 | [前](baseline/filter-before/controls-1440.png) | [後](preview/filter-after/controls-chromium-1440.png) |
| 手機390 | [前](baseline/filter-before/controls-390.png) | [後](preview/filter-after/controls-chromium-390.png) |
| 窄手機320 | [前](baseline/filter-before/controls-320.png) | [後](preview/filter-after/controls-chromium-320.png) |

主角色已實際目視三尺寸前後圖。手機選單寬從154增320px（390px），320px時250px；桌面增至364.7px。常見值有更多空間，任意超長分類仍可能被原生select截字；[長分類選取圖](preview/filter-after/selected-chromium-390.png)只證明原值可選、可保留及重設，不宣稱完整名稱永遠可見。展開面板較高，但手機原本預設收合，不改首屏流程。

## 驗收與實際指令

[完整成功預覽40058819614](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40058819614)，測試commit3064978（產品CSS為3adfb6a）。

- `node --test --test-reporter=tap tests/*.test.cjs`：202 tests／202 pass／0 fail。更新前也是202／202，無原有單元失敗。
- `for f in assets/*.js tests/filter-reading*.cjs; do node --check "$f"; done`：全部通過；本repo沒有獨立lint或TypeScript設定，不冒稱跑過不存在指令。
- `python3 scripts/preview.py "$RUNNER_TEMP/preview/ai-agent-use-cases"`：靜態預覽成功，保留`/ai-agent-use-cases/` base path；正式Jekyll部署另記下方。
- `SITE_URL=http://127.0.0.1:8187/ai-agent-use-cases/ node tests/filter-reading-browser.cjs`：Chromium1440/1001/1000/768/601/600/390/320、Firefox390、WebKit390共10配置全過。欄數、font、最小操作尺寸、無水平溢出、Tab與focus、長分類與重設均斷言；446條完整，10次axe零違規。[原始報告](preview/filter-after/report.json)
- 同一URL執行`node tests/page-context-browser.cjs`：三引擎五配置完整流程成功，15次axe零違規；直鏈重新整理、history返回、空結果、缺項、長字也涵蓋。[原始報告](preview/regression/report.json)
- 同套既有測試的loading-early/error/partial三狀態復原均446條完整。[原始復原報告](preview/regression/lifecycle.json)

三種具體走查：①搜尋旅遊＋生活＋Grok Bot，讀UC-001、看來源、Escape回到原卡與原條件；②無結果時回到搜尋輸入並清除條件；③選最長分類後重設恢復完整結果。這些是模擬操作檢查，不代表真人偏好或轉換率。

新browser斷言先在5876d13靜態預覽失敗，錯誤為`labels and reset must remain legible`，[red輸出](preview/red.log)。初次新版run40058648210及兩個後續相同舊測試run在axe要求明確browser context失敗；已改`browser.newContext()`後成功，沒有放寬產品斷言。[首失敗報告](first-preview/filter-after/report.json)保留原錯誤，完整原artifact在各run頁。沒有提供虛構效能／Lighthouse分數；產品只增加局部CSS，未增加請求、JS或第三方功能。

## 檔案、預覽與限制

產品只改`assets/style.css`9行；驗收新增`tests/filter-reading-browser.cjs`、`tests/filter-reading-observe.cjs`、`.github/workflows/filter-reading-qa.yml`，維護記錄為本目錄及`SITE.md`。

預覽：`python3 scripts/preview.py /tmp/filter-preview/ai-agent-use-cases`，再`python3 -m http.server 8187 --directory /tmp/filter-preview`，開`http://127.0.0.1:8187/ai-agent-use-cases/`。本輪未在個人電腦啟動上述server或browser；可自行選擇預覽，雲端測試自動建立同樣結構。

限制：未實機驗證iOS／Android原生picker、未做真人研究；選單仍受瀏覽器對長字的原生顯示限制。首次載入仍需大量全文請求，下一輪優先降低請求成本並保留單篇早讀及缺項復原。本輪446是網站總條目，與合格案例數分開，沒有更動合格判定或成功率。

## 發布

待驗收通過與獨立審查結論後正常合併，並用verify分支實測公開資產與桌面／手機流程；此段會補實際結果，不預先宣稱正式通過。

補充最終整合驗收：[40062879922](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40062879922)在3e4b0e7成功，已保留主線搜尋分享修正與新增研究：206／206單元、三引擎10版面＋5完整流程、25次axe零違規、447條目完整及3復原全過。[最終原始報告](final-preview/filter-after/report.json)。獨立審查無阻擋，指出的中寬度與公開QA斷言跳過問題已修正。後續450cc1b僅再整合協作者搜尋分享按鈕12→14px與其兩套測試；產品filter CSS無衝突，以151a432一般merge提交push main，並觸發verify分支正式驗收。PR建立遭EMU限制，取消被取代驗收工作API亦403；未繞過權限或強推，原run結果保留。

發布過程補記：Pages151a432與dbcda8d的工作被後續協作者文件提交取代，不計為部署成功；最終[Pages40078989333](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40078989333)於6d2a71b的build／deploy／report全成功，保留本輪CSS。正式首兩驗40078385067／40078578289均在舊公開資產閘門失敗，未執行瀏覽、不列通過；[原失敗](public-before-deploy/failure.log)與當時222／222單元結果保存。新增2行協作者選字保護已獨立複核，無filter交互阻擋。CSS增加973個未壓縮bytes、資產請求增加0；[大小原始紀錄](asset-size.json)，非載入時間分數。
