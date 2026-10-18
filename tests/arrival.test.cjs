'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
function api(){
 const context=vm.createContext({URL,URLSearchParams});
 vm.runInContext(source+'\nthis.api={searchLink,hasSearchArrival};',context);
 return context.api;
}
test('search links preserve exact terms and all facets under the Pages base path',()=>{
 const {searchLink}=api();
 const url=new URL(searchLink('https://example.org/ai-agent-use-cases/?case=UC-005&tracking=secret#other','「旅遊」 & <文字>',{scenario:'生活',kind:'pending',tool:'Grok Bot',category:'旅遊／消費研究',proof:'尚待查證'}));
 assert.equal(url.pathname,'/ai-agent-use-cases/');
 assert.equal(url.searchParams.get('q'),'「旅遊」 & <文字>');
 assert.equal(url.searchParams.get('category'),'旅遊／消費研究');
 assert.equal(url.searchParams.get('tool'),'Grok Bot');
 assert.equal(url.searchParams.get('scenario'),'生活');
 assert.equal(url.searchParams.get('kind'),'pending');
 assert.equal(url.searchParams.get('proof'),'尚待查證');
 assert.equal(url.searchParams.size,6);assert.equal(url.hash,'#explore');
});
test('unfiltered links still target the collection and never leak unrelated URL state',()=>{
 const {searchLink}=api();
 assert.equal(searchLink('https://example.org/repo/index.html?case=UC-005&token=private','',{}),'https://example.org/repo/index.html#explore');
});
test('arrival distinguishes search intent from the homepage and explicit other anchors',()=>{
 const {hasSearchArrival}=api();
 const check=(query,hash='')=>hasSearchArrival(new URLSearchParams(query),hash);
 for(const query of ['q=旅遊','scenario=未知情境','kind=pending','tool=Grok+Bot','category=旅遊','proof=尚待查證'])assert.equal(check(query),true);
 for(const query of ['','case=UC-005','tracking=value','q=+++'])assert.equal(check(query),false);
 assert.equal(check('','#explore'),true);
 assert.equal(check('q=旅遊','#discover'),false);
});
