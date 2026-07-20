
const list=document.getElementById("compare-pal-list");
const comparePals=combatEligiblePals(false).sort((a,b)=>a.name.localeCompare(b.name));
list.innerHTML=comparePals.map(p=>`<option value="${esc(p.name)}">`).join("");

const aInput=document.getElementById("compare-a-search");
const bInput=document.getElementById("compare-b-search");
const modeInput=document.getElementById("compare-mode");

function palPanel(p,side,score){
  return `<article class="compare-pal-panel compare-${side}">
    <div class="compare-pal-image">${assetImg(ASSETS.palsDirectory,p.icon,p.name,"compare-pal-img","eager")}</div>
    <span>#${p.index??"—"}${p.suffix||""}</span>
    <h2>${esc(p.name)}</h2>
    <p>${(p.elements||[]).map(esc).join(" / ")}</p>
    <strong>${score.toFixed(1)}</strong>
  </article>`;
}

function metricRow(label,key,a,b,ranges,higherBetter=true){
  const av=Number((a.stats||{})[key])||0;
  const bv=Number((b.stats||{})[key])||0;
  const an=normalizeCombatValue(av,ranges[key]);
  const bn=normalizeCombatValue(bv,ranges[key]);
  const winner=av===bv?"tie":(higherBetter?(av>bv?"a":"b"):(av<bv?"a":"b"));
  return `<div class="compare-stat-row">
    <div class="compare-stat-value ${winner==="a"?"is-winner":""}"><b>${av.toLocaleString("pt-BR")}</b><div class="compare-stat-bar left"><i style="width:${an}%"></i></div></div>
    <span>${esc(label)}</span>
    <div class="compare-stat-value ${winner==="b"?"is-winner":""}"><b>${bv.toLocaleString("pt-BR")}</b><div class="compare-stat-bar"><i style="width:${bn}%"></i></div></div>
  </div>`;
}

function breakdownColumn(p,result){
  return `<div class="compare-breakdown-column">
    <h3>${esc(p.name)}</h3>
    ${Object.entries(result.contributions).map(([key,value])=>`
      <div class="compare-contribution">
        <span>${esc(COMBAT_LABELS[key]||key)}</span>
        <div><i style="width:${Math.min(100,value*2.5)}%"></i></div>
        <b>${value.toFixed(1)}</b>
      </div>`).join("")}
  </div>`;
}

function runCompare(){
  const a=combatPalByQuery(aInput.value);
  const b=combatPalByQuery(bInput.value);
  if(!a||!b){
    document.getElementById("compare-empty").innerHTML="<b>Selecione dois Pals válidos.</b>";
    document.getElementById("compare-empty").hidden=false;
    document.getElementById("compare-result").hidden=true;
    return;
  }

  aInput.value=a.name;
  bInput.value=b.name;

  const all=combatEligiblePals(false);
  const ranges=buildCombatRanges(all);
  const mode=modeInput.value;
  const ar=calculateCombatScore(a,mode,ranges);
  const br=calculateCombatScore(b,mode,ranges);
  const winner=ar.score===br.score?"Empate":ar.score>br.score?a.name:b.name;

  document.getElementById("compare-hero").innerHTML=`
    ${palPanel(a,"a",ar.score)}
    <div class="compare-result-center"><span>VENCEDOR NO MODO</span><strong>${esc(COMBAT_MODES[mode].label)}</strong><b>${esc(winner)}</b><small>Diferença: ${Math.abs(ar.score-br.score).toFixed(1)} pontos</small></div>
    ${palPanel(b,"b",br.score)}`;

  document.getElementById("compare-modes").innerHTML=Object.entries(COMBAT_MODES).map(([key,cfg])=>{
    const as=calculateCombatScore(a,key,ranges).score;
    const bs=calculateCombatScore(b,key,ranges).score;
    return `<article class="compare-mode-card${key===mode?" is-active":""}">
      <span>${esc(cfg.label)}</span>
      <div><b>${as.toFixed(1)}</b><small>vs</small><b>${bs.toFixed(1)}</b></div>
      <strong>${as===bs?"Empate":esc(as>bs?a.name:b.name)}</strong>
    </article>`;
  }).join("");

  document.getElementById("compare-stats").innerHTML=[
    ["HP","hp"],["Shot Attack","shot"],["Melee Attack","melee"],["Defense","defense"],
    ["Stamina","stamina"],["Run Speed","runSpeed"],["Ride Sprint","rideSprintSpeed"]
  ].map(([label,key])=>metricRow(label,key,a,b,ranges)).join("");

  document.getElementById("compare-breakdown").innerHTML=breakdownColumn(a,ar)+breakdownColumn(b,br);

  document.getElementById("compare-empty").hidden=true;
  document.getElementById("compare-result").hidden=false;
  activateAssetFallbacks(document.getElementById("compare-result"));
}

document.getElementById("compare-run").addEventListener("click",runCompare);
document.getElementById("compare-swap").addEventListener("click",()=>{
  const temp=aInput.value;aInput.value=bInput.value;bInput.value=temp;
  if(aInput.value&&bInput.value)runCompare();
});
modeInput.addEventListener("change",()=>aInput.value&&bInput.value&&runCompare());
[aInput,bInput].forEach(input=>input.addEventListener("keydown",e=>{if(e.key==="Enter")runCompare()}));

const params=new URLSearchParams(location.search);
if(params.get("a"))aInput.value=params.get("a");
if(params.get("b"))bInput.value=params.get("b");
if(aInput.value&&bInput.value)runCompare();
