# 完整案例索引

更新日期：2026-10-16。所有內容均為公開來源研究，本庫尚未親自重現任何案例。官方自報、作者觀察與自行設計提示詞分開標示。

以 500 個不同實作工作流程為目標：截至 2026-10-16，**237 個有作者實作證據（含自述）**；不是獨立重現或成效認證，亦不同於網站條目總數。[逐案計數、來源與排除理由](sources/qualification-audit-2026-10-16.md)。

## 主要案例（243）

| 編號 | 工作 | 工具 | 證據與詳細內容 | 情境／標籤 |
| --- | --- | --- | --- | --- |
| UC-001 | 旅行比較與付款前交接 | Grok Bot／Muse／dots | [作者測試＋Muse 媒體實測失敗點（擋 Bot、手動登入失敗）](cases/001-travel-checkout.md) | 生活｜旅遊、比價、付款前確認 |
| UC-002 | 影片研究與製作企劃 | Grok Bot／Muse／dots | [作者測試](cases/002-video-production.md) | 創作｜影片、選題研究 |
| UC-003 | 模擬商店營運 | Grok Bot／Muse／dots | [作者測試，虛構商店](cases/003-store-operations.md) | 工作｜商店營運、客服、例外處理 |
| UC-004 | 公開社群資料整理人脈 CRM | Grok Bot／X／Notion | [官方署名教學中的作者使用陳述](cases/004-social-crm.md) | 工作｜人脈、CRM、社群 |
| UC-005 | 需求、雲端實作、PR 獨立審查 | Grok Bot／Cursor Cloud Agent／GitHub | [作者測試，資料寫入及監看有限制](cases/005-cloud-pr-review.md) | 開發｜PR審查、多代理、雲端開發 |
| UC-006 | 社群成效到受監督發布 | Meta Muse／Facebook；Grok Bot／X 每日復盤短片 | [作者測試，自管公開社團＋Grok Bot 作者自述第 2 天；未重現](cases/006-facebook-publication.md) | 創作｜社群、發文、排程 |
| UC-007 | SaaS 席次稽核與續約準備 | Grok Bot／Haggle Bot | [官方內部案例自報，非獨立審計](cases/007-saas-renewal-audit.md) | 省錢｜訂閱、續約、帳單 |
| UC-010 | 實體 OLED 控制與結果驗收 | Grok Bot／Mac gateway／ESP32 | [開源作者自驗，未獨立重現](cases/010-physical-oled-verification.md) | 開發｜實體裝置、驗收 |
| UC-011 | 商機與回饋交叉分析、批准後修訂材料 | ChatGPT dots／Drive／Sheets | [作者樣本測試，無營收成效驗證](cases/011-sales-feedback-approved-revision.md) | 工作｜業務、簡報、客戶回饋 |
| UC-012 | 科研評估來源稽核、領域批判與圖稿整合 | Grok Bot／Jupyter／LaTeX | [作者回溯性科研案例，原始紀錄不完整](cases/012-research-evaluation-provenance.md) | 學習｜科研、資料稽核、多代理 |
| UC-014 | 客服收件匣巡檢與人核准退款 | Grok Bot／Intercom／Stripe；dots 垃圾箱分診＋影片待看 | [作者自述＋dots 垃圾箱年付求助分診截圖；影片僅讀描述](cases/014-support-inbox-approval-refund.md) | 工作｜客服、收件匣、核准 |
| UC-015 | 公開頁面變更監看與有限次排程驗收 | ChatGPT dots／Grok Bot routine（含 KEV） | [dots 結構化測試＋Grok Bot 官方文件＋KEV 監看自述；未重現](cases/015-public-page-change-watch.md) | 工作｜監看、排程、驗收 |
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
| UC-028 | 先做帳單降費比較，再決定怎麼談 | Meta Muse | [原作者帳單檢查與本人通話準備自述；節省未核](cases/028-bill-comparison-preparation.md) | 省錢｜帳單、降費、協商 |
| UC-029 | 刪掉12堂新排課，別動原本的2堂 | Meta Muse／Peloton | [作者實測報告；未獨立重現](cases/029-exercise-time-replan.md) | 生活｜運動、行程 |
| UC-030 | 把筆記做成互動複習工具 | Meta Muse；ChatGPT dots／Sites（Kindle 生字字卡） | [官方自述＋作者自建字卡 App 自述；原創流程未實測](cases/030-interactive-study-guide.md) | 學習｜自學、互動工具、語言學習 |
| UC-031 | 用匿名消費明細建立支出看板 | Meta Muse | [官方自述／用途宣稱；原創流程未實測](cases/031-spending-dashboard.md) | 省錢｜記帳、看板 |
| UC-032 | 把虛構睡眠紀錄整理成趨勢圖 | Meta Muse | [官方自述／用途宣稱；原創流程未實測](cases/032-sleep-record-chart.md) | 生活｜睡眠、健康 |
| UC-033 | 從年度營運數據排出下一季實驗 | Meta Muse | [官方自述／用途宣稱；原創流程未實測](cases/033-business-experiment-plan.md) | 工作｜營運、實驗規劃 |
| UC-034 | 把可疑費用整理成覆核清單 | Meta Muse／Grok Bot | [Muse建議＋Grok Bot作者疑似重複扣款自述；未核退款](cases/034-expense-anomaly-review.md) | 省錢｜費用、異常 |
| UC-035 | 找合適職缺，把履歷改成有根據的申請草稿 | dots／Work歸屬待核；Grok Bot反例兩則 | [作者自報＋未核准及重複投遞反例＋代理內部筆記險些送出反例；未重現](cases/035-job-search-application-drafts.md) | 工作｜求職、履歷 |
| UC-036 | 每天的收銀資料，整理成可核對的入帳檔 | Grok Bot／POS／QuickBooks Online | [論壇作者自報；無實際入帳或核帳證據](cases/036-pos-accounting-csv.md) | 工作｜每日、收銀、記帳 |
| UC-037 | 跨商店比同款商品，先看清總價與賣家 | Meta Muse；Grok Bot（Amazon 擋代理後改找他店）；dots 本機替代路徑 | [媒體作者單次測試＋Grok Bot／dots 失敗與本機路徑自述＋robots.txt 已讀；未獨立重現](cases/037-product-listing-comparison.md) | 省錢｜購物、比價、網購 |
| UC-038 | 從找布料到做樣品，先整理供應商與打樣規格 | Grok Bot／公開供應商資料 | [HN 作者自報；樣品完成與品質未核](cases/038-fabric-sourcing-sample-handoff.md) | 工作｜採購、打樣 |
| UC-039 | 關閉App後，競品研究簡報仍完成了 | Meta Muse／Grok Bot模板 | [作者完成自述；持續監測仍未測](cases/039-competitor-positioning-review.md) | 工作｜競品 |
| UC-040 | 行程方案後延遲複查天氣交通，並處理改條件 | ChatGPT dots | [作者文章示範；模擬未訂票](cases/040-trip-deferred-recheck.md) | 生活｜旅遊、排程 |
| UC-041 | 多 Routine 健康檢查與晚間例外通報 | Grok Bot（＋作者另用 Claude 晨報） | [作者自述簡化指示；未重現](cases/041-routine-health-exception-ops.md) | 開發｜每日、排程、巡檢、多代理 |
| UC-042 | Dots 憑證／單 Agent 限制後改回多 Bot 內容流水線 | ChatGPT dots／Grok Bot | [作者一週遷移長文；未重現](cases/042-dots-credential-multibot-return.md) | 開發｜憑證、多代理、工具限制 |
| UC-043 | 從公開活動資料找出附近活動，整理成獨立日曆候選 | Meta Muse | [作者自報首次匯入；後續同步未核](cases/043-public-events-calendar.md) | 生活｜活動、日曆 |
| UC-044 | 家務、採買、行程散在各處？做一頁家人看得懂的今日看板 | Meta Muse | [媒體作者自報；存取與同步未独立驗證](cases/044-household-shared-dashboard.md) | 生活｜每日、家庭、看板 |
| UC-045 | 把公開網頁查證交給Grok Bot，再把證據交回Codex | Codex／Grok Bot／第三方任務橋 | [作者手動觸發自報；Routine未驗證](cases/045-cross-agent-research-handoff.md) | 開發｜跨代理、研究交接 |
| UC-046 | 每天把關注帳號的貼文整理成去重精選 | Grok Bot／X；Notion、Obsidian、dots 版本待核 | [作者自述日常使用＋官方 X 讀取文件；未重現](cases/046-followed-accounts-daily-digest.md) | 工作｜每日、X、排程、去重、簡報 |
| UC-047 | 把作品與製作紀錄整理成可搜尋的作品集 | ChatGPT dots／網站 | [作者自報＋公開介面；作品資料未獨立驗收](cases/047-portfolio-provenance-catalog.md) | 創作｜作品集、來源查證、搜尋、驗收 |
| UC-048 | 每天查商品排名或價格，有變動才通知 | Grok Bot（含限額代理卡下單、結帳失敗回報） | [作者自述＋公開範本頁說明＋Robinhood 代理卡說明已讀；下單無訂單證據、未重現](cases/048-daily-price-rank-tracking.md) | 省錢｜每日、比價、電商、排程 |
| UC-049 | 每日收件匣報告，從只讀逐步放權 | Grok Bot（含＋別名觸發 routine）；dots／Muse 檢查頻率比較 | [影片二手轉述＋作者自述＋跨產品觀察＋官方人員別名公告；說明頁未同步、未重現](cases/049-daily-inbox-report-graduated-trust.md) | 工作｜每日、收件匣、核准、排程 |
| UC-050 | 每天依筆記與天氣生成圖，推到墨水屏 | Meta Muse／樹莓派／BOOX | [作者自述＋Meta 員工 SDK 公告；未重現](cases/050-daily-eink-mood-illustration.md) | 創作｜每日、實體裝置、生成圖像、筆記 |
| UC-051 | 把多年報稅資料交給 Bot，複核會計師的申報 | Grok Bot | [兩位作者自測自述；錯誤與金額未核實](cases/051-tax-return-cpa-double-check.md) | 省錢｜報稅、核對、文件整理、核准 |
| UC-052 | 雲端用量暴衝多扣錢，申請退款並修根因 | Grok Bot／Railway／Vercel／Neon | [作者自測自述；退款與 PR 未核](cases/052-cloud-overcharge-refund-root-cause.md) | 省錢｜帳單、退款、雲端費用、多代理 |
| UC-053 | 補貨前先查退貨吃掉多少利潤 | Grok Bot／Amazon 賣家資料／Sellerboard | [作者自述實測；表格與補貨結果未核](cases/053-ecommerce-replenishment-refund-profit.md) | 工作｜電商、補貨、退貨、核對 |
| UC-054 | 一句話或一首歌，串起作曲、生圖、動畫與剪輯做出 MV | Grok Bot／ElevenLabs Music／Canva／Grok Imagine；Claudia 模板（Suno／Midjourney／Opus） | [兩位作者自述＋模板公開文件已讀；未安裝未重現](cases/054-music-video-multi-tool-pipeline.md) | 創作｜影片、音樂、生成圖像、模板 |
| UC-055 | 看到好項目丟給 Bot：建檔查重、調研、持續追蹤消息 | Grok Bot（四個 Bot 交接＋共用檔案） | [作者自述＋截圖＋官方多 Bot 文件；調研內容未核](cases/055-tweet-project-intake-research-monitor.md) | 學習｜多代理、資料查證、監看、書籤 |
| UC-056 | 讓 Bot 找題目、建站、維護、收贊助，經營小網站 | Grok Bot／Cursor 代理／Stripe 外掛 | [作者自述＋第三方影片拆解＋網站公開頁已讀；收入流量未核](cases/056-agent-built-microbusiness-site.md) | 工作｜網站、營運、電子報、多代理 |
| UC-057 | 在自己筆電架 GitHub 自架 runner，先講好安全邊界 | Grok Bot／GitHub Actions／Windows 筆電 | [作者自述＋截圖＋GitHub 官方安全文件；未重現](cases/057-self-hosted-ci-runner-on-laptop.md) | 開發｜CI、本機執行、權限、核准 | 
| UC-058 | 把整場網球錄影剪成每一分，減少等待 | Meta Muse | [作者自述仍在改善；未看成片、未重現](cases/058-tennis-match-dead-time-editing.md) | 創作｜影片、運動、剪輯、驗收 |
| UC-059 | 找居家清運商、核准詢價，再確認預約 | Meta Muse | [媒體作者使用報告；未確認完工、未重現](cases/059-home-service-quote-handoff.md) | 生活｜家務、詢價、預約、核准 |
| UC-060 | 有人在 X 標記就依附出處的資料庫自動回答，敏感題留給人 | Grok Bot／X／公開 GitHub 資料庫 | [作者自述＋公開帳號與資料庫已讀＋官方 X 讀取文件；答案未逐筆核、未重現](cases/060-x-mention-sourced-answer-bot.md) | 工作｜每日、X、自動回覆、知識庫 |
| UC-061 | 窗口 Bot 派工給專責 Bot，固定指令格式、證據驗收與工作台帳 | Grok Bot／Cursor Cloud Agent／AI-PLC；Grok Bot 指揮本機 Codex 命令列 | [作者自述＋截圖＋公開提示詞＋官方多 Bot 文件＋本機 Codex 字幕 App 截圖自述；未重現](cases/061-dispatcher-bot-typed-commands-ledger.md) | 開發｜多代理、核准、驗收、派工 |
| UC-062 | 逐頁對照 Figma 與 Android 程式，找出實作差異 | Grok Bot／Figma／Android／JSON | [作者留言自述；未取得報告與程式、未重現](cases/062-figma-android-implementation-audit.md) | 開發｜設計、Figma、驗收、程式 |
| UC-063 | 盤點並整理 Plex 媒體庫命名、海報與備份 | Grok Bot／Plex | [論壇作者自述＋Plex 官方操作限制；未重現](cases/063-plex-media-library-housekeeping.md) | 生活｜影片、檔案整理、備份、驗收 |
| UC-064 | 核對數學命題、反例搜尋與 Lean 證明檢查 | ChatGPT dots／Lean | [作者自述＋公開程式、CI及登記；未獨立重跑](cases/064-math-proof-review-formalization.md) | 學習｜科研、多代理、形式驗證、驗收 |
| UC-065 | 寄件驗證全過卻可疑的信：拆解隱藏連結、起草回報，再設只標記的釣魚巡檢 | Grok Bot | [作者自述＋截圖；Bot 報告與 routine 指令未取得、未重現](cases/065-suspicious-email-security-review.md) | 生活｜收件匣、資安、釣魚、排程 |
| UC-066 | 請 Agent 稽核自己一週的用量，找出空跑排程與未標用途子代理 | Meta Muse | [作者自述＋公開稽核頁已讀；數據未核、未重現](cases/066-agent-token-usage-self-audit.md) | 開發｜排程、用量稽核、多代理、巡檢 |
| UC-067 | 替代理建立的雲端工具維護重建手冊與狀態盤點；Grok Bot 雲端電腦分類備份到 GitHub | Meta Muse／Git；Grok Bot／GitHub | [Muse 作者自述採用方法＋Grok Bot 作者自述與截圖＋官方雲端電腦文件；無還原結果、未重現](cases/067-agent-app-rebuild-manual.md) | 開發｜備份、驗收、排程、文件 |
| UC-068 | 排程要用自己的 Mac 卻常未連線：先查原因、只改必要設定再實測 | Grok Bot 桌面版（macOS） | [作者提示詞＋截圖＋Cursor 論壇員工說明；修改後排程結果未取得、未重現](cases/068-mac-local-helper-away-diagnosis.md) | 開發｜本機執行、排程、故障診斷、驗收 |
| UC-069 | 跨工具搬移待辦，核對漏件、附件與歷史日期 | Grok Bot／Trello／Todoist | [作者實際使用自述＋官方限制；未重現](cases/069-task-migration-reconciliation.md) | 工作｜資料移轉、待辦、驗收、備份 |
| UC-070 | GitHub 停權後改走本機建置與 Cloudflare 發布 | ChatGPT dots／Codex／Mac／Cloudflare | [作者長文自述＋截圖；未重現](cases/070-github-outage-mac-cloudflare-publish.md) | 開發｜部署、故障診斷、核准、跨代理 |
| UC-071 | 把 dots 不可逐筆編輯的記憶改放本機 Obsidian | ChatGPT dots／Obsidian | [作者教學串＋官方記憶 FAQ；未重現](cases/071-obsidian-dots-visible-memory.md) | 工作｜筆記、本機執行、備份、排程 |
| UC-072 | 電話任務的身份揭露、核准與人工交接 | Grok Bot／DialBot／Bland AI；ClawCall 自述 | [作者測試自述＋官方模板與費用；影片未看、未重現](cases/072-phone-task-disclosure-handoff.md) | 工作｜電話、核准、驗收、交接 |
| UC-073 | 網站顧客路徑、頁面盤點與表格讀回驗收 | ChatGPT dots／Grok Bot／公開網站／Sheets | [兩位來源使用與核對自報；完整產物未取得、未重現](cases/073-customer-journey-content-audit.md) | 工作｜網站、內容稽核、驗收、核准 |
| UC-074 | 裝置事件喚醒後重新讀取資料並驗收 | ChatGPT dots／MCP Events／自建 MCP | [作者建置自述＋官方文件；未重現](cases/074-event-trigger-readback.md) | 開發｜實體裝置、事件觸發、驗收 |
| UC-075 | 就醫前整理健康摘要，診後追蹤建議與後續問題 | Muse／Grok Bot／ChatGPT dots | [作者長文自述；未重現](cases/075-health-appointment-briefing-coach.md) | 生活｜健康、門診、保險、驗收 |
| UC-076 | 從資料仲介站找出電話號碼並申請退出垃圾來電名單 | Grok Bot／Spam-Call Scrubber（含 DNCR 確認信、西班牙 Lista Robinson＋Gmail 退訂自述） | [技能頁＋負責人轉貼＋使用者自述＋DNCR 確認信提示＋Lista Robinson 官方說明已讀；未重現](cases/076-spam-call-data-broker-optout.md) | 生活｜隱私、電話、排程、核准 |
| UC-077 | 雲端寫稿排版，再呼叫本機 Mac 發布腳本推到公眾號草稿箱並同步知識庫 | Grok Bot（雲端電腦＋本機 Mac）／公眾號腳本／飛書 lark-cli | [作者自述＋官方雲端與本機電腦文件；無截圖、未重現](cases/077-cloud-draft-local-script-wechat-publish.md) | 創作｜社群、發文、本機執行、核准 |
| UC-078 | 社群廣告租屋物件付訂金前，查產權、紀錄與仲介再檢舉 | Grok Bot | [作者單次自述；報告未取得、未重現](cases/078-rental-listing-scam-check.md) | 生活｜詐騙、租屋、資料查證、檢舉 |
| UC-079 | 業務信箱失效：測寄找退信、修別名、起草請重寄 | Grok Bot | [作者自述凌晨修復別名；無設定截圖、未重現](cases/079-business-email-alias-diagnosis.md) | 工作｜收件匣、故障診斷、核准、驗收 |
| UC-080 | 從多個信箱找出軟體序號，核對後存進密碼管理器 | Grok Bot／1Password CLI | [作者單則自述＋1Password CLI 與 Grok Bot 官方文件；無截圖、未重現](cases/080-email-license-keys-to-password-vault.md) | 生活｜收件匣、備份、資料移轉、權限 |
| UC-081 | Todoist 定時巡檢，先幫你想好下一步開場草稿 | ChatGPT dots／Todoist | [作者貼文＋任務截圖；未重現](cases/081-todoist-scheduled-headstart.md) | 工作｜待辦、排程、核准 |
| UC-082 | 管家／教練／營養師多 Bot 群聊管飲食訓練與睡眠 | Grok Bot（多代理群聊＋技能／捷徑） | [作者自述＋群聊與技能截圖；第三方 Key 與端點未核、未重現](cases/082-multi-bot-fitness-coach-group.md) | 生活｜健康、多代理、運動 |
| UC-083 | 依年級單元做出加注音可列印數學練習卷 PDF | Grok Bot | [作者貼文＋對話與卷面截圖；答案未逐題核、未重現](cases/083-printable-grade1-math-worksheet.md) | 學習｜出題、教學、驗收 |
| UC-084 | 依廚房、浴室條件篩選房源照片，交回候選工單 | Grok Bot／Notion | [作者部落格自述；未重現](cases/084-botops-tiered-fleet-notion-tickets.md) | 工作｜多代理、Notion、排程、工單 |
| UC-085 | Slack bug 回報先分流，雙週彙整產品行銷預讀 | Grok Bot／Slack／GitHub | [作者電子報自述；未重現](cases/085-slack-bug-triage-product-preread.md) | 工作｜Slack、分流、產品行銷、彙整 |
| UC-086 | 用 Muse 大量找演唱會完整影片，接便宜模型審核再核可 | Meta Muse | [作者部落格自述＋HN 討論待核；未重現](cases/086-muse-concert-video-scraping-pipeline.md) | 開發｜資料蒐集、網頁瀏覽、批次、驗收 |
| UC-087 | 散步語音交辦轉 Codex 任務，早上十分鐘電話對進度 | ChatGPT dots／Codex | [作者評測自述（含失敗紀錄）；未重現](cases/087-voice-walk-intake-codex-morning-call.md) | 工作｜語音、待辦、核准、多代理 |
| UC-088 | 翻信箱找退貨未退款訂單，擬信請商家處理 | Grok Bot／Gmail | [作者單則自述；未重現](cases/088-unrefunded-returns-inbox-chase.md) | 省錢｜退款、收件匣、核准 |
| UC-089 | 雲端重複檔案證據盤點與人工核准 | Grok Bot／Drive | [法文作者實作自述；刪除結果未核](cases/089-digital-declutter-approval-plan.md) | 生活｜檔案整理、核准 |
| UC-090 | 每天掃 24 小時內結算的高機率預測市場並查證判讀 | Grok Bot（排程） | [作者單則自述；未重現；不含下單](cases/090-daily-prediction-market-evidence-read.md) | 工作｜每日、研究、排程、資料查證 |
| UC-091 | 家庭 13 個單一職責 Bot：晨報、配偶簡訊、成績、帳單、購物車 | Grok Bot／YNAB／Twilio | [作者公開說明頁自述；未重現](cases/091-household-13-lane-bots.md) | 生活｜每日、家庭、多代理、核准 |
| UC-092 | 每個 Bot 一張能做／不能做職務頁，完成必留收據 | Grok Bot／Basecamp | [作者公開頁面自述；未重現](cases/092-desk-can-cannot-receipts.md) | 工作｜多代理、權限、驗收、維運 |
| UC-093 | 在地電子報代理團隊：研究填 Notion、業務談贊助 | Grok Bot／Notion／make.com | [訪談轉載摘要；影片未看、未重現](cases/093-local-newsletter-agent-team.md) | 創作｜電子報、多代理、Notion、業務開發 |
| UC-094 | 無法出席的會議讓 Bot 代入會，先揭露再記筆記 | Grok Bot | [作者單則貼文＋影片未看；未重現](cases/094-meeting-stand-in-disclosure.md) | 工作｜會議、筆記、揭露 |

