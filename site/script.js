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
    constructor(url, canvas, ctx) {
        this.webSocket = new WebSocket(url);
        this.color = 'w';
        this.board = this.initBoard(canvas, ctx, this.color);
        this.turn = true;
    }

    setColor(color) {
        this.color = color;
    }

    updateTurn() {
        this.turn != this.turn;
    }

    initBoard(canvas, ctx, color) {
        if (color === 'w') {
            ctx.translate(canvas.width, canvas.height);
            ctx.rotate(Math.PI);
        }

        let board = new Board(canvas, ctx, color);

        board.drawBoard();
        board.loadPieces();

        canvas.addEventListener('click', (event) => board.handleClick(event))

        return board;
    }
}

class Board {
    constructor(canvas, ctx, color) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.color = color;
        
        this.whitePieces = this.initWhitePieces();
        this.blackPieces =this.initBlackPieces();
        this.grid = this.initGrid();
        
        this.selectedPiece = null;
        this.whiteCheck = false;
        this.blackCheck = false;
        this.whiteKingPos = [4, 0];
        this.blackKingPos = [4, 7];
    }

    setWhiteCheck(flag) {
        this.whiteCheck = flag;
    }

    setBlackCheck(flag) {
        this.blackCheck = flag;
    }

    updateWhiteKingPos(x, y) {
        this.whiteKingPos = [x, y];
    }

    updateBlackKingPos(x, y) {
        this.blackKingPos = [x, y];
    }

    getWhiteKingPos() {
        return this.whiteKingPos;
    }

    getBlackKingPos() {
        return this.blackKingPos;
    }

    initGrid() {
        const grid = Array.from({ length: 8 }, () => Array(8).fill(null));
        
        this.whitePieces.forEach((piece) => {
            grid[piece.y][piece.x] = piece;
        });

        this.blackPieces.forEach((piece) => {
            grid[piece.y][piece.x] = piece;
        })

        return grid;
    }

    drawBoard() {
        for (let row = 0; row < BOARD_SIZE; ++row) {
            for (let col = 0; col < BOARD_SIZE; ++col) {
                this.drawBoardSquare(row, col);
            }
        }
    }

    loadPieces() {
        for (let row = 0; row < 2; ++row) {
            for (let col = 0; col < BOARD_SIZE; ++col) {
                const piece = this.grid[row][col];
                piece.loadImage(() => this.drawPiece(piece));
            }
        }

        for (let row = 6; row < BOARD_SIZE; ++row) {
            for (let col = 0; col < BOARD_SIZE; ++col) {
                const piece = this.grid[row][col];
                piece.loadImage(() => this.drawPiece(piece));
            }
        }
    }

    drawBoardSquare(x, y) {
        this.ctx.fillStyle = (x + y) % 2 === 0 ? 'white': 'steelblue';
        this.ctx.fillRect(x * SQUARE_SIZE, y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
    }

    drawPiece(piece) {
        this.ctx.save();

        const pieceX = piece.x * SQUARE_SIZE;
        const pieceY = piece.y * SQUARE_SIZE;

        if (this.color === 'w') {
            this.ctx.translate(pieceX + SQUARE_SIZE / 2, pieceY + SQUARE_SIZE / 2);
            this.ctx.rotate(Math.PI);
            this.ctx.drawImage(piece.img, -SQUARE_SIZE / 2, -SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE);
        } 
        else {
            this.ctx.drawImage(piece.img, pieceX, pieceY, SQUARE_SIZE, SQUARE_SIZE);
        }

        this.ctx.restore();
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();

        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        if (this.color === 'w') {
            x = this.canvas.width - x;
            y = this.canvas.height - y;
        }

        const clickedX = Math.floor(x / SQUARE_SIZE);
        const clickedY = Math.floor(y / SQUARE_SIZE);

        const piece = this.grid[clickedY][clickedX];

        if (this.selectedPiece === null && piece === null) {
            return;
        }
        
        if (this.selectedPiece === null && piece !== null && piece.color !== this.color) {
            return;
        }

        if (this.selectedPiece === null && piece !== null) {
            this.highlightPiece(clickedX, clickedY, piece);
            return;
        }

        const [selectedX, selectedY] = this.selectedPiece.getPos();

        if (selectedX === clickedX && selectedY === clickedY) {
            this.drawBoardSquare(selectedX, selectedY);
            this.drawPiece(piece);
            this.selectedPiece = null;
            return;
        }

        if (piece !== null && piece.color === this.color) {
            this.drawBoardSquare(selectedX, selectedY);
            this.drawPiece(this.selectedPiece);
            this.highlightPiece(clickedX, clickedY, piece);
            return;
        }

        this.movePiece(clickedX, clickedY);
    }

    highlightPiece(x, y, piece) {
        this.ctx.fillStyle = '#FFD966';
        this.ctx.fillRect(x * SQUARE_SIZE, y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        this.selectedPiece = piece;
        this.drawPiece(piece);
    }

    removePieceHighlight() {
        this.drawBoardSquare(this.selectedPiece.x, this.selectedPiece.y);
        this.drawPiece(this.selectedPiece);
    }

    movePiece(x, y) {
        const validMoves = this.getValidMoves();
        const move = `${x},${y}`;

        if (validMoves.has(move)) {
            // Handle checks first
            if (!this.handleCheck(move, x, y)) {
                this.removePieceHighlight();
                this.selectedPiece = null;
                return;
            }

            this.updatePieceState(move);

            // Update canvas and grid
            this.drawBoardSquare(this.selectedPiece.x, this.selectedPiece.y);
            this.grid[this.selectedPiece.y][this.selectedPiece.x] = null;

            // Remove piece and update board
            if (this.grid[y][x] !== null) {
                this.drawBoardSquare(x, y);
                this.grid[y][x].setRemoved();
            }

            // Update piece position, canvas, and grid
            this.selectedPiece.updatePos(x, y);
            this.drawPiece(this.selectedPiece);
            this.grid[y][x] = this.selectedPiece;

            // Not possible to be in check
            this.setWhiteCheck(false);
            this.setBlackCheck(false);

            // Check if piece is now in check.
            const newValidMoves = this.getValidMoves();
            
            if (this.selectedPiece.color === 'w') {
                const [bKingX, bKingY] = this.getBlackKingPos();

                // Check for black king pos in new moves.
                if (newValidMoves.has(`${bKingX},${bKingY}`)) {
                    this.setBlackCheck(true);
                }
            }
            else {
                const [wKingX, wKingY] = this.getWhiteKingPos();

                // Check for white king pos in new moves.
                if (newValidMoves.has(`${wKingX},${wKingY}`)) {
                    this.setWhiteCheck(true);
                }
            }
        }
        else {
            this.removePieceHighlight();
        }

        this.selectedPiece = null;
    }

    handleCheck(move, x, y) {
        if (this.selectedPiece.type === 'king') {
            if (this.selectedPiece.color === 'w') {
                return this.checkKingMove(move, x, y, this.blackPieces);
            }

            return this.checkKingMove(move, x, y, this.whitePieces);
        }

        if (this.selectedPiece.color === 'b' && this.blackCheck && this.selectedPiece !== 'king') {
            return false;
        } 

        if (this.selectedPiece.color === 'w' && this.white && this.selectedPiece !== 'king') {
            return false;
        }

        return true;
    }

    checkKingMove(move, x, y, pieces) {
        let result = true;

        // Simulate the move
        const takenPiece = this.grid[y][x];
        this.grid[y][x] = this.selectedPiece;

        const [prevX, prevY] = this.selectedPiece.getPos();
        const prevPiece = this.selectedPiece;
        this.grid[prevY][prevX] = null;
        
        // Check the moves of each opposing piece
        pieces.forEach((piece) => {
            if (!piece.removed) {
                this.selectedPiece = piece;
                const newValidMoves = this.getValidMoves();

                if (newValidMoves.has(move)) {
                    result = false;
                }
            }
        });
        
        // Revert to previous state
        this.selectedPiece = prevPiece;
        this.grid[prevY][prevX] = prevPiece;
        this.grid[y][x] = takenPiece;

        return result;
    }

    updatePieceState(move) {
        switch (this.selectedPiece.type) {
            case 'pawn':
                this.updatePawnState(move);
                break;
            case 'king':
                this.updateKingState(move);
                break;
            case 'rook':
                break;
            default:
                break;
        }
    }

    updatePawnState(move) {
        const x = this.selectedPiece.x;
        const y = this.selectedPiece.y;

        if (this.selectedPiece.color === 'w') {

            if (move === `${x},${y + 2}`) {
                this.selectedPiece.setHasMovedTwoSpaces(true);
            }
            else {
                this.selectedPiece.setHasMovedTwoSpaces(false);
            }

            this.selectedPiece.setHasMoved();
        } 
        else {

            if (move === `${x},${y - 2}`) {
                this.selectedPiece.setHasMovedTwoSpaces(true);
            }
            else {
                this.selectedPiece.setHasMovedTwoSpaces(false);
            }

            this.selectedPiece.setHasMoved();
        }
    }

    updateKingState(move) {
        const [x, y] = this.selectedPiece.getPos();
        
        if (this.selectedPiece.color === 'w') {
            this.updateWhiteKingPos(x, y);
        }
        else {
            this.updateBlackKingPos(x, y);
        }

        this.selectedPiece.setHasMoved();
    }

    updateRookState() {
        this.selectedPiece.setHasMoved();
    }

    getValidMoves() {
        let validMoves;

        switch (this.selectedPiece.type) {
            case 'pawn':
                validMoves = this.getPawnMoves();
                break;
            case 'rook':
                validMoves = this.getRookMoves();
                break;
            case 'knight':
                validMoves = this.getKnightMoves();
                break;
            case 'bishop':
                validMoves = this.getBishopMoves();
                break;
            case 'queen':
                validMoves = this.getQueenMoves();
                break;
            case 'king':
                validMoves = this.getKingMoves();
                break;
            default:
                console.log('Not a valid piece. You messing with the source code. Naughty Naughty.');
                validMoves = null;
                break;
        }

        return validMoves;
    }

    getPawnMoves() {
        if (this.selectedPiece.color === 'w') {
            return this.pawnMovesLogic('b', 1, 4);
        }

        return this.pawnMovesLogic('w', -1, 3);
    }

    pawnMovesLogic(color, inc, enPassantRank) {
        const pawnMoves = new Set();

        const x = this.selectedPiece.x;
        const y = this.selectedPiece.y;

        if (y + inc < BOARD_SIZE && this.grid[y + inc][x] === null) {
            pawnMoves.add(`${x},${y + inc}`);
        }

        // Check for double move if pawn hasn't moved and the squares in front are empty
        if (y + inc + inc < BOARD_SIZE && this.grid[y + inc][x] === null && this.grid[y + inc + inc][x] === null && !this.selectedPiece.hasMoved) {
            pawnMoves.add(`${x},${y + inc + inc}`);
        }

        // Capture diagonally to the right
        if (y + inc < BOARD_SIZE && x + 1 < BOARD_SIZE && this.grid[y + inc][x + 1] !== null && this.grid[y + inc][x + 1].color === color) {
            pawnMoves.add(`${x + 1},${y + inc}`);
        }

        // Capture diagonally to the left
        if (y + inc < BOARD_SIZE && x - 1 > -1 && this.grid[y + inc][x - 1] !== null && this.grid[y + inc][x - 1].color === color) {
            pawnMoves.add(`${x - 1},${y + inc}`);
        }

        // En passant to the right 
        if (y === enPassantRank && x + 1 < BOARD_SIZE && this.grid[y][x + 1] !== null && this.grid[y][x + 1].type === 'pawn' && this.grid[y][x + 1].color === 'b' && this.grid[y][x + 1].hasMovedTwoSpaces && this.grid[y + inc][x + 1] === null) {
            pawnMoves.add(`${x + 1},${y + inc}`);
        }

        // En passant to the left
        if (y === enPassantRank && x - 1 > -1 && this.grid[y][x - 1] !== null && this.grid[y][x - 1].type === 'pawn' && this.grid[y][x - 1].color === 'b' && this.grid[y][x - 1].hasMovedTwoSpaces && this.grid[y + inc][x - 1] === null) {
            pawnMoves.add(`${x - 1},${y + 1}`);
        }

        return pawnMoves;
    }

    getRookMoves() {
        if (this.selectedPiece.color === 'w') {
            return this.rookMovesLogic('b');
        }
        
        return this.rookMovesLogic('w');
    }

    rookMovesLogic(color) {
        const rookMoves = new Set();

        const flags = Array(4).fill(true);

        const x = this.selectedPiece.x;
        const y = this.selectedPiece.y;

        for (let inc = 1; inc < BOARD_SIZE; ++inc) {
            
            if (y + inc < BOARD_SIZE) {
                if (flags[0] && (this.grid[y + inc][x] === null || this.grid[y + inc][x].color === color)) {
                    rookMoves.add(`${x},${y + inc}`);
                }
                else if (flags[0] && this.grid[y + inc][x] !== null && this.grid[y + inc][x].color === this.selectedPiece.color) {
                    flags[0] = false;
                } 
            }

            if (x + inc < BOARD_SIZE) {
                if (flags[1] && (this.grid[y][x + inc] === null || this.grid[y][x + inc].color === color)) {
                    rookMoves.add(`${x + inc},${y}`);
                }
                else if (flags[1] && this.grid[y][x + inc] !== null && this.grid[y][x + inc].color === this.selectedPiece.color) {
                    flags[1] = false;
                } 
            }

            if (y - inc > -1) {
                if (flags[2] && (this.grid[y - inc][x] === null || this.grid[y - inc][x].color === color)) {
                    rookMoves.add(`${x},${y - inc}`);
                }
                else if (flags[2] && this.grid[y - inc][x] !== null && this.grid[y - inc][x].color === this.selectedPiece.color) {
                    flags[2] = false;
                } 
            }

            if (x - inc > -1) {
                if (flags[3] && (this.grid[y][x - inc] === null || this.grid[y][x - inc].color === color)) {
                    rookMoves.add(`${x - inc},${y}`);
                }
                else if (flags[3] && this.grid[y][x - inc] !== null && this.grid[y][x - inc].color === this.selectedPiece.color) {
                    flags[3] = false;
                } 
            }
        
        }

        return rookMoves;
    }

    getKnightMoves() {
        if (this.selectedPiece.color === 'w') {
            return this.knightMovesLogic('b');
        } 
        
        return this.knightMovesLogic('w');
    }

    knightMovesLogic(color) {
        const knightMoves = new Set();

        const x = this.selectedPiece.x;
        const y = this.selectedPiece.y;

        if (y + 2 < BOARD_SIZE && x + 1 < BOARD_SIZE) {
            if (this.grid[y + 2][x + 1] === null || this.grid[y + 2][x + 1].color === color) {
                knightMoves.add(`${x + 1},${y + 2}`);    
            }
        }

        if (y + 1 < BOARD_SIZE && x + 2 < BOARD_SIZE) {
            if (this.grid[y + 1][x + 2] === null || this.grid[y + 1][x + 2].color === color) {
                knightMoves.add(`${x + 2},${y + 1}`);
            }
        }

        if (y - 2 > -1 && x + 1 < BOARD_SIZE) {
            if (this.grid[y - 2][x + 1] === null || this.grid[y - 2][x + 1].color === color) {
                knightMoves.add(`${x + 1},${y - 2}`)
            }
        }

        if (y - 1 > -1 && x + 2 < BOARD_SIZE) {
            if (this.grid[y - 1][x + 2] === null || this.grid[y - 1][x + 2].color === color) {
                knightMoves.add(`${x + 2},${y - 1}`);
            }
        }

        if (y + 2 < BOARD_SIZE && x - 1 > -1) {
            if (this.grid[y + 2][x - 1] === null || this.grid[y + 2][x - 1].color === color) {
                knightMoves.add(`${x - 1},${y + 2}`);
            }
        }

        if (y + 1 < BOARD_SIZE && x - 2 > -1) {
            if (this.grid[y + 1][x - 2] === null || this.grid[y + 1][x - 2].color === color) {
                knightMoves.add(`${x - 2},${y + 1}`);
            }
        }

        if (y - 2 > -1 && x - 1 > -1) {
            if (this.grid[y - 2][x - 1] === null || this.grid[y - 2][x - 1].color === color) {
                knightMoves.add(`${x - 1},${y - 2}`);
            }
        }

        if (y - 1 > -1 && x - 2 > -1) {
            if (this.grid[y - 1][x - 2] === null || this.grid[y - 1][x - 2].color === color) {
                knightMoves.add(`${x - 2},${y - 1}`);
            }
        }

        return knightMoves;
    }

    getBishopMoves() {
        if (this.selectedPiece.color === 'w') {
            return this.bishopMovesLogic('b');
        } 
        
        return this.bishopMovesLogic('w');
    }

    bishopMovesLogic(color) {
        const bishopMoves = new Set();

        const flags = Array(4).fill(true);

        const x = this.selectedPiece.x;
        const y = this.selectedPiece.y;
        
        for (let inc = 1; inc < BOARD_SIZE; ++inc) {
            
            if (y + inc < BOARD_SIZE && x + inc < BOARD_SIZE) {
                if (flags[0] && (this.grid[y + inc][x + inc] === null || this.grid[y + inc][x + inc].color === color)) {
                    bishopMoves.add(`${x + inc},${y + inc}`);
                }
                else if (flags[0] && this.grid[y + inc][x + inc] !== null && this.grid[y + inc][x + inc].color === this.selectedPiece.color) {
                    flags[0] = false;
                } 
            }

            if (y - inc > -1 && x + inc < BOARD_SIZE) {
                if (flags[1] && (this.grid[y - inc][x + inc] === null || this.grid[y - inc][x + inc].color === color)) {
                    bishopMoves.add(`${x + inc},${y - inc}`);
                }
                else if (flags[1] && this.grid[y - inc][x + inc] !== null && this.grid[y - inc][x + inc].color === this.selectedPiece.color) {
                    flags[1] = false;
                } 
            }

            if (y + inc < BOARD_SIZE && x - inc > -1) {
                if (flags[2] && (this.grid[y + inc][x - inc] === null || this.grid[y + inc][x - inc].color === color)) {
                    bishopMoves.add(`${x - inc},${y + inc}`);
                }
                else if (flags[2] && this.grid[y + inc][x - inc] !== null && this.grid[y + inc][x - inc].color === this.selectedPiece.color) {
                    flags[2] = false;
                } 
            }

            if (y - inc > -1 && x - inc > -1) {
                if (flags[3] && (this.grid[y - inc][x - inc] === null || this.grid[y - inc][x - inc].color === color)) {
                    bishopMoves.add(`${x - inc},${y - inc}`);
                }
                else if (flags[3] && this.grid[y - inc][x - inc] !== null && this.grid[y - inc][x - inc].color === this.selectedPiece.color) {
                    flags[3] = false;
                } 
            }

        }

        return bishopMoves;
    }

    getQueenMoves() {
        if (this.selectedPiece.color === 'w') {
            return this.queenMovesLogic('b');
        }
        
        return this.queenMovesLogic('w');
    }

    queenMovesLogic(color) {
        const queenMoves = new Set();

        const flags = Array(8).fill(true);

        const x = this.selectedPiece.x;
        const y = this.selectedPiece.y;
        
        for (let inc = 1; inc < BOARD_SIZE; ++inc) {
            
            if (y + inc < BOARD_SIZE && x + inc < BOARD_SIZE) {
                if (flags[0] && (this.grid[y + inc][x + inc] === null || this.grid[y + inc][x + inc].color === color)) {
                    queenMoves.add(`${x + inc},${y + inc}`);
                }
                else if (flags[0] && this.grid[y + inc][x + inc] !== null && this.grid[y + inc][x + inc].color === this.selectedPiece.color) {
                    flags[0] = false;
                } 
            }

            if (y - inc > -1 && x + inc < BOARD_SIZE) {
                if (flags[1] && (this.grid[y - inc][x + inc] === null || this.grid[y - inc][x + inc].color === color)) {
                    queenMoves.add(`${x + inc},${y - inc}`);
                }
                else if (flags[1] && this.grid[y - inc][x + inc] !== null && this.grid[y - inc][x + inc].color === this.selectedPiece.color) {
                    flags[1] = false;
                } 
            }

            if (y + inc < BOARD_SIZE && x - inc > -1) {
                if (flags[2] && (this.grid[y + inc][x - inc] === null || this.grid[y + inc][x - inc].color === color)) {
                    queenMoves.add(`${x - inc},${y + inc}`);
                }
                else if (flags[2] && this.grid[y + inc][x - inc] !== null && this.grid[y + inc][x - inc].color === this.selectedPiece.color) {
                    flags[2] = false;
                } 
            }

            if (y - inc > -1 && x - inc > -1) {
                if (flags[3] && (this.grid[y - inc][x - inc] === null || this.grid[y - inc][x - inc].color === color)) {
                    queenMoves.add(`${x - inc},${y - inc}`);
                }
                else if (flags[3] && this.grid[y - inc][x - inc] !== null && this.grid[y - inc][x - inc].color === this.selectedPiece.color) {
                    flags[3] = false;
                } 
            }

            if (y + inc < BOARD_SIZE) {
                if (flags[4] && (this.grid[y + inc][x] === null || this.grid[y + inc][x].color === color)) {
                    queenMoves.add(`${x},${y + inc}`);
                }
                else if (flags[4] && this.grid[y + inc][x] !== null && this.grid[y + inc][x].color === this.selectedPiece.color) {
                    flags[4] = false;
                } 
            }

            if (x + inc < BOARD_SIZE) {
                if (flags[5] && (this.grid[y][x + inc] === null || this.grid[y][x + inc].color === color)) {
                    queenMoves.add(`${x + inc},${y}`);
                }
                else if (flags[5] && this.grid[y][x + inc] !== null && this.grid[y][x + inc].color === this.selectedPiece.color) {
                    flags[5] = false;
                } 
            }

            if (y - inc > -1) {
                if (flags[6] && (this.grid[y - inc][x] === null || this.grid[y - inc][x].color === color)) {
                    queenMoves.add(`${x},${y - inc}`);
                }
                else if (flags[6] && this.grid[y - inc][x] !== null && this.grid[y - inc][x].color === this.selectedPiece.color) {
                    flags[6] = false;
                } 
            }

            if (x - inc > -1) {
                if (flags[7] && (this.grid[y][x - inc] === null || this.grid[y][x - inc].color === color)) {
                    queenMoves.add(`${x - inc},${y}`);
                }
                else if (flags[7] && this.grid[y][x - inc] !== null && this.grid[y][x - inc].color === this.selectedPiece.color) {
                    flags[7] = false;
                } 
            }

        }

        return queenMoves;
    }

    getKingMoves() {
        if (this.selectedPiece.color === 'w') {
            return this.kingMovesLogic('b');
        }

        return this.kingMovesLogic('w')
    }

    kingMovesLogic(color) {
        const kingMoves = new Set();

        const x = this.selectedPiece.x;
        const y = this.selectedPiece.y;

        if (y + 1 < BOARD_SIZE) {
            if (this.grid[y + 1][x] === null || this.grid[y + 1][x].color === color) {
                kingMoves.add(`${x},${y + 1}`);
            }
        }

        if (x + 1 < BOARD_SIZE) {
            if (this.grid[y][x + 1] === null || this.grid[y][x + 1].color === color) {
                kingMoves.add(`${x + 1},${y}`);
            }
        }

        if (y - 1 > -1) {
            if (this.grid[y - 1][x] === null || this.grid[y - 1][x].color === color) {
                kingMoves.add(`${x},${y - 1}`);
            }
        }

        if (x - 1 > -1) {
            if (this.grid[y][x - 1] === null || this.grid[y][x - 1].color === color) {
                kingMoves.add(`${x - 1},${y}`);
            }
        }

        if (y + 1 < BOARD_SIZE && x + 1 < BOARD_SIZE) {
            if (this.grid[y + 1][x + 1] === null || this.grid[y + 1][x + 1] === color) {
                kingMoves.add(`${x + 1},${y + 1}`);
            }
        }

        if (y - 1 > -1 && x - 1 > -1) {
            if (this.grid[y - 1][x - 1] === null || this.grid[y - 1][x - 1] === color) {
                kingMoves.add(`${x - 1},${y - 1}`);
            }
        }

        if (y + 1 < BOARD_SIZE && x - 1 > -1) {
            if (this.grid[y + 1][x - 1] === null || this.grid[y + 1][x - 1] === color) {
                kingMoves.add(`${x - 1},${y + 1}`);
            }
        }

        if (y - 1 > -1 && x + 1 < BOARD_SIZE) {
            if (this.grid[y - 1][x + 1] === null || this.grid[y - 1][x + 1] === color) {
                kingMoves.add(`${x + 1},${y - 1}`);
            }
        }

        return kingMoves;
    }

    initWhitePieces() {
        let pieces = [];
    
        for (let col = 0; col < BOARD_SIZE; ++col) {
            pieces.push(new Pawn('w', col, 1));
        }
    
        pieces.push(new Rook('w', 0, 0));
        pieces.push(new Rook('w', 7, 0));
        pieces.push(new Piece('knight', 'w', 1, 0));
        pieces.push(new Piece('knight', 'w', 6, 0));
        pieces.push(new Piece('bishop', 'w', 2, 0));
        pieces.push(new Piece('bishop', 'w', 5, 0));
        pieces.push(new Piece('queen', 'w', 3, 0));
        pieces.push(new King('w', 4, 0));

        return pieces;
    }

    initBlackPieces() {
        let pieces = [];

        for (let col = 0; col < BOARD_SIZE; ++col) {
            pieces.push(new Pawn('b', col, 6));
        }

        pieces.push(new Rook('b', 0, 7));
        pieces.push(new Rook('b', 7, 7));
        pieces.push(new Piece('knight', 'b', 1, 7));
        pieces.push(new Piece('knight', 'b', 6, 7));
        pieces.push(new Piece('bishop', 'b', 2, 7));
        pieces.push(new Piece('bishop', 'b', 5, 7));
        pieces.push(new Piece('queen', 'b', 3, 7));
        pieces.push(new King('b', 4, 7));

        return pieces;
    }
}

class Piece {
    constructor(type, color, x, y) {
        this.type = type;
        this.color = color;
        this.img = new Image(SQUARE_SIZE, SQUARE_SIZE);
        this.x = x;
        this.y = y;
        this.removed = false;
    }

    loadImage(callback) {
        const basePath = `imgs/${this.type}-${this.color}.svg`;
        this.img.src = basePath;

        this.img.onload = () => {
            callback();
        };
    }

    getPos() {
        return [this.x, this.y];
    }

    updatePos(x, y) {
        this.x = x;
        this.y = y;
    }

    setRemoved() {
        this.removed = true;
    }
}

class Pawn extends Piece {
    constructor(color, x, y) {
        super('pawn', color, x, y);
        this.hasMovedTwoSpaces = false;
        this.hasMoved = false;
    }

    setHasMovedTwoSpaces(flag) {
        this.hasMovedTwoSpaces = flag;
    }

    setHasMoved() {
        this.hasMoved = true;
    }
}

class Rook extends Piece {
    constructor(color, x, y) {
        super('rook', color, x, y);
        this.hasMoved = false;
    }

    setHasMoved() {
        this.hasMoved = true;
    }
}

class King extends Piece {
    constructor(color, x, y) {
        super('king', color, x, y);
        this.hasMoved = false;
    }

    setHasMoved() {
        this.hasMoved = true;
    }
}

window.addEventListener('load', () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const checkMates = new CheckMates('ws:8000', canvas, ctx);
});