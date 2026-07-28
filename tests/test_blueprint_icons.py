import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "tools/generate-blueprint-icons.py"
SPEC = importlib.util.spec_from_file_location("blueprint_icons", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class BlueprintIconTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows = MODULE.load_rows()

    def test_derives_electric_support_whistle(self):
        item_id = "Blueprint_Otomo_ElementBoost_Electricity_1_2"
        result = MODULE.derive_base_item(item_id, self.rows[item_id], self.rows)
        self.assertEqual(result[0], "Otomo_ElementBoost_Electricity_1")

    def test_derives_launcher_with_matching_rarity(self):
        item_id = "Blueprint_Launcher_Default_5"
        result = MODULE.derive_base_item(item_id, self.rows[item_id], self.rows)
        self.assertEqual(result[0], "Launcher_Default_5")
        self.assertEqual(result[1]["Rarity"], self.rows[item_id]["Rarity"])

    def test_rejects_rarity_mismatch(self):
        rows = {
            "Blueprint_Test_5": {
                "TypeA": "EPalItemTypeA::Blueprint",
                "IconName": "Blueprint",
                "Rarity": 4,
            },
            "Test_5": {
                "TypeA": "EPalItemTypeA::Weapon",
                "IconName": "Test",
                "Rarity": 3,
            },
        }
        self.assertIsNone(
            MODULE.derive_base_item("Blueprint_Test_5", rows["Blueprint_Test_5"], rows)
        )

    def test_rejects_special_case_without_base(self):
        item_id = "Blueprint_Hunter_GangFlag"
        self.assertIsNone(
            MODULE.derive_base_item(item_id, self.rows[item_id], self.rows)
        )

    def test_required_overlay_textures_exist(self):
        config = MODULE.read_json(MODULE.CONFIG_PATH)
        index = MODULE.texture_index(MODULE.DEFAULT_TEXTURES)
        for item_id in (
            "Blueprint_Otomo_ElementBoost_Electricity_1_2",
            "Blueprint_Launcher_Default_5",
            "Blueprint_CopperArmor_5",
            "Blueprint_CopperHelmet_5",
        ):
            _, base = MODULE.derive_base_item(item_id, self.rows[item_id], self.rows)
            self.assertIsNotNone(
                MODULE.resolve_texture(base, index, config["textureAliases"]), item_id
            )

    def test_composition_is_rgba_256_and_deterministic(self):
        config = MODULE.read_json(MODULE.CONFIG_PATH)
        background = MODULE.DEFAULT_TEXTURES / config["backgroundTexture"]
        overlay = (
            MODULE.DEFAULT_TEXTURES
            / "T_itemicon_Accessory_Otomo_ElementBoost_Electricity.png"
        )
        with tempfile.TemporaryDirectory() as directory:
            first = Path(directory) / "first.png"
            second = Path(directory) / "second.png"
            MODULE.compose_icon(background, overlay, first, config)
            MODULE.compose_icon(background, overlay, second, config)
            with Image.open(first) as image:
                self.assertEqual(image.size, (256, 256))
                self.assertEqual(image.mode, "RGBA")
            self.assertEqual(
                hashlib.sha256(first.read_bytes()).digest(),
                hashlib.sha256(second.read_bytes()).digest(),
            )

    def test_all_previously_empty_drop_blueprints_resolve(self):
        drop_data = MODULE.read_window_json(MODULE.DROP_DATA_PATH, MODULE.DROP_PREFIX)
        map_text = (ROOT / "item-icon-map.js").read_text(encoding="utf-8")
        icon_map = json.loads(
            map_text.split("window.RELIC_ICON_OVERRIDES=", 1)[0].strip()[len("window.ITEM_ICON_MAP="):].rstrip(";")
        )
        resolved_drop_blueprints = [
            item
            for item in drop_data["items"].values()
            if item["id"].startswith("Blueprint_")
            and item.get("icon", "").startswith("T_itemicon_BlueprintComposite_")
        ]
        self.assertGreaterEqual(len(resolved_drop_blueprints), 22)
        for item in resolved_drop_blueprints:
            self.assertIn(item["id"], icon_map)
            self.assertTrue(
                (MODULE.OUTPUT_DIR / f"{item['icon']}.png").is_file(), item["id"]
            )

    def test_existing_item_associations_are_not_changed(self):
        data = MODULE.read_window_json(MODULE.DROP_DATA_PATH, MODULE.DROP_PREFIX)
        self.assertEqual(
            data["items"]["Wool"]["icon"],
            "T_itemicon_Material_Wool",
        )
        self.assertEqual(
            data["items"]["IceOrgan"]["icon"],
            "T_itemicon_Material_IceOrgan",
        )


if __name__ == "__main__":
    unittest.main()
