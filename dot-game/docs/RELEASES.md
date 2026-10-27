# 版本紀錄

## v0.36 已正式發布，原正式進度實玩通過

[正式遊戲](https://gggodlin.github.io/play/hv-v3-dot/) · [真正瀏覽器證據與限制](BROWSER-QA-V036.md)

已驗收完整來源 `969aae334786a54086b1689c5dbf85b80dbf9293` 先備份／exact讀回，再發布正式 `f192fec4eff401948d80156f941c01404816cbba`；Pages `40513626492` exact SHA success，21runtime＋directory HTTP全200/exact。發布前有外部並行提交，重新核對fresh `277a8d04fc0639f9190de8b5ee439a6116810ab5` 後只改正式index/ui兩檔，完整保留4064範圍外blobs/modes與所有候選，沒有force push或覆蓋別人的變更。

原正式profile未匯入候選：Lv11／1142金幣／21勝／41背包，普通route1預約回營11.6秒勝後Lv12／1218金幣／22勝／42背包／HP897／70碎片／6種子，重載保留。原44件held records逐byte完全不變，只新增自然loot-42；原未綁定Lv7 loot-12與配裝／能力／政策保留。實際新名牌HP73%、集火與傷害35清楚分離；app console錯誤0。

最後收據只更新文件／manifest，runtime／素材／測試仍與接受來源相同，不重部署，也不虛稱額外重跑全套。這是有限桌面名牌改善：手機／窄窗、三effect疊合／READY／極低HP的實際目視仍未驗；背景／寶箱不變，不宣稱全美術完成。以下保留較早階段歷史。

## v0.36 隔離候選已通過有限桌面驗收

[候選遊戲](https://gggodlin.github.io/play/hv-v3-dot/candidates/v0.36/) · [真正瀏覽器驗收](BROWSER-QA-V036.md)

完整來源 `f079b8ffec04f7834768461bde8d809cab749711` 已備份／exact讀回；候選網站 `1b84676530bb34b8c62fc44025fa00b0642ff9bf`、Pages `40511494672`、21HTTP檔與directory index通過。實際1180×757桌面看到單敵／雙敵／Boss不透明名牌、名稱／HP／集火／PA與傷害飄字分離，完整DOM防線保留；本版也目視caster晶飾。

四場正常stage5通關，重載保留Lv18／4065金幣／58勝／106背包。104原持有紀錄全保留，其中101件exact、3綁定武器自然成長且anchor／roll不變，另新增5件自然掉落。接受phase只改index與8個精確phase斷言後，完整 **1,919/1,919** 與四語法重新通過。

這是有限桌面接受，不是正式頁已替換或全美術完成：三effect疊合／READY／極低HP僅來源驗證，BW只DOM觀察，STUN活躍未捕捉，手機／窄窗／本版減少動畫未browser驗證。下一步先完整備份接受來源，再正式發布及原正式profile實玩，不匯入候選進度。以下保留來源階段歷史。

## v0.36 戰鬥名牌：來源候選

正式版仍為已驗收的 v0.35。實際桌面遊玩發現敵人頭頂多行細字與月亮背景混在一起；本版限定戰鬥資訊層級：名稱、生命、集火與活躍特效集中於不透明名牌，重複的防線機率留在原有「敵方狀態」完整呈現。不是刪掉數值，也不改敵人能力。

v0.35 原創角色／武器繪圖、戰鬥與掉落規則、存檔及亂數保持不變。來源測試、圖形指令與座標檢查不等於真正畫面驗收；完整來源備份後才發布隔離候選，實際遊玩通過後才替換正式頁。歷史候選拒絕已結束，不視為本版預先受阻。

見 [來源驗收](ACCEPTANCE-V036.md)、[獨立稽核](AUDIT-V036.md)、[自然回歸](ENEMY-NAMEPLATES-MEASUREMENTS.md)與[完整恢復](RECOVERY-V036.md)。下列較早段落保留其當時狀態。

## 2026-10-27：v0.35 已正式發布，原正式進度實玩通過

[開啟正式遊戲](https://gggodlin.github.io/play/hv-v3-dot/) · [真實瀏覽器證據與限制](BROWSER-QA-V035.md)

完整已驗收來源 `94c8048e64e2895d426593b2bbd846cdb8ad42a1` 先備份／exact讀回，正式網站 `46c3d758e435adcde0e77456f296b7dccd26fbae`、Pages `40506632908`與21HTTP檔＋directory index通過；全部候選與4005範圍外blob/mode保留。正式更新沒有拒絕。候選首次拒絕與新明確授權後一次成功重試的歷史仍完整記錄，不混稱目前受阻。

正式原profile沒有匯入候選：Lv11／1066金幣／20勝／38背包→普通路線1預約回營10.6秒→1142金幣／21勝／41背包／HP872／60碎片／5種子，重載保留。原41件持有紀錄、現穿、能力與策略全部exact不變，只新增自然loot-39／40／41；舊未綁定Lv7 loot-12仍原樣。新英雄刺劍與影獸在正式頁實際顯示正常。

本次是有限桌面角色改善，不是手機／全美術完成：caster晶飾未目視、手機／窄窗未驗，既有小字／月亮背景對比仍有限。最後收據只更新文件／manifest，runtime、測試、素材與接受來源完全相同，不重部署、不聲稱額外重跑全套；接受phase後的1897測試與四語法結果另有真實記錄。

以下候選與來源階段段落保留當時狀態，最新正式狀態以上節為準。

## 2026-10-27：v0.35 隔離候選有限桌面驗收通過

[候選遊戲](https://gggodlin.github.io/play/hv-v3-dot/candidates/v0.35/) · [實際畫面／遊玩證據與限制](BROWSER-QA-V035.md)

完整來源 `176dfac8a96e84ceba7492e1d518e75e715e18f4` 先備份／讀回後，候選 `d91d18cb9663e41637f6016a411ff7668db32cf4` 的 Pages `40504194422`、21HTTP檔與directory index通過。首次ref拒絕確認未執行；收到本版拒絕後新明確授權並直接讀回後，同一操作重試一次成功，正式v0.34保留。

真正cloud桌面看到四敵、Boss及三武器／起始中性劍的不同輪廓，並排雙敵／死亡倒地與集火正常。正常從路線2一路解鎖5共7勝，重載維持Lv17／3489金幣／54勝／101背包；90個原ID保留，其中87件完全不變，3件綁定武器是正常升級成長、anchor與roll不變，新增14件自然掉落。caster晶飾未目視、手機／窄窗未驗，怪物小字對比仍有限。

這是有限桌面候選通過，不是正式頁已替換或全部美術完成。下一步先完整備份接受來源，再正式發布及原正式profile驗收，不匯入候選進度。以下較早來源段落保留當時狀態。

## v0.35 戰場角色辨識（來源候選）

本次直接處理 v0.34 真正桌面畫面中「不同敵人都是同一尖耳輪廓、英雄永遠拿劍」的問題。四種本作怪物與裂隙守門者改為各自原創 canvas 像素輪廓；英雄依現穿武器顯示戰斧、刺劍或戰棍，未辨識起始武器維持中性劍形，不假造武器路線。生命、集火、減傷／閃招擋與狀態文字保留。

來源 1,897 項測試與四語法通過；自然五關三武器重播完整狀態不變。真正候選畫面與正式發布尚待後續驗收，不把來源 trace 當成美術已通過。

只改角色呈現，不新增戰鬥機制，不改數值、掉寶、亂數、存檔、交易或操作版面。森林、寶箱與整體場景尚未重製，並非宣稱全套美術完成。來源測試、真正候選畫面、正式版驗收分開記錄；目前正式版仍是已驗收 v0.34。完整恢復見 [RECOVERY-V035](RECOVERY-V035.md)，來源驗收見 [ACCEPTANCE-V035](ACCEPTANCE-V035.md)。

## v0.34 — 正式發布／有限桌面驗收（2026-10-27）

完整接受來源 `e61ad65af2708480133a4547ceb0e8fc28776a49` 先備份／exact 讀回，正式網站 `e69c6b8833e41a0f2c0cc7cced3811717fcf6933`、Pages `40497206404`／21 檔 HTTP 完成，全部候選與 3,984 範圍外 blob／mode 不變。正式原 profile 不匯入候選：一場普通通關 10.6 秒，Lv11／1,066 金幣／20 勝／38 背包／50 碎片／4 種子，重載保持；39 件原物品、配裝與能力完全不變。詳見 [BROWSER-QA-V034](BROWSER-QA-V034.md)。

來源候選與接受 phase 各有真正完整測試，接受 phase 同步八個版本文字斷言後 1,862／1,862 通過；最後文件收據不改 runtime／測試、不再跑套件或重部署。手機／窄視窗、螢幕閱讀器、實際待領 FIFO／補給觸發與全面跨分頁未測，canvas 仍原有場景。

## v0.34 — 隔離候選有限桌面驗收通過，尚未正式發布

來源 `d14be20c66eee1d659b7f81ae82547c76c176a78` 完整備份／exact 讀回後，候選 `e9b661262a22eacab8000f89e8968b3cb0c99796`／Pages `40495402879`／21 檔 HTTP 完成。三武器摘要、完整原文、原生 Enter／Space、同 ID 焦點／捲動、同名換件收合及普通通關／重載有真正 1180×757 桌面證據；88 件原持有物完全不變。詳見 [BROWSER-QA-V034](BROWSER-QA-V034.md)。接受階段只變 index phase 與八個相應測試文字斷言，重新跑完整套件；完整來源／正式推廣尚需另讀回，不預填成功。

## v0.34 — 裝備特效閱讀層次（來源候選，未發布）

本次只處理 v0.33 實際桌面比較所見的長篇特效說明：關鍵身分、取捨與改編提示保持可見，完整原文放入緊鄰的原生展開區。屬性、費用、待領與永久保護不隱藏；同件重畫保留展開／摘要焦點，換件重設，不新增存檔資料。核心規則與素材不變。來源／獨立驗收見 [ACCEPTANCE-V034](ACCEPTANCE-V034.md)，瀏覽器／發布仍是後續獨立關卡；正式 v0.33 不變。

## v0.33 — 正式發布／有限桌面驗收（2026-10-27）

完整已驗收來源 `dfd24bca81bd25259a5cc1ec56814b0b0f4667a9`／checkpoint133先備份讀回，正式網站 `d734cec7e83f43433f7f50b87710a36e779d06b7`、exact Pages `40487617128`／21檔HTTP後通過，3963範圍外blob/mode與候選不變。首次正式ref拒絕已確認未執行，10:18:51.753384 UTC取得新的明確正式授權後成功，保留此歷程。

原正式profile保留而不灌入候選：Lv11／914金幣／18勝／34背包→實際普通通關10.5秒→990金幣／19勝／36背包／40碎片／3種子，重載保留。正常匯出確認37件原持有物、裝備、配裝與能力完全不變，僅自然新增兩件掉落。候選桌面鍵盤／配裝／ExquisiteIW1等與獨立來源1827測試／四語法證據見 [BROWSER-QA-V033](BROWSER-QA-V033.md)。

最終文件收據是相同runtime的更新完整恢復點，確切commit／讀回另核對，不重部署或宣稱重跑。窄／手機、實際待領FIFO、自動低血量補給觸發、螢幕閱讀器及全面跨分頁未測；canvas仍原美術。

## v0.33 — 隔離候選有限桌面驗收通過，非正式發布（2026-10-27）

凍結來源 `63b39c5a62193988430bdf86379b3f75c1b3a303`／checkpoint131；新候選限定授權後，候選網站 `35a4cfff40a7fab92dd1848d9db455878347a1c4`、Pages `40484556586`／21檔HTTP精確核對完成。實際1180×757桌面首屏、自然新手循環、鍵盤比較／焦點、政策／配裝、Exquisite IW1與正常匯出／重載通過；1827來源測試、四語法及379payload另獨立重跑核對。詳見 [BROWSER-QA-V033](BROWSER-QA-V033.md)。

正式v0.25不變。新驗收文件完整來源備份／讀回與正式推廣是後續獨立關卡，本記錄不宣稱完成。窄／手機縮放未成功故未測；實際待領FIFO、自動低血量補給觸發、螢幕閱讀器與全面跨分頁未測。原canvas場景不代表完成全部美術。先前拒絕保留為歷史，新候選操作已成功，不能混稱目前仍阻擋或擴大授權。

## v0.25 — 背包工作台（2026-10-26）

武器路線／投資狀態與部位取交集，顯示背包符合數、空結果與清除篩選；查看中物品和自選出售保持原ID，篩選外項目仍完整、明確列入確認。委託完成會明示reset並顯示鎖定交付物，不自動換裝。只改介面，engine／loot／session與31個歷史fixtures保持v0.24 bytes；資料格式3／IW1限制不變。

1,538項測試、四項語法、17組獨立驗收及限定桌面候選／正式頁實玩通過。實際84件背包、全80組來源篩選、隱藏兩件出售預覽／取消／確認、委託、普通通關、鍵盤與重載均有分開標示的證據，不冒充手機或全部跨分頁驗收。

完整已驗收來源`341b5e9d55dab176807aef1a14e7b6b044b46d8d`先備份／讀回；正式網站`f00fdfe1fcad529081057e99592a49466341bb08`、exact Pages40404233686／六檔HTTP以及原正式存檔自然升Lv11／重載通過。最終121文件收據是相同runtime的更新完整恢復點，不重部署。詳見STATUS、INVENTORY-WORKBENCH-GUIDE、BROWSER-QA-V025。

## v0.24 — 首階裝備界（2026-10-26）

正常通關賺1世界之種，明確確認後挑戰五回合，給已綁定Fair／Average／Superior戰斧、刺劍、戰棍永久IW1。裝備或背包都可，不自動換裝；固定本作強度5、種子節奏、中斷不退費與既有屬性映射是明示改編，不冒充完整原版。後續IW2–10與其他品質未實作，不宣稱原版非法。

1,504項測試、四項語法、24組獨立驗收；600次自然來源試煉全勝且保留中性案例。實際候選正常賺種子、取消、撤退、入場重載、兩次通關、自然升級、配裝與保存通過。

完整已驗收來源`e1e1ce6816fa43cfe3d89e2036b1da95dfe1e967`先讀回，正式網站`962b1cee329b23dccae58f916ca7c5a74dc43e91`後發布；Pages40395026538、六檔HTTP與原正式Lv10存檔普通勝利／重載通過。最後發布收據commit為相同執行程式的更新完整恢復點。詳見STATUS、ITEM-WORLD-GUIDE與BROWSER-QA-V024。

## v0.23 — 靈魂綁定投資（2026-10-26）

正式網站`161e7e30a98fce095dd0adb8b3d22f1a7b9a1810`在完整來源`5ae96a2f4e951ca70e432ef03db81555755a01f0`備份驗證後發布。Pages40383270135、六檔HTTP及正式頁實玩通過；1,433項測試與四項語法檢查通過。

正常賺碎片、明確綁定、自然升級、配裝與重載形成完整循環。不可累乘的數值錨點、v2資料格式及116把容量保護已驗證；原版成本與本作節奏／縮放適配分開記錄。最後發布收據commit是相同執行程式的更新文件checkpoint。參見STATUS、SOULBIND-GUIDE與BROWSER-QA-V023。前版恢復點`cfc624debcecaa029deb95e437681d7c5a5b7644`保留。

# Published releases

## v0.17 — published, 2026-10-26 13:14 UTC

- First optional Protection decision: one attack turn/baselevelMP for25% independent reduction; defaultOFF. SelectedLv10/15Ticks remain questionmarked research models, auto-recast/casttime and missingoriginalmodifiers explicitly distinguished.
- Runtime842ba0d,1188tests/four syntax; independent18000OFF/350damage cases. Actualcandidate naturalunlock/casts/recast/report/readonly/save checks passed.
- Acceptedsourcea31e5e0 backedup/readback first; root972f55d, exactPages40328355347/HTTP6 and actualrootvictory/reload passed. Priorv016b32d52af remains recoverable. BROWSER-QA-V017.md records bounded evidence.

## v0.15 — published, 2026-10-26 12:06 UTC

- New rapier equipment parry input and legal Nimble suffix, integrated character check, conservative seven-stat comparisons and presets. Original equipment endpoints/quality model are separate from the explicit adapted chance mapping; old gear is not retrofilled.
- Camp departure button now matches existing five-free-slot/pending-loot engine requirements; rejected/repeated starts do not play the success sound.
- Runtime3f5b3cce2c1fdf3ddb98966bbd93ef2e8d761ceb;1,155tests/four syntax passed. Candidate1fa69a69d390123804e3aabd2d71079b00804025 passed exactPages40318235306/HTTP6 and bounded actual cloud play.
- Accepted sourcef791ea3f6cabbcfa27af61a5bb7ccdb5e7a6573b was fully backed up/readback verified before root663589608a78d5ccdd38dc0b9d30de85a7bc92a2. Exact rootPages40319505231 succeeded and HTTP6 returned six exact200matches. Only5rootfiles changed; session and3882non-root blobs preserved.
- See BROWSER-QA-V015.md for actual observed versus source-only coverage, final root smoke and cloud-test-profile reset. Prior accepted restore22bdfca3068c7934921c2493eb40de624d684318 remains recoverable.


## v0.14 — published, 2026-10-26 07:29 UTC

- Three gear-only camp presets store existing IDs; exact atomic preview/swap, explicit save-lock and referenced-item protection. Original broader Equipment Sets/Persona remain distinct; combat/loot/economy coefficients unchanged.
- Runtime65e02542472fc4cf9eb9592f2eab1ababd777b39; accepted pre-publicationcc26b628b97fcd665051c3410858ad93195fb27a verified first.1081tests/foursyntax pass; independent31engine/16UI tests include90naturalwins, full120backpack and three post-swap matched wins.
- Websitea8bc6a82da6f476c6a0b2e53320c95f7ff106fe8, exactPages40285780632SUCCESS/HTTP6exact. Candidatef3530c6b2e0bcc19b279dda4ad3bbbe5c54ea329 retained;3876non-root site blobs unchanged.
- Actual UI export preserves all120owneditems except three intentional locks. Root separateprofile presetA/B, realwin and reload atLv20/gold9973/items113/wins88 passed. See BROWSER-QA-V014.md for explicit bounds.
- Latest accepted restore is this verified receipt commit,134files/133payloads; priorv0.13f707a916e79cd8fbd87ba5dae2d90dc598047e23 preserved. No personal-save/Library/account recovery claim.

## v0.13 — published, 2026-10-26 06:30 UTC

- Original-shaped1H Counter-Attack damage subset: conditional sourced chance/proficiency caps, shared reserved-player-turn budget, dedicated counter feedback/reporting and exact death/wave settlement. Partial-defense eligibility and current-family classification are explicit adaptations; counter-stun/OC/OS remain absent.
- Runtime `c08de8e753edf690eff96066e3d9dbd7b385f968`; pre-publication accepted source `328d746f077b155e62a4c58c39279b778b45025e` verified first.978tests/foursyntax pass; final independent15-test suite includes120earnedwins/54pairedtrials with mixed outcomes, not a universal buff.
- Website `ce9a91f142fd10fd2dc8cfde7ce34dddae031a09`; exact Pages40279841540SUCCESS/HTTP6 exact.3870non-root blobs preserved. Candidate `d121a67aad4ad41b65ca05deee77f5dd8c10b6f0` remains.
- Browser candidate observed actual counter damage after earnedgear/progression; root preserved separateprofile, won twice, reloaded gold9528/items117/wins87. BROWSER-QA-V013.md preserves explicit device/lifecycle limits.
- Latest accepted restore is this exact verified receipt commit:125files/124payloads. Prior v0.12 `9e84422bfc366fc1c526ff7f052f2dd8bd69d30d` retained. No personal-save/Library/account recovery claim.


## v0.12 — published, 2026-10-26 05:18 UTC

- Explicit per-item multi-selection and reviewed batch sale. Exact ID/price comparison, hidden-selection count, cancel/repeat/stale/ownership safeguards and keyboard-focus retention. This is an independent convenience adaptation, not expanded safe-auto-sale; prices, loot, combat and saves remain unchanged.
- Runtime source `21247944ce2615847be37ae31f18b2b5c1e86841`; accepted pre-publication source `26e96e6626dfc80e42492de9b3869e9d90eb8ec1` verified first.921 tests/four syntax checks pass.
- Website `02939222eed1789a235f343fd9e07a155ce80c8d`, exact Pages40273174651 SUCCESS and HTTP6 exact. Only four root runtime blobs changed;3864 non-root site blobs and concurrent other works preserved. Candidate `5b3c9cbc86cf7d321db153b88c2070c3f62be920` remains available.
- Candidate actual three-item sale removed exactly the reviewed IDs and preserved every unselected item/equipment record; reload, filter/sort, cancel, takeover and three victories passed. Root retained its independent profile, sold two reviewed weapons, won a real expedition and reloaded atlevel20/gold9308/items113/wins85. See BROWSER-QA-V012.md for bounded evidence and limitations.
- Latest accepted restore is this exact verified receipt commit:116 files/115 payloads. Previous v0.11 restore `61bd11e904e2aa1ea152e37deb461714df08e139` retained. No personal browser-save, Library or external account recovery claim.


## v0.11 — published, 2026-10-26 04:32 UTC

- Full researched ranks for the three existing AP lines: HP Tank10, MP Tank10,1H Damage3. Exact next-level gates, incremental AP costs, cumulative refunds and active/inactive semantics are shown. This is not the entire HV ability tree.
- Runtime source `98b74deb09e2165b8f6f31f27b07a72532c01beb`; accepted pre-publication source `b8b3a696235210ae1e21a60c14c0379c459dd4ac` was backed up/readback verified first.839 tests and four syntax checks pass; docs-only receipts do not re-run unchanged code.
- Site `723b69d8f52a130d0a536544ba9dcabe6b5dfdf1`; exact Pages `40269241579` success and six200 exact HTTP byte/hash matches. Four root files changed,3858 non-root blobs preserved. Isolated candidate remains `94607ad2a87734c44180cbd58f122fe5897ee478`.
- Actual candidate browser play earned level25 and verified rank2 HP1384→1493, AP cost2/full refund3, inactive upgrade, reload and takeover. Root preserved the separate original level20/rank1 profile, completed three victories and reloaded safely; ordinary exact-ID cleanup left114 items/gold8880 and Start enabled. BROWSER-QA-V011.md records limits; MP later gates/maxima are not claimed browser-tested.
- Latest accepted restore is the exact verified commit containing this receipt:107 files/106 manifest payloads. Prior v0.10 `26b01643d4a926fb7abb3669bd823e22dec78e6d` remains historical. No personal browser-save, Library or external-account recovery claim.

## v0.10 — published, 2026-10-26 03:30 UTC

- Accepted source before publication: `19f9b9fb3583caec8a910bbff57454d78d896b65` on `GGGODLIN/hv-v3` branch `bot/dot`. Runtime source: `a2406ee8ae7dfeeb0edeed268c59fd728dba1833`; later acceptance/publication checkpoints change only docs/manifest.
- Public website: `176842ae81cd90d55bac5f96f3bbb772dc4f27e4`; exact Pages run `40264171858` succeeded and one HTTP6 pass returned six 200 exact byte/SHA-256 matches. Four root blobs changed; loot/session and all 3852 non-root site blobs were preserved. Isolated candidate `7ae873625722522e4980e754d944ae8b0fdefaa3` remains at `/play/hv-v3-dot/candidates/v0.10/`.
- Candidate acceptance and actual stable-root smoke passed within BROWSER-QA-V010.md's explicit desktop limits. Root retained the original level-19 unallocated profile; HP Tank learning/slotting spent one AP, an actual stage-3 victory reached level 20, and retreat/reload retained AP 19/20, maximum HP 1090 and the active ability alongside gold 8398, 81 wins and 110 inventory items. No app-origin errors appeared in inspected logs; candidate tabs were closed.
- Latest accepted restore is the exact verified commit containing this publication receipt: 99 complete files / 98 manifest payloads. Previous v0.9 receipt `83a973bcf2586ed5994e707cfc5faaeb519873cd` remains historical. The existing 694 tests/four syntax passes are reused because runtime/tests are unchanged. No personal browser-save or external-account restoration claim.

## v0.10 — desktop-accepted source, root promotion pending, 2026-10-26 03:24 UTC

- Complete runtime/source `a2406ee8ae7dfeeb0edeed268c59fd728dba1833` on `GGGODLIN/hv-v3` branch `bot/dot`: 98 files / 97 manifest payloads, complete tree and exact changed-file readbacks verified. This acceptance checkpoint adds BROWSER-QA-V010.md and updates only documentation/manifest; 694 passing tests and four syntax checks are reused.
- Isolated candidate site `7ae873625722522e4980e754d944ae8b0fdefaa3` at `/play/hv-v3-dot/candidates/v0.10/`: exact Pages run `40263377697` succeeded, and one HTTP6 pass returned six 200 exact source byte/SHA-256 matches. All 3852 prior website blobs, including accepted root and other works, remain unchanged.
- Actual cloud Chrome verified learn/slot/refund semantics, AP and slot budgets, zero-proficiency preview, natural old-save import, all three abilities, battle/read-only guards, natural level-up AP growth, reload, writer takeover, unchanged original items and narrow layout. Exact measurements and untested device/lifecycle/import boundaries are in BROWSER-QA-V010.md; no universal speed-up claim is made.
- Public-root promotion and final stable-root smoke are pending in this checkpoint. Retain accepted v0.9 recovery `83a973bcf2586ed5994e707cfc5faaeb519873cd`. Source backups do not contain personal browser saves or external-account state.

## v0.9 — published, 2026-10-26 02:28 UTC

- Accepted source before publication: `8d6be5b3c3735021aea8e94570ee88b0efe5eea9` on `GGGODLIN/hv-v3` branch `bot/dot`. Complete runtime source: `d7c6a91c8f8ad854ddd8e01663ce3da630f26ea6`; acceptance/publication checkpoints change documentation/manifest only.
- Public website: `08d5066a74c93a69260f384fbd02a02bbf68f81e`; exact Pages run `40259045608` succeeded and one HTTP6 pass returned six 200 exact byte/SHA-256 matches. Four root blobs changed; loot/session and all 3846 non-root site blobs were preserved. Isolated candidate `6ed32468c73cfd4cbb9e0d2f589fe6bcda57ca20` remains at `/play/hv-v3-dot/candidates/v0.9/`.
- Candidate acceptance and actual stable-root smoke passed within BROWSER-QA-V09.md's explicit desktop limits. Stable root retained the original level-19 profile, not candidate progress; two stage-3 club victories, report values and pinning were observed. Retreat/reload retained level 19, gold 8238, 80 wins and 109 items while session-only reports/pin cleared. No app-origin errors appeared in inspected logs; candidate tab was closed.
- Latest accepted restore is the exact verified commit containing this publication receipt: 93 complete source files / 92 manifest payloads. Previous v0.8.1 receipt `c1530bc76aa06716443b9ccca8de6f616e9f5f47` is retained historically. Existing 599 tests/four syntax passes are not repeated because runtime/tests are unchanged. This is not a browser-save or external-account backup.

## v0.9 — desktop-accepted source, root promotion pending, 2026-10-26 02:22 UTC

- Complete frozen source/runtime `d7c6a91c8f8ad854ddd8e01663ce3da630f26ea6` on `GGGODLIN/hv-v3` branch `bot/dot`: 92 files / 91 manifest payloads, complete tree identity and exact changed-file readbacks verified. This accepted-source checkpoint adds BROWSER-QA-V09.md and updates docs/manifest only; 599 passing tests and four syntax checks are reused without redundant runtime reruns.
- Candidate site `6ed32468c73cfd4cbb9e0d2f589fe6bcda57ca20` at `/play/hv-v3-dot/candidates/v0.9/`: exact Pages run `40258269362` succeeded, and all six public HTTP 200 bodies match frozen source bytes/SHA-256. All 3846 prior site blobs, including accepted root/concurrent other works, remain unchanged.
- Actual browser acceptance observed victory/retreat reports, natural axe/bleed reporting, pinned-report retention after recent-list eviction, narrow report wrapping and reload clearing session-only reports while preserving durable progression. Different levels/RNG preclude a causal weapon-benefit comparison. BROWSER-QA-V09.md records exact values and browser/source/device limits.
- Public-root promotion and final root smoke are pending in this pre-promotion checkpoint. Keep the accepted public v0.8.1 recovery `c1530bc76aa06716443b9ccca8de6f616e9f5f47` until those gates pass. Source backup does not restore personal browser saves or external account state.

## v0.8.1 — published, 2026-10-26 01:17 UTC

- Accepted source before publication: `f1228ea6e2777c9469fd387c32f2ba312b725a75` on `GGGODLIN/hv-v3` branch `bot/dot`. Complete runtime source: `ff6bb071240deef5d86c34e80a1d514daeb9762d`; later acceptance/publication checkpoints change documentation/manifest only.
- Public website: `5f2edb7a6927b6433c1a5d8fd64c0a51e4e7561c`; exact Pages run `40253248001` success and six HTTP 200 exact byte/SHA-256 matches. Five root blobs changed; session.js and all 3839 non-root blobs are preserved. Candidate `57f7ab124852d9f0313c2f475ac43a09b069cb03` remains isolated at `/play/hv-v3-dot/candidates/v0.8.1/`.
- Candidate browser acceptance plus actual stable-root reload/save/play smoke passed within BROWSER-QA-V081.md's explicit desktop limits. Stable root retained the original club profile, not candidate axe progress; after stage-3 win/retreat/reload it retained level 19, XP 839/1192, gold 8018, wins 78, kills 480, inventory 105 and writer/saved status.
- Latest accepted restore is the exact verified commit containing this publication receipt: 84 complete source files / 83 manifest payloads. Previous v0.7 receipt `e1b576ee2041bd2772f79587e859a80b5ab1f108` is retained historically. The prior 551 tests/four syntax checks are not redundantly repeated because runtime/tests are unchanged. No personal browser export, credential, Library or schedule recovery claim.

## v0.8.1 — desktop-accepted source, public-root promotion pending, 2026-10-26 01:11 UTC

- Frozen complete runtime source `ff6bb071240deef5d86c34e80a1d514daeb9762d`; full source receipt `5a280428eb940d667ee3c2a63ecbc01c5dbe9643`. Existing evidence: 83 files / 82 manifest payloads exact-readback verified, 551 tests and four syntax checks passed. This checkpoint adds acceptance documentation/manifest only and retains all runtime/test bytes.
- Isolated candidate site `57f7ab124852d9f0313c2f475ac43a09b069cb03`; exact Pages run `40252508863` success. All six public runtime HTTP 200 bodies match the frozen source bytes/SHA-256; all 3839 previous website blobs were preserved.
- BROWSER-QA-V081.md records actual fresh/natural-import play, purchase/equip, visible bleed, reload/item preservation and explicit takeover. Clock/repair unit evidence is not relabeled browser proof; device/lifecycle limits remain. No controlled pure-buff claim is made.
- Earlier HTTP-blocked notes are historical, superseded by normal permitted verification from 2026-10-26 01:03 UTC. Public-root promotion and final root smoke are not yet complete in this pre-promotion checkpoint. Previous accepted public runtime remains v0.7; retain recovery `e1b576ee2041bd2772f79587e859a80b5ab1f108`.

## v0.1 — desktop-first playable prototype, 2026-10-25

- Play: https://gggodlin.github.io/play/hv-v3-dot/
- Complete verified runtime-source checkpoint: [78316483e93480e6c636c3d1ff5a31bdb729e24d](https://github.com/GGGODLIN/hv-v3/tree/78316483e93480e6c636c3d1ff5a31bdb729e24d/dot-game), branch `bot/dot`.
- Website commit: [0cc3c431e7e161936f0c1c80cf88b4453ab2eb74](https://github.com/GGGODLIN/GGGODLIN.github.io/commit/0cc3c431e7e161936f0c1c80cf88b4453ab2eb74).
- [Pages run 40196513414](https://github.com/GGGODLIN/GGGODLIN.github.io/actions/runs/40196513414): completed successfully.
- Full source checkpoint: 21 UTF-8 files, 154,862 bytes, exact GitHub readback content and Git blob SHA matches. Its CHECKPOINT manifest verifies the other 20 files by bytes and SHA-256.
- Website delta: only `public/play/hv-v3-dot/index.html`, `style.css`, and `src/{ui,engine,loot}.js`. The original probe index was replaced; the separately named candidate directory, other game `/play/hv-v3/`, homepage and other site content were unchanged.

### Live publication verification

On October 25 at 13:14 UTC all five runtime URLs returned HTTP 200 and matched the backed-up source byte-for-byte:

| Runtime path | Bytes | SHA-256 |
| --- | ---: | --- |
| index.html | 9045 | 9163569135588b8ef75325a342727af106652ab031b5dcfc6fca23d89919e03e |
| style.css | 16569 | 629cc89dd3604e01f546e85ba3fb6a964f4d24deed27c3e3bf5166ddc8f7ed3d |
| src/ui.js | 30134 | e4e764870aecd68758c8c1942c7c86e68e5f0fcf55e3c5c123970ebf436f061e |
| src/engine.js | 16020 | d5f13c425e414c523fe08ff8a018a1dd5ddda73a3699b19c0e7abf17fcc91431 |
| src/loot.js | 8337 | 9ba8bbc7ba315b9e1084f0f877603d5c2b253cbe0fffe6abc7c96812c435132b |

Final dedicated-cloud-Chrome root smoke at 13:15 UTC: independent fresh save (not candidate progress), first win in 31.5 seconds, two loot items, stage 2 unlocked, consistent quality labels, successful return to camp. No application-origin console errors appeared in inspected entries.

### Acceptance and limits

55 Node tests and syntax checks pass. Prior candidate browser acceptance demonstrated loot/equip attack 43 → 112, same-stage clear 31.5 → 14.8 seconds, higher-stage progression, help, and export/import/reload preservation. See [BROWSER-QA.md](BROWSER-QA.md) for observed scope.

This is a desktop-first playable baseline, not full HV parity or final-quality gameplay. Mobile-device/narrow viewport testing, true browser visibility/multi-tab stress, and audio edges remain unverified. Current prototype pauses while hidden; background online idle is a priority follow-up, distinct from offline earnings. The original-HV research model and explicit independent adaptations are documented separately.

### Restore and continue

Recover the exact source commit above and its complete `dot-game/` directory, not just the deployed runtime. Follow README.md to run and test. Compare CHECKPOINT.json payload bytes/hashes before treating it as restored. This publication record is a later documentation-only checkpoint: runtime source remains exactly the five hashes above. Its manifest adds this record and updates status without hashing the manifest itself. Git history retains the foundation, candidate and accepted source checkpoints.

Do not overwrite the accepted site with an unaccepted candidate. Continue development on `bot/dot`, preserve the isolated website prefix, and back up complete source before future publication. No Library backup or account/credential/schedule restoration is claimed by this release receipt.

## v0.2 — published 2026-10-25 14:22 UTC

- Accepted full source: `12e151786047612e7254783288cf890507d55b5f` on bot/dot, 28 files / 209165 bytes, exact content and Git blob SHA readback verified; 27 payload SHA-256 entries verified.
- Website: `6a93b851e3ef7b12bf59fcb569cf3ccafda12895`, parent `9d2829d7e1962fa168e2d7f1adc34c07d1f51b24`. Parallel publication outside our prefix was preserved using the latest tree and expected-head non-force update.
- Pages CI [40201709893](https://github.com/GGGODLIN/GGGODLIN.github.io/actions/runs/40201709893) succeeded at this exact site commit. Six HTTP 200 runtime files matched source hashes.
- Candidate source `c9e6d73ad853e048d09de17be5cb1398a4fa224e` and site `753160bd26f1c7ba2680bd6a6adadfc741bbf25f` remain in history; candidates/v0.1 and candidates/v0.2 remain separate. v0.1 source and publication evidence above are retained for recovery.
- 88 tests / four module syntax checks pass. Final root save migration, policy persistence and battle-start smoke passed; see BROWSER-QA-V02.md. Foreground-only pause did not occur with document.hidden false in cloud Chrome; cause unresolved. Physical mobile and OS-suspend behavior untested. No universal background or pause guarantee, no offline earnings.

| Runtime path | Bytes | SHA-256 |
| --- | ---: | --- |
| index.html | 9722 | 09a9532caf8215b5f548613eefdb5b48c75b4ff960e0b3b22f4728de26fc40d8 |
| src/engine.js | 17664 | e004cb0eca49810723533a7d9103569f663de453d0e62c6d5cbd7bdc54d2a784 |
| src/loot.js | 8337 | 9ba8bbc7ba315b9e1084f0f877603d5c2b253cbe0fffe6abc7c96812c435132b |
| src/session.js | 2615 | d2062500a60223d34b491c232c72cb9d6591d8c7ba60ccd49f0d1aabe3a9a44b |
| src/ui.js | 33626 | 5fe0b7943b4baa7e4a964841a4b353fc135d232431d2129c3cd2237791dcc4da |
| style.css | 16791 | 33f235a937b200c7f2cc7ad5b85257f31a56be6bc3fa3b02602ae99cdf03711c |

This later receipt is documentation-only; the six runtime files are unchanged and require no redeploy. Restore the full accepted source directory and verify its manifest; do not substitute runtime-only files for complete source. This receipt does not claim GPT Library sync, credential restoration or schedule restoration.

## v0.3 — 2026-10-25 15:28 UTC
- Accepted runtime source: `fee2d2ade97b959cb3d396b5f863279ed84edd53` on `GGGODLIN/hv-v3` branch `bot/dot`. 35 files / 299045 bytes read back exactly; 34 manifest payload hashes pass.
- Source candidate: `a930d560d970f0352d78a3329062ce36974aa079`; staged site `6cf12ecddffef17f7c15959fa3589957bd40dd19`, Pages run `40205960885` successful. Candidate retained at `/play/hv-v3-dot/candidates/v0.3/`.
- Accepted site: `45666f8ea1d0612d1e4b294ded7fb98340c73428` on personal-site `main`; Pages run `40206772110` success for exact SHA. All six live HTTP200 runtime files match accepted source SHA-256. Only authorized demo runtime paths changed; all candidates/other works preserved.
- 147 tests + four JS syntax checks pass. Actual cloud browser verified loot/equip loop, natural rapier proc, reduced-motion feedback, save/reload, takeover, legacy migration and retained-old-tab write isolation. Exact limits and observations: BROWSER-QA-V03.md.
- This publication receipt changes documentation and regenerated manifest only. Runtime remains byte-identical to accepted source/candidate. It is the latest recovery documentation when its commit is verified; do not confuse an earlier convenient link with latest verified restore evidence.

## v0.4 — 2026-10-25 16:30 UTC
- Accepted runtime source: `b47ecc87f5fa66bbd2dbf85f7581bdc06626f74f` on `GGGODLIN/hv-v3` branch `bot/dot`. All 39 files / 389175 bytes read back exactly; 38 manifest payloads verified.
- Candidate source: `3a0bf240eb6216438f278ffe8064f386e74d919e`; site candidate `77ab8973d5c29cc36eab96b24fd0d9a85b7d2902`, exact Pages run `40210714831` successful. Candidate remains at `/play/hv-v3-dot/candidates/v0.4/`.
- Accepted site: `5aa89cb1771f3b934e26a8085030830f2747c73b`; exact Pages run `40211704287` successful. Six public runtime HTTP200 bodies match source SHA-256. Five blobs changed because session.js is unchanged. Other works and all candidates preserved, including concurrent website head `c7a80a72eada56c9a8026ff9206686372f1c38de` inherited before staging.
- 202 tests and four JS syntax checks pass. Independent review caught and verified the timer-partition recovery fix. Actual cloud Chrome verified natural club acquisition, active stun, visible recovery, reduced-motion text, progression, narrow layout, reload and shared-v3 old-tab takeover. Exact limits are in BROWSER-QA-V04.md.
- This later publication receipt updates documentation and manifest only; runtime remains identical to the accepted source and browser-tested candidate. Use the latest fully verified receipt commit for recovery documentation, while retaining this runtime/source evidence and old checkpoints.

## v0.5 — 2026-10-25 17:33 UTC
- Accepted runtime source: `3cc1a3d4e25205ebb4a969dcf0f8c0cd91de1d76` on `GGGODLIN/hv-v3` branch `bot/dot`. All 46 files / 490515 bytes read back exactly; 45 manifest payloads verified.
- Candidate source: `3e692b4008a93ba45aaffe5d5e62d76378927f30`; site candidate `7d6ae90e71245984034a8048b0443ec1b62bcf9e`; exact Pages run `40215716667` successful. Candidate remains at `/play/hv-v3-dot/candidates/v0.5/`.
- Accepted site: `25b8f474b42de1a68535fe176dc0cb0548a26ed8`; exact Pages run `40216688254` successful. Six public runtime HTTP200 bodies match source SHA-256. Only index/engine/UI/style blobs changed; all candidate and unrelated files preserved.
- 262 tests and four JS syntax checks pass. All 120 preview/spawn waves, earlier state/RNG trajectories, old-validator compatibility and 100-seed progression checks pass. Actual Chrome witnessed route previews, role defenses, PA/stun live rates, natural equip/progression, narrow layout, reload and shared-v3 takeover. See BROWSER-QA-V05.md for exact limits.
- This publication receipt updates documentation and manifest only, not runtime. Latest fully verified receipt commit is the recovery-documentation checkpoint; runtime and prior releases remain separately identified. Routine user notification was suppressed during Taipei quiet hours.

## v0.6 — 2026-10-25 19:08 UTC
- Accepted runtime source: `2346d7d3a2e2ec2f610180c6d59b68ddde53b071` on `GGGODLIN/hv-v3` branch `bot/dot`. All 56 files / 666816 bytes read back exactly; 55 manifest payloads verified.
- Candidate source: `146744a33a639943851d774c74aeb18c681ac989`; candidate site `d5ea327b74f4184b4185915e24ed7a417f9f01d6`, exact CI `40221422615` passed. Synthetic-fixture source `0ced806ba924c7eaa3ee9f703884a2d44e9e31a8`; fixture-only site `7fde7baa8a11c356b30f77b6b9ad6527ca81520e`, exact CI `40223139420` passed and fixture2/runtime6 hashes verified. Fixture downloads are test data, not recovery checkpoints.
- Accepted site: `4e9be8514d82de3b7c383ab919003d3b82750304`; exact Pages run `40224227625` passed. Six live HTTP200 runtime bodies match source SHA-256. Five runtime blobs changed; all candidates/fixtures/other works preserved.
- 361 tests and four JS syntax checks pass; final100-seed/300-policy actual-runtime rerun passes. Actual Chrome covered valid import/cancel, exact sales, future-only toggle, exported live auto-sale record, safe cap stop, consent revocation, reload and stable old-tab takeover/defaultOFF smoke.
- Schema-specific browser rejection remains unverified because the supported file/download handoff failed; its extensive automated coverage and separate actual file-read-failure preservation are documented, not conflated. BROWSER-QA-V06.md lists this and other device/lifecycle limits.
- This later receipt changes documentation/manifest only. Runtime equals accepted source and tested candidate. Quiet-hour notification was suppressed; latest verified receipt commit is the recovery-documentation point, separate from runtime and historical candidates.

## v0.7 — 2026-10-25 19:50 UTC
- Accepted runtime source: `03e769c1beff762ff370b7539cc0c8cb8589678d` on bot/dot. All64 files/814222 bytes and63 manifest payloads read back before promotion.
- Candidate source `520b915747b18e6ee85519d48211b87368a19519`; site `b471d7ff356c6776cf988d858372b89f3c8e4dfb`; exact Pages40226863695 and six HTTP hashes passed. Isolated candidate retained.
- Accepted site `bc706c9b87d4117aac6ddcf5436e1817bd1f9233`; exact Pages40227611219 SUCCESS. Six public HTTP200 bodies match accepted source; root-only runtime changes, all candidates/fixtures/other works preserved.
-416 tests/four syntax checks,1500 prior-validator purchase roundtrips,3000 baseline item/RNG fingerprints,100-seed natural purchase measurement. Actual candidate/root purchase/equip/reload/takeover and same-start14.7→10.6s witness; not universal benefit. See BROWSER-QA-V07.md and COMMISSION-GUIDE.md.
- This later receipt changes docs/manifest only; runtime unchanged. Latest fully verified receipt commit is the recovery-doc checkpoint; retain older versions. No GPT Library sync or browser-save/credential/schedule restoration claimed. Routine notice suppressed during Taipei quiet hours.

## v0.8 candidate only — 2026-10-25 20:16 UTC
- Source candidate `21bf7bc45a1229ee8dfd145a6473f2f6855f9f8e`: all 70 files / 945077 bytes and 69 payload hashes read back exactly. Frozen package itself also runs all 469 tests without outside workspace files.
- Isolated candidate site `a324f7a30ddf23e9e8e6507fd6f1390a21133ee4`; exact Pages run `40229602008` succeeded. Six GitHub runtime blobs match source, and all 3833 prior site blobs remain unchanged.
- Public HTTP6 verification is unverified: no complete output recovered, replacement request refused, empty artifact is not evidence. No matching verifier is still running; whether any GET completed is unknown. A specific user decision about a further read-only verification is pending. No blind retry or alternative route is authorized by this receipt.
- Actual browser acceptance and root promotion are NOT complete. Latest accepted runtime remains v0.7 at source `03e769c1beff762ff370b7539cc0c8cb8589678d`, site `bc706c9b87d4117aac6ddcf5436e1817bd1f9233`, with fully verified recovery receipt `e1b576ee2041bd2772f79587e859a80b5ab1f108`. A newer candidate must not be presented as the accepted restore target.
- This staging receipt changes documentation/manifest only. Source backup success is separate from incomplete public verification.

## v0.8.1 source-only candidate — 2026-10-25 21:17 UTC
This candidate corrects missed floating-point player/enemy/TU/rest boundaries and accumulated TU drift. Runtime changes are confined to advance(); loot, formulas, procs, rewards, validators and the session pump are unchanged. The header identifies the candidate version. All 515 tests and four runtime syntax checks pass; the full 100-seed clock balance run passes separately. Historical tests retain their original values against exact versioned fixtures. Detailed measurements include unfavorable deeper-fight outcomes; this is not a universal damage or survival upgrade.

This is not a published release or browser-accepted checkpoint. No public HTTP retry, website write or CI/browser action was attempted in this iteration. The v0.8 public-file verification decision remains pending, and accepted public v0.7 is unchanged. Restore accepted play from `e1b576ee2041bd2772f79587e859a80b5ab1f108`, not this newer development candidate. A subsequent verified source receipt will identify this candidate's full backup separately.

### v0.8.1 verified source receipt — 2026-10-25 21:23 UTC
- Candidate runtime/source commit: `d725a41047bbc77f53113db4b8ae8983877e8b4f` on bot/dot, parent `1c0bbd3363c775e030124fb92fe295d4d6561184`.
- Exact readback: 79 files, 1096263 bytes, 78 manifest payloads. Every byte count, SHA256 and Git blob SHA matches the frozen candidate. All 432 outside-dot-game tree/blob entries are unchanged, no removals, guarded non-force update.
- Source reconstructed exclusively from remote readback passes all 515 tests and the four runtime syntax checks. This proves a usable development-source backup, not browser or publication acceptance.
- This later receipt changes docs/manifest only. No website/CI/public HTTP/browser calls were made for the patch. Pending verification decision and accepted v0.7 restore evidence remain unchanged; do not promote or relabel a newer source-only candidate as the accepted game.

## v0.8.1 manual timer boundary follow-up — 2026-10-25 22:00 UTC
Source-only correction: successful manual Start/Retreat resets the online timer, preventing preceding camp time from becoming new combat time. Failed/repeated actions preserve the interval. 531 tests pass, four runtime syntax checks pass; independent source-only acceptance documented in PUMP-BOUNDARY.md. Only UI dispatch changes in runtime; engine/session/loot are unchanged. No browser or public verification claim, no website publication. Exact source backup receipt follows separately; accepted recovery remains e1b576ee2041bd2772f79587e859a80b5ab1f108.

### Manual timer boundary verified source receipt — 2026-10-25 22:07 UTC
- Candidate runtime/source commit: `053a5dc7dd05d3332a3a6f1bf3a2667dfc12375a` on bot/dot, parent `cc51f05172858dbf168d2ccb3217c920d0b4cc54`.
- Exact readback: 81 files, 1117788 bytes, 80 manifest payloads; every content, byte count, SHA256 and Git blob SHA matches the frozen candidate. All 432 outside-dot-game entries are unchanged, with no removals and an expected-head non-force update.
- The remote-only reconstructed package passes 531/531 tests, zero skips/failures, and four runtime syntax checks.
- This receipt changes documentation/manifest only; candidate runtime/tests are unchanged. No website, CI, public HTTP or browser action occurred. Accepted v0.7 recovery remains `e1b576ee2041bd2772f79587e859a80b5ab1f108`; source recoverability does not establish browser acceptance or authorize the blocked HTTP retry.

## v0.8.1 repaired-save takeover follow-up — 2026-10-25 23:00 UTC
Source-only persistence correction: protected followers re-read/validate durable bytes under acquired ownership after another tab repairs a corrupt save. Valid repairs resume saving; corrupt/unknown/missing/unreadable data remains protected. 551 tests and four syntax checks pass; independent source-only acceptance in SAVE-RECOVERY.md. Only refreshSavedState changes in runtime. Complete backup receipt follows; no public/browser acceptance or promotion. Accepted v0.7 recovery remains e1b576ee2041bd2772f79587e859a80b5ab1f108.

### Repaired-save takeover verified source receipt — 2026-10-25 23:12 UTC
- Candidate runtime/source commit: `ff6bb071240deef5d86c34e80a1d514daeb9762d` on bot/dot, parent `50b3462ca7bd5d4c90991adc6a22f0939cef9f30`.
- Exact readback: 83 files, 1146291 bytes, 82 manifest payloads; every content, byte count, SHA256 and Git blob SHA matches the frozen candidate. All 432 outside-dot-game entries are unchanged, with no removals and an expected-head non-force update.
- The remote-only reconstructed package passes 551/551 tests, zero skips/failures, and four runtime syntax checks.
- This receipt changes documentation/manifest only; candidate runtime/tests are unchanged. No website, CI, public HTTP or browser action occurred. Accepted v0.7 recovery remains `e1b576ee2041bd2772f79587e859a80b5ab1f108`; source recoverability does not establish browser acceptance or authorize the blocked HTTP retry.

## v0.9 development candidate — 2026-10-26 02:12 UTC
Session-only recent expedition reports with an optional pinned comparison; no combat/RNG/reward changes. Parent aggregate599/599 and runtime syntax4 pass. Independent natural paired326expeditions/36591steps preserve exact gameplay states; separate adversarial outcomes tested. See ACCEPTANCE-V09.md and EXPEDITION-REPORTS.md. Browser acceptance and publication are not yet claimed; accepted recovery remains c1530bc76aa06716443b9ccca8de6f616e9f5f47.

## v0.10 development candidate — 2026-10-26 03:12 UTC
Three first-rank learned/slotted AP abilities (HP Tank, MP Tank,1H Damage), five starting Major slots and derived level AP; strict optional persistence with no default auto-allocation. Free camp refund and existing maxHP-based support remain explicit adaptations. Final694/694 tests and syntax4 pass; independent exactfloor/strictsave/31acquisition+15pairedrun evidence in ACCEPTANCE-V010.md. No universal benefit or complete ability-tree claim. Public v0.9 stays accepted until backup/browser/release gates complete.

## v0.19 — growth discovery (published, bounded-desktop accepted)

Existing eligible learning, uninstalled learned ranks and active-line upgrades are visible from the growth tab. Focus-only shortcut never spends or configures; Protection remains a separate optional tradeoff. No rule/RNG/save change. 1,295 tests; four syntax checks; 14,400 paired baseline observations. Source `88907e42c728922a50038b219799a7baa6c74c4f`; candidate `7a424212937f61ce019662ee44389397fc562760`; Pages `40340421670` and six HTTP comparisons passed. [Browser acceptance](BROWSER-QA-V019.md). Current restore/publication evidence lives in STATUS; earlier README/status provenance in HISTORY-READMES-STATUS.

Publication receipt: accepted source `deb39342a5ac84a85c9e898370a2acbf10b02432`; root `ccaddf45ff38ad09263e65dbe3f5bd01fd8508f5`; exact Pages `40342010206`, six HTTP hashes and stable-root learn/slot/victory/reload passed. See current STATUS and BROWSER-QA-V019 for full bounded evidence; no further v0.19 publication gate remains.

## v0.20 — published and bounded-desktop accepted (2026-10-26 15:33UTC)

One stage5+ enemy uses telegraphed alternating physical/magical skill; original-kind gates and explicit limits retained. Runtime sourcebb8c7ec2c070f9bb421d7b7b0a137c235b6aadf1; candidate7ed4e4df8c494baf4207afd7e4f77aa844408d8b /Pages40348541936success. 1,318tests and actualnormalprogress acceptance passed. [Evidence](BROWSER-QA-V020.md). Accepted source69a7f8e3ebda6c9a31bdfc8973343f266626ba65 preceded root816ed14836a62be992a8f75e7b29258cd03a2009; Pages40349899337success, sixHTTPbyte/hashmatches and actualrootwin/reloadsmoke passed. The publicationreceipt checkpoint retains the complete same-runtime source.

## v0.21 — published and bounded-desktop accepted (2026-10-26T16:11:00Z)

Camp target priorities add explicit choices without changing default targeting, damage formulas, counters or DoT recipients.1,341tests/foursyntax/12,000defaultparity observations passed; bounded natural720pairedtrials show mixed results. Source0e6a165a8814d1339b85bf2e10eee75cfe86c36b and candidate4b13eeed2a4515009ea5151b1f18db27cd06ab79 /Pages40354108762 were verified before normalbrowser acceptance. See ACCEPTANCE-V021.md; accepted-source0ec1b6ad742ce32d47a7a4619b57e2f19dec010a preceded root764e43b6736dde7795340a69aa181bf31e2003e0, Pages40356047960success, sixHTTPmatches and normal rootwin/reload smoke.


## v0.22 — departure configuration reports

- Runtime source `6e0614dd199c958a4d3ce7c84592936d61d2e822`; full accepted prepublication source `aa6cd6166d9424745ce9b82bb7e58d73e4bc5b21`.
- Candidate site `569f46099afa5b1031b655b527a38f1001e5ce66`, exact Pages40360095580 success, six HTTP byte/hash matches and bounded real-browser acceptance.
- Root site `0abefbcc311d68f37c56751e3c45f94a2812e39f`, exact Pages40361672425 success and six HTTP byte/hash matches; root smoke recorded separately.
- 1,358 source tests, four syntax checks, 60 independent parity cohorts. Historical digests retained; only newly added report.build omitted for legacy comparison.
- Start-only actual target/Protection policies, slotted ranks and equipped identities; collapsed UI, immutable snapshots, latest two plus one session-only pin. No combat/save/RNG/reward changes or causal best-build claims.
- Source backup precedes each publication. Older releases remain recoverable in Git history. No GPT Library/browser progress/credentials/schedule restoration claim.
