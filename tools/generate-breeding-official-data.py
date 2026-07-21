#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UPLOAD = Path('/workspace/scratch/5b69d1d8e659/upload')


def table_rows(name):
    payload = json.loads((UPLOAD / name).read_text(encoding='utf-8-sig'))
    return payload[0]['Rows']


def current_pal_data():
    text = (ROOT / 'data.js').read_text(encoding='utf-8')
    match = re.search(r'window\.PAL_DATA=(.*?);\n', text)
    if not match:
        raise RuntimeError('window.PAL_DATA not found')
    return json.loads(match.group(1))


pals = current_pal_data()
monster_rows = table_rows('DT_PalMonsterParameter_Common.json')
unique_rows = table_rows('DT_PalCombiUnique.json')
monster_by_id = {key.lower(): row for key, row in monster_rows.items()}

parameters = {}
for pal_id in pals:
    row = monster_by_id.get(pal_id)
    if not row:
        raise RuntimeError(f'No monster parameter row for {pal_id}')
    parameters[pal_id] = {
        'combiRank': row['CombiRank'],
        'combiPriority': row['CombiDuplicatePriority'],
        'ignoreCombi': row['IgnoreCombi'],
        'isBoss': row['IsBoss'],
    }

rules = []
skipped = []
for row_id, row in unique_rows.items():
    a = row['ParentTribeA'].split('::')[-1].lower()
    b = row['ParentTribeB'].split('::')[-1].lower()
    child = row['ChildCharacterID'].lower()
    if a not in pals or b not in pals or child not in pals:
        skipped.append({'row': row_id, 'a': a, 'b': b, 'child': child})
        continue
    rules.append({
        'row': row_id,
        'a': a,
        'aGender': row['ParentGenderA'].split('::')[-1],
        'b': b,
        'bGender': row['ParentGenderB'].split('::')[-1],
        'child': child,
    })

output = {
    'source': {
        'parameters': 'DT_PalMonsterParameter_Common',
        'unique': 'DT_PalCombiUnique',
        'parameterRows': len(monster_rows),
        'uniqueRows': len(unique_rows),
    },
    'parameters': parameters,
    'uniqueRules': rules,
    'skippedUniqueRules': skipped,
}

script = '''// Generated from the official game DataTables. Do not edit manually.\n'''
script += 'window.BREEDING_OFFICIAL_DATA=' + json.dumps(output, ensure_ascii=False, separators=(',', ':')) + ';\n'
script += '''(()=>{\n  const source=window.BREEDING_OFFICIAL_DATA;\n  if(!window.PAL_DATA||!source)return;\n  for(const [id,values] of Object.entries(source.parameters)){\n    if(window.PAL_DATA[id])Object.assign(window.PAL_DATA[id],values);\n  }\n  const pairs={};\n  const genderRules={};\n  for(const rule of source.uniqueRules){\n    const forward=rule.a+"|"+rule.b;\n    const reverse=rule.b+"|"+rule.a;\n    if(rule.aGender==="None"&&rule.bGender==="None"){\n      pairs[forward]=rule.child;pairs[reverse]=rule.child;\n    }else{\n      (genderRules[forward]??=[]).push({child:rule.child,aGender:rule.aGender,bGender:rule.bGender,row:rule.row});\n      (genderRules[reverse]??=[]).push({child:rule.child,aGender:rule.bGender,bGender:rule.aGender,row:rule.row});\n    }\n  }\n  window.UNIQUE_PAIRS=pairs;\n  window.UNIQUE_GENDER_RULES=genderRules;\n})();\n'''
(ROOT / 'breeding-official-data.js').write_text(script, encoding='utf-8')
print(f'Generated {len(parameters)} parameters, {len(rules)} mapped unique rules, {len(skipped)} skipped technical rules')
