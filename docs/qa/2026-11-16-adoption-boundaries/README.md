# 2026-11-16：詳情入門建議不得省略案例頁的停止條件

## 基準與選題

- 原工作樹 `/Users/richard_han/orca/ai-agent-use-cases` 乾淨；安全 fetch 後 `origin/main` 為 `6bb79f75837d20caf88f4ea654bbe61b2470bdf5`（本機 main 落後 39 個 commit，未 reset）。GitHub 身分 RichardHan；無開啟中的 PR；branch protection API 回未保護、rulesets 空。隔離工作樹 `/Users/richard_han/orca/wt/aiuc-20261116-r2`、分支 `improve/2026-11-16-visitor-round2`；原工作樹與其他 worktree 未動。
- 基準 `node --test tests/*.test.cjs`：**851 pass／0 fail／0 skip**。repo 沒有另定 lint／type-check；`node --check assets/app.js` 為語法檢查，不冒稱 type check。
- 模型環境：平台 catalog 實際列出 `gpt-6.1-terra`（factory-droid／litellm／openai-codex，low–max）與 `gemini-3.8-flash`（cursor／factory-droid／litellm，low–high）。本輪主 agent 的執行環境回報為 `litellm/deepseek-flash-gmi`；未切換設定、未另接付費管道，**不宣稱使用 Terra、Gemini 或最高推理**。兩個獨立調查以預設 subagent 模型執行。
- 正式站基準：<https://richardhan.github.io/ai-agent-use-cases/>，`catalog.sourceRevision` 等於上述 SHA。最新 Pages [43769650489](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43769650489) success；該 commit 只改 `SITE.md`／`docs/qa`，依 paths 不觸發 Website QA（不是失敗）。

## 問題證據與目標使用者

目標使用者是**從分享連結或搜尋結果開啟詳情，先讀「怎麼開始／要注意什麼」再決定是否採用的人**。`assets/app.js` 的 `metadata()` 讓 `assets/copy.json` 的 20 個早期條目覆寫案例頁自己的步驟與限制；面板只顯示本庫改寫的短句。正式站實測（1440×900、390×844，`before-live.json`）：

- UC-012 面板寫「這是研究作者的回顧報告…AI 不能取代研究者判斷」，但案例頁明寫「未公開研究、個資與憑證不得直接貼入代理或公開 repo」、「授權讀取不包含訓練、…付費算力…或投稿」。這些只存在於預設收合的「查看原始研究」內。
- UC-003 面板只說「原案例是模擬測試」，漏掉頁面「本頁不授權任何真實商店操作；實際發信、交易或部署必須另外取得適當批准」。
- UC-015 漏掉「不得把監看結果自動轉成續約、取消、購買或通知他人」；UC-010 漏掉「韌體寫入、網路暴露及建立持久存取須分別審核；不要照抄 Always allow」。
- UC-009 面板仍寫「目前只查到模板與安全文件」，與頁面 2026-10-17 已補的作者自述不一致。
- 16 個可操作條目的頁面停止句在 `before-live.json` 全部存在於原始研究內（`inResearch` 全為 true），但都不在面板（`inGuidance` 全為 false）。

獨立 `CopyBoundaryAudit`（另一個任務上下文，未參與實作）逐條核對 20 個條目，判定 14 個遺漏頁面明訂的硬停止／授權邊界，其餘 6 個（UC-002、UC-006、P-001–P-004）可接受；另指出 UC-009 的矛盾。主 agent 逐句回查頁面後採用其結論，並自行補上 UC-002／UC-006 的界線，使所有可操作條目一致。

## 兩個方案與選擇

- 方案 A：只改面板文案，加一句「詳情請看原始研究」。成本最低，但讀者仍可能在只讀摘要後照做，且無法知道少了哪一條停止條件。
- **方案 B（採用）**：資料層修正＋出處揭露。逐條把案例頁宣告的硬停止條件寫回 `copy.json` 的 `caution`，並在面板明確標示短句是本庫改寫、完整段落仍在下方。保留既有 precedence，不新增解析規則或依賴；`複製本篇筆記` 會同步帶到新句子。
- 不採自動合併頁面限制句：抽取器有時會取到描述句（例如 UC-004 的「來源報告與限制」首句是作者敘述），自動拼接會把敘述誤當限制。逐條人工核對較慢但可查證。

驗收條件：16 個可操作條目在面板與複製筆記中都能看到頁面宣告的硬停止條件；面板出現「本庫依案例頁改寫」揭露；未使用 `copy.json` 的條目不得出現該揭露；不變更案例原文、計數、篩選或搜尋。

## 完成的改動

