const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const i18n=fs.readFileSync(path.join(root,"i18n.js"),"utf8");
const itemsScript=fs.readFileSync(path.join(root,"itens.js"),"utf8");
const itemScript=fs.readFileSync(path.join(root,"item.js"),"utf8");
for(const page of ["itens.html","item.html"]){
  const html=fs.readFileSync(path.join(root,page),"utf8");
  const game=html.indexOf("game-localization-data.js?v=20260728-1");
  const language=html.indexOf("i18n.js?v=20260728-6");
  const core=html.indexOf("core.js?v=20260728-2");
  assert(game>=0&&language>game&&core>language,`Ordem de idioma incorreta: ${page}`);
}
for(const key of ["ITEM DROPÁVEL","Todos os itens","fonte condicional","Não foi possível carregar as fontes deste item.","Nenhuma fonte válida foi encontrada na base.","Máx."]){
  assert(i18n.includes(`"${key}"`),`Tradução ausente: ${key}`);
}
assert(itemsScript.includes('i.droppedBy.length===1?"fonte condicional":"fontes condicionais"')); 
assert(itemsScript.includes('langSuffix()'));
assert(itemScript.includes('withLanguage'));
assert(itemScript.includes('tr("ITEM DROPÁVEL")'));
assert(itemScript.includes('toLocaleString(locale())'));
console.log("item i18n: conteúdo dinâmico, idioma e links aprovados");
