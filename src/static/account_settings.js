function openEdit(){
    document.getElementById("change_picture_box").style.display = "flex"
    document.getElementById("change_picture_box").style.display = parseInt(    document.getElementById("change_picture_box").style.zIndex)+1
    document.getElementById("edit_picture").onclick=closeSettings
    }

function closeEdit(){
    document.getElementById("change_picture_box").style.display = "none"
    document.getElementById("edit_picture").onclick=openSettings
    }
