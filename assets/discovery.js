/* Pure discovery rules shared by the browser and Node regression tests. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.Discovery=api;
})(globalThis,function(){
  'use strict';
  const scenarios=['生活','工作','省錢','學習','創作','開發'];
  function scenarioOf(markdown){
    const lead=markdown.split(/^##\s/m)[0];
    const value=lead.match(/^-\s*情境\s*[：:]\s*(.+)$/m)?.[1].replace(/[`*_]/g,'').trim()||'';
    return scenarios.includes(value)?value:'';
  }
  function discoveryPool(items,scenario=''){
    const seen=new Set();
    return items.filter(item=>{
      if(item.kind!=='case'||item.proof==='模板／文件核讀'||(scenario&&item.scenario!==scenario)||seen.has(item.id))return false;
      seen.add(item.id);return true;
    });
  }
  function createDeck(items,random=Math.random){
    const pool=items.slice();let bag=[],index=0,round=0,lastId=null;
    return {next(){
      if(!pool.length)return null;
      if(index===bag.length){
        bag=pool.slice();
        for(let i=bag.length-1;i>0;i--){
          const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];
        }
        if(bag.length>1&&bag[0].id===lastId)[bag[0],bag[1]]=[bag[1],bag[0]];
        index=0;round++;
      }
      const item=bag[index++];lastId=item.id;
      return {item,position:index,total:pool.length,round};
    }};
  }
  return {scenarioOf,discoveryPool,createDeck};
});
