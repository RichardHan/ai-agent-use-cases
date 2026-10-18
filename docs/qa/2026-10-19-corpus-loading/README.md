# 2026-10-19：載入看得見，也能先讀已完成內容

## 問題與本輪選擇

目標讀者是第一次開啟網站、透過分享搜尋或案例直鏈進站的人。正式站雲端走查確認每次開頁發出345次請求，其中337次為Markdown，解析成339筆條目；有一個來源一直pending就會讓整庫無法進入可探索狀態。固定基準`c4437dd`的受控實驗讓336個來源完成、1個永不回應，桌面1440、390及320px均停在「正在準備案例卡」，沒有進度或先讀入口。

比較兩案後採B：

| 方案 | 適用情境與效益 | 取捨與成本 |
| --- | --- | --- |
| A：單一全文快照與原檔fallback | 降低首訪數百次請求 | 中高；須改內容發布流程，避免直接push同名內容後仍讀到舊快照。沒有以路徑、大小或日期假裝內容雜湊 |
| B：整輪期限、真實進度與部分內容入口 | 來源緩慢或失敗時仍可開始閱讀 | 中低；保留自動收錄與既有重試。本輪採用，但首訪仍讀全部來源 |

預期改善是避免無限等待、如實解釋搜尋涵蓋範圍，讓讀者選擇先閱讀及補回缺項；不宣稱真人喜好、轉換率或一般網路速度已提升。本輪不改原始案例、合格計數、同義詞、品牌、框架、部署方式或加入儲存／追蹤／第三方前端服務。

## 驗收標準與實作

1. 目錄、顯示文案、來源全文及response body均受取消訊號保護。初次網路讀取共用20秒期限；catalog最多8秒、非必要copy最多2.5秒、單來源最多12秒。期限是瀏覽器計時器的處理界線，不是硬即時保證；解析、排版及背景分頁排程另有成本。
2. 顯示已處理／總來源及成功來源數；以來源檔計，不把一檔多筆pending當多次請求。開始及每四分之一進度低頻公告，不在aria-busy祖先內反覆公告337次。
3. 有成功條目才啟用「先看已讀取內容」。選擇後取消未完成與未排程讀取，保留已完成原文；未完成路徑進入原有partial-load提示與補讀。
4. 部分搜尋、篩選、統計明示只涵蓋已讀取內容；補讀只請求缺項，依來源路徑合併，成功內容不重複計數。補讀另有20秒整輪期限。
5. 載入期間可改搜尋；保留分享網址未變動的情境及工具等篩選。載入中、成功及失敗的結果狀態區分，失敗後不會誤稱仍在載入。
6. 缺失案例直鏈可先到復原區，補讀後開啟原案例；搜尋、空結果、長文、來源、重新整理、返回及鍵盤流程維持。
7. 跳到部分結果時焦點及視窗位置都可見；兩frame內校正會被新輸入、新焦點、新網址或modal取消，避免覆蓋讀者的新操作。

## 環境與基準

