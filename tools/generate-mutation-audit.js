#!/usr/bin/env node
const fs=require("fs");
const path=require("path");
const vm=require("vm");

const root=path.resolve(__dirname,"..");
global.window=global;
for(const file of ["data.js","breeding-official-data.js"]){
  vm.runInThisContext(fs.readFileSync(path.join(root,file),"utf8"),{filename:file});
}

const roundGame=value=>Math.floor(Number(value)+0.5);
const weighted=Object.create(null);
const routes=Object.create(null);
let maxMutationRank=0;
let weightedOccurrenceCount=0;

for(let i=0;i<PARENT_IDS.length;i++){
  const a=PAL_DATA[PARENT_IDS[i]];
  for(let j=i;j<PARENT_IDS.length;j++){
    const b=PAL_DATA[PARENT_IDS[j]];
    const low=Math.min(a.combiRank,b.combiRank);
    const diff=Math.abs(a.combiRank-b.combiRank);
    const count=Math.max(1,roundGame(low*0.1));
    const start=roundGame(low*0.5)+roundGame(diff*0.4)+1;
    const seen=new Set();
    maxMutationRank=Math.max(maxMutationRank,start+count-1);
    weightedOccurrenceCount+=count;
    for(let k=0;k<count;k++){
      const id=MUTATION_NEAREST[Math.max(1,start+k)];
      if(!id)throw new Error(`Rank de mutação sem Pal: ${start+k}`);
      weighted[id]=(weighted[id]||0)+1;
      seen.add(id);
    }
    for(const id of seen)routes[id]=(routes[id]||0)+1;
  }
}

const status={};
for(const pal of Object.values(PAL_DATA)){
  const pairs=weighted[pal.id]||0;
  let state,reason;
  if(pal.ignoreCombi){state="blocked";reason="Excluído do pool por ignoreCombi";}
  else if(pairs){state="obtainable";reason="Existe pelo menos um cruzamento real";}
  else{state="unreachable";reason="Elegível no pool, mas nenhum cruzamento o seleciona";}
  status[pal.id]={state,reason,pairs,routePairs:routes[pal.id]||0};
}
const stateCounts=Object.values(status).reduce((counts,row)=>{
  counts[row.state]=(counts[row.state]||0)+1;return counts;
},{});
const summary={
  pairCount:PARENT_IDS.length*(PARENT_IDS.length+1)/2,
  routeCount:Object.values(routes).reduce((sum,value)=>sum+value,0),weightedOccurrenceCount,
  obtainableCount:stateCounts.obtainable||0,unreachableCount:stateCounts.unreachable||0,
  blockedCount:stateCounts.blocked||0,maxMutationRank,
  formula:{lowCountCoefficient:0.1,lowStartCoefficient:0.5,diffStartCoefficient:0.4,offset:1,rounding:"floor(x + 0.5)"},
  evidence:"Palworld-Win64-Shipping.exe Steam build 24181527"
};

fs.writeFileSync(path.join(root,"audit-data.js"),`window.PAL_STATUS=${JSON.stringify(status)};\nwindow.AUDIT_SUMMARY=${JSON.stringify(summary)};\n`,"utf8");
console.log(JSON.stringify(summary,null,2));
