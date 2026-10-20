# 2026-10-20：最近核對的內容

狀態：已合併至main並發布；實際HTTPS桌面與手機驗收通過。產品整合505c825，發布驗收d923b8b，後續紀錄提交不改產品或語料。

首頁新增「最近核對的內容」入口，篩選面板可切換頁首核對日排序，卡片與詳情可讀到日期。回訪者可直接開啟、收藏或分享近期列表；預設仍保留原相關性排序。只改排序不重抽靈感卡、不改匹配集合，返回、分享、重新整理與補讀都保留排序。

## 問題與選擇

[正式站走查39351188756](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39351188756)完成桌面／390px首頁、搜尋組合篩選、空結果、詳情返回、直鏈重整及來源popup。362筆無缺項，但無關鍵字時首批UC-001～006，卡片沒有日期，近期UC-360～364沒有直接入口。不是宣稱有關鍵字時也依ID排序。

- A：近期入口＋頁首日期排序，成本中等，完成回訪的查找與閱讀流程；採用。
- B：全文分包，可降低數百次請求，但需自動建置能力與Pages部署調整；本輪暫緩，不用手動副本。

日期只採頁首明確核對欄位中合法曆日的最大值，原記錄時區不換算；正文補充不計。明示不是發布日、新增日期或獨立驗證，未知置後且明示。最終366筆中349筆有日期、17筆未提供；合格320與總條目366分列，沿用協作者最新稽核，未重做資格判定或刪除候選。

本輪不改框架、來源分類、同義詞、案例原文、Pages設定或前端依賴，不新增追蹤／cookies／登入。變更：index.html、assets/app.js、assets/style.css、tests/recent-review*、audit候選精確斷言、QA workflow及紀錄。

## 截圖

同尺寸、同explore錨點；前後條目差4筆來自並行研究合併，不是排序功能新增案例。首頁靈感卡隨機，不能用它的不同內容推算效果。

| 尺寸 | 修改前 | 修改後近期列表 |
| --- | --- | --- |
| 桌面1440×1000 | [前](before/chromium-desktop-results.png) | [正式站修改後](published/chromium-desktop-recent.png) |
| 手機390×844 | [前](before/chromium-mobile-results.png) | [正式站修改後](published/chromium-mobile-recent.png) |

[手機首頁](preview/chromium-mobile-home.png) · [320px](preview/chromium-small-recent.png) · [手機詳情](preview/chromium-mobile-detail.png)

## 驗收與獨立審查

三個模擬情境：回訪找近期核對、旅遊問題加情境／工具篩選再分享、未知日期與空結果後復原。這不是訪談或留存／轉換研究。

