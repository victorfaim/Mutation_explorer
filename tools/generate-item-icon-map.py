import hashlib
import importlib.util
import json
import shutil
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "LOCAL_RESEARCH/raw/fmodel/mutation/inbox"
ITEM_TABLE = RAW / "DT_ItemDataTable.json"
TEXTURE_DIR = RAW / "Texture"
PUBLIC_DIR = ROOT / "assets/items"
MANIFEST_PATH = ROOT / "item-texture-manifest.json"
MAP_PATH = ROOT / "item-icon-map.js"
COVERAGE_PATH = ROOT / "item-icon-coverage.json"
DROP_PATH = ROOT / "drop-tables-data.js"
REVIEW_PATH = ROOT / "LOCAL_RESEARCH/reviews/item-icon-coverage.html"
CONFIG_PATH = ROOT / "tools/blueprint-icon-config.json"
DROP_PREFIX = "window.PAL_DROP_TABLES="
MAP_PREFIX = "window.ITEM_ICON_MAP="

spec = importlib.util.spec_from_file_location(
    "blueprint_icons", ROOT / "tools/generate-blueprint-icons.py"
)
blueprints = importlib.util.module_from_spec(spec)
spec.loader.exec_module(blueprints)

RELIC_ICON_OVERRIDES = {
    "JumpPower": "T_itemicon_Relic_04",
    "RainbowPassiveRate": "T_itemicon_Relic_11",
    "FoodDecayReduction": "T_itemicon_Relic_03",
    "ExpBonus": "T_itemicon_Relic_10",
    "GliderSpeed": "T_itemicon_Relic_05",
    "ClimbSpeed": "T_itemicon_Relic_06",
    "SphereHoming": "T_itemicon_Relic_09",
    "StatusAilmentResist": "T_itemicon_Relic_07",
    "SwimSpeed": "T_itemicon_Relic_02",
    "StaminaReduction": "T_itemicon_Relic_08",
    "HungerReduction": "T_itemicon_Relic_01",
}


def read_window_json(path, prefix):
    text = Path(path).read_text(encoding="utf-8-sig").strip()
    if not text.startswith(prefix):
        raise ValueError(f"{path} não começa com {prefix}")
    return json.loads(text[len(prefix):].rstrip(";"))


def write_window_json(path, prefix, value, suffix=""):
    payload = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    Path(path).write_text(f"{prefix}{payload};\n{suffix}", encoding="utf-8")


def texture_inventory(texture_dir=TEXTURE_DIR):
    records = []
    for path in sorted(Path(texture_dir).rglob("*.png")):
        with Image.open(path) as image:
            width, height = image.size
        records.append({
            "relativePath": path.relative_to(texture_dir).as_posix(),
            "basename": path.stem,
            "extension": path.suffix.lower(),
            "width": width,
            "height": height,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        })
    return records


def build_texture_index(texture_dir=TEXTURE_DIR):
    index = {}
    for path in sorted(Path(texture_dir).rglob("*.png")):
        index.setdefault(path.name.casefold(), []).append(path)
    return index


def unique_texture(index, names):
    matches = []
    for name in dict.fromkeys(names):
        matches.extend(index.get(name.casefold(), []))
    unique = list(dict.fromkeys(matches))
    return unique[0] if len(unique) == 1 else None


def resolve_regular(item_id, row, index, aliases):
    exact = unique_texture(index, [
        f"T_itemicon_{item_id}.png",
        f"T_icon_item_{item_id}.png",
    ])
    if exact:
        return exact, "itemid-exact", "confirmed"

    icon_name = row.get("IconName")
    type_a = row.get("TypeA", "").split("::")[-1]
    if icon_name and icon_name != "None":
        patterned = unique_texture(index, [
            f"T_itemicon_{type_a}_{icon_name}.png",
            f"T_itemicon_{icon_name}.png",
            f"T_icon_item_{icon_name}.png",
        ])
        if patterned:
            return patterned, "category-iconname-exact", "confirmed-pattern"

    alias_name = aliases.get(item_id)
    if alias_name:
        alias = unique_texture(index, [alias_name])
        if alias:
            return alias, "alias-existing", "manual-confirmed"
    return None


def generated_name(item_id):
    return f"T_itemicon_BlueprintComposite_{item_id}"


