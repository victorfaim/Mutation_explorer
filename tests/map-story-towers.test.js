#!/usr/bin/env node
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const T=require("../mapa-lab-transform.js");

const root=path.resolve(__dirname,"..");
const data=JSON.parse(fs.readFileSync(path.join(root,"mapa-lab-data","story-tower-markers.json"),"utf8"));
assert.deepStrictEqual(data.summary,{total:13,mainworld5:9,worldtree:4});
assert.strictEqual(data.markers.length,13);
for(const marker of data.markers){
  assert.ok(["mainworld5","worldtree"].includes(marker.mapId));
  assert.strictEqual(marker.type,"story-tower");
  assert.ok(marker.label&&marker.internalLabel&&marker.bossType);
  assert.ok([marker.world.x,marker.world.y,marker.world.z,marker.game.x,marker.game.y].every(Number.isFinite));
}
assert.strictEqual(new Set(data.markers.map(marker=>marker.source.actor)).size,13);
for(const mapId of ["mainworld5","worldtree"]){
  const file=mapId==="mainworld5"?"mainworld5-calibration.json":"worldtree-z5-calibration.json";
  const calibration=JSON.parse(fs.readFileSync(path.join(root,"mapa-lab-data",file),"utf8"));
  const fit=calibration.referencePoints.filter(point=>point.use!=="validation");
  const coefficients=calibration.model==="similarity"?T.fitSimilarity(fit):T.fitAffine(fit);
  for(const marker of data.markers.filter(row=>row.mapId===mapId)){
    const image=T.nativeToPixel(marker.world,coefficients);
    assert.ok(image.pixelX>=0&&image.pixelX<=8192&&image.pixelY>=0&&image.pixelY<=8192,`Torre fora do mapa: ${marker.id}`);
  }
}
for(const icon of ["fast-travel.png","story-tower.png"]){
  assert.ok(fs.existsSync(path.join(root,"assets","map","markers",icon)),`Ícone ausente: ${icon}`);
}
console.log("map-story-towers: 13 torres, mapas, coordenadas e ícones aprovados");
