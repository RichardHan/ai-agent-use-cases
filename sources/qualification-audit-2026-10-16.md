# 案例計數稽核：有作者實作證據（含自述）

稽核日期：2026-10-16。基準為原 UC-001–094，另列新增 UC-095–099、UC-101–168。[案例索引](https://github.com/RichardHan/ai-agent-use-cases/blob/main/INDEX.md)

## 結論

- 舊94個編號中，82個可依受支持的實際任務計數，含已限縮為房源照片篩選的084及取得法文實作證據的089。091暫不計入，其具體帳單警示是去識別示例，未核某次實際交付。
- 新增095–099及101–168合計73個不同工作流程，連同現有82個，目前 **155 個有作者實作證據（含自述）**。091不因更改標題而轉正。
- 距500個不同實作工作流程尚差 **345**。
- 網站目前有164個主案例、3個補充及3條待查線索；167個編號或170個條目均不是合格工作流程計數。100尚未收錄，編號間隙不計案例。
- **有作者實作證據，不等於作者成效已證實。** 本稽核沒有獨立重現案例，也不認證節時、獲利、準確率、安全性或可靠性。失敗、沙盒測試與部分完成的流程可計數，但必須保留這些限制。

## 2026-10-17（台灣時間）計數更正

先前102含UC-008與UC-013兩項驗證補充，現保守扣除，改為100／500；內容完整保留，不把更名或改分類本身當新增案例。只有將來取得足夠獨立實際工作流程證據並重新去重，才重新評估。其餘補充009及待查P-001–003未計入；原P-004已讀到實際產物回報後才提升至101，沒有重複計數。

## 判準與證據等級

以不同的輸入／觸發、實質工作與使用者產出區分流程；換工具、作者、平台、排程、角色名稱或代理數量不增加計數。作者自述或實際示範可合格，不要求獨立重現。官方純假設情境、未執行模板、整理者設計的指令與待查線索不計。

- A：作者實跑測試，或已有公開產物／截圖／日誌支持；仍不是獨立重現。
- B：作者第一人稱使用或完成自述；完整產物與成效未獨立驗證。
- V：廠商或員工明確自述內部實際使用；商業利益與驗證限制須保留。
- H：純假設／官方能力建議；排除。
- T：未執行模板／設定；排除。
- U：無法取得充分的原始實作證據；待確認。

095–099這五案皆屬 B：兩位作者的五個不同工作流程，不能寫成五位作者或五次獨立驗證。[095–096 原作者](https://codecapital.substack.com/p/meus-principais-casos-de-uso-para-o-grok-bot)；[097–099 原作者](https://www.reddit.com/r/GrokBot/comments/1wa57uk/comment/p8gwy2e/)。

## 排除與待確認

- 009：只有背景移轉模板，沒有實際移轉報告。
- 028、029、032、033：帳單議價、運動改期、睡眠趨勢、年度業務分析僅有官方建議情境或設計範例。034新增原作者具體費用疑點後才納入，Muse部分仍是官方建議。
- 039：有競品模板與活動觀察，缺少可歸屬的作者執行結果。
- 092：與061重複的協調者／專家分工、任務台帳與證據回條，不因換成 Basecamp 等工具再計一次。
- 071：教學與設定內容不足以確認文中那個實際工作流程；原貼文未取得完整可讀證據。
- 089原跨領域清理仍未核；新增法文原作者已產出Drive重複檔盤點與人工核准自述，只依此限縮流程計數，不認定刪除完成。
- 093：保留的是第三方訪談摘要；原訪談的直接實作敘述尚待確認。

## 重複群與必要限縮

061、084、091、092的一般多代理協作架構合計只算一次，保留061。084現已限縮為作者明確實際運行的房源照片條件篩選→Notion工單，另計一次。091雖有每日讀YNAB自述，但具體現金警示在公開頁標為示例，尚不計另一工作流程。

已納入的023只支持「既有簡報素材替換與交付」，025只支持「報名資料核對與活動通知修訂」，031只支持「交易、郵件與行事曆對照的用餐日誌」；不可沿用較大的官方假設情境。013支持診斷報告的證據檢查，未證明登入修復。068支持設定寫入／讀回檢查，未證明長期離線問題已解決。035保留申請準備的實作／失敗證據，不保證原始產品歸屬或面試成效。

其他相近案例依終點區分：001／040為首次選項比較與條件變更後重查；006／042／077為數據引導發布、內容互評與格式化草稿交付；008／049為多行事曆晨報與郵件分流。若內容被簡化成同一泛用流程，必須合併，不能只靠平台不同保留。

P-001–003不在合格數內。P-004已補讀原作者回報的實際RFP短名單，提升為UC-101，另將法規到安全表單草稿記為UC-102；已從待查計數移除，不重複計入。[原作者補充](https://www.reddit.com/r/GrokBot/comments/1x1d7n9/comment/peuhvej/)

## 查閱範圍

本次逐頁稽核基準及後續新增編號的已保存正文、證據與來源，並針對待判定項目回查原始來源；並非本次重新打開全部外部連結。原文受登入、限流、失效或影片不可讀限制時，沿用案例頁記錄的查閱範圍，不把連結存在當作已核實。下列英文判定句保留具體證據邊界；中文結論與案例正文可對照閱讀。

## 逐案判定與來源

下列逐案理由維持可核對的具體範圍；案例頁列有完整來源與限制。來源連結支持實作敘述，不保證成效。基準94案與後續新增案例分列。


### 原 UC-001–094

- [UC-001](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/001-travel-checkout.md)｜納入｜A。Author ran a three-agent travel comparison; incomplete checkout and later failed booking are disclosed. Count research/options, not completed bookings. [來源](https://www.aiformortals.co/blog/grok-bot-vs-meta-muse-vs-chatgpt-dots)

- [UC-002](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/002-video-production.md)｜納入｜A。Author comparison plus publicly described video project; count research/creative production, not asserted full rendering success. [來源](https://www.aiformortals.co/blog/grok-bot-vs-meta-muse-vs-chatgpt-dots)

- [UC-003](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/003-store-operations.md)｜納入｜A。An actual four-hour fictitious-store test was run. Label sandbox demonstration, not live commercial operations. [來源](https://www.aiformortals.co/blog/grok-bot-vs-meta-muse-vs-chatgpt-dots)

- [UC-004](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/004-social-crm.md)｜納入｜A。Named author reports building a public-profile Notion CRM; masked handoff log supports a separate input variant. [來源](https://x.ai/bot/guides/grok-bot-101)

- [UC-005](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/005-cloud-pr-review.md)｜納入｜A。Documented author test produced PR work and reviewer findings; database writes and continuous watch were not verified. [來源](https://zenn.dev/tec/articles/c4fbfcfffde4ad)

- [UC-006](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/006-facebook-publication.md)｜納入｜A。Author reports checking actual Page/Group posts after analytics, copy and imagery; errors and supervised operation disclosed. [來源](https://www.aiagentslibrary.com/blog/meta-muse-facebook-test/)

- [UC-007](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/007-saas-renewal-audit.md)｜納入｜V。Vendor reports its own supplier, seat and contract audit; savings remain unverified vendor claims. [來源](https://x.ai/news/grok-bot-procurement)

- [UC-008](https://github.com/RichardHan/ai-agent-use-cases/blob/main/evidence/008-morning-brief-validation.md)｜排除：驗證補充｜A。保留作者實際測試16個日曆的覆蓋與交付限制；本項仍屬驗證補充，不納入500個獨立實作工作流程。[來源](https://dev.to/uehara/i-connected-chatgpt-dots-to-gmail-calendar-slack-and-notion-to-see-what-it-can-and-cant-do-13md)

- [UC-009](https://github.com/RichardHan/ai-agent-use-cases/blob/main/evidence/009-background-transfer-template.md)｜排除：缺實作證據｜T。Only a public template and safety documentation; no actual transfer report. [來源](https://x.ai/bot/marketplace/bots/import-bot)

- [UC-010](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/010-physical-oled-verification.md)｜納入｜A。Public project verification log describes gateway commands reaching an OLED, with physical checks and failures. [來源](https://github.com/adidshaft/grok-gadgets-esp32-sdk/blob/v0.2.0-alpha.9/docs/verification/oled-kit-wifi-2026-10-12.md)

- [UC-011](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/011-sales-feedback-approved-revision.md)｜納入｜A。Actual sample-data test and a separate provider test account demo; count analysis/revision, not improved revenue. [來源](https://note.com/samuraijuku_biz/n/n77f1dc663112)

- [UC-012](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/012-research-evaluation-provenance.md)｜納入｜B。Research authors retrospectively describe data/scaler review, critique and manuscript integration; incomplete logs and no independent science review. [來源](https://arxiv.org/abs/2610.05424v1)

- [UC-013](https://github.com/RichardHan/ai-agent-use-cases/blob/main/evidence/013-authentication-diagnosis.md)｜排除：驗證補充｜B。保留作者對登入診斷主張的更正紀錄；本項仍是驗證補充，未確立獨立終端工作流程，不納入500計數。[來源](https://note.com/matsudakz/n/n7e2dad959cde)

- [UC-014](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/014-support-inbox-approval-refund.md)｜納入｜A。First-person support-playbook workflow plus a public screenshot of support triage. Unwatched painting-business video contributes no extra count. [來源](https://www.chatprd.ai/how-i-ai/grok-bot-agent-templates-and-workflows)

- [UC-015](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/015-public-page-change-watch.md)｜納入｜A。Author ran bounded timed page checks with reported baseline/results; exact scheduler causality and cleanup remain unproved. [來源](https://future-stack-reviews.com/chatgpt-dots-starter-tierb/)

- [UC-016](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/016-marketplace-selling-buyer-messages.md)｜納入｜B。Independent first-person selling reports support actual use; address-disclosure incident is secondary and does not alone prove details. [來源](https://www.techrepublic.com/article/news-meta-ai-facebook-marketplace-buyer-seller-address/)

- [UC-017](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/017-prospect-research-drafts.md)｜納入｜V。Named vendor GTM author describes actual prospect research and personalized drafting; no sales-outcome claim. [來源](https://x.ai/bot/guides/grok-bot-for-gtm)

- [UC-018](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/018-demo-readiness.md)｜納入｜V。Primary launch source rechecked: section explicitly says these are ways the team has been using Bots, including demo-environment readiness. Vendor self-report, not hypothetical-only. [來源](https://x.ai/news/introducing-grok-bot)

- [UC-019](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/019-call-to-customer-deck.md)｜納入｜V。Named vendor author reports using Granola notes and Figma master deck for customer-specific slides. [來源](https://x.ai/bot/guides/grok-bot-for-gtm)

- [UC-020](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/020-figma-batch-cards.md)｜納入｜V。Named vendor designer reports creating 20 onboarding cards from an auto-layout component. [來源](https://x.ai/bot/guides/designing-grok-bot-with-grok-bot)

- [UC-021](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/021-legal-request-handoff.md)｜納入｜V。Named legal-operations author reports Slack request intake, tracking and approved-document handoff. [來源](https://x.ai/bot/guides/grok-bot-for-legal-ops)

- [UC-022](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/022-ad-spend-conversion-check.md)｜納入｜V。Named marketing employee describes actual recurring cross-channel spend/conversion checks. [來源](https://x.ai/bot/guides/grok-bot-for-performance-marketing)

- [UC-023](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/023-launch-material-revision.md)｜納入｜B。Actual-use evidence is the appended Muse slide-video replacement and Notion/mail-draft handoff, not the hypothetical dots launch-change scenario. Retitle/narrow. [來源](https://note.com/hackitinc/n/n4253054082f9)

- [UC-024](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/024-missing-invoice-check.md)｜納入｜B。Trucking-company owner reports missing POD/invoice preparation and later errors; official anonymous tester anecdote is weaker corroboration. [來源](https://www.reddit.com/r/GrokBot/comments/1vya1zs/i_own_a_trucking_company_i_trained_grokbot_for_8/)

- [UC-025](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/025-team-event-follow-through.md)｜納入｜A。Appended authors actually tested fictitious attendance cleanup and bounded notice changes. Count these, not unproved autonomous offsite follow-through. Retitle/narrow. [來源](https://note.com/avengerszzz/n/neb9487833f55)

- [UC-026](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/026-school-deadline-list.md)｜納入｜B。University student reports Moodle deadline extraction/calendar insertion; vendor school-administration story is additional self-report. [來源](https://note.com/shunkodaira/n/nd22b7aaa5f4f)

- [UC-027](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/027-recipe-shopping-plan.md)｜納入｜B。Grok author actually generated menus and attempted groceries; checkout failed and human ordered. Count meal planning/handoff, not autonomous purchasing. [來源](https://x.com/gyutei_4koma/status/2110252710402638192)

- [UC-028](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/028-bill-comparison-preparation.md)｜排除：缺實作證據｜H。Only official capability/use-case claim and editor-designed sample; no actual-use report. [來源](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)

- [UC-029](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/029-exercise-time-replan.md)｜排除：缺實作證據｜H。Only official use-case claim and editor-designed scenario; no actual-use report. [來源](https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/)

- [UC-030](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/030-interactive-study-guide.md)｜納入｜A。Author reports Kindle vocabulary app with screenshots; public StudyStudio files and other self-reports are variants. No learning-outcome validation. [來源](https://x.com/_simonsmith/status/2110425007059017830)

- [UC-031](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/031-spending-dashboard.md)｜納入｜B。Appended commenter reports a restaurant-history dashboard joining transactions, email and calendar. Count dining journal, not general accounting accuracy. Retitle/narrow. [來源](https://www.reddit.com/r/MuseAgent/comments/1x3vk3k/whats_your_actual_daily_workflow_with_ai_agents/)

- [UC-032](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/032-sleep-record-chart.md)｜排除：缺實作證據｜H。Official artifact example and invented data procedure only. [來源](https://introducing.muse.ai/)

- [UC-033](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/033-business-experiment-plan.md)｜排除：缺實作證據｜H。Official suggested use and editor-designed procedure only. [來源](https://about.fb.com/news/2026/09/introducing-muse-small-business/)

- [UC-034](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/034-expense-anomaly-review.md)｜納入｜B。新增Daria Littlefield具體收據月報與巴士票疑似重複扣款自述；原帳單、銀行確認與退款未核。Muse建議不轉為Muse實測。[來源](https://www.donotchurn.com/p/running-my-admin-on-grok-bot)

- [UC-035](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/035-job-search-application-drafts.md)｜納入｜A。Actual use and failure reports exist, including Grok application screenshots; original dots/Work attribution is unresolved. Count preparation with disclosed unsafe-failure examples, not interviews gained. [來源](https://x.com/aaditya_roy_04/status/2110365316043923658)

- [UC-036](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/036-pos-accounting-csv.md)｜納入｜B。POS owner reports daily formatting/calculated-column CSV work; upload and bookkeeping correctness are not established. [來源](https://www.reddit.com/r/GrokBot/comments/1wiuwmw/comment/pahf8gt/)

- [UC-037](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/037-product-listing-comparison.md)｜納入｜A。Media author actually tested seven shopping prompts; support only reported usable comparisons and disclosed failures. [來源](https://www.tomsguide.com/ai/i-tried-turning-metas-muse-ai-into-my-personal-shopper-only-3-of-7-prompts-actually-worked)

- [UC-038](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/038-fabric-sourcing-sample-handoff.md)｜納入｜B。Business owner reports supplier outreach, comparison and design-file handoff; receipt/quality of samples not yet established. [來源](https://news.ycombinator.com/item?id=49263241)

- [UC-039](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/039-competitor-positioning-review.md)｜排除：缺實作證據｜T。Template existence plus attendee observation notes; no identified first-person execution outcome. [來源](https://x.ai/bot/marketplace/bots/stalk-bot)

- [UC-040](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/040-trip-deferred-recheck.md)｜納入｜A。Author actually demonstrated itinerary replan plus a completed one-time weather/transport recheck. Distinct from initial booking-option comparison; simulated trip disclosed. [來源](https://x.com/jibeiguang/status/2110168121852248425)

- [UC-041](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/041-routine-health-exception-ops.md)｜納入｜B。Author describes daily checks of other jobs' real outputs and exception reports; no measured reliability. [來源](https://x.com/SameerRijh/status/2110113800506499329)

- [UC-042](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/042-dots-credential-multibot-return.md)｜納入｜B。Author reports using writer, critics, monitor and publisher for real X content, including the source article. Count critique coordination, not generic publication again. [來源](https://x.com/chebyte/status/2110008800593768844)

- [UC-043](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/043-public-events-calendar.md)｜納入｜B。Author reports an initial local-event import to a separate calendar; continued monthly synchronization unproved. [來源](https://semicolonexpected.substack.com/p/i-tried-meta-muse-ai-specific-things?open=false)

- [UC-044](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/044-household-shared-dashboard.md)｜納入｜A。Media author reports iteratively building a family Today-view tool; access control/synchronization not independently verified. [來源](https://www.tomsguide.com/ai/i-used-meta-muse-as-an-ai-house-manager-for-my-family-of-five-heres-what-happened)

- [UC-045](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/045-cross-agent-research-handoff.md)｜納入｜A。Public case log records a manually triggered Codex-to-Grok research task and returned evidence. Routine automation not demonstrated. [來源](https://v2ex.com/t/1241782)

- [UC-046](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/046-followed-accounts-daily-digest.md)｜納入｜A。Author reports daily use with an output screenshot; completeness, de-duplication accuracy and cost unknown. [來源](https://x.com/HiTw93/status/2110154365667336695)

- [UC-047](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/047-portfolio-provenance-catalog.md)｜納入｜A。Author reports publication and the linked public interface was read; full asset correctness and provenance not independently checked. [來源](https://comman.co.jp/column/openai-dots-hands-on-review)

- [UC-048](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/048-daily-price-rank-tracking.md)｜納入｜B。Several first-person tracking/refund/purchase reports support real use; merchant outcomes and query scale unverified. [來源](https://x.com/automation_ngch/status/2108095190787649563)

- [UC-049](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/049-daily-inbox-report-graduated-trust.md)｜納入｜B。First-person daily inbox reports support the basic workflow; gradual-trust narrative is secondary. Do not count that narrative as independently validated. [來源](https://x.com/MarsDesigns/status/2108584634913312769)

- [UC-050](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/050-daily-eink-mood-illustration.md)｜納入｜B。Author reports a working Muse-to-Pi-to-BOOX chain and daily illustration use; duration/reliability unverified. [來源](https://x.com/wzblog/status/2106447916365996082)

- [UC-051](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/051-tax-return-cpa-double-check.md)｜納入｜B。Authors describe actual review/preparation; underlying tax correctness, amounts and savings are unverified. [來源](https://x.com/jasonfreedman/status/2110091703419871393)

- [UC-052](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/052-cloud-overcharge-refund-root-cause.md)｜納入｜B。Author reports refund requests plus code-fix PRs after billing anomalies; no refund/PR records obtained. [來源](https://x.com/worawisut/status/2110221957577019424)

- [UC-053](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/053-ecommerce-replenishment-refund-profit.md)｜納入｜B。Seller reports an output table and a changed replenishment decision; calculations and business outcome unverified. [來源](https://x.com/TonyGainzzz/status/2110288321788129343)

- [UC-054](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/054-music-video-multi-tool-pipeline.md)｜納入｜B。Creators report actual MV production with tools; templates alone do not qualify and video/process was not audited. [來源](https://x.com/Frank_AI_Lab/status/2110285369186844888)

- [UC-055](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/055-tweet-project-intake-research-monitor.md)｜納入｜A。Author description and three read screenshots support intake, dedupe, research and handoffs; report quality/long-term monitoring unverified. [來源](https://x.com/Nazarick_eth/status/2110305892185104665)

- [UC-056](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/056-agent-built-microbusiness-site.md)｜納入｜A。Author reports building and operating a site and public pages exist; revenue, traffic and degree of autonomy remain self-report. [來源](https://x.com/AlexFinn/status/2109817698620485804)

- [UC-057](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/057-self-hosted-ci-runner-on-laptop.md)｜納入｜A。Screenshot shows registered runner listening; workflow PR/test success and claimed automatic shutdown are not proved. [來源](https://x.com/galdalal/status/2110282209810915663)

- [UC-058](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/058-tennis-match-dead-time-editing.md)｜納入｜B。Author reports actual tennis-video trimming while still improving it; final quality not audited. [來源](https://www.reddit.com/r/MuseAgent/comments/1wv28e9/26_use_cases_for_muse_that_ive_implemented_so_far/)

- [UC-059](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/059-home-service-quote-handoff.md)｜納入｜A。Media author reports quote submission and personally confirmed appointment; completed cleanup not established. [來源](https://www.theverge.com/ai-artificial-intelligence/999526/meta-muse-ai-agent-hands-on-shopping)

- [UC-060](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/060-x-mention-sourced-answer-bot.md)｜納入｜A。Public answering account/replies and source repository were read; full answer faithfulness and recurring updates unverified. [來源](https://x.com/idontknowmaxime/status/2110495092825784541)

- [UC-061](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/061-dispatcher-bot-typed-commands-ledger.md)｜納入｜A。Actual screenshots and author report support coordinator-to-specialist dispatch with task IDs and evidence-ledger return. [來源](https://x.com/miyatti/status/2110549612889292892)

- [UC-062](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/062-figma-android-implementation-audit.md)｜納入｜B。Named commenter reports Figma-to-Android comparison, JSON mapping and report; underlying artifacts not obtained. [來源](https://es.linkedin.com/posts/raulmarincalleja_hola-hace-un-par-de-semanas-grabe-video-activity-7498655174329118722-DKG6)

- [UC-063](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/063-plex-media-library-housekeeping.md)｜納入｜B。Author reports real Plex naming, poster, grouping and backup work; restoration and before/after data unknown. [來源](https://www.reddit.com/r/GrokBot/comments/1x1d7n9/comment/peucnft/)

- [UC-064](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/064-math-proof-review-formalization.md)｜納入｜A。Public proof code, CI and registration corroborate author report; no independent rebuild or mathematical peer review here. [來源](https://unexcitedneurons.substack.com/p/i-used-openai-dots-as-an-agent-swarm)

- [UC-065](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/065-suspicious-email-security-review.md)｜納入｜A。Author describes actual email review and remediation report with screenshots; later patrol instructions/outcomes not verified. [來源](https://x.com/wmorrill3/status/2110505932174045466)

- [UC-066](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/066-agent-token-usage-self-audit.md)｜納入｜A。Public detailed audit report corroborates actual-use claim; counters themselves have disclosed anomalies. [來源](https://x.com/ZynStop/status/2110606030979920231)

- [UC-067](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/067-agent-app-rebuild-manual.md)｜納入｜B。Authors report maintaining reconstruction notes and backup organization; no successful restore verified. [來源](https://www.reddit.com/r/MuseAgent/comments/1x4wgh5/tip_make_your_muse_keep_a_rebuild_manual_for/)

- [UC-068](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/068-mac-local-helper-away-diagnosis.md)｜納入｜A。Screenshot supports a bounded App Nap setting write/readback. Count diagnosis/configuration check, not cured unattended connectivity. [來源](https://x.com/lanvjian/status/2110651548367982931)

- [UC-069](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/069-task-migration-reconciliation.md)｜納入｜B。Detailed author migration report includes missing-card detection, repairs and unresolved statistics; not a perfect-migration claim. [來源](https://davidgomes.com/migrating-10-years-of-family-life-from-trello-to-todoist-with-grok-bot/)

- [UC-070](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/070-github-outage-mac-cloudflare-publish.md)｜納入｜B。Author describes actual fallback build/deploy with human approval and public readback; private logs not obtained. [來源](https://x.com/cradrrat/status/2110701803381919815)

- [UC-071](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/071-obsidian-dots-visible-memory.md)｜待確認｜U。Body is a teaching/setup thread with illustrative applications; no unambiguous completed author-use output retained. Primary X page unavailable in this audit. [來源](https://x.com/MakeAI_CEO/status/2110681479449841874)

- [UC-072](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/072-phone-task-disclosure-handoff.md)｜納入｜B。Authors describe actual test calls and live-agent handoff. Recording/result not independently heard. [來源](https://www.growthacademy.global/blog/grokbot-dialbot-ai-phone-calls-setup)

- [UC-073](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/073-customer-journey-content-audit.md)｜納入｜B。Authors report website audits and human corrections/readback; full report/coverage not obtained. [來源](https://digitiz.fr/chatgpt-dots/)

- [UC-074](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/074-event-trigger-readback.md)｜納入｜B。Builder describes actual webhook/MCP wake-up integration and workaround to reread measurement history; no long-term reliability. [來源](https://zenn.dev/hodagi/articles/a7db00426b6756)

- [UC-075](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/075-health-appointment-briefing-coach.md)｜納入｜B。Author describes using summaries before care and notes after; specific product contribution and medical outcome unverified. [來源](https://x.com/gambrill/status/2110874195592610083)

- [UC-076](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/076-spam-call-data-broker-optout.md)｜納入｜B。Creator and users report actual opt-out/registry attempts; verified removal rate and recurring checks unknown. [來源](https://x.ai/bot/fUj6TYhiW_cjtzWvbsFgz)

- [UC-077](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/077-cloud-draft-local-script-wechat-publish.md)｜納入｜B。Author reports cloud-produced article/images sent via existing local script to draft box and knowledge base. Count draft packaging/handoff, not autonomous posting. [來源](https://x.com/sitinme/status/2110901539321856242)

- [UC-078](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/078-rental-listing-scam-check.md)｜納入｜B。Author reports public-record investigation before personally confirming/reporting scam; underlying report unverified. [來源](https://x.com/pablothethinker/status/2110918566631387428)

- [UC-079](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/079-business-email-alias-diagnosis.md)｜納入｜B。Author reports test mail, bounce analysis, alias repair and delivery check; no technical logs obtained. [來源](https://x.com/JavyDiaz/status/2110974852282622439)

- [UC-080](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/080-email-license-keys-to-password-vault.md)｜納入｜B。Author reports actual three-inbox license collection and vault writes; counts/completeness/security unverified. [來源](https://x.com/atomtanstudio/status/2110990650439016905)

- [UC-081](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/081-todoist-scheduled-headstart.md)｜納入｜A。Screenshot plus author report support Todoist review/labeling; actual draft content and rescan semantics unknown. [來源](https://x.com/evnsio/status/2111069372127326668)

- [UC-082](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/082-multi-bot-fitness-coach-group.md)｜納入｜A。Author group/skill screenshots support actual use; health outcomes, estimation accuracy and endpoint security unverified. [來源](https://x.com/CJiat/status/2111068666980917490)

- [UC-083](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/083-printable-grade1-math-worksheet.md)｜納入｜A。Visible conversation/file and worksheet screenshot support PDF creation; answers and curriculum match not independently checked. [來源](https://x.com/zohanlin/status/2111075388877394082)

- [UC-084](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/084-botops-tiered-fleet-notion-tickets.md)｜納入｜B。原作者明確描述實際運行Home hunt，檢查房源照片中的廚房／浴室要求，交回值得看的Notion工單。已限縮計數；照片準確率、完整短名單與購屋結果未核。[來源](https://granda.org/en/2026/09/06/how-i-run-grok-bot/)

- [UC-085](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/085-slack-bug-triage-product-preread.md)｜納入｜B。Author reports both internal bug triage and biweekly marketing pre-read; conservatively count this existing combined record once, not twice. [來源](https://jamespember.substack.com/p/grok-bot-is-really-good)

- [UC-086](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/086-muse-concert-video-scraping-pipeline.md)｜納入｜B。Builder reports actual pipeline use for a named site; third-party HN comments add no separate evidence/count. [來源](https://sigh.dev/posts/metas-muse-is-fantastic-for-web-scraping/)

- [UC-087](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/087-voice-walk-intake-codex-morning-call.md)｜納入｜B。Author reports voice-to-Codex task creation and recurring progress calls, with failures; refund aside is not another count. [來源](https://metedata.substack.com/p/chatgpt-dot-review-your-chief-of)

- [UC-088](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/088-unrefunded-returns-inbox-chase.md)｜納入｜B。Author reports finding and contacting merchants about outstanding return refunds; amount and authorization history unverified. [來源](https://x.com/darian314/status/2089381004524093752)

- [UC-089](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/089-digital-declutter-approval-plan.md)｜納入｜B。Louis LAURENT明述Drive重複檔盤點、保留建議與核准5項；沒有刪除紀錄或雜湊，不證明完整清理成功。新原作者實作證據支持限縮後的單一流程。[來源](https://www.kryve.fr/blog/grok-bot-guide)

- [UC-090](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/090-daily-prediction-market-evidence-read.md)｜納入｜B。Author reports daily research/filtering using an MCP source; no trades or prediction-performance claim. [來源](https://x.com/sidshekhar24/status/2089735218861326727)

- [UC-091](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/091-household-13-lane-bots.md)｜待確認獨立實際產物｜U。13 Bot架構與061重複。每日讀YNAB為作者自述，但具體發薪前帳單警示出自明標去識別示例，不能視為已發生事件；更正先前改寫即可計入的判定。[原始示例聲明](https://github.com/ylgibby/grokbot-household-swarm/blob/main/index.html#L374)

- [UC-092](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/092-desk-can-cannot-receipts.md)｜排除：重複｜B。Same core coordinator/specialist scope and evidence-receipt workflow as UC-061; different task ledger/vendor does not create another workflow. [來源](https://dennisyu.com/how-i-use-grok-bot/)

- [UC-093](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/093-local-newsletter-agent-team.md)｜待確認｜U。Only a third-party interview summary was retained. Primary video could not be read; verify primary account/description before counting. [來源](https://www.thefuturist.co/making-with-grok-bot/)

- [UC-094](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/094-meeting-stand-in-disclosure.md)｜納入｜B。Author explicitly reports a completed stand-in meeting and notes. Video/platform/consent details unverified, but text qualifies as self-report. [來源](https://x.com/kiaraplds/status/2088321112073547835)


### 新增 UC-095–099

- [UC-095](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/095-product-usage-error-correlation.md)｜納入｜B。Primary author says these are the bots used after more than a week; Product combines personal analytics, telemetry and code context. Count feature-usage/error investigation, not proven causal diagnosis or product improvement. [來源](https://codecapital.substack.com/p/meus-principais-casos-de-uso-para-o-grok-bot)

- [UC-096](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/096-production-log-deploy-triage.md)｜納入｜B。Primary author explicitly requests production server log analysis and deployment monitoring across three VPS. No incident report, repaired deployment or time-to-recovery result is published. [來源](https://codecapital.substack.com/p/meus-principais-casos-de-uso-para-o-grok-bot)

- [UC-097](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/097-public-gis-layer-map.md)｜納入｜B。Primary commenter reports building a GIS site subtool that periodically overlays public-source data on satellite imagery. Site, source list and coordinate validation unavailable. [來源](https://www.reddit.com/r/GrokBot/comments/1wa57uk/comment/p8gwy2e/)

- [UC-098](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/098-engineering-pdf-excel-extraction.md)｜納入｜B。Primary commenter describes replacing manual transcription across PDFs with tab-delimited extraction into formatted Excel sheets. Source documents and extraction accuracy unavailable. [來源](https://www.reddit.com/r/GrokBot/comments/1wa57uk/comment/p8gwy2e/)

- [UC-099](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/099-travel-photo-scrapbook.md)｜納入｜B。Primary commenter reports a completed themed day/location roadtrip scrapbook from daily photo-folder inputs. Scrapbook itself is not public. [來源](https://www.reddit.com/r/GrokBot/comments/1wa57uk/comment/p8gwy2e/)


### 新增 UC-101–103

- [UC-101](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/101-procurement-capability-shortlist.md)｜納入｜B。作者在追問中稱每週收到1–2個值得評估的RFP，另找到3個補助機會；計入能力證據比對與機會篩選，不宣稱已完成投標或獲補助。原P-004已移出待查計數。[來源](https://www.reddit.com/r/GrokBot/comments/1x1d7n9/comment/peuhvej/)

- [UC-102](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/102-regulatory-change-safety-form-draft.md)｜納入｜B。同作者稱法規變更監測產生安全表單修訂提案。此流程輸出為內部文件修訂稿，與101機會短名單不同；未核法規適用性、條文或實際採用。[來源](https://www.reddit.com/r/GrokBot/comments/1x1d7n9/comment/peuhvej/)

- [UC-103](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/103-insurance-crm-plan-code-reconciliation.md)｜納入｜B。另一作者明確自述以保險公司名冊對照CRM並修正方案輸入錯誤；修正筆數、正確性與合規性未核。未來佣金核帳不計入，公開示例僅用合成資料。[來源](https://www.reddit.com/r/InsuranceAgent/comments/1vu1fm6/sharing_my_experience_about_grok_bot_for_the/)


### 新增 UC-104–106

- [UC-104](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/104-genealogy-animation-print.md)｜納入｜B。作者明確自述已完成家譜動畫及印刷版本；結構化親屬／日期資料視覺化與照片紀念冊不同，原始檔與渲染未核。 [來源](https://vibegenealogy.ai/p/animating-charts-advent-of-agents-death-of-chatbots)

- [UC-105](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/105-gift-card-balance-inventory.md)｜納入｜B。作者自述已整理禮物卡餘額表並列無法查詢的舊卡；表格正確性未核，電話代查未發生，公開指令只用合成資料。 [來源](https://www.reddit.com/r/MetaAI/comments/1wrwwx2/top_three_use_cases_for_muse/pcjyodi/)

- [UC-106](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/106-animated-line-sticker-submission-package.md)｜納入｜B。作者免登入預覽明確自述已取得8款動態貼圖、ZIP及日英文案；會員後續未讀，不宣稱申請通過或上架。APNG與平台格式驗收構成獨立流程。 [來源](https://library.libecity.com/articles/01M4CXQXC95VAME8M9RQWW9PAR)


### 新增 UC-107–108

- [UC-107](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/107-old-blog-private-audio-archive.md)｜納入｜V。原訪談主持人記錄產品員工找回舊文章、整併PDF並每日收取朗讀；完整文集與音訊未核，不保證復原完整。 只讀原主持人文章與同站流程頁，未觀看完整影片；與產品有職務關係。[來源](https://www.chatprd.ai/how-i-ai/alex-cornell-meta-muse-workflows)

- [UC-108](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/108-golf-round-practice-data-review.md)｜納入｜V。原訪談主持人描述產品員工展示逐桿／練習數據圖表與賽後回顧；原始數據、因果與改善成績未驗。 只讀原主持人文章與同站流程頁，未觀看完整影片；與產品有職務關係。[來源](https://www.chatprd.ai/how-i-ai/alex-cornell-meta-muse-workflows)

### 新增 UC-109

- [UC-109](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/109-supermarket-coupon-activation.md)｜納入｜B。HN原作者回報Muse完成超市券啟用，但比手動反覆點擊慢；官方HN API核作者、時間及完整留言。商店、券數、實際節省與登入安全機制未核。不同於比價／價格監測／禮物卡盤點。[來源](https://news.ycombinator.com/item?id=49626889)

### 新增 UC-110–111

- [UC-110](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/110-roblox-playtest-prototype.md)｜納入｜B。作者實際在Roblox Studio開啟dots所產遊戲，依可玩性與節奏回饋迭代。未看影片或執行檔，十階段版仍是規劃；不把程式可跑當遊戲品質認證。[來源](https://note.com/xshibuxshibux/n/nba39d428c8a8)

- [UC-111](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/111-engineering-drawing-source-traceability.md)｜納入｜B。Creer自述產出工程資料／PDF／DXF對應的JSON、腳本及測試檔；不同於098抽字填表。測試與原始檔未公開，不能視為設計安全或照合正確。兩個開發專案不另拆計數。[來源](https://cre-er.co.jp/technical-notes/dots-two-local-development-projects/)

### 新增 UC-112–115

- [UC-112](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/112-image-to-printable-articulated-model.md)｜納入｜B。作者自述從角色圖取得可動分件並實印；模型平台此次不可讀，幾何、安全與實物品質未核。CNC僅提及，不另計。[來源](https://naffis.com/resources/2026/08/24/grok-bot/)

- [UC-113](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/113-architecture-material-visual-comparison.md)｜納入｜B。作者實際用公開建築模型做可旋轉展示與外牆／內裝比較，記錄格式、單位及記憶體問題；Sunburst生圖另有生成物件失真，非施工或尺寸驗證。[來源](https://note.com/tokothecat/n/n6f62f2c62b10)

- [UC-114](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/114-existing-worksheet-print-layout.md)｜納入｜B。原留言稱已重排既有教材減少用紙；無前後頁數或檔案，不宣稱節省比例／內容完整，與083新題目生成不同。[來源](https://www.reddit.com/r/GrokBot/comments/1x2323i/grok_bot_in_personal_life/pezb9vl/)

- [UC-115](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/115-rigged-character-asset-export.md)｜納入｜B。作者明述實際產出骨架動畫GLB並公開程式碼；App截圖為示意，模型與程式未執行，跨引擎相容未驗。不同於110完整遊戲試玩；短片展示不另計。[來源](https://www.shanebrumback.com/tutorials/rigged-capybara-threejs.html)

### 2026-10-17新增證據與UC-116

扣除008及013後的100基準，再增加089新原作者實作證據及116獨立報價流程，得到102。並非恢復兩項補充的計數。

- [UC-116](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/116-slack-branded-quote-draft.md)｜納入｜B。Santiago Muñoz列為已運行流程，稱Slack需求到品牌報價文件已執行、調整並存skill。無完整報價或價格核對／客戶寄送紀錄，不宣稱成交或金額正確；與017潛客研究、019簡報及059買方詢價不同。[來源](https://www.horizontesia.com/blog/grok-bot)

### 新增UC-117–118

- [UC-117](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/117-warranty-replacement-tracking.md)｜納入｜B。App Store作者rmastrapa自述由產品故障客服詢問到換貨及配送追蹤，評論與日期已讀；品牌往來、訂單及保固資格未獨立核。與088退貨未退款不同；不採標題省錢額為換貨成效。[來源](https://apps.apple.com/us/app/grok-bot/id6794501026?platform=iphone&see-all=reviews)
- [UC-118](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/118-agent-email-rerouting-consent-test.md)｜納入｜A。Dave Kiss虛構車行實測可見說明、主人核准後分流至新收件者；四版本差異有原作者報告，未獨立重現，也不是正式商家成效。兩工具合併一次，與014分類及049巡檢不同。[來源](https://davekiss.com/blog/i-opened-a-fake-auto-shop-for-ai-agents/)

### 新增UC-119–120

- [UC-119](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/119-fantasy-lineup-approval-review.md)｜納入｜B。Chris Snider自述Muse先發建議、本人同意修改與賽後得分回顧；名單／計分未核，不保證勝率、不含下注。四平台合併一次。[來源](https://newsletter.innovationprofs.com/p/meta-muse-is-the-ai-assistant-you-have-been-waiting-for)
- [UC-120](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/120-bioinspired-material-simulation-specimen.md)｜納入｜B。Markus J. Buehler原帖明述照片到梁網模擬、報告、STL與兩件樣品完成；未核原始程式與實體力學性能。不同於012資料稽核及112造型列印，多代理／匯出格式不拆計。[來源](https://www.linkedin.com/posts/markus-j-buehler-2245682_grok-bot-is-incredible-the-bots-move-naturally-activity-7496875174911291392-LO9a)

### 新增UC-121–122

- [UC-121](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/121-visual-reference-classification-sheet.md)｜納入｜B。Daichi Sato原頁自述30張跨領域參考圖按視覺特徵整理成來源／縮圖表；原文與日期已讀，產物及權利未逐項核。不同於020設計批製、113材質呈現。[來源](https://note.com/forevergift/n/n1974d776f441)
- [UC-122](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/122-audio-lightshow-sequence-draft.md)｜納入｜B。quad_americano原帖及回覆自述產出9序列，明示特定layout/groups限制；影片未看、序列未取得，原發布日期未核。核心實作正文可讀，9序列只計一流程，不宣稱燈具實播或跨配置可用。[來源](https://www.reddit.com/r/xlights/comments/1wqf0uo/grok_bot_is_king_ai_sequencing/)

### 新增UC-123–124

- [UC-123](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/123-mobile-game-resource-handoff.md)｜納入｜B。やすくん原文自述dots已操作投映遊戲畫面收集素材，並揭露中止；無遊戲名稱、條款或紀錄，不保證允許自動化。不同於110開發與119名單，沒有執行本機操作。[來源](https://note.com/yasukun_912/n/n0e9d93fa0d0a)
- [UC-124](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/124-vehicle-maintenance-record-review.md)｜納入｜B。Urban-Garlic完整留言自述手冊／維修／Road Trip資料已產生每週待保養提示；原車型、工單及省錢判斷未核，不採為取消保養依據。多類車具合併一次，與其101/102不同終點。[來源](https://www.reddit.com/r/GrokBot/comments/1x1d7n9/comment/pgubvln/)

### 新增UC-125–126

- [UC-125](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/125-morse-decoder-hardware-loop-test.md)｜納入｜A。Lutz S.原論壇實跑敘述WAV、平板、ESP32串列回讀及加雜訊修正；附件清單可見但README403未讀，未獨立重跑或核準確率。與010顯示、122編舞不同。[來源](https://www.mikrocontroller.net/topic/587580)
- [UC-126](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/126-roofing-prework-admin-handoff.md)｜納入｜B。Price Foulger自述屋頂許可、檢查預約與保險通報已辦；無城市、提交收據或最終政府核准，不推定CAPTCHA自主完成。九項清單不拆九案，官方人工驗證邊界另核。[來源](https://www.linkedin.com/posts/pricefoulger_i-am-a-roofing-contractor-and-this-activity-7496638096868904960-iC-P)

### 新增UC-127–128

- [UC-127](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/127-cross-channel-calendar-correction.md)｜納入｜A。다시개발原章記錄語音事件錯放日曆及多加Meet、核准後重建並親自讀回，Slack另一事件同樣核對。虛構工作坊真實帳號實驗，不能保證一般錯誤自行修正；兩通道合併。[來源](https://wikidocs.net/448649)
- [UC-128](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/128-test-database-revenue-query-review.md)｜納入｜B。ple／Christian測試SQL月別稅類營收已有回答，但作者明說查詢待檢；未核數字、SQL或真正只讀權限。不同於036資料匯入與053利潤分析，不採同串其他工具功能為Grok Bot成果。[來源](https://forum.jtl-software.de/threads/welche-ki-loesungen-nutzt-ihr-mit-jtl-feedback-zu-meinem-mcp-projekt-kiuser-com-gesucht.249562/)

### 新增UC-129

- [UC-129](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/129-store-stockout-velocity-audit.md)｜納入｜A。Timothy Ouellette原文記錄69檔合併、缺貨報表及236筆時間分母錯誤；原始資料未核，後續CRM／品飲成效仍構想。與053淨利補貨不同，排程不另計。[來源](https://www.linkedin.com/pulse/grok-bot-walkthrough-beverage-alcohol-sales-timothy-ouellette-ysetc)

### 新增UC-130

- [UC-130](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/130-supplies-reorder-ledger-reconciliation.md)｜納入｜A。青島受控備品情境中完成實購與訂單／台帳核對，含免運誤判及回寫約40分鐘延遲；角色沒有Notion權限隔離，照片盤點未做。與價格監控／淨利分析不同，兩品項只計一次。[來源](https://note.com/bright_dietes994/n/ndbef55c17552)

### 新增UC-131–132

- [UC-131](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/131-student-demo-code-prereview.md)｜納入｜B。Antonio Leiva原文已完成式描述學生影片轉錄、對照GitHub與教師初審稿；完整回饋及教學成效未核，不自動評分。影片未看；與PR交付和自學工具不同。[來源](https://x.com/antonioleivag/status/2104982218678378855)
- [UC-132](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/132-podcast-transcript-retrieval-preparation.md)｜納入｜B。Hans C Nelson原文稱已完成轉錄、辨識說話者、語意切段及嵌入；混合檢索明示未做，品質未測。只計已完成前處理，不計未來RAG。[來源](https://x.com/HansCNelson/status/2109096639155634211)

### 新增UC-133–134

- [UC-133](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/133-screen-reader-menu-reformat.md)｜納入｜B。Mika Pyyhkala原文自述實際將餐廳菜單變H2/H3分享頁便於螢幕閱讀器；成品、內容完整與現版可及性未核。只算非視覺菜單瀏覽，不混點餐及其他任務。[來源](https://www.applevis.com/apps/ios/productivity/muse-meta)
- [UC-134](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/134-handwritten-kitchen-order-cart.md)｜納入｜B。Anthony Battaglia原文自述手寫廚房單首次建車混亂，親自示範後另一餐廳重跑仍有一兩錯；沒有付款到貨證據。與130門檻補貨對帳不同，兩餐廳只算一次。[來源](https://x.com/SayItStraightAB/status/2090594129784848387)

### 新增UC-135–136

- [UC-135](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/135-campus-meal-window-planning.md)｜納入｜B。Ben Boonstra自述已按課表、步行及菜單建立用餐日曆；未核路線、到店或營養，不等於027食譜採買。只計一流程。[來源](https://www.linkedin.com/posts/bboonstra26_grokbotforstudents-activity-7501708168121454592-_Fqr)
- [UC-136](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/136-community-park-feasibility-proposal.md)｜納入｜B。Jake Steinerman自述公園需求證據、成本資金途徑與提案文件已完成，首信無回覆；未核68來源或獲核准／募款，不計建成。文件組合只算一次。[來源](https://www.linkedin.com/posts/jasteinerman_my-ai-agent-is-helping-me-build-a-park-activity-7505250511059832833-VbzP)


### 新增UC-137–141

- [UC-137](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/137-visitor-print-queue-handoff.md)｜納入｜B。訪客PDF帳號／上傳及取印通知已有作者自述，官方確認現場放行仍必要；未核付款與紙本領取。不同於教材版面。[來源](https://x.com/benediktstroebl/status/2099701407171706932)
- [UC-138](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/138-streetlight-fault-report-handoff.md)｜納入｜B。原作者自述路燈設備編號、報修與回信，兩日修復未獨立核及不可推定因果；不同於買方詢價。[來源](https://x.com/FoxxAndCo/status/2108948824337080592)
- [UC-139](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/139-lost-property-match-search.md)｜納入｜B。原作者自述找到機場失物清單候選；不宣稱領回，不猜機場，與旅行規劃不同。[來源](https://x.com/fkysly/status/2108831626360930389)
- [UC-140](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/140-monocular-depth-robot-offline-review.md)｜納入｜B。作者自述單眼估距後控制機器人，影片未看；模型相對／公尺版本未知，不保證導航安全，非顯示或摩斯流程。[來源](https://x.com/hrhraj/status/2100768078909096017)
- [UC-141](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/141-vehicle-telemetry-gap-dashboard.md)｜納入｜B。作者自述已建行程／停車耗電看板並遇程序中止；日期、API與電池算法未核，雲端遷移未完成。不同於保養紀錄。[來源](https://www.threads.com/@firerock31/post/DdU25bOGTi1)


### 新增UC-142–144

- [UC-142](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/142-historical-folder-access-revocation.md)｜納入｜B。作者自述已撤歷史資料夾分享，沒有權限快照；官方群組／一般存取例外另核，不保證完全封閉。不同089刪重複檔。[來源](https://x.com/graceclarke/status/2109000147850117328)
- [UC-143](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/143-unclaimed-property-candidate-handoff.md)｜納入｜B。作者自述找到無人認領財產條目，未核權利／認領／入帳；官方免費與本人認領限制已讀，與訂單退款不同。[來源](https://x.com/richardroop/status/2109069130020131061)
- [UC-144](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/144-classical-translation-source-review.md)｜納入｜A。作者自述Bot參與古典語言英譯，公開逐節譯作與方法可讀；多AI貢獻及語文品質未核，不把全站作品各算一次。[來源](https://x.com/MrSaneApps/status/2108810882486501844)


### 新增UC-145–147

- [UC-145](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/145-offline-standard-form-field-validation.md)｜納入｜A。作者以假資料實作固定帳票輸入／輸出，手動跨模型十多輪修正後同業試用；未正式認定或發布。不同PDF抽取、工程追溯。[來源](https://note.com/toshi_michi2026/n/n339aa7f536a5)
- [UC-146](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/146-grant-supporting-document-gap-check.md)｜納入｜B。原作者數日使用後稱dots指出補助佐證來信不符要求；未核具體文件／缺項／核准，不猜地區計畫。不同許可行政與資金提案。[來源](https://zapier.com/blog/chatgpt-dots/)
- [UC-147](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/147-group-meal-bot-negotiation-demo.md)｜納入｜A。公開原型與作者報告支持模擬多人偏好協商及跨帳戶通信；正式送餐、QR交換及過敏安全未證，不拆多Bot或建置步驟。[來源](https://note.com/goroman/n/n78142a1b006d)


### 新增UC-148–150及034新證據

034新增實際費用疑點證據，基準由81變82；148–150新增三流程，本批增加4個合格流程，而不是4個新頁。

- [UC-148](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/148-course-degree-planning-prototype.md)｜納入｜A。作者明述三Bot完成選課原型，公開HTML支持課表／學分約束；舊課位、未核規則與後續Claude貢獻保留，沒有正式註冊結果。[來源](https://github.com/Domross3/umich-course-planner)
- [UC-149](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/149-directory-submission-live-link-verification.md)｜納入｜A。作者親核已投稿目錄條目與目的連結，公開資料亦可讀；編審、排名及收入未核，行動次數不當成果數。[來源](https://promptslove.com/blog/openai-dots-guide/)
- [UC-150](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/150-spreadsheet-date-formula-repair.md)｜納入｜B。作者明述先備份後修復公式及文字日期；沒有工作簿、驗算或提醒啟動。與資料抽取和對帳不同。[來源](https://thekayphillips.substack.com/p/my-first-look-at-chatgpt-dots-how)


### 新增UC-151–152

- [UC-151](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/151-booked-stay-prerequisite-followup.md)｜納入｜B。作者旅途中實收已訂房付款／登記前置提醒，來源為Booking與Gmail；無逐項結案、代付或門禁取得證據。中英同站不算獨立來源。[來源](https://zhuyawei.com/blog/meta-muse-personal-workflow-cloud-deploy/)
- [UC-152](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/152-interview-evidence-feedback-draft.md)｜納入｜V。廠商員工明確自報逐字稿到回饋草稿，後段人審／ATS為流程介紹未逐次核；不做自動評分錄用、不保證公平性。不同求職者申請。[來源](https://x.ai/bot/guides/grok-bot-for-recruiting)


### 新增UC-153–155

- [UC-153](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/153-tabletop-adventure-material-pack.md)｜納入｜B。原作者明述已組成桌上冒險地圖、講義和GM材料；日期、成品、實際跑團未核。不同可執行遊戲或題卷，三材料只算一次。[來源](https://www.reddit.com/r/DotsAI/comments/1x1nnr4/been_using_my_dot_for_quite_a_few_things/)
- [UC-154](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/154-contract-review-wait-time-analysis.md)｜納入｜V。廠商員工稱目前實用合約系統資料到審查階段統計與備忘；無特定報表、公式或成效，不推根因或個人績效。不同021請求分流。[來源](https://x.ai/bot/guides/grok-bot-for-legal-ops#procurement-and-vendor-workflow-analytics)
- [UC-155](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/155-field-service-job-change-coordination.md)｜納入｜B。作者明述早晨更新工單板並通知客戶、辦公室與技師；原圖未讀，通道回執和排班結果未核。多方同步合計一次。[來源](https://x.com/HouseHackerJon/status/2102036626478420315)


### 新增UC-156–157

- [UC-156](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/156-mail-system-migration-verification.md)｜納入｜B。作者自述公司郵件資料搬移及MX切換，完整性、收發與產品版本未核；官方365說明僅條件式背景，非作者配置。不同待辦搬家與別名修復。[來源](https://www.reddit.com/r/GrokBot/comments/1x1d7n9/comment/peug3yn/)
- [UC-157](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/157-editable-diagram-geometry-readback.md)｜納入｜B。論壇作者多輪局部幾何修改失敗與分層改善，原生最終檔未核；Bot預覽與清理聲稱不是驗收，不推CAD工程正確。[來源](https://forum.cursor.com/t/grok-bot-simple-image-track-geometry-edit-unreliable/172484)


### 新增UC-158–160

- [UC-158](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/158-paid-orphan-order-recovery-review.md)｜納入｜A。公開事件、修復提交及錯誤履約事故可讀，部分回顧由代理撰寫；兩單恢復為專案自述，交易出貨與並發去重未核。不同買方補貨，人工核准前不補猜地址／商品。[來源](https://github.com/jonathanmoore/forbotsonly/issues/35)
- [UC-159](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/159-reference-portrait-brush-fill-failure.md)｜納入｜B。原作者具體記錄參考肖像時筆刷／填色選錯及重畫循環；附影片未看，不推產品普遍缺陷。不同幾何圖面驗收。[來源](https://pt.linkedin.com/posts/wanderson-ricardo-346161231_o-grok-bot-j%C3%A1-sabe-usar-softwares-de-edi%C3%A7%C3%A3o-activity-7508887099132149760-JPof)
- [UC-160](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/160-handheld-device-integrated-prototype.md)｜納入｜A。作者親印殼、組裝與試玩回饋，公開版本驗收仍有誤計步及未測項；未獨立重現，不把造型／韌體／遊戲拆多案。[來源](https://github.com/goldsziggy/z-ark-digivice)


### 新增UC-161–162

- [UC-161](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/161-cross-model-response-dataset-audit.md)｜納入｜A。原作者固定題庫跨產品採集、285唯一鍵及原檔可核；單次德文與版本不一致，補檔及主觀量表限制保留。只讀資料不重跑，不能以條款未核方式重製採集。[來源](https://github.com/jojowanuby/LLM-Alignment-Atlas)
- [UC-162](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/162-mesh-simplification-camera-state-review.md)｜納入｜B。作者明述既有網格多級減面及相機／機器狀態驗收渲染；原資產和FPS未核，不將幾何減少當性能已提升，四版本只算一次。[來源](https://www.reddit.com/r/OpenAI/comments/1wyoaw7/my_dot_burns_16b_tokens_a_day_on_since_day_one_on/)


### 新增UC-163–164

- [UC-163](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/163-legacy-cms-history-migration.md)｜納入｜B。作者自述歷史CMS文章保留日期／舊路徑並上線；未逐篇核全文附件和轉址，客服協助解除staging及SSL問題不能歸為Bot自主修復。[來源](https://jdb.net/grok-bot-redesigned-my-website/)
- [UC-164](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/164-stale-ticket-retirement-scope-stop.md)｜納入｜B。原作者交辦舊工單清理後，既有補讀規則限流重試失控；帳停因果／數字未核，無完整關單或恢復證據。不同新bug分流，不把百餘單拆計。[來源](https://www.reddit.com/r/GrokBot/comments/1wpeg6a/grokbot_found_an_answer_to_a_problem_i_had_then/)


### 新增UC-165–166

- [UC-165](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/165-offline-network-control-evidence-review.md)｜納入｜B。作者合成設定與指定基準對照後有逐行輸出，仍有誤報；版次／profile和全報表未核，不連真設備，不收基準全文。雙Bot只算一次。[來源](https://www.linkedin.com/posts/adrian-mtz-luis_networkengineering-grokbot-aiagents-activity-7502088742267006976-Z5Ts)
- [UC-166](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/166-bidirectional-document-reading-order.md)｜納入｜B。編輯團隊實開文件測混合方向，工作表RTL而儲存格錯序，追加方向後自述修正；原檔未公開、僅一未指名RTL語言。不同列印重排與日期型別。[來源](https://maitz.co.il/en/grok-bot-language-support/)


### 新增UC-167

- [UC-167](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/167-web-accessibility-evidence-pack.md)｜納入｜V。廠商員工實跑儀表板可及性檢查，報告HTML／截圖／筆記；原包未公開、未核輔助科技或修復合規。不把連線／核准／持久記憶拆計。[來源](https://blocks.ai/blog/give-your-agent-network-a-computer-grok-bot)


### 新增UC-168

- [UC-168](https://github.com/RichardHan/ai-agent-use-cases/blob/main/cases/168-customer-order-availability-price-review.md)｜納入｜B。原作者影片描述明述實測照片訂單、價格與缺貨核對；詳細客戶通知來自第三方轉錄，影片及原表未核。與買方建車、門市賣速不同，色卡建表不另拆。[來源](https://www.youtube.com/watch?v=iP_jf9WxE9s)
