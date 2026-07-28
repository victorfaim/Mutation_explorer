(function(root,factory){
  const transform=typeof module==="object"&&module.exports?require("./mapa-lab-transform.js"):root.MapLabTransform;
  const api=factory(transform);
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.PublicMap=api;
  if(typeof document!=="undefined")window.addEventListener("DOMContentLoaded",()=>api.init());
})(typeof globalThis!=="undefined"?globalThis:this,function(T){
  const env=typeof globalThis!=="undefined"?globalThis:this;
  const MAPS={
    mainworld5:{
      id:"mainworld5",label:"Palpagos",image:"assets/map/mainworld5.webp",
      markers:"mapa-lab-data/mainworld5-markers.json",calibration:"mapa-lab-data/mainworld5-calibration.json",
      width:8192,height:8192
    },
    worldtree:{
      id:"worldtree",label:"World Tree",image:"assets/map/worldtree-official.webp",
      markers:"mapa-lab-data/worldtree-markers.json",calibration:"mapa-lab-data/worldtree-z5-calibration.json",
      width:8192,height:8192
    }
  };
  const CATEGORIES={
    "fast-travel":{label:"Viagem rápida",icon:"assets/map/markers/fast-travel.png",source:"base"},
    "story-tower":{label:"Torres de história",icon:"assets/map/markers/story-tower.png",source:"mapa-lab-data/story-tower-markers.json"},
    "alpha-boss":{label:"Alpha Pals fixos",source:"mapa-lab-data/alpha-boss-markers.json"},
    "holy-water":{label:"Água Benta",icon:"assets/items/T_itemicon_Material_WorldTreeHolyWater.png",source:"mapa-lab-data/worldtree-holy-water-markers.json"},
    relic:{label:"Relíquias e estátuas",source:"mapa-lab-data/relic-markers.json?v=20260728-1"}
  };
  const DEFAULT_CATEGORIES=["story-tower"];
  const ICON_SIZES={"fast-travel":30,"story-tower":38,"alpha-boss":34,"holy-water":32,relic:30};
  const sharedCache=new Map(),mapCache=new Map();

  function normalizeText(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
  function compileCalibration(calibration){
    const points=(calibration?.referencePoints||[]).filter(point=>point.use!=="validation");
    const model=calibration?.model||"affine";
    return model==="similarity"?T.fitSimilarity(points):T.fitAffine(points);
  }
  function markerToPixel(marker,coefficients){
    const world=marker.world||marker.native;
    if(!world||!coefficients)return null;
    return T.nativeToPixel(world,coefficients);
  }
  function markerSearchText(marker,categoryLabel=""){
    return normalizeText([
      marker.label,marker.id,categoryLabel,marker.pal?.name,marker.pal?.index,marker.pal?.elements?.join(" "),
      marker.characterId,marker.bossType,marker.reward?.name,marker.pal,marker.bonus
    ].filter(Boolean).join(" "));
  }
  function markerMatches(marker,query,categoryLabel=""){
    return !normalizeText(query)||markerSearchText(marker,categoryLabel).includes(normalizeText(query));
  }
  function filterMarkers(markers,mapId,enabled,query=""){
    return markers.filter(marker=>marker.mapId===mapId&&enabled.has(marker.category)&&markerMatches(marker,query,CATEGORIES[marker.category]?.label));
  }

  async function fetchJson(path){
    const response=await fetch(`${path}?v=20260728-2`);
    if(!response.ok)throw new Error(`HTTP ${response.status}: ${path}`);
    const data=await response.json();
    if(!data||typeof data!=="object")throw new Error(`Dataset inválido: ${path}`);
    return data;
  }
  async function sharedDataset(path){
    if(!sharedCache.has(path))sharedCache.set(path,fetchJson(path));
    return sharedCache.get(path);
  }
  function adaptMarker(marker,category){
    return {...marker,category,mapId:marker.mapId||null};
  }
  async function loadMapData(mapId){
    if(mapCache.has(mapId))return mapCache.get(mapId);
    const promise=(async()=>{
      const config=MAPS[mapId];
      if(!config)throw new Error("Mapa indisponível.");
      const [base,calibration,...categoryData]=await Promise.all([
        fetchJson(config.markers),fetchJson(config.calibration),
        ...Object.values(CATEGORIES).filter(category=>category.source!=="base").map(category=>sharedDataset(category.source))
      ]);
      if(!Array.isArray(base.markers))throw new Error("Dados de marcadores inválidos.");
      const coefficients=compileCalibration(calibration);
      const markers=base.markers.map(marker=>adaptMarker({...marker,mapId},"fast-travel"));
      Object.entries(CATEGORIES).filter(([,category])=>category.source!=="base").forEach(([key],index)=>{
        const rows=categoryData[index]?.markers;
        if(!Array.isArray(rows))throw new Error(`Categoria inválida: ${key}`);
        rows.filter(marker=>marker.mapId===mapId).forEach(marker=>markers.push(adaptMarker(marker,key)));
      });
      return {config,base,calibration,coefficients,markers};
    })();
    mapCache.set(mapId,promise);
    return promise;
  }

  function init(){
    if(!document.getElementById("public-map-canvas")||!env.L)return;
    const $=id=>document.getElementById(id);
    const tr=value=>env.PME_I18N?.t(value)||value;
    const state={
      map:null,overlay:null,layers:new Map(),markerIndex:new Map(),data:null,mapId:"mainworld5",
      enabledByMap:new Map(Object.keys(MAPS).map(id=>[id,new Set(DEFAULT_CATEGORIES)])),
      selected:null,resultIndex:-1
    };
    const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
    const number=value=>Number.isFinite(value)?Math.round(value).toLocaleString(env.PME_I18N?.locale||"pt-BR"):"—";
    const langParam=()=>`lang=${encodeURIComponent(env.PME_I18N?.locale||new URLSearchParams(location.search).get("lang")||"pt-BR")}`;
    const status=(message,error=false)=>{$("public-map-status").textContent=tr(message);$("public-map-status").classList.toggle("is-error",error);};

    function ensureMap(){
      if(state.map)return;
      state.map=L.map("public-map-canvas",{crs:L.CRS.Simple,minZoom:-5,maxZoom:5,zoomSnap:.25,attributionControl:false});
      Object.keys(CATEGORIES).forEach(category=>{
        const layer=L.layerGroup().addTo(state.map);
        state.layers.set(category,layer);
      });
    }
    function iconFor(marker){
      const category=CATEGORIES[marker.category];
      const url=marker.category==="alpha-boss"?`assets/pals/${encodeURIComponent(marker.pal.icon)}.png`:
        marker.category==="relic"?marker.icon:category.icon;
      const size=ICON_SIZES[marker.category];
      if(marker.category==="fast-travel"||marker.category==="story-tower"){
        return L.icon({iconUrl:url,iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-size/2-1]});
      }
      return L.divIcon({
        className:`public-map-leaflet-icon public-map-leaflet-${marker.category}`,
        html:url?`<img src="${esc(url)}" alt="">`:"",
        iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-size/2-1]
      });
    }
    function categoryCounts(){
      const counts={};
      Object.keys(CATEGORIES).forEach(key=>counts[key]=state.data.markers.filter(marker=>marker.category===key).length);
      return counts;
    }
    function renderCategories(){
      const counts=categoryCounts(),enabled=state.enabledByMap.get(state.mapId);
      $("public-map-category-options").innerHTML=Object.entries(CATEGORIES).map(([key,category])=>{
        const count=counts[key],disabled=count===0;
        return `<label class="public-map-category${disabled?" is-disabled":""}"><input type="checkbox" value="${key}" ${enabled.has(key)?"checked":""} ${disabled?"disabled":""}>${category.icon?`<img class="public-map-category-icon" src="${category.icon}" alt="">`:""}<span>${tr(category.label)}</span><span class="public-map-category-count">${count}</span></label>`;
      }).join("");
    }
    function renderLegend(){
      const counts=categoryCounts();
      $("public-map-legend-items").innerHTML=Object.entries(CATEGORIES).filter(([key])=>counts[key]).map(([key,category])=>
        `<span class="public-map-legend-item"><span class="public-map-legend-symbol public-map-marker-${key}"></span>${tr(category.label)}</span>`
      ).join("");
    }
    function displayedMarkers(){
      const query=$("public-map-search").value;
      return filterMarkers(state.data.markers,state.mapId,state.enabledByMap.get(state.mapId),query);
    }
    function renderMarkers(){
      state.markerIndex.clear();
      state.layers.forEach(layer=>layer.clearLayers());
      const rows=displayedMarkers();
      for(const marker of rows){
        const pixel=markerToPixel(marker,state.data.coefficients);
        if(!pixel)continue;
        const title=markerTitle(marker);
        const leafletMarker=L.marker(T.toLeaflet(pixel,state.data.config.height),{icon:iconFor(marker),title,alt:title});
        leafletMarker.on("click",()=>selectMarker(marker,leafletMarker));
        leafletMarker.addTo(state.layers.get(marker.category));
        state.markerIndex.set(marker.id,leafletMarker);
      }
      $("public-map-empty").hidden=rows.length>0;
      updateSearchResults();
    }
    function markerTitle(marker){
      if(marker.category==="alpha-boss")return marker.pal?.name||marker.label||tr("Alpha Pal");
      if(marker.category==="fast-travel"&&(!marker.label||marker.label===marker.id||/^FTPoint|^WorldTree_/i.test(marker.label)))return tr("Ponto de Viagem Rápida");
      return tr(marker.label||"Nenhum detalhe adicional disponível");
    }
    function detailImage(marker){
      const url=marker.category==="alpha-boss"?`assets/pals/${encodeURIComponent(marker.pal.icon)}.png`:
        marker.category==="relic"?marker.icon:CATEGORIES[marker.category]?.icon;
      return url?`<div class="public-map-detail-image"><img src="${esc(url)}" alt="${esc(markerTitle(marker))}"></div>`:"";
    }
    const detailRenderer=env.PublicMapDetails?.createRenderer({env,document,tr,esc,number,langParam,maps:MAPS,categories:CATEGORIES,detailImage,markerTitle});
    async function renderMarkerDetails(marker){
      if(!detailRenderer){
        return `<span class="public-map-detail-kicker">${tr("DETALHES")}</span><h2 id="public-map-details-title">${esc(markerTitle(marker))}</h2><p>${tr("Nenhum detalhe adicional disponível")}</p>`;
      }
      return detailRenderer(marker);
    }
    async function selectMarker(marker,leafletMarker=null,{updateUrl=true}={}){
      state.selected=marker;
      const point=markerToPixel(marker,state.data.coefficients);
      if(point)state.map.panTo(T.toLeaflet(point,state.data.config.height),{animate:true});
      if(leafletMarker)leafletMarker.openPopup?.();
      $("public-map-details-content").innerHTML=`<span class="public-map-detail-kicker">${tr(CATEGORIES[marker.category]?.label||"DETALHES")}</span><h2 id="public-map-details-title">${esc(markerTitle(marker))}</h2><p>${tr("Carregando detalhes...")}</p>`;
      $("public-map-details").classList.add("is-open");
      $("public-map-details").focus({preventScroll:true});
      $("public-map-results").hidden=true;
      if(updateUrl){const url=new URL(location.href);url.searchParams.set("map",state.mapId);url.searchParams.set("marker",marker.id);history.replaceState(null,"",url);}
      const content=await renderMarkerDetails(marker);
      if(state.selected===marker)$("public-map-details-content").innerHTML=content;
    }
    function clearDetails({updateUrl=true}={}){
      state.selected=null;
      $("public-map-details").classList.remove("is-open");
      $("public-map-details-content").innerHTML=`<span class="public-map-detail-kicker">${tr("DETALHES")}</span><h2 id="public-map-details-title">${tr("Selecione um ponto")}</h2><p>${tr("Escolha um marcador no mapa ou use a busca para ver mais informações.")}</p>`;
      if(updateUrl){const url=new URL(location.href);url.searchParams.delete("marker");history.replaceState(null,"",url);}
    }
    function searchableMarkers(){
      const query=$("public-map-search").value;
      if(!normalizeText(query))return [];
      return state.data.markers.filter(marker=>marker.mapId===state.mapId&&markerMatches(marker,query,CATEGORIES[marker.category].label)).slice(0,30);
    }
    function updateSearchResults(){
      const rows=searchableMarkers();
      state.resultIndex=-1;
      $("public-map-search-count").textContent=$("public-map-search").value?`${rows.length} ${tr("resultados")}`:"";
      $("public-map-results").innerHTML=rows.map((marker,index)=>`<button class="public-map-result" type="button" role="option" data-result="${index}"><strong>${esc(markerTitle(marker))}</strong><span>${tr(CATEGORIES[marker.category].label)}</span></button>`).join("");
      $("public-map-results").hidden=!rows.length;
    }
    function chooseResult(index){
      const marker=searchableMarkers()[index];
      if(!marker)return;
      state.enabledByMap.get(state.mapId).add(marker.category);
      renderCategories();renderMarkers();
      selectMarker(marker,state.markerIndex.get(marker.id));
    }
    function setCategories(mode){
      const enabled=state.enabledByMap.get(state.mapId),counts=categoryCounts();
      enabled.clear();
      if(mode==="all")Object.keys(CATEGORIES).forEach(key=>{if(counts[key])enabled.add(key);});
      if(mode==="default")DEFAULT_CATEGORIES.forEach(key=>{if(counts[key])enabled.add(key);});
      renderCategories();renderMarkers();
    }
    function loadImage(config){
      return new Promise((resolve,reject)=>{
        const image=new Image();
        image.onload=()=>resolve(image);
        image.onerror=()=>reject(new Error("Imagem do mapa indisponível."));
        image.src=config.image;
      });
    }
    async function switchMap(mapId){
      status("Carregando mapa...");
      clearDetails({updateUrl:false});
      $("public-map-results").hidden=true;
      try{
        const data=await loadMapData(mapId);
        await loadImage(data.config);
        state.mapId=mapId;state.data=data;
        ensureMap();
        const bounds=L.latLngBounds([0,0],[data.config.height,data.config.width]);
        if(state.overlay)state.overlay.remove();
        state.overlay=L.imageOverlay(data.config.image,bounds,{alt:`${data.config.label} — ${tr("Mapa interativo")}`}).addTo(state.map);
        state.overlay.bringToBack();
        state.map.setMaxBounds(bounds.pad(.2));
        state.map.fitBounds(bounds);
        renderCategories();renderLegend();renderMarkers();
        const total=data.markers.length;
        status(`${data.config.label}: ${number(total)} ${tr("pontos fixos disponíveis")}.`);
        const requested=new URLSearchParams(location.search).get("marker");
        const requestedMarker=requested&&data.markers.find(row=>row.id===requested);
        if(requestedMarker){state.enabledByMap.get(mapId).add(requestedMarker.category);renderCategories();renderMarkers();selectMarker(requestedMarker,state.markerIndex.get(requestedMarker.id),{updateUrl:false});}
      }catch(error){
        console.error("Falha ao carregar mapa público",error);
        status("Não foi possível carregar o mapa. Tente novamente mais tarde.",true);
        $("public-map-empty").textContent=tr("Mapa indisponível.");
        $("public-map-empty").hidden=false;
      }
    }

    $("public-map-dataset").addEventListener("change",event=>{
      $("public-map-search").value="";
      const url=new URL(location.href);url.searchParams.set("map",event.target.value);url.searchParams.delete("marker");history.replaceState(null,"",url);
      switchMap(event.target.value);
    });
    $("public-map-category-options").addEventListener("change",event=>{
      if(event.target.type!=="checkbox")return;
      const enabled=state.enabledByMap.get(state.mapId);
      if(event.target.checked)enabled.add(event.target.value);else enabled.delete(event.target.value);
      renderMarkers();
    });
    $("public-map-search").addEventListener("input",()=>{renderMarkers();});
    $("public-map-search").addEventListener("keydown",event=>{
      const rows=searchableMarkers();
      if(event.key==="Escape"){$("public-map-search").value="";$("public-map-results").hidden=true;renderMarkers();return;}
      if(!rows.length)return;
      if(event.key==="ArrowDown"||event.key==="ArrowUp"){
        event.preventDefault();
        state.resultIndex=(state.resultIndex+(event.key==="ArrowDown"?1:-1)+rows.length)%rows.length;
        document.querySelectorAll(".public-map-result").forEach((button,index)=>button.classList.toggle("is-active",index===state.resultIndex));
      }
      if(event.key==="Enter"){event.preventDefault();chooseResult(state.resultIndex<0?0:state.resultIndex);}
    });
    $("public-map-results").addEventListener("click",event=>{
      const button=event.target.closest("[data-result]");
      if(button)chooseResult(Number(button.dataset.result));
    });
    $("public-map-enable-all").addEventListener("click",()=>setCategories("all"));
    $("public-map-disable-all").addEventListener("click",()=>setCategories("none"));
    $("public-map-reset").addEventListener("click",()=>{$("public-map-search").value="";setCategories("default");clearDetails();});
    $("public-map-details-close").addEventListener("click",clearDetails);
    $("public-map-filter-toggle").addEventListener("click",event=>{
      const open=!$("public-map-tools").classList.contains("is-open");
      $("public-map-tools").classList.toggle("is-open",open);
      event.currentTarget.setAttribute("aria-expanded",String(open));
    });
    document.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&state.selected){clearDetails();$("public-map-canvas").focus?.();}
    });
    ensureMap();
    const initialMap=new URLSearchParams(location.search).get("map");
    state.mapId=MAPS[initialMap]?initialMap:"mainworld5";
    $("public-map-dataset").value=state.mapId;
    switchMap(state.mapId);
  }

  return {MAPS,CATEGORIES,DEFAULT_CATEGORIES,ICON_SIZES,normalizeText,compileCalibration,markerToPixel,markerMatches,filterMarkers,loadMapData,init};
});
