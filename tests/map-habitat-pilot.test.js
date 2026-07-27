const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const data=JSON.parse(fs.readFileSync(path.join(root,"mapa-lab-data","habitat-pilot.json"),"utf8"));
assert.equal(data.mapId,"mainworld5");
assert.equal(data.coverage,"partial");
assert.equal(data.incomplete,true);
assert.equal(data.radiusNative,10000);
assert.equal(data.pals.length,2);
const expected={Lamball:{count:48,time:"day"},Depresso:{count:30,time:"night"}};
for(const pal of data.pals){
  assert.equal(pal.points.length,expected[pal.name].count);
  assert.deepEqual(pal.availableTimes,[expected[pal.name].time]);
  assert(fs.existsSync(path.join(root,pal.icon)),`Icone ausente: ${pal.icon}`);
  const actors=new Set();
  for(const point of pal.points){
    assert([point.world.x,point.world.y,point.world.z].every(Number.isFinite));
    assert(!point.source.actorType.toLowerCase().includes("boss"));
    assert(!actors.has(point.source.actor),`Ator duplicado: ${point.source.actor}`);
    actors.add(point.source.actor);
  }
}
console.log("Habitat piloto validado: Lamball=48 (dia), Depresso=30 (noite).");
