let socket;

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    socket = io();

    socket.on("connect", () => {
        socket.emit("game_list_connect");
    })

    socket.on("player_count_update", (gameID, count) => {
        const playerCount = document.querySelector(`#game_${gameID} .player_count`);
        if (playerCount != null) {
            playerCount.innerHTML = count;
        }
    })

    socket.on("game_full", (gameID) => {
        const gameEntry = document.getElementById(`game_${gameID}`);
        if (gameEntry != null) {
            gameEntry.remove();
        }
    })

    socket.on("new_public_game", () => {
        console.log("New public game");
    })
}