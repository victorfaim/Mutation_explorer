
const PALS=window.PAL_DATA||{};
const PARENT_IDS=window.PARENT_IDS||[];
const NORMAL_NEAREST=window.NORMAL_NEAREST||{};
const MUTATION_NEAREST=window.MUTATION_NEAREST||{};
const UNIQUE_PAIRS=window.UNIQUE_PAIRS||{};
const UNIQUE_GENDER_RULES=window.UNIQUE_GENDER_RULES||{};
const PAL_TOOLTIP_DATA=window.PAL_TOOLTIP_DATA||{};
const allPals=Object.values(PALS);
const roundGame=n=>Math.floor(Number(n)+.5);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const fmt=n=>Number(n).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})+"%";
function findPal(value){
  const q=String(value||"").trim().toLowerCase();
  return allPals.find(p=>p.name.toLowerCase()===q||p.id.toLowerCase()===q)
      || allPals.find(p=>p.name.toLowerCase().includes(q));
}
function mutationRanks(a,b){
  const low=Math.min(a.combiRank,b.combiRank);
  const diff=Math.abs(a.combiRank-b.combiRank);
  const count=Math.max(1,roundGame(low*.1));
  const start=roundGame(low*.5)+roundGame(diff*.4)+1;
  return {count,start};
}
function normalChildren(a,b){
  const genderRules=UNIQUE_GENDER_RULES[a.id+"|"+b.id];
  if(genderRules?.length)return genderRules.map(rule=>({pal:PALS[rule.child],rule})).filter(row=>row.pal);
  const special=UNIQUE_PAIRS[a.id+"|"+b.id];
  if(special)return [{pal:PALS[special],rule:null}];
  if(a.id===b.id)return [{pal:a,rule:null}];
  return [{pal:PALS[NORMAL_NEAREST[(a.combiRank+b.combiRank+1)>>1]],rule:null}];
}
function normalChild(a,b){
  return normalChildren(a,b)[0]?.pal||null;
}
function genderLabel(value){
  return value==="Male"?"Macho":value==="Female"?"Fêmea":"Qualquer";
}
function breedingRuleLabel(rule){
  if(!rule)return "";
  return `${genderLabel(rule.aGender)} + ${genderLabel(rule.bGender)}`;
}
function outcomes(a,b){
  const {count,start}=mutationRanks(a,b);
  const counts=new Map();
  for(let k=0;k<count;k++){
    const id=MUTATION_NEAREST[Math.max(1,start+k)];
    counts.set(id,(counts.get(id)||0)+1);
  }
  return {count,counts};
}
function stateBadge(meta){
  const labels={obtainable:"Obtível",unreachable:"Inalcançável",blocked:"Bloqueado",outside:"Fora da mecânica"};
  return `<span class="badge ${meta.state}">${labels[meta.state]}</span>`;
}


const ASSETS=window.ASSET_CONFIG||{
  extensions:["png","webp","jpg","svg"],
  palsDirectory:"assets/pals",
  itemsDirectory:"assets/items",
  elementsDirectory:"assets/elements",
  workDirectory:"assets/work",
  elements:{},
  work:{}
};

function assetCandidates(directory,name){
  if(!name)return [];
  const clean=String(name).replace(/\.(png|webp|jpg|jpeg|svg)$/i,"");
  return (ASSETS.extensions||["png"]).map(ext=>`${directory}/${encodeURIComponent(clean)}.${ext}`);
}

function localAssetUrl(directory,name){
  return assetCandidates(directory,name)[0]||"";
}

function fallbackImageAttributes(directory,name){
  const candidates=assetCandidates(directory,name);
  return {
    src:candidates[0]||"",
    candidates
  };
}

function installImageFallback(img,candidates){
  if(!img||!candidates?.length)return;
  let index=0;
  img.addEventListener("error",()=>{
    index++;
    if(index<candidates.length){
      img.src=candidates[index];
    }else{
      img.style.display="none";
    }
  });
}

function palIconUrl(p){
  return p?.icon?localAssetUrl(ASSETS.palsDirectory,p.icon):"";
}

function palIconTooltip(p){
  if(!p)return "";
  const meta=PAL_TOOLTIP_DATA[p.id]||{};
  const number=Number(p.index)>=0?`${p.index}${meta.suffix||p.suffix||""}`:"—";
  const elements=meta.elements||[];
  const rarity=meta.rarity||"Raridade desconhecida";
  return `N-#${number}/${rarity} · ${elements.length?elements.join(" + "):"Elemento desconhecido"}`;
}

function itemIconName(item){
  const mapped=item?.id?window.ITEM_ICON_MAP?.[item.id]:null;
  return mapped?.textureBasename||item?.icon||"";
}

