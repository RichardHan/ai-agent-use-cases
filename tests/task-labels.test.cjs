'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(process.env.TASK_LABEL_HTML||'index.html','utf8');
test('keyword shortcuts name the exact search term rather than promise an automated outcome',()=>{
 const chips=[...html.matchAll(/<button\b([^>]*\bdata-query="([^"]+)"[^>]*)>([^<]+)<\/button>/g)].filter(m=>m[1].includes('chip-task'));
 assert.deepEqual(chips.map(m=>m[2]),['每日','收件匣','比價','排程']);
 for(const chip of chips){assert(chip[3].includes('搜尋「'+chip[2]+'」'),chip[3]);assert.match(chip[1],/aria-describedby="task-shortcuts-hint"/);}
 assert.match(html,/常用搜尋：/);
 assert.match(html,/依情境或常用搜尋快速探索/);
});
test('search scope and evidence caveats are visible alongside independent status filtering',()=>{
 const hint=html.match(/<p id="task-shortcuts-hint"[^>]*>([^<]+)<\/p>/)?.[1];
 assert(hint);assert.match(hint,/搜尋全文，包含來源與限制/);assert.match(hint,/命中不代表已實作或驗證/);
 assert.match(hint,/取代搜尋字詞、保留其他篩選/);assert.match(hint,/再按一次可取消/);assert.match(hint,/載入中/);
 assert.match(html,/data-kind="evidence"[^>]*aria-describedby="experience-entry-hint"/);
 assert.match(html,/「經驗與踩坑」依收錄狀態篩選，保留關鍵字與其他條件/);
});