| UC-095 | 功能使用率與錯誤紀錄交叉分析 | Grok Bot／PostHog／Sentry／Linear | [葡文作者實際使用自述；未重現](cases/095-product-usage-error-correlation.md) | 工作｜產品分析、故障診斷 |
| UC-096 | 正式服務日誌與部署時間線初判 | Grok Bot／Loki／Grafana／VPS | [葡文作者實際使用自述；未重現](cases/096-production-log-deploy-triage.md) | 開發｜日誌、部署、故障診斷 |

| UC-097 | 把分散的公開資料，疊成持續更新的地圖 | Grok Bot／Google 衛星底圖／公開資料 | [作者實際使用自述；未重現](cases/097-public-gis-layer-map.md) | 開發｜地圖、資料整合、排程 |
| UC-098 | 把多份工程 PDF，整理進固定 Excel 欄位 | Grok Bot／PDF／Excel | [作者實際使用自述；未重現](cases/098-engineering-pdf-excel-extraction.md) | 工作｜文件擷取、試算表、驗收 |
| UC-099 | 每天放入旅行照片，回來就有按天編好的紀念冊 | Grok Bot／照片資料夾 | [作者實際使用自述；未重現](cases/099-travel-photo-scrapbook.md) | 創作｜照片、旅遊、編輯、驗收 |

