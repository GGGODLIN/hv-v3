import json
from typing import Any
import datetime
from server.lib.db import init_db
from itertools import batched
import urllib
import myutils

from myutils import flatten
from pathlib import Path
from math import floor
from tqdm import tqdm
import httpx
import pyjson5
import asyncio

DATA_DIR = (Path(__file__) / ".." / ".." / ".." / ".." / "data").resolve()

POSTOKEN = "tk158as7wnwv4j21jty"
MMTOKEN = "0hcs6t0ams2"


async def main():
    parsed = await fetch()
    debug(parsed)
    meta = auction(parsed)
    await check_mm(parsed, meta)


async def check_mm(parsed, meta):
    REM_FILE = DATA_DIR / "tmp_upgrade" / "rem"

    rem = set(x.strip() for x in REM_FILE.read_text().splitlines() if x.strip())

    for code in rem:
        eid = meta[code]["eids"][0]
        key = parsed[str(eid)]["key"]
        up = httpx.get(f"https://hvdata.gisadan.dev/equip?eid={eid}&key={key}").json()

        if up["owner"]["name"] != "MoogleMail":
            print(code, up["owner"]["name"])

        await asyncio.sleep(1)

    # for idx, code in enumerate(meta):
    #     eid = meta[code]["eids"][0]
    #     key = parsed[str(eid)]["key"]
    #     up = httpx.get(f"https://hvdata.gisadan.dev/equip?eid={eid}&key={key}").json()

    #     if up["owner"]["name"] == "프레이":
    #         print(code, eid, key)
    #         await asyncio.sleep(1)

    #     if idx % 32 == 0:
    #         print(idx, "/", len(meta))


def debug(parsed: dict):
    DEBUG_FILE = DATA_DIR / "tmp_upgrade" / "myequips.txt"

    def sort_key(eid):
        x = parsed[eid]
        name_parts = parse_equip_name(x["name"])

        norms = ["Onyx", "Ruby", "Jade", "Zircon", "Cobalt", "Amber"]
        rares = set(
            [
                *[
                    (p, s)
                    for s in [
                        "Heaven-sent",
                        "Demon-fiend",
                        "Elementalist",
                    ]
                    for p in ["Charged", "Mystic", "Radiant", "Frugal"]
                ]
            ]
        )
        weps = set(
            [
                *[
                    (p, w, s)
                    for w in ["Willow Staff"]
                    for p in ["Fiery", "Arctic", "Tempestuous", "Shocking", "Demonic"]
                    for s in [
                        "Destruction",
                        "Focus",
                    ]
                ],
                *[
                    (p, w, s)
                    for w in ["Oak Staff"]
                    for p in ["Hallowed"]
                    for s in [
                        "Focus",
                        "Heimdall",
                        "Destruction",
                    ]
                ],
            ]
        )
        if (
            name_parts["prefix"],
            name_parts["weapon_type"],
            name_parts["suffix"],
        ) in weps:
            return (
                name_parts["tier"] or "",
                name_parts["weapon_type"] or "",
                name_parts["prefix"] or "",
                name_parts["suffix"] or "",
                -x["calculations"]["fusion"]["average_stat"],
                eid or "",
            )
        elif not (
            name_parts["prefix"] in norms
            or (name_parts["prefix"], name_parts["suffix"]) not in rares
        ):
            return (
                name_parts["tier"] or "",
                name_parts["armor_type"] or "",
                name_parts["prefix"] or "",
                name_parts["suffix"] or "",
                name_parts["slot_type"] or "",
                name_parts["weapon_type"] or "",
                -x["calculations"]["fusion"]["average_stat"],
                eid or "",
            )
        else:
            return (
                name_parts["tier"] or "",
                name_parts["armor_type"] or "",
                name_parts["slot_type"] or "",
                name_parts["weapon_type"] or "",
                -x["calculations"]["fusion"]["average_stat"],
                eid or "",
            )

    eids = [eid for eid in parsed if isinstance(parsed[eid].get("level"), int)]
    eids_sorted = sorted(eids, key=sort_key)

    lines = []
    for eid in eids_sorted:
        x = parsed[eid]

        name = x["name"].replace("Legendary", "L.")

        avg = floor(x["calculations"]["fusion"]["average_stat"])
        lines.append(
            # f"[{x['key'][:4]}] (avg: {floor(avg)}, start: 50k, 0 bids) [url={_to_url(eid, x['key'])}]{name}[/url]"
            f"""
{"["}{eid}, "{avg} {name} {_to_url(eid, x['key'])}"{"]"},
            """.strip()
        )

    DEBUG_FILE.write_text("\n".join(lines))


