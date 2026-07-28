const canvas = document.querySelector('#map');
const ctx = canvas.getContext('2d');
const floorEl = document.querySelector('#floor');
const goldEl = document.querySelector('#gold');
const healthEl = document.querySelector('#health');
const healthText = document.querySelector('#healthText');
const eventEl = document.querySelector('#event');
const logEl = document.querySelector('#log');
const upgradeEl = document.querySelector('#upgrade');
const choicesEl = document.querySelector('#choices');
const endEl = document.querySelector('#end');
const endKicker = document.querySelector('#endKicker');
const endTitle = document.querySelector('#endTitle');

const W = 15, H = 11, TILE = 40;
const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
let map, player, enemies, loot, stairs, logs, active;
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const same = (a, b) => a.x === b.x && a.y === b.y;

function roomCarve(grid, room) { for (let y = room.y; y < room.y + room.h; y += 1) for (let x = room.x; x < room.x + room.w; x += 1) grid[y][x] = 0; }
function corridor(grid, from, to) { for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x += 1) grid[from.y][x] = 0; for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y += 1) grid[y][to.x] = 0; }
function floorSpots() { const spots = []; map.forEach((row, y) => row.forEach((wall, x) => { if (!wall) spots.push({ x, y }); })); return spots; }
function freeSpot() { const occupied = [player, stairs, ...enemies, ...loot].filter(Boolean); const choices = floorSpots().filter((spot) => !occupied.some((thing) => same(thing, spot))); return choices[random(0, choices.length - 1)]; }

function buildFloor() {
  map = Array.from({ length: H }, () => Array(W).fill(1));
  const rooms = [];
  for (let i = 0; i < 4; i += 1) {
    const room = { x: random(1, 9), y: random(1, 6), w: random(3, 5), h: random(3, 4) };
    room.x = Math.min(room.x, W - room.w - 1); room.y = Math.min(room.y, H - room.h - 1);
    roomCarve(map, room); rooms.push({ x: room.x + Math.floor(room.w / 2), y: room.y + Math.floor(room.h / 2) });
    if (rooms.length > 1) corridor(map, rooms[rooms.length - 2], rooms[rooms.length - 1]);
  }
  player.x = rooms[0].x; player.y = rooms[0].y;
  enemies = []; loot = []; stairs = null;
  stairs = freeSpot();
  for (let i = 0; i < 3 + player.floor; i += 1) { const pos = freeSpot(); enemies.push({ ...pos, hp: 5 + player.floor * 2, attack: 2 + Math.floor(player.floor / 2), type: i % 3 }); }
  for (let i = 0; i < 3; i += 1) { const pos = freeSpot(); loot.push({ ...pos, type: i === 0 ? 'potion' : i === 1 ? 'gold' : 'scroll' }); }
  say(`Floor ${player.floor}: find the stairs.`); render();
}

function start() { player = { x: 0, y: 0, floor: 1, hp: 18, maxHp: 18, attack: 4, gold: 0, xp: 0, level: 1 }; logs = []; active = true; endEl.hidden = true; buildFloor(); }
function say(text) { logs.unshift(text); logs = logs.slice(0, 3); eventEl.textContent = text; logEl.innerHTML = logs.map((line) => `<span>${line}</span>`).join(''); }
function blocked(x, y) { return x < 0 || y < 0 || x >= W || y >= H || map[y][x]; }

function move(name) {
  if (!active || !upgradeEl.hidden || !endEl.hidden) return;
  const [dx, dy] = directions[name]; const next = { x: player.x + dx, y: player.y + dy };
  if (blocked(next.x, next.y)) { say('A stone wall blocks the way.'); return; }
  const enemy = enemies.find((unit) => same(unit, next));
  if (enemy) attack(enemy); else { player.x = next.x; player.y = next.y; collect(); if (same(player, stairs)) { player.floor += 1; buildFloor(); return; } say('You move deeper into the ruins.'); }
  if (!active) { render(); return; }
  enemyTurn(); render();
}

