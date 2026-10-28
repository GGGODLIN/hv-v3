// Reverse exact v050 view delta only for historical byte-pinned artwork checks.
const changes={
  "src/ui.js": [
    [
      "  $('clear-pinned-report').disabled = !pinnedExpeditionReport;\n",
      ""
    ],
    [
      "}\nfunction clearPinnedExpeditionReport() {\n  if (!pinnedExpeditionReport) return;\n  pinnedExpeditionReport = null;\n  renderExpeditionReports();\n  // Disabled controls cannot remain a useful keyboard destination.\n  $('pin-report').focus({ preventScroll: true });\n",
      ""
    ],
    [
      "$('clear-pinned-report').addEventListener('click', clearPinnedExpeditionReport);\n",
      ""
    ]
  ],
  "index.html": [
    [
      "        <div class=\"section-heading report-heading\"><h3 id=\"report-heading\">最近兩次遠征戰報</h3><button id=\"export-report\" class=\"secondary-button\" aria-describedby=\"report-session\" disabled>匯出最近戰報</button><button id=\"clear-pinned-report\" class=\"secondary-button\" disabled>清除比較基準</button><button id=\"pin-report\" class=\"secondary-button\" disabled>設為比較基準</button></div>\n",
      "        <div class=\"section-heading report-heading\"><h3 id=\"report-heading\">最近兩次遠征戰報</h3><button id=\"export-report\" class=\"secondary-button\" aria-describedby=\"report-session\" disabled>匯出最近戰報</button><button id=\"pin-report\" class=\"secondary-button\" disabled>設為比較基準</button></div>\n"
    ]
  ]
};
export function beforeClearReport(source,path){for(const [current,previous] of changes[path]||[])source=source.replace(current,previous);return source;}
