# v077 full source recovery, browser unaccepted

Restore exact commit carrying CHECKPOINT 243-v077-source from GGGODLIN/hv-v3 bot/dot. Verify every manifest payload byte length and SHA256; CHECKPOINT excludes itself. Includes full source, tests, assets and attribution, and recovery docs.

Run npm test in dot-game and node --check for src/engine.js, src/loot.js, src/session.js and src/ui.js. No build or dependencies required. Cloud-local serving is python3 -m http.server 8000, never a bypass for denied website writes.

Save format3 unchanged. Drop summaries are session report observations. v073–v077 remain browser unaccepted; deployment was not attempted. Keep candidate progress separate. Last accepted recovery b4f137ca108aa41161f8fd961e3fa6d867499f04; formal website c38bd2de429c5dc3e52edbad2cb7ea92365cacf3. No force/main/other branches/outside paths/dot-archive.
