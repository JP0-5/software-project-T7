let changePictureBox;
let firstImage;
let allTicks;

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    changePictureBox = document.getElementById("change_picture_box");
    firstImage = document.getElementById("first_img");
    allTicks = document.querySelectorAll('.tick');
}

function openEdit() {
    popup = true;
    firstImage.style.display = "block";
    changePictureBox.style.display = "flex";;
}

function closeEdit() {
    popup = false;
    changePictureBox.style.display = "none";
    allTicks.forEach(img=>{img.style.display="none";});
}

function showTick(section, filename) {
    document.getElementById('selected_img').value = filename
    
    const tick = section.querySelector('.tick');
    tick.style.display = "block";
    
    allTicks.forEach(img=>{img.style.display="none";});
}