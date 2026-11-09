'use strict';
// The homepage is a long editorial page: the search field sits under the hero, the
// task directory and the random-draw stage. Three things therefore have to hold for
// a keyboard or screen-reader visitor:
//   1. the bypass link must land in the search field, not in the draw stage,
//   2. typing must not speak the draw status (pool count) on every keystroke, and
//   3. a card the reader replaced by choosing a facet must still be announced.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const appSource=fs.readFileSync(path.join(root,'assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const realDiscovery=require('../assets/discovery.js');

function discoverySpy(){
  let built=0;
  return {
    module:{...realDiscovery,createDeck:(...args)=>{built+=1;return realDiscovery.createDeck(...args);}},
    get built(){return built;}
  };
}
function fixture(){
  const nodes={
    'draw-case':{disabled:false,textContent:''},
    'drawn-case':{replaceChildren:()=>{},setAttribute:()=>{},querySelector:()=>null},
    'draw-status':{textContent:''},
    'draw-announcer':{textContent:''},
    scenario:{value:''},
    difficulty:{value:''},
    query:{value:''}
  };
  const spy=discoverySpy();
  const context=vm.createContext({
    document:{activeElement:{},getElementById:id=>nodes[id],querySelectorAll:()=>[],createElement:tag=>({tagName:tag,className:'',textContent:'',dataset:{},children:[],append(){},setAttribute(){}})},
    window:{matchMedia:()=>({matches:false}),innerHeight:900},
    Discovery:spy.module,entries:[],innerHeight:900,Math,Date
  });
  vm.runInContext(appSource+`
    card=()=>({tagName:'ARTICLE'});
    const realAnnounce=announceDraw;
    const writes=[];
    announceDraw=(text,key)=>{writes.push(text);return realAnnounce(text,key);};
    this.api={
      sync(list,query){if(query!==undefined)document.getElementById('query').value=query;discoveryReady=true;syncDiscovery(list);},
      setDrawn(id){drawnItemId=id;},
      drawWith(deck){discoveryReady=true;discoveryDeck=deck;drawNext(true);},
      writes(){return [...writes];}
    };`,context);
  return {api:context.api,nodes,spy};
}
const caseItem=(id,title)=>({id,title,kind:'case'});

test('the bypass link goes to the search field and names it',()=>{
  const skip=html.match(/<a class="skip"[^>]*>([^<]*)<\/a>/);
  assert.ok(skip,'index.html must keep a skip link');
  assert.match(skip[0],/href="#query"/,'the skip link must target the search field, not the draw stage');
  assert.match(skip[1],/搜尋/,'the skip link must say it goes to search');
  assert.match(html,/<input id="query"/,'the target must be the search input');
});

test('the draw status is visible text, not a live region that fires per keystroke',()=>{
  const status=html.match(/<p id="draw-status"[^>]*>/);
  assert.ok(status,'#draw-status must stay in the markup');
  assert.doesNotMatch(status[0],/aria-live|role="status"/,'#draw-status changes with every keystroke, so it cannot be a live region');
  const announcer=html.match(/<p id="draw-announcer"[^>]*>/);
  assert.ok(announcer,'an announcer must carry draw announcements');
  assert.match(announcer[0],/aria-live="polite"/);
  assert.match(announcer[0],/role="status"/);
});

test('the outcome count is not a second live region for the same event',()=>{
  const outcome=html.match(/<span id="filter-outcome-count"[^>]*>/);
  assert.ok(outcome,'#filter-outcome-count must stay in the markup');
  assert.doesNotMatch(outcome[0],/aria-live|role="status"/,'#results-count already announces the same count; do not speak it twice');
  assert.match(html,/<p id="results-count"[^>]*role="status"[^>]*aria-live="polite"/,'the result line remains the single live count');
});

