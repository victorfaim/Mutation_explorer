
let startPal=null;
let targetPal=null;

const selectablePals=allPals
  .filter(p=>p.name && p.combiRank && p.combiRank!==9999 && !p.isBoss)
  .sort((a,b)=>a.name.localeCompare(b.name));

function pathPickerCard(p,selectedId){
  return `<button type="button" class="path-pal-card${selectedId===p.id?" is-selected":""}" data-pal-id="${esc(p.id)}">
    <span class="picker-avatar">
      ${palIconUrl(p)?`<img loading="lazy" decoding="async" src="${palIconUrl(p)}" alt="" onerror="this.style.display='none'">`:""}
    </span>
    <strong>${esc(p.name)}</strong>
  </button>`;
}

function renderGrid(type){
  const isStart=type==="start";
  const input=document.getElementById(isStart?"start-search":"target-search");
  const grid=document.getElementById(isStart?"start-grid":"target-grid");
  const count=document.getElementById(isStart?"start-count":"target-count");
  const selected=isStart?startPal:targetPal;
  const q=input.value.trim().toLowerCase();
  const rows=selectablePals.filter(p=>!q||p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q));
  count.textContent=rows.length.toLocaleString("pt-BR");
  grid.innerHTML=rows.map(p=>pathPickerCard(p,selected?.id)).join("");
}

function selectedChip(p){
  if(!p)return "";
  return `<div class="path-selected-pal">
    ${palIconUrl(p)?`<img src="${palIconUrl(p)}" alt="" onerror="this.style.display='none'">`:""}
    <div><span class="muted">${p===startPal?"Partida":"Target"}</span><strong>${esc(p.name)}</strong></div>
  </div>`;
}

function refreshSelection(){
  document.getElementById("selected-start").innerHTML=startPal?selectedChip(startPal):"Escolha o Pal de partida.";
  document.getElementById("selected-target").innerHTML=targetPal?selectedChip(targetPal):"Escolha o Target.";
  document.getElementById("calculate-path").disabled=!(startPal&&targetPal);
  document.getElementById("path-result").hidden=true;

  if(startPal&&targetPal){
    if(startPal.id===targetPal.id){
      document.getElementById("path-status").textContent="Partida e Target são o mesmo Pal. Nenhum cruzamento é necessário.";
    }else{
      document.getElementById("path-status").textContent=`Pronto para calcular: ${startPal.name} → ${targetPal.name}.`;
    }
  }else{
    document.getElementById("path-status").textContent="Aguardando seleção.";
  }
}

function selectFromGrid(type,id){
  const p=PALS[id];
  if(!p)return;
  if(type==="start")startPal=p;
  else targetPal=p;
  renderGrid(type);
  refreshSelection();
}

document.getElementById("start-grid").addEventListener("click",e=>{
  const card=e.target.closest("[data-pal-id]");
  if(card)selectFromGrid("start",card.dataset.palId);
});
document.getElementById("target-grid").addEventListener("click",e=>{
  const card=e.target.closest("[data-pal-id]");
  if(card)selectFromGrid("target",card.dataset.palId);
});
document.getElementById("start-search").addEventListener("input",()=>renderGrid("start"));
document.getElementById("target-search").addEventListener("input",()=>renderGrid("target"));

function buildAdjacencyFor(currentId){
  const current=PALS[currentId];
  const edges=[];
  const seenChildren=new Set();

  for(const partnerId of PARENT_IDS){
    const partner=PALS[partnerId];
    const child=normalChild(current,partner);
    if(!child||child.id===currentId||seenChildren.has(child.id))continue;
    seenChildren.add(child.id);
    edges.push({childId:child.id,partnerId:partner.id});
  }

  return edges;
}

const adjacencyCache=new Map();
function getEdges(id){
  if(!adjacencyCache.has(id))adjacencyCache.set(id,buildAdjacencyFor(id));
  return adjacencyCache.get(id);
}

