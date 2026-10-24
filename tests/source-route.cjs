'use strict';
// These fixtures deliberately exercise individual source failures / slow bodies.
// Disable only the optional transport so the existing source assertions stay real.
module.exports=async function sourceRoute(page,pattern,handler){
 await page.route('**/corpus.json',route=>route.abort());
 return page.route(pattern,handler);
};
