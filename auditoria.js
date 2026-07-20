
const counts={obtainable:0,unreachable:0,blocked:0,outside:0};
Object.values(PAL_STATUS).forEach(m=>counts[m.state]++);
document.getElementById("stats").innerHTML=`<div class="stat"><span>Pares simulados</span><b>${AUDIT_SUMMARY.pairCount.toLocaleString("pt-BR")}</b></div><div class="stat"><span>Obtíveis</span><b>${counts.obtainable}</b></div><div class="stat"><span>Inalcançáveis</span><b>${counts.unreachable}</b></div><div class="stat"><span>Bloqueados</span><b>${counts.blocked}</b></div><div class="stat"><span>Maior rank atingido</span><b>${AUDIT_SUMMARY.maxMutationRank}</b></div>`;
const defs={obtainable:"Ao menos um par real produz o Pal.",unreachable:"Elegível, mas nenhum par o seleciona.",blocked:"Excluído por ignoreCombi.",outside:"Boss, registro técnico ou rank inválido."};
document.getElementById("rows").innerHTML=Object.keys(counts).map(k=>`<tr><td>${stateBadge({state:k})}</td><td>${counts[k]}</td><td>${defs[k]}</td></tr>`).join("");
