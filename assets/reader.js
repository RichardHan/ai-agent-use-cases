/* Source DOM has already passed through the text-only Markdown renderer. */
(function(root){
  'use strict';
  const readingPositionTrackers=new WeakMap();
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
    // Leading tags already appear on cards. Prefer an original body section,
    // keeping metadata as a fallback and preserving each section's real index.
    const indices=sections.map((_,index)=>index);
    const readingOrder=[...indices.filter(index=>!sections[index].isMetadata),...indices.filter(index=>sections[index].isMetadata)];
    for(const {term,variants} of terms){
      for(const index of readingOrder){
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
    return {index,excerpt:(from?'…':'')+text.slice(from,to)+(to<text.length?'…':''),partial:from>0||to<text.length};
  }
  // This is an index of original headings, never an evidence classification.
  function selectReviewSections(sections){
    return sections.flatMap((section,index)=>{
      const caution=/限制|權限|費用|可用性|驗收|可重現|缺口|缺漏|風險|證據|未驗證/.test(section.title);
      const linkCount=section.linkCount||0;
      return linkCount||caution?[{index,title:section.title,linkCount,caution}]:[];
    });
  }
  // Only explicit prompt headings get a copy action; keep all qualifications.
  function selectCopySections(sections,kind){
    if(kind==='pending')return [];
    return sections.flatMap((section,index)=>
      /^(?:可複製提示詞|可貼指令)(?:[（(：:\s]|$)/.test(section.title)&&section.text.trim()?[index]:[]);
  }
  // Search only original titles, preserving order, duplicates and qualifications.
  function findOutlineSections(titles,query){
    const normalize=text=>text.normalize('NFKC').toLocaleLowerCase();
    const words=normalize(query).trim().split(/\s+/).filter(Boolean);
    return titles.flatMap((title,index)=>words.every(word=>normalize(title).includes(word))?[index]:[]);
  }
  // Mirror heading/fence boundaries of the existing renderer, copying source
  // Markdown so lists, code indentation and link destinations remain intact.
  function promptSections(markdown){
    const lines=markdown.split('\n'),headings=[];let code=false;
    for(let i=1;i<lines.length;i++){
      if(/^```/.test(lines[i])){code=!code;continue;}
      if(code)continue;
      const match=lines[i].match(/^(#{2,6})\s+(.+)/);
      if(match)headings.push({start:i,level:match[1].length,title:match[2]});
    }
    return headings.map((heading,index)=>{
      const next=headings.slice(index+1).find(other=>other.level<=heading.level);
      const end=next?next.start:lines.length;
      return {title:heading.title,text:lines.slice(heading.start+1,end).join('\n'),
        copyText:lines.slice(heading.start,end).join('\n').trim()};
    });
  }
  // Keep each list item's own words separate from its descendants. A match
  // must not be fabricated by concatenating the end of a parent and a child.
  function readingPassages(block){
    if(block.tagName==='TABLE')return [...block.children].flatMap(group=>[...group.children].flatMap(row=>[...row.children].map(cell=>({node:cell,text:cell.textContent}))));
    if(block.tagName==='DIV'&&block.className==='markdown-table')return [...block.children].flatMap(readingPassages);
    if(!/^[UO]L$/.test(block.tagName))return /^(P|PRE|BLOCKQUOTE)$/.test(block.tagName)?[{node:block,text:block.textContent}]:[];
    const passages=[];
    for(const row of block.children){
      let text='';
      const flush=()=>{if(text.trim())passages.push({node:row,text});text='';};
      for(const child of row.childNodes){
        if(/^[UO]L$/.test(child.tagName||'')){flush();passages.push(...readingPassages(child));}
        else text+=child.textContent;
      }
      flush();
    }
    return passages;
  }
  function selectReadingPosition(headings,marker,viewportBottom,contentBottom){
    if(!headings.length)return -1;
    if(contentBottom<=viewportBottom+1)return headings.length-1;
    let index=-1;
    for(let i=0;i<headings.length;i++){
      if(headings[i].getBoundingClientRect().top<=marker)index=i;
      else break;
    }
    return index<0?0:index;
  }
  function enhance(body,item,searchTerms=[]){
    const dialog=body.closest('dialog');
    if(dialog)readingPositionTrackers.get(dialog)?.();
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
    const proofNote=body.querySelector('.detail-proof-note');
    if(proofNote)evidence.prepend(proofNote);
    const warning=body.querySelector('.detail-warning');
    if(warning)evidence.append(warning);
    evidence.append(make('p','reader-evidence-footnote','以上沿用原文頁首；後續補充的來源與限制，請依各段文字判讀。'));
    // Put the actual purpose first; retain every original proof row below it.
    if(headings.length>=12){
      const open=make('button','reader-original-open',`查看完整原始研究、來源與提示詞（${headings.length} 段） ↓`);
      open.type='button';
      open.addEventListener('click',()=>{research.open=true;moveTo(research.querySelector('summary'));});
      const targetUser=overview.querySelector('.detail-target-user');
      if(targetUser)targetUser.before(open);else overview.append(open);
    }
    overview.after(evidence);
    const nav=make('nav','reader-nav');
    nav.setAttribute('aria-label','案例閱讀導覽');
    const navTitle=make('h2','','你想先了解哪一段？');
    navTitle.tabIndex=-1;
    navTitle.id='reader-nav-title';
    nav.append(navTitle,make('p','reader-nav-hint','收錄不代表本庫獨立重現。點選段落看原文；流程與提示詞的實測狀態依原標題判讀。'));
    if(headings.length>=12){
      const back=make('button','reader-return','↑ 回到閱讀導覽');
      back.type='button';
      back.addEventListener('click',()=>moveTo(navTitle));
      research.querySelector('summary').after(back);
    }
    const moveTo=target=>{
      // scrollIntoView may also scroll the inert page behind a modal.
      const toolbar=dialog.querySelector('.detail-toolbar');
      dialog.scrollTo({top:dialog.scrollTop+target.getBoundingClientRect().top-dialog.getBoundingClientRect().top-toolbar.getBoundingClientRect().height-18,behavior:'instant'});
      const table=target.closest('.markdown-table');
      if(table){
        const cell=target.getBoundingClientRect(),viewport=table.getBoundingClientRect();
        if(cell.left<viewport.left||cell.right>viewport.right)table.scrollLeft+=cell.left-viewport.left;
      }
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
      const targetUser=overview.querySelector('.detail-target-user');
      if(targetUser)targetUser.before(shortcut);else overview.append(shortcut);
    }
    // Collect before inserting reader controls so their labels cannot become hits.
    const sourceSummary=research.querySelector('summary');
    const sourceSections=[{title:'',text:'',isMetadata:true,target:sourceSummary,links:new Set(),passages:[]}];
    for(const block of markdown.children){
      if(/^H[23]$/.test(block.tagName))sourceSections.push({title:block.textContent,text:'',target:block,links:new Set(),passages:[]});
      const section=sourceSections[sourceSections.length-1];
      const passages=readingPassages(block);
      if(block.className==='markdown-table'){
        block.setAttribute('aria-label',`${section.title||'原文'}：表格；可左右捲動，鍵盤聚焦後可用左右方向鍵`);
        block.querySelector('table').setAttribute('aria-label',section.title||'原文表格');
      }
      section.text+='\n'+(/^[UO]L$/.test(block.tagName)||block.className==='markdown-table'?passages.map(passage=>passage.text).join('\n'):block.textContent);
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
        const passage=titleHit?null:selectSearchPassage(section.passages.map(passage=>passage.text),match.variant);
        if(passage){
          if(passage.excerpt){
            group.append(make('p','reader-search-excerpt-label',passage.partial?'命中附近原文 · 節錄，非完整段落':'命中這段原文 · 限制請連同全文核對'),
              make('p','reader-search-excerpt',passage.excerpt));
          }
          const original=section.passages[passage.index].node;
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
    // Capture source before injecting controls; never copy their labels.
    const copySections=promptSections(item.markdown||'');
    const copyIndices=new Set(copySections.length===headings.length?selectCopySections(copySections,item.kind):[]);
    const full=make('details','reader-outline');
    full.append(make('summary','',`全部段落（${headings.length}）`));
    const list=make('ol');
    headings.forEach((heading,index)=>{
      heading.id=`reader-section-${index}`;
      heading.tabIndex=-1;
      const li=make('li',heading.tagName==='H3'?'reader-subsection':'');
      li.value=index+1;
      li.append(jumpButton(index,'reader-outline-jump'));
      list.append(li);
      const back=make('button','reader-return','↑ 回到閱讀導覽');
      back.type='button';
      back.addEventListener('click',()=>moveTo(navTitle));
      heading.after(back);
      if(copyIndices.has(index)){
        const section=copySections[index],text=section.copyText;
        const controls=make('div','reader-copy');
        const copy=make('button','reader-copy-button','複製本段（含標題）');copy.type='button';
        copy.setAttribute('aria-label','複製本段（含標題）：'+section.title);
        const status=make('p','reader-copy-status');status.id=`reader-copy-status-${index}`;
        status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
        copy.setAttribute('aria-describedby',status.id);
        const manual=make('textarea','reader-copy-manual');manual.readOnly=true;manual.hidden=true;
        manual.setAttribute('aria-label','手動複製本段（含標題）：'+section.title);
        manual.setAttribute('aria-describedby',status.id);
        let request=0;
        copy.addEventListener('click',async()=>{
          const token=++request,focusAtRequest=document.activeElement;
          const current=()=>token===request&&controls.isConnected&&dialog.open;
          manual.hidden=true;manual.value='';status.textContent='正在複製…';
          try{
            if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
            await navigator.clipboard.writeText(text);
            if(current())status.textContent='已複製本段與原標題；請先核對限制，再依需求修改。';
          }catch{
            if(!current())return;
            status.textContent='無法自動複製。請手動複製下方完整文字，包含原標題。';
            manual.value=text;manual.hidden=false;
            if(document.activeElement===focusAtRequest){manual.focus();manual.select();}
          }
        });
        controls.append(copy,status,manual);back.after(controls);
      }
    });
    full.append(list);
    if(headings.length>=12){
      const finder=make('div','reader-outline-finder');
      const label=make('label','','依標題找段落');label.htmlFor='reader-outline-query';
      const input=make('input');input.type='search';input.id='reader-outline-query';
      input.placeholder='例如：補充、限制、提示詞';input.autocomplete='off';
      input.setAttribute('aria-describedby','reader-outline-hint reader-outline-status');
      const clear=make('button','reader-outline-clear','清空');clear.type='button';
      clear.setAttribute('aria-label','清空段落標題搜尋');
      const controls=make('div','reader-outline-input');controls.append(input,clear);
      const hint=make('p','reader-outline-hint','只找原文段落標題；多個字詞以空格分開。按 Enter 前往第一個符合段落。');
      hint.id='reader-outline-hint';
      const status=make('p','reader-outline-status');status.id='reader-outline-status';
      status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
      let matches=[],composing=false;
      const update=()=>{
        matches=findOutlineSections(titles,input.value);
        const visible=new Set(matches);
        [...list.children].forEach((row,index)=>{row.hidden=!visible.has(index);});
        status.textContent=!input.value.trim()?`全部 ${titles.length} 個段落`:
          matches.length?`找到 ${matches.length} / ${titles.length} 個段落`:
          '沒有符合的段落標題。清空可查看全部段落；這裡不搜尋正文。';
      };
      input.addEventListener('input',update);
      input.addEventListener('compositionstart',()=>{composing=true;});
      input.addEventListener('compositionend',()=>{composing=false;});
      input.addEventListener('keydown',event=>{
        if(event.key==='Enter'&&!event.isComposing&&!composing&&event.keyCode!==229){
          event.preventDefault();if(matches.length)jump(matches[0]);
        }
      });
      clear.addEventListener('click',()=>{input.value='';update();input.focus({preventScroll:true});});
      update();finder.append(label,controls,hint,status);list.before(finder);
    }
    nav.append(full);
    if(headings.length>=12&&dialog){
      const toolbarLeft=dialog.querySelector('.detail-toolbar-left');
      const position=make('div','reader-position');
      const label=make('span','reader-position-label','原文尚未展開');
      const progress=make('progress','reader-progress-bar');
      progress.max=headings.length;progress.value=0;
      progress.setAttribute('aria-label','原文閱讀位置');
      progress.setAttribute('aria-valuetext',`原文尚未展開，共 ${headings.length} 段`);
      position.append(label,progress);
      toolbarLeft.classList.add('reader-has-position');
      toolbarLeft.append(position);
      const updatePosition=()=>{
        if(!research.open){
          label.textContent='原文尚未展開';
          progress.value=0;
          progress.setAttribute('aria-valuetext',`原文尚未展開，共 ${headings.length} 段`);
          return;
        }
        const toolbarBottom=dialog.querySelector('.detail-toolbar').getBoundingClientRect().bottom;
        const viewportBottom=dialog.getBoundingClientRect().bottom;
        const index=selectReadingPosition(headings,toolbarBottom+24,viewportBottom,markdown.getBoundingClientRect().bottom);
        if(index<0)return;
        label.textContent=`原文第 ${index+1}/${headings.length} 段 · ${titles[index]}`;
        progress.value=index+1;
        progress.setAttribute('aria-valuetext',`原文第 ${index+1} 段，共 ${headings.length} 段：${titles[index]}`);
      };
      let frame=0;
      const schedulePosition=()=>{
        if(frame)return;
        frame=requestAnimationFrame(()=>{frame=0;updatePosition();});
      };
      const dispose=()=>{
        dialog.removeEventListener('scroll',schedulePosition);
        research.removeEventListener('toggle',schedulePosition);
        if(frame)cancelAnimationFrame(frame);
        position.remove();
        toolbarLeft.classList.remove('reader-has-position');
        readingPositionTrackers.delete(dialog);
      };
      readingPositionTrackers.set(dialog,dispose);
      dialog.addEventListener('scroll',schedulePosition,{passive:true});
      research.addEventListener('toggle',schedulePosition);
      schedulePosition();
    }
    nav.append(full);
    evidence.after(nav);
  }
  // A native print/cancel cycle must not change the reader's disclosure or place.
  function createPrintSession(dialog){
    let saved=null;
    return {
      before(){
        if(saved||!dialog.open)return;
        saved={scroll:dialog.scrollTop,focus:dialog.ownerDocument.activeElement,
          details:[...dialog.querySelectorAll('.research-details')].map(node=>({node,open:node.open}))};
        for(const {node} of saved.details)node.open=true;
      },
      after(){
        if(!saved)return;
        const previous=saved;saved=null;
        for(const {node,open} of previous.details)if(node.isConnected)node.open=open;
        if(dialog.open){
          dialog.scrollTop=previous.scroll;
          if(previous.focus?.isConnected)previous.focus.focus({preventScroll:true});
        }
      }
    };
  }
  if(root.document){
    const session=createPrintSession(root.document.querySelector('#detail'));
    root.addEventListener('beforeprint',()=>session.before());
    root.addEventListener('afterprint',()=>session.after());
  }
  const api={readingPassages,findOutlineSections,promptSections,selectCopySections,createPrintSession,selectJumps,selectReadingPosition,selectReadingSection,selectSourceSection,selectMethodShortcut,selectSearchSections,selectSearchPassage,selectReviewSections,enhance};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CaseReader=api;
})(globalThis);