| UC-101 | 先篩掉不合資格的招標，再把值得投的機會交給你 | Grok Bot | [作者實際使用自述；未重現](cases/101-procurement-capability-shortlist.md) | 工作｜招標、能力比對 |
| UC-102 | 法規改了，先找出公司哪張安全表單需要修 | Grok Bot | [作者實際使用自述；未重現](cases/102-regulatory-change-safety-form-draft.md) | 工作｜法規、文件修訂 |
| UC-103 | 兩份保險方案資料對不起來，先列出需要人工確認的差異 | Grok Bot | [作者實際使用自述；未重現](cases/103-insurance-crm-plan-code-reconciliation.md) | 工作｜CRM、資料校對、隱私 |

| UC-104 | 把家譜變成看得懂的生命時間線，再印成海報 | Meta Muse | [作者實作自述；未重現](cases/104-genealogy-animation-print.md) | 創作｜家譜、資料視覺化、動畫、列印 |
| UC-105 | 抽屜裡的舊禮物卡，整理成餘額與人工待查清單 | Meta Muse | [作者實作自述；未重現](cases/105-gift-card-balance-inventory.md) | 省錢｜禮物卡、盤點、試算表、驗收 |
| UC-106 | 把角色圖做成8張動態LINE貼圖，連申請包一起備好 | ChatGPT dots | [作者實作自述；未重現](cases/106-animated-line-sticker-submission-package.md) | 創作｜貼圖、動畫、格式驗收、多語文案 |

