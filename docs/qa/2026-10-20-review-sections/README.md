# 2026-10-20：逐段核對連結與限制

## 證據、對象與方案

對象是已找到案例、要決定能否採用的讀者。正式站基準 7b1b36a 的雲端走查 [39315907743](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39315907743) 完成 Chromium 1440、390、320 的首頁、搜尋、生活情境＋工具篩選、空結果、詳情及鍵盤返回。主整合者目視 UC-005 桌面與 UC-338 手機實圖。既有閱讀導覽每意圖只選首段；UC-024 的後續貨運版本來源放在版本標題下，UC-338「驗收與可重現性」有另一組證據缺口，UC-005/067 有多次補充；四個快捷不能揭示完整候選。

- A：閱讀導覽內新增預設折疊的原文章節索引，依網頁連結與限制相關標題選段。成本低中、能找後續版本，連結存在不代表可信。採用。
- B：合併或分片全文載入，降低首次與回訪請求。成本中高，需處理 Jekyll 與資料一致性、全文搜尋及部分失敗復原，另輪處理。

本輪不改案例原文、證據級別、合格數、資料計數、搜尋語意或載入架構；不增加儲存、追蹤器或外部服務。

## 驗收標準

1. 原標題與未驗證註記完整保留，候選依原文順序，重名以章節位置識別；不稱為來源數或獨立驗證。
2. 點擊才展開原始研究、聚焦正確原標題並避開固定工具列；網址與返回流程不變。
3. 所有 HTTP(S) 連結所屬的原文章節及限制相關標題有對應入口；無候選不顯示，無章節有連結時指到頁首資料。
4. 全庫原文 HTML、連結完整性不變；待查、重名、安全字串及長標題可用。
5. 1440、390、320 及 Chromium/Firefox/WebKit 驗證新流程與既有搜尋閱讀回歸，44px 操作、無橫向溢出及 axe A/AA；正式 Pages 另驗證。

## 環境、基準與限制

原工作樹分支 improve/search-recall-recent-workflows-and-tokenization 的 assets/app.js、tests/search.test.cjs 未提交修改保留。fetch 後遠端比原分支新39筆；從 origin/main 7b1b36a 建隔離分支 /tmp/ai-reader-evidence-navigation。沒有適用 AGENTS.md 或開啟 PR。沿用 README、歷史規範、SITE.md、scripts/preview.py 和雲端 QA。主整合者是唯一修改者。

設定檔為 gpt-6.1-sol/medium，不能證實主對話執行設定或切換最高模型。架構與獨立審查透過工具明確指定 gpt-6-astra/ultra；不宣稱主對話已切換。不使用付費 API；瀏覽器與 npm 套件只於已授權 GitHub runner 執行，沒有操作個人 GUI。

基準 87/87 單元測試、JS syntax、Python 靜態預覽通過；先新增3個失敗測試（selectReviewSections 不存在）再實作，修後90/90通過。無獨立 npm build、lint 或 TypeScript 設定；靜態預覽不冒充 Pages Jekyll build。原始 TAP 與檔案尺寸差額保存在本目錄。

GitHub CLI 目前 EMU 身分無法 createPullRequest；已授權個人 SSH 可 push，將採非強推整合。未能取消舊雲端run（403），不將取消失敗列成產品驗收失敗。

## 驗證進度

[最終邊界測試 run39316528475](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39316528475) 驗證 d105dfd，90/90單元、JS語法、靜態預覽、兩套瀏覽器流程全部成功。6bb4bdb為首輪產品碼；20baac2另將新說明使用獨立CSS類別，保留既有閱讀導覽hint唯一性及相同字級樣式。後續測試加入原始閱讀器全回歸，最終結果另補。

