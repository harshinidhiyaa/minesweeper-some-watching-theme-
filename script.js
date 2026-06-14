// =========================================
// 1. GAME CONFIG & THEMATIC DICTIONARIES
// =========================================
const CONFIG = {
    day: { rows: 9, cols: 9, mines: 10 },
    night: { rows: 8, cols: 8, mines: 10 } 
};

// Thematic Icons matching the spec
const THEME_ASSETS = {
    day: {
        mines: '🐍', // Hidden hazard
        safeRevealed: '#a5d6a7',
        icons: {
            1: '🐦', // Sparrow
            2: '🦜', // Robin/Colorful sighting
            3: '🦅', // Woodpecker / Majestic Raptor
            4: '🦆', 5: '🦉', 6: '🦢' // Extended sightings
        },
        winTitle: "Survey Complete!",
        winDesc: "Every bird spotted, environment undisturbed.",
        loseTitle: "Startled Wildlife!",
        loseDesc: "You stumbled into a hidden hazard."
    },
    night: {
        mines: '☄️', // Dark matter/Comet anomaly
        safeRevealed: '#1f2833',
        icons: {
            1: '⭐', // Distant Star
            2: '🪐', // Ringed Planet
            3: '🛰️', // Orbiting Satellite
            4: '🚀', 5: '🛸', 6: '🌌' // Extended cosmic objects
        },
        winTitle: "Sky Mapped!",
        winDesc: "All celestial configurations securely plotted.",
        loseTitle: "System Overload!",
        loseDesc: "Telescope array collided with cosmic debris."
    }
};

let currentTheme = 'day';
let boardMatrix = []; 
let isFirstClick = true;
let gameOver = false;

// DOM Elements
const cursor = document.getElementById('custom-cursor');
const themeToggle = document.getElementById('theme-toggle');
const gameBoard = document.getElementById('game-board');
const toggleText = document.querySelector('.toggle-text');
const observerCharacter = document.getElementById('observer-character');
const mineCountEl = document.getElementById('mine-count');
const statusBanner = document.getElementById('status-banner');
const statusTitle = document.getElementById('status-title');
const statusDesc = document.getElementById('status-desc');
const restartBtn = document.getElementById('restart-btn');
const timerEl = document.getElementById('timer');
const character = document.getElementById('cute-character');

let timerInterval;
let secondsElapsed = 0;
// =========================================
// 2. SMOOTH CURSOR & CHARACTER TRACKING
// =========================================
window.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
    trackMouseWithCharacter(e.clientX, e.clientY);
});

function trackMouseWithCharacter(mouseX, mouseY) {
    if (!character) return;
    
    const charRect = character.getBoundingClientRect();
    const charCenterX = charRect.left + charRect.width / 2;
    const charCenterY = charRect.top + charRect.height / 2;
    
    // Calculate distance from center
    const deltaX = mouseX - charCenterX;
    const deltaY = mouseY - charCenterY;
    
    // Cap the movement so the pupils don't leave the white of the eyes
    const maxEyeMove = 6; 
    const angle = Math.atan2(deltaY, deltaX);
    const distance = Math.min(Math.hypot(deltaX, deltaY) / 20, maxEyeMove);
    
    const eyeX = Math.cos(angle) * distance;
    const eyeY = Math.sin(angle) * distance;
    
    // Pass the math to our CSS!
    character.style.setProperty('--eye-x', `${eyeX}px`);
    character.style.setProperty('--eye-y', `${eyeY}px`);
}

// =========================================
// 3. UI EVENTS
// =========================================
themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'day' ? 'night' : 'day';
    toggleText.textContent = currentTheme === 'night' ? "Switch to Birdwatching (Day)" : "Switch to Stargazing (Night)";
    initGame();
});

restartBtn.addEventListener('click', () => {
    statusBanner.classList.remove('visible');
    initGame();
});

// =========================================
// 4. GRID GENERATION
// =========================================
function initGame() {
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
        gameBoard.style.position = ''; gameBoard.style.width = ''; gameBoard.style.height = '';
    } else {
        gameBoard.className = 'hex-grid';
        gameBoard.style.display = 'block'; 
        gameBoard.style.position = 'relative';
        gameBoard.style.width = `${cols * 54 + 27}px`; 
        gameBoard.style.height = `${rows * 45 + 20}px`; 
    }

    for (let r = 0; r < rows; r++) {
        boardMatrix[r] = [];
        for (let c = 0; c < cols; c++) {
            const cellEl = document.createElement('div');
            cellEl.classList.add('cell');
            cellEl.dataset.row = r;
            cellEl.dataset.col = c;
            
            if (currentTheme === 'night') {
                cellEl.classList.add('hex');
                cellEl.style.position = 'absolute';
                const xOffset = c * 54 + (r % 2 === 1 ? 27 : 0);
                const yOffset = r * 45;
                cellEl.style.left = `${xOffset}px`;
                cellEl.style.top = `${yOffset}px`;
            }
            
            const cellData = {
                element: cellEl, row: r, col: c, 
                isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0
            };
            
            cellEl.addEventListener('click', () => handleLeftClick(cellData));
            cellEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(cellData);
            });
            
            gameBoard.appendChild(cellEl);
            boardMatrix[r].push(cellData);
        }
    }
    function startTimer() {
    clearInterval(timerInterval);
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
    stopTimer();
    secondsElapsed = 0;
    timerEl.textContent = "00:00";
}

