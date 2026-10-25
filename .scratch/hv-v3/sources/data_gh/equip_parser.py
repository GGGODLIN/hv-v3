import re
from typing import cast

import loguru
from bs4 import BeautifulSoup, Tag
import requests
from soupsieve import select_one

from config import paths
from server.lib.parse_equip_name import parse_equip_name
from server.utils.html import (
    get_children,
    get_self_text,
    get_stripped_text,
    search_or_raise,
    select_one_or_raise,
)
from server.utils.misc import load_toml

LOGGER = loguru.logger.bind(tags=["equip_parser"])


def _init_hv_session():
    secrets = load_toml(paths.SECRETS_FILE).value

    session = requests.Session()
    for k, v in secrets["HV_COOKIES"].items():
        session.cookies.set(k, str(v))

    return session


def fetch_equip_html(eid: int, key: str, is_isekai: bool):
    session = _init_hv_session()

    if not is_isekai:
        url = f"https://hentaiverse.org/equip/{eid}/{key}"
    else:
        url = f"https://hentaiverse.org/isekai/equip/{eid}/{key}"

    LOGGER.info(f"Fetching {url}")
    resp = session.get(url)
    LOGGER.info("Fetch complete.")

    return resp


def parse_equip_html(html: str, is_isekai: bool) -> dict:
    soup = BeautifulSoup(html, "lxml")

    name, alt_name = _parse_name(soup, is_isekai=is_isekai)
    try:
        name_parts = parse_equip_name(name)
    except Exception:
        LOGGER.exception(name)
        name_parts = None
    category, level, is_tradeable, tiers = _parse_equip_category(soup)
    status = _parse_status(soup)
    weapon_damage = _parse_weapon_damage(soup)
    misc_stats = _parse_misc_stats(soup)
    cat_stats = _parse_category_stats(soup)
    owner = _parse_owner(soup)

    result = dict(
        name=name,
        name_parts=name_parts,
        alt_name=alt_name,
        category=category,
        level=level,
        is_tradeable=is_tradeable,
        weapon_damage=weapon_damage,
        stats=dict(
            misc=misc_stats,
            **cat_stats,
        ),
        upgrade_tiers=tiers,
        owner=owner,
        **status,
    )

    return result


def _parse_name(doc: BeautifulSoup, is_isekai: bool) -> tuple[str, str | None]:
    fst_el = select_one_or_raise(doc, ".showequip > div")
    name, alt_name = _parse_name_el(fst_el, is_isekai=is_isekai)
    return name, alt_name


def _parse_name_el(el: Tag, is_isekai: bool):
    if is_isekai:
        children = get_children(el)
        assert len(children) in [0, 2]

        if len(children) == 0:
            name = get_stripped_text(el)
            alt_name = None
        else:
            name = get_stripped_text(children[1]).strip("()")
            alt_name = get_stripped_text(children[0])

        return name, alt_name
    else:
        children = get_children(el)
        if len(children) < 2:
            name = get_stripped_text(el)
            alt_name = None
            return name, alt_name
        elif len(children) == 2:
            name = get_stripped_text(children[1]).strip("()")
            alt_name = get_stripped_text(children[0])
            return name, alt_name

        raise Exception(str(el))


def _parse_equip_category(
    soup: BeautifulSoup,
) -> tuple[str, int | str, bool, tuple[int, int, int]]:
    category_el = select_one_or_raise(soup, ".eq > div")

    text = get_self_text(category_el).replace("\xa0", " ").strip()

    if m := re.search(r"(.*?)\s+Level (\d+|Unassigned)", text):
        category, level_raw = m.groups()
        if level_raw == "Unassigned":
            level = "Unassigned"
        else:
            level = int(level_raw)
        tiers = None
    elif m := re.search(r"(.*?)\s+Tier (\d+) / (\d+) / (\d+)", text):
        category, *tiers_raw = m.groups()
        tiers = [int(x) for x in tiers_raw]
        level = "Soulbound"
    else:
        raise Exception(f"Unparseable category {text} {soup.getText()}")

    tradability_el = select_one_or_raise(category_el, "span")
    is_tradable = get_stripped_text(tradability_el) == "Tradeable"

    return category, level, is_tradable, tiers


def _parse_status(soup: BeautifulSoup) -> dict:
    status_el = select_one_or_raise(soup, ".eq > div:nth-child(2)")
    text = status_el.get_text().strip()

    if text == "Salvaged - Repair Required":
        condition = None
        energy = None
    else:
        # Condition: 68%     Energy: 35%
        m = search_or_raise(
            r"Condition: (\d+(?:\.\d+)?)% \s+ Energy: (?:(\d+(?:\.\d+)?)%|(N\/A))",
            text,
        )

        condition = float(m.group(1))

        if m.group(2):
            energy = float(m.group(2))
        else:
            energy = None

    return dict(
        condition=dict(
            current=condition,
            max=100,
        ),
        potency=dict(
            tier=0,
            current_xp=0,
            max_xp=1,
        ),
    )


