const socket = new WebSocket('ws://localhost:4000/ws');
let parsedata;
socket.addEventListener('open', () => {
    console.log('✅ Connexion établie');
    socket.send('Hello serveur !');
});
socket.addEventListener('message', (event) => {
    const isjson = (str) => {
        try {
            JSON.parse(str);
            return true;
        }
        catch {
            return false;
        }
    };
    const str = event.data;
    if (isjson(str)) {
        parsedata = JSON.parse(str);
        drawPong(parsedata);
    }
    else {
        console.log('📨 Réponse serveur :', str);
    }
});
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
function drawPong(parsedata) {
    console.log(parsedata);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = 'black';
    ctx.fillRect(parsedata.player1.pos_x, parsedata.player1.pos_y, parsedata.player1.width, parsedata.player1.height);
    ctx.fillRect(parsedata.player2.pos_x, parsedata.player2.pos_y, parsedata.player2.width, parsedata.player2.height);
    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.arc(parsedata.ball.pos_x, parsedata.ball.pos_y, 10, 0, Math.PI * 2);
    ctx.fill();
}
const keyPressed = {
    up_p1: false,
    down_p1: false,
    up_p2: false,
    down_p2: false
};
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp")
        keyPressed.up_p1 = true;
    if (e.key === "ArrowDown")
        keyPressed.down_p1 = true;
    if (e.key === "w")
        keyPressed.up_p2 = true;
    if (e.key === "s")
        keyPressed.down_p2 = true;
});
window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp")
        keyPressed.up_p1 = false;
    if (e.key === "ArrowDown")
        keyPressed.down_p1 = false;
    if (e.key === "w")
        keyPressed.up_p2 = false;
    if (e.key === "s")
        keyPressed.down_p2 = false;
});
setInterval(() => {
    if (keyPressed.up_p1) {
        socket.send("p1_up");
    }
    else if (keyPressed.down_p1) {
        socket.send("p1_down");
    }
    if (keyPressed.up_p2) {
        socket.send("p2_up");
    }
    else if (keyPressed.down_p2) {
        socket.send("p2_down");
    }
}, 1000 / 60);
export {};
