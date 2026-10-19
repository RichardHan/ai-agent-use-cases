'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/app.js'),'utf8').split("/* Browser event bindings. */")[0];
// Minimal text-node DOM: tests safe rendering without an installed browser.
class Node {constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.textContent='';} append(...children){this.children.push(...children);} }
const context=vm.createContext({URL,Discovery:require('../assets/discovery.js'),document:{createElement:tag=>new Node(tag),createTextNode:text=>({textContent:text})}});
vm.runInContext(source+'\nthis.api={metadata,parseFile,filterEntries,norm,safeLink,renderMarkdown,tokenize,idVariants,termVariants,matchCase,mapConcurrent,loadCorpus,SYNONYM_MAP};',context);
const api=context.api;
vm.runInContext('displayCopy='+fs.readFileSync(path.join(root,'assets/copy.json'),'utf8'),context);
const files=['cases','evidence'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith('.md')).map(x=>dir+'/'+x)).concat('sources/pending.md');
const entries=files.flatMap(file=>Array.from(api.parseFile(file,fs.readFileSync(path.join(root,file),'utf8'))));
assert(entries.filter(x=>x.kind==='case').length>=10);
assert(entries.filter(x=>x.kind==='evidence').length>=2);
const pendingCount=entries.filter(x=>x.kind==='pending').length;
assert(pendingCount>=3);
assert.equal(api.filterEntries(entries,['路由器斷線'],{}).length,1,'searches deep full content');
assert.equal(api.filterEntries(entries,['OLED'],{tool:'Grok Bot',category:'實體裝置／驗收'})[0].id,'UC-010');
assert.equal(api.filterEntries(entries,[],{kind:'pending',proof:'尚待查證'}).length,pendingCount);
assert.equal(api.filterEntries(entries,['no-matching-case-123'],{}).length,0);
assert.equal(api.filterEntries(entries,[],{}).length,entries.length);
assert.equal(api.filterEntries(entries,['ＧＲＯＫ'],{}).length,api.filterEntries(entries,['grok'],{}).length,'normalizes full-width text');
assert.equal(entries.find(x=>x.id==='UC-007').proof,'官方自報');
assert.equal(entries.find(x=>x.id==='UC-007').title,'找出可能白花的軟體訂閱費');
assert.equal(entries.find(x=>x.id==='P-003').title,'AI 做完後，能自己檢查並修好嗎？');
assert.equal(entries.find(x=>x.id==='P-003').kind,'pending');
assert.equal(api.filterEntries(entries,['CUA'],{kind:'pending'}).length>=1,true,'original terminology remains searchable');
assert.equal(entries.find(x=>x.id==='UC-009').proof,'模板／文件核讀');
assert.equal(entries.find(x=>x.id==='UC-239').originalTitle,'把既有助手接到眼鏡後，晚回、歷史與重開真的接得上嗎','strips full-width pipe delimiter in title');
assert.equal(entries.find(x=>x.id==='UC-262').originalTitle,'角色動畫抽幀後的關鍵姿態覆核','strips full-width pipe delimiter in title');
assert.equal(entries.find(x=>x.id==='UC-239').proof,'作者報告／示範','parses proof with 證據 header and 自述');
assert.equal(entries.find(x=>x.id==='UC-262').proof,'作者報告／示範','parses proof with 證據 header and author-demo');
assert.equal(entries.find(x=>x.id==='UC-095').proof,'作者報告／示範','parses proof with 證據 header and author-demo');
assert.equal(entries.find(x=>x.id==='UC-026').proof,'官方自報','parses proof with 官方 and 第一手使用自述');
assert.equal(entries.find(x=>x.id==='UC-088').proof,'作者報告／示範','parses proof with author-self-report');
assert(api.filterEntries(entries,[],{proof:'作者報告／示範'}).some(x=>x.id==='UC-239'),'filters author demo cases having 證據 header');
assert.equal(entries.find(x=>x.id==='UC-001').scenario,'生活','extracts scenario for UC-001');
assert.equal(entries.find(x=>x.id==='UC-005').scenario,'開發','extracts scenario for UC-005');
assert.equal(entries.find(x=>x.id==='UC-006').scenario,'創作','extracts scenario for UC-006');
assert.equal(entries.find(x=>x.id==='UC-007').scenario,'省錢','extracts scenario for UC-007');
assert(entries.find(x=>x.id==='UC-001').tags.includes('旅遊'),'extracts tags for UC-001');
assert(api.filterEntries(entries,[],{scenario:'生活'}).length>=60,'filters by 生活 scenario');
assert(api.filterEntries(entries,[],{scenario:'開發'}).length>=60,'filters by 開發 scenario');
assert(api.filterEntries(entries,[],{scenario:'工作'}).length>=100,'filters by 工作 scenario');
assert.equal(entries.find(x=>x.id==='UC-109').scenario,'省錢','extracts normalized scenario for UC-109');
assert(entries.find(x=>x.id==='UC-109').tags.includes('優惠券'),'extracts normalized tags for UC-109');
assert.equal(entries.find(x=>x.id==='UC-217').scenario,'開發','extracts normalized scenario for UC-217');
assert(entries.find(x=>x.id==='UC-217').tags.includes('回歸'),'extracts normalized tags for UC-217');
assert.equal(entries.find(x=>x.id==='UC-228').scenario,'生活','normalizes 居家 to 生活 for UC-228');
assert(entries.find(x=>x.id==='UC-228').tags.includes('能源'),'extracts normalized tags for UC-228');
assert.equal(entries.find(x=>x.id==='UC-312').scenario,'生活','normalizes composite scenario to 生活 for UC-312');
assert(entries.find(x=>x.id==='UC-312').tags.includes('環境語音'),'extracts normalized tags for UC-312');
const target313=entries.filter(x=>x.id==='UC-313');
assert.equal(target313.length,1,'corpus has exactly one UC-313 target');
const canonical313=Array.from(api.filterEntries(entries,['UC-313'],{}),x=>x.id).sort();
for(const query of ['UC313','uc313']) {
  const matches=api.filterEntries(entries,[query],{});
  assert.equal(matches.filter(x=>x.id==='UC-313').length,1,`${query} includes the exact target once`);
  assert.deepEqual(Array.from(matches,x=>x.id).sort(),canonical313,`${query} preserves canonical full-text matches including cross-references`);
  assert.equal(api.matchCase(query,entries)?.id,'UC-313',`${query} resolves the exact case, not a referring case`);
}
// Corpus growth may add legitimate references; use a controlled fixture to test
// inclusion of a reference and rejection of an unrelated case without fixed totals.
const reference313=api.parseFile('cases/999-cross-reference.md','# UC-999：交叉引用\n\n- 核心目標：比較UC-313的交接驗收。')[0];
const unrelated313=api.parseFile('cases/998-unrelated.md','# UC-998：無關案例\n\n- 核心目標：整理花園筆記。')[0];
const idSearchFixture=[reference313,unrelated313,target313[0]];
for(const query of ['UC-313','UC313','uc313']) {
  assert.deepEqual(Array.from(api.filterEntries(idSearchFixture,[query],{}),x=>x.id).sort(),['UC-313','UC-999'],`${query} includes target and reference but excludes unrelated content`);
  assert.equal(api.matchCase(query,idSearchFixture)?.id,'UC-313',`${query} selects target even when a reference appears first`);
}
assert.equal(api.filterEntries(entries,['UC-001'],{}).length,9,'matches standard case ID');
assert.equal(api.filterEntries(entries,['UC001'],{}).length,9,'matches unhyphenated padded case ID');
assert.equal(api.filterEntries(entries,['uc001'],{}).length,9,'matches lowercase unhyphenated padded case ID');
assert.equal(api.filterEntries(entries,['UC1'],{}).length,9,'matches unpadded case ID');
assert.equal(api.filterEntries(entries,['UC-1'],{}).length,9,'matches unpadded hyphenated case ID');
assert.equal(api.filterEntries(entries,['P003'],{}).length,1,'matches unhyphenated pending ID');
assert.equal(api.filterEntries(entries,['p3'],{}).length,1,'matches lowercase unpadded pending ID');
assert.equal(api.filterEntries(entries,['P-3'],{}).length,1,'matches hyphenated unpadded pending ID');
assert.deepEqual(Array.from(api.tokenize('旅遊、排程')),['旅遊','排程']);
const punctMatches = api.filterEntries(entries, Array.from(api.tokenize('旅遊、排程')), {});
assert(punctMatches.length >= 5 && punctMatches.length < 50, 'tokenizes punctuation-separated query and filters combined terms');
assert(punctMatches.some(x => x.id === 'UC-001'), 'punctuation-separated query matches UC-001');
assert(punctMatches.some(x => x.id === 'UC-040'), 'punctuation-separated query matches UC-040');
assert.equal(api.matchCase('UC313',entries)?.id,'UC-313');
assert.equal(api.matchCase('uc-313',entries)?.id,'UC-313');
assert.equal(api.matchCase('UC 314',entries)?.id,'UC-314');
assert.equal(api.matchCase('uc 314',entries)?.id,'UC-314');
assert.equal(api.matchCase('314',entries)?.id,'UC-314');
assert.equal(api.matchCase('#314',entries)?.id,'UC-314');
assert.equal(api.matchCase('1',entries)?.id,'UC-001');
assert.equal(api.matchCase('UC 1',entries)?.id,'UC-001');
assert.equal(api.matchCase('UC1',entries)?.id,'UC-001');
assert.equal(api.matchCase('uc-1',entries)?.id,'UC-001');
assert.equal(api.matchCase('P003',entries)?.id,'P-003');
assert.equal(api.matchCase('P 003',entries)?.id,'P-003');
assert.equal(api.matchCase('p3',entries)?.id,'P-003');
assert.equal(api.matchCase('p 3',entries)?.id,'P-003');
assert.equal(api.matchCase(null,entries),null);
assert.deepEqual(Array.from(api.tokenize('UC 001')),['uc-001'],'tokenizes space-separated case ID');
assert.deepEqual(Array.from(api.tokenize('uc 1')),['uc-1'],'tokenizes space-separated unpadded case ID');
assert.deepEqual(Array.from(api.tokenize('#314')),['uc-314'],'tokenizes hash-prefixed case ID');
assert.deepEqual(Array.from(api.tokenize('P 003')),['p-003'],'tokenizes space-separated pending ID');
assert.deepEqual(Array.from(api.tokenize('p 3')),['p-3'],'tokenizes space-separated unpadded pending ID');
assert.equal(api.filterEntries(entries,Array.from(api.tokenize('UC 001')),{}).length,9,'filters space-separated case ID');
assert.equal(api.filterEntries(entries,Array.from(api.tokenize('UC 1')),{}).length,9,'filters space-separated unpadded case ID');
assert.equal(api.filterEntries(entries,Array.from(api.tokenize('UC 314')),{}).length,2,'filters space-separated 314');
assert.equal(api.filterEntries(entries,Array.from(api.tokenize('#314')),{}).length,2,'filters hash-prefixed 314');
assert.equal(api.filterEntries(entries,Array.from(api.tokenize('P 003')),{}).length,1,'filters space-separated pending ID');
assert.equal(api.filterEntries(entries,Array.from(api.tokenize('p 3')),{}).length,1,'filters space-separated unpadded pending ID');
assert.equal(api.safeLink('javascript:alert(1)','cases/test.md'),null);
assert.equal(api.safeLink('../sources/README.md#s-001','cases/test.md'),'https://github.com/RichardHan/ai-agent-use-cases/blob/main/sources/README.md#s-001');

// Search quality: punctuation tolerance (quotes, brackets, semicolons, pipes)
assert.deepEqual(Array.from(api.tokenize('「旅遊」')), ['旅遊'], 'strips corner brackets/quotes');
assert.deepEqual(Array.from(api.tokenize('“收件匣”')), ['收件匣'], 'strips curly double quotes');
assert.deepEqual(Array.from(api.tokenize('"比價"')), ['比價'], 'strips straight double quotes');
assert.deepEqual(Array.from(api.tokenize('【每日】；【報表】')), ['每日', '報表'], 'splits by semicolons and strips brackets');
assert.deepEqual(Array.from(api.tokenize('旅遊|比價')), ['旅遊', '比價'], 'splits by pipe delimiter');
assert.equal(api.filterEntries(entries, Array.from(api.tokenize('「旅遊」')), {}).length, api.filterEntries(entries, ['旅遊'], {}).length, 'quoted query matches unquoted content');
assert.equal(api.filterEntries(entries, Array.from(api.tokenize('“收件匣”')), {}).length, api.filterEntries(entries, ['收件匣'], {}).length, 'curly quoted query matches unquoted content');
assert(api.filterEntries(entries, Array.from(api.tokenize('320')), {}).some(x => x.id === 'UC-320'), 'plain number query includes target UC case');

// Search quality: README recommended query '每日報表' and domain synonyms
const dailyReportMatches = api.filterEntries(entries, Array.from(api.tokenize('每日報表')), {});
assert(dailyReportMatches.length > 0, 'README recommended query 每日報表 must return matching cases');
assert(dailyReportMatches.some(x => x.id === 'UC-322'), '每日報表 includes UC-322 daily metrics collection');
assert(dailyReportMatches.some(x => x.id === 'UC-049'), '每日報表 includes UC-049 daily inbox report');
assert.equal(api.filterEntries(entries, Array.from(api.tokenize('「每日報表」')), {}).length, dailyReportMatches.length, 'quoted 每日報表 matches unquoted');

// Domain synonyms and orthographic variant tolerance
assert(api.filterEntries(entries, Array.from(api.tokenize('儀錶板')), {}).length > 0, '儀錶板 matches 儀表板 cases');
assert(api.filterEntries(entries, Array.from(api.tokenize('折價券')), {}).length > 0, '折價券 matches 優惠券 cases');
assert(api.filterEntries(entries, Array.from(api.tokenize('賬單')), {}).length > 0, '賬單 matches 帳單 cases');
assert(api.filterEntries(entries, Array.from(api.tokenize('記賬')), {}).length > 0, '記賬 matches 記帳 cases');
assert(api.filterEntries(entries, Array.from(api.tokenize('登錄')), {}).length > 0, '登錄 matches 登入 cases');

// Search quality: query punctuation tolerance (question marks, exclamation marks, colons)
assert.deepEqual(Array.from(api.tokenize('旅遊？')), ['旅遊'], 'strips full-width question mark');
assert.deepEqual(Array.from(api.tokenize('旅遊?')), ['旅遊'], 'strips ASCII question mark');
assert.deepEqual(Array.from(api.tokenize('比價！')), ['比價'], 'strips full-width exclamation mark');
assert.deepEqual(Array.from(api.tokenize('比價!')), ['比價'], 'strips ASCII exclamation mark');
assert.deepEqual(Array.from(api.tokenize('UC:001')), ['uc-001'], 'normalizes ASCII colon in case ID');
assert.deepEqual(Array.from(api.tokenize('UC：001')), ['uc-001'], 'normalizes full-width colon in case ID');
assert.deepEqual(Array.from(api.tokenize('情境：工作')), ['情境', '工作'], 'splits colon-separated query into tokens');
assert.equal(api.filterEntries(entries, Array.from(api.tokenize('旅遊？')), {}).length, api.filterEntries(entries, ['旅遊'], {}).length, 'question mark query matches target cases');
assert.equal(api.filterEntries(entries, Array.from(api.tokenize('比價！')), {}).length, api.filterEntries(entries, ['比價'], {}).length, 'exclamation query matches target cases');
assert.equal(api.filterEntries(entries, Array.from(api.tokenize('UC:001')), {}).length, 9, 'colon-separated UC:001 matches case');
assert.equal(api.filterEntries(entries, Array.from(api.tokenize('UC：001')), {}).length, 9, 'full-width colon UC：001 matches case');
assert.equal(api.matchCase('UC:001', entries)?.id, 'UC-001', 'matchCase supports colon in ID');
assert.equal(api.matchCase('UC：001', entries)?.id, 'UC-001', 'matchCase supports full-width colon in ID');

// Search quality: presentations (簡報 / 投影片 / ppt / powerpoint)
const slideMatches = api.filterEntries(entries, Array.from(api.tokenize('投影片')), {});
assert(slideMatches.length >= 20, '投影片 query must match 簡報 cases via synonym map');
assert(slideMatches.some(x => x.id === 'UC-019'), '投影片 includes UC-019 deck preparation');
assert(api.filterEntries(entries, Array.from(api.tokenize('ppt')), {}).some(x => x.id === 'UC-019'), 'ppt includes UC-019 deck preparation');

// Search quality: crawling / scraping (爬蟲 / 抓取 / 採集 / scraping)
const crawlMatches = api.filterEntries(entries, Array.from(api.tokenize('爬蟲')), {});
assert(crawlMatches.length >= 10, '爬蟲 query must match 抓取/採集 cases via synonym map');
assert(crawlMatches.some(x => x.id === 'UC-322'), '爬蟲 includes UC-322 data collection');

// Search quality: spreadsheets (試算表 / excel / sheets)
const sheetMatches = api.filterEntries(entries, Array.from(api.tokenize('試算表')), {});
assert(sheetMatches.some(x => x.id === 'UC-325'), '試算表 includes UC-325 excel sync');

// Search quality: transcripts & speech (逐字稿 / 轉錄)
const transcriptMatches = api.filterEntries(entries, Array.from(api.tokenize('逐字稿')), {});
assert(transcriptMatches.some(x => x.id === 'UC-191'), '逐字稿 includes UC-191 podcast transcription');

// Search quality: databases (資料庫 / 數據庫)
const dbMatches = api.filterEntries(entries, Array.from(api.tokenize('數據庫')), {});
assert(dbMatches.some(x => x.id === 'UC-324'), '數據庫 matches 資料庫 cases (UC-324 outage DB PR)');

// Search quality: connectors (+, &, ＋, ＆) and hashtags (#)
assert.deepEqual(Array.from(api.tokenize('旅遊+比價')), ['旅遊', '比價'], 'splits query with plus sign');
assert.deepEqual(Array.from(api.tokenize('旅遊 + 比價')), ['旅遊', '比價'], 'splits query with spaced plus sign');
assert.deepEqual(Array.from(api.tokenize('旅遊 & 比價')), ['旅遊', '比價'], 'splits query with ampersand');
assert.deepEqual(Array.from(api.tokenize('旅遊 ＆ 比價')), ['旅遊', '比價'], 'splits query with full-width ampersand');
assert.deepEqual(Array.from(api.tokenize('#旅遊#比價')), ['旅遊', '比價'], 'splits query with adjacent hashtags');
assert(api.filterEntries(entries, Array.from(api.tokenize('旅遊+比價')), {}).some(x => x.id === 'UC-001'), '旅遊+比價 finds UC-001');
assert(api.filterEntries(entries, Array.from(api.tokenize('旅遊 & 比價')), {}).some(x => x.id === 'UC-001'), '旅遊 & 比價 finds UC-001');

// Search quality: expanded domain synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('行事曆')), {}).some(x => x.id === 'UC-043'), '行事曆 matches UC-043 via 日曆 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('calendar')), {}).some(x => x.id === 'UC-043'), 'calendar matches UC-043 via 日曆 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('代辦')), {}).some(x => x.id === 'UC-081'), '代辦 matches UC-081 via 待辦 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('todo')), {}).some(x => x.id === 'UC-081'), 'todo matches UC-081 via 待辦 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('報帳')), {}).some(x => x.id === 'UC-024'), '報帳 matches UC-024 via 發票/帳單 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('核銷')), {}).some(x => x.id === 'UC-225'), '核銷 matches UC-225 via 收據/憑證 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('debug')), {}).some(x => x.id === 'UC-316'), 'debug matches UC-316 via 修復/bug synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('排錯')), {}).some(x => x.id === 'UC-005'), '排錯 matches UC-005 via 除錯/修復 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('workflow')), {}).some(x => x.id === 'UC-006'), 'workflow matches UC-006 via 排程/工作流 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('面試')), {}).some(x => x.id === 'UC-035'), '面試 matches UC-035 via 求職/履歷 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('resume')), {}).some(x => x.id === 'UC-035'), 'resume matches UC-035 via 求職/履歷 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('email')), {}).some(x => x.id === 'UC-049'), 'email matches UC-049 via 郵件/信箱 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('代碼')), {}).some(x => x.id === 'UC-005'), '代碼 matches UC-005 via 程式碼/程式 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('ticket')), {}).some(x => x.id === 'UC-164'), 'ticket matches UC-164 via 工單 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('飯店')), {}).some(x => x.id === 'UC-151'), '飯店 matches UC-151 via 住宿/旅遊 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('hotel')), {}).some(x => x.id === 'UC-151'), 'hotel matches UC-151 via 住宿/旅遊 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('multi-agent')), {}).some(x => x.id === 'UC-005'), 'multi-agent matches UC-005 via 多代理 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('backup')), {}).some(x => x.id === 'UC-067'), 'backup matches UC-067 via 備份 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('restore')), {}).some(x => x.id === 'UC-067'), 'restore matches UC-067 via 還原/復原 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('monitor')), {}).some(x => x.id === 'UC-015'), 'monitor matches UC-015 via 監看/監控 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('weekly')), {}).some(x => x.id === 'UC-003'), 'weekly matches UC-003 via 週報 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('health')), {}).some(x => x.id === 'UC-041'), 'health matches UC-041 via 健康/醫療 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('call')), {}).some(x => x.id === 'UC-257'), 'call matches UC-257 via 電話/通話 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('security')), {}).some(x => x.id === 'UC-009'), 'security matches UC-009 via 資安/安全性 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('privacy')), {}).some(x => x.id === 'UC-009'), 'privacy matches UC-009 via 隱私 synonym');

// Validate 100% mathematical symmetry and reflexivity of SYNONYM_MAP
for (const [key, variants] of Object.entries(api.SYNONYM_MAP)) {
  assert(variants.includes(key), `SYNONYM_MAP entry "${key}" must include itself`);
  for (const variant of variants) {
    assert(api.SYNONYM_MAP[variant], `SYNONYM_MAP variant "${variant}" from key "${key}" must also be a registered key in SYNONYM_MAP`);
    assert(api.SYNONYM_MAP[variant].includes(key), `SYNONYM_MAP must be symmetric: "${variant}" must map back to "${key}"`);
  }
}

// Search quality: README core queries & cross-strait/domain synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('旅行')), {}).some(x => x.id === 'UC-001'), '旅行 matches UC-001 via 旅遊 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('travel')), {}).some(x => x.id === 'UC-001'), 'travel matches UC-001 via 旅遊 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('收件箱')), {}).some(x => x.id === 'UC-049'), '收件箱 matches UC-049 via 收件匣 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('inbox')), {}).some(x => x.id === 'UC-049'), 'inbox matches UC-049 via 收件匣 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('特價')), {}).some(x => x.id === 'UC-037'), '特價 matches UC-037 via 比價/折扣 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('比价')), {}).some(x => x.id === 'UC-037'), '比价 matches UC-037 via 比價 synonym');

// Search quality: work, collaboration & domain extensions
assert(api.filterEntries(entries, Array.from(api.tokenize('開會')), {}).some(x => x.id === 'UC-008'), '開會 matches UC-008 via 會議 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('meeting')), {}).some(x => x.id === 'UC-008'), 'meeting matches UC-008 via 會議 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('alert')), {}).some(x => x.id === 'UC-272'), 'alert matches UC-272 via 提醒/通知 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('推播')), {}).some(x => x.id === 'UC-295'), '推播 matches UC-295 via 提醒/通知 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('refund')), {}).some(x => x.id === 'UC-014'), 'refund matches UC-014 via 退款/退貨 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('podcast')), {}).some(x => x.id === 'UC-132'), 'podcast matches UC-132 via 播客 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('智能家居')), {}).some(x => x.id === 'UC-330'), '智能家居 matches UC-330 via 智慧家庭 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('iot')), {}).some(x => x.id === 'UC-170'), 'iot matches UC-170 via 智慧家庭/裝置 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('對帳')), {}).some(x => x.id === 'UC-206'), '對帳 matches UC-206 via reconciliation synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('reconciliation')), {}).some(x => x.id === 'UC-206'), 'reconciliation matches UC-206 via 對帳 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('job')), {}).some(x => x.id === 'UC-035'), 'job matches UC-035 via 求職/履歷 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('hiring')), {}).some(x => x.id === 'UC-035'), 'hiring matches UC-035 via 招募/求職 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('晨報')), {}).some(x => x.id === 'UC-008'), '晨報 matches UC-008 via 每日報表 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('登入')), {}).some(x => x.id === 'UC-330'), '登入 matches UC-330 via 登錄 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('排程')), {}).some(x => x.id === 'UC-006'), '排程 matches UC-006 via workflow synonym');

// Search quality & punctuation: full-stop and dot tolerance
assert.deepEqual(Array.from(api.tokenize('旅遊。')), ['旅遊'], 'tokenize strips Chinese full stop');
assert.deepEqual(Array.from(api.tokenize('比價.')), ['比價'], 'tokenize strips English period');
assert.deepEqual(Array.from(api.tokenize('UC#001')), ['uc-001'], 'tokenize normalizes UC#001 into uc-001');
assert.deepEqual(Array.from(api.tokenize('UC.001')), ['uc-001'], 'tokenize normalizes UC.001 into uc-001');
assert.deepEqual(Array.from(api.tokenize('P#003')), ['p-003'], 'tokenize normalizes P#003 into p-003');
assert(api.matchCase('UC#001', entries)?.id === 'UC-001', 'matchCase finds UC-001 with hashtag');
assert(api.matchCase('UC.001', entries)?.id === 'UC-001', 'matchCase finds UC-001 with dot');

// Search quality: Core AI terminology & high frequency domain synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('智能體')), {}).some(x => x.id === 'UC-005'), '智能體 matches UC-005 via agent/代理 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('智能体')), {}).some(x => x.id === 'UC-005'), '智能体 matches UC-005 via agent/代理 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('文字辨識')), {}).some(x => x.id === 'UC-178'), '文字辨識 matches UC-178 via ocr synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('圖片辨識')), {}).some(x => x.id === 'UC-178'), '圖片辨識 matches UC-178 via ocr synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('translate')), {}).some(x => x.id === 'UC-001'), 'translate matches UC-001 via 翻譯 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('總結')), {}).some(x => x.id === 'UC-002'), '總結 matches UC-002 via 摘要 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('summarize')), {}).some(x => x.id === 'UC-002'), 'summarize matches UC-002 via 摘要 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('crawler')), {}).some(x => x.id === 'UC-086'), 'crawler matches UC-086 via 爬蟲/抓取 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('scraper')), {}).some(x => x.id === 'UC-086'), 'scraper matches UC-086 via 爬蟲/抓取 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('視頻')), {}).some(x => x.id === 'UC-002'), '視頻 matches UC-002 via 影片 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('推特')), {}).some(x => x.id === 'UC-055'), '推特 matches UC-055 via x/twitter synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('cron')), {}).some(x => x.id === 'UC-006'), 'cron matches UC-006 via 排程/定時 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('排障')), {}).some(x => x.id === 'UC-005'), '排障 matches UC-005 via troubleshooting/修復 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('troubleshooting')), {}).some(x => x.id === 'UC-005'), 'troubleshooting matches UC-005 via 排障/修復 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('rag')), {}).some(x => x.id === 'UC-060'), 'rag matches UC-060 via 知識庫/檢索 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('auto-reply')), {}).some(x => x.id === 'UC-060'), 'auto-reply matches UC-060 via 自動回覆 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('qa')), {}).some(x => x.id === 'UC-217'), 'qa matches UC-217 via 測試 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('audit')), {}).some(x => x.id === 'UC-073'), 'audit matches UC-073 via 審查/審核 synonym');

// Search quality: Logistics, shipping, delivery synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('快遞')), {}).some(x => x.id === 'UC-331'), '快遞 matches UC-331 via 物流/快遞 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('shipping')), {}).some(x => x.id === 'UC-331'), 'shipping matches UC-331 via 物流/包裹 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('delivery')), {}).some(x => x.id === 'UC-331'), 'delivery matches UC-331 via 物流/運送 synonym');

// Search quality: Social media, posting & publishing synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('發帖')), {}).some(x => x.id === 'UC-332'), '發帖 matches UC-332 via 發文/貼文 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('sns')), {}).some(x => x.id === 'UC-332'), 'sns matches UC-332 via 社群 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('社交媒體')), {}).some(x => x.id === 'UC-332'), '社交媒體 matches UC-332 via 社群 synonym');

// Search quality: Outreach & cold email synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('outreach')), {}).some(x => x.id === 'UC-333'), 'outreach matches UC-333 via 外聯 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('開發信')), {}).some(x => x.id === 'UC-333'), '開發信 matches UC-333 via 外聯 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('拓客')), {}).some(x => x.id === 'UC-333'), '拓客 matches UC-333 via 外聯 synonym');

// Search quality: Customer, client & user synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('顧客')), {}).some(x => x.id === 'UC-014'), '顧客 matches UC-014 via 客戶 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('customer')), {}).some(x => x.id === 'UC-014'), 'customer matches UC-014 via 客戶 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('client')), {}).some(x => x.id === 'UC-014'), 'client matches UC-014 via 客戶 synonym');

// Search quality: Memory & knowledge memory synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('memory')), {}).some(x => x.id === 'UC-071'), 'memory matches UC-071 via 記憶 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('記憶庫')), {}).some(x => x.id === 'UC-333'), '記憶庫 matches UC-333 via 記憶 synonym');

// Search quality: Prompt & instruction synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('prompt')), {}).some(x => x.id === 'UC-001'), 'prompt matches UC-001 via 提示詞 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('提示語')), {}).some(x => x.id === 'UC-001'), '提示語 matches UC-001 via 提示詞 synonym');

// Search quality: Approval & audit gate synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('審批')), {}).some(x => x.id === 'UC-331'), '審批 matches UC-331 via 核准 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('approval')), {}).some(x => x.id === 'UC-331'), 'approval matches UC-331 via 核准 synonym');

// Search quality: Ecommerce & online shopping synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('ecommerce')), {}).some(x => x.id === 'UC-331'), 'ecommerce matches UC-331 via 網購/購物 synonym');

// Search quality: Legal & contract synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('合同')), {}).some(x => x.id === 'UC-021'), '合同 matches UC-021 via 合約 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('contract')), {}).some(x => x.id === 'UC-021'), 'contract matches UC-021 via 合約 synonym');

