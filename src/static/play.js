//const playerID initialised in play.html
let joinedPreviously = false;
let gameFinished = false;
let assetsLoaded = false;
let gameStarted = false;
let canvas;
let context;
let hitButton;
let standButton;
let homeButton;
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
let loadingIcon = new Image();
let pfpDefault1 = new Image();
let pfpDefault2 = new Image();
let pfpDefault3 = new Image();
let pfpDefault4 = new Image();
const defaultPfps = [pfpDefault1, pfpDefault2, pfpDefault3, pfpDefault4]
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
let draw_card_sound = new Audio();
let game_music = new Audio();
let lose_game_music = new Audio();
let menu_music = new Audio();
let round_over_sound = new Audio();
let stand_sound = new Audio();
let win_game_music = new Audio();
let fever_sound = new Audio();
let sp_m3 = new Image(); let sp_m5 = new Image(); let sp_m7 = new Image();
let sp_p3 = new Image(); let sp_p5 = new Image(); let sp_p7 = new Image();
let remainingCards;
let pixelFont = new FontFace('Pixelz', 'url(/static/pixel_font.ttf)');
let currentSong = null;

let gameMode;
let players = {};
let thisPlayer;
let currentTurnID;
let winningPlayerID;
let gameWinnerID;

let cards = {
    "clubs": [null, ca, c2, c3, c4, c5, c6, c7, c8, c9, c10, ck, cq, cj],
    "diamonds": [null, da, d2, d3, d4, d5, d6, d7, d8, d9, d10, dk, dq, dj],
    "hearts": [null, ha, h2, h3, h4, h5, h6, h7, h8, h9, h10, hk, hq, hj],
    "spades": [null, sa, s2, s3, s4, s5, s6, s7, s8, s9, s10, sk, sq, sj],
    "special": {[-7]:sp_m7, [-5]:sp_m5, [-3]:sp_m3, 3:sp_p3, 5:sp_p5, 7:sp_p7}
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
let gameComplete = new Image();
let feverImage = new Image();
let roundOverFrames = 30;
let roundOverGrow = true;
let roundOverHold = false;
let roundOverHoldTimer = 0;
let roundOverUIReset;
let showGameCompleteAnimation = false;
let roundNum;

let feverFrames = 30;
let feverGrow = true;
let feverHold = false;
let feverHoldTimer = 0;

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    gameMode = document.getElementById("gameMode").innerHTML;

    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");

    pixelFont.load().then(function(font) {
        console.log('font ready');
        document.fonts.add(font);context.font = "70px Pixelz";
        context.fillStyle = "white";
        context.fillText("Waiting for other", 450, 200)
        context.fillText("players to join", 475, 300)
        context.fillText("Please wait..", 525, 400)
    });

    hitButton = document.getElementById("hit");
    standButton = document.getElementById("stand");
    homeButton = document.getElementById("home");

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
        if (joinedPreviously) {
            //If reconnecting after being disconnected, reload the page to catch up on any missed updates
            location.reload();
        } else {
            socket.emit("join_request", gameID);
        }
    })

    socket.on("disconnect", (reason) => {
        sendButton.disabled = true;
        connectionStatus.innerHTML = "Disconnected";
    })

    socket.on("join_accepted", (pID, gameState) => {
        if (pID === playerID) {
            // This client was allowed to join
            joinedPreviously = true;
            sendButton.disabled = false;
            connectionStatus.innerHTML = "Connected";
            if (gameState != null) {
                // The game is already started, and this player is reconnecting
                startGame(gameState.players, gameState.turn, gameState.round, gameState.numCards, gameState.hands)
            }
        }
        showMessage(null, `${pID.slice(1)} joined the game`)
    })

    socket.on("join_refused", (message) => {
        showMessage(null, "Join request refused: " + message);
    })

    // Called when another player in this game disconnects
    socket.on("other_player_disconnect", (pID) => {
        showMessage(null, `${pID.slice(1)} disconnected. Waiting for reconnect...`);
    })

    socket.on("chat_message_from_server", (pID, content) => {
        showMessage(pID, content);
    });

    socket.on("game_start", (turn, playerList) => {
        let numRemaining;
        if (gameMode === "Modified") {
            numRemaining = 64;
        } else {
            numRemaining = 52;
        }
        startGame(playerList, turn, 1, numRemaining, null);
    });

    socket.on("game_update", (playerList, turn, cardTaken) => {
        currentTurnID = turn;

        //Don't show the buttons while the round over animation is playing
        if (gameStarted && roundOverFrames === 30 && currentTurnID === playerID) {
            enableButtons();
        }

        for (let player of playerList) {
            players[player.player_id].score = player.score;
            players[player.player_id].stood = player.stood;
            if (player.score === 404) {
                players[player.player_id].roundsWon = 0;
            }
        }

        //cardTaken is a triple of (player id, value, suit)
        if (cardTaken != null) {
            remainingCards -= 1;
            if (cardTaken[0] === playerID) {
                drawCard(cardTaken[1], cardTaken[2])
            }
            if (cardTaken[2] === "special") {
                feverAnimation();
            }
        }
    })


    // Args: (number of the round just finished, winning player ID, winning score, current turn ID)
    socket.on("round_finish", (round, winnerID, winningScore, turn) => {
        if (round < 5) {
            roundNum = round + 1;
            roundNumIndicator.innerHTML = roundNum;
        }
        winningPlayerID = winnerID;
        currentTurnID = turn;
        roundOverUIReset = false;
        showMessage(null, `${winnerID.slice(1)} won round ${round} with a score of ${winningScore}`);
        disableButtons();
        endRoundAnimation();
    })

    // Args: (game winner, final round winner, final round winning score, player list)
    socket.on("game_finish", (gameWinner, finalRoundWinner, finalRoundWinningScore, playerList) => {
        showGameCompleteAnimation = true;
        if (gameWinner === playerID) {
            playBGM("win");
        } else {
            playBGM("lose");
        }
        gameWinnerID = gameWinner;
        winningPlayerID = finalRoundWinner;
        roundOverUIReset = false;
        showMessage(null, `${finalRoundWinner.slice(1)} won round 5 with a score of ${finalRoundWinningScore}`);
        showMessage(null, `${gameWinner.slice(1)} won the game!`);
        disableButtons();
        endRoundAnimation();
    })

    load_assets([
        { "var": card_stack, "url": "/static/card_stack.png" },
        { "var": loadingIcon, "url": "/static/loading.png" },
        { "var": pfpDefault1, "url": "/static/pfp/default1.jpg" }, { "var": pfpDefault2, "url": "/static/pfp/default2.png" },
        { "var": pfpDefault3, "url": "/static/pfp/default3.png" }, { "var": pfpDefault4, "url": "/static/pfp/default4.png" },
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
        { "var": cj, "url": "/static/cards/JC.png" }, { "var": sp_m3, "url": "/static/cards/M3-SP.png" }, { "var": sp_m5, "url": "/static/cards/M5-SP.png" },
        { "var": sp_m7, "url": "/static/cards/M7-SP.png" }, { "var": sp_p3, "url": "/static/cards/P3-SP.png" }, { "var": sp_p5, "url": "/static/cards/P5-SP.png" },
        { "var": sp_p7, "url": "/static/cards/P7-SP.png" },
        { "var": turnIndicator, "url": "/static/Turn_indicator.png" },
        { "var": roundOver, "url": "/static/round_over.jpg" },
        { "var": gameComplete, "url": "/static/game_complete.jpg" },
        { "var": feverImage, "url": "/static/fever.png" },
        { "var": draw_card_sound, "url": "/static/draw_card_sound.wav" },
        { "var": game_music, "url": "/static/game_music.wav" },
        { "var": lose_game_music, "url": "/static/lose_game_music.wav" },
        { "var": menu_music, "url": "/static/menu_music.wav" },
        { "var": round_over_sound, "url": "/static/round_over_sound.wav" },
        { "var": stand_sound, "url": "/static/stand_sound.wav" },
        { "var": win_game_music, "url": "/static/win_game_music.wav" },
        { "var": fever_sound, "url": "/static/fever_sound.wav" }
    ], draw);

    hitButton.onclick = hitButtonPress;
    standButton.onclick = standButtonPress;
    homeButton.onclick = function() {
        location.href = "/";
    }
}

