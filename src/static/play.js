//const playerID initialised in play.html
let assetsLoaded = false;
let gameStarted = false;
let canvas;
let context;
let hitButton;
let standButton;
let request_id;
let fpsInterval = 1000 / 60;
let now;
let cardDrawing = false;
let cardToDraw;
let framesInDraw = 0;
let cardToDrawFrame = 0;
let drawDestOffset = 30;
let then = Date.now();
let card_stack = new Image();
let pfp1 = new Image();
let pfp2 = new Image();
let pfp3 = new Image();
let pfp4 = new Image();
let ha = new Image(); let h2 = new Image(); let h3 = new Image(); let h4 = new Image();
let h5 = new Image(); let h6 = new Image(); let h7 = new Image(); let h8 = new Image();
let h9 = new Image(); let h10 = new Image(); let hk = new Image(); let hq = new Image();
let hj = new Image(); let da = new Image(); let d2 = new Image(); let d3 = new Image();
let d4 = new Image(); let d5 = new Image(); let d6 = new Image(); let d7 = new Image();
let d8 = new Image(); let d9 = new Image(); let d10 = new Image(); let dk = new Image();
let dq = new Image(); let dj = new Image(); let sa = new Image(); let s2 = new Image();
let s3 = new Image(); let s4 = new Image(); let s5 = new Image(); let s6 = new Image();
let s7 = new Image(); let s8 = new Image(); let s9 = new Image(); let s10 = new Image();
let sk = new Image(); let sq = new Image(); let sj = new Image(); let ca = new Image();
let c2 = new Image(); let c3 = new Image(); let c4 = new Image(); let c5 = new Image();
let c6 = new Image(); let c7 = new Image(); let c8 = new Image(); let c9 = new Image();
let c10 = new Image(); let ck = new Image(); let cq = new Image(); let cj = new Image();
let remainingCards;
var pixelFont = new FontFace('Pixelz', 'url(/static/pixel_font.ttf)');

let players = {};
let thisPlayer;
let currentTurnID;
let winningPlayerID;
let player0id;          //The player whose turn it will be after a new round starts

let cards = {
    "clubs": [null, ca, c2, c3, c4, c5, c6, c7, c8, c9, c10, ck, cq, cj],
    "diamonds": [null, da, d2, d3, d4, d5, d6, d7, d8, d9, d10, dk, dq, dj],
    "hearts": [null, ha, h2, h3, h4, h5, h6, h7, h8, h9, h10, hk, hq, hj],
    "spades": [null, sa, s2, s3, s4, s5, s6, s7, s8, s9, s10, sk, sq, sj]
}

let gameIDLabel;
let connectionStatus;
let roundNumIndicator;
let messageInput;
let sendButton;
let messages;
let socket;
const gameID = window.location.pathname.split("/").at(-1);

