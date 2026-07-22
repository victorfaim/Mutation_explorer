const T=window.MapLabTransform;
const state={map:null,imageOverlay:null,imageUrl:null,width:0,height:0,data:null,alphaData:null,calibration:null,coefficients:null,markerLayer:null,alphaLayer:null,referenceLayer:null,datasetKey:"mainworld5",mapConfig:null};
const $=id=>document.getElementById(id);

function esc(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));}
function number(value,digits=3){return Number.isFinite(value)?Number(value).toLocaleString("pt-BR",{maximumFractionDigits:digits}):"—";}
function status(message,error=false){$("map-lab-status").textContent=message;$("map-lab-status").classList.toggle("is-error",error);}
function rows(values){return Object.entries(values).map(([key,value])=>`<dt>${esc(key)}</dt><dd>${esc(value)}</dd>`).join("");}

function ensureMap(){
  if(state.map)return;
  state.map=L.map("map-lab-map",{crs:L.CRS.Simple,minZoom:-5,maxZoom:5,zoomSnap:.25,attributionControl:false});
  state.markerLayer=L.layerGroup().addTo(state.map);
  state.alphaLayer=L.layerGroup().addTo(state.map);
  state.referenceLayer=L.layerGroup().addTo(state.map);
  state.map.on("click",event=>inspectClick(event.latlng));
}

function setImage(url,width,height){
  ensureMap();
  state.width=width;state.height=height;
  const bounds=L.latLngBounds([0,0],[height,width]);
  if(state.imageOverlay)state.imageOverlay.remove();
  state.imageOverlay=L.imageOverlay(url,bounds,{interactive:false,alt:"Mapa local de calibração"}).addTo(state.map);
  state.imageOverlay.bringToBack();
  state.map.setMaxBounds(bounds.pad(.2));
  state.map.fitBounds(bounds);
  renderLayers();
}

function readJson(file){return file.text().then(text=>JSON.parse(text));}
function loadImageFile(file){
  if(state.imageUrl?.startsWith("blob:"))URL.revokeObjectURL(state.imageUrl);
  state.imageUrl=URL.createObjectURL(file);
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>{setImage(state.imageUrl,image.naturalWidth,image.naturalHeight);resolve();};
    image.onerror=()=>reject(new Error("Não foi possível ler a imagem selecionada."));
    image.src=state.imageUrl;
  });
}

function calibrationPoints(){return state.calibration?.referencePoints||state.data?.referencePoints||[];}
function fitCalibration(){
  const points=calibrationPoints();
  const usable=points.filter(point=>Number.isFinite(point.image?.pixelX)&&Number.isFinite(point.image?.pixelY)&&(point.world||point.native));
  const fit=usable.filter(point=>point.use!=="validation");
  const model=state.calibration?.model||"affine";
  const required=model==="similarity"?2:3;
  if(fit.length<required){
    state.coefficients=null;
    $("map-calibration-output").innerHTML=rows({"Estado":"Pendente para esta imagem","Pontos de ajuste":`${fit.length}/${required}`,"Validação independente":state.datasetKey==="worldtree"?"1 ponto":"—"});
    renderLayers();
    return false;
  }
  if(model==="similarity")state.coefficients=T.fitSimilarity(fit);
  else state.coefficients=T.fitAffine(fit);
  const fitReport=T.validate(fit,state.coefficients);
  const validation=usable.filter(point=>point.use==="validation");
  const validationReport=T.validate(validation,state.coefficients);
  const configured=state.calibration?.validation||{};
  const threshold=Number.isFinite(configured.maxErrorPixels)?configured.maxErrorPixels:null;
  const valid=!validation.length||threshold===null||validationReport.maxErrorPixels<=threshold;
  $("map-calibration-output").innerHTML=rows({
    "Modelo":model==="similarity"?"similaridade":"afim",
    "Pontos de ajuste":fitReport.count,
    "RMSE ajuste":`${number(fitReport.rmsePixels)} px`,
    "Pontos de validação":validationReport.count,
    "RMSE validação":validation.length?`${number(validationReport.rmsePixels)} px`:"—",
    "Erro máximo":validation.length?`${number(validationReport.maxErrorPixels)} px`:"—",
    "Limite":threshold===null?"não definido":`${number(threshold)} px`,
    "Resultado":valid?"válido":"reprovado"
  });
  renderLayers();
  return valid;
}