| 檔案 | 改動 |
| --- | --- |
| `assets/copy.json` | 16 個條目的 `caution` 補回頁面明訂的停止／授權邊界（登入與 CAPTCHA、真實商店操作、Notion 寫入、token、Group 規則、合約與員工資料、寄信／改行程／排程、憑證、韌體與持久權限、真實商機轉交、訓練與投稿、帳號權限、付款金鑰、自動續約／取消／購買／通知、地址與電話）。UC-009 同步修正與頁面矛盾的敘述。 |
| `assets/app.js` | `metadata()` 新增 `howFromCopy`／`cautionFromCopy`；詳情面板在短句來自 `copy.json` 時加一句「以上短句由本庫依案例頁改寫；完整步驟與停止條件見下方…」。 |
| `assets/reader.css` | `.reader-guidance p.guidance-source` 小字樣式（13px、muted；修正特異性使 `.reader-guidance p` 不再蓋掉）。 |
| `README.md` | 說明 20 個早期條目的面板是本庫改寫，完整停止條件仍在原始研究內。 |
| `tests/actionable-guidance.test.cjs` | 新增回歸：使用 `copy.json` 時面板必須出現改寫揭露與原始研究指引。 |
| `tests/visitor-adoption-flow-browser.cjs` | 修正既有過時斷言：UC-016 已有多重證據類別，claimant 文字為「成果主張來源（主要：…）：」。此檢查在基準正式站即失敗，非本輪造成；該檔未被任何 workflow 引用，屬潛在死測試。 |

## 驗收證據

- 最終 `node --test tests/*.test.cjs`：**852 pass／0 fail／0 skip**（851＋1 個新回歸）。
- 本機 preview（`python3 scripts/preview.py`，<http://127.0.0.1:8081/ai-agent-use-cases/>）：`tests/guidance-subsections-browser.cjs` 三尺寸通過；`tests/discovery-browser.cjs` 桌面／手機／小手機的探索、搜尋、組合空結果復原、詳情直鏈、重新整理、返回、載入失敗與重試全部通過，三尺寸 axe 各 0 違規；`tests/visitor-adoption-flow-browser.cjs` 全情境通過且 axe 0 違規。
- 修改前後同一資料狀態（`?case=UC-012`，1440×900／390×844）：[修改前 JSON](before-live.json)／[修改後 JSON](after-final.json)、[修改前桌面](before-live-desktop.png)／[修改後桌面](after-final-desktop.png)、[修改前手機](before-live-mobile.png)／[修改後手機](after-final-mobile.png)。截圖由 Playwright 產生；本環境停用影像輸入，**未逐像素目視**，以上結論以 DOM 文字、幾何與 axe 為準。
- 修改後 16 個條目 `hasNote=true`，未使用 copy 的 UC-020 `hasNote=false`；桌面與手機均無水平溢出；UC-012／UC-016 詳情展開指引後 axe（WCAG 2A/2AA/2.1AA）0 違規：[axe-detail.json](axe-detail.json)。只代表這兩個狀態，不是全站無障礙認證。
- `node scripts/check-published-surface.cjs`：**PASS，834 檔／5.87 MiB／9 項排除**；`python3 scripts/check_corpus_bundle.py /tmp/aiuc-r2-preview`：**PASS，526 來源逐 byte 相同**。`node --check assets/app.js`、兩個改動測試檔語法通過。
- 三種指定情境（preview，Chromium 1440×900／390×844）：
  1. 不知道工具名稱：首頁搜「會議」→ 29 筆；開第一張 UC-094，詳情顯示成果主張「作者報告／示範」、核讀狀態與固定建置版本的 GitHub 原文；Escape 後保留查詢、結果數與卡片焦點。
  2. 組合搜尋與篩選：`?q=旅遊&scenario=開發&category=旅遊／消費研究` → 0 筆，空結果列出「移除主題分類…→ 查看 1 筆」「移除使用情境…→ 查看 1 筆」；點後者恢復 1 筆（UC-001），關鍵字與主題分類保留，空結果區塊隱藏。
  3. 分享直鏈：`?q=二手&case=UC-016` 直接開詳情，顯示成果主張、核讀狀態、新的停止條件短句與「本庫依案例頁改寫」揭露；來源連結固定於 `6bb79f7`；Escape 返回後查詢保留、結果 27 筆、焦點在結果摘要。
- 限制：preview 不是 Jekyll build；真正 Jekyll 由 PR Website QA 驗證。未做真人使用者研究、未量測效能。20 個條目的其餘限制仍是摘要，README 已明說不能取代原文。

## Actions 調查（獨立 ActionsAudit，主 agent 核對）

