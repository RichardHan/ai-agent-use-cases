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
