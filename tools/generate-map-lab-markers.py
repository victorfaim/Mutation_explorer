#!/usr/bin/env python3
"""Gera os marcadores locais do mapa-lab a partir do JSON do PL_MainWorld5."""

import json
import math
import re
import argparse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "LOCAL_RESEARCH" / "raw" / "mapa-lab"
SOURCE = RAW / "PL_MainWorld5.json"
IMAGE_SIZE = 8192
WORLD_TREE_SIZE = (1338, 783)

REFERENCES = [
    {
        "id": "New_SmallIsland05",
        "label": "Ilha Solitária da Ruína Gelada",
        "game": {"x": -1658, "y": -968},
        "image": {"pixelX": 686.313, "pixelY": 5188.504},
        "use": "fit",
    },
    {
        "id": "New_SmallIsland02",
        "label": "Ilha Solitária do Veio de Fogo",
        "game": {"x": 761, "y": 408},
        "image": {"pixelX": 6964.409, "pixelY": 1617.012},
        "use": "fit",
    },
    {
        "id": "FTPoint114",
        "label": "Encosta da Montanha Sagrada",
        "game": {"x": -406, "y": 507},
        "image": {"pixelX": 3934.343, "pixelY": 1366.256},
        "use": "validation",
    },
]

WORLD_TREE_REFERENCES = [
    {"id": "WorldTree_MiddleBoss_3", "label": "Superior esquerda", "game": {"x": -1995, "y": 1624}, "image": {"pixelX": 338.329, "pixelY": 81.386}, "use": "fit"},
    {"id": "WorldTree_MiddleBoss_1", "label": "Topo vermelho", "game": {"x": -1673, "y": 1638}, "image": {"pixelX": 792.607, "pixelY": 59.987}, "use": "fit"},
    {"id": "WorldTree_MiddleBoss_2", "label": "Ponta sul", "game": {"x": -1934, "y": 1156}, "image": {"pixelX": 425.142, "pixelY": 745.916}, "use": "fit"},
    {"id": "WorldTree_A", "label": "Extremo direito", "game": {"x": -1457, "y": 1385}, "image": {"pixelX": 1099.422, "pixelY": 414.245}, "use": "validation"},
]


def actor_key(object_name):
    match = re.search(r"PersistentLevel\.([^']+)", object_name or "")
    return match.group(1) if match else None


def fit_similarity(points):
    first, second = points[:2]
    x1, y1 = first["native"]["x"], first["native"]["y"]
    x2, y2 = second["native"]["x"], second["native"]["y"]
    u1, v1 = first["image"]["pixelX"], first["image"]["pixelY"]
    u2, v2 = second["image"]["pixelX"], second["image"]["pixelY"]
    dx, dy, du, dv = x2 - x1, y2 - y1, u2 - u1, v2 - v1
    denominator = dx * dx + dy * dy
    a = (du * dx + dv * dy) / denominator
    b = (du * dy - dv * dx) / denominator
    c = u1 - a * x1 - b * y1
    f = v1 - a * y1 + b * x1
    return a, b, c, f


def solve_three(matrix, values):
    rows = [list(row) + [value] for row, value in zip(matrix, values)]
    for column in range(3):
        pivot = max(range(column, 3), key=lambda row: abs(rows[row][column]))
        rows[column], rows[pivot] = rows[pivot], rows[column]
        divisor = rows[column][column]
        if abs(divisor) < 1e-12:
            raise ValueError("Referências degeneradas para transformação afim")
        rows[column] = [value / divisor for value in rows[column]]
        for row in range(3):
            if row == column:
                continue
            factor = rows[row][column]
            rows[row] = [value - factor * pivot_value for value, pivot_value in zip(rows[row], rows[column])]
    return [row[3] for row in rows]


