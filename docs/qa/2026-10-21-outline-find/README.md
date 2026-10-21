# 長篇案例：依標題找段落

目標讀者：帶著具體問題回訪長案例、想核對某次補充與限制的人。

實際正式站走查：首頁→搜尋「旅遊」→生活篩選→UC-001→返回，桌面1440與手機390都可完成，來源連結實際開啟至原文網站。UC-005 已累積34個段落；手機全部目錄需逐項掃描，後段「獨立審查」在第33段。沒有把模擬走查當真人滿意度或轉換成果。

## 兩案與驗收

- 逐段前後切換：適合順讀，但增加每段控制、仍難找到指定補充，成本中等。
- **目錄內找段落（採用）**：保留原標題與段號，快速縮小長目錄，成本較低；只找標題，不聲稱搜尋正文。

12段以上的目錄提供查找，短篇維持簡單目錄。驗收：寬度1440/390/320，關鍵字與多詞交集、重複標題、零符合、清空、Enter定位、原文焦點、返回、直鏈與刷新、中文IME保護、無橫向溢出。保留原文、來源、證據限定、分享條件與列印內容。沒有重寫案例、改評級或新增追蹤/儲存/依賴。

## 前後截圖

| 尺寸 | 修改前 | 修改後 |
| --- | --- | --- |
| 桌面1440 | [原目錄](before-desktop.png) | [找到第33段](after-desktop.png) |
| 手機390 | [原目錄](before-mobile.png) | [找到第33段](after-mobile.png) |

[320px排版](after-320.png) · [零符合](empty-mobile.png)。所有畫面由實際瀏覽器擷取。

## 測試與實際結果

