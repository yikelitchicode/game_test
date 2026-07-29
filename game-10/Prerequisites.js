// 1. Duo Boon 資料定義
const duoBoons = [
  {
    id: "duo_apollo_zeus",
    name: "日熾雷霆 (Sun Thunder)",
    gods: ["Apollo", "Zeus"],
    description: "你的【法陣】在向外擴張的同時，會不斷對陣內敵人降下連環落雷。",
    // 前置解鎖條件：玩家必須同時擁有 Apollo 的攻擊/法陣 AND Zeus 的特攻/法陣
    prerequisites: {
      Apollo: ["apollo_attack", "apollo_cast"],
      Zeus: ["zeus_special", "zeus_cast"]
    },
    effect: {
      type: "expanding_lightning_cast"
    }
  }
];

// 2. 檢測玩家是否滿足 Duo Boon 出現條件
function checkDuoBoonAvailability(playerBoonManager, duoBoon) {
  const equippedList = playerBoonManager.getAllEquippedBoonIds();

  // 檢查每一個要求的神祇是否都滿足至少一個前置祝福
  for (const god in duoBoon.prerequisites) {
    const requiredIds = duoBoon.prerequisites[god];
    const hasGodRequirement = requiredIds.some(id => equippedList.includes(id));

    if (!hasGodRequirement) {
      return false; // 只要有一個神的前置沒達到，就不會刷出 Duo
    }
  }

  return true; // 滿足前置條件！可以加入抽樣池
}