function itemIconUrl(item){
  const name=itemIconName(item);
  return name?localAssetUrl(ASSETS.itemsDirectory,name):"";
}

function elementIconName(element){
  return ASSETS.elements?.[element]||"";
}

function elementIconUrl(element){
  const name=elementIconName(element);
  return name?localAssetUrl(ASSETS.elementsDirectory,name):"";
}

function workIconName(work){
  return ASSETS.work?.[work]||"";
}

function workIconUrl(work){
  const name=workIconName(work);
  return name?localAssetUrl(ASSETS.workDirectory,name):"";
}

function assetImg(directory,name,alt="",className="",loading="lazy"){
  const data=fallbackImageAttributes(directory,name);
  if(!data.src)return "";
  const encoded=encodeURIComponent(JSON.stringify(data.candidates));
  return `<img src="${data.src}" alt="${esc(alt)}" class="${esc(className)}" loading="${loading}" decoding="async" data-asset-candidates="${encoded}">`;
}

function activateAssetFallbacks(root=document){
  root.querySelectorAll("img[data-asset-candidates]").forEach(img=>{
    if(img.dataset.assetFallbackReady)return;
    img.dataset.assetFallbackReady="1";
    try{
      installImageFallback(img,JSON.parse(decodeURIComponent(img.dataset.assetCandidates)));
    }catch{
      img.addEventListener("error",()=>img.style.display="none");
    }
  });
}

function palChip(p,extraClass=""){
  if(!p)return "—";
  return `<span class="pal-chip ${extraClass}" title="${esc(palIconTooltip(p))}">${p.icon?assetImg(ASSETS.palsDirectory,p.icon,p.name,""):""}<span>${esc(p.name)}</span></span>`;
}

