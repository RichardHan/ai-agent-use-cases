'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appSource = fs.readFileSync('assets/app.js', 'utf8')
  .split('/* Browser event bindings. */')[0];
function setupEnvironment(overrides = {}) {
  const elements = [];
  function createElement(tag, className = '', textContent = '') {
    const el = {
      tagName: tag.toUpperCase(),
      className,
      textContent,
      children: [],
      dataset: {},
      attributes: {},
      style: {},
      open: false,
      href: '',
      get lastChild() { return this.children[this.children.length - 1]; },
      append(...nodes) {
        for (const n of nodes) {
          if (typeof n === 'string') {
            this.children.push({ tagName: '#text', textContent: n });
          } else if (n) {
            this.children.push(n);
          }
        }
      },
      replaceChildren(...nodes) {
        this.children = [];
        this.append(...nodes);
      },
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k]; },
      addEventListener() {},
      focus() {},
      querySelector(sel) { return null; },
      querySelectorAll(sel) { return []; }
    };
    elements.push(el);
    return el;
  }

  const detailBody = createElement('div', 'detail-body');
  const detailModal = createElement('dialog', 'detail');
  detailModal.showModal = function() { this.open = true; };
  detailModal.close = function() { this.open = false; };
  detailModal.children.push(detailBody);

  const documentMock = {
    createElement,
    createTextNode(t) { return { tagName: '#text', textContent: String(t) }; },
    getElementById(id) {
      if (id === 'detail') return detailModal;
      if (id === 'detail-body') return detailBody;
      return createElement('div', id);
    },
    querySelector(sel) {
      if (sel === '#detail-body') return detailBody;
      if (sel === '#detail') return detailModal;
      return createElement('div', sel.replace(/^[#.]/, ''));
    },
    addEventListener() {},
    removeEventListener() {}
  };
  const context = vm.createContext({
    document: documentMock,
    window: { document: documentMock },
    console,
    URL,
    Discovery: { scenarioOf: () => '' },
    activeScenario: '',
    crypto: { randomUUID: () => 'test-guidance-uuid' },
    location: { href: 'http://localhost/ai-agent-use-cases/' },
    history: { pushState() {}, replaceState() {}, state: null },
    displayCopy: overrides.displayCopy || {},
    discoveryReady: true
  });

  vm.runInContext(appSource, context);
  return { context, detailBody, detailModal };
}

test('metadata extracts dynamic actionable steps (how) from suggested workflow sections', () => {
  const { context } = setupEnvironment();
  const sampleMarkdown = `# UC-501：自動報表整理
- 情境：工作
- 標籤：報表、自動化
- 網站標題：每週銷售數字自動彙整
- 一句話用途：讓 AI 讀取各分店試算表並產出彙總圖表。

## 建議操作流程

1. 先在測試資料夾準備兩份去敏的店面銷售 CSV 檔案。
2. 執行腳本確認欄位名稱、日期格式與缺漏值處理規則。
3. 由人工審閱產出的試算表總結與異常警告。

## 權限與驗收

- 需要試算表讀取權限，不可開放全域寫入。
- 驗收標準：數字總和必須與原始單據完全吻合。
`;

  const meta = context.metadata(sampleMarkdown, 'cases/501-report.md', 'case', 'UC-501');
  assert.ok(meta.how, 'meta.how should be populated');
  assert.match(meta.how, /先在測試資料夾準備/);
  assert.match(meta.how, /執行腳本確認/);
  assert.ok(!meta.how.startsWith('1.'), 'List markers should be stripped');
});
test('metadata prioritizes actionable workflow headings over preceding input/output sections', () => {
  const { context } = setupEnvironment();
  const sampleMarkdown = `# UC-077：社群排版
- 情境：創作
- 網站標題：文章推送到公眾號

## 輸入與預期輸出

- 輸入：文章草稿與圖片。
- 輸出：發布腳本產生的草稿。

## 建議操作流程

1. 先在測試專案設定固定 IP 與排版腳本。
2. 執行乾跑模式確認格式與圖片尺寸。

## 權限與限制
- 需要公眾號白名單權限。
`;

  const meta = context.metadata(sampleMarkdown, 'cases/077-wechat.md', 'case', 'UC-077');
  assert.match(meta.how, /先在測試專案設定固定 IP/);
  assert.doesNotMatch(meta.how, /輸入：文章草稿/);
});


test('metadata extracts dynamic caution from limits and permissions sections', () => {
  const { context } = setupEnvironment();
  const sampleMarkdown = `# UC-502：雲端部署安全審核
- 情境：開發
- 標籤：部署、安全
- 網站標題：部署前做安全配置掃描
- 一句話用途：在合併至主分支前由 AI 掃描是否有硬編碼密鑰。

## 建議操作流程
1. 配置唯讀權限的掃描工作。

## 所需連接、權限與限制
- 禁止把生產環境 API Key 作為測試輸入；掃描發現的漏洞先交工程團隊內部審核。
- 部署權限需由主管二階段確認。
`;

  const meta = context.metadata(sampleMarkdown, 'cases/502-deploy.md', 'case', 'UC-502');
  assert.ok(meta.caution, 'meta.caution should be populated');
  assert.match(meta.caution, /禁止把生產環境 API Key 作為測試輸入/);
  assert.ok(!meta.caution.startsWith('-'), 'Bullet markers should be stripped');
});

test('displayCopy takes precedence over extracted markdown guidance when provided', () => {
  const customCopy = {
    'UC-001': {
      title: '自訂旅行標題',
      how: '先給出發地、日期、人數與預算，再比較總價、行李和取消條件。',
      caution: '價格要重新核對；付款、預訂與旅客資料傳送仍須你批准。'
    }
  };

  const { context } = setupEnvironment({ displayCopy: customCopy });
  const sampleMarkdown = `# UC-001：旅行比較
- 情境：生活
- 網站標題：原文標題

## 建議操作流程
1. 這是 Markdown 裡的流程步驟。

## 權限與驗收
- 這是 Markdown 裡的權限說明。
`;

  const meta = context.metadata(sampleMarkdown, 'cases/001-travel.md', 'case', 'UC-001');
  assert.equal(meta.how, '先給出發地、日期、人數與預算，再比較總價、行李和取消條件。', 'Curated copy.how must take precedence');
  assert.equal(meta.caution, '價格要重新核對；付款、預訂與旅客資料傳送仍須你批准。', 'Curated copy.caution must take precedence');
});

test('metadata gracefully falls back to honest safe defaults when no specific workflow exists', () => {
  const { context } = setupEnvironment();
  const sampleMarkdown = `# UC-503：純理論探討
- 情境：生活
- 網站標題：探討文章

## 來源版本
僅有作者討論，無任何具體流程或限制章節。
`;

  const meta = context.metadata(sampleMarkdown, 'cases/503-theory.md', 'case', 'UC-503');
  assert.equal(meta.how, '先閱讀原始報告與限制，再用小範圍、去敏資料設計自己的測試。');
  assert.equal(meta.caution, '本庫尚未獨立重現；先確認權限與驗收方式，不把案例報告當成成效保證。');
});

test('showDetail renders extracted how and caution in .guidance-grid cards', () => {
  const { context, detailBody } = setupEnvironment();
  const sampleItem = {
    id: 'UC-504',
    title: '發票自動核銷',
    what: '自動對照報銷單與電子發票金額。',
    summary: '自動對照報銷單與電子發票金額。',
    how: '先匯入去敏後的測試單據，核對統一編號與開立日期。',
    caution: '正式送出報銷前需本人簽核，不可代簽。',
    kind: 'case',
    scenario: '工作',
    proof: '公開資料核讀',
    tools: ['Python'],
    tags: ['發票', '報銷'],
    reviewedDate: '2026-10-25',
    path: 'cases/504.md',
    markdown: '# UC-504\n\n## 內容\n正文'
  };

  context.showDetail(sampleItem, null, false);

  function findByClass(node, cls) {
    if (!node || !node.children) return null;
    for (const c of node.children) {
      if (c.className?.includes(cls)) return c;
      const found = findByClass(c, cls);
      if (found) return found;
    }
    return null;
  }

  const howCard = findByClass(detailBody, 'guidance-how');
  assert.ok(howCard, 'showDetail must render .guidance-how');
  assert.match(howCard.children.find(c => c.tagName === 'P')?.textContent || '', /先匯入去敏後的測試單據/);

  const cautionCard = findByClass(detailBody, 'guidance-caution');
  assert.ok(cautionCard, 'showDetail must render .guidance-caution');
  assert.match(cautionCard.children.find(c => c.tagName === 'P')?.textContent || '', /正式送出報銷前需本人簽核/);
});

test('metadata extracts guidance from H3 subsections and varied acceptance headings', () => {
  const { context } = setupEnvironment();
  const sampleMarkdown = `# UC-162：網格攝影機狀態審查
- 情境：開發
- 標籤：3D、審查
- 網站標題：網格簡化檢視

### 可借用的驗收步驟
1. 先以固定視角的低多邊形網格模型執行乾跑。
2. 比對攝影機軌跡與投影矩陣。

### 限制、權限與費用
- 需本地離線執行，不可上傳未授權的 3D 原始資產。
`;

  const meta = context.metadata(sampleMarkdown, 'cases/162-mesh.md', 'case', 'UC-162');
  assert.ok(meta.how, 'meta.how should extract from H3');
  assert.match(meta.how, /先以固定視角的低多邊形/);
  assert.match(meta.how, /比對攝影機軌跡/);
  assert.ok(meta.caution, 'meta.caution should extract from H3 limits');
  assert.match(meta.caution, /需本地離線執行/);
});

test('metadata prioritizes actionable step headings over descriptive author reports', () => {
  const { context } = setupEnvironment();
  const sampleMarkdown = `# UC-128：測試資料庫收入查詢審查
- 情境：開發
- 標籤：資料庫、權限
- 網站標題：測試資料庫收入查詢

## 作者實作
作者自述在私人專案中建立一套包含多個資料表的測試環境並進行手動分析。

## 操作步驟
1. 使用合成、去識別且隔離的測試資料，不直接連正式商業資料庫。
2. 由管理者以資料庫權限實作只讀與欄位範圍限制。

## 限制與驗收
- 嚴格禁止以生產憑證連線。
`;

  const meta = context.metadata(sampleMarkdown, 'cases/128-test.md', 'case', 'UC-128');
  assert.match(meta.how, /使用合成、去識別且隔離/);
  assert.doesNotMatch(meta.how, /作者自述在私人專案中/);
});

test('metadata prioritizes safety boundary list items over generic prerequisites in limits section', () => {
  const { context } = setupEnvironment();
  const sampleMarkdown = `# UC-016：二手賣場買家訊息處理
- 情境：工作
- 標籤：客服、二手、個資
- 網站標題：二手賣場自動回覆

## 建議操作流程
1. 設定只讀授權查看買家問題。

## 所需連接、權限與限制
- 需要平台帳號的讀取與草稿權限。送出訊息屬寫入動作。
- 個資：地址和電話不要寫在長期記憶或範本中；未經確認嚴禁自動對外發送。
- 法律與平台條款：代理代為交易可能違反平台規則。
`;

  const meta = context.metadata(sampleMarkdown, 'cases/016-market.md', 'case', 'UC-016');
  assert.ok(meta.caution, 'meta.caution should be extracted');
  assert.match(meta.caution, /個資：地址和電話不要寫在長期記憶或範本中/);
  assert.doesNotMatch(meta.caution, /^需要平台帳號的讀取與草稿權限/);
});

test('Reviewer regressions: incidental mentions of coverage or payment speed must not falsely displace safety warnings (UC-111, UC-143)', () => {
  const { context } = setupEnvironment();

  // Finding 1: UC-111 has "作者未公開方案、用量費、處理覆蓋率" which should not displace computer environment limit
  const uc111Markdown = fs.readFileSync('cases/111-engineering-drawing-source-traceability.md', 'utf8');
  const uc111Meta = context.metadata(uc111Markdown, 'cases/111-engineering.md', 'case', 'UC-111');
  assert.match(uc111Meta.caution, /原作者使用自己的開發電腦/);
  assert.doesNotMatch(uc111Meta.caution, /處理覆蓋率/);

  // Finding 2: UC-143 has "不保證找到錢或付款速度" which should not displace privacy and legal risk
  const uc143Markdown = fs.readFileSync('cases/143-unclaimed-property-candidate-handoff.md', 'utf8');
  const uc143Meta = context.metadata(uc143Markdown, 'cases/143-unclaimed.md', 'case', 'UC-143');
  assert.match(uc143Meta.caution, /涉及財產及身份的真實查詢有隱私與法律風險/);
  assert.doesNotMatch(uc143Meta.caution, /付款速度/);
});

// The corpus writes the same two sections under many phrasings ("怎麼試（本庫設計，
// 未測）", "建議步驟（本庫設計，未實測）", "權限、費用與驗收"). A heading the extractor
// does not know silently drops the case's own steps and the detail page falls back to
// the generic library sentence, which reads like the case's guidance but is not.
test('metadata reads the step headings the corpus actually uses', () => {
  const { context } = setupEnvironment();
  const headings = ['怎麼試（本庫設計，未測）', '建議步驟（本庫設計，未實測）', '可參考的操作順序', '可重用驗收步驟（本庫設計，未執行）'];
  headings.forEach((heading, index) => {
    const markdown = `# UC-6${index}0：測試步驟標題
- 情境：工作
- 網站標題：測試

## ${heading}
1. 先以去敏資料在隔離環境試跑，確認第一項輸出。
2. 再逐項核對來源與限制，不直接寫入正式系統。

## 來源版本
- 作者自述。
`;
    const meta = context.metadata(markdown, `cases/6${index}0-heading.md`, 'case', `UC-6${index}0`);
    assert.match(meta.how, /先以去敏資料在隔離環境試跑/, `"${heading}" must provide the case's own steps`);
    assert.doesNotMatch(meta.how, /先閱讀原始報告與限制/, `"${heading}" must not fall back to the generic sentence`);
  });
});

test('an author-result section is not turned into "how to start"', () => {
  const { context } = setupEnvironment();
  const markdown = `# UC-670：測試作者結果
- 情境：工作
- 網站標題：測試

## 問題、實作與實際結果
1. 作者在自己的專案建了一套流程並貼出結果。
2. 這是作者的成果，不是可照做的步驟。

## 來源版本
- 作者自述。
`;
  const meta = context.metadata(markdown, 'cases/670-result.md', 'case', 'UC-670');
  assert.equal(meta.how, '先閱讀原始報告與限制，再用小範圍、去敏資料設計自己的測試。');
});

test('metadata reads the limits headings the corpus actually uses', () => {
  const { context } = setupEnvironment();
  ['權限、費用與驗收', '共通方案、可用性與權限', '驗收與限制', '權限、費用與去重'].forEach((heading, index) => {
    const markdown = `# UC-6${index}1：測試限制標題
- 情境：工作
- 網站標題：測試

## 建議操作流程
1. 先讀取。

## ${heading}
- 未經本人確認不得送出、付款或改權限；憑證只放在本機。

## 來源版本
- 作者自述。
`;
    const meta = context.metadata(markdown, `cases/6${index}1-limits.md`, 'case', `UC-6${index}1`);
    assert.match(meta.caution, /未經本人確認不得送出/, `"${heading}" must provide the case's own limits`);
  });
});

const GENERIC_HOW = '先閱讀原始報告與限制，再用小範圍、去敏資料設計自己的測試。';

test('every case that writes a step section keeps its own guidance on the detail page', () => {
  const { context } = setupEnvironment();
  // Same boundary the reader uses: a step heading owns the text up to the next
  // heading of any level, so a heading that only introduces subsections is skipped.
  const stepHeading = /^#{2,3}\s+.*(?:怎麼試|怎麼開始|小範圍試法|建議步驟|操作步驟|操作順序|可參考步驟|可借鑑步驟|可重用.*步驟|練習步驟|建議操作流程|建議流程|驗收步驟).*$/;
  const missing = [];
  for (const file of fs.readdirSync('cases').filter(name => name.endsWith('.md'))) {
    const markdown = fs.readFileSync(path.join('cases', file), 'utf8');
    const match = markdown.match(new RegExp(stepHeading.source, 'm'));
    if (!match) continue;
    const section = markdown.slice(match.index + match[0].length).split(/\n#{2,3}\s/)[0];
    if (!/\S/.test(section.replace(/<!--[\s\S]*?-->/g, ''))) continue;
    const meta = context.metadata(markdown, `cases/${file}`, 'case');
    if (meta.how === GENERIC_HOW) missing.push(file);
  }
  assert.deepEqual(missing, [], 'these cases write steps the reader cannot see: ' + missing.join(', '));
});

const GENERIC_CAUTION = '本庫尚未獨立重現；先確認權限與驗收方式，不把案例報告當成成效保證。';

test('every case that names a limits section keeps its own limits on the detail page', () => {
  const { context } = setupEnvironment();
  // Headings that can only mean "limits and permissions"; a case that writes one of
  // these must not be published with the generic library warning instead.
  const limitsHeading = /^#{2,3}\s+.*(?:所需連接、權限與限制|權限、費用與限制|權限、費用與可用性|權限、費用及限制|證據與查閱缺口|來源報告與限制|要注意什麼|權限、成本及可用性).*$/;
  const missing = [];
  for (const file of fs.readdirSync('cases').filter(name => name.endsWith('.md'))) {
    const markdown = fs.readFileSync(path.join('cases', file), 'utf8');
    if (!limitsHeading.test(markdown)) continue;
    const meta = context.metadata(markdown, `cases/${file}`, 'case');
    if (meta.caution === GENERIC_CAUTION) missing.push(file);
  }
  assert.deepEqual(missing, [], 'these cases write limits the reader cannot see: ' + missing.join(', '));
});

test('a citation line is not published as advice', () => {
  const { context } = setupEnvironment();
  const markdown = `# UC-680：測試引用
- 情境：工作
- 網站標題：測試

## 建議操作流程
1. 先以合成資料試跑。

## 權限、費用與限制
- [Meet dots](https://learn.chatgpt.com/docs/dots)，2026-10-16 查閱：dot 有雲端電腦。
- 需要讀取授權；送出前須本人確認。

## 來源版本
- 作者自述。
`;
  const meta = context.metadata(markdown, 'cases/680-citation.md', 'case', 'UC-680');
  assert.equal(meta.caution, '需要讀取授權；送出前須本人確認。');
  assert.doesNotMatch(meta.caution, /^\[/);
});

test('a step section that only introduces subsections must not fall through to an author result', () => {
  const { context } = setupEnvironment();
  // Shape of cases/181: the step heading owns nothing but an H3, and the next
  // candidate is the author's own run.
  const markdown = `# UC-681：測試步驟與作者結果
- 情境：工作
- 網站標題：測試

## 原作者實作
作者描述自己的三人小店試用 Bot 約一個月，並估計每天原需 20–30 分鐘；沒有標籤樣本或狀態回寫。

## 可參考步驟（自行設計，未執行）

### 2026-10-18 補充：先前流程失效
作者說同一流程後來不能完成；根因未獲獨立確認。

## 權限、費用與可用性
- 購標可能扣款；列印與通知需各自授權。
`;
  const meta = context.metadata(markdown, 'cases/681-steps.md', 'case', 'UC-681');
  assert.equal(meta.how, GENERIC_HOW, 'an author result must never become "怎麼開始"');
  assert.match(meta.caution, /購標可能扣款/);
});

test('a citation that follows a publisher name is not advice', () => {
  const { context } = setupEnvironment();
  const markdown = `# UC-682：測試引用前綴
- 情境：工作
- 網站標題：測試

## 建議操作流程
1. 先以合成資料試跑。

## 權限、費用與限制
- ElevenLabs的[Professional Voice Clone說明](https://elevenlabs.io/docs)：須是本人聲音並通過驗證。
- 未經本人同意不得複製他人聲音或上傳私人錄音。

## 來源版本
- 作者自述。
`;
  const meta = context.metadata(markdown, 'cases/682-prefix.md', 'case', 'UC-682');
  assert.equal(meta.caution, '未經本人同意不得複製他人聲音或上傳私人錄音。');
});

test('published guidance never carries markdown link syntax or a bare URL', () => {
  const { context } = setupEnvironment();
  const offenders = [];
  for (const file of fs.readdirSync('cases').filter(name => name.endsWith('.md'))) {
    const markdown = fs.readFileSync(path.join('cases', file), 'utf8');
    const meta = context.metadata(markdown, `cases/${file}`, 'case');
    for (const [field, value] of [['how', meta.how], ['caution', meta.caution]]) {
      if (!value) continue;
      if (/\]\(|https?:\/\//.test(value)) offenders.push(`${file}:${field}`);
    }
  }
  assert.deepEqual(offenders, [], 'guidance must read as prose, not as a link: ' + offenders.join(', '));
});
