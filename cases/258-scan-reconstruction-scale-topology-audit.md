# UC-258：掃描逆向重建的尺度與幾何失真驗收

- 網站標題：3D掃描變CAD，看起來像還不夠：尺寸、原點和孔洞都要核
- 一句話用途：把掃描量測與重建模型逐項比較，找出尺度翻倍、殼體失效與未覆蓋區域。
- 情境：開發
- 分類：掃描逆向建模
- 標籤：CAD、尺寸、曲面、失敗、驗收
- 工具：Grok Bot／Fairsolid／build123d
- 證據：B，作者實作及失敗報告；公開程式和測試源，無原始真掃描或完成STEP，未獨立執行
- 作者／語言：GitHub帳號living-relation（真名未核）／英文
- 日期：cleaned-tree首次提交2026-10-15 16:12:59 UTC；固定快照10-15 21:07:11 UTC。歷史正文日期屬作者自記，非獨立時間證明；查證2026-10-16 UTC

## 作者做了什麼

README明述Grok Bot使用Fairsolid處理與量測掃描，再依量測寫build123d參數模型。這支持實際使用歸因，但沒有逐次Bot對話或成品腳本，不能把所有歷史模型試跑都歸給Bot。

作者10/9計畫紀錄稱reference scan已產生9個開放B-spline面及STEP、基準、JSON和對照圖，自報覆蓋72%面積，不是完整重建。歷史報告記兩層正規化及不同網格慣例混用，造成2倍尺度錯誤；合成樣件修正後包圍盒接近，但BRep有效性問題未追完。另有五份真掃描的偏差表及10/8移除AI階段的記載。

公開測試源還保存錯原點、library測試通過後真掃描仍遇KeyError，以及包圍盒／體積看似符合卻多殼且無效的開發事故。這些是作者保存的紀錄，本庫沒有重跑或證明目前全部修復。

## 可借鑑流程

1. 保留原掃描的單位、基準方向、已知尺寸及不確定區域。
2. 記錄每次縮放、置中和座標轉換，不讓不同工具的預設慣例默默混用。
3. 同時核尺寸、曲面覆蓋、孔洞、殼數與幾何有效性，不只看外觀。
4. 對合成樣件與真掃描分別驗收；前者成功不推出後者能處理。
5. 公開偏差和未解例外，完整成品未取得就不要宣稱可製造。

## 可貼指令（本庫自設，未執行）

只讀這份合成、非承重樣件的已知尺寸、轉換表及返還統計。逐項核單位、尺度、原點、孔洞、殼數、偏差與未覆蓋區，分開模型可讀、幾何有效、尺寸符合。指出報告摘要與表格矛盾，沒有原掃描或成品就標待核。不執行工具、不產生加工或車件操作指令、不上傳私人設計、不部署。交一份證據及缺口表供工程人員審查。

## 限制、權限與成本

公開樹未見真掃描、runs結果、完成STEP或Bot產生的建模腳本；測試原碼不是測試通過證明。報告聲稱每件神經結果較差，但部分對照結果缺失，另有最佳包圍盒的敘述與表格不符，因此不引用排名、普遍精度或安全結論。

STEP交換檔不等於保留原Python參數化建模歷史；需要原生腳本和依賴另行核對。STL／OBJ的單位解讀也需確認。這些是格式核對背景，不是作者成果認證。

安裝第三方程式、模型下載、設備存取、外傳掃描及加工均需另行授權。作者完整成本未核；本庫未下載模型、跑專案或操作設備。實際零件的安全、材料與公差需專業驗收，不依本頁製作安全關鍵零件。

## 去重與來源

不同UC237草圖新設計、UC162網格減面、UC197既有零件裝配：本案終點為帶噪掃描重建後的尺度、曲面及拓撲核對。五份零件及各方法只計一案。

- [固定版本使用歸因](https://github.com/living-relation/fairsolid/blob/d9e17517da580bca3c1df93b73418bfa4741c30e/README.md)
- [局部曲面成果紀錄](https://github.com/living-relation/fairsolid/blob/d9e17517da580bca3c1df93b73418bfa4741c30e/docs/SURFACE_FIT_PLAN.md)
- [方法與失敗報告](https://github.com/living-relation/fairsolid/blob/d9e17517da580bca3c1df93b73418bfa4741c30e/docs/AI_METHODS_REPORT.md)
- [管線測試源](https://github.com/living-relation/fairsolid/blob/d9e17517da580bca3c1df93b73418bfa4741c30e/tests/test_pipeline.py)與[掃描測試源](https://github.com/living-relation/fairsolid/blob/d9e17517da580bca3c1df93b73418bfa4741c30e/tests/test_refscan.py)
- [Autodesk網格單位背景](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/How-to-insert-a-mesh-body-into-Fusion-360.html)
- [CadQuery交換格式限制](https://cadquery.readthedocs.io/en/latest/importexport.html)
