// =========================================
// 1. GAME STATE & CONFIG
// =========================================
const CONFIG = {
    day: { rows: 9, cols: 9, mines: 10 },
    night: { rows: 8, cols: 8, mines: 10 } 
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

// =========================================
// 2. THE SMOOTH CUSTOM CURSOR
// =========================================
window.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
    trackMouseWithCharacter(e.clientX, e.clientY);
});

function trackMouseWithCharacter(mouseX, mouseY) {
    const charRect = observerCharacter.getBoundingClientRect();
    const charCenterX = charRect.left + charRect.width / 2;
    const charCenterY = charRect.top + charRect.height / 2;
    
    const deltaX = mouseX - charCenterX;
    const deltaY = mouseY - charCenterY;
    const angleRad = Math.atan2(deltaY, deltaX);
    const angleDeg = angleRad * (180 / Math.PI);
    
    observerCharacter.style.transform = `rotate(${angleDeg * 0.4}deg)`;
}

// =========================================
// 3. THEME TOGGLING ACTION
// =========================================
themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'day' ? 'night' : 'day';
    toggleText.textContent = currentTheme === 'night' ? "Switch to Birdwatching (Day)" : "Switch to Stargazing (Night)";
    initGame();
});

// =========================================
// 4. DYNAMIC GRID GENERATION
// =========================================
function initGame() {
    // FIX: Force the theme attribute instantly so colors never load transparent
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    gameBoard.innerHTML = '';
    boardMatrix = [];
    isFirstClick = true;
    gameOver = false;
    
    const { rows, cols } = CONFIG[currentTheme];
    
    if (currentTheme === 'day') {
        gameBoard.className = 'square-grid';
        gameBoard.style.display = 'grid';
        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 45px)`;
        gameBoard.style.position = '';
        gameBoard.style.width = '';
        gameBoard.style.height = '';
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
}

// =========================================
// 5. THE MINESWEEPER ENGINE (THE BRAIN)
// =========================================

function handleLeftClick(cell) {
    if (gameOver || cell.isRevealed || cell.isFlagged) return;

    // Ensure the player never hits a mine on their very first click
    if (isFirstClick) {
        placeMines(cell.row, cell.col);
        calculateNeighbors();
        isFirstClick = false;
    }

    if (cell.isMine) {
        revealAllMines();
        cell.element.style.backgroundColor = 'red'; // BOOM
        gameOver = true;
        return;
    }

    revealCell(cell);
}

function handleRightClick(cell) {
    if (gameOver || cell.isRevealed) return;
    
    cell.isFlagged = !cell.isFlagged;
    // Basic flag visual for now
    cell.element.textContent = cell.isFlagged ? '🚩' : ''; 
}

function placeMines(firstRow, firstCol) {
    const { rows, cols, mines } = CONFIG[currentTheme];
    let minesPlaced = 0;

    while (minesPlaced < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        const cell = boardMatrix[r][c];

        // Don't put a mine on the cell we just clicked, or on an existing mine
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
        // Standard 8-way Square Math
        const dirs = [
            [-1,-1], [-1,0], [-1,1],
            [0,-1],          [0,1],
            [1,-1],  [1,0],  [1,1]
        ];
        dirs.forEach(([dr, dc]) => {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) neighbors.push(boardMatrix[nr][nc]);
        });
    } else {
        // Complex 6-way Hex Math (Offsets change depending on if row is even or odd!)
        const isOddRow = r % 2 === 1;
        const dirs = isOddRow ? [
            [-1, 0], [-1, 1], // Top-Left, Top-Right
            [0, -1], [0, 1],  // Left, Right
            [1, 0],  [1, 1]   // Bottom-Left, Bottom-Right
        ] : [
            [-1, -1], [-1, 0], // Top-Left, Top-Right
            [0, -1],  [0, 1],  // Left, Right
            [1, -1],  [1, 0]   // Bottom-Left, Bottom-Right
        ];

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
    cell.element.style.backgroundColor = currentTheme === 'day' ? '#81c784' : '#45a29e';
    cell.element.style.transform = 'scale(0.95)';
    
    if (cell.neighborMines > 0) {
        // Temporary numbers until we add our Bird/Planet icons!
        cell.element.textContent = cell.neighborMines;
    } else {
        // Flood fill: if it's a 0, reveal all neighbors automatically
        const neighbors = getNeighbors(cell.row, cell.col);
        neighbors.forEach(n => revealCell(n));
    }
}

function revealAllMines() {
    boardMatrix.flat().forEach(cell => {
        if (cell.isMine) {
            cell.element.textContent = currentTheme === 'day' ? '🐍' : '☄️';
            cell.element.style.backgroundColor = 'rgba(255,0,0,0.3)';
        }
    });
}

// Fire it up!
initGame();