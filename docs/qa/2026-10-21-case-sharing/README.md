# 案例分享：帶回閱讀條件，清楚確認複製結果

## 基準、問題與選題

2026-10-21 從最新 `origin/main` `1a704e7` 建立隔離分支 `improve/reader-next-step-20261021`，工作樹 `/tmp/ai-reader-next-step-20261021`。原工作目錄仍保留原分支及 `assets/app.js`、`tests/search.test.cjs` 未提交修改，沒有 reset、stash、強推或覆寫。已查 repo／上層 AGENTS.md（未找到）、README、歷史維護規範、SITE、建置部署與近期QA；起始無 open PR，保留其他工作樹。

目標使用者：找到適用案例後，想分享給同事或留待下次閱讀的人；手機與鍵盤使用者也需要確認是否複製成功。

[正式站基準雲端39471299006](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39471299006)實際以Chromium1440×1000／390×844／320×740走完首頁、旅遊搜尋、生活篩選、詳情、來源與Escape返回。395條目、無來源載入缺項、原始Markdown實際開新頁且HTTP200。來源頁可用性僅代表本次請求。

三尺寸的分享按鈕皆32.140625px高、11px字。透過history加入**合成測試值**`unrelated=synthetic-marker#unrelated-fragment`後，複製成功與拒絕時提供的網址都帶出無關參數／錨點；成功只改按鈕文字2秒，無狀態區。手動欄位雖已全選，但受全域input樣式影響，沒有可見焦點外框。[原始報告](before/report.json)。基準axe皆0，顯示自動掃描並不能替代這些流程檢查。

- A（採用）：修好原有分享按鈕，建立閱讀條件白名單、持續狀態、可靠手動複製與焦點。成本低，無額外操作步驟。
- B：另建分享面板。適合未來多種分享格式，但目前只有一個案例網址，多一層操作、焦點與手機高度維護成本。

預期改善是讀者能辨認分享結果，接收者能回到同一搜尋情境。這是模擬檢查，不代表真人喜好或轉換率已提升。本輪不改案例、來源分類、搜尋語意、資料載入架構或框架；不新增難度、案例、追蹤、cookies、登入或第三方傳輸。合格數344與網站395條目分開，來源內容與計數均不修改。

## 實作與驗收標準

- `caseLink`沿用搜尋分享的URL建構，只保留q、scenario／kind／tool／category／proof、合法reviewed排序與目前case；去除其他參數、重複值及無關hash，統一返回`#explore`，保留GitHub Pages子路徑。使用者搜尋與篩選本身會被分享，畫面明說；這不是所有文字的隱私遮罩。
- 預先建立`role=status`、`aria-atomic=true`，成功及失敗持續可見；按鈕有固定可存取名稱。拒絕／無API時顯示唯讀全選欄位與手動指示，重試成功清掉舊欄位。
- 每次請求有序號，完成時核對本次、節點仍連接、目前案例與dialog仍開啟；舊resolve／reject不跨案例更新狀態或搶焦點。
- 分享按鈕至少44px／14px，原文連結至少44px高；手動欄位保留清晰焦點，不更換品牌色。保留原有公開Markdown來源。

驗收三種情境：

1. 從首頁找旅遊＋生活，讀來源後以鍵盤分享；拒絕時手動複製，再試成功。
2. 接收實際複製的網址，打開、重新整理、關閉閱讀、再打開後原生Back，保留案例與查詢條件。
3. 長文閱讀、空結果復原，再以五類篩選＋最近核對排序分享，收件後結果集合不變。

另外測試無Clipboard API、關閉／換案／重開後延遲拒絕、新舊請求相反順序完成；舊請求不改新回饋、不移焦點。五配置Chromium1440／390／320、Firefox390、WebKit390，檢查尺寸、對比、鍵盤焦點、長文字與水平溢出；真實Chromium Clipboard API另在雲端runner驗證。注入的拒絕與延遲是受控故障測試，不宣稱來自真實權限故障。

## 指令與結果

- 基準`node --test tests/*.test.cjs`：125/125通過（本機及雲端），無基準單元失敗；[雲端TAP](baseline-unit.tap)。
- 先新增`node --test tests/case-share.test.cjs`：舊版2項失敗，因沒有安全案例URL helper；[red輸出](red-unit.tap)。舊版瀏覽報告另直接記錄實際無關參數被帶出。workflow固定以`1a704e7`重現red。
- 修改後全套127/127通過。`node --check`逐檔、`git diff --check`及`python3 scripts/preview.py <output>/ai-agent-use-cases`通過；無獨立lint、TypeScript或npm build，不把語法檢查稱作lint。
- 雲端：`NODE_PATH=<runner-tools>/node_modules SHARE_URL=<preview>/ai-agent-use-cases/ SHARE_OUTPUT=qa-artifacts/share-after node tests/case-share-browser.cjs`。回歸既有`tests/discovery-browser.cjs`、`tests/reader-browser.cjs`及`tests/search-submit-browser.cjs`。
- 前端無新增依賴、網路請求或儲存。測試工具只安裝在既有GitHub runner。[檔案與gzip大小](asset-sizes.json)僅是傳輸大小估算，不冒稱端到端速度提升或Lighthouse分數。

## 預覽與前後截圖

