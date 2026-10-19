/* Source DOM has already passed through the text-only Markdown renderer. */
(function(root){
  'use strict';
  // Only promote a complete primary section. Unknown or long structures stay in
  // the original research; never truncate away a later caveat or infer success.
  function selectReadingSection(sections,kind){
    if(kind==='pending')return -1;
    const eligible=({title,text})=>text.trim().length>0&&text.length<=3200&&
      !/本庫|設計|建議|預期|提示詞|補充|未測|未實|可參考/.test(title);
    for(const pattern of [
      /^(?:問題.*(?:實作|結果|成果|實際使用)|(?:原)?作者.*(?:實作|實際|做了|結果|完成範圍)|來源報告(?:與限制)?)$/,
      /^(?:已讀來源版本|來源版本|來源說了什麼|來源與能確認的範圍)$/
    ]){
      const index=sections.findIndex(section=>eligible(section)&&pattern.test(section.title));
      if(index!==-1)return index;
    }
    return -1;
  }
  const sourceHeading=/來源|參考資料|原始連結|作者.*日期/;
  function selectSourceSection(sections){
    const isSource=section=>sourceHeading.test(section.title)&&
      !/步驟|操作|流程|設計|建議|提示詞|預期/.test(section.title);
    const linked=sections.findIndex(section=>isSource(section)&&section.hasLinks);
    return linked!==-1?linked:sections.findIndex(isSource);
  }
  function selectJumps(titles){
    const used=new Set();
    const intents=[
      ['實作與結果',[/問題|實作|做了|結果|發生|來源報告/]],
      ['方法與步驟',[/步驟|操作流程|參考流程|建議流程|怎麼開始|方法|可參考/,/提示詞|可貼指令/]],
      ['限制與權限',[/權限|費用|可用性/,/限制|證據.*缺|驗收/]],
      ['來源與版本',[sourceHeading]]
    ];
    return intents.flatMap(([label,patterns])=>{
      let index=-1;
      for(const pattern of patterns){
        index=titles.findIndex((title,i)=>!used.has(i)&&pattern.test(title));
        if(index!==-1)break;
      }
      if(index===-1)return [];
      used.add(index);
      return [{label,index,title:titles[index]}];
    });
  }
  function selectMethodShortcut(titles,kind){
    if(kind==='pending')return null;
    const method=selectJumps(titles).find(jump=>jump.label==='方法與步驟');
    return method?{index:method.index,title:method.title}:null;
  }
  function enhance(body,item){
    const research=body.querySelector('.research-details');
    const markdown=research?.querySelector('.markdown');
    if(!markdown)return;
    const make=(tag,cls,text)=>{
      const node=document.createElement(tag);
      if(cls)node.className=cls;
      if(text!==undefined)node.textContent=text;
      return node;
    };
    const overview=body.querySelector('.plain-overview');
    const headings=[...markdown.querySelectorAll('h2,h3')];
    const titles=headings.map(h=>h.textContent);
    // Copy the original leading metadata, never inferred proof classifications.
    const proofRows=[];
    for(const block of markdown.children){
      if(/^H[23]$/.test(block.tagName))break;
      if(block.tagName==='UL')for(const row of block.children){
        if(/^(?:來源證據|證據狀態|證據等級|證據|獨立重現|狀態)\s*[：:]/.test(row.textContent))proofRows.push(row);
      }
    }
    const evidence=make('aside','reader-evidence');
    evidence.setAttribute('aria-label','頁首證據說明');
    evidence.append(make('h2','','頁首證據說明'));
    if(proofRows.length){
      const list=make('ul');
      proofRows.forEach(row=>list.append(row.cloneNode(true)));
      evidence.append(list);
    }else{
      evidence.append(make('p','',item.kind==='pending'?'原文未列統一證據欄位；這是待查線索，請核對原文的狀態與缺漏。':'原文未列統一證據欄位，請核對全文中的來源與限制。'));
    }
    const warning=body.querySelector('.detail-warning');
    if(warning)evidence.append(warning);
    evidence.append(make('p','reader-evidence-footnote','以上沿用原文頁首；後續補充的來源與限制，請依各段文字判讀。'));
    // Put the actual purpose first; retain every original proof row below it.
    overview.after(evidence);
    const dialog=body.closest('dialog');
    const nav=make('nav','reader-nav');
    nav.setAttribute('aria-label','案例閱讀導覽');
    const navTitle=make('h2','','你想先了解哪一段？');
    navTitle.tabIndex=-1;
    navTitle.id='reader-nav-title';
    nav.append(navTitle,make('p','reader-nav-hint','收錄不代表本庫獨立重現。點選段落看原文；流程與提示詞的實測狀態依原標題判讀。'));
    const moveTo=target=>{
      // scrollIntoView may also scroll the inert page behind a modal.
      const toolbar=dialog.querySelector('.detail-toolbar');
      dialog.scrollTo({top:dialog.scrollTop+target.getBoundingClientRect().top-dialog.getBoundingClientRect().top-toolbar.getBoundingClientRect().height-18,behavior:'instant'});
      target.focus({preventScroll:true});
    };
    const jump=index=>{research.open=true;moveTo(headings[index]);};
    const jumpButton=(index,cls)=>{
      const button=make('button',cls,titles[index]);
      button.type='button';
      button.dataset.readerIndex=index;
      button.setAttribute('aria-controls',`reader-section-${index}`);
      button.addEventListener('click',()=>jump(index));
      return button;
    };
    const primary=[...markdown.children].filter(node=>node.tagName==='H2').map(heading=>{
      const nodes=[];
      for(let next=heading.nextElementSibling;next&&next.tagName!=='H2';next=next.nextElementSibling)nodes.push(next);
      return {title:heading.textContent,text:nodes.map(node=>node.textContent).join('\n'),heading,nodes};
    });
    const readingIndex=selectReadingSection(primary,item.kind);
    const report=make('section','reader-report');
    report.setAttribute('aria-label','原文紀錄先讀');
    if(readingIndex!==-1){
      const selected=primary[readingIndex];
      report.append(make('p','reader-report-label','原文紀錄先讀 · 非本庫實測'),make('h2','',selected.title),
        make('p','reader-report-note','以下完整保留案例研究的這個段落，並非外部來源的逐字引文；其他版本與限制請一併核對。'));
      const content=make('div','reader-report-content');
      selected.nodes.forEach(node=>content.append(node.cloneNode(true)));
      report.append(content,jumpButton(headings.indexOf(selected.heading),'reader-report-open'));
      report.lastChild.textContent='到完整研究核對這一段 ↓';
      report.dataset.sectionTitle=selected.title;
    }else{
      report.append(make('h2','',item.kind==='pending'?'先確認待查缺口':'先核對原始紀錄'),
        make('p','reader-report-note',item.kind==='pending'?'這是待查線索，沒有可當成實際成果的紀錄。請先閱讀缺漏與來源。':'這篇未提供適合提前完整呈現的短段落。請從原始研究核對實作、來源與限制。'));
      const open=make('button','reader-report-open','開啟原始研究 ↓');
      open.type='button';
      open.addEventListener('click',()=>{research.open=true;moveTo(research.querySelector('summary'));});
      report.append(open);
    }
    const sourceIndex=selectSourceSection(headings.map(heading=>{
      let hasLinks=false;
      for(let next=heading.nextElementSibling;next&&!/^H[23]$/.test(next.tagName);next=next.nextElementSibling){
        if(next.querySelector('a'))hasLinks=true;
      }
      return {title:heading.textContent,hasLinks};
    }));
    if(sourceIndex!==-1){
      const sources=jumpButton(sourceIndex,'reader-report-open');
      sources.textContent='核對來源與版本 ↓';report.append(sources);
    }
    overview.after(report);
    const method=selectMethodShortcut(titles,item.kind);
    if(method){
      const shortcut=jumpButton(method.index,'reader-method-shortcut');
      shortcut.replaceChildren(make('strong','','前往方法與步驟 ↓'),make('span','reader-target',method.title));
      // Preserve the original qualification beside the action, including untested designs.
      overview.append(shortcut);
    }
    if(!headings.length)return;
    const quick=make('div','reader-quick');
    selectJumps(titles).forEach(({index,label})=>{
      const button=jumpButton(index,'reader-jump');
      button.replaceChildren(make('strong','',label+' ↓'),make('span','reader-target',titles[index]));
      quick.append(button);
    });
    if(quick.children.length)nav.append(quick);
    const full=make('details','reader-outline');
    full.append(make('summary','',`全部段落（${headings.length}）`));
    const list=make('ol');
    headings.forEach((heading,index)=>{
      heading.id=`reader-section-${index}`;
      heading.tabIndex=-1;
      const li=make('li',heading.tagName==='H3'?'reader-subsection':'');
      li.append(jumpButton(index,'reader-outline-jump'));
      list.append(li);
      const back=make('button','reader-return','↑ 回到閱讀導覽');
      back.type='button';
      back.addEventListener('click',()=>moveTo(navTitle));
      heading.after(back);
    });
    full.append(list);
    nav.append(full);
    evidence.after(nav);
  }
  const api={selectJumps,selectReadingSection,selectSourceSection,selectMethodShortcut,enhance};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CaseReader=api;
})(globalThis);
