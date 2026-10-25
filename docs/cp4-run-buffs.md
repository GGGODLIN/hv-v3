# CP4 局內成長（Run Buffs）設計文件

> 狀態：**製作人已核准（2026-10-25）**，依第 10 節決定實作中。CP4 全部包在 `RULES.cp4RunBuffs`（預設 false）之後；關閉時行為必須與 tag `cp3-pass`（771f9b3）完全相同。文件內**所有數值都是「暫定」**，實作後再用 sim 調整並回寫 docs/design.md。
> 原則：buff 只在「本趟」生效，用**乘數或加值疊在現有變數上**（套在 `runDerived()` 與 `BattleState` 上）。不改 `src/core/data` 裡任何有出處的常數，也不寫入 `Player`（局外）。

## 1. 可修改的變數清單（已在 repo 中確認存在）

| 代號 | 實際程式位置 | 說明 |
|---|---|---|
| ADB / MDB | `Derived.adb` / `Derived.mdb`（player.ts） | 物理／魔法基礎傷害；現有 `run.bonus.dmg` 已經乘在這兩個值上 |
| HP / MP / SP | `Derived.hp/mp/sp`；`run.bonus.hp` | 最大值 |
| ACC | `Derived.physAcc` / `Derived.magAcc` | 命中 |
| CRIT | `Derived.physCrit` / `magCrit` / `critMod` / `spellCritMod` | 暴擊率／暴擊倍率 |
| DEF | `Derived.evade` / `parry` / `block` / `resist` / `physMit` / `magMit` / `specMit[type]` | 防禦類 |
| EDB | `Derived.edb[element]` | 元素傷害加成（battle.ts:179 會用到） |
| MANA | `Derived.manaCons` / `interference` | 法術 MP 消耗（`spellCost()`） |
| CRES | `Derived.counterResist` | 抵抗反制 |
| OC+ | `OC.hitGainMin/Max`（battle.ts:166 `s.oc += rng.int(...)`） | 每次命中增加的 OC，本趟以加值疊上 |
| OCcap | `OC.cap` | OC 上限 |
| OC0 | `BattleState.oc` 開場值；`openingOc()` / `RULES.bossOpenOc` | 開場 OC |
| SPIRIT | `SS.damageBonus`、`SS.spPerTurn`；法術 ×0.75（`spellCost`） | 靈動架勢 |
| FOCUS | `FOC.ocCost`、`FOC.mpRecover` | 專注 |
| CD | `SKILLS[id].cd` / `.oc`；`cooldowns`；`ITEM_CD`、`HEALTH_POTION_CD` | 技能／道具冷卻與 OC 消耗 |
| STATUS | `m.status.stun / bleed / bleedTurns`；`BLEED`、`VSB` | 暈眩與流血 |
| REGEN | `BattleState.regen`（每回合 MP/SP 回復，battle.ts:296） | 戰鬥內回復 |
| LOOT | `RULES.dropAccel`、`LR.equipmentRoll`、`generateEquip(..., qualityBump)`、`loot.potions` | 掉寶 |
| ECON | `RULES.floorCredits`、`RULES.merchantMarkup`、`RULES.potionPrice`、`RULES.restHeal` | 金錢、商店、休息 |

規則：**沒有出現在上表的東西一律不用**。例如原版沒有吸血、反傷、護盾值、移動速度，就不設計這類 buff。

實作方式：新增 `run.buffs: BuffId[]`，加上純函式 `applyBuffs(d, run)`。`runDerived()` 呼叫它，戰鬥常數則由 `battleMods(run)` 傳進 `startBattle()`。原始常數物件保持唯讀。

## 2. 流派（4 個）

