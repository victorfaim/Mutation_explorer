const qs=id=>document.getElementById(id);

function tierGroups(rows,tierFn){
  const grouped={S:[],A:[],B:[],C:[],D:[]};
  rows.forEach((entry,index)=>grouped[tierFn(index,rows.length)].push({...entry,position:index+1}));
  return grouped;
}
function renderSummary(target,grouped){
  target.innerHTML=Object.entries(grouped).map(([tier,list])=>`<div class="tier-summary-card tier-${tier.toLowerCase()}"><strong>${tier}</strong><span>${list.length}</span></div>`).join("");
}
function renderBoard(target,grouped,card){
  target.innerHTML=Object.entries(grouped).map(([tier,list])=>`<section class="tier-row tier-row-${tier.toLowerCase()}"><div class="tier-label">${tier}</div><div class="tier-pals">${list.length?list.map(card).join(""):'<div class="tier-empty">Nenhum Pal neste tier com os filtros atuais.</div>'}</div></section>`).join("");
  activateAssetFallbacks(target);
}

const combatState={mode:"general",customWeights:null,allPals:combatEligiblePals(false),ranges:null};
const combatMode=qs("tier-mode"),combatElement=qs("tier-element"),combatSearch=qs("tier-search"),combatBoss=qs("tier-show-boss");
const combatElements=[...new Set(Object.values(PALPEDIA_DATA).flatMap(p=>p.elements||[]))].sort();
combatElement.insertAdjacentHTML("beforeend",combatElements.map(e=>`<option value="${esc(e)}">${esc(e)}</option>`).join(""));

function combatWeights(){return combatState.customWeights||COMBAT_MODES[combatState.mode].weights;}
function renderCombatWeights(){
  qs("tier-weight-sliders").innerHTML=Object.entries(combatWeights()).map(([key,value])=>`<label class="tier-weight-row"><span>${esc(COMBAT_LABELS[key]||key)}</span><input type="range" min="0" max="100" step="1" value="${value}" data-weight="${key}"><b>${value}%</b></label>`).join("");
  updateCombatWeightTotal();
}
function updateCombatWeightTotal(){qs("tier-weight-total").textContent=`Total: ${[...document.querySelectorAll("[data-weight]")].reduce((sum,input)=>sum+Number(input.value),0)}%`;}
function combatRanking(){
  combatState.allPals=combatEligiblePals(combatBoss.checked);combatState.ranges=buildCombatRanges(combatState.allPals);
  const q=combatSearch.value.trim().toLowerCase(),element=combatElement.value,weights=combatWeights();
  return combatState.allPals.filter(p=>(!q||p.name.toLowerCase().includes(q))&&(!element||(p.elements||[]).includes(element))).map(p=>({pal:p,result:calculateCombatScore(p,combatState.mode,combatState.ranges,weights)})).sort((a,b)=>b.result.score-a.result.score||a.pal.name.localeCompare(b.pal.name));
}
function combatCard(entry){const p=entry.pal,r=entry.result;return `<a class="tier-pal-card" href="pal.html?pal=${encodeURIComponent(p.slug||p.id)}"><span class="tier-position">#${entry.position}</span><div class="tier-pal-avatar">${assetImg(ASSETS.palsDirectory,p.icon,p.name,"tier-pal-image")}</div><div class="tier-pal-info"><strong>${esc(p.name)}</strong><span>${(p.elements||[]).map(esc).join(" / ")}</span></div><b class="tier-score">${r.score.toFixed(1)}</b><div class="tier-mini-breakdown">${Object.entries(r.contributions).map(([k,v])=>`<span title="${esc(COMBAT_LABELS[k]||k)}">${v.toFixed(1)}</span>`).join("")}</div></a>`;}
function renderCombat(){const rows=combatRanking(),grouped=tierGroups(rows,combatTierByIndex);qs("tier-count").textContent=rows.length.toLocaleString("pt-BR");renderSummary(qs("tier-summary"),grouped);renderBoard(qs("tier-board"),grouped,combatCard);}
combatMode.addEventListener("change",()=>{combatState.mode=combatMode.value;combatState.customWeights=null;renderCombatWeights();renderCombat();});
[combatElement,combatSearch,combatBoss].forEach(el=>el.addEventListener(el===combatSearch?"input":"change",renderCombat));
qs("tier-weight-sliders").addEventListener("input",e=>{const input=e.target.closest("[data-weight]");if(!input)return;input.nextElementSibling.textContent=`${input.value}%`;combatState.customWeights={};document.querySelectorAll("[data-weight]").forEach(x=>combatState.customWeights[x.dataset.weight]=Number(x.value));updateCombatWeightTotal();renderCombat();});
qs("tier-reset-weights").addEventListener("click",()=>{combatState.customWeights=null;renderCombatWeights();renderCombat();});

