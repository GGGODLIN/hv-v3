/** CP3-fix 11: monster body type for the procedural sprites. Source: only monsters.json (race column, then name keywords
 * using the plain English meaning of the word). Names are player-submitted, so a clear keyword wins over the race. */
export type Body = 'bird' | 'bug' | 'beast' | 'undead' | 'mech' | 'dragon' | 'humanoid' | 'spirit';
export const BODIES: Body[] = ['bird', 'bug', 'beast', 'undead', 'mech', 'dragon', 'humanoid', 'spirit'];

export const RACE_BODY: Record<string, Body> = {
  Avion: 'bird', Arthropod: 'bug', Beast: 'beast', Undead: 'undead', Mechanoid: 'mech',
  Dragonkin: 'dragon', Reptilian: 'dragon', Giant: 'humanoid', Humanoid: 'humanoid', Daimon: 'humanoid',
  Elemental: 'spirit', Celestial: 'spirit', Sprite: 'spirit',
};

const KEYWORDS: [RegExp, Body][] = [
  [/\b(phoenix|bird|hawk|eagle|crow|raven|owl|griffin|gryphon|harpy|falcon|chocobo|penguin|chicken)\b/i, 'bird'],
  [/\b(spider|ant|bee|wasp|beetle|scorpion|mantis|locust|centipede|insect|bug|moth)\b/i, 'bug'],
  [/\b(dragon|drake|wyvern|wyrm|serpent|lizard|hydra|basilisk)\b/i, 'dragon'],
  [/\b(skeleton|zombie|ghoul|lich|ghost|wraith|mummy|vampire|revenant|specter|spectre)\b/i, 'undead'],
  [/\b(robot|mech|android|golem|cyborg|machine|automaton|tank|drone)\b/i, 'mech'],
  [/\b(wolf|dog|cat|bear|tiger|lion|fox|boar|horse|rat|hound|kitten|puppy|bunny|rabbit)\b/i, 'beast'],
];

export function bodyOf(race: string, name = ''): Body {
  for (const [re, b] of KEYWORDS) if (re.test(name)) return b;
  return RACE_BODY[race] ?? 'beast';
}