function findShortestPath(startId,targetId){
  if(startId===targetId)return [];
  const queue=[startId];
  let head=0;
  const visited=new Set([startId]);
  const previous=new Map();

  while(head<queue.length){
    const currentId=queue[head++];
    for(const edge of getEdges(currentId)){
      if(visited.has(edge.childId))continue;
      visited.add(edge.childId);
      previous.set(edge.childId,{
        previousId:currentId,
        partnerId:edge.partnerId
      });

      if(edge.childId===targetId){
        const steps=[];
        let cursor=targetId;
        while(cursor!==startId){
          const info=previous.get(cursor);
          steps.push({
            parentLineageId:info.previousId,
            partnerId:info.partnerId,
            childId:cursor
          });
          cursor=info.previousId;
        }
        steps.reverse();
        return steps;
      }
      queue.push(edge.childId);
    }
  }
  return null;
}

function stepCard(step,index){
  const lineage=PALS[step.parentLineageId];
  const partner=PALS[step.partnerId];
  const child=PALS[step.childId];
  return `<article class="breeding-step">
    <div class="breeding-step-number">Etapa ${index+1}</div>
    <div class="breeding-equation">
      <div class="breeding-pal lineage-pal">
        ${palIconUrl(lineage)?`<img src="${palIconUrl(lineage)}" alt="" loading="lazy" onerror="this.style.display='none'">`:""}
        <strong>${esc(lineage.name)}</strong>
        <span>Da linhagem</span>
      </div>
      <div class="breeding-operator">+</div>
      <div class="breeding-pal">
        ${palIconUrl(partner)?`<img src="${palIconUrl(partner)}" alt="" loading="lazy" onerror="this.style.display='none'">`:""}
        <strong>${esc(partner.name)}</strong>
        <span>Parceiro</span>
      </div>
      <div class="breeding-operator breeding-arrow">→</div>
      <div class="breeding-pal child-pal">
        ${palIconUrl(child)?`<img src="${palIconUrl(child)}" alt="" loading="lazy" onerror="this.style.display='none'">`:""}
        <strong>${esc(child.name)}</strong>
        <span>${index===0?"Primeiro descendente":"Continua a linhagem"}</span>
      </div>
    </div>
  </article>`;
}

function calculate(){
  if(!startPal||!targetPal)return;
  const status=document.getElementById("path-status");
  document.getElementById("path-result").hidden=true;

  if(startPal.id===targetPal.id){
    status.textContent="Partida e Target são o mesmo Pal. Nenhum cruzamento é necessário.";
    document.getElementById("summary-start").innerHTML=palChip(startPal);
    document.getElementById("summary-target").innerHTML=palChip(targetPal);
    document.getElementById("summary-steps").textContent="0";
    document.getElementById("summary-partners").textContent="0";
    document.getElementById("path-steps").innerHTML='<div class="viz-callout">A passiva já está no Pal desejado.</div>';
    document.getElementById("path-result").hidden=false;
    return;
  }

  status.innerHTML=`<span class="loading-dot"></span> Procurando o menor caminho de ${esc(startPal.name)} até ${esc(targetPal.name)}...`;

  setTimeout(()=>{
    const steps=findShortestPath(startPal.id,targetPal.id);

    if(!steps){
      status.innerHTML=`<b>Não foi possível encontrar um caminho.</b> Nenhuma sequência de breeding normal conecta ${esc(startPal.name)} a ${esc(targetPal.name)} usando a base atual.`;
      return;
    }

    const uniquePartners=new Set(steps.map(s=>s.partnerId));
    document.getElementById("summary-start").innerHTML=palChip(startPal);
    document.getElementById("summary-target").innerHTML=palChip(targetPal);
    document.getElementById("summary-steps").textContent=steps.length.toLocaleString("pt-BR");
    document.getElementById("summary-partners").textContent=uniquePartners.size.toLocaleString("pt-BR");
    document.getElementById("path-steps").innerHTML=steps.map(stepCard).join("");
    document.getElementById("path-result").hidden=false;
    status.textContent=`Caminho encontrado em ${steps.length} etapa${steps.length===1?"":"s"}.`;
  },20);
}

document.getElementById("calculate-path").addEventListener("click",calculate);
renderGrid("start");
renderGrid("target");
refreshSelection();
