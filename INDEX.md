# 完整案例索引

更新日期：2026-10-14。所有內容均為公開來源研究，本庫尚未親自重現任何案例。官方自報、作者觀察與自行設計提示詞分開標示。

## 主要案例（51）

| 編號 | 工作 | 工具 | 證據與詳細內容 | 情境／標籤 |
| --- | --- | --- | --- | --- |
| UC-001 | 旅行比較與付款前交接 | Grok Bot／Muse／dots | [作者測試](cases/001-travel-checkout.md) | 生活｜旅遊、比價、付款前確認 |
| UC-002 | 影片研究與製作企劃 | Grok Bot／Muse／dots | [作者測試](cases/002-video-production.md) | 創作｜影片、選題研究 |
| UC-003 | 模擬商店營運 | Grok Bot／Muse／dots | [作者測試，虛構商店](cases/003-store-operations.md) | 工作｜商店營運、客服、例外處理 |
| UC-004 | 公開社群資料整理人脈 CRM | Grok Bot／X／Notion | [官方署名教學中的作者使用陳述](cases/004-social-crm.md) | 工作｜人脈、CRM、社群 |
| UC-005 | 需求、雲端實作、PR 獨立審查 | Grok Bot／Cursor Cloud Agent／GitHub | [作者測試，資料寫入及監看有限制](cases/005-cloud-pr-review.md) | 開發｜PR審查、多代理、雲端開發 |
| UC-006 | Facebook 成效到受監督發布 | Meta Muse／Facebook | [作者測試，自管公開社團](cases/006-facebook-publication.md) | 創作｜社群、發文、排程 |
| UC-007 | SaaS 席次稽核與續約準備 | Grok Bot／Haggle Bot | [官方內部案例自報，非獨立審計](cases/007-saas-renewal-audit.md) | 省錢｜訂閱、續約、帳單 |
| UC-010 | 實體 OLED 控制與結果驗收 | Grok Bot／Mac gateway／ESP32 | [開源作者自驗，未獨立重現](cases/010-physical-oled-verification.md) | 開發｜實體裝置、驗收 |
| UC-011 | 商機與回饋交叉分析、批准後修訂材料 | ChatGPT dots／Drive／Sheets | [作者樣本測試，無營收成效驗證](cases/011-sales-feedback-approved-revision.md) | 工作｜業務、簡報、客戶回饋 |
| UC-012 | 科研評估來源稽核、領域批判與圖稿整合 | Grok Bot／Jupyter／LaTeX | [作者回溯性科研案例，原始紀錄不完整](cases/012-research-evaluation-provenance.md) | 學習｜科研、資料稽核、多代理 |
| UC-014 | 客服收件匣巡檢與人核准退款 | Grok Bot／Intercom／Stripe；dots 影片待看 | [作者自述使用；影片僅讀描述](cases/014-support-inbox-approval-refund.md) | 工作｜客服、收件匣、核准 |
| UC-015 | 公開頁面變更監看與有限次排程驗收 | ChatGPT dots／Grok Bot routine | [dots 作者單次結構化測試＋Grok Bot 官方文件；未重現](cases/015-public-page-change-watch.md) | 工作｜監看、排程、驗收 |
| UC-016 | 二手刊登與買家對話代管 | Meta Muse／Facebook Marketplace；dots 多平台 | [Muse 地址外洩事件（媒體轉述）＋官方權限文件＋作者自述；未重現](cases/016-marketplace-selling-buyer-messages.md) | 生活｜二手、買家訊息、隱私 |
| UC-017 | 先研究潛在客戶，再準備有根據的聯絡草稿 | Grok Bot／公開公司來源／草稿 | [官方展示／署名作者自報；未獨立重現](cases/017-prospect-research-drafts.md) | 工作｜業務開發、草稿 |
| UC-018 | 正式展示前，先檢查示範環境能不能跑 | Grok Bot／授權測試環境 | [官方展示／署名作者自報；未獨立重現](cases/018-demo-readiness.md) | 工作｜展示、驗收 |
| UC-019 | 把剛談到的客戶需求，變成下一版簡報 | Grok Bot／Granola／Figma | [官方展示／署名作者自報；未獨立重現](cases/019-call-to-customer-deck.md) | 工作｜簡報、會議 |
| UC-020 | 用一張設計範本，做出整批一致的卡片 | Grok Bot／Figma MCP | [官方展示／署名作者自報；未獨立重現](cases/020-figma-batch-cards.md) | 創作｜設計、Figma、批次製作 |
| UC-021 | 法務問題散在聊天裡？整理成能接手的待辦 | Grok Bot／Slack／合約與追蹤系統 | [官方展示／署名作者自報；未獨立重現](cases/021-legal-request-handoff.md) | 工作｜法務、待辦 |
| UC-022 | 廣告花費或轉換異常時，先找出問題在哪 | Grok Bot／廣告平台匯出／Sheets | [官方展示／署名作者自報；未獨立重現](cases/022-ad-spend-conversion-check.md) | 工作｜廣告、數據異常 |
| UC-023 | 產品改了，讓 dots 找出需要更新的上市文案與簡報 | ChatGPT dots | [官方發布情境／教學示例；未獨立實測](cases/023-launch-material-revision.md) | 工作｜行銷素材、改版 |
| UC-024 | 檢查已交付工作，找出可能漏開的帳單 | ChatGPT dots／Grok Bot | [官方轉述＋貨運作者自報與錯誤；未獨立實測](cases/024-missing-invoice-check.md) | 工作｜帳單、對帳 |
| UC-025 | 用 dots 追蹤團隊活動的期限、預算問題與待回覆事項 | ChatGPT dots | [官方示例＋作者虛構出席表測試；未重現](cases/025-team-event-follow-through.md) | 工作｜團隊活動、追蹤 |
| UC-026 | 讓 Muse 整理開學通知與截止日 | Meta Muse | [官方自述／用途宣稱；原創流程未實測](cases/026-school-deadline-list.md) | 生活｜學校、期限 |
| UC-027 | 把收藏食譜整理成一桌菜 | Meta Muse；Grok Bot 網購下單失敗回報 | [Muse 官方自述＋Grok Bot 作者失敗自述；原創流程未實測](cases/027-recipe-shopping-plan.md) | 生活｜食譜、採買、網購 |
| UC-028 | 先做帳單降費比較，再決定怎麼談 | Meta Muse | [官方自述／用途宣稱；原創流程未實測](cases/028-bill-comparison-preparation.md) | 省錢｜帳單、降費、協商 |
| UC-029 | 行程改了，讓 Muse 重排運動時段 | Meta Muse | [官方自述／用途宣稱；原創流程未實測](cases/029-exercise-time-replan.md) | 生活｜運動、行程 |
| UC-030 | 把筆記做成互動複習工具 | Meta Muse | [官方自述／用途宣稱；原創流程未實測](cases/030-interactive-study-guide.md) | 學習｜自學、互動工具 |
| UC-031 | 用匿名消費明細建立支出看板 | Meta Muse | [官方自述／用途宣稱；原創流程未實測](cases/031-spending-dashboard.md) | 省錢｜記帳、看板 |
| UC-032 | 把虛構睡眠紀錄整理成趨勢圖 | Meta Muse | [官方自述／用途宣稱；原創流程未實測](cases/032-sleep-record-chart.md) | 生活｜睡眠、健康 |
| UC-033 | 從年度營運數據排出下一季實驗 | Meta Muse | [官方自述／用途宣稱；原創流程未實測](cases/033-business-experiment-plan.md) | 工作｜營運、實驗規劃 |
| UC-034 | 把可疑費用整理成覆核清單 | Meta Muse | [官方自述／用途宣稱；原創流程未實測](cases/034-expense-anomaly-review.md) | 省錢｜費用、異常 |
| UC-035 | 找合適職缺，把履歷改成有根據的申請草稿 | dots／Work歸屬待核；Grok Bot反例 | [作者自報＋未核准及重複投遞反例；未重現](cases/035-job-search-application-drafts.md) | 工作｜求職、履歷 |
| UC-036 | 每天的收銀資料，整理成可核對的入帳檔 | Grok Bot／POS／QuickBooks Online | [論壇作者自報；無實際入帳或核帳證據](cases/036-pos-accounting-csv.md) | 工作｜每日、收銀、記帳 |
| UC-037 | 跨商店比同款商品，先看清總價與賣家 | Meta Muse／公開商品頁 | [媒體作者單次測試；未獨立重現](cases/037-product-listing-comparison.md) | 省錢｜購物、比價 |
| UC-038 | 從找布料到做樣品，先整理供應商與打樣規格 | Grok Bot／公開供應商資料 | [HN 作者自報；樣品完成與品質未核](cases/038-fabric-sourcing-sample-handoff.md) | 工作｜採購、打樣 |
| UC-039 | 追蹤競品變化，整理值得回應的產品與行銷動作 | Grok Bot／公開競品網站 | [官方站作者模板＋社群觀察；未實測](cases/039-competitor-positioning-review.md) | 工作｜競品 |
| UC-040 | 行程方案後延遲複查天氣交通，並處理改條件 | ChatGPT dots | [作者文章示範；模擬未訂票](cases/040-trip-deferred-recheck.md) | 生活｜旅遊、排程 |
| UC-041 | 多 Routine 健康檢查與晚間例外通報 | Grok Bot（＋作者另用 Claude 晨報） | [作者自述簡化指示；未重現](cases/041-routine-health-exception-ops.md) | 開發｜每日、排程、巡檢、多代理 |
| UC-042 | Dots 憑證／單 Agent 限制後改回多 Bot 內容流水線 | ChatGPT dots／Grok Bot | [作者一週遷移長文；未重現](cases/042-dots-credential-multibot-return.md) | 開發｜憑證、多代理、工具限制 |
| UC-043 | 從公開活動資料找出附近活動，整理成獨立日曆候選 | Meta Muse | [作者自報首次匯入；後續同步未核](cases/043-public-events-calendar.md) | 生活｜活動、日曆 |
| UC-044 | 家務、採買、行程散在各處？做一頁家人看得懂的今日看板 | Meta Muse | [媒體作者自報；存取與同步未独立驗證](cases/044-household-shared-dashboard.md) | 生活｜每日、家庭、看板 |
| UC-045 | 把公開網頁查證交給Grok Bot，再把證據交回Codex | Codex／Grok Bot／第三方任務橋 | [作者手動觸發自報；Routine未驗證](cases/045-cross-agent-research-handoff.md) | 開發｜跨代理、研究交接 |
| UC-046 | 每天把關注帳號的貼文整理成去重精選 | Grok Bot／X；Notion、Obsidian、dots 版本待核 | [作者自述日常使用＋官方 X 讀取文件；未重現](cases/046-followed-accounts-daily-digest.md) | 工作｜每日、X、排程、去重、簡報 |
| UC-047 | 把作品與製作紀錄整理成可搜尋的作品集 | ChatGPT dots／網站 | [作者自報＋公開介面；作品資料未獨立驗收](cases/047-portfolio-provenance-catalog.md) | 創作｜作品集、來源查證、搜尋、驗收 |
| UC-048 | 每天查商品排名或價格，有變動才通知 | Grok Bot | [作者自述＋公開範本頁說明；未重現](cases/048-daily-price-rank-tracking.md) | 省錢｜每日、比價、電商、排程 |
| UC-049 | 每日收件匣報告，從只讀逐步放權 | Grok Bot；dots／Muse 檢查頻率比較 | [影片二手轉述＋作者自述＋跨產品觀察；未重現](cases/049-daily-inbox-report-graduated-trust.md) | 工作｜每日、收件匣、核准、排程 |
| UC-050 | 每天依筆記與天氣生成圖，推到墨水屏 | Meta Muse／樹莓派／BOOX | [作者自述＋Meta 員工 SDK 公告；未重現](cases/050-daily-eink-mood-illustration.md) | 創作｜每日、實體裝置、生成圖像、筆記 |
| UC-051 | 把多年報稅資料交給 Bot，複核會計師的申報 | Grok Bot | [兩位作者自測自述；錯誤與金額未核實](cases/051-tax-return-cpa-double-check.md) | 省錢｜報稅、核對、文件整理、核准 |
| UC-052 | 雲端用量暴衝多扣錢，申請退款並修根因 | Grok Bot／Railway／Vercel／Neon | [作者自測自述；退款與 PR 未核](cases/052-cloud-overcharge-refund-root-cause.md) | 省錢｜帳單、退款、雲端費用、多代理 |
| UC-053 | 補貨前先查退貨吃掉多少利潤 | Grok Bot／Amazon 賣家資料／Sellerboard | [作者自述實測；表格與補貨結果未核](cases/053-ecommerce-replenishment-refund-profit.md) | 工作｜電商、補貨、退貨、核對 |
| UC-054 | 一句話或一首歌，串起作曲、生圖、動畫與剪輯做出 MV | Grok Bot／ElevenLabs Music／Canva／Grok Imagine；Claudia 模板（Suno／Midjourney／Opus） | [兩位作者自述＋模板公開文件已讀；未安裝未重現](cases/054-music-video-multi-tool-pipeline.md) | 創作｜影片、音樂、生成圖像、模板 |

