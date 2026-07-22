const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const data=JSON.parse(fs.readFileSync(path.join(root,"mapa-lab-data","relic-markers.json"),"utf8"));

assert.deepStrictEqual(data.summary,{total:407,mainworld5:360,worldtree:47,capture:155,statues:252});
assert.strictEqual(data.markers.length,407);
assert.strictEqual(new Set(data.markers.map(marker=>marker.id)).size,407);
assert.strictEqual(new Set(data.markers.map(marker=>marker.subtype)).size,12);
assert.ok(!data.markers.some(marker=>/mimog/i.test(`${marker.label} ${marker.pal} ${marker.subtype}`)));
for(const marker of data.markers){
  assert.strictEqual(marker.type,"relic");
  assert.ok(["mainworld5","worldtree"].includes(marker.mapId));
  assert.ok(marker.label&&marker.bonus&&marker.icon);
  assert.ok([marker.world.x,marker.world.y,marker.world.z,marker.game.x,marker.game.y].every(Number.isFinite));
  assert.ok(fs.existsSync(path.join(root,marker.icon)),`Ícone ausente: ${marker.icon}`);
}
console.log("map-relics: ok");