| UC-107 | 找回散落各站的舊文章，做成每天聽一篇的私人回憶集 | Meta Muse | [產品員工實作自述，原主持人整理；未重現](cases/107-old-blog-private-audio-archive.md) | 生活｜舊文復原、數位保存、語音、每日 |
| UC-108 | 打一場球後，把逐桿資料變成看得懂的賽後回顧 | Meta Muse | [產品員工實作自述，原主持人整理；未重現](cases/108-golf-round-practice-data-review.md) | 生活｜高爾夫、數據分析、練習回顧、驗收 |

| UC-109 | 超市優惠券要逐張領？協助啟用後核對結果 | Meta Muse | [作者實作自述，較手動慢；未重現](cases/109-supermarket-coupon-activation.md) | 省錢｜優惠券、驗收 |

| UC-110 | 做遊戲雛形，再以人工試玩修正節奏 | ChatGPT dots／Roblox Studio | [作者實作自述；影片未看、未重現](cases/110-roblox-playtest-prototype.md) | 創作｜遊戲、試玩、驗收 |
| UC-111 | 工程資料對上圖面，留下可追查紀錄 | ChatGPT dots／PDF／DXF | [公司實作自述；工程正確性未核](cases/111-engineering-drawing-source-traceability.md) | 工作｜工程、圖面、溯源 |

| UC-112 | 把角色圖變成可轉眼的實體小模型 | Grok Bot／Bambu | [作者實作自述；未重現](cases/112-image-to-printable-articulated-model.md) | 創作｜3D列印、分件 |
| UC-113 | 建築模型的外牆與內裝方案比較 | Grok Bot／Sunburst | [作者實作自述；未重現](cases/113-architecture-material-visual-comparison.md) | 創作｜建築、材質、驗收 |
| UC-114 | 既有教材保留內容的省紙重排 | Grok Bot／PDF | [作者實作自述；未重現](cases/114-existing-worksheet-print-layout.md) | 學習｜教材、排版、列印 |
| UC-115 | 帶骨架與動畫的可重用角色資產 | Grok Bot／Three.js | [作者實作自述；未重現](cases/115-rigged-character-asset-export.md) | 創作｜3D角色、骨架、匯出 |

| UC-116 | Slack需求轉品牌一致的報價草稿 | Grok Bot／Slack／Notion／PDF | [西文作者實作自述；價格與對外交付未核](cases/116-slack-branded-quote-draft.md) | 工作｜報價、草稿、審核 |

| UC-117 | 故障產品保固換貨與到貨追蹤 | Grok Bot | [作者評論自述；品牌訂單未核](cases/117-warranty-replacement-tracking.md) | 生活｜保固、換貨、追蹤 |
| UC-118 | 代理郵件改收件者前的核准分流測試 | Grok Bot／Meta Muse | [作者虛構商家測試；未重現](cases/118-agent-email-rerouting-consent-test.md) | 開發｜收件匣、核准、測試 |

| UC-119 | 夢幻球隊先發建議與核准後調整 | Meta Muse | [作者實作自述；得分未獨立核](cases/119-fantasy-lineup-approval-review.md) | 生活｜運動、名單、核准 |
| UC-120 | 自然結構照片到材料模擬與樣件 | Grok Bot／Bambu Studio | [研究者實作自述；實物性能未驗](cases/120-bioinspired-material-simulation-specimen.md) | 學習｜材料、模擬、製造 |

| UC-121 | 跨領域創意參考圖與視覺分類表 | ChatGPT dots／Pinterest | [日文作者實作自述；表格未核](cases/121-visual-reference-classification-sheet.md) | 創作｜圖片、分類、溯源 |
| UC-122 | 音訊到xLights燈光秀序列草稿 | Grok Bot／xLights | [作者實作自述；配置有限、影片未看](cases/122-audio-lightshow-sequence-draft.md) | 創作｜燈光、音樂、驗收 |

| UC-123 | 手遊日常素材收集與人工接手 | ChatGPT dots | [作者實作自述；遊戲條款及紀錄未核](cases/123-mobile-game-resource-handoff.md) | 生活｜遊戲、接手、中止 |
| UC-124 | 車輛手冊與維修紀錄的保養待核清單 | Grok Bot／Road Trip | [作者實作自述；保養判斷未核](cases/124-vehicle-maintenance-record-review.md) | 生活｜車輛、保養、核對 |

| UC-125 | 摩斯解碼器硬體在環測試與修正 | Grok Bot／ESP32 | [德文作者實跑；附件未讀、未重現](cases/125-morse-decoder-hardware-loop-test.md) | 開發｜硬體、音訊、測試 |
| UC-126 | 屋頂工程許可、檢查及保險通知準備 | Grok Bot | [承包商實作自述；行政核准未核](cases/126-roofing-prework-admin-handoff.md) | 工作｜工程、表單、核准 |

