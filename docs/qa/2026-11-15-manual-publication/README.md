# 2026-11-15：手動發布驗證的明確比較範圍

## 基準與選題

- 原工作樹 main `642c98de88fd4bc5f96f02710df99dcbfb3d0a8c` 乾淨，保留全部既有 worktrees；GitHub RichardHan、預設 main、沒有開啟的 PR。安全 fetch 後以 `d318c4f0ea9af3502ac3dd76479b0e03c00ab5a3` 建立 Orca 隔離分支 `RichardHan/generated-publication-20261115`。分支名沿用最初調查候選，不代表本輪修了生成 HTML。
- 沒有 repo／父層 AGENTS.md；讀取 README、SITE 最新兩輪、Website QA、Facet counts QA、Pages 設定及 QA 交接。最新 Pages [43702670974](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43702670974) 對應基準成功；最新產品 Website QA [43701570098](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43701570098) 對應 `21d1f9fc…` 成功。docs-only 基準未觸發 Website QA，不說同 SHA 已跑過。Branch protection 為未保護、rulesets 空，仍等檢查、不 bypass。
- 主 agent 實際模型 `openai-codex/gpt-6-astra`；當次 catalog 有 `factory-droid/gpt-6.1-terra`／`litellm/gpt-6.1-terra`（low／medium／high／xhigh／max），`gemini3.8` 無結果，`gemini-3.8-flash` 有多 provider（low／medium／high），未證實環境標籤對應。task.perCallModel=off、enableEffort=false、defaultThinkingLevel=auto；未切換模型或付費通道，不宣稱指定模型或最高推理。find judge 帳戶拒絕，改用 grep/read；LSP 無可用 server。

目標使用者：手動重新核對正式發布的維護者。`Facet counts QA` 的 workflow_dispatch 沒有 inputs，main 發布步驟卻只使用 `github.event.before`；手動事件沒有此欄位。以同樣環境執行正式 CLI，exit 1：`Cannot verify publication without knowing what this push changed`，見 [重現](red-manual-base.txt)。這是目前 caller 契約不合，不是正式站故障，也沒有聲稱歷史 runs 是這個原因。

兩案：①猜 HEAD^，少一個輸入，但多 commit push 可能漏驗早先刪除；②手動填完整 base_sha，驗證是所選版本的嚴格祖先再開始。選②，不改未知 changeList 必須拒絕的發布契約。

驗收：明確範圍保留多 commit 的早先刪除；缺值、短 SHA、零 SHA、換行注入、相同／未來／無關／不存在 commit 在昂貴建置前失敗；有效 main dispatch 完成實際 Jekyll、發布位元與瀏覽器驗證。原桌面手機三情境不退化。

不處理：UI、案例、合格數、其他 workflow 整併、生成 HTML 的 superseded 完整比對。後者只驗語言 metadata 的邊界仍在，完整解法需 live revision 生成產物，不以文字哨兵宣稱完整驗證。

## 改動與操作

- `.github/workflows/facet-counts-qa.yml`：workflow_dispatch 必填 `base_sha`；setup-node 後先驗範圍，失敗不安裝瀏覽器／建置；main 發布用已驗值，原 push 仍用 event.before。補 `actions: read` 與 gate 的 GITHUB_TOKEN，讓既有 Pages 狀態探測可取得授權，沒有新增寫入權限。
- `scripts/publication-base.cjs`：檢查兩端完整 commit SHA、物件型別及嚴格祖先；以 execFileSync 參數傳遞，不將使用者輸入拼成 shell；成功才輸出 base_sha。每次 Git 命令最多20秒，不推測或改寫範圍。
- `tests/publication-base.test.cjs`：隔離 Git 物件歷史驗證輸出交給真正 publicationChangeList 後仍包含跨多 commit 的刪除；錯誤輸入不得輸出可供下游使用的基準。
- 移除 `published-version.test.cjs` 一項固定 workflow 原始字串的測試：它要求所有 caller 都只能使用 event.before，連既有 manual caller 本來就不符合其名稱的語意。改以真實 CLI／Git 歷史驗證範圍，並以雲端 dispatch 驗整條工作流；沒有移除或放寬任何發布位元、刪除、未知 changeList、瀏覽器斷言。

手動操作：Actions → Facet counts QA → Run workflow → 選 main → base_sha 填欲驗變更之前的完整 commit（通常是該 push 的 before，必須涵蓋整批變更）。不要直接填目前 SHA 或猜 HEAD^。命令等價為 `gh workflow run facet-counts-qa.yml --ref main -f base_sha=<完整起點SHA>`。這個範圍由操作者明示，不能自動證明操作者選的是歷史 push 的完整範圍；run log 會記錄兩端供追溯。非 main 的手動 run 只驗 preview，不聲稱已驗正式發布。

## 驗證證據

- 基準 `node --test tests/*.test.cjs`：800 pass／0 fail，[輸出](baseline-unit.txt)。
- 第一輪 focused：74 pass／1 fail；唯一失敗為上述固定 event.before 的原始字串斷言；新輸入驗證三項通過。[原輸出](focused-tests.txt)。
- 完整整合測試／雲端 build／獨立審查與發布結果在實際完成後補記。repo 沒有獨立 lint／type check，語法檢查不當作兩者通過。

正式站：<https://richardhan.github.io/ai-agent-use-cases/>。

基準 `NODE_PATH=…/node_modules GITHUB_SHA=d318c4f0… node tests/deployed-browser.cjs` exit 0：[日誌](baseline-browser.txt)、[桌面](baseline-desktop.png)、[手機](baseline-mobile.png)。桌面手機首頁、搜尋、組合空結果、鍵盤復原、詳情直鏈重整、返回及 JS-disabled INDEX 回退通過；局部 axe 為零違規，不外推全站認證。

