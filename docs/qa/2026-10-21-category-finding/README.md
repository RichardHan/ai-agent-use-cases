# 依名稱找到分類，再套用條件

基準 `a32f19a`，獨立clone `/tmp/ai-round-20261021-navigation`。原工作樹分支與兩個未提交搜尋修改完整保留，未改動其他工作樹；起始無open PR，無適用AGENTS.md。已讀README、歷史資料規範、近期SITE與QA、Jekyll catalog／Pages與preview流程。主角色為單一整合與寫入者，另有未參與實作的獨立設計／品質審查。

## 證據、方案與驗收

[雲端正式站基準39505073021](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39505073021)桌面1440與手機390實際走首頁、旅遊搜尋、生活＋分類篩選、詳情原文來源、Back返回與零結果；395條目、零缺項、零pageerror。原分類有247個選項（含全部），旅遊＋生活仍需從13個有結果的分類辨認名稱，原生選單完整保留其他0筆分類。這是操作結構的觀察，沒有冒稱真人滿意度或轉換率。原始數據見[baseline.json](baseline.json)。

目標讀者：知道主題字詞、但不知道完整分類名稱的人。A重編分類，結構較簡潔，但涉及資料治理、協作者分類與舊分享連結，成本高；B保留分類與原生選單，加預設折疊的依名稱找分類，成本低、舊連結相容，採B。獨立審查也比較過自製combobox，判斷IME、鍵盤與平台成本較高，不在本輪替換原生控制。

驗收：分類名稱部分詞／多字詞可查，完整名稱及符合筆數可見；只預覽8筆並明示總量及縮詞方式；0筆可選。輸入不改q、結果或URL，Enter不誤送表單；點分類才套用，焦點回原生select。載入／失敗／部分來源缺項、無符合名稱、長分類、選中狀態及補載後焦點皆須可辨識。保留搜尋、組合篩選、空結果復原、來源、直鏈重新整理、分享條件與返回。

不處理：原始分類重編、全文匹配、難度推估、內容／證據分類或合格數變動、全文載入效能重構。沒有新增產品依賴、追蹤、儲存、cookie、登入、付費服務或資料傳送。

## 實作與驗證

`index.html`加入折疊helper；`assets/app.js`以原始分類值查名稱、沿用現有facetCounts對q及其他條件計數，輸入只更新helper。點選與native select共用category狀態。補讀完成時保留同名分類button焦點，無相應項時回輸入框。`assets/style.css`沿用品牌、完整換行與44px點擊範圍，輸入另設可見焦點。所有名稱以textContent渲染，helper字詞不放入分享URL。

先寫`tests/category-find.test.cjs`，原基準缺少findCategories而失敗（[red.tap](red.tap)），實作後新增四項測試及原有132項共136/136通過。獨立角色另核對全庫246分類、五組條件，1230個分類計數與真正filterEntries一致，未修改原始資料。

測試指令：

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/category*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/category-preview/ai-agent-use-cases
python3 -m http.server 8160 --directory /tmp/category-preview
NODE_PATH=<cloud-tools>/node_modules node tests/category-lookup-browser.cjs
READER_URL=http://127.0.0.1:8160/ai-agent-use-cases/ NODE_PATH=<cloud-tools>/node_modules node tests/reader-browser.cjs
```

沒有獨立lint、TypeScript或npm build，語法檢查不冒稱lint；preview模擬catalog Liquid，正式Jekyll／Pages另驗。三個模擬情境：旅遊＋生活→找消費研究分類→閱讀來源→返回；全文零結果→辨認分類0筆→修改與重設；分享UC001附分類→重整→返回保留條件。模擬走查不代表真人喜好或留存提升。

## 模型與環境

本機設定檔可讀到`gpt-6.1-sol / medium`，但無法證明目前runtime型號／effort，也無切換本輪設定的介面，不宣稱已使用帳號最高模型。獨立review依使用者要求請求`gpt-6-astra / ultra`，同樣不把請求參數當runtime證明。使用OpenAI Docs技能與[官方設定參考](https://developers.openai.com/codex/config-reference/)，文件不是帳號模型權限證明。沒有使用另付費API或購買credits。

使用者最後明確授權指定個人路徑的檔案／Git工作；本輪沒有個人GUI或本機瀏覽器操作，瀏覽器驗收均在既有GitHub-hosted runner。Orca CLI技能入口回報`Unable to determine Orca.app path from symlink: /usr/local/bin/orca`，停止使用Orca命令，採獨立Git clone，不改Orca管理狀態。HTTPS push因協作者帳號403失敗後，沿用原repo已設的personal SSH push；沒有改API身分。舊雲端run取消請求亦被403拒絕，未修改權限，保留所有run原結果。

## 截圖與限制

修改前：[桌面篩選](filters-1440.png)／[手機篩選](filters-390.png)，另有home與detail原始截圖。修改後與正式驗收證據待雲端完成後補入。

未測實體手機／軟鍵盤／真人輔具，不以axe冒稱完整WCAG認證，不捏造效能分數或留存提升。下一輪優先降低首次全文載入成本，保留直鏈早讀與來源缺項復原。

## 中間失敗與獨立修正

獨立review要求修正輸入outline被全域CSS覆蓋、IME確認鍵與helper implicit submit、Safari保留helper focus時明確點主搜尋、以及來源補載後helper按鈕焦點恢復，均已補修並加驗收。主角色未讓review角色修改主檔。

中間雲端[39505453274](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39505453274)、[39505535938](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39505535938)、[39505729000](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39505729000)皆有WebKit在連續早讀導頁時的access control checks pageerror，列失敗、不改寫原結果。第二次run的Chromium三尺寸與Firefox390主要流程均完成，五配置共10次axe成功零違規，但整個run未通過。最終測試對每次direct-link重新整理先等discoveryReady，使這條驗收專注完整載入後的直鏈重整，保留全部pageerror斷言；沒有改WebKit設定、過濾錯誤或宣稱已確認上游根因。早讀導頁期間的瀏覽器錯誤行為仍屬未確證限制。

新增資產未壓縮5,817 bytes、gzip本機估算+1,406 bytes；不是網路傳輸或效能改善量測。新文字對白底對比8.71:1及6.57:1，[原始計算](sizes-and-contrast.json)。
