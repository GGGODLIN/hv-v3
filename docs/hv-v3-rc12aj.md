# hv-v3 rc12aj（進行中；不打 tag、不部署）

## 面板 hi 低估 1 點（已修）
### 已驗證
- **案例**：rc12af-estprobe，bulwark seed 123，F55 首領戰 T6。面板 hi 351，實際受傷 352 = 首領 28（被格擋）+ 反傷 130 + 小怪 194。
- **根因**：首領的 `sig` 是 thorns，`sigPending` 為真，尖刺盾在這一回合中才展開。玩家的反擊打在剛展開的盾上，吃了反傷。`extra9` 只計入回合開始時已經展開的盾，所以漏算了反傷。不是捨入誤差：實際 352 = 舊 hi 351 − 漏算部分 + 反傷 130。
- **修正**（`thornPending12aj`，自訂，非數值）：場上有 thorns 首領且 `sigPending`、盾還沒展開時，hi 加上 ⌈maxHp × reflectCapHp⌉，這場是 130。`hiRound12ag` 和 `roundRange12ad` 的 hi 都改成 ceil。只影響面板，★、建議和 sim 都不變。
- **回歸測試**：`tests/rc12aj-overhi.test.ts`，fixture 是 `tests/fixtures/rc12aj-bw-f55t6.json`。

### probe（128 seeds，env -i，hint/alloc/MERCHTHR=8）
- over-hi：BUYPOT=0 和 10 兩組，四派都是 0。各組回合數和修正前相同。
- defprobe：實際 HP 低於 A 的比例四派都是 0%。
- 驗收 sim：四派輸出和 cp9-rc12ai 逐行相同。樓層中位 71/73/75/73。

### 面板 hi 平均值，修正前 → 修正後
| 派 | BUYPOT=0 | BUYPOT=10 |
|---|---|---|
| blade | 464.4 → 464.6（+0.2） | 471.7 → 471.9（+0.2） |
| bulwark | 440.5 → 444.3（+3.8） | 471.0 → 474.9（+3.9） |
| oc | 436.4 → 440.1（+3.8） | 483.8 → 487.8（+3.9） |
| arcane | 503.0 → 504.8（+1.8） | 525.7 → 527.5（+1.8） |

### 推測
- 平均只多幾點，但遇到 thorns 首領「即將展開盾」的回合，hi 每次會多約 10% maxHp，那幾回合面板會明顯偏高。