const workers=workEligiblePals(),workRanges=buildWorkRanges(workers);
const workActivities=[...new Set(workers.flatMap(p=>Object.keys(canonicalWorkMap(p.work))))].sort();
const workMode=qs("work-mode"),workActivity=qs("work-activity"),workSearch=qs("work-search"),selectedActivities=new Set();
let workView="single";
workActivity.insertAdjacentHTML("beforeend",workActivities.map(a=>`<option value="${esc(a)}">${esc(WORK_LABELS[a]||a)}</option>`).join(""));
qs("finder-activities").innerHTML=workActivities.map(a=>`<label class="finder-activity-chip"><input type="checkbox" value="${esc(a)}"><span>${esc(WORK_LABELS[a]||a)}</span></label>`).join("");

function workDescription(mode){if(mode==="general")return "Equilibra os três melhores desempenhos do Pal com sua versatilidade.";if(mode==="versatility")return "Valoriza quantidade de aptidões, níveis relativos e velocidade de trabalho.";if(mode==="specialization")return "Destaca o melhor desempenho individual do Pal, com pequena penalização por excesso de funções.";return "O nível da aptidão é dominante, complementado por Work Speed e mobilidade conforme a função.";}
function singleWorkScore(pal){
  const activity=workActivity.value,mode=workMode.value;if(activity){const detail=calculateActivityScore(pal,activity,workRanges);return detail?{score:detail.score,detail}:null;}
  const detail=mode==="versatility"?calculateVersatility(pal,workRanges):mode==="specialization"?calculateSpecialization(pal,workRanges):calculateGeneralWorkScore(pal,workRanges);return {score:detail.score,detail};
}
function singleWorkMeta(entry){const mode=workMode.value,activity=workActivity.value,d=entry.result.detail;if(activity)return `${WORK_LABELS[activity]||activity} Lv ${d.level}`;if(mode==="versatility")return `${d.count} aptidões · ${d.totalLevels} níveis`;if(mode==="specialization")return `${WORK_LABELS[d.activity]||d.activity} Lv ${d.level}`;return `Top 3: ${d.specialistAverage.toFixed(1)} · Versátil: ${d.versatility.toFixed(1)}`;}
function mobilityMultiplier(){const mode=qs("finder-mobility").value;return mode==="high"?1.35:mode==="low"?.65:1;}
function multiWorkScore(pal){
  const work=canonicalWorkMap(pal.work),acts=[...selectedActivities],available=acts.filter(a=>(work[a]||0)>0);if(!acts.length||qs("finder-require-all").checked&&available.length!==acts.length||!available.length)return null;
  const scores=available.map(activity=>{const profile={...(WORK_PROFILES[activity]||{level:80,craft:15,mobility:5})};profile.mobility*=mobilityMultiplier();return {activity,result:calculateActivityScore(pal,activity,workRanges,profile)};});
  const average=scores.reduce((sum,x)=>sum+x.result.score,0)/scores.length,coverage=available.length/acts.length*100,versatility=calculateVersatility(pal,workRanges).score;
  return {score:average*.72+coverage*.20+versatility*.08,average,coverage,scores,available};
}
function multiWorkMeta(entry){return `${entry.result.available.length}/${selectedActivities.size} aptidões · ${entry.result.scores.map(x=>`${WORK_LABELS[x.activity]||x.activity} Lv ${x.result.level}`).join(" · ")}`;}
function workRanking(){const multi=workView==="multi",q=(multi?qs("finder-search"):workSearch).value.trim().toLowerCase();return workers.filter(p=>!q||p.name.toLowerCase().includes(q)).map(p=>({pal:p,result:multi?multiWorkScore(p):singleWorkScore(p)})).filter(x=>x.result).sort((a,b)=>b.result.score-a.result.score||a.pal.name.localeCompare(b.pal.name));}
function workMeta(entry){return workView==="multi"?multiWorkMeta(entry):singleWorkMeta(entry);}
function workCard(entry){const p=entry.pal;return `<a class="tier-pal-card" href="pal.html?pal=${encodeURIComponent(p.slug||p.id)}"><span class="tier-position">#${entry.position}</span><div class="tier-pal-avatar">${assetImg(ASSETS.palsDirectory,p.icon,p.name,"tier-pal-image")}</div><div class="tier-pal-info"><strong>${esc(p.name)}</strong><span>${esc(workMeta(entry))}</span></div><b class="tier-score">${entry.result.score.toFixed(1)}</b></a>`;}
function renderWorkPodium(rows){const medals=["🥇","🥈","🥉"];qs("work-podium").innerHTML=rows.slice(0,3).map((entry,index)=>`<a class="work-podium-card podium-${index+1}" href="pal.html?pal=${encodeURIComponent(entry.pal.slug||entry.pal.id)}"><span>${medals[index]}</span><div>${assetImg(ASSETS.palsDirectory,entry.pal.icon,entry.pal.name,"work-podium-image")}</div><strong>${esc(entry.pal.name)}</strong><b>${entry.result.score.toFixed(1)}</b><small>${esc(workMeta(entry))}</small></a>`).join("");}
function renderWork(){
  const empty=qs("finder-empty");if(workView==="multi"&&!selectedActivities.size){qs("work-count").textContent="0";qs("work-podium").innerHTML="";qs("work-summary").innerHTML="";qs("work-board").innerHTML="";empty.hidden=false;qs("work-mode-description").textContent="Escolha as aptidões que o Pal deve combinar.";qs("work-method-text").textContent="A nota combina desempenho nas aptidões selecionadas, cobertura e versatilidade.";return;}
  empty.hidden=true;const rows=workRanking(),grouped=tierGroups(rows,workTierByIndex);qs("work-count").textContent=rows.length.toLocaleString("pt-BR");
  qs("work-mode-description").textContent=workView==="multi"?`${selectedActivities.size} aptidão(ões) selecionada(s). A nota premia desempenho, cobertura e versatilidade.`:workDescription(workActivity.value?"activity":workMode.value);
  qs("work-method-text").textContent=workView==="multi"?"72% da média nas aptidões selecionadas, 20% da cobertura e 8% da versatilidade. A opção de mobilidade ajusta o peso de deslocamento.":workDescription(workActivity.value?"activity":workMode.value);
  renderWorkPodium(rows);renderSummary(qs("work-summary"),grouped);renderBoard(qs("work-board"),grouped,workCard);activateAssetFallbacks(document);
}
[workMode,workActivity].forEach(el=>el.addEventListener("change",renderWork));workSearch.addEventListener("input",renderWork);qs("finder-search").addEventListener("input",renderWork);[qs("finder-require-all"),qs("finder-mobility")].forEach(el=>el.addEventListener("change",renderWork));
qs("finder-activities").addEventListener("change",e=>{const input=e.target.closest('input[type="checkbox"]');if(!input)return;input.checked?selectedActivities.add(input.value):selectedActivities.delete(input.value);renderWork();});

