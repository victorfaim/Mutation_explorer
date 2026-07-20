
function render(){
 const q=document.getElementById("q").value.trim().toLowerCase(),f=document.getElementById("filter").value;
 const rows=allPals.filter(p=>PAL_STATUS[p.id].state!=="obtainable"&&(!q||p.name.toLowerCase().includes(q)||p.id.includes(q))&&(f==="all"||PAL_STATUS[p.id].state===f)).sort((a,b)=>PAL_STATUS[a.id].state.localeCompare(PAL_STATUS[b.id].state)||(a.index||9999)-(b.index||9999));
 document.getElementById("cards").innerHTML=rows.map(p=>{const m=PAL_STATUS[p.id];return `<div class="pal-card"><div class="pal-card-head"><img loading="lazy" decoding="async" src="${palIconUrl(p)}" alt="" onerror="this.style.display=\'none\'"><h3>${esc(p.name)}</h3></div>${stateBadge(m)}<p class="muted">#${p.index||"—"} • Rank ${p.combiRank??"—"}</p><p>${esc(m.reason)}</p></div>`}).join("");
}
document.getElementById("q").oninput=render;document.getElementById("filter").onchange=render;render();