| 流派 | 主題 | 核心 buff | 組合效果（同流派持有 ≥3 個時觸發，暫定） |
|---|---|---|---|
| **刃鋒（Blade）** | 普攻、暴擊、命中 | 鋒刃專精（B1） | 「連斬」：暴擊時 OC +5 |
| **奔流（Overcharge）** | OC 累積、技能、靈動架勢 | 戰意湧動（O1） | 「滿溢」：OC 達上限時，下一個技能不耗 OC |
| **秘術（Arcane）** | 法術、元素、MP | 元素共鳴（A1） | 「共振」：連續兩回合施放同元素法術時，第二次 EDB +20 |
| **磐石（Bulwark）** | 防禦、暈眩、流血、續戰 | 不動之盾（W1） | 「反擊架勢」：防禦後下一次攻擊 ×1.3 |

跨流派組合（暫定）：
- **刃鋒＋奔流：** 靈動架勢中暴擊率再 +5%。
- **秘術＋奔流：** 架勢中法術 MP 再 −10%。
- **磐石＋刃鋒：** 要害打擊對暈眩目標的倍率 +0.5。
- **磐石＋秘術：** 冰／雷法術附帶的暈眩 +1 回合。

觸發條件：兩個流派各至少 2 個 buff。

「成形」定義：同一流派持有 ≥3 個 buff，或持有核心 buff 加上另外 1 個同流派 buff。

## 3. Buff 池（40 個：普通 21、稀有 13、傳說 6）

數值全部**暫定**。「+x%」表示乘在該變數上，「+x」表示加值。

### 普通（18）
| ID | 名稱 | 效果 | 變數 | 數值 | 流派 |
|---|---|---|---|---|---|
| B2 | 磨利 | 物理傷害提升 | `adb` | +10% | 刃鋒 |
| B3 | 精準 | 物理命中提升 | `physAcc` | +8% | 刃鋒 |
| B4 | 銳眼 | 物理暴擊率提升 | `physCrit` | +4%（加值） | 刃鋒 |
| B5 | 破甲直覺 | 抵抗反制提升 | `counterResist` | +0.1 | 刃鋒 |
| O2 | 熱血 | 每次命中多得 OC | `OC.hitGainMin/Max` | +2 | 奔流 |
| O3 | 先手氣勢 | 一般戰開場 OC | `BattleState.oc` 開場 | +20 | 奔流 |
| O4 | 韌魂 | 最大 SP 提升 | `sp` | +20% | 奔流 |
| O5 | 收斂心神 | 專注 OC 消耗降低 | `FOC.ocCost` | −25% | 奔流 |
| A2 | 火之印記 | 火焰傷害提升 | `edb.fire` | +15 | 秘術 |
| A3 | 冰之印記 | 冰霜傷害提升 | `edb.cold` | +15 | 秘術 |
| A4 | 雷之印記 | 雷電傷害提升 | `edb.elec` | +15 | 秘術 |
| A5 | 澄心 | 法術命中提升 | `magAcc` | +8% | 秘術 |
| A6 | 魔力池 | 最大 MP 提升 | `mp` | +20% | 秘術 |
| W2 | 厚皮 | 物理減傷提升 | `physMit` | +3（加值） | 磐石 |
| W3 | 靈巧 | 迴避提升 | `evade` | +3（加值） | 磐石 |
| W4 | 活力 | 最大 HP 提升 | `hp`（`run.bonus.hp`） | +12% | 磐石 |
| W7 | 堅守 | 防禦時回復的 HP 增加 | `DEF.hpRecover` | ×1.5 | 磐石 |
| S-might | 力量祝福（原神龕） | 攻擊與法術傷害 | `adb`、`mdb` | +15% | 無（通用） |
| S-vigor | 生命祝福（原神龕） | 最大 HP，取得時回滿 | `hp` | +20% | 無（通用） |
| N1 | 尋寶者 | 裝備掉落提升 | `RULES.dropAccel` | ×1.25 | 無（通用） |
| N2 | 節儉 | 商人價格降低 | `RULES.merchantMarkup`、`potionPrice` | −15% | 無（通用） |

