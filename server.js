const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let gameState = {
    currentNum: 1,
    revealedCount: 0,
    players: {},
    // 選択肢8個
    choices: ["選択肢1", "選択肢2", "選択肢3", "選択肢4", "選択肢5", "選択肢6", "選択肢7", "選択肢8"]
};

io.on('connection', (socket) => {
    // 接続時に現在の状態を送信
    socket.emit('update', gameState);

    // --- ここに socket.on を入れる ---
    socket.on('submit', (data) => {
        // 二重送信防止
        if (gameState.players[socket.id]) return;

        gameState.players[socket.id] = { 
            name: data.name, 
            cards: data.cards, 
            isCorrect: null 
        };
        io.emit('update', gameState);
    });

    socket.on('admin-control', (action) => {
        if (action.type === 'next-step') {
            if (gameState.revealedCount < 8) gameState.revealedCount++;
        } else if (action.type === 'hide-all') {
            gameState.revealedCount = 0;
        } else if (action.type === 'next-quiz') {
            gameState.currentNum++;
            gameState.revealedCount = 0;
            gameState.players = {}; // プレイヤー回答をリセット
        } else if (action.type === 'judge') {
            if (gameState.players[action.id]) {
                gameState.players[action.id].isCorrect = action.result;
            }
        }
        io.emit('update', gameState);
    });
    // ------------------------------
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