- 全庫357筆＋3個獨立fixture：共1177個候選（其中fixture有3個，實際庫1174個），原文HTML不變、目標存在且原標題相符。這是導覽段落數，不是合格案例數或獨立來源數。
- UC-024從首個來源快捷，增加完整5段候選，含第7段貨運版本與第8段未實跑驗收；UC-005有21段、UC-067有14段、UC-338有4段；無截斷。
- Chromium1440/390/320、Firefox390、WebKit390五配置完成三種情境、44px操作、鍵盤落點、原生details、直鏈重新整理、返回、長文及安全字串；無橫向溢出。新功能10次axe＋既有reader-search10次axe零違規。
- 獨立review抓到的重複enhance測試已改為乾淨showDetail實例；全庫oracle來自原始渲染DOM，未用selectReviewSections自己當答案。獨立角色未改產品或測試檔。
- 可見輔助文字 #526057 對 #f5f7ef 對比6.13:1，綠文字對白底8.71:1，按WCAG相對亮度計算。資產合計增加3140 bytes（未壓縮）。未量測Lighthouse或真實網路表現。
- 三種模擬情境：旅遊問題搜尋→生活組合篩選→空結果修正→詳情→返回；分享UC024→核對後續貨運版本來源與原限制；UC338→無連結的證據缺口。另測UC005/067長清單與無章節待查。這不是實際受試者研究。

來源入口實際於雲端瀏覽器開啟Reddit原串，記錄URL；不將URL開啟成功說成來源內容可存取或成果驗證。原有context測試另有官方來源HTTP結果，詳見context-preview.json。

初次與取景補強後圖均由同一產品碼產生；正式站基準四檔逐byte等於7b1b36a，見baseline-assets.json。[補圖run39317013847](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39317013847) 已成功。獨立角色目視390與320展開清單、貨運後續版本及UC005第27–30段，確認原標題、未實跑／未測與段序完整，無橫溢或遮擋，取景缺口已解決。此補圖產品與最終版只差獨立說明類別，字級、行高及色彩相同；最終版另跑完整回歸。

## 修改前後截圖

| 尺寸 | 原導覽 | 新導覽（預設折疊） |
| --- | --- | --- |
| 1440×1000 | [before-desktop.jpg](before-desktop.jpg) | [after-desktop.jpg](after-desktop.jpg) |
| 390×844 | [before-mobile.jpg](before-mobile.jpg) | [after-mobile.jpg](after-mobile.jpg) |
| 320×740 | [before-small-mobile.jpg](before-small-mobile.jpg) | [after-small-mobile.jpg](after-small-mobile.jpg) |

手機補充：[390展開](expanded-mobile.jpg) · [320展開](expanded-small-mobile.jpg) · [390後續版本](later-index-mobile.jpg) · [320後續版本](later-index-small-mobile.jpg) · [320長清單後段](long-index-small-mobile.jpg)。