主 agent Orca 實走：1440×900 首頁「收件匣與郵件」→164筆→UC-014，主張／核讀／未實跑限制分開呈現，固定基準來源網址；Escape 返回保留收件匣與原卡焦點。390×844 UC-014＋topic＋Cursor 零筆，鍵盤 Enter 移除 Cursor 後一筆，q／topic 保留、焦點 results-count、無水平溢出：[復原截圖](baseline-recovery-mobile.png)。

無 UI 改動，不宣稱視覺改版成效。影像讀取工具停用，截圖已保存；驗收限操作、DOM／幾何，非逐像素目視、實體手機或讀屏實聽。機器走查不是使用者研究；未做效能基準。

## 發布與接續

PR checks、Pages／Website QA 及實際 manual workflow 各以25分鐘為等待上限；未完成不算通過，失敗先讀日誌，不無限重試。原發布 gate 60分鐘期限不變。獨立 review 對應最終 diff；所有調查任務回收後記錄取捨。

下一輪最值得做：以隔離 fixture 重現 superseded INDEX／稽核 HTML 的過期正文放行，再確認是否能取得對應 live revision 的可信 Jekyll 產物；不要將 Markdown hash 或少數哨兵當完整生成 HTML 比對。

### 最終本機整合與訪客情境

`node --test tests/*.test.cjs`：**802 pass／0 fail／0 skip**（800＋3 行為測試－1 固定實作字串測試），[完整輸出](final-unit.txt)。`node --check scripts/publication-base.cjs` 通過；`python3 scripts/preview.py /tmp/ai-manual-publication-preview/ai-agent-use-cases` 成功；`node scripts/check-published-surface.cjs`：833 檔／5.84 MiB／9 項排除通過。preview 不生成 Jekyll INDEX.html，真正建置交由雲端驗證，不假稱本機 Jekyll 通過。

整合預覽 <http://127.0.0.1:8167/ai-agent-use-cases/>（暫時本機服務），1440×900／390×844 三情境全部通過：[journeys.json](preview/journeys.json)、[桌面詳情](preview/desktop-detail.png)、[手機詳情](preview/mobile-detail.png)。首頁問題入口→UC-014→判讀來源／未實跑→Escape 原卡焦點；實際選 Cursor 篩選造成零筆→鍵盤移除單一條件、保留 q／topic；分享直鏈→重新整理→固定 revision 來源 HTTP200→展開長文→返回一筆結果。手機詳情 scrollWidth/clientWidth 均368px，桌面均918px；無 pageerror／水平溢出。Orca 實際開啟同一預覽手機詳情；基準 GitHub 來源分頁已實際載入，讀到 UC-014 與未實跑限制。

### 獨立調查取捨

ActionsBaseline、VisitorBaseline 均已回收：[Actions 調查](actions-investigation.txt)、[訪客調查](visitor-investigation.txt)；scout 角色沒有寫入工具，主 agent 保存其輸出。主核對 manual caller 確實缺輸入，保留此次修補；近期 main 綠燈，沒有把已修歷史失敗當現存根因。調查中「任何祖先都涵蓋原 push 全部變更」說法不成立：操作者仍須選在欲驗變更之前，文件已明說此限制。調查建議釘 YAML 字串不採，改以實際 dispatch 驗呼叫端整合、真 Git 刪除範圍驗語意。Actions 調查提到「新的 publication-gate 測試正在編寫」沒有事實依據，本輪未修改該檔。生成 HTML 只有語言檢查的有限覆蓋仍留下一輪，沒有冒稱已實測 stale-body fixture 或已修復。

### 最終獨立審查

ManualPublicationReview 完成獨立上下文審查，**No actionable P1/P2 findings**：[全文](review-final.md)。主核對完整 SHA／commit 型別／嚴格祖先／成功才輸出、main 守門及原 gate 斷言均保留；reviewer 認可用真實 Git 多 commit 刪除測試取代原本不能發現 manual 缺值的固定字串測試。802 項最終整合測試與兩尺寸三情境證據已提供並由主實跑。這是獨立 agent review，不是 GitHub 人類 approval；雲端 dispatch 仍待實際完成才可宣稱整輪驗收。

### 目前 Actions 與原始失敗日誌

主 agent 重新查 [main runs](actions-baseline.json)、[失敗步驟／SHA](failure-runs.jsonl) 並透過授權 API 下載三個原始 log ZIP：[關鍵錯誤](raw-failure-extract.txt)。`gh run view --log-failed` 只取得不完整段落，沒有以缺失輸出推定無錯誤。43634859717／`2138f4d4…` 是 Chromium `refine-from-results-browser.cjs:96` 手機斷言 `false !== true`；42820349847／`2b139d9f…` 是正式走查等待3600002ms，index/app 位元不符；42803248261／`8fbfe082…` 是發布 gate 等待3600002ms、`Product asset mismatch`，當時 Pages 實際 succeeded。這些歷史錯誤均與目前成功紀錄區分，本輪不重跑舊 run、不聲稱這次修復它們；摘錄前半的 `# Main tip lookup timed out` 屬單元 fixture 輸出，不是實際部署故障。

Website QA PR 可取消舊 head、main 保留發布裁決；Pages 獨立建置、QA 另等正式內容。現有 browser container/npm 版本各 workflow 內相符，未觀測快取／權限額度事故，不一律改 concurrency、不新增快取或放寬檢查。
