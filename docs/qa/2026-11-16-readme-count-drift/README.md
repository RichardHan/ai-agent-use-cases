# 2026-11-16：README 不再寫死會隨語料變動的搜尋筆數

## 基準與選題

- 起始：原工作樹乾淨在 `197ae2df`（PR #433 合併版）。安全 fetch 後 `origin/main` 已前進到 `2a842347cc3d75eed44687bbaf384192b986aa26`（只改 `SITE.md` 與單元 runner 紀錄的 docs 追補）。本輪先從 `197ae2df` 建 `/tmp/aiuc-20261116-r6`、分支 `improve/2026-11-16-readme-counts`，再把該分支 rebase 到 `2a842347`；原工作樹與其他 24 個 worktrees 未修改。
- 無 repo／父層 `AGENTS.md`；沿用 README、SITE.md、`_config.yml`、Website QA 與最近 `docs/qa/2026-11-16-single-unit-runner/README.md` 的流程。
- 基準 `node --test tests/*.test.cjs`：**863 pass／0 fail**。正式站 `catalog.json.sourceRevision` = `2a842347…`，Pages 已發布。
- 目前有一個開啟中的 PR [#434](https://github.com/RichardHan/ai-agent-use-cases/pull/434)（`fix/2026-11-16-positive-find-guard`），其 `find` 白名單修正已由 #433 以另一種形式併入 main，PR 本身 `mergeable=CONFLICTING`；本輪不動它的內容，另見「已知限制」。
- 主模型實際為 `litellm/deepseek-flash-gmi`；工具沒有提供切換 gpt-6.1-terra／gemini 的介面，未宣稱使用指定模型或最高推理設定。兩個唯讀調查與獨立 reviewer 都是獨立任務上下文。
- 目標使用者：從 GitHub 首頁或網站上的 README 連結閱讀搜尋行為說明，並用那些範例數字判斷「這個站能不能回答我的問題、篩選是否可信」的訪客；以及每次新增案例後需要判斷文件是否仍成立的維護者。

## 可重現問題

README 用具體筆數說明搜尋行為，但那些數字是語料快照，沒有跟著語料更新。以 `main` `2a842347` 實測：

| README 寫 | 現況 | 來源 |
| --- | --- | --- |
| 搜「權限」會命中 **529 筆中的 521 筆** | 532 筆中的 **524 筆** | 首頁 `?q=權限` 的 `#results-count` 與 `#match-scope-message` |
| 「521 筆裡，34 筆…其餘 487 筆中，411 筆…另有 76 筆」 | 「這 **524** 筆裡，34 筆…其餘 **490** 筆中，**414** 筆…另有 76 筆」 | 同上，桌面與手機文字相同 |
| **34＋411＝445** | **34＋414＝448** | 同一句 |
| 「想學英文」→ 原問題包含「學英文」→ **32 筆**文字命中 | 空結果頁顯示 **34 筆文字命中** | `?q=想學英文` 的 `#empty` |
| 原問題包含「省錢」→ **搜尋 62 筆** | **65 筆** | `filterEntries(tokenize('省錢'))` |
| 單搜「機票」有 **11 筆** | **12 筆** | `filterEntries(tokenize('機票'))` |
| 532 個條目中有 **228** 個宣告、**304** 個沒有 | 228／304（仍正確，但只對到當下的 532 條目） | `parseFile` 的 `targetUser` |
| 532 個條目中有 **247** 個宣告、**47**／**238** | 247／47／238（同上，隨新增條目失效） | `coreGoalView` |
| 不會讓 **529 個條目**看起來只加得到 **522＋3＋2** | 現在是 532 條目、統計卡 525＋3＋2＋2 個已併入 | 首頁統計卡與 `#pending-note` |

同一份語料在 16 天內有 28 個動到 `cases/` 的 commit，這一組數字每次新增案例都可能改變。可重現證據：[`stale-claims-live-before.txt`](stale-claims-live-before.txt)（正式站 `/README.md` 的原文命中）、[`rendered-before.json`](rendered-before.json)（正式站實際渲染的拆分句與統計卡）。

## 兩個方案

1. **把數字更新成現值，並加一個由語料重算的守則**：文件保留精確筆數，新增案例時守則會失敗並要求同步改 README。價值是仍有具體數字；成本是幾乎每個新增案例的 PR 都要改一行文件，且「權限」這類範本標題的命中數每次都變。
2. **移除會隨語料變動的絕對筆數，改寫成可由程式驗證的性質（選定）**：README 保留機制與 N／A／B／C 的結構、指向當次載入的實際數字；批次大小、手機任務數、延伸閱讀 2% 門檻等「設定」仍寫明文，並由守則比對程式常數。

選 2 的理由：這些數字是介面當下算出來的，README 不可能保持同步；重複一份會過期的快照，等於讓訪客拿舊資料判斷可信度。守則改為檢查「README 承諾的性質在現行語料仍成立」，涵蓋同一個失效模式而不製造每批內容都要改文件的摩擦。

驗收條件：

- README 不再出現「N 筆中的 M 筆」這類語料快照；仍能從文字理解拆分句的 N／A／B／C。
- README 寫的批次大小、手機任務清單長度、延伸閱讀門檻與程式實作一致。
- 「多數條目沒有宣告目標使用者」「三種核心目標狀態都存在」「權限幾乎每個案例都有」在現行語料成立，且由測試重算。
- 完整 suite、preview、正式站三情境不退化；README.md 的位元確實隨合併發布到 Pages。
- 範圍外：不改搜尋、篩選、詳情等產品行為；不改案例內容或合格數；不重寫 README 其他段落；不處理 PR #434 的內容。

## 實作

- `README.md`（6 處）
  - 「想學英文」範例：`32 筆文字命中` → 「以「學英文」搜尋的實際命中筆數」。
  - 「權限」拆分句：`529 筆中的 521 筆`／`521 筆裡，34 筆…411 筆…76 筆`／`34＋411＝445` → 「幾乎全部案例」＋「這 N 筆裡，A 筆…；其餘 N−A 筆中，B 筆…；另有 C 筆…」＋「A＋B 才是正文命中總數」，並註明 N／A／B／C 隨當次載入變動。
  - 「省錢」與「機票」範例：`搜尋 62 筆`／`有 11 筆` → `搜尋 N 筆`；「機票」改寫成現行介面實際提供的下一步（單搜「機票」比刪詞後剩的更多，所以列為搜尋、不是刪除），不再引用已不存在的「只移除關鍵字「機票」」建議。
  - 目標使用者宣告：`532／228／304` → 「目前多數條目沒有宣告」。
  - 核心目標宣告：`532／247／47／238` → 三種狀態都存在、各自的行為，筆數以當次載入為準。
  - 統計卡：`529 個條目…522＋3＋2` → 「條目總數…三個分類的數字」。
- `tests/readme-visitor-claims.test.cjs`（新增，7 項）
  - 設定對齊程式：`RESULT_BATCH_SIZE`、`visibleCount` 與 CSS `nth-of-type(n+10)`、`RELATED_SPECIFIC_TAG_SHARE`。
  - 拒絕語料快照：`N 筆中的 M 筆`、`N 筆裡，M 筆`、`搜尋 N 筆`、`N 筆文字命中`、`N 個條目中有 M 個`、`只加得到 N＋`、`單搜「…」有 N 筆`。
  - 性質對齊現行語料：多數條目未宣告目標使用者、三種核心目標狀態皆非空、權限標題覆蓋 ≥90% 案例且搜尋命中 ≥90% 條目。
- 沒有新增依賴、workflow、追蹤器或第三方請求。`README.md` 本來就是 `PUBLISHABLE_FILE`，所以這次合併會真的走過 exact 發布比對。

## 驗證

- 先紅後綠：把舊 README 放回工作樹跑新測試，7 項中 4 項失敗，列出 7 個語料快照命中（[`red-old-readme.txt`](red-old-readme.txt)）；換回修正版後 **7 pass／0 fail**。其中三項在舊 README 的紅燈是「缺少新寫法」，語料性質本身在舊版語料下仍成立。
- 全套 `node --test tests/*.test.cjs`：863 → **870 pass／0 fail**（[`full-unit.txt`](full-unit.txt)）。`node --check tests/readme-visitor-claims.test.cjs` 通過。
- preview：`python3 scripts/preview.py /tmp/aiuc-r6b/ai-agent-use-cases` 成功；`README.md` 與工作樹逐位元相同；`node scripts/check-published-surface.cjs` → **PASS：838 檔、5.90 MiB、排除 9 項**（[`surface-check.txt`](surface-check.txt)）。preview 是靜態檔，不是 Jekyll build。
- 正式站基準（合併前，`sourceRevision` `2a842347`）：桌面 1440×900 與手機 390×844 走過三情境，無 pageerror、水平溢出 0（[`live-before.json`](live-before.json)）：
  1. 首頁「會議整理」→ 29／532 筆，第一張結果卡在視窗內（`#results article.card` top 139）。
  2. `?q=發票&tool=Cursor&scenario=學習` → 0／532、空結果面板可見；按「清除全部條件」→ 44 筆、24 張卡。
  3. `?case=UC-014` 直鏈 → 詳情開啟、21 個外部來源；第一個來源固定 `2a842347…`、`target="_blank"`、`rel="noopener noreferrer"`；Escape 關閉後焦點回 `#results-count`。
- 限制：本環境停用影像輸入，未逐像素目視截圖；以上是 DOM／幾何／文字證據，不是真人使用者研究。未用實體手機、讀屏實聽或 Firefox 交叉重跑。

## 獨立審查

（待補）

## 發布與正式站核對

（待補）

## 已知限制

- README 不再提供即時筆數；訪客要看到數字需在網站上搜尋。這是刻意的取捨：README 只承諾機制與性質。
- 守則只認得列出的七種寫法；若改寫成其他形式的語料快照（例如「約五成」配具體分母），仍可能漏掉。性質檢查只覆蓋 README 明寫的三個性質。
- PR #434 仍開著且與 main 衝突；本輪未關閉或重寫，留給維護者決定（其修正已在 main）。
- 沒有變更案例內容、證據等級、合格數或搜尋結果。

## 下一輪

先驗「README 三個性質檢查在新增案例後仍會失敗且訊息可操作」：加一個含「權限」標題的新案例不應讓守則紅燈（性質仍在），但把 README 的「幾乎每個案例」改成「全部案例」應紅燈。再處理 PR #434 的去留與 `find … | xargs node --test` 的守則缺口。
