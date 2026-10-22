# 首頁靈感卡：選情境到閱讀的鍵盤連續性

狀態：驗證中，尚未宣稱發布。

## 環境與範圍

基準 `origin/main` 為 `1693505`。原工作目錄分支 `improve/search-recall-recent-workflows-and-tokenization` 的 `assets/app.js` 與 `tests/search.test.cjs` 未提交修改保留；隔離工作樹 `/tmp/ai-discovery-20261022`，主角色唯一整合、獨立角色只讀。無適用 AGENTS.md，已讀 README、SITE、歷史資料規則、近期 QA、Jekyll catalog/preview 與部署設定。Pages 為 legacy/main 根目錄，不能新增 .nojekyll。開始有研究 PR #79、計數測試維護 PR #78，均不混入本輪。

使用 OpenAI Docs skill；[官方設定說明](https://learn.chatgpt.com/docs/config-file/config-basic)不能證明本會話模型。本機預設 `gpt-6.1-sol / medium`，主對話 runtime 無法讀取或切換，不宣稱已使用帳號最高能力。獨立角色依使用者要求請求 `gpt-6-astra / ultra`，也不當作 runtime 證明。僅使用既有訂閱工具、授權檔案／Git／Node 與 GitHub Actions；不操作個人 GUI 或本機瀏覽器，不使用付費 API。

目標讀者：第一次從首頁選情境、想直接閱讀靈感卡的鍵盤使用者。

兩案：A 為明確選情境／抽卡後移焦至新卡片的可閱讀標題，空集合移至說明。成本為既有 helper 的有界捲動與焦點處理，可沿用 Enter 開啟與 Escape 返回；取捨是鍵盤連續抽卡需重新抵達抽卡按鈕。B 為將抽卡按鈕移到卡片前，保留按鈕焦點、Tab 才進入卡片；適合快速連抽，但會改動既有版面及視覺操作順序。採 A；自動載入與搜尋更新不呼叫移焦 helper。

驗收：桌面／390／320、Chromium／Firefox／WebKit；情境 Enter 與抽卡 Space 後標題可見且為焦點、Tab 進同卡控制項、Enter 開啟詳情／Escape 回同標題；搜尋＋組合篩選、空結果、直鏈重整、來源與返回不退化。自動載入／輸入搜尋／重試不呼叫新移焦；長狀態與超過一屏的標題仍看得到起始文字，不要求整標題一次顯示。空卡組要有可聚焦說明。

不處理：搜尋語意、每日任務集合、案例／來源／標籤編輯、計數認定、首頁情境原有重設規則、框架與載入架構。沒有新增產品依賴、儲存、追蹤、cookies 或第三方資料傳送。

## 基準

`node --test tests/*.test.cjs`：164 通過／1 既有失敗，共165；`audit.test.cjs` 的共用來源固定計數預期19、實際20。已存在的 PR #78處理此類問題，本輪不改其測試。[原輸出](checks/baseline-unit.log)。`node --check assets/app.js` 與 `python3 scripts/preview.py /tmp/ai-discovery-build/ai-agent-use-cases` 成功。Repo 無獨立 lint、TypeScript 或 npm build；不把語法檢查冒稱 lint／type check。

先寫新增重現測試，原版5項皆為斷言失敗，未發生 fixture TypeError。[red](checks/red-unit.log)。[正式站初查39760002300](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39760002300) 完整走過首頁、四任務、旅遊＋生活、詳情、來源新頁、Escape返回、空結果；423條目、零缺項、18筆組合結果、pageerror空。[原始流程](checks/baseline-journeys.json)。來源這次實開的是本庫公開來源筆記，不冒充外部作者原帖或成果驗證。

[焦點基準39761891625](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39761891625) 在1440／390走同流程並量測鍵盤：選工作後焦點仍為工作guide，下一Tab為省錢guide；手機該焦點top=-217.08px，在畫面外。抽卡後焦點仍為卡片後面的draw-case；新卡片前面的標題與閱讀控制項被Tab順序跳過。[精確DOM與幾何](checks/baseline-focus.json)。主角色已目視桌面／手機guide與draw圖。兩次抽卡均隨機，因此前後截圖只比較操作狀態，不將不同案例的卡片高度差冒稱版面提升。

新增5項單元修正後全過，全套169／170，唯一失敗仍為同一基準audit固定計數；所有JS語法、diff與static preview build成功。[green](checks/green-unit.log)。

雲端環境：初版ubuntu-latest安裝系統依賴約11分鐘；容器run39761020529的apt-get update五分鐘逾時，未進入瀏覽。改用固定Playwright1.56.1預裝容器，僅下載測試字型，39761891625約一分鐘完成setup並成功。字型不是產品請求，不新增網站依賴。[實際逾時](checks/container-setup-timeout.log)。另一個被替代的原版觀察run39760167735最後被取消，不算成功。

## 實作與預覽

`assets/app.js` 僅改 explicit revealDiscovery：ready守門、標題／空狀態落點、即時有界捲動、preventScroll聚焦。`drawNext`／`syncDiscovery` 不移焦；沿用既有詳情開啟與返回。`assets/style.css` 只加24px scroll margin，讓焦點框與長文起點離開視窗邊緣。測試檔與本輪workflow提供三情境、五配置及生命週期驗收；產品無新增依賴或資料請求。

```sh
node --test tests/*.test.cjs
node --test tests/inspiration-handoff.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
git diff --check
python3 scripts/preview.py /tmp/inspiration-preview/ai-agent-use-cases
python3 -m http.server 8136 --directory /tmp/inspiration-preview
NODE_PATH=<cloud-tools>/node_modules node tests/inspiration-handoff-browser.cjs
```

預覽網址 `http://127.0.0.1:8136/ai-agent-use-cases/`；本機只建置檔案，實際瀏覽使用GitHub Actions。最終前後比較、獨立審查與發布證據待補。

中間驗收39762240019於shell heredoc縮排失敗、未進browser，已修；39762464522的170單元確定169成功／1已記錄失敗，語法成功，但容器checkout安全目錄設定只存在於action的臨時HOME，後續Git無法辨認工作樹而中止；只在雲端容器補safe.directory，不改本機設定。未將兩個run當作瀏覽成功。獨立review加嚴原版red必須是5個ERR_ASSERTION，audit例外同時限定唯一測試名、ERR_ASSERTION及actual20／expected19，其他失敗仍擋下。保存log只清除尾端空白，未改實質輸出。

39762729052首次完成容器單元／語法／build／原版red並進入新版瀏覽；桌面前三情境走到長標題fixture時，測試硬設標題top<200px而失敗。這不是產品的必要可見性條件；改驗標題top>=0、起始至多80px在900px視窗內，並在斷言前保存幾何與截圖。沒有因此修改產品，未把失敗當作通過。

39762979285的Chromium1440／390／320三情境及長標題通過（各axe0、pageerror空），Firefox尚未啟動便因容器帳戶／使用者目錄擁有者不符而退出。改讓瀏覽器測試以容器既有pwuser執行，不覆寫HOME變數，不操作本機帳號。產品仍不變。依獨立review，長標題檢查再加嚴為可容納者完整可見、超過一屏者至少起始80px可見，另加真實高於900px的受控fixture；舊discovery測試也由區塊標題可見改驗新的可操作標題焦點及可讀性。這是更新已改變的互動契約，其他抽卡、分享、返回與資料斷言保留。

39763432026五配置三情境、5次axe、長標題與實際超900px標題全部通過，產品無pageerror；之後loading fixture只用程式化fill，沒有任何pointer/keydown，仍允許既有搜尋arrival於載入完成時導入。該測試停止，未執行後續discovery／reader。調整為click＋fill來代表實際使用者輸入，另保存精確前後focus；產品不變，不將此run算完整通過。
