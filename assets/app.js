/* No external scripts, analytics, API tokens, or build dependencies. */
'use strict';
const REPO_ROOT = 'https://github.com/RichardHan/ai-agent-use-cases/blob/';
const pinnedSources = new Map();
function sourceRevisionFor(path) { return pinnedSources.get(path) || ''; }
function pinSourcePaths(paths, revision) {
  if(typeof revision !== 'string' || !/^[a-f0-9]{40}$/i.test(revision))return;
  for(const path of paths)pinnedSources.set(path,revision.toLowerCase());
}
function sourceMarkdownUrl(path) { return REPO_ROOT + (sourceRevisionFor(path) || 'main') + '/' + path; }
function sourceVersionNote(path) {
  const revision=sourceRevisionFor(path);
  return revision ? 'GitHub 原始 Markdown 固定於本站發布版本 '+revision.slice(0,7)+'；外部來源仍須另行核對。' : '尚未核對本站發布版本，無法保證 GitHub 原文與目前閱讀內容相同；可先閱讀下方保留的原文，或自行比對 GitHub 最新版本。';
}
function refreshCurrentSourceLinks(path) {
  if(!globalThis.document || !currentDetailItem || currentDetailItem.path!==path || !document.querySelector('#detail[open]'))return;
  const body=document.querySelector('#detail-body');
  const source=body?.querySelector('.detail-source'),note=body?.querySelector('.detail-source-version');
  if(source) {
    if(sourceRevisionFor(path)) { source.href=sourceMarkdownUrl(path); source.removeAttribute('aria-disabled'); source.removeAttribute('tabindex'); }
    else { source.removeAttribute('href'); source.setAttribute('aria-disabled','true'); source.tabIndex=0; }
  }
  if(note)note.textContent=sourceVersionNote(path);
  const latest=body?.querySelector('.detail-source-latest');
  if(latest) {
    if(sourceRevisionFor(path) && document.activeElement===latest)source?.focus({preventScroll:true});
    latest.hidden=!!sourceRevisionFor(path);
  }
  for(const link of body?.querySelectorAll('a[data-source-relative]')||[]) {
    const href=safeLink(link.getAttribute('data-source-relative'),path);
    if(href) { link.href=href; link.removeAttribute('aria-disabled'); link.removeAttribute('tabindex'); }
  }
}
const KIND = {case:'用法靈感', evidence:'經驗與踩坑', pending:'待查線索'};
const PROOF_DEFINITIONS = globalThis.PROOF_DEFINITIONS = {
  '官方自報': '官方或原廠團隊（含其員工）第一手發布的自述、示範或能力說明，未經第三方獨立驗證；發布者可能有產品推廣利益。',
  '作者報告／示範': '社群作者公開分享的操作紀錄與示範；實際產物、完整過程與成效仍須逐案核對，本庫未取得獨立代碼庫驗證。',
  '設計／未實跑': '作者自行設計或分享的提示詞與流程，未附執行結果；本庫未實跑，也沒有成效可核。',
  '公開資料核讀': '依公開貼文、文章或報告核讀整理，本庫未重現完整流程。',
  '模板／文件核讀': '基於開源模板、規格書或文件梳理，文件列出功能不代表已實測完成。',
  '尚待查證': '社群線索或待辦想法，證據尚不充分，請勿直接照做。'
};
const PROOF_CLAIMANTS = globalThis.PROOF_CLAIMANTS = {
  '官方自報': '官方團隊／原廠自述',
  '作者報告／示範': '社群作者／專案實踐者',
  '設計／未實跑': '提示詞設計者（未提供執行結果）',
  '公開資料核讀': '公開專案／原始文件（作者自行公布）',
  '模板／文件核讀': '開源模板／規格文件',
  '尚待查證': '社群線索（尚未證實）'
};
const PROOF_VERIFICATION_STATUS = globalThis.PROOF_VERIFICATION_STATUS = {
  '官方自報': '未經第三方獨立實測重現；請留意原廠展示通常在理想環境下進行。',
  '作者報告／示範': '本庫未於本機獨立重現代碼或流程；請留意作者個人環境與版本差異。',
  '設計／未實跑': '來源沒有執行結果或操作紀錄可核；只能核對提示詞與流程設計，不能當成已驗證做法。',
  '公開資料核讀': '本庫依公開文件與貼文核讀整理，未取得端對端實跑或成效驗證。',
  '模板／文件核讀': '規格書或開源模板列出功能，不等於已經過完整實跑與邊界驗證。',
  '尚待查證': '證據尚不充分，未列成功案例；請勿在正式工作或金流中直接採用。'
};
// The detail header states the same attribution and verification boundary as
// the full proof note further down, so a shared link can be judged without a
// scroll. Keep these short forms faithful to PROOF_VERIFICATION_STATUS.
const PROOF_STATUS_SHORT = globalThis.PROOF_STATUS_SHORT = {
  '官方自報': '未經第三方獨立重現',
  '作者報告／示範': '本庫未獨立重現',
  '設計／未實跑': '未實跑，無成效可核',
  '公開資料核讀': '未端對端驗證',
  '模板／文件核讀': '文件功能未實測',
  '尚待查證': '證據不足，未列成功案例'
};
const PROOF_SAFE_ADOPTION_TIP = globalThis.PROOF_SAFE_ADOPTION_TIP = {
  '官方自報': '安全採用建議（落地三層防護）：① 建議試跑：在官方沙盒或隔離測試環境驗證相容性；② 禁止動作：嚴禁未經確認自動寫入正式生產系統或授權對外操作；③ 必經審核：對關鍵系統狀態變更與權限調整保留人工覆核。',
  '作者報告／示範': '安全採用建議（落地三層防護）：① 建議試跑：使用合成資料或做足資料去敏在受控環境小規模試跑；② 禁止動作：嚴禁未經確認自動對外寄信、扣款付款或直接寫入生產資料庫；③ 必經審核：對重要決策、金流支付、外部發布與招募判定保留人工審批。',
  '設計／未實跑': '安全採用建議（落地三層防護）：① 建議試跑：只在隔離環境用假資料試提示詞，先確認它真的會停下來問人；② 禁止動作：不要直接接到寄信、扣款、改權限或刪除資料等動作；③ 必經審核：任何要改動正式設定的流程，都由人工逐項核准與回滾演練。',
  '公開資料核讀': '安全採用建議（落地三層防護）：① 建議試跑：先查閱原始出處與最新規格，以草稿或唯讀模式驗證；② 禁止動作：切勿依賴靜態或歷史筆記直接執行未驗證的系統寫入或付款；③ 必經審核：關鍵商務依據與技術版本需由專人核對原始出處後放行。',
  '模板／文件核讀': '安全採用建議（落地三層防護）：① 建議試跑：以小規模非敏感資料驗證提示詞與模型輸出穩定度；② 禁止動作：嚴禁直接把通用模板串接外部寄信、扣款或未經審核的發布流程；③ 必經審核：產出成果必須經人工審批校對後方可採用。',
  '尚待查證': '安全採用建議（落地三層防護）：① 建議試跑：僅供概念構想參考，限於本機離線與虛擬假資料探討；② 禁止動作：切勿用於任何正式環境、金流交易、個資處理或對外自動化；③ 必經審核：未完成獨立查證前禁止進入任何實務評估或部署。'
};
// A case can declare more than one evidence class. Show every chip the page
// header names, and keep the primary chip's visible text identical to the
// filter value so colour, wording and counts stay the same vocabulary.
// A class can be declared while the page also states the library never read the
// original. The class still names who makes the claim, so the badge keeps the
// same visible text (and the same filter value), and the acquisition route is
// stated beside it instead of being implied by the badge alone.
const PROOF_PROVENANCE = globalThis.PROOF_PROVENANCE = {
  relayed: {
    badge: '官方內容經轉述或僅讀說明欄，本庫未完整核讀官方原文',
    claimant: '（官方內容經第三人轉述）',
    note: '本庫取得方式：案例頁說明官方內容經第三方轉述，或本庫只讀到影片說明與第三人整理（例如未觀看影片、未開啟官方頁面）。來源憑據仍記為官方自報，因為成果主張來自官方團隊；但這不代表本庫完整核讀過官方原文，引用前請自行開啟官方來源核對。'
  }
};
function proofIsRelayed(item, label) {
  return !!item && Array.isArray(item.relayedProof) && item.relayedProof.includes(label);
}
// The first screen and the full note speak for the page, so any relayed
// declaration has to be visible there, not only when it is the primary class.
function caseHasRelayedProof(item) {
  return !!item && Array.isArray(item.relayedProof) && item.relayedProof.length > 0;
}
function proofBadges(item) {
  const classes = item.proofClasses && item.proofClasses.length ? item.proofClasses : [item.proof];
  return classes.map((label, index) => {
    const badge = el('span', 'detail-badge proof-badge', label);
    badge.dataset.proof = label;
    const relayed = proofIsRelayed(item, label);
    if (relayed) badge.dataset.proofProvenance = 'relayed';
    const desc = PROOF_DEFINITIONS[label] || label;
    badge.title = desc + (relayed ? '（' + PROOF_PROVENANCE.relayed.badge + '）' : '');
    badge.setAttribute('role', 'note');
    const prefix = classes.length > 1 ? (index === 0 ? '來源憑據（主要）：' : '來源憑據（同案宣告）：') : '來源憑據：';
    badge.setAttribute('aria-label', prefix + label + (relayed ? '，' + PROOF_PROVENANCE.relayed.badge : '') + '。' + desc);
    return badge;
  });
}
// The reader needs the whole declaration, not only the class that won the
// precedence rule. Each line quotes the same dictionaries as the rest of the page.
function declaredClassList(item) {
  const wrap = el('div', 'proof-note-classes');
  wrap.append(el('p', 'proof-note-classes-title', '本案例頁首宣告 ' + item.proofClasses.length + ' 類來源：'));
  const list = el('ul', 'proof-note-class-list');
  item.proofClasses.forEach((label, index) => {
    const entry = el('li', 'proof-note-class');
    const tag = el('span', 'proof-note-class-tag', label);
    tag.dataset.proof = label;
    const relayed = proofIsRelayed(item, label);
    if (relayed) tag.dataset.proofProvenance = 'relayed';
    entry.append(
      tag,
      el('span', 'proof-note-class-detail', (index === 0 ? '主要' : '同案宣告') + '：成果主張 ' + (PROOF_CLAIMANTS[label] || '來源未明')
        + (relayed ? PROOF_PROVENANCE.relayed.claimant : '') + '；核讀 ' + (PROOF_STATUS_SHORT[label] || '未獨立重現'))
    );
    list.append(entry);
  });
  wrap.append(list);
  return wrap;
}
const SCENARIO_TARGET_USERS = globalThis.SCENARIO_TARGET_USERS = {
  '生活': '想用 AI 簡化日常生活瑣事、旅行規劃或家庭事項安排的讀者',
  '工作': '想藉助 AI 提升日常行政、客服、行銷或營運效率的職場工作者',
  '省錢': '關注訂閱管理、帳單核對、比價採購與成本節省的精打細算者',
  '學習': '進行自主學習、文獻整理、研究探索或跨領域吸收的求知者',
  '創作': '從事文案撰寫、內容產出、視覺設計或影音製作的創作者',
  '開發': '工程師、程式開發者、技術架構師或自動化流程建構者'
};
// A page's own "- 目標使用者" line and this library's scenario-level persona are
// different claims by different people. Keep the wording, heading and provenance
// in one place so a card and the reader cannot disagree about who said it.
function targetUserView(item) {
  if (item.targetUser) return {
    source: 'declared',
    heading: '適合對象',
    label: '👤 適合對象：',
    text: item.targetUser,
    note: '案例頁自行宣告適合對象；本庫未另外驗證。'
  };
  const scenario = item.scenario;
  const fallback = SCENARIO_TARGET_USERS[scenario];
  if (!fallback) return null;
  return {
    source: 'scenario',
    heading: '情境常見讀者',
    label: '👤 情境常見讀者：',
    text: fallback,
    note: '案例頁未宣告適合對象；以上是本庫依「' + scenario + '」情境整理的常見讀者，不是這篇案例作者的說法。'
  };
}
// 219 pages declare "- 核心目標" and a few older ones declare the same thing as
// "- 目標" or "- 問題". The rest declare nothing: 47 of them state the problem
// under a "## 問題…" section instead. Naming which of the three a page is keeps
// the card and the reader from implying a goal the page never wrote, and stops
// the absence from looking like "this case has no problem worth stating".
function problemSectionHeading(markdown) {
  // Headings inside fenced examples are text, not sections; walk the lines so a
  // pasted prompt cannot invent a section the page does not have.
  let fenced = false;
  for (const line of (markdown || '').split('\n')) {
    if (/^\s*```/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const heading = line.match(/^##+\s+(問題[^\n]*?)\s*$/);
    if (heading) return heading[1];
  }
  return '';
}
function coreGoalView(item) {
  if (item.coreGoal) return { source: 'declared', heading: '核心目標', text: item.coreGoal, note: '' };
  const section = problemSectionHeading(item.markdown);
  if (section) return {
    source: 'section',
    heading: '核心目標',
    text: '',
    note: '案例頁未在頁首宣告核心目標；正文有以「問題」為題的〈' + section + '〉一節，請往下閱讀原文。'
  };
  return {
    source: 'missing',
    heading: '核心目標',
    text: '',
    note: '案例頁未宣告核心目標；可先讀這一段的用途說明與原始來源。'
  };
}
const TOOL_PATTERNS = [['Grok Bot',/grok\s*bot/i],['Meta Muse',/\bmuse\b/i],['ChatGPT dots',/\bdots\b/i],['Cursor',/\bcursor\b/i],['GitHub',/\bgithub\b/i],['Notion',/\bnotion\b/i],['Facebook',/\bfacebook\b/i],['Google Drive',/google\s*drive|\bdrive\b/i],['Google Sheets',/google\s*sheets/i],['Haggle Bot',/haggle\s*bot/i]];
let entries = [], currentFiltered = [], activeScenario = '', currentDetailItem = null, lastTrigger = null, displayCopy = {}, failedPaths = [];
let allowAutomaticArrival=true, searchShareRequest=0;
let recoveringSources=false, recoveryNotice='', recoveryController=null, recoveryProgress=null;
let initialLoading=false, initialLoadController=null;
let discoveryDeck=null,discoveryKey='',discoveryReady=false,lastTriggerContext=null,drawnItemId='',drawPoolQuery=null,announcedDrawKey='',drawPoolMatches=0,drawPoolTotal=0,drawStatusSuffix=null,drawStatusPrefix='',drawStatusMode='other';
// Closing a case rewrites the entry that reading it created into the list URL.
// Two adjacent identical history stops then remain, so the reader's next Back
// press lands on the same screen and looks like nothing happened. Track the URL
// of the entry the reader is actually on, so the one no-op pop a close creates
// can be recognised and skipped — without removing the stops that hold the
// reader's reading trail (a case reached from another case must stay reachable).
let liveHistoryURL=typeof location==='undefined'?'':location.href, liveHistoryLength=typeof history==='undefined'?0:history.length, liveHistoryWrites=0, spentDetailStop=null;
if(typeof history!=='undefined'){
  for(const method of ['pushState','replaceState']){
    const write=history[method];
    if(typeof write!=='function')continue;
    const bound=write.bind(history);
    history[method]=function(state,title,url){
      const result=bound(state,title,url);
      liveHistoryURL=location.href;liveHistoryLength=history.length;liveHistoryWrites++;
      return result;
    };
  }
}
const RESULT_BATCH_SIZE=24;
let visibleResults=RESULT_BATCH_SIZE, resultQueryKey='';
const $ = id => document.getElementById(id);
const clean = text => text.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[`*_]/g,'').trim();
const norm = text => text.normalize('NFKC').toLocaleLowerCase();
// Source links are evidence, not content. A reader who searches a task must not
// match a case because a footnote points at `support.google.com` or `x.com`.
// A Markdown destination is removed whole (it may hold balanced parentheses and a
// quoted title); a bare URL stops at the first ASCII character that cannot be part
// of one, so Chinese prose written right after a raw URL is still searched.
const MARKDOWN_LINK_DESTINATION=/\]\(\s*<?(?:https?:\/\/|www\.)[^()\s<>]*(?:\([^()\s]*\)[^()\s<>]*)*>?(?:\s+"[^"]*")?\s*\)/gi;
const BARE_SOURCE_URL=/(?:https?:\/\/|www\.)[A-Za-z0-9\-._~:\/?#\[\]@!$&'*+,;=%]+/gi;
function withoutSourceUrls(text){ return text.replace(MARKDOWN_LINK_DESTINATION,' ] ').replace(BARE_SOURCE_URL,' '); }
// `（翻譯改寫）` and `（本庫設計，未實測）` say how this page was written, not what the
// case does, so they are not content a search should count. Before this, `翻譯`
// matched 186 of 515 entries when one entry is about translation, and the
// homepage's 「文件翻譯」entry returned 77 cases for one. The note stays on the page
// a reader opens; only the indexed text drops it. Only a short note carrying one of
// these words qualifies: `（依來源整理）` and `（本庫已看）` are left alone, because
// 整理 is a word readers search for and those notes hold no filler verb of their own.
const EDITORIAL_NOTE=/[（(][^（()）]{0,30}[）)]/g;
const EDITORIAL_LABEL=/^(?:翻譯|改寫|未實測|未實跑|未執行|未實作|未測|本庫|本文|原創|自設|自行設計|AI構想|依來源|依作者)/;
// `EDITORIAL_WORD` is used with test(), so it must not carry /g: a global regex
// keeps lastIndex between calls and a note skipped earlier would make the next one
// miss. The global copy exists only for the replace() that measures the remainder.
const EDITORIAL_WORD=/(?:翻譯|改寫|未實測|未實跑|未執行|未實作|未測)/;
const EDITORIAL_WORD_ALL=/(?:翻譯|改寫|未實測|未實跑|未執行|未實作|未測)/g;
const EDITORIAL_FILLER=/[\s，,、；;：:／/（）()]/g;
// A note that reports a number (a date, a price, a count) is saying something about
// the case, not labelling how the page was written, and it keeps its place in the
// index. What is left after the editing words must also stay short.
const EDITORIAL_FACT=/\d/;
function withoutEditorialNotes(text){
  return text.replace(EDITORIAL_NOTE,note=>{
    const inner=note.slice(1,-1);
    if(!EDITORIAL_LABEL.test(inner)||!EDITORIAL_WORD.test(inner)||EDITORIAL_FACT.test(inner))return note;
    const rest=inner.replace(EDITORIAL_WORD_ALL,'').replace(EDITORIAL_FILLER,'');
    return rest.length<=12?' ':note;
  });
}
// A case page's `##` headings are structure, not prose. The template asks every
// page to carry the same labels, so `## 所需連接、權限與限制` on 216 pages does not
// mean each case discusses permissions; before this split, 權限 matched 507 of 515
// entries and 所需連接 matched 216 while no case's prose uses that phrase. Headings
// stay searchable — a page whose only mention of 提示詞 is `## 可複製提示詞` usually
// does ship a prompt — but the index keeps a heading-free copy, the result line
// counts the two apart, and the card explanation names the label instead of
// quoting it as if it were the case's own sentence.
const SECTION_HEADING=/^(#{2,6})\s+(.+?)\s*$/;
function markdownSections(markdown) {
  const sections=[];let current=null,fenced=false;
  for(const line of String(markdown||'').split('\n')){
    if(/^\s*(?:```|~~~)/.test(line))fenced=!fenced;
    const heading=fenced?null:line.match(SECTION_HEADING);
    if(heading){current={name:clean(heading[2]),lines:[]};sections.push(current);continue;}
    if(current)current.lines.push(line);
  }
  return sections;
}
function proseWithoutSectionHeadings(markdown) {
  const lines=[];let fenced=false;
  for(const line of String(markdown||'').split('\n')){
    if(/^\s*(?:```|~~~)/.test(line))fenced=!fenced;
    if(!fenced&&SECTION_HEADING.test(line))continue;
    lines.push(line);
  }
  return lines.join('\n');
}
// The first line a reader would see under a heading; a heading with nothing under
// it is a fact worth stating, not a hit to dress up as content.
function sectionOpening(sections, name) {
  const section=sections.find(candidate=>candidate.name===name);
  if(!section)return '';
  for(const line of section.lines){
    const text=clean(line.replace(/^(?:[-*+>]\s+|\d+\.\s+)/,''));
    if(text)return text;
  }
  return '';
}
// `（本庫設計，未實測）` says how the page was written, so a label the reader is
// shown should carry it no more than the index does.
const sectionLabelName = name => clean(withoutEditorialNotes(name)).replace(/\s+/g, '') || name;
function abbreviatedQuery(query, limit=40) {
  const chars=Array.from(query.trim());
  return chars.slice(0,limit).join('')+(chars.length>limit?'…':'');
}
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
const preprocessProblemQuery = text => (text || '')
  .replace(/(?:\s*(?:的案例|的例子|的經驗|的工具|的用法|的方法|的解法|的做法|的推薦|的流程|案例|例子|解法|做法))(?:\s*[?？。！!]*)$/g, ' ')
  .replace(/([\u4e00-\u9fa5]{2,})(?:且|而且|並且|以及|還有|同時)([\u4e00-\u9fa5]{2,})/g, ' $1 $2 ')
  .replace(/([\u4e00-\u9fa5]{2,})(?:且|而且|並且|以及|還有|同時)([\u4e00-\u9fa5]{2,})/g, ' $1 $2 ')
  .replace(/(?<=[\u4e00-\u9fa5a-zA-Z0-9])\s+(?:而且|並且|以及|還有|同時|另外|且|和|跟|與)\s+(?=[\u4e00-\u9fa5a-zA-Z0-9])/g, ' ')
  .replace(/(?:做|製作|產出|生成|寫|整理)?\s*(?:[一二兩三123幾]\s*(?:份|個|張|本|條|則)|一次性|例行|日常)?\s*(?:分析|研究|調研|比較|調查|評估)?\s*競品\s*(?:分析|研究|調研|比較|調查|評估|定位)?/g, ' 競品 分析 ')
  .replace(/(?:代碼|程式碼|程式|\b(?:codes?)\b)\s*(?:除錯|排錯|修復|\b(?:debugging|debug)\b|調試)/gi, ' 代碼 除錯 ')
  .replace(/(?:除錯|排錯|修復|\b(?:debugging|debug)\b|調試)\s*(?:代碼|程式碼|程式|\b(?:codes?)\b)/gi, ' 代碼 除錯 ')
  .replace(/(?:代碼|程式碼|程式|\b(?:codes?)\b)\s*(?:重構|優化|結構調整|改善)/gi, ' 代碼 重構 ')
  .replace(/(?:重構|優化)\s*(?:代碼|程式碼|程式|\b(?:codes?)\b)/gi, ' 代碼 重構 ')
  .replace(/(?:文件|文檔|檔案|\b(?:documents?|docs?)\b)\s*(?:翻譯|轉譯)/gi, ' 文件 翻譯 ')
  .replace(/(?:翻譯|轉譯)\s*(?:文件|文檔|檔案|\b(?:documents?|docs?)\b)/gi, ' 文件 翻譯 ')
  .replace(/(?:論文|\b(?:papers?)\b)\s*(?:翻譯|轉譯)/gi, ' 論文 翻譯 ')
  .replace(/(?:翻譯|轉譯)\s*(?:論文|\b(?:papers?)\b)/gi, ' 論文 翻譯 ')
  .replace(/(?:兩週一次|每週一次|每週)\s*(週報|工作週報)/g, ' $1 整理 ')
  .replace(/(?:寫|撰寫|製作|做(?!法)|生成|產出)\s*(週報|工作週報)/g, ' $1 整理 ')
  .replace(/(週報|工作週報)\s*(?:寫|撰寫|製作|做(?!法)|生成|產出)/g, ' $1 整理 ')
  .replace(/(?:兩週一次|每週一次|每週|每天|每日)\s*(日報|工作日誌)/g, ' $1 整理 ')
  .replace(/整理\s*(?:每週|每日|每天)\s*(日報|工作日誌)/g, ' 整理 $1 ')
  .replace(/(?:寫|撰寫|製作|做(?!法)|產出)\s*(日報|工作日誌)/g, ' $1 整理 ')
  .replace(/(日報|工作日誌)\s*(?:寫|撰寫|製作|做(?!法)|產出)/g, ' $1 整理 ')
  .replace(/(?:寫|撰寫|製作|做(?!法)|修改|優化|健檢)\s*(履歷|\bcv\b)/gi, ' 履歷 修改 ')
  .replace(/(履歷|\bcv\b)\s*(?:寫|撰寫|製作|做(?!法)|修改|優化|健檢)/gi, ' 履歷 修改 ')
  .replace(/(?:寫|撰寫|創作|生成|產出|編寫)\s*(文案|貼文)/g, ' $1 ')
  .replace(/(文案|貼文)\s*(?:寫|撰寫|創作|生成|產出|編寫)/g, ' $1 ')
  .replace(/(?:自動)?\s*(?:寄信|發信|寄送|發送)\s*(?:郵件|信件|\b(?:emails?|mails?)\b)/gi, ' 郵件 自動化 ')
  .replace(/(?:郵件|信件|\b(?:emails?|mails?)\b)\s*(?:自動)?\s*(?:寄信|發信|寄送|發送)/gi, ' 郵件 自動化 ')
  .replace(/(?:自動寄信|自動發信)/g, ' 郵件 自動化 ')
  .replace(/(?:郵件|信件|\b(?:emails?|mails?)\b)\s*(?:回覆|回信|答覆)/gi, ' 郵件 回覆 ')
  .replace(/(?:回覆|回信|答覆)\s*(?:郵件|信件|\b(?:emails?|mails?)\b)/gi, ' 郵件 回覆 ')
  .replace(/(?:一次性|臨時|例行|批量)\s*(?:爬蟲|抓取|爬取|網頁抓取|資料抓取)/gi, ' 爬蟲 抓取 ')
  .replace(/(?:網頁|網站|\b(?:web|websites?|urls?)\b|網址|資料|數據)\s*(?:抓取|爬取|爬蟲)/gi, ' 爬蟲 抓取 ')
  .replace(/(?:抓取|爬取)\s*(?:網頁|網站|\b(?:web|websites?|urls?)\b|資料|數據)/gi, ' 爬蟲 抓取 ')
  .replace(/(?:模擬|演練|練習|準備)\s*(?:面試|求職面試)/g, ' 面試 準備 ')
  .replace(/(?:面試|求職面試)\s*(?:模擬|演練|練習|準備)/g, ' 面試 準備 ')
  .replace(/(?:語音|錄音|音訊|音頻)\s*(?:逐字稿|轉文字|轉錄|聽打)/g, ' 逐字稿 ')
  .replace(/(?:逐字稿|轉文字|轉錄|聽打)\s*(?:語音|錄音|音訊|音頻)?/g, ' 逐字稿 ')
  .replace(/(?:整理|匯總|摘要|記錄|紀錄|做|寫)?\s*(?:[一1]\s*份|[一1]\s*次)\s*(?:會議|開會)\s*(?:筆記|記錄|紀錄|紀要|總結|摘要|重點|結論)?/g, ' 會議 筆記 ')
  .replace(/(?:會議|開會)\s*(?:總結|重點|結論)/g, ' 會議 筆記 ')
  .replace(/(?:開會|開會的)\s*(?:記錄|紀錄|筆記|紀要)/g, ' 會議 筆記 ')
  .replace(/(?:合約|合同|協議|契約)\s*(?:審閱)/g, ' 合約 審核 ')
  .replace(/(?:審閱)\s*(?:合約|合同|協議|契約)/g, ' 合約 審核 ')
  .replace(/(?:發票|收據)\s*(?:辨識|識別)/g, ' 發票 辨識 ')
  .replace(/(?:辨識|識別)\s*(?:發票|收據)/g, ' 發票 辨識 ')
  .replace(/(?:做|設計|製作|發放|整理|分析)?\s*(?:[一二兩三123幾]\s*(?:份|個|張|次))?\s*(?:問卷|調查問卷|使用者問卷|客戶問卷)\s*(?:調查|設計|分析|整理|收集|回饋)?/g, ' 問卷 ')
  .replace(/(?:問卷|調查問卷)\s*(?:調查|設計|分析|整理|收集|回饋)/g, ' 問卷 ')
  .replace(/(?:做|進行|撰寫|寫|整理)?\s*(?:[一二兩三123幾]\s*(?:篇|份|本))?\s*(?:文獻|論文|學術文獻)\s*(?:回顧|整理|探討|綜述|梳理)/g, ' 論文 整理 ')
  .replace(/(?:回顧|整理|綜述|梳理)\s*(?:[一二兩三123幾]\s*(?:篇|份|本))?\s*(?:文獻|論文|學術文獻)/g, ' 論文 整理 ')
  .replace(/(?:機票|機位|航班)\s*(?:比價查詢|比價網|價格比較|價格查詢|比價|比較|查價|價格|票價)/g, ' 機票 比價 ')
  .replace(/(?:比價查詢|比價網|價格比較|價格查詢|比價|比較|查價)\s*(?:機票|機位|航班)/g, ' 機票 比價 ')
  .replace(/(?:追蹤|監控|監聽)\s*(?:價格|商品價格|物價)/g, ' 價格 追蹤 ')
  .replace(/(?:價格|商品價格)\s*(?:追蹤|監控|監聽)/g, ' 價格 追蹤 ')
  .replace(/(?:我想|我要|如何|怎麼)?\s*(?:報銷|申請報銷|請款|核銷)\s*(差旅|出差|公差)\s*(?:費用|支出|代墊款)?/g, ' $1 報銷 ')
  .replace(/(差旅|出差|公差)\s*(?:費用|支出|代墊款)?\s*(?:報銷|申請報銷|請款|核銷)/g, ' $1 報銷 ')
  .replace(/(差旅|出差|公差)\s*(?:費用|支出|代墊款)/g, ' $1 報銷 ')
  .replace(/(?:我想|我要|如何|怎麼)?\s*(?:報銷|申請報銷|請款|核銷)\s*(?:費用|支出|代墊款)/g, ' 費用 報銷 ')
  .replace(/(?:費用|支出|代墊款)\s*(?:報銷|申請報銷|請款|核銷)/g, ' 費用 報銷 ')
  .replace(/(?:我想|我要|如何|怎麼|幫我)?\s*(?:做|進行|執行|處理)?\s*(?:[一1]\s*次)?\s*(?:資料|數據|表格|csv)\s*(?:整理乾淨|去除重複|清理|清洗|整理|去重)/gi, ' 資料 整理 ')
  .replace(/(?:我想|我要|如何|怎麼|幫我)?\s*(?:整理乾淨|去除重複|清理|清洗|整理|去重)\s*(?:資料|數據|表格|csv)/gi, ' 資料 整理 ')
  .replace(/(?:我想|我要|如何|怎麼|幫我)?\s*(?:伺服器|系統|網站|服務|運行|應用)?\s*(?:日誌檔|日誌記錄|日誌|\b(?:logs?)\b)\s*(?:分析|排查|查閱|檢視|統計|分診)/gi, ' 日誌 ')
  .replace(/(?:我想|我要|如何|怎麼|幫我)?\s*(?:分析|排查|查閱|檢視|統計|分診)\s*(?:伺服器|系統|網站|服務|運行|應用)?\s*(?:日誌檔|日誌記錄|日誌|\b(?:logs?)\b)/gi, ' 日誌 ')
  .replace(/(?:伺服器|系統|網站|服務|運行|錯誤)\s*(?:日誌檔|日誌記錄|日誌)/g, ' 日誌 ')
  .replace(/(?:我想|我要|如何|怎麼|幫我)?\s*(?:法規遵循|合規性|法規|合規|法令|規章)\s*(?:遵循|遵從|審查|審核|查核|比對|盤點|檢查|符合性)/g, ' 法規 審查 ')
  .replace(/(?:我想|我要|如何|怎麼|幫我)?\s*(?:審查|審核|查核|比對|盤點|檢查)\s*(?:法規遵循|合規性|法規|合規|法令|規章)/g, ' 法規 審查 ')
  .replace(/(?:做|製作|產出|生成|寫|整理)?\s*(?:[一二兩三123幾]\s*(?:份|個|張|本|頁))?\s*(?:簡報|投影片|\b(?:ppt|powerpoints?)\b)\s*(?:製作|大綱|內容|設計)?/gi, ' 簡報 ')
  .replace(/(?:做|製作|產出|生成|寫|整理)\s*(?:簡報|投影片|\b(?:ppt|powerpoints?)\b)/gi, ' 簡報 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:做|進行|處理)?\s*(?:[一1]\s*次)?\s*(?:筆記本|筆記軟體|個人筆記|備忘錄|舊筆記|筆記)\s*(?:整理乾淨|整理|歸納|分類|回顧|梳理|記錄)/gi, ' 筆記 整理 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:整理乾淨|整理|歸納|分類|回顧|梳理)\s*(?:筆記本|筆記軟體|個人筆記|備忘錄|舊筆記|筆記)/gi, ' 筆記 整理 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:搭建|建立|建置|建構|製作|打造|維護|管理)?\s*(?:個人|自建|團隊|企業)?\s*(?:知識庫|知識管理|知識體系|個人知識庫)\s*(?:搭建|建立|建置|建構|製作|打造|維護|管理)?/gi, ' 知識庫 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:分析|整理|收集|匯總|分診|分類|處理)?\s*(?:[一1]\s*次)?\s*(?:客戶|用戶|使用者|顧客|讀者)\s*(?:反饋|意見|評價|回饋|滿意度)\s*(?:分析|整理|收集|匯總|分診|分類|處理)?/gi, ' 客戶 回饋 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:智能|自動|ai|智慧)?\s*(?:分析|整理|收集|匯總|分診|分類|處理)?\s*(?:[一1]\s*次)?\s*(?:智能|自動|ai|智慧)?\s*(?:客服工單|客訴工單|客訴|客戶投訴)\s*(?:分析|整理|工單|處理)?/gi, ' 客訴 工單 ')
  .replace(/(?:智能|自動|ai|智慧)?\s*(?:客服工單|客訴工單|客訴|客戶投訴)\s*(?:分析|整理|工單|處理)/gi, ' 客訴 工單 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:準備|演練|練習|提問|題目|問題)\s*(?:面試|求職面試)/gi, ' 面試 準備 ')
  .replace(/(?:面試|求職面試)\s*(?:提問|題目|問題|準備|演練|練習)/gi, ' 面試 準備 ')
  .replace(/(?:篩選|過濾|初篩|挑選)\s*(?:履歷|簡歷|\b(?:cv|resumes?)\b)/gi, ' 履歷 修改 ')
  .replace(/(?:履歷|簡歷|\b(?:cv|resumes?)\b)\s*(?:篩選|過濾|初篩|挑選)/gi, ' 履歷 修改 ')
  .replace(/(?:找工作|求職投遞|求職準備)/gi, ' 求職 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:寫|撰寫|創作|生成|產出|編寫)?\s*(?:[一二兩三123幾]\s*(?:篇|份|則|段|條))?\s*(?:行銷|宣傳|廣告|品牌)\s*(?:文案|貼文|內容)/gi, ' 行銷 文案 ')
  .replace(/\bmarketing\s*copy(?:writing)?\b/gi, ' 行銷 文案 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:社群|社交|社媒|\b(?:social|sns)\b)\s*(?:自動)?\s*(?:排程|定時|預約)/gi, ' 社群 排程 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:自動)?\s*(?:排程|定時|預約)\s*(?:社群|社交|社媒|\b(?:social|sns)\b)/gi, ' 社群 排程 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:社群|社交|社媒|\b(?:social|sns)\b)\s*(?:自動)?\s*(?:發布|發文|貼文)/gi, ' 社群 發文 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:自動)?\s*(?:發布|發文|貼文)\s*(?:社群|社交|社媒|\b(?:social|sns)\b)/gi, ' 社群 發文 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:\b(?:system|code|frontend|web|website|page)\b|系統|代碼|程式碼|前端|網站|網頁)?\s*(?:效能|性能|\b(?:performance)\b)\s*(?:\b(?:analysis|optimization|tuning|benchmark|benchmarking|metrics?)\b|分析|優化|調優|改善|檢測|測試|實驗|指標)?/gi, ' 效能 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:\b(?:analysis|optimization|tuning|benchmark|benchmarking|metrics?)\b|分析|優化|調優|改善|檢測|測試)\s*(?:\b(?:system|code|frontend|web|website|page)\b|系統|代碼|程式碼|前端|網站|網頁)?\s*(?:效能|性能|\b(?:performance)\b)/gi, ' 效能 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:審核|審查|稽核|覆核)\s*(報帳|核銷|報銷|費用|支出)/gi, ' $1 審核 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(報帳|核銷|報銷|費用|支出)\s*(?:審核|審查|稽核|覆核)/gi, ' $1 審核 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:管理|追蹤|排程|掌控|推進|規劃)?\s*(?:[一1]\s*個)?\s*(?:專案|項目|工項)\s*(?:進度|排程|追蹤|甘特圖|狀況|狀態(?!機)|日程)/gi, ' 專案 進度 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:進度|排程|狀況|狀態(?!機)|日程)\s*(?:追蹤|管理|掌握|查看)\s*(?:專案|項目|工項)/gi, ' 專案 進度 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:管理|主持|負責|協調)\s*(?:專案|項目)/gi, ' 專案 管理 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:專案|項目)\s*(?:管理|主持|協調)/gi, ' 專案 管理 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:把|將)?\s*(?:錄音檔|語音檔|音訊檔|錄音|語音|音訊|音頻|訪談錄音|會議錄音)\s*(?:轉成|轉換成|轉為|轉做|轉|生成|產出|輸出)?\s*(?:逐字稿|文字稿|文字|逐字記錄|文稿)/gi, ' 逐字稿 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:錄音檔|語音檔|音訊檔|錄音|語音|音訊|音頻)\s*(?:轉寫|轉錄|聽打|聽寫|整理)/gi, ' 逐字稿 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:轉寫|轉錄|聽打|聽寫)\s*(?:錄音檔|語音檔|音訊檔|錄音|語音|音訊|音頻)/gi, ' 逐字稿 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:做|進行|執行|產出)?\s*(數據|資料|業務數據|運營數據|營運數據|統計)\s*((?:分析|報表|報告|可視化|視覺化|儀表板))/gi, ' $1 $2 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:分析|統計|盤點)\s*(數據|資料|業務數據|運營數據|營運數據)/gi, ' $1 分析 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:報表|報告)\s*(?:分析|解讀|整理)/gi, ' 數據 分析 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:做|進行|執行|撰寫)?\s*(?:市場|行業|產業|競業)\s*(?:調研|研究|分析|調查|盤點)/gi, ' 市場 調研 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:調研|研究|分析|調查|盤點)\s*(?:市場|行業|產業|競業)/gi, ' 市場 調研 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:做|進行|執行|撰寫)?\s*(產品|商品)\s*(?:調研|研究|分析|調查|規劃|定位)/gi, ' $1 調研 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:調研|研究|分析|調查)\s*(產品|商品)/gi, ' $1 調研 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:研讀|精讀|閱讀|導讀|解讀)\s*(?:論文|文獻|學術文獻)/gi, ' 論文 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:論文|文獻|學術文獻)\s*(?:研讀|精讀|閱讀|導讀|解讀)/gi, ' 論文 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:做|撰寫|寫|整理|記錄)?\s*(?:(?:讀書|書籍|書摘)\s*(?:筆記|心得|摘要|總結)|閱讀\s*(?:筆記|心得))/gi, ' 閱讀 筆記 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:整理|記錄|寫)\s*(?:讀書|書籍|書摘|閱讀)\s*(?:筆記|心得)/gi, ' 閱讀 筆記 ')
  .replace(/(?<![\u4e00-\u9fa5])(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:學習|練習|自學|提升|學)\s*(?:英語|英文|外語|外文|第二外語|口說|會話)/gi, ' 英語 學習 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:英語|英文|外語|外文|語言|口說|會話)\s*(?:學習|自學|練習|家教|輔導|教材)/gi, ' 英語 學習 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:掃描|檢測|排查|查找|探測)\s*(?:漏洞|弱點|資安漏洞|安全隱患)/gi, ' 資安 漏洞 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:漏洞|弱點|資安|安全)\s*(?:掃描|檢測|排查|探測)/gi, ' 資安 漏洞 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:隱私|個資|個人資料|隱私權)\s*(?:審查|檢查|合規|遵循|查核|保護|防護)/gi, ' 隱私 審查 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:審查|檢查|查核)\s*(?:隱私|個資|個人資料)/gi, ' 隱私 審查 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:雲端|服務|專案|架構|伺服器)?\s*(?:成本|用量)\s*(?:分析|控管|優化|盤點|核算|統計)/gi, ' 成本 分析 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:雲端|服務|專案|架構|伺服器)\s*(?:費用|支出)\s*(?:分析|控管|優化|盤點|核算|統計)/gi, ' 成本 分析 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:費用|支出)\s*(?:分析|核算)/gi, ' 成本 分析 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:分析|控管|盤點|核算|優化)\s*(?:雲端|服務|專案|架構|伺服器)?\s*(?:成本|用量)/gi, ' 成本 分析 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:分析|核算)\s*(?:雲端|服務|專案|架構|伺服器)?\s*(?:費用|支出)/gi, ' 成本 分析 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:供應商|廠商|承包商|委外廠商)\s*(?:評估|審查|審核|篩選|比價|評選|考評)/gi, ' 供應商 評估 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:評估|審查|審核|篩選|比價|評選|考評)\s*(?:供應商|廠商|承包商|委外廠商)/gi, ' 供應商 評估 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:招募|招聘|求才|徵才)\s*(?:審查|審核|初篩|篩選|評估|流程)/gi, ' 招募 審查 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:審查|審核|初篩|篩選|評估)\s*(?:招募|招聘|求才|徵才)/gi, ' 招募 審查 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:比對|核對|核查|校對|對照)\s*(?:合約|合同|契約|合約附件|合約條款)/gi, ' 合約 比對 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:合約|合同|契約|合約附件|合約條款)\s*(?:比對|核對|核查|校對|對照)/gi, ' 合約 比對 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:法務|法律)\s*(?:審查|審核|合規|檢閱|分析|稽核|諮詢)/gi, ' 法務 審查 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:審查|審核|合規|檢閱|分析|稽核)\s*(?:法務|法律)/gi, ' 法務 審查 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:比對|核對|核查|校對|對照)\s*(?:報表|報告|對帳單|數據報表)/gi, ' 報表 比對 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:報表|報告|對帳單|數據報表)\s*(?:比對|核對|核查|校對|對照)/gi, ' 報表 比對 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:做|製作|產出|撰寫|寫|發送|排版|整理)?\s*(?:[一二兩三123幾]\s*(?:份|封|期))?\s*(?:電子報|\b(?:newsletters?)\b)\s*(?:製作|發送|排版|整理|撰寫|內容)?/gi, ' 電子報 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:做|製作|產出|撰寫|寫|發送|排版|整理)\s*(?:電子報|\b(?:newsletters?)\b)/gi, ' 電子報 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:管理|盤點|追蹤|監控|統計|控管)\s*(?:庫存|存貨|物料|備品)/gi, ' 庫存 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:庫存|存貨|物料|備品)\s*(?:管理|盤點|追蹤|監控|統計|控管)/gi, ' 庫存 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:付款|金流|支出|扣款)\s*(?:審核|審批|覆核|核准|把關)/gi, ' 付款 審核 ')
  .replace(/(?:請幫我|請教我|請教|請示|請問|請|我想|我要|如何|怎麼|幫我)?\s*(?:審核|審批|覆核|核准|把關)\s*(?:付款|金流|支出|扣款)/gi, ' 付款 審核 ')
