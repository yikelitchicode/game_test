const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const gameCards = [...document.querySelectorAll('.game-card')];
const gamePanels = [...document.querySelectorAll('.game-panel')];

const W = canvas.width;
const H = canvas.height;
const lanePadding = 24;
const player = { x: W / 2 - 20, y: H - 64, w: 40, h: 40, speed: 6 };
let obstacles = [];
let keys = { left: false, right: false };
let score = 0;
let best = Number(localStorage.getItem('game_test_best') || 0);
let running = false;
let gameOver = false;
let frame = 0;
let activePanel = 'dodge';

bestEl.textContent = String(best);

function setPanel(panelName) {
  activePanel = panelName;

  gameCards.forEach((card) => {
    card.classList.toggle('active', card.dataset.game === panelName);
  });

  gamePanels.forEach((panel) => {
    const isActive = panel.dataset.panel === panelName;
    panel.hidden = !isActive;
    panel.classList.toggle('active', isActive);
  });

  statusEl.textContent = panelName === 'dodge' ? (running ? 'Playing' : gameOver ? 'Game Over' : 'Ready') : 'Browsing';
}

function reset() {
  setPanel('dodge');
  player.x = W / 2 - player.w / 2;
  obstacles = [];
  score = 0;
  frame = 0;
  running = true;
  gameOver = false;
  scoreEl.textContent = '0';
  statusEl.textContent = 'Playing';
}

function spawnObstacle() {
  const width = 36 + Math.random() * 48;
  obstacles.push({
    x: lanePadding + Math.random() * (W - lanePadding * 2 - width),
    y: -40,
    w: width,
    h: 18 + Math.random() * 18,
    speed: 3 + Math.random() * 3 + score * 0.02,
  });
}

function rectHit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  if (!running || activePanel !== 'dodge') return;

  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;
  player.x = Math.max(lanePadding, Math.min(W - lanePadding - player.w, player.x));

  frame += 1;
  if (frame % Math.max(18, 42 - Math.floor(score / 8)) === 0) spawnObstacle();

  obstacles.forEach((o) => {
    o.y += o.speed;
  });
  obstacles = obstacles.filter((o) => o.y < H + 40);

  for (const obstacle of obstacles) {
    if (rectHit(player, obstacle)) {
      running = false;
      gameOver = true;
      statusEl.textContent = 'Game Over';
      best = Math.max(best, score);
      localStorage.setItem('game_test_best', String(best));
      bestEl.textContent = String(best);
      return;
    }
  }

  if (frame % 6 === 0) {
    score += 1;
    scoreEl.textContent = String(score);
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b1120');
  bg.addColorStop(1, '#111827');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(148,163,184,.18)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 16]);
  for (let x = W / 4; x < W; x += W / 4) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawPlayer() {
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.roundRect(player.x, player.y, player.w, player.h, 12);
  ctx.fill();

  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(player.x + 8, player.y + 10, 8, 8);
  ctx.fillRect(player.x + 24, player.y + 10, 8, 8);
}

function drawObstacles() {
  obstacles.forEach((o) => {
    ctx.fillStyle = '#fb7185' ;
    ctx.beginPath();
    ctx.roundRect(o.x, o.y, o.w, o.h, 8);
    ctx.fill();
  });
}

function drawOverlay() {
  if (running) return;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 32px system-ui';
  ctx.fillText(gameOver ? 'Game Over' : 'Ready?', W / 2, H / 2 - 24);
  ctx.font = '500 18px system-ui';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(gameOver ? 'Press Start / Restart to try again' : 'Press Start to play', W / 2, H / 2 + 16);
}

function render() {
  drawBackground();
  drawPlayer();
  drawObstacles();
  drawOverlay();
}

function tick() {
  update();
  render();
  requestAnimationFrame(tick);
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (e.key === 'ArrowLeft' || key === 'a') keys.left = true;
  if (e.key === 'ArrowRight' || key === 'd') keys.right = true;
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (e.key === 'ArrowLeft' || key === 'a') keys.left = false;
  if (e.key === 'ArrowRight' || key === 'd') keys.right = false;
});

canvas.addEventListener('touchstart', (e) => {
  if (activePanel !== 'dodge') return;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  keys.left = x < rect.width / 2;
  keys.right = !keys.left;
}, { passive: true });

canvas.addEventListener('touchend', () => {
  keys.left = false;
  keys.right = false;
});

startBtn.addEventListener('click', reset);

gameCards.forEach((card) => {
  card.addEventListener('click', () => {
    setPanel(card.dataset.game);
  });
});

setPanel('dodge');

if (window.location.hash === '#game-2') {
  setPanel('game-2');
}

render();
tick();
