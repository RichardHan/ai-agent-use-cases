# 原文清單階層：讓步驟保留所屬限制

## 證據、兩案與驗收

正式站基準 [39703316577](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39703316577) 在1440×1000及390×844實走首頁、旅遊＋生活（17筆）、UC-001詳情、外部來源新頁、Escape返回原卡焦點、空結果編輯、直鏈與重新整理。pageerror空，兩次axe零違規。截圖與實走不是真人喜好或留存證據。

UC-001原文的「訂假期機票」下有三項子紀錄，「本庫判讀」限定下有四項建議；原renderer丟棄縮排，將子項掛到頂層，讀者難以辨認這些步驟屬於哪個版本與限定。全庫掃描75檔、480行縮排清單（見checks/corpus.json；這是語法候選計數，不是新案例數）。目標讀者是需要比較方法、來源與限制的新訪客及長文讀者。

- A：只加視覺縮排，成本低，但DOM及輔助工具仍無父子關係。
- B（採用）：以原縮排建立真正的ul/ol/li，並讓搜尋逐項取得自身文字及定位目標；成本稍高，可保留閱讀語意。

驗收：UC-001四步驟位於原限定父項內；混合清單、同級返回、編號及文字／連結保留；搜尋定位到子項，不跨父子拼詞；桌面、390／320px不溢出；來源、導覽、空結果、組合篩選、直鏈重整、返回焦點與列印既有流程不退化。

不處理：原始案例／證據／計數、難度推估、搜尋排序、跨篇續讀、完整CommonMark支援、框架與品牌。清單間空行仍延續原parser的區塊分隔規則；現庫縮排清單均連續，無跨空行父子。沒有新產品依賴、追蹤器、cookie、登入、儲存或第三方資料傳送。

## 環境與保留

起始遠端main為61acdae。原工作目錄分支improve/search-recall-recent-workflows-and-tokenization的assets/app.js與tests/search.test.cjs兩筆未提交修改保留；在/tmp/ai-round-20261022建立獨立工作樹與分支。讀過README、歷史維護、SITE、Jekyll/catalog/preview與近期QA；repo及祖先無適用AGENTS.md。研究PR #75期間由協作者合併，已安全合入最新b07b900，沒有衝突、reset或強推。

