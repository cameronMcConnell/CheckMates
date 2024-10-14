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
    'A': 0,
    'B': 1,
    'C': 2,
    'D': 3,
    'E': 4,
    'F': 5,
    'G': 6,
    'H': 7,
};

class CheckMates {
    constructor(color, url) {
        this.mainPlayerColor = color;
        this.webSocket = this.initWebSocket(url);
        this.board = this.initBoard();
        this.turn = true;
    }

    updateTurn() {
        this.turn != this.turn;
    }

    initWebSocket(url) {
        const webSocket = new WebSocket(url);

        return webSocket;
    }

    initBoard() {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        if (this.mainPlayerColor === 'w') {
            ctx.translate(canvas.width, canvas.height);
            ctx.rotate(Math.PI);
        }

        let board = new Board(canvas, ctx, this.mainPlayerColor);

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
        this.mainPlayerColor = color;
        
        this.whitePieces = this.initWhitePieces();
        this.blackPieces =this.initBlackPieces();
        this.grid = this.initGrid();

        this.localPlay = true;
        
        this.selectedPiece = null;
        this.whiteCheck = false;
        this.blackCheck = false;
        this.whiteCheckmate = false;
        this.blackCheckmate = false;
        this.gameDraw = false;
        this.whiteKingPos = [4, 0];
        this.blackKingPos = [4, 7];
    }

    switchColor() {
        this.color === 'w' ? this.color = 'b' : this.color = 'w';
    }

    setWhiteCheck(flag) {
        this.whiteCheck = flag;
    }

    setBlackCheck(flag) {
        this.blackCheck = flag;
    }

    setWhiteCheckmate() {
        this.whiteCheckmate = true;
    }

    setBlackCheckmate() {
        this.blackCheckmate = true;
    }

    setGameDraw() {
        this.gameDraw = true;
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
            if (this.mainPlayerColor !== 'b') {
                this.ctx.translate(pieceX + SQUARE_SIZE / 2, pieceY + SQUARE_SIZE / 2);
                this.ctx.rotate(Math.PI);
                this.ctx.drawImage(piece.img, -SQUARE_SIZE / 2, -SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE);
            }
            else {
                this.ctx.drawImage(piece.img, pieceX, pieceY, SQUARE_SIZE, SQUARE_SIZE);
            }
        } 
        else {
            if (this.mainPlayerColor === 'w') {
                this.ctx.translate(pieceX + SQUARE_SIZE / 2, pieceY + SQUARE_SIZE / 2);
                this.ctx.rotate(Math.PI);
                this.ctx.drawImage(piece.img, -SQUARE_SIZE / 2, -SQUARE_SIZE / 2, SQUARE_SIZE, SQUARE_SIZE);
            }
            else {
                this.ctx.drawImage(piece.img, pieceX, pieceY, SQUARE_SIZE, SQUARE_SIZE);
            }
        }

