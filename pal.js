
const PALPEDIA=window.PALPEDIA_DATA;
const params=new URLSearchParams(location.search);
const query=(params.get("pal")||params.get("id")||"").toLowerCase();
const pal=Object.values(PALPEDIA).find(p=>
  p.id.toLowerCase()===query||(p.slug||"").toLowerCase()===query||p.name.toLowerCase()===query
);

const WORK_ICONS={
  Handcraft:"✋",Handiwork:"✋",Transport:"📦",Transporting:"📦",Mining:"⛏",
  Gathering:"🌿",Watering:"💧",Lumbering:"🪓",Planting:"🌱",Kindling:"🔥",
  Cooling:"❄",Electricity:"⚡",GeneratingElectricity:"⚡",Medicine:"⚕",
  MedicineProduction:"⚕",Farming:"🌾",OilExtraction:"🛢"
};
const ELEMENT_ICONS={
  Normal:"◉",Fire:"🔥",Water:"💧",Leaf:"🌿",Grass:"🌿",Electricity:"⚡",
  Electric:"⚡",Ice:"❄",Ground:"◆",Earth:"◆",Dark:"☾",Dragon:"◇"
};
const labels={
  hp:"HP",melee:"Melee attack",shot:"Ranged attack",defense:"Defense",
  support:"Support",craftSpeed:"Work speed",runSpeed:"Run speed",
  rideSprintSpeed:"Ride sprint",slowWalkSpeed:"Slow walk",price:"Price",stamina:"Stamina"
};

const palNumber=p=>`No. ${String(p.index??"—")}${p.suffix||""}`;

function elementBadge(name){
  const icon=elementIconName(name);
  return `<span class="paldex-element">
    ${icon?assetImg(ASSETS.elementsDirectory,icon,"","paldex-inline-icon"):`<i>${ELEMENT_ICONS[name]||"◆"}</i>`}
    ${esc(name)}
  </span>`;
}
function workRows(work){
  const rows=Object.entries(work||{}).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  if(!rows.length)return '<div class="paldex-empty">Nenhuma aptidão registrada.</div>';
  return rows.map(([name,level])=>{
    const icon=workIconName(name);
    return `<div class="paldex-work-row">
      <span class="paldex-work-icon">${icon?assetImg(ASSETS.workDirectory,icon,"","paldex-inline-icon"):(WORK_ICONS[name]||"◆")}</span>
      <span>${esc(name)}</span>
      <b>${level}</b>
    </div>`;
  }).join("");
}
function statsRows(stats){
  const preferred=["hp","melee","shot","defense","support","craftSpeed","stamina","runSpeed","rideSprintSpeed","slowWalkSpeed","price"];
  return preferred.filter(k=>stats[k]!==undefined).map(k=>`
    <div class="paldex-stat">
      <span>${esc(labels[k]||k)}</span>
      <b>${Number(stats[k]).toLocaleString("pt-BR")}</b>
    </div>`).join("");
}
function dropRows(drops){
  if(!drops?.length)return '<div class="paldex-empty">Nenhum drop registrado.</div>';
  return `<div class="paldex-drop-grid">${drops.map(d=>`
    <article class="paldex-drop-card">
      <div class="paldex-drop-placeholder">
        ${d.icon?assetImg(ASSETS.itemsDirectory,d.icon,d.name,"paldex-drop-image"):"◆"}
      </div>
      <div>
        <strong>${esc(d.name)}</strong>
        <span>x${d.min??"—"}${d.max!==undefined&&d.max!==d.min?`–${d.max}`:""} · ${d.rate!==undefined?`${d.rate}%`:"—"}</span>
      </div>
    </article>`).join("")}</div>`;
}
function activeRows(actives){
  if(!actives?.length)return '<div class="paldex-empty">Nenhuma habilidade ativa registrada.</div>';
  return `<div class="paldex-skills">${actives.map(a=>`
    <article class="paldex-skill-card">
      <header>
        <div><span class="paldex-skill-element">${ELEMENT_ICONS[a.element]||"◆"}</span><h3>${esc(a.name)}</h3></div>
        <span>Lv ${a.level??"—"}</span>
      </header>
      <div class="paldex-skill-meta">
        <span>Power <b>${a.power??"—"}</b></span>
        <span>Cooldown <b>${a.cooldown??"—"}</b></span>
        <span>Range <b>${a.minRange??"—"}–${a.maxRange??"—"}</b></span>
      </div>
      <p>${esc(a.desc||"")}</p>
    </article>`).join("")}</div>`;
}
function relatedPals(p){
  const matches=Object.values(PALPEDIA).filter(other=>{
    if(other.id===p.id)return false;
    const sameIndex=other.index===p.index;
    const keyA=(p.key||"").split("_")[0],keyB=(other.key||"").split("_")[0];
    return sameIndex||(keyA&&keyB&&keyA===keyB);
  }).slice(0,12);
  if(!matches.length)return '<div class="paldex-empty">Nenhuma variação relacionada identificada.</div>';
  return `<div class="paldex-related-grid">${matches.map(r=>`
    <a href="pal.html?pal=${encodeURIComponent(r.slug||r.id)}">
      ${assetImg(ASSETS.palsDirectory,(PALS[r.id]||r).icon,"","","lazy")}
      <span>${esc(r.name)}</span>
      <small>#${r.index??"—"}${r.suffix||""}</small>
    </a>`).join("")}</div>`;
}
function breedingPanel(p,compact,mutation){
  return `
    <div class="paldex-breeding-summary">
      <div><span>CombiRank</span><b>${compact.combiRank??"—"}</b></div>
      <div><span>CombiPriority</span><b>${compact.combiPriority??"—"}</b></div>
      <div><span>Pares na auditoria</span><b>${(mutation.pairs||0).toLocaleString("pt-BR")}</b></div>
      <div><span>Status</span>${stateBadge(mutation)}</div>
    </div>
    <div class="paldex-breeding-note">${esc(mutation.reason||"")}</div>
    <div class="paldex-action-links">
      <a href="reverso.html?pal=${encodeURIComponent(p.name)}">Consultar mutação reversa</a>
      <a href="caminho.html?target=${encodeURIComponent(p.name)}">Criar caminho até este Pal</a>
      <a href="caminho.html?start=${encodeURIComponent(p.name)}">Usar como partida</a>
    </div>`;
}
function initTabs(){
  const buttons=[...document.querySelectorAll("[data-tab-button]")];
  const panels=[...document.querySelectorAll("[data-tab-panel]")];
  buttons.forEach(button=>button.addEventListener("click",()=>{
    const tab=button.dataset.tabButton;
    buttons.forEach(b=>b.classList.toggle("is-active",b===button));
    panels.forEach(p=>p.hidden=p.dataset.tabPanel!==tab);
  }));
}