function setWorkView(view){workView=view;document.querySelectorAll("[data-work-view]").forEach(b=>b.classList.toggle("is-active",b.dataset.workView===view));qs("work-single-controls").hidden=view!=="single";qs("work-multi-controls").hidden=view!=="multi";renderWork();}
function setMainTab(tab){document.querySelectorAll("[data-tier-tab]").forEach(b=>b.classList.toggle("is-active",b.dataset.tierTab===tab));document.querySelectorAll("[data-tier-panel]").forEach(p=>p.hidden=p.dataset.tierPanel!==tab);const url=new URL(location.href);tab==="work"?url.searchParams.set("tab","work"):url.searchParams.delete("tab");history.replaceState(null,"",url);}
document.querySelectorAll("[data-tier-tab]").forEach(b=>b.addEventListener("click",()=>setMainTab(b.dataset.tierTab)));document.querySelectorAll("[data-work-view]").forEach(b=>b.addEventListener("click",()=>setWorkView(b.dataset.workView)));
const params=new URLSearchParams(location.search);renderCombatWeights();renderCombat();if(params.get("activity")&&workActivities.includes(params.get("activity")))workActivity.value=params.get("activity");setWorkView(params.get("multi")==="1"?"multi":"single");setMainTab(params.get("tab")==="work"?"work":"combat");
