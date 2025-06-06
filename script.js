let board = [];
let pieces = [];
let currentPlayer = 'white';
let selectedPiece = null;
let player1Name, player2Name;
let gameMode = 'pvp';
let canvasSize = 600;
let squareSize;
let possibleMoves = [];

let moveSound = new Audio("./Assets/SoundEffects/Move_Piece.wav");
let captureSound = new Audio("./Assets/SoundEffects/Capture.wav");
let checkSound = new Audio("./Assets/SoundEffects/Check.wav");

function setup() {
    let canvas = createCanvas(canvasSize, canvasSize);
    canvas.parent("gameCanvas");
    squareSize = canvasSize / 8;

    document.getElementById('gameMode').addEventListener('change', handleGameModeChange);
    handleGameModeChange();

    initBoard();
    initPieces();
}

function draw() {
    noStroke();
    background(255);
    drawBoard();
    drawPieces();
}

function handleGameModeChange() {
    const selector = document.getElementById('gameMode');
    gameMode = selector.value;

    resetGame();

    const player2Input = document.getElementById('player2');
    if (gameMode === 'pvb') {
        player2Input.value = 'Bot';
        player2Input.disabled = true;
    } else {
        player2Input.value = '';
        player2Input.disabled = false;
    }
}

function mousePressed() {
    let x = Math.floor(mouseX / squareSize);
    let y = Math.floor(mouseY / squareSize);

    if (selectedPiece) {
        if (selectedPiece.x !== x || selectedPiece.y !== y) {
            if (selectedPiece.canMove(x, y)) {
                const captured = pieces.find(p => p.x === x && p.y === y);
                if (captured) {
                    pieces.splice(pieces.indexOf(captured), 1);
                    captureSound.play();
                }
                selectedPiece.x = x;
                selectedPiece.y = y;
                moveSound.play();
                switchTurn();
            }
            selectedPiece = null;
            possibleMoves = [];
        } else {
            selectedPiece = null;
            possibleMoves = [];
        }
    } else {
        for (const piece of pieces) {
            if (piece.x === x && piece.y === y && piece.color === currentPlayer) {
                selectedPiece = piece;
                possibleMoves = [];
                for (let i = 0; i < 8; i++) {
                    for (let j = 0; j < 8; j++) {
                        if (piece.canMove(i, j)) {
                            const oldX = piece.x, oldY = piece.y;
                            const captured = pieces.find(p => p.x === i && p.y === j);
                            piece.x = i; piece.y = j;
                            if (captured) pieces.splice(pieces.indexOf(captured), 1);
                            const inCheck = isInCheck(currentPlayer);
                            piece.x = oldX; piece.y = oldY;
                            if (captured) pieces.push(captured);
                            if (!inCheck) {
                                possibleMoves.push({ x: i, y: j });
                            }
                        }
                    }
                }
                break;
            }
        }
    }
}

function initBoard() {
    for (let i = 0; i < 8; i++) {
        board[i] = [];
        for (let j = 0; j < 8; j++) {
            let color = (i + j) % 2 === 0 ? '#f0d9b5' : '#b58863';
            board[i][j] = new Square(i, j, color);
        }
    }
}

function initPieces() {
    pieces = [];
    for (let i = 0; i < 8; i++) {
        pieces.push(new Piece('pawn', 'white', i, 6));
        pieces.push(new Piece('pawn', 'black', i, 1));
    }
    [0, 7].forEach(i => {
        pieces.push(new Piece('rook', 'white', i, 7));
        pieces.push(new Piece('rook', 'black', i, 0));
    });
    [1, 6].forEach(i => {
        pieces.push(new Piece('knight', 'white', i, 7));
        pieces.push(new Piece('knight', 'black', i, 0));
    });
    [2, 5].forEach(i => {
        pieces.push(new Piece('bishop', 'white', i, 7));
        pieces.push(new Piece('bishop', 'black', i, 0));
    });
    pieces.push(new Piece('queen', 'white', 3, 7));
    pieces.push(new Piece('queen', 'black', 3, 0));
    pieces.push(new Piece('king', 'white', 4, 7));
    pieces.push(new Piece('king', 'black', 4, 0));
}

function resetGame() {
    initBoard();
    initPieces();
    currentPlayer = 'white';
    selectedPiece = null;
    possibleMoves = [];

    player1Name = document.getElementById('player1').value || 'White';
    player2Name = document.getElementById('player2').value || "Black";
}

