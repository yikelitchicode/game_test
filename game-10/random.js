function generateBoonOptions(allBoonsPool, count = 3) {
  // 1. 隨機決定稀有度（模擬 Hades 2 隨機抽樣）
  const getRandRarity = () => {
    const rand = Math.random();
    if (rand < 0.05) return 'heroic'; // 5%
    if (rand < 0.20) return 'epic';    // 15%
    if (rand < 0.50) return 'rare';    // 30%
    return 'common';                   // 50%
  };

  // 2. 從可選池洗牌抽出不重複的祝福
  const shuffled = [...allBoonsPool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  // 3. 為每個選出的祝福綁定本次抽到的稀有度
  return selected.map(boon => ({
    boonData: boon,
    offeredRarity: getRandRarity()
  }));
}