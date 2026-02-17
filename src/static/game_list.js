let firstConnection = true;
const socket = io();

socket.on("connect", () => {
    if (!firstConnection) {
        // If reconnecting after a disconnect, reload the page to catch up on any updates that may have been missed
        reload();
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

socket.on("new_public_game", (gameEntry) => {
    const gamesList = document.getElementById("games_list");
    if (gamesList != null) {
        gamesList.innerHTML = gameEntry + gamesList.innerHTML;
    }
})