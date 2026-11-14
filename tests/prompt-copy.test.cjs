'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {selectCopySections,promptSections}=require('../assets/reader.js');
test('copy candidates retain their full qualified headings and original section indices',()=>{
 const sections=[
  {title:'來源',text:'不能複製為提示詞'},
  {title:'可複製提示詞（本庫原創設計，未實跑）',text:'請保留［日期］\n不得付款。'},
  {title:'可貼指令（自設、未測）',text:'只讀核對 <script>literal</script>'},
  {title:'原創提示詞（未實測，可修改後貼上）',text:'> 虛構測試資料'},
  {title:'原創提示詞｜UNTESTED',text:'> 比對變更紀錄'},
  {title:'可貼提示詞（自設未測，非作者原文）',text:'只讀驗證計畫'},
  {title:'建議試法與可貼指令（整理者設計，未實跑）',text:'先做草稿，可貼：請整理'},
  {title:'可貼的只讀驗收指令（本庫自行設計，未實測）',text:'只讀檢查'},
  {title:'可直接貼用的指令（原創、未實測）',text:'只讀巡查'},
  {title:'可貼指令與驗收（本庫自行設計／未實測）',text:'離線盤點'},
  {title:'合成資料驗收指令（本庫自行設計，未執行）',text:'驗證模板'},
  {title:'自設延伸流程與指令（未實跑）',text:'1. 核對授權'}
 ];
 assert.deepEqual(selectCopySections(sections,'case'),[1,2,3,4,5,6,7,8,9,10,11]);
});
test('pending, empty, descriptive references, source citations, dated supplements and adversarial inputs do not become copy actions',()=>{
 const sections=[
  {title:'可複製提示詞',text:' '},
  {title:'來源中的可貼指令',text:'作者說法'},
  {title:'可複製提示詞的限制',text:'不可直接使用'},
  {title:'原始提示詞的注意事項',text:'不可直接使用'},
  {title:'原創提示詞：限制與注意事項',text:'不可直接使用'},
  {title:'可複製提示詞（注意事項與風險）',text:'不可直接使用'},
  {title:'可貼指令｜限制與風險',text:'不可直接使用'},
  {title:'S-046A：Grok Bot — Tw93 的每晚精選提示詞（主要來源，`author-demo`）',text:'作者貼文'},
  {title:'來源D：PaiOurs——以非互動指令呼叫 Claude Code',text:'來源摘要'},
  {title:'2026-10-21 11:47補充：先檢查每條 routine 指令有沒有寫「何時停」與動作上限（S-066H）',text:'補充說明'},
  {title:'可貼的'.repeat(50)+'非指令結尾',text:'壓測回溯'},
  {title:'可貼指令（自設）',text:'完整內容'}
 ];
 const started=Date.now();
 assert.deepEqual(selectCopySections(sections,'pending'),[]);
 assert.deepEqual(selectCopySections(sections,'evidence'),[11]);
 assert.deepEqual(selectCopySections([],'case'),[]);
 assert.ok(Date.now()-started<50,'heading classification must stay linear on repeated prefix tokens');
});

test('source copy keeps links, code, list boundaries and nested qualifications without UI text',()=>{
 const md='# Case\n\n## 可貼指令（自設、未測）\n\n1. 核對 [文件](https://example.com/a?q=1)\n2. 不付款\n\n```text\n  ## code stays code\n  keep indentation\n```\n\n### 限制\n不得執行\n\n## 來源\nsource';
 const sections=promptSections(md);
 assert.equal(sections.length,3);
 assert.equal(sections[0].copyText,md.slice(md.indexOf('## 可貼'),md.indexOf('## 來源')).trim());
 assert.equal(sections[1].title,'限制');
 assert.deepEqual(selectCopySections(sections,'case'),[0]);
});

test('nested subsections stay with their parent and peer subsections end the copied range',()=>{
 const sections=promptSections('# Case\n## 可貼指令（未測）\nfirst\n### 可貼指令（補充）\nsecond\n### 限制\nstop\n## 來源\nend');
 assert(sections[0].copyText.includes('### 限制\nstop'));
 assert.equal(sections[1].copyText,'### 可貼指令（補充）\nsecond');
});

