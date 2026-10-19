# 2026-10-20：手機閱讀控制列

目前狀態：已合併main並完成Pages正式部署；三引擎六配置正式站驗收成功。以下保留前輪未完成時的歷史記錄，最新證據見文末「正式發布」。

## 問題與選題

目標讀者：手機上從搜尋讀長案例、連續比較不同做法，再返回結果的人。

基準 `8fb425f`。fetch 後 origin/main 相同，無開啟 PR，無適用 AGENTS.md。原工作樹 `assets/app.js`、`tests/search.test.cjs` 有未提交編輯，完整保留；另建 `/tmp/ai-reader-position`、`improve/reader-position`，主角色單一整合。已讀 README、SITE、既有閱讀與搜尋 QA、部署 workflow。

相同基準的 [既有雲端 run39269334998](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39269334998) 預覽截圖顯示 320px 閱讀末段的上一則／下一則／關閉仍是窄小控制列。CSS specificity 檢查指出手機一般為12px、<=360px為11px，不能把被覆蓋的10px宣稱為實測字級。本輪新增雲端實測與前後比較，數據以報告為準。已實際檢視並保存同基準雲端預覽的[320px截圖](baseline-reader-320.png)與[1440px截圖](baseline-reader-1440.png)，兩張位於長文尾段，能比較原控制列尺寸；不冒稱為本輪新跑出的截圖。

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

## 前輪歷史：雲端阻塞與交接狀態（非本輪最終結果）