function startGame(playerList, turn, round, cardsRemaining, hands) {
    gameStarted = true;

    roundNum = round;
    roundNumIndicator.innerHTML = round;
    remainingCards = cardsRemaining;

    let defaultPfpIndex = 0;

    for (let player of playerList) {
        players[player.player_id] = {name: player.player_id.slice(1), stood: player.stood, score: player.score, roundsWon: player.rounds_won, cards: [], pfp: null, pfpLoading: null}
        if (player.player_id.charAt(0) === "u") {
            // The player is a registerd user
            players[player.player_id].pfp = loadingIcon;
            players[player.player_id].pfpLoading = new Image();
            players[player.player_id].pfpLoading.addEventListener("load", updatePFPs, false);
            players[player.player_id].pfpLoading.src = "/pfp/" + player.player_id.slice(1);
        } else {
            // The player is a guest
            players[player.player_id].pfp = defaultPfps[defaultPfpIndex];
            defaultPfpIndex++;
        }
    }

    if (hands != null) {
        for (let card of hands) {
            players[card.player_id].cards.push(cards[card.suit][card.value]);
        }
    }

    thisPlayer = players[playerID];

    currentTurnID = turn;

    if (assetsLoaded) {
        draw();
        if (currentTurnID === playerID) {
            enableButtons();
        }
    }
}