- 最近 40 筆 workflow runs 全部 success；最近 20 筆 main runs 全部 success；目前 0 queued。最後一次 failure 是 2026-11-15T00:38Z 的 PR 批次（同一分支下一個 commit 後 success），最後一次 cancelled 屬 `cancel-in-progress`。**目前沒有可重現的 CI／部署失敗。**
- 既有結構性風險（本輪不改）：docs-only／`SITE.md` 變更不觸發 Website QA（依 paths，刻意）；Website QA 的 Playwright 1.56.1 與部分 workflow 1.64.x 漂移；actions/checkout@v4 等仍跑 Node 20 已棄用環境；`actions/jekyll-build-pages@v1` 浮動；57 個 workflow 的 paths 重疊可在單次 push 同時起多個 run。留待有實際故障證據時再處理。

## 獨立審查

- 獨立 reviewer（`AdoptionBoundaryReview`，另一個任務上下文，未參與實作）對第一版 diff 提 6 個 P2，全部有頁面引文：
  1. UC-002 漏「未經確認不發布、不聯絡創作者、不上傳私人素材」。
  2. UC-004 漏「只公開資料仍應避免大量蒐集」。
  3. UC-010 漏「憑證及網路秘密由所有者安全處理」與提示詞的「密碼、token、私網位址不要貼入聊天或公開報告」。
  4. UC-014 漏「客戶個資：最小揭露」。
  5. UC-016 改寫後漏掉「低於底線的議價不可自動送出」，也漏掉平台許可邊界「平台許可及接入方式未確認前，只在站外準備文字草稿；本人審核不能代替平台許可」。
  6. 揭露句對 P-001／P-003 說「完整步驟見下方」不實，因為待查線索沒有步驟。
- 主 agent 逐條回查頁面（`cases/002:33`、`cases/004:48`、`cases/010:34,39`、`cases/014:78`、`cases/016:68-70`、`sources/pending.md`）後全部接受並修正：五條 caution 補回上述邊界；揭露句改為待查線索時說「依待查線索整理；完整已知線索與缺口見下方」。新增 P-001 待查揭露回歸。
- 修正後受影響驗證：**853 pass／0 fail**（再加 1 個待查揭露測試）、guidance 三尺寸與 adoption flow 全數重跑通過、P-001 面板實際顯示「依待查線索整理」且無「完整步驟」字樣、after-final 證據重拍。reviewer 的「Overall correctness: Incorrect」是針對修正前版本。
- 複核（同一 reviewer、修正後版本）：**No findings**；reviewer 明說未自行重跑單元或瀏覽器檢查，上述 853 單元與兩套瀏覽器是主 agent 實際執行。此為獨立 agent 審查，不是人類 GitHub approval。

## PR、合併與正式站

- 已提交、已推送 `d4f71d1ecf4e566af4e5ab9839408a33bc231c0d`，建立 [PR #423](https://github.com/RichardHan/ai-agent-use-cases/pull/423)；[獨立審查 comment](https://github.com/RichardHan/ai-agent-use-cases/pull/423#issuecomment-6902798518) 對應同一 head。16 項 checks pass、2 項 `published` 依 PR 規則 skipped；沒有 pending／fail。
- 2026-11-15T23:14:15Z 一般 merge，合併版本 `298440b67c47597933a41a52c8399d4a8dde7f3f`。
- [Pages 43773706208](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43773706208)：build／report-build-status／deploy 全部 success，head 精確為合併 SHA。
- 主線 [Website QA 43773706720](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43773706720)：**success**；`Run existing regression tests` TAP `# tests 853／# pass 853／# fail 0`，`PUBLISHED_ASSETS_AND_SOURCE_CONTENT_MATCH 298440b6…`，exact 模式走正式站得到 `PUBLISHED_LIVE_BUILD_CURRENT 298440b6…` 與兩項 `PASS LIVE`。`published` 步驟 skipped 屬預期（PR 不發布），不是關閉檢查。
- 正式站 `catalog.sourceRevision` 精確等於 `298440b6…`；`tests/deployed-browser.cjs` 以該 SHA 走正式站 exit 0，桌面／手機與 JS-disabled 索引退路通過。實際以 Chromium 390×844 開 `?case=P-001`：待查揭露為「依待查線索整理」、來源固定 `298440b6…`、無水平溢出；`live-merged.json` 顯示 16 個 copy 條目都有揭露、沒有溢出；UC-016 的複製筆記帶完整新停止條件。
- **已提交、已推送、已合併、部署成功、正式站已驗證**。未解：docs-only 後續紀錄會再推進 `sourceRevision`，但產品位元不變；以獨立 docs PR 保存並只核 Pages 與產品位元，不觸發 Website QA 也不冒稱重跑。影像逐像素、實體手機、讀屏實聽與效能未驗。

## 發布與接續

- 下一輪最值得做：**驗證 UC-250（已併入 UC-156）是否仍被抽卡與結果當成獨立案例**。先以正式站 `#discover` 多次抽卡與 `?q=UC-250` 確認卡片標籤、計數與合併說明，再決定是排除抽卡、加「已併入」徽章，或只修計數說明；不要直接刪除保留追溯的頁面。
