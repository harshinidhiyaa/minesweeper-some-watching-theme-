// =========================================
// 1. GAME CONFIG & THEMATIC DICTIONARIES
// =========================================
const CONFIG = {
    day: { rows: 9, cols: 9, mines: 10 },
    night: { rows: 8, cols: 8, mines: 10 } 
};

const THEME_ASSETS = {
    day: {
        // FIXED: Changed safeRevealed to a lighter color so it's visible against the darker cell-bg
        mines: '🐍', safeRevealed: '#e8f5e9', 
        icons: { 1: '🐦', 2: '🦜', 3: '🦅', 4: '🦆', 5: '🦉', 6: '🦢' },
        winTitle: "Survey Complete!", winDesc: "Every bird spotted, environment undisturbed.",
        loseTitle: "Startled Wildlife!", loseDesc: "You stumbled into a hidden hazard."
    },
    night: {
        mines: '☄️', safeRevealed: '#1f2833',
        icons: { 1: '⭐', 2: '🪐', 3: '🛰️', 4: '🚀', 5: '🛸', 6: '🌌' },
        winTitle: "Sky Mapped!", winDesc: "All celestial configurations securely plotted.",
        loseTitle: "System Overload!", loseDesc: "Telescope array collided with cosmic debris."
    }
};

// =========================================
// 2. STATE & DOM REFERENCES
// =========================================
let currentTheme = 'day';
let boardMatrix = [];
let isFirstClick = true;
let gameOver = false;
let timerInterval;
let secondsElapsed = 0;

const cursor = document.getElementById('custom-cursor');
const themeToggle = document.getElementById('theme-toggle');
const gameBoard = document.getElementById('game-board');
const toggleText = document.querySelector('.toggle-text');
const mineCountEl = document.getElementById('mine-count');
const statusBanner = document.getElementById('status-banner');
const statusTitle = document.getElementById('status-title');
const statusDesc = document.getElementById('status-desc');
const restartBtn = document.getElementById('restart-btn');
const timerEl = document.getElementById('timer');
const character = document.getElementById('cute-character');

