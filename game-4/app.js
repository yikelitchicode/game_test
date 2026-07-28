const SIZE = 4;
const boardEl = document.querySelector('#board');
const cellsEl = document.querySelector('.cells');
const tilesEl = document.querySelector('#tiles');
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');
const undoButton = document.querySelector('#undo');
const overlay = document.querySelector('#overlay');
const resultLabel = document.querySelector('#resultLabel');

let board;
let score;
let best = Number(localStorage.getItem('game_2048_best') || 0);
let history;
let touchStart;

cellsEl.innerHTML = '<span></span>'.repeat(16);

function emptyBoard() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(0)); }
function clone(state) { return state.map((row) => [...row]); }
function emptyCells() {
  const cells = [];
  board.forEach((row, r) => row.forEach((value, c) => { if (!value) cells.push({ r, c }); }));
  return cells;
}

function addTile() {
  const cells = emptyCells();
  if (!cells.length) return;
  const { r, c } = cells[Math.floor(Math.random() * cells.length)];
  board[r][c] = Math.random() < .9 ? 2 : 4;
}

function save() {
  localStorage.setItem('game_2048_state', JSON.stringify({ board, score, history }));
  localStorage.setItem('game_2048_best', String(best));
}

function newGame() {
  board = emptyBoard();
  score = 0;
  history = [];
  addTile();
  addTile();
  overlay.hidden = true;
  save();
  render();
  boardEl.focus();
}

function load() {
  try {
    const state = JSON.parse(localStorage.getItem('game_2048_state'));
    if (!state || !Array.isArray(state.board) || state.board.length !== SIZE) return newGame();
    board = state.board;
    score = state.score || 0;
    history = state.history || [];
    render();
  } catch { newGame(); }
}

function compress(line) {
  const values = line.filter(Boolean);
  const output = [];
  let gained = 0;
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] === values[i + 1]) {
      const merged = values[i] * 2;
      output.push(merged);
      gained += merged;
      i += 1;
    } else output.push(values[i]);
  }
  while (output.length < SIZE) output.push(0);
  return { output, gained };
}

function move(direction) {
  if (!overlay.hidden) return;
  const before = clone(board);
  let gained = 0;
  for (let index = 0; index < SIZE; index += 1) {
    let line = direction === 'left' || direction === 'right'
      ? [...board[index]]
      : board.map((row) => row[index]);
    if (direction === 'right' || direction === 'down') line.reverse();
    const result = compress(line);
    line = direction === 'right' || direction === 'down' ? result.output.reverse() : result.output;
    gained += result.gained;
    if (direction === 'left' || direction === 'right') board[index] = line;
    else line.forEach((value, row) => { board[row][index] = value; });
  }
  if (JSON.stringify(before) === JSON.stringify(board)) return;
  history.push({ board: before, score });
  score += gained;
  best = Math.max(best, score);
  addTile();
  if (isOver()) {
    resultLabel.textContent = 'No more moves';
    overlay.hidden = false;
  }
  save();
  render();
}

function isOver() {
  if (emptyCells().length) return false;
  return !board.some((row, r) => row.some((value, c) => value === board[r][c + 1] || (board[r + 1] && value === board[r + 1][c])));
}

function undo() {
  const previous = history.pop();
  if (!previous) return;
  board = previous.board;
  score = previous.score;
  overlay.hidden = true;
  save();
  render();
}

function render() {
  tilesEl.replaceChildren();
  board.forEach((row, r) => row.forEach((value, c) => {
    if (!value) return;
    const tile = document.createElement('div');
    tile.className = `tile tile-${value <= 2048 ? value : 'super'}${value >= 128 ? ' big' : ''}`;
    tile.style.gridRow = String(r + 1);
    tile.style.gridColumn = String(c + 1);
    tile.textContent = value;
    tilesEl.append(tile);
  }));
  scoreEl.textContent = score;
  bestEl.textContent = best;
  undoButton.disabled = !history.length;
}

const keyMap = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
window.addEventListener('keydown', (event) => {
  const direction = keyMap[event.key] || keyMap[event.key.toLowerCase()];
  if (!direction) return;
  event.preventDefault();
  move(direction);
});
boardEl.addEventListener('pointerdown', (event) => { touchStart = { x: event.clientX, y: event.clientY }; });
boardEl.addEventListener('pointerup', (event) => {
  if (!touchStart) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
});
document.querySelector('#newGame').addEventListener('click', newGame);
document.querySelector('#playAgain').addEventListener('click', newGame);
undoButton.addEventListener('click', undo);
load();
