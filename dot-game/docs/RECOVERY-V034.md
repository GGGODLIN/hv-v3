# v0.34 完整來源恢復與發布界線

## 正式發布後的完整恢復點

- 已驗收來源：`e61ad65af2708480133a4547ceb0e8fc28776a49`，checkpoint138，390 檔／389 payload，CHECKPOINT SHA256 `330ae1f83a1bc8330e73733968b8881f3d9a33dab32576bee858dbdf4c1f5fdd`。17 修改檔提交前後 exact-content readback、373 不變 identities、409 範圍外 source blob／mode 均通過。一次 RELEASES.md 讀取斷線在同一 read-only route 重讀恢復後才移動 ref，沒有不明寫入。
- 正式網站：`e69c6b8833e41a0f2c0cc7cced3811717fcf6933`，exact Pages `40497206404` 成功；21 檔 root 與目錄 index HTTP bytes 完全相符。所有候選、其他 3,984 blob／mode 保留；v0.34 候選 21 檔 HTTP 另再次確認不變。初次過早 HTTP 看見前版三個 runtime 檔，CI 完成後同一路徑重驗已精確相符。
- 正式原 profile 普通通關／重載已通過：Lv11／1,066 金幣／20 勝／38 背包／50 碎片／4 種子。正常匯出 SHA256 `fb9d171993945abdadcf275b8cd68bdb0052371d7d00827278ac19954af04e3d`，39 件原 held records 完全不變，只自然新增兩件；舊未綁定 Lv7 `loot-12` 保持原樣。私人匯出不包含於 source，未以候選進度取代正式 profile。
- 最後 checkpoint `140-v034-publication-receipt` 是文件／manifest-only 的完整恢復記錄，不改 runtime／assets／tests、不重部署、不聲稱再跑完整套件。其 exact commit 及讀回另以外部收據確認；已知可用來源138和前版 v0.33 `9e43771c5ea729d328f465ee5ce91cfcc6e8c90f` 保留。

本版未發生候選或正式寫入拒絕；已知讀取／部署等待問題已釐清，沒有替代 host／API 繞路。手機／窄視窗／輔助技術與其他未測界線仍見 [BROWSER-QA-V034](BROWSER-QA-V034.md)。以下保留較早階段說明；其尚待發布內容不代表最新正式狀態。

## 已驗收候選與新完整來源

- 已凍結、完整備份／讀回的來源 checkpoint136：`d14be20c66eee1d659b7f81ae82547c76c176a78`，389 檔／388 payload，CHECKPOINT SHA256 `76671c198189afdbd570bbdf0a41177d3ce2463487d3bd860846bc034e676b3c`。27 修改檔提交前後 exact-content readback、362 不變 identities、409 範圍外 blob／mode 均通過。
- 候選網站 `e9b661262a22eacab8000f89e8968b3cb0c99796`，Pages `40495402879` 成功、21 檔公開 HTTP exact bytes；其他 3,984 個網站 blob／mode 與正式 v0.33 的 21 個 HTTP bytes 不變。此次候選沒有拒絕或不確定寫入。
- 真正候選桌面操作、普通通關／重載已通過；正常匯出確認全部 88 件原持有物完全保留，見 [BROWSER-QA-V034](BROWSER-QA-V034.md)。沒有把候選進度匯入正式 profile。
- 接受 checkpoint `138-v034-browser-accepted` 新增瀏覽器驗收文件，更新 index phase 與八個精確 phase-label 測試斷言，重跑完整套件。新完整來源的 exact commit／readback 另以外部收據核對，不預填成功；其他 runtime／assets／fixtures 等同 checkpoint136。
- 正式根目錄仍是已驗收 v0.33。正式推廣必須等待新完整來源備份／讀回，再驗證正式 exact Pages／21 檔 HTTP 與保留原正式 profile 的實玩／重載。

下方是來源 checkpoint136 凍結時的恢復界線；其「尚未瀏覽器」由上述新證據補充，不修改歷史量測或原始 snapshot。

