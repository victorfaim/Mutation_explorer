#!/usr/bin/env node
const fs=require("fs");
const path=require("path");
const vm=require("vm");

const ROOT=path.resolve(__dirname,"..");
const SOURCE=path.join(ROOT,"LOCAL_RESEARCH","raw","fmodel","mutation","inbox","DT_BossSpawnerLoactionData.json");
const PALPEDIA=path.join(ROOT,"palpedia-data.js");
const TRAVEL=path.join(ROOT,"mapa-lab-data","mainworld5-markers.json");
const OUTPUT=path.join(ROOT,"mapa-lab-data","alpha-boss-markers.json");

function fitLine(samples,inputKey,outputKey){
  const n=samples.length;
  const sumX=samples.reduce((sum,row)=>sum+row[inputKey],0);
  const sumY=samples.reduce((sum,row)=>sum+row[outputKey],0);
  const sumXX=samples.reduce((sum,row)=>sum+row[inputKey]**2,0);
  const sumXY=samples.reduce((sum,row)=>sum+row[inputKey]*row[outputKey],0);
  const scale=(n*sumXY-sumX*sumY)/(n*sumXX-sumX**2);
  return {scale,offset:(sumY-scale*sumX)/n};
}

function loadPalpedia(){
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(PALPEDIA,"utf8"),context,{filename:PALPEDIA});
  return Object.values(context.window.PALPEDIA_DATA||{});
}

function generate(){
  if(!fs.existsSync(SOURCE))throw new Error(`Fonte não encontrada: ${SOURCE}`);
  const source=JSON.parse(fs.readFileSync(SOURCE,"utf8"));
  const rows=Object.values(source.find(entry=>entry.Type==="DataTable")?.Rows||{});
  const pals=loadPalpedia();
  const palByKey=new Map(pals.map(pal=>[String(pal.key).toLowerCase(),pal]));
  const travel=JSON.parse(fs.readFileSync(TRAVEL,"utf8")).markers;
  const samples=travel.map(marker=>({worldX:marker.native.x,worldY:marker.native.y,gameX:marker.game.x,gameY:marker.game.y}));
  const gameX=fitLine(samples,"worldY","gameX");
  const gameY=fitLine(samples,"worldX","gameY");
  const markers=[];
  for(const row of rows){
    if(!row.CharacterID||row.CharacterID==="None")continue;
    const palKey=String(row.CharacterID).replace(/^BOSS_/i,"");
    const pal=palByKey.get(palKey.toLowerCase());
    if(!pal)throw new Error(`Pal não encontrado na Palpedia: ${row.CharacterID}`);
    const world={x:row.Location.X,y:row.Location.Y,z:row.Location.Z};
    const isWorldTree=/^worldtree_/i.test(row.SpawnerID)||(world.x>350000&&world.y< -500000);
    const calculatedGame={x:gameX.scale*world.y+gameX.offset,y:gameY.scale*world.x+gameY.offset};
    markers.push({
      id:`alpha-${row.SpawnerID}-${markers.length}`,
      type:"alpha-boss",
      mapId:isWorldTree?"worldtree":"mainworld5",
      label:pal.name,
      level:row.Level,
      characterId:row.CharacterID,
      spawnerId:row.SpawnerID,
      world,
      game:{...calculatedGame,displayedX:Math.round(calculatedGame.x),displayedY:Math.round(calculatedGame.y)},
      pal:{id:pal.id,slug:pal.slug,key:pal.key,name:pal.name,index:pal.index,suffix:pal.suffix||"",elements:pal.elements||[],icon:pal.icon},
      source:{asset:"Pal/Content/Pal/DataTable/UI/DT_BossSpawnerLoactionData",row:row.SpawnerID}
    });
  }
  markers.sort((a,b)=>a.mapId.localeCompare(b.mapId)||a.level-b.level||a.label.localeCompare(b.label));
  const output={schemaVersion:1,revision:"dt-boss-spawner-location-v1",summary:{total:markers.length,mainworld5:markers.filter(row=>row.mapId==="mainworld5").length,worldtree:markers.filter(row=>row.mapId==="worldtree").length},markers};
  fs.writeFileSync(OUTPUT,JSON.stringify(output),"utf8");
  return output;
}

if(require.main===module){
  const output=generate();
  console.log(`Alpha Bosses gerados: ${output.summary.total} (${output.summary.mainworld5} Palpagos, ${output.summary.worldtree} World Tree).`);
}

module.exports={fitLine,generate};