function markerImage(marker){
  const world=marker.world||marker.native;
  if(world&&state.coefficients)return T.nativeToPixel(world,state.coefficients);
  if(state.datasetKey==="worldtree")return null;
  if(marker.normalized&&Number.isFinite(marker.normalized.u)&&Number.isFinite(marker.normalized.v))return {pixelX:marker.normalized.u*state.width,pixelY:marker.normalized.v*state.height};
  if(marker.image&&Number.isFinite(marker.image.pixelX)&&Number.isFinite(marker.image.pixelY))return marker.image;
  return null;
}
function popup(marker,image){
  const world=marker.world||marker.native;
  const normalized=state.width&&state.height?T.normalize(image,state.width,state.height):{};
  return `<strong>${esc(marker.label||marker.id)}</strong><br>`+
    `world: ${number(world?.x)}, ${number(world?.y)}, ${number(world?.z)}<br>`+
    `jogo: ${number(marker.game?.x)}, ${number(marker.game?.y)}<br>`+
    `pixel: ${number(image.pixelX)}, ${number(image.pixelY)}<br>`+
    `normalizada: ${number(normalized.u,6)}, ${number(normalized.v,6)}<br>`+
    `origem: ${esc(marker.source?.asset||"—")} ${esc(marker.source?.row||"")}`;
}

function normalizedText(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
function currentAlphaBosses(){
  const query=normalizedText($("map-alpha-search").value);
  return (state.alphaData?.markers||[]).filter(marker=>marker.mapId===state.datasetKey&&(!query||normalizedText(`${marker.pal.name} ${marker.characterId} ${marker.pal.elements.join(" ")}`).includes(query)));
}
function alphaPopup(marker,image){
  const normalized=T.normalize(image,state.width,state.height);
  const icon=`assets/pals/${encodeURIComponent(marker.pal.icon)}.png`;
  const suffix=marker.pal.suffix?` / ${marker.pal.suffix}`:"";
  return `<div class="map-lab-alpha-popup"><img src="${icon}" alt="${esc(marker.pal.name)}"><div>`+
    `<strong>Alpha ${esc(marker.pal.name)}</strong><p>Nível ${number(marker.level,0)} · ${esc(marker.pal.elements.join(" / "))}</p>`+
    `<p>Palpedia N-#${esc(marker.pal.index)}${esc(suffix)}</p><p>jogo: ${number(marker.game.displayedX,0)}, ${number(marker.game.displayedY,0)}</p>`+
    `<p>world: ${number(marker.world.x)}, ${number(marker.world.y)}, ${number(marker.world.z)}</p>`+
    `<p>normalizada: ${number(normalized.u,6)}, ${number(normalized.v,6)}</p>`+
    `<a href="pal.html?pal=${encodeURIComponent(marker.pal.slug)}">Abrir na Palpedia</a></div></div>`;
}
function renderAlphaOptions(){
  const names=[...new Set((state.alphaData?.markers||[]).filter(marker=>marker.mapId===state.datasetKey).map(marker=>marker.pal.name))].sort((a,b)=>a.localeCompare(b));
  $("map-alpha-options").innerHTML=names.map(name=>`<option value="${esc(name)}"></option>`).join("");
}
function renderAlphaLayer(){
  if(!state.map||!state.width||!state.height)return;
  state.alphaLayer.clearLayers();
  for(const marker of currentAlphaBosses()){
    const image=markerImage(marker);if(!image)continue;
    const iconPath=`assets/pals/${encodeURIComponent(marker.pal.icon)}.png`;
    const icon=L.divIcon({className:"map-lab-alpha-icon",html:`<img src="${iconPath}" alt="">`,iconSize:[34,34],iconAnchor:[17,17],popupAnchor:[0,-18]});
    L.marker(T.toLeaflet(image,state.height),{icon}).bindPopup(alphaPopup(marker,image)).addTo(state.alphaLayer);
  }
  if(!$("map-show-alpha-bosses").checked)state.map.removeLayer(state.alphaLayer);else state.alphaLayer.addTo(state.map);
}

function renderLayers(){
  if(!state.map||!state.width||!state.height)return;
  state.markerLayer.clearLayers();state.referenceLayer.clearLayers();
  const markerIcon=L.divIcon({className:"map-lab-marker",iconSize:[12,12],iconAnchor:[6,6]});
  const referenceIcon=L.divIcon({className:"map-lab-reference",iconSize:[12,12],iconAnchor:[6,6]});
  for(const marker of state.data?.markers||[]){
    const image=markerImage(marker);if(!image)continue;
    L.marker(T.toLeaflet(image,state.height),{icon:markerIcon}).bindPopup(popup(marker,image)).addTo(state.markerLayer);
  }
  for(const point of calibrationPoints()){
    if(!point.image)continue;
    L.marker(T.toLeaflet(point.image,state.height),{icon:referenceIcon}).bindPopup(popup(point,point.image)).addTo(state.referenceLayer);
  }
  if(!$("map-show-fast-travel").checked)state.map.removeLayer(state.markerLayer);else state.markerLayer.addTo(state.map);
  if(!$("map-show-references").checked)state.map.removeLayer(state.referenceLayer);else state.referenceLayer.addTo(state.map);
  renderAlphaLayer();
}

function inspectClick(latlng){
  const image=T.fromLeaflet(latlng,state.height),normalized=T.normalize(image,state.width,state.height);
  let native=null;
  try{if(state.coefficients)native=T.pixelToNative(image,state.coefficients);}catch(error){status(error.message,true);}
  $("map-coordinate-output").innerHTML=rows({
    "Pixel X":number(image.pixelX),"Pixel Y":number(image.pixelY),
    "Normalizada U":number(normalized.u,6),"Normalizada V":number(normalized.v,6),
    "Nativo X":number(native?.x),"Nativo Y":number(native?.y),"Nativo Z":"não inferido",
    "Leaflet [Y,X]":`${number(latlng.lat)}, ${number(latlng.lng)}`
  });
}

async function loadDefaults(datasetKey=$("map-dataset").value){
  state.datasetKey=datasetKey;state.mapConfig=null;state.coefficients=null;
  const datasets={
    mainworld5:[
      {markers:"mapa-lab-data/mainworld5-markers.json",calibration:"mapa-lab-data/mainworld5-calibration.json"},
      {markers:"LOCAL_RESEARCH/raw/mapa-lab/markers.json",calibration:"LOCAL_RESEARCH/raw/mapa-lab/calibration.json"}
    ],
    worldtree:[]
  };
  let candidates=datasets[datasetKey]||datasets.mainworld5;
  if(datasetKey==="worldtree"){
    const configResponse=await fetch("mapa-lab-data/worldtree-map-config.json?v=20260721-2");
    if(!configResponse.ok)throw new Error("Configuração local da World Tree não encontrada.");
    state.mapConfig=await configResponse.json();
    candidates=[{markers:state.mapConfig.paths.markers,calibration:state.mapConfig.paths.calibration}];
  }
  let dataResponse=null,calibrationResponse=null;
  for(const candidate of candidates){
    const responses=await Promise.all([fetch(candidate.markers),fetch(candidate.calibration)]);
    if(responses[0].ok){[dataResponse,calibrationResponse]=responses;break;}
  }
  if(!dataResponse)throw new Error("Dados do mapa não encontrados.");
  if(!state.alphaData){
    const alphaResponse=await fetch("mapa-lab-data/alpha-boss-markers.json?v=20260721-1");
    if(!alphaResponse.ok)throw new Error("Dados de Alpha Bosses não encontrados.");
    state.alphaData=await alphaResponse.json();
  }
  state.data=await dataResponse.json();
  state.calibration=calibrationResponse.ok?await calibrationResponse.json():null;
  const imagePath=state.mapConfig?.paths?.webImage||state.mapConfig?.paths?.composedImage||state.data.map?.image||"LOCAL_RESEARCH/raw/mapa-lab/map.png";
  const image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error(datasetKey==="worldtree"?`Imagem local não encontrada: ${imagePath}. Execute: python tools/world_tree_tiles.py all`:`Imagem não encontrada: ${imagePath}`));image.src=imagePath;});
  state.imageUrl=imagePath;setImage(imagePath,image.naturalWidth,image.naturalHeight);
  const calibrated=fitCalibration();
  renderAlphaOptions();
  const alphaCount=(state.alphaData.markers||[]).filter(marker=>marker.mapId===datasetKey).length;
  const message=datasetKey==="worldtree"&&!calibrated
    ?`World Tree local carregada. Transformação pendente; marcadores preservados, mas ocultos até a calibração da imagem 8192×8192.`
    :`${state.data.markers?.length||0} viagens rápidas e ${alphaCount} Alpha Bosses disponíveis.`;
  status(message);
}

