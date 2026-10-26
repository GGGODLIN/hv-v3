# 目前狀態

## v0.26 Exquisite首階裝備界：來源通過並備份；候選發布被審核阻擋

正式版仍為已驗收v0.25：https://gggodlin.github.io/play/hv-v3-dot/

只擴充已綁定Exquisite戰斧／刺劍／戰棍的IW1資格。五回合、固定本作強度5、一次1世界之種、原始綁定錨點及1.02攻擊／1.01其他現有屬性公式不變；不重調普通戰鬥、掉落或經濟。只實作IW1，原版Fair–Superior最高10、Exquisite15；後續階與鍛造仍未實作。原版Exquisite15與舊研究Sup/Exq10衝突已明示。

格式3維持既有資料形狀；v0.24／v0.25不能讀取Exquisite IW1。已以exact v0.25引擎及完整舊UI／ownership模擬驗證拒絕與保存保護，不主張向後可讀或全面跨分頁驗收。

- 1,583／1,583項測試與四項語法通過；138個驗收輸入檔前後不變，31個既有歷史fixtures保留。新增五檔exact v0.25來源及provenance作為可攜式相容性基準。
- 36場普通來源模擬共2,194pulses的完整state／RNG／reports與v0.25完全一致，36組既有品質IW結果相同。只有Exquisite資格與相關顯示變更，session／style不變。
- 10個固定新seed自然賺200勝，8個有Exquisite並全數IW1勝利；seed12／77在20勝時沒有，誠實保留。4個未改實際匯出存檔的獨立分支均勝利，legacy loot-9同級綁定71→IW73且不補招架。這些是來源模擬，不是瀏覽器實玩；詳見EXQUISITE-IW1-MEASUREMENTS.md。
- 完整來源122：0a2819a519b18e2ca6a403193a4931f509cae96f，247檔／246manifest有效負載逐一驗證，409範圍外blob/mode保留。
- 候選commit14524044ee864ac9ac590ed933c9fd0ef5148680已準備，只新增candidates/v0.26/下六檔，3,948既有網站blob/mode保留；但main ref update被auto-review拒絕。
- 拒絕後只讀確認main仍f00fdfe1fcad529081057e99592a49466341bb08，該ref更新未執行、無不確定寫入。沒有重試或換工具／路徑繞過。
- 候選CI／HTTP／瀏覽器實玩未開始，正式發布／新root smoke未到達；不是已驗收或已發布版本。完整拒絕訊息與恢復界線見PUBLICATION-BLOCKER-V026.md。

## 已驗收恢復點：v0.25

完整來源e5962e728ae4c20db80172916f3e1a9b72815a91（234檔／233manifest有效負載）；正式網站f00fdfe1fcad529081057e99592a49466341bb08。1,538項測試、四項語法、候選桌面實玩、exact Pages40404233686、六檔HTTP與原正式tab2通關／重載通過。這是現行正式版，不以開發中的候選取代已驗收描述。

候選v0.25未改普通匯出檔：Lv16／2479金幣／46勝／84背包／110碎片／1種子，SHA256 3cb1c0e42a28d163a92bec43b73b1ea91be428b4b32af9fec5b8dfebbf5bb583。其中四把原有Exquisite武器提供實際下一步投資；不修改這個存檔來製造資源或骰值。

原正式tab2自己的存檔：Lv11／914金幣／18勝／34背包／HP872／MP49／30碎片／2種子，原未綁定Lv7刺劍保留。不得匯入候選進度。詳見BROWSER-QA-V025.md與RECOVERY-V025.md。

原碼備份不等於個人瀏覽器進度、檔案庫、登入／權限／排程恢復；不聲稱實體手機、OS休眠或全面跨分頁驗收。