        this.ctx.restore();
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();

        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        if (this.mainPlayerColor === 'w') {
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

    movePiece(x, y) {
        const validMoves = this.getValidMoves(this.selectedPiece);
        const move = `${x},${y}`;

        if (!this.doesMoveBlockCheck(move)) {
            this.resetSelectedPiece();
            return;
        }
        else if (this.selectedPiece.type === 'king') {
            if (this.checkCastling(move)) {
                this.resetSelectedPiece();
                return;
            }
        }

        if (validMoves.has(move)) {
            
            if (this.selectedPiece.type === 'king') {
               if (!this.isValidKingMove(move, x, y)) {    
                    this.resetSelectedPiece();
                    return;
               }
            }
            else if (this.isPinned(x, y)) {
                this.resetSelectedPiece();
                return;
            }

            this.updatePieceState(this.selectedPiece, move);

            // Update canvas and grid
            this.drawBoardSquare(this.selectedPiece.x, this.selectedPiece.y);
            this.grid[this.selectedPiece.y][this.selectedPiece.x] = null;

            // Remove piece and update board
            if (this.grid[y][x] !== null) {
                this.drawBoardSquare(x, y);
                this.grid[y][x].setRemoved(true);
            }

            // Update piece position, canvas, and grid
            this.selectedPiece.updatePos(x, y);
            this.drawPiece(this.selectedPiece);
            this.grid[y][x] = this.selectedPiece;

            // Set check and handle checkmates and draws here
            this.evaluateGameState();

            if (this.localPlay) {
                this.switchColor();
            }
        }
        else {
            this.removePieceHighlight();
        }

        this.selectedPiece = null;
    }

    evaluateGameState() {
        const color = this.selectedPiece.color;

        if (color === 'w') {
            const [kingX, kingY] = this.getBlackKingPos();
            const kingPos = `${kingX},${kingY}`;
            const validMoves = this.getValidMoves(this.selectedPiece);
            
            if (validMoves.has(kingPos)) {
                this.setBlackCheck(true);
            }


        }
        else {
            const [kingX, kingY] = this.getWhiteKingPos();
            const kingPos = `${kingX},${kingY}`;
            const validMoves = this.getValidMoves(this.selectedPiece);

            if (validMoves.has(kingPos)) {
                this.setWhiteCheck(true);
            }


        }
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

    resetSelectedPiece() {
        this.removePieceHighlight();
        this.selectedPiece = null;
    }

    parseMoveForPos(move) {
        const [x, y] = move.split(',');
        return [Number(x), Number(y)];
    }

    isValidKingMove(move, x, y) {   
        let isValidMove = true;
        let pieces;

        if (this.selectedPiece.color === 'w') {
            pieces = this.blackPieces;
        }
        else {
            pieces = this.whitePieces;
        }

        // Simulate the move
        const takenPiece = this.grid[y][x];
        this.grid[y][x] = this.selectedPiece;
        
        if (takenPiece !== null) {
            takenPiece.setRemoved(true);
        }

        const [prevX, prevY] = this.selectedPiece.getPos();
        this.grid[prevY][prevX] = null;
        
        // Check the moves of each opposing piece
        pieces.forEach((piece) => {
            if (!piece.removed) {
                const validMoves = this.getValidMoves(piece);

                if (validMoves.has(move)) {
                    isValidMove = false;
                }
            }
        });

        // Revert to previous state
        this.grid[prevY][prevX] = this.selectedPiece;
        this.grid[y][x] = takenPiece;
        
        if (takenPiece !== null) {
            takenPiece.setRemoved(false);
        }

        return isValidMove;
    }

    checkCastling(move) {
        const [x, y] = this.selectedPiece.getPos();

        if (this.selectedPiece.hasMoved) {
            return false;
        }

        if (this.selectedPiece.color === 'w') {
            if (this.whiteCheck) {
                return false;
            }

            if (move === `${x + 2},${y}`) {
                if (this.validateCastling(y, x + 1, x + 3, 1, this.blackPieces)) {
                    this.moveCastlingPieces(x, x + 2, x + 3, x + 1, y);
                    return true;
                }
            }
            else if (move === `${x - 2},${y}`) {
                if (this.validateCastling(y, x - 1, x - 4, -1, this.blackPieces)) {
                    this.moveCastlingPieces(x, x - 2, x - 4, x - 1, y);   
                    return true;
                }
            }
        } 
        else {
            if (this.blackCheck) {
                return false;
            }

            if (move === `${x + 2},${y}`) {
                if (this.validateCastling(y, x + 1, x + 3, 1, this.whitePieces)) {
                    this.moveCastlingPieces(x, x + 2, x + 3, x + 1, y);
                    return true;
                }
            }
            else if (move === `${x - 2},${y}`) {
                if (this.validateCastling(y, x - 1, x - 4, -1, this.whitePieces)) {
                    this.moveCastlingPieces(x, x - 2, x - 4, x - 1, y);   
                    return true;
                }
            }
        }

        return false;
    }

    validateCastling(y, start, bound, inc, pieces) {
        for (let x = start; x < bound; x += inc) {            
            if (this.grid[y][x] !== null) {
                return false;
            }

            for (const piece of pieces) {
                if (!piece.removed) {
                    const validMoves = this.getValidMoves(piece);

                    if (validMoves.has(`${x},${y}`)) {
                        return false;
                    }
                }
            }
        }

        if (this.grid[y][bound] !== null) {
            const piece = this.grid[y][bound];

            if (piece.type !== 'rook' || piece.hasMoved) {
                return false;
            }
        }

        return true;
    }

    moveCastlingPieces(kingX, newKingX, rookX, newRookX, y) {
        const king = this.grid[y][kingX];
        const rook = this.grid[y][rookX];

        // Update king position and drawing
        this.grid[y][kingX] = null;
        this.drawBoardSquare(kingX, y);
        king.updatePos(newKingX, y);
        this.grid[y][newKingX] = king;
        this.drawPiece(king);

        // Update rook position and drawing
        this.grid[y][rookX] = null;
        this.drawBoardSquare(rookX, y);
        rook.updatePos(newRookX, y);
        this.grid[y][newRookX] = rook;
        this.drawPiece(rook);

        // The king and rook have moved.
        king.setHasMoved();
        rook.setHasMoved();
    }

    doesMoveBlockCheck(move) {
        if (this.selectedPiece.color === 'b' && this.blackCheck) {
            const [kingX, kingY] = this.getBlackKingPos();
            const king = this.grid[kingY][kingX];

            if (this.selectedPiece.type !== 'king' && !this.checkIfMoveBlocksKingCheck(king, this.whitePieces, move)) {
                return false;
            }
        } 

        if (this.selectedPiece.color === 'w' && this.whiteCheck) {
            const [kingX, kingY] = this.getWhiteKingPos();
            const king = this.grid[kingY][kingX];

            if (this.selectedPiece.type !== 'king' && !this.checkIfMoveBlocksKingCheck(king, this.blackPieces, move)) {
                return false;
            }
        }

        return true;
    }

    checkIfMoveBlocksKingCheck(king, pieces, move) {
        const [x, y] = this.parseMoveForPos(move);
        const [kingX, kingY] = king.getPos();
        let result = true;

        // Simulate the move
        const takenPiece = this.grid[y][x];
        this.grid[y][x] = this.selectedPiece;

        if (takenPiece !== null) {
            takenPiece.setRemoved(true);
        }
        const [prevX, prevY] = this.selectedPiece.getPos();
        this.grid[prevY][prevX] = null;

        pieces.forEach((piece) => {
            if (!piece.removed) {
                const validMoves = this.getValidMoves(piece);

                if (validMoves.has(`${kingX},${kingY}`)) {
                    result = false;
                }
            }
        });

        // Revert to previous state
        this.grid[prevY][prevX] = this.selectedPiece;
        this.grid[y][x] = takenPiece;
        
        if (takenPiece !== null) {
            takenPiece.setRemoved(true);
        }

        return result;
    }

    isPinned(x, y) {
        let result = false;
        let pieces, kingX, kingY;

        if (this.selectedPiece.color === 'w') {
            pieces = this.blackPieces;
            [kingX, kingY] = this.getWhiteKingPos();
        }
        else {
            pieces = this.whitePieces;
            [kingX, kingY] = this.getBlackKingPos();
        }

        // Simulate the move
        const takenPiece = this.grid[y][x];
        this.grid[y][x] = this.selectedPiece;

        if (takenPiece !== null) {
            takenPiece.setRemoved(true);
        }

        const [prevX, prevY] = this.selectedPiece.getPos();
        this.grid[prevY][prevX] = null;

        const kingPos = `${kingX},${kingY}`;

        // Check if king in check.
        pieces.forEach((piece) => {
            if (!piece.removed) {
                const validMoves = this.getValidMoves(piece);

                if (validMoves.has(kingPos)) {
                    result = true;
                }
            }
        });

        // Revert to previous state
        this.grid[prevY][prevX] = this.selectedPiece;
        this.grid[y][x] = takenPiece;
        

        if (takenPiece !== null) {
            takenPiece.setRemoved(false);
        }

        return result;
    }

    updatePieceState(piece, move) {
        switch (piece.type) {
            case 'pawn':
                this.updatePawnState(piece, move);
                break;
            case 'king':
                this.updateKingState(piece);
                break;
            case 'rook':
                this.updateRookState(piece);
                break;
            default:
                break;
        }
    }

    updatePawnState(piece, move) {
        const [x, y] = piece.getPos();

        if (piece.color === 'w') {

            if (move === `${x},${y + 2}`) {
                piece.setHasMovedTwoSpaces(true);
            }
            else {
                piece.setHasMovedTwoSpaces(false);
            }

            piece.setHasMoved();
        } 
        else {

            if (move === `${x},${y - 2}`) {
                piece.setHasMovedTwoSpaces(true);
            }
            else {
                piece.setHasMovedTwoSpaces(false);
            }

            piece.setHasMoved();
        }
    }

    updateKingState(piece) {
        const [x, y] = piece.getPos();
        
        if (piece.color === 'w') {
            this.updateWhiteKingPos(x, y);
        }
        else {
            this.updateBlackKingPos(x, y);
        }

        piece.setHasMoved();
    }

    updateRookState(piece) {
        piece.setHasMoved();
    }

    getValidMoves(piece) {
        switch (piece.type) {
            case 'pawn':
                return this.getPawnMoves(piece);
            case 'rook':
                return this.getRookMoves(piece);
            case 'knight':
                return this.getKnightMoves(piece);
            case 'bishop':
                return this.getBishopMoves(piece);
            case 'queen':
                return this.getQueenMoves(piece);
            case 'king':
                return this.getKingMoves(piece);
            default:
                console.log('Not a valid piece. You messing with the source code. Naughty Naughty.');
                return null;
        }
    }

    getPawnMoves(piece) {
        if (piece.color === 'w') {
            return this.pawnMovesLogic(piece, 1, 4);
        }

        return this.pawnMovesLogic(piece, -1, 3);
    }

    pawnMovesLogic(piece, inc, enPassantRank) {
        const pawnMoves = new Set();
        const [x, y] = piece.getPos();
        const color = piece.color;

        if (y + inc < BOARD_SIZE && this.grid[y + inc][x] === null) {
            pawnMoves.add(`${x},${y + inc}`);
        }

        // Check for double move if pawn hasn't moved and the squares in front are empty
        if (y + inc + inc < BOARD_SIZE && this.grid[y + inc][x] === null && this.grid[y + inc + inc][x] === null && !piece.hasMoved) {
            pawnMoves.add(`${x},${y + inc + inc}`);
        }

        // Capture diagonally to the right
        if (y + inc < BOARD_SIZE && x + 1 < BOARD_SIZE && this.grid[y + inc][x + 1] !== null && this.grid[y + inc][x + 1].color !== color) {
            pawnMoves.add(`${x + 1},${y + inc}`);
        }

        // Capture diagonally to the left
        if (y + inc < BOARD_SIZE && x - 1 > -1 && this.grid[y + inc][x - 1] !== null && this.grid[y + inc][x - 1].color !== color) {
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

    getRookMoves(piece) {
        const rookMoves = new Set();
        const flags = Array(4).fill(true);
        const [x, y] = piece.getPos();
        const color = piece.color;

        for (let inc = 1; inc < BOARD_SIZE; ++inc) {
            
            if (y + inc < BOARD_SIZE && flags[0]) {
                const target = this.grid[y + inc][x];
                if (target === null) {
                    rookMoves.add(`${x},${y + inc}`);
                }
                else {
                    if (target.color !== color) rookMoves.add(`${x},${y + inc}`);
                    flags[0] = false;
                }
            }

            if (x + inc < BOARD_SIZE && flags[1]) {
                const target = this.grid[y][x + inc];
                if (target === null) {
                    rookMoves.add(`${x + inc},${y}`);
                }
                else {
                    if (target.color !== color) rookMoves.add(`${x + inc},${y}`);
                    flags[1] = false;
                }
            }

            if (y - inc > -1 && flags[2]) {
                const target = this.grid[y - inc][x];
                if (target === null) {
                    rookMoves.add(`${x},${y - inc}`);
                }
                else {
                    if (target.color !== color) rookMoves.add(`${x},${y - inc}`);
                    flags[2] = false;
                }
            }

            if (x - inc > -1 && flags[3]) {
                const target = this.grid[y][x - inc];
                if (target === null) {
                    rookMoves.add(`${x - inc},${y}`);
                }
                else {
                    if (target.color !== color) rookMoves.add(`${x - inc},${y}`);
                    flags[3] = false;
                }
            }
        
        }

        return rookMoves;
    }

    getKnightMoves(piece) {
        const knightMoves = new Set();
        const [x, y] = piece.getPos();
        const color = piece.color;

        if (y + 2 < BOARD_SIZE && x + 1 < BOARD_SIZE) {
            if (this.grid[y + 2][x + 1] === null || this.grid[y + 2][x + 1].color !== color) {
                knightMoves.add(`${x + 1},${y + 2}`);    
            }
        }

        if (y + 1 < BOARD_SIZE && x + 2 < BOARD_SIZE) {
            if (this.grid[y + 1][x + 2] === null || this.grid[y + 1][x + 2].color !== color) {
                knightMoves.add(`${x + 2},${y + 1}`);
            }
        }

        if (y - 2 > -1 && x + 1 < BOARD_SIZE) {
            if (this.grid[y - 2][x + 1] === null || this.grid[y - 2][x + 1].color !== color) {
                knightMoves.add(`${x + 1},${y - 2}`)
            }
        }

        if (y - 1 > -1 && x + 2 < BOARD_SIZE) {
            if (this.grid[y - 1][x + 2] === null || this.grid[y - 1][x + 2].color !== color) {
                knightMoves.add(`${x + 2},${y - 1}`);
            }
        }

        if (y + 2 < BOARD_SIZE && x - 1 > -1) {
            if (this.grid[y + 2][x - 1] === null || this.grid[y + 2][x - 1].color !== color) {
                knightMoves.add(`${x - 1},${y + 2}`);
            }
        }

        if (y + 1 < BOARD_SIZE && x - 2 > -1) {
            if (this.grid[y + 1][x - 2] === null || this.grid[y + 1][x - 2].color !== color) {
                knightMoves.add(`${x - 2},${y + 1}`);
            }
        }

        if (y - 2 > -1 && x - 1 > -1) {
            if (this.grid[y - 2][x - 1] === null || this.grid[y - 2][x - 1].color !== color) {
                knightMoves.add(`${x - 1},${y - 2}`);
            }
        }

        if (y - 1 > -1 && x - 2 > -1) {
            if (this.grid[y - 1][x - 2] === null || this.grid[y - 1][x - 2].color !== color) {
                knightMoves.add(`${x - 2},${y - 1}`);
            }
        }

        return knightMoves;
    }

    getBishopMoves(piece) {
        const bishopMoves = new Set();
        const flags = Array(4).fill(true);
        const [x, y] = piece.getPos();
        const color = piece.color;
        
        for (let inc = 1; inc < BOARD_SIZE; ++inc) {
            
            if (y + inc < BOARD_SIZE && x + inc < BOARD_SIZE && flags[0]) {
                const target = this.grid[y + inc][x + inc];
                if (target === null) {
                    bishopMoves.add(`${x + inc},${y + inc}`);
                }
                else {
                    if (target.color !== color) bishopMoves.add(`${x + inc},${y + inc}`);
                    flags[0] = false;
                }
            }

            if (y - inc > -1 && x + inc < BOARD_SIZE && flags[1]) {
                const target = this.grid[y - inc][x + inc];
                if (target === null) {
                    bishopMoves.add(`${x + inc},${y - inc}`);
                }
                else {
                    if (target.color !== color) bishopMoves.add(`${x + inc},${y - inc}`);
                    flags[1] = false;
                }
            }

            if (y + inc < BOARD_SIZE && x - inc > -1 && flags[2]) {
                const target = this.grid[y + inc][x - inc];
                if (target === null) {
                    bishopMoves.add(`${x - inc},${y + inc}`);
                }
                else {
                    if (target.color !== color) bishopMoves.add(`${x - inc},${y + inc}`);
                    flags[2] = false;
                }
            }

            if (y - inc > -1 && x - inc > -1 && flags[3]) {
                const target = this.grid[y - inc][x - inc];
                if (target === null) {
                    bishopMoves.add(`${x - inc},${y - inc}`);
                }
                else {
                    if (target.color !== color) bishopMoves.add(`${x - inc},${y - inc}`);
                    flags[3] = false;
                }
            }

        }

        return bishopMoves;
    }

    getQueenMoves(piece) {
        const queenMoves = new Set();
        const flags = Array(8).fill(true);
        const [x, y] = piece.getPos();
        const color = piece.color;
        
        for (let inc = 1; inc < BOARD_SIZE; ++inc) {
            
             // Diagonal (y+inc, x+inc)
            if (y + inc < BOARD_SIZE && x + inc < BOARD_SIZE && flags[0]) {
                const target = this.grid[y + inc][x + inc];
                if (target === null) {
                    queenMoves.add(`${x + inc},${y + inc}`);
                } else {
                    if (target.color !== color) queenMoves.add(`${x + inc},${y + inc}`);
                    flags[0] = false;
                }
            }

            // Diagonal (y-inc, x+inc)
            if (y - inc >= 0 && x + inc < BOARD_SIZE && flags[1]) {
                const target = this.grid[y - inc][x + inc];
                if (target === null) {
                    queenMoves.add(`${x + inc},${y - inc}`);
                }
                else {
                    if (target.color !== color) queenMoves.add(`${x + inc},${y - inc}`);
                    flags[1] = false;
                }
            }

            // Diagonal (y+inc, x-inc)
            if (y + inc < BOARD_SIZE && x - inc >= 0 && flags[2]) {
                const target = this.grid[y + inc][x - inc];
                if (target === null) {
                    queenMoves.add(`${x - inc},${y + inc}`);
                }
                else {
                    if (target.color !== color) queenMoves.add(`${x - inc},${y + inc}`);
                    flags[2] = false;
                }
            }

            // Diagonal (y-inc, x-inc)
            if (y - inc >= 0 && x - inc >= 0 && flags[3]) {
                const target = this.grid[y - inc][x - inc];
                if (target === null) {
                    queenMoves.add(`${x - inc},${y - inc}`);
                } else {
                    if (target.color !== color) queenMoves.add(`${x - inc},${y - inc}`);
                    flags[3] = false;
                }
            }

            // Vertical (y+inc)
            if (y + inc < BOARD_SIZE && flags[4]) {
                const target = this.grid[y + inc][x];
                if (target === null) {
                    queenMoves.add(`${x},${y + inc}`);
                } else {
                    if (target.color !== color) queenMoves.add(`${x},${y + inc}`);
                    flags[4] = false;
                }
            }

            // Horizontal (x+inc)
            if (x + inc < BOARD_SIZE && flags[5]) {
                const target = this.grid[y][x + inc];
                if (target === null) {
                    queenMoves.add(`${x + inc},${y}`);
                } else {
                    if (target.color !== color) queenMoves.add(`${x + inc},${y}`);
                    flags[5] = false;
                }
            }

            // Vertical (y-inc)
            if (y - inc >= 0 && flags[6]) {
                const target = this.grid[y - inc][x];
                if (target === null) {
                    queenMoves.add(`${x},${y - inc}`);
                } else {
                    if (target.color !== color) queenMoves.add(`${x},${y - inc}`);
                    flags[6] = false;
                }
            }

            // Horizontal (x-inc)
            if (x - inc >= 0 && flags[7]) {
                const target = this.grid[y][x - inc];
                if (target === null) {
                    queenMoves.add(`${x - inc},${y}`);
                } else {
                    if (target.color !== color) queenMoves.add(`${x - inc},${y}`);
                    flags[7] = false;
                }
            }
        }   

        return queenMoves;
    }

    getKingMoves(piece) {
        const kingMoves = new Set();
        const [x, y] = piece.getPos();
        const color = piece.color;

        if (y + 1 < BOARD_SIZE) {
            if (this.grid[y + 1][x] === null || this.grid[y + 1][x].color !== color) {
                kingMoves.add(`${x},${y + 1}`);
            }
        }

        if (x + 1 < BOARD_SIZE) {
            if (this.grid[y][x + 1] === null || this.grid[y][x + 1].color !== color) {
                kingMoves.add(`${x + 1},${y}`);
            }
        }

        if (y - 1 > -1) {
            if (this.grid[y - 1][x] === null || this.grid[y - 1][x].color !== color) {
                kingMoves.add(`${x},${y - 1}`);
            }
        }

        if (x - 1 > -1) {
            if (this.grid[y][x - 1] === null || this.grid[y][x - 1].color !== color) {
                kingMoves.add(`${x - 1},${y}`);
            }
        }

        if (y + 1 < BOARD_SIZE && x + 1 < BOARD_SIZE) {
            if (this.grid[y + 1][x + 1] === null || this.grid[y + 1][x + 1].color !== color) {
                kingMoves.add(`${x + 1},${y + 1}`);
            }
        }

        if (y - 1 > -1 && x - 1 > -1) {
            if (this.grid[y - 1][x - 1] === null || this.grid[y - 1][x - 1].color !== color) {
                kingMoves.add(`${x - 1},${y - 1}`);
            }
        }

        if (y + 1 < BOARD_SIZE && x - 1 > -1) {
            if (this.grid[y + 1][x - 1] === null || this.grid[y + 1][x - 1].color !== color) {
                kingMoves.add(`${x - 1},${y + 1}`);
            }
        }

        if (y - 1 > -1 && x + 1 < BOARD_SIZE) {
            if (this.grid[y - 1][x + 1] === null || this.grid[y - 1][x + 1].color !== color) {
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

    setRemoved(flag) {
        this.removed = flag;
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
    const checkMates = new CheckMates('w', 'ws:8000');
});