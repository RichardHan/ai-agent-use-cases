# 2026-11-15：被新版取代後仍驗證生成 HTML 正文

## 基準與選擇

- 原工作樹 main `642c98de88fd4bc5f96f02710df99dcbfb3d0a8c` 乾淨；安全 fetch 後 origin/main `f7642514a93b6c10a217f507d4383da3103a2710`。GitHub 身分 RichardHan、預設 main、沒有開啟 PR；既有 worktrees 全保留。Orca 建立隔離 `RichardHan/release-html-20261115`，路徑 `/Users/richard_han/orca/workspaces/ai-agent-use-cases/release-html-20261115`。沒有 repo／父層 AGENTS.md；沿用 README、SITE、最新 manual-publication 紀錄、Website QA 與既有 Pages 流程。
- 本輪重新查 [main Actions](actions-baseline.json)，最新 Pages [43707663486](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43707663486) 對應基準成功；最近產品 [Website QA 43706477511](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43706477511) 對應 `c2b2492e…` 成功。docs-only 基準沒有觸發 Website QA，不宣稱同 SHA 跑過。Branch protection API 為未保護、rulesets 0，仍等 PR checks，不 bypass。
- 主 agent 實際為 `openai-codex/gpt-6-astra`。當次 model catalog 列出 `factory-droid/gpt-6.1-terra`／`litellm/gpt-6.1-terra`（low／medium／high／xhigh／max），`gemini3.8` 無結果，`gemini-3.8-flash` 有多 provider（low／medium／high），未證實使用者環境標籤對應。設定 `task.perCallModel=off`、`enableEffort=false`、`defaultThinkingLevel=auto`；未切換或另接付費通道，不宣稱指定模型或最高推理。find judge 帳戶拒絕，改用 grep/read；LSP references 回覆無可用 server。

目標使用者：依賴發布綠燈的維護者，以及透過本站索引／案例／稽核 HTML 閱讀內容的訪客。現行 superseded 發布只核對抽樣生成頁面的語言 metadata；即使正文過期，其他來源與位元正確仍可放行。三個真實 gate 故障注入（INDEX、案例、稽核 HTML）均 `Missing expected rejection`：[先紅證據](red-generated.txt)。這不是正式站已發生過期事故的證據。

兩案：①檢查少數標題／字串，便宜但漏驗正文；②從同 live revision 的可信 Pages artifact 核對完整頁面位元。選②，避免自行重建 Jekyll 或把 Markdown hash 當 HTML。

驗收：過期正文必須拒絕；後續版本正確的新 HTML 可通過；錯 workflow／branch／repo／SHA、未成功 run、過期或損壞 artifact、缺失／重複／連結成員均不提供成功證據；暫時下載失敗可在既有期限內恢復。原 exact、祖先、來源、刪除與瀏覽器檢查不放寬。

## 實作與界線

- `scripts/published-pages.cjs`：僅信任同 repo、main、同完整 SHA、`dynamic/pages/pages-build-deployment` 的成功 run；驗 artifact 的 run／SHA／SHA-256。GitHub token 僅送 GitHub API，不轉寄 signed object URL，不把 signed URL／回應內文印入錯誤。
- `scripts/pages-artifact.py`：用已存在的 Python 3 標準庫讀 ZIP→TAR，不 extract 到檔案系統、不執行產物；僅讀既有四頁及 catalog，拒絕不完整、重複或非普通檔，核對內嵌 sourceRevision。ZIP／TAR 64 MiB、單頁8 MiB上限，下載受 publication round signal及15秒限制，解碼另有10秒上限。
- `tests/published-version.cjs`：superseded 既有 ancestry／來源／audit 檢查後，以 artifact hash 核對完整四頁；成功結果依 revision 快取，下載失敗不快取。exact 仍比對本次 Jekyll build，無 artifact 依賴。沿用原60分鐘整體期限，不增加重試層。
- 新回歸 `tests/published-pages.test.cjs` 與 `tests/published-version.test.cjs`；`publication-gate.test.cjs` 補可信生成頁 fixture 契約，不減斷言。

覆蓋明確限制：仍是既有四頁 `index.html`、`INDEX.html`、`cases/001-travel-checkout.html`、`sources/qualification-audit-2026-10-16.html`，不是全部生成頁面。綁目前 GitHub 內建 Pages workflow；若部署遷移需更新信任規則。artifact 過期、API 無權限或下載不可用時不能證明新版頁面正確，保留失敗，不降級到語言標記。成功 artifact hash 快取依 SHA，這輪不支援同 SHA 重建產物更換的自動失效。未改 UI、案例、workflow 觸發或權限，沒有新增套件。

## 本機及實際發布資料驗證