function attack(enemy) {
  const damage = random(Math.max(1, player.attack - 1), player.attack + 2); enemy.hp -= damage; say(`You strike for ${damage} damage.`);
  if (enemy.hp <= 0) { enemies.splice(enemies.indexOf(enemy), 1); player.xp += 1; player.gold += random(2, 6); say('Enemy defeated. You gather gold.'); if (player.xp >= player.level * 3) levelUp(); }
}
function collect() {
  const item = loot.find((drop) => same(drop, player)); if (!item) return;
  loot.splice(loot.indexOf(item), 1);
  if (item.type === 'potion') { const heal = Math.min(8, player.maxHp - player.hp); player.hp += heal; say(`You drink a potion and recover ${heal} health.`); }
  if (item.type === 'gold') { const value = random(8, 15); player.gold += value; say(`You find ${value} gold.`); }
  if (item.type === 'scroll') { player.attack += 1; say('A battle scroll grants +1 attack.'); }
}
function enemyTurn() {
  for (const enemy of enemies) {
    const distance = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
    if (distance === 1) { const damage = random(1, enemy.attack); player.hp -= damage; say(`A creature hits you for ${damage}.`); if (player.hp <= 0) return end(false); continue; }
    if (distance <= 6) {
      const dx = player.x === enemy.x ? 0 : player.x > enemy.x ? 1 : -1;
      const dy = player.y === enemy.y ? 0 : player.y > enemy.y ? 1 : -1;
      const step = Math.random() < .5 ? { x: enemy.x + dx, y: enemy.y } : { x: enemy.x, y: enemy.y + dy };
      if (!blocked(step.x, step.y) && !enemies.some((other) => other !== enemy && same(other, step)) && !same(step, player)) { enemy.x = step.x; enemy.y = step.y; }
    }
  }
}
function levelUp() {
  active = false; upgradeEl.hidden = false;
  const options = [{ name: 'Iron heart', text: '+6 maximum health, restore 6', apply: () => { player.maxHp += 6; player.hp += 6; } }, { name: 'Keen blade', text: '+2 attack damage', apply: () => { player.attack += 2; } }, { name: 'Treasure sense', text: '+20 gold', apply: () => { player.gold += 20; } }];
  choicesEl.innerHTML = '';
  options.forEach((option) => { const button = document.createElement('button'); button.innerHTML = `<strong>${option.name}</strong><small>${option.text}</small>`; button.onclick = () => { option.apply(); player.level += 1; player.xp = 0; active = true; upgradeEl.hidden = true; say(`${option.name} acquired.`); render(); }; choicesEl.append(button); });
}
function end(victory) { active = false; endKicker.textContent = victory ? 'A legend is born' : 'The dungeon claims another hero'; endTitle.textContent = victory ? 'Dungeon cleared' : `Reached floor ${player.floor}`; endEl.hidden = false; }

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  map.forEach((row, y) => row.forEach((wall, x) => { ctx.fillStyle = wall ? '#303650' : '#1e243b'; ctx.fillRect(x * TILE, y * TILE, TILE, TILE); if (!wall) { ctx.strokeStyle = 'rgba(112,126,158,.14)'; ctx.strokeRect(x * TILE, y * TILE, TILE, TILE); } }));
  ctx.fillStyle = '#c3a265'; ctx.fillRect(stairs.x * TILE + 10, stairs.y * TILE + 6, 20, 28); ctx.fillStyle = '#101426'; ctx.fillRect(stairs.x * TILE + 16, stairs.y * TILE + 15, 8, 19);
  loot.forEach((item) => { ctx.fillStyle = item.type === 'potion' ? '#e16d85' : item.type === 'gold' ? '#f2c769' : '#83d9d0'; ctx.beginPath(); ctx.arc(item.x * TILE + 20, item.y * TILE + 20, 8, 0, Math.PI * 2); ctx.fill(); });
  enemies.forEach((enemy) => { ctx.fillStyle = ['#b05d78', '#aa7460', '#8b6eae'][enemy.type]; ctx.fillRect(enemy.x * TILE + 8, enemy.y * TILE + 8, 24, 24); ctx.fillStyle = '#1a1728'; ctx.fillRect(enemy.x * TILE + 13, enemy.y * TILE + 15, 4, 4); ctx.fillRect(enemy.x * TILE + 23, enemy.y * TILE + 15, 4, 4); });
  ctx.fillStyle = '#6bd2c9'; ctx.beginPath(); ctx.arc(player.x * TILE + 20, player.y * TILE + 20, 13, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#123b40'; ctx.fillRect(player.x * TILE + 14, player.y * TILE + 16, 4, 4); ctx.fillRect(player.x * TILE + 23, player.y * TILE + 16, 4, 4);
  floorEl.textContent = player.floor; goldEl.textContent = player.gold; healthText.textContent = `${player.hp} / ${player.maxHp}`; healthEl.style.width = `${Math.max(0, player.hp / player.maxHp * 100)}%`;
}

document.querySelectorAll('[data-move]').forEach((button) => button.addEventListener('click', () => move(button.dataset.move)));
window.addEventListener('keydown', (event) => { const mapping = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }; const direction = mapping[event.key] || mapping[event.key.toLowerCase()]; if (direction) { event.preventDefault(); move(direction); } });
document.querySelector('#newGame').addEventListener('click', start); document.querySelector('#again').addEventListener('click', start); start();