## 重現指令

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/review-preview/ai-agent-use-cases
python3 -m http.server 8100 --directory /tmp/review-preview
NODE_PATH=<cloud-tools>/node_modules node tests/review-sections-browser.cjs
READER_SEARCH_URL=http://127.0.0.1:8100/ai-agent-use-cases/ READER_SEARCH_ENGINES=all NODE_PATH=<cloud-tools>/node_modules node tests/reader-search-browser.cjs
```

瀏覽器實際只在GitHub runner執行。預覽使用base path，直鏈及reload皆測；正式Jekyll部署另驗證。修改檔案：assets/reader.js、assets/reader.css、tests/review-sections.test.cjs、tests/review-sections-browser.cjs、tests/reader-browser.cjs、.github/workflows/evidence-round-qa.yml，以及SITE.md和本目錄證據。

## 未能驗證與下一輪

沒有實體手機、iOS軟鍵盤或真人螢幕閱讀器測試，axe不等於完整無障礙認證。依標題選的清單不保證含所有限制，已在介面明說。沒有真人偏好、留存、轉換率或成效提升數據。下一輪最值得做的是降低全文載入成本，先量測請求與資料版本一致性，再選合併索引或分片，保留部分失敗補讀。


## 完整閱讀器回歸補記

擴查原始reader suite時，修正新說明使用舊hint class造成唯一定位歧義，樣式等價。中途run39317184837在舊P-003「無任何nav」斷言失敗；本輪已明確新增無章節來源入口，因此bb3d06c改成無虛構outline／quick、唯一原有頁首連結入口與正確焦點，保留待查證據及axe檢查。獨立review確認這是精確驗證新行為，不是移除回歸。[最終run39317274737](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39317274737) 驗證9ae031d，全部成功：90/90單元、JS語法與靜態預覽；新流程、reader-search、原始reader三套瀏覽器回歸。三套主要檢查各10/10/15次axe共35次零違規（原始套件另含到站及復原檢查，沒有灌入此計數）。原始全文核對357筆、2486章節、376頁首證據列；可選腳本失效、catalog錯誤重試、單來源404、顯示文案缺失等既有降級通過。最新前後圖與驗收JSON已覆寫為此次最終產品20baac2的實際產物，非僅使用先前版本。

runner未節流的DOM/load事件時間保存在reader-timings.json，只是雲端本機靜態預覽頁面事件，非全庫就緒、真實裝置效能或Lighthouse評分；不據此宣稱加速。產品資產增量3140 bytes未壓縮，不新增網路服務。

獨立角色以工具明確指定的gpt-6-astra/ultra，只讀審查diff、原文及實際desktop／390／320圖。提出的乾淨fixture與取景缺口已修，CSS唯一性及P003斷言另經獨立審查；最終合併與發布另記。


## 合併、正式部署與背景檢查

合併前獨立審查通過，沒有剩餘必修。從最新origin/main建立整合分支，非強推合併為812511b；無衝突，產品、測試、workflow與受驗9ae031d完全一致。原工作樹仍只有原本兩個未提交檔案。[Pages39318305965](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39318305965) Jekyll建置與部署成功；公開HTML/app.js/reader.js/reader.css逐byte相同，SHA256見published-assets.json。

背景[Combined recovery39318306587](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39318306587) 的預覽五配置、正式Chromium三尺寸成功，但正式Firefox第二次導頁後empty等待逾時；舊診斷讀取靜態必有的copy-search-link時為null，又拋錯，因此未保存HTTP status/body。不能稱全背景QA全綠，也不能稱已證實網路抖動。app.js與index.html未改，索引沒有導向或替換主文件，因此尚無因果證據歸為本輪回歸。

在獨立verify/combined-recovery-document診斷分支（未併入main、不改產品）補存主回應status/content-type/redirect chain/body hash/前段及失敗請求，保留原斷言。最終[Firefox單次完整重播39319126396](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39319126396)成功：三次goto皆HTTP200且含預期HTML；兩項矛盾條件正確恢復7筆，直鏈重新整理、返回、查無結果、重設與axe0違規。診斷初版前一趟39319068571亦成功，但以保留嚴格ready條件的最終重播為準。原失敗沒有被抹去，原因仍未確定；見firefox-replay-document-responses.json及firefox-replay-after-report.json。這是一次有完整診斷的補驗，不是修改產品後宣稱根因修好。


## 正式站最終驗收與結案

[812511b正式站驗收39318307098](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39318307098) 的本輪新功能五配置全部完成：Chromium1440/390/320、Firefox390、WebKit390，10次axe零違規；每組均357/357，全部原文候選映射、三情境、長清單、無章節、焦點、直接連結及返回通過。published-verification.json與本目錄after／expanded／later-index／long-index圖已更新為正式站實際畫面。四檔資產也先經雲端再次逐byte確認。

該run整體仍是FAIL：接續舊reader-search在320px最初等待UC024卡片的10秒逾時。desktop與390完成且4次axe0；Firefox/WebKit在那一次未執行。原狀態保存在context-original-partial.json，沒有反稱原run全成功。

獨立審查確認app初載有20秒deadline，舊script在discoveryReady之前只有10秒等待，是等待契約的脆弱點，但原失敗沒有保存ready或缺項狀態，不能確定這次逾時根因。於verify/reader-context-ready（不改產品、未併入main）在原卡片斷言之前新增HTTP200與有界30秒discoveryReady等待，記錄就緒時間及failedPaths；其他原文、焦點、工具列、網址、來源、返回和axe斷言全部保留。

[正式context補驗39319575921](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39319575921) 五配置全成功、10次axe0，failedPaths皆空。該runner未節流的初載完成時間為2395/2223/485/1152/1030ms，非真實手機或前後效能比較；見context-published-verification.json。補驗補足正式context覆蓋，沒有把原FAIL改寫成成功。主合併的[原始Reading flow39318306705](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39318306705)與Reader QA等其餘背景檢查亦成功；上述兩次原失敗仍保留，未聲稱全背景綠燈。

合併前的獨立gpt-6-astra/ultra審查通過；發布後另獨立核對新功能五配置、補驗資料與正式截圖。沒有新增產品必修。未證實的兩次失敗原因留待後續有完整診斷時追蹤；不據此擴改來源或捏造根因。最後提交只補紀錄與圖，不再改產品。本輪達標停止。