def auction(parsed: dict):
    AUCTION_FILE = DATA_DIR / "tmp_upgrade" / "auction"
    BIDS_CONFIRM_FILE = DATA_DIR / "tmp_upgrade" / "auction_confirm"
    WINNERS_FILE = DATA_DIR / "tmp_upgrade" / "winners_mm"
    WINNERS_ITEM_FILE = DATA_DIR / "tmp_upgrade" / "items_mm"
    REM_FILE = DATA_DIR / "tmp_upgrade" / "rem"

    rem = set(x.strip() for x in REM_FILE.read_text().splitlines() if x.strip())

    config = pyjson5.loads(
        (DATA_DIR / "tmp_upgrade" / "auction_config.json").read_text()
    )

    bids = pyjson5.loads((DATA_DIR / "tmp_upgrade" / "auction_bids").read_text())
    bids_by_code = dict()
    for user, code_value in bids.items():
        for code, value in code_value.items():
            value = int(value.replace("_", ""))
            bids_by_code.setdefault(code, []).append((user, value))
    confirms_by_code = dict()

    seen = set()

    def see(eid: str):
        eid = str(eid)
        if eid not in seen:
            seen.add(eid)
        else:
            raise Exception(eid)

        eq = parsed[eid]
        if not eq["is_tradeable"]:
            raise Exception(eid)

        if eq["upgrade_tiers"] and eq["upgrade_tiers"][0] > 0:
            raise Exception(eid)

    bid_codes_rem = set(bids_by_code.keys())

    def see_bid(code: str, name):
        if code in bid_codes_rem:
            bid_codes_rem.remove(code)

        confirms_by_code[code] = name

    db = init_db()
    aid = "genie_1"
    end_time = datetime.datetime(2026, 8, 5, tzinfo=datetime.timezone.utc).timestamp()
    db.execute(
        """
        INSERT OR REPLACE INTO misc_auctions (
            id, type, type_value, title, end_time, last_fetch_time
        ) VALUES (
            :id, :type, :type_value, :title, :end_time, :last_fetch_time
        )
        """,
        dict(
            id=aid,
            type="genie",
            type_value=1,
            title="???",
            end_time=end_time,
            last_fetch_time=end_time,
        ),
    )

    total = [0, 0, 0]
    lines = []
    wins = dict()
    meta = dict()
    for cat in config:
        if cat["cat"]:
            lines.append("\n\n\n\n")
            lines.append(f"[b][u][size=3]{cat['cat']}[/size][/u][/b]")
            lines.append("")

        for it in cat["items"]:
            if len(it) == 0:
                lines.append("")
                continue
            elif not any(isinstance(x, list) for x in it):
                eid = it[0]
                eq = parsed[str(eid)]
                name = eq["name"].replace("Legendary", "L.")
                avg = str(floor(eq["calculations"]["fusion"]["average_stat"]))
                code = eq["key"][:4]
                other = []

                if eq["level"] < 500:
                    other.append(f"Lv{eq['level']}")
                if "HP Bonus" in eq["stats"]["misc"]:
                    other.append(
                        f"Jugg {eq["stats"]["misc"]['HP Bonus']['value'] / 2:.0f}"
                    )
                if "MP Bonus" in eq["stats"]["misc"]:
                    other.append(
                        f"Cap {eq["stats"]["misc"]['MP Bonus']['value'] / 2:.0f}"
                    )

                see_bid(
                    code,
                    f"(avg: {str(floor(eq["calculations"]["fusion"]["average_stat"]))}) {name.replace("Peerless", "P.")}",
                )

                avg_str = f"avg: {avg}"
                avg_other = avg_str
                if other:
                    avg_other += ", " + ", ".join(other)

                # [3afe] (avg: 187, start: 50k, 0 bids) [url=https://hentaiverse.org/equip/279367207/3afef3c275]L. Demonic Axe of the Vampire[/url]
                lines.append(
                    f"[{code}] ({avg_other}, start: 50k, {len(bids_by_code.get(code, []))} bids) [url={_to_url(eid, eq['key'])}]{name}[/url]"
                )
                meta[code] = dict(
                    code=code,
                    n=len(bids_by_code.get(code, [])),
                    name=name,
                    stats=[avg_str] + other,
                    stats_name=f"({avg_other}) {name}",
                    eids=[str(eid)],
                )

                see(eid)
            else:
                code = it[0]
                name = it[1]
                eqs = [parsed[str(x[0])] for x in it[2:]]
                min_avg = min(
                    eq["calculations"]["fusion"]["average_stat"] for eq in eqs
                )
                max_avg = max(
                    eq["calculations"]["fusion"]["average_stat"] for eq in eqs
                )

                links = [
                    f"[url={_to_url(eq['eid'], eq['key'])}][{idx+1}][/url]"
                    for idx, eq in enumerate(eqs)
                ]

                see_bid(code, name)

                lines.append(
                    f"[{code}] (avg: {floor(min_avg)}~{floor(max_avg)}, start: 50k, {len(bids_by_code.get(code, []))} bids) {name} {" ".join(links)}"
                )

                [see(eq["eid"]) for eq in eqs]

                meta[code] = dict(
                    code=code,
                    n=len(bids_by_code.get(code, [])),
                    name=name,
                    stats_name=f"(avg: {floor(min_avg)}~{floor(max_avg)}) {name}",
                    eids=[str(eq["eid"]) for eq in eqs],
                )

            bids_by_code.setdefault(code, []).sort(key=lambda user_value: user_value[1])
            item_bids = bids_by_code[code]

            def swap():
                item_bids[-1], item_bids[-2] = item_bids[-2], item_bids[-1]

            if code == "ab9a":
                swap()
            elif code == "bde9":
                swap()
            elif code == "1833":
                swap()
            elif code == "b764":
                pass
            elif code == "5495":
                pass
            elif code == "08b3":
                pass

            if item_bids:
                wins.setdefault(item_bids[-1][0], dict())[code] = dict(
                    code=code,
                    name=name,
                    bid=item_bids[-1][1],
                    price=item_bids[-2][1] if len(item_bids) > 1 else 50_000,
                    price_user=item_bids[-2][0] if len(item_bids) > 1 else None,
                )

            if item_bids:
                if code in rem and False:
                    lines.append(f">>>> {'???':>10} - {item_bids[-1][0]}")
                    if len(item_bids) > 1:
                        lines.append(f">>>> (bid reveal pending MM)")
                else:
                    for idx, (user, value) in enumerate(reversed(item_bids)):
                        value_str = format(value, ",")
                        if idx == 0:
                            # lines.append(f">>>> {value_str:>10} - {user}")
                            lines.append(f">>>> {'???':>10} - {user}")
                        else:
                            lines.append(f">>>> {value_str:>10} - {user}")
            else:
                lines.append(">>>> (no bids)")

            price = (
                item_bids[-2][1]
                if len(item_bids) > 1
                else 50_000 if len(item_bids) > 0 else 0
            )

            total[0] += item_bids[0][1] if item_bids else 0
            total[1] += price
            total[2] += item_bids[-1][1] if item_bids else 0

            m: dict[str, Any] = meta[code]
            if len(m["eids"]) == 1:
                m["eids"][0]
                eq = parsed[str(eid)]
                db.execute(
                    """
                    INSERT OR REPLACE INTO misc_equips (
                        id, id_auction,
                        name, eid, key, is_isekai, level, stats,
                        price, start_bid, buyer, seller
                    ) VALUES (
                        :id, :id_auction,
                        :name, :eid, :key, :is_isekai, :level, :stats,
                        :price, :start_bid, :buyer, :seller
                    )
                    """,
                    dict(
                        id=code,
                        id_auction=aid,
                        name=m["name"]
                        .replace("L.", "Legendary")
                        .replace("P.", "Peerless"),
                        eid=eid,
                        key=eq["key"],
                        is_isekai=False,
                        level=eq["level"],
                        stats=json.dumps(m["stats"]),
                        price=price,
                        start_bid=50_000,
                        buyer=item_bids[-1][0] if item_bids else None,
                        seller="프레이",
                    ),
                )

    db.commit()

    if len(bid_codes_rem) > 0:
        raise Exception(str(bid_codes_rem))

    confirm_lines = []
    for user, code_value in reversed(bids.items()):
        confirm_lines.append("\n" + user + ":\n=" + "".join(["="] * len(user)))
        for code, value in reversed(code_value.items()):
            confirm_lines.append(f"[{code}] {confirms_by_code[code]}")
            confirm_lines.append(
                f"{" " + str(value):>>15} ({len(bids_by_code[code]) -1} other bids)\n"
            )
    BIDS_CONFIRM_FILE.write_text("\n".join(confirm_lines))

    AUCTION_FILE.write_text("\n".join(lines))

    ####

    w_lines = []
    i_lines = []

    for user, items in wins.items():
        user_bids = bids[user]

        wins = [code for code in user_bids if code in items]
        losses = [code for code in user_bids if code not in items]

        w_lines.append(user)
        i_lines.append("\n\n" + user + "\n")

        body = []
        body.append("Winning bids:")
        for code in wins:
            x = items[code]
            y = meta[code]
            body.append(f"\n> [{x['code']}] {y['stats_name']}")
            body.append(f">>> Your bid: {x['bid']:,}")
            if x["price_user"]:
                body.append(
                    f">>> Next bid: {x['price']:,} by {x['price_user']} ({len(bids_by_code[code])} total bids)"
                )
            else:
                body.append(f">>> Start bid: {x['price']}")

        if losses:
            body.append("\n\n========\n\nNon-winning bids:")
            for code in losses:
                x = meta[code]
                body.append(f"\n> [{x['code']}] {x['stats_name']}")
                body.append(
                    f">>> {int(user_bids[code]):,}, {len(bids_by_code[code])} total bids"
                )

        w_lines.append(
            f"""
(async () => {{
    await fetch("https://hentaiverse.org/?s=Bazaar&ss=mm&filter=new", {{
        "credentials": "include",
        "headers": {{
            "Content-Type": "application/x-www-form-urlencoded",
        }},
        "referrer": "https://hentaiverse.org/?s=Bazaar&ss=mm&filter=new",
        "body": "mmtoken={MMTOKEN}&action=attach_cod&action_value=0&select_item=0&select_count=0&select_pane=0&message_to_name={urllib.parse.quote_plus(user)}&message_subject=Auction Results&message_body={urllib.parse.quote_plus("\n".join(body))}",
        "method": "POST",
        "mode": "cors"
    }});
    window.location.href = window.location.href;
}})()
            """.strip().replace(
                "\n", ""
            )
        )

        eids_win = flatten([meta[code]["eids"] for code in wins])
        eid_param = "".join([f"&eqids%5B%5D={eid}" for eid in eids_win])
        i_lines.append(
            f"""
(async () => {{
    await fetch("https://hentaiverse.org/?s=Bazaar&ss=am&screen=organize&filter=armor_cloth", {{
        "credentials": "include",
        "headers": {{
            "Content-Type": "application/x-www-form-urlencoded",
        }},
        "body": "postoken={POSTOKEN}{eid_param}&set_pinned=-1&set_stored=-1&set_locked=-1",
        "method": "POST",
    }});
}})()
            """.strip().replace(
                "\n", " "
            )
        )

        for code in wins:
            x = items[code]
            y = meta[code]
            if len(y["eids"]) > 1:
                i_lines.append("x")

            body = []
            body.append(f"[{x['code']}] {y['stats_name']}")
            body.append(f"\nYour bid: {x['bid']:,}")
            if x["price_user"]:
                body.append(
                    f"Next bid: {x['price']:,} by {x['price_user']} ({len(bids_by_code[code])} total bids)"
                )
            else:
                body.append(f"Start bid: {x['price']}")

            body.append(f"\nFull list of bids will be posted in auction thread later.")
            body.append(f"https://forums.e-hentai.org/index.php?showtopic=298837")

            body.append(f"\nThanks for participating!")

            def attach_eid(eid):
                return f"""
                await fetch("https://hentaiverse.org/?s=Bazaar&ss=mm&filter=new", {{
                    credentials: "include",
                    headers: {{
                        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5",
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Upgrade-Insecure-Requests": "1",
                        "Sec-Fetch-Dest": "document",
                        "Sec-Fetch-Mode": "navigate",
                        "Sec-Fetch-Site": "same-origin",
                        "Sec-Fetch-User": "?1",
                        Priority: "u=0, i",
                    }},
                    referrer: "https://hentaiverse.org/?s=Bazaar&ss=mm&filter=new",
                    body: "mmtoken=66lh8kdams0&action=attach_add&action_value=0&select_item={eid}&select_count=1&select_pane=equip&message_to_name=tmp&message_subject=tmp&message_body=tmp",
                    method: "POST",
                    mode: "cors",
                }});
                """

            for batch in batched(y["eids"], 10):
                cod = len(batch) * x["price"] / len(y["eids"])
                i_lines.append(
                    f"""
{"\n".join([attach_eid(eid) for eid in batch])}
(async () => {{
    await fetch("https://hentaiverse.org/?s=Bazaar&ss=mm&filter=new", {{
        "credentials": "include",
        "headers": {{
            "Content-Type": "application/x-www-form-urlencoded",
        }},
        "referrer": "https://hentaiverse.org/?s=Bazaar&ss=mm&filter=new",
        "body": "mmtoken={MMTOKEN}&action=attach_cod&action_value={cod}&select_count=0&select_pane=0&message_to_name={urllib.parse.quote_plus(user)}&message_subject=Auction+Item&message_body={urllib.parse.quote_plus("\n".join(body))}",
        "method": "POST",
        "mode": "cors"
    }});
    window.location.href = 'https://hentaiverse.org/?s=Bazaar&ss=mm&filter=new&hvut=disabled';
}})()
                        """.strip().replace(
                        "\n", ""
                    )
                )

    WINNERS_FILE.write_text("\n".join(w_lines))
    WINNERS_ITEM_FILE.write_text("\n".join(i_lines))

    ###

    # for cat in config:
    #     if cat["cat"]:
    #         lines.append("")
    #         lines.append(f"[b][u][size=3]{cat['cat']}[/size][/u][/b]")
    #         lines.append("")

    #     for it in cat["items"]:
    #         if len(it) == 0:
    #             lines.append("")
    #             continue
    #         elif not any(isinstance(x, list) for x in it):
    #             eid = it[0]
    #             eq = parsed[str(eid)]
    #             name = eq["name"].replace("Legendary", "L.")
    #             avg = str(floor(eq["calculations"]["fusion"]["average_stat"]))
    #             code = eq["key"][:4]
    #             other = []

    #             if eq["level"] < 500:
    #                 other.append(f"Lv{eq['level']}")
    #             if "HP Bonus" in eq["stats"]["misc"]:
    #                 other.append(
    #                     f"Jugg {eq["stats"]["misc"]['HP Bonus']['value'] / 2:.0f}"
    #                 )
    #             if "MP Bonus" in eq["stats"]["misc"]:
    #                 other.append(
    #                     f"Cap {eq["stats"]["misc"]['MP Bonus']['value'] / 2:.0f}"
    #                 )

    #             see_bid(
    #                 code,
    #                 f"(avg: {str(floor(eq["calculations"]["fusion"]["average_stat"]))}) {name.replace("Peerless", "P.")}",
    #             )

    #             avg_other = f"avg: {avg}"
    #             if other:
    #                 avg_other += ", " + ", ".join(other)

    #             # [3afe] (avg: 187, start: 50k, 0 bids) [url=https://hentaiverse.org/equip/279367207/3afef3c275]L. Demonic Axe of the Vampire[/url]
    #             lines.append(
    #                 f"[{code}] ({avg_other}, start: 50k, {len(bids_by_code.get(code, []))} bids) [url={_to_url(eid, eq['key'])}]{name}[/url]"
    #             )

    #             see(eid)
    #         else:
    #             code = it[0]
    #             name = it[1]
    #             eqs = [parsed[str(x[0])] for x in it[2:]]
    #             min_avg = min(
    #                 eq["calculations"]["fusion"]["average_stat"] for eq in eqs
    #             )
    #             max_avg = max(
    #                 eq["calculations"]["fusion"]["average_stat"] for eq in eqs
    #             )

    #             links = [
    #                 f"[url={_to_url(eq['eid'], eq['key'])}][{idx+1}][/url]"
    #                 for idx, eq in enumerate(eqs)
    #             ]

    #             see_bid(code, name)

    #             lines.append(
    #                 f"[{code}] (avg: {floor(min_avg)}~{floor(max_avg)}, start: 50k, {len(bids_by_code.get(code, []))} bids) {name} {" ".join(links)}"
    #             )

    #             [see(eq["eid"]) for eq in eqs]

    print("    ".join([format(x, ",") for x in total]))

    return meta


