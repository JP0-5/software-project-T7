let box;

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    box = document.getElementById("games_box");
    setTimeout(updateInvites, 5000);
}

async function updateInvites() {
    const response = await fetch("/invite_list");
    if (response.ok) {
        box.innerHTML = await response.text();
    }
    setTimeout(updateInvites, 5000);
}