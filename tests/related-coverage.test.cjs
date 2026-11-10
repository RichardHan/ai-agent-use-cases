'use strict';
// 延伸閱讀 is the only next-reading choice at the end of a case. Before this rule,
// 205 of 508 pages had none because a suggestion needed two shared tags and a
// declared theme (343 of 345 themes are used by exactly one page). A single tag now
// counts, but only when few case pages use it, so a template-wide tag (驗收, 每日)
// can never turn into a suggestion. These tests hold that line over the whole corpus.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({URL,Discovery:require(path.join(root,'assets/discovery.js'))});
vm.runInContext(source+'\nthis.api={metadata,relatedEntries,sharedRelatedTags,RELATED_SPECIFIC_TAG_SHARE};',context);
const api=context.api;
const files=fs.readdirSync(path.join(root,'cases')).filter(name=>name.endsWith('.md')).sort();
const corpus=files.map(file=>api.metadata(fs.readFileSync(path.join(root,'cases',file),'utf8'),'cases/'+file,'case'));
const rows=item=>Array.from(api.relatedEntries(item,corpus),row=>({id:row.item.id,reason:row.reason,kind:row.item.kind,category:row.item.category,tags:row.item.tags||[]}));
const tagCounts=new Map();
for (const item of corpus) for (const tag of item.tags||[]) tagCounts.set(tag,(tagCounts.get(tag)||0)+1);
const specificLimit=Math.max(1,corpus.length*api.RELATED_SPECIFIC_TAG_SHARE);

test('the corpus is large enough for the specificity rule to mean something',()=>{
  assert.ok(corpus.length>400,'case pages: '+corpus.length);
  assert.ok(specificLimit>=5&&specificLimit<=15,'2% of '+corpus.length+' pages is '+specificLimit);
});

test('every page offers at most three other case pages, in the documented order',()=>{
  const offenders=[];
  const tier=reason=>reason.startsWith('共同標籤：')?0:reason.startsWith('同分類：')?1:reason.startsWith('相關標籤：')?2:9;
  for (const item of corpus) {
    const list=rows(item);
    if (list.length>3) offenders.push(item.id+' rows '+list.length);
    if (list.some(row=>row.id===item.id)) offenders.push(item.id+' suggests itself');
    if (list.some(row=>row.kind!=='case')) offenders.push(item.id+' suggests a non-case entry');
    if (new Set(list.map(row=>row.id)).size!==list.length) offenders.push(item.id+' repeats a suggestion');
    for (let i=1;i<list.length;i++) if (tier(list[i].reason)<tier(list[i-1].reason)) offenders.push(item.id+' out of tier order');
    for (const row of list) {
      const shared=Array.from(api.sharedRelatedTags(item,corpus.find(other=>other.id===row.id)));
      const named=(row.reason.split('：')[1]||'').split('、').filter(Boolean);
      if (!named.length) offenders.push(item.id+'→'+row.id+' names no reason');
      if (row.reason.startsWith('共同標籤：')&&shared.length<2) offenders.push(item.id+'→'+row.id+' strong row with '+shared.length+' shared tag');
      if (row.reason.startsWith('相關標籤：')&&shared.length!==1) offenders.push(item.id+'→'+row.id+' single row with '+shared.length+' shared tags');
      if (row.reason.startsWith('同分類：')&&row.category!==item.category) offenders.push(item.id+'→'+row.id+' names a theme the page does not declare');
      if (!row.reason.startsWith('同分類：')) for (const tag of named) if (!shared.includes(tag)) offenders.push(item.id+'→'+row.id+' claims unshared '+tag);
    }
  }
  assert.deepEqual(offenders,[],'suggestion shape and order');
});

test('a page is never empty while it shares a specific tag with another case',()=>{
  const offenders=[];
  for (const item of corpus) {
    if (rows(item).length) continue;
    const specific=item.tags.filter(tag=>(tagCounts.get(tag)||0)<=specificLimit);
    if (!specific.length) continue;
    const partner=corpus.find(other=>other.id!==item.id&&(other.tags||[]).some(tag=>specific.includes(tag)));
    if (partner) offenders.push(item.id+' shares specific '+specific.join('、')+' with '+partner.id+' but offers nothing');
  }
  assert.deepEqual(offenders,[],'a specific shared tag always becomes a suggestion');
});

test('template-wide tags never stand alone as a reason',()=>{
  const offenders=[];
  for (const item of corpus) for (const row of rows(item)) {
    if (!row.reason.startsWith('相關標籤：')) continue;
    for (const tag of row.reason.replace('相關標籤：','').split('、')) {
      if ((tagCounts.get(tag)||0)>specificLimit) offenders.push(item.id+'→'+row.id+' '+tag+' used by '+tagCounts.get(tag));
    }
  }
  assert.deepEqual(offenders,[],'only a tag few pages use may stand alone');
});

test('most case pages have a next reading, and the rest name why',()=>{
  const covered=corpus.filter(item=>rows(item).length).length;
  assert.ok(covered/corpus.length>=0.9,'covered '+covered+' of '+corpus.length);
  // The pages that still have no suggestion must only share template-wide tags or
  // a theme alone; that is the honest reason the reader is shown.
  const empty=corpus.filter(item=>!rows(item).length);
  for (const item of empty) {
    const specific=item.tags.filter(tag=>(tagCounts.get(tag)||0)<=specificLimit);
    const partner=corpus.find(other=>other.id!==item.id&&(other.tags||[]).some(tag=>specific.includes(tag)));
    assert.equal(partner,undefined,item.id+' shares a specific tag with '+partner?.id+' but offers nothing');
  }
  assert.ok(empty.length>0,'some pages really have nothing in common; the library must keep saying so');
});