def _parse_weapon_damage(soup: BeautifulSoup) -> dict | None:
    line_els = soup.select(".eq > div:not(.ex):not(.ep)")[2:]
    if not len(line_els):
        return None

    d: dict = {
        "Attack Damage": None,
        "strikes": [],
        "status_effects": [],
    }

    for el in line_els:
        # +895 Crushing Damage
        m_damage = re.search(r"^\+ (\d+) (.*) Damage$", get_stripped_text(el))
        if m_damage:
            damage_value = int(m_damage.group(1))
            damage_type = m_damage.group(2)

            raw_base = cast(str, el["title"])
            m_base = search_or_raise(r"Base: (\d+(?:\.\d+)?)", raw_base)
            damage_base = float(m_base.group(1))

            d["Attack Damage"] = dict(
                type=damage_type,
                value=damage_value,
                base=damage_base,
            )
            continue

        # Dark Strike + Void Strike
        m_strike = re.search(r"(.*?) Strike(?: \+ (.*) Strike)?", get_stripped_text(el))
        if m_strike:
            d["strikes"].append(m_strike.group(1).strip())

            if m_strike.group(2):
                d["strikes"].append(m_strike.group(2).strip())

            continue

        # Other, eg "Ether Tap: 40% chance - 4 turns"
        d["status_effects"].append(get_stripped_text(el))

    return d


def _parse_misc_stats(soup: BeautifulSoup):
    els = soup.select(".eq > .ex > div")

    stats = dict()
    for el in els:
        # 0 = empty
        # 2 = $name: $value
        # 3 = $name: $value %
        children = el.select("div")
        assert len(children) in [0, 2, 3]
        if not children:
            continue

        if "title" in el.attrs:
            m_base = search_or_raise(
                r"Base: (\d+(?:\.\d+)?)",
                cast(str, el.attrs["title"]),
            )
            base_value = float(m_base.group(1))
        else:
            base_value = 0

        name = get_stripped_text(children[0])
        value = float(get_stripped_text(children[1]).strip("+"))

        stats[name] = dict(
            value=value,
            base=base_value,
        )

    return stats


def _parse_category_stats(soup: BeautifulSoup):
    cat_els = soup.select(".eq > .ep")

    stats = dict()
    for cat_el in cat_els:
        children = get_children(cat_el)
        assert len(children) >= 2

        header_el = children[0]
        assert len(get_children(header_el)) == 0
        cat_name = get_stripped_text(header_el)

        cat_stats = dict()
        for el in children[1:]:
            st = _parse_single_cat_stat(el)
            cat_stats[st["name"]] = dict(
                value=st["value"],
                base=st["base"],
            )

        stats[cat_name] = cat_stats

    return stats


def _parse_single_cat_stat(el: Tag):
    children = get_children(el)
    assert len(children) == 2, children

    if "title" in el.attrs:
        m_base = search_or_raise(
            r"Base: (\d+(?:\.\d+)?)",
            cast(str, el.attrs["title"]),
        )
        base_value = float(m_base.group(1))
    else:
        base_value = 0

    name = get_self_text(children[0])
    value = float(get_stripped_text(children[1]).strip("+"))
    return dict(
        name=name,
        value=value,
        base=base_value,
    )


def _parse_owner(soup: BeautifulSoup):
    # Rewarded as a Clear Bonus to ... on 2025-11-04
    # Current Owner: Equipment Shop

    # Dropped by Ujinao Houjou for ... on 2025-11-04
    # Current Owner: Equipment Shop

    footer_el = select_one_or_raise(soup, ".showequip > div:last-child")

    children = get_children(footer_el)
    # assert len(children) == 2, children

    d = dict(
        name=None,
        uid=None,
        date=None,
        source_name=None,
        source_uid=None,
        source_mob=None,
    )

    for el in children:
        print(el, el.get_text())
        if m := re.search(r"^Dropped by (.*) for", el.get_text().strip()):
            source_el = select_one_or_raise(el, "a")
            d["source_name"] = get_stripped_text(source_el)
            d["source_uid"] = int(
                search_or_raise(
                    r"showuser=(\d+)",
                    source_el["href"],  # type: ignore
                ).group(1)
            )
            d["date"] = el.getText().split()[-1]

            # source_mob_match = re.search(
            #     r"^Dropped by (.*) for$",
            #     el.contents[0].get_text().strip(),
            # )
            # if source_mob_match:
            d["source_mob"] = m.group(1)
        elif m := re.search(r"^Current Owner: (.*)", el.get_text().strip()):
            owner_el = select_one("a", el)
            if owner_el:
                d["name"] = get_stripped_text(owner_el)
                d["uid"] = int(
                    search_or_raise(
                        r"showuser=(\d+)",
                        owner_el["href"],  # type: ignore
                    ).group(1)
                )
            else:
                d["name"] = "Equipment Shop"
                d["uid"] = None

    return d
    return dict(
        name=owner_name,
        uid=owner_uid,
        date=source_date,
        source_name=source_name,
        source_uid=source_uid,
        source_mob=source_mob,
    )
