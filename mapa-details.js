(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.PublicMapDetails=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  let dropTablesPromise=null;
  function selectBossDropTable(tables,level){
    const rows=Array.isArray(tables)?tables.filter(row=>Array.isArray(row?.drops)):[];
    return rows.find(row=>Number(row.level)===Number(level))||rows.find(row=>Number(row.level)===0)||rows.slice().sort((a,b)=>(Number(a.level)||0)-(Number(b.level)||0))[0]||null;
  }
  function consolidateDrops(table){
    const result=new Map();
    for(const drop of table?.drops||[]){
      if(!drop?.itemId||!(Number(drop.rate)>0))continue;
      const current=result.get(drop.itemId)||{itemId:drop.itemId,variants:[]};
      const variant={rate:Number(drop.rate),min:Number(drop.min)||0,max:Number(drop.max)||0};
      if(!current.variants.some(row=>row.rate===variant.rate&&row.min===variant.min&&row.max===variant.max))current.variants.push(variant);
      result.set(drop.itemId,current);
    }
    return [...result.values()];
  }
  function loadDropTables(env,document){
    if(env.PAL_DROP_TABLES)return Promise.resolve(env.PAL_DROP_TABLES);
    if(dropTablesPromise)return dropTablesPromise;
    dropTablesPromise=new Promise((resolve,reject)=>{
      const script=document.createElement("script");
      script.src="drop-tables-data.js?v=20260721-1";
      script.onload=()=>env.PAL_DROP_TABLES?resolve(env.PAL_DROP_TABLES):reject(new Error("Tabela de drops indisponível"));
      script.onerror=()=>reject(new Error("Falha ao carregar tabela de drops"));
      document.head.appendChild(script);
    }).catch(error=>{dropTablesPromise=null;throw error;});
    return dropTablesPromise;
  }
  function createRenderer(ctx){
    const {env,document,tr,esc,number,langParam,maps,categories,detailImage,markerTitle}=ctx;
    const coords=marker=>{const game=marker.game||{},x=Number.isFinite(game.displayedX)?game.displayedX:game.x,y=Number.isFinite(game.displayedY)?game.displayedY:game.y;return `<dl class="public-map-detail-list"><dt>${tr("Mapa")}</dt><dd>${esc(maps[marker.mapId]?.label||marker.mapId||"—")}</dd><dt>${tr("Coordenadas no jogo")}</dt><dd>${number(x)}, ${number(y)}</dd></dl>`;};
    const links=rows=>rows.length?`<div class="public-map-detail-links">${rows.map(row=>`<a href="${row.href}">${tr(row.label)}</a>`).join("")}</div>`:"";
    const renderFastTravel=marker=>{const secondary=markerTitle(marker)!==marker.label&&marker.id?`<p class="public-map-detail-secondary">${tr("Identificação")}: ${esc(marker.id)}</p>`:"";return `<span class="public-map-detail-kicker">${tr("Viagem rápida")}</span>${detailImage(marker)}<h2 id="public-map-details-title">${esc(markerTitle(marker))}</h2>${secondary}${coords(marker)}`;};
    const renderTower=marker=>{const type=String(marker.bossType||"").replace(/^EPalBossType::/,"").replace(/^BP_PalBossTower_?/,"").replace(/Boss$/,"").replace(/([a-z])([A-Z])/g,"$1 $2");return `<span class="public-map-detail-kicker">${tr("Torres de história")}</span>${detailImage(marker)}<h2 id="public-map-details-title">${esc(markerTitle(marker))}</h2>${type?`<p class="public-map-detail-secondary">${tr("Tipo")}: ${esc(type)}</p>`:""}${coords(marker)}`;};
    const renderHolyWater=marker=>{const itemId=marker.reward?.itemId;return `<span class="public-map-detail-kicker">${tr("Água Benta")}</span>${detailImage(marker)}<h2 id="public-map-details-title">${esc(markerTitle(marker))}</h2>${coords(marker)}<dl class="public-map-detail-list"><dt>${tr("Quantidade")}</dt><dd>${number(marker.reward?.quantity)}× ${esc(tr(marker.reward?.name||""))}</dd><dt>${tr("Recarga")}</dt><dd>${number((marker.cooldownSeconds||0)/60)} ${tr("minutos")}</dd></dl>${links(itemId?[{href:`item.html?id=${encodeURIComponent(itemId)}&${langParam()}`,label:"Ver fontes do item"}]:[])}`;};
    const renderRelic=marker=>`<span class="public-map-detail-kicker">${tr("Relíquias e estátuas")}</span>${detailImage(marker)}<h2 id="public-map-details-title">${esc(markerTitle(marker))}</h2>${coords(marker)}<dl class="public-map-detail-list">${marker.pal?`<dt>Pal</dt><dd>${esc(marker.pal)}</dd>`:""}${marker.bonus?`<dt>${tr("Bônus")}</dt><dd>${esc(tr(marker.bonus))}</dd>`:""}</dl>`;
    const alphaLinks=marker=>{const id=marker.pal?.id,rows=[];if(marker.pal?.slug)rows.push({href:`pal.html?pal=${encodeURIComponent(marker.pal.slug)}&${langParam()}`,label:"Ver na Palpedia"});if(id){rows.push({href:`breeding.html?child=${encodeURIComponent(id)}&${langParam()}`,label:"Abrir Calculadora de Breeding"},{href:`caminho.html?target=${encodeURIComponent(id)}&${langParam()}`,label:"Abrir Caminho de Breeding"},{href:`reverso.html?pal=${encodeURIComponent(id)}&${langParam()}`,label:"Abrir Mutação Reversa"});}return rows;};
    const dropHtml=(drop,tables)=>{const meta=tables.items?.[drop.itemId],name=meta?.name||drop.itemId,icon=meta?.icon?`<img src="assets/items/${encodeURIComponent(meta.icon)}.png" alt="">`:'<span class="public-map-drop-fallback" aria-hidden="true">◆</span>',href=meta?`item.html?id=${encodeURIComponent(drop.itemId)}&${langParam()}`:"",title=href?`<a href="${href}">${esc(tr(name))}</a>`:`<strong>${esc(tr(name))}</strong>`;return `<article class="public-map-drop">${icon}<div>${title}${drop.variants.map(row=>`<span>${tr("Chance")}: ${row.rate.toLocaleString(env.PME_I18N?.locale||"pt-BR")}% · ${tr("Quantidade")}: ${number(row.min)}${row.max!==row.min?`–${number(row.max)}`:""}</span>`).join("")}</div></article>`;};
    const renderAlpha=async marker=>{const elements=(marker.pal?.elements||[]).map(element=>`<span class="public-map-element-chip">${esc(tr(element))}</span>`).join(""),base=`<span class="public-map-detail-kicker">${tr("Alpha Pal")}</span><div class="public-map-alpha-heading">${detailImage(marker)}<div><h2 id="public-map-details-title">${esc(tr(markerTitle(marker)))}</h2><strong>${tr("Nível")} ${number(marker.level)}</strong><div class="public-map-element-chips" aria-label="${tr("Elementos")}">${elements}</div></div></div>${coords(marker)}`;try{const tables=await loadDropTables(env,document),selected=selectBossDropTable(tables.pals?.[marker.pal?.id]?.boss,marker.level),drops=consolidateDrops(selected),content=drops.length?`<div class="public-map-drop-list">${drops.map(drop=>dropHtml(drop,tables)).join("")}</div>`:`<p class="public-map-detail-message">${tr("Nenhum drop conhecido para este Alpha.")}</p>`;return `${base}<section class="public-map-alpha-drops"><h3>${tr("Drops possíveis")}</h3>${content}<p class="public-map-drop-note">${tr("Drops conhecidos para a variante Alpha/Boss deste Pal.")}</p></section>${links(alphaLinks(marker))}`;}catch(error){console.error("Falha ao carregar detalhes de drops do Alpha",error);return `${base}<p class="public-map-detail-message is-error">${tr("Erro ao carregar detalhes.")}</p>${links(alphaLinks(marker))}`;}};
    const renderUnknown=marker=>`<span class="public-map-detail-kicker">${tr("DETALHES")}</span><h2 id="public-map-details-title">${esc(markerTitle(marker))}</h2><p>${tr("Nenhum detalhe adicional disponível")}</p>${coords(marker)}`;
    const renderers={"fast-travel":renderFastTravel,"story-tower":renderTower,"holy-water":renderHolyWater,relic:renderRelic,"alpha-boss":renderAlpha};
    return marker=>(renderers[marker.category]||renderUnknown)(marker);
  }
  return {selectBossDropTable,consolidateDrops,loadDropTables,createRenderer};
});
