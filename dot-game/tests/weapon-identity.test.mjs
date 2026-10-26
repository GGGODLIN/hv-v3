import {generateItem as preParryGenerateItem} from './fixtures/v0.14/loot.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { generateItem, resolveWeaponFamily, describeWeaponTrait, describeItemFlavor, scoreItem, WEAPON_FAMILIES } from '../src/loot.js';

function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
}

test('generated weapons carry explicit family while other slots do not', () => {
  const rng = seeded(71), seen = new Set();
  for (let i = 0; i < 1800; i++) {
    const item = generateItem(rng, 1 + i % 80);
    if (item.slot === 'weapon') {
      assert.ok(WEAPON_FAMILIES.includes(item.weaponFamily));
      assert.equal(resolveWeaponFamily(item), item.weaponFamily);
      const { weaponFamily, ...legacy } = item;
      assert.equal(resolveWeaponFamily(legacy), weaponFamily, 'our legacy generated names remain recoverable');
      seen.add(weaponFamily);
    } else {
      assert.equal(Object.hasOwn(item, 'weaponFamily'), false);
      assert.equal(resolveWeaponFamily(item), null);
    }
  }
  assert.deepEqual([...seen].sort(), [...WEAPON_FAMILIES].sort());
  assert.equal(Object.isFrozen(WEAPON_FAMILIES), true);
});

test('supported explicit identity is authoritative, slot-bound, and independent of names', () => {
  for (const family of WEAPON_FAMILIES) {
    const item = Object.freeze({ slot: 'weapon', name: '自訂名稱', weaponFamily: family });
    assert.equal(resolveWeaponFamily(item), family);
    assert.equal(resolveWeaponFamily({ ...item, slot: 'armor' }), null);
    assert.equal(resolveWeaponFamily({ ...item, slot: 'accessory' }), null);
  }
  assert.equal(resolveWeaponFamily({ slot: 'weapon', name: '普通・逐風刺劍', weaponFamily: 'axe' }), 'axe');
});

test('legacy migration recognizes only complete legal generated names', () => {
  const cases = [
    ['粗製・暮鋼戰斧', 'axe'], ['尚可・暮鋼戰斧', 'axe'], ['普通・堅守暮鋼戰斧・屠戮', 'axe'],
    ['粗製・逐風刺劍', 'rapier'], ['普通・逐風刺劍', 'rapier'], ['優良・逐風刺劍・平衡', 'rapier'],
    ['精良・銳意逐風刺劍・屠戮', 'rapier'], ['華麗・逐風刺劍・平衡', 'rapier'],
    ['傳奇・流風逐風刺劍・平衡', 'rapier'], ['無雙・獵隙逐風刺劍・屠戮', 'rapier'],
    ['粗製・裂岩戰棍', 'club'], ['普通・堅守裂岩戰棍', 'club'], ['傳奇・銳意裂岩戰棍・平衡', 'club'],
  ];
  for (const [name, family] of cases) assert.equal(resolveWeaponFamily({ slot: 'weapon', name }), family);
  for (const name of [
    '逐風刺劍', '陌生刺劍', '普通・未知刺劍', '普通・逐風刺劍 ', ' 普通・逐風刺劍',
    '普通・逐風刺劍\n', '普通・逐風刺劍的仿製品', '普通・逐風刺劍・追風',
    '普通・逐風刺劍・平衡・屠戮', '優良・暮鋼戰斧・平衡', '粗製・銳意逐風刺劍',
    '粗製・逐風刺劍・屠戮', '優良・逐風刺劍', '傳奇・逐風刺劍・平衡',
    '普通・陌生逐風刺劍', '普通·逐風刺劍', '',
  ]) assert.equal(resolveWeaponFamily({ slot: 'weapon', name }), null, name);
});

test('unknown explicit metadata never falls back to a recognizable legacy name', () => {
  for (const weaponFamily of [null, undefined, '', 'sword', 'Rapier', ' rapier', false, 1, [], {}, ['rapier']]) {
    assert.equal(resolveWeaponFamily({ slot: 'weapon', name: '普通・逐風刺劍', weaponFamily }), null);
  }
  const disabled = { slot: 'weapon', name: '普通・逐風刺劍', weaponFamily: null };
  assert.equal(resolveWeaponFamily(JSON.parse(JSON.stringify(disabled))), null, 'null sentinel survives JSON');
  const inherited = Object.assign(Object.create({ weaponFamily: 'rapier' }), { slot: 'weapon', name: '普通・逐風刺劍' });
  assert.equal(resolveWeaponFamily(inherited), null, 'inherited metadata is not trusted identity');
});

test('malformed identity inputs stay inert and lookup does not mutate items', () => {
  for (const item of [null, undefined, true, 4, NaN, 'rapier', [], {}, { slot: 'weapon' }, { slot: 'weapon', name: 4 }]) {
    assert.equal(resolveWeaponFamily(item), null);
    assert.equal(typeof describeWeaponTrait(item), 'string');
  }
  const item = Object.freeze({ slot: 'weapon', name: '普通・逐風刺劍' });
  assert.equal(resolveWeaponFamily(item), 'rapier');
  assert.equal(Object.hasOwn(item, 'weaponFamily'), false);
});

