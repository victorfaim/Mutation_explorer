import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "item-icon-map.js"
DROP_PATH = ROOT / "drop-tables-data.js"
MANIFEST_PATH = ROOT / "item-texture-manifest.json"


def window_json(path, prefix, stop=None):
    text = path.read_text(encoding="utf-8-sig")
    if stop:
        text = text.split(stop, 1)[0]
    return json.loads(text.strip()[len(prefix):].rstrip(";"))


class ItemIconMapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.icon_map = window_json(
            MAP_PATH, "window.ITEM_ICON_MAP=", "window.RELIC_ICON_OVERRIDES="
        )
        cls.drop_data = window_json(DROP_PATH, "window.PAL_DROP_TABLES=")
        cls.manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        text = MAP_PATH.read_text(encoding="utf-8")
        cls.relic_overrides = json.loads(
            text.split("window.RELIC_ICON_OVERRIDES=", 1)[1].strip().rstrip(";")
        )

    def test_inventory_has_unique_basenames(self):
        textures = self.manifest["textures"]
        self.assertEqual(len(textures), 896)
        self.assertEqual(len({row["basename"].casefold() for row in textures}), 896)
        for row in textures:
            self.assertEqual(len(row["sha256"]), 64)
            self.assertGreater(row["width"], 0)
            self.assertGreater(row["height"], 0)

    def test_itemid_and_category_iconname_resolution(self):
        self.assertEqual(
            self.icon_map["Relic_01"]["resolutionMethod"], "itemid-exact"
        )
        ice = self.icon_map["IceOrgan"]
        self.assertEqual(ice["resolutionMethod"], "category-iconname-exact")
        self.assertEqual(ice["textureBasename"], "T_itemicon_Material_IceOrgan")

    def test_lowercase_food_exception(self):
        item = self.icon_map["Meat_OctopusGirl"]
        self.assertEqual(item["textureBasename"], "T_itemicon_food_Meat_OctopusGirl")
        self.assertEqual(item["resolutionMethod"], "category-iconname-exact")

    def test_existing_aliases(self):
        expected = {
            "Herbs": "T_itemicon_Food_Herbs",
            "WorldTreeHolyWater": "T_itemicon_Material_WorldTreeHolyWater",
            "Narcotic": "T_itemicon_Food_Narcotic",
        }
        for item_id, texture in expected.items():
            item = self.icon_map[item_id]
            self.assertEqual(item["textureBasename"], texture)
            self.assertEqual(item["resolutionMethod"], "alias-existing")
        self.assertEqual(
            self.icon_map["PalCrystal_Ex"]["resolutionMethod"],
            "category-iconname-exact",
        )

    def test_five_precious_items_are_integrated(self):
        for number in range(1, 6):
            item_id = f"PalItem_ToSell_{number:02d}"
            expected = f"T_itemicon_Material_{item_id}"
            self.assertEqual(self.icon_map[item_id]["textureBasename"], expected)
            self.assertEqual(self.drop_data["items"][item_id]["icon"], expected)
            self.assertTrue((ROOT / "assets/items" / f"{expected}.png").is_file())

    def test_blueprints_and_special_cases(self):
        for item_id in (
            "Blueprint_Otomo_ElementBoost_Electricity_1_2",
            "Blueprint_Launcher_Default_5",
        ):
            item = self.icon_map[item_id]
            self.assertEqual(item["resolutionMethod"], "blueprint-composite")
            self.assertTrue((ROOT / item["publicPath"]).is_file())
        self.assertNotEqual(
            self.icon_map["Blueprint_Hunter_GangFlag"]["resolutionMethod"],
            "blueprint-composite",
        )
        self.assertEqual(
            self.icon_map["Blueprint_Salvage_FishingBait_1_A"]["resolutionMethod"],
            "special-unresolved",
        )

    def test_previously_missing_drop_blueprints_have_icons(self):
        resolved = [
            item for item in self.drop_data["items"].values()
            if item["id"].startswith("Blueprint_")
            and item.get("icon", "").startswith("T_itemicon_BlueprintComposite_")
        ]
        self.assertGreaterEqual(len(resolved), 22)

    def test_relic_items_resolve_but_statues_remain_unassigned(self):
        for number in range(1, 13):
            item_id = f"Relic_{number:02d}"
            self.assertEqual(
                self.icon_map[item_id]["textureBasename"], f"T_itemicon_{item_id}"
            )
        self.assertTrue(self.relic_overrides)
        self.assertTrue(all(value is None for value in self.relic_overrides.values()))

    def test_fallback_and_public_consumers(self):
        unresolved = next(
            entry for entry in self.icon_map.values()
            if entry["resolutionMethod"] == "unresolved"
        )
        self.assertIsNone(unresolved["textureBasename"])
        for page in ("item.html", "itens.html", "pal.html", "palpedia.html", "mapa.html"):
            text = (ROOT / page).read_text(encoding="utf-8")
            self.assertIn("item-icon-map.js", text, page)
        self.assertIn(
            "ITEM_ICON_MAP", (ROOT / "mapa-details.js").read_text(encoding="utf-8")
        )
        self.assertIn(
            "ITEM_ICON_MAP", (ROOT / "core.js").read_text(encoding="utf-8")
        )


if __name__ == "__main__":
    unittest.main()
