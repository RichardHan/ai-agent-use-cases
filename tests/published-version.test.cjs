'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {sameContent}=require('./published-version.cjs');
const build=(revision,markdown='original')=>({catalog:{bundleRevision:revision,files:['cases/a.md']},corpus:{version:1,revision,sources:[{path:'cases/a.md',markdown}]}});
test('independently built identical releases accept different timestamps',()=>assert(sameContent(build('local'),build('published'))));
test('mixed publication revisions are rejected',()=>{const remote=build('remote');remote.corpus.revision='older';assert(!sameContent(build('local'),remote));});
test('changed, missing and duplicate sources are rejected',()=>{
 assert(!sameContent(build('local'),build('remote','changed')));
 const missing=build('remote');missing.corpus.sources=[];assert(!sameContent(build('local'),missing));
 const duplicate=build('remote');duplicate.corpus.sources.push({...duplicate.corpus.sources[0]});assert(!sameContent(build('local'),duplicate));
 const extra=build('remote');extra.catalog.files.push('cases/new.md');assert(!sameContent(build('local'),extra));
});
test('source order does not change the publication content',()=>{
 const local=build('local');local.catalog.files.push('evidence/b.md');local.corpus.sources.push({path:'evidence/b.md',markdown:'B'});
 const remote=JSON.parse(JSON.stringify(local));remote.catalog.bundleRevision=remote.corpus.revision='remote';remote.catalog.files.reverse();remote.corpus.sources.reverse();assert(sameContent(local,remote));
});
