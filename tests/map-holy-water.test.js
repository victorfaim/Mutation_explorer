const assert=require("assert");
const fs=require("fs");
const path=require("path");
const T=require("../mapa-lab-transform.js");
const root=path.resolve(__dirname,"..");
const data=JSON.parse(fs.readFileSync(path.join(root,"mapa-lab-data","worldtree-holy-water-markers.json"),"utf8"));
const calibration=JSON.parse(fs.readFileSync(path.join(root,"mapa-lab-data","worldtree-z5-calibration.json"),"utf8"));
const coefficients=T.fitSimilarity(calibration.referencePoints.filter(point=>point.use==="fit"));
assert.strictEqual(data.markers.length,3);
assert.strictEqual(new Set(data.markers.map(marker=>marker.id)).size,3);
for(const marker of data.markers){
  assert.strictEqual(marker.mapId,"worldtree");
  assert.strictEqual(marker.type,"holy-water");
  assert.strictEqual(marker.reward.itemId,"WorldTreeHolyWater");
  assert.strictEqual(marker.reward.quantity,10);
  assert.strictEqual(marker.cooldownSeconds,600);
  const image=T.normalize(T.nativeToPixel(marker.world,coefficients),8192,8192);
  assert(image.u>=0&&image.u<=1,`${marker.id}: U fora do mapa`);
  assert(image.v>=0&&image.v<=1,`${marker.id}: V fora do mapa`);
}
console.log("map-holy-water: 3 fontes válidas dentro da World Tree");
