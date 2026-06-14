const SOUNDS = {
    click: new Audio('sounds/pop.mp3'),
    win: new Audio('sounds/win.mp3'),
    lose: new Audio('sounds/lose.mp3'),
    theme: new Audio('sounds/ambient.mp3')
};

function playSFX(soundKey) {
    if (SOUNDS[soundKey]) {
        SOUNDS[soundKey].currentTime = 0; // Reset to start
        SOUNDS[soundKey].play().catch(e => console.log("Audio blocked by browser"));
    }
}