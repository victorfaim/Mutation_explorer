const assert=require("assert");
const fs=require("fs");
const path=require("path");
const vm=require("vm");
const Details=require("../mapa-details.js");
const tables=[{level:0,drops:[{itemId:"Fallback",rate:10,min:1,max:1}]},{level:55,drops:[{itemId:"Exact",rate:25,min:1,max:2}]},{level:70,drops:[]}];
assert.strictEqual(Details.selectBossDropTable(tables,55).level,55,"Nível exato deve ter precedência");
assert.strictEqual(Details.selectBossDropTable(tables,60).level,0,"Tabela-base deve ser o fallback determinístico");
assert.strictEqual(Details.selectBossDropTable(tables.slice(1),60).level,55,"Sem base, usa o menor nível disponível");
assert.strictEqual(Details.selectBossDropTable([],60),null);
const consolidated=Details.consolidateDrops({drops:[{itemId:"CarbonFiber",rate:20,min:1,max:2},{itemId:"CarbonFiber",rate:20,min:1,max:2},{itemId:"CarbonFiber",rate:10,min:2,max:3},{itemId:"Ignored",rate:0,min:1,max:1}]});
assert.strictEqual(consolidated.length,1,"O mesmo item não deve virar cards duplicados");
assert.strictEqual(consolidated[0].variants.length,2,"Variantes distintas não devem ter chances somadas");
const env={PME_I18N:{locale:"pt-BR"},PAL_DROP_TABLES:{pals:{jetdragon:{boss:[{level:0,drops:[{itemId:"CarbonFiber",rate:20,min:1,max:2},{itemId:"CarbonFiber",rate:20,min:1,max:2}]}]}},items:{CarbonFiber:{name:"Carbon Fiber",icon:"T_itemicon_Material_CarbonFiber"},Reward:{name:"Tower Reward",icon:"T_itemicon_Material_Reward"},First:{name:"First Reward",icon:"T_itemicon_Material_First"}}}};
const renderer=Details.createRenderer({env,document:{},tr:value=>value,esc:value=>String(value).replaceAll("&","&amp;"),number:value=>String(value),langParam:()=>"lang=pt-BR",maps:{mainworld5:{label:"Palpagos"}},categories:{},detailImage:()=>'<span class="image"></span>',markerTitle:marker=>marker.pal?.name||marker.label||marker.id});
const alpha={id:"alpha-jetragon",mapId:"mainworld5",category:"alpha-boss",level:55,game:{x:-1,y:2},pal:{id:"jetdragon",slug:"jetragon",name:"Jetragon",elements:["Dragon"]}};
(async()=>{
  const html=await renderer(alpha);
  for(const expected of ["Jetragon","Nível 55","Dragon","Carbon Fiber","Chance: 20%","Quantidade: 1–2","pal.html?pal=jetragon&lang=pt-BR","breeding.html?child=jetdragon&lang=pt-BR","caminho.html?target=jetdragon&lang=pt-BR","reverso.html?pal=jetdragon&lang=pt-BR","Drops conhecidos para a variante Alpha/Boss deste Pal."]){assert(html.includes(expected),"Detalhe Alpha incompleto: "+expected);}
  assert.strictEqual((html.match(/class="public-map-drop"/g)||[]).length,1,"Item duplicado no painel");
  const tower=await renderer({id:"tower",label:"Torre",mapId:"mainworld5",category:"story-tower",game:{x:1,y:2},battle:{difficulties:[{difficulty:"normal",characterId:"GYM_Test",names:{"pt-BR":{name:"Boss Teste",title:"Título oficial"}},level:20,elements:["Leaf"],battleTimeSeconds:300,readyPhaseSeconds:180,hpParameters:{base:110,enemyMaxRate:25},rewards:[{itemId:"Reward",rate:20,min:1,max:2}]}],oneTimeRewards:["First"],multiplayerHpRates:{"1":1,"2":1.4},hpRoundingConfidence:"partial"}});
  for(const expected of ["Boss Teste","Título oficial","Nível 20","Tempo de batalha","5 minutos","Base 110","Taxa inimiga ×25","Tower Reward","First Reward","1P","×1,4","Parcial","arredondamento intermediário"]){assert(tower.includes(expected),"Detalhe de torre incompleto: "+expected);}
  const unknown=await renderer({id:"other",mapId:"mainworld5",category:"other",game:{x:0,y:0}});
  assert(unknown.includes("Nenhum detalhe adicional disponível"));
  console.log("map-details: seleção de drops, deduplicação, renderizadores e links aprovados");
})().catch(error=>{console.error(error);process.exitCode=1;});

const reverseSource=fs.readFileSync(path.resolve(__dirname,"../reverso.js"),"utf8");
const reverseInit=reverseSource.match(/const qp=new URLSearchParams\(location\.search\)\.get\("pal"\);[\s\S]*$/);
assert(reverseInit,"Contrato ?pal da Mutação Reversa não encontrado");
let selectedFromUrl=null;
vm.runInNewContext(reverseInit[0],{URLSearchParams,location:{search:"?pal=jetdragon&lang=pt-BR"},findPal:value=>value==="jetdragon"?{id:"jetdragon"}:null,selectPal:id=>{selectedFromUrl=id;}});
assert.strictEqual(selectedFromUrl,"jetdragon","ID técnico correto não foi pré-selecionado");
vm.runInNewContext(reverseInit[0],{URLSearchParams,location:{search:"?pal=invalid-id&lang=pt-BR"},findPal:()=>null,selectPal:()=>{throw new Error("Parâmetro inválido tentou selecionar um Pal");}});
const detailsSource=fs.readFileSync(path.resolve(__dirname,"../mapa-details.js"),"utf8");
assert(!detailsSource.includes("reverso.html?target="),"O painel ainda usa o parâmetro incorreto ?target");
