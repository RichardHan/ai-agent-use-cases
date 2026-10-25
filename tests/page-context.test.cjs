'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.CONTEXT_SOURCE||'assets/app.js','utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({URL,URLSearchParams,Discovery:require('../assets/discovery.js')});
vm.runInContext(source+'\nthis.format=typeof pageContextTitle==="function"?pageContextTitle:null;',context);
const title=state=>{assert.equal(typeof context.format,'function','browser titles must follow the visible reading/search state');return context.format(state);};
const brand='AI 用法實驗室';
test('home, keyword, facet-only, difficulty and review sort describe every active condition',()=>{
 assert.equal(title({}),'AI 用法實驗室 · 案例庫');
 assert.equal(title({query:'旅遊',facets:['生活','Grok Bot']}),'搜尋「旅遊」 · 生活 · Grok Bot｜'+brand);
 assert.equal(title({facets:['工作','經驗與踩坑','作者報告／示範']}),'篩選案例 · 工作 · 經驗與踩坑 · 作者報告／示範｜'+brand);
 assert.equal(title({difficulty:'進階開發'}),'篩選案例 · 進階開發｜'+brand);
 assert.equal(title({query:'PR',facets:['開發'],difficulty:'進階開發'}),'搜尋「PR」 · 開發 · 進階開發｜'+brand);
 assert.equal(title({reviewed:true}),'最近核對的內容｜'+brand);
 assert.equal(title({query:'旅遊',reviewed:true}),'搜尋「旅遊」 · 最近核對｜'+brand);
});
test('visible detail wins over loading, failed, missing and background search state',()=>{
 const item={id:'UC-001',title:'規劃旅行，先把交通和住宿比清楚'};
 assert.equal(title({item,query:'郵件',loading:true,error:true,missing:true,partial:true}),item.id+' · '+item.title+'｜'+brand);
});
test('loading, error, incomplete results and missing cases never claim completed reading',()=>{
 assert.equal(title({loading:true,query:'郵件'}),'載入中 · 搜尋「郵件」｜'+brand);
 assert.equal(title({error:true,query:'郵件'}),'載入失敗 · 搜尋「郵件」｜'+brand);
 assert.equal(title({missing:true,query:'郵件'}),'找不到分享案例 · 搜尋「郵件」｜'+brand);
 assert.equal(title({partial:true,query:'郵件'}),'已載入內容 · 搜尋「郵件」｜'+brand);
 assert.equal(title({empty:true,query:'郵件'}),'沒有符合結果 · 搜尋「郵件」｜'+brand);
 assert.equal(title({partial:true,empty:true,query:'郵件'}),'已載入內容無符合結果 · 搜尋「郵件」｜'+brand);
});
test('multiline Unicode, long queries and HTML-like input remain literal readable text',()=>{
 assert.equal(title({query:'  旅遊\n  👩🏽‍💻  <script>alert(1)</script>  '}),'搜尋「旅遊 👩🏽‍💻 <script>alert(1)</script>」｜'+brand);
 const long=title({query:'旅'.repeat(1000)});assert(long.length<150);assert(long.includes('…'));assert(!/[\uD800-\uDBFF]$/.test(long));
 const item={id:'UC-400',title:'尚未獨立核對的長標題'.repeat(50)};assert.equal(title({item}),item.id+' · '+item.title+'｜'+brand,'source display titles retain their full caveats');
});