// Search quality: Reimbursement & expense claims synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('報銷')), {}).some(x => x.id === 'UC-206'), '報銷 matches UC-206 via 報帳/核銷/對帳 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('reimbursement')), {}).some(x => x.id === 'UC-206'), 'reimbursement matches UC-206 via 報帳/核銷/對帳 synonym');

// Search quality: Salary & payroll synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('薪水')), {}).some(x => x.id === 'UC-230'), '薪水 matches UC-230 via 薪資 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('salary')), {}).some(x => x.id === 'UC-230'), 'salary matches UC-230 via 薪資 synonym');

// Search quality: Customer complaint synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('客訴')), {}).some(x => x.id === 'UC-014'), '客訴 matches UC-014 via 客服/工單 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('投訴')), {}).some(x => x.id === 'UC-014'), '投訴 matches UC-014 via 客服/工單 synonym');

// Search quality: Device & hardware synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('device')), {}).some(x => x.id === 'UC-330'), 'device matches UC-330 via 設備/裝置 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('硬體')), {}).some(x => x.id === 'UC-330'), '硬體 matches UC-330 via 設備/裝置 synonym');

// Search quality: Compliance & regulation synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('compliance')), {}).some(x => x.id === 'UC-102'), 'compliance matches UC-102 via 合規/法規 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('規章')), {}).some(x => x.id === 'UC-102'), '規章 matches UC-102 via 合規/法規 synonym');

// Search quality: Deployment synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('deploy')), {}).some(x => x.id === 'UC-214'), 'deploy matches UC-214 via 部署 synonym');

// Search quality: Sync synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('sync')), {}).some(x => x.id === 'UC-320'), 'sync matches UC-320 via 同步 synonym');

// Search quality: Dashboard & visual chart synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('dashboard')), {}).some(x => x.id === 'UC-310'), 'dashboard matches UC-310 via 儀表板 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('chart')), {}).some(x => x.id === 'UC-031'), 'chart matches UC-031 via 圖表 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('趨勢圖')), {}).some(x => x.id === 'UC-031'), '趨勢圖 matches UC-031 via 圖表/chart synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('chart')), {}).some(x => x.id === 'UC-032'), 'chart matches UC-032 via 趨勢圖 synonym');

// Search quality: Search & retrieval synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('search')), {}).some(x => x.id === 'UC-060'), 'search matches UC-060 via 搜尋 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('retrieval')), {}).some(x => x.id === 'UC-060'), 'retrieval matches UC-060 via rag/檢索 synonym');

// Search quality: Permission and authorization synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('permission')), {}).some(x => x.id === 'UC-283'), 'permission matches UC-283 via 權限 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('authorization')), {}).some(x => x.id === 'UC-283'), 'authorization matches UC-283 via 授權 synonym');

// Search quality: Inventory & stock synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('inventory')), {}).some(x => x.id === 'UC-003'), 'inventory matches UC-003 via 庫存 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('stock')), {}).some(x => x.id === 'UC-003'), 'stock matches UC-003 via 庫存 synonym');

// Search quality: Quote & quotation synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('quote')), {}).some(x => x.id === 'UC-136'), 'quote matches UC-136 via 報價 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('quotation')), {}).some(x => x.id === 'UC-136'), 'quotation matches UC-136 via 報價 synonym');

// Search quality: Cache & caching synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('cache')), {}).some(x => x.id === 'UC-049'), 'cache matches UC-049 via 快取 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('caching')), {}).some(x => x.id === 'UC-049'), 'caching matches UC-049 via 快取 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('緩存')), {}).some(x => x.id === 'UC-049'), '緩存 matches UC-049 via 快取 synonym');

// Search quality: Job interview synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('interview')), {}).some(x => x.id === 'UC-035'), 'interview matches UC-035 via 面試 synonym');

// Search quality: Interface & API synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('interface')), {}).some(x => x.id === 'UC-015'), 'interface matches UC-015 via 介面 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('接口')), {}).some(x => x.id === 'UC-015'), '接口 matches UC-015 via 介面 synonym');

// Search quality: Retry synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('retry')), {}).some(x => x.id === 'UC-041'), 'retry matches UC-041 via 重試 synonym');

// Search quality: Alert & alarm synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('告警')), {}).some(x => x.id === 'UC-015'), '告警 matches UC-015 via 提醒/alert synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('警報')), {}).some(x => x.id === 'UC-015'), '警報 matches UC-015 via 提醒/alert synonym');

// Search quality: Rollback synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('rollback')), {}).some(x => x.id === 'UC-069'), 'rollback matches UC-069 via 復原/還原 synonym');

// Search quality: Verification & validation synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('validate')), {}).some(x => x.id === 'UC-156'), 'validate matches UC-156 via 驗證 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('verify')), {}).some(x => x.id === 'UC-156'), 'verify matches UC-156 via 驗證 synonym');

// Search quality: Subscription synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('subscription')), {}).some(x => x.id === 'UC-007'), 'subscription matches UC-007 via 訂閱 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('subscriptions')), {}).some(x => x.id === 'UC-007'), 'subscriptions matches UC-007 via 訂閱 synonym');

// Search quality: Plugin & extension synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('plugin')), {}).some(x => x.id === 'UC-005'), 'plugin matches UC-005 via 外掛 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('extension')), {}).some(x => x.id === 'UC-005'), 'extension matches UC-005 via 外掛 synonym');

// Search quality: Pipeline synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('pipeline')), {}).some(x => x.id === 'UC-042'), 'pipeline matches UC-042 via 流水線/workflow synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('pipelines')), {}).some(x => x.id === 'UC-042'), 'pipelines matches UC-042 via 流水線/workflow synonym');

// Search quality: Test & regression synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('test')), {}).some(x => x.id === 'UC-006'), 'test matches UC-006 via 測試 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('regression')), {}).some(x => x.id === 'UC-217'), 'regression matches UC-217 via 回歸/測試 synonym');

// Search quality: Daily report synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('daily')), {}).some(x => x.id === 'UC-041'), 'daily matches UC-041 via 日報/每日報表 synonym');

// Search quality: Budget synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('budget')), {}).some(x => x.id === 'UC-022'), 'budget matches UC-022 via 預算 synonym');

// Search quality: Log & logging synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('logging')), {}).some(x => x.id === 'UC-096'), 'logging matches UC-096 via 日誌 synonym');

// Search quality: Refunds plural
assert(api.filterEntries(entries, Array.from(api.tokenize('refunds')), {}).some(x => x.id === 'UC-088'), 'refunds matches UC-088 via 退款 synonym');

// Search quality: Agreement synonym
assert(api.filterEntries(entries, Array.from(api.tokenize('agreement')), {}).some(x => x.id === 'UC-021'), 'agreement matches UC-021 via 合約 synonym');

// Search quality: Database synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('database')), {}).some(x => x.id === 'UC-060'), 'database matches UC-060 via 資料庫 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('数据库')), {}).some(x => x.id === 'UC-060'), '数据库 matches UC-060 via 資料庫 synonym');

// Search quality: Login synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('login')), {}).some(x => x.id === 'UC-005'), 'login matches UC-005 via 登入 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('signin')), {}).some(x => x.id === 'UC-005'), 'signin matches UC-005 via 登入 synonym');

// Search quality: Spreadsheet synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('spreadsheet')), {}).some(x => x.id === 'UC-209'), 'spreadsheet matches UC-209 via 試算表 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('spreadsheets')), {}).some(x => x.id === 'UC-209'), 'spreadsheets matches UC-209 via 試算表 synonym');

// Search quality: Attachment synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('attachment')), {}).some(x => x.id === 'UC-234'), 'attachment matches UC-234 via 附件 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('attachments')), {}).some(x => x.id === 'UC-234'), 'attachments matches UC-234 via 附件 synonym');

// Search quality: Trigger synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('trigger')), {}).some(x => x.id === 'UC-074'), 'trigger matches UC-074 via 觸發 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('triggers')), {}).some(x => x.id === 'UC-074'), 'triggers matches UC-074 via 觸發 synonym');

// Search quality: Credential & secret synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('credential')), {}).some(x => x.id === 'UC-042'), 'credential matches UC-042 via 憑證 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('credentials')), {}).some(x => x.id === 'UC-042'), 'credentials matches UC-042 via 憑證 synonym');

// Search quality: Template synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('template')), {}).some(x => x.id === 'UC-009'), 'template matches UC-009 via 模板 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('templates')), {}).some(x => x.id === 'UC-009'), 'templates matches UC-009 via 模板 synonym');

// Search quality: Anomaly synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('anomaly')), {}).some(x => x.id === 'UC-034'), 'anomaly matches UC-034 via 異常 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('anomalies')), {}).some(x => x.id === 'UC-034'), 'anomalies matches UC-034 via 異常 synonym');

// Search quality: Webhooks plural
assert(api.filterEntries(entries, Array.from(api.tokenize('webhooks')), {}).some(x => x.id === 'UC-074'), 'webhooks matches UC-074 via webhook synonym');

// Search quality: Scrape base verb
assert(api.filterEntries(entries, Array.from(api.tokenize('scrape')), {}).some(x => x.id === 'UC-060'), 'scrape matches UC-060 via 爬蟲 synonym');

// Search quality: Troubleshoot and debugging
assert(api.filterEntries(entries, Array.from(api.tokenize('troubleshoot')), {}).some(x => x.id === 'UC-068'), 'troubleshoot matches UC-068 via debug/排錯 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('debugging')), {}).some(x => x.id === 'UC-068'), 'debugging matches UC-068 via debug/除錯 synonym');

// Search quality: Todos and task
assert(api.filterEntries(entries, Array.from(api.tokenize('todos')), {}).some(x => x.id === 'UC-049'), 'todos matches UC-049 via 待辦 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('tasks')), {}).some(x => x.id === 'UC-049'), 'tasks matches UC-049 via 待辦 synonym');

// Search quality: Bills and billing
assert(api.filterEntries(entries, Array.from(api.tokenize('bills')), {}).some(x => x.id === 'UC-028'), 'bills matches UC-028 via 帳單 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('billing')), {}).some(x => x.id === 'UC-028'), 'billing matches UC-028 via 帳單 synonym');

// Search quality: Invoices and receipts
assert(api.filterEntries(entries, Array.from(api.tokenize('invoices')), {}).some(x => x.id === 'UC-024'), 'invoices matches UC-024 via 發票 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('receipts')), {}).some(x => x.id === 'UC-225'), 'receipts matches UC-225 via 收據 synonym');

// Search quality: Marketing & advertising synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('marketing')), {}).some(x => x.id === 'UC-022'), 'marketing matches UC-022 via 行銷/廣告 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('advertising')), {}).some(x => x.id === 'UC-022'), 'advertising matches UC-022 via 廣告 synonym');

// Search quality: Procurement & purchasing synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('procurement')), {}).some(x => x.id === 'UC-101'), 'procurement matches UC-101 via 採購/招標 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('purchasing')), {}).some(x => x.id === 'UC-007'), 'purchasing matches UC-007 via 採購 synonym');

// Search quality: Form & survey synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('forms')), {}).some(x => x.id === 'UC-102'), 'forms matches UC-102 via 表單 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('survey')), {}).some(x => x.id === 'UC-102'), 'survey matches UC-102 via 表單/問卷 synonym');

// Search quality: Meeting records & minutes synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('會議記錄')), {}).some(x => x.id === 'UC-094'), '會議記錄 matches UC-094 via 會議/會議紀錄 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('會議紀要')), {}).some(x => x.id === 'UC-277'), '會議紀要 matches UC-277 via 會議/會議紀錄 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('minutes')), {}).some(x => x.id === 'UC-094'), 'minutes matches UC-094 via 會議紀錄/會議 synonym');

// Search quality: Large language model synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('大型語言模型')), {}).some(x => x.id === 'UC-161'), '大型語言模型 matches UC-161 via llm/模型 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('大模型')), {}).some(x => x.id === 'UC-161'), '大模型 matches UC-161 via llm/模型 synonym');

// Search quality: Scraping (爬取) verb
assert(api.filterEntries(entries, Array.from(api.tokenize('爬取')), {}).some(x => x.id === 'UC-060'), '爬取 matches UC-060 via 爬蟲/抓取 synonym');

// Search quality: Diff & matching comparison
assert(api.filterEntries(entries, Array.from(api.tokenize('diff')), {}).some(x => x.id === 'UC-024'), 'diff matches UC-024 via 比對/對照 synonym');

// Search quality: Recommendation & picks
assert(api.filterEntries(entries, Array.from(api.tokenize('recommendation')), {}).some(x => x.id === 'UC-326'), 'recommendation matches UC-326 via 推薦/精選 synonym');

// Search quality: Browser & web synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('browser')), {}).some(x => x.id === 'UC-015'), 'browser matches UC-015 via 瀏覽器/網頁 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('browsing')), {}).some(x => x.id === 'UC-015'), 'browsing matches UC-015 via 瀏覽器/網頁 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('webpage')), {}).some(x => x.id === 'UC-015'), 'webpage matches UC-015 via 網頁 synonym');

// Search quality: Accounts & account synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('account')), {}).some(x => x.id === 'UC-046'), 'account matches UC-046 via 帳號/帳戶 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('accounts')), {}).some(x => x.id === 'UC-046'), 'accounts matches UC-046 via 帳號/帳戶 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('帳戶')), {}).some(x => x.id === 'UC-046'), '帳戶 matches UC-046 via 帳號 synonym');

// Search quality: Voice transcription, listen, whisper synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('transcription')), {}).some(x => x.id === 'UC-191'), 'transcription matches UC-191 via 逐字稿/轉錄 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('transcribe')), {}).some(x => x.id === 'UC-191'), 'transcribe matches UC-191 via 逐字稿/轉錄 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('whisper')), {}).some(x => x.id === 'UC-191'), 'whisper matches UC-191 via 逐字稿/轉錄 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('聽打')), {}).some(x => x.id === 'UC-191'), '聽打 matches UC-191 via 逐字稿/轉錄 synonym');

// Search quality: General report & reports synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('reports')), {}).some(x => x.id === 'UC-001'), 'reports matches UC-001 via 報告/報表 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('研報')), {}).some(x => x.id === 'UC-001'), '研報 matches UC-001 via 報告/報表 synonym');

// Search quality: Password & passwords synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('password')), {}).some(x => x.id === 'UC-080'), 'password matches UC-080 via 密碼/憑證 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('passwords')), {}).some(x => x.id === 'UC-080'), 'passwords matches UC-080 via 密碼/憑證 synonym');

// Search quality: Extract, extraction, 萃取 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('extract')), {}).some(x => x.id === 'UC-098'), 'extract matches UC-098 via 擷取/提取 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('extraction')), {}).some(x => x.id === 'UC-098'), 'extraction matches UC-098 via 擷取/提取 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('萃取')), {}).some(x => x.id === 'UC-098'), '萃取 matches UC-098 via 擷取/提取 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('提煉')), {}).some(x => x.id === 'UC-098'), '提煉 matches UC-098 via 擷取/提取 synonym');

// Search quality: Flowchart, diagram, 草圖 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('flowchart')), {}).some(x => x.id === 'UC-179'), 'flowchart matches UC-179 via 流程圖 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('diagram')), {}).some(x => x.id === 'UC-179'), 'diagram matches UC-179 via 流程圖 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('mindmap')), {}).some(x => x.id === 'UC-179'), 'mindmap matches UC-179 via 流程圖 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('心智圖')), {}).some(x => x.id === 'UC-179'), '心智圖 matches UC-179 via 流程圖 synonym');

// Search quality: Evaluation, eval, benchmark synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('evaluation')), {}).some(x => x.id === 'UC-270'), 'evaluation matches UC-270 via 評估/eval synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('benchmark')), {}).some(x => x.id === 'UC-165'), 'benchmark matches UC-165 via 評估/基準測試 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('benchmarks')), {}).some(x => x.id === 'UC-165'), 'benchmarks matches UC-165 via 評估/基準測試 synonym');

// Search quality: Dispatch, dispatcher, 分流 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('dispatch')), {}).some(x => x.id === 'UC-061'), 'dispatch matches UC-061 via 派工/分流 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('dispatcher')), {}).some(x => x.id === 'UC-061'), 'dispatcher matches UC-061 via 派工/分流 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('分流')), {}).some(x => x.id === 'UC-316'), '分流 matches UC-316 via 派工 synonym');

// Search quality: Repo, repository synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('repository')), {}).some(x => x.id === 'UC-005'), 'repository matches UC-005 via repo synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('repositories')), {}).some(x => x.id === 'UC-005'), 'repositories matches UC-005 via repo synonym');

// Search quality: Parse, parsing, decode, decoder synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('parse')), {}).some(x => x.id === 'UC-020'), 'parse matches UC-020 via 解析 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('parsing')), {}).some(x => x.id === 'UC-020'), 'parsing matches UC-020 via 解析 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('decode')), {}).some(x => x.id === 'UC-334'), 'decode matches UC-334 via 解碼 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('decoder')), {}).some(x => x.id === 'UC-334'), 'decoder matches UC-334 via 解碼 synonym');

// Search quality: Vulnerability, cybersecurity synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('vulnerability')), {}).some(x => x.id === 'UC-065'), 'vulnerability matches UC-065 via 漏洞/資安 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('vulnerabilities')), {}).some(x => x.id === 'UC-065'), 'vulnerabilities matches UC-065 via 漏洞/資安 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('cybersecurity')), {}).some(x => x.id === 'UC-065'), 'cybersecurity matches UC-065 via 資安 synonym');

// Search quality: Privilege, privileges synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('privilege')), {}).some(x => x.id === 'UC-208'), 'privilege matches UC-208 via 權限 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('privileges')), {}).some(x => x.id === 'UC-208'), 'privileges matches UC-208 via 權限 synonym');

// Search quality: Sandbox synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('sandbox')), {}).some(x => x.id === 'UC-317'), 'sandbox matches UC-317 via 沙盒 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('sandboxes')), {}).some(x => x.id === 'UC-317'), 'sandboxes matches UC-317 via 沙盒 synonym');

// Search quality: Structured synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('structured')), {}).some(x => x.id === 'UC-215'), 'structured matches UC-215 via 結構化 synonym');

// Search quality: Automation synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('automation')), {}).some(x => x.id === 'UC-005'), 'automation matches UC-005 via 自動化/workflow synonym');

// Search quality: Pull request query normalization
assert(api.filterEntries(entries, Array.from(api.tokenize('pull request')), {}).some(x => x.id === 'UC-005'), 'pull request matches UC-005 via pr normalization');
assert(api.filterEntries(entries, Array.from(api.tokenize('pull requests')), {}).some(x => x.id === 'UC-005'), 'pull requests matches UC-005 via pr normalization');

// Search quality: Container, docker, VM synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('container')), {}).some(x => x.id === 'UC-005'), 'container matches UC-005 via 容器 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('containers')), {}).some(x => x.id === 'UC-005'), 'containers matches UC-005 via 容器 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('docker')), {}).some(x => x.id === 'UC-005'), 'docker matches UC-005 via 容器 synonym');

// Search quality: Endpoint, endpoints, 端點 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('endpoint')), {}).some(x => x.id === 'UC-336'), 'endpoint matches UC-336 via 端點/api synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('endpoints')), {}).some(x => x.id === 'UC-336'), 'endpoints matches UC-336 via 端點/api synonym');

// Search quality: Quota, throttling, 限流, 限速 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('quota')), {}).some(x => x.id === 'UC-314'), 'quota matches UC-314 via 配額 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('quotas')), {}).some(x => x.id === 'UC-314'), 'quotas matches UC-314 via 配額 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('throttling')), {}).some(x => x.id === 'UC-314'), 'throttling matches UC-314 via 限流 synonym');

// Search quality: Config, configuration, settings, 配置 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('config')), {}).some(x => x.id === 'UC-183'), 'config matches UC-183 via 配置/設定 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('configuration')), {}).some(x => x.id === 'UC-183'), 'configuration matches UC-183 via 配置/設定 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('settings')), {}).some(x => x.id === 'UC-183'), 'settings matches UC-183 via 配置/設定 synonym');

// Search quality: Audit, 審計, 稽核 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('audit')), {}).some(x => x.id === 'UC-066'), 'audit matches UC-066 via 稽核/審核 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('審計')), {}).some(x => x.id === 'UC-066'), '審計 matches UC-066 via 稽核/audit synonym');

// Search quality: Metrics, metric, kpi, 指標 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('metrics')), {}).some(x => x.id === 'UC-322'), 'metrics matches UC-322 via 指標 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('kpi')), {}).some(x => x.id === 'UC-322'), 'kpi matches UC-322 via 指標 synonym');

// Search quality: Vector, vectors, embedding, embeddings, 向量 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('vector')), {}).some(x => x.id === 'UC-297'), 'vector matches UC-297 via 向量/rag synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('vectors')), {}).some(x => x.id === 'UC-297'), 'vectors matches UC-297 via 向量/rag synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('embedding')), {}).some(x => x.id === 'UC-297'), 'embedding matches UC-297 via 嵌入/rag synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('embeddings')), {}).some(x => x.id === 'UC-297'), 'embeddings matches UC-297 via 嵌入/rag synonym');

// Search quality: Callback, callbacks, 回呼 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('callback')), {}).some(x => x.id === 'UC-074'), 'callback matches UC-074 via webhook/回呼 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('callbacks')), {}).some(x => x.id === 'UC-074'), 'callbacks matches UC-074 via webhook/回呼 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('回呼')), {}).some(x => x.id === 'UC-074'), '回呼 matches UC-074 via webhook synonym');

// Search quality: Gateway, gateways, 網關 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('gateway')), {}).some(x => x.id === 'UC-336'), 'gateway matches UC-336');
assert(api.filterEntries(entries, Array.from(api.tokenize('gateways')), {}).some(x => x.id === 'UC-336'), 'gateways matches UC-336 via gateway synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('網關')), {}).some(x => x.id === 'UC-336'), '網關 matches UC-336 via gateway synonym');

// Search quality: Rollback, 回退 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('回退')), {}).some(x => x.id === 'UC-067'), '回退 matches UC-067 via rollback/還原 synonym');

// Search quality: Recognition, 識別 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('recognition')), {}).some(x => x.id === 'UC-178'), 'recognition matches UC-178 via 辨識/識別 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('識別')), {}).some(x => x.id === 'UC-178'), '識別 matches UC-178 via 辨識 synonym');

// Search quality: Token, 權杖 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('權杖')), {}).some(x => x.id === 'UC-066'), '權杖 matches UC-066 via token synonym');

// Search quality: Timeout, timeouts, 逾時, 超時 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('timeout')), {}).some(x => x.id === 'UC-336'), 'timeout matches UC-336 via 逾時/超時 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('timeouts')), {}).some(x => x.id === 'UC-336'), 'timeouts matches UC-336 via 逾時/超時 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('超時')), {}).some(x => x.id === 'UC-313'), '超時 matches UC-313 via 逾時 synonym');

// Search quality: Queue, queues, 佇列, 隊列, 排隊, mq synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('queue')), {}).some(x => x.id === 'UC-042'), 'queue matches UC-042 via 佇列/隊列 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('queues')), {}).some(x => x.id === 'UC-042'), 'queues matches UC-042 via 佇列/隊列 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('隊列')), {}).some(x => x.id === 'UC-042'), '隊列 matches UC-042 via 佇列 synonym');

// Search quality: Dependency, dependencies, 依賴 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('dependency')), {}).some(x => x.id === 'UC-067'), 'dependency matches UC-067 via 依賴 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('dependencies')), {}).some(x => x.id === 'UC-067'), 'dependencies matches UC-067 via 依賴 synonym');

// Search quality: Latency, latencies, lag, 延遲 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('latency')), {}).some(x => x.id === 'UC-239'), 'latency matches UC-239 via 延遲 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('latencies')), {}).some(x => x.id === 'UC-239'), 'latencies matches UC-239 via 延遲 synonym');

// Search quality: Branch, branches, 分支 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('branch')), {}).some(x => x.id === 'UC-005'), 'branch matches UC-005 via 分支/PR synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('branches')), {}).some(x => x.id === 'UC-005'), 'branches matches UC-005 via 分支/PR synonym');

// Search quality: Commits, commit, 提交 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('commits')), {}).some(x => x.id === 'UC-005'), 'commits matches UC-005 via commit/提交 synonym');

// Search quality: Concurrency, concurrent, parallel, 並行, 並發 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('concurrency')), {}).some(x => x.id === 'UC-005'), 'concurrency matches UC-005 via 並行/並發 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('concurrent')), {}).some(x => x.id === 'UC-005'), 'concurrent matches UC-005 via 並行/並發 synonym');

// Search quality: Stream, streaming, 串流, 流式 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('streaming')), {}).some(x => x.id === 'UC-217'), 'streaming matches UC-217 via 串流 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('流式')), {}).some(x => x.id === 'UC-217'), '流式 matches UC-217 via 串流 synonym');

// Search quality: Terminal, console, 終端, 命令列, 命令行 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('terminal')), {}).some(x => x.id === 'UC-061'), 'terminal matches UC-061 via 命令列/cli synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('命令行')), {}).some(x => x.id === 'UC-061'), '命令行 matches UC-061 via 命令列/cli synonym');

// Search quality: Migration, migrate, 遷移, 移轉 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('migration')), {}).some(x => x.id === 'UC-069'), 'migration matches UC-069 via 遷移/移轉 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('migrate')), {}).some(x => x.id === 'UC-069'), 'migrate matches UC-069 via 遷移/移轉 synonym');

// Search quality: Mock, mocking, stub, stubs, 模擬, 仿真 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('mocking')), {}).some(x => x.id === 'UC-003'), 'mocking matches UC-003 via 模擬 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('stub')), {}).some(x => x.id === 'UC-003'), 'stub matches UC-003 via 模擬 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('仿真')), {}).some(x => x.id === 'UC-003'), '仿真 matches UC-003 via 模擬 synonym');

// Search quality: Authentication, auth, oauth, sso, 認證, 身分驗證, 身份驗證 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('身分驗證')), {}).some(x => x.id === 'UC-013'), '身分驗證 matches UC-013 via 認證/auth synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('身份驗證')), {}).some(x => x.id === 'UC-013'), '身份驗證 matches UC-013 via 認證/auth synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('authentication')), {}).some(x => x.id === 'UC-013'), 'authentication matches UC-013 via 認證 synonym');

// Search quality: 差異, 對比 in diff synonym group
assert(api.filterEntries(entries, Array.from(api.tokenize('差異')), {}).some(x => x.id === 'UC-005'), '差異 matches UC-005 via diff/比對 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('對比')), {}).some(x => x.id === 'UC-005'), '對比 matches UC-005 via diff/比對 synonym');

// Search quality: Plural symmetry: agents, retries, alerts, prompts
assert(api.filterEntries(entries, Array.from(api.tokenize('agents')), {}).length >= 100, 'agents matches 100+ agent cases via plural synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('retries')), {}).some(x => x.id === 'UC-001'), 'retries matches UC-001 via retry/重試 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('alerts')), {}).some(x => x.id === 'UC-015'), 'alerts matches UC-015 via alert/提醒 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('prompts')), {}).some(x => x.id === 'UC-001'), 'prompts matches UC-001 via prompt/提示詞 synonym');

// Search quality: Snapshot, snapshots, 快照 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('snapshot')), {}).some(x => x.id === 'UC-067'), 'snapshot matches UC-067 via 快照 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('snapshots')), {}).some(x => x.id === 'UC-067'), 'snapshots matches UC-067 via 快照 synonym');

// Search quality: Batch, batches, 批次, 批處理 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('batch')), {}).some(x => x.id === 'UC-020'), 'batch matches UC-020 via 批次 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('batches')), {}).some(x => x.id === 'UC-020'), 'batches matches UC-020 via 批次 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('批處理')), {}).some(x => x.id === 'UC-020'), '批處理 matches UC-020 via 批次 synonym');

// Search quality: Tracing, trace, tracking, 追蹤 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('tracing')), {}).some(x => x.id === 'UC-015'), 'tracing matches UC-015 via 追蹤 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('track')), {}).some(x => x.id === 'UC-015'), 'track matches UC-015 via 追蹤 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('tracking')), {}).some(x => x.id === 'UC-015'), 'tracking matches UC-015 via 追蹤 synonym');

// Search quality: 去識別, 脫敏, 遮罩, masking, redaction, anonymization, pii synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('masking')), {}).some(x => x.id === 'UC-004'), 'masking matches UC-004 via 去識別/遮罩 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('redaction')), {}).some(x => x.id === 'UC-004'), 'redaction matches UC-004 via 去識別/遮罩 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('anonymization')), {}).some(x => x.id === 'UC-004'), 'anonymization matches UC-004 via 去識別 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('脫敏')), {}).some(x => x.id === 'UC-004'), '脫敏 matches UC-004 via 去識別 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('遮罩')), {}).some(x => x.id === 'UC-011'), '遮罩 matches UC-011 via 去識別 synonym');

// Search quality: 健康檢查, health check, healthcheck, liveness, readiness synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('health check')), {}).some(x => x.id === 'UC-041'), 'health check matches UC-041 via 健康檢查 multi-word normalization');
assert(api.filterEntries(entries, Array.from(api.tokenize('healthcheck')), {}).some(x => x.id === 'UC-041'), 'healthcheck matches UC-041 via 健康檢查 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('liveness')), {}).some(x => x.id === 'UC-041'), 'liveness matches UC-041 via 健康檢查 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('readiness')), {}).some(x => x.id === 'UC-041'), 'readiness matches UC-041 via 健康檢查 synonym');

// Search quality: 編排, orchestration, orchestrate synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('orchestration')), {}).some(x => x.id === 'UC-061'), 'orchestration matches UC-061 via 編排 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('orchestrate')), {}).some(x => x.id === 'UC-061'), 'orchestrate matches UC-061 via 編排 synonym');

// Search quality: 協調, coordination, coordinate synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('coordination')), {}).some(x => x.id === 'UC-005'), 'coordination matches UC-005 via 協調 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('coordinate')), {}).some(x => x.id === 'UC-005'), 'coordinate matches UC-005 via 協調 synonym');

// Search quality: 降級, fallback, degradation synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('fallback')), {}).some(x => x.id === 'UC-028'), 'fallback matches UC-028 via 降級 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('degradation')), {}).some(x => x.id === 'UC-028'), 'degradation matches UC-028 via 降級 synonym');

// Search quality: 狀態機, state machine, 狀態轉換, 狀態轉移 synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('state machine')), {}).some(x => x.id === 'UC-236'), 'state machine matches UC-236 via 狀態機 multi-word tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('statemachine')), {}).some(x => x.id === 'UC-236'), 'statemachine matches UC-236 via 狀態機 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('狀態轉換')), {}).some(x => x.id === 'UC-236'), '狀態轉換 matches UC-236 via 狀態機 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('狀態轉移')), {}).some(x => x.id === 'UC-236'), '狀態轉移 matches UC-236 via 狀態機 synonym');

// Search quality: 檢查點, checkpoint, checkpoints synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('checkpoint')), {}).some(x => x.id === 'UC-149'), 'checkpoint matches UC-149 via 檢查點 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('checkpoints')), {}).some(x => x.id === 'UC-149'), 'checkpoints matches UC-149 via 檢查點 synonym');

// Search quality: 儲存, 存儲, storage synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('storage')), {}).some(x => x.id === 'UC-067'), 'storage matches UC-067 via 儲存 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('存儲')), {}).some(x => x.id === 'UC-067'), '存儲 matches UC-067 via 儲存 synonym');

// Search quality: 幻覺, hallucination, hallucinations synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('hallucination')), {}).some(x => x.id === 'UC-035'), 'hallucination matches UC-035 via 幻覺 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('hallucinations')), {}).some(x => x.id === 'UC-035'), 'hallucinations matches UC-035 via 幻覺 synonym');

// Search quality: 協定, protocol, protocols synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('協定')), {}).some(x => x.id === 'UC-074'), '協定 matches UC-074 via protocol synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('protocols')), {}).some(x => x.id === 'UC-074'), 'protocols matches UC-074 via protocol synonym');

// Search quality: 模組, module, modules synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('module')), {}).some(x => x.id === 'UC-039'), 'module matches UC-039 via 模組 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('modules')), {}).some(x => x.id === 'UC-039'), 'modules matches UC-039 via 模組 synonym');

// Search quality: 語意, 語義, semantic, semantics synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('semantic')), {}).some(x => x.id === 'UC-081'), 'semantic matches UC-081 via 語意/語義 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('semantics')), {}).some(x => x.id === 'UC-081'), 'semantics matches UC-081 via 語意/語義 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('語義')), {}).some(x => x.id === 'UC-081'), '語義 matches UC-081 via 語意 synonym');

// Search quality: 限流, rate limit, ratelimit synonyms
assert(api.filterEntries(entries, Array.from(api.tokenize('rate limit')), {}).some(x => x.id === 'UC-069'), 'rate limit matches UC-069 via 限流 multi-word normalization');
assert(api.filterEntries(entries, Array.from(api.tokenize('ratelimit')), {}).some(x => x.id === 'UC-069'), 'ratelimit matches UC-069 via 限流 synonym');

// Search quality: 知識庫, knowledge base, knowledgebase
assert(api.filterEntries(entries, Array.from(api.tokenize('knowledge base')), {}).some(x => x.id === 'UC-060'), 'knowledge base matches UC-060 via 知識庫 multi-word normalization');
assert(api.filterEntries(entries, Array.from(api.tokenize('knowledgebase')), {}).some(x => x.id === 'UC-060'), 'knowledgebase matches UC-060 via 知識庫 synonym');

// Search quality: 工單, ticket, tickets, work order, workorder
assert(api.filterEntries(entries, Array.from(api.tokenize('tickets')), {}).some(x => x.id === 'UC-014'), 'tickets matches UC-014 via 工單 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('work order')), {}).some(x => x.id === 'UC-014'), 'work order matches UC-014 via 工單 multi-word normalization');
assert(api.filterEntries(entries, Array.from(api.tokenize('workorder')), {}).some(x => x.id === 'UC-014'), 'workorder matches UC-014 via 工單 synonym');

// Search quality: 審批, 簽核, approval, approvals, approve
assert(api.filterEntries(entries, Array.from(api.tokenize('approvals')), {}).some(x => x.id === 'UC-014'), 'approvals matches UC-014 via 審批 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('approve')), {}).some(x => x.id === 'UC-014'), 'approve matches UC-014 via 審批 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('簽核')), {}).some(x => x.id === 'UC-014'), '簽核 matches UC-014 via 審批 synonym');

// Search quality: 日曆, 行事曆, calendar, calendars
assert(api.filterEntries(entries, Array.from(api.tokenize('calendars')), {}).some(x => x.id === 'UC-043'), 'calendars matches UC-043 via 日曆 synonym');

// Search quality: 對帳, 核帳, reconciliation, reconcile, reconciling
assert(api.filterEntries(entries, Array.from(api.tokenize('reconcile')), {}).some(x => x.id === 'UC-037'), 'reconcile matches UC-037 via 對帳 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('reconciling')), {}).some(x => x.id === 'UC-037'), 'reconciling matches UC-037 via 對帳 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('核帳')), {}).some(x => x.id === 'UC-037'), '核帳 matches UC-037 via 對帳 synonym');

