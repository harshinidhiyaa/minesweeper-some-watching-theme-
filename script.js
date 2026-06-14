// =========================================
// 1. GAME STATE & CONFIG
// =========================================
const CONFIG = {
    day: { rows: 9, cols: 9, mines: 10 },
    night: { rows: 8, cols: 8, mines: 10 } // Hex grids scale differently, slightly smaller fits beautifully
};

let currentTheme = 'day';
let boardMatrix = []; // Will hold our cell data objects

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
    // Position the custom binocular/telescope center on the mouse
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
    
    // Quick look-ahead: Let's also make the character slightly rotate towards the mouse!
    trackMouseWithCharacter(e.clientX, e.clientY);
});

function trackMouseWithCharacter(mouseX, mouseY) {
    const charRect = observerCharacter.getBoundingClientRect();
    const charCenterX = charRect.left + charRect.width / 2;
    const charCenterY = charRect.top + charRect.height / 2;
    
    // Calculating the angle between character and mouse pointer
    const deltaX = mouseX - charCenterX;
    const deltaY = mouseY - charCenterY;
    const angleRad = Math.atan2(deltaY, deltaX);
    const angleDeg = angleRad * (180 / Math.PI);
    
    // Rotate the character emoji smoothly (constraining it slightly so they don't break their neck)
    observerCharacter.style.transform = `rotate(${angleDeg * 0.4}deg)`;
}

// =========================================
// 3. THEME TOGGLING ACTION
// =========================================
themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'day' ? 'night' : 'day';
    
    // Update HTML attribute (triggers CSS transition)
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Update Button Text
    if (currentTheme === 'night') {
        toggleText.textContent = "Switch to Birdwatching (Day)";
    } else {
        toggleText.textContent = "Switch to Stargazing (Night)";
    }
    
    // Re-generate the board layout for the new theme
    initGame();
});

// =========================================
// 4. DYNAMIC GRID GENERATION (FIXED LAYOUT)
// =========================================
function initGame() {
    // Clear the existing board
    gameBoard.innerHTML = '';
    boardMatrix = [];
    
    const { rows, cols } = CONFIG[currentTheme];
    
    // Configure the grid container layout based on mode
    if (currentTheme === 'day') {
        gameBoard.className = 'square-grid';
        gameBoard.style.display = 'grid';
        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 45px)`;
        
        // CLEANUP: Remove leftover Night mode styles so the grid centers perfectly
        gameBoard.style.position = '';
        gameBoard.style.width = '';
        gameBoard.style.height = '';
    } else {
        gameBoard.className = 'hex-grid';
        gameBoard.style.display = 'block'; 
        gameBoard.style.position = 'relative';
        
        // NEW MATH: Larger hexagons (52x58) need wider spacing
        // Horizontal step is 54px. Vertical step is 45px (roughly 75% of height).
        gameBoard.style.width = `${cols * 54 + 27}px`; // +27 accommodates the odd row overhang
        gameBoard.style.height = `${rows * 45 + 20}px`; // +20 gives breathing room at the bottom
    }

    // Build the grid cells
    for (let r = 0; r < rows; r++) {
        boardMatrix[r] = [];
        for (let c = 0; c < cols; c++) {
            
            // Create cell element
            const cellEl = document.createElement('div');
            cellEl.classList.add('cell');
            cellEl.dataset.row = r;
            cellEl.dataset.col = c;
            
            // Apply theme-specific architecture
            if (currentTheme === 'day') {
                // Standard grid handles position automatically
            } else {
                // Night Mode: Nesting Hexagons
                cellEl.classList.add('hex');
                cellEl.style.position = 'absolute';
                
                // NEW MATH: Spacing for the larger hexagons with a small gap
                const xOffset = c * 54 + (r % 2 === 1 ? 27 : 0);
                const yOffset = r * 45;
                
                cellEl.style.left = `${xOffset}px`;
                cellEl.style.top = `${yOffset}px`;
            }
            
            // Create the programmatic representation of a cell
            const cellData = {
                element: cellEl,
                row: r,
                col: c,
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
            
            cellEl.addEventListener('click', () => handleCellClick(cellData));
            cellEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleCellRightClick(cellData);
            });
            
            gameBoard.appendChild(cellEl);
            boardMatrix[r].push(cellData);
        }
    }
}