function openEdit(){
    
    document.getElementById("first_img").style.display = "block";
    popup=true;;
    document.getElementById("change_picture_box").style.display = "flex";;
    document.getElementById("change_picture_box").style.display = parseInt(    document.getElementById("change_picture_box").style.zIndex)+1;
    document.getElementById("edit_picture").onclick=closeSettings;
    }

function closeEdit(){
    popup=false;
    document.getElementById("change_picture_box").style.display = "none";
    document.getElementById("edit_picture").onclick=openSettings;
    const all_ticks=document.querySelectorAll('.tick');
    all_ticks.forEach(img=>{img.style.display="none";});
    console.log('hello')
    }

function showTick(section,filename){
    document.getElementById('selected_img').value = filename
    
    const tick=section.querySelector('.tick');
    const all_ticks=document.querySelectorAll('.tick');
    all_ticks.forEach(img=>{img.style.display="none";});
    
    tick.style.display = "block";

}