const assetFallbackObserver=new MutationObserver(()=>activateAssetFallbacks(document));
if(document.documentElement){
  assetFallbackObserver.observe(document.documentElement,{childList:true,subtree:true});
}
document.addEventListener("DOMContentLoaded",()=>activateAssetFallbacks(document));
// Navegação canônica: mantém todas as ferramentas acessíveis sem expô-las no mesmo nível.
(()=>{
  const nav=document.querySelector("header nav");
  if(!nav)return;
  const header=nav.closest("header");
  const page=location.pathname.split("/").pop()||"index.html";
  const params=new URLSearchParams(location.search);
  const isPage=(pages,when=()=>true)=>pages.includes(page)&&when();
  const items=[
    {href:"index.html",label:"Início",active:isPage(["index.html",""])},
    {href:"palpedia.html",label:"Palpedia",active:isPage(["palpedia.html","pal.html"])},
    {label:"Breeding",children:[
      {href:"breeding.html",label:"Calculadora de Breeding",active:isPage(["breeding.html"])},
      {href:"reverso.html",label:"Mutação Reversa",active:isPage(["reverso.html"])},
      {href:"caminho.html",label:"Caminho de Breeding",active:isPage(["caminho.html"])}
    ]},
    {href:"mapa.html",label:"Mapa",active:isPage(["mapa.html"])},
    {href:"itens.html",label:"Itens",active:isPage(["itens.html","item.html"])},
    {label:"Equipes",children:[
      {href:"team-builder.html",label:"Team Builder",active:isPage(["team-builder.html"])},
      {href:"comparador.html",label:"Comparador",active:isPage(["comparador.html"])},
      {href:"tierlist.html?tab=combat",label:"Tier Combate",active:isPage(["tierlist.html"],()=>params.get("tab")!=="work")},
      {href:"tierlist.html?tab=work",label:"Tier Trabalho",active:isPage(["tierlist.html"],()=>params.get("tab")==="work")}
    ]},
    {label:"Ferramentas",children:[
      {href:"partner-skills.html",label:"Partner Skills",active:isPage(["partner-skills.html"])},
      {href:"worker-finder.html",label:"Worker Finder",active:false},
      {href:"impossiveis.html",label:"Não Obtíveis",active:false}
    ]},
    {label:"Mais",children:[
      {href:"auditoria.html",label:"Auditoria técnica",active:false,technical:true},
      {href:"enciclopedia.html",label:"Enciclopédia",active:false}
    ]}
  ];
  const link=item=>`<a${item.active?' class="active" aria-current="page"':""}${item.technical?' class="nav-technical"':""} href="${item.href}">${item.label}</a>`;
  nav.id="site-navigation";
  nav.className="site-nav";
  nav.setAttribute("aria-label","Navegação principal");
  nav.innerHTML=items.map((item,index)=>{
    if(!item.children)return link(item);
    const active=item.children.some(child=>child.active);
    return `<div class="nav-group${active?" active":""}"><button class="nav-menu-toggle" type="button" aria-expanded="false" aria-controls="nav-menu-${index}">${item.label}<span aria-hidden="true">▾</span></button><div class="nav-dropdown" id="nav-menu-${index}">${item.children.map(link).join("")}</div></div>`;
  }).join("");
  const mobileToggle=document.createElement("button");
  mobileToggle.className="site-nav-toggle";
  mobileToggle.type="button";
  mobileToggle.setAttribute("aria-expanded","false");
  mobileToggle.setAttribute("aria-controls",nav.id);
  mobileToggle.innerHTML='<span aria-hidden="true">☰</span><span>Menu</span>';
  const brand=document.createElement("a");
  brand.className="site-brand";
  brand.href="index.html";
  brand.setAttribute("aria-label","Pal Forge — Início");
  brand.innerHTML='<img src="assets/brand/pal-forge-mark.svg" alt=""><span>Pal Forge</span>';
  header.insertBefore(brand,nav);
  header.insertBefore(mobileToggle,nav);
  const closeGroups=except=>nav.querySelectorAll(".nav-group.is-open").forEach(group=>{
    if(group===except)return;
    group.classList.remove("is-open");
    group.querySelector(".nav-menu-toggle").setAttribute("aria-expanded","false");
  });
  nav.querySelectorAll(".nav-menu-toggle").forEach(button=>{
    const group=button.closest(".nav-group");
    button.addEventListener("click",()=>{
      const open=!group.classList.contains("is-open");
      closeGroups(group);
      group.classList.toggle("is-open",open);
      button.setAttribute("aria-expanded",String(open));
    });
    button.addEventListener("keydown",event=>{
      if(event.key==="ArrowDown"){
        event.preventDefault();
        closeGroups(group);
        group.classList.add("is-open");
        button.setAttribute("aria-expanded","true");
        group.querySelector(".nav-dropdown a")?.focus();
      }
    });
  });
  mobileToggle.addEventListener("click",()=>{
    const open=!nav.classList.contains("is-open");
    nav.classList.toggle("is-open",open);
    mobileToggle.setAttribute("aria-expanded",String(open));
    if(!open)closeGroups();
  });
  document.addEventListener("click",event=>{
    if(nav.contains(event.target)||mobileToggle.contains(event.target))return;
    closeGroups();
    nav.classList.remove("is-open");
    mobileToggle.setAttribute("aria-expanded","false");
  });
  nav.addEventListener("keydown",event=>{
    if(event.key!=="Escape")return;
    const group=document.activeElement?.closest?.(".nav-group");
    closeGroups();
    if(group)group.querySelector(".nav-menu-toggle")?.focus();
    else{
      nav.classList.remove("is-open");
      mobileToggle.setAttribute("aria-expanded","false");
      mobileToggle.focus();
    }
  });
})();
(()=>{
  const page=location.pathname.split("/").pop()||"index.html";
  const links=[
    ["sobre.html","Sobre"],
    ["contato.html","Contato"],
    ["aviso-legal.html","Aviso Legal"]
  ];
  const footer=document.querySelector("footer.home-footer")||document.createElement("footer");
  if(!footer.classList||!document.body)return;
  footer.classList.add("site-footer");
  footer.innerHTML=`<div class="site-footer-copy"><span><strong>Pal Forge</strong><span>Projeto comunitário não oficial de Palworld.</span></div><nav class="site-footer-links" aria-label="Links institucionais">${links.map(([href,label])=>`<a href="${href}"${page===href?' aria-current="page"':""}>${label}</a>`).join("")}<a href="https://github.com/victorfaim/Mutation_explorer" target="_blank" rel="noopener noreferrer">GitHub</a><span>Versão v1.0.0</span></nav>`;
  if(!footer.isConnected)document.body.appendChild(footer);
})();
// O módulo global observa também o conteúdo criado dinamicamente pelas ferramentas.
if(!document.querySelector('script[data-pme-i18n]')){
  const loadI18n=()=>{
    if(document.querySelector('script[data-pme-i18n]'))return;
    const i18nScript=document.createElement("script");
    i18nScript.src="i18n.js?v=20260728-12";
    i18nScript.dataset.pmeI18n="1";
    document.head.appendChild(i18nScript);
  };
  if(window.PME_GAME_L10N)loadI18n();
  else{
    const localizationScript=document.createElement("script");
    localizationScript.src="game-localization-data.js?v=20260728-1";
    localizationScript.onload=loadI18n;
    document.head.appendChild(localizationScript);
  }
}
