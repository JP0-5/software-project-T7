let changePictureBox;

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    changePictureBox = document.getElementById("change_picture_box");
}

function openEdit(){
    changePictureBox.style.display = "flex";
}

function closeEdit(){
    changePictureBox.style.display = "none";
}