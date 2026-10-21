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
