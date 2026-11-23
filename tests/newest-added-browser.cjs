'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {ensureFiltersVisible}=require('./filter-controls.cjs');
const base=process.env.ADDED_URL||'http://127.0.0.1:8081/ai-agent-use-cases/';

async function ready(page,suffix=''){
  await page.goto(base+suffix);
  await page.waitForFunction(()=>discoveryReady,null,{timeout:90000});
  assert.deepEqual(await page.evaluate(()=>failedPaths),[]);
}
async function verifyOrder(page){
  const records=await page.evaluate(()=>currentFiltered.map(item=>({id:item.id,date:item.addedDate||''})));
  assert.ok(records.some(item=>item.date),'the loaded corpus has first-collected dates');
  const dates=records.map(item=>item.date);
  assert.deepEqual(dates,[...dates].sort().reverse(),'first collection dates descend, unknown dates last');
  const cards=await page.locator('#results .card').evaluateAll(nodes=>nodes.map(node=>({
    id:node.dataset.caseId,date:node.querySelector('.added-date time')?.dateTime||''
  })));
  assert.deepEqual(cards,records.slice(0,cards.length),'visible cards display the dates used for ordering');
  return records;
}

(async()=>{
  const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{});
  try{
    for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await ready(page);
      const origin=await page.evaluate(()=>performance.timeOrigin);
      await page.locator('#added-entry').click();
      assert.equal(await page.locator('#sort').inputValue(),'added');
      assert.equal(new URL(page.url()).searchParams.get('sort'),'added');
      assert.equal(await page.evaluate(()=>performance.timeOrigin),origin,'home shortcut reuses loaded data');
      assert.match(await page.locator('#search-order-note').innerText(),/首次收錄日/);
      await verifyOrder(page);
      if(await page.locator('#load-more-results').isVisible()){
        await page.locator('#load-more-results').click();
        await verifyOrder(page);
      }
      // Date sorting changes order, not which records match a keyword/facet.
      await ensureFiltersVisible(page);
      await page.locator('#query').fill('旅遊');
      await page.locator('#kind').selectOption('case');
      const filtered=(await verifyOrder(page)).map(item=>item.id).sort();
      const shared=page.url();
      await ready(page,new URL(shared).search+'#explore');
      assert.equal(await page.locator('#sort').inputValue(),'added');
      assert.equal(await page.locator('#query').inputValue(),'旅遊');
      assert.equal(await page.locator('#kind').inputValue(),'case');
      assert.deepEqual((await verifyOrder(page)).map(item=>item.id).sort(),filtered);
      await ensureFiltersVisible(page);
      await page.locator('#sort').selectOption('reviewed');
      assert.deepEqual(await page.evaluate(()=>currentFiltered.map(item=>item.id).sort()),filtered);
      await page.locator('#sort').selectOption('added');
      await page.locator('#search-submit').click();
      await page.locator('#results .card .card-bottom button').first().click();
      await page.locator('#detail[open]').waitFor();
      assert.equal(new URL(page.url()).searchParams.get('sort'),'added');
      await page.goBack();
      await page.waitForFunction(()=>!$('detail').open);
      assert.equal(await page.locator('#sort').inputValue(),'added');
      await verifyOrder(page);
      await page.locator('#reset-sort').click();
      assert.equal(await page.locator('#sort').inputValue(),'');
      assert.equal(new URL(page.url()).searchParams.has('sort'),false);
      assert.equal(await page.locator('#query').inputValue(),'旅遊');
      assert.equal(await page.locator('#kind').inputValue(),'case');
      assert.deepEqual(await page.evaluate(()=>currentFiltered.map(item=>item.id).sort()),filtered);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
      assert.deepEqual(errors,[]);
      console.log('PASS newest-added desktop/mobile journey',viewport.width);
      await page.close();
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
