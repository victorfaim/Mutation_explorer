const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const i18n=fs.readFileSync(path.join(root,"i18n.js"),"utf8");
const requiredPairs={
  "V2.4 · RECOMENDAÇÃO HEURÍSTICA":"V2.4 · HEURISTIC RECOMMENDATION",
  "Não acumula":"Does not stack",
  "Sem descrição registrada.":"No description available.",
  "Equilibra os três melhores desempenhos do Pal com sua versatilidade.":"Balances the Pal's three best performances with its versatility.",
  "Comparador de Trabalho":"Work Comparator",
  "Velocidade e mobilidade":"Speed and mobility",
  "Obtível":"Obtainable",
  "Página não encontrada | Pal Forge":"Page not found | Pal Forge",
  "Pals mutáveis em destaque":"Featured mutable Pals",
  "Análise de trabalho":"Work analysis"
};
for(const [pt,en] of Object.entries(requiredPairs)){
  assert(i18n.includes(JSON.stringify(pt).slice(1,-1)),`Chave ausente: ${pt}`);
  assert(i18n.includes(JSON.stringify(en).slice(1,-1)),`Tradução ausente: ${en}`);
}
for(const pattern of ['candidatos? encontrados?','aderência média','Foram encontrados','Torre de história','Elemento desconhecido','Versátil:']) assert(i18n.includes(pattern),`Padrão dinâmico ausente: ${pattern}`);
for(const page of fs.readdirSync(root).filter(name=>name.endsWith('.html'))){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  if(html.includes('core.js?v=')) assert(html.includes('core.js?v=20260728-8'),`Cache de core desatualizado: ${page}`);
  if(html.includes('i18n.js?v=')) assert(html.includes('i18n.js?v=20260728-12'),`Cache de i18n desatualizado: ${page}`);
}
assert(fs.readFileSync(path.join(root,'core.js'),'utf8').includes('i18n.js?v=20260728-12'));
console.log('i18n completeness: dynamic interface groups and accessible text covered');