test('trait text explains after-hit rapier utility and the implemented historical axe bleed', () => {
  const rapier = describeWeaponTrait({ slot: 'weapon', weaponFamily: 'rapier' });
  for (const expected of ['普攻造成傷害', '穿透護甲', '暴擊必定觸發', '該次傷害後', '一般物理減傷', '技能不會觸發']) {
    assert.ok(rapier.includes(expected), expected);
  }
  const axe = describeWeaponTrait({ slot: 'weapon', weaponFamily: 'axe' });
  for (const expected of ['流血傷口', '面板攻擊快照', '無類型傷害', '不是直擊傷害的比例', '滿層仍刷新', '技能與魔法不會觸發', '歷史模型改編']) assert.ok(axe.includes(expected), expected);
  assert.doesNotMatch(axe, /尚未實作武器特效/);
  assert.match(describeWeaponTrait({ slot: 'weapon', name: '陌生刺劍' }), /不會觸發武器特效/);
  assert.equal(describeWeaponTrait({ slot: 'armor', weaponFamily: 'rapier' }), '');
});

test('club trait explains eligible nonrefreshing stun, remaining block, and recovery action', () => {
  const club = describeWeaponTrait({ slot: 'weapon', weaponFamily: 'club' });
  for (const expected of ['普攻命中且造成傷害', '目標仍存活', '擊暈', '符合條件的暴擊必定觸發',
    '不能攻擊、閃避或招架', '格擋仍有效', '不能疊加或刷新', '下個玩家回合', '恢復行動', '技能不會觸發']) {
    assert.ok(club.includes(expected), expected);
  }
  assert.doesNotMatch(club, /尚未實作|永久|永遠|無限/);
  assert.equal(describeWeaponTrait({ slot: 'weapon', name: '粗製・裂岩戰棍' }), club);
});

test('fresh weapon descriptions keep flavor and affixes separate from live traits', () => {
  const rng = seeded(1);
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    const item = generateItem(rng, 5, 'weapon');
    seen.add(item.weaponFamily);
    assert.ok(item.description.includes('詞綴：'));
    assert.equal(item.description.includes(describeWeaponTrait(item)), false);
    assert.equal(describeItemFlavor(item), item.description);
    assert.ok(item.description.length <= 240, 'full generated description fits save sanitizer');
  }
  assert.deepEqual([...seen].sort(), [...WEAPON_FAMILIES].sort());
});

test('flavor display removes only one exact known trait suffix without rewriting old saves', () => {
  const flavor = '穩定的中量武器。詞綴：無。';
  const previousClubTrait = '戰棍：本版尚未實作武器特效。';
  const previousAxeTrait = '戰斧：本版尚未實作武器特效。';
  const traits = [...WEAPON_FAMILIES.map(weaponFamily => describeWeaponTrait({ slot: 'weapon', weaponFamily })),
    previousClubTrait, previousAxeTrait, describeWeaponTrait({ slot: 'weapon' })];
  for (const trait of traits) {
    const item = Object.freeze({ slot: 'weapon', name: '粗製・裂岩戰棍', description: flavor + trait });
    const before = JSON.stringify(item);
    assert.equal(describeItemFlavor(item), flavor);
    assert.equal(JSON.stringify(item), before, 'display cleanup must not mutate saved descriptions');
    assert.equal(describeItemFlavor({ ...item, slot: 'armor' }), item.description);
    assert.equal(describeItemFlavor({ ...item, description: trait + flavor }), trait + flavor, 'not a substring replacement');
    assert.equal(describeItemFlavor({ ...item, description: flavor + trait + trait }), flavor + trait, 'at most one suffix');
  }
  for (const description of [flavor, '玩家自訂備註。', flavor + previousClubTrait + '這是舊紀錄。', flavor + previousAxeTrait + '這是舊紀錄。']) {
    assert.equal(describeItemFlavor({ slot: 'weapon', description }), description, 'unrecognized prose is untouched');
  }
  for (const item of [null, undefined, {}, { description: 4 }, { description: ['文字'] }]) {
    assert.equal(describeItemFlavor(item), '');
  }
});

test('flat comparison score is family-independent and excludes proc utility', () => {
  const stats = { attack: 50, crit: .05, defense: 2, hp: 7 };
  const baseline = scoreItem({ stats });
  for (const weaponFamily of [...WEAPON_FAMILIES, null, 'unknown']) {
    assert.equal(scoreItem({ slot: 'weapon', weaponFamily, stats }), baseline);
  }
});

test('historical pre-parry: v0.4 trait prose preserves all 3000 baseline numeric rolls, RNG draws, names, and IDs', () => {
  // Fingerprints captured from v0.2 baseline loot.js before this metadata change.
  // Only the new identity field and explanatory prose are excluded.
  const baselines = [
    { seed: 1, calls: 8492, finalSeed: 2999494445, sha256: 'aa002ead19e0bfa92f2f6e09539e0b59310f6b610b52af8d75442070935b025f' },
    { seed: 71, calls: 8540, finalSeed: 4023059395, sha256: '906950cd56eac8be6f26242df87c88c35698714f62a66b4230d5805df0bb6c8e' },
    { seed: 1337, calls: 8437, finalSeed: 2853276008, sha256: 'c8328d803e66c24cc335d59e15871b2f9743f0c4d44e47f99c3e4cfa94d66d9f' },
  ];
  for (const baseline of baselines) {
    let state = baseline.seed, calls = 0;
    const rng = () => { calls++; state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 2 ** 32; };
    const hash = createHash('sha256');
    for (let i = 0; i < 1000; i++) {
      const { description, weaponFamily, ...item } = preParryGenerateItem(rng, 1 + i % 80, [undefined, 'weapon', 'armor', 'accessory'][i % 4]);
      hash.update(JSON.stringify(item) + '\n');
    }
    assert.equal(calls, baseline.calls);
    assert.equal(state, baseline.finalSeed);
    assert.equal(hash.digest('hex'), baseline.sha256);
  }
});
