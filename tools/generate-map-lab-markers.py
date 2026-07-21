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
    output_dir = ROOT / "mapa-lab-data" if args.public else RAW
    output_dir.mkdir(parents=True, exist_ok=True)
    markers_output = output_dir / ("mainworld5-markers.json" if args.public else "markers.json")
    calibration_output = output_dir / ("mainworld5-calibration.json" if args.public else "calibration.json")
    indent = None if args.public else 2
    separators = (",", ":") if args.public else None
    markers_output.write_text(json.dumps(data, ensure_ascii=False, indent=indent, separators=separators) + "\n", encoding="utf-8")
    calibration_output.write_text(json.dumps(calibration, ensure_ascii=False, indent=indent, separators=separators) + "\n", encoding="utf-8")

    validation = reference_points[2]
    predicted_x = a * validation["native"]["x"] + b * validation["native"]["y"] + c
    predicted_y = a * validation["native"]["y"] - b * validation["native"]["x"] + f
    error = math.hypot(predicted_x - validation["image"]["pixelX"], predicted_y - validation["image"]["pixelY"])
    visibility = "públicos derivados" if args.public else "locais"
    print(f"{len(markers)} marcadores {visibility} gerados; erro de validação: {error:.3f} px")


if __name__ == "__main__":
    main()
