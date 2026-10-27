# 場景優先版面：獨立來源操作重播

這是**來源引擎＋JSDOM 控制器重播**，不是瀏覽器遊玩、排版尺寸、實際 Tab／Enter、捲動位置或正式網站驗收。沒有下載或使用待確認的 X 素材。原網站及瀏覽器存檔未動。

## 基線與自然取得

以 `f2007293ec2701e7e18e212f5463fddf327ccb62` 的 v0.30 作基線。腳本先核對該版本六個執行／版面檔和 `CHECKPOINT.json` 的固定 SHA256；本次 engine／loot／session 必須與基線逐 byte 相同，才進行重播。

固定 seed42，新旅程、第一層、均衡策略；每場開始前僅從已擁有裝備選各部位最高屬性評分（同分取後者），預約本次通關後回營。事先限定20場、每場最多1,000個一秒來源 pulse，不追加 seed 或場次。沒有改存檔資源、指定掉落、購買、AP、綁定或 IW 取得加成；沒有出售。

結果：**20場全部通關、237個一秒 pulse**；Lv11、34件背包、0待領、1,520金幣、200碎片、20種子。每個公開動作及 pulse 的完整狀態／戰報均與基線相同，無敗場或截斷。這不是掉率、平衡、勝率或更快通關的證明。未改的合法化來源存檔 SHA256：`b8b18fd04ff985759a2d5d2097ce177df3f4bf3970a5d78e93b2444cab5abec8`。

## 30個語意檢查點

- 新旅程開始、預約／取消通關後回營、實際戰鬥受傷後手動喝1瓶、立即撤退清除預約；另一次完整通關結算後回營，後續 pulse 不重開。
- 分頁 ArrowRight／ArrowLeft／Home／End 事件正確切換焦點與工具，沒有改動遊戲狀態。
- 自然取得的兩件背包裝備各比較3次，包含強制重畫；精確ID焦點保留。三個目前裝備比較保持唯讀。
- 自選出售預覽／取消及 history dismiss 後的過期確認，都沒有出售或改動資源。
- 自然取得的 `loot-27` 精良戰斧：綁定預覽取消不扣款；在**獨立的本機來源模擬分支**明確確認後，只扣報價100碎片，再測 IW 預覽取消／history dismiss／過期確認，種子與同一件武器不變。這不是實際網站投資。
- 真正執行另一件自然武器的換裝後，緊湊的現用武器文字正確更新；完整狀態與舊版換裝相同。
- 原生戰術／篩選 disclosure 開關不改動狀態；展開後策略仍使用既有 handler，清除篩選仍回到可見的 `slot-filter`。
- 唯讀狀態拒絕 Start／Potion／Retreat／Finish，即使直接送出過期 click 事件也不變更進度。

以上各語意檢查點的完整狀態、亂數、動作及觀察到的 storage 呼叫，都與 v0.30 相同；沒有對差異欄位進行正規化或忽略。

## 儲存與模擬邊界

一般重播使用**沒有 Web Locks 的暫時旅程模式**：只追蹤初始偏好寫入，不會自動寫入進度。因此這部分不能證明持久存檔或跨分頁鎖定。

另外明確提供同步模擬的已取得鎖 callback，確認開始／預約／撤退各寫入一次（共3次），儲存的完整進度與目前 state 相同；比較動作不多寫進度。另有**非自然遊玩的 synthetic version999 邊界**：既有原始不支援存檔保持原 bytes，警語可見，開始／撤退後進度寫入仍為0。這是保存防護的來源檢查，不是真實 Web Locks、廣播交接或實體瀏覽器保存驗收。Dialog 的 showModal／close 也採明示 polyfill。

## 可重播檔案

- [完整收據](measurements/scene-first.json)：包含固定取得規程、逐場結果、30個檢查點、基線與本次輸入 SHA256。
- [`scripts/scene-first-measurement.mjs`](../scripts/scene-first-measurement.mjs)：獨立可選驗收，不是遊戲執行所需的相依項。

恢復時另取 exact v0.30 的完整 `dot-game/` 當基線。此可選重播需 Node20以上與**外部已安裝的 JSDOM26.1.0**；不變更遊戲 package、不新增 node_modules，也沒有為本次執行安裝或下載依賴。

```sh
BASELINE_DOT_GAME=/path/to/exact-f2007293/dot-game \
JSDOM_MODULE=/path/to/existing-jsdom-26.1.0/lib/api.js \
node scripts/scene-first-measurement.mjs
```

預設寫回 `docs/measurements/scene-first.json`；可用 `SCENE_FIRST_OUTPUT=/tmp/scene-first.json` 輸出到其他檔案並逐 byte 比對。`BASELINE_DOT_GAME` 必填且雜湊不符立即停止。若不指定 `JSDOM_MODULE`，只嘗試 Node 現有模組解析，不會自動安裝。

任何版面／UI再次修改後都須重跑，不能沿用較早收據宣稱已驗證新輸入。CSS只被雜湊記錄；JSDOM不提供可信排版測量，首屏、窄螢幕與視覺品質仍需另行允許的實際驗收。