function drawBoard() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (selectedPiece && selectedPiece.x === i && selectedPiece.y === j) {
                fill(board[i][j].color === '#f0d9b5' ? '#ffca75' : '#db9963');
            } else {
                fill(board[i][j].color);
            }
            rect(i * squareSize, j * squareSize, squareSize, squareSize);

            if (possibleMoves.some(m => m.x === i && m.y === j)) {
                fill('#8f7d60');
                circle(i * squareSize + squareSize / 2, j * squareSize + squareSize / 2, squareSize / 4);
            }
        }
    }
}

function drawPieces() {
    for (const piece of pieces) {
        piece.show();
    }
}

class Square {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.piece = null;
    }
}

function switchTurn() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

    const playerName = currentPlayer === 'white' ? player1Name : player2Name;
    const winnderName = currentPlayer === 'white' ? player1Name : player2Name;

    if (isInCheck(currentPlayer)) {
        if (isCheckmate(currentPlayer)) {
            alert(currentPlayer + " is in checkmate! " + winnderName + " wins! Game over.");
        } else {
            checkSound.play();
            alert(currentPlayer + " is in check!");
        }
    }

    if (gameMode === 'pvb' && currentPlayer === 'black') {
        setTimeout(() => {
            let botMove = getBestMove();

            if (botMove) {
                pieces = pieces.filter(p => !(p.x === botMove.toX && p.y === botMove.toY));
                botMove.piece.x = botMove.toX;
                botMove.piece.y = botMove.toY;

                switchTurn();
            }
        }, 1000);
    }
}

function findKing(color) {
    return pieces.find(p => p.type === 'king' && p.color === color);
}

function isSquareAttacked(x, y, byColor) {
    return pieces.some(p => p.color === byColor && p.canMove(x, y, true));
}

function isInCheck(color) {
    const king = findKing(color);
    if (!king) return false;
    const enemyColor = color === 'white' ? 'black' : 'white';
    return isSquareAttacked(king.x, king.y, enemyColor);
}

function isCheckmate(color) {
    if (!isInCheck(color)) return false;
    for (const piece of pieces.filter(p => p.color === color)) {
        for (let toX = 0; toX < 8; toX++) {
            for (let toY = 0; toY < 8; toY++) {
                if (piece.canMove(toX, toY)) {
                    const captured = pieces.find(p => p.x === toX && p.y === toY);
                    const oldX = piece.x;
                    const oldY = piece.y;
                    piece.x = toX;
                    piece.y = toY;
                    if (captured) pieces.splice(pieces.indexOf(captured), 1);
                    const stillInCheck = isInCheck(color);
                    piece.x = oldX;
                    piece.y = oldY;
                    if (captured) pieces.push(captured);
                    if (!stillInCheck) return false;
                }
            }
        }
    }
    return true;
}

class Piece {
    constructor(type, color, x, y) {
        this.type = type;
        this.color = color;
        this.x = x;
        this.y = y;
    }

    show() {
        textSize(55);
        textAlign(CENTER, CENTER);
        fill(this.color === 'white' ? 255 : 0);
        const unicodeMap = {
            king: { white: '♔', black: '♚' },
            queen: { white: '♕', black: '♛' },
            rook: { white: '♖', black: '♜' },
            bishop: { white: '♗', black: '♝' },
            knight: { white: '♘', black: '♞' },
            pawn: { white: '♙', black: '♟' }
        };
        text(unicodeMap[this.type][this.color], this.x * squareSize + squareSize / 2, this.y * squareSize + squareSize / 2);
    }

