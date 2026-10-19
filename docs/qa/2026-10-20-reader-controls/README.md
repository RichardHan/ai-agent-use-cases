# 2026-10-20：手機閱讀控制列

## 問題與選題

目標讀者：手機上從搜尋讀長案例、連續比較不同做法，再返回結果的人。

基準 `8fb425f`。fetch 後 origin/main 相同，無開啟 PR，無適用 AGENTS.md。原工作樹 `assets/app.js`、`tests/search.test.cjs` 有未提交編輯，完整保留；另建 `/tmp/ai-reader-position`、`improve/reader-position`，主角色單一整合。已讀 README、SITE、既有閱讀與搜尋 QA、部署 workflow。

相同基準的 [既有雲端 run39269334998](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39269334998) 預覽截圖顯示 320px 閱讀末段的上一則／下一則／關閉仍是窄小控制列。CSS specificity 檢查指出手機一般為12px、<=360px為11px，不能把被覆蓋的10px宣稱為實測字級。本輪新增雲端實測與前後比較，數據以報告為準。

兩方案：A 保持單列並擴大按鈕，改動少，但320px容易擠壓；B 桌面單列、手機案例編號與三按鈕分兩列，增加一列高度但完整保留文字與常駐識別。採B。既有章節跳轉依實際toolbar高度計算落點。

驗收：320／360／390／1440px，三按鈕至少44×44px、字級至少14px；不溢出，長編號不撐開版面；長文滾動後控制列仍可操作，方法標題跳轉不被遮住；搜尋組合條件、上一則／下一則、來源、空結果、直鏈重整與關閉返回正常。

本輪不改案例、來源、合格數、搜尋演算法、證據分類、品牌或框架；不新增服務、追蹤器或使用者資料傳輸。

## 變更與指令

- `assets/reader.css`：移除舊窄螢幕壓縮規則，統一44px以上控制區／14px文字；手機三等分按鈕，編號獨立一列。長ID省略顯示，正文仍保留完整ID。
- `tests/reader-controls-browser.cjs`：雲端三引擎、六配置的實際流程與尺寸、焦點、溢出、axe檢查。
- `.github/workflows/reader-controls-qa.yml`：固定基準截圖與尺寸失敗重現、新版預覽及正式站驗收，保留artifacts。瀏覽器與npm依賴只在GitHub runner安裝。

```sh
node --test tests/*.test.cjs
for file in assets/*.js; do node --check "$file"; done
python3 scripts/preview.py /tmp/reader-preview/ai-agent-use-cases
# 以下僅在既有授權雲端runner執行
python3 -m http.server 8100 --directory /tmp/reader-preview
NODE_PATH=<runner-tools>/node_modules LABEL=after node tests/reader-controls-browser.cjs
```

基準與修改後純函式測試均78/78通過，JS語法通過，靜態預覽成功。無獨立lint、TypeScript、npm build；預覽不等同正式Jekyll。基準既有Related reading正式站QA在`failedPaths.length`期望0而得到2；其預覽通過，未將此原有載入失敗歸因本輪CSS。

三個模擬情境（不代表真人偏好或轉換率）：搜尋旅遊並篩生活後連續比較案例；分享案例直鏈重整再返回原搜尋；無結果恢復後讀UC-313長文、跳方法及查看來源。

## 模型與環境

可讀設定檔為`gpt-6.1-sol / medium`，無法證明或切換主回合runtime。獨立審查角色明確請求`gpt-6-astra / ultra`，同樣不能驗證實際runtime或帳號最高可用模型。未另用付費API或購買額度，未操作個人GUI。

獨立審查者唯讀檢查CSS specificity、320px欄寬、長ID、sticky跳轉與測試；提出方法焦點及專屬red訊息補強，已採納。跨引擎與視覺結論待雲端結果補入。

## 待完成驗收

雲端runner排隊期間尚不宣稱瀏覽驗收、部署或合併完成。後續於此記錄實測報告、截圖、審查及發布結果。
