/* No external scripts, analytics, API tokens, or build dependencies. */
'use strict';
const REPO = 'https://github.com/RichardHan/ai-agent-use-cases/blob/main/';
const KIND = {case:'用法靈感', evidence:'經驗與踩坑', pending:'還在查證'};
const TOOL_PATTERNS = [['Grok Bot',/grok\s*bot/i],['Meta Muse',/\bmuse\b/i],['ChatGPT dots',/\bdots\b/i],['Cursor',/\bcursor\b/i],['GitHub',/\bgithub\b/i],['Notion',/\bnotion\b/i],['Facebook',/\bfacebook\b/i],['Google Drive',/google\s*drive|\bdrive\b/i],['Google Sheets',/google\s*sheets/i],['Haggle Bot',/haggle\s*bot/i]];
let entries = [], currentFiltered = [], activeScenario = '', currentDetailItem = null, lastTrigger = null, displayCopy = {}, failedPaths = [];
let allowAutomaticArrival=true, searchShareRequest=0;
let recoveringSources=false, recoveryNotice='';
let discoveryDeck=null,discoveryKey='',discoveryReady=false,lastTriggerContext=null;
const $ = id => document.getElementById(id);
const clean = text => text.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[`*_]/g,'').trim();
const norm = text => text.normalize('NFKC').toLocaleLowerCase();
const tokenize = text => norm(text || '').trim().replace(/\b(uc|p)\s*[-_：:#.]?\s*(\d+)\b/g, '$1-$2').replace(/(?:^|\s)#(\d+)\b/g, ' uc-$1').replace(/\bpull\s+requests?\b/g, ' pr ').replace(/[「」『』“”"'《》〈〉【】〔〕［］\[\]()（）?？!！~～:：·•…#。]+/g, ' ').replace(/(?:^|\s)\.+|\.+(?:\s|$)/g, ' ').split(/[\s,、，/／;；|｜+＋&＆]+/).filter(Boolean);
const SYNONYM_GROUPS = [
  ['agent', '智能體', '智能体', '代理'],
  ['每日報表', '每日報告', '日報', '晨報', 'daily'],
  ['儀錶板', '儀表板', 'dashboard'],
  ['折價券', '優惠券'],
  ['賬單', '帳單', 'bill', 'bills', 'billing'],
  ['記賬', '記帳'],
  ['登錄', '登入', 'login', 'signin'],
  ['簡報', '投影片', 'ppt', 'powerpoint'],
  ['爬蟲', '抓取', '採集', '爬取', 'scrape', 'scraping', 'crawler', 'scraper'],
  ['試算表', 'excel', 'sheets', 'spreadsheet', 'spreadsheets', 'csv'],
  ['逐字稿', '轉錄', '錄音', '聽打', 'transcription', 'transcribe', 'whisper'],
  ['資料庫', '數據庫', 'database', 'sql', '数据库'],
  ['行事曆', '日曆', 'calendar'],
  ['待辦', '代辦', 'todo', 'todos', 'todoist', 'task', 'tasks'],
  ['報帳', '核銷', '對帳', '報銷', 'reconciliation', 'reimbursement'],
  ['發票', '收據', '憑證', 'invoice', 'invoices', 'receipt', 'receipts'],
  ['debug', 'debugging', '除錯', '排錯', '修復', 'bug', '故障', '排障', 'troubleshoot', 'troubleshooting'],
  ['workflow', '工作流', '自動化', 'automation', 'automate', 'automations', '排程', '定時', 'cron', 'schedule', '排班', '流水線', 'pipeline', 'pipelines'],
  ['求職', '履歷', '面試', '招聘', '招募', 'cv', 'resume', 'job', 'hiring', 'interview'],
  ['email', '郵件', '信件', '信箱', '收件匣', '收件箱', 'inbox'],
  ['代碼', '程式碼', '程式', 'code'],
  ['ticket', '工單', '客服', 'support', '客訴', '投訴'],
  ['飯店', '旅館', '住宿', 'hotel'],
  ['多代理', 'multi-agent', '跨代理', '代理協作'],
  ['備份', 'backup', '還原', '復原', 'restore', '回滾', 'rollback'],
  ['監看', '監控', '監測', '巡檢', 'monitor'],
  ['週報', 'weekly', '每週報告', '週報表'],
  ['健康', '醫療', 'health', '健檢'],
  ['電話', '通話', 'call'],
  ['資安', '安全性', 'security', 'cybersecurity', '漏洞', 'vulnerability', 'vulnerabilities'],
  ['隱私', 'privacy'],
  ['旅遊', '旅行', 'travel'],
  ['比價', '比价', '折扣', '降價', '特價', '特賣', '促銷', '省錢'],
  ['會議', '開會', 'meeting', '會議記錄', '會議紀錄', '會議紀要', '開會紀錄', 'minutes'],
  ['提醒', '通知', 'alert', 'notification', '推播', '告警', '警報'],
  ['退款', '退貨', 'refund', 'refunds'],
  ['播客', 'podcast'],
  ['智慧家庭', '智能家居', '智能家庭', '智慧家電', 'iot', '物聯網'],
  ['ocr', '文字辨識', '圖片辨識', '光學字元辨識', '影像辨識'],
  ['翻譯', 'translate', 'translation', '翻成中文', '譯文'],
  ['摘要', '總結', 'summary', 'summarize', '重點整理'],
  ['影片', '視頻', 'video', '剪輯', '短影音', '短片'],
  ['圖片', '相片', '照片', 'image', 'photo'],
  ['筆記', 'notes', '筆記本'],
  ['推特', 'twitter', 'x'],
  ['rag', '知識庫', '知识库', '檢索', 'retrieval'],
  ['語音', '音訊', '音頻', '聲音', 'voice', 'audio'],
  ['自動回覆', '自動回信', 'auto-reply', '自動回覆買家'],
  ['測試', 'qa', 'test', 'tests', 'testing', '回歸', 'regression'],
  ['審查', '審核', 'review', 'audit'],
  ['物流', '快遞', '包裹', '運送', '配送', 'shipping', 'delivery'],
  ['社群', '社交媒體', 'sns'],
  ['發文', '貼文', '發帖', 'post'],
  ['外聯', 'outreach', '開發信', '拓客', '獲客'],
  ['客戶', '顧客', '用戶', 'client', 'customer'],
  ['記憶', 'memory', '記憶庫'],
  ['提示詞', 'prompt', '提示語', '提示'],
  ['核准', '審批', 'approval', '人工確認', '人工核准'],
  ['網購', '電商', '購物', 'ecommerce', 'shopping'],
  ['合約', '合同', 'contract', '協議', 'agreement'],
  ['薪資', '薪水', '薪酬', 'payroll', 'salary'],
  ['設備', '裝置', 'device', '硬體', 'hardware'],
  ['合規', 'compliance', '法規', '規章'],
  ['部署', 'deploy', 'deployment'],
  ['同步', 'sync', 'synchronization'],
  ['圖表', 'chart', '圖表分析', '趨勢圖'],
  ['搜尋', '搜索', 'search'],
  ['權限', '授權', 'permission', 'permissions', 'authorization', 'auth', 'access', 'privilege', 'privileges'],
  ['庫存', '存貨', 'inventory', 'stock'],
  ['報價', '估價', 'quote', 'quotation'],
  ['快取', '緩存', 'cache', 'caching'],
  ['介面', '接口', 'interface', 'api'],
  ['重試', '重跑', 'retry'],
  ['驗證', '核實', '查核', 'verify', 'verification', 'validate', 'validation'],
  ['訂閱', '訂閱制', 'subscription', 'subscriptions'],
  ['外掛', '擴充', '擴充功能', '插件', 'plugin', 'plugins', 'extension', 'extensions'],
  ['預算', '編列預算', 'budget', 'budgeting'],
  ['日誌', '日誌記錄', 'log', 'logs', 'logging'],
  ['附件', 'attachment', 'attachments'],
  ['觸發', '觸發器', 'trigger', 'triggers'],
  ['憑證', '密鑰', '金鑰', '密碼', 'credential', 'credentials', 'token', 'tokens', 'secret', 'secrets', 'password', 'passwords'],
  ['模板', '範本', '模版', 'template', 'templates'],
  ['異常', 'anomaly', 'anomalies', 'exception', 'exceptions'],
  ['webhook', 'webhooks'],
  ['行銷', '廣告', 'marketing', 'advertising', 'ads', '投放', '推廣'],
  ['採購', '招標', 'procurement', 'purchasing', 'sourcing', '供應商', 'vendor', 'vendors'],
  ['表單', '問卷', '調查', 'form', 'forms', 'survey', 'surveys', 'questionnaire'],
  ['llm', '大型語言模型', '大語言模型', '大模型', '語言模型'],
  ['比對', '對照', '核對', 'diff', 'matching'],
  ['推薦', '精選', 'recommendation', 'recommend', 'picks'],
  ['瀏覽器', 'browser', 'browsing', '網頁', 'web', 'webpage'],
  ['帳號', '帳戶', 'account', 'accounts'],
  ['報告', '報表', '研報', 'report', 'reports'],
  ['擷取', '提取', '萃取', '提煉', 'extract', 'extraction'],
  ['流程圖', '架構圖', '心智圖', '圖解', '草圖', 'flowchart', 'diagram', 'mindmap'],
  ['評估', '評測', '基準測試', 'eval', 'evals', 'evaluation', 'benchmark', 'benchmarks'],
  ['派工', '分派', '派發', '調度', '分流', 'dispatch', 'dispatcher', 'dispatching'],
  ['repo', 'repos', 'repository', 'repositories', '代碼庫', '程式庫', '儲存庫'],
  ['解析', '解碼', '剖析', 'parse', 'parser', 'parsing', 'decode', 'decoder', 'decoding'],
  ['沙盒', 'sandbox', 'sandboxes'],
  ['結構化', 'structured']
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
function idVariants(id) { const normId = id.toUpperCase(); const unhyphenated = normId.replace(/[-_]/g, ''); return normId !== unhyphenated ? `${normId} ${unhyphenated}` : normId; }
function termVariants(term) { const t = norm(term).replace(/^#/, ''); const m = t.match(/^([a-z]+)[\s-]*(\d+)$/); if (m && (m[1] === 'uc' || m[1] === 'p')) { const padded = m[2].padStart(3, '0'); return [`${m[1]}-${padded}`, `${m[1]}${padded}`]; } if (/^\d+$/.test(t)) { const padded = t.padStart(3, '0'); return [t, `uc-${padded}`, `uc${padded}`]; } return SYNONYM_MAP[t] || [t]; }
const matchCase = (target, list = entries) => { if (!target) return null; const t = norm(target).trim().replace(/^#/, ''); const m = t.match(/^(?:([a-z]+)[\s-：:#.]*)?(\d+)$/); const variants = m && (!m[1] || m[1] === 'uc' || m[1] === 'p') ? [`${m[1] || 'uc'}-${m[2].padStart(3, '0')}`, `${m[1] || 'uc'}${m[2].padStart(3, '0')}`] : termVariants(t); return list.find(e => { const eid = norm(e.id); const eidRaw = norm(e.id.replace(/[-_]/g, '')); return variants.includes(eid) || variants.includes(eidRaw); }) || null; };
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
  const date = clean(lead.match(/^-\s*(?:查證日期|查閱日期|核對日期|研究核對日|首次收錄[／、]最近查證|查證)\s*[：:]\s*.*?(20\d{2}-\d{2}-\d{2})/m)?.[1] || lead.match(/20\d{2}-\d{2}-\d{2}/)?.[0] || '');
  const copy=displayCopy[id]||{};
  const displayTitle=clean(lead.match(/^-\s*網站標題\s*[：:]\s*(.+)$/m)?.[1]||copy.title||heading);
  const what=clean(lead.match(/^-\s*一句話用途\s*[：:]\s*(.+)$/m)?.[1]||copy.what||summary);
  return {id,title:displayTitle,originalTitle:heading,what,how:copy.how||'先閱讀原始報告與限制，再用小範圍、去敏資料設計自己的測試。',caution:copy.caution||'本庫尚未獨立重現；先確認權限與驗收方式，不把案例報告當成成效保證。',markdown,path,kind,category,scenario,tags,summary:what,proof,tools,date,search:norm(markdown+' '+displayTitle+' '+what+' '+tools.join(' ')+' '+category+' '+scenario+' '+tags.join(' ')+' '+KIND[kind]+' '+idVariants(id))};
}
function parseFile(path, markdown) {
  if (path === 'sources/pending.md') return markdown.split(/(?=^##\s+P-)/m).filter(part=>/^##\s+P-/.test(part)).map((part,i)=>metadata(part,path,'pending',String(i)));
  return [metadata(markdown,path,path.startsWith('evidence/')?'evidence':'case')];
}
function el(tag,cls,text) { const node=document.createElement(tag); if(cls)node.className=cls; if(text!==undefined)node.textContent=text;return node; }
function safeLink(target,path) {
  try { const url = new URL(target, REPO+path); return ['https:','http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
function inline(node,text,path) {
  // All source text is inserted as text nodes; source HTML can never execute.
  const regex=/\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s<>]+|`([^`]+)`/g; let last=0,match;
  while((match=regex.exec(text))) {
    node.append(document.createTextNode(text.slice(last,match.index)));
    if(match[3]) node.append(el('code','',match[3]));
    else { const target=match[2]||match[0]; const href=safeLink(target,path); const label=match[1]||target;
      if(href){const a=el('a','',label);a.href=href;a.target='_blank';a.rel='noopener noreferrer';node.append(a);}else node.append(document.createTextNode(label)); }
    last=regex.lastIndex;
  }
  node.append(document.createTextNode(text.slice(last)));
}
function renderMarkdown(markdown,path) {
  const out=el('div','markdown'); let paragraph=[],list=null,code=null;
  const flush=()=>{if(paragraph.length){const p=el('p');inline(p,paragraph.join(' '),path);out.append(p);paragraph=[];}list=null;};
  for(const line of markdown.split('\n').slice(1)) {
    if(/^```/.test(line)){flush();if(code){out.append(code);code=null;}else code=el('pre');continue;}
    if(code){code.textContent+=line+'\n';continue;}
    if(!line.trim()){flush();continue;}
    const head=line.match(/^(#{2,6})\s+(.+)/),item=line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)/);
    if(head){flush();const h=el(head[1].length===2?'h2':'h3');inline(h,head[2],path);out.append(h);}
    else if(item){if(paragraph.length)flush();const type=/^\s*\d+\./.test(line)?'ol':'ul';if(!list||list.tagName.toLowerCase()!==type){list=el(type);out.append(list);}const li=el('li');inline(li,item[1],path);list.append(li);}
    else if(/^>\s?/.test(line)){flush();const quote=el('blockquote');inline(quote,line.replace(/^>\s?/,''),path);out.append(quote);}
    else {if(list)flush();paragraph.push(line);}
  }
  flush();if(code)out.append(code);return out;
}
function updateModalNav() {
  const prevBtn = $('nav-prev-case'), nextBtn = $('nav-next-case');
  if (!prevBtn || !nextBtn) return;
  const list = currentFiltered.length ? currentFiltered : entries;
  const idx = list.findIndex(e => e.id === currentDetailItem?.id);
  prevBtn.disabled = idx <= 0;
  nextBtn.disabled = idx < 0 || idx >= list.length - 1;
}
function navStep(delta) {
  const list = currentFiltered.length ? currentFiltered : entries;
  const idx = list.findIndex(e => e.id === currentDetailItem?.id);
  const target = list[idx + delta];
  if (target) showDetail(target, null, true);
}
function showDetail(item, trigger, updateURL=true) {
  if (!item) return;
  if(trigger){
    lastTrigger=trigger;
    lastTriggerContext={id:item.id,area:trigger.closest('#drawn-case')?'drawn-case':'results',read:!!trigger.closest('.card-bottom')};
  }
  currentDetailItem = item;
  const toolbarId = $('detail-toolbar-id');
  if (toolbarId) toolbarId.textContent = item.id;
  const body = $('detail-body');
  body.replaceChildren();

  const metaBar = el('div', 'detail-header-meta');
  metaBar.append(
    el('span', 'detail-id-badge', item.id),
    el('span', 'detail-badge kind-' + item.kind, KIND[item.kind]),
    el('span', 'detail-badge proof-badge', item.proof),
    el('span', 'detail-badge scenario-badge', '情境：' + item.scenario)
  );
  body.append(metaBar);

  const title = el('h1', '', item.title);
  title.id = 'detail-title';
  title.tabIndex = -1;
  body.append(title);

  const actionRow = el('div', 'detail-actions');
  const copyBtn = el('button', 'btn-copy-link', '📋 複製案例連結');
  copyBtn.type = 'button';
  copyBtn.id = 'copy-case-link';
  copyBtn.addEventListener('click', async () => {
    const url=new URL(location.href);url.searchParams.set('case',item.id);
    try{
      if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url.href);
      copyBtn.textContent='✓ 已複製！';
      setTimeout(()=>{copyBtn.textContent='📋 複製案例連結';},2000);
    }catch{
      let manual=actionRow.querySelector('.manual-share-link');
      if(!manual){
        manual=el('input','manual-share-link');manual.type='text';manual.readOnly=true;
        manual.setAttribute('aria-label','案例分享網址，請手動複製');actionRow.append(manual);
      }
      manual.value=url.href;copyBtn.textContent='請手動複製下方連結';manual.focus();manual.select();
    }
  });
  const source = el('a', 'detail-source', '查看 Markdown 原文 ↗');
  source.href = REPO + item.path;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  actionRow.append(copyBtn, source);
  if (item.tags && item.tags.length) {
    const tagsRow = el('span', 'detail-tags-text', '標籤：' + item.tags.join('、'));
    actionRow.append(tagsRow);
  }
  body.append(actionRow);

  body.append(el('p', 'detail-warning', item.kind === 'pending' ? '待查線索：證據尚不足，不列成功或已完成案例。' : '來源報告與本庫建議流程請分開閱讀；收錄不代表獨立重現或取得執行授權。'));

  const overview = el('div', 'plain-overview');
  [['可以幫你做什麼', item.what], ['怎麼開始', item.how], ['要注意什麼', item.caution]].forEach(([label, text]) => {
    const section = el('section');
    section.append(el('h2', '', label), el('p', '', text));
    overview.append(section);
  });
  body.append(overview);

  const research = el('details', 'research-details');
  const toggle = el('summary', '', '查看原始研究、來源與完整提示詞');
  research.append(toggle, el('p', 'research-title', item.id + ' · ' + item.originalTitle), renderMarkdown(item.markdown, item.path));
  body.append(research);
  globalThis.CaseReader?.enhance(body, item);

  updateModalNav();

  if (!$('detail').open) $('detail').showModal();
  $('detail').scrollTop = 0;
  title.focus({preventScroll:true});
  if (updateURL) {
    const url = new URL(location.href);
    url.searchParams.set('case', item.id);
    history.pushState(null, '', url);
  }
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
  if ($('detail').open) $('detail').close();
  const url = new URL(location.href);
  url.searchParams.delete('case');
  history.replaceState(null, '', url);
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
  node.dataset.kind = item.kind;node.dataset.caseId=item.id;
  const top = el('div', 'card-top');
  const topInfo = el('span', 'card-id-tool', item.id + (item.tools.length ? ' · ' + item.tools.slice(0, 2).join(' / ') : ''));
  const kindBadge = el('span', 'kind', KIND[item.kind]);
  top.append(topInfo, kindBadge);
  node.append(top);

  const h = el('h3');
  const title = el('button', '', item.title);
  title.type = 'button';
  title.addEventListener('click', () => showDetail(item, title));
  h.append(title);
  node.append(h, el('p', 'summary', item.summary));
  const context=renderSearchContext(item,terms);
  if(context)node.append(context);

  const tagsWrap = el('div', 'tags');
  const scenarioTag = el('button', 'tag tag-scenario', item.scenario);
  scenarioTag.type = 'button';
  scenarioTag.title = '依此情境篩選';
  scenarioTag.addEventListener('click', e => {
    e.stopPropagation();
    activeScenario = activeScenario === item.scenario ? '' : item.scenario;
    render();
  });
  tagsWrap.append(scenarioTag);

  const displayTags = (item.tags || []).slice(0, 2);
  displayTags.forEach(t => {
    const tagBtn = el('button', 'tag tag-interactive', t);
    tagBtn.type = 'button';
    tagBtn.title = '搜尋「' + t + '」';
    tagBtn.addEventListener('click', e => {
      e.stopPropagation();
      $('query').value = t;
      render();
    });
    tagsWrap.append(tagBtn);
  });
  node.append(tagsWrap);

  const bottom = el('div', 'card-bottom');
  const read = el('button', '', item.kind === 'pending' ? '查看這個想法 →' : '看看怎麼用 →');
  read.type = 'button';
  read.setAttribute('aria-label', '閱讀 ' + item.id + ' ' + item.title);
  read.addEventListener('click', () => showDetail(item, read));
  bottom.append(el('span', 'proof', item.proof), read);
  node.append(bottom);
  return node;
}
function filterEntries(items, terms, filters) {
  return items.filter(item => terms.every(term => termVariants(term).some(v => item.search.includes(v))) && (!filters.kind || item.kind === filters.kind) && (!filters.tool || item.tools.includes(filters.tool)) && (!filters.category || item.category === filters.category) && (!filters.scenario || item.scenario === filters.scenario) && (!filters.proof || item.proof === filters.proof));
}
const FILTER_LABELS = {query:'關鍵字',scenario:'使用情境',kind:'收錄狀態',tool:'提及工具',category:'主題分類',proof:'來源類型'};
function activeConditions(query, filters) {
  return Object.entries({query, ...filters}).filter(([,value]) => value)
    .map(([key,value]) => ({key,value,label:FILTER_LABELS[key],display:key==='kind' ? KIND[value] || value : value}));
}
function relaxationOptions(items, terms, filters) {
  return Object.entries(filters).filter(([,value])=>value).map(([key,value]) => ({
    key, value, count:filterEntries(items,terms,{...filters,[key]:''}).length
  })).filter(option=>option.count>0).sort((a,b)=>a.count-b.count);
}
const SEARCH_KEYS=['q','scenario','kind','tool','category','proof'];
function searchLink(href,query,filters) {
  const current=new URL(href);
  const url=new URL(current.pathname,current.origin);
  if(query)url.searchParams.set('q',query);
  SEARCH_KEYS.slice(1).forEach(key=>{if(filters[key])url.searchParams.set(key,filters[key]);});
  url.hash='explore';
  return url.href;
}
function hasSearchArrival(params,hash) {
  if(hash)return hash==='#explore';
  return SEARCH_KEYS.some(key=>(params.get(key)||'').trim());
}
function currentSearchLink() {
  const filters=Object.fromEntries(['kind','tool','category','proof'].map(id=>[id,$(id).value]));
  filters.scenario=activeScenario;
  return searchLink(location.href,$('query').value,filters);
}
function revealSearch(resultsOnly=false) {
  const target=$(resultsOnly?'results-count':'search-title');
  (resultsOnly?$('results-count'):$('explore')).scrollIntoView({block:'start',behavior:'instant'});
  target.focus({preventScroll:true});
}
function finishArrival(params,failed=false) {
  const shouldMove=allowAutomaticArrival&&(hasSearchArrival(params,location.hash)||(failed&&params.has('case')));
  allowAutomaticArrival=false;
  if(shouldMove)revealSearch();
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
  const request=searchShareRequest;
  const url=currentSearchLink();
  try {
    if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url);
    if(request!==searchShareRequest)return;
    $('search-share-status').textContent='已複製搜尋連結，包含目前關鍵字與篩選。';
  } catch {
    if(request!==searchShareRequest)return;
    $('search-share-status').textContent='無法自動複製，請手動複製下方搜尋網址。';
    const manual=$('search-share-url');
    manual.value=url;manual.hidden=false;manual.focus();manual.select();
  }
}

function focusResults() {
  $('results-count').focus();
}
function removeCondition(key) {
  if(key==='scenario')activeScenario='';
  else if(Object.hasOwn(FILTER_LABELS,key))$(key).value='';
  render();
  focusResults();
}
function clearFacets() {
  activeScenario='';
  ['kind','tool','category','proof'].forEach(id=>$(id).value='');
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
    $('empty-hint').textContent=options.length
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
  $('scenario').value=activeScenario;
  const q = tokenize($('query').value);
  const filters = Object.fromEntries(['kind', 'tool', 'category', 'proof'].map(id => [id, $(id).value]));
  if (activeScenario) filters.scenario = activeScenario;
  const facetCount = Object.values(filters).filter(Boolean).length;
  $('filter-count').textContent = facetCount ? `已套用 ${facetCount} 項篩選` : '未設定篩選';
  currentFiltered = filterEntries(entries, q, filters);
  $('results').replaceChildren(...currentFiltered.map(item=>card(item,q)));syncDiscovery(currentFiltered);
  $('empty').hidden = !!currentFiltered.length || !discoveryReady;
  $('empty').querySelector('h3').textContent=failedPaths.length?'已載入內容中沒有符合的案例':'目前沒有符合的案例';
  renderSearchFeedback(q, filters);
  updatePartialLoad();
  const skipNote = failedPaths.length ? `（${failedPaths.length} 個來源檔案未載入）` : '';
  $('results-count').textContent = `顯示 ${currentFiltered.length} / ${entries.length} 筆收錄${skipNote}`;

  document.querySelectorAll('.chip[data-scenario]').forEach(btn => {
    const isActive = btn.dataset.scenario === activeScenario;
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
    ['query', 'kind', 'tool', 'category', 'proof'].forEach(id => {
      const key = id === 'query' ? 'q' : id;
      if ($(id).value) url.searchParams.set(key, $(id).value); else url.searchParams.delete(key);
    });
    if (activeScenario) url.searchParams.set('scenario', activeScenario); else url.searchParams.delete('scenario');
    history.replaceState(null, '', url);
  }
}
function reset() {
  activeScenario = '';
  ['query', 'kind', 'tool', 'category', 'proof'].forEach(id => $(id).value = '');
  render();
}
function populate(id, values) {
  const node = $(id);
  while (node.options.length > 1) node.remove(1);
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
async function loadCorpus(paths, options = {}) {
  const fetchFn = options.fetch || fetch;
  const limit = options.concurrency || 16;
  const parseFn = options.parseFile || parseFile;
  const results = await mapConcurrent(paths, limit, async path => {
    const controller=options.timeout?new AbortController():null;
    const timer=controller?setTimeout(()=>controller.abort(),options.timeout):null;
    try {
      const r = await fetchFn(path, { cache: 'no-cache', ...(controller?{signal:controller.signal}:{}) });
      if (!r.ok) {
        console.warn(`無法讀取 ${path} (HTTP ${r.status})`);
        return { ok: false, path, error: `HTTP ${r.status}` };
      }
      const text = await r.text();
      const entries = parseFn(path, text);
      return { ok: true, path, entries };
    } catch (err) {
      console.warn(`無法讀取 ${path}：`, err);
      return { ok: false, path, error: err.message || String(err) };
    } finally {
      if(timer!==null)clearTimeout(timer);
    }
  });
  const entries = results.filter(r => r && r.ok).flatMap(r => r.entries);
  const failed = results.filter(r => r && !r.ok).map(r => r.path);
  return { entries, failed };
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
  $('partial-load').hidden=!discoveryReady||!failedPaths.length;
  $('retry-failed').setAttribute('aria-disabled',String(recoveringSources));
  $('retry-failed').textContent=recoveringSources?'正在重試…':'重試未載入來源';
  const target=new URLSearchParams(location.search).get('case');
  const missingTarget=target&&!matchCase(target);
  $('partial-message').textContent=(missingTarget?'分享的案例目前無法開啟，可能仍在未載入的來源中。':'')+
    '還有 '+failedPaths.length+' 個來源檔案未載入；搜尋、篩選與統計只涵蓋已載入內容。'+
    (recoveringSources?'正在補讀，你可以繼續搜尋或閱讀。':'可稍後重試，已載入內容會保留。');
  $('load-status').textContent=recoveryNotice;
}
function preserveRecoveryFocus() {
  const active=document.activeElement;
  const cardNode=active.closest('.card');
  const area=cardNode?.closest('#drawn-case')?'drawn-case':'results';
  const cardId=cardNode?.dataset.caseId;
  const buttonIndex=cardNode?[...cardNode.querySelectorAll('button')].indexOf(active):-1;
  const filterKey=active.dataset.removeFilter;
  const parentId=active.parentElement?.id;
  return ()=>{
    if(active===document.body)return;
    if(active.isConnected && active.getClientRects().length && !active.closest('[hidden]'))return;
    let replacement;
    if(cardId){
      const node=[...$(area).querySelectorAll('.card')].find(c=>c.dataset.caseId===cardId);
      replacement=node?.querySelectorAll('button')[buttonIndex];
    }else if(filterKey && parentId){
      replacement=[...$(parentId).querySelectorAll('[data-remove-filter]')].find(b=>b.dataset.removeFilter===filterKey);
    }
    const target=replacement||$('results-count');
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  };
}
async function retryFailedSources() {
  if(!discoveryReady||recoveringSources||!failedPaths.length)return;
  const paths=[...failedPaths];
  const requestedCase=new URLSearchParams(location.search).get('case');
  recoveringSources=true;recoveryNotice='正在重試 '+paths.length+' 個來源檔案，已載入內容仍可使用。';
  updatePartialLoad();
  try {
    const result=await loadCorpus(paths,{concurrency:4,timeout:15000});
    const restoreFocus=preserveRecoveryFocus();
    const recoverRequested=document.activeElement===$('retry-failed');
    entries=mergeCorpus(entries,result.entries);
    failedPaths=result.failed;
    recoveringSources=false;
    recoveryNotice='已補回 '+result.entries.length+' 筆收錄。'+(failedPaths.length?
      '仍有 '+failedPaths.length+' 個來源檔案未載入，請稍後再試。':'所有來源皆已載入。');
    refreshCorpusMetadata();
    render(false,true);
    updateModalNav();
    restoreFocus();
    const target=new URLSearchParams(location.search).get('case');
    if(recoverRequested && requestedCase && target===requestedCase && !$('detail').open){
      const item=matchCase(target);
      if(item)showDetail(item,null,false);
    }
  } catch(error) {
    recoveryNotice='暫時無法補讀來源，已載入內容已保留，請稍後再試。';
    console.error(error);
  } finally {
    recoveringSources=false;
    updatePartialLoad();
  }
}

async function load() {
  recoveryNotice='';$('load-status').textContent='';$('partial-load').hidden=true;
  clearSearchShare();$('copy-search-link').disabled=true;
  discoveryReady=false;discoveryKey='';$('guide-options').disabled=true;$('draw-case').disabled=true;$('discover').setAttribute('aria-busy','true');$('draw-status').textContent='正在準備案例卡…';$('drawn-case').replaceChildren();
  $('error').hidden = true;
  $('empty').hidden = true;
  $('search-feedback').hidden = true;
  $('empty-suggestions').replaceChildren();
  $('results-count').textContent = '正在讀取案例…';
  failedPaths = [];
  try {
    const response = await fetch('catalog.json', { cache: 'no-cache' });
    if (!response.ok) throw Error('索引讀取失敗。');
    const catalog = await response.json();
    if (!Array.isArray(catalog.files) || !catalog.files.length) throw Error('索引沒有案例。');
    const paths = catalog.files.filter(p => typeof p === 'string' && /^(cases|evidence)\/[a-zA-Z0-9_/-]+\.md$/.test(p) || p === 'sources/pending.md');
    try {
      const copyResponse = await fetch('assets/copy.json', { cache: 'no-cache' });
      if (copyResponse.ok) {
        displayCopy = await copyResponse.json();
      } else {
        console.warn('顯示文案讀取失敗，使用 Markdown 預設文案。');
        displayCopy = {};
      }
    } catch (e) {
      console.warn('顯示文案載入失敗，使用 Markdown 預設文案：', e);
      displayCopy = {};
    }
    const { entries: loaded, failed } = await loadCorpus(paths, { fetch, parseFile, concurrency: 16 });
    failedPaths = failed;
    if (!loaded.length) throw Error('沒有成功讀取任何案例。');
    entries = mergeCorpus([],loaded);
    refreshCorpusMetadata();
    $('updated').textContent = '索引更新 ' + catalog.builtAt;
    const params = new URLSearchParams(location.search);
    activeScenario = params.get('scenario') || '';
    ['query', 'kind', 'tool', 'category', 'proof'].forEach(id => {
      const value = params.get(id === 'query' ? 'q' : id) || '';
      if(failedPaths.length && value && ['tool','category','proof'].includes(id) && ![...$(id).options].some(o=>o.value===value)){
        const option=el('option','',value);option.value=value;$(id).append(option);
      }
      if (id === 'query' || [...$(id).options].some(o => o.value === value)) $(id).value = value;
    });
    discoveryReady=true;$('guide-options').disabled=false;$('discover').setAttribute('aria-busy','false');
    render(false);
    const current = matchCase(params.get('case'));
    if (current) { showDetail(current, null, false); allowAutomaticArrival=false; }
    else finishArrival(params);
  } catch (error) {
    discoveryReady=false;$('discover').setAttribute('aria-busy','false');$('draw-status').textContent='案例卡暫時無法載入，請到下方重新載入或閱讀 GitHub 索引。';$('drawn-case').replaceChildren();$('draw-case').disabled=true;$('guide-options').disabled=true;
    $('results').replaceChildren();
    $('results-count').textContent = '載入未完成';
    $('error-message').textContent = '請稍後重試，或先閱讀 GitHub 原始資料。';
    $('error').hidden = false;
    finishArrival(new URLSearchParams(location.search),true);
    console.error(error);
  }
}
function drawNext(){
  if(!discoveryReady||!discoveryDeck)return;
  const next=discoveryDeck.next();
  if(!next)return;
  $('drawn-case').replaceChildren(card(next.item));
  const scope=$('scenario').value||'全部情境';
  $('draw-status').textContent=scope+' · 這組條件有 '+next.total+' 張案例卡 · '+(next.round>1?'已重新洗牌 · ':'')+'第 '+next.position+' 張：'+next.item.title;
  $('draw-case').textContent=next.total===1?'只有這一張，重新看看':'再抽一張 ↻';
}
function syncDiscovery(filtered){
  document.querySelectorAll('[data-scenario]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scenario===$('scenario').value)));
  if(!discoveryReady)return;
  const pool=Discovery.discoveryPool(filtered);
  const key=$('scenario').value+'|'+pool.map(item=>item.id).join(',');
  if(key===discoveryKey)return;
  discoveryKey=key;discoveryDeck=Discovery.createDeck(pool);
  $('draw-case').disabled=!pool.length;
  if(pool.length)drawNext();
  else{
    $('drawn-case').replaceChildren(el('p','draw-placeholder','試試其他情境，或在下方調整篩選。待查線索與模板補充保留在搜尋結果中。'));
    $('draw-status').textContent='這組條件目前沒有可抽的案例卡。';
    $('draw-case').textContent='沒有可抽的案例';
  }
}
function revealDiscovery(){
  if(!window.matchMedia('(max-width:760px)').matches)return;
  const rect=$('discover').getBoundingClientRect();
  if(rect.top<0||rect.bottom>window.innerHeight)$('discover').scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function chooseScenario(value){
  ['query','scenario','kind','tool','category','proof'].forEach(id=>$(id).value='');
  activeScenario=value;render();revealDiscovery();
}

/* Browser event bindings. */
// An arriving reader may start using the page while the corpus is loading.
// Never override that interaction with late search-arrival scrolling or focus.
// An explicit case link still opens its requested case when loading completes.
['pointerdown','keydown','wheel','touchstart'].forEach(type=>{
  document.addEventListener(type,()=>{allowAutomaticArrival=false;},{once:true,passive:true});
});
$('copy-search-link').addEventListener('click',copySearchLink);
// Choose the initial disclosure state once; typing, navigation and resizing
// preserve the reader's choice and never hide a currently focused control.
$('filter-options').open = !window.matchMedia('(max-width:760px)').matches;
$('draw-case').addEventListener('click',()=>{drawNext();revealDiscovery();});
document.querySelectorAll('#guide-options [data-scenario]').forEach(button=>button.addEventListener('click',()=>chooseScenario(button.dataset.scenario)));
$('scenario').addEventListener('change',()=>{activeScenario=$('scenario').value;render();});
$('filters').addEventListener('submit', e => e.preventDefault());
$('query').addEventListener('input', () => render());
['kind', 'tool', 'category', 'proof'].forEach(id => $(id).addEventListener('change', () => render()));
$('reset').addEventListener('click', reset);
$('empty-reset').addEventListener('click', () => { reset(); focusResults(); });
$('clear-facets').addEventListener('click', clearFacets);
$('edit-query').addEventListener('click', () => { $('query').focus(); $('query').select(); });
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
  } else if (chip.dataset.query) {
    const q = chip.dataset.query;
    $('query').value = $('query').value.trim() === q ? '' : q;
    render();
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
    if (e.defaultPrevented || e.isComposing || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || document.activeElement.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); navStep(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); navStep(1); }
    return;
  }
  if (e.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
    e.preventDefault();
    $('query').focus();
  }
});
window.addEventListener('popstate', () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('case');
  const item = matchCase(id);
  const wasOpen=$('detail').open;
  if (item) showDetail(item, null, false); else if (wasOpen) $('detail').close();
  activeScenario = params.get('scenario') || '';
  ['query', 'kind', 'tool', 'category', 'proof'].forEach(key => $(key).value = params.get(key === 'query' ? 'q' : key) || '');
  render(false);
  if(wasOpen&&!item){
    restoreDetailFocus();
    // Fragment traversal can apply its native focus after the popstate handler.
    // Restore once after that step, without overriding another control's focus.
    if(location.hash){
      const returnURL=location.href,returnTarget=document.activeElement;
      let fragment=null;
      try{fragment=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{}
      requestAnimationFrame(()=>{
        if(location.href!==returnURL||$('detail').open||!returnTarget?.isConnected)return;
        const active=document.activeElement;
        if(active===document.body||active===fragment||active===returnTarget){
          if(active!==returnTarget)returnTarget.focus({preventScroll:true});
          returnTarget.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
        }
      });
    }
  }
});
load();
