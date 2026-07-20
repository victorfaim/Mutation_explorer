
const workers=workEligiblePals().sort((a,b)=>a.name.localeCompare(b.name));
const ranges=buildWorkRanges(workers);
const list=document.getElementById("work-compare-list");
list.innerHTML=workers.map(p=>`<option value="${esc(p.name)}">`).join("");

const activities=[...new Set(workers.flatMap(p=>Object.keys(canonicalWorkMap(p.work))))].sort();
const activityEl=document.getElementById("work-compare-activity");
activityEl.insertAdjacentHTML("beforeend",activities.map(a=>`<option value="${esc(a)}">${esc(WORK_LABELS[a]||a)}</option>`).join(""));

const aInput=document.getElementById("work-compare-a");
const bInput=document.getElementById("work-compare-b");

function sidePanel(p,side,score,label){
  return `<article class="compare-pal-panel compare-${side}">
    <div class="compare-pal-image">${assetImg(ASSETS.palsDirectory,p.icon,p.name,"compare-pal-img","eager")}</div>
    <span>#${p.index??"—"}${p.suffix||""}</span><h2>${esc(p.name)}</h2>
    <p>${esc(label)}</p><strong>${score.toFixed(1)}</strong>
  </article>`;
}

function workScoreCard(label,aScore,bScore,aName,bName){
  return `<article class="compare-mode-card">
    <span>${esc(label)}</span>
    <div><b>${aScore.toFixed(1)}</b><small>vs</small><b>${bScore.toFixed(1)}</b></div>
    <strong>${aScore===bScore?"Empate":esc(aScore>bScore?aName:bName)}</strong>
  </article>`;
}

function run(){
  const a=workPalByQuery(aInput.value),b=workPalByQuery(bInput.value);
  if(!a||!b){
    document.getElementById("work-compare-empty").innerHTML="<b>Selecione dois Pals válidos.</b>";
    document.getElementById("work-compare-empty").hidden=false;
    document.getElementById("work-compare-result").hidden=true;
    return;
  }
  aInput.value=a.name;bInput.value=b.name;

  const activity=activityEl.value;
  const ag=calculateGeneralWorkScore(a,ranges),bg=calculateGeneralWorkScore(b,ranges);
  const av=calculateVersatility(a,ranges),bv=calculateVersatility(b,ranges);
  const asp=calculateSpecialization(a,ranges),bsp=calculateSpecialization(b,ranges);
  const aa=activity?calculateActivityScore(a,activity,ranges):null;
  const ba=activity?calculateActivityScore(b,activity,ranges):null;
  const mainA=activity?(aa?.score||0):ag.score;
  const mainB=activity?(ba?.score||0):bg.score;
  const label=activity?(WORK_LABELS[activity]||activity):"Trabalho geral";
  const winner=mainA===mainB?"Empate":mainA>mainB?a.name:b.name;

  document.getElementById("work-compare-hero").innerHTML=`
    ${sidePanel(a,"a",mainA,label)}
    <div class="compare-result-center"><span>VENCEDOR</span><strong>${esc(label)}</strong><b>${esc(winner)}</b><small>Diferença: ${Math.abs(mainA-mainB).toFixed(1)}</small></div>
    ${sidePanel(b,"b",mainB,label)}`;

  const scoreCards=[
    workScoreCard("Trabalho geral",ag.score,bg.score,a.name,b.name),
    workScoreCard("Versatilidade",av.score,bv.score,a.name,b.name),
    workScoreCard("Especialização",asp.score,bsp.score,a.name,b.name)
  ];
  if(activity)scoreCards.unshift(workScoreCard(WORK_LABELS[activity]||activity,aa?.score||0,ba?.score||0,a.name,b.name));
  document.getElementById("work-compare-scores").innerHTML=scoreCards.join("");

  const aw=canonicalWorkMap(a.work),bw=canonicalWorkMap(b.work);
  const allActs=[...new Set([...Object.keys(aw),...Object.keys(bw)])].sort();
  document.getElementById("work-compare-grid").innerHTML=allActs.map(act=>{
    const al=aw[act]||0,bl=bw[act]||0;
    return `<div class="work-compare-row">
      <b class="${al>bl?"is-winner":""}">${al||"—"}</b>
      <span>${esc(WORK_LABELS[act]||act)}</span>
      <b class="${bl>al?"is-winner":""}">${bl||"—"}</b>
    </div>`;
  }).join("");

  const statRange={
    craft:ranges.craft,
    run:ranges.run
  };
  const statRow=(label,aVal,bVal,range)=>`
    <div class="compare-stat-row">
      <div class="compare-stat-value ${aVal>bVal?"is-winner":""}"><b>${aVal}</b><div class="compare-stat-bar left"><i style="width:${normalizeWorkValue(aVal,range)}%"></i></div></div>
      <span>${esc(label)}</span>
      <div class="compare-stat-value ${bVal>aVal?"is-winner":""}"><b>${bVal}</b><div class="compare-stat-bar"><i style="width:${normalizeWorkValue(bVal,range)}%"></i></div></div>
    </div>`;
  document.getElementById("work-compare-stats").innerHTML=
    statRow("Work Speed",Number(a.stats?.craftSpeed)||0,Number(b.stats?.craftSpeed)||0,statRange.craft)+
    statRow("Run Speed",Number(a.stats?.runSpeed)||0,Number(b.stats?.runSpeed)||0,statRange.run);

  document.getElementById("work-compare-empty").hidden=true;
  document.getElementById("work-compare-result").hidden=false;
  activateAssetFallbacks(document);
}

document.getElementById("work-compare-run").addEventListener("click",run);
document.getElementById("work-compare-swap").addEventListener("click",()=>{const t=aInput.value;aInput.value=bInput.value;bInput.value=t;if(aInput.value&&bInput.value)run()});
activityEl.addEventListener("change",()=>aInput.value&&bInput.value&&run());
[aInput,bInput].forEach(i=>i.addEventListener("keydown",e=>{if(e.key==="Enter")run()}));
