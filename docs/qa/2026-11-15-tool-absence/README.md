# 2026-11-15：不要把「無對應實測」變成提及工具

## 基準與選擇

- 基準 `main`：`5a1663e85d794aa7c77e8ee4cd236b6d56cea2c7`；安全 fetch 後建立 `improve/2026-11-15-verification`，隔離工作樹 `../ai-agent-use-cases-verification`。原工作樹乾淨，沒有開啟中的 PR；保留原工作樹與所有案例原文。
- 正式站：[案例庫](https://richardhan.github.io/ai-agent-use-cases/)。本輪開啟桌面與手機，實走首頁任務、搜尋、篩選、空結果、詳情、來源與返回；來源連結固定於上述 revision。
- 已讀 README、SITE 最近紀錄、歷史維護規則、Pages 設定及 Website QA。repo 與兩層父目錄沒有 AGENTS.md。repo 沒有另定 lint/type-check 指令；JavaScript 語法檢查不冒稱 type check。
- 主 agent 實際模型 `openai-codex/gpt-6-astra`。平台 catalog 登錄 `openai-codex/gpt-6.1-terra`（low/medium/high/xhigh/max），Gemini 的 ID 為 `gemini-3.8-flash`，在 cursor、factory-droid、litellm 與 openrouter provider 登錄（low/medium/high）；這不代表本輪使用過它們。task 的 `perCallModel=off`、推理預設 `auto`，未切換設定、未另接付費管道。語意 find 因 judge 帳戶拒絕而不可用，改用本機文字搜尋；專案沒有可用 LSP。

## 問題、兩個方案與範圍

目標是依工具挑選可採用做法的訪客。正式站 `?q=UC-040&scope=topic&tool=Grok%20Bot` 返回 UC-040，卡片首行顯示 `UC-040 · Grok Bot / Meta Muse`。但 `cases/040-trip-deferred-recheck.md:7` 明寫：

> 工具：ChatGPT dots（作者稱 OpenAI Dots）；Grok Bot／Muse 本頁無對應實測。

兩個被否定的工具只出現在這一行；真正的 dots 因卡片僅列前兩個工具而被擠掉。

- 方案 A：調整顯示排序。成本低，但錯誤工具篩選與計數仍存在，且沒有可靠的主要工具宣告。
- **方案 B（採用）**：沿用既有子句過濾，只識別完整的「工具清單＋無／沒有＋對應／同題／同類／同等＋實測」陳述。工具清單、篩選、計數與卡片一起更正，不新增解析架構。
- 不排除實際失敗使用紀錄、作者自述或本庫尚未實測的設計；另一段正向提及仍能讓該工具入列。全文搜尋仍保留否定原句，不把搜尋到文字冒稱使用工具。
- 不變更來源、穩定 ID、證據類別、難度推測、工具排名或 UI 風格；不擴充為自然語言理解系統。

## 已完成的程式與回歸證據

- `assets/app.js`：新增保守的 `isAbsentToolTrial()`，工具名稱沿用 `TOOL_PATTERNS`，不增加依賴或網路行為。既有否定規則保持不變。
- `tests/tool-mention-fidelity.test.cjs`：新增真實 UC-040 回歸與缺少對應實測／失敗實測／未實跑設計／後續正向補充的對照測試。
- `README.md`：記錄邊界，說明卡片最多顯示兩項而非主要工具排名。
- 對 529 條目逐項比較：**只有 UC-040 的工具清單改變**，`[Grok Bot, Meta Muse, ChatGPT dots] → [ChatGPT dots]`。其餘 528 條目工具清單不變；沒有修改任何案例原文。

| 檢查 | 基準 | 修正後 |
| --- | --- | --- |
| 全套 `node --test tests/*.test.cjs` | 762 通過，0 失敗 | 765 通過，0 失敗，0 略過 |
| 新增回歸對基準程式 | 2 項失敗 | 2 項通過，另加 1 項獨立審查反例回歸 |
| `node --check assets/*.js`（逐檔執行） | 通過 | 通過 |
| `python3 scripts/preview.py <獨立輸出目錄>` | 完成 | 完成 |
| `python3 scripts/check_corpus_bundle.py <預覽目錄>` | 未另執行 | 526 來源逐位元相符 |
| `node scripts/check-published-surface.cjs` | 833 檔，5.84 MiB | 833 檔，5.84 MiB |

基準與最終修正版的 `node tests/discovery-browser.cjs` 均在 1440×1000、390×844、320×740 通過：引導探索、鍵盤、組合篩選、空結果、分享直鏈、重新整理、返回、載入失敗與重試；三尺寸 axe 各 0 違規。真正的 Jekyll build 由 GitHub Actions 驗證；本機 preview 不是 Jekyll build。

## 瀏覽器前後證據

同一資料狀態 `?q=UC-040&scope=topic#explore`、1440×900／390×844／320×740；原始截圖與數據：

- 桌面：[修改前](before-desktop.png)／[修改後](after-desktop.png)
- 手機：[修改前](before-mobile.png)／[修改後](after-mobile.png)
- 小手機：[修改前](before-small-mobile.png)／[修改後](after-small-mobile.png)
- [修改前 DOM／流程紀錄](before-browser.json)、[最終修正後紀錄](after-browser.json)、[全庫工具差異](corpus-impact.json)、[先紅](red-unit.txt)、[最終全套單元結果](final-unit.txt)。

三尺寸均觀察到卡片從 `Grok Bot / Meta Muse` 改為 `ChatGPT dots`；選 Grok Bot 或 Meta Muse 從有 UC-040 變為空結果，改選 dots 恢復同一案例。三情境均實走：不知工具名稱而搜尋「延遲複查」找到 UC-040；搜尋加生活篩選後以無結果查詢復原；分享直鏈重整、讀取成果主張／核讀標記、開啟 GitHub 原文新分頁並返回保留條件及鍵盤焦點。原文的「無對應實測」與 X 來源網址仍在。GitHub 原文分頁實際載入並核對標題；沒有重做 X 作者主張的事實查證。

最終目標流程三尺寸皆水平溢出 0、pageerror 0；重設後首頁的 axe（WCAG 2A/2AA/2.1AA）各 0 違規。這不是全站人工無障礙認證，也沒有量測效能或真人成效。臨時瀏覽器腳本第一版用了匹配兩個元素的 summary selector，修正為唯一 `#filter-summary` 後重跑通過；這是驗收腳本錯誤，不是產品失敗。

## 本輪 Actions 調查

查詢時最近 16 次 main Website QA 為 15 成功、1 失敗；最近 16 次 Pages 均成功。沒有把歷史錯誤當成目前仍存在：

| Run | Commit | 結論與證據 |
| --- | --- | --- |
| [Website QA 43666234188](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43666234188) | `5a1663e8` | 本輪基準成功；Chromium、實際 Jekyll build、發布面、版本閘門、正式站走查均 success。 |
| [Pages 43666233659](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43666233659) | `5a1663e8` | 成功，正式 catalog revision 與此一致。 |
| [Website QA 43634859717](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43634859717) | `2138f4d4` | Chromium 步驟失敗；主整合者以授權 gh API 下載原始 log ZIP，`0_browser.txt` 明列 `phone: the entry waits while the search field is on screen`、`false !== true`、`tests/refine-from-results-browser.cjs:96:14`。 |
| [Pages 43634858899](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43634858899) | `2138f4d4` | 同提交發布成功；QA 紅不等於 Pages 部署失敗。 |
| [Website QA 43660534918](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/43660534918) | `82ac0fea` | 排隊約 6 分鐘後成功，不分類為故障。 |

前輪已在測試把搜尋框捲入畫面；目前 head 綠，本輪不重跑舊失敗來「確認」，也不修改 CI。主分支 concurrency 不取消執行中發布判定，PR 可被新提交取代；多個舊任務 workflow 為歷史分支或手動入口，沒有一律改掉。本輪保留診斷風險：Website QA 前面的瀏覽器步驟失敗時，後面的發布檢查會被略過；紅燈保留，但沒有獨立發布判定。這不構成本輪發布阻塞，也不以隨意放寬捲動閾值處理尚未重現的產品問題。

## 獨立審查

`FinalReview` 是未參與實作、唯讀的獨立 reviewer 任務。第一版提出 P2：`作者使用 Meta Muse 訂票失敗但本頁沒有同類實測比較。` 不應整句刪除。主整合者改為完整工具清單比對，並加入同句正向使用、無「比較」尾詞、雙重否定與設計使用四個反例。Reviewer 再看最終 diff 後判定 **Correct／無剩餘 finding**；未執行測試、未看截圖。其當時所讀全套紀錄為第一版 764 通過；主整合者之後核對最終 765 通過及重跑三尺寸目標流程，見本目錄結果，不把舊測試數充作新版本驗收。

## 驗收限制與接續

- 工具清單仍是保守字面規則，不保證理解所有否定語法；不以這次一例修正宣稱全庫工具歸屬已人工驗證。
- 圖像輸入在本環境停用；會保存實際瀏覽器截圖，幾何、DOM 與 axe 可驗，但不宣稱已人工逐像素審視截圖。
- 下一輪最值得處理：多工具案例的卡片只顯示前兩項。例如以 Notion 篩選的 UC-046，卡片未顯示 Notion。先在 320px／390px 量測「顯示命中的篩選工具」與「展開全部工具」兩方案，不直接將固定順序當主要工具排名。