## 驗證與模板補充（3，不列新增成功案例）

| 編號 | 補充 | 狀態 | 情境／標籤 |
| --- | --- | --- | --- |
| UC-008 | [晨報覆蓋與排程驗收](evidence/008-morning-brief-validation.md) | 作者實測限制補充；不能承諾完整或準時 | 工作｜每日、晨報、收件匣、排程 |
| UC-009 | [跨助手背景移轉模板](evidence/009-background-transfer-template.md) | 模板存在及官方安全說明已查；實際移轉效果未測 | 開發｜跨助手移轉、模板 |
| UC-013 | [登入狀態診斷與失敗報告驗收](evidence/013-authentication-diagnosis.md) | 作者失敗復盤；根因未確認修復 | 開發｜登入、故障診斷 |

## 待查來源（4）

[查看來源與缺漏](sources/pending.md)：Muse 十用法影片、電信降費、生成／CUA 驗收迭代、招標篩選到提案草稿。這些不計入成功案例；未查證的轉述不補寫成操作步驟。

## 使用方式

1. 先讀來源報告及限制，再決定是否適合自己的情境。
2. 提示詞均為整理者原創設計、未實跑；以小範圍、只讀驗收開始。
3. 研究內容不構成登入、傳送資料、發信、付款、改設定或部署的授權。
4. 同一目標的新作者或工具版本併入既有頁，保留原始連結及日期，不重複計數。

[本次論壇探索範圍與缺漏](sources/forum-research-2026-10-13.md)

[官方發布與早期教學覆蓋盤點](sources/launch-coverage-2026-10-13.md)
