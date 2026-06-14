// =========================================
// CROSS-THEME VISITOR MODULE
// =========================================

(function initVisitorSystem() {
    window.addEventListener('DOMContentLoaded', () => {
        const charCorner = document.getElementById('character-corner');
        const mainChar = document.getElementById('cute-character');
        
        if (!charCorner || !mainChar) return;

        // Create the visitor container
        const visitor = document.createElement('div');
        visitor.id = 'visitor-blob';
        
        // Clone the HTML structure of the main character
        visitor.innerHTML = `
            <div class="eye"><div class="pupil"></div></div>
            <div class="eye"><div class="pupil"></div></div>
        `;
        
        charCorner.appendChild(visitor);

        // Make the main character occasionally shake in frustration
        setInterval(() => {
            mainChar.classList.add('annoyed-shake');
            
            // Stop shaking after 1 second
            setTimeout(() => {
                mainChar.classList.remove('annoyed-shake');
            }, 1000); 
            
        }, 6000); // Happens every 6 seconds
    });
})();