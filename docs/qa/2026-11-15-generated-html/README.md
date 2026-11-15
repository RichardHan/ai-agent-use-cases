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

下一輪最值得做：盤點四個抽樣之外、訪客真正可到達的生成 HTML（先以README／範本的生成頁注入過期內容），再決定擴大完整artifact比對範圍；不要宣稱本輪已涵蓋全部HTML。

### 目前 Actions 與歷史失敗日誌

本輪主agent重新取得三次近期失敗的API與原始log ZIP：[SHA／步驟](failure-steps.jsonl)、[關鍵錯誤](failure-errors.txt)。43634859717／`2138f4d4…`在Chromium `refine-from-results-browser.cjs:96` 出現手機視口斷言 `false !== true`；42820349847／`2b139d9f…`在正式瀏覽器前等待3600002ms，index/app位元不同；42803248261／`8fbfe082…`的Pages成功，但發布gate等待3600002ms後 `Product asset mismatch`。前者是舊測試邊界，後兩者是舊版被取代後仍比較舊位元的歷史問題；目前後續綠燈與現行程式已區分exact／superseded，不把這三次當本輪新故障或新修成效。

Website QA對PR取消舊head、main保留裁決；Pages獨立建置，QA再比正式產物。沒有觀測權限／額度／快取事故，本輪不改concurrency、不一律整併workflow，保留既有瀏覽器容器與Node版本。新artifact下載沿用已授權的actions:read。

### 最終獨立審查

GeneratedPagesReview 複審 **correct／無P1/P2**：[完整結果](review-final.md)。初審將尚未提交的新檔不在git diff中誤報為遺漏，已撤回；主agent核對selective commit草稿包含兩個helper與新回歸檔，沒有為此改程式或放寬測試。完整內容、archive/token邊界、失敗快取、期限與既有exact分支均經獨立檢查；814單元、真實artifact與訪客證據由主實跑。此為agent獨立審查，不是人類GitHub approval。
