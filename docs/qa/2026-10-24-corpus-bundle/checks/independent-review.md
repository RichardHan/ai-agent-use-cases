# 獨立審查

由未實作產品的獨立角色唯讀審查；調度指定 gpt-6-astra / ultra，角色無法獨立確認 runtime metadata。未啟動本機瀏覽器，僅讀碼、Node 測試及讀取雲端結果。

初審 e0c5b95／30d0a18 指出：

1. 同時完成的 shared／fallback 回呼可能產生 completed=1、succeeded=2。這是實際重現的回呼契約矛盾，未宣稱瀏覽器已目視繪出中間態。以 Math.max(lastCompleted, successful.size, settledCount) 修正；精準 setImmediate gate 回歸在舊碼 17/18、新碼 18/18。
2. 正式發布核對須比對 checkout、catalog、bundle 三者完整路徑集合，不能只檢查 bundle 已有的項目。已共用 scripts/check_corpus_bundle.py，核對 version、revision、重複、來源完整與原文 UTF-8 bytes。
3. recent-review-recovery.cjs 有一個逐篇 503 fixture 尚未停用整包。已套 sourceRoute，原產品斷言不變。

42421b6 覆核：三項原發現均解除，未發現產品阻擋。再指出 legacy 比較不得硬編碼 total-2；9c5e4cc 已改依 fidelity.files，精準 race fixture 亦已納入。

審查者獨立確認雲端 40062885406 成功，明確限定該 run 為 e0c5b95、published 步驟 skipped，不能當最新提交／正式發布驗收。最新整合雲端與發布結果另記於本輪 README。

仍有限制：include_relative 解析 Liquid；byte parity 是偵測而非既有 branch Pages 的部署閘門。不能將 QA 存在說成已設定 required checks。

8420e83最終唯讀覆核：origin/main=dbcda8d且為merge-base，完整納入協作者主線；cases／evidence／sources／首頁／CSS／reader／索引相對主線零diff。產品與建置差異僅bundle loader、catalog、corpus、preview、checker，其餘為相關測試與QA；精準race已納入、legacy已用fidelity.files、diff --check通過。無阻擋發現；未把仍排隊的40078675707或正式發布列為通過。

ad681d5到達補修覆核：5行產品修改符合設計，無新增阻擋；僅初次自動到達且結果放不下才收合，保留控制尺寸、篩選與返回。原arrival兩個require與幾何assert均未改。另指出高視窗截圖同名覆蓋與gate可能已完成的證據缺口；已在診斷檔名加height，並於載入中互動前／釋放前明確assert !discoveryReady。這兩項為QA修正，非改產品斷言。

d63eec1整合覆核：最新main（686b38e）已完整納入，閱讀歷史程式未被覆寫；早讀以showDetail(false)建立訪次，同案例背景完成仍保留DOM／焦點／訪次，關閉後回呼重新比對網址避免重開。Back／Forward狀態及revealSearch(true)維持。研究資料、首頁、CSS與reader相對主線零diff，diff --check通過；無新增整合阻擋，最終雲端／正式發布另驗。
