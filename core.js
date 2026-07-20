
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


const ICON_BASE="https://palbreed.com/images/full_palicon/";
function palIconUrl(p){return p&&p.icon?ICON_BASE+encodeURIComponent(p.icon)+".png":""}
function palChip(p,extraClass=""){
  if(!p)return "—";
  const src=palIconUrl(p);
  return `<span class="pal-chip ${extraClass}">${src?`<img loading="lazy" decoding="async" src="${src}" alt="" onerror="this.style.display='none'">`:""}<span>${esc(p.name)}</span></span>`;
}
