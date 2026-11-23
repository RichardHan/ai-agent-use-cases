'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context=vm.createContext({URL,URLSearchParams,Discovery:require('../assets/discovery.js')});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0]+
  '\nthis.api={addedDate,metadata,orderEntries,searchLink,caseLink,hasSearchArrival,filterSummary,pageContextTitle};',context);
const api=context.api;

test('first collection uses the first explicit lead value, independently of later reviews',()=>{
  for(const field of ['首次收錄','首次收錄日期','首次收錄／最近查證','首次收錄、最近查證','首次收錄／查證']){
    assert.equal(api.addedDate('# 案例\n- '+field+'：2026-10-13／2026-11-23\n## 補充\n- 首次收錄：2026-11-24'),'2026-10-13',field);
  }
  assert.equal(api.addedDate('# 案例\n- 首次收錄／最近查證：2026-10-17；2026-10-19補來源B；2026-10-20補來源C'),'2026-10-17');
  assert.equal(api.addedDate('## P-001\n- 首次收錄：2024-02-29 08:30（台灣時間）'),'2024-02-29');
  for(const value of ['未記錄／2026-11-23','未知；查證 2026-11-23','2026-02-30／2026-11-23','2026-13-01','2026-11-230']){
    assert.equal(api.addedDate('# 案例\n- 首次收錄／最近查證：'+value),'',value);
  }
  for(const body of ['- 發布日期：2026-11-23','- 查證日期：2026-11-23','- 日期：2026-11-23','2026-11-23：首次收錄。',
    '## 版本紀錄\n- 首次收錄：2026-11-23','### 來源\n- 首次收錄：2026-11-23','###### 補充\n- 首次收錄：2026-11-23']){
    assert.equal(api.addedDate('# 案例\n'+body),'',body);
  }
});

test('real collection and review dates remain separate, including the newest cases',()=>{
  const dir=path.join(__dirname,'../cases'),files=fs.readdirSync(dir).filter(name=>name.endsWith('.md'));
  for(const [id,expected] of [['001','2026-10-13'],['286','2026-10-17'],['359','2026-10-19'],['680','2026-11-23'],['685','2026-11-23']]){
    const file=files.find(name=>name.startsWith(id+'-'));
    const item=api.metadata(fs.readFileSync(path.join(dir,file),'utf8'),'cases/'+file,'case');
    assert.equal(item.addedDate,expected,file);
    if(id==='001'||id==='359')assert.notEqual(item.addedDate,item.reviewedDate,file);
  }
  // A new spelling must not silently disappear from the sort.
  for(const file of files){
    const markdown=fs.readFileSync(path.join(dir,file),'utf8');
    const lead=markdown.replace(/^#[^\n]*\n/,'').split(/^#{2,6}\s/m)[0];
    if(/^-\s*首次收錄[^：:\n]*[：:]\s*20\d{2}-\d{2}-\d{2}/m.test(lead))assert.ok(api.addedDate(markdown),file);
  }
});

test('new additions outrank recently checked old entries, with stable relevance ties and unknown dates last',()=>{
  const items=[
    {id:'old',title:'旅遊',summary:'',addedDate:'2026-10-13',reviewedDate:'2026-11-24'},
    {id:'new-body',title:'其他',summary:'旅遊',addedDate:'2026-11-23',reviewedDate:'2026-11-23'},
    {id:'new-title',title:'旅遊',summary:'',addedDate:'2026-11-23',reviewedDate:'2026-11-23'},
    {id:'unknown',title:'旅遊',summary:'',reviewedDate:'2026-11-25'}
  ];
  const before=JSON.stringify(items),ids=sort=>Array.from(api.orderEntries(items,['旅遊'],sort),item=>item.id);
  assert.deepEqual(ids('added'),['new-title','new-body','old','unknown']);
  assert.deepEqual(ids('reviewed'),['unknown','old','new-title','new-body']);
  assert.deepEqual(ids(''),['old','new-title','unknown','new-body']);
  assert.deepEqual(ids('invalid'),ids(''));
  assert.deepEqual(Array.from(api.orderEntries([],[],'added')),[]);
  assert.equal(JSON.stringify(items),before);
});

test('newest-added survives search and case links, arrival, collapsed controls and page titles',()=>{
  const href='https://example.org/ai-agent-use-cases/?token=private&case=UC-001#other';
  const search=new URL(api.searchLink(href,'旅遊',{scenario:'生活',kind:'case',scope:'overview'},'added'));
  assert.equal(search.searchParams.get('sort'),'added');
  assert.equal(search.searchParams.get('q'),'旅遊');
  assert.equal(search.searchParams.get('scenario'),'生活');
  assert.equal(search.searchParams.get('scope'),'overview');
  assert.equal(search.searchParams.has('token'),false);
  assert.equal(search.hash,'#explore');
  const detail=new URL(api.caseLink(search.href,'UC-680'));
  assert.equal(detail.searchParams.get('case'),'UC-680');
  assert.equal(detail.searchParams.get('sort'),'added');
  assert.equal(api.hasSearchArrival(new URLSearchParams('sort=added'),''),true);
  assert.equal(api.hasSearchArrival(new URLSearchParams('sort=added'),'#discover'),false);
  assert.equal(api.hasSearchArrival(new URLSearchParams('sort=toString'),''),false);
  assert.equal(api.filterSummary(0,'added'),'未設定篩選 · 最新新增優先');
  assert.match(api.pageContextTitle({added:true}),/最新新增的內容/);
  assert.match(api.pageContextTitle({added:true,query:'旅遊'}),/搜尋「旅遊」.*最新新增/);
});
