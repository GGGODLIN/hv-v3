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

## 完整候選來源備份完成（尚非瀏覽器接受）

151 完整來源 `abb79f61d45ddc356559e8af7ffab55a6ac4b1c4` 已提交 bot/dot 並從 exact commit 讀回。416 檔／415 payload：25 變更在 ref 前後逐檔 exact 核對，391 不變檔 Git 身分與409範圍外 blobs/modes保留。原始程式、必要素材、測試及恢復說明完整，不是網站部署子集。候選發布仍在進行，正式 v0.36 不變，尚未 root 真正瀏覽器接受。

## v0.37 來源已備份；候選發布因既有 Kenney 來源檔受阻

完整來源 `abb79f61d45ddc356559e8af7ffab55a6ac4b1c4`（416檔／415payload）已通過 exact 讀回；完整 1,934 測試／四語法與自然回歸完成。本輪新內容僅原創霧林古道 canvas 背景，不新增或修改 Kenney 素材。

候選 `public/play/hv-v3-dot/candidates/v0.37/` **尚未發布，未做瀏覽器驗收**。發布時 `assets/kenney-ui/PROVENANCE.json` 的 create_blob 被平台審核認為與獨立素材範圍衝突。拒絕後直接核讀使用者「用這些素材」請求與後續 Kenney 清單、確認官方 CC0 與該檔和已發布 v0.36 完全相同，再以新相關證據對同一未執行 blob 重試一次，仍被拒，已停止；沒有改傳輸路線、刪除出處或跳過 blob。

只有14個未掛接 blob 建立，未建立 tree／commit／ref；網站 main 讀回仍 `f192fec4eff401948d80156f941c01404816cbba`，正式 v0.36 保留。下一步需要對該既有 Kenney UI 素材範圍的明確授權解決拒絕後，才能繼續原候選流程；不可把目前來源候選當已驗收版本。以下保留早期階段歷史。

