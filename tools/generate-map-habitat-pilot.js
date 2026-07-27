const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const inbox=path.join(root,"LOCAL_RESEARCH","raw","fmodel","mutation","inbox");
const output=path.join(root,"mapa-lab-data","habitat-pilot.json");
const definitions=[
  {id:"lamball",characterId:"SheepBall",name:"Lamball",palpediaNumber:"001",icon:"assets/pals/T_SheepBall_icon_normal.png",availableTimes:["day"],region:"green_A",actorTypes:new Set(["BP_PalSpawner_Sheets_green_A_C","BP_PalSpawner_Sheets_green_A_SheepBall_C"]),files:["MainGrid_L0_X-13_Y7_DL9CFECD92.json","MainGrid_L0_X-14_Y8_DL9CFECD92.json","MainGrid_L0_X-14_Y9_DL9CFECD92.json","MainGrid_L0_X-14_Y10_DL9CFECD92.json","MainGrid_L0_X-15_Y10_DL9CFECD92.json"]},
  {id:"depresso",characterId:"NegativeKoala",name:"Depresso",palpediaNumber:"016",icon:"assets/pals/T_NegativeKoala_icon_normal.png",availableTimes:["night"],region:"green_D",actorTypes:new Set(["BP_PalSpawner_Sheets_green_D_C"]),files:["MainGrid_L0_X-13_Y6_DLC6F3CE9A.json","MainGrid_L0_X-13_Y7_DLC6F3CE9A.json","MainGrid_L0_X-13_Y8_DLC6F3CE9A.json","MainGrid_L0_X-14_Y6_DLC6F3CE9A.json","MainGrid_L0_X-14_Y7_DLC6F3CE9A.json"]}
];
function read(file){return JSON.parse(fs.readFileSync(path.join(inbox,file),"utf8"));}
function locationFor(records,actor){
  const component=records.find(record=>record.Name==="DefaultSceneRoot"&&record.Outer?.ObjectName?.includes(actor.Name));
  const loc=component?.Properties?.RelativeLocation;
  if(!loc||![loc.X,loc.Y,loc.Z].every(Number.isFinite))throw new Error(`Localizacao ausente para ${actor.Name}`);
  return {x:loc.X,y:loc.Y,z:loc.Z};
}
const pals=definitions.map(definition=>{
  const points=[];
  for(const file of definition.files){
    const records=read(file);
    for(const actor of records.filter(record=>definition.actorTypes.has(record.Type)))points.push({world:locationFor(records,actor),source:{cell:path.basename(file,".json"),actor:actor.Name,actorType:actor.Type}});
  }
  return {id:definition.id,characterId:definition.characterId,name:definition.name,palpediaNumber:definition.palpediaNumber,icon:definition.icon,availableTimes:definition.availableTimes,sourceRegions:[definition.region],points};
});
const data={schemaVersion:1,mapId:"mainworld5",revision:"habitat-pilot-green-a-green-d-v1",coverage:"partial",incomplete:true,radiusNative:10000,source:{spawnerBase:"BP_PalSpawner_Standard",location:"PL_MainWorld5 MainGrid exports",note:"Piloto regional; nao representa a distribuicao mundial completa."},pals};
fs.writeFileSync(output,`${JSON.stringify(data,null,2)}\n`);
console.log(`Habitat piloto gerado: ${pals.map(pal=>`${pal.name}=${pal.points.length}`).join(", ")}`);