### 稀有（12）
| ID | 名稱 | 效果 | 變數 | 數值 | 流派 |
|---|---|---|---|---|---|
| B1 | **鋒刃專精**（核心） | 物理傷害與暴擊倍率 | `adb`、`critMod` | +12%、+0.25 | 刃鋒 |
| B6 | 弱點洞察 | 攻擊或法術命中「目前目標的弱點」（`m.spec[type] < 0`，即 `isWeak()`）時傷害提高 | 物理 `raw`（`adb`）／法術 `raw`（`mdb`） | ×1.15 | 刃鋒 |
| B7 | 處刑者 | 慈悲一擊冷卻縮短 | `SKILLS.mercifulBlow.cd` | −1 | 刃鋒 |
| O1 | **戰意湧動**（核心） | OC 增量與上限 | `OC.hitGainMin/Max`、`OC.cap` | +3、+50 | 奔流 |
| O6 | 魂燃 | 架勢傷害加成提升 | `SS.damageBonus` | +0.15 | 奔流 |
| O7 | 輕盈架勢 | 架勢每回合 SP 消耗降低 | `SS.spPerTurn` | −30% | 奔流 |
| A1 | **元素共鳴**（核心） | 全元素傷害、法術暴擊 | `edb.*`、`magCrit` | +10、+4% | 秘術 |
| A7 | 節能詠唱 | 法術 MP 消耗降低 | `manaCons` | +0.15（上限 0.5） | 秘術 |
| A8 | 冥想 | 專注回復更多 MP | `FOC.mpRecover` | +50% | 秘術 |
| W1 | **不動之盾**（核心） | 格擋、招架、魔法減傷 | `block`、`parry`、`magMit` | +5、+3、+3 | 磐石 |
| W5 | 撕裂 | 流血加強 | `m.status.bleed`（`BLEED`、`VSB` 結算） | ×1.5 | 磐石 |
| W8 | 震盪 | 盾擊暈眩回合 +1 | `SK.shieldBash.stunTicks` | +1 | 磐石 |
| N3 | 良品嗅覺 | 菁英與寶箱裝備品質 | `generateEquip` 的 `qualityBump` | +1 | 無 |

### 傳說（6）
| ID | 名稱 | 效果 | 變數 | 數值 | 流派 |
|---|---|---|---|---|---|
| B8 | 千刃 | 暴擊率與倍率大幅提升 | `physCrit`、`critMod` | +8%、+0.5 | 刃鋒 |
| O8 | 無盡戰意 | 技能 OC 消耗降低 | `SKILLS.*.oc` | −40% | 奔流 |
| O9 | 王者氣魄 | Boss 戰開場 OC 再提高 | `RULES.bossOpenOc` 疊加 | +50（總計 100） | 奔流 |
| A9 | 大秘儀 | MDB 與法術暴擊倍率 | `mdb`、`spellCritMod` | +25%、+0.5 | 秘術 |
| W6 | 不滅 | HP 與全種類減傷 | `hp`、`specMit.*` | +25%、+5 | 磐石 |
| N4 | 迅捷調和 | 藥水冷卻縮短 | `ITEM_CD`、`HEALTH_POTION_CD` | −1 回合 | 無 |

各流派數量：刃鋒 8、奔流 9、秘術 9、磐石 8、通用 6（含併入的力量祝福、生命祝福）。

## 4. 取得管道與機率（暫定）

| 管道 | 方式 | 普通／稀有／傳說 | 每趟次數（以 10 層、現有節點分布估計） |
|---|---|---|---|
| 祭壇（`shrine` 節點） | 三選一，或改選第 5 節的風險選項 | 70 / 27 / 3 | ≈1.5 |
| 精英（`elite` 擊敗後） | 三選一 | 55 / 38 / 7 | ≈1.5 |
| Boss（F5、F10 擊敗後） | 三選一，保證至少一個稀有以上 | 30 / 55 / 15 | 2（打完整趟） |
| 商人（`merchant`） | 陳列 2 個，用 Credits 購買（**不賣傳說**） | 75 / 25 / 0 | ≈0.5（看金錢） |