- repo與origin/main起點均`c4437dd`，乾淨工作目錄，無開啟PR。另兩個協作者工作樹保持原狀，使用獨立分支`feat/corpus-loading`；我為單一整合者，獨立角色未編輯實作。
- repo與祖先未找到適用AGENTS.md；沿用README、SITE.md及前輪閱讀／返回QA紀錄。
- 本機設定檔為`gpt-6.1-sol`／`medium`，無法驗證或切換主回合實際模型與推理。未改個人設定，未宣稱已使用最強主模型。架構與獨立審查明確透過本回合可用工具指定`gpt-6-astra`／`ultra`；沒有另行付費API或購買credits。[OpenAI官方設定參考](https://learn.chatgpt.com/docs/config-file/config-reference)
- 未操作桌面應用程式或本機瀏覽器。瀏覽器、axe及套件安裝均在已授權GitHub runner。repo檔案、git與Node純程式測試使用既有shell工具。
- 基準既有測試41/41通過，JS syntax及Python預覽通過。沒有npm build、獨立lint或TypeScript配置；靜態預覽不是正式Jekyll部署。
- 新測試先在舊版重現：4項中3項因等待無界失敗，[原始輸出](red-tests.txt)。修後新增4項與既有測試合計45/45通過，[輸出](unit-tests.txt)。

## 實際走查與審查

正式站基準完整走查包含：①旅遊＋生活＋Grok Bot、鍵盤開關與返回；②空結果與重設；③UC-313失敗紀錄直鏈、重新整理、原限制與外部來源。1440及390px均339筆、0缺項、無pageerror；兩次axe零違規，GitHub來源popup HTTP200。[基準雲端紀錄](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39152650980)。該run後續新版測試因fieldset測試方式失敗，不把整個run當成功；基準步驟與JSON完整保留。

第一輪正式站腳本因axe使用implicit browser context失敗，改為explicit context後重跑。測試亦修正Resource Timing預設250筆容量、兩批逾時請求數與fieldset的disabled檢查。未以重試或弱化驗收掩蓋實作問題。

獨立review使用未參與實作的角色，發現並修正：載入中編輯會丟失分享篩選、載入／失敗的假0筆或假仍讀取、busy祖先阻擋公告、進度區隱藏與焦點時序、正式站實際資產與checkout比對。另雲端加嚴rect檢查確實發現結果焦點在視窗外，補兩frame守衛後另驗，不宣稱已確證瀏覽器內部時序根因。

## 執行指令

```sh
node --test tests/*.test.cjs
for file in assets/*.js; do node --check "$file"; done
python3 scripts/preview.py /tmp/loading-preview/ai-agent-use-cases
python3 -m http.server 8087 --directory /tmp/loading-preview
# 在已授權、已安裝Playwright的雲端環境：
BUDGET_URL=http://127.0.0.1:8087/ai-agent-use-cases/ node tests/loading-budget-browser.cjs
CORPUS_URL=http://127.0.0.1:8087/ai-agent-use-cases/ CORPUS_LABEL=after node tests/corpus-browser.cjs
```

既有reader、discovery、reading-flow、related、search-context及load-recovery瀏覽器套件也納入本輪專用workflow。正式發布驗收先等待5個執行資產與checkout逐字一致，再核對瀏覽器實際收到的版本，不以push成功當作已部署。

## 限制與下一輪

自動axe不等於完整無障礙認證；尚未測實體手機、螢幕閱讀器公告實聽、背景分頁節流或真人偏好。受控來源永不回應是故障注入，不宣稱正式站每次都會卡住。20秒期限可能在慢網路下先顯示部分內容，讀者可補讀；正常首次載入仍有337個全文請求。

下一輪最值得做：以部署revision管理完整全文回訪快取，新部署自動失效、儲存不可用時回原loader，先改善回訪成本；若要降低冷啟動請求，應先解決單一全文快照與自動發布的一致性。

最終跨瀏覽器、截圖與正式部署結果見下方。

## 最終預覽驗收

[最終完整QA 39153415053](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39153415053)驗證執行資產版本`012287b`，全部成功；前一個完整候選`790c279`亦全綠。最終截圖已採用修正後的里程文案，沒有兩組不一致的精確數字。

| 檢查 | 實際結果 |
| --- | --- |
| Node單元、JS syntax、靜態預覽 | 45/45、語法全過、產生有效索引 |
| 尺寸與引擎 | Chromium 1440×1000、390×844、320×740；Firefox及WebKit 390×844 |
| 真實來源故障注入 | 336/337來源已完成時可先閱讀338筆；補讀只新增1次Markdown請求，回復339筆 |
| 整輪逾時 | Chromium20,493ms、Firefox20,606ms、WebKit20,107ms進入可重試狀態；各僅送出32個來源請求，未排程來源可於重試補回 |
| 缺失直鏈 | 三引擎約12.5–13.0秒提供部分內容，補讀後開啟UC-001 |
| 目錄與文案 | catalog卡住約8.0–8.5秒進入錯誤，可修改搜尋再重試；copy卡住約3.2–3.5秒後以原文完成載入 |
| 鍵盤 | 搜尋載入中保留URL情境／工具；先讀、補讀及返回焦點可見，五組結果焦點y約371–501px、高約21px |
| 新增axe檢查 | 等待／補回10次，加正常詳情2次，共12次零違規；既有套件另有其掃描 |
| 既有六套回歸 | reader、discovery、reading-flow、related、search-context、load-recovery全部通過，涵蓋長文、來源、分享、錯誤與空結果 |
| 內容完整性 | 閱讀回歸仍逐筆核對339筆來源；193筆提前呈現完整原段、146筆保留全文入口，未改案例或證據分類 |
| 正常預覽觀測 | 1440／390px就緒約797／621ms，仍345次請求、337次Markdown，均339筆／0缺項／無pageerror；這是同站雲端預覽，不能與正式站跨主機數值當成加速比較 |

原始資料：[故障與焦點](verification.json)、[三情境與資源](preview-journeys.json)、[原站基準](live-baseline.json)、[閱讀回歸](reading-regression.json)、[完整CI](preview-ci.json)。前端三檔新增未壓縮6,051 bytes，非網路傳輸量；[各檔尺寸](asset-sizes.json)。沒有捏造效能分數。

| 尺寸 | 修改前，相同一個來源卡住 | 修改後，可見進度與先讀入口 |
| --- | --- | --- |
| 桌面1440px | [before-desktop.png](before-desktop.png) | [after-desktop.png](after-desktop.png) |
| 手機390px | [before-mobile.png](before-mobile.png) | [after-mobile.png](after-mobile.png) |

另附[320px](after-small-mobile.png)、[手機部分結果與補讀](partial-mobile.png)、[正常桌面首頁](home-desktop.png)、[正常手機首頁](home-mobile.png)、[手機詳情](detail-mobile.png)。圖片均為雲端瀏覽器真實截圖，非設計示意圖。

獨立角色已比較桌面、390及320前後圖與部分載入圖，未見溢出、遮蔽或焦點裁切；未冒稱真人研究。架構、程式、安全、取消路徑及視覺複查均沒有剩餘阻擋問題。

收尾只調整QA：來源總數改從受測站catalog計算、pending條目從受測原文計算，避免新增案例或舊版比較時因寫死數字誤報；main的專用job重驗整合後loader及正式站，分支已通過的六套完整預覽不重複執行，既有其他main workflow保持原狀。此新測試取得方式將由合併後job再實際驗證。

GitHub CLI受企業受管帳號限制，建立PR回應Unauthorized；個人SSH可正常push。依本次明確授權，在獨立審查後直接merge與push，不冒稱有PR審核。正式Jekyll發布與實際資產核對將另附於下方。

收尾QA分流與動態計數已由獨立角色只讀審查，Node語法與YAML解析通過；最終桌面／390／320圖也已再檢視，里程文字正確且沒有溢出。
