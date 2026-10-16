# UC-249：閱讀頁序到單張八頁小誌拼版

- 網站標題：想把八頁小誌印在一張紙？先讓頁序和上下方向對得上
- 一句話用途：作者用Grok Bot與Cursor製作小誌工具，公開PDF預覽可檢查折頁面板位置及旋轉。
- 情境：創作
- 標籤：小誌、拼版、PDF、驗收
- 工具：Grok Bot／Cursor／Flutter
- 證據狀態：A，公開原型與輸出截圖；未執行程式、未實印折
- 查證日期：2026-10-16

## 原作者實作與成果

TheGiraffe的CuteZineMaker讓使用者依閱讀順序編輯，再匯出八格拼版。根README明述以Cursor與Grok Bot協作，稱Bot為Very Cute Bot；未提供完整對話，不能將全部程式歸Bot獨作。

已看公開PDF預覽：一張紙，上排7、6、5、4倒置，下排8、1、2、3正向。固定版拼版與匯出原碼採八頁一組、不足補白。可核到預覽產物，未取得原PDF、實際印折、裁切或跨平台驗收；測試檔存在不表示測試已通過。

## 可參考步驟（本庫設計，未執行）

1. 以合成1–8頁，每頁放明顯頁碼與向上箭頭，先固定閱讀順序。
2. 為選定折法列面板索引、位置及角度，再產出待審預覽；不要直接將八頁按原順序排成網格。
3. 核對每個頁碼只出現一次、箭頭方向及封底／封面位置；另測不足八頁的補白。
4. 分開檢查PDF尺寸、可印範圍、比例與裁切風險，列出尚未實體驗證項目。
5. 人工確認後再另行決定試印，不把螢幕正確當實物已通過。

## 可貼指令（自行設計，未測）

請只為合成1–8頁設計單張八頁小誌的拼版驗收表。每頁含頁碼及向上箭頭，列閱讀序、輸出格位、旋轉角度和補白規則。說明依據哪種折法，未知就先問；檢查重複、缺頁及紙張比例。不要安裝專案、執行下載程式、操作印表機、送印或購買。產出待審規格與應人工確認的事項，不宣稱印折成功。

## 權限、費用與可用性

- 本案是作者建成的應用原型，不是所有Grok Bot帳戶內建小誌功能。方案及實際用量費用未公開，未測各作業系統。
- [Adobe列印尺寸說明](https://helpx.adobe.com/acrobat/desktop/print-documents/set-up-and-print-pdfs/page-size.html)：Actual size不縮放但可能裁掉超出可印區的內容；Fit會縮放。因此PDF尺寸與實體可印範圍須分開確認。
- 只用自有或授權素材，不公開私人照片或完整受版權作品。README的本機儲存敘述未經完整安全審查，不能保證全部資料流。
- 本次僅讀原碼、說明及公開圖片，沒有安裝、執行、列印或啟用服務。

## 作者、日期與來源

- TheGiraffe／GitHub／英文。[作者歸因README](https://github.com/TheGiraffe/CuteCursorProjects/blob/faf8fd783a86d788b6f57308c03d80a5652f5263/README.md)；[應用說明](https://github.com/TheGiraffe/CuteCursorProjects/blob/faf8fd783a86d788b6f57308c03d80a5652f5263/CuteZineMaker/README.md)。
- 固定版本faf8fd783a86d788b6f57308c03d80a5652f5263，commit時間2026-09-07 03:12:40 UTC；不是活動確切日期。
- [拼版原碼](https://github.com/TheGiraffe/CuteCursorProjects/blob/faf8fd783a86d788b6f57308c03d80a5652f5263/CuteZineMaker/lib/export/imposition.dart)、[PDF匯出](https://github.com/TheGiraffe/CuteCursorProjects/blob/faf8fd783a86d788b6f57308c03d80a5652f5263/CuteZineMaker/lib/export/pdf_export.dart)、[測試定義，未跑](https://github.com/TheGiraffe/CuteCursorProjects/blob/faf8fd783a86d788b6f57308c03d80a5652f5263/CuteZineMaker/test/pdf_page_size_test.dart)。
- [輸出預覽圖](https://github.com/TheGiraffe/CuteCursorProjects/blob/faf8fd783a86d788b6f57308c03d80a5652f5263/screenshots/CuteZineMaker3.PNG)、[作品縮圖](https://github.com/TheGiraffe/CuteCursorProjects/blob/faf8fd783a86d788b6f57308c03d80a5652f5263/screenshots/CuteZineMaker1.PNG)。不在本庫轉貼圖片。
- 查閱範圍：已讀上述公開說明與程式相關段落、親看兩張圖；沒有作者原PDF或實體成品。

## 去重

UC114是既有教材省紙重排；本案終點為閱讀序轉換成指定折法的面板順序與方向。普通逐頁PDF及八頁拼版不拆兩案，換紙張或作品也不另計。
