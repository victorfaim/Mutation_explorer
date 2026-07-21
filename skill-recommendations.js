// Medições opcionais por nome: {castTime, hits, smallPower, largePower, source}.
// Sem uma medição, o sistema usa somente os dados oficiais presentes na base local.
window.SKILL_COMBAT_METRICS=window.SKILL_COMBAT_METRICS||{};

const SKILL_LOADOUT_MODES={
  balanced:{label:"Equilibrado",description:"Boa rotação, STAB e alcance para uso geral."},
  damage:{label:"Maior dano",description:"Prioriza poder e pressão ofensiva."},
  coverage:{label:"Cobertura",description:"Favorece elementos diferentes sem abandonar eficiência."},
  boss:{label:"Contra bosses",description:"Valoriza dano forte, alcance e constância contra alvos resistentes."}
};

function skillMetric(skill){
  const measured=SKILL_COMBAT_METRICS[skill.name]||{};
  const hits=Math.max(1,Number(measured.hits)||1);
  const effectivePower=Number(measured.largePower)||Number(skill.power||0)*hits;
  const castTime=Number(measured.castTime)||null;
  const cycle=Math.max(1,Number(skill.cooldown)||1,castTime||0);
  return {measured:Object.keys(measured).length>0,hits,effectivePower,castTime,dps:effectivePower/cycle,source:measured.source||""};
}

function normalized(value,min,max){return max===min?1:(value-min)/(max-min);}

function skillLoadoutScore(pal,skills,mode){
  const rows=skills.map(skill=>({skill,metric:skillMetric(skill)}));
  const powers=pal.actives.map(a=>skillMetric(a).effectivePower),dpsValues=pal.actives.map(a=>skillMetric(a).dps);
  const pMin=Math.min(...powers),pMax=Math.max(...powers),dMin=Math.min(...dpsValues),dMax=Math.max(...dpsValues);
  let total=0;
  rows.forEach(({skill,metric})=>{
    const power=normalized(metric.effectivePower,pMin,pMax)*100,dps=normalized(metric.dps,dMin,dMax)*100;
    const stab=(pal.elements||[]).includes(skill.element)?1:0;
    const range=Math.min(1,Number(skill.maxRange||0)/5000);
    const quick=1-Math.min(1,Number(skill.cooldown||0)/30);
    if(mode==="damage")total+=power*.58+dps*.30+stab*9+range*3;
    else if(mode==="boss")total+=power*.42+dps*.38+stab*10+range*10;
    else if(mode==="coverage")total+=dps*.48+power*.22+stab*12+range*8+quick*10;
    else total+=dps*.42+power*.25+stab*15+range*8+quick*10;
  });
  const elements=new Set(skills.map(s=>s.element)).size;
  const cooldowns=skills.map(s=>Number(s.cooldown)||0);
  const hasQuick=cooldowns.some(x=>x<=4),hasHeavy=cooldowns.some(x=>x>=12);
  if(mode==="coverage")total+=elements*24;
  else if(mode==="balanced")total+=elements*8+(hasQuick?18:0)+(hasHeavy?8:0);
  else if(mode==="boss")total+=(hasQuick?12:0);
  return total;
}

function combinations(items,size){
  const out=[];
  function walk(start,current){if(current.length===size){out.push(current.slice());return;}for(let i=start;i<=items.length-(size-current.length);i++){current.push(items[i]);walk(i+1,current);current.pop();}}
  walk(0,[]);return out;
}

function recommendSkillLoadout(pal,mode="balanced"){
  const skills=(pal.actives||[]).filter(a=>Number.isFinite(Number(a.power))&&Number.isFinite(Number(a.cooldown)));
  if(skills.length<=3)return skills;
  return combinations(skills,3).map(set=>({set,score:skillLoadoutScore(pal,set,mode)})).sort((a,b)=>b.score-a.score)[0].set;
}

function skillReason(pal,skill,metric){
  const tags=[];
  if((pal.elements||[]).includes(skill.element))tags.push("STAB");
  if(Number(skill.cooldown)<=4)tags.push("Rotação rápida");
  if(Number(skill.power)>=300)tags.push("Alto poder");
  if(Number(skill.maxRange)>=4000)tags.push("Longo alcance");
  if(metric.hits>1)tags.push(`${metric.hits} acertos`);
  return tags.length?tags:["Complementa o conjunto"];
}

function skillRecommendationsPanel(pal){
  if(!(pal.actives||[]).length)return "";
  return `<section class="skill-recommendations" data-skill-recommendations>
    <div class="skill-recommendation-heading"><div><span class="paldex-eyebrow">SUGESTÃO DE COMBATE</span><h2>Conjunto recomendado</h2></div><span class="skill-estimate-badge">Estimativa matemática</span></div>
    <div class="skill-mode-tabs">${Object.entries(SKILL_LOADOUT_MODES).map(([id,m],i)=>`<button type="button" class="${i===0?"is-active":""}" data-skill-mode="${id}">${m.label}</button>`).join("")}</div>
    <p class="muted" data-skill-description>${SKILL_LOADOUT_MODES.balanced.description}</p>
    <div class="skill-loadout" data-skill-loadout></div>
    <p class="skill-estimate-note">A nota considera Power, cooldown, elemento do Pal, cobertura e alcance. Tempo de animação, múltiplos acertos e precisão da IA só entram quando houver medição registrada.</p>
  </section>`;
}

function initSkillRecommendations(pal,root=document){
  const panel=root.querySelector("[data-skill-recommendations]");if(!panel)return;
  const render=mode=>{
    const loadout=recommendSkillLoadout(pal,mode);
    panel.querySelector("[data-skill-description]").textContent=SKILL_LOADOUT_MODES[mode].description;
    panel.querySelector("[data-skill-loadout]").innerHTML=loadout.map((skill,index)=>{const metric=skillMetric(skill);return `<article class="skill-loadout-card"><span class="skill-slot">${index+1}</span><div class="skill-loadout-title"><span>${ELEMENT_ICONS[skill.element]||"◆"}</span><div><strong>${esc(skill.name)}</strong><small>${esc(skill.element)}</small></div></div><div class="skill-loadout-stats"><span>Power <b>${metric.effectivePower}</b></span><span>CT <b>${skill.cooldown}s</b></span><span>DPS <b>~${metric.dps.toFixed(1)}</b></span></div><div class="skill-reason-tags">${skillReason(pal,skill,metric).map(x=>`<span>${esc(x)}</span>`).join("")}</div></article>`;}).join("");
  };
  panel.querySelectorAll("[data-skill-mode]").forEach(button=>button.addEventListener("click",()=>{panel.querySelectorAll("[data-skill-mode]").forEach(b=>b.classList.toggle("is-active",b===button));render(button.dataset.skillMode);}));render("balanced");
}
