# hv-v3 rc12q 準備（CANDIDATE，本機；未 tag、未 serve）

數值來源僅限 findings 001–005、constants.ts、monsters.json；新數值皆為 自訂。

## Part 2：QA rc12o 回放對不上（bl1 F65 實際 32 回合 vs 回放 8；bl2 F55 22 vs 11）

工具：`scripts/rc12q-appreplay.ts save.json runId K [fromF] [toF]` — 用真正的 `App`（Object.create(App.prototype)＋stub stage/localStorage），每回合按 ★（`primaryKey` → `command`），同快照也跑 `fight()` 對照。

### 已驗證
- **遊戲路徑 = sim 路徑**：rc12o 程式碼（2583a4e）上，App ★ 回放與 `fight()` 每個 seed 的回合數與用藥完全一致（bl1 F55 種子0=3／中位6、F60 8/9、F65 12/9、F70 6/27；bl2 F55 12/12，各 16 seeds）。
- **遭遇完全重現**：run.rng 有存檔，敵人組成一致（bl1 F65 王 狂戰鐵壁・塔主・風尾甲蟲 HP 33905＋炎鬃星靈、風鐵術士；bl2 F55 冰霜尖刺・守門者・雷棘飛龍 HP 22158；F70 小怪雷尾鴉與 QA 截圖相符）。
- **沒有殘留效果帶入**：快照 pdot=None、無冷卻/減益欄位；只帶入 hp/oc/藥水（bl1 F65 802/60/8；bl2 F55 549/25/5）。
- **QA 只按 ★**（bl1 D40 A11 E8 Z5；bl2 D36 A9 Z3 E2），與回放策略相同。
- **戰鬥 rng 沒存檔**：`app.ts:116` 用 `new Rng(randomSeed())`，所以單一回放 seed 不可能等於實際那一場。
- **差距是戰鬥 rng 變異**（rc12o 程式碼，256 seeds）：bl1 F65 中位 9，≥22 回合 14.1%、≥30 4.7%、≥32 2.3% → 實際 32 是約 2% 的尾巴；bl2 F55 中位 13，≥22 回合 21.9% → 實際 22 並不罕見。
- 回放必須在 QA 那個 build（2583a4e）跑；同樣 256 seeds 在 rc12p 程式碼上：bl1 F55 7、F60 11、F65 17（≥32 14.5%）、F70 11；bl2 F55 17（rc12p 把 F60–65 拉長、F70 縮短）。先前「8 / 11」是單一 seed＋不同程式碼的數字。

### 推測
- bl1 F65 的 32 回合是真的運氣差（約 1/40），不是 bug；若要讓 QA 回放可重現，需要把戰鬥 rng seed 存進快照（未做，會改存檔格式）。
- rc12p 上 bl1 F65 長戰（≥32）機率約 14.5%，QA 在 rc12p 可能更常看到 30+ 回合王戰。

## Part 1：blade 雙峰分布

工具：`scripts/rc12q-bladediag.ts [K] [cap]`（每局：層數、死因、精英數、休息點、buff、王戰回合、藥水）。

### 已驗證（rc12p，128 seeds）
- 分布：F40–49 25、F50–59 35、F60–69 24、F70–99 7、F100 34（26.6%）；死亡中位 53；<F50 21.9%。
- F40 時的狀態幾乎無法區分兩群：藥水、精英數、裝備分數、等級都差不多；blade 套裝 B1–B8 到 F40 幾乎人人湊齊。
- **真正的分水嶺是 Boss 給的傳說 OC buff**：F40 前拿到 O8 無盡戰意 → F100 49%（沒拿 8%）；O9 王者氣魄 40% vs 17%；O3 64% vs 23%。傳說只出自 Boss 獎勵（15% 權重）。通關群最終 100% 湊成 oc 套、100% bulwark 套；早死群 oc 65%、bulwark 8%。
- 早死群死因多為一般戰（34/52），F30–50 王戰平均 7.2 回合（通關群 4.6），王戰用藥更多（3.5 vs 2.3）＝中段消耗戰。

### 修正（單一旗標 `RUN12Q`，預設 OFF，只影響 lean=blade）
- `legend` 0.1（自訂）：blade 的 Boss 獎勵傳說權重 ×0.1 → 砍掉滾雪球。
- `mobFrom` 50（自訂）：blade 一般怪壓力曲線從 F50 才開始爬（原 F30），F100 終值不變 → 減少中段消耗戰。
- `bossHp`（預設 1，未使用）：blade F30–65 王 HP ×。
- 結果（128 seeds）：F100 26.6% → **16.4%**、死亡中位 53 → **60**、<F50 21.9% → 1.6%、F50–75 46% → 78%；王戰 F30+ 中位 8、P90 23。
- 其他掃描：legend 0／mobFrom 50 = 13.3%/60；legend 0.3 單獨 = 18.8%/53（中位不夠）；mobFrom 50 單獨 = 50.8%/61（F100 爆）。兩者要一起。
- OFF = rc12p：blade 32 seeds 輸出 md5 與未改程式碼相同；oc/arcane/bulwark 開/關輸出 md5 相同（程式只在 lean=blade 生效）。

### 啟用需要什麼
- sim：`SIM_RUN12Q=1`（可再用 `SIM_R12Q_LEGEND`、`SIM_R12Q_MOBFROM`、`SIM_R12Q_BOSSHP` 覆寫）。
- 遊戲（瀏覽器沒有 env）：把 `src/core/cp8.ts` 的 `RUN12Q.on` 預設從 `?? 0` 改成 `?? 1`，並把 `tests/rc12q-flag.test.ts` 改成預期開啟；需重跑全套 vitest 與 128-seed 四系驗收。

### 推測
- legend 0.1 會讓玩家感覺 blade「幾乎拿不到傳說」，可能需要 UI 說明或改成「blade 湊齊本系後傳說只出本系」之類較自然的規則。
- mobFrom 50 讓 F30–50 對 blade 明顯變輕鬆，QA 可能回報中段無壓力。
