獨立角色 independent_review 未實作產品或改檔；檢查基準、selector、八配置harness與workflow。初次阻擋：僅等discoveryReady可能將失敗載入誤算完成。已補before status>0、after status===0、全部來源failed空斷言。最終無新增阻擋項；建議手機水平left>0及正式資產比對亦已納入。產品assets零diff。最終本輪完整預覽39937498291成功；正式39937449362新八配置完成、原表格回歸在第三配置缺328來源而整趟失敗，不能稱正式全綠。

f122662再審：website-qa只固定ubuntu-24.04，原Playwright版本、斷言及權限未變，產品assets零diff；原始失敗log僅trim行尾空白。git diff --check成功。無新增阻擋，但須以新雲端實際安裝與原測試結果驗收，不能僅憑設定宣稱整套已綠。

0a4db2e再審：匹配的官方v1.56.1-noble image與npm工具版本一致，刪除live apt／browser安裝但全斷言、測試與contents:read不變。Noto限定90s curl及workspace限定safe.directory與既有模式一致，無新增阻擋。需以新CI實際瀏覽器啟動與後續測試為準，原失敗與未完成run保留。