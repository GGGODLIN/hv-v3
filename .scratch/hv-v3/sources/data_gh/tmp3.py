#!/usr/bin/env -S uv run --script
#
# /// script
# requires-python = ">=3.7"
# dependencies = ["httpx", "tqdm"]
# ///

from pathlib import Path
import json
from tqdm import tqdm
import sys
import asyncio
import httpx

DATA_FILE = Path("./equip_dist.json")


async def main():
    data = await scrape()
    analyze(data)


def analyze(data: dict):
    for tally_key in ["prefix", "suffix"]:
        for cat, name_counts in data[tally_key].items():
            name_counts_items = sorted(
                name_counts.items(),
                key=lambda kv: kv[1],
                reverse=True,
            )
            total = sum([kv[1] for kv in name_counts_items])

            print(f"{tally_key[0]}: {cat} ({total:,})")
            for name, count in name_counts_items:
                print(f"\t{count/total:.1%} {name}")


async def scrape():
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text())

    client = httpx.AsyncClient()

    prefix_by_type: dict[str, dict[str, int]] = dict()
    suffix_by_type: dict[str, dict[str, int]] = dict()

    all_logs = (await client.get("https://hvdata.gisadan.dev/battle_logs")).json()
    pbar = tqdm(all_logs)
    stats = dict(
        pn=0,
        sn=0,
    )

    for l in pbar:
        data = (
            await client.get(f"https://hvdata.gisadan.dev/battle_logs/{l['id']}")
        ).json()
        for v in data["parsed"]["drops"].values():
            isEquip = any(v["key"].startswith(tier) for tier in TIERS)
            if not isEquip:
                continue

            try:
                name_parts = parse_equip_name(v["key"])
            except Exception:
                print(f"Unparseable equip name: {v['key']}", file=sys.stderr)
                continue

            tally_key = name_parts["armor_type"] or name_parts["weapon_type"]
            prefix = name_parts["prefix"]
            suffix = name_parts["suffix"]

            if name_parts["prefix"]:
                prefix_by_type.setdefault(tally_key, dict())
                prefix_by_type[tally_key].setdefault(prefix, 0)
                prefix_by_type[tally_key][prefix] += 1
                stats["pn"] += 1

            suffix_by_type.setdefault(tally_key, dict())
            suffix_by_type[tally_key].setdefault(suffix, 0)
            suffix_by_type[tally_key][suffix] += 1
            stats["sn"] += 1

            pbar.set_description(f"({stats['pn']:,} + {stats['sn']:,} samples)")

    DATA_FILE.write_text(
        json.dumps(
            dict(
                prefix=prefix_by_type,
                suffix=suffix_by_type,
            ),
            indent=2,
        )
    )


def parse_equip_name(name: str) -> dict:
    rem = name.lower().strip()

    try:
        tier, rem = _find(rem, TIERS, raise_on_missing=True)
        prefix, rem = _find(rem, PREFIXES)
        armor_type, rem = _find(rem, ARMOR_TYPES)
        slot_type, rem = _find(rem, SLOT_TYPES)
        weapon_type, rem = _find(rem, WEAPON_TYPES)
        suf_art, rem = _find(rem, SUFFIX_ARTICLES)
        suffix, rem = _find(rem, SUFFIXES)
    except Exception:
        raise Exception((name, rem))

    assert len(rem) == 0, (name, rem)

    return dict(
        tier=tier,
        prefix=prefix,
        armor_type=armor_type,
        slot_type=slot_type,
        weapon_type=weapon_type,
        suf_art=suf_art,
        suffix=suffix,
    )


def _find(rem: str, opts: list[str], raise_on_missing=False):
    for o in opts:
        if rem.startswith(o.lower()):
            return o, rem[len(o) :].strip()
    else:
        if raise_on_missing:
            print("wtf", rem, opts)
            raise ValueError()
        else:
            return None, rem


TIERS = [
    "Crude",
    "Fair",
    "Average",
    "Superior",
    "Exquisite",
    "Magnificent",
    "Legendary",
    "Peerless",
    "Ultimate",
]


PREFIXES = [
    "Onyx",
    "Mithril",
    "Ruby",
    "Jade",
    "Zircon",
    "Cobalt",
    "Amber",
    #
    "Shielding",
    "Agile",
    "Reinforced",
    "Savage",
    "Frugal",
    "Charged",
    "Radiant",
    "Mystic",
    #
    "Tempestuous",
    "Shocking",
    "Fiery",
    "Hallowed",
    "Ethereal",
    "Arctic",
    "Demonic",
]

ARMOR_TYPES = [
    "Kevlar",
    "Shade",
    "Leather",
    "Power",
    "Plate",
    "Reactive",
    "Cotton",
    "Chain",
    "Phase",
    "Ironsilk",
    "Gossamer",
    "Drakehide",
]

SLOT_TYPES = [
    #
    "Helmet",
    "Breastplate",
    "Gauntlets",
    "Leggings",
    "Boots",
    #
    "Helmet",
    "Armor",
    "Gauntlets",
    "Leggings",
    "Boots",
    #
    "Helmet",
    "Cuirass",
    "Gauntlets",
    "Greaves",
    "Sabatons",
    #
    "Cap",
    "Robe",
    "Gloves",
    "Pants",
    "Shoes",
]

WEAPON_TYPES = [
    "Willow Staff",
    "Redwood Staff",
    "Oak Staff",
    "Ebony Staff",
    "Katalox Staff",
    #
    "Force Shield",
    "Tower Shield",
    "Kite Shield",
    "Buckler",
    #
    "Axe",
    "Scythe",
    "Shortsword",
    "Swordchucks",
    "Katana",
    "Dagger",
    "Wakizashi",
    "Longsword",
    "Estoc",
    "Rapier",
    "Club",
    "Great Mace",
    "Mace",
]

SUFFIX_ARTICLES = [
    "of the",
    "of",
    "the",
]

SUFFIXES = [
    "Negation",
    "Protection",
    "Frost-born",
    "Wind-waker",
    "Destruction",
    "Thunder-child",
    "Warding",
    "Spirit-ward",
    "Fire-eater",
    "Balance",
    "Slaughter",
    "Deflection",
    "Dampening",
    "Stoneskin",
    "Earth-walker",
    "Elementalist",
    "Cheetah",
    "Thrice-blessed",
    "Fleet",
    "Focus",
    "Heaven-sent",
    "Demon-fiend",
    "Curse-weaver",
    "Owl",
    "Barrier",
    "Swiftness",
    "Turtle",
    "Vampire",
    "Stoneskin",
    "Raccoon",
    "Arcanist",
    "Fox",
    "Banshee",
    "Illithid",
    "Battlecaster",
    "Ox",
    "Nimble",
    "Shadowdancer",
    #
    "Mjolnir",
    "Fenrir",
    "Freyr",
    "Niflheim",
    "Heimdall",
    "Surtr",
]

asyncio.run(main())
