/* Keep native browser printing complete without changing the reading session. */
(function(root){
  'use strict';
  function createPrintSession(dialog,doc){
    let saved=null;
    return {
      before(){
        if(saved||!dialog?.open)return;
        saved={details:[...dialog.querySelectorAll('details')].map(node=>[node,node.open]),
          scroll:dialog.scrollTop,active:doc.activeElement};
        saved.details.forEach(([node])=>{node.open=true;});
      },
      after(){
        if(!saved)return;
        const state=saved;saved=null;
        state.details.forEach(([node,open])=>{if(node.isConnected)node.open=open;});
        if(!dialog.open)return;
        if(state.active?.isConnected&&dialog.contains(state.active))state.active.focus({preventScroll:true});
        dialog.scrollTop=state.scroll;
      }
    };
  }
  function enhance(body,item){
    const button=document.createElement('button');
    button.type='button';button.id='print-case';button.className='btn-print-case';
    button.textContent='列印／存成 PDF';
    button.title='包含完整原始研究、限制與來源；可在瀏覽器列印視窗存成 PDF';
    button.addEventListener('click',()=>window.print());
    body.querySelector('.detail-actions').append(button);
    const note=document.createElement('p');note.className='print-case-address';
    const link=document.createElement('a');
    const url=new URL(location.pathname,location.origin);url.searchParams.set('case',item.id);
    link.href=url.href;link.textContent=url.href;
    note.append('AI 用法實驗室 · 案例連結：',link,document.createElement('br'));
    const source=document.createElement('a');
    source.href=body.querySelector('.detail-source').href;source.textContent=source.href;
    note.append('Markdown 原文：',source);
    body.querySelector('.detail-actions').after(note);
  }
  const api={createPrintSession,enhance};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root.document){
    root.CasePrint=api;
    const session=createPrintSession(document.getElementById('detail'),document);
    root.addEventListener('beforeprint',()=>session.before());
    root.addEventListener('afterprint',()=>session.after());
  }
})(globalThis);
