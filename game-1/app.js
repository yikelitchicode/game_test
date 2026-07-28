const canvas = document.querySelector('#arena');
const ctx = canvas.getContext('2d');
const massEl = document.querySelector('#mass');
const bestEl = document.querySelector('#best');
const leaderboardEl = document.querySelector('#leaderboard');
const startScreen = document.querySelector('#startScreen');
const gameOverEl = document.querySelector('#gameOver');
const nameInput = document.querySelector('#nameInput');
const finalMass = document.querySelector('#finalMass');
const playButton = document.querySelector('#playButton');
const againButton = document.querySelector('#againButton');
const crosshair = document.querySelector('.crosshair');

const WORLD = 2800;
const colors = ['#e64b3c', '#f1a11c', '#62bd47', '#ae55bf', '#ec6391', '#21a9c8', '#2f81cb'];
let pellets = [];
let bots = [];
let player;
let target = { x: 0, y: 0 };
let running = false;
let best = Number(localStorage.getItem('cell_clash_best') || 0);
let lastTime = 0;

bestEl.textContent = best;

function random(min, max) { return min + Math.random() * (max - min); }
function radius(cell) { return Math.sqrt(cell.mass) * 2.7; }
function makeCell(name, mass, x = random(120, WORLD - 120), y = random(120, WORLD - 120), color) {
  return { name, mass, x, y, color: color || colors[Math.floor(Math.random() * colors.length)], angle: random(0, Math.PI * 2), turn: 0 };
}

function reset() {
  const name = nameInput.value.trim().slice(0, 14) || 'Player';
  player = makeCell(name, 85, WORLD / 2, WORLD / 2, '#2b9bd3');
  pellets = Array.from({ length: 360 }, () => ({ x: random(25, WORLD - 25), y: random(25, WORLD - 25), color: colors[Math.floor(Math.random() * colors.length)] }));
  bots = ['Mango', 'Clover', 'Nova', 'Pepper', 'Miso', 'Orbit', 'Biscuit', 'Pico', 'Echo', 'Waffle']
    .map((name, index) => makeCell(name, 35 + index * 21));
  target = { x: player.x, y: player.y };
  running = true;
  startScreen.hidden = true;
  gameOverEl.hidden = true;
}

function update(dt) {
  if (!running) return;
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const distance = Math.hypot(dx, dy);
  const speed = 260 / Math.pow(player.mass / 60, .22);
  if (distance > 3) {
    const step = Math.min(distance, speed * dt);
    player.x += dx / distance * step;
    player.y += dy / distance * step;
  }
  player.x = Math.max(radius(player), Math.min(WORLD - radius(player), player.x));
  player.y = Math.max(radius(player), Math.min(WORLD - radius(player), player.y));

  pellets = pellets.filter((pellet) => {
    if (Math.hypot(pellet.x - player.x, pellet.y - player.y) < radius(player) + 4) {
      player.mass += 1;
      return false;
    }
    return true;
  });
  while (pellets.length < 360) pellets.push({ x: random(25, WORLD - 25), y: random(25, WORLD - 25), color: colors[Math.floor(Math.random() * colors.length)] });

  bots.forEach((bot) => {
    bot.turn -= dt;
    if (bot.turn <= 0) {
      bot.angle += random(-1.2, 1.2);
      bot.turn = random(.7, 2.5);
    }
    const separation = Math.hypot(player.x - bot.x, player.y - bot.y);
    if (separation < 320) {
      const towardPlayer = Math.atan2(player.y - bot.y, player.x - bot.x);
      bot.angle = towardPlayer + (player.mass > bot.mass ? Math.PI : 0);
    }
    const botSpeed = 92 / Math.pow(bot.mass / 45, .18);
    bot.x = Math.max(radius(bot), Math.min(WORLD - radius(bot), bot.x + Math.cos(bot.angle) * botSpeed * dt));
    bot.y = Math.max(radius(bot), Math.min(WORLD - radius(bot), bot.y + Math.sin(bot.angle) * botSpeed * dt));
  });

  for (let i = bots.length - 1; i >= 0; i -= 1) {
    const bot = bots[i];
    const distanceToBot = Math.hypot(bot.x - player.x, bot.y - player.y);
    if (distanceToBot < Math.max(radius(bot), radius(player)) * .62 && Math.abs(player.mass - bot.mass) > 18) {
      if (player.mass > bot.mass) {
        player.mass += Math.round(bot.mass * .72);
        bots.splice(i, 1);
      } else {
        endGame();
        break;
      }
    }
  }
  while (bots.length < 10) bots.push(makeCell('Sprout', random(45, 160)));
  massEl.textContent = Math.floor(player.mass);
}

function endGame() {
  running = false;
  best = Math.max(best, Math.floor(player.mass));
  localStorage.setItem('cell_clash_best', best);
  bestEl.textContent = best;
  finalMass.textContent = `Mass ${Math.floor(player.mass)}`;
  gameOverEl.hidden = false;
}

function drawCell(cell, camera) {
  const x = cell.x - camera.x;
  const y = cell.y - camera.y;
  const r = radius(cell);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = cell.color;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * .075);
  ctx.strokeStyle = 'rgba(0, 0, 0, .14)';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `800 ${Math.max(11, Math.min(20, r * .42))}px Trebuchet MS`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cell.name, x, y);
}

function render() {
  const width = canvas.width = window.innerWidth * devicePixelRatio;
  const height = canvas.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  const viewW = width / devicePixelRatio;
  const viewH = height / devicePixelRatio;
  const camera = { x: (player?.x || WORLD / 2) - viewW / 2, y: (player?.y || WORLD / 2) - viewH / 2 };

  ctx.fillStyle = '#f6f8f4';
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.strokeStyle = '#e3e8e2';
  ctx.lineWidth = 1;
  const grid = 50;
  for (let x = -((camera.x % grid) + grid); x < viewW + grid; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, viewH); ctx.stroke(); }
  for (let y = -((camera.y % grid) + grid); y < viewH + grid; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(viewW, y); ctx.stroke(); }

  pellets.forEach((pellet) => {
    ctx.beginPath();
    ctx.arc(pellet.x - camera.x, pellet.y - camera.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = pellet.color;
    ctx.fill();
  });
  bots.sort((a, b) => a.mass - b.mass).forEach((bot) => drawCell(bot, camera));
  if (player) drawCell(player, camera);
  updateLeaderboard();
}

function updateLeaderboard() {
  if (!player) return;
  const ranked = [...bots, player].sort((a, b) => b.mass - a.mass).slice(0, 8);
  leaderboardEl.innerHTML = ranked.map((cell) => `<li class="${cell === player ? 'you' : ''}">${cell.name}</li>`).join('');
}

function loop(time) {
  const dt = Math.min(.04, (time - lastTime) / 1000 || 0);
  lastTime = time;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function aim(clientX, clientY) {
  if (!player) return;
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left - rect.width / 2;
  const y = clientY - rect.top - rect.height / 2;
  target = { x: player.x + x, y: player.y + y };
  crosshair.style.left = `${clientX}px`;
  crosshair.style.top = `${clientY}px`;
}

window.addEventListener('pointermove', (event) => aim(event.clientX, event.clientY));
canvas.addEventListener('pointerdown', (event) => aim(event.clientX, event.clientY));
playButton.addEventListener('click', reset);
againButton.addEventListener('click', reset);
nameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') reset(); });
requestAnimationFrame(loop);
