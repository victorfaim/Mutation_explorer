
const COMBAT_MODES={
  general:{
    label:"Combate geral",
    weights:{offense:40,survival:35,stamina:10,mobility:15}
  },
  ranged:{
    label:"Ranged",
    weights:{shot:65,survival:15,stamina:10,mobility:10}
  },
  melee:{
    label:"Melee",
    weights:{melee:55,survival:30,stamina:10,mobility:5}
  },
  tank:{
    label:"Tank",
    weights:{hp:45,defense:40,stamina:15}
  }
};

const COMBAT_LABELS={
  offense:"Ofensiva",
  survival:"Sobrevivência",
  stamina:"Stamina",
  mobility:"Mobilidade",
  shot:"Shot Attack",
  melee:"Melee Attack",
  hp:"HP",
  defense:"Defense"
};

const SCORE_STAT_LABELS={
  hp:"HP",melee:"Melee Attack",shot:"Shot Attack",defense:"Defense",
  stamina:"Stamina",runSpeed:"Run Speed",rideSprintSpeed:"Ride Sprint",
  support:"Support",craftSpeed:"Work Speed"
};

function combatEligiblePals(includeBoss=false){
  return Object.values(window.PALPEDIA_DATA||{}).filter(p=>
    p?.name &&
    p?.icon &&
    (includeBoss||!p.isBoss) &&
    p.stats &&
    Object.keys(p.stats).length
  );
}

function combatRawMetrics(p){
  const s=p.stats||{};
  const hp=Number(s.hp)||0;
  const melee=Number(s.melee)||0;
  const shot=Number(s.shot)||0;
  const defense=Number(s.defense)||0;
  const stamina=Number(s.stamina)||0;
  const run=Number(s.runSpeed)||0;
  const sprint=Number(s.rideSprintSpeed)||0;

  return {
    hp,
    melee,
    shot,
    defense,
    stamina,
    runSpeed:run,
    rideSprintSpeed:sprint,
    offense:Math.max(melee,shot),
    survival:(hp+defense)/2,
    mobility:(run+sprint)/2
  };
}

function buildCombatRanges(pals){
  const metrics=pals.map(combatRawMetrics);
  const keys=["hp","melee","shot","defense","stamina","runSpeed","rideSprintSpeed","offense","survival","mobility"];
  const ranges={};
  for(const key of keys){
    const values=metrics.map(m=>m[key]).filter(Number.isFinite);
    ranges[key]={min:Math.min(...values),max:Math.max(...values)};
  }
  return ranges;
}

function normalizeCombatValue(value,range){
  if(!range||range.max===range.min)return 50;
  return Math.max(0,Math.min(100,(value-range.min)/(range.max-range.min)*100));
}

function normalizedCombatMetrics(p,ranges){
  const raw=combatRawMetrics(p);
  const normalized={};
  for(const [key,value] of Object.entries(raw)){
    normalized[key]=normalizeCombatValue(value,ranges[key]);
  }
  return {raw,normalized};
}

function calculateCombatScore(p,mode,ranges,customWeights=null){
  const config=COMBAT_MODES[mode]||COMBAT_MODES.general;
  const weights=customWeights||config.weights;
  const {raw,normalized}=normalizedCombatMetrics(p,ranges);
  const total=Object.values(weights).reduce((a,b)=>a+Number(b||0),0)||1;
  const contributions={};
  let score=0;

  for(const [metric,weight] of Object.entries(weights)){
    const value=normalized[metric]||0;
    const contribution=value*(Number(weight)||0)/total;
    contributions[metric]=contribution;
    score+=contribution;
  }

  return {score,raw,normalized,contributions,weights,totalWeight:total};
}

function combatTierByIndex(index,total){
  const percentile=(index+1)/Math.max(total,1);
  if(percentile<=.10)return "S";
  if(percentile<=.30)return "A";
  if(percentile<=.60)return "B";
  if(percentile<=.85)return "C";
  return "D";
}

function combatPalByQuery(query){
  const q=String(query||"").trim().toLowerCase();
  if(!q)return null;
  return Object.values(window.PALPEDIA_DATA||{}).find(p=>
    p.name.toLowerCase()===q ||
    (p.slug||"").toLowerCase()===q ||
    p.id.toLowerCase()===q
  ) || Object.values(window.PALPEDIA_DATA||{}).find(p=>p.name.toLowerCase().includes(q));
}
