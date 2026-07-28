const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const PublicMap=require("../mapa.js");
const T=require("../mapa-lab-transform.js");

const html=fs.readFileSync(path.join(root,"mapa.html"),"utf8");
const core=fs.readFileSync(path.join(root,"core.js"),"utf8");
const i18n=fs.readFileSync(path.join(root,"i18n.js"),"utf8");
const lab=fs.readFileSync(path.join(root,"mapa-lab.html"),"utf8");

for(const file of ["mapa.html","mapa.css","mapa.js","mapa-lab.html","mapa-lab.js","mapa-lab-transform.js"]){
  assert(fs.existsSync(path.join(root,file)),`Arquivo ausente: ${file}`);
}
for(const reference of ["vendor/leaflet/leaflet.js","mapa-lab-transform.js","mapa-details.js","mapa.js","mapa.css"]){
  assert(html.includes(reference),`Dependência pública ausente: ${reference}`);
}
assert(core.includes('href:"mapa.html"'),"Menu público não aponta para mapa.html");
assert(!core.includes('href:"mapa-lab.html",label:"Mapa"'),"Mapa Lab ainda é destino do menu público");
assert(lab.includes("mapa-lab.js"),"Mapa Lab deixou de ser uma superfície separada");

const {mainworld5,worldtree}=PublicMap.MAPS;
assert.notStrictEqual(mainworld5.image,worldtree.image);
assert.notStrictEqual(mainworld5.calibration,worldtree.calibration);
assert.notStrictEqual(mainworld5.markers,worldtree.markers);
assert.strictEqual(mainworld5.width,8192);
assert.strictEqual(worldtree.width,8192);

const mainCalibration=JSON.parse(fs.readFileSync(path.join(root,mainworld5.calibration),"utf8"));
const worldCalibration=JSON.parse(fs.readFileSync(path.join(root,worldtree.calibration),"utf8"));
const mainCoefficients=PublicMap.compileCalibration(mainCalibration);
const worldCoefficients=PublicMap.compileCalibration(worldCalibration);
assert.notDeepStrictEqual(mainCoefficients,worldCoefficients,"Mapas reutilizam indevidamente a mesma transformação");

const alphaData=JSON.parse(fs.readFileSync(path.join(root,"mapa-lab-data","alpha-boss-markers.json"),"utf8"));
const mainAlpha=alphaData.markers.find(marker=>marker.mapId==="mainworld5");
const worldAlpha=alphaData.markers.find(marker=>marker.mapId==="worldtree");
const mainPixel=PublicMap.markerToPixel(mainAlpha,mainCoefficients);
const worldPixel=PublicMap.markerToPixel(worldAlpha,worldCoefficients);
assert([mainPixel.pixelX,mainPixel.pixelY,worldPixel.pixelX,worldPixel.pixelY].every(Number.isFinite));
assert.deepStrictEqual(T.toLeaflet(mainPixel,mainworld5.height),[mainworld5.height-mainPixel.pixelY,mainPixel.pixelX]);

const sample=[
  {...mainAlpha,category:"alpha-boss"},
  {...worldAlpha,category:"alpha-boss"},
  {id:"tower-test",mapId:"mainworld5",category:"story-tower",label:"Torre teste"}
];
assert.strictEqual(PublicMap.filterMarkers(sample,"mainworld5",new Set(["alpha-boss"])).length,1,"Troca de mapa mistura marcadores");
assert.strictEqual(PublicMap.filterMarkers(sample,"mainworld5",new Set(["story-tower"])).length,1,"Filtro de categoria falhou");
assert(PublicMap.markerMatches(mainAlpha,mainAlpha.pal.name.toUpperCase(),"Alpha Pals fixos"));
assert(PublicMap.markerMatches({label:"Ruína Gelada"},"ruina"));
assert.strictEqual(PublicMap.filterMarkers([], "mainworld5", new Set(["story-tower"])).length,0);

for(const key of ["Mapa Interativo","Viagem rápida","Torres de história","Alpha Pals fixos","Água Benta","Relíquias e estátuas","Mapa indisponível."]){
  assert(i18n.includes(`"${key}"`),`Tradução pública ausente: ${key}`);
}
assert(html.includes('id="public-map-details-close"'));
assert(html.includes('type="search"'));
assert(html.includes('role="status"'));
assert(html.includes("mapa-lab-transform.js"),"Pixels não usam o transformador validado");
assert(!html.includes("map-coordinate-output"));
assert(!html.includes("map-calibration-output"));
assert(!html.includes("map-fit-calibration"));
assert(!html.includes("habitat-pilot"));
assert(html.includes("item-icon-map.js?v=20260728-2"));
assert(html.includes("core.js?v=20260728-2"));
assert(PublicMap.DEFAULT_CATEGORIES.length<3,"Estado padrão visualmente excessivo");
assert.deepStrictEqual(PublicMap.ICON_SIZES,{"fast-travel":30,"story-tower":38,"alpha-boss":34,"holy-water":32,relic:30},"Tamanhos devem acompanhar o Mapa Lab");
assert(html.includes("mapa.css?v=20260728-1"));
assert(html.includes("mapa-details.js?v=20260728-5"));
assert(html.includes("mapa.js?v=20260728-3"));
assert(html.includes('id="public-map-details" class="public-map-details" aria-live="polite"'));
assert.strictEqual((html.match(/id="public-map-details"/g)||[]).length,1,"Deve existir um único painel visual de detalhes");

console.log("public-map: separação, mapas, filtros, busca, projeção e i18n aprovados");