| UC-127 | 跨語音與Slack日曆錯置修正 | ChatGPT dots／Calendar | [韓文作者實驗；虛構工作坊](cases/127-cross-channel-calendar-correction.md) | 工作｜日曆、錯誤修正、驗收 |
| UC-128 | 測試SQL月別稅類營收查詢覆核 | Grok Bot／SQL | [德文作者測試；查詢正確性未核](cases/128-test-database-revenue-query-review.md) | 工作｜資料庫、營收、核對 |
| UC-129 | 門市庫存快照、缺貨與賣速分母驗收 | Grok Bot／CSV | [作者實作及計算錯誤報告；未重現](cases/129-store-stockout-velocity-audit.md) | 工作｜庫存、資料合併、缺貨、驗收 |
| UC-130 | 備品門檻補貨、批准及訂單台帳對帳 | Grok Bot／Notion／Amazon | [作者受控實購測試；回寫延遲與權限限制](cases/130-supplies-reorder-ledger-reconciliation.md) | 工作｜備品、補貨、核准、對帳 |
| UC-131 | 學生示範影片與程式作品教師預審 | ChatGPT dots／Whisper／GitHub | [原作者已用自述；回饋正確性未核](cases/131-student-demo-code-prereview.md) | 學習｜教學、作品、影片、覆核 |
| UC-132 | 播客逐字稿分說話者與檢索前處理 | Grok Bot／Foundry | [原作者部分完成自述；RAG未完成](cases/132-podcast-transcript-retrieval-preparation.md) | 學習｜播客、逐字稿、資料整理、檢索 |
| UC-133 | 餐廳菜單轉螢幕閱讀器標題式網頁 | Meta Muse | [原作者實用自述；成品及現版未驗](cases/133-screen-reader-menu-reformat.md) | 生活｜無障礙、菜單、螢幕閱讀器、網頁 |
| UC-134 | 手寫廚房訂貨單到供應商購物車 | Grok Bot／TEACH | [原作者失敗後示範重跑；仍有錯誤](cases/134-handwritten-kitchen-order-cart.md) | 工作｜餐飲、訂貨單、示範、驗收 |
| UC-135 | 課間空檔與步行時間的校園餐次安排 | Grok Bot／Calendar | [原作者已建日曆自述；路線營養未驗](cases/135-campus-meal-window-planning.md) | 生活｜校園、用餐、行程、步行 |
| UC-136 | 社區公園需求、造價與資金途徑提案 | Meta Muse | [作者已備提案自述；無核准或募資結果](cases/136-community-park-feasibility-proposal.md) | 工作｜社區、公共空間、提案、證據 |
| UC-137 | 到圖書館才發現還沒設定列印？先把PDF排進佇列 | Meta Muse／Stanford Cardinal Print | [作者實作自述；未重現](cases/137-visitor-print-queue-handoff.md) | 生活｜列印、文件、交接、驗收 |
| UC-138 | 路燈壞了？先找對設備編號，再送修並追蹤回信 | Grok Bot | [作者實作自述；未重現](cases/138-streetlight-fault-report-handoff.md) | 生活｜公共設施、報修、交接 |
| UC-139 | 旅行丟了包？先查失物招領清單，找到候選再認領 | Grok Bot | [作者實作自述；未重現](cases/139-lost-property-match-search.md) | 生活｜旅遊、失物、搜尋、核對 |
| UC-140 | 機器人只看到平面影像？先驗證估距，再談移動 | Meta Muse／Depth Anything V2 | [作者實作自述；未重現](cases/140-monocular-depth-robot-offline-review.md) | 開發｜視覺、機器人、估距、驗收 |
| UC-141 | 停車時掉了多少電？把車輛讀值和資料中斷一起看 | Meta Muse／Rivian | [作者實作自述；未重現](cases/141-vehicle-telemetry-gap-dashboard.md) | 生活｜車輛、遙測、看板、資料缺口 |
| UC-142 | 以前分享給某人的資料夾，現在還有哪些能被打開？ | Grok Bot／Google Drive | [作者自述；未重現](cases/142-historical-folder-access-revocation.md) | 工作｜共享權限、資料夾、核對、核准 |
| UC-143 | 可能有遺忘的款項？先查官方條目，別把找到當領到 | Grok Bot／MissingMoney | [作者自述；未重現](cases/143-unclaimed-property-candidate-handoff.md) | 省錢｜公開查詢、候選核對、認領、交接 |
| UC-144 | 把古籍變成可對照原文的譯作，疑義別藏起來 | Grok Bot／Via Patrum／多提供者AI | [作者自述＋公開譯作；未重現](cases/144-classical-translation-source-review.md) | 學習｜翻譯、古籍、來源查證、驗收 |
| UC-145 | 同一份調查表一直重抄？用假資料先驗證每個欄位有沒有漏 | Grok Bot／ChatGPT／Claude | [作者實驗／使用報告；未重現](cases/145-offline-standard-form-field-validation.md) | 工作｜表單、離線工具、欄位核對、驗收 |
| UC-146 | 補助文件看似齊了？先核每一項要求有沒有證據 | ChatGPT dots／Google帳號資料 | [作者實驗／使用報告；未重現](cases/146-grant-supporting-document-gap-check.md) | 生活｜補助、文件核對、缺漏、交接 |
| UC-147 | 一桌人想吃的不一樣？先讓偏好代理提出、拒絕再修訂 | Grok Bot／webhook／mirai-menu | [作者實驗／使用報告；未重現](cases/147-group-meal-bot-negotiation-demo.md) | 開發｜多代理、協商、餐飲、原型 |
| UC-148 | 課程時間打架、學分又怕重算？先用規劃表找待核問題 | Grok Bot／課程資料／後續Claude Fable共同開發 | [作者實作／使用報告；未重現](cases/148-course-degree-planning-prototype.md) | 學習｜選課、衝突、學分、規劃 |
| UC-149 | 投稿說送出了，頁面真的上線了嗎？ | ChatGPT dots／公開目錄 | [作者實作／使用報告；未重現](cases/149-directory-submission-live-link-verification.md) | 工作｜投稿、狀態核對、連結、驗收 |
| UC-150 | 日期看起來沒錯，公式卻算不動？先找資料型別問題 | ChatGPT dots | [作者實作／使用報告；未重現](cases/150-spreadsheet-date-formula-repair.md) | 工作｜試算表、日期、公式、修復 |
| UC-151 | 房訂好了還不能直接入住？把付款失敗和門禁前置事項找出來 | Meta Muse／Booking／Gmail | [作者實作自述；未重現](cases/151-booked-stay-prerequisite-followup.md) | 生活｜旅遊、住宿、前置事項、追蹤 |
| UC-152 | 面試後記錄堆著？先把證據整理好，再由面試官判斷 | Grok Bot／Granola或錄影／ATS | [廠商員工實作自述；未重現](cases/152-interview-evidence-feedback-draft.md) | 工作｜面試、證據、草稿、人工覆核 |
| UC-153 | 準備下一次跑團？先把冒險、地圖和主持資料組起來 | ChatGPT dots／作者另用一般ChatGPT審查 | [作者實作自述；未重現](cases/153-tabletop-adventure-material-pack.md) | 創作｜桌遊、冒險、地圖、主持材料 |
| UC-154 | 採購合約卡在哪一段？把等待時間整理成待核統計 | Grok Bot／合約系統匯出／Sheets | [廠商員工實作自述；未重現](cases/154-contract-review-wait-time-analysis.md) | 工作｜採購、流程、等待時間、統計 |
| UC-155 | 早上工單臨時變了，誰還沒收到通知？ | Meta Muse／工單板／簡訊／Slack | [作者實作自述；未重現](cases/155-field-service-job-change-coordination.md) | 工作｜工單、現場服務、通知、核對 |
| UC-156 | 信箱搬到新平台了，舊信和新信都真的正常嗎？ | Grok Bot／作者未指明的遷移工具／Microsoft郵件服務 | [作者實作／失敗自述；未重現](cases/156-mail-system-migration-verification.md) | 開發｜郵件、移轉、驗收、備份 |
| UC-157 | 改一條線卻多出別的東西？別只看Bot自製預覽 | Grok Bot／Draw.io | [作者實作／失敗自述；未重現](cases/157-editable-diagram-geometry-readback.md) | 創作｜圖面、幾何、圖層、驗收 |

| UC-158 | 收過款卻漏了出貨單？別用猜的地址和商品補回去 | Grok Bot多代理／Cursor／Stripe／Prodigi | [作者實作／失敗報告；未重現](cases/158-paid-orphan-order-recovery-review.md) | 工作｜訂單、對帳、履約、失敗 |
| UC-159 | 畫得不像就重來？先檢查筆刷、填色與工具模式 | Grok Bot／Krita／Paint | [作者實作／失敗報告；未重現](cases/159-reference-portrait-brush-fill-failure.md) | 創作｜繪圖、筆刷、填色、失敗 |
| UC-160 | 不只生成外殼：印出來、裝起來、玩過才知道哪裡不對 | ChatGPT dots／ESP32-S3／外殼CAD | [作者實作／失敗報告；未重現](cases/160-handheld-device-integrated-prototype.md) | 開發｜實體原型、韌體、外殼、驗收 |

