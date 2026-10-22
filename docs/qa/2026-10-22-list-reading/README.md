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