function updatePFPs() {
    for (let player of Object.values(players)) {
        if (player.pfpLoading != null && player.pfpLoading.complete) {
            player.pfp = player.pfpLoading;
        }
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
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!showGameCompleteAnimation) {
        playBGM("game");
    }

    //draw card stack
    context.drawImage(card_stack,
        0, 0, 74, 98,
        100, canvas.height - 300, 74 * 2.5, 98 * 2.5);
    context.font = "32px Pixelz";
    context.fillStyle = "white";
    if (!(showGameCompleteAnimation && roundOverUIReset)) {
        context.fillText("Remaining Cards: " + remainingCards, 25, canvas.height - 20);
    }

    //draw pfps
    context.drawImage(thisPlayer.pfp,
            0, 0, thisPlayer.pfp.width, thisPlayer.pfp.height,
            15, 15, 100, 100);
    if (!(showGameCompleteAnimation && roundOverUIReset) && thisPlayer.stood === 1) {
        context.fillStyle = "red";
    } else {
        context.fillStyle = "white";
    }
    context.fillText(thisPlayer.name, 130, 45);
    context.font = "50px Pixelz";
    if (!(showGameCompleteAnimation && roundOverUIReset)) {
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
    }
    context.fillStyle = "yellow";
    context.font = "25px Pixelz";
    context.fillText(thisPlayer.roundsWon, 130, 110);
    if (!(showGameCompleteAnimation && roundOverUIReset) && turnIndicatorOn && currentTurnID === playerID) {
        context.drawImage(turnIndicator,
            0, 0, turnIndicator.width, turnIndicator.height,
            230, 60, turnIndicator.width * 2.5, turnIndicator.height * 2.5);
    }

    let dy = 130;
    for (const [pID, player] of Object.entries(players)) {
        if (pID !== playerID) {
            context.drawImage(player.pfp,
                    0, 0, player.pfp.width, player.pfp.height,
                    15, dy, 75, 75);
            if (!(showGameCompleteAnimation && roundOverUIReset) && player.stood === 1) {
                context.fillStyle = "red";
            } else {
                context.fillStyle = "white";
            }
            context.font = "27px Pixelz";
            context.fillText(player.name, 105, dy + 25);
            context.font = "35px Pixelz";
            if (!(showGameCompleteAnimation && roundOverUIReset)) {
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
            }
            context.fillStyle = "yellow";
            context.font = "25px Pixelz";
            context.fillText(player.roundsWon, 103, dy + 70);
            if (!(showGameCompleteAnimation && roundOverUIReset) && turnIndicatorOn && currentTurnID === pID) {
                context.drawImage(turnIndicator,
                0, 0, turnIndicator.width, turnIndicator.height,
                185, dy + 32, turnIndicator.width * 2, turnIndicator.height * 2);
            }
            dy += 90;
        }
    }

    context.fillStyle = "grey";
    context.fillRect(canvas.width - 300, 0, 300, canvas.height);

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

    turnIndicatorCounter += 1;
    if (turnIndicatorCounter === 60) {
        turnIndicatorCounter = 0;
        turnIndicatorOn = !turnIndicatorOn;
    }
    context.font = "50px Pixelz";
    context.fillStyle = "white";
    if (showGameCompleteAnimation && roundOverUIReset) {
        context.fillText("Thanks for playing!", 400, canvas.height - 50);
    } else {
        // For when it's not your turn
        if (currentTurnID !== playerID) {
            if (thisPlayer.stood === 1) {
                context.fillText("You are stood for this round", 400, canvas.height - 50);
            } else {
                context.fillText("Please wait for your next turn", 400, canvas.height - 50);
            }
        }
    }

    if (feverFrames < 30) {
        feverAnimation();
    }
    
    if (gameFinished) {
        window.cancelAnimationFrame(request_id);
    } else if (roundOverFrames < 30) {
        endRoundAnimation();
    }
}

