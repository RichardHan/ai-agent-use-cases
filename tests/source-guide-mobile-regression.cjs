'use strict';
const {chromium,firefox,webkit}=require('playwright');
const origin=process.env.GUIDE_URL||'http://127.0.0.1:8123/ai-agent-use-cases/';
(async()=>{
 for(const engine of [chromium,firefox,webkit]){
  const browser=await engine.launch();
  try{await require('./mobile-search-browser.cjs')({browser,origin,prefix:'source-guide-'+engine.name(),sizes:engine===chromium?[['desktop',1440,1000],['mobile',390,844],['small-mobile',320,740]]:[['mobile',390,844]]});}
  finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exit(1);});
