# hv-v3 rc12g

## 變更
- 自動換裝/★：依流派鎖武器類型（keepsWeaponType12g、leanAllows）；arcane 不會把法杖換成非法杖，磐石不會失去盾。每次換武器寫入 log「自動換武器：A → B」。
- 法杖：Coalesced Mana／Ether Tap 的觸發與 log（魔力合流 / 以太分流）。目標被合流、MP<50%、且付得起完整法術費用時，A 改成 Arcane Blow。
- Boss 單擊上限：無標籤普攻 ≤ 40% maxHP（自訂）；蓄力後 D 由 bossBurst 0.5 限制。
- 深層曲線 F40+（自訂）：依流派設定 k 值：blade 4、bulwark 7、oc 0、arcane 0。流派由 lean 決定，沒有 lean 時依主手武器判斷。
- 磐石無盾時：震盪、厚皮、不滅降權並標示部分無效；震盪的盾擊暈標示無效（自訂；原作 Shield Bash 不需盾，見 findings 002:596）。

## Arcane 審計（已驗證）
- 法術 baseCost 6 與 Spells.md 一致；各 tier 的傷害倍率在原作資料中缺漏（findings 002:582），所以沒有改。
- MDB：原作的 Staff_Prof_MDB 要有 Staff Spell Damage 天賦才有。本作沒有天賦系統，近戰的 prof ADB 也簡化為 ×1，所以法杖少了這一項不算偏離原作。熟練度貢獻很小，不是主因。沒有回改任何東西。
- 3× 的原因（F40 boss HP 8350，快照探針）：arcane 中位 17–19 回合，每回合約 600 傷害，約 35% 回合沒有輸出（3.6 次喝藥、3.2 次防禦）。blade 中位 6 回合，greatCleave 一發 12726，加上 rendingBlow 4029、shatterStrike 2584。

## oc2 boss 單擊 43%/42%
- 推測原因：adb 上限是用 refHp9 算的，不是實際 maxHP；暴擊 ×1.2 後約 492，而有其他怪在蓄力時，每回合預算是 50%，所以放行。另一種可能是 QA 把整回合的傷害加總了。
- 已加入以實際 maxHP 為準的單擊上限。用 300 個 seed 跑探針無法重現；最壞的普攻是 16%。

## 模擬（每格 64 runs：floor 中位 / F100 比率 / F30+ boss 回合中位）
| kind route | blade | oc | arcane | bulwark | gap |
|---|---|---|---|---|---|
| preset battle | 45/0.00/7.0 | 30/0.02/14.3 | 35/0.00/10.7 | 45/0.00/17.0 | 15 |
| preset hint | 66/0.06/11.7 | 52/0.31/16.7 | 92/0.47/14.7 | 68/0.02/40.0 | 40 |
| std hint | 65/0.29/13.0 | 88/0.52/22.3 | 100/0.80/15.0 | 58/0.00/31.3 | 42 |

未達成：hint 路線的流派差距 >15，因為「arcane/oc 不可變難」與差距 ≤15 衝突；磐石 B30 約 40。
