'use strict';
// A theme is published as a filter option, as a `同分類` reason and as a field the
// 主題 search scope matches. So the value has to describe the case, not the
// library's judgement about it and not the INDEX table row it was copied from.
// Both leaks were observed on the published site: the filter offered
// `B｜作者實作自述，未獨立重現`, and 主題-scope search for `未獨立重現` returned
// UC-444 as its only hit. These tests pin the two shapes a theme may not take.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(process.env.CATEGORY_SOURCE||path.join(root,'assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'assets/discovery.js'),'utf8'),context);
vm.runInContext(source+'\nthis.api={metadata};',context);
const api=context.api;
const SCENARIOS=['生活','工作','省錢','學習','創作','開發'];
const corpus=fs.readdirSync(path.join(root,'cases')).filter(file=>file.endsWith('.md')).sort()
  .map(file=>api.metadata(fs.readFileSync(path.join(root,'cases',file),'utf8'),'cases/'+file,'case'));
const published=corpus.filter(item=>item.category);

test('the theme filter never offers a qualification grade', () => {
  // `B｜作者實作自述，未獨立重現` is how the audit records its verdict; the page
  // already keeps that sentence in 來源證據, where it belongs.
  const offenders=published.filter(item=>/^\s*[A-D]\s*[｜|]/.test(item.category)).map(item=>item.id+'：'+item.category);
  assert.deepEqual(offenders,[],'a theme names the subject, not the audit grade');
  const verdicts=published.filter(item=>/未獨立重現|不列入嚴格合格|待定/.test(item.category)).map(item=>item.id+'：'+item.category);
  assert.deepEqual(verdicts,[],'a theme does not carry a qualification verdict');
});

test('the theme filter never republishes an INDEX table cell', () => {
  // `工作｜商機、資料對帳、狀態、驗收` is `<情境>｜<標籤>`, and both halves are
  // already declared by the page's own `- 情境` and `- 標籤` lines, so the value
  // becomes one more unique option that only repeats them. Themes that keep a
  // scenario prefix name their facets with ／ (`工作｜創作者經營／贊助開發`); the
  // cell form is the one that repeats the 、-separated tag list.
  const cell=item=>SCENARIOS.some(s=>item.category.startsWith(s+'｜'))&&item.category.includes('、');
  const offenders=published.filter(cell).map(item=>item.id+'：'+item.category);
  assert.deepEqual(offenders,[],'a theme is not the 情境＋標籤 cell from the index');
});

test('the pages that carried a cell or a grade still declare subject, tags and verdict', () => {
  const pages={
    'UC-444':['產品回饋／版本通知','工作',['產品回饋','版本更新','需求追蹤','人工核准'],'作者實作自述，未獨立重現'],
    'UC-433':['業務郵件／訂單狀態核對','工作',['製造業','郵件','ERP','狀態更新'],'未獨立重現'],
    'UC-214':['發布驗收／執行版本核對','開發',['發布','版本','環境','驗收'],'未獨立重現'],
    'UC-215':['食譜收藏／郵件擷取','生活',['食譜','收藏','文件整理','驗收'],'未獨立重現'],
    'UC-216':['攝影選片／修圖交接','創作',['攝影','挑片','修圖','驗收'],'未獨立重現'],
    'UC-217':['硬體建置／回歸阻擋','開發',['硬體','回歸','失敗','驗收'],'無獨立重跑'],
    'UC-218':['第三方技能／來源審閱','開發',['技能','來源','版本','權限'],'未見安裝或動態測試'],
  };
  const byId=new Map(corpus.map(item=>[item.id,item]));
  for (const [id,[theme,scenario,tags,verdict]] of Object.entries(pages)) {
    const item=byId.get(id);
    assert.ok(item,id+' still exists');
    assert.equal(item.category,theme,id+' theme describes the case');
    assert.equal(item.scenario,scenario,id+' keeps its 情境');
    assert.deepEqual(Array.from(item.tags),tags,id+' keeps its 標籤');
    // The verdict sentence the cell used to overwrite stays where it is readable:
    // the page's own 證據／來源證據 line.
    const markdown=fs.readFileSync(path.join(root,item.path),'utf8');
    const evidenceLine=(markdown.match(/^-\s*(?:來源證據|證據狀態|證據等級|證據)\s*[：:]\s*(.+)$/m)||[])[1]||'';
    assert.match(evidenceLine,new RegExp(verdict),id+' keeps the verdict in its evidence line');
  }
});