// =========================================
// 3. TIMER FUNCTIONS
// =========================================
function startTimer() {
    stopTimer();
    secondsElapsed = 0;
    timerEl.textContent = "00:00";
    timerInterval = setInterval(() => {
        secondsElapsed++;
        const m = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
        const s = String(secondsElapsed % 60).padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

// =========================================
// 4. CURSOR & TRACKING
// =========================================
window.addEventListener('mousemove', (e) => {
    if (cursor) {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
    }
    if (character) {
        const charRect = character.getBoundingClientRect();
        const charCenterX = charRect.left + charRect.width / 2;
        const charCenterY = charRect.top + charRect.height / 2;
        const deltaX = e.clientX - charCenterX;
        const deltaY = e.clientY - charCenterY;
        const angle = Math.atan2(deltaY, deltaX);
        const distance = Math.min(Math.hypot(deltaX, deltaY) / 20, 6);
        character.style.setProperty('--eye-x', `${Math.cos(angle) * distance}px`);
        character.style.setProperty('--eye-y', `${Math.sin(angle) * distance}px`);
    }
});

// =========================================
// 5. GRID & GAME ENGINE
// =========================================
function initGame() {
    stopTimer();
    document.documentElement.setAttribute('data-theme', currentTheme);
    statusBanner.classList.remove('visible');
    gameBoard.innerHTML = '';
    boardMatrix = [];
    isFirstClick = true;
    gameOver = false;
    
    const { rows, cols, mines } = CONFIG[currentTheme];
    mineCountEl.textContent = `Mines: ${mines}`;
    
    if (currentTheme === 'day') {
        gameBoard.className = 'square-grid';
        gameBoard.style.display = 'grid';
        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 45px)`;
    } else {
        gameBoard.className = 'hex-grid';
        gameBoard.style.display = 'block';
    }

    for (let r = 0; r < rows; r++) {
        boardMatrix[r] = [];
        for (let c = 0; c < cols; c++) {
            const cellEl = document.createElement('div');
            cellEl.classList.add('cell');
            if (currentTheme === 'night') {
                cellEl.classList.add('hex');
                cellEl.style.position = 'absolute';
                cellEl.style.left = `${c * 65 + (r % 2 === 1 ? 32 : 0)}px`;
                cellEl.style.top = `${r * 60}px`;
            }
            
            const cellData = { element: cellEl, row: r, col: c, isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0 };
            cellEl.addEventListener('click', () => handleLeftClick(cellData));
            cellEl.addEventListener('contextmenu', (e) => { e.preventDefault(); handleRightClick(cellData); });
            gameBoard.appendChild(cellEl);
            boardMatrix[r].push(cellData);
        }
    }
}

function handleLeftClick(cell) {
    if (gameOver || cell.isRevealed || cell.isFlagged) return;
    if (isFirstClick) {
        placeMines(cell.row, cell.col);
        calculateNeighbors();
        startTimer();
        isFirstClick = false;
    }
    if (cell.isMine) { endGame(false, cell); return; }
    revealCell(cell);
    checkWinCondition();
}

function handleRightClick(cell) {
    if (gameOver || cell.isRevealed) return;
    cell.isFlagged = !cell.isFlagged;
    cell.element.textContent = cell.isFlagged ? '🚩' : ''; 
}

function placeMines(fR, fC) {
    const { rows, cols, mines } = CONFIG[currentTheme];
    let placed = 0;
    while (placed < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (!boardMatrix[r][c].isMine && !(r === fR && c === fC)) {
            boardMatrix[r][c].isMine = true;
            placed++;
        }
    }
}

function getNeighbors(r, c) {
    const neighbors = [];
    const { rows, cols } = CONFIG[currentTheme];
    const dirs = currentTheme === 'day' ? [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]] : 
                 (r % 2 === 1 ? [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]] : [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]);
    dirs.forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) neighbors.push(boardMatrix[nr][nc]);
    });
    return neighbors;
}

function calculateNeighbors() {
    boardMatrix.flat().forEach(c => {
        if (!c.isMine) c.neighborMines = getNeighbors(c.row, c.col).filter(n => n.isMine).length;
    });
}

function revealCell(cell) {
    if (cell.isRevealed || cell.isFlagged) return;
    cell.isRevealed = true;
    cell.element.classList.add('revealed');
    cell.element.style.backgroundColor = THEME_ASSETS[currentTheme].safeRevealed;
    if (cell.neighborMines > 0) {
        cell.element.textContent = THEME_ASSETS[currentTheme].icons[cell.neighborMines] || cell.neighborMines;
    } else {
        getNeighbors(cell.row, cell.col).forEach(n => revealCell(n));
    }
}

function checkWinCondition() {
    const { rows, cols, mines } = CONFIG[currentTheme];
    if (boardMatrix.flat().filter(c => c.isRevealed).length === (rows * cols) - mines) endGame(true);
}

function endGame(isWin, clickedMine = null) {
    gameOver = true;
    stopTimer();
    boardMatrix.flat().forEach(c => { if (c.isMine) c.element.textContent = THEME_ASSETS[currentTheme].mines; });
    if (clickedMine) clickedMine.element.style.backgroundColor = '#e53935';
    statusTitle.textContent = isWin ? THEME_ASSETS[currentTheme].winTitle : THEME_ASSETS[currentTheme].loseTitle;
    statusDesc.textContent = isWin ? THEME_ASSETS[currentTheme].winDesc : THEME_ASSETS[currentTheme].loseDesc;
    statusBanner.classList.add('visible');
}

themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'day' ? 'night' : 'day';
    toggleText.textContent = currentTheme === 'night' ? "Switch to Birdwatching (Day)" : "Switch to Stargazing (Night)";
    initGame();
});

restartBtn.addEventListener('click', initGame);

initGame();