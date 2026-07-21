import json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RAW=Path('/workspace/scratch/5b69d1d8e659/upload/DT_PalDropItem_Common.json')

def js_object(path,prefix):
    text=path.read_text(encoding='utf-8-sig').strip()
    return json.loads(text[len(prefix):].rstrip(';'))

palpedia=js_object(ROOT/'palpedia-data.js','window.PALPEDIA_DATA=')
old_items=js_object(ROOT/'items-data.js','window.ITEMS_DATA=')
rows=json.loads(RAW.read_text(encoding='utf-8-sig'))[0]['Rows']
key_to_pal={p.get('key'):p for p in palpedia.values() if p.get('key')}

def norm(value):
    return re.sub(r'[^a-z0-9]','',value.lower().replace('t_itemicon_',''))

known=list(old_items.values())
manual={
 'Cloth':'Cloth','Cloth2':'High Quality Cloth','Fiber':'Fiber','Mushroom':'Mushroom',
 'PalCrystal_Ex':'Ancient Civilization Core','PalItem_ToSell_01':'Precious Pelt',
 'PalItem_ToSell_02':'Precious Claw','PalItem_ToSell_03':'Precious Entrails',
 'PalItem_ToSell_04':'Precious Plume','PalItem_ToSell_05':'Precious Dragon Stone',
 'UniqueMaterial_FlowerPrince':'Beautiful Flower','UniqueMaterial_Mothman':'Mysterious Mushroom',
 'WorldTreeRelic_01':'Decayed Ancient Relic','WorldTreeRelic_02':'Dormant Ancient Relic',
 'WorldTreeRelic_03':'Gorgeous Ancient Relic','WorldTreeRelic_04':'Glowing Ancient Relic',
 'WorldTreeRelic_05':'Glistening Ancient Relic','YakushimaHeadEquip006':'Terraria Headgear'
}
blueprints={
 'Blueprint_AssaultRifle_Default5':'Legendary Assault Rifle Schematic','Blueprint_ChargeLaserRifle_5':'Legendary Charge Laser Rifle Schematic',
 'Blueprint_ClothArmor_5':'Legendary Cloth Outfit Schematic','Blueprint_CopperArmor_5':'Legendary Metal Armor Schematic',
 'Blueprint_CopperHelmet_5':'Legendary Metal Helm Schematic','Blueprint_DoubleBarrelShotgun_5':'Legendary Double-Barreled Shotgun Schematic',
 'Blueprint_EnergyRocketLauncher_5':'Legendary Energy Rocket Launcher Schematic','Blueprint_EnergyShotgun_5':'Legendary Energy Shotgun Schematic',
 'Blueprint_FurHelmet_5':'Legendary Feathered Hair Band Schematic','Blueprint_HandGun_Default_5':'Legendary Handgun Schematic',
 'Blueprint_IronArmorCold_5':'Legendary Cold Resistant Refined Metal Armor Schematic','Blueprint_IronArmorHeat_5':'Legendary Heat Resistant Refined Metal Armor Schematic',
 'Blueprint_LaserGatlingGun_5':'Legendary Laser Gatling Gun Schematic','Blueprint_LaserRifle_5':'Legendary Laser Rifle Schematic',
 'Blueprint_Launcher_Default_5':'Legendary Rocket Launcher Schematic','Blueprint_MakeshiftHandgun_5':'Legendary Makeshift Handgun Schematic',
 'Blueprint_Musket_5':'Legendary Musket Schematic','Blueprint_OverheatRifle_5':'Legendary Overheat Rifle Schematic',
 'Blueprint_PumpActionShotgun_5':'Legendary Pump-Action Shotgun Schematic','Blueprint_SFArmorWeight_5':'Legendary Lightweight Plasteel Armor Schematic',
 'Blueprint_SFHelmet_5':'Legendary Plasteel Helmet Schematic','Blueprint_SemiAutoRifle_5':'Legendary Semi-Auto Rifle Schematic',
 'Blueprint_SingleShotRifle_5':'Legendary Single-Shot Rifle Schematic','Blueprint_SubmachineGun_5':'Legendary Submachine Gun Schematic'
}
manual.update(blueprints)

def metadata(item_id):
    n=norm(item_id)
    matches=[x for x in known if norm(x.get('icon',''))==n or norm(x.get('icon','')).endswith(n) or n.endswith(norm(x.get('icon','')))]
    if len(matches)==1:
        x=matches[0];return {'name':x['name'],'icon':x.get('icon',''),'descr':x.get('descr','')}
    name=manual.get(item_id,re.sub(r'(?<!^)([A-Z])',r' \1',item_id).replace('_',' ').strip())
    by_name=next((x for x in known if x['name']==name),None)
    return {'name':name,'icon':by_name.get('icon','') if by_name else '', 'descr':by_name.get('descr','') if by_name else ''}

pals={};items={};sources={}
for row_key,row in rows.items():
    cid=row.get('CharacterID','');is_boss=cid.startswith('BOSS_');base=cid[5:] if is_boss else cid
    pal=key_to_pal.get(base)
    if not pal: continue
    drops=[]
    for i in range(1,11):
        item_id=row.get(f'ItemId{i}');rate=float(row.get(f'Rate{i}',0) or 0)
        if not item_id or item_id=='None' or rate<=0: continue
        if item_id not in items:items[item_id]={'id':item_id,**metadata(item_id)}
        drop={'itemId':item_id,'rate':rate,'min':row.get(f'min{i}',0),'max':row.get(f'Max{i}',0)}
        drops.append(drop)
        sources.setdefault(item_id,[]).append({'palId':pal['id'],'palSlug':pal.get('slug',pal['id']),'palName':pal['name'],'palIndex':pal.get('index'),'palSuffix':pal.get('suffix',''),'palIcon':pal.get('icon',''),'variant':'boss' if is_boss else 'normal','level':row.get('Level',0),**drop})
    if drops:
        entry=pals.setdefault(pal['id'],{'normal':[],'boss':[]})
        entry['boss' if is_boss else 'normal'].append({'level':row.get('Level',0),'row':row_key,'drops':drops})

for p in pals.values():
    p['normal'].sort(key=lambda x:x['level']);p['boss'].sort(key=lambda x:x['level'])
for item_id,value in sources.items():
    value.sort(key=lambda x:(-x['rate'],-x['max'],x['variant']!='normal',x['level'],x['palName']))

output={'source':'DT_PalDropItem_Common','rowCount':len(rows),'pals':pals,'items':items,'sources':sources}
(ROOT/'drop-tables-data.js').write_text('window.PAL_DROP_TABLES='+json.dumps(output,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(f"Generated {len(pals)} pals, {len(items)} items and {sum(map(len,sources.values()))} conditional sources")