let turnIndicator = new Image();
let turnIndicatorCounter = 0;
let turnIndicatorOn = true;
let roundOver = new Image();
let gameComplete = new Image()
let roundOverFrames = 30;
let roundOverGrow = true;
let roundOverHold = false;
let roundOverHoldTimer = 0;
let roundOverUIReset;
let roundNum;

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");

    pixelFont.load().then(function(font) {
        console.log('font ready');
        document.fonts.add(font);context.font = "70px Pixelz";
        context.fillStyle = "white";
        context.fillText("Waiting for game", 450, 200)
        context.fillText("lobby to fill", 550, 300)
        context.fillText("Please wait..", 550, 400)
    });

    hitButton = document.getElementById("hit");
    standButton = document.getElementById("stand");

    gameIDLabel = document.getElementById("gameId");
    connectionStatus = document.getElementById("connectionStatus");
    roundNumIndicator = document.getElementById("roundNum");
    messages = document.getElementById("messages");
    sendButton = document.getElementById("sendButton");
    sendButton.addEventListener("click", sendMessage, false);
    messageInput = document.getElementById("messageInput");

    gameIDLabel.innerHTML = gameID;

    socket = io();

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

    socket.on("join_accepted", (pID) => {
        if (pID === playerID) {
            // This client was allowed to join
            sendButton.disabled = false;
            connectionStatus.innerHTML = "Connected";
        } else {
            // Another player joined the game

        }
    })

    // Called when another player in this game disconnects
    socket.on("other_player_disconnect", (pID) => {

    })

    socket.on("chat_message_from_server", (pID, content) => {
        messages.innerHTML += `<p>${pID.slice(1)}: ${content}</p>`;
    });

    socket.on("game_start", (game, playerList) => {
        startGame(game, playerList, 1, 52, null);
    });

    socket.on("game_update", (game, playerList, cardTaken) => {
        currentTurnID = playerList[game.current_turn].player_id;

        //Don't show the buttons while the round over animation is playing
        if (roundOverFrames === 30 && currentTurnID === playerID) {
            enableButtons();
        }

        for (let player of playerList) {
            players[player.player_id].score = player.score;
        }

        //cardTaken is a triple of (player id, value, suit)
        if (cardTaken != null) {
            remainingCards -= 1;
            if (cardTaken[0] === playerID) {
                drawCard(cardTaken[1], cardTaken[2])
            }
        }
    })


    //Args: (number of the round just finished, winning player ID)
    socket.on("round_finish", (round, winnerID) => {
        roundNum = (round + 1) % 5;
        winningPlayerID = winnerID;
        roundOverUIReset = false;
        disableButtons();
        endRoundAnimation();
    })

    load_assets([
        { "var": card_stack, "url": "/static/card_stack.png" },
        { "var": pfp1, "url": "/static/pfp1.png" }, { "var": pfp2, "url": "/static/pfp2.png" },
        { "var": pfp3, "url": "/static/pfp3.png" }, { "var": pfp4, "url": "/static/pfp4.png" },
        { "var": ha, "url": "/static/cards/AH.png" }, { "var": h2, "url": "/static/cards/2H.png" }, { "var": h3, "url": "/static/cards/3H.png" },
        { "var": h4, "url": "/static/cards/4H.png" }, { "var": h5, "url": "/static/cards/5H.png" }, { "var": h6, "url": "/static/cards/6H.png" },
        { "var": h7, "url": "/static/cards/7H.png" }, { "var": h8, "url": "/static/cards/8H.png" }, { "var": h9, "url": "/static/cards/9H.png" },
        { "var": h10, "url": "/static/cards/10H.png" }, { "var": hk, "url": "/static/cards/KH.png" }, { "var": hq, "url": "/static/cards/QH.png" },
        { "var": hj, "url": "/static/cards/JH.png" }, { "var": da, "url": "/static/cards/AD.png" }, { "var": d2, "url": "/static/cards/2D.png" },
        { "var": d3, "url": "/static/cards/3D.png" }, { "var": d4, "url": "/static/cards/4D.png" }, { "var": d5, "url": "/static/cards/5D.png" },
        { "var": d6, "url": "/static/cards/6D.png" }, { "var": d7, "url": "/static/cards/7D.png" }, { "var": d8, "url": "/static/cards/8D.png" },
        { "var": d9, "url": "/static/cards/9D.png" }, { "var": d10, "url": "/static/cards/10D.png" }, { "var": dk, "url": "/static/cards/KD.png" },
        { "var": dq, "url": "/static/cards/QD.png" }, { "var": dj, "url": "/static/cards/JD.png" }, { "var": sa, "url": "/static/cards/AS.png" },
        { "var": s2, "url": "/static/cards/2S.png" }, { "var": s3, "url": "/static/cards/3S.png" }, { "var": s4, "url": "/static/cards/4S.png" },
        { "var": s5, "url": "/static/cards/5S.png" }, { "var": s6, "url": "/static/cards/6S.png" }, { "var": s7, "url": "/static/cards/7S.png" },
        { "var": s8, "url": "/static/cards/8S.png" }, { "var": s9, "url": "/static/cards/9S.png" }, { "var": s10, "url": "/static/cards/10S.png" },
        { "var": sk, "url": "/static/cards/KS.png" }, { "var": sq, "url": "/static/cards/QS.png" }, { "var": sj, "url": "/static/cards/JS.png" },
        { "var": ca, "url": "/static/cards/AC.png" }, { "var": c2, "url": "/static/cards/2C.png" }, { "var": c3, "url": "/static/cards/3C.png" },
        { "var": c4, "url": "/static/cards/4C.png" }, { "var": c5, "url": "/static/cards/5C.png" }, { "var": c6, "url": "/static/cards/6C.png" },
        { "var": c7, "url": "/static/cards/7C.png" }, { "var": c8, "url": "/static/cards/8C.png" }, { "var": c9, "url": "/static/cards/9C.png" },
        { "var": c10, "url": "/static/cards/10C.png" }, { "var": ck, "url": "/static/cards/KC.png" }, { "var": cq, "url": "/static/cards/QC.png" },
        { "var": cj, "url": "/static/cards/JC.png" },
        { "var": turnIndicator, "url": "/static/Turn_indicator.png" },
        { "var": roundOver, "url": "/static/round_over.jpg" },
        { "var": gameComplete, "url": "/static/game_complete.jpg" }
    ], draw);

    hitButton.onclick = hitButtonPress;
    standButton.onclick = standButtonPress;
}

