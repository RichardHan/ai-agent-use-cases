# 2026-10-20：從搜尋接回原始段落

對象：從問題或同義詞搜尋到案例、需要核對實際上下文的訪客。

## 證據與選擇

實際走查正式站1440×1000、390×844：首頁→搜尋薪水→UC-024→展開原文→來源連結→返回搜尋；另檢查旅遊＋生活組合篩選。卡片有薪水→薪資的原文命中，但詳情折疊研究、沒有延續搜尋線索。真正命中是「不登入系統、改派車、算薪資…」的自設只讀限制，不能當成已實作成果。原文研究1799字元。

- A：全文查找及逐筆高亮，適合精確逐字查找；Unicode、連結與重複段落的處理成本高。
- B（採用）：最多兩個原文命中段落捷徑，保留同義詞關係與原始標題；低成本接回既有閱讀流程。

驗收：真實原文匹配才出現捷徑，點擊才展開、聚焦正確原文標題，焦點在工具列下方；同名標題以索引識別。無章節／頁首匹配接回原研究summary。不得把人工標籤或清單相鄰列拼成命中。保留否定、未實測、來源、分享參數、直鏈重整與返回流程。

不處理：搜尋分詞／排序、全文高亮、案例資料、重複候選、證據分類或統計；312合格案例與357網站條目分開維持。無產品新依賴、追蹤、cookies、登入、儲存或資料傳送。

## 基準與隔離

讀README、歷史維護規則、SITE、Pages設定及既有QA；repo與祖先無AGENTS.md。原工作樹停在`improve/search-recall-recent-workflows-and-tokenization`，`assets/app.js`及`tests/search.test.cjs`有未提交修改，完整保留。遠端無開啟PR。單一主角色在`/tmp/ai-case-improvement-20261020`隔離clone整合；未reset、強推或操作個人GUI。

真正基準`59351c1`。隔離clone最初錯把本機舊main當origin/main；獨立審查抓到舊手機工具列差異，已停止修改、fetch真正遠端並rebase。CSS尾端衝突核對後保留遠端完整工具列＋僅追加本輪樣式；重跑真正基準78/78測試與紅燈。此錯誤版本未push或發布。

Orca CLI錯誤`Unable to determine Orca.app path from symlink: /usr/local/bin/orca`，停止Orca操作，使用獨立Git checkout。本機Codex config是`gpt-6.1-sol`/`medium`；無runtime型號、推理強度或切換控制，無法宣稱帳號最高設定。獨立審查指定`gpt-6-astra`/`ultra`，不等於核實runtime。未另接付費API或購買credits。

## 實作與獨立審查

`app.js`傳現有tokenize與termVariants；`reader.js`只從已安全render的原始研究收集段落文字與href，NFKC與大小寫正規化比對，最多兩個不同段落。捷徑保留原始標題及同義詞，提醒命中可能為限制／否定；不自動改變首次閱讀位置。`reader.css`沿用綠色與紙面風格，44px以上按鈕、窄螢幕換行。

獨立角色沒有主要實作，審查diff、實際開瀏覽器與讀截圖。其發現的舊基準與UL/OL相鄰列串接假命中已修；新增反例驗證。另驗320px工具列44px／14px、Space開啟捷徑、無章節、同名標題、Unicode、長標題、reload／返回；新功能沒有對外資料請求。

## 截圖與預覽

同一真正基準、同一搜尋、鍵盤開啟詳情：

| 尺寸 | 修改前 | 修改後 | 跳到原文 |
| --- | --- | --- | --- |
| 1440×1000 | [桌面](before-desktop.jpg) | [桌面](after-desktop.jpg) | [原文](target-desktop.jpg) |
| 390×844 | [手機](before-mobile.jpg) | [手機](after-mobile.jpg) | [原文](target-mobile.jpg) |

[正式站驗收連結](https://richardhan.github.io/ai-agent-use-cases/?q=%E8%96%AA%E6%B0%B4&case=UC-024)。本機預覽：

```sh
python3 scripts/preview.py /tmp/reader-preview/ai-agent-use-cases
python3 -m http.server 8098 --directory /tmp/reader-preview
# 開啟 http://127.0.0.1:8098/ai-agent-use-cases/?q=薪水&case=UC-024
```

## 驗證與實際結果

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/*.cjs; do node --check "$file"; done
READER_SEARCH_ENGINES=all NODE_PATH=<tools>/node_modules node tests/reader-search-browser.cjs
MATCH_URL=http://127.0.0.1:8098/ai-agent-use-cases/ NODE_PATH=<tools>/node_modules node tests/search-context-browser.cjs
```

- 修改前78/78；新增5項單元測試先紅燈，瀏覽器在真正基準因缺捷徑失敗：[紅燈](red-browser.log)。修改後83/83、JS syntax及靜態預覽全過。[單元輸出](unit.tap)
- Chromium1440／390／320、Firefox390、WebKit390：三情境及擴充邊界完成，10次axe掃描0違規、0pageerror。[實測](verification.json)
- 保留既有search-context瀏覽器回歸，五組引擎／尺寸全部MATCH_PASS；全文搜尋、卡片解釋、組合條件、空結果、直鏈、返回、來源與axe斷言均保留。
- 新按鈕≥44px；既有工具列按鈕44px、14px字體。來源實際開啟`https://openai.com/index/introducing-dots/`；HTTP狀態見verification，不把外站限流視作案例正確性的證據。
- 產品資產未壓縮增加3603bytes，gzip差額949bytes（Python zlib，以各資產分別gzip）：[尺寸](asset-sizes.json)。沒有Lighthouse或真實網路速度分數。

三種模擬走查：薪水→自設禁止算薪資的原文→鍵盤返回結果；旅遊＋生活→空結果→保留篩選恢復→重整／Back；分享q＋case→同義詞捷徑／無原文命中→不捏造捷徑。這是模擬檢查，不宣稱真人喜歡、留存或轉換提升。

前端無獨立lint、TypeScript、npm build；Python預覽不冒充Jekyll，正式部署另確認Pages。

## 限制與下一輪

未用實體手機、iOS軟鍵盤、真人螢幕閱讀器。macOS WebKit預設Tab會跳過button，本機明記限制並驗顯式focus＋Enter；Chromium／Firefox原生Tab已驗，LinuxCI另查。axe不是完整無障礙認證。最多顯示兩個段落、每個詞採第一個命中，不是全文尋找全部結果。

下一輪最值得做：降低回訪357篇全文重新載入成本，同時保留來源一致性與部分失敗補讀。

## 發布

PR、雲端CI與正式Pages結果待本輪最後驗收後補記；在確認前不宣稱已發布。
