#!/usr/bin/env python3
"""Baixa, valida e compõe localmente os tiles do mapa da World Tree."""

import argparse
import json
import os
import random
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

try:
    from PIL import Image, UnidentifiedImageError
except ModuleNotFoundError as error:
    if error.name != "PIL":
        raise
    raise SystemExit(
        "Dependência local ausente: Pillow. Instale com:\n"
        "  python -m pip install -r tools/requirements-map-lab.txt\n"
        "Depois execute novamente este comando."
    ) from error


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "mapa-lab-data" / "worldtree-map-config.json"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def load_config(path=DEFAULT_CONFIG):
    config_path = Path(path).resolve()
    config = json.loads(config_path.read_text(encoding="utf-8"))
    config["_root"] = ROOT
    validate_config(config)
    return config


def validate_config(config):
    source = config["source"]
    resolution = config["resolution"]
    tile_size = source["tileSize"]
    columns = source["maxX"] - source["minX"] + 1
    rows = source["maxY"] - source["minY"] + 1
    expected = (columns * tile_size, rows * tile_size)
    actual = (resolution["width"], resolution["height"])
    if source["minX"] > source["maxX"] or source["minY"] > source["maxY"]:
        raise ValueError("Limites de tiles inválidos.")
    if actual != expected:
        raise ValueError(f"Resolução configurada {actual} difere da esperada {expected}.")


def tile_coordinates(config):
    source = config["source"]
    for x in range(source["minX"], source["maxX"] + 1):
        for y in range(source["minY"], source["maxY"] + 1):
            yield x, y


def tile_url(config, x, y):
    source = config["source"]
    if not (source["minX"] <= x <= source["maxX"] and source["minY"] <= y <= source["maxY"]):
        raise ValueError(f"Tile fora dos limites: x={x}, y={y}")
    return source["urlTemplate"].format(z=source["zoom"], x=x, y=y)


def resolve_project_path(config, template, x=None, y=None):
    source = config["source"]
    relative = template.format(z=source["zoom"], x=x, y=y)
    path = Path(relative)
    return path if path.is_absolute() else config["_root"] / path


def tile_path(config, x, y):
    return resolve_project_path(config, config["paths"]["tiles"], x, y)


def tile_position(config, x, y):
    source = config["source"]
    if not (source["minX"] <= x <= source["maxX"] and source["minY"] <= y <= source["maxY"]):
        raise ValueError(f"Tile fora dos limites: x={x}, y={y}")
    size = source["tileSize"]
    return (x - source["minX"]) * size, (y - source["minY"]) * size


def validate_png(path, expected_size):
    path = Path(path)
    try:
        with path.open("rb") as stream:
            if stream.read(8) != PNG_SIGNATURE:
                return False, "assinatura PNG inválida"
        with Image.open(path) as image:
            if image.format != "PNG":
                return False, f"formato {image.format!r}, esperado PNG"
            if image.size != (expected_size, expected_size):
                return False, f"dimensão {image.size}, esperada {(expected_size, expected_size)}"
            image.verify()
    except (OSError, UnidentifiedImageError) as error:
        return False, str(error)
    return True, "ok"


def validate_set(config):
    valid, failures = 0, []
    size = config["source"]["tileSize"]
    for x, y in tile_coordinates(config):
        path = tile_path(config, x, y)
        ok, reason = validate_png(path, size) if path.is_file() else (False, "ausente")
        if ok:
            valid += 1
        else:
            failures.append({"x": x, "y": y, "path": str(path), "reason": reason})
    return {"expected": valid + len(failures), "valid": valid, "failures": failures}


