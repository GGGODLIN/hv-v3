# v054 desktop candidate browser acceptance

## v0.54 桌面瀏覽器已驗收，待正式發布（2026-10-28）

已驗收隔離候選 `125bf4ceb2242624c847cdcf2057486944b6ff07`，完整來源 `78d6cbcc393a5599671d42628dd7deb24052ad0f`。Pages 40652496659 成功，21 runtime 與目錄首頁 HTTP 位元組一致。使用者已明確允許使用、修改與公開發布 Kenney UI Pack；其他人的 HV 程式與素材仍禁止沿用。

真雲端桌面瀏覽器完成正常 v036 存檔匯入、兩場自然戰鬥 LV2→4、掉寶換裝、HP Tank 成長、背包名稱/品質/保護交集與排序、鎖定/裝備焦點、小數配裝差、戰報匯出與清基準、存檔匯出重載。重載後 hero/inventory/equipment/seed/resources 一致；候選未污染正式 v036。1180×757 無水平溢出、破圖 0，抽樣無 app-origin 錯誤。

僅桌面正常流程驗收：未實測 1e12 極端金幣、人工匯入競態/quota、歷史 LV18 個人存檔、手機與完整鍵盤/讀屏；單元測試不是這些瀏覽器證據。詳細見 `docs/QA-V054-BROWSER.md`。此階段正式仍 v036，待已驗收原碼備份後才提升。


## Evidence (temporary real saves not committed)

```json
{
  "candidateCommit": "125bf4ceb2242624c847cdcf2057486944b6ff07",
  "sourceCommit": "78d6cbcc393a5599671d42628dd7deb24052ad0f",
  "url": "https://gggodlin.github.io/play/hv-v3-dot/candidates/v0.54/",
  "browser": "cloud CDP 1, formal tab2, candidate tab3",
  "verifiedAt": "2026-10-28T07:55:45Z",
  "artifacts": {
    "v036Baseline": {
      "bytes": 6674,
      "sha256": "f114fcdef50e55d84b892d54f8f95a8aabc1ffd1b0061607291ad1f6f978c585",
      "jsonReadable": true
    },
    "v054AfterImport": {
      "bytes": 2876,
      "sha256": "8800e787d8993325645c80303c59fa579cb09e33b5a2a0c70e8eca6a5636dee1",
      "jsonReadable": true
    },
    "report": {
      "bytes": 1627,
      "sha256": "647cc952cfdcb1a6faabefd2db98d15db8766957e64b5533d4c364ede7604feb",
      "jsonReadable": true
    },
    "v054BeforeReload": {
      "bytes": 9089,
      "sha256": "77a67bc500022a45c91c52b468240fad314a4a7eb8f3ed5fba62e035cee4142f",
      "jsonReadable": true
    },
    "v054AfterReload": {
      "bytes": 4673,
      "sha256": "71c7ddeb526f189eac8d115aa41f5899562704b298c52bd1f48a737627183c21",
      "jsonReadable": true
    },
    "v036AfterQA": {
      "bytes": 6674,
      "sha256": "f114fcdef50e55d84b892d54f8f95a8aabc1ffd1b0061607291ad1f6f978c585",
      "jsonReadable": true
    }
  },
  "checks": [
    "Normal v036 fresh play LV1->2, loot-1 club equip, export parsed",
    "Normal UI import preserves hero/equipment/seed/resources. Starter inventory only adds weaponFamily:null; original fields preserved",
    "Screenshots visibly show forest, original wood chest, player and battle STUN2T",
    "Candidate two wins LV2->4, loot-2 rapier equip, HP Tank learned+equipped",
    "Observed -0.08 percentage point and +9.8553 equipment differences",
    "Lock/unlock retains action focus; equip focus follows equipped card",
    "Trimmed name+quality+protection AND filter 1/2 then 0/2; reset2/2",
    "Quality sort high first; equal Superior loot-4 before loot-3",
    "Report pin then clear retains latest report and focuses pin-report",
    "Report JSON parsed, no full hero/inventory/RNG",
    "Normal save reload preserves hero/inventory/equipment/seed/resources exactly; report reset",
    "Formal baseline byte-for-byte unchanged after candidate QA",
    "1180x757 viewport, scrollWidth1165, brokenImages0",
    "Observed last20 errors/warns only known Chrome extension; no app-origin error in sample",
    "Help/settings accessible names observed"
  ],
  "limits": [
    "Historical LV18 profile unavailable in this cloud session; tested newly played real v036 profile, not synthetic",
    "No extreme 1e12 cap browser reproduction; unit evidence only",
    "No artificial file-read race or quota failure",
    "Desktop only; not mobile or full keyboard/screenreader validation",
    "Gameplay time comparison is not controlled causality experiment",
    "Raw exported profiles remain temporary browser downloads and are not committed"
  ]
}
```
