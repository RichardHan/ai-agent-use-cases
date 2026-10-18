/* No external scripts, analytics, API tokens, or build dependencies. */
'use strict';
const REPO = 'https://github.com/RichardHan/ai-agent-use-cases/blob/main/';
const KIND = {case:'用法靈感', evidence:'經驗與踩坑', pending:'還在查證'};
const TOOL_PATTERNS = [['Grok Bot',/grok\s*bot/i],['Meta Muse',/\bmuse\b/i],['ChatGPT dots',/\bdots\b/i],['Cursor',/\bcursor\b/i],['GitHub',/\bgithub\b/i],['Notion',/\bnotion\b/i],['Facebook',/\bfacebook\b/i],['Google Drive',/google\s*drive|\bdrive\b/i],['Google Sheets',/google\s*sheets/i],['Haggle Bot',/haggle\s*bot/i]];
let entries = [], lastTrigger = null, displayCopy = {};
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
  const heading = title.replace(/^(?:UC|P)-\d+[：:：\s]*/, '');
  const lead = markdown.replace(/^#{1,3}[^\n]*\n/, '').split(/^## /m)[0];
  const summary = clean(lead.match(/^-\s*(?:核心目標|問題|目標|已知標題|狀態)\s*[：:]\s*(.+)$/m)?.[1] || lead.split('\n').find(line => line.trim() && !/^#|^-/.test(line)) || '閱讀公開來源、建議流程與驗收限制。');
  let category = clean(lead.match(/^-\s*分類(?:／標籤)?\s*[：:]\s*(.+)$/m)?.[1] || '');
  if (!category) category = /旅遊|旅行/.test(heading) ? '旅遊／消費研究' : /OLED|裝置/.test(heading) ? '實體裝置／驗收' : /銷售|商機|商店|SaaS|帳單/.test(heading) ? '商業／營運' : /研究|PR|CUA/.test(heading) ? '研究／開發' : /影片|社群|Facebook|CRM/.test(heading) ? '內容／社群' : '個人生產力';
  const proofLine = clean(lead.match(/^-\s*(?:來源證據|證據狀態|證據等級)\s*[：:]\s*(.+)$/m)?.[1] || '');
  const proof = kind === 'pending' ? '尚待查證' : /模板/.test(proofLine + heading) ? '模板／文件核讀' : /官方.*自報|official/.test(proofLine) ? '官方自報' : /author-demo|作者|自驗/.test(proofLine) ? '作者報告／示範' : '公開資料核讀';
  const tools = TOOL_PATTERNS.filter(([,re])=>re.test(markdown)).map(([name])=>name);
  const date = lead.match(/20\d{2}-\d{2}-\d{2}/)?.[0] || '';
  const copy=displayCopy[id]||{};
  const displayTitle=clean(lead.match(/^-\s*網站標題\s*[：:]\s*(.+)$/m)?.[1]||copy.title||heading);
  const what=clean(lead.match(/^-\s*一句話用途\s*[：:]\s*(.+)$/m)?.[1]||copy.what||summary);
  return {id,title:displayTitle,originalTitle:heading,what,how:copy.how||'先閱讀原始報告與限制，再用小範圍、去敏資料設計自己的測試。',caution:copy.caution||'本庫尚未獨立重現；先確認權限與驗收方式，不把案例報告當成成效保證。',markdown,path,kind,category,summary:what,proof,tools,date,search:norm(markdown+' '+displayTitle+' '+what+' '+tools.join(' ')+' '+category+' '+KIND[kind]+' '+idVariants(id))};
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
function showDetail(item, trigger, updateURL=true) {
  lastTrigger=trigger||lastTrigger;
  const body=$('detail-body');body.replaceChildren();
  const title=el('h1','',item.title);title.id='detail-title';body.append(title);
  const source=el('a','detail-source','查看 Markdown 原文 ↗');source.href=REPO+item.path;source.target='_blank';source.rel='noopener noreferrer';body.append(source);
  body.append(el('p','detail-warning',item.kind==='pending'?'待查線索：證據尚不足，不列成功或已完成案例。':'來源報告與本庫建議流程請分開閱讀；收錄不代表獨立重現或取得執行授權。'));
  const overview=el('div','plain-overview');[['可以幫你做什麼',item.what],['怎麼開始',item.how],['要注意什麼',item.caution]].forEach(([label,text])=>{const section=el('section');section.append(el('h2','',label),el('p','',text));overview.append(section);});body.append(overview);
  const research=el('details','research-details'),toggle=el('summary','','查看原始研究、來源與完整提示詞');research.append(toggle,el('p','research-title',item.id+' · '+item.originalTitle),renderMarkdown(item.markdown,item.path));body.append(research);
  if(!$('detail').open)$('detail').showModal();$('detail').scrollTop=0;
  if(updateURL){const url=new URL(location.href);url.searchParams.set('case',item.id);history.pushState(null,'',url);}
}
function closeDetail(){ if($('detail').open)$('detail').close();const url=new URL(location.href);url.searchParams.delete('case');history.replaceState(null,'',url);lastTrigger?.focus(); }
function card(item) {
  const node=el('article','card');node.dataset.kind=item.kind;
  const top=el('div','card-top');top.append(el('span','',item.tools.slice(0,2).join(' / ')||'AI 用法'),el('span','kind',KIND[item.kind]));node.append(top);
  const h=el('h3'),title=el('button','',item.title);title.type='button';title.addEventListener('click',()=>showDetail(item,title));h.append(title);node.append(h,el('p','summary',item.summary));
  const tags=el('div','tags');tags.append(el('span','tag',item.kind==='pending'?'這個用法還不能直接照做':item.kind==='evidence'?'先看經驗與限制':'參考公開分享，本庫未親測'));node.append(tags);
  const bottom=el('div','card-bottom'),read=el('button','',item.kind==='pending'?'查看這個想法 →':'看看怎麼用 →');read.type='button';read.setAttribute('aria-label','閱讀 '+item.id+' '+item.title);read.addEventListener('click',()=>showDetail(item,read));bottom.append(el('span','proof',item.kind==='pending'?'尚未核實':item.kind==='evidence'?'補充筆記':'用法靈感'),read);node.append(bottom);return node;
}
function filterEntries(items,terms,filters) {
  return items.filter(item=>terms.every(term=>termVariants(term).some(v=>item.search.includes(v)))&&(!filters.kind||item.kind===filters.kind)&&(!filters.tool||item.tools.includes(filters.tool))&&(!filters.category||item.category===filters.category)&&(!filters.proof||item.proof===filters.proof));
}
function render(updateURL=true) {
  const q=tokenize($('query').value);
  const filtered=filterEntries(entries,q,Object.fromEntries(['kind','tool','category','proof'].map(id=>[id,$(id).value])));
  $('results').replaceChildren(...filtered.map(card));$('empty').hidden=!!filtered.length;$('results-count').textContent=`顯示 ${filtered.length} / ${entries.length} 筆收錄`;
  if(updateURL){const url=new URL(location.href);['query','kind','tool','category','proof'].forEach(id=>{const key=id==='query'?'q':id;if($(id).value)url.searchParams.set(key,$(id).value);else url.searchParams.delete(key);});history.replaceState(null,'',url);}
}
function reset(){['query','kind','tool','category','proof'].forEach(id=>$(id).value='');render();}
function populate(id,values){const node=$(id);while(node.options.length>1)node.remove(1);[...new Set(values)].sort((a,b)=>a.localeCompare(b,'zh-Hant')).forEach(v=>{const o=el('option','',v);o.value=v;node.append(o);});}
async function load(){
  $('error').hidden=true;$('empty').hidden=true;$('results-count').textContent='正在讀取案例…';
  try{
    const response=await fetch('catalog.json',{cache:'no-cache'});if(!response.ok)throw Error('索引讀取失敗。');const catalog=await response.json();
    if(!Array.isArray(catalog.files)||!catalog.files.length)throw Error('索引沒有案例。');
    const paths=catalog.files.filter(p=>typeof p==='string'&&/^(cases|evidence)\/[a-zA-Z0-9_/-]+\.md$/.test(p)||p==='sources/pending.md');
    const copyResponse=await fetch('assets/copy.json',{cache:'no-cache'});if(!copyResponse.ok)throw Error('顯示文案讀取失敗。');displayCopy=await copyResponse.json();
    const loaded=await Promise.all(paths.map(async path=>{const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw Error(`無法讀取 ${path}`);return parseFile(path,await r.text());}));
    entries=loaded.flat().sort((a,b)=>({case:0,evidence:1,pending:2}[a.kind]-{case:0,evidence:1,pending:2}[b.kind])||a.id.localeCompare(b.id));
    for(const kind of Object.keys(KIND))$(kind==='case'?'case-count':kind+'-count').textContent=entries.filter(e=>e.kind===kind).length;
    $('updated').textContent='索引更新 '+catalog.builtAt;
    populate('tool',entries.flatMap(e=>e.tools));populate('category',entries.map(e=>e.category));populate('proof',entries.map(e=>e.proof));
    const params=new URLSearchParams(location.search);['query','kind','tool','category','proof'].forEach(id=>{const value=params.get(id==='query'?'q':id)||'';if(id==='query'||[...$(id).options].some(o=>o.value===value))$(id).value=value;});render(false);
    const current=matchCase(params.get('case'));if(current)showDetail(current,null,false);
  }catch(error){$('results').replaceChildren();$('results-count').textContent='載入未完成';$('error-message').textContent='請稍後重試，或先閱讀 GitHub 原始資料。';$('error').hidden=false;console.error(error);}
}
$('filters').addEventListener('submit',e=>e.preventDefault());$('query').addEventListener('input',()=>render());['kind','tool','category','proof'].forEach(id=>$(id).addEventListener('change',()=>render()));$('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);$('retry').addEventListener('click',load);$('close-detail').addEventListener('click',closeDetail);$('detail').addEventListener('cancel',e=>{e.preventDefault();closeDetail();});$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const rect=$('detail').getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeDetail();}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!$('detail').open&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();$('query').focus();}});
window.addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('case');const item=matchCase(id);if(item)showDetail(item,null,false);else if($('detail').open)$('detail').close();const params=new URLSearchParams(location.search);['query','kind','tool','category','proof'].forEach(key=>$(key).value=params.get(key==='query'?'q':key)||'');render(false);});
load();