// Search quality: 回滾, rollback, rollbacks, revert, reverting
assert(api.filterEntries(entries, Array.from(api.tokenize('rollbacks')), {}).some(x => x.id === 'UC-067'), 'rollbacks matches UC-067 via 回滾 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('revert')), {}).some(x => x.id === 'UC-067'), 'revert matches UC-067 via 回滾 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('reverting')), {}).some(x => x.id === 'UC-067'), 'reverting matches UC-067 via 回滾 synonym');

// Search quality: 看板, 儀表板, dashboard, dashboards
assert(api.filterEntries(entries, Array.from(api.tokenize('dashboards')), {}).some(x => x.id === 'UC-031'), 'dashboards matches UC-031 via 儀表板 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('dashboard')), {}).some(x => x.id === 'UC-041'), 'dashboard matches UC-041 via 看板 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('看板')), {}).some(x => x.id === 'UC-031'), '看板 matches UC-031 via 儀表板 synonym');

// Search quality: schedule, schedules, scheduling
assert(api.filterEntries(entries, Array.from(api.tokenize('schedules')), {}).some(x => x.id === 'UC-005'), 'schedules matches UC-005 via 排程 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('scheduling')), {}).some(x => x.id === 'UC-005'), 'scheduling matches UC-005 via 排程 synonym');

// Search quality: deploy, deployment, deployments
assert(api.filterEntries(entries, Array.from(api.tokenize('deployments')), {}).some(x => x.id === 'UC-005'), 'deployments matches UC-005 via 部署 synonym');

// Search quality: monitor, monitoring
assert(api.filterEntries(entries, Array.from(api.tokenize('monitoring')), {}).some(x => x.id === 'UC-005'), 'monitoring matches UC-005 via 監控 synonym');

// Search quality: alert, alerting, notify
assert(api.filterEntries(entries, Array.from(api.tokenize('alerting')), {}).some(x => x.id === 'UC-041'), 'alerting matches UC-041 via 告警 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('notify')), {}).some(x => x.id === 'UC-041'), 'notify matches UC-041 via 通知 synonym');

// Search quality: retry, retrying
assert(api.filterEntries(entries, Array.from(api.tokenize('retrying')), {}).some(x => x.id === 'UC-005'), 'retrying matches UC-005 via 重試 synonym');

// Search quality: endpoint, api, apis
assert(api.filterEntries(entries, Array.from(api.tokenize('apis')), {}).some(x => x.id === 'UC-005'), 'apis matches UC-005 via 端點 synonym');

// Search quality: memory, memories
assert(api.filterEntries(entries, Array.from(api.tokenize('memories')), {}).some(x => x.id === 'UC-071'), 'memories matches UC-071 via 記憶 synonym');

// Search quality: context, contexts
assert(api.filterEntries(entries, Array.from(api.tokenize('contexts')), {}).some(x => x.id === 'UC-041'), 'contexts matches UC-041 via 上下文 synonym');

// Search quality: 權杖, token, tokens, 令牌
assert(api.filterEntries(entries, Array.from(api.tokenize('令牌')), {}).some(x => x.id === 'UC-066'), '令牌 matches UC-066 via 權杖 synonym');

// Search quality: 微調, fine-tuning, finetune, finetuning
assert(api.filterEntries(entries, Array.from(api.tokenize('fine-tuning')), {}).some(x => x.id === 'UC-122'), 'fine-tuning matches UC-122 via 微調 multi-word normalization');
assert(api.filterEntries(entries, Array.from(api.tokenize('finetune')), {}).some(x => x.id === 'UC-122'), 'finetune matches UC-122 via 微調 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('finetuning')), {}).some(x => x.id === 'UC-122'), 'finetuning matches UC-122 via 微調 synonym');

// Search quality: 里程碑, milestone, milestones
assert(api.filterEntries(entries, Array.from(api.tokenize('milestone')), {}).some(x => x.id === 'UC-012'), 'milestone matches UC-012 via 里程碑 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('milestones')), {}).some(x => x.id === 'UC-012'), 'milestones matches UC-012 via 里程碑 synonym');

// Search quality: 回顧, 復盤, retrospective, postmortem, post-mortem
assert(api.filterEntries(entries, Array.from(api.tokenize('post-mortem')), {}).some(x => x.id === 'UC-067'), 'post-mortem matches UC-067 via 回顧/復盤 multi-word normalization');
assert(api.filterEntries(entries, Array.from(api.tokenize('postmortem')), {}).some(x => x.id === 'UC-067'), 'postmortem matches UC-067 via 回顧/復盤 synonym');

// Search quality: 拓客, 外呼, 外聯, outreach, cold outreach
assert(api.filterEntries(entries, Array.from(api.tokenize('cold outreach')), {}).some(x => x.id === 'UC-333'), 'cold outreach matches UC-333 via 外聯 multi-word normalization');
assert(api.filterEntries(entries, Array.from(api.tokenize('outreach')), {}).some(x => x.id === 'UC-333'), 'outreach matches UC-333 via 外聯 synonym');

// Search quality: 離線, offline, 斷網
assert(api.filterEntries(entries, Array.from(api.tokenize('offline')), {}).some(x => x.id === 'UC-145'), 'offline matches UC-145 via 離線 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('offline')), {}).some(x => x.id === 'UC-165'), 'offline matches UC-165 via 離線 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('斷網')), {}).some(x => x.id === 'UC-145'), '斷網 matches UC-145 via 離線 synonym');

// Search quality: 基準, 基線, baseline, baselines
assert(api.filterEntries(entries, Array.from(api.tokenize('baseline')), {}).some(x => x.id === 'UC-173'), 'baseline matches UC-173 via 基線 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('baselines')), {}).some(x => x.id === 'UC-228'), 'baselines matches UC-228 via 基線 synonym');

// Search quality: 外洩, 洩漏, 洩露, leak, leakage
assert(api.filterEntries(entries, Array.from(api.tokenize('leak')), {}).some(x => x.id === 'UC-076'), 'leak matches UC-076 via 外洩 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('leakage')), {}).some(x => x.id === 'UC-235'), 'leakage matches UC-235 via 洩漏 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('洩露')), {}).some(x => x.id === 'UC-076'), '洩露 matches UC-076 via 外洩 synonym');

// Search quality: 架構, architecture, architectures
assert(api.filterEntries(entries, Array.from(api.tokenize('architecture')), {}).some(x => x.id === 'UC-336'), 'architecture matches UC-336 via 架構 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('architectures')), {}).some(x => x.id === 'UC-275'), 'architectures matches UC-275 via 架構 synonym');

// Search quality: 回饋, 反饋, feedback
assert(api.filterEntries(entries, Array.from(api.tokenize('feedback')), {}).some(x => x.id === 'UC-323'), 'feedback matches UC-323 via 回饋 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('反饋')), {}).some(x => x.id === 'UC-323'), '反饋 matches UC-323 via 回饋 synonym');

// Search quality: 非同步, 異步, async, asynchronous
assert(api.filterEntries(entries, Array.from(api.tokenize('async')), {}).some(x => x.id === 'UC-074'), 'async matches UC-074 via 非同步 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('asynchronous')), {}).some(x => x.id === 'UC-239'), 'asynchronous matches UC-239 via 異步 synonym');

// Search quality: 端到端, e2e, end-to-end, end to end
assert(api.filterEntries(entries, Array.from(api.tokenize('e2e')), {}).some(x => x.id === 'UC-014'), 'e2e matches UC-014 via 端到端 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('end-to-end')), {}).some(x => x.id === 'UC-169'), 'end-to-end matches UC-169 via 端到端 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('end to end')), {}).some(x => x.id === 'UC-268'), 'end to end matches UC-268 via 端到端 multi-word normalization');

// Search quality: 斷言, assertion, assertions
assert(api.filterEntries(entries, Array.from(api.tokenize('assertion')), {}).some(x => x.id === 'UC-222'), 'assertion matches UC-222 via 斷言 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('assertions')), {}).some(x => x.id === 'UC-102'), 'assertions matches UC-102 via 斷言 synonym');

// Search quality: 標註, annotation, annotations, 標籤化, labeling
assert(api.filterEntries(entries, Array.from(api.tokenize('annotation')), {}).some(x => x.id === 'UC-091'), 'annotation matches UC-091 via 標註 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('annotations')), {}).some(x => x.id === 'UC-302'), 'annotations matches UC-302 via 標註 synonym');

// Search quality: 輪詢, polling
assert(api.filterEntries(entries, Array.from(api.tokenize('polling')), {}).some(x => x.id === 'UC-065'), 'polling matches UC-065 via 輪詢 synonym');

// Search quality: 增量, incremental
assert(api.filterEntries(entries, Array.from(api.tokenize('incremental')), {}).some(x => x.id === 'UC-228'), 'incremental matches UC-228 via 增量 synonym');

// Search quality: 助手, assistant, copilot
assert(api.filterEntries(entries, Array.from(api.tokenize('assistant')), {}).some(x => x.id === 'UC-061'), 'assistant matches UC-061 via 助手 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('copilot')), {}).some(x => x.id === 'UC-061'), 'copilot matches UC-061 via 助手 synonym');

// Search quality: 生命週期, lifecycle
assert(api.filterEntries(entries, Array.from(api.tokenize('lifecycle')), {}).some(x => x.id === 'UC-061'), 'lifecycle matches UC-061 via 生命週期 synonym');

// Search quality: 冪等, 冪等性, idempotent, idempotency
assert(api.filterEntries(entries, Array.from(api.tokenize('冪等性')), {}).some(x => x.id === 'UC-158'), '冪等性 matches UC-158 via 冪等 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('idempotency')), {}).some(x => x.id === 'UC-320'), 'idempotency matches UC-320 via 冪等 synonym');

// Search quality: 環境變數, 環境變量, env
assert(api.filterEntries(entries, Array.from(api.tokenize('環境變量')), {}).some(x => x.id === 'UC-061'), '環境變量 matches UC-061 via 環境變數 synonym');

// Search quality: plurals symmetry
assert(api.filterEntries(entries, Array.from(api.tokenize('llms')), {}).some(x => x.id === 'UC-161'), 'llms matches UC-161 via llm synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('diffs')), {}).some(x => x.id === 'UC-005'), 'diffs matches UC-005 via diff synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('browsers')), {}).some(x => x.id === 'UC-005'), 'browsers matches UC-005 via browser synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('webpages')), {}).some(x => x.id === 'UC-015'), 'webpages matches UC-015 via webpage synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('diagrams')), {}).some(x => x.id === 'UC-275'), 'diagrams matches UC-275 via diagram synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('flowcharts')), {}).some(x => x.id === 'UC-106'), 'flowcharts matches UC-106 via flowchart synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('mindmaps')), {}).some(x => x.id === 'UC-106'), 'mindmaps matches UC-106 via mindmap synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('evaluations')), {}).some(x => x.id === 'UC-003'), 'evaluations matches UC-003 via evaluation synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('parsers')), {}).some(x => x.id === 'UC-020'), 'parsers matches UC-020 via parser synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('decoders')), {}).some(x => x.id === 'UC-125'), 'decoders matches UC-125 via decoder synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('configs')), {}).some(x => x.id === 'UC-005'), 'configs matches UC-005 via config synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('configurations')), {}).some(x => x.id === 'UC-005'), 'configurations matches UC-005 via configuration synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('kpis')), {}).some(x => x.id === 'UC-066'), 'kpis matches UC-066 via kpi synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('terminals')), {}).some(x => x.id === 'UC-005'), 'terminals matches UC-005 via terminal synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('consoles')), {}).some(x => x.id === 'UC-005'), 'consoles matches UC-005 via console synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('migrations')), {}).some(x => x.id === 'UC-069'), 'migrations matches UC-069 via migration synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('mocks')), {}).some(x => x.id === 'UC-003'), 'mocks matches UC-003 via mock synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('healthchecks')), {}).some(x => x.id === 'UC-041'), 'healthchecks matches UC-041 via healthcheck synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('statemachines')), {}).some(x => x.id === 'UC-236'), 'statemachines matches UC-236 via statemachine synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('postmortems')), {}).some(x => x.id === 'UC-067'), 'postmortems matches UC-067 via postmortem synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('retrospectives')), {}).some(x => x.id === 'UC-067'), 'retrospectives matches UC-067 via retrospective synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('vms')), {}).some(x => x.id === 'UC-005'), 'vms matches UC-005 via vm synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('backups')), {}).some(x => x.id === 'UC-067'), 'backups matches UC-067 via backup synonym');

// Search quality: 封存, 歸檔, archive, archives, archived, archiving
assert(api.filterEntries(entries, Array.from(api.tokenize('archive')), {}).some(x => x.id === 'UC-341'), 'archive matches UC-341 via 封存 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('archives')), {}).some(x => x.id === 'UC-341'), 'archives matches UC-341 via 封存 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('archived')), {}).some(x => x.id === 'UC-341'), 'archived matches UC-341 via 封存 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('歸檔')), {}).some(x => x.id === 'UC-341'), '歸檔 matches UC-341 via 封存 synonym');

// Search quality: 失敗, failure, failures, fail, fails
assert(api.filterEntries(entries, Array.from(api.tokenize('failure')), {}).some(x => x.id === 'UC-339'), 'failure matches UC-339 via 失敗 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('failures')), {}).some(x => x.id === 'UC-276'), 'failures matches UC-276 via 失敗 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('fail')), {}).some(x => x.id === 'UC-339'), 'fail matches UC-339 via 失敗 synonym');

// Search quality: fault, faults, bugs
assert(api.filterEntries(entries, Array.from(api.tokenize('fault')), {}).some(x => x.id === 'UC-005'), 'fault matches UC-005 via 故障 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('faults')), {}).some(x => x.id === 'UC-005'), 'faults matches UC-005 via 故障 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('bugs')), {}).some(x => x.id === 'UC-005'), 'bugs matches UC-005 via bug synonym');

// Search quality: 回應, 響應, response, responses
assert(api.filterEntries(entries, Array.from(api.tokenize('response')), {}).some(x => x.id === 'UC-340'), 'response matches UC-340 via 回應 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('responses')), {}).some(x => x.id === 'UC-340'), 'responses matches UC-340 via 回應 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('響應')), {}).some(x => x.id === 'UC-340'), '響應 matches UC-340 via 回應 synonym');

// Search quality: 請求, request, requests
assert(api.filterEntries(entries, Array.from(api.tokenize('request')), {}).some(x => x.id === 'UC-339'), 'request matches UC-339 via 請求 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('requests')), {}).some(x => x.id === 'UC-021'), 'requests matches UC-021 via 請求 synonym');

// Search quality: 會話, 交談, session, sessions, conversation
assert(api.filterEntries(entries, Array.from(api.tokenize('session')), {}).some(x => x.id === 'UC-261'), 'session matches UC-261 via 會話 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('sessions')), {}).some(x => x.id === 'UC-261'), 'sessions matches UC-261 via 會話 synonym');

// Search quality: 機器人, bot, bots
assert(api.filterEntries(entries, Array.from(api.tokenize('機器人')), {}).some(x => x.id === 'UC-003'), '機器人 matches UC-003 via bot synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('bots')), {}).some(x => x.id === 'UC-003'), 'bots matches UC-003 via bot synonym');

// Search quality: 路由, routing, route, routes
assert(api.filterEntries(entries, Array.from(api.tokenize('routing')), {}).some(x => x.id === 'UC-250'), 'routing matches UC-250 via 路由 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('route')), {}).some(x => x.id === 'UC-250'), 'route matches UC-250 via 路由 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('routes')), {}).some(x => x.id === 'UC-250'), 'routes matches UC-250 via 路由 synonym');

// Search quality: 產物, artifact, artifacts
assert(api.filterEntries(entries, Array.from(api.tokenize('artifact')), {}).some(x => x.id === 'UC-214'), 'artifact matches UC-214 via 產物 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('artifacts')), {}).some(x => x.id === 'UC-214'), 'artifacts matches UC-214 via 產物 synonym');

// Search quality: 參數, parameter, parameters
assert(api.filterEntries(entries, Array.from(api.tokenize('parameter')), {}).some(x => x.id === 'UC-002'), 'parameter matches UC-002 via 參數 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('parameters')), {}).some(x => x.id === 'UC-002'), 'parameters matches UC-002 via 參數 synonym');

// Search quality: 標頭, header, headers
assert(api.filterEntries(entries, Array.from(api.tokenize('header')), {}).some(x => x.id === 'UC-005'), 'header matches UC-005 via 標頭 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('headers')), {}).some(x => x.id === 'UC-005'), 'headers matches UC-005 via 標頭 synonym');

// Search quality: 負載, payload, payloads
assert(api.filterEntries(entries, Array.from(api.tokenize('payload')), {}).some(x => x.id === 'UC-213'), 'payload matches UC-213 via 負載 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('payloads')), {}).some(x => x.id === 'UC-213'), 'payloads matches UC-213 via 負載 synonym');

// Search quality: 管線, 流水線, pipeline, pipelines
assert(api.filterEntries(entries, Array.from(api.tokenize('管線')), {}).some(x => x.id === 'UC-002'), '管線 matches UC-002 via 流水線 synonym');

// Search quality: 出處, 溯源, provenance, 來源
assert(api.filterEntries(entries, Array.from(api.tokenize('provenance')), {}).some(x => x.id === 'UC-339'), 'provenance matches UC-339 via 來源/出處 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('溯源')), {}).some(x => x.id === 'UC-339'), '溯源 matches UC-339 via 來源 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('出處')), {}).some(x => x.id === 'UC-339'), '出處 matches UC-339 via 來源 synonym');

// Search quality: 工作者, worker, workers
assert(api.filterEntries(entries, Array.from(api.tokenize('worker')), {}).some(x => x.id === 'UC-024'), 'worker matches UC-024 via 工作者 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('workers')), {}).some(x => x.id === 'UC-024'), 'workers matches UC-024 via 工作者 synonym');

// Search quality: schema, schemas, 綱要
assert(api.filterEntries(entries, Array.from(api.tokenize('schemas')), {}).some(x => x.id === 'UC-062'), 'schemas matches UC-062 via schema synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('綱要')), {}).some(x => x.id === 'UC-062'), '綱要 matches UC-062 via schema synonym');

// Search quality: cookies plural symmetry
assert(api.filterEntries(entries, Array.from(api.tokenize('cookies')), {}).some(x => x.id === 'UC-005'), 'cookies matches UC-005 via cookie synonym');

// Search quality: multi-word phrases (cross agent, life cycle, heart beat)
assert(api.filterEntries(entries, Array.from(api.tokenize('cross agent')), {}).some(x => x.id === 'UC-339'), 'cross agent matches UC-339 via 跨代理 normalization');
assert(api.filterEntries(entries, Array.from(api.tokenize('cross-agent')), {}).some(x => x.id === 'UC-339'), 'cross-agent matches UC-339 via 跨代理 normalization');
assert(api.filterEntries(entries, Array.from(api.tokenize('life cycle')), {}).some(x => x.id === 'UC-341'), 'life cycle matches UC-341 via lifecycle normalization');
assert(api.filterEntries(entries, Array.from(api.tokenize('heart beat')), {}).some(x => x.id === 'UC-049'), 'heart beat matches UC-049 via heartbeat normalization');

// Search quality: screenshot, screenshots, screen shot, screen shots, 截圖
assert(api.filterEntries(entries, Array.from(api.tokenize('screenshot')), {}).some(x => x.id === 'UC-335'), 'screenshot matches UC-335 via 截圖 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('screenshots')), {}).some(x => x.id === 'UC-335'), 'screenshots matches UC-335 via 截圖 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('screen shot')), {}).some(x => x.id === 'UC-335'), 'screen shot matches UC-335 via tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('screen shots')), {}).some(x => x.id === 'UC-335'), 'screen shots matches UC-335 via tokenization');

// Search quality: routine, routines, 例行任務
assert(api.filterEntries(entries, Array.from(api.tokenize('routine')), {}).some(x => x.id === 'UC-335'), 'routine matches UC-335');
assert(api.filterEntries(entries, Array.from(api.tokenize('routines')), {}).some(x => x.id === 'UC-335'), 'routines matches UC-335');
assert(api.filterEntries(entries, Array.from(api.tokenize('例行任務')), {}).some(x => x.id === 'UC-041'), '例行任務 matches UC-041 via routine synonym');

// Search quality: manual, manually, 手動
assert(api.filterEntries(entries, Array.from(api.tokenize('manual')), {}).some(x => x.id === 'UC-335'), 'manual matches UC-335 via 手動 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('manually')), {}).some(x => x.id === 'UC-335'), 'manually matches UC-335 via 手動 synonym');

// Search quality: stale, 過期, 過時, 失效
assert(api.filterEntries(entries, Array.from(api.tokenize('stale')), {}).some(x => x.id === 'UC-335'), 'stale matches UC-335 via 過時 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('過期')), {}).some(x => x.id === 'UC-339'), '過期 matches UC-339 via stale synonym');

// Search quality: runtime, runtimes, run time, 運行時, 執行期
assert(api.filterEntries(entries, Array.from(api.tokenize('runtime')), {}).some(x => x.id === 'UC-304'), 'runtime matches UC-304 via 執行期 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('runtimes')), {}).some(x => x.id === 'UC-304'), 'runtimes matches UC-304 via 執行期 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('運行時')), {}).some(x => x.id === 'UC-214'), '運行時 matches UC-214 via runtime synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('run time')), {}).some(x => x.id === 'UC-304'), 'run time matches UC-304 via tokenization');

// Search quality: timesheet, timesheets, time sheet, 工時
assert(api.filterEntries(entries, Array.from(api.tokenize('timesheet')), {}).some(x => x.id === 'UC-338'), 'timesheet matches UC-338 via 工時 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('timesheets')), {}).some(x => x.id === 'UC-338'), 'timesheets matches UC-338 via 工時 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('time sheet')), {}).some(x => x.id === 'UC-338'), 'time sheet matches UC-338 via tokenization');

// Search quality: paycheck, paychecks, pay check, 薪資單, 工資
assert(api.filterEntries(entries, Array.from(api.tokenize('paycheck')), {}).some(x => x.id === 'UC-338'), 'paycheck matches UC-338 via 薪資 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('paychecks')), {}).some(x => x.id === 'UC-338'), 'paychecks matches UC-338 via 薪資 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('pay check')), {}).some(x => x.id === 'UC-338'), 'pay check matches UC-338 via tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('薪資單')), {}).some(x => x.id === 'UC-024'), '薪資單 matches UC-024 via 薪資 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('工資')), {}).some(x => x.id === 'UC-338'), '工資 matches UC-338 via 薪資 synonym');

// Search quality: tunnel, tunnels, 隧道, 通道
assert(api.filterEntries(entries, Array.from(api.tokenize('tunnel')), {}).some(x => x.id === 'UC-336'), 'tunnel matches UC-336');
assert(api.filterEntries(entries, Array.from(api.tokenize('tunnels')), {}).some(x => x.id === 'UC-336'), 'tunnels matches UC-336 via tunnel synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('隧道')), {}).some(x => x.id === 'UC-336'), '隧道 matches UC-336 via tunnel synonym');

// Search quality: relay, relays, 中繼, 轉發
assert(api.filterEntries(entries, Array.from(api.tokenize('relay')), {}).some(x => x.id === 'UC-336'), 'relay matches UC-336 via 中繼 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('relays')), {}).some(x => x.id === 'UC-336'), 'relays matches UC-336 via 中繼 synonym');

// Search quality: override, overrides, 覆寫, 覆蓋
assert(api.filterEntries(entries, Array.from(api.tokenize('override')), {}).some(x => x.id === 'UC-335'), 'override matches UC-335 via 覆蓋 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('overrides')), {}).some(x => x.id === 'UC-335'), 'overrides matches UC-335 via 覆蓋 synonym');

// Search quality: portrait, portraits, 肖像, 似顏繪, likeness
assert(api.filterEntries(entries, Array.from(api.tokenize('portrait')), {}).some(x => x.id === 'UC-337'), 'portrait matches UC-337 via 肖像 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('portraits')), {}).some(x => x.id === 'UC-337'), 'portraits matches UC-337 via 肖像 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('似顏繪')), {}).some(x => x.id === 'UC-337'), '似顏繪 matches UC-337 via 肖像 synonym');

// Search quality: radio, radios, 無線電, 軟體無線電, sdr
assert(api.filterEntries(entries, Array.from(api.tokenize('radio')), {}).some(x => x.id === 'UC-334'), 'radio matches UC-334 via 無線電 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('radios')), {}).some(x => x.id === 'UC-334'), 'radios matches UC-334 via 無線電 synonym');

// Search quality: filter, filters, 濾波器
assert(api.filterEntries(entries, Array.from(api.tokenize('filter')), {}).some(x => x.id === 'UC-334'), 'filter matches UC-334 via 濾波器 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('filters')), {}).some(x => x.id === 'UC-334'), 'filters matches UC-334 via 濾波器 synonym');

// Search quality: amplifier, amplifiers, 放大器
assert(api.filterEntries(entries, Array.from(api.tokenize('amplifier')), {}).some(x => x.id === 'UC-334'), 'amplifier matches UC-334 via 放大器 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('amplifiers')), {}).some(x => x.id === 'UC-334'), 'amplifiers matches UC-334 via 放大器 synonym');

// Search quality: antenna, antennas, 天線
assert(api.filterEntries(entries, Array.from(api.tokenize('antenna')), {}).some(x => x.id === 'UC-334'), 'antenna matches UC-334 via 天線 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('antennas')), {}).some(x => x.id === 'UC-334'), 'antennas matches UC-334 via 天線 synonym');

// Search quality: draft, drafts, drafting, 草稿, 初稿
assert(api.filterEntries(entries, Array.from(api.tokenize('draft')), {}).some(x => x.id === 'UC-017'), 'draft matches UC-017 via 草稿 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('drafts')), {}).some(x => x.id === 'UC-017'), 'drafts matches UC-017 via 草稿 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('drafting')), {}).some(x => x.id === 'UC-017'), 'drafting matches UC-017 via 草稿 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('初稿')), {}).some(x => x.id === 'UC-017'), '初稿 matches UC-017 via 草稿 synonym');

// Search quality: handoff, handoffs, hand off, 交接, 交棒
assert(api.filterEntries(entries, Array.from(api.tokenize('handoff')), {}).some(x => x.id === 'UC-001'), 'handoff matches UC-001 via 交接 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('handoffs')), {}).some(x => x.id === 'UC-001'), 'handoffs matches UC-001 via 交接 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('hand off')), {}).some(x => x.id === 'UC-001'), 'hand off matches UC-001 via tokenization and 交接 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('交棒')), {}).some(x => x.id === 'UC-001'), '交棒 matches UC-001 via 交接 synonym');

// Search quality: dry run, dryrun, 試跑, 空跑, 模擬執行
assert(api.filterEntries(entries, Array.from(api.tokenize('dry run')), {}).some(x => x.id === 'UC-049'), 'dry run matches UC-049 via 空跑 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('dryrun')), {}).some(x => x.id === 'UC-049'), 'dryrun matches UC-049 via 空跑 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('dry-run')), {}).some(x => x.id === 'UC-049'), 'dry-run matches UC-049 via 空跑 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('試跑')), {}).some(x => x.id === 'UC-049'), '試跑 matches UC-049 via 空跑 synonym');

// Search quality: guardrail, guardrails, guard rail, 護欄, 安全護欄
assert(api.filterEntries(entries, Array.from(api.tokenize('guardrail')), {}).some(x => x.id === 'UC-316'), 'guardrail matches UC-316 via 護欄 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('guardrails')), {}).some(x => x.id === 'UC-316'), 'guardrails matches UC-316 via 護欄 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('guard rail')), {}).some(x => x.id === 'UC-316'), 'guard rail matches UC-316 via tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('安全護欄')), {}).some(x => x.id === 'UC-316'), '安全護欄 matches UC-316 via 護欄 synonym');

// Search quality: telemetry, 遙測, observability, 可觀測性
assert(api.filterEntries(entries, Array.from(api.tokenize('telemetry')), {}).some(x => x.id === 'UC-141'), 'telemetry matches UC-141 via 遙測 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('observability')), {}).some(x => x.id === 'UC-141'), 'observability matches UC-141 via 遙測 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('可觀測性')), {}).some(x => x.id === 'UC-141'), '可觀測性 matches UC-141 via 遙測 synonym');

