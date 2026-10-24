# 2026-10-24 搜尋分享可讀性與無障礙狀態補強

主角色是唯一整合者；獨立角色只讀審查。原工作目錄 `assets/app.js`、`tests/search.test.cjs` 的未提交修改保留，從 `origin/main` 的 `bd9dfbe` 建立隔離分支，後續一般 merge 納入研究者更新。無 AGENTS.md；依 README、SITE.md、preview.py 與既有 Pages／QA 規範執行。原先三個開放 PR #78、#79、#80 不在本輪處理。

主對話未提供可驗證的實際模型／推理設定讀取或切換介面，沒有宣稱已啟用帳號最強主模型。依使用者要求，獨立審查調度指定可用 `gpt-6-astra / max`，不把調度參數當作可獨立驗證的執行 metadata。僅使用既有授權、訂閱與 GitHub Actions；沒有付費 API、購買額度或本機瀏覽器／桌面操作。

## 證據、方案與範圍

[公開站一般走查 40047643307](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40047643307)：1440／390px 首頁、搜尋「旅遊」＋生活、詳情、來源新頁、返回原卡片焦點與空結果成功。各443條目、441次Markdown HTTP200請求；首次可搜尋1627／812ms，僅是該次雲端觀測，不是普遍速度或真人成效。基準 `node --test tests/*.test.cjs`：202項通過、0失敗。

[公開站受控剪貼簿走查 40058806815](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/40058806815)：1440／390px均在分享等待時沒有狀態，使用者已將焦點移到篩選開關，延遲拒絕卻把焦點移到網址欄；當時協作者已新增內容，完整446條目，與前次443不混算。這是注入Clipboard拒絕的功能重現，不宣稱所有訪客都會遭拒。

目標是要保存／分享搜尋條件、並可能在複製完成前繼續閱讀的人。

- A（採用）：立即等待回饋、清楚的成功／手動備援，以及延遲回應保留使用者焦點。成本低，沿用既有介面與網址白名單。
- B：新增獨立分享面板與多種分享管道。較多操作與維護成本，本輪沒有相應證據需要擴大。

驗收：立即顯示等待；成功隱藏手動欄位；拒絕／缺Clipboard API可取得完整網址；仍停在原控制項時聚焦全選，已移動時不搶焦點；新請求／搜尋變動使舊結果失效；保留全部搜尋條件、排序、Pages base path及結果集合；分享直鏈重整、案例閱讀、返回、來源、空結果與載入錯誤復原正常。手機320／390、桌面1440及Chromium／Firefox／WebKit檢查。

只改分享行為、14px操作字級及ARIA描述。全文打包方案因目前legacy Pages分支建置無安全的產物自動生成及同路徑更新一致性保障而暫緩；沒有更改案例、證據、搜尋語意、合格計數或部署方式。首次441請求成本仍在，無新增追蹤、cookies、登入或第三方分享服務。

另一個既有隔離工作樹 `improve/reading-round-20261024` 後續也出現相同焦點修正；與本輪 `assets/app.js` 變更逐字相同。本輪未修改或合併該工作樹，另用獨立QA目錄保留證據，停止擴充相同邏輯；額外交付分享14px字級、狀態描述關聯及完整順序還原驗收。

## 可重現指令

```sh
node --test tests/search-sharing.test.cjs
node --test --test-reporter=tap tests/*.test.cjs
node --check assets/app.js
python3 scripts/preview.py /tmp/share-preview/ai-agent-use-cases
# 以下於GitHub Actions的既有Playwright容器執行
python3 -m http.server 8184 --directory /tmp/share-preview
SITE_URL=http://127.0.0.1:8184/ai-agent-use-cases/ node tests/search-sharing-browser.cjs
SITE_URL=http://127.0.0.1:8184/ai-agent-use-cases/ node tests/page-context-browser.cjs
GUIDE_URL=http://127.0.0.1:8184/ai-agent-use-cases/ node tests/source-guide-share-layout.cjs
```

先新增測試，原碼重現2項功能失敗（等待空白、焦點被移走）；修後新增5項分享單元全通過。`checks/red-local.tap`保留原始失敗。既有來源說明分享測試改等待終態，避免新的「正在複製」讓舊非空等待提早通過，沒有放寬版面斷言。

repo沒有獨立lint／TypeScript設定，JS語法檢查不冒稱lint或type check；Python preview不冒稱正式Jekyll build。自動axe不是完整讀屏器驗證；情境走查是模擬，不宣稱真人滿意度、留存或轉換率提升。

## 前後截圖與結果

待最終雲端結果補入。原始修改前報告與兩尺寸截圖已保留於 `before/`。

下一輪優先降低首次全文請求量，先確保每次公開來源變動都可產生一致且可驗證的新資料產物，再評估打包；保留直鏈早讀與失敗補讀。
