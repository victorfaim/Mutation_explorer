import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("world_tree_tiles", ROOT / "tools" / "world_tree_tiles.py")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class WorldTreeTilesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config = MODULE.load_config()

    def test_urls_and_bounds(self):
        self.assertEqual(MODULE.tile_url(self.config, 0, 0), "https://palworld.gg/images/world-tree-tiles/5/0/0.png")
        self.assertEqual(MODULE.tile_url(self.config, 31, 31), "https://palworld.gg/images/world-tree-tiles/5/31/31.png")
        self.assertEqual(len(list(MODULE.tile_coordinates(self.config))), 1024)
        with self.assertRaises(ValueError):
            MODULE.tile_url(self.config, 32, 0)

    def test_positions_and_resolution(self):
        self.assertEqual(MODULE.tile_position(self.config, 0, 0), (0, 0))
        self.assertEqual(MODULE.tile_position(self.config, 31, 31), (7936, 7936))
        self.assertEqual(self.config["resolution"], {"width": 8192, "height": 8192})

    def test_invalid_png_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            invalid = Path(directory) / "invalid.png"
            invalid.write_bytes(b"not a png")
            self.assertFalse(MODULE.validate_png(invalid, 256)[0])
            wrong_size = Path(directory) / "wrong.png"
            Image.new("RGBA", (4, 4)).save(wrong_size)
            self.assertFalse(MODULE.validate_png(wrong_size, 256)[0])

    def test_incomplete_set_and_safe_composition(self):
        with tempfile.TemporaryDirectory() as directory:
            config = copy.deepcopy(self.config)
            config["_root"] = Path(directory)
            config["source"].update({"tileSize": 4, "minX": 0, "maxX": 1, "minY": 0, "maxY": 1})
            config["resolution"] = {"width": 8, "height": 8}
            config["paths"]["tiles"] = "tiles/{z}/{x}/{y}.png"
            config["paths"]["composedImage"] = "output/map.png"
            for x, y in ((0, 0), (0, 1), (1, 0)):
                path = MODULE.tile_path(config, x, y)
                path.parent.mkdir(parents=True, exist_ok=True)
                Image.new("RGBA", (4, 4), (x * 100, y * 100, 50, 128)).save(path)
            report = MODULE.validate_set(config)
            self.assertEqual(report["valid"], 3)
            self.assertEqual(len(report["failures"]), 1)
            with self.assertRaises(RuntimeError):
                MODULE.compose(config)
            missing = MODULE.tile_path(config, 1, 1)
            Image.new("RGBA", (4, 4), (100, 100, 50, 128)).save(missing)
            output = MODULE.compose(config)
            with Image.open(output) as image:
                self.assertEqual(image.size, (8, 8))
                self.assertEqual(image.mode, "RGBA")
                self.assertEqual(image.getpixel((6, 6)), (100, 100, 50, 128))


if __name__ == "__main__":
    unittest.main()
