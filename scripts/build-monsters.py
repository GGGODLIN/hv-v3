# 怪物池產生器（CP3-D）：public/data/monsters.json 只由公開資料集推導，可重跑驗證。
# 來源：SukkaLab/hv-monster-data 的 persistent.json（https://hv-monsterdb-data.skk.moe/persistent.json，
#       findings/001 第 189 列；快照存於 .scratch/hv-v3/sources/persistent_monsters.json，44,431 筆，findings/005 第 113 列）。
# 規則：只留玩家於 Monster Lab 培育的怪（findings/003 第 25 列）——
#   排除 plvl 0 的系統怪與佔位列、Tenboro 官方怪、Snowflake 的 3 隻龍（findings/003 第 25 列的分類）。
# 欄位：[id, race, name, pl, attack, trainer, piercing, crushing, slashing, cold, wind, elec, fire, dark, holy]
# 用法：python3 -I scripts/build-monsters.py [--check]
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '.scratch/hv-v3/sources/persistent_monsters.json'
OUT = ROOT / 'public/data/monsters.json'
KEYS = ['monsterId', 'monsterClass', 'monsterName', 'plvl', 'attack', 'trainer', 'piercing', 'crushing', 'slashing', 'cold', 'wind', 'elec', 'fire', 'dark', 'holy']
OFFICIAL = {'Tenboro', 'Snowflake'}
rows = [[m[k] for k in KEYS] for m in json.loads(SRC.read_text()) if m['plvl'] > 0 and m['trainer'] not in OFFICIAL]
if '--check' in sys.argv:
  same = json.loads(OUT.read_text()) == rows
  print('monsters.json reproducible from public source:', same, len(rows)); sys.exit(0 if same else 1)
OUT.write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')))
print('wrote', len(rows))