- `node --test tests/*.test.cjs`：基準 **802 pass／0 fail** → 最終 **814 pass／0 fail／0 skip**：[基準](baseline-unit.txt)、[最終](final-unit.txt)。`node --test tests/published-pages.test.cjs tests/published-version.test.cjs tests/publication-gate.test.cjs`：82 pass／0 fail：[專項](focused-tests.txt)。
- `node --check scripts/published-pages.cjs`、`node --check tests/published-version.cjs` 成功。repo 沒有獨立 lint／type-check 指令，不把語法檢查當成兩者通過。
- `python3 scripts/preview.py /tmp/ai-html-preview/ai-agent-use-cases` 成功；`node scripts/check-published-surface.cjs`：833 檔／5.84 MiB／9排除通過。preview 不產生 Jekyll HTML；真正 build 由 PR Website QA 驗證。
- 主 agent 已用真 GitHub API、既有授權 token，執行整個 superseded gate：祖先 `c2b2492e…` → live `f7642514…`，run `43707663486`、artifact `14159172039`，SHA-256／catalog revision／四頁完整位元均通過，526來源核對，`status=matched, mode=superseded`：[實際輸出](real-superseded.txt)。比較範圍為該 docs-only push 的已知空發布變更；沒有冒稱覆蓋不存在的刪除。

## 訪客流程與視覺限制

正式站：<https://richardhan.github.io/ai-agent-use-cases/>。暫時本機預覽：<http://127.0.0.1:8183/ai-agent-use-cases/>。

`NODE_PATH=…/node_modules GITHUB_SHA=f7642514… node tests/deployed-browser.cjs` 正式基準 exit0：[日誌](baseline-browser.txt)、[桌面](baseline-desktop.png)、[手機](baseline-mobile.png)。包含搜尋、情境、分享詳情與重整、返回、組合空結果鍵盤復原、JS-disabled Jekyll 索引回退；局部 axe 掃描零違規，不等於全站認證。

主 agent Orca 實走1440×900：首頁「收件匣與郵件」→164筆→UC-014，成果主張／核讀與未實跑分開呈現；來源新分頁實際開啟固定 `f764…` GitHub原文，有 UC-014及未實跑限制；Escape返回保留查詢及原卡焦點。390×844：UC-014＋topic＋Cursor為零筆，Enter移除Cursor→1筆，q／scope保留、焦點results-count、無水平溢出：[手機復原](baseline-recovery-mobile.png)。

無 UI 變更，故沒有視覺改版前後成效主張。影像輸入工具被停用，保存截圖、操作與DOM／幾何證據，不宣稱逐像素目視、真機或讀屏實聽；這不是真人使用者研究。未做效能基準。

## 審查與發布接續

主 agent 唯一整合者；調查與獨立 reviewer 的交付會於收回核對後補記。PR checks、Pages、Website QA 各以25分鐘為外部等待上限，未完成不當通過，失敗先讀log，不無限重跑。合併及正式版證據於實際完成後補記。

最終整合預覽的1440×900／390×844三情境全部通過：[journeys.json](preview/journeys.json)、[桌面詳情](preview/desktop-detail.png)、[手機詳情](preview/mobile-detail.png)。首頁問題入口→UC-014→證據／未實跑→返回原卡焦點；實際選Cursor造成空結果→鍵盤移除單一工具條件保留q／scope；分享詳情→reload→固定版本來源HTTP200→展開長文→返回一筆結果。詳情scrollWidth/clientWidth：桌面918/918、手機368/368，pageerror均0。主agent也在Orca實際開啟同預覽詳情。

下一輪最值得做：以停用JS的瀏覽器從INDEX到UC-001，確認Jekyll備援頁的原文網址可點性與證據圖例；主已核對該頁原始HTML的原文URL為純文字。比較GFM自動連結與最小備援layout，不先改寫全庫。抽樣外生成HTML仍是已知有限覆蓋，不宣稱本輪已涵蓋全部HTML。

### 目前 Actions 與歷史失敗日誌

本輪主agent重新取得三次近期失敗的API與原始log ZIP：[SHA／步驟](failure-steps.jsonl)、[關鍵錯誤](failure-errors.txt)。43634859717／`2138f4d4…`在Chromium `refine-from-results-browser.cjs:96` 出現手機視口斷言 `false !== true`；42820349847／`2b139d9f…`在正式瀏覽器前等待3600002ms，index/app位元不同；42803248261／`8fbfe082…`的Pages成功，但發布gate等待3600002ms後 `Product asset mismatch`。前者是舊測試邊界，後兩者是舊版被取代後仍比較舊位元的歷史問題；目前後續綠燈與現行程式已區分exact／superseded，不把這三次當本輪新故障或新修成效。

Website QA對PR取消舊head、main保留裁決；Pages獨立建置，QA再比正式產物。沒有觀測權限／額度／快取事故，本輪不改concurrency、不一律整併workflow，保留既有瀏覽器容器與Node版本。新artifact下載沿用已授權的actions:read。

### 最終獨立審查

