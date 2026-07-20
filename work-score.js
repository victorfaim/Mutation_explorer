
const WORK_ALIASES={
  Handcraft:"Handcraft",Handiwork:"Handcraft",
  Transport:"Transport",Transporting:"Transport",
  Mining:"Mining",Gathering:"Gathering",Watering:"Watering",
  Lumbering:"Lumbering",Planting:"Planting",Kindling:"Kindling",
  Cooling:"Cooling",Electricity:"Electricity",GeneratingElectricity:"Electricity",
  Medicine:"Medicine",MedicineProduction:"Medicine",
  Farming:"Farming",OilExtraction:"OilExtraction"
};

const WORK_LABELS={
  Handcraft:"Handcraft",
  Transport:"Transport",
  Mining:"Mining",
  Gathering:"Gathering",
  Watering:"Watering",
  Lumbering:"Lumbering",
  Planting:"Planting",
  Kindling:"Kindling",
  Cooling:"Cooling",
  Electricity:"Electricity",
  Medicine:"Medicine",
  Farming:"Farming",
  OilExtraction:"Oil Extraction"
};

const WORK_PROFILES={
  Handcraft:{level:85,craft:15,mobility:0},
  Medicine:{level:85,craft:15,mobility:0},
  Kindling:{level:82,craft:18,mobility:0},
  Watering:{level:82,craft:18,mobility:0},
  Planting:{level:82,craft:13,mobility:5},
  Electricity:{level:85,craft:15,mobility:0},
  Cooling:{level:88,craft:12,mobility:0},
  Farming:{level:90,craft:10,mobility:0},
  Mining:{level:75,craft:15,mobility:10},
  Lumbering:{level:75,craft:15,mobility:10},
  Gathering:{level:72,craft:13,mobility:15},
  Transport:{level:65,craft:5,mobility:30},
  OilExtraction:{level:85,craft:15,mobility:0}
};

function canonicalWorkName(name){
  return WORK_ALIASES[name]||name;
}

function canonicalWorkMap(work){
  const result={};
  for(const [name,level] of Object.entries(work||{})){
    const key=canonicalWorkName(name);
    result[key]=Math.max(result[key]||0,Number(level)||0);
  }
  return result;
}

function workEligiblePals(){
  return Object.values(window.PALPEDIA_DATA||{}).filter(p=>
    p?.name && p?.icon && p.work && Object.keys(p.work).length
  );
}

function buildWorkRanges(pals){
  const craftValues=pals.map(p=>Number(p.stats?.craftSpeed)||0);
  const runValues=pals.map(p=>Number(p.stats?.runSpeed)||0);
  const maxWork={};

  for(const p of pals){
    const work=canonicalWorkMap(p.work);
    for(const [name,level] of Object.entries(work)){
      maxWork[name]=Math.max(maxWork[name]||0,level);
    }
  }

  return {
    craft:{min:Math.min(...craftValues),max:Math.max(...craftValues)},
    run:{min:Math.min(...runValues),max:Math.max(...runValues)},
    maxWork
  };
}

function normalizeWorkValue(value,range){
  if(!range||range.max===range.min)return 50;
  return Math.max(0,Math.min(100,(value-range.min)/(range.max-range.min)*100));
}

function calculateActivityScore(pal,activity,ranges,customProfile=null){
  const work=canonicalWorkMap(pal.work);
  const level=Number(work[activity])||0;
  if(level<=0)return null;

  const profile=customProfile||WORK_PROFILES[activity]||{level:80,craft:15,mobility:5};
  const levelMax=Math.max(1,ranges.maxWork[activity]||level);
  const levelScore=level/levelMax*100;
  const craftScore=normalizeWorkValue(Number(pal.stats?.craftSpeed)||0,ranges.craft);
  const mobilityScore=normalizeWorkValue(Number(pal.stats?.runSpeed)||0,ranges.run);
  const total=profile.level+profile.craft+profile.mobility||1;

  const contributions={
    level:levelScore*profile.level/total,
    craft:craftScore*profile.craft/total,
    mobility:mobilityScore*profile.mobility/total
  };

  return {
    score:Object.values(contributions).reduce((a,b)=>a+b,0),
    level,levelScore,craftScore,mobilityScore,contributions,profile
  };
}

function calculateVersatility(pal,ranges){
  const work=canonicalWorkMap(pal.work);
  const activities=Object.entries(work).filter(([,level])=>level>0);
  if(!activities.length)return {score:0,count:0,totalLevels:0};

  const count=activities.length;
  const totalLevels=activities.reduce((sum,[,level])=>sum+level,0);
  const maxPossible=activities.reduce((sum,[name])=>sum+(ranges.maxWork[name]||1),0)||1;
  const breadth=Math.min(100,count/8*100);
  const depth=totalLevels/maxPossible*100;
  const craft=normalizeWorkValue(Number(pal.stats?.craftSpeed)||0,ranges.craft);

  return {
    score:breadth*.50+depth*.35+craft*.15,
    count,totalLevels,breadth,depth,craft
  };
}

function calculateSpecialization(pal,ranges){
  const work=canonicalWorkMap(pal.work);
  const rows=Object.entries(work).filter(([,level])=>level>0);
  if(!rows.length)return {score:0,activity:null,level:0};

  const ranked=rows.map(([activity,level])=>{
    const activityResult=calculateActivityScore(pal,activity,ranges);
    return {activity,level,score:activityResult?.score||0};
  }).sort((a,b)=>b.score-a.score);

  const top=ranked[0];
  const breadthPenalty=Math.max(0,(rows.length-1)*2);
  return {
    score:Math.max(0,Math.min(100,top.score-breadthPenalty)),
    activity:top.activity,
    level:top.level,
    activityScore:top.score
  };
}

function calculateGeneralWorkScore(pal,ranges){
  const work=canonicalWorkMap(pal.work);
  const activityScores=Object.keys(work)
    .map(activity=>calculateActivityScore(pal,activity,ranges))
    .filter(Boolean)
    .map(x=>x.score)
    .sort((a,b)=>b-a);

  if(!activityScores.length)return {score:0};
  const top=activityScores.slice(0,3);
  const specialistAverage=top.reduce((a,b)=>a+b,0)/top.length;
  const versatility=calculateVersatility(pal,ranges);
  return {
    score:specialistAverage*.72+versatility.score*.28,
    specialistAverage,
    versatility:versatility.score
  };
}

function workTierByIndex(index,total){
  const percentile=(index+1)/Math.max(total,1);
  if(percentile<=.10)return "S";
  if(percentile<=.30)return "A";
  if(percentile<=.60)return "B";
  if(percentile<=.85)return "C";
  return "D";
}

function workPalByQuery(query){
  const q=String(query||"").trim().toLowerCase();
  if(!q)return null;
  const pals=Object.values(window.PALPEDIA_DATA||{});
  return pals.find(p=>p.name.toLowerCase()===q||(p.slug||"").toLowerCase()===q||p.id.toLowerCase()===q)
    ||pals.find(p=>p.name.toLowerCase().includes(q));
}
