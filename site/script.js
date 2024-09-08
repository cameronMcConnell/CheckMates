let canvas;
let ctx;

window.addEventListener('load', () => {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    drawBoard();
});

const drawBoard = () => {
    for (let row = 0; row < 8; ++row) {
        for (let col = 0; col < 8; ++col) {
            (row + col) % 2 == 0 ? ctx.fillStyle = 'white': ctx.fillStyle = 'black';
            ctx.fillRect(row * 75, col * 75, 75, 75);
        }
    }
}

