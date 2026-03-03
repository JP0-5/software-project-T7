let canvas;
let context;
let request_id;
let fpsInterval = 1000 / 60;
let now;
let then = Date.now();
let falling_token = new Image();
let token1 = { x: 250, y: -100, width: 30, height: 30, frame: 0};
let token2 = { x: 350, y: -300, width: 30, height: 30, frame: 3};
let token3 = { x: 250, y: -500, width: 30, height: 30, frame: 1};
let token4 = { x: 350, y: -700, width: 30, height: 30, frame: 2};
let token5 = { x: 800+350, y: -100, width: 30, height: 30, frame: 0};
let token6 = { x: 800+250, y: -300, width: 30, height: 30, frame: 3};
let token7 = { x: 800+350, y: -500, width: 30, height: 30, frame: 1};
let token8 = { x: 800+250, y: -700, width: 30, height: 30, frame: 2};
let tokens = [token1, token2, token3, token4, token5, token6, token7, token8];
let corner_cards = new Image();
let menu_music = new Audio();


document.addEventListener("DOMContentLoaded", init, false);

function init() {
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");
    load_assets([
        { "var": falling_token, "url": "static/falling_token.png" },
        { "var": menu_music, "url": "/static/menu_music.wav" }
    ], draw);
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
    playBGM("menu");
    //draw falling token
    for (let t of tokens){
        context.drawImage(falling_token,
            0, (t.frame * t.height), t.width, t.height,
            t.x, t.y, t.width * 5, t.height * 5);
        t.y +=5;
        if (t.y >= canvas.height) {
                t.y = -100;      
        }
        if (t.y % 4 === 0) {
            t.frame += 1;
            if (t.frame === 10) {
                t.frame = 0;
            }
        }
    } 
}

function playBGM(song) {
    if (song === "menu") {
        menu_music.loop = true;
        menu_music.volume = 0.4;
        menu_music.play().catch(() => {});
    }
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