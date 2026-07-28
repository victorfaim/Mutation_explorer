import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "LOCAL_RESEARCH/raw/fmodel/mutation/inbox"
OUTPUT = ROOT / "game-localization-data.js"
COVERAGE = ROOT / "game-localization-coverage.json"
LANG_DIRS = {"en-US": "en", "pt-BR": "pt-BR"}


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def read_window_json(path, prefix):
    text = path.read_text(encoding="utf-8-sig").strip()
    if not text.startswith(prefix):
        raise ValueError(f"{path} não começa com {prefix}")
    return json.loads(text[len(prefix):].rstrip(";"))


def normalized(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def load_tables():
    result = {}
    for locale, directory in LANG_DIRS.items():
        table_dir = RAW / directory / "Pal/DataTable/Text"
        if not table_dir.is_dir():
            raise FileNotFoundError(f"Diretório L10N ausente: {table_dir}")
        result[locale] = {}
        for path in sorted(table_dir.glob("*.json")):
            exports = read_json(path)
            table = next((entry for entry in exports if entry.get("Rows")), None)
            rows = {}
            for key, row in (table or {}).get("Rows", {}).items():
                text = row.get("TextData", {})
                rows[key] = text.get("LocalizedString", text.get("SourceString", ""))
            result[locale][path.stem] = rows
    if set(result["en-US"]) != set(result["pt-BR"]):
        raise ValueError("As listas de DataTables EN e PT-BR não coincidem")
    return result


def row_value(tables, locale, table, key):
    return tables.get(locale, {}).get(table, {}).get(key)


def first_row(tables, locale, candidates):
    for table, key in candidates:
        value = row_value(tables, locale, table, key)
        if value is not None:
            return value
    return None


REFERENCE_TABLES = {
    "itemName": ("DT_ItemNameText_Common", ("ITEM_NAME_{id}",)),
    "characterName": ("DT_PalNameText_Common", ("PAL_NAME_{id}",)),
    "mapObjectName": (
        "DT_MapObjectNameText_Common",
        ("MAPOBJECT_NAME_{id}", "MAP_OBJECT_NAME_{id}", "{id}"),
    ),
    "uiCommon": ("DT_UI_Common_Text_Common", ("{id}",)),
    "skillName": ("DT_SkillNameText_Common", ("{id}", "SKILL_NAME_{id}")),
    "humanName": ("DT_HumanNameText_Common", ("{id}", "HUMAN_NAME_{id}")),
    "worldMap": ("DT_WorldMap_Common_Text_Common", ("{id}",)),
}


TAG_RE = re.compile(r"<(?P<kind>\w+)\s+[^>]*?id=\|(?P<id>[^|]+)\|[^>]*/?>", re.I)


def render_markup(value, tables, locale):
    if value is None:
        return None

    def replace_tag(match):
        kind = match.group("kind")
        identifier = match.group("id")
        if kind.lower() == "img":
            return ""
        config = REFERENCE_TABLES.get(kind)
        if not config:
            return identifier
        table, patterns = config
        for pattern in patterns:
            resolved = row_value(tables, locale, table, pattern.format(id=identifier))
            if resolved is not None:
                return resolved
        return identifier

    text = TAG_RE.sub(replace_tag, value)
    text = re.sub(r"</?\w+[^>]*>", "", text)
    text = text.replace("</>", "")
    return text.replace("\r\n", "\n").strip()


def fill_placeholders(localized, english_template, current):
    placeholders = list(dict.fromkeys(
        re.findall(r"\{[^}]+\}", english_template or "")
        + re.findall(r"\{[^}]+\}", localized or "")
    ))
    if not placeholders:
        return localized
    token_re = re.compile(r"-?\d+(?:[.,]\d+)?(?:~-?\d+(?:[.,]\d+)?)?")
    current_tokens = token_re.findall(current or "")
    static_tokens = token_re.findall(re.sub(r"\{[^}]+\}", "", english_template or ""))
    remaining = list(current_tokens)
    for token in static_tokens:
        if token in remaining:
            remaining.remove(token)
    replacements = {}
    for placeholder in placeholders:
        if remaining:
            replacements[placeholder] = remaining.pop(0)
    result = localized
    for placeholder, value in replacements.items():
        result = result.replace(placeholder, value)
    result = re.sub(r"\n?\{ReferenceMsgId_[^}]+\}", "", result)
    result = result.replace("for {ActiveSkillOverWriteEffectTime} seconds", "temporarily")
    result = result.replace("por {ActiveSkillOverWriteEffectTime} s,", "temporariamente,")
    return result.strip()


def add_mapping(target, conflicts, source, translated):
    source_key = normalized(source)
    translated_value = render_plain(translated)
    if not source_key or not translated_value or source_key == normalized(translated_value):
        return
    previous = target.get(source_key)
    if previous is not None and normalized(previous) != normalized(translated_value):
        conflicts[source_key].update((previous, translated_value))
        target.pop(source_key, None)
        return
    if source_key not in conflicts:
        target[source_key] = translated_value


def render_plain(value):
    return str(value or "").replace("\r\n", "\n").strip()


def build_generic_maps(tables):
    maps = {locale: {} for locale in LANG_DIRS}
    conflicts = {locale: defaultdict(set) for locale in LANG_DIRS}
    for table_name, english_rows in tables["en-US"].items():
        for key, english in english_rows.items():
            for locale in LANG_DIRS:
                translated = tables[locale][table_name].get(key)
                if translated is None:
                    continue
                add_mapping(
                    maps[locale],
                    conflicts[locale],
                    render_markup(english, tables, "en-US"),
                    render_markup(translated, tables, locale),
                )
    return maps, conflicts



TECHNICAL_LABELS = {
    "Normal": ("Neutral", "Não elemental"),
    "Fire": ("Fire", "Fogo"),
    "Water": ("Water", "Água"),
    "Leaf": ("Grass", "Grama"),
    "Electricity": ("Electric", "Elétrico"),
    "Earth": ("Ground", "Terra"),
    "Ice": ("Ice", "Gelo"),
    "Dragon": ("Dragon", "Dracônico"),
    "Dark": ("Dark", "Escuridão"),
    "Handcraft": ("Handiwork", "Trabalho manual"),
    "Transport": ("Transporting", "Transporte"),
    "MonsterFarm": ("Farming", "Fazenda"),
    "GenerateElectricity": ("Generating Electricity", "Geração de energia"),
    "Mining": ("Mining", "Garimpo"),
    "Logging": ("Lumbering", "Cortar árvores"),
    "Planting": ("Planting", "Plantio"),
    "Watering": ("Watering", "Rega"),
    "Kindling": ("Kindling", "Acender fogo"),
    "Cooling": ("Cooling", "Refrigeração"),
    "Medicine": ("Medicine Production", "Manipulação"),
    "Gathering": ("Gathering", "Coleta"),
    "Fishing": ("Fishing", "Pesca"),
    "HP": ("Health", "PV"),
    "Melee attack": ("Melee", "Ataque corpo a corpo"),
    "Ranged attack": ("Attack", "Ataque"),
    "Defense": ("Defense", "Defesa"),
    "Support": ("Support", "Suporte"),
    "Work speed": ("Work Speed", "Velocidade de trabalho"),
    "Run speed": ("Run Speed", "Velocidade de corrida"),
    "Ride sprint": ("Mounted Sprint Speed", "Velocidade de montaria"),
    "Slow walk": ("Slow Walk Speed", "Velocidade de caminhada"),
    "Price": ("Price", "Preço"),
    "Stamina": ("Stamina", "Fôlego"),
    "Power": ("Power", "Potência"),
    "Cooldown": ("Cooldown", "Tempo de recarga"),
    "Range": ("Range", "Alcance"),
    "Common": ("Common", "Comum"),
    "Rare": ("Rare", "Raro"),
    "Epic": ("Epic", "Épico"),
    "Legendary": ("Legendary", "Lendário"),
    "Stats": ("Stats", "Atributos"),
    "Skills": ("Skills", "Habilidades"),
    "PARTNER SKILL": ("PARTNER SKILL", "HABILIDADE DE PARCEIRO"),
    "DROPS": ("DROPS", "ITENS OBTIDOS"),
}


def apply_technical_labels(maps, conflicts):
    for source, (english, portuguese) in TECHNICAL_LABELS.items():
        for locale, translated in (("en-US", english), ("pt-BR", portuguese)):
            conflicts[locale].pop(normalized(source), None)
            if normalized(source) == normalized(translated):
                maps[locale].pop(normalized(source), None)
            else:
                maps[locale][normalized(source)] = translated

def pal_direct_fields(tables, palpedia, maps, conflicts):
    counters = defaultdict(lambda: {"total": 0, "resolved": 0})
    for pal in palpedia.values():
        key = pal.get("key")
        if not key:
            continue
        direct = {
            "name": ("DT_PalNameText_Common", f"PAL_NAME_{key}", pal.get("name")),
            "description": (
                "DT_PalLongDescriptionText",
                f"PAL_LONG_DESC_{key}",
                pal.get("description"),
            ),
            "partnerDescription": (
                "DT_PalFirstActivatedInfoText",
                f"PAL_FIRST_SPAWN_DESC_{key}",
                (pal.get("partnerSkill") or {}).get("desc"),
            ),
        }
        for field, (table, row, current) in direct.items():
            if not current:
                continue
            counters[field]["total"] += 1
            english = row_value(tables, "en-US", table, row)
            if english is None:
                continue
            resolved_any = False
            for locale in LANG_DIRS:
                translated = row_value(tables, locale, table, row)
                if translated is None:
                    continue
                rendered = render_markup(translated, tables, locale)
                if field == "partnerDescription":
                    rendered = fill_placeholders(
                        rendered,
                        render_markup(english, tables, "en-US"),
                        current,
                    )
                add_mapping(maps[locale], conflicts[locale], current, rendered)
                resolved_any = True
            if resolved_any:
                counters[field]["resolved"] += 1
    return counters



def add_direct_row(tables, maps, conflicts, source, table, row):
    if not source or row_value(tables, "en-US", table, row) is None:
        return False
    source_key = normalized(source)
    for locale in LANG_DIRS:
        translated = render_markup(row_value(tables, locale, table, row), tables, locale)
        if not translated or source_key == normalized(translated):
            maps[locale].pop(source_key, None)
            continue
        conflicts[locale].pop(source_key, None)
        maps[locale][source_key] = translated
    return True


def item_row_from_icon(tables, icon):
    match = re.match(r"^T_itemicon_(.+)$", str(icon or ""))
    if not match:
        return None
    suffix = match.group(1)
    candidates = [suffix, suffix.split("_", 1)[1] if "_" in suffix else suffix]
    for candidate in candidates:
        row = f"ITEM_NAME_{candidate}"
        if row in tables["en-US"]["DT_ItemNameText_Common"]:
            return row
    return None


def item_direct_fields(tables, palpedia, items, maps, conflicts):
    records = {}
    for item in items.values():
        records[(item.get("icon"), item.get("name"), None)] = None
    for pal in palpedia.values():
        for drop in pal.get("drops", []):
            records[(drop.get("icon"), drop.get("name"), drop.get("descr"))] = None
    stats = {"total": len(records), "resolved": 0}
    for icon, name, description in records:
        name_row = item_row_from_icon(tables, icon)
        if not name_row:
            continue
        add_direct_row(tables, maps, conflicts, name, "DT_ItemNameText_Common", name_row)
        if description:
            desc_row = name_row.replace("ITEM_NAME_", "ITEM_DESC_", 1)
            add_direct_row(tables, maps, conflicts, description, "DT_ItemDescriptionText_Common", desc_row)
        stats["resolved"] += 1
    return stats


def skill_direct_fields(tables, palpedia, maps, conflicts):
    by_name = defaultdict(list)
    for row, value in tables["en-US"]["DT_SkillNameText_Common"].items():
        by_name[normalized(render_markup(value, tables, "en-US"))].append(row)
    records = {}
    for pal in palpedia.values():
        for skill in pal.get("actives", []):
            records[(skill.get("name"), skill.get("desc"))] = None
    stats = {"total": len(records), "resolved": 0, "ambiguous": 0}
    for name, description in records:
        candidates = by_name.get(normalized(name), [])
        signatures = defaultdict(list)
        for row in candidates:
            signature = tuple((
                render_markup(row_value(tables, locale, "DT_SkillNameText_Common", row), tables, locale),
                render_markup(row_value(tables, locale, "DT_SkillDescText_Common", row), tables, locale),
            ) for locale in LANG_DIRS)
            signatures[signature].append(row)
        if len(signatures) != 1:
            stats["ambiguous"] += 1
            continue
        row = next(iter(signatures.values()))[0]
        add_direct_row(tables, maps, conflicts, name, "DT_SkillNameText_Common", row)
        add_direct_row(tables, maps, conflicts, description, "DT_SkillDescText_Common", row)
        stats["resolved"] += 1
    return stats


def choose_row_by_english(tables, table, current, hint=None):
    candidates = [
        row for row, value in tables["en-US"][table].items()
        if normalized(render_markup(value, tables, "en-US")) == normalized(current)
    ]
    if hint:
        hinted = [row for row in candidates if hint.lower() in row.lower()]
        if len(hinted) == 1:
            return hinted[0]
    usable = [
        row for row in candidates
        if row_value(tables, "pt-BR", table, row) not in (None, "", "pt-BR_Text")
    ]
    if len(usable) == 1:
        return usable[0]
    signatures = {normalized(row_value(tables, "pt-BR", table, row)) for row in usable}
    return usable[0] if len(signatures) == 1 and usable else None


def build_contexts(tables, palpedia):
    contexts = {locale: {"pals": {}, "skills": {}} for locale in LANG_DIRS}
    for pal in palpedia.values():
        key = pal.get("key")
        if not key:
            continue
        fields = {
            "name": ("DT_PalNameText_Common", f"PAL_NAME_{key}", pal.get("name")),
            "description": ("DT_PalLongDescriptionText", f"PAL_LONG_DESC_{key}", pal.get("description")),
            "partnerName": ("DT_SkillNameText_Common", f"PARTNERSKILL_{key}", (pal.get("partnerSkill") or {}).get("name")),
            "partnerDescription": ("DT_PalFirstActivatedInfoText", f"PAL_FIRST_SPAWN_DESC_{key}", (pal.get("partnerSkill") or {}).get("desc")),
        }
        prefix = pal.get("prefix")
        prefix_row = choose_row_by_english(tables, "DT_NamePrefixText_Common", prefix, key) if prefix else None
        if prefix_row:
            fields["prefix"] = ("DT_NamePrefixText_Common", prefix_row, prefix)
        for locale in LANG_DIRS:
            localized = {}
            for field, (table, row, current) in fields.items():
                value = row_value(tables, locale, table, row)
                if current and value is not None and value != "pt-BR_Text":
                    rendered = render_markup(value, tables, locale)
                    if field == "partnerDescription":
                        rendered = fill_placeholders(
                            rendered,
                            render_markup(row_value(tables, "en-US", table, row), tables, "en-US"),
                            current,
                        )
                    localized[field] = rendered
            contexts[locale]["pals"][key] = localized
        for skill in pal.get("actives", []):
            name = skill.get("name")
            description = skill.get("desc")
            candidates = [
                row for row, value in tables["en-US"]["DT_SkillNameText_Common"].items()
                if normalized(value) == normalized(name)
            ]
            exact = [
                row for row in candidates
                if normalized(row_value(tables, "en-US", "DT_SkillDescText_Common", row)) == normalized(description)
            ]
            if len(exact) == 1:
                candidates = exact
            elif len(candidates) > 1:
                non_partner = [row for row in candidates if "PartnerSkill" not in row]
                if len(non_partner) == 1:
                    candidates = non_partner
                hinted = [row for row in candidates if key.lower() in row.lower()]
                if len(hinted) == 1:
                    candidates = hinted
            valid = [row for row in candidates if row_value(tables, "pt-BR", "DT_SkillNameText_Common", row) not in (None, "", "pt-BR_Text")]
            signatures = {
                tuple((row_value(tables, locale, "DT_SkillNameText_Common", row), row_value(tables, locale, "DT_SkillDescText_Common", row)) for locale in LANG_DIRS)
                for row in valid
            }
            if len(signatures) != 1 or not valid:
                continue
            row = valid[0]
            context_key = normalized(description)
            for locale in LANG_DIRS:
                contexts[locale]["skills"][context_key] = {
                    "name": render_markup(row_value(tables, locale, "DT_SkillNameText_Common", row), tables, locale),
                    "description": render_markup(row_value(tables, locale, "DT_SkillDescText_Common", row), tables, locale),
                }
    return contexts

def collect_display_strings(palpedia, items):
    values = set()
    for pal in palpedia.values():
        values.update(
            filter(
                None,
                (
                    pal.get("name"),
                    pal.get("prefix"),
                    pal.get("description"),
                    (pal.get("partnerSkill") or {}).get("name"),
                    (pal.get("partnerSkill") or {}).get("desc"),
                ),
            )
        )
        for drop in pal.get("drops", []):
            values.update(filter(None, (drop.get("name"), drop.get("descr"))))
        for skill in pal.get("actives", []):
            values.update(filter(None, (skill.get("name"), skill.get("desc"))))
    for item in items.values():
        values.add(item.get("name"))
        for source in item.get("droppedBy", []):
            values.add(source.get("palName"))
    map_data_dir = ROOT / "mapa-lab-data"
    for path in map_data_dir.glob("*.json"):
        if "calibration" in path.name or "config" in path.name:
            continue
        def collect_json(value):
            if isinstance(value, str):
                values.add(value)
            elif isinstance(value, dict):
                for nested in value.values():
                    collect_json(nested)
            elif isinstance(value, list):
                for nested in value:
                    collect_json(nested)
        collect_json(read_json(path))
    return {normalized(value) for value in values if value}


def prune_maps(maps, display_strings):
    return {
        locale: {
            key: value for key, value in mapping.items()
            if key in display_strings
        }
        for locale, mapping in maps.items()
    }


def main():
    tables = load_tables()
    palpedia = read_window_json(ROOT / "palpedia-data.js", "window.PALPEDIA_DATA=")
    items = read_window_json(ROOT / "items-data.js", "window.ITEMS_DATA=")

    display_strings = collect_display_strings(palpedia, items)
    maps, conflicts = build_generic_maps(tables)
    maps = prune_maps(maps, display_strings)
    apply_technical_labels(maps, conflicts)
    direct_coverage = pal_direct_fields(tables, palpedia, maps, conflicts)
    item_coverage = item_direct_fields(tables, palpedia, items, maps, conflicts)
    skill_coverage = skill_direct_fields(tables, palpedia, maps, conflicts)

    contexts = build_contexts(tables, palpedia)

    table_rows = {
        table: len(rows) for table, rows in tables["en-US"].items()
    }
    payload = {
        "schemaVersion": 1,
        "revision": "palworld-l10n-en-ptbr-20260728",
        "source": "Pal/Content/L10N/{en,pt-BR}/Pal/DataTable/Text",
        "locales": maps,
        "contexts": contexts,
    }
    OUTPUT.write_text(
        "window.PME_GAME_L10N="
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )

    coverage = {
        "schemaVersion": 1,
        "sourceTables": len(table_rows),
        "pairedRows": sum(table_rows.values()),
        "tableRows": table_rows,
        "displayStrings": len(display_strings),
        "generatedMappings": {
            locale: len(mapping) for locale, mapping in maps.items()
        },
        "ambiguousGenericSources": {
            locale: len(entries) for locale, entries in conflicts.items()
        },
        "directPalFields": direct_coverage,
        "directItemRecords": item_coverage,
        "directSkillRecords": skill_coverage,
        "contextRecords": {
            locale: {section: len(entries) for section, entries in sections.items()}
            for locale, sections in contexts.items()
        },
    }
    COVERAGE.write_text(
        json.dumps(coverage, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(coverage, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