| UC-161 | 比較AI答案前，先檢查原文、拒答和測試條件有沒有漏 | Grok Bot／公開CSV／作者後續使用OpenAI模型與Codex | [作者實作報告；未重現](cases/161-cross-model-response-dataset-audit.md) | 學習｜模型評估、資料集、來源、驗收 |
| UC-162 | 模型變輕了，重要零件還看得見嗎？ | ChatGPT dots／作者未指明的建模與渲染工具 | [作者實作報告；未重現](cases/162-mesh-simplification-camera-state-review.md) | 創作｜3D、減面、相機、驗收 |

| UC-163 | 舊文章搬家，別讓十年前的內容變成今天新發的 | Grok Bot／WordPress／EasyWP／既有匯出檔 | [作者實作／失敗報告；未重現](cases/163-legacy-cms-history-migration.md) | 工作｜網站遷移、歷史內容、轉址、驗收 |
| UC-164 | 只是關掉舊工單，為什麼Bot還在狂讀另一套系統？ | Grok Bot／Atlassian MCP／Jira／Zendesk瀏覽器 | [作者實作／失敗報告；未重現](cases/164-stale-ticket-retirement-scope-stop.md) | 工作｜工單、批次清理、限流、失敗 |

| UC-165 | 安全稽核只回大方向？要求指出哪一行、哪一條規則 | Grok Bot／合成Cisco設定／作者取得的CIS文件 | [作者實作報告；未重現](cases/165-offline-network-control-evidence-review.md) | 開發｜離線稽核、設定、證據、誤報 |
| UC-166 | 整張表靠右了，為什麼數字和問號還是顛倒？ | Grok Bot／Word／Excel／PDF檢視 | [作者實作報告；未重現](cases/166-bidirectional-document-reading-order.md) | 工作｜文件、雙向文字、試算表、驗收 |

| UC-167 | 選單看得到卻按不到？先留下位置、畫面和程式證據 | Grok Bot／Blocks.ai／Chrome | [廠商實作自述；原證據包未公開](cases/167-web-accessibility-evidence-pack.md) | 開發｜無障礙、網頁、證據、驗收 |

| UC-168 | 客戶傳來舊訂貨單？先找出缺貨色號和價格差異 | Meta Muse | [作者影片描述自述；影片未看、轉錄未核](cases/168-customer-order-availability-price-review.md) | 工作｜訂單、缺貨、價格、驗收 |

| UC-169 | 程式正常結束，結果卻全是零？先驗證載重真的進去了 | Meta Muse／數值求解器 | [公開對話與產物；未重跑，整體未驗證](cases/169-cantilever-solver-verification-failure.md) | 開發｜數值模擬、基準、單位、失敗 |
| UC-170 | 日落開燈、睡前關簾，先把觸發和例外講清楚 | Grok Bot／Home Assistant／MCP | [作者實作自述；無設定日誌](cases/170-home-scene-automation-review.md) | 生活｜居家、場景、自動化、驗收 |

| UC-171 | 信用報告錯誤的證據與爭議草稿 | Meta Muse | [作者自述；未取得報告與受理結果](cases/171-credit-report-dispute-evidence-preparation.md) | 生活｜信用報告、證據、草稿 |
| UC-172 | 個人歌單年代曲風分類與版本去重 | Meta Muse／Spotify | [兩位作者自述，含產品方；未逐曲核實](cases/172-personal-playlist-era-genre-curation.md) | 生活｜音樂、歌單、去重 |

| UC-173 | 前端效能假設實驗與回退 | Grok Bot／Fable／Lighthouse | [公開PR產物及作者自述；未合併、未重跑](cases/173-frontend-performance-hypothesis-experiments.md) | 開發｜效能、實驗、回退 |
| UC-174 | 有狀態批次表單中斷對帳 | Grok Bot | [作者實際操作與故障自述；無收據核付證據](cases/174-stateful-batch-form-reconciliation.md) | 工作｜表單、批次、對帳 |

| UC-175 | 團體代付分攤與收款對帳 | Meta Muse | [作者使用及分母錯誤自述；無原表與交易紀錄](cases/175-group-expense-obligation-reconciliation.md) | 生活｜分帳、代付、對帳 |

| UC-176 | 房產盡調資料包缺件與揭露審閱 | Grok Bot／Google Drive | [作者整理交付自述；原包與成交未核](cases/176-property-diligence-package-crosscheck.md) | 工作｜資料包、盡調、缺件 |

| UC-177 | 電路板來源與求解覆蓋核對 | Grok Bot／KiCad／Adom／Claude Code | [廠商實作與公開版本紀錄；未重現、無實體驗證](cases/177-pcb-design-solver-coverage-review.md) | 開發｜電路板、來源、覆蓋 |

| UC-178 | 掃描頁圖文重建與完整性核對 | Grok Bot／PDF／Markdown | [作者失敗實作自述；原件與成品未公開](cases/178-scanned-page-text-image-reconstruction.md) | 工作｜掃描、圖文、完整性 |

| UC-179 | 對客郵件重複觸發流程修復 | Meta Muse／未具名郵件平台 | [官方具名測試者自述；無流程與事件紀錄](cases/179-duplicate-customer-email-flow-repair.md) | 工作｜郵件、自動化、重複觸發 |

| UC-180 | 相片庫標題與描述性中繼資料補齊 | Meta Muse／iCloud Photos | [作者部分處理自述；無寫回與恢復結果](cases/180-photo-library-descriptive-metadata.md) | 生活｜相片、描述、無障礙 |

| UC-181 | 出貨標籤與訂單履約準備 | Grok Bot／TikTok Shop | [作者實際使用自述；無寄件與交付紀錄](cases/181-shipping-label-fulfillment-preparation.md) | 工作｜電商、物流、標籤 |
| UC-182 | 依閱讀需求選書與圖書館預約 | Meta Muse／未具名圖書館 | [作者預約及可取通知自述；未領取驗證](cases/182-library-book-selection-holds.md) | 生活｜閱讀、圖書館、預約 |

| UC-183 | 廣告活動設定到待發布，再交人檢查 | Meta Muse／Google Ads | [作者已配置自述；未核投放](cases/183-ad-campaign-configuration-review.md) | 工作｜廣告、設定、核准、驗收 |

| UC-184 | 大量郵件先篩出相關候選，別把它當最終證據審查 | Grok Bot／mbox | [作者已初篩自述；雲端上傳更正、完整性未核](cases/184-mail-archive-relevance-prescreen.md) | 工作｜郵件封存、初篩、隱私、驗收 |

| UC-185 | 活動資料到排行榜與人工核獎草稿 | Grok Bot／Canva | [作者使用自述；未核原始成績與獎狀](cases/185-event-results-leaderboard-awards.md) | 工作｜活動、排行榜、核准 |
| UC-186 | 假註冊造成寄信健康事故的核對 | Grok Bot／HubSpot | [作者事件及修復自述；恢復投遞未核](cases/186-registration-pollution-mail-health.md) | 工作｜退信、資料污染、事故 |
| UC-187 | 測繪批次XML生成與原軟體檢核 | Grok Bot／POSPac Complete | [業界作者實際支援案件自述；精度未核](cases/187-survey-batch-configuration-validation.md) | 工作｜測繪、設定、驗收 |

| UC-188 | 動態費率估算與充電時窗核對 | Grok Bot／PSE／Home Assistant | [作者運行自述；RCE對零售費率仍待核](cases/188-dynamic-tariff-charging-window-review.md) | 省錢｜電價、費率、充電 |

