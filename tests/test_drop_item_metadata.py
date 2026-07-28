import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read_window_json(path, prefix):
    text = path.read_text(encoding="utf-8-sig").strip()
    payload = text[len(prefix):]
    if ";\nwindow." in payload:
        payload = payload.split(";\nwindow.", 1)[0]
    else:
        payload = payload.rstrip(";")
    return json.loads(payload)


class DropItemMetadataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tables = read_window_json(ROOT / "drop-tables-data.js", "window.PAL_DROP_TABLES=")
        cls.icons = read_window_json(ROOT / "item-icon-map.js", "window.ITEM_ICON_MAP=")

    def test_all_drop_items_have_bilingual_names_and_matching_icons(self):
        self.assertEqual(150, len(self.tables["items"]))
        for item_id, meta in self.tables["items"].items():
            with self.subTest(item_id=item_id):
                self.assertTrue(meta["names"]["en-US"])
                self.assertTrue(meta["names"]["pt-BR"])
                canonical_id = item_id if item_id in self.icons else next(
                    key for key in self.icons if key.casefold() == item_id.casefold()
                )
                self.assertEqual(self.icons[canonical_id]["textureBasename"], meta["icon"])

    def test_confirmed_precious_item_order(self):
        expected = {
            "PalItem_ToSell_01": ("Precious Dragon Stone", "Orbe de Dragão Valioso"),
            "PalItem_ToSell_02": ("Precious Plume", "Asa Valiosa"),
            "PalItem_ToSell_03": ("Precious Entrails", "Víscera Valiosa"),
            "PalItem_ToSell_04": ("Precious Claw", "Garra Valiosa"),
            "PalItem_ToSell_05": ("Precious Pelt", "Pele Valiosa"),
        }
        for item_id, (english, portuguese) in expected.items():
            self.assertEqual(english, self.tables["items"][item_id]["names"]["en-US"])
            self.assertEqual(portuguese, self.tables["items"][item_id]["names"]["pt-BR"])

    def test_unique_material_names_follow_official_rows(self):
        membrane = self.tables["items"]["UniqueMaterial_FlowerPrince"]
        self.assertEqual("Toxin Filtering Membrane", membrane["names"]["en-US"])
        self.assertEqual("Membrana Miásmica", membrane["names"]["pt-BR"])
        self.assertEqual("T_itemicon_Material_UniqueMaterial_FlowerPrince", membrane["icon"])
        fiber = self.tables["items"]["UniqueMaterial_Mothman"]
        self.assertEqual("Explosion-Resistant Fiber", fiber["names"]["en-US"])
        self.assertEqual("Fibra Antiexplosão", fiber["names"]["pt-BR"])

    def test_only_confirmed_case_alias_collides(self):
        identities = {}
        for item_id, meta in self.tables["items"].items():
            identity = (meta["name"].casefold(), meta["icon"].casefold())
            identities.setdefault(identity, []).append(item_id)
        duplicates = sorted(sorted(ids) for ids in identities.values() if len(ids) > 1)
        self.assertEqual([["Poppy", "poppy"]], duplicates)


if __name__ == "__main__":
    unittest.main()
