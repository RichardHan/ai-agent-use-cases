# UC-158：已付款卻找不到訂單，先核原資料再補建履約

- 網站標題：收過款卻漏了出貨單？別用猜的地址和商品補回去
- 一句話用途：公開專案記錄付款後遺失訂單、補建與後續錯誤履約資料事故；目前程式加入缺資料停止及人工核准，本庫未驗證真實交易或出貨。
- 情境：工作
- 標籤：訂單、對帳、履約、失敗
- 工具：Grok Bot多代理／Cursor／Stripe／Prodigi
- 證據狀態：A級公開專案事件與程式可讀；事件／回顧含代理撰寫，未獨立重跑或核金融物流結果。
- 查證日期：2026-10-17（台灣時間）

## 實際專案紀錄與事故

Jonathan Moore的forbotsonly專案issue記錄，Railway重部署後記憶體中的訂單遺失，付款已發生卻查不到訂單。修復提交增加持久化及補建工具；截至9月15日的專案回顧稱兩單恢復、沒有再次收款。多代理分工為協調、Coding/Cursor、Shopping與Fulfillment QA，不把每個代理各算案例。

但9月12日另一事故記錄顯示，舊補單曾填入樣板地址及硬編商品尺寸／圖案，導致錯誤履約資料。後續改為從既有付款資料取回選項，缺資料停止並加人工核准。不能只報恢復成功而省略這個失敗。

## 目前可讀程式支持什麼

所讀handler先取既有Stripe Session並檢查付款狀態，查找既有訂單，缺單才補建；缺尺寸／圖案不猜，地址完整性檢查後放入awaiting_approval。此handler未新建扣款。

這支持狀態檢查與待核准的程式意圖，不證明併發、跨重啟或外部履約永遠只做一次。事故文件曾把實際Stripe測試、部署及首單驗收列未完成；後續回顧稱上線，仍不是本庫驗收或銀行／物流證據。

## 操作步驟（本庫設計，未實測）

1. 僅以合成付款、訂單和履約表建立唯讀對帳。
2. 區分已付款、缺訂單、已建履約、待核准與結果不明，保留來源狀態。
3. 用穩定關聯欄位查重，缺商品或地址資料就停，不拿樣板值湊完整。
4. 只產補建草稿與例外清單，由有權管理者核原始紀錄。
5. 真實補單、履約或付款操作需另獲相應授權；不從研究稿直接重跑API。
6. 設計重複、併發、重啟和部分失敗測試，將「未重複扣款」與「未重複出貨」分開驗收。

## 可貼指令（原創設計，未實測）

請用合成付款與訂單資料列孤兒訂單對帳表，標既有付款證據、是否已履約、缺失欄位和待人工核准的補建草稿。禁止填樣板地址、猜商品選項、連真API、再次扣款或送出履約。

## 權限、費用與限制

- 原事件由cursor[bot]撰寫，回顧以Chief of Staff視角描述，是作者公開的專案紀錄；不等於交易第三方證明。
- Stripe官方要求依付款與既有履約狀態處理重複／併發呼叫；API冪等鍵也不能單獨保證整條業務鏈不重複。
- 支付、採購及出貨涉及費用、個資及承諾；本庫不發布交易識別碼、地址、憑證或任何私人訂單。
- 服務費率與實際金額未核；未安裝、執行測試、啟服務或操作任何案例。

## 來源與去重

- Jonathan Moore／forbotsonly；英文公開專案。
- issue建立2026-09-11 01:33:21 UTC：https://github.com/jonathanmoore/forbotsonly/issues/35
- 修復提交2026-09-11 01:34:40 UTC：https://github.com/jonathanmoore/forbotsonly/commit/99e93b8184600df035851bd0baa804172d946e9b
- 截至9月15日回顧：https://github.com/jonathanmoore/forbotsonly/blob/main/docs/GROK-BOT-ORCHESTRATION.md
- 事故及缺口：https://github.com/jonathanmoore/forbotsonly/blob/main/docs/INCIDENT_FIX_fake_addresses.md
- 程式：https://github.com/jonathanmoore/forbotsonly/blob/main/src/server.ts#L1448-L1615
- 官方：https://docs.stripe.com/checkout/fulfillment.md?payment-ui=stripe-hosted
- 冪等背景：https://docs.stripe.com/api/idempotent_requests
- 已讀公開事件、回顧、程式與官方限制，未獨立重跑。
- 與UC-003模擬店務及130買方庫存／採購帳本不同；本案是賣方缺失履約單的資料恢復與覆核，兩單合計一流程。
