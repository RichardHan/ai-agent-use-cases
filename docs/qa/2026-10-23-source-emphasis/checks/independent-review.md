# 獨立只讀review

審查角色未參與主要實作；目標1ba117f。

第一輪發現P2：外層強調內的code／來源destination含`**`時被誤截斷，複合星號未保留。已補測重現並以scanner修正。

第二輪發現：不完整裸網址token為null可能throw；scanner與inline對多反引號、跳脫反引號的code辨識不一致。已補測並改用相同非空code token、完整URL匹配後才跳過。

最終結論：未發現新的必修產品問題，可進入瀏覽器驗收及合併。

獨立重跑45項相關單元通過。以Node VM對436來源檔跨版DOM比較：80檔變更、251 strong；除成對強調標記外文字一致；所有A的href／target／rel／label與CODE／PRE內容相同。另以18種fragment兩兩組合、3種外層包裝執行972項合成檢查，包含惡意scheme、HTML、不完整URL、多／跳脫反引號與含星號destination；無拋錯，連結與code相對基準相同，無IMG／SCRIPT／IFRAME。

上述為獨立角色回報的程式與Node VM結果，不是browser視覺、實機或完整無障礙認證；browser另外驗收。

## 發布時舊Facet QA失敗之獨立歸因

舊tests/facet-counts-browser.cjs:36固定scenario=開發、:57要求「旅遊＋開發必空」。獨立Node VM用各版真實parseFile／filterEntries與git blobs對照：8bfe3eb code+data、c1d6297 code+8bfe3eb data、c1d6297 code+data皆440條、同1結果UC-067，facet counts為全部31／生活19／開發1。原始基準9ebbcb2（439條）也已同1結果。UC-067:209／212有Gdrive-Time-Travel，「旅遊」同義詞展開含travel，現行全文子字串規則可命中。b61e2dc補證引入此段；其父版不命中、該版後命中。8bfe3eb→c1d6297案例／evidence／pending／copy.json無差異，filterEntries未修改。結論：既有資料耦合測試假設失效，不是本輪inline退化；保留FAIL，後續應用受控fixture或動態確認空組合。未啟動本機browser。

## 正式發布最終核對

獨立角色核對39901290115報告與正式桌面／手機圖，結論「最終可交付，無阻擋」。五配置首頁initialCorpus／corpus皆440、failed空，未使用重試；network／errors空、5個axe violations空。UC-313強調／搜尋原段定位、UC-089核准限制、空結果返回與手機換行符合預覽。來源popup僅1440有實開證據，不擴稱五配置皆開新頁。證據界線為首頁完整＋指定案例流程；後續各次導航非逐次全庫快照，先前90缺項根因仍未解。可只補文件及已驗QA變更後停止，不需改產品。
