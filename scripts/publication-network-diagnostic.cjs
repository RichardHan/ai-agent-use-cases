'use strict';

// Diagnostic only: never substitutes for the authenticated freshness check.
const {spawnSync}=require('node:child_process');
const {tmpdir}=require('node:os');
const env={...process.env,GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'};
const probes=[
 ['public git', 'git', ['-c','credential.helper=','ls-remote','https://github.com/RichardHan/ai-agent-use-cases.git','refs/heads/main']],
 ['GitHub API', 'curl', ['--silent','--show-error','--output','/dev/null','--write-out','%{http_code}','--connect-timeout','5','--max-time','10','https://api.github.com/repos/RichardHan/ai-agent-use-cases/commits/main']]
];
for(const [name,command,args] of probes){
 const started=Date.now();
 const result=spawnSync(command,args,{cwd:tmpdir(),env,encoding:'utf8',timeout:12000,stdio:['ignore','pipe','pipe']});
 const outcome=result.error?.code==='ETIMEDOUT'?'timeout':result.error?'execution error':`exit ${result.status}`;
 const http=name==='GitHub API'&&/^\d{3}$/.test(result.stdout||'')?`; HTTP ${result.stdout}`:'';
 console.log(`${name}: ${outcome}${http}; ${Date.now()-started}ms`);
}