可讀本機預設為gpt-6.1-sol／medium，不能證明主對話runtime，工具無法切換主對話或證明帳號最高可用模型。使用OpenAI Docs確認設定意義（[官方設定說明](https://learn.chatgpt.com/docs/developer-settings)）。獨立設計／審查明確請求gpt-6-astra／ultra，仍不冒稱runtime稽核。主角色唯一修改與整合；獨立角色唯讀。只使用授權檔案、Git及既有訂閱／GitHub Actions；所有瀏覽器在GitHub-hosted runner執行，未控制個人桌面或啟動本機瀏覽器。

## 實作與可重現檢查

- assets/app.js：原安全文字渲染器加入清單堆疊，依縮排掛到父li，出棧回同級；保留來源編號及續行，標題／空行／引文／程式碼切斷清單。
- assets/reader.js：逐個收集li自身文字，子項各自成為搜尋定位目標，避免父子文字相接產生假命中；先讀區仍完整clone原區塊，複製提示詞仍讀原Markdown。
- assets/reader.css：原文及先讀區使用1.5em清單縮排，為手機閱讀保留行寬；沿用色彩，未引入新文字對比。
- tests/markdown-lists.test.cjs：先以舊renderer重現，再修正；原版六項中五項預期ERR_ASSERTION失敗、一項通過，沒有把TypeError算為重現。
- tests/markdown-lists-browser.cjs與Reader round QA：真實前後截圖、文字hash／清單條目完整比對、三引擎五配置、巢狀命中定位、三情境及axe；另跑既有reader回歸。

指令：`node --test tests/*.test.cjs`、`node --test tests/markdown-lists.test.cjs`、`for file in assets/*.js tests/*.cjs; do node --check "$file"; done`、`git diff --check`、`python3 scripts/preview.py <output>/ai-agent-use-cases`。基準154／154；補修後161／161。原始結果在checks。沒有獨立lint、TypeScript或npm build設定；preview不等同正式Jekyll，發布另驗Pages。

預覽：`python3 scripts/preview.py /tmp/list-preview/ai-agent-use-cases`，再`python3 -m http.server 8151 --directory /tmp/list-preview`；開啟`http://127.0.0.1:8151/ai-agent-use-cases/?q=旅遊&scenario=生活&case=UC-001`並展開原始研究。

未驗證實體手機、真人留存／轉換率、完整螢幕閱讀器或完整CommonMark一致性；axe不等同完整WCAG認證。下一輪建議：比較不同案例後返回原閱讀段落，避免長文被強制帶回篇首。

## 雲端前後與獨立審查

首輪完整雲端 [39703707778](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39703707778) success：三引擎五配置（Chromium1440／390／320、Firefox390、WebKit390），15次axe零違規、pageerror空、38個li完整保留、UC-001文字hash相同；各尺寸四子項屬原父項，巢狀搜尋定位正確，沒有水平溢出。另完整既有reader及兩尺寸走查通過。這一輪是續文節錄補修前版本，最終結果另列，不把它當最終提交驗收。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440 | [父子清單分離](before/lists-chromium-1440.png) | [步驟歸屬原限定](after/lists-chromium-1440.png) |
| 手機390 | [同層原文](before/lists-chromium-390.png) | [保留父子階層](after/lists-chromium-390.png) |
| 小手機320 | 基準未另截320 | [窄螢幕閱讀](after/lists-chromium-320.png) |

三個模擬情境：從旅遊＋生活閱讀作者限制，鍵盤段落導覽後返回；搜尋子項「申請類工作」定位到原li並看父項脈絡；分享直鏈重整、長文、空結果復原、來源及原生Back回原卡。基準來源另實際開啟新頁，不宣稱全庫外站長期公開。模擬不是訪客轉換或真人喜好證據。

獨立角色未參與主要實作，發現一項P2：父項在子清單前後的自身文字不可拼成連續引文；已依childNodes順序分段並新增第161項回歸測試。其獨立跑161項全過，另比對413檔與1809個連結完整。安全文字節點、先讀clone、Markdown複製及原研究列印路徑未見新增阻擋。完整性另由checks/corpus-oracle.cjs支持，不將單篇瀏覽器hash當全庫瀏覽器驗證。

補修重跑 [39704000212](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39704000212) 的WebKit在快速連續導航／重新整理時，背景全文fetch出現access-control pageerror而失敗；前四配置通過。已讓各情境在全文完成後才開始下一次導航，仍保留所有pageerror檢查，不排除錯誤或宣稱該次全綠。背景讀取與錯誤復原另由既有reader回歸覆蓋。

三個資產未壓縮增加1702 bytes，gzip本機估算增加532 bytes，無新請求；不是實際網路延遲或Lighthouse分數。色彩沿用；axe涵蓋自動化文字對比檢查。尚未做本輪新實體紙本列印驗收。

獨立目視終審已比對前後1440／390與新版320五張圖，父項／子步驟層級清楚，手機行寬可讀、無截字、橫向溢出或工具列碰撞。窄螢幕第4步需要正常垂直捲動，不是內容遺失。讀取完成後才進下一情境是本輪完成閱讀流程的驗收邊界，不代表修復WebKit快速重整／中途離站的背景請求觀察；根因未確認，保留checks/webkit-observation.log供後續調查。下一輪優先釐清這項真實觀察，再評估跨篇續讀。

最終補修提交1baeda1的 [39704317365](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39704317365) 全套success：161／161、靜態preview、三引擎五配置、15次axe零違規、pageerror空、文字hash／38個li及四子項歸屬正確；完整既有reader回歸與兩尺寸完整走查亦通過。已將after截圖換成這次最終圖；[最終專項](checks/final-preview.json)、[雲端單元](checks/cloud-unit.tap)、[reader摘要](checks/final-reader-summary.log)。完整artifact保留在該run。模擬情境、載入完成邊界及未解WebKit觀察如上。