價格：普通 120 C、稀有 300 C，乘上 `RULES.merchantMarkup`。

每趟預估取得 **5–6 個**；第一次通關前（第一趟死在 F5–F9）約 2–4 個。

保底與權重：
- 三選一優先放「已持有流派」的 buff（權重 ×2）。
- 持有 2 個同流派 buff、但還沒有該流派核心時，下一次稀有選項必定出現該核心。

以上兩條是為了達成「每趟至少成形一個流派」。

已經解鎖的系統才會出現對應 buff：
- 奔流的架勢類（O1 以外）需要 `has(p,'spirit')`。
- 秘術需要 `spell` 已解鎖。
- 技能類需要 `skill` 已解鎖。

## 5. 祭壇事件：風險與代價（暫定）

現有的 SHRINES（力量祝福、生命祝福、血之賭注）保留。祭壇改為「三選一 buff」或下列其中一個風險選項：

| 選項 | 代價 | 回報 |
|---|---|---|
| 血祭 | 失去 30% 目前 HP（同現有 gamble 的寫法） | 立即得到一個稀有 buff 的三選一 |
| 獻金 | 支付本趟 Credits 的 40% | 一個傳說機率 ×3 的三選一 |
| 詛咒契約 | 本趟 `physMit`／`magMit` −5 | 得到一個傳說 buff（隨機，不能選） |
| 捨棄 | 移除一個已持有的 buff | 重抽：從同稀有度中三選一 |
| 賭運 | 50% 得到普通 buff；50% 下一場戰鬥開場 OC 歸 0，且不受 O3 影響 | 無 |

## 6. 生命週期與既有機制的銜接

- **清空時機：** `startRun()` 時 `run.buffs = []`；`settle()`（返回或死亡）不把任何 buff 寫回 `Player`。存檔只放在 `RunState`，中途讀檔可以繼續。
- **局外數值：** 不碰 `Player.attrs`、裝備、`prog`、`CARRY_MULT`。
- **Boss 戰開場 OC +50：** `openingOc()` 回傳 `RULES.bossOpenOc` 加上 buff 加值。O3 只作用在一般戰；O9 只作用在 Boss 戰，總計上限為 `OC.cap`（受 O1 影響）。門檻 `SPIRIT_MIN_OC=50` 不變。
- **帶回倍率：** buff 不改倍率本身，只透過「打得更深、掉更多」間接提高收入。N1 和 N3 影響的是本趟掉落；帶回時照常乘上 carryMult（5/3/2），所以收入受 buff 間接放大。
  - 需要量測：第一趟帶回 EXP 是否膨脹超過 20%。超過的話，N1 只對裝備生效、不影響 Credits。
- **現有 `run.bonus`：** CP4 開啟時，力量祝福、生命祝福以 buff 形式（S-might、S-vigor）出現在 buff 池。舊存檔的 `run.bonus.dmg/hp` 由 `migrateRun()` 轉成對應數量的 buff（0.15 一個 S-might、0.2 一個 S-vigor），並把 bonus 歸零。CP4 關閉時沿用舊神龕與 `run.bonus`，不轉換。
- **CP3-fix 8 Boss 第二階段：** 階段機制不變。決定 5：CP4 開啟時，Boss 最大 HP 依持有的 buff 數成長，`maxHp × (1 + RULES.cp4BossHpPerBuff × buff 數)`（暫定，玩法層，不改 monsters.json）。目標是持有 5 個 buff 時 Boss 戰仍在 10–15 回合。
- **掉寶類（決定 6）：** N1／N3 只影響裝備掉落與品質，不動 Credits、EXP。

## 7. 驗收指標

