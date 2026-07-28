const assert=require("assert");
const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const core=fs.readFileSync(path.join(root,"core.js"),"utf8");
const expectedLinks=[
  "index.html","palpedia.html","breeding.html","reverso.html","caminho.html","mapa.html","itens.html",
  "team-builder.html","comparador.html","tierlist.html?tab=combat","tierlist.html?tab=work",
  "partner-skills.html","worker-finder.html","impossiveis.html","auditoria.html","enciclopedia.html"
];
assert(!core.includes('label:"Mutation Explorer"'),"Mutation Explorer duplicado no menu");
for(const href of expectedLinks){
  assert(core.includes(`href:"${href}"`),`Link ausente no menu: ${href}`);
  const file=href.split(/[?#]/)[0];
  assert(fs.existsSync(path.join(root,file)),`Destino ausente: ${file}`);
}
for(const legacy of ["worker-finder.html","impossiveis.html","auditoria.html","enciclopedia.html","tiertrabalho.html"]){
  const html=fs.readFileSync(path.join(root,legacy),"utf8");
  assert(html.includes("location.replace"),`Redirecionamento legado quebrado: ${legacy}`);
}
for(const page of ["index.html","breeding.html","reverso.html","caminho.html","palpedia.html","pal.html","itens.html","item.html","partner-skills.html","team-builder.html","tierlist.html","comparador.html","comparador-trabalho.html","mapa.html"]){
  const html=fs.readFileSync(path.join(root,page),"utf8");
  assert(html.includes("style.css?v=20260727-2"),`Cache CSS desatualizado: ${page}`);
  assert(html.includes("core.js?v=20260728-2"),`Cache da navegação desatualizado: ${page}`);
}
for(const page of ["sobre.html","contato.html","aviso-legal.html"]){
  const html=fs.readFileSync(path.join(root,page),"utf8");
  assert(html.includes("style.css?v=20260727-2"));
  assert(html.includes("core.js?v=20260728-2"));
  assert(!html.includes("data.js"),`Página institucional carregando dataset: ${page}`);
  assert(!/<form\b/i.test(html),`Formulário fora do escopo: ${page}`);
}
for(const href of ["sobre.html","contato.html","aviso-legal.html"]){
  assert(core.includes(`["${href}"`),`Link institucional ausente: ${href}`);
}
assert(core.includes("https://github.com/victorfaim/Mutation_explorer"));
assert(core.includes("Versão v0.9.0"));
assert(fs.existsSync(path.join(root,"mapa-lab.html")),"Mapa Lab técnico ausente");
for(const file of fs.readdirSync(root).filter(name=>name.endsWith(".html"))){
  const html=fs.readFileSync(path.join(root,file),"utf8");
  for(const match of html.matchAll(/(?:href|src)=["']([^"'#]+)(?:#[^"']*)?["']/g)){
    const raw=match[1];
    if(/^(?:https?:|mailto:|data:)/.test(raw))continue;
    const target=raw.split("?")[0].replaceAll("&amp;","&");
    assert(!target||fs.existsSync(path.join(root,target)),`Referência local ausente: ${file} -> ${raw}`);
  }
}
assert(core.includes('aria-controls="nav-menu-${index}"'));
assert(core.includes('event.key!=="Escape"'));
assert(core.includes('event.key==="ArrowDown"'));
const homeTheme=fs.readFileSync(path.join(root,"index.html"),"utf8");
const contactTheme=fs.readFileSync(path.join(root,"contato.html"),"utf8");
assert(!homeTheme.includes("Cada módulo carrega apenas o necessário"));
for(const asset of ["T_itemicon_Material_PalEgg_MutationPal.png","T_itemicon_PalSphere.png"]){
  assert(homeTheme.includes("assets/items/"+asset));
  assert(fs.existsSync(path.join(root,"assets","items",asset)),"Asset ausente: "+asset);
}
assert(contactTheme.includes("mailto:palforgeteam@gmail.com"));
assert(contactTheme.includes(">palforgeteam@gmail.com</a>"));
console.log("navigation: links, legados, cache e controles de teclado aprovados");
