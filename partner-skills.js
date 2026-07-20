const PARTNER_CATEGORY_LABELS={combat:"Combate",support:"Suporte",base:"Base e rancho",drops:"Drops e captura",exploration:"Exploração",mount:"Montaria"};
const PARTNER_ACTIVATION_LABELS={party:"Na equipe",active:"Ao ativar",mounted:"Enquanto montado",base:"Na base",ranch:"No rancho"};
const PARTNER_TAG_LABELS={base:"Base",shield:"Escudo",eggs:"Produção",firearms:"Arma de fogo",combat:"Combate",glider:"Planador",healing:"Cura",weight:"Capacidade/peso",melee:"Corpo a corpo",mobility:"Mobilidade",drops:"Drops",fishing:"Pesca",capture:"Captura",insulation:"Isolamento",bow:"Arco"};
const ELEMENT_LABELS={normal:"Normal",fire:"Fogo",water:"Água",earth:"Terra",ice:"Gelo",electricity:"Elétrico",leaf:"Planta",dark:"Sombrio",dragon:"Dragão"};
function unique(values){return [...new Set(values.filter(Boolean))];}
function classifyPartnerSkill(pal){
  const skill=pal.partnerSkill||{},desc=skill.desc||"",text=desc.toLowerCase(),tags=skill.tags||[];
  const activations=[];
  if(text.includes("while in party"))activations.push("party");
  if(text.includes("when activated"))activations.push("active");
  if(text.includes("while mounted"))activations.push("mounted");
  if(text.includes("while at a base")||text.includes("at a base"))activations.push("base");
  if(text.includes("assigned to ranch"))activations.push("ranch");
  const elements=unique(tags.filter(t=>t.startsWith("boost-")||t.startsWith("resist-")).map(t=>t.split("-").slice(1).join("-"))
    .concat([...desc.matchAll(/\[elem:([^\]]+)\]/gi)].map(m=>m[1].toLowerCase())));
  const categories=[];
  if(tags.some(t=>["combat","firearms","melee","bow","shield"].includes(t))||/damage|attack|enemy|weapon/.test(text))categories.push("combat");
  if(tags.some(t=>["healing","weight","insulation"].includes(t))||/health|defense|cooldown|stamina/.test(text))categories.push("support");
  if(tags.some(t=>["base","eggs"].includes(t))||activations.some(a=>a==="base"||a==="ranch"))categories.push("base");
  if(tags.some(t=>["drops","capture"].includes(t))||/drop[s ]|capture/.test(text))categories.push("drops");
  if(tags.some(t=>["glider","mobility","fishing"].includes(t))||/movement speed|glid|locat|carry/.test(text))categories.push("exploration");
  if(skill.mount)categories.push("mount");
  return {pal,skill,tags,categories:unique(categories),activations:unique(activations),elements,mount:skill.mount||"none",stacking:text.includes("does not stack")?"Não acumula":"Não informado"};
}
const partnerRows=Object.values(window.PALPEDIA_DATA||{}).filter(p=>p.partnerSkill?.name).map(classifyPartnerSkill).sort((a,b)=>a.pal.name.localeCompare(b.pal.name));
const searchEl=document.getElementById("partner-search"),categoryEl=document.getElementById("partner-category"),activationEl=document.getElementById("partner-activation"),elementEl=document.getElementById("partner-element"),mountEl=document.getElementById("partner-mount");
const elements=unique(partnerRows.flatMap(x=>x.elements)).sort();elementEl.insertAdjacentHTML("beforeend",elements.map(e=>`<option value="${esc(e)}">${esc(ELEMENT_LABELS[e]||e)}</option>`).join(""));
function cleanPartnerDescription(text){return esc(text||"Sem descrição registrada.").replace(/\[elem:[^\]]+\]/gi,"").replace(/\n/g,"<br>");}
function tagLabel(tag){if(tag.startsWith("boost-"))return `Fortalece ${ELEMENT_LABELS[tag.slice(6)]||tag.slice(6)}`;if(tag.startsWith("resist-"))return `Resiste a ${ELEMENT_LABELS[tag.slice(7)]||tag.slice(7)}`;return PARTNER_TAG_LABELS[tag]||tag;}
function card(row){const p=row.pal,s=row.skill;return `<article class="partner-card"><a class="partner-card-pal" href="pal.html?pal=${encodeURIComponent(p.slug||p.id)}"><div>${assetImg(ASSETS.palsDirectory,p.icon,p.name,"partner-pal-image","lazy")}</div><section><small>No. ${p.index??"—"}${p.suffix||""}</small><h2>${esc(p.name)}</h2><span>${(p.elements||[]).map(esc).join(" / ")}</span></section></a><div class="partner-skill-title"><span>PARTNER SKILL</span><h3>${esc(s.name)}</h3></div><p class="partner-description">${cleanPartnerDescription(s.desc)}</p><div class="partner-classification">${row.categories.map(x=>`<span class="partner-chip category-${x}">${esc(PARTNER_CATEGORY_LABELS[x])}</span>`).join("")}${row.activations.map(x=>`<span class="partner-chip activation">${esc(PARTNER_ACTIVATION_LABELS[x])}</span>`).join("")}${row.tags.map(x=>`<span class="partner-chip effect">${esc(tagLabel(x))}</span>`).join("")}${row.mount!=="none"?`<span class="partner-chip mount">Montaria ${row.mount==="flying"?"voadora":"terrestre"}</span>`:""}<span class="partner-chip stacking">${row.stacking}</span></div></article>`;}
function filtered(){const q=searchEl.value.trim().toLowerCase(),category=categoryEl.value,activation=activationEl.value,element=elementEl.value,mount=mountEl.value;return partnerRows.filter(x=>(!q||x.pal.name.toLowerCase().includes(q)||x.skill.name.toLowerCase().includes(q)||(x.skill.desc||"").toLowerCase().includes(q))&&(!category||x.categories.includes(category))&&(!activation||x.activations.includes(activation))&&(!element||x.elements.includes(element))&&(!mount||x.mount===mount));}
function render(){const rows=filtered();document.getElementById("partner-count").textContent=rows.length.toLocaleString("pt-BR");const counts={};rows.flatMap(x=>x.categories).forEach(x=>counts[x]=(counts[x]||0)+1);document.getElementById("partner-summary").innerHTML=Object.entries(PARTNER_CATEGORY_LABELS).map(([key,label])=>`<div><strong>${counts[key]||0}</strong><span>${esc(label)}</span></div>`).join("");document.getElementById("partner-grid").innerHTML=rows.length?rows.map(card).join(""):'<div class="panel partner-empty">Nenhuma Partner Skill corresponde aos filtros.</div>';activateAssetFallbacks(document.getElementById("partner-grid"));}
[searchEl,categoryEl,activationEl,elementEl,mountEl].forEach(el=>el.addEventListener(el===searchEl?"input":"change",render));render();
