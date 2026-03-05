let popup = false;

function openSettings(){
     if (popup == false){
    document.getElementById("settings_box").style.display = "flex"
    document.getElementById("settings").onclick=closeSettings
    }}

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
    document.getElementById("change_picture_box").style.display = "none"
    document.getElementById("edit_picture").onclick=openEdit}

}

function musicOn(){
       document.getElementById('music_on').classList.add('active')
    document.getElementById('music_off').classList.remove('active')
 
}
function musicOff(){
         document.getElementById('music_off').classList.add('active')
    document.getElementById('music_on').classList.remove('active')

       
       
}

function soundOn(){
    document.getElementById('sound_on').classList.add('active')
    document.getElementById('sound_off').classList.remove('active')
      
}
function soundOff(){
      document.getElementById('sound_off').classList.add('active')
    document.getElementById('sound_on').classList.remove('active')

}