function startGame(game, playerList, round, cardsRemaining, hands) {
    gameStarted = true;

    roundNum = round;
    roundNumIndicator.innerHTML = round;
    remainingCards = cardsRemaining;

    for (let player of playerList) {
        players[player.player_id] = {name: player.player_id.slice(1), score: player.score, roundsWon: player.rounds_won, cards: [], pfp: null}
    }

    // We can set this up later to be used if a player goes onto the page after the game has alread started (e.g. if they reload the page)
    if (hands != null) {
        for (let card of hands) {
            players[card.player_id].cards.push(cards[card.suit][card.value]);
        }
    }

    thisPlayer = players[playerID];
    player0id = playerList[0].player_id;

    //temp
    const values = Object.values(players);
    values[0].pfp = pfp1;
    values[1].pfp = pfp2;
    values[2].pfp = pfp3;
    values[3].pfp = pfp4;

    currentTurnID = playerList[game.current_turn].player_id;

    if (currentTurnID === playerID) {
        enableButtons();
    }

    if (assetsLoaded) {
        draw();
    }
}

function draw() {
    request_id = window.requestAnimationFrame(draw);
    let now = Date.now();
    let elapsed = now - then;
    if (elapsed <= fpsInterval) {
        return;
    }
    then = now - (elapsed % fpsInterval);
    context.clearRect(0, 0, canvas.width, canvas.height)
    //draw card stack
    context.drawImage(card_stack,
        0, 0, 74, 98,
        100, canvas.height - 300, 74 * 2.5, 98 * 2.5);
    context.font = "32px Pixelz";
    context.fillStyle = "white";
    context.fillText("Remaining Cards: " + remainingCards, 25, canvas.height - 20);

    //draw pfps
    context.drawImage(thisPlayer.pfp,
            0, 0, thisPlayer.pfp.width, thisPlayer.pfp.height,
            15, 15, 100, 100);
    context.fillText(thisPlayer.name, 130, 45);
    context.font = "50px Pixelz";
    if (thisPlayer.score === 21) {
        context.fillStyle = "green";
    }
    else if (thisPlayer.score > 21) {
        context.fillStyle = "red";
    }
    else {
        context.fillStyle = "white";
    }
    context.fillText(thisPlayer.score, 160, 105);
    if (turnIndicatorOn && currentTurnID === playerID) {
        context.drawImage(turnIndicator,
            0, 0, turnIndicator.width, turnIndicator.height,
            230, 60, turnIndicator.width * 2.5, turnIndicator.height * 2.5);
    }

    let dy = 130;
    for (const [pID, player] of Object.entries(players)) {
        if (pID !== playerID) {
            context.fillStyle = "white";
            context.drawImage(player.pfp,
                    0, 0, player.pfp.width, player.pfp.height,
                    15, dy, 75, 75);
            context.font = "27px Pixelz";
            context.fillText(player.name, 105, dy + 25);
            context.font = "35px Pixelz";
            if (player.score === 21) {
                context.fillStyle = "green";
            }
            else if (player.score > 21) {
                context.fillStyle = "red";
            }
            else {
                context.fillStyle = "white";
            }
            context.fillText(player.score, 130, dy + 65);
            if (turnIndicatorOn && currentTurnID === pID) {
                context.drawImage(turnIndicator,
                0, 0, turnIndicator.width, turnIndicator.height,
                185, dy + 32, turnIndicator.width * 2, turnIndicator.height * 2);
            }
            dy += 90;
        }
    }

    context.fillStyle = "white";
    //draw cards
    let numCardsDrew = 0;
    for (let card of thisPlayer.cards){
        context.drawImage(card,
            card.width * (5 / 6), 0, card.width / 6, card.height,
            ((canvas.width / 2) - ((card.width / 6) * 3) / 2) - ((thisPlayer.cards.length - 1) * drawDestOffset) + (numCardsDrew * drawDestOffset * 2),
            canvas.height - 400, (card.width / 6) * 3, (card.height) * 3);
        numCardsDrew += 1;
    }
    if (cardDrawing === true) {
        context.drawImage(cardToDraw,
            cardToDraw.width * (cardToDrawFrame / 6), 0, cardToDraw.width / 6, cardToDraw.height,
            100 + ((canvas.width / 2) - 100 - ((cardToDraw.width / 6) * 3) / 2 - ((thisPlayer.cards.length - 1) * drawDestOffset)
                + (numCardsDrew * drawDestOffset * 2)) * (framesInDraw / 30),
            canvas.height - 400, (cardToDraw.width / 6) * 3, (cardToDraw.height) * 3);
        if (framesInDraw > 0 && framesInDraw % 5 === 0) {
            cardToDrawFrame += 1;
        }
        framesInDraw += 1;
        if (framesInDraw === 30) {
            cardDrawing = false;
            thisPlayer.cards.push(cardToDraw);
        }
    }

    // context.fillStyle = "grey";
    // context.fillRect(canvas.width - 300, 0, 300, canvas.height);
    // document.getElementById("hit").onclick = function () { drawCard() };

    // Turn Indicators
    // if (turnIndicatorOn) {
    //     // player2
    //     context.drawImage(turnIndicator,
    //         0, 0, turnIndicator.width, turnIndicator.height,
    //         185, 162, turnIndicator.width * 2, turnIndicator.height * 2);
    //     // player3
    //     context.drawImage(turnIndicator,
    //         0, 0, turnIndicator.width, turnIndicator.height,
    //         185, 252, turnIndicator.width * 2, turnIndicator.height * 2);
    //     // player4
    //     context.drawImage(turnIndicator,
    //         0, 0, turnIndicator.width, turnIndicator.height,
    //         185, 342, turnIndicator.width * 2, turnIndicator.height * 2);
    // }

    turnIndicatorCounter += 1;
    if (turnIndicatorCounter === 60) {
        turnIndicatorCounter = 0;
        turnIndicatorOn = !turnIndicatorOn;
    }
    // For when it's not your turn
    if (currentTurnID !== playerID) {
        context.font = "50px Pixelz";
        context.fillStyle = "white";
        context.fillText("Please wait for your next turn", 400, canvas.height - 50);
    }
    // round end screen
    // document.getElementById("stand").onclick = function () { endRoundAnimation() };
    if (roundOverFrames < 30) {
        endRoundAnimation();
    }
    //
}

