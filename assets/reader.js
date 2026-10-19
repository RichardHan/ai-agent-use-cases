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
  // Route only to actual rendered source sections; matching never qualifies evidence.
  function selectSearchSections(sections,terms){
    const normalize=text=>text.normalize('NFKC').toLocaleLowerCase();
    const used=new Set(),matches=[];
    for(const {term,variants} of terms){
      for(let index=0;index<sections.length;index++){
        const section=sections[index],text=normalize(section.title+'\n'+section.text);
        const variant=variants.find(value=>value&&text.includes(normalize(value)));
        if(!variant)continue;
        if(!used.has(index)){
          used.add(index);matches.push({index,term,variant,title:section.title});
        }
        break;
      }
      if(matches.length===2)break;
    }
    return matches;
  }
  // Keep quotes within one original block. Normalization is for matching only;
  // grapheme offsets map the excerpt back to the unchanged source characters.
  function selectSearchPassage(blocks,variant){
    const normalize=text=>text.normalize('NFKC').toLocaleLowerCase();
    const needle=normalize(variant);
    if(!needle)return null;
    const index=blocks.findIndex(text=>normalize(text).includes(needle));
    if(index===-1)return null;
    const text=blocks[index],limit=240;
    if(Array.from(text).length<=limit)return {index,excerpt:text,partial:false};
    if(typeof Intl==='undefined'||typeof Intl.Segmenter!=='function')return {index,excerpt:null,partial:true};
    const segments=[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text)];
    let projected='',offsets=[];
    for(const {segment,index:start} of segments){
      const value=normalize(segment);
      for(let i=0;i<value.length;i++)offsets.push({start,end:start+segment.length});
      projected+=value;
    }
    // Context-sensitive casing may differ across a grapheme boundary. Keep the
    // real passage destination, but omit a quote if it cannot be mapped exactly.
    const at=projected.indexOf(needle);
    if(projected!==normalize(text)||at===-1||Array.from(variant).length>limit)return {index,excerpt:null,partial:true};
    const first=offsets[at].start,last=offsets[at+needle.length-1].end;
    const hitStart=segments.findIndex(s=>s.index===first);
    const hitEnd=segments.findIndex(s=>s.index+s.segment.length===last)+1;
    if(hitEnd-hitStart>limit)return {index,excerpt:null,partial:true};
    let start=Math.max(0,hitStart-60),end=Math.min(segments.length,start+limit);
    if(hitEnd>end){end=hitEnd;start=Math.max(0,end-limit);}
    const from=segments[start].index,to=end<segments.length?segments[end].index:text.length;
    return {index,excerpt:(from?'…':'')+text.slice(from,to)+(to<text.length?'…':''),partial:true};
  }
  // This is an index of original headings, never an evidence classification.
  function selectReviewSections(sections){
    return sections.flatMap((section,index)=>{
      const caution=/限制|權限|費用|可用性|驗收|可重現|缺口|缺漏|風險|證據|未驗證/.test(section.title);
      const linkCount=section.linkCount||0;
      return linkCount||caution?[{index,title:section.title,linkCount,caution}]:[];
    });
  }
  function enhance(body,item,searchTerms=[]){
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
    // Collect before inserting reader controls so their labels cannot become hits.
    const sourceSummary=research.querySelector('summary');
    const sourceSections=[{title:'',text:'',target:sourceSummary,links:new Set(),passages:[]}];
    for(const block of markdown.children){
      if(/^H[23]$/.test(block.tagName))sourceSections.push({title:block.textContent,text:'',target:block,links:new Set(),passages:[]});
      const section=sourceSections[sourceSections.length-1];
      section.text+='\n'+(/^[UO]L$/.test(block.tagName)?[...block.children].map(row=>row.textContent).join('\n'):block.textContent);
      const passages=/^[UO]L$/.test(block.tagName)?[...block.children]:/^(P|PRE|BLOCKQUOTE)$/.test(block.tagName)?[block]:[];
      section.passages.push(...passages);
      for(const link of block.querySelectorAll('a')){
        const href=link.getAttribute('href')||'';
        section.text+='\n'+href;
        if(/^https?:\/\//i.test(href))section.links.add(href);
      }
    }
    const searchMatches=selectSearchSections(sourceSections,searchTerms);
    if(searchMatches.length){
      const search=make('section','reader-search');
      search.setAttribute('aria-labelledby','reader-search-title');
      const title=make('h2','','接著核對搜尋命中');title.id='reader-search-title';
      search.append(title,make('p','reader-search-note','命中也可能是限制或否定敘述，不代表已完成。前往原文，連同上下文一起讀。'));
      for(const match of searchMatches){
        const target=sourceSections[match.index].target;
        if(target===sourceSummary)target.id='reader-source-meta';
        const button=make('button','reader-search-jump');button.type='button';
        button.setAttribute('aria-controls',target===sourceSummary?target.id:`reader-section-${headings.indexOf(target)}`);
        const relation=match.term===match.variant?'「'+match.term+'」':'「'+match.term+'」→「'+match.variant+'」';
        button.append(make('strong','',relation),make('span','reader-target','原文 · '+(match.title||'頁首資料')+' ↓'));
        button.addEventListener('click',()=>{research.open=true;moveTo(target);});
        const group=make('div','reader-search-match');
        group.append(button);
        const section=sourceSections[match.index];
        const titleHit=section.title.normalize('NFKC').toLocaleLowerCase().includes(match.variant.normalize('NFKC').toLocaleLowerCase());
        const passage=titleHit?null:selectSearchPassage(section.passages.map(node=>node.textContent),match.variant);
        if(passage){
          if(passage.excerpt){
            group.append(make('p','reader-search-excerpt-label',passage.partial?'命中附近原文 · 節錄，非完整段落':'命中這段原文 · 限制請連同全文核對'),
              make('p','reader-search-excerpt',passage.excerpt));
          }
          const original=section.passages[passage.index];
          const destination=`reader-passage-${match.index}`;
          // Give only this existing source block an address; no text is replaced.
          original.id=destination;original.tabIndex=-1;
          const locate=make('button','reader-search-locate','定位這段原文 ↓');locate.type='button';
          locate.setAttribute('aria-controls',destination);
          locate.addEventListener('click',()=>{research.open=true;moveTo(original);});
          group.append(locate);
        }
        search.append(group);
      }
      overview.after(search);
    }
    const quick=make('div','reader-quick');
    selectJumps(titles).forEach(({index,label})=>{
      const button=jumpButton(index,'reader-jump');
      button.replaceChildren(make('strong','',label+' ↓'),make('span','reader-target',titles[index]));
      quick.append(button);
    });
    if(quick.children.length)nav.append(quick);
    const reviewSections=selectReviewSections(sourceSections.map(section=>({title:section.title,linkCount:section.links.size})));
    if(reviewSections.length){
      const review=make('details','reader-review');
      review.append(make('summary','',`逐段核對連結與限制（${reviewSections.length}）`),
        make('p','reader-review-note','依含網頁連結的段落與限制相關標題整理，不是獨立驗證，也不保證列出所有限制。連結可能是工具文件或延伸閱讀，請連同上下文判讀。'));
      const reviewList=make('ol','reader-review-list');
      for(const section of reviewSections){
        const target=sourceSections[section.index].target;
        if(target===sourceSummary)target.id='reader-source-meta';
        const button=make('button','reader-review-jump');button.type='button';
        button.setAttribute('aria-controls',target===sourceSummary?target.id:`reader-section-${headings.indexOf(target)}`);
        const position=target===sourceSummary?'頁首資料':`原文第 ${headings.indexOf(target)+1} 段`;
        const basis=[section.linkCount?'含網頁連結':'',section.caution?'限制相關標題':''].filter(Boolean).join(' · ');
        button.append(make('span','',section.title||'頁首資料'),make('span','reader-target',position+' · '+basis+' ↓'));
        button.addEventListener('click',()=>{research.open=true;moveTo(target);});
        const row=make('li');row.append(button);reviewList.append(row);
      }
      review.append(reviewList);nav.append(review);
    }
    if(!headings.length){if(reviewSections.length)evidence.after(nav);return;}
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
  const api={selectJumps,selectReadingSection,selectSourceSection,selectMethodShortcut,selectSearchSections,selectSearchPassage,selectReviewSections,enhance};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CaseReader=api;
})(globalThis);
