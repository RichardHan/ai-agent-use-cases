'use strict';
const {chromium}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.env.CORPUS_URL||'https://richardhan.github.io/ai-agent-use-cases/';
const {skipIfSupersededPublishedUrl}=require('../scripts/published-check.cjs');
const {waitForPublishedAssets}=require('../scripts/published-assets.cjs');
if(process.env.CORPUS_VERIFY&&skipIfSupersededPublishedUrl(origin)){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);process.exit(0);}
const label=process.env.CORPUS_LABEL||'before',reports=[];
(async()=>{
 fs.mkdirSync('qa-artifacts',{recursive:true});
 if(process.env.CORPUS_VERIFY){
  const files=['assets/app.js','assets/style.css','assets/reader.js','assets/reader.css','index.html'];
  const result=await waitForPublishedAssets({base:origin,sha:process.env.GITHUB_SHA,files,isCurrent:()=>!skipIfSupersededPublishedUrl(origin)});
  if(result==='superseded'){console.log('SKIP_PUBLISHED_BROWSER_CHECK superseded main commit '+process.env.GITHUB_SHA);return;}
 }
 const browser=await chromium.launch();
 for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],requests=[],served={},networkFailures=[];let appSource;
  page.on('response',async r=>{
   const path=new URL(r.url()).pathname.replace(new URL(origin).pathname,'');
   if(['assets/app.js','assets/style.css','assets/reader.js','assets/reader.css',''].includes(path)){
    served[path||'index.html']=await r.text();if(path==='assets/app.js')appSource=served[path];
   }
  });
  page.on('requestfailed',r=>networkFailures.push({url:r.url(),failure:r.failure()}));
  page.on('response',r=>{if(r.status()>=400)networkFailures.push({url:r.url(),status:r.status()});});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.addInitScript(()=>performance.setResourceTimingBufferSize(2000));
  const start=Date.now();await page.goto(origin);await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
  if(process.env.CORPUS_VERIFY)for(const path of ['assets/app.js','assets/style.css','assets/reader.js','assets/reader.css','index.html'])assert.equal(served[path],fs.readFileSync(path,'utf8'),'actual page asset '+path);
  const metrics=await page.evaluate(()=>({entries:entries.length,missing:failedPaths.length,failedPaths:[...failedPaths],resources:performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,bytes:r.encodedBodySize,durationMs:Math.round(r.duration)}))}));
  const report={size,networkFailures,appSHA256:require('node:crypto').createHash('sha256').update(appSource).digest('hex'),readyMs:Date.now()-start,...metrics,requests:requests.length,markdownRequests:requests.filter(u=>/\/(cases|evidence)\/.*\.md$|\/sources\/pending\.md$/.test(u)).length};reports.push(report);
  fs.writeFileSync(`qa-artifacts/corpus-${label}.json`,JSON.stringify(reports,null,2));
  await page.screenshot({path:`qa-artifacts/corpus-${label}-${size}.png`});
  assert.equal(metrics.missing,0,JSON.stringify({failedPaths:metrics.failedPaths,networkFailures}));
  await page.locator('#query').fill('旅遊');await require('./filter-controls.cjs').ensureFiltersVisible(page);
  await page.locator('#scenario').selectOption('生活');await page.locator('#tool').selectOption('Grok Bot');
  assert(await page.locator('#results .card').count()>0);
  const read=page.locator('#results .card .card-bottom button').first();await read.focus();await page.keyboard.press('Enter');await page.locator('#detail[open]').waitFor();
  await page.keyboard.press('Escape');assert(await read.evaluate(e=>e===document.activeElement));assert.equal(await page.locator('#query').inputValue(),'旅遊');
  await page.locator('#query').fill('zz-no-match-981');assert(await page.locator('#empty').isVisible());await page.locator('#empty-reset').click();
  await page.goto(origin+'?case=UC-313');await page.locator('#detail[open]').waitFor({timeout:90000});await page.reload();await page.locator('#detail[open]').waitFor({timeout:90000});
  assert.match(await page.locator('.reader-report-content').innerText(),/未證實實際重複寄送/);
  const source=page.locator('.reader-report-content a').first();assert.equal(await source.getAttribute('href'),'https://github.com/openai/codex/issues/52208');
  if(size==='desktop'){
   const popupPromise=page.waitForEvent('popup');await source.click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');report.sourceURL=popup.url();report.sourceStatus=(await popup.request.get(popup.url())).status();await popup.close();
  }
  await page.screenshot({path:`qa-artifacts/corpus-${label}-detail-${size}.png`});
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();report.axeViolations=audit.violations;report.errors=errors;
  assert.equal(audit.violations.length,0);assert.deepEqual(errors,[]);
  report.journeys=['travel + scenario + tool + keyboard return','empty + reset','failure report direct link + reload + source'];
  fs.writeFileSync(`qa-artifacts/corpus-${label}.json`,JSON.stringify(reports,null,2));await context.close();
 }
 await browser.close();console.log(JSON.stringify(reports.map(({resources,...r})=>r)));
})().catch(e=>{console.error(e);process.exit(1)});
