
const tierState={
  mode:"general",
  customWeights:null,
  allPals:combatEligiblePals(false),
  ranges:null
};

const modeEl=document.getElementById("tier-mode");
const elementEl=document.getElementById("tier-element");
const searchEl=document.getElementById("tier-search");
const bossEl=document.getElementById("tier-show-boss");

function populateElements(){
  const values=[...new Set(Object.values(PALPEDIA_DATA).flatMap(p=>p.elements||[]))].sort();
  elementEl.insertAdjacentHTML("beforeend",values.map(e=>`<option value="${esc(e)}">${esc(e)}</option>`).join(""));
}

function currentWeights(){
  return tierState.customWeights||COMBAT_MODES[tierState.mode].weights;
}

function renderWeightSliders(){
  const weights=currentWeights();
  document.getElementById("tier-weight-sliders").innerHTML=Object.entries(weights).map(([key,value])=>`
    <label class="tier-weight-row">
      <span>${esc(COMBAT_LABELS[key]||key)}</span>
      <input type="range" min="0" max="100" step="1" value="${value}" data-weight="${key}">
      <b>${value}%</b>
    </label>`).join("");
  updateWeightTotal();
}

function updateWeightTotal(){
  const sliders=[...document.querySelectorAll("[data-weight]")];
  const total=sliders.reduce((sum,input)=>sum+Number(input.value),0);
  document.getElementById("tier-weight-total").textContent=`Total: ${total}%`;
}

function collectWeights(){
  const result={};
  document.querySelectorAll("[data-weight]").forEach(input=>result[input.dataset.weight]=Number(input.value));
  tierState.customWeights=result;
}

function ranking(){
  tierState.allPals=combatEligiblePals(bossEl.checked);
  tierState.ranges=buildCombatRanges(tierState.allPals);

  const q=searchEl.value.trim().toLowerCase();
  const element=elementEl.value;
  const weights=currentWeights();

  return tierState.allPals
    .filter(p=>(!q||p.name.toLowerCase().includes(q))&&(!element||(p.elements||[]).includes(element)))
    .map(p=>({pal:p,result:calculateCombatScore(p,tierState.mode,tierState.ranges,weights)}))
    .sort((a,b)=>b.result.score-a.result.score||a.pal.name.localeCompare(b.pal.name));
}

function tierCard(entry,position){
  const p=entry.pal,r=entry.result;
  return `<a class="tier-pal-card" href="pal.html?pal=${encodeURIComponent(p.slug||p.id)}">
    <span class="tier-position">#${position}</span>
    <div class="tier-pal-avatar">${assetImg(ASSETS.palsDirectory,p.icon,p.name,"tier-pal-image")}</div>
    <div class="tier-pal-info">
      <strong>${esc(p.name)}</strong>
      <span>${(p.elements||[]).map(esc).join(" / ")}</span>
    </div>
    <b class="tier-score">${r.score.toFixed(1)}</b>
    <div class="tier-mini-breakdown">
      ${Object.entries(r.contributions).map(([k,v])=>`<span title="${esc(COMBAT_LABELS[k]||k)}">${v.toFixed(1)}</span>`).join("")}
    </div>
  </a>`;
}

function render(){
  const rows=ranking();
  const grouped={S:[],A:[],B:[],C:[],D:[]};
  rows.forEach((entry,index)=>grouped[combatTierByIndex(index,rows.length)].push({...entry,position:index+1}));

  document.getElementById("tier-count").textContent=rows.length.toLocaleString("pt-BR");
  document.getElementById("tier-summary").innerHTML=Object.entries(grouped).map(([tier,list])=>`
    <div class="tier-summary-card tier-${tier.toLowerCase()}"><strong>${tier}</strong><span>${list.length}</span></div>`).join("");

  document.getElementById("tier-board").innerHTML=Object.entries(grouped).map(([tier,list])=>`
    <section class="tier-row tier-row-${tier.toLowerCase()}">
      <div class="tier-label">${tier}</div>
      <div class="tier-pals">${list.length?list.map(x=>tierCard(x,x.position)).join(""):'<div class="tier-empty">Nenhum Pal neste tier com os filtros atuais.</div>'}</div>
    </section>`).join("");

  activateAssetFallbacks(document.getElementById("tier-board"));
}

modeEl.addEventListener("change",()=>{
  tierState.mode=modeEl.value;
  tierState.customWeights=null;
  renderWeightSliders();
  render();
});
[elementEl,searchEl,bossEl].forEach(el=>el.addEventListener(el===searchEl?"input":"change",render));

document.getElementById("tier-weight-sliders").addEventListener("input",e=>{
  const input=e.target.closest("[data-weight]");
  if(!input)return;
  input.nextElementSibling.textContent=`${input.value}%`;
  collectWeights();
  updateWeightTotal();
  render();
});
document.getElementById("tier-reset-weights").addEventListener("click",()=>{
  tierState.customWeights=null;
  renderWeightSliders();
  render();
});

populateElements();
renderWeightSliders();
render();
