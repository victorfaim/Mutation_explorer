
const PALPEDIA=window.PALPEDIA_DATA;
const palpediaPals=Object.values(PALPEDIA);
let filtered=[],visible=0;
const pageSize=60;
const rarityLabels={1:"Common",2:"Common",3:"Uncommon",4:"Common",5:"Uncommon",6:"Rare",7:"Rare",8:"Epic",9:"Epic",10:"Epic",20:"Legendary"};
const palNumber=p=>`#${String(p.index??"—")}${p.suffix||""}`;
const rarityName=p=>rarityLabels[p.rarity]||`Rarity ${p.rarity??"—"}`;
const elements=[...new Set(palpediaPals.flatMap(p=>p.elements||[]))].sort();
document.getElementById("palpedia-element").insertAdjacentHTML("beforeend",elements.map(e=>`<option value="${esc(e)}">${esc(e)}</option>`).join(""));
const works=[...new Set(palpediaPals.flatMap(p=>Object.keys(p.work||{})))].sort();
document.getElementById("palpedia-work").insertAdjacentHTML("beforeend",works.map(w=>`<option value="${esc(w)}">${esc(w)}</option>`).join(""));
function workPreview(p){return Object.entries(p.work||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([n,l])=>`<span class="palpedia-work-chip">${esc(n)} <b>${l}</b></span>`).join("")}
function card(p){const compact=PALS[p.id]||p,status=PAL_STATUS?.[p.id];return `<a class="palpedia-card" href="pal.html?pal=${encodeURIComponent(p.slug||p.id)}"><div class="palpedia-card-top"><span class="palpedia-number">${palNumber(p)}</span><span class="palpedia-rarity rarity-${p.rarity}">${esc(rarityName(p))}</span></div><div class="palpedia-avatar"><img loading="lazy" decoding="async" src="${palIconUrl(compact)}" alt="${esc(p.name)}" onerror="this.style.display='none'"></div><h2>${esc(p.name)}</h2><p class="palpedia-prefix">${esc(p.prefix||"")}</p><div class="palpedia-elements">${(p.elements||[]).map(e=>`<span>${esc(e)}</span>`).join("")}</div><div class="palpedia-work-preview">${workPreview(p)}</div>${status?`<div class="palpedia-mutation-state">${stateBadge(status)}</div>`:""}</a>`}
function applyFilters(){const q=document.getElementById("palpedia-search").value.trim().toLowerCase(),element=document.getElementById("palpedia-element").value,work=document.getElementById("palpedia-work").value,sort=document.getElementById("palpedia-sort").value;filtered=palpediaPals.filter(p=>{const num=String(p.index??"")+(p.suffix||"");return(!q||p.name.toLowerCase().includes(q)||(p.slug||"").toLowerCase().includes(q)||num.toLowerCase().includes(q))&&(!element||(p.elements||[]).includes(element))&&(!work||Object.prototype.hasOwnProperty.call(p.work||{},work))});filtered.sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="rarity-desc"?(b.rarity||0)-(a.rarity||0)||a.name.localeCompare(b.name):sort==="rarity-asc"?(a.rarity||0)-(b.rarity||0)||a.name.localeCompare(b.name):(a.index??9999)-(b.index??9999)||(a.suffix||"").localeCompare(b.suffix||"")||a.name.localeCompare(b.name));visible=0;document.getElementById("palpedia-grid").innerHTML="";renderMore()}
function renderMore(){const next=filtered.slice(visible,visible+pageSize);document.getElementById("palpedia-grid").insertAdjacentHTML("beforeend",next.map(card).join(""));visible+=next.length;document.getElementById("palpedia-count").textContent=filtered.length.toLocaleString("pt-BR");document.getElementById("palpedia-shown").textContent=`Exibindo ${visible} de ${filtered.length}`;document.getElementById("palpedia-more").hidden=visible>=filtered.length}
["palpedia-search","palpedia-element","palpedia-work","palpedia-sort"].forEach(id=>document.getElementById(id).addEventListener(id==="palpedia-search"?"input":"change",applyFilters));
document.getElementById("palpedia-more").addEventListener("click",renderMore);applyFilters();