def download_one(config, x, y, retries, timeout, interval):
    destination = tile_path(config, x, y)
    size = config["source"]["tileSize"]
    if destination.is_file() and validate_png(destination, size)[0]:
        return "reused", x, y, None
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".part")
    last_error = None
    for attempt in range(retries + 1):
        if interval:
            time.sleep(interval + random.uniform(0, interval * 0.25))
        try:
            request = urllib.request.Request(tile_url(config, x, y), headers={"User-Agent": "PalMutationExplorer-MapLab/1.0"})
            with urllib.request.urlopen(request, timeout=timeout) as response:
                status = getattr(response, "status", response.getcode())
                if status != 200:
                    raise RuntimeError(f"HTTP {status}")
                temporary.write_bytes(response.read())
            ok, reason = validate_png(temporary, size)
            if not ok:
                raise RuntimeError(reason)
            os.replace(temporary, destination)
            return "downloaded", x, y, None
        except (OSError, RuntimeError, urllib.error.URLError) as error:
            last_error = str(error)
            temporary.unlink(missing_ok=True)
            if attempt < retries:
                time.sleep(min(2 ** attempt, 4))
    return "failed", x, y, last_error


def download(config, workers=4, retries=3, timeout=30, interval=0.05):
    counts = {"downloaded": 0, "reused": 0, "failed": 0}
    failures = []
    with ThreadPoolExecutor(max_workers=workers) as executor:
        jobs = [executor.submit(download_one, config, x, y, retries, timeout, interval) for x, y in tile_coordinates(config)]
        for job in as_completed(jobs):
            result, x, y, reason = job.result()
            counts[result] += 1
            if result == "failed":
                failures.append((x, y, reason))
                print(f"FALHA z={config['source']['zoom']} x={x} y={y}: {reason}")
    print(f"Download concluído: {counts['downloaded']} baixados, {counts['reused']} reutilizados, {counts['failed']} falhos.")
    if failures:
        raise RuntimeError(f"Download incompleto: {len(failures)} tile(s) falharam.")
    report = validate_set(config)
    if report["failures"]:
        raise RuntimeError(f"Conjunto incompleto após download: {len(report['failures'])} tile(s) inválidos ou ausentes.")
    return counts


def compose(config):
    report = validate_set(config)
    if report["failures"]:
        raise RuntimeError(f"Não é possível compor: {len(report['failures'])} de {report['expected']} tiles estão ausentes ou inválidos.")
    resolution = config["resolution"]
    output = resolve_project_path(config, config["paths"]["composedImage"])
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".part")
    canvas = Image.new("RGBA", (resolution["width"], resolution["height"]), (0, 0, 0, 0))
    try:
        for x, y in tile_coordinates(config):
            with Image.open(tile_path(config, x, y)) as tile:
                canvas.alpha_composite(tile.convert("RGBA"), tile_position(config, x, y))
        canvas.save(temporary, format="PNG", optimize=False)
        os.replace(temporary, output)
    finally:
        canvas.close()
        temporary.unlink(missing_ok=True)
    print(f"Imagem composta: {output} ({resolution['width']}x{resolution['height']}, RGBA).")
    return output


def print_validation(config):
    report = validate_set(config)
    print(f"Validação: {report['valid']}/{report['expected']} tiles PNG válidos.")
    for failure in report["failures"][:20]:
        print(f"INVÁLIDO x={failure['x']} y={failure['y']}: {failure['reason']}")
    if len(report["failures"]) > 20:
        print(f"... e mais {len(report['failures']) - 20} falhas.")
    if report["failures"]:
        raise RuntimeError(f"Conjunto incompleto: {len(report['failures'])} tile(s) inválidos ou ausentes.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("download", "validate", "compose", "all"))
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--interval", type=float, default=0.05)
    args = parser.parse_args()
    if not 1 <= args.workers <= 8:
        parser.error("--workers deve estar entre 1 e 8")
    if not 0 <= args.retries <= 8:
        parser.error("--retries deve estar entre 0 e 8")
    config = load_config(args.config)
    try:
        if args.command in ("download", "all"):
            download(config, args.workers, args.retries, args.timeout, args.interval)
        elif args.command == "validate":
            print_validation(config)
        if args.command in ("compose", "all"):
            compose(config)
    except RuntimeError as error:
        raise SystemExit(str(error)) from error


if __name__ == "__main__":
    main()
