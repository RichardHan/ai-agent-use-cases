# 2026-10-20：找到最近核對的內容

## 問題、選擇與界線

對象是回訪案例庫、想看看近期核對內容的讀者。[正式站雲端走查 39351188756](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39351188756)實際完成桌面及390px首頁、旅遊＋生活＋Grok Bot搜尋、空結果、閱讀返回、UC-313直鏈重新整理與來源popup。362筆完整載入、無pageerror或HTTP錯誤；無查詢首批UC-001～006，近期頁首日期UC-360～364沒有直接入口，也沒有卡片日期。見[live-baseline.json](live-baseline.json)。有關鍵字時原本已有相關性排序，本輪保留預設。

- A：首頁近期入口、可分享的頁首核對排序及日期標示。成本中等，能直接完成回訪搜尋與閱讀流程；採用。
- B：建置時生成全文分包。可降低數百次請求，但legacy Pages建置權限與自動同步尚無新解法，成本較高；不以手動副本代替。

本輪不改案例原文、合格資格、來源分類、搜尋同義詞、框架或Pages設定，不新增追蹤、儲存或第三方前端服務。首頁315先同步為既有稽核317，再隨協作者新批次同步318是原有資料不一致補修，未重新稽核或增加合格案例。

## 驗收標準

1. 首頁一般點擊與開新分頁都抵達全部近期內容；一般點擊不重新下載全庫。
2. 預設維持既有相關性；切換排序不改符合集合、facet計數或靈感卡，同日保留原本順序。
3. 日期只取頁首白名單核對欄位內合法ISO曆日，複合欄位取最大值。原文時區記載不換算；不借用發表日、正文或P共用頁首。初始362筆中345筆有記錄、17筆未知；整合協作者UC-365後363筆中346筆有記錄。
4. 明示「頁首核對」、不是發布／新增或獨立驗證，正文補充不計；未知明示並置後。
5. `sort=reviewed`保存於搜尋／案例分享、直接連結、重新整理、關閉與原生Back；排序選單保留鍵盤焦點，全部重設回預設。
6. 載入中編輯、部分失敗補讀、整體錯誤重試、空結果與未知日期無遺失狀態；補讀重新排序後保留同一ID焦點。
7. 實際雲端Chromium1440／390／320、Firefox與WebKit390走查；保留手機原結果距搜尋<240px檢查，並執行原相關性、讀者與探索回歸及axe。

## 環境與基準

獨立工作樹基於`f03decb`，原目錄兩個未提交搜尋檔完整保留。沒有適用AGENTS.md，依README、_config.yml、既有QA及維護紀錄。遠端沒有開啟PR，另有協作者研究分支和工作樹，不變更它們。

主對話實際模型／推理與帳號最高可用設定無法查證或切換；本機預設設定僅顯示`gpt-6.1-sol`／`medium`，未改設定。獨立架構與審查角色透過工具指定`gpt-6-astra`／`max`，不宣稱主對話也使用該設定。由主代理單一整合，審查者唯讀。

Orca CLI回報`Unable to determine Orca.app path from symlink: /usr/local/bin/orca`，停止使用；未開啟個人電腦GUI，瀏覽器執行與Playwright／axe套件只在GitHub runner。僅使用既有授權工具，不另付費API。

基準`node --test tests/*.test.cjs`為103測試、102通過、1失敗：首頁315與稽核317不一致（[baseline.tap](baseline.tap)）。JS語法與`python3 scripts/preview.py`通過。沒有獨立lint、TypeScript或npm build；Python預覽不等同正式Jekyll建置。

## 實作與指令

`assets/app.js`新增獨立reviewedDate與穩定排序，不改舊date或原文。`index.html`提供首頁入口、篩選面板排序與範圍說明；`assets/style.css`沿用品牌樣式。`tests/recent-review*`覆蓋日期、順序、URL、五種瀏覽配置及復原流程；[Recent review discovery QA](../../../.github/workflows/recency-qa.yml)執行固定基準紅燈、預覽、既有回歸及部署後版本閘門。

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/recent-review*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/recent-preview/ai-agent-use-cases
python3 -m http.server 8131 --directory /tmp/recent-preview
# 已安裝測試工具的環境：
RECENT_URL=http://127.0.0.1:8131/ai-agent-use-cases/ node tests/recent-review-browser.cjs
RECENT_URL=http://127.0.0.1:8131/ai-agent-use-cases/ node tests/recent-review-recovery.cjs
```

新增單元先紅燈（舊版無reviewDate與排序），修後107／107通過，見[red-unit.tap](red-unit.tap)與[unit.tap](unit.tap)。同一瀏覽器驗收另會在固定舊版明確重現缺少控制，不用缺少函數的單元紅燈代替實際流程證據。

雲端截圖、獨立審查、正式部署結果待完成後補記；尚未宣稱瀏覽器與發布驗收通過。

## 限制與下一輪

這是三種任務的模擬走查，不是訪談或真人偏好證據；不宣稱留存、轉換或效能提升。沒有Lighthouse分數、實體手機或完整螢幕閱讀器認證。頁首記錄可能落後正文補充；刻意明示限制，不推算日期。下一輪優先建立可自動同步的全文分包建置流程，降低每次開頁全文請求成本。

## 審查與中間失敗（不算最終通過）

獨立架構／實作審查未改產品檔。指出並已修正：預設空結果不應顯示相關性說明；首頁實際href與一般點擊須等價；排序不得重抽靈感卡；無重新載入的證據改比timeOrigin；結果集合另獨立比對，不能只呼叫被測排序當期待值。預設零結果原斷言保留並加入relevance-browser完整命令。

- `39351605217`：QA腳本未先建立qa-artifacts導致redirect失敗，未跑到新功能檢查。已補mkdir；不算產品失敗或紅燈重現證據。
- `39351678052`：固定舊版瀏覽器確實因缺少近期控制失敗；新版桌面旅程後的UC-239定位不夠精確，因全文交叉引用有4筆結果，測試選擇器失敗。[原log](first-browser-failure.log)保留，修為精確案例ID，不縮窄產品搜尋。
- `39351850921`：五配置各2次axe零違規；Chromium三尺寸、Firefox390無pageerror，WebKit在early-open後立即reload時捕捉32筆存取檢查錯誤，[原log](webkit-interrupted-load.log)保留。該次整體FAIL，不能只採axe或截圖當成功。新驗收將「完成閱讀後重新整理」等待全庫就緒再reload，仍要求pageerror為空；不過濾錯誤，不宣稱已確定WebKit內部根因或驗過載入中立即重整。
- 等待中main新增`f42d161`。無衝突整合UC-365與UC-030補充，並隨既有稽核同步首頁318。新增共用來源令舊固定47候選斷言失敗（[整合紅燈](research-integration-red.tap)），逐組比對確認新增2組後，改為精確49並加每組原始檔案斷言，未刪案例。此狀態使`39352197957`在unit步驟失敗，尚未進入瀏覽器。

新增候選（只是共用來源，不判定為重複案例）：

| 共用來源 | 保留的原始頁面 |
| --- | --- |
| `https://learn.chatgpt.com/docs/dots/tasks-and-memory` | UC-005、UC-365 |
| `https://reddit.com/r/grokbot/comments/1x9kmc4/groq_bot_use_cases_compilation_i_complied_from_10` | UC-030、UC-360 |

