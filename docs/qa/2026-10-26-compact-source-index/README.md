# 長篇來源索引按段展開（2026-10-26）

目標讀者：從問題搜尋進入長篇案例，想先定位原文連結與限制、再核對上下文的首次訪客。正式站 UC-054 展開「逐段核對連結與限制」後，390px 的 17 段索引高 3,769px，連結與段落跳轉全部平鋪；手機需要反覆捲動。方案 A（採用）：8 段以上先列原段落標題和連結數，逐段展開原本的跳轉與連結；查找字詞時自動展開命中段。成本是多一次點擊。方案 B：保留平鋪、加定位捷徑，操作較少但長索引密度不變。不推斷連結可信度。

驗收：UC-054 的 17 段仍依原序、連結網址與標籤不變；零結果、清除、Back 後展開段落與查找字詞、鍵盤 Enter、UC-024 短索引、外鏈新分頁及原文限制都正常。桌面與 390／320px 無橫向溢出，axe WCAG 2/2.1 AA 零違規。搜尋＋情境、空結果、詳情直鏈重整、來源與返回走查。只改索引呈現，不更改案例、證據標籤、搜尋語意或 PR #145 的歷史。

| 尺寸 | 正式站修改前 | 本地預覽修改後 |
| --- | --- | --- |
| 390px | [修改前](before-mobile.png) | [修改後](after-mobile.png) |
| 1440px | [修改前](before-desktop.png) | [修改後](after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-density-preview/ai-agent-use-cases && python3 -m http.server 18998 --directory /tmp/visitor-density-preview`，開啟 `http://127.0.0.1:18998/ai-agent-use-cases/?case=UC-054` 並展開「逐段核對連結與限制」。390px 索引高由正式站 3,769px 降至本地 1,910px；正式站和預覽的發布 SHA 不同，不把預覽來源版本當正式部署。

先紅後綠：新增長索引 disclosure 斷言在原版為 `0 !== 17`。`NODE_PATH=/tmp/visitor-method-deps/node_modules REVIEW_URL=http://127.0.0.1:18998/ai-agent-use-cases/ REVIEW_OUTPUT=/tmp/visitor-density-final node tests/review-sections-browser.cjs` 在 Chromium 1440／390／320、Firefox 390、WebKit 390 全通過，各視口三次 axe 稽核零違規。`node --test tests/*.test.cjs` 362 通過；所有 JS `node --check` 成功；`python3 scripts/check_corpus_bundle.py /tmp/visitor-density-preview/ai-agent-use-cases` 核對 452 來源逐 byte 一致。專案沒有獨立 lint/type/npm build；GitHub Pages 使用 main 的 Jekyll，預覽不是 Jekyll build。

獨立審查發現未搜尋時展開一段後 Back 會收起；已把每段展開狀態納入同一閱讀 visit 快照並加入回歸，修後五組瀏覽器走查通過。三情境：旅遊＋生活篩選進 UC-001 回結果；UC-024 原文 Reddit 新分頁與限制；UC-054 查網域、無結果清除、展開段落後切案例再 Back。這些是模擬檢查，不代表真人偏好。正式 Pages 新 SHA、公開 QA 和效能尚待部署後核對；下一輪優先處理來源角色的人工核對，不自動分類可信度。
