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

// Data accuracy: Verification date extraction priority over historical post dates
const uc330 = entries.find(x => x.id === 'UC-330');
assert.equal(uc330.date, '2026-10-18', 'UC-330 date must be verification date 2026-10-18, not post date 2026-08-31');
const uc101 = entries.find(x => x.id === 'UC-101');
assert.equal(uc101.date, '2026-10-16', 'UC-101 date must be verification date 2026-10-16, not post date 2026-10-09');


const rendered=api.renderMarkdown('# Example\n\n<script>alert(1)</script>\n\n[test](javascript:alert)\n\n## Section\n\n- safe','cases/test.md');
const tags=[];function walk(node){if(node.tagName)tags.push(node.tagName);(node.children||[]).forEach(walk);}walk(rendered);assert(!tags.includes('SCRIPT'));assert(!tags.includes('A'));assert(tags.includes('H2'));assert(tags.includes('LI'));
const future=api.parseFile('cases/999-new-case.md','# UC-999：新案例\n\n- 分類：新主題\n- 核心目標：可搜尋的新流程\n- 來源證據：author-demo');assert.equal(future[0].category,'新主題');assert.equal(api.filterEntries(future,['新流程'],{}).length,1);
const pipeFuture=api.parseFile('cases/998-pipe-case.md','# UC-998｜直槓案例名稱\n\n- 證據：B，作者實跑自述\n- 核心目標：驗證直槓標題解析');assert.equal(pipeFuture[0].originalTitle,'直槓案例名稱');assert.equal(pipeFuture[0].proof,'作者報告／示範');
const custom=api.parseFile('cases/001-test.md','# UC-001：原始研究名\n\n- 網站標題：我的新標題\n- 一句話用途：具體新用途');assert.equal(custom[0].title,'我的新標題');assert.equal(custom[0].what,'具體新用途');
console.log(`PASS: ${entries.length} source entries; full-text, Unicode, combined filters, evidence, empty/reset matching, future entries, safe rendering and links.`);
