#!/usr/bin/env node
const fs=require("fs");
const path=require("path");
const {fitLine}=require("./generate-map-alpha-bosses.js");

const ROOT=path.resolve(__dirname,"..");
const SOURCE=path.join(ROOT,"LOCAL_RESEARCH","raw","mapa-lab","PL_MainWorld5.json");
const TRAVEL=path.join(ROOT,"mapa-lab-data","mainworld5-markers.json");
const OUTPUT=path.join(ROOT,"mapa-lab-data","story-tower-markers.json");
const INBOX=path.join(ROOT,"LOCAL_RESEARCH","raw","fmodel","mutation","inbox");
const BOSS_MANAGER=path.join(INBOX,"BP_PalBossBattleManager.json");
const PAL_PARAMETERS=path.join(INBOX,"DT_PalMonsterParameter_Common.json");
const BOSS_TYPE_OVERRIDES={BP_PalBossTower_KingWhale:"EPalBossType::KingWhaleBoss"};
const LOCALES={
  "pt-BR":path.join(INBOX,"pt-BR","Pal","DataTable","Text"),
  "en-US":path.join(INBOX,"en","Pal","DataTable","Text")
};

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

function dataTableRows(file){
  const exports=JSON.parse(fs.readFileSync(file,"utf8"));
  return exports.find(entry=>entry.Type==="DataTable")?.Rows||{};
}

function localizedText(rows,key){
  return rows[key]?.TextData?.LocalizedString||rows[key]?.TextData?.SourceString||key;
}

function loadBattleData(){
  for(const file of [BOSS_MANAGER,PAL_PARAMETERS]){
    if(!fs.existsSync(file))throw new Error("Fonte de batalha não encontrada: "+file);
  }
  const manager=JSON.parse(fs.readFileSync(BOSS_MANAGER,"utf8"))
    .find(entry=>entry.Name==="Default__BP_PalBossBattleManager_C")?.Properties;
  const palRows=dataTableRows(PAL_PARAMETERS);
  if(!manager?.BossInfoMap)throw new Error("BossInfoMap não encontrado no manager");
  const localeRows={};
  for(const [locale,dir] of Object.entries(LOCALES)){
    localeRows[locale]={
      names:dataTableRows(path.join(dir,"DT_PalNameText_Common.json")),
      prefixes:dataTableRows(path.join(dir,"DT_NamePrefixText_Common.json")),
      items:dataTableRows(path.join(dir,"DT_ItemNameText_Common.json"))
    };
  }
  const hpRates=Object.fromEntries((manager.MultiPlayerBossHPMap||[]).map(row=>[row.Key,row.Value]));
  const rewardNames=itemId=>Object.fromEntries(Object.entries(localeRows).map(([locale,tables])=>[locale,localizedText(tables.items,"ITEM_NAME_"+itemId)]));
  return new Map(manager.BossInfoMap.map(entry=>{
    const difficulties=(entry.Value.DifficultyParameter||[]).map(row=>{
      const value=row.Value||{},pal=palRows[value.PalId?.Key]||{};
      return {
        difficulty:String(row.Key||"").replace(/^EPalBossBattleDifficulty::/,"").toLowerCase(),
        characterId:value.PalId?.Key||"",
        names:Object.fromEntries(Object.entries(localeRows).map(([locale,tables])=>[locale,{
          title:localizedText(tables.prefixes,pal.NamePrefixID),
          name:localizedText(tables.names,pal.OverrideNameTextID)
        }])),
        level:value.Level,
        elements:[pal.ElementType1,pal.ElementType2]
          .map(element=>String(element||"").replace(/^EPalElementType::/,""))
          .filter(element=>element&&element!=="None"),
        battleTimeSeconds:value.BattleTimeLimit,
        readyPhaseSeconds:value.ReadyPhaseTimeLimit,
        capturePhaseSeconds:value.CapturePhaseTimeLimit,
        hpParameters:{base:pal.Hp,enemyMaxRate:pal.EnemyMaxHPRate},
        rewards:(value.SuccessItemList||[]).map(reward=>({
          itemId:reward.ItemName?.Key||"",names:rewardNames(reward.ItemName?.Key||""),rate:reward.Rate,min:reward.Min,max:reward.Max
        }))
      };
    });
    return [entry.Key,{
      difficulties,
      oneTimeRewards:(entry.Value.OneTimeRewards||[]).map(row=>({itemId:row.Key,names:rewardNames(row.Key),rate:100,min:1,max:1})),
      multiplayerHpRates:hpRates,
      hpRoundingConfidence:"partial",
      source:{
        manager:"Pal/Content/Pal/Blueprint/System/BP_PalBossBattleManager",
        parameters:"Pal/Content/Pal/DataTable/Character/DT_PalMonsterParameter_Common"
      }
    }];
  }));
}

