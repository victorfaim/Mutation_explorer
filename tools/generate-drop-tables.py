import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INBOX = ROOT / "LOCAL_RESEARCH/raw/fmodel/mutation/inbox"
RAW = INBOX / "DT_PalDropItem_Common.json"
ITEM_TABLE = INBOX / "DT_ItemDataTable.json"
ITEM_NAMES = {
    "en-US": INBOX / "en/Pal/DataTable/Text/DT_ItemNameText_Common.json",
    "pt-BR": INBOX / "pt-BR/Pal/DataTable/Text/DT_ItemNameText_Common.json",
}


def js_object(path, prefix):
    text = path.read_text(encoding="utf-8-sig").strip()
    if not text.startswith(prefix):
        raise ValueError(f"{path} não começa com {prefix}")
    payload = text[len(prefix):]
    if ";\nwindow." in payload:
        payload = payload.split(";\nwindow.", 1)[0]
    else:
        payload = payload.rstrip(";")
    return json.loads(payload)


def table_rows(path):
    exports = json.loads(path.read_text(encoding="utf-8-sig"))
    return next(entry["Rows"] for entry in exports if entry.get("Rows"))


palpedia = js_object(ROOT / "palpedia-data.js", "window.PALPEDIA_DATA=")
icon_map = js_object(ROOT / "item-icon-map.js", "window.ITEM_ICON_MAP=")
item_rows = table_rows(ITEM_TABLE)
localized_rows = {locale: table_rows(path) for locale, path in ITEM_NAMES.items()}
item_ids_casefold = {item_id.casefold(): item_id for item_id in item_rows}
key_to_pal = {pal.get("key"): pal for pal in palpedia.values() if pal.get("key")}


def localized_text(locale, row_key):
    text = localized_rows[locale].get(row_key, {}).get("TextData", {})
    return text.get("LocalizedString") or text.get("SourceString") or ""


def metadata(item_id):
    canonical_id = item_id if item_id in item_rows else item_ids_casefold.get(item_id.casefold())
    if not canonical_id:
        raise KeyError(f"ItemId sem linha em DT_ItemDataTable: {item_id}")
    names = {
        locale: localized_text(locale, f"ITEM_NAME_{canonical_id}")
        for locale in ITEM_NAMES
    }
    if not all(names.values()):
        raise KeyError(f"ItemId sem nome localizado EN/PT-BR: {item_id}")
    icon = (icon_map.get(canonical_id) or {}).get("textureBasename")
    if not icon:
        raise KeyError(f"ItemId sem textura resolvida: {item_id}")
    return {"name": names["en-US"], "names": names, "icon": icon, "descr": ""}


if RAW.exists():
    rows = table_rows(RAW)
    pals, items, sources = {}, {}, {}
    for row_key, row in rows.items():
        character_id = row.get("CharacterID", "")
        is_boss = character_id.startswith("BOSS_")
        pal = key_to_pal.get(character_id[5:] if is_boss else character_id)
        if not pal:
            continue
        drops = []
        for index in range(1, 11):
            item_id = row.get(f"ItemId{index}")
            rate = float(row.get(f"Rate{index}", 0) or 0)
            if not item_id or item_id == "None" or rate <= 0:
                continue
            items.setdefault(item_id, {"id": item_id, **metadata(item_id)})
            drop = {
                "itemId": item_id,
                "rate": rate,
                "min": row.get(f"min{index}", 0),
                "max": row.get(f"Max{index}", 0),
            }
            drops.append(drop)
            sources.setdefault(item_id, []).append({
                "palId": pal["id"],
                "palSlug": pal.get("slug", pal["id"]),
                "palName": pal["name"],
                "palIndex": pal.get("index"),
                "palSuffix": pal.get("suffix", ""),
                "palIcon": pal.get("icon", ""),
                "variant": "boss" if is_boss else "normal",
                "level": row.get("Level", 0),
                **drop,
            })
        if drops:
            entry = pals.setdefault(pal["id"], {"normal": [], "boss": []})
            entry["boss" if is_boss else "normal"].append({
                "level": row.get("Level", 0), "row": row_key, "drops": drops
            })
    row_count = len(rows)
else:
    previous = js_object(ROOT / "drop-tables-data.js", "window.PAL_DROP_TABLES=")
    pals, sources = previous["pals"], previous["sources"]
    items = {item_id: {"id": item_id, **metadata(item_id)} for item_id in previous["items"]}
    row_count = previous["rowCount"]

for pal in pals.values():
    pal["normal"].sort(key=lambda row: row["level"])
    pal["boss"].sort(key=lambda row: row["level"])
for values in sources.values():
    values.sort(key=lambda row: (-row["rate"], -row["max"], row["variant"] != "normal", row["level"], row["palName"]))

output = {
    "source": "DT_PalDropItem_Common",
    "rowCount": row_count,
    "pals": pals,
    "items": items,
    "sources": sources,
}
(ROOT / "drop-tables-data.js").write_text(
    "window.PAL_DROP_TABLES=" + json.dumps(output, ensure_ascii=False, separators=(",", ":")) + ";\n",
    encoding="utf-8",
)
print(f"Generated {len(pals)} pals, {len(items)} items and {sum(map(len, sources.values()))} conditional sources")
