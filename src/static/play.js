let canvas;
let context;
let request_id;
let fpsInterval = 1000 / 60;
let now;
let cardDrawing = false;
let cardToDraw;
let cardToDrawID;
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
let remainingCards = 52;
var pixelFont = new FontFace('Pixelz', 'url(/static/pixel_font.ttf)');
let p1 = {score:0, cards:[], pfp:pfp1};
let p2 = {score:0, cards:[], pfp:pfp2};
let p3 = {score:0, cards:[], pfp:pfp3};
let p4 = {score:0, cards:[], pfp:pfp4};
let cards = [ha, h2, h3, h4, h5, h6, h7, h8, h9, h10, hk, hq, hj,
            da, d2, d3, d4, d5, d6, d7, d8, d9, d10, dk, dq, dj,
            sa, s2, s3, s4, s5, s6, s7, s8, s9, s10, sk, sq, sj,
            ca, c2, c3, c4, c5, c6, c7, c8, c9, c10, ck, cq, cj]
document.addEventListener("DOMContentLoaded", init, false);

function init() {
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");
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
        { "var": cj, "url": "/static/cards/JC.png" }
    ], draw);
}

pixelFont.load().then(function(font) {
  console.log('font ready');
  document.fonts.add(font);
});

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
    context.drawImage(pfp1,
            0, 0, pfp1.width, pfp1.height,
            15, 15, 100, 100);
    context.fillText("Player 1", 130, 45);
    context.font = "50px Pixelz";
    if (p1.score === 21) {
        context.fillStyle = "green";
    }
    else if (p1.score > 21) {
        context.fillStyle = "red";
    }
    else {
        context.fillStyle = "white";
    }
    context.fillText(p1.score, 160, 105);
    context.fillStyle = "white";
    context.drawImage(pfp2,
            0, 0, pfp2.width, pfp2.height,
            15, 130, 75, 75);
    context.font = "27px Pixelz";
    context.fillText("Player 2", 105, 155);
    context.font = "35px Pixelz";
    if (p2.score === 21) {
        context.fillStyle = "green";
    }
    else if (p2.score > 21) {
        context.fillStyle = "red";
    }
    else {
        context.fillStyle = "white";
    }
    context.fillText(p2.score, 130, 195);
    context.fillStyle = "white";
    context.drawImage(pfp3,
            0, 0, pfp3.width, pfp3.height,
            15, 220, 75, 75);
    context.font = "27px Pixelz";
    context.fillText("Player 3", 105, 245);
    context.font = "35px Pixelz";
    if (p3.score === 21) {
        context.fillStyle = "green";
    }
    else if (p3.score > 21) {
        context.fillStyle = "red";
    }
    else {
        context.fillStyle = "white";
    }
    context.fillText(p3.score, 130, 285);
    context.fillStyle = "white";
    context.drawImage(pfp4,
            0, 0, pfp4.width, pfp4.height,
            15, 310, 75, 75);
    context.font = "27px Pixelz";
    context.fillText("Player 4", 105, 335);
    context.font = "35px Pixelz";
    if (p4.score === 21) {
        context.fillStyle = "green";
    }
    else if (p4.score > 21) {
        context.fillStyle = "red";
    }
    else {
        context.fillStyle = "white";
    }
    context.fillText(p4.score, 130, 375);
    context.fillStyle = "white";
    //draw cards
    let numCardsDrew = 0;
    for (let card of p1.cards){
        context.drawImage(card,
            card.width*(5/6), 0, card.width/6, card.height,
            ((canvas.width/2)-((card.width/6)*3)/2) - ((p1.cards.length-1)*drawDestOffset) + (numCardsDrew*drawDestOffset*2), 
                canvas.height - 400, (card.width/6)*3, (card.height)*3);
        numCardsDrew += 1;
    } 
    if (cardDrawing === true) {
        context.drawImage(cardToDraw,
            cardToDraw.width*(cardToDrawFrame/6), 0, cardToDraw.width/6, cardToDraw.height,
            100+((canvas.width/2)-100-((cardToDraw.width/6)*3)/2 - ((p1.cards.length-1)*drawDestOffset) 
                    + (numCardsDrew*drawDestOffset*2))*(framesInDraw/30), 
                canvas.height - 400, (cardToDraw.width/6)*3, (cardToDraw.height)*3);
        if (framesInDraw > 0 && framesInDraw % 5 === 0) {
            cardToDrawFrame += 1;
        }
        framesInDraw += 1;
        if (framesInDraw === 30) {
            cardDrawing = false;
            p1.cards.push(cardToDraw);
            updateP1Score();
        }
    }
    context.fillStyle = "grey";
    context.fillRect(canvas.width-300, 0, 300, canvas.height);
    document.getElementById("hit").onclick = function() {drawCard()};
}

function updateP1Score() {
    if (cardToDraw === ha || cardToDraw === da || cardToDraw === sa || cardToDraw === ca) {
        p1.score += 1;
    }
    else if (cardToDraw === h2 || cardToDraw === d2 || cardToDraw === s2 || cardToDraw === c2) {
        p1.score += 2;
    }
    else if (cardToDraw === h3 || cardToDraw === d3 || cardToDraw === s3 || cardToDraw === c3) {
        p1.score += 3;
    }
    else if (cardToDraw === h4 || cardToDraw === d4 || cardToDraw === s4 || cardToDraw === c4) {
        p1.score += 4;
    }
    else if (cardToDraw === h5 || cardToDraw === d5 || cardToDraw === s5 || cardToDraw === c5) {
        p1.score += 5;
    }
    else if (cardToDraw === h6 || cardToDraw === d6 || cardToDraw === s6 || cardToDraw === c6) {
        p1.score += 6;
    }
    else if (cardToDraw === h7 || cardToDraw === d7 || cardToDraw === s7 || cardToDraw === c7) {
        p1.score += 7;
    }
    else if (cardToDraw === h8 || cardToDraw === d8 || cardToDraw === s8 || cardToDraw === c8) {
        p1.score += 8;
    }
    else if (cardToDraw === h9 || cardToDraw === d9 || cardToDraw === s9 || cardToDraw === c9) {
        p1.score += 9;
    }
    else if (cardToDraw === h10 || cardToDraw === d10 || cardToDraw === s10 || cardToDraw === c10) {
        p1.score += 10;
    }
    else if (cardToDraw === hk || cardToDraw === dk || cardToDraw === sk || cardToDraw === ck) {
        p1.score += 10;
    }
    else if (cardToDraw === hq || cardToDraw === dq || cardToDraw === sq || cardToDraw === cq) {
        p1.score += 10;
    }
    else if (cardToDraw === hj || cardToDraw === dj || cardToDraw === sj || cardToDraw === cj) {
        p1.score += 10;
    }
}

function drawCard() {
    cardToDrawID = randint(0, 51);
    cardToDraw = cards[cardToDrawID];
    cardDrawing = true;
    framesInDraw = 0;
    cardToDrawFrame = 0;
    remainingCards -= 1;
}

function load_assets(assets, callback) {
    let num_assets = assets.length;
    let loaded = function () {
        console.log("loaded");
        num_assets = num_assets - 1;
        if (num_assets === 0) {
            callback();
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