class BoonManager {
  constructor() {
    // 玩家目前裝備的祝福 (以 Slot 作為 Key，避免同類槽位重複覆蓋)
    this.equippedBoons = {
      attack: null,
      special: null,
      cast: null,
      sprint: null,
      mana: null,
      passive: [] // 被動/不佔用主槽位的祝福
    };
  }

  // 1. 裝備祝福 (根據稀有度動態計算數值)
  equipBoon(boonData, rarity = 'common') {
    const multiplier = boonData.rarityMultipliers[rarity] || 1.0;

    // 深拷貝並計算稀有度後的最終數值
    const processedBoon = JSON.parse(JSON.stringify(boonData));
    processedBoon.rarity = rarity;

    // 計算Modifiers數值
    if (processedBoon.modifiers) {
      processedBoon.modifiers.forEach(mod => {
        mod.computedValue = mod.value * multiplier;
      });
    }

    // 計算固定傷害效果數值
    if (processedBoon.onHitEffect && processedBoon.onHitEffect.baseDamage) {
      processedBoon.onHitEffect.computedDamage = Math.round(processedBoon.onHitEffect.baseDamage * multiplier);
    }

    // 放入對應槽位
    if (this.equippedBoons.hasOwnProperty(processedBoon.slot)) {
      this.equippedBoons[processedBoon.slot] = processedBoon;
    } else {
      this.equippedBoons.passive.push(processedBoon);
    }

    console.log(`[Boon] 裝備了 ${rarity.toUpperCase()} 級別的【${processedBoon.name}】`);
  }

  // 2. 動態計算指定屬性的最終數值 (例如計算普通攻擊傷害)
  calculateStat(statName, baseValue) {
    let flatAdd = 0;
    let percentAdd = 0;

    // 遍歷所有已裝備的祝福
    const allBoons = [
      ...Object.values(this.equippedBoons).filter(b => b && b.modifiers),
      ...this.equippedBoons.passive
    ];

    allBoons.forEach(boon => {
      if (!boon.modifiers) return;
      boon.modifiers.forEach(mod => {
        if (mod.stat === statName) {
          if (mod.type === 'flat') {
            flatAdd += mod.computedValue;
          } else if (mod.type === 'percent') {
            percentAdd += mod.computedValue;
          }
        }
      });
    });

    // 計算公式：(基礎值 + 固定加成) * (1 + 百分比總和)
    const finalValue = (baseValue + flatAdd) * (1 + percentAdd);
    return finalValue;
  }

  // 3. 觸發攻擊時，獲取該 Slot 的附加狀態與特效
  getHitEffects(slot) {
    const boon = this.equippedBoons[slot];
    if (!boon) return null;

    return {
      statusEffect: boon.statusEffect || null,
      onHitEffect: boon.onHitEffect || null
    };
  }
}

// ==========================================
// 💡 使用範例測試：
// ==========================================

const playerBoons = new BoonManager();

// 假設從 JSON 載入的 Apollo 攻擊祝福
const apolloAttack = {
  id: "apollo_attack_1",
  name: "熾耀耀擊",
  slot: "attack",
  modifiers: [
    { stat: "attackDamage", type: "percent", value: 0.40 },
    { stat: "attackArea", type: "percent", value: 0.30 }
  ],
  statusEffect: { id: "daze", name: "眩目" },
  rarityMultipliers: { common: 1.0, rare: 1.3, epic: 1.6, heroic: 2.0 }
};

// 裝備 EPIC (史詩) 稀有度的阿波羅攻擊
playerBoons.equipBoon(apolloAttack, 'epic');

// 基礎攻擊力為 20
const baseAttack = 20;
const finalAttack = playerBoons.calculateStat("attackDamage", baseAttack);
const attackAreaMult = playerBoons.calculateStat("attackArea", 1.0);

console.log(`基礎攻擊力: ${baseAttack}`);
console.log(`Epic 算後攻擊力: ${finalAttack}`); // 20 * (1 + 0.4 * 1.6) = 20 * 1.64 = 32.8
console.log(`攻擊範圍倍率: ${attackAreaMult}x`); // 1.0 * (1 + 0.3 * 1.6) = 1.48x

// 攻擊命中敵人時獲取 Effect
const hitEffects = playerBoons.getHitEffects('attack');
console.log("命中效果與 Debuff:", hitEffects);