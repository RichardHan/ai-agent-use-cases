# 2026-10-20：長結果列表回到搜尋與篩選

對象：從情境或問題開始探索、閱讀幾筆後想縮小條件的新訪客。

## 問題與選擇

[正式站基準走查39338970016](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39338970016)完成桌面1440×1000、手機390×844的首頁、旅遊＋生活、詳情、原文來源開啟與Escape返回。來源URL正確、焦點返回且無pageerror。當時357張結果全部呈現，頁高46495／133186px；搜尋與篩選離開視窗後，列表內沒有回到搜尋的明確入口。[原始JSON](report.json)。不是訪談或轉換率研究。

- A：分批顯示結果，適合大量瀏覽，也能減少DOM；但須同步處理詳情鄰居、返回位置與分享還原，成本較高。
- B（採用）：每六張卡片後及列表末尾提供原位「回到搜尋與篩選 ↑」，成本較低，保留既有完整集合與閱讀流程。

獨立設計角色建議六張，同時整除3／2／1欄，不新增sticky/fixed遮擋或首卡之前的高度；原位連結不代表已閱讀進度。零結果沿用現有恢復區。驗收涵蓋0／1／6／7／12／15筆、全庫、手機首卡距離<240px、44px目標、Enter／修飾鍵、保留條件及history state、補讀焦點、直鏈重整、返回及原有完整閱讀回歸。

不處理分批載入、搜尋排序／同義詞、來源分類、案例改寫、框架更換或新增第三方服務。沒有新增追蹤、cookie、儲存或外部請求。

## 基準、協作與模型

原工作樹`improve/search-recall-recent-workflows-and-tokenization`有`assets/app.js`及`tests/search.test.cjs`未提交內容，完整保留。repo／祖先無適用AGENTS.md；已讀README、歷史維護規則、Pages設定、近期來源說明與搜尋閱讀QA。初始最新遠端7cd3638，無開啟PR；另建隔離工作樹`/tmp/ai-task-discovery-20261020`，主角色為單一整合者。未reset、強推或修改其他工作樹。

初始100項單元、所有JS語法、Python預覽通過，沒有另設lint／TypeScript／npm build。正式部署為legacy Jekyll main/root。Orca CLI報`Unable to determine Orca.app path from symlink: /usr/local/bin/orca`，停止該CLI；只操作授權檔案／Git及既有GitHub Actions雲端headless瀏覽器，未操作個人GUI或啟動本機瀏覽器。

本機設定預設`gpt-6.1-sol`／`medium`，不能確認或切換主對話實際runtime，沒有宣稱已使用帳號最高模型。[OpenAI官方設定參考](https://learn.chatgpt.com/docs/config-file/config-reference)也不能證明本對話runtime。獨立設計與review角色派工指定工具提供的`gpt-6-astra`／`ultra`，僅表示請求；沒有另付費API或購買credits。

協作者新增360–362後正常merge遠端c63190a，無衝突。其未改本輪產品檔案。在未加本輪功能的c63190a另建只讀基準並重現原有三失敗：[基準失敗](c63190a-baseline-failures.tap)。必要整合維護：首頁同步既有稽核315（不是本輪獨立重現），網站總條目由357增360；UC314搜尋交叉引用明確核對IDs為UC067／UC314／UC362；共享來源候選46增47，唯一新增群組為[note.com來源](https://note.com/sustainamate_ai/n/n26d37039c129)，成員UC225／UC234。只列候選，不刪頁、不改原文、不新判重複。獨立角色自行以兩基準重算並核對相同結果。

## 實作與測試

產品：`assets/app.js`以resultCards保持完整順序，插入原位連結；靜態與動態入口共用enterSearch，保留中鍵／修飾鍵／已取消事件、replaceState原state、取消晚到捲動與搜尋焦點。補讀重建時保留同一序號入口，若末尾序號改變則選新末尾，無入口才回到結果數。`assets/style.css`僅增加全欄原位連結與44px目標。`index.html`僅同步315。

先寫兩項搜尋交接測試，舊版缺enterSearch而失敗：[紅燈](red-unit.tap)。雲端另固定7cd3638用同一瀏覽斷言重現沒有入口：[紅燈](red-browser.log)，不以修後才寫的分析充當重現。最終103項本機單元通過：[輸出](after-unit.tap)。新增補讀焦點邊界測試包含5→6、6→7、7→12、356→357及無結果。

首輪雲端39339388924的新流程已走完五配置與三情境，但補讀fixture用程式click重試後誤以為不移動焦點；實際既有重試handler會聚焦重試按鈕，故assert undefined≠6。已改用真click啟動、暫緩單一來源、在等待期間聚焦返回入口、再釋放請求，保留焦點與可見性斷言。這是測試錯誤，沒有稱為網站缺陷。第二輪39339484542是上述協作者基準三失敗，已保留未加功能的重現，不忽略原測試。

獨立review發現非六倍數末尾入口補讀後不存在而跳到頂端，與主整合者同時發現，82a409d已補修；獨立VM固定commit重驗5→6、6→7、7→12、356→357、359→360、360→361均正確。另依review保留原序號仍存在時不強制改新末尾，red輸出分目錄避免覆寫兩尺寸基準JSON。

## 指令與預覽

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/results-return-preview/ai-agent-use-cases
python3 -m http.server 8130 --directory /tmp/results-return-preview
# http://127.0.0.1:8130/ai-agent-use-cases/#explore
# 雲端runner安裝Playwright與axe後：
NODE_PATH="$RUNNER_TEMP/return-tools/node_modules" node tests/results-return-browser.cjs
```

完整瀏覽環境與原始回歸指令見[workflow](../../../.github/workflows/results-return-qa.yml)：新功能三引擎五配置、原source-guide、discovery及reader；後兩者包含原mobile-search門檻。Python預覽模擬Liquid目錄，不代替正式Jekyll建置。

三個模擬情境：隨意探索六張後回搜尋旅遊＋生活，讀第七張並原生Back；長搜尋無結果再修改；分享UC001＋旅遊生活直鏈、重整、關閉、末尾返回。另驗部分503、等待補讀時移動焦點、錯誤與重試。模擬不代表真人喜好、留存或成效。

## 驗收結果與前後畫面

雲端、完整截圖、獨立最終審查及發布結果確認後追加。最初正式站首頁／搜尋／詳情截圖在本目錄；同基準同第六張位置的前後圖以雲端實際產物為準。

## 限制與下一輪

未驗實體手機、螢幕閱讀器或真人偏好；axe不代表完整無障礙認證。全結果仍一次呈現，列表未縮短；沒有聲稱載入或轉換率提升，沒有Lighthouse分數。來源頁受第三方限制。下一輪最值得做：在可正確調整Pages建置時量測並減少全文請求，保留原文一致性、早讀與部分失敗復原。
