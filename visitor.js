// =========================================
// CROSS-THEME VISITOR MODULE
// Can be disabled by removing script from HTML
// =========================================

(function initVisitorSystem() {
    window.addEventListener('DOMContentLoaded', () => {
        const charCorner = document.getElementById('character-corner');
        const mainChar = document.getElementById('cute-character');
        
        if (!charCorner || !mainChar) return;

        // Spawn the visitor element
        const visitor = document.createElement('div');
        visitor.id = 'visitor';
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