| UC-189 | 文章朗讀與波形影片返工 | ChatGPT dots／ElevenLabs | [日文作者成品自述；音訊影片未播放](cases/189-article-narration-waveform-review.md) | 創作｜朗讀、波形、驗收 |
| UC-190 | 服務帳單準備與寄送狀態核對 | Grok Bot／未具名管理軟體 | [作者已開票寄送自述；收件合規未核](cases/190-service-invoice-draft-reconciliation.md) | 工作｜工單、發票、核准 |
| UC-191 | 播客音樂廣告編排與聽審 | Grok Bot／Descript | [作者聽審後手改自述；上架未核](cases/191-podcast-segment-edit-listen-review.md) | 創作｜播客、音軌、時間碼 |

| UC-192 | 客戶討論收斂成開工需求 | ChatGPT dots／Slack | [作者實際協作自述；原決策文件未核](cases/192-client-requirements-decision-clarification.md) | 工作｜客戶、需求、決策 |

| UC-193 | 遺失對話的殘存資料復原與重開核對 | Grok Bot／Codex | [作者恢復自述；完整性未核](cases/193-deleted-conversation-readable-recovery.md) | 工作｜復原、對話、驗收 |
| UC-195 | 註冊旅程與完成事件時點核對 | Grok Bot／GA4 | [韓文作者實測自述；後續修正待做](cases/195-conversion-event-journey-timing-audit.md) | 工作｜分析、事件、驗收 |

| UC-196 | 私人陪練控制角色與事件紀錄驗收 | Grok Bot／StarCraft II／腳本控制器 | [公開對局與測試產物；修後真局未核](cases/196-private-game-session-log-validation.md) | 開發｜遊戲、事件、驗收 |

| UC-197 | 既有零件裝配的位置與介面驗收 | Grok Bot／CadQuery | [作者量測與圖片；原CAD未公開](cases/197-supplied-part-assembly-geometry-audit.md) | 開發｜CAD、裝配、驗收 |
| UC-198 | 實驗前文件缺口與教師確認 | Grok Bot／LabReady | [作者測試自述；影片與原包未核](cases/198-prelab-document-gap-review.md) | 學習｜實驗課、文件、缺件 |

| UC-199 | 比分直播排程與播放狀態核對 | Grok Bot／YouTube | [作者已用自述；頻道日誌未公開](cases/199-scheduled-score-stream-state-review.md) | 創作｜直播、排程、驗收 |
| UC-200 | 舊統計分析重跑與結果對照 | ChatGPT dots／R | [作者進行中比對自述；原碼數據未核](cases/200-prior-statistical-analysis-rerun-comparison.md) | 學習｜統計、重跑、驗收 |

| UC-201 | 傷害比較覆蓋與錯誤排名更正 | ChatGPT dots／Python／Node.js | [作者及公開更正；原數值未逐核](cases/201-damage-comparison-coverage-correction.md) | 開發｜比較、樣本、更正 |

| UC-204 | 審閱後原型到既有網站後台重建 | ChatGPT dots／未具名CMS | [媒體作者完成自述；差異回退未核](cases/204-reviewed-prototype-cms-rebuild.md) | 工作｜網站、原型、驗收 |
| UC-205 | 創作概念表達與命名年代核對 | ChatGPT dots | [作者完成自述；原語料未公開](cases/205-concept-origin-naming-chronology.md) | 創作｜源流、年代、來源 |

| UC-206 | 本人跨帳戶轉帳配對與漏記差額 | ChatGPT dots／YNAB | [作者使用自述；原帳本未核](cases/206-own-account-transfer-reconciliation.md) | 省錢｜記帳、轉帳、差額 |

| UC-207 | 多條閘門未觸發的運行複盤 | Grok Bot／routines | [作者失敗自述；模擬構想未執行](cases/207-trigger-gate-nonexecution-retrospective.md) | 開發｜條件、失敗、驗收 |

| UC-208 | 跨主機作業技能綁定與核准驗收 | Grok Bot／BlackOps MCP | [廠商實作自述；無原始日誌](cases/208-portable-skill-binding-approval-check.md) | 開發｜技能、移植、核准 |
| UC-209 | 跨試算表環境公式語意驗收 | ChatGPT dots／Excel／Google Sheets | [作者失敗自述；未修復驗證](cases/209-spreadsheet-cross-app-formula-validation.md) | 工作｜試算表、相容性、失敗 |

| UC-210 | 天文觀測條件與目標依據核對 | Grok Bot／Astronomer | [公開實作驗收；無野外驗證](cases/210-astronomy-conditions-target-planning.md) | 生活｜天文、規劃、驗收 |

| UC-211 | 版本化程序角色留痕與人工交接 | Grok Bot／Way We Do | [廠商實作自述；無完整後台紀錄](cases/211-versioned-procedure-role-handoff.md) | 工作｜程序、版本、交接 |

| UC-212 | 公共資料缺漏欄位有來源修訂提案 | Meta Muse／Excel | [公開表格產物；未逐值驗證或寫回](cases/212-public-dataset-field-update-proposals.md) | 工作｜資料、缺漏、來源 |

| UC-213 | 故事板動態特效時點比較與返工 | ChatGPT dots／Codex | [作者返工自述；平台連續動作待測](cases/213-storyboard-timed-effect-visual-review.md) | 創作｜特效、時序、驗收 |

| UC-214 | 發布產物與實際運行版本讀回 | Meta Muse／Codex／Python | [作者發布自述；業務與回退待驗](cases/214-release-artifact-runtime-identity-check.md) | 開發｜發布、環境、驗收 |

| UC-215 | 指定食譜信夾轉結構化收藏 | Grok Bot／Outlook／GitHub | [作者使用自述；原頁與排程未核](cases/215-recipe-inbox-structured-collection.md) | 生活｜食譜、收藏、驗收 |
| UC-216 | 拍攝組挑片與預設修圖交接 | Grok Bot／Lightroom Web | [作者使用自述；照片與計時未核](cases/216-photo-shoot-selection-preset-handoff.md) | 創作｜攝影、挑片、驗收 |

| UC-217 | HDL建置後功能回歸阻擋交付 | Grok Bot／Gowin／GHDL | [公開失敗報告；未重跑或燒錄](cases/217-hdl-build-functional-regression-gate.md) | 開發｜硬體、回歸、驗收 |

| UC-218 | 第三方技能安裝前來源版本與權限審閱 | ChatGPT dots | [公開審閱截圖；風險未獨立證實](cases/218-third-party-skill-install-trust-review.md) | 開發｜技能、版本、權限 |

| UC-219 | PDF內嵌導航與閱讀器書籤範圍驗收 | Meta Muse／forScore | [公開實作與手機展示；全冊未逐核](cases/219-pdf-internal-navigation-bookmark-validation.md) | 創作｜PDF、導航、驗收 |

| UC-220 | 二手商品官方召回候選排除 | Meta Muse／CPSC | [原貼截圖及公告；個別型號未核](cases/220-used-product-recall-candidate-screening.md) | 生活｜購物、召回、核對 |
| UC-221 | 本人簽署前後文件與完成副本交接 | Meta Muse／No Errands | [廠商自簽測試；原件與他人簽署未核](cases/221-human-signature-completed-copy-handoff.md) | 工作｜文件、簽署、交接 |

| UC-222 | 舊業務規則與新測試依據核對 | Grok Bot／Cursor／Jev | [作者測試自述；修後驗收未核](cases/222-legacy-business-rule-test-oracle-review.md) | 開發｜測試、規則、驗收 |
| UC-223 | 光電發電與電費帳期用量對照 | Meta Muse／SolarEdge | [原圖產物；估算公式未核](cases/223-household-solar-billing-period-reconciliation.md) | 省錢｜光電、帳期、用電 |

| UC-224 | 多剪影共同幾何反求與投影誤差驗收 | Grok Bot／WebGL2 | [公開數位原型；字樣部分失敗、未製造](cases/224-multi-shadow-shared-geometry-inverse-design.md) | 創作｜幾何、光影、驗收 |

