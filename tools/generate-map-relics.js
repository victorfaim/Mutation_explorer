#!/usr/bin/env node
const fs=require("fs");
const path=require("path");
const {fitLine}=require("./generate-map-alpha-bosses.js");

const ROOT=path.resolve(__dirname,"..");
const SOURCE=path.join(ROOT,"LOCAL_RESEARCH","raw","fmodel","mutation","inbox","MainGrid_L15_X0_Y0_DL961A8730.json");
const TRAVEL=path.join(ROOT,"mapa-lab-data","mainworld5-markers.json");
const OUTPUT=path.join(ROOT,"mapa-lab-data","relic-markers.json");

const TYPES={
  BP_LevelObject_Relic_C:{key:"lifmunk",label:"Efígie de Lifmunk",pal:"Lifmunk",bonus:"Poder de captura",icon:"T_itemicon_Relic.png"},
  BP_LevelObject_Relic_FlameBambi_C:{key:"rooby",label:"Estátua de Rooby",pal:"Rooby",bonus:"Salto",icon:"T_itemicon_Relic_04.png"},
  BP_LevelObject_Relic_GuardianDog_C:{key:"yakumo",label:"Estátua de Yakumo",pal:"Yakumo",bonus:"Sorte iridescente",icon:"T_itemicon_Relic_11.png"},
  BP_LevelObject_Relic_IceCrocodile_C:{key:"munchill",label:"Estátua de Munchill",pal:"Munchill",bonus:"Preservação de alimentos",icon:"T_itemicon_Relic_03.png"},
  BP_LevelObject_Relic_LazyDragon_C:{key:"relaxaurus",label:"Estátua de Relaxaurus",pal:"Relaxaurus",bonus:"Experiência obtida",icon:"T_itemicon_Relic_10.png"},
  BP_LevelObject_Relic_LeafMomonga_C:{key:"herbil",label:"Estátua de Herbil",pal:"Herbil",bonus:"Capacidade de planar",icon:"T_itemicon_Relic_05.png"},
  BP_LevelObject_Relic_Monkey_C:{key:"tanzee",label:"Estátua de Tanzee",pal:"Tanzee",bonus:"Escalada",icon:"T_itemicon_Relic_06.png"},
  BP_LevelObject_Relic_Mutant_C:{key:"lunaris",label:"Estátua de Lunaris",pal:"Lunaris",bonus:"Perseguição de esferas",icon:"T_itemicon_Relic_09.png"},
  BP_LevelObject_Relic_NegativeKoala_C:{key:"depresso",label:"Estátua de Depresso",pal:"Depresso",bonus:"Resistência a condições negativas",icon:"T_itemicon_Relic_07.png"},
  BP_LevelObject_Relic_Penguin_C:{key:"pengullet",label:"Estátua de Pengullet",pal:"Pengullet",bonus:"Nado",icon:"T_itemicon_Relic_02.png"},
  BP_LevelObject_Relic_PinkCat_C:{key:"cattiva",label:"Estátua de Cattiva",pal:"Cattiva",bonus:"Redução de consumo de vigor",icon:"T_itemicon_Relic_08.png"},
  BP_LevelObject_Relic_SheepBall_C:{key:"lamball",label:"Estátua de Lamball",pal:"Lamball",bonus:"Saciedade",icon:"T_itemicon_Relic_01.png"}
};

function generate(){
  if(!fs.existsSync(SOURCE))throw new Error(`Fonte não encontrada: ${SOURCE}`);
  const exports=JSON.parse(fs.readFileSync(SOURCE,"utf8"));
  const travel=JSON.parse(fs.readFileSync(TRAVEL,"utf8")).markers;
  const samples=travel.map(marker=>({worldX:marker.native.x,worldY:marker.native.y,gameX:marker.game.x,gameY:marker.game.y}));
  const gameX=fitLine(samples,"worldY","gameX");
  const gameY=fitLine(samples,"worldX","gameY");
  const actors=exports.filter(entry=>TYPES[entry.Type]);
  const markers=actors.map((actor,index)=>{
    const definition=TYPES[actor.Type];
    const scene=exports.find(entry=>entry.Type==="SceneComponent"&&entry.Name==="DefaultSceneRoot"&&entry.Outer?.ObjectName?.includes(actor.Name));
    const location=scene?.Properties?.RelativeLocation;
    if(!location)throw new Error(`Coordenadas não encontradas: ${actor.Name}`);
    const world={x:location.X,y:location.Y,z:location.Z};
    const calculatedGame={x:gameX.scale*world.y+gameX.offset,y:gameY.scale*world.x+gameY.offset};
    const mapId=world.x>350000&&world.y< -500000?"worldtree":"mainworld5";
    return {
      id:`relic-${definition.key}-${index+1}`,
      type:"relic",mapId,subtype:definition.key,label:definition.label,pal:definition.pal,bonus:definition.bonus,
      icon:`assets/items/${definition.icon}`,world,
      game:{...calculatedGame,displayedX:Math.round(calculatedGame.x),displayedY:Math.round(calculatedGame.y)},
      source:{asset:"Pal/Content/Pal/Maps/MainWorld_5/MainGrid_L15_X0_Y0_DL961A8730",actor:actor.Name,blueprint:actor.Type.replace(/_C$/,"")}
    };
  });
  markers.sort((a,b)=>a.mapId.localeCompare(b.mapId)||a.subtype.localeCompare(b.subtype)||a.id.localeCompare(b.id));
  const themed=markers.filter(marker=>marker.source.blueprint!=="BP_LevelObject_Relic");
  const output={
    schemaVersion:1,revision:"pl-mainworld5-relics-v1",
    summary:{total:markers.length,mainworld5:markers.filter(row=>row.mapId==="mainworld5").length,worldtree:markers.filter(row=>row.mapId==="worldtree").length,capture:markers.length-themed.length,statues:themed.length},
    markers
  };
  fs.writeFileSync(OUTPUT,JSON.stringify(output),"utf8");
  return output;
}

if(require.main===module){
  const output=generate();
  console.log(`Relíquias geradas: ${output.summary.total} (${output.summary.mainworld5} Palpagos, ${output.summary.worldtree} World Tree; ${output.summary.capture} de captura e ${output.summary.statues} estátuas).`);
}
module.exports={generate,TYPES};
