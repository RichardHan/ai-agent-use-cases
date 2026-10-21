# 搜尋後先讀正文，再回查頁首

起始基準 `9f5e844`。原工作目錄分支 `improve/search-recall-recent-workflows-and-tokenization` 的 `assets/app.js`、`tests/search.test.cjs` 未提交修改完整保留，另建 `/tmp/ai-use-cases-20261022` 工作樹；主角色是唯一修改與整合者。fetch後無開啟中PR，無適用AGENTS.md。已讀README、歷史收錄／安全規則、Jekyll catalog及近期QA。原始案例、合格計數、協作者資料都未修改。

## 問題、方案與範圍

[正式站雲端基準39631210860](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39631210860)在1440及390寬走首頁、旅遊搜尋＋生活篩選、UC-001詳情與Escape返回。17筆結果，未載入來源清單為空；返回原閱讀按鈕。實際[手機詳情](baseline/before/detail-390.png)顯示搜尋命中只重複「標籤：旅遊、比價、付款前確認」，正文其實也有相關詞。這是介面流程觀察，不是假稱真人訪談。

目標讀者：從問題搜尋進入案例、希望繼續核對上下文的人。A完全移除頁首命中，較簡潔但失去頁首限定詞的定位；B優先正文、必要時回頁首，成本較低且保留能力。採B。正文仍依原段落順序與既有同義詞匹配，並非證據強弱排序。

驗收：正文與頁首均命中時選正文；只有頁首命中、沒有章節時仍可定位；保留原index、標題限定、否定敘述及原文字詞。桌面／手機／320窄螢幕、鍵盤、原生返回、來源新頁、直鏈重整、搜尋組合篩選、空結果、長內容及失敗復原須通過既有回歸。正文可以是本庫設計流程，不能宣稱一定是作者證據。UC-001「旅遊」實際以同義詞「旅行」命中「可複製提示詞（本庫原創設計）」，保留原標題及警語。

不處理：首頁任務入口、搜尋召回／排序、難度推估、證據重分類、原始資料、全文載入重構。無產品依賴、追蹤、cookie、儲存、登入或第三方資料傳送新增。

## 實作與檢查

- `assets/reader.js`：只將leading section標記為metadata，選擇搜尋導覽時將正文排前，回傳原section index；不移動原文。
- `tests/reader-search.test.cjs`：先寫正文優先及同義詞／頁首fallback測試，舊版兩項失敗；修正後148/148全通過。
- `tests/round22-browser.cjs`、`.github/workflows/round22-qa.yml`：雲端前後截圖與真實落點、原限定、焦點、來源、axe、分享直鏈重整；重用reader-search與reader三引擎回歸，以及Chromium discovery回歸。

本機只在授權目錄做Git、檔案、單元與靜態build；所有瀏覽器驗收於GitHub Actions執行，無個人GUI／瀏覽器操作。原型前後單元輸出見[checks](checks/)。指令：`node --test tests/*.test.cjs`，逐檔 `node --check assets/*.js tests/*.cjs`，`git diff --check`，`python3 scripts/preview.py /tmp/round22-preview/ai-agent-use-cases`。本repo沒有獨立lint、TypeScript或npm build，語法檢查未冒稱lint；實際Pages部署另外驗。

獨立角色未參與實作，唯讀審查無產品必修；18個相關單元與以既有renderer檢查413條目×7查詢共2891組，索引、命中字詞與fallback性質成立。審查指出UC-001落點是本庫設計提示詞，已修正驗收敘述與測試預期，避免宣稱先呈現作者實測。

模型：主會話無可核實／切換的runtime模型ID與推理設定，未宣稱使用帳號最強模型。獨立設計與審查透過協作工具請求 `gpt-6-astra / ultra`，不把請求當runtime證明。使用OpenAI Docs skill及[官方設定參考](https://learn.chatgpt.com/docs/config-file/config-reference)，文件不代表本帳號權限。僅既有訂閱工具與授權GitHub環境，無付費API或購買credits。

## 雲端結果

[完整預覽39632262360](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39632262360)成功，產品版本`f6e0a0e`起不再修改，驗收checkout為`3ee49df`。148/148單元、全部JS語法、靜態preview build、舊版兩項失敗重現及diff檢查通過。

三引擎reader-search與reader包含Chromium1440／390／320、Firefox390、WebKit390；discovery為Chromium三尺寸。本輪主要axe掃描共30次（2＋10＋15＋3）皆0違規，這不是完整WCAG認證。既有回歸中的pageerror斷言通過；原始研究完整性為413條目、2973章節、432行頁首證據。實際輸出見[檢查紀錄](checks/)，完整更多狀態圖保留於上述Actions artifact。

三種具體模擬走查均通過：
1. 旅遊＋生活17筆 → UC-001正文同義詞命中 → 鍵盤定位 → Escape回原閱讀按鈕 → 空結果修改關鍵字；直鏈重整仍保留生活與旅遊。桌面實開來源新頁，手機核對href；來源可用性不代表案例成果獲驗證。
2. 搜尋薪水 → UC-024同義詞「薪資」的否定／未實跑原文 → 命中原段與來源 → 返回結果；頁首限定詞、沒有章節、沒有真實命中與長標題另有受控fixture檢查。
3. 分享PR／UC-005長文 → 原生Back、完整目錄與來源 → 失敗報告UC-313／待查P-003維持限制；資料／腳本失敗與復原沿用reader套件。

以上皆自動化模擬，未宣稱真人滿意度或留存提高。reader-search報告的外站防護臨時query未存入repo，原Actions artifact保留原始輸出。

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440 | [頁首標籤](before/passage-1440.png) | [正文、同義詞及原創限定](after/passage-1440.png) |
| 手機390 | [頁首標籤](before/passage-390.png) | [完整換行的正文](after/passage-390.png) |

兩次中間失敗完整保留：[39631789867](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39631789867)測試錯誤預期媒體段，經獨立審查校正實際同義詞落點；[39631912375](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39631912375)axe需explicit browser context，修正後才得到上述成功，未當成產品既有失敗。測試最後另固定UC-001、加入pageerror與逐頁存檔，部署後套件會執行最終版本。

效能僅有雲端本地靜態server導航觀測：5配置DOMContentLoaded 30–68ms、load 34–148ms（[原始時間](checks/reader-timings.json)），不代表正式網路／全文可用時間或速度提升。reader.js未壓縮24,792→25,135 bytes；本機gzip估算8,099→8,222 bytes（+123），沒有Lighthouse分數或加速宣稱。

發布結果於正式站核對後補記。

預覽：執行上述preview build後，`python3 -m http.server 8133 --directory /tmp/round22-preview`，開啟 `http://127.0.0.1:8133/ai-agent-use-cases/?q=旅遊&scenario=生活&case=UC-001#explore`。

尚未驗證真人喜好、轉換率、實體手機、作業系統輸入法與完整輔具／WCAG認證；不提供未量測的效能分數。下一輪最有價值的是改善常見任務入口的語意：獨立審查發現「驗收」等廣義查詢涵蓋大部分內容，應以實際結果驗證較具體的問題入口。本輪不延伸修改。
