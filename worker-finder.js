
const workers=workEligiblePals();
const ranges=buildWorkRanges(workers);
const activities=[...new Set(workers.flatMap(p=>Object.keys(canonicalWorkMap(p.work))))].sort();
const selected=new Set();

document.getElementById("finder-activities").innerHTML=activities.map(a=>`
  <label class="finder-activity-chip">
    <input type="checkbox" value="${esc(a)}">
    <span>${esc(WORK_LABELS[a]||a)}</span>
  </label>`).join("");

function mobilityMultiplier(){
  const mode=document.getElementById("finder-mobility").value;
  return mode==="high"?1.35:mode==="low"?.65:1;
}

function scorePal(pal){
  const work=canonicalWorkMap(pal.work);
  const acts=[...selected];
  const available=acts.filter(a=>(work[a]||0)>0);
  const requireAll=document.getElementById("finder-require-all").checked;
  if(requireAll&&available.length!==acts.length)return null;
  if(!available.length)return null;

  const scores=available.map(activity=>{
    const profile={...(WORK_PROFILES[activity]||{level:80,craft:15,mobility:5})};
    profile.mobility*=mobilityMultiplier();
    const result=calculateActivityScore(pal,activity,ranges,profile);
    return {activity,result};
  });

  const average=scores.reduce((sum,x)=>sum+x.result.score,0)/scores.length;
  const coverage=available.length/acts.length*100;
  const versatility=calculateVersatility(pal,ranges).score;
  const final=average*.72+coverage*.20+versatility*.08;
  return {score:final,average,coverage,scores,available};
}

function resultCard(entry,index){
  const p=entry.pal,r=entry.result;
  return `<article class="finder-card">
    <div class="finder-rank">#${index+1}</div>
    <a class="finder-pal" href="pal.html?pal=${encodeURIComponent(p.slug||p.id)}">
      <div>${assetImg(ASSETS.palsDirectory,p.icon,p.name,"finder-pal-image")}</div>
      <section><h2>${esc(p.name)}</h2><span>${r.available.length}/${selected.size} aptidões cobertas</span></section>
    </a>
    <div class="finder-score"><span>Score</span><b>${r.score.toFixed(1)}</b></div>
    <div class="finder-suitabilities">${r.scores.map(x=>`
      <span><b>${esc(WORK_LABELS[x.activity]||x.activity)}</b> Lv ${x.result.level} · ${x.result.score.toFixed(1)}</span>`).join("")}</div>
  </article>`;
}

function render(){
  const empty=document.getElementById("finder-empty");
  const results=document.getElementById("finder-results");
  if(!selected.size){
    empty.hidden=false;results.innerHTML="";document.getElementById("finder-count").textContent="0";return;
  }

  const q=document.getElementById("finder-search").value.trim().toLowerCase();
  const rows=workers.filter(p=>!q||p.name.toLowerCase().includes(q))
    .map(p=>({pal:p,result:scorePal(p)})).filter(x=>x.result)
    .sort((a,b)=>b.result.score-a.result.score||a.pal.name.localeCompare(b.pal.name));

  document.getElementById("finder-count").textContent=rows.length.toLocaleString("pt-BR");
  empty.hidden=rows.length>0;
  empty.textContent=rows.length?"":"Nenhum Pal atende aos critérios selecionados.";
  results.innerHTML=rows.map(resultCard).join("");
  activateAssetFallbacks(results);
}

document.getElementById("finder-activities").addEventListener("change",e=>{
  const input=e.target.closest('input[type="checkbox"]');
  if(!input)return;
  input.checked?selected.add(input.value):selected.delete(input.value);
  render();
});
["finder-require-all","finder-mobility"].forEach(id=>document.getElementById(id).addEventListener("change",render));
document.getElementById("finder-search").addEventListener("input",render);
render();
