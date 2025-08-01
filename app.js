const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {};
let currentPlayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
  console.log("A user connected: " + socket.id);

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "W");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "B");
  } else {
    uniquesocket.emit(
      "spectatorRole",
      "The game is full. You are a spectator."
    );
  }

  uniquesocket.on("disconnect", function () {
    console.log("User disconnected: " + uniquesocket.id);
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniquesocket.id === players.white) return;
      if (chess.turn() === "b" && uniquesocket.id === players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("BoardState", chess.fen());
      } else {
        console.log("Invalid move attempted:", move);
        uniquesocket.emit("invalidMove", "Invalid move. Try again.");
      }
    } catch (error) {
      console.log(error);
      uniquesocket.emit(
        "error",
        "An error occurred while processing your move."
      );
    }
  });
});

server.listen(3000, function () {
  console.log("Server is running on http://localhost:3000");
});
