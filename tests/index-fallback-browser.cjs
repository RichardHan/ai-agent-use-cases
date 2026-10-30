'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.FALLBACK_URL||'http://127.0.0.1:8137/ai-agent-use-cases/';
const label=process.env.FALLBACK_LABEL||'after';
(async()=>{
 const browser=await chromium.launch();
 try{
  for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
   await page.route('**/catalog.json',route=>route.abort());
   await page.goto(base+'?q=旅遊&scenario=生活#explore');
   await page.locator('#error').waitFor({state:'visible'});
   await page.locator('#error').scrollIntoViewIfNeeded();
   fs.mkdirSync('qa-artifacts/index-fallback',{recursive:true});
   await page.screenshot({path:`qa-artifacts/index-fallback/${label}-${width}.png`});
   const link=page.locator('#error a[href="INDEX.html"]');
   assert.equal(await link.count(),1,'failure should offer same-version index');
   assert.match(await page.locator('#error').innerText(),/不提供.*搜尋.*篩選/);
   await link.focus();assert(await link.evaluate(el=>el===document.activeElement));
   const indexURL=await link.evaluate(el=>el.href);
   assert.equal(new URL(indexURL).pathname,new URL('INDEX.html',base).pathname);
   const indexResponse=await context.request.get(indexURL);
   assert(indexResponse.ok(),'index must be served under Pages base path');
   assert.match(await indexResponse.text(),/<title>完整案例索引/,'index must be the rendered index, not the homepage');
   await page.unroute('**/catalog.json');
   await page.locator('#retry').click();
   await page.waitForFunction(()=>discoveryReady,null,{timeout:30000});
   assert.equal(await page.locator('#query').inputValue(),'旅遊');
   assert.equal(await page.locator('#scenario').inputValue(),'生活');
   assert(await page.locator('#error').isHidden());
   console.log(`FALLBACK_OK ${width} index=${indexURL} retry preserves query and scenario`);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