function endRoundAnimation() {
    //roundNum has already been incremented in the "round_finish" handler

    //If the game has finished, the round number will have already been reset to 1 in the event handler
    if (roundNum === 1) {
        context.drawImage(gameComplete, 0, 0, roundOver.width, roundOver.height,
            (-(0 - (canvas.width / 2)) * (roundOverFrames / 30)), (-(0 - (canvas.height / 2))) * (roundOverFrames / 30),
            canvas.width - 300 - ((canvas.width - 300) * (roundOverFrames / 30)), canvas.height - (canvas.height * (roundOverFrames / 30))
        )
    }
    else {
        context.drawImage(roundOver, 0, 0, roundOver.width, roundOver.height,
            (-(0 - (canvas.width / 2)) * (roundOverFrames / 30)), (-(0 - (canvas.height / 2))) * (roundOverFrames / 30),
            canvas.width - 300 - ((canvas.width - 300) * (roundOverFrames / 30)), canvas.height - (canvas.height * (roundOverFrames / 30))
        )
    }
    if (roundOverGrow) {
        roundOverFrames -= 1;
        if (roundOverFrames === 0) {
            roundOverGrow = false;
            roundOverHold = true;
        }
    }
    else {
        roundOverFrames += 1
        if (roundOverFrames === 30) {
            roundOverGrow = true;
            roundOverFrames = 30;
            if (currentTurnID === playerID) {
                enableButtons();
            }
        }
    }
    if (roundOverHold) {
        roundOverFrames -= 1
        roundOverHoldTimer += 1
        // console.log(roundOverHoldTimer, roundOverFrames, roundOverGrow);
        context.font = "50px Pixelz";
        context.fillStyle = "yellow";
        context.fillText(winningPlayerID.slice(1), 500, canvas.height - 250);
        if (roundOverHoldTimer === 120) {
            roundOverHoldTimer = 0;
            roundOverHold = false;
            roundOverFrames += 2;
        }

        //Reset the UI
        if (!roundOverUIReset) {
            roundOverUIReset = true;
            remainingCards = 52;
            for (let p of Object.values(players)) {
                p.cards = [];
                p.score = 0;
            }
            players[winningPlayerID].roundsWon += 1;
            currentTurnID = player0id;
            roundNumIndicator.innerHTML = roundNum;
        }
    }
}