    canMove(toX, toY, asAttack = false) {
        if (this.x === toX && this.y === toY) return false;
        if (toX < 0 || toX > 7 || toY < 0 || toY > 7) return false;

        const destPiece = pieces.find(p => p.x === toX && p.y === toY);
        if (destPiece && destPiece.color === this.color) return false;

        const dx = toX - this.x;
        const dy = toY - this.y;

        if (this.type == 'pawn') {
            const dir = this.color === 'white' ? -1 : 1;
            if (!asAttack && dx === 0 && dy === dir && !destPiece) return true;
            if (!asAttack && dx === 0 && dy === 2 * dir && ((this.color === 'white' && this.y === 6) || (this.color === 'black' && this.y === 1))) {
                const midY = this.y + dir;
                if (!pieces.find(p => p.x === this.x && p.y === midY) && !destPiece) return true;
            }
            if (Math.abs(dx) === 1 && dy === dir && (destPiece || asAttack)) return true;
            return false;
        }

        if (this.type === 'rook') {
            if (dx === 0 || dy === 0) {
                let stepX = dx === 0 ? 0 : dx / Math.abs(dx);
                let stepY = dy === 0 ? 0 : dy / Math.abs(dy);
                let cx = this.x + stepX;
                let cy = this.y + stepY;
                while (cx !== toX || cy !== toY) {
                    if (pieces.find(p => p.x === cx && p.y === cy)) return false;
                    cx += stepX;
                    cy += stepY;
                }
                return true;
            }
            return false;
        }

        if (this.type === 'knight') {
            if ((Math.abs(dx) === 2 && Math.abs(dy) === 1) || (Math.abs(dx) === 1 && Math.abs(dy) === 2)) return true;
            return false;
        }

        if (this.type === 'bishop') {
            if (Math.abs(dx) === Math.abs(dy)) {
                let stepX = dx / Math.abs(dx);
                let stepY = dy / Math.abs(dy);
                let cx = this.x + stepX;
                let cy = this.y + stepY;
                while (cx !== toX || cy !== toY) {
                    if (pieces.find(p => p.x === cx && p.y === cy)) return false;
                    cx += stepX;
                    cy += stepY;
                }
                return true;
            }
            return false;
        }

        if (this.type === 'queen') {
            if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
                let stepX = dx === 0 ? 0 : dx / Math.abs(dx);
                let stepY = dy === 0 ? 0 : dy / Math.abs(dy);
                let cx = this.x + stepX;
                let cy = this.y + stepY;
                while (cx !== toX || cy !== toY) {
                    if (pieces.find(p => p.x === cx && p.y === cy)) return false;
                    cx += stepX;
                    cy += stepY;
                }
                return true;
            }
            return false;
        }

        if (this.type === 'king') {
            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                const enemyColor = this.color === 'white' ? 'black' : 'white';
                const oldX = this.x, oldY = this.y;
                this.x = toX; this.y = toY;
                const attacked = isSquareAttacked(toX, toY, enemyColor);
                this.x = oldX; this.y = oldY;
                if (!attacked) return true;
            }
        }
        return false;
    }
}

function getAllLegalMoves(color) {
    let moves = [];
    for (let piece of pieces) {
        if (piece.color === color) {
            for (let x = 0; x < 8; x++) {
                for (let y = 0; y < 8; y++) {
                    if (piece.canMove(x, y)) {
                        let move = {
                            piece: piece,
                            fromX: piece.x,
                            fromY: piece.y,
                            toX: x,
                            toY: y,
                            capturedPiece: pieces.find(p => p.x === x && p.y === y)
                        };
                        makeMove(move);
                        const inCheck = isInCheck(color);
                        undoMove(move);
                        if (!inCheck) {
                            moves.push(move);
                        }
                    }
                }
            }
        }
    }
    return moves;
}

function evaluatePosition() {
    const pieceValues = {
        pawn: 1,
        knight: 3,
        bishop: 3,
        rook: 5,
        queen: 9,
        king: 100
    };

    let score = 0;
    for (let piece of pieces) {
        let value = pieceValues[piece.type];
        if (piece.color === "black") score += value;
        if (piece.color === "white") score -= value;
    }

    return score;
}

function makeMove(move) {
    if (move.capturedPiece) {
        let index = pieces.indexOf(move.capturedPiece);
        if (index > -1) {
            pieces.splice(index, 1);
        }
    }

    move.piece.x = move.toX;
    move.piece.y = move.toY;
}

function undoMove(move) {
    move.piece.x = move.fromX;
    move.piece.y = move.fromY;

    if (move.capturedPiece) {
        pieces.push(move.capturedPiece);
    }
}

function minimax(depth, isMaximizing, alpha = -Infinity, beta = Infinity) {
    if (depth === 0) {
        return evaluatePosition();
    }

    let currentColor = isMaximizing ? 'white' : 'black';
    let moves = getAllLegalMoves(currentColor);

    if (moves.length === 0) {
        return isMaximizing ? -10000 : 10000;
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of moves) {
            makeMove(move);
            let eval = minimax(depth - 1, false, alpha, beta);
            undoMove(move);
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of moves) {
            makeMove(move);
            let eval = minimax(depth - 1, true, alpha, beta);
            undoMove(move);
            minEval = Math.min(minEval, eval);
            beta = Math.min(minEval, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function getBestMove() {
    let bestMove = null;
    let bestScore = -Infinity;

    let botMoves = getAllLegalMoves('black');

    for (let move of botMoves) {
        makeMove(move);
        moveSound.play();
        let score = minimax(3, true);
        undoMove(move);

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}
