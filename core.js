
const PALS=window.PAL_DATA;
const PARENT_IDS=window.PARENT_IDS;
const NORMAL_NEAREST=window.NORMAL_NEAREST;
const MUTATION_NEAREST=window.MUTATION_NEAREST;
const UNIQUE_PAIRS=window.UNIQUE_PAIRS;
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
function normalChild(a,b){
  const special=UNIQUE_PAIRS[a.id+"|"+b.id];
  if(special)return PALS[special];
  if(a.id===b.id)return a;
  return PALS[NORMAL_NEAREST[(a.combiRank+b.combiRank+1)>>1]];
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

function itemIconUrl(item){
  return item?.icon?localAssetUrl(ASSETS.itemsDirectory,item.icon):"";
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
  return `<span class="pal-chip ${extraClass}">${p.icon?assetImg(ASSETS.palsDirectory,p.icon,"",""):""}<span>${esc(p.name)}</span></span>`;
}

const assetFallbackObserver=new MutationObserver(()=>activateAssetFallbacks(document));
if(document.documentElement){
  assetFallbackObserver.observe(document.documentElement,{childList:true,subtree:true});
}
document.addEventListener("DOMContentLoaded",()=>activateAssetFallbacks(document));
// Navegação canônica após a reorganização das ferramentas.
(()=>{
  const nav=document.querySelector("header nav");
  if(!nav)return;
  const page=location.pathname.split("/").pop()||"index.html";
  const links=[
    ["index.html","Início",["index.html",""]],
    ["reverso.html","Mutação reversa",["reverso.html"]],
    ["caminho.html","Caminho de breeding",["caminho.html"]],
    ["palpedia.html","Palpedia",["palpedia.html","pal.html"]],
    ["partner-skills.html","Partner Skills",["partner-skills.html"]],
    ["itens.html","Itens",["itens.html","item.html"]],
    ["tierlist.html","Tier List",["tierlist.html"]],
    ["comparador.html","Comparador Combate",["comparador.html"]],
    ["team-builder.html","Team Builder",["team-builder.html"]]
  ];
  nav.innerHTML=links.map(([href,label,pages])=>`<a${pages.includes(page)?' class="active"':''} href="${href}">${label}</a>`).join("");
})();
// O módulo global observa também o conteúdo criado dinamicamente pelas ferramentas.
if(!document.querySelector('script[data-pme-i18n]')){
  const i18nScript=document.createElement("script");
  i18nScript.src="i18n.js?v=20260720-26";
  i18nScript.dataset.pmeI18n="1";
  document.head.appendChild(i18nScript);
}