// =========================================
// 5. GAME ENGINE LOGIC
// =========================================
function handleLeftClick(cell) {
    if (gameOver || cell.isRevealed || cell.isFlagged) return;

    if (isFirstClick) {
        placeMines(cell.row, cell.col);
        calculateNeighbors();
        startTimer(); // START THE CLOCK!
        isFirstClick = false;
    }

    if (cell.isMine) {
        endGame(false, cell);
        return;
    }
    

    revealCell(cell);
    checkWinCondition();
}

function handleRightClick(cell) {
    if (gameOver || cell.isRevealed) return;
    
    cell.isFlagged = !cell.isFlagged;
    cell.element.textContent = cell.isFlagged ? '🚩' : ''; 
}

function placeMines(firstRow, firstCol) {
    const { rows, cols, mines } = CONFIG[currentTheme];
    let minesPlaced = 0;

    while (minesPlaced < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        const cell = boardMatrix[r][c];

        if (!cell.isMine && !(r === firstRow && c === firstCol)) {
            cell.isMine = true;
            minesPlaced++;
        }
    }
}

function getNeighbors(r, c) {
    const neighbors = [];
    const { rows, cols } = CONFIG[currentTheme];

    if (currentTheme === 'day') {
        const dirs = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
        dirs.forEach(([dr, dc]) => {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) neighbors.push(boardMatrix[nr][nc]);
        });
    } else {
        const isOddRow = r % 2 === 1;
        const dirs = isOddRow ? 
            [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]] : 
            [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];

        dirs.forEach(([dr, dc]) => {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) neighbors.push(boardMatrix[nr][nc]);
        });
    }
    return neighbors;
}

function calculateNeighbors() {
    const { rows, cols } = CONFIG[currentTheme];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = boardMatrix[r][c];
            if (!cell.isMine) {
                const neighbors = getNeighbors(r, c);
                cell.neighborMines = neighbors.filter(n => n.isMine).length;
            }
        }
    }
}

function revealCell(cell) {
    if (cell.isRevealed || cell.isFlagged) return;
    
    cell.isRevealed = true;
    cell.element.classList.add('revealed');
    cell.element.style.backgroundColor = THEME_ASSETS[currentTheme].safeRevealed;
    
    if (cell.neighborMines > 0) {
        cell.element.dataset.count = cell.neighborMines;
        // Lookup the specific bird or planetary asset from our asset map
        cell.element.textContent = THEME_ASSETS[currentTheme].icons[cell.neighborMines] || cell.neighborMines;
    } else {
        cell.element.textContent = '';
        const neighbors = getNeighbors(cell.row, cell.col);
        neighbors.forEach(n => revealCell(n));
    }
}

function checkWinCondition() {
    const { rows, cols, mines } = CONFIG[currentTheme];
    const targetRevealed = (rows * cols) - mines;
    const currentRevealed = boardMatrix.flat().filter(cell => cell.isRevealed).length;
    
    if (currentRevealed === targetRevealed) {
        endGame(true);
    }
}

function endGame(isWin, clickedMineCell = null) {
    gameOver = true;
    const assets = THEME_ASSETS[currentTheme];
    
    // Uncover remaining positions safely
    boardMatrix.flat().forEach(cell => {
        if (cell.isMine) {
            cell.element.textContent = assets.mines;
            if (!isWin) cell.element.style.backgroundColor = 'rgba(229, 57, 53, 0.2)';
        }
    });

    if (clickedMineCell) {
        clickedMineCell.element.style.backgroundColor = '#e53935';
    }
    stopTimer(); 
    gameOver = true;

    // Trigger status display layout updates
    statusTitle.textContent = isWin ? assets.winTitle : assets.loseTitle;
    statusDesc.textContent = isWin ? assets.winDesc : assets.loseDesc;
    statusBanner.classList.add('visible');
    
}

// Initial Kickoff
initGame();