async def fetch():
    CACHE_FILE = DATA_DIR / "tmp_upgrade" / "myequips.json"
    hvc = pyjson5.loads((DATA_DIR / "tmp_upgrade" / "hvc.json").read_text())

    try:
        parsed = pyjson5.loads(CACHE_FILE.read_text())
    except Exception:
        parsed = dict()

    missing = [eid for eid in hvc if eid not in parsed]
    if missing:
        for idx, eid in enumerate(tqdm(missing)):
            key = hvc[eid]["k"]
            resp = httpx.get(f"https://hvdata.gisadan.dev/equip?eid={eid}&key={key}")
            d = resp.json()

            parsed[eid] = d
            parsed[eid]["eid"] = int(eid)
            parsed[eid]["key"] = key

            if idx % 10 == 0:
                CACHE_FILE.write_text(pyjson5.dumps(parsed))

        CACHE_FILE.write_text(pyjson5.dumps(parsed, indent=2))

    return parsed


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


def _to_url(eid, key):
    return f"https://hentaiverse.org/equip/{eid}/{key}"


def _find(rem: str, opts: list[str], raise_on_missing=False):
    for o in opts:
        if rem.startswith(o.lower()):
            return o, rem[len(o) :].strip()
    else:
        if raise_on_missing:
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