// Search quality: hitl, human in the loop, 人工覆核, 人工介入
assert(api.filterEntries(entries, Array.from(api.tokenize('hitl')), {}).some(x => x.id === 'UC-184'), 'hitl matches UC-184 via 人工覆核 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('human in the loop')), {}).some(x => x.id === 'UC-184'), 'human in the loop matches UC-184 via hitl tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('人工介入')), {}).some(x => x.id === 'UC-184'), '人工介入 matches UC-184 via 人工覆核 synonym');

// Search quality: plural symmetry across key keyword groups
assert(api.filterEntries(entries, Array.from(api.tokenize('workflows')), {}).some(x => x.id === 'UC-005'), 'workflows matches UC-005 via workflow synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('crawlers')), {}).some(x => x.id === 'UC-015'), 'crawlers matches UC-015 via crawler synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('scrapers')), {}).some(x => x.id === 'UC-015'), 'scrapers matches UC-015 via scraper synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('emails')), {}).some(x => x.id === 'UC-049'), 'emails matches UC-049 via email synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('mailbox')), {}).some(x => x.id === 'UC-049'), 'mailbox matches UC-049 via email synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('mailboxes')), {}).some(x => x.id === 'UC-049'), 'mailboxes matches UC-049 via email synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('codes')), {}).some(x => x.id === 'UC-273'), 'codes matches UC-273 via code synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('coding')), {}).some(x => x.id === 'UC-273'), 'coding matches UC-273 via code synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('meetings')), {}).some(x => x.id === 'UC-019'), 'meetings matches UC-019 via meeting synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('videos')), {}).some(x => x.id === 'UC-002'), 'videos matches UC-002 via video synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('images')), {}).some(x => x.id === 'UC-016'), 'images matches UC-016 via image synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('photos')), {}).some(x => x.id === 'UC-016'), 'photos matches UC-016 via photo synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('customers')), {}).some(x => x.id === 'UC-003'), 'customers matches UC-003 via customer synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('clients')), {}).some(x => x.id === 'UC-003'), 'clients matches UC-003 via client synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('contracts')), {}).some(x => x.id === 'UC-021'), 'contracts matches UC-021 via contract synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('agreements')), {}).some(x => x.id === 'UC-021'), 'agreements matches UC-021 via agreement synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('devices')), {}).some(x => x.id === 'UC-010'), 'devices matches UC-010 via device synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('databases')), {}).some(x => x.id === 'UC-060'), 'databases matches UC-060 via database synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('workorders')), {}).some(x => x.id === 'UC-155'), 'workorders matches UC-155 via workorder synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('work-order')), {}).some(x => x.id === 'UC-155'), 'work-order matches UC-155 via tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('工單系統')), {}).some(x => x.id === 'UC-155'), '工單系統 matches UC-155 via workorder synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('reconciliations')), {}).some(x => x.id === 'UC-024'), 'reconciliations matches UC-024 via reconcile synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('對賬')), {}).some(x => x.id === 'UC-024'), '對賬 matches UC-024 via 對帳 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('核賬')), {}).some(x => x.id === 'UC-024'), '核賬 matches UC-024 via 核帳 synonym');

// Search quality: mcp, model context protocol
assert(api.filterEntries(entries, Array.from(api.tokenize('model context protocol')), {}).some(x => x.id === 'UC-010'), 'model context protocol matches UC-010 via mcp tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('model context protocols')), {}).some(x => x.id === 'UC-010'), 'model context protocols matches UC-010 via mcp tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('model-context-protocol')), {}).some(x => x.id === 'UC-010'), 'model-context-protocol matches UC-010 via mcp tokenization');

// Search quality: connector, connectors, 連接器, 連線器
assert(api.filterEntries(entries, Array.from(api.tokenize('connector')), {}).some(x => x.id === 'UC-016'), 'connector matches UC-016 via 連接器 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('connectors')), {}).some(x => x.id === 'UC-016'), 'connectors matches UC-016 via 連接器 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('連線器')), {}).some(x => x.id === 'UC-016'), '連線器 matches UC-016 via 連接器 synonym');

// Search quality: skill, skills, 技能, 外掛技能
assert(api.filterEntries(entries, Array.from(api.tokenize('skill')), {}).some(x => x.id === 'UC-006'), 'skill matches UC-006 via 技能 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('skills')), {}).some(x => x.id === 'UC-006'), 'skills matches UC-006 via 技能 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('技能')), {}).some(x => x.id === 'UC-006'), '技能 matches UC-006 via skill synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('外掛技能')), {}).some(x => x.id === 'UC-006'), '外掛技能 matches UC-006 via skill synonym');

// Search quality: grokbot, grok bot
assert(api.filterEntries(entries, Array.from(api.tokenize('grokbot')), {}).some(x => x.id === 'UC-003'), 'grokbot matches UC-003 via grok bot tokenization');

// Search quality: metamuse, meta muse
assert(api.filterEntries(entries, Array.from(api.tokenize('metamuse')), {}).some(x => x.id === 'UC-001'), 'metamuse matches UC-001 via meta muse tokenization');

// Search quality: command line, cli, 命令列, 命令行
assert(api.filterEntries(entries, Array.from(api.tokenize('command line')), {}).some(x => x.id === 'UC-269'), 'command line matches UC-269 via cli tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('command-line')), {}).some(x => x.id === 'UC-269'), 'command-line matches UC-269 via cli tokenization');

// Search quality: api key, apikey, apikeys, 金鑰, 憑證
assert(api.filterEntries(entries, Array.from(api.tokenize('apikey')), {}).some(x => x.id === 'UC-072'), 'apikey matches UC-072 via api key tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('api key')), {}).some(x => x.id === 'UC-072'), 'api key matches UC-072 via api key tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('api keys')), {}).some(x => x.id === 'UC-072'), 'api keys matches UC-072 via api key tokenization');

// Search quality: pr, prs, pull request, pull requests
assert(api.filterEntries(entries, Array.from(api.tokenize('prs')), {}).some(x => x.id === 'UC-005'), 'prs matches UC-005 via pr synonym/tokenization');

// Search quality: 用量, 額度, usage, 消耗, 配額, 限額
assert(api.filterEntries(entries, Array.from(api.tokenize('usage')), {}).some(x => x.id === 'UC-066'), 'usage matches UC-066 via 用量 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('用量')), {}).some(x => x.id === 'UC-066'), '用量 matches UC-066 via usage synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('額度')), {}).some(x => x.id === 'UC-066'), '額度 matches UC-066 via 用量 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('消耗')), {}).some(x => x.id === 'UC-066'), '消耗 matches UC-066 via 用量 synonym');

// Search quality: 沙箱, 沙盒, sandbox, sandboxes
assert(api.filterEntries(entries, Array.from(api.tokenize('沙箱')), {}).some(x => x.id === 'UC-317'), '沙箱 matches UC-317 via 沙盒 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('沙盒')), {}).some(x => x.id === 'UC-329'), '沙盒 matches UC-329 via 沙箱 synonym');

// Search quality: multi-agent, multi agent, multi-agents, multi agents, multiagent, 多agent, 多智能體
assert(api.filterEntries(entries, Array.from(api.tokenize('multi agent')), {}).some(x => x.id === 'UC-042'), 'multi agent matches UC-042 via multi-agent tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('multi-agents')), {}).some(x => x.id === 'UC-042'), 'multi-agents matches UC-042 via multi-agent tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('multi agents')), {}).some(x => x.id === 'UC-042'), 'multi agents matches UC-042 via multi-agent tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('multiagent')), {}).some(x => x.id === 'UC-042'), 'multiagent matches UC-042 via multi-agent tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('多agent')), {}).some(x => x.id === 'UC-042'), '多agent matches UC-042 via multi-agent synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('多智能體')), {}).some(x => x.id === 'UC-042'), '多智能體 matches UC-042 via multi-agent synonym');

// Search quality: 成本, 費用, cost, costs, expense, expenses, 開銷
assert(api.filterEntries(entries, Array.from(api.tokenize('cost')), {}).some(x => x.id === 'UC-007'), 'cost matches UC-007 via 成本 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('costs')), {}).some(x => x.id === 'UC-007'), 'costs matches UC-007 via 成本 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('expense')), {}).some(x => x.id === 'UC-007'), 'expense matches UC-007 via 成本/費用 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('expenses')), {}).some(x => x.id === 'UC-007'), 'expenses matches UC-007 via 成本/費用 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('開銷')), {}).some(x => x.id === 'UC-007'), '開銷 matches UC-007 via 成本/費用 synonym');

// Search quality: rag, retrieval augmented generation, 檢索增強
assert(api.filterEntries(entries, Array.from(api.tokenize('retrieval augmented generation')), {}).some(x => x.id === 'UC-060'), 'retrieval augmented generation matches UC-060 via rag tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('retrieval-augmented generation')), {}).some(x => x.id === 'UC-060'), 'retrieval-augmented generation matches UC-060 via rag tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('檢索增強')), {}).some(x => x.id === 'UC-060'), '檢索增強 matches UC-060 via rag synonym');

// Search quality: vector db, vector database, 向量資料庫, 向量庫
assert(api.filterEntries(entries, Array.from(api.tokenize('vector db')), {}).some(x => x.id === 'UC-060'), 'vector db matches UC-060 via vector tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('vector database')), {}).some(x => x.id === 'UC-060'), 'vector database matches UC-060 via vector tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('向量資料庫')), {}).some(x => x.id === 'UC-060'), '向量資料庫 matches UC-060 via vector synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('向量庫')), {}).some(x => x.id === 'UC-060'), '向量庫 matches UC-060 via vector synonym');

// Search quality: code review, codereview, 代碼審查, 程式碼審查, 代碼覆核
assert(api.filterEntries(entries, Array.from(api.tokenize('codereview')), {}).some(x => x.id === 'UC-005'), 'codereview matches UC-005 via code review tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('代碼審查')), {}).some(x => x.id === 'UC-005'), '代碼審查 matches UC-005 via code review synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('程式碼審查')), {}).some(x => x.id === 'UC-005'), '程式碼審查 matches UC-005 via code review synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('代碼覆核')), {}).some(x => x.id === 'UC-005'), '代碼覆核 matches UC-005 via code review synonym');

// Search quality: mr, merge request, merge requests
assert(api.filterEntries(entries, Array.from(api.tokenize('merge request')), {}).some(x => x.id === 'UC-005'), 'merge request matches UC-005 via mr tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('merge requests')), {}).some(x => x.id === 'UC-005'), 'merge requests matches UC-005 via mr tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('mr')), {}).some(x => x.id === 'UC-005'), 'mr matches UC-005 via pr/mr synonym');

// Search quality: oauth2, 單一登入, 單點登入
assert(api.filterEntries(entries, Array.from(api.tokenize('oauth2')), {}).some(x => x.id === 'UC-061'), 'oauth2 matches UC-061 via oauth synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('單一登入')), {}).some(x => x.id === 'UC-061'), '單一登入 matches UC-061 via oauth/sso synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('單點登入')), {}).some(x => x.id === 'UC-061'), '單點登入 matches UC-061 via oauth/sso synonym');

// Search quality: web-hook, web hooks
assert(api.filterEntries(entries, Array.from(api.tokenize('web-hook')), {}).some(x => x.id === 'UC-074'), 'web-hook matches UC-074 via webhook tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('web hooks')), {}).some(x => x.id === 'UC-074'), 'web hooks matches UC-074 via webhook tokenization');

// Search quality: cron job, cronjob, crontab, 定期任務
assert(api.filterEntries(entries, Array.from(api.tokenize('cron job')), {}).some(x => x.id === 'UC-041'), 'cron job matches UC-041 via cron tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('cronjob')), {}).some(x => x.id === 'UC-041'), 'cronjob matches UC-041 via cron tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('crontab')), {}).some(x => x.id === 'UC-041'), 'crontab matches UC-041 via cron synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('定期任務')), {}).some(x => x.id === 'UC-041'), '定期任務 matches UC-041 via cron/routine synonym');

// Search quality: fallbacks, 備援, 容錯, 備用方案
assert(api.filterEntries(entries, Array.from(api.tokenize('fallbacks')), {}).some(x => x.id === 'UC-049'), 'fallbacks matches UC-049 via fallback synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('備援')), {}).some(x => x.id === 'UC-049'), '備援 matches UC-049 via fallback synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('容錯')), {}).some(x => x.id === 'UC-049'), '容錯 matches UC-049 via fallback synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('備用方案')), {}).some(x => x.id === 'UC-049'), '備用方案 matches UC-049 via fallback synonym');

// Search quality: tool call, tool calls, tool calling, function call, function calls, function calling, 工具調用, 函式呼叫, 函數調用
assert(api.filterEntries(entries, Array.from(api.tokenize('tool call')), {}).some(x => x.id === 'UC-340'), 'tool call matches UC-340 via toolcall tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('tool calls')), {}).some(x => x.id === 'UC-340'), 'tool calls matches UC-340 via toolcall tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('tool calling')), {}).some(x => x.id === 'UC-340'), 'tool calling matches UC-340 via toolcall tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('function call')), {}).some(x => x.id === 'UC-340'), 'function call matches UC-340 via toolcall tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('function calls')), {}).some(x => x.id === 'UC-340'), 'function calls matches UC-340 via toolcall tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('function calling')), {}).some(x => x.id === 'UC-340'), 'function calling matches UC-340 via toolcall tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('工具調用')), {}).some(x => x.id === 'UC-340'), '工具調用 matches UC-340 via toolcall synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('函式呼叫')), {}).some(x => x.id === 'UC-340'), '函式呼叫 matches UC-340 via toolcall synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('函數調用')), {}).some(x => x.id === 'UC-340'), '函數調用 matches UC-340 via toolcall synonym');

// Search quality: tts, text to speech, text-to-speech, 語音合成, 文字轉語音, 語音朗讀
assert(api.filterEntries(entries, Array.from(api.tokenize('text to speech')), {}).some(x => x.id === 'UC-189'), 'text to speech matches UC-189 via tts tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('text-to-speech')), {}).some(x => x.id === 'UC-189'), 'text-to-speech matches UC-189 via tts tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('語音合成')), {}).some(x => x.id === 'UC-189'), '語音合成 matches UC-189 via tts synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('文字轉語音')), {}).some(x => x.id === 'UC-189'), '文字轉語音 matches UC-189 via tts synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('語音朗讀')), {}).some(x => x.id === 'UC-189'), '語音朗讀 matches UC-189 via tts synonym');

// Search quality: stt, speech to text, speech-to-text, 語音轉文字, 語音識別
assert(api.filterEntries(entries, Array.from(api.tokenize('speech to text')), {}).some(x => x.id === 'UC-325'), 'speech to text matches UC-325 via stt tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('speech-to-text')), {}).some(x => x.id === 'UC-325'), 'speech-to-text matches UC-325 via stt tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('語音識別')), {}).some(x => x.id === 'UC-325'), '語音識別 matches UC-325 via stt/transcription synonym');

// Search quality: cicd, ci/cd, ci cd, 持續整合, continuous integration
assert(api.filterEntries(entries, Array.from(api.tokenize('cicd')), {}).some(x => x.id === 'UC-005'), 'cicd matches UC-005 via cicd tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('ci cd')), {}).some(x => x.id === 'UC-005'), 'ci cd matches UC-005 via cicd tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('持續整合')), {}).some(x => x.id === 'UC-005'), '持續整合 matches UC-005 via cicd synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('continuous integration')), {}).some(x => x.id === 'UC-005'), 'continuous integration matches UC-005 via cicd tokenization');

// Search quality: 內網穿透, 反向代理隧道
assert(api.filterEntries(entries, Array.from(api.tokenize('內網穿透')), {}).some(x => x.id === 'UC-074'), '內網穿透 matches UC-074 via tunnel synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('反向代理隧道')), {}).some(x => x.id === 'UC-074'), '反向代理隧道 matches UC-074 via tunnel synonym');

// Search quality: self-hosted runner, self hosted runner, 自託管 runner
assert(api.filterEntries(entries, Array.from(api.tokenize('self-hosted runner')), {}).some(x => x.id === 'UC-057'), 'self-hosted runner matches UC-057 via self-hosted tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('self hosted runner')), {}).some(x => x.id === 'UC-057'), 'self hosted runner matches UC-057 via self-hosted tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('自託管 runner')), {}).some(x => x.id === 'UC-057'), '自託管 runner matches UC-057 via self-hosted synonym');

// Search quality: 筆記軟體, pkm
assert(api.filterEntries(entries, Array.from(api.tokenize('筆記軟體')), {}).some(x => x.id === 'UC-071'), '筆記軟體 matches UC-071 via notes synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('pkm')), {}).some(x => x.id === 'UC-071'), 'pkm matches UC-071 via notes synonym');

// Search quality: prompt injection, prompt injections, 提示詞注入, 指令注入, 越獄, jailbreak
assert(api.filterEntries(entries, Array.from(api.tokenize('prompt injection')), {}).some(x => x.id === 'UC-218'), 'prompt injection matches UC-218 via prompt-injection tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('prompt injections')), {}).some(x => x.id === 'UC-218'), 'prompt injections matches UC-218 via prompt-injection tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('instruction injection')), {}).some(x => x.id === 'UC-218'), 'instruction injection matches UC-218 via prompt-injection tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('提示詞注入')), {}).some(x => x.id === 'UC-218'), '提示詞注入 matches UC-218 via prompt-injection synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('指令注入')), {}).some(x => x.id === 'UC-218'), '指令注入 matches UC-218 via prompt-injection synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('越獄')), {}).some(x => x.id === 'UC-218'), '越獄 matches UC-218 via prompt-injection/jailbreak synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('jailbreak')), {}).some(x => x.id === 'UC-218'), 'jailbreak matches UC-218 via prompt-injection/jailbreak synonym');

// Search quality: structured output, structured outputs, 結構化輸出, json-schema, json schema
assert(api.filterEntries(entries, Array.from(api.tokenize('structured output')), {}).some(x => x.id === 'UC-046'), 'structured output matches UC-046 via structured-output tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('structured outputs')), {}).some(x => x.id === 'UC-046'), 'structured outputs matches UC-046 via structured-output tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('結構化輸出')), {}).some(x => x.id === 'UC-046'), '結構化輸出 matches UC-046 via structured-output synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('json-schema')), {}).some(x => x.id === 'UC-062'), 'json-schema matches UC-062 via json-schema tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('json schema')), {}).some(x => x.id === 'UC-062'), 'json schema matches UC-062 via json-schema tokenization');

// Search quality: sse, server sent events, server-sent events, 流式輸出, 流式傳輸
assert(api.filterEntries(entries, Array.from(api.tokenize('流式輸出')), {}).some(x => x.id === 'UC-030'), '流式輸出 matches UC-030 via stream/sse synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('流式傳輸')), {}).some(x => x.id === 'UC-030'), '流式傳輸 matches UC-030 via stream/sse synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('server sent events')), {}).some(x => x.id === 'UC-030'), 'server sent events matches UC-030 via sse tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('server-sent events')), {}).some(x => x.id === 'UC-030'), 'server-sent events matches UC-030 via sse tokenization');

// Search quality: jira, zendesk, 工單, ticket
assert(api.filterEntries(entries, Array.from(api.tokenize('jira')), {}).some(x => x.id === 'UC-164'), 'jira matches UC-164 via ticket synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('zendesk')), {}).some(x => x.id === 'UC-164'), 'zendesk matches UC-164 via ticket synonym');

// Search quality: headless browser, 無頭瀏覽器, puppeteer
assert(api.filterEntries(entries, Array.from(api.tokenize('headless browser')), {}).some(x => x.id === 'UC-046'), 'headless browser matches UC-046 via headless-browser tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('無頭瀏覽器')), {}).some(x => x.id === 'UC-046'), '無頭瀏覽器 matches UC-046 via headless-browser synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('puppeteer')), {}).some(x => x.id === 'UC-046'), 'puppeteer matches UC-046 via browser automation synonym');

// Search quality: subagent, subagents, sub-agent, sub agent, 子代理, 子agent
assert(api.filterEntries(entries, Array.from(api.tokenize('subagent')), {}).some(x => x.id === 'UC-066'), 'subagent matches UC-066 via subagent synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('subagents')), {}).some(x => x.id === 'UC-066'), 'subagents matches UC-066 via subagent tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('sub-agent')), {}).some(x => x.id === 'UC-066'), 'sub-agent matches UC-066 via subagent synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('sub agent')), {}).some(x => x.id === 'UC-066'), 'sub agent matches UC-066 via subagent tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('子agent')), {}).some(x => x.id === 'UC-066'), '子agent matches UC-066 via subagent synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('子代理')), {}).some(x => x.id === 'UC-066'), '子代理 matches UC-066');

// Search quality: worker agent, worker agents, 工作代理
assert(api.filterEntries(entries, Array.from(api.tokenize('worker agent')), {}).some(x => x.id === 'UC-281'), 'worker agent matches UC-281 via worker synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('worker agents')), {}).some(x => x.id === 'UC-281'), 'worker agents matches UC-281 via worker synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('工作代理')), {}).some(x => x.id === 'UC-281'), '工作代理 matches UC-281 via worker synonym');

// Search quality: data exfiltration, exfiltration, data leak, data leakage, 資料外洩, 資料洩漏, 個資外洩
assert(api.filterEntries(entries, Array.from(api.tokenize('data exfiltration')), {}).some(x => x.id === 'UC-076'), 'data exfiltration matches UC-076 via leak/data-leak synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('exfiltration')), {}).some(x => x.id === 'UC-076'), 'exfiltration matches UC-076 via leak synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('data leak')), {}).some(x => x.id === 'UC-076'), 'data leak matches UC-076 via leak/data-leak synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('data leakage')), {}).some(x => x.id === 'UC-076'), 'data leakage matches UC-076 via leak/data-leak synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('資料外洩')), {}).some(x => x.id === 'UC-076'), '資料外洩 matches UC-076 via leak synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('資料洩漏')), {}).some(x => x.id === 'UC-235'), '資料洩漏 matches UC-235 via leak synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('個資外洩')), {}).some(x => x.id === 'UC-076'), '個資外洩 matches UC-076 via leak synonym');

// Search quality: computer use, computer-use, cua, 電腦操作, gui agent
assert(api.filterEntries(entries, Array.from(api.tokenize('computer use')), {}).some(x => x.id === 'UC-268'), 'computer use matches UC-268 via computer-use tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('computer-use')), {}).some(x => x.id === 'UC-268'), 'computer-use matches UC-268 via computer-use synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('cua')), {}).some(x => x.id === 'UC-268'), 'cua matches UC-268 via computer-use synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('電腦操作')), {}).some(x => x.id === 'UC-028'), '電腦操作 matches UC-028 via computer-use synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('gui agent')), {}).some(x => x.id === 'UC-268'), 'gui agent matches UC-268 via computer-use synonym');

// Search quality: reasoning, inference, 思考過程, 思維過程
assert(api.filterEntries(entries, Array.from(api.tokenize('reasoning')), {}).some(x => x.id === 'UC-292'), 'reasoning matches UC-292 via reasoning synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('inference')), {}).some(x => x.id === 'UC-305'), 'inference matches UC-305 via reasoning synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('思考過程')), {}).some(x => x.id === 'UC-292'), '思考過程 matches UC-292 via reasoning synonym');

// Search quality: context window, context length, 上下文窗口, 上下文長度, 上下文壓縮, context compaction
assert(api.filterEntries(entries, Array.from(api.tokenize('context window')), {}).some(x => x.id === 'UC-066'), 'context window matches UC-066 via context-window tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('上下文窗口')), {}).some(x => x.id === 'UC-066'), '上下文窗口 matches UC-066 via context-window synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('上下文長度')), {}).some(x => x.id === 'UC-066'), '上下文長度 matches UC-066 via context-window synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('long context')), {}).some(x => x.id === 'UC-066'), 'long context matches UC-066 via context-window synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('context compaction')), {}).some(x => x.id === 'UC-066'), 'context compaction matches UC-066 via context-compaction tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('上下文壓縮')), {}).some(x => x.id === 'UC-066'), '上下文壓縮 matches UC-066 via context-compaction synonym');

// Search quality: hybrid search, 混合檢索
assert(api.filterEntries(entries, Array.from(api.tokenize('hybrid search')), {}).some(x => x.id === 'UC-132'), 'hybrid search matches UC-132 via hybrid-search tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('混合檢索')), {}).some(x => x.id === 'UC-132'), '混合檢索 matches UC-132 via hybrid-search synonym');

// Search quality: synthetic data, synthetic, 合成資料, 合成數據
assert(api.filterEntries(entries, Array.from(api.tokenize('synthetic data')), {}).some(x => x.id === 'UC-103'), 'synthetic data matches UC-103 via synthetic-data tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('synthetic')), {}).some(x => x.id === 'UC-103'), 'synthetic matches UC-103 via synthetic synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('合成數據')), {}).some(x => x.id === 'UC-103'), '合成數據 matches UC-103 via synthetic synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('合成資料')), {}).some(x => x.id === 'UC-251'), '合成資料 matches UC-251 via synthetic synonym');

// Search quality: autonomous agent, autonomous, 自主代理, 自主運行, 自主任務
assert(api.filterEntries(entries, Array.from(api.tokenize('autonomous agent')), {}).some(x => x.id === 'UC-317'), 'autonomous agent matches UC-317 via autonomous-agent tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('自主代理')), {}).some(x => x.id === 'UC-317'), '自主代理 matches UC-317 via autonomous synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('自主運行')), {}).some(x => x.id === 'UC-061'), '自主運行 matches UC-061 via autonomous synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('自主任務')), {}).some(x => x.id === 'UC-317'), '自主任務 matches UC-317 via autonomous synonym');

// Search quality: keepalive, keep-alive, 保活, 存活檢查
assert(api.filterEntries(entries, Array.from(api.tokenize('keepalive')), {}).some(x => x.id === 'UC-314'), 'keepalive matches UC-314 via keepalive tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('keep-alive')), {}).some(x => x.id === 'UC-314'), 'keep-alive matches UC-314 via keepalive synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('保活')), {}).some(x => x.id === 'UC-314'), '保活 matches UC-314');
assert(api.filterEntries(entries, Array.from(api.tokenize('存活檢查')), {}).some(x => x.id === 'UC-314'), '存活檢查 matches UC-314 via keepalive/heartbeat synonym');

// Search quality: rate-limits, rate limit, 速率限制
assert(api.filterEntries(entries, Array.from(api.tokenize('rate-limits')), {}).some(x => x.id === 'UC-164'), 'rate-limits matches UC-164 via ratelimit tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('rate limit')), {}).some(x => x.id === 'UC-164'), 'rate limit matches UC-164 via ratelimit tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('速率限制')), {}).some(x => x.id === 'UC-164'), '速率限制 matches UC-164 via ratelimit synonym');

// Search quality: redirect, redirection, 重定向, 轉址
assert(api.filterEntries(entries, Array.from(api.tokenize('redirect')), {}).some(x => x.id === 'UC-065'), 'redirect matches UC-065 via redirect tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('redirection')), {}).some(x => x.id === 'UC-073'), 'redirection matches UC-073 via redirect synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('重定向')), {}).some(x => x.id === 'UC-163'), '重定向 matches UC-163 via redirect synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('轉址')), {}).some(x => x.id === 'UC-065'), '轉址 matches UC-065');

