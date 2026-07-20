
const allWorkers=workEligiblePals();
const ranges=buildWorkRanges(allWorkers);
const modeEl=document.getElementById("work-mode");
const activityEl=document.getElementById("work-activity");
const searchEl=document.getElementById("work-search");

const activities=[...new Set(allWorkers.flatMap(p=>Object.keys(canonicalWorkMap(p.work))))].sort();
activityEl.insertAdjacentHTML("beforeend",activities.map(a=>`<option value="${esc(a)}">${esc(WORK_LABELS[a]||a)}</option>`).join(""));

function modeDescription(mode){
  if(mode==="general")return "Equilibra os três melhores desempenhos do Pal com sua versatilidade.";
  if(mode==="versatility")return "Valoriza quantidade de aptidões, níveis relativos e velocidade de trabalho.";
  if(mode==="specialization")return "Destaca o melhor desempenho individual do Pal, com pequena penalização por excesso de funções.";
  return "O nível da aptidão é dominante, complementado por Work Speed e mobilidade conforme a função.";
}

function scoreWorker(pal,mode,activity){
  if(activity){
    const result=calculateActivityScore(pal,activity,ranges);
    return result?{score:result.score,detail:result}:null;
  }
  if(mode==="versatility"){
    const detail=calculateVersatility(pal,ranges);
    return {score:detail.score,detail};
  }
  if(mode==="specialization"){
    const detail=calculateSpecialization(pal,ranges);
    return {score:detail.score,detail};
  }
  const detail=calculateGeneralWorkScore(pal,ranges);
  return {score:detail.score,detail};
}

function ranking(){
  const q=searchEl.value.trim().toLowerCase();
  const mode=modeEl.value;
  const activity=activityEl.value;
  return allWorkers
    .filter(p=>!q||p.name.toLowerCase().includes(q))
    .map(p=>({pal:p,result:scoreWorker(p,mode,activity)}))
    .filter(x=>x.result)
    .sort((a,b)=>b.result.score-a.result.score||a.pal.name.localeCompare(b.pal.name));
}

function workerMeta(entry){
  const mode=modeEl.value,activity=activityEl.value,d=entry.result.detail;
  if(activity)return `${WORK_LABELS[activity]||activity} Lv ${d.level}`;
  if(mode==="versatility")return `${d.count} aptidões · ${d.totalLevels} níveis`;
  if(mode==="specialization")return `${WORK_LABELS[d.activity]||d.activity} Lv ${d.level}`;
  return `Top 3: ${d.specialistAverage.toFixed(1)} · Versátil: ${d.versatility.toFixed(1)}`;
}

function card(entry,position){
  const p=entry.pal;
  return `<a class="tier-pal-card" href="pal.html?pal=${encodeURIComponent(p.slug||p.id)}">
    <span class="tier-position">#${position}</span>
    <div class="tier-pal-avatar">${assetImg(ASSETS.palsDirectory,p.icon,p.name,"tier-pal-image")}</div>
    <div class="tier-pal-info"><strong>${esc(p.name)}</strong><span>${esc(workerMeta(entry))}</span></div>
    <b class="tier-score">${entry.result.score.toFixed(1)}</b>
  </a>`;
}

function renderPodium(rows){
  const medals=["🥇","🥈","🥉"];
  document.getElementById("work-podium").innerHTML=rows.slice(0,3).map((entry,index)=>`
    <a class="work-podium-card podium-${index+1}" href="pal.html?pal=${encodeURIComponent(entry.pal.slug||entry.pal.id)}">
      <span>${medals[index]}</span>
      <div>${assetImg(ASSETS.palsDirectory,entry.pal.icon,entry.pal.name,"work-podium-image")}</div>
      <strong>${esc(entry.pal.name)}</strong>
      <b>${entry.result.score.toFixed(1)}</b>
      <small>${esc(workerMeta(entry))}</small>
    </a>`).join("");
}

function render(){
  const rows=ranking();
  const grouped={S:[],A:[],B:[],C:[],D:[]};
  rows.forEach((entry,index)=>grouped[workTierByIndex(index,rows.length)].push({...entry,position:index+1}));

  document.getElementById("work-count").textContent=rows.length.toLocaleString("pt-BR");
  document.getElementById("work-mode-description").textContent=modeDescription(activityEl.value?"activity":modeEl.value);
  document.getElementById("work-method-text").textContent=activityEl.value
    ? `Para ${WORK_LABELS[activityEl.value]||activityEl.value}, o nível da aptidão recebe o maior peso. Work Speed e Run Speed complementam o cálculo conforme o perfil da função.`
    : modeDescription(modeEl.value);

  renderPodium(rows);
  document.getElementById("work-summary").innerHTML=Object.entries(grouped).map(([tier,list])=>`
    <div class="tier-summary-card tier-${tier.toLowerCase()}"><strong>${tier}</strong><span>${list.length}</span></div>`).join("");

  document.getElementById("work-board").innerHTML=Object.entries(grouped).map(([tier,list])=>`
    <section class="tier-row tier-row-${tier.toLowerCase()}">
      <div class="tier-label">${tier}</div>
      <div class="tier-pals">${list.length?list.map(x=>card(x,x.position)).join(""):'<div class="tier-empty">Nenhum Pal neste tier.</div>'}</div>
    </section>`).join("");

  activateAssetFallbacks(document);
}

modeEl.addEventListener("change",render);
activityEl.addEventListener("change",render);
searchEl.addEventListener("input",render);
render();
