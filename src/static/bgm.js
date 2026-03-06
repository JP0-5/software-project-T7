playOnToggle = true;
let musicAllowed = false;
let menuMusic = new Audio();
menuMusic.addEventListener("canplaythrough", startMusic, false);
menuMusic.src = "/static/menu_music.wav";

function startMusic() {
    if (musicEnabled) {
        // Play the music 
        // If not allowed to, register the music to be played on the first interaction
        menuMusic.loop = true;
        menuMusic.volume = 0.4;
        musicAllowed = true;
        menuMusic.play().catch((err) => {
            musicAllowed = false;
            ["click","touchstart","keydown","pointerdown"].forEach(event => {
                window.addEventListener(event, playMusic, {once: true});
            });
        });
    }
}

function playMusic() {
    musicAllowed = true;
    if (musicEnabled) {
        menuMusic.play();
    }
}

function pauseMusic() {
    menuMusic.pause();
}