# hv-v3 cp9-rc12o（全部數值 自訂）

## 校準：rc12n sim（SIM_RUN12O=0，128 seeds/流派）對 rc12n/rc12m 實玩
| 流派 | 實玩死亡/結束中位 | sim deathMed | sim floorMed | sim F100 | sim F30+ boss 中位 | 實玩 potEnd | sim potEnd |
|---|---|---|---|---|---|---|---|
| blade | 70 | 71 | 75 | 7.0% | 6（F70+ 24–26.5） | 0 | 0 |
| bulwark | 62 | 68 | 71 | 15.6% | 8 | 0 | 0 |
| oc | 50 | 56 | 60.5 | 16.4% | 16 | 0 | 0 |
| arcane | 60 | 55 | 60 | 10.9% | 15 | 0 | 0 |
sim 中位都落在 50–70，potEnd 都是 0，跟實玩一致。oc 的 sim 比實玩高約 6–10 層。

## 改動（RUN12O，預設開啟；SIM_RUN12O=0 會完全回到 rc12n）
- `src/core/cp8.ts`：`RUN12O`，含 scatter 0、bossPot 0.3、bossPotFrom 25、bossGear 1、arcHp 1.03。新增鍵 `bossHp70`/`bossDmg70` 和 `boss70()`（F65 以前 ×1，F70 起全額）。`R12O_BASE` 疊在 rc12n 表上面，env `SIM_R12M_<KEY>_<SCHOOL>` 優先：
  - blade：deepK 26（小怪壓力）、bossHp70 0.11
  - bulwark：mobHp/mobDmg 5、deepK 20
  - oc：mobHp/mobDmg 2、deepK 2.2、bossHp 0.5、bossHp70 0.5
  - arcane：mobHp/mobDmg 1.5、bossHp70 0.8
- `src/core/run.ts`：
  - 戰鬥掉落和寶箱的生命藥水機率乘上 scatter（等於 0）。
  - 深淵 boss 擊殺：從 d25 起每隻 boss 給生命藥 0.3 瓶（期望值），保底裝的最低品質再 +1 階（`bossGearQ12o`）。
  - boss HP/攻擊乘上 `boss70`。
  - arcane 在深淵裡 maxHP ≥ 1.03×refHp9(深度)。
- `src/game/app.ts`：每行敵方命中都加上 `[第 N 回合]` 前綴和 `data-hitturn`。沒有測試依賴這個格式或順序。
- 單擊上限 0.4、每回合上限 floor(0.5·maxHP)、bossAtk 上限都沒動。

## 驗收（128 seeds/流派，SIM_BUYPOT=10）
| 流派 | deathMed | floorMed | F100 | F30/40/50/60/70/80/90 boss 中位回合 | 單擊/每回合上限 |
|---|---|---|---|---|---|
| blade | 66 | 68 | 10.2% | 4/6/7/9/14/12/14 | 0.4/0.5 |
| bulwark | 63 | 64 | 3.9% | 5/11/10/11/9/14/16 | 0.4/0.5 |
| oc | 60 | 60 | 14.8% | 6/8/13/16/10/12/17 | 0.4/0.5 |
| arcane | 55 | 55 | 15.6% | 11/14/13/15/11/15/18 | 0.4/0.5 |
流派差 11（≤12），每個深度帶的 boss 中位都 ≤18。藥水總取得（商人+掉落+精英+寶箱）每局 8.4–12.7 瓶，rc12n 是 10.1–16.2 瓶，約少 15–20%。
rc12l 模式（SIM_RUN12M=0 SIM_POTFLOOR=0）跟 rc12n 一樣不受影響，因為 RUN12O 的所有效果都要 RUN12M 開著才會作用。
