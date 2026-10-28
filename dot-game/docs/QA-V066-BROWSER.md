# v066 桌面候選實玩驗收

- exact source203：a1830417cd4dcaaafd58ec91e3c95243f14ed321。
- website204：80c51ea2b504b1e2947234775a00f3f5ef1327e9；exact Pages40761026923成功。
- 隔離候選：https://gggodlin.github.io/play/hv-v3-dot/candidates/v0.66/。
- dot雲端瀏覽器正常UI，真實匯出／匯入，沒有注入遊戲狀態。
- 收據 `QA-V066-BROWSER-RECEIPT.json` SHA256 `6a7ef8bb1c43a06af34088a9084dc55b836e1813beab310b8ecf68befa9444d8`。

一次點擊即出發並排定回營；兩種出發按鈕戰鬥中disabled。自然全四波10.5秒：wins6→7、kills36→42、金542→618、XP84→189/197、碎片60→70、種子6→7，loot8 Superior飾品及loot9 Average護甲入包。通關後至少17秒觀察仍town618金／wins7，沒有自啟。

再按單次後取消預約，完成後確實連刷下一場；重新預約後回營。營地匯出重載持久欄位一致。再按單次確認活躍預約後即重載，返回營地且預約清除；最終Lv8／846金／13件／10勝／60擊殺／XP65/289／HP729／MP40。正式v065 post-QA匯出與原Lv6／542金baseline逐byte相同。

桌面截圖驗過，兩種出發與完整四波說明可見，viewport1180/document1165、brokenimages0。一次等待提早timeout，重新讀取畫面確認自然完成；未繞過控制。

限制：唯讀、滿包、待領、IW、敗北及stale操作仍來源單元測試。非實體手機或完整無障礙認證，未宣稱公開HTTP逐檔hash或Library同步。來源candidate wrapper與正式wrapper分離；尚未正式promotion。