| 檢查 | 實際結果 |
| --- | --- |
| 基準單元 | 103項、102通過、1原有失敗：首頁315與當時稽核317不一致；[原始輸出](baseline.tap) |
| 最新單元 | 110／110通過；[輸出](unit.tap)。含日期、排序、URL、原文與P項目重複／缺漏反例 |
| JS與預覽 | 語法及Python靜態預覽通過；沒有獨立lint／TypeScript／npm build；不冒稱是Jekyll建置 |
| 原探索與閱讀 | [1e69263／39353924703](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39353924703)兩套命令明確PASS；366條目／2556節／385證據列、15次axe零違規。該run後續新測試錯誤，整體仍FAIL |
| 最終五套預覽 | [632377a／39355497515](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39355497515)成功；Chromium1440／390／320、Firefox／WebKit390：366筆逐筆原文符合checkout、349日期／17未知、0pageerror、10次axe零違規；載入編輯／部分補讀／整體錯誤重試皆通過 |
| 正式部署與HTTPS | [Jekyll Pages 39356283983](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39356283983)成功；[正式HTTPS 39356746879](https://github.com/RichardHan/ai-agent-use-cases/actions/runs/39356746879)成功：1440／390兩尺寸、三情境、366筆原文符合checkout、0pageerror、4次axe零違規；[報告](published/report.json) |

原兩套回歸與最終產品、語料、scripts及原測試依賴505檔雜湊完全相同，見[比對](reused-regression-integrity.json)。跨run分套記錄，不把失敗run改記成功。[Discovery輸出](discovery-browser.log) · [Reader輸出](reader-browser.log) · [原文資料完整性](reader-corpus.json)。最終五套另記recent／recovery／mobile／budget／relevance，既有main Website／Reader CI未改。

未參與實作的角色指定gpt-6-astra／max，已審查架構、資料、安全、功能、桌面及390／320畫面；指出並已修正零結果說明、入口href等價、抽卡穩定、history測試分離及P項目身份驗收漏洞。最終獨立核對已完成：110單元與五套PASS、所有JSON及11張新圖一致，沒有剩餘產品必修項，可合併；其後正式HTTPS也已通過。主對話實際模型／推理及帳號最高可用設定無法核實；本機預設僅顯示gpt-6.1-sol／medium，未切換或假稱最強。

前端三檔增加3,671未壓縮bytes；日期文字對白卡片8.71:1、紙色8.16:1，見[尺寸與對比](sizes-and-contrast.json)。不是傳輸量、Lighthouse或速度改善證明。

## 重現與預覽

```sh
node --test tests/*.test.cjs
for file in assets/*.js tests/recent-review*.cjs; do node --check "$file"; done
python3 scripts/preview.py /tmp/recent-preview/ai-agent-use-cases
python3 -m http.server 8131 --directory /tmp/recent-preview
# 雲端已安裝Playwright／axe的環境：
RECENT_URL=http://127.0.0.1:8131/ai-agent-use-cases/ node tests/recent-review-browser.cjs
RECENT_URL=http://127.0.0.1:8131/ai-agent-use-cases/ node tests/recent-review-recovery.cjs
```

可直接使用正式入口[最近核對](https://richardhan.github.io/ai-agent-use-cases/?sort=reviewed#explore)。其餘完整命令見[workflow](../../../.github/workflows/recency-qa.yml)。

## 界線與下一輪

原工作目錄兩個未提交搜尋修改未觸碰。並行研究兩次安全整合；曾先停下audit文字衝突，比對兩側相同49後保留所有精確斷言；案例、來源與INDEX和協作者基準一致。Orca CLI無法解析應用程式，未啟動個人電腦GUI；瀏覽器執行與Playwright／axe套件僅在GitHub runner，本機有Node單元檢查。未用另付費API。

未做實體手機、真人偏好或完整螢幕閱讀器認證。頁首日期可能落後正文補充，第三方來源也不保證持續可用。WebKit載入中立即重整的存取檢查診斷是[前輪已知限制](../2026-10-20-shared-case-first/README.md)；本輪保留原FAIL，完整載入後重整另驗，未宣稱修掉其內部根因。

下一輪優先：建立能自動同步的全文分包建置，降低每次開頁的全庫下載成本。調查、所有中間失敗及紅燈證據見[investigation.md](investigation.md)，不重做已完成的近期排序。

原手機五配置完成且390／320距搜尋233px，原門檻未放寬；新增復原[結果](final-recent-recovery.json)、載入期限[17項結果](final-loading-after.json)、相關性[五配置](final-after-relevance.json)、完整預覽[結果](preview/report.json)、[CI](final-preview-ci.json)。

正式發布505c825整合後110／110。首次正式驗收39356284786於01:58:12～02:01:15等待版本，Pages仍排隊，HTML／JS／CSS仍HTTP200舊版，故版本閘門正確FAIL、未執行HTTPS旅程；[失敗log](published-before-deploy-failure.log)與[當時資產](published-before-deploy-assets.json)保留。Jekyll build與Pages部署隨後成功，正式HTTPS複驗亦通過（見上表）。CLI rerun被帳號權限拒絕，因此以已授權git push調整QA等待上限為8分鐘後再驗，不放寬任何資產、目錄或原文比對。未改產品／語料／原測試。

正式站先確認HTML／JS／CSS逐bytes等於checkout，catalog的364個來源路徑集合完全相同，再走完三情境；逐筆核對366條目原文與349／17日期覆蓋。[資產雜湊](published-assets.json) · [Pages結果](pages-ci.json) · [HTTPS結果](published-ci.json)。既有Return CI首次也在部署前版本閘門失敗，保留[原log](return-queued-deploy-failure.log)；[發布CI快照](publication-ci-snapshot.json)僅作當時狀態，不宣稱所有其他workflow已綠燈。正式HTTPS驗收完成後，main另有協作者b801362／a7f1768新增案例與來源註記；保留其內容。上述366筆結果明確對應d923b8b，不延伸聲稱後續新增資料也已完成同一套瀏覽器驗收。本輪驗收已達標，停止功能修改。

最後保留協作者UC-369後，完整單元重跑出現兩個資料同步失敗（[108／110紅燈](post-publication-integration-red.tap)）：首頁合格320落後稽核321、來源候選精確集合新增369。依既有資料只同步首頁321與測試候選名單，不刪資料、不放寬49簇斷言；[重跑110／110通過](post-publication-integration-green.tap)。這兩行同步另經獨立審查；前述正式截圖仍保留已測d923b8b版本，不重標為後續資料快照。
