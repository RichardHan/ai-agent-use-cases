# UC-210：觀星前，讓條件分數與目標推薦都有計算來源

- 網站標題：今晚適合看什麼？先分清天候、光害與器材限制
- 一句話用途：讓 Bot 調用觀測計算工具，核對缺值、時區和推薦依據，而非憑文字猜分數。
- 情境：生活
- 分類／標籤：生活、天文、規劃、來源、驗收
- 工具：Grok Bot／Astronomer／Astro Engine／Python Host
- 證據：A，公開專案實作與驗收紀錄；未獨立重跑、未核野外觀測
- 作者／日期／語言：gdombiak（Gaston Dombiak）；F4紀錄2026-08-31，PR #73建立2026-09-19T20:59:40Z、合併21:14:44Z；英文
- 查證：2026-10-16 UTC

## 作者實際做了什麼

F4 記錄 Grok Bot 在雲端調用專用引擎；不明說 CLI 的自然語句也取得結構化結果，四組輸入返回66、72、35、90。缺光害值保留 null，沒有自行補懲罰。這些是固定輸入檢查，不是實際夜空品質測量。

後續 PR 記錄 Astronomer bundle 已在既有 Bot 測試，包含 Host 操作、best／browse 推薦及狀態保存。支持專用觀測規劃工具鏈的實作；未公開當次星體清單、逐步對話或野外觀測紀錄。軟體 parity 測試通過不能當天候準確率。

此案把條件查詢、候選推薦與依據核對合計一次；不將不同地點、三夜展望或多項操作拆數。不同於 UC-012 文獻評估、UC-064 證明檢查或 UC-169 求解器基準。

## 可參考的操作順序

1. 確定觀測地點、時區、日期與器材範圍；缺項先問。
2. 讓專用工具提供夜窗、天候與光害資料，保留版本和資料時間。
3. 將夜間條件分數、光害限制、目標推薦與器材適配分開呈現。
4. 缺值保持缺值；沒有候選時交代原因，不補造目標。
5. 由人再查道路、夜間進入權、地平遮蔽與現場安全。

上述為整理後的參考流程；8月評分切片與9月 Host 推薦能力不同，不倒推舊版全有。

## 可貼指令（本庫自行設計，未執行）

僅閱讀我提供的合成地點、器材條件與封存工具輸出，不連服務或裝置。整理日期時區、資料時間、缺值、各種分數含義及候選排序依據。對無光害值、無合適目標和跨午夜三種情境說明應如何呈現。不得保證看得到，不操作望遠鏡、不安排太陽觀測；另列需人確認的進入權與現場風險。

## 權限、費用與驗證限制

- 本庫未下載、安裝、執行專案或連設備。工具安裝、資料傳送及持續連線需另行確認授權。
- F4 routine 只有 Test run；排程暫停，未等待關筆電後的時鐘觸發，不能宣稱長期無人值守已驗證。
- 舊切片曾用未公開分支打包，當時不能直接從 main 複製；現行文件與版本需分開。
- Open-Meteo 的預報是模型資料，變數、解析度與時區有條件；光害圖也不能替代現場觀測。
- 原報告未核總費用；各產品方案、資料用途與API條件以實際使用時為準。

## 來源與查閱範圍

- [F4實作紀錄](https://github.com/gdombiak/AstroViewingConditions/blob/main/docs/design/f4-grok-bot-feasibility.md)：已讀原始全文。
- [PR #73驗收敘述](https://github.com/gdombiak/AstroViewingConditions/pull/73)：已讀作者、日期與正文，未重跑測試。
- [Astronomer 指令](https://github.com/gdombiak/AstroViewingConditions/blob/main/astronomer/ASTRONOMER.md)
- [Host README](https://github.com/gdombiak/AstroViewingConditions/blob/main/packages/astro-host-python/README.md)
- [Open-Meteo 文件](https://open-meteo.com/en/docs)
- [光害圖來源](https://djlorenz.github.io/astronomy/lp/)
