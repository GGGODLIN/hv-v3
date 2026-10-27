# v0.37 霧林古道：完整恢復

## 最新已驗收與候選分開

本檔建立時 v0.37 是未驗收來源候選。最新完整可恢復已驗收來源為 GGGODLIN/hv-v3 bot/dot 的 `2a5354689165d7512d279327db8935c3bbef8570`，正式網站 `f192fec4eff401948d80156f941c01404816cbba`，是 v0.36；請比較 exact commit 與驗證收據，不以較新候選或方便的舊連結取代已完整驗證版本。

## 建置與素材

從選定 exact commit 取得完整 dot-game/。核對 CHECKPOINT.json 所列每個檔案 bytes 與 SHA256；manifest 自己由 exact commit／外部收據確認。完整保留 src、index.html、style.css、package.json、assets、tests、scripts、docs，不把網站子集當完整來源。

Node 20：`npm test`；四 runtime 檔各 `node --check`。不需安裝套件或編譯。`python3 -m http.server 8000`，開 `http://localhost:8000/`。這是恢復者的執行說明，不宣稱 cloud browser 已能開工作區 localhost。

新背景為自寫 canvas，沒有新外部素材依賴；既有 Kenney CC0 與原創 SVG 證據見 ASSET-CREDITS.md，HV 事實／研究模型／本作適配見 ORIGINAL-HV.md。不使用他人的 constants.ts、monsters.json、像素或單機設計。

## 存檔與發布

資料格式3、key、匯出匯入不變；先正常匯出備份再匯入。舊版本對 Exquisite IW1／emergencySupply 的限制保持。來源不含使用者存檔／登入／權限／排程，不聲稱 GPT Library 雙邊同步或完整遠端 Git 歷史封存。

候選限定 public/play/hv-v3-dot/candidates/v0.37/，正式限定 public/play/hv-v3-dot/。完整來源備份先於候選；隔離key與正式分開。root 真正遊玩接受後先備份接受來源，再正式發布及原profile實玩。所有寫入fresh expected HEAD、non-force，保留其他作品／候選；拒絕停下，結果不明先讀回，不換路線繞過。dot-archive與舊HV排程保持暫停。

本輪測試、備份與發布 exact 證據完成後追加；尚未發生者不預填。
