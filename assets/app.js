/* No external scripts, analytics, API tokens, or build dependencies. */
'use strict';
const REPO = 'https://github.com/RichardHan/ai-agent-use-cases/blob/main/';
const KIND = {case:'用法靈感', evidence:'經驗與踩坑', pending:'還在查證'};
const PROOF_DEFINITIONS = globalThis.PROOF_DEFINITIONS = {
  '官方自報': '官方團隊第一手發布的自述或示範，未經第三方獨立驗證。',
  '作者報告／示範': '社群作者公開分享的操作紀錄與示範，尚未取得獨立代碼庫驗證。',
  '公開資料核讀': '依公開貼文、文章或報告核讀整理，本庫未重現完整流程。',
  '模板／文件核讀': '基於開源模板、規格書或文件梳理，文件列出功能不代表已實測完成。',
  '尚待查證': '社群線索或待辦想法，證據尚不充分，請勿直接照做。'
};
const SCENARIO_TARGET_USERS = globalThis.SCENARIO_TARGET_USERS = {
  '生活': '想用 AI 簡化日常生活瑣事、旅行規劃或家庭事項安排的讀者',
  '工作': '想藉助 AI 提升日常行政、客服、行銷或營運效率的職場工作者',
  '省錢': '關注訂閱管理、帳單核對、比價採購與成本節省的精打細算者',
  '學習': '進行自主學習、文獻整理、研究探索或跨領域吸收的求知者',
  '創作': '從事文案撰寫、內容產出、視覺設計或影音製作的創作者',
  '開發': '工程師、程式開發者、技術架構師或自動化流程建構者'
};
const TOOL_PATTERNS = [['Grok Bot',/grok\s*bot/i],['Meta Muse',/\bmuse\b/i],['ChatGPT dots',/\bdots\b/i],['Cursor',/\bcursor\b/i],['GitHub',/\bgithub\b/i],['Notion',/\bnotion\b/i],['Facebook',/\bfacebook\b/i],['Google Drive',/google\s*drive|\bdrive\b/i],['Google Sheets',/google\s*sheets/i],['Haggle Bot',/haggle\s*bot/i]];
let entries = [], currentFiltered = [], activeScenario = '', currentDetailItem = null, lastTrigger = null, displayCopy = {}, failedPaths = [];
let allowAutomaticArrival=true, searchShareRequest=0;
let recoveringSources=false, recoveryNotice='', recoveryController=null, recoveryProgress=null;
let initialLoading=false, initialLoadController=null;
let discoveryDeck=null,discoveryKey='',discoveryReady=false,lastTriggerContext=null;
const $ = id => document.getElementById(id);
const clean = text => text.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[`*_]/g,'').trim();
const norm = text => text.normalize('NFKC').toLocaleLowerCase();
// Titles describe the visible page, not an unopened case requested in the URL.
// Keep source display titles intact; only bound user-entered search text.
function pageContextTitle({item,query='',facets=[],difficulty='',reviewed=false,loading=false,error=false,missing=false,partial=false,empty=false}={}) {
  const brand='AI 用法實驗室';
  if(item)return `${item.id} · ${item.title}｜${brand}`;
  const label=String(query).replace(/\s+/g,' ').trim();
  const chars=Array.from(label),short=chars.slice(0,80).join('')+(chars.length>80?'…':'');
  const conditions=[...facets,difficulty].filter(Boolean);
  const parts=[short?`搜尋「${short}」`:conditions.length?'篩選案例':reviewed?'最近核對的內容':'案例庫',...conditions];
  if(reviewed&&(short||conditions.length))parts.push('最近核對');
  const status=missing?'找不到分享案例':error?'載入失敗':loading?'載入中':partial?(empty?'已載入內容無符合結果':'已載入內容'):empty?'沒有符合結果':'';
  if(!status&&!short&&!conditions.length&&!reviewed)return brand+' · 案例庫';
  return [status,...parts].filter(Boolean).join(' · ')+'｜'+brand;
}
function syncPageContext() {
  const title=pageContextTitle({
    item:$('detail').open?currentDetailItem:null,
    query:$('query').value,
    reviewed:$('sort').value==='reviewed',
    facets:[activeScenario,KIND[$('kind').value],...['tool','category','proof'].map(id=>$(id).value)],
    difficulty:$('difficulty').value,
    loading:initialLoading&&!discoveryReady,
    error:!$('error').hidden,
    missing:!$('missing-case').hidden,
    partial:discoveryReady&&failedPaths.length>0,
    empty:discoveryReady&&currentFiltered.length===0
  });
  if(document.title!==title)document.title=title;
}
const tokenize = text => norm(text || '').trim().replace(/(?:智慧|智能)?\s*開關\s*(?:未支援|不支援)/g, ' 未支援 設備 排障 ').replace(/未支援\s*(?:的)?\s*(?:智慧|智能)?\s*開關/g, ' 未支援 設備 排障 ').replace(/開關\s*(?:看似)?\s*配對\s*(?:好|成功)?\s*(?:了)?\s*(?:卻|為什麼)?\s*(?:無法控制|不能動|燈還是不動|不動)/g, ' 開關 配對 排障 ').replace(/(?:航空|航班|飛機)?\s*追蹤\s*天線\s*量測/g, ' 航空追蹤 天線 量測 ').replace(/(?:掌上型|手持)?\s*圓形\s*螢幕(?:\s*mcp)?/g, ' 掌上型 圓屏 裝置 mcp ').replace(/司機\s*每日/g, ' 司機 每日 ').replace(/代填\s*(?:保險)?\s*(?:救援)?\s*表單/g, ' 代填 救援 表單 ').replace(/(?:日常|平常)?\s*(?:充電)?\s*上限/g, ' 上限 ').replace(/(?:兒少|兒童|孩子)\s*頻道/g, ' 孩子 頻道 ').replace(/(?:每天|每日)?\s*(?:x|推特|twitter)?\s*書籤\s*點子\s*(?:做)?\s*(?:可)?\s*互動/g, ' 每日 書籤 互動 demo 網頁 ').replace(/(?:youtube\s*)?(?:非公開)?\s*(?:播放)?\s*清單\s*(?:每日|每天)?\s*推薦/g, ' youtube 非公開 播放清單 推薦 ').replace(/(?:非公開)?\s*播放清單\s*(?:每日|每天)?\s*推薦/g, ' youtube 非公開 播放清單 推薦 ').replace(/(?:粉絲|關注)\s*名單/g, ' 粉絲 關注名單 ').replace(/(?:是否)?\s*回關/g, ' 回關 ').replace(/條件\s*篩選/g, ' 條件 篩選 ').replace(/健身\s*教練/g, ' 健身 教練 ').replace(/(?:每天|每日)?\s*(?:早上|早晨)?\s*(?:5\s*點|五點)\s*(?:語音)?\s*(?:喚醒|叫醒)(?:\s*(?:教練|bot))?/g, ' 每天 5點 喚醒 教練 ').replace(/(?:5k\s*)?跑走\s*(?:交替)?\s*(?:的)?\s*(?:5k)?\s*(?:計畫|計劃)?/g, ' 5k 跑走 計畫 ').replace(/掃描\s*(?:版)?\s*(?:pdf)?\s*(?:轉|轉成|轉為)\s*epub/g, ' 掃描 pdf epub ').replace(/epub\s*(?:目錄)?\s*(?:重排|可重排)/g, ' epub 目錄 重排 ').replace(/(?:重排|可重排)\s*epub(?:\s*目錄)?/g, ' epub 目錄 重排 ').replace(/快照\s*(?:自行重啟)?\s*(?:回到|回滾到?)\s*(?:數週前|幾週前)/g, ' 快照 重啟 數週前 ').replace(/雲端電腦\s*快照(?:\s*(?:失效|失敗|重啟))?/g, ' 雲端電腦 快照 失效 ').replace(/(?:單一職責|專門負責|專門)?\s*備份\s*bot/g, ' 備份 bot ').replace(/(?:比特幣|虛擬貨幣|加密貨幣|加密)\s*(?:晨報|早報)/g, ' 加密 晨報 ').replace(/(?:(?:加密|幣圈)\s*)?(?:新聞\s*)?一手來源\s*(?:確認|查證|查核)/g, ' 一手來源 確認 ').replace(/(?:dots)?\s*(?:先把)?\s*訂閱\s*(?:頻道)?\s*(?:整理成|做成)?\s*試算表/g, ' dots 訂閱 頻道 試算表 ').replace(/(?:youtube\s*)?(?:專用)?\s*非公開\s*(?:影片)?\s*(?:播放)?\s*清單/g, ' youtube 非公開 播放清單 ').replace(/(?:ai\s*)?(?:自動)?\s*(?:發)?\s*水文\s*(?:帳號)?\s*(?:取關)?/g, ' 水文 帳號 取關 ').replace(/(?:每天|每日)?\s*(?:盤點|檢討)?\s*原創\s*(?:與|和)?\s*轉發(?:\s*(?:檢討|分析|復盤))?/g, ' 原創 轉發 ').replace(/(?:每天|每日)\s*(?:早上|早晨)?\s*(?:自動)?\s*(?:印出|列印|印)?\s*(?:一頁)?\s*(?:加密)?\s*(?:貨幣)?\s*(?:晨報|早報)/g, ' 每天 列印 加密 晨報 ').replace(/(?:加密|幣圈)?\s*新聞\s*(?:一手來源)?\s*(?:確認|查證|查核)/g, ' 加密 新聞 一手來源 確認 ').replace(/(?:點名)?\s*(?:舊聞|翻炒|炒冷飯)\s*(?:重發)?\s*(?:點名)?/g, ' 舊聞 重發 點名 ').replace(/(?:dots)?\s*(?:先把)?\s*訂閱\s*(?:頻道)?\s*(?:整理成|做成)\s*試算表/g, ' dots 訂閱 頻道 試算表 ').replace(/(?:每天|每日)?\s*(?:傍晚)?\s*(?:挑|選)?\s*(?:\d+\s*支)?\s*(?:影片)?\s*(?:放進)?\s*(?:專用)?\s*(?:非公開)?\s*播放清單/g, ' 挑選 影片 非公開 播放清單 ').replace(/(?:不想)?\s*(?:被)?\s*(?:首頁)?\s*演算法\s*(?:牽著走|推薦)/g, ' 演算法 牽著走 ').replace(/(?:依|按)?\s*(?:你訂的)?\s*條件\s*篩\s*粉絲\s*(?:該不該)?\s*回關/g, ' 條件 篩選 粉絲 回關 ').replace(/(?:檢查|分析)?\s*關注\s*名單\s*(?:哪些)?\s*(?:可以)?\s*取關/g, ' 關注名單 取關 ').replace(/(?:強烈)?\s*建議\s*取關/g, ' 建議 取關 ').replace(/(?:粉絲|關注名單)?\s*條件\s*(?:初篩|篩選)\s*(?:與|和)?\s*人工\s*(?:確認|決定)/g, ' 條件 篩選 人工 決定 ').replace(/\b(uc|p)\s*[-_：:#.]?\s*(\d+)\b/g, '$1-$2').replace(/([a-z]+)([\u4e00-\u9fa5])/g, '$1 $2').replace(/([\u4e00-\u9fa5])([a-z]+)/g, '$1 $2').replace(/(?:^|\s)#(\d+)\b/g, ' uc-$1').replace(/\bpull\s+requests?\b/g, ' pr ').replace(/\brate\s*[- ]\s*limits?(?:ing)?\b/g, ' ratelimit ').replace(/\bhealth\s+checks?\b/g, ' healthcheck ').replace(/\bstate\s+machines?\b/g, ' statemachine ').replace(/\bknowledge\s+bases?\b/g, ' knowledgebase ').replace(/\bwork\s*[- ]\s*orders?\b/g, ' workorder ').replace(/\bfine\s*[- ]\s*tun(?:ing|e|ed|es)?\b/g, ' finetune ').replace(/\bcold\s+outreach\b/g, ' outreach ').replace(/\bpost\s*[- ]\s*mortems?\b/g, ' postmortem ').replace(/\bend\s*[- ]\s*to\s*[- ]\s*end\b/g, ' e2e ').replace(/\blife\s+cycles?\b/g, ' lifecycle ').replace(/\bcross\s*[- ]\s*agents?\b/g, ' cross-agent ').replace(/\bheart\s+beats?\b/g, ' heartbeat ').replace(/\bscreen\s+shots?\b/g, ' screenshot ').replace(/\btime\s+sheets?\b/g, ' timesheet ').replace(/\bpay\s+checks?\b/g, ' paycheck ').replace(/\brun\s+times?\b/g, ' runtime ').replace(/\bhand\s*[- ]\s*offs?\b/g, ' handoff ').replace(/\bdry\s*[- ]\s*runs?\b/g, ' dryrun ').replace(/\bguard\s*[- ]\s*rails?\b/g, ' guardrail ').replace(/\bhuman\s*[- ]\s*in\s*[- ]\s*the\s*[- ]\s*loop\b/g, ' hitl ').replace(/\bmodel\s*[- ]\s*context\s*[- ]\s*protocols?\b/g, ' mcp ').replace(/\bcommand\s*[- ]\s*lines?\b/g, ' cli ').replace(/\bapi\s*[- ]\s*keys?\b/g, ' apikey ').replace(/\bgrokbot\b/g, ' grok bot ').replace(/\bmetamuse\b/g, ' meta muse ').replace(/\bprs\b/g, ' pr ').replace(/\bmulti\s*[- ]\s*agents?\b/g, ' multi-agent ').replace(/\bmultiagents?\b/g, ' multi-agent ').replace(/\bretrieval\s*[- ]\s*augmented\s*[- ]\s*generations?\b/g, ' rag ').replace(/\bvector\s*[- ]\s*(?:dbs?|databases?)\b/g, ' vectordb ').replace(/\bcode\s*[- ]\s*reviews?\b/g, ' codereview ').replace(/\bcodereviews?\b/g, ' codereview ').replace(/\bmerge\s+requests?\b/g, ' mr ').replace(/\bweb\s*[- ]\s*hooks?\b/g, ' webhook ').replace(/\bcron\s*[- ]\s*jobs?\b/g, ' cron ').replace(/\bcronjobs?\b/g, ' cron ').replace(/\bcrontabs?\b/g, ' cron ').replace(/\b(?:tool|function)\s*[- ]\s*calls?(?:ing)?\b/g, ' toolcall ').replace(/\btool\s*[- ]\s*us(?:e|ed|es|ing)\b/g, ' toolcall ').replace(/\btext\s*[- ]\s*to\s*[- ]\s*speech\b/g, ' tts ').replace(/\bspeech\s*[- ]\s*to\s*[- ]\s*text\b/g, ' stt ').replace(/\bci\s*[/_-]?\s*cd\b/g, ' cicd ').replace(/\bcontinuous\s+integration\b/g, ' cicd ').replace(/\bself\s*[- ]\s*hosted\b/g, ' self-hosted ').replace(/\b(?:prompt|instruction)\s*[- ]\s*injections?\b/g, ' prompt-injection ').replace(/\bstructured\s*[- ]\s*outputs?\b/g, ' structured-output ').replace(/\bjson\s*[- ]\s*schemas?\b/g, ' json-schema ').replace(/\bserver\s*[- ]\s*sent\s*[- ]\s*events?\b/g, ' sse ').replace(/\bheadless\s*[- ]\s*browsers?\b/g, ' headless-browser ').replace(/\bsub\s*[- ]\s*agents?\b/g, ' subagent ').replace(/\bsubagents?\b/g, ' subagent ').replace(/\bworker\s*[- ]\s*agents?\b/g, ' worker-agent ').replace(/\bdata\s*[- ]\s*(?:exfiltration|leakage|leaks?)\b/g, ' data-leak ').replace(/\bexfiltration\b/g, ' data-leak ').replace(/\bcomputer\s*[- ]\s*use\b/g, ' computer-use ').replace(/\bgui\s*[- ]\s*agents?\b/g, ' gui-agent ').replace(/\bcontext\s*[- ]\s*(?:windows?|lengths?)\b/g, ' context-window ').replace(/\blong\s*[- ]\s*contexts?\b/g, ' context-window ').replace(/\bcontext\s*[- ]\s*compactions?\b/g, ' context-compaction ').replace(/\bhybrid\s*[- ]\s*search(?:es)?\b/g, ' hybrid-search ').replace(/\bsynthetic\s*[- ]\s*data\b/g, ' synthetic-data ').replace(/\bautonomous\s*[- ]\s*agents?\b/g, ' autonomous-agent ').replace(/\bkeep\s*[- ]\s*alives?\b/g, ' keepalive ').replace(/\bredirects?(?:ion)?\b/g, ' redirect ').replace(/\bcanary\s*[- ]\s*(?:releases?|deployments?)?\b/g, ' canary ').replace(/\bblue\s*[- ]\s*green(?:\s*[- ]\s*(?:releases?|deployments?))?\b/g, ' blue-green ').replace(/\borchestrat(?:e|ed|es|ing|or|ors|ion|ions)\b/g, ' orchestration ').replace(/\bcoordinat(?:e|ed|es|ing|or|ors|ion|ions)\b/g, ' coordination ').replace(/\bsupervisors?\b/g, ' supervisor ').replace(/\baccess\s*[- ]\s*controls?\b/g, ' access-control ').replace(/\brole\s*[- ]\s*based\s*[- ]\s*access\s*[- ]\s*controls?\b/g, ' rbac ').replace(/\bevent\s*[- ]\s*driven\b/g, ' event-driven ').replace(/\bsemantic\s*[- ]\s*search(?:es)?\b/g, ' semantic-search ').replace(/\bvector\s*[- ]\s*search(?:es)?\b/g, ' vector-search ').replace(/\bchain\s*[- ]\s*of\s*[- ]\s*thoughts?\b/g, ' cot ').replace(/\bair\s*[- ]\s*gaps?\b/g, ' airgap ').replace(/\bagentic\s*[- ]\s*workflows?\b/g, ' agentic-workflow ').replace(/\bre\s*[- ]*rank(?:ing|s|er|ers)?\b/g, ' rerank ').replace(/\bde\s*[- ]*dup(?:lication)?s?\b/g, ' dedup ').replace(/\bdelegat(?:e|es|ed|ing|ion|ions)\b/g, ' delegate ').replace(/\baudit\s*[- ]\s*trails?\b/g, ' audit-trail ').replace(/\baudit\s*[- ]\s*logs?\b/g, ' audit-log ').replace(/\bexponential\s*[- ]\s*backoffs?\b/g, ' backoff ').replace(/\bbackoffs?\b/g, ' backoff ').replace(/\bmulti\s*[- ]\s*modals?\b/g, ' multimodal ').replace(/\bvision\s*[- ]\s*language\s*[- ]\s*models?\b/g, ' vlm ').replace(/\bsystem\s*[- ]\s*(?:prompts?|instructions?)\b/g, ' system-prompt ').replace(/\bleast\s*[- ]\s*privileges?\b/g, ' least-privilege ').replace(/\bwhite\s*[- ]\s*lists?(?:ing)?\b/g, ' whitelist ').replace(/\ballow\s*[- ]\s*lists?(?:ing)?\b/g, ' allowlist ').replace(/\bblack\s*[- ]\s*lists?(?:ing)?\b/g, ' blacklist ').replace(/\bdeny\s*[- ]\s*lists?(?:ing)?\b/g, ' denylist ').replace(/\bblock\s*[- ]\s*lists?(?:ing)?\b/g, ' blocklist ').replace(/\bsensitive\s*[- ]\s*(?:data|info|information)\b/g, ' sensitive-data ').replace(/\brouters?\b/g, ' router ').replace(/\bkill\s*[- ]\s*switch(?:es)?\b/g, ' kill-switch ').replace(/\bemergency\s*[- ]\s*stops?\b/g, ' emergency-stop ').replace(/\bcircuit\s*[- ]\s*breakers?\b/g, ' circuit-breaker ').replace(/\bcheck\s*[- ]\s*points?(?:ing)?\b/g, ' checkpoint ').replace(/\bcheckpoint(?:ing|s)?\b/g, ' checkpoint ').replace(/\bsandbox(?:ing|es)?\b/g, ' sandbox ').replace(/\boutbox\s*[- ]\s*(?:patterns?)?\b/g, ' outbox ').replace(/\b(?:long|short)\s*[- ]\s*term\s*[- ]\s*memory\b/g, ' memory ').replace(/\b(?:working|shared|external|visible|persistent)\s*[- ]\s*memory\b/g, ' memory ').replace(/\bgithub\s+actions\b/g, ' cicd ').replace(/\bpr\s*審查/g, ' codereview ').replace(/\bidempotenc(?:e|y)\b/g, ' idempotent ').replace(/\b(?:task|work|job)\s*[- ]\s*plannings?\b/g, ' planning ').replace(/\bplannings?\b/g, ' planning ').replace(/\breproducib(?:ility|le)\b/g, ' reproducibility ').replace(/\breproduc(?:e|ed|es|ing)\b/g, ' reproducibility ').replace(/\bcitat(?:ion|ions|e|ed|es|ing)\b/g, ' citation ').replace(/\bfail\s*[- ]\s*overs?\b/g, ' failover ').replace(/\bacceptance\s*[- ]\s*(?:criteri(?:a|on)|tests?|testing)?\b/g, ' acceptance ').replace(/\bacceptances?\b/g, ' acceptance ').replace(/\bparallel(?:ism)?\b/g, ' parallel ').replace(/\bconcurr(?:ency|ent)\b/g, ' concurrency ').replace(/\bgraceful\s*[- ]\s*degradations?\b/g, ' fallback ').replace(/\bcach(?:e|es|ed|ing)\b/g, ' cache ').replace(/\bschedul(?:e|es|ed|ing|er|ers)\b/g, ' schedule ').replace(/\banomaly\s*[- ]\s*detections?\b/g, ' anomaly ').replace(/\breview(?:s|ed|ing|er|ers)?\b/g, ' review ').replace(/\bbenchmark(?:ing|s)?\b/g, ' benchmark ').replace(/\bevaluat(?:e|es|ed|ing|ion|ions)\b/g, ' evaluation ').replace(/\bsafety\s*[- ]\s*rails?\b/g, ' guardrail ').replace(/\bcolor(?:ing)?\s*[- ]\s*pages?\b/g, ' coloring ').replace(/\bprint(?:er|ers|ing|s)?\b/g, ' print ').replace(/\broad\s*[- ]?\s*side(?:\s*[- ]\s*assistance)?\b/g, ' roadside ').replace(/\bbreak\s*[- ]?\s*downs?\b/g, ' breakdown ').replace(/\bstall(?:s|ed|ing)?\b/g, ' stall ').replace(/\bgrades?\b/g, ' grade ').replace(/\bhome\s*[- ]?\s*works?\b/g, ' homework ').replace(/\bassign(?:ment|ments)?\b/g, ' assignment ').replace(/\bsmart\s*[- ]\s*tvs?\b/g, ' tv ').replace(/\bambient(?:\s*[- ]\s*(?:boards?|displays?))?\b/g, ' ambient ').replace(/\bprompt\s*[- ]\s*attacks?\b/g, ' prompt-injection ').replace(/\breservations?\b/g, ' reservation ').replace(/\bbookings?\b/g, ' booking ').replace(/\bcolor(?:ing)?\s*[- ]\s*(?:books?|sheets?)\b/g, ' coloring ').replace(/\btow(?:ing)?(?:\s*[- ]\s*trucks?)?\b/g, ' towing ').replace(/\bself\s*[- ]\s*reflect(?:ion|ive)?\b/g, ' reflection ').replace(/\breflections?\b/g, ' reflection ').replace(/\bself\s*[- ]\s*(?:correct(?:ion|ing|s)?|heal(?:ing|s)?)\b/g, ' self-correction ').replace(/\btoken\s*(?:用量|消耗)\b/g, ' token 用量 ').replace(/\bwebhook\s*通知/g, ' webhook 通知 ').replace(/\btv\s*看板/g, ' tv 看板 ').replace(/電視\s*看板/g, ' 電視 看板 ').replace(/\bmcp\s*(?:伺服器|服務器)/g, ' mcp 伺服器 ').replace(/\bmcp\s*工具/g, ' mcp 工具 ').replace(/\bbot\s*模板/g, ' bot 模板 ').replace(/\bbot\s*通知/g, ' bot 通知 ').replace(/\bapi\s*金鑰/g, ' api 金鑰 ').replace(/保險\s*表單/g, ' 保險 表單 ').replace(/救援\s*表單/g, ' 救援 表單 ').replace(/\bwake\s*[- ]\s*ups?\b/g, ' wakeup ').replace(/\bwakeups?\b/g, ' wakeup ').replace(/\bclaudecodes?\b/g, ' claude code ').replace(/\bt3\s*[- ]\s*codes?\b/g, ' t3 code ').replace(/\bt3codes?\b/g, ' t3 code ').replace(/\bcoding\s*[- ]\s*agents?\b/g, ' coding-agent ').replace(/\b(?:car\s*[- ]\s*rentals?|rental\s*[- ]\s*cars?)\b/g, ' car-rental ').replace(/\binsurance\s*[- ]\s*claims?\b/g, ' insurance-claim ').replace(/\b(?:auto|car)\s*[- ]\s*insurances?\b/g, ' car-insurance ').replace(/\bauto\s*[- ]\s*prints?\b/g, ' auto-print ').replace(/\bautoprints?\b/g, ' auto-print ').replace(/\bopen\s*[- ]\s*sources?\b/g, ' open-source ').replace(/\bchat\s*[- ]\s*negotiations?\b/g, ' chat-negotiation ').replace(/\bmcp\s*[- ]\s*servers?\b/g, ' mcp server ').replace(/\bads\s*[- ]?\s*b\b/g, ' ads-b ').replace(/\bautobahns?\b/g, ' autobahn ').replace(/\b(?:smart|android|google|apple)\s*[- ]\s*tvs?\b/g, ' tv ').replace(/\bandroid-tv\b/g, ' tv ').replace(/\bgoogle-tv\b/g, ' tv ').replace(/\bcloudflare\s*[- ]\s*workers?\b/g, ' cloudflare-worker ').replace(/\bcf\s*[- ]\s*workers?\b/g, ' cloudflare-worker ').replace(/(?:卡車|貨車|長途)?\s*(?:駕駛|司機)\s*工時(?:表|紀錄)?/g, ' 司機 工時 ').replace(/工時\s*(?:核對|查核|對帳|稽核)/g, ' 工時 對帳 ').replace(/(?:出勤|打卡)\s*紀錄/g, ' 打卡 紀錄 ').replace(/超時\s*(?:工作|工時)/g, ' 超時 工時 ').replace(/(?:任務|工作)\s*封存/g, ' 任務 封存 ').replace(/封存\s*(?:任務|工作)/g, ' 封存 任務 ').replace(/家用\s*印表機/g, ' 家用 印表機 ').replace(/\b1090\s*mhz\b/g, ' 1090mhz ').replace(/\b1090\s*兆赫\b/g, ' 1090mhz ').replace(/\b(?:hand\s*[- ]\s*held|palm\s*[- ]\s*top)s?\b/g, ' handheld ').replace(/\bface\s*[- ]\s*swaps?\b/g, ' face-swap ').replace(/(?:每日|每天)\s*(?:隨機)?\s*(?:不重複)?\s*(?:參考照|照片|相片)\s*(?:換臉|替換臉)/g, ' 每日 隨機 參考照 換臉 ').replace(/(?:人臉|面部|臉部|照片)\s*替換/g, ' 換臉 ').replace(/(?:人臉|面部|臉部|照片)\s*換臉/g, ' 換臉 ').replace(/每日\s*換臉/g, ' 每日 換臉 ').replace(/(?:薪資|工資|薪水|薪酬)\s*單?\s*(?:核對|查核|對帳|對賬|稽核|核算)/g, ' 薪資單 核對 ').replace(/工時\s*核算/g, ' 工時 核對 ').replace(/(?:幼兒|幼童|小童|兒童|孩子|小孩)\s*著色(?:頁|本|畫)?/g, ' 兒童著色 ').replace(/著色\s*(?:線稿|圖|頁|本|畫)/g, ' 著色 ').replace(/每日\s*著色/g, ' 每日 著色 ').replace(/(?:電話\s*代撥|代撥\s*電話|電話\s*代打)/g, ' 代打電話 ').replace(/(?:國外|海外|境外|自駕|租車)\s*(?:拋錨|故障|車輛故障)/g, ' 拋錨 ').replace(/(?:帳單|帳戶|費用)\s*抵免/g, ' 帳單 抵免 ').replace(/(?:爭取|降費)\s*抵免/g, ' 抵免 ').replace(/(?:電視|tv)\s*(?:去廣告|免廣告)/g, ' 電視 去廣告 ').replace(/(?:電視|tv)\s*待機/g, ' 電視 待機 ').replace(/(?:電視|tv)\s*(?:看|查|顯示)?\s*(?:女兒|孩子|小孩|學生)?\s*成績/g, ' 電視 成績 ').replace(/(?:客廳)?\s*(?:電視|tv)\s*成績\s*(?:看板)?/g, ' 電視 成績 看板 ').replace(/(?:智慧|智能)?\s*電視\s*(?:常亮|待機)\s*(?:看板|螢幕|顯示)?/g, ' 電視 常亮 看板 ').replace(/(?:自製|客廳)\s*電視\s*首頁/g, ' 自製首頁 電視 ').replace(/(?:常亮|待機)\s*(?:螢幕|看板|顯示)?\s*(?:看|查|顯示)?\s*(?:女兒|孩子|小孩)?\s*成績/g, ' 電視 常亮 看板 成績 ').replace(/(?:常亮|待機)\s*(?:螢幕|看板|顯示)?\s*(?:作業缺交|缺交作業|作業)/g, ' 電視 常亮 看板 缺交作業 ').replace(/(?:電視|tv)\s*(?:顯示|看|查)\s*(?:缺交)?\s*作業/g, ' 電視 缺交作業 ').replace(/(?:電視|tv)\s*(?:常亮|待機)\s*(?:看板|螢幕)?\s*(?:看|查|顯示)?\s*成績/g, ' 電視 常亮 看板 成績 ').replace(/(?:待機|自製)\s*首頁/g, ' 待機 首頁 ').replace(/webhook\s*(?:叫醒|喚醒)/g, ' webhook 叫醒 ').replace(/程式代理\s*通知/g, ' 程式代理 通知 ').replace(/(?:叫醒|喚醒)\s*grok(?:\s*bot)?/g, ' 叫醒 grok bot ').replace(/(?:叫醒|喚醒)\s*bot/g, ' 叫醒 bot ').replace(/(?:工作階段|工作會話|作業階段)\s*(?:結束|完畢|跑完|完成|停滯|卡住|卡死)(?:\s*(?:webhook|通知))?/g, ' 程式代理 工作階段 webhook ').replace(/(?:工作階段|工作會話|作業階段)\s*(?:停滯|卡住|卡死)/g, ' 工作階段 停滯 ').replace(/(?:代訂|預約)\s*餐廳/g, ' 餐廳訂位 ').replace(/(?:代訂|代預約)\s*位/g, ' 訂位 ').replace(/(?:電話|語音)?\s*訂位\s*代理/g, ' 電話訂位 ').replace(/餐廳\s*代訂/g, ' 餐廳訂位 ').replace(/(?:智慧|智能)?\s*開關\s*(?:排障|除錯|故障)/g, ' 開關 排障 ').replace(/(?:家電|設備|裝置)\s*(?:導入|導入排障)/g, ' 設備 導入 ').replace(/(?:未支援|不支援)\s*(?:設備|裝置|家電|硬體)/g, ' 未支援 設備 ').replace(/sdr\s*(?:接收站|接收機|接收器)/g, ' sdr 接收站 ').replace(/sdr\s*解碼/g, ' sdr 解碼 ').replace(/ads-b\s*(?:接收機|接收器)/g, ' ads-b 接收站 ').replace(/(?:分存|封存)\s*(?:驗收|查驗)/g, ' 封存 驗收 ').replace(/(?:實際)?\s*工具\s*(?:實際)?\s*回應/g, ' 工具 回應 ').replace(/(?:工具回應|模型輸出)\s*分存/g, ' 工具 回應 封存 ').replace(/模型\s*輸出/g, ' 模型 輸出 ').replace(/(?:(?:舊|新)\s*交辦|交辦\s*(?:任務|工作))/g, ' 交辦 任務 ').replace(/(?:高速公路|公路)\s*(?:拋錨|故障|壞掉)/g, ' 公路 拋錨 ').replace(/(?:隨機)?\s*參考照\s*換臉/g, ' 參考照 換臉 ').replace(/隨機\s*參考照/g, ' 隨機 參考照 ').replace(/(?:排程|例行任務)\s*(?:關掉|關回|停用)/g, ' 排程 關掉 ').replace(/執行\s*狀態\s*(?:矛盾|不一致|衝突)/g, ' 執行 狀態 矛盾 ').replace(/(?:任務|狀態|執行)\s*(?:矛盾|衝突|不一致)/g, ' 狀態 矛盾 ').replace(/(?:(?:掌上型|手持)\s*圓屏|圓屏\s*(?:裝置|螢幕))/g, ' 掌上型 圓屏 裝置 ').replace(/\bteslascope\s*(?:長途)?\s*(?:出發)?\s*(?:準備)?\s*(?:技能|排程)?/g, ' teslascope 特斯拉 長途 技能 ').replace(/(?:(?:特斯拉|\btesla\b)\s*(?:長途)?\s*(?:出發|出門)?\s*(?:前)?|(?:長途)?\s*(?:出發|出門)\s*(?:前)?)\s*(?:充電|充飽電|充滿電|充滿|充到滿|滿充)?\s*(?:技能)?\s*(?:自動)?\s*還原/g, ' 特斯拉 出發 充電 自動還原 ').replace(/(?:特斯拉|\btesla\b)\s*(?:長途)?\s*(?:出發|出門)?\s*(?:前)?\s*(?:充電|充飽電|充滿電|充滿|充到滿|滿充|充到\s*100%|充電到\s*100%)\s*(?:技能)?/g, ' 特斯拉 出發 充電 ').replace(/(?:出發|出門)\s*(?:前)?\s*(?:電動車|電車|特斯拉)?\s*(?:充電|充飽電|充滿電|充滿|充到滿|滿充|充到\s*100%)/g, ' 出發 充電 ').replace(/(?:特斯拉|\btesla\b|teslascope)\s*(?:長途)?\s*(?:出發)?\s*準備\s*(?:技能)?/g, ' teslascope 特斯拉 長途 技能 ').replace(/(?:長途)?\s*(?:出發|出門)\s*(?:前)?\s*(?:要)?\s*(?:充電|充飽電|充滿電|充滿|充到滿|滿充)(?:\s*(?:100%|到滿))?/g, ' 出發 充電 ').replace(/(?:充電\s*(?:排程)?)\s*(?:自動)?\s*還原/g, ' 充電 排程 自動還原 ').replace(/(?:特斯拉|\btesla\b)\s*(?:長途)?\s*(?:出發)?\s*準備\s*(?:技能)?/g, ' 特斯拉 長途 技能 ').replace(/(?:特斯拉|\btesla\b)\s*長途(?:\s*出發)?/g, ' 特斯拉 長途 出發 ').replace(/(?:特斯拉|\btesla\b)\s*出發/g, ' 特斯拉 出發 ').replace(/(?:電動車|電車)\s*(?:充電|充飽電|充滿電|充滿|充到滿|滿充)?\s*(?:排程)?/g, ' 電動車 充電 排程 ').replace(/出門前\s*充電/g, ' 出發 充電 ').replace(/(?:清理|過濾|巡檢|審查|檢查)?\s*youtube\s*(?:頻道)?\s*(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)?\s*留言\s*(?:過濾|巡檢|清理|審查)?/g, ' youtube 留言 巡檢 ').replace(/(?:小孩|兒童|孩子)\s*頻道\s*(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)?\s*留言(?:\s*(?:過濾|巡檢|審查|檢查|清理))?/g, ' youtube 留言 巡檢 ').replace(/(?:檢查|審查|巡檢|看)?\s*(?:小孩|孩子|兒童)\s*(?:頻道)?\s*(?:留言|評論)/g, ' 孩子 留言 審查 ').replace(/(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)\s*留言\s*(?:過濾|巡檢|清理|審查)?/g, ' 留言 審查 ').replace(/(?:可疑|惡意|不當|不良|垃圾|詐騙)\s*留言\s*(?:過濾|巡檢|清理|審查)?/g, ' 留言 審查 ').replace(/留言\s*(?:安全)?\s*(?:審查|巡檢|過濾)/g, ' 留言 審查 ').replace(/zillow\s*(?:買房|看房|找房)?\s*(?:過濾|篩選)?/g, ' zillow 買房 篩選 ').replace(/(?:兩關)\s*(?:過濾|篩選)/g, ' 篩選 ').replace(/買房\s*(?:兩關)?\s*(?:過濾|篩選)/g, ' 買房 篩選 ').replace(/(?:房源|看房|房屋)\s*(?:篩選|過濾)/g, ' 買房 篩選 ').replace(/(?:房源|看房|房屋|找房|買房)\s*(?:篩選|過濾|交接)?\s*(?:給)?\s*房仲/g, ' 買房 篩選 房仲 ').replace(/(?:買房|看房|找房)\s*(?:下班|尖峰)?\s*通勤(?:\s*時間)?(?:\s*(?:與|和|及)\s*學區)?/g, ' 買房 通勤時間 學區 ').replace(/(?:下班|尖峰)\s*通勤(?:\s*時間)?\s*(?:與|和|及)\s*學區/g, ' 通勤時間 學區 ').replace(/(?:下班|尖峰)\s*通勤(?:\s*時間)?/g, ' 通勤時間 ').replace(/通勤(?:\s*時間)?\s*(?:與|和|及)\s*學區/g, ' 通勤時間 學區 ').replace(/(?:買房|看房|找房)\s*學區(?:\s*(?:篩選|過濾))?/g, ' 買房 學區 篩選 ').replace(/(?:交屋)?\s*(?:前後)?\s*(?:整修|修繕|維護)\s*(?:成本|費用|費)(?:\s*(?:預估|估算|評估|預計))?/g, ' 整修 費用 ').replace(/(?:買房|看房|找房)\s*(?:依|按)?\s*(?:預算|價格)(?:\s*上限)?(?:\s*(?:下班|尖峰)?\s*(?:通勤|通勤時間))?(?:\s*(?:與|和|及)?\s*學區)?(?:\s*(?:過濾|篩選))?/g, ' 買房 預算 學區 篩選 ').replace(/dots\s*(?:官網)?\s*詢問信/g, ' dots 詢問信 ').replace(/(?:詢問信|諮詢信|客戶信件|來信)\s*(?:寫入|記進|記錄|登記|登錄|整理)?\s*(?:notion\s*)?(?:台帳|清單|表格|表|受理表)\s*(?:與|和|及)?\s*(?:回信)?\s*(?:草稿|回覆)/g, ' 詢問信 notion 台帳 草稿 ').replace(/詢問信\s*(?:草稿|回覆|回信)/g, ' 詢問信 草稿 ').replace(/(?:dots)?\s*(?:google)?\s*(?:行事曆|日曆)\s*(?:找|查)\s*(?:空檔|候選日)?(?:\s*(?:擬|寫|存)?\s*(?:回信|草稿|回覆)+)?/g, ' dots 日曆 找空檔 草稿 ').replace(/(?:notion\s*)?(?:受理表|台帳)\s*(?:找|查)?\s*(?:google)?\s*(?:行事曆|日曆|空檔|候選日)(?:\s*(?:找|查)?\s*(?:空檔|候選日))?(?:\s*(?:存|寫|擬|儲存)?\s*(?:回信)?\s*(?:草稿|回覆))?/g, ' notion 台帳 行事曆 空檔 草稿 ').replace(/(?:notion)?\s*(?:受理表|台帳)\s*(?:回信)?\s*(?:草稿|回覆)/g, ' notion 台帳 草稿 ').replace(/(?:找|查)?\s*(?:google)?\s*(?:行事曆|日曆)\s*(?:找|查)?\s*(?:空檔|候選日|時間)/g, ' 行事曆 找空檔 ').replace(/(?:客戶\s*來信|客戶|來信)\s*(?:想約|約)\s*(?:時間|會面|會議)(?:\s*(?:存|寫|擬)?\s*(?:gmail)?\s*(?:回信|草稿|回覆)+)?/g, ' 客戶 來信 約時間 草稿 ').replace(/主管\s*(?:平日|工作日)?\s*(?:晨報|日報)\s*(?:公開)?\s*(?:新聞|情報|資訊)\s*(?:分流|分工|分派)/g, ' 主管 晨報 公開 新聞 分流 ').replace(/主管\s*(?:平日|工作日)?\s*(?:晨報|日報)\s*(?:分工)?/g, ' 主管 晨報 分工 ').replace(/(?:內網|內部)\s*(?:信件|郵件|公文|資料)?\s*(?:與|和)?\s*(?:外部|公開)\s*(?:新聞|情報|資訊|資料)?\s*(?:分流|分工|分派)?/g, ' 晨報 內部 郵件 公開 新聞 分流 ').replace(/晨報\s*分工(?:\s*(?:與|和|及)?\s*notion\s*(?:日報|台帳)?)?/g, ' 晨報 分工 notion ').replace(/dots\s*(?:讀|看)?\s*內部\s*(?:信件|郵件|行程)?/g, ' dots 內部 郵件 ').replace(/(?:grok\s*bot|bot)\s*(?:收|抓|整理)?\s*公開\s*(?:新聞|情報|訊息)?/g, ' grok bot 公開 新聞 ').replace(/hetzner\s*(?:雲主機|主機|伺服器)?\s*(?:補貨|查貨|有貨|候補)?/g, ' hetzner 補貨 ').replace(/(?:雲主機|主機|伺服器)\s*(?:售完|缺貨)?\s*(?:補貨|查貨|候補)\s*(?:下單|購買)?/g, ' 主機 補貨 ').replace(/售完\s*(?:候補|查貨|監看)/g, ' 售完 候補 ').replace(/(?:雲主機|主機|伺服器)?\s*售完\s*(?:每\s*\d+\s*分鐘)?\s*(?:查貨|候補|監看)/g, ' 主機 售完 候補 ').replace(/(?:hetzner)?\s*(?:雲主機|主機|伺服器)?\s*(?:售完|缺貨)\s*(?:候補|補貨|查貨)?\s*(?:自動)?\s*(?:下單|下訂|購買|自動購買)/g, ' hetzner 主機 售完 候補 購買 ').replace(/(?:clawcall|claw call)\s*(?:電話|語音)?\s*(?:訂位|預約)?/g, ' clawcall 電話訂位 ').replace(/(?:電話|語音)\s*(?:訂位|預約)\s*(?:bot|機器人|代理)?/g, ' 電話訂位 bot ').replace(/(?:電話|語音)\s*(?:代訂|訂位|預約)/g, ' 電話訂位 ').replace(/t-mobile\s*(?:悄悄)?\s*(?:漲價|調高|調漲|加價)/g, ' t-mobile 漲價 ').replace(/t-mobile\s*(?:帳單|帳戶)?\s*(?:抵免|減免)/g, ' t-mobile 抵免 ').replace(/siriusxm\s*(?:線上|聊天)?\s*(?:議價|降費|協商|談判)?/g, ' siriusxm 議價 ').replace(/(?:線上|即時)?\s*聊天\s*(?:客服)?\s*議價/g, ' 聊天 議價 ').replace(/(?:帳單|月費|費用)\s*(?:漲價|調高|調漲|加價)/g, ' 帳單 漲價 ').replace(/(?:司機|駕駛)\s*(?:對|核對|核算)?\s*(?:薪資單|薪水|薪資)/g, ' 司機 薪資單 核對 ').replace(/(?:月底|發薪|發薪日)?\s*(?:核對|對|算)\s*(?:薪水|薪資|薪酬)/g, ' 薪資 核對 ').replace(/工時\s*(?:核算|算|計算)?\s*(?:薪水|薪資)/g, ' 工時 薪資 ').replace(/(?:過期|過時|逾期|失效)\s*(?:任務|工作|指示|待辦)\s*(?:重送|重新發送|補發)?/g, ' 過期 任務 重送 ').replace(/(?:待辦|交辦)\s*(?:任務|工作)?\s*(?:過期|逾期|失效)/g, ' 過期 任務 ').replace(/(?:重新|補)\s*發送/g, ' 重送 ').replace(/(?:工具呼叫|工具調用|工具使用)?\s*(?:實際)?\s*回應\s*(?:分存)?\s*(?:隔離|檢疫|封裝)/g, ' 工具 回應 隔離 ').replace(/回應\s*隔離/g, ' 回應 隔離 ').replace(/(?:已)?\s*封存\s*(?:任務|工作)?\s*(?:狀態)?\s*(?:矛盾|衝突|不一致)/g, ' 封存 任務 狀態 矛盾 ').replace(/(?:任務|狀態|執行)\s*(?:矛盾|衝突|不一致)/g, ' 狀態 矛盾 ').replace(/(?:每天|每日)\s*(?:早上|早晨|清晨)?\s*(?:自動)?\s*(?:各)?\s*(?:列印|印出|打印|印)/g, ' 每天 早上 列印 ').replace(/(?:每天)?\s*(?:早上|早晨|清晨)\s*(?:自動)?\s*(?:列印|印出|打印)/g, ' 早上 列印 ').replace(/(?:每天)?\s*早上\s*(?:吐出)?\s*(?:今天的)?\s*著色(?:頁|本|畫)?/g, ' 早上 著色頁 ').replace(/(?:(?:家用|家裡|家中)\s*印表機|印表機\s*著色)/g, ' 家用 印表機 著色 ').replace(/印表機\s*(?:列印|印出|打印)/g, ' 印表機 列印 ').replace(/(?:印表機|印機)\s*(?:列印|印出|印)?\s*(?:黑白|粗線條)?\s*線稿/g, ' 家用 印表機 線稿 ').replace(/(?:(?:黑白|粗線條)\s*線稿|線稿\s*(?:著色|列印))/g, ' 黑白 線稿 著色 ').replace(/(?:獨角獸|小仙子|城堡)\s*(?:線稿|著色)/g, ' 獨角獸 線稿 ').replace(/(?:國外|海外)?\s*(?:車輛|汽車)?\s*(?:拋錨|故障)\s*(?:求援|求助|救援)/g, ' 拋錨 救援 ').replace(/(?:高速公路|公路)\s*(?:車子|車輛|汽車)\s*(?:拋錨|故障|壞掉)(?:\s*(?:找)?\s*(?:拖吊|拖車|救援))?/g, ' 高速公路 車子 拋錨 拖吊 ').replace(/(?:看不懂|聽不懂)\s*(?:德文|德語|當地語言|外語)(?:\s*(?:填|寫)?\s*(?:找)?\s*(?:救援|求助|申請表|表單))?/g, ' 德文 語言 救援 表單 ').replace(/(?:國外|海外|境外|自駕|租車|車輛|汽車|車子)\s*(?:車輛|汽車|車子)?\s*(?:拋錨|故障|壞掉)(?:\s*(?:找)?\s*(?:拖吊|拖車|求援|求助|救援))*/g, ' 拋錨 救援 拖吊 ').replace(/(?:國外|海外|境外)?\s*(?:自駕)?\s*道路\s*救援/g, ' 道路救援 ').replace(/(?:國外|海外)?\s*(?:修車|車輛救援|保險救援)\s*(?:申請表|表單)/g, ' 救援 表單 ').replace(/(?:德文|德語)\s*(?:語音\s*(?:聽不懂|不通)?|(?:聽不懂|不通))/g, ' 德文 語言 ').replace(/道路\s*救援\s*(?:申請表|申請|表單)/g, ' 道路救援 救援 表單 ').replace(/(?:救援|求援|求助)\s*(?:申請表|表單)/g, ' 救援 表單 ').replace(/(?:45\s*分鐘|長\s*時間|超時|逾時|很久|遲遲)\s*(?:沒更新|未更新|停滯|卡住)/g, ' 停滯 ').replace(/(?:程式代理|代碼代理|編程代理)\s*(?:跑完|做完|結束|卡住|停滯)(?:\s*(?:沒|了沒))?/g, ' 程式代理 工作階段 ').replace(/(?:claude\s*code|codex|t3\s*code)\s*(?:跑完|做完|結束)/g, ' claude code 工作階段 ').replace(/(?:客廳|電視|tv)?\s*(?:自製)?\s*(?:常亮|待機)\s*(?:螢幕|看板|顯示|首頁)/g, ' 電視 常亮 看板 ').replace(/(?:抓|查詢|抓取|看|查|查看|顯示|追蹤)\s*(?:女兒|孩子|小孩|學生)?\s*(?:各科)?\s*成績/g, ' 成績 ').replace(/(?:成績|各科成績)\s*(?:與|和|及)\s*(?:缺交作業|缺交|作業)/g, ' 成績 缺交作業 ').replace(/(?:學校)?\s*缺交\s*(?:作業|功課|課業)/g, ' 缺交作業 ').replace(/(?:電視\s*(?:去廣告|免廣告|關掉廣告|去除廣告)|(?:關掉|去除|去|免)\s*(?:電視)?\s*廣告)/g, ' 電視 去廣告 ').replace(/\besp(?:\s*系列)?\s*(?:圓形(?:\s*(?:螢幕|裝置|終端))?|(?:螢幕|裝置|終端))/g, ' esp 圓形 螢幕 ').replace(/語音\s*終端\s*(?:中繼)?/g, ' 語音 終端 中繼 ').replace(/(?:(?:過濾|巡檢|審查|檢查|清理)\s*(?:小孩|孩子|兒童)\s*(?:的)?\s*(?:youtube)?\s*(?:頻道)?\s*(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)?\s*(?:留言|評論)?|(?:小孩|孩子|兒童)\s*(?:的)?\s*(?:youtube)?\s*頻道\s*(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)\s*(?:留言|評論)?)/g, ' 孩子 youtube 留言 審查 ').replace(/(?:交給|交|轉交|轉給)\s*(?:房仲|仲介|經紀人)/g, ' 房仲 ').replace(/(?:交|留|寄|存|送|印|推|寫|分|賣)?\s*給\s*(小孩|孩子|兒童|幼兒|小童|幼童)/g, ' $1 ').replace(/(?:每天|每日)\s*(?:自動)?\s*(?:列印|印出|打印|印)\s*(?:著色頁|著色本|著色畫|線稿)/g, ' 每天 著色頁 列印 ').replace(/(?:調閱|申請|調|取得|索取)?\s*(?:房屋|屋況)\s*揭露\s*(?:文件|資料|報告|表)?/g, ' 揭露文件 ').replace(/(?:調閱|申請|調|取得|索取)\s*揭露\s*(?:文件|資料|報告|表)?/g, ' 揭露文件 ').replace(/(?:幼兒|幼童|小童|兒童|孩子|小孩)\s*(?:著色|塗色|填色)(?:頁|本|畫)?(?:\s*線稿)?/g, ' 兒童著色 線稿 ').replace(/(?:詢問信|諮詢信|客戶信件|來信)\s*(?:寫入|記進|記錄|登記|整理)?\s*(?:notion)?\s*(?:台帳|清單|表格|表)/g, ' 詢問信 notion 台帳 ').replace(/(?:查|找)\s*(?:google)?\s*(?:行事曆|日曆)?\s*(?:候選)?\s*(?:空檔|時間)\s*(?:回信)?\s*(?:草稿|回覆)/g, ' 行事曆 找空檔 草稿 ').replace(/(?:內網|內部)\s*(?:信件|郵件|公文)\s*(?:交|給)?\s*dots/g, ' dots 內部 郵件 ').replace(/(?:公開)?\s*(?:新聞|情報|資訊)\s*(?:交|給)\s*(?:grok(?:\s*bot)?)/g, ' grok bot 公開 新聞 ').replace(/(?:claude\s*code|t3\s*code|codex|程式代理|代碼代理)\s*(?:停滯|卡住|卡死|超時|逾時)\s*(?:webhook)?/g, ' 程式代理 停滯 webhook ').replace(/ads\s*[- ]?\s*b\s*(?:接收站|接收機)?\s*雙頻\s*(?:輪收)?/g, ' ads-b 接收站 雙頻 ').replace(/(?:1090\s*mhz|978\s*mhz)\s*(?:天線)?\s*(?:量測|量度|測試|對照|量測前後)/g, ' 1090mhz 天線 量測 ').replace(/手動\s*(?:重新)?\s*(?:開啟|啟用)\s*(?:的)?\s*排程\s*(?:被)?\s*(?:關掉|關回|停用)/g, ' 手動 排程 關掉 ').replace(/(?:掌上型|手持)\s*(?:圓屏)?\s*(?:裝置)?\s*(?:經|用)?\s*語音\s*(?:入口|終端)/g, ' 掌上型 語音 終端 ').replace(/(?:跨產品|跨系統)\s*(?:舊|過期|失效)\s*交辦\s*(?:重送|重新發送)?/g, ' 跨產品 過期 任務 重送 ').replace(/(?:智慧|智能)\s*開關\s*(?:分層)?\s*排障/g, ' 開關 排障 ').replace(/(?:未支援|不支援)\s*(?:設備|裝置|家電)\s*(?:配對成功)?\s*(?:不能動|無法動作|無法控制)/g, ' 未支援 設備 排障 ').replace(/網購\s*(?:未送達|沒收到)\s*(?:催退|追查退款|催促退款)\s*(?:入帳)?/g, ' 網購 退款 物流 ').replace(/(?:x|twitter|推特)\s*(?:營運)?\s*(?:發文|貼文)\s*(?:前)?\s*(?:人工)?\s*(?:關卡|閘門|核准)/g, ' x 發文 核准 ').replace(/notion\s*跨代理\s*(?:外聯)?\s*(?:記憶|外部記憶)/g, ' notion 跨代理 外聯 記憶 ').replace(/(?:額度|token)\s*(?:燒太快|不夠用?|用太兇|不夠|消耗過快)/g, ' 額度 用量 ').replace(/分層\s*派工/g, ' 分層 派工 ').replace(/(?:只負責|只做|負責)?\s*(?:調度|派工)\s*(?:重活|繁重工作|執行層)?/g, ' 調度 重活 ').replace(/(?:重活|繁重工作)\s*(?:交給|外置|外包)?\s*(?:雲端電腦|外部代理|免費模型)?/g, ' 重活 雲端電腦 ').replace(/(?:免費|低價|開源|付費|外部)\s*模型\s*(?:代理|保底)?/g, ' 免費模型 代理 ').replace(/外部\s*代理\s*(?:保底|備援)?/g, ' 外部代理 保底 ').replace(/(?:讀|看)\s*(?:你的|我的|自己的)?\s*flomo/g, ' 讀 flomo ').replace(/(?:舊|歷史|過去)\s*筆記\s*(?:回顧|復盤|反思)?/g, ' 舊筆記 回顧 ').replace(/洞察\s*(?:角度|觀點|視角)\s*(?:推送|推播|發送)?/g, ' 洞察角度 推送 ').replace(/(?:推送|推播|發送)\s*(?:一則\s*)?(?:舊筆記|筆記)?\s*(?:回顧|反思)/g, ' 推送 回顧 ').replace(/洞察\s*(?:模板|範本)\s*(?:輪換|輪流|更換)?/g, ' 洞察 模板 輪換 ').replace(/(?:通勤|上下班)?\s*(?:地鐵|捷運|公車|電車)\s*(?:上)?\s*(?:讀|看)(?:筆記)?/g, ' 地鐵 筆記 ').replace(/(?:義大利|歐洲|海外)?\s*(?:網站|電商)?\s*(?:特價|折扣)?\s*攀岩鞋(?:\s*(?:比價|特價|折扣|進口稅|關稅))?(?:\s*(?:省(?:了|約)?\s*(?:[\$\d]+|幾十|數十)?\s*(?:美元|美金|元|塊)?))?/g, ' 義大利 攀岩鞋 特價 比價 ').replace(/攀岩鞋\s*(?:特價|折扣|便宜)/g, ' 攀岩鞋 特價 ').replace(/攀岩鞋\s*(?:進口稅|關稅|稅費|運費)/g, ' 攀岩鞋 進口稅 ').replace(/(?:饒舌|rap|說唱)\s*(?:講解|說明|教學)?\s*(?:影片|視頻)/g, ' 饒舌 講解 影片 ').replace(/(?:押韻|押韻的)?\s*歌詞\s*(?:樣片|demo)?/g, ' 押韻 歌詞 樣片 ').replace(/(?:vpn)?\s*tun\s*模式/g, ' vpn tun 模式 ').replace(/用量\s*(?:csv|報表|數據)\s*(?:分析|匯出)?/g, ' 用量 csv 分析 ').replace(/用量\s*(?:事件|明細)\s*表/g, ' 用量 事件表 ').replace(/收尾\s*(?:回報|總結|報告)\s*(?:用量)?/g, ' 收尾 回報 用量 ').replace(/(?:回收|二手|循環)\s*門號(?:\s*(?:前持有人|前主人|原持有人))?/g, ' 回收門號 前持有人 ').replace(/(?:收到|接到)?\s*前持有人\s*(?:的)?\s*(?:簡訊|訊息|電話|通知)/g, ' 前持有人 訊息 ').replace(/(?:門號|號碼)\s*(?:仲介站|資料仲介|經紀站)\s*(?:列名|資料)?/g, ' 門號 仲介站 列名 ').replace(/(?:門號|電信)?\s*客服\s*(?:聊天|對話)\s*(?:送不出|發不出|卡住)/g, ' 門號 客服聊天 送不出 ').replace(/([\u4e00-\u9fa5]{2,})(?:與|和|及|跟)([\u4e00-\u9fa5]{2,})/g, ' $1 $2 ').replace(/(?:^|\s+)(?:與|和|及|跟)(?:\s+|$)/g, ' ').replace(/(?:^|\s+)(?:與|和|及|跟)(?=[\u4e00-\u9fa5]{2,})/g, ' ').replace(/([\u4e00-\u9fa5]{2,})(?:與|和|及|跟)(?:\s+|$)/g, '$1 ').replace(/\ba\s*[/_-]?\s*b\s*[- ]\s*tests?(?:ing)?\b/gi, ' ab-test ').replace(/\ba\s*[/_-]?\s*b\s*(?:測試|試驗|檢定)/g, ' ab-test ').replace(/\bab\s*(?:測試|試驗)/g, ' ab-test ').replace(/前後\s*(?:對照|比較)/g, ' ab-test ').replace(/\bre\s*[- ]\s*(?:starts?|boots?)(?:ing)?\b/gi, ' restart ').replace(/(?:已)?\s*封存\s*(?:任務|工作)?\s*(?:收到新交辦後)?\s*(?:被)?\s*(?:重新)?\s*啟動/g, ' 封存 任務 啟動 ').replace(/(?:被)?\s*重新\s*(?:啟動|開啟|拉起)/g, ' 重新啟動 ').replace(/多代理\s*(?:對話鏈)?\s*重啟/g, ' 多代理 重啟 ').replace(/對話鏈\s*重啟/g, ' 對話鏈 重啟 ').replace(/排程\s*(?:被)?\s*(?:舊|過時|過期)\s*(?:指示|約定|規則)\s*(?:關掉|關閉|停用)/g, ' 手動 排程 關掉 過期 指示 ').replace(/(?:舊|過時|過期)\s*(?:指示|約定|規則)\s*(?:關掉|關閉|停用)/g, ' 過期 指示 關掉 ').replace(/(模型輸出|工具回應|工具實際回應|分開儲存|分存)\s*(?:驗收|查驗)/g, ' $1 驗收 ').replace(/分開\s*儲存/g, ' 分開儲存 ').replace(/(?:客廳|常亮|待機)?\s*螢幕\s*(?:顯示|查看|看|查)\s*(?:女兒|孩子|小孩|學生)?\s*成績/g, ' 客廳 電視 常亮 看板 成績 ').replace(/客廳\s*(?:常亮)?\s*螢幕/g, ' 客廳 電視 常亮 看板 ').replace(/(?:兒童|小孩|孩子)\s*(?:影片|視頻)/g, ' 兒童 影片 ').replace(/(?:詢問信|諮詢信|客戶信件)\s*(?:受理表|台帳|清單)/g, ' 詢問信 台帳 ').replace(/(?:客戶\s*來信|客戶|來信)\s*(?:想約|約)?\s*(?:時間|會面|會議)?\s*(?:存|寫|擬)?\s*(?:gmail)?\s*(?:回信|草稿|回覆)+/g, ' 客戶 來信 草稿 ').replace(/分流\s*(?:處理|機制)/g, ' 分流 ').replace(/雲端電腦\s*(?:跑|執行|運行)/g, ' 雲端電腦 ').replace(/(?:每日|每天)\s*筆記\s*(?:回顧|反思)?/g, ' 每日 筆記 回顧 ').replace(/筆記\s*洞察/g, ' 筆記 洞察 ').replace(/筆記\s*回顧/g, ' 筆記 回顧 ').replace(/模板\s*輪換/g, ' 模板 輪換 ').replace(/vpn\s*(?:tun\s*模式)?\s*(?:連線排障|連線錯誤|連線|排障|除錯)/g, ' vpn 連線錯誤 ').replace(/(?:連線|網絡連線|網路連線)\s*(?:被關閉|中斷|被拒|失敗|排障|錯誤)/g, ' 連線錯誤 ').replace(/(?:義大利|歐洲|海外)\s*(?:網站|電商)?\s*(?:特價|折扣|比價)/g, ' 義大利 特價 比價 ').replace(/進口\s*關稅/g, ' 進口關稅 ').replace(/(?:前號主|原號主|舊號主|前持有人|原持有人)\s*(?:的)?\s*(?:簡訊|短信|訊息|通知)/g, ' 前持有人 簡訊 ').replace(/(?:主\s*bot|主代理)\s*(?:分析|核算)\s*(?:用量|消耗|額度)/g, ' 主 bot 分析 用量 ').replace(/分析\s*(?:用量|消耗|額度)/g, ' 分析 用量 ').replace(/(?:長工作|長對話)\s*(?:撞到?|碰|達到)?\s*(?:上下文)?\s*上限/g, ' 長工作 context-window ').replace(/(?:精簡|簡化)\s*(?:排程|例行任務)/g, ' 精簡 排程 ').replace(/(?:沒變化|無變化|無變動|沒變動)\s*(?:就)?\s*(?:不送|不發|不通知|不推送|不回報)/g, ' 沒變化 不送 ').replace(/flomo\s*(?:每日|每天)?\s*(?:兩次)?\s*(?:ai)?\s*洞察/g, ' flomo 每日 洞察 ').replace(/flomo\s*筆記\s*(?:模板)?\s*輪換/g, ' flomo 筆記 模板 輪換 ').replace(/(?:道路)?\s*救援\s*(?:德文|德語)\s*(?:申請表|表單)/g, ' 德文 救援 表單 ').replace(/(?:德文|德語)\s*(?:道路)?\s*救援(?:\s*(?:申請表|表單))?/g, ' 德文 救援 表單 ').replace(/(?:常亮|待機)?\s*螢幕\s*(?:顯示|看|查)\s*(?:女兒|孩子|小孩)?\s*(?:缺交)?\s*作業/g, ' 電視 常亮 看板 缺交作業 ').replace(/電視\s*首頁\s*(?:看|查|顯示)?\s*(?:女兒|孩子)?\s*成績/g, ' 電視 常亮 看板 成績 ').replace(/(?:買房|看房|找房)\s*(?:找)?\s*房仲\s*(?:調|調閱|取得)?\s*揭露(?:\s*文件)?/g, ' 買房 房仲 揭露文件 ').replace(/notion\s*(?:受理表|台帳)\s*(?:存|寫|擬)?\s*(?:回信)?\s*(?:草稿|回覆)/g, ' notion 台帳 草稿 ').replace(/詢問信\s*(?:找|查)?\s*(?:空檔|時間)\s*(?:回信|回覆)?/g, ' 詢問信 行事曆 找空檔 草稿 ').replace(/內外\s*(?:情報|資訊|新聞)?\s*(?:分流|分工|分派)?/g, ' 內部 公開 分流 ').replace(/(?:反爬蟲|爬蟲被擋|防爬|反爬|擋爬蟲|擋代理|擋機器人)/g, ' 反爬蟲 ').replace(/(?:suno|ai)?\s*(?:生成音樂|音樂生成|配樂生成|自動配樂)/g, ' suno 音樂生成 ').replace(/(俄文|俄語|日文|日語|中文|英文|德文|德語|西文|法文|韓文)\s*作者/g, ' $1 作者 ').replace(/(?:啟動|重新啟動)\s*(?:已)?\s*封存(?:\s*(?:任務|工作))?/g, ' 啟動 封存 任務 ').replace(/(?:小孩|孩子|兒童)\s*(?:早上|早晨|清晨)/g, ' 孩子 早上 ').replace(/(?:早上|早晨|清晨)\s*(?:自動)?\s*(?:各)?\s*(?:列印|印出|打印|印)/g, ' 早上 列印 ').replace(/(?:列印|印出|打印|印)\s*(?:著色頁|著色本|著色畫|線稿)/g, ' 列印 著色頁 ').replace(/(?:德文|德語)\s*保險/g, ' 德文 保險 ').replace(/(?:德文|德語)\s*(?:保險)?\s*(?:救援)?\s*(?:申請表|表單)/g, ' 德文 保險 救援 表單 ').replace(/保險\s*(?:道路)?\s*救援/g, ' 保險 道路救援 ').replace(/(?:找|叫|聯絡)?\s*(?:拖吊|拖車)/g, ' 拖吊 ').replace(/(?:修車|車輛救援|保險救援)\s*(?:申請表|表單)/g, ' 救援 表單 ').replace(/(?:自製)?\s*(?:電視|tv)\s*(?:首頁|待機首頁)/g, ' 電視 首頁 ').replace(/(?:首頁|看板)\s*(?:查|看|顯示)?\s*(?:缺交)?\s*作業/g, ' 首頁 缺交作業 ').replace(/(?:女兒|孩子|小孩)?\s*(?:各科)?\s*成績\s*(?:看板|顯示)/g, ' 成績 看板 ').replace(/(?:各科)?\s*成績/g, ' 成績 ').replace(/(?:出發|出門)\s*(?:前)?\s*(?:充電|充飽電|充滿電|充滿|充到滿|滿充|充飽)/g, ' 出發 充電 ').replace(/(?:出發|出門)\s*前/g, ' 出發 ').replace(/(?:充飽電|充滿電|充滿|充到滿|滿充|充飽)/g, ' 充電 ').replace(/安全性?\s*(?:審查|巡檢|審核|檢查)/g, ' 安全 審查 ').replace(/(?:房屋|買房|交屋)?\s*(?:前後)?\s*(?:整修|修繕|維護)\s*(?:費用|成本|費)(?:\s*(?:預估|估算|評估|預計))?/g, ' 買房 整修 費用 ').replace(/買房\s*(?:找)?\s*物件/g, ' 買房 找房 ').replace(/(?:詢問信|諮詢信|客戶信件|來信)\s*(?:記進|寫入|登記|登錄|記錄|存入)/g, ' 詢問信 ').replace(/notion\s*(?:受理表|台帳|表格|清單|表)/g, ' notion 受理表 ').replace(/(?:資料|資訊)\s*分級(?:\s*(?:晨報|日報|報告))?/g, ' 資料分級 晨報 ').replace(/(?:備援|備用|付費)?\s*保底/g, ' 保底 ').replace(/分層\s*派工(?:\s*省額度)?/g, ' 分層 派工 額度 ').replace(/筆記\s*反思(?:\s*對話)?/g, ' 筆記 反思 對話 ').replace(/(?:含|加上|計入|算入)?\s*(?:進口關稅|進口稅|關稅|稅費)/g, ' 進口關稅 ').replace(/連線錯誤\s*(?:排障|除錯|排錯|修復)/g, ' 連線錯誤 排障 ').replace(/(?:小朋友|小孩|孩子|兒童)\s*(?:頻道)?\s*(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)?\s*留言(?:\s*安全性?)?/g, ' 孩子 youtube 留言 審查 安全 ').replace(/(?:每天|每日)\s*定時\s*(?:列印|印出|打印|印)/g, ' 每天 定時 列印 ').replace(/(?:交給|交|轉交|轉給|交接給)\s*(?:房仲|仲介|經紀人)/g, ' 交接 房仲 ').replace(/(?:詢問信|諮詢信|客戶信件|來信)\s*(?:自動)?\s*(?:記進|寫入|登記|登錄|記錄|存入)/g, ' 詢問信 ').replace(/(?:notion\s*)?(?:受理表|台帳)\s*(?:擬|寫|存|儲存)?\s*(?:回信)?\s*(?:草稿|回覆)/g, ' notion 台帳 草稿 ').replace(/(?:行事曆|日曆)\s*(?:回信)?\s*(?:草稿|回覆)/g, ' 日曆 草稿 ').replace(/(?:grok\s*bot|bot)?\s*(?:抓|收)\s*新聞/g, ' grok bot 新聞 ').replace(/(?:每天|每日)\s*(?:早上|早晨)?\s*(?:推(?!薦)|發送|推送)(?:一則)?/g, ' 每天 早上 推送 ').replace(/雙頻\s*(?:輪收)?\s*(?:天線)?\s*(?:量測|測量)/g, ' 雙頻 天線 量測 ').replace(/雙頻\s*解碼/g, ' 雙頻 解碼 ').replace(/手動\s*(?:重新)?\s*(?:重開|啟動|開啟|啟用)\s*(?:的)?\s*排程\s*(?:被)?\s*(?:關閉|關掉|關回|停用)/g, ' 手動 排程 關掉 ').replace(/(?:掌上型|手持)\s*(?:終端)?\s*語音\s*(?:助手|終端)/g, ' 掌上型 語音 終端 助手 ').replace(/(?:每日|每天)\s*隨機\s*(?:挑|選)?\s*(?:不重複)?\s*(?:參考照|照片|相片)?\s*(?:換臉|替換臉)/g, ' 每日 隨機 參考照 換臉 ').replace(/工時表\s*(?:對帳|核帳|核算)/g, ' 工時 對帳 ').replace(/對發薪日薪水/g, ' 發薪 薪水 ').replace(/(?:跨產品|跨系統)\s*(?:舊|過時|過期|失效)\s*交辦/g, ' 跨產品 過期 任務 重送 ').replace(/(?:新|舊)?\s*(?:新有授權|新授權|有授權)\s*交辦/g, ' 交辦 任務 ').replace(/(?:找|聯絡)?\s*房仲\s*(?:調|調閱)?\s*(?:屋況說明書|屋況|不動產說明書)/g, ' 房仲 揭露文件 ').replace(/翻新\s*費用\s*預算(?:\s*上限)?/g, ' 翻新 費用 預算 ').replace(/(?:兩張|一張|一份)\s*(?:填色本|著色頁|著色本|著色畫|線稿)/g, ' 著色頁 ').replace(/(?:優質|好)?\s*學區/g, ' 學區 ').replace(/小朋友/g, ' 小孩 ').replace(/粗線條/g, ' 粗線條 ').replace(/(?:匯出|導出)(?:\s*給)?/g, ' 匯出 ').replace(/(?:仲介站|資料仲介|經紀站)\s*(?:列名|資料)?(?:\s*(?:被擋|被封|被拒))?/g, ' 仲介站 列名 反爬蟲 ').replace(/(?:私有)?\s*git\s*(?:任務檔|任務單|任務)?\s*(?:交接|交辦)/g, ' 私有 git 任務 交接 ').replace(/(?:雲端)?\s*(?:不對|不讓|禁止|不傳|不能)\s*(?:本機|本地|自己電腦|你的電腦)?\s*(?:下|直接下|傳|發)?\s*(?:命令|指令)/g, ' 雲端 本機 命令 ').replace(/(?:私有)?\s*(?:git)?\s*倉庫\s*(?:放|存|列|管)?\s*(?:任務單|任務檔|任務)/g, ' 私有 倉庫 任務 ').replace(/(?:不讓|禁止|避免)\s*雲端\s*(?:直接)?\s*(?:控制|遠端控制|操作)\s*(?:電腦|本機|本地)/g, ' 雲端 控制 電腦 ').replace(/(?:mac)?\s*launchd\s*(?:計時器)?\s*(?:拉取|拉檔|抓取)?\s*(?:任務)?/g, ' mac launchd 計時器 拉取 任務 ').replace(/跨代理\s*(?:任務)?\s*(?:交接|交辦)\s*(?:權限)?\s*(?:隔離|邊界)/g, ' 跨代理 任務 交接 權限 隔離 ').replace(/agent\s*relay\s*(?:私有)?\s*(?:倉庫|repo)?/g, ' agent relay 私有 倉庫 ').replace(/任務檔\s*(?:交接|交辦)/g, ' 任務 交接 ').replace(/(?:每天|每日)\s*(?:早上|早晨)?\s*(?:從)?\s*書籤\s*(?:挑|選)?\s*(?:一個)?\s*(?:點子)?\s*(?:做|做成|製作)?\s*demo/g, ' 每天 書籤 點子 demo ').replace(/書籤\s*(?:做成|轉成|做)?\s*(?:可)?\s*互動\s*(?:網頁)?\s*(?:小實驗|demo)?/g, ' 書籤 互動 網頁 小實驗 ').replace(/(?:每日|每天)\s*書籤\s*(?:可)?\s*互動\s*demo/g, ' 每日 書籤 互動 demo ').replace(/量子漣漪槽\s*(?:小實驗|demo)?/g, ' 量子漣漪槽 小實驗 ').replace(/瀏覽器\s*(?:實測|測試|檢查)\s*(?:後)?\s*(?:部署|發布|上線)\s*cloudflare/g, ' 瀏覽器 實測 部署 cloudflare ').replace(/(?:每天|每日)\s*(?:挑|選)\s*(?:一則|一個)\s*書籤\s*(?:做)?\s*(?:小實驗|demo)/g, ' 每天 書籤 小實驗 ').replace(/(?:x|推特|twitter)\s*發文\s*教練\s*bot/g, ' x 發文 教練 bot ').replace(/(?:督促|督導)\s*(?:在\s*x\s*)?(?:發|寫)?\s*原創\s*(?:內容)?\s*(?:的)?\s*教練/g, ' 督促 原創 教練 ').replace(/(?:每天|每日)\s*(?:盤點)?\s*原創\s*(?:與|和)?\s*轉發/g, ' 每天 盤點 原創 轉發 ').replace(/bot\s*(?:當|做)?\s*教練\s*(?:給)?\s*(?:明天|隔天)?\s*(?:的)?\s*(?:具體)?\s*功課/g, ' bot 教練 功課 ').replace(/轉發機器\s*(?:社群)?\s*教練/g, ' 轉發機器 社群 教練 ').replace(/(?:兩週|2週)\s*(?:社群)?\s*(?:發文)?\s*數據\s*(?:檢討|分析|復盤)/g, ' 兩週 數據 檢討 ').replace(/付費\s*(?:訂閱)?\s*文章\s*(?:用)?\s*瀏覽器\s*(?:側欄|側邊欄)\s*(?:送給|交給)?\s*bot/g, ' 付費 文章 瀏覽器 側欄 bot ').replace(/付費\s*訂閱\s*文章\s*(?:對照|比對)\s*(?:自己的)?\s*持股\s*(?:清單)?/g, ' 付費 訂閱 文章 對照 持股 清單 ').replace(/grok\s*bot\s*clipper\s*(?:剪藏)?/g, ' grok bot clipper 剪藏 ').replace(/付費\s*(?:投資)?\s*電子報\s*(?:投資組合|持股)?\s*(?:對照|比對)/g, ' 付費 電子報 投資組合 對照 ').replace(/瀏覽器\s*(?:擴充|外掛)\s*(?:剪藏|擷取)\s*付費\s*文章/g, ' 瀏覽器 擴充 剪藏 付費 文章 ').replace(/substack\s*付費\s*文章\s*(?:摘要|研究)?/g, ' substack 付費 文章 摘要 ').replace(/獨角獸/g, ' 獨角獸 ').replace(/小仙子/g, ' 小仙子 ').replace(/城堡/g, ' 城堡 ').replace(/滿充電/g, ' 充電 ').replace(/(?:出發|出門)?\s*(?:後)?\s*(?:自動)?\s*(?:改回|還原|復原)/g, ' 自動還原 ').replace(/(?:旅行|出遊|出差)\s*充電\s*(?:排程)?/g, ' 長途 充電 排程 ').replace(/充電\s*排程/g, ' 充電 排程 ').replace(/(?:coding[- ]agent|程式代理|代碼代理|編程代理)\s*(?:逾時|超時)/g, ' coding-agent 停滯 ').replace(/(?:未回報|沒回報)\s*(?:通知)?/g, ' 通知 ').replace(/(?:顯示|查看|看|查)?\s*(?:孩子|小孩|女兒|學生)?\s*(?:各科)?\s*(?:成績|分數|等第)/g, ' 成績 ').replace(/各科分數/g, ' 成績 ').replace(/(?:缺交)?\s*(?:功課|作業)/g, ' 缺交作業 ').replace(/(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)\s*(?:留言|評論|內容)?/g, ' 留言 審查 ').replace(/不良評論/g, ' 留言 審查 ').replace(/自動巡檢/g, ' 巡檢 ').replace(/房仲\s*(?:揭露文件|揭露|文件)/g, ' 房仲 揭露文件 ').replace(/(?:房屋|交屋)?\s*(?:翻新|整修|裝修)\s*(?:費用|成本)?/g, ' 整修 費用 ').replace(/(?:估算|預估|評估)\s*上限/g, ' 預算 上限 ').replace(/官網\s*(?:詢問信|諮詢信|客戶信件|來信)?/g, ' 詢問信 ').replace(/記進\s*(?:notion)?\s*(?:受理表|台帳)?/g, ' notion 受理表 ').replace(/擬\s*(?:回信)?\s*(?:草稿|回覆)/g, ' 草稿 ').replace(/內網穿透/g, ' 內網穿透 ').replace(/(?:dots|grok\s*bot|bot)?\s*(?:讀|看|查|收|抓)?\s*(?:內網|內部\s*(?:信件|郵件|公文|行程|資料))(?!穿透)/g, ' dots 內部 郵件 ').replace(/(?:grok\s*bot|bot|dots)?\s*(?:讀|看|查|收|抓|整理)?\s*(?:外網|外部\s*(?:新聞|情報|資訊|貼文|資料)|公開\s*(?:新聞|情報|資訊|貼文|資料))/g, ' grok bot 公開 新聞 ').replace(/(?:重活|繁重工作)\s*(?:交給|交|外置|外包)?\s*(?:雲端電腦|外部代理|免費模型)?/g, ' 重活 雲端電腦 ').replace(/(?:交給|交|外置|外包)\s*(?:雲端電腦|外部代理|免費模型)/g, ' 雲端電腦 ').replace(/(?:做不好|搞不定|失敗)\s*(?:再)?\s*(?:降級|改用|換成)?/g, ' 做不好 降級 ').replace(/(?:地鐵|捷運|公車|電車)\s*(?:通勤)?\s*(?:上)?\s*(?:讀|看)?/g, ' 地鐵 ').replace(/(?:通勤)?\s*(?:地鐵|捷運|公車|電車)\s*(?:上)?\s*(?:讀|看)?/g, ' 地鐵 ').replace(/捷運/g, ' 地鐵 ').replace(/(?:塗色|著色|線稿)\s*(?:自動)?\s*(?:印出|印製|列印|打印|印出來|印(?!表[機台器]))/g, " 著色 線稿 列印 ").replace(/(?:黑白)?\s*(?:塗色頁|著色頁|線稿)\s*印表機/g, " 著色 線稿 印表機 ").replace(/(?:黑白)?\s*(?:塗色頁|著色頁|線稿)\s*(?:印出|列印)/g, " 著色 線稿 列印 ").replace(/(?:卡住|停滯|未回報|超時|逾時)\s*(?:提醒|通知|告警)/g, " 卡住 通知 ").replace(/(?:找房|買房|看房)\s*(?:估算|預估|評估)/g, " 買房 預估 ").replace(/(?:預算|費用|金額)\s*(?:上限|封頂)/g, " 預算 上限 ").replace(/(?:官網|網站)\s*(?:詢問信|諮詢信|來信|客戶來信)/g, " 詢問信 ").replace(/受理\s*(?:登記|記錄|記進|登錄)/g, " 受理 登記 ").replace(/(?:受理|接單|登記|記進)\s*(?:台帳|登記表|受理表|表格|清單|notion)/g, " 受理 台帳 ").replace(/(?:內外|內部外部|內外部)\s*(?:資料|情報|資訊)/g, " 內網 外網 ").replace(/資料\s*(?:分工|分派|分流)/g, " 資料 分工 ").replace(/(?:舊筆記|flomo筆記|筆記)\s*(?:輪換|不同)\s*(?:角度|視角)?/g, " 舊筆記 輪換 角度 ").replace(/(?:輪換|不同)\s*(?:角度|視角)\s*(?:推送|回顧|推播|反思)?/g, " 輪換 角度 推送 ").replace(/(?:防|防止|避免|不讓)\s*(?:遠端)?\s*控制/g, " 避免 控制 ").replace(/(?:可)?\s*互動\s*(?:展示|demo|網頁)/g, " 互動 demo 網頁 ").replace(/(?:展示|demo)\s*(?:網頁|頁面|作品)/g, " demo 網頁 ").replace(/(?:x|推特|社群)\s*發文\s*教練/g, " 發文 教練 ").replace(/發文\s*教練/g, " 發文 教練 ").replace(/(?:社群)?\s*發文\s*數據\s*(?:檢討|分析|復盤)?\s*(?:教練)?/g, " 發文 數據 檢討 教練 ").replace(/(?:每日|每天)\s*盤點/g, " 每日 盤點 ").replace(/(?:付費|訂閱)\s*文章\s*(?:剪藏|擷取)/g, " 付費 文章 剪藏 ").replace(/(?:瀏覽器)?\s*側欄\s*(?:剪藏|擷取)/g, " 側欄 剪藏 ").replace(/(?:文章|內容)?\s*(?:對照|比對)\s*(?:自己的)?\s*持股\s*(?:清單|組合)?/g, " 對照 持股 ").replace(/(?:剪藏|正文|文章)\s*(?:送給|交給|丟給|傳給)\s*bot/g, " 剪藏 bot ").replace(/(?:substack|電子報)\s*文章/g, " substack 文章 ").replace(/(?:跑完|做完|結束|完畢|停滯|卡住)\s*(?:通知|提醒|webhook)/g, " 程式代理 工作階段 webhook 通知 ").replace(/(?:特斯拉|tesla)?\s*(?:出遠門|長途旅行|遠門)\s*(?:前)?\s*(?:充電|充飽電|充飽|充滿)/g, " 特斯拉 出發 充電 ").replace(/(?:客戶\s*來信|客戶|來信)\s*(?:查|找)?\s*(?:日曆|行事曆)\s*(?:擬|寫|存)?\s*(?:草稿|回覆|回信)/g, " 詢問信 行事曆 草稿 ").replace(/(?:節省|省|省下)\s*(?:額度|token|費用|成本)/g, " 節省 額度 ").replace(/(?:私有)?\s*(?:git)?\s*倉庫\s*(?:交接|交辦)/g, " 私有倉庫 任務交接 ").replace(/(?:x|推特|twitter)?\s*(?:收藏|書籤)\s*(?:做成?|轉成?|做)?\s*(?:可)?\s*互動\s*(?:網頁)?/g, " 書籤 互動 網頁 ").replace(/(?:做|製作)?\s*小\s*demo/g, " demo ").replace(/(?:每天|每日)\s*(?:一則|一個)\s*(?:小實驗|demo)/g, " 每天 demo ").replace(/(?:x|推特|twitter|社群)\s*發文\s*(?:復盤|檢討|分析)/g, " 發文 數據 檢討 ").replace(/(?:社群|發文)\s*教練/g, " 發文 教練 ").replace(/(?:每日|每天)\s*(?:檢討|盤點)\s*原創/g, " 每天 盤點 原創 ").replace(/(?:持股清單|投資組合|持股)\s*(?:對照|比對|查核)/g, " 持股清單 對照 ").replace(/(?:側邊欄|側欄)\s*(?:剪藏|擷取)/g, " 側欄 剪藏 ").replace(/(?:瀏覽器)?\s*(?:外掛|擴充)\s*(?:剪藏|擷取)/g, " 外掛 剪藏 ").replace(/投資組合\s*(?:對照|比對)/g, " 持股清單 對照 ").replace(/[「」『』“”"'《》〈〉【】〔〕［］\[\]()（）?？!！~～:：·•…#。]+/g, ' ').replace(/(?:^|\s)\.+|\.+(?:\s|$)/g, ' ').replace(/(?:^|\s)-+|-+(?:\s|$)/g, ' ').split(/[\s,、，/／;；|｜+＋&＆]+/).filter(Boolean);
const SYNONYM_GROUPS = [
  ['矛盾', '衝突', '不一致', 'contradiction', 'contradictions', 'conflict', 'conflicts', 'inconsistent', 'inconsistency'],
  ['acceptance', 'acceptance-criteria', 'acceptance-test', '驗收', '驗收標準', '驗收條件', '驗收測試', '驗收規範'],
  ['agent', 'agents', 'agentic', '智能體', '智能体', '代理'],
  ['每日報表', '每日報告', '日報', '晨報', '早報', 'morning-brief', 'morning brief', 'daily'],
  ['儀錶板', '儀表板', 'dashboard', 'dashboards', '看板'],
  ['折價券', '優惠券'],
  ['賬單', '帳單', 'bill', 'bills', 'billing', '漲價', '調高帳單', '調漲', 't-mobile'],
  ['記賬', '記帳'],
  ['登錄', '登入', 'login', 'signin'],
  ['簡報', '投影片', 'ppt', 'powerpoint'],
  ['爬蟲', '抓取', '採集', '爬取', 'scrape', 'scraping', 'crawler', 'crawlers', 'scraper', 'scrapers'],
  ['試算表', 'excel', 'sheets', 'spreadsheet', 'spreadsheets', 'csv'],
  ['逐字稿', '轉錄', '錄音', '聽打', 'transcription', 'transcribe', 'whisper', 'stt', 'speech to text', 'speech-to-text', '語音轉文字', '語音識別', '語音辨識'],
  ['資料庫', '數據庫', 'database', 'databases', 'sql', '数据库'],
  ['行事曆', '日曆', 'calendar', 'calendars'],
  ['待辦', '代辦', 'todo', 'todos', 'todoist', 'task', 'tasks'],
  ['報帳', '核銷', '對帳', '對賬', '核帳', '核賬', '報銷', '報賬', 'reconciliation', 'reconciliations', 'reconcile', 'reconciling', 'reimbursement'],
  ['發票', '收據', '憑證', 'invoice', 'invoices', 'receipt', 'receipts'],
  ['debug', 'debugging', '除錯', '排錯', '修復', 'bug', 'bugs', '故障', '排障', 'troubleshoot', 'troubleshooting', 'fault', 'faults'],
  ['workflow', 'workflows', '工作流', '自動化', 'automation', 'automate', 'automations', '排程', '定時', 'cron', 'schedule', 'schedules', 'scheduling', 'scheduler', 'schedulers', '排程器', '定時器', '排班', '流水線', '管線', 'pipeline', 'pipelines'],
  ['求職', '履歷', '面試', '招聘', '招募', 'cv', 'resume', 'resumes', 'job', 'jobs', 'hiring', 'interview', 'interviews'],
  ['email', 'emails', 'mail', 'mailbox', 'mailboxes', '郵件', '信件', '信箱', '收件匣', '收件箱', 'inbox'],
  ['代碼', '程式碼', '程式', 'code', 'codes', 'coding'],
  ['ticket', 'tickets', '工單', '工單系統', 'workorder', 'workorders', '客服', 'support', '客訴', '投訴', 'jira', 'zendesk'],
  ['飯店', '旅館', '住宿', 'hotel', 'hotels'],
  ['多代理', 'multi-agent', 'multi-agents', 'multiagent', '多agent', '跨代理', '代理協作', 'cross-agent', '多智能體', '多智能体'],
  ['備份', 'backup', 'backups', '還原', '復原', 'restore', '回滾', 'rollback', 'rollbacks', 'revert', 'reverting', '回退', '自動還原', 'auto-revert'],
  ['監看', '監控', '監測', '巡檢', 'monitor', 'monitoring'],
  ['週報', 'weekly', '每週報告', '週報表'],
  ['健康', '醫療', 'health', '健檢'],
  ['電話', '通話', 'call', 'calls'],
  ['資安', '安全性', '安全', '網路安全', '資訊安全', 'security', 'cybersecurity', '漏洞', 'vulnerability', 'vulnerabilities'],
  ['隱私', 'privacy'],
  ['旅遊', '旅行', 'travel'],
  ['比價', '比价', '折扣', '降價', '特價', '特賣', '促銷', '省錢'],
  ['會議', '開會', 'meeting', 'meetings', '會議記錄', '會議紀錄', '會議紀要', '開會紀錄', 'minutes'],
  ['提醒', '通知', 'alert', 'alerts', 'alerting', 'notification', 'notifications', 'notify', '推播', '告警', '警報'],
  ['退款', '退貨', 'refund', 'refunds'],
  ['播客', 'podcast'],
  ['智慧家庭', '智能家居', '智能家庭', '智慧家電', 'iot', '物聯網'],
  ['ocr', '文字辨識', '圖片辨識', '光學字元辨識', '影像辨識', '辨識', '識別', 'recognition'],
  ['翻譯', 'translate', 'translation', '翻成中文', '譯文'],
  ['摘要', '總結', 'summary', 'summarize', '重點整理'],
  ['影片', '視頻', 'video', 'videos', '剪輯', '短影音', '短片'],
  ['圖片', '相片', '照片', 'image', 'images', 'photo', 'photos'],
  ['筆記', 'notes', '筆記本', '筆記軟體', 'pkm', 'flomo', 'memo', 'memos', '備忘錄', '舊筆記'],
  ['推特', 'twitter', 'x'],
  ['rag', '知識庫', '知识库', 'knowledgebase', '檢索', 'retrieval', '向量', '嵌入', 'vector', 'vectors', 'embedding', 'embeddings', '檢索增強', 'retrieval augmented generation', 'vectordb', '向量資料庫', '向量數據庫', '向量庫', 'hybrid-search', 'hybrid search', '混合檢索', 'semantic-search', 'semantic search', '語意搜尋', '語義搜索', '語意檢索', '語義檢索', 'vector-search', 'vector search', '向量檢索', '向量搜尋', '向量搜索'],
  ['語音', '音訊', '音頻', '聲音', 'voice', 'audio'],
  ['自動回覆', '自動回信', 'auto-reply', '自動回覆買家'],
  ['測試', 'qa', 'test', 'tests', 'testing', '回歸', 'regression'],
  ['審查', '審核', 'review', 'reviewing', 'reviewer', 'reviewers', 'audit', '稽核', '審計', '稽查', '巡檢', '清理', '過濾'],
  ['物流', '快遞', '包裹', '運送', '配送', 'shipping', 'delivery'],
  ['社群', '社交媒體', 'sns'],
  ['發文', '貼文', '發帖', 'post'],
  ['外聯', '外呼', 'outreach', '開發信', '拓客', '獲客'],
  ['客戶', '顧客', '用戶', 'client', 'clients', 'customer', 'customers'],
  ['記憶', '長期記憶', '短期記憶', '工作記憶', '外部記憶', '共用記憶', '共享記憶', '可見記憶', '持久記憶', 'memory', 'memories', '記憶庫'],
  ['提示詞', 'prompt', 'prompts', 'prompting', '提示語', '提示', 'system-prompt', 'system prompt', 'system prompts', 'system instructions', '系統提示詞', '系統提示', '系統指令', '系統設定詞'],
  ['核准', '審批', '簽核', 'approval', 'approvals', 'approve', '人工確認', '人工核准'],
  ['網購', '電商', '購物', 'ecommerce', 'shopping'],
  ['合約', '合同', 'contract', 'contracts', '協議', 'agreement', 'agreements'],
  ['薪資', '薪水', '薪酬', 'payroll', 'salary', 'paycheck', 'paychecks', '薪資單', '薪資條', '工資', '發薪', '薪資發放', '發放薪資'],
  ['設備', '裝置', 'device', 'devices', '硬體', 'hardware'],
  ['合規', 'compliance', '法規', '規章'],
  ['部署', 'deploy', 'deployment', 'deployments'],
  ['同步', 'sync', 'synchronization'],
  ['圖表', 'chart', '圖表分析', '趨勢圖'],
  ['搜尋', '搜索', 'search'],
  ['權限', '授權', 'permission', 'permissions', 'authorization', 'auth', 'access', 'privilege', 'privileges'],
  ['庫存', '存貨', 'inventory', 'stock'],
  ['報價', '估價', 'quote', 'quotation'],
  ['快取', '緩存', 'cache', 'caches', 'caching'],
  ['介面', '接口', 'interface', 'api', 'apis', '端點', 'endpoint', 'endpoints'],
  ['重試', '重跑', 'retry', 'retries', 'retrying', 'backoff', 'exponential backoff', '指數退避', '退避', '重試機制', '退避重試'],
  ['驗證', '核實', '查核', 'verify', 'verification', 'validate', 'validation'],
  ['訂閱', '訂閱制', 'subscription', 'subscriptions'],
  ['外掛', '擴充', '擴充功能', '插件', 'plugin', 'plugins', 'extension', 'extensions'],
  ['預算', '編列預算', 'budget', 'budgeting'],
  ['日誌', '日誌記錄', 'log', 'logs', 'logging'],
  ['附件', 'attachment', 'attachments'],
  ['觸發', '觸發器', 'trigger', 'triggers'],
  ['憑證', '密鑰', '金鑰', '密碼', '權杖', '令牌', 'credential', 'credentials', 'token', 'tokens', 'secret', 'secrets', 'password', 'passwords', 'apikey', 'apikeys'],
  ['模板', '範本', '模版', 'template', 'templates'],
  ['異常', 'anomaly', 'anomalies', 'exception', 'exceptions', '異常檢測', '異常排查'],
  ['webhook', 'webhooks', 'callback', 'callbacks', '回呼', '回調'],
  ['行銷', '廣告', 'marketing', 'advertising', 'ads', '投放', '推廣'],
  ['採購', '招標', 'procurement', 'purchasing', 'sourcing', '供應商', 'vendor', 'vendors'],
  ['表單', '問卷', '調查', 'form', 'forms', 'survey', 'surveys', 'questionnaire'],
  ['llm', 'llms', '大型語言模型', '大語言模型', '大模型', '語言模型'],
  ['比對', '對照', '核對', '差異', '對比', 'diff', 'diffs', 'matching'],
  ['推薦', '精選', 'recommendation', 'recommend', 'picks'],
  ['瀏覽器', 'browser', 'browsers', 'browsing', '網頁', 'web', 'webpage', 'webpages'],
  ['帳號', '帳戶', 'account', 'accounts'],
  ['報告', '報表', '研報', 'report', 'reports'],
  ['擷取', '提取', '萃取', '提煉', 'extract', 'extraction'],
  ['流程圖', '架構圖', '心智圖', '圖解', '草圖', 'flowchart', 'flowcharts', 'diagram', 'diagrams', 'mindmap', 'mindmaps'],
  ['評估', '評測', '基準測試', '跑分', '跑分測試', 'eval', 'evals', 'evaluation', 'evaluations', 'benchmark', 'benchmarks'],
  ['派工', '分派', '派發', '調度', '分流', '分發', 'dispatch', 'dispatcher', 'dispatching', 'dispatches', '委派', '委託', 'delegate', 'delegation', 'delegates', 'delegating'],
  ['repo', 'repos', 'repository', 'repositories', '代碼庫', '程式庫', '儲存庫'],
  ['解析', '解碼', '剖析', 'parse', 'parser', 'parsers', 'parsing', 'decode', 'decoder', 'decoders', 'decoding'],
  ['沙盒', '沙箱', 'sandbox', 'sandboxes', 'sandboxing', '沙盒環境', '沙箱環境'],
  ['結構化', 'structured'],
  ['容器', '虛擬機', 'docker', 'container', 'containers', 'vm', 'vms'],
  ['配額', '限流', '限速', '頻率限制', '速率限制', 'quota', 'quotas', 'throttling', 'throttle', 'throttles', '節流', 'ratelimit', 'rate-limit', 'rate limit', 'rate-limits', 'rate limits', 'rate limiting', 'rate-limiting'],
  ['配置', '設定', '設定檔', 'config', 'configs', 'configuration', 'configurations', 'settings'],
  ['指標', '度量', 'metric', 'metrics', 'kpi', 'kpis'],
  ['網關', '通訊閘', 'gateway', 'gateways'],
  ['逾時', '超時', 'timeout', 'timeouts'],
  ['佇列', '隊列', '排隊', 'queue', 'queues', 'mq'],
  ['依賴', '依賴項', 'dependency', 'dependencies'],
  ['延遲', '時延', 'latency', 'latencies', 'lag'],
  ['分支', 'branch', 'branches'],
  ['commit', 'commits', '提交'],
  ['並行', '並發', '平行', 'concurrency', 'concurrent', 'parallel', 'parallelism'],
  ['串流', '流式', 'stream', 'streaming', 'sse', 'server sent events', 'server-sent events', '流式輸出', '流式傳輸'],
  ['終端', '命令列', '命令行', 'terminal', 'terminals', 'cli', 'console', 'consoles'],
  ['遷移', '移轉', 'migration', 'migrations', 'migrate'],
  ['模擬', '仿真', 'mock', 'mocks', 'mocking', 'stub', 'stubs'],
  ['認證', '身分驗證', '身份驗證', 'authentication', 'oauth', 'oauth2', 'sso', '單一登入', '單點登入'],
  ['快照', 'snapshot', 'snapshots'],
  ['批次', '批處理', 'batch', 'batches'],
  ['追蹤', 'tracing', 'trace', 'track', 'tracks', 'tracking'],
  ['去識別', '脫敏', '遮罩', 'masking', 'redaction', 'anonymization', 'pii'],
  ['健康檢查', 'healthcheck', 'healthchecks', 'liveness', 'readiness'],
  ['編排', '編排者', 'orchestration', 'orchestrate', 'orchestrator', 'orchestrators', '總指揮', '指揮官', '指揮代理'],
  ['協調', '協調者', 'coordination', 'coordinate', 'coordinator', 'coordinators', 'supervisor', 'supervisors', '監管代理', '總監', '主控代理'],
  ['降級', 'fallback', 'fallbacks', 'degradation', '優雅降級', '平滑降級', '備援', '容錯', '備用方案'],
  ['狀態機', 'statemachine', 'statemachines', '狀態轉換', '狀態轉移'],
  ['檢查點', 'checkpoint', 'checkpoints', 'checkpointing'],
  ['儲存', '存儲', 'storage', '保存'],
  ['幻覺', 'hallucination', 'hallucinations'],
  ['協定', 'protocol', 'protocols'],
  ['模組', 'module', 'modules'],
  ['語意', '語義', 'semantic', 'semantics'],
  ['微調', 'finetune', 'finetuning'],
  ['里程碑', 'milestone', 'milestones'],
  ['復盤', '回顧', '檢討', 'retrospective', 'retrospectives', 'postmortem', 'postmortems'],
  ['上下文', '語境', 'context', 'contexts'],
  ['離線', 'offline', '斷網'],
  ['基準', '基線', 'baseline', 'baselines'],
  ['外洩', '洩漏', '洩露', 'leak', 'leaks', 'leakage', 'leaking', 'data-leak', 'data leak', 'data leaks', 'data leakage', 'data exfiltration', 'exfiltration', '資料外洩', '資料洩漏', '個資外洩', '資訊洩漏', '信息洩露'],
  ['架構', 'architecture', 'architectures'],
  ['回饋', '反饋', 'feedback'],
  ['非同步', '異步', 'async', 'asynchronous'],
  ['端到端', 'e2e', 'end-to-end'],
  ['斷言', 'assertion', 'assertions'],
  ['標註', 'annotation', 'annotations', '標記', '標籤化', 'labeling'],
  ['輪詢', 'polling'],
  ['增量', 'incremental'],
  ['助手', 'assistant', 'copilot'],
  ['生命週期', 'lifecycle'],
  ['冪等', '冪等性', 'idempotent', 'idempotency', 'idempotence', '冪等操作'],
  ['環境變數', '環境變量', 'env'],
  ['封存', '歸檔', 'archive', 'archives', 'archived', 'archiving', '分存', '分開儲存', '分開保存'],
  ['失敗', 'failure', 'failures', 'fail', 'fails'],
  ['回應', '響應', 'response', 'responses'],
  ['請求', 'request', 'requests'],
  ['會話', '交談', '對話', 'session', 'sessions', 'conversation', 'conversations', '工作階段', '工作會話', '作業階段'],
  ['bot', 'bots', '機器人'],
  ['路由', 'routing', 'route', 'routes', 'router', 'routers', '路由器', '動態路由'],
  ['產物', '成果', '成品', 'artifact', 'artifacts'],
  ['參數', 'parameter', 'parameters', 'params'],
  ['標頭', 'header', 'headers'],
  ['負載', '有效負載', 'payload', 'payloads'],
  ['出處', '溯源', 'provenance', '來源', 'citation', 'citations', '引用', '引文'],
  ['工作者', 'worker', 'workers', 'worker-agent', 'worker agent', 'worker agents', '工作代理', '工人', '工人代理'],
  ['schema', 'schemas', '綱要', '架構規範'],
  ['cookie', 'cookies'],
  ['heartbeat', 'heartbeats', '心跳', 'keepalive', 'keep-alive', '保活', '存活檢查', '存活確認', 'liveness', '探活'],
  ['screenshot', 'screenshots', '截圖', '螢幕截圖', '畫面截圖', '抓圖'],
  ['routine', 'routines', '例行任務', '例行', '定時任務', '常規任務', '定期任務', 'cronjob', 'crontab'],
  ['manual', 'manually', '手動', '人工操作', '手動操作', '手動恢復'],
  ['stale', '過期', '過時', '失效', '過時指示', '過期指示', '逾期', '逾期任務', '過期任務', '失效任務', '重送'],
  ['runtime', 'runtimes', '運行時', '執行期', '執行時', '運行環境', '執行環境'],
  ['timesheet', 'timesheets', '工時', '工時表', '工時紀錄', '打卡', '出勤', '工時核對', '派車單', '出勤紀錄'],
  ['tunnel', 'tunnels', '隧道', '通道', '內網穿透', '反向代理隧道'],
  ['relay', 'relays', '中繼', '轉發'],
  ['override', 'overrides', '覆寫', '覆蓋', '手動覆蓋'],
  ['portrait', 'portraits', '肖像', '似顏繪', '人像', 'likeness'],
  ['radio', 'radios', '無線電', '軟體無線電', 'sdr', 'sdr接收機', 'sdr接收站'],
  ['filter', 'filters', '濾波器', '濾波'],
  ['amplifier', 'amplifiers', '放大器'],
  ['antenna', 'antennas', '天線'],
  ['草稿', '初稿', 'draft', 'drafts', 'drafting', '擬回信', '回信草稿'],
  ['交接', '交棒', '轉交', '移交', 'handoff', 'handoffs'],
  ['dryrun', 'dry-run', '試跑', '空跑', '模擬執行'],
  ['guardrail', 'guardrails', '護欄', '安全護欄', '防護欄', '防護網', '安全防護欄'],
  ['telemetry', '遙測', '遠程測量', 'observability', '可觀測性', '可觀察性'],
  ['hitl', 'human in the loop', '人工介入', '人工覆核', '人工審核', '人工把關', '人工審查', '人機協同', '人機協作'],
  ['mcp', 'model context protocol'],
  ['connector', 'connectors', '連接器', '連線器'],
  ['skill', 'skills', '技能', '外掛技能'],
  ['pr', 'prs', 'pull request', 'pull requests', 'mr', 'mrs', 'merge request', 'merge requests', '合併請求'],
  ['用量', '額度', 'usage', '配額', '限額', '消耗', 'token用量', 'token消耗', '額度消耗'],
  ['成本', '費用', '開銷', '支出', '花費', 'cost', 'costs', 'expense', 'expenses', 'expenditure', 'fee', 'fees'],
  ['codereview', 'code review', '代碼審查', '程式碼審查', '代碼覆核', '代碼審核', '代碼評審', 'pr審查', 'pr 審查'],
  ['toolcall', 'tool call', 'tool calls', 'tool calling', 'tool-use', 'tool use', 'function call', 'function calls', 'function calling', '工具呼叫', '工具調用', '工具使用', '函式呼叫', '函式調用', '函數呼叫', '函數調用'],
  ['tts', 'text to speech', 'text-to-speech', '語音合成', '文字轉語音', '語音朗讀', '朗讀'],
  ['cicd', 'ci/cd', 'ci cd', 'ci', '持續整合', '持續交付', 'continuous integration', 'github actions'],
  ['self-hosted', 'self hosted', '自架', '自託管'],
  ['prompt-injection', 'prompt injection', 'prompt injections', 'instruction injection', '提示詞注入', '提示注入', '指令注入', '越獄', 'jailbreak', '提示詞攻擊', '注入攻擊'],
  ['structured-output', 'structured output', 'structured outputs', '結構化輸出', '結構化成果', '結構化產物', 'json-schema', 'json schema'],
  ['headless-browser', 'headless browser', '無頭瀏覽器', 'playwright', 'puppeteer', '瀏覽器自動化'],
  ['subagent', 'subagents', 'sub-agent', 'sub agent', '子代理', '子agent'],
  ['computer-use', 'computer use', 'cua', '電腦操作', '桌面操作', 'gui agent', 'gui-agent', 'gui代理'],
  ['reasoning', 'inference', '推理', '思考過程', '思維過程'],
  ['context-window', 'context window', 'context-length', 'context length', '上下文窗口', '上下文長度', '長上下文', 'long context', '脈絡長度', '上下文上限', '上下文視窗', '脈絡視窗'],
  ['context-compaction', 'context compaction', 'compaction', '上下文壓縮', '脈絡壓縮', '對話壓縮'],
  ['synthetic-data', 'synthetic data', 'synthetic', '合成資料', '合成數據', '生成資料', '生成數據'],
  ['autonomous-agent', 'autonomous agent', 'autonomous agents', 'autonomous', '自主代理', '自主agent', '自主運行', '自主智能體', '自主任務', '自主'],
  ['redirect', 'redirects', 'redirection', '轉址', '重定向', '跳轉'],
  ['canary', 'canaries', '金絲雀', '灰度', '灰度發布', '灰度部署', '藍綠部署', 'blue-green'],
  ['2fa', 'mfa', '雙重驗證', '二步驟驗證', '兩步驟驗證', '多因素驗證', '雙因子驗證', '雙因素驗證', '兩階段驗證'],
  ['cot', 'chain-of-thought', 'chain of thought', '思維鏈', '思考鏈'],
  ['隔離', 'isolation', 'airgap', 'air-gap', '網絡隔離', '網路隔離', '環境隔離', '回應隔離', '隔離分存', '檢疫'],
  ['agentic-workflow', 'agentic workflow', 'agentic workflows', '代理工作流', '智能體工作流', 'agent工作流'],
  ['rerank', 'reranking', 'reranker', '重排', '二次排序', '重新排序'],
  ['dedup', 'deduplication', '去重', '去重複', '查重', '重複資料', '數據去重', '資料去重', '同源案例', '同源', '重複來源', '候選重複', '重複候選', '同源叢集'],
  ['防火牆', 'firewall', 'firewalls', 'iptables', 'ufw', '網路防火牆', '網絡防火牆'],
  ['audit-trail', 'audit trail', 'audit-trails', 'audit trails', 'audit-log', 'audit log', 'audit logs', '稽核軌跡', '審計日誌', '稽核日誌', '操作紀錄', '操作記錄', '操作軌跡', '變更軌跡', '審計軌跡'],
  ['multimodal', 'multi-modal', '多模態', '看圖', '視覺模型', 'vlm', '視覺辨識', '視覺分析'],
  ['least-privilege', 'least privilege', 'least privileges', '最小權限', '最小權限原則', '權限最小化'],
  ['whitelist', 'whitelisting', 'allowlist', 'allowlisting', '白名單', '允許清單', '允許名單'],
  ['blacklist', 'blacklisting', 'denylist', 'denylisting', 'blocklist', 'blocklisting', '黑名單', '封鎖名單', '拒絕清單'],
  ['sensitive-data', 'sensitive data', 'sensitive information', 'sensitive info', '敏感資料', '敏感資訊', '敏感信息'],
  ['kill-switch', 'kill switch', 'emergency-stop', 'emergency stop', 'circuit-breaker', 'circuit breaker', '緊急停止', '緊急開關', '停止開關', '熔斷', '熔斷器', '斷路器', '緊急停止開關'],
  ['outbox', 'outbox-pattern', 'outbox pattern', '發件匣', '發件箱', '發件匣模式', '發件箱模式'],
  ['access-control', 'access control', 'rbac', '存取控制', '訪問控制', '存取權限', '權限控制'],
  ['event-driven', 'event driven', '事件驅動', '事件驅動架構', '事件觸發'],
  ['回滾', '回退', '倒退', 'rollback', 'rollbacks', 'revert', 'reverting', '復原', '還原', '恢復', '自動還原', '自動恢復'],
  ['planning', 'plan', 'plans', '規劃', '任務規劃', '計畫', '計劃', '籌劃'],
  ['reproducibility', 'reproducible', 'reproduce', '重現', '可重現', '重現性', '獨立重現', '復現', '復現性'],
  ['failover', 'fail-over', '故障轉移', '容災', '備援切換'],
  ['coloring', 'coloring-page', 'coloring-book', 'coloring book', 'coloring sheet', 'coloring sheets', '著色', '著色頁', '著色本', '著色畫', '線稿', '塗色', '塗色頁', '塗色本', '填色', '填色本', '兒童著色', '黑白線稿', '線稿著色', '著色線稿'],
  ['print', 'prints', 'printer', 'printers', 'printing', '列印', '印表機', '印刷', '印製', 'auto-print', 'auto print', 'autoprint', '自動列印', '自動打印', '自動印'],
  ['breakdown', 'breakdowns', 'roadside', 'roadside-assistance', 'roadside assistance', 'towing', 'tow truck', '拋錨', '車輛拋錨', '汽車拋錨', '道路救援', '道路支援', '故障救援', '車輛救援', '拖吊', '拖車', '公路救援', '求援', '求助', '救援申請', '救援申請表', '救援表單'],
  ['stall', 'stalls', 'stalled', 'stalling', 'hang', 'hanging', '卡住', '停滯', '停擺', '卡死'],
  ['grade', 'grades', 'grading', '成績', '等第', '分數', '學業成績', '成績看板', '抓成績', '學業追蹤'],
  ['homework', 'assignment', 'assignments', '作業', '功課', '缺交作業', '作業缺交', '課業'],
  ['tv', 'tvs', 'television', '電視', '智慧電視', '智能電視', 'android tv', 'smart tv', 'smart-tv', 'google tv', 'google-tv', 'android-tv'],
  ['ambient', 'ambient-board', 'ambient-display', '待機畫面', '常亮', '常亮看板', '常亮螢幕', '常亮顯示', '待機螢幕'],
  ['reservation', 'reservations', 'booking', 'bookings', '訂位', '預約', '餐廳訂位', '預約餐廳', '餐廳預約', '電話訂位', '訂位電話', '電話預約', '代訂', '訂席', '代訂餐廳', '代訂位', '餐廳代訂', '訂位代理', '代訂席', 'clawcall', '語音訂位', '語音預約', '訂位bot'],
  ['reflection', 'reflections', 'self-reflection', '反思', '自我反思', '自我反省', '反思機制'],
  ['self-correction', 'self-healing', '自我修正', '自我修復', '自我修復機制', '自動修復', '自我檢查'],
  ['wakeup', 'wake-up', 'wake up', '喚醒', '叫醒', '主動叫醒', '叫醒bot', '喚醒bot'],
  ['coding-agent', 'coding agent', 'coding agents', '程式代理', '代碼代理', '編程代理'],
  ['car-rental', 'car rental', 'rental car', 'rental-car', '租車', '租賃車', '自駕租車'],
  ['insurance-claim', 'insurance claim', 'insurance claims', '保險理賠', '理賠', '理賠申請', '保險索賠'],
  ['car-insurance', 'car insurance', 'auto insurance', '車險', '車輛保險', '汽車保險'],
  ['chat-negotiation', 'chat negotiation', 'negotiation', 'negotiations', '議價', '聊天議價', '客服議價', '線上議價', '談判', '爭取優惠', '降費', '線上聊天議價', '協商降費', '降費協商', 'siriusxm'],
  ['open-source', 'open source', '開源', '開源專案', '開源程式', '開源工具', '開源原碼', '開源小程式', '開源組件', '開源元件', '開源套件', '開源庫'],
  ['server', 'servers', '伺服器', '服務器', '主機'],
  ['ads-b', 'adsb', 'ads b', '航空追蹤', '航班追蹤', '飛機追蹤', '廣播式自動相關監視', '航機追蹤', '1090mhz', '1090 mhz', '民航機追蹤', '航空監視', '接收站', '接收機'],
  ['german', 'germany', '德國', '德文', '德語'],
  ['highway', 'highways', 'freeway', 'freeways', 'expressway', 'expressways', 'autobahn', '高速公路', '公路'],
  ['cloudflare-worker', 'cloudflare worker', 'cloudflare workers', 'cloudflare-workers', 'cf worker', 'cf workers', 'cf-worker'],
  ['driver', 'drivers', '司機', '駕駛', '駕駛員', '運將', '卡車司機', '卡車', '貨車', 'truck', 'trucks'],
  ['handheld', 'handhelds', 'palmtop', 'palmtops', '掌上型', '掌上裝置', '手持裝置', '手持終端', '掌上終端', '掌上電腦', '隨身裝置', '隨身終端'],
  ['face-swap', 'face swap', 'faceswap', '換臉', '人臉替換', '面部替換', '臉部替換', '照片換臉', '人臉抽換'],
  ['credit', 'credits', '抵免', '帳單抵免', '費用抵免', '退費抵免', '帳戶抵免', '減免', '爭取抵免'],
  ['代打電話', '代撥電話', '電話代撥', '電話代打', '代撥', '電話代理'],
  ['kids', 'kid', 'child', 'children', '孩子', '小孩', '幼兒', '幼童', '小童', '兒童', '小朋友', '兒少'],
  ['recommend', 'recommendation', 'recommendations', '推薦', '每日推薦', '推薦清單'],
  ['electric-vehicle', 'electric-vehicles', 'ev', 'evs', '電動車', '電車', 'electric vehicle', 'electric vehicles'],
  ['commute', 'commuting', '通勤', '通勤時間', '上班通勤', '下班通勤', '塞車通勤'],
  ['renovation', 'renovations', 'remodel', 'remodeling', '整修', '修繕', '裝修', '翻新', '房屋整修', '整修費用'],
  ['school-district', 'school district', '學區', '學校評分', '學區評分'],
  ['disclosure', 'disclosures', '揭露', '揭露文件', '屋況揭露', '房屋揭露', '屋況說明書', '不動產說明書', '屋況'],
  ['分流', '分派', '分工', 'triage'],
  ['雙頻', 'dual-band', 'dual band'],
  ['量測', '測量', 'measurement', 'measurements'],
  ['房仲', '仲介', '房屋仲介', 'realtor', 'real estate agent', 'real estate agents'],
  ['order', 'orders', 'ordering', 'purchase', 'purchases', 'purchasing', 'buy', 'buying', '下單', '下訂', '購買', '買下', '採購', '下訂單'],
  ['charge', 'charges', 'charging', '充電', '充飽', '充飽電', '充滿', '充滿電', '滿充'],
  ['sold-out', 'out-of-stock', 'restock', 'restocking', '售完', '缺貨', '補貨', '沒貨', '候補'],
  ['攀岩鞋', '攀岩', 'climbing-shoes', 'climbing shoes'],
  ['關稅', '進口稅', '進口關稅', '稅費', 'tariff', 'tariffs', 'customs', 'duty', 'import tax'],
  ['饒舌', 'rap', '說唱'],
  ['押韻', 'rhyme', 'rhymes', '押韻歌詞'],
  ['門號', '手機號碼', '電話號碼', '回收門號', '門號被擋'],
  ['前持有人', '前用戶', '原持有人', '前號主', '原號主', '舊號主'],
  ['地鐵', '捷運', 'subway', 'metro'],
  ['預估', '估算', '評估', '估計', 'estimate', 'estimates', 'estimation'],
  ['簡訊', '短信', 'sms', 'text message', 'text messages'],
  ['a/b test', 'ab test', 'a/b testing', 'ab testing', 'ab-test', 'ab-tests', 'ab-testing', 'ab測試', 'a/b測試', '對照測試', '前後對照', '前後比較', '對照組', '實驗組'],
  ['重啟', '重新啟動', '重開', 'restart', 'restarts', 'restarted', 'restarting', 'reboot', 'reboots', 'rebooted', 'rebooting', '啟動', '拉起', '重新拉起', '喚起'],
  ['music-generation', 'music generation', 'ai音樂', 'ai配樂', '音樂生成', '生成音樂', '配樂生成', '自動配樂', '背景音樂', 'bgm', 'suno'],
  ['connection-error', 'connection error', '連線錯誤', '連線排障', '連線問題', '連線異常', 'error_connection_closed', '連線中斷', '連線被拒', '連線失敗', '連線關閉'],
  ['anti-scraping', 'anti scraping', 'anti-bot', 'antibot', '反爬蟲', '反爬', '爬蟲被擋', '防爬', '擋爬蟲', '擋機器人', '擋代理'],
  ['買房', '找房', '看房', '購屋', '買屋', '房屋', '房源', '房產', '不動產', 'house', 'housing', 'home-search', 'home search', 'real-estate', 'real estate'],
  ['author', 'authors', '作者', '原作者'],
  ['demo', 'demos', '展示', '小實驗', '互動展示', '互動網頁', '互動demo', '網頁小實驗'],
  ['書籤', 'bookmark', 'bookmarks', '收藏', '我的收藏', 'x書籤', '推特書籤'],
  ['教練', 'coach', 'coaching', '督導', '督促'],
  ['轉發', '轉推', 'repost', 'reposts', 'retweet', 'retweets', '轉發機器'],
  ['持股', '持股清單', '投資組合', 'portfolio', 'portfolios', '股票清單'],
  ['剪藏', 'clipper', 'clippers', '網頁剪藏', '網頁擷取', 'web clipper'],
  ['計時器', '定時器', 'timer', 'timers', 'launchd'],
  ['命令', '指令', 'command', 'commands'],
  ['原創', '原創內容', 'original', 'original content'],
  ['intranet', '內網', '內部', '內部網路', '內網資料'],
  ['internet', '外網', '外部', '公開', '外部網路', '公開情報', '公開新聞'],
  ['出遠門', '長途', '出遠門前', '長途旅行', '長途出發', 'road-trip'],
  ['詢問信', '諮詢信', '客戶來信', 'inquiry', 'inquiries'],
  ['避免', '防止', '防範', '預防', 'prevent', 'preventing', 'prevention'],
  ['側欄', '側邊欄', 'sidebar'],
  ['crypto', 'cryptocurrency', '加密貨幣', '虛擬貨幣', '比特幣', '以太幣'],
  ['playlist', 'playlists', '播放清單', '歌單', '影音清單'],
  ['unfollow', '取關', '退追', '退追蹤', '退粉'],
  ['followers', 'following', '粉絲', '關注名單', '互粉', '互關', '回關'],
  ['健身', 'workout', '運動', '重訓', '健身房'],
  ['epub', '電子書'],
];
const SYNONYM_MAP = {};
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    if (!SYNONYM_MAP[word]) SYNONYM_MAP[word] = [word];
    for (const other of group) {
      if (!SYNONYM_MAP[word].includes(other)) SYNONYM_MAP[word].push(other);
    }
  }
};
const DIFFICULTY_LABELS = {
  '入門對話': '入門對話（免寫程式）',
  '工具串接': '工具串接（需帳號或外掛）',
  '進階開發': '進階開發（需本機環境或代碼）'
};
const DIFFICULTY_NOTES = {
  '入門對話': '免寫程式',
  '工具串接': '需外掛/帳號',
  '進階開發': '需代碼/環境'
};
function extractDifficulty(markdown, tools = [], scenario = '', category = '') {
  const lead = markdown.replace(/^#{1,3}[^\n]*\n/, '').split(/^## /m)[0];
  const declaredTools = clean(lead.match(/^-\s*工具\s*[：:]\s*(.+)$/m)?.[1] || '');
  const allToolText = tools.join(' ') + ' ' + declaredTools;
  const devTools = /Claude Code|OpenDevin|Devin|AutoGPT|Codex|Cline|Roo Code|Aider|Cursor|Docker|GitHub Actions|Kubernetes|Playwright|Puppeteer/i;
  const devPatterns = /本機\s*CLI|指令列|終端機|本機執行|本機環境|自建腳本|自架伺服器|腳本撰寫|環境變數|npm\s+run|git\s+clone|docker\s+compose|開發者模式|程式碼實作|自寫代碼|腳本|CLI\b/i;
  if (devTools.test(allToolText) || devPatterns.test(markdown) || (scenario === '開發' && /程式|CLI|終端|代碼|代碼庫|git/i.test(markdown))) {
    return '進階開發';
  }
  const connectorTools = /\bMCP\b|Slack Bot|Discord Bot|Stripe|Zapier|Make|Notion API|Airtable|OAuth|Webhook/i;
  const connectorPatterns = /\bMCP\b|API\s*Key|API\s*金鑰|金鑰|Webhook|OAuth|第三方授權|串接服務|外掛安裝|資料庫連線|連線授權/i;
  if (connectorTools.test(allToolText) || connectorPatterns.test(markdown)) {
    return '工具串接';
  }
  return '入門對話';
}
function idVariants(id) { const normId = id.toUpperCase(); const unhyphenated = normId.replace(/[-_]/g, ''); return normId !== unhyphenated ? `${normId} ${unhyphenated}` : normId; }
function termVariants(term) { const t = norm(term).replace(/^#/, ''); const m = t.match(/^([a-z]+)[\s-]*(\d+)$/); if (m && (m[1] === 'uc' || m[1] === 'p')) { const padded = m[2].padStart(3, '0'); return [`${m[1]}-${padded}`, `${m[1]}${padded}`]; } if (/^\d+$/.test(t)) { const padded = t.padStart(3, '0'); return [t, `uc-${padded}`, `uc${padded}`]; } return SYNONYM_MAP[t] || [t]; }
const matchCase = (target, list = entries) => { if (!target) return null; const t = norm(target).trim().replace(/^#/, ''); const m = t.match(/^(?:([a-z]+)[\s-：:#.]*)?(\d+)$/); const variants = m && (!m[1] || m[1] === 'uc' || m[1] === 'p') ? [`${m[1] || 'uc'}-${m[2].padStart(3, '0')}`, `${m[1] || 'uc'}${m[2].padStart(3, '0')}`] : termVariants(t); return list.find(e => { const eid = norm(e.id); const eidRaw = norm(e.id.replace(/[-_]/g, '')); return variants.includes(eid) || variants.includes(eidRaw); }) || null; };
// Only explicit lead fields describe this library's review date. Source dates
// and dated supplements are intentionally not evidence of a page-level review.
function reviewDate(markdown) {
  const lead=markdown.replace(/^#{1,3}[^\n]*\n/, '').split(/^## /m)[0];
  const dates=[];
  for(const line of lead.split('\n')){
    if(!/^-\s*(?:查證日期|查閱日期|核對日期|研究核對日|查證|首次收錄[／、](?:最近查證|查證))\s*[：:]/.test(line))continue;
    for(const date of line.match(/\b20\d{2}-\d{2}-\d{2}\b/g)||[]){
      const parsed=new Date(date+'T00:00:00Z');
      if(!Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===date)dates.push(date);
    }
  }
  return dates.sort().pop()||'';
}
function extractActionableGuidance(markdown) {
  let how = '';
  let howMatch = markdown.match(/^#{2,3}\s+(?:.*(?:建議操作流程|建議流程|建議操作步驟|操作步驟|可參考步驟|怎麼開始|可借用的驗收步驟|可借用的只讀驗收步驟|實作流程與核對邊界).*)$/m);
  if (!howMatch) {
    howMatch = markdown.match(/^#{2,3}\s+(?:.*(?:流程|輸入與預期輸出|實作步驟|作者做過的流程|作者報告的流程|作者實作).*)$/m);
  }
  if (howMatch) {
    const start = howMatch.index + howMatch[0].length;
    const rest = markdown.slice(start);
    const nextH = rest.search(/\n^#{2,3}\s+/m);
    const section = nextH !== -1 ? rest.slice(0, nextH) : rest;
    const lines = section.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('<!--') && !l.startsWith('>') && !l.startsWith('#') && !l.startsWith('```'));
    const listItems = lines.filter(l => /^(\d+\.|\*|-|•)\s+/.test(l))
      .map(l => l.replace(/^(\d+\.|\*|-|•)\s+/, '').trim());
    if (listItems.length > 0) {
      how = listItems.slice(0, 2).join('；');
    } else if (lines.length > 0) {
      how = lines[0];
    }
  }
  let caution = '';
  const cautionMatch = markdown.match(/^#{2,3}\s+(?:.*(?:所需連接、權限與限制|權限、費用與限制|權限、費用與可用性|權限、費用及限制|權限與驗收|證據與查閱缺口|來源報告與限制|限制與驗收|要注意什麼|權限、成本及可用性|權限、限制與驗收|限制、權限與費用|官方限制、費用與可用性|官方限制、費用與權限|官方限制、費用及可用性).*)$/m);
  if (cautionMatch) {
    const start = cautionMatch.index + cautionMatch[0].length;
    const rest = markdown.slice(start);
    const nextH = rest.search(/\n^#{2,3}\s+/m);
    const section = nextH !== -1 ? rest.slice(0, nextH) : rest;
    const lines = section.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('<!--') && !l.startsWith('>') && !l.startsWith('#') && !l.startsWith('```'));
    const listItems = lines.filter(l => /^(\d+\.|\*|-|•)\s+/.test(l))
      .map(l => l.replace(/^(\d+\.|\*|-|•)\s+/, '').trim());
    if (listItems.length > 0) {
      caution = listItems[0];
    } else if (lines.length > 0) {
      caution = lines[0];
    }
  }
  return {
    how: how ? how.replace(/\s+/g, ' ').slice(0, 160) : '',
    caution: caution ? caution.replace(/\s+/g, ' ').slice(0, 160) : ''
  };
}
function metadata(markdown, path, kind, suffix='') {
  const title = clean(markdown.match(/^#{1,3}\s+(.+)$/m)?.[1] || path);
  const id = title.match(/(?:UC|P)-\d+/)?.[0] || path.split('/').pop().replace(/\.md$/,'') + suffix;
  const heading = title.replace(/^(?:UC|P)-\d+[\s:：|｜]*/, '');
  const lead = markdown.replace(/^#{1,3}[^\n]*\n/, '').split(/^## /m)[0];
  const summary = clean(lead.match(/^-\s*(?:核心目標|問題|目標|已知標題|狀態)\s*[：:]\s*(.+)$/m)?.[1] || lead.split('\n').find(line => line.trim() && !/^#|^-/.test(line)) || '閱讀公開來源、建議流程與驗收限制。');
  let category = clean(lead.match(/^-\s*分類(?:／標籤)?\s*[：:]\s*(.+)$/m)?.[1] || '');
  if (!category) category = /旅遊|旅行/.test(heading) ? '旅遊／消費研究' : /OLED|裝置/.test(heading) ? '實體裝置／驗收' : /銷售|商機|商店|SaaS|帳單/.test(heading) ? '商業／營運' : /研究|PR|CUA/.test(heading) ? '研究／開發' : /影片|社群|Facebook|CRM/.test(heading) ? '內容／社群' : '個人生產力';
  let scenario = Discovery.scenarioOf(markdown) || clean(lead.match(/^-\s*情境\s*[：:]\s*(.+)$/m)?.[1] || '');
  if (!scenario) {
    if (/旅遊|旅行|消費/.test(heading + category)) scenario = '生活';
    else if (/銷售|商機|商店|SaaS|帳單|商業|營運/.test(heading + category)) scenario = '工作';
    else if (/研究|PR|CUA|裝置|程式|開發/.test(heading + category)) scenario = '開發';
    else if (/影片|社群|Facebook|CRM|創作/.test(heading + category)) scenario = '創作';
    else if (/學習|自學/.test(heading + category)) scenario = '學習';
    else if (/省錢|記帳/.test(heading + category)) scenario = '省錢';
    else scenario = '工作';
  }
  if (scenario === '居家') scenario = '生活';
  else if (scenario.includes('生活')) scenario = '生活';
  else if (scenario.includes('工作')) scenario = '工作';
  let rawTags = clean(lead.match(/^-\s*標籤\s*[：:]\s*(.+)$/m)?.[1] || '');
  if (!rawTags) {
    const rawCatTag = clean(lead.match(/^-\s*(?:分類／標籤|分類)\s*[：:]\s*(.+)$/m)?.[1] || '');
    if (rawCatTag.includes('｜')) {
      rawTags = rawCatTag.split('｜')[1] || '';
    } else if (rawCatTag.includes('／')) {
      const parts = rawCatTag.split('／');
      if (parts.length > 1) rawTags = parts.slice(1).join('、');
    } else if (rawCatTag.includes('/')) {
      const parts = rawCatTag.split('/');
      if (parts.length > 1) rawTags = parts.slice(1).join('、');
    }
  }
  const tags = rawTags ? rawTags.split(/[、,，\s/]+/).map(t=>t.trim()).filter(Boolean) : [];
  const proofLine = clean(lead.match(/^-\s*(?:來源證據|證據狀態|證據等級|證據)\s*[：:]\s*(.+)$/m)?.[1] || '');
  const proof = kind === 'pending' ? '尚待查證' : /模板/.test(proofLine + heading) ? '模板／文件核讀' : /官方.*(?:自報|第一手.*自述)|official/.test(proofLine) ? '官方自報' : /author|作者|自驗|自述/.test(proofLine) ? '作者報告／示範' : '公開資料核讀';
  const tools = TOOL_PATTERNS.filter(([,re])=>re.test(markdown)).map(([name])=>name);
  const date = clean(lead.match(/^-\s*(?:查證日期|查閱日期|核對日期|研究核對日|首次收錄[／、]最近查證|查證)\s*[：:]\s*.*?(20\d{2}-\d{2}-\d{2})/m)?.[1] || lead.match(/(?:查證|查閱|核對|最近查證)\s*[：:；]?\s*.*?(20\d{2}-\d{2}-\d{2})/)?.[1] || lead.match(/20\d{2}-\d{2}-\d{2}/)?.[0] || '');
  const copy=(globalThis.displayCopy?.[id])||displayCopy[id]||{};
  const displayTitle=clean(lead.match(/^-\s*網站標題\s*[：:]\s*(.+)$/m)?.[1]||copy.title||heading);
  const what=clean(lead.match(/^-\s*一句話用途\s*[：:]\s*(.+)$/m)?.[1]||copy.what||summary);
  const targetUser=clean(lead.match(/^-\s*目標使用者\s*[：:]\s*(.+)$/m)?.[1]||'');
  const coreGoal=clean(lead.match(/^-\s*核心目標\s*[：:]\s*(.+)$/m)?.[1]||'');
  const reviewedDate=reviewDate(markdown);
  const extracted=extractActionableGuidance(markdown);
  const howText=copy.how||extracted.how||'先閱讀原始報告與限制，再用小範圍、去敏資料設計自己的測試。';
  const cautionText=copy.caution||extracted.caution||'本庫尚未獨立重現；先確認權限與驗收方式，不把案例報告當成成效保證。';
  const difficulty = extractDifficulty(markdown, tools, scenario, category);
  return {id,title:displayTitle,originalTitle:heading,what,targetUser,coreGoal,how:howText,caution:cautionText,difficulty,markdown,path,kind,category,scenario,tags,summary:what,proof,tools,date,reviewedDate,search:norm(markdown+' '+displayTitle+' '+what+' '+(targetUser?targetUser+' ':'')+(coreGoal?coreGoal+' ':'')+tools.join(' ')+' '+category+' '+scenario+' '+tags.join(' ')+' '+KIND[kind]+' '+difficulty+' '+(difficulty==='入門對話'?'免寫程式 零程式碼':'')+' '+idVariants(id))};
}
function parseFile(path, markdown) {
  if (path === 'sources/pending.md') return markdown.split(/(?=^##\s+P-)/m).filter(part=>/^##\s+P-/.test(part)).map((part,i)=>metadata(part,path,'pending',String(i)));
  return [metadata(markdown,path,path.startsWith('evidence/')?'evidence':'case')];
}
function el(tag,cls,text) { const node=document.createElement(tag); if(cls)node.className=cls; if(text!==undefined)node.textContent=text;return node; }
function safeLink(target,path) {
  try { const url = new URL(target, REPO+path); return ['https:','http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
// Read one destination without confusing a URL's own parentheses with Markdown's
// closing delimiter. Unsupported whitespace or an unmatched delimiter stays text.
function markdownDestination(text,start) {
  let depth=1,target='';
  for(let i=start;i<text.length;i++) {
    const char=text[i];
    if(/\s/.test(char))return null;
    if(char==='\\' && /[()\\]/.test(text[i+1]||'')){target+=text[++i];continue;}
    if(char==='(')depth++;
    if(char===')'){depth--;if(depth===0)return target?{target,end:i+1}:null;}
    target+=char;
  }
  return null;
}
// Find a closing strong delimiter without consuming code or link destinations.
// Ambiguous star runs and unsupported markup stay literal.
function markdownStrong(text,start) {
  for(let i=start;i<text.length;i++) {
    const char=text[i];
    if(char==='\n')return null;
    if(char==='\\'&&text[i+1]==='*')return null;
    if(char==='`') {
      const code=text.slice(i).match(/^`([^`]+)`/);
      if(code){i+=code[0].length-1;continue;}
    }
    if(char==='[') {
      const label=text.slice(i).match(/^\[[^\]]+\]\(/);
      if(label) {
        const destination=markdownDestination(text,i+label[0].length);
        if(!destination)return null;
        i=destination.end-1;continue;
      }
    }
    // A bare URL is one opaque existing token; never infer its ending.
    const url=text.slice(i).match(/^https?:\/\/[^\s<>]+/);
    if(url){i+=url[0].length-1;continue;}
    if(char==='*') {
      if(text.slice(i,i+2)==='**'&&text[i+2]!=='*'&&!/\s/.test(text[i-1]))return {text:text.slice(start,i),end:i+2};
      return null;
    }
  }
  return null;
}
function inline(node,text,path) {
  // All source text is inserted as text nodes; source HTML can never execute.
  const regex=/\[([^\]]+)\]\(|https?:\/\/[^\s<>]+|`([^`]+)`|(?<![\\*])\*\*(?![\s*])/g; let last=0,match;
  while((match=regex.exec(text))) {
    node.append(document.createTextNode(text.slice(last,match.index)));
    if(match[0]==='**') {
      const span=markdownStrong(text,regex.lastIndex);
      if(span){const strong=el('strong');inline(strong,span.text,path);node.append(strong);regex.lastIndex=span.end;}
      else node.append(document.createTextNode(match[0]));
    }
    else if(match[2]) node.append(el('code','',match[2]));
    else {
      const destination=match[1]?markdownDestination(text,regex.lastIndex):null;
      if(match[1]&&!destination){node.append(document.createTextNode(match[0]));last=regex.lastIndex;continue;}
      if(destination)regex.lastIndex=destination.end;
      const target=destination?destination.target:match[0],href=safeLink(target,path),label=match[1]||target;
      if(href){const a=el('a','',label);a.href=href;a.target='_blank';a.rel='noopener noreferrer';node.append(a);}else node.append(document.createTextNode(label));
    }
    last=regex.lastIndex;
  }
  node.append(document.createTextNode(text.slice(last)));
}
// Recognize only complete pipe tables. Unsupported rows stay literal rather
// than silently discarding source cells or guessing missing values.
function tableCells(line) {
  let value=line.trim();
  if(!value.includes('|'))return null;
  if(value.startsWith('|'))value=value.slice(1);
  if(/(?<!\\)\|$/.test(value))value=value.slice(0,-1);
  const cells=[];let cell='';
  for(let i=0;i<value.length;i++){
    if(value[i]==='\\'&&value[i+1]==='|'){cell+='|';i++;continue;}
    if(value[i]==='`'){
      const fence=value.slice(i).match(/^`+/)[0],end=value.indexOf(fence,i+fence.length);
      if(end!==-1){cell+=value.slice(i,end+fence.length).replace(/\\\|/g,'|');i=end+fence.length-1;continue;}
    }
    if(value[i]==='|'){cells.push(cell.trim());cell='';}else cell+=value[i];
  }
  cells.push(cell.trim());return cells;
}
function sourceTable(lines,start,path) {
  const header=tableCells(lines[start]),divider=tableCells(lines[start+1]||'');
  if(!header||header.length<2||!divider||divider.length!==header.length||!divider.every(cell=>/^:?-{3,}:?$/.test(cell)))return null;
  const rows=[];let end=start+2;
  for(;end<lines.length&&lines[end].trim()&&lines[end].includes('|');end++){
    const cells=tableCells(lines[end]);
    if(!cells||cells.length!==header.length)return null;
    rows.push(cells);
  }
  const wrap=el('div','markdown-table');wrap.tabIndex=0;
  wrap.setAttribute('role','region');wrap.setAttribute('aria-label','原文表格；可左右捲動，鍵盤聚焦後可用左右方向鍵');
  const table=el('table'),head=el('thead'),body=el('tbody'),tr=el('tr');
  header.forEach(text=>{const th=el('th');th.scope='col';inline(th,text,path);tr.append(th);});
  head.append(tr);
  rows.forEach(cells=>{const row=el('tr');cells.forEach(text=>{const td=el('td');inline(td,text,path);row.append(td);});body.append(row);});
  table.append(head,body);wrap.append(table);return {node:wrap,end};
}
function renderMarkdown(markdown,path) {
  const out=el('div','markdown'); let paragraph=[],lists=[],code=null;
  const flush=()=>{if(paragraph.length){const p=el('p');inline(p,paragraph.join(' '),path);out.append(p);paragraph=[];}lists=[];};
  const lines=markdown.split('\n').slice(1);
  for(let i=0;i<lines.length;i++) {
    const line=lines[i];
    if(/^```/.test(line)){flush();if(code){out.append(code);code=null;}else code=el('pre');continue;}
    if(code){code.textContent+=line+'\n';continue;}
    if(!line.trim()){flush();continue;}
    const table=sourceTable(lines,i,path);
    if(table){flush();out.append(table.node);i=table.end-1;continue;}
    const head=line.match(/^(#{2,6})\s+(.+)/),item=line.match(/^(\s*)([-*]|\d+\.)\s+(.+)/);
    if(head){flush();const h=el(head[1].length===2?'h2':'h3');inline(h,head[2],path);out.append(h);}
    else if(item){
      if(paragraph.length)flush();
      const indent=item[1].replace(/\t/g,'    ').length,type=/^\d/.test(item[2])?'ol':'ul';
      while(lists.length&&indent<lists.at(-1).indent)lists.pop();
      if(lists.length&&indent===lists.at(-1).indent&&type!==lists.at(-1).type)lists.pop();
      if(!lists.length||indent>lists.at(-1).indent){
        const list=el(type),parent=lists.at(-1)?.last;
        (parent||out).append(list);lists.push({indent,type,list,last:null});
      }
      const level=lists.at(-1),li=el('li');
      if(type==='ol')li.value=Number.parseInt(item[2],10);
      inline(li,item[3],path);level.list.append(li);level.last=li;
    }
    else if(/^>\s?/.test(line)){flush();const quote=el('blockquote');inline(quote,line.replace(/^>\s?/,''),path);out.append(quote);}
    else if(lists.length&&/^\s+/.test(line)){
      // Continuation text belongs to the preceding item, never a new sibling.
      const indent=line.match(/^\s*/)[0].replace(/\t/g,'    ').length;
      while(lists.length>1&&indent<=lists.at(-1).indent)lists.pop();
      inline(lists.at(-1).last,' '+line.trim(),path);
    }
    else {if(lists.length)flush();paragraph.push(line);}
  }
  flush();if(code)out.append(code);return out;
}
function relatedEntries(item, items) {
  if (!item.category || item.category === '未分類') return [];
  return items.filter(other => other.id !== item.id && other.kind === 'case' && other.category === item.category).slice(0, 3);
}
function detailNeighbours(item, items) {
  const index = items.findIndex(other => other.id === item?.id);
  return index < 0 ? {prev:null,next:null} : {prev:items[index - 1] || null,next:items[index + 1] || null};
}
function renderRelated(item) {
  const related = relatedEntries(item, currentFiltered);
  const section = el('section', 'related-cases');
  section.setAttribute('aria-labelledby', 'related-title');
  const heading = el('h2', '', '同主題延伸閱讀');heading.id = 'related-title';
  section.append(heading, el('p', 'related-note', '依主題分類整理，限目前搜尋結果；不是成效或證據排名。'));
  if (related.length) {
    const list = el('ul', 'related-list');
    related.forEach(other => {
      const row = el('li');
      const button = el('button', 'related-open', other.title);button.type = 'button';
      button.dataset.relatedId = other.id;
      // Preserve the original result/discovery trigger for close and Escape.
      button.addEventListener('click', () => showDetail(other, null));
      row.append(el('p', 'related-meta', other.id + ' · 同主題：' + other.category), button,
        el('p', 'related-summary', other.summary), el('p', 'related-proof', '來源類型：' + other.proof));
      list.append(row);
    });
    section.append(list);
  } else {
    section.append(el('p', 'related-empty', discoveryReady ? '目前條件下，沒有其他相同主題的主要案例。可關閉閱讀後調整搜尋條件。' : '其他案例仍在載入，完成後會依目前搜尋條件提供延伸閱讀。'));
  }
  const back = el('button', 'related-back', '關閉並返回結果');back.type = 'button';
  back.setAttribute('aria-label', '關閉並返回結果');
  back.addEventListener('click', closeDetail);section.append(back);
  const nextActions = el('div', 'detail-next-actions');
  if (item.scenario) {
    const exploreScenarioBtn = el('button', 'detail-action-scenario', `探索更多「${item.scenario}」案例 →`);
    exploreScenarioBtn.type = 'button';
    exploreScenarioBtn.setAttribute('aria-label', `探索更多「${item.scenario}」案例`);
    exploreScenarioBtn.addEventListener('click', () => {
      closeDetail();
      activeScenario = item.scenario;
      render();
      $('results-count').focus({preventScroll:true});
      $('results-count').scrollIntoView({block:'start',behavior:'instant'});
    });
    nextActions.append(exploreScenarioBtn);
  }
  const copyTakeawayBtn = el('button', 'detail-action-copy', '複製本篇筆記與連結 📋');
  copyTakeawayBtn.type = 'button';
  copyTakeawayBtn.setAttribute('aria-label', '複製本篇案例摘要、指引與連結');
  const copyStatus = el('span', 'detail-action-status', '');
  copyStatus.setAttribute('role', 'status');
  copyStatus.setAttribute('aria-live', 'polite');
  const manualCopy = el('textarea', 'detail-action-manual-copy');
  manualCopy.readOnly = true;
  manualCopy.hidden = true;
  manualCopy.setAttribute('aria-label', '案例筆記，請手動複製');
  let copyRequest = 0;
  let copyTimer;
  copyTakeawayBtn.addEventListener('click', async () => {
    const request = ++copyRequest;
    const focusAtRequest = document.activeElement;
    const isCurrent = () => request === copyRequest && copyStatus.isConnected !== false;
    const caseUrl = new URL(location.href);
    caseUrl.search = '?case=' + encodeURIComponent(item.id);
    caseUrl.hash = '';
    const text = [
      `【AI 案例筆記】${item.id} · ${item.title}`,
      `📌 用途：${item.what || item.summary}`,
      item.how ? `🚀 怎麼開始：${item.how}` : '',
      item.caution ? `⚠️ 注意事項：${item.caution}` : '',
      item.proof ? `📎 來源證據：${item.proof}` : '',
      `🔗 詳情與來源：${caseUrl.href}`
    ].filter(Boolean).join('\n');
    clearTimeout(copyTimer);
    manualCopy.value = '';
    manualCopy.hidden = true;
    copyStatus.textContent = '正在複製案例筆記…';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      if (!isCurrent()) return;
      copyStatus.textContent = '已複製案例筆記！';
      copyTimer = setTimeout(() => {
        if (isCurrent()) copyStatus.textContent = '';
      }, 3000);
    } catch {
      if (!isCurrent()) return;
      manualCopy.value = text;
      manualCopy.hidden = false;
      copyStatus.textContent = '無法自動複製，請手動複製下方完整筆記。';
      if (document.activeElement === focusAtRequest) {
        manualCopy.focus();
        manualCopy.select();
      }
    }
  });
  nextActions.append(copyTakeawayBtn, copyStatus, manualCopy);
  section.append(nextActions);
  return section;
}
function refreshRelated() {
  const previous = $('detail-body').querySelector('.related-cases');
  if (!$('detail').open || !previous || !currentDetailItem) return;
  const active = document.activeElement;
  const hadFocus = previous.contains(active);
  const previousActions = previous.querySelector('.detail-next-actions');
  const next = renderRelated(currentDetailItem);
  const nextActions = next.querySelector('.detail-next-actions');
  if (previousActions && nextActions) nextActions.replaceWith(previousActions);
  previous.replaceWith(next);
  if (hadFocus) {
    let target = null;
    if (active.dataset?.relatedId) {
      target = [...next.querySelectorAll('[data-related-id]')].find(b => b.dataset.relatedId === active.dataset.relatedId);
    } else if (active.classList.contains('detail-action-scenario')) {
      target = next.querySelector('.detail-action-scenario');
    } else if (active.classList.contains('detail-action-copy')) {
      target = next.querySelector('.detail-action-copy');
    } else if (active.classList.contains('detail-action-manual-copy')) {
      target = next.querySelector('.detail-action-manual-copy');
    }
    if (!target) target = next.querySelector('.related-back');
    target.focus({preventScroll:true});
    // New related links can move the returned control below the modal viewport.
    // Scroll this dialog only, leaving the search page behind it untouched.
    const dialog=$('detail'),rect=target.getBoundingClientRect();
    const top=dialog.querySelector('.detail-toolbar').getBoundingClientRect().bottom+8;
    const bottom=dialog.getBoundingClientRect().bottom-8;
    if(rect.top<top)dialog.scrollTop+=rect.top-top;
    else if(rect.bottom>bottom)dialog.scrollTop+=rect.bottom-bottom;
  }
}
function updateModalNav() {
  const prevBtn = $('nav-prev-case'), nextBtn = $('nav-next-case');
  if (!prevBtn || !nextBtn) return;
  const context = $('detail-result-context');
  if(context){
    const index=currentFiltered.findIndex(item=>item.id===currentDetailItem?.id);
    const collection=failedPaths.length?'已載入結果':'目前結果';
    context.textContent=!discoveryReady ? '其他案例載入中'
      : index<0 ? (failedPaths.length?'不在已載入結果中':'不在目前結果中')
      : `${collection} ${index+1}／${currentFiltered.length}`;
  }
  const neighbours = detailNeighbours(currentDetailItem, currentFiltered);
  [[prevBtn, neighbours.prev, '上一則案例'], [nextBtn, neighbours.next, '下一則案例']].forEach(([button, target, label]) => {
    button.disabled = !target;
    button.title = target ? label + '：' + target.title : label + (discoveryReady ? '：目前結果中沒有可切換的案例' : '：其他案例仍在載入');
    button.setAttribute('aria-label', button.title);
  });
}
function navStep(delta) {
  const neighbours = detailNeighbours(currentDetailItem, currentFiltered);
  const target = delta === -1 ? neighbours.prev : delta === 1 ? neighbours.next : null;
  if (target) showDetail(target, null, true);
}
// Reading positions belong to a history visit, not a case or permanent storage.
function createReadingHistory(limit=12) {
  const views=new Map();
  return {
    save(key,item,query,view){
      views.delete(key);views.set(key,{id:item.id,markdown:item.markdown,query,view});
      if(views.size>limit)views.delete(views.keys().next().value);
    },
    read(key,item,query){
      const saved=views.get(key);
      return saved&&saved.id===item.id&&saved.markdown===item.markdown&&saved.query===query?saved.view:null;
    }
  };
}
const readingHistory=createReadingHistory();
let currentReadingVisit=null,currentReadingQuery='';
const readingDisclosures=['.reader-guidance','.research-details','.reader-review','.reader-outline'];
function readingNodes(selector) {
  return [...$('detail-body').querySelectorAll(selector)].filter(node=>
    !node.closest('.detail-load-status,.related-cases,.case-share-feedback,.reader-copy'));
}
function readingFocusNodes() {
  return [...$('detail-body').querySelectorAll(readingFocusSelector)].filter(node=>
    !node.closest('.detail-load-status,.case-share-feedback,.reader-copy-status,.reader-copy-manual'));
}
function readingNodeRef(node,nodes) {
  return node?{index:nodes.indexOf(node),id:node.id,relatedId:node.dataset.relatedId,href:node.tagName==='A'?node.href:null,tag:node.tagName,text:node.textContent}:null;
}
function resolveReadingNode(ref,nodes) {
  if(!ref)return null;
  const same=node=>node&&node.tagName===ref.tag&&node.textContent===ref.text&&(!ref.id||node.id===ref.id)&&(!ref.relatedId||node.dataset.relatedId===ref.relatedId)&&(!ref.href||node.href===ref.href);
  if(same(nodes[ref.index]))return nodes[ref.index];
  const matches=nodes.filter(same);
  return matches.length===1?matches[0]:null;
}
const readingBlockSelector='h2,h3,p,li,pre,summary,.markdown-table';
const readingFocusSelector='button,a,input,textarea,select,summary,[tabindex]';
function rememberReadingView() {
  const dialog=$('detail');
  if(!dialog.open||!currentReadingVisit||!currentDetailItem)return;
  const edge=dialog.querySelector('.detail-toolbar').getBoundingClientRect().bottom;
  const blocks=readingNodes(readingBlockSelector);
  const anchor=selectReadingAnchor(blocks,edge+8,dialog.getBoundingClientRect().bottom-8);
  const active=document.activeElement,rect=active.getBoundingClientRect();
  const focusVisible=rect.height>0&&rect.top>=dialog.getBoundingClientRect().top&&rect.bottom<=dialog.getBoundingClientRect().bottom;
  readingHistory.save(currentReadingVisit,currentDetailItem,currentReadingQuery,{
    scrollTop:dialog.scrollTop,
    open:readingDisclosures.map(selector=>!!$('detail-body').querySelector(selector)?.open),
    outlineQuery:$('reader-outline-query')?.value||'',
    anchor:readingNodeRef(anchor,blocks),offset:anchor?anchor.getBoundingClientRect().top-edge:0,
    focus:focusVisible?readingNodeRef(active,readingFocusNodes()):null,
    toolbarFocus:focusVisible&&active.closest('.detail-toolbar')?active.id:null,
    tables:[...$('detail-body').querySelectorAll('.markdown-table')].map(node=>node.scrollLeft)
  });
}
function restoreReadingView(view) {
  const dialog=$('detail'),body=$('detail-body');
  const query=$('reader-outline-query');
  if(query){query.value=view.outlineQuery;query.dispatchEvent(new Event('input'));}
  readingDisclosures.forEach((selector,index)=>{const node=body.querySelector(selector);if(node)node.open=view.open[index];});
  body.querySelectorAll('.markdown-table').forEach((node,index)=>node.scrollLeft=view.tables[index]||0);
  dialog.scrollTop=view.scrollTop;
  const anchor=resolveReadingNode(view.anchor,readingNodes(readingBlockSelector));
  if(anchor?.getBoundingClientRect().height){
    dialog.scrollTop+=anchor.getBoundingClientRect().top-dialog.querySelector('.detail-toolbar').getBoundingClientRect().bottom-view.offset;
  }
  const focus=$(view.toolbarFocus)||resolveReadingNode(view.focus,readingFocusNodes());
  const visible=node=>{
    if(!node||node.disabled)return false;
    const rect=node.getBoundingClientRect();
    const top=node.closest('.detail-toolbar')?dialog.getBoundingClientRect().top:dialog.querySelector('.detail-toolbar').getBoundingClientRect().bottom;
    return rect.height>0&&rect.bottom>top&&rect.top<dialog.getBoundingClientRect().bottom;
  };
  const target=visible(focus)?focus:visible(anchor)?anchor:$('close-detail');
  if(!target.matches('button,a,input,textarea,select,summary,[tabindex]'))target.tabIndex=-1;
  target.focus({preventScroll:true});
}
function showDetail(item, trigger, updateURL=true) {
  if (!item) return;
  rememberReadingView();
  const visit=updateURL?null:history.state?.readerVisit;
  const readingView=readingHistory.read(visit,item,$('query').value);
  currentReadingVisit=readingView?visit:crypto.randomUUID();
  currentReadingQuery=$('query').value;
  if(trigger){
    lastTrigger=trigger;
    lastTriggerContext={id:item.id,area:trigger.closest('#drawn-case')?'drawn-case':'results',read:!!trigger.closest('.card-bottom')};
  }
  currentDetailItem = item;
  if($('missing-case'))$('missing-case').hidden=true;
  const toolbarId = $('detail-toolbar-id');
  if (toolbarId) toolbarId.textContent = item.id;
  const body = $('detail-body');
  body.replaceChildren();

  const metaBar = el('div', 'detail-header-meta');
  metaBar.append(
    el('span', 'detail-id-badge', item.id),
    el('span', 'detail-badge kind-' + item.kind, KIND[item.kind]),
    (()=>{ const b = el('span', 'detail-badge proof-badge', item.proof); b.dataset.proof = item.proof; const desc = PROOF_DEFINITIONS[item.proof] || item.proof; b.title = desc; b.setAttribute('role', 'note'); b.setAttribute('aria-label', '來源憑據：' + item.proof + '。' + desc); return b; })(),
    el('span', 'detail-badge scenario-badge', '情境：' + item.scenario)
  );
  metaBar.append(el('span','detail-badge',item.reviewedDate?'頁首核對 '+item.reviewedDate:'頁首未提供核對日'));
  body.append(metaBar);

  const title = el('h1', '', item.title);
  title.id = 'detail-title';
  title.tabIndex = -1;
  body.append(title);

  const actionRow = el('div', 'detail-actions');
  const copyBtn = el('button', 'btn-copy-link', '📋 複製案例連結');
  copyBtn.replaceChildren(el('span','print-action-long','📋 複製案例連結'),el('span','print-action-short','複製案例連結'));
  copyBtn.type = 'button';
  copyBtn.id = 'copy-case-link';
  copyBtn.setAttribute('aria-label','複製案例連結');
  copyBtn.setAttribute('aria-describedby','case-share-status');
  const shareFeedback=el('div','case-share-feedback');
  const shareStatus=el('p','case-share-status');shareStatus.id='case-share-status';
  shareStatus.setAttribute('role','status');shareStatus.setAttribute('aria-live','polite');shareStatus.setAttribute('aria-atomic','true');
  const manual=el('input','manual-share-link');manual.type='text';manual.readOnly=true;manual.hidden=true;
  manual.setAttribute('aria-label','案例分享網址，請手動複製');
  manual.setAttribute('aria-describedby','case-share-status');
  shareFeedback.append(shareStatus,manual);
  let shareRequest=0;
  copyBtn.addEventListener('click', async () => {
    const request=++shareRequest,focusAtRequest=document.activeElement;
    const isCurrent=()=>request===shareRequest&&copyBtn.isConnected&&$('detail').open&&currentDetailItem===item;
    const url=caseLink(location.href,item.id);
    manual.hidden=true;manual.value='';
    shareStatus.textContent='正在複製案例連結…';
    try{
      if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      if(!isCurrent())return;
      shareStatus.textContent='已複製案例連結，包含目前搜尋與篩選條件。';
    }catch{
      if(!isCurrent())return;
      shareStatus.textContent='無法自動複製。請手動複製下方網址；連結包含目前搜尋與篩選條件。';
      manual.value=url;manual.hidden=false;
      if(document.activeElement===focusAtRequest){manual.focus();manual.select();}
    }
  });
  const source = el('a', 'detail-source', '查看 GitHub 原始 Markdown ↗');
  source.replaceChildren(el('span','print-action-long','查看 GitHub 原始 Markdown ↗'),el('span','print-action-short','原始 Markdown ↗'));
  source.setAttribute('aria-label','查看 ' + item.id + ' 的 GitHub 原始 Markdown ↗');
  source.href = REPO + item.path;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  const printBtn=el('button','btn-copy-link','列印／存成 PDF');
  printBtn.replaceChildren(el('span','print-action-long','列印／存成 PDF'),el('span','print-action-short','列印／PDF'));
  printBtn.id='print-case';printBtn.type='button';
  printBtn.setAttribute('aria-describedby','print-case-hint');
  printBtn.addEventListener('click',()=>window.print());
  actionRow.append(copyBtn,printBtn,source);
  if (item.tags && item.tags.length) {
    const tagsRow = el('span', 'detail-tags-text', '標籤：' + item.tags.join('、'));
    actionRow.append(tagsRow);
  }
  actionRow.append(shareFeedback);
  const printHint=el('p','print-case-hint sr-only','列印完整原始研究與來源；可在列印視窗選擇存成 PDF。');
  printHint.id='print-case-hint';
  body.append(actionRow,printHint);
  const warningText=item.kind === 'pending' ? '待查線索：證據尚不足，不列成功或已完成案例。' : '來源報告與本庫建議流程請分開閱讀；收錄不代表獨立重現或取得執行授權。';
  const printMeta=el('div','reader-print-meta');
  const permanent=new URL(location.href);permanent.search='';permanent.hash='';permanent.searchParams.set('case',item.id);
  printMeta.append(el('span','','AI 用法實驗室 · 案例永久連結：'),el('a','',permanent.href));
  printMeta.lastChild.href=permanent.href;
  printMeta.append(el('p','',warningText));
  body.append(printMeta);

  body.append(el('p', 'detail-warning', warningText));

  const proofNote = el('div', 'detail-proof-note');
  proofNote.setAttribute('role', 'note');
  const proofTag = el('span', 'proof-note-tag', item.proof);
  proofTag.dataset.proof = item.proof;
  const proofDesc = el('span', 'proof-note-desc', PROOF_DEFINITIONS[item.proof] || '本庫未獨立重現，請核對原始報告與限制。');
  proofNote.append(proofTag, proofDesc);
  body.append(proofNote);

  const overview = el('div', 'plain-overview');
  [['可以幫你做什麼', item.what]].forEach(([label, text]) => {
    const section = el('section');
    section.append(el('h2', '', label), el('p', '', text));
    overview.append(section);
  });
  const targetUserText = item.targetUser || SCENARIO_TARGET_USERS[item.scenario];
  if (targetUserText) {
    const userSection = el('section', 'detail-target-user');
    userSection.append(el('h2', '', '適合對象'), el('p', '', targetUserText));
    overview.append(userSection);
  }
  if (item.coreGoal && item.coreGoal !== item.what) {
    const goalSection = el('section', 'detail-core-goal');
    goalSection.append(el('h2', '', '核心目標'), el('p', '', item.coreGoal));
    overview.append(goalSection);
  }
  if (item.difficulty) {
    const diffSection = el('section', 'detail-difficulty');
    diffSection.append(el('h2', '', '實作門檻'), el('p', '', DIFFICULTY_LABELS[item.difficulty] || item.difficulty));
    overview.append(diffSection);
  }
  if (!discoveryReady) {
    const status=el('p','detail-load-status','這篇已可閱讀。其他案例仍在載入，完成後會提供切換與延伸閱讀。');
    status.setAttribute('role','status');
    overview.append(status);
  }
  body.append(overview);

  const guidance = el('details', 'reader-guidance');
  guidance.append(el('summary', '', '💡 本庫入門建議：怎麼開始與注意事項（非實測結果）'));
  const guidanceGrid = el('div', 'guidance-grid');
  [['怎麼開始', item.how, 'guidance-how'], ['要注意什麼', item.caution, 'guidance-caution']].forEach(([label, text, cls]) => {
    const section = el('section', 'guidance-card ' + cls);
    section.append(el('h2', '', (label === '怎麼開始' ? '🚀 ' : '⚠️ ') + label), el('p', '', text));
    guidanceGrid.append(section);
  });
  guidance.append(guidanceGrid);
  body.append(guidance);
  const research = el('details', 'research-details');
  const toggle = el('summary', '', '查看原始研究、來源與完整提示詞');
  research.append(toggle, el('p', 'research-title', item.id + ' · ' + item.originalTitle), renderMarkdown(item.markdown, item.path));
  for(const link of research.querySelectorAll('a[href^="http"]')){
    if(link.textContent.trim()===link.getAttribute('href'))link.classList.add('reader-visible-url');
  }
  body.append(research);
  globalThis.CaseReader?.enhance(body, item, tokenize($('query').value).map(term=>({term,variants:termVariants(term)})));
  body.append(renderRelated(item));

  updateModalNav();

  if (!$('detail').open) $('detail').showModal();
  syncPageContext();
  $('detail').scrollTop = 0;
  title.focus({preventScroll:true});
  if (updateURL) {
    const url = new URL(location.href);
    url.searchParams.set('case', item.id);
    history.pushState({...history.state, caseReturn:lastTriggerContext,readerVisit:currentReadingVisit}, '', url);
  }else history.replaceState({...history.state,readerVisit:currentReadingVisit},'',location.href);
  if(readingView)restoreReadingView(readingView);
}
function restoreDetailFocus(){
  if(lastTrigger?.isConnected){lastTrigger.focus({preventScroll:true});return;}
  if(lastTriggerContext){
    const node=[...$(lastTriggerContext.area).querySelectorAll('.card')].find(card=>card.dataset.caseId===lastTriggerContext.id);
    const trigger=node?.querySelector(lastTriggerContext.read?'.card-bottom button':'h3 button');
    if(trigger){lastTrigger=trigger;trigger.focus({preventScroll:true});return;}
  }
  revealSearch(true);
}
function closeDetail() {
  currentReadingVisit=null;
  if ($('detail').open) $('detail').close();
  const url = new URL(location.href);
  url.searchParams.delete('case');
  history.replaceState(null, '', url);
  updateMissingCase();
  syncPageContext();
  restoreDetailFocus();
}
// Explanations use the existing matching rules; they never rank or qualify evidence.
function contextExcerpt(text, variant, limit=96) {
  const chars=Array.from(text), index=norm(text).indexOf(variant);
  if(chars.length<=limit)return text;
  // Map the normalized offset back to original code points (NFKC can change length).
  let low=0,high=chars.length;
  while(low<high){
    const mid=Math.floor((low+high)/2);
    if(norm(chars.slice(0,mid+1).join('')).length<=index)low=mid+1;
    else high=mid;
  }
  const start=Math.max(0,Math.min(low-32,chars.length-limit));
  return (start?'…':'')+chars.slice(start,start+limit).join('')+(start+limit<chars.length?'…':'');
}
function searchContext(item, terms) {
  if(!terms.length)return {matches:[],remaining:0};
  const fields=[
    ['標題',item.title],['用途',item.summary],['案例編號',idVariants(item.id)],
    ['分類',item.category],['標籤',(item.tags||[]).join('、')],
    ['提及工具',(item.tools||[]).join('、')],['情境',item.scenario],['收錄狀態',KIND[item.kind]]
  ].map(([label,text])=>({label,text:text||'',original:false}));
  let section='頁首資料';
  for(const line of (item.markdown||'').split('\n')){
    if(!line.trim())continue;
    const heading=line.match(/^(#{1,6})\s+(.+)/);
    if(heading&&heading[1].length>1)section=clean(heading[2]);
    fields.push({label:'原文 · '+(heading?.[1].length===1?'標題':section),text:line.replace(/^(?:#{1,6}\s+|[-*>]\s+|\d+\.\s+)/,'').trim(),original:true});
  }
  const matches=[];
  for(const term of [...new Set(terms)]){
    const variants=termVariants(term);
    for(const field of fields){
      const text=norm(field.text),variant=variants.find(v=>text.includes(v));
      if(!variant)continue;
      matches.push({term,variant,label:field.label,excerpt:field.original?contextExcerpt(field.text,variant):''});
      break;
    }
  }
  return {matches:matches.slice(0,2),remaining:Math.max(0,matches.length-2)};
}
function renderSearchContext(item, terms) {
  const context=searchContext(item,terms);
  if(!context.matches.length)return null;
  const box=el('div','search-context');
  box.append(el('p','search-context-title',context.matches.some(match=>match.excerpt)?'搜尋命中 · 原文節錄':'搜尋命中'));
  context.matches.forEach(match=>{
    const row=el('div','search-context-match');
    const relation=match.term===match.variant?'「'+match.term+'」':'「'+match.term+'」→「'+match.variant+'」';
    row.append(el('p','search-context-label',relation+' · '+match.label));
    if(match.excerpt)row.append(el('p','search-context-excerpt',match.excerpt));
    box.append(row);
  });
  if(context.remaining)box.append(el('p','search-context-more','另有 '+context.remaining+' 個關鍵字符合；可開啟原文核對。'));
  return box;
}

function card(item, terms=[]) {
  const node = el('article', 'card');
  node.dataset.kind = item.kind;node.dataset.caseId=item.id;node.dataset.proof=item.proof;
  const top = el('div', 'card-top');
  const topInfo = el('span', 'card-id-tool', item.id + (item.tools.length ? ' · ' + item.tools.slice(0, 2).join(' / ') : ''));
  const badgesWrap = el('div', 'card-top-badges');
  if(item.scenario){
    const scenarioBadge = el('span', 'card-scenario', item.scenario);
    scenarioBadge.dataset.scenario = item.scenario;
    badgesWrap.append(scenarioBadge);
  }
  if(item.difficulty){
    const diffBadge = el('span', 'card-difficulty', item.difficulty);
    diffBadge.dataset.difficulty = item.difficulty;
    diffBadge.title = DIFFICULTY_LABELS[item.difficulty] || item.difficulty;
    diffBadge.setAttribute('aria-label', '實作門檻：' + (DIFFICULTY_LABELS[item.difficulty] || item.difficulty));
    badgesWrap.append(diffBadge);
    if(DIFFICULTY_NOTES[item.difficulty]){
      const diffNote = el('span', 'card-difficulty-note', DIFFICULTY_NOTES[item.difficulty]);
      diffNote.dataset.difficulty = item.difficulty;
      diffNote.setAttribute('aria-hidden', 'true');
      badgesWrap.append(diffNote);
    }
  }
  const kindBadge = el('span', 'kind', KIND[item.kind]);
  badgesWrap.append(kindBadge);
  top.append(topInfo, badgesWrap);
  node.append(top);

  const h = el('h3');
  const title = el('button', '', item.title);
  title.type = 'button';
  title.addEventListener('click', () => showDetail(item, title));
  h.append(title);
  node.append(h);
  if(item.coreGoal && item.coreGoal !== item.summary && item.coreGoal !== item.title){
    const goalP = el('p', 'card-goal', '🎯 解決痛點：' + item.coreGoal);
    node.append(goalP);
  }
  node.append(el('p', 'summary', item.summary));
  const reviewed=el('p','review-date');
  if(item.reviewedDate){const time=el('time','',item.reviewedDate);time.dateTime=item.reviewedDate;reviewed.append(document.createTextNode('頁首核對 '),time);}
  else reviewed.textContent='頁首未提供核對日';
  node.append(reviewed);
  const context=renderSearchContext(item,terms);
  if(context)node.append(context);

  const tagsWrap = el('div', 'tags');
  const scenarioTag = el('button', 'tag tag-scenario', item.scenario);
  scenarioTag.type = 'button';
  scenarioTag.title = activeScenario === item.scenario ? '取消此情境篩選' : '依此情境篩選，保留其他條件';
  scenarioTag.setAttribute('aria-label', '情境篩選：' + item.scenario);
  scenarioTag.setAttribute('aria-pressed', String(activeScenario === item.scenario));
  scenarioTag.addEventListener('click', e => {
    e.stopPropagation();
    refineFromCard('scenario', item.scenario);
  });
  tagsWrap.append(scenarioTag);

  const displayTags = (item.tags || []).slice(0, 2);
  displayTags.forEach(t => {
    const tagBtn = el('button', 'tag tag-interactive', t);
    tagBtn.type = 'button';
    tagBtn.title = '搜尋「' + t + '」，保留其他篩選';
    tagBtn.setAttribute('aria-label', tagBtn.title);
    tagBtn.addEventListener('click', e => {
      e.stopPropagation();
      refineFromCard('query', t);
    });
    tagsWrap.append(tagBtn);
  });
  node.append(tagsWrap);

  const bottom = el('div', 'card-bottom');
  const read = el('button', '', item.kind === 'pending' ? '查看這個想法 →' : '看看怎麼用 →');
  read.type = 'button';
  read.setAttribute('aria-label', '閱讀 ' + item.id + ' ' + item.title);
  read.addEventListener('click', () => showDetail(item, read));
  const proofBadge = el('span', 'proof', item.proof);proofBadge.dataset.proof = item.proof;
  proofBadge.setAttribute('role', 'note');
  proofBadge.title = PROOF_DEFINITIONS[item.proof] || item.proof;
  proofBadge.setAttribute('aria-label', '來源憑據：' + item.proof + '。' + (PROOF_DEFINITIONS[item.proof] || ''));
  bottom.append(proofBadge, read);
  node.append(bottom);
  return node;
}
// Keep a nearby route back to refinement without hiding or reordering results.
function resultCards(items, terms) {
  const nodes=[];
  items.forEach((item,index)=>{
    nodes.push(card(item,terms));
    if((index+1)%6===0||index===items.length-1){
      const row=el('div','results-return');
      const link=el('a','','回到搜尋與篩選 ↑');
      link.href='#explore';
      link.dataset.resultsReturn=String(index+1);
      link.addEventListener('click',enterSearch);
      row.append(link);nodes.push(row);
    }
  });
  return nodes;
}
function enterSearch(event) {
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  allowAutomaticArrival=false;
  const url=new URL(location.href);
  url.hash='explore';
  history.replaceState(history.state,'',url);
  $('explore').scrollIntoView({block:'start',behavior:'instant'});
  $('query').focus({preventScroll:true});
}
function filterEntries(items, terms, filters) {
  return items.filter(item => terms.every(term => termVariants(term).some(v => item.search.includes(v))) && (!filters.kind || item.kind === filters.kind) && (!filters.difficulty || item.difficulty === filters.difficulty) && (!filters.tool || item.tools.includes(filters.tool)) && (!filters.category || item.category === filters.category) && (!filters.scenario || item.scenario === filters.scenario) && (!filters.proof || item.proof === filters.proof));
}

/* Rank only existing matches; evidence status, popularity and frequency are not scores. */
function rankEntries(items, terms) {
  if (!terms.length) return items.slice();
  const queries = [...new Set(terms)].map(term => ({term, variants:termVariants(term)}));
  return items.map((item, index) => {
    const title = norm(item.title || '');
    const summary = norm(item.summary || '');
    const fields = [item.category, item.scenario, ...(item.tags || []), ...(item.tools || [])].map(value => norm(value || ''));
    const id = norm(item.id || '');
    const score = [0, 0, 0, 0];
    queries.forEach(({term, variants}) => {
      if (variants.includes(id)) score[0]++;
      const inTitle = variants.some(variant => title.includes(variant));
      const inSummary = variants.some(variant => summary.includes(variant));
      if (inTitle || inSummary) score[1]++;
      if (inTitle) score[2]++;
      if (variants.some(variant => fields.some(field => field.includes(variant)))) score[3]++;
    });
    return {item, index, score};
  }).sort((a, b) => {
    for (let i = 0; i < a.score.length; i++) {
      if (a.score[i] !== b.score[i]) return b.score[i] - a.score[i];
    }
    return a.index - b.index;
  }).map(result => result.item);
}

function orderEntries(items, terms, sort) {
  const ranked=rankEntries(items,terms);
  return sort==='reviewed' ? ranked.sort((a,b)=>(b.reviewedDate||'').localeCompare(a.reviewedDate||'')) : ranked;
}
const reviewSort = value => value==='reviewed' ? value : '';
function filterSummary(count, sort) {
  const filters=count ? `已套用 ${count} 項篩選` : '未設定篩選';
  return filters+(reviewSort(sort) ? ' · 頁首最近核對' : '');
}
function resetSort() {
  $('sort').value='';
  render();
  focusResults();
}

const SOURCE_TYPES = Object.freeze({
  '作者報告／示範':'依作者的使用敘述或展示整理；實際產物、完整過程與成效仍須逐案核對。',
  '官方自報':'包含官方的能力說明或案例自報；適用版本、條件與實際成效請看原文。',
  '公開資料核讀':'依可讀的公開資料整理；核讀資料不等於證實成效，請查看原始來源與限制。',
  '模板／文件核讀':'依模板或文件整理可參考的做法；文件列出功能，不代表已完成實作或驗收。',
  '尚待查證':'仍有證據缺口，請先看待查事項；不要把想法當成已驗證的做法。'
});
function sourceTypeMessage(type) {
  if(!type)return '來源標籤不是獨立驗證。本庫未獨立重現，請核對原始報告與限制。';
  const description=Object.hasOwn(SOURCE_TYPES,type)?SOURCE_TYPES[type]:'此類型未列入說明，請核對原文與限制。';
  return type+'：'+description+' 本庫未獨立重現。';
}
const FILTER_LABELS = {query:'關鍵字',scenario:'使用情境',kind:'收錄狀態',difficulty:'實作門檻',tool:'提及工具',category:'主題分類',proof:'來源類型'};
function activeConditions(query, filters) {
  return Object.entries({query, ...filters}).filter(([,value]) => value)
    .map(([key,value]) => ({key,value,label:FILTER_LABELS[key],display:key==='kind' ? KIND[value] || value : value}));
}
function relaxationOptions(items, terms, filters) {
  return Object.entries(filters).filter(([,value])=>value).map(([key,value]) => ({
    key, value, count:filterEntries(items,terms,{...filters,[key]:''}).length
  })).filter(option=>option.count>0).sort((a,b)=>a.count-b.count);
}
function queryRelaxationOptions(items, query, filters) {
  const words=tokenize(query);
  if(words.length<2)return [];
  const seen=new Set();
  return words.map((removed,index)=>{
    const candidate=words.filter((_,i)=>i!==index).join(' ');
    if(seen.has(candidate))return null;
    seen.add(candidate);
    const terms=tokenize(candidate);
    if(!terms.length)return null;
    const count=filterEntries(items,terms,filters).length;
    return count ? {query:candidate,removed,count} : null;
  }).filter(Boolean).sort((a,b)=>b.count-a.count);
}
// Only broaden an empty intersection when no single removal can recover it.
// At most five facets: search smallest removal sets first, preserving the query.
function combinedRelaxationOptions(items, terms, filters) {
  const matches=filterEntries(items,terms,{});
  if(!matches.length || filterEntries(matches,[],filters).length || relaxationOptions(matches,[],filters).length)return [];
  const conditions=Object.entries(filters).filter(([key,value])=>key!=='query' && Object.hasOwn(FILTER_LABELS,key) && value)
    .map(([key,value])=>({key,value}));
  for(let size=2;size<=conditions.length;size++){
    const options=[];
    const visit=(start,removed)=>{
      if(removed.length===size){
        const remaining={...filters};
        removed.forEach(({key})=>remaining[key]='');
        const count=filterEntries(matches,[],remaining).length;
        if(count)options.push({conditions:removed,count});
        return;
      }
      for(let i=start;i<=conditions.length-(size-removed.length);i++)visit(i+1,[...removed,conditions[i]]);
    };
    visit(0,[]);
    if(options.length)return options.sort((a,b)=>a.count-b.count);
  }
  return [];
}
// Count alternatives against the query and every OTHER facet, once per facet.
// The all-option is the base length, never a sum of multi-valued tool buckets.
function facetCounts(items, terms, filters, key, values) {
  const base=filterEntries(items,terms,{...filters,[key]:''});
  const counts=new Map();
  for(const item of base){
    const options=key==='tool' ? new Set(item.tools) : [item[key]];
    for(const value of options) counts.set(value,(counts.get(value)||0)+1);
  }
  return values.map(value=>value ? counts.get(value)||0 : base.length);
}
// A local name finder, separate from full-text case search and URL state.
function findCategories(values, query, limit=8) {
  const terms=norm(query).trim().split(/\s+/).filter(Boolean);
  if(!terms.length)return {total:0,matches:[]};
  const matches=values.filter(({value})=>value && terms.every(term=>norm(value).includes(term)))
    .sort((a,b)=>(Number(b.count>0)-Number(a.count>0)) || a.value.localeCompare(b.value,'zh-Hant'));
  return {total:matches.length,matches:matches.slice(0,limit)};
}
function renderCategoryFinder() {
  const input=$('category-query'),status=$('category-find-status'),list=$('category-matches');
  const focusedValue=list.contains(document.activeElement)?document.activeElement.dataset.categoryValue:null;
  list.replaceChildren();
  if(!input.value.trim()){status.textContent='輸入字詞，縮小分類選項。';return;}
  if(!discoveryReady){status.textContent=initialLoading?'正在讀取分類；輸入內容會保留，載入後顯示選項。':'分類尚未載入；請先使用下方「重新載入」，輸入內容會保留。';return;}
  const loadedNames=new Set(entries.map(item=>item.category));
  const values=[...$('category').options].filter(option=>option.value && loadedNames.has(option.value)).map(option=>({value:option.value,count:Number(option.dataset.count)||0}));
  const result=findCategories(values,input.value);
  const scope=failedPaths.length?'（只含已載入來源）':'';
  status.textContent=result.total
    ? '找到 '+result.total+' 個分類'+scope+'。'+(result.total>result.matches.length?'先列 '+result.matches.length+' 個；可增加字詞縮小範圍。':'')+'筆數保留案例關鍵字與其他篩選；0 筆也可選。'
    : '沒有名稱符合的分類'+scope+'。試著縮短字詞，或用上方案例搜尋找全文。';
  for(const {value,count} of result.matches){
    const button=el('button','category-match');button.type='button';button.dataset.categoryValue=value;
    button.setAttribute('aria-pressed',String($('category').value===value));
    button.append(el('span','',value),el('span','category-match-count',count+' 筆'));
    button.addEventListener('click',()=>{
      $('category').value=value;
      render();
      // The picker is rebuilt by render; return to the stable selected control.
      $('category').focus({preventScroll:true});$('category').scrollIntoView({block:'nearest',behavior:'instant'});
    });
    list.append(button);
  }
  if(focusedValue){
    const replacement=[...list.children].find(button=>button.dataset.categoryValue===focusedValue);
    (replacement||input).focus({preventScroll:true});
  }
}
function renderFacetCounts(terms, filters) {
  const hint=$('facet-count-hint');
  hint.textContent=!discoveryReady
    ? '案例載入完成後，會顯示各選項的符合筆數。'
    : failedPaths.length
      ? '筆數只計已載入條目；補讀後會更新。選項前的數字是符合筆數，保留關鍵字與其他篩選；工具與分類先列有結果的選項，0 筆也可選。'
      : '選項前的數字是符合筆數，保留關鍵字與其他篩選；工具與分類先列有結果的選項，0 筆也可選。';
  for(const key of ['scenario','kind','difficulty','tool','category','proof']){
    const select=$(key);
    if(!select) continue;
    // Keep unfamiliar shared scenarios visible, rather than showing an empty field.
    if(key==='scenario' && activeScenario && ![...select.options].some(o=>o.value===activeScenario)){
      const option=el('option','',activeScenario);option.value=activeScenario;select.append(option);
      select.value=activeScenario;
    }
    const options=[...select.options];
    const counts=discoveryReady ? facetCounts(entries,terms,filters,key,options.map(o=>o.value)) : [];
    options.forEach((option,index)=>{
      // HTML options without a value attribute derive their value from the label.
      // Freeze it before adding counts so filters and URLs keep the raw value.
      option.value=option.value;
      if(!option.dataset.label)option.dataset.label=option.textContent;
      option.dataset.count=discoveryReady ? String(counts[index]) : '';
      option.textContent=(discoveryReady ? counts[index]+' · ' : '')+option.dataset.label;
    });
    if(discoveryReady && ['tool','category'].includes(key)) groupFacetOptions(select,counts);
  }
  renderCategoryFinder();
}
// Keep platform-native selection and every zero-result alternative available.
function groupFacetOptions(select,counts) {
  const selected=select.value;
  const options=[...select.options];
  const buckets=[[],[]];
  options.slice(1).forEach((option,index)=>buckets[counts[index+1]>0?0:1].push(option));
  const children=[options[0]];
  buckets.forEach((bucket,index)=>{
    if(!bucket.length)return;
    const group=el('optgroup');
    group.label=(index===0?'有符合條目':'目前 0 筆')+'（'+bucket.length+' 個選項）';
    bucket.sort((a,b)=>a.value.localeCompare(b.value,'zh-Hant'));
    group.append(...bucket);
    children.push(group);
  });
  select.replaceChildren(...children);
  select.value=selected;
}
const SEARCH_KEYS=['q','scenario','kind','difficulty','tool','category','proof'];
function searchLink(href,query,filters,sort='') {
  const current=new URL(href);
  const url=new URL(current.pathname,current.origin);
  if(query)url.searchParams.set('q',query);
  SEARCH_KEYS.slice(1).forEach(key=>{if(filters[key])url.searchParams.set(key,filters[key]);});
  if(reviewSort(sort))url.searchParams.set('sort',sort);
  url.hash='explore';
  return url.href;
}
// Share only supported reading state, never arbitrary parameters or fragments.
function caseLink(href,id) {
  const current=new URL(href),params=current.searchParams;
  const filters=Object.fromEntries(SEARCH_KEYS.slice(1).map(key=>[key,params.get(key)||'']));
  const url=new URL(searchLink(href,params.get('q')||'',filters,params.get('sort')||''));
  url.searchParams.set('case',id);
  return url.href;
}
function hasSearchArrival(params,hash) {
  if(hash)return hash==='#explore';
  return SEARCH_KEYS.some(key=>(params.get(key)||'').trim())||params.get('sort')==='reviewed';
}
function currentSearchLink() {
  const filters=Object.fromEntries(['kind','difficulty','tool','category','proof'].map(id=>[id,$(id)?.value||'']));
  filters.scenario=activeScenario;
  return searchLink(location.href,$('query').value,filters,$('sort').value);
}
let searchComposing = false, categoryComposing = false;
function submitSearch(event) {
  event.preventDefault();
  if (!discoveryReady || searchComposing || event.isComposing || categoryComposing || (document.activeElement?.id==='category-query' && event.submitter?.id!=='search-submit')) return;
  allowAutomaticArrival = false;
  const url = new URL(location.href);
  url.hash = 'explore';
  history.replaceState(history.state, '', url);
  focusLoadedResults('start');
}
function revealSearch(resultsOnly=false) {
  // Compact only an initial, untouched arrival that cannot show its results.
  // Keep readable controls and their values; explicit returns preserve choices.
  const panel=$('filter-options');
  if(!resultsOnly && panel.open && !panel.contains(document.activeElement) &&
    $('results-count').getBoundingClientRect().bottom-$('explore').getBoundingClientRect().top>innerHeight-24)panel.open=false;
  const target=$(resultsOnly?'results-count':'search-title');
  (resultsOnly?$('results-count'):$('explore')).scrollIntoView({block:'start',behavior:'instant'});
  target.focus({preventScroll:true});
}
// Only report an absent shared case once every source has been read.
function updateMissingCase() {
  const notice=$('missing-case');
  if(!notice)return;
  const params=new URLSearchParams(location.search),target=params.get('case');
  notice.hidden=!discoveryReady||!!failedPaths.length||!params.has('case')||!!matchCase(target);
  if(notice.hidden)return;
  const label=(target||'').trim();
  const display=Array.from(label).slice(0,80).join('')+(Array.from(label).length>80?'…':'');
  const message=label?
    '已讀取全部來源，但沒有找到「'+display+'」。請確認分享的案例編號，或向分享者索取完整連結。':
    '分享連結沒有提供案例編號。請向分享者索取完整連結，或從下方搜尋開始。';
  if($('missing-case-message').textContent!==message)$('missing-case-message').textContent=message;
}
function focusMissingCase() {
  const title=$('missing-case-title');
  title.focus({preventScroll:true});
  $('missing-case').scrollIntoView({block:'start',behavior:'instant'});
}
function finishArrival(params,failed=false) {
  const missing=$('missing-case')&&!$('missing-case').hidden;
  const shouldMove=allowAutomaticArrival&&(missing||hasSearchArrival(params,location.hash)||(failed&&params.has('case')));
  allowAutomaticArrival=false;
  if(shouldMove){if(missing)focusMissingCase();else revealSearch();}
}
function clearSearchShare() {
  searchShareRequest++;
  $('search-share-status').textContent='';
  $('search-share-url').hidden=true;
  $('search-share-url').value='';
}
async function copySearchLink() {
  if(!discoveryReady)return;
  clearSearchShare();
  const request=searchShareRequest,focusAtRequest=document.activeElement;
  const url=currentSearchLink();
  $('search-share-status').textContent='正在複製搜尋連結…';
  try {
    if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url);
    if(request!==searchShareRequest)return;
    $('search-share-status').textContent='已複製搜尋連結，包含目前關鍵字與篩選。';
  } catch {
    if(request!==searchShareRequest)return;
    $('search-share-status').textContent='無法自動複製，請手動複製下方搜尋網址。';
    const manual=$('search-share-url');
    manual.value=url;manual.hidden=false;
    if(document.activeElement===focusAtRequest){manual.focus();manual.select();}
  }
}

function focusResults() {
  $('results-count').focus();
}
function refineFromCard(key, value) {
  if (key === 'scenario') activeScenario = activeScenario === value ? '' : value;
  else if (key === 'query') $('query').value = value;
  else return;
  // Re-rendering removes the triggering card. Hand focus to a stable result
  // summary, including when a combination is empty or starts at discovery.
  allowAutomaticArrival = false;
  render();
  $('results-count').focus({preventScroll:true});
  $('results-count').scrollIntoView({block:'start',behavior:'instant'});
}
function removeCondition(key) {
  if(key==='scenario')activeScenario='';
  else if(Object.hasOwn(FILTER_LABELS,key))$(key).value='';
  render();
  focusResults();
}
function removeConditions(conditions) {
  conditions.forEach(({key})=>{
    if(key==='scenario')activeScenario='';
    else if(['kind','difficulty','tool','category','proof'].includes(key))$(key).value='';
  });
  render();
  focusResults();
}
function clearFacets() {
  activeScenario='';
  ['kind','difficulty','tool','category','proof'].forEach(id=>{ if($(id)) $(id).value=''; });
  render();
  focusResults();
}
function renderSearchFeedback(terms, filters) {
  const conditions=activeConditions($('query').value,filters);
  const active=$('active-filters');
  active.replaceChildren();
  active.hidden=!discoveryReady||!conditions.length;
  conditions.forEach(condition=>{
    const button=el('button','active-filter');
    button.type='button';button.dataset.removeFilter=condition.key;
    button.setAttribute('aria-label','移除'+condition.label+'：'+condition.display);
    button.title=condition.label+'：'+condition.display;
    button.append(el('span','active-filter-value',condition.label+'：'+condition.display));
    const cross=el('span','active-filter-cross','×');cross.setAttribute('aria-hidden','true');button.append(cross);
    button.addEventListener('click',()=>removeCondition(condition.key));
    active.append(button);
  });
  const hasFacets=Object.values(filters).some(Boolean);
  $('search-feedback').hidden=!discoveryReady||!conditions.length;
  $('clear-facets').hidden=!hasFacets;
  $('clear-facets').textContent=$('query').value ? '清除篩選，保留關鍵字' : '清除所有篩選';
  const suggestions=$('empty-suggestions');suggestions.replaceChildren();
  if(!currentFiltered.length&&discoveryReady){
    const options=relaxationOptions(entries,terms,filters).slice(0,3);
    options.forEach(({key,value,count})=>{
      const button=el('button','recovery-option','移除'+FILTER_LABELS[key]+'「'+(key==='kind'?KIND[value]||value:value)+'」 → 查看 '+count+' 筆');
      button.type='button';button.dataset.removeFilter=key;
      button.addEventListener('click',()=>removeCondition(key));
      suggestions.append(button);
    });
    const combined=options.length ? [] : combinedRelaxationOptions(entries,terms,filters).slice(0,3);
    combined.forEach(({conditions,count})=>{
      const labels=conditions.map(({key,value})=>FILTER_LABELS[key]+'「'+(key==='kind'?KIND[value]||value:value)+'」');
      const button=el('button','recovery-option','一起移除'+labels.join('、')+' → 查看 '+count+' 筆');
      button.type='button';button.dataset.removeFilters=conditions.map(({key})=>key).join(',');
      button.addEventListener('click',()=>removeConditions(conditions));
      suggestions.append(button);
    });
    queryRelaxationOptions(entries,$('query').value,filters).slice(0,3).forEach(({query,removed,count})=>{
      const button=el('button','recovery-option','只移除關鍵字「'+removed+'」 → 查看 '+count+' 筆');
      button.type='button';
      button.dataset.queryRecovery=query;
      button.addEventListener('click',()=>{
        $('query').value=query;
        render();
        focusResults();
      });
      suggestions.append(button);
    });
    if(!options.length && !combined.length && terms.length){
      const problemContainer = el('div','empty-problem-suggestions');
      problemContainer.setAttribute('role','group');
      problemContainer.setAttribute('aria-label','推薦常見痛點關鍵字');
      const rawQ = $('query').value.trim();
      const displayQ = rawQ.length > 40 ? rawQ.slice(0, 40) + '…' : rawQ;
      const intro = el('p','empty-problem-intro',displayQ ? `目前沒有符合「${displayQ}」的案例，你可以從常見問題與真實案例開始：` : '你可以從常見痛點重新探索：');
      problemContainer.append(intro);
      const chipsWrap = el('div','empty-problem-chips');
      const problemTags = [
        {label:'郵件摘要 · 搜尋「郵件」', term:'郵件'},
        {label:'會議日報 · 搜尋「日報」', term:'日報'},
        {label:'自動客服 · 搜尋「客服」', term:'客服'},
        {label:'代碼審查 · 搜尋「代碼審查」', term:'代碼審查'},
        {label:'🧾 搜尋「發票」', term:'發票'},
        {label:'🛠️ 搜尋「除錯」', term:'除錯'},
        {label:'🏖️ 搜尋「旅遊」', term:'旅遊'},
        {label:'🏷️ 搜尋「比價」', term:'比價'}
      ];
      problemTags.forEach(({label, term})=>{
        const btn = el('button','recovery-option recovery-problem-tag',label);
        btn.type = 'button';
        btn.dataset.problemTag = term;
        btn.setAttribute('data-problem-tag', term);
        btn.setAttribute('aria-label', label);
        btn.addEventListener('click',()=>{
          $('query').value = term;
          render();
          focusResults();
        });
        chipsWrap.append(btn);
      });
      problemContainer.append(chipsWrap);
      suggestions.append(problemContainer);
    }
    $('empty-hint').textContent=suggestions.children.length && terms.length>1
      ? '關鍵字須同時符合；以下建議只調整指定條件，並保留其餘條件。'
      : combined.length
      ? '至少要一起移除 '+combined[0].conditions.length+' 項篩選才有結果。以下調整會保留關鍵字與其餘條件。'
      : options.length
      ? '每個條件都要符合才會顯示。試著只移除一項，其他條件會保留。'
      : hasFacets ? '目前條件沒有交集。可逐項移除上方條件，或清除篩選後保留關鍵字再找。'
      : '試著用更短的任務關鍵字，例如「旅遊」或「收件匣」。';
    if(failedPaths.length)$('empty-hint').textContent+=' 部分條目載入失敗，以下數量只計算已載入內容。';
  }
  $('edit-query').hidden=!$('query').value;
}

function render(updateURL=true, preserveShare=false) {
  if(!preserveShare)clearSearchShare();
  $('copy-search-link').disabled=!discoveryReady;
  $('search-submit').disabled=!discoveryReady;
  $('scenario').value=activeScenario;
  const q = tokenize($('query').value);
  const filters = Object.fromEntries(['kind', 'difficulty', 'tool', 'category', 'proof'].map(id => [id, $(id)?.value || '']));
  if (activeScenario) filters.scenario = activeScenario;
  const sourceNote=sourceTypeMessage(filters.proof);
  if($('source-type-note').textContent!==sourceNote)$('source-type-note').textContent=sourceNote;
  const facetCount = Object.values(filters).filter(Boolean).length;
  $('filter-count').textContent = filterSummary(facetCount, $('sort').value);
  const matches=filterEntries(entries,q,filters);
  currentFiltered = orderEntries(matches, q, $('sort').value);
  $('search-order-note').hidden = !discoveryReady || ($('sort').value!=='reviewed'&&(!q.length||!currentFiltered.length));
  $('search-order-controls').hidden=$('search-order-note').hidden;
  $('reset-sort').hidden=!discoveryReady||$('sort').value!=='reviewed';
  $('search-order-note').textContent=$('sort').value==='reviewed'
    ? '依頁首核對日由新到舊；不是發布日，也不代表新增或獨立驗證。正文補充不計；未提供者置後，同日保留原本的符合順序。'
    : '標題與用途優先；全文仍納入搜尋。排序不代表成果或證據可靠度。';
  $('results').replaceChildren(...resultCards(currentFiltered,q));
  // Sorting is a reading preference; keep the current discovery deck intact.
  syncDiscovery(rankEntries(matches,q));
  $('empty').hidden = !!currentFiltered.length || !discoveryReady;
  const rawQ = $('query').value.trim();
  const displayQ = rawQ.length > 40 ? rawQ.slice(0, 40) + '…' : rawQ;
  $('empty').querySelector('h3').textContent=failedPaths.length
    ?(displayQ?`已載入內容中目前沒有符合「${displayQ}」的案例`:'已載入內容中沒有符合的案例')
    :(displayQ?`目前沒有符合「${displayQ}」的案例`:'目前沒有符合的案例');
  renderSearchFeedback(q, filters);
  renderFacetCounts(q, filters);
  updatePartialLoad();
  const skipNote = failedPaths.length ? `（${failedPaths.length} 個來源檔案未載入）` : '';
  $('results-count').textContent = discoveryReady ? `顯示 ${currentFiltered.length} / ${entries.length} 筆收錄${skipNote}` : initialLoading ? '正在讀取案例，完成後會套用目前條件…' : '載入未完成';
  $('filter-outcome-count').textContent = discoveryReady
    ? currentFiltered.length ? `目前條件有 ${currentFiltered.length} 筆結果` : failedPaths.length ? '已載入內容中沒有符合結果' : '目前條件沒有符合結果'
    : initialLoading ? '正在讀取案例…' : '載入未完成';
  $('filter-view-results').disabled = !discoveryReady;

  document.querySelectorAll('.chip[data-scenario]').forEach(btn => {
    const isActive = btn.dataset.scenario === activeScenario;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  document.querySelectorAll('.chip[data-kind]').forEach(btn => {
    const isActive = $('kind').value === btn.dataset.kind;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  const currentQ = $('query').value.trim();
  document.querySelectorAll('.chip[data-query]').forEach(btn => {
    const isActive = currentQ === btn.dataset.query;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if (updateURL) {
    const url = new URL(location.href);
    ['query', 'kind', 'difficulty', 'tool', 'category', 'proof'].forEach(id => {
      const key = id === 'query' ? 'q' : id;
      if ($(id)?.value) url.searchParams.set(key, $(id).value); else url.searchParams.delete(key);
    });
    if (activeScenario) url.searchParams.set('scenario', activeScenario); else url.searchParams.delete('scenario');
    if(reviewSort($('sort').value))url.searchParams.set('sort','reviewed');else url.searchParams.delete('sort');
    history.replaceState(null, '', url);
  }
  syncPageContext();
}
function reset() {
  activeScenario = '';
  $('sort').value='';
  ['query', 'kind', 'difficulty', 'tool', 'category', 'proof'].forEach(id => { if($(id)) $(id).value = ''; });
  render();
}
function populate(id, values) {
  const node = $(id);
  node.replaceChildren(node.options[0]);
  [...new Set(values)].sort((a, b) => a.localeCompare(b, 'zh-Hant')).forEach(v => {
    const o = el('option', '', v);
    o.value = v;
    node.append(o);
  });
}
async function mapConcurrent(items, limit, workerFn) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const count = Math.min(Math.max(1, limit || 1), items.length);
  if (!items.length) return results;
  const workers = Array.from({ length: count }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await workerFn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}
function prioritizeSharedSource(paths,target) {
  const id=norm(target||'').trim().replace(/^#/, '').match(/^(?:([a-z]+)[\s-：:#.]*)?(\d+)$/);
  if(!id || (id[1] && !['uc','p'].includes(id[1])))return paths;
  const first=id[1]==='p' ? 'sources/pending.md' : paths.find(path=>new RegExp('^(?:cases|evidence)/'+id[2].padStart(3,'0')+'-').test(path));
  return first && paths.includes(first) ? [first,...paths.filter(path=>path!==first)] : paths;
}
// Server waiting instructions are a minimum, never a suggestion to retry sooner.
function sourceRetryDelay(value, minimum=500, now=Date.now()) {
  if(!value)return minimum;
  const delay=/^\d+$/.test(value.trim()) ? Number(value)*1000 : Date.parse(value)-now;
  return Number.isNaN(delay)?minimum:Math.max(minimum,delay);
}
function waitForSourceRetry(delay,signal) {
  if(signal?.aborted)return Promise.resolve(false);
  return new Promise(resolve=>{
    const finish=value=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);resolve(value);};
    const abort=()=>finish(false);
    const timer=setTimeout(()=>finish(true),delay);
    signal?.addEventListener('abort',abort,{once:true});
  });
}
async function loadCorpus(paths, options = {}) {
  const fetchFn = options.fetch || fetch;
  const parseFn = options.parseFile || parseFile;
  const batch = options.budget || options.signal ? new AbortController() : null;
  const abortBatch = () => batch.abort();
  const budgetTimer = options.budget ? setTimeout(abortBatch, options.budget) : null;
  if (options.signal?.aborted) abortBatch();
  else options.signal?.addEventListener('abort', abortBatch, {once:true});
  let completed=0, succeeded=0, entryCount=0;
  try {
    const results = await mapConcurrent(paths, options.concurrency || 16, async path => {
      let result;
      if (batch?.signal.aborted) result={ok:false,path};
      else {
        const controller=options.timeout || batch ? new AbortController() : null;
        const abortSource=()=>controller.abort();
        batch?.signal.addEventListener('abort',abortSource,{once:true});
        const timer=options.timeout ? setTimeout(abortSource,options.timeout) : null;
        try {
          let text;
          for(let attempt=0;attempt<2;attempt++) {
            let retryable=true,delay=options.retryDelay??500;
            try {
              const response=await fetchFn(path,{cache:'no-cache',...(controller?{signal:controller.signal}:{})});
              if(!response.ok){
                retryable=[408,429,500,502,503,504].includes(response.status);
                delay=sourceRetryDelay(response.headers?.get('Retry-After'),delay);
                throw Error('HTTP '+response.status);
              }
              text=await response.text();
              if(controller?.signal.aborted)throw Error('讀取已停止');
              break;
            } catch(error) {
              // One opt-in retry, within the original source and whole-load
              // deadlines. Longer server waits remain available for manual retry.
              if(!options.retryTransient||attempt||!retryable||controller?.signal.aborted||delay>2000)throw error;
              if(!await waitForSourceRetry(delay,controller?.signal))throw error;
            }
          }
          // A parse error is a content problem, never a transient network error.
          result={ok:true,path,entries:parseFn(path,text)};
        } catch(error) {
          if (!controller?.signal.aborted) console.warn(`無法讀取 ${path}：`,error);
          result={ok:false,path};
        } finally {
          if (timer!==null) clearTimeout(timer);
          batch?.signal.removeEventListener('abort',abortSource);
        }
      }
      completed++;
      if (result.ok) { succeeded++; entryCount+=result.entries.length; options.onSource?.(result.entries,result.path); }
      options.onProgress?.({completed,succeeded,entryCount,total:paths.length});
      return result;
    });
    return {entries:results.filter(r=>r.ok).flatMap(r=>r.entries),failed:results.filter(r=>!r.ok).map(r=>r.path)};
  } finally {
    if (budgetTimer!==null) clearTimeout(budgetTimer);
    options.signal?.removeEventListener('abort',abortBatch);
  }
}
// The bundle is only a transport: every original Markdown still goes through
// parseFile. An older/mixed deployment or a failed bundle uses the per-file path.
function parseCorpusBundle(bundle, paths, revision, parseFn) {
  if(bundle?.version!==1 || bundle.revision!==revision || !Array.isArray(bundle.sources) || bundle.sources.length!==paths.length)throw Error('全文整包版本不符');
  const allowed=new Set(paths),seen=new Set();
  const parsed=new Map();
  for(const source of bundle.sources){
    if(!allowed.has(source?.path)||seen.has(source.path)||typeof source.markdown!=='string')throw Error('全文整包來源不符');
    seen.add(source.path);
    parsed.set(source.path,parseFn(source.path,source.markdown));
  }
  return parsed;
}
async function loadInitialCorpus(paths, options = {}) {
  if(typeof options.bundleRevision!=='string'||!options.bundleRevision)return loadCorpus(paths,options);
  const fetchFn=options.fetch||fetch,parseFn=options.parseFile||parseFile;
  const controller=new AbortController(),sharedController=new AbortController();
  const abort=()=>{controller.abort();sharedController.abort();};
  const deadline=Date.now()+(options.budget||20000);
  const timer=setTimeout(abort,Math.max(1,deadline-Date.now()));
  if(options.signal?.aborted)abort();else options.signal?.addEventListener('abort',abort,{once:true});
  const successful=new Map();
  let completedFallback=0,sharedFinished=false,inFallback=false,lastCompleted=0;
  const progress=()=>{
    lastCompleted=Math.max(lastCompleted,successful.size,inFallback?completedFallback+Number(sharedFinished):0);
    options.onProgress?.({completed:lastCompleted,succeeded:successful.size,entryCount:[...successful.values()].reduce((n,items)=>n+items.length,0),total:paths.length});
  };
  const remember=(path,items)=>{
    if(successful.has(path))return;
    successful.set(path,items);options.onSource?.(items);
  };
  const perFileOptions={...options,fetch:fetchFn,parseFile:parseFn};
  const sharedPath=paths.includes(options.sharedPath)?options.sharedPath:null;
  const shared=sharedPath ? loadCorpus([sharedPath],{...perFileOptions,signal:sharedController.signal,budget:Math.max(1,deadline-Date.now()),onSource:items=>remember(sharedPath,items),onProgress:undefined}).then(()=>{sharedFinished=true;progress();}) : Promise.resolve();
  try {
    const bundleController=new AbortController();
    const abortBundle=()=>bundleController.abort();
    controller.signal.addEventListener('abort',abortBundle,{once:true});
    if(controller.signal.aborted)abortBundle();
    const bundleTimer=setTimeout(abortBundle,Math.min(options.bundleTimeout||2500,Math.max(1,deadline-Date.now())));
    let bundled=false;
    try {
      const response=await fetchFn('corpus.json',{cache:'no-cache',signal:bundleController.signal});
      if(!response.ok)throw Error('HTTP '+response.status);
      const data=await response.json();
      if(bundleController.signal.aborted)throw Error('全文整包讀取已停止');
      const parsed=parseCorpusBundle(data,paths,options.bundleRevision,parseFn);
      if(controller.signal.aborted)throw Error('讀取已停止');
      for(const path of paths){remember(path,parsed.get(path));progress();}
      bundled=true;
    }catch(error){
      if(!controller.signal.aborted)console.warn('全文整包未能使用，改為逐篇讀取：',error);
    }finally{clearTimeout(bundleTimer);controller.signal.removeEventListener('abort',abortBundle);}
    if(bundled)sharedController.abort();
    else if(!controller.signal.aborted){
      const pending=paths.filter(path=>!successful.has(path)&&path!==sharedPath);
      inFallback=true;
      await loadCorpus(pending,{...perFileOptions,signal:controller.signal,budget:Math.max(1,deadline-Date.now()),onSource:(items,path)=>remember(path,items),onProgress:status=>{completedFallback=status.completed;progress();}});
    }
    await shared;
    options.onProgress?.({completed:paths.length,succeeded:successful.size,entryCount:[...successful.values()].reduce((n,items)=>n+items.length,0),total:paths.length});
    return {entries:paths.flatMap(path=>successful.get(path)||[]),failed:paths.filter(path=>!successful.has(path))};
  }finally{clearTimeout(timer);abort();options.signal?.removeEventListener('abort',abort);}
}

async function readJSON(path, timeout) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try {
    const response=await fetch(path,{cache:'no-cache',signal:controller.signal});
    if (!response.ok) throw Error('HTTP '+response.status);
    return await response.json();
  } finally { clearTimeout(timer); }
}

function mergeCorpus(current, recovered) {
  const paths=new Set(recovered.map(item=>item.path));
  return [...current.filter(item=>!paths.has(item.path)),...recovered].sort((a,b)=>
    ({case:0,evidence:1,pending:2}[a.kind]-{case:0,evidence:1,pending:2}[b.kind])||a.id.localeCompare(b.id));
}
function refreshCorpusMetadata() {
  for(const kind of Object.keys(KIND)) $(kind==='case'?'case-count':kind+'-count').textContent=entries.filter(e=>e.kind===kind).length;
  for(const [id,values] of [['tool',entries.flatMap(e=>e.tools)],['category',entries.map(e=>e.category)],['proof',entries.map(e=>e.proof)]]){
    const selected=$(id).value;
    populate(id,selected?[...values,selected]:values);
    $(id).value=selected;
  }
}
function updatePartialLoad() {
  updateMissingCase();
  $('partial-load').hidden=!discoveryReady||!failedPaths.length;
  $('retry-failed').setAttribute('aria-disabled',String(recoveringSources));
  $('retry-failed').textContent=recoveringSources?'正在重試…':'重試未載入來源';
  $('recovery-progress').hidden=!recoveringSources;
  $('stop-recovery').hidden=!recoveringSources;
  $('stop-recovery').setAttribute('aria-disabled',String(!!recoveryController?.signal.aborted));
  if(recoveryProgress){
    $('recovery-progress').max=recoveryProgress.total;
    $('recovery-progress').value=recoveryProgress.completed;
  }
  const target=new URLSearchParams(location.search).get('case');
  const missingTarget=target&&!matchCase(target);
  $('partial-message').textContent=(missingTarget?'分享的案例目前無法開啟，可能仍在未載入的來源中。':'')+
    '還有 '+failedPaths.length+' 個來源檔案未載入；搜尋、篩選與統計只涵蓋已載入內容。'+
    (recoveringSources?'正在補讀，你可以繼續搜尋或閱讀。'+
      (recoveryProgress?'已處理 '+recoveryProgress.completed+' / '+recoveryProgress.total+' 個來源，成功讀取 '+recoveryProgress.succeeded+' 個。':'')+
      '不想等待時，可停止並使用已補回內容。':'可稍後重試，已載入內容會保留。');
  $('load-status').textContent=recoveryNotice;
}
function preserveRecoveryFocus() {
  const active=document.activeElement;
  const cardNode=active.closest('.card');
  const area=cardNode?.closest('#drawn-case')?'drawn-case':'results';
  const cardId=cardNode?.dataset.caseId;
  const buttonIndex=cardNode?[...cardNode.querySelectorAll('button')].indexOf(active):-1;
  const filterKey=active.dataset.removeFilter;
  const filterKeys=active.dataset.removeFilters;
  const queryRecovery=active.dataset.queryRecovery;
  const resultsReturn=active.dataset.resultsReturn;
  const categoryValue=active.dataset.categoryValue;
  const parentId=active.parentElement?.id;
  return ()=>{
    if(active===document.body)return;
    if(active.isConnected && active.getClientRects().length && !active.closest('[hidden]'))return;
    let replacement;
    if(cardId){
      const node=[...$(area).querySelectorAll('.card')].find(c=>c.dataset.caseId===cardId);
      replacement=node?.querySelectorAll('button')[buttonIndex];
    }else if(categoryValue){
      replacement=[...$('category-matches').children].find(button=>button.dataset.categoryValue===categoryValue)||$('category-query');
    }else if(resultsReturn){
      const links=[...$('results').querySelectorAll('[data-results-return]')];
      replacement=links.find(link=>link.dataset.resultsReturn===resultsReturn)||links.at(-1);
    }else if(queryRecovery && parentId){
      replacement=[...$(parentId).querySelectorAll('[data-query-recovery]')].find(b=>b.dataset.queryRecovery===queryRecovery);
    }else if(filterKeys && parentId){
      replacement=[...$(parentId).querySelectorAll('[data-remove-filters]')].find(b=>b.dataset.removeFilters===filterKeys);
    }else if(filterKey && parentId){
      replacement=[...$(parentId).querySelectorAll('[data-remove-filter]')].find(b=>b.dataset.removeFilter===filterKey);
    }
    const target=replacement||$('results-count');
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  };
}
function stopSourceRecovery() {
  if(recoveringSources)recoveryController?.abort();
}
async function retryFailedSources() {
  if(!discoveryReady||recoveringSources||!failedPaths.length)return;
  const paths=[...failedPaths];
  const requestedCase=new URLSearchParams(location.search).get('case');
  recoveryController=new AbortController();
  recoveryProgress={completed:0,succeeded:0,total:paths.length};
  recoveringSources=true;recoveryNotice='正在重試 '+paths.length+' 個來源檔案，已載入內容仍可使用。';
  updatePartialLoad();
  try {
    const result=await loadCorpus(paths,{concurrency:4,timeout:15000,budget:20000,signal:recoveryController.signal,
      onProgress:progress=>{recoveryProgress=progress;updatePartialLoad();}
    });
    const restoreFocus=preserveRecoveryFocus();
    const recoveryControlFocused=[$('retry-failed'),$('stop-recovery')].includes(document.activeElement);
    const recoverRequested=recoveryControlFocused;
    entries=mergeCorpus(entries,result.entries);
    failedPaths=result.failed;
    recoveringSources=false;
    recoveryNotice=(recoveryController.signal.aborted?'已停止等待。':'')+'已補回 '+result.entries.length+' 筆收錄。'+(failedPaths.length?
      '仍有 '+failedPaths.length+' 個來源檔案未載入，請稍後再試。':'所有來源皆已載入。');
    refreshCorpusMetadata();
    render(false,true);
    updateModalNav();
    if(recoveryControlFocused){
      const target=failedPaths.length?$('retry-failed'):$('results-count');
      target.focus({preventScroll:true});
      target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
    }else restoreFocus();
    refreshRelated();
    const target=new URLSearchParams(location.search).get('case');
    if(recoverRequested && requestedCase!==null && target===requestedCase && !$('detail').open){
      const item=matchCase(target);
      if(item)showDetail(item,null,false);
      else if($('missing-case')&&!$('missing-case').hidden)focusMissingCase();
    }
  } catch(error) {
    recoveryNotice='暫時無法補讀來源，已載入內容已保留，請稍後再試。';
    console.error(error);
  } finally {
    recoveringSources=false;
    recoveryController=null;recoveryProgress=null;
    updatePartialLoad();
  }
}

function focusLoadedResults(block='center') {
  const target=$('results-count'),url=location.href;
  target.focus({preventScroll:true});
  target.scrollIntoView({block,behavior:'instant'});
  // Native anchoring may settle after the newly drawn card changes page height.
  // Keep the requested result visible, unless the reader has already moved on.
  let cancelled=false;
  const events=['pointerdown','keydown','wheel','touchstart'];
  const cancel=()=>{cancelled=true;cleanup();};
  const cleanup=()=>events.forEach(type=>document.removeEventListener(type,cancel,true));
  const keepVisible=()=>{
    if(cancelled||location.href!==url||$('detail').open||document.activeElement!==target)return;
    const rect=target.getBoundingClientRect();
    if(rect.top<0||rect.bottom>innerHeight)target.scrollIntoView({block,behavior:'instant'});
  };
  events.forEach(type=>document.addEventListener(type,cancel,{capture:true,passive:true}));
  requestAnimationFrame(()=>{keepVisible();requestAnimationFrame(()=>{keepVisible();cleanup();});});
}

// Prefer a block starting inside the reading area. A clipped overview can
// straddle the toolbar while a later source report is already being read;
// anchoring that overview would miss layout changes between the two blocks.
function selectReadingAnchor(nodes, top, bottom, after) {
  const visible=nodes.filter(node=>{
    if(node.classList.contains('detail-load-status') || node.closest('.related-cases'))return false;
    const rect=node.getBoundingClientRect();
    return rect.height>0 && rect.bottom>top && rect.top<bottom;
  });
  const downstream=after==null?visible:visible.filter(node=>node.getBoundingClientRect().top>=after-4);
  const candidates=downstream.length?downstream:visible;
  return candidates.find(node=>node.getBoundingClientRect().top>=top) || candidates[0] || null;
}

async function load() {
  if(initialLoading)return;
  initialLoading=true;
  if($('missing-case'))$('missing-case').hidden=true;
  const deadline=Date.now()+20000;
  const remaining=()=>Math.max(1,deadline-Date.now());
  initialLoadController=new AbortController();
  $('loading-progress').hidden=false;
  $('source-progress').removeAttribute('value');
  $('loading-summary').textContent='正在讀取目錄，接著會讀取案例全文。';
  $('use-loaded').disabled=true;
  $('use-loaded').removeAttribute('aria-disabled');
  recoveryNotice='';$('load-status').textContent='';$('partial-load').hidden=true;
  clearSearchShare();$('copy-search-link').disabled=true;$('search-submit').disabled=true;
  discoveryReady=false;discoveryKey='';$('guide-options').disabled=true;$('draw-case').disabled=true;$('drawn-case').setAttribute('aria-busy','true');$('draw-status').textContent='正在準備案例卡…';$('drawn-case').replaceChildren();
  $('error').hidden = true;
  $('empty').hidden = true;
  $('search-feedback').hidden = true;
  $('search-order-note').hidden = true;
  $('search-order-controls').hidden = true;
  $('reset-sort').hidden = true;
  $('empty-suggestions').replaceChildren();
  $('results-count').textContent = '正在讀取案例…';
  $('filter-outcome-count').textContent = '正在讀取案例…';
  $('filter-view-results').disabled = true;
  renderCategoryFinder();
  failedPaths = [];
  try {
    // Hydrate shared conditions before readers can edit the form during loading.
    // Dynamic facets retain a temporary option until source metadata arrives.
    const initialParams=new URLSearchParams(location.search);
    $('sort').value=reviewSort(initialParams.get('sort'));
    activeScenario=initialParams.get('scenario')||'';
    $('scenario').value=activeScenario;
    ['query','kind','difficulty','tool','category','proof'].forEach(id=>{
      const value=initialParams.get(id==='query'?'q':id)||'';
      if(value&&['difficulty','tool','category','proof'].includes(id)&&$(id)&&![...$(id).options].some(o=>o.value===value)){
        const option=el('option','',value);option.value=value;$(id).append(option);
      }
      if($(id)) $(id).value=value;
    });
    syncPageContext();
    const catalog = await readJSON('catalog.json', Math.min(8000,remaining()));
    if (!Array.isArray(catalog.files) || !catalog.files.length) throw Error('索引沒有案例。');
    const paths = catalog.files.filter(p => typeof p === 'string' && /^(cases|evidence)\/[a-zA-Z0-9_/-]+\.md$/.test(p) || p === 'sources/pending.md');
    try {
      displayCopy = await readJSON('assets/copy.json', Math.min(2500,remaining()));
    } catch (e) {
      console.warn('顯示文案載入失敗，使用 Markdown 預設文案：', e);
      displayCopy = {};
    }
    let announced=-1;
    const orderedPaths=prioritizeSharedSource(paths,new URLSearchParams(location.search).get('case'));
    const { entries: loaded, failed } = await loadInitialCorpus(orderedPaths, {
      bundleRevision:catalog.bundleRevision,
      sharedPath:new URLSearchParams(location.search).has('case') && orderedPaths!==paths ? orderedPaths[0] : null,
      fetch,parseFile,concurrency:16,timeout:12000,budget:remaining(),signal:initialLoadController.signal,retryTransient:true,
      onSource:items=>{
        // Read only a successfully parsed source whose actual ID still matches
        // the current URL. Do not reopen a case after close or history traversal.
        if($('detail').open)return;
        const target=new URLSearchParams(location.search).get('case');
        const item=matchCase(target,items);
        if(!item)return;
        entries=mergeCorpus(entries,items);
        allowAutomaticArrival=false;
        showDetail(item,null,false);
      },
      onProgress:({completed,succeeded,entryCount,total})=>{
        $('source-progress').max=total;
        $('source-progress').value=completed;
        const text='已處理 '+completed+' / '+total+' 個來源，成功讀取 '+succeeded+' 個。';
        $('loading-summary').textContent=text;
        if(!initialLoadController.signal.aborted)$('use-loaded').disabled=!entryCount;
        const milestone=Math.floor(completed/total*4);
        if(milestone!==announced){
          announced=milestone;
          const stages=['正在讀取來源全文。','已處理至少四分之一的來源。','已處理至少一半的來源。','已處理至少四分之三的來源。','來源讀取已結束。'];
          $('draw-status').textContent=stages[milestone]+' 等待過久會先顯示已讀取內容。';
        }
      }
    });
    failedPaths = failed;
    if (!loaded.length) throw Error('沒有成功讀取任何案例。');
    const restoreFocus=$('detail').open ? ()=>{} : preserveRecoveryFocus();
    const dialog=$('detail');
    const readingEdge=dialog.querySelector('.detail-toolbar').getBoundingClientRect().bottom;
    // Wheel/touch readers may still have an offscreen title focused. Preserve
    // visible reading content rather than pulling the viewport toward that title.
    const relatedHasFocus=dialog.querySelector('.related-cases')?.contains(document.activeElement);
    const status=dialog.querySelector('.detail-load-status');
    const statusBottom=status?.getBoundingClientRect().bottom;
    const statusHeight=status&&!status.hidden?status.getBoundingClientRect().height:0;
    const statusWasAbove=status&&status.getBoundingClientRect().bottom<=readingEdge;
    const activeEl = document.activeElement && dialog.contains(document.activeElement) ? document.activeElement : null;
    const activeRect = activeEl?.getBoundingClientRect();
    const focusAboveStatus = activeRect && status && activeRect.top < status.getBoundingClientRect().top && activeRect.bottom > readingEdge;
    const readingAnchor=dialog.open && !relatedHasFocus && !focusAboveStatus ? selectReadingAnchor(
      [...dialog.querySelectorAll('#detail-body h2,#detail-body h3,#detail-body p,#detail-body li,#detail-body pre,#detail-body summary,#detail-body .markdown-table,#detail-body tr')],
      readingEdge,dialog.getBoundingClientRect().bottom,statusBottom
    ) : null;
    const readingTop=readingAnchor?.getBoundingClientRect().top;
    const readingOffset=readingAnchor&&readingTop!=null?readingTop-readingEdge:0;
    entries = mergeCorpus([],loaded);
    refreshCorpusMetadata();
    $('updated').textContent = '索引更新 ' + catalog.builtAt;
    const params = new URLSearchParams(location.search);
    $('sort').value=reviewSort(params.get('sort'));
    activeScenario = params.get('scenario') || '';
    ['query', 'kind', 'difficulty', 'tool', 'category', 'proof'].forEach(id => {
      const value = params.get(id === 'query' ? 'q' : id) || '';
      if(failedPaths.length && value && ['difficulty','tool','category','proof'].includes(id) && $(id) && ![...$(id).options].some(o=>o.value===value)){
        const option=el('option','',value);option.value=value;$(id).append(option);
      }
      if ($(id) && (id === 'query' || [...$(id).options].some(o => o.value === value))) $(id).value = value;
    });
    const skippedFromButton=document.activeElement===$('use-loaded');
    $('loading-progress').hidden=true;
    discoveryReady=true;$('guide-options').disabled=false;$('drawn-case').setAttribute('aria-busy','false');
    render(false);
    const current = matchCase(params.get('case'));
    if ($('detail').open && currentDetailItem?.id===current?.id) {
      // Keep the exact research DOM, reading position and focused control.
      updateModalNav();
      refreshRelated();
      if(status){
        status.textContent=failedPaths.length ? '這篇已可閱讀；部分其他來源尚未載入。關閉閱讀後可重試未載入來源。' : '其他案例已載入，可依目前搜尋條件切換與探索。';
        status.hidden=!failedPaths.length;
      }
      const statusAfter=status&&!status.hidden?status.getBoundingClientRect().height:0;
      const statusDiff=statusHeight-statusAfter;
      if(readingAnchor?.isConnected && readingAnchor.getBoundingClientRect().height>0){
        dialog.scrollTop+=readingAnchor.getBoundingClientRect().top-readingTop;
      } else if (!relatedHasFocus && statusWasAbove && statusDiff > 0) {
        dialog.scrollTop-=statusDiff;
      }
    }
    else if (current) { showDetail(current, null, false); allowAutomaticArrival=false; }
    else if(skippedFromButton)focusLoadedResults();
    else finishArrival(params,failedPaths.length>0);
    restoreFocus();
  } catch (error) {
    discoveryReady=false;$('drawn-case').setAttribute('aria-busy','false');$('draw-status').textContent='案例卡暫時無法載入，請到下方重新載入或閱讀 GitHub 索引。';$('drawn-case').replaceChildren();$('draw-case').disabled=true;$('guide-options').disabled=true;
    $('results').replaceChildren();
    $('results-count').textContent = '載入未完成';
    $('filter-outcome-count').textContent = '載入未完成，請到結果區重新載入';
    $('filter-view-results').disabled = false;
    $('error-message').textContent = '請稍後重試，或先閱讀 GitHub 原始資料。';
    $('error').hidden = false;
    finishArrival(new URLSearchParams(location.search),true);
    console.error(error);
  } finally {
    initialLoading=false;initialLoadController=null;
    syncPageContext();
    renderCategoryFinder();
    $('loading-progress').hidden=true;
  }
}
function drawNext(){
  if(!discoveryReady||!discoveryDeck)return;
  const next=discoveryDeck.next();
  if(!next)return;
  $('drawn-case').replaceChildren(card(next.item));
  const diffLabel=$('difficulty')?.value?($('difficulty').value==='入門對話'?'免寫程式':$('difficulty').value==='工具串接'?'需帳號外掛':'需代碼環境'):'';
  const scope=($('scenario').value||'全部情境')+(diffLabel?' · '+diffLabel:'');
  $('draw-status').textContent=scope+' · 這組條件有 '+next.total+' 張案例卡 · '+(next.round>1?'已重新洗牌 · ':'')+'第 '+next.position+' 張：'+next.item.title;
  $('draw-case').textContent=next.total===1?'只有這一張，重新看看':'再抽一張 ↻';
}
function syncDiscovery(filtered){
  document.querySelectorAll('button[data-scenario]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scenario===$('scenario').value)));
  document.querySelectorAll('button[data-difficulty]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.difficulty===($('difficulty')?.value||''))));
  if(!discoveryReady)return;
  const pool=Discovery.discoveryPool(filtered);
  const key=$('scenario').value+'|'+($('difficulty')?.value||'')+'|'+pool.map(item=>item.id).join(',');
  if(key===discoveryKey)return;
  discoveryKey=key;discoveryDeck=Discovery.createDeck(pool);
  $('draw-case').disabled=!pool.length;
  if(pool.length)drawNext();
  else{
    const diffText=$('difficulty')?.value?`在「${$('difficulty').value}」門檻下`:'這組條件';
    $('drawn-case').replaceChildren(el('p','draw-placeholder',`${diffText}目前沒有可抽的案例卡。試試「全部門檻」或其他情境，或在下方調整篩選。`));
    $('draw-status').textContent=($('scenario').value||'全部情境')+($('difficulty')?.value?' · '+$('difficulty').value:'')+' 目前沒有可抽的案例卡。';
    $('draw-case').textContent='沒有可抽的案例';
  }
}
function revealDiscovery(){
  // Only explicit scenario/draw actions call this helper. Automatic deck updates
  // must leave the reader's current input and focus untouched.
  if(!discoveryReady)return;
  const target=$('drawn-case').querySelector('h3 button')||$('draw-status');
  if(target===$('draw-status'))target.tabIndex=-1;
  const stage=$('discover'),rect=stage.getBoundingClientRect();
  if(rect.top<0||rect.bottom>window.innerHeight)stage.scrollIntoView({block:'start',behavior:'instant'});
  // A long status or title can extend past the stage's initial landing.
  const titleRect=target.getBoundingClientRect();
  if(titleRect.top<16||titleRect.bottom>window.innerHeight-16)target.scrollIntoView({block:'start',behavior:'instant'});
  target.focus({preventScroll:true});
}
function chooseScenario(value){
  ['query','scenario','kind','difficulty','tool','category','proof'].forEach(id=>$(id).value='');
  activeScenario=value;render();revealDiscovery();
}
function chooseDifficulty(value){
  $('difficulty').value=value;
  render();
  revealDiscovery();
}

/* Browser event bindings. */
for(const [type,description] of Object.entries(SOURCE_TYPES)){
  const definition=el('div');
  definition.append(el('dt','',type),el('dd','',description));
  $('source-type-definitions').append(definition);
}
// An arriving reader may start using the page while the corpus is loading.
// Never override that interaction with late search-arrival scrolling or focus.
// An explicit case link still opens its requested case when loading completes.
['pointerdown','keydown','wheel','touchstart'].forEach(type=>{
  document.addEventListener(type,()=>{allowAutomaticArrival=false;},{once:true,passive:true});
});
$('use-loaded').addEventListener('click',()=>{
  if(!initialLoadController||$('use-loaded').disabled)return;
  $('use-loaded').setAttribute('aria-disabled','true');
  initialLoadController.abort();
});
// Keep explicit task search available before the corpus is ready.
document.querySelectorAll('[data-search-entry]').forEach(link=>link.addEventListener('click',enterSearch));
$('dismiss-missing-case').addEventListener('click',()=>{
  allowAutomaticArrival=false;
  const url=new URL(location.href);
  url.searchParams.delete('case');
  url.hash='explore';
  history.replaceState(history.state,'',url);
  updateMissingCase();
  syncPageContext();
  $('explore').scrollIntoView({block:'start',behavior:'instant'});
  $('query').focus({preventScroll:true});
});
$('copy-search-link').addEventListener('click',copySearchLink);
// Choose the initial disclosure state once; typing, navigation and resizing
// preserve the reader's choice and never hide a currently focused control.
$('filter-options').open = !window.matchMedia('(max-width:760px)').matches;
$('draw-case').addEventListener('click',()=>{drawNext();revealDiscovery();});
document.querySelectorAll('#guide-options [data-scenario]').forEach(button=>button.addEventListener('click',()=>chooseScenario(button.dataset.scenario)));
document.querySelectorAll('#draw-difficulty-options [data-difficulty]').forEach(button=>button.addEventListener('click',()=>chooseDifficulty(button.dataset.difficulty)));
$('scenario').addEventListener('change',()=>{activeScenario=$('scenario').value;render();});
$('filters').addEventListener('submit', submitSearch);
$('query').addEventListener('compositionstart', () => { searchComposing = true; });
$('query').addEventListener('compositionend', () => { searchComposing = false; });
// Route non-composing Enter through the explicit form action, with the
// same loading guard as a button click.
$('query').addEventListener('keydown', event => {
  if (event.key !== 'Enter' || event.isComposing || searchComposing || event.keyCode === 229) return;
  event.preventDefault();
  $('filters').requestSubmit();
});
$('category-query').addEventListener('input', renderCategoryFinder);
$('category-query').addEventListener('compositionstart',()=>{categoryComposing=true;});
$('category-query').addEventListener('compositionend',()=>{categoryComposing=false;});
$('category-query').addEventListener('keydown', event => {
  if(event.key==='Enter' && !event.isComposing && event.keyCode!==229)event.preventDefault();
});
$('clear-category-query').addEventListener('click',()=>{
  $('category-query').value='';renderCategoryFinder();$('category-query').focus();
});
$('query').addEventListener('input', () => render());
$('sort').addEventListener('change', () => render());
$('reset-sort').addEventListener('click', resetSort);
$('recent-entry').addEventListener('click', event => {
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  history.replaceState(null,'',event.currentTarget.href);
  activeScenario='';
  ['query','kind','difficulty','tool','category','proof'].forEach(id => { if($(id)) $(id).value = ''; });
  $('sort').value='reviewed';render();enterSearch(event);
});
['kind', 'difficulty', 'tool', 'category', 'proof'].forEach(id => $(id)?.addEventListener('change', () => render()));
$('filter-view-results').addEventListener('click', focusResults);
$('reset').addEventListener('click', reset);
$('empty-reset').addEventListener('click', () => { reset(); focusResults(); });
$('clear-facets').addEventListener('click', clearFacets);
$('edit-query').addEventListener('click', () => {
  const query=$('query');
  query.focus({preventScroll:true});
  query.select();
  // Keep this explicit recovery visible even when native focus does not scroll.
  query.scrollIntoView({block:'center',behavior:'instant'});
});
$('stop-recovery').addEventListener('click',stopSourceRecovery);
$('retry-failed').addEventListener('click',()=>{
  if(recoveringSources)return;
  $('retry-failed').focus({preventScroll:true});
  retryFailedSources();
});
$('retry').addEventListener('click', () => { $('results-count').focus({preventScroll:true}); load(); });
$('close-detail').addEventListener('click', closeDetail);
$('nav-prev-case')?.addEventListener('click', () => navStep(-1));
$('nav-next-case')?.addEventListener('click', () => navStep(1));
$('scenario-chips')?.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  if (chip.dataset.scenario) {
    activeScenario = activeScenario === chip.dataset.scenario ? '' : chip.dataset.scenario;
    render();
  } else if (chip.dataset.kind) {
    $('kind').value = $('kind').value === chip.dataset.kind ? '' : chip.dataset.kind;
    render();
  } else if (chip.dataset.query) {
    const q = chip.dataset.query;
    $('query').value = $('query').value.trim() === q ? '' : q;
    allowAutomaticArrival = false;
    render();
    // Task shortcuts are explicit searches. Reuse the bounded result handoff,
    // but keep loading/error intent in place without a delayed focus jump.
    if (discoveryReady) focusLoadedResults('start');
  }
});
$('detail').addEventListener('cancel', e => { e.preventDefault(); closeDetail(); });
$('detail').addEventListener('click', e => {
  if (e.target === $('detail')) {
    const rect = $('detail').getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) closeDetail();
  }
});
document.addEventListener('keydown', e => {
  if ($('detail').open) {
    // Arrow keys belong to the browser while readers select or copy passage text.
    if (document.getSelection()?.isCollapsed === false) return;
    if (e.defaultPrevented || e.isComposing || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || document.activeElement.closest('.markdown-table,input,textarea,select,[contenteditable]:not([contenteditable="false"])')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); navStep(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); navStep(1); }
    return;
  }
  if (e.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
    e.preventDefault();
    $('query').focus();
  }
});
window.addEventListener('popstate', event => {
  rememberReadingView();
  const params = new URLSearchParams(location.search);
  const id = params.get('case');
  const item = matchCase(id);
  const wasOpen=$('detail').open;
  const missingHadFocus=$('missing-case')?.contains(document.activeElement);
  $('sort').value=reviewSort(params.get('sort'));
  activeScenario = params.get('scenario') || '';
  ['query', 'kind', 'difficulty', 'tool', 'category', 'proof'].forEach(key => { if($(key)) $(key).value = params.get(key === 'query' ? 'q' : key) || ''; });
  render(false);
  if (item) {
    lastTrigger = null;
    lastTriggerContext = event.state?.caseReturn || null;
    showDetail(item, null, false);
  } else if (wasOpen) {currentReadingVisit=null;$('detail').close();}
  syncPageContext();
  if(!wasOpen&&missingHadFocus){
    if($('missing-case')&&!$('missing-case').hidden)focusMissingCase();else revealSearch(true);
  }
  if(wasOpen&&!item){
    if($('missing-case')&&!$('missing-case').hidden)focusMissingCase();else restoreDetailFocus();
    // Fragment traversal can apply its native focus after the popstate handler.
    // Restore briefly after that step, without overriding another control's focus.
    if(location.hash){
      const returnURL=location.href,returnTarget=document.activeElement;
      let fragment=null;
      try{fragment=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{}
      let cancelled=false,frame=null,timer=null;
      const deadline=performance.now()+300;
      const inputEvents=['pointerdown','keydown','wheel','touchstart'];
      const cleanup=()=>{
        inputEvents.forEach(type=>window.removeEventListener(type,cancel,true));
        if(frame!==null){cancelAnimationFrame(frame);frame=null;}
        if(timer!==null){clearTimeout(timer);timer=null;}
      };
      const cancel=()=>{cancelled=true;cleanup();};
      inputEvents.forEach(type=>window.addEventListener(type,cancel,{capture:true,passive:true}));
      const settle=()=>{
        frame=null;
        if(cancelled||performance.now()>=deadline||location.href!==returnURL||$('detail').open||!returnTarget?.isConnected){cancel();return;}
        const active=document.activeElement;
        if(active!==document.body&&active!==fragment&&active!==returnTarget){cancel();return;}
        if(active!==returnTarget)returnTarget.focus({preventScroll:true});
        const rect=returnTarget.getBoundingClientRect();
        if(rect.top<0||rect.bottom>innerHeight)returnTarget.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
        frame=requestAnimationFrame(settle);
      };
      // Native fragment restoration can arrive after the first two frames.
      // Stop at an absolute deadline, including when the tab suspends rAF.
      timer=setTimeout(cancel,300);
      frame=requestAnimationFrame(settle);
    }
  }
});
load();