def generate_all():
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    rows = blueprints.load_rows(ITEM_TABLE)
    index = build_texture_index(TEXTURE_DIR)
    inventory = texture_inventory(TEXTURE_DIR)
    if len(inventory) != 896:
        raise ValueError(f"Inventário inesperado: {len(inventory)} texturas")
    if len({row['basename'].casefold() for row in inventory}) != len(inventory):
        raise ValueError("O inventário possui basenames duplicados")

    manifest = {
        "source": "Pal/Content/Others/InventoryItemIcon/Texture",
        "count": len(inventory),
        "textures": inventory,
    }
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    background = unique_texture(index, [config["backgroundTexture"]])
    if not background:
        raise ValueError("T_itemicon_Material_Blueprint não foi encontrado")
    shutil.copy2(background, PUBLIC_DIR / background.name)

    icon_map = {}
    used_originals = {background}
    for item_id, row in rows.items():
        entry = {
            "iconName": row.get("IconName"),
            "typeA": row.get("TypeA", "").split("::")[-1],
            "textureBasename": None,
            "publicPath": None,
            "resolutionMethod": "unresolved",
            "confidence": "unresolved",
        }
        resolved = resolve_regular(item_id, row, index, config.get("itemAliases", {}))
        if resolved:
            texture, method, confidence = resolved
            used_originals.add(texture)
            entry.update({
                "textureBasename": texture.stem,
                "publicPath": f"assets/items/{texture.name}",
                "resolutionMethod": method,
                "confidence": confidence,
            })
        elif blueprints.is_blueprint(row):
            derived = blueprints.derive_base_item(item_id, row, rows)
            if not derived:
                entry["resolutionMethod"] = "special-unresolved"
            else:
                base_item_id, base_row = derived
                overlay = blueprints.resolve_texture(
                    base_row, index, config.get("textureAliases", {})
                )
                if overlay:
                    name = generated_name(item_id)
                    output = PUBLIC_DIR / f"{name}.png"
                    blueprints.compose_icon(background, overlay, output, config)
                    entry.update({
                        "baseItemId": base_item_id,
                        "backgroundTexture": background.stem,
                        "overlayTexture": overlay.stem,
                        "textureBasename": name,
                        "publicPath": f"assets/items/{name}.png",
                        "resolutionMethod": "blueprint-composite",
                        "confidence": "confirmed-pattern",
                    })
        icon_map[item_id] = entry

    for texture in sorted(used_originals):
        shutil.copy2(texture, PUBLIC_DIR / texture.name)

    relic_lines = "window.RELIC_ICON_OVERRIDES=" + json.dumps(
        RELIC_ICON_OVERRIDES, ensure_ascii=False, separators=(",", ":")
    ) + ";\n"
    write_window_json(MAP_PATH, MAP_PREFIX, icon_map, relic_lines)

    drop_data = read_window_json(DROP_PATH, DROP_PREFIX)
    for item_id, item in drop_data.get("items", {}).items():
        mapped = icon_map.get(item_id)
        if mapped and mapped.get("textureBasename"):
            item["icon"] = mapped["textureBasename"]
    write_window_json(DROP_PATH, DROP_PREFIX, drop_data)

    methods = Counter(entry["resolutionMethod"] for entry in icon_map.values())
    coverage = {
        "totalItems": len(icon_map),
        "resolved": sum(count for method, count in methods.items() if method not in {"unresolved", "special-unresolved"}),
        "unresolved": methods["unresolved"],
        "specialUnresolved": methods["special-unresolved"],
        "publishedOriginalTextures": len(used_originals),
        "generatedBlueprints": methods["blueprint-composite"],
        "methods": dict(sorted(methods.items())),
    }
    COVERAGE_PATH.write_text(
        json.dumps(coverage, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    generate_review(icon_map, rows)
    return icon_map, coverage


def generate_review(icon_map, rows):
    groups = [
        ("Confirmados", {"itemid-exact", "category-iconname-exact"}),
        ("Compostos", {"blueprint-composite"}),
        ("Aliases", {"alias-existing"}),
        ("Relíquias", set()),
        ("Não resolvidos", {"unresolved"}),
        ("Casos especiais", {"special-unresolved"}),
    ]
    sections = []
    for title, methods in groups:
        if title == "Relíquias":
            ids = [f"Relic_{number:02d}" for number in range(1, 13)]
        else:
            ids = [item_id for item_id, entry in icon_map.items() if entry["resolutionMethod"] in methods]
        cards = []
        for item_id in ids:
            entry = icon_map.get(item_id)
            if not entry:
                continue
            image = f'<img loading="lazy" src="../../{entry["publicPath"]}" alt="">' if entry.get("publicPath") else '<span class="fallback">◆</span>'
            cards.append(
                f'<article>{image}<div><strong>{item_id}</strong><span>{entry["typeA"]} · {entry["iconName"]}</span>'
                f'<span>{entry.get("baseItemId", "")}</span><code>{entry.get("textureBasename") or "sem textura"}</code>'
                f'<span>{entry["resolutionMethod"]} · {entry["confidence"]}</span></div></article>'
            )
        sections.append(f'<section><h2>{title} <small>{len(cards)}</small></h2><div class="grid">{"".join(cards)}</div></section>')
    html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cobertura de ícones</title><style>body{{background:#07111f;color:#e8f2ff;font:14px system-ui;margin:0;padding:24px}}main{{max-width:1500px;margin:auto}}section{{margin:32px 0}}h1,h2{{margin:.3em 0}}small,span{{color:#9bb0c9}}.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}}article{{display:grid;grid-template-columns:72px 1fr;gap:12px;background:#0e1d31;border:1px solid #294566;border-radius:10px;padding:10px;min-width:0}}img,.fallback{{width:72px;height:72px;object-fit:contain;background:#081421;border-radius:8px;display:grid;place-items:center}}article div{{display:grid;gap:3px;min-width:0}}strong,code{{overflow-wrap:anywhere}}code{{font-size:11px;color:#73d7ff}}</style></head><body><main><h1>Consolidação dos ícones oficiais</h1><p>Galeria técnica local; não faz parte da navegação pública.</p>{''.join(sections)}</main></body></html>'''
    REVIEW_PATH.parent.mkdir(parents=True, exist_ok=True)
    REVIEW_PATH.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    icon_map, coverage = generate_all()
    print(json.dumps(coverage, ensure_ascii=False, indent=2))
