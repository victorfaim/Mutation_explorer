
const PALPEDIA=window.PALPEDIA_DATA;
const params=new URLSearchParams(location.search);
const query=(params.get("pal")||params.get("id")||"").toLowerCase();
const pal=Object.values(PALPEDIA).find(p=>
  p.id.toLowerCase()===query||(p.slug||"").toLowerCase()===query||p.name.toLowerCase()===query
);

const labels={hp:"HP",melee:"Melee Attack",shot:"Shot Attack",defense:"Defense",support:"Support",craftSpeed:"Craft Speed",runSpeed:"Running Speed",rideSprintSpeed:"Sprinting Speed",slowWalkSpeed:"Slow Walk Speed",price:"Price",stamina:"Stamina"};
const number=p=>`No.${String(p.index??"—").padStart(3,"0")}${p.suffix||""}`;

function statRows(stats){
  const preferred=["hp","melee","shot","defense","support","stamina","runSpeed","rideSprintSpeed","slowWalkSpeed","craftSpeed","price"];
  return preferred.filter(k=>stats[k]!==undefined).map(k=>{
    const val=stats[k],max=k.includes("Speed")||k==="price"?Math.max(val,3500):200;
    const pct=Math.min(100,Math.max(2,val/max*100));
    return `<div class="pal-stat-row"><span>${esc(labels[k]||k)}</span><div class="pal-stat-track"><i style="width:${pct}%"></i></div><b>${Number(val).toLocaleString("pt-BR")}</b></div>`;
  }).join("");
}

function workRows(work){
  const rows=Object.entries(work||{}).sort((a,b)=>b[1]-a[1]);
  if(!rows.length)return '<div class="pal-empty-block">Nenhuma aptidão de trabalho registrada.</div>';
  return `<div class="pal-work-grid">${rows.map(([name,lvl])=>
    `<div class="pal-work-item"><span>${esc(name)}</span><b>Lv ${lvl}</b></div>`
  ).join("")}</div>`;
}

function dropRows(drops){
  if(!drops?.length)return '<div class="pal-empty-block">Nenhum drop registrado.</div>';
  return `<div class="drop-list">
    <div class="drop-header"><span>Item</span><span>Quantidade</span><span>Taxa</span></div>
    ${drops.map(d=>`<div class="drop-row">
      <div><strong>${esc(d.name)}</strong>${d.descr?`<p>${esc(d.descr)}</p>`:""}</div>
      <span>${d.min??"—"}${d.max!==undefined&&d.max!==d.min?` – ${d.max}`:""}</span>
      <b>${d.rate!==undefined?`${d.rate}%`:"—"}</b>
    </div>`).join("")}
  </div>`;
}

function activeRows(actives){
  if(!actives?.length)return '<div class="pal-empty-block">Nenhuma habilidade ativa registrada.</div>';
  return `<div class="active-skill-list">${actives.map(a=>`<article class="active-skill">
    <div class="active-skill-head"><h3>${esc(a.name)}</h3><span>Lv ${a.level??"—"}</span><span>${esc(a.element||"")}</span></div>
    <div class="active-skill-meta"><span>Power: <b>${a.power??"—"}</b></span><span>Cooldown: <b>${a.cooldown??"—"}</b></span><span>Range: <b>${a.minRange??"—"} – ${a.maxRange??"—"}</b></span></div>
    <p>${esc(a.desc||"")}</p>
  </article>`).join("")}</div>`;
}

function relatedPals(p){
  const matches=Object.values(PALPEDIA).filter(other=>{
    if(other.id===p.id)return false;
    const sameIndex=other.index===p.index;
    const keyA=(p.key||"").split("_")[0],keyB=(other.key||"").split("_")[0];
    return sameIndex||(keyA&&keyB&&keyA===keyB);
  }).slice(0,8);
  return matches.length?`<div class="related-grid">${matches.map(r=>`<a href="pal.html?pal=${encodeURIComponent(r.slug||r.id)}">${palChip(PALS[r.id]||r)}</a>`).join("")}</div>`:'<p class="muted">Nenhuma variação relacionada identificada.</p>';
}

if(!pal){
  document.getElementById("pal-detail-loading").innerHTML="<b>Pal não encontrado.</b> Volte à Palpedia e escolha outro registro.";
}else{
  document.title=`${pal.name} | Palpedia`;
  const compact=PALS[pal.id]||pal;
  const mutation=PAL_STATUS?.[pal.id]||{state:"outside",reason:"Sem auditoria"};
  const partner=pal.partnerSkill||{};

  document.getElementById("pal-detail").innerHTML=`
    <section class="pal-detail-hero panel">
      <div class="pal-detail-image"><img src="${palIconUrl(compact)}" alt="${esc(pal.name)}" onerror="this.style.display='none'"></div>
      <div class="pal-detail-title">
        <span class="pal-detail-number">${number(pal)}</span>
        <h1>${esc(pal.name)}</h1>
        <p class="pal-detail-prefix">${esc(pal.prefix||"")}</p>
        <div class="pal-detail-tags"><span>Rarity ${pal.rarity??"—"}</span>${(pal.elements||[]).map(e=>`<span>${esc(e)}</span>`).join("")}${stateBadge(mutation)}</div>
        <div class="pal-description">${esc(pal.description||"Sem descrição registrada.")}</div>
      </div>
    </section>

    <section class="pal-detail-columns">
      <div>
        <section class="pal-section">
          <h2>Stats</h2>
          <div class="pal-stats">${statRows(pal.stats||{})}</div>
        </section>

        <section class="pal-section pal-highlight-section">
          <h2>Drops</h2>
          ${dropRows(pal.drops)}
        </section>

        <section class="pal-section">
          <h2>Breeding e mutação</h2>
          <div class="breeding-info-grid">
            <div><span>CombiRank</span><b>${compact.combiRank??"—"}</b></div>
            <div><span>CombiPriority</span><b>${compact.combiPriority??"—"}</b></div>
            <div><span>Status mutação</span>${stateBadge(mutation)}</div>
            <div><span>Pares na auditoria</span><b>${(mutation.pairs||0).toLocaleString("pt-BR")}</b></div>
          </div>
          <p class="muted">${esc(mutation.reason||"")}</p>
          <div class="pal-action-links">
            <a href="reverso.html?pal=${encodeURIComponent(pal.name)}">Consultar mutação</a>
            <a href="caminho.html?target=${encodeURIComponent(pal.name)}">Criar caminho até este Pal</a>
            <a href="caminho.html?start=${encodeURIComponent(pal.name)}">Usar como partida</a>
          </div>
        </section>
      </div>

      <div>
        <section class="pal-section pal-highlight-section">
          <h2>Aptidões de trabalho</h2>
          ${workRows(pal.work)}
        </section>

        <section class="pal-section">
          <h2>Partner Skill</h2>
          <article class="partner-skill"><h3>${esc(partner.name||"Não registrada")}</h3><p>${esc(partner.desc||"Sem descrição registrada.")}</p></article>
        </section>

        <section class="pal-section">
          <h2>Active Skills</h2>
          ${activeRows(pal.actives)}
        </section>
      </div>
    </section>

    <section class="pal-section"><h2>Relacionados</h2>${relatedPals(pal)}</section>
  `;

  document.getElementById("pal-detail-loading").hidden=true;
  document.getElementById("pal-detail").hidden=false;
}
