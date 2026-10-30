# 疑似 bug：QA 存檔 turnlog 跨局累積（&fresh 不會清空）
證據（/workspace/qa-saves/）：
- rc12ak-blade1-end.json：turnlog 108 筆，F5…F85
- rc12ak-bulwark1-end.json：turnlog 234 筆（= 108 + bw1 的 126 筆）；F65–F85 的回合數與 blade1 完全相同（65:4、70:10、75:13、80:11、85:27）→ bw1 並未到過 F65，這些是 blade1 的資料
- rc12ak-oc1-end.json：turnlog 347 筆（= 234 + 113）；F70–85 仍是 blade1 的 10/13/11/27
- 多個樓層出現重複的 turn 編號（同一 floor 多局的 turn 1.. 疊在一起），例如 oc1 F45 共 46 筆。
結論：每局以 &fresh 開局後 turnlog 沒被清空，與上一局串接（瀏覽器端 localStorage 持續）。我無法直接在開局時檢視 localStorage（規則禁止檢查 storage），改以三份存檔的筆數累加與重複樓層比對。
影響：以存檔 turnlog.bossDmg 算每局王戰輸出不可靠；本版報告改用 evflush 的 data-bossavg/data-bossturns。每局真正的資料＝存檔 turnlog 的最後 (本局新增) 筆。
- 追加：rc12ak-arcane1-end.json turnlog 474 筆＝oc1 的 347＋本局 127，再次累積（108→234→347→474）。
- 追加：blade2 存檔 533 筆＝474+59。
- 追加：bulwark2 存檔 658 筆＝533+125。
- 追加：oc2 存檔 795 筆＝658+137。
- 追加：arcane2 存檔 912 筆＝795+117。
- 追加：blade3 存檔 1035 筆＝912+123。
- 追加：bulwark3 存檔 1188 筆＝1035+153。
- 追加：oc3 存檔 1295 筆＝1188+107。
