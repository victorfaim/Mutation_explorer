const DROP_TABLES=window.PAL_DROP_TABLES||{pals:{},items:{},sources:{}};
function dropItemMeta(itemId){return DROP_TABLES.items[itemId]||{id:itemId,name:itemId,icon:"",descr:""};}
function dropConditionLabel(source){const variant=source.variant==="boss"?"Alpha/Boss":"Comum";return source.level?`${variant} · Nv. ${source.level}`:variant;}
function buildAccurateItems(){
  const result={};
  Object.entries(DROP_TABLES.items).forEach(([itemId,meta])=>{
    result[itemId]={...meta,rawId:itemId,droppedBy:(DROP_TABLES.sources[itemId]||[]).map(x=>({...x,min:x.min,max:x.max,rate:x.rate}))};
  });
  return result;
}
window.ITEMS_DATA_ACCURATE=buildAccurateItems();

function tableDropRows(table){
  if(!table?.drops?.length)return '<div class="paldex-empty">Nenhum drop com taxa positiva nesta condição.</div>';
  return `<div class="paldex-drop-grid">${table.drops.map(d=>{const item=dropItemMeta(d.itemId);return `<a class="paldex-drop-card" href="item.html?id=${encodeURIComponent(d.itemId)}"><div class="paldex-drop-placeholder">${item.icon?assetImg(ASSETS.itemsDirectory,item.icon,item.name,"paldex-drop-image"):"◆"}</div><div><strong>${esc(item.name)}</strong><span>x${d.min}${d.max!==d.min?`–${d.max}`:""} · ${d.rate}%</span></div></a>`;}).join("")}</div>`;
}
function palDropTablesPanel(pal){
  const data=DROP_TABLES.pals[pal.id];
  if(!data)return '<div class="paldex-empty">Nenhuma tabela de drop vinculada a este Pal.</div>';
  const firstVariant=data.normal.length?"normal":"boss";
  return `<div class="drop-table-explorer" data-drop-pal="${esc(pal.id)}">
    <div class="drop-variant-tabs">
      <button type="button" data-drop-variant="normal" class="${firstVariant==="normal"?"is-active":""}" ${data.normal.length?"":"disabled"}>Comum <span>${data.normal.length}</span></button>
      <button type="button" data-drop-variant="boss" class="${firstVariant==="boss"?"is-active":""}" ${data.boss.length?"":"disabled"}>Alpha/Boss <span>${data.boss.length}</span></button>
    </div>
    <div class="drop-level-controls"></div><div class="drop-table-result"></div>
    <p class="drop-table-note">Fonte: DT_PalDropItem_Common. Entradas com taxa 0% não são exibidas. A condição indica qual registro do jogo contém o drop.</p>
  </div>`;
}
function initPalDropTables(pal,root=document){
  const el=root.querySelector("[data-drop-pal]");if(!el)return;const data=DROP_TABLES.pals[pal.id];let variant=data.normal.length?"normal":"boss",level=null;
  const render=()=>{const tables=data[variant];if(!tables.length)return;const selected=tables.find(x=>x.level===level)||tables[0];level=selected.level;el.querySelectorAll("[data-drop-variant]").forEach(b=>b.classList.toggle("is-active",b.dataset.dropVariant===variant));el.querySelector(".drop-level-controls").innerHTML=tables.map(t=>`<button type="button" data-drop-level="${t.level}" class="${t.level===level?"is-active":""}">${t.level?`Nível ${t.level}`:"Base"}</button>`).join("");el.querySelector(".drop-table-result").innerHTML=tableDropRows(selected);activateAssetFallbacks(el);};
  el.addEventListener("click",e=>{const vb=e.target.closest("[data-drop-variant]");if(vb&&!vb.disabled){variant=vb.dataset.dropVariant;level=null;render();return;}const lb=e.target.closest("[data-drop-level]");if(lb){level=Number(lb.dataset.dropLevel);render();}});render();
}
function previewDropsForPal(pal){
  const data=DROP_TABLES.pals[pal.id];if(!data)return pal.drops||[];const table=data.normal.find(x=>x.level===0)||data.normal[0]||data.boss[0];if(!table)return [];
  return table.drops.map(d=>({...dropItemMeta(d.itemId),rate:d.rate,min:d.min,max:d.max}));
}
function previewDropConditionForPal(pal){const data=DROP_TABLES.pals[pal.id];if(!data)return "";const table=data.normal.find(x=>x.level===0)||data.normal[0]||data.boss[0];if(!table)return "";return `${data.normal.includes(table)?"Comum":"Alpha/Boss"}${table.level?` · Nv. ${table.level}`:" · Base"}`;}