function generate(){
  if(!fs.existsSync(SOURCE))throw new Error(`Fonte não encontrada: ${SOURCE}`);
  const exports=JSON.parse(fs.readFileSync(SOURCE,"utf8"));
  const travel=JSON.parse(fs.readFileSync(TRAVEL,"utf8")).markers;
  const samples=travel.map(marker=>({worldX:marker.native.x,worldY:marker.native.y,gameX:marker.game.x,gameY:marker.game.y}));
  const gameX=fitLine(samples,"worldY","gameX");
  const gameY=fitLine(samples,"worldX","gameY");
  const battleData=loadBattleData();
  const actors=exports.filter(entry=>/^BP_PalBossTower/.test(entry.Type));
  const markers=actors.map(actor=>{
    const scene=exports.find(entry=>entry.Type==="SceneComponent"&&entry.Name==="Scene"&&entry.Outer?.ObjectName?.includes(actor.Name));
    const location=scene?.Properties?.RelativeLocation;
    if(!location)throw new Error(`Coordenadas não encontradas: ${actor.ActorLabel||actor.Name}`);
    const world={x:location.X,y:location.Y,z:location.Z};
    const calculatedGame={x:gameX.scale*world.y+gameX.offset,y:gameY.scale*world.x+gameY.offset};
    const rawBossType=String(actor.Properties?.BossType||actor.Type.replace(/_C$/,""));
    const bossType=BOSS_TYPE_OVERRIDES[rawBossType]||rawBossType;
    const mapId=/WorldTree/i.test(bossType)||world.x>350000&&world.y< -500000?"worldtree":"mainworld5";
    const towerKey=String(actor.ActorLabel||actor.Name).replace(/^BP_PalBossTower_?/,"")||bossType.replace(/^EPalBossType::/,"");
    const battle=battleData.get(bossType);
    if(!battle)throw new Error("Dados de batalha não encontrados: "+bossType);
    return {
      id:`tower-${towerKey.toLowerCase()}`,
      type:"story-tower",mapId,
      label:LABELS[actor.ActorLabel]||actor.ActorLabel||actor.Name,
      internalLabel:actor.ActorLabel||actor.Name,bossType,world,
      game:{...calculatedGame,displayedX:Math.round(calculatedGame.x),displayedY:Math.round(calculatedGame.y)},
      source:{asset:"Pal/Content/Pal/Maps/MainWorld_5/PL_MainWorld5",actor:actor.Name},
      battle
    };
  });
  markers.sort((a,b)=>a.mapId.localeCompare(b.mapId)||a.label.localeCompare(b.label));
  const output={schemaVersion:2,revision:"pl-mainworld5-story-towers-battle-v2",summary:{total:markers.length,mainworld5:markers.filter(row=>row.mapId==="mainworld5").length,worldtree:markers.filter(row=>row.mapId==="worldtree").length},markers};
  fs.writeFileSync(OUTPUT,JSON.stringify(output),"utf8");
  return output;
}

if(require.main===module){
  const output=generate();
  console.log(`Torres geradas: ${output.summary.total} (${output.summary.mainworld5} Palpagos, ${output.summary.worldtree} World Tree).`);
}
module.exports={generate};