GeneratedPagesReview 複審 **correct／無P1/P2**：[完整結果](review-final.md)。初審將尚未提交的新檔不在git diff中誤報為遺漏，已撤回；主agent核對selective commit草稿包含兩個helper與新回歸檔，沒有為此改程式或放寬測試。完整內容、archive/token邊界、失敗快取、期限與既有exact分支均經獨立檢查；814單元、真實artifact與訪客證據由主實跑。此為agent獨立審查，不是人類GitHub approval。

### 分工回收與 PR

CurrentActionsAudit、VisitorFlowAudit、GeneratedPagesReview均已完成並由主核對；工具限制與不採用的推論見[回收紀錄](investigation-handoff.md)。尤其「無Website QA run」不等於「從未實走」，UC編號跳號不等於案例刪除，備援頁單一樣本也不外推全庫。

已提交／推送 `9c732a8742652495a216e23834687b54d5c253b1`，建立 [PR #412](https://github.com/RichardHan/ai-agent-use-cases/pull/412)，[審查收據](https://github.com/RichardHan/ai-agent-use-cases/pull/412#issuecomment-6893780815) 對應相同head。PR checks已啟動30秒間隔／25分鐘上限等待；完成前不宣稱通過。

### 合併與真正 Jekyll 建置

合併前再次核對head `9c732a8742652495a216e23834687b54d5c253b1`、base `f7642514a93b6c10a217f507d4383da3103a2710` 未變、mergeState CLEAN、四個PR checks全部success：[快照](pr-final.json)。[Website QA 43710149220](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43710149220) 真正Jekyll、原文bundle／語言／發布面、Chromium與INDEX備援全部成功：[steps](pr-website-qa.json)。PR不發布的三步依原規則skipped，不當正式驗收。

2026-11-15 11:54:09 UTC正常merge為 `a3f520897b6e600eddbd138f30f8fe4fa865b70d`：[merge](merge.json)。只快轉本輪隔離分支，原工作樹與其他worktrees保留。對應[Pages 43711150553](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43711150553)與Website QA分別以25分鐘上限等待；尚未完成時不以PR綠燈代替正式發布。

### 合併版正式發布與訪客驗收

[Pages 43711150553](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43711150553) build／deploy／report全success，head精確為 `a3f520897b6e600eddbd138f30f8fe4fa865b70d`：[steps](pages-release.json)。GitHub管理的Node20／Ubuntu遷移警告未造成此run失敗。

正式catalog／corpus sourceRevision精確等於合併SHA，12份原始公開檔逐位元吻合、526原文完整核對、audit第一H2批次及首頁消費契約通過。新helper再次實際讀取該版Pages artifact `14160368371`，核對SHA-256／來源版本與四個抽樣HTML完整位元：[release.json](release.json)。這不是只看Pages綠燈。

正式Chromium1440×900／390×844三情境全通過：[journeys.json](live/journeys.json)、[桌面](live/desktop-detail.png)、[手機](live/mobile-detail.png)。問題入口、組合空結果鍵盤復原保留條件、分享詳情／reload／未實跑界線／固定合併來源HTTP200／長文／返回均通過，pageerror及水平溢出0。主agent另用Orca開正式手機詳情，等待同合併SHA來源selector後核對，[實際畫面狀態](live-manual.json)有未實跑與正確來源；Escape返回保留UC-014／topic，一筆結果、焦點results-count，1440桌面無溢出。

此時主線Website QA仍在執行；以上產物及實走不能代替其最終裁決，完成後另記。

### 最終發布結論

[主線 Website QA 43711150842](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43711150842) **success**，head精確為合併 `a3f520897b6e600eddbd138f30f8fe4fa865b70d`，低於25分鐘等待上限：[完整steps](main-qa.json)、[原始log裁決](main-verdict.txt)。雲端814 tests／814 pass／0 fail，真正Jekyll、發布gate、正式Chromium及INDEX備援均通過；`PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH` 與 `PUBLISHED_LIVE_BUILD_CURRENT` 精確指向合併版。雲端此次走exact分支；新增superseded artifact整合另由本輪真實API／正式產物驗證，不混稱該雲端run走過superseded。

**已提交、已推送、已合併、部署成功、正式站已驗證。** 無本輪未解發布阻塞。有限四頁覆蓋、artifact可用性／同SHA重建快取與影像目視／真機限制如前述；不稱全站HTML或無障礙認證。

最後只保存被Pages排除的 `docs/qa/`／`SITE.md` 接續證據，不更動已審程式。接續提交的Pages／sourceRevision、相同原始產品位元與該版生成HTML再核對一次，收據附PR comment，避免為記自身SHA反覆提交；未觸發的Website QA不稱重跑。臨時驗收腳本於核對完成後移除。

下一輪仍優先從停用JS的INDEX→UC-001驗證備援原文可點性與證據說明，再決定最小修改；不自行延長本輪或新增排程。
