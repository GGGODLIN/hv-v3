/** CP3-bugfix 2: player-submitted monster names (monsters.json) that are sexual, otherwise inappropriate or gibberish are
 * shown under a neutral name built from the race; stats are untouched. Rules are this project's own (暫定), not from any source. */
export const NAME_BLACKLIST = [
  // sexual
  'milf', 'pregnant', 'preg', 'sex', 'porn', 'hentai', 'fuck', 'cum', 'boob', 'tits', 'titty', 'penis', 'vagina', 'nude', 'naked',
  'rape', 'loli', 'shota', 'futanari', 'ahegao', 'slut', 'whore', 'cock', 'dick', 'pussy', 'anal', 'orgasm', 'fetish', 'bdsm', 'nsfw',
  'erotic', 'lewd', 'horny', 'incest', 'hypno', 'oppai', 'ecchi', 'yaoi', 'netorare', 'ntr', 'bondage', 'nipple', 'breast',
  'panties', 'panty', 'bikini', 'lingerie', 'stripper', 'masturb', 'semen', 'sperm', 'dildo', 'vibrator', 'tentacle', 'harem',
  'bukkake', 'gangbang', 'creampie', 'blowjob', 'handjob', 'boobs', 'busty', 'succubus', 'wife', 'waifu', 'virgin', 'kinky', 'bitch',
  // other inappropriate
  'nigg', 'fag', 'nazi', 'hitler', 'retard', 'kys', 'suicide', 'cunt', 'shit', 'piss', 'poop', 'fart', 'butt', 'ass',
];
const WORD_ONLY = new Set(['shit', 'rape', 'cum', 'sex', 'ntr', 'ass', 'anal', 'tits', 'yuri', 'kys', 'preg', 'butt', 'fag', 'piss', 'dick', 'cock']);

export type BadReason = 'blacklist' | 'gibberish';

/** Innocent words that contain a blacklisted substring. */
const ALLOW = ['breastplate', 'hypnos', 'hypnotoad', 'virginia'];

export function badName(name: string): BadReason | null {
  let low = name.toLowerCase();
  for (const a of ALLOW) low = low.split(a).join(' ');
  const words = low.split(/[^a-z]+/).filter(Boolean);
  for (const w of NAME_BLACKLIST) {
    if (WORD_ONLY.has(w) ? words.includes(w) : low.includes(w)) return 'blacklist';
  }
  if (gibberish(name)) return 'gibberish';
  return null;
}

/** Gibberish: a run-together token of 18+ letters, 4+ repeated characters, no vowels in a 6+ letter word,
 * keyboard mashes, or mostly digits/symbols. */
export function gibberish(name: string): boolean {
  const s = name.trim();
  if (!/[A-Za-z]{2}/.test(s)) return true;
  if (/([A-Za-z])\1{3,}/.test(s)) return true;
  if (/(asdf|qwer|zxcv|hjkl|jkl;|sdfg|dfgh)/i.test(s)) return true;
  const letters = (s.match(/[A-Za-z]/g) ?? []).length;
  if (letters / s.replace(/\s/g, '').length < 0.5) return true;
  for (const w of s.split(/[^A-Za-z]+/)) {
    if (w.length >= 18) return true;
    if (w.length >= 6 && !/[aeiouyAEIOUY]/.test(w)) return true;
  }
  return false;
}

const PREFIX = ['Wandering', 'Silent', 'Ashen', 'Feral', 'Hollow', 'Grim', 'Pale', 'Iron', 'Shadow', 'Ancient', 'Lost', 'Crimson'];
const RACE_NOUN: Record<string, string> = {
  Arthropod: 'Crawler', Giant: 'Colossus', Sprite: 'Wisp', Celestial: 'Seraph', Avion: 'Raptor', Beast: 'Prowler',
  Undead: 'Revenant', Mechanoid: 'Automaton', Dragonkin: 'Drake', Daimon: 'Fiend', Reptilian: 'Lurker', Humanoid: 'Wanderer', Elemental: 'Shard',
};

/** Deterministic neutral name from race + monster id, e.g. "Ashen Drake #81535". */
export function neutralName(race: string, id: number): string {
  return `${PREFIX[id % PREFIX.length]} ${RACE_NOUN[race] ?? 'Creature'} #${id}`;
}

/** Monster rows with bad names get a neutral name; every stat column is kept. */
export function cleanRow<T extends [number, string, string, ...unknown[]]>(row: T): T {
  if (!badName(row[2])) return row;
  const r = row.slice() as T;
  r[2] = neutralName(row[1], row[0]);
  return r;
}