// Search quality: canary, 金絲雀, 灰度發布
assert(api.filterEntries(entries, Array.from(api.tokenize('canary')), {}).some(x => x.id === 'UC-061'), 'canary matches UC-061');
assert(api.filterEntries(entries, Array.from(api.tokenize('金絲雀')), {}).some(x => x.id === 'UC-061'), '金絲雀 matches UC-061 via canary synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('灰度發布')), {}).some(x => x.id === 'UC-061'), '灰度發布 matches UC-061 via canary synonym');

// Search quality: semantic search, 語意搜尋, vector search, 向量檢索
assert(api.filterEntries(entries, Array.from(api.tokenize('semantic search')), {}).some(x => x.id === 'UC-060'), 'semantic search matches UC-060 via semantic-search tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('語意搜尋')), {}).some(x => x.id === 'UC-060'), '語意搜尋 matches UC-060 via semantic-search synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('vector search')), {}).some(x => x.id === 'UC-060'), 'vector search matches UC-060 via vector-search tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('向量檢索')), {}).some(x => x.id === 'UC-060'), '向量檢索 matches UC-060 via vector-search synonym');

// Search quality: 2fa, mfa, 雙重驗證, 二步驟驗證, 兩步驟驗證
assert(api.filterEntries(entries, Array.from(api.tokenize('2fa')), {}).some(x => x.id === 'UC-092'), '2fa matches UC-092 via 2fa synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('mfa')), {}).some(x => x.id === 'UC-219'), 'mfa matches UC-219 via 2fa synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('二步驟驗證')), {}).some(x => x.id === 'UC-259'), '二步驟驗證 matches UC-259 via 2fa synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('兩步驟驗證')), {}).some(x => x.id === 'UC-259'), '兩步驟驗證 matches UC-259 via 2fa synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('雙重驗證')), {}).some(x => x.id === 'UC-219'), '雙重驗證 matches UC-219 via 2fa synonym');

// Search quality: cot, chain of thought, chain-of-thought, 思維鏈, 思考鏈
assert(api.filterEntries(entries, Array.from(api.tokenize('chain of thought')), {}).some(x => x.id === 'UC-086'), 'chain of thought matches UC-086 via cot tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('chain-of-thought')), {}).some(x => x.id === 'UC-086'), 'chain-of-thought matches UC-086 via cot tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('思維鏈')), {}).some(x => x.id === 'UC-086'), '思維鏈 matches UC-086 via cot synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('思考鏈')), {}).some(x => x.id === 'UC-086'), '思考鏈 matches UC-086 via cot synonym');

// Search quality: isolation, airgap, air-gap, 網路隔離
assert(api.filterEntries(entries, Array.from(api.tokenize('isolation')), {}).some(x => x.id === 'UC-005'), 'isolation matches UC-005 via 隔離 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('airgap')), {}).some(x => x.id === 'UC-005'), 'airgap matches UC-005 via 隔離 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('air-gap')), {}).some(x => x.id === 'UC-005'), 'air-gap matches UC-005 via 隔離 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('網路隔離')), {}).some(x => x.id === 'UC-005'), '網路隔離 matches UC-005 via 隔離 synonym');

// Search quality: throttle, 節流
assert(api.filterEntries(entries, Array.from(api.tokenize('throttle')), {}).some(x => x.id === 'UC-164'), 'throttle matches UC-164 via ratelimit synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('節流')), {}).some(x => x.id === 'UC-164'), '節流 matches UC-164 via ratelimit synonym');

// Search quality: 人機協同, 人機協作, 人工審查
assert(api.filterEntries(entries, Array.from(api.tokenize('人機協同')), {}).some(x => x.id === 'UC-184'), '人機協同 matches UC-184 via hitl synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('人機協作')), {}).some(x => x.id === 'UC-184'), '人機協作 matches UC-184 via hitl synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('人工審查')), {}).some(x => x.id === 'UC-184'), '人工審查 matches UC-184 via hitl synonym');

// Search quality: dispatch, 分派, 分發
assert(api.filterEntries(entries, Array.from(api.tokenize('dispatch')), {}).some(x => x.id === 'UC-079'), 'dispatch matches UC-079 via 分發 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('分派')), {}).some(x => x.id === 'UC-079'), '分派 matches UC-079 via 分發 synonym');

// Search quality: 跑分
assert(api.filterEntries(entries, Array.from(api.tokenize('跑分')), {}).some(x => x.id === 'UC-003'), '跑分 matches UC-003 via benchmark synonym');

// Search quality: agentic workflow, 智能體工作流
assert(api.filterEntries(entries, Array.from(api.tokenize('agentic workflow')), {}).some(x => x.id === 'UC-268'), 'agentic workflow matches UC-268 via agentic-workflow tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('智能體工作流')), {}).some(x => x.id === 'UC-268'), '智能體工作流 matches UC-268 via agentic-workflow synonym');

// Search quality: rerank, reranking, reranker, 重排, 二次排序
assert(api.filterEntries(entries, Array.from(api.tokenize('rerank')), {}).some(x => x.id === 'UC-040'), 'rerank matches UC-040 via rerank tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('reranking')), {}).some(x => x.id === 'UC-040'), 'reranking matches UC-040 via rerank tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('reranker')), {}).some(x => x.id === 'UC-040'), 'reranker matches UC-040 via rerank synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('二次排序')), {}).some(x => x.id === 'UC-040'), '二次排序 matches UC-040 via rerank synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('重排')), {}).some(x => x.id === 'UC-040'), '重排 matches UC-040');

// Search quality: dedup, deduplication, 去重, 去重複, 查重, 重複資料
assert(api.filterEntries(entries, Array.from(api.tokenize('dedup')), {}).some(x => x.id === 'UC-046'), 'dedup matches UC-046 via dedup tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('deduplication')), {}).some(x => x.id === 'UC-046'), 'deduplication matches UC-046 via dedup tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('去重複')), {}).some(x => x.id === 'UC-046'), '去重複 matches UC-046 via dedup synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('查重')), {}).some(x => x.id === 'UC-055'), '查重 matches UC-055');
assert(api.filterEntries(entries, Array.from(api.tokenize('重複資料')), {}).some(x => x.id === 'UC-255'), '重複資料 matches UC-255 via dedup synonym');

// Search quality: delegate, delegation, 委派, 委託
assert(api.filterEntries(entries, Array.from(api.tokenize('delegate')), {}).some(x => x.id === 'UC-039'), 'delegate matches UC-039 via delegation synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('delegation')), {}).some(x => x.id === 'UC-039'), 'delegation matches UC-039 via delegation synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('委派')), {}).some(x => x.id === 'UC-039'), '委派 matches UC-039');
assert(api.filterEntries(entries, Array.from(api.tokenize('委託')), {}).some(x => x.id === 'UC-039'), '委託 matches UC-039 via delegation synonym');

// Search quality: firewall, 防火牆, iptables, ufw
assert(api.filterEntries(entries, Array.from(api.tokenize('firewall')), {}).some(x => x.id === 'UC-269'), 'firewall matches UC-269 via firewall synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('防火牆')), {}).some(x => x.id === 'UC-269'), '防火牆 matches UC-269');
assert(api.filterEntries(entries, Array.from(api.tokenize('iptables')), {}).some(x => x.id === 'UC-269'), 'iptables matches UC-269 via firewall synonym');

// Search quality: audit trail, 審計日誌, 稽核軌跡, 操作紀錄, 操作記錄, 操作軌跡
assert(api.filterEntries(entries, Array.from(api.tokenize('audit trail')), {}).some(x => x.id === 'UC-225'), 'audit trail matches UC-225 via audit-trail tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('審計日誌')), {}).some(x => x.id === 'UC-225'), '審計日誌 matches UC-225 via audit-trail synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('操作軌跡')), {}).some(x => x.id === 'UC-225'), '操作軌跡 matches UC-225 via audit-trail synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('操作記錄')), {}).some(x => x.id === 'UC-016'), '操作記錄 matches UC-016 via audit-trail synonym');

// Search quality: backoff, exponential backoff, 指數退避, 退避, 重試機制
assert(api.filterEntries(entries, Array.from(api.tokenize('backoff')), {}).some(x => x.id === 'UC-005'), 'backoff matches UC-005 via retry synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('exponential backoff')), {}).some(x => x.id === 'UC-005'), 'exponential backoff matches UC-005 via backoff tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('指數退避')), {}).some(x => x.id === 'UC-005'), '指數退避 matches UC-005 via retry synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('退避')), {}).some(x => x.id === 'UC-005'), '退避 matches UC-005 via retry synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('重試機制')), {}).some(x => x.id === 'UC-005'), '重試機制 matches UC-005 via retry synonym');

// Search quality: multimodal, 多模態, 看圖, 視覺模型, vlm
assert(api.filterEntries(entries, Array.from(api.tokenize('multimodal')), {}).some(x => x.id === 'UC-083'), 'multimodal matches UC-083 via multimodal synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('多模態')), {}).some(x => x.id === 'UC-083'), '多模態 matches UC-083 via multimodal synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('視覺模型')), {}).some(x => x.id === 'UC-083'), '視覺模型 matches UC-083 via multimodal synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('看圖')), {}).some(x => x.id === 'UC-083'), '看圖 matches UC-083 via multimodal synonym');

// Search quality: system prompt, system instructions, 系統提示詞, 系統提示
assert(api.filterEntries(entries, Array.from(api.tokenize('system prompt')), {}).some(x => x.id === 'UC-001'), 'system prompt matches UC-001 via system-prompt tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('系統提示詞')), {}).some(x => x.id === 'UC-001'), '系統提示詞 matches UC-001 via system-prompt synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('系統提示')), {}).some(x => x.id === 'UC-001'), '系統提示 matches UC-001 via system-prompt synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('system instructions')), {}).some(x => x.id === 'UC-001'), 'system instructions matches UC-001 via system-prompt tokenization');

// Search quality: least privilege, least-privilege, least privileges, 最小權限, 最小權限原則, 權限最小化
assert(api.filterEntries(entries, Array.from(api.tokenize('least privilege')), {}).some(x => x.id === 'UC-003'), 'least privilege matches UC-003 via least-privilege tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('least-privilege')), {}).some(x => x.id === 'UC-010'), 'least-privilege matches UC-010 via least-privilege synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('least privileges')), {}).some(x => x.id === 'UC-269'), 'least privileges matches UC-269 via least-privilege tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('最小權限')), {}).some(x => x.id === 'UC-003'), '最小權限 matches UC-003');
assert(api.filterEntries(entries, Array.from(api.tokenize('最小權限原則')), {}).some(x => x.id === 'UC-003'), '最小權限原則 matches UC-003 via least-privilege synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('權限最小化')), {}).some(x => x.id === 'UC-003'), '權限最小化 matches UC-003 via least-privilege synonym');

// Search quality: whitelist, whitelisting, allowlist, allowlisting, 白名單, 允許清單
assert(api.filterEntries(entries, Array.from(api.tokenize('whitelist')), {}).some(x => x.id === 'UC-077'), 'whitelist matches UC-077 via whitelist tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('whitelisting')), {}).some(x => x.id === 'UC-077'), 'whitelisting matches UC-077 via whitelist tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('allowlist')), {}).some(x => x.id === 'UC-269'), 'allowlist matches UC-269 via allowlist synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('allowlisting')), {}).some(x => x.id === 'UC-275'), 'allowlisting matches UC-275 via allowlist synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('白名單')), {}).some(x => x.id === 'UC-077'), '白名單 matches UC-077');
assert(api.filterEntries(entries, Array.from(api.tokenize('允許清單')), {}).some(x => x.id === 'UC-269'), '允許清單 matches UC-269 via allowlist synonym');

// Search quality: blacklist, blacklisting, denylist, blocklist, 黑名單
assert(api.filterEntries(entries, Array.from(api.tokenize('blacklist')), {}).some(x => x.id === 'UC-005'), 'blacklist matches UC-005 via blacklist tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('blacklisting')), {}).some(x => x.id === 'UC-005'), 'blacklisting matches UC-005 via blacklist tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('denylist')), {}).some(x => x.id === 'UC-005'), 'denylist matches UC-005 via denylist synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('blocklist')), {}).some(x => x.id === 'UC-005'), 'blocklist matches UC-005 via blocklist synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('黑名單')), {}).some(x => x.id === 'UC-005'), '黑名單 matches UC-005');

// Search quality: sensitive data, sensitive information, sensitive info, 敏感資料, 敏感資訊, 敏感信息
assert(api.filterEntries(entries, Array.from(api.tokenize('sensitive data')), {}).some(x => x.id === 'UC-049'), 'sensitive data matches UC-049 via sensitive-data tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('sensitive information')), {}).some(x => x.id === 'UC-099'), 'sensitive information matches UC-099 via sensitive-data tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('sensitive info')), {}).some(x => x.id === 'UC-180'), 'sensitive info matches UC-180 via sensitive-data tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('敏感資料')), {}).some(x => x.id === 'UC-049'), '敏感資料 matches UC-049');
assert(api.filterEntries(entries, Array.from(api.tokenize('敏感資訊')), {}).some(x => x.id === 'UC-049'), '敏感資訊 matches UC-049 via sensitive-data synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('敏感信息')), {}).some(x => x.id === 'UC-099'), '敏感信息 matches UC-099 via sensitive-data synonym');

// Search quality: router, routers, 路由器, 路由, routing, 動態路由
assert(api.filterEntries(entries, Array.from(api.tokenize('router')), {}).some(x => x.id === 'UC-010'), 'router matches UC-010 via router synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('routers')), {}).some(x => x.id === 'UC-010'), 'routers matches UC-010 via router tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('路由器')), {}).some(x => x.id === 'UC-010'), '路由器 matches UC-010');
assert(api.filterEntries(entries, Array.from(api.tokenize('路由')), {}).some(x => x.id === 'UC-010'), '路由 matches UC-010');
assert(api.filterEntries(entries, Array.from(api.tokenize('routing')), {}).some(x => x.id === 'UC-010'), 'routing matches UC-010 via routing synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('動態路由')), {}).some(x => x.id === 'UC-156'), '動態路由 matches UC-156 via routing synonym');

// Search quality: kill switch, emergency stop, circuit breaker, 緊急停止, 緊急開關, 停止開關, 熔斷, 斷路器
assert(api.filterEntries(entries, Array.from(api.tokenize('kill switch')), {}).some(x => x.id === 'UC-275'), 'kill switch matches UC-275 via kill-switch tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('emergency stop')), {}).some(x => x.id === 'UC-275'), 'emergency stop matches UC-275 via emergency-stop tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('circuit breaker')), {}).some(x => x.id === 'UC-275'), 'circuit breaker matches UC-275 via circuit-breaker tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('緊急停止')), {}).some(x => x.id === 'UC-275'), '緊急停止 matches UC-275');
assert(api.filterEntries(entries, Array.from(api.tokenize('緊急開關')), {}).some(x => x.id === 'UC-275'), '緊急開關 matches UC-275 via kill-switch synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('停止開關')), {}).some(x => x.id === 'UC-275'), '停止開關 matches UC-275 via kill-switch synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('熔斷')), {}).some(x => x.id === 'UC-275'), '熔斷 matches UC-275 via circuit-breaker synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('斷路器')), {}).some(x => x.id === 'UC-275'), '斷路器 matches UC-275 via circuit-breaker synonym');

// Search quality: outbox, outbox pattern, outbox-pattern, 發件匣, 發件箱, 發件匣模式, 發件箱模式
assert(api.filterEntries(entries, Array.from(api.tokenize('outbox')), {}).some(x => x.id === 'UC-329'), 'outbox matches UC-329 via outbox synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('outbox pattern')), {}).some(x => x.id === 'UC-329'), 'outbox pattern matches UC-329 via outbox tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('outbox-pattern')), {}).some(x => x.id === 'UC-329'), 'outbox-pattern matches UC-329 via outbox tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('發件匣')), {}).some(x => x.id === 'UC-329'), '發件匣 matches UC-329 via outbox synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('發件箱')), {}).some(x => x.id === 'UC-329'), '發件箱 matches UC-329 via outbox synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('發件匣模式')), {}).some(x => x.id === 'UC-329'), '發件匣模式 matches UC-329 via outbox synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('發件箱模式')), {}).some(x => x.id === 'UC-329'), '發件箱模式 matches UC-329 via outbox synonym');

// Search quality: checkpoint, checkpoints, check point, check points, checkpointing, 檢查點
assert(api.filterEntries(entries, Array.from(api.tokenize('checkpoint')), {}).some(x => x.id === 'UC-231'), 'checkpoint matches UC-231 via checkpoint synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('checkpoints')), {}).some(x => x.id === 'UC-231'), 'checkpoints matches UC-231 via checkpoint synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('check point')), {}).some(x => x.id === 'UC-231'), 'check point matches UC-231 via checkpoint tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('check points')), {}).some(x => x.id === 'UC-231'), 'check points matches UC-231 via checkpoint tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('checkpointing')), {}).some(x => x.id === 'UC-231'), 'checkpointing matches UC-231 via checkpoint tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('檢查點')), {}).some(x => x.id === 'UC-231'), '檢查點 matches UC-231');

// Search quality: sandbox, sandboxes, sandboxing, 沙盒, 沙箱, 沙盒環境, 沙箱環境
assert(api.filterEntries(entries, Array.from(api.tokenize('sandbox')), {}).some(x => x.id === 'UC-317'), 'sandbox matches UC-317');
assert(api.filterEntries(entries, Array.from(api.tokenize('sandboxes')), {}).some(x => x.id === 'UC-317'), 'sandboxes matches UC-317 via sandbox synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('sandboxing')), {}).some(x => x.id === 'UC-317'), 'sandboxing matches UC-317 via sandbox tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('沙盒')), {}).some(x => x.id === 'UC-317'), '沙盒 matches UC-317');
assert(api.filterEntries(entries, Array.from(api.tokenize('沙箱')), {}).some(x => x.id === 'UC-317'), '沙箱 matches UC-317 via sandbox synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('沙盒環境')), {}).some(x => x.id === 'UC-317'), '沙盒環境 matches UC-317 via sandbox synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('沙箱環境')), {}).some(x => x.id === 'UC-317'), '沙箱環境 matches UC-317 via sandbox synonym');

// Search quality: memory, long-term memory, working memory, external memory, shared memory, visible memory, persistent memory
assert(api.filterEntries(entries, Array.from(api.tokenize('long-term memory')), {}).some(x => x.id === 'UC-255'), 'long-term memory matches UC-255 via memory tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('long term memory')), {}).some(x => x.id === 'UC-255'), 'long term memory matches UC-255 via memory tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('working memory')), {}).some(x => x.id === 'UC-255'), 'working memory matches UC-255 via memory tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('external memory')), {}).some(x => x.id === 'UC-071'), 'external memory matches UC-071 via memory tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('shared memory')), {}).some(x => x.id === 'UC-067'), 'shared memory matches UC-067 via memory tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('visible memory')), {}).some(x => x.id === 'UC-066'), 'visible memory matches UC-066 via memory tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('persistent memory')), {}).some(x => x.id === 'UC-338'), 'persistent memory matches UC-338 via memory tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('工作記憶')), {}).some(x => x.id === 'UC-255'), '工作記憶 matches UC-255 via memory synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('外部記憶')), {}).some(x => x.id === 'UC-071'), '外部記憶 matches UC-071 via memory synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('共用記憶')), {}).some(x => x.id === 'UC-067'), '共用記憶 matches UC-067 via memory synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('可見記憶')), {}).some(x => x.id === 'UC-066'), '可見記憶 matches UC-066 via memory synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('持久記憶')), {}).some(x => x.id === 'UC-338'), '持久記憶 matches UC-338 via memory synonym');

// Search quality: idempotent, idempotency, idempotence, 冪等, 冪等性, 冪等操作
assert(api.filterEntries(entries, Array.from(api.tokenize('idempotent')), {}).some(x => x.id === 'UC-158'), 'idempotent matches UC-158 via idempotent synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('idempotency')), {}).some(x => x.id === 'UC-158'), 'idempotency matches UC-158 via idempotent synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('idempotence')), {}).some(x => x.id === 'UC-158'), 'idempotence matches UC-158 via idempotent tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('冪等')), {}).some(x => x.id === 'UC-158'), '冪等 matches UC-158');
assert(api.filterEntries(entries, Array.from(api.tokenize('冪等性')), {}).some(x => x.id === 'UC-158'), '冪等性 matches UC-158 via idempotent synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('冪等操作')), {}).some(x => x.id === 'UC-158'), '冪等操作 matches UC-158 via idempotent synonym');

// Search quality: orchestrator, orchestrators, 編排者, orchestration, orchestrate
assert(api.filterEntries(entries, Array.from(api.tokenize('orchestrator')), {}).some(x => x.id === 'UC-061'), 'orchestrator matches UC-061 via orchestration tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('orchestrators')), {}).some(x => x.id === 'UC-061'), 'orchestrators matches UC-061 via orchestration tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('編排者')), {}).some(x => x.id === 'UC-061'), '編排者 matches UC-061 via orchestration synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('orchestration')), {}).some(x => x.id === 'UC-061'), 'orchestration matches UC-061');

// Search quality: coordinator, coordinators, supervisor, supervisors, 協調者, 監管代理
assert(api.filterEntries(entries, Array.from(api.tokenize('coordinator')), {}).some(x => x.id === 'UC-012'), 'coordinator matches UC-012 via coordination tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('coordinators')), {}).some(x => x.id === 'UC-012'), 'coordinators matches UC-012 via coordination tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('supervisor')), {}).some(x => x.id === 'UC-012'), 'supervisor matches UC-012 via coordination synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('supervisors')), {}).some(x => x.id === 'UC-012'), 'supervisors matches UC-012 via coordination synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('協調者')), {}).some(x => x.id === 'UC-012'), '協調者 matches UC-012 via coordination synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('監管代理')), {}).some(x => x.id === 'UC-012'), '監管代理 matches UC-012 via coordination synonym');

// Search quality: access control, access-control, rbac, 存取控制, 訪問控制, 權限控制
assert(api.filterEntries(entries, Array.from(api.tokenize('access control')), {}).some(x => x.id === 'UC-276'), 'access control matches UC-276 via access control tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('access-control')), {}).some(x => x.id === 'UC-276'), 'access-control matches UC-276 via access control tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('rbac')), {}).some(x => x.id === 'UC-276'), 'rbac matches UC-276 via access control synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('存取控制')), {}).some(x => x.id === 'UC-276'), '存取控制 matches UC-276 via access control synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('訪問控制')), {}).some(x => x.id === 'UC-276'), '訪問控制 matches UC-276 via access control synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('權限控制')), {}).some(x => x.id === 'UC-276'), '權限控制 matches UC-276 via access control synonym');

// Search quality: event-driven, event driven, 事件驅動, 事件驅動架構
assert(api.filterEntries(entries, Array.from(api.tokenize('event-driven')), {}).some(x => x.id === 'UC-074'), 'event-driven matches UC-074 via event-driven tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('event driven')), {}).some(x => x.id === 'UC-074'), 'event driven matches UC-074 via event-driven tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('事件驅動')), {}).some(x => x.id === 'UC-074'), '事件驅動 matches UC-074 via event-driven synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('事件驅動架構')), {}).some(x => x.id === 'UC-074'), '事件驅動架構 matches UC-074 via event-driven synonym');

// Search quality: blue green deployment without hyphen
assert(api.filterEntries(entries, Array.from(api.tokenize('blue green')), {}).some(x => x.id === 'UC-061'), 'blue green matches UC-061 via blue-green tokenization');

// Search quality: rollback synonyms: 倒退
assert(api.filterEntries(entries, Array.from(api.tokenize('倒退')), {}).some(x => x.id === 'UC-002'), '倒退 matches UC-002 via rollback synonym');

// Search quality: planning, task planning, 任務規劃, 規劃
assert(api.filterEntries(entries, Array.from(api.tokenize('planning')), {}).some(x => x.id === 'UC-001'), 'planning matches UC-001 via planning synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('task planning')), {}).some(x => x.id === 'UC-148'), 'task planning matches UC-148 via planning tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('任務規劃')), {}).some(x => x.id === 'UC-148'), '任務規劃 matches UC-148 via planning synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('規劃')), {}).some(x => x.id === 'UC-001'), '規劃 matches UC-001');

// Search quality: reproducibility, reproducible, reproduce, 可重現, 重現性
assert(api.filterEntries(entries, Array.from(api.tokenize('reproducibility')), {}).some(x => x.id === 'UC-003'), 'reproducibility matches UC-003 via reproducibility synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('reproducible')), {}).some(x => x.id === 'UC-003'), 'reproducible matches UC-003 via reproducibility tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('reproduce')), {}).some(x => x.id === 'UC-003'), 'reproduce matches UC-003 via reproducibility tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('可重現')), {}).some(x => x.id === 'UC-003'), '可重現 matches UC-003');
assert(api.filterEntries(entries, Array.from(api.tokenize('重現性')), {}).some(x => x.id === 'UC-003'), '重現性 matches UC-003 via reproducibility synonym');

// Search quality: citation, citations, 引用, 出處, 溯源
assert(api.filterEntries(entries, Array.from(api.tokenize('citation')), {}).some(x => x.id === 'UC-002'), 'citation matches UC-002 via citation synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('citations')), {}).some(x => x.id === 'UC-002'), 'citations matches UC-002 via citation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('引用')), {}).some(x => x.id === 'UC-002'), '引用 matches UC-002');

// Search quality: tool use, tool-use, 函式調用, 函數呼叫
assert(api.filterEntries(entries, Array.from(api.tokenize('tool use')), {}).some(x => x.id === 'UC-066'), 'tool use matches UC-066 via toolcall tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('函式調用')), {}).some(x => x.id === 'UC-066'), '函式調用 matches UC-066 via toolcall synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('函數呼叫')), {}).some(x => x.id === 'UC-066'), '函數呼叫 matches UC-066 via toolcall synonym');

// Search quality: failover, 故障轉移, 容災
assert(api.filterEntries(entries, Array.from(api.tokenize('failover')), {}).some(x => x.id === 'UC-324'), 'failover matches UC-324 via failover synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('故障轉移')), {}).some(x => x.id === 'UC-324'), '故障轉移 matches UC-324 via failover synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('容災')), {}).some(x => x.id === 'UC-324'), '容災 matches UC-324 via failover synonym');

// Search quality: acceptance, acceptance criteria, acceptance test, 驗收, 驗收標準, 驗收條件, 驗收規範
assert(api.filterEntries(entries, Array.from(api.tokenize('acceptance')), {}).some(x => x.id === 'UC-001'), 'acceptance matches UC-001 via acceptance synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('acceptance criteria')), {}).some(x => x.id === 'UC-001'), 'acceptance criteria matches UC-001 via acceptance tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('acceptance test')), {}).some(x => x.id === 'UC-001'), 'acceptance test matches UC-001 via acceptance tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('驗收標準')), {}).some(x => x.id === 'UC-001'), '驗收標準 matches UC-001 via acceptance synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('驗收條件')), {}).some(x => x.id === 'UC-001'), '驗收條件 matches UC-001 via acceptance synonym');

// Search quality: parallelism, 平行, 並行
assert(api.filterEntries(entries, Array.from(api.tokenize('平行')), {}).some(x => x.id === 'UC-005'), '平行 matches UC-005 via parallel synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('parallelism')), {}).some(x => x.id === 'UC-005'), 'parallelism matches UC-005 via parallel tokenization');

// Search quality: 移交, handoff
assert(api.filterEntries(entries, Array.from(api.tokenize('移交')), {}).some(x => x.id === 'UC-005'), '移交 matches UC-005 via handoff synonym');

// Search quality: guardrail, 防護欄, safety rail
assert(api.filterEntries(entries, Array.from(api.tokenize('防護欄')), {}).some(x => x.id === 'UC-316'), '防護欄 matches UC-316 via guardrail synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('safety rail')), {}).some(x => x.id === 'UC-316'), 'safety rail matches UC-316 via guardrail tokenization');

// Search quality: graceful degradation, 優雅降級
assert(api.filterEntries(entries, Array.from(api.tokenize('優雅降級')), {}).some(x => x.id === 'UC-028'), '優雅降級 matches UC-028 via fallback synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('graceful degradation')), {}).some(x => x.id === 'UC-028'), 'graceful degradation matches UC-028 via fallback tokenization');

// Search quality: caches, scheduler, 排程器, 異常檢測, anomaly detection, reviewing, reviewer, benchmarking, evaluating
assert(api.filterEntries(entries, Array.from(api.tokenize('caches')), {}).some(x => x.id === 'UC-001'), 'caches matches UC-001 via cache tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('scheduler')), {}).some(x => x.id === 'UC-002'), 'scheduler matches UC-002 via schedule tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('排程器')), {}).some(x => x.id === 'UC-002'), '排程器 matches UC-002 via schedule synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('異常檢測')), {}).some(x => x.id === 'UC-003'), '異常檢測 matches UC-003 via anomaly synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('anomaly detection')), {}).some(x => x.id === 'UC-003'), 'anomaly detection matches UC-003 via anomaly tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('reviewing')), {}).some(x => x.id === 'UC-005'), 'reviewing matches UC-005 via review tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('reviewer')), {}).some(x => x.id === 'UC-005'), 'reviewer matches UC-005 via review tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('benchmarking')), {}).some(x => x.id === 'UC-003'), 'benchmarking matches UC-003 via benchmark tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('evaluating')), {}).some(x => x.id === 'UC-003'), 'evaluating matches UC-003 via evaluation tokenization');

// Search quality: coloring, coloring page, 著色, 著色頁, 線稿, 塗色
assert(api.filterEntries(entries, Array.from(api.tokenize('coloring')), {}).some(x => x.id === 'UC-342'), 'coloring matches UC-342 via coloring synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('coloring page')), {}).some(x => x.id === 'UC-342'), 'coloring page matches UC-342 via coloring tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('著色頁')), {}).some(x => x.id === 'UC-342'), '著色頁 matches UC-342 via coloring synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('塗色')), {}).some(x => x.id === 'UC-342'), '塗色 matches UC-342 via coloring synonym');

// Search quality: print, printer, printers, printing, 列印, 印表機
assert(api.filterEntries(entries, Array.from(api.tokenize('printer')), {}).some(x => x.id === 'UC-342'), 'printer matches UC-342 via print synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('printers')), {}).some(x => x.id === 'UC-342'), 'printers matches UC-342 via print tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('printing')), {}).some(x => x.id === 'UC-342'), 'printing matches UC-342 via print tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('列印')), {}).some(x => x.id === 'UC-342'), '列印 matches UC-342 via print synonym');

