function openSettings(){
    document.getElementById("settings_box").style.display = "flex"
    document.getElementById("settings").onclick=closeSettings
    }

function closeSettings(){
    document.getElementById("settings_box").style.display = "none"
    document.getElementById("settings").onclick=openSettings
    }
