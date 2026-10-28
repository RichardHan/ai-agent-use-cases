'use strict';
// These fixtures deliberately exercise individual source failures / slow bodies.
// A prior successful visit may have persisted the full bundle. Remove only
// this site's public corpus cache before fault injection, otherwise aborting
// the bundle request cannot reach the per-file path being tested.
module.exports=async function sourceRoute(page,pattern,handler){
 const pages=typeof page.pages==='function'?page.pages():page.context().pages();
 for(const active of pages){
  if(/^https?:/.test(active.url()))await active.evaluate(()=>caches.delete('ai-agent-use-cases-corpus-v1'));
 }
 await page.route('**/corpus.json',route=>route.abort());
 return page.route(pattern,handler);
};
