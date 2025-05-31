let board = [];
let pieces = [];
let currentPlayer = 'white';
let selectedPiece = null;
let player1Name, player2Name;
let gameMode = 'pvp';
let canvasSize = 600;
let squareSize;


function setup() {
    let canvas = createCanvas(canvasSize, canvasSize);
    canvas.parent("gameCanvas");
    squareSize = canvasSize / 8;
    initBoard();
    initPieces();
}

function draw() {
    background(255);
    drawBoard();
    drawPieces();
}

function drawBoard() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            // Check if this square is under the selected piece
            if (
                selectedPiece &&
                selectedPiece.x === i &&
                selectedPiece.y === j
            ) {
                fill('#ffe066'); // Highlight color (light yellow)
            } else {
                fill(board[i][j].color);
            }
            rect(i * squareSize, j * squareSize, squareSize, squareSize);
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

    show() {
        fill(this.color);
        rect(this.x * squareSize, this.y * squareSize, squareSize, squareSize);
    }
}

function initBoard() {
    let colors = ['white', 'gray'];
    for (let i = 0; i < 8; i++) {
        board[i] = [];
        for (let j = 0; j < 8; j++) {
            let color = (i + j) % 2 == 0 ? '#f0d9b5' : '#b58863';
            board[i][j] = new Square(i, j, color);
        }
    }
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

    // Add movement rules here
    canMove(toX, toY) {
        //prevent moving to the same square
        if (this.x === toX && this.y === toY) return false;
        //board bounds
        if (toX < 0 || toX > 7 || toY < 0 || toY > 7) return false;

        //if destination is occupied by same color
        const destPiece = pieces.find(p => p.x === toX && p.y === toY)
        if (destPiece && destPiece.color === this.color) return false;

        const dx = toX - this.x;
        const dy = toY - this.y;

        //pawn
        if (this.type == 'pawn') {
            //direction; if white moves up, if black moves down
            const dir = this.color === 'white' ? -1 : 1;
            //move forward
            if (dx === 0 && dy === dir && !destPiece) return true;
            //first move: 2 squares
            if (dx === 0 && dy === 2 * dir && ((this.color === 'white' && this.y === 6) || (this.color === 'black' && this.y === 1))) {
                //check if path is clear
                const midY = this.y + dir;
                if (!pieces.find(p => p.x === this.x && p.y === midY) && !destPiece) return true;
            }
            //capture
            if (Math.abs(dx) === 1 && dy === dir && destPiece && destPiece.color !== this.color) return true;
            return false;
        }

        //rook
        if (this.type === 'rook') {
            if (dx === 0 || dy === 0) {
                //check path is clear
                let stepX = dx === 0 ? 0 : dx / Math.abs(dx);
                let setpY = dy === 0 ? 0 : dy / Math.abs(dy);
                let cx = this.x + stepX;
                let cy = this.y + setpY;
                while (cx !== toX || cy !== toY) {
                    if (pieces.find(p => p.x === cx && p.y === cy)) return false;
                    cx += stepX;
                    cy += setpY;
                }
                return true;
            }
            return false;
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

function simpleEngineMove() {
    // Choose random legal move
}

function switchTurn() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
}

function mousePressed() {
    let x = Math.floor(mouseX / squareSize);
    let y = Math.floor(mouseY / squareSize);

    if (selectedPiece) {

        if (selectedPiece.x !== x || selectedPiece.y !== y) {
            if (selectedPiece.canMove(x, y)) {
                pieces = pieces.filter(p => !(p.x === x && p.y === y));

                selectedPiece.x = x;
                selectedPiece.y = y;

                switchTurn();
            }
            selectedPiece = null;
        } else {
            selectedPiece = null;
        }
    } else {
        for (const piece of pieces) {
            if (piece.x === x && piece.y === y && piece.color === currentPlayer) {
                selectedPiece = piece;
                break;
            }
        }
    }
}

function resetGame() {
    initBoard();
    initPieces();
    currentPlayer = 'white';
}
