import argparse
import json
import re
import shutil
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RAW = ROOT / "LOCAL_RESEARCH/raw/fmodel/mutation/inbox"
DEFAULT_ITEMS = DEFAULT_RAW / "DT_ItemDataTable.json"
DEFAULT_TEXTURES = DEFAULT_RAW / "Texture"
CONFIG_PATH = ROOT / "tools/blueprint-icon-config.json"
SOURCE_DIR = ROOT / "tools/blueprint-icon-sources"
OUTPUT_DIR = ROOT / "assets/items"
MAP_PATH = ROOT / "blueprint-icons-data.js"
DROP_DATA_PATH = ROOT / "drop-tables-data.js"
DROP_PREFIX = "window.PAL_DROP_TABLES="
MAP_PREFIX = "window.BLUEPRINT_ICON_MAP="


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def read_window_json(path, prefix):
    text = Path(path).read_text(encoding="utf-8-sig").strip()
    if not text.startswith(prefix):
        raise ValueError(f"{path} não começa com {prefix}")
    return json.loads(text[len(prefix):].rstrip(";"))


def write_window_json(path, prefix, value):
    payload = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    Path(path).write_text(f"{prefix}{payload};\n", encoding="utf-8")


def load_rows(path=DEFAULT_ITEMS):
    data = read_json(path)
    if not isinstance(data, list) or not data or not isinstance(data[0].get("Rows"), dict):
        raise ValueError("DT_ItemDataTable.json possui estrutura inesperada")
    return data[0]["Rows"]


def is_blueprint(row):
    return (
        row.get("TypeA") == "EPalItemTypeA::Blueprint"
        and row.get("IconName") == "Blueprint"
    )


def derive_base_item(item_id, row, rows):
    if not item_id.startswith("Blueprint_") or not is_blueprint(row):
        return None

    remainder = item_id[len("Blueprint_"):]
    candidates = [remainder]
    rarity_suffix = re.fullmatch(r"(.+)_([1-5])", remainder)
    if rarity_suffix:
        candidates.append(rarity_suffix.group(1))

    valid = []
    for candidate_id in dict.fromkeys(candidates):
        candidate = rows.get(candidate_id)
        if not candidate:
            continue
        if candidate.get("Rarity") != row.get("Rarity"):
            continue
        icon_name = candidate.get("IconName")
        if not icon_name or icon_name in {"None", "Blueprint"}:
            continue
        valid.append((candidate_id, candidate))

    return valid[0] if len(valid) == 1 else None


def texture_index(texture_dir):
    paths = sorted(Path(texture_dir).rglob("*.png"))
    index = {}
    for path in paths:
        index.setdefault(path.name.casefold(), []).append(path)
    return index


def resolve_texture(base_row, index, aliases):
    icon_name = base_row["IconName"]
    type_a = base_row.get("TypeA", "").split("::")[-1]
    names = [
        f"T_itemicon_{icon_name}.png",
        f"T_itemicon_{type_a}_{icon_name}.png",
    ]
    alias = aliases.get(icon_name)
    if alias:
        names.append(alias)

    matches = []
    for name in dict.fromkeys(names):
        matches.extend(index.get(name.casefold(), []))
    unique = list(dict.fromkeys(matches))
    return unique[0] if len(unique) == 1 else None


def compose_icon(background_path, overlay_path, output_path, config):
    size = int(config["outputSize"])
    overlay_size = round(size * float(config["overlayScale"]))
    left = round((size - overlay_size) / 2 + int(config["offsetX"]))
    top = round((size - overlay_size) / 2 + int(config["offsetY"]))

    with Image.open(background_path) as background_source:
        background = background_source.convert("RGBA").resize(
            (size, size), Image.Resampling.LANCZOS
        )
    with Image.open(overlay_path) as overlay_source:
        overlay = overlay_source.convert("RGBA").resize(
            (overlay_size, overlay_size), Image.Resampling.LANCZOS
        )

    background.alpha_composite(overlay, (left, top))
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    background.save(output_path, format="PNG", compress_level=9)


def target_item_ids(drop_data, config):
    targets = {
        item_id
        for item_id, item in drop_data.get("items", {}).items()
        if item_id.startswith("Blueprint_") and not item.get("icon")
    }
    targets.update(config.get("calibrationItems", []))
    return sorted(targets)


def generate(
    item_table=DEFAULT_ITEMS,
    texture_dir=DEFAULT_TEXTURES,
    source_dir=SOURCE_DIR,
    output_dir=OUTPUT_DIR,
    map_path=MAP_PATH,
    drop_data_path=DROP_DATA_PATH,
    update_drop_data=True,
):
    config = read_json(CONFIG_PATH)
    rows = load_rows(item_table)
    drop_data = read_window_json(drop_data_path, DROP_PREFIX)
    index = texture_index(texture_dir)
    source_dir = Path(source_dir)
    output_dir = Path(output_dir)

    background_matches = index.get(config["backgroundTexture"].casefold(), [])
    if len(background_matches) != 1:
        raise ValueError("A textura-base do Blueprint está ausente ou ambígua")
    background_raw = background_matches[0]
    source_dir.mkdir(parents=True, exist_ok=True)
    background = source_dir / background_raw.name
    shutil.copy2(background_raw, background)

    result = {}
    rejected = {}
    for item_id in target_item_ids(drop_data, config):
        row = rows.get(item_id)
        derived = derive_base_item(item_id, row or {}, rows)
        if not derived:
            rejected[item_id] = "base-item-unresolved"
            continue
        base_item_id, base_row = derived
        overlay_raw = resolve_texture(base_row, index, config.get("textureAliases", {}))
        if not overlay_raw:
            rejected[item_id] = "overlay-texture-unresolved"
            continue

        overlay = source_dir / overlay_raw.name
        shutil.copy2(overlay_raw, overlay)
        generated_name = f"T_itemicon_BlueprintComposite_{item_id}.png"
        generated_path = output_dir / generated_name
        compose_icon(background, overlay, generated_path, config)

        result[item_id] = {
            "baseItemId": base_item_id,
            "backgroundTexture": background.stem,
            "overlayTexture": overlay.stem,
            "generatedIcon": generated_path.stem,
            "resolutionMethod": config["resolutionMethod"],
            "confidence": config["confidence"],
        }
        if update_drop_data and item_id in drop_data.get("items", {}):
            drop_data["items"][item_id]["icon"] = generated_path.stem

    write_window_json(map_path, MAP_PREFIX, result)
    if update_drop_data:
        write_window_json(drop_data_path, DROP_PREFIX, drop_data)
    return result, rejected


def main():
    parser = argparse.ArgumentParser(
        description="Gera previamente os ícones compostos dos Blueprints usados pelo site."
    )
    parser.add_argument("--item-table", type=Path, default=DEFAULT_ITEMS)
    parser.add_argument("--texture-dir", type=Path, default=DEFAULT_TEXTURES)
    args = parser.parse_args()
    result, rejected = generate(args.item_table, args.texture_dir)
    print(f"Blueprints gerados: {len(result)}")
    print(f"Não resolvidos: {len(rejected)}")
    for item_id, reason in rejected.items():
        print(f"- {item_id}: {reason}")
    if rejected:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
