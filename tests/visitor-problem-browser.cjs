'use strict';
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const origin = process.env.VERIFY_URL || 'http://127.0.0.1:8099/ai-agent-use-cases/';
// Screenshots belong to the run, not to a finished round's record: writing them
// into docs/qa/<past round> replaced that round's evidence on every local run.
const outDir = process.env.QA_OUT_DIR || path.resolve(__dirname, '../qa-artifacts/visitor-problem');
fs.mkdirSync(outDir, { recursive: true });

// On small screens the 53-task directory is disclosed in two steps. Expand it
// before reaching the less common task links, exactly as a visitor would.
async function expandProblemTags(page){
  const toggle=page.locator('#problem-tags-toggle');
  if(!(await toggle.count())||!(await toggle.isVisible()))return;
  if((await toggle.getAttribute('aria-expanded'))==='false')await toggle.click();
}

(async () => {
  const browser = await chromium.launch();
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'smallMobile', width: 320, height: 740 }
  ];

  const report = {
    timestamp: new Date().toISOString(),
    verifyUrl: origin,
    viewports: [],
    scenarios: {
      scenario1_problem_discovery: { passed: true, checks: [] },
      scenario2_empty_recovery: { passed: true, checks: [] },
      scenario3_deep_link_evidence_return: { passed: true, checks: [] }
    },
    axeSummary: { totalViolations: 0 }
  };

  for (const vp of viewports) {
    const vpReport = { name: vp.name, width: vp.width, height: vp.height, axeChecks: [], screenshots: [] };
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    console.log(`[${vp.name}] Navigating to homepage...`);
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.locator('#drawn-case .card').waitFor({ timeout: 10000 });

    // Capture homepage
    const homeShot = `${vp.name}-01-homepage.png`;
    await page.screenshot({ path: path.join(outDir, homeShot) });
    vpReport.screenshots.push(homeShot);

    // Axe accessibility check on homepage
    const homeAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(homeAxe.violations.length, 0, `Homepage accessibility violations on ${vp.name}: ` + JSON.stringify(homeAxe.violations));
    vpReport.axeChecks.push({ state: 'homepage', violations: 0 });

    // SCENARIO 1: Problem-oriented discovery
    console.log(`[${vp.name}] Testing Scenario 1: 問卷調查 problem tag...`);
    await expandProblemTags(page);
    const surveyTag = page.locator('.hero-problem-tags a[href*="問卷調查"]');
    assert.ok(await surveyTag.isVisible(), '問卷調查 tag must be visible in hero');
    await surveyTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const surveyCount = await page.locator('#results .card').count();
    assert.ok(surveyCount >= 10, `問卷調查 must recall >= 10 cases (found ${surveyCount})`);
    assert.equal(await page.locator('#query').inputValue(), '問卷調查');
    const surveyShot = `${vp.name}-02-scenario1-survey.png`;
    await page.screenshot({ path: path.join(outDir, surveyShot) });
    vpReport.screenshots.push(surveyShot);

    console.log(`[${vp.name}] Testing Scenario 1: 文獻回顧 problem tag...`);
    await expandProblemTags(page);
    const litTag = page.locator('.hero-problem-tags a[href*="文獻回顧"]');
    assert.ok(await litTag.isVisible(), '文獻回顧 tag must be visible in hero');
    await litTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const litCount = await page.locator('#results .card').count();
    assert.ok(litCount >= 2, `文獻回顧 must recall >= 2 cases (found ${litCount})`);
    assert.equal(await page.locator('#query').inputValue(), '文獻回顧');
    const firstLitTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(firstLitTitle.includes('論文') || firstLitTitle.includes('研究'), `Top result for 文獻回顧 must be research case, got: ${firstLitTitle}`);
    const litShot = `${vp.name}-02b-scenario1-literature.png`;
    await page.screenshot({ path: path.join(outDir, litShot) });
    vpReport.screenshots.push(litShot);

    console.log(`[${vp.name}] Testing Scenario 1: 機票比價 natural query...`);
    await page.locator('#query').fill('機票比價');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const flightCount = await page.locator('#results .card').count();
    assert.ok(flightCount >= 2, `機票比價 must recall >= 2 cases (found ${flightCount})`);
    const flightShot = `${vp.name}-02c-scenario1-airfare.png`;
    await page.screenshot({ path: path.join(outDir, flightShot) });
    vpReport.screenshots.push(flightShot);

    console.log(`[${vp.name}] Testing Scenario 1: 費用報銷 natural query...`);
    await page.locator('#query').fill('費用報銷');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const expCount = await page.locator('#results .card').count();
    assert.ok(expCount >= 3, `費用報銷 must recall >= 3 cases (found ${expCount})`);
    const expShot = `${vp.name}-02d-scenario1-expense.png`;
    await page.screenshot({ path: path.join(outDir, expShot) });
    vpReport.screenshots.push(expShot);
    console.log(`[${vp.name}] Testing Scenario 1: 資料清理 problem tag...`);
    await expandProblemTags(page);
    const dataCleanTag = page.locator('.hero-problem-tags a[href*="資料清理"]');
    assert.ok(await dataCleanTag.isVisible(), '資料清理 tag must be visible in hero');
    await dataCleanTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const dataCleanCount = await page.locator('#results .card').count();
    assert.ok(dataCleanCount >= 10, `資料清理 must recall >= 10 cases (found ${dataCleanCount})`);
    const dataCleanFirstTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(dataCleanFirstTitle.includes('收銀資料') || dataCleanFirstTitle.includes('入帳檔'), `Top case must be UC-036, got: ${dataCleanFirstTitle}`);
    const dataCleanShot = `${vp.name}-02e-scenario1-dataclean.png`;
    await page.screenshot({ path: path.join(outDir, dataCleanShot) });
    vpReport.screenshots.push(dataCleanShot);

    console.log(`[${vp.name}] Testing Scenario 1: 日誌分析 problem tag...`);
    await expandProblemTags(page);
    const logTag = page.locator('.hero-problem-tags a[href*="日誌分析"]');
    assert.ok(await logTag.isVisible(), '日誌分析 tag must be visible in hero');
    await logTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const logCount = await page.locator('#results .card').count();
    assert.ok(logCount >= 10, `日誌分析 must recall >= 10 cases (found ${logCount})`);
    const logFirstTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(logFirstTitle.includes('錯誤日誌') || logFirstTitle.includes('網站出問題'), `Top case must be UC-096, got: ${logFirstTitle}`);
    const logShot = `${vp.name}-02f-scenario1-log.png`;
    await page.screenshot({ path: path.join(outDir, logShot) });
    vpReport.screenshots.push(logShot);
    console.log(`[${vp.name}] Testing Scenario 1: 筆記整理 problem tag...`);
    await expandProblemTags(page);
    const noteTag = page.locator('.hero-problem-tags a[href*="筆記整理"]');
    assert.ok(await noteTag.isVisible(), '筆記整理 tag must be visible in hero');
    await noteTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const noteCount = await page.locator('#results .card').count();
    assert.ok(noteCount >= 15, `筆記整理 must recall >= 15 cases (found ${noteCount})`);
    const noteFirstTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(noteFirstTitle.includes('筆記') || noteFirstTitle.includes('紀錄'), `Top case must be note related, got: ${noteFirstTitle}`);
    const noteShot = `${vp.name}-02g-scenario1-note.png`;
    await page.screenshot({ path: path.join(outDir, noteShot) });
    vpReport.screenshots.push(noteShot);

    console.log(`[${vp.name}] Testing Scenario 1: 客戶反饋 problem tag...`);
    await expandProblemTags(page);
    const feedbackTag = page.locator('.hero-problem-tags a[href*="客戶反饋"]');
    assert.ok(await feedbackTag.isVisible(), '客戶反饋 tag must be visible in hero');
    await feedbackTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const feedbackCount = await page.locator('#results .card').count();
    assert.ok(feedbackCount >= 5, `客戶反饋 must recall >= 5 cases (found ${feedbackCount})`);
    const feedbackFirstTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(feedbackFirstTitle.includes('客戶') || feedbackFirstTitle.includes('FAQ'), `Top case must be UC-011, got: ${feedbackFirstTitle}`);
    const feedbackShot = `${vp.name}-02h-scenario1-feedback.png`;
    await page.screenshot({ path: path.join(outDir, feedbackShot) });
    vpReport.screenshots.push(feedbackShot);

    console.log(`[${vp.name}] Testing Scenario 1: 面試準備 problem tag...`);
    await expandProblemTags(page);
    const interviewTag = page.locator('.hero-problem-tags a[href*="面試準備"]');
    assert.ok(await interviewTag.isVisible(), '面試準備 tag must be visible in hero');
    await interviewTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const interviewCount = await page.locator('#results .card').count();
    assert.ok(interviewCount >= 5, `面試準備 must recall >= 5 cases (found ${interviewCount})`);
    const interviewFirstTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(interviewFirstTitle.includes('職缺') || interviewFirstTitle.includes('履歷') || interviewFirstTitle.includes('面試'), `Top case must be UC-035 or interview, got: ${interviewFirstTitle}`);
    const interviewShot = `${vp.name}-02i-scenario1-interview.png`;
    await page.screenshot({ path: path.join(outDir, interviewShot) });
    vpReport.screenshots.push(interviewShot);
    console.log(`[${vp.name}] Testing Scenario 1: 行銷文案 problem tag...`);
    await expandProblemTags(page);
    const mktTag = page.locator('.hero-problem-tags a[href*="行銷文案"]');
    assert.ok(await mktTag.isVisible(), '行銷文案 tag must be visible in hero');
    await mktTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const mktCount = await page.locator('#results .card').count();
    assert.ok(mktCount >= 5, `行銷文案 must recall >= 5 cases (found ${mktCount})`);
    const mktShot = `${vp.name}-02j-scenario1-marketing.png`;
    await page.screenshot({ path: path.join(outDir, mktShot) });
    vpReport.screenshots.push(mktShot);

    console.log(`[${vp.name}] Testing Scenario 1: 效能分析 problem tag...`);
    await expandProblemTags(page);
    const perfTag = page.locator('.hero-problem-tags a[href*="效能分析"]');
    assert.ok(await perfTag.isVisible(), '效能分析 tag must be visible in hero');
    await perfTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const perfCount = await page.locator('#results .card').count();
    assert.ok(perfCount >= 10, `效能分析 must recall >= 10 cases (found ${perfCount})`);
    const perfFirstTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(perfFirstTitle.includes('效能') || perfFirstTitle.includes('網頁改快了'), `Top case must be UC-173, got: ${perfFirstTitle}`);
    const perfShot = `${vp.name}-02k-scenario1-performance.png`;
    await page.screenshot({ path: path.join(outDir, perfShot) });
    vpReport.screenshots.push(perfShot);

    console.log(`[${vp.name}] Testing Scenario 1: 報帳審核 problem tag...`);
    await expandProblemTags(page);
    const expTag = page.locator('.hero-problem-tags a[href*="報帳審核"]');
    assert.ok(await expTag.isVisible(), '報帳審核 tag must be visible in hero');
    await expTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const expCount2 = await page.locator('#results .card').count();
    assert.ok(expCount2 >= 15, `報帳審核 must recall >= 15 cases (found ${expCount2})`);
    const expShot2 = `${vp.name}-02l-scenario1-expense-approval.png`;
    await page.screenshot({ path: path.join(outDir, expShot2) });
    vpReport.screenshots.push(expShot2);

    console.log(`[${vp.name}] Testing Scenario 1: 簡報製作 problem tag...`);
    await expandProblemTags(page);
    const slidesTag = page.locator('.hero-problem-tags a[href*="簡報製作"]');
    assert.ok(await slidesTag.isVisible(), '簡報製作 tag must be visible in hero');
    await slidesTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const slidesCount = await page.locator('#results .card').count();
    assert.ok(slidesCount >= 20, `簡報製作 must recall >= 20 cases (found ${slidesCount})`);
    const slidesShot = `${vp.name}-02m-scenario1-slides.png`;
    await page.screenshot({ path: path.join(outDir, slidesShot) });
    vpReport.screenshots.push(slidesShot);
    console.log(`[${vp.name}] Testing Scenario 1: 專案進度 problem tag...`);
    await expandProblemTags(page);
    const projTag = page.locator('.hero-problem-tags a[href*="專案進度"]');
    assert.ok(await projTag.isVisible(), '專案進度 tag must be visible in hero');
    await projTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const projCount = await page.locator('#results .card').count();
    assert.ok(projCount >= 10, `專案進度 must recall >= 10 cases (found ${projCount})`);
    const projShot = `${vp.name}-02n-scenario1-project-progress.png`;
    await page.screenshot({ path: path.join(outDir, projShot) });
    vpReport.screenshots.push(projShot);

    console.log(`[${vp.name}] Testing Scenario 1: 數據分析 problem tag...`);
    await expandProblemTags(page);
    const dataTag = page.locator('.hero-problem-tags a[href*="數據分析"]');
    assert.ok(await dataTag.isVisible(), '數據分析 tag must be visible in hero');
    await dataTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const dataCount = await page.locator('#results .card').count();
    assert.ok(dataCount >= 10, `數據分析 must recall >= 10 cases (found ${dataCount})`);
    const dataShot = `${vp.name}-02o-scenario1-data-analytics.png`;
    await page.screenshot({ path: path.join(outDir, dataShot) });
    vpReport.screenshots.push(dataShot);

    console.log(`[${vp.name}] Testing Scenario 1: 音訊轉寫 problem tag...`);
    await expandProblemTags(page);
    const audioTag = page.locator('.hero-problem-tags a[href*="音訊轉寫"]');
    assert.ok(await audioTag.isVisible(), '音訊轉寫 tag must be visible in hero');
    await audioTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const audioCount = await page.locator('#results .card').count();
    assert.ok(audioCount >= 10, `音訊轉寫 must recall >= 10 cases (found ${audioCount})`);
    const audioShot = `${vp.name}-02p-scenario1-transcription.png`;
    await page.screenshot({ path: path.join(outDir, audioShot) });
    vpReport.screenshots.push(audioShot);

    console.log(`[${vp.name}] Testing Scenario 1: 市場調研 problem tag...`);
    await expandProblemTags(page);
    const marketTag = page.locator('.hero-problem-tags a[href*="市場調研"]');
    assert.ok(await marketTag.isVisible(), '市場調研 tag must be visible in hero');
    await marketTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const marketCount = await page.locator('#results .card').count();
    assert.ok(marketCount >= 3, `市場調研 must recall >= 3 cases (found ${marketCount})`);
    const marketShot = `${vp.name}-02q-scenario1-market-research.png`;
    await page.screenshot({ path: path.join(outDir, marketShot) });
    vpReport.screenshots.push(marketShot);

    console.log(`[${vp.name}] Testing Scenario 1: 產品調研 problem tag...`);
    await expandProblemTags(page);
    const prodResearchTag = page.locator('.hero-problem-tags a[href*="產品調研"]');
    assert.ok(await prodResearchTag.isVisible(), '產品調研 tag must be visible in hero');
    await prodResearchTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const prodResearchCount = await page.locator('#results .card').count();
    assert.ok(prodResearchCount >= 10, `產品調研 must recall >= 10 cases (found ${prodResearchCount})`);
    const prodResearchShot = `${vp.name}-02r-scenario1-product-research.png`;
    await page.screenshot({ path: path.join(outDir, prodResearchShot) });
    vpReport.screenshots.push(prodResearchShot);

    console.log(`[${vp.name}] Testing Scenario 1: 讀書筆記 problem tag...`);
    await expandProblemTags(page);
    const readingNotesTag = page.locator('.hero-problem-tags a[href*="讀書筆記"]');
    assert.ok(await readingNotesTag.isVisible(), '讀書筆記 tag must be visible in hero');
    await readingNotesTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const readingNotesCount = await page.locator('#results .card').count();
    assert.ok(readingNotesCount >= 5, `讀書筆記 must recall >= 5 cases (found ${readingNotesCount})`);
    const readingNotesShot = `${vp.name}-02s-scenario1-reading-notes.png`;
    await page.screenshot({ path: path.join(outDir, readingNotesShot) });
    vpReport.screenshots.push(readingNotesShot);

    console.log(`[${vp.name}] Testing Scenario 1: 英語學習 problem tag...`);
    await expandProblemTags(page);
    const englishTag = page.locator('.hero-problem-tags a[href*="英語學習"]');
    assert.ok(await englishTag.isVisible(), '英語學習 tag must be visible in hero');
    await englishTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const englishCount = await page.locator('#results .card').count();
    assert.ok(englishCount >= 5, `英語學習 must recall >= 5 cases (found ${englishCount})`);
    const englishShot = `${vp.name}-02t-scenario1-language-learning.png`;
    await page.screenshot({ path: path.join(outDir, englishShot) });
    vpReport.screenshots.push(englishShot);

    console.log(`[${vp.name}] Testing Scenario 1: 漏洞掃描 problem tag...`);
    await expandProblemTags(page);
    const vulnTag = page.locator('.hero-problem-tags a[href*="漏洞掃描"]');
    assert.ok(await vulnTag.isVisible(), '漏洞掃描 tag must be visible in hero');
    await vulnTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const vulnCount = await page.locator('#results .card').count();
    assert.ok(vulnCount >= 10, `漏洞掃描 must recall >= 10 cases (found ${vulnCount})`);
    const vulnFirstTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(vulnFirstTitle.includes('漏洞') || vulnFirstTitle.includes('資安看守'), `Top case must be UC-407, got: ${vulnFirstTitle}`);
    const vulnShot = `${vp.name}-02u-scenario1-vulnerability-scan.png`;
    await page.screenshot({ path: path.join(outDir, vulnShot) });
    vpReport.screenshots.push(vulnShot);

    console.log(`[${vp.name}] Testing Scenario 1: 隱私審查 problem tag...`);
    await expandProblemTags(page);
    const privacyTag = page.locator('.hero-problem-tags a[href*="隱私審查"]');
    assert.ok(await privacyTag.isVisible(), '隱私審查 tag must be visible in hero');
    await privacyTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const privacyCount = await page.locator('#results .card').count();
    assert.ok(privacyCount >= 10, `隱私審查 must recall >= 10 cases (found ${privacyCount})`);
    const privacyShot = `${vp.name}-02v-scenario1-privacy-review.png`;
    await page.screenshot({ path: path.join(outDir, privacyShot) });
    vpReport.screenshots.push(privacyShot);

    console.log(`[${vp.name}] Testing Scenario 1: 成本分析 problem tag...`);
    await expandProblemTags(page);
    const costTag = page.locator('.hero-problem-tags a[href*="成本分析"]');
    assert.ok(await costTag.isVisible(), '成本分析 tag must be visible in hero');
    await costTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const costCount = await page.locator('#results .card').count();
    assert.ok(costCount >= 10, `成本分析 must recall >= 10 cases (found ${costCount})`);
    const costShot = `${vp.name}-02w-scenario1-cost-analysis.png`;
    await page.screenshot({ path: path.join(outDir, costShot) });
    vpReport.screenshots.push(costShot);

    console.log(`[${vp.name}] Testing Scenario 1: 供應商評估 problem tag...`);
    await expandProblemTags(page);
    const vendorTag = page.locator('.hero-problem-tags a[href*="供應商評估"]');
    assert.ok(await vendorTag.isVisible(), '供應商評估 tag must be visible in hero');
    await vendorTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const vendorCount = await page.locator('#results .card').count();
    assert.ok(vendorCount >= 5, `供應商評估 must recall >= 5 cases (found ${vendorCount})`);
    const vendorShot = `${vp.name}-02x-scenario1-vendor-assessment.png`;
    await page.screenshot({ path: path.join(outDir, vendorShot) });
    vpReport.screenshots.push(vendorShot);

    console.log(`[${vp.name}] Testing Scenario 1: 招募審查 problem tag...`);
    await expandProblemTags(page);
    const recruitTag = page.locator('.hero-problem-tags a[href*="招募審查"]');
    assert.ok(await recruitTag.isVisible(), '招募審查 tag must be visible in hero');
    await recruitTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const recruitCount = await page.locator('#results .card').count();
    assert.ok(recruitCount >= 5, `招募審查 must recall >= 5 cases (found ${recruitCount})`);
    const recruitFirstTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(recruitFirstTitle.includes('面試') || recruitFirstTitle.includes('覆核'), `Top case must be UC-152, got: ${recruitFirstTitle}`);
    const recruitShot = `${vp.name}-02y-scenario1-hiring-screening.png`;
    await page.screenshot({ path: path.join(outDir, recruitShot) });
    vpReport.screenshots.push(recruitShot);
    console.log(`[${vp.name}] Testing Scenario 1: 契約審查 natural query...`);
    await page.locator('#query').fill('契約審查');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const contractCount = await page.locator('#results .card').count();
    assert.ok(contractCount >= 10, `契約審查 must recall >= 10 cases (found ${contractCount})`);
    const cardTexts = await page.locator('#results .card h3').allInnerTexts();
    assert.ok(cardTexts.some(t => t.includes('合約') || t.includes('審核') || t.includes('訂閱') || t.includes('工時')), 'Contract query must surface contract review cases');
    const contractShot = `${vp.name}-03-scenario1-contract-review.png`;
    await page.screenshot({ path: path.join(outDir, contractShot) });
    vpReport.screenshots.push(contractShot);

    console.log(`[${vp.name}] Testing Scenario 1: 做一份競品簡報 natural query with quantifier...`);
    await page.locator('#query').fill('做一份競品簡報');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const quantCompCount = await page.locator('#results .card').count();
    assert.ok(quantCompCount >= 1, `做一份競品簡報 must recall >= 1 case (found ${quantCompCount})`);
    const quantCompTitle = await page.locator('#results .card h3').first().innerText();
    assert.ok(quantCompTitle.includes('競品'), `Top result for 做一份競品簡報 must be competitor case, got: ${quantCompTitle}`);

    console.log(`[${vp.name}] Testing Scenario 1: 一次性爬蟲 natural query with modifier...`);
    await page.locator('#query').fill('一次性爬蟲');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const scraperCount = await page.locator('#results .card').count();
    assert.ok(scraperCount >= 20, `一次性爬蟲 must recall >= 20 cases (found ${scraperCount})`);

    console.log(`[${vp.name}] Testing Scenario 1: 整理一份會議記錄 natural query with verb + quantifier...`);
    await page.locator('#query').fill('整理一份會議記錄');
    await page.locator('#search-submit').click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const meetingCount = await page.locator('#results .card').count();
    assert.ok(meetingCount >= 9, `整理一份會議記錄 must recall >= 9 cases (found ${meetingCount})`);

    const searchAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(searchAxe.violations.length, 0, `Search results accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'search_results', violations: 0 });

    // SCENARIO 2: Empty results & Recovery
    console.log(`[${vp.name}] Testing Scenario 2: Combined conflicting filters & empty recovery...`);
    await page.locator('#query').fill('契約審查');
    await page.locator('#search-submit').click();
    await page.evaluate(() => {
      const sel = document.getElementById('scenario');
      sel.value = '創作';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.locator('#empty').waitFor({ timeout: 5000 });
    assert.ok(await page.locator('#empty').isVisible(), 'Empty state must be visible on conflicting query + scenario');

    // Verify empty state displays recovery suggestions
    assert.ok(await page.locator('#empty-suggestions .recovery-option').first().isVisible(), 'Recovery option must be displayed');
    const emptyShot = `${vp.name}-04-scenario2-empty.png`;
    await page.screenshot({ path: path.join(outDir, emptyShot) });
    vpReport.screenshots.push(emptyShot);

    const emptyAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(emptyAxe.violations.length, 0, `Empty state accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'empty_state', violations: 0 });

    console.log(`[${vp.name}] Testing Scenario 2: Recovering from empty state via condition removal...`);
    const removeScenarioBtn = page.locator('#active-filters [data-remove-filter="scenario"]');
    await removeScenarioBtn.waitFor({ timeout: 5000 });
    await removeScenarioBtn.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const recoveredCount = await page.locator('#results .card').count();
    assert.ok(recoveredCount >= 10, `Recovered count must be >= 10 (found ${recoveredCount})`);
    const recoveredShot = `${vp.name}-05-scenario2-recovered.png`;
    await page.screenshot({ path: path.join(outDir, recoveredShot) });
    vpReport.screenshots.push(recoveredShot);

    const recoveredAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(recoveredAxe.violations.length, 0, `Recovered state accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'recovered_state', violations: 0 });

    // SCENARIO 2b: Compound difficulty + scenario empty recovery via in-facet problem suggestion
    console.log(`[${vp.name}] Testing Scenario 2b: Compound difficulty (入門對話) + scenario (生活) + query (代碼審查)...`);
    await page.evaluate(() => {
      const diff = document.getElementById('difficulty');
      if (diff) {
        diff.value = '入門對話';
        diff.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const scn = document.getElementById('scenario');
      if (scn) {
        scn.value = '生活';
        scn.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.locator('#query').fill('代碼審查');
    await page.locator('#search-submit').click();
    await page.locator('#empty').waitFor({ timeout: 5000 });
    assert.ok(await page.locator('#empty').isVisible(), 'Empty state must be visible on life + novice + code review');
    assert.ok(await page.locator('#empty-suggestions .recovery-option').first().isVisible(), 'Facet removal button must be visible');
    assert.ok(await page.locator('#empty-suggestions .empty-problem-suggestions').isVisible(), 'Problem suggestions container must be visible even with facet removals');
    const travelTag = page.locator('#empty-suggestions [data-problem-tag="旅遊"]');
    assert.ok(await travelTag.isVisible(), '旅遊 problem tag must be visible under 生活 + 入門對話');
    const compoundEmptyShot = `${vp.name}-05b-scenario2-compound-empty.png`;
    await page.screenshot({ path: path.join(outDir, compoundEmptyShot) });
    vpReport.screenshots.push(compoundEmptyShot);

    const compoundEmptyAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(compoundEmptyAxe.violations.length, 0, `Compound empty state accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'compound_empty_state', violations: 0 });

    console.log(`[${vp.name}] Clicking 旅遊 problem suggestion to recover within current scenario...`);
    await travelTag.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const inFacetRecoveredCount = await page.locator('#results .card').count();
    assert.ok(inFacetRecoveredCount >= 10, `In-facet recovered count for 旅遊 must be >= 10 (found ${inFacetRecoveredCount})`);
    assert.equal(await page.locator('#query').inputValue(), '旅遊');
    assert.equal(await page.locator('#scenario').inputValue(), '生活', 'Scenario must remain 生活');
    assert.equal(await page.locator('#difficulty').inputValue(), '入門對話', 'Difficulty must remain 入門對話');
    assert.match(decodeURIComponent(page.url()), /scenario=生活/, 'URL must preserve scenario=生活');
    assert.match(decodeURIComponent(page.url()), /difficulty=入門對話/, 'URL must preserve difficulty=入門對話');
    assert.match(decodeURIComponent(page.url()), /q=旅遊/, 'URL must update to q=旅遊');
    const inFacetRecoveredShot = `${vp.name}-05c-scenario2-in-facet-recovered.png`;
    await page.screenshot({ path: path.join(outDir, inFacetRecoveredShot) });
    vpReport.screenshots.push(inFacetRecoveredShot);

    const inFacetAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(inFacetAxe.violations.length, 0, `In-facet recovered state accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'in_facet_recovered_state', violations: 0 });

    // SCENARIO 2c: A natural question with no literal hit still offers the library
    // term it contains, so the visitor is never stranded with only generic shortcuts.
    console.log(`[${vp.name}] Testing Scenario 2c: Natural question recovery via contained library term...`);
    await page.goto(origin + '?q=' + encodeURIComponent('想省錢') + '#explore', { waitUntil: 'networkidle' });
    await page.locator('#empty').waitFor({ timeout: 10000 });
    assert.ok(await page.locator('#empty').isVisible(), 'Natural question 想省錢 must land on the empty state');
    const containedTerm = page.locator('#empty-suggestions [data-query-recovery="省錢"]');
    assert.ok(await containedTerm.isVisible(), 'The contained library term 省錢 must be offered before generic shortcuts');
    const containedLabel = await containedTerm.innerText();
    const containedCount = Number((containedLabel.match(/搜尋 (\d+) 筆/) || [])[1]);
    assert.ok(containedCount > 0, `Contained-term suggestion must state a positive count (got: ${containedLabel})`);
    const firstSuggestion = await page.locator('#empty-suggestions .recovery-option').first().innerText();
    assert.equal(firstSuggestion, containedLabel, 'Contained-term suggestion must lead the recovery list');
    const containedShot = `${vp.name}-05d-scenario2c-contained-term.png`;
    await page.screenshot({ path: path.join(outDir, containedShot) });
    vpReport.screenshots.push(containedShot);
    const containedAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(containedAxe.violations.length, 0, `Contained-term recovery accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'contained_term_recovery', violations: 0 });

    await containedTerm.click();
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    assert.equal(await page.locator('#query').inputValue(), '省錢');
    const recoveredTotal = Number(((await page.locator('#results-count').innerText()).match(/顯示 (\d+) \//) || [])[1]);
    assert.equal(recoveredTotal, containedCount, `Recovered total must match the promised ${containedCount} (got ${recoveredTotal})`);
    const recoveredCards = await page.locator('#results .card').count();
    assert.ok(recoveredCards > 0 && recoveredCards <= containedCount, `Recovered deck must stay within the promised ${containedCount} results (got ${recoveredCards})`);
    await page.goBack();
    await page.locator('#empty').waitFor({ timeout: 10000 });
    assert.equal(await page.locator('#query').inputValue(), '想省錢', 'Back must restore the original question');

    // SCENARIO 3: Deep link, reading details, proof inspection, guidance expansion, external source, return
    console.log(`[${vp.name}] Testing Scenario 3: Deep link to UC-098, inspecting evidence and guidance...`);
    await page.goto(origin + '?scenario=工作&case=UC-098#explore', { waitUntil: 'networkidle' });
    await page.locator('#detail[open]').waitFor({ timeout: 10000 });
    const detailTitle = await page.locator('#detail-title').innerText();
    assert.ok(detailTitle.includes('PDF') || detailTitle.includes('Excel'), `Detail title must match UC-098 (got: ${detailTitle})`);

    // Verify detail proof badge, claimant attribution, and verification status notes
    assert.ok(await page.locator('.detail-header-meta .proof-badge').isVisible(), 'Detail proof badge must be visible');
    const proofText = await page.locator('.proof-note-tag').innerText();
    assert.ok(proofText.includes('作者報告') || proofText.includes('author-demo'), `Proof tag must indicate author-demo (got: ${proofText})`);
    const claimantText = await page.locator('.proof-note-claimant').innerText();
    assert.match(claimantText, /成果主張來源：社群作者／專案實踐者/, `Claimant attribution must be exact (got: ${claimantText})`);
    const statusText = await page.locator('.proof-note-status').innerText();
    assert.match(statusText, /本庫核讀狀態：本庫未於本機獨立重現代碼或流程/, `Verification status must be exact (got: ${statusText})`);
    const safetyText = await page.locator('.proof-note-safety').innerText();
    assert.match(safetyText, /安全採用建議（落地三層防護）/, `Safe adoption tip must announce three-layer safety (got: ${safetyText})`);
    assert.match(safetyText, /資料去敏/, `Safe adoption tip must specify data sanitization (got: ${safetyText})`);
    assert.match(safetyText, /禁止動作/, `Safe adoption tip must specify forbidden actions (got: ${safetyText})`);
    assert.match(safetyText, /必經審核/, `Safe adoption tip must specify human audit gate (got: ${safetyText})`);
    // Expand guidance using shortcut button
    const guidanceShortcut = page.locator('.reader-guidance-shortcut');
    assert.ok(await guidanceShortcut.isVisible(), 'Guidance shortcut button must be visible');
    await guidanceShortcut.click();
    assert.ok(await page.locator('.reader-guidance').evaluate(e => e.open), 'Guidance details must be open after clicking shortcut');
    assert.ok(await page.locator('.guidance-how').isVisible(), 'How to start guidance card must be visible');
    assert.ok(await page.locator('.guidance-caution').isVisible(), 'Caution guidance card must be visible');

    // Expand external research and inspect link
    const researchToggle = page.locator('.research-details summary');
    assert.ok(await researchToggle.isVisible(), 'Research details toggle must be visible');
    await researchToggle.click();
    assert.ok(await page.locator('.research-details').evaluate(e => e.open), 'Research details must be open');
    const redditLink = page.locator('.research-details a[href*="reddit.com"]');
    assert.ok(await redditLink.isVisible(), 'External source link must be visible');

    const detailShot = `${vp.name}-06-scenario3-detail.png`;
    await page.screenshot({ path: path.join(outDir, detailShot) });
    vpReport.screenshots.push(detailShot);
    // Verify horizontal overflow while modal is open
    const modalOverflow = await page.evaluate(() => {
      const modal = document.getElementById('detail');
      return modal ? modal.scrollWidth > modal.clientWidth : false;
    });
    assert.equal(modalOverflow, false, `Modal horizontal overflow detected on ${vp.name}`);

    const detailAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(detailAxe.violations.length, 0, `Detail modal accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'detail_modal', violations: 0 });

    // Reload check: details must remain open
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#detail[open]').waitFor({ timeout: 10000 });
    assert.ok(await page.locator('#detail-title').isVisible(), 'Detail title must remain visible after reload');

    // Close detail and verify returned state
    await page.locator('#close-detail').click();
    assert.equal(await page.evaluate(() => document.getElementById('scenario').value), '工作', 'Scenario filter 工作 must be retained after closing detail');
    await page.locator('#results .card').first().waitFor({ timeout: 10000 });
    const returnedShot = `${vp.name}-07-scenario3-returned.png`;
    await page.screenshot({ path: path.join(outDir, returnedShot) });
    vpReport.screenshots.push(returnedShot);

    const returnedAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.equal(returnedAxe.violations.length, 0, `Returned state accessibility violations on ${vp.name}`);
    vpReport.axeChecks.push({ state: 'returned_state', violations: 0 });

    // Verify horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(hasHorizontalOverflow, false, `Horizontal overflow detected on ${vp.name}`);

    assert.equal(pageErrors.length, 0, `Page errors on ${vp.name}: ` + pageErrors.join(', '));
    await context.close();
    report.viewports.push(vpReport);
    console.log(`[${vp.name}] ALL SCENARIOS PASSED WITH ZERO AXE VIOLATIONS.`);
  }

  await browser.close();
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('BROWSER VERIFICATION COMPLETE. Report saved to report.json.');
})().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
