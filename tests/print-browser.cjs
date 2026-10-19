'use strict';
const {chromium,firefox,webkit}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base=process.env.PRINT_URL||'http://127.0.0.1:8087/ai-agent-use-cases/';
fs.mkdirSync('qa-artifacts',{recursive:true});
const compact=text=>text.replace(/\s+/g,'');
(async()=>{
 const report=[];
 for(const [engine,width,height] of [[chromium,1440,1000],[chromium,390,844],[chromium,320,740],[firefox,390,844],[webkit,390,844]]){
  const browser=await engine.launch();
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?q=報告&case=UC-313#explore',{waitUntil:'networkidle'});
  await page.locator('#detail[open]').waitFor();
  const button=page.locator('#print-case');await button.focus();
  assert(await button.evaluate(e=>e===document.activeElement));
  assert((await button.boundingBox()).height>=44);
  if(engine===chromium&&width!==320)await page.screenshot({path:`qa-artifacts/print-after-${width}.png`});
  const url=page.url();
  const canonical=await page.locator('.print-case-address a').first().getAttribute('href');
  assert.equal(new URL(canonical).search,'?case=UC-313','print address excludes reader search terms');
  // Exercise the keyboard button without opening a blocking OS print dialog.
  await page.evaluate(()=>{window.print=()=>{window.printInvoked=(window.printInvoked||0)+1;};});
  await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.printInvoked),1);
  await page.locator('.research-details').evaluate(e=>e.open=true);
  await page.locator('.research-details .markdown').evaluate(e=>e.lastElementChild.scrollIntoView());
  const scroll=await page.locator('#detail').evaluate(e=>e.scrollTop);
  const state=await page.locator('#detail details').evaluateAll(es=>es.map(e=>e.open));
  await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
  assert(await page.locator('#detail details').evaluateAll(es=>es.every(e=>e.open)));
  await page.emulateMedia({media:'print'});
  const metrics=await page.locator('#detail').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,position:getComputedStyle(el).position,overflow:getComputedStyle(el).overflow}));
  assert(metrics.scroll<=metrics.height+2,'printing must not clip the case inside its dialog');
  assert.equal(await page.locator('main').evaluate(e=>getComputedStyle(e).display),'none');
  assert.equal(await page.locator('.reader-report').evaluate(e=>getComputedStyle(e).display),'none');
  await page.emulateMedia({media:'screen'});
  await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
  assert.deepEqual(await page.locator('#detail details').evaluateAll(es=>es.map(e=>e.open)),state);
  assert(Math.abs(await page.locator('#detail').evaluate(e=>e.scrollTop)-scroll)<2,'restore reading scroll');
  assert.equal(page.url(),url);
  // Chromium's real PDF invokes the native before/afterprint path.
  if(engine===chromium&&width===1440){
   for(const id of ['UC-313','UC-338','P-003']){
    if(id!=='UC-313'){
     await page.locator('#close-detail').click();
     await page.evaluate(id=>showDetail(items.find(i=>i.id===id)),id);
    }
    await page.locator('#detail details').evaluateAll(es=>es.forEach(e=>e.open=false));
    const expected=await page.locator('.research-details .markdown').textContent();
    const last=compact(expected).slice(-100);
    const file=`qa-artifacts/case-after-${id}.pdf`;
    await page.pdf({path:file,format:'A4',preferCSSPageSize:true,printBackground:true});
    const text=compact(execFileSync('pdftotext',['-layout',file,'-'],{encoding:'utf8'}));
    assert(text.includes(last),'PDF retains the actual last research paragraph for '+id);
    assert(text.includes(compact(await page.locator('.reader-evidence').textContent())),'PDF retains evidence status');
    assert(text.includes('?case='+id),'PDF retains case address');
    assert(text.includes('github.com/RichardHan/ai-agent-use-cases/blob/main/'),'PDF retains original Markdown address');
    assert(!text.includes('今天，想讓AI'),'PDF excludes background homepage');
    assert(await page.locator('#detail details').evaluateAll(es=>es.every(e=>!e.open)),'real PDF restores collapsed sections');
    const info=execFileSync('pdfinfo',[file],{encoding:'utf8'});
    const pages=Number(info.match(/Pages:\s+(\d+)/)[1]);
    for(const [label,n] of [['first',1],['last',pages]])execFileSync('pdftoppm',['-f',String(n),'-l',String(n),'-scale-to','1200','-singlefile','-png',file,`qa-artifacts/pdf-${id}-${label}`]);
    report.push({id,pages,tailChecked:last});
   }
  }
  await page.locator('#close-detail').click();
  await page.emulateMedia({media:'print'});
  assert.notEqual(await page.locator('main').evaluate(e=>getComputedStyle(e).display),'none','homepage remains printable');
  await page.emulateMedia({media:'screen'});
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  assert.deepEqual(axe.violations,[]);assert.deepEqual(errors,[]);
  report.push({engine:engine.name(),width,...metrics,axeViolations:axe.violations.length});
  fs.writeFileSync('qa-artifacts/print-verification.json',JSON.stringify(report,null,2));
  await browser.close();
 }
 console.log('PRINT_REPORT '+JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;setTimeout(()=>process.exit(1),1000).unref();});
