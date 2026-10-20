'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function api(){
 const context=vm.createContext({URL,URLSearchParams});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0]+'\nthis.api={caseLink};',context);
 return context.api;
}
test('case sharing includes only reading conditions and current case, preserving Pages base path',()=>{
 const {caseLink}=api();
 const href='https://example.org/ai-agent-use-cases/?q='+encodeURIComponent('旅遊 <文字>')+'&scenario=生活&kind=case&tool=Grok%20Bot&category=行程&proof=作者報告&sort=reviewed&case=UC-999&unrelated=synthetic-marker&token=example-only&q=ignored#unrelated-fragment';
 const url=new URL(caseLink(href,'UC-001'));
 assert.equal(url.origin,'https://example.org');assert.equal(url.pathname,'/ai-agent-use-cases/');
 assert.deepEqual([...url.searchParams.keys()],['q','scenario','kind','tool','category','proof','sort','case']);
 for(const [key,value] of Object.entries({q:'旅遊 <文字>',scenario:'生活',kind:'case',tool:'Grok Bot',category:'行程',proof:'作者報告',sort:'reviewed',case:'UC-001'}))assert.equal(url.searchParams.get(key),value);
 assert.equal(url.hash,'#explore');assert.equal(new URL(href).searchParams.get('case'),'UC-999');
});
test('case sharing drops empty and unsupported sorting state, preserves unknown user-selected facets as text',()=>{
 const {caseLink}=api();
 const url=new URL(caseLink('https://example.org/?q=&scenario=&sort=invalid&tool='+encodeURIComponent('未知工具 <文字>')+'&unrelated=example#other','P-003'));
 assert.deepEqual([...url.searchParams], [['tool','未知工具 <文字>'],['case','P-003']]);assert.equal(url.pathname,'/');
 const direct=new URL(caseLink('https://example.org/ai-agent-use-cases/?case=old#other','UC-313'));
 assert.deepEqual([...direct.searchParams],[['case','UC-313']]);assert.equal(direct.hash,'#explore');
});
