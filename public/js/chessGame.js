const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const getPieceUnicode = (square) => {
  const unicodeMap = {
    pw: "♙",
    pb: "♟",
    rw: "♖",
    rb: "♜",
    nw: "♘",
    nb: "♞",
    bw: "♗",
    bb: "♝",
    qw: "♕",
    qb: "♛",
    kw: "♔",
    kb: "♚",
  };
  return unicodeMap[square.type + square.color] || "";
};

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareEl = document.createElement("div");
      squareEl.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );
      squareEl.dataset.row = rowIndex;
      squareEl.dataset.col = squareIndex;

      if (square) {
        const pieceEl = document.createElement("div");
        pieceEl.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceEl.innerText = getPieceUnicode(square);
        const isDraggable = playerRole === square.color;
        pieceEl.draggable = isDraggable;

        if (isDraggable) {
          pieceEl.addEventListener("dragstart", (e) => {
            draggedPiece = pieceEl;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
          });

          pieceEl.addEventListener("dragend", () => {
            draggedPiece = null;
            sourceSquare = null;
          });
        }

        squareEl.appendChild(pieceEl);
      }

      squareEl.addEventListener("dragover", (e) => e.preventDefault());
      squareEl.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!draggedPiece || !sourceSquare) return;
        const targetSquare = {
          row: parseInt(squareEl.dataset.row),
          col: parseInt(squareEl.dataset.col),
        };
        handleMove(sourceSquare, targetSquare);
      });

      boardElement.appendChild(squareEl);
    });
  });

  // Flip board for black
  boardElement.classList.toggle("flipped", playerRole === "b");
};

const handleMove = (source, target) => {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const from = files[source.col] + (8 - source.row);
  const to = files[target.col] + (8 - target.row);
  const piece = chess.get(from);
  const isPromotion = piece?.type === "p" && (to[1] === "1" || to[1] === "8");

  const move = { from, to };
  if (isPromotion) move.promotion = "q";

  const result = chess.move(move);
  if (result) {
    socket.emit("move", move);
    renderBoard();
  } else {
    console.log("Invalid move");
  }
};

socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (fen) => {
  chess.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  chess.move(move);
  renderBoard();
});

socket.on("gameOver", (msg) => {
  alert(msg);
});

renderBoard();