function enableButtons() {
    hitButton.style.display = "flex";
    standButton.style.display = "flex";
}

function disableButtons() {
    hitButton.style.display = "none";
    standButton.style.display = "none";
}

function hitButtonPress() {
    disableButtons();
    socket.emit("hit");
}

function standButtonPress() {
    disableButtons();
    socket.emit("stand");
}

function drawCard(value, suit) {
    cardToDraw = cards[suit][value];
    cardDrawing = true;
    framesInDraw = 0;
    cardToDrawFrame = 0;
}

function load_assets(assets, callback) {
    let num_assets = assets.length;
    let loaded = function () {
        console.log("loaded");
        num_assets = num_assets - 1;
        if (num_assets === 0) {
            assetsLoaded = true;
            if (gameStarted) {
                callback();
            }
        }
    }
    for (let asset of assets) {
        let element = asset.var;
        if (element instanceof HTMLImageElement) {
            console.log("img");
            element.addEventListener("load", loaded, false);
        }
        else if (element instanceof HTMLAudioElement) {
            console.log("audio");
            element.addEventListener("canplaythrough", loaded, false);
        }
        element.src = asset.url;
    }
}

function stop() {
    window.removeEventListener("keydown", activate, false);
    window.cancelAnimationFrame(request_id);
}

function randint(min, max) { return Math.round(Math.random() * (max - min)) + min; }

function sendMessage() {
    if (messageInput.value != "") {
        socket.emit("chat_message_from_client", messageInput.value);
        messageInput.value = "";
    }
}