基準 `2f922ac`：144/144測試、全部前端JS語法與靜態預覽成功；沒有獨立lint/TypeScript/npm build。先新增測試確認舊版缺少能力（[red](red-unit.tap)），再實作。獨立審查抓到IME確認誤導覽，先重現（[red](red-ime.txt)），再補composition狀態、isComposing與229保護。

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/outline-find*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/ai-round-preview/ai-agent-use-cases
python3 -m http.server 8094 --directory /tmp/ai-round-preview
NODE_PATH=/tmp/ai-round-tools/node_modules node tests/outline-find-browser.cjs
OUTLINE_ENGINE=firefox NODE_PATH=/tmp/ai-round-tools/node_modules node tests/outline-find-browser.cjs
OUTLINE_ENGINE=webkit NODE_PATH=/tmp/ai-round-tools/node_modules node tests/outline-find-browser.cjs
```

新版146/146測試通過。Chromium三尺寸、Firefox390、WebKit390，三種具體情境完成：①旅遊＋生活→短篇→返回→空結果復原；②長篇直鏈/重整→找獨立審查→原文→返回目錄；③重複的未測指令→零符合→清空→稀疏待查。10次axe掃描零違規；完整結果見[Chromium](chromium.json)、[Firefox](firefox.json)、[WebKit](webkit.json)。UI沒有新增網路請求；未量測Lighthouse或宣稱效能分數。

既有廣域 `tests/reading-flow-browser.cjs` 在本機WebKit的第100行（Tab到按鈕）失敗，[修改前](reading-before.txt)與[修改後](reading-after.txt)同樣失敗；Chromium三尺寸與Firefox已走到後續情境。新版專項如實記錄WebKit `nativeTabToReturn:false`，以直接聚焦既有返回按鈕再Enter繼續驗證；這不等於WebKit原生Tab循環通過。macOS WebKit預設鍵盤行為是目前限制，未為本輪去改個人系統設定。`tests/reader-browser.cjs`亦在WebKit的mobile-search第31行遇到同類Tab跳過按鈕；已用未修改基準單獨重現[相同斷言](mobile-keyboard-before.txt)。IME只有事件模擬，未測實體輸入法/讀屏器。靜態預覽不等於正式Jekyll部署。

## 獨立審查與模型

主代理是唯一整合者。獨立唯讀審查代理使用工具明確設定 `gpt-6.1-sol` / `ultra`，未修改檔案，確認最新差異可合併。獨立覆核146/146單元、三尺寸3次axe零違規、背景載入後保留查找值與焦點、惡意文字安全、原文HTML未改、列印media排除導覽並還原狀態。這3次獨立掃描未混入上述10次主驗收。

本機Codex設定檔為 `gpt-6.1-sol` / `medium`；無法證實或切換主對話的實際模型/推理，未宣稱主代理使用最高設定。[官方模型與推理說明](https://learn.chatgpt.com/docs/agent-configuration/subagents)。只使用既有訂閱工具，沒有使用另付費API。Orca CLI因symlink解析失敗而停用，改用獨立Git worktree，原工作樹兩份未提交搜尋修改保留。

下一輪優先：改善長篇目錄的補充版本層級，讓使用者更容易區分原始案例與後續補讀；不要把來源更新日當成全案重驗。

## 整合與發布

已安全整合上游研究PR #74（`312bdf7`），整合後146/146與Chromium三尺寸專項通過。原工作樹未提交搜尋修改未變。本輪修改：`assets/reader.js`、`assets/reader.css`、兩份outline-find測試、一份專項workflow、SITE維護摘要與本驗收附件。

[首輪雲端QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39605885690)成功；下載artifact確認Linux三引擎五配置全部完成、10次axe零違規，WebKit原生Tab亦通過。最後測試補強僅把WebKit替代驗證限定macOS並新增返回焦點斷言，[最新雲端QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39606188295)亦成功，包含新增返回焦點斷言及Linux原生Tab要求。

CLI建立PR被GitHub Enterprise Managed User存取限制拒絕；採使用者明確授權的SSH非強制推送整合至main，保留上游歷史與研究內容，不冒稱已建立PR。

### 正式站驗收完成與仍紅的廣域檢查

本輪整合提交 `4379277` 已非強制推送至main；[正式Pages建置與部署](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39606557171)成功。[main專項QA](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39606558615)成功。正式站reader.js與reader.css逐byte等於checkout；Chromium1440/390/320的完整三情境通過、6次axe零違規，見[正式站報告](published.json)、[正式手機截圖](published-mobile.png)。[載入核對](published-corpus.json)：413筆網站總條目、failedPaths空、詳情開啟且34個目錄段落；這不是嚴格合格案例數。

仍有廣域CI失敗，不宣稱全部綠燈：[Reader controls](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39606558609)正式站詳情30秒逾時；[Reader context](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39606558537)正式首頁明確回HTTP429；[Evidence round](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39606558683)正式站詳情10秒逾時，該雲端逾時根因未確認。CLI重跑被GitHub拒絕（須repo admin），沒有更動權限。直接重跑相同reader-controls腳本，在Chromium四尺寸與Firefox390共5配置通過、5次axe零違規，見[部分報告](published-controls-partial.json)；WebKit首頁收到GitHub Pages『Rate limit exceeded』頁，沒有JS環境，故其餘正式站廣域檢查無法完成。Reader-context也在後續首頁導覽失去JS環境而中止，不能當通過。未公開限流畫面上的IP資訊。

為避免再增加負載已停止額外正式站請求，未取消協作者工作、未放寬產品斷言、未把429說成已修復。所有本輪產品驗收已在限流前通過，廣域失敗與後續限制單獨保留。下一輪最高優先改為：集中、節流並在Pages部署完成後執行正式站驗收，避免多個workflow並行重複抓取全庫；長篇補充版本層級為後續產品題目。

收尾CI快照：31個廣域workflow中25個已完成，另[Improvement round](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39606558633)於正式站等待response 12秒逾時；至此共4項失敗（1項明確429、3項逾時），不能將全部逾時歸因於限流。Reading flow、Source guide、Case sharing、Reader source links、Filter entry、Reading anchor仍執行中，未宣稱通過。專項驗收、正式部署、資產比對與正式站三尺寸結果已達本輪標準，未為等待所有廣域檢查而繼續對正式站施壓。