| UC-225 | 支出收據缺件與交易憑證配對 | Grok Bot／Codex／Money Forward | [作者使用自述；原始配對未核](cases/225-receipt-transaction-evidence-matching.md) | 工作｜收據、對帳、缺件 |
| UC-226 | 展示照片與相框列印尺寸匹配 | Grok Bot | [作者完成自述；實體尺寸未核](cases/226-photo-wall-frame-print-fit.md) | 創作｜照片、尺寸、列印 |

| UC-227 | 地圖收藏分組與失效項目覆核 | Meta Muse／Google Maps | [作者使用自述；日期與實際清單未核](cases/227-saved-map-places-list-maintenance.md) | 生活｜地圖、收藏、整理 |
| UC-228 | 總電表波形與人工事件增量歸因 | Grok Bot／Home Assistant | [公開曲線與實作；原始量測未核](cases/228-household-power-waveform-attribution.md) | 生活｜能源、時序、反例 |

| UC-229 | macOS發佈簽署與公證證據鏈核對 | Grok Bot／Cursor／GitHub | [作者實作及公開PR；未驗下載包](cases/229-macos-distribution-signing-evidence.md) | 開發｜發佈、簽署、驗收 |
| UC-230 | 按人員報酬規則準備待審薪酬批次 | Grok Bot／CRM／Deel | [作者使用自述；無原表或支付證據](cases/230-compensation-batch-human-review.md) | 工作｜薪酬、規則、核准 |
| UC-231 | 多軌工程技術整備與粗混音交接 | Grok Bot／Ableton／Console 1 | [作者完成自述；無音訊驗證](cases/231-multitrack-session-rough-mix-handoff.md) | 創作｜音訊、混音、驗收 |
| UC-232 | 已購教材下載盤點與到檔核對 | ChatGPT dots | [作者親數到檔自述；未核內容完整性](cases/232-purchased-resource-delivery-reconciliation.md) | 學習｜下載、檔案、驗收 |
| UC-233 | 訂閱營收指標折扣口徑覆核 | ChatGPT dots | [作者已發現計算問題自述；無更正結果](cases/233-recurring-revenue-discount-definition-review.md) | 工作｜訂閱、營收、驗收 |
| UC-234 | 待寄附件與核定提案一致性關卡 | Grok Bot／SharePoint／Planner | [作者運作及攔錯自述；無原件日誌](cases/234-proposal-attachment-consistency-send-gate.md) | 工作｜附件、核准、驗收 |
| UC-235 | 歷史回測凍結紀錄與執行界線核對 | Grok Bot／NexusTrade | [平台作者公開整理紀錄；未獨立重跑](cases/235-backtest-freeze-evidence-boundary-review.md) | 學習｜研究、回測、失敗驗收 |

| UC-236 | 事件播放暫停保留與原狀恢復分析 | Grok Bot／事件原型 | [公開原型及修正；平台用途有限制](cases/236-event-playback-state-restoration-prototype.md) | 開發｜事件、恢復、反例 |
| UC-237 | 草圖零件STEP與製造規格交接 | Grok Bot／Claude Code／Xometry | [作者下訂自述；原檔實物未核](cases/237-sketch-part-step-manufacturing-handoff.md) | 開發｜CAD、零件、交接 |

| UC-238 | 外掛事件分發範圍與人工通報交接 | Grok Bot／WP Beacon | [公開事件報告；渠道與現況未獨立驗證](cases/238-release-channel-exposure-incident-review.md) | 開發｜資安、版本、證據 |

| UC-239 | 穿戴端雙向會話交付與歷史狀態驗收 | ChatGPT dots／Dot Link／Even G2 | [作者實機紀錄；延遲與版本限制保留](cases/239-wearable-conversation-delivery-state-validation.md) | 開發｜穿戴、會話、驗收 |
| UC-240 | 雙語受控詞彙與語意資料匯出 | Grok Bot／SKOS | [作者自述＋公開產物；未驗科學有效性](cases/240-bilingual-controlled-vocabulary-export.md) | 學習｜資料交換、驗收 |
| UC-241 | 社群參與申請疑似垃圾初篩與人審 | Meta Muse／Facebook | [作者使用自述；無準確率與原隊列](cases/241-community-participation-spam-review.md) | 工作｜社群、核准、驗收 |

| UC-242 | 航空公告與觀測簡報人工覆核 | Grok Bot | [作者使用自述；附件未讀、非飛行判定](cases/242-aviation-bulletin-observation-brief-review.md) | 工作｜公告、時效、覆核 |

| UC-243 | 口語影片逐詞字幕與直式成品交付 | Grok Bot | [作者自述及交付圖；未播放整片](cases/243-spoken-video-word-caption-delivery.md) | 創作｜字幕、同步、驗收 |

| UC-244 | 導航路線檔修復與裝置交接 | Grok Bot／Ride with GPS／Garmin | [作者修復自述；無原檔及安全驗證](cases/244-navigation-file-repair-device-handoff.md) | 生活｜導航、同步、驗收 |

| UC-245 | 目錄主單品與虛構配件穿搭方案 | Meta Muse | [作者使用自述；圖片未讀、非合身驗證](cases/245-catalog-outfit-composition-provenance.md) | 生活｜穿搭、生成圖、驗收 |

| UC-246 | 多方案會員權益扣抵順序診斷 | Meta Muse／Mindbody | [作者診斷自述；無修後驗收](cases/246-membership-entitlement-consumption-order-diagnosis.md) | 工作｜會員、扣抵、驗收 |

| UC-247 | 停車繳費證據與罰單初審交接 | Grok Bot | [作者提交自述；未核受理及裁定](cases/247-parking-citation-payment-evidence-review.md) | 生活｜停車、證據、核准 |
| UC-248 | 跨代理群聊資料揭露與單向交接 | Meta Muse／Telegram／OpenClaw | [作者失誤及改架構自述；隔離效果未驗](cases/248-cross-agent-conversation-disclosure-boundary.md) | 工作｜隱私、交接、驗收 |

| UC-249 | 閱讀頁序到單張八頁小誌拼版 | Grok Bot／Cursor／Flutter | [公開原碼與PDF預覽；未實印折](cases/249-eight-panel-zine-imposition-output.md) | 創作｜小誌、拼版、驗收 |

| UC-250 | 郵件資料搬遷與收信路由接管驗收 | Grok Bot／Microsoft／MXroute | [兩位作者完成自述；無對帳或收發日誌](cases/250-mail-migration-data-routing-cutover.md) | 工作｜郵件、搬遷、驗收 |

## 驗證與模板補充（3，不列新增成功案例）

| 編號 | 補充 | 狀態 | 情境／標籤 |
| --- | --- | --- | --- |
| UC-008 | [晨報覆蓋與排程驗收](evidence/008-morning-brief-validation.md) | 作者實測限制補充；不能承諾完整或準時 | 工作｜每日、晨報、收件匣、排程 |
| UC-009 | [背景移轉模板與作者實際索引](evidence/009-background-transfer-template.md) | 新增B級作者實作；尚待分類核對，未加500計數 | 開發｜跨助手移轉、模板 |
| UC-013 | [登入狀態診斷與失敗報告驗收](evidence/013-authentication-diagnosis.md) | 作者失敗復盤；根因未確認修復 | 開發｜登入、故障診斷 |

## 待查來源（3）

[查看來源與缺漏](sources/pending.md)：Muse 十用法影片、電信降費、生成／CUA 驗收迭代。這些不計入成功案例；未查證的轉述不補寫成操作步驟。

## 使用方式

1. 先讀來源報告及限制，再決定是否適合自己的情境。
2. 提示詞均為整理者原創設計、未實跑；以小範圍、只讀驗收開始。
3. 研究內容不構成登入、傳送資料、發信、付款、改設定或部署的授權。
4. 同一目標的新作者或工具版本併入既有頁，保留原始連結及日期，不重複計數。

[本次論壇探索範圍與缺漏](sources/forum-research-2026-10-13.md)

[官方發布與早期教學覆蓋盤點](sources/launch-coverage-2026-10-13.md)
