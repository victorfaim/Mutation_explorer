#!/usr/bin/env node
const assert=require("assert");
const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const data=JSON.parse(fs.readFileSync(path.join(root,"mapa-lab-data","alpha-boss-markers.json"),"utf8"));
assert.deepStrictEqual(data.summary,{total:90,mainworld5:83,worldtree:7});
assert.strictEqual(data.markers.length,90);
for(const marker of data.markers){
  assert.ok(["mainworld5","worldtree"].includes(marker.mapId));
  assert.strictEqual(marker.type,"alpha-boss");
  assert.ok(marker.level>0&&/^BOSS_/i.test(marker.characterId));
  assert.ok([marker.world.x,marker.world.y,marker.world.z,marker.game.x,marker.game.y].every(Number.isFinite));
  assert.ok(marker.pal.name&&marker.pal.slug&&marker.pal.icon);
  assert.ok(fs.existsSync(path.join(root,"assets","pals",`${marker.pal.icon}.png`)),`Ícone ausente: ${marker.pal.icon}`);
}
assert.strictEqual(data.markers.filter(marker=>marker.spawnerId.startsWith("worldtree_")).length,6);
assert.strictEqual(data.markers.filter(marker=>marker.mapId==="worldtree"&&marker.spawnerId.startsWith("remainsIsland_")).length,1);
console.log("map-alpha-bosses: 90 pontos, mapas, coordenadas e ícones aprovados");
