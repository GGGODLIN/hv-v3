/** CP3 polish: Chinese display names for equipment, same compact style as monster names (`稱號・名`).
 * All translations are this project's own (暫定). The sourced English keys / names in constants are kept untouched;
 * name generation never reads or changes stats. */
export const PREFIX_ZH: Record<string, string> = {
  ethereal: '虛靈', fiery: '烈焰', arctic: '極寒', shocking: '雷擊', tempestuous: '暴風', hallowed: '神聖', demonic: '惡魔',
  mithril: '秘銀', reinforced: '強固', agile: '靈巧', ruby: '紅玉', cobalt: '鈷藍', amber: '琥珀', jade: '翡翠', zircon: '鋯石',
  onyx: '瑪瑙', charged: '蓄能', frugal: '節能', radiant: '光輝', mystic: '神秘', savage: '野蠻', shielding: '護盾',
};
export const SUFFIX_ZH: Record<string, string> = {
  slaughter: '殺戮', balance: '平衡', swiftness: '迅捷', nimble: '敏捷者', barrier: '屏障', fleet: '疾行者', shadowdancer: '影舞者',
  battlecaster: '戰鬥法師', focus: '專注', arcanist: '奧術師', vampire: '吸血鬼', illithid: '奪心魔', banshee: '報喪女妖',
  destruction: '毀滅', surtr: '蘇爾特', niflheim: '尼福爾海姆', mjolnir: '雷神鎚', freyr: '弗雷', heimdall: '海姆達爾', fenrir: '芬里爾',
  elementalist: '元素使', heavenSent: '天降者', demonFiend: '魔鬼', earthWalker: '行地者', curseWeaver: '織咒者',
  protection: '守護', warding: '防衛', negation: '抵消', dampening: '減幅', deflection: '偏轉', stoneskin: '石膚',
  fireEater: '噬火者', frostBorn: '霜生者', thunderChild: '雷童', windWaker: '喚風者', thriceBlessed: '三重祝福', spiritWard: '靈守',
  ox: '公牛', raccoon: '浣熊', cheetah: '獵豹', turtle: '海龜', fox: '狐狸', owl: '貓頭鷹',
};
export const BASE_ZH: Record<string, string> = {
  axe: '斧', club: '棍棒', rapier: '細劍', shortsword: '短劍', wakizashi: '脇差', dagger: '匕首', longsword: '長劍', estoc: '刺劍',
  mace: '釘錘', katana: '太刀', scythe: '鐮刀', swordchucks: '劍節棍',
  oak: '橡木杖', redwood: '紅木杖', willow: '柳木杖', katalox: '鐵木杖', ebony: '烏木杖',
  buckler: '圓盾', kite: '鳶盾', tower: '塔盾', force: '力場盾',
  cotton: '棉布', gossamer: '薄紗', ironsilk: '鐵絲', phase: '相位', leather: '皮革', drakehide: '龍皮', kevlar: '克維拉', shade: '暗影',
  plate: '板甲', chain: '鎖子', reactive: '反應', power: '動力',
};
export const ARMOR_SLOT_ZH: Record<string, Record<string, string>> = {
  cloth: { head: '帽', body: '長袍', hands: '手套', legs: '褲', feet: '鞋' },
  light: { head: '頭盔', body: '胸甲', hands: '護手', legs: '護腿', feet: '靴' },
  heavy: { head: '頭盔', body: '胸鎧', hands: '鐵手套', legs: '脛甲', feet: '鐵靴' },
  power: { head: '頭盔', body: '裝甲', hands: '鐵手套', legs: '護腿', feet: '靴' },
};
