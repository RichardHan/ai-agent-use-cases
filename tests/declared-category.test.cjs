'use strict';
// A theme belongs to the case page. These tests pin the two rules a visitor
// depends on: the library never classifies a page that declares no `分類`, and a
// `同分類` suggestion always names a category both pages declare.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(process.env.CATEGORY_SOURCE||path.join(root,'assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'assets/discovery.js'),'utf8'),context);
vm.runInContext(source+'\nthis.api={metadata,relatedEntries,sharedRelatedTags};',context);
const api=context.api;
const leadOf=markdown=>markdown.replace(/^#{1,3}[^\n]*\n/,'').split(/^## /m)[0];
const declaresCategory=markdown=>/^-\s*分類(?:／標籤)?\s*[：:]/m.test(leadOf(markdown));
const corpusFiles=fs.readdirSync(path.join(root,'cases')).filter(file=>file.endsWith('.md')).sort();
const corpus=corpusFiles.map(file=>{
  const markdown=fs.readFileSync(path.join(root,'cases',file),'utf8');
  return {...api.metadata(markdown,'cases/'+file,'case'),declared:declaresCategory(markdown)};
});
const caseItem=(id,extra={})=>({id,kind:'case',category:'',scenario:'生活',tags:[],...extra});
// Results come from the vm realm; Array.from keeps the comparison in this realm
// so an empty result cannot fail merely on a prototype mismatch.
const ids=list=>Array.from(list,row=>row.item.id);
const reasons=list=>Array.from(list,row=>row.reason);

test('a page that declares no theme is not given one, even when its title hints at a topic', () => {
  for (const heading of ['規劃一趟日本旅行與比價','用 OLED 小螢幕核對裝置','SaaS 帳單與商店營運檢查','研究與 PR 審查流程']) {
    const markdown=`# UC-901：${heading}\n\n- 情境：生活\n- 標籤：測試\n\n## 方法\n\n正文。`;
    assert.equal(api.metadata(markdown,'cases/901-topic.md','case').category,'',heading+' must not be classified by its title');
  }
  assert.equal(api.metadata('# UC-902：未宣告分類\n\n- 情境：工作\n\n## 方法\n\n正文。','cases/902-none.md','case').category,'');
});

test('a declared theme is kept verbatim', () => {
  const markdown='# UC-903：宣告分類\n\n- 分類：客服、收件匣、核准流程、小型企業\n- 情境：工作\n\n## 方法\n\n正文。';
  assert.equal(api.metadata(markdown,'cases/903-declared.md','case').category,'客服、收件匣、核准流程、小型企業');
});

test('the corpus carries only categories its pages declare', () => {
  const invented=corpus.filter(item=>item.category && !item.declared).map(item=>item.id);
  assert.deepEqual(invented,[],'every shown theme is declared by its own page');
  assert.ok(corpus.filter(item=>item.declared).length>=340,'most case pages still declare a theme');
  assert.ok(corpus.filter(item=>!item.declared).length>0,'some pages declare none, so the fallback would have invented one');
});

test('same-category suggestions only join pages that declare the same theme', () => {
  const declared=caseItem('UC-921',{category:'旅遊／消費研究'});
  const otherDeclared=caseItem('UC-922',{category:'旅遊／消費研究'});
  const otherCategory=caseItem('UC-923',{category:'商業／營運'});
  assert.deepEqual(ids(api.relatedEntries(declared,[declared,otherDeclared,otherCategory])),['UC-922'],'a declared theme groups its own pages only');
  // A page with no theme is not paired by a theme it never declared, but a shared
  // tag still counts: the category only decides the reason, not the membership.
  const unclassified=caseItem('UC-924',{tags:['旅遊','比價']});
  const shared=caseItem('UC-925',{tags:['旅遊','比價'],category:'旅遊／消費研究'});
  assert.deepEqual(ids(api.relatedEntries(unclassified,[unclassified,shared])),['UC-925']);
});

test('an unclassified page keeps its shared-tag suggestions', () => {
  const current=caseItem('UC-930',{tags:['旅遊','比價']});
  const shared=caseItem('UC-931',{tags:['旅遊','比價']});
  const single=caseItem('UC-932',{tags:['旅遊']});
  assert.deepEqual(ids(api.relatedEntries(current,[current,shared,single])),['UC-931']);
  assert.ok(api.relatedEntries(caseItem('UC-933',{category:'未分類'}),[caseItem('UC-934',{category:'未分類'})]).length===0,'未分類 is not a topic');
});

test('no corpus suggestion claims 同分類 on a page that declares no category', () => {
  const offenders=[];
  for (const item of corpus) {
    const rows=api.relatedEntries(item,corpus);
    const firstCategory=rows.findIndex(row=>row.reason.startsWith('同分類：'));
    rows.forEach((row,index)=>{
      if (row.reason.startsWith('同分類：')&&(!row.item.category || !row.item.declared || row.item.category!==item.category)) offenders.push(item.id+'→'+row.item.id);
      // A two-tag match always comes first: 同分類 and single-tag rows only follow it.
      if (firstCategory>=0&&index>firstCategory&&row.reason.startsWith('共同標籤：')) offenders.push(item.id+' strong row after 同分類');
    });
  }
  assert.deepEqual(offenders,[],'a 同分類 row always names a category both pages declare, and only after tag rows');
});

test('a 相關標籤 row only names a tag few case pages use', () => {
  const counts=new Map();
  for (const item of corpus) for (const tag of item.tags||[]) counts.set(tag,(counts.get(tag)||0)+1);
  const offenders=[];
  for (const item of corpus) {
    for (const row of api.relatedEntries(item,corpus)) {
      if (!row.reason.startsWith('相關標籤：')) continue;
      const tags=row.reason.replace('相關標籤：','').split('、');
      for (const tag of tags) {
        const shared=api.sharedRelatedTags(item,row.item);
        if (!shared.includes(tag)) offenders.push(item.id+'→'+row.item.id+' tag '+tag+' not shared');
        if ((counts.get(tag)||0) > corpus.length*0.02) offenders.push(item.id+'→'+row.item.id+' tag '+tag+' used by '+(counts.get(tag)||0));
      }
      const strong=api.sharedRelatedTags(item,row.item).length>=2;
      if (strong) offenders.push(item.id+'→'+row.item.id+' strong pair labelled 相關標籤');
    }
  }
  assert.deepEqual(offenders,[],'a single tag is only a topic when few pages use it');
});
