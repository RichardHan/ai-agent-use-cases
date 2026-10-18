/* No external scripts, analytics, API tokens, or build dependencies. */
'use strict';
const REPO = 'https://github.com/RichardHan/ai-agent-use-cases/blob/main/';
const KIND = {case:'用法靈感', evidence:'經驗與踩坑', pending:'還在查證'};
const TOOL_PATTERNS = [['Grok Bot',/grok\s*bot/i],['Meta Muse',/\bmuse\b/i],['ChatGPT dots',/\bdots\b/i],['Cursor',/\bcursor\b/i],['GitHub',/\bgithub\b/i],['Notion',/\bnotion\b/i],['Facebook',/\bfacebook\b/i],['Google Drive',/google\s*drive|\bdrive\b/i],['Google Sheets',/google\s*sheets/i],['Haggle Bot',/haggle\s*bot/i]];
let entries = [], currentFiltered = [], activeScenario = '', currentDetailItem = null, lastTrigger = null, displayCopy = {};
let discoveryDeck=null,discoveryKey='',discoveryReady=false,lastTriggerContext=null;
const $ = id => document.getElementById(id);
const clean = text => text.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[`*_]/g,'').trim();
const norm = text => text.normalize('NFKC').toLocaleLowerCase();
const tokenize = text => norm(text || '').trim().replace(/\b(uc|p)\s*[-_]?\s*(\d+)\b/g, '$1-$2').replace(/(?:^|\s)#(\d+)\b/g, ' uc-$1').split(/[\s,、，/／]+/).filter(Boolean);
function idVariants(id) { const normId = id.toUpperCase(); const unhyphenated = normId.replace(/[-_]/g, ''); return normId !== unhyphenated ? `${normId} ${unhyphenated}` : normId; }
function termVariants(term) { const t = norm(term).replace(/^#/, ''); const m = t.match(/^([a-z]+)[\s-]*(\d+)$/); if (m && (m[1] === 'uc' || m[1] === 'p')) { const padded = m[2].padStart(3, '0'); return [`${m[1]}-${padded}`, `${m[1]}${padded}`]; } return [t]; }
const matchCase = (target, list = entries) => { if (!target) return null; const t = norm(target).trim().replace(/^#/, ''); const m = t.match(/^(?:([a-z]+)[\s-]*)?(\d+)$/); const variants = m && (!m[1] || m[1] === 'uc' || m[1] === 'p') ? [`${m[1] || 'uc'}-${m[2].padStart(3, '0')}`, `${m[1] || 'uc'}${m[2].padStart(3, '0')}`] : termVariants(t); return list.find(e => { const eid = norm(e.id); const eidRaw = norm(e.id.replace(/[-_]/g, '')); return variants.includes(eid) || variants.includes(eidRaw); }) || null; };
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
  const rawTags = clean(lead.match(/^-\s*標籤\s*[：:]\s*(.+)$/m)?.[1] || '');
  const tags = rawTags ? rawTags.split(/[、,，\s/]+/).map(t=>t.trim()).filter(Boolean) : [];
  const proofLine = clean(lead.match(/^-\s*(?:來源證據|證據狀態|證據等級|證據)\s*[：:]\s*(.+)$/m)?.[1] || '');
  const proof = kind === 'pending' ? '尚待查證' : /模板/.test(proofLine + heading) ? '模板／文件核讀' : /官方.*(?:自報|第一手.*自述)|official/.test(proofLine) ? '官方自報' : /author|作者|自驗|自述/.test(proofLine) ? '作者報告／示範' : '公開資料核讀';
  const tools = TOOL_PATTERNS.filter(([,re])=>re.test(markdown)).map(([name])=>name);
  const date = lead.match(/20\d{2}-\d{2}-\d{2}/)?.[0] || '';
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

  updateModalNav();

  if (!$('detail').open) $('detail').showModal();
  $('detail').scrollTop = 0;
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
  ($('draw-case').disabled?$('query'):$('draw-case')).focus({preventScroll:true});
}
function closeDetail() {
  if ($('detail').open) $('detail').close();
  const url = new URL(location.href);
  url.searchParams.delete('case');
  history.replaceState(null, '', url);
  restoreDetailFocus();
}
function card(item) {
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
function render(updateURL=true) {
  $('scenario').value=activeScenario;
  const q = tokenize($('query').value);
  const filters = Object.fromEntries(['kind', 'tool', 'category', 'proof'].map(id => [id, $(id).value]));
  if (activeScenario) filters.scenario = activeScenario;
  currentFiltered = filterEntries(entries, q, filters);
  $('results').replaceChildren(...currentFiltered.map(card));syncDiscovery(currentFiltered);
  $('empty').hidden = !!currentFiltered.length;
  $('results-count').textContent = `顯示 ${currentFiltered.length} / ${entries.length} 筆收錄`;

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
async function load() {
  discoveryReady=false;discoveryKey='';$('guide-options').disabled=true;$('draw-case').disabled=true;$('discover').setAttribute('aria-busy','true');$('draw-status').textContent='正在準備案例卡…';$('drawn-case').replaceChildren();
  $('error').hidden = true;
  $('empty').hidden = true;
  $('results-count').textContent = '正在讀取案例…';
  try {
    const response = await fetch('catalog.json', { cache: 'no-cache' });
    if (!response.ok) throw Error('索引讀取失敗。');
    const catalog = await response.json();
    if (!Array.isArray(catalog.files) || !catalog.files.length) throw Error('索引沒有案例。');
    const paths = catalog.files.filter(p => typeof p === 'string' && /^(cases|evidence)\/[a-zA-Z0-9_/-]+\.md$/.test(p) || p === 'sources/pending.md');
    const copyResponse = await fetch('assets/copy.json', { cache: 'no-cache' });
    if (!copyResponse.ok) throw Error('顯示文案讀取失敗。');
    displayCopy = await copyResponse.json();
    const loaded = await Promise.all(paths.map(async path => {
      const r = await fetch(path, { cache: 'no-cache' });
      if (!r.ok) throw Error(`無法讀取 ${path}`);
      return parseFile(path, await r.text());
    }));
    entries = loaded.flat().sort((a, b) => ({ case: 0, evidence: 1, pending: 2 }[a.kind] - { case: 0, evidence: 1, pending: 2 }[b.kind]) || a.id.localeCompare(b.id));
    for (const kind of Object.keys(KIND)) $(kind === 'case' ? 'case-count' : kind + '-count').textContent = entries.filter(e => e.kind === kind).length;
    $('updated').textContent = '索引更新 ' + catalog.builtAt;
    populate('tool', entries.flatMap(e => e.tools));
    populate('category', entries.map(e => e.category));
    populate('proof', entries.map(e => e.proof));
    const params = new URLSearchParams(location.search);
    activeScenario = params.get('scenario') || '';
    ['query', 'kind', 'tool', 'category', 'proof'].forEach(id => {
      const value = params.get(id === 'query' ? 'q' : id) || '';
      if (id === 'query' || [...$(id).options].some(o => o.value === value)) $(id).value = value;
    });
    discoveryReady=true;$('guide-options').disabled=false;$('discover').setAttribute('aria-busy','false');
    render(false);
    const current = matchCase(params.get('case'));
    if (current) showDetail(current, null, false);
  } catch (error) {
    discoveryReady=false;$('discover').setAttribute('aria-busy','false');$('draw-status').textContent='案例卡暫時無法載入，請到下方重新載入或閱讀 GitHub 索引。';$('drawn-case').replaceChildren();$('draw-case').disabled=true;$('guide-options').disabled=true;
    $('results').replaceChildren();
    $('results-count').textContent = '載入未完成';
    $('error-message').textContent = '請稍後重試，或先閱讀 GitHub 原始資料。';
    $('error').hidden = false;
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
$('draw-case').addEventListener('click',()=>{drawNext();revealDiscovery();});
document.querySelectorAll('#guide-options [data-scenario]').forEach(button=>button.addEventListener('click',()=>chooseScenario(button.dataset.scenario)));
$('scenario').addEventListener('change',()=>{activeScenario=$('scenario').value;render();});
$('filters').addEventListener('submit', e => e.preventDefault());
$('query').addEventListener('input', () => render());
['kind', 'tool', 'category', 'proof'].forEach(id => $(id).addEventListener('change', () => render()));
$('reset').addEventListener('click', reset);
$('empty-reset').addEventListener('click', reset);
$('retry').addEventListener('click', load);
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
  if(wasOpen&&!item)restoreDetailFocus();
});
load();