1. **成形率：** 每趟結束時（包括死亡），≥90% 的 sim 趟數至少成形一個流派（定義見第 2 節）。第一次通關前的趟數另外列出，目標 ≥70%。
2. **流派平衡：** 每個流派用自己的偏好策略跑 16 種子 × 8 趟。各流派的「首次通關率（8 趟內）」與「第 1–3 趟 F10 勝率」，最高與最低的差距都要 ≤15 個百分點。
3. **不破壞既有指標：** human 第 3 趟後 Lv8–10、Boss F5/F10 打弱點 10–15 回合、不打弱點仍可勝。
4. **使用率：** 每個 buff 在對應流派策略下的被選率 ≥5%（沒有死卡）；任何單一 buff 出現在 >60% 的通關組合中，就視為過強。

## 8. Sim 量測方式

- `auto.ts` 新增策略 `buff:<流派>`：戰鬥沿用 human（打弱點），三選一時依序選本流派核心 → 本流派其他 → 通用 → 其他流派。另外保留 `buff:random` 作為對照。
- RunReport 新增欄位：
  - `buffs: BuffId[]`
  - `formed: School | null`
  - `buffSources: Record<管道, number>`
- `scripts/difficulty.ts` 新增輸出：
  - 每趟平均 buff 數、各管道貢獻
  - 成形率
  - 各流派首次通關率、F10 勝率、差距（max−min）
  - 每個 buff 的被選率
- 指令：`npx tsx scripts/difficulty.ts 16 8 buff:blade,buff:oc,buff:arcane,buff:bulwark,buff:random`
- vitest 斷言：成形率 ≥90%、平衡差距 ≤15pp、既有 CP3 測試全部通過。

## 9. 實作分步計畫（每步各自 commit、push，維持測試全綠）

1. **資料層：** `src/core/buffs.ts` 定義 `BuffDef`（id, zh, rarity, school, mods）與 36 筆資料；`RunState.buffs`；存檔版本 +1 並寫好遷移。測試：資料完整，每個 mod 的鍵都屬於第 1 節清單。
2. **套用層：** `applyBuffs()` 處理 Derived 類變數；`battleMods()` 處理 OC、SS、FOC、CD、STATUS 類。把 `run.bonus` 合併進來。測試：每類各一個 buff 的前後數值。
3. **取得層：** `offerBuffs(run, source, rng)` 依第 4 節機率與保底出選項；接上 shrine、elite、boss、merchant。測試：機率分布（10 萬次抽樣，誤差 ±1%）與保底。
4. **事件層：** 第 5 節的祭壇風險選項。
5. **UI：** 三選一 modal（稀有度顏色、流派標籤、變數「前 → 後」預覽，沿用 IW 預覽的寫法）；戰鬥與地圖顯示已持有的 buff 和成形流派。e2e 加截圖。
6. **Sim 與調參：** 第 8 節的策略與輸出；依第 7 節調整數值，結果寫回 design.md（全部標暫定）。
7. **驗證：** typecheck、test、build、e2e、16 種子 sim，附前後數字。

## 10. 製作人決定（2026-10-25）

1. 組合效果與跨流派效果的觸發規則保留。
2. 磐石補到 8 個（新增 W7 堅守、W8 震盪）。
3. 弱點洞察 = 對目前目標的弱點加傷。
4. 力量／生命祝福併入 buff 池，舊存檔移轉並加測試，sim 重跑。
5. Boss HP 依 buff 數小幅成長（`cp4BossHpPerBuff`，暫定），持有 5 個 buff 時 Boss 戰 10–15 回合。
6. 掉寶類 buff 只影響裝備掉落，不動金幣與 EXP。
7. 商人不賣傳說。
8. 首次通關前維持約 2–4 個。

## 11. 與 main 隔離

- tag `cp3-pass`（annotated）= 771f9b3。main 只能接受它與之後訊息開頭為 `CP3-bugfix` 的純修 bug commit。
- CP4 全部以 `RULES.cp4RunBuffs` 包住，預設 false；網址加 `?cp4` 可開啟試玩。
- 每一步都驗證關閉時：舊測試、e2e 通過；`npx tsx scripts/difficulty.ts 16 8` 輸出與 `docs/cp4-baseline-sim.txt`（771f9b3 輸出）逐字相同（`scripts/cp4-off-check.sh`）。
