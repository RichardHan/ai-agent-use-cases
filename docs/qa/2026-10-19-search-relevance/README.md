# 2026-10-19：搜尋先看主用途

對象是用「薪水」「收件匣」等日常問題找案例的新訪客。這輪保留全文搜尋與既有篩選，讓已命中的案例依標題、用途與查詢的關係排序，減少先讀到正文順帶提及的內容。

## 問題、兩案與範圍

基準 main `88c08fc1704a0b02408a4753062702759bccce2f`；初始工作樹乾淨、與 origin/main 同步，沒有開啟 PR，其他既有工作樹未修改。已讀 README、SITE 前輪紀錄、Pages 設定、preview 與 QA 工作流程；本 repo 無 AGENTS.md。既有品牌、靜態架構、base path、原始案例與來源均沿用。

先檢視同版本 Website QA 的桌面／手機與正式站走查，再新增 test-only commit `b7190f8`。雲端 [基準／紅燈 run](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39166233112) 完成原有 58 tests、JS syntax、靜態 preview 和 1440／390／320px 三旅程；新增排序 unit 因原版沒有 rankEntries 而失敗。這個紅燈是缺少新排序介面；真正使用問題由 browser report 與截圖證實：薪水共7筆，薪酬主題 UC-230 第6、限制中提及薪資的 UC-024 第2；收件匣共89筆，第一筆是旅行案例 UC-001。

- A：加入排序選單。適合已熟悉資料的讀者，但增加手機操作與需理解的選項。
- B：有查詢時直接讓精確編號、標題與用途命中優先。成本較低，新訪客無須額外操作。採 B。

驗收：召回集合與各篩選不變；精確編號含短寫法優先；多詞覆蓋、同分穩定；無查詢保留原序；詳情前後切換、直鏈重整、返回焦點不回歸；空結果與載入不顯示排序提示；桌面／手機無溢出與新增 axe 違規。

不處理內容改寫、語義推論、搜尋同義詞擴充、難度欄位、全文快取或框架變更。未改案例／證據／待查原文、299合格數、339總條目與46組候選來源叢集；未刪疑似重複、未新增追蹤、cookie、儲存、登入或服務。

## 實作與獨立審查

`assets/app.js` 新增 rankEntries，僅排序 filterEntries 已找到的結果，不改召回。依序比較完整ID變體、標題或用途涵蓋的不同查詢詞數、標題涵蓋詞數、既有情境／分類／標籤／工具涵蓋詞數，同分使用輸入索引。沿用 termVariants；不以詞頻、來源類型、人氣或成果評分。currentFiltered 同步供列表與詳情鄰居使用。

`index.html`、`assets/style.css` 在有查詢且有結果時顯示簡短說明，明確指出排序不代表成果或證據可靠度；空白、空結果、載入中隱藏。延續品牌深綠、13px／1.7行高，可在小螢幕換行。

新增 `tests/relevance.test.cjs`、`tests/relevance-browser.cjs`、`.github/workflows/relevance-qa.yml`。單元測試覆蓋完整語料的6種查詢×6組條件的召回集合一致、穩定排序、多詞覆蓋、詞頻／重複詞不加權、缺欄位與短ID對抗樣本。

未負責主實作的獨立角色先審方案、再審diff與前後截圖。依審查補上目標ID存在斷言，並修復純數字／未補零UC與P編號未取得優先的問題。過程另修復新測試漏載Discovery與axe需明確browser context的測試環境錯誤；未降低既有產品驗收標準。

本機操作限 repo／git 狀態讀取、安全 git fetch 與 GitHub 傳輸，未修改工作檔、操作個人GUI、安裝套件或跑本機站點；所有程式寫入均經 GitHub connector，瀏覽器、測試與建置在 GitHub-hosted Ubuntu。CLI寫入權限不足時改用既有GitHub連線，未改認證或權限，未使用另付費API。實際模型識別碼、帳號最高可用模型與推理強度無可信runtime介面可核實／切換，因此不宣稱已用最強設定。

## 前後畫面

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 1440×1000 | [搜尋桌面](before-desktop.jpg) | [搜尋桌面](after-desktop.jpg) |
| 390×844 | [搜尋手機](before-mobile.jpg) | [搜尋手機](after-mobile.jpg) |

均為實際雲端Chromium截圖。比較相同「薪水」查詢；首頁隨機抽卡不作內容對照。

## 驗證與重現

```sh
node --test tests/*.test.cjs
for file in assets/*.js; do node --check "$file"; done
python3 scripts/preview.py /tmp/relevance-preview/ai-agent-use-cases
python3 -m http.server 8091 --directory /tmp/relevance-preview
NODE_PATH=<cloud-tools>/node_modules node tests/relevance-browser.cjs
```

三個模擬情境：
1. 用薪水／收件匣找問題，保留全部匹配並優先看到主用途；精確UC313找案例。
2. 旅遊＋生活篩選 → 開啟來源 → 下一則／上一則 → Escape回原閱讀按鈕與條件；無結果後編輯查詢。
3. 帶關鍵字的UC-313直鏈 → 重整 → 關閉保留查詢與排序。

這是模擬走查，不能代表真人偏好、轉換率或回訪已提升。純前端無package build、獨立lint或TypeScript；JS syntax／Python靜態預覽與正式Pages Jekyll建置分別記錄，不混稱。

## 限制與下一輪

