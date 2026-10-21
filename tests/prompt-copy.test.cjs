'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {selectCopySections,promptSections}=require('../assets/reader.js');
test('copy candidates retain their full qualified headings and original section indices',()=>{
 const sections=[{title:'來源',text:'不能複製為提示詞'},{title:'可複製提示詞（本庫原創設計，未實跑）',text:'請保留［日期］\n不得付款。'},{title:'可貼指令（自設、未測）',text:'只讀核對 <script>literal</script>'}];
 assert.deepEqual(selectCopySections(sections,'case'),[1,2]);
});
test('pending, empty, descriptive references and unrelated sections do not become copy actions',()=>{
 const sections=[{title:'可複製提示詞',text:' '},{title:'來源中的可貼指令',text:'作者說法'},{title:'可複製提示詞的限制',text:'不可直接使用'},{title:'可貼指令（自設）',text:'完整內容'}];
 assert.deepEqual(selectCopySections(sections,'pending'),[]);
 assert.deepEqual(selectCopySections(sections,'evidence'),[3]);
 assert.deepEqual(selectCopySections([],'case'),[]);
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