// Search quality: breakdown, roadside, roadside assistance, 拋錨, 道路救援
assert(api.filterEntries(entries, Array.from(api.tokenize('breakdown')), {}).some(x => x.id === 'UC-343'), 'breakdown matches UC-343 via breakdown synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('roadside')), {}).some(x => x.id === 'UC-343'), 'roadside matches UC-343 via roadside synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('roadside assistance')), {}).some(x => x.id === 'UC-343'), 'roadside assistance matches UC-343 via roadside tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('道路救援')), {}).some(x => x.id === 'UC-343'), '道路救援 matches UC-343 via roadside synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('拋錨')), {}).some(x => x.id === 'UC-343'), '拋錨 matches UC-343 via roadside synonym');

// Search quality: stall, stalled, 卡住, 停滯, 停擺
assert(api.filterEntries(entries, Array.from(api.tokenize('stalled')), {}).some(x => x.id === 'UC-344'), 'stalled matches UC-344 via stall tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('stall')), {}).some(x => x.id === 'UC-344'), 'stall matches UC-344 via stall synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('卡住')), {}).some(x => x.id === 'UC-344'), '卡住 matches UC-344 via stall synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('停滯')), {}).some(x => x.id === 'UC-344'), '停滯 matches UC-344 via stall synonym');

// Search quality: grades, homework, assignment, 成績, 缺交作業
assert(api.filterEntries(entries, Array.from(api.tokenize('grades')), {}).some(x => x.id === 'UC-345'), 'grades matches UC-345 via grade tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('homework')), {}).some(x => x.id === 'UC-345'), 'homework matches UC-345 via homework synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('assignment')), {}).some(x => x.id === 'UC-345'), 'assignment matches UC-345 via assignment tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('成績')), {}).some(x => x.id === 'UC-345'), '成績 matches UC-345 via grade synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('缺交作業')), {}).some(x => x.id === 'UC-345'), '缺交作業 matches UC-345 via homework synonym');

// Search quality: smart tv, ambient display, 電視, 待機畫面
assert(api.filterEntries(entries, Array.from(api.tokenize('smart tv')), {}).some(x => x.id === 'UC-345'), 'smart tv matches UC-345 via tv tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('ambient display')), {}).some(x => x.id === 'UC-345'), 'ambient display matches UC-345 via ambient tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('待機畫面')), {}).some(x => x.id === 'UC-345'), '待機畫面 matches UC-345 via ambient synonym');

// Search quality: 向量搜尋, 向量搜索, vector search
assert(api.filterEntries(entries, Array.from(api.tokenize('向量搜尋')), {}).some(x => x.id === 'UC-042'), '向量搜尋 matches UC-042 via vector-search synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('向量搜索')), {}).some(x => x.id === 'UC-042'), '向量搜索 matches UC-042 via vector-search synonym');

// Search quality: 上下文視窗, 脈絡視窗, context window
assert(api.filterEntries(entries, Array.from(api.tokenize('上下文視窗')), {}).some(x => x.id === 'UC-066'), '上下文視窗 matches UC-066 via context-window synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('脈絡視窗')), {}).some(x => x.id === 'UC-066'), '脈絡視窗 matches UC-066 via context-window synonym');

// Search quality: 探活, liveness, heartbeat
assert(api.filterEntries(entries, Array.from(api.tokenize('探活')), {}).some(x => x.id === 'UC-049'), '探活 matches UC-049 via heartbeat synonym');

// Search quality: 注入攻擊, 提示詞攻擊, prompt injection
assert(api.filterEntries(entries, Array.from(api.tokenize('注入攻擊')), {}).some(x => x.id === 'UC-049'), '注入攻擊 matches UC-049 via prompt-injection synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('提示詞攻擊')), {}).some(x => x.id === 'UC-049'), '提示詞攻擊 matches UC-049 via prompt-injection synonym');

// Search quality: agentic
assert(api.filterEntries(entries, Array.from(api.tokenize('agentic')), {}).some(x => x.id === 'UC-001'), 'agentic matches UC-001 via agent synonym');

// Search quality: reservations, bookings, 訂位, 預約, 餐廳訂位, 預約餐廳, 電話訂位
assert(api.filterEntries(entries, Array.from(api.tokenize('reservations')), {}).some(x => x.id === 'UC-072'), 'reservations matches UC-072 via reservation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('bookings')), {}).some(x => x.id === 'UC-072'), 'bookings matches UC-072 via booking tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('餐廳訂位')), {}).some(x => x.id === 'UC-072'), '餐廳訂位 matches UC-072 via reservation synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('預約餐廳')), {}).some(x => x.id === 'UC-072'), '預約餐廳 matches UC-072 via reservation synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('電話訂位')), {}).some(x => x.id === 'UC-072'), '電話訂位 matches UC-072 via reservation synonym');

// Search quality: reflection, self-reflection, 反思, 自我反思, 自我反省
assert(api.filterEntries(entries, Array.from(api.tokenize('reflection')), {}).some(x => x.id === 'UC-325'), 'reflection matches UC-325 via reflection tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('self-reflection')), {}).some(x => x.id === 'UC-325'), 'self-reflection matches UC-325 via reflection tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('反思')), {}).some(x => x.id === 'UC-325'), '反思 matches UC-325 via reflection synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('自我反思')), {}).some(x => x.id === 'UC-325'), '自我反思 matches UC-325 via reflection synonym');

// Search quality: self-correction, self-healing, 自我修正, 自我修復, 自動修復, 自我檢查
assert(api.filterEntries(entries, Array.from(api.tokenize('self-correction')), {}).some(x => x.id === 'UC-018'), 'self-correction matches UC-018 via self-correction tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('self-healing')), {}).some(x => x.id === 'UC-018'), 'self-healing matches UC-018 via self-correction synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('自我修正')), {}).some(x => x.id === 'UC-018'), '自我修正 matches UC-018 via self-correction synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('自我修復')), {}).some(x => x.id === 'UC-018'), '自我修復 matches UC-018 via self-correction synonym');

// Search quality: coloring book, 著色本, 塗色本, 填色本, 著色畫, 兒童著色
assert(api.filterEntries(entries, Array.from(api.tokenize('coloring book')), {}).some(x => x.id === 'UC-342'), 'coloring book matches UC-342 via coloring tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('著色本')), {}).some(x => x.id === 'UC-342'), '著色本 matches UC-342 via coloring synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('塗色本')), {}).some(x => x.id === 'UC-342'), '塗色本 matches UC-342 via coloring synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('填色本')), {}).some(x => x.id === 'UC-342'), '填色本 matches UC-342 via coloring synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('著色畫')), {}).some(x => x.id === 'UC-342'), '著色畫 matches UC-342 via coloring synonym');

// Search quality: towing, tow truck, 拖吊, 拖車, 車輛拋錨, 汽車拋錨, 道路支援
assert(api.filterEntries(entries, Array.from(api.tokenize('towing')), {}).some(x => x.id === 'UC-343'), 'towing matches UC-343 via towing tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('tow truck')), {}).some(x => x.id === 'UC-343'), 'tow truck matches UC-343 via towing tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('拖吊')), {}).some(x => x.id === 'UC-343'), '拖吊 matches UC-343 via breakdown synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('拖車')), {}).some(x => x.id === 'UC-343'), '拖車 matches UC-343 via breakdown synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('車輛拋錨')), {}).some(x => x.id === 'UC-343'), '車輛拋錨 matches UC-343 via breakdown synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('汽車拋錨')), {}).some(x => x.id === 'UC-343'), '汽車拋錨 matches UC-343 via breakdown synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('道路支援')), {}).some(x => x.id === 'UC-343'), '道路支援 matches UC-343 via breakdown synonym');

// Search quality: 常亮螢幕, 常亮顯示, 常亮
assert(api.filterEntries(entries, Array.from(api.tokenize('常亮螢幕')), {}).some(x => x.id === 'UC-345'), '常亮螢幕 matches UC-345 via ambient synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('常亮顯示')), {}).some(x => x.id === 'UC-345'), '常亮顯示 matches UC-345 via ambient synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('常亮')), {}).some(x => x.id === 'UC-345'), '常亮 matches UC-345 via ambient synonym');

// Search quality: 作業缺交, 學業成績, 成績看板
assert(api.filterEntries(entries, Array.from(api.tokenize('作業缺交')), {}).some(x => x.id === 'UC-345'), '作業缺交 matches UC-345 via homework synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('學業成績')), {}).some(x => x.id === 'UC-345'), '學業成績 matches UC-345 via grade synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('成績看板')), {}).some(x => x.id === 'UC-345'), '成績看板 matches UC-345 via grade synonym');

// Search quality: token用量, token消耗, 額度消耗
assert(api.filterEntries(entries, Array.from(api.tokenize('token用量')), {}).some(x => x.id === 'UC-066'), 'token用量 matches UC-066 via usage synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('token消耗')), {}).some(x => x.id === 'UC-066'), 'token消耗 matches UC-066 via usage synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('額度消耗')), {}).some(x => x.id === 'UC-066'), '額度消耗 matches UC-066 via usage synonym');

// Search quality: wakeup, wake up, 叫醒, 喚醒
assert(api.filterEntries(entries, Array.from(api.tokenize('叫醒')), {}).some(x => x.id === 'UC-074'), '叫醒 matches UC-074 via wakeup synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('喚醒')), {}).some(x => x.id === 'UC-344'), '喚醒 matches UC-344 via wakeup synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('wake up')), {}).some(x => x.id === 'UC-344'), 'wake up matches UC-344 via wakeup tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('wakeup')), {}).some(x => x.id === 'UC-074'), 'wakeup matches UC-074 via wakeup tokenization');

// Search quality: coding agent, 程式代理, 代碼代理, claudecode, t3-code, t3code
assert(api.filterEntries(entries, Array.from(api.tokenize('coding agent')), {}).some(x => x.id === 'UC-344'), 'coding agent matches UC-344 via coding-agent tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('coding-agent')), {}).some(x => x.id === 'UC-344'), 'coding-agent matches UC-344 via coding-agent synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('代碼代理')), {}).some(x => x.id === 'UC-344'), '代碼代理 matches UC-344 via coding-agent synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('claudecode')), {}).some(x => x.id === 'UC-344'), 'claudecode matches UC-344 via claude code tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('t3-code')), {}).some(x => x.id === 'UC-344'), 't3-code matches UC-344 via t3 code tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('t3code')), {}).some(x => x.id === 'UC-344'), 't3code matches UC-344 via t3 code tokenization');

// Search quality: car rental, rental car, 租賃車, 租車
assert(api.filterEntries(entries, Array.from(api.tokenize('car rental')), {}).some(x => x.id === 'UC-343'), 'car rental matches UC-343 via car-rental tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('rental car')), {}).some(x => x.id === 'UC-343'), 'rental car matches UC-343 via car-rental tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('租賃車')), {}).some(x => x.id === 'UC-343'), '租賃車 matches UC-343 via car-rental synonym');

// Search quality: 保險表單, 救援表單
assert(api.filterEntries(entries, Array.from(api.tokenize('保險表單')), {}).some(x => x.id === 'UC-343'), '保險表單 matches UC-343 via compound tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('救援表單')), {}).some(x => x.id === 'UC-343'), '救援表單 matches UC-343 via compound tokenization');

// Search quality: 聊天議價, chat negotiation, 線上議價
assert(api.filterEntries(entries, Array.from(api.tokenize('聊天議價')), {}).some(x => x.id === 'UC-028'), '聊天議價 matches UC-028 via chat-negotiation synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('chat negotiation')), {}).some(x => x.id === 'UC-028'), 'chat negotiation matches UC-028 via chat-negotiation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('線上議價')), {}).some(x => x.id === 'UC-028'), '線上議價 matches UC-028 via chat-negotiation synonym');

// Search quality: 餐廳預約, 電話預約
assert(api.filterEntries(entries, Array.from(api.tokenize('餐廳預約')), {}).some(x => x.id === 'UC-072'), '餐廳預約 matches UC-072 via reservation synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('電話預約')), {}).some(x => x.id === 'UC-072'), '電話預約 matches UC-072 via reservation synonym');

// Search quality: 自動打印, autoprint, auto-print
assert(api.filterEntries(entries, Array.from(api.tokenize('自動打印')), {}).some(x => x.id === 'UC-342'), '自動打印 matches UC-342 via print synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('autoprint')), {}).some(x => x.id === 'UC-342'), 'autoprint matches UC-342 via auto-print tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('auto-print')), {}).some(x => x.id === 'UC-342'), 'auto-print matches UC-342 via auto-print tokenization');

// Search quality: open-source, 開源工具, 開源專案
assert(api.filterEntries(entries, Array.from(api.tokenize('open-source')), {}).some(x => x.id === 'UC-344'), 'open-source matches UC-344 via open-source tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('開源工具')), {}).some(x => x.id === 'UC-344'), '開源工具 matches UC-344 via open-source synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('開源專案')), {}).some(x => x.id === 'UC-344'), '開源專案 matches UC-344 via open-source synonym');

// Search quality: webhook通知, tv看板, 電視看板, bot模板, mcp伺服器, mcp servers
assert(api.filterEntries(entries, Array.from(api.tokenize('webhook通知')), {}).some(x => x.id === 'UC-344'), 'webhook通知 matches UC-344 via compound tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('tv看板')), {}).some(x => x.id === 'UC-345'), 'tv看板 matches UC-345 via compound tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('電視看板')), {}).some(x => x.id === 'UC-345'), '電視看板 matches UC-345 via compound tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('bot模板')), {}).some(x => x.id === 'UC-344'), 'bot模板 matches UC-344 via compound tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('mcp伺服器')), {}).some(x => x.id === 'UC-072'), 'mcp伺服器 matches UC-072 via compound tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('mcp servers')), {}).some(x => x.id === 'UC-072'), 'mcp servers matches UC-072 via server synonym');

// Search quality: adsb, ads-b, 飛機追蹤, 航班追蹤, 航空追蹤
assert(api.filterEntries(entries, Array.from(api.tokenize('adsb')), {}).some(x => x.id === 'UC-334'), 'adsb matches UC-334 via ads-b tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('ads-b')), {}).some(x => x.id === 'UC-334'), 'ads-b matches UC-334');
assert(api.filterEntries(entries, Array.from(api.tokenize('飛機追蹤')), {}).some(x => x.id === 'UC-334'), '飛機追蹤 matches UC-334 via ads-b synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('航班追蹤')), {}).some(x => x.id === 'UC-334'), '航班追蹤 matches UC-334 via ads-b synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('航空追蹤')), {}).some(x => x.id === 'UC-334'), '航空追蹤 matches UC-334 via ads-b synonym');

// Search quality: germany, german, autobahn, 公路救援
assert(api.filterEntries(entries, Array.from(api.tokenize('germany')), {}).some(x => x.id === 'UC-343'), 'germany matches UC-343 via german synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('german')), {}).some(x => x.id === 'UC-343'), 'german matches UC-343 via german synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('autobahn')), {}).some(x => x.id === 'UC-343'), 'autobahn matches UC-343 via highway synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('公路救援')), {}).some(x => x.id === 'UC-343'), '公路救援 matches UC-343 via roadside synonym');

// Search quality: android-tv, google-tv, google tv
assert(api.filterEntries(entries, Array.from(api.tokenize('android-tv')), {}).some(x => x.id === 'UC-345'), 'android-tv matches UC-345 via tv tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('google-tv')), {}).some(x => x.id === 'UC-345'), 'google-tv matches UC-345 via tv tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('google tv')), {}).some(x => x.id === 'UC-345'), 'google tv matches UC-345 via tv tokenization');

// Search quality: cloudflare-worker, cloudflare-workers, cf worker
assert(api.filterEntries(entries, Array.from(api.tokenize('cloudflare-worker')), {}).some(x => x.id === 'UC-345'), 'cloudflare-worker matches UC-345 via cf-worker tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('cloudflare-workers')), {}).some(x => x.id === 'UC-345'), 'cloudflare-workers matches UC-345 via cf-worker tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('cf worker')), {}).some(x => x.id === 'UC-345'), 'cf worker matches UC-345 via cf-worker synonym');

// Search quality: 工作階段, 工作會話
assert(api.filterEntries(entries, Array.from(api.tokenize('工作階段')), {}).some(x => x.id === 'UC-344'), '工作階段 matches UC-344 via session synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('工作會話')), {}).some(x => x.id === 'UC-344'), '工作會話 matches UC-344 via session synonym');

// Search quality: 總指揮, 指揮官, 指揮代理
assert(api.filterEntries(entries, Array.from(api.tokenize('總指揮')), {}).some(x => x.id === 'UC-344'), '總指揮 matches UC-344 via orchestrator synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('指揮官')), {}).some(x => x.id === 'UC-344'), '指揮官 matches UC-344 via orchestrator synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('指揮代理')), {}).some(x => x.id === 'UC-344'), '指揮代理 matches UC-344 via orchestrator synonym');

// Search quality: 駕駛工時, 司機工時, 工時核對, 派車單
assert(api.filterEntries(entries, Array.from(api.tokenize('駕駛工時')), {}).some(x => x.id === 'UC-338'), '駕駛工時 matches UC-338 via driver and timesheet tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('司機工時')), {}).some(x => x.id === 'UC-338'), '司機工時 matches UC-338 via driver and timesheet tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('工時核對')), {}).some(x => x.id === 'UC-338'), '工時核對 matches UC-338 via timesheet and reconciliation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('派車單')), {}).some(x => x.id === 'UC-338'), '派車單 matches UC-338 via timesheet synonym');

// Search quality: 任務封存
assert(api.filterEntries(entries, Array.from(api.tokenize('任務封存')), {}).some(x => x.id === 'UC-341'), '任務封存 matches UC-341 via task archive tokenization');

// Search quality: 開源組件, 開源套件
assert(api.filterEntries(entries, Array.from(api.tokenize('開源組件')), {}).some(x => x.id === 'UC-345'), '開源組件 matches UC-345 via open-source synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('開源套件')), {}).some(x => x.id === 'UC-344'), '開源套件 matches UC-344 via open-source synonym');

// Search quality: 同源案例, 候選重複, 重複來源
assert(api.filterEntries(entries, Array.from(api.tokenize('同源案例')), {}).some(x => x.id === 'UC-344'), '同源案例 matches UC-344 via dedup synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('候選重複')), {}).some(x => x.id === 'UC-344'), '候選重複 matches UC-344 via dedup synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('重複來源')), {}).some(x => x.id === 'UC-344'), '重複來源 matches UC-344 via dedup synonym');

// Search quality: clean tokenization without dangling hyphens
assert.deepEqual(Array.from(api.tokenize('idempotency-key')), ['idempotent', 'key'], 'idempotency-key tokenizes cleanly without dangling -key');

// Search quality: handheld, 掌上型, 手持終端, 掌上終端, 手持裝置
assert(api.filterEntries(entries, Array.from(api.tokenize('handheld')), {}).some(x => x.id === 'UC-336'), 'handheld matches UC-336 via handheld synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('掌上型')), {}).some(x => x.id === 'UC-336'), '掌上型 matches UC-336');
assert(api.filterEntries(entries, Array.from(api.tokenize('手持終端')), {}).some(x => x.id === 'UC-336'), '手持終端 matches UC-336 via handheld synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('掌上終端')), {}).some(x => x.id === 'UC-336'), '掌上終端 matches UC-336 via handheld synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('手持裝置')), {}).some(x => x.id === 'UC-336'), '手持裝置 matches UC-336 via handheld synonym');

// Search quality: 薪資單核對, 工資單核對, 薪資單對帳, 薪水核對, 工時核算
assert(api.filterEntries(entries, Array.from(api.tokenize('薪資單核對')), {}).some(x => x.id === 'UC-338'), '薪資單核對 matches UC-338 via paycheck tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('工資單核對')), {}).some(x => x.id === 'UC-338'), '工資單核對 matches UC-338 via paycheck tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('薪資單對帳')), {}).some(x => x.id === 'UC-338'), '薪資單對帳 matches UC-338 via paycheck tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('薪水核對')), {}).some(x => x.id === 'UC-338'), '薪水核對 matches UC-338 via paycheck tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('工時核算')), {}).some(x => x.id === 'UC-338'), '工時核算 matches UC-338 via timesheet tokenization');

// Search quality: 幼兒著色, 幼童著色, 著色線稿, 每日著色
assert(api.filterEntries(entries, Array.from(api.tokenize('幼兒著色')), {}).some(x => x.id === 'UC-342'), '幼兒著色 matches UC-342 via kids coloring tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('幼童著色')), {}).some(x => x.id === 'UC-342'), '幼童著色 matches UC-342 via kids coloring tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('著色線稿')), {}).some(x => x.id === 'UC-342'), '著色線稿 matches UC-342 via coloring tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('每日著色')), {}).some(x => x.id === 'UC-342'), '每日著色 matches UC-342 via daily coloring tokenization');

// Search quality: face-swap, 換臉, 人臉替換, 面部替換, 臉部替換, 照片換臉
assert(api.filterEntries(entries, Array.from(api.tokenize('face-swap')), {}).some(x => x.id === 'UC-337'), 'face-swap matches UC-337 via face-swap synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('人臉替換')), {}).some(x => x.id === 'UC-337'), '人臉替換 matches UC-337 via face-swap synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('面部替換')), {}).some(x => x.id === 'UC-337'), '面部替換 matches UC-337 via face-swap synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('臉部替換')), {}).some(x => x.id === 'UC-337'), '臉部替換 matches UC-337 via face-swap synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('照片換臉')), {}).some(x => x.id === 'UC-337'), '照片換臉 matches UC-337 via face-swap synonym');

// Search quality: 電話代撥, 代撥電話, 電話代打
assert(api.filterEntries(entries, Array.from(api.tokenize('電話代撥')), {}).some(x => x.id === 'UC-072'), '電話代撥 matches UC-072 via phone delegation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('代撥電話')), {}).some(x => x.id === 'UC-072'), '代撥電話 matches UC-072 via phone delegation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('電話代打')), {}).some(x => x.id === 'UC-072'), '電話代打 matches UC-072 via phone delegation tokenization');

// Search quality: 國外拋錨, 海外拋錨, 自駕拋錨, 租車拋錨
assert(api.filterEntries(entries, Array.from(api.tokenize('國外拋錨')), {}).some(x => x.id === 'UC-343'), '國外拋錨 matches UC-343 via breakdown tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('海外拋錨')), {}).some(x => x.id === 'UC-343'), '海外拋錨 matches UC-343 via breakdown tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('自駕拋錨')), {}).some(x => x.id === 'UC-343'), '自駕拋錨 matches UC-343 via breakdown tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('租車拋錨')), {}).some(x => x.id === 'UC-343'), '租車拋錨 matches UC-343 via breakdown tokenization');

// Search quality: 帳單抵免, 爭取抵免, 費用抵免
assert(api.filterEntries(entries, Array.from(api.tokenize('帳單抵免')), {}).some(x => x.id === 'UC-028'), '帳單抵免 matches UC-028 via credit tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('爭取抵免')), {}).some(x => x.id === 'UC-028'), '爭取抵免 matches UC-028 via credit tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('費用抵免')), {}).some(x => x.id === 'UC-028'), '費用抵免 matches UC-028 via credit tokenization');

// Search quality: 1090mhz, 民航機追蹤, 航空監視
assert(api.filterEntries(entries, Array.from(api.tokenize('1090mhz')), {}).some(x => x.id === 'UC-334'), '1090mhz matches UC-334 via frequency tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('民航機追蹤')), {}).some(x => x.id === 'UC-334'), '民航機追蹤 matches UC-334 via ads-b synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('航空監視')), {}).some(x => x.id === 'UC-334'), '航空監視 matches UC-334 via ads-b synonym');

// Search quality: 電視去廣告, 電視待機, 自製電視首頁, 待機首頁
assert(api.filterEntries(entries, Array.from(api.tokenize('電視去廣告')), {}).some(x => x.id === 'UC-345'), '電視去廣告 matches UC-345 via tv tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('電視待機')), {}).some(x => x.id === 'UC-345'), '電視待機 matches UC-345 via ambient tv tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('自製電視首頁')), {}).some(x => x.id === 'UC-345'), '自製電視首頁 matches UC-345 via custom tv home tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('待機首頁')), {}).some(x => x.id === 'UC-345'), '待機首頁 matches UC-345 via ambient home tokenization');

// Search quality: webhook叫醒, 程式代理通知
assert(api.filterEntries(entries, Array.from(api.tokenize('webhook叫醒')), {}).some(x => x.id === 'UC-344'), 'webhook叫醒 matches UC-344 via webhook wakeup tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('程式代理通知')), {}).some(x => x.id === 'UC-344'), '程式代理通知 matches UC-344 via agent notification tokenization');

// Search quality: 叫醒grok, 叫醒Grok Bot, 叫醒bot
assert(api.filterEntries(entries, Array.from(api.tokenize('叫醒Grok Bot')), {}).some(x => x.id === 'UC-344'), '叫醒Grok Bot matches UC-344 via wakeup grok tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('叫醒grok')), {}).some(x => x.id === 'UC-344'), '叫醒grok matches UC-344 via wakeup grok tokenization');

// Search quality: 工作階段停滯, 工作階段卡住
assert(api.filterEntries(entries, Array.from(api.tokenize('工作階段停滯')), {}).some(x => x.id === 'UC-344'), '工作階段停滯 matches UC-344 via session stall tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('工作階段卡住')), {}).some(x => x.id === 'UC-344'), '工作階段卡住 matches UC-344 via session stall tokenization');

// Search quality: 代訂餐廳, 代訂位, 餐廳代訂, 訂位代理
assert(api.filterEntries(entries, Array.from(api.tokenize('代訂餐廳')), {}).some(x => x.id === 'UC-072'), '代訂餐廳 matches UC-072 via reservation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('代訂位')), {}).some(x => x.id === 'UC-072'), '代訂位 matches UC-072 via reservation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('餐廳代訂')), {}).some(x => x.id === 'UC-072'), '餐廳代訂 matches UC-072 via reservation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('訂位代理')), {}).some(x => x.id === 'UC-072'), '訂位代理 matches UC-072 via reservation tokenization');

// Search quality: 智慧開關排障, 開關排障, 家電導入, 未支援設備
assert(api.filterEntries(entries, Array.from(api.tokenize('智慧開關排障')), {}).some(x => x.id === 'UC-330'), '智慧開關排障 matches UC-330 via switch troubleshooting tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('開關排障')), {}).some(x => x.id === 'UC-330'), '開關排障 matches UC-330 via switch troubleshooting tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('家電導入')), {}).some(x => x.id === 'UC-330'), '家電導入 matches UC-330 via device onboarding tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('未支援設備')), {}).some(x => x.id === 'UC-330'), '未支援設備 matches UC-330 via unsupported device tokenization');

// Search quality: sdr接收站, sdr接收機, sdr解碼, adsb接收機
assert(api.filterEntries(entries, Array.from(api.tokenize('sdr接收站')), {}).some(x => x.id === 'UC-334'), 'sdr接收站 matches UC-334 via sdr receiver station tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('sdr接收機')), {}).some(x => x.id === 'UC-334'), 'sdr接收機 matches UC-334 via sdr receiver tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('sdr解碼')), {}).some(x => x.id === 'UC-334'), 'sdr解碼 matches UC-334 via sdr decoding tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('adsb接收機')), {}).some(x => x.id === 'UC-334'), 'adsb接收機 matches UC-334 via ads-b receiver tokenization');

// Search quality: 小孩著色, 小孩著色頁
assert(api.filterEntries(entries, Array.from(api.tokenize('小孩著色')), {}).some(x => x.id === 'UC-342'), '小孩著色 matches UC-342 via kids coloring tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('小孩著色頁')), {}).some(x => x.id === 'UC-342'), '小孩著色頁 matches UC-342 via kids coloring page tokenization');

// Search quality: 工具實際回應, 工具回應分存, 分存驗收, 模型輸出分存
assert(api.filterEntries(entries, Array.from(api.tokenize('工具實際回應')), {}).some(x => x.id === 'UC-340'), '工具實際回應 matches UC-340 via tool response tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('工具回應分存')), {}).some(x => x.id === 'UC-340'), '工具回應分存 matches UC-340 via tool response storage tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('分存驗收')), {}).some(x => x.id === 'UC-340'), '分存驗收 matches UC-340 via storage acceptance tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('模型輸出分存')), {}).some(x => x.id === 'UC-340'), '模型輸出分存 matches UC-340 via model output storage tokenization');

// Search quality: 交辦任務, 舊交辦任務, 新交辦任務
assert(api.filterEntries(entries, Array.from(api.tokenize('交辦任務')), {}).some(x => x.id === 'UC-339' || x.id === 'UC-341'), '交辦任務 matches UC-339/UC-341 via request task tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('舊交辦任務')), {}).some(x => x.id === 'UC-339'), '舊交辦任務 matches UC-339 via stale request task tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('新交辦任務')), {}).some(x => x.id === 'UC-341'), '新交辦任務 matches UC-341 via request task tokenization');

// Search quality: 高速公路故障
assert(api.filterEntries(entries, Array.from(api.tokenize('高速公路故障')), {}).some(x => x.id === 'UC-343'), '高速公路故障 matches UC-343 via highway breakdown tokenization');