獨立審查已看桌面首頁／結果／詳情，無裁切或重疊。最終手機與完整雲端結論另補。日期文字`#285344`對白卡片8.71:1、對紙色8.16:1；前三個前端檔增加3,671未壓縮bytes，見[sizes-and-contrast.json](sizes-and-contrast.json)，不代表傳輸量或效能提升。

WebKit同型限制在前輪已有獨立紀錄：[shared-case-first](../2026-10-20-shared-case-first/README.md)的載入中立即重整診斷曾記48筆`due to access control checks`。本輪未改載入器；等待完整就緒再驗一般重整，不等於已修正此瀏覽器診斷。

`810cbb2`的[雲端39352306289](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39352306289)仍為FAIL：新功能五配置皆363筆／346日期／0pageerror／10次axe零違規，三個復原情境通過；原手機390／320距搜尋233px、loading budget及relevance完成。但Discovery只留下after-mobile.jpg，未產生下一個guide-mobile.png，Reader未進入，完整log也沒有可定位的錯誤文字。保留[incomplete-regression.log](incomplete-regression.log)，不將部分通過寫成完整成功。改為逐命令保留完整stdout／stderr檔，維持原命令及斷言，且優先執行未完成的Discovery與Reader。

期間`db85037`合併UC-366～368及既有頁補充。先停止有衝突的audit測試修改，比對stage-2／stage-3並由獨立角色唯讀核對；兩側共同49完全相同，只有本輪兩組新增斷言。只去除markers並保留所有斷言；來源、案例與INDEX和db85037完全相同。首頁採協作者的320，本輪暫時同步318已撤回。整合後107／107再通過。未reset、未強推、未改原目錄未提交檔案。

## 完整回歸與精準重測的證據界線

前一批363筆語料的[e4893c0完整七套39353436496](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39353436496)已成功。原命令、斷言及產品未為截圖中止修改，只把stdout／stderr分檔保存；之前中止的內部根因仍不確定，不宣稱已修復瀏覽器截圖問題。

最新366筆資料的[1e69263驗收39353924703](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39353924703)整體仍為FAIL，但log明確記錄兩套原回歸PASS：[Discovery](discovery-browser.log)及[Reader](reader-browser.log)。Reader完整366條目／2556章節／385證據列，15次axe零違規，見[reader-corpus.json](reader-corpus.json)與[reader-accessibility.json](reader-accessibility.json)。原log僅移除已另存圖片的VISUAL base64行，未刪PASS／錯誤；[原始log雜湊](regression-log-provenance.json)可核對Actions artifact。

該run後續FAIL是新加入的測試錯誤：先按下一則／上一則會增加history，單次Back自然仍回案例，測試卻等關閉。修成先獨立驗「直接開啟→原生Back」，再另開驗「下一則／上一則→Escape」，保留日期順序、返回焦點與全部斷言，不改產品history行為。

精準重測版f8ed2bd只改新測試、workflow及紀錄。505個產品、語料、scripts與原測試／helpers的合成SHA-256對1e69263完全相同，見[reused-regression-integrity.json](reused-regression-integrity.json)。因此沿用已完成的兩套回歸，另跑recent／recovery／mobile／budget／relevance五套；文件分列run，不能把失敗run改記成功。既有main Website／Reader CI照常執行，未更動。

另補強正式資料驗收：HTML／JS／CSS與catalog路徑集合必須符合checkout；瀏覽器逐筆比對實際載入markdown與repo原檔、P分節及完整條目數，防止新介面配舊目錄或舊全文快取被誤認為新版。無新增前端請求，此檢查只在測試環境執行。
