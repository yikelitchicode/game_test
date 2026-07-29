// ==========================================
// 🎮 1. 玩家戰鬥實體 (Player Combat Entity)
// ==========================================
class Player {
  constructor() {
    this.x = 400;
    this.y = 300;
    
    // 基礎數值 (Base Stats)
    this.stats = {
      attackDamage: 20,
      attackRadius: 30,
      castRadius: 80,
      sprintSpeed: 5
    };

    // 裝備的神恩管理器 (繼承先前設計的 BoonManager)
    this.boonManager = new BoonManager();
  }

  // 獲取計算祝福後的「最終攻擊傷害」
  get finalAttackDamage() {
    return this.boonManager.calculateStat('attackDamage', this.stats.attackDamage);
  }

  // 獲取計算祝福後的「最終攻擊範圍」
  get finalAttackRadius() {
    return this.boonManager.calculateStat('attackArea', this.stats.attackRadius);
  }

  // 普通攻擊判定 (帶入祝福效果與 Status Debuff)
  performAttack(enemy) {
    const damage = this.finalAttackDamage;
    const hitEffects = this.boonManager.getHitEffects('attack');

    console.log(`[攻擊] 對敵人造成 ${damage} 點傷害！(範圍倍率: ${(this.finalAttackRadius / this.stats.attackRadius).toFixed(2)}x)`);

    // 如果祝福帶有狀態效果 (例如阿波羅的 眩目 Daze)
    if (hitEffects && hitEffects.statusEffect) {
      enemy.applyStatus(hitEffects.statusEffect);
    }
  }
}

// ==========================================
// 🏆 2. 房間通關與 UI 觸發流程 (Game Flow)
// ==========================================
class GameManager {
  constructor() {
    this.player = new Player();
    this.isPaused = false;
  }

  // 房間通關，開啓祝福三選一 UI
  onRoomCleared() {
    this.isPaused = true; // 暫停遊戲邏輯

    // 隨機抽取 3 個祝福 (模擬從 Apollo 池中抽取)
    const options = generateBoonOptions(apolloBoonPool, 3);

    // 呼叫先前寫好的 UI 渲染函數
    showBoonSelectionUI(options, (selectedBoonOption) => {
      // 玩家點擊選擇後的回呼函式 (Callback)
      this.player.boonManager.equipBoon(
        selectedBoonOption.boonData, 
        selectedBoonOption.offeredRarity
      );

      this.isPaused = false; // 恢復遊戲
      console.log("▶️ 遊戲繼續，祝福已動態生效！");
    });
  }
}