def fit_affine_three(points):
    matrix = [[point["native"]["x"], point["native"]["y"], 1] for point in points[:3]]
    return (
        solve_three(matrix, [point["image"]["pixelX"] for point in points[:3]]),
        solve_three(matrix, [point["image"]["pixelY"] for point in points[:3]]),
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--public",
        action="store_true",
        help="gera os JSONs derivados versionáveis usados pela validação não listada",
    )
    args = parser.parse_args()
    if not SOURCE.exists():
        raise SystemExit(f"Fonte não encontrada: {SOURCE}")

    objects = json.loads(SOURCE.read_text(encoding="utf-8"))
    ids = {
        obj["Name"]: obj.get("Properties", {}).get("FastTravelPointID")
        for obj in objects
        if obj.get("Type") == "BP_LevelObject_TowerFastTravelPoint_C"
    }
    locations = {}
    for obj in objects:
        outer = obj.get("Outer", {}).get("ObjectName", "")
        location = obj.get("Properties", {}).get("RelativeLocation")
        if obj.get("Type") != "SceneComponent" or obj.get("Name") != "Root" or not location:
            continue
        if "TowerFastTravelPoint" not in outer:
            continue
        key = actor_key(outer)
        point_id = ids.get(key)
        if point_id:
            locations[point_id] = {
                "x": location["X"], "y": location["Y"], "z": location["Z"]
            }

    if len(locations) != 152:
        raise SystemExit(f"Esperados 152 pontos associados; encontrados {len(locations)}.")

    reference_points = []
    for reference in REFERENCES:
        point = dict(reference)
        point["native"] = locations[point["id"]]
        point["image"] = {
            **point["image"],
            "u": point["image"]["pixelX"] / IMAGE_SIZE,
            "v": point["image"]["pixelY"] / IMAGE_SIZE,
        }
        reference_points.append(point)

    a, b, c, f = fit_similarity(reference_points)
    first, second = reference_points[:2]
    game_x_scale = (second["game"]["x"] - first["game"]["x"]) / (second["native"]["y"] - first["native"]["y"])
    game_x_offset = first["game"]["x"] - game_x_scale * first["native"]["y"]
    game_y_scale = (second["game"]["y"] - first["game"]["y"]) / (second["native"]["x"] - first["native"]["x"])
    game_y_offset = first["game"]["y"] - game_y_scale * first["native"]["x"]

    markers = []
    labels = {point["id"]: point["label"] for point in reference_points}
    for point_id, native in sorted(locations.items()):
        pixel_x = a * native["x"] + b * native["y"] + c
        pixel_y = a * native["y"] - b * native["x"] + f
        game_x = game_x_scale * native["y"] + game_x_offset
        game_y = game_y_scale * native["x"] + game_y_offset
        markers.append({
            "id": point_id,
            "type": "fast-travel-static",
            "label": labels.get(point_id, point_id),
            "native": native,
            "game": {
                "x": game_x,
                "y": game_y,
                "displayedX": round(game_x),
                "displayedY": round(game_y),
            },
            "image": {
                "pixelX": pixel_x,
                "pixelY": pixel_y,
                "u": pixel_x / IMAGE_SIZE,
                "v": pixel_y / IMAGE_SIZE,
            },
            "source": {
                "asset": "Pal/Content/Pal/Maps/MainWorld_5/PL_MainWorld5",
                "row": point_id,
            },
        })

    world_tree_width, world_tree_height = WORLD_TREE_SIZE
    world_tree_references = []
    for reference in WORLD_TREE_REFERENCES:
        point = dict(reference)
        point["native"] = locations[point["id"]]
        point["image"] = {**point["image"], "u": point["image"]["pixelX"] / world_tree_width, "v": point["image"]["pixelY"] / world_tree_height}
        world_tree_references.append(point)
    world_tree_x, world_tree_y = fit_affine_three(world_tree_references)
    world_tree_labels = {point["id"]: point["label"] for point in world_tree_references}
    world_tree_markers = []
    for marker in markers:
        if not marker["id"].startswith("WorldTree_"):
            continue
        native = marker["native"]
        pixel_x = world_tree_x[0] * native["x"] + world_tree_x[1] * native["y"] + world_tree_x[2]
        pixel_y = world_tree_y[0] * native["x"] + world_tree_y[1] * native["y"] + world_tree_y[2]
        world_tree_markers.append({**marker, "label": world_tree_labels.get(marker["id"], marker["label"]), "image": {"pixelX": pixel_x, "pixelY": pixel_y, "u": pixel_x / world_tree_width, "v": pixel_y / world_tree_height}})

    calibration = {
        "schemaVersion": 1,
        "model": "similarity",
        "referencePoints": reference_points,
        "validation": {"maxErrorPixels": 5},
    }
    data = {
        "schemaVersion": 1,
        "map": {
            "id": "PL_MainWorld5",
            "image": "assets/map/mainworld5.webp" if args.public else "LOCAL_RESEARCH/raw/mapa-lab/map.png",
            "width": IMAGE_SIZE,
            "height": IMAGE_SIZE,
            "pixelOrigin": "top-left",
        },
        "markers": markers,
    }
    world_tree_calibration = {"schemaVersion": 1, "model": "affine", "referencePoints": world_tree_references, "validation": {"maxErrorPixels": 6}}
    world_tree_data = {
        "schemaVersion": 1,
        "map": {"id": "WorldTree", "image": "assets/map/worldtree.webp" if args.public else "LOCAL_RESEARCH/raw/mapa-lab/worldtree.png", "width": world_tree_width, "height": world_tree_height, "pixelOrigin": "top-left"},
        "markers": world_tree_markers,
    }
    output_dir = ROOT / "mapa-lab-data" if args.public else RAW
    output_dir.mkdir(parents=True, exist_ok=True)
    markers_output = output_dir / ("mainworld5-markers.json" if args.public else "markers.json")
    calibration_output = output_dir / ("mainworld5-calibration.json" if args.public else "calibration.json")
    indent = None if args.public else 2
    separators = (",", ":") if args.public else None
    markers_output.write_text(json.dumps(data, ensure_ascii=False, indent=indent, separators=separators) + "\n", encoding="utf-8")
    calibration_output.write_text(json.dumps(calibration, ensure_ascii=False, indent=indent, separators=separators) + "\n", encoding="utf-8")
    (output_dir / "worldtree-markers.json").write_text(json.dumps(world_tree_data, ensure_ascii=False, indent=indent, separators=separators) + "\n", encoding="utf-8")
    (output_dir / "worldtree-calibration.json").write_text(json.dumps(world_tree_calibration, ensure_ascii=False, indent=indent, separators=separators) + "\n", encoding="utf-8")

    validation = reference_points[2]
    predicted_x = a * validation["native"]["x"] + b * validation["native"]["y"] + c
    predicted_y = a * validation["native"]["y"] - b * validation["native"]["x"] + f
    error = math.hypot(predicted_x - validation["image"]["pixelX"], predicted_y - validation["image"]["pixelY"])
    world_tree_validation = world_tree_references[3]
    native_vector = [world_tree_validation["native"]["x"], world_tree_validation["native"]["y"], 1]
    predicted_world_tree_x = sum(value * coefficient for value, coefficient in zip(native_vector, world_tree_x))
    predicted_world_tree_y = sum(value * coefficient for value, coefficient in zip(native_vector, world_tree_y))
    world_tree_error = math.hypot(predicted_world_tree_x - world_tree_validation["image"]["pixelX"], predicted_world_tree_y - world_tree_validation["image"]["pixelY"])
    visibility = "públicos derivados" if args.public else "locais"
    print(f"{len(markers)} marcadores {visibility} gerados; erro MainWorld5: {error:.3f} px; World Tree ({len(world_tree_markers)}): {world_tree_error:.3f} px")


if __name__ == "__main__":
    main()
