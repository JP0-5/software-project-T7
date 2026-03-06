let popup = false;
let playOnToggle = false;           //will be set to true on some pages
let musicEnabled;
let soundEnabled;

if (localStorage.getItem("musicEnabled") !== "false") {
    localStorage.setItem("musicEnabled", true);
    musicEnabled = true;
} else {
    localStorage.setItem("musicEnabled", false);
    musicEnabled = false;
}

if (localStorage.getItem("soundEnabled") !== "false") {
    localStorage.setItem("soundEnabled", true);
    soundEnabled = true;
} else {
    localStorage.setItem("soundEnabled", false);
    soundEnabled = false;
}

document.addEventListener("DOMContentLoaded", function() {
    if (musicEnabled) {
        document.getElementById('music_on').classList.add('active');
        document.getElementById('music_off').classList.remove('active');
    } else {
        document.getElementById('music_off').classList.add('active');
        document.getElementById('music_on').classList.remove('active');
    }

    if (soundEnabled) {
        document.getElementById('sound_on').classList.add('active');
        document.getElementById('sound_off').classList.remove('active');
    } else {
        document.getElementById('sound_off').classList.add('active')
        document.getElementById('sound_on').classList.remove('active')
    }
}, false)


function openSettings(){
    if (popup == false){
        document.getElementById("settings_box").style.display = "flex"
        document.getElementById("settings").onclick=closeSettings
    }
}

function closeSettings(){
    document.getElementById("settings_box").style.display = "none"
    document.getElementById("settings").onclick=openSettings
}

document.addEventListener('keydown',keyPress)
function keyPress(event){
    if (event.key=='Escape' && popup==false){
        document.getElementById("settings").click()
    }
    else if(event.key=='Escape'){    
    popup=false;
    console.log('hi')
    const all_ticks=document.querySelectorAll('.tick');
    all_ticks.forEach(img=>{img.style.display="none";});
    document.getElementById("change_picture_box").style.display = "none";
    document.getElementById("edit_picture").onclick=openEdit};

}

function musicOn(){
    document.getElementById('music_on').classList.add('active');
    document.getElementById('music_off').classList.remove('active');
    localStorage.setItem("musicEnabled", true);
    musicEnabled = true;
    if (playOnToggle) {
        if (musicAllowed) {
            playMusic();
        } else {
            startMusic();
        }
    }
}
function musicOff(){
    document.getElementById('music_off').classList.add('active');
    document.getElementById('music_on').classList.remove('active');
    localStorage.setItem("musicEnabled", false);
    musicEnabled = false;
    if (playOnToggle) {
        pauseMusic();
    }
}

function soundOn(){
    document.getElementById('sound_on').classList.add('active');
    document.getElementById('sound_off').classList.remove('active');
    localStorage.setItem("soundEnabled", true);
    soundEnabled = true;
}
function soundOff(){
    document.getElementById('sound_off').classList.add('active')
    document.getElementById('sound_on').classList.remove('active')
    localStorage.setItem("soundEnabled", false);
    soundEnabled = false;
}
