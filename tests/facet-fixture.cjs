'use strict';
// Read the options shown to visitors, rather than freezing a historical corpus.
exports.zeroChoice=groups=>{
 for(const [key,choices] of Object.entries(groups)){
  const option=choices.find(choice=>choice.value&&/^0 · /.test(choice.text));
  if(option)return {key,value:option.value};
 }
 return null;
};
exports.representativeChoices=(choices,current)=>{
 const picked=[choices.find(c=>!c.value),choices.find(c=>c.value&&/^[1-9]\d* · /.test(c.text)),choices.find(c=>c.value&&/^0 · /.test(c.text)),choices.find(c=>c.value===current)].filter(Boolean);
 return [...new Map(picked.map(c=>[c.value,c])).values()];
};
