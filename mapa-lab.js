const T=window.MapLabTransform;
const state={map:null,imageOverlay:null,imageUrl:null,width:0,height:0,data:null,calibration:null,coefficients:null,markerLayer:null,referenceLayer:null};
const $=id=>document.getElementById(id);

function esc(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));}
function number(value,digits=3){return Number.isFinite(value)?Number(value).toLocaleString("pt-BR",{maximumFractionDigits:digits}):"—";}
function status(message,error=false){$("map-lab-status").textContent=message;$("map-lab-status").classList.toggle("is-error",error);}
function rows(values){return Object.entries(values).map(([key,value])=>`<dt>${esc(key)}</dt><dd>${esc(value)}</dd>`).join("");}

function ensureMap(){
  if(state.map)return;
  state.map=L.map("map-lab-map",{crs:L.CRS.Simple,minZoom:-5,maxZoom:5,zoomSnap:.25,attributionControl:false});
  state.markerLayer=L.layerGroup().addTo(state.map);
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
  const points=calibrationPoints(),fit=points.filter(point=>point.use!=="validation");
  if(fit.length<3)throw new Error("Forneça ao menos três referências de ajuste não colineares.");
  state.coefficients=T.fitAffine(fit);
  const fitReport=T.validate(fit,state.coefficients);
  const validation=points.filter(point=>point.use==="validation");
  const validationReport=T.validate(validation,state.coefficients);
  const configured=state.calibration?.validation||{};
  const threshold=Number.isFinite(configured.maxErrorPixels)?configured.maxErrorPixels:null;
  const valid=!validation.length||threshold===null||validationReport.maxErrorPixels<=threshold;
  $("map-calibration-output").innerHTML=rows({
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
  if(marker.image&&Number.isFinite(marker.image.pixelX)&&Number.isFinite(marker.image.pixelY))return marker.image;
  if(marker.native&&state.coefficients)return T.nativeToPixel(marker.native,state.coefficients);
  return null;
}
function popup(marker,image){
  const normalized=state.width&&state.height?T.normalize(image,state.width,state.height):{};
  return `<strong>${esc(marker.label||marker.id)}</strong><br>`+
    `native: ${number(marker.native?.x)}, ${number(marker.native?.y)}, ${number(marker.native?.z)}<br>`+
    `jogo: ${number(marker.game?.x)}, ${number(marker.game?.y)}<br>`+
    `pixel: ${number(image.pixelX)}, ${number(image.pixelY)}<br>`+
    `normalizada: ${number(normalized.u,6)}, ${number(normalized.v,6)}<br>`+
    `origem: ${esc(marker.source?.asset||"—")} ${esc(marker.source?.row||"")}`;
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
  if(!$("map-show-markers").checked)state.map.removeLayer(state.markerLayer);else state.markerLayer.addTo(state.map);
  if(!$("map-show-references").checked)state.map.removeLayer(state.referenceLayer);else state.referenceLayer.addTo(state.map);
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

async function loadDefaults(){
  const base="LOCAL_RESEARCH/raw/mapa-lab/";
  const [dataResponse,calibrationResponse]=await Promise.all([fetch(base+"markers.json"),fetch(base+"calibration.json")]);
  if(!dataResponse.ok)throw new Error("markers.json não encontrado na pasta local padrão.");
  state.data=await dataResponse.json();
  state.calibration=calibrationResponse.ok?await calibrationResponse.json():null;
  const imagePath=state.data.map?.image||base+"map.png";
  const image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error(`Imagem não encontrada: ${imagePath}`));image.src=imagePath;});
  state.imageUrl=imagePath;setImage(imagePath,image.naturalWidth,image.naturalHeight);
  fitCalibration();status(`${state.data.markers?.length||0} marcadores carregados da pasta local.`);
}

$("map-image-file").addEventListener("change",async event=>{try{if(event.target.files[0])await loadImageFile(event.target.files[0]);status("Imagem local carregada.");}catch(error){status(error.message,true);}});
$("map-markers-file").addEventListener("change",async event=>{try{state.data=await readJson(event.target.files[0]);renderLayers();status(`${state.data.markers?.length||0} marcadores carregados.`);}catch(error){status(`JSON inválido: ${error.message}`,true);}});
$("map-calibration-file").addEventListener("change",async event=>{try{state.calibration=await readJson(event.target.files[0]);fitCalibration();status("Calibração carregada e validada.");}catch(error){status(`Calibração inválida: ${error.message}`,true);}});
$("map-load-defaults").addEventListener("click",()=>loadDefaults().catch(error=>status(error.message,true)));
$("map-fit-calibration").addEventListener("click",()=>{try{fitCalibration();status("Calibração recalculada.");}catch(error){status(error.message,true);}});
$("map-show-markers").addEventListener("change",renderLayers);
$("map-show-references").addEventListener("change",renderLayers);
ensureMap();