if(!pal){
  document.getElementById("pal-detail-loading").innerHTML="<b>Pal não encontrado.</b> Volte à Palpedia e escolha outro registro.";
}else{
  document.title=`${pal.name} | Palpedia`;
  const compact=PALS[pal.id]||pal;
  const mutation=PAL_STATUS?.[pal.id]||{state:"outside",reason:"Sem auditoria"};
  const partner=pal.partnerSkill||{};
  const rarity=pal.rarity===20?"Legendary":pal.rarity>=8?"Epic":pal.rarity>=6?"Rare":"Common";

  document.getElementById("pal-detail").innerHTML=`
    <div class="paldex-breadcrumb"><a href="palpedia.html">Todos os Pals</a><span>/</span><b>${esc(pal.name)}</b></div>

    <div class="paldex-layout">
      <aside class="paldex-sidebar">
        <section class="paldex-identity">
          <div class="paldex-portrait">
            ${assetImg(ASSETS.palsDirectory,compact.icon,pal.name,"","eager")}
          </div>
          <span class="paldex-number">${palNumber(pal)}</span>
          <h1>${esc(pal.name)}</h1>
          <p>“${esc(pal.prefix||"")}”</p>
          <div class="paldex-badges">
            ${(pal.elements||[]).map(elementBadge).join("")}
            <span class="paldex-rarity">${esc(rarity)}</span>
          </div>
        </section>

        <section class="paldex-side-section">
          <h2>Aptidões de trabalho</h2>
          <div class="paldex-work-list">${workRows(pal.work)}</div>
        </section>

        <section class="paldex-side-section">
          <h2>Stats</h2>
          <div class="paldex-stats-grid">${statsRows(pal.stats||{})}</div>
        </section>
      </aside>

      <section class="paldex-main">
        <nav class="paldex-tabs" aria-label="Seções da ficha">
          <button type="button" class="is-active" data-tab-button="overview">Visão geral</button>
          <button type="button" data-tab-button="breeding">Breeding <span>${(mutation.pairs||0).toLocaleString("pt-BR")}</span></button>
          <button type="button" data-tab-button="skills">Skills <span>${(pal.actives||[]).length}</span></button>
          <button type="button" data-tab-button="related">Relacionados</button>
        </nav>

        <div class="paldex-tab-content">
          <section data-tab-panel="overview">
            <blockquote class="paldex-description">${esc(pal.description||"Sem descrição registrada.")}</blockquote>

            <section class="paldex-content-card">
              <span class="paldex-eyebrow">PARTNER SKILL</span>
              <h2>${esc(partner.name||"Não registrada")}</h2>
              <p>${esc(partner.desc||"Sem descrição registrada.")}</p>
            </section>

            <section class="paldex-content-section">
              <span class="paldex-eyebrow">DROPS</span>
              ${dropRows(pal.drops)}
            </section>
          </section>

          <section data-tab-panel="breeding" hidden>
            <section class="paldex-content-card">
              <span class="paldex-eyebrow">BREEDING E MUTAÇÃO</span>
              <h2>${esc(pal.name)}</h2>
              ${breedingPanel(pal,compact,mutation)}
            </section>
          </section>

          <section data-tab-panel="skills" hidden>
            ${skillRecommendationsPanel(pal)}
            ${activeRows(pal.actives)}
          </section>

          <section data-tab-panel="related" hidden>
            ${relatedPals(pal)}
          </section>
        </div>
      </section>
    </div>`;

  document.getElementById("pal-detail-loading").hidden=true;
  document.getElementById("pal-detail").hidden=false;
  initTabs();
  initSkillRecommendations(pal,document.getElementById("pal-detail"));
  activateAssetFallbacks(document.getElementById("pal-detail"));
}