正式體驗：[案例直鏈](https://richardhan.github.io/ai-agent-use-cases/?q=旅遊&scenario=生活&case=UC-001#explore)。修改尚須完成雲端驗收及正式發布，結果在下方補記。

```sh
python3 scripts/preview.py /tmp/share-preview/ai-agent-use-cases
python3 -m http.server 8140 --directory /tmp/share-preview
# http://127.0.0.1:8140/ai-agent-use-cases/?q=旅遊&scenario=生活&case=UC-001#explore
```

Python預覽模擬Liquid，不等於正式Jekyll；正式Pages部署另驗。原始前圖在`before/`；後圖與雲端結果驗收完成後保存。

## 模型、環境與限制

可讀設定預設`gpt-6.1-sol / medium`；主對話無可核實／切換實際模型的介面，不能聲稱已用帳號最強模型。已讀OpenAI Docs技能及[官方設定參考](https://learn.chatgpt.com/docs/config-file/config-reference)，文件不是本帳號權限證明。獨立設計／審查角色明確請求協作工具提供的`gpt-6-astra / ultra`，仍不等同可驗證runtime。主角色唯一寫入與整合，review只讀。

只使用授權目錄、既有Git／SSH及GitHub Actions，無付費API或購買credits，無個人GUI控制。Orca CLI報`Unable to determine Orca.app path from symlink: /usr/local/bin/orca`後停止該介面，以原生Git安全建立工作樹。

未驗證真人、實體手機、真人螢幕閱讀器或實體Safari；axe自動零違規不等於完整WCAG認證。成功／拒絕狀態以DOM與可存取屬性驗證，不能冒稱已聽到真人輔具播報。下一輪最值得做的是降低首次全文載入成本，同時保留直鏈先讀及失敗復原。

## 最終預覽驗收與獨立補修

[最終雲端39472309659](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39472309659)（產品`f48d078`）成功：127/127單元、逐檔語法、靜態預覽、固定舊基準red、五瀏覽器／尺寸配置與三種情境全部通過；本輪15次axe掃描皆0，無pageerror或水平溢出。按鈕五配置都是44px／14px，手動網址唯讀、全選、2px可見焦點。實際Chromium Clipboard API成功；拒絕／無API／延遲用受控測試注入，沒有操作使用者的剪貼簿。

[本輪完整原始報告](after/report.json)、[最終單元TAP](final-unit.tap)。`control.live=null`指按鈕本身；通知在旁側status，另有ariaSnapshot與polite／atomic斷言。race報告`status`欄記的是舊請求完成**之前**的文字；moved-focus另直接斷言完成後是失敗文字且焦點未移，不能把欄位誤讀成最後狀態。收件者初次打開與重整均驗案例，完整條目與零缺項斷言在重整後，不誇大成每次載入均已完整核對。

既有discovery、reader、search-submit三套完整回歸通過；全庫395條目、2,802章節、414行證據一致（[資料完整性](reader-corpus.json)）。Reader另檢查缺證據、重複／不安全文字、catalog失敗與重試、reader腳本缺失、單一Markdown失敗、copy文案缺失。原始無障礙／搜尋／載入量測在[回歸紀錄](regressions/)；這些自動檢查不等同真人研究或完整無障礙認證。

基準來源請求HTTP200；最終本輪預覽的同一GitHub原始Markdown請求HTTP429，仍實際核對新頁URL，未把429算成來源可讀。原search-submit另一次來源請求HTTP200，不代表所有時點皆可用。未公開外站回應HTML、客戶端IP或憑證。

第一版[39471867678](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39471867678)也曾通過，但獨立審查抓到：成功時可見label與固定名稱不同、初始status被display:none；已修後才執行以上最終驗收。可見按鈕文字固定，成功只更新旁側狀態；空status保持可存取但不占版面。另補同案例移走焦點後延遲拒絕的防搶焦點與測試。更新舊discovery斷言為驗status與真實clipboard，沒有刪除複製成功／拒絕驗收。

| 尺寸 | 修改前手動複製 | 修改後手動複製 |
| --- | --- | --- |
| 桌面1440 | [前](before/manual-chromium-1440.png) | [後](after/manual-chromium-1440.png) |
| 手機390 | [前](before/manual-chromium-390.png) | [後](after/manual-chromium-390.png) |
| 窄螢幕320 | [前](before/manual-chromium-320.png) | [後](after/manual-chromium-320.png) |

[成功狀態前圖](before/success-chromium-1440.png)／[成功狀態後圖](after/success-chromium-1440.png)。主角色已目視桌面、390與320對照：完整標題、操作、狀態及焦點可辨識，無重疊；較窄時原文連結自然換行，不縮小觸控尺寸。Firefox／WebKit手機圖亦保存於after。兩張手動圖皆是實際拒絕路徑，沒有繪製示意畫面代替。

JS／CSS gzip共增加362 bytes；[reader載入量測](regressions/reader-timings.json)是未節流的雲端本地預覽單次資料，不代表完整395筆全文就緒或真實手機效能，未提供Lighthouse分數，也未宣稱加速。

變更檔案：`assets/app.js`（URL與分享生命週期）、`assets/style.css`（觸控／焦點／狀態）、`tests/case-share.test.cjs`（URL回歸）、`tests/case-share-browser.cjs`（三情境與故障）、`tests/discovery-browser.cjs`（對齊固定label的新status契約）、`.github/workflows/case-share-qa.yml`（雲端預覽及正式發布）、`SITE.md`及本QA目錄（證據）。

最終獨立review已閱讀上述原始報告與實際前後截圖，結論「可合併，未發現必修」。Firefox成功態截圖未見額外focus-visible外框，未另量測該成功按鈕outline，故不泛稱所有狀態的焦點樣式都已實測；手動欄位五配置可見焦點已有斷言。主角色沒有把review角色當真人使用者。