$("map-image-file").addEventListener("change",async event=>{try{if(event.target.files[0])await loadImageFile(event.target.files[0]);status("Imagem local carregada.");}catch(error){status(error.message,true);}});
$("map-markers-file").addEventListener("change",async event=>{try{state.data=await readJson(event.target.files[0]);renderLayers();status(`${state.data.markers?.length||0} marcadores carregados.`);}catch(error){status(`JSON inválido: ${error.message}`,true);}});
$("map-calibration-file").addEventListener("change",async event=>{try{state.calibration=await readJson(event.target.files[0]);fitCalibration();status("Calibração carregada e validada.");}catch(error){status(`Calibração inválida: ${error.message}`,true);}});
$("map-load-defaults").addEventListener("click",()=>loadDefaults().catch(error=>status(error.message,true)));
$("map-fit-calibration").addEventListener("click",()=>{try{fitCalibration();status("Calibração recalculada.");}catch(error){status(error.message,true);}});
$("map-show-fast-travel").addEventListener("change",renderLayers);
$("map-show-alpha-bosses").addEventListener("change",renderAlphaLayer);
$("map-alpha-search").addEventListener("input",()=>{if($("map-alpha-search").value)$("map-show-alpha-bosses").checked=true;renderAlphaLayer();});
$("map-show-references").addEventListener("change",renderLayers);
$("map-dataset").addEventListener("change",event=>{$("map-alpha-search").value="";loadDefaults(event.target.value).catch(error=>status(error.message,true));});
ensureMap();
loadDefaults().catch(error=>status(error.message,true));
