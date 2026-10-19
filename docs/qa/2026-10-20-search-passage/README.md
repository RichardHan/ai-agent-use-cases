# 2026-10-20 搜尋後定位命中原段

## 問題、對象與方案

對象是從問題關鍵字找到案例、想核對具體做法與限制的讀者。正式站基準 run39324301305 完成桌面/手機首頁、旅遊＋生活＋Grok Bot組合、空結果、詳情、鍵盤返回、UC313直鏈重新整理與外部來源。357筆、355個全文請求、363總請求，ready時間2716/543ms；未節流雲端數字，不是真實裝置或效能提升。來源HTTP200、兩次axe零違規。

方案A：以合併全文減少網路請求。成本高；[Jekyll include_relative實作](https://github.com/jekyll/jekyll/blob/v3.10.0/lib/jekyll/tags/include.rb)會先執行Liquid，不能保證原文逐字保留，且大catalog會阻擋早讀直鏈與局部復原。留到獨立構建工程。

方案B（採用）：保留既有章節快捷，新增同一個原段的連續節錄與定位入口。成本低中，讓讀者從搜尋直接核對限制，不改原文字與搜尋語意。UC001/Lyft、UC028/服務降級的雲端取證另列於下。

## 驗收與範圍

- 節錄來自原文單一p/li/blockquote/pre，保留原字與省略標記；不跨列，不把網址解析結果偽稱逐字原文。
- 使用既有選中的同義詞；標題或只有href命中保留既有章節入口。
- 定位展開完整研究，聚焦原段且工具列不遮擋；原章節入口、直鏈、分享、關閉與返回不退化。
- 長段落只承諾定位段落，不保證字詞本身首屏可見；有清楚焦點，沒有額外Tab負擔。
- 1440/390/320 Chromium、390 Firefox/WebKit，搜尋、組合篩選、空結果、否定語境、Unicode、安全字串、長文及原文完整性。
- 不改來源資料、分類、合格數312或網站條目357；不加追蹤、cookies、登入、第三方功能或新儲存。

## 工作環境

原checkout兩個未提交檔案assets/app.js、tests/search.test.cjs完整保留；fetch後以origin/main1868621建立獨立工作樹及分支improve/reader-context-search。無適用AGENTS.md，無開啟PR；不reset或強推。我是單一整合與實作者，獨立角色只讀審查。

設定檔讀得gpt-6.1-sol/medium，不能核實或切換主對話實際設定。架構與最後獨立審查透過工具明確指定gpt-6-astra/ultra；不假稱主對話已切換。僅既有訂閱與授權GitHub runner，沒有個人GUI/本機瀏覽器或付費API。基準90單元、JS語法及Python靜態預覽通過；repo沒有獨立lint/TypeScript/npm build設定，正式Jekyll另驗。

先新增6個單元測試，全因缺少selectSearchPassage而失敗，見red.tap；這只證明舊版沒有新API。產品問題的重現以雲端原段位置與實際截圖為準。修後98項單元通過，雲端結果另補。

## 基準實圖與問題重現

[正式站基準39324578880](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39324578880)用實際原章入口點擊後量測：390×844的UC001/Lyft命中段top1223.9px、UC028/服務降級top1113.5px；320×740則1598.3/1406.9px。不是推測或真人偏好，原始數據見before.json。主整合者已目視桌面與手機原圖。

| 視圖 | 修改前 |
| --- | --- |
| 390手機命中位置 | [before-mobile-location.jpg](before-mobile-location.jpg) |
| 1440桌面原章位置 | [before-desktop-location.jpg](before-desktop-location.jpg) |
| 320手機命中位置 | [before-small-mobile-location.jpg](before-small-mobile-location.jpg) |
| 390原入口 | [before-mobile-entry.jpg](before-mobile-entry.jpg) |
| 1440原入口 | [before-desktop-entry.jpg](before-desktop-entry.jpg) |

## 實作與獨立靜態審查

原章入口保留；新段落只附加唯一id及tabindex，不改原字或href。節錄用textContent輸出。Unicode由grapheme映回原字；上下文大小寫無法逐段一致映射、命中字超過節錄容量或Intl/Segmenter不可用時，保留定位，省略節錄。長段只承諾定位整段，不保證命中字在首屏。沒有新增網路請求、依賴或儲存。

未參與實作的gpt-6-astra/ultra角色獨立審查，發現的Greek sigma邊界與完整emoji段誤標節錄已修；獨立補跑16項相關單元與64組字形／位置案例。5878ce6靜態判定無剩餘必修，視覺與雲端另驗，不混稱已完成。

實算WCAG相對亮度對比：輔助字#62716a對#f1f6ec 4.68:1，原文#172b27對同底13.56:1，按鈕#285344對白底8.71:1。不是Lighthouse分數或完整無障礙認證。

GitHub CLI createPullRequest遭Enterprise Managed User限制；依原授權以非強推merge整合。取消被新版取代的三個run也遭403權限拒絕，沒有反覆嘗試或切換身份。

## 重現與預覽

```sh
node --test --test-reporter=tap tests/*.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/passage-preview/ai-agent-use-cases
python3 -m http.server 8110 --directory /tmp/passage-preview
# 以下僅在已授權雲端安裝瀏覽器工具後執行
NODE_PATH=<cloud-tools>/node_modules CONTEXT_URL=http://127.0.0.1:8110/ai-agent-use-cases/ node tests/reader-context-round.cjs
```

部署後驗收網址：`https://richardhan.github.io/ai-agent-use-cases/?q=Lyft&case=UC-001`與`?q=服務降級&case=UC-028`。維持GitHub Pages base path與原生query直鏈。

## 限制與下一輪

沒有實體手機、真人偏好、螢幕閱讀器或轉換/留存研究；自動axe不代表完整無障礙認證。未產出Lighthouse分數或宣稱載入加速。節錄不是完整案例、外部來源逐字引文或新證據；只有長段落時會明示省略，原段與章節入口仍可核對全文。

下一輪最值得處理仍是355個全文請求：以真正的構建步驟序列化原始內容，保留小manifest、直鏈優先讀取與局部失敗復原，再以實測選合併或分片；不要用會執行來源Liquid的include_relative替代原始讀取。

## 第一套完整雲端結果（後續相容性補修前）

[39325026206](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39325026206)驗證16d8444全部成功：新五配置（Chromium1440/390/320、Firefox390、WebKit390）、新10次axe零違規，357筆／459個定位段落文字與href完整性通過；既有reader-search、review-sections與原始reader整套通過。其後產品僅補Intl本體不存在守衛與完整emoji段誤標節錄，最終產品5878ce6與取景補強驗收另列，沒有拿前版測試冒充最新版本。

390手機定位後：UC001原段top157.5px、bottom370.2px；UC028top156.6px、bottom342.8px，工具列bottom140px。相較原章入口命中在1223.9/1113.5px，兩段均完整落入視窗。獨立角色目視390、320與桌面定位畫面，原否定與限制、可見焦點、工具列偏移及換行均通過；節錄區取景另補。

## 最終產品驗收

[最終產品5878ce6完整驗收39325222034](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39325222034)全部成功：98/98單元、所有JS語法、Python靜態預覽，新定位流程＋reader-search＋review-sections＋原始reader四套回歸。前三套各10次、原始reader15次，共45次主要axe掃描零違規，沒有灌入其他子測試掃描次數。

357筆／459個定位原段逐一比對原文HTML（只移除新增id/tabindex與原有返回控制）一致；原始reader另核2486標題與376頁首證據列。網路錯誤重試、單來源失敗、待查、可選reader.js失效與顯示文案缺失降級通過。原始JSON見verification.json、context-regression.json、source-regression.json與reader-axe.json；reader-regression.txt僅摘錄通過摘要，完整log見該run的reader-context-round artifact。

三種模擬走查：搜尋Lyft核對手動退款限制；搜尋服務降級核對短期折扣與未驗證長期成本；旅遊問題＋生活＋Grok Bot組合→空結果修正→鍵盤閱讀→返回保留條件。另驗直鏈重新整理、同義詞否定、標題／網址命中、頁首、長段、安全字串與Segmenter不可用。這是工程檢查，不是訪談或真人偏好證據。

產品碼於5878ce6固定；f7c476d只補強截圖取景、44px實量與缺項斷言，未改產品。預覽與正式發布另記於下方。

## 最終取景與再次驗收

[f7c476d補圖完整驗收39325968523](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39325968523)全部成功，產品與5878ce6逐byte相同；98單元與四套browser、45次主要axe零違規再次通過。每配置實際讀滿357筆、failedPaths空，新增定位按鈕實量至少44px。verification.json與回歸JSON已更新為這次最終產物；ci-tests.tap保留runner實際98/98輸出。

| 尺寸／步驟 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面節錄入口 | [before-desktop-entry.jpg](before-desktop-entry.jpg) | [after-desktop-entry.jpg](after-desktop-entry.jpg) |
| 390手機節錄入口 | [before-mobile-entry.jpg](before-mobile-entry.jpg) | [after-mobile-entry.jpg](after-mobile-entry.jpg) |
| 320手機限制節錄 | [before-small-mobile-entry.jpg](before-small-mobile-entry.jpg) | [after-small-mobile-entry.jpg](after-small-mobile-entry.jpg) · [往下讀與操作](after-small-mobile-action.jpg) |
| 桌面命中位置 | [before-desktop-location.jpg](before-desktop-location.jpg) | [after-desktop-location.jpg](after-desktop-location.jpg) |
| 390手機命中位置 | [before-mobile-location.jpg](before-mobile-location.jpg) | [after-mobile-location.jpg](after-mobile-location.jpg) |
| 320手機命中位置 | [before-small-mobile-location.jpg](before-small-mobile-location.jpg) | [after-small-mobile-location.jpg](after-small-mobile-location.jpg) |

上表節錄入口的before/after取自同一最終runner，正式站當時仍為基準reader；定位before沿用較早正式站原圖。320px的較長限制段需要捲動，兩張畫面保留上下文，未用CSS截斷原文或節錄。主整合者已目視，獨立視覺判定可合併、無剩餘必修。產品資產共增加4185 bytes（未壓縮），不是載入提速主張。

## 合併與 Pages 建置

獨立角色最終判定可合併，無剩餘必修；已完整目視桌面／390／320節錄與原段定位，並核對98單元、45次主要axe及原始JSON。依授權以非強推merge整合為8ed7258；獨立比對產品、tests、workflow與f7c476d完全一致，沒有覆蓋原工作樹兩個未提交修改。沒有開PR（EMU限制），不是PR合併。

[Pages39327059373](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39327059373)正式Jekyll建置與部署全部成功；公開HTML、app.js、reader.js、reader.css皆HTTP200且逐byte等於合併提交，SHA256見published-assets.json。正式瀏覽器流程39327060863的失敗與後續有診斷補驗見下方，沒有把原run改記為成功。


變更檔案：`assets/reader.js`、`assets/reader.css`、`tests/search-passage.test.cjs`、`tests/reader-context-round.cjs`、`.github/workflows/reader-context-round.yml`、`SITE.md`及本目錄證據。原始案例、來源、目錄、首頁與`assets/app.js`均未修改。


## 原正式驗收失敗：保留，不改寫為成功

8ed7258的Pages部署和公開資產均成功，但不等於全背景QA全綠：

- [本輪39327060863](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39327060863)：整合預覽四套全過；正式desktop與390完成，320的UC001已完成、接著UC028入站的完整載入斷言失敗（loaded欄位每次入站覆寫，不能說成320第一次就失敗）。合計完成5次axe且0違規，Firefox/WebKit該次正式尚未執行；原始published-original-partial.json保留缺項名單。
- [Evidence39327060689](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39327060689)：預覽全過、正式review-sections五配置完成；接續舊reader-search在390的第二個無q『?case=UC024』等待detail10秒逾時，不是前一個帶no-original-match的網址。見context-published-original-partial.json。
- [Improvement39327060697](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39327060697)：預覽六配置全過，正式390在讀UC359、刻意暫停來源釋放後進入部分來源未載入狀態，而原斷言要求全庫已載入。見early-published-original-partial.json。
- [Method39327060802](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39327060802)：公開reader資產完全一致，但UC338直接連結等detail60秒逾時。原log可於該run下載。

後三個失敗階段皆無q，節錄helper不執行；app.js也未變。但原產物缺HTTP/缺項時序，不能僅憑此確定根因、宣稱網路抖動或已修好。本輪另有診斷補證，原失敗仍保留。

診斷分支verify/search-passage-release（8ef3dd7，未合併main）只加網路與當場狀態、截圖及hold時序；原功能斷言與10/60秒逾時皆保留。新流程仍五配置；三套舊失敗只補Chromium390，每項一次，沒有自動重試。獨立角色確認不削弱斷言；正式補證結果見下方。


## 正式補證與結案

[有診斷補驗39328468003](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39328468003)驗證8ef3dd7（產品與main8ed7258完全相同），各情境一次、沒有自動重試，全部成功：

- 正式新流程：Chromium1440/390/320、Firefox390、WebKit390五配置，皆357筆／零缺項，10次axe零違規；搜尋、組合篩選、空結果、定位、直鏈重新整理與返回、否定、Unicode、原文完整性與44px控制均保留原斷言。原始結果published-verification.json。
- 原context、early、method三套：只重播原失敗Chromium390配置，保留原10秒、60秒與完整載入文字斷言，各一次成功，不冒稱又跑全部尺寸。context-published-replay.json、early-published-replay.json及method-published-replay.json。
- 所有捕捉到的第一方主文件皆HTTP200、含預期detail HTML，沒有pageerror或requestfailed事件；200/304來源讀取與原測試UC-005受控來源503另列於publication-diagnostic-summary.json。完整逐請求紀錄見該run的release-diagnostic artifact，repo摘要有明示節錄範圍，未稱為完整網路log。
- 正常流程在context.close後才browser.close，所以末尾snapshot為空；本次無失敗，不能將空snapshot當作拿到了歷史失敗當場資料。歷史四次原因仍未確定，本次成功不等於已修復它們；不據此改產品或放寬QA。

公開實圖：[桌面節錄](published-desktop-entry.jpg) · [390節錄與定位入口](published-mobile-entry.jpg) · [320原段焦點](published-small-mobile-location.jpg)。這些取自正式HTTPS網站；前述同runner前後圖仍保留以便比較。公開資產與部署成功證據亦保留。

76b63de為初版診斷（未合併、產品不變）亦成功，但逐response寫JSON可能干擾期限，因此結論只採每秒buffer的8ef3dd7。補證分支不合併main，避免將臨時診斷帶入產品。最後僅補文書與證據，不改產品。四次原正式QA失敗仍留在GitHub及本紀錄，不聲稱全背景綠燈。
