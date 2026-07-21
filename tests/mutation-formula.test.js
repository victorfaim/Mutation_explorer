#!/usr/bin/env node
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const vm=require("vm");

const root=path.resolve(__dirname,"..");
const document={
  documentElement:null,head:{appendChild(){}},
  addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];},
  createElement(){return{dataset:{}};}
};
const context=vm.createContext({
  console,window:null,document,location:{pathname:"/tests.html"},
  MutationObserver:class{observe(){}},URLSearchParams
});
context.window=context;
for(const file of ["data.js","breeding-official-data.js","core.js"]){
  vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),context,{filename:file});
}

function evaluate(source){return vm.runInContext(source,context);}
function mutation(parentA,parentB){
  return evaluate(`(()=>{
    const a=PALS[${JSON.stringify(parentA)}],b=PALS[${JSON.stringify(parentB)}];
    const ranks=mutationRanks(a,b),out=outcomes(a,b),normal=normalChild(a,b);
    return {ranks,count:out.count,counts:Object.fromEntries(out.counts),normal:normal.id};
  })()`);
}

{
  const result=mutation("clionetwins","jetdragon");
  assert.deepStrictEqual({...result.ranks},{count:7,start:1016});
  assert.strictEqual(result.normal,"herculesbeetle","Amione + Jetragon deve gerar Warsect normalmente");
  assert.deepStrictEqual({...result.counts},{darkflamefox:4,plesiosaur:3});
  assert.strictEqual(result.count,7);
  assert.strictEqual(evaluate("MUTATION_NEAREST[1020]"),"plesiosaur","o empate de rank 1020 deve selecionar Braloha");
}

{
  const result=mutation("sheepball","pinkcat");
  assert.deepStrictEqual({...result.ranks},{count:276,start:1497});
  assert.strictEqual(result.normal,"dreamdemon","Lamball + Cattiva deve gerar Daedream normalmente");
  assert.strictEqual(Object.values(result.counts).reduce((sum,value)=>sum+value,0),276);
  assert.strictEqual(evaluate("MUTATION_NEAREST[1497]"),"elecsnail_ground");
  assert.strictEqual(evaluate("MUTATION_NEAREST[1772]"),"hoodghost");
}

{
  const result=mutation("jetdragon","sheepball");
  assert.deepStrictEqual({...result.ranks},{count:7,start:1228});
  assert.deepStrictEqual({...result.counts},{ghostrabbit:7});
}

console.log("mutation-formula: 3 combinações e 12 asserções aprovadas");
