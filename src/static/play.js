let connectionStatus;
let messageInput;
let sendButton;
let messages;

const gameID = window.location.pathname.split("/").at(-1);

let socket;

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    connectionStatus = document.getElementById("connectionStatus");
    messages = document.getElementById("messages");
    sendButton = document.getElementById("sendButton");
    sendButton.addEventListener("click", sendMessage, false);
    messageInput = document.getElementById("messageInput");

    socket = io();

    addEventListener("beforeunload", (event) => {
        socket.disconnect();
    })

    socket.on("connect", () => {
        socket.emit("join_request", gameID);
    })

    socket.on("disconnect", (reason) => {
        sendButton.disabled = true;
        connectionStatus.innerHTML = "Disconnected";

        if (reason === "io server disconnect") {
            // The disconnect was initiated by the server, you need to reconnect manually.
            // This can occur if the player (same player ID) is already connected to this game in another session or tab

            // This can also occur if the client disconnects suddenly and the server is not able to detect the disconnect immediately.
            // When the clients attempts to reconnect, the server thinks the same player is trying to connect on two sockets at once,
            // so the connection is refused. (see handle_join() in app.py)

            // TODO: Inform the user at this point that they need to close the other connection if they have one, or to wait if they are trying to reconnect.

            // Try to reconnect in a few seconds, when the server can check again
            setTimeout(() => {
                socket.connect();
            }, 3000)
        }
    })

    socket.on("join_accepted", (playerID, socketID) => {
        if (socketID == socket.id) {
            // This client was allowed to join
            sendButton.disabled = false;
            connectionStatus.innerHTML = "Connected";
        } else {
            // Another player joined the game

        }
    })

    // Called when another player in this game disconnects
    socket.on("other_player_disconnect", (playerID) => {

    })

    socket.on("chat_message_from_server", (playerID, content) => {
        let displayName;
        messages.innerHTML += `<p>${playerID.slice(1)}: ${content}</p>`;
    });
}



function sendMessage() {
    if (messageInput.value != "") {
        socket.emit("chat_message_from_client", messageInput.value);
        messageInput.value = "";
    }
}