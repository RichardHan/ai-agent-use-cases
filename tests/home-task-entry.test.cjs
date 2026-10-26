'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');

test('homepage offers visible task queries that lead directly to their named search',()=>{
  const hero=html.match(/<section class="discovery-hero"[\s\S]*?<\/section>/)?.[0]||'';
  const links=[...hero.matchAll(/<a\b(?=[^>]*\bdata-task-entry\b)(?=[^>]*\bhref="([^"]+)")[^>]*>([\s\S]*?)<\/a>/g)];
  assert.equal(links.length,3,'homepage hero should offer three concise task examples');
  const queries=links.map(([,href])=>new URL(href,'https://example.test/ai-agent-use-cases/').searchParams.get('q'));
  const travelChip=html.match(/<button\b[^>]*data-query="([^"]+)"[^>]*>旅遊規劃 · 搜尋/);
  assert.ok(travelChip,'the search panel provides a travel shortcut');
  assert.equal(queries[0],travelChip[1],'the hero and search panel must use the same travel query');
  for(const [,href,label] of links){
    const url=new URL(href,'https://example.test/ai-agent-use-cases/');
    assert.equal(url.hash,'#explore','task link should arrive at the search results section');
    assert.match(label.replace(/<[^>]*>/g,'').trim(),/\S/,'every task link needs a readable label');
  }
});