test('deeper Markdown headings keep their restrictions inside the copied chapter',()=>{
 const sections=promptSections('# Case\n### 可貼指令（未測）\n請先核對\n#### 必須保留的限制\n不得送出\n##### 細節\n不得付款\n### 來源\nsource');
 assert.equal(sections[0].copyText,'### 可貼指令（未測）\n請先核對\n#### 必須保留的限制\n不得送出\n##### 細節\n不得付款');
 assert.equal(sections[1].copyText,'#### 必須保留的限制\n不得送出\n##### 細節\n不得付款');
});

test('all 524 library markdown files provide copy actions for prompt/command headings and exclude source/supplement headings',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const root=path.join(__dirname,'..');
 const {selectMethodShortcut}=require('../assets/reader.js');
 const files=[];
 for(const dir of ['cases','evidence','sources']){
  for(const name of fs.readdirSync(path.join(root,dir)).sort()){
   if(dir==='sources'&&name!=='pending.md')continue;
   if(name.endsWith('.md'))files.push(path.join(dir,name));
  }
 }
 assert.equal(files.length,524);
 let totalCopy=0;
 const uncopiedWithKeywords=[];
 for(const rel of files){
  const md=fs.readFileSync(path.join(root,rel),'utf8');
  const kind=rel==='sources/pending.md'?'pending':rel.startsWith('evidence/')?'evidence':'case';
  const sections=promptSections(md);
  const copied=new Set(selectCopySections(sections,kind));
  totalCopy+=copied.size;
  sections.forEach((s,i)=>{
   if(!copied.has(i)&&/提示詞|指令/.test(s.title))uncopiedWithKeywords.push(`${rel}#${i}:${s.title}`);
  });
  if(rel==='cases/026-school-deadline-list.md'){
   assert.deepEqual(selectMethodShortcut(sections.map(s=>s.title),'case'),{index:0,title:'可嘗試的流程（本文設計、未實測）'});
   assert.equal(copied.has(1),true,'UC-026 原創提示詞 must be copyable');
   assert.equal(copied.has(4),true,'UC-026 自設增量驗收與可貼指令 must be copyable');
  }
  if(rel==='cases/016-marketplace-selling-buyer-messages.md'){
   assert.equal(copied.has(9),true,'UC-016 可複製提示詞 must be copyable');
   assert.equal(copied.has(15),true,'UC-016 原創提示詞 must be copyable');
  }
  if(rel==='cases/010-physical-oled-verification.md'){
   assert.equal(copied.has(3),true,'UC-010 可貼提示詞 must be copyable');
  }
 }
 assert.equal(totalCopy,572,'expected 572 copyable prompt/command sections across 524 files');
 assert.deepEqual(uncopiedWithKeywords,[
  'cases/046-followed-accounts-daily-digest.md#2:S-046A：Grok Bot — Tw93 的每晚精選提示詞（主要來源，`author-demo`）',
  'cases/061-dispatcher-bot-typed-commands-ledger.md#2:S-061A：Grok Bot — @miyatti 的「窗口」派工提示詞與 AI-PLC 版本（`author-demo`）',
  'cases/066-agent-token-usage-self-audit.md#22:2026-10-21 11:47補充：先檢查每條 routine 指令有沒有寫「何時停」與動作上限（S-066H）',
  'cases/068-mac-local-helper-away-diagnosis.md#2:S-068A：Grok Bot — 關掉 App Nap，固定時間排程前再定時喚醒（作者提示詞＋截圖）',
  'cases/087-voice-walk-intake-codex-morning-call.md#9:2026-10-21補充：長通話仍在進行，不代表指令已完整保存',
  'cases/133-screen-reader-menu-reformat.md#5:2026-10-22 補充：易讀輸出之外，還要能送出指令與找到完成結果',
  'cases/351-grokbot-dispatch-only-offload-free-model-agents.md#5:來源D：PaiOurs（note 文章，日文）——Grok Bot 當唯一窗口，在自家 Mac 上以非互動指令呼叫兩個 Claude Code 帳號與 Codex，並把用量寫進 Bot 名稱旁的標籤（2026-10-21 14:40 批次併入）',
  'cases/408-daily-team-sync-one-page-prep-calendar-notion-slack-linear.md#2:S-408A：@mmarinovic_（X 貼文＋提示詞卡圖片，英文）'
 ]);
});
