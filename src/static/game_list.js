let socket;

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    socket = io();

    socket.on("connect", () => {
        socket.emit("game_list_connect");
    })

    socket.on("player_count_update", (gameID, count) => {
        const playerCount = document.querySelector(`#game_${gameID} .player_count`);
        playerCount.innerHTML = count;
    })

    socket.on("game_full", (gameID) => {
        document.getElementById(`game_${gameID}`).remove();
    })
}