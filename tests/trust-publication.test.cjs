'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditSummaryMatches}=require('./trust-published.cjs');

test('published audit summary must match the current audit batch',()=>{
 assert.equal(auditSummaryMatches({latestBatch:'current\n'},'current'),true);
 assert.equal(auditSummaryMatches({latestBatch:'stale'},'current'),false);
 assert.equal(auditSummaryMatches({},'current'),false);
});