// Search quality: 參考照換臉, 隨機參考照
assert(api.filterEntries(entries, Array.from(api.tokenize('參考照換臉')), {}).some(x => x.id === 'UC-337'), '參考照換臉 matches UC-337 via reference photo face-swap tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('隨機參考照')), {}).some(x => x.id === 'UC-337'), '隨機參考照 matches UC-337 via random reference photo tokenization');

// Search quality: 掌上型圓屏, 圓屏裝置
assert(api.filterEntries(entries, Array.from(api.tokenize('掌上型圓屏')), {}).some(x => x.id === 'UC-336'), '掌上型圓屏 matches UC-336 via round screen handheld tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('圓屏裝置')), {}).some(x => x.id === 'UC-336'), '圓屏裝置 matches UC-336 via round screen device tokenization');

// Search quality: 排程關掉, 排程關回
assert(api.filterEntries(entries, Array.from(api.tokenize('排程關回')), {}).some(x => x.id === 'UC-335'), '排程關回 matches UC-335 via routine shutdown tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('排程關掉')), {}).some(x => x.id === 'UC-335'), '排程關掉 matches UC-335 via routine shutdown tokenization');

// Search quality: 執行狀態矛盾
assert(api.filterEntries(entries, Array.from(api.tokenize('執行狀態矛盾')), {}).some(x => x.id === 'UC-341'), '執行狀態矛盾 matches UC-341 via state contradiction tokenization');

// Search quality: UC-346 特斯拉出發充電, tesla充電技能, 出門前充電, 特斯拉長途出發
assert(api.filterEntries(entries, Array.from(api.tokenize('特斯拉出發充電')), {}).some(x => x.id === 'UC-346'), '特斯拉出發充電 matches UC-346 via tesla charge tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('tesla充電技能')), {}).some(x => x.id === 'UC-346'), 'tesla充電技能 matches UC-346 via tesla charge skill tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('出門前充電')), {}).some(x => x.id === 'UC-346'), '出門前充電 matches UC-346 via prep charge tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('特斯拉長途出發')), {}).some(x => x.id === 'UC-346'), '特斯拉長途出發 matches UC-346 via tesla roadtrip tokenization');

// Search quality: UC-347 youtube留言巡檢, 小孩頻道留言過濾, 留言安全審查, 惡意留言過濾
assert(api.filterEntries(entries, Array.from(api.tokenize('youtube留言巡檢')), {}).some(x => x.id === 'UC-347'), 'youtube留言巡檢 matches UC-347 via comment sweep tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('小孩頻道留言過濾')), {}).some(x => x.id === 'UC-347'), '小孩頻道留言過濾 matches UC-347 via channel comment filter tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('留言安全審查')), {}).some(x => x.id === 'UC-347'), '留言安全審查 matches UC-347 via comment safety review tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('惡意留言過濾')), {}).some(x => x.id === 'UC-347'), '惡意留言過濾 matches UC-347 via harmful comment filter tokenization');

// Search quality: UC-348 zillow買房過濾, 買房兩關過濾, 房源篩選房仲, 看房篩選
assert(api.filterEntries(entries, Array.from(api.tokenize('zillow買房過濾')), {}).some(x => x.id === 'UC-348'), 'zillow買房過濾 matches UC-348 via zillow home screening tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('買房兩關過濾')), {}).some(x => x.id === 'UC-348'), '買房兩關過濾 matches UC-348 via home search filter tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('房源篩選房仲')), {}).some(x => x.id === 'UC-348'), '房源篩選房仲 matches UC-348 via realtor disclosure tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('看房篩選')), {}).some(x => x.id === 'UC-348'), '看房篩選 matches UC-348 via home tour screening tokenization');

// Search quality: UC-349 詢問信台帳, dots詢問信, 詢問信草稿
assert(api.filterEntries(entries, Array.from(api.tokenize('詢問信台帳')), {}).some(x => x.id === 'UC-349'), '詢問信台帳 matches UC-349 via inquiry ledger tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('dots詢問信')), {}).some(x => x.id === 'UC-349'), 'dots詢問信 matches UC-349 via dots inquiry tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('詢問信草稿')), {}).some(x => x.id === 'UC-349'), '詢問信草稿 matches UC-349 via reply draft tokenization');

// Search quality: UC-350 主管晨報分工, 主管日報分工, 內網外部情報分工, 晨報分工
assert(api.filterEntries(entries, Array.from(api.tokenize('主管晨報分工')), {}).some(x => x.id === 'UC-350'), '主管晨報分工 matches UC-350 via manager morning digest tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('主管日報分工')), {}).some(x => x.id === 'UC-350'), '主管日報分工 matches UC-350 via manager daily digest tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('內網外部情報分工')), {}).some(x => x.id === 'UC-350'), '內網外部情報分工 matches UC-350 via intelligence split tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('晨報分工')), {}).some(x => x.id === 'UC-350'), '晨報分工 matches UC-350 via morning digest split tokenization');

// Search quality: UC-286 hetzner補貨, hetzner查貨, 雲主機補貨下單, 主機售完候補
assert(api.filterEntries(entries, Array.from(api.tokenize('hetzner補貨')), {}).some(x => x.id === 'UC-286'), 'hetzner補貨 matches UC-286 via server restock tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('hetzner查貨')), {}).some(x => x.id === 'UC-286'), 'hetzner查貨 matches UC-286 via server check tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('雲主機補貨下單')), {}).some(x => x.id === 'UC-286'), '雲主機補貨下單 matches UC-286 via server order tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('主機售完候補')), {}).some(x => x.id === 'UC-286'), '主機售完候補 matches UC-286 via soldout waitlist tokenization');

// Search quality: UC-072 電話訂位bot, clawcall電話訂位, clawcall訂位, 語音訂位
assert(api.filterEntries(entries, Array.from(api.tokenize('電話訂位bot')), {}).some(x => x.id === 'UC-072'), '電話訂位bot matches UC-072 via phone booking bot tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('clawcall電話訂位')), {}).some(x => x.id === 'UC-072'), 'clawcall電話訂位 matches UC-072 via clawcall tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('clawcall訂位')), {}).some(x => x.id === 'UC-072'), 'clawcall訂位 matches UC-072 via clawcall booking tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('語音訂位')), {}).some(x => x.id === 'UC-072'), '語音訂位 matches UC-072 via voice booking tokenization');

// Search quality: UC-028 t-mobile漲價, t-mobile抵免, siriusxm議價, 線上聊天議價
assert(api.filterEntries(entries, Array.from(api.tokenize('t-mobile漲價')), {}).some(x => x.id === 'UC-028'), 't-mobile漲價 matches UC-028 via price increase tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('t-mobile抵免')), {}).some(x => x.id === 'UC-028'), 't-mobile抵免 matches UC-028 via bill credit tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('siriusxm議價')), {}).some(x => x.id === 'UC-028'), 'siriusxm議價 matches UC-028 via negotiation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('線上聊天議價')), {}).some(x => x.id === 'UC-028'), '線上聊天議價 matches UC-028 via online chat negotiation tokenization');

// Search quality: UC-338 司機對薪資單, 月底對薪水, 工時算薪水
assert(api.filterEntries(entries, Array.from(api.tokenize('司機對薪資單')), {}).some(x => x.id === 'UC-338'), '司機對薪資單 matches UC-338 via driver paycheck reconciliation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('月底對薪水')), {}).some(x => x.id === 'UC-338'), '月底對薪水 matches UC-338 via paycheck check tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('工時算薪水')), {}).some(x => x.id === 'UC-338'), '工時算薪水 matches UC-338 via workhours salary calculation tokenization');

// Search quality: UC-339 過期任務重送, 待辦任務過期, 逾期任務重送
assert(api.filterEntries(entries, Array.from(api.tokenize('過期任務重送')), {}).some(x => x.id === 'UC-339'), '過期任務重送 matches UC-339 via stale task redelivery tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('待辦任務過期')), {}).some(x => x.id === 'UC-339'), '待辦任務過期 matches UC-339 via stale todo tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('逾期任務重送')), {}).some(x => x.id === 'UC-339'), '逾期任務重送 matches UC-339 via expired task redelivery tokenization');

// Search quality: UC-340 工具呼叫回應隔離, 回應隔離
assert(api.filterEntries(entries, Array.from(api.tokenize('工具呼叫回應隔離')), {}).some(x => x.id === 'UC-340'), '工具呼叫回應隔離 matches UC-340 via tool response quarantine tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('回應隔離')), {}).some(x => x.id === 'UC-340'), '回應隔離 matches UC-340 via response quarantine tokenization');

// Search quality: UC-341 封存任務衝突, 封存任務恢復
assert(api.filterEntries(entries, Array.from(api.tokenize('封存任務衝突')), {}).some(x => x.id === 'UC-341'), '封存任務衝突 matches UC-341 via archive task contradiction tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('封存任務恢復')), {}).some(x => x.id === 'UC-341'), '封存任務恢復 matches UC-341 via archive task restoration tokenization');

// Search quality: UC-342 每天早上列印, 黑白線稿列印, 城堡獨角獸線稿
assert(api.filterEntries(entries, Array.from(api.tokenize('每天早上列印')), {}).some(x => x.id === 'UC-342'), '每天早上列印 matches UC-342 via daily morning print tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('黑白線稿列印')), {}).some(x => x.id === 'UC-342'), '黑白線稿列印 matches UC-342 via line art print tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('城堡獨角獸線稿')), {}).some(x => x.id === 'UC-342'), '城堡獨角獸線稿 matches UC-342 via unicorn line art tokenization');

// Search quality: UC-343 國外拋錨求援, 德文語音聽不懂, 道路救援申請表
assert(api.filterEntries(entries, Array.from(api.tokenize('國外拋錨求援')), {}).some(x => x.id === 'UC-343'), '國外拋錨求援 matches UC-343 via breakdown assistance tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('德文語音聽不懂')), {}).some(x => x.id === 'UC-343'), '德文語音聽不懂 matches UC-343 via german language barrier tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('道路救援申請表')), {}).some(x => x.id === 'UC-343'), '道路救援申請表 matches UC-343 via roadside assistance form tokenization');

// Search quality: UC-344 45分鐘停滯, 程式代理跑完沒, claude code跑完, 程式代理卡住
assert(api.filterEntries(entries, Array.from(api.tokenize('45分鐘停滯')), {}).some(x => x.id === 'UC-344'), '45分鐘停滯 matches UC-344 via session stall tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('程式代理跑完沒')), {}).some(x => x.id === 'UC-344'), '程式代理跑完沒 matches UC-344 via coding agent completion tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('claude code跑完')), {}).some(x => x.id === 'UC-344'), 'claude code跑完 matches UC-344 via claude code completion tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('程式代理卡住')), {}).some(x => x.id === 'UC-344'), '程式代理卡住 matches UC-344 via coding agent stall tokenization');

// Search quality: UC-345 抓女兒成績, 學校缺交作業, 關掉電視廣告
assert(api.filterEntries(entries, Array.from(api.tokenize('抓女兒成績')), {}).some(x => x.id === 'UC-345'), '抓女兒成績 matches UC-345 via daughter grades tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('學校缺交作業')), {}).some(x => x.id === 'UC-345'), '學校缺交作業 matches UC-345 via missing homework tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('關掉電視廣告')), {}).some(x => x.id === 'UC-345'), '關掉電視廣告 matches UC-345 via tv ad disable tokenization');

// Search quality: UC-336 esp圓形螢幕, 語音終端中繼
assert(api.filterEntries(entries, Array.from(api.tokenize('esp圓形螢幕')), {}).some(x => x.id === 'UC-336'), 'esp圓形螢幕 matches UC-336 via esp round screen tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('語音終端中繼')), {}).some(x => x.id === 'UC-336'), '語音終端中繼 matches UC-336 via voice terminal relay tokenization');

// Search quality: UC-346 teslascope排程, 電動車充電排程, 特斯拉充滿自動還原
assert(api.filterEntries(entries, Array.from(api.tokenize('teslascope排程')), {}).some(x => x.id === 'UC-346'), 'teslascope排程 matches UC-346 via teslascope schedule tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('電動車充電排程')), {}).some(x => x.id === 'UC-346'), '電動車充電排程 matches UC-346 via EV charge schedule tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('特斯拉充滿自動還原')), {}).some(x => x.id === 'UC-346'), '特斯拉充滿自動還原 matches UC-346 via tesla charge auto-revert tokenization');

// Search quality: UC-347 檢查小孩留言, youtube怪人留言
assert(api.filterEntries(entries, Array.from(api.tokenize('檢查小孩留言')), {}).some(x => x.id === 'UC-347'), '檢查小孩留言 matches UC-347 via child comment review tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('youtube怪人留言')), {}).some(x => x.id === 'UC-347'), 'youtube怪人留言 matches UC-347 via stranger comment filter tokenization');

// Search quality: UC-348 買房通勤時間, 買房學區篩選, 交屋整修費用
assert(api.filterEntries(entries, Array.from(api.tokenize('買房通勤時間')), {}).some(x => x.id === 'UC-348'), '買房通勤時間 matches UC-348 via commute time screening tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('買房學區篩選')), {}).some(x => x.id === 'UC-348'), '買房學區篩選 matches UC-348 via school district screening tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('交屋整修費用')), {}).some(x => x.id === 'UC-348'), '交屋整修費用 matches UC-348 via renovation cost tokenization');

// Search quality: UC-349 dots日曆找空檔, 客戶來信約時間
assert(api.filterEntries(entries, Array.from(api.tokenize('dots日曆找空檔')), {}).some(x => x.id === 'UC-349'), 'dots日曆找空檔 matches UC-349 via calendar slot tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('客戶來信約時間')), {}).some(x => x.id === 'UC-349'), '客戶來信約時間 matches UC-349 via customer inquiry appointment tokenization');

// Search quality: UC-350 dots讀內部信件, grok bot收公開新聞
assert(api.filterEntries(entries, Array.from(api.tokenize('dots讀內部信件')), {}).some(x => x.id === 'UC-350'), 'dots讀內部信件 matches UC-350 via internal mail tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('grok bot收公開新聞')), {}).some(x => x.id === 'UC-350'), 'grok bot收公開新聞 matches UC-350 via public news harvest tokenization');

// Search quality: UC-342 每天早上吐出著色頁, 家裡印表機著色
assert(api.filterEntries(entries, Array.from(api.tokenize('每天早上吐出著色頁')), {}).some(x => x.id === 'UC-342'), '每天早上吐出著色頁 matches UC-342 via morning print tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('家裡印表機著色')), {}).some(x => x.id === 'UC-342'), '家裡印表機著色 matches UC-342 via home printer coloring tokenization');

// Search quality: UC-343 高速公路車子故障, 看不懂德文找救援, 海外自駕道路救援, 國外修車表單
assert(api.filterEntries(entries, Array.from(api.tokenize('高速公路車子故障')), {}).some(x => x.id === 'UC-343'), '高速公路車子故障 matches UC-343 via highway breakdown tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('看不懂德文找救援')), {}).some(x => x.id === 'UC-343'), '看不懂德文找救援 matches UC-343 via german language barrier tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('海外自駕道路救援')), {}).some(x => x.id === 'UC-343'), '海外自駕道路救援 matches UC-343 via roadside assistance tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('國外修車表單')), {}).some(x => x.id === 'UC-343'), '國外修車表單 matches UC-343 via foreign repair form tokenization');

// Search quality: UC-345 電視看女兒成績, 客廳電視成績看板
assert(api.filterEntries(entries, Array.from(api.tokenize('電視看女兒成績')), {}).some(x => x.id === 'UC-345'), '電視看女兒成績 matches UC-345 via tv daughter grades tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('客廳電視成績看板')), {}).some(x => x.id === 'UC-345'), '客廳電視成績看板 matches UC-345 via living room tv grade board tokenization');

// Search quality: UC-346 出發前充滿電自動還原
assert(api.filterEntries(entries, Array.from(api.tokenize('出發前充滿電自動還原')), {}).some(x => x.id === 'UC-346'), '出發前充滿電自動還原 matches UC-346 via charge revert tokenization');

// Search quality: UC-347 過濾小孩頻道怪人
assert(api.filterEntries(entries, Array.from(api.tokenize('過濾小孩頻道怪人')), {}).some(x => x.id === 'UC-347'), '過濾小孩頻道怪人 matches UC-347 via child channel comment sweep tokenization');

// Search quality: UC-348 zillow買房過濾交房仲, 調閱房屋揭露文件
assert(api.filterEntries(entries, Array.from(api.tokenize('zillow買房過濾交房仲')), {}).some(x => x.id === 'UC-348'), 'zillow買房過濾交房仲 matches UC-348 via realtor screening handoff tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('調閱房屋揭露文件')), {}).some(x => x.id === 'UC-348'), '調閱房屋揭露文件 matches UC-348 via disclosure handoff tokenization');

// Search quality: UC-349 詢問信寫入notion台帳, 查行事曆空檔草稿回信
assert(api.filterEntries(entries, Array.from(api.tokenize('詢問信寫入notion台帳')), {}).some(x => x.id === 'UC-349'), '詢問信寫入notion台帳 matches UC-349 via inquiry ledger tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('查行事曆空檔草稿回信')), {}).some(x => x.id === 'UC-349'), '查行事曆空檔草稿回信 matches UC-349 via calendar slot reply draft tokenization');

// Search quality: UC-350 主管晨報公開新聞分流, 內部信件交dots公開新聞交grok
assert(api.filterEntries(entries, Array.from(api.tokenize('主管晨報公開新聞分流')), {}).some(x => x.id === 'UC-350'), '主管晨報公開新聞分流 matches UC-350 via news triage tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('內部信件交dots公開新聞交grok')), {}).some(x => x.id === 'UC-350'), '內部信件交dots公開新聞交grok matches UC-350 via internal-public split tokenization');

// Search quality: UC-344 claude code卡住webhook
assert(api.filterEntries(entries, Array.from(api.tokenize('claude code卡住webhook')), {}).some(x => x.id === 'UC-344'), 'claude code卡住webhook matches UC-344 via session stall webhook tokenization');

// Search quality: UC-334 ads-b接收站雙頻輪收, 1090mhz天線量測
assert(api.filterEntries(entries, Array.from(api.tokenize('ads-b接收站雙頻輪收')), {}).some(x => x.id === 'UC-334'), 'ads-b接收站雙頻輪收 matches UC-334 via dual-band ads-b tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('1090mhz天線量測')), {}).some(x => x.id === 'UC-334'), '1090mhz天線量測 matches UC-334 via antenna measurement tokenization');

// Search quality: UC-335 手動開啟的排程被關掉
assert(api.filterEntries(entries, Array.from(api.tokenize('手動開啟的排程被關掉')), {}).some(x => x.id === 'UC-335'), '手動開啟的排程被關掉 matches UC-335 via manual routine disable tokenization');

// Search quality: UC-336 掌上型語音入口mcp
assert(api.filterEntries(entries, Array.from(api.tokenize('掌上型語音入口mcp')), {}).some(x => x.id === 'UC-336'), '掌上型語音入口mcp matches UC-336 via handheld voice terminal tokenization');

// Search quality: UC-337 每日隨機照片換臉
assert(api.filterEntries(entries, Array.from(api.tokenize('每日隨機照片換臉')), {}).some(x => x.id === 'UC-337'), '每日隨機照片換臉 matches UC-337 via daily random likeness swap tokenization');

// Search quality: UC-339 跨產品過期交辦重送
assert(api.filterEntries(entries, Array.from(api.tokenize('跨產品過期交辦重送')), {}).some(x => x.id === 'UC-339'), '跨產品過期交辦重送 matches UC-339 via stale instruction resend tokenization');

// Search quality: UC-330 智慧開關分層排障, 未支援設備配對成功不能動
assert(api.filterEntries(entries, Array.from(api.tokenize('智慧開關分層排障')), {}).some(x => x.id === 'UC-330'), '智慧開關分層排障 matches UC-330 via switch troubleshooting tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('未支援設備配對成功不能動')), {}).some(x => x.id === 'UC-330'), '未支援設備配對成功不能動 matches UC-330 via unsupported device pairing tokenization');

// Search quality: UC-331 網購未送達催退入帳
assert(api.filterEntries(entries, Array.from(api.tokenize('網購未送達催退入帳')), {}).some(x => x.id === 'UC-331'), '網購未送達催退入帳 matches UC-331 via unrefunded delivery tokenization');

// Search quality: UC-332 x發文前人工關卡
assert(api.filterEntries(entries, Array.from(api.tokenize('x發文前人工關卡')), {}).some(x => x.id === 'UC-332'), 'x發文前人工關卡 matches UC-332 via prepost human approval tokenization');

// Search quality: UC-333 notion跨代理外聯記憶
assert(api.filterEntries(entries, Array.from(api.tokenize('notion跨代理外聯記憶')), {}).some(x => x.id === 'UC-333'), 'notion跨代理外聯記憶 matches UC-333 via cross-agent external memory tokenization');

// Search quality regression tests: single words must not be over-eagerly converted by optional prefixes
// 1. 廣告 must match UC-022 and UC-183 (without requiring 電視)
assert(api.filterEntries(entries, Array.from(api.tokenize('廣告')), {}).some(x => x.id === 'UC-022'), '廣告 matches UC-022 without false tv prefix injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('廣告')), {}).some(x => x.id === 'UC-183'), '廣告 matches UC-183 without false tv prefix injection');
// 2. 表單 must match UC-102, UC-126, UC-145, UC-174, UC-318 (without requiring 救援)
assert(api.filterEntries(entries, Array.from(api.tokenize('表單')), {}).some(x => x.id === 'UC-102'), '表單 matches UC-102 without false rescue prefix injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('表單')), {}).some(x => x.id === 'UC-126'), '表單 matches UC-126 without false rescue prefix injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('表單')), {}).some(x => x.id === 'UC-145'), '表單 matches UC-145 without false rescue prefix injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('表單')), {}).some(x => x.id === 'UC-174'), '表單 matches UC-174 without false rescue prefix injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('表單')), {}).some(x => x.id === 'UC-318'), '表單 matches UC-318 without false rescue prefix injection');
// 3. 約時間 must match UC-059 (without requiring 客戶 or 來信)
assert(api.filterEntries(entries, Array.from(api.tokenize('整理詢價再約時間')), {}).some(x => x.id === 'UC-059'), '整理詢價再約時間 matches UC-059 without false client letter prefix injection');
// 4. 衝突 must match UC-230, UC-237, UC-240, UC-266 (without requiring 狀態)
assert(api.filterEntries(entries, Array.from(api.tokenize('衝突')), {}).some(x => x.id === 'UC-266'), '衝突 matches UC-266 without false state prefix injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('衝突')), {}).some(x => x.id === 'UC-230'), '衝突 matches UC-230 without false state prefix injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('衝突')), {}).some(x => x.id === 'UC-237'), '衝突 matches UC-237 without false state prefix injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('衝突')), {}).some(x => x.id === 'UC-240'), '衝突 matches UC-240 without false state prefix injection');
// 5. 印表機 must match UC-137, UC-181, and UC-342 (without requiring 家用 or 著色)
assert(api.filterEntries(entries, Array.from(api.tokenize('印表機')), {}).some(x => x.id === 'UC-137'), '印表機 matches UC-137 without false home/coloring prefix injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('印表機')), {}).some(x => x.id === 'UC-181'), '印表機 matches UC-181 without false home/coloring prefix injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('印表機')), {}).some(x => x.id === 'UC-342'), '印表機 matches UC-342');
assert(api.filterEntries(entries, Array.from(api.tokenize('家用印表機')), {}).some(x => x.id === 'UC-342'), '家用印表機 matches UC-342 via compound phrase');
// 6. 程式代理 must match UC-052, UC-310, and UC-344 (without requiring 工作階段 unless specified)
assert(api.filterEntries(entries, Array.from(api.tokenize('程式代理')), {}).some(x => x.id === 'UC-052'), '程式代理 matches UC-052 without false session injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('程式代理')), {}).some(x => x.id === 'UC-310'), '程式代理 matches UC-310 without false session injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('程式代理')), {}).some(x => x.id === 'UC-344'), '程式代理 matches UC-344');
assert(api.filterEntries(entries, Array.from(api.tokenize('程式代理卡住')), {}).some(x => x.id === 'UC-344'), '程式代理卡住 matches UC-344 via session stall');
// 7. 交辦 must match UC-127, UC-284, and UC-339 (without requiring 任務)
assert(api.filterEntries(entries, Array.from(api.tokenize('交辦')), {}).some(x => x.id === 'UC-127'), '交辦 matches UC-127 without false task injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('交辦')), {}).some(x => x.id === 'UC-284'), '交辦 matches UC-284 without false task injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('交辦')), {}).some(x => x.id === 'UC-339'), '交辦 matches UC-339');
// 8. 德文 must match UC-125, UC-161, and UC-343 (without requiring 語言)
assert(api.filterEntries(entries, Array.from(api.tokenize('德文')), {}).some(x => x.id === 'UC-125'), '德文 matches UC-125 without false language injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('德文')), {}).some(x => x.id === 'UC-161'), '德文 matches UC-161 without false language injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('德文')), {}).some(x => x.id === 'UC-343'), '德文 matches UC-343');
// 9. esp / esp32 must match UC-125 (without requiring 圓形 or 螢幕)
assert(api.filterEntries(entries, Array.from(api.tokenize('esp')), {}).some(x => x.id === 'UC-125'), 'esp matches UC-125 without false round screen injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('esp32')), {}).some(x => x.id === 'UC-125'), 'esp32 matches UC-125 without false round screen injection');
assert(api.filterEntries(entries, Array.from(api.tokenize('esp圓形螢幕')), {}).some(x => x.id === 'UC-336'), 'esp圓形螢幕 matches UC-336 via round screen terminal');
// 10. 特斯拉 / 電動車 queries
assert(api.filterEntries(entries, Array.from(api.tokenize('特斯拉')), {}).some(x => x.id === 'UC-346'), '特斯拉 matches UC-346 without requiring departure or charge');
assert(api.filterEntries(entries, Array.from(api.tokenize('電動車')), {}).some(x => x.id === 'UC-346'), '電動車 matches UC-346 without requiring charge or schedule');
// 11. 線稿 / 城堡 queries
assert(api.filterEntries(entries, Array.from(api.tokenize('線稿')), {}).some(x => x.id === 'UC-342'), '線稿 matches UC-342 without requiring black-white coloring');
assert.deepEqual(Array.from(api.tokenize('城堡')), ['城堡'], '城堡 does not false convert to unicorn line art');

// Search quality: UC-342 to UC-350 natural phrasing and Chinese connector recall tests
assert(api.filterEntries(entries, Array.from(api.tokenize('特斯拉出發前充飽電')), {}).some(x => x.id === 'UC-346'), '特斯拉出發前充飽電 matches UC-346 via road trip charging prep tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('tesla出門充電技能')), {}).some(x => x.id === 'UC-346'), 'tesla出門充電技能 matches UC-346 via tesla skill tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('電動車充到滿')), {}).some(x => x.id === 'UC-346'), '電動車充到滿 matches UC-346 via EV charge target tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('清理youtube垃圾留言')), {}).some(x => x.id === 'UC-347'), '清理youtube垃圾留言 matches UC-347 via comment sweep/audit tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('兒童頻道留言過濾')), {}).some(x => x.id === 'UC-347'), '兒童頻道留言過濾 matches UC-347 via child channel comment filter tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('房屋揭露文件交給房仲')), {}).some(x => x.id === 'UC-348'), '房屋揭露文件交給房仲 matches UC-348 via disclosure handoff tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('買房通勤時間與學區')), {}).some(x => x.id === 'UC-348'), '買房通勤時間與學區 matches UC-348 via connector-split tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('詢問信台帳與回信草稿')), {}).some(x => x.id === 'UC-349'), '詢問信台帳與回信草稿 matches UC-349 via inquiry ledger draft tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('日曆找空檔擬回信')), {}).some(x => x.id === 'UC-349'), '日曆找空檔擬回信 matches UC-349 via calendar slot reply tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('內部郵件與公開情報分流')), {}).some(x => x.id === 'UC-350'), '內部郵件與公開情報分流 matches UC-350 via email/info split tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('晨報分工notion日報')), {}).some(x => x.id === 'UC-350'), '晨報分工notion日報 matches UC-350 via morning report notion split tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('智慧電視常亮看板')), {}).some(x => x.id === 'UC-345'), '智慧電視常亮看板 matches UC-345 via ambient smart TV board tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('兒童塗色線稿')), {}).some(x => x.id === 'UC-342'), '兒童塗色線稿 matches UC-342 via child coloring line-art tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('聽不懂德文填救援申請表')), {}).some(x => x.id === 'UC-343'), '聽不懂德文填救援申請表 matches UC-343 via German breakdown assistance form tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('公路車子壞掉找拖吊')), {}).some(x => x.id === 'UC-343'), '公路車子壞掉找拖吊 matches UC-343 via highway towing assistance tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('超時未更新webhook通知')), {}).some(x => x.id === 'UC-344'), '超時未更新webhook通知 matches UC-344 via timeout webhook alert tokenization');

// Search quality: compound phrases without spaces and synonym recall (UC-342~350, UC-286)
assert(api.filterEntries(entries, Array.from(api.tokenize('每天印著色畫')), {}).some(x => x.id === 'UC-342'), '每天印著色畫 matches UC-342 via daily print coloring tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('印表機印線稿')), {}).some(x => x.id === 'UC-342'), '印表機印線稿 matches UC-342 via printer line art tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('印表機列印線稿')), {}).some(x => x.id === 'UC-342'), '印表機列印線稿 matches UC-342 via printer print line art tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('工作階段結束webhook')), {}).some(x => x.id === 'UC-344'), '工作階段結束webhook matches UC-344 via session completion webhook tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('常亮螢幕作業缺交')), {}).some(x => x.id === 'UC-345'), '常亮螢幕作業缺交 matches UC-345 via ambient display missing homework tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('常亮螢幕看女兒成績')), {}).some(x => x.id === 'UC-345'), '常亮螢幕看女兒成績 matches UC-345 via ambient display grade tracking tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('電視常亮看成績')), {}).some(x => x.id === 'UC-345'), '電視常亮看成績 matches UC-345 via ambient TV grades tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('電視顯示缺交作業')), {}).some(x => x.id === 'UC-345'), '電視顯示缺交作業 matches UC-345 via TV missing homework tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('出發前充電100%')), {}).some(x => x.id === 'UC-346'), '出發前充電100% matches UC-346 via road trip charging prep tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('出發前充電')), {}).some(x => x.id === 'UC-346'), '出發前充電 matches UC-346 via departure charge tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('出發充電')), {}).some(x => x.id === 'UC-346'), '出發充電 matches UC-346 via departure charge tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('長途出發充電')), {}).some(x => x.id === 'UC-346'), '長途出發充電 matches UC-346 via road trip charge tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('充電排程自動還原')), {}).some(x => x.id === 'UC-346'), '充電排程自動還原 matches UC-346 via charge schedule auto-revert tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('特斯拉長途準備技能')), {}).some(x => x.id === 'UC-346'), '特斯拉長途準備技能 matches UC-346 via tesla road trip prep skill tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('兒童頻道可疑留言過濾')), {}).some(x => x.id === 'UC-347'), '兒童頻道可疑留言過濾 matches UC-347 via child channel comment filter tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('買房篩選兩關過濾')), {}).some(x => x.id === 'UC-348'), '買房篩選兩關過濾 matches UC-348 via two-stage house search filter tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('詢問信登記台帳找行事曆空檔')), {}).some(x => x.id === 'UC-349'), '詢問信登記台帳找行事曆空檔 matches UC-349 via inquiry ledger calendar slot tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('客戶來信想約時間擬回信')), {}).some(x => x.id === 'UC-349'), '客戶來信想約時間擬回信 matches UC-349 via customer schedule inquiry reply tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('notion受理表回信草稿')), {}).some(x => x.id === 'UC-349'), 'notion受理表回信草稿 matches UC-349 via notion intake reply draft tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('notion受理表找空檔')), {}).some(x => x.id === 'UC-349'), 'notion受理表找空檔 matches UC-349 via notion intake calendar slot tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('hetzner主機售完候補下單')), {}).some(x => x.id === 'UC-286'), 'hetzner主機售完候補下單 matches UC-286 via server sold-out purchase tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('雲主機售完每30分鐘查貨')), {}).some(x => x.id === 'UC-286'), '雲主機售完每30分鐘查貨 matches UC-286 via cloud server periodic vacancy check tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('售完每30分鐘查貨')), {}).some(x => x.id === 'UC-286'), '售完每30分鐘查貨 matches UC-286 via sold-out periodic check tokenization');