[GitHub官方事故8tzbpcnl75jp](https://www.githubstatus.com/incidents/8tzbpcnl75jp) 自2026-10-19 15:49 UTC 通報 Actions、Pages、Webhooks降級；16:30更新指出緩解後正在恢復，仍可能延遲工作流程及網站部署。這與本輪queued狀態一致，不能證明單一run的根因。

產品與鍵盤測試[驗收run39286391969](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39286391969) 針對最終產品與鍵盤測試提交`64b3294`。目前無runner、無瀏覽器輸出。較早的五個run同樣排隊；嘗試取消過時首run遭GitHub API 403（現有CLI身分無此repo管理權限），未反覆嘗試。SSH分支push成功，沒有更換帳號或憑證。

已交付可審查分支與靜態預覽 `/tmp/reader-preview/ai-agent-use-cases`。正式站仍為基準；**未merge、未部署本輪產品、未宣稱跨瀏覽器或axe通過**。主工作樹的兩個未提交修改仍完整保留。

待服務恢復：讀取最新run的artifacts，確認red失敗專屬尺寸訊息、新版六配置與reader/load回歸通過；檢視before/after截圖，由獨立角色複審，再fetch main正常merge/push並等候正式站live驗收。若仍有失敗先修正，不能以此次靜態review代替瀏覽驗收。

尚無新版前後對照圖或實測性能/axe分數，不捏造資料；未驗證實體手機、Safari、螢幕閱讀器。下一輪首要工作是完成此輪雲端視覺與正式發布驗收，不另起一輪重做版面。

獨立角色最終靜態結論：沒有發現阻擋性程式問題；修正了其提出的鍵盤modality測試誤斷言與workflow尾端空白。這不代表實際視覺、跨引擎或無障礙已通過。


## 本輪接續：2026-10-20 雲端驗收與整合

本輪從既有未完成分支接續，不重做選題或另改配色。主整合者使用 `/tmp/ai-search-reading-context` 獨立工作樹，整合 `improve/reader-position`；原 checkout 兩個未提交搜尋檔案保持不變。遠端 main 基準仍為 `8fb425f`，沒有開啟 PR。

本次正式站走查已確認：1440px 按鈕高31.80px／12px字；390px 上一則／下一則高29.80px／12px字、關閉31.80px；320px 三按鈕高30.14px／11px字。正式站桌面／390／320完整搜尋、篩選、切換、來源入口、Escape焦點、分享直鏈重整、空結果、長文方法跳轉與鍵盤檢查通過。新版六配置皆44px高／14px字，320px三按鈕各約80.7px寬。

獨立審查先以 `gpt-6-astra/max`、最終以 `gpt-6-astra/ultra` 明確指定請求，均未參與實作；主對話實際模型／推理仍無法讀取或切換，不能聲稱已確認帳號最高模型。審查提出並已修正：刻意red失敗時瀏覽器未清理、axe須明確browser context、實際頁面載入CSS版本比對、整個方法標題可見、長ID後按鈕尺寸與不重疊、Escape原焦點、直鏈條件及完整workflow paths。三引擎與視覺結論依實測，未以靜態review取代。

驗收過程保留的限制：
- `39290962013` 的原QA腳本因 axe 要求 `browser.newContext()` 失敗，已修正腳本；不是網站無障礙違規。
- `39291263097` 正式站前三尺寸完成後，360px重整直鏈逾時，當時未存足夠失敗狀態，根因不明；後補失敗URL、載入缺項與截圖診斷。沒有宣稱修好網站載入根因。
- `39291632580` 的GitHub原文GET回429，同一來源此前曾200。當時網站357筆已載入、`failed=[]`、詳情開啟。來源入口仍精確核對原始UC-001檔案，外站HTTP狀態另行實測保留，不拿第三方永遠200作CSS驗收條件。既有reader回歸仍實際開啟外部來源popup。
- 第一個過時run的取消操作遭GitHub API 403；未更換帳號、憑證或擴充權限。

三個模擬情境：旅遊＋生活後連續比較與返回；分享帶搜尋條件直鏈並重整後關閉；無結果恢復後讀UC-313長文、方法跳轉及鍵盤操作。另以既有load recovery套件檢查載入／部分失敗／重試／無資料；模擬走查不代表真人偏好或轉換率。


## 完整預覽驗收

[雲端run39291990938](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39291990938) 驗證 `3282f6d`，全部成功；產品CSS與最後審查版一致。

| 指令／檢查 | 實際輸出摘要 |
| --- | --- |
| `node --test tests/*.test.cjs` | 78 tests、78 pass、0 fail；357筆網站條目 |
| `for file in assets/*.js; do node --check "$file"; done` | 語法通過 |
| `python3 scripts/preview.py <output>/ai-agent-use-cases` | 靜態預覽與catalog產生成功；不是正式Jekyll建置 |
| `OBSERVE=1 LABEL=published-before CONTROLS_URL=<正式站> node tests/reader-controls-browser.cjs` | 1440／390／320完整流程；3次axe皆0違規 |
| `LABEL=red CONTROLS_URL=<8fb425f預覽> node tests/reader-controls-browser.cjs` | 明確因`TOUCH_TARGET_SIZE`失敗，確認舊版問題可重現；見[red.log](red.log) |
| `LABEL=after CONTROLS_URL=<預覽> node tests/reader-controls-browser.cjs` | Chromium1440／390／320／360、Firefox390、WebKit390，六配置三情境及44px尺寸、14px字、長ID、來源精確path、焦點、直鏈重整、方法標題完整可見、無橫溢出通過；6次axe為0，pageerror為空 |
| `READER_URL=<預覽> node tests/reader-browser.cjs` | 既有三引擎閱讀、搜尋／篩選／空結果／返回／章節與原始證據／外部來源popup／分享回歸通過；15次axe零違規；全庫357筆、2486章節、376個證據列 |
| `LOAD_URL=<預覽> node tests/load-recovery-browser.cjs` | 既有Chromium1440／390／320載入／部分失敗／重試／零成功／無資料／焦點／閱讀返回通過，12次axe零違規；本次未把此套件宣稱為三引擎 |

產品變更是`assets/reader.css`的13增5刪，未壓縮6232→6708 bytes（+476），不新增網路請求。runner靜態預覽的DOMContentLoaded為32–79ms、load為43–170ms，只是頁面事件時間，非全庫就緒、實際手機或Lighthouse效能分數；未宣稱速度提升。

原始結果：[正式站基準](published-before-report.json)、[同基準預覽](before-report.json)、[新版六配置](after-report.json)、[閱讀axe](reader-accessibility.json)、[全庫核對](reader-corpus.json)、[載入復原](load-recovery.json)、[事件時間](reader-timings.json)、[外站429診斷](source-429.json)。完整其他畫面與log保留於該run artifacts。

| 尺寸 | 本輪修改前（正式站） | 修改後（雲端預覽） |
| --- | --- | --- |
| 桌面1440×1000 | [before](before-reader-1440.png) | [after](after-reader-1440.png) |
| 手機390×844 | [before](before-reader-390.png) | [after](after-reader-390.png) |
| 窄手機320×844 | [before](before-reader-320.png) | [after](after-reader-320.png) |

另存[320px長文閱讀](reader-after-UC-005-small-mobile.png)、[長篇失敗案例](reader-result-UC-313-mobile.png)、[WebKit390](after-reader-webkit-390.png)。主整合者與未參與實作的獨立最終審查者皆已實際檢視桌面／手機前後、長文及WebKit圖片；最終結論可合併、無阻擋問題。兩列操作區保持案例識別、按鈕完整且正文仍可讀。手機多一列高度是擴大操作區的取捨。

預覽方式（僅在已授權環境執行）：

```sh
python3 scripts/preview.py /tmp/reader-preview/ai-agent-use-cases
python3 -m http.server 8100 --directory /tmp/reader-preview
# http://127.0.0.1:8100/ai-agent-use-cases/?q=旅遊&scenario=生活&case=UC-001
```

無實體手機、實體Safari、螢幕閱讀器或真人轉換率驗證；axe不等於完整認證。外站可能限流，首次數百個全文請求也仍有成本。下一輪優先量測並降低首次全文載入成本，保留完整搜尋與來源可核對性。


## 正式發布

產品以正常Git merge合併到main並push，提交`05f38efc9558f5f5281ae6e81ceee30eaa6e1acc`；未強推、未建立或冒稱有PR review。原工作樹兩個未提交搜尋檔案的diff SHA-256仍為`1e6bb01a304879f93009093c677e9d5d59203cac737c00751ced16765b3f162d`，與本輪開始檢查相同。

- [Pages正式Jekyll建置及部署39293209912](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39293209912)成功。
- [Reader controls正式站驗收39293211415](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39293211415)成功：再次完成78/78單元、固定基準red、新版預覽、閱讀／載入復原回歸與正式站六配置。頁面實際載入`reader.css` response逐配置與checkout全文相同；全部44px高／14px、6次axe零違規、pageerror為空。GitHub來源此次為200；先前429仍保留為外站風險。
- 正式CSS HTTP200、SHA-256為`0e3cc6b48d473396207eead457ef6250a9e83d3c4df18db5f9de17d750c43a0e`，與提交一致。
- [正式站原始報告](live-report.json)、[桌面正式畫面](live-reader-1440.png)、[390px正式畫面](live-reader-390.png)、[320px正式畫面](live-reader-320.png)。主整合者已再次實際檢視正式桌面與手機截圖。

[立即體驗正式閱讀流程](https://richardhan.github.io/ai-agent-use-cases/?q=%E6%97%85%E9%81%8A&scenario=%E7%94%9F%E6%B4%BB&case=UC-001#explore)。

變更檔案為`assets/reader.css`、`tests/reader-controls-browser.cjs`、`.github/workflows/reader-controls-qa.yml`、`SITE.md`及本QA目錄（紀錄、截圖、原始報告）；未修改`index.html`、產品JavaScript、案例或來源資料。
