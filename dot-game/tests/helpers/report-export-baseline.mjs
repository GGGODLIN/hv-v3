// Reverse only the exact v049 export UI delta for historical artwork byte pins.
const changes={
  "src/ui.js": [
    [
      "  $('export-report').disabled = !reports.length;\n",
      ""
    ],
    [
      "}\n// Export a detached, completed report only: this is not a restorable save.\nfunction exportRecentExpeditionReport() {\n  const report = expeditionReports(state)[0];\n  if (!report) { showToast('還沒有已結束戰報；先完成或結束一場遠征。'); return; }\n  let url = null, link = null;\n  try {\n    const exportedAt = new Date().toISOString();\n    const record = { format: 'hv-v3-dot-expedition-report', version: 1, exportedAt,\n      notice: '僅最新已結束遠征的觀測快照，不是遊戲存檔，不能匯入恢復；不是受控配裝比較，未列全部影響因素。', report };\n    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });\n    url = URL.createObjectURL(blob); link = node('a'); link.href = url;\n    link.download = `hv-v3-dot-report-${exportedAt.replace(/[:.]/g, '-')}.json`;\n    document.body.append(link); link.click();\n    const completedUrl = url; setTimeout(() => URL.revokeObjectURL(completedUrl), 10000);\n    url = null;\n    showToast('戰報已準備下載，請確認檔案保存位置；這不是遊戲存檔。');\n  } catch {\n    if (url) URL.revokeObjectURL(url);\n    showToast('戰報匯出失敗，請稍後再試；遊戲進度未變更。');\n  } finally { link?.remove(); }\n",
      ""
    ],
    [
      "$('export-report').addEventListener('click', exportRecentExpeditionReport);\n",
      ""
    ]
  ],
  "index.html": [
    [
      "        <div class=\"section-heading report-heading\"><h3 id=\"report-heading\">最近兩次遠征戰報</h3><button id=\"export-report\" class=\"secondary-button\" aria-describedby=\"report-session\" disabled>匯出最近戰報</button><button id=\"pin-report\" class=\"secondary-button\" disabled>設為比較基準</button></div>\n        <p id=\"report-session\" class=\"report-note\">僅本分頁遊玩紀錄，不寫入存檔；重新整理、匯入或載入其他進度後清空。比較基準也會在進度控制權變更時清空。可匯出最新已結束戰報供自己留存；戰報不是遊戲存檔，不能匯入恢復進度。</p>\n",
      "        <div class=\"section-heading report-heading\"><h3 id=\"report-heading\">最近兩次遠征戰報</h3><button id=\"pin-report\" class=\"secondary-button\" disabled>設為比較基準</button></div>\n        <p id=\"report-session\" class=\"report-note\">僅本分頁遊玩紀錄，不寫入存檔；重新整理、匯入或載入其他進度後清空。比較基準也會在進度控制權變更時清空。</p>\n"
    ]
  ]
};
export function beforeReportExport(source,path){for(const [current,previous] of changes[path]||[])source=source.replace(current,previous);return source;}