## 基點與範圍

- 個人 `GGGODLIN/hv-v3`，只更新 `bot/dot` 的本作 `dot-game/`；基點 exact `9e43771c5ea729d328f465ee5ce91cfcc6e8c90f`，checkpoint `135-v033-publication-receipt`，381 檔／380 manifest payload。
- 該基點已逐檔核對新讀回的遠端 Git tree：所有本地 bytes 對應 Git blob identity；CHECKPOINT SHA256 `bf35dead4ddcb3631213f041a51e4576e733ec89d8db68761b972dc429f2871d`。保留 `dot-game/` 外 409 個 blob 及 mode。
- 本次 checkpoint `136-v034-effect-readability-source`。提交前文件不預填新的來源 SHA 或備份成功；以 exact commit、CHECKPOINT 及外部讀回收據確認。
- 最後已驗收正式網站 v0.33：`d734cec7e83f43433f7f50b87710a36e779d06b7`，Pages `40487617128`、21 檔 HTTP 與原正式存檔普通通關／重載已通過。其先前拒絕是已解決的歷史，不是 v0.34 的現存拒絕。

## 完整取回與校驗

取回 exact commit 的整個 `dot-game/`，不是只取網站執行檔。包含程式、所有本地 SVG／原件／CC0 授權與 provenance、測試、42 個歷史／瀏覽器 fixture、腳本、量測收據及文件。檔案集合、bytes、SHA256 應完全符合 CHECKPOINT.files；CHECKPOINT 本身以外部收據校驗。新增／修改檔要求 exact-content 讀回，未改檔以 Git blob identity 驗證；來源 ref 使用 non-force 與 expected-head lease，不改 main 或其他分支。

```sh
cd dot-game
node --test --test-reporter=tap tests/*.test.mjs
node --check src/engine.js
node --check src/loot.js
node --check src/session.js
node --check src/ui.js
BASELINE_DOT_GAME=/path/to/exact-v033/dot-game node scripts/effect-readability-measurement.mjs
# 有可用的雲端瀏覽器預覽環境時：
python3 -m http.server 8000
```

Node 20 以上；遊戲不需安裝依賴或 build。來源 DOM 與重播不是實際畫面證據；上述伺服器是恢復說明，不代表本次啟動 localhost 或允許繞過預覽限制。

## 發布與存檔

完整來源備份／讀回完成後，候選只可發至 `public/play/hv-v3-dot/candidates/v0.34/`，使用既有路徑隔離命名空間，標題與版本標籤明示隔離測試。網站候選是 21 檔 runtime／素材／授權說明，不是完整來源。需確認 exact commit Pages、全部 21 檔公開 HTTP bytes 及實際瀏覽器普通遊玩、展開／收合、鍵盤與重載。通過後才另備份已驗收來源並考慮正式根目錄；候選進度不得灌入正式原 profile。`public/play/hv-v3/`、首頁與其他作品不可改。

如工具拒絕或結果不明，停止相依發布並讀回／報告具體 target、完整原因與確定／未執行／不明狀態；不替換 host、API 或盲重試。不能把 v0.33 特定新授權當作未來 blanket grant；本版以已讀到的後續候選持續授權與當次適用範圍為準。

本版不改 engine／loot／session、資料格式 3、儲存 key、亂數、交易或任何 fixture。收合狀態只是當下 DOM；重新選物／重載不復原。回到 v0.33 不會產生新資料欄位的相容性差異；更早版本仍有 Exquisite IW1／補給選項等既有讀寫限制。操作前先正常匯出備份，重新整理舊分頁。完整程式恢復不包含私人瀏覽器存檔、帳號、登入、權限或排程。

## 尚待確認

來源驗收數字與獨立測量見 [ACCEPTANCE-V034](ACCEPTANCE-V034.md) 及 [AUDIT-V034](AUDIT-V034.md)。此凍結前文件不宣稱真正瀏覽器、像素／高度、手機／窄視窗、螢幕閱讀器或發布已通過。
