# 2026-11-07 首頁證據說明

基準 `108b31537da2f64399b0b06df353c2f21ebdb36a`；原工作樹有未提交修改，本輪使用隔離 worktree。正式站：https://richardhan.github.io/ai-agent-use-cases/ ；Actions：https://github.com/RichardHan/ai-agent-use-cases/actions 。

正式站首頁聲稱不同證據類型「嚴格分離」，但 README 說明同一案例可能混合多個來源，頁首標籤不能套用到每項主張。本輪將首頁承諾改為頁首來源標示及逐段核對主張與驗證狀態；不改案例分類或聲稱獨立驗證。

隔離版本 `node --test tests/*.test.cjs`：396 通過、0 失敗；`node --check assets/app.js` 通過。`SITE_URL=http://127.0.0.1:8765/ai-agent-use-cases/ QA_OUT=/tmp/round-evidence-context node tests/page-context-browser.cjs` 通過 Chromium 1440／390／320、Firefox 390、WebKit 390，涵蓋搜尋、篩選、空結果、詳情、來源、直鏈與鍵盤焦點；截圖位於 `/tmp/round-evidence-context`。手機證據區文字寬度未溢出。此為模擬瀏覽器驗收，非使用者研究。

獨立審查未發現本次補丁缺陷；核對 `cases/030-interactive-study-guide.md` 可見官方範例、作者自述及本庫未實測流程共存。未逐案重核全庫或外部來源，尚需 PR 檢查與發布核對。

下一輪優先：逐案檢查混合來源案例的頁首分類與個別成果主張是否一致；先選一則含多來源的案例，對照原始來源逐段核對，不推定頁首標籤適用所有主張。
