def parse_equip_name(name: str) -> dict:
    rem = name.lower().strip()

    try:
        tier, rem = _find(rem, TIERS, raise_on_missing=True)
        prefix, rem = _find(rem, PREFIXES)
        armor_type, rem = _find(rem, ARMOR_TYPES)
        slot_type, rem = _find(rem, SLOT_TYPES)
        weapon_type, rem = _find(rem, WEAPON_TYPES)
        type = armor_type + " " + slot_type if armor_type else weapon_type
        suf_art, rem = _find(rem, SUFFIX_ARTICLES)
        suffix, rem = _find(rem, SUFFIXES)
    except Exception:
        raise Exception((name, rem))

    assert len(rem) == 0, (name, rem)

    return dict(
        tier=tier,
        prefix=prefix,
        type=type,
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
            raise ValueError
        else:
            return None, rem.strip()


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

TYPES = [*WEAPON_TYPES, *[a + " " + s for a in ARMOR_TYPES for s in SLOT_TYPES]]

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

SLOT_LOCS = dict(
    HEAD=[
        "Kevlar Helmet",
        "Shade Helmet",
        "Leather Helmet",
        "Power Helmet",
        "Plate Helmet",
        "Reactive Helmet",
        "Cotton Cap",
        "Chain Helmet",
        "Phase Cap",
        "Ironsilk Cap",
        "Gossamer Cap",
        "Drakehide Helmet",
    ],
    BODY=[
        "Kevlar Breastplate",
        "Shade Breastplate",
        "Leather Breastplate",
        "Power Armor",
        "Plate Cuirass",
        "Reactive Cuirass",
        "Cotton Robe",
        "Chain Cuirass",
        "Phase Robe",
        "Ironsilk Robe",
        "Gossamer Robe",
        "Drakehide Breastplate",
    ],
    HANDS=[
        "Kevlar Gauntlets",
        "Shade Gauntlets",
        "Leather Gauntlets",
        "Power Gauntlets",
        "Plate Gauntlets",
        "Reactive Gauntlets",
        "Cotton Gloves",
        "Chain Gauntlets",
        "Phase Gloves",
        "Ironsilk Gloves",
        "Gossamer Gloves",
        "Drakehide Gauntlets",
    ],
    LEGS=[
        "Kevlar Leggings",
        "Shade Leggings",
        "Leather Leggings",
        "Power Leggings",
        "Plate Greaves",
        "Reactive Greaves",
        "Cotton Pants",
        "Chain Greaves",
        "Phase Pants",
        "Ironsilk Pants",
        "Gossamer Pants",
        "Drakehide Leggings",
    ],
    FEET=[
        "Kevlar Boots",
        "Shade Boots",
        "Leather Boots",
        "Power Boots",
        "Plate Sabatons",
        "Reactive Sabatons",
        "Cotton Shoes",
        "Chain Sabatons",
        "Phase Shoes",
        "Ironsilk Shoes",
        "Gossamer Shoes",
        "Drakehide Boots",
    ],
)
