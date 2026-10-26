# 長篇原文來源索引查找（2026-10-26）

目標讀者：從搜尋進入長篇案例、需要核對特定來源或限制的首次訪客。正式站 UC-054 在 390px 展開「逐段核對連結與限制」後有 17 段、24 個連結，索引約 3,666px 高；只能逐段捲動找網域或段名。

- 方案 A（採用）：在至少 8 段的既有索引內按原段落標題、連結文字及網域查找，顯示命中段數、零結果與清除入口。只隱藏索引列，清除後全數恢復；原始研究與網址不變。成本是多一個輸入控制。
- 方案 B：按來源種類分組或折疊。原文並無一致的連結角色欄位，推斷種類會暗示未經核實的證據等級，且增加鍵盤展開層級，故不採用。

驗收：UC-054 以 `youtube.com` 查到一段，零結果明確回饋，清除恢復 17 段與全部網址並返回輸入焦點；UC-024 的短索引不增添查找控制。手機／桌面不橫向溢出；搜尋＋情境篩選、空結果、直鏈重整、來源新分頁、返回與原文保真維持。網站總條目與嚴格合格數不混同。不更動案例內容、證據判斷、主搜尋語意或 PR #145 的搜尋歷史。

| 尺寸 | 正式站修改前 | 本地預覽修改後 |
| --- | --- | --- |
| 390px | [前](before-mobile.webp) | [後](after-mobile.webp) |
| 1440px | [前](before-desktop.webp) | [後](after-desktop.webp) |

預覽：`python3 scripts/preview.py /tmp/ai-usecase-round-preview && python3 -m http.server 8088 --directory /tmp/ai-usecase-round-preview`，開啟 `http://127.0.0.1:8088/?case=UC-054`，展開「逐段核對連結與限制」。預覽模擬 Liquid，不等同正式 Pages 建置。

基準：`node --test tests/*.test.cjs` 為 362 pass、0 fail；`python3 scripts/preview.py /tmp/ai-usecase-round-preview` 成功。修改前實際瀏覽器斷言找不到 `.reader-review-find`；首次實作將 finder 插在尚未接入 DOM 的清單前，瀏覽器回歸紅燈，修正掛載順序後通過。獨立審查另指出空 live region 被 CSS 隱藏、返回閱讀後查找字詞遺失；移除隱藏規則並納入既有 visit 快照，新增 Back 回歸。首次快照測試以動態補載前後相同命中筆數斷言而失敗，改為檢查字詞、展開與每個可見命中仍相符後，最終 `NODE_PATH=/tmp/visitor-method-deps/node_modules REVIEW_URL=http://127.0.0.1:8088/ REVIEW_OUTPUT=/tmp/visitor-source-lookup node tests/review-sections-browser.cjs` 在 Chromium 1440／390／320、Firefox 390、WebKit 390 全部 `complete: true`；各配置三次 axe WCAG 2/2.1 AA 零違規。`python3 scripts/check_corpus_bundle.py /tmp/ai-usecase-round-preview` 核對 452 份來源逐 byte 一致。獨立複審接受。正式站驗收及 Actions 狀態需在部署後另核對。

未解決：連結角色仍須讀原文上下文辨識；整包載入與 CI 瀏覽器工具安裝可能受網路／runner 影響。下一輪優先以原始證據校準連結角色，不自動推斷可信度。
