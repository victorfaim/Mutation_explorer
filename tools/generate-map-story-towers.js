#!/usr/bin/env node
const fs=require("fs");
const path=require("path");
const {fitLine}=require("./generate-map-alpha-bosses.js");

const ROOT=path.resolve(__dirname,"..");
const SOURCE=path.join(ROOT,"LOCAL_RESEARCH","raw","mapa-lab","PL_MainWorld5.json");
const TRAVEL=path.join(ROOT,"mapa-lab-data","mainworld5-markers.json");
const OUTPUT=path.join(ROOT,"mapa-lab-data","story-tower-markers.json");

const LABELS={
  BP_PalBossTower_Forest:"Torre de história — Forest",
  BP_PalBossTower_Volcano:"Torre de história — Volcano",
  BP_PalBossTower_Snow:"Torre de história — Snow",
  BP_PalBossTower_Desert:"Torre de história — Desert",
  BP_PalBossTower_Grass:"Torre de história — Grass",
  BP_PalBossTower_Sorajima:"Torre de história — Sorajima",
  BP_PalBossTower_Yamijima:"Torre de história — Yamijima",
  BP_PalBossTower:"Torre de história — Sakurajima",
  BP_PalBossTower_KingWhale:"Torre de história — KingWhale",
  BP_PalBossTower_MiddleBoss1:"World Tree — torre intermediária 1",
  BP_PalBossTower_MiddleBoss2:"World Tree — torre intermediária 2",
  BP_PalBossTower_MiddleBoss3:"World Tree — torre intermediária 3",
  BP_PalBossTower_LastBoss:"World Tree — torre final"
};

function generate(){
  if(!fs.existsSync(SOURCE))throw new Error(`Fonte não encontrada: ${SOURCE}`);
  const exports=JSON.parse(fs.readFileSync(SOURCE,"utf8"));
  const travel=JSON.parse(fs.readFileSync(TRAVEL,"utf8")).markers;
  const samples=travel.map(marker=>({worldX:marker.native.x,worldY:marker.native.y,gameX:marker.game.x,gameY:marker.game.y}));
  const gameX=fitLine(samples,"worldY","gameX");
  const gameY=fitLine(samples,"worldX","gameY");
  const actors=exports.filter(entry=>/^BP_PalBossTower/.test(entry.Type));
  const markers=actors.map(actor=>{
    const scene=exports.find(entry=>entry.Type==="SceneComponent"&&entry.Name==="Scene"&&entry.Outer?.ObjectName?.includes(actor.Name));
    const location=scene?.Properties?.RelativeLocation;
    if(!location)throw new Error(`Coordenadas não encontradas: ${actor.ActorLabel||actor.Name}`);
    const world={x:location.X,y:location.Y,z:location.Z};
    const calculatedGame={x:gameX.scale*world.y+gameX.offset,y:gameY.scale*world.x+gameY.offset};
    const bossType=String(actor.Properties?.BossType||actor.Type.replace(/_C$/,""));
    const mapId=/WorldTree/i.test(bossType)||world.x>350000&&world.y< -500000?"worldtree":"mainworld5";
    const towerKey=String(actor.ActorLabel||actor.Name).replace(/^BP_PalBossTower_?/,"")||bossType.replace(/^EPalBossType::/,"");
    return {
      id:`tower-${towerKey.toLowerCase()}`,
      type:"story-tower",mapId,
      label:LABELS[actor.ActorLabel]||actor.ActorLabel||actor.Name,
      internalLabel:actor.ActorLabel||actor.Name,bossType,world,
      game:{...calculatedGame,displayedX:Math.round(calculatedGame.x),displayedY:Math.round(calculatedGame.y)},
      source:{asset:"Pal/Content/Pal/Maps/MainWorld_5/PL_MainWorld5",actor:actor.Name}
    };
  });
  markers.sort((a,b)=>a.mapId.localeCompare(b.mapId)||a.label.localeCompare(b.label));
  const output={schemaVersion:1,revision:"pl-mainworld5-story-towers-v1",summary:{total:markers.length,mainworld5:markers.filter(row=>row.mapId==="mainworld5").length,worldtree:markers.filter(row=>row.mapId==="worldtree").length},markers};
  fs.writeFileSync(OUTPUT,JSON.stringify(output),"utf8");
  return output;
}

if(require.main===module){
  const output=generate();
  console.log(`Torres geradas: ${output.summary.total} (${output.summary.mainworld5} Palpagos, ${output.summary.worldtree} World Tree).`);
}
module.exports={generate};
