# v0.32 介面素材、來源與修改

## 實際納入：Kenney UI Pack 2.0（CC0 1.0）

官方頁：[Kenney UI Pack](https://kenney.nl/assets/ui-pack)。
原始壓縮檔：[kenney_ui-pack.zip](https://kenney.nl/media/pages/assets/ui-pack/f651646eab-1718203990/kenney_ui-pack.zip)，1,229,750 bytes。

- 原始 ZIP SHA256：`a8a14a234911eb648c062622915c93e79e94e97cb7f9f375a70f6617f1174318`。
- 原包 `License.txt` SHA256：`69f7eaa5e05913b4d09cf5848f75390b5c3c9a409ef8555777803d9ca0c171fb`。
- 原授權逐 byte 保存在 `assets/kenney-ui/License.txt`；未修改的選用 SVG 保存在 `assets/kenney-ui/original/`。
- 授權：[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)。包內文字明確允許個人、教育與商業使用，署名非強制；此處仍保留出處。沒有暗示 Kenney 贊助本遊戲，也沒有取得其商標授權。

實際只使用兩款原始形狀、三個衍生檔：

| 衍生檔 | 原始 package path | 用途 |
| --- | --- | --- |
| `slot-frame.svg` | `Vector/Extra/input_square.svg` | 正方形裝備槽；原本白色中心不透明，明確重色為深底 |
| `button-primary.svg` | `Vector/Grey/button_rectangle_depth_flat.svg` | 低飽和暖色主要操作 |
| `button-secondary.svg` | 同上 | 同一形狀、冷灰次要操作 |

修改僅為明確列出的色碼替換及新增對應 `viewBox`，不改 path 幾何。精確 remap、原件與衍生檔 SHA256 見 `assets/kenney-ui/PROVENANCE.json`。長按鈕用 CSS `border-image` 九宮格保留轉角，不把長條圖片整張非等比拉伸。正方形槽只做等比縮放。

這包是平滑的輕浮雕 UI，不是奇幻場景／角色包；沒有武器、護甲或飾品圖。未加入包內字型（無 CJK）、聲音或所有五色變體。全部執行時資產從本地相對路徑載入，無熱連外站圖片。

## 本作原創：六款裝備圖形

`assets/equipment/` 的 `axe`、`rapier`、`club`、`armor`、`accessory`、`unknown` 是本作獨立繪製的 code-native SVG，不是 Kenney 素材，不是遊戲截圖描圖，也非 AI 生成圖片。使用同一鋼色／皮革／暗外框配色。來源與精確 SHA256 見該資料夾 `PROVENANCE.json`。

這些圖形只是辨識輔助。`unknown` 表示未辨識的武器路線，不把起始劍偽稱為已研究的戰斧／刺劍／戰棍。完整名稱、部位／路線、等級、品質和投入狀態仍為一般文字，品質不只靠顏色。原有獨立 canvas 場景未改；尚非完成全遊戲美術統一。

## 僅參考結構：不納入遊戲原圖

研究者實際檢視了 Interface In Game 展示的以下畫面：

- [Elden Ring 裝備畫面](https://interfaceingame.com/screenshots/elden-ring-equipment/)：同尺寸槽、已穿與背包分組、名稱與屬性獨立區域。
- [Elden Ring 鍛造畫面](https://interfaceingame.com/screenshots/elden-ring-smithing-table/)：同列對齊現值與預期值；本作把它改用於目前裝備 → 選取裝備及正負差值，不新增鍛造。
- [Slay the Spire 敵方資訊](https://interfaceingame.com/screenshots/slay-the-spire-enemy-stats/)：薄狀態列、主場景、靠近場景下緣的操作。
- [Slay the Spire 營火選擇](https://interfaceingame.com/screenshots/slay-the-spire-rest-or-smith/)：共用狀態列、少量清楚操作與後果。

只借鑑資訊層級，未把其遊戲美術、螢幕截圖、商標、特效或角色複製進產品。也未購買、註冊、接受額外付費條款。Game UI Database、Gamedexy、Flomob、Mobbin 是使用者提供的其他資源入口，不表示已從全部網站取材或獲其素材授權。
