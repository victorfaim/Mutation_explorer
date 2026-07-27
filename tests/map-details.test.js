const assert=require("assert");
const Details=require("../mapa-details.js");
const tables=[{level:0,drops:[{itemId:"Fallback",rate:10,min:1,max:1}]},{level:55,drops:[{itemId:"Exact",rate:25,min:1,max:2}]},{level:70,drops:[]}];
assert.strictEqual(Details.selectBossDropTable(tables,55).level,55,"Nível exato deve ter precedência");
assert.strictEqual(Details.selectBossDropTable(tables,60).level,0,"Tabela-base deve ser o fallback determinístico");
assert.strictEqual(Details.selectBossDropTable(tables.slice(1),60).level,55,"Sem base, usa o menor nível disponível");
assert.strictEqual(Details.selectBossDropTable([],60),null);
const consolidated=Details.consolidateDrops({drops:[{itemId:"CarbonFiber",rate:20,min:1,max:2},{itemId:"CarbonFiber",rate:20,min:1,max:2},{itemId:"CarbonFiber",rate:10,min:2,max:3},{itemId:"Ignored",rate:0,min:1,max:1}]});
assert.strictEqual(consolidated.length,1,"O mesmo item não deve virar cards duplicados");
assert.strictEqual(consolidated[0].variants.length,2,"Variantes distintas não devem ter chances somadas");
const env={PME_I18N:{locale:"pt-BR"},PAL_DROP_TABLES:{pals:{jetdragon:{boss:[{level:0,drops:[{itemId:"CarbonFiber",rate:20,min:1,max:2},{itemId:"CarbonFiber",rate:20,min:1,max:2}]}]}},items:{CarbonFiber:{name:"Carbon Fiber",icon:"T_itemicon_Material_CarbonFiber"}}}};
const renderer=Details.createRenderer({env,document:{},tr:value=>value,esc:value=>String(value).replaceAll("&","&amp;"),number:value=>String(value),langParam:()=>"lang=pt-BR",maps:{mainworld5:{label:"Palpagos"}},categories:{},detailImage:()=>'<span class="image"></span>',markerTitle:marker=>marker.pal?.name||marker.label||marker.id});
const alpha={id:"alpha-jetragon",mapId:"mainworld5",category:"alpha-boss",level:55,game:{x:-1,y:2},pal:{id:"jetdragon",slug:"jetragon",name:"Jetragon",elements:["Dragon"]}};
(async()=>{
  const html=await renderer(alpha);
  for(const expected of ["Jetragon","Nível 55","Dragon","Carbon Fiber","Chance: 20%","Quantidade: 1–2","pal.html?pal=jetragon&lang=pt-BR","breeding.html?child=jetdragon&lang=pt-BR","caminho.html?target=jetdragon&lang=pt-BR","reverso.html?target=jetdragon&lang=pt-BR","Drops conhecidos para a variante Alpha/Boss deste Pal."]){assert(html.includes(expected),"Detalhe Alpha incompleto: "+expected);}
  assert.strictEqual((html.match(/class="public-map-drop"/g)||[]).length,1,"Item duplicado no painel");
  const tower=await renderer({id:"tower",label:"Torre",mapId:"mainworld5",category:"story-tower",game:{x:1,y:2}});
  assert(!/HP|drop|Nível/.test(tower),"Tower recebeu dados não confirmados");
  const unknown=await renderer({id:"other",mapId:"mainworld5",category:"other",game:{x:0,y:0}});
  assert(unknown.includes("Nenhum detalhe adicional disponível"));
  console.log("map-details: seleção de drops, deduplicação, renderizadores e links aprovados");
})().catch(error=>{console.error(error);process.exitCode=1;});
