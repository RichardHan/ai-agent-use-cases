# 從口語問題回到有用的搜尋詞

目標讀者：第一次以完整中文問句找做法、還不知道案例術語的新訪客。正式站 390px 搜尋「我想安排裝修尺寸複量」顯示 0／452，空結果只給郵件、會議等固定熱門任務；問句內的「裝修」實際可搜尋到 6 筆文字命中，不能因此聲稱六筆都解決尺寸複量。

- A（採用）：在沒有更精確的多詞刪減復原時，只從已載入案例的原有標籤找問句內逐字出現的 2–6 個中文字詞；只列真實有結果、且不超過已載入條目一成的至多三個候選。按下才改寫查詢，保留篩選與 URL；顯示「文字命中」而非已驗證解法。成本為一個局部空結果計算和測試，沒有新服務。
- B：全面中文斷詞和語意擴查，可找更複雜問句，但需要評估誤命中、排序及索引成本；本輪不做。

驗收：原問句未按候選前保持 0 結果及原 URL；「裝修」候選得到 6 筆；保留生活篩選得到 4 筆；無關問句、過廣詞、零資料不編造候選。詳情、返回、直鏈重載、來源連結、鍵盤焦點與窄屏無退化。原始 Markdown、證據與資格計數不變。

| 視口 | 修改前正式站 | 修改後本地預覽 |
|---|---|---|
| 390×844 | [空結果](before-mobile.png) | [問題詞候選](after-mobile.png) |
| 1440×900 | [空結果](before-desktop.png) | [問題詞候選](after-desktop.png) |

預覽：`python3 scripts/preview.py /tmp/visitor-phrase-preview/ai-agent-use-cases && python3 -m http.server 8766 --directory /tmp/visitor-phrase-preview`，開啟 `http://127.0.0.1:8766/ai-agent-use-cases/`。兩側截圖為相同查詢、不同部署版本的實際 Chromium 視口；本地預覽非已發布站。正式站來源連結版本與本地預覽的 `main` 連結不同，不能以此比較發布憑據。

基準：`node --test tests/*.test.cjs` 356 pass／0 fail。先加回歸測試時 `phraseRecoveryOptions is not defined` 失敗；首次全套 356 pass／1 fail，因舊簡化測試條目沒有 tags，已修正空值處理。最後新增廣泛詞／零資料邊界測試後，`node --test tests/*.test.cjs` 358 pass／0 fail；`node --check` 全 assets JS 與 tests CJS 通過；`python3 scripts/check_corpus_bundle.py /tmp/visitor-phrase-preview/ai-agent-use-cases` 450 個來源逐 byte 一致。專案無獨立 lint/typecheck 指令，本機未執行 Jekyll。

模擬走查（非真人偏好）：① 口語裝修問句 → 點候選 → UC-299 詳情 → Escape 返回，6／452 和查詢保留；② 加生活篩選後候選顯示 4 筆，點擊後 URL 保留 scenario；③ 無關問句維持原通用入口，UC-299 直鏈可重載。鍵盤聚焦候選 outline 為 solid，Enter 得 6 筆；390px `scrollWidth-innerWidth=0`；候選前景 rgb(40,83,68)、背景白色。獨立 reviewer 未發現阻擋項，但提醒單元測試僅合成 helper；上述實際 DOM 流程補足此限制。

未解風險：逐字標籤仍非語意相關性；最多一成只是避免幾乎全庫命中的詞，並非品質分數。Actions 在本輪基準 commit 35 次執行中 4 失敗、2 取消；其中 Print reading QA `40236716205` 的 `round-browser.cjs:54` 斷言「長標題下仍容納兩行用途」失敗，是與本輪空結果不同的既有路徑，需另案修正；不視為此功能已發布。下一輪優先改善詳情手機版的多個方法／來源入口選擇負擔。
