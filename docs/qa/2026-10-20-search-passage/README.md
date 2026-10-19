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

上表節錄入口的before/after取自同一最終runner，正式站當時仍為基準reader；定位before沿用較早正式站原圖。320px的較長限制段需要捲動，兩張畫面保留上下文，未用CSS截斷原文或節錄。主整合者已目視，獨立視覺判定另補。產品資產共增加4185 bytes（未壓縮），不是載入提速主張。
