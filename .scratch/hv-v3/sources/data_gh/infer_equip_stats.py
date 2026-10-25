import re
import loguru

LOGGER = loguru.logger.bind(tags=["equip_parser"])

_TIER_RANGES = dict(
    Crude=(1, 40),
    Fair=(30, 70),
    Average=(60, 100),
    Superior=(90, 130),
    Exquisite=(120, 160),
    Magnificent=(150, 180),
    Legendary=(170, 200),
    Peerless=(200, 200),
    Ultimate=(200, 250),
)


def infer_equip_stats(
    equip: dict,
):
    percentiles = _calc_all_percentiles(equip)
    legendary_percentiles = _calc_all_percentiles(equip, as_legendary=True)
    fusion = _calc_fusion_stats(equip)

    return dict(
        fusion=fusion,
        percentiles=percentiles,
        legendary_percentiles=legendary_percentiles,
    )


@LOGGER.catch(reraise=True)
def _calc_all_percentiles(
    equip: dict,
    as_legendary=False,
):
    percentiles = dict()

    mn, mx = _TIER_RANGES[equip["name_parts"]["tier"]]
    if as_legendary:
        mn, mx = _TIER_RANGES["Legendary"]
    ivl_length = mx - mn

    if equip["weapon_damage"] and equip["weapon_damage"]["Attack Damage"]:
        base = equip["weapon_damage"]["Attack Damage"]["base"]

        if ivl_length > 0:
            percentiles["weapon_damage"] = {"Attack Damage": (base - mn) / ivl_length}
        else:
            percentiles["weapon_damage"] = {"Attack Damage": 1}

    for cat, stats in equip["stats"].items():
        percentiles[cat] = dict()

        for st, d in stats.items():
            if d["base"] == 0:
                continue

            if ivl_length > 0:
                percentiles[cat][st] = (d["base"] - mn) / ivl_length
            else:
                percentiles[cat][st] = 1

    return percentiles


@LOGGER.catch(reraise=True)
def _calc_fusion_stats(equip: dict):
    bases = []

    for cat, stats in equip["stats"].items():
        for st, d in stats.items():
            if d["base"] == 0:
                continue

            bases.append(d["base"])

    if equip["weapon_damage"] and equip["weapon_damage"]["Attack Damage"]:
        bases.append(equip["weapon_damage"]["Attack Damage"]["base"])

    avg = sum(bases) / len(bases)

    max_stat = 250 if equip["name_parts"] == "Peerless" else 200
    rem = max_stat * len(bases) - sum(bases)

    min_cost = None
    max_cost = None
    if equip["name_parts"]["tier"] == "Legendary":
        base_mult = None
        stat_mult = None
        if any(
            re.search(patt, equip["category"])
            for patt in [
                r"One-handed Weapon",
                r"Two-handed Weapon",
            ]
        ):
            base_mult = 15_000
            stat_mult = 20_000
        elif any(
            re.search(patt, equip["name_parts"]["type"])
            for patt in [
                r"Phase",
                r"Shade",
                r"Power",
                r"Force Shield",
            ]
        ):
            base_mult = 15_000
            stat_mult = 100_000
        elif any(
            re.search(patt, equip["name_parts"]["type"])
            for patt in [
                r"Cotton",
                r"Leather",
                r"Plate",
                r"Buckler" r".* Shield",
            ]
        ):
            base_mult = 5_000
            stat_mult = 20_000
        elif any(
            re.search(patt, equip["name_parts"]["type"])
            for patt in [
                r"Staff",
            ]
        ):
            base_mult = 25_000
            stat_mult = 20_000

        if base_mult and stat_mult:
            binding_price = 2000
            binding_cost = rem * 10 * binding_price

            min_state = dict(cost=binding_cost, base=avg)
            while min_state["base"] < 200:
                min_state["cost"] += min_state["base"] * base_mult
                min_state["base"] += 2

            max_state = dict(cost=1.5 * binding_cost, base=avg)
            while max_state["base"] < 200:
                max_state["cost"] += max_state["base"] * base_mult
                max_state["cost"] += len(bases) * stat_mult
                max_state["base"] += 1

            min_cost = min_state["cost"]
            max_cost = max_state["cost"]

    return dict(
        average_stat=avg,
        max_stat=max_stat,
        total_rem=rem,
        num_stats=len(bases),
        min_cost=min_cost,
        max_cost=max_cost,
    )
