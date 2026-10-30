const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/app.js','utf8').split('/* Browser event bindings. */')[0];
function api(){const c=vm.createContext({URL,URLSearchParams,Discovery:require('../assets/discovery.js')});vm.runInContext(source+';this.api={rankEntries,filterEntries,parseFile,tokenize,searchContext};',c);vm.runInContext('displayCopy='+fs.readFileSync('assets/copy.json','utf8'),c);return c.api;}
const ids=items=>Array.from(items,x=>x.id);
const item=(id,title,summary='',extra={})=>({id,title,summary,category:'',scenario:'',tools:[],tags:[],...extra});
test('purpose coverage precedes incidental matches; ties and empty queries preserve source order',()=>{
 const {rankEntries,tokenize}=api();
 const input=[item('UC-001','其他用途'),item('UC-002','薪資報表'),item('UC-003','薪資報表'),item('UC-004','報表','薪資整理')];
 assert.deepEqual(ids(rankEntries(input,tokenize('薪水 報表'))),['UC-002','UC-003','UC-004','UC-001']);
 assert.deepEqual(ids(input),['UC-001','UC-002','UC-003','UC-004']);
 assert.deepEqual(ids(rankEntries(input,[])),ids(input));
 assert.deepEqual(ids(rankEntries([],['薪水'])),[]);
});
test('exact ID precedes references; metadata matches precede body-only matches; optional fields are safe',()=>{
 const {rankEntries,tokenize}=api();
 const input=[item('UC-001','UC-313參考資料'),{id:'UC-313',title:'實作紀錄'}];
 for(const q of ['UC-313','UC313','uc313','#313','ＵＣ３１３'])assert.equal(rankEntries(input,tokenize(q))[0].id,'UC-313');
 assert.deepEqual(ids(rankEntries([item('UC-001','其他用途'),item('UC-002','其他用途','',{tags:['收件匣']})],['收件匣'])),['UC-002','UC-001']);
});
test('real corpus: salary purpose precedes prohibition while recall and all filters stay unchanged',()=>{
 const {rankEntries,filterEntries,parseFile,tokenize}=api();
 const entries=['cases','evidence'].flatMap(dir=>fs.readdirSync(dir).filter(n=>n.endsWith('.md')).flatMap(n=>Array.from(parseFile(dir+'/'+n,fs.readFileSync(dir+'/'+n,'utf8'))))).concat(Array.from(parseFile('sources/pending.md',fs.readFileSync('sources/pending.md','utf8'))));
 for(const q of ['薪水','收件匣','旅遊','驗收','UC313','不存在的工作987'])for(const f of [{},{scenario:'工作'},{kind:'pending'},{tool:'Grok Bot'},{category:'旅遊／消費研究'},{proof:'作者報告／示範'}]){
  const terms=tokenize(q),matches=filterEntries(entries,terms,f);
  assert.deepEqual(ids(rankEntries(matches,terms)).sort(),ids(matches).sort());
 }
 const salary=ids(rankEntries(filterEntries(entries,tokenize('薪水'),{}),tokenize('薪水')));
 assert(salary.includes('UC-230')&&salary.includes('UC-024'));
 assert(salary.indexOf('UC-230')<salary.indexOf('UC-024'));
});

test('distinct purpose terms beat metadata coverage; repeats and frequency do not boost rank',()=>{
 const {rankEntries,tokenize}=api();
 const input=[item('UC-001','薪資薪資薪資','',{tags:['報表']}),item('UC-002','薪資','報表'),item('UC-003','薪資','報表報表報表')];
 assert.deepEqual(ids(rankEntries(input,tokenize('薪水 報表'))),['UC-002','UC-003','UC-001']);
 assert.deepEqual(ids(rankEntries(input,tokenize('薪水 薪水 報表'))),['UC-002','UC-003','UC-001']);
});

test('short and numeric IDs remain exact even when a reference title would otherwise win',()=>{
 const {rankEntries,tokenize}=api();
 for(const [target,queries] of [['UC-001',['1','UC1','UC 1','UC-1']],['UC-313',['313','UC313']],['P-003',['P3','P 3','p-3']]]){
  const input=[item('UC-999','參考 '+queries.join(' ')+' '+target),item(target,'實作紀錄')];
  for(const q of queries)assert.equal(rankEntries(input,tokenize(q))[0].id,target,q);
 }
});

test('problem goal is included in focused results and ranked ahead of body-only mentions',()=>{
 const {rankEntries,filterEntries,parseFile,tokenize,searchContext}=api();
 const [travel]=parseFile('cases/001-travel-checkout.md',fs.readFileSync('cases/001-travel-checkout.md','utf8'));
 const terms=tokenize('人工購買決策');
 const incidental=item('UC-999','其他用途','',{search:'人工購買決策',kind:'case'});
 assert.deepEqual(ids(filterEntries([incidental,travel],terms,{scope:'overview',scenario:'生活'})),['UC-001']);
 assert.equal(searchContext(travel,terms).matches[0].label,'解決痛點');
 assert.deepEqual(ids(rankEntries([incidental,travel],terms)),['UC-001','UC-999']);
 assert.deepEqual(ids(filterEntries([travel],terms,{scope:'overview',scenario:'工作'})),[]);
});