function endRoundAnimation() {
    if (showGameCompleteAnimation) {
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
        round_over_sound.volume = 1;
        round_over_sound.play();
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

            if (showGameCompleteAnimation) {
                gameFinished = true;
                homeButton.style.display = "flex";
            } else {
                if (currentTurnID === playerID) {
                    enableButtons();
                }
            }
        }
    }
    if (roundOverHold) {
        roundOverFrames -= 1
        roundOverHoldTimer += 1
        context.font = "50px Pixelz";
        context.fillStyle = "yellow";
        if (showGameCompleteAnimation) {
            context.fillText(gameWinnerID.slice(1), 500, canvas.height - 250);
        } else {
            context.fillText(winningPlayerID.slice(1), 500, canvas.height - 250);
        }
        if (roundOverHoldTimer === 120) {
            roundOverHoldTimer = 0;
            roundOverHold = false;
            roundOverFrames += 2;
        }

        //Reset the UI
        if (!roundOverUIReset) {
            roundOverUIReset = true;
            for (let p of Object.values(players)) {
                if (p.score !== 404) {
                    p.score = 0;
                    p.stood = 0;
                    p.cards = [];
                }
            }
            players[winningPlayerID].roundsWon += 1;

            if (!showGameCompleteAnimation) {
                if (gameMode === "Modified") {
                    remainingCards = 64;
                } else {
                    remainingCards = 52;
                }
            }
        }
    }
}

function feverAnimation() {
    context.drawImage(feverImage, 0, 0, feverImage.width, feverImage.height,
        (((canvas.width/2)-(feverImage.width/4)) + ((feverImage.width/4) * (feverFrames / 30))), (80 + ((feverImage.height/4) * (feverFrames / 30))),
        (feverImage.width/2) - ((feverImage.width/2) * (feverFrames / 30)), (feverImage.height/2) - ((feverImage.height/2) * (feverFrames / 30))
    )
    if (feverGrow) {
        fever_sound.volume = 1;
        fever_sound.play();
        feverFrames -= 1;
        if (feverFrames === 0) {
            feverGrow = false;
            feverHold = true;
        }
    }
    else {
        feverFrames += 1
        if (feverFrames === 30) {
            feverGrow = true;
            feverFrames = 30;
        }
    }
    if (feverHold) {
        feverFrames -= 1
        feverHoldTimer += 1
        if (feverHoldTimer === 60) {
            feverHoldTimer = 0;
            feverHold = false;
            feverFrames += 2;
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
    stand_sound.volume = 1;
    stand_sound.play();
}

function drawCard(value, suit) {
    draw_card_sound.volume = 1;
    draw_card_sound.play();
    cardToDraw = cards[suit][value];
    cardDrawing = true;
    framesInDraw = 0;
    cardToDrawFrame = 0;
}

function playBGM(song) {
    if (song === "game") {
        game_music.loop = true;
        game_music.volume = 0.4;
        game_music.play().catch(() => {});;
        currentSong = game_music;
    }
    else if (song === "win") {
        game_music.pause();
        win_game_music.loop = true;
        win_game_music.volume = 0.4;
        win_game_music.play().catch(() => {});;
        currentSong = win_game_music;
    }
    else if (song === "lose") {
        game_music.pause();
        lose_game_music.loop = true;
        lose_game_music.volume = 0.4;
        lose_game_music.play().catch(() => {});;
        currentSong = lose_game_music;
    }
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
                if (currentTurnID === playerID) {
                    enableButtons();
                }
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

function randint(min, max) { return Math.round(Math.random() * (max - min)) + min; }

function sendMessage() {
    if (messageInput.value != "") {
        socket.emit("chat_message_from_client", messageInput.value);
        messageInput.value = "";
    }
}

function showMessage(pID, content) {
    if (pID == null) {
        messages.innerHTML += `<p><i>${content}</i></p>`;
    } else {
        messages.innerHTML += `<p>${pID.slice(1)}: ${content}</p>`;
    }
    messages.scrollTop = messages.scrollHeight;
}