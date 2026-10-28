# hv-v3 rc12m（自訂）

## Sim calibration
`scripts/rc12m-fullrun.ts` defaults to the QA preset: SIM_ROUTE=hint, SIM_BUFFSTAR=1 (★ buffs via offerStar), SIM_POLICY=primary, SIM_NOPREP=1, SIM_BUYPOT=10, SIM_MERCHTHR=7.
rc12l equivalent: `SIM_RUN12M=0 SIM_POTFLOOR=0`. bulwark: F100 100%, potions left median 27 (QA 15–36), boss turns F30–65 6 / F70+ 7. blade: F100 31% (QA 3/3), so the sim is still harder than QA.

## RUN12M run-wide pressure (all schools, on by default; OC12M removed)
Per-school multipliers in `R12M_BASE` (cp8.ts): drop / chest / elite / rest potion sources, mobHp / mobDmg (linear ramp F30→F100), deepK. The merchant still sells 1 potion. Every monster's single hit is capped at 40% max HP (`SIM_R12M_HIT`). Env override: `SIM_R12M_<KEY>_<SCHOOL>`.

| school | floor med | death med | F100 | boss30 med | F30–65 / F70+ |
|---|---|---|---|---|---|
| arcane | 60 | 55 | 12.5% | 15 | 14 / 18 |
| bulwark | 70.5 | 67 | 12.5% | 8 | 8 / 10 |
| blade | 70 | 70 | 3.1% | 7 | 6 / 25.5 |
| oc | 60 | 55 | 14.1% | 19 | 18 / 22 |
64 seeds per school. Max single hit 0.4, max single turn 0.5.

## Z button cooldown fix
迅捷調和 (itemCd −1) dropped the potion cooldown to 0 inside the same turn. With cp8 on, the health potion cooldown now has a floor of 1 (`SIM_POTFLOOR`), so Z shows 「藥水冷卻中」.
