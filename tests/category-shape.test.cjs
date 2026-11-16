'use strict';
// 主題分類 options are each case page's own 分類 phrase, not a shared taxonomy.
// The hint must say how many of the loaded phrases appear once, using the loaded
// entries, never a count copied into the sentence.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/app.js'),'utf8').split('/* Browser event bindings. */')[0];
const context=vm.createContext({});
vm.runInContext(source+'\nthis.api={categoryShapeNote};',context);
const note=items=>context.api.categoryShapeNote(items);
const item=(category,id='UC-1')=>({id,category});

test('a catalogue of mostly unique phrases says how many appear once',()=>{
  const items=[
    item('旅遊／消費研究','UC-1'),
    item('客服交接','UC-2'),
    item('客服交接','UC-3'),
    item('','UC-4'),
    item('發票對帳','UC-5')
  ];
  const text=note(items);
  assert.match(text,/不是共用主題清單/);
  assert.match(text,/3 個分類有 2 個只出現 1 次/);
  assert.match(text,/其餘 1 個出現 2 次以上/);
  assert.doesNotMatch(text,/361|362|165/);
});

test('every phrase appearing once is still counted, including a catalogue with no shared phrase',()=>{
  const text=note([item('甲','UC-1'),item('乙','UC-2')]);
  assert.match(text,/2 個分類有 2 個只出現 1 次/);
  assert.doesNotMatch(text,/其餘/);
});

test('a catalogue with no declared phrase adds no shape sentence',()=>{
  assert.equal(note([item('','UC-1'),{id:'UC-2'}]),'');
});

test('shared phrases are not described as appearing once',()=>{
  const text=note([item('同一句','UC-1'),item('同一句','UC-2'),item('同一句','UC-3')]);
  assert.match(text,/1 個分類有 0 個只出現 1 次/);
  assert.match(text,/其餘 1 個出現 2 次以上/);
});
