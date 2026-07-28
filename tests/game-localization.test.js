const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
function loadWindowFile(file,globalName){
  const sandbox={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,file),"utf8"),sandbox,{filename:file});
  return sandbox.window[globalName];
}

const localization=loadWindowFile("game-localization-data.js","PME_GAME_L10N");
const pals=loadWindowFile("palpedia-data.js","PALPEDIA_DATA");
const coverage=JSON.parse(fs.readFileSync(path.join(root,"game-localization-coverage.json"),"utf8"));

assert.equal(localization.schemaVersion,1);
assert.equal(localization.revision,"palworld-l10n-en-ptbr-20260728");
assert.equal(coverage.sourceTables,27);
assert.equal(coverage.pairedRows,14725);
assert.equal(coverage.directPalFields.description.resolved,297);
assert.equal(coverage.directPalFields.partnerDescription.resolved,297);
assert.equal(coverage.contextRecords["pt-BR"].pals,299);
assert.equal(coverage.contextRecords["en-US"].pals,299);

const pt=localization.contexts["pt-BR"];
const en=localization.contexts["en-US"];
assert.equal(pt.pals.SheepBall.prefix,"Imensa Fofura");
assert.equal(pt.pals.SheepBall.partnerName,"Escudo Almofadado");
assert.match(pt.pals.SheepBall.partnerDescription,/Fazenda de Criação/);
assert.equal(pt.pals.Anubis.prefix,"Protetor do Sol Sombrio");
assert.match(pt.pals.SwordCutlassfish.description,/espécimes mais jovens/);
assert.equal(pt.skills["Swiftly leaps at an enemy and bites into them."].name,"Presa Selvagem");
assert.equal(pt.skills["Quickly lunges at the enemy and bites to deal damage."].name,"Presas Selvagens (Terra)");
assert.equal(localization.locales["pt-BR"].Gunpowder,"Pólvora");
assert.equal(localization.locales["pt-BR"].Ore,"Minério Metálico");
assert.equal(localization.locales["pt-BR"].Ingot,"Lingote de Metal");
assert.equal(localization.locales["pt-BR"].Handcraft,"Trabalho manual");
assert.equal(localization.locales["en-US"].Handcraft,"Handiwork");
assert.equal(localization.locales["pt-BR"].Normal,"Não elemental");

for(const locale of [pt,en]){
  for(const [palKey,fields] of Object.entries(locale.pals)){
    for(const [field,value] of Object.entries(fields)){
      assert.doesNotMatch(value,/<\/?[A-Za-z][^>]*>|<\/>|\{ReferenceMsgId_|ActiveSkillOverWriteEffectTime/,palKey+"."+field);
    }
  }
}
for(const pal of Object.values(pals)){
  const context=pt.pals[pal.key];
  assert.ok(context,"contexto ausente: "+pal.key);
  if(pal.description)assert.ok(context.description,"descrição ausente: "+pal.key);
  if(pal.partnerSkill?.desc)assert.ok(context.partnerDescription,"Partner Skill ausente: "+pal.key);
}

console.log("game localization tests: ok");
