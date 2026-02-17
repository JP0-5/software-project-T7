document.addEventListener("DOMContentLoaded", init, false);
let firstConnection = true;
let gamesList;
let currentFilter = "all";
let allFilterButton;
let classicFilterButton;
let modifiedFilterButton;
const socket = io();

function init() {
    gamesList = document.getElementById("games_list");
    allFilterButton = document.getElementById("all");
    classicFilterButton = document.getElementById("classic");
    modifiedFilterButton = document.getElementById("modified");
    filterGames();

    socket.on("new_public_game", (gameEntry) => {
        gamesList.innerHTML = gameEntry + gamesList.innerHTML;
        filterGames();
    })
}

socket.on("connect", () => {
    if (!firstConnection) {
        // If reconnecting after a disconnect, reload the page to catch up on any updates that may have been missed
        location.reload();
    } else {
        firstConnection = false;
        socket.emit("game_list_connect");
    }
})

socket.on("player_count_update", (gameID, count) => {
    const playerCount = document.querySelector(`#game_${gameID} .player_count`);
    if (playerCount != null) {
        playerCount.innerHTML = count;
    }
})

// When the game becomes full
socket.on("game_removed", (gameID) => {
    const gameEntry = document.getElementById(`game_${gameID}`);
    if (gameEntry != null) {
        gameEntry.remove();
    }
})

function filterChange() {
    if (allFilterButton.checked) {
        currentFilter = "all";
    } else if (classicFilterButton.checked) {
        currentFilter = "classic";
    } else if (modifiedFilterButton.checked) {
        currentFilter = "modified";
    }
    filterGames();
}

function filterGames() {
    for (let entry of document.querySelectorAll(".game_entry")) {
        if (currentFilter == "all") {
            entry.style.display = "flex";
        }
        else {
            const mode = entry.querySelector(".game_mode").innerHTML;
            if ((currentFilter == "classic" && mode == "\n\nModified\n\n") || (currentFilter == "modified" && mode == "\n\nClassic\n\n")) {
                entry.style.display = "none";
            } else {
                entry.style.display = "flex";
            }
        }
    }
}