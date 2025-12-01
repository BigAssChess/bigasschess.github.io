
const rows = 15;
const cols = 20;
const setup = Array.from({ length: rows }, () => Array(cols).fill(null));

function placePieces(board, isWhite) {
    const colorName = isWhite ? 'white' : 'black';
    const rank1 = isWhite ? 14 : 0;
    const rank2 = isWhite ? 13 : 1;
    const rank3 = isWhite ? 12 : 2;
    const rank4 = isWhite ? 11 : 3;

    const firstRankPattern = [
        'rook', 'bishop', 'queen', 'bishop', 'rook', 'knight', 'bishop', 'rook', 'queen', 'knight',
        'king',
        'bishop', 'queen', 'rook', 'bishop', 'knight', 'rook', 'bishop', 'queen', 'rook'
    ];
    for (let c = 0; c < 20; c++) {
        board[rank1][c] = { color: colorName, type: firstRankPattern[c] };
    }

    const secondCols = [2, 4, 6, 8, 10, 11, 13, 15, 17, 19];
    const secondTypes = ['rook', 'bishop', 'queen', 'rook', 'bishop', 'rook', 'queen', 'rook', 'bishop', 'queen'];
    for (let i = 0; i < 10; i++) {
        board[rank2][secondCols[i]] = { color: colorName, type: secondTypes[i] };
    }

    const thirdCols = [5, 9, 10, 14, 18];
    const thirdTypes = ['rook', 'queen', 'rook', 'bishop', 'queen'];
    for (let i = 0; i < 5; i++) {
        board[rank3][thirdCols[i]] = { color: colorName, type: thirdTypes[i] };
    }

    for (let c = 0; c < cols; c++) {
        board[rank4][c] = { color: colorName, type: 'pawn' };
    }
}

placePieces(setup, true);
placePieces(setup, false);

function inBounds(r, c) { return r >= 0 && r < rows && c >= 0 && c < cols; }
function copyBoard(board) { return board.map(row => row.map(piece => piece ? { ...piece } : null)); }

function getLegalMovesForPiece(row, col, boardState) {
    const pieceObj = boardState[row][col];
    if (!pieceObj) return [];
    const moves = [];
    const color = pieceObj.color;
    const opponent = (color === 'white') ? 'black' : 'white';

    function slide(dR, dC) {
        let r = row, c = col;
        while (true) {
            r += dR; c += dC;
            if (!inBounds(r, c)) break;
            if (!boardState[r][c]) {
                moves.push({ row: r, col: c });
            } else {
                if (boardState[r][c].color === opponent) {
                    moves.push({ row: r, col: c });
                }
                break;
            }
        }
    }

    switch (pieceObj.type) {
        case 'king':
            for (let dR = -1; dR <= 1; dR++) {
                for (let dC = -1; dC <= 1; dC++) {
                    if (dR === 0 && dC === 0) continue;
                    const rr = row + dR, cc = col + dC;
                    if (inBounds(rr, cc)) {
                        const occupant = boardState[rr][cc];
                        if (!occupant || occupant.color === opponent) moves.push({ row: rr, col: cc });
                    }
                }
            }
            break;
        case 'queen':
            slide(-1, 0); slide(1, 0); slide(0, -1); slide(0, 1);
            slide(-1, -1); slide(-1, 1); slide(1, -1); slide(1, 1);
            break;
        case 'rook':
            slide(-1, 0); slide(1, 0); slide(0, -1); slide(0, 1);
            break;
        case 'bishop':
            slide(-1, -1); slide(-1, 1); slide(1, -1); slide(1, 1);
            break;
        case 'knight': {
            const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
            for (const [dr, dc] of offsets) {
                const rr = row + dr, cc = col + dc;
                if (inBounds(rr, cc)) {
                    const occ = boardState[rr][cc];
                    if (!occ || occ.color === opponent) moves.push({ row: rr, col: cc });
                }
            }
            break;
        }
        case 'pawn': {
            const forward = (color === 'white') ? -1 : 1;
            const startRow = (color === 'white') ? 11 : 3; 
            const oneStep = row + forward;
            if (inBounds(oneStep, col) && !boardState[oneStep][col]) {
                moves.push({ row: oneStep, col });
                const twoStep = row + 2 * forward;
                if (row === startRow && inBounds(twoStep, col) && !boardState[twoStep][col]) {
                    moves.push({ row: twoStep, col });
                }
            }
            for (const dC of [-1, 1]) {
                const rr = row + forward, cc = col + dC;
                if (inBounds(rr, cc) && boardState[rr][cc] && boardState[rr][cc].color === opponent) {
                    moves.push({ row: rr, col: cc });
                }
            }
            break;
        }
    }
    return moves;
}

function maybePromotePawn(board, row, col) {
    const piece = board[row][col];
    if (!piece) return;
    if (piece.type === 'pawn') {
        if ((piece.color === 'white' && row === 0) || (piece.color === 'black' && row === rows - 1)) {
            piece.type = 'queen';
        }
    }
}

function isInCheck(board, color) {
    let kingPos = null;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const p = board[r][c];
            if (p && p.type === 'king' && p.color === color) {
                kingPos = { row: r, col: c }; break;
            }
        }
        if (kingPos) break;
    }
    if (!kingPos) return false;

    const opp = (color === 'white') ? 'black' : 'white';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const p = board[r][c];
            if (p && p.color === opp) {
                const moves = getLegalMovesForPiece(r, c, board);
                if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) return true;
            }
        }
    }
    return false;
}

function getLegalMovesWithCheck(row, col, board) {
    const piece = board[row][col];
    if (!piece) return [];
    const myColor = piece.color;
    const pseudo = getLegalMovesForPiece(row, col, board);
    return pseudo.filter(m => {
        const newB = copyBoard(board);
        newB[m.row][m.col] = newB[row][col];
        newB[row][col] = null;
        maybePromotePawn(newB, m.row, m.col);
        return !isInCheck(newB, myColor);
    });
}

// Test White Pawn at 11, 0
const moves = getLegalMovesWithCheck(11, 0, setup);
console.log("Moves for White Pawn at 11,0:", moves);

// Test White King at 14, 10
const kingMoves = getLegalMovesWithCheck(14, 10, setup);
console.log("Moves for White King at 14,10:", kingMoves);

// Check if White is in check
console.log("Is White in check?", isInCheck(setup, 'white'));