test('the chip wall is announced as a group, not as a single-stop toolbar',()=>{
  const chips=html.match(/<div class="scenario-chips"[^>]*>/);
  assert.ok(chips,'#scenario-chips must stay in the markup');
  assert.match(chips[0],/role="group"/,'a toolbar promises one tab stop and arrow keys; these chips are plain buttons');
  assert.doesNotMatch(chips[0],/role="toolbar"/);
});

test('an unchanged pool neither rebuilds the deck nor rewrites the status',()=>{
  const {api,nodes,spy}=fixture();
  const pool=[caseItem('UC-1','one'),caseItem('UC-2','two')];
  api.sync(pool,'會議');
  const built=spy.built;
  assert.equal(built,1,'the first render must build a deck');
  nodes['draw-status'].textContent='sentinel';
  api.sync(pool,'會議');
  assert.equal(spy.built,built,'an identical pool must not rebuild the deck');
  assert.equal(nodes['draw-status'].textContent,'sentinel','an identical pool must not rewrite the status line');
});

test('keeping the drawn card speaks nothing; the visible status still reports it',()=>{
  const {api,nodes,spy}=fixture();
  api.setDrawn('UC-1');
  api.sync([caseItem('UC-1','kept'),caseItem('UC-2','other')],'會議');
  assert.match(nodes['draw-status'].textContent,/目前顯示：kept/);
  assert.equal(JSON.stringify(api.writes()),'[]','a card that stays on screen is not news');
  assert.equal(spy.built,1);
});

test('typing that replaces the card speaks nothing',()=>{
  const {api,nodes}=fixture();
  api.sync([caseItem('UC-1','one'),caseItem('UC-2','two')],'會');
  api.setDrawn('UC-9'); // the next keystroke narrows the pool past the drawn card
  api.sync([caseItem('UC-1','one')],'會議');
  assert.match(nodes['draw-status'].textContent,/第 1 張：one/,'the visible line still reports the new card');
  assert.equal(JSON.stringify(api.writes()),'[]','typing must not announce the card it replaced');
});

test('choosing a facet that replaces the card speaks the new title',()=>{
  const {api}=fixture();
  api.sync([caseItem('UC-1','one'),caseItem('UC-2','two')],'會議');
  api.setDrawn('UC-9');
  api.sync([caseItem('UC-2','two')],'會議');
  assert.equal(JSON.stringify(api.writes()),JSON.stringify(['已換一張：two']),'a replacement caused by a facet change is news');
});

test('a reader-requested redraw announces once and names the new case',()=>{
  const {api,nodes}=fixture();
  const deck={next:()=>({item:caseItem('UC-1','one'),total:2,round:1,position:1})};
  api.drawWith(deck);
  assert.equal(JSON.stringify(api.writes()),JSON.stringify(['已換一張：one']));
  api.drawWith(deck);
  assert.equal(nodes['draw-announcer'].textContent,'已換一張：one');
  assert.equal(JSON.stringify(api.writes()),JSON.stringify(['已換一張：one']),'drawing the same card again is not an announcement');
});

test('an empty pool announces once, and again after the reader leaves and returns',()=>{
  const {api}=fixture();
  const evidenceOnly=[{id:'UC-1',title:'one',kind:'evidence'}];
  api.sync(evidenceOnly,'發票');
  assert.equal(JSON.stringify(api.writes()),JSON.stringify(['目前沒有可抽的案例卡；下方搜尋結果仍可閱讀。']));
  api.sync(evidenceOnly,'發票');
  assert.equal(api.writes().length,1,'the same empty state is not repeated while it lasts');
  api.sync([caseItem('UC-2','two')],'發票');
  api.setDrawn('UC-2');
  api.sync(evidenceOnly,'發票');
  assert.equal(JSON.stringify(api.writes()),JSON.stringify([
    '目前沒有可抽的案例卡；下方搜尋結果仍可閱讀。',
    '已換一張：two',
    '目前沒有可抽的案例卡；下方搜尋結果仍可閱讀。'
  ]),'leaving and re-entering the empty state must be announced again');
});
