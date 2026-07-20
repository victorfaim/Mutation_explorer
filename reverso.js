
let results=[],visible=0,selectedPal=null;

const stateLabels={
  obtainable:"Obtível",
  unreachable:"Inalcançável",
  blocked:"Bloqueado",
  outside:"Fora da mecânica"
};

function pickerCard(p){
  const meta=PAL_STATUS[p.id];
  const disabled=meta.state!=="obtainable";
  const selected=selectedPal?.id===p.id;
  return `<button type="button"
      class="picker-card state-${meta.state}${selected?" is-selected":""}"
      data-pal-id="${esc(p.id)}"
      title="${esc(meta.reason)}">
    <span class="picker-avatar">
      ${palIconUrl(p)?`<img loading="lazy" decoding="async" src="${palIconUrl(p)}" alt="" onerror="this.style.display='none'">`:""}
      ${disabled?`<span class="picker-lock" aria-hidden="true">×</span>`:""}
    </span>
    <strong>${esc(p.name)}</strong>
    <small>${disabled?stateLabels[meta.state]:""}</small>
  </button>`;
}

function renderPicker(){
  const q=document.getElementById("picker-search").value.trim().toLowerCase();
  const onlyObtainable=document.getElementById("picker-only-obtainable").checked;

  const rows=allPals
    .filter(p=>{
      const meta=PAL_STATUS[p.id];
      return (!q||p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q))
        &&(!onlyObtainable||meta.state==="obtainable");
    })
    .sort((a,b)=>{
      const sa=PAL_STATUS[a.id].state==="obtainable"?0:1;
      const sb=PAL_STATUS[b.id].state==="obtainable"?0:1;
      return sa-sb||a.name.localeCompare(b.name);
    });

  document.getElementById("picker-count").textContent=rows.length.toLocaleString("pt-BR");
  document.getElementById("picker-grid").innerHTML=rows.map(pickerCard).join("")
    ||'<div class="picker-empty">Nenhum Pal encontrado.</div>';
}

function showSelected(p){
  const meta=PAL_STATUS[p.id];
  const obtainable=meta.state==="obtainable";
  document.getElementById("selected-target").innerHTML=`
    <div class="selected-pal-card">
      <span class="selected-avatar">
        ${palIconUrl(p)?`<img src="${palIconUrl(p)}" alt="" onerror="this.style.display='none'">`:""}
      </span>
      <div>
        <span class="muted">Pal desejado</span>
        <h2>${esc(p.name)}</h2>
        ${stateBadge(meta)}
        <p>${esc(meta.reason)}</p>
      </div>
    </div>`;
  document.getElementById("search").disabled=!obtainable;
}

function selectPal(id,autoRun=true){
  const p=PALS[id];
  if(!p)return;
  selectedPal=p;
  document.getElementById("target").value=p.name;
  showSelected(p);
  renderPicker();

  const meta=PAL_STATUS[p.id];
  document.getElementById("result").hidden=true;
  if(meta.state!=="obtainable"){
    document.getElementById("status").innerHTML=
      `${stateBadge(meta)} <b>${esc(p.name)}</b>: ${esc(meta.reason)}.`;
    return;
  }
  document.getElementById("status").textContent=
    `${p.name} pode ser obtido por mutação. ${meta.pairs.toLocaleString("pt-BR")} ocorrências foram encontradas na auditoria.`;
  if(autoRun)run();
}

function run(){
  const target=selectedPal||findPal(document.getElementById("target").value);
  const statusEl=document.getElementById("status");
  document.getElementById("result").hidden=true;
  if(!target){statusEl.textContent="Escolha um Pal.";return}

  const meta=PAL_STATUS[target.id];
  if(meta.state!=="obtainable"){
    statusEl.innerHTML=`${stateBadge(meta)} <b>${esc(target.name)}</b>: ${esc(meta.reason)}.`;
    return;
  }

  statusEl.innerHTML=`<span class="loading-dot"></span> Calculando cruzamentos para <b>${esc(target.name)}</b>...`;
  document.getElementById("search").disabled=true;

  setTimeout(()=>{
    const min=Number(document.getElementById("min").value);
    const maxPool=Number(document.getElementById("pool").value);
    const found=[];

    for(let i=0;i<PARENT_IDS.length;i++){
      const a=PALS[PARENT_IDS[i]];
      for(let j=i;j<PARENT_IDS.length;j++){
        const b=PALS[PARENT_IDS[j]];
        const out=outcomes(a,b);
        const hits=out.counts.get(target.id)||0;
        if(!hits)continue;

        const chance=hits/out.count*100;
        if(chance<min||out.counts.size>maxPool)continue;

        const child=normalChild(a,b);
        const pool=[...out.counts.entries()]
          .sort((x,y)=>y[1]-x[1])
          .map(([id,n])=>`${PALS[id].name} (${fmt(n/out.count*100)})`)
          .join(", ");

        found.push({
          a:a.name,aId:a.id,
          b:b.name,bId:b.id,
          normal:child.name,normalId:child.id,
          chance,poolSize:out.counts.size,pool
        });
      }
    }

    found.sort((x,y)=>y.chance-x.chance||x.poolSize-y.poolSize||x.a.localeCompare(y.a));
    results=found;visible=0;
    document.getElementById("search").disabled=false;

    if(!results.length){
      statusEl.textContent="Nenhum par encontrado com os filtros atuais.";
      return;
    }

    const bestA=PALS[results[0].aId],bestB=PALS[results[0].bId];
    document.getElementById("best").innerHTML=
      `${palChip(bestA,"best-pal")} <span>+</span> ${palChip(bestB,"best-pal")}`;
    document.getElementById("chance").textContent=fmt(results[0].chance);
    document.getElementById("count").textContent=results.length.toLocaleString("pt-BR");
    document.getElementById("result").hidden=false;
    document.getElementById("rows").innerHTML="";
    renderMore();
    statusEl.textContent=`Consulta concluída: ${results.length.toLocaleString("pt-BR")} pares para ${target.name}.`;
  },20);
}

function renderMore(){
  const next=results.slice(visible,visible+100);
  document.getElementById("rows").insertAdjacentHTML("beforeend",
    next.map(r=>`<tr>
      <td>${palChip(PALS[r.aId])}</td>
      <td>${palChip(PALS[r.bId])}</td>
      <td>${palChip(PALS[r.normalId])}</td>
      <td>${fmt(r.chance)}</td>
      <td><b>${r.poolSize}</b><br><span class="muted">${esc(r.pool)}</span></td>
    </tr>`).join(""));
  visible+=next.length;
  document.getElementById("shown").textContent=`Exibindo ${visible} de ${results.length}`;
  document.getElementById("more").hidden=visible>=results.length;
}

document.getElementById("picker-grid").addEventListener("click",e=>{
  const card=e.target.closest("[data-pal-id]");
  if(card)selectPal(card.dataset.palId,true);
});
document.getElementById("picker-search").addEventListener("input",renderPicker);
document.getElementById("picker-only-obtainable").addEventListener("change",renderPicker);
document.getElementById("search").addEventListener("click",run);
document.getElementById("min").addEventListener("change",()=>selectedPal&&PAL_STATUS[selectedPal.id].state==="obtainable"&&run());
document.getElementById("pool").addEventListener("change",()=>selectedPal&&PAL_STATUS[selectedPal.id].state==="obtainable"&&run());
document.getElementById("more").addEventListener("click",renderMore);

renderPicker();

const qp=new URLSearchParams(location.search).get("pal");
if(qp){
  const p=findPal(qp);
  if(p)selectPal(p.id,true);
}