// Commute regression tests (fixing over-eager commute tokenization)
assert(api.filterEntries(entries, Array.from(api.tokenize('通勤')), {}).some(x => x.id === 'UC-087'), '通勤 matches UC-087 via commute synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('通勤')), {}).some(x => x.id === 'UC-272'), '通勤 matches UC-272 via commute synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('通勤')), {}).some(x => x.id === 'UC-348'), '通勤 matches UC-348 via commute synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('通勤')), {}).some(x => x.id === 'UC-352'), '通勤 matches UC-352 via commute synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('尖峰通勤')), {}).some(x => x.id === 'UC-348'), '尖峰通勤 matches UC-348 via peak commute tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('買房通勤時間與學區')), {}).some(x => x.id === 'UC-348'), '買房通勤時間與學區 still matches UC-348');

// UC-351 search quality: dispatch only, heavy lifting to free/low-cost model agents
assert(api.filterEntries(entries, Array.from(api.tokenize('免費模型代理')), {}).some(x => x.id === 'UC-351'), '免費模型代理 matches UC-351 via free model agent tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('調度重活免費模型')), {}).some(x => x.id === 'UC-351'), '調度重活免費模型 matches UC-351 via dispatch heavy work tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('只負責調度')), {}).some(x => x.id === 'UC-351'), '只負責調度 matches UC-351 via dispatch-only tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('分層派工')), {}).some(x => x.id === 'UC-351'), '分層派工 matches UC-351 via tiered dispatch tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('外部代理保底')), {}).some(x => x.id === 'UC-351'), '外部代理保底 matches UC-351 via external agent fallback tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('重活交給雲端電腦')), {}).some(x => x.id === 'UC-351'), '重活交給雲端電腦 matches UC-351 via heavy work offload tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('opencode免費模型')), {}).some(x => x.id === 'UC-351'), 'opencode免費模型 matches UC-351 via Latin-CJK boundary tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('deepseek付費保底')), {}).some(x => x.id === 'UC-351'), 'deepseek付費保底 matches UC-351 via Latin-CJK boundary tokenization');

// UC-352 search quality: daily flomo memo insight push rotating template
assert(api.filterEntries(entries, Array.from(api.tokenize('讀你的flomo筆記')), {}).some(x => x.id === 'UC-352'), '讀你的flomo筆記 matches UC-352 via read flomo notes tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('flomo筆記')), {}).some(x => x.id === 'UC-352'), 'flomo筆記 matches UC-352 via Latin-CJK boundary tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('舊筆記回顧')), {}).some(x => x.id === 'UC-352'), '舊筆記回顧 matches UC-352 via past notes retrospective tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('洞察角度推送')), {}).some(x => x.id === 'UC-352'), '洞察角度推送 matches UC-352 via insight perspective push tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('洞察模板輪換')), {}).some(x => x.id === 'UC-352'), '洞察模板輪換 matches UC-352 via insight template rotation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('通勤地鐵上讀筆記')), {}).some(x => x.id === 'UC-352'), '通勤地鐵上讀筆記 matches UC-352 via subway reading tokenization');

// UC-037 search quality: rock climbing shoes price comparison & import tax
assert(api.filterEntries(entries, Array.from(api.tokenize('義大利攀岩鞋')), {}).some(x => x.id === 'UC-037'), '義大利攀岩鞋 matches UC-037 via Italian climbing shoes tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('攀岩鞋比價')), {}).some(x => x.id === 'UC-037'), '攀岩鞋比價 matches UC-037 via climbing shoes price compare tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('攀岩鞋特價')), {}).some(x => x.id === 'UC-037'), '攀岩鞋特價 matches UC-037 via climbing shoes discount tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('攀岩鞋進口稅')), {}).some(x => x.id === 'UC-037'), '攀岩鞋進口稅 matches UC-037 via climbing shoes customs tariff tokenization');

// UC-054 search quality: rap music video and VPN TUN mode
assert(api.filterEntries(entries, Array.from(api.tokenize('饒舌講解影片')), {}).some(x => x.id === 'UC-054'), '饒舌講解影片 matches UC-054 via rap video tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('押韻歌詞樣片')), {}).some(x => x.id === 'UC-054'), '押韻歌詞樣片 matches UC-054 via rhyming lyrics demo tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('tun模式')), {}).some(x => x.id === 'UC-054'), 'tun模式 matches UC-054 via Latin-CJK boundary tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('vpn tun模式')), {}).some(x => x.id === 'UC-054'), 'vpn tun模式 matches UC-054 via VPN TUN mode tokenization');

// UC-066 search quality: usage CSV analysis and wrap-up token audit
assert(api.filterEntries(entries, Array.from(api.tokenize('用量csv分析')), {}).some(x => x.id === 'UC-066'), '用量csv分析 matches UC-066 via usage CSV tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('用量事件表')), {}).some(x => x.id === 'UC-066'), '用量事件表 matches UC-066 via usage event ledger tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('收尾回報用量')), {}).some(x => x.id === 'UC-066'), '收尾回報用量 matches UC-066 via wrap-up reporting tokenization');

// UC-076 search quality: recycled phone number previous owner & data broker
assert(api.filterEntries(entries, Array.from(api.tokenize('回收門號')), {}).some(x => x.id === 'UC-076'), '回收門號 matches UC-076 via recycled number synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('回收門號前持有人')), {}).some(x => x.id === 'UC-076'), '回收門號前持有人 matches UC-076 via previous owner tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('門號仲介站列名')), {}).some(x => x.id === 'UC-076'), '門號仲介站列名 matches UC-076 via data broker listing tokenization');
// Natural phrasing search quality assertions across UC-342 to UC-352, UC-037, UC-076, UC-286
assert(api.filterEntries(entries, Array.from(api.tokenize('每天印著色頁給小孩')), {}).some(x => x.id === 'UC-342'), '每天印著色頁給小孩 matches UC-342 via preposition and child tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('印黑白線稿給孩子')), {}).some(x => x.id === 'UC-342'), '印黑白線稿給孩子 matches UC-342 via line art child tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('國外車輛拋錨保險表單')), {}).some(x => x.id === 'UC-343'), '國外車輛拋錨保險表單 matches UC-343 via breakdown insurance form tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('自駕車子拋錨拖吊求援')), {}).some(x => x.id === 'UC-343'), '自駕車子拋錨拖吊求援 matches UC-343 via road trip breakdown towing tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('電視看板看女兒成績')), {}).some(x => x.id === 'UC-345'), '電視看板看女兒成績 matches UC-345 via TV ambient board grades tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('客廳常亮螢幕查看成績與缺交作業')), {}).some(x => x.id === 'UC-345'), '客廳常亮螢幕查看成績與缺交作業 matches UC-345 via ambient display homework tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('特斯拉充到100%')), {}).some(x => x.id === 'UC-346'), '特斯拉充到100% matches UC-346 via 100% charge tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('出門前電動車充電自動還原')), {}).some(x => x.id === 'UC-346'), '出門前電動車充電自動還原 matches UC-346 via pre-departure EV charging auto-revert tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('teslascope長途準備')), {}).some(x => x.id === 'UC-346'), 'teslascope長途準備 matches UC-346 via road trip prep tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('買房預算學區過濾')), {}).some(x => x.id === 'UC-348'), '買房預算學區過濾 matches UC-348 via house budget school filter tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('交屋整修費用預估')), {}).some(x => x.id === 'UC-348'), '交屋整修費用預估 matches UC-348 via renovation cost estimate tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('notion受理表找空檔存回信草稿')), {}).some(x => x.id === 'UC-349'), 'notion受理表找空檔存回信草稿 matches UC-349 via intake calendar draft tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('客戶來信約時間存gmail草稿')), {}).some(x => x.id === 'UC-349'), '客戶來信約時間存gmail草稿 matches UC-349 via customer schedule inquiry draft tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('內部資料與公開資料分流晨報')), {}).some(x => x.id === 'UC-350'), '內部資料與公開資料分流晨報 matches UC-350 via internal public split morning brief tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('額度燒太快調度免費模型')), {}).some(x => x.id === 'UC-351'), '額度燒太快調度免費模型 matches UC-351 via quota burn free model dispatch tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('分層派工免費模型做重活')), {}).some(x => x.id === 'UC-351'), '分層派工免費模型做重活 matches UC-351 via tiered dispatch heavy work tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('每天讀flomo舊筆記推送回顧')), {}).some(x => x.id === 'UC-352'), '每天讀flomo舊筆記推送回顧 matches UC-352 via daily memo review push tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('義大利特價攀岩鞋省50美元')), {}).some(x => x.id === 'UC-037'), '義大利特價攀岩鞋省50美元 matches UC-037 via discount climbing shoes tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('回收門號收到前持有人簡訊')), {}).some(x => x.id === 'UC-076'), '回收門號收到前持有人簡訊 matches UC-076 via recycled number previous owner SMS tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('hetzner售完自動下單')), {}).some(x => x.id === 'UC-286'), 'hetzner售完自動下單 matches UC-286 via sold out auto purchase tokenization');

// A/B testing, restart, conjunction splitting & natural phrase search quality across UC-329, UC-334, UC-335, UC-338, UC-340, UC-341, UC-345, UC-347, UC-349, UC-350, UC-351, UC-352
assert(api.filterEntries(entries, Array.from(api.tokenize('多代理對話鏈重新啟動')), {}).some(x => x.id === 'UC-329'), '多代理對話鏈重新啟動 matches UC-329 via restart synonym and tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('restart')), {}).some(x => x.id === 'UC-329'), 'restart matches UC-329 via 重啟 synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('重啟')), {}).some(x => x.id === 'UC-329'), '重啟 matches UC-329 via restart synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('sdr天線ab測試')), {}).some(x => x.id === 'UC-334'), 'sdr天線ab測試 matches UC-334 via A/B test synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('ab-test')), {}).some(x => x.id === 'UC-334'), 'ab-test matches UC-334 via A/B test synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('adsb接收站前後對照')), {}).some(x => x.id === 'UC-334'), 'adsb接收站前後對照 matches UC-334 via before-after comparison tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('排程被舊指示停用')), {}).some(x => x.id === 'UC-335'), '排程被舊指示停用 matches UC-335 via stale instruction disable tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('手動開啟的排程被關掉')), {}).some(x => x.id === 'UC-335'), '手動開啟的排程被關掉 matches UC-335 via manual routine revert tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('卡車司機工時與薪資單對帳')), {}).some(x => x.id === 'UC-338'), '卡車司機工時與薪資單對帳 matches UC-338 via truck driver hours and conjunction tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('模型輸出分開儲存驗收')), {}).some(x => x.id === 'UC-340'), '模型輸出分開儲存驗收 matches UC-340 via model output separate storage acceptance tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('已封存任務被重新啟動')), {}).some(x => x.id === 'UC-341'), '已封存任務被重新啟動 matches UC-341 via archived task restart tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('客廳螢幕顯示女兒成績')), {}).some(x => x.id === 'UC-345'), '客廳螢幕顯示女兒成績 matches UC-345 via living room ambient screen grades tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('兒童影片可疑留言審查')), {}).some(x => x.id === 'UC-347'), '兒童影片可疑留言審查 matches UC-347 via child video suspicious comment review tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('詢問信受理表')), {}).some(x => x.id === 'UC-349'), '詢問信受理表 matches UC-349 via inquiry intake ledger tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('客戶來信存回信草稿')), {}).some(x => x.id === 'UC-349'), '客戶來信存回信草稿 matches UC-349 via customer email reply draft tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('主管晨報分流處理')), {}).some(x => x.id === 'UC-350'), '主管晨報分流處理 matches UC-350 via manager morning brief split tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('雲端電腦跑opencode')), {}).some(x => x.id === 'UC-351'), '雲端電腦跑opencode matches UC-351 via cloud computer run opencode tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('flomo筆記洞察')), {}).some(x => x.id === 'UC-352'), 'flomo筆記洞察 matches UC-352 via flomo memo insight tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('每日筆記回顧')), {}).some(x => x.id === 'UC-352'), '每日筆記回顧 matches UC-352 via daily memo review tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('每日筆記回顧模板輪換')), {}).some(x => x.id === 'UC-352'), '每日筆記回顧模板輪換 matches UC-352 via daily memo review rotating template tokenization');

// Network connection errors, music generation, tariff, anti-scraping, usage analysis & recent case search quality across UC-037, UC-054, UC-066, UC-076, UC-343, UC-345, UC-348, UC-349, UC-350, UC-352
assert(api.filterEntries(entries, Array.from(api.tokenize('vpn連線排障')), {}).some(x => x.id === 'UC-054'), 'vpn連線排障 matches UC-054 via VPN connection error synonym and tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('連線被拒')), {}).some(x => x.id === 'UC-054'), '連線被拒 matches UC-054 via connection-error synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('suno生成音樂')), {}).some(x => x.id === 'UC-054'), 'suno生成音樂 matches UC-054 via music generation synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('音樂生成')), {}).some(x => x.id === 'UC-054'), '音樂生成 matches UC-054 via music generation synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('義大利特價')), {}).some(x => x.id === 'UC-037'), '義大利特價 matches UC-037 via Italian discount tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('進口關稅')), {}).some(x => x.id === 'UC-037'), '進口關稅 matches UC-037 via tariff synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('前號主簡訊')), {}).some(x => x.id === 'UC-076'), '前號主簡訊 matches UC-076 via previous owner synonym and tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('原號主')), {}).some(x => x.id === 'UC-076'), '原號主 matches UC-076 via previous owner synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('爬蟲被擋')), {}).some(x => x.id === 'UC-076'), '爬蟲被擋 matches UC-076 via anti-scraping synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('反爬蟲')), {}).some(x => x.id === 'UC-076'), '反爬蟲 matches UC-076 via anti-scraping synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('主bot分析用量')), {}).some(x => x.id === 'UC-066'), '主bot分析用量 matches UC-066 via usage analysis tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('長對話撞上限')), {}).some(x => x.id === 'UC-066'), '長對話撞上限 matches UC-066 via context-window limit tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('精簡排程')), {}).some(x => x.id === 'UC-066'), '精簡排程 matches UC-066 via routine simplification tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('沒變化不送')), {}).some(x => x.id === 'UC-066'), '沒變化不送 matches UC-066 via no-change no-send tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('flomo每日洞察')), {}).some(x => x.id === 'UC-352'), 'flomo每日洞察 matches UC-352 via memo daily insight tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('flomo筆記輪換')), {}).some(x => x.id === 'UC-352'), 'flomo筆記輪換 matches UC-352 via memo rotating template tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('道路救援德文表單')), {}).some(x => x.id === 'UC-343'), '道路救援德文表單 matches UC-343 via German roadside assistance form tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('買房找房仲調揭露')), {}).some(x => x.id === 'UC-348'), '買房找房仲調揭露 matches UC-348 via realtor disclosure handoff tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('notion受理表存回信草稿')), {}).some(x => x.id === 'UC-349'), 'notion受理表存回信草稿 matches UC-349 via inquiry intake reply draft tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('詢問信找空檔回信')), {}).some(x => x.id === 'UC-349'), '詢問信找空檔回信 matches UC-349 via inquiry find slot reply tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('主管晨報內外情報分流')), {}).some(x => x.id === 'UC-350'), '主管晨報內外情報分流 matches UC-350 via internal public intelligence triage tokenization');

// Housing, author, security, task lifecycle, kids coloring, roadside assistance, tv ambient board, ev charge, inquiry ledger, data triage & model offload search quality across UC-037, UC-054, UC-066, UC-076, UC-340, UC-341, UC-342, UC-343, UC-345, UC-346, UC-347, UC-348, UC-349, UC-350, UC-351, UC-352
assert(api.filterEntries(entries, Array.from(api.tokenize('俄文作者')), {}).some(x => x.id === 'UC-340'), '俄文作者 matches UC-340 via author language tokenization and synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('新交辦啟動已封存')), {}).some(x => x.id === 'UC-341'), '新交辦啟動已封存 matches UC-341 via task start archived tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('封存任務啟動')), {}).some(x => x.id === 'UC-341'), '封存任務啟動 matches UC-341 via archived task start tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('小孩早上印著色頁')), {}).some(x => x.id === 'UC-342'), '小孩早上印著色頁 matches UC-342 via kid morning print coloring page tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('德文保險救援表單')), {}).some(x => x.id === 'UC-343'), '德文保險救援表單 matches UC-343 via German insurance assistance form tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('高速公路拋錨找拖吊')), {}).some(x => x.id === 'UC-343'), '高速公路拋錨找拖吊 matches UC-343 via highway breakdown towing tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('海外修車申請表')), {}).some(x => x.id === 'UC-343'), '海外修車申請表 matches UC-343 via car repair form tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('電視首頁查作業')), {}).some(x => x.id === 'UC-345'), '電視首頁查作業 matches UC-345 via TV home homework check tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('女兒各科成績看板')), {}).some(x => x.id === 'UC-345'), '女兒各科成績看板 matches UC-345 via grades board tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('電車出門前充飽')), {}).some(x => x.id === 'UC-346'), '電車出門前充飽 matches UC-346 via EV departure charge tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('youtube留言安全性審查')), {}).some(x => x.id === 'UC-347'), 'youtube留言安全性審查 matches UC-347 via YouTube comment safety review tokenization and security synonym');
assert(api.filterEntries(entries, Array.from(api.tokenize('房屋整修費用')), {}).some(x => x.id === 'UC-348'), '房屋整修費用 matches UC-348 via housing synonym and renovation fee tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('房屋整修費用預估')), {}).some(x => x.id === 'UC-348'), '房屋整修費用預估 matches UC-348 via renovation cost estimate tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('買房找物件')), {}).some(x => x.id === 'UC-348'), '買房找物件 matches UC-348 via home search property tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('詢問信記進notion受理表')), {}).some(x => x.id === 'UC-349'), '詢問信記進notion受理表 matches UC-349 via inquiry intake ledger tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('資料分級晨報')), {}).some(x => x.id === 'UC-350'), '資料分級晨報 matches UC-350 via data classification morning digest tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('pi agent deepseek備援保底')), {}).some(x => x.id === 'UC-351'), 'pi agent deepseek備援保底 matches UC-351 via fallback model tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('分層派工省額度')), {}).some(x => x.id === 'UC-351'), '分層派工省額度 matches UC-351 via tiered dispatch quota tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('筆記反思對話')), {}).some(x => x.id === 'UC-352'), '筆記反思對話 matches UC-352 via memo reflection dialogue tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('含進口稅海外比價')), {}).some(x => x.id === 'UC-037'), '含進口稅海外比價 matches UC-037 via import tariff price comparison tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('vpn連線錯誤排障')), {}).some(x => x.id === 'UC-054'), 'vpn連線錯誤排障 matches UC-054 via VPN connection error troubleshooting tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('usage csv匯出給主bot分析')), {}).some(x => x.id === 'UC-066'), 'usage csv匯出給主bot分析 matches UC-066 via usage export bot analysis tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('仲介站列名被擋')), {}).some(x => x.id === 'UC-076'), '仲介站列名被擋 matches UC-076 via broker listing anti-scraping tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('幼兒著色頁自動印')), {}).some(x => x.id === 'UC-342'), '幼兒著色頁自動印 matches UC-342 via auto print synonym and coloring tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('每天定時列印著色畫')), {}).some(x => x.id === 'UC-342'), '每天定時列印著色畫 matches UC-342 via routine print coloring tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('小朋友粗線條著色畫')), {}).some(x => x.id === 'UC-342'), '小朋友粗線條著色畫 matches UC-342 via kids thick line coloring tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('每天早上印兩張填色本')), {}).some(x => x.id === 'UC-342'), '每天早上印兩張填色本 matches UC-342 via quantifier coloring book tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('小朋友頻道留言安全性')), {}).some(x => x.id === 'UC-347'), '小朋友頻道留言安全性 matches UC-347 via kids channel comment safety tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('買房篩選交接給房仲')), {}).some(x => x.id === 'UC-348'), '買房篩選交接給房仲 matches UC-348 via realtor handoff tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('找房仲調屋況說明書')), {}).some(x => x.id === 'UC-348'), '找房仲調屋況說明書 matches UC-348 via disclosure synonym and realtor tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('買房篩選下班通勤與好學區')), {}).some(x => x.id === 'UC-348'), '買房篩選下班通勤與好學區 matches UC-348 via conjunction boundary splitting and school district tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('翻新費用預算上限')), {}).some(x => x.id === 'UC-348'), '翻新費用預算上限 matches UC-348 via renovation budget limit tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('詢問信自動記進notion受理表')), {}).some(x => x.id === 'UC-349'), '詢問信自動記進notion受理表 matches UC-349 via inquiry auto intake tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('諮詢信登錄台帳擬回信草稿')), {}).some(x => x.id === 'UC-349'), '諮詢信登錄台帳擬回信草稿 matches UC-349 via inquiry ledger draft tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('dots詢問信日曆草稿')), {}).some(x => x.id === 'UC-349'), 'dots詢問信日曆草稿 matches UC-349 via dots inquiry calendar draft tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('dots讀內部行程grokbot抓新聞')), {}).some(x => x.id === 'UC-350'), 'dots讀內部行程grokbot抓新聞 matches UC-350 via internal calendar public news split tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('每天早上推一則舊筆記反思')), {}).some(x => x.id === 'UC-352'), '每天早上推一則舊筆記反思 matches UC-352 via morning memo insight push tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('sdr接收機雙頻解碼')), {}).some(x => x.id === 'UC-334'), 'sdr接收機雙頻解碼 matches UC-334 via dual-band decoder tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('雙頻輪收天線量測')), {}).some(x => x.id === 'UC-334'), '雙頻輪收天線量測 matches UC-334 via dual-band antenna measurement tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('手動重開排程被關閉')), {}).some(x => x.id === 'UC-335'), '手動重開排程被關閉 matches UC-335 via manual routine re-enable tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('掌上型終端語音助手')), {}).some(x => x.id === 'UC-336'), '掌上型終端語音助手 matches UC-336 via handheld terminal voice assistant tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('每天隨機挑照片換臉')), {}).some(x => x.id === 'UC-337'), '每天隨機挑照片換臉 matches UC-337 via daily random photo face-swap tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('卡車司機工時表對帳')), {}).some(x => x.id === 'UC-338'), '卡車司機工時表對帳 matches UC-338 via driver timesheet reconciliation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('出勤紀錄對發薪日薪水')), {}).some(x => x.id === 'UC-338'), '出勤紀錄對發薪日薪水 matches UC-338 via attendance payroll tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('跨系統過時交辦重送')), {}).some(x => x.id === 'UC-339'), '跨系統過時交辦重送 matches UC-339 via stale cross system request tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('已封存任務被重新拉起')), {}).some(x => x.id === 'UC-341'), '已封存任務被重新拉起 matches UC-341 via archived task restart synonym and tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('新授權交辦啟動封存工作')), {}).some(x => x.id === 'UC-341'), '新授權交辦啟動封存工作 matches UC-341 via authorized request archived task start tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('私有git任務檔交接')), {}).some(x => x.id === 'UC-353'), '私有git任務檔交接 matches UC-353 via private git task relay tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('雲端不對本機下命令')), {}).some(x => x.id === 'UC-353'), '雲端不對本機下命令 matches UC-353 via cloud to local command boundary tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('私有倉庫放任務單')), {}).some(x => x.id === 'UC-353'), '私有倉庫放任務單 matches UC-353 via private repo task queue tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('不讓雲端控制電腦')), {}).some(x => x.id === 'UC-353'), '不讓雲端控制電腦 matches UC-353 via prevent remote control tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('mac launchd計時器拉取任務')), {}).some(x => x.id === 'UC-353'), 'mac launchd計時器拉取任務 matches UC-353 via launchd timer pull tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('跨代理任務交接權限隔離')), {}).some(x => x.id === 'UC-353'), '跨代理任務交接權限隔離 matches UC-353 via cross-agent task handoff isolation tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('agent relay私有倉庫')), {}).some(x => x.id === 'UC-353'), 'agent relay私有倉庫 matches UC-353 via agent relay private repo tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('每天從書籤挑點子做demo')), {}).some(x => x.id === 'UC-354'), '每天從書籤挑點子做demo matches UC-354 via bookmark idea demo tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('書籤做成互動網頁小實驗')), {}).some(x => x.id === 'UC-354'), '書籤做成互動網頁小實驗 matches UC-354 via bookmark interactive web experiment tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('每日書籤互動demo')), {}).some(x => x.id === 'UC-354'), '每日書籤互動demo matches UC-354 via daily bookmark interactive demo tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('量子漣漪槽小實驗')), {}).some(x => x.id === 'UC-354'), '量子漣漪槽小實驗 matches UC-354 via quantum ripple experiment tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('瀏覽器實測後部署cloudflare')), {}).some(x => x.id === 'UC-354'), '瀏覽器實測後部署cloudflare matches UC-354 via browser verification cloudflare deploy tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('每天挑一則書籤做小實驗')), {}).some(x => x.id === 'UC-354'), '每天挑一則書籤做小實驗 matches UC-354 via daily pick bookmark experiment tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('x發文教練bot')), {}).some(x => x.id === 'UC-355'), 'x發文教練bot matches UC-355 via posting coach bot tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('督促發原創內容教練')), {}).some(x => x.id === 'UC-355'), '督促發原創內容教練 matches UC-355 via original content coach tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('每天盤點原創與轉發')), {}).some(x => x.id === 'UC-355'), '每天盤點原創與轉發 matches UC-355 via daily original vs retweet inventory tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('bot當教練給明天功課')), {}).some(x => x.id === 'UC-355'), 'bot當教練給明天功課 matches UC-355 via coach assignment tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('轉發機器社群教練')), {}).some(x => x.id === 'UC-355'), '轉發機器社群教練 matches UC-355 via retweet machine social coach tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('兩週社群發文數據檢討')), {}).some(x => x.id === 'UC-355'), '兩週社群發文數據檢討 matches UC-355 via two-week posting analytics review tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('付費文章瀏覽器側欄送給bot')), {}).some(x => x.id === 'UC-356'), '付費文章瀏覽器側欄送給bot matches UC-356 via paid article sidebar bot tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('付費訂閱文章對照持股清單')), {}).some(x => x.id === 'UC-356'), '付費訂閱文章對照持股清單 matches UC-356 via subscription article portfolio check tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('grok bot clipper剪藏')), {}).some(x => x.id === 'UC-356'), 'grok bot clipper剪藏 matches UC-356 via clipper tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('付費電子報投資組合對照')), {}).some(x => x.id === 'UC-356'), '付費電子報投資組合對照 matches UC-356 via paid newsletter portfolio comparison tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('瀏覽器擴充剪藏付費文章')), {}).some(x => x.id === 'UC-356'), '瀏覽器擴充剪藏付費文章 matches UC-356 via browser extension clipper tokenization');
assert(api.filterEntries(entries, Array.from(api.tokenize('substack付費文章摘要研究')), {}).some(x => x.id === 'UC-356'), 'substack付費文章摘要研究 matches UC-356 via substack paid article digest tokenization');
const uc330 = entries.find(x => x.id === 'UC-330');
assert.equal(uc330.date, '2026-10-18', 'UC-330 date must be verification date 2026-10-18, not post date 2026-08-31');
const uc101 = entries.find(x => x.id === 'UC-101');
assert.equal(uc101.date, '2026-10-16', 'UC-101 date must be verification date 2026-10-16, not post date 2026-10-09');
const uc221 = entries.find(x => x.id === 'UC-221');
assert.equal(uc221.date, '2026-10-16', 'UC-221 date must be verification date 2026-10-16, not post date 2026-09-24');
const uc222 = entries.find(x => x.id === 'UC-222');
assert.equal(uc222.date, '2026-10-16', 'UC-222 date must be verification date 2026-10-16, not post date 2026-09-28');
const uc260 = entries.find(x => x.id === 'UC-260');
assert.equal(uc260.date, '2026-10-16', 'UC-260 date must be verification date 2026-10-16, not post date 2026-08-23');
const uc278 = entries.find(x => x.id === 'UC-278');
assert.equal(uc278.date, '2026-10-17', 'UC-278 date must be verification date 2026-10-17, not post date 2026-10-11');


const rendered=api.renderMarkdown('# Example\n\n<script>alert(1)</script>\n\n[test](javascript:alert)\n\n## Section\n\n- safe','cases/test.md');
const tags=[];function walk(node){if(node.tagName)tags.push(node.tagName);(node.children||[]).forEach(walk);}walk(rendered);assert(!tags.includes('SCRIPT'));assert(!tags.includes('A'));assert(tags.includes('H2'));assert(tags.includes('LI'));
const future=api.parseFile('cases/999-new-case.md','# UC-999：新案例\n\n- 分類：新主題\n- 核心目標：可搜尋的新流程\n- 來源證據：author-demo');assert.equal(future[0].category,'新主題');assert.equal(api.filterEntries(future,['新流程'],{}).length,1);
const pipeFuture=api.parseFile('cases/998-pipe-case.md','# UC-998｜直槓案例名稱\n\n- 證據：B，作者實跑自述\n- 核心目標：驗證直槓標題解析');assert.equal(pipeFuture[0].originalTitle,'直槓案例名稱');assert.equal(pipeFuture[0].proof,'作者報告／示範');
const custom=api.parseFile('cases/001-test.md','# UC-001：原始研究名\n\n- 網站標題：我的新標題\n- 一句話用途：具體新用途');assert.equal(custom[0].title,'我的新標題');assert.equal(custom[0].what,'具體新用途');
console.log(`PASS: ${entries.length} source entries; full-text, Unicode, combined filters, evidence, empty/reset matching, future entries, safe rendering and links.`);
