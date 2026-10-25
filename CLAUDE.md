# hv-v3 — 第三代 HentaiVerse 單機遊戲專案規範

## 乾淨重啟鐵則（Clean Room Rule）

0. **舊專案路徑黑名單（CP3-D 起明列）**：以下路徑一律不得讀取、搜尋、複製、開啟或顯示內容；唯一例外是驗收時以 `sha256sum` 機械式計算雜湊做「零重複」比對（只比雜湊、不看內容）。
   - `/workspace/hv-clone`
   - `/workspace/hvp091`
   - 任何位置的 `hentaiverse-clone-kb`
   - 任何位置的舊 `CopyVerse`
   像素素材一律由 `scripts/gen-pixel-art.py` 以程式繪製；怪物池一律由 `scripts/build-monsters.py` 從公開資料集推導。
1. **嚴禁讀取舊世代目錄**：本專案（`hv-v3`）為從零重啟的第三代實作，連同公開文件探索與系統設計一律從頭開始。任何 agent 或 subagent **嚴禁讀取、搜尋或複製**舊世代專案（`hv-clone`、`hentaiverse-clone-kb` 與舊 `CopyVerse`）的任何檔案。
2. **禁止逆向或連入原版 live 伺服器**：所有機制考證僅限公開網路資源（ehwiki、公開論壇討論帖、GitHub 開源計算器／模擬器／userscripts）。
3. **缺口補齊原則（原版復刻優先，但不要求 1:1）**：
   - 公開資料有記載的公式與數值表，忠實還原並附來源出處。
   - 查不到的值依序：(1) 百科旁證或開源工具實作；(2) 用已知公式與數字反推、縮小範圍；(3) 前兩步仍無法決定的，才用好玩導向定暫定值，並在暫定值表標明依據，等可玩後實測調整。
