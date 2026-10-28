# v054 publication verification

## v0.54 已正式發布並驗證（2026-10-28）

正式遊戲：https://gggodlin.github.io/play/hv-v3-dot/

已驗收來源 `9b0832130d92687403da8e1f116cfae858a9b7da` 先完整備份後，正式網站發布 `7bc2b344733ba500429de2a52c3d64d87bbad128`。Pages `40654254739` 成功，21 runtime 加目錄首頁 HTTP 全部位元組一致；僅 5 runtime 更新，隔離候選與其他 4085 檔保留。

正式真瀏覽器沿用原 v036 正常存檔（非候選灌入），自然通關 LV2→3、76→152 金、新刺劍掉落；存檔匯出／重載／再匯出後 hero、inventory、equipment、seed、wins、kills、soulFragments、worldSeeds 八項完全一致。新森林、角色、BOSS 畫面實看，無破圖／水平溢出。詳細證據見 `docs/PUBLICATION-V054.md`；正常桌面驗收不代表極端金幣、競態、手機或完整無障礙皆通過。

以下為之前階段紀錄，當時「未發布／素材待答」不代表目前狀態。完整可恢復最新版為攜帶 `174-v054-publication-receipt` 的 exact source commit；相較已驗收來源只更新文件與 manifest，無 runtime／素材／測試變更。不宣稱 GPT Library 雙邊同步。


```json
{
  "formalCommit": "7bc2b344733ba500429de2a52c3d64d87bbad128",
  "url": "https://gggodlin.github.io/play/hv-v3-dot/",
  "verifiedAt": "2026-10-28T08:07:40Z",
  "result": "normal desktop smoke passed",
  "artifacts": {
    "afaa2e5a-9ea7-40a7-9062-a1428e8a596f": {
      "bytes": 2876,
      "sha256": "8800e787d8993325645c80303c59fa579cb09e33b5a2a0c70e8eca6a5636dee1",
      "jsonReadable": true
    },
    "003d75bf-c67d-4081-8029-bbb7efe342a2": {
      "bytes": 7104,
      "sha256": "3098f25994e7eec4caafdce4cb59ce19388a7461b80db6e3db277c19284995aa",
      "jsonReadable": true
    },
    "70458cd6-1ca3-487e-84bb-855d96f10060": {
      "bytes": 3456,
      "sha256": "ead147d4c3f4cc411f04765312484b9145f7aa17bae2c37aaab0efb0fe24dfc9",
      "jsonReadable": true
    }
  },
  "reloadComparisons": {
    "hero": true,
    "inventory": true,
    "equipment": true,
    "seed": true,
    "wins": true,
    "kills": true,
    "soulFragments": true,
    "worldSeeds": true
  },
  "migration": "v036 LV2 gold76 original hero/equipment/seed/resources preserved; starter inventory adds only weaponFamily:null",
  "play": "Natural first formal-v054 win 16.9 sec, LV2->3, gold76->152, kills6->12, wins1->2, bag1->2, new loot-2 rapier, fragments10->20/seeds1->2; no candidate save import",
  "visual": "Formal new forest and player/BOSS screenshot inspected; 1180width/1165scrollWidth/brokenImages0",
  "limits": "Desktop normal path only; inherits candidate receipt limitations; no extremes/profile fabrication."
}
```

No raw save profiles included. Candidate receipt: QA-V054-BROWSER.md. Full accepted-phase suite 2114 passed, four JS syntax checks; this receipt changes only documentation/manifest, not a new gameplay test run.