這是可解釋的欄位關鍵詞排序，仍受既有同義詞與欄位品質影響，無法理解全部否定語境；原文命中摘要與證據限制仍需閱讀。未測實體iPhone、軟鍵盤或真人螢幕閱讀器，axe也不是完整無障礙認證；未量測Lighthouse或宣稱實際裝置速度／留存改善。

下一輪優先量測並降低回訪全文載入成本，保留全文搜尋一致性、來源更新與部分失敗回復。

## PR驗收結果

[PR #51](https://github.com/RichardHan/ai-agent-use-cases/pull/51) 的8套QA全數成功，head `1e9c338`；無衝突squash merge為 `9f4539b`，父版本仍是原基準 `88c08fc`，未覆蓋協作者修改。

| 項目 | 實際結果 |
| --- | --- |
| 單元 | 63 tests、63 pass、0 fail，含339條目與36組查詢／篩選召回比較 |
| 語法／靜態預覽 | 全部JS syntax、Python preview通過 |
| 新排序旅程 | [Search relevance QA 39166638669](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39166638669) 成功 |
| 跨瀏覽器 | Chromium 1440×1000／390×844／320×740；Firefox及WebKit各390×844，三情境全通過 |
| 無障礙 | 新排序QA的5次axe掃描零違規；新說明沿用深綠#285344與paper底色，axe含色彩對比檢查 |
| 薪水 | 7筆保留；UC-230由第6變第1，UC-024由第2變第4 |
| 收件匣 | 89筆保留；前3為UC-080／088／118，都是信箱／郵件主題 |
| 精確編號 | UC313仍第1；短ID與純數字對抗單元通過 |
| 原有回歸 | Website／Reader／Reading flow／Related／Partial Load／Search context／Home search entry，7套全部成功 |
| 體積 | HTML+153、JS+1392、CSS+213，未壓縮合計+1758 bytes；無新產品依賴或請求 |

原始數據：[before.json](before.json)、[after.json](after.json)、[asset-sizes.json](asset-sizes.json)。未節流runner中，5環境ready為960–1497ms，15次自動化fill＋render為13–89ms（含工具往返，單次樣本），不是Lighthouse分數或實際裝置效能承諾；沒有宣稱速度改善。

獨立角色核對最終diff、before/after1440／390及after320真實截圖與完整JSON／run狀態，結論無剩餘必修，確認正式發布須另驗，沒有把PR預覽當成已上線。

## 正式站與發布後檢查

[Pages Jekyll建置與部署39167313591](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39167313591) 成功；[正式搜尋驗收39167313595](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39167313595) 對三資產逐字比對後，五組瀏覽器三情境與5次axe全部成功。

其後協作者合併 `d2e21ff`，只新增同義詞／分詞、搜尋測試與SITE紀錄；本輪排序、HTML、CSS與返回handler未被改動。保留其完整修改，並以更新後的main附加本輪紀錄。[整合正式站搜尋驗收39167691734](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39167691734) 再次逐字比對資產與通過五環境三情境、5次axe零違規，原始資料見[published.json](published.json)。

正式站可直接預覽：[薪水搜尋](https://richardhan.github.io/ai-agent-use-cases/?q=%E8%96%AA%E6%B0%B4#explore)、[收件匣搜尋](https://richardhan.github.io/ai-agent-use-cases/?q=%E6%94%B6%E4%BB%B6%E5%8C%A3#explore)。

### 原生返回檢查的取圖干擾

發布後main-only Return visibility QA真實紅燈不能忽略：[39167313619](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39167313619) 原腳本WebKit首輪返回後失焦，按鈕bottom約992px超出844px。僅重試失敗job一次仍失敗，保留[第一次狀態](return-initial-failure.json)，沒有重跑到綠就當解決。

雲端純觀察[39167609127](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39167609127) 的[第一輪trace](return-trace-first.json) 顯示：popstate後焦點成功回UC-001，+500ms仍可見；+523ms在screenshot期間才變BODY並回捲。因此否定「第一次focus無效」假說，沒有修改restoreDetailFocus或延長300ms保護。

再做fresh context／交錯取圖對照：[39168062944](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39168062944)，[完整控制資料](screenshot-control.json)。正式站12組中，兩個取圖組在取圖前正確、取圖後失焦；6個不取圖組在500／800／1000ms都正確，兩種context皆可能受影響。基準與目前預覽各12組穩定；未僅憑這個時間關聯下結論。

最後用固定d2e app、各腳本原有逐字資產比對的[最小差異實驗39168251395](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39168251395)：
- 原腳本不改：WebKit第一輪同樣失敗。
- 只移除成功路徑的screenshot單行：三引擎30輪全部通過。
- 只改context建立方式：另30輪通過，但前述控制已排除將context當成唯一原因。

見[原始最小對照](exact-return-control.json) 與[固定診斷程式](https://github.com/RichardHan/ai-agent-use-cases/blob/22c910a7cd473136692d9e5578bddd4f79e3652d/.github/workflows/return-diagnostic.yml)。獨立角色核對上述資料後，同意將返回測試改為先記錄狀態並驗收、只在失敗後best-effort截圖再拋回原錯誤。原500ms、焦點／URL／集合／±1px可見性斷言、產品300ms截止與輸入取消全部保留；不是延長等待、放寬斷言或修產品以配合測試。

另讓Return visibility QA在PR也執行原生返回預覽，避免此路徑只在發布後驗收。尚不能宣稱已找到WebKit／Playwright的上游根因；本紀錄只證明這組環境中成功路徑取圖會干擾待測狀態。未驗實體iOS的限制仍保留。
