const BOARD_SIZE = 8;
const SQUARE_SIZE = 75;

const COLUMN_TRANSLATIONS = {
    0: 'A',
    1: 'B',
    2: 'C',
    3: 'D',
    4: 'E',
    5: 'F',
    6: 'G',
    7: 'H',
};

class CheckMates {
    constructor(url, ctx) {
        this.webSocket = new WebSocket(url);
        this.board = new Board();
        this.ctx = ctx;
        this.color = 'w';
        this.turn = true;
    }

    setColor(color) {
        this.color = color;
    }

    updateTurn() {
        this.turn != this.turn;
    }

    drawBoard(){
        for (let row = 0; row < BOARD_SIZE; ++row) {
            for (let col = 0; col < BOARD_SIZE; ++col) {
                this.ctx.fillStyle = (row + col) % 2 == 0 ? 'white': 'steelblue';
                this.ctx.fillRect(row * SQUARE_SIZE, col * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
            }
        }
    }

    loadPieces() {
        const grid = this.board.getGrid();

        const drawPiece = (piece) => {
            this.ctx.drawImage(piece.img, piece.x * SQUARE_SIZE, piece.y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        }

        for (let row = 0; row < 2; ++row) {
            for (let col = 0; col < BOARD_SIZE; ++col) {
                const piece = grid[row][col];
                piece.loadImage(() => drawPiece(piece));
            }
        }

        for (let row = 6; row < BOARD_SIZE; ++row) {
            for (let col = 0; col < BOARD_SIZE; ++col) {
                const piece = grid[row][col];
                piece.loadImage(() => drawPiece(piece));
            }
        }
    }
}

class Board {
    constructor() {
        this.grid = this.initGrid();
    }

    initGrid() {
        const grid = Array.from({ length: 8 }, () => Array(8).fill(null));
        
        const whitePieces = this.initWhitePieces();
        whitePieces.forEach((piece) => {
            grid[piece.y][piece.x] = piece;
        });

        const blackPieces = this.initBlackPieces();
        blackPieces.forEach((piece) => {
            grid[piece.y][piece.x] = piece;
        })

        return grid;
    }

    initWhitePieces() {
        let pieces = [];
    
        for (let col = 0; col < BOARD_SIZE; ++col) {
            pieces.push(new Piece('pawn', 'w', col, 1));
        }
    
        pieces.push(new Piece('rook', 'w', 0, 0));
        pieces.push(new Piece('rook', 'w', 7, 0));
        pieces.push(new Piece('knight', 'w', 1, 0));
        pieces.push(new Piece('knight', 'w', 6, 0));
        pieces.push(new Piece('bishop', 'w', 2, 0));
        pieces.push(new Piece('bishop', 'w', 5, 0));
        pieces.push(new Piece('queen', 'w', 3, 0));
        pieces.push(new Piece('king', 'w', 4, 0));

        return pieces;
    }

    initBlackPieces() {
        let pieces = [];

        for (let col = 0; col < BOARD_SIZE; ++col) {
            pieces.push(new Piece('pawn', 'b', col, 6));
        }

        pieces.push(new Piece('rook', 'b', 0, 7));
        pieces.push(new Piece('rook', 'b', 7, 7));
        pieces.push(new Piece('knight', 'b', 1, 7));
        pieces.push(new Piece('knight', 'b', 6, 7));
        pieces.push(new Piece('bishop', 'b', 2, 7));
        pieces.push(new Piece('bishop', 'b', 5, 7));
        pieces.push(new Piece('queen', 'b', 4, 7));
        pieces.push(new Piece('king', 'b', 3, 7));

        return pieces;
    }

    getGrid() {
        return this.grid;
    }
}

class Piece {
    constructor(type, color, x, y) {
        this.type = type;
        this.color = color;
        this.img = new Image(SQUARE_SIZE, SQUARE_SIZE);
        this.x = x;
        this.y = y;
    }

    loadImage(callback) {
        const basePath = `imgs/${this.type}-${this.color}.svg`;
        this.img.src = basePath;

        this.img.onload = () => {
            callback();
        };
    }
}

class Pawn extends Piece {

}

class Rook extends Piece {

}

class Knight extends Piece {

}

class Bishop extends Piece {

}

class Queen extends Piece {

}

class King extends Piece {

}

window.addEventListener('load', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const checkMates = new CheckMates('ws:8000', ctx);

    checkMates.drawBoard();
    checkMates.loadPieces();
});