const _baseTokenize = text => norm(text || '').trim().replace(/[「」『』"“”]/g, ' ').replace(/(?:審核|審查|檢閱|分析)\s*(?:採購|採買)\s*(合約|合同|契約)/g, ' 採購 合約 審核 ').replace(/(?:採購|採買)\s*(合約|合同|契約)\s*(?:審核|審查|檢閱|分析)/g, ' 採購 合約 審核 ').replace(/(?:採購|採買)\s*(合約|合同|契約)/g, ' 採購 合約 ').replace(/(?:合約|合同|契約)\s*(?:採購|採買)/g, ' 採購 合約 ').replace(/(合約|合同|協議|契約)\s*(審核|審查|檢閱|分析)/g, ' $1 $2 ').replace(/(審核|審查|檢閱|分析)\s*(合約|合同|協議|契約)/g, ' $2 $1 ').replace(/\bcontract\s*reviews?(?:ing)?\b/gi, ' 合約 審核 ').replace(/(發票|收據)\s*(?:處理|核對)/g, ' $1 報帳 ').replace(/(?:處理|核對)\s*(發票|收據)/g, ' $1 報帳 ').replace(/(帳單|賬單)\s*(?:處理|核對)/g, ' $1 對帳 ').replace(/(?:處理|核對)\s*(帳單|賬單)/g, ' $1 對帳 ').replace(/\binvoice\s*processings?\b/gi, ' 發票 報帳 ').replace(/(?:資料|數據|文件|規格|pdf)\s*(?:擷取|抽取|提取)/gi, ' 文件 擷取 ').replace(/(?:擷取|抽取|提取)\s*(?:資料|數據|文件|規格|pdf)/gi, ' 文件 擷取 ').replace(/\bdata\s*extractions?\b/gi, ' 文件 擷取 ').replace(/(?:播客|podcast)\s*(?:摘要|總結|重點整理|逐字稿整理)/gi, ' 播客 摘要 ').replace(/(?:摘要|總結|重點整理)\s*(?:播客|podcast)/gi, ' 播客 摘要 ').replace(/\bpodcast\s*summar(?:y|ies|izations?)\b/gi, ' 播客 摘要 ').replace(/(?:商品|產品|機票|飯店|住宿)?\s*(?:價格|價錢)\s*(?:比較|比對|對比)/g, ' 比價 ').replace(/(?:比較|比對|對比)\s*(?:價格|價錢)/g, ' 比價 ').replace(/\bprice\s*comparisons?\b/gi, ' 比價 ').replace(/(?:客戶|顧客|用戶)\s*(?:支援|服務)/g, ' 客服 ').replace(/\bcustomer\s*supports?\b/gi, ' 客服 ').replace(/會議\s*(?:筆記|記錄|紀錄|紀要)/g, ' 會議 筆記 ').replace(/(?:筆記|記錄|紀錄|紀要)\s*會議/g, ' 會議 筆記 ').replace(/\bmeeting\s*notes?\b/gi, ' 會議 筆記 ').replace(/\binterview\s*prep(?:arations?)?\b/gi, ' 面試 準備 ').replace(/(?:報銷|報帳|核銷|申請)\s*(?:出差|差旅)\s*(?:費用|費|補助)?/g, ' 出差 報銷 ').replace(/(?:出差|差旅)\s*(?:費用|費|補助)\s*(?:報銷|報帳|核銷|申請)/g, ' 出差 報銷 ').replace(/(?:審核|審查|檢閱|分析)\s*(?:採購|採買)\s*(合約|合同)/g, ' 採購 合約 審核 ').replace(/(?:採購|採買)\s*(合約|合同)\s*(?:審核|審查|檢閱|分析)/g, ' 採購 合約 審核 ').replace(/(?:採購|採買)\s*(合約|合同)/g, ' 採購 合約 ').replace(/(?:合約|合同)\s*(?:採購|採買)/g, ' 採購 合約 ').replace(/(?:寫|撰寫|產出|創作)?\s*(?:社群|社群媒體|sns)\s*(文案|貼文|行銷|企劃|經營)/g, ' 社群 $1 ').replace(/(文案|貼文)\s*(?:撰寫|創作|生成|產出|編寫)/g, ' $1 ').replace(/(?:撰寫|創作|生成|產出|編寫)\s*(文案|貼文)/g, ' $1 ').replace(/(行銷|推廣)\s*(文案|貼文)/g, ' $1 $2 ').replace(/(?:履歷|cv)\s*(?:健檢|體檢|診斷)/g, ' 履歷 修改 ').replace(/(?:準備|練習)\s*面試/g, ' 面試 準備 ').replace(/(?:求職|找工作)\s*(面試|履歷)/g, ' 求職 $1 ').replace(/(?:做|製作|產出|生成|設計)?\s*(?:一份|1份|個)?\s*(ppt|簡報|投影片|powerpoint)/g, ' $1 ').replace(/(資料庫|數據庫|sql)\s*(查詢|檢索|問答|調度)/g, ' $1 $2 ').replace(/(?:查詢|檢索)\s*(資料庫|數據庫|sql)/g, ' $1 查詢 ').replace(/(?:員工|司機|人員|外勤)?\s*(排班|班表|輪班|值班)/g, ' $1 ').replace(/(排班|班表|輪班|值班)\s*(?:表|系統|規劃|安排)?/g, ' $1 ').replace(/(?:^|\s+)(?:請問|請教|請幫我|幫我|我想|想要|我要|如何|怎麼|可否|能否|有沒有|想知道|想了解|想問|需要)(?:\s*(?:要|找|看|做|搞定|處理|了解|進行|推薦|分享))?/g, ' ').replace(/(?:^|\s+)(?:請問|請教|請幫我|幫我|我想|想要|我要|如何|怎麼|可否|能否|有沒有|想知道|想了解|想問|需要)(?:\s*(?:要|找|看|做|搞定|處理|了解|進行|推薦|分享))?/g, ' ').replace(/(?:\s*(?:的案例|的例子|的經驗|的工具|的用法|的方法|的解法|的做法|的推薦|的流程|案例|例子|解法|做法))(?:\s*[?？。！!]*)$/g, ' ').replace(/(?:自動化\s*測試|測試\s*自動化)/g, ' 自動化 測試 ').replace(/(出差|差旅)\s*(報銷|報帳|核銷|核帳)/g, ' $1 $2 ').replace(/(發票|收據|帳單|賬單)\s*(報帳|核銷|對帳|對賬|核帳|報銷)/g, ' $1 $2 ').replace(/(合約|合同|協議)\s*(審核|審查|檢閱|分析)/g, ' $1 $2 ').replace(/(整理|匯總|摘要|產出|撰寫|生成)\s*(日報|週報|晨報|早報|工作日誌)/g, ' $1 $2 ').replace(/(日報|週報|晨報|早報|工作日誌)\s*(整理|匯總|摘要|產出|撰寫|生成)/g, ' $1 $2 ').replace(/(?:自動|智能|ai)?\s*客服(?:\s*(?:機器人|代理|工單))?/g, ' 客服 ').replace(/(信箱|郵件)\s*(清理|整理|檢視|巡檢)/g, ' $1 $2 ').replace(/(行程|旅行|旅遊|出差)\s*(規劃|安排|整理)/g, ' $1 $2 ').replace(/(旅遊|旅行|出差)\s*行程/g, ' $1 行程 ').replace(/(比價|省錢|折扣|特價)\s*(省錢|比價|折扣)/g, ' $1 $2 ').replace(/(履歷|cv)\s*(修改|優化|健檢|撰寫)/g, ' $1 $2 ').replace(/(?:模擬)?\s*面試\s*(準備|練習|題庫)/g, ' 面試 $1 ').replace(/(整理|匯總|摘要)\s*會議/g, ' $1 會議 ').replace(/會議\s*(整理|匯總|摘要)/g, ' 會議 $1 ').replace(/(整理|清理|巡檢|檢視)\s*收件匣/g, ' $1 收件匣 ').replace(/收件匣\s*(整理|清理|巡檢|檢視)/g, ' 收件匣 $1 ').replace(/(?:^|\s+)(?:我想|想要|幫我|請幫我|如何|怎麼|可不可以|能否)(?:\s*(?:要|找|看|做|搞定|處理|了解|進行))?/g, ' ').replace(/(?:智慧|智能)?\s*開關\s*(?:未支援|不支援)/g, ' 未支援 設備 排障 ').replace(/未支援\s*(?:的)?\s*(?:智慧|智能)?\s*開關/g, ' 未支援 設備 排障 ').replace(/開關\s*(?:看似)?\s*配對\s*(?:好|成功)?\s*(?:了)?\s*(?:卻|為什麼)?\s*(?:無法控制|不能動|燈還是不動|不動)/g, ' 開關 配對 排障 ').replace(/(?:航空|航班|飛機)?\s*追蹤\s*天線\s*量測/g, ' 航空追蹤 天線 量測 ').replace(/(?:掌上型|手持)?\s*圓形\s*螢幕(?:\s*mcp)?/g, ' 掌上型 圓屏 裝置 mcp ').replace(/司機\s*每日/g, ' 司機 每日 ').replace(/代填\s*(?:保險)?\s*(?:救援)?\s*表單/g, ' 代填 救援 表單 ').replace(/(?:日常|平常)?\s*(?:充電)?\s*上限/g, ' 上限 ').replace(/(?:兒少|兒童|孩子)\s*頻道/g, ' 孩子 頻道 ').replace(/(?:每天|每日)?\s*(?:x|推特|twitter)?\s*書籤\s*點子\s*(?:做)?\s*(?:可)?\s*互動/g, ' 每日 書籤 互動 demo 網頁 ').replace(/(?:youtube\s*)?(?:非公開)?\s*(?:播放)?\s*清單\s*(?:每日|每天)?\s*推薦/g, ' youtube 非公開 播放清單 推薦 ').replace(/(?:非公開)?\s*播放清單\s*(?:每日|每天)?\s*推薦/g, ' youtube 非公開 播放清單 推薦 ').replace(/(?:粉絲|關注)\s*名單/g, ' 粉絲 關注名單 ').replace(/(?:是否)?\s*回關/g, ' 回關 ').replace(/條件\s*篩選/g, ' 條件 篩選 ').replace(/健身\s*教練/g, ' 健身 教練 ').replace(/(?:每天|每日)?\s*(?:早上|早晨)?\s*(?:5\s*點|五點)\s*(?:語音)?\s*(?:喚醒|叫醒)(?:\s*(?:教練|bot))?/g, ' 每天 5點 喚醒 教練 ').replace(/(?:5k\s*)?跑走\s*(?:交替)?\s*(?:的)?\s*(?:5k)?\s*(?:計畫|計劃)?/g, ' 5k 跑走 計畫 ').replace(/掃描\s*(?:版)?\s*(?:pdf)?\s*(?:轉|轉成|轉為)\s*epub/g, ' 掃描 pdf epub ').replace(/epub\s*(?:目錄)?\s*(?:重排|可重排)/g, ' epub 目錄 重排 ').replace(/(?:重排|可重排)\s*epub(?:\s*目錄)?/g, ' epub 目錄 重排 ').replace(/快照\s*(?:自行重啟)?\s*(?:回到|回滾到?)\s*(?:數週前|幾週前)/g, ' 快照 重啟 數週前 ').replace(/雲端電腦\s*快照(?:\s*(?:失效|失敗|重啟))?/g, ' 雲端電腦 快照 失效 ').replace(/(?:單一職責|專門負責|專門)?\s*備份\s*bot/g, ' 備份 bot ').replace(/(?:比特幣|虛擬貨幣|加密貨幣|加密)\s*(?:晨報|早報)/g, ' 加密 晨報 ').replace(/(?:(?:加密|幣圈)\s*)?(?:新聞\s*)?一手來源\s*(?:確認|查證|查核)/g, ' 一手來源 確認 ').replace(/(?:dots)?\s*(?:先把)?\s*訂閱\s*(?:頻道)?\s*(?:整理成|做成)?\s*試算表/g, ' dots 訂閱 頻道 試算表 ').replace(/(?:youtube\s*)?(?:專用)?\s*非公開\s*(?:影片)?\s*(?:播放)?\s*清單/g, ' youtube 非公開 播放清單 ').replace(/(?:ai\s*)?(?:自動)?\s*(?:發)?\s*水文\s*(?:帳號)?\s*(?:取關)?/g, ' 水文 帳號 取關 ').replace(/(?:每天|每日)?\s*(?:盤點|檢討)?\s*原創\s*(?:與|和)?\s*轉發(?:\s*(?:檢討|分析|復盤))?/g, ' 原創 轉發 ').replace(/(?:每天|每日)\s*(?:早上|早晨)?\s*(?:自動)?\s*(?:印出|列印|印)?\s*(?:一頁)?\s*(?:加密)?\s*(?:貨幣)?\s*(?:晨報|早報)/g, ' 每天 列印 加密 晨報 ').replace(/(?:加密|幣圈)?\s*新聞\s*(?:一手來源)?\s*(?:確認|查證|查核)/g, ' 加密 新聞 一手來源 確認 ').replace(/(?:點名)?\s*(?:舊聞|翻炒|炒冷飯)\s*(?:重發)?\s*(?:點名)?/g, ' 舊聞 重發 點名 ').replace(/(?:dots)?\s*(?:先把)?\s*訂閱\s*(?:頻道)?\s*(?:整理成|做成)\s*試算表/g, ' dots 訂閱 頻道 試算表 ').replace(/(?:每天|每日)?\s*(?:傍晚)?\s*(?:挑|選)?\s*(?:\d+\s*支)?\s*(?:影片)?\s*(?:放進)?\s*(?:專用)?\s*(?:非公開)?\s*播放清單/g, ' 挑選 影片 非公開 播放清單 ').replace(/(?:不想)?\s*(?:被)?\s*(?:首頁)?\s*演算法\s*(?:牽著走|推薦)/g, ' 演算法 牽著走 ').replace(/(?:依|按)?\s*(?:你訂的)?\s*條件\s*篩\s*粉絲\s*(?:該不該)?\s*回關/g, ' 條件 篩選 粉絲 回關 ').replace(/(?:檢查|分析)?\s*關注\s*名單\s*(?:哪些)?\s*(?:可以)?\s*取關/g, ' 關注名單 取關 ').replace(/(?:強烈)?\s*建議\s*取關/g, ' 建議 取關 ').replace(/(?:粉絲|關注名單)?\s*條件\s*(?:初篩|篩選)\s*(?:與|和)?\s*人工\s*(?:確認|決定)/g, ' 條件 篩選 人工 決定 ').replace(/\b(uc|p)\s*[-_：:#.]?\s*(\d+)\b/g, '$1-$2').replace(/([a-z]+)([\u4e00-\u9fa5])/g, '$1 $2').replace(/([\u4e00-\u9fa5])([a-z]+)/g, '$1 $2').replace(/(?:^|\s)#(\d+)\b/g, ' uc-$1').replace(/\bpull\s+requests?\b/g, ' pr ').replace(/\brate\s*[- ]\s*limits?(?:ing)?\b/g, ' ratelimit ').replace(/\bhealth\s+checks?\b/g, ' healthcheck ').replace(/\bstate\s+machines?\b/g, ' statemachine ').replace(/\bknowledge\s+bases?\b/g, ' knowledgebase ').replace(/\bwork\s*[- ]\s*orders?\b/g, ' workorder ').replace(/\bfine\s*[- ]\s*tun(?:ing|e|ed|es)?\b/g, ' finetune ').replace(/\bcold\s+outreach\b/g, ' outreach ').replace(/\bpost\s*[- ]\s*mortems?\b/g, ' postmortem ').replace(/\bend\s*[- ]\s*to\s*[- ]\s*end\b/g, ' e2e ').replace(/\blife\s+cycles?\b/g, ' lifecycle ').replace(/\bcross\s*[- ]\s*agents?\b/g, ' cross-agent ').replace(/\bheart\s+beats?\b/g, ' heartbeat ').replace(/\bscreen\s+shots?\b/g, ' screenshot ').replace(/\btime\s+sheets?\b/g, ' timesheet ').replace(/\bpay\s+checks?\b/g, ' paycheck ').replace(/\brun\s+times?\b/g, ' runtime ').replace(/\bhand\s*[- ]\s*offs?\b/g, ' handoff ').replace(/\bdry\s*[- ]\s*runs?\b/g, ' dryrun ').replace(/\bguard\s*[- ]\s*rails?\b/g, ' guardrail ').replace(/\bhuman\s*[- ]\s*in\s*[- ]\s*the\s*[- ]\s*loop\b/g, ' hitl ').replace(/\bmodel\s*[- ]\s*context\s*[- ]\s*protocols?\b/g, ' mcp ').replace(/\bcommand\s*[- ]\s*lines?\b/g, ' cli ').replace(/\bapi\s*[- ]\s*keys?\b/g, ' apikey ').replace(/\bgrokbot\b/g, ' grok bot ').replace(/\bmetamuse\b/g, ' meta muse ').replace(/\bprs\b/g, ' pr ').replace(/\bmulti\s*[- ]\s*agents?\b/g, ' multi-agent ').replace(/\bmultiagents?\b/g, ' multi-agent ').replace(/\bretrieval\s*[- ]\s*augmented\s*[- ]\s*generations?\b/g, ' rag ').replace(/\bvector\s*[- ]\s*(?:dbs?|databases?)\b/g, ' vectordb ').replace(/\bcode\s*[- ]\s*reviews?\b/g, ' codereview ').replace(/\bcodereviews?\b/g, ' codereview ').replace(/\bmerge\s+requests?\b/g, ' mr ').replace(/\bweb\s*[- ]\s*hooks?\b/g, ' webhook ').replace(/\bcron\s*[- ]\s*jobs?\b/g, ' cron ').replace(/\bcronjobs?\b/g, ' cron ').replace(/\bcrontabs?\b/g, ' cron ').replace(/\b(?:tool|function)\s*[- ]\s*calls?(?:ing)?\b/g, ' toolcall ').replace(/\btool\s*[- ]\s*us(?:e|ed|es|ing)\b/g, ' toolcall ').replace(/\btext\s*[- ]\s*to\s*[- ]\s*speech\b/g, ' tts ').replace(/\bspeech\s*[- ]\s*to\s*[- ]\s*text\b/g, ' stt ').replace(/\bci\s*[/_-]?\s*cd\b/g, ' cicd ').replace(/\bcontinuous\s+integration\b/g, ' cicd ').replace(/\bself\s*[- ]\s*hosted\b/g, ' self-hosted ').replace(/\b(?:prompt|instruction)\s*[- ]\s*injections?\b/g, ' prompt-injection ').replace(/\bstructured\s*[- ]\s*outputs?\b/g, ' structured-output ').replace(/\bjson\s*[- ]\s*schemas?\b/g, ' json-schema ').replace(/\bserver\s*[- ]\s*sent\s*[- ]\s*events?\b/g, ' sse ').replace(/\bheadless\s*[- ]\s*browsers?\b/g, ' headless-browser ').replace(/\bsub\s*[- ]\s*agents?\b/g, ' subagent ').replace(/\bsubagents?\b/g, ' subagent ').replace(/\bworker\s*[- ]\s*agents?\b/g, ' worker-agent ').replace(/\bdata\s*[- ]\s*(?:exfiltration|leakage|leaks?)\b/g, ' data-leak ').replace(/\bexfiltration\b/g, ' data-leak ').replace(/\bcomputer\s*[- ]\s*use\b/g, ' computer-use ').replace(/\bgui\s*[- ]\s*agents?\b/g, ' gui-agent ').replace(/\bcontext\s*[- ]\s*(?:windows?|lengths?)\b/g, ' context-window ').replace(/\blong\s*[- ]\s*contexts?\b/g, ' context-window ').replace(/\bcontext\s*[- ]\s*compactions?\b/g, ' context-compaction ').replace(/\bhybrid\s*[- ]\s*search(?:es)?\b/g, ' hybrid-search ').replace(/\bsynthetic\s*[- ]\s*data\b/g, ' synthetic-data ').replace(/\bautonomous\s*[- ]\s*agents?\b/g, ' autonomous-agent ').replace(/\bkeep\s*[- ]\s*alives?\b/g, ' keepalive ').replace(/\bredirects?(?:ion)?\b/g, ' redirect ').replace(/\bcanary\s*[- ]\s*(?:releases?|deployments?)?\b/g, ' canary ').replace(/\bblue\s*[- ]\s*green(?:\s*[- ]\s*(?:releases?|deployments?))?\b/g, ' blue-green ').replace(/\borchestrat(?:e|ed|es|ing|or|ors|ion|ions)\b/g, ' orchestration ').replace(/\bcoordinat(?:e|ed|es|ing|or|ors|ion|ions)\b/g, ' coordination ').replace(/\bsupervisors?\b/g, ' supervisor ').replace(/\baccess\s*[- ]\s*controls?\b/g, ' access-control ').replace(/\brole\s*[- ]\s*based\s*[- ]\s*access\s*[- ]\s*controls?\b/g, ' rbac ').replace(/\bevent\s*[- ]\s*driven\b/g, ' event-driven ').replace(/\bsemantic\s*[- ]\s*search(?:es)?\b/g, ' semantic-search ').replace(/\bvector\s*[- ]\s*search(?:es)?\b/g, ' vector-search ').replace(/\bchain\s*[- ]\s*of\s*[- ]\s*thoughts?\b/g, ' cot ').replace(/\bair\s*[- ]\s*gaps?\b/g, ' airgap ').replace(/\bagentic\s*[- ]\s*workflows?\b/g, ' agentic-workflow ').replace(/\bre\s*[- ]*rank(?:ing|s|er|ers)?\b/g, ' rerank ').replace(/\bde\s*[- ]*dup(?:lication)?s?\b/g, ' dedup ').replace(/\bdelegat(?:e|es|ed|ing|ion|ions)\b/g, ' delegate ').replace(/\baudit\s*[- ]\s*trails?\b/g, ' audit-trail ').replace(/\baudit\s*[- ]\s*logs?\b/g, ' audit-log ').replace(/\bexponential\s*[- ]\s*backoffs?\b/g, ' backoff ').replace(/\bbackoffs?\b/g, ' backoff ').replace(/\bmulti\s*[- ]\s*modals?\b/g, ' multimodal ').replace(/\bvision\s*[- ]\s*language\s*[- ]\s*models?\b/g, ' vlm ').replace(/\bsystem\s*[- ]\s*(?:prompts?|instructions?)\b/g, ' system-prompt ').replace(/\bleast\s*[- ]\s*privileges?\b/g, ' least-privilege ').replace(/\bwhite\s*[- ]\s*lists?(?:ing)?\b/g, ' whitelist ').replace(/\ballow\s*[- ]\s*lists?(?:ing)?\b/g, ' allowlist ').replace(/\bblack\s*[- ]\s*lists?(?:ing)?\b/g, ' blacklist ').replace(/\bdeny\s*[- ]\s*lists?(?:ing)?\b/g, ' denylist ').replace(/\bblock\s*[- ]\s*lists?(?:ing)?\b/g, ' blocklist ').replace(/\bsensitive\s*[- ]\s*(?:data|info|information)\b/g, ' sensitive-data ').replace(/\brouters?\b/g, ' router ').replace(/\bkill\s*[- ]\s*switch(?:es)?\b/g, ' kill-switch ').replace(/\bemergency\s*[- ]\s*stops?\b/g, ' emergency-stop ').replace(/\bcircuit\s*[- ]\s*breakers?\b/g, ' circuit-breaker ').replace(/\bcheck\s*[- ]\s*points?(?:ing)?\b/g, ' checkpoint ').replace(/\bcheckpoint(?:ing|s)?\b/g, ' checkpoint ').replace(/\bsandbox(?:ing|es)?\b/g, ' sandbox ').replace(/\boutbox\s*[- ]\s*(?:patterns?)?\b/g, ' outbox ').replace(/\b(?:long|short)\s*[- ]\s*term\s*[- ]\s*memory\b/g, ' memory ').replace(/\b(?:working|shared|external|visible|persistent)\s*[- ]\s*memory\b/g, ' memory ').replace(/\bgithub\s+actions\b/g, ' cicd ').replace(/\bpr\s*審查/g, ' codereview ').replace(/\bidempotenc(?:e|y)\b/g, ' idempotent ').replace(/\b(?:task|work|job)\s*[- ]\s*plannings?\b/g, ' planning ').replace(/\bplannings?\b/g, ' planning ').replace(/\breproducib(?:ility|le)\b/g, ' reproducibility ').replace(/\breproduc(?:e|ed|es|ing)\b/g, ' reproducibility ').replace(/\bcitat(?:ion|ions|e|ed|es|ing)\b/g, ' citation ').replace(/\bfail\s*[- ]\s*overs?\b/g, ' failover ').replace(/\bacceptance\s*[- ]\s*(?:criteri(?:a|on)|tests?|testing)?\b/g, ' acceptance ').replace(/\bacceptances?\b/g, ' acceptance ').replace(/\bparallel(?:ism)?\b/g, ' parallel ').replace(/\bconcurr(?:ency|ent)\b/g, ' concurrency ').replace(/\bgraceful\s*[- ]\s*degradations?\b/g, ' fallback ').replace(/\bcach(?:e|es|ed|ing)\b/g, ' cache ').replace(/\bschedul(?:e|es|ed|ing|er|ers)\b/g, ' schedule ').replace(/\banomaly\s*[- ]\s*detections?\b/g, ' anomaly ').replace(/\breview(?:s|ed|ing|er|ers)?\b/g, ' review ').replace(/\bbenchmark(?:ing|s)?\b/g, ' benchmark ').replace(/\bevaluat(?:e|es|ed|ing|ion|ions)\b/g, ' evaluation ').replace(/\bsafety\s*[- ]\s*rails?\b/g, ' guardrail ').replace(/\bcolor(?:ing)?\s*[- ]\s*pages?\b/g, ' coloring ').replace(/\bprint(?:er|ers|ing|s)?\b/g, ' print ').replace(/\broad\s*[- ]?\s*side(?:\s*[- ]\s*assistance)?\b/g, ' roadside ').replace(/\bbreak\s*[- ]?\s*downs?\b/g, ' breakdown ').replace(/\bstall(?:s|ed|ing)?\b/g, ' stall ').replace(/\bgrades?\b/g, ' grade ').replace(/\bhome\s*[- ]?\s*works?\b/g, ' homework ').replace(/\bassign(?:ment|ments)?\b/g, ' assignment ').replace(/\bsmart\s*[- ]\s*tvs?\b/g, ' tv ').replace(/\bambient(?:\s*[- ]\s*(?:boards?|displays?))?\b/g, ' ambient ').replace(/\bprompt\s*[- ]\s*attacks?\b/g, ' prompt-injection ').replace(/\breservations?\b/g, ' reservation ').replace(/\bbookings?\b/g, ' booking ').replace(/\bcolor(?:ing)?\s*[- ]\s*(?:books?|sheets?)\b/g, ' coloring ').replace(/\btow(?:ing)?(?:\s*[- ]\s*trucks?)?\b/g, ' towing ').replace(/\bself\s*[- ]\s*reflect(?:ion|ive)?\b/g, ' reflection ').replace(/\breflections?\b/g, ' reflection ').replace(/\bself\s*[- ]\s*(?:correct(?:ion|ing|s)?|heal(?:ing|s)?)\b/g, ' self-correction ').replace(/\btoken\s*(?:用量|消耗)\b/g, ' token 用量 ').replace(/\bwebhook\s*通知/g, ' webhook 通知 ').replace(/\btv\s*看板/g, ' tv 看板 ').replace(/電視\s*看板/g, ' 電視 看板 ').replace(/\bmcp\s*(?:伺服器|服務器)/g, ' mcp 伺服器 ').replace(/\bmcp\s*工具/g, ' mcp 工具 ').replace(/\bbot\s*模板/g, ' bot 模板 ').replace(/\bbot\s*通知/g, ' bot 通知 ').replace(/\bapi\s*金鑰/g, ' api 金鑰 ').replace(/保險\s*表單/g, ' 保險 表單 ').replace(/救援\s*表單/g, ' 救援 表單 ').replace(/\bwake\s*[- ]\s*ups?\b/g, ' wakeup ').replace(/\bwakeups?\b/g, ' wakeup ').replace(/\bclaudecodes?\b/g, ' claude code ').replace(/\bt3\s*[- ]\s*codes?\b/g, ' t3 code ').replace(/\bt3codes?\b/g, ' t3 code ').replace(/\bcoding\s*[- ]\s*agents?\b/g, ' coding-agent ').replace(/\b(?:car\s*[- ]\s*rentals?|rental\s*[- ]\s*cars?)\b/g, ' car-rental ').replace(/\binsurance\s*[- ]\s*claims?\b/g, ' insurance-claim ').replace(/\b(?:auto|car)\s*[- ]\s*insurances?\b/g, ' car-insurance ').replace(/\bauto\s*[- ]\s*prints?\b/g, ' auto-print ').replace(/\bautoprints?\b/g, ' auto-print ').replace(/\bopen\s*[- ]\s*sources?\b/g, ' open-source ').replace(/\bchat\s*[- ]\s*negotiations?\b/g, ' chat-negotiation ').replace(/\bmcp\s*[- ]\s*servers?\b/g, ' mcp server ').replace(/\bads\s*[- ]?\s*b\b/g, ' ads-b ').replace(/\bautobahns?\b/g, ' autobahn ').replace(/\b(?:smart|android|google|apple)\s*[- ]\s*tvs?\b/g, ' tv ').replace(/\bandroid-tv\b/g, ' tv ').replace(/\bgoogle-tv\b/g, ' tv ').replace(/\bcloudflare\s*[- ]\s*workers?\b/g, ' cloudflare-worker ').replace(/\bcf\s*[- ]\s*workers?\b/g, ' cloudflare-worker ').replace(/(?:卡車|貨車|長途)?\s*(?:駕駛|司機)\s*工時(?:表|紀錄)?/g, ' 司機 工時 ').replace(/工時\s*(?:核對|查核|對帳|稽核)/g, ' 工時 對帳 ').replace(/(?:出勤|打卡)\s*紀錄/g, ' 打卡 紀錄 ').replace(/超時\s*(?:工作|工時)/g, ' 超時 工時 ').replace(/(?:任務|工作)\s*封存/g, ' 任務 封存 ').replace(/封存\s*(?:任務|工作)/g, ' 封存 任務 ').replace(/家用\s*印表機/g, ' 家用 印表機 ').replace(/\b1090\s*mhz\b/g, ' 1090mhz ').replace(/\b1090\s*兆赫\b/g, ' 1090mhz ').replace(/\b(?:hand\s*[- ]\s*held|palm\s*[- ]\s*top)s?\b/g, ' handheld ').replace(/\bface\s*[- ]\s*swaps?\b/g, ' face-swap ').replace(/(?:每日|每天)\s*(?:隨機)?\s*(?:不重複)?\s*(?:參考照|照片|相片)\s*(?:換臉|替換臉)/g, ' 每日 隨機 參考照 換臉 ').replace(/(?:人臉|面部|臉部|照片)\s*替換/g, ' 換臉 ').replace(/(?:人臉|面部|臉部|照片)\s*換臉/g, ' 換臉 ').replace(/每日\s*換臉/g, ' 每日 換臉 ').replace(/(?:薪資|工資|薪水|薪酬)\s*單?\s*(?:核對|查核|對帳|對賬|稽核|核算)/g, ' 薪資單 核對 ').replace(/工時\s*核算/g, ' 工時 核對 ').replace(/(?:幼兒|幼童|小童|兒童|孩子|小孩)\s*著色(?:頁|本|畫)?/g, ' 兒童著色 ').replace(/著色\s*(?:線稿|圖|頁|本|畫)/g, ' 著色 ').replace(/每日\s*著色/g, ' 每日 著色 ').replace(/(?:電話\s*代撥|代撥\s*電話|電話\s*代打)/g, ' 代打電話 ').replace(/(?:國外|海外|境外|自駕|租車)\s*(?:拋錨|故障|車輛故障)/g, ' 拋錨 ').replace(/(?:帳單|帳戶|費用)\s*抵免/g, ' 帳單 抵免 ').replace(/(?:爭取|降費)\s*抵免/g, ' 抵免 ').replace(/(?:電視|tv)\s*(?:去廣告|免廣告)/g, ' 電視 去廣告 ').replace(/(?:電視|tv)\s*待機/g, ' 電視 待機 ').replace(/(?:電視|tv)\s*(?:看|查|顯示)?\s*(?:女兒|孩子|小孩|學生)?\s*成績/g, ' 電視 成績 ').replace(/(?:客廳)?\s*(?:電視|tv)\s*成績\s*(?:看板)?/g, ' 電視 成績 看板 ').replace(/(?:智慧|智能)?\s*電視\s*(?:常亮|待機)\s*(?:看板|螢幕|顯示)?/g, ' 電視 常亮 看板 ').replace(/(?:自製|客廳)\s*電視\s*首頁/g, ' 自製首頁 電視 ').replace(/(?:常亮|待機)\s*(?:螢幕|看板|顯示)?\s*(?:看|查|顯示)?\s*(?:女兒|孩子|小孩)?\s*成績/g, ' 電視 常亮 看板 成績 ').replace(/(?:常亮|待機)\s*(?:螢幕|看板|顯示)?\s*(?:作業缺交|缺交作業|作業)/g, ' 電視 常亮 看板 缺交作業 ').replace(/(?:電視|tv)\s*(?:顯示|看|查)\s*(?:缺交)?\s*作業/g, ' 電視 缺交作業 ').replace(/(?:電視|tv)\s*(?:常亮|待機)\s*(?:看板|螢幕)?\s*(?:看|查|顯示)?\s*成績/g, ' 電視 常亮 看板 成績 ').replace(/(?:待機|自製)\s*首頁/g, ' 待機 首頁 ').replace(/webhook\s*(?:叫醒|喚醒)/g, ' webhook 叫醒 ').replace(/程式代理\s*通知/g, ' 程式代理 通知 ').replace(/(?:叫醒|喚醒)\s*grok(?:\s*bot)?/g, ' 叫醒 grok bot ').replace(/(?:叫醒|喚醒)\s*bot/g, ' 叫醒 bot ').replace(/(?:工作階段|工作會話|作業階段)\s*(?:結束|完畢|跑完|完成|停滯|卡住|卡死)(?:\s*(?:webhook|通知))?/g, ' 程式代理 工作階段 webhook ').replace(/(?:工作階段|工作會話|作業階段)\s*(?:停滯|卡住|卡死)/g, ' 工作階段 停滯 ').replace(/(?:代訂|預約)\s*餐廳/g, ' 餐廳訂位 ').replace(/(?:代訂|代預約)\s*位/g, ' 訂位 ').replace(/(?:電話|語音)?\s*訂位\s*代理/g, ' 電話訂位 ').replace(/餐廳\s*代訂/g, ' 餐廳訂位 ').replace(/(?:智慧|智能)?\s*開關\s*(?:排障|除錯|故障)/g, ' 開關 排障 ').replace(/(?:家電|設備|裝置)\s*(?:導入|導入排障)/g, ' 設備 導入 ').replace(/(?:未支援|不支援)\s*(?:設備|裝置|家電|硬體)/g, ' 未支援 設備 ').replace(/sdr\s*(?:接收站|接收機|接收器)/g, ' sdr 接收站 ').replace(/sdr\s*解碼/g, ' sdr 解碼 ').replace(/ads-b\s*(?:接收機|接收器)/g, ' ads-b 接收站 ').replace(/(?:分存|封存)\s*(?:驗收|查驗)/g, ' 封存 驗收 ').replace(/(?:實際)?\s*工具\s*(?:實際)?\s*回應/g, ' 工具 回應 ').replace(/(?:工具回應|模型輸出)\s*分存/g, ' 工具 回應 封存 ').replace(/模型\s*輸出/g, ' 模型 輸出 ').replace(/(?:(?:舊|新)\s*交辦|交辦\s*(?:任務|工作))/g, ' 交辦 任務 ').replace(/(?:高速公路|公路)\s*(?:拋錨|故障|壞掉)/g, ' 公路 拋錨 ').replace(/(?:隨機)?\s*參考照\s*換臉/g, ' 參考照 換臉 ').replace(/隨機\s*參考照/g, ' 隨機 參考照 ').replace(/(?:排程|例行任務)\s*(?:關掉|關回|停用)/g, ' 排程 關掉 ').replace(/執行\s*狀態\s*(?:矛盾|不一致|衝突)/g, ' 執行 狀態 矛盾 ').replace(/(?:任務|狀態|執行)\s*(?:矛盾|衝突|不一致)/g, ' 狀態 矛盾 ').replace(/(?:(?:掌上型|手持)\s*圓屏|圓屏\s*(?:裝置|螢幕))/g, ' 掌上型 圓屏 裝置 ').replace(/\bteslascope\s*(?:長途)?\s*(?:出發)?\s*(?:準備)?\s*(?:技能|排程)?/g, ' teslascope 特斯拉 長途 技能 ').replace(/(?:(?:特斯拉|\btesla\b)\s*(?:長途)?\s*(?:出發|出門)?\s*(?:前)?|(?:長途)?\s*(?:出發|出門)\s*(?:前)?)\s*(?:充電|充飽電|充滿電|充滿|充到滿|滿充)?\s*(?:技能)?\s*(?:自動)?\s*還原/g, ' 特斯拉 出發 充電 自動還原 ').replace(/(?:特斯拉|\btesla\b)\s*(?:長途)?\s*(?:出發|出門)?\s*(?:前)?\s*(?:充電|充飽電|充滿電|充滿|充到滿|滿充|充到\s*100%|充電到\s*100%)\s*(?:技能)?/g, ' 特斯拉 出發 充電 ').replace(/(?:出發|出門)\s*(?:前)?\s*(?:電動車|電車|特斯拉)?\s*(?:充電|充飽電|充滿電|充滿|充到滿|滿充|充到\s*100%)/g, ' 出發 充電 ').replace(/(?:特斯拉|\btesla\b|teslascope)\s*(?:長途)?\s*(?:出發)?\s*準備\s*(?:技能)?/g, ' teslascope 特斯拉 長途 技能 ').replace(/(?:長途)?\s*(?:出發|出門)\s*(?:前)?\s*(?:要)?\s*(?:充電|充飽電|充滿電|充滿|充到滿|滿充)(?:\s*(?:100%|到滿))?/g, ' 出發 充電 ').replace(/(?:充電\s*(?:排程)?)\s*(?:自動)?\s*還原/g, ' 充電 排程 自動還原 ').replace(/(?:特斯拉|\btesla\b)\s*(?:長途)?\s*(?:出發)?\s*準備\s*(?:技能)?/g, ' 特斯拉 長途 技能 ').replace(/(?:特斯拉|\btesla\b)\s*長途(?:\s*出發)?/g, ' 特斯拉 長途 出發 ').replace(/(?:特斯拉|\btesla\b)\s*出發/g, ' 特斯拉 出發 ').replace(/(?:電動車|電車)\s*(?:充電|充飽電|充滿電|充滿|充到滿|滿充)?\s*(?:排程)?/g, ' 電動車 充電 排程 ').replace(/出門前\s*充電/g, ' 出發 充電 ').replace(/(?:清理|過濾|巡檢|審查|檢查)?\s*youtube\s*(?:頻道)?\s*(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)?\s*留言\s*(?:過濾|巡檢|清理|審查)?/g, ' youtube 留言 巡檢 ').replace(/(?:小孩|兒童|孩子)\s*頻道\s*(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)?\s*留言(?:\s*(?:過濾|巡檢|審查|檢查|清理))?/g, ' youtube 留言 巡檢 ').replace(/(?:檢查|審查|巡檢|看)?\s*(?:小孩|孩子|兒童)\s*(?:頻道)?\s*(?:留言|評論)/g, ' 孩子 留言 審查 ').replace(/(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)\s*留言\s*(?:過濾|巡檢|清理|審查)?/g, ' 留言 審查 ').replace(/(?:可疑|惡意|不當|不良|垃圾|詐騙)\s*留言\s*(?:過濾|巡檢|清理|審查)?/g, ' 留言 審查 ').replace(/留言\s*(?:安全)?\s*(?:審查|巡檢|過濾)/g, ' 留言 審查 ').replace(/zillow\s*(?:買房|看房|找房)?\s*(?:過濾|篩選)?/g, ' zillow 買房 篩選 ').replace(/(?:兩關)\s*(?:過濾|篩選)/g, ' 篩選 ').replace(/買房\s*(?:兩關)?\s*(?:過濾|篩選)/g, ' 買房 篩選 ').replace(/(?:房源|看房|房屋)\s*(?:篩選|過濾)/g, ' 買房 篩選 ').replace(/(?:房源|看房|房屋|找房|買房)\s*(?:篩選|過濾|交接)?\s*(?:給)?\s*房仲/g, ' 買房 篩選 房仲 ').replace(/(?:買房|看房|找房)\s*(?:下班|尖峰)?\s*通勤(?:\s*時間)?(?:\s*(?:與|和|及)\s*學區)?/g, ' 買房 通勤時間 學區 ').replace(/(?:下班|尖峰)\s*通勤(?:\s*時間)?\s*(?:與|和|及)\s*學區/g, ' 通勤時間 學區 ').replace(/(?:下班|尖峰)\s*通勤(?:\s*時間)?/g, ' 通勤時間 ').replace(/通勤(?:\s*時間)?\s*(?:與|和|及)\s*學區/g, ' 通勤時間 學區 ').replace(/(?:買房|看房|找房)\s*學區(?:\s*(?:篩選|過濾))?/g, ' 買房 學區 篩選 ').replace(/(?:交屋)?\s*(?:前後)?\s*(?:整修|修繕|維護)\s*(?:成本|費用|費)(?:\s*(?:預估|估算|評估|預計))?/g, ' 整修 費用 ').replace(/(?:買房|看房|找房)\s*(?:依|按)?\s*(?:預算|價格)(?:\s*上限)?(?:\s*(?:下班|尖峰)?\s*(?:通勤|通勤時間))?(?:\s*(?:與|和|及)?\s*學區)?(?:\s*(?:過濾|篩選))?/g, ' 買房 預算 學區 篩選 ').replace(/dots\s*(?:官網)?\s*詢問信/g, ' dots 詢問信 ').replace(/(?:詢問信|諮詢信|客戶信件|來信)\s*(?:寫入|記進|記錄|登記|登錄|整理)?\s*(?:notion\s*)?(?:台帳|清單|表格|表|受理表)\s*(?:與|和|及)?\s*(?:回信)?\s*(?:草稿|回覆)/g, ' 詢問信 notion 台帳 草稿 ').replace(/詢問信\s*(?:草稿|回覆|回信)/g, ' 詢問信 草稿 ').replace(/(?:dots)?\s*(?:google)?\s*(?:行事曆|日曆)\s*(?:找|查)\s*(?:空檔|候選日)?(?:\s*(?:擬|寫|存)?\s*(?:回信|草稿|回覆)+)?/g, ' dots 日曆 找空檔 草稿 ').replace(/(?:notion\s*)?(?:受理表|台帳)\s*(?:找|查)?\s*(?:google)?\s*(?:行事曆|日曆|空檔|候選日)(?:\s*(?:找|查)?\s*(?:空檔|候選日))?(?:\s*(?:存|寫|擬|儲存)?\s*(?:回信)?\s*(?:草稿|回覆))?/g, ' notion 台帳 行事曆 空檔 草稿 ').replace(/(?:notion)?\s*(?:受理表|台帳)\s*(?:回信)?\s*(?:草稿|回覆)/g, ' notion 台帳 草稿 ').replace(/(?:找|查)?\s*(?:google)?\s*(?:行事曆|日曆)\s*(?:找|查)?\s*(?:空檔|候選日|時間)/g, ' 行事曆 找空檔 ').replace(/(?:客戶\s*來信|客戶|來信)\s*(?:想約|約)\s*(?:時間|會面|會議)(?:\s*(?:存|寫|擬)?\s*(?:gmail)?\s*(?:回信|草稿|回覆)+)?/g, ' 客戶 來信 約時間 草稿 ').replace(/主管\s*(?:平日|工作日)?\s*(?:晨報|日報)\s*(?:公開)?\s*(?:新聞|情報|資訊)\s*(?:分流|分工|分派)/g, ' 主管 晨報 公開 新聞 分流 ').replace(/主管\s*(?:平日|工作日)?\s*(?:晨報|日報)\s*(?:分工)?/g, ' 主管 晨報 分工 ').replace(/(?:內網|內部)\s*(?:信件|郵件|公文|資料)?\s*(?:與|和)?\s*(?:外部|公開)\s*(?:新聞|情報|資訊|資料)?\s*(?:分流|分工|分派)?/g, ' 晨報 內部 郵件 公開 新聞 分流 ').replace(/晨報\s*分工(?:\s*(?:與|和|及)?\s*notion\s*(?:日報|台帳)?)?/g, ' 晨報 分工 notion ').replace(/dots\s*(?:讀|看)?\s*內部\s*(?:信件|郵件|行程)?/g, ' dots 內部 郵件 ').replace(/(?:grok\s*bot|bot)\s*(?:收|抓|整理)?\s*公開\s*(?:新聞|情報|訊息)?/g, ' grok bot 公開 新聞 ').replace(/hetzner\s*(?:雲主機|主機|伺服器)?\s*(?:補貨|查貨|有貨|候補)?/g, ' hetzner 補貨 ').replace(/(?:雲主機|主機|伺服器)\s*(?:售完|缺貨)?\s*(?:補貨|查貨|候補)\s*(?:下單|購買)?/g, ' 主機 補貨 ').replace(/售完\s*(?:候補|查貨|監看)/g, ' 售完 候補 ').replace(/(?:雲主機|主機|伺服器)?\s*售完\s*(?:每\s*\d+\s*分鐘)?\s*(?:查貨|候補|監看)/g, ' 主機 售完 候補 ').replace(/(?:hetzner)?\s*(?:雲主機|主機|伺服器)?\s*(?:售完|缺貨)\s*(?:候補|補貨|查貨)?\s*(?:自動)?\s*(?:下單|下訂|購買|自動購買)/g, ' hetzner 主機 售完 候補 購買 ').replace(/(?:clawcall|claw call)\s*(?:電話|語音)?\s*(?:訂位|預約)?/g, ' clawcall 電話訂位 ').replace(/(?:電話|語音)\s*(?:訂位|預約)\s*(?:bot|機器人|代理)?/g, ' 電話訂位 bot ').replace(/(?:電話|語音)\s*(?:代訂|訂位|預約)/g, ' 電話訂位 ').replace(/t-mobile\s*(?:悄悄)?\s*(?:漲價|調高|調漲|加價)/g, ' t-mobile 漲價 ').replace(/t-mobile\s*(?:帳單|帳戶)?\s*(?:抵免|減免)/g, ' t-mobile 抵免 ').replace(/siriusxm\s*(?:線上|聊天)?\s*(?:議價|降費|協商|談判)?/g, ' siriusxm 議價 ').replace(/(?:線上|即時)?\s*聊天\s*(?:客服)?\s*議價/g, ' 聊天 議價 ').replace(/(?:帳單|月費|費用)\s*(?:漲價|調高|調漲|加價)/g, ' 帳單 漲價 ').replace(/(?:司機|駕駛)\s*(?:對|核對|核算)?\s*(?:薪資單|薪水|薪資)/g, ' 司機 薪資單 核對 ').replace(/(?:月底|發薪|發薪日)?\s*(?:核對|對|算)\s*(?:薪水|薪資|薪酬)/g, ' 薪資 核對 ').replace(/工時\s*(?:核算|算|計算)?\s*(?:薪水|薪資)/g, ' 工時 薪資 ').replace(/(?:過期|過時|逾期|失效)\s*(?:任務|工作|指示|待辦)\s*(?:重送|重新發送|補發)?/g, ' 過期 任務 重送 ').replace(/(?:待辦|交辦)\s*(?:任務|工作)?\s*(?:過期|逾期|失效)/g, ' 過期 任務 ').replace(/(?:重新|補)\s*發送/g, ' 重送 ').replace(/(?:工具呼叫|工具調用|工具使用)?\s*(?:實際)?\s*回應\s*(?:分存)?\s*(?:隔離|檢疫|封裝)/g, ' 工具 回應 隔離 ').replace(/回應\s*隔離/g, ' 回應 隔離 ').replace(/(?:已)?\s*封存\s*(?:任務|工作)?\s*(?:狀態)?\s*(?:矛盾|衝突|不一致)/g, ' 封存 任務 狀態 矛盾 ').replace(/(?:任務|狀態|執行)\s*(?:矛盾|衝突|不一致)/g, ' 狀態 矛盾 ').replace(/(?:每天|每日)\s*(?:早上|早晨|清晨)?\s*(?:自動)?\s*(?:各)?\s*(?:列印|印出|打印|印)/g, ' 每天 早上 列印 ').replace(/(?:每天)?\s*(?:早上|早晨|清晨)\s*(?:自動)?\s*(?:列印|印出|打印)/g, ' 早上 列印 ').replace(/(?:每天)?\s*早上\s*(?:吐出)?\s*(?:今天的)?\s*著色(?:頁|本|畫)?/g, ' 早上 著色頁 ').replace(/(?:(?:家用|家裡|家中)\s*印表機|印表機\s*著色)/g, ' 家用 印表機 著色 ').replace(/印表機\s*(?:列印|印出|打印)/g, ' 印表機 列印 ').replace(/(?:印表機|印機)\s*(?:列印|印出|印)?\s*(?:黑白|粗線條)?\s*線稿/g, ' 家用 印表機 線稿 ').replace(/(?:(?:黑白|粗線條)\s*線稿|線稿\s*(?:著色|列印))/g, ' 黑白 線稿 著色 ').replace(/(?:獨角獸|小仙子|城堡)\s*(?:線稿|著色)/g, ' 獨角獸 線稿 ').replace(/(?:國外|海外)?\s*(?:車輛|汽車)?\s*(?:拋錨|故障)\s*(?:求援|求助|救援)/g, ' 拋錨 救援 ').replace(/(?:高速公路|公路)\s*(?:車子|車輛|汽車)\s*(?:拋錨|故障|壞掉)(?:\s*(?:找)?\s*(?:拖吊|拖車|救援))?/g, ' 高速公路 車子 拋錨 拖吊 ').replace(/(?:看不懂|聽不懂)\s*(?:德文|德語|當地語言|外語)(?:\s*(?:填|寫)?\s*(?:找)?\s*(?:救援|求助|申請表|表單))?/g, ' 德文 語言 救援 表單 ').replace(/(?:國外|海外|境外|自駕|租車|車輛|汽車|車子)\s*(?:車輛|汽車|車子)?\s*(?:拋錨|故障|壞掉)(?:\s*(?:找)?\s*(?:拖吊|拖車|求援|求助|救援))*/g, ' 拋錨 救援 拖吊 ').replace(/(?:國外|海外|境外)?\s*(?:自駕)?\s*道路\s*救援/g, ' 道路救援 ').replace(/(?:國外|海外)?\s*(?:修車|車輛救援|保險救援)\s*(?:申請表|表單)/g, ' 救援 表單 ').replace(/(?:德文|德語)\s*(?:語音\s*(?:聽不懂|不通)?|(?:聽不懂|不通))/g, ' 德文 語言 ').replace(/道路\s*救援\s*(?:申請表|申請|表單)/g, ' 道路救援 救援 表單 ').replace(/(?:救援|求援|求助)\s*(?:申請表|表單)/g, ' 救援 表單 ').replace(/(?:45\s*分鐘|長\s*時間|超時|逾時|很久|遲遲)\s*(?:沒更新|未更新|停滯|卡住)/g, ' 停滯 ').replace(/(?:程式代理|代碼代理|編程代理)\s*(?:跑完|做完|結束|卡住|停滯)(?:\s*(?:沒|了沒))?/g, ' 程式代理 工作階段 ').replace(/(?:claude\s*code|codex|t3\s*code)\s*(?:跑完|做完|結束)/g, ' claude code 工作階段 ').replace(/(?:客廳|電視|tv)?\s*(?:自製)?\s*(?:常亮|待機)\s*(?:螢幕|看板|顯示|首頁)/g, ' 電視 常亮 看板 ').replace(/(?:抓|查詢|抓取|看|查|查看|顯示|追蹤)\s*(?:女兒|孩子|小孩|學生)?\s*(?:各科)?\s*成績/g, ' 成績 ').replace(/(?:成績|各科成績)\s*(?:與|和|及)\s*(?:缺交作業|缺交|作業)/g, ' 成績 缺交作業 ').replace(/(?:學校)?\s*缺交\s*(?:作業|功課|課業)/g, ' 缺交作業 ').replace(/(?:電視\s*(?:去廣告|免廣告|關掉廣告|去除廣告)|(?:關掉|去除|去|免)\s*(?:電視)?\s*廣告)/g, ' 電視 去廣告 ').replace(/\besp(?:\s*系列)?\s*(?:圓形(?:\s*(?:螢幕|裝置|終端))?|(?:螢幕|裝置|終端))/g, ' esp 圓形 螢幕 ').replace(/語音\s*終端\s*(?:中繼)?/g, ' 語音 終端 中繼 ').replace(/(?:(?:過濾|巡檢|審查|檢查|清理)\s*(?:小孩|孩子|兒童)\s*(?:的)?\s*(?:youtube)?\s*(?:頻道)?\s*(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)?\s*(?:留言|評論)?|(?:小孩|孩子|兒童)\s*(?:的)?\s*(?:youtube)?\s*頻道\s*(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)\s*(?:留言|評論)?)/g, ' 孩子 youtube 留言 審查 ').replace(/(?:交給|交|轉交|轉給)\s*(?:房仲|仲介|經紀人)/g, ' 房仲 ').replace(/(?:交|留|寄|存|送|印|推|寫|分|賣)?\s*給\s*(小孩|孩子|兒童|幼兒|小童|幼童)/g, ' $1 ').replace(/(?:每天|每日)\s*(?:自動)?\s*(?:列印|印出|打印|印)\s*(?:著色頁|著色本|著色畫|線稿)/g, ' 每天 著色頁 列印 ').replace(/(?:調閱|申請|調|取得|索取)?\s*(?:房屋|屋況)\s*揭露\s*(?:文件|資料|報告|表)?/g, ' 揭露文件 ').replace(/(?:調閱|申請|調|取得|索取)\s*揭露\s*(?:文件|資料|報告|表)?/g, ' 揭露文件 ').replace(/(?:幼兒|幼童|小童|兒童|孩子|小孩)\s*(?:著色|塗色|填色)(?:頁|本|畫)?(?:\s*線稿)?/g, ' 兒童著色 線稿 ').replace(/(?:詢問信|諮詢信|客戶信件|來信)\s*(?:寫入|記進|記錄|登記|整理)?\s*(?:notion)?\s*(?:台帳|清單|表格|表)/g, ' 詢問信 notion 台帳 ').replace(/(?:查|找)\s*(?:google)?\s*(?:行事曆|日曆)?\s*(?:候選)?\s*(?:空檔|時間)\s*(?:回信)?\s*(?:草稿|回覆)/g, ' 行事曆 找空檔 草稿 ').replace(/(?:內網|內部)\s*(?:信件|郵件|公文)\s*(?:交|給)?\s*dots/g, ' dots 內部 郵件 ').replace(/(?:公開)?\s*(?:新聞|情報|資訊)\s*(?:交|給)\s*(?:grok(?:\s*bot)?)/g, ' grok bot 公開 新聞 ').replace(/(?:claude\s*code|t3\s*code|codex|程式代理|代碼代理)\s*(?:停滯|卡住|卡死|超時|逾時)\s*(?:webhook)?/g, ' 程式代理 停滯 webhook ').replace(/ads\s*[- ]?\s*b\s*(?:接收站|接收機)?\s*雙頻\s*(?:輪收)?/g, ' ads-b 接收站 雙頻 ').replace(/(?:1090\s*mhz|978\s*mhz)\s*(?:天線)?\s*(?:量測|量度|測試|對照|量測前後)/g, ' 1090mhz 天線 量測 ').replace(/手動\s*(?:重新)?\s*(?:開啟|啟用)\s*(?:的)?\s*排程\s*(?:被)?\s*(?:關掉|關回|停用)/g, ' 手動 排程 關掉 ').replace(/(?:掌上型|手持)\s*(?:圓屏)?\s*(?:裝置)?\s*(?:經|用)?\s*語音\s*(?:入口|終端)/g, ' 掌上型 語音 終端 ').replace(/(?:跨產品|跨系統)\s*(?:舊|過期|失效)\s*交辦\s*(?:重送|重新發送)?/g, ' 跨產品 過期 任務 重送 ').replace(/(?:智慧|智能)\s*開關\s*(?:分層)?\s*排障/g, ' 開關 排障 ').replace(/(?:未支援|不支援)\s*(?:設備|裝置|家電)\s*(?:配對成功)?\s*(?:不能動|無法動作|無法控制)/g, ' 未支援 設備 排障 ').replace(/網購\s*(?:未送達|沒收到)\s*(?:催退|追查退款|催促退款)\s*(?:入帳)?/g, ' 網購 退款 物流 ').replace(/(?:x|twitter|推特)\s*(?:營運)?\s*(?:發文|貼文)\s*(?:前)?\s*(?:人工)?\s*(?:關卡|閘門|核准)/g, ' x 發文 核准 ').replace(/notion\s*跨代理\s*(?:外聯)?\s*(?:記憶|外部記憶)/g, ' notion 跨代理 外聯 記憶 ').replace(/(?:額度|token)\s*(?:燒太快|不夠用?|用太兇|不夠|消耗過快)/g, ' 額度 用量 ').replace(/分層\s*派工/g, ' 分層 派工 ').replace(/(?:只負責|只做|負責)\s*(?=(?:調度|派工))/g, ' ').replace(/(?:調度|派工)\s*(?:重活|繁重工作|執行層)/g, ' 調度 重活 ').replace(/(?:重活|繁重工作)\s*(?:交給|外置|外包)?\s*(?:雲端電腦|外部代理|免費模型)/g, ' 重活 雲端電腦 ').replace(/(?:免費|低價|開源|付費|外部)\s*模型\s*(?:代理|保底)?/g, ' 免費模型 代理 ').replace(/外部\s*代理\s*(?:保底|備援)?/g, ' 外部代理 保底 ').replace(/(?:讀|看)\s*(?:你的|我的|自己的)?\s*flomo/g, ' 讀 flomo ').replace(/(?:舊|歷史|過去)\s*筆記\s*(?:回顧|復盤|反思)?/g, ' 舊筆記 回顧 ').replace(/洞察\s*(?:角度|觀點|視角)\s*(?:推送|推播|發送)?/g, ' 洞察角度 推送 ').replace(/(?:推送|推播|發送)\s*(?:一則\s*)?(?:舊筆記|筆記)?\s*(?:回顧|反思)/g, ' 推送 回顧 ').replace(/洞察\s*(?:模板|範本)\s*(?:輪換|輪流|更換)?/g, ' 洞察 模板 輪換 ').replace(/(?:通勤|上下班)?\s*(?:地鐵|捷運|公車|電車)\s*(?:上)?\s*(?:讀|看)(?:筆記)?/g, ' 地鐵 筆記 ').replace(/(?:義大利|歐洲|海外)?\s*(?:網站|電商)?\s*(?:特價|折扣)?\s*攀岩鞋(?:\s*(?:比價|特價|折扣|進口稅|關稅))?(?:\s*(?:省(?:了|約)?\s*(?:[\$\d]+|幾十|數十)?\s*(?:美元|美金|元|塊)?))?/g, ' 義大利 攀岩鞋 特價 比價 ').replace(/攀岩鞋\s*(?:特價|折扣|便宜)/g, ' 攀岩鞋 特價 ').replace(/攀岩鞋\s*(?:進口稅|關稅|稅費|運費)/g, ' 攀岩鞋 進口稅 ').replace(/(?:饒舌|rap|說唱)\s*(?:講解|說明|教學)?\s*(?:影片|視頻)/g, ' 饒舌 講解 影片 ').replace(/(?:押韻|押韻的)?\s*歌詞\s*(?:樣片|demo)?/g, ' 押韻 歌詞 樣片 ').replace(/(?:vpn)?\s*tun\s*模式/g, ' vpn tun 模式 ').replace(/用量\s*(?:csv|報表|數據)\s*(?:分析|匯出)?/g, ' 用量 csv 分析 ').replace(/用量\s*(?:事件|明細)\s*表/g, ' 用量 事件表 ').replace(/收尾\s*(?:回報|總結|報告)\s*(?:用量)?/g, ' 收尾 回報 用量 ').replace(/(?:回收|二手|循環)\s*門號(?:\s*(?:前持有人|前主人|原持有人))?/g, ' 回收門號 前持有人 ').replace(/(?:收到|接到)?\s*前持有人\s*(?:的)?\s*(?:簡訊|訊息|電話|通知)/g, ' 前持有人 訊息 ').replace(/(?:門號|號碼)\s*(?:仲介站|資料仲介|經紀站)\s*(?:列名|資料)?/g, ' 門號 仲介站 列名 ').replace(/(?:門號|電信)?\s*客服\s*(?:聊天|對話)\s*(?:送不出|發不出|卡住)/g, ' 門號 客服聊天 送不出 ').replace(/([\u4e00-\u9fa5]{2,})(?:與|和|及|跟)([\u4e00-\u9fa5]{2,})/g, ' $1 $2 ').replace(/(?:^|\s+)(?:與|和|及|跟)(?:\s+|$)/g, ' ').replace(/(?:^|\s+)(?:與|和|及|跟)(?=[\u4e00-\u9fa5]{2,})/g, ' ').replace(/([\u4e00-\u9fa5]{2,})(?:與|和|及|跟)(?:\s+|$)/g, '$1 ').replace(/\ba\s*[/_-]?\s*b\s*[- ]\s*tests?(?:ing)?\b/gi, ' ab-test ').replace(/\ba\s*[/_-]?\s*b\s*(?:測試|試驗|檢定)/g, ' ab-test ').replace(/\bab\s*(?:測試|試驗)/g, ' ab-test ').replace(/前後\s*(?:對照|比較)/g, ' ab-test ').replace(/\bre\s*[- ]\s*(?:starts?|boots?)(?:ing)?\b/gi, ' restart ').replace(/(?:已)?\s*封存\s*(?:任務|工作)?\s*(?:收到新交辦後)?\s*(?:被)?\s*(?:重新)?\s*啟動/g, ' 封存 任務 啟動 ').replace(/(?:被)?\s*重新\s*(?:啟動|開啟|拉起)/g, ' 重新啟動 ').replace(/多代理\s*(?:對話鏈)?\s*重啟/g, ' 多代理 重啟 ').replace(/對話鏈\s*重啟/g, ' 對話鏈 重啟 ').replace(/排程\s*(?:被)?\s*(?:舊|過時|過期)\s*(?:指示|約定|規則)\s*(?:關掉|關閉|停用)/g, ' 手動 排程 關掉 過期 指示 ').replace(/(?:舊|過時|過期)\s*(?:指示|約定|規則)\s*(?:關掉|關閉|停用)/g, ' 過期 指示 關掉 ').replace(/(模型輸出|工具回應|工具實際回應|分開儲存|分存)\s*(?:驗收|查驗)/g, ' $1 驗收 ').replace(/分開\s*儲存/g, ' 分開儲存 ').replace(/(?:客廳|常亮|待機)?\s*螢幕\s*(?:顯示|查看|看|查)\s*(?:女兒|孩子|小孩|學生)?\s*成績/g, ' 客廳 電視 常亮 看板 成績 ').replace(/客廳\s*(?:常亮)?\s*螢幕/g, ' 客廳 電視 常亮 看板 ').replace(/(?:兒童|小孩|孩子)\s*(?:影片|視頻)/g, ' 兒童 影片 ').replace(/(?:詢問信|諮詢信|客戶信件)\s*(?:受理表|台帳|清單)/g, ' 詢問信 台帳 ').replace(/(?:客戶\s*來信|客戶|來信)\s*(?:想約|約)?\s*(?:時間|會面|會議)?\s*(?:存|寫|擬)?\s*(?:gmail)?\s*(?:回信|草稿|回覆)+/g, ' 客戶 來信 草稿 ').replace(/分流\s*(?:處理|機制)/g, ' 分流 ').replace(/雲端電腦\s*(?:跑|執行|運行)/g, ' 雲端電腦 ').replace(/(?:每日|每天)\s*筆記\s*(?:回顧|反思)?/g, ' 每日 筆記 回顧 ').replace(/筆記\s*洞察/g, ' 筆記 洞察 ').replace(/筆記\s*回顧/g, ' 筆記 回顧 ').replace(/模板\s*輪換/g, ' 模板 輪換 ').replace(/vpn\s*(?:tun\s*模式)?\s*(?:連線排障|連線錯誤|連線|排障|除錯)/g, ' vpn 連線錯誤 ').replace(/(?:連線|網絡連線|網路連線)\s*(?:被關閉|中斷|被拒|失敗|排障|錯誤)/g, ' 連線錯誤 ').replace(/(?:義大利|歐洲|海外)\s*(?:網站|電商)?\s*(?:特價|折扣|比價)/g, ' 義大利 特價 比價 ').replace(/進口\s*關稅/g, ' 進口關稅 ').replace(/(?:前號主|原號主|舊號主|前持有人|原持有人)\s*(?:的)?\s*(?:簡訊|短信|訊息|通知)/g, ' 前持有人 簡訊 ').replace(/(?:主\s*bot|主代理)\s*(?:分析|核算)\s*(?:用量|消耗|額度)/g, ' 主 bot 分析 用量 ').replace(/分析\s*(?:用量|消耗|額度)/g, ' 分析 用量 ').replace(/(?:長工作|長對話)\s*(?:撞到?|碰|達到)?\s*(?:上下文)?\s*上限/g, ' 長工作 context-window ').replace(/(?:精簡|簡化)\s*(?:排程|例行任務)/g, ' 精簡 排程 ').replace(/(?:沒變化|無變化|無變動|沒變動)\s*(?:就)?\s*(?:不送|不發|不通知|不推送|不回報)/g, ' 沒變化 不送 ').replace(/flomo\s*(?:每日|每天)?\s*(?:兩次)?\s*(?:ai)?\s*洞察/g, ' flomo 每日 洞察 ').replace(/flomo\s*筆記\s*(?:模板)?\s*輪換/g, ' flomo 筆記 模板 輪換 ').replace(/(?:道路)?\s*救援\s*(?:德文|德語)\s*(?:申請表|表單)/g, ' 德文 救援 表單 ').replace(/(?:德文|德語)\s*(?:道路)?\s*救援(?:\s*(?:申請表|表單))?/g, ' 德文 救援 表單 ').replace(/(?:常亮|待機)?\s*螢幕\s*(?:顯示|看|查)\s*(?:女兒|孩子|小孩)?\s*(?:缺交)?\s*作業/g, ' 電視 常亮 看板 缺交作業 ').replace(/電視\s*首頁\s*(?:看|查|顯示)?\s*(?:女兒|孩子)?\s*成績/g, ' 電視 常亮 看板 成績 ').replace(/(?:買房|看房|找房)\s*(?:找)?\s*房仲\s*(?:調|調閱|取得)?\s*揭露(?:\s*文件)?/g, ' 買房 房仲 揭露文件 ').replace(/notion\s*(?:受理表|台帳)\s*(?:存|寫|擬)?\s*(?:回信)?\s*(?:草稿|回覆)/g, ' notion 台帳 草稿 ').replace(/詢問信\s*(?:找|查)?\s*(?:空檔|時間)\s*(?:回信|回覆)?/g, ' 詢問信 行事曆 找空檔 草稿 ').replace(/內外\s*(?:情報|資訊|新聞)?\s*(?:分流|分工|分派)?/g, ' 內部 公開 分流 ').replace(/(?:反爬蟲|爬蟲被擋|防爬|反爬|擋爬蟲|擋代理|擋機器人)/g, ' 反爬蟲 ').replace(/(?:suno|ai)?\s*(?:生成音樂|音樂生成|配樂生成|自動配樂)/g, ' suno 音樂生成 ').replace(/(俄文|俄語|日文|日語|中文|英文|德文|德語|西文|法文|韓文)\s*作者/g, ' $1 作者 ').replace(/(?:啟動|重新啟動)\s*(?:已)?\s*封存(?:\s*(?:任務|工作))?/g, ' 啟動 封存 任務 ').replace(/(?:小孩|孩子|兒童)\s*(?:早上|早晨|清晨)/g, ' 孩子 早上 ').replace(/(?:早上|早晨|清晨)\s*(?:自動)?\s*(?:各)?\s*(?:列印|印出|打印|印)/g, ' 早上 列印 ').replace(/(?:列印|印出|打印|印)\s*(?:著色頁|著色本|著色畫|線稿)/g, ' 列印 著色頁 ').replace(/(?:德文|德語)\s*保險/g, ' 德文 保險 ').replace(/(?:德文|德語)\s*(?:保險)?\s*(?:救援)?\s*(?:申請表|表單)/g, ' 德文 保險 救援 表單 ').replace(/保險\s*(?:道路)?\s*救援/g, ' 保險 道路救援 ').replace(/(?:找|叫|聯絡)?\s*(?:拖吊|拖車)/g, ' 拖吊 ').replace(/(?:修車|車輛救援|保險救援)\s*(?:申請表|表單)/g, ' 救援 表單 ').replace(/(?:自製)?\s*(?:電視|tv)\s*(?:首頁|待機首頁)/g, ' 電視 首頁 ').replace(/(?:首頁|看板)\s*(?:查|看|顯示)?\s*(?:缺交)?\s*作業/g, ' 首頁 缺交作業 ').replace(/(?:女兒|孩子|小孩)?\s*(?:各科)?\s*成績\s*(?:看板|顯示)/g, ' 成績 看板 ').replace(/(?:各科)?\s*成績/g, ' 成績 ').replace(/(?:出發|出門)\s*(?:前)?\s*(?:充電|充飽電|充滿電|充滿|充到滿|滿充|充飽)/g, ' 出發 充電 ').replace(/(?:出發|出門)\s*前/g, ' 出發 ').replace(/(?:充飽電|充滿電|充滿|充到滿|滿充|充飽)/g, ' 充電 ').replace(/安全性?\s*(?:審查|巡檢|審核|檢查)/g, ' 安全 審查 ').replace(/(?:房屋|買房|交屋)?\s*(?:前後)?\s*(?:整修|修繕|維護)\s*(?:費用|成本|費)(?:\s*(?:預估|估算|評估|預計))?/g, ' 買房 整修 費用 ').replace(/買房\s*(?:找)?\s*物件/g, ' 買房 找房 ').replace(/(?:詢問信|諮詢信|客戶信件|來信)\s*(?:記進|寫入|登記|登錄|記錄|存入)/g, ' 詢問信 ').replace(/notion\s*(?:受理表|台帳|表格|清單|表)/g, ' notion 受理表 ').replace(/(?:資料|資訊)\s*分級(?:\s*(?:晨報|日報|報告))?/g, ' 資料分級 晨報 ').replace(/(?:備援|備用|付費)?\s*保底/g, ' 保底 ').replace(/分層\s*派工(?:\s*省額度)?/g, ' 分層 派工 額度 ').replace(/筆記\s*反思(?:\s*對話)?/g, ' 筆記 反思 對話 ').replace(/(?:含|加上|計入|算入)?\s*(?:進口關稅|進口稅|關稅|稅費)/g, ' 進口關稅 ').replace(/連線錯誤\s*(?:排障|除錯|排錯|修復)/g, ' 連線錯誤 排障 ').replace(/(?:小朋友|小孩|孩子|兒童)\s*(?:頻道)?\s*(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)?\s*留言(?:\s*安全性?)?/g, ' 孩子 youtube 留言 審查 安全 ').replace(/(?:每天|每日)\s*定時\s*(?:列印|印出|打印|印)/g, ' 每天 定時 列印 ').replace(/(?:交給|交|轉交|轉給|交接給)\s*(?:房仲|仲介|經紀人)/g, ' 交接 房仲 ').replace(/(?:詢問信|諮詢信|客戶信件|來信)\s*(?:自動)?\s*(?:記進|寫入|登記|登錄|記錄|存入)/g, ' 詢問信 ').replace(/(?:notion\s*)?(?:受理表|台帳)\s*(?:擬|寫|存|儲存)?\s*(?:回信)?\s*(?:草稿|回覆)/g, ' notion 台帳 草稿 ').replace(/(?:行事曆|日曆)\s*(?:回信)?\s*(?:草稿|回覆)/g, ' 日曆 草稿 ').replace(/(?:grok\s*bot|bot)?\s*(?:抓|收)\s*新聞/g, ' grok bot 新聞 ').replace(/(?:每天|每日)\s*(?:早上|早晨)?\s*(?:推(?!薦)|發送|推送)(?:一則)?/g, ' 每天 早上 推送 ').replace(/雙頻\s*(?:輪收)?\s*(?:天線)?\s*(?:量測|測量)/g, ' 雙頻 天線 量測 ').replace(/雙頻\s*解碼/g, ' 雙頻 解碼 ').replace(/手動\s*(?:重新)?\s*(?:重開|啟動|開啟|啟用)\s*(?:的)?\s*排程\s*(?:被)?\s*(?:關閉|關掉|關回|停用)/g, ' 手動 排程 關掉 ').replace(/(?:掌上型|手持)\s*(?:終端)?\s*語音\s*(?:助手|終端)/g, ' 掌上型 語音 終端 助手 ').replace(/(?:每日|每天)\s*隨機\s*(?:挑|選)?\s*(?:不重複)?\s*(?:參考照|照片|相片)?\s*(?:換臉|替換臉)/g, ' 每日 隨機 參考照 換臉 ').replace(/工時表\s*(?:對帳|核帳|核算)/g, ' 工時 對帳 ').replace(/對發薪日薪水/g, ' 發薪 薪水 ').replace(/(?:跨產品|跨系統)\s*(?:舊|過時|過期|失效)\s*交辦/g, ' 跨產品 過期 任務 重送 ').replace(/(?:新|舊)?\s*(?:新有授權|新授權|有授權)\s*交辦/g, ' 交辦 任務 ').replace(/(?:找|聯絡)?\s*房仲\s*(?:調|調閱)?\s*(?:屋況說明書|屋況|不動產說明書)/g, ' 房仲 揭露文件 ').replace(/翻新\s*費用\s*預算(?:\s*上限)?/g, ' 翻新 費用 預算 ').replace(/(?:兩張|一張|一份)\s*(?:填色本|著色頁|著色本|著色畫|線稿)/g, ' 著色頁 ').replace(/(?:優質|好)?\s*學區/g, ' 學區 ').replace(/小朋友/g, ' 小孩 ').replace(/粗線條/g, ' 粗線條 ').replace(/(?:匯出|導出)(?:\s*給)?/g, ' 匯出 ').replace(/(?:仲介站|資料仲介|經紀站)\s*(?:列名|資料)?(?:\s*(?:被擋|被封|被拒))?/g, ' 仲介站 列名 反爬蟲 ').replace(/(?:私有)?\s*git\s*(?:任務檔|任務單|任務)?\s*(?:交接|交辦)/g, ' 私有 git 任務 交接 ').replace(/(?:雲端)?\s*(?:不對|不讓|禁止|不傳|不能)\s*(?:本機|本地|自己電腦|你的電腦)?\s*(?:下|直接下|傳|發)?\s*(?:命令|指令)/g, ' 雲端 本機 命令 ').replace(/(?:私有)?\s*(?:git)?\s*倉庫\s*(?:放|存|列|管)?\s*(?:任務單|任務檔|任務)/g, ' 私有 倉庫 任務 ').replace(/(?:不讓|禁止|避免)\s*雲端\s*(?:直接)?\s*(?:控制|遠端控制|操作)\s*(?:電腦|本機|本地)/g, ' 雲端 控制 電腦 ').replace(/(?:mac)?\s*launchd\s*(?:計時器)?\s*(?:拉取|拉檔|抓取)?\s*(?:任務)?/g, ' mac launchd 計時器 拉取 任務 ').replace(/跨代理\s*(?:任務)?\s*(?:交接|交辦)\s*(?:權限)?\s*(?:隔離|邊界)/g, ' 跨代理 任務 交接 權限 隔離 ').replace(/agent\s*relay\s*(?:私有)?\s*(?:倉庫|repo)?/g, ' agent relay 私有 倉庫 ').replace(/任務檔\s*(?:交接|交辦)/g, ' 任務 交接 ').replace(/(?:每天|每日)\s*(?:早上|早晨)?\s*(?:從)?\s*書籤\s*(?:挑|選)?\s*(?:一個)?\s*(?:點子)?\s*(?:做|做成|製作)?\s*demo/g, ' 每天 書籤 點子 demo ').replace(/書籤\s*(?:做成|轉成|做)?\s*(?:可)?\s*互動\s*(?:網頁)?\s*(?:小實驗|demo)?/g, ' 書籤 互動 網頁 小實驗 ').replace(/(?:每日|每天)\s*書籤\s*(?:可)?\s*互動\s*demo/g, ' 每日 書籤 互動 demo ').replace(/量子漣漪槽\s*(?:小實驗|demo)?/g, ' 量子漣漪槽 小實驗 ').replace(/瀏覽器\s*(?:實測|測試|檢查)\s*(?:後)?\s*(?:部署|發布|上線)\s*cloudflare/g, ' 瀏覽器 實測 部署 cloudflare ').replace(/(?:每天|每日)\s*(?:挑|選)\s*(?:一則|一個)\s*書籤\s*(?:做)?\s*(?:小實驗|demo)/g, ' 每天 書籤 小實驗 ').replace(/(?:x|推特|twitter)\s*發文\s*教練\s*bot/g, ' x 發文 教練 bot ').replace(/(?:督促|督導)\s*(?:在\s*x\s*)?(?:發|寫)?\s*原創\s*(?:內容)?\s*(?:的)?\s*教練/g, ' 督促 原創 教練 ').replace(/(?:每天|每日)\s*(?:盤點)?\s*原創\s*(?:與|和)?\s*轉發/g, ' 每天 盤點 原創 轉發 ').replace(/bot\s*(?:當|做)?\s*教練\s*(?:給)?\s*(?:明天|隔天)?\s*(?:的)?\s*(?:具體)?\s*功課/g, ' bot 教練 功課 ').replace(/轉發機器\s*(?:社群)?\s*教練/g, ' 轉發機器 社群 教練 ').replace(/(?:兩週|2週)\s*(?:社群)?\s*(?:發文)?\s*數據\s*(?:檢討|分析|復盤)/g, ' 兩週 數據 檢討 ').replace(/付費\s*(?:訂閱)?\s*文章\s*(?:用)?\s*瀏覽器\s*(?:側欄|側邊欄)\s*(?:送給|交給)?\s*bot/g, ' 付費 文章 瀏覽器 側欄 bot ').replace(/付費\s*訂閱\s*文章\s*(?:對照|比對)\s*(?:自己的)?\s*持股\s*(?:清單)?/g, ' 付費 訂閱 文章 對照 持股 清單 ').replace(/grok\s*bot\s*clipper\s*(?:剪藏)?/g, ' grok bot clipper 剪藏 ').replace(/付費\s*(?:投資)?\s*電子報\s*(?:投資組合|持股)?\s*(?:對照|比對)/g, ' 付費 電子報 投資組合 對照 ').replace(/瀏覽器\s*(?:擴充|外掛)\s*(?:剪藏|擷取)\s*付費\s*文章/g, ' 瀏覽器 擴充 剪藏 付費 文章 ').replace(/substack\s*付費\s*文章\s*(?:摘要|研究)?/g, ' substack 付費 文章 摘要 ').replace(/獨角獸/g, ' 獨角獸 ').replace(/小仙子/g, ' 小仙子 ').replace(/城堡/g, ' 城堡 ').replace(/滿充電/g, ' 充電 ').replace(/(?:出發|出門)?\s*(?:後)?\s*(?:自動)?\s*(?:改回|還原|復原)/g, ' 自動還原 ').replace(/(?:旅行|出遊|出差)\s*充電\s*(?:排程)?/g, ' 長途 充電 排程 ').replace(/充電\s*排程/g, ' 充電 排程 ').replace(/(?:coding[- ]agent|程式代理|代碼代理|編程代理)\s*(?:逾時|超時)/g, ' coding-agent 停滯 ').replace(/(?:未回報|沒回報)\s*(?:通知)?/g, ' 通知 ').replace(/(?:顯示|查看|看|查)?\s*(?:孩子|小孩|女兒|學生)?\s*(?:各科)?\s*(?:成績|分數|等第)/g, ' 成績 ').replace(/各科分數/g, ' 成績 ').replace(/(?:缺交)?\s*(?:功課|作業)/g, ' 缺交作業 ').replace(/(?:怪人|怪異|陌生人|可疑|惡意|不當|不良|垃圾|詐騙)\s*(?:留言|評論|內容)/g, ' 留言 審查 ').replace(/不良評論/g, ' 留言 審查 ').replace(/自動巡檢/g, ' 巡檢 ').replace(/房仲\s*(?:揭露文件|揭露|文件)/g, ' 房仲 揭露文件 ').replace(/(?:房屋|交屋)?\s*(?:翻新|整修|裝修)\s*(?:費用|成本)?/g, ' 整修 費用 ').replace(/(?:估算|預估|評估)\s*上限/g, ' 預算 上限 ').replace(/官網\s*(?:詢問信|諮詢信|客戶信件|來信)?/g, ' 詢問信 ').replace(/記進\s*(?:notion)?\s*(?:受理表|台帳)?/g, ' notion 受理表 ').replace(/擬\s*(?:回信)?\s*(?:草稿|回覆)/g, ' 草稿 ').replace(/內網穿透/g, ' 內網穿透 ').replace(/(?:dots|grok\s*bot|bot)?\s*(?:讀|看|查|收|抓)?\s*(?:內網|內部\s*(?:信件|郵件|公文|行程|資料))(?!穿透)/g, ' dots 內部 郵件 ').replace(/(?:(?:grok\s*bot|bot|dots)\s*(?:讀|看|查|收|抓|整理)?|(?:讀|看|查|收|抓|整理))\s*(?:外網|外部\s*(?:新聞|情報|資訊|貼文|資料)|公開\s*(?:新聞|情報|資訊|貼文|資料))/g, ' grok bot 公開 新聞 ').replace(/(?:重活|繁重工作)\s*(?:交給|交|外置|外包)?\s*(?:雲端電腦|外部代理|免費模型)/g, ' 重活 雲端電腦 ').replace(/(?:交給|交|外置|外包)\s*(?:雲端電腦|外部代理|免費模型)/g, ' 雲端電腦 ').replace(/(?:做不好|搞不定|失敗)\s*(?:再|就|後|之後)?\s*(?:降級|改用|換成)/g, ' 做不好 降級 ').replace(/(?:地鐵|捷運|公車|電車)\s*(?:通勤)?\s*(?:上)?\s*(?:讀|看)?/g, ' 地鐵 ').replace(/(?:通勤)?\s*(?:地鐵|捷運|公車|電車)\s*(?:上)?\s*(?:讀|看)?/g, ' 地鐵 ').replace(/捷運/g, ' 地鐵 ').replace(/(?:塗色|著色|線稿)\s*(?:自動)?\s*(?:印出|印製|列印|打印|印出來|印(?!表[機台器]))/g, " 著色 線稿 列印 ").replace(/(?:黑白)?\s*(?:塗色頁|著色頁|線稿)\s*印表機/g, " 著色 線稿 印表機 ").replace(/(?:黑白)?\s*(?:塗色頁|著色頁|線稿)\s*(?:印出|列印)/g, " 著色 線稿 列印 ").replace(/(?:卡住|停滯|未回報|超時|逾時)\s*(?:提醒|通知|告警)/g, " 卡住 通知 ").replace(/(?:找房|買房|看房)\s*(?:估算|預估|評估)/g, " 買房 預估 ").replace(/(?:預算|費用|金額)\s*(?:上限|封頂)/g, " 預算 上限 ").replace(/(?:官網|網站)\s*(?:詢問信|諮詢信|來信|客戶來信)/g, " 詢問信 ").replace(/受理\s*(?:登記|記錄|記進|登錄)/g, " 受理 登記 ").replace(/(?:受理|接單|登記|記進)\s*(?:台帳|登記表|受理表|表格|清單|notion)/g, " 受理 台帳 ").replace(/(?:內外|內部外部|內外部)\s*(?:資料|情報|資訊)/g, " 內網 外網 ").replace(/資料\s*(?:分工|分派|分流)/g, " 資料 分工 ").replace(/(?:舊筆記|flomo筆記|筆記)\s*(?:輪換|不同)\s*(?:角度|視角)?/g, " 舊筆記 輪換 角度 ").replace(/(?:輪換|不同)\s*(?:角度|視角)\s*(?:推送|回顧|推播|反思)?/g, " 輪換 角度 推送 ").replace(/(?:防|防止|避免|不讓)\s*(?:遠端)?\s*控制/g, " 避免 控制 ").replace(/(?:可)?\s*互動\s*(?:展示|demo|網頁)/g, " 互動 demo 網頁 ").replace(/(?:展示|demo)\s*(?:網頁|頁面|作品)/g, " demo 網頁 ").replace(/(?:x|推特|社群)\s*發文\s*教練/g, " 發文 教練 ").replace(/發文\s*教練/g, " 發文 教練 ").replace(/(?:社群)?\s*發文\s*數據\s*(?:檢討|分析|復盤)?\s*(?:教練)?/g, " 發文 數據 檢討 教練 ").replace(/(?:每日|每天)\s*盤點/g, " 每日 盤點 ").replace(/(?:付費|訂閱)\s*文章\s*(?:剪藏|擷取)/g, " 付費 文章 剪藏 ").replace(/(?:瀏覽器)?\s*側欄\s*(?:剪藏|擷取)/g, " 側欄 剪藏 ").replace(/(?:文章|內容)?\s*(?:對照|比對)\s*(?:自己的)?\s*持股\s*(?:清單|組合)?/g, " 對照 持股 ").replace(/(?:剪藏|正文|文章)\s*(?:送給|交給|丟給|傳給)\s*bot/g, " 剪藏 bot ").replace(/(?:substack|電子報)\s*文章/g, " substack 文章 ").replace(/(?:跑完|做完|結束|完畢|停滯|卡住)\s*(?:通知|提醒|webhook)/g, " 程式代理 工作階段 webhook 通知 ").replace(/(?:特斯拉|tesla)?\s*(?:出遠門|長途旅行|遠門)\s*(?:前)?\s*(?:充電|充飽電|充飽|充滿)/g, " 特斯拉 出發 充電 ").replace(/(?:客戶\s*來信|客戶|來信)\s*(?:查|找)?\s*(?:日曆|行事曆)\s*(?:擬|寫|存)?\s*(?:草稿|回覆|回信)/g, " 詢問信 行事曆 草稿 ").replace(/(?:節省|省|省下)\s*(?:額度|token|費用|成本)/g, " 節省 額度 ").replace(/(?:私有)?\s*(?:git)?\s*倉庫\s*(?:交接|交辦)/g, " 私有倉庫 任務交接 ").replace(/(?:x|推特|twitter)?\s*(?:收藏|書籤)\s*(?:做成?|轉成?|做)?\s*(?:可)?\s*互動\s*(?:網頁)?/g, " 書籤 互動 網頁 ").replace(/(?:做|製作)?\s*小\s*demo/g, " demo ").replace(/(?:每天|每日)\s*(?:一則|一個)\s*(?:小實驗|demo)/g, " 每天 demo ").replace(/(?:x|推特|twitter|社群)\s*發文\s*(?:復盤|檢討|分析)/g, " 發文 數據 檢討 ").replace(/(?:社群|發文)\s*教練/g, " 發文 教練 ").replace(/(?:每日|每天)\s*(?:檢討|盤點)\s*原創/g, " 每天 盤點 原創 ").replace(/(?:持股清單|投資組合|持股)\s*(?:對照|比對|查核)/g, " 持股清單 對照 ").replace(/(?:側邊欄|側欄)\s*(?:剪藏|擷取)/g, " 側欄 剪藏 ").replace(/(?:瀏覽器)?\s*(?:外掛|擴充)\s*(?:剪藏|擷取)/g, " 外掛 剪藏 ").replace(/投資組合\s*(?:對照|比對)/g, " 持股清單 對照 ").replace(/[「」『』“”"'《》〈〉【】〔〕［］\[\]()（）?？!！~～:：·•…#。]+/g, ' ').replace(/(?:^|\s)\.+|\.+(?:\s|$)/g, ' ').replace(/(?:^|\s)-+|-+(?:\s|$)/g, ' ').split(/[\s,、，/／;；|｜+＋&＆]+/).filter(Boolean);
// Phrase rewrites may only fire on the whole phrase. When every part but the
// last is optional they also fire on a single indexed word and replace it with
// an AND of other words (失敗 → 做不好+降級), so the cases tagged 失敗 become
// unreachable. tests/search-single-word-recall.test.cjs holds that line.
const tokenize = text => _baseTokenize(preprocessProblemQuery(text));
const SYNONYM_GROUPS = [
  ['付款', '支付', '扣款', '金流', 'pay', 'payment', 'payments', '結帳', '付費'],
  ['論文', '文獻', '學術論文', '研究論文', 'paper', 'papers', 'literature', 'literature-review', '論文研讀', '文獻研讀'],
  ['法務', '法律', 'legal'],
  ['電子報', 'newsletter', 'newsletters', 'edm'],
  ['機票', '航班', '機位', 'flight', 'flights', 'airfare'],
  ['競品', '競爭對手', '競品分析', '競品研究', 'competitor', 'competitors', 'competitive-analysis'],
  ['分析', '研究', '調研', '梳理', 'analysis', 'research'],
  ['重構', '優化', '結構重組', '結構優化', 'refactor', 'refactoring', 'clean-code'],
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
  ['逐字稿', '轉錄', '錄音', '聽打', 'transcription', 'transcribe', 'whisper', 'stt', 'speech to text', 'speech-to-text', '語音轉文字', '語音識別', '語音辨識', '語音逐字稿', '錄音轉文字', '錄音逐字稿', '音訊轉寫', '錄音轉寫'],
  ['資料庫', '數據庫', 'database', 'databases', 'sql', '数据库'],
  ['行事曆', '日曆', 'calendar', 'calendars'],
  ['待辦', '代辦', 'todo', 'todos', 'todoist', 'task', 'tasks'],
  ['報帳', '核銷', '對帳', '對賬', '核帳', '核賬', '報銷', '報賬', 'reconciliation', 'reconciliations', 'reconcile', 'reconciling', 'reimbursement'],
  ['發票', '收據', 'invoice', 'invoices', 'receipt', 'receipts'],
  ['debug', 'debugging', '除錯', '排錯', '修復', 'bug', 'bugs', '故障', '排障', 'troubleshoot', 'troubleshooting', 'fault', 'faults'],
  ['workflow', 'workflows', '工作流', '自動化', 'automation', 'automate', 'automations', '排程', '定時', 'cron', 'schedule', 'schedules', 'scheduling', 'scheduler', 'schedulers', '排程器', '定時器', '流水線', '管線', 'pipeline', 'pipelines'],
  ['排班', '班表', '輪班', '值班', '排班表', 'roster', 'shifts', 'shift'],
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
  ['資安', '安全性', '安全', '網路安全', '資訊安全', 'security', 'cybersecurity', '漏洞', 'vulnerability', 'vulnerabilities', '弱點', '安全防護', '安全落地', '落地防護'],
  ['隱私', 'privacy', '個資'],
  ['旅遊', '旅行', 'travel'],
  ['出差', '差旅'],
  ['比價', '比价', '折扣', '降價', '特價', '特賣', '促銷', '省錢'],
  ['會議', '開會', 'meeting', 'meetings', '會議記錄', '會議紀錄', '會議紀要', '開會紀錄', '開會記錄', '開會摘要', '開會筆記', 'minutes'],
  ['提醒', '通知', 'alert', 'alerts', 'alerting', 'notification', 'notifications', 'notify', '推播', '告警', '警報'],
  ['退款', '退貨', 'refund', 'refunds'],
  ['播客', 'podcast'],
  ['智慧家庭', '智能家居', '智能家庭', '智慧家電', 'iot', '物聯網'],
  ['ocr', '文字辨識', '圖片辨識', '光學字元辨識', '影像辨識', '辨識', '識別', 'recognition'],
  ['翻譯', 'translate', 'translation', '翻成中文', '譯文'],
  ['英語', '英文', 'english', '外語', '外文'],
  ['摘要', '總結', 'summary', 'summarize', '重點整理'],
  ['影片', '視頻', 'video', 'videos', '剪輯', '短影音', '短片'],
  ['圖片', '相片', '照片', 'image', 'images', 'photo', 'photos'],
  ['筆記', 'notes', '筆記本', '筆記軟體', 'pkm', 'flomo', 'memo', 'memos', '備忘錄', '舊筆記'],
  ['推特', 'twitter', 'x'],
  ['rag', '知識庫', '知识库', 'knowledgebase', '檢索', 'retrieval', '向量', '嵌入', 'vector', 'vectors', 'embedding', 'embeddings', '檢索增強', 'retrieval augmented generation', 'vectordb', '向量資料庫', '向量數據庫', '向量庫', 'hybrid-search', 'hybrid search', '混合檢索', 'semantic-search', 'semantic search', '語意搜尋', '語義搜索', '語意檢索', '語義檢索', 'vector-search', 'vector search', '向量檢索', '向量搜尋', '向量搜索'],
  ['語音', '音訊', '音頻', '聲音', 'voice', 'audio'],
  ['自動回覆', '自動回信', 'auto-reply', '自動回覆買家'],
  ['測試', 'qa', 'test', 'tests', 'testing', '回歸', 'regression'],
  ['審查', '審核', '覆核', 'review', 'reviewing', 'reviewer', 'reviewers', 'audit', '稽核', '審計', '稽查', '巡檢', '清理', '過濾'],
  ['物流', '快遞', '包裹', '運送', '配送', 'shipping', 'delivery'],
  ['社群', '社交媒體', 'sns'],
  ['文案', '文案撰寫', '撰寫文案', 'copywriting', 'copywriter', '貼文文案'],
  ['效能', '性能', 'performance', 'profiling', 'benchmark', 'benchmarks', '基準測試'],
  ['發文', '貼文', '發帖', 'post'],
  ['外聯', '外呼', 'outreach', '開發信', '拓客', '獲客'],
  ['客戶', '顧客', '用戶', 'client', 'clients', 'customer', 'customers'],
  ['記憶', '長期記憶', '短期記憶', '工作記憶', '外部記憶', '共用記憶', '共享記憶', '可見記憶', '持久記憶', 'memory', 'memories', '記憶庫'],
  ['提示詞', 'prompt', 'prompts', 'prompting', '提示語', '提示', 'system-prompt', 'system prompt', 'system prompts', 'system instructions', '系統提示詞', '系統提示', '系統指令', '系統設定詞'],
  ['核准', '審批', '簽核', 'approval', 'approvals', 'approve', '人工確認', '人工核准', '審核'],
  ['網購', '電商', '購物', 'ecommerce', 'shopping'],
  ['合約', '合同', '契約', 'contract', 'contracts', '協議', 'agreement', 'agreements'],
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
  ['採購', '招標', 'procurement', 'purchasing', 'sourcing', '供應商', 'vendor', 'vendors', '廠商'],
  ['表單', '問卷', '調查', 'form', 'forms', 'survey', 'surveys', 'questionnaire'],
  ['llm', 'llms', '大型語言模型', '大語言模型', '大模型', '語言模型'],
  ['比對', '對照', '核對', '差異', '對比', 'diff', 'diffs', 'matching'],
  ['推薦', '精選', 'recommendation', 'recommend', 'picks'],
  ['瀏覽器', 'browser', 'browsers', 'browsing', '網頁', 'web', 'webpage', 'webpages'],
  ['帳號', '帳戶', 'account', 'accounts'],
  ['報告', '報表', '研報', 'report', 'reports'],
  ['擷取', '提取', '萃取', '提煉', '抽取', 'extract', 'extraction'],
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
  ['hitl', 'human in the loop', '人工介入', '人工覆核', '人工審核', '人工把關', '人工審查', '人工審批', '人機審核', '人機協同', '人機協作'],
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
  ['access-control', 'access control', 'rbac', '存取控制', '訪問控制', '存取權限', '權限控制', '權限管理', '權限控管'],
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
  // The collection-status label used to share a near-identical wording with the
  // evidence-level label (還在查證 vs 尚待查證). Keep the old terms searchable so
  // existing links and queries still find the same pending records, including
  // the one already merged into a case.
  ['待查線索', '還在查證', '待查想法'],
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
// The tiers are ids, not prose: they are facet values, share-link values and
// test expectations, so a declaration must use one of these exact strings.
const DIFFICULTY_TIERS = ['入門對話', '工具串接', '進階開發'];
// A case may state what a reader needs; keyword inference cannot know whether
// "腳本" was the author's product or the prerequisite for reproducing the case.
function declaredDifficulty(lead) {
  const raw = clean(lead.match(/^-\s*實作門檻\s*[：:]\s*(.+)$/m)?.[1] || '');
  // Exact match only: a value like "入門對話（需本機環境）" is malformed, and
  // accepting its prefix would publish a tier the case did not declare.
  return DIFFICULTY_TIERS.includes(raw) ? raw : '';
}
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
// The corpus writes the field under several spellings, and a spelling this
// vocabulary does not know is dropped in silence: the page then shows an older
// 「頁首核對」 than the same lead block writes two lines above, and
// `?sort=reviewed` files it behind cases it is newer than. `本次增補查證` is this
// library's own wording for "the new sources on this page were checked again";
// nine pages used it and none was read. A new spelling now fails
// tests/review-date-keys.test.cjs instead of disappearing.
const REVIEW_DATE_KEY=/^-\s*(?:查證日期|查閱日期|核對日期|研究核對日|(?:本次)?增補查證|查證|首次收錄[／、](?:最近查證|查證))\s*[：:]/;
function reviewDate(markdown) {
  const lead=markdown.replace(/^#{1,3}[^\n]*\n/, '').split(/^## /m)[0];
  const dates=[];
  const reviewAction=/(?:查證|查閱|核對|查核)/;
  // "尚未查證" and "查證尚未完成" name the same words but state the opposite.
  const notReviewed=/(?:未經?|尚未|尚未經|待)(?:查證|查閱|核對|查核)|(?:查證|查閱|核對|查核)\s*(?:日期|結果)?\s*(?:尚未|未|待|無從|無法|不完整|未完成|不詳|不確定|未知|不明)/;
  const collect=(clause)=>{
    for(const date of clause.match(/\b20\d{2}-\d{2}-\d{2}\b/g)||[]){
      const parsed=new Date(date+'T00:00:00Z');
      if(!Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===date)dates.push(date);
    }
  };
  for(const line of lead.split('\n')){
    if(REVIEW_DATE_KEY.test(line)){ collect(line); continue; }
    // Older leads write "- 日期：…；查證 2026-10-16". Only a clause that both names
    // the action and carries the date is a review; the publication date that shares
    // the line but not the clause must not become a review date.
    // The same sentence shape arrives under other dated keys ("- 發布日期：原文精確
    // 時間未核；查閱2026-10-16 UTC", "- 實作日期：2026-09-24；查證2026-10-16 UTC",
    // "- 作者／日期／語言：…；2026-10-16 UTC查閱原貼及附圖"), so the key only has to
    // name a date; the clause still has to name the action. A line whose key is not
    // about a date ("- 補充來源：…；2026-10-13 查核") stays a source note, not a
    // page-level review.
    if(!/^-\s*[^：:\n]{0,24}(?:日期|時間)[^：:\n]{0,24}\s*[：:]/.test(line))continue;
    // A clause that belongs to another source ("- 發布日期：…；補充來源 2026-10-23
    // 查核") records that source's check, not this page's. 「查閱原貼」 is not
    // matched, because the original post is what a page-level review reads.
    for(const clause of line.split(/[；;。，,]/))if(reviewAction.test(clause)&&!notReviewed.test(clause)&&!/^\s*(?:補充|其他|另一|增補)?來源|^\s*補充資料/.test(clause))collect(clause);
  }
  return dates.sort().pop()||'';
}
// Two sections decide whether a reader can try a case. The corpus writes them under
// many phrasings and keeps adding more, so each is read through a short ordered
// vocabulary instead of one literal list per section: a heading the extractor does
// not know silently drops the case's own steps, and the detail page falls back to a
// generic library sentence that reads like the case's guidance but is not.
//   tier 1 - the phrasings the detail page promises ("怎麼開始", "建議操作流程");
//   tier 2 - the same promise in the corpus's own words for a designed procedure
//            ("離線練習（本庫設計，未執行）", "自設只讀驗收", "可借鑑的交接").
//            It sits above the workflow tier on purpose: a case that writes both
//            has said which one is the library's designed procedure, and the tier
//            below would otherwise publish an author record instead;
//   tier 3 - the step and limit vocabulary the corpus also uses, including
//            "怎麼試（本庫設計，未測）" and "權限、費用與驗收";
//   tier 4 - the older fallback, where a workflow section is the closest thing.
// An author-result heading ("問題、實作與實際結果") is not a step section and is in
// none of the lists, so it can never be published as "怎麼開始".
const HOW_HEADINGS = [
  /(?:建議操作流程|建議流程|建議操作步驟|操作步驟|可參考步驟|可參考的操作順序|操作順序|可借用的驗收步驟|可借用的只讀驗收步驟|可借鑑步驟|練習步驟|怎麼開始|怎麼試|可以怎麼試|怎麼用|小範圍試法|實作流程與核對邊界|操作與驗收|(?:可借用|可參考|可借鑑|可重用|建議|小範圍|試作).*(?:步驟|流程|驗收|操作|順序|試法))/,
  // Every entry names who designed the procedure, the phrase has to end the
  // heading, and a trailing parenthetical has to say the procedure was designed or
  // not run yet ("（本庫設計，未執行）", "（自設、未測）"). A bare 「練習」 or 「試做」
  // could be the author's own practice — "作者離線試做結果" is a report, not an
  // instruction — and "作者離線試做（結果）" or "自設離線練習（提示詞）" name
  // someone else's output. The parenthetical never spans a line break, so an
  // unclosed 「（」 cannot swallow the section body.
  /(?:離線練習|離線試做|只讀練習|自設只讀驗收|自設只讀練習|自設離線練習|安全試做|安全試法|試法與停止條件|防覆蓋試法|(?:可借用|可借鑑|可參考)(?:的)?(?:交接|預覽與停止設計|只讀驗收))(?:（[^）\n]*(?:未實|未執|設計|自設)[^）\n]*）)?\s*$/,
  /(?:流程|輸入與預期輸出|實作步驟|作者做過的流程|作者報告的流程|作者實作)/
];
// A prompt block ("可貼指令（自行設計，未測）", "可複製提示詞") carries the text to
// paste, not the order to do things in, and a printable worksheet is a deliverable.
// Only the heading's subject decides: 「建議試法與可貼指令」 still names a trial
// method, so its steps are kept and the prompt part is simply not selected.
const HOW_HEADING_REJECT = /^#{2,3}\s*(?:可貼|可複製|指令|提示詞)|練習卷/;
const LIMIT_HEADINGS = [
  /(?:所需連接、權限與限制|權限、費用與限制|權限、費用與可用性|權限、費用及限制|權限與驗收|證據與查閱缺口|來源報告與限制|限制與驗收|要注意什麼|權限、成本及可用性|權限、限制與驗收|限制、權限與費用|官方限制、費用與可用性|官方限制、費用與權限|官方限制、費用及可用性)/,
  /(?:限制|權限|費用|成本|可用性|不適合|適用|風險|注意|安全|邊界)/,
  // "官方背景與界線" and "來源與界線" write the same limits as the vocabulary
  // above in a word it does not carry. It has to name what the boundary belongs to:
  // "去重與界線" is a scoping note about how the case was counted, and publishing
  // it as 「要注意什麼」 would tell the reader nothing about adopting the case.
  // This tier runs last so it only answers for cases with no other limits heading.
  /(?:官方|來源|平台|權限|費用|工具|服務)[^。\n]{0,10}界線/
];
// A source line ("[Meet dots](https://…)…2026-10-16 查閱", "ElevenLabs的[說明](…)")
// is a citation, not a limit or a step; publishing it under 「要注意什麼」 would read
// as advice. The link may follow a short publisher name, so the check is anchored on
// the start of the line but allows that prefix.
const GUIDANCE_CITATION = /^(?:\[[^\]]*\]\(|https?:\/\/|[^，。：\n]{1,24}[，,]\s*(?:[^，。：\n]{1,6}[，,]\s*)?\d{4}-\d{1,2}-\d{1,2}\s*[：:]|[^\[\n]{0,24}\[[^\]]*\]\(https?:\/\/|[^：:\n]{0,12}[：:]\s*https?:\/\/)/;
// Markdown is not rendered inside the guidance card, so a published link would reach
// the reader as "[說明](https://…)" — and the 160-character clip can cut it inside the
// URL. Keep the link text, drop the target.
const plainGuidance = text => text.replace(/\[([^\]]*)\]\([^)\s]*\)/g, '$1').replace(/\s+/g, ' ').trim();
// One array of sections per tier, in the order the vocabularies are declared. The
// heading line ends the match, so a section starts at the newline after it and stops
// at the next heading of any level.
function guidanceTiers(markdown, headings, reject) {
  const tiers = [], seen = new Set();
  for (const heading of headings) {
    const sections = [];
    const pattern = new RegExp('^#{2,3}\\s+.*' + heading.source + '.*$', 'gm');
    let match;
    while ((match = pattern.exec(markdown))) {
      if (seen.has(match.index)) continue;
      seen.add(match.index);
      if (reject && reject(match[0])) continue;
      const rest = markdown.slice(match.index + match[0].length);
      const next = rest.search(/\n^#{2,3}\s+/m);
      const section = next !== -1 ? rest.slice(0, next) : rest;
      const lines = section.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('<!--') && !l.startsWith('>') && !l.startsWith('#') && !l.startsWith('```'));
      sections.push({lines, items: lines.filter(l => /^(\d+\.|\*|-|•)\s+/.test(l)).map(l => l.replace(/^(\d+\.|\*|-|•)\s+/, '').trim())});
    }
    tiers.push(sections);
  }
  return tiers;
}
// Tiers are exclusive: when a case writes a section that names steps, a weaker
// "作者實作" section must not step in just because that one is empty. A corpus with
// no step-named heading at all still falls back to the workflow vocabulary.
function pickGuidance(tiers, read) {
  for (const sections of tiers) {
    if (!sections.length) continue;
    for (const section of sections) {
      const text = read(section);
      if (text && !GUIDANCE_CITATION.test(text)) return plainGuidance(text);
    }
    return '';
  }
  return '';
}
function extractActionableGuidance(markdown) {
  const how = pickGuidance(guidanceTiers(markdown, HOW_HEADINGS, heading => HOW_HEADING_REJECT.test(heading)), section =>
    section.items.length > 0 ? section.items.slice(0, 2).join('；') : (section.lines[0] || ''));
  // A heading that names a procedure ("實作流程與核對邊界") owns steps, not limits:
  // the reader would otherwise see the first step under 「要注意什麼」.
  const caution = pickGuidance(guidanceTiers(markdown, LIMIT_HEADINGS, heading => /流程|步驟|操作順序|實作|指令|試法|練習/.test(heading)), section => {
    if (section.items.length > 0) {
      const safetyItem = section.items.find(item => /^(?:先停|注意|警告|風險|重要|安全|個資|隱私)[：:]/.test(item) || /(?:禁止|嚴禁|切勿|不得|未經(?:確認|授權|審核)|必經審核|人工審核|人工審批|資料外洩|個資外洩|提示詞注入|提示注入|惡意指示)/.test(item) || /(?:未經(?:確認|授權)|禁止|嚴禁|切勿|不得|人工).*?(?:付款|扣款|改權限|發送|刪除|寫入|覆蓋)|(?:付款|扣款|改權限|發送|刪除|寫入).*?(?:需|必須|要).*?(?:核准|批准|審核|審批|授權)/.test(item));
      if (safetyItem) return safetyItem;
    }
    return section.items.find(item => !GUIDANCE_CITATION.test(item)) || section.lines.find(line => !GUIDANCE_CITATION.test(line)) || '';
  });
  // 160 characters is what the card face can hold; mark the cut so a reader does not
  // read a half sentence as the whole advice.
  const clip = text => { const flat = text.replace(/\s+/g, ' '); return flat.length > 160 ? flat.slice(0, 159).trimEnd() + '…' : flat; };
  return {
    how: how ? clip(how) : '',
    caution: caution ? clip(caution) : ''
  };
}
// A source line often names several evidence classes ("`official`（文件）＋
// `author-demo`（作者自述）"). The class that governs the case's own reported
// outcome decides the label:
//   * an opening 待驗證/designed/模板 declaration wins outright;
//   * an opening vendor or official statement (V級廠商員工, V＋B，服務商員工,
//     官方署名…) is first-party evidence, so it must never read as third-party
//     analysis;
//   * a declared author execution record (`author-demo`) outranks an `official`
//     reference listed before it, because the case reports what the author did;
//   * a passing mention of 模板 or a comparison-only official doc changes nothing.
const FIRST_PARTY_LEAD = /^(?:[VAB](?:\s*[＋+]\s*[VAB])?級?\s*[，,、:：]?\s*)?(?:(?:廠商|原廠|產品|服務商|公司|官方)?員工|廠商|原廠|官方)/;
// A case page may declare several evidence classes in one line
// (`official` ＋ `designed`, `author-demo` ＋ `designed`, …). The primary class
// still decides the filter and the counts, but the page must not present the
// primary claimant as if it were the only one. The declaration is written as
// clauses joined by ＋/；, so classify each clause with the same rules and list
// every class the page actually names.
function declaredEvidenceClassesOfClause(clause) {
  const text = clause.replace(/`/g, '').trim();
  if (!text) return [];
  const found = [];
  const add = label => { if (!found.includes(label)) found.push(label); };
  // Backticked machine tokens are explicit declarations wherever they appear.
  const officialToken = /\bofficial\b/i.test(text);
  const designedToken = /\bdesigned\b/i.test(text);
  // 官方轉述 means the official channel relayed someone else's experience, so it
  // is not a first-party official self-report; the corpus uses it that way in
  // UC-024 (「官方轉述早期使用者經驗；不是作者本人操作教學」).
  const firstParty = officialToken && !/^\s*designed\b/i.test(text)
    ? true
    : FIRST_PARTY_LEAD.test(text) || /^官方(?!轉述)/.test(text)
      || /官方(?:署名|自報|展示|示例|範例|發布|第一手)/.test(text);
  const leadingUnverified = /^\s*(?:unverified|待驗證|待定|尚待查證)/i.test(text);
  if (firstParty) add('官方自報');
  // `unverified` as a claim ends the clause or is followed by punctuation; a
  // field name such as "unverified 欄位" is not a declaration of that class.
  const unverifiedToken = /(?:^|[\s（(＋+、,，；;])unverified(?:$|[（(），,。；;:：、\s]*[）)，,。；;])/i.test(text);
  if (leadingUnverified || unverifiedToken) add('尚待查證');
  if (designedToken) add('設計／未實跑');
  // An explicit token is a declaration on its own.
  if (/\bauthor-(?:demo|self-report)\b/i.test(text)) add('作者報告／示範');
  // Prose about an author counts only when the clause reports that author's own
  // work. The same words inside a vendor clause, an unverified lead or a designed
  // prompt must not create a second claimant.
  if (!firstParty && !leadingUnverified && !designedToken
    && /作者[^。；]{0,30}(?:自述|自報|實測|自測|自建|實作|分享|貼文|長文|報告|示範)/.test(text)) add('作者報告／示範');
  if (/^模板/.test(text)) add('模板／文件核讀');
  if (/^公開資料/.test(text)) add('公開資料核讀');
  return found;
}
function declaredEvidenceClasses(proofLine, kind) {
  if (kind === 'pending') return ['尚待查證'];
  const primary = declaredEvidenceClass(proofLine, kind);
  const clauses = proofLine.split(/[＋+;；]/);
  const classes = [];
  for (const clause of clauses) {
    for (const label of declaredEvidenceClassesOfClause(clause)) {
      if (!classes.includes(label)) classes.push(label);
    }
  }
  return [primary, ...classes.filter(label => label !== primary)];
}
// The single label the corpus has always used. Keep it verbatim so the filter,
// the counts and the sort order do not move when the clause list is added.
// Each rule is tested inside one declared clause: `dots官方轉述＋Grok Bot作者自報`
// names two different sources, so the word 官方 in one half must not borrow 自報
// from the other half to become a first-party official claim. The per-rule order
// is the existing precedence, so a single-clause line keeps its label exactly.
function declaredEvidenceClass(proofLine, kind) {
  if (kind === 'pending') return '尚待查證';
  const line = proofLine.replace(/`/g, '');
  const clauses = line.split(/[＋+;；]/).map(clause => clause.trim()).filter(Boolean);
  const some = re => clauses.some(clause => re.test(clause));
  // The anchored rules already cannot read across a clause boundary. They stay on
  // the whole line so a grade pair such as `V＋B，服務商員工…` is not split.
  if (/^\s*(?:unverified|待驗證|待定|尚待查證)/i.test(line)) return '尚待查證';
  if (/^\s*designed\b/i.test(line)) return '設計／未實跑';
  if (/^(?:原)?模板/.test(line)) return '模板／文件核讀';
  if (FIRST_PARTY_LEAD.test(line)) return '官方自報';
  if (some(/\bauthor-(?:demo|self-report)\b/i)) return '作者報告／示範';
  if (some(/官方.*(?:展示|示例|範例|發布|自報|第一手.*自述|署名作者使用陳述)|official/i)) return '官方自報';
  if (some(/author|作者|自驗|自述/)) return '作者報告／示範';
  return '公開資料核讀';
}
// The class names who makes the claim; it does not say how the library obtained
// the material. A page can declare an official feature, demo or video while
// stating that the official original was relayed by someone else or never read
// (`official`（Spaces 功能與官方作例，經來源轉述）, 本庫未觀看影片，流程細節來自
// 第三方文字整理). Read that statement from the same clause that declares
// `official`, so the badge, the claimant line and the detail note cannot present
// a first-hand reading the case page does not claim.
const RELAYED_OFFICIAL = /經[^。；，]{0,12}轉述|官方轉述|轉述的官方|二手轉述|未觀看影片|影片未(?:觀看|播放|看)|未看影片|未讀官方|官方[^。；，]{0,6}未(?:讀|開啟)/;
// Look only where the `official` declaration lives: its own parenthetical group
// plus the sentence fragment that follows it. A later sentence about a different
// source (`…快照回滾事件為二手轉述 unverified`, `…通話影片（本庫未看）`) describes
// that other source, so it must not qualify the official class.
function relayedEvidenceClasses(proofLine) {
  // proofLine is already `clean()`ed, so the declaration token arrives unquoted.
  if (!/\bofficial\b/i.test(proofLine)) return [];
  const rest = proofLine.slice(proofLine.search(/\bofficial\b/i));
  const open = rest.indexOf('（');
  let window;
  if (open === -1) {
    window = rest.split(/[。；;＋+]/)[0];
  } else {
    const close = rest.indexOf('）', open);
    const groupEnd = close === -1 ? rest.length : close + 1;
    // Only a following sentence belongs to this declaration; anything after ＋／；
    // is a different source (`＋author-demo（…本庫未觀看影片）`).
    const after = rest.slice(groupEnd);
    const tail = /^[。\s]/.test(after) ? after.replace(/^[。\s]+/, '').split(/[。；;＋+]/)[0] : '';
    window = rest.slice(0, groupEnd) + tail;
  }
  return RELAYED_OFFICIAL.test(window) ? ['官方自報'] : [];
}
function metadata(markdown, path, kind, suffix='') {
  const title = clean(markdown.match(/^#{1,3}\s+(.+)$/m)?.[1] || path);
  const id = title.match(/(?:UC|P)-\d+/)?.[0] || path.split('/').pop().replace(/\.md$/,'') + suffix;
  const heading = title.replace(/^(?:UC|P)-\d+[\s:：|｜]*/, '');
  const lead = markdown.replace(/^#{1,3}[^\n]*\n/, '').split(/^## /m)[0];
  const summary = clean(lead.match(/^-\s*(?:核心目標|問題|目標|已知標題|狀態)\s*[：:]\s*(.+)$/m)?.[1] || lead.split('\n').find(line => line.trim() && !/^#|^-/.test(line)) || '閱讀公開來源、建議流程與驗收限制。');
  // A theme is what the case page declares. 159 pages declare none, and a title
  // keyword (or a catch-all default) is not a classification the library can
  // stand behind: it used to put 145 unrelated cases in one `個人生產力` bucket,
  // which then appeared as a filter option and as `同分類` reasoning. Such a page
  // now carries no category, and the filter hint says how many that is.
  const category = clean(lead.match(/^-\s*分類(?:／標籤)?\s*[：:]\s*(.+)$/m)?.[1] || '');
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
  const statusLine = clean(lead.match(/^-\s*狀態\s*[：:]\s*(.+)$/m)?.[1] || '');
  // A lead the source file marks as handled is not an open question any more.
  // Require the dated status line ("2026-10-17 已處理") so that prose such as
  // "未取得…已完成操作流程" is not mistaken for a resolution.
  const resolved = kind === 'pending' && /^\d{4}-\d{2}-\d{2}[^。；]{0,10}已(?:處理|解決|完成)/.test(statusLine);
  const mergedInto = kind === 'evidence' ? [] : kind === 'case'
    ? [...new Set([...collectDestinations(heading, TITLE_MERGE_DESTINATION), ...mergedDestinations(proofLine)])]
    : mergedDestinations(statusLine, heading);
  const proofClasses = declaredEvidenceClasses(proofLine, kind);
  const proof = proofClasses[0];
  const relayedProof = proofLine ? relayedEvidenceClasses(proofLine) : [];
  const tools = TOOL_PATTERNS.filter(([,re])=>re.test(markdown)).map(([name])=>name);
  const date = clean(lead.match(/^-\s*(?:查證日期|查閱日期|核對日期|研究核對日|首次收錄[／、]最近查證|查證)\s*[：:]\s*.*?(20\d{2}-\d{2}-\d{2})/m)?.[1] || lead.match(/(?:查證|查閱|核對|最近查證)\s*[：:；]?\s*.*?(20\d{2}-\d{2}-\d{2})/)?.[1] || lead.match(/20\d{2}-\d{2}-\d{2}/)?.[0] || '');
  const copy=(globalThis.displayCopy?.[id])||displayCopy[id]||{};
  const displayTitle=clean(lead.match(/^-\s*網站標題\s*[：:]\s*(.+)$/m)?.[1]||copy.title||heading);
  const what=clean(lead.match(/^-\s*一句話用途\s*[：:]\s*(.+)$/m)?.[1]||copy.what||summary);
  const targetUser=clean(lead.match(/^-\s*目標使用者\s*[：:]\s*(.+)$/m)?.[1]||'');
  // 核心目標 is the template label, but older pages declare the same sentence as
  // `- 目標` or `- 問題`. All three are the page's own wording, so all three are
  // read; nothing is written for a page that declares none.
  // Ten legacy pages open a `###` section right below the fields, so the old lead
  // slice (`up to the first ##`) still contains body bullets; a body `- 目標：`
  // must not become the page's declared goal.
  const frontBlock=lead.split(/^#{2,6}\s/m)[0];
  const coreGoal=clean(frontBlock.match(/^-\s*(?:核心目標|目標|問題)\s*[：:]\s*(.+)$/m)?.[1]||'');
  const reviewedDate=reviewDate(markdown);
  const extracted=extractActionableGuidance(markdown);
  const howText=copy.how||extracted.how||'先閱讀原始報告與限制，再用小範圍、去敏資料設計自己的測試。';
  const cautionText=copy.caution||extracted.caution||'本庫尚未獨立重現；先確認權限與驗收方式，不把案例報告當成成效保證。';
  const declaredTier = declaredDifficulty(lead);
  const difficulty = declaredTier || extractDifficulty(markdown, tools, scenario, category);
  const difficultySource = declaredTier ? 'declared' : 'inferred';
  const searchFields=' '+displayTitle+' '+what+' '+(targetUser?targetUser+' ':'')+(coreGoal?coreGoal+' ':'')+tools.join(' ')+' '+category+' '+scenario+' '+tags.join(' ')+' '+KIND[kind]+' '+difficulty+' '+(difficulty==='入門對話'?'免寫程式 零程式碼':'')+' '+idVariants(id);
  const searchText=norm(withoutEditorialNotes(markdown)+searchFields);
  // Same tail, different body: `search` keeps section headings so a reader can still
  // reach a page by its section title, `searchBody` drops them so "matched" and
  // "this text says it" can be told apart. Both keep every declared field.
  const searchBodyText=norm(withoutEditorialNotes(proseWithoutSectionHeadings(markdown))+searchFields);
  return {id,title:displayTitle,originalTitle:heading,what,targetUser,coreGoal,how:howText,caution:cautionText,difficulty,difficultySource,markdown,path,kind,category,scenario,tags,summary:what,proof,proofClasses,relayedProof,tools,date,reviewedDate,mergedInto,resolved,search:searchText,searchProse:withoutSourceUrls(searchText),searchBody:searchBodyText,searchProseBody:withoutSourceUrls(searchBodyText)};
}
// sources/pending.md records one review date for the whole file, above the first
// lead. It says when the file was checked, not when each lead was, so it stays a
// separate field: reviewedDate is what the reader sees as a page-level review and
// what ?sort=reviewed orders by.
function fileReviewDate(markdown) {
  const header = markdown.split(/^##\s+P-/m)[0];
  const line = header.match(/^(?:-\s*)?查證日期\s*[：:]\s*(.+)$/m)?.[1] || '';
  const dates = (line.match(/\b20\d{2}-\d{2}-\d{2}\b/g) || []).filter(date => {
    const parsed = new Date(date + 'T00:00:00Z');
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
  });
  return dates.sort().pop() || '';
}
// A resolved lead or a merged supplement can name more than one home: P-004's
// 狀態 line merges the original posts into UC-101 and separately records UC-102.
// Keep every id the source records, in the order it writes them. An id that is
// only compared against (「與 UC-005 的分工差異」) carries no merge verb, so it is
// not a destination.
const MERGE_DESTINATION = /(?:併入|另記|另見|合併)\s*[\[（(]?\s*(UC-\d{3})/g;
// A title can describe merging records as the task ("合併 UC-123 重複資料"), so only
// the explicit 已合併 form declares a destination there. The evidence line keeps the
// loose form, because UC-250 writes "合併UC-156，不另計" there.
const TITLE_MERGE_DESTINATION = /已合併\s*[\[（(]?\s*(UC-\d{3})/g;
function mergedDestinations(...texts) {
  const ids = [];
  for (const text of texts) {
    if (!text) continue;
    for (const match of String(text).matchAll(MERGE_DESTINATION)) if (!ids.includes(match[1])) ids.push(match[1]);
  }
  return ids;
}
function collectDestinations(text, pattern) {
  const ids = [];
  if (!text) return ids;
  for (const match of String(text).matchAll(pattern)) if (!ids.includes(match[1])) ids.push(match[1]);
  return ids;
}
function mergedDestinationText(item) {
  return (item?.mergedInto || []).join('、');
}
// A lead can be marked handled without naming a case (a duplicate note, a source
// edit). Printing "已併入 " with nothing after it, or dropping the closure note
// entirely, leaves the badge contradicting the page; say the destination is not
// recorded instead of inventing one.
const UNRECORDED_MERGE = '已處理（來源檔未記錄併入案例）';
function pendingStateBadge(item) {
  if (!item || item.kind !== 'pending' || !item.resolved) return KIND[item?.kind] || '';
  const label = mergedDestinationText(item);
  return label ? '待查線索・已併入 ' + label : '待查線索・' + UNRECORDED_MERGE;
}
function cardKindBadge(item) {
  if (!item || item.kind !== 'pending' || !item.resolved) return KIND[item?.kind] || '';
  const label = mergedDestinationText(item);
  // One badge slot on the card: the detail badge names the missing destination.
  return label ? '已併入 ' + label + '（不另計數）' : '已處理（不另計數）';
}
// The shared note left out whether a lead was closed, so a forwarded lead still read
// as an open question. Keep the same three states the page shows.
function copyNoteStatus(item) {
  if (!item?.resolved) return '';
  const label = mergedDestinationText(item);
  return label ? `🔁 狀態：已併入 ${label}，不另計一案` : '🔁 狀態：已處理，來源檔未記錄併入案例';
}
function copyNoteText(item, caseUrl) {
  return [
    `【AI 案例筆記】${item.id} · ${item.title}`,
    `📌 用途：${item.what || item.summary}`,
    item.how ? `🚀 怎麼開始：${item.how}` : '',
    item.caution ? `⚠️ 注意事項：${item.caution}` : '',
    item.proof ? `📎 來源證據：${item.proof}${caseHasRelayedProof(item) ? '（' + PROOF_PROVENANCE.relayed.badge + '）' : ''}` : '',
    copyNoteStatus(item),
    `💡 說明：本庫入門建議為整理者設計，非實測結果；未獨立重現，請核對原始報告與限制。`,
    `🔗 詳情與來源：${caseUrl}`
  ].filter(Boolean).join('\n');
}
function resolvedPendingNote(item) {
  if (!item || !item.resolved) return '';
  const label = mergedDestinationText(item);
  return label
    ? '本條目已結束：內容已併入 ' + label + '，不另計一案；以下「尚待查證」描述的是這條線索的原帖，採用請以主案例為準。'
    : '本條目已結束：來源檔標示已處理但未記錄併入的主案例，因此不另計一案；原帖與未核對事項仍保留在本頁。';
}
function mergeHandoffSentence(item) {
  const label = mergedDestinationText(item);
  if (!label) return '來源檔已標示處理完成，但未記錄併入的主案例；不另計一案，原帖與仍未核對的項目保留在本頁。';
  return item.kind === 'pending'
    ? `來源檔已標示處理完成並併入 ${label}，不另計一案；原帖與仍未核對的項目保留在本頁。`
    : `本頁已合併至 ${label}，不另計一案；保留這篇的原始來源與限制。`;
}
// Split handled leads by whether the source recorded a destination, so neither the
// statistics card nor the facet option calls an unrecorded handle a merge.
function resolvedPendingTally(items) {
  const resolved = (items || []).filter(item => item.kind === 'pending' && item.resolved);
  const merged = resolved.filter(item => (item.mergedInto || []).length).length;
  return { resolved: resolved.length, merged, unrecorded: resolved.length - merged };
}
function parseFile(path, markdown) {
  if (path === 'sources/pending.md') {
    const fileReviewed = fileReviewDate(markdown);
    return markdown.split(/(?=^##\s+P-)/m).filter(part=>/^##\s+P-/.test(part)).map((part,i)=>{
      const item = metadata(part,path,'pending',String(i));
      if (fileReviewed) item.fileReviewed = fileReviewed;
      return item;
    });
  }
  return [metadata(markdown,path,path.startsWith('evidence/')?'evidence':'case')];
}
// The counters describe the collection: a lead already merged into a case is
// reported separately instead of inflating the open-question count.
function catalogCounts(items) {
  const counts={case:0,evidence:0,pending:0,resolvedPending:0};
  for(const item of items){
    if(item.kind==='pending'){ if(item.resolved)counts.resolvedPending++; else counts.pending++; }
    else if(item.kind==='case')counts.case++;
    else if(item.kind==='evidence')counts.evidence++;
  }
  return counts;
}
function el(tag,cls,text) { const node=document.createElement(tag); if(cls)node.className=cls; if(text!==undefined)node.textContent=text;return node; }
function safeLink(target,path) {
  try {
    const scheme=/^[a-z][a-z0-9+.-]*:/i.test(target);
    if(scheme && !/^https?:\/\/[^/]/i.test(target))return null;
    const absolute=scheme || /^\/\/[^/]/.test(target);
    if(!absolute && !sourceRevisionFor(path))return null;
    const url = new URL(target, sourceMarkdownUrl(path));
    return ['https:','http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
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
      const target=destination?destination.target:match[0],relative=!/^[a-z][a-z0-9+.-]*:|^\/\//i.test(target),href=safeLink(target,path),label=match[1]||target;
      if(href || (relative && !sourceRevisionFor(path))) {
        const a=el('a','',label);
        if(href)a.href=href;
        else { a.setAttribute('aria-disabled','true'); a.tabIndex=0; }
        if(relative)a.setAttribute('data-source-relative',target);
        a.target='_blank';a.rel='noopener noreferrer';node.append(a);
      } else node.append(document.createTextNode(label));
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
function sharedRelatedTags(item, other) {
  const tags = new Set((item.tags || []).map(tag => norm(tag).trim()).filter(Boolean));
  const shared = new Map();
  (other.tags || []).forEach(tag => { const key = norm(tag).trim(); if (key && tags.has(key) && !shared.has(key)) shared.set(key, tag); });
  return [...shared.values()];
}
// Two shared tags are a strong sign of the same task. One shared tag only means
// something when that tag is not one of the template-wide ones (驗收, 每日, 核准…),
// so a single tag counts only when at most 2% of the case pages use it. Requiring
// two tags left 40% of pages with no next reading at all; accepting any single tag
// would have paired 98% of them through a tag that half the library shares.
const RELATED_SPECIFIC_TAG_SHARE = 0.02;
function relatedTagCounts(cases) {
  const counts = new Map();
  for (const other of cases) {
    // One page counts once per tag, however often the tag repeats in its lead.
    const keys = new Set((other.tags || []).map(tag => norm(tag).trim()).filter(Boolean));
    for (const key of keys) counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}
// `items` is what the reader can be sent to (the current results); `library` is what
// "few pages use this tag" is measured against. A tag does not become rare because
// the reader narrowed the search, so the two must not be the same list.
function relatedEntries(item, items, library = items) {
  const allCases = library.filter(other => other.kind === 'case');
  const cases = items.filter(other => other.kind === 'case' && other.id !== item.id);
  const counts = relatedTagCounts(allCases);
  const specificLimit = Math.max(1, allCases.length * RELATED_SPECIFIC_TAG_SHARE);
  const frequency = tag => counts.get(norm(tag).trim()) || 0;
  const shared = cases.map(other => ({ item: other, tags: sharedRelatedTags(item, other) }));
  // Keep the corpus order inside a tier: the reader's suggestions only grow this
  // round, they are not re-ranked.
  const strongest = shared.filter(row => row.tags.length >= 2);
  // Only a category the page declares can group it with another case; a page that
  // declares none still deserves its shared-tag suggestions.
  const sameCategory = item.category && item.category !== '未分類'
    ? cases.filter(other => other.category === item.category)
    : [];
  const picks = [];
  const add = (other, reason) => {
    if (picks.length < 3 && !picks.some(pick => pick.item === other)) picks.push({ item: other, reason });
  };
  strongest.forEach(row => add(row.item, '共同標籤：' + row.tags.join('、')));
  // A theme the page declares outranks a single shared tag, so every suggestion the
  // library made before this rule is still made; the single-tag rows only fill the
  // slots that used to stay empty.
  sameCategory.forEach(other => add(other, '同分類：' + other.category));
  if (picks.length < 3) {
    shared.filter(row => row.tags.length === 1)
      .map(row => ({ ...row, tags: row.tags.filter(tag => frequency(tag) <= specificLimit) }))
      .filter(row => row.tags.length)
      .sort((a, b) => Math.min(...a.tags.map(frequency)) - Math.min(...b.tags.map(frequency)))
      .forEach(row => add(row.item, '相關標籤：' + row.tags.join('、')));
  }
  return picks;
}
function detailNeighbours(item, items) {
  const index = items.findIndex(other => other.id === item?.id);
  return index < 0 ? {prev:null,next:null} : {prev:items[index - 1] || null,next:items[index + 1] || null};
}
// Leaving a case through 「探索更多「情境」案例」 starts over on purpose: the reader
// asked for the whole scenario, not for their own words inside it. Dropping those
// words without a word about it loses the reader's input, so the results screen
// names what the switch removed and gives one click back to it. Measured on the
// live site 2026-11-10: ?q=怎麼整理會議記錄 (7 / 515) → 「工作」 162 / 515, the query
// box empty, and nothing on screen saying a query had been cleared.
let scenarioReset=null;
function conditionSignature(conditions){
  return conditions.map(condition=>condition.key+'='+condition.display).join('|');
}
function scenarioResetSnapshot(){
  const filters=Object.fromEntries(['kind','difficulty','tool','category','proof'].map(id=>[id,$(id)?.value||'']));
  filters.scenario=activeScenario;
  filters.scope=searchScope($('search-scope').value);
  const conditions=activeConditions($('query').value.trim(),filters);
  if(!conditions.length)return null;
  return {
    url:searchLink(location.href,$('query').value,filters,$('sort').value),
    query:$('query').value,
    filters:Object.fromEntries(['kind','difficulty','tool','category','proof'].map(id=>[id,$(id)?.value||''])),
    scenario:activeScenario,
    scope:searchScope($('search-scope').value),
    sort:$('sort').value,
    conditions,
    count:currentFiltered.length
  };
}
function showScenarioReset(reset,scenario){
  const notice=$('scenario-reset');
  if(!notice)return;
  const filters=Object.fromEntries(['kind','difficulty','tool','category','proof'].map(id=>[id,$(id)?.value||'']));
  filters.scenario=activeScenario;
  filters.scope=searchScope($('search-scope').value);
  if(!reset){scenarioReset=null;notice.hidden=true;return;}
  // The switch only loses what the new state no longer has. A case whose scenario
  // is already the active one loses nothing by being explored: name only the
  // conditions that actually went away, and say nothing when none did.
  const switched=reset.scenario!==scenario;
  const dropped=reset.conditions.filter(condition=>!(condition.key==='scenario'&&condition.display===scenario));
  if(!dropped.length){scenarioReset=null;notice.hidden=true;return;}
  const list=dropped.map(condition=>condition.label+'「'+condition.display+'」').join('、');
  const target=scenario?'「'+scenario+'」情境':'不限定情境';
  scenarioReset={...reset,after:conditionSignature(activeConditions($('query').value.trim(),filters))};
  $('scenario-reset-message').textContent=switched
    ? '已切換到'+target+'；原本的'+list+'已清除。'
    : '已清除原本的'+list+'，改為列出'+target+'的全部條目。';
  $('scenario-reset-action').textContent='回到原本的搜尋（'+reset.count+' 筆）';
  notice.hidden=false;
}
// The notice explains one switch, so it leaves with the next condition change
// instead of standing over results it no longer describes.
function syncScenarioReset(conditions){
  const notice=$('scenario-reset');
  if(!notice||!scenarioReset)return;
  if(conditionSignature(conditions)===scenarioReset.after)return;
  scenarioReset=null;notice.hidden=true;
}
function scenarioExploreAction(item) {
  const button = el('button', 'detail-action-scenario', `探索更多「${item.scenario}」案例 →`);
  button.type = 'button';
  button.setAttribute('aria-label', `探索更多「${item.scenario}」案例`);
  button.addEventListener('click', () => {
    const reset=scenarioResetSnapshot();
    rememberReadingView();
    history.pushState(history.state, '', location.href);
    closeDetail();
    chooseScenario(item.scenario);
    showScenarioReset(reset,item.scenario);
    landOnScenarioReset();
  });
  return button;
}
// Both ways into a scenario switch end the same way: when something was taken
// away, the reader lands on the notice that names it, because that is the new
// information and the result line right below it is where the loss shows.
function landOnScenarioReset(){
  const landing=$('scenario-reset').hidden?$('results-count'):$('scenario-reset');
  $('results-count').focus({preventScroll:true});
  landing.scrollIntoView({block:'start',behavior:'instant'});
}
// The hero buttons are a direction chooser, not a filter the reader is adding to
// their search: the scenario they set is the switch itself, so a notice about
// losing the *previous* scenario would only describe the click. What can be lost
// without a trace is everything else the reader had typed or picked, and that is
// what the same notice names. Measured on the live site 2026-11-11: ?q=旅遊
// (35 / 515) → 「工作省點力」 162 / 515 with the query box empty and nothing said.
function scenarioSwitchReset(){
  const reset=scenarioResetSnapshot();
  if(!reset)return null;
  const conditions=reset.conditions.filter(condition=>condition.key!=='scenario');
  return conditions.length?{...reset,conditions}:null;
}
function chooseScenarioFromHero(value){
  const reset=scenarioSwitchReset();
  chooseScenario(value);
  if(!reset)return;
  showScenarioReset(reset,value);
  if(!scenarioReset)return;
  landOnScenarioReset();
}
function renderRelated(item) {
  const related = relatedEntries(item, currentFiltered, entries);
  const section = el('section', 'related-cases');
  section.setAttribute('aria-labelledby', 'related-title');
  const heading = el('h2', '', '延伸閱讀');heading.id = 'related-title';
  section.append(heading, el('p', 'related-note', '限目前搜尋結果；先列兩個以上共同標籤的案例，再列相同分類，最後才列只在少數案例共用的單一標籤。標籤相同不保證用途或成效相同，請核對內容與來源。'));
  if (related.length) {
    const list = el('ul', 'related-list');
    related.forEach(({ item: other, reason }) => {
      const row = el('li');
      const button = el('button', 'related-open', other.title);button.type = 'button';
      button.dataset.relatedId = other.id;
      // Preserve the original result/discovery trigger for close and Escape.
      button.addEventListener('click', () => showDetail(other, null));
      row.append(el('p', 'related-meta', other.id + ' · ' + reason), button,
        el('p', 'related-summary', other.summary), el('p', 'related-proof', '來源類型：' + other.proof
          + (caseHasRelayedProof(other) ? '（' + PROOF_PROVENANCE.relayed.badge + '）' : '')));
      list.append(row);
    });
    section.append(list);
  } else {
    section.append(el('p', 'related-empty', discoveryReady
      ? (item.category
        ? '目前搜尋結果中，沒有共同標籤、相同分類或只在少數案例共用的標籤；因此沒有延伸閱讀。可關閉閱讀後調整搜尋條件。'
        : '這篇案例頁沒有宣告分類，也沒有與目前結果中其他案例共用的少見標籤；因此沒有延伸閱讀。可關閉閱讀後調整搜尋條件。')
      : '其他案例仍在載入，完成後會依目前搜尋條件提供延伸閱讀。'));
  }
  const back = el('button', 'related-back', '關閉並返回結果');back.type = 'button';
  back.setAttribute('aria-label', '關閉並返回結果');
  back.addEventListener('click', closeDetail);section.append(back);
  const nextActions = el('div', 'detail-next-actions');
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
    const text = copyNoteText(item, caseUrl.href);
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
const readingDisclosures=['.detail-full-account','.reader-guidance','.research-details','.reader-review','.reader-outline'];
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
    reviewQuery:$('detail-body').querySelector('.reader-review-find')?.value||'',
    reviewRows:[...$('detail-body').querySelectorAll('.reader-review-row')].map(node=>node.open),
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
  const reviewQuery=body.querySelector('.reader-review-find');
  if(reviewQuery){reviewQuery.value=view.reviewQuery||'';reviewQuery.dispatchEvent(new Event('input'));}
  readingDisclosures.forEach((selector,index)=>{const node=body.querySelector(selector);if(node)node.open=view.open[index];});
  body.querySelectorAll('.reader-review-row').forEach((node,index)=>{if(view.reviewRows&&index<view.reviewRows.length)node.open=view.reviewRows[index];});
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
function mergedDestination(item) {
  // Every recorded destination gets its own in-site entry. Offering only the
  // first left the second case reachable only by leaving the site for GitHub.
  const wrap=el('div','detail-merged-actions');
  const ids=item.mergedInto || [];
  if(!ids.length){
    wrap.append(el('p','detail-merged-unrecorded','來源檔沒有寫出併入的案例編號，因此這裡沒有站內入口；請以原始研究與來源索引核對去向。'));
    return wrap;
  }
  const missing=[];
  for(const id of ids){
    const canonical=entries.find(entry=>entry.kind==='case'&&entry.id===id);
    if(!canonical){missing.push(id);continue;}
    const open=el('button','detail-merged-open',`站內閱讀主案例 ${canonical.id}：${canonical.title} →`);
    open.type='button';
    open.setAttribute('data-merged-target',canonical.id);
    open.addEventListener('click',()=>showDetail(canonical,null));
    wrap.append(open);
  }
  if(missing.length){
    wrap.append(el('p','detail-merged-pending',`主案例 ${missing.join('、')} 尚未載入；可稍後重試，或在原始研究中核對來源。`));
    wrap.setAttribute('data-merged-missing',missing.join(','));
  }
  return wrap;
}
function refreshMergedDestination() {
  const body=$('detail-body');
  const wrap=body.querySelector('.detail-merged-actions');
  if(!wrap)return;
  // Rebuild only when a destination that was missing has now loaded. The caller runs
  // after every corpus refresh; replacing the block on a no-op drops focus to BODY
  // and throws a keyboard reader out of the dialog.
  const missing=(wrap.getAttribute('data-merged-missing')||'').split(',').filter(Boolean);
  const arrived=missing.some(id=>entries.some(entry=>entry.kind==='case'&&entry.id===id));
  if(!arrived)return;
  const dialog=$('detail');
  const active=document.activeElement;
  const withFocus=wrap.contains(active);
  const focusedTarget=withFocus?active.getAttribute?.('data-merged-target'):null;
  // Measure the destination the reader is on, not simply the first entry: a
  // destination that loads above the current one (UC-101 arriving after UC-102)
  // moves the block down, and aligning to a different id would shift the page.
  const anchor=(focusedTarget&&wrap.querySelector(`.detail-merged-open[data-merged-target="${focusedTarget}"]`))
    ||wrap.querySelector('.detail-merged-open');
  const anchorId=anchor?.getAttribute('data-merged-target')||null;
  const beforeTop=anchor?anchor.getBoundingClientRect().top:null;
  const replacement=mergedDestination(currentDetailItem);
  wrap.replaceWith(replacement);
  // The added entry makes the block taller: keep the reader's position on the same
  // destination, then put focus back on it (or on the first entry) instead of BODY.
  const afterAnchor=(anchorId&&replacement.querySelector(`.detail-merged-open[data-merged-target="${anchorId}"]`))
    ||replacement.querySelector('.detail-merged-open');
  if(beforeTop!==null&&afterAnchor&&dialog)
    dialog.scrollTop+=afterAnchor.getBoundingClientRect().top-beforeTop;
  if(withFocus){
    const next=(focusedTarget&&replacement.querySelector(`.detail-merged-open[data-merged-target="${focusedTarget}"]`))
      ||replacement.querySelector('.detail-merged-open');
    if(next)next.focus({preventScroll:true});
  }
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
    el('span', 'detail-badge kind-' + item.kind, item.kind === 'pending' ? pendingStateBadge(item) : KIND[item.kind]),
    ...proofBadges(item),
    el('span', 'detail-badge scenario-badge', '情境：' + item.scenario)
  );
  metaBar.append(el('span','detail-badge',item.reviewedDate?'頁首核對 '+item.reviewedDate:(item.fileReviewed?'本條未載核對日':'頁首未提供核對日')));
  if(!item.reviewedDate && item.fileReviewed)
    metaBar.append(el('span','detail-badge file-reviewed','來源檔查證 '+item.fileReviewed));
  body.append(metaBar);

  const title = el('h1', '', item.title);
  title.id = 'detail-title';
  title.tabIndex = -1;
  body.append(title);
  // Attribution and verification used to sit ~1200px below the title, below the
  // first screen on both desktop and mobile. State them beside the title and
  // keep the long explanation as the place the reader can jump to.
  const trust = el('p', 'detail-trust-summary');
  const otherClasses = (item.proofClasses || [item.proof]).filter(label => label !== item.proof);
  trust.append(
    el('span', 'detail-trust-item', otherClasses.length
      ? '成果主張：主要 ' + (PROOF_CLAIMANTS[item.proof] || '來源未明') + (proofIsRelayed(item, item.proof) ? PROOF_PROVENANCE.relayed.claimant : '') + '；另宣告 ' + otherClasses.join('、')
      : '成果主張：' + (PROOF_CLAIMANTS[item.proof] || '來源未明') + (proofIsRelayed(item, item.proof) ? PROOF_PROVENANCE.relayed.claimant : '')),
    el('span', 'detail-trust-item', otherClasses.length
      ? '核讀：主要 ' + (PROOF_STATUS_SHORT[item.proof] || '未獨立重現') + '；其他類別見下方'
      : '核讀：' + (PROOF_STATUS_SHORT[item.proof] || '未獨立重現'))
  );
  // Who made the claim and how the library obtained it are different facts; say
  // the acquisition route here instead of letting the class imply a first-hand read.
  if (caseHasRelayedProof(item))
    trust.append(el('span', 'detail-trust-item detail-trust-provenance', '取得：' + PROOF_PROVENANCE.relayed.badge));
  const trustJump = el('button', 'detail-trust-jump', '核讀與安全建議 ↓');
  trustJump.type = 'button';
  trustJump.addEventListener('click', () => {
    const note = $('detail-body').querySelector('.detail-proof-note');
    if (!note) return;
    note.tabIndex = -1;
    if (typeof note.focus === 'function') note.focus({ preventScroll: true });
    if (typeof note.scrollIntoView === 'function') note.scrollIntoView({ block: 'start' });
  });
  trust.append(trustJump);
  body.append(trust);
  const source = el('a', 'detail-source', '查看 GitHub 原始 Markdown ↗');
  // The visible text carries the case ID: an aria-label that omitted the visible
  // wording would break WCAG 2.5.3 (label in name) at desktop width.
  source.replaceChildren(
    el('span','print-action-long','查看 '+item.id+' 的 GitHub 原始 Markdown（新分頁） ↗'),
    el('span','print-action-short',item.id+' 原始 Markdown（新分頁） ↗')
  );
  if(sourceRevisionFor(item.path))source.href=sourceMarkdownUrl(item.path);
  else { source.setAttribute('aria-disabled','true'); source.tabIndex=0; }
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  const overview = el('div', 'plain-overview');
  const goalView = coreGoalView(item);
  const goalDeclared = goalView.source === 'declared';
  const goalSeparate = goalDeclared && item.coreGoal !== item.what;
  const compactPurpose = goalSeparate && item.what.length > 180;
  const purpose = el('section');
  purpose.append(el('h2', '', '可以幫你做什麼'), el('p', '', compactPurpose ? item.coreGoal : item.what));
  if (!goalDeclared) {
    // The card shows no 🎯 line for these pages, so the reader is where the gap
    // has to be named: silence here reads as "nothing to solve".
    const goalGap = el('p', 'detail-core-goal-source', goalView.heading + '｜' + goalView.note);
    goalGap.dataset.coreGoalSource = goalView.source;
    purpose.append(goalGap);
  }
  overview.append(purpose,source);
  if (item.mergedInto?.length || item.resolved) {
    const handoff=el('section','detail-merged-handoff');
    const recorded=(item.mergedInto||[]).length>0;
    handoff.append(
      el('h2','', item.kind==='pending'
        ? (recorded ? (item.mergedInto.length>1 ? '這條待查線索已併入下列主案例' : '這條待查線索已併入主案例') : '這條待查線索已處理，未記錄併入的主案例')
        : '這篇是主案例的來源補充'),
      el('p','', mergeHandoffSentence(item))
    );
    handoff.append(mergedDestination(item));
    overview.append(handoff);
  }
  if (item.scenario) overview.append(scenarioExploreAction(item));
  if (compactPurpose) {
    const fullAccount = el('details', 'detail-full-account');
    fullAccount.append(el('summary', '', '展開完整用途與案例描述'), el('p', '', item.what));
    overview.append(fullAccount);
  }
  overview.append(el('p','detail-source-version',sourceVersionNote(item.path)));
  if(!item.reviewedDate && item.fileReviewed)
    overview.append(el('p','detail-source-version detail-file-review','來源檔 '+item.path+' 於 '+item.fileReviewed+' 查證；這是檔案層級紀錄，不代表本條逐項核對。'));
  const latestSource=el('a','detail-source-latest','在 GitHub 查看最新版本（可能不同，新分頁） ↗');
  latestSource.href=sourceMarkdownUrl(item.path);
  latestSource.target='_blank';
  latestSource.rel='noopener noreferrer';
  latestSource.hidden=!!sourceRevisionFor(item.path);
  overview.append(latestSource);
  const queryCautions=searchContext(item,queryTerms()).matches.filter(match=>match.caution);
  if(queryCautions.length)overview.append(el('p','detail-search-caution','這次搜尋顯示的「'+queryCautions.map(match=>match.term).join('、')+'」命中限制或來源段落；請核對用途與原文，不要把文字提及當成可採用的做法。'));
  const targetUser = targetUserView(item);
  if (targetUser) {
    const userSection = el('section', 'detail-target-user');
    userSection.dataset.targetUserSource = targetUser.source;
    userSection.append(el('h2', '', targetUser.heading), el('p', '', targetUser.text),
      el('p', 'detail-target-user-source', targetUser.note));
    overview.append(userSection);
  }
  if (goalSeparate && !compactPurpose) {
    const goalSection = el('section', 'detail-core-goal');
    goalSection.dataset.coreGoalSource = goalView.source;
    goalSection.append(el('h2', '', goalView.heading), el('p', '', goalView.text));
    overview.append(goalSection);
  }
  if (item.difficulty) {
    const diffSection = el('section', 'detail-difficulty');
    diffSection.append(el('h2', '', '實作門檻'), el('p', '', DIFFICULTY_LABELS[item.difficulty] || item.difficulty),
      el('p', 'detail-difficulty-source', item.difficultySource === 'declared'
        ? '案例頁自行宣告這個門檻；本庫未另外驗證。'
        : '案例頁未宣告門檻，這是由本庫依內文關鍵字推測；請以案例的工具與步驟核對。'));
    overview.append(diffSection);
  }
  if (!discoveryReady) {
    const status=el('p','detail-load-status','這篇已可閱讀。其他案例仍在載入，完成後會提供切換與延伸閱讀。');
    status.setAttribute('role','status');
    overview.append(status);
  }
  // Let readers judge the purpose before choosing sharing or source actions.
  body.append(overview);

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
  const printBtn=el('button','btn-copy-link','列印／存成 PDF');
  printBtn.replaceChildren(el('span','print-action-long','列印／存成 PDF'),el('span','print-action-short','列印／PDF'));
  printBtn.id='print-case';printBtn.type='button';
  printBtn.setAttribute('aria-describedby','print-case-hint');
  printBtn.addEventListener('click',()=>window.print());
  actionRow.append(copyBtn,printBtn);
  if (item.tags && item.tags.length) {
    const tagsRow = el('span', 'detail-tags-text', '標籤：' + item.tags.join('、'));
    actionRow.append(tagsRow);
  }
  actionRow.append(shareFeedback);
  const printHint=el('p','print-case-hint sr-only','列印完整原始研究與來源；可在列印視窗選擇存成 PDF。');
  printHint.id='print-case-hint';
  body.append(actionRow,printHint);
  const warningText=item.kind === 'pending'
    ? (item.resolved
        ? (mergedDestinationText(item)
            ? `待查線索已處理：已併入 ${mergedDestinationText(item)}，不列為獨立案例；原帖與未核對事項仍保留。`
            : '待查線索已處理：來源檔未記錄併入的主案例，因此不列為獨立案例；原帖與未核對事項仍保留。')
        : '待查線索：證據尚不足，不列成功或已完成案例。')
    : '來源報告與本庫建議流程請分開閱讀；收錄不代表獨立重現或取得執行授權。';
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
  const multiClass = otherClasses.length > 0;
  const proofClaimant = el('span', 'proof-note-claimant', (multiClass ? '成果主張來源（主要：' + item.proof + '）：' : '成果主張來源：') + (PROOF_CLAIMANTS[item.proof] || '來源未明'));
  const proofStatus = el('span', 'proof-note-status', (multiClass ? '本庫核讀狀態（主要：' + item.proof + '）：' : '本庫核讀狀態：') + (PROOF_VERIFICATION_STATUS[item.proof] || '未獨立重現'));
  const proofSafety = el('span', 'proof-note-safety', PROOF_SAFE_ADOPTION_TIP[item.proof] || '安全採用建議（落地三層防護）：① 建議試跑：先於隔離測試或虛擬資料環境小規模驗證；② 禁止動作：未經確認切勿直接授權對外操作、金流付款或寫入生產系統；③ 必經審核：所有關鍵產出與操作必須經專人覆核後採用。');
  // The header can declare several classes; say so here instead of letting the
  // primary class speak for the whole page.
  if (multiClass) proofNote.append(declaredClassList(item));
  proofNote.append(proofTag, proofDesc);
  if (caseHasRelayedProof(item))
    proofNote.append(el('p', 'proof-note-provenance', PROOF_PROVENANCE.relayed.note));
  proofNote.append(proofClaimant, proofStatus, proofSafety);
  const closure=resolvedPendingNote(item);
  if(closure)proofNote.prepend(el('p','proof-note-closure',closure));
  body.append(proofNote);


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
  globalThis.CaseReader?.enhance(body, item, queryTerms().map(term=>({term,variants:termVariants(term)})),searchVariantIndex);
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
  if(lastTriggerContext?.area==='results' && currentDetailItem?.id!==lastTriggerContext.id){
    const index=currentFiltered.findIndex(item=>item.id===currentDetailItem.id);
    if(index>=0){
      ensureVisibleResult(currentDetailItem.id);
      const card=[...$('results').querySelectorAll('.card')].find(node=>node.dataset.caseId===currentDetailItem.id);
      const target=card?.querySelector(lastTriggerContext.read?'.card-bottom button':'h3 button');
      if(target){
        target.focus({preventScroll:true});
        target.scrollIntoView({block:'nearest',behavior:'instant'});
        return;
      }
    }
  }
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
  history.replaceState(history.state, '', url);
  // This entry now repeats the list stop behind it; the next Back press is only
  // the echo of this close, not a request to leave the results.
  spentDetailStop = {url:liveHistoryURL, length:liveHistoryLength, writes:liveHistoryWrites};
  updateMissingCase();
  syncPageContext();
  restoreDetailFocus();
}
// Explanations use the existing matching rules; they never rank or qualify evidence.
function contextExcerpt(text, variant, limit=96) {
  const chars=Array.from(text), index=searchVariantIndex(norm(text),variant);
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
const CONTEXT_CAUTION={
  限制:'此詞出現在限制／注意段落；命中不代表案例能完成這項任務。',
  來源:'此詞出現在來源／參考段落；命中不代表案例用途包含這項任務。',
  heading:'這個詞只出現在章節標題；以下是這一節開頭的內容，請開原文核對整節。',
  headingEmpty:'這個詞只出現在章節標題，而這一節目前沒有內容；命中不代表案例討論這件事。'
};
function searchContext(item, terms) {
  if(!terms.length)return {matches:[],remaining:0};
  const fields=[
    ['標題',(item.title||'')+(item.originalTitle&&item.originalTitle!==item.title?' '+item.originalTitle:'')],['用途',item.summary],['解決痛點',item.coreGoal],['案例編號',idVariants(item.id)],
    ['分類',item.category],['標籤',(item.tags||[]).join('、')],
    ['提及工具',(item.tools||[]).join('、')],['情境',item.scenario],['收錄狀態',KIND[item.kind]]
  ].map(([label,text])=>({label,text:text||'',original:false}));
  // Heading lines are kept apart from the prose: a match on one is reported as a
  // section label with the section's opening line, never as a sentence the case wrote.
  const headingFields=[];
  let section='頁首資料',fenced=false;
  for(const line of (item.markdown||'').split('\n')){
    if(/^\s*(?:```|~~~)/.test(line))fenced=!fenced;
    if(!line.trim())continue;
    const heading=fenced?null:line.match(/^(#{1,6})\s+(.+)/);
    if(heading&&heading[1].length>1){
      section=clean(heading[2]);
      headingFields.push({name:section,text:clean(heading[2])});
      continue;
    }
    fields.push({label:'原文 · '+(heading?.[1].length===1?'標題':section),text:line.replace(/^(?:#{1,6}\s+|[-*>]\s+|\d+\.\s+)/,'').trim(),original:true});
  }
  const sections=markdownSections(item.markdown);
  const matches=[];
  for(const term of [...new Set(terms)]){
    const variants=termVariants(term);
    // A source URL is the weakest reason a case matched, so it is only reported when
    // no prose field explains the hit. The caution rule below then marks it 來源.
    for(const allowUrl of [false,true]){
      let found=false;
      for(const field of fields){
        const prose=allowUrl||!field.original?field.text:withoutSourceUrls(field.text);
        const variant=variants.find(v=>searchVariantIndex(norm(prose),v)!==-1);
        if(!variant)continue;
        const caution=field.original&&/限制|風險|注意|缺口|權限/.test(field.label)?'限制':field.original&&/來源|參考|連結/.test(field.label)?'來源':'';
        matches.push({term,variant,label:field.label,excerpt:field.original?contextExcerpt(prose,variant):'',caution});
        found=true;
        break;
      }
      if(found)break;
    }
    if(matches.some(match=>match.term===term))continue;
    for(const heading of headingFields){
      const variant=variants.find(v=>searchVariantIndex(norm(heading.text),v)!==-1);
      if(!variant)continue;
      const opening=sectionOpening(sections,heading.name);
      matches.push({
        term,variant,
        label:'章節標題「'+sectionLabelName(heading.name)+'」',
        excerpt:opening?contextExcerpt(opening,variant):'',
        caution:opening?'heading':'headingEmpty'
      });
      break;
    }
  }
  return {matches:matches.slice(0,2),remaining:Math.max(0,matches.length-2)};
}
function renderSearchContext(item, terms) {
  const context=searchContext(item,terms);
  if(!context.matches.length)return null;
  const box=el('div','search-context');
  const sectionOnly=context.matches.every(match=>match.caution==='heading'||match.caution==='headingEmpty');
  box.append(el('p','search-context-title',sectionOnly?'搜尋命中 · 章節標題與該節開頭':context.matches.some(match=>match.excerpt)?'搜尋命中 · 原文節錄':'搜尋命中'));
  context.matches.forEach(match=>{
    const row=el('div','search-context-match');
    const relation=match.term===match.variant?'「'+match.term+'」':'「'+match.term+'」→「'+match.variant+'」';
    row.append(el('p','search-context-label',relation+' · '+match.label));
    if(match.excerpt)row.append(el('p','search-context-excerpt',match.excerpt));
    if(match.caution)row.append(el('p','search-context-caution',CONTEXT_CAUTION[match.caution]||CONTEXT_CAUTION['來源']));
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
    diffBadge.dataset.difficultySource = item.difficultySource || 'inferred';
    const diffLabel = DIFFICULTY_LABELS[item.difficulty] || item.difficulty;
    diffBadge.title = diffLabel + (item.difficultySource === 'declared' ? '（案例頁宣告）' : '（本庫依內文推測）');
    diffBadge.setAttribute('aria-label', '實作門檻：' + diffLabel + (item.difficultySource === 'declared' ? '，案例頁宣告' : '，本庫依內文推測，案例未宣告'));
    badgesWrap.append(diffBadge);
    if(DIFFICULTY_NOTES[item.difficulty]){
      const diffNote = el('span', 'card-difficulty-note', DIFFICULTY_NOTES[item.difficulty]);
      diffNote.dataset.difficulty = item.difficulty;
      diffNote.setAttribute('aria-hidden', 'true');
      badgesWrap.append(diffNote);
    }
  }
  // The card keeps data-kind="pending" (so the pending styling still applies);
  // the resolved label replaces the misleading "還在查證" wording.
  const kindBadge = el('span', 'kind', item.kind === 'pending' ? cardKindBadge(item) : KIND[item.kind]);
  badgesWrap.append(kindBadge);
  top.append(topInfo, badgesWrap);
  node.append(top);

  const h = el('h3');
  const title = el('button', '', item.title);
  title.type = 'button';
  title.addEventListener('click', () => showDetail(item, title));
  h.append(title);
  node.append(h);
  const cardGoal = coreGoalView(item);
  if(cardGoal.source === 'declared' && item.coreGoal !== item.summary && item.coreGoal !== item.title){
    const goalP = el('p', 'card-goal', '🎯 解決痛點：' + cardGoal.text);
    goalP.dataset.coreGoalSource = cardGoal.source;
    node.append(goalP);
  }
  const cardTargetUser = targetUserView(item);
  if(cardTargetUser){
    const userP = el('p', 'card-target-user', cardTargetUser.label + cardTargetUser.text);
    userP.dataset.targetUserSource = cardTargetUser.source;
    userP.title = cardTargetUser.note;
    userP.setAttribute('aria-label', (cardTargetUser.source === 'declared' ? '適合對象，案例頁宣告：' : '情境常見讀者，本庫依情境整理，案例頁未宣告適合對象：') + cardTargetUser.text);
    node.append(userP);
  }
  node.append(el('p', 'summary', item.summary));
  const reviewed=el('p','review-date');
  if(item.reviewedDate){const time=el('time','',item.reviewedDate);time.dateTime=item.reviewedDate;reviewed.append(document.createTextNode('頁首核對 '),time);}
  else if(item.fileReviewed){reviewed.textContent='本條未載核對日；來源檔查證 '+item.fileReviewed;}
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
  read.setAttribute('aria-label', read.textContent + ' 閱讀 ' + item.id + ' ' + item.title);
  read.addEventListener('click', () => showDetail(item, read));
  const proofBadge = el('span', 'proof', item.proof);proofBadge.dataset.proof = item.proof;
  proofBadge.setAttribute('role', 'note');
  const cardOthers = (item.proofClasses || [item.proof]).filter(label => label !== item.proof);
  const cardRelayed = proofIsRelayed(item, item.proof);
  if (cardRelayed) proofBadge.dataset.proofProvenance = 'relayed';
  proofBadge.title = (PROOF_DEFINITIONS[item.proof] || item.proof)
    + (cardRelayed ? '（' + PROOF_PROVENANCE.relayed.badge + '）' : '')
    + (cardOthers.length ? ' 本案例另宣告：' + cardOthers.join('、') + '（詳見案例）' : '');
  proofBadge.setAttribute('aria-label', '來源憑據：' + item.proof + (cardRelayed ? '，' + PROOF_PROVENANCE.relayed.badge : '') + '。' + (PROOF_DEFINITIONS[item.proof] || '')
    + (cardOthers.length ? ' 本案例另宣告 ' + cardOthers.length + ' 類來源：' + cardOthers.join('、') + '。' : ''));
  bottom.append(proofBadge, read);
  node.append(bottom);
  return node;
}
// Keep a nearby route back to refinement without hiding or reordering results.
function resultCards(items, terms, offset=0, total=items.length) {
  const nodes=[];
  items.forEach((item,index)=>{
    nodes.push(card(item,terms));
    const position=offset+index+1;
    if(position%6===0||position===total){
      const row=el('div','results-return');
      const link=el('a','','回到搜尋與篩選 ↑');
      link.href='#explore';
      link.dataset.resultsReturn=String(position);
      link.addEventListener('click',enterSearch);
      row.append(link);nodes.push(row);
    }
  });
  return nodes;
}
function showMoreResults() {
  const start=Math.min(visibleResults,currentFiltered.length);
  visibleResults=Math.min(start+RESULT_BATCH_SIZE,currentFiltered.length);
  const batch={key:resultQueryKey,count:visibleResults};
  history.replaceState({...history.state,[queryDirty||facetDraftDirty?'draftResultBatch':'resultBatch']:batch},'',location.href);
  const nodes=resultCards(currentFiltered.slice(start,visibleResults),queryTerms(),start,currentFiltered.length);
  $('results').append(...nodes);
  updateResultBatch();
  // Appended cards precede the button in DOM order. Start reading at the new
  // batch so the next Tab does not skip it, including pointer/AT activation.
  const firstTitle=nodes[0]?.querySelector('h3 button');
  if(firstTitle){
    firstTitle.focus({preventScroll:true});
    nodes[0].scrollIntoView({block:'start',behavior:'instant'});
  }
}
function ensureVisibleResult(id) {
  const index=currentFiltered.findIndex(item=>item.id===id);
  if(index<visibleResults)return;
  const start=visibleResults;
  visibleResults=Math.min(currentFiltered.length,Math.ceil((index+1)/RESULT_BATCH_SIZE)*RESULT_BATCH_SIZE);
  $('results').append(...resultCards(currentFiltered.slice(start,visibleResults),queryTerms(),start,currentFiltered.length));
  updateResultBatch();
}
function updateResultBatch() {
  // A shorter condition can leave visibleResults ahead of the matches (typing a
  // narrower word after a 24+ result query). The control is hidden then, so the
  // leftover text must not claim a negative number of remaining cases.
  const remaining=Math.max(0,currentFiltered.length-visibleResults);
  $('load-more-results').hidden=remaining===0;
  $('load-more-results').textContent=remaining ? `再看 ${Math.min(RESULT_BATCH_SIZE,remaining)} 筆（尚有 ${remaining} 筆）` : '';
}
// The sample card above the search is drawn from the corpus, so its height keeps
// changing after this scroll (measured 478→715px on a 390x844 phone) and pushes
// the field and the first result below the fold: the same click landed the first
// card at 788px or at 986px in an 844px viewport, depending on which case was
// drawn. Hold the search section in place until the layout settles, and give up
// the moment the reader deliberately scrolls somewhere themselves.
function keepSearchRevealed(){
  const results=$('results'), page=$('explore');
  // Result links are also exercised in a DOM-less unit context, where there is
  // no layout to align.
  if(!results||typeof results.querySelector!=='function'||!page||
    typeof document.addEventListener!=='function'||typeof requestAnimationFrame!=='function'||
    typeof setTimeout!=='function')return;
  let abandoned=false;
  const abandon=()=>{abandoned=true;};
  const events=['pointerdown','wheel','touchstart'];
  events.forEach(type=>document.addEventListener(type,abandon,{passive:true}));
  const align=()=>{
    if(abandoned)return;
    const card=results.querySelector('.card');
    if(card&&card.getBoundingClientRect().top>=innerHeight){
      page.scrollIntoView({block:'start',behavior:'instant'});
    }
  };
  // The corpus and the drawn card arrive at their own pace; three checks cover a
  // slow first paint without fighting a reader who is already reading.
  [70,240,600].forEach(delay=>setTimeout(align,delay));
  requestAnimationFrame(align);
  setTimeout(()=>events.forEach(type=>document.removeEventListener(type,abandon)),700);
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
  keepSearchRevealed();
}
// Latin characters inside a longer Latin word are not a hit: `auth` is not
// `author`, `ci` is not `specific`, `ev` is not `every`, `repo` is not `report`.
// The rule covers every all-latin variant, including the request abbreviations
// (`pr` in `privacy`) that used to be the only exception. A trailing run of
// digits still counts as a boundary so `uc101` and `pr149` keep matching, and
// Chinese neighbours are boundaries because they are not [a-z0-9].
const ASCII_VARIANT=/^[a-z0-9][a-z0-9 ._\/-]*$/;
function searchVariantIndex(text,variant) {
  let index=text.indexOf(variant);
  if(index===-1||!ASCII_VARIANT.test(variant))return index;
  while(index!==-1){
    const before=text[index-1]||'',after=text[index+variant.length]||'';
    if(!/[a-z0-9]/.test(before)&&(!/[a-z0-9]/.test(after)||/^\d+(?![a-z0-9])/.test(text.slice(index+variant.length))))return index;
    index=text.indexOf(variant,index+1);
  }
  return -1;
}
function matchesSearchVariant(text,variant) { return searchVariantIndex(text,variant)!==-1; }
function filterEntries(items, terms, filters) {
  const queries=terms.map(term=>{const literal=norm(term).replace(/^#/,'');return {literal,variants:termVariants(term)};});
  return items.filter(item => {
    const text=filters.scope==='overview'
      ? norm((item.title||'')+' '+(item.originalTitle||'')+' '+(item.summary||'')+' '+(item.coreGoal||''))
      : filters.scope==='topic'
        ? norm((item.title||'')+' '+(item.originalTitle||'')+' '+(item.summary||'')+' '+(item.coreGoal||'')+' '+(item.category||'')+' '+(item.tags||[]).join(' ')+' '+idVariants(item.id||''))
        : filters.scope==='body'
          // A fixture that carries only `search` keeps the full-text behaviour rather
          // than silently matching nothing.
          ? (item.searchBody||item.search)
          : item.search;
    // A word the reader did not type is a synonym this library added, so it only
    // counts inside the case's prose; the reader's own words still match URLs. The
    // body scope has its own prose copy, because its text already left headings out.
    const prose=filters.scope==='body'
      ? (item.searchProseBody||item.searchProse||text)
      : filters.scope?text:(item.searchProse||text);
    return queries.every(({literal,variants})=>variants.some(value=>matchesSearchVariant(value===literal?text:prose,value)))
      && (!filters.kind || item.kind === filters.kind) && (!filters.difficulty || item.difficulty === filters.difficulty) && (!filters.tool || item.tools.includes(filters.tool)) && (!filters.category || item.category === filters.category) && (!filters.scenario || item.scenario === filters.scenario) && (!filters.proof || item.proof === filters.proof);
  });
}

/* Rank only existing matches; evidence status, popularity and frequency are not scores. */
function rankEntries(items, terms) {
  if (!terms.length) return items.slice();
  const queries = [...new Set(terms)].map(term => ({term, variants:termVariants(term)}));
  return items.map((item, index) => {
    const title = norm((item.title || '') + ' ' + (item.originalTitle || ''));
    const summary = norm((item.summary || '') + ' ' + (item.coreGoal || ''));
    const fields = [item.category, item.scenario, ...(item.tags || []), ...(item.tools || [])].map(value => norm(value || ''));
    const id = norm(item.id || '');
    const score = [0, 0, 0, 0, 0, 0];
    queries.forEach(({term, variants}) => {
      if (variants.includes(id)) score[0]++;
      const inTitle = variants.some(variant => matchesSearchVariant(title,variant));
      const inSummary = variants.some(variant => matchesSearchVariant(summary,variant));
      if (inTitle || inSummary) score[1]++;

      const exactInTitle = matchesSearchVariant(title, term);
      if (exactInTitle) score[2]++;

      if (inTitle) score[3]++;

      const exactInTags = (item.tags || []).some(t => matchesSearchVariant(norm(t), term));
      const exactInSummary = matchesSearchVariant(summary, term);
      if (exactInTags || exactInSummary) score[4]++;

      if (variants.some(variant => fields.some(field => matchesSearchVariant(field,variant)))) score[5]++;
    });
    return {item, index, score};
  }).sort((a, b) => {
    for (let i = 0; i < a.score.length; i++) {
      if (a.score[i] !== b.score[i]) return b.score[i] - a.score[i];
    }
    return a.index - b.index;
  }).map(result => result.item);
}

// Which matches would survive if section headings stopped counting as text. This is
// a per-case question, not a per-word one: with several words, a case that finds one
// word in prose and another only in a heading drops out here. The sentence therefore
// says those cases need the heading to match, not that every word is a label. Kept
// next to the notice because it must be the same predicate the results list uses.
function headingOnlyMatches(items, terms, filters) {
  if (!terms.length || filters.scope) return [];
  return items.filter(item => filterEntries([item], terms, filters).length
    && !filterEntries([item], terms, { ...filters, scope: 'body' }).length);
}
// The label the reader is most likely looking at, so the sentence can name it
// instead of describing "a heading" in the abstract.
function sectionLabelCounts(items, terms) {
  const counts = new Map();
  for (const item of items) {
    for (const section of markdownSections(item.markdown)) {
      const matches = terms.some(term => termVariants(term).some(variant => matchesSearchVariant(norm(section.name), variant)));
      if (matches) { const name = sectionLabelName(section.name); counts.set(name, (counts.get(name) || 0) + 1); break; }
    }
  }
  return counts;
}
function sectionLabelExample(items, terms) {
  const counts = sectionLabelCounts(items, terms);
  let best = '', seen = 0;
  for (const [name, count] of counts) if (count > seen) { best = name; seen = count; }
  return best;
}
// A result count answers two questions: how many cases mention the words
// somewhere, and how many describe themselves with them. When the body-only tail
// dominates, the count alone reads as "N cases about this", so the results screen
// says the split and offers the narrower set. Two thirds is the point where the
// headline number stops describing the deck; below it the note would be noise on
// queries the corpus does answer directly (e.g. 會議: 13 of 26).
const BODY_ONLY_NOTICE_SHARE = 2 / 3;
function matchScopeNotice(overviewCount, totalCount) {
  if (!(totalCount > 0) || !(overviewCount >= 0)) return '';
  const bodyOnly = totalCount - overviewCount;
  if (bodyOnly <= 0) return '';
  if (overviewCount === 0) return 'none';
  return bodyOnly >= totalCount * BODY_ONLY_NOTICE_SHARE ? 'body' : '';
}

// The hero directory offers 53 tasks before anything is typed, so the same split
// the results screen discloses after a click is useful on the link itself: a task
// no case describes in its own title/purpose/pain would otherwise look as covered
// as one the library answers directly. One predicate answers every task entry —
// filterEntries() with the results page's overview scope — so the label and the
// screen cannot disagree. Facets still apply: the empty state offers tasks under
// the filters in force, and coverage has to mean the same condition set.
function taskCoverage(items, query, filters = {}) {
  const terms = tokenize(query || '');
  if (!terms.length) return null;
  const claimed = filterEntries(items, terms, { ...filters, scope: 'overview' }).length;
  if (claimed) return { claimed, total: null };
  return { claimed, total: filterEntries(items, terms, filters).length };
}
// Coverage is a property of the corpus, the task word and the filters — not of the
// question in the box. The dead-end panel rebuilds 45+ chips on every keystroke,
// so the answer is kept per corpus+filters; a new corpus (load, retry, merge) is a
// new array and a new cache, and a filter change is a new key.
const coverageMemo = new WeakMap();
function cachedTaskCoverage(items, query, filters = {}) {
  const key = (items.length + '|' + JSON.stringify(filters || {}));
  let byFilters = coverageMemo.get(items);
  if (!byFilters) { byFilters = new Map(); coverageMemo.set(items, byFilters); }
  const entry = key + '\u0000' + String(query || '');
  if (!byFilters.has(entry)) byFilters.set(entry, taskCoverage(items, query, filters));
  return byFilters.get(entry);
}
const TASK_COVERAGE_MARKER = '僅相關詞';
// The marker says what is measured, word for word: the same sentence the results
// screen prints. A task whose phrase was rewritten to `履歷 修改` is not "no case
// describes this" — UC-035's title is a resume rewrite — but no case holds both
// words in its title/purpose, and that is what the count is.
function coverageWords(query) {
  // Every word, never a truncated list: the sentence says 「同時包含」 and a shortened
  // list would claim more than was measured.
  return tokenize(query || '').map(term => `「${term}」`).join('');
}
function annotateTaskCoverage() {
  if (typeof document.querySelectorAll !== 'function') return 0;
  const links = [...document.querySelectorAll('#hero-problem-tags a.problem-tag, .hero-task-examples a[data-task-entry]')];
  if (!links.length) return 0;
  // A partial load is not a census: an unloaded case could be the one that claims
  // the task, so say nothing rather than mark a covered task as uncovered.
  if (!discoveryReady || failedPaths.length) {
    links.forEach(link => clearTaskCoverage(link));
    return 0;
  }
  const note = $('task-coverage-note');
  let marked = 0;
  for (const link of links) {
    const query = new URL(link.href, location.href).searchParams.get('q');
    const coverage = cachedTaskCoverage(entries, query);
    if (!coverage || coverage.claimed) { clearTaskCoverage(link); continue; }
    marked++;
    if (link.dataset.coverage === 'none') continue;
    link.dataset.coverage = 'none';
    link.append(el('span', 'task-coverage-none', TASK_COVERAGE_MARKER));
    const label = link.firstChild?.textContent?.trim() || query;
    link.title = `目前沒有案例的標題、用途或痛點同時包含${coverageWords(query) || '「'+label+'」'}；點入會列出 ${coverage.total} 筆提到相關詞的案例，並提供替代搜尋。`;
    // The visible text already names the link; a longer aria-label would stop
    // matching it (axe label-content-name-mismatch) and read the marker twice.
    // Point the description at the legend instead.
    if (note) link.setAttribute('aria-describedby', note.id);
  }
  if (note) note.hidden = marked === 0;
  return marked;
}
function clearTaskCoverage(link) {
  if (link.dataset.coverage !== 'none') return;
  delete link.dataset.coverage;
  link.querySelectorAll('.task-coverage-none').forEach(marker => marker.remove());
  link.removeAttribute('title');
  link.removeAttribute('aria-describedby');
}

// Narrowing re-types the query it searched, so tokenisation must give the same
// words back: "庫存 追蹤" becomes ["庫存"] through the phrase rewrites above and
// the promised count would then describe a different condition. Join with a
// separator that survives the rewrite chain, and verify the round trip.
function joinSearchTerms(terms) {
  for (const separator of ['、', ' ']) {
    const candidate = terms.join(separator);
    if (sameSearchTerms(tokenize(candidate), terms)) return candidate;
  }
  return null;
}
function sameSearchTerms(left, right) {
  return left.length === right.length && left.every((token, index) => token === right[index]);
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

// One definition per label: the legend under the filters, the card badge, the
// detail note and the active-filter sentence all read the same table, so a
// visitor cannot be told two different things about the same case.
function sourceTypeMessage(type) {
  if(!type)return '來源標籤不是獨立驗證。本庫未獨立重現，請核對原始報告與限制。';
  const description=Object.hasOwn(PROOF_DEFINITIONS,type)?PROOF_DEFINITIONS[type]:'此類型未列入說明，請核對原文與限制。';
  return type+'：'+description+' 本庫未獨立重現。';
}
const FILTER_LABELS = {query:'關鍵字',scenario:'使用情境',kind:'收錄狀態',difficulty:'實作門檻',tool:'提及工具',category:'主題分類',proof:'來源類型',scope:'命中範圍'};
const SEARCH_SCOPES={topic:'主題：標題、用途、核心目標、分類、標籤與案例 ID',overview:'標題、用途與痛點',body:'全文：不含章節標題'};
function searchScope(value) { return Object.hasOwn(SEARCH_SCOPES,value)?value:''; }
function activeConditions(query, filters) {
  return Object.entries({query, ...filters}).filter(([,value]) => value)
    .map(([key,value]) => ({key,value,label:FILTER_LABELS[key],display:key==='kind' ? KIND[value] || value : key==='scope' ? SEARCH_SCOPES[value] || value : value}));
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
  if(!matches.length || filterEntries(matches,terms,filters).length || relaxationOptions(matches,terms,filters).length)return [];
  const conditions=Object.entries(filters).filter(([key,value])=>key!=='query' && Object.hasOwn(FILTER_LABELS,key) && value)
    .map(([key,value])=>({key,value}));
  for(let size=2;size<=conditions.length;size++){
    const options=[];
    const visit=(start,removed)=>{
      if(removed.length===size){
        const remaining={...filters};
        removed.forEach(({key})=>remaining[key]='');
        const count=filterEntries(matches,terms,remaining).length;
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
  const difficultyHint = '實作門檻以案例頁宣告為準；未宣告的案例由本庫依內文關鍵字推測，卡片與詳情頁會標示推測。';
  const statusHint = '收錄狀態的「待查線索」是還沒列成案例的線索；來源類型的「尚待查證」是證據等級，兩者不同。';
  const proofCountHint = '來源類型依案例頁首宣告的主要類別計一次；同一案例宣告的其他類別，列在卡片與詳情的提示中。';
  // A page that declares no theme is not given one, so it cannot appear under any
  // 主題分類 option. Say how many those are instead of letting the filter look
  // like it covers the whole catalogue.
  const unclassified = discoveryReady ? entries.filter(item => !item.category).length : 0;
  const categoryHint = unclassified
    ? '主題分類只列案例頁首宣告的分類；' + unclassified + ' 個未宣告分類的條目不在選項內，仍可用關鍵字、使用情境與其他篩選找到。'
    : '';
  hint.textContent=(!discoveryReady
    ? '案例載入完成後，會顯示各選項的符合筆數。'
    : failedPaths.length
      ? '筆數只計已載入條目；補讀後會更新。選項前的數字是符合筆數，保留關鍵字與其他篩選；工具與分類先列有結果的選項，0 筆也可選。'
      : '選項前的數字是符合筆數，保留關鍵字與其他篩選；工具與分類先列有結果的選項，0 筆也可選。') + statusHint + difficultyHint + proofCountHint + categoryHint;
  // Count merged leads inside the same filtered set the pending option describes,
  // so a filtered view does not keep a global annotation it cannot show.
  const pendingBase=discoveryReady?filterEntries(entries,terms,{...filters,kind:''}):[];
  const resolvedPending=pendingBase.filter(item=>item.kind==='pending'&&item.resolved).length;
  const mergedPending=pendingBase.filter(item=>item.kind==='pending'&&item.resolved&&(item.mergedInto||[]).length).length;
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
      // A merged lead stays selectable but is not counted as an open question in
      // the statistics card, so the option says so instead of disagreeing with it.
      const mergedNote=key==='kind'&&option.value==='pending'&&resolvedPending&&counts[index]>=resolvedPending
        ? (mergedPending===resolvedPending
            ? `（含 ${resolvedPending} 筆已併入，統計不計）`
            : `（含 ${mergedPending} 筆已併入、${resolvedPending-mergedPending} 筆已處理未記錄去向，統計不計）`)
        : '';
      option.textContent=(discoveryReady ? counts[index]+' · ' : '')+option.dataset.label+mergedNote;
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
const SEARCH_KEYS=['q','scenario','kind','difficulty','tool','category','proof','scope'];
function searchLink(href,query,filters,sort='') {
  const current=new URL(href);
  const url=new URL(current.pathname,current.origin);
  if(query)url.searchParams.set('q',query);
  SEARCH_KEYS.slice(1).forEach(key=>{if(filters[key] && (key!=='scope'||searchScope(filters[key])))url.searchParams.set(key,filters[key]);});
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
  filters.scope=searchScope($('search-scope').value);
  return searchLink(location.href,$('query').value,filters,$('sort').value);
}
// Live edits keep the URL shareable; only an explicit submit commits the draft
// as a separate Back/Forward stop (including combined facet and sort changes).
let committedSearchURL=typeof location==='undefined'?'':location.href, queryDirty=false, facetDraftDirty=false;
let searchComposing = false, categoryComposing = false;
function submitSearch(event) {
  event.preventDefault();
  if (!discoveryReady || searchComposing || event.isComposing || categoryComposing || (document.activeElement?.id==='category-query' && event.submitter?.id!=='search-submit')) return;
  allowAutomaticArrival = false;
  const url = new URL(location.href);
  url.hash = 'explore';
  if((queryDirty||facetDraftDirty) && committedSearchURL!==url.href){
    const previous=new URL(committedSearchURL||location.href);
    previous.searchParams.delete('case');
    const {draftResultBatch:ignoredDraft,...previousState}=history.state||{};
    history.replaceState(previousState,'',previous);
    history.pushState(visibleResults>RESULT_BATCH_SIZE?{resultBatch:{key:resultQueryKey,count:visibleResults}}:null,'',url);
  }else {
    const {draftResultBatch:ignoredDraft,...state}=history.state||{};
    history.replaceState({...state,resultBatch:{key:resultQueryKey,count:visibleResults}},'',url);
  }
  committedSearchURL=url.href;
  queryDirty=false;
  facetDraftDirty=false;
  focusLoadedResults('start');
}
// The facet panel is a full screen of options. When it starts open on a viewport
// that cannot also show the result line, the reader types a question and gets 0
// cards on screen (1440x900: query at 174px, first card at 1491px). Compact only
// an untouched arrival, and never while the reader is working inside the panel.
// `base` is the element the arrival scrolls to the top; without it the check uses
// the viewport the reader is actually looking at.
function compactFiltersForResults(base=null) {
  const panel=$('filter-options');
  if(!panel||!panel.open||panel.contains(document.activeElement))return false;
  const bottom=$('results-count').getBoundingClientRect().bottom;
  const limit=innerHeight-24+(base?base.getBoundingClientRect().top:0);
  if(bottom<=limit)return false;
  panel.open=false;
  return true;
}
function revealSearch(resultsOnly=false) {
  // Keep readable controls and their values; explicit returns preserve choices.
  if(!resultsOnly)compactFiltersForResults($('explore'));
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
// The result line can be fully on screen while every case is still below the
// fold: a task entry lands on #explore, and the hit-scope and condition blocks
// then push the first card 739px past the search box (390×844, 2026-11-10). The
// count alone is therefore not evidence that the reader can read a result, and a
// visible card edge is not either — the title is the first line that says what
// the case is. When nothing matches, the equivalent pair is #empty's heading and
// the line that says what to try instead.
function arrivalLines() {
  const card = document.querySelector('#results .card');
  if (card) return [card.querySelector('h3') || card];
  return [document.querySelector('#empty h3'), $('empty-hint')].filter(Boolean);
}
function firstResultInView() {
  const lines = arrivalLines();
  if (!lines.length) return false;
  return lines.every(line => {
    const {top, bottom} = line.getBoundingClientRect();
    // A hidden block still reports 0,0 — which would otherwise read as "in view".
    return bottom > top && top >= 0 && bottom <= innerHeight;
  });
}
// A landscape phone or a short window cannot show the result line and the first
// case together (390px tall: the line fits, the title ends at 401). The reader
// came for a case, so the case wins; focus follows whatever is still visible.
function placeArrivalResults() {
  const count = $('results-count');
  count.scrollIntoView({block: 'start', behavior: 'instant'});
  count.focus({preventScroll: true});
  if (firstResultInView()) return;
  const line = arrivalLines()[0];
  if (!line || typeof line.scrollIntoView !== 'function') return;
  line.scrollIntoView({block: 'start', behavior: 'instant'});
  if (count.getBoundingClientRect().top >= 0) return;
  const control = document.querySelector('#results .card h3 button') || $('edit-query');
  if (control && typeof control.focus === 'function') control.focus({preventScroll: true});
}
function finishArrival(params,failed=false) {
  const missing=$('missing-case')&&!$('missing-case').hidden;
  const arrived=allowAutomaticArrival;
  const shouldMove=arrived&&(missing||hasSearchArrival(params,location.hash)||(failed&&params.has('case')));
  allowAutomaticArrival=false;
  if(shouldMove){
    if(missing)focusMissingCase();
    else {
      revealSearch();
      const count=$('results-count').getBoundingClientRect();
      // Arrival keeps the promise an explicit submit already makes: the first
      // case, or the empty state that replaces it, shares the screen with the
      // reader. The result line is placed like focusLoadedResults() places it, so
      // the two arrivals cannot disagree.
      if(!failed && discoveryReady && SEARCH_KEYS.some(key=>(params.get(key)||'').trim()) &&
        (count.top<0 || count.bottom>innerHeight || !firstResultInView()))placeArrivalResults();
    }
  }
  // A plain landing needs the same honesty as a shared search: opening the panel
  // by default must not be what hides every result.
  else if(arrived)compactFiltersForResults();
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
  else if(key==='scope')$('search-scope').value='';
  else if(Object.hasOwn(FILTER_LABELS,key))$(key).value='';
  render();
  focusResults();
}
function removeConditions(conditions) {
  conditions.forEach(({key})=>{
    if(key==='scenario')activeScenario='';
    else if(key==='scope')$('search-scope').value='';
    else if(['kind','difficulty','tool','category','proof'].includes(key))$(key).value='';
  });
  render();
  focusResults();
}
function clearFacets() {
  activeScenario='';
  $('search-scope').value='';
  ['kind','difficulty','tool','category','proof'].forEach(id=>{ if($(id)) $(id).value=''; });
  render();
  focusResults();
}
function prioritizeProblemTags(tags, query) {
  const text=norm(query);
  return tags.map((tag,index)=>({tag,index}))
    .sort((a,b)=>Number(text.includes(b.tag.term))-Number(text.includes(a.tag.term)) || a.index-b.index)
    .map(({tag})=>tag);
}

// Offer only literal task tags already present in loaded entries. A suggestion
// changes the query on selection; a substring alone does not establish relevance.
function phraseRecoveryOptions(items, query, filters, limit=3) {
  const text=norm(query);
  const candidates=new Set();
  items.forEach(item=>(item.tags||[]).forEach(tag=>{
    const phrase=norm(tag).trim();
    if(/^[\u3400-\u9fff]{2,6}$/.test(phrase) && text.includes(phrase) && text!==phrase)candidates.add(phrase);
  }));
  return [...candidates].map(phrase=>({
    query:phrase,
    count:filterEntries(items,tokenize(phrase),filters).length
  })).filter(option=>option.count>0 && option.count<=Math.max(3,Math.floor(items.length/10)))
    .sort((a,b)=>text.indexOf(a.query)-text.indexOf(b.query) || b.query.length-a.query.length)
    .slice(0,limit);
}

// A failed question usually still contains a term the library already uses to
// describe tasks (indexed tags plus the search synonym vocabulary). Offer that term
// instead of adding another hardcoded phrase rule for every round: the visitor keeps
// control, and the suggestion is a real substring of what they typed.
function vocabularyRecoveryOptions(items, query, filters, limit=3) {
  const text=norm(query).trim();
  if(!text)return [];
  const terms=new Set(Object.keys(SYNONYM_MAP));
  items.forEach(item=>(item.tags||[]).forEach(tag=>{
    const phrase=norm(tag).trim();
    if(phrase)terms.add(phrase);
  }));
  const matched=[...terms].filter(term=>term!==text && text.includes(term) && /^[\u3400-\u9fff]{2,6}$/.test(term));
  const scored=matched.map(term=>({query:term,count:filterEntries(items,tokenize(term),filters).length}))
    .filter(option=>option.count>0);
  // A term matching half the corpus is not a narrower question, so it stays out.
  const narrow=scored.filter(option=>option.count*2<items.length);
  return narrow.sort((a,b)=>b.query.length-a.query.length || a.count-b.count || text.indexOf(a.query)-text.indexOf(b.query)).slice(0,limit);
}

// A question keeps everyday words the library never indexes ("想", "沒時間"), and
// filterEntries() ANDs every token, so "想學英文" finds nothing while "學英文"
// finds 32 entries. The helpers above read whole library terms; this one reads the
// visitor's own characters: every contiguous CJK run they typed, put back through
// tokenize() so the site's rewrite rules still apply.
//
// Raw substrings are mostly fragments ("件匣", "人記"), so a run has to look like a
// word before its count is even considered:
//   - every word it tokenizes to is a library term, or it starts with one and is
//     short enough to be that term plus a suffix ("學英文" → 英語 + 學習);
//   - it does not start or end on a grammatical particle;
//   - between 3 and a tenth of the library match it — one or two hits are
//     accidents, and a run that matches a tenth of the library is not a next step.
// The label quotes the run verbatim and the count is measured before any click.
const SUBSTRING_QUERY_MIN=2, SUBSTRING_QUERY_MAX=6, SUBSTRING_QUERY_MIN_HITS=3;
const SUBSTRING_PARTICLE=/[的了嗎呢吧啊但而就都也又還很太不沒有是在和與或及把被讓給對從到想要會能可我你他她它們這那個些什怎樣為一]/;
function substringRecoveryOptions(items, query, filters, limit=3) {
  // Runs are read inside each whitespace-separated segment, never across it: the
  // label says "原問題包含「X」", so X has to be contiguous in what was typed.
  const segments=norm(query).split(/\s+/).filter(Boolean);
  if(!segments.length)return [];
  const echoed=norm(query).trim();
  const vocabulary=new Set(libraryVocabulary(items));
  const wordLike=part=>{
    if(SUBSTRING_PARTICLE.test(part[0])||SUBSTRING_PARTICLE.test(part[part.length-1]))return false;
    const read=tokenize(part);
    return read.every(term=>vocabulary.has(term))
      || (part.length<=4 && vocabulary.has(read[0]));
  };
  const counts=new Map();
  const count=part=>{
    if(!counts.has(part))counts.set(part,filterEntries(items,tokenize(part),filters).length);
    return counts.get(part);
  };
  const band=Math.max(3,Math.floor(items.length/10));
  const found=[];
  for(const text of segments){
    for(let start=0;start<text.length;start++){
      for(let size=SUBSTRING_QUERY_MIN;size<=SUBSTRING_QUERY_MAX&&start+size<=text.length;size++){
        const part=text.slice(start,start+size);
        // Never echo the whole question back as its own recovery.
        if(part===echoed||!/^[\u3400-\u9fff]+$/.test(part)||!wordLike(part))continue;
        const matches=count(part);
        if(matches>=SUBSTRING_QUERY_MIN_HITS&&matches<=band)found.push({query:part,count:matches,start,size});
      }
    }
  }
  const accepted=[];
  found
    // Narrowest first: a run that still covers a tenth of the library is the
    // weaker next step, however long it is.
    .sort((a,b)=>a.count-b.count||b.size-a.size||a.start-b.start)
    .forEach(option=>{
      // "英文" adds nothing once "學英文" is on offer.
      if(accepted.some(chosen=>chosen.query.includes(option.query)))return;
      accepted.push(option);
    });
  return accepted.slice(0,limit).map(option=>({query:option.query,count:option.count}));
}

// A visitor's everyday phrase often fuses two library terms into one CJK run
// ("客戶抱怨", "合約到期提醒"). tokenize() keeps the run whole, so an exact
// substring match finds nothing even though each term exists on its own. Only
// when the strict match is empty, read the run as adjacent terms that cover
// every character, and only when their conjunction is a real narrowing.
function compoundQuerySplit(items, terms, filters, limit=24) {
  if(terms.length!==1 || items.length<4)return null;
  // A facet that excludes everything is the visitor's own narrowing; the empty
  // state already names the facet to remove, so the wording is not the problem.
  if(Object.values(filters).some(Boolean))return null;
  const run=terms[0];
  if(run.length<4 || run.length>10 || !/^[\u3400-\u9fff]+$/.test(run))return null;
  if(filterEntries(items,terms,filters).length)return null;
  const present=new Map();
  const known=segment=>{
    if(!present.has(segment))present.set(segment,filterEntries(items,[segment],filters).length>0);
    return present.get(segment);
  };
  const segmentations=[];
  const walk=(start,parts)=>{
    if(segmentations.length>=limit)return;
    if(start===run.length){segmentations.push(parts.slice());return;}
    for(let size=run.length-start;size>=2;size--){
      const segment=run.slice(start,start+size);
      if(!known(segment))continue;
      parts.push(segment);walk(start+size,parts);parts.pop();
      if(segmentations.length>=limit)return;
    }
  };
  walk(0,[]);
  segmentations.sort((a,b)=>a.length-b.length || b[0].length-a[0].length);
  for(const segments of segmentations){
    const count=filterEntries(items,segments,filters).length;
    if(count>0 && count*2<items.length)return {source:run,segments,terms:segments,count};
  }
  return null;
}

// Most first-time questions are sentences, not keywords ("怎麼讓 AI 幫我檢查合約
// 有沒有問題"). tokenize() keeps each CJK run whole and filterEntries() requires
// every run to appear literally, so a sentence usually matches nothing even when
// it contains a task the library does cover. When the strict match is empty, the
// query carries more than a keyword and no facet is narrowing it, look for the
// library's own vocabulary inside the sentence: synonym keys plus indexed tags.
// Up to two of those words are used together, so the result stays a literal
// narrowing rather than an inferred interpretation.
// Five Chinese characters is the boundary between a keyword lookup and a task
// described in the visitor's own words: "比價" or "照片 旅行" (four characters of
// keywords) must stay exact, while "找便宜的機票" (6) and "整理履歷表" (5) are
// prose. The gate only decides whether to look, never what to answer.
const SENTENCE_QUERY_MIN_CHARS=5;
const SENTENCE_CANDIDATE_LIMIT=5;
let vocabularyCache={key:'',terms:[]};
function libraryVocabulary(items) {
  const key=String(items.length);
  if(vocabularyCache.key===key)return vocabularyCache.terms;
  const terms=new Set();
  const add=value=>{
    const term=norm(value||'').trim();
    if(term.length>=2&&term.length<=12)terms.add(term);
  };
  Object.keys(SYNONYM_MAP).forEach(add);
  items.forEach(item=>(item.tags||[]).forEach(add));
  vocabularyCache={key,terms:[...terms]};
  return vocabularyCache.terms;
}
// Latin words are matched as whole tokens: "ev" must not be found inside
// "review", which is the same incidental-fragment rule the PR query follows.
function latinTokenPattern(term) {
  const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp('(^|[^a-z0-9])'+escaped+'([^a-z0-9]|$)');
}
const termAppearsIn=(term, text, spaced)=>/[a-z0-9]/.test(term)
  ? latinTokenPattern(term).test(spaced)
  : text.includes(term);
// A sentence may carry several library words. Prefer the narrower conjunction,
// but never one that stands for the same synonym group twice.
function sentenceCandidates(items, text, spaced, filters) {
  const seen=new Set(), candidates=[];
  for(const term of libraryVocabulary(items)){
    if(term===text || !termAppearsIn(term,text,spaced))continue;
    const key=termVariants(term).slice().sort().join('|');
    if(seen.has(key))continue;
    seen.add(key);
    const count=filterEntries(items,[term],filters).length;
    if(count>0)candidates.push({term,count,key});
  }
  return candidates
    .sort((a,b)=>b.term.length-a.term.length || a.count-b.count || text.indexOf(a.term)-text.indexOf(b.term))
    .slice(0,SENTENCE_CANDIDATE_LIMIT);
}
function sentenceQueryFallback(items, query, terms, filters) {
  if(items.length<40)return null;
  // A facet that excludes everything is the visitor's own narrowing; the empty
  // state already names the facet to remove, so the sentence is not the problem.
  if(Object.values(filters).some(Boolean))return null;
  const source=(query||'').trim();
  // Quoted wording asks for that wording, not for the words inside it.
  if(/[「」『』"“”]/.test(source))return null;
  const spaced=norm(source);
  const text=spaced.replace(/\s+/g,'');
  // Only Chinese characters count toward the boundary: a task described in the
  // visitor's own words ("每月信用卡帳單整理", 9 characters) is prose, while a
  // mixed lookup such as "旅遊 xyz987" stays an exact search for what they typed.
  const cjk=(text.match(/[\u3400-\u9fff]/g)||[]).length;
  if(cjk<SENTENCE_QUERY_MIN_CHARS)return null;
  // An explicit case or lead number is the most specific thing the visitor typed;
  // answering with a topic word instead would silently answer another question.
  // tokenize() already normalises UC 012, UC_012, UC:012 and #314 to uc-012/uc-314,
  // so reading its tokens covers every separator without a second rule to maintain.
  if(terms.some(term=>/^(?:uc|p)-\d+$/.test(term)))return null;
  // In the 5–9 Chinese-character band this change opened, the phrase can still be
  // a lookup. Any Latin or numeric token the visitor typed themselves (a tool, a
  // year, a version, an amount) is part of the question, and the re-read only
  // rewrites Chinese prose: dropping one of those tokens would answer something
  // else, so that band stays exact. Questions of 10+ characters keep their
  // existing behaviour rather than change two rules in one step.
  if(cjk<10 && terms.some(term=>/[a-z0-9]/i.test(term)))return null;
  // A word covering a third of the library is not a narrower question, so it is
  // never used alone; it may still join a second word to form a real narrowing.
  const narrow=option=>option.count>0 && option.count*3<items.length;
  const candidates=sentenceCandidates(items,text,spaced,filters);
  const single=candidates.find(narrow) || null;
  let best=single ? {segments:[single.term],terms:[single.term],count:single.count} : null;
  for(let i=0;i<candidates.length;i++){
    for(let j=i+1;j<candidates.length;j++){
      const [first,second]=[candidates[i].term,candidates[j].term];
      // One word inside the other (pull request / request) adds no new narrowing.
      if(first.includes(second) || second.includes(first))continue;
      const terms=[first,second];
      const option={segments:terms,terms,count:filterEntries(items,terms,filters).length};
      if(narrow(option) && (!best || option.count<best.count))best=option;
    }
  }
  if(!best)return null;
  return {...best,source,mode:'words'};
}
// One place decides whether an empty strict match may be re-read, so the
// browser and the unit tests cannot drift apart.
function searchExpansion(items, query, terms, filters) {
  if(!terms.length || filterEntries(items,terms,filters).length)return null;
  return compoundQuerySplit(items,terms,filters) || sentenceQueryFallback(items,query,terms,filters);
}

// The expansion in force, and the phrase the visitor chose to keep exact.
// Turning the expansion off never rewrites what they typed.
let activeSearchSplit=null, splitSuppressedFor='';
const queryTerms=()=>activeSearchSplit ? activeSearchSplit.terms : tokenize($('query').value);
function showSearchSplitNote(possibleSplit, suppressed) {
  const note=$('search-split'), message=$('search-split-message'), action=$('search-split-exact');
  if(!note)return;
  const split=possibleSplit;
  if(!split){note.hidden=true;note.dataset.mode='';if(message.textContent)message.textContent='';return;}
  const segments=split.segments.map(segment=>'「'+segment+'」').join('＋');
  const words=split.mode==='words';
  let text, label;
  if(words){
    const each=split.segments.length>1;
    text=suppressed
      ? '目前只找完整包含整句的案例，因此沒有結果。句中包含站上既有的詞'+segments+'，改用'+(each?'這些詞同時符合':'該詞')+'可看 '+split.count+' 筆；這是字面比對，不是語意理解。'
      : '整句沒有直接命中案例。句中包含站上既有的詞'+segments+'，改以'+(each?'這些詞同時符合':'該詞')+'搜尋，顯示 '+split.count+' 筆；這是字面比對，不是語意理解，也不代表已驗證。';
    label=suppressed ? '改用句中詞' : '只找完整句子';
  } else {
    const source=abbreviatedQuery(split.source);
    text=suppressed
      ? '目前只找完整包含「'+source+'」的案例，因此沒有結果。改以'+segments+'同時符合可看 '+split.count+' 筆；這是字面拆詞，不是語意理解。'
      : '沒有完整包含「'+source+'」的案例。改以'+segments+'同時符合，顯示 '+split.count+' 筆；這是字面拆詞，不是語意理解，也不代表已驗證。';
    label=suppressed ? '改用拆詞結果' : '只找完整句子';
  }
  // Keep the live region quiet unless the message actually changed.
  if(message.textContent!==text)message.textContent=text;
  if(action.textContent!==label)action.textContent=label;
  note.dataset.mode=suppressed ? 'suppressed' : 'expanded';
  note.hidden=false;
}

// An explicit recovery is a navigation: retain the failed search for Back.
function recoverSearchQuery(query) {
  const failedURL=location.href;
  if((queryDirty||facetDraftDirty) && committedSearchURL!==failedURL){
    const previous=new URL(committedSearchURL||failedURL);
    previous.searchParams.delete('case');
    history.replaceState(history.state,'',previous);
    history.pushState(null,'',failedURL);
  }
  history.pushState(null, '', location.href);
  $('query').value=query;
  render();
  committedSearchURL=location.href;
  queryDirty=false;
  facetDraftDirty=false;
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
  syncScenarioReset(conditions);
  $('search-feedback').hidden=!discoveryReady||!conditions.length;
  $('clear-facets').hidden=!hasFacets;
  $('clear-facets').textContent=$('query').value ? '清除篩選，保留關鍵字' : '清除所有篩選';
  const suggestions=$('empty-suggestions');suggestions.replaceChildren();
  if(!currentFiltered.length&&discoveryReady){
    const options=relaxationOptions(entries,terms,filters).slice(0,3);
    options.forEach(({key,value,count})=>{
      const button=el('button','recovery-option','移除'+FILTER_LABELS[key]+'「'+(key==='kind'?KIND[value]||value:key==='scope'?SEARCH_SCOPES[value]||value:value)+'」 → 查看 '+count+' 筆');
      button.type='button';button.dataset.removeFilter=key;
      button.addEventListener('click',()=>removeCondition(key));
      suggestions.append(button);
    });
    const combined=options.length ? [] : combinedRelaxationOptions(entries,terms,filters).slice(0,3);
    combined.forEach(({conditions,count})=>{
      const labels=conditions.map(({key,value})=>FILTER_LABELS[key]+'「'+(key==='kind'?KIND[value]||value:key==='scope'?SEARCH_SCOPES[value]||value:value)+'」');
      const button=el('button','recovery-option','一起移除'+labels.join('、')+' → 查看 '+count+' 筆');
      button.type='button';button.dataset.removeFilters=conditions.map(({key})=>key).join(',');
      button.addEventListener('click',()=>removeConditions(conditions));
      suggestions.append(button);
    });
    const queryOptions=queryRelaxationOptions(entries,$('query').value,filters).slice(0,3);
    queryOptions.forEach(({query,removed,count})=>{
      const button=el('button','recovery-option','只移除關鍵字「'+removed+'」 → 查看 '+count+' 筆');
      button.type='button';
      button.dataset.queryRecovery=query;
      button.addEventListener('click',()=>recoverSearchQuery(query));
      suggestions.append(button);
    });
    const phraseOptions=queryOptions.length ? [] : phraseRecoveryOptions(entries,$('query').value,filters);
    const vocabularyOptions=phraseOptions.length||queryOptions.length ? [] : vocabularyRecoveryOptions(entries,$('query').value,filters);
    vocabularyOptions.forEach(({query,count})=>{
      const button=el('button','recovery-option','原問題包含「'+query+'」 → 搜尋 '+count+' 筆');
      button.type='button';
      button.dataset.queryRecovery=query;
      button.addEventListener('click',()=>recoverSearchQuery(query));
      suggestions.append(button);
    });
    phraseOptions.forEach(({query,count})=>{
      if(suggestions.querySelector('[data-query-recovery="'+query+'"]'))return;
      const button=el('button','recovery-option','原問題提到「'+query+'」 → 搜尋 '+count+' 筆文字命中');
      button.type='button';button.dataset.queryRecovery=query;
      button.addEventListener('click',()=>recoverSearchQuery(query));
      suggestions.append(button);
    });
    // Only when nothing above could be said about this question: the task list
    // below is the same for everyone, so anything the visitor's own words can
    // reach belongs in front of it.
    const substringOptions=queryOptions.length||phraseOptions.length||vocabularyOptions.length
      ? []
      : substringRecoveryOptions(entries,$('query').value,filters);
    substringOptions.forEach(({query,count})=>{
      if(suggestions.querySelector('[data-query-recovery="'+query+'"]'))return;
      const button=el('button','recovery-option','原問題包含「'+query+'」 → 搜尋 '+count+' 筆文字命中');
      button.type='button';button.dataset.queryRecovery=query;
      button.addEventListener('click',()=>recoverSearchQuery(query));
      suggestions.append(button);
    });
    if(terms.length){
      const problemTags = [
        {label:'郵件摘要 · 搜尋「郵件」', term:'郵件'},
        {label:'會議整理 · 搜尋「會議」', term:'會議'},
        {label:'日報整理 · 搜尋「日報」', term:'日報'},
        {label:'自動客服 · 搜尋「客服」', term:'客服'},
        {label:'代碼審查 · 搜尋「代碼審查」', term:'代碼審查'},
        {label:'✍️ 搜尋「社群文案」', term:'社群文案'},
        {label:'👥 搜尋「排班」', term:'排班'},
        {label:'📊 搜尋「資料擷取」', term:'資料擷取'},
        {label:'🎙️ 搜尋「播客摘要」', term:'播客摘要'},
        {label:'⚖️ 搜尋「契約審查」', term:'契約審查'},
        {label:'🔍 搜尋「競品分析」', term:'競品分析'},
        {label:'🐞 搜尋「代碼除錯」', term:'代碼除錯'},
        {label:'🌐 搜尋「文件翻譯」', term:'文件翻譯'},
        {label:'🕷️ 搜尋「網頁抓取」', term:'網頁抓取'},
        {label:'📄 搜尋「寫履歷」', term:'寫履歷'},
        {label:'🧾 搜尋「發票」', term:'發票'},
        {label:'✈️ 搜尋「出差報銷」', term:'出差報銷'},
        {label:'📄 搜尋「合約審核」', term:'合約審核'},
        {label:'🛠️ 搜尋「除錯」', term:'除錯'},
        {label:'🧩 搜尋「代碼重構」', term:'代碼重構'},
        {label:'🧾 搜尋「發票辨識」', term:'發票辨識'},
        {label:'📋 搜尋「問卷調查」', term:'問卷調查'},
        {label:'📚 搜尋「文獻回顧」', term:'文獻回顧'},
        {label:'✈️ 搜尋「機票比價」', term:'機票比價'},
        {label:'🏖️ 搜尋「旅遊」', term:'旅遊'},
        {label:'🏷️ 搜尋「比價」', term:'比價'},
        {label:'🧹 搜尋「資料清理」', term:'資料清理'},
        {label:'🪵 搜尋「日誌分析」', term:'日誌分析'},
        {label:'⚖️ 搜尋「法規遵循」', term:'法規遵循'},
        {label:'📝 搜尋「筆記整理」', term:'筆記整理'},
        {label:'💬 搜尋「客戶反饋」', term:'客戶反饋'},
        {label:'🎯 搜尋「面試準備」', term:'面試準備'},
        {label:'📣 搜尋「行銷文案」', term:'行銷文案'},
        {label:'⚡ 搜尋「效能分析」', term:'效能分析'},
        {label:'🧾 搜尋「報帳審核」', term:'報帳審核'},
        {label:'📊 搜尋「簡報製作」', term:'簡報製作'},
        {label:'📅 搜尋「社群排程」', term:'社群排程'},
        {label:'📌 搜尋「專案進度」', term:'專案進度'},
        {label:'📈 搜尋「數據分析」', term:'數據分析'},
        {label:'🎙️ 搜尋「音訊轉寫」', term:'音訊轉寫'},
        {label:'🧭 搜尋「市場調研」', term:'市場調研'},
        {label:'💡 搜尋「產品調研」', term:'產品調研'},
        {label:'📖 搜尋「讀書筆記」', term:'讀書筆記'},
        {label:'🗣️ 搜尋「英語學習」', term:'英語學習'},
        {label:'🛡️ 搜尋「漏洞掃描」', term:'漏洞掃描'},
        {label:'🔒 搜尋「隱私審查」', term:'隱私審查'},
        {label:'💰 搜尋「成本分析」', term:'成本分析'},
        {label:'🏢 搜尋「供應商評估」', term:'供應商評估'},
        {label:'👥 搜尋「招募審查」', term:'招募審查'},
        {label:'📄 搜尋「合約比對」', term:'合約比對'},
        {label:'📊 搜尋「報表比對」', term:'報表比對'},
        {label:'📰 搜尋「電子報」', term:'電子報'},
        {label:'📦 搜尋「庫存管理」', term:'庫存管理'},
        {label:'🛡️ 搜尋「安全防護」', term:'安全防護'},
        {label:'🤝 搜尋「人工審批」', term:'人工審批'},
      ].filter(({term})=>!phraseOptions.some(option=>option.query===term) && filterEntries(entries,tokenize(term),filters).length>0);
      const prioritizedTags=prioritizeProblemTags(problemTags,$('query').value);
      if(problemTags.length){
        // The hero directory already carries this label; the dead-end panel is the
        // other place a task entry is offered, and it must not read as "the library
        // answers this" while the visitor is already stuck. Same predicate, same
        // word, same evidence. A partial load is not a census, so nothing is marked
        // then; and because the panel is a scrolled wall, tasks a case actually
        // describes stay in front of the ones only related words reach.
        const annotated = prioritizedTags.map(tag => ({ ...tag, coverage: cachedTaskCoverage(entries, tag.term, filters) }));
        // A partial load is not a census: the counts still decide what is offered,
        // but nothing is marked while a source file is missing.
        const canMark = !failedPaths.length;
        const uncovered = canMark ? annotated.filter(({ coverage }) => coverage && coverage.claimed === 0) : [];
        const orderedTags = uncovered.length
          ? [...annotated.filter(item => !item.coverage || item.coverage.claimed > 0), ...uncovered]
          : annotated;
        const problemContainer = el('div','empty-problem-suggestions');
        problemContainer.setAttribute('role','group');
        problemContainer.setAttribute('aria-label','推薦常見痛點關鍵字');
        const hasFacetRemovals = Boolean(options.length || combined.length);
        const intro = el('p','empty-problem-intro', hasFacetRemovals ? '或保留目前篩選，探索此條件下有收錄的常見問題：' : '以下搜尋在目前篩選下有結果，可保留其他條件繼續探索：');
        problemContainer.append(intro);
        let legend = null;
        if(uncovered.length){
          legend = el('p','empty-problem-legend','「'+TASK_COVERAGE_MARKER+'」＝目前條件下，沒有案例的標題、用途或痛點同時包含這項任務的搜尋詞；點入仍會列出相關詞命中與替代搜尋。');
          legend.id = 'empty-coverage-legend';
          problemContainer.append(legend);
        }
        const chipsWrap = el('div','empty-problem-chips');
        orderedTags.forEach(({label, term, coverage})=>{
          const btn = el('button','recovery-option recovery-problem-tag',label);
          btn.type = 'button';
          btn.dataset.problemTag = term;
          btn.setAttribute('data-problem-tag', term);
          btn.setAttribute('aria-label', label);
          if(canMark && coverage && coverage.claimed === 0){
            btn.dataset.coverage = 'none';
            btn.append(el('span','task-coverage-none',TASK_COVERAGE_MARKER));
            // The visible text is the accessible name, so the marker belongs in it.
            btn.setAttribute('aria-label', label+TASK_COVERAGE_MARKER);
            btn.title = `目前條件下，沒有案例的標題、用途或痛點同時包含${coverageWords(term)}；點入會列出 ${coverage.total} 筆相關詞命中，並提供替代搜尋。`;
            btn.setAttribute('aria-describedby', legend.id);
          }
          btn.addEventListener('click',()=>recoverSearchQuery(term));
          chipsWrap.append(btn);
        });
        problemContainer.append(chipsWrap);
        suggestions.append(problemContainer);
      }
    }
    $('empty-hint').textContent=
      combined.length && suggestions.querySelector('.empty-problem-suggestions')
      ? '至少要一起移除 '+combined[0].conditions.length+' 項篩選才能保留原關鍵字；或直接點選下方推薦問題，保留目前篩選繼續探索。'
      : combined.length
      ? '至少要一起移除 '+combined[0].conditions.length+' 項篩選才有結果。以下調整會保留關鍵字與其餘條件。'
      : suggestions.querySelector('.empty-problem-suggestions') && (options.length || queryOptions.length)
      ? '可調整指定條件查看更多案例；或直接點選下方推薦問題，保留目前條件繼續探索。'
      : suggestions.children.length && terms.length>1 && !suggestions.querySelector('.empty-problem-suggestions')
      ? '關鍵字須同時符合；以下建議只調整指定條件，並保留其餘條件。'
      : options.length
      ? '每個條件都要符合才會顯示。試著只移除一項，其他條件會保留。'
      : suggestions.querySelector('.empty-problem-suggestions') ? '下方建議可調整關鍵字；任務捷徑在目前篩選下有結果，其餘條件不變。'
      : hasFacets ? '目前條件沒有交集。請調整篩選或清除篩選後保留關鍵字再找。'
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
  if(!q.length)$('search-scope').value='';
  const filters = Object.fromEntries(['kind', 'difficulty', 'tool', 'category', 'proof'].map(id => [id, $(id)?.value || '']));
  filters.scope=searchScope($('search-scope').value);
  $('search-scope').disabled=!q.length;
  $('search-scope').closest('.search-scope').hidden=!q.length;
  if (activeScenario) filters.scenario = activeScenario;
  const sourceNote=sourceTypeMessage(filters.proof);
  if($('source-type-note').textContent!==sourceNote)$('source-type-note').textContent=sourceNote;
  const facetCount = Object.values(filters).filter(Boolean).length;
  $('filter-count').textContent = filterSummary(facetCount, $('sort').value);
  const queryText=$('query').value.trim();
  if(queryText!==splitSuppressedFor)splitSuppressedFor='';
  const matches=filterEntries(entries,q,filters);
  const splitSuppressed=splitSuppressedFor===queryText;
  const possibleSplit=matches.length||!q.length ? null : searchExpansion(entries, queryText, q, filters);
  activeSearchSplit=splitSuppressed ? null : possibleSplit;
  const searchTerms=activeSearchSplit ? activeSearchSplit.terms : q;
  const shownMatches=activeSearchSplit ? filterEntries(entries,searchTerms,filters) : matches;
  currentFiltered = orderEntries(shownMatches, searchTerms, $('sort').value);
  $('search-order-note').hidden = !discoveryReady || ($('sort').value!=='reviewed'&&(!q.length||!currentFiltered.length));
  $('search-order-controls').hidden=$('search-order-note').hidden;
  $('reset-sort').hidden=!discoveryReady||$('sort').value!=='reviewed';
  $('search-order-note').textContent=$('sort').value==='reviewed'
    ? '依頁首核對日由新到舊；不是發布日，也不代表新增或獨立驗證。正文補充不計；未提供者置後，同日保留原本的符合順序。'
    : '標題、用途與痛點優先；'+(filters.scope?'只在所選命中範圍搜尋。':'全文仍納入搜尋。')+'排序不代表成果或證據可靠度。';
  const resultKey=JSON.stringify([$('query').value,filters,$('sort').value]);
  const changedResultKey=resultKey!==resultQueryKey;
  if(changedResultKey){visibleResults=RESULT_BATCH_SIZE;resultQueryKey=resultKey;}
  $('results').replaceChildren(...resultCards(currentFiltered.slice(0,visibleResults),searchTerms,0,currentFiltered.length));
  updateResultBatch();
  // Sorting is a reading preference; keep the current discovery deck intact.
  // The deck and the facet counts must describe the same condition set the
  // results list is showing, so an expanded sentence query uses its terms too.
  syncDiscovery(rankEntries(shownMatches,searchTerms));
  $('empty').hidden = !!currentFiltered.length || !discoveryReady;
  const displayQ = abbreviatedQuery($('query').value);
  $('empty').querySelector('h3').textContent=failedPaths.length
    ?(displayQ?`已載入內容中目前沒有符合「${displayQ}」的案例`:'已載入內容中沒有符合的案例')
    :(displayQ?`目前沒有符合「${displayQ}」的案例`:'目前沒有符合的案例');
  showSearchSplitNote(possibleSplit, splitSuppressed);
  renderSearchFeedback(q, filters);
  renderFacetCounts(searchTerms, filters);
  updatePartialLoad();
  const skipNote = failedPaths.length ? `（${failedPaths.length} 個來源檔案未載入）` : '';
  $('results-count').textContent = discoveryReady ? `顯示 ${currentFiltered.length} / ${entries.length} 筆收錄${skipNote}` : initialLoading ? '正在讀取案例，完成後會套用目前條件…' : '載入未完成';
  $('filter-outcome-count').textContent = discoveryReady
    ? currentFiltered.length ? `目前條件有 ${currentFiltered.length} 筆結果` : failedPaths.length ? '已載入內容中沒有符合結果' : '目前條件沒有符合結果'
    : initialLoading ? '正在讀取案例…' : '載入未完成';
  $('filter-view-results').disabled = !discoveryReady;
  // The count above says how many cases mention these words anywhere. A full-text
  // search legitimately matches body text, so the split only appears when that tail
  // is most of the set: then the reader gets both numbers and one click to the
  // cases that describe themselves with the words. When no case holds every word in
  // its title/purpose/pain, keep the older exit: name the word that never reaches
  // there and offer the strongest single word that does.
  const purposeOf = (base, terms) => discoveryReady && terms.length
    ? filterEntries(base, terms, { ...filters, scope: 'overview' })
    : [];
  const purposeMatches = purposeOf(shownMatches, searchTerms);
  // A full-text match may be nothing but the section label every case carries
  // (`## 所需連接、權限與限制` is on 216 pages), so the reader is told how much of
  // the deck is that, and which label it is.
  const headingOnly = discoveryReady && searchTerms.length && !filters.scope
    ? headingOnlyMatches(shownMatches, searchTerms, filters)
    : [];
  const bodyOnlyCount = Math.max(0, currentFiltered.length - headingOnly.length);
  const headingLabel = headingOnly.length ? sectionLabelExample(headingOnly, searchTerms) : '';
  const matchScope = discoveryReady && searchTerms.length
    ? matchScopeNotice(purposeMatches.length, currentFiltered.length)
    : '';
  $('match-scope').hidden = !matchScope;
  $('match-scope').dataset.mode = matchScope;
  const matchScopeAction = $('match-scope-action');
  if (matchScope === 'body') {
    const purposeCount = purposeMatches.length;
    // The action re-types the words it searched, so only offer it when the typed
    // query tokenises back to the same terms; otherwise the promise and the screen
    // would describe different conditions.
    const narrowQuery = joinSearchTerms(searchTerms);
    // A partial load is not a census of the library; say so in the same sentence.
    const partial = failedPaths.length ? `（${failedPaths.length} 個來源檔案未載入，只算已載入內容）` : '';
    // "You searched for" includes the library's related words: matching in the
    // title/purpose scope still expands synonyms, so the sentence must not imply
    // that the words appear verbatim.
    // Headings are not prose: when the tail is partly section labels, name that part
    // instead of telling the reader all of it is body text.
    $('match-scope-message').textContent = `這 ${currentFiltered.length} 筆裡，${purposeCount} 筆的標題、用途或痛點提到你搜的字或相關詞；`
      + (headingOnly.length
        ? `其餘 ${currentFiltered.length - purposeCount} 筆中，${bodyOnlyCount - purposeCount} 筆在正文或頁首資料提到；另有 ${headingOnly.length} 筆要算上章節標題才符合${headingLabel ? `（例如〈${headingLabel}〉）` : ''}。${partial}`
        : `其餘 ${currentFiltered.length - purposeCount} 筆只在正文或其他欄位提到。${partial}`);
    matchScopeAction.hidden = !narrowQuery;
    matchScopeAction.textContent = narrowQuery ? `只看那 ${purposeCount} 筆` : '';
    matchScopeAction.dataset.mode = narrowQuery ? 'scope' : '';
    if (narrowQuery) matchScopeAction.dataset.query = narrowQuery; else delete matchScopeAction.dataset.query;
    delete matchScopeAction.dataset.term;
    delete matchScopeAction.dataset.resetFilters;
  } else if (matchScope === 'none') {
    // The action replaces the query, so its promise counts every entry, not just
    // the ones the current condition already kept.
    // Two counts per word: within the reader's filters (what the action can show
    // without surprising them) and library-wide (what the sentence may claim).
    const perTerm = searchTerms.map(term => ({
      term,
      scoped: purposeOf(entries, [term]).length,
      library: filterEntries(entries, [term], { scope: 'overview' }).length
    }));
    const unseen = perTerm.filter(row => row.library === 0).map(row => `「${row.term}」`);
    const scopedBest = perTerm.slice().sort((a, b) => b.scoped - a.scoped)[0];
    const libraryBest = perTerm.slice().sort((a, b) => b.library - a.library)[0];
    // Filters can exclude every word's cases; falling back to the library-wide
    // word keeps an exit, and the label then says the filters will be cleared.
    const resetFilters = !scopedBest || scopedBest.scoped === 0;
    const best = resetFilters ? libraryBest : scopedBest;
    const label = searchTerms.map(term => `「${term}」`).join('');
    // The listed cases matched somewhere in the full text; some of those matches
    // are synonyms of the word the reader typed, so do not call them literal.
    $('match-scope-message').textContent = `在所選條件下，沒有案例的標題、用途或痛點同時包含${label}`
      + (unseen.length ? `；${unseen.join('、')}沒有出現在任何案例的標題、用途或痛點` : '')
      + (headingOnly.length === currentFiltered.length
        ? `。下列 ${currentFiltered.length} 筆都要算上章節標題才符合${headingLabel ? `（例如〈${headingLabel}〉）` : ''}，正文未必提到，不代表案例在做這件事。`
        : `。下列 ${currentFiltered.length} 筆是全文或同義詞命中，不代表案例在做這件事。`
          + (headingOnly.length
            ? `其中 ${headingOnly.length} 筆要算上章節標題才符合${headingLabel ? `（例如〈${headingLabel}〉）` : ''}，正文未必提到。`
            : ''))
      + (failedPaths.length ? `（${failedPaths.length} 個來源檔案未載入，只算已載入內容）` : '');
    const count = best ? (resetFilters ? best.library : best.scoped) : 0;
    matchScopeAction.hidden = !count;
    matchScopeAction.dataset.mode = count ? 'term' : '';
    delete matchScopeAction.dataset.query;
    if (!matchScopeAction.hidden) {
      matchScopeAction.textContent = resetFilters
        ? `改搜「${best.term}」→ ${count} 筆（清除目前篩選）`
        : `改搜「${best.term}」→ ${count} 筆（標題、用途與痛點）`;
      matchScopeAction.dataset.term = best.term;
      matchScopeAction.dataset.resetFilters = resetFilters ? 'true' : 'false';
    } else {
      delete matchScopeAction.dataset.term;
      delete matchScopeAction.dataset.resetFilters;
    }
  } else {
    // Leaving an old promise on a hidden control is how the batch button once kept
    // "再看 -19 筆": clear the label with the state, not just the visibility.
    $('match-scope-message').textContent = '';
    matchScopeAction.textContent = '';
    matchScopeAction.hidden = true;
    matchScopeAction.dataset.mode = '';
    delete matchScopeAction.dataset.term;
    delete matchScopeAction.dataset.resetFilters;
    delete matchScopeAction.dataset.query;
  }

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
    if(filters.scope)url.searchParams.set('scope',filters.scope);else url.searchParams.delete('scope');
    if(reviewSort($('sort').value))url.searchParams.set('sort','reviewed');else url.searchParams.delete('sort');
    if(discoveryReady && url.search!==location.search)facetDraftDirty=true;
    const state={...history.state};
    if(changedResultKey && (queryDirty||facetDraftDirty))state.draftResultBatch={key:resultQueryKey,count:visibleResults};
    history.replaceState(state, '', url);
  }
  syncPageContext();
}
function reset() {
  activeScenario = '';
  $('sort').value='';
  $('search-scope').value='';
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
// `catalog.json` and `corpus.json` are separate files, so Pages can expose them
// from different builds for a few seconds around a deploy: a visitor then reads a
// catalogue from build N and a corpus from build N+1. Both ids are `site.time`
// stamps, so the newer one still names exactly the collection the catalogue just
// listed; discarding it would throw away ~1.3 MB and request every source again.
// An older corpus can be missing a source the catalogue already knows, so it
// falls back, as does any pair whose order cannot be compared.
function bundleRevisionAtLeast(bundleRevision, catalogRevision) {
  if (typeof bundleRevision !== 'string' || !bundleRevision) return false;
  if (bundleRevision === catalogRevision) return true;
  // `catalog.json` and `corpus.json` both emit site.time as
  // %Y%m%d%H%M%S%N (23 digits). Anything else has no known order, so it keeps
  // the strict equality contract instead of being compared as a number.
  const stamp = /^\d{23}$/;
  return stamp.test(bundleRevision) && stamp.test(catalogRevision) && bundleRevision > catalogRevision;
}
// The bundle is only a transport: every original Markdown still goes through
// parseFile. An older/mixed deployment or a failed bundle uses the per-file path.
function parseCorpusBundle(bundle, paths, revision, parseFn) {
  if(bundle?.version!==1 || !bundleRevisionAtLeast(bundle.revision, revision) || !Array.isArray(bundle.sources) || bundle.sources.length!==paths.length)throw Error('全文整包版本不符');
  const allowed=new Set(paths),seen=new Set();
  const parsed=new Map();
  for(const source of bundle.sources){
    if(!allowed.has(source?.path)||seen.has(source.path)||typeof source.markdown!=='string')throw Error('全文整包來源不符');
    seen.add(source.path);
    parsed.set(source.path,parseFn(source.path,source.markdown));
  }
  return parsed;
}
// Cache Storage has no AbortSignal; bound its reads without delaying the
// network bundle or the existing whole-load cancellation.
function boundedCacheRead(operation,signal,deadline) {
  if(signal.aborted||Date.now()>=deadline)return Promise.reject(Error('快取讀取已停止'));
  let timer,stop;
  const cancelled=new Promise((_,reject)=>{
    stop=()=>reject(Error('快取讀取已停止'));
    signal.addEventListener('abort',stop,{once:true});
    timer=setTimeout(stop,Math.min(100,Math.max(1,deadline-Date.now())));
  });
  return Promise.race([operation,cancelled]).finally(()=>{
    clearTimeout(timer);
    signal.removeEventListener('abort',stop);
  });
}
async function persistCorpus(cache,key,response) {
  try {
    await cache.put(key,response.clone());
  } catch(error) {
    // A previous version may fill the quota. Reclaim it and try once more.
    const old=(await cache.keys()).filter(request=>request.url!==new URL(key,location.href).href);
    await Promise.all(old.map(request=>cache.delete(request)));
    await cache.put(key,response.clone());
  }
  // Cache keys are insertion ordered. Retain the two newest revisions so
  // concurrent tabs cannot prune each other's just-published entry.
  const keys=await cache.keys();
  await Promise.all(keys.slice(0,-2).map(request=>cache.delete(request)));
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
    // The bundle is one request for every source; abandoning it re-downloads
    // each source separately at several times the bytes. Guard only against a
    // bundle that never answers, then judge a live download from its measured
    // rate instead of a fixed clock.
    let bundleTimer=setTimeout(abortBundle,Math.min(options.bundleTimeout||5000,Math.max(1,deadline-Date.now())));
    const bundleStall=options.bundleStall||4000,bundleParseReserve=options.bundleParseReserve||1500,bundleStartedAt=Date.now();
    const armBundleTimer=ms=>{clearTimeout(bundleTimer);bundleTimer=setTimeout(abortBundle,Math.max(1,ms));};
    const bundleFits=(received,total,elapsed)=>{
      if(!received||elapsed<=0)return true;
      // A single early chunk measures TCP slow start more than the transfer;
      // hold the decision until 400 ms or 32 KiB of evidence exists.
      if(elapsed<400&&received<32768)return true;
      // With no declared size there is nothing to project against, so keep the
      // original first-response guard instead of holding the whole window.
      if(!total)return Date.now()<bundleStartedAt+Math.min(options.bundleTimeout||5000,Math.max(1,deadline-bundleStartedAt));
      return Date.now()+(total-received)/(received/elapsed)+bundleParseReserve<deadline;
    };
    const requestedRatio=Number(options.encodingRatio);
    const encodingRatio=requestedRatio>1?Math.min(8,requestedRatio):1;
    let bundled=false;
    const cacheKey='corpus.json?bundleRevision='+encodeURIComponent(options.bundleRevision)+'&sourceRevision='+encodeURIComponent(options.sourceRevision||'');
    let cache;
    try { if(typeof caches!=='undefined')cache=await boundedCacheRead(caches.open('ai-agent-use-cases-corpus-v1'),bundleController.signal,deadline); }
    catch(error) { console.warn('全文快取不可用，改用網路讀取：',error); }
    try {
      let response,parsed,data;
      if(cache) {
        try {
          response=await boundedCacheRead(cache.match(cacheKey),bundleController.signal,deadline);
          if(response) {
            data=await boundedCacheRead(response.json(),bundleController.signal,deadline);
            if(data.sourceRevision!==options.sourceRevision)throw Error('全文快取來源版本不符');
            parsed=parseCorpusBundle(data,paths,options.bundleRevision,parseFn);
          }
        } catch(error) {
          console.warn('全文快取無法使用，改用網路讀取：',error);
          response=null;parsed=null;
          cache.delete(cacheKey).catch(()=>{});
        }
      }
      if(!parsed) {
        response=await fetchFn('corpus.json',{cache:'no-cache',signal:bundleController.signal});
        if(!response.ok)throw Error('HTTP '+response.status);
        let copy=null;
        if(response.body&&typeof response.body.getReader==='function'){
          const reader=response.body.getReader(),chunks=[],started=Date.now();
          // fetch() yields the decoded body while content-length counts compressed
          // bytes, so translate the declared size with the catalogue's same-server
          // compression ratio before comparing it with received bytes.
          const encoded=Number(response.headers?.get?.('content-length'))||0;
          const total=encoded?Math.round(encoded*encodingRatio):0;
          let received=0;
          for(;;){
            const {done,value}=await reader.read();
            if(done)break;
            if(!value?.byteLength)continue;
            chunks.push(value);received+=value.byteLength;
            // A measured rate that cannot finish before the whole-load deadline
            // is a reason to switch to per-source reads now, not to wait it out.
            if(!bundleFits(received,total,Date.now()-started)){abortBundle();break;}
            armBundleTimer(bundleStall);
          }
          if(bundleController.signal.aborted)throw Error('全文整包讀取已停止');
          // The response is complete; decoding and parsing must not be cut by
          // the in-flight stall guard.
          clearTimeout(bundleTimer);
          const text=await new Response(new Blob(chunks)).text();
          data=JSON.parse(text);
          copy=cache?new Response(text):null;
        }else{
          copy=cache&&response.clone?response.clone():null;
          data=await response.json();
        }
        if(bundleController.signal.aborted)throw Error('全文整包讀取已停止');
        parsed=parseCorpusBundle(data,paths,options.bundleRevision,parseFn);
        if(copy&&data.sourceRevision&&data.sourceRevision===options.sourceRevision) {
          // Persistence is best-effort and must not delay a readable result.
          persistCorpus(cache,cacheKey,copy).catch(error=>console.warn('全文快取寫入或整理失敗：',error));
        }
      }
      if(bundleController.signal.aborted)throw Error('全文整包讀取已停止');
      if(data.sourceRevision) {
        // The corpus is self-describing: its markdown was generated from the
        // build it names, so a corpus accepted from a newer publish must pin to
        // that build, not to the catalogue's older one.
        const verified=[...parsed.keys()].filter(path=>{
          const early=successful.get(path),bundled=parsed.get(path);
          return !early || (early.length===bundled.length && early.every((item,i)=>typeof item.markdown==='string' && item.markdown===bundled[i].markdown));
        });
        pinSourcePaths(verified,data.sourceRevision);
        for(const path of verified)if(successful.has(path))refreshCurrentSourceLinks(path);
      }
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
      await loadCorpus(pending,{...perFileOptions,signal:controller.signal,budget:Math.max(1,deadline-Date.now()),onSource:(items,path)=>{pinnedSources.delete(path);remember(path,items);},onProgress:status=>{completedFallback=status.completed;progress();}});
    }
    await shared;
    options.onProgress?.({completed:paths.length,succeeded:successful.size,entryCount:[...successful.values()].reduce((n,items)=>n+items.length,0),total:paths.length});
    return {entries:paths.flatMap(path=>successful.get(path)||[]),failed:paths.filter(path=>!successful.has(path))};
  }finally{clearTimeout(timer);abort();options.signal?.removeEventListener('abort',abort);}
}

async function readJSON(path, timeout, meta) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try {
    const response=await fetch(path,{cache:'no-cache',signal:controller.signal});
    if (!response.ok) throw Error('HTTP '+response.status);
    const data=await response.json();
    if(meta){
      // Browsers hand the decoded body to fetch while content-length counts the
      // compressed bytes; the catalogue gives a same-server ratio to translate.
      meta.encoded=Number(response.headers?.get?.('content-length'))||0;
      meta.decoded=JSON.stringify(data).length;
    }
    return data;
  } finally { clearTimeout(timer); }
}

function mergeCorpus(current, recovered) {
  const paths=new Set(recovered.map(item=>item.path));
  return [...current.filter(item=>!paths.has(item.path)),...recovered].sort((a,b)=>
    ({case:0,evidence:1,pending:2}[a.kind]-{case:0,evidence:1,pending:2}[b.kind])||a.id.localeCompare(b.id));
}
function refreshCorpusMetadata() {
  const counts=catalogCounts(entries);
  $('case-count').textContent=counts.case;
  $('evidence-count').textContent=counts.evidence;
  $('pending-count').textContent=counts.pending;
  const pendingNote=$('pending-note');
  if(pendingNote){
    pendingNote.hidden=!counts.resolvedPending;
    const tally=resolvedPendingTally(entries);
    pendingNote.textContent=!tally.resolved?'' : tally.unrecorded
      ? `另有 ${tally.resolved} 個待查線索已處理（${tally.merged} 筆已併入案例、${tally.unrecorded} 筆未記錄去向），不列在上述待查數；仍可搜尋或直接開啟。`
      : `另有 ${tally.resolved} 個待查線索已處理並併入案例，不列在上述待查數；仍可搜尋或直接開啟。`;
  }
  $('catalog-status').hidden=!failedPaths.length;
  $('catalog-status').textContent=failedPaths.length?'僅計已載入條目；'+failedPaths.length+' 個來源檔案未載入。':'';
  // A page without a declared theme has an empty category; an empty option would
  // be indistinguishable from the 全部分類 option, so it is left out.
  for(const [id,values] of [['tool',entries.flatMap(e=>e.tools)],['category',entries.map(e=>e.category).filter(Boolean)],['proof',entries.map(e=>e.proof)]]){
    const selected=$(id).value;
    populate(id,selected?[...values.filter(value=>value!==selected),selected]:values);
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
  let recoveryFocusTarget=null;
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
    // A cosmetic directory label must never turn a successful recovery into a
    // failure: keep its own errors out of the recovery outcome.
    try { annotateTaskCoverage(); } catch (error) { console.warn('task coverage marker skipped', error); }
    updateModalNav();
    if(recoveryControlFocused){
      recoveryFocusTarget=failedPaths.length?$('retry-failed'):$('results-count');
      recoveryFocusTarget.focus({preventScroll:true});
    }else restoreFocus();
    refreshRelated();
    refreshMergedDestination();
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
    if(document.activeElement===recoveryFocusTarget)
      recoveryFocusTarget.scrollIntoView({block:failedPaths.length?'center':'nearest',inline:'nearest',behavior:'instant'});
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
  discoveryReady=false;discoveryKey='';$('guide-options').disabled=true;$('draw-case').disabled=true;$('drawn-case').setAttribute('aria-busy','true');drawStatusSuffix=null;drawStatusMode='other';$('draw-status').textContent='正在準備案例卡…';$('drawn-case').replaceChildren();
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
    $('search-scope').value=searchScope(initialParams.get('scope'));
    ['query','kind','difficulty','tool','category','proof'].forEach(id=>{
      const value=initialParams.get(id==='query'?'q':id)||'';
      if(value&&['difficulty','tool','category','proof'].includes(id)&&$(id)&&![...$(id).options].some(o=>o.value===value)){
        const option=el('option','',value);option.value=value;$(id).append(option);
      }
      if($(id)) $(id).value=value;
    });
    const hasQuery=tokenize($('query').value).length>0;
    $('search-scope').disabled=!hasQuery;
    $('search-scope').closest('.search-scope').hidden=!hasQuery;
    syncPageContext();
    const catalogMeta={};
    const catalog = await readJSON('catalog.json', Math.min(8000,remaining()), catalogMeta);
    if (!Array.isArray(catalog.files) || !catalog.files.length) throw Error('索引沒有案例。');
    pinnedSources.clear();
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
      encodingRatio:catalogMeta.encoded>0&&catalogMeta.decoded>0?catalogMeta.decoded/catalogMeta.encoded:1,
      sourceRevision:catalog.sourceRevision,
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
          drawStatusSuffix=null;drawStatusMode='other';$('draw-status').textContent=stages[milestone]+' 等待過久會先顯示已讀取內容。';
          announceDraw(stages[milestone],'milestone:'+milestone);
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
    $('search-scope').value=searchScope(params.get('scope'));
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
    try { annotateTaskCoverage(); } catch (error) { console.warn('task coverage marker skipped', error); }
    const current = matchCase(params.get('case'));
    if ($('detail').open && currentDetailItem?.id===current?.id) {
      // Keep the exact research DOM, reading position and focused control.
      updateModalNav();
      refreshRelated();
      refreshMergedDestination();
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
    discoveryReady=false;$('drawn-case').setAttribute('aria-busy','false');drawStatusSuffix=null;drawStatusMode='other';$('draw-status').textContent='案例卡暫時無法載入，請到下方重新載入或閱讀案例索引。';announceDraw('案例卡暫時無法載入；下方可重新載入或閱讀案例索引。','failure');$('drawn-case').replaceChildren();$('draw-case').disabled=true;$('guide-options').disabled=true;
    $('results').replaceChildren();
    $('results-count').textContent = '載入未完成';
    $('filter-outcome-count').textContent = '載入未完成，請到結果區重新載入';
    $('filter-view-results').disabled = false;
    $('error-message').textContent = '請稍後重試，或先閱讀案例索引。';
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
function drawScope(){
  const diffLabel=$('difficulty')?.value?($('difficulty').value==='入門對話'?'免寫程式':$('difficulty').value==='工具串接'?'需帳號外掛':'需代碼環境'):'';
  return ($('scenario').value||'全部情境')+(diffLabel?' · '+diffLabel:'');
}
function drawButtonLabel(total){$('draw-case').textContent=total===1?'只有這一張，重新看看':'再抽一張 ↻';}
// #draw-status is a visible, high-frequency line: the pool count changes on every
// keystroke. Announcements therefore go through a separate live region, which only
// speaks when the drawn case itself changes. Otherwise a screen reader would read
// the pool count (and the same case again) for every character typed in the search.
// The key, not the text, decides whether this is news: an empty state that is left
// and entered again has to be announced twice.
function announceDraw(text,key=text){
  const node=$('draw-announcer');
  if(!node||key===announcedDrawKey)return;
  announcedDrawKey=key;
  node.textContent=text;
}
function drawNext(announce=false){
  if(!discoveryReady||!discoveryDeck)return;
  const next=discoveryDeck.next();
  if(!next)return;
  const previous=drawnItemId;
  $('drawn-case').replaceChildren(card(next.item));
  drawnItemId=next.item.id;
  writeDrawStatus(next.total,(next.round>1?'已重新洗牌 · ':'')+'第 '+next.position+' 張：'+next.item.title);
  drawButtonLabel(next.total);
  // Only the reader's own request is news. An automatic redraw happens while the
  // reader is typing a query; announcing it would interrupt the search itself.
  if(announce&&previous!==drawnItemId)announceDraw('已換一張：'+next.item.title,'card:'+next.item.id);
}
// The draw pool is smaller than the result list: evidence notes, open leads,
// templates and duplicate ids never become cards. The line has to say which
// number it is, otherwise the same condition shows two different totals.
function drawPoolStatus(total){
  const matched=Number.isFinite(drawPoolMatches)&&drawPoolMatches>total ? drawPoolMatches : 0;
  return drawScope()+' · 這組條件有 '+total+' 張可抽案例卡'+(matched?'（另有 '+(matched-total)+' 筆不是可抽案例，仍列在結果）':'');
}
// The line prints two numbers from different sets, so it is rebuilt from its parts
// whenever either side moves; `drawStatusSuffix` is the part after the counts.
function writeDrawStatus(total,suffix){
  drawPoolTotal=total;drawStatusSuffix=suffix;drawStatusPrefix=drawPoolStatus(total);drawStatusMode='count';
  $('draw-status').textContent=drawStatusPrefix+' · '+suffix;
}
// A filter can change how many entries match without changing which of them are
// drawable (an evidence note or open lead is in the results but never in a card).
// The deck key then stays the same while the printed total goes stale.
// The empty-pool branch prints the match count too, so it is rebuilt from the
// same source: an entry that is not drawable can enter or leave without changing
// the (always empty) deck key.
function emptyPoolText(){
  const scope=$('scenario').value||'全部情境';
  const diffText=$('difficulty')?.value?`在「${$('difficulty').value}」門檻下`:'這組條件';
  return drawPoolMatches
    ? {card:`符合的 ${drawPoolMatches} 筆沒有可抽卡的用法靈感（經驗與踩坑、模板或待查線索不列入抽卡）；可在下方結果直接閱讀。`,
       status:`${scope}：符合的 ${drawPoolMatches} 筆沒有可抽卡的用法靈感。`}
    : {card:`${diffText}目前沒有可抽的案例卡。抽卡也受下方搜尋與篩選影響；試試修改搜尋字詞或調整篩選。`,
       status:`${scope}${$('difficulty')?.value?' · '+$('difficulty').value:''} 目前沒有可抽的案例卡。`};
}
function writeEmptyPoolStatus(){
  const {card,status}=emptyPoolText();
  const holder=$('drawn-case');
  const text=holder.textContent||'';
  if(text!==card)holder.replaceChildren(el('p','draw-placeholder',card));
  if($('draw-status').textContent!==status)$('draw-status').textContent=status;
}
function refreshDrawCount(){
  if(drawStatusMode==='empty'){writeEmptyPoolStatus();return;}
  if(drawStatusMode!=='count')return;
  const prefix=drawPoolStatus(drawPoolTotal);
  const node=$('draw-status');
  if(prefix===drawStatusPrefix)return;
  // Only repair a line this code wrote: loading, failure and empty-pool messages
  // own the line themselves and must not be overwritten.
  if(!node.textContent.startsWith(drawStatusPrefix))return;
  node.textContent=prefix+' · '+drawStatusSuffix;
  drawStatusPrefix=prefix;
}
function syncDiscovery(filtered){
  document.querySelectorAll('button[data-scenario]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scenario===$('scenario').value)));
  document.querySelectorAll('button[data-difficulty]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.difficulty===($('difficulty')?.value||''))));
  drawPoolMatches=filtered.length;
  if(!discoveryReady)return;
  const pool=Discovery.discoveryPool(filtered);
  const key=$('scenario').value+'|'+($('difficulty')?.value||'')+'|'+pool.map(item=>item.id).join(',');
  if(key===discoveryKey){refreshDrawCount();return;}
  // Remember the key that produced the current deck, so a re-render with the same
  // pool (sort changes, unrelated refreshes) stops rebuilding it.
  discoveryKey=key;
  // A pool change with the same query came from a facet the reader just touched;
  // that replacement is news. Typing changes the query, so keep those redraws quiet.
  const query=$('query')?.value||'';
  const announceReplacement=drawPoolQuery!==null&&query===drawPoolQuery;
  drawPoolQuery=query;
  // Typing a question changes the pool on every keystroke. Replacing the drawn
  // card then reflows everything above the search field, which pushes the results
  // off a phone screen; keep a card that still matches and only redraw when it no
  // longer qualifies (or when the reader asks for another card). The deck is
  // seeded with that card so「再抽一張」still returns a different case.
  const kept=pool.find(item=>item.id===drawnItemId);
  discoveryDeck=Discovery.createDeck(pool,Math.random,kept?kept.id:null);
  $('draw-case').disabled=!pool.length;
  if(pool.length&&kept){
    writeDrawStatus(pool.length,'目前顯示：'+kept.title);
    drawButtonLabel(pool.length);
  }else if(pool.length)drawNext(announceReplacement);
  else{
    // Results that are all evidence notes, templates or open leads are readable
    // but not drawable; saying "no case cards" without the reason reads as an
    // empty search next to a non-empty result list.
    drawnItemId='';
    drawStatusSuffix=null;
    drawStatusMode='empty';
    writeEmptyPoolStatus();
    $('draw-case').textContent='沒有可抽的案例';
    announceDraw('目前沒有可抽的案例卡；下方搜尋結果仍可閱讀。','empty');
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
function drawFromButton(){
  // Re-drawing must not move the page: on phones the stage is taller than the
  // viewport, so revealDiscovery() would scroll back to the stage top on every
  // tap. Keep the tapped button at the same viewport offset instead, so the new
  // card starts right below it, and only scroll down if its title is cut off.
  const button=$('draw-case'),before=button.getBoundingClientRect().top;
  if(!discoveryReady||before<0||before>window.innerHeight){drawNext(true);revealDiscovery();return;}
  drawNext(true);
  const shift=button.getBoundingClientRect().top-before;
  if(Math.abs(shift)>0.5)window.scrollBy({top:shift,behavior:'instant'});
  const target=$('drawn-case').querySelector('h3 button')||$('draw-status');
  if(target===$('draw-status'))target.tabIndex=-1;
  const rect=target.getBoundingClientRect(),limit=window.innerHeight-16;
  if(rect.bottom>limit)window.scrollBy({top:Math.max(0,Math.min(rect.bottom-limit,rect.top-16)),behavior:'instant'});
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
for(const [type,description] of Object.entries(PROOF_DEFINITIONS)){
  const definition=el('div');
  definition.append(el('dt','',type),el('dd','',description),
    el('dd','proof-legend-claimant','成果主張來源：'+(PROOF_CLAIMANTS[type]||'原文作者')));
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
// The skip link has to land *in* the search field, not just near it: focusing the
// input lets a keyboard reader type immediately. Without JavaScript the plain
// #query anchor still scrolls to the same place.
document.querySelector('.skip')?.addEventListener('click',event=>{
  const input=$('query');
  if(!input)return;
  event.preventDefault();
  input.focus();
});
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
// One click back to the words the scenario handoff cleared. render() rewrites the
// URL from the restored fields, so the address bar and the results agree again.
$('scenario-reset-action').addEventListener('click',()=>{
  const reset=scenarioReset;
  if(!reset)return;
  $('query').value=reset.query;
  ['kind','difficulty','tool','category','proof'].forEach(id=>{if($(id))$(id).value=reset.filters[id]||'';});
  activeScenario=reset.scenario;
  $('search-scope').value=reset.scope;
  $('sort').value=reset.sort;
  scenarioReset=null;
  render();
  $('scenario-reset').hidden=true;
  history.replaceState(history.state,'',reset.url);
  $('results-count').focus({preventScroll:true});
  $('results-count').scrollIntoView({block:'start',behavior:'instant'});
});
// Choose the initial disclosure state once; typing, navigation and resizing
// preserve the reader's choice and never hide a currently focused control.
// Wide screens start open, then the first settled render compacts the panel when
// the result line would still be off screen (compactFiltersForResults).
$('filter-options').open = !window.matchMedia('(max-width:760px)').matches;
// On small screens the 53-task directory otherwise pushes the value panel and
// case cards more than a screen down. Keep every link, but show nine first and
// let the reader open the rest; wide screens always show the full directory.
(() => {
  const nav=$('hero-problem-tags'),toggle=$('problem-tags-toggle');
  if(!nav||!toggle)return;
  const links=[...nav.querySelectorAll('a.problem-tag')];
  const visibleCount=9;
  const narrow=()=>window.matchMedia('(max-width:760px)').matches;
  let mobileInitialized=false;
  const render=()=>{
    if(!narrow()){
      if(document.activeElement===toggle&&links[0])links[0].focus({preventScroll:true});
      nav.removeAttribute('data-collapsed');
      toggle.hidden=true;
      toggle.setAttribute('aria-expanded','true');
      mobileInitialized=false;
      return;
    }
    if(!mobileInitialized){
      toggle.hidden=false;
      if(links.slice(visibleCount).includes(document.activeElement))toggle.focus({preventScroll:true});
      nav.setAttribute('data-collapsed','true');
      mobileInitialized=true;
    }
    const expanded=nav.getAttribute('data-collapsed')!=='true';
    toggle.setAttribute('aria-expanded',String(expanded));
    toggle.textContent=expanded?`收合任務清單（先顯示 ${visibleCount} 項）`:`顯示全部 ${links.length} 個任務`;
  };
  toggle.addEventListener('click',()=>{
    if(nav.getAttribute('data-collapsed')==='true')nav.removeAttribute('data-collapsed');
    else nav.setAttribute('data-collapsed','true');
    render();
  });
  window.addEventListener('resize',render,{passive:true});
  render();
})();
$('draw-case').addEventListener('click',drawFromButton);
document.querySelectorAll('#guide-options [data-scenario]').forEach(button=>button.addEventListener('click',()=>chooseScenarioFromHero(button.dataset.scenario)));
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
$('query').addEventListener('input', () => {queryDirty=true;render();});
$('search-scope').addEventListener('change',()=>render());
// Two exits from a body-only match set. Narrowing reuses the reader's own query
// and filters in the title/purpose scope, so the promise beside the button is the
// count that appears. Replacing the query with one word the corpus can answer
// keeps that same scope, as before. Focus moves to the result summary because
// both actions hide the control that was just pressed.
$('match-scope-action').addEventListener('click',event=>{
  const button=event.currentTarget;
  if(button.dataset.mode==='scope'){
    // The button carries the exact words it searched (verified to tokenise back to
    // themselves), so narrowing applies the same condition the promise described.
    // A split sentence therefore replaces the field with those words.
    const narrowQuery=button.dataset.query;
    if(!narrowQuery)return;
    // Only rewrite the field when the typed words do not already tokenise to the
    // same terms; a plain multi-word query keeps exactly what the reader typed.
    const typed=$('query').value;
    if(!sameSearchTerms(tokenize(typed),tokenize(narrowQuery))){
      $('query').value=narrowQuery;
      queryDirty=true;
    }
    $('search-scope').value='overview';
    render();
    $('results-count').focus({preventScroll:true});
    return;
  }
  const term=button.dataset.term;
  if(!term)return;
  const input=$('query');
  const clearFilters=button.dataset.resetFilters==='true';
  input.value=term;
  queryDirty=true;
  if(clearFilters){
    ['scenario','kind','difficulty','tool','category','proof','sort'].forEach(id=>{if($(id))$(id).value='';});
    activeScenario='';
  }
  $('search-scope').value='overview';
  render();
  input.focus({preventScroll:true});
});
$('sort').addEventListener('change', () => render());
$('reset-sort').addEventListener('click', resetSort);
$('recent-entry').addEventListener('click', event => {
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  history.replaceState(null,'',event.currentTarget.href);
  activeScenario='';
  $('search-scope').value='';
  ['query','kind','difficulty','tool','category','proof'].forEach(id => { if($(id)) $(id).value = ''; });
  $('sort').value='reviewed';render();committedSearchURL=location.href;queryDirty=false;facetDraftDirty=false;enterSearch(event);
});
['kind', 'difficulty', 'tool', 'category', 'proof'].forEach(id => $(id)?.addEventListener('change', () => render()));
$('filter-view-results').addEventListener('click', focusResults);
$('load-more-results').addEventListener('click',showMoreResults);
$('reset').addEventListener('click', reset);
$('empty-reset').addEventListener('click', () => { reset(); focusResults(); });
$('clear-facets').addEventListener('click', clearFacets);
// The visitor decides whether the phrase may be read as adjacent library terms.
$('search-split-exact').addEventListener('click',()=>{
  const note=$('search-split');
  splitSuppressedFor=note.dataset.mode==='suppressed' ? '' : $('query').value.trim();
  render();
  focusResults();
});
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
    // Like task searches, show the outcome without a delayed loading-time jump.
    if (discoveryReady) focusLoadedResults('start');
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
    if(e.key==='Tab'&&e.shiftKey&&document.activeElement===$('copy-case-link')){
      const dialog=$('detail'),controls=[...$('detail-body').querySelectorAll('button:not([disabled]),a[href],summary,input:not([hidden])')];
      const previous=controls[controls.indexOf(document.activeElement)-1];
      if(previous){
        e.preventDefault();
        previous.focus({preventScroll:true});
        dialog.scrollTop+=previous.getBoundingClientRect().top-dialog.querySelector('.detail-toolbar').getBoundingClientRect().bottom-12;
        return;
      }
    }
    // WebKit may move backward from the first body control to the dialog
    // instead of the last toolbar control. Follow the rendered order, including
    // controls introduced inside the overview by the reader enhancement.
    if (e.key === 'Tab' && e.shiftKey &&
        document.activeElement === $('detail-body').querySelector('button:not([disabled]),a[href],summary,input:not([hidden])')) {
      e.preventDefault();
      $('close-detail').focus();
      return;
    }
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
  const spent=spentDetailStop;
  spentDetailStop=null;
  // The close rewrote the case entry into the list URL, so the first Back press
  // arrives at a stop that is identical to the one the reader is already on.
  // Skip that echo once: the press should move the reader, not do nothing.
  // Any later write (a wider result batch, a filter) makes the next stop a real
  // destination again, so only an untouched stop counts as the close's echo.
  if(spent&&history.length===spent.length&&liveHistoryWrites===spent.writes&&liveHistoryURL===spent.url&&location.href===spent.url){
    liveHistoryURL=location.href;liveHistoryLength=history.length;
    history.back();
    return;
  }
  liveHistoryURL=location.href;liveHistoryLength=history.length;
  const params = new URLSearchParams(location.search);
  const id = params.get('case');
  const item = matchCase(id);
  const wasOpen=$('detail').open;
  const missingHadFocus=$('missing-case')?.contains(document.activeElement);
  $('sort').value=reviewSort(params.get('sort'));
  activeScenario = params.get('scenario') || '';
  $('search-scope').value=searchScope(params.get('scope'));
  ['query', 'kind', 'difficulty', 'tool', 'category', 'proof'].forEach(key => { if($(key)) $(key).value = params.get(key === 'query' ? 'q' : key) || ''; });
  committedSearchURL=location.href;
  queryDirty=false;
  facetDraftDirty=false;
  render(false);
  const batch=event.state?.draftResultBatch?.key===resultQueryKey?event.state.draftResultBatch:event.state?.resultBatch;
  if(batch?.key===resultQueryKey && Number.isSafeInteger(batch.count) && batch.count>=RESULT_BATCH_SIZE){
    visibleResults=batch.count;
    $('results').replaceChildren(...resultCards(currentFiltered.slice(0,visibleResults),queryTerms(),0,currentFiltered.length));
    updateResultBatch();
    if(batch===event.state?.draftResultBatch){
      const {draftResultBatch:ignoredDraft,...state}=event.state;
      history.replaceState({...state,resultBatch:batch},'',location.href);
    }
  }
  if(item && event.state?.caseReturn?.area==='results')ensureVisibleResult(event.state.caseReturn.id);
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
