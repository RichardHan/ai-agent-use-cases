# 發布版本的原始 Markdown 連結

正式站 1280／390px 開啟 `?q=旅遊&case=UC-110#explore`，來源連到可變的 `blob/main`，詳情只能提醒原文可能漂移。對照同一篇收錄內容，讓想核對方法與限制的訪客能開啟與發布來源相同的 Git commit，而非後來的 main。

- A（採用）：Pages 建置時將 `site.github.build_revision` 同時寫入 catalog 與 corpus；確認整包 revision 及 commit 一致後，逐篇固定 GitHub 原始 Markdown 和正文相對連結。提前讀到的直鏈內容另與整包原文逐字比對，匹配才更新既有詳情連結與提示；逐檔載入／復原或不匹配時維持 `main` 漂移提醒。成本：兩個資料欄位、連結處理及回歸；不修改原始案例。
- B：另產生本站的不可變 Markdown 快照。可獨立於 GitHub metadata，但會複製大量原文並增加發布維護成本。本輪不做內容真偽重新驗證、外站連結快照或整站搜尋重排。

驗收：有效 SHA 的直鏈及相對原文連結固定在同一 commit；無效／缺少 SHA 不誤稱固定；手機與桌面詳情可讀、無水平溢出；搜尋與組合篩選、空結果、詳情直鏈重載、Escape 返回保持可用。發布後仍須核實 Pages 真正產出的 `sourceRevision`，本機預覽不會執行 Jekyll metadata。

| 視口 | 修改前正式站 | 修改後本地預覽（SHA 注入測試狀態） |
|---|---|---|
| 1280×800 | [原始 main 提醒](../2026-10-26-pinned-source-before-desktop.png) | [固定版本提示](../2026-10-26-pinned-source-after-desktop.png) |
| 390×844 | [原始 main 提醒](../2026-10-26-pinned-source-before-mobile.png) | [固定版本提示](../2026-10-26-pinned-source-after-mobile.png) |

後圖是攔截本地預覽的 catalog 與 corpus，兩者注入測試 SHA `aaaaaaaa…` 後實際讀取 UC-110；**不是已發布版本或真實 GitHub commit**。截圖驗證資料載入、提前直鏈比對與 UI 狀態；普通本地預覽沒有 `sourceRevision`，仍顯示 main 漂移提醒，不假裝已固定。

預覽：`python3 scripts/preview.py /tmp/visitor-reader-trust/ai-agent-use-cases && python3 -m http.server 8766 --directory /tmp/visitor-reader-trust`，開啟 `http://127.0.0.1:8766/ai-agent-use-cases/?q=旅遊&case=UC-110#explore`。基準 `node --test tests/*.test.cjs` 354 pass；新回歸先紅（缺 `setSourceRevision`），審查後補充版本不符、提前直鏈及逐篇復原測試，最終 356 pass／0 fail。`node --test tests/source-links.test.cjs tests/corpus-bundle.test.cjs` 25 pass；`for f in assets/*.js tests/*.cjs; do node --check "$f" || exit 1; done` 通過；`python3 scripts/check_corpus_bundle.py /tmp/visitor-reader-trust/ai-agent-use-cases` 450 個來源逐 byte 一致。本機沒有 Gemfile，`bundle exec jekyll --version` 無法執行，因此未聲稱 Jekyll 建置成功。

三種模擬走查：① 搜尋旅遊／生活顯示 20／452，開 UC-001 來源後 Escape 返回保留查詢與情境；② 無效詞顯示 0／452 並有空狀態；③ 直接開 UC-110 並重載，核對來源版本提示。這些只是流程檢查，不代表真人偏好。合併 PR #127 後 Pages build `913cc3a` 成功；正式 `catalog.json`／`corpus.json` 皆為 `sourceRevision=913cc3a053f63247d1c1ca46c31a9b96e2f6a213`、相同 bundle revision，450 筆來源。正式站 UC-001 直鏈在 `discoveryReady` 後來源 href 為 `blob/913cc3a…/cases/001-travel-checkout.md`，桌面／手機 UC-110 刷新後亦固定；Escape 返回仍保留條件，無橫向溢出。Reader controls QA #40232071520 因歷史 baseline 缺 `corpus.json` 失敗；PR #128 修正後 #40233637930 的 baseline 與六組 controls（Chromium／Firefox／WebKit）均通過，含 axe 零違規，接續在既有 `reader-browser.cjs:192` 閱讀錨定可見性斷言失敗。此非來源固定斷言；其他主分支瀏覽器 Actions 亦有失敗，不能宣稱全綠。下一輪優先定位閱讀錨定與其他瀏覽器工作的共同